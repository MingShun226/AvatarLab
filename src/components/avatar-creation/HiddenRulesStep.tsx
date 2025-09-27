
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Shield, AlertTriangle, Copy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Template } from '@/types/templates';

interface HiddenRulesStepProps {
  data: any;
  onUpdate: (field: string, value: any) => void;
  avatarId?: string;
}

export const HiddenRulesStep: React.FC<HiddenRulesStepProps> = ({ 
  data, 
  onUpdate, 
  avatarId 
}) => {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch hidden rules templates
  useEffect(() => {
    const fetchTemplates = async () => {
      setLoading(true);
      try {
        const { data: templatesData, error } = await supabase
          .from('avatar_templates')
          .select('*')
          .eq('template_type', 'hidden_rules')
          .eq('is_active', true);

        if (error) {
          console.error('Error fetching templates:', error);
        } else {
          setTemplates(templatesData || []);
        }
      } catch (error) {
        console.error('Error fetching templates:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTemplates();
  }, []);

  // Set up real-time updates for hidden rules changes
  useEffect(() => {
    if (!avatarId || !user) return;

    const channel = supabase
      .channel('hidden-rules-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'avatars',
          filter: `id=eq.${avatarId}`
        },
        (payload) => {
          console.log('Hidden rules updated:', payload);
          if (payload.new) {
            const newData = payload.new as any;
            onUpdate('hiddenRules', newData.hidden_rules || '');
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [avatarId, user, onUpdate]);

  const handleUseTemplate = (template: Template) => {
    onUpdate('hiddenRules', template.content);
  };

  return (
    <div className="space-y-6">
      {/* Main Hidden Rules Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Hidden Rules & Guidelines
            {avatarId && (
              <Badge variant="outline" className="text-xs">
                Real-time Updates Enabled
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Set internal behavior rules and constraints that guide your avatar's responses
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="hiddenRules">Hidden Rules & Constraints</Label>
            <Textarea
              id="hiddenRules"
              placeholder="Define internal rules and constraints that your avatar should follow. These are guidelines that shape behavior without being explicitly mentioned in conversations..."
              value={data.hiddenRules || ''}
              onChange={(e) => onUpdate('hiddenRules', e.target.value)}
              className="min-h-[250px] resize-y"
              style={{ resize: 'vertical' }}
            />
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                These rules help maintain consistent behavior and appropriate boundaries
              </p>
              <Badge variant="outline" className="text-xs">
                {data.hiddenRules?.length || 0} characters
              </Badge>
            </div>
          </div>

          {/* Warning Notice */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-amber-900 mb-1">Important Notice</h4>
                <p className="text-sm text-amber-800">
                  Hidden rules are internal guidelines that are not shared with users during conversations. 
                  They help maintain appropriate boundaries and consistent behavior patterns.
                </p>
              </div>
            </div>
          </div>

          {/* Guidelines */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Hidden Rules Examples</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Never discuss personal financial information</li>
              <li>• Maintain professional boundaries in workplace scenarios</li>
              <li>• Avoid giving medical or legal advice</li>
              <li>• Stay consistent with the defined personality traits</li>
              <li>• Redirect inappropriate conversations tactfully</li>
              <li>• Always prioritize user safety and well-being</li>
              <li>• Respect cultural sensitivities based on origin country</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Template Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Hidden Rules Templates</CardTitle>
          <CardDescription>
            Choose from pre-made hidden rules templates to establish proper boundaries
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">Loading templates...</div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {templates.map((template) => (
                <Card key={template.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium">{template.title}</CardTitle>
                      {template.category && (
                        <Badge variant="secondary" className="text-xs">
                          {template.category}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-3">
                      {template.content.substring(0, 120)}...
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => handleUseTemplate(template)}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Use Template
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          {!loading && templates.length === 0 && (
            <div className="text-center py-4 text-muted-foreground">
              No hidden rules templates available at the moment.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
