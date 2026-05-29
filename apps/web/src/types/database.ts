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
          twitter_url: string | null;
          github_url: string | null;
          instagram_url: string | null;
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
          archived_at: string | null;
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
          season_id: string | null;
        };
      };
      seasons: {
        Row: {
          id: string;
          slug: string;
          name: string;
          starts_at: string;
          ends_at: string | null;
          is_active: boolean;
          sort_no: number;
          created_at: string;
        };
      };
      badges: {
        Row: {
          id: string;
          slug: string;
          name: string;
          description: string | null;
          icon: string;
          condition_type: "count" | "points";
          condition_value: number;
          sort_no: number;
        };
      };
      user_badges: {
        Row: {
          id: string;
          user_id: string;
          badge_id: string;
          awarded_at: string;
        };
      };
      rejected_proposals: {
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
          review_reason: string | null;
          reviewed_by_discord_id: string | null;
          reviewed_at: string | null;
          created_at: string;
          rejected_at: string;
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
export type SeasonRow = Database["public"]["Tables"]["seasons"]["Row"];
export type RejectedProposalRow = Database["public"]["Tables"]["rejected_proposals"]["Row"];
export type BadgeRow = Database["public"]["Tables"]["badges"]["Row"];
export type UserBadgeRow = Database["public"]["Tables"]["user_badges"]["Row"];

export interface BadgeWithEarned extends BadgeRow {
  earned: boolean;
  awarded_at: string | null;
}

export interface TimelineEntry {
  id: string;
  achieved_at: string;
  points_earned: number;
  discord_user_id: string;
  username: string;
  avatar: string | null;
  mission_title: string | null;
}

export interface LevelInfo {
  level: number;
  currentLevelFloor: number;
  nextLevelAt: number;
  pointsIntoLevel: number;
  pointsForLevel: number;
  progress: number;
}

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
