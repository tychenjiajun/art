# ART - AI-Powered RawTherapee Profile Generator

[![en](https://img.shields.io/badge/lang-en-red.svg)](README.md) [![zh-CN](https://img.shields.io/badge/lang-zh--CN-yellow.svg)](README.zh-CN.md)

ART (AI RawTherapee) is a command-line tool that leverages artificial intelligence to analyze RAW photos and generate optimized processing profiles for [RawTherapee](https://www.rawtherapee.com/), a powerful open-source RAW image processing software. By combining computer vision AI with RawTherapee's advanced processing capabilities, ART helps you achieve professional-quality results automatically.

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
npm install -g @tychenjiajun/art
```

## Usage

ART provides two main modes of operation:

1. Full Processing Mode (default):
   ```bash
   # Generate PP3 and process image
   art input.dng

   # Custom output paths
   art input.dng -o output.jpg    # Creates output.pp3 and output.jpg
   art input.dng -o output.pp3    # Creates output.pp3 and output.jpg
   ```

2. PP3-Only Mode (for use with RawTherapee GUI):
   ```bash
   # Generate only the PP3 profile
   art input.dng --pp3-only

   # Custom PP3 output path
   art input.dng --pp3-only -o custom.pp3
   ```

### Command Options

```
art <input> [options]

Arguments:
  input                    Input RAW file path (DNG, NEF, CR2, ARW)

Options:
  -o, --output <path>     Output file path (defaults to input.pp3 or input_processed.jpg)
  --pp3-only              Only generate PP3 file without processing the image
  -p, --prompt <text>     Custom prompt text for AI analysis
  --provider <n>          AI provider to use (default: "openai")
  --model <n>             Model name to use (default: "gpt-4-vision-preview")
  -v, --verbose           Enable verbose logging
  -k, --keep-preview      Keep the preview.jpg file after processing
  -q, --quality <n>       Quality of the output image (0-100)
  -h, --help             Display help for command
  -V, --version          Output the version number
```

### Integration with RawTherapee

ART works seamlessly with RawTherapee in two ways:

1. **Automatic Processing**: By default, ART uses RawTherapee's CLI (`rawtherapee-cli`) to:
   - Generate preview JPEGs for AI analysis (quality=90, subsampling=3)
   - Process final images with the AI-generated PP3 profile (quality=100)
   - Handle various RAW formats supported by RawTherapee

2. **Manual Processing**: Using `--pp3-only` mode:
   - Generate PP3 profiles without processing
   - Use profiles in RawTherapee's GUI for fine-tuning
   - Save profiles for batch processing

### AI-Generated PP3 Profiles

The AI analyzes your photos and generates RawTherapee PP3 profiles focusing on:

1. **Exposure & Tone**:
   - Auto-exposure adjustment
   - Highlight recovery
   - Shadow enhancement
   - Dynamic range optimization

2. **Color & White Balance**:
   - Color temperature correction
   - Tint adjustment
   - Vibrance and saturation
   - Color balance

3. **Detail Enhancement**:
   - Sharpening parameters
   - Noise reduction (luminance/chrominance)
   - Texture preservation
   - Detail recovery

4. **Advanced Processing**:
   - Tone curves
   - Lab adjustments
   - Film simulation
   - Output sharpening

### Preview File Handling

During processing, ART:
1. Creates a preview JPEG (quality=90) for AI analysis
2. By default, removes the preview after processing
3. Can retain preview with `-k` flag for reference
4. Names previews as `<input>_preview.jpg`

### AI Provider Support

ART supports multiple AI providers:
- OpenAI (default): GPT-4 Vision
- OpenAI-compatible: OpenAI-compatible APIs (e.g. OpenRouter)
- Anthropic: Claude 3 Series
- Google: Gemini Pro Vision
- xAI: Grok language model

#### Setting Up API Keys

ART uses environment variables for API key configuration. You can set them in your shell or create a `.env` file in your working directory:

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
art input.dng

# Use Anthropic Claude 3 Sonnet
art input.dng --provider anthropic --model claude-3-sonnet-20240229

# Use Google Gemini Pro Vision
art input.dng --provider google --model gemini-pro-vision

# Use xAI Grok
art input.dng --provider xai --model grok-1

# Use custom prompt
art input.dng -p "Analyze this photo and create a natural, film-like look"

# Set output quality
art input.dng -q 95

# Enable verbose logging
art input.dng -v
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

### Project Structure

```
art/
├── src/
│   ├── agent.ts           # AI integration and PP3 generation
│   ├── bin.ts            # CLI implementation
│   ├── provider.ts       # AI provider management
│   └── raw-therapee-wrap.ts  # RawTherapee interface
├── test/
│   ├── agent.test.ts
│   ├── bin.test.ts
│   └── raw-therapee-wrap.test.ts
└── package.json
```

## License

[GPL-2.0](LICENSE) (matching RawTherapee's license)
