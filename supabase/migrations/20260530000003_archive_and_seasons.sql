-- ミッションのアーカイブ（論理削除）とシーズン制を導入する。
--
-- ミッションを物理削除すると achievements の参照先(mission_id)が失われ、
-- ユーザーが過去にやったタスクの履歴が壊れる。そのため archived_at による
-- 論理削除に切り替え、達成記録は常に保持する。
ALTER TABLE missions ADD COLUMN archived_at TIMESTAMPTZ;

-- シーズン: 期間で活動を区切り、リーダーボードやミッションの肥大化を抑える。
CREATE TABLE seasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ends_at TIMESTAMPTZ,
  is_active BOOL NOT NULL DEFAULT false,
  sort_no INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- アクティブなシーズンは同時に最大1つだけ。
CREATE UNIQUE INDEX seasons_single_active ON seasons (is_active) WHERE is_active;

ALTER TABLE seasons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "seasons_public_read" ON seasons FOR SELECT USING (true);

-- 最初のシーズンを作成し、稼働中にする。
INSERT INTO seasons (slug, name, is_active, sort_no) VALUES ('season-1', 'シーズン1', true, 1);

-- 達成記録がどのシーズンに属するか。集計（シーズン別リーダーボード）に使う。
ALTER TABLE achievements ADD COLUMN season_id UUID REFERENCES seasons(id);
UPDATE achievements SET season_id = (SELECT id FROM seasons WHERE is_active LIMIT 1);

-- 達成記録RPCを更新:
--   1. アーカイブ済みミッション(archived_at IS NOT NULL)は達成不可にする。
--   2. 稼働中シーズンの season_id を達成記録に刻む。
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
  -- ユーザー行をロック（同一ユーザーの達成記録を直列化し競合を防ぐ）
  SELECT TRUE INTO v_user_exists FROM users WHERE users.id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN QUERY SELECT NULL::UUID, NULL::UUID, NULL::UUID, NULL::TEXT, NULL::INT, NULL::TIMESTAMPTZ, 'USER_NOT_FOUND'::TEXT;
    RETURN;
  END IF;

  -- ミッション情報を取得（非表示・アーカイブ済みは対象外）
  SELECT points, max_achievement_count INTO v_mission
    FROM missions
    WHERE missions.id = p_mission_id AND is_hidden = false AND archived_at IS NULL;

  IF NOT FOUND THEN
    RETURN QUERY SELECT NULL::UUID, NULL::UUID, NULL::UUID, NULL::TEXT, NULL::INT, NULL::TIMESTAMPTZ, 'MISSION_NOT_FOUND'::TEXT;
    RETURN;
  END IF;

  -- 達成上限チェック（ユーザー行ロック済みなのでアトミック）
  IF v_mission.max_achievement_count IS NOT NULL THEN
    SELECT COUNT(*) INTO v_count
      FROM achievements
      WHERE achievements.user_id = p_user_id AND achievements.mission_id = p_mission_id;

    IF v_count >= v_mission.max_achievement_count THEN
      RETURN QUERY SELECT NULL::UUID, NULL::UUID, NULL::UUID, NULL::TEXT, NULL::INT, NULL::TIMESTAMPTZ, 'LIMIT_REACHED'::TEXT;
      RETURN;
    END IF;
  END IF;

  -- 稼働中シーズンを特定（存在しなければ NULL のまま）
  SELECT seasons.id INTO v_season_id FROM seasons WHERE is_active LIMIT 1;

  -- 達成記録を挿入
  INSERT INTO achievements (user_id, mission_id, submission_text, points_earned, season_id)
    VALUES (p_user_id, p_mission_id, p_submission_text, v_mission.points, v_season_id)
    RETURNING achievements.id, achievements.user_id, achievements.mission_id,
              achievements.submission_text, achievements.points_earned, achievements.achieved_at
    INTO v_achievement;

  -- ポイントをインクリメント
  UPDATE users SET total_points = total_points + v_mission.points WHERE users.id = p_user_id;

  RETURN QUERY SELECT v_achievement.id, v_achievement.user_id, v_achievement.mission_id,
                      v_achievement.submission_text, v_achievement.points_earned, v_achievement.achieved_at,
                      NULL::TEXT;
END;
$$;
