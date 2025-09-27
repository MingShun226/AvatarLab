import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { avatarService, type MarketplaceAvatar } from '@/services/avatarService';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export const useMarketplace = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch marketplace avatars
  const {
    data: avatars = [],
    isLoading: avatarsLoading,
    error: avatarsError
  } = useQuery({
    queryKey: ['marketplace-avatars'],
    queryFn: avatarService.getMarketplaceAvatars,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch categories
  const {
    data: categories = [],
    isLoading: categoriesLoading,
    error: categoriesError
  } = useQuery({
    queryKey: ['avatar-categories'],
    queryFn: avatarService.getAvatarCategories,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Fetch user purchases
  const {
    data: purchasedAvatars = [],
    isLoading: purchasesLoading,
    error: purchasesError
  } = useQuery({
    queryKey: ['user-purchases', user?.id],
    queryFn: () => user ? avatarService.getUserPurchases(user.id) : Promise.resolve([]),
    enabled: !!user,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Purchase avatar mutation
  const purchaseAvatarMutation = useMutation({
    mutationFn: ({ avatarId, avatarName }: { avatarId: string; avatarName: string }) => {
      if (!user) throw new Error('User must be logged in to purchase');
      return avatarService.purchaseAvatar(user.id, avatarId);
    },
    onSuccess: (_, variables) => {
      // Invalidate and refetch purchases
      queryClient.invalidateQueries({ queryKey: ['user-purchases', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['marketplace-avatars'] });

      toast({
        title: "Avatar Purchased!",
        description: `${variables.avatarName} has been added to your collection.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Purchase Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handlePurchaseAvatar = (avatarId: string, avatarName: string) => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please log in to purchase avatars.",
        variant: "destructive",
      });
      return;
    }

    if (purchasedAvatars.includes(avatarId)) {
      toast({
        title: "Already Purchased",
        description: "You already own this avatar.",
        variant: "destructive",
      });
      return;
    }

    purchaseAvatarMutation.mutate({ avatarId, avatarName });
  };

  return {
    avatars,
    categories,
    purchasedAvatars,
    isLoading: avatarsLoading || categoriesLoading || purchasesLoading,
    error: avatarsError || categoriesError || purchasesError,
    handlePurchaseAvatar,
    isPurchasing: purchaseAvatarMutation.isPending
  };
};