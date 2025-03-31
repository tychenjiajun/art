import fs from "node:fs";

export async function validateFileAccess(
  filePath: string,
  mode: "read" | "write",
) {
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

export function handleFileError(
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
