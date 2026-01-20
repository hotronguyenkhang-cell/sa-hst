/**
 * AI Provider Abstraction Layer
 * Supports: OpenAI GPT-4 Vision, Google Gemini Pro Vision, Anthropic Claude
 * 
 * Strategy Pattern for flexible provider switching
 */

import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleAIFileManager } from '@google/generative-ai/server';
import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs/promises';
import path from 'path';

// Base Provider Interface
class AIProvider {
  constructor(name, config) {
    this.name = name;
    this.config = config;
  }

  async analyzeDocument(extractedText, options = {}) {
    throw new Error('Method not implemented');
  }

  async analyzeImage(imagePath, prompt) {
    throw new Error('Method not implemented');
  }
}

// OpenAI Provider
class OpenAIProvider extends AIProvider {
  constructor(config) {
    super('openai', config);
    this.client = new OpenAI({
      apiKey: config.apiKey || process.env.OPENAI_API_KEY,
    });
    this.model = config.model || process.env.OPENAI_MODEL || 'gpt-4-vision-preview';
  }

  async analyzeDocument(extractedText, options = {}) {
    const { prompt, maxTokens = 4096 } = options;

    try {
      const response = await this.client.chat.completions.create({
        model: this.model.includes('vision') ? 'gpt-4-turbo-preview' : this.model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert tender document analyst. Analyze documents and provide structured, accurate insights in Vietnamese.'
          },
          {
            role: 'user',
            content: prompt || `Phân tích hồ sơ thầu sau:\n\n${extractedText}`
          }
        ],
        max_tokens: maxTokens,
        temperature: 0.3, // Lower temperature for more consistent analysis
        response_format: { type: 'json_object' }
      });

      return {
        success: true,
        provider: this.name,
        model: this.model,
        result: JSON.parse(response.choices[0].message.content),
        usage: {
          promptTokens: response.usage.prompt_tokens,
          completionTokens: response.usage.completion_tokens,
          totalTokens: response.usage.total_tokens
        }
      };
    } catch (error) {
      console.error(`OpenAI Analysis Error:`, error.message);
      return {
        success: false,
        provider: this.name,
        error: error.message
      };
    }
  }

  async analyzeImage(imagePath, prompt) {
    throw new Error('Image analysis not yet implemented for OpenAI');
  }

  async analyzeVision(imagePaths, prompt) {
    throw new Error('Vision analysis not yet implemented for OpenAI');
  }
}

// Google Gemini Provider
class GeminiProvider extends AIProvider {
  constructor(config) {
    super('gemini', config);
    this.apiKey = config.apiKey || process.env.GOOGLE_API_KEY;
    this.client = new GoogleGenerativeAI(this.apiKey);
    this.fileManager = new GoogleAIFileManager(this.apiKey);
    this.modelName = config.model || process.env.GEMINI_MODEL || 'gemini-1.5-flash';
  }

  async uploadFile(filePath, mimeType) {
    try {
      console.log(`📤 Uploading file to Gemini: ${filePath}`);
      const uploadResponse = await this.fileManager.uploadFile(filePath, {
        mimeType,
        displayName: path.basename(filePath),
      });

      console.log(`✅ Uploaded file: ${uploadResponse.file.name} (${uploadResponse.file.uri})`);
      return uploadResponse.file;
    } catch (error) {
      console.error('Gemini Upload Error:', error);
      throw error;
    }
  }

  async analyzeDocument(extractedText, options = {}) {
    const { prompt } = options;

    try {
      const model = this.client.getGenerativeModel({ model: this.modelName });

      const fullPrompt = prompt || `
Bạn là chuyên gia phân tích hồ sơ thầu. Phân tích văn bản sau và trả về kết quả dạng JSON:

${extractedText}

Trả về JSON với format:
{
  "documentType": "ONLINE_WIDE|ONLINE_COMPETITIVE|ONLINE_URGENT",
  "finalReviewer": "tên người xét duyệt",
  "department": "PROCUREMENT|TECHNICAL|MIXED",
  "feasibilityScore": 0-100,
  "winProbability": 0-100,
  "opportunityLevel": "HIGH|MEDIUM|LOW",
  "risks": [{"type": "...", "level": "LOW|MEDIUM|HIGH|CRITICAL", "description": "..."}],
  "reasoning": "lý do phân tích"
}
      `;

      const result = await model.generateContent(fullPrompt);
      const response = await result.response;
      const text = response.text();

      // Extract JSON from response (Gemini sometimes wraps in markdown)
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      const parsedResult = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(text);

      return {
        success: true,
        provider: this.name,
        model: this.modelName,
        result: parsedResult,
        usage: {
          totalTokens: response.usageMetadata?.totalTokenCount || 0
        }
      };
    } catch (error) {
      console.error(`Gemini Analysis Error:`, error.message);
      return {
        success: false,
        provider: this.name,
        error: error.message
      };
    }
  }

  /**
   * PDF Analysis using Gemini 1.5 Native Support
   */
  async analyzePDF(pdfPath, options = {}) {
    try {
      // 1. Upload file
      const file = await this.uploadFile(pdfPath, 'application/pdf');

      // 2. Generate content
      const model = this.client.getGenerativeModel({ model: this.modelName });

      const prompt = options.prompt || `
Bạn là chuyên gia phân tích hồ sơ thầu. Hãy phân tích tài liệu đính kèm và trích xuất thông tin quan trọng.

Yêu cầu output JSON format:
{
  "classification": {
    "documentType": "ONLINE_WIDE|ONLINE_COMPETITIVE|ONLINE_URGENT",
    "notes": "..."
  },
  "finalReviewer": { "name": "...", "role": "..." },
  "department": { "primary": "...", "support": "..." },
  "feasibility": {
    "score": 0-100,
    "winProbability": 0-100,
    "opportunityLevel": "HIGH|MEDIUM|LOW",
    "reasoning": "..."
  },
  "risks": [
    { "type": "...", "level": "LOW|MEDIUM|HIGH", "description": "...", "mitigation": "..." }
  ],
  "recommendations": ["..."],
  "biddingSuggestions": ["..."]
}
      `;

      const result = await model.generateContent([
        {
          fileData: {
            mimeType: file.mimeType,
            fileUri: file.uri,
          },
        },
        { text: prompt },
      ]);

      const response = await result.response;
      const text = response.text();

      // Parse JSON
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      const parsedResult = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(text);

      return {
        success: true,
        provider: this.name,
        model: this.modelName,
        result: parsedResult,
        usage: {
          totalTokens: response.usageMetadata?.totalTokenCount || 0
        }
      };

    } catch (error) {
      console.error(`Gemini PDF Analysis Error:`, error.message);
      return {
        success: false,
        provider: this.name,
        error: error.message
      };
    }
  }

  /**
   * Multi-modal analysis using Vision capabilities
   * @param {string[]} imagePaths Array of local image paths
   * @param {string} prompt Prompt for analysis
   */
  async analyzeVision(imagePaths, prompt) {
    try {
      const model = this.client.getGenerativeModel({ model: this.modelName });

      // Load images into Gemini Parts
      const imageParts = await Promise.all(
        imagePaths.map(async (p) => {
          const buffer = await fs.readFile(p);
          return {
            inlineData: {
              data: buffer.toString('base64'),
              mimeType: 'image/jpeg'
            }
          };
        })
      );

      const result = await model.generateContent([prompt, ...imageParts]);
      const response = await result.response;
      const text = response.text();

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      const parsedResult = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(text);

      return {
        success: true,
        provider: this.name,
        model: this.modelName,
        result: parsedResult,
        usage: {
          totalTokens: response.usageMetadata?.totalTokenCount || 0
        }
      };
    } catch (error) {
      console.error(`Gemini Vision Error:`, error.message);
      return {
        success: false,
        provider: this.name,
        error: error.message
      };
    }
  }
}

// Anthropic Claude Provider
class ClaudeProvider extends AIProvider {
  constructor(config) {
    super('anthropic', config);
    this.client = new Anthropic({
      apiKey: config.apiKey || process.env.ANTHROPIC_API_KEY,
    });
    this.model = config.model || process.env.CLAUDE_MODEL || 'claude-3-sonnet-20240229';
  }

  async analyzeDocument(extractedText, options = {}) {
    const { prompt, maxTokens = 4096 } = options;

    try {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: maxTokens,
        messages: [
          {
            role: 'user',
            content: prompt || `Phân tích hồ sơ thầu sau và trả về JSON:\n\n${extractedText}`
          }
        ],
        temperature: 0.3
      });

      const text = response.content[0].text;
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      const parsedResult = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(text);

      return {
        success: true,
        provider: this.name,
        model: this.model,
        result: parsedResult,
        usage: {
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens,
          totalTokens: response.usage.input_tokens + response.usage.output_tokens
        }
      };
    } catch (error) {
      console.error(`Claude Analysis Error:`, error.message);
      return {
        success: false,
        provider: this.name,
        error: error.message
      };
    }
  }
}

// Provider Factory & Manager
class AIProviderManager {
  constructor() {
    this.providers = new Map();
    this.initializeProviders();
  }

  initializeProviders() {
    // Initialize based on available API keys
    if (process.env.OPENAI_API_KEY) {
      this.providers.set('openai', new OpenAIProvider({}));
    }

    if (process.env.GOOGLE_API_KEY) {
      this.providers.set('gemini', new GeminiProvider({}));
    }

    if (process.env.ANTHROPIC_API_KEY) {
      this.providers.set('anthropic', new ClaudeProvider({}));
    }

    if (this.providers.size === 0) {
      console.warn('⚠️  No AI providers configured! Please set API keys in .env');
    }
  }

  getProvider(providerName = process.env.AI_PROVIDER || 'auto') {
    if (providerName === 'auto') {
      // Return first available provider
      return this.providers.values().next().value;
    }

    const provider = this.providers.get(providerName);

    if (!provider) {
      throw new Error(`Provider "${providerName}" not available. Available: ${Array.from(this.providers.keys()).join(', ')}`);
    }

    return provider;
  }

  async analyzeWithFallback(extractedText, options = {}) {
    const preferredProvider = options.provider || process.env.AI_PROVIDER;

    // Try preferred provider first
    if (preferredProvider && preferredProvider !== 'auto') {
      const provider = this.getProvider(preferredProvider);
      const result = await provider.analyzeDocument(extractedText, options);

      if (result.success) {
        return result;
      }

      console.warn(`Provider ${preferredProvider} failed, trying fallback...`);
    }

    // Try all available providers
    for (const [name, provider] of this.providers) {
      if (name === preferredProvider) continue; // Already tried

      console.log(`Trying fallback provider: ${name}`);
      const result = await provider.analyzeDocument(extractedText, options);

      if (result.success) {
        return result;
      }
    }

    throw new Error('All AI providers failed');
  }

  async analyzeVisionWithFallback(imagePaths, options = {}) {
    const preferredProvider = options.provider || process.env.AI_PROVIDER;

    // Gemini is the only vision provider for now
    if (preferredProvider === 'gemini' || preferredProvider === 'auto' || !preferredProvider) {
      const provider = this.getProvider('gemini');
      const result = await provider.analyzeVision(imagePaths, options.prompt);

      if (result.success) {
        return result;
      }
    }

    throw new Error('Vision analysis failed or no vision-capable provider available');
  }

  async analyzePDF(pdfPath, options = {}) {
    const preferredProvider = options.provider || process.env.AI_PROVIDER;

    // Default to Gemini for PDF Analysis
    if (!preferredProvider || preferredProvider === 'gemini' || preferredProvider === 'auto') {
      const provider = this.getProvider('gemini');

      // Ensure provider supports analyzePDF
      if (typeof provider.analyzePDF === 'function') {
        return await provider.analyzePDF(pdfPath, options);
      }
    }

    throw new Error('No PDF-capable provider available (requires Gemini)');
  }

  listAvailableProviders() {
    return Array.from(this.providers.keys());
  }
}

// Singleton instance
const aiManager = new AIProviderManager();

export default aiManager;
export { OpenAIProvider, GeminiProvider, ClaudeProvider, AIProviderManager };
