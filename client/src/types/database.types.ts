export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      external_providers: {
        Row: {
          android_link: string | null
          created_at: string | null
          description: string | null
          id: string
          ios_link: string | null
          is_active: boolean
          logo_url: string | null
          provider_name: string
          service_type: string
          web_link: string | null
        }
        Insert: {
          android_link?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          ios_link?: string | null
          is_active?: boolean
          logo_url?: string | null
          provider_name: string
          service_type: string
          web_link?: string | null
        }
        Update: {
          android_link?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          ios_link?: string | null
          is_active?: boolean
          logo_url?: string | null
          provider_name?: string
          service_type?: string
          web_link?: string | null
        }
        Relationships: []
      }
      jeepney_fare_matrix: {
        Row: {
          destination_landmark: string
          discounted_fare: number
          id: string
          origin_landmark: string
          regular_fare: number
        }
        Insert: {
          destination_landmark: string
          discounted_fare: number
          id?: string
          origin_landmark: string
          regular_fare: number
        }
        Update: {
          destination_landmark?: string
          discounted_fare?: number
          id?: string
          origin_landmark?: string
          regular_fare?: number
        }
        Relationships: []
      }
      places: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          is_featured: boolean | null
          latitude: number
          longitude: number
          metadata: Json | null
          name: string
        }
        Insert: {
          category: string
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          latitude: number
          longitude: number
          metadata?: Json | null
          name: string
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          latitude?: number
          longitude?: number
          metadata?: Json | null
          name?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          role: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          role?: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          role?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      promotions: {
        Row: {
          created_at: string
          description: string
          discount: string | null
          id: string
          image_url: string | null
          is_active: boolean
          promo_code: string | null
          title: string
          updated_at: string
          valid_until: string | null
        }
        Insert: {
          created_at?: string
          description: string
          discount?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          promo_code?: string | null
          title: string
          updated_at?: string
          valid_until?: string | null
        }
        Update: {
          created_at?: string
          description?: string
          discount?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          promo_code?: string | null
          title?: string
          updated_at?: string
          valid_until?: string | null
        }
        Relationships: []
      }
      route_landmarks: {
        Row: {
          id: string
          landmark_name: string
          latitude: number
          longitude: number
          route_id: string | null
          sequence_order: number
        }
        Insert: {
          id?: string
          landmark_name: string
          latitude: number
          longitude: number
          route_id?: string | null
          sequence_order: number
        }
        Update: {
          id?: string
          landmark_name?: string
          latitude?: number
          longitude?: number
          route_id?: string | null
          sequence_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "route_landmarks_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "transit_routes"
            referencedColumns: ["id"]
          },
        ]
      }
      transit_routes: {
        Row: {
          color_code: string
          created_at: string | null
          geojson_path: Json | null
          id: string
          route_code: string
          route_name: string
          vehicle_type: string
        }
        Insert: {
          color_code: string
          created_at?: string | null
          geojson_path?: Json | null
          id?: string
          route_code: string
          route_name: string
          vehicle_type?: string
        }
        Update: {
          color_code?: string
          created_at?: string | null
          geojson_path?: Json | null
          id?: string
          route_code?: string
          route_name?: string
          vehicle_type?: string
        }
        Relationships: []
      }
      tricycle_fares: {
        Row: {
          destination: string
          id: string
          regular_fare: number | null
          special_fare: number
          toda_terminal: string
        }
        Insert: {
          destination: string
          id?: string
          regular_fare?: number | null
          special_fare: number
          toda_terminal: string
        }
        Update: {
          destination?: string
          id?: string
          regular_fare?: number | null
          special_fare?: number
          toda_terminal?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          role: string
          session_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          role: string
          session_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          role?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_sessions: {
        Row: {
          created_at: string | null
          id: string
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_favorites: {
        Row: {
          created_at: string | null
          id: string
          place_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          place_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          place_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_favorites_place_id_fkey"
            columns: ["place_id"]
            isOneToOne: false
            referencedRelation: "places"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
