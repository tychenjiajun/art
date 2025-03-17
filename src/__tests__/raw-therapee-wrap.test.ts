import { describe, it, expect, vi, beforeEach } from "vitest";
import { execa } from "execa";
import {
  convertDngToJpeg,
  convertDngToJpegWithPP3,
} from "../raw-therapee-wrap.js";

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
    await convertDngToJpeg({
      input: "input.dng",
      output: "out.jpg",
      quality: 85,
      subsampling: 3,
    });

    expect(mockExeca).toHaveBeenCalledWith("rawtherapee-cli", [
      "-Y",
      "-o",
      "out.jpg",
      "-j85",
      "-js3",
      "-c",
      "input.dng",
    ]);
  });

  it("uses quality parameter for basic DNG to JPEG conversion", async () => {
    await convertDngToJpeg({
      input: "input.dng",
      output: "out.jpg",
      quality: 85,
      subsampling: 3,
    });

    expect(mockExeca).toHaveBeenCalledWith("rawtherapee-cli", [
      "-Y",
      "-o",
      "out.jpg",
      "-j85",
      "-js3",
      "-c",
      "input.dng",
    ]);
  });

  it("enforces maximum quality for PP3-based conversion", async () => {
    await convertDngToJpegWithPP3({
      input: "input.dng",
      output: "high.jpg",
      pp3Path: "profile.pp3",
    });

    expect(mockExeca).toHaveBeenCalledWith("rawtherapee-cli", [
      "-Y",
      "-o",
      "high.jpg",
      "-j100",
      "-js3",
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
      convertDngToJpeg({
        input: "input.dng",
        output: "output.jpg",
        quality: 90,
        subsampling: 3,
      }),
    ).rejects.toThrow("Conversion failed: Process failed");
  });

  it("throws error when PP3 profile is missing", async () => {
    await expect(
      convertDngToJpegWithPP3({
        input: "input.dng",
        output: "output.jpg",
        pp3Path: "",
      }),
    ).rejects.toThrow("PP3 profile path is required");
  });

  it("validates supported file extensions", async () => {
    await expect(
      convertDngToJpeg({
        input: "input.txt",
        output: "output.jpg",
        quality: 90,
        subsampling: 3,
      }),
    ).rejects.toThrow("Unsupported file type: .txt");
  });

  it("handles invalid quality values", async () => {
    await expect(
      convertDngToJpeg({
        input: "input.dng",
        output: "output.jpg",
        quality: 101,
        subsampling: 3,
      }),
    ).rejects.toThrow("Quality must be between 0 and 100");
    await expect(
      convertDngToJpeg({
        input: "input.dng",
        output: "output.jpg",
        quality: -1,
        subsampling: 3,
      }),
    ).rejects.toThrow("Quality must be between 0 and 100");
  });

  it("handles invalid subsampling values", async () => {
    await expect(
      convertDngToJpeg({
        input: "input.dng",
        output: "output.jpg",
        quality: 90,
        subsampling: 0,
      }),
    ).rejects.toThrow("Subsampling must be between 1 and 3");
    await expect(
      convertDngToJpeg({
        input: "input.dng",
        output: "output.jpg",
        quality: 90,
        subsampling: 4,
      }),
    ).rejects.toThrow("Subsampling must be between 1 and 3");
  });
});
