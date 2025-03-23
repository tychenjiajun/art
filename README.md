# AI-PP3 - AI-Powered RawTherapee Profile Generator

https://github.com/user-attachments/assets/95bf9e8d-0c97-442d-8068-a5d27e094f18

[![en](https://img.shields.io/badge/lang-en-red.svg)](README.md) [![zh-CN](https://img.shields.io/badge/lang-zh--CN-yellow.svg)](README.zh-CN.md) [![npm](https://img.shields.io/npm/dt/ai-pp3.svg)](https://www.npmjs.com/package/ai-pp3)

AI-PP3 (AI RawTherapee) is a command-line tool that leverages artificial intelligence to analyze RAW photos and generate optimized processing profiles for [RawTherapee](https://www.rawtherapee.com/), a powerful open-source RAW image processing software. By combining computer vision AI with RawTherapee's advanced processing capabilities, AI-PP3 helps you achieve professional-quality results automatically.

## Features

- 🤖 AI-powered photo analysis and PP3 profile generation
- 📸 Support for multiple RAW formats (DNG, NEF, CR2, ARW)
- 🎨 Integration with RawTherapee's powerful processing engine
- 🖼️ Automatic preview generation for AI analysis
- ⚡️ Flexible AI provider support (OpenAI, Anthropic, Google, etc.)
- 🛠️ Simple, focused command-line interface

## Prerequisites

- Node.js >= 18
- [RawTherapee](https://www.rawtherapee.com/) (>= 5.8) installed and accessible in PATH
  - Windows: Install from [official website](https://www.rawtherapee.com/downloads/)
  - macOS: `brew install rawtherapee`
  - Linux: `sudo apt install rawtherapee` or equivalent
- API key for your chosen AI provider

## Installation

```bash
# Install globally
npm install -g ai-pp3
```

## Usage

AI-PP3 provides two main modes of operation:

1. Full Processing Mode (default):

   ```bash
   # Generate PP3 and process image
   ai-pp3 input.dng

   # Custom output paths
   ai-pp3 input.dng -o output.jpg    # Creates output.pp3 and output.jpg
   ai-pp3 input.dng -o output.pp3    # Creates output.pp3 and output.jpg
   ```

2. PP3-Only Mode (for use with RawTherapee GUI):

   ```bash
   # Generate only the PP3 profile
   ai-pp3 input.dng --pp3-only

   # Custom PP3 output path
   ai-pp3 input.dng --pp3-only -o custom.pp3
   ```

### Recommended Practices

For optimal results:
- 🏁 Always stai-pp3 with `--base` when processing similar photo sequences
- 🔧 Use existing PP3 profiles as baseline for consistent adjustments
- 🧩 Combine AI suggestions with your proven processing recipes
- 🔄 Iteratively refine base files between processing sessions

### Command Options

| Option | Description | Default |
|--------|-------------|---------|
| `-o, --output <path>` | Output file path | `input.pp3`/`input_processed.jpg` |
| `--pp3-only` | Generate PP3 without processing | `false` |
| `-p, --prompt <text>` | Custom AI analysis prompt | Built-in prompt |
| `--provider <name>` | AI provider (`openai`, `anthropic`, `google`, `xai`) | `openai` |
| `--model <name>` | Model version | `gpt-4-vision-preview` |
| `-v, --verbose` | Enable detailed logging | `false` |
| `-k, --keep-preview` | Retain preview JPEG | `false` |
| `-q, --quality <0-100>` | Output image quality | `100` |
| `--sections <names>` | PP3 sections to process | All sections |
| `--base <path>` | Base PP3 profile for incremental improvements | None |

### Integration with RawTherapee

AI-PP3 works seamlessly with RawTherapee in two ways:

1. **Automatic Processing**: By default, AI-PP3 uses RawTherapee's CLI (`rawtherapee-cli`) to:

   - Generate preview JPEGs for AI analysis (quality=80, subsampling=3)
   - Process final images with the AI-generated PP3 profile (quality=100)
   - Handle various RAW formats supported by RawTherapee

2. **Manual Processing**: Using `--pp3-only` mode:
   - Generate PP3 profiles without processing
   - Use profiles in RawTherapee's GUI for fine-tuning
   - Save profiles for batch processing

### AI-Generated PP3 Profiles

The AI follows a structured workflow to create optimized processing parameters:

**Analysis Framework**
1. **Think Phase**:
   - Evaluates histogram distribution and clipping points
   - Analyzes color relationships and texture complexity
   - Detects lighting conditions and optical characteristics

2. **Plan Phase**:
   - Determines exposure compensation needs (±2.0 EV range)
   - Designs highlight/shadow recovery strategy
   - Creates color adjustment roadmap (WB ±1500K temp range)
   - Develops detail enhancement approach

3. **Action Phase**:
   - Generates PP3 parameters with safe value ranges:
     ```
     [Exposure]
     Compensation=±2.0
     
     [White Balance]
     Temperature=6500±1500
     Green=0.8-1.2
     
     [Sharpening]
     Amount=50-400
     Radius=0.5-1.5
     ```

**Analysis Framework** (Base Profile Workflow):
1. **Think Phase**:
   - Evaluates histogram distribution and clipping points
   - Analyzes color relationships and texture complexity
   - Detects lighting conditions and optical characteristics

2. **Plan Phase**:
   - Determines exposure compensation needs (±2.0 EV range)
   - Designs highlight/shadow recovery strategy
   - Creates color adjustment roadmap (WB ±1500K temp range)
   - Develops detail enhancement approach

3. **Action Phase**:
   - Generates PP3 parameters with safe value ranges
   - Performs differential analysis on existing PP3 files
   - Preserves manually adjusted parameters
   - Optimizes through parameter mapping and version-aware inheritance

### Preview File Handling

During processing, AI-PP3:

1. Creates a preview JPEG (quality=80) for AI analysis
2. By default, removes the preview after processing
3. Can retain preview with `-k` flag for reference
4. Names previews as `<input>_preview.jpg`

### AI Provider Support

AI-PP3 supports multiple AI providers:

- OpenAI (default): GPT-4 Vision
- OpenAI-compatible: OpenAI-compatible APIs (e.g. OpenRouter)
- Anthropic: Claude 3 Series
- Google: Gemini Pro Vision
- xAI: Grok language model

#### Setting Up API Keys

AI-PP3 uses environment variables for API key configuration. You can set them in your shell or create a `.env` file in your working directory:

```bash
# OpenAI
export OPENAI_API_KEY=your_openai_key

# OpenAI-compatible (e.g. OpenRouter)
export OPENAI_API_KEY=your_openrouter_key
export OPENAI_BASE_URL=https://openrouter.ai/api/v1

# Anthropic
export ANTHROPIC_API_KEY=your_anthropic_key

# Google
export GOOGLE_GENERATIVE_AI_API_KEY=your_google_key

# xAI
export XAI_API_KEY=your_xai_key
```

Configuration examples:

```bash
# Use default OpenAI provider
ai-pp3 input.dng

# Use Anthropic Claude 3 Sonnet
ai-pp3 input.dng --provider anthropic --model claude-3-sonnet-20240229

# Use Google Gemini Pro Vision
ai-pp3 input.dng --provider google --model gemini-pro-vision

# Use xAI Grok
ai-pp3 input.dng --provider xai --model grok-1

# Use custom prompt
ai-pp3 input.dng -p "Analyze this photo and create a natural, film-like look"

# Set output quality
ai-pp3 input.dng -q 95

# Enable verbose logging
ai-pp3 input.dng -v

# Use base PP3 file
ai-pp3 input.dng --base base.pp3  # Recommended for best results - builds upon existing profiles
```

## Development

```bash
# Install dependencies
pnpm install

# Run tests
pnpm test

# Build the project
pnpm build
```

## License

[GPL-2.0](LICENSE) (matching RawTherapee's license)
