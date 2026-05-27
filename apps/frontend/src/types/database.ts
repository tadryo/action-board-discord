export type SubmissionType = "TEXT" | "LINK" | "NONE";

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          discord_user_id: string;
          username: string;
          avatar: string | null;
          guild_id: string;
          total_points: number;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["users"]["Row"], "id" | "created_at" | "total_points">;
        Update: Partial<Database["public"]["Tables"]["users"]["Insert"]>;
      };
      missions: {
        Row: {
          id: string;
          slug: string;
          title: string;
          description: string | null;
          difficulty: number;
          points: number;
          submission_type: SubmissionType;
          max_achievement_count: number | null;
          category_slug: string;
          is_hidden: boolean;
          icon_url: string | null;
          is_featured: boolean;
        };
        Insert: Omit<Database["public"]["Tables"]["missions"]["Row"], "id">;
        Update: Partial<Database["public"]["Tables"]["missions"]["Insert"]>;
      };
      achievements: {
        Row: {
          id: string;
          user_id: string;
          mission_id: string;
          submission_text: string | null;
          achieved_at: string;
          points_earned: number;
        };
        Insert: Omit<Database["public"]["Tables"]["achievements"]["Row"], "id" | "achieved_at">;
        Update: Partial<Database["public"]["Tables"]["achievements"]["Insert"]>;
      };
      categories: {
        Row: {
          id: string;
          slug: string;
          title: string;
          sort_no: number;
        };
        Insert: Omit<Database["public"]["Tables"]["categories"]["Row"], "id">;
        Update: Partial<Database["public"]["Tables"]["categories"]["Insert"]>;
      };
    };
  };
}

export type UserRow = Database["public"]["Tables"]["users"]["Row"];
export type MissionRow = Database["public"]["Tables"]["missions"]["Row"];
export type AchievementRow = Database["public"]["Tables"]["achievements"]["Row"];
export type CategoryRow = Database["public"]["Tables"]["categories"]["Row"];

export interface MissionWithAchievements extends MissionRow {
  achievement_count: number;
  is_completed: boolean;
  total_achievements?: number;
}

export interface LeaderboardEntry {
  rank: number;
  discord_user_id: string;
  username: string;
  avatar: string | null;
  total_points: number;
}

export interface AuthState {
  status: "idle" | "loading" | "authenticated" | "error";
  user: UserRow | null;
  accessToken: string | null;
  error: string | null;
}
