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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      emergency_contacts: {
        Row: {
          created_at: string
          id: string
          is_default: boolean | null
          name: string
          notify_sms: boolean | null
          phone: string
          relationship: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_default?: boolean | null
          name: string
          notify_sms?: boolean | null
          phone: string
          relationship?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_default?: boolean | null
          name?: string
          notify_sms?: boolean | null
          phone?: string
          relationship?: string | null
          user_id?: string
        }
        Relationships: []
      }
      health_reports: {
        Row: {
          created_at: string
          file_type: string
          file_url: string
          id: string
          is_emergency_accessible: boolean | null
          name: string
          notes: string | null
          report_date: string
          report_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          file_type: string
          file_url: string
          id?: string
          is_emergency_accessible?: boolean | null
          name: string
          notes?: string | null
          report_date?: string
          report_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          file_type?: string
          file_url?: string
          id?: string
          is_emergency_accessible?: boolean | null
          name?: string
          notes?: string | null
          report_date?: string
          report_type?: string
          user_id?: string
        }
        Relationships: []
      }
      hospital_availability: {
        Row: {
          address: string | null
          ambulances_available: number
          created_at: string
          emergency_beds: number
          general_beds: number
          hospital_id: string
          hospital_name: string
          icu_beds: number
          id: string
          is_accepting_emergency: boolean
          latitude: number
          longitude: number
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          ambulances_available?: number
          created_at?: string
          emergency_beds?: number
          general_beds?: number
          hospital_id: string
          hospital_name: string
          icu_beds?: number
          id?: string
          is_accepting_emergency?: boolean
          latitude: number
          longitude: number
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          ambulances_available?: number
          created_at?: string
          emergency_beds?: number
          general_beds?: number
          hospital_id?: string
          hospital_name?: string
          icu_beds?: number
          id?: string
          is_accepting_emergency?: boolean
          latitude?: number
          longitude?: number
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          age: number | null
          allergies: string[] | null
          avatar_type: string | null
          avatar_url: string | null
          blood_group: string | null
          chronic_conditions: string[] | null
          created_at: string
          id: string
          language: string | null
          medications: string[] | null
          name: string | null
          phone: string | null
          updated_at: string
          work_mode_enabled: boolean | null
          work_mode_end_hour: number | null
          work_mode_start_hour: number | null
        }
        Insert: {
          age?: number | null
          allergies?: string[] | null
          avatar_type?: string | null
          avatar_url?: string | null
          blood_group?: string | null
          chronic_conditions?: string[] | null
          created_at?: string
          id: string
          language?: string | null
          medications?: string[] | null
          name?: string | null
          phone?: string | null
          updated_at?: string
          work_mode_enabled?: boolean | null
          work_mode_end_hour?: number | null
          work_mode_start_hour?: number | null
        }
        Update: {
          age?: number | null
          allergies?: string[] | null
          avatar_type?: string | null
          avatar_url?: string | null
          blood_group?: string | null
          chronic_conditions?: string[] | null
          created_at?: string
          id?: string
          language?: string | null
          medications?: string[] | null
          name?: string | null
          phone?: string | null
          updated_at?: string
          work_mode_enabled?: boolean | null
          work_mode_end_hour?: number | null
          work_mode_start_hour?: number | null
        }
        Relationships: []
      }
      sos_logs: {
        Row: {
          contacts_notified: string[] | null
          created_at: string
          id: string
          latitude: number | null
          longitude: number | null
          severity: string
          status: string | null
          user_id: string | null
        }
        Insert: {
          contacts_notified?: string[] | null
          created_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          severity: string
          status?: string | null
          user_id?: string | null
        }
        Update: {
          contacts_notified?: string[] | null
          created_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          severity?: string
          status?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      sos_recordings: {
        Row: {
          created_at: string
          duration_seconds: number
          file_size_bytes: number | null
          id: string
          recording_url: string
          sos_log_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          duration_seconds?: number
          file_size_bytes?: number | null
          id?: string
          recording_url: string
          sos_log_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          duration_seconds?: number
          file_size_bytes?: number | null
          id?: string
          recording_url?: string
          sos_log_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sos_recordings_sos_log_id_fkey"
            columns: ["sos_log_id"]
            isOneToOne: false
            referencedRelation: "sos_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      symptom_checks: {
        Row: {
          ai_response: string | null
          created_at: string
          follow_up_questions: Json | null
          id: string
          symptoms: string
          urgency_level: string | null
          user_id: string | null
        }
        Insert: {
          ai_response?: string | null
          created_at?: string
          follow_up_questions?: Json | null
          id?: string
          symptoms: string
          urgency_level?: string | null
          user_id?: string | null
        }
        Update: {
          ai_response?: string | null
          created_at?: string
          follow_up_questions?: Json | null
          id?: string
          symptoms?: string
          urgency_level?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "hospital_staff" | "user"
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
      app_role: ["admin", "hospital_staff", "user"],
    },
  },
} as const
