import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, AlertCircle, Database, Download } from 'lucide-react';
import { AvatarLabMigration, MigrationProgress } from '@/lib/migration';

interface MigrationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onMigrationComplete: () => void;
}

export const MigrationDialog: React.FC<MigrationDialogProps> = ({
  isOpen,
  onClose,
  userId,
  onMigrationComplete
}) => {
  const [migrationStatus, setMigrationStatus] = useState<'idle' | 'running' | 'completed' | 'error'>('idle');
  const [progress, setProgress] = useState<MigrationProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  const migration = new AvatarLabMigration();

  const startMigration = async () => {
    setMigrationStatus('running');
    setError(null);

    try {
      await migration.migrateFromSupabaseAndLocalStorage(userId, (progress) => {
        setProgress(progress);
      });

      setMigrationStatus('completed');
      setTimeout(() => {
        onMigrationComplete();
      }, 2000);
    } catch (err) {
      console.error('Migration failed:', err);
      setError(err instanceof Error ? err.message : 'Migration failed');
      setMigrationStatus('error');
    }
  };

  const getProgressPercentage = () => {
    if (!progress) return 0;
    return Math.round((progress.current / progress.total) * 100);
  };

  const handleClose = () => {
    if (migrationStatus !== 'running') {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Database Migration
          </DialogTitle>
          <DialogDescription>
            Migrate your data from Supabase and localStorage to the new local database for better performance and offline access.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {migrationStatus === 'idle' && (
            <div className="space-y-4">
              <Alert>
                <Download className="h-4 w-4" />
                <AlertDescription>
                  This will transfer all your avatars, images, and settings to a local database.
                  This process may take a few minutes depending on how much data you have.
                </AlertDescription>
              </Alert>

              <div className="space-y-2 text-sm text-muted-foreground">
                <p><strong>What will be migrated:</strong></p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Your user profile and settings</li>
                  <li>All your created avatars</li>
                  <li>Generated images and collections</li>
                  <li>Knowledge base files</li>
                  <li>Training data and cache</li>
                  <li>Marketplace purchases</li>
                </ul>
              </div>

              <div className="flex gap-2">
                <Button onClick={startMigration} className="flex-1">
                  Start Migration
                </Button>
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {migrationStatus === 'running' && progress && (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">{progress.step}</span>
                  <span className="text-sm text-muted-foreground">
                    {progress.current}/{progress.total}
                  </span>
                </div>
                <Progress value={getProgressPercentage()} className="w-full" />
              </div>

              <div className="text-sm text-muted-foreground">
                {progress.message}
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Please don't close this dialog while migration is in progress.
                </AlertDescription>
              </Alert>
            </div>
          )}

          {migrationStatus === 'completed' && (
            <div className="text-center space-y-4">
              <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
              <div>
                <h3 className="text-lg font-semibold">Migration Completed!</h3>
                <p className="text-muted-foreground">
                  Your data has been successfully migrated to the local database.
                </p>
              </div>
              <Button onClick={handleClose} className="w-full">
                Continue
              </Button>
            </div>
          )}

          {migrationStatus === 'error' && (
            <div className="space-y-4">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {error || 'An error occurred during migration.'}
                </AlertDescription>
              </Alert>

              <div className="flex gap-2">
                <Button onClick={startMigration} variant="outline" className="flex-1">
                  Retry Migration
                </Button>
                <Button onClick={handleClose} variant="outline">
                  Close
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MigrationDialog;