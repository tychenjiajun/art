import { expect, it, vi, beforeEach, afterEach } from "vitest";
import * as rawTherapeeModule from "../raw-therapee-wrap.js";

// Create a mock version of the module
vi.mock("../raw-therapee-wrap.js", async () => {
  const actual = await vi.importActual("../raw-therapee-wrap.js");
  return {
    ...actual,
    // Override the validateOutputDirectory function to be a no-op
    validateOutputDirectory: vi.fn(),
  };
});

// Import the mocked functions
const { convertDngToImage, convertDngToImageWithPP3 } = rawTherapeeModule;

// Mock dependencies
vi.mock("execa", () => {
  return {
    execa: vi.fn(),
  };
});

vi.mock("node:fs", async () => {
  const actual = await vi.importActual("node:fs");
  return {
    ...actual,
    constants: { W_OK: 2 },
    promises: {
      access: vi.fn(),
    },
  };
});

vi.mock("node:os", async () => {
  const actual = await vi.importActual("node:os");
  return {
    ...actual,
    platform: vi.fn().mockReturnValue("linux"),
  };
});

// Import mocked modules
const fs = await import("node:fs");
const os = await import("node:os");

beforeEach(() => {
  vi.resetAllMocks();
  // Set default platform to Linux
  vi.mocked(os.platform).mockReturnValue("linux");

  // Mock fs.promises.access to prevent directory access errors
  vi.mocked(fs.promises.access).mockResolvedValue();
});

afterEach(() => {
  vi.resetAllMocks();
});

it("convertDngToImage should throw error when quality is out of range", async () => {
  const parameters = {
    input: "/path/to/input.dng",
    output: "/path/to/output.jpg",
    quality: 101, // Invalid quality
    format: "jpeg" as const,
  };

  await expect(convertDngToImage(parameters)).rejects.toThrow(
    "Quality must be between 0 and 100",
  );
});

it("convertDngToImage should throw error when subsampling is out of range", async () => {
  const parameters = {
    input: "/path/to/input.dng",
    output: "/path/to/output.jpg",
    subsampling: 4, // Invalid subsampling
    format: "jpeg" as const,
  };

  await expect(convertDngToImage(parameters)).rejects.toThrow(
    "Subsampling must be between 1 and 3",
  );
});

it("convertDngToImage should throw error when output directory does not exist", async () => {
  // Mock fs.promises.access to fail with ENOENT
  const error = new Error("Directory not found");
  // Add code property to error
  Object.defineProperty(error, "code", { value: "ENOENT" });
  vi.mocked(fs.promises.access).mockRejectedValue(error);

  const parameters = {
    input: "/path/to/input.dng",
    output: "/nonexistent/directory/output.jpg",
    format: "jpeg" as const,
  };

  await expect(convertDngToImage(parameters)).rejects.toThrow(
    /Output directory does not exist/,
  );
});

it("convertDngToImageWithPP3 should throw error when PP3 path is empty", async () => {
  const parameters = {
    input: "/path/to/input.dng",
    output: "/path/to/output.jpg",
    pp3Path: "",
    format: "jpeg" as const,
  };

  await expect(convertDngToImageWithPP3(parameters)).rejects.toThrow(
    "PP3 profile path is required",
  );
});
