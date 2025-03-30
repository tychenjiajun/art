# AI-PP3 处理挑战分析

本项目将基于 Gemini 2.5 Pro 生成的 AI 自动化 RawTherapee 处理配置文件（PP3）与 [RawTherapee 处理挑战](https://rawpedia.rawtherapee.com/Rawtherapee_Processing_Challenge_feedback) 中的人工编辑结果进行对比。

## 项目结构

每个示例文件夹包含以下内容：

- 挑战提供的原始 RAW 文件
- 基础 PP3 文件（通过直接打开 RAW 文件后未做任何调整即保存生成）
- `ai.pp3`（AI 生成的处理配置文件）
- `ai.jpg`（应用 AI PP3 后的处理结果）
- `ai.sh`（通过 OpenRouter 调用 Gemini 2.5 Pro 生成 PP3 的脚本）

```plaintext
/1
  ├── IMG_0080.CR2
  ├── IMG_0080.CR2.pp3
  ├── ai.pp3
  ├── ai.jpg
  └── ai.sh
... （共 6 个示例文件夹）
```

## 挑战图像概览

| 文件名             | 核心特征                              | 动态范围 |
| ------------------ | ------------------------------------- | -------- |
| IMG_0080.CR2       | 日落场景、欠曝、高噪点、12EV 动态范围 | 12 EV    |
| 2010_MONTR_033.NEF | 混合光线（"蓝马"）、深白/黑区域       | -        |
| S7_00463.ARW       | 低光舞会场景、人工照明、16EV 动态范围 | 16 EV    |
| B.dng              | 阴郁乡村场景、低对比度                | -        |
| IMGP2426.DNG       | 日落场景保护、极端欠曝、14EV 动态范围 | 14 EV    |
| DSC5286.NEF        | 轮船细节、运动模糊、低对比度          | -        |

## AI 处理流程

### 1. 基础 PP3 创建

- 在 RawTherapee 5.9+ 中打开 RAW 文件
- 无需任何调整直接保存为 `base.pp3`

### 2. AI 配置文件生成

```bash
# 示例：/examples/1/ai.sh
#!/bin/bash
export OPENAI_API_KEY=your-key-here

ai-pp3 IMG_0080.CR2 \
  --provider openrouter \
  --model google/gemini-pro-1.5 \
  --base IMG_0080.CR2.pp3 \
  --output ai.pp3
```

**依赖项**：

- RawTherapee 5.9+
- OpenRouter API 密钥（用于调用 Gemini 模型）
- 基础命令行操作能力

## 评估方法

### 1. 技术对比

```bash
# 忽略时间戳的结构化差异
diff -I '\<Date\>' base.pp3 ai.pp3

# 参数统计
awk -F= '/^[^#]/ {print $1}' ai.pp3 | sort | uniq -c
```

### 2. 视觉评估

- RawTherapee 中并排对比
- 直方图分析色调分布
- 放大观察噪点模式

## 许可声明

本文件夹中的所有图像素材均采用知识共享署名-非商业性使用-相同方式共享 4.0 国际许可协议（CC BY-NC-SA 4.0）授权。

## 参考资料

- [RawTherapee 处理挑战](https://rawpedia.rawtherapee.com/Rawtherapee_Processing_Challenge_feedback)
- [PP3 辅助配置文件文档](https://rawpedia.rawtherapee.com/Sidecar_Files_-_Processing_Profiles)
- [OpenRouter API 文档](https://openrouter.ai/docs)
