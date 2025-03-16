import { execa } from "execa";
import os from "node:os";
import path from "node:path";
import fs from "node:fs";

const SUPPORTED_RAW_EXTENSIONS = [".dng", ".nef", ".cr2", ".arw"];

/**
 * Convert a DNG file to JPEG with specified quality and subsampling settings.
 * @param input Path to input DNG file
 * @param output Path to output JPEG file
 * @param quality JPEG quality (0-100)
 * @param subsampling JPEG chroma subsampling (1-3)
 */
export async function convertDngToJpeg({
  input,
  output,
  quality = 90,
  subsampling = 3,
}: {
  input: string;
  output: string;
  quality?: number;
  subsampling?: number;
}): Promise<void> {
  // Validate input file extension
  const extension = input.toLowerCase().slice(input.lastIndexOf("."));
  if (!SUPPORTED_RAW_EXTENSIONS.includes(extension)) {
    throw new Error(
      `Unsupported file type: ${extension}. Supported types: ${SUPPORTED_RAW_EXTENSIONS.join(", ")}`,
    );
  }

  // Validate quality parameter
  if (quality < 0 || quality > 100) {
    throw new Error("Quality must be between 0 and 100");
  }

  // Validate subsampling parameter
  if (subsampling < 1 || subsampling > 3) {
    throw new Error("Subsampling must be between 1 and 3");
  }

  // Validate output directory exists and is writable
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

  try {
    const cliArguments = [
      ...(os.platform() === "win32" ? ["-w"] : []), // Windows-specific flag
      "-Y", // Overwrite output
      "-o",
      output,
      `-j${quality.toString()}`,
      `-js${subsampling.toString()}`,
      "-c",
      input,
    ];
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
export async function convertDngToJpegWithPP3({
  input,
  output,
  pp3Path,
}: {
  input: string;
  output: string;
  pp3Path: string;
}): Promise<void> {
  if (!pp3Path) {
    throw new Error("PP3 profile path is required");
  }

  // Validate input file extension
  const extension = input.toLowerCase().slice(input.lastIndexOf("."));
  if (!SUPPORTED_RAW_EXTENSIONS.includes(extension)) {
    throw new Error(
      `Unsupported file type: ${extension}. Supported types: ${SUPPORTED_RAW_EXTENSIONS.join(", ")}`,
    );
  }

  // Validate output directory exists and is writable
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

  try {
    // Always use maximum quality for PP3-based conversion
    const cliArguments = [
      ...(os.platform() === "win32" ? ["-w"] : []), // Windows-specific flag
      "-Y", // Overwrite output
      "-o",
      output,
      "-j100",
      "-js3",
      "-p",
      pp3Path,
      "-c",
      input,
    ];
    await execa("rawtherapee-cli", cliArguments);
  } catch (error) {
    throw new Error(
      `Conversion failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}
