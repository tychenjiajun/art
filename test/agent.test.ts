import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { generatePP3FromDng } from "../src/agent.js";
import { convertDngToJpeg } from "../src/raw-therapee-wrap.js";
import { getAIResponse } from "../src/ai-provider.js";
import fs from "node:fs";

// Mock dependencies
vi.mock("../src/raw-therapee-wrap.js");
vi.mock("../src/ai-provider.js");
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

describe("Agent", () => {
  const mockImageData = Buffer.from("test image data");
  const mockPP3Content = "[Version]\nAppVersion=5.8\n[Exposure]\nAuto=true";
  const mockPreviewPath = "/path/to/input_preview.jpg";

  beforeEach(() => {
    vi.clearAllMocks();
    // Default successful mocks
    vi.mocked(convertDngToJpeg).mockResolvedValue(undefined);
    vi.mocked(getAIResponse).mockResolvedValue(mockPP3Content);
    vi.mocked(fs.promises.access).mockResolvedValue(undefined);
    vi.mocked(fs.promises.readFile).mockResolvedValue(mockImageData);
    vi.mocked(fs.promises.unlink).mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it(
    "creates preview file in input directory",
    async () => {
      const inputPath = "/path/to/input.dng";
      await generatePP3FromDng(inputPath);
      expect(convertDngToJpeg).toHaveBeenCalledWith(
        inputPath,
        mockPreviewPath,
        { quality: 90, subsampling: 3 },
      );
    },
    { timeout: 10000 },
  );

  it(
    "extracts PP3 content from XML tags",
    async () => {
      const response = "<pp3>test content</pp3>";
      vi.mocked(getAIResponse).mockResolvedValueOnce(response);
      const result = await generatePP3FromDng("/path/to/input.dng");
      expect(result).toBe("test content");
    },
    { timeout: 10000 },
  );

  it(
    "handles string response from AI",
    async () => {
      const response = mockPP3Content;
      vi.mocked(getAIResponse).mockResolvedValueOnce(response);
      const result = await generatePP3FromDng("/path/to/input.dng");
      expect(result).toBe(mockPP3Content);
    },
    { timeout: 10000 },
  );

  it(
    "handles object response from AI",
    async () => {
      const response = { content: mockPP3Content };
      vi.mocked(getAIResponse).mockResolvedValueOnce(JSON.stringify(response));
      const result = await generatePP3FromDng("/path/to/input.dng");
      expect(result).toBe(mockPP3Content);
    },
    { timeout: 10000 },
  );

  it(
    "throws error on missing XML tags",
    async () => {
      const response = "invalid response";
      vi.mocked(getAIResponse).mockResolvedValueOnce(response);
      await expect(generatePP3FromDng("/path/to/input.dng")).rejects.toThrow(
        "Invalid PP3 content format",
      );
    },
    { timeout: 10000 },
  );

  it(
    "throws error on invalid AI response format",
    async () => {
      const response = '{"invalid": "json"';
      vi.mocked(getAIResponse).mockResolvedValueOnce(response);
      await expect(generatePP3FromDng("/path/to/input.dng")).rejects.toThrow(
        "Invalid PP3 content format",
      );
    },
    { timeout: 10000 },
  );

  it(
    "logs verbose output when enabled",
    async () => {
      const consoleSpy = vi.spyOn(console, "log");
      await generatePP3FromDng(
        "/path/to/input.dng",
        "openai",
        "gpt-4-vision-preview",
        { verbose: true },
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Analyzing image"),
      );
    },
    { timeout: 10000 },
  );

  it(
    "handles cleanup errors gracefully",
    async () => {
      const consoleSpy = vi.spyOn(console, "warn");
      vi.mocked(fs.promises.unlink).mockRejectedValueOnce(
        new Error("Cleanup failed"),
      );
      await generatePP3FromDng("/path/to/input.dng");
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Could not clean up preview image"),
      );
    },
    { timeout: 10000 },
  );

  it(
    "validates input path",
    async () => {
      await expect(generatePP3FromDng("")).rejects.toThrow(
        "Input path cannot be empty",
      );
    },
    { timeout: 10000 },
  );

  it(
    "validates provider and model combination",
    async () => {
      await expect(
        generatePP3FromDng("/path/to/input.dng", "invalid", "model"),
      ).rejects.toThrow("Unsupported provider: invalid");
    },
    { timeout: 10000 },
  );

  it(
    "handles preview generation with different quality settings",
    async () => {
      await generatePP3FromDng(
        "/path/to/input.dng",
        "openai",
        "gpt-4-vision-preview",
        { quality: 80 },
      );
      expect(convertDngToJpeg).toHaveBeenCalledWith(
        "/path/to/input.dng",
        mockPreviewPath,
        { quality: 80, subsampling: 3 },
      );
    },
    { timeout: 10000 },
  );
});
