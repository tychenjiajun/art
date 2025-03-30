import { XMLParser } from "fast-xml-parser";
// eslint-disable-next-line unicorn/import-style
import { basename, dirname, join } from "node:path";
import {
  convertDngToImage,
  convertDngToImageWithPP3,
} from "./raw-therapee-wrap.js";
import { generateText } from "ai";
import { provider } from "./provider.js";
import fs from "node:fs";
import { BASE_PROMPT, DEFAULT_PROMPT } from "./prompts.js";
import { PREVIEW_SETTINGS, XML_PARSER_OPTIONS } from "./constants.js";
import { isPlainObject } from "@sindresorhus/is";

async function validateFileAccess(filePath: string, mode: "read" | "write") {
  try {
    await fs.promises.access(
      filePath,
      mode === "read" ? fs.constants.R_OK : fs.constants.W_OK,
    );
  } catch (error: unknown) {
    if (error instanceof Error && "code" in error) {
      if (error.code === "ENOENT") {
        throw new Error(
          `${mode === "read" ? "File" : "Directory"} not found: ${filePath}`,
        );
      } else if (error.code === "EACCES") {
        throw new Error(
          `Permission denied ${mode === "read" ? "reading" : "writing"} ${filePath}`,
        );
      }
    }
    throw new Error(
      `Error accessing ${filePath}: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

async function createPreviewImage({
  inputPath,
  previewPath,
  basePP3Path,
  quality,
  verbose,
}: {
  inputPath: string;
  previewPath: string;
  basePP3Path?: string;
  quality: number;
  verbose?: boolean;
}) {
  try {
    await (basePP3Path
      ? convertDngToImageWithPP3({
          input: inputPath,
          output: previewPath,
          pp3Path: basePP3Path,
          format: "jpeg",
          quality,
        })
      : convertDngToImage({
          input: inputPath,
          output: previewPath,
          format: "jpeg",
          quality,
        }));
    if (verbose) console.log(`Preview file created at ${previewPath}`);
    return true;
  } catch (error: unknown) {
    if (error instanceof Error) throw error;
    throw new Error("Unknown error creating preview image");
  }
}

function handleFileError(
  error: unknown,
  filePath: string,
  operation: "read" | "write",
) {
  if (error instanceof Error && "code" in error) {
    if (error.code === "ENOENT") {
      throw new Error(`File not found during ${operation}: ${filePath}`);
    } else if (error.code === "EACCES") {
      throw new Error(`Permission denied ${operation}ing file: ${filePath}`);
    }
  }
  throw new Error(
    `Error ${operation}ing file ${filePath}: ${error instanceof Error ? error.message : "Unknown error"}`,
  );
}

function handleProviderSetup(providerName: string, visionModel: string) {
  try {
    return provider(providerName)(visionModel);
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message.includes("not supported")) {
        throw new Error(
          `Provider ${providerName} is not supported. Available providers: openai, openai-compatible, anthropic, google, xai`,
        );
      } else if (error.message.includes("model")) {
        throw new Error(
          `Model ${visionModel} is not supported by provider ${providerName}. Please check available models.`,
        );
      }
    }
    throw new Error(
      `Invalid AI provider or model: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

export async function generatePP3FromDngWithBase({
  inputPath,
  basePP3Path,
  providerName = "openai",
  visionModel = "gpt-4-vision-preview",
  verbose = false,
  keepPreview = false,
  prompt = BASE_PROMPT,
  sections = [
    "Exposure",
    "Retinex",
    "Local Contrast",
    "Wavlet",
    "Vibrance",
    "White Balance",
    "Color appearance",
    "Shadows & Highlights",
    "RGB Curves",
    "ColorToning",
    "ToneEqualizer",
    "Sharpening",
    "Defringing",
    "Dehaze",
    "Directional Pyramid Denoising",
  ],
  previewQuality,
}: {
  inputPath: string;
  basePP3Path: string;
  providerName?: string;
  visionModel?: string;
  verbose?: boolean;
  keepPreview?: boolean;
  prompt?: string;
  sections?: string[];
  previewQuality?: number;
}): Promise<string> {
  // Validate input file extension
  const extension = inputPath.toLowerCase().slice(inputPath.lastIndexOf("."));

  if (verbose)
    console.log(
      `Analyzing image ${inputPath} with ${providerName} model ${visionModel}`,
    );

  // Generate preview path in same directory as input file
  const previewPath = join(
    dirname(inputPath),
    `${basename(inputPath, extension)}_preview.jpg`,
  );

  let previewCreated = false;

  try {
    // Verify input file exists and is readable
    await validateFileAccess(inputPath, "read");

    // Check if preview path is writable
    await validateFileAccess(dirname(previewPath), "write");

    // Create preview with specific quality settings
    if (verbose)
      console.log(
        `Generating preview with quality=${String(PREVIEW_SETTINGS.quality)}`,
      );
    previewCreated = await createPreviewImage({
      inputPath,
      previewPath,
      basePP3Path,
      quality: previewQuality ?? PREVIEW_SETTINGS.quality,
      verbose,
    });

    // Read preview file
    let imageData: Buffer | undefined = undefined;
    try {
      imageData = await fs.promises.readFile(previewPath);
      if (verbose) console.log("Preview file read successfully");
    } catch (error: unknown) {
      handleFileError(error, previewPath, "read");
    }

    if (imageData == null) {
      throw new Error("Failed to read preview image data");
    }

    // Read base PP3
    let basePP3Content: string | undefined = undefined;
    try {
      basePP3Content = await fs.promises.readFile(basePP3Path, "utf8");
      if (verbose)
        console.log(`Base PP3 file read successfully from ${basePP3Path}`);
    } catch (error: unknown) {
      handleFileError(error, basePP3Path, "read");
    }

    const lines = basePP3Content?.split("\n") ?? [];

    const includedSections: string[] = [];
    const excludedSections: string[] = [];

    const sectionOrders: string[] = []; // 明确类型为 string[]

    let currentSection = "";
    let currentSectionName = "";

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith("[")) {
        if (currentSection) {
          if (sections.includes(currentSectionName)) {
            includedSections.push(currentSection);
          } else {
            excludedSections.push(currentSection);
          }
        }

        const sectionName = trimmedLine.slice(1, -1);
        currentSection = trimmedLine;
        currentSectionName = sectionName;
        sectionOrders.push(sectionName);
      } else {
        currentSection += `\n${trimmedLine}`;
      }
    }

    // 处理最后一个 section
    if (currentSection) {
      if (sections.includes(currentSectionName)) {
        includedSections.push(currentSection);
      } else {
        excludedSections.push(currentSection);
      }
    }

    const aiProvider = handleProviderSetup(providerName, visionModel);

    const toBeEdited = includedSections.join("\n");
    const extractedText = `${prompt}\n\n${toBeEdited}`;
    // Generate PP3 using AI
    if (verbose) console.log("Sending request to AI provider...");
    let response;
    try {
      response = await generateText({
        model: aiProvider,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: extractedText,
              },
              {
                type: "image",
                image: imageData,
              },
            ],
          },
        ],
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        // Handle common provider errors
        const errorMessage = error.message.toLowerCase();
        if (
          errorMessage.includes("api key") ||
          errorMessage.includes("authentication")
        ) {
          throw new Error(
            `AI provider authentication failed. Please check your API key for ${providerName}.`,
          );
        } else if (
          errorMessage.includes("quota") ||
          errorMessage.includes("rate limit")
        ) {
          throw new Error(
            `AI provider rate limit or quota exceeded for ${providerName}. Please try again later.`,
          );
        } else if (
          errorMessage.includes("model") ||
          errorMessage.includes("not found")
        ) {
          throw new Error(
            `Invalid model '${visionModel}' for provider ${providerName}. Please check available models.`,
          );
        } else if (
          errorMessage.includes("image") ||
          errorMessage.includes("file size")
        ) {
          throw new Error(
            `Image processing error: ${error.message}. Try reducing the image size or using a different format.`,
          );
        } else if (
          errorMessage.includes("timeout") ||
          errorMessage.includes("network")
        ) {
          throw new Error(
            `Network error while communicating with ${providerName}. Please check your connection and try again.`,
          );
        }
      }
      throw new Error(
        `AI provider error (${providerName}): ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }

    // Extract response text
    const responseText =
      typeof response === "string" ? response : response.text;

    if (!responseText) {
      throw new Error("AI response was empty or in an unexpected format");
    }

    if (verbose)
      console.log("Received response from AI provider:", responseText);

    // parse search/replace blocks
    // 解析搜索/替换块
    function parse_search_replace_blocks(
      text: string,
    ): { search: string; replace: string }[] {
      const blocks: { search: string; replace: string }[] = [];
      let current_block: { search: string[]; replace: string[] } = {
        search: [],
        replace: [],
      };

      let isInSearch = false;
      let isInReplace = false;

      // Split text into lines and iterate through them
      const lines = text.split("\n");
      for (const line of lines) {
        if (line.startsWith("<<<<<<< SEARCH")) {
          isInSearch = true;
          isInReplace = false;
          current_block = { search: [], replace: [] };
        } else if (line.startsWith("=======")) {
          isInSearch = false;
          isInReplace = true;
        } else if (line.startsWith(">>>>>>> REPLACE")) {
          isInSearch = false;
          isInReplace = false;
          blocks.push({
            search: current_block.search.join("\n"),
            replace: current_block.replace.join("\n"),
          });
        } else {
          if (isInSearch) {
            current_block.search.push(line);
          } else if (isInReplace) {
            current_block.replace.push(line);
          }
        }
      }

      return blocks;
    }
    const searchReplaceBlocks = parse_search_replace_blocks(responseText);

    if (searchReplaceBlocks.length === 0) {
      if (verbose) console.log("No valid search/replace blocks found");
      throw new Error("No valid search/replace blocks found");
    }

    // 读取基础 pp3 文件
    let pp3Content = toBeEdited;

    // 应用每个搜索/替换块
    for (const block of searchReplaceBlocks) {
      const { search, replace } = block;

      // Check if search or replace string is empty
      if (!search || !replace) {
        throw new Error("Invalid search/replace block format");
      }
      // Log the search and replace strings for debugging
      if (verbose) {
        console.log(`Searching for: ${search}`);
        console.log(`Replacing with: ${replace}`);
      }

      pp3Content = pp3Content.replace(search.trim(), replace.trim());
    }

    const editedLines = pp3Content.split("\n");

    const editedSections: string[] = [];

    currentSection = "";

    for (const line of editedLines) {
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith("[")) {
        if (currentSection !== "") {
          editedSections.push(currentSection);
          currentSection = "";
        }
        currentSection = line;
      } else {
        currentSection += `\n${line}`;
      }
    }

    // 处理最后一个 section
    if (currentSection) {
      editedSections.push(currentSection);
    }

    return sectionOrders
      .map((sectionName) => {
        return (
          editedSections.find((section) =>
            section.startsWith(`[${sectionName}]`),
          ) ??
          includedSections.find((section) =>
            section.startsWith(`[${sectionName}]`),
          ) ??
          excludedSections.find((section) =>
            section.startsWith(`[${sectionName}]`),
          ) ??
          ""
        );
      })
      .join("\n");
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (verbose) {
        console.error("Error during PP3 generation:");
        console.error(error.message);
        if (error.stack) console.error(error.stack);
      }
      throw error;
    }
    throw new Error(`Unknown error during PP3 generation: ${String(error)}`);
  } finally {
    // Clean up preview file in finally block unless keepPreview is true
    if (previewCreated && !keepPreview) {
      try {
        await fs.promises.unlink(previewPath);
        if (verbose) console.log("Preview file cleaned up");
      } catch (cleanupError: unknown) {
        if (
          cleanupError instanceof Error &&
          "code" in cleanupError &&
          verbose
        ) {
          if (cleanupError.code === "ENOENT") {
            console.warn("Preview file was already deleted");
          } else if (cleanupError.code === "EACCES") {
            console.warn(
              "Permission denied deleting preview file:",
              cleanupError.message,
            );
          } else {
            console.warn(
              "Failed to clean up preview file:",
              cleanupError.message,
            );
          }
        }
      }
    }
  }
}

export async function generatePP3FromDng({
  inputPath,
  providerName = "openai",
  visionModel = "gpt-4-vision-preview",
  verbose = false,
  keepPreview = false,
  prompt = DEFAULT_PROMPT,
  previewQuality,
}: {
  inputPath: string;
  providerName?: string;
  visionModel?: string;
  verbose?: boolean;
  keepPreview?: boolean;
  prompt?: string;
  previewQuality?: number;
}): Promise<string> {
  // Validate input file extension
  const extension = inputPath.toLowerCase().slice(inputPath.lastIndexOf("."));

  if (verbose)
    console.log(
      `Analyzing image ${inputPath} with ${providerName} model ${visionModel}`,
    );

  // Generate preview path in same directory as input file
  const previewPath = join(
    dirname(inputPath),
    `${basename(inputPath, extension)}_preview.jpg`,
  );

  let previewCreated = false;

  try {
    // Verify input file exists and is readable
    await validateFileAccess(inputPath, "read");

    // Check if preview path is writable
    await validateFileAccess(dirname(previewPath), "write");

    // Create preview with specific quality settings
    if (verbose)
      console.log(
        `Generating preview with quality=${String(PREVIEW_SETTINGS.quality)}`,
      );
    previewCreated = await createPreviewImage({
      inputPath,
      previewPath,
      quality: previewQuality ?? PREVIEW_SETTINGS.quality,
      verbose,
    });

    // Read preview file
    let imageData: Buffer | undefined;
    try {
      imageData = await fs.promises.readFile(previewPath);
      if (verbose) console.log("Preview file read successfully");
    } catch (error: unknown) {
      handleFileError(error, previewPath, "read");
    }

    if (imageData == null) {
      throw new Error("Failed to read preview image data");
    }

    const aiProvider = handleProviderSetup(providerName, visionModel);

    // Generate PP3 using AI
    if (verbose) console.log("Sending request to AI provider...");
    let response;
    try {
      response = await generateText({
        model: aiProvider,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: prompt,
              },
              {
                type: "image",
                image: imageData,
              },
            ],
          },
        ],
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        // Handle common provider errors
        const errorMessage = error.message.toLowerCase();
        if (
          errorMessage.includes("api key") ||
          errorMessage.includes("authentication")
        ) {
          throw new Error(
            `AI provider authentication failed. Please check your API key for ${providerName}.`,
          );
        } else if (
          errorMessage.includes("quota") ||
          errorMessage.includes("rate limit")
        ) {
          throw new Error(
            `AI provider rate limit or quota exceeded for ${providerName}. Please try again later.`,
          );
        } else if (
          errorMessage.includes("model") ||
          errorMessage.includes("not found")
        ) {
          throw new Error(
            `Invalid model '${visionModel}' for provider ${providerName}. Please check available models.`,
          );
        } else if (
          errorMessage.includes("image") ||
          errorMessage.includes("file size")
        ) {
          throw new Error(
            `Image processing error: ${error.message}. Try reducing the image size or using a different format.`,
          );
        } else if (
          errorMessage.includes("timeout") ||
          errorMessage.includes("network")
        ) {
          throw new Error(
            `Network error while communicating with ${providerName}. Please check your connection and try again.`,
          );
        }
      }
      throw new Error(
        `AI provider error (${providerName}): ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }

    // Extract response text
    const _responseText =
      typeof response === "string" ? response : response.text;
    const responseText = _responseText.includes("</pp3>")
      ? _responseText
      : _responseText.replaceAll("```pp3", "<pp3>").replaceAll("```", "</pp3>");

    if (!responseText) {
      throw new Error("AI response was empty or in an unexpected format");
    }

    if (verbose)
      console.log("Received response from AI provider:", responseText);

    // Parse XML to extract PP3 content
    const parser = new XMLParser(XML_PARSER_OPTIONS);
    let result: unknown;
    try {
      result = parser.parse(responseText);
    } catch (error: unknown) {
      throw new Error(
        `Failed to parse AI response as XML: ${error instanceof Error ? error.message : "Unknown error"}\n` +
          `Response preview: ${responseText}`,
      );
    }

    if (
      !isPlainObject(result) ||
      !("pp3" in result) ||
      !result.pp3 ||
      typeof result.pp3 !== "string"
    ) {
      throw new Error(
        `AI response did not contain PP3 content in <pp3> tags.\n` +
          `Response preview: ${responseText}`,
      );
    }

    if (verbose) console.log("Successfully generated PP3 profile");
    return result.pp3;
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (verbose) {
        console.error("Error during PP3 generation:");
        console.error(error.message);
        if (error.stack) console.error(error.stack);
      }
      throw error;
    }
    throw new Error(`Unknown error during PP3 generation: ${String(error)}`);
  } finally {
    // Clean up preview file in finally block unless keepPreview is true
    if (previewCreated && !keepPreview) {
      try {
        await fs.promises.unlink(previewPath);
        if (verbose) console.log("Preview file cleaned up");
      } catch (cleanupError: unknown) {
        if (
          cleanupError instanceof Error &&
          "code" in cleanupError &&
          verbose
        ) {
          if (cleanupError.code === "ENOENT") {
            console.warn("Preview file was already deleted");
          } else if (cleanupError.code === "EACCES") {
            console.warn(
              "Permission denied deleting preview file:",
              cleanupError.message,
            );
          } else {
            console.warn(
              "Failed to clean up preview file:",
              cleanupError.message,
            );
          }
        }
      }
    }
  }
}
