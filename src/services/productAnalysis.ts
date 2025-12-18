// Product image analysis service
// Analyzes uploaded product images to generate accurate descriptions for prompt customization

import { supabase } from '@/integrations/supabase/client';

export interface ProductAnalysis {
  productName: string;
  category: string;
  keyFeatures: string[];
  colors: string[];
  materials?: string[];
  style?: string;
  detailedDescription: string;
}

/**
 * Analyze a product image to extract detailed information
 * Uses AI vision to understand what product was uploaded
 */
export async function analyzeProductImage(imageDataUrl: string): Promise<ProductAnalysis> {
  try {
    // Call edge function to analyze product image
    const { data, error } = await supabase.functions.invoke('analyze-product', {
      body: {
        image: imageDataUrl
      }
    });

    if (error) throw error;

    // Check if we got a structured JSON response
    if (data?.analysis && !data.analysis.raw) {
      // Direct structured response from OpenAI
      return {
        productName: data.analysis.productName || 'product',
        category: data.analysis.category || 'general',
        keyFeatures: data.analysis.keyFeatures || [],
        colors: data.analysis.colors || [],
        materials: data.analysis.materials || undefined,
        style: data.analysis.style || undefined,
        detailedDescription: data.analysis.detailedDescription || 'A quality product'
      };
    } else {
      // Fallback: parse text response
      const analysis = parseAnalysisResponse(data.analysis || '');
      return analysis;
    }

  } catch (error) {
    console.error('Error analyzing product image:', error);

    // Fallback to generic analysis
    return {
      productName: 'product',
      category: 'general',
      keyFeatures: ['quality design', 'practical functionality', 'attractive appearance'],
      colors: ['natural colors'],
      detailedDescription: 'A quality product with practical features and attractive design, suitable for everyday use.'
    };
  }
}

/**
 * Parse AI vision response into structured ProductAnalysis
 */
function parseAnalysisResponse(response: string): ProductAnalysis {
  // This is a simple parser - can be enhanced based on actual AI response format
  const lines = response.split('\n').filter(l => l.trim());

  const analysis: ProductAnalysis = {
    productName: 'product',
    category: 'general',
    keyFeatures: [],
    colors: [],
    detailedDescription: response.slice(0, 200)
  };

  // Extract information from response
  for (const line of lines) {
    const lower = line.toLowerCase();

    if (lower.includes('product') && lower.includes(':')) {
      analysis.productName = line.split(':')[1]?.trim() || 'product';
    }

    if (lower.includes('category') && lower.includes(':')) {
      analysis.category = line.split(':')[1]?.trim() || 'general';
    }

    if (lower.includes('color')) {
      const colorMatch = line.match(/colors?:?\s*(.+)/i);
      if (colorMatch) {
        analysis.colors = colorMatch[1].split(',').map(c => c.trim());
      }
    }

    if (lower.includes('material')) {
      const materialMatch = line.match(/materials?:?\s*(.+)/i);
      if (materialMatch) {
        analysis.materials = materialMatch[1].split(',').map(m => m.trim());
      }
    }

    if (lower.includes('feature')) {
      const featureMatch = line.match(/features?:?\s*(.+)/i);
      if (featureMatch) {
        analysis.keyFeatures = featureMatch[1].split(',').map(f => f.trim());
      }
    }

    if (lower.includes('style')) {
      const styleMatch = line.match(/style:?\s*(.+)/i);
      if (styleMatch) {
        analysis.style = styleMatch[1].trim();
      }
    }
  }

  return analysis;
}

/**
 * Customize a platform style prompt with actual product details
 */
export function customizePromptWithProduct(
  basePrompt: string,
  productAnalysis: ProductAnalysis
): string {
  // Replace generic "product" references with actual product description
  let customized = basePrompt;

  // Build a rich product description
  const productDesc = `${productAnalysis.productName}${
    productAnalysis.colors.length > 0 ? ` in ${productAnalysis.colors.join(' and ')} colors` : ''
  }${
    productAnalysis.materials && productAnalysis.materials.length > 0
      ? ` made of ${productAnalysis.materials.join(' and ')}`
      : ''
  }`;

  // Replace product references
  customized = customized.replace(/this product/gi, `this ${productAnalysis.productName}`);
  customized = customized.replace(/the product/gi, `the ${productAnalysis.productName}`);
  customized = customized.replace(/product/gi, productDesc);

  // Add key features context if mentioned
  if (productAnalysis.keyFeatures.length > 0 && customized.includes('features')) {
    const featuresText = ` highlighting ${productAnalysis.keyFeatures.slice(0, 3).join(', ')}`;
    customized = customized.replace(
      /features/i,
      `features${featuresText}`
    );
  }

  return customized;
}
