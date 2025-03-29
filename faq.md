# AI-PP3 FAQ

## **1. Overview**
### **1.1 What is AI-PP3?**  
AI-PP3 is an advanced command-line tool that leverages multimodal artificial intelligence to create optimized RawTherapee processing profiles (.pp3 files) through intelligent image analysis. Unlike basic preset generators, this system combines computer vision with large language model reasoning to produce customized development parameters for raw photography processing.

### **1.2 How does AI-PP3 integrate with RawTherapee?**  
AI-PP3 generates customized processing profiles (.pp3 files) using AI analysis and passes them to RawTherapee’s command-line interface (CLI) for raw file development. The AI optimizes parameters like exposure and color balance, while RawTherapee handles the actual conversion. Users can specify output formats (JPEG, TIFF, PNG) and quality settings, with defaults to lossless configurations. This integration supports batch operations, platform compatibility, and repeatable results while preserving RawTherapee’s image quality.

---

## **2. Compatibility & File Support**
### **2.1 Which RAW file formats does AI-PP3 support?**  
AI-PP3 supports all RAW formats compatible with RawTherapee, including Canon CR2/CR3, Nikon NEF, Sony ARW, Fujifilm RAF, Adobe DNG, Phase One IIQ, and Pentax PEF. Compatibility updates automatically with RawTherapee’s releases.

### **2.2 Can AI-PP3 work without converting RAW files to DNG first?**  
Yes. AI-PP3 processes original RAW files (CR2, NEF, ARW, etc.) directly, leveraging RawTherapee’s native support without requiring DNG conversion.

---

## **3. AI Configuration & Processing**
### **3.1 How does the AI analyze and optimize PP3 profiles?**  
The AI analyzes a preview JPEG using vision models (e.g., GPT-4 Vision) to assess exposure, color balance, and detail. It then modifies existing PP3 parameters (via search/replace) or builds new profiles from scratch, ensuring compatibility with RawTherapee’s syntax.

### **3.2 How do I choose between AI providers (OpenAI, Anthropic, Google)?**  
Compare performance and pricing at [LLM Stats](https://llm-stats.com/). Switch providers by updating your API key—no code changes required.

### **3.3 Do I need API keys, and are there free options?**  
Yes, API keys are required. Free tiers include [OpenRouter’s free models](https://openrouter.ai/) and trial credits from providers like OpenAI. Local self-hosted models (e.g., Llama 3) are also supported.

### **3.4 How does the AI determine parameters like HighlightTonalWidth?**  
The AI starts with values from a base PP3 profile, analyzes a preview image, and suggests adjustments based on visual feedback and training data. Changes are constrained to parameters in the base profile.

### **3.5 What are the limitations of third-party AI models?**  
Third-party models lack raw-processing expertise, may hallucinate invalid values, and have opaque decision-making. AI-PP3 mitigates this by anchoring to base profiles and enforcing structured edits.

---

## **4. Technical Requirements**
### **4.1 What computational resources are required?**  
- **Cloud mode**: Basic laptop (uses provider servers).  
- **Local AI**: NVIDIA RTX 3060+ GPU for self-hosted models.  
- **RawTherapee**: Standard CPU/RAM for raw processing.

### **4.2 Does AI-PP3 support GPU acceleration?**  
AI-PP3 itself doesn’t require a GPU, but self-hosted AI models do. RawTherapee’s processing is CPU-bound.

---

## **5. Usage & Customization**
### **5.1 How does AI-PP3 handle batch processing?**  
Use scripting for basic or parallelized batches:  
```bash
# Parallel processing example
ls *.DNG | parallel -j8 ai-pp3 {} -o {.}.jpg
```

### **5.2 Can I customize AI prompts for PP3 adjustments?**  
Yes. Use the `-p`/`--prompt` flag to guide adjustments while maintaining PP3 validity.

### **5.3 Is AI-PP3 suitable for non-technical users?**  
It requires basic CLI familiarity. Non-coders can use pre-written scripts for common tasks.

### **5.4 Can AI-PP3 be integrated into automated workflows?**  
Yes. It supports CLI scripting, batch processing, and headless operation for CI/CD pipelines or nightly jobs.

---

## **6. Output Quality & Adjustments**
### **6.1 How do AI-generated profiles compare to manual edits?**  
AI profiles offer faster technical optimizations but may lack artistic nuance. Quality depends on the base profile—well-tuned bases yield professional results.

### **6.2 How does AI-PP3 handle artifacts or over-processing?**  
Safeguards include base profile constraints, preview validation, and structured edits. Use `-v` (verbose mode) to audit changes.

---

## **7. Privacy & Security**
### **7.1 How is user privacy and image data handled?**  
- **Cloud providers**: Sends compressed previews (not RAW files) subject to their policies.  
- **Local models**: No data leaves your machine.  
- RAW files are always processed locally.

---

## **8. Future Developments**
### **8.1 Will there be a custom AI model for PP3 optimization?**  
Not currently. General vision models (e.g., GPT-4o) are adapted via prompting, avoiding the cost ($500k+) of training a dedicated model.

### **8.2 Are there plans to support other software (e.g., ART)?**  
Yes. Compatibility with ART (`.arp` files) is planned due to format similarities and parameter overlap.
