import { supabase } from '@/integrations/supabase/client';
import { apiKeyService } from './apiKeyService';

export interface TrainingData {
  id?: string;
  user_id: string;
  avatar_id: string;
  system_prompt?: string;
  user_prompt_template?: string;
  training_instructions?: string;
  training_type: 'prompt_update' | 'conversation_analysis' | 'file_upload';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  generated_prompts?: any;
  analysis_results?: any;
  improvement_notes?: string;
  created_at?: string;
  updated_at?: string;
  completed_at?: string;
}

export interface TrainingFile {
  id?: string;
  training_data_id: string;
  user_id: string;
  file_name: string;
  original_name: string;
  file_path: string;
  file_size: number;
  content_type: string;
  processing_status: 'pending' | 'processing' | 'completed' | 'failed';
  extracted_text?: string;
  analysis_data?: any;
  uploaded_at?: string;
  processed_at?: string;
}

export interface PromptVersion {
  id?: string;
  avatar_id: string;
  user_id: string;
  training_data_id?: string;
  parent_version_id?: string;
  base_version_id?: string;
  version_number: string;
  version_name?: string;
  description?: string;
  system_prompt: string;
  personality_traits?: string[];
  behavior_rules?: string[];
  response_style?: any;
  changes_from_parent?: any;
  inheritance_type?: 'full' | 'incremental' | 'override';
  is_active: boolean;
  is_published: boolean;
  usage_count?: number;
  rating?: number;
  feedback_notes?: string;
  created_at?: string;
  activated_at?: string;
}

export interface TrainingLog {
  id?: string;
  avatar_id: string;
  user_id: string;
  training_data_id: string;
  log_type: 'training_start' | 'processing_step' | 'completion' | 'error';
  message: string;
  details?: any;
  processing_step?: 'file_upload' | 'text_extraction' | 'analysis' | 'prompt_generation';
  progress_percentage?: number;
  created_at?: string;
}

export class TrainingService {

  // =============================================
  // TRAINING DATA MANAGEMENT
  // =============================================

  static async createTrainingSession(data: Omit<TrainingData, 'id' | 'created_at' | 'updated_at'>): Promise<TrainingData> {
    const { data: trainingData, error } = await supabase
      .from('avatar_training_data')
      .insert(data)
      .select()
      .single();

    if (error) throw new Error(`Failed to create training session: ${error.message}`);
    return trainingData;
  }

  static async updateTrainingData(id: string, updates: Partial<TrainingData>): Promise<TrainingData> {
    const { data, error } = await supabase
      .from('avatar_training_data')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Failed to update training data: ${error.message}`);
    return data;
  }

  static async getTrainingSession(id: string): Promise<TrainingData | null> {
    const { data, error } = await supabase
      .from('avatar_training_data')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw new Error(`Failed to get training session: ${error.message}`);
    }
    return data;
  }

  static async getAvatarTrainingSessions(avatarId: string, userId: string): Promise<TrainingData[]> {
    const { data, error } = await supabase
      .from('avatar_training_data')
      .select('*')
      .eq('avatar_id', avatarId)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Failed to get training sessions: ${error.message}`);
    return data || [];
  }

  // =============================================
  // FILE MANAGEMENT
  // =============================================

  static async uploadTrainingFile(
    trainingDataId: string,
    userId: string,
    file: File
  ): Promise<TrainingFile> {
    // Upload file to storage
    const fileName = `${userId}/${trainingDataId}/${Date.now()}-${file.name}`;

    const { data: storageData, error: storageError } = await supabase.storage
      .from('training-files')
      .upload(fileName, file);

    if (storageError) {
      throw new Error(`Failed to upload file: ${storageError.message}`);
    }

    // Save file metadata to database
    const fileData: Omit<TrainingFile, 'id' | 'uploaded_at'> = {
      training_data_id: trainingDataId,
      user_id: userId,
      file_name: fileName,
      original_name: file.name,
      file_path: storageData.path,
      file_size: file.size,
      content_type: file.type,
      processing_status: 'pending'
    };

    const { data, error } = await supabase
      .from('avatar_training_files')
      .insert(fileData)
      .select()
      .single();

    if (error) {
      // Clean up uploaded file if database insertion fails
      await supabase.storage.from('training-files').remove([fileName]);
      throw new Error(`Failed to save file metadata: ${error.message}`);
    }

    return data;
  }

  static async getTrainingFiles(trainingDataId: string): Promise<TrainingFile[]> {
    const { data, error } = await supabase
      .from('avatar_training_files')
      .select('*')
      .eq('training_data_id', trainingDataId)
      .order('uploaded_at', { ascending: false });

    if (error) throw new Error(`Failed to get training files: ${error.message}`);
    return data || [];
  }

  static async updateFileProcessingStatus(
    fileId: string,
    status: TrainingFile['processing_status'],
    extractedText?: string,
    analysisData?: any
  ): Promise<void> {
    const updates: any = {
      processing_status: status,
      processed_at: new Date().toISOString()
    };

    if (extractedText) updates.extracted_text = extractedText;
    if (analysisData) updates.analysis_data = analysisData;

    const { error } = await supabase
      .from('avatar_training_files')
      .update(updates)
      .eq('id', fileId);

    if (error) throw new Error(`Failed to update file status: ${error.message}`);
  }

  // =============================================
  // PROMPT VERSION MANAGEMENT
  // =============================================

  static async createPromptVersion(version: Omit<PromptVersion, 'id' | 'created_at'>): Promise<PromptVersion> {
    const { data, error } = await supabase
      .from('avatar_prompt_versions')
      .insert(version)
      .select()
      .single();

    if (error) throw new Error(`Failed to create prompt version: ${error.message}`);
    return data;
  }

  static async getActivePromptVersion(avatarId: string, userId: string): Promise<PromptVersion | null> {
    try {
      const { data, error } = await supabase
        .from('avatar_prompt_versions')
        .select('*')
        .eq('avatar_id', avatarId)
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Error querying avatar_prompt_versions:', error);
        throw new Error(`Failed to get active prompt version: ${error.message}`);
      }

      // Return first result or null if no results
      return data && data.length > 0 ? data[0] : null;
    } catch (error) {
      console.error('Exception in getActivePromptVersion:', error);
      return null; // Return null on any error to prevent app crashes
    }
  }

  static async getPromptVersions(avatarId: string, userId: string): Promise<PromptVersion[]> {
    try {
      const { data, error } = await supabase
        .from('avatar_prompt_versions')
        .select('*')
        .eq('avatar_id', avatarId)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error querying prompt versions:', error);
        throw new Error(`Failed to get prompt versions: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Exception in getPromptVersions:', error);
      return []; // Return empty array on error to prevent app crashes
    }
  }

  static async activatePromptVersion(versionId: string, avatarId: string, userId: string): Promise<void> {
    // First deactivate all versions for this avatar
    await supabase
      .from('avatar_prompt_versions')
      .update({ is_active: false, activated_at: null })
      .eq('avatar_id', avatarId)
      .eq('user_id', userId);

    // Then activate the specified version
    const { error } = await supabase
      .from('avatar_prompt_versions')
      .update({
        is_active: true,
        activated_at: new Date().toISOString()
      })
      .eq('id', versionId)
      .eq('user_id', userId);

    if (error) throw new Error(`Failed to activate prompt version: ${error.message}`);
  }

  // =============================================
  // VERSION LINEAGE METHODS
  // =============================================

  static async getVersionLineage(versionId: string): Promise<any[]> {
    const { data, error } = await supabase
      .rpc('get_version_lineage', { version_uuid: versionId });

    if (error) {
      console.error('Error getting version lineage:', error);
      return [];
    }
    return data || [];
  }

  static async getVersionDescendants(versionId: string): Promise<any[]> {
    const { data, error } = await supabase
      .rpc('get_version_descendants', { version_uuid: versionId });

    if (error) {
      console.error('Error getting version descendants:', error);
      return [];
    }
    return data || [];
  }

  static async createIncrementalVersion(
    avatarId: string,
    userId: string,
    trainingDataId: string,
    parentVersionId: string | null,
    versionData: Partial<PromptVersion>,
    changesFromParent?: any
  ): Promise<PromptVersion> {
    // Get the next version number
    const existingVersions = await this.getPromptVersions(avatarId, userId);
    const versionNumber = `v${existingVersions.length + 1}.0`;

    const version: Omit<PromptVersion, 'id' | 'created_at'> = {
      avatar_id: avatarId,
      user_id: userId,
      training_data_id: trainingDataId,
      parent_version_id: parentVersionId,
      version_number: versionNumber,
      version_name: versionData.version_name || `Training Update ${new Date().toLocaleDateString()}`,
      description: versionData.description || `Generated from training with ${parentVersionId ? 'incremental' : 'new'} data`,
      system_prompt: versionData.system_prompt || '',
      personality_traits: versionData.personality_traits || [],
      behavior_rules: versionData.behavior_rules || [],
      response_style: versionData.response_style || {},
      changes_from_parent: changesFromParent,
      inheritance_type: parentVersionId ? 'incremental' : 'full',
      is_active: false,
      is_published: false
    };

    const { data, error } = await supabase
      .from('avatar_prompt_versions')
      .insert(version)
      .select()
      .single();

    if (error) throw new Error(`Failed to create incremental version: ${error.message}`);
    return data;
  }

  // =============================================
  // LOGGING
  // =============================================

  static async logTrainingEvent(log: Omit<TrainingLog, 'id' | 'created_at'>): Promise<void> {
    const { error } = await supabase
      .from('avatar_training_logs')
      .insert(log);

    if (error) {
      console.error('Failed to log training event:', error);
      // Don't throw error for logging failures
    }
  }

  static async getTrainingLogs(trainingDataId: string): Promise<TrainingLog[]> {
    const { data, error } = await supabase
      .from('avatar_training_logs')
      .select('*')
      .eq('training_data_id', trainingDataId)
      .order('created_at', { ascending: true });

    if (error) throw new Error(`Failed to get training logs: ${error.message}`);
    return data || [];
  }

  // =============================================
  // AI PROCESSING
  // =============================================

  static async processTrainingData(
    trainingDataId: string,
    userId: string,
    avatarId: string,
    onProgress?: (step: string, percentage: number) => void
  ): Promise<PromptVersion> {
    try {
      // Get the training session
      const trainingData = await this.getTrainingSession(trainingDataId);
      if (!trainingData) throw new Error('Training session not found');

      // Log start of training
      await this.logTrainingEvent({
        avatar_id: avatarId,
        user_id: userId,
        training_data_id: trainingDataId,
        log_type: 'training_start',
        message: 'Training process started',
        progress_percentage: 0
      });

      // Update status to processing
      await this.updateTrainingData(trainingDataId, { status: 'processing' });

      onProgress?.('Initializing training process...', 10);

      // Get uploaded files for analysis
      const files = await this.getTrainingFiles(trainingDataId);

      let extractedContent = '';
      let conversationAnalysis: any = {};

      // Process uploaded files
      if (files.length > 0) {
        onProgress?.('Processing uploaded files...', 30);

        for (const file of files) {
          await this.updateFileProcessingStatus(file.id!, 'processing');

          try {
            if (file.content_type.startsWith('image/')) {
              // Process image files (conversation screenshots)
              const extractedText = await this.extractTextFromImage(file, userId);
              extractedContent += `\n--- From ${file.original_name} ---\n${extractedText}\n`;

              await this.updateFileProcessingStatus(
                file.id!,
                'completed',
                extractedText
              );
            } else if (file.content_type === 'text/plain') {
              // Process text files
              const textContent = await this.readTextFile(file);
              extractedContent += `\n--- From ${file.original_name} ---\n${textContent}\n`;

              await this.updateFileProcessingStatus(
                file.id!,
                'completed',
                textContent
              );
            }
          } catch (fileError) {
            console.error(`Error processing file ${file.original_name}:`, fileError);
            await this.updateFileProcessingStatus(file.id!, 'failed');
          }
        }
      }

      onProgress?.('Analyzing conversation patterns...', 50);

      // Analyze conversation patterns if we have extracted content
      if (extractedContent.trim()) {
        conversationAnalysis = await this.analyzeConversationPatterns(extractedContent, userId);
      }

      onProgress?.('Generating improved prompts...', 70);

      // Generate improved system prompt
      const generatedPrompts = await this.generateImprovedPrompts(
        trainingData.system_prompt || '',
        trainingData.training_instructions || '',
        extractedContent,
        conversationAnalysis,
        userId
      );

      onProgress?.('Creating new prompt version...', 90);

      // Get current version number for incrementing
      const existingVersions = await this.getPromptVersions(avatarId, userId);
      const versionNumber = `v${existingVersions.length + 1}.0`;

      // Create new prompt version
      const newVersion = await this.createPromptVersion({
        avatar_id: avatarId,
        user_id: userId,
        training_data_id: trainingDataId,
        version_number: versionNumber,
        version_name: `Training Update ${new Date().toLocaleDateString()}`,
        description: `Generated from training session with ${files.length} files`,
        system_prompt: generatedPrompts.system_prompt,
        personality_traits: generatedPrompts.personality_traits || [],
        behavior_rules: generatedPrompts.behavior_rules || [],
        response_style: generatedPrompts.response_style || {},
        is_active: false, // Don't auto-activate, let user choose
        is_published: false
      });

      // Update training data with results
      await this.updateTrainingData(trainingDataId, {
        status: 'completed',
        generated_prompts: generatedPrompts,
        analysis_results: conversationAnalysis,
        improvement_notes: generatedPrompts.improvement_notes,
        completed_at: new Date().toISOString()
      });

      // Log completion
      await this.logTrainingEvent({
        avatar_id: avatarId,
        user_id: userId,
        training_data_id: trainingDataId,
        log_type: 'completion',
        message: 'Training completed successfully',
        details: { version_id: newVersion.id, version_number: versionNumber },
        progress_percentage: 100
      });

      onProgress?.('Training completed!', 100);

      return newVersion;

    } catch (error) {
      // Update status to failed
      await this.updateTrainingData(trainingDataId, { status: 'failed' });

      // Log error
      await this.logTrainingEvent({
        avatar_id: avatarId,
        user_id: userId,
        training_data_id: trainingDataId,
        log_type: 'error',
        message: `Training failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { error: error instanceof Error ? error.stack : error }
      });

      throw error;
    }
  }

  // =============================================
  // AI HELPER METHODS
  // =============================================

  private static async extractTextFromImage(file: TrainingFile, userId: string): Promise<string> {
    // Get OpenAI API key
    const apiKey = await apiKeyService.getDecryptedApiKey(userId, 'OpenAI');
    if (!apiKey) {
      throw new Error('OpenAI API key required for image processing');
    }

    // Download the image from storage
    const { data: imageBlob, error } = await supabase.storage
      .from('training-files')
      .download(file.file_path);

    if (error) throw new Error(`Failed to download image: ${error.message}`);

    // Convert blob to base64
    const arrayBuffer = await imageBlob.arrayBuffer();
    const base64Image = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    const dataUrl = `data:${file.content_type};base64,${base64Image}`;

    // Use OpenAI Vision API to extract text
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4-vision-preview',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Extract all text from this conversation screenshot. Return only the conversation text, preserving the format and structure. If this appears to be a chat conversation, include who said what.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: dataUrl,
                  detail: 'high'
                }
              }
            ]
          }
        ],
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(`Vision API error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  }

  private static async readTextFile(file: TrainingFile): Promise<string> {
    const { data: textBlob, error } = await supabase.storage
      .from('training-files')
      .download(file.file_path);

    if (error) throw new Error(`Failed to download text file: ${error.message}`);

    return await textBlob.text();
  }

  private static async analyzeConversationPatterns(content: string, userId: string): Promise<any> {
    const apiKey = await apiKeyService.getDecryptedApiKey(userId, 'OpenAI');
    if (!apiKey) {
      throw new Error('OpenAI API key required for conversation analysis');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert conversation analyst. Analyze the provided conversation content and extract patterns, communication style, personality traits, and behavioral characteristics. Return a JSON object with your analysis.'
          },
          {
            role: 'user',
            content: `Analyze this conversation content and provide insights:\n\n${content}\n\nPlease return a JSON object with the following structure:
{
  "communication_style": {
    "formality_level": "casual/semi-formal/formal",
    "emoji_usage": "none/minimal/moderate/heavy",
    "response_length": "short/medium/long",
    "tone": "friendly/professional/humorous/etc"
  },
  "personality_traits": ["trait1", "trait2", ...],
  "behavioral_patterns": ["pattern1", "pattern2", ...],
  "conversation_topics": ["topic1", "topic2", ...],
  "response_characteristics": {
    "typical_greeting": "example",
    "common_phrases": ["phrase1", "phrase2", ...],
    "question_style": "direct/indirect/detailed",
    "supportiveness": "high/medium/low"
  }
}`
          }
        ],
        max_tokens: 1000,
        temperature: 0.3
      })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(`Analysis API error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const analysisText = data.choices[0]?.message?.content || '{}';

    try {
      return JSON.parse(analysisText);
    } catch {
      return { raw_analysis: analysisText };
    }
  }

  private static async generateImprovedPrompts(
    currentSystemPrompt: string,
    trainingInstructions: string,
    extractedContent: string,
    conversationAnalysis: any,
    userId: string
  ): Promise<any> {
    const apiKey = await apiKeyService.getDecryptedApiKey(userId, 'OpenAI');
    if (!apiKey) {
      throw new Error('OpenAI API key required for prompt generation');
    }

    const prompt = `You are an expert AI prompt engineer. Your task is to improve an avatar's system prompt based on training data and analysis.

Current System Prompt:
${currentSystemPrompt || 'No current prompt provided'}

Training Instructions:
${trainingInstructions || 'No specific instructions provided'}

Conversation Analysis:
${JSON.stringify(conversationAnalysis, null, 2)}

Extracted Conversation Content:
${extractedContent || 'No conversation content provided'}

Please generate an improved system prompt and related configuration. Return a JSON object with this structure:
{
  "system_prompt": "The complete improved system prompt that incorporates the training data",
  "personality_traits": ["trait1", "trait2", ...],
  "behavior_rules": ["rule1", "rule2", ...],
  "response_style": {
    "formality": "casual/semi-formal/formal",
    "emoji_usage": "none/minimal/moderate/heavy",
    "response_length": "concise/detailed/adaptive",
    "tone": "friendly/professional/supportive/etc"
  },
  "improvement_notes": "Summary of what was improved and why"
}

Focus on:
1. Incorporating the communication style from the analysis
2. Following the specific training instructions
3. Maintaining consistency with the conversation examples
4. Creating clear, actionable personality guidelines`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: 'You are an expert AI prompt engineer specializing in avatar personality development.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 2000,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(`Prompt generation API error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const generatedText = data.choices[0]?.message?.content || '{}';

    try {
      return JSON.parse(generatedText);
    } catch {
      return {
        system_prompt: generatedText,
        improvement_notes: 'Generated prompt (parsing failed)',
        personality_traits: [],
        behavior_rules: [],
        response_style: {}
      };
    }
  }

  // Delete a prompt version and its associated data
  static async deletePromptVersion(versionId: string, userId: string): Promise<void> {
    try {
      // First check if this is the active version
      const { data: activeCheck } = await supabase
        .from('avatar_prompt_versions')
        .select('is_active, avatar_id')
        .eq('id', versionId)
        .eq('user_id', userId)
        .single();

      if (activeCheck?.is_active) {
        throw new Error('Cannot delete the active version. Please activate a different version first.');
      }

      // Check if this version has child versions (descendants)
      const { data: children } = await supabase
        .from('avatar_prompt_versions')
        .select('id')
        .eq('parent_version_id', versionId)
        .eq('user_id', userId);

      if (children && children.length > 0) {
        throw new Error('Cannot delete this version as it has dependent child versions. Please delete child versions first.');
      }

      // Delete the prompt version (this will cascade to related training data due to FK constraints)
      const { error } = await supabase
        .from('avatar_prompt_versions')
        .delete()
        .eq('id', versionId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error deleting prompt version:', error);
        throw new Error(`Failed to delete version: ${error.message}`);
      }

      console.log('Successfully deleted prompt version:', versionId);
    } catch (error) {
      console.error('Error in deletePromptVersion:', error);
      throw error;
    }
  }
}