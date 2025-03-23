# AI-PP3 - AI驱动的RawTherapee配置生成器

https://github.com/user-attachments/assets/95bf9e8d-0c97-442d-8068-a5d27e094f18

[![en](https://img.shields.io/badge/lang-en-red.svg)](README.md) [![zh-CN](https://img.shields.io/badge/lang-zh--CN-yellow.svg)](README.zh-CN.md) [![npm](https://img.shields.io/npm/dt/ai-pp3.svg)](https://www.npmjs.com/package/ai-pp3)

AI-PP3（AI RawTherapee）是一个命令行工具，它借助人工智能分析RAW照片，并为[RawTherapee](https://www.rawtherapee.com/)（一款强大的开源RAW图像处理软件）生成优化的处理配置文件。通过将计算机视觉AI与RawTherapee的先进处理能力相结合，AI-PP3帮助您自动获得专业级的处理效果。

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
npm install -g ai-pp3
```

## 使用方法

AI-PP3提供两种主要操作模式：

1. 全处理模式（默认）：

   ```bash
   # 生成PP3并处理图像
   ai-pp3 input.dng

   # 自定义输出路径
   ai-pp3 input.dng -o output.jpg    # 创建output.pp3和output.jpg
   ai-pp3 input.dng -o output.pp3    # 创建output.pp3和output.jpg
   ```

2. 仅PP3模式（用于RawTherapee GUI）：

   ```bash
   # 仅生成PP3配置文件
   ai-pp3 input.dng --pp3-only

   # 自定义PP3输出路径
   ai-pp3 input.dng --pp3-only -o custom.pp3
   ```

### 推荐实践

为获得最佳处理效果：
- 🏁 处理相似照片序列时始终使用`--base`参数
- 🔧 使用现有PP3配置文件作为调整基准
- 🧩 将AI建议与您已验证的处理方案结合使用
- 🔄 在处理会话之间迭代优化基础文件

### 命令选项

| 选项 | 描述 | 默认值 |
|--------|-------------|---------|
| `-o, --output <path>` | 输出文件路径 | `input.pp3`/`input_processed.jpg` |
| `--pp3-only` | 仅生成PP3，不进行处理 | `false` |
| `-p, --prompt <text>` | 自定义AI分析提示文本 | 内置提示 |
| `--provider <name>` | AI提供商 (`openai`, `anthropic`, `google`, `xai`) | `openai` |
| `--model <name>` | 模型版本 | `gpt-4-vision-preview` |
| `-v, --verbose` | 启用详细日志记录 | `false` |
| `-k, --keep-preview` | 保留预览JPEG | `false` |
| `-q, --quality <0-100>` | 输出图像质量 | `100` |
| `--sections <names>` | 要处理的PP3部分 | 所有部分 |
| `--base <path>` | 用于增量改进的基础PP3配置文件 | 无 |

### 与RawTherapee集成

AI-PP3以两种方式与RawTherapee无缝协作：

1. **自动处理**：默认情况下，AI-PP3使用RawTherapee的CLI（`rawtherapee-cli`）来：

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
  - 生成安全值范围内的PP3参数
  - 对现有PP3文件进行差异分析
  - 保留手动调整参数
  - 通过参数映射和版本感知继承进行优化

### 预览文件处理

在处理过程中，AI-PP3会：

1. 创建用于AI分析的预览JPEG（质量=80）
2. 默认情况下，处理后删除预览
3. 可以使用`-k`标志保留预览以供参考
4. 将预览命名为`<input>_preview.jpg`

### AI提供商支持

AI-PP3支持多个AI提供商：

- OpenAI（默认）：GPT - 4 Vision
- 兼容OpenAI的API：兼容OpenAI的API（例如OpenRouter）
- Anthropic：Claude 3系列
- Google：Gemini Pro Vision
- xAI：Grok语言模型

#### 设置API密钥

AI-PP3使用环境变量进行API密钥配置。您可以在shell中设置它们，也可以在工作目录中创建一个`.env`文件：

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
ai-pp3 input.dng

# 使用Anthropic Claude 3 Sonnet
ai-pp3 input.dng --provider anthropic --model claude-3-sonnet-20240229

# 使用Google Gemini Pro Vision
ai-pp3 input.dng --provider google --model gemini-pro-vision

# 使用xAI Grok
ai-pp3 input.dng --provider xai --model grok-1

# 使用自定义提示
ai-pp3 input.dng -p "分析这张照片并创建自然的胶片风格外观"

# 设置输出质量
ai-pp3 input.dng -q 95

# 启用详细日志记录
ai-pp3 input.dng -v

# 使用基础PP3文件
ai-pp3 input.dng --base base.pp3  # 推荐用于最佳效果 - 基于现有配置文件改进
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
