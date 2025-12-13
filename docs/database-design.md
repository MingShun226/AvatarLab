# AvatarLab New Database Design

## Database Choice
**SQLite with better-sqlite3** - Perfect for this application because:
- Single-file database, easy to deploy and backup
- Excellent performance for read-heavy workloads
- No server setup required
- Perfect for desktop/local applications
- Built-in JSON support for complex data types

## Core Database Schema

### 1. Users & Authentication
```sql
-- Users table (replaces profiles + auth)
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT,
    name TEXT,
    avatar_url TEXT,
    phone TEXT,
    referral_code TEXT UNIQUE,
    referrer_id TEXT,
    auth_provider TEXT DEFAULT 'local', -- local, google, github, etc
    auth_provider_id TEXT,
    email_verified BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME,
    status TEXT DEFAULT 'active', -- active, suspended, deleted
    FOREIGN KEY (referrer_id) REFERENCES users(id)
);

-- User sessions (replaces localStorage auth)
CREATE TABLE user_sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    token_hash TEXT NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_accessed DATETIME DEFAULT CURRENT_TIMESTAMP,
    ip_address TEXT,
    user_agent TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### 2. Avatar System
```sql
-- Avatar templates (enhanced)
CREATE TABLE avatar_templates (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    content TEXT NOT NULL, -- JSON template content
    category TEXT,
    template_type TEXT NOT NULL, -- persona, backstory, rules, etc
    tags TEXT, -- JSON array of tags
    difficulty_level INTEGER DEFAULT 1, -- 1-5 scale
    estimated_time INTEGER, -- minutes to complete
    author_id TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    is_featured BOOLEAN DEFAULT FALSE,
    usage_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES users(id)
);

-- Main avatars table (consolidated)
CREATE TABLE avatars (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,

    -- Basic Info
    age INTEGER,
    gender TEXT,
    origin_country TEXT DEFAULT 'US',
    primary_language TEXT DEFAULT 'English',
    secondary_languages TEXT, -- JSON array

    -- Personality
    mbti_type TEXT,
    personality_traits TEXT, -- JSON array
    backstory TEXT,
    hidden_rules TEXT,
    favorites TEXT, -- JSON array
    lifestyle TEXT, -- JSON array
    voice_description TEXT,

    -- Visual
    avatar_images TEXT, -- JSON array of image URLs/paths
    gallery_images TEXT, -- JSON array

    -- Marketplace
    price DECIMAL(10,2) DEFAULT 0,
    is_marketplace_item BOOLEAN DEFAULT FALSE,
    creator_studio TEXT,
    total_sales INTEGER DEFAULT 0,

    -- Training/AI
    system_prompt TEXT,
    user_prompt TEXT,
    training_instructions TEXT,
    training_status TEXT DEFAULT 'untrained', -- untrained, training, trained, error
    last_trained_at DATETIME,

    -- Metadata
    status TEXT DEFAULT 'active', -- active, deleted, archived
    deleted_at DATETIME,
    deleted_by TEXT,
    deletion_reason TEXT,
    scheduled_hard_delete_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (deleted_by) REFERENCES users(id)
);

-- Avatar versions (for training data versioning)
CREATE TABLE avatar_versions (
    id TEXT PRIMARY KEY,
    avatar_id TEXT NOT NULL,
    version_number INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    system_prompt TEXT,
    user_prompt TEXT,
    training_instructions TEXT,
    is_active BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by TEXT,
    FOREIGN KEY (avatar_id) REFERENCES avatars(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id),
    UNIQUE(avatar_id, version_number)
);

-- Avatar ratings and reviews
CREATE TABLE avatar_reviews (
    id TEXT PRIMARY KEY,
    avatar_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    rating INTEGER CHECK(rating >= 1 AND rating <= 5),
    review TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (avatar_id) REFERENCES avatars(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE(avatar_id, user_id)
);
```

### 3. Knowledge Base & Files
```sql
-- Knowledge files (enhanced)
CREATE TABLE knowledge_files (
    id TEXT PRIMARY KEY,
    avatar_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    file_name TEXT NOT NULL,
    original_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    content_type TEXT NOT NULL,
    file_hash TEXT, -- for deduplication

    -- Content processing
    extracted_text TEXT, -- processed text content
    processing_status TEXT DEFAULT 'pending', -- pending, processing, completed, error
    processing_error TEXT,

    -- Organization
    tags TEXT, -- JSON array
    is_linked BOOLEAN DEFAULT TRUE,
    link_url TEXT, -- if it's a linked resource

    -- Metadata
    status TEXT DEFAULT 'active',
    deleted_at DATETIME,
    deleted_by TEXT,
    deletion_reason TEXT,
    scheduled_hard_delete_at DATETIME,
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (avatar_id) REFERENCES avatars(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (deleted_by) REFERENCES users(id)
);

-- Knowledge chunks (for RAG/vector search)
CREATE TABLE knowledge_chunks (
    id TEXT PRIMARY KEY,
    file_id TEXT NOT NULL,
    chunk_index INTEGER NOT NULL,
    content TEXT NOT NULL,
    embedding_vector TEXT, -- JSON array of floats for vector search
    token_count INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (file_id) REFERENCES knowledge_files(id) ON DELETE CASCADE,
    UNIQUE(file_id, chunk_index)
);
```

### 4. Image & Media Management
```sql
-- Generated images (enhanced)
CREATE TABLE generated_images (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    prompt TEXT NOT NULL,
    negative_prompt TEXT,

    -- Generation settings
    generation_type TEXT DEFAULT 'text2img', -- text2img, img2img, inpaint
    model_used TEXT,
    seed INTEGER,
    steps INTEGER,
    cfg_scale REAL,
    width INTEGER,
    height INTEGER,

    -- Files
    image_url TEXT NOT NULL,
    original_image_url TEXT, -- for img2img
    thumbnail_url TEXT,

    -- Organization
    is_favorite BOOLEAN DEFAULT FALSE,
    tags TEXT, -- JSON array

    -- Metadata
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Image collections (enhanced)
CREATE TABLE image_collections (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    cover_image_id TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    sort_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (cover_image_id) REFERENCES generated_images(id)
);

-- Collection items (many-to-many)
CREATE TABLE collection_items (
    id TEXT PRIMARY KEY,
    collection_id TEXT NOT NULL,
    image_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (collection_id) REFERENCES image_collections(id) ON DELETE CASCADE,
    FOREIGN KEY (image_id) REFERENCES generated_images(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE(collection_id, image_id)
);
```

### 5. Marketplace & Transactions
```sql
-- Marketplace purchases (replaces localStorage)
CREATE TABLE purchases (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    avatar_id TEXT NOT NULL,
    price_paid DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    payment_method TEXT, -- credit_card, paypal, crypto, etc
    transaction_id TEXT,
    status TEXT DEFAULT 'completed', -- pending, completed, refunded, failed
    purchased_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (avatar_id) REFERENCES avatars(id),
    UNIQUE(user_id, avatar_id)
);

-- User favorites
CREATE TABLE user_favorites (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    entity_type TEXT NOT NULL, -- avatar, image, template
    entity_id TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE(user_id, entity_type, entity_id)
);
```

### 6. Application State & Cache
```sql
-- User preferences (replaces localStorage settings)
CREATE TABLE user_preferences (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    preference_key TEXT NOT NULL,
    preference_value TEXT, -- JSON value
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE(user_id, preference_key)
);

-- UI state cache (replaces localStorage UI state)
CREATE TABLE ui_state_cache (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    component_key TEXT NOT NULL, -- e.g., 'chatbot_selected_avatar', 'marketplace_filters'
    state_data TEXT NOT NULL, -- JSON state
    expires_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE(user_id, component_key)
);

-- Training data cache (replaces localStorage cache)
CREATE TABLE training_cache (
    id TEXT PRIMARY KEY,
    avatar_id TEXT NOT NULL,
    cache_key TEXT NOT NULL,
    cache_data TEXT NOT NULL, -- JSON data
    expires_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (avatar_id) REFERENCES avatars(id) ON DELETE CASCADE,
    UNIQUE(avatar_id, cache_key)
);
```

### 7. Analytics & Logs
```sql
-- User activity tracking
CREATE TABLE user_activities (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    session_id TEXT,
    activity_type TEXT NOT NULL, -- login, avatar_created, image_generated, etc
    entity_type TEXT, -- avatar, image, etc
    entity_id TEXT,
    metadata TEXT, -- JSON additional data
    ip_address TEXT,
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (session_id) REFERENCES user_sessions(id)
);

-- System logs
CREATE TABLE system_logs (
    id TEXT PRIMARY KEY,
    level TEXT NOT NULL, -- debug, info, warn, error
    category TEXT NOT NULL, -- auth, avatar, image, etc
    message TEXT NOT NULL,
    metadata TEXT, -- JSON additional data
    user_id TEXT,
    session_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (session_id) REFERENCES user_sessions(id)
);
```

## Indexes for Performance
```sql
-- User indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_referral_code ON users(referral_code);
CREATE INDEX idx_users_status ON users(status);

-- Session indexes
CREATE INDEX idx_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_sessions_expires_at ON user_sessions(expires_at);

-- Avatar indexes
CREATE INDEX idx_avatars_user_id ON avatars(user_id);
CREATE INDEX idx_avatars_marketplace ON avatars(is_marketplace_item, status);
CREATE INDEX idx_avatars_status ON avatars(status);

-- Knowledge file indexes
CREATE INDEX idx_knowledge_files_avatar_id ON knowledge_files(avatar_id);
CREATE INDEX idx_knowledge_files_user_id ON knowledge_files(user_id);
CREATE INDEX idx_knowledge_files_status ON knowledge_files(status);

-- Image indexes
CREATE INDEX idx_generated_images_user_id ON generated_images(user_id);
CREATE INDEX idx_generated_images_created_at ON generated_images(created_at);
CREATE INDEX idx_generated_images_favorites ON generated_images(user_id, is_favorite);

-- Collection indexes
CREATE INDEX idx_collections_user_id ON image_collections(user_id);
CREATE INDEX idx_collection_items_collection_id ON collection_items(collection_id);

-- Activity indexes
CREATE INDEX idx_activities_user_id ON user_activities(user_id);
CREATE INDEX idx_activities_created_at ON user_activities(created_at);
CREATE INDEX idx_activities_type ON user_activities(activity_type);
```