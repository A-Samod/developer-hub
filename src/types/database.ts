export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type Priority = 'low' | 'medium' | 'high' | 'urgent';
type TaskStatus = 'todo' | 'in_progress' | 'blocked' | 'done' | 'cancelled';
type CategoryEntityType = 'note' | 'snippet' | 'task';
type ResourceType = 'note' | 'snippet';

export type Database = {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          entity_type: CategoryEntityType;
          color: string;
          position: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          entity_type: CategoryEntityType;
          color?: string;
          position?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          entity_type?: CategoryEntityType;
          color?: string;
          position?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      notes: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          content_md: string;
          category_id: string | null;
          tags: string[];
          is_favorite: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          content_md?: string;
          category_id?: string | null;
          tags?: string[];
          is_favorite?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          content_md?: string;
          category_id?: string | null;
          tags?: string[];
          is_favorite?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      snippets: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string;
          language: string;
          code: string;
          category_id: string | null;
          tags: string[];
          is_favorite: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string;
          language?: string;
          code?: string;
          category_id?: string | null;
          tags?: string[];
          is_favorite?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string;
          language?: string;
          code?: string;
          category_id?: string | null;
          tags?: string[];
          is_favorite?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      tasks: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string;
          category_id: string | null;
          status: TaskStatus;
          priority: Priority;
          due_date: string | null;
          estimate_minutes: number | null;
          archived_at: string | null;
          is_favorite: boolean;
          created_at: string;
          updated_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string;
          category_id?: string | null;
          status?: TaskStatus;
          priority?: Priority;
          due_date?: string | null;
          estimate_minutes?: number | null;
          archived_at?: string | null;
          is_favorite?: boolean;
          created_at?: string;
          updated_at?: string;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string;
          category_id?: string | null;
          status?: TaskStatus;
          priority?: Priority;
          due_date?: string | null;
          estimate_minutes?: number | null;
          archived_at?: string | null;
          is_favorite?: boolean;
          created_at?: string;
          updated_at?: string;
          completed_at?: string | null;
        };
        Relationships: [];
      };
      task_resources: {
        Row: {
          id: string;
          task_id: string;
          resource_type: ResourceType;
          resource_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          task_id: string;
          resource_type: ResourceType;
          resource_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          task_id?: string;
          resource_type?: ResourceType;
          resource_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      search_developer_hub: {
        Args: { query_text: string };
        Returns: {
          id: string;
          type: string;
          title: string;
          excerpt: string;
          category_name: string | null;
          tags: string[] | null;
          updated_at: string;
        }[];
      };
      seed_default_categories: {
        Args: Record<string, never>;
        Returns: undefined;
      };
    };
    Enums: {
      priority_level: Priority;
      task_status: TaskStatus;
      category_entity_type: CategoryEntityType;
      resource_type: ResourceType;
    };
    CompositeTypes: Record<string, never>;
  };
};
