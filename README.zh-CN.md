# ART - AI驱动的RawTherapee配置生成器

[![en](https://img.shields.io/badge/lang-en-red.svg)](README.md) [![zh-CN](https://img.shields.io/badge/lang-zh--CN-yellow.svg)](README.zh-CN.md)

ART（AI RawTherapee）是一个命令行工具，它利用人工智能分析RAW照片并为[RawTherapee](https://www.rawtherapee.com/)生成优化的处理配置文件。RawTherapee是一款功能强大的开源RAW图像处理软件。通过结合计算机视觉AI和RawTherapee的先进处理功能，ART帮助您自动获得专业级的处理效果。

## 特性

- 🤖 由人工智能驱动的照片分析和PP3配置文件生成
- 📸 支持多种RAW格式（DNG、NEF、CR2、ARW）
- 🎨 与RawTherapee强大的处理引擎集成
- 🖼️ 自动生成用于AI分析的预览图
- ⚡️ 灵活的AI提供商支持（OpenAI、Anthropic、Google等）
- 🛠️ 简单、专注的命令行界面

## 先决条件

- Node.js >= 18
- [RawTherapee](https://www.rawtherapee.com/)（>= 5.8）已安装并可在PATH中访问
  - Windows：从[官方网站](https://www.rawtherapee.com/downloads/)安装
  - macOS：`brew install rawtherapee`
  - Linux：`sudo apt install rawtherapee` 或等效命令
- 所选AI提供商的API密钥

## 安装

```bash
# 全局安装
npm install -g @tychenjiajun/art
```

## 使用方法

ART提供两种主要操作模式：

1. 全处理模式（默认）：

   ```bash
   # 生成PP3并处理图像
   art input.dng

   # 自定义输出路径
   art input.dng -o output.jpg    # 创建output.pp3和output.jpg
   art input.dng -o output.pp3    # 创建output.pp3和output.jpg
   ```

2. 仅PP3模式（用于RawTherapee GUI）：

   ```bash
   # 仅生成PP3配置文件
   art input.dng --pp3-only

   # 自定义PP3输出路径
   art input.dng --pp3-only -o custom.pp3
   ```

### 推荐实践

对于最佳处理效果：
- 🏁 处理相似照片序列时始终使用`--base`参数
- 🔧 使用现有PP3配置文件作为调整基准
- 🧩 将AI建议与您已验证的处理方案结合使用
- 🔄 在处理会话之间迭代优化基础文件

### 命令选项

```
art <input> [options]

参数:
  input                    输入RAW文件路径（DNG、NEF、CR2、ARW）

选项:
  -o, --output <path>     输出文件路径（默认为input.pp3或input_processed.jpg）
  --pp3-only              仅生成PP3文件，不处理图像
  -p, --prompt <text>     用于AI分析的自定义提示文本
  --provider <n>          要使用的AI提供商（默认："openai"）
  --model <n>             要使用的模型名称（默认："gpt-4-vision-preview"）
  -v, --verbose           启用详细日志记录
  -k, --keep-preview      处理后保留preview.jpg文件
  -q, --quality <n>       输出图像的质量（0 - 100）
  --sections <names>      要处理的PP3部分的逗号分隔列表
  --base <path>           要改进的基础PP3文件
  -h, --help             显示命令帮助信息
  -V, --version          输出版本号
```

### 与RawTherapee集成

ART以两种方式与RawTherapee无缝协作：

1. **自动处理**：默认情况下，ART使用RawTherapee的CLI（`rawtherapee-cli`）来：

   - 生成用于AI分析的预览JPEG（质量=80，子采样=3）
   - 使用AI生成的PP3配置文件处理最终图像（质量=100）
   - 处理RawTherapee支持的各种RAW格式

2. **手动处理**：使用`--pp3-only`模式：
   - 生成PP3配置文件而不进行处理
   - 在RawTherapee的GUI中使用配置文件进行微调
   - 保存配置文件以进行批量处理

### AI生成的PP3配置文件

AI遵循结构化工作流程创建优化参数：

**分析框架**
1. **思考阶段**：
   - 评估直方图分布和剪切点
   - 分析色彩关系和纹理复杂度
   - 检测光照条件和光学特性

2. **计划阶段**：
   - 确定曝光补偿需求（±2.0 EV范围）
   - 设计高光/阴影恢复策略
   - 制定色彩调整路线（白平衡±1500K色温范围）
   - 开发细节增强方案

3. **执行阶段**：
   - 生成安全值范围内的PP3参数：
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

**基础配置文件工作流** (`--base` 选项)：
- 对现有PP3文件进行差异分析
- 保留手动调整参数
- 通过以下方式优化相互依赖的值：
  1. 参数关系映射
  2. 非破坏性调整分层
  3. 版本感知的值继承

**关键技术交互**：
- 保持RawTherapee处理管道的完整性
- 遵循版本特定的参数限制
- 实施安全值钳位保证兼容性
- 使用SEARCH/REPLACE模式匹配进行增量更新

### 预览文件处理

在处理过程中，ART会：

1. 创建用于AI分析的预览JPEG（质量=80）
2. 默认情况下，处理后删除预览
3. 可以使用`-k`标志保留预览以供参考
4. 将预览命名为`<input>_preview.jpg`

### AI提供商支持

ART支持多个AI提供商：

- OpenAI（默认）：GPT - 4 Vision
- 兼容OpenAI的API：兼容OpenAI的API（例如OpenRouter）
- Anthropic：Claude 3系列
- Google：Gemini Pro Vision
- xAI：Grok语言模型

#### 设置API密钥

ART使用环境变量进行API密钥配置。您可以在shell中设置它们，也可以在工作目录中创建一个`.env`文件：

```bash
# OpenAI
export OPENAI_API_KEY=your_openai_key

# 兼容OpenAI的API（例如OpenRouter）
export OPENAI_API_KEY=your_openrouter_key
export OPENAI_BASE_URL=https://openrouter.ai/api/v1

# Anthropic
export ANTHROPIC_API_KEY=your_anthropic_key

# Google
export GOOGLE_GENERATIVE_AI_API_KEY=your_google_key

# xAI
export XAI_API_KEY=your_xai_key
```

配置示例：

```bash
# 使用默认的OpenAI提供商
art input.dng

# 使用Anthropic Claude 3 Sonnet
art input.dng --provider anthropic --model claude-3-sonnet-20240229

# 使用Google Gemini Pro Vision
art input.dng --provider google --model gemini-pro-vision

# 使用xAI Grok
art input.dng --provider xai --model grok-1

# 使用自定义提示
art input.dng -p "分析这张照片并创建自然的胶片风格外观"

# 设置输出质量
art input.dng -q 95

# 启用详细日志记录
art input.dng -v

# 使用基础PP3文件
art input.dng --base base.pp3  # 推荐用于最佳效果 - 基于现有配置文件改进
```

## 开发

```bash
# 安装依赖项
pnpm install

# 运行测试
pnpm test

# 构建项目
pnpm build
```

## 许可证

[GPL - 2.0](LICENSE)（与RawTherapee的许可证匹配）
```
```

## 功能特点

- AI驱动的照片分析和PP3配置文件生成
- 支持多种RAW格式（DNG、NEF、CR2、ARW）
- 集成RawTherapee强大的处理引擎
- 自动生成AI分析用的预览图
- ⚡️ 灵活的AI提供商支持（OpenAI、Anthropic、Google等）
- 🔧 可定制基础配置文件支持，实现最佳调整
- 简单、专注的命令行界面

## 系统要求

- Node.js >= 18
- [RawTherapee](https://www.rawtherapee.com/) (>= 5.8) 已安装且可在PATH中访问
  - Windows：从[官网](https://www.rawtherapee.com/downloads/)下载安装
  - macOS：`brew install rawtherapee`
  - Linux：`sudo apt install rawtherapee`或使用相应的包管理器
- 选用的AI提供商的API密钥

## 安装

```bash
# 全局安装
npm install -g @tychenjiajun/art
```

## 使用方法

ART提供两种主要的操作模式：

1. 完整处理模式（默认）：
   ```bash
   # 生成PP3并处理图像
   art input.dng

   # 自定义输出路径
   art input.dng -o output.jpg    # 创建output.pp3和output.jpg
   art input.dng -o output.pp3    # 创建output.pp3和output.jpg
   ```

2. 仅PP3模式（用于RawTherapee GUI）：
   ```bash
   # 仅生成PP3配置文件
   art input.dng --pp3-only

   # 自定义PP3输出路径
   art input.dng --pp3-only -o custom.pp3
   ```

### 推荐实践

对于最佳处理效果：
- 🏁 处理相似照片序列时始终使用`--base`参数
- 🔧 使用现有PP3配置文件作为调整基准
- 🧩 将AI建议与您已验证的处理方案结合使用
- 🔄 在处理会话之间迭代优化基础文件

### 命令选项

```
art <input> [options]

参数：
  input                    输入RAW文件路径（DNG、NEF、CR2、ARW）

选项：
  -o, --output <path>     输出文件路径（默认为input.pp3或input_processed.jpg）
  --pp3-only              仅生成PP3文件，不处理图像
  -p, --prompt <text>     自定义AI分析提示文本
  --provider <n>          使用的AI提供商（默认："openai"）
  --model <n>             使用的模型名称（默认："gpt-4-vision-preview"）
  -v, --verbose           启用详细日志
  -k, --keep-preview      保留预览图片
  -q, --quality <n>       输出图像质量（0-100）
  --base <path>           基于此PP3文件进行改进
  -h, --help             显示帮助信息
  -V, --version          显示版本号
```

### 与RawTherapee的集成

ART以两种方式与RawTherapee无缝集成：

1. **自动处理**：默认情况下，ART使用RawTherapee的命令行工具（`rawtherapee-cli`）来：
   - 生成用于AI分析的预览JPEG（质量=80，色度二次采样=3）
   - 使用AI生成的PP3配置文件处理最终图像（质量=100）
   - 处理RawTherapee支持的各种RAW格式

2. **手动处理**：使用`--pp3-only`模式：
   - 生成PP3配置文件而不进行处理
   - 在RawTherapee的GUI中使用配置文件进行微调
   - 保存配置文件用于批量处理

### AI生成的PP3配置文件

`--base`选项使AI能够：
1. 保留现有配置文件中的有意调整
2. 进行针对性增强而非全面覆盖
3. 保持照片系列的外观一致性
4. 遵循已建立的色彩分级和色调风格

AI会分析您的照片并生成专注于以下方面的RawTherapee PP3配置文件：

AI分析您的照片并生成RawTherapee PP3配置文件，重点关注：

1. **曝光和色调**：
   - 自动曝光调整
   - 高光恢复
   - 阴影增强
   - 动态范围优化

2. **色彩和白平衡**：
   - 色温校正
   - 色调调整
   - 鲜艳度和饱和度
   - 色彩平衡

3. **细节增强**：
   - 锐化参数
   - 降噪（亮度/色度）
   - 纹理保持
   - 细节恢复

4. **高级处理**：
   - 色调曲线
   - Lab调整
   - 胶片模拟
   - 输出锐化

### 预览文件处理

在处理过程中，ART会：
1. 创建预览JPEG（质量=80）用于AI分析
2. 默认在处理后删除预览
3. 可以使用`-k`标志保留预览
4. 预览文件命名为`<input>_preview.jpg`

### AI提供商支持

ART支持多个AI提供商：
- OpenAI（默认）：GPT-4 Vision
- OpenAI兼容：OpenAI兼容API（如OpenRouter）
- Anthropic：Claude 3系列
- Google：Gemini Pro Vision
- xAI：Grok 语言模型

#### 设置API密钥

ART使用环境变量进行API密钥配置。您可以在shell中设置环境变量，或在工作目录中创建`.env`文件：

```bash
# OpenAI
export OPENAI_API_KEY=你的_openai_密钥

# OpenAI兼容（如OpenRouter）
export OPENAI_API_KEY=你的_openrouter_密钥
export OPENAI_BASE_URL=https://openrouter.ai/api/v1

# Anthropic
export ANTHROPIC_API_KEY=你的_anthropic_密钥

# Google
export GOOGLE_GENERATIVE_AI_API_KEY=你的_google_密钥

# xAI
export XAI_API_KEY=你的_xai_密钥
```

配置示例：
```bash
# 使用默认（OpenAI）
art input.dng

# 使用 Anthropic Claude 3 Sonnet
art input.dng --provider anthropic --model claude-3-sonnet-20240229

# 使用 Google Gemini Pro Vision
art input.dng --provider google --model gemini-pro-vision

# 使用 xAI Grok
art input.dng --provider xai --model grok-1

# 使用自定义提示
art input.dng -p "分析这张照片并创建自然的胶片风格"

# 设置输出质量
art input.dng -q 95

# 启用详细日志
art input.dng -v

# 使用基础PP3文件
art input.dng --base base.pp3  # 推荐用于最佳效果 - 基于现有配置文件改进
```

## 开发

```bash
# 安装依赖
pnpm install

# 运行测试
pnpm test

# 构建项目
pnpm build
```

## 许可证

[GPL-2.0](LICENSE)（与RawTherapee使用相同的许可证）
