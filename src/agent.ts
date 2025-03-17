import { XMLParser } from "fast-xml-parser";
// eslint-disable-next-line unicorn/import-style
import { basename, dirname, join } from "node:path";
import {
  convertDngToJpeg,
  convertDngToJpegWithPP3,
} from "./raw-therapee-wrap.js";
import { generateText } from "ai";
import { provider } from "./provider.js";
import fs from "node:fs";
import { BASE_PROMPT, DEFAULT_PROMPT } from "./prompts.js";
import {
  SUPPORTED_RAW_EXTENSIONS,
  PREVIEW_SETTINGS,
  XML_PARSER_OPTIONS,
} from "./constants.js";
import { isPlainObject } from "@sindresorhus/is";

export async function generatePP3FromDngWithBase({
  inputPath,
  basePP3Path,
  providerName = "openai",
  visionModel = "gpt-4-vision-preview",
  verbose = false,
  keepPreview = false,
  prompt = BASE_PROMPT,
}: {
  inputPath: string;
  basePP3Path: string;
  providerName?: string;
  visionModel?: string;
  verbose?: boolean;
  keepPreview?: boolean;
  prompt?: string;
}): Promise<string> {
  // Validate input file extension
  const extension = inputPath.toLowerCase().slice(inputPath.lastIndexOf("."));
  if (!SUPPORTED_RAW_EXTENSIONS.includes(extension)) {
    throw new Error(
      `Unsupported file type: ${extension}. Supported types: ${SUPPORTED_RAW_EXTENSIONS.join(", ")}`,
    );
  }

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
    try {
      await fs.promises.access(inputPath, fs.constants.R_OK);
    } catch (error: unknown) {
      if (error instanceof Error && "code" in error) {
        if (error.code === "ENOENT") {
          throw new Error(`Input file not found: ${inputPath}`);
        } else if (error.code === "EACCES") {
          throw new Error(`Permission denied reading input file: ${inputPath}`);
        }
      }
      throw new Error(
        `Error accessing input file: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }

    // Check if preview path is writable
    try {
      const previewDirectory = dirname(previewPath);
      await fs.promises.access(previewDirectory, fs.constants.W_OK);
    } catch (error: unknown) {
      if (error instanceof Error && "code" in error) {
        if (error.code === "ENOENT") {
          throw new Error(
            `Preview directory does not exist: ${dirname(previewPath)}`,
          );
        } else if (error.code === "EACCES") {
          throw new Error(
            `Permission denied writing to preview directory: ${dirname(previewPath)}`,
          );
        }
      }
      throw new Error(
        `Error accessing preview directory: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }

    // Create preview with specific quality settings
    if (verbose)
      console.log(
        `Generating preview with quality=${String(PREVIEW_SETTINGS.quality)}`,
      );
    try {
      await convertDngToJpegWithPP3({
        input: inputPath,
        output: previewPath,
        pp3Path: basePP3Path,
        quality: PREVIEW_SETTINGS.quality,
      });
      previewCreated = true;
      if (verbose) console.log(`Preview file created at ${previewPath}`);
    } catch (error: unknown) {
      if (error instanceof Error) {
        // RawTherapee errors are already properly formatted by raw-therapee-wrap
        throw error;
      }
      throw error;
    }

    // Read preview file
    let imageData: Buffer;
    try {
      imageData = await fs.promises.readFile(previewPath);
      if (verbose) console.log("Preview file read successfully");
    } catch (error: unknown) {
      if (error instanceof Error && "code" in error) {
        if (error.code === "ENOENT") {
          throw new Error(`Preview file not found: ${previewPath}`);
        } else if (error.code === "EACCES") {
          throw new Error(
            `Permission denied reading preview file: ${previewPath}`,
          );
        }
      }
      throw new Error(
        `Error reading preview file: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }

    // Read base PP3
    let basePP3Content: string;
    try {
      basePP3Content = await fs.promises.readFile(basePP3Path, "utf8");
      if (verbose)
        console.log(`Base PP3 file read successfully from ${basePP3Path}`);
    } catch (error: unknown) {
      if (error instanceof Error && "code" in error) {
        if (error.code === "ENOENT") {
          throw new Error(`Base PP3 file not found: ${basePP3Path}`);
        } else if (error.code === "EACCES") {
          throw new Error(
            `Permission denied reading base PP3 file: ${basePP3Path}`,
          );
        }
      }
      throw new Error(
        `Error reading base PP3 file: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }

    // Get provider instance
    let aiProvider;
    try {
      aiProvider = provider(providerName)(visionModel);
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
                text: `${prompt}\n\n${basePP3Content}`,
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

    if (verbose) console.log("Received response from AI provider");

    // parse search/replace blocks
    // 解析搜索/替换块
    const searchReplaceBlocks = responseText.match(
      /<<<<<<< SEARCH\n([\s\S]*?)=======\n([\s\S]*?)>>>>>>> REPLACE/g,
    );

    if (!searchReplaceBlocks || searchReplaceBlocks.length === 0) {
      if (verbose) console.log("未找到有效的搜索/替换块", responseText);
      throw new Error("未找到有效的搜索/替换块");
    }

    // 读取基础 pp3 文件
    let pp3Content = await fs.promises.readFile(basePP3Path, "utf8");

    // 应用每个搜索/替换块
    for (const block of searchReplaceBlocks) {
      const [, search, replace] =
        /<<<<<<< SEARCH\n([\s\S]*?)=======\n([\s\S]*?)>>>>>>> REPLACE/.exec(
          block,
        ) ?? [];

      if (!search || !replace) {
        throw new Error("搜索/替换块格式无效");
      }

      pp3Content = pp3Content.replace(search.trim(), replace.trim());
    }

    return pp3Content;
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
}: {
  inputPath: string;
  providerName?: string;
  visionModel?: string;
  verbose?: boolean;
  keepPreview?: boolean;
  prompt?: string;
}): Promise<string> {
  // Validate input file extension
  const extension = inputPath.toLowerCase().slice(inputPath.lastIndexOf("."));
  if (!SUPPORTED_RAW_EXTENSIONS.includes(extension)) {
    throw new Error(
      `Unsupported file type: ${extension}. Supported types: ${SUPPORTED_RAW_EXTENSIONS.join(", ")}`,
    );
  }

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
    try {
      await fs.promises.access(inputPath, fs.constants.R_OK);
    } catch (error: unknown) {
      if (error instanceof Error && "code" in error) {
        if (error.code === "ENOENT") {
          throw new Error(`Input file not found: ${inputPath}`);
        } else if (error.code === "EACCES") {
          throw new Error(`Permission denied reading input file: ${inputPath}`);
        }
      }
      throw new Error(
        `Error accessing input file: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }

    // Check if preview path is writable
    try {
      const previewDirectory = dirname(previewPath);
      await fs.promises.access(previewDirectory, fs.constants.W_OK);
    } catch (error: unknown) {
      if (error instanceof Error && "code" in error) {
        if (error.code === "ENOENT") {
          throw new Error(
            `Preview directory does not exist: ${dirname(previewPath)}`,
          );
        } else if (error.code === "EACCES") {
          throw new Error(
            `Permission denied writing to preview directory: ${dirname(previewPath)}`,
          );
        }
      }
      throw new Error(
        `Error accessing preview directory: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }

    // Create preview with specific quality settings
    if (verbose)
      console.log(
        `Generating preview with quality=${String(PREVIEW_SETTINGS.quality)}`,
      );
    try {
      await convertDngToJpeg({
        input: inputPath,
        output: previewPath,
        quality: PREVIEW_SETTINGS.quality,
      });
      previewCreated = true;
      if (verbose) console.log(`Preview file created at ${previewPath}`);
    } catch (error: unknown) {
      if (error instanceof Error) {
        // RawTherapee errors are already properly formatted by raw-therapee-wrap
        throw error;
      }
      throw error;
    }

    // Read preview file
    let imageData: Buffer;
    try {
      imageData = await fs.promises.readFile(previewPath);
      if (verbose) console.log("Preview file read successfully");
    } catch (error: unknown) {
      if (error instanceof Error && "code" in error) {
        if (error.code === "ENOENT") {
          throw new Error(`Preview file not found: ${previewPath}`);
        } else if (error.code === "EACCES") {
          throw new Error(
            `Permission denied reading preview file: ${previewPath}`,
          );
        }
      }
      throw new Error(
        `Error reading preview file: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }

    // Get provider instance
    let aiProvider;
    try {
      aiProvider = provider(providerName)(visionModel);
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

    if (verbose) console.log("Received response from AI provider");

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
