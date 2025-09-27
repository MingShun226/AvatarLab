-- AvatarLab Complete Database Schema for Supabase
-- Run this script in your Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ================================================
-- 1. USERS & AUTHENTICATION
-- ================================================

-- User profiles table (extends Supabase auth.users)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    avatar_url TEXT,
    phone TEXT,
    referral_code TEXT UNIQUE DEFAULT encode(gen_random_bytes(4), 'hex'),
    referrer_id UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    last_login TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deleted'))
);

-- User sessions for enhanced session management
CREATE TABLE public.user_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    token_hash TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    last_accessed TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    ip_address INET,
    user_agent TEXT
);

-- ================================================
-- 2. AVATAR SYSTEM
-- ================================================

-- Avatar templates for reusable components
CREATE TABLE public.avatar_templates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    content JSONB NOT NULL,
    category TEXT,
    template_type TEXT NOT NULL CHECK (template_type IN ('persona', 'backstory', 'rules', 'training')),
    tags TEXT[],
    difficulty_level INTEGER DEFAULT 1 CHECK (difficulty_level BETWEEN 1 AND 5),
    estimated_time INTEGER, -- minutes to complete
    author_id UUID REFERENCES public.profiles(id),
    is_public BOOLEAN DEFAULT FALSE,
    is_featured BOOLEAN DEFAULT FALSE,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Main avatars table
CREATE TABLE public.avatars (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,

    -- Basic Info
    age INTEGER CHECK (age > 0 AND age < 200),
    gender TEXT,
    origin_country TEXT DEFAULT 'US',
    primary_language TEXT DEFAULT 'English',
    secondary_languages TEXT[],
    languages TEXT[], -- For marketplace compatibility

    -- Personality
    mbti_type TEXT CHECK (mbti_type ~ '^[EI][SN][TF][JP]$'),
    mbti TEXT, -- For marketplace compatibility (simplified)
    personality_traits TEXT[],
    personality TEXT[], -- For marketplace compatibility
    backstory TEXT,
    grow_up_story TEXT, -- For marketplace compatibility
    hidden_rules TEXT,
    favorites TEXT[],
    lifestyle TEXT[],
    voice_description TEXT,

    -- Visual
    avatar_images TEXT[],
    image_url TEXT, -- For marketplace compatibility (primary image)
    gallery_images TEXT[],

    -- Marketplace
    price DECIMAL(10,2) DEFAULT 0 CHECK (price >= 0),
    rating DECIMAL(2,1) DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
    is_marketplace_item BOOLEAN DEFAULT FALSE,
    is_public BOOLEAN DEFAULT FALSE, -- For marketplace compatibility
    creator_studio TEXT,
    creator TEXT, -- For marketplace compatibility
    total_sales INTEGER DEFAULT 0 CHECK (total_sales >= 0),
    category TEXT,

    -- Training/AI
    system_prompt TEXT,
    user_prompt TEXT,
    training_instructions TEXT,
    training_status TEXT DEFAULT 'untrained' CHECK (training_status IN ('untrained', 'training', 'trained', 'error')),
    last_trained_at TIMESTAMP WITH TIME ZONE,

    -- Metadata
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'deleted', 'archived')),
    deleted_at TIMESTAMP WITH TIME ZONE,
    deleted_by UUID REFERENCES public.profiles(id),
    deletion_reason TEXT,
    scheduled_hard_delete_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Avatar versions for training data versioning
CREATE TABLE public.avatar_versions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    avatar_id UUID REFERENCES public.avatars(id) ON DELETE CASCADE NOT NULL,
    version_number INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    system_prompt TEXT,
    user_prompt TEXT,
    training_instructions TEXT,
    is_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    created_by UUID REFERENCES public.profiles(id),
    UNIQUE(avatar_id, version_number)
);

-- Avatar ratings and reviews
CREATE TABLE public.avatar_reviews (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    avatar_id UUID REFERENCES public.avatars(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    rating INTEGER CHECK(rating >= 1 AND rating <= 5) NOT NULL,
    review TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE(avatar_id, user_id)
);

-- ================================================
-- 3. KNOWLEDGE BASE & FILES
-- ================================================

-- Knowledge files for avatar training
CREATE TABLE public.avatar_knowledge_files (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    avatar_id UUID REFERENCES public.avatars(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    file_name TEXT NOT NULL,
    original_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT NOT NULL CHECK (file_size > 0),
    content_type TEXT NOT NULL,
    file_hash TEXT, -- for deduplication

    -- Content processing
    extracted_text TEXT,
    processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'error')),
    processing_error TEXT,

    -- Organization
    tags TEXT[],
    is_linked BOOLEAN DEFAULT TRUE,
    link_url TEXT,

    -- Metadata
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'deleted', 'archived')),
    deleted_at TIMESTAMP WITH TIME ZONE,
    deleted_by UUID REFERENCES public.profiles(id),
    deletion_reason TEXT,
    scheduled_hard_delete_at TIMESTAMP WITH TIME ZONE,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Knowledge chunks for RAG/vector search
CREATE TABLE public.knowledge_chunks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    file_id UUID REFERENCES public.avatar_knowledge_files(id) ON DELETE CASCADE NOT NULL,
    chunk_index INTEGER NOT NULL,
    content TEXT NOT NULL,
    embedding_vector VECTOR(1536), -- OpenAI embeddings dimension
    token_count INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE(file_id, chunk_index)
);

-- ================================================
-- 4. IMAGE & MEDIA MANAGEMENT
-- ================================================

-- Generated images
CREATE TABLE public.generated_images (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    prompt TEXT NOT NULL,
    negative_prompt TEXT,

    -- Generation settings
    generation_type TEXT DEFAULT 'text2img' CHECK (generation_type IN ('text2img', 'img2img', 'inpaint')),
    model_used TEXT,
    seed BIGINT,
    steps INTEGER CHECK (steps > 0),
    cfg_scale DECIMAL(4,2) CHECK (cfg_scale > 0),
    width INTEGER CHECK (width > 0),
    height INTEGER CHECK (height > 0),

    -- Files
    image_url TEXT NOT NULL,
    original_image_url TEXT, -- for img2img
    thumbnail_url TEXT,

    -- Organization
    is_favorite BOOLEAN DEFAULT FALSE,
    tags TEXT[],

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Image collections
CREATE TABLE public.image_collections (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    cover_image_id UUID REFERENCES public.generated_images(id),
    is_public BOOLEAN DEFAULT FALSE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Collection items (many-to-many)
CREATE TABLE public.image_collection_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    collection_id UUID REFERENCES public.image_collections(id) ON DELETE CASCADE NOT NULL,
    image_id UUID REFERENCES public.generated_images(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    sort_order INTEGER DEFAULT 0,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE(collection_id, image_id)
);

-- ================================================
-- 5. MARKETPLACE & TRANSACTIONS
-- ================================================

-- Marketplace purchases
CREATE TABLE public.purchases (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    avatar_id UUID REFERENCES public.avatars(id) NOT NULL,
    price_paid DECIMAL(10,2) NOT NULL CHECK (price_paid >= 0),
    currency TEXT DEFAULT 'USD',
    payment_method TEXT,
    transaction_id TEXT,
    status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'refunded', 'failed')),
    purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE(user_id, avatar_id)
);

-- User favorites
CREATE TABLE public.user_favorites (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    entity_type TEXT NOT NULL CHECK (entity_type IN ('avatar', 'image', 'template')),
    entity_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE(user_id, entity_type, entity_id)
);

-- ================================================
-- 6. APPLICATION STATE & CACHE
-- ================================================

-- User preferences
CREATE TABLE public.user_preferences (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    preference_key TEXT NOT NULL,
    preference_value JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE(user_id, preference_key)
);

-- UI state cache
CREATE TABLE public.ui_state_cache (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    component_key TEXT NOT NULL,
    state_data JSONB NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE(user_id, component_key)
);

-- Training data cache
CREATE TABLE public.training_cache (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    avatar_id UUID REFERENCES public.avatars(id) ON DELETE CASCADE NOT NULL,
    cache_key TEXT NOT NULL,
    cache_data JSONB NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE(avatar_id, cache_key)
);

-- ================================================
-- 7. ANALYTICS & LOGS
-- ================================================

-- User activity tracking
CREATE TABLE public.user_activities (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id),
    session_id UUID REFERENCES public.user_sessions(id),
    activity_type TEXT NOT NULL,
    entity_type TEXT,
    entity_id UUID,
    metadata JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- System logs
CREATE TABLE public.system_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    level TEXT NOT NULL CHECK (level IN ('debug', 'info', 'warn', 'error')),
    category TEXT NOT NULL,
    message TEXT NOT NULL,
    metadata JSONB,
    user_id UUID REFERENCES public.profiles(id),
    session_id UUID REFERENCES public.user_sessions(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- ================================================
-- 8. INDEXES FOR PERFORMANCE
-- ================================================

-- User indexes
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_profiles_referral_code ON public.profiles(referral_code);
CREATE INDEX idx_profiles_status ON public.profiles(status);

-- Session indexes
CREATE INDEX idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX idx_user_sessions_expires_at ON public.user_sessions(expires_at);
CREATE INDEX idx_user_sessions_token_hash ON public.user_sessions(token_hash);

-- Avatar indexes
CREATE INDEX idx_avatars_user_id ON public.avatars(user_id);
CREATE INDEX idx_avatars_marketplace ON public.avatars(is_public, status);
CREATE INDEX idx_avatars_marketplace_legacy ON public.avatars(is_marketplace_item, status);
CREATE INDEX idx_avatars_status ON public.avatars(status);
CREATE INDEX idx_avatars_created_at ON public.avatars(created_at);
CREATE INDEX idx_avatars_mbti_type ON public.avatars(mbti_type);

-- Avatar template indexes
CREATE INDEX idx_avatar_templates_author_id ON public.avatar_templates(author_id);
CREATE INDEX idx_avatar_templates_category ON public.avatar_templates(category);
CREATE INDEX idx_avatar_templates_type ON public.avatar_templates(template_type);
CREATE INDEX idx_avatar_templates_public ON public.avatar_templates(is_public, is_featured);

-- Knowledge file indexes
CREATE INDEX idx_knowledge_files_avatar_id ON public.avatar_knowledge_files(avatar_id);
CREATE INDEX idx_knowledge_files_user_id ON public.avatar_knowledge_files(user_id);
CREATE INDEX idx_knowledge_files_status ON public.avatar_knowledge_files(status);
CREATE INDEX idx_knowledge_files_content_type ON public.avatar_knowledge_files(content_type);

-- Knowledge chunk indexes
CREATE INDEX idx_knowledge_chunks_file_id ON public.knowledge_chunks(file_id);
CREATE INDEX idx_knowledge_chunks_content_gin ON public.knowledge_chunks USING gin(to_tsvector('english', content));

-- Image indexes
CREATE INDEX idx_generated_images_user_id ON public.generated_images(user_id);
CREATE INDEX idx_generated_images_created_at ON public.generated_images(created_at);
CREATE INDEX idx_generated_images_favorites ON public.generated_images(user_id, is_favorite);
CREATE INDEX idx_generated_images_type ON public.generated_images(generation_type);

-- Collection indexes
CREATE INDEX idx_image_collections_user_id ON public.image_collections(user_id);
CREATE INDEX idx_collection_items_collection_id ON public.image_collection_items(collection_id);
CREATE INDEX idx_collection_items_image_id ON public.image_collection_items(image_id);

-- Purchase indexes
CREATE INDEX idx_purchases_user_id ON public.purchases(user_id);
CREATE INDEX idx_purchases_avatar_id ON public.purchases(avatar_id);
CREATE INDEX idx_purchases_status ON public.purchases(status);
CREATE INDEX idx_purchases_purchased_at ON public.purchases(purchased_at);

-- Activity indexes
CREATE INDEX idx_user_activities_user_id ON public.user_activities(user_id);
CREATE INDEX idx_user_activities_created_at ON public.user_activities(created_at);
CREATE INDEX idx_user_activities_type ON public.user_activities(activity_type);
CREATE INDEX idx_user_activities_entity ON public.user_activities(entity_type, entity_id);

-- Cache indexes
CREATE INDEX idx_ui_state_cache_user_component ON public.ui_state_cache(user_id, component_key);
CREATE INDEX idx_ui_state_cache_expires_at ON public.ui_state_cache(expires_at);
CREATE INDEX idx_training_cache_avatar_key ON public.training_cache(avatar_id, cache_key);
CREATE INDEX idx_training_cache_expires_at ON public.training_cache(expires_at);

-- ================================================
-- 9. FUNCTIONS AND TRIGGERS
-- ================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers to relevant tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_avatars_updated_at BEFORE UPDATE ON public.avatars
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_avatar_templates_updated_at BEFORE UPDATE ON public.avatar_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_knowledge_files_updated_at BEFORE UPDATE ON public.avatar_knowledge_files
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_generated_images_updated_at BEFORE UPDATE ON public.generated_images
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_image_collections_updated_at BEFORE UPDATE ON public.image_collections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_avatar_reviews_updated_at BEFORE UPDATE ON public.avatar_reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON public.user_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ui_state_cache_updated_at BEFORE UPDATE ON public.ui_state_cache
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_training_cache_updated_at BEFORE UPDATE ON public.training_cache
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate referral codes
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT AS $$
BEGIN
    RETURN encode(gen_random_bytes(4), 'hex');
END;
$$ LANGUAGE plpgsql;

-- Function to soft delete avatars
CREATE OR REPLACE FUNCTION soft_delete_avatar(avatar_id_param UUID, deletion_reason_param TEXT DEFAULT NULL)
RETURNS VOID AS $$
BEGIN
    UPDATE public.avatars
    SET
        status = 'deleted',
        deleted_at = NOW(),
        deleted_by = auth.uid(),
        deletion_reason = deletion_reason_param,
        scheduled_hard_delete_at = NOW() + INTERVAL '30 days'
    WHERE id = avatar_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to restore avatar
CREATE OR REPLACE FUNCTION restore_avatar(avatar_id_param UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.avatars
    SET
        status = 'active',
        deleted_at = NULL,
        deleted_by = NULL,
        deletion_reason = NULL,
        scheduled_hard_delete_at = NULL
    WHERE id = avatar_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cleanup expired cache
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER := 0;
BEGIN
    -- Clean UI state cache
    DELETE FROM public.ui_state_cache
    WHERE expires_at IS NOT NULL AND expires_at <= NOW();

    deleted_count := deleted_count + ROW_COUNT;

    -- Clean training cache
    DELETE FROM public.training_cache
    WHERE expires_at IS NOT NULL AND expires_at <= NOW();

    deleted_count := deleted_count + ROW_COUNT;

    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================
-- 10. ROW LEVEL SECURITY (RLS)
-- ================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.avatar_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.avatars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.avatar_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.avatar_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.avatar_knowledge_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.image_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.image_collection_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ui_state_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activities ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Avatars policies
CREATE POLICY "Users can view their own avatars" ON public.avatars
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view marketplace avatars" ON public.avatars
    FOR SELECT USING ((is_public = true OR is_marketplace_item = true) AND status = 'active');

CREATE POLICY "Users can create avatars" ON public.avatars
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own avatars" ON public.avatars
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own avatars" ON public.avatars
    FOR DELETE USING (auth.uid() = user_id);

-- Avatar reviews policies
CREATE POLICY "Anyone can view reviews" ON public.avatar_reviews
    FOR SELECT USING (true);

CREATE POLICY "Users can create reviews" ON public.avatar_reviews
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews" ON public.avatar_reviews
    FOR UPDATE USING (auth.uid() = user_id);

-- Knowledge files policies
CREATE POLICY "Users can manage their knowledge files" ON public.avatar_knowledge_files
    FOR ALL USING (auth.uid() = user_id);

-- Generated images policies
CREATE POLICY "Users can manage their images" ON public.generated_images
    FOR ALL USING (auth.uid() = user_id);

-- Collections policies
CREATE POLICY "Users can manage their collections" ON public.image_collections
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view public collections" ON public.image_collections
    FOR SELECT USING (is_public = true);

-- Purchases policies
CREATE POLICY "Users can view their purchases" ON public.purchases
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create purchases" ON public.purchases
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User preferences policies
CREATE POLICY "Users can manage their preferences" ON public.user_preferences
    FOR ALL USING (auth.uid() = user_id);

-- UI state cache policies
CREATE POLICY "Users can manage their UI state" ON public.ui_state_cache
    FOR ALL USING (auth.uid() = user_id);

-- Training cache policies
CREATE POLICY "Users can manage training cache for their avatars" ON public.training_cache
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.avatars
            WHERE avatars.id = training_cache.avatar_id
            AND avatars.user_id = auth.uid()
        )
    );

-- ================================================
-- 11. TTS VOICES & CONFIGURATION
-- ================================================

-- TTS voice options
CREATE TABLE public.tts_voices (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    accent TEXT,
    sample_url TEXT,
    voice_type TEXT CHECK (voice_type IN ('male', 'female', 'neutral')),
    language TEXT NOT NULL DEFAULT 'en-US',
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Insert default TTS voices
INSERT INTO public.tts_voices (id, name, description, accent, voice_type, language, sample_url) VALUES
('aria', 'Aria', 'Natural, professional female voice', 'American', 'female', 'en-US', '/audio/aria_sample.mp3'),
('roger', 'Roger', 'Clear, confident male voice', 'British', 'male', 'en-GB', '/audio/roger_sample.mp3'),
('sarah', 'Sarah', 'Warm, friendly female voice', 'Australian', 'female', 'en-AU', '/audio/sarah_sample.mp3'),
('liam', 'Liam', 'Casual, energetic male voice', 'Irish', 'male', 'en-IE', '/audio/liam_sample.mp3'),
('maya', 'Maya', 'Soft, calming female voice', 'Indian', 'female', 'en-IN', '/audio/maya_sample.mp3'),
('alex', 'Alex', 'Versatile, neutral voice', 'Canadian', 'neutral', 'en-CA', '/audio/alex_sample.mp3');

-- RLS policies for TTS voices
ALTER TABLE public.tts_voices ENABLE ROW LEVEL SECURITY;

-- Everyone can read active TTS voices
CREATE POLICY "Anyone can view active TTS voices" ON public.tts_voices
    FOR SELECT USING (is_active = true);

-- Only authenticated users can manage TTS voices (for admin features)
CREATE POLICY "Authenticated users can manage TTS voices" ON public.tts_voices
    FOR ALL USING (auth.role() = 'authenticated');

-- ================================================
-- 12. INITIAL DATA
-- ================================================

-- Create a function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, name)
    VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'name', NEW.email));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment avatar sales count
CREATE OR REPLACE FUNCTION public.increment_avatar_sales(avatar_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.avatars
    SET total_sales = COALESCE(total_sales, 0) + 1,
        updated_at = NOW()
    WHERE id = avatar_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ================================================
-- COMPLETION MESSAGE
-- ================================================

-- Add a comment to indicate completion
COMMENT ON SCHEMA public IS 'AvatarLab database schema - Created on ' || NOW();