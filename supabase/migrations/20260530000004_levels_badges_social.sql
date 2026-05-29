-- バッジ制・SNS/GitHub連携・（レベルはアプリ側で total_points から算出するためスキーマ不要）。

-- SNS/GitHub リンク（ユーザーが任意で設定）。
ALTER TABLE users ADD COLUMN twitter_url TEXT;
ALTER TABLE users ADD COLUMN github_url TEXT;

-- バッジ定義。condition_type で自動付与の条件を表す。
--   count  = 達成回数が condition_value 以上
--   points = 累計ポイントが condition_value 以上
CREATE TABLE badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT NOT NULL DEFAULT '🏅',
  condition_type TEXT NOT NULL CHECK (condition_type IN ('count', 'points')),
  condition_value INT NOT NULL CHECK (condition_value > 0),
  sort_no INT NOT NULL DEFAULT 0
);

-- ユーザーが獲得したバッジ。
CREATE TABLE user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  awarded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, badge_id)
);

ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "badges_public_read" ON badges FOR SELECT USING (true);
CREATE POLICY "user_badges_public_read" ON user_badges FOR SELECT USING (true);

INSERT INTO badges (slug, name, description, icon, condition_type, condition_value, sort_no) VALUES
  ('first-step', '初めの一歩', '初めてミッションを達成した', '🌱', 'count', 1, 1),
  ('count-10', '行動派', 'ミッションを10回達成した', '🔥', 'count', 10, 2),
  ('count-50', '行動の鬼', 'ミッションを50回達成した', '⚡', 'count', 50, 3),
  ('points-100', '100P到達', '累計100ポイントを獲得した', '🥉', 'points', 100, 4),
  ('points-500', '500P到達', '累計500ポイントを獲得した', '🥈', 'points', 500, 5),
  ('points-1000', '1000P到達', '累計1000ポイントを獲得した', '🥇', 'points', 1000, 6);

-- 条件を満たした未付与のバッジをまとめて付与する。
CREATE OR REPLACE FUNCTION evaluate_badges(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_points INT;
  v_count INT;
BEGIN
  SELECT total_points INTO v_points FROM users WHERE id = p_user_id;
  SELECT COUNT(*) INTO v_count FROM achievements WHERE user_id = p_user_id;

  INSERT INTO user_badges (user_id, badge_id)
  SELECT p_user_id, b.id
    FROM badges b
   WHERE NOT EXISTS (
           SELECT 1 FROM user_badges ub WHERE ub.user_id = p_user_id AND ub.badge_id = b.id
         )
     AND (
           (b.condition_type = 'points' AND v_points >= b.condition_value)
        OR (b.condition_type = 'count'  AND v_count  >= b.condition_value)
         )
  ON CONFLICT (user_id, badge_id) DO NOTHING;
END;
$$;

-- 達成記録RPCにバッジ自動付与を組み込む（ポイント加算後に評価）。
CREATE OR REPLACE FUNCTION record_achievement(
  p_user_id UUID,
  p_mission_id UUID,
  p_submission_text TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  mission_id UUID,
  submission_text TEXT,
  points_earned INT,
  achieved_at TIMESTAMPTZ,
  error_code TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_mission RECORD;
  v_count INT;
  v_achievement RECORD;
  v_user_exists BOOLEAN;
  v_season_id UUID;
BEGIN
  SELECT TRUE INTO v_user_exists FROM users WHERE users.id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN QUERY SELECT NULL::UUID, NULL::UUID, NULL::UUID, NULL::TEXT, NULL::INT, NULL::TIMESTAMPTZ, 'USER_NOT_FOUND'::TEXT;
    RETURN;
  END IF;

  SELECT points, max_achievement_count INTO v_mission
    FROM missions
    WHERE missions.id = p_mission_id AND is_hidden = false AND archived_at IS NULL;

  IF NOT FOUND THEN
    RETURN QUERY SELECT NULL::UUID, NULL::UUID, NULL::UUID, NULL::TEXT, NULL::INT, NULL::TIMESTAMPTZ, 'MISSION_NOT_FOUND'::TEXT;
    RETURN;
  END IF;

  IF v_mission.max_achievement_count IS NOT NULL THEN
    SELECT COUNT(*) INTO v_count
      FROM achievements
      WHERE achievements.user_id = p_user_id AND achievements.mission_id = p_mission_id;

    IF v_count >= v_mission.max_achievement_count THEN
      RETURN QUERY SELECT NULL::UUID, NULL::UUID, NULL::UUID, NULL::TEXT, NULL::INT, NULL::TIMESTAMPTZ, 'LIMIT_REACHED'::TEXT;
      RETURN;
    END IF;
  END IF;

  SELECT seasons.id INTO v_season_id FROM seasons WHERE is_active LIMIT 1;

  INSERT INTO achievements (user_id, mission_id, submission_text, points_earned, season_id)
    VALUES (p_user_id, p_mission_id, p_submission_text, v_mission.points, v_season_id)
    RETURNING achievements.id, achievements.user_id, achievements.mission_id,
              achievements.submission_text, achievements.points_earned, achievements.achieved_at
    INTO v_achievement;

  UPDATE users SET total_points = total_points + v_mission.points WHERE users.id = p_user_id;

  -- 累計ポイント・達成回数の条件を満たすバッジを自動付与する。
  PERFORM evaluate_badges(p_user_id);

  RETURN QUERY SELECT v_achievement.id, v_achievement.user_id, v_achievement.mission_id,
                      v_achievement.submission_text, v_achievement.points_earned, v_achievement.achieved_at,
                      NULL::TEXT;
END;
$$;
