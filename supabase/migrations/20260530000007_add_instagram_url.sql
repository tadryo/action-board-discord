-- プロフィールに Instagram リンクを追加する。
ALTER TABLE users ADD COLUMN IF NOT EXISTS instagram_url TEXT;
