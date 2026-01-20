/**
 * AI Analysis Service
 * High-level service for tender document analysis using AI providers
 */

import aiManager from './ai-provider.service.js';

class AIAnalysisService {
  /**
   * Generate analysis prompt for tender documents
   */
  generateAnalysisPrompt(extractedText) {
    return `
Bạn là chuyên gia phân tích hồ sơ thầu với nhiều năm kinh nghiệm. Hãy phân tích chi tiết hồ sơ thầu sau đây và trả về kết quả dạng JSON.

# HỒ SƠ THẦU CẦN PHÂN TÍCH:
${extractedText.substring(0, 15000)} ${extractedText.length > 15000 ? '...(truncated)' : ''}

# YÊU CẦU PHÂN TÍCH:

1. PHÂN LOẠI HỒ SƠ THẦU
   - Xác định loại hình: Đấu thầu Online rộng rãi, Online cạnh tranh, hay Online Mua khẩn (khẩn cấp qua email)
   - Căn cứ vào: thời hạn, quy mô, yêu cầu trong hồ sơ

2. NGƯỜI XÉT DUYỆT CUỐI CÙNG
   - Tìm tên và chức danh người có quyền phê duyệt cuối cùng
   - Thường là Giám đốc, Trưởng phòng hoặc chức danh tương đương
3. TÊN NHÀ THẦU / ĐƠN VỊ NỘP HỒ SƠ
   - Tìm tên công ty/đơn vị nộp hồ sơ (nếu đây là hồ sơ dự thầu)
   - Nếu là thông báo mời thầu, để trống

4. TIỀN KHẢ THI (FEASIBILITY)
   - Đánh giá khả năng thực hiện (điểm 0-100)
   - Tỉ lệ thắng thầu ước tính (0-100%)
   - Mức độ cơ hội: HIGH/MEDIUM/LOW
   - Lý do đánh giá

4. RỦI RO & LƯU Ý
   - Liệt kê các rủi ro tiềm ẩn
   - Mức độ rủi ro: LOW/MEDIUM/HIGH/CRITICAL
   - Đề xuất cách giảm thiểu (nếu có)

5. PHÂN LOẠI PHÒNG BAN
   - Phòng ban chính liên quan: Mua hàng, Kỹ thuật, hoặc cả hai
   - Căn cứ vào tính chất công việc trong hồ sơ

# FORMAT JSON TRẢ VỀ:
{
  "classification": {
    "documentType": "ONLINE_WIDE" | "ONLINE_COMPETITIVE" | "ONLINE_URGENT",
    "confidence": 0-100,
    "reasoning": "lý do phân loại"
  },
  "finalReviewer": {
    "name": "Tên người xét duyệt",
    "title": "Chức danh",
    "confidence": 0-100
  },
  "vendorName": "Tên công ty/nhà thầu nộp hồ sơ",

  "feasibility": {
    "score": 0-100,
    "winProbability": 0-100,
    "opportunityLevel": "HIGH" | "MEDIUM" | "LOW",
    "factors": {
      "technical": "đánh giá khả năng kỹ thuật",
      "financial": "đánh giá tài chính",
      "timeline": "đánh giá thời gian",
      "experience": "đánh giá kinh nghiệm"
    },
    "reasoning": "giải thích chi tiết"
  },
  "risks": [
    {
      "type": "Timeline Risk" | "Budget Risk" | "Compliance Risk" | "Technical Risk",
      "level": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
      "description": "mô tả rủi ro",
      "mitigation": "cách giảm thiểu",
      "impact": "ảnh hưởng tiềm ẩn"
    }
  ],
  "department": {
    "primary": "PROCUREMENT" | "TECHNICAL" | "MIXED",
    "reasoning": "lý do phân loại phòng ban",
    "involvement": {
      "procurement": 0-100,
      "technical": 0-100
    }
  },
  "keyRequirements": ["yêu cầu 1", "yêu cầu 2", "..."],
  "importantDeadlines": [
    {
      "milestone": "tên mốc thời gian",
      "date": "ngày/tháng/năm nếu có",
      "importance": "HIGH" | "MEDIUM" | "LOW"
    }
  ],
  "overallConfidence": 0-100,
  "recommendations": ["khuyến nghị 1", "khuyến nghị 2", "..."]
}

Hãy phân tích cẩn thận và trả về JSON hợp lệ. Nếu thiếu thông tin, hãy đánh dấu confidence thấp.
`;
  }

  /**
   * Generate analysis prompt for tender documents (Vision Version)
   */
  generateVisionAnalysisPrompt() {
    return `
Bạn là chuyên gia phân tích hồ sơ thầu. Hãy quan sát các hình ảnh đính kèm (là các trang của hồ sơ thầu) và phân tích chi tiết.
Trả về kết quả dưới dạng JSON duy nhất với cấu trúc sau:

{
  "classification": {
    "documentType": "ONLINE_WIDE" | "ONLINE_COMPETITIVE" | "ONLINE_URGENT",
    "confidence": 0-100,
    "reasoning": "giải thích dựa trên hình ảnh"
  },
  "finalReviewer": {
    "name": "Tên người xét duyệt",
    "title": "Chức danh"
  },
  "vendorName": "Tên nhà thầu",

  "feasibility": {
    "score": 0-100,
    "winProbability": 0-100,
    "opportunityLevel": "HIGH" | "MEDIUM" | "LOW",
    "reasoning": "giải giải thích"
  },
  "complianceMatrix": [
    {
      "category": "JURIDICAL" | "TECHNICAL" | "FINANCIAL",
      "requirement": "tên yêu cầu cụ thể (ví dụ: Doanh thu 3 năm gần nhất > 10 tỷ)",
      "status": "MET" | "NOT_MET" | "UNKNOWN",
      "description": "trích dẫn hoặc giải thích từ hồ sơ"
    }
  ],
  "lineItems": [
    {
      "name": "Tên hạng mục/vật tư",
      "unit": "DVT",
      "quantity": số lượng,
      "estimatedUnitPrice": giá dự kiến trên 1 đơn vị,
      "notes": "ghi chú thêm"
    }
  ],
  "biddingSuggestions": {
    "recommendedTotal": tổng giá đề xuất,
    "riskPremiumPercent": % phí rủi ro đề xuất,
    "reasoning": "lý do đề xuất giá"
  },
  "risks": [
    {
      "type": "Timeline Risk" | "Budget Risk" | "Compliance Risk" | "Technical Risk",
      "level": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
      "description": "mô tả rủi ro"
    }
  ],
  "department": {
    "primary": "PROCUREMENT" | "TECHNICAL" | "MIXED"
  },
  "overallConfidence": 0-100
}

LƯU Ý QUAN TRỌNG:
1. Hãy tìm kỹ các bảng biểu về tiêu chuẩn đánh giá để lập Ma trận Tuân thủ.
2. Hãy tìm bảng BOQ (Khối lượng) để liệt kê các Line Items. Nếu thấy giá kế hoạch của chủ đầu tư, hãy dùng nó làm estimatedUnitPrice.
3. Nếu là PDF/Ảnh quét, hãy cố gắng đọc các con số và điều khoản quan trọng.
`;
  }

  /**
   * Analyze tender document using Vision (images)
   */
  async analyzeTenderVision(imagePaths, options = {}) {
    const startTime = Date.now();
    try {
      const prompt = this.generateVisionAnalysisPrompt();

      const result = await aiManager.analyzeVisionWithFallback(imagePaths, {
        prompt,
        provider: options.provider || 'gemini'
      });

      if (!result.success) {
        throw new Error(`Vision analysis failed: ${result.error}`);
      }

      const processingTime = (Date.now() - startTime) / 1000;
      const analysis = this.normalizeAnalysisResult(result.result);

      return {
        success: true,
        provider: result.provider,
        model: result.model,
        analysis,
        processingTime,
        rawResponse: result.result
      };
    } catch (error) {
      console.error('Vision Analysis error:', error.message);
      return {
        success: false,
        error: error.message,
        processingTime: (Date.now() - startTime) / 1000
      };
    }
  }

  /**
   * Generate analysis prompt for PDF documents (Native)
   */
  generatePDFAnalysisPrompt() {
    return `
Bạn là chuyên gia phân tích hồ sơ thầu. Hãy phân tích tài liệu PDF đính kèm và trích xuất thông tin chi tiết.
Trả về kết quả dưới dạng JSON duy nhất với cấu trúc sau:

{
  "classification": {
    "documentType": "ONLINE_WIDE" | "ONLINE_COMPETITIVE" | "ONLINE_URGENT",
    "confidence": 0-100,
    "reasoning": "giải thích chi tiết dựa trên tài liệu"
  },
  "finalReviewer": {
    "name": "Tên người xét duyệt (nếu có)",
    "title": "Chức danh"
  },
  "vendorName": "Tên đơn vị mời thầu / chủ đầu tư",

  "feasibility": {
    "score": 0-100,
    "winProbability": 0-100,
    "opportunityLevel": "HIGH" | "MEDIUM" | "LOW",
    "reasoning": "đánh giá dựa trên yêu cầu và điều kiện"
  },
  "complianceMatrix": [
    {
      "category": "JURIDICAL" | "TECHNICAL" | "FINANCIAL",
      "requirement": "tên yêu cầu cụ thể",
      "status": "MET" | "NOT_MET" | "UNKNOWN",
      "description": "trích dẫn từ hồ sơ"
    }
  ],
  "lineItems": [
    {
      "name": "Tên hạng mục/vật tư",
      "unit": "DVT",
      "quantity": số lượng (số),
      "estimatedUnitPrice": đơn giá dự toán (số),
      "notes": "ghi chú"
    }
  ],
  "biddingSuggestions": {
    "recommendedTotal": tổng giá trị gói thầu (nếu có),
    "riskPremiumPercent": % dự phòng,
    "reasoning": "nhận định về giá"
  },
  "risks": [
    {
      "type": "Timeline Risk" | "Budget Risk" | "Compliance Risk" | "Technical Risk",
      "level": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
      "description": "mô tả rủi ro",
      "mitigation": "đề xuất giảm thiểu"
    }
  ],
  "department": {
    "primary": "PROCUREMENT" | "TECHNICAL" | "MIXED",
    "reasoning": "lý do"
  },
  "keyRequirements": ["yêu cầu quan trọng 1", "yêu cầu quan trọng 2"],
  "importantDeadlines": [
     { "milestone": "Mốc thời gian", "date": "dd/mm/yyyy", "importance": "HIGH|MEDIUM" }
  ],
  "overallConfidence": 0-100,
  "recommendations": ["khuyến nghị hành động"]
}

LƯU Ý QUAN TRỌNG:
1. Đọc và trích xuất TOÀN BỘ các hạng mục mời thầu vào mảng "lineItems".
2. Tìm kiếm các tiêu chí đánh giá (đạt/không đạt, thang điểm) đưa vào "complianceMatrix".
3. Xác định rõ thời điểm đóng thầu và các mốc quan trọng.
`;
  }

  /**
   * Analyze PDF using Native Gemini
   */
  async analyzeTenderPDF(pdfPath, options = {}) {
    const startTime = Date.now();
    console.log('🤖 AI Analysis (PDF Native Mode)...');

    try {
      const prompt = this.generatePDFAnalysisPrompt();

      const result = await aiManager.analyzePDF(pdfPath, {
        ...options,
        prompt: prompt
      });

      if (!result.success) {
        throw new Error(result.error);
      }
      // ... rest of function

      const processingTime = (Date.now() - startTime) / 1000;

      // Normalize result
      const analysis = this.normalizeAnalysisResult(result.result);

      return {
        success: true,
        analysis: analysis,
        provider: result.provider,
        usage: result.usage,
        processingTime,
        rawResponse: result.result
      };
    } catch (error) {
      console.error('AI Service Error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Analyze tender document
   */
  async analyzeTenderDocument(extractedText, options = {}) {
    const startTime = Date.now();

    try {
      const prompt = this.generateAnalysisPrompt(extractedText);

      // Use AI provider manager with fallback
      const result = await aiManager.analyzeWithFallback(extractedText, {
        prompt,
        maxTokens: options.maxTokens || 4096,
        provider: options.provider
      });

      if (!result.success) {
        throw new Error(`AI analysis failed: ${result.error}`);
      }

      const processingTime = (Date.now() - startTime) / 1000;

      // Validate and normalize result
      const analysis = this.normalizeAnalysisResult(result.result);

      return {
        success: true,
        provider: result.provider,
        model: result.model,
        analysis,
        usage: result.usage,
        processingTime,
        rawResponse: result.result
      };
    } catch (error) {
      console.error('AI Analysis error:', error.message);
      return {
        success: false,
        error: error.message,
        processingTime: (Date.now() - startTime) / 1000
      };
    }
  }

  /**
   * Normalize and validate AI analysis result
   */
  normalizeAnalysisResult(rawResult) {
    return {
      classification: rawResult.classification || {},
      finalReviewer: rawResult.finalReviewer || {},
      feasibility: rawResult.feasibility || {},
      risks: Array.isArray(rawResult.risks) ? rawResult.risks : [],
      complianceMatrix: Array.isArray(rawResult.complianceMatrix) ? rawResult.complianceMatrix : [],
      lineItems: Array.isArray(rawResult.lineItems) ? rawResult.lineItems : [],
      biddingSuggestions: rawResult.biddingSuggestions || {},
      department: rawResult.department || {},
      keyRequirements: rawResult.keyRequirements || [],
      importantDeadlines: rawResult.importantDeadlines || [],
      overallConfidence: rawResult.overallConfidence || 50,
      recommendations: rawResult.recommendations || [],
      vendorName: rawResult.vendorName || null
    };

  }

  /**
   * Find similar documents using embeddings (simplified version)
   */
  async findSimilarDocuments(documentText, existingDocuments, topK = 5) {
    // Simplified similarity based on keywords
    // In production, use vector embeddings (e.g., OpenAI embeddings API)

    const keywords = this.extractKeywords(documentText);

    const similarities = existingDocuments.map(doc => {
      const docKeywords = this.extractKeywords(doc.extractedText || '');
      const similarity = this.calculateSimilarity(keywords, docKeywords);

      return {
        documentId: doc.id,
        similarityScore: similarity,
        title: doc.title,
        documentType: doc.documentType
      };
    });

    return similarities
      .sort((a, b) => b.similarityScore - a.similarityScore)
      .slice(0, topK)
      .filter(s => s.similarityScore > 30); // Only return if > 30% similar
  }

  /**
   * Extract keywords from text (simplified)
   */
  extractKeywords(text) {
    const commonWords = new Set(['và', 'của', 'các', 'có', 'được', 'cho', 'trong', 'để', 'này', 'là']);

    return text
      .toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 3 && !commonWords.has(word))
      .slice(0, 100); // Top 100 words
  }

  /**
   * Calculate text similarity (Jaccard similarity)
   */
  calculateSimilarity(keywords1, keywords2) {
    const set1 = new Set(keywords1);
    const set2 = new Set(keywords2);

    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);

    return union.size > 0 ? (intersection.size / union.size) * 100 : 0;
  }

  /**
   * Generate recommendations based on analysis
   */
  generateRecommendations(analysis) {
    const recommendations = [];

    // Based on feasibility
    if (analysis.feasibility?.score < 50) {
      recommendations.push('Cân nhắc kỹ trước khi tham gia do điểm khả thi thấp');
    }

    // Based on risks
    const criticalRisks = analysis.risks?.filter(r => r.level === 'CRITICAL') || [];
    if (criticalRisks.length > 0) {
      recommendations.push(`Có ${criticalRisks.length} rủi ro nghiêm trọng cần xử lý ngay`);
    }

    // Based on win probability
    if (analysis.feasibility?.winProbability > 70) {
      recommendations.push('Cơ hội thắng cao, nên ưu tiên tham gia');
    }

    return recommendations;
  }
}

export default new AIAnalysisService();
