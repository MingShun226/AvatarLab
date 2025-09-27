import Dexie, { Table } from 'dexie';
import { v4 as uuidv4 } from 'uuid';

// Database interface types
export interface User {
  id?: string;
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
  id?: string;
  user_id: string;
  name: string;
  description?: string;
  age?: number;
  gender?: string;
  origin_country: string;
  primary_language: string;
  secondary_languages?: string[]; // Direct array instead of JSON string
  mbti_type?: string;
  personality_traits?: string[]; // Direct array instead of JSON string
  backstory?: string;
  hidden_rules?: string;
  favorites?: string[]; // Direct array instead of JSON string
  lifestyle?: string[]; // Direct array instead of JSON string
  voice_description?: string;
  avatar_images?: string[]; // Direct array instead of JSON string
  gallery_images?: string[]; // Direct array instead of JSON string
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
  id?: string;
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
  tags?: string[]; // Direct array instead of JSON string
  created_at: string;
  updated_at: string;
}

export interface KnowledgeFile {
  id?: string;
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
  tags?: string[]; // Direct array instead of JSON string
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

export interface Purchase {
  id?: string;
  user_id: string;
  avatar_id: string;
  price_paid: number;
  currency: string;
  payment_method?: string;
  transaction_id?: string;
  status: string;
  purchased_at: string;
}

export interface UIStateCache {
  id?: string;
  user_id: string;
  component_key: string;
  state_data: any; // Dexie handles JSON automatically
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

export interface TrainingCache {
  id?: string;
  avatar_id: string;
  cache_key: string;
  cache_data: any; // Dexie handles JSON automatically
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ImageCollection {
  id?: string;
  user_id: string;
  name: string;
  description?: string;
  cover_image_id?: string;
  is_public: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface CollectionItem {
  id?: string;
  collection_id: string;
  image_id: string;
  user_id: string;
  sort_order: number;
  added_at: string;
}

export interface AvatarReview {
  id?: string;
  avatar_id: string;
  user_id: string;
  rating: number;
  review?: string;
  created_at: string;
  updated_at: string;
}

class AvatarLabDatabase extends Dexie {
  users!: Table<User, string>;
  avatars!: Table<Avatar, string>;
  generated_images!: Table<GeneratedImage, string>;
  knowledge_files!: Table<KnowledgeFile, string>;
  purchases!: Table<Purchase, string>;
  ui_state_cache!: Table<UIStateCache, string>;
  training_cache!: Table<TrainingCache, string>;
  image_collections!: Table<ImageCollection, string>;
  collection_items!: Table<CollectionItem, string>;
  avatar_reviews!: Table<AvatarReview, string>;

  constructor() {
    super('AvatarLabDatabase');

    this.version(1).stores({
      users: 'id, email, referral_code, status, created_at',
      avatars: 'id, user_id, name, is_marketplace_item, status, created_at, price',
      generated_images: 'id, user_id, is_favorite, created_at',
      knowledge_files: 'id, avatar_id, user_id, status, uploaded_at',
      purchases: 'id, user_id, avatar_id, status, purchased_at',
      ui_state_cache: 'id, [user_id+component_key], user_id, expires_at',
      training_cache: 'id, [avatar_id+cache_key], avatar_id, expires_at',
      image_collections: 'id, user_id, created_at',
      collection_items: 'id, collection_id, image_id, user_id',
      avatar_reviews: 'id, avatar_id, user_id, [avatar_id+user_id]'
    });

    // Add hooks for automatic timestamps and ID generation
    this.users.hook('creating', function (primKey, obj, trans) {
      obj.id = obj.id || uuidv4();
      obj.created_at = obj.created_at || new Date().toISOString();
      obj.updated_at = obj.updated_at || new Date().toISOString();
    });

    this.users.hook('updating', function (modifications) {
      modifications.updated_at = new Date().toISOString();
    });

    this.avatars.hook('creating', function (primKey, obj, trans) {
      obj.id = obj.id || uuidv4();
      obj.created_at = obj.created_at || new Date().toISOString();
      obj.updated_at = obj.updated_at || new Date().toISOString();
    });

    this.avatars.hook('updating', function (modifications) {
      modifications.updated_at = new Date().toISOString();
    });

    this.generated_images.hook('creating', function (primKey, obj, trans) {
      obj.id = obj.id || uuidv4();
      obj.created_at = obj.created_at || new Date().toISOString();
      obj.updated_at = obj.updated_at || new Date().toISOString();
    });

    this.knowledge_files.hook('creating', function (primKey, obj, trans) {
      obj.id = obj.id || uuidv4();
      obj.uploaded_at = obj.uploaded_at || new Date().toISOString();
      obj.updated_at = obj.updated_at || new Date().toISOString();
    });

    this.purchases.hook('creating', function (primKey, obj, trans) {
      obj.id = obj.id || uuidv4();
      obj.purchased_at = obj.purchased_at || new Date().toISOString();
    });

    this.ui_state_cache.hook('creating', function (primKey, obj, trans) {
      obj.id = obj.id || uuidv4();
      obj.created_at = obj.created_at || new Date().toISOString();
      obj.updated_at = obj.updated_at || new Date().toISOString();
    });

    this.training_cache.hook('creating', function (primKey, obj, trans) {
      obj.id = obj.id || uuidv4();
      obj.created_at = obj.created_at || new Date().toISOString();
      obj.updated_at = obj.updated_at || new Date().toISOString();
    });

    this.image_collections.hook('creating', function (primKey, obj, trans) {
      obj.id = obj.id || uuidv4();
      obj.created_at = obj.created_at || new Date().toISOString();
      obj.updated_at = obj.updated_at || new Date().toISOString();
    });

    this.collection_items.hook('creating', function (primKey, obj, trans) {
      obj.id = obj.id || uuidv4();
      obj.added_at = obj.added_at || new Date().toISOString();
    });

    this.avatar_reviews.hook('creating', function (primKey, obj, trans) {
      obj.id = obj.id || uuidv4();
      obj.created_at = obj.created_at || new Date().toISOString();
      obj.updated_at = obj.updated_at || new Date().toISOString();
    });
  }

  // Utility methods
  generateId(): string {
    return uuidv4();
  }

  // User methods
  async createUser(userData: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<User> {
    const user: User = {
      ...userData,
      auth_provider: userData.auth_provider || 'local',
      email_verified: userData.email_verified || false,
      status: userData.status || 'active'
    };

    const id = await this.users.add(user);
    return { ...user, id };
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return await this.users.where('email').equals(email).first();
  }

  async getUserById(id: string): Promise<User | undefined> {
    return await this.users.get(id);
  }

  // Avatar methods
  async createAvatar(avatarData: Omit<Avatar, 'id' | 'created_at' | 'updated_at'>): Promise<Avatar> {
    const avatar: Avatar = {
      ...avatarData,
      origin_country: avatarData.origin_country || 'US',
      primary_language: avatarData.primary_language || 'English',
      price: avatarData.price || 0,
      is_marketplace_item: avatarData.is_marketplace_item || false,
      total_sales: avatarData.total_sales || 0,
      training_status: avatarData.training_status || 'untrained',
      status: avatarData.status || 'active'
    };

    const id = await this.avatars.add(avatar);
    return { ...avatar, id };
  }

  async getAvatarsByUserId(userId: string): Promise<Avatar[]> {
    return await this.avatars
      .where('user_id').equals(userId)
      .and(avatar => avatar.status === 'active')
      .reverse()
      .sortBy('created_at');
  }

  async getAvatarById(id: string): Promise<Avatar | undefined> {
    return await this.avatars.get(id);
  }

  async updateAvatar(id: string, updates: Partial<Avatar>): Promise<number> {
    return await this.avatars.update(id, updates);
  }

  // Marketplace methods
  async getMarketplaceAvatars(filters?: {
    category?: string;
    priceRange?: string;
    search?: string
  }): Promise<Avatar[]> {
    let collection = this.avatars
      .where('is_marketplace_item').equals(true)
      .and(avatar => avatar.status === 'active');

    if (filters?.search) {
      collection = collection.and(avatar =>
        avatar.name.toLowerCase().includes(filters.search!.toLowerCase()) ||
        (avatar.description && avatar.description.toLowerCase().includes(filters.search!.toLowerCase()))
      );
    }

    const avatars = await collection.reverse().sortBy('total_sales');
    return avatars;
  }

  // Purchase methods
  async createPurchase(userId: string, avatarId: string, pricePaid: number): Promise<boolean> {
    try {
      await this.transaction('rw', [this.purchases, this.avatars], async () => {
        // Create purchase record
        await this.purchases.add({
          user_id: userId,
          avatar_id: avatarId,
          price_paid: pricePaid,
          currency: 'USD',
          status: 'completed'
        });

        // Update avatar sales count
        const avatar = await this.avatars.get(avatarId);
        if (avatar) {
          await this.avatars.update(avatarId, {
            total_sales: (avatar.total_sales || 0) + 1
          });
        }
      });

      return true;
    } catch (error) {
      console.error('Error creating purchase:', error);
      return false;
    }
  }

  async getUserPurchases(userId: string): Promise<string[]> {
    const purchases = await this.purchases
      .where('user_id').equals(userId)
      .and(purchase => purchase.status === 'completed')
      .toArray();

    return purchases.map(p => p.avatar_id);
  }

  // Cache methods (replacing localStorage)
  async setUIState(userId: string, componentKey: string, stateData: any, expiresIn?: number): Promise<boolean> {
    try {
      const expiresAt = expiresIn ?
        new Date(Date.now() + expiresIn).toISOString() :
        undefined;

      // Use put to insert or update
      await this.ui_state_cache.put({
        user_id: userId,
        component_key: componentKey,
        state_data: stateData,
        expires_at: expiresAt
      });

      return true;
    } catch (error) {
      console.error('Error setting UI state:', error);
      return false;
    }
  }

  async getUIState(userId: string, componentKey: string): Promise<any | null> {
    try {
      const cache = await this.ui_state_cache
        .where('[user_id+component_key]')
        .equals([userId, componentKey])
        .first();

      if (!cache) return null;

      // Check expiration
      if (cache.expires_at && new Date(cache.expires_at) <= new Date()) {
        await this.ui_state_cache.delete(cache.id!);
        return null;
      }

      return cache.state_data;
    } catch (error) {
      console.error('Error getting UI state:', error);
      return null;
    }
  }

  async setTrainingCache(avatarId: string, cacheKey: string, cacheData: any, expiresIn?: number): Promise<boolean> {
    try {
      const expiresAt = expiresIn ?
        new Date(Date.now() + expiresIn).toISOString() :
        undefined;

      await this.training_cache.put({
        avatar_id: avatarId,
        cache_key: cacheKey,
        cache_data: cacheData,
        expires_at: expiresAt
      });

      return true;
    } catch (error) {
      console.error('Error setting training cache:', error);
      return false;
    }
  }

  async getTrainingCache(avatarId: string, cacheKey: string): Promise<any | null> {
    try {
      const cache = await this.training_cache
        .where('[avatar_id+cache_key]')
        .equals([avatarId, cacheKey])
        .first();

      if (!cache) return null;

      // Check expiration
      if (cache.expires_at && new Date(cache.expires_at) <= new Date()) {
        await this.training_cache.delete(cache.id!);
        return null;
      }

      return cache.cache_data;
    } catch (error) {
      console.error('Error getting training cache:', error);
      return null;
    }
  }

  // Cleanup expired cache entries
  async cleanupExpiredCache(): Promise<number> {
    const now = new Date().toISOString();

    const expiredUI = await this.ui_state_cache
      .where('expires_at').below(now)
      .delete();

    const expiredTraining = await this.training_cache
      .where('expires_at').below(now)
      .delete();

    return expiredUI + expiredTraining;
  }

  // Database statistics
  async getStats() {
    const [users, avatars, marketplaceAvatars, images, files, purchases] = await Promise.all([
      this.users.count(),
      this.avatars.where('status').equals('active').count(),
      this.avatars.where('is_marketplace_item').equals(true).count(),
      this.generated_images.count(),
      this.knowledge_files.where('status').equals('active').count(),
      this.purchases.where('status').equals('completed').count()
    ]);

    return {
      users: { count: users },
      avatars: { count: avatars },
      marketplaceAvatars: { count: marketplaceAvatars },
      generatedImages: { count: images },
      knowledgeFiles: { count: files },
      purchases: { count: purchases }
    };
  }
}

// Singleton instance
let dbInstance: AvatarLabDatabase | null = null;

export function getDatabase(): AvatarLabDatabase {
  if (!dbInstance) {
    dbInstance = new AvatarLabDatabase();
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