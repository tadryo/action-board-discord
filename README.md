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
| アプリ（UI + API） | Next.js 14 (App Router) + React 18 + TypeScript |
| スタイリング | Tailwind CSS + shadcn/ui |
| データベース | Supabase (PostgreSQL) |
| ホスティング | Railway |
| モノレポ | npm workspaces |

UI（Server / Client Components）と API（Route Handlers）を **Next.js の単一アプリ（`apps/web`）** に集約しています。ブラウザから Supabase を直接叩くと Discord Activity の iframe（CSP）でブロックされるため、データ取得はすべて同一オリジンの API ルート経由です。

> **Note**: `apps/frontend`（Vite）と `apps/backend`（Express）は Next.js 移行前のレガシーです。本番は `apps/web` のみで動作します。

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`apps/web/.env.local` に以下を設定します。

```bash
# クライアント（ブラウザ）に公開される値
NEXT_PUBLIC_DISCORD_CLIENT_ID=...
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...

# サーバー専用（秘匿）
DISCORD_CLIENT_SECRET=...
SUPABASE_SERVICE_ROLE_KEY=...
```

### 3. Discord Developer Portal の設定

1. https://discord.com/developers/applications でアプリを作成
2. **「Activities」タブを有効化**
3. OAuth2 スコープ: `identify`, `guilds`
4. **URL Mappings**: `/` → アプリのホスト（ローカルは cloudflared の URL、本番は Railway フロントエンドの URL）
   - すべてのリクエスト（UI + `/api/*`）を Next.js が処理します

### 4. Supabase のセットアップ

1. [supabase.com](https://supabase.com) でプロジェクト作成
2. SQL Editor で `supabase/migrations/` 配下を番号順に実行（`001` → `005`）

### 5. ローカル開発

```bash
# Next.js アプリを起動（http://localhost:3000）
npm run dev:web

# Discord Activity 用トンネル（別ターミナル）
cloudflared tunnel --url http://localhost:3000
```

3. Developer Portal の URL Mapping (`/`) に cloudflared の URL を登録
4. Discord のボイスチャンネル or App Launcher から Activity を起動

## デプロイ（Railway）

`apps/web` を 1 サービスとしてデプロイします。

| 項目 | 値 |
|---|---|
| Build Command | `npm install && npm run build -w apps/web` |
| Start Command | `npm run start -w apps/web` |
| Watch Path | `/apps/web/**` |

環境変数はセットアップ手順 2 と同じものをサービスに設定してください。

## ユーティリティスクリプト

ミッションの登録・更新は単発スクリプトで行います（常駐サーバーは不要）。

```bash
# missions.yaml を Supabase に同期
npm run sync-missions -w apps/backend

# Discord のスラッシュコマンドを登録
npm run register-commands -w apps/backend
```

## プロジェクト構成

```
.
├── apps/
│   ├── web/               # Next.js 14（UI + API ルート）★本番
│   ├── frontend/          # （レガシー）React + Vite
│   └── backend/           # （レガシー）Express。スクリプトのみ利用
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
