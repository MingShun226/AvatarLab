import { useState, useEffect, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { getDatabase, Avatar, User, GeneratedImage } from '../lib/dexieDatabase';
import { useToast } from './use-toast';

// Custom hook for database operations
export const useDatabase = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const db = getDatabase();

  useEffect(() => {
    try {
      // Initialize database connection
      db.open().then(() => {
        setIsInitialized(true);
      }).catch((err) => {
        setError(err.message);
        toast({
          title: "Database Error",
          description: "Failed to initialize local database",
          variant: "destructive"
        });
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Database initialization failed');
    }
  }, [db, toast]);

  return {
    db,
    isInitialized,
    error
  };
};

// Hook for user management
export const useUser = (userId?: string) => {
  const { db, isInitialized } = useDatabase();

  // Use Dexie's live queries for reactive data
  const user = useLiveQuery(
    () => userId ? db.getUserById(userId) : undefined,
    [userId]
  );

  const [loading, setLoading] = useState(false);

  const createUser = useCallback(async (userData: Omit<User, 'id' | 'created_at' | 'updated_at'>) => {
    if (!isInitialized) return null;

    setLoading(true);
    try {
      const newUser = await db.createUser(userData);
      return newUser;
    } catch (error) {
      console.error('Error creating user:', error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [db, isInitialized]);

  const updateUser = useCallback(async (id: string, updates: Partial<User>) => {
    if (!isInitialized) return false;

    try {
      const result = await db.users.update(id, updates);
      return result > 0;
    } catch (error) {
      console.error('Error updating user:', error);
      return false;
    }
  }, [db, isInitialized]);

  return {
    user: user || null,
    loading,
    createUser,
    updateUser
  };
};

// Hook for avatar management with reactive queries
export const useAvatars = (userId?: string) => {
  const { db, isInitialized } = useDatabase();

  // Reactive query that automatically updates when data changes
  const avatars = useLiveQuery(
    () => userId ? db.getAvatarsByUserId(userId) : [],
    [userId]
  );

  const [loading, setLoading] = useState(false);

  const createAvatar = useCallback(async (avatarData: Omit<Avatar, 'id' | 'created_at' | 'updated_at'>) => {
    if (!userId || !isInitialized) return null;

    setLoading(true);
    try {
      const newAvatar = await db.createAvatar({ ...avatarData, user_id: userId });
      return newAvatar;
    } catch (error) {
      console.error('Error creating avatar:', error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [db, userId, isInitialized]);

  const updateAvatar = useCallback(async (id: string, updates: Partial<Avatar>) => {
    if (!isInitialized) return false;

    try {
      const result = await db.updateAvatar(id, updates);
      return result > 0;
    } catch (error) {
      console.error('Error updating avatar:', error);
      return false;
    }
  }, [db, isInitialized]);

  const getAvatar = useCallback(async (id: string): Promise<Avatar | null> => {
    if (!isInitialized) return null;
    try {
      const avatar = await db.getAvatarById(id);
      return avatar || null;
    } catch (error) {
      console.error('Error getting avatar:', error);
      return null;
    }
  }, [db, isInitialized]);

  const deleteAvatar = useCallback(async (id: string) => {
    if (!isInitialized) return false;

    try {
      const result = await db.updateAvatar(id, {
        status: 'deleted',
        deleted_at: new Date().toISOString()
      });
      return result > 0;
    } catch (error) {
      console.error('Error deleting avatar:', error);
      return false;
    }
  }, [db, isInitialized]);

  return {
    avatars: avatars || [],
    loading,
    createAvatar,
    updateAvatar,
    getAvatar,
    deleteAvatar
  };
};

// Hook for marketplace with reactive queries
export const useMarketplace = () => {
  const { db, isInitialized } = useDatabase();

  // Reactive marketplace query
  const marketplaceAvatars = useLiveQuery(
    () => isInitialized ? db.getMarketplaceAvatars() : [],
    [isInitialized]
  );

  const [loading, setLoading] = useState(false);

  const loadMarketplaceAvatars = useCallback(async (filters?: {
    category?: string;
    priceRange?: string;
    search?: string
  }) => {
    if (!isInitialized) return;

    setLoading(true);
    try {
      // For now, we'll filter client-side since Dexie makes this easy
      // In a larger app, we'd want server-side filtering
      return await db.getMarketplaceAvatars(filters);
    } catch (error) {
      console.error('Error loading marketplace avatars:', error);
      return [];
    } finally {
      setLoading(false);
    }
  }, [db, isInitialized]);

  return {
    marketplaceAvatars: marketplaceAvatars || [],
    loading,
    loadMarketplaceAvatars
  };
};

// Hook for purchases with reactive queries
export const usePurchases = (userId?: string) => {
  const { db, isInitialized } = useDatabase();

  // Reactive purchases query
  const purchasedAvatars = useLiveQuery(
    () => userId && isInitialized ? db.getUserPurchases(userId) : [],
    [userId, isInitialized]
  );

  const [loading, setLoading] = useState(false);

  const purchaseAvatar = useCallback(async (avatarId: string, price: number) => {
    if (!userId || !isInitialized) return false;

    setLoading(true);
    try {
      const success = await db.createPurchase(userId, avatarId, price);
      return success;
    } catch (error) {
      console.error('Error purchasing avatar:', error);
      return false;
    } finally {
      setLoading(false);
    }
  }, [db, userId, isInitialized]);

  const isPurchased = useCallback((avatarId: string) => {
    return purchasedAvatars?.includes(avatarId) || false;
  }, [purchasedAvatars]);

  return {
    purchasedAvatars: purchasedAvatars || [],
    loading,
    purchaseAvatar,
    isPurchased
  };
};

// Hook for UI state (replaces localStorage UI state)
export const useUIState = (userId?: string) => {
  const { db, isInitialized } = useDatabase();

  const setUIState = useCallback(async (componentKey: string, stateData: any, expiresIn?: number) => {
    if (!userId || !isInitialized) return false;

    try {
      return await db.setUIState(userId, componentKey, stateData, expiresIn);
    } catch (error) {
      console.error('Error setting UI state:', error);
      return false;
    }
  }, [db, userId, isInitialized]);

  const getUIState = useCallback(async (componentKey: string): Promise<any | null> => {
    if (!userId || !isInitialized) return null;

    try {
      return await db.getUIState(userId, componentKey);
    } catch (error) {
      console.error('Error getting UI state:', error);
      return null;
    }
  }, [db, userId, isInitialized]);

  return {
    setUIState,
    getUIState
  };
};

// Hook for training data cache (replaces localStorage training cache)
export const useTrainingCache = (avatarId?: string) => {
  const { db, isInitialized } = useDatabase();

  const setTrainingCache = useCallback(async (cacheKey: string, cacheData: any, expiresIn?: number) => {
    if (!avatarId || !isInitialized) return false;

    try {
      return await db.setTrainingCache(avatarId, cacheKey, cacheData, expiresIn);
    } catch (error) {
      console.error('Error setting training cache:', error);
      return false;
    }
  }, [db, avatarId, isInitialized]);

  const getTrainingCache = useCallback(async (cacheKey: string): Promise<any | null> => {
    if (!avatarId || !isInitialized) return null;

    try {
      return await db.getTrainingCache(avatarId, cacheKey);
    } catch (error) {
      console.error('Error getting training cache:', error);
      return null;
    }
  }, [db, avatarId, isInitialized]);

  return {
    setTrainingCache,
    getTrainingCache
  };
};

// Specific hook for chatbot state (replaces localStorage chatbot state)
export const useChatbotState = (userId?: string) => {
  const { setUIState, getUIState } = useUIState(userId);
  const [selectedAvatarId, setSelectedAvatarIdState] = useState<string | null>(null);
  const [activeTab, setActiveTabState] = useState<string>('train');

  useEffect(() => {
    if (userId) {
      // Load saved state
      Promise.all([
        getUIState('chatbot_selected_avatar'),
        getUIState('chatbot_active_tab')
      ]).then(([savedAvatarId, savedTab]) => {
        if (savedAvatarId) setSelectedAvatarIdState(savedAvatarId);
        if (savedTab) setActiveTabState(savedTab);
      });
    }
  }, [userId, getUIState]);

  const setSelectedAvatarId = useCallback(async (avatarId: string | null) => {
    setSelectedAvatarIdState(avatarId);
    if (avatarId) {
      await setUIState('chatbot_selected_avatar', avatarId);
    }
  }, [setUIState]);

  const setActiveTab = useCallback(async (tab: string) => {
    setActiveTabState(tab);
    await setUIState('chatbot_active_tab', tab);
  }, [setUIState]);

  return {
    selectedAvatarId,
    activeTab,
    setSelectedAvatarId,
    setActiveTab
  };
};

// Hook for generated images
export const useGeneratedImages = (userId?: string) => {
  const { db, isInitialized } = useDatabase();

  // Reactive images query
  const images = useLiveQuery(
    () => userId && isInitialized ?
      db.generated_images.where('user_id').equals(userId).reverse().sortBy('created_at') :
      [],
    [userId, isInitialized]
  );

  const favoriteImages = useLiveQuery(
    () => userId && isInitialized ?
      db.generated_images.where('user_id').equals(userId).and(img => img.is_favorite).toArray() :
      [],
    [userId, isInitialized]
  );

  const createImage = useCallback(async (imageData: Omit<GeneratedImage, 'id' | 'created_at' | 'updated_at'>) => {
    if (!userId || !isInitialized) return null;

    try {
      const newImage = await db.generated_images.add({
        ...imageData,
        user_id: userId
      });
      return newImage;
    } catch (error) {
      console.error('Error creating image:', error);
      return null;
    }
  }, [db, userId, isInitialized]);

  const toggleFavorite = useCallback(async (imageId: string) => {
    if (!isInitialized) return false;

    try {
      const image = await db.generated_images.get(imageId);
      if (image) {
        await db.generated_images.update(imageId, {
          is_favorite: !image.is_favorite
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error toggling favorite:', error);
      return false;
    }
  }, [db, isInitialized]);

  return {
    images: images || [],
    favoriteImages: favoriteImages || [],
    createImage,
    toggleFavorite
  };
};

// Hook for database statistics
export const useDatabaseStats = () => {
  const { db, isInitialized } = useDatabase();

  const stats = useLiveQuery(
    () => isInitialized ? db.getStats() : null,
    [isInitialized]
  );

  return stats;
};

export default useDatabase;