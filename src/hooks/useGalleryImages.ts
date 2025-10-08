import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getUserImages,
  deleteImage as deleteImageService,
  toggleFavorite as toggleFavoriteService,
  GeneratedImage
} from '@/services/imageGeneration';

// Query key for images
export const GALLERY_IMAGES_KEY = ['gallery-images'];

/**
 * Hook to fetch gallery images with React Query caching
 */
export function useGalleryImages() {
  return useQuery({
    queryKey: GALLERY_IMAGES_KEY,
    queryFn: getUserImages,
    staleTime: 1000 * 60 * 5, // 5 minutes - data is considered fresh
    gcTime: 1000 * 60 * 30, // 30 minutes - cache time (formerly cacheTime)
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
    refetchOnMount: false, // Don't refetch if data exists
  });
}

/**
 * Hook to delete an image with optimistic updates
 */
export function useDeleteImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteImageService,
    onMutate: async (imageId: string) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: GALLERY_IMAGES_KEY });

      // Snapshot previous value
      const previousImages = queryClient.getQueryData<GeneratedImage[]>(GALLERY_IMAGES_KEY);

      // Optimistically update to remove the image
      queryClient.setQueryData<GeneratedImage[]>(GALLERY_IMAGES_KEY, (old) =>
        old?.filter((img) => img.id !== imageId) || []
      );

      return { previousImages };
    },
    onError: (err, imageId, context) => {
      // Rollback on error
      queryClient.setQueryData(GALLERY_IMAGES_KEY, context?.previousImages);
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: GALLERY_IMAGES_KEY });
    },
  });
}

/**
 * Hook to toggle favorite status with optimistic updates
 */
export function useToggleFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ imageId, isFavorite }: { imageId: string; isFavorite: boolean }) =>
      toggleFavoriteService(imageId, isFavorite),
    onMutate: async ({ imageId, isFavorite }) => {
      await queryClient.cancelQueries({ queryKey: GALLERY_IMAGES_KEY });

      const previousImages = queryClient.getQueryData<GeneratedImage[]>(GALLERY_IMAGES_KEY);

      // Optimistically update
      queryClient.setQueryData<GeneratedImage[]>(GALLERY_IMAGES_KEY, (old) =>
        old?.map((img) =>
          img.id === imageId ? { ...img, is_favorite: isFavorite } : img
        ) || []
      );

      return { previousImages };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(GALLERY_IMAGES_KEY, context?.previousImages);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: GALLERY_IMAGES_KEY });
    },
  });
}

/**
 * Hook to add a new image to the cache
 */
export function useAddImage() {
  const queryClient = useQueryClient();

  return {
    addImage: (newImage: GeneratedImage) => {
      queryClient.setQueryData<GeneratedImage[]>(GALLERY_IMAGES_KEY, (old) => {
        if (!old) return [newImage];
        return [newImage, ...old];
      });
    },
  };
}

/**
 * Hook to invalidate and refetch images
 */
export function useRefreshImages() {
  const queryClient = useQueryClient();

  return {
    refresh: () => queryClient.invalidateQueries({ queryKey: GALLERY_IMAGES_KEY }),
  };
}
