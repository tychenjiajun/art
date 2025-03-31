// eslint-disable-next-line unicorn/import-style
import { basename, dirname, join } from "node:path";
import {
  convertDngToImage,
  convertDngToImageWithPP3,
} from "./raw-therapee-wrap.js";
import { generateText } from "ai";
import fs from "node:fs";
import { PREVIEW_SETTINGS } from "./constants.js";
import { validateFileAccess, handleFileError } from "./utils/validation.js";
import { handleProviderSetup } from "./utils/ai-provider.js";

import { PreviewImageParameters, P3GenerationParameters } from "./types.js";
import { parseSearchReplaceBlocks } from "./pp3-parser.js";
import { BASE_PROMPT } from "./prompts.js";

async function createPreviewImage({
  inputPath,
  previewPath,
  basePP3Path,
  quality,
  verbose,
}: PreviewImageParameters) {
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

export async function generatePP3FromRawImage({
  inputPath,
  basePP3Path,
  providerName = "openai",
  visionModel = "gpt-4-vision-preview",
  verbose = false,
  keepPreview = false,
  prompt = BASE_PROMPT,
  sections = [],
  previewQuality,
}: P3GenerationParameters): Promise<string> {
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

    basePP3Path = basePP3Path ?? previewPath + ".pp3";

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
    const searchReplaceBlocks = parseSearchReplaceBlocks(responseText);

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
        await fs.promises.unlink(previewPath + ".pp3");
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
