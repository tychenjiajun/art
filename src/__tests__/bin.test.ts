import { describe, it, expect, vi, beforeEach } from "vitest";
import { processImage } from "../bin.js";
import { generatePP3FromDng } from "../agent.js";
import { convertDngToJpegWithPP3 } from "../raw-therapee-wrap.js";
import fs from "node:fs";

// Mock dependencies
vi.mock("../src/agent.js");
vi.mock("../src/raw-therapee-wrap.js");
vi.mock("node:fs", () => ({
  default: {
    promises: {
      access: vi.fn(),
      readFile: vi.fn(),
      writeFile: vi.fn(),
      unlink: vi.fn(),
    },
    constants: {
      R_OK: 4,
      W_OK: 2,
    },
  },
}));

describe("bin.ts", () => {
  const mockPP3Content = "[Version]\nAppVersion=5.8\n[Exposure]\nAuto=true";

  beforeEach(() => {
    vi.clearAllMocks();
    // Default successful mocks
    vi.mocked(generatePP3FromDng).mockResolvedValue(mockPP3Content);
    vi.mocked(convertDngToJpegWithPP3).mockResolvedValue();
    vi.mocked(fs.promises.access).mockResolvedValue();
    vi.mocked(fs.promises.writeFile).mockResolvedValue();
    vi.mocked(fs.promises.unlink).mockResolvedValue();
  });

  it("accepts valid RAW file extensions", async () => {
    const validExtensions = [".dng", ".nef", ".cr2", ".arw"];
    for (const extension of validExtensions) {
      const result = await processImage(`input${extension}`);
      expect(result).toBeDefined();
    }
  });

  it("rejects invalid file extensions", async () => {
    await expect(processImage("input.jpg")).rejects.toThrow(
      "Unsupported file type: .jpg. Supported types: .dng, .nef, .cr2, .arw",
    );
  });

  it("handles default output paths", async () => {
    await processImage("input.dng");
    expect(generatePP3FromDng).toHaveBeenCalledWith(
      "input.dng",
      "openai",
      "gpt-4-vision-preview",
      expect.any(Object),
    );
    expect(convertDngToJpegWithPP3).toHaveBeenCalledWith(
      "input.dng",
      "input_processed.jpg",
      mockPP3Content,
    );
  });

  it("handles custom PP3 output path", async () => {
    await processImage("input.dng", { output: "custom.pp3", pp3Only: true });
    expect(fs.promises.writeFile).toHaveBeenCalledWith(
      "custom.pp3",
      mockPP3Content,
    );
  });

  it("handles custom JPEG output path", async () => {
    await processImage("input.dng", { output: "custom.jpg" });
    expect(convertDngToJpegWithPP3).toHaveBeenCalledWith(
      "input.dng",
      "custom.jpg",
      mockPP3Content,
    );
  });

  it("handles pp3Only mode", async () => {
    await processImage("input.dng", { pp3Only: true });
    expect(fs.promises.writeFile).toHaveBeenCalledWith(
      "input.pp3",
      mockPP3Content,
    );
    expect(convertDngToJpegWithPP3).not.toHaveBeenCalled();
  });

  it("rejects JPEG output with pp3Only", async () => {
    await expect(
      processImage("input.dng", { output: "output.jpg", pp3Only: true }),
    ).rejects.toThrow("Cannot specify JPEG output with --pp3-only flag");
  });

  it("validates PP3 content", async () => {
    vi.mocked(generatePP3FromDng).mockResolvedValueOnce("");
    await expect(processImage("input.dng")).rejects.toThrow(
      "Failed to generate PP3 content",
    );
  });

  it("handles missing input file", async () => {
    const error = new Error("Input file not found: input.dng");
    Object.assign(error, { code: "ENOENT" });
    vi.mocked(fs.promises.access).mockRejectedValueOnce(error);
    await expect(processImage("input.dng")).rejects.toThrow(
      "Input file not found: input.dng",
    );
  });

  it("handles permission errors", async () => {
    const error = new Error("Permission denied reading input file: input.dng");
    Object.assign(error, { code: "EACCES" });
    vi.mocked(fs.promises.access).mockRejectedValueOnce(error);
    await expect(processImage("input.dng")).rejects.toThrow(
      "Permission denied reading input file: input.dng",
    );
  });

  it("handles custom AI provider", async () => {
    await processImage("input.dng", { provider: "anthropic" });
    expect(generatePP3FromDng).toHaveBeenCalledWith(
      "input.dng",
      "anthropic",
      "claude-3-opus-20240229",
      expect.any(Object),
    );
  });

  it("handles custom model", async () => {
    await processImage("input.dng", { model: "custom-model" });
    expect(generatePP3FromDng).toHaveBeenCalledWith(
      "input.dng",
      "openai",
      "custom-model",
      expect.any(Object),
    );
  });

  it("handles verbose mode", async () => {
    const consoleSpy = vi.spyOn(console, "log");
    await processImage("input.dng", { verbose: true });
    expect(generatePP3FromDng).toHaveBeenCalledWith(
      "input.dng",
      "openai",
      "gpt-4-vision-preview",
      expect.objectContaining({ verbose: true }),
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("Processing"),
    );
  });

  it("handles keep-preview flag", async () => {
    await processImage("input.dng", { keepPreview: true });
    expect(generatePP3FromDng).toHaveBeenCalledWith(
      "input.dng",
      "openai",
      "gpt-4-vision-preview",
      expect.objectContaining({ keepPreview: true }),
    );
  });

  it("propagates PP3 generation errors", async () => {
    vi.mocked(generatePP3FromDng).mockRejectedValueOnce(
      new Error("Generation failed"),
    );
    await expect(processImage("input.dng")).rejects.toThrow(
      "Generation failed",
    );
  });

  it("propagates JPEG conversion errors", async () => {
    vi.mocked(convertDngToJpegWithPP3).mockRejectedValueOnce(
      new Error("Conversion failed"),
    );
    await expect(processImage("input.dng")).rejects.toThrow(
      "Conversion failed",
    );
  });

  it("handles write errors", async () => {
    vi.mocked(fs.promises.writeFile).mockRejectedValueOnce(
      new Error("Write failed"),
    );
    await expect(processImage("input.dng", { pp3Only: true })).rejects.toThrow(
      "Write failed",
    );
  });

  it("validates input path", async () => {
    await expect(processImage("")).rejects.toThrow(
      "Input path cannot be empty",
    );
  });

  it("handles cleanup errors gracefully", async () => {
    vi.mocked(fs.promises.unlink).mockRejectedValueOnce(
      new Error("Cleanup failed"),
    );
    const consoleSpy = vi.spyOn(console, "warn");
    await processImage("input.dng");
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("Could not clean up preview image"),
    );
  });
});
