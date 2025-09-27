import { getDatabase, Avatar, User, GeneratedImage } from './dexieDatabase';
import { supabase } from '../integrations/supabase/client';
import { avatarProfiles } from '../data/avatarData';

export interface MigrationProgress {
  step: string;
  current: number;
  total: number;
  message: string;
}

export type MigrationCallback = (progress: MigrationProgress) => void;

export class DexieMigration {
  private db = getDatabase();

  async migrateFromSupabaseAndLocalStorage(
    userId: string,
    onProgress?: MigrationCallback
  ): Promise<void> {
    const steps = [
      'Migrating user profile',
      'Migrating avatars from Supabase',
      'Migrating generated images',
      'Migrating knowledge files',
      'Migrating localStorage data',
      'Setting up marketplace avatars',
      'Cleaning up and finalizing'
    ];

    let currentStep = 0;

    const updateProgress = (message: string, current: number = 0, total: number = 1) => {
      if (onProgress) {
        onProgress({
          step: steps[currentStep],
          current,
          total,
          message
        });
      }
    };

    try {
      // Step 1: Migrate user profile
      updateProgress('Fetching user profile from Supabase');
      await this.migrateUserProfile(userId);
      currentStep++;

      // Step 2: Migrate avatars from Supabase
      updateProgress('Fetching avatars from Supabase');
      const avatars = await this.migrateAvatarsFromSupabase(userId, updateProgress);
      currentStep++;

      // Step 3: Migrate generated images
      updateProgress('Fetching generated images from Supabase');
      await this.migrateGeneratedImages(userId, updateProgress);
      currentStep++;

      // Step 4: Migrate knowledge files
      updateProgress('Fetching knowledge files from Supabase');
      await this.migrateKnowledgeFiles(userId, updateProgress);
      currentStep++;

      // Step 5: Migrate localStorage data
      updateProgress('Migrating localStorage cache and preferences');
      await this.migrateLocalStorageData(userId, avatars);
      currentStep++;

      // Step 6: Set up marketplace avatars (static data)
      updateProgress('Setting up marketplace avatars');
      await this.setupMarketplaceAvatars();
      currentStep++;

      // Step 7: Cleanup
      updateProgress('Finalizing migration');
      await this.finalizeMigration();
      currentStep++;

      updateProgress('Migration completed successfully!');

    } catch (error) {
      console.error('Migration failed:', error);
      throw new Error(`Migration failed at step "${steps[currentStep]}": ${error.message}`);
    }
  }

  private async migrateUserProfile(userId: string): Promise<void> {
    // Check if user already exists
    const existingUser = await this.db.getUserById(userId);
    if (existingUser) {
      console.log('User already exists in local database');
      return;
    }

    // Fetch from Supabase
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      // Create a minimal user record
      await this.db.createUser({
        email: 'migrated@user.local',
        name: 'Migrated User',
        auth_provider: 'migration',
        email_verified: false,
        status: 'active'
      });
      return;
    }

    // Create user in local database
    await this.db.createUser({
      email: profile.email || 'migrated@user.local',
      name: profile.name,
      avatar_url: profile.avatar_url,
      phone: profile.phone,
      referral_code: profile.referral_code,
      auth_provider: 'migration',
      email_verified: false,
      status: 'active'
    });

    console.log('User profile migrated successfully');
  }

  private async migrateAvatarsFromSupabase(
    userId: string,
    updateProgress: (message: string, current?: number, total?: number) => void
  ): Promise<Avatar[]> {
    // Fetch avatars from Supabase
    const { data: avatars, error } = await supabase
      .from('avatars')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active');

    if (error) {
      console.error('Error fetching avatars:', error);
      return [];
    }

    const migratedAvatars: Avatar[] = [];

    for (let i = 0; i < avatars.length; i++) {
      const avatar = avatars[i];
      updateProgress(`Migrating avatar: ${avatar.name}`, i + 1, avatars.length);

      try {
        const migratedAvatar = await this.db.createAvatar({
          user_id: userId,
          name: avatar.name,
          description: avatar.description,
          age: avatar.age,
          gender: avatar.gender,
          origin_country: avatar.origin_country || 'US',
          primary_language: avatar.primary_language || 'English',
          secondary_languages: avatar.secondary_languages || [],
          mbti_type: avatar.mbti_type,
          personality_traits: avatar.personality_traits || [],
          backstory: avatar.backstory,
          hidden_rules: avatar.hidden_rules,
          avatar_images: avatar.avatar_images || [],
          system_prompt: '', // These will be migrated from localStorage
          user_prompt: '',
          training_instructions: '',
          training_status: 'untrained',
          price: 0,
          is_marketplace_item: false,
          total_sales: 0,
          status: avatar.status || 'active'
        });

        // Update with the original ID for reference
        await this.db.avatars.update(migratedAvatar.id!, { id: avatar.id });
        migratedAvatars.push({ ...migratedAvatar, id: avatar.id });
      } catch (error) {
        console.error(`Error migrating avatar ${avatar.name}:`, error);
      }
    }

    console.log(`Migrated ${migratedAvatars.length} avatars from Supabase`);
    return migratedAvatars;
  }

  private async migrateGeneratedImages(
    userId: string,
    updateProgress: (message: string, current?: number, total?: number) => void
  ): Promise<void> {
    // Fetch generated images from Supabase
    const { data: images, error } = await supabase
      .from('generated_images')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching generated images:', error);
      return;
    }

    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      updateProgress(`Migrating image: ${image.prompt.substring(0, 30)}...`, i + 1, images.length);

      try {
        await this.db.generated_images.add({
          user_id: userId,
          prompt: image.prompt,
          generation_type: image.generation_type || 'text2img',
          image_url: image.image_url,
          is_favorite: image.is_favorite || false,
          price: 0,
          is_marketplace_item: false,
          total_sales: 0,
          status: 'active'
        });
      } catch (error) {
        console.error(`Error migrating image ${image.id}:`, error);
      }
    }

    console.log(`Migrated ${images.length} generated images from Supabase`);
  }

  private async migrateKnowledgeFiles(
    userId: string,
    updateProgress: (message: string, current?: number, total?: number) => void
  ): Promise<void> {
    // Fetch knowledge files from Supabase
    const { data: files, error } = await supabase
      .from('avatar_knowledge_files')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active');

    if (error) {
      console.error('Error fetching knowledge files:', error);
      return;
    }

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      updateProgress(`Migrating file: ${file.file_name}`, i + 1, files.length);

      try {
        await this.db.knowledge_files.add({
          avatar_id: file.avatar_id,
          user_id: userId,
          file_name: file.file_name,
          original_name: file.file_name,
          file_path: file.file_path,
          file_size: file.file_size,
          content_type: file.content_type,
          is_linked: file.is_linked || true,
          processing_status: 'completed',
          status: file.status || 'active'
        });
      } catch (error) {
        console.error(`Error migrating file ${file.file_name}:`, error);
      }
    }

    console.log(`Migrated ${files.length} knowledge files from Supabase`);
  }

  private async migrateLocalStorageData(userId: string, avatars: Avatar[]): Promise<void> {
    // 1. Migrate purchased avatars
    const purchasedAvatars = localStorage.getItem('purchasedAvatars');
    if (purchasedAvatars) {
      try {
        const purchases = JSON.parse(purchasedAvatars) as string[];
        for (const avatarId of purchases) {
          try {
            await this.db.createPurchase(userId, avatarId, 0);
          } catch (error) {
            console.error(`Error migrating purchase ${avatarId}:`, error);
          }
        }
        console.log(`Migrated ${purchases.length} purchases from localStorage`);
      } catch (error) {
        console.error('Error parsing purchased avatars:', error);
      }
    }

    // 2. Migrate chatbot settings
    const selectedAvatarId = localStorage.getItem('chatbot_selected_avatar_id');
    const activeTab = localStorage.getItem('chatbot_active_tab');

    if (selectedAvatarId) {
      await this.db.setUIState(userId, 'chatbot_selected_avatar', selectedAvatarId);
    }

    if (activeTab) {
      await this.db.setUIState(userId, 'chatbot_active_tab', activeTab);
    }

    // 3. Migrate training data cache for each avatar
    for (const avatar of avatars) {
      const cacheKey = `avatar_${avatar.id}_training_data`;
      const cachedData = localStorage.getItem(cacheKey);

      if (cachedData) {
        try {
          const trainingData = JSON.parse(cachedData);
          await this.db.setTrainingCache(avatar.id!, 'training_data', trainingData);

          // Update avatar with training data
          await this.db.updateAvatar(avatar.id!, {
            system_prompt: trainingData.systemPrompt,
            user_prompt: trainingData.userPrompt,
            training_instructions: trainingData.trainingInstructions
          });
        } catch (error) {
          console.error(`Error migrating training data for avatar ${avatar.id}:`, error);
        }
      }

      // Migrate avatar versions
      const versionsKey = `avatar_${avatar.id}_versions`;
      const versions = localStorage.getItem(versionsKey);

      if (versions) {
        try {
          const versionData = JSON.parse(versions);
          await this.db.setTrainingCache(avatar.id!, 'versions', versionData);
        } catch (error) {
          console.error(`Error migrating versions for avatar ${avatar.id}:`, error);
        }
      }
    }

    console.log('Migrated localStorage data to database cache');
  }

  private async setupMarketplaceAvatars(): Promise<void> {
    // Create marketplace avatars from static data if they don't exist
    for (const avatarProfile of avatarProfiles) {
      try {
        const existing = await this.db.getAvatarById(avatarProfile.id);
        if (!existing) {
          await this.db.createAvatar({
            user_id: 'marketplace', // Special user for marketplace items
            name: avatarProfile.name,
            description: avatarProfile.description,
            mbti_type: avatarProfile.mbti,
            personality_traits: avatarProfile.personality,
            backstory: avatarProfile.growUpStory,
            voice_description: avatarProfile.voiceDescription,
            primary_language: avatarProfile.languages[0] || 'English',
            secondary_languages: avatarProfile.languages.slice(1),
            favorites: avatarProfile.favorites,
            lifestyle: avatarProfile.lifestyle,
            avatar_images: [avatarProfile.image],
            gallery_images: avatarProfile.galleryImages,
            price: avatarProfile.price,
            is_marketplace_item: true,
            creator_studio: avatarProfile.creator,
            total_sales: avatarProfile.totalSales,
            origin_country: 'US',
            training_status: 'trained',
            status: 'active'
          });

          // Set the specific ID
          const createdAvatar = await this.db.avatars.where('name').equals(avatarProfile.name).first();
          if (createdAvatar) {
            await this.db.avatars.update(createdAvatar.id!, { id: avatarProfile.id });
          }
        }
      } catch (error) {
        console.error(`Error creating marketplace avatar ${avatarProfile.name}:`, error);
      }
    }

    // Ensure marketplace user exists
    const marketplaceUser = await this.db.getUserById('marketplace');
    if (!marketplaceUser) {
      await this.db.createUser({
        email: 'marketplace@avatarlab.local',
        name: 'AvatarLab Marketplace',
        auth_provider: 'system',
        email_verified: true,
        status: 'active'
      });

      // Set the specific ID
      const createdUser = await this.db.users.where('email').equals('marketplace@avatarlab.local').first();
      if (createdUser) {
        await this.db.users.update(createdUser.id!, { id: 'marketplace' });
      }
    }

    console.log('Marketplace avatars set up successfully');
  }

  private async finalizeMigration(): Promise<void> {
    // Clean up any expired cache entries
    await this.db.cleanupExpiredCache();

    console.log('Migration finalized successfully');
  }

  // Helper method to check if migration is needed
  static async isMigrationNeeded(userId: string): Promise<boolean> {
    try {
      const db = getDatabase();
      const user = await db.getUserById(userId);
      return !user; // Migration needed if user doesn't exist in local DB
    } catch (error) {
      return true; // If any error, assume migration is needed
    }
  }

  // Helper method to get migration status
  static async getMigrationStatus(userId: string): Promise<'needed' | 'in_progress' | 'completed'> {
    try {
      const db = getDatabase();
      const user = await db.getUserById(userId);

      if (!user) {
        return 'needed';
      }

      // You could check for a specific flag in UI state
      // For now, assume completed if user exists
      return 'completed';
    } catch (error) {
      return 'needed';
    }
  }
}

export default DexieMigration;