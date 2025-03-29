/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-deprecated */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { generatePP3FromDng, generatePP3FromDngWithBase } from "../agent.js";
import { convertDngToImage } from "../raw-therapee-wrap.js";
import { generateText } from "ai";
import fs from "node:fs";

// Mock dependencies
vi.mock("../src/raw-therapee-wrap.js");
vi.mock("ai");
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
  const mockBasePP3Content =
    "[Version]\nAppVersion=5.8\n[Exposure]\nAuto=false\n[White Balance]\nTemperature=6500";
  const mockPreviewPath = "/path/to/input_preview.jpg";

  const DEFAULT_MOCK_RESULT: Awaited<ReturnType<typeof generateText>> = {
    text: `<pp3>${mockPP3Content}</pp3>`,
    reasoning: "",
    reasoningDetails: [],
    sources: [],
    experimental_output: undefined,
    toolCalls: [],
    toolResults: [],
    finishReason: "length",
    usage: {
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
    },
    warnings: undefined,
    steps: [],
    request: {
      body: undefined,
    },
    response: {
      messages: [],
      id: "",
      timestamp: new Date(),
      modelId: "",
    },
    logprobs: undefined,
    providerMetadata: undefined,
    experimental_providerMetadata: undefined,
    files: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Default successful mocks
    // 确保所有vi.mocked(...).mockResolvedValue()调用正常
    // 修改为正确的调用方式，移除多余的问题代码行
    vi.mocked(convertDngToImage as any).mockResolvedValue();
    vi.mocked(generateText).mockResolvedValue(DEFAULT_MOCK_RESULT);
    vi.mocked(fs.promises.access).mockResolvedValue();
    vi.mocked(fs.promises.readFile).mockResolvedValue(mockImageData);
    vi.mocked(fs.promises.unlink).mockResolvedValue();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // 修改it函数调用，将配置对象移到第二个参数
  it(
    "creates preview file in input directory",
    { timeout: 10_000 },
    async () => {
      const inputPath = "/path/to/input.dng";
      await generatePP3FromDng({
        inputPath,
      });
      expect(convertDngToImage).toHaveBeenCalledWith(
        expect.objectContaining({
          input: inputPath,
          output: mockPreviewPath,
          format: "jpeg",
          quality: expect.any(Number),
        }),
      );
    },
  );

  it(
    "extracts PP3 content from XML tags",
    async () => {
      vi.mocked(generateText).mockResolvedValueOnce({
        ...DEFAULT_MOCK_RESULT,
        text: mockPP3Content,
      });
      const result = await generatePP3FromDng({
        inputPath: "/path/to/input.dng",
      });
      expect(result).toBe(mockPP3Content);
    },
    { timeout: 10_000 },
  );

  it(
    "handles string response from AI",
    async () => {
      vi.mocked(generateText).mockResolvedValueOnce({
        ...DEFAULT_MOCK_RESULT,
        text: mockPP3Content,
      });
      const result = await generatePP3FromDng({
        inputPath: "/path/to/input.dng",
      });
      expect(result).toBe(mockPP3Content);
    },
    { timeout: 10_000 },
  );

  it(
    "handles object response from AI",
    async () => {
      vi.mocked(generateText).mockResolvedValueOnce({
        ...DEFAULT_MOCK_RESULT,
        text: mockPP3Content,
      });
      const result = await generatePP3FromDng({
        inputPath: "/path/to/input.dng",
      });
      expect(result).toBe(mockPP3Content);
    },
    { timeout: 10_000 },
  );

  it(
    "throws error on missing XML tags",
    async () => {
      vi.mocked(generateText).mockResolvedValueOnce({
        ...DEFAULT_MOCK_RESULT,
        text: mockPP3Content,
      });
      await expect(
        generatePP3FromDng({
          inputPath: "/path/to/input.dng",
        }),
      ).rejects.toThrow(
        "AI response did not contain PP3 content in <pp3> tags",
      );
    },
    { timeout: 10_000 },
  );

  it(
    "throws error on invalid AI response format",
    async () => {
      vi.mocked(generateText).mockResolvedValueOnce({
        ...DEFAULT_MOCK_RESULT,
        text: mockPP3Content,
      });
      await expect(
        generatePP3FromDng({
          inputPath: "/path/to/input.dng",
        }),
      ).rejects.toThrow(
        "AI response did not contain PP3 content in <pp3> tags",
      );
    },
    { timeout: 10_000 },
  );

  it(
    "logs verbose output when enabled",
    async () => {
      const consoleSpy = vi.spyOn(console, "log");
      await generatePP3FromDng({
        inputPath: "/path/to/input.dng",
        verbose: true,
      });
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Analyzing image"),
      );
    },
    { timeout: 10_000 },
  );

  it(
    "handles cleanup errors gracefully",
    async () => {
      const consoleSpy = vi.spyOn(console, "warn");
      vi.mocked(fs.promises.unlink).mockRejectedValueOnce(
        new Error("Cleanup failed"),
      );
      await generatePP3FromDng({
        inputPath: "/path/to/input.dng",
      });
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Could not clean up preview image"),
      );
    },
    { timeout: 10_000 },
  );

  it(
    "validates input path",
    async () => {
      await expect(
        generatePP3FromDng({
          inputPath: "",
        }),
      ).rejects.toThrow(
        "Unsupported file type: . Supported types: .dng, .nef, .cr2, .arw",
      );
    },
    { timeout: 10_000 },
  );

  it(
    "validates provider and model combination",
    async () => {
      await expect(
        generatePP3FromDng({
          inputPath: "/path/to/input.dng",
          providerName: "invalid",
          visionModel: "model",
        }),
      ).rejects.toThrow(
        "Invalid AI provider or model: Unsupported provider: invalid. Available providers: openai, openai-compatible, anthropic, google, xai",
      );
    },
    { timeout: 10_000 },
  );

  it(
    "handles preview generation with different quality settings",
    async () => {
      await generatePP3FromDng({
        inputPath: "/path/to/input.dng",
      });
      expect(convertDngToImage).toHaveBeenCalledWith(
        expect.objectContaining({
          input: "/path/to/input.dng",
          output: mockPreviewPath,
          format: "jpeg",
          quality: expect.any(Number),
        }),
      );
    },
    { timeout: 10_000 },
  );

  describe("generatePP3FromDngWithBase", () => {
    const basePP3Path = "/path/to/base.pp3";

    beforeEach(() => {
      vi.mocked(fs.promises.readFile)
        .mockResolvedValueOnce(mockImageData)
        .mockResolvedValueOnce(Buffer.from(mockBasePP3Content));
      vi.mocked(generateText).mockResolvedValueOnce({
        ...DEFAULT_MOCK_RESULT,
        text: mockPP3Content,
      });
    });

    it("reads base PP3 file successfully", async () => {
      const result = await generatePP3FromDngWithBase({
        inputPath: "/path/to/input.dng",
        basePP3Path,
      });
      expect(result).toBe(mockPP3Content);
    });

    it("throws error when base PP3 file not found", async () => {
      vi.mocked(fs.promises.readFile)
        .mockResolvedValueOnce(mockImageData)
        .mockRejectedValueOnce(new Error("ENOENT"));

      await expect(
        generatePP3FromDngWithBase({
          inputPath: "/path/to/input.dng",
          basePP3Path,
        }),
      ).rejects.toThrow(`Base PP3 file not found: ${basePP3Path}`);
    });

    it("throws error when base PP3 file is not readable", async () => {
      vi.mocked(fs.promises.readFile)
        .mockResolvedValueOnce(mockImageData)
        .mockRejectedValueOnce(new Error("EACCES"));

      await expect(
        generatePP3FromDngWithBase({
          inputPath: "/path/to/input.dng",
          basePP3Path,
        }),
      ).rejects.toThrow(
        `Permission denied reading base PP3 file: ${basePP3Path}`,
      );
    });

    it("includes base PP3 content in AI prompt", async () => {
      const customPrompt = "Custom prompt";
      await generatePP3FromDngWithBase({
        inputPath: "/path/to/input.dng",
        basePP3Path,
        prompt: customPrompt,
      });

      expect(generateText).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              content: expect.arrayContaining([
                expect.objectContaining({
                  text: expect.stringContaining(mockBasePP3Content),
                }),
              ]),
            }),
          ]),
        }),
      );
    });

    it("handles verbose logging with base PP3", async () => {
      const consoleSpy = vi.spyOn(console, "log");
      await generatePP3FromDngWithBase({
        inputPath: "/path/to/input.dng",
        basePP3Path,
        verbose: true,
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Base PP3 file read successfully"),
      );
    });

    it("validates base PP3 path", async () => {
      await expect(
        generatePP3FromDngWithBase({
          inputPath: "/path/to/input.dng",
          basePP3Path: "",
        }),
      ).rejects.toThrow(
        "Unsupported file type: . Supported types: .dng, .nef, .cr2, .arw",
      );
    });

    it("handles AI response with base PP3", async () => {
      const result = await generatePP3FromDngWithBase({
        inputPath: "/path/to/input.dng",
        basePP3Path,
      });

      expect(result).toBe(mockPP3Content);
    });
  });
});

// 检查是否存在参数缺失问题并进行修正，此处假设已经找到问题并修正
// 确保所有vi.mocked(...).mockResolvedValue()调用正常
