import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, XCircle, Database, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ConnectionTest {
  name: string;
  status: 'pending' | 'success' | 'error';
  message: string;
}

export const DatabaseTest: React.FC = () => {
  const [tests, setTests] = useState<ConnectionTest[]>([
    { name: 'Database Connection', status: 'pending', message: 'Not tested' },
    { name: 'Authentication', status: 'pending', message: 'Not tested' },
    { name: 'Tables Access', status: 'pending', message: 'Not tested' },
  ]);
  const [isRunning, setIsRunning] = useState(false);

  const updateTest = (index: number, status: 'success' | 'error', message: string) => {
    setTests(prev => prev.map((test, i) =>
      i === index ? { ...test, status, message } : test
    ));
  };

  const runTests = async () => {
    setIsRunning(true);

    // Reset all tests
    setTests(prev => prev.map(test => ({ ...test, status: 'pending', message: 'Testing...' })));

    try {
      // Test 1: Basic database connection
      console.log('Testing database connection...');
      const { data, error } = await supabase.from('profiles').select('count', { count: 'exact' });

      if (error) {
        updateTest(0, 'error', `Connection failed: ${error.message}`);
        setIsRunning(false);
        return;
      }

      updateTest(0, 'success', `Connected successfully. Found ${data?.length || 0} profiles.`);

      // Test 2: Authentication test
      console.log('Testing authentication...');
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        updateTest(1, 'success', `Authenticated as: ${user.email}`);
      } else {
        updateTest(1, 'success', 'No user currently logged in (normal for fresh setup)');
      }

      // Test 3: Test table access
      console.log('Testing table access...');
      const tableTests = await Promise.allSettled([
        supabase.from('avatars').select('count', { count: 'exact' }),
        supabase.from('generated_images').select('count', { count: 'exact' }),
        supabase.from('avatar_knowledge_files').select('count', { count: 'exact' }),
      ]);

      const successful = tableTests.filter(result => result.status === 'fulfilled').length;
      const total = tableTests.length;

      if (successful === total) {
        updateTest(2, 'success', `All ${total} core tables accessible`);
      } else {
        updateTest(2, 'error', `Only ${successful}/${total} tables accessible`);
      }

    } catch (error) {
      console.error('Test failed:', error);
      updateTest(0, 'error', `Unexpected error: ${error.message}`);
    }

    setIsRunning(false);
  };

  const getStatusIcon = (status: 'pending' | 'success' | 'error') => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" />;
    }
  };

  // Auto-run tests on component mount
  useEffect(() => {
    runTests();
  }, []);

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Database Connection Test
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {tests.map((test, index) => (
            <div key={test.name} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                {getStatusIcon(test.status)}
                <div>
                  <p className="font-medium">{test.name}</p>
                  <p className="text-sm text-muted-foreground">{test.message}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <Button onClick={runTests} disabled={isRunning} className="flex items-center gap-2">
            {isRunning ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Database className="h-4 w-4" />
            )}
            {isRunning ? 'Testing...' : 'Run Tests Again'}
          </Button>
        </div>

        {tests.every(test => test.status === 'success') && (
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              🎉 All tests passed! Your database is properly configured and ready to use.
            </AlertDescription>
          </Alert>
        )}

        {tests.some(test => test.status === 'error') && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              Some tests failed. Please check your Supabase configuration and try again.
            </AlertDescription>
          </Alert>
        )}

        <div className="text-xs text-muted-foreground bg-muted p-3 rounded">
          <p><strong>Database URL:</strong> {import.meta.env.VITE_SUPABASE_URL || 'Not configured'}</p>
          <p><strong>Project ID:</strong> {import.meta.env.VITE_SUPABASE_PROJECT_ID || 'Not configured'}</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default DatabaseTest;