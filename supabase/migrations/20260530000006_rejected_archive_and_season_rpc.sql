-- 却下された提案の保管庫（監査用・非公開）。mission_proposals からはここへ移す。
CREATE TABLE rejected_proposals (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  difficulty INT NOT NULL,
  points INT NOT NULL,
  submission_type TEXT NOT NULL,
  department TEXT NOT NULL,
  proposed_by_discord_id TEXT NOT NULL,
  proposed_by_username TEXT,
  review_reason TEXT,
  reviewed_by_discord_id TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL,
  rejected_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 監査データなので公開読み取りポリシーは作らない（service role 経由の管理APIのみ）。
ALTER TABLE rejected_proposals ENABLE ROW LEVEL SECURITY;

-- 既存の却下済み提案を保管庫へ移動する。
INSERT INTO rejected_proposals (
  id, title, description, difficulty, points, submission_type, department,
  proposed_by_discord_id, proposed_by_username, review_reason, reviewed_by_discord_id, reviewed_at, created_at
)
SELECT id, title, description, difficulty, points, submission_type, department,
       proposed_by_discord_id, proposed_by_username, review_reason, reviewed_by_discord_id, reviewed_at, created_at
  FROM mission_proposals
 WHERE status = 'rejected';

DELETE FROM mission_proposals WHERE status = 'rejected';

-- シーズンを稼働中に切り替える。他の稼働中シーズンは終了扱いにする（同時稼働は1つだけ）。
CREATE OR REPLACE FUNCTION activate_season(p_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE seasons SET is_active = false, ends_at = COALESCE(ends_at, now())
   WHERE is_active AND id <> p_id;
  UPDATE seasons SET is_active = true, ends_at = NULL
   WHERE id = p_id;
END;
$$;
