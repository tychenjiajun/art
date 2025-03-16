#!/usr/bin/env node

import { Command } from "commander";
import { convertDngToJpegWithPP3 } from "./raw-therapee-wrap.js";
import { generatePP3FromDng } from "./agent.js";
import path from "node:path";
import fs from "node:fs";
import packageJson from "../package.json" with { type: "json" };

const SUPPORTED_EXTENSIONS = [".dng", ".nef", ".cr2", ".arw"];

interface ProcessImageOptions {
  output?: string;
  pp3Only?: boolean;
  provider?: string;
  model?: string;
  verbose?: boolean;
  keepPreview?: boolean;
  quality?: number;
  prompt?: string;
}

export async function processImage(
  inputPath: string,
  options: ProcessImageOptions = {},
) {
  if (!inputPath) {
    throw new Error("Input path cannot be empty");
  }

  const extension = path.extname(inputPath).toLowerCase();
  if (!SUPPORTED_EXTENSIONS.includes(extension)) {
    throw new Error(
      `Unsupported file type: ${extension}. Supported types: ${SUPPORTED_EXTENSIONS.join(", ")}`,
    );
  }

  // Validate input file exists and is readable
  try {
    await fs.promises.access(inputPath, fs.constants.R_OK);
  } catch (error: unknown) {
    if (error instanceof Error && "code" in error) {
      if (error.code === "ENOENT") {
        throw new Error(`Input file not found: ${inputPath}`);
      } else if (error.code === "EACCES") {
        throw new Error(`Permission denied reading input file: ${inputPath}`);
      }
      throw error;
    }
  }

  // Generate PP3 content
  const pp3Content = await generatePP3FromDng({
    inputPath,
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    providerName: options.provider || "openai",
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    visionModel: options.model || "gpt-4-vision-preview",
    verbose: options.verbose,
    keepPreview: options.keepPreview,
    prompt: options.prompt,
  });

  if (!pp3Content) {
    throw new Error("Failed to generate PP3 content");
  }

  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
  const pp3Path = options.output || inputPath.replace(/\.[^.]+$/, ".pp3");

  await fs.promises.writeFile(pp3Path, pp3Content);
  // Handle PP3-only mode
  if (options.pp3Only) {
    return;
  }

  // Process image with PP3
  const outputPath =
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    options.output || inputPath.replace(/\.[^.]+$/, "_processed.jpg");
  await convertDngToJpegWithPP3({
    input: inputPath,
    output: outputPath,
    pp3Path,
  });
}

// Create the CLI program
const program = new Command();

program
  .name("art")
  .description(
    "AI-driven RAW photo processor supporting DNG/NEF/CR2/ARW formats\nUses AI vision models to generate RawTherapee PP3 processing profiles\nProvides PP3 generation and batch processing options\nMulti-language documentation available in README",
  )
  .version(packageJson.version)
  .argument("<input>", "Input RAW file path")
  .option(
    "-o, --output <path>",
    "Output file path (defaults to input.pp3 or input_processed.jpg)",
  )
  .option("--pp3-only", "Only generate PP3 file without processing the image")
  .option("-p, --prompt <text>", "Prompt text for AI analysis")
  .option("--provider <n>", "AI provider to use", "openai")
  .option("--model <n>", "Model name to use", "gpt-4-vision-preview")
  .option("-v, --verbose", "Enable verbose logging")
  .option("-k, --keep-preview", "Keep the preview.jpg file after processing")
  .option("-q, --quality <n>", "Quality of the output image")
  .action(async (input: string, options: ProcessImageOptions) => {
    try {
      await processImage(input, options);
    } catch (error_) {
      const error =
        error_ instanceof Error ? error_ : new Error("Unknown error occurred");
      console.error("Error:", error.message);
      process.exit(1);
    }
  });
program.parse();
