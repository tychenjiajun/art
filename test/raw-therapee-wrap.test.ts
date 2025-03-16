import { describe, it, expect, vi, beforeEach } from "vitest";
import { execa } from "execa";
import {
  convertDngToJpeg,
  convertDngToJpegWithPP3,
} from "../src/raw-therapee-wrap.js";

vi.mock("execa", () => ({
  execa: vi.fn(),
}));

describe("RawTherapeeCLI", () => {
  const mockExeca = vi.mocked(execa);

  beforeEach(() => {
    vi.resetAllMocks();
    mockExeca.mockResolvedValue({ stdout: "", stderr: "" } as any);
  });

  it("builds Windows silent mode parameters", async () => {
    await convertDngToJpeg("input.dng", "out.jpg", 85, 3);

    expect(mockExeca).toHaveBeenCalledWith("rawtherapee-cli", [
      "-Y",
      "-o",
      "out.jpg",
      "-j",
      "85",
      "-js",
      "3",
      "-c",
      "input.dng",
    ]);
  });

  it("uses quality parameter for basic DNG to JPEG conversion", async () => {
    await convertDngToJpeg("input.dng", "out.jpg", 85, 3);

    expect(mockExeca).toHaveBeenCalledWith("rawtherapee-cli", [
      "-Y",
      "-o",
      "out.jpg",
      "-j",
      "85",
      "-js",
      "3",
      "-c",
      "input.dng",
    ]);
  });

  it("enforces maximum quality for PP3-based conversion", async () => {
    await convertDngToJpegWithPP3("input.dng", "high.jpg", "profile.pp3");

    expect(mockExeca).toHaveBeenCalledWith("rawtherapee-cli", [
      "-Y",
      "-o",
      "high.jpg",
      "-j",
      "100",
      "-js",
      "1",
      "-p",
      "profile.pp3",
      "-c",
      "input.dng",
    ]);
  });

  it("captures process error messages", async () => {
    const mockError = new Error("Process failed");
    mockExeca.mockRejectedValue(mockError);

    await expect(
      convertDngToJpeg("input.dng", "output.jpg", 90, 3),
    ).rejects.toThrow("Conversion failed: Process failed");
  });

  it("throws error when PP3 profile is missing", async () => {
    await expect(
      convertDngToJpegWithPP3("input.dng", "output.jpg", ""),
    ).rejects.toThrow("PP3 profile path is required");
  });

  it("validates supported file extensions", async () => {
    await expect(
      convertDngToJpeg("input.txt", "output.jpg", 90, 3),
    ).rejects.toThrow("Unsupported file type: .txt");
  });

  it("handles invalid quality values", async () => {
    await expect(
      convertDngToJpeg("input.dng", "output.jpg", 101, 3),
    ).rejects.toThrow("Quality must be between 0 and 100");
    await expect(
      convertDngToJpeg("input.dng", "output.jpg", -1, 3),
    ).rejects.toThrow("Quality must be between 0 and 100");
  });

  it("handles invalid subsampling values", async () => {
    await expect(
      convertDngToJpeg("input.dng", "output.jpg", 90, 0),
    ).rejects.toThrow("Subsampling must be between 1 and 3");
    await expect(
      convertDngToJpeg("input.dng", "output.jpg", 90, 4),
    ).rejects.toThrow("Subsampling must be between 1 and 3");
  });
});
