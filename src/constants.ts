import { XMLParserOptions, PreviewSettings, OutputSettings } from "./types.js";

export const XML_PARSER_OPTIONS: XMLParserOptions = {
  ignoreAttributes: true,
  parseTagValue: false,
  trimValues: true,
  alwaysCreateTextNode: false,
};

export const PREVIEW_SETTINGS: PreviewSettings = {
  quality: 80,
};

export const OUTPUT_SETTINGS: OutputSettings = {
  quality: 100,
};
