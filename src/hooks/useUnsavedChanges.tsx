import { useRef, useState } from 'react';

interface UseUnsavedChangesProps {
  hasUnsavedChanges: boolean;
  message?: string;
}

export const useUnsavedChanges = ({ 
  hasUnsavedChanges, 
  message = "You have unsaved changes. If you leave now, all your progress will be lost. Are you sure you want to continue?" 
}: UseUnsavedChangesProps) => {
  const messageRef = useRef(message);
  const [showDialog, setShowDialog] = useState(false);
  const [pendingCallback, setPendingCallback] = useState<(() => void) | null>(null);

  const confirmNavigation = (callback: () => void) => {
    if (hasUnsavedChanges) {
      setShowDialog(true);
      setPendingCallback(() => callback);
    } else {
      callback();
    }
  };

  const handleConfirm = () => {
    setShowDialog(false);
    if (pendingCallback) {
      const callback = pendingCallback;
      setPendingCallback(null);
      // Execute callback immediately
      callback();
    }
  };

  const handleCancel = () => {
    setShowDialog(false);
    setPendingCallback(null);
  };

  return { 
    confirmNavigation, 
    showDialog,
    handleConfirm,
    handleCancel,
    message: messageRef.current
  };
};