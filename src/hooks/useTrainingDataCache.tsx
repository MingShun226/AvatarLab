
import { useState, useEffect, useCallback } from 'react';

interface TrainingData {
  systemPrompt: string;
  userPrompt: string;
  trainingInstructions: string;
  uploadedFiles: File[];
}

const defaultTrainingData: TrainingData = {
  systemPrompt: '',
  userPrompt: '',
  trainingInstructions: '',
  uploadedFiles: []
};

export const useTrainingDataCache = (avatarId: string | null) => {
  const [trainingData, setTrainingData] = useState<TrainingData>(defaultTrainingData);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load cached data when avatarId changes
  useEffect(() => {
    if (!avatarId) {
      setTrainingData(defaultTrainingData);
      setIsLoaded(true);
      return;
    }

    console.log('Loading training data cache for avatar:', avatarId);
    
    // Load from localStorage
    const cacheKey = `avatar_${avatarId}_training_data`;
    const cached = localStorage.getItem(cacheKey);
    
    if (cached) {
      try {
        const parsedData = JSON.parse(cached);
        console.log('Found cached training data:', parsedData);
        
        // Restore File objects from stored metadata
        const restoredFiles: File[] = [];
        if (parsedData.fileMetadata && Array.isArray(parsedData.fileMetadata)) {
          for (const metadata of parsedData.fileMetadata) {
            try {
              // Try to restore file from stored blob URL or create empty placeholder
              const file = new File([''], metadata.name, {
                type: metadata.type || 'application/pdf',
                lastModified: metadata.lastModified || Date.now()
              });
              restoredFiles.push(file);
            } catch (error) {
              console.error('Error restoring file:', error);
            }
          }
        }
        
        setTrainingData({
          systemPrompt: parsedData.systemPrompt || '',
          userPrompt: parsedData.userPrompt || '',
          trainingInstructions: parsedData.trainingInstructions || '',
          uploadedFiles: restoredFiles
        });
      } catch (error) {
        console.error('Error parsing cached training data:', error);
        setTrainingData(defaultTrainingData);
      }
    } else {
      setTrainingData(defaultTrainingData);
    }
    
    setIsLoaded(true);
  }, [avatarId]);

  // Save to cache whenever data changes
  const updateTrainingData = useCallback((updates: Partial<TrainingData>) => {
    if (!avatarId) return;
    
    setTrainingData(prev => {
      const newData = { ...prev, ...updates };
      
      // Save to localStorage
      const cacheKey = `avatar_${avatarId}_training_data`;
      const dataToCache = {
        systemPrompt: newData.systemPrompt,
        userPrompt: newData.userPrompt,
        trainingInstructions: newData.trainingInstructions,
        fileMetadata: newData.uploadedFiles.map(file => ({
          name: file.name,
          size: file.size,
          type: file.type,
          lastModified: file.lastModified
        }))
      };
      
      console.log('Saving training data to cache:', dataToCache);
      localStorage.setItem(cacheKey, JSON.stringify(dataToCache));
      
      return newData;
    });
  }, [avatarId]);

  const clearCache = useCallback(() => {
    if (!avatarId) return;
    
    const cacheKey = `avatar_${avatarId}_training_data`;
    localStorage.removeItem(cacheKey);
    setTrainingData(defaultTrainingData);
    console.log('Cleared training data cache for avatar:', avatarId);
  }, [avatarId]);

  return {
    trainingData,
    updateTrainingData,
    clearCache,
    isLoaded
  };
};
