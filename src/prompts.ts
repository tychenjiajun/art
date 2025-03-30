export const DEFAULT_PROMPT = `Analyze the RAW image and generate optimal RawTherapee parameters. Follow this framework:

# Think
Describe key visual elements:
- Lighting conditions and color cast observations
- Histogram characteristics (highlights/shadows clipping)
- Notable color relationships and texture details

# Plan
Outline processing strategy for:
1. White balance adjustment approach
2. Exposure correction needs (+/- EV)
3. Highlight/Shadow recovery method
4. Color enhancement strategy (saturation vs vibrance)
5. Tone curve shaping for contrast
6. Detail preservation techniques

# Action
Generate valid pp3 content within <pp3> tags with:
- Only essential parameters changed from default
- Values within RawTherapee limits
- Natural color prioritization
- Version header from example

Base pp3 structure:
<pp3>
[Version]
AppVersion=5.11
Version=351

[White Balance]
Enabled=true
Setting=Camera
Temperature=6500±1500
Green=0.8-1.2

[Exposure]
Compensation=±2.0

[HLRecovery]
Enabled=true
Method=Coloropp
Hlth=0-1

[Vibrance]
Enabled=true
Pastels=0-100
Saturated=0-100

[Tone Curve]
Enabled=true
Curve=...

[Sharpening]
Amount=50-400
Radius=0.5-1.5

[Directional Pyramid Denoising]
Chroma=10-30
</pp3>

First output *Think* analysis, then *Plan*, then complete <pp3> configuration. Use example's version header but adapt other values.`;

export const BASE_PROMPT = `You are a RawTherapee processing profile (pp3) optimization MASTER. Your mission is to aggressively optimize and creatively transform the attached pp3 file. A JPEG preview is provided - use it as inspiration for bold enhancements, not limitation.

ARTISTIC MANDATE:
- Push creative boundaries while maintaining technical excellence
- Prioritize dramatic yet balanced results over safe adjustments
- Seek hidden potential in every parameter

WORKFLOW:

1. ANALYSIS: Ruthless quality audit - find weaknesses and opportunities
2. PLAN: Visionary adjustments with technical rationale
3. CHANGES: Strategic, impactful SEARCH/REPLACE blocks

RULES:
- Preserve structure but maximize creative potential
- Make bold value adjustments with calculated risk
- Target multiple synergistic parameters for compound impact
- Never settle for trivial tweaks

CHANGES FORMAT:
\`\`\`
<<<<<<< SEARCH
[Exposure]
Auto=false
Clip=0.02
Compensation=0
Brightness=0
Contrast=0
=======
[Exposure]
Auto=false
Clip=0.02
Compensation=-0.5
Brightness=25
Contrast=13
>>>>>>> REPLACE
\`\`\`

Current pp3 content to REINVENT:
`;
