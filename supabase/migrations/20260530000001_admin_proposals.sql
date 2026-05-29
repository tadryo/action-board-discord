-- 部門マスタ（事務局・企画・広報・政策立案・デザイン）
CREATE TABLE departments (
  slug TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  sort_no INT NOT NULL DEFAULT 0
);

INSERT INTO departments (slug, name, sort_no) VALUES
  ('jimukyoku', '事務局', 1),
  ('kikaku', '企画部門', 2),
  ('koho', '広報部門', 3),
  ('seisaku', '政策立案部門', 4),
  ('design', 'デザイン部門', 5);

-- 既存のカテゴリに部門を紐付け（dept-* カテゴリのみ）
ALTER TABLE categories ADD COLUMN department TEXT REFERENCES departments(slug);
UPDATE categories SET department = 'kikaku'  WHERE slug = 'dept-kikaku';
UPDATE categories SET department = 'koho'    WHERE slug = 'dept-koho';
UPDATE categories SET department = 'seisaku' WHERE slug = 'dept-seisaku';
UPDATE categories SET department = 'design'  WHERE slug = 'dept-design';

-- 事務局カテゴリを追加
INSERT INTO categories (slug, title, sort_no, group_key, department)
VALUES ('dept-jimukyoku', '事務局', 100, 'dept', 'jimukyoku')
ON CONFLICT (slug) DO NOTHING;

-- 管理者（権限）テーブル。Discord IDで管理し、Supabaseログインは使わない。
-- scope: developer=全情報, super=代表/副代表（全権）, dept=部門長/副部門長（自部門のみ）
CREATE TABLE admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discord_user_id TEXT UNIQUE NOT NULL,
  username TEXT,
  title TEXT NOT NULL,
  scope TEXT NOT NULL CHECK (scope IN ('developer', 'super', 'dept')),
  department TEXT REFERENCES departments(slug),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT dept_scope_requires_department
    CHECK (scope <> 'dept' OR department IS NOT NULL)
);

-- ミッション提案テーブル（チームタスクの提案→部門長承認のワークフロー）
-- review_reason（却下理由等）は非公開だが、開示請求に備えて保持し物理削除しない。
CREATE TABLE mission_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  difficulty INT NOT NULL CHECK (difficulty BETWEEN 1 AND 5),
  points INT NOT NULL CHECK (points > 0),
  submission_type TEXT NOT NULL DEFAULT 'NONE' CHECK (submission_type IN ('TEXT', 'LINK', 'NONE')),
  department TEXT NOT NULL REFERENCES departments(slug),
  proposed_by_discord_id TEXT NOT NULL,
  proposed_by_username TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  review_reason TEXT,
  reviewed_by_discord_id TEXT,
  reviewed_at TIMESTAMPTZ,
  approved_mission_slug TEXT REFERENCES missions(slug),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_proposals_department ON mission_proposals(department);
CREATE INDEX idx_proposals_status ON mission_proposals(status);
CREATE INDEX idx_proposals_created_at ON mission_proposals(created_at DESC);

-- RLS有効化
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE mission_proposals ENABLE ROW LEVEL SECURITY;

-- departments は全ユーザー読み取り可能、書き込みはService Roleのみ
CREATE POLICY "departments_public_read" ON departments FOR SELECT USING (true);
CREATE POLICY "departments_service_write" ON departments FOR ALL USING (auth.role() = 'service_role');

-- admins は機密情報。読み書きともService Roleのみ（APIで権限判定する）
CREATE POLICY "admins_service_all" ON admins FOR ALL USING (auth.role() = 'service_role');

-- mission_proposals の読み書きはService Roleのみ。
-- メンバーへの公開（review_reasonを除く）はAPI経由で列を限定して返す。
CREATE POLICY "proposals_service_all" ON mission_proposals FOR ALL USING (auth.role() = 'service_role');
