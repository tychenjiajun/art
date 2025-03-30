# AI-PP3 Processing Challenge Analysis

This project compares AI-generated RawTherapee processing profiles (PP3) against manual edits from the [RawTherapee Processing Challenge](https://rawpedia.rawtherapee.com/Rawtherapee_Processing_Challenge_feedback).

## Project Structure

Each example folder contains:

- Original RAW file from challenge
- Base PP3 (created by opening RAW in RawTherapee without edits)
- `ai.pp3` (AI-generated processing profile)
- `ai.jpg` (result of applying AI PP3)
- `ai.sh` (script to generate PP3 using Gemini 2.5 Pro via OpenRouter)

```
/1
  ├── IMG_0080.CR2
  ├── IMG_0080.CR2.pp3
  ├── ai.pp3
  ├── ai.jpg
  └── ai.sh
... (repeated for 6 examples)
```

## Challenge Images Overview

| Filename           | Key Characteristics                               | Dynamic Range |
| ------------------ | ------------------------------------------------- | ------------- |
| IMG_0080.CR2       | Sunset, underexposed, high noise, 12Ev            | 12 EV         |
| 2010_MONTR_033.NEF | Mixed lighting ("Blue Horse"), deep whites/blacks | -             |
| S7_00463.ARW       | Low-light dance scene, artificial lighting, 16Ev  | 16 EV         |
| B.dng              | Dull countryside scene, low contrast              | -             |
| IMGP2426.DNG       | Sunset preservation, extreme underexposure, 14Ev  | 14 EV         |
| DSC5286.NEF        | Cruise ship detail, motion blur, low contrast     | -             |

## AI Processing Workflow

1. **Base PP3 Creation**:

   - Open RAW file in RawTherapee 5.9+
   - Immediately save as base.pp3 without adjustments

2. **AI Profile Generation**:

```bash
# Example from /examples/1/ai.sh
#!/bin/bash
export OPENAI_API_KEY=your-key-here

ai-pp3 IMG_0080.CR2 \
  --provider openrouter \
  --model google/gemini-pro-1.5 \
  --base IMG_0080.CR2.pp3 \
  --output ai.pp3
```

**Requirements**:

- RawTherapee 5.9+
- OpenRouter API key (for Gemini access)
- Basic command-line knowledge

## Evaluation Methodology

1. **Technical Comparison**:

```bash
# Structural diff ignoring timestamps
diff -I '\<Date\>' base.pp3 ai.pp3

# Parameter statistics
awk -F= '/^[^#]/ {print $1}' ai.pp3 | sort | uniq -c
```

2. **Visual Assessment**:
   - Side-by-side comparison in RawTherapee
   - Histogram analysis of tone distribution
   - Zoomed inspection of noise patterns

## License Information

All image materials in this folder are licensed under the CC BY-NC-SA 4.0 license.

## Reference Materials

- [RawTherapee Processing Challenge](https://rawpedia.rawtherapee.com/Rawtherapee_Processing_Challenge_feedback)
- [PP3 Sidecar Documentation](https://rawpedia.rawtherapee.com/Sidecar_Files_-_Processing_Profiles)
- [OpenRouter API](https://openrouter.ai/docs)
