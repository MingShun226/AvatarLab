
export interface Template {
  id: string;
  title: string;
  content: string;
  category: string | null;
  template_type: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
