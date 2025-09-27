export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      avatar_knowledge_files: {
        Row: {
          avatar_id: string
          content_type: string
          deleted_at: string | null
          deleted_by: string | null
          deletion_reason: string | null
          extracted_text: string | null
          file_hash: string | null
          file_name: string
          file_path: string
          file_size: number
          id: string
          is_linked: boolean
          link_url: string | null
          original_name: string
          processing_error: string | null
          processing_status: string
          scheduled_hard_delete_at: string | null
          status: string
          tags: string[] | null
          updated_at: string
          uploaded_at: string
          user_id: string
        }
        Insert: {
          avatar_id: string
          content_type: string
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason?: string | null
          extracted_text?: string | null
          file_hash?: string | null
          file_name: string
          file_path: string
          file_size: number
          id?: string
          is_linked?: boolean
          link_url?: string | null
          original_name: string
          processing_error?: string | null
          processing_status?: string
          scheduled_hard_delete_at?: string | null
          status?: string
          tags?: string[] | null
          updated_at?: string
          uploaded_at?: string
          user_id: string
        }
        Update: {
          avatar_id?: string
          content_type?: string
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason?: string | null
          extracted_text?: string | null
          file_hash?: string | null
          file_name?: string
          file_path?: string
          file_size?: number
          id?: string
          is_linked?: boolean
          link_url?: string | null
          original_name?: string
          processing_error?: string | null
          processing_status?: string
          scheduled_hard_delete_at?: string | null
          status?: string
          tags?: string[] | null
          updated_at?: string
          uploaded_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "avatar_knowledge_files_avatar_id_fkey"
            columns: ["avatar_id"]
            isOneToOne: false
            referencedRelation: "avatars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "avatar_knowledge_files_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "avatar_knowledge_files_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      avatar_reviews: {
        Row: {
          avatar_id: string
          created_at: string
          id: string
          rating: number
          review: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_id: string
          created_at?: string
          id?: string
          rating: number
          review?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_id?: string
          created_at?: string
          id?: string
          rating?: number
          review?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "avatar_reviews_avatar_id_fkey"
            columns: ["avatar_id"]
            isOneToOne: false
            referencedRelation: "avatars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "avatar_reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      avatar_templates: {
        Row: {
          author_id: string | null
          category: string | null
          content: Json
          created_at: string
          description: string | null
          difficulty_level: number
          estimated_time: number | null
          id: string
          is_featured: boolean
          is_public: boolean
          tags: string[] | null
          template_type: string
          title: string
          updated_at: string
          usage_count: number
        }
        Insert: {
          author_id?: string | null
          category?: string | null
          content: Json
          created_at?: string
          description?: string | null
          difficulty_level?: number
          estimated_time?: number | null
          id?: string
          is_featured?: boolean
          is_public?: boolean
          tags?: string[] | null
          template_type: string
          title: string
          updated_at?: string
          usage_count?: number
        }
        Update: {
          author_id?: string | null
          category?: string | null
          content?: Json
          created_at?: string
          description?: string | null
          difficulty_level?: number
          estimated_time?: number | null
          id?: string
          is_featured?: boolean
          is_public?: boolean
          tags?: string[] | null
          template_type?: string
          title?: string
          updated_at?: string
          usage_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "avatar_templates_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      avatar_versions: {
        Row: {
          avatar_id: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          name: string
          system_prompt: string | null
          training_instructions: string | null
          user_prompt: string | null
          version_number: number
        }
        Insert: {
          avatar_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          system_prompt?: string | null
          training_instructions?: string | null
          user_prompt?: string | null
          version_number: number
        }
        Update: {
          avatar_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          system_prompt?: string | null
          training_instructions?: string | null
          user_prompt?: string | null
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "avatar_versions_avatar_id_fkey"
            columns: ["avatar_id"]
            isOneToOne: false
            referencedRelation: "avatars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "avatar_versions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      avatars: {
        Row: {
          age: number | null
          avatar_images: string[] | null
          backstory: string | null
          created_at: string
          creator_studio: string | null
          deleted_at: string | null
          deleted_by: string | null
          deletion_reason: string | null
          description: string | null
          favorites: string[] | null
          gallery_images: string[] | null
          gender: string | null
          hidden_rules: string | null
          id: string
          is_marketplace_item: boolean
          last_trained_at: string | null
          lifestyle: string[] | null
          mbti_type: string | null
          name: string
          origin_country: string
          personality_traits: string[] | null
          price: number
          primary_language: string
          scheduled_hard_delete_at: string | null
          secondary_languages: string[] | null
          status: string
          system_prompt: string | null
          total_sales: number
          training_instructions: string | null
          training_status: string
          updated_at: string
          user_id: string
          user_prompt: string | null
          voice_description: string | null
        }
        Insert: {
          age?: number | null
          avatar_images?: string[] | null
          backstory?: string | null
          created_at?: string
          creator_studio?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason?: string | null
          description?: string | null
          favorites?: string[] | null
          gallery_images?: string[] | null
          gender?: string | null
          hidden_rules?: string | null
          id?: string
          is_marketplace_item?: boolean
          last_trained_at?: string | null
          lifestyle?: string[] | null
          mbti_type?: string | null
          name: string
          origin_country?: string
          personality_traits?: string[] | null
          price?: number
          primary_language?: string
          scheduled_hard_delete_at?: string | null
          secondary_languages?: string[] | null
          status?: string
          system_prompt?: string | null
          total_sales?: number
          training_instructions?: string | null
          training_status?: string
          updated_at?: string
          user_id: string
          user_prompt?: string | null
          voice_description?: string | null
        }
        Update: {
          age?: number | null
          avatar_images?: string[] | null
          backstory?: string | null
          created_at?: string
          creator_studio?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason?: string | null
          description?: string | null
          favorites?: string[] | null
          gallery_images?: string[] | null
          gender?: string | null
          hidden_rules?: string | null
          id?: string
          is_marketplace_item?: boolean
          last_trained_at?: string | null
          lifestyle?: string[] | null
          mbti_type?: string | null
          name?: string
          origin_country?: string
          personality_traits?: string[] | null
          price?: number
          primary_language?: string
          scheduled_hard_delete_at?: string | null
          secondary_languages?: string[] | null
          status?: string
          system_prompt?: string | null
          total_sales?: number
          training_instructions?: string | null
          training_status?: string
          updated_at?: string
          user_id?: string
          user_prompt?: string | null
          voice_description?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "avatars_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "avatars_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      generated_images: {
        Row: {
          cfg_scale: number | null
          created_at: string
          generation_type: string
          height: number | null
          id: string
          image_url: string
          is_favorite: boolean
          model_used: string | null
          negative_prompt: string | null
          original_image_url: string | null
          prompt: string
          seed: number | null
          steps: number | null
          tags: string[] | null
          thumbnail_url: string | null
          updated_at: string
          user_id: string
          width: number | null
        }
        Insert: {
          cfg_scale?: number | null
          created_at?: string
          generation_type?: string
          height?: number | null
          id?: string
          image_url: string
          is_favorite?: boolean
          model_used?: string | null
          negative_prompt?: string | null
          original_image_url?: string | null
          prompt: string
          seed?: number | null
          steps?: number | null
          tags?: string[] | null
          thumbnail_url?: string | null
          updated_at?: string
          user_id: string
          width?: number | null
        }
        Update: {
          cfg_scale?: number | null
          created_at?: string
          generation_type?: string
          height?: number | null
          id?: string
          image_url?: string
          is_favorite?: boolean
          model_used?: string | null
          negative_prompt?: string | null
          original_image_url?: string | null
          prompt?: string
          seed?: number | null
          steps?: number | null
          tags?: string[] | null
          thumbnail_url?: string | null
          updated_at?: string
          user_id?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "generated_images_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      image_collection_items: {
        Row: {
          added_at: string
          collection_id: string
          id: string
          image_id: string
          sort_order: number
          user_id: string
        }
        Insert: {
          added_at?: string
          collection_id: string
          id?: string
          image_id: string
          sort_order?: number
          user_id: string
        }
        Update: {
          added_at?: string
          collection_id?: string
          id?: string
          image_id?: string
          sort_order?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "image_collection_items_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "image_collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "image_collection_items_image_id_fkey"
            columns: ["image_id"]
            isOneToOne: false
            referencedRelation: "generated_images"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "image_collection_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      image_collections: {
        Row: {
          cover_image_id: string | null
          created_at: string
          description: string | null
          id: string
          is_public: boolean
          name: string
          sort_order: number
          updated_at: string
          user_id: string
        }
        Insert: {
          cover_image_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
          name: string
          sort_order?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          cover_image_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
          name?: string
          sort_order?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "image_collections_cover_image_id_fkey"
            columns: ["cover_image_id"]
            isOneToOne: false
            referencedRelation: "generated_images"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "image_collections_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_chunks: {
        Row: {
          chunk_index: number
          content: string
          created_at: string
          embedding_vector: string | null
          file_id: string
          id: string
          token_count: number | null
        }
        Insert: {
          chunk_index: number
          content: string
          created_at?: string
          embedding_vector?: string | null
          file_id: string
          id?: string
          token_count?: number | null
        }
        Update: {
          chunk_index?: number
          content?: string
          created_at?: string
          embedding_vector?: string | null
          file_id?: string
          id?: string
          token_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_chunks_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "avatar_knowledge_files"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          id: string
          last_login: string | null
          name: string | null
          phone: string | null
          referral_code: string | null
          referrer_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          id: string
          last_login?: string | null
          name?: string | null
          phone?: string | null
          referral_code?: string | null
          referrer_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          id?: string
          last_login?: string | null
          name?: string | null
          phone?: string | null
          referral_code?: string | null
          referrer_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      purchases: {
        Row: {
          avatar_id: string
          currency: string
          id: string
          payment_method: string | null
          price_paid: number
          purchased_at: string
          status: string
          transaction_id: string | null
          user_id: string
        }
        Insert: {
          avatar_id: string
          currency?: string
          id?: string
          payment_method?: string | null
          price_paid: number
          purchased_at?: string
          status?: string
          transaction_id?: string | null
          user_id: string
        }
        Update: {
          avatar_id?: string
          currency?: string
          id?: string
          payment_method?: string | null
          price_paid?: number
          purchased_at?: string
          status?: string
          transaction_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchases_avatar_id_fkey"
            columns: ["avatar_id"]
            isOneToOne: false
            referencedRelation: "avatars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      system_logs: {
        Row: {
          category: string
          created_at: string
          id: string
          level: string
          message: string
          metadata: Json | null
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          level: string
          message: string
          metadata?: Json | null
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          level?: string
          message?: string
          metadata?: Json | null
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "system_logs_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "user_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "system_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      training_cache: {
        Row: {
          avatar_id: string
          cache_data: Json
          cache_key: string
          created_at: string
          expires_at: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_id: string
          cache_data: Json
          cache_key: string
          created_at?: string
          expires_at?: string | null
          id?: string
          updated_at?: string
        }
        Update: {
          avatar_id?: string
          cache_data?: Json
          cache_key?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_cache_avatar_id_fkey"
            columns: ["avatar_id"]
            isOneToOne: false
            referencedRelation: "avatars"
            referencedColumns: ["id"]
          },
        ]
      }
      ui_state_cache: {
        Row: {
          component_key: string
          created_at: string
          expires_at: string | null
          id: string
          state_data: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          component_key: string
          created_at?: string
          expires_at?: string | null
          id?: string
          state_data: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          component_key?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          state_data?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ui_state_cache_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_activities: {
        Row: {
          activity_type: string
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          ip_address: string | null
          metadata: Json | null
          session_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          activity_type: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          activity_type?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_activities_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "user_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_activities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_favorites: {
        Row: {
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          created_at: string
          id: string
          preference_key: string
          preference_value: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          preference_key: string
          preference_value?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          preference_key?: string
          preference_value?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_sessions: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          ip_address: string | null
          last_accessed: string
          token_hash: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          ip_address?: string | null
          last_accessed?: string
          token_hash: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          ip_address?: string | null
          last_accessed?: string
          token_hash?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_expired_cache: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      generate_referral_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      restore_avatar: {
        Args: {
          avatar_id_param: string
        }
        Returns: undefined
      }
      soft_delete_avatar: {
        Args: {
          avatar_id_param: string
          deletion_reason_param?: string
        }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Database

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never