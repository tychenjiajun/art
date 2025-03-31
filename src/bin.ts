#!/usr/bin/env node

import { Command } from "commander";
import { convertDngToImageWithPP3 } from "./raw-therapee-wrap.js";
import { generatePP3FromRawImage } from "./agent.js";
import fs from "node:fs";
import packageJson from "../package.json" with { type: "json" };

interface ProcessImageOptions {
  output?: string;
  pp3Only?: boolean;
  provider?: string;
  model?: string;
  verbose?: boolean;
  keepPreview?: boolean;
  quality?: number;
  prompt?: string;
  base?: string;
  sections?: string;
  tiff?: boolean;
  png?: boolean;
  compression?: "z" | "none";
  bitDepth?: 8 | 16;
  previewQuality?: number;
}

export async function processImage(
  inputPath: string,
  options: ProcessImageOptions = {},
) {
  if (!inputPath) {
    throw new Error("Input path cannot be empty");
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
  const pp3Content = await generatePP3FromRawImage({
    inputPath,
    basePP3Path: options.base,
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    providerName: options.provider || "openai",
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    visionModel: options.model || "gpt-4-vision-preview",
    verbose: options.verbose,
    keepPreview: options.keepPreview,
    prompt: options.prompt,
    sections: options.sections?.split(",").filter((s) => s.trim() !== ""),
    previewQuality: options.previewQuality,
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
  // eslint-disable-next-line unicorn/no-nested-ternary
  const format = options.png ? "png" : options.tiff ? "tiff" : "jpeg";
  const outputPath =
    options.output ?? inputPath.replace(/\.[^.]+$/, `_processed.${format}`);
  await convertDngToImageWithPP3({
    input: inputPath,
    output: outputPath,
    pp3Path,
    format,
    tiffCompression: options.compression,
    bitDepth: Number(options.bitDepth) as 8 | 16,
  });
}

// Create the CLI program
const program = new Command();

program
  .name("ai-pp3")
  .description(
    "AI-Powered PP3 Profile Generator for RawTherapee\nSpecializes in bulk generation and customization of PP3 development profiles\nKey features:\n- AI-driven analysis of RAW files (DNG/NEF/CR2/ARW)\n- Batch PP3 creation with consistent processing parameters\n- Customizable development settings through natural language prompts\n- Seamless integration with existing PP3 workflows\n- Multi-model support for different processing styles\n- Interactive preview generation with quality controls\nDocumentation available in README for advanced customization",
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
  .option("-q, --quality <n>", "Quality of the output image (JPEG only)")
  .option(
    "--preview-quality <n>",
    "JPEG quality for preview generation (1-100)",
    (value) => {
      const quality = Number.parseInt(value, 10);
      if (Number.isNaN(quality) || quality < 1 || quality > 100) {
        throw new Error("Preview quality must be between 1 and 100");
      }
      return quality;
    },
  )
  .option("--tiff", "Output as TIFF format")
  .option("--png", "Output as PNG format")
  .option("--compression <type>", "TIFF compression type (z/none)")
  .option("--bit-depth <n>", "Bit depth (8 or 16)", "16")
  .option(
    "--sections <names>",
    "Comma-separated list of PP3 sections to process",
    (value) => value.split(","),
  )
  .option("--base <path>", "Base PP3 file to improve upon")
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
