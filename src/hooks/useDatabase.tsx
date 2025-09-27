import { useState, useEffect, useCallback } from 'react';
import { getDatabase, Avatar, User, GeneratedImage } from '../lib/database';
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
      setIsInitialized(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Database initialization failed');
      toast({
        title: "Database Error",
        description: "Failed to initialize local database",
        variant: "destructive"
      });
    }
  }, [toast]);

  return {
    db,
    isInitialized,
    error
  };
};

// Hook for user management
export const useUser = (userId?: string) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const { db, isInitialized } = useDatabase();

  const loadUser = useCallback(async (id: string) => {
    if (!isInitialized) return;

    setLoading(true);
    try {
      const userData = db.getUserById(id);
      setUser(userData);
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setLoading(false);
    }
  }, [db, isInitialized]);

  useEffect(() => {
    if (userId && isInitialized) {
      loadUser(userId);
    }
  }, [userId, isInitialized, loadUser]);

  const createUser = useCallback(async (userData: Partial<User>) => {
    if (!isInitialized) return null;

    try {
      const newUser = db.createUser(userData);
      setUser(newUser);
      return newUser;
    } catch (error) {
      console.error('Error creating user:', error);
      return null;
    }
  }, [db, isInitialized]);

  return {
    user,
    loading,
    createUser,
    refreshUser: userId ? () => loadUser(userId) : () => {}
  };
};

// Hook for avatar management
export const useAvatars = (userId?: string) => {
  const [avatars, setAvatars] = useState<Avatar[]>([]);
  const [loading, setLoading] = useState(false);
  const { db, isInitialized } = useDatabase();

  const loadAvatars = useCallback(async () => {
    if (!userId || !isInitialized) return;

    setLoading(true);
    try {
      const userAvatars = db.getAvatarsByUserId(userId);
      setAvatars(userAvatars);
    } catch (error) {
      console.error('Error loading avatars:', error);
    } finally {
      setLoading(false);
    }
  }, [db, userId, isInitialized]);

  useEffect(() => {
    loadAvatars();
  }, [loadAvatars]);

  const createAvatar = useCallback(async (avatarData: Partial<Avatar>) => {
    if (!userId || !isInitialized) return null;

    try {
      const newAvatar = db.createAvatar({ ...avatarData, user_id: userId });
      setAvatars(prev => [newAvatar, ...prev]);
      return newAvatar;
    } catch (error) {
      console.error('Error creating avatar:', error);
      return null;
    }
  }, [db, userId, isInitialized]);

  const updateAvatar = useCallback(async (id: string, updates: Partial<Avatar>) => {
    if (!isInitialized) return false;

    try {
      const success = db.updateAvatar(id, updates);
      if (success) {
        setAvatars(prev => prev.map(avatar =>
          avatar.id === id ? { ...avatar, ...updates } : avatar
        ));
      }
      return success;
    } catch (error) {
      console.error('Error updating avatar:', error);
      return false;
    }
  }, [db, isInitialized]);

  const getAvatar = useCallback((id: string): Avatar | null => {
    if (!isInitialized) return null;
    return db.getAvatarById(id);
  }, [db, isInitialized]);

  return {
    avatars,
    loading,
    createAvatar,
    updateAvatar,
    getAvatar,
    refreshAvatars: loadAvatars
  };
};

// Hook for marketplace
export const useMarketplace = () => {
  const [marketplaceAvatars, setMarketplaceAvatars] = useState<Avatar[]>([]);
  const [loading, setLoading] = useState(false);
  const { db, isInitialized } = useDatabase();

  const loadMarketplaceAvatars = useCallback(async (filters?: {
    category?: string;
    priceRange?: string;
    search?: string
  }) => {
    if (!isInitialized) return;

    setLoading(true);
    try {
      const avatars = db.getMarketplaceAvatars(filters);
      setMarketplaceAvatars(avatars);
    } catch (error) {
      console.error('Error loading marketplace avatars:', error);
    } finally {
      setLoading(false);
    }
  }, [db, isInitialized]);

  useEffect(() => {
    loadMarketplaceAvatars();
  }, [loadMarketplaceAvatars]);

  return {
    marketplaceAvatars,
    loading,
    loadMarketplaceAvatars
  };
};

// Hook for purchases (replaces localStorage purchased avatars)
export const usePurchases = (userId?: string) => {
  const [purchasedAvatars, setPurchasedAvatars] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { db, isInitialized } = useDatabase();

  const loadPurchases = useCallback(async () => {
    if (!userId || !isInitialized) return;

    setLoading(true);
    try {
      const purchases = db.getUserPurchases(userId);
      setPurchasedAvatars(purchases);
    } catch (error) {
      console.error('Error loading purchases:', error);
    } finally {
      setLoading(false);
    }
  }, [db, userId, isInitialized]);

  useEffect(() => {
    loadPurchases();
  }, [loadPurchases]);

  const purchaseAvatar = useCallback(async (avatarId: string, price: number) => {
    if (!userId || !isInitialized) return false;

    try {
      const success = db.createPurchase(userId, avatarId, price);
      if (success) {
        setPurchasedAvatars(prev => [...prev, avatarId]);
      }
      return success;
    } catch (error) {
      console.error('Error purchasing avatar:', error);
      return false;
    }
  }, [db, userId, isInitialized]);

  return {
    purchasedAvatars,
    loading,
    purchaseAvatar,
    refreshPurchases: loadPurchases
  };
};

// Hook for UI state (replaces localStorage UI state)
export const useUIState = (userId?: string) => {
  const { db, isInitialized } = useDatabase();

  const setUIState = useCallback(async (componentKey: string, stateData: any, expiresIn?: number) => {
    if (!userId || !isInitialized) return false;

    try {
      return db.setUIState(userId, componentKey, stateData, expiresIn);
    } catch (error) {
      console.error('Error setting UI state:', error);
      return false;
    }
  }, [db, userId, isInitialized]);

  const getUIState = useCallback((componentKey: string): any | null => {
    if (!userId || !isInitialized) return null;

    try {
      return db.getUIState(userId, componentKey);
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
      return db.setTrainingCache(avatarId, cacheKey, cacheData, expiresIn);
    } catch (error) {
      console.error('Error setting training cache:', error);
      return false;
    }
  }, [db, avatarId, isInitialized]);

  const getTrainingCache = useCallback((cacheKey: string): any | null => {
    if (!avatarId || !isInitialized) return null;

    try {
      return db.getTrainingCache(avatarId, cacheKey);
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
      const savedAvatarId = getUIState('chatbot_selected_avatar');
      const savedTab = getUIState('chatbot_active_tab');

      if (savedAvatarId) setSelectedAvatarIdState(savedAvatarId);
      if (savedTab) setActiveTabState(savedTab);
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

export default useDatabase;