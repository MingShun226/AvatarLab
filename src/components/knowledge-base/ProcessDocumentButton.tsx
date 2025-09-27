import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { RAGService } from '@/services/ragService';
import { PDFExtractor } from '@/utils/pdfExtractor';
import { supabase } from '@/integrations/supabase/client';
import { FileText, Loader2 } from 'lucide-react';

interface ProcessDocumentButtonProps {
  fileId: string;
  fileName: string;
  userId: string;
  avatarId: string;
  contentType?: string;
  onProcessingComplete?: () => void;
}

export const ProcessDocumentButton = ({
  fileId,
  fileName,
  userId,
  avatarId,
  contentType,
  onProcessingComplete
}: ProcessDocumentButtonProps) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const processDocument = async () => {
    setIsProcessing(true);

    try {
      // Check if it's a PDF
      if (contentType !== 'application/pdf') {
        toast({
          title: "Unsupported File Type",
          description: "Currently only PDF files can be processed for RAG.",
          variant: "destructive"
        });
        return;
      }

      // Get the file record to find the storage path
      const { data: fileRecord, error: fileError } = await supabase
        .from('avatar_knowledge_files')
        .select('file_path')
        .eq('id', fileId)
        .single();

      if (fileError || !fileRecord) {
        throw new Error('File record not found in database');
      }

      // Get the file data from Supabase storage
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('knowledge-base')
        .download(fileRecord.file_path);

      if (downloadError) {
        throw new Error(`Failed to download file: ${downloadError.message}`);
      }

      // Convert blob to file for PDF extraction
      const file = new File([fileData], fileName, { type: contentType });

      toast({
        title: "Processing Started",
        description: `Extracting text from ${fileName}...`
      });

      // Extract text from PDF
      const extractionResult = await PDFExtractor.extractTextFromFile(file);

      if (!extractionResult.text || extractionResult.text.trim().length === 0) {
        throw new Error('No text could be extracted from the PDF');
      }

      // Clean the extracted text
      const cleanedText = PDFExtractor.cleanExtractedText(extractionResult.text);

      toast({
        title: "Text Extracted",
        description: `Processing ${cleanedText.length} characters into searchable chunks...`
      });

      // Process the document through RAG pipeline
      await RAGService.processDocument(
        userId,
        avatarId,
        fileId,
        cleanedText,
        fileName
      );

      toast({
        title: "Processing Complete",
        description: `${fileName} is now searchable in your knowledge base.`
      });

      // Call completion callback if provided
      if (onProcessingComplete) {
        onProcessingComplete();
      }

    } catch (error) {
      console.error('Error processing document:', error);

      toast({
        title: "Processing Failed",
        description: error instanceof Error ? error.message : 'Failed to process document',
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Button
      onClick={processDocument}
      disabled={isProcessing}
      variant="outline"
      size="sm"
      className="gap-2"
    >
      {isProcessing ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Processing...
        </>
      ) : (
        <>
          <FileText className="h-4 w-4" />
          Process for RAG
        </>
      )}
    </Button>
  );
};