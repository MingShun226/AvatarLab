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

  static async updatePromptVersion(versionId: string, updates: Partial<PromptVersion>, userId?: string): Promise<void> {
    let query = supabase
      .from('avatar_prompt_versions')
      .update(updates)
      .eq('id', versionId);

    // Add user validation if provided
    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { error } = await query;

    if (error) throw new Error(`Failed to update prompt version: ${error.message}`);
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

      onProgress?.('Getting current avatar prompt...', 60);

      // Get the latest version's system prompt to build upon (progressive training)
      const existingVersions = await this.getPromptVersions(avatarId, userId);
      let currentAvatarPrompt: string;
      let parentVersionId: string | undefined;

      if (existingVersions.length > 0) {
        // Find the most recent version to build upon
        const latestVersion = existingVersions.reduce((latest, current) => {
          return new Date(current.created_at!) > new Date(latest.created_at!) ? current : latest;
        });
        currentAvatarPrompt = latestVersion.system_prompt;
        parentVersionId = latestVersion.id;
      } else {
        // No versions exist, use original avatar profile
        currentAvatarPrompt = await this.getAvatarSystemPrompt(avatarId, userId);
      }

      onProgress?.('Generating improved prompts...', 70);

      // Generate improved system prompt based on existing avatar prompt
      // Use training instructions as the main enhancement guide
      const enhancementInstructions = trainingData.training_instructions || 'Analyze the conversation examples and enhance the existing system prompt to match the communication style found in the examples.';

      const generatedPrompts = await this.generateImprovedPrompts(
        currentAvatarPrompt,
        enhancementInstructions,
        extractedContent,
        conversationAnalysis,
        userId
      );

      onProgress?.('Creating new prompt version...', 90);

      // Get current version number for incrementing (we already have existingVersions)
      const versionNumber = `v${existingVersions.length + 1}.0`;

      // Create new prompt version with parent reference
      const newVersion = await this.createPromptVersion({
        avatar_id: avatarId,
        user_id: userId,
        training_data_id: trainingDataId,
        parent_version_id: parentVersionId, // Link to parent version for progressive training
        version_number: versionNumber,
        version_name: `Training Update ${new Date().toLocaleDateString()}`,
        description: `Generated from training session with ${files.length} files`,
        system_prompt: generatedPrompts.system_prompt,
        personality_traits: generatedPrompts.personality_traits || [],
        behavior_rules: generatedPrompts.behavior_rules || [],
        response_style: generatedPrompts.response_style || {},
        inheritance_type: 'incremental', // Mark as incremental improvement
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
        model: 'gpt-4o',
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

    const prompt = `You are an expert conversation designer. Your task is to create CONVERSATION GUIDELINES that enhance how the avatar communicates, WITHOUT changing their core identity, background, or personality.

CURRENT AVATAR SYSTEM PROMPT (DO NOT MODIFY THE CORE CONTENT):
${currentSystemPrompt || 'You are a helpful AI assistant. Respond in a friendly and helpful manner.'}

USER'S CONVERSATION TRAINING INSTRUCTIONS:
${trainingInstructions}

CONVERSATION ANALYSIS RESULTS:
${JSON.stringify(conversationAnalysis || {}, null, 2).substring(0, 1000)}${JSON.stringify(conversationAnalysis || {}, null, 2).length > 1000 ? '...[truncated]' : ''}

CONVERSATION EXAMPLES:
${(extractedContent || 'No conversation content provided').substring(0, 2000)}${(extractedContent || '').length > 2000 ? '...[truncated for length]' : ''}

TASK: Create CONVERSATION FINE-TUNING GUIDELINES based on the user's instructions. DO NOT rewrite the avatar's identity, background, or core personality. Instead, focus on HOW they should communicate.

Your task is to:
1. PRESERVE the entire original system prompt exactly as-is
2. CREATE additional conversation guidelines that will be APPENDED to the original prompt
3. Focus on communication style, greeting patterns, response formatting, language usage, etc.
4. DO NOT change names, backgrounds, personality traits, or core avatar information

Create conversation guidelines for these areas based on the training instructions:
- Greeting behavior and introductions
- Communication style and tone
- Language usage (slang, formality, regional expressions)
- Response patterns and formatting
- Conversation flow and interaction style

Return ONLY a valid JSON object with this exact structure:
{
  "original_prompt_preserved": true,
  "conversation_guidelines": "Detailed conversation guidelines to be appended to the original prompt, focusing purely on HOW to communicate based on the training instructions",
  "enhanced_system_prompt": "The complete original prompt + the new conversation guidelines appended at the end",
  "behavior_rules": ["specific conversation behaviors from the training instructions"],
  "response_style": {
    "formality": "casual/formal based on training instructions",
    "emoji_usage": "minimal/moderate/frequent based on instructions",
    "response_length": "short/medium/long based on instructions",
    "tone": "friendly/professional/etc based on instructions"
  },
  "improvement_notes": "Summary of the conversation enhancements added (without changing core identity)"
}

CRITICAL: Keep the avatar's identity, background, and personality completely intact. Only add conversation guidelines that improve HOW they communicate, not WHO they are.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: 'You are an expert AI prompt engineer specializing in avatar personality development. You make precise minimal changes while preserving all original content.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 8000,
        temperature: 0.3
      })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(`Prompt generation API error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const generatedText = data.choices[0]?.message?.content || '{}';

    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(generatedText);

      // Transform the new format to the expected format
      if (parsed.enhanced_system_prompt) {
        return {
          system_prompt: parsed.enhanced_system_prompt,
          personality_traits: [],
          behavior_rules: parsed.behavior_rules || [],
          response_style: parsed.response_style || {},
          improvement_notes: parsed.improvement_notes || 'Conversation guidelines added'
        };
      }

      return parsed;
    } catch {
      // If JSON parsing fails, try to extract JSON from the text
      const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);

          // Transform the new format to the expected format
          if (parsed.enhanced_system_prompt) {
            return {
              system_prompt: parsed.enhanced_system_prompt,
              personality_traits: [],
              behavior_rules: parsed.behavior_rules || [],
              response_style: parsed.response_style || {},
              improvement_notes: parsed.improvement_notes || 'Conversation guidelines added'
            };
          }

          return parsed;
        } catch {
          // Still failed, fall back to extracting system prompt from the text
        }
      }

      // Extract just the system_prompt if it's wrapped in quotes or backticks
      let extractedPrompt = generatedText;
      const systemPromptMatch = generatedText.match(/"enhanced_system_prompt":\s*"([^"]*?)"/);
      if (systemPromptMatch) {
        extractedPrompt = systemPromptMatch[1];
      } else {
        // Clean up common formatting issues
        extractedPrompt = generatedText
          .replace(/^```json\s*/, '')
          .replace(/\s*```$/, '')
          .replace(/^As no conversation examples.*?Here is the enhanced prompt:\s*/i, '')
          .replace(/The improvements aim to.*$/s, '')
          .trim();
      }

      return {
        system_prompt: extractedPrompt,
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
      console.log(`Attempting to delete version ${versionId} for user ${userId}`);

      // First check if this is the active version
      const { data: activeCheck, error: activeError } = await supabase
        .from('avatar_prompt_versions')
        .select('is_active, avatar_id, version_number')
        .eq('id', versionId)
        .eq('user_id', userId)
        .single();

      if (activeError) {
        console.error('Error checking active status:', activeError);
        throw new Error(`Failed to verify version status: ${activeError.message}`);
      }

      if (!activeCheck) {
        throw new Error('Version not found or you do not have permission to delete it.');
      }

      if (activeCheck?.is_active) {
        throw new Error(`Cannot delete the active version (${activeCheck.version_number}). Please activate a different version first.`);
      }

      // Check if this version has child versions (descendants)
      const { data: children, error: childError } = await supabase
        .from('avatar_prompt_versions')
        .select('id, version_number')
        .eq('parent_version_id', versionId)
        .eq('user_id', userId);

      if (childError) {
        console.error('Error checking child versions:', childError);
        throw new Error(`Failed to check dependent versions: ${childError.message}`);
      }

      if (children && children.length > 0) {
        const childVersions = children.map(c => c.version_number).join(', ');
        throw new Error(`Cannot delete this version as it has dependent child versions: ${childVersions}. Please delete child versions first.`);
      }

      console.log('Proceeding with deletion...');

      // First, let's verify the record exists and we can see it
      const { data: verifyRecord, error: verifyError } = await supabase
        .from('avatar_prompt_versions')
        .select('id, version_number, user_id')
        .eq('id', versionId)
        .eq('user_id', userId)
        .single();

      if (verifyError || !verifyRecord) {
        console.error('Cannot find record to delete:', verifyError);
        throw new Error('Version not found or access denied');
      }

      console.log('Record found for deletion:', verifyRecord);

      // Delete the prompt version (this will cascade to related training data due to FK constraints)
      const { error, count } = await supabase
        .from('avatar_prompt_versions')
        .delete({ count: 'exact' })
        .eq('id', versionId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error deleting prompt version:', error);
        throw new Error(`Failed to delete version: ${error.message}`);
      }

      console.log(`Deletion result: ${count} rows affected`);

      if (count === 0) {
        throw new Error('No rows were deleted. This may be due to RLS policies or the record may not exist.');
      }

      console.log('Successfully deleted prompt version:', versionId);
    } catch (error) {
      console.error('Error in deletePromptVersion:', error);
      throw error;
    }
  }

  // Get avatar's current system prompt (generated from full profile or stored)
  static async getAvatarSystemPrompt(avatarId: string, userId: string): Promise<string> {
    try {
      const { data: avatar, error } = await supabase
        .from('avatars')
        .select(`
          system_prompt,
          name,
          description,
          age,
          gender,
          origin_country,
          primary_language,
          secondary_languages,
          mbti_type,
          personality_traits,
          backstory,
          hidden_rules,
          favorites,
          lifestyle,
          voice_description
        `)
        .eq('id', avatarId)
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error fetching avatar data:', error);
        throw new Error(`Failed to fetch avatar data: ${error.message}`);
      }

      // If avatar has a custom system_prompt, use it
      if (avatar?.system_prompt && avatar.system_prompt.trim() !== '') {
        return avatar.system_prompt;
      }

      // Otherwise, generate comprehensive prompt from avatar profile
      return this.generateBaseSystemPrompt(avatar);
    } catch (error) {
      console.error('Error in getAvatarSystemPrompt:', error);
      throw error;
    }
  }

  // Generate base system prompt from avatar profile
  static generateBaseSystemPrompt(avatar: any): string {
    const prompt = [];

    // Core Identity
    prompt.push(`You are ${avatar.name || 'an AI assistant'}.`);

    if (avatar.description) {
      prompt.push(avatar.description);
    }

    // Demographics & Background
    const demographics = [];
    if (avatar.age) demographics.push(`${avatar.age} years old`);
    if (avatar.gender) demographics.push(avatar.gender);
    if (avatar.origin_country) demographics.push(`from ${avatar.origin_country}`);

    if (demographics.length > 0) {
      prompt.push(`You are ${demographics.join(', ')}.`);
    }

    // Languages
    if (avatar.primary_language) {
      prompt.push(`Your primary language is ${avatar.primary_language}.`);
      if (avatar.secondary_languages && avatar.secondary_languages.length > 0) {
        prompt.push(`You also speak: ${avatar.secondary_languages.join(', ')}.`);
      }
    }

    // Personality & MBTI
    if (avatar.mbti_type) {
      prompt.push(`Your MBTI personality type is ${avatar.mbti_type}.`);
    }

    if (avatar.personality_traits && avatar.personality_traits.length > 0) {
      prompt.push(`Your key personality traits include: ${avatar.personality_traits.join(', ')}.`);
    }

    // Backstory
    if (avatar.backstory) {
      prompt.push(`Background: ${avatar.backstory}`);
    }

    // Favorites & Lifestyle
    if (avatar.favorites && avatar.favorites.length > 0) {
      prompt.push(`Things you enjoy: ${avatar.favorites.join(', ')}.`);
    }

    if (avatar.lifestyle && avatar.lifestyle.length > 0) {
      prompt.push(`Your lifestyle: ${avatar.lifestyle.join(', ')}.`);
    }

    // Voice & Communication Style
    if (avatar.voice_description) {
      prompt.push(`Communication style: ${avatar.voice_description}`);
    }

    // Hidden Rules (Important behavioral guidelines)
    if (avatar.hidden_rules) {
      prompt.push(`Important guidelines: ${avatar.hidden_rules}`);
    }

    // Default behavior
    prompt.push(`Always respond in character, maintaining your personality and background throughout the conversation.`);

    return prompt.join(' ');
  }
}