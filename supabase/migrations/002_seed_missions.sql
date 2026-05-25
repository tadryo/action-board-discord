-- カテゴリデータ
INSERT INTO categories (slug, title, sort_no) VALUES
  ('learn-student-team', '学生チームについて知ろう', 100),
  ('join-discord',       'Discordコミュニティを活用しよう', 200),
  ('learn-with-quiz',    'クイズで学ぼう', 300),
  ('share-and-spread',   '発信・拡散しよう', 400),
  ('invite-friends',     '仲間を招待しよう', 500),
  ('join-events',        'イベントに参加しよう', 600),
  ('learn-policies',     '政策を学ぼう', 700),
  ('vote',               '投票しよう', 800)
ON CONFLICT (slug) DO NOTHING;

-- ミッションデータ
INSERT INTO missions (slug, title, description, difficulty, points, submission_type, max_achievement_count, category_slug, is_hidden) VALUES
  ('follow-x',           'チームみらい公式Xをフォローしよう', 'チームみらいの公式X（@team_mirai2025）をフォローして最新情報をチェック！', 1, 10,  'NONE', 1,    'learn-student-team', false),
  ('visit-official-site','公式サイトを確認しよう',             'チームみらいの公式サイトにアクセスして活動内容を確認しよう。',              1, 10,  'NONE', 1,    'learn-student-team', false),
  ('read-manifesto',     'マニフェストを読もう',               'チームみらいのマニフェストを読んで政策を理解しよう。',                      2, 20,  'NONE', 1,    'learn-student-team', false),
  ('watch-youtube',      'チームみらいのYouTubeを視聴しよう',  'チームみらいの公式YouTubeチャンネルで動画を1本視聴しよう。',                1, 15,  'NONE', 5,    'learn-student-team', false),

  ('introduce-yourself', '自己紹介チャンネルに投稿しよう',     'Discordの自己紹介チャンネルに投稿して仲間と繋がろう！',                    1, 20,  'NONE', 1,    'join-discord', false),
  ('join-voice-channel', 'ボイスチャンネルに参加しよう',        'Discordのボイスチャンネルに参加して活動を体験しよう。',                     1, 15,  'NONE', 3,    'join-discord', false),
  ('help-member',        '他のメンバーを助けよう',              '質問チャンネルなどで他のメンバーの質問に答えたりサポートしよう。',          2, 25,  'TEXT', NULL, 'join-discord', false),
  ('share-news',         '政治ニュースをシェアしよう',          'Discordの情報共有チャンネルに気になったニュースや記事を投稿しよう。',        2, 20,  'LINK', NULL, 'join-discord', false),

  ('quiz-anno-basic',    '安野たかひろクイズに挑戦しよう（基礎編）', '安野たかひろさんの経歴や活動を学ぶクイズに挑戦！',                   2, 30,  'NONE', 1,    'learn-with-quiz', false),
  ('quiz-policy-basic',  '政策クイズに挑戦しよう（基礎編）',   'チームみらいの政策についてのクイズで理解を深めよう。',                      2, 30,  'NONE', 1,    'learn-with-quiz', false),
  ('quiz-election-law',  '選挙法クイズに挑戦しよう',           '選挙に関する基本的な法律・ルールを学ぶクイズ。',                            3, 40,  'NONE', 1,    'learn-with-quiz', false),
  ('quiz-manifesto',     'マニフェストクイズに挑戦しよう',      'マニフェストの内容を深く理解するクイズ。',                                  3, 40,  'NONE', 1,    'learn-with-quiz', false),

  ('post-x',             'Xで応援投稿しよう',                  'チームみらいへの応援や活動内容をXに投稿しよう。#チームみらい を付けてね！',  2, 25,  'LINK', NULL, 'share-and-spread', false),
  ('repost-x',           'チームみらいの投稿をリポストしよう',  '公式Xの投稿をリポスト（RT）して拡散しよう！',                              1, 10,  'NONE', NULL, 'share-and-spread', false),
  ('post-instagram',     'Instagramで応援投稿しよう',           'チームみらいへの応援をInstagramに投稿しよう。',                            2, 25,  'LINK', NULL, 'share-and-spread', false),
  ('post-tiktok',        'TikTokで応援動画を投稿しよう',        'チームみらいへの応援動画をTikTokに投稿しよう！',                            4, 60,  'LINK', NULL, 'share-and-spread', false),
  ('create-original-content', 'オリジナルコンテンツを作って投稿しよう', 'オリジナルの画像・動画・記事などを作成して投稿しよう。',           4, 70,  'LINK', NULL, 'share-and-spread', false),

  ('invite-friend-discord',   '友達をDiscordに招待しよう',     '友達をチームみらい学生チームのDiscordサーバーに招待しよう。',              2, 40,  'TEXT', NULL, 'invite-friends', false),
  ('invite-friend-volunteer', '友達をボランティアに誘おう',     '友達を一緒にボランティア活動に誘って参加してもらおう。',                    3, 60,  'TEXT', NULL, 'invite-friends', false),

  ('join-online-event',       'オンラインイベントに参加しよう', 'チームみらいが開催するオンライン勉強会・説明会に参加しよう。',              2, 35,  'NONE', NULL, 'join-events', false),
  ('join-offline-event',      'オフラインイベントに参加しよう', 'チームみらいが開催するリアルイベント・街頭活動に参加しよう。',              3, 60,  'TEXT', NULL, 'join-events', false),
  ('join-mirai-kaigi',        'みらい会議に参加しよう',         'チームみらいが開催する政策議論イベント「みらい会議」に参加しよう。',         3, 50,  'NONE', NULL, 'join-events', false),
  ('volunteer-event-staff',   'イベントスタッフとして参加しよう','チームみらいのイベント運営をスタッフとしてサポートしよう。',               4, 80,  'TEXT', NULL, 'join-events', false),

  ('read-policy-education',   '教育政策を読んでみよう',         'チームみらいの教育分野の政策を読んで感想や気づきをメモしよう。',           2, 25,  'TEXT', 1,    'learn-policies', false),
  ('read-policy-digital',     'デジタル政策を読んでみよう',     'チームみらいのデジタル・AI分野の政策を読んで感想をまとめよう。',           2, 25,  'TEXT', 1,    'learn-policies', false),
  ('read-policy-economy',     '経済政策を読んでみよう',         'チームみらいの経済・財政分野の政策を読んで感想をまとめよう。',             2, 25,  'TEXT', 1,    'learn-policies', false),
  ('watch-gikai',             'みらい議会を視聴しよう',          'チームみらいの議会活動を動画で視聴しよう。',                              2, 20,  'NONE', NULL, 'learn-policies', false),

  ('vote-election',      '選挙で投票しよう',                    '実際の選挙で投票しよう！投票は最大の政治参加です。',                        3, 100, 'NONE', NULL, 'vote', false),
  ('vote-early',         '期日前投票をしよう',                  '期日前投票で一足先に投票しよう！当日忙しい人も安心。',                      3, 100, 'NONE', NULL, 'vote', false),
  ('encourage-vote',     '家族・友達に投票を呼びかけよう',      '周りの大切な人に投票を呼びかけて政治参加を広げよう。',                      2, 30,  'TEXT', NULL, 'vote', false)
ON CONFLICT (slug) DO NOTHING;
