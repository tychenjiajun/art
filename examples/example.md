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

| Filename                  | Key Characteristics                                  | Dynamic Range |
|---------------------------|------------------------------------------------------|---------------|
| IMG_0080.CR2              | Sunset, underexposed, high noise, 12Ev               | 12 EV         |
| 2010_MONTR_033.NEF        | Mixed lighting ("Blue Horse"), deep whites/blacks    | -             |
| S7_00463.ARW              | Low-light dance scene, artificial lighting, 16Ev     | 16 EV         |
| B.dng                     | Dull countryside scene, low contrast                 | -             |
| IMGP2426.DNG              | Sunset preservation, extreme underexposure, 14Ev     | 14 EV         |
| DSC5286.NEF               | Cruise ship detail, motion blur, low contrast        | -             |

## AI Processing Workflow

1. **Input**: Base PP3 (unedited RAW profile)
2. **Generation**: `ai.sh` script uses Gemini 2.5 Pro via OpenRouter API to:
   - Analyze image characteristics
   - Generate optimized PP3 file
3. **Output**: AI-processed JPG and PP3 sidecar file

**Requirements**:
- RawTherapee 5.9+
- OpenRouter API key (for Gemini access)
- Basic command-line knowledge

## Evaluation Guide

Compare results using:
```bash
# PP3 diff check
diff example_folder/base.pp3 example_folder/ai.pp3
```

## Reference Materials

- [RawTherapee Processing Challenge](https://rawpedia.rawtherapee.com/Rawtherapee_Processing_Challenge_feedback)  
- [PP3 Sidecar Documentation](https://rawpedia.rawtherapee.com/Sidecar_Files_-_Processing_Profiles)  
- [OpenRouter API](https://openrouter.ai/docs)
