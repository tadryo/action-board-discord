# チームみらい学生チーム アクションボード

チームみらいの学生チーム向けアクションボード。Discord Activity として Discord 内で完結するゲーミフィケーションプラットフォームです。

[チームみらいボランティア向けアクションボード](https://github.com/team-mirai-volunteer/action-board) を参考に、学生チーム用にカスタマイズしました。

## 機能

- **ミッションシステム**: 30以上のミッション（発信・学習・イベント参加・投票など）
- **ポイント・ランキング**: Discord サーバー内でのリーダーボード
- **達成履歴**: プロフィール画面で自分の活動を振り返り
- **Discord ネイティブ**: Discord Activity として動作し、別ログイン不要

## 技術スタック

| 領域 | 技術 |
|---|---|
| Discord 統合 | `@discord/embedded-app-sdk` |
| フロントエンド | React 18 + Vite + TypeScript + Tailwind CSS |
| バックエンド | Node.js + Express + TypeScript |
| データベース | Supabase (PostgreSQL) |
| モノレポ | npm workspaces |

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

```bash
cp .env.example apps/frontend/.env
cp .env.example apps/backend/.env
```

各 `.env` ファイルに値を入力してください（`.env.example` 参照）。

### 3. Discord Developer Portal の設定

1. https://discord.com/developers/applications でアプリを作成
2. **「Activities」タブを有効化**
3. OAuth2 スコープ: `identify`, `guilds`
4. リダイレクト URI: `https://127.0.0.1`

### 4. Supabase のセットアップ

1. [supabase.com](https://supabase.com) でプロジェクト作成
2. SQL Editor で `supabase/migrations/001_initial_schema.sql` を実行
3. 続けて `supabase/migrations/002_seed_missions.sql` を実行

### 5. ローカル開発

```bash
# フロントエンド・バックエンドを同時起動
npm run dev

# Discord Activity 用トンネル（別ターミナル）
cloudflared tunnel --url http://localhost:5173
```

6. Developer Portal の URL Mapping に cloudflared の URL を登録
7. Discord のボイスチャンネル or App Launcher から Activity を起動

## プロジェクト構成

```
.
├── apps/
│   ├── frontend/          # React + Vite + Discord SDK
│   └── backend/           # Express + Supabase
├── supabase/
│   └── migrations/        # DB スキーマ・シードデータ
├── mission_data/          # ミッション定義 (YAML)
└── .env.example
```

## ミッションカテゴリ

| カテゴリ | ミッション数 |
|---|---|
| 学生チームについて知ろう | 4 |
| Discord コミュニティを活用しよう | 4 |
| クイズで学ぼう | 4 |
| 発信・拡散しよう | 5 |
| 仲間を招待しよう | 2 |
| イベントに参加しよう | 4 |
| 政策を学ぼう | 4 |
| 投票しよう | 3 |
