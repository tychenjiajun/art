// Core type definitions for PP3 processing

export interface PreviewImageParameters {
  inputPath: string;
  previewPath: string;
  basePP3Path?: string;
  quality: number;
  verbose?: boolean;
}

export interface P3GenerationParameters {
  inputPath: string;
  basePP3Path?: string;
  providerName?: string;
  visionModel?: string;
  verbose?: boolean;
  keepPreview?: boolean;
  prompt?: string;
  sections?: string[];
  previewQuality?: number;
}

export interface SearchReplaceResult {
  original: string;
  modified: string;
  changes: number;
}

export interface PP3Section {
  name: string;
  content: string;
}
