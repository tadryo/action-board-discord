-- ユーザーテーブル（Discord IDで管理）
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discord_user_id TEXT UNIQUE NOT NULL,
  username TEXT NOT NULL,
  avatar TEXT,
  guild_id TEXT NOT NULL,
  total_points INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- カテゴリテーブル
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  sort_no INT NOT NULL DEFAULT 0
);

-- ミッションテーブル
CREATE TABLE missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  difficulty INT NOT NULL CHECK (difficulty BETWEEN 1 AND 5),
  points INT NOT NULL CHECK (points > 0),
  submission_type TEXT NOT NULL DEFAULT 'NONE' CHECK (submission_type IN ('TEXT', 'LINK', 'NONE')),
  max_achievement_count INT,
  category_slug TEXT NOT NULL REFERENCES categories(slug),
  is_hidden BOOL NOT NULL DEFAULT false
);

-- 達成記録テーブル
CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mission_id UUID NOT NULL REFERENCES missions(id),
  submission_text TEXT,
  points_earned INT NOT NULL,
  achieved_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ポイントをアトミックにインクリメントするRPC
CREATE OR REPLACE FUNCTION increment_user_points(uid UUID, delta INT)
RETURNS void LANGUAGE sql AS $$
  UPDATE users SET total_points = total_points + delta WHERE id = uid;
$$;

-- インデックス
CREATE INDEX idx_achievements_user_id ON achievements(user_id);
CREATE INDEX idx_achievements_mission_id ON achievements(mission_id);
CREATE INDEX idx_users_guild_id ON users(guild_id);
CREATE INDEX idx_users_total_points ON users(total_points DESC);

-- RLS有効化
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

-- missionsとcategoriesは全ユーザーが読み取り可能
CREATE POLICY "missions_public_read" ON missions FOR SELECT USING (true);
CREATE POLICY "categories_public_read" ON categories FOR SELECT USING (true);

-- usersは全ユーザーが読み取り可能（ランキング表示のため）
CREATE POLICY "users_public_read" ON users FOR SELECT USING (true);
-- usersの書き込みはService Role（バックエンド）のみ
CREATE POLICY "users_service_write" ON users FOR ALL USING (auth.role() = 'service_role');

-- achievementsの読み取りは全ユーザー可能、書き込みはService Roleのみ
CREATE POLICY "achievements_public_read" ON achievements FOR SELECT USING (true);
CREATE POLICY "achievements_service_write" ON achievements FOR ALL USING (auth.role() = 'service_role');
