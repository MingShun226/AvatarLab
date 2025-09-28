import { supabase } from '@/integrations/supabase/client';

export interface ConversationPattern {
  id: string;
  avatar_id: string;
  user_id: string;
  trigger_words: string[];
  response_pattern: string;
  examples: string[];
  usage_count: number;
  success_rate: number;
  pattern_type: 'greeting' | 'question' | 'casual' | 'formal' | 'general';
  created_at: string;
  updated_at: string;
}

export interface ConversationFeedback {
  id: string;
  avatar_id: string;
  user_id: string;
  user_message: string;
  avatar_response: string;
  feedback: 'good' | 'bad' | 'neutral';
  session_id?: string;
  created_at: string;
}

export class SmartPromptService {

  /**
   * Build conversation patterns from user interactions
   * Cost: FREE! No external API calls for training
   */
  static async learnFromConversations(
    userId: string,
    avatarId: string,
    userMessage: string,
    avatarResponse: string,
    userFeedback?: 'good' | 'bad',
    sessionId?: string
  ): Promise<void> {

    // Save conversation feedback for analysis
    await this.saveConversationFeedback(
      userId,
      avatarId,
      userMessage,
      avatarResponse,
      userFeedback || 'neutral',
      sessionId
    );

    // Only learn from good responses or neutral if no feedback
    if (userFeedback === 'bad') return;

    // Extract patterns from successful conversations
    const patterns = this.extractPatterns(userMessage, avatarResponse);

    for (const pattern of patterns) {
      await this.saveOrUpdatePattern(userId, avatarId, pattern, userFeedback);
    }
  }

  /**
   * Save conversation feedback for future analysis
   */
  static async saveConversationFeedback(
    userId: string,
    avatarId: string,
    userMessage: string,
    avatarResponse: string,
    feedback: 'good' | 'bad' | 'neutral',
    sessionId?: string
  ): Promise<void> {
    try {
      await supabase
        .from('conversation_feedback')
        .insert({
          avatar_id: avatarId,
          user_id: userId,
          user_message: userMessage,
          avatar_response: avatarResponse,
          feedback: feedback,
          session_id: sessionId
        });
    } catch (error) {
      console.error('Error saving conversation feedback:', error);
    }
  }

  /**
   * Generate dynamic prompts based on learned patterns
   */
  static async generateSmartPrompt(
    userId: string,
    avatarId: string,
    userMessage: string,
    basePrompt: string
  ): Promise<string> {

    // Get relevant patterns for this message
    const relevantPatterns = await this.getRelevantPatterns(
      userId,
      avatarId,
      userMessage
    );

    // Build enhanced prompt with learned patterns
    let enhancedPrompt = basePrompt;

    if (relevantPatterns.length > 0) {
      enhancedPrompt += '\n\nBased on previous successful conversations:\n';

      relevantPatterns.forEach(pattern => {
        enhancedPrompt += `- When user says "${pattern.trigger_words.join('", "')}", respond like: "${pattern.response_pattern}"\n`;
        enhancedPrompt += `  Examples: ${pattern.examples.slice(0, 2).join(' | ')}\n`;
      });
    }

    return enhancedPrompt;
  }

  static extractPatterns(userMessage: string, avatarResponse: string): Partial<ConversationPattern>[] {
    const patterns: Partial<ConversationPattern>[] = [];

    // Extract greeting patterns
    if (this.isGreeting(userMessage)) {
      patterns.push({
        trigger_words: ['hello', 'hi', 'hey', 'good morning', 'good afternoon'],
        response_pattern: this.extractResponsePattern(avatarResponse),
        examples: [avatarResponse],
        pattern_type: 'greeting'
      });
    }

    // Extract question patterns
    if (this.isQuestion(userMessage)) {
      patterns.push({
        trigger_words: this.extractQuestionWords(userMessage),
        response_pattern: this.extractResponsePattern(avatarResponse),
        examples: [avatarResponse],
        pattern_type: 'question'
      });
    }

    // Extract casual conversation patterns
    if (this.isCasualConversation(userMessage, avatarResponse)) {
      patterns.push({
        trigger_words: this.extractKeyWords(userMessage),
        response_pattern: this.extractResponsePattern(avatarResponse),
        examples: [avatarResponse],
        pattern_type: 'casual'
      });
    }

    // Extract formal patterns
    if (this.isFormalConversation(userMessage, avatarResponse)) {
      patterns.push({
        trigger_words: this.extractKeyWords(userMessage),
        response_pattern: this.extractResponsePattern(avatarResponse),
        examples: [avatarResponse],
        pattern_type: 'formal'
      });
    }

    return patterns;
  }

  static async getRelevantPatterns(
    userId: string,
    avatarId: string,
    userMessage: string
  ): Promise<ConversationPattern[]> {

    try {
      const { data: patterns, error } = await supabase
        .from('conversation_patterns')
        .select('*')
        .eq('user_id', userId)
        .eq('avatar_id', avatarId)
        .gte('success_rate', 0.7) // Only use successful patterns
        .order('usage_count', { ascending: false })
        .limit(20); // Get more patterns, filter in code

      if (error) {
        console.warn('Error fetching patterns:', error);
        return [];
      }

      if (!patterns) return [];

      // Filter patterns that match current message (do this in JavaScript instead of SQL)
      const relevantPatterns = patterns.filter(pattern =>
        pattern.trigger_words && pattern.trigger_words.some(word =>
          userMessage.toLowerCase().includes(word.toLowerCase())
        )
      );

      return relevantPatterns.slice(0, 5); // Return top 5
    } catch (error) {
      console.warn('Error in getRelevantPatterns:', error);
      return [];
    }
  }

  static async saveOrUpdatePattern(
    userId: string,
    avatarId: string,
    pattern: Partial<ConversationPattern>,
    feedback?: 'good' | 'bad'
  ): Promise<void> {

    try {
      // Get all patterns for this user/avatar and check for matches in JavaScript
      const { data: allPatterns, error } = await supabase
        .from('conversation_patterns')
        .select('*')
        .eq('user_id', userId)
        .eq('avatar_id', avatarId);

      if (error) {
        console.warn('Error fetching patterns for update:', error);
        return;
      }

      // Find existing pattern by comparing trigger words
      const existing = allPatterns?.find(p => {
        if (!p.trigger_words || !pattern.trigger_words) return false;
        return p.trigger_words.some(word =>
          pattern.trigger_words!.includes(word)
        );
      });

      if (existing) {
        // Update existing pattern
        const newUsageCount = existing.usage_count + 1;
        const feedbackScore = feedback === 'good' ? 1 : feedback === 'bad' ? 0 : 0.8;
        const newSuccessRate = (existing.success_rate * existing.usage_count + feedbackScore) / newUsageCount;

        await supabase
          .from('conversation_patterns')
          .update({
            usage_count: newUsageCount,
            success_rate: newSuccessRate,
            examples: [...existing.examples, ...pattern.examples!].slice(-10) // Keep last 10 examples
          })
          .eq('id', existing.id);
      } else {
        // Create new pattern
        await supabase
          .from('conversation_patterns')
          .insert({
            avatar_id: avatarId,
            user_id: userId,
            trigger_words: pattern.trigger_words,
            response_pattern: pattern.response_pattern,
            examples: pattern.examples,
            usage_count: 1,
            success_rate: feedback === 'good' ? 1.0 : 0.8,
            pattern_type: pattern.pattern_type
          });
      }
    } catch (error) {
      console.warn('Error in saveOrUpdatePattern:', error);
    }
  }

  // Helper methods
  static isGreeting(message: string): boolean {
    const greetings = ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening'];
    return greetings.some(greeting => message.toLowerCase().includes(greeting));
  }

  static isQuestion(message: string): boolean {
    return message.includes('?') ||
           message.toLowerCase().startsWith('what') ||
           message.toLowerCase().startsWith('how') ||
           message.toLowerCase().startsWith('why') ||
           message.toLowerCase().startsWith('when') ||
           message.toLowerCase().startsWith('where');
  }

  static extractQuestionWords(message: string): string[] {
    const words = message.toLowerCase().split(' ');
    return words.filter(word =>
      ['what', 'how', 'why', 'when', 'where', 'who', 'which'].includes(word)
    );
  }

  static extractResponsePattern(response: string): string {
    // Simplify response to pattern
    return response
      .replace(/['"]/g, '')
      .replace(/\b\d+\b/g, '[number]')
      .replace(/\b[A-Z][a-z]+\b/g, '[name]')
      .substring(0, 200); // Limit length
  }

  static isCasualConversation(userMessage: string, avatarResponse: string): boolean {
    const casualMarkers = ['lah', 'lor', 'ah', 'whatsupp', 'hey', 'yo', 'dude'];
    return casualMarkers.some(marker =>
      avatarResponse.toLowerCase().includes(marker) ||
      userMessage.toLowerCase().includes(marker)
    );
  }

  static isFormalConversation(userMessage: string, avatarResponse: string): boolean {
    const formalMarkers = ['please', 'thank you', 'would you', 'could you', 'I appreciate'];
    return formalMarkers.some(marker =>
      avatarResponse.toLowerCase().includes(marker.toLowerCase()) ||
      userMessage.toLowerCase().includes(marker.toLowerCase())
    );
  }

  static extractKeyWords(message: string): string[] {
    // Extract meaningful words (not common stop words)
    const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those'];

    return message
      .toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove punctuation
      .split(/\s+/)
      .filter(word =>
        word.length > 2 &&
        !stopWords.includes(word)
      )
      .slice(0, 5); // Take first 5 meaningful words
  }
}