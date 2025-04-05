# AI-PP3 - 基于AI增强的RawTherapee配置文件生成器

![Before](/examples/5/IMGP2426.jpg)![After](/examples/5/ai.jpg)

[CC BY-NC-SA 4.0](https://rawpedia.rawtherapee.com/Rawtherapee_Processing_Challenge_feedback)

[![en](https://img.shields.io/badge/lang-en-red.svg)](README.md) [![zh-CN](https://img.shields.io/badge/lang-zh--CN-yellow.svg)](README.zh-CN.md) [![npm](https://img.shields.io/npm/dt/ai-pp3.svg)](https://www.npmjs.com/package/ai-pp3)

AI-PP3 是一款结合多模态AI分析与RawTherapee处理引擎的命令行工具，专注于为RAW摄影优化生成PP3配置文件。支持自动化工作流和创意探索。

## 使用示例

查看[示例文档](examples/example.zh-CN.md)获取实际使用场景。

## 目录

- [主要特性](#主要特性)
- [兼容性](#兼容性)
- [安装指南](#安装指南)
- [AI配置](#ai配置)
- [基础用法](#基础用法)
- [高级功能](#高级功能)
- [CLI 选项](#cli-选项)
- [发展路线](#发展路线)
- [常见问题](#常见问题)
- [许可证](#许可证)

## 主要特性

- 🖼️ RAW文件AI智能分析（支持DNG/NEF/CR2/ARW等格式）
- ⚡ 批量生成PP3配置文件
- 📝 自定义自然语言提示词控制处理参数
- 🔀 多模型支持（OpenAI/Anthropic/Google/本地模型）
- 🎚️ 精细控制PP3模块（曝光/色彩/细节等）
- 🔍 带质量控制的交互式预览生成

## 兼容性

### 支持格式

- **RAW格式**：支持所有RawTherapee兼容格式，包括：
  - 常见格式：CR2/CR3、NEF、ARW、RAF、DNG
  - 其他格式：IIQ、PEF、RW2、ORF
- **输出格式**：
  - JPEG（8位）
  - TIFF（8/16位，支持ZLIB/NONE压缩）
  - PNG（8/16位）

### 系统要求

- Node.js ≥18版
- RawTherapee ≥5.8版（需启用CLI）
- 云服务API密钥或本地GPU（用于自托管模型）

## 安装指南

```bash
# 全局安装
npm install -g ai-pp3

# 验证安装版本
ai-pp3 --version
```

## AI配置

### 服务提供商设置

```bash
# 环境变量配置（在.env文件中）
OPENAI_API_KEY=your_key               # 默认服务提供商
ANTHROPIC_API_KEY=your_key            # Claude模型
GOOGLE_GENERATIVE_AI_API_KEY=your_key # Gemini模型
```

### 模型选择

```bash
# 使用云端模型
ai-pp3 input.dng --provider anthropic --model claude-3-opus-20240229

# 使用本地模型
ai-pp3 input.dng --provider openai-compatible --model llama3:8b-instruct-q5_K_M
```

## 基础用法

```bash
# 默认参数处理
ai-pp3 input.dng -o output.jpg

# 仅生成PP3配置文件（自定义提示词）
ai-pp3 input.dng --pp3-only -p "通过深度分析释放RAW图像潜力，提供：
1. **分析**：深入解析图像特质，识别优化方向
2. **方案**：制定精准调整策略和视觉提升计划
3. **修改**：通过SEARCH/REPLACE块实现参数优化

**规则**：
- 保持原始配置框架
- 仅修改必要参数
- 不增删配置模块

**修改格式**：
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
\`\`\`"

# 多模块处理
ai-pp3 input.dng --sections Exposure,ColorToning

# 基于现有配置优化
ai-pp3 input.dng --base existing.pp3 --preview-quality 85
```

## 高级功能

### 批量处理

```bash
# 并行处理（需GNU Parallel）
ls *.DNG | parallel -j8 ai-pp3 {} -o {.}.jpg

# TIFF压缩输出
find . -name '*.NEF' -exec ai-pp3 {} --tiff --compression z \;
```

### 自定义工作流

```bash
# 多模型对比
ai-pp3 input.dng \
  --provider openai --model gpt-4-vision-preview \
  --base neutral.pp3 --keep-preview
```

## CLI 选项

### 核心参数

- `-o, --output <路径>`: 输出文件路径（默认：`input.pp3` 或 `input_processed.[格式]`）
- `--pp3-only`: 仅生成PP3文件不输出图像
- `-p, --prompt <文本>`: 用于AI分析的自然语言提示词
- `--preset <名称>`: 预设风格（`aggressive`激进, `creative`创意, `balanced`平衡, `technical`技术）

### AI配置

- `--provider <名称>`: AI服务提供商（`openai`, `anthropic`, `google`, `openrouter`, `openai-compatible`）
- `--model <名称>`: 模型名称（默认：`gpt-4-vision-preview`）

### 输出格式

- `--tiff`: 导出为TIFF格式
- `--png`: 导出为PNG格式
- `--compression <类型>`: TIFF压缩方式（`z` 或 `none`）
- `--bit-depth <位数>`: 位深度（`8` 或 `16`）
- `--quality <数值>`: JPEG质量（1-100）

### 高级控制

- `--base <路径>`: 用于增量优化的基础PP3文件
- `--sections <列表>`: 要处理的PP3模块列表（例如：`Exposure,ColorToning`）
- `--preview-quality <数值>`: 预览图JPEG质量（1-100，默认：85）
- `-v, --verbose`: 显示详细处理日志
- `-k, --keep-preview`: 处理后保留预览图

### 使用示例

```bash
# 带质量控制的TIFF转换
ai-pp3 input.dng --tiff --compression z --bit-depth 16

# 多模型对比
ai-pp3 input.dng --provider anthropic --model claude-3-opus-20240229

# 限定模块处理
ai-pp3 input.dng --sections Exposure,Detail --pp3-only
```

## 发展路线

- [ ] 支持ART(.arp)配置文件

## 常见问题

点击[FAQ文档](faq.zh-CN.md)查看常见问题解答。

## 许可证

[GPL-2.0](LICENSE)
