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
      };
      categories: {
        Row: {
          id: string;
          slug: string;
          title: string;
          sort_no: number;
          group_key: string;
          department: string | null;
        };
      };
      departments: {
        Row: {
          slug: string;
          name: string;
          sort_no: number;
        };
      };
      admins: {
        Row: {
          id: string;
          discord_user_id: string;
          username: string | null;
          title: string;
          scope: AdminScope;
          department: string | null;
          created_at: string;
        };
      };
      mission_proposals: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          difficulty: number;
          points: number;
          submission_type: SubmissionType;
          department: string;
          proposed_by_discord_id: string;
          proposed_by_username: string | null;
          status: ProposalStatus;
          review_reason: string | null;
          reviewed_by_discord_id: string | null;
          reviewed_at: string | null;
          approved_mission_slug: string | null;
          created_at: string;
        };
      };
    };
  };
}

export type AdminScope = "developer" | "super" | "dept";
export type ProposalStatus = "pending" | "approved" | "rejected";

export type UserRow = Database["public"]["Tables"]["users"]["Row"];
export type MissionRow = Database["public"]["Tables"]["missions"]["Row"];
export type AchievementRow = Database["public"]["Tables"]["achievements"]["Row"];
export type CategoryRow = Database["public"]["Tables"]["categories"]["Row"];
export type DepartmentRow = Database["public"]["Tables"]["departments"]["Row"];
export type AdminRow = Database["public"]["Tables"]["admins"]["Row"];
export type MissionProposalRow = Database["public"]["Tables"]["mission_proposals"]["Row"];

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
  guildId: string;
}
