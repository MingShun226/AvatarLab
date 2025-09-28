import { apiKeyService } from './apiKeyService';
import { supabase } from '@/integrations/supabase/client';
import { RAGService } from './ragService';
import { TrainingService } from './trainingService';
import { SmartPromptService } from './smartPromptService';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AvatarContext {
  id: string;
  name: string;
  backstory?: string;
  personality_traits?: string[];
  mbti_type?: string;
  hidden_rules?: string;
  customSystemPrompt?: string;
  fineTunedModelId?: string;
}

export const chatbotService = {
  // Helper method to determine max tokens based on model
  getMaxTokensForModel(model: string): number {
    if (model.includes('gpt-4o-mini')) {
      return 2000; // gpt-4o-mini has higher token limits
    } else if (model.includes('gpt-4o')) {
      return 1500; // gpt-4o models
    } else if (model.includes('gpt-4')) {
      return 1000; // Regular gpt-4 models
    } else if (model.includes('gpt-3.5-turbo')) {
      return 500; // gpt-3.5-turbo models
    } else {
      return 1000; // Default for unknown models
    }
  },
  async sendMessage(
    userId: string,
    message: string,
    avatarContext: AvatarContext,
    conversationHistory: ChatMessage[] = [],
    model: string = 'gpt-3.5-turbo'
  ): Promise<string> {
    try {
      // Get OpenAI API key from stored keys
      const apiKey = await apiKeyService.getDecryptedApiKey(userId, 'OpenAI');

      if (!apiKey) {
        throw new Error('No OpenAI API key found. Please add one in Settings > API Keys.');
      }

      // Use RAG to find relevant content for the user's message
      const ragResults = await RAGService.searchRelevantChunks(
        message,
        userId,
        avatarContext.id,
        5, // Get top 5 most relevant chunks
        0.7 // Similarity threshold
      );

      console.log(`RAG Search: Found ${ragResults.totalFound} relevant chunks in ${ragResults.searchTime}ms`);
      console.log(`Using model: ${model} with max_tokens: ${this.getMaxTokensForModel(model)}`);

      // Get basic knowledge base info (for files without RAG processing)
      const knowledgeBase = await this.getKnowledgeBaseContent(userId, avatarContext.id);

      // Create system prompt with RAG-enhanced context and smart patterns
      const baseSystemPrompt = await this.createSystemPromptWithRAG(avatarContext, knowledgeBase, ragResults.chunks, message, userId);
      const systemPrompt = await SmartPromptService.generateSmartPrompt(userId, avatarContext.id, message, baseSystemPrompt);

      // Prepare messages for OpenAI
      const messages: ChatMessage[] = [
        { role: 'system', content: systemPrompt },
        ...conversationHistory.slice(-30), // Keep last 30 messages for context
        { role: 'user', content: message }
      ];

      // Use fine-tuned model if available
      const modelToUse = avatarContext.fineTunedModelId || model;

      // Call OpenAI API
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: modelToUse,
          messages,
          max_tokens: this.getMaxTokensForModel(modelToUse),
          temperature: 0.7
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        if (response.status === 401) {
          throw new Error('Invalid API key. Please check your OpenAI API key in Settings.');
        } else if (response.status === 429) {
          throw new Error('API rate limit exceeded. Please try again later.');
        } else {
          throw new Error(errorData.error?.message || `API error: ${response.status}`);
        }
      }

      const data = await response.json();

      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('Invalid response from OpenAI API');
      }

      const avatarResponse = data.choices[0].message.content;

      // Learn from this conversation (async, don't block response)
      SmartPromptService.learnFromConversations(
        userId,
        avatarContext.id,
        message,
        avatarResponse,
        'neutral', // Default to neutral, user can provide feedback later
        Date.now().toString() // Use timestamp as session ID
      ).catch(error => {
        console.warn('Failed to learn from conversation:', error);
      });

      return avatarResponse;

    } catch (error) {
      console.error('Chatbot service error:', error);

      if (error instanceof Error) {
        throw error;
      } else {
        throw new Error('Failed to get response from chatbot');
      }
    }
  },

  async getKnowledgeBaseContent(userId: string, avatarId: string): Promise<string[]> {
    try {
      const { data: knowledgeFiles, error } = await supabase
        .from('avatar_knowledge_files')
        .select('file_name, original_name, extracted_text, file_size, content_type')
        .eq('user_id', userId)
        .eq('avatar_id', avatarId)
        .eq('is_linked', true);

      if (error) {
        console.error('Error fetching knowledge base:', error);
        return [];
      }

      if (!knowledgeFiles || knowledgeFiles.length === 0) {
        return [];
      }

      const results = [];

      for (const file of knowledgeFiles) {
        if (file.extracted_text && file.extracted_text.trim().length > 0) {
          // Use extracted text if available
          results.push(`--- Content from ${file.file_name} ---\n${file.extracted_text}`);
        } else {
          // Temporary fallback: indicate file exists but needs processing
          const displayName = file.original_name || file.file_name;
          results.push(`--- Document: ${displayName} ---
File Type: ${file.content_type || 'PDF'}
Size: ${file.file_size ? Math.round(file.file_size / 1024) + ' KB' : 'Unknown'}
Status: PDF content extraction pending - this document is available but text needs to be processed.
Note: I can see this document exists in my knowledge base, but the text content hasn't been extracted yet. You may need to re-upload or process this file for full text access.`);
        }
      }

      return results;

    } catch (error) {
      console.error('Error fetching knowledge base content:', error);
      return [];
    }
  },

  async createSystemPromptWithRAG(avatarContext: AvatarContext, knowledgeBase: string[], ragChunks: any[], userQuery: string, userId: string): Promise<string> {
    // Use customSystemPrompt if provided, otherwise try to get trained prompt version
    let basePrompt = `You are ${avatarContext.name}, an AI avatar with a unique personality.`;

    if (avatarContext.customSystemPrompt) {
      // Use the selected version's system prompt directly
      basePrompt = avatarContext.customSystemPrompt;
    } else {
      try {
        const activeVersion = await TrainingService.getActivePromptVersion(avatarContext.id, userId);
        if (activeVersion) {
          // Use the trained system prompt as the base
          basePrompt = activeVersion.system_prompt;

          // Add personality traits from training if available
          if (activeVersion.personality_traits && activeVersion.personality_traits.length > 0) {
            basePrompt += `\n\nYour trained personality traits: ${activeVersion.personality_traits.join(', ')}`;
          }

          // Add behavior rules from training if available
          if (activeVersion.behavior_rules && activeVersion.behavior_rules.length > 0) {
            basePrompt += `\n\nTrained behavior guidelines: ${activeVersion.behavior_rules.join(' ')}`;
          }

          // Apply response style if available
          if (activeVersion.response_style) {
            const style = activeVersion.response_style as any;
            if (style.formality) {
              basePrompt += `\n\nCommunication style: ${style.formality}`;
            }
            if (style.tone) {
              basePrompt += `\n\nTone: ${style.tone}`;
            }
            if (style.emoji_usage) {
              basePrompt += `\n\nEmoji usage: ${style.emoji_usage}`;
            }
          }
        } else {
          // Fall back to original avatar data if no trained version exists
          if (avatarContext.backstory) {
            basePrompt += `\n\nYour backstory: ${avatarContext.backstory}`;
          }

          if (avatarContext.personality_traits && avatarContext.personality_traits.length > 0) {
            basePrompt += `\n\nYour personality traits: ${avatarContext.personality_traits.join(', ')}`;
          }

          if (avatarContext.mbti_type) {
            basePrompt += `\n\nYour MBTI type: ${avatarContext.mbti_type}`;
          }

          if (avatarContext.hidden_rules) {
            basePrompt += `\n\nImportant behavioral guidelines: ${avatarContext.hidden_rules}`;
          }
        }
      } catch (error) {
        console.warn('Could not load trained prompt, using default:', error);
        // Fall back to original avatar data
        if (avatarContext.backstory) {
          basePrompt += `\n\nYour backstory: ${avatarContext.backstory}`;
        }

        if (avatarContext.personality_traits && avatarContext.personality_traits.length > 0) {
          basePrompt += `\n\nYour personality traits: ${avatarContext.personality_traits.join(', ')}`;
        }

        if (avatarContext.mbti_type) {
          basePrompt += `\n\nYour MBTI type: ${avatarContext.mbti_type}`;
        }

        if (avatarContext.hidden_rules) {
          basePrompt += `\n\nImportant behavioral guidelines: ${avatarContext.hidden_rules}`;
        }
      }
    }

    // Add RAG-retrieved content if available
    if (ragChunks && ragChunks.length > 0) {
      basePrompt += RAGService.formatRetrievedContext(ragChunks);
    } else if (knowledgeBase && knowledgeBase.length > 0) {
      // Fallback to basic knowledge base
      basePrompt += `\n\n=== KNOWLEDGE BASE ===\nYou have access to the following documents:`;
      knowledgeBase.forEach(content => {
        const truncatedContent = content.length > 1000
          ? content.substring(0, 1000) + '...[content truncated]'
          : content;
        basePrompt += `\n\n${truncatedContent}`;
      });
      basePrompt += `\n\n=== END KNOWLEDGE BASE ===\n`;
    }

    basePrompt += `\n\nUser's current question: "${userQuery}"\n\nStay in character and respond as ${avatarContext.name} would, based on your personality, background, and available knowledge. Be helpful, engaging, and authentic to your character. If you have relevant information from your knowledge base, use it to provide accurate and detailed responses.`;

    return basePrompt;
  },

  createSystemPrompt(avatarContext: AvatarContext, knowledgeBase: string[] = []): string {
    let prompt = `You are ${avatarContext.name}, an AI avatar with a unique personality.`;

    if (avatarContext.backstory) {
      prompt += `\n\nYour backstory: ${avatarContext.backstory}`;
    }

    if (avatarContext.personality_traits && avatarContext.personality_traits.length > 0) {
      prompt += `\n\nYour personality traits: ${avatarContext.personality_traits.join(', ')}`;
    }

    if (avatarContext.mbti_type) {
      prompt += `\n\nYour MBTI type: ${avatarContext.mbti_type}`;
    }

    if (avatarContext.hidden_rules) {
      prompt += `\n\nImportant behavioral guidelines: ${avatarContext.hidden_rules}`;
    }

    // Add knowledge base content if available
    if (knowledgeBase && knowledgeBase.length > 0) {
      prompt += `\n\n=== KNOWLEDGE BASE ===\nYou have access to the following documents and information. Use this knowledge to provide accurate, detailed responses when relevant:`;

      knowledgeBase.forEach((content, index) => {
        // Limit each document to ~1000 characters to avoid token limits
        const truncatedContent = content.length > 1000
          ? content.substring(0, 1000) + '...[content truncated]'
          : content;
        prompt += `\n\n${truncatedContent}`;
      });

      prompt += `\n\n=== END KNOWLEDGE BASE ===\n`;
      prompt += `When answering questions, prioritize information from your knowledge base when relevant. If you reference specific information from the documents, you can mention that you're drawing from your knowledge base.`;
    }

    prompt += `\n\nStay in character and respond as ${avatarContext.name} would, based on your personality, background, and available knowledge. Be helpful, engaging, and authentic to your character.`;

    return prompt;
  }
};