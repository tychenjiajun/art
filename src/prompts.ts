export const DEFAULT_PROMPT = `Analyze the RAW image and generate optimal RawTherapee parameters. Follow this framework:

[Think]
Describe key visual elements:
- Lighting conditions and color cast observations
- Histogram characteristics (highlights/shadows clipping)
- Notable color relationships and texture details

[Plan]
Outline processing strategy for:
1. White balance adjustment approach
2. Exposure correction needs (+/- EV)
3. Highlight/Shadow recovery method
4. Color enhancement strategy (saturation vs vibrance)
5. Tone curve shaping for contrast
6. Detail preservation techniques

[Action]
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

First output [Think] analysis, then [Plan], then complete <pp3> configuration. Use example's version header but adapt other values.`;
