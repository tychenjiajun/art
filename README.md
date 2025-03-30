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
- [CLI Options](#cli-options)
- [Roadmap](#roadmap)
- [FAQ](#faq)
- [License](#license)

## Key Features 
- 🖼️ AI-driven analysis of RAW files (DNG/NEF/CR2/ARW)
- ⚡ Batch PP3 creation with consistent processing parameters
- 📝 Customizable development settings through natural language prompts
- 🔀 Multi-model support (OpenAI, Anthropic, Google, Local)
- 🎚️ Fine-grained control over PP3 sections (Exposure, Color, Detail)
- 🔍 Interactive preview generation with quality controls

## Compatibility 
### Supported Formats
- **RAW Files**: All RawTherapee-supported formats including:
  - Common: CR2/CR3, NEF, ARW, RAF, DNG
  - Specialized: IIQ, PEF, RW2, ORF
- **Output Formats**:
  - JPEG (8-bit)
  - TIFF (8/16-bit with ZLIB/NONE compression)
  - PNG (8/16-bit)

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
# Cloud models
ai-pp3 input.dng --provider anthropic --model claude-3-opus-20240229

# Local models
ai-pp3 input.dng --provider openai-compatible --model llama3:8b-instruct-q5_K_M
```

## Basic Usage 
```bash
# Basic processing with defaults
ai-pp3 input.dng -o output.jpg

# PP3-only mode with custom prompt
ai-pp3 input.dng --pp3-only -p "Unleash the full potential of RAW image pp3 settings with a dramatic flair. Elevate your creative precision by providing:

1. ANALYSIS: A profound exploration into the image's essence, identifying its strengths and areas for transformation.
2. PLAN: Set ambitious goals for adjustments and articulate a vivid creative vision that transcends ordinary imagery.
3. CHANGES: Deliver precise SEARCH/REPLACE blocks to breathe life into the envisioned transformation.

RULES:
- Respect the original structure & headers as the foundation upon which to build your masterpiece.
- Proceed thoughtfully, modifying only those values necessary to achieve the desired dramatic effect.
- Maintain the document's integrity by never adding or removing sections.

CHANGES FORMAT:
\`\`\`
<<<<<<< SEARCH
[Exposure]
Auto=false
Clip=0.02
Compensation=0
Brightness=0
=======
[Exposure]
Auto=false
Clip=0.02
Compensation=-0.5
Brightness=25
>>>>>>> REPLACE
\`\`\`

Prepare to embark on this transformative journey as the pp3 content to be optimized follows below:
"

# Multi-section processing
ai-pp3 input.dng --sections Exposure,ColorToning

# Base profile refinement
ai-pp3 input.dng --base existing.pp3 --preview-quality 85
```

## Advanced Features 
### Batch Processing
```bash
# Parallel processing (GNU Parallel)
ls *.DNG | parallel -j8 ai-pp3 {} -o {.}.jpg

# TIFF output with compression
find . -name '*.NEF' -exec ai-pp3 {} --tiff --compression z \;
```

### Custom Workflows
```bash
# Multi-model comparison
ai-pp3 input.dng \
  --provider openai --model gpt-4-vision-preview \
  --base neutral.pp3 --keep-preview
```

## CLI Options

### Core Parameters
- `-o, --output <path>`: Output file path (default: `input.pp3` or `input_processed.[format]`)
- `--pp3-only`: Generate PP3 file without processing image
- `-p, --prompt <text>`: Natural language prompt for AI analysis

### AI Configuration
- `--provider <name>`: AI service provider (`openai`, `anthropic`, `google`, `openai-compatible`)
- `--model <name>`: Model name (default: `gpt-4-vision-preview`)

### Output Format
- `--tiff`: Export as TIFF format
- `--png`: Export as PNG format
- `--compression <type>`: TIFF compression (`z` or `none`)
- `--bit-depth <n>`: Bit depth (`8` or `16`)
- `--quality <n>`: JPEG quality (1-100)

### Advanced Controls
- `--base <path>`: Base PP3 file for incremental improvements
- `--sections <list>`: Comma-separated PP3 sections to process (e.g. `Exposure,ColorToning`)
- `--preview-quality <n>`: Preview JPEG quality (1-100, default: 85)
- `-v, --verbose`: Enable detailed processing logs
- `-k, --keep-preview`: Retain preview JPEG after processing

### Examples
```bash
# Basic conversion with quality control
ai-pp3 input.dng --tiff --compression z --bit-depth 16

# Multi-model comparison
ai-pp3 input.dng --provider anthropic --model claude-3-opus-20240229

# Section-limited processing
ai-pp3 input.dng --sections Exposure,Detail --pp3-only
```

## Roadmap 
- [ ] ART (.arp) profile compatibility

## FAQ
For detailed questions and answers, see our [FAQ documentation](faq.md).

## License

[GPL-2.0](LICENSE)
