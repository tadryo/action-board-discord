-- 事務局カテゴリの表示名を他部門（「企画部門を手伝おう」等）に合わせる
UPDATE categories SET title = '事務局を手伝おう' WHERE slug = 'dept-jimukyoku';
