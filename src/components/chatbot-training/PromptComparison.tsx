import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  GitCompare,
  ArrowRight,
  Eye,
  FileText
} from 'lucide-react';

interface PromptComparisonProps {
  originalPrompt: string;
  newPrompt: string;
  versionNumber: string;
  parentVersionNumber?: string;
  changes?: string[];
}

export const PromptComparison: React.FC<PromptComparisonProps> = ({
  originalPrompt,
  newPrompt,
  versionNumber,
  parentVersionNumber,
  changes = []
}) => {
  const [view, setView] = useState<'split' | 'unified'>('split');

  // Simple text difference detection
  const getWordDifferences = (original: string, updated: string) => {
    const originalWords = original.split(/(\s+)/);
    const updatedWords = updated.split(/(\s+)/);

    const differences = [];
    const maxLength = Math.max(originalWords.length, updatedWords.length);

    for (let i = 0; i < maxLength; i++) {
      const originalWord = originalWords[i] || '';
      const updatedWord = updatedWords[i] || '';

      if (originalWord !== updatedWord) {
        if (originalWord && !updatedWord) {
          differences.push({ type: 'removed', text: originalWord, index: i });
        } else if (!originalWord && updatedWord) {
          differences.push({ type: 'added', text: updatedWord, index: i });
        } else {
          differences.push({ type: 'changed', original: originalWord, updated: updatedWord, index: i });
        }
      }
    }

    return differences;
  };

  const highlightDifferences = (text: string, isOriginal: boolean) => {
    const words = text.split(/(\s+)/);
    const differences = getWordDifferences(originalPrompt, newPrompt);

    return words.map((word, index) => {
      const diff = differences.find(d => d.index === index);
      if (!diff) return <span key={index}>{word}</span>;

      if (diff.type === 'removed' && isOriginal) {
        return <span key={index} className="bg-red-100 text-red-800 px-1 rounded">{word}</span>;
      } else if (diff.type === 'added' && !isOriginal) {
        return <span key={index} className="bg-green-100 text-green-800 px-1 rounded">{word}</span>;
      } else if (diff.type === 'changed') {
        if (isOriginal) {
          return <span key={index} className="bg-yellow-100 text-yellow-800 px-1 rounded">{word}</span>;
        } else {
          return <span key={index} className="bg-blue-100 text-blue-800 px-1 rounded">{word}</span>;
        }
      }

      return <span key={index}>{word}</span>;
    });
  };

  const getChangeSummary = () => {
    const differences = getWordDifferences(originalPrompt, newPrompt);
    const added = differences.filter(d => d.type === 'added').length;
    const removed = differences.filter(d => d.type === 'removed').length;
    const changed = differences.filter(d => d.type === 'changed').length;

    return { added, removed, changed };
  };

  const changeSummary = getChangeSummary();

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GitCompare className="h-5 w-5" />
          <h3 className="font-semibold">Prompt Comparison</h3>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={view === 'split' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setView('split')}
          >
            Split View
          </Button>
          <Button
            variant={view === 'unified' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setView('unified')}
          >
            Unified View
          </Button>
        </div>
      </div>

      {/* Change Summary */}
      <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <span className="text-sm">Added: {changeSummary.added} sections</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          <span className="text-sm">Removed: {changeSummary.removed} sections</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
          <span className="text-sm">Modified: {changeSummary.changed} sections</span>
        </div>
      </div>

      {/* Comparison View */}
      {view === 'split' ? (
        <div className="grid grid-cols-2 gap-4">
          {/* Original Prompt */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {parentVersionNumber || 'Original'}
              </Badge>
              <span className="text-sm text-muted-foreground">Previous Version</span>
            </div>
            <ScrollArea className="h-64 w-full rounded-md border p-4">
              <div className="text-sm font-mono whitespace-pre-wrap">
                {highlightDifferences(originalPrompt, true)}
              </div>
            </ScrollArea>
          </div>

          {/* New Prompt */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="default">
                {versionNumber}
              </Badge>
              <span className="text-sm text-muted-foreground">Current Version</span>
            </div>
            <ScrollArea className="h-64 w-full rounded-md border p-4">
              <div className="text-sm font-mono whitespace-pre-wrap">
                {highlightDifferences(newPrompt, false)}
              </div>
            </ScrollArea>
          </div>
        </div>
      ) : (
        /* Unified View */
        <div className="space-y-4">
          <Tabs defaultValue="original" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="original">
                {parentVersionNumber || 'Original'}
              </TabsTrigger>
              <TabsTrigger value="updated">
                {versionNumber}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="original" className="space-y-2">
              <ScrollArea className="h-80 w-full rounded-md border p-4">
                <div className="text-sm font-mono whitespace-pre-wrap">
                  {originalPrompt}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="updated" className="space-y-2">
              <ScrollArea className="h-80 w-full rounded-md border p-4">
                <div className="text-sm font-mono whitespace-pre-wrap">
                  {newPrompt}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
      )}


      {/* Legend */}
      <div className="p-3 bg-muted/30 rounded-lg">
        <h5 className="font-medium mb-2 flex items-center gap-2">
          <Eye className="h-4 w-4" />
          Legend
        </h5>
        <div className="flex flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-1">
            <span className="bg-green-100 text-green-800 px-2 py-1 rounded">Added</span>
            <span>New content</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="bg-red-100 text-red-800 px-2 py-1 rounded">Removed</span>
            <span>Deleted content</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Original</span>
            <span>Changed (before)</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">Updated</span>
            <span>Changed (after)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromptComparison;