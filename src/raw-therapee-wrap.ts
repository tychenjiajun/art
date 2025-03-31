import { execa } from "execa";
import os from "node:os";
import path from "node:path";
import fs from "node:fs";

/**
 * Convert a DNG file to JPEG with specified quality and subsampling settings.
 * @param input Path to input DNG file
 * @param output Path to output JPEG file
 * @param quality JPEG quality (0-100)
 * @param subsampling JPEG chroma subsampling (1-3)
 */
export async function convertDngToImage({
  input,
  output,
  quality = 90,
  subsampling = 3,
  format = "tiff",
  tiffCompression,
  bitDepth = 16,
}: {
  input: string;
  output: string;
  quality?: number;
  subsampling?: number;
  format?: "jpeg" | "tiff" | "png";
  tiffCompression?: "z" | "none";
  bitDepth?: 8 | 16;
}): Promise<void> {
  validateQualityAndSubsampling(quality, subsampling);
  await validateOutputDirectory(output);
  const cliArguments = buildCliArguments({
    output,
    format,
    quality,
    subsampling,
    tiffCompression,
    bitDepth,
    pp3Path: undefined,
    input,
  });
  try {
    await execa("rawtherapee-cli", cliArguments);
  } catch (error) {
    throw new Error(
      `Conversion failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/**
 * Convert a DNG file to JPEG using a PP3 profile.
 * Always uses maximum quality settings for profile-based conversion.
 * @param input Path to input DNG file
 * @param output Path to output JPEG file
 * @param pp3Path Path to PP3 profile
 */
export async function convertDngToImageWithPP3({
  input,
  output,
  pp3Path,
  quality = 100,
  subsampling = 3,
  format = "tiff",
  tiffCompression,
  bitDepth = 16,
}: {
  input: string;
  output: string;
  pp3Path: string;
  quality?: number;
  subsampling?: number;
  format?: "jpeg" | "tiff" | "png";
  tiffCompression?: "z" | "none";
  bitDepth?: 8 | 16;
}): Promise<void> {
  if (!pp3Path) {
    throw new Error("PP3 profile path is required");
  }
  validateQualityAndSubsampling(quality, subsampling);
  await validateOutputDirectory(output);
  const cliArguments = buildCliArguments({
    output,
    format,
    quality,
    subsampling,
    tiffCompression,
    bitDepth,
    pp3Path,
    input,
  });
  try {
    await execa("rawtherapee-cli", cliArguments);
  } catch (error) {
    throw new Error(
      `Conversion failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

function validateQualityAndSubsampling(quality: number, subsampling: number) {
  if (quality < 0 || quality > 100) {
    throw new Error("Quality must be between 0 and 100");
  }
  if (subsampling < 1 || subsampling > 3) {
    throw new Error("Subsampling must be between 1 and 3");
  }
}

async function validateOutputDirectory(output: string) {
  const outputDirectory = path.dirname(output);
  try {
    await fs.promises.access(outputDirectory, fs.constants.W_OK);
  } catch (error: unknown) {
    if (error instanceof Error && "code" in error) {
      if (error.code === "ENOENT") {
        throw new Error(`Output directory does not exist: ${outputDirectory}`);
      } else if (error.code === "EACCES") {
        throw new Error(
          `Permission denied writing to output directory: ${outputDirectory}`,
        );
      }
    }
    throw new Error(`Error accessing output directory: ${outputDirectory}`);
  }
}

function buildCliArguments({
  output,
  format,
  quality,
  subsampling,
  tiffCompression,
  bitDepth,
  pp3Path,
  input,
}: {
  output: string;
  format: string;
  quality: number;
  subsampling: number;
  tiffCompression: string | undefined;
  bitDepth: number;
  pp3Path?: string;
  input: string;
}) {
  const cliArguments = [
    ...(os.platform() === "win32" ? ["-w"] : []),
    "-Y",
    pp3Path ? "-o" : "-O",
    output,
  ];
  switch (format) {
    case "jpeg": {
      cliArguments.push(
        `-j${quality.toString()}`,
        `-js${subsampling.toString()}`,
      );
      break;
    }
    case "tiff": {
      cliArguments.push("-t");
      if (tiffCompression === "z") cliArguments.push("z");
      break;
    }
    case "png": {
      cliArguments.push("-n");
      break;
    }
  }
  if (pp3Path) {
    cliArguments.push(`-b${bitDepth.toString()}`, "-p", pp3Path, "-c", input);
  } else {
    cliArguments.push(`-b${bitDepth.toString()}`, "-c", input);
  }
  return cliArguments;
}
