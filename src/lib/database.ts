import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';

// Database interface types
export interface User {
  id: string;
  email: string;
  password_hash?: string;
  name?: string;
  avatar_url?: string;
  phone?: string;
  referral_code?: string;
  referrer_id?: string;
  auth_provider: string;
  auth_provider_id?: string;
  email_verified: boolean;
  created_at: string;
  updated_at: string;
  last_login?: string;
  status: string;
}

export interface Avatar {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  age?: number;
  gender?: string;
  origin_country: string;
  primary_language: string;
  secondary_languages?: string; // JSON array
  mbti_type?: string;
  personality_traits?: string; // JSON array
  backstory?: string;
  hidden_rules?: string;
  favorites?: string; // JSON array
  lifestyle?: string; // JSON array
  voice_description?: string;
  avatar_images?: string; // JSON array
  gallery_images?: string; // JSON array
  price: number;
  is_marketplace_item: boolean;
  creator_studio?: string;
  total_sales: number;
  system_prompt?: string;
  user_prompt?: string;
  training_instructions?: string;
  training_status: string;
  last_trained_at?: string;
  status: string;
  deleted_at?: string;
  deleted_by?: string;
  deletion_reason?: string;
  scheduled_hard_delete_at?: string;
  created_at: string;
  updated_at: string;
}

export interface GeneratedImage {
  id: string;
  user_id: string;
  prompt: string;
  negative_prompt?: string;
  generation_type: string;
  model_used?: string;
  seed?: number;
  steps?: number;
  cfg_scale?: number;
  width?: number;
  height?: number;
  image_url: string;
  original_image_url?: string;
  thumbnail_url?: string;
  is_favorite: boolean;
  tags?: string; // JSON array
  created_at: string;
  updated_at: string;
}

export interface KnowledgeFile {
  id: string;
  avatar_id: string;
  user_id: string;
  file_name: string;
  original_name: string;
  file_path: string;
  file_size: number;
  content_type: string;
  file_hash?: string;
  extracted_text?: string;
  processing_status: string;
  processing_error?: string;
  tags?: string; // JSON array
  is_linked: boolean;
  link_url?: string;
  status: string;
  deleted_at?: string;
  deleted_by?: string;
  deletion_reason?: string;
  scheduled_hard_delete_at?: string;
  uploaded_at: string;
  updated_at: string;
}

class AvatarLabDatabase {
  private db: Database.Database;
  private dbPath: string;

  constructor(dbPath?: string) {
    // Default to user data directory
    this.dbPath = dbPath || this.getDefaultDbPath();

    // Ensure directory exists
    const dir = path.dirname(this.dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    this.db = new Database(this.dbPath);
    this.db.pragma('journal_mode = WAL'); // Enable WAL mode for better performance
    this.db.pragma('foreign_keys = ON'); // Enable foreign key constraints

    this.initializeTables();
  }

  private getDefaultDbPath(): string {
    const os = require('os');
    const userDataPath = path.join(os.homedir(), '.avatarlab');
    return path.join(userDataPath, 'avatarlab.db');
  }

  private initializeTables() {
    // Read and execute schema
    const schemaPath = path.join(__dirname, 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      const schema = fs.readFileSync(schemaPath, 'utf8');
      this.db.exec(schema);
    } else {
      // Fallback: create tables inline
      this.createTables();
    }
  }

  private createTables() {
    const tables = `
      -- Users table
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT,
        name TEXT,
        avatar_url TEXT,
        phone TEXT,
        referral_code TEXT UNIQUE,
        referrer_id TEXT,
        auth_provider TEXT DEFAULT 'local',
        auth_provider_id TEXT,
        email_verified BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_login DATETIME,
        status TEXT DEFAULT 'active',
        FOREIGN KEY (referrer_id) REFERENCES users(id)
      );

      -- User sessions
      CREATE TABLE IF NOT EXISTS user_sessions (
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

      -- Avatar templates
      CREATE TABLE IF NOT EXISTS avatar_templates (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        content TEXT NOT NULL,
        category TEXT,
        template_type TEXT NOT NULL,
        tags TEXT,
        difficulty_level INTEGER DEFAULT 1,
        estimated_time INTEGER,
        author_id TEXT,
        is_public BOOLEAN DEFAULT FALSE,
        is_featured BOOLEAN DEFAULT FALSE,
        usage_count INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (author_id) REFERENCES users(id)
      );

      -- Avatars
      CREATE TABLE IF NOT EXISTS avatars (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        age INTEGER,
        gender TEXT,
        origin_country TEXT DEFAULT 'US',
        primary_language TEXT DEFAULT 'English',
        secondary_languages TEXT,
        mbti_type TEXT,
        personality_traits TEXT,
        backstory TEXT,
        hidden_rules TEXT,
        favorites TEXT,
        lifestyle TEXT,
        voice_description TEXT,
        avatar_images TEXT,
        gallery_images TEXT,
        price DECIMAL(10,2) DEFAULT 0,
        is_marketplace_item BOOLEAN DEFAULT FALSE,
        creator_studio TEXT,
        total_sales INTEGER DEFAULT 0,
        system_prompt TEXT,
        user_prompt TEXT,
        training_instructions TEXT,
        training_status TEXT DEFAULT 'untrained',
        last_trained_at DATETIME,
        status TEXT DEFAULT 'active',
        deleted_at DATETIME,
        deleted_by TEXT,
        deletion_reason TEXT,
        scheduled_hard_delete_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (deleted_by) REFERENCES users(id)
      );

      -- Avatar versions
      CREATE TABLE IF NOT EXISTS avatar_versions (
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

      -- Knowledge files
      CREATE TABLE IF NOT EXISTS knowledge_files (
        id TEXT PRIMARY KEY,
        avatar_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        file_name TEXT NOT NULL,
        original_name TEXT NOT NULL,
        file_path TEXT NOT NULL,
        file_size INTEGER NOT NULL,
        content_type TEXT NOT NULL,
        file_hash TEXT,
        extracted_text TEXT,
        processing_status TEXT DEFAULT 'pending',
        processing_error TEXT,
        tags TEXT,
        is_linked BOOLEAN DEFAULT TRUE,
        link_url TEXT,
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

      -- Generated images
      CREATE TABLE IF NOT EXISTS generated_images (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        prompt TEXT NOT NULL,
        negative_prompt TEXT,
        generation_type TEXT DEFAULT 'text2img',
        model_used TEXT,
        seed INTEGER,
        steps INTEGER,
        cfg_scale REAL,
        width INTEGER,
        height INTEGER,
        image_url TEXT NOT NULL,
        original_image_url TEXT,
        thumbnail_url TEXT,
        is_favorite BOOLEAN DEFAULT FALSE,
        tags TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );

      -- Image collections
      CREATE TABLE IF NOT EXISTS image_collections (
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

      -- Collection items
      CREATE TABLE IF NOT EXISTS collection_items (
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

      -- Purchases
      CREATE TABLE IF NOT EXISTS purchases (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        avatar_id TEXT NOT NULL,
        price_paid DECIMAL(10,2) NOT NULL,
        currency TEXT DEFAULT 'USD',
        payment_method TEXT,
        transaction_id TEXT,
        status TEXT DEFAULT 'completed',
        purchased_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (avatar_id) REFERENCES avatars(id),
        UNIQUE(user_id, avatar_id)
      );

      -- User preferences
      CREATE TABLE IF NOT EXISTS user_preferences (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        preference_key TEXT NOT NULL,
        preference_value TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        UNIQUE(user_id, preference_key)
      );

      -- UI state cache
      CREATE TABLE IF NOT EXISTS ui_state_cache (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        component_key TEXT NOT NULL,
        state_data TEXT NOT NULL,
        expires_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        UNIQUE(user_id, component_key)
      );

      -- Training cache
      CREATE TABLE IF NOT EXISTS training_cache (
        id TEXT PRIMARY KEY,
        avatar_id TEXT NOT NULL,
        cache_key TEXT NOT NULL,
        cache_data TEXT NOT NULL,
        expires_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (avatar_id) REFERENCES avatars(id) ON DELETE CASCADE,
        UNIQUE(avatar_id, cache_key)
      );
    `;

    this.db.exec(tables);
    this.createIndexes();
  }

  private createIndexes() {
    const indexes = `
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code);
      CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
      CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON user_sessions(user_id);
      CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON user_sessions(expires_at);
      CREATE INDEX IF NOT EXISTS idx_avatars_user_id ON avatars(user_id);
      CREATE INDEX IF NOT EXISTS idx_avatars_marketplace ON avatars(is_marketplace_item, status);
      CREATE INDEX IF NOT EXISTS idx_avatars_status ON avatars(status);
      CREATE INDEX IF NOT EXISTS idx_knowledge_files_avatar_id ON knowledge_files(avatar_id);
      CREATE INDEX IF NOT EXISTS idx_knowledge_files_user_id ON knowledge_files(user_id);
      CREATE INDEX IF NOT EXISTS idx_knowledge_files_status ON knowledge_files(status);
      CREATE INDEX IF NOT EXISTS idx_generated_images_user_id ON generated_images(user_id);
      CREATE INDEX IF NOT EXISTS idx_generated_images_created_at ON generated_images(created_at);
      CREATE INDEX IF NOT EXISTS idx_generated_images_favorites ON generated_images(user_id, is_favorite);
      CREATE INDEX IF NOT EXISTS idx_collections_user_id ON image_collections(user_id);
      CREATE INDEX IF NOT EXISTS idx_collection_items_collection_id ON collection_items(collection_id);
    `;

    this.db.exec(indexes);
  }

  // Utility methods
  generateId(): string {
    return uuidv4();
  }

  close() {
    this.db.close();
  }

  // User methods
  createUser(userData: Partial<User>): User {
    const id = this.generateId();
    const now = new Date().toISOString();

    const user: User = {
      id,
      email: userData.email!,
      password_hash: userData.password_hash,
      name: userData.name,
      avatar_url: userData.avatar_url,
      phone: userData.phone,
      referral_code: userData.referral_code,
      referrer_id: userData.referrer_id,
      auth_provider: userData.auth_provider || 'local',
      auth_provider_id: userData.auth_provider_id,
      email_verified: userData.email_verified || false,
      created_at: now,
      updated_at: now,
      last_login: userData.last_login,
      status: userData.status || 'active'
    };

    const stmt = this.db.prepare(`
      INSERT INTO users (
        id, email, password_hash, name, avatar_url, phone, referral_code,
        referrer_id, auth_provider, auth_provider_id, email_verified,
        created_at, updated_at, last_login, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      user.id, user.email, user.password_hash, user.name, user.avatar_url,
      user.phone, user.referral_code, user.referrer_id, user.auth_provider,
      user.auth_provider_id, user.email_verified, user.created_at,
      user.updated_at, user.last_login, user.status
    );

    return user;
  }

  getUserByEmail(email: string): User | null {
    const stmt = this.db.prepare('SELECT * FROM users WHERE email = ?');
    return stmt.get(email) as User || null;
  }

  getUserById(id: string): User | null {
    const stmt = this.db.prepare('SELECT * FROM users WHERE id = ?');
    return stmt.get(id) as User || null;
  }

  // Avatar methods
  createAvatar(avatarData: Partial<Avatar>): Avatar {
    const id = this.generateId();
    const now = new Date().toISOString();

    const avatar: Avatar = {
      id,
      user_id: avatarData.user_id!,
      name: avatarData.name!,
      description: avatarData.description,
      age: avatarData.age,
      gender: avatarData.gender,
      origin_country: avatarData.origin_country || 'US',
      primary_language: avatarData.primary_language || 'English',
      secondary_languages: avatarData.secondary_languages,
      mbti_type: avatarData.mbti_type,
      personality_traits: avatarData.personality_traits,
      backstory: avatarData.backstory,
      hidden_rules: avatarData.hidden_rules,
      favorites: avatarData.favorites,
      lifestyle: avatarData.lifestyle,
      voice_description: avatarData.voice_description,
      avatar_images: avatarData.avatar_images,
      gallery_images: avatarData.gallery_images,
      price: avatarData.price || 0,
      is_marketplace_item: avatarData.is_marketplace_item || false,
      creator_studio: avatarData.creator_studio,
      total_sales: avatarData.total_sales || 0,
      system_prompt: avatarData.system_prompt,
      user_prompt: avatarData.user_prompt,
      training_instructions: avatarData.training_instructions,
      training_status: avatarData.training_status || 'untrained',
      last_trained_at: avatarData.last_trained_at,
      status: avatarData.status || 'active',
      deleted_at: avatarData.deleted_at,
      deleted_by: avatarData.deleted_by,
      deletion_reason: avatarData.deletion_reason,
      scheduled_hard_delete_at: avatarData.scheduled_hard_delete_at,
      created_at: now,
      updated_at: now
    };

    const stmt = this.db.prepare(`
      INSERT INTO avatars (
        id, user_id, name, description, age, gender, origin_country,
        primary_language, secondary_languages, mbti_type, personality_traits,
        backstory, hidden_rules, favorites, lifestyle, voice_description,
        avatar_images, gallery_images, price, is_marketplace_item,
        creator_studio, total_sales, system_prompt, user_prompt,
        training_instructions, training_status, last_trained_at, status,
        deleted_at, deleted_by, deletion_reason, scheduled_hard_delete_at,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      avatar.id, avatar.user_id, avatar.name, avatar.description, avatar.age,
      avatar.gender, avatar.origin_country, avatar.primary_language,
      avatar.secondary_languages, avatar.mbti_type, avatar.personality_traits,
      avatar.backstory, avatar.hidden_rules, avatar.favorites, avatar.lifestyle,
      avatar.voice_description, avatar.avatar_images, avatar.gallery_images,
      avatar.price, avatar.is_marketplace_item, avatar.creator_studio,
      avatar.total_sales, avatar.system_prompt, avatar.user_prompt,
      avatar.training_instructions, avatar.training_status, avatar.last_trained_at,
      avatar.status, avatar.deleted_at, avatar.deleted_by, avatar.deletion_reason,
      avatar.scheduled_hard_delete_at, avatar.created_at, avatar.updated_at
    );

    return avatar;
  }

  getAvatarsByUserId(userId: string): Avatar[] {
    const stmt = this.db.prepare('SELECT * FROM avatars WHERE user_id = ? AND status = "active" ORDER BY created_at DESC');
    return stmt.all(userId) as Avatar[];
  }

  getAvatarById(id: string): Avatar | null {
    const stmt = this.db.prepare('SELECT * FROM avatars WHERE id = ?');
    return stmt.get(id) as Avatar || null;
  }

  updateAvatar(id: string, updates: Partial<Avatar>): boolean {
    const updateFields = Object.keys(updates).filter(key => key !== 'id').map(key => `${key} = ?`);
    const updateValues = Object.keys(updates).filter(key => key !== 'id').map(key => updates[key as keyof Avatar]);

    if (updateFields.length === 0) return false;

    updateValues.push(new Date().toISOString()); // updated_at
    updateValues.push(id); // WHERE clause

    const stmt = this.db.prepare(`
      UPDATE avatars
      SET ${updateFields.join(', ')}, updated_at = ?
      WHERE id = ?
    `);

    const result = stmt.run(...updateValues);
    return result.changes > 0;
  }

  // Marketplace methods
  getMarketplaceAvatars(filters?: { category?: string; priceRange?: string; search?: string }): Avatar[] {
    let query = `
      SELECT a.*, u.name as creator_name,
             AVG(r.rating) as avg_rating,
             COUNT(r.id) as review_count
      FROM avatars a
      LEFT JOIN users u ON a.user_id = u.id
      LEFT JOIN avatar_reviews r ON a.id = r.avatar_id
      WHERE a.is_marketplace_item = 1 AND a.status = 'active'
    `;

    const params: any[] = [];

    if (filters?.search) {
      query += ' AND (a.name LIKE ? OR a.description LIKE ?)';
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }

    query += ' GROUP BY a.id ORDER BY a.total_sales DESC, a.created_at DESC';

    const stmt = this.db.prepare(query);
    return stmt.all(...params) as Avatar[];
  }

  // Purchase methods
  createPurchase(userId: string, avatarId: string, pricePaid: number): boolean {
    const id = this.generateId();
    const stmt = this.db.prepare(`
      INSERT INTO purchases (id, user_id, avatar_id, price_paid, purchased_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);

    const result = stmt.run(id, userId, avatarId, pricePaid);

    // Update avatar sales count
    if (result.changes > 0) {
      const updateStmt = this.db.prepare('UPDATE avatars SET total_sales = total_sales + 1 WHERE id = ?');
      updateStmt.run(avatarId);
    }

    return result.changes > 0;
  }

  getUserPurchases(userId: string): string[] {
    const stmt = this.db.prepare('SELECT avatar_id FROM purchases WHERE user_id = ? AND status = "completed"');
    const purchases = stmt.all(userId) as { avatar_id: string }[];
    return purchases.map(p => p.avatar_id);
  }

  // Cache methods (replacing localStorage)
  setUIState(userId: string, componentKey: string, stateData: any, expiresIn?: number): boolean {
    const id = this.generateId();
    const now = new Date();
    const expiresAt = expiresIn ? new Date(now.getTime() + expiresIn) : null;

    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO ui_state_cache (id, user_id, component_key, state_data, expires_at, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      id, userId, componentKey, JSON.stringify(stateData),
      expiresAt?.toISOString(), now.toISOString(), now.toISOString()
    );

    return result.changes > 0;
  }

  getUIState(userId: string, componentKey: string): any | null {
    const stmt = this.db.prepare(`
      SELECT state_data FROM ui_state_cache
      WHERE user_id = ? AND component_key = ?
      AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
    `);

    const result = stmt.get(userId, componentKey) as { state_data: string } | undefined;

    if (result) {
      try {
        return JSON.parse(result.state_data);
      } catch {
        return null;
      }
    }

    return null;
  }

  setTrainingCache(avatarId: string, cacheKey: string, cacheData: any, expiresIn?: number): boolean {
    const id = this.generateId();
    const now = new Date();
    const expiresAt = expiresIn ? new Date(now.getTime() + expiresIn) : null;

    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO training_cache (id, avatar_id, cache_key, cache_data, expires_at, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      id, avatarId, cacheKey, JSON.stringify(cacheData),
      expiresAt?.toISOString(), now.toISOString(), now.toISOString()
    );

    return result.changes > 0;
  }

  getTrainingCache(avatarId: string, cacheKey: string): any | null {
    const stmt = this.db.prepare(`
      SELECT cache_data FROM training_cache
      WHERE avatar_id = ? AND cache_key = ?
      AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
    `);

    const result = stmt.get(avatarId, cacheKey) as { cache_data: string } | undefined;

    if (result) {
      try {
        return JSON.parse(result.cache_data);
      } catch {
        return null;
      }
    }

    return null;
  }

  // Cleanup expired cache entries
  cleanupExpiredCache(): number {
    const stmt1 = this.db.prepare('DELETE FROM ui_state_cache WHERE expires_at IS NOT NULL AND expires_at <= CURRENT_TIMESTAMP');
    const stmt2 = this.db.prepare('DELETE FROM training_cache WHERE expires_at IS NOT NULL AND expires_at <= CURRENT_TIMESTAMP');

    const result1 = stmt1.run();
    const result2 = stmt2.run();

    return result1.changes + result2.changes;
  }
}

// Singleton instance
let dbInstance: AvatarLabDatabase | null = null;

export function getDatabase(dbPath?: string): AvatarLabDatabase {
  if (!dbInstance) {
    dbInstance = new AvatarLabDatabase(dbPath);
  }
  return dbInstance;
}

export function closeDatabase() {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}

export default AvatarLabDatabase;