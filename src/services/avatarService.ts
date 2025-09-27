import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type Avatar = Database['public']['Tables']['avatars']['Row'];

export interface MarketplaceAvatar {
  id: string;
  name: string;
  image_url: string;
  price: number;
  rating: number;
  total_sales: number;
  creator: string;
  mbti: string;
  personality: string[];
  favorites: string[];
  grow_up_story: string;
  voice_description: string;
  languages: string[];
  lifestyle: string[];
  gallery_images: string[];
  category: string;
  description: string;
  is_public: boolean;
}

export const avatarService = {
  // Get all marketplace avatars (public avatars)
  async getMarketplaceAvatars(): Promise<MarketplaceAvatar[]> {
    const { data, error } = await supabase
      .from('avatars')
      .select('*')
      .eq('is_public', true)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch marketplace avatars: ${error.message}`);
    }

    return data.map(avatar => ({
      id: avatar.id,
      name: avatar.name || 'Unnamed Avatar',
      image_url: avatar.image_url || '',
      price: avatar.price || 0,
      rating: avatar.rating || 0,
      total_sales: avatar.total_sales || 0,
      creator: avatar.creator || 'Unknown',
      mbti: avatar.mbti || '',
      personality: avatar.personality || [],
      favorites: avatar.favorites || [],
      grow_up_story: avatar.grow_up_story || '',
      voice_description: avatar.voice_description || '',
      languages: avatar.languages || [],
      lifestyle: avatar.lifestyle || [],
      gallery_images: avatar.gallery_images || [],
      category: avatar.category || 'Uncategorized',
      description: avatar.description || '',
      is_public: avatar.is_public || false
    }));
  },

  // Get avatar categories from the database
  async getAvatarCategories(): Promise<string[]> {
    const { data, error } = await supabase
      .from('avatars')
      .select('category')
      .eq('is_public', true)
      .not('category', 'is', null);

    if (error) {
      throw new Error(`Failed to fetch categories: ${error.message}`);
    }

    // Get unique categories
    const categories = [...new Set(data.map(item => item.category).filter(Boolean))];
    return ['all', ...categories.sort()];
  },

  // Purchase an avatar (add to user's purchased avatars)
  async purchaseAvatar(userId: string, avatarId: string): Promise<void> {
    // Get avatar price first
    const { data: avatar, error: avatarError } = await supabase
      .from('avatars')
      .select('price')
      .eq('id', avatarId)
      .single();

    if (avatarError) {
      throw new Error(`Failed to get avatar price: ${avatarError.message}`);
    }

    const { error } = await supabase
      .from('purchases')
      .insert({
        user_id: userId,
        avatar_id: avatarId,
        price_paid: avatar.price || 0
      });

    if (error) {
      throw new Error(`Failed to purchase avatar: ${error.message}`);
    }

    // Update total sales count
    const { error: updateError } = await supabase.rpc('increment_avatar_sales', {
      avatar_id: avatarId
    });

    if (updateError) {
      console.warn('Failed to update sales count:', updateError.message);
    }
  },

  // Get user's purchased avatars
  async getUserPurchases(userId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('purchases')
      .select('avatar_id')
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to fetch user purchases: ${error.message}`);
    }

    return data.map(purchase => purchase.avatar_id);
  },

  // Get avatar by ID
  async getAvatarById(id: string): Promise<MarketplaceAvatar | null> {
    const { data, error } = await supabase
      .from('avatars')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Avatar not found
      }
      throw new Error(`Failed to fetch avatar: ${error.message}`);
    }

    return {
      id: data.id,
      name: data.name || 'Unnamed Avatar',
      image_url: data.image_url || '',
      price: data.price || 0,
      rating: data.rating || 0,
      total_sales: data.total_sales || 0,
      creator: data.creator || 'Unknown',
      mbti: data.mbti || '',
      personality: data.personality || [],
      favorites: data.favorites || [],
      grow_up_story: data.grow_up_story || '',
      voice_description: data.voice_description || '',
      languages: data.languages || [],
      lifestyle: data.lifestyle || [],
      gallery_images: data.gallery_images || [],
      category: data.category || 'Uncategorized',
      description: data.description || '',
      is_public: data.is_public || false
    };
  }
};