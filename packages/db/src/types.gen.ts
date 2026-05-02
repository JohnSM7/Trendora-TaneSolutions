export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      approvals: {
        Row: {
          approver_email: string | null
          approver_name: string | null
          comment: string | null
          created_at: string
          decided_at: string | null
          decision: Database["public"]["Enums"]["approval_decision"]
          draft_id: string
          id: string
          ip_address: unknown
          org_id: string
          requested_by: string | null
          user_agent: string | null
        }
        Insert: {
          approver_email?: string | null
          approver_name?: string | null
          comment?: string | null
          created_at?: string
          decided_at?: string | null
          decision?: Database["public"]["Enums"]["approval_decision"]
          draft_id: string
          id?: string
          ip_address?: unknown
          org_id: string
          requested_by?: string | null
          user_agent?: string | null
        }
        Update: {
          approver_email?: string | null
          approver_name?: string | null
          comment?: string | null
          created_at?: string
          decided_at?: string | null
          decision?: Database["public"]["Enums"]["approval_decision"]
          draft_id?: string
          id?: string
          ip_address?: unknown
          org_id?: string
          requested_by?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "approvals_draft_id_fkey"
            columns: ["draft_id"]
            isOneToOne: false
            referencedRelation: "content_drafts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approvals_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          created_at: string
          id: string
          ip_address: unknown
          metadata: Json | null
          org_id: string | null
          target_id: string | null
          target_type: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          org_id?: string | null
          target_id?: string | null
          target_type?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          org_id?: string | null
          target_id?: string | null
          target_type?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_assets: {
        Row: {
          brand_kit_id: string | null
          created_at: string
          height: number | null
          id: string
          metadata: Json | null
          mime_type: string | null
          org_id: string
          size_bytes: number | null
          storage_path: string
          type: string
          uploaded_by: string | null
          width: number | null
        }
        Insert: {
          brand_kit_id?: string | null
          created_at?: string
          height?: number | null
          id?: string
          metadata?: Json | null
          mime_type?: string | null
          org_id: string
          size_bytes?: number | null
          storage_path: string
          type: string
          uploaded_by?: string | null
          width?: number | null
        }
        Update: {
          brand_kit_id?: string | null
          created_at?: string
          height?: number | null
          id?: string
          metadata?: Json | null
          mime_type?: string | null
          org_id?: string
          size_bytes?: number | null
          storage_path?: string
          type?: string
          uploaded_by?: string | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "brand_assets_brand_kit_id_fkey"
            columns: ["brand_kit_id"]
            isOneToOne: false
            referencedRelation: "brand_kits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brand_assets_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_kits: {
        Row: {
          accent_color: string | null
          cover_url: string | null
          created_at: string
          default_cta: string | null
          do_not_say: string[] | null
          do_say: string[] | null
          fonts: Json | null
          hashtag_sets: Json | null
          id: string
          is_default: boolean
          logo_url: string | null
          name: string
          org_id: string
          primary_color: string | null
          tone: string[] | null
          updated_at: string
          voice_prompt: string | null
        }
        Insert: {
          accent_color?: string | null
          cover_url?: string | null
          created_at?: string
          default_cta?: string | null
          do_not_say?: string[] | null
          do_say?: string[] | null
          fonts?: Json | null
          hashtag_sets?: Json | null
          id?: string
          is_default?: boolean
          logo_url?: string | null
          name: string
          org_id: string
          primary_color?: string | null
          tone?: string[] | null
          updated_at?: string
          voice_prompt?: string | null
        }
        Update: {
          accent_color?: string | null
          cover_url?: string | null
          created_at?: string
          default_cta?: string | null
          do_not_say?: string[] | null
          do_say?: string[] | null
          fonts?: Json | null
          hashtag_sets?: Json | null
          id?: string
          is_default?: boolean
          logo_url?: string | null
          name?: string
          org_id?: string
          primary_color?: string | null
          tone?: string[] | null
          updated_at?: string
          voice_prompt?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "brand_kits_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      content_drafts: {
        Row: {
          approval_token: string | null
          approval_token_expires_at: string | null
          ayrshare_post_ids: Json | null
          bodies_per_platform: Json | null
          body: string | null
          brand_kit_id: string | null
          created_at: string
          created_by: string | null
          generated_from: string | null
          hashtags: string[] | null
          id: string
          media: Json | null
          mentions: string[] | null
          org_id: string
          platforms: Database["public"]["Enums"]["social_platform"][]
          published_at: string | null
          scheduled_at: string | null
          status: Database["public"]["Enums"]["draft_status"]
          timezone: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          approval_token?: string | null
          approval_token_expires_at?: string | null
          ayrshare_post_ids?: Json | null
          bodies_per_platform?: Json | null
          body?: string | null
          brand_kit_id?: string | null
          created_at?: string
          created_by?: string | null
          generated_from?: string | null
          hashtags?: string[] | null
          id?: string
          media?: Json | null
          mentions?: string[] | null
          org_id: string
          platforms?: Database["public"]["Enums"]["social_platform"][]
          published_at?: string | null
          scheduled_at?: string | null
          status?: Database["public"]["Enums"]["draft_status"]
          timezone?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          approval_token?: string | null
          approval_token_expires_at?: string | null
          ayrshare_post_ids?: Json | null
          bodies_per_platform?: Json | null
          body?: string | null
          brand_kit_id?: string | null
          created_at?: string
          created_by?: string | null
          generated_from?: string | null
          hashtags?: string[] | null
          id?: string
          media?: Json | null
          mentions?: string[] | null
          org_id?: string
          platforms?: Database["public"]["Enums"]["social_platform"][]
          published_at?: string | null
          scheduled_at?: string | null
          status?: Database["public"]["Enums"]["draft_status"]
          timezone?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_drafts_brand_kit_id_fkey"
            columns: ["brand_kit_id"]
            isOneToOne: false
            referencedRelation: "brand_kits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_drafts_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      generations: {
        Row: {
          cost_usd: number | null
          created_at: string
          credits_charged: number
          draft_id: string | null
          duration_ms: number | null
          error: string | null
          id: string
          model: string
          org_id: string
          output_excerpt: string | null
          prompt_excerpt: string | null
          provider: string
          status: string
          tokens_in: number | null
          tokens_out: number | null
          type: Database["public"]["Enums"]["generation_type"]
          user_id: string | null
        }
        Insert: {
          cost_usd?: number | null
          created_at?: string
          credits_charged?: number
          draft_id?: string | null
          duration_ms?: number | null
          error?: string | null
          id?: string
          model: string
          org_id: string
          output_excerpt?: string | null
          prompt_excerpt?: string | null
          provider: string
          status?: string
          tokens_in?: number | null
          tokens_out?: number | null
          type: Database["public"]["Enums"]["generation_type"]
          user_id?: string | null
        }
        Update: {
          cost_usd?: number | null
          created_at?: string
          credits_charged?: number
          draft_id?: string | null
          duration_ms?: number | null
          error?: string | null
          id?: string
          model?: string
          org_id?: string
          output_excerpt?: string | null
          prompt_excerpt?: string | null
          provider?: string
          status?: string
          tokens_in?: number | null
          tokens_out?: number | null
          type?: Database["public"]["Enums"]["generation_type"]
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "generations_draft_id_fkey"
            columns: ["draft_id"]
            isOneToOne: false
            referencedRelation: "content_drafts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generations_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      memberships: {
        Row: {
          accepted_at: string | null
          created_at: string
          id: string
          invited_at: string | null
          invited_by: string | null
          org_id: string
          role: Database["public"]["Enums"]["member_role"]
          user_id: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          org_id: string
          role?: Database["public"]["Enums"]["member_role"]
          user_id: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          org_id?: string
          role?: Database["public"]["Enums"]["member_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memberships_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          ai_credits_used_this_period: number
          ayrshare_profile_id: string | null
          ayrshare_profile_key: string | null
          cancel_at_period_end: boolean
          created_at: string
          current_period_end: string | null
          deleted_at: string | null
          id: string
          name: string
          plan: Database["public"]["Enums"]["plan_tier"]
          posts_used_this_period: number
          slug: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          trial_ends_at: string | null
          updated_at: string
          vertical: string | null
        }
        Insert: {
          ai_credits_used_this_period?: number
          ayrshare_profile_id?: string | null
          ayrshare_profile_key?: string | null
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          deleted_at?: string | null
          id?: string
          name: string
          plan?: Database["public"]["Enums"]["plan_tier"]
          posts_used_this_period?: number
          slug: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_ends_at?: string | null
          updated_at?: string
          vertical?: string | null
        }
        Update: {
          ai_credits_used_this_period?: number
          ayrshare_profile_id?: string | null
          ayrshare_profile_key?: string | null
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          deleted_at?: string | null
          id?: string
          name?: string
          plan?: Database["public"]["Enums"]["plan_tier"]
          posts_used_this_period?: number
          slug?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_ends_at?: string | null
          updated_at?: string
          vertical?: string | null
        }
        Relationships: []
      }
      post_metrics: {
        Row: {
          ayrshare_post_id: string
          clicks: number | null
          comments: number | null
          draft_id: string
          engagement_rate: number | null
          fetched_at: string
          id: string
          impressions: number | null
          likes: number | null
          org_id: string
          platform: Database["public"]["Enums"]["social_platform"]
          raw: Json | null
          reach: number | null
          saves: number | null
          shares: number | null
          video_views: number | null
        }
        Insert: {
          ayrshare_post_id: string
          clicks?: number | null
          comments?: number | null
          draft_id: string
          engagement_rate?: number | null
          fetched_at?: string
          id?: string
          impressions?: number | null
          likes?: number | null
          org_id: string
          platform: Database["public"]["Enums"]["social_platform"]
          raw?: Json | null
          reach?: number | null
          saves?: number | null
          shares?: number | null
          video_views?: number | null
        }
        Update: {
          ayrshare_post_id?: string
          clicks?: number | null
          comments?: number | null
          draft_id?: string
          engagement_rate?: number | null
          fetched_at?: string
          id?: string
          impressions?: number | null
          likes?: number | null
          org_id?: string
          platform?: Database["public"]["Enums"]["social_platform"]
          raw?: Json | null
          reach?: number | null
          saves?: number | null
          shares?: number | null
          video_views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "post_metrics_draft_id_fkey"
            columns: ["draft_id"]
            isOneToOne: false
            referencedRelation: "content_drafts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_metrics_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      social_accounts: {
        Row: {
          ayrshare_ref: string | null
          connected_at: string
          disconnected_at: string | null
          display_name: string | null
          handle: string | null
          id: string
          metadata: Json | null
          org_id: string
          platform: Database["public"]["Enums"]["social_platform"]
          profile_image_url: string | null
          status: Database["public"]["Enums"]["social_status"]
        }
        Insert: {
          ayrshare_ref?: string | null
          connected_at?: string
          disconnected_at?: string | null
          display_name?: string | null
          handle?: string | null
          id?: string
          metadata?: Json | null
          org_id: string
          platform: Database["public"]["Enums"]["social_platform"]
          profile_image_url?: string | null
          status?: Database["public"]["Enums"]["social_status"]
        }
        Update: {
          ayrshare_ref?: string | null
          connected_at?: string
          disconnected_at?: string | null
          display_name?: string | null
          handle?: string | null
          id?: string
          metadata?: Json | null
          org_id?: string
          platform?: Database["public"]["Enums"]["social_platform"]
          profile_image_url?: string | null
          status?: Database["public"]["Enums"]["social_status"]
        }
        Relationships: [
          {
            foreignKeyName: "social_accounts_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      stripe_events: {
        Row: {
          id: string
          org_id: string | null
          payload: Json
          processed_at: string
          type: string
        }
        Insert: {
          id: string
          org_id?: string | null
          payload: Json
          processed_at?: string
          type: string
        }
        Update: {
          id?: string
          org_id?: string | null
          payload?: Json
          processed_at?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "stripe_events_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      usage_meter: {
        Row: {
          ai_credits_used: number
          cost_usd: number
          id: string
          org_id: string
          period_end: string
          period_start: string
          posts_published: number
          video_seconds_used: number
        }
        Insert: {
          ai_credits_used?: number
          cost_usd?: number
          id?: string
          org_id: string
          period_end: string
          period_start: string
          posts_published?: number
          video_seconds_used?: number
        }
        Update: {
          ai_credits_used?: number
          cost_usd?: number
          id?: string
          org_id?: string
          period_end?: string
          period_start?: string
          posts_published?: number
          video_seconds_used?: number
        }
        Relationships: [
          {
            foreignKeyName: "usage_meter_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_organization: {
        Args: { org_name: string; org_slug: string; org_vertical?: string }
        Returns: string
      }
      user_orgs: { Args: never; Returns: string[] }
      user_role_in: {
        Args: { org: string }
        Returns: Database["public"]["Enums"]["member_role"]
      }
    }
    Enums: {
      approval_decision: "pending" | "approved" | "rejected"
      draft_status:
        | "draft"
        | "in_review"
        | "approved"
        | "scheduled"
        | "publishing"
        | "published"
        | "failed"
        | "cancelled"
      generation_type: "text" | "image" | "video" | "repurpose" | "hashtags"
      member_role: "owner" | "admin" | "editor" | "viewer"
      plan_tier: "trial" | "starter" | "pro" | "agency" | "enterprise"
      social_platform:
        | "instagram"
        | "facebook"
        | "linkedin"
        | "twitter"
        | "tiktok"
        | "youtube"
        | "pinterest"
        | "threads"
        | "bluesky"
        | "gmb"
        | "reddit"
        | "telegram"
      social_status: "connected" | "disconnected" | "expired" | "error"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      approval_decision: ["pending", "approved", "rejected"],
      draft_status: [
        "draft",
        "in_review",
        "approved",
        "scheduled",
        "publishing",
        "published",
        "failed",
        "cancelled",
      ],
      generation_type: ["text", "image", "video", "repurpose", "hashtags"],
      member_role: ["owner", "admin", "editor", "viewer"],
      plan_tier: ["trial", "starter", "pro", "agency", "enterprise"],
      social_platform: [
        "instagram",
        "facebook",
        "linkedin",
        "twitter",
        "tiktok",
        "youtube",
        "pinterest",
        "threads",
        "bluesky",
        "gmb",
        "reddit",
        "telegram",
      ],
      social_status: ["connected", "disconnected", "expired", "error"],
    },
  },
} as const
