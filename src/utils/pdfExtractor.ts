// PDF Text Extraction Utility
// Uses PDF.js for client-side PDF text extraction

export interface PDFExtractionResult {
  text: string;
  pageCount: number;
  title?: string;
  author?: string;
  pages?: Array<{
    pageNumber: number;
    text: string;
  }>;
}

export class PDFExtractor {

  // Extract text from PDF file using PDF.js
  static async extractTextFromFile(file: File): Promise<PDFExtractionResult> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = async function(e) {
        try {
          const typedArray = new Uint8Array(e.target?.result as ArrayBuffer);

          // Load PDF.js dynamically
          const pdfjsLib = await import('pdfjs-dist');

          // Set worker source from the installed package
          pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
            'pdfjs-dist/build/pdf.worker.min.mjs',
            import.meta.url
          ).toString();

          const pdf = await pdfjsLib.getDocument({
            data: typedArray,
            // Disable font loading to avoid warnings
            disableFontFace: true,
            // Use built-in fonts instead of downloading
            useSystemFonts: true
          }).promise;

          const extractedPages: Array<{ pageNumber: number; text: string }> = [];
          let fullText = '';

          // Extract text from each page
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();

            const pageText = textContent.items
              .map((item: any) => item.str)
              .join(' ')
              .replace(/\s+/g, ' ')
              .trim();

            extractedPages.push({
              pageNumber: i,
              text: pageText
            });

            fullText += pageText + '\n\n';
          }

          // Get metadata
          const metadata = await pdf.getMetadata();

          resolve({
            text: fullText.trim(),
            pageCount: pdf.numPages,
            title: metadata?.info?.Title || undefined,
            author: metadata?.info?.Author || undefined,
            pages: extractedPages
          });

        } catch (error) {
          console.error('Error extracting PDF text:', error);
          reject(new Error(`Failed to extract text from PDF: ${error}`));
        }
      };

      reader.onerror = () => {
        reject(new Error('Failed to read PDF file'));
      };

      reader.readAsArrayBuffer(file);
    });
  }

  // Simple text cleaning for better chunking
  static cleanExtractedText(text: string): string {
    return text
      // Remove excessive whitespace
      .replace(/\s+/g, ' ')
      // Remove page break artifacts
      .replace(/\f/g, '\n')
      // Clean up common PDF artifacts
      .replace(/[^\S\n]+/g, ' ')
      // Remove multiple consecutive newlines
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      // Trim
      .trim();
  }

  // Check if file is a PDF
  static isPDFFile(file: File): boolean {
    return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
  }

  // Estimate processing time based on file size
  static estimateProcessingTime(fileSize: number): number {
    // Rough estimate: ~1 second per 100KB for extraction + embedding
    return Math.max(5, Math.ceil(fileSize / (100 * 1024)));
  }
}