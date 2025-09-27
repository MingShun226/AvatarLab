import { getDatabase } from './database';
import { AvatarLabMigration } from './migration';

export async function initializeDatabase() {
  console.log('🚀 Initializing AvatarLab Database...');

  try {
    // Initialize database connection
    const db = getDatabase();
    console.log('✅ Database connection established');

    // Check if this is a fresh installation
    const existingUsers = db.db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };

    if (existingUsers.count === 0) {
      console.log('📦 Fresh installation detected');

      // Set up marketplace data
      const migration = new AvatarLabMigration();
      await migration.migrateMarketplaceAvatars('system');
      console.log('✅ Marketplace avatars initialized');
    }

    // Clean up expired cache entries
    const cleanedEntries = db.cleanupExpiredCache();
    if (cleanedEntries > 0) {
      console.log(`🧹 Cleaned up ${cleanedEntries} expired cache entries`);
    }

    console.log('🎉 Database initialization completed successfully!');
    return true;

  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
}

export function getDatabaseStats() {
  try {
    const db = getDatabase();

    const stats = {
      users: db.db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number },
      avatars: db.db.prepare('SELECT COUNT(*) as count FROM avatars WHERE status = "active"').get() as { count: number },
      marketplaceAvatars: db.db.prepare('SELECT COUNT(*) as count FROM avatars WHERE is_marketplace_item = 1').get() as { count: number },
      generatedImages: db.db.prepare('SELECT COUNT(*) as count FROM generated_images').get() as { count: number },
      knowledgeFiles: db.db.prepare('SELECT COUNT(*) as count FROM knowledge_files WHERE status = "active"').get() as { count: number },
      purchases: db.db.prepare('SELECT COUNT(*) as count FROM purchases WHERE status = "completed"').get() as { count: number }
    };

    return stats;
  } catch (error) {
    console.error('Error getting database stats:', error);
    return null;
  }
}

export function checkMigrationStatus(userId: string): 'needed' | 'completed' {
  return AvatarLabMigration.getMigrationStatus(userId);
}

export default initializeDatabase;