# AI-PP3 - AI-Powered RawTherapee Profile Generator

https://github.com/user-attachments/assets/95bf9e8d-0c97-442d-8068-a5d27e094f18

[![en](https://img.shields.io/badge/lang-en-red.svg)](README.md) [![zh-CN](https://img.shields.io/badge/lang-zh--CN-yellow.svg)](README.zh-CN.md) [![npm](https://img.shields.io/npm/dt/ai-pp3.svg)](https://www.npmjs.com/package/ai-pp3)

AI-PP3 is an advanced command-line tool that combines multimodal AI analysis with RawTherapee's processing engine to create optimized development profiles (.pp3 files) for RAW photography. Designed for both automated workflows and creative exploration.

## Table of Contents
- [Key Features](#key-features)
- [Compatibility](#compatibility)
- [Installation](#installation)
- [AI Configuration](#ai-configuration)
- [Basic Usage](#basic-usage)
- [Advanced Features](#advanced-features)
- [Roadmap](#roadmap)
- [License](#license)

## Compatibility <a name="compatibility"></a>
### Supported Formats
- **RAW Files**: All RawTherapee-supported formats including:
  - Common: CR2/CR3, NEF, ARW, RAF, DNG
  - Specialized: IIQ, PEF, RW2, ORF
- **Output Formats**: JPEG, TIFF, PNG (8/16-bit)

### System Requirements
- Node.js ≥18
- RawTherapee ≥5.8 (CLI required)
- API Key for cloud AI _or_ local GPU for self-hosted models

## Installation

```bash
# Global installation
npm install -g ai-pp3

# Verify installation
ai-pp3 --version
```

## AI Configuration
### Provider Setup
```bash
# Environment variables (.env file)
OPENAI_API_KEY=your_key               # Default provider
ANTHROPIC_API_KEY=your_key            # Claude models
GOOGLE_GENERATIVE_AI_API_KEY=your_key # Gemini
```

### Model Selection
```bash
ai-pp3 input.dng --provider anthropic --model claude-3-opus-20240229
```

## Roadmap
- [ ] ART (.arp) profile compatibility

## License

[GPL-2.0](LICENSE)
