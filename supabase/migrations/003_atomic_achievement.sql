-- アトミックな達成記録関数（TOCTOU競合状態を防ぐ）
-- アプリ側でのcount check + insertの間にあった競合をDB側でロックして解決する
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
BEGIN
  -- ミッション情報を取得（行ロック）
  SELECT points, max_achievement_count INTO v_mission
    FROM missions
    WHERE missions.id = p_mission_id AND is_hidden = false
    FOR SHARE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT NULL::UUID, NULL::UUID, NULL::UUID, NULL::TEXT, NULL::INT, NULL::TIMESTAMPTZ, 'MISSION_NOT_FOUND'::TEXT;
    RETURN;
  END IF;

  -- 達成上限チェック（ロックしてアトミックに確認）
  IF v_mission.max_achievement_count IS NOT NULL THEN
    SELECT COUNT(*) INTO v_count
      FROM achievements
      WHERE achievements.user_id = p_user_id AND achievements.mission_id = p_mission_id
      FOR UPDATE;

    IF v_count >= v_mission.max_achievement_count THEN
      RETURN QUERY SELECT NULL::UUID, NULL::UUID, NULL::UUID, NULL::TEXT, NULL::INT, NULL::TIMESTAMPTZ, 'LIMIT_REACHED'::TEXT;
      RETURN;
    END IF;
  END IF;

  -- 達成記録を挿入
  INSERT INTO achievements (user_id, mission_id, submission_text, points_earned)
    VALUES (p_user_id, p_mission_id, p_submission_text, v_mission.points)
    RETURNING achievements.id, achievements.user_id, achievements.mission_id,
              achievements.submission_text, achievements.points_earned, achievements.achieved_at
    INTO v_achievement;

  -- ポイントをアトミックにインクリメント
  UPDATE users SET total_points = total_points + v_mission.points WHERE users.id = p_user_id;

  RETURN QUERY SELECT v_achievement.id, v_achievement.user_id, v_achievement.mission_id,
                      v_achievement.submission_text, v_achievement.points_earned, v_achievement.achieved_at,
                      NULL::TEXT;
END;
$$;
