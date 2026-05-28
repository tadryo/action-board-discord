# チームみらい学生チーム アクションボード

Discord 内で完結する、学生向けのゲーミフィケーション型アクションボード。
ミッションに挑戦してポイントを貯め、サーバー内のランキングで仲間と楽しみながら、政治をもっと身近にするためのプラットフォームです。

<p>
  <img alt="Next.js" src="https://img.shields.io/badge/Next.js-16-black?logo=nextdotjs">
  <img alt="React" src="https://img.shields.io/badge/React-19-20232a?logo=react&logoColor=61DAFB">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white">
  <img alt="Supabase" src="https://img.shields.io/badge/Supabase-PostgreSQL-3ecf8e?logo=supabase&logoColor=white">
  <img alt="Railway" src="https://img.shields.io/badge/Deploy-Railway-0b0d0e?logo=railway&logoColor=white">
</p>

> [チームみらいボランティア向けアクションボード](https://github.com/team-mirai-volunteer/action-board) のコンセプトを参考に、学生チーム向けに設計しています。

---

## 目次

- [特長](#特長)
- [技術スタック](#技術スタック)
- [アーキテクチャ](#アーキテクチャ)
- [クイックスタート](#クイックスタート)
- [環境変数](#環境変数)
- [ローカル開発](#ローカル開発)
- [デプロイ](#デプロイ)
- [ミッション管理](#ミッション管理)
- [データモデル](#データモデル)
- [API](#api)
- [認証フロー](#認証フロー)
- [ディレクトリ構成](#ディレクトリ構成)
- [開発ガイドライン](#開発ガイドライン)

---

## 特長

- **Discord ネイティブ** — Discord Activity として動作し、別アカウントやログインは不要。Discord のまま遊べます。
- **ミッション & ポイント** — 学び・発信・参加など多彩なミッション。達成するとポイントが貯まります。
- **サーバーランキング** — Discord サーバー（ギルド）ごとのリーダーボードで、仲間と競い合えます。
- **達成履歴** — プロフィールから自分の活動とポイントを振り返れます。
- **サクサク動作** — 全画面を起動時にプリロードし、タブ切り替えは瞬時。ミッション達成はリロードなしで即反映されます。

## 技術スタック

| 領域 | 技術 |
|---|---|
| Discord 統合 | `@discord/embedded-app-sdk` |
| アプリ（UI + API） | Next.js 16 (App Router) + React 19 + TypeScript |
| スタイリング | Tailwind CSS + shadcn/ui + framer-motion |
| アイコン | lucide-react |
| バリデーション | zod |
| データベース | Supabase (PostgreSQL + Row Level Security) |
| ホスティング | Railway |
| パッケージ管理 | npm workspaces |

UI（Server / Client Components）と API（Route Handlers）を **Next.js の単一アプリ（`apps/web`）** に集約しています。

## アーキテクチャ

本アプリは **Discord の iframe（Activity）内** で動作します。Discord のサンドボックスは外部ドメインへの通信を CSP でブロックするため、ブラウザから Supabase を直接呼び出すことはできません。そこで **データ取得・更新はすべて同一オリジンの Next.js API ルート経由** で行い、Supabase へはサーバー側からアクセスします。

```
┌─────────────────── Discord クライアント ───────────────────┐
│  Activity (iframe)                                          │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ Next.js (apps/web)                                     │ │
│  │  ├─ App Router (UI: Server / Client Components)        │ │
│  │  └─ Route Handlers (/api/*)  ── service role ──┐       │ │
│  └────────────────────────────────────────────────┼──────┘ │
└─────────────────────────────────────────────────── │ ──────┘
                                                      ▼
                                            Supabase (PostgreSQL + RLS)
```

## クイックスタート

> 前提: [Supabase](https://supabase.com) プロジェクト、[Discord アプリ（Activity 有効化）](https://discord.com/developers/applications)、[Railway](https://railway.app) アカウント。

### 1. 取得とインストール

```bash
git clone https://github.com/tadryo/action-board-discord.git
cd action-board-discord
npm install
```

### 2. 環境変数を用意

`apps/web/.env.local` を作成します（`.gitignore` 済み）。詳細は [環境変数](#環境変数) を参照。

```bash
cat > apps/web/.env.local <<'EOF'
NEXT_PUBLIC_DISCORD_CLIENT_ID=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
DISCORD_CLIENT_SECRET=
SUPABASE_SERVICE_ROLE_KEY=
EOF
```

### 3. Supabase を初期化

Supabase ダッシュボードの **SQL Editor** で `supabase/migrations/` 配下を番号順に実行します。

### 4. Discord アプリを設定

1. アプリを作成し、**Activities** を有効化
2. OAuth2 スコープ: `identify`, `guilds`
3. **URL Mappings**: `/` → アプリのホスト（ローカルは cloudflared の URL、本番は Railway の URL）
4. スラッシュコマンド（Activity 起動エントリ）を登録:
   ```bash
   npm run register-commands
   ```

### 5. ミッションを投入

```bash
npm run sync-missions
```

### 6. 起動

```bash
# ローカル開発（http://localhost:3000）
npm run dev:web

# 別ターミナル: Discord Activity 用トンネル
cloudflared tunnel --url http://localhost:3000
```

Discord のボイスチャンネルまたは App Launcher から Activity を起動します。
本番反映は `main` に push するだけ（[デプロイ](#デプロイ)）。

## 環境変数

### アプリ本体（Railway フロントエンドサービス）

アプリを動かすにはこの 5 つを設定します。

| 変数名 | 用途 |
|---|---|
| `NEXT_PUBLIC_DISCORD_CLIENT_ID` | Discord アプリの Client ID（ブラウザに公開） |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase プロジェクト URL（ブラウザに公開） |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon キー（ブラウザに公開） |
| `DISCORD_CLIENT_SECRET` | Discord OAuth コード交換用（サーバー専用・秘匿） |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role キー（サーバー専用・秘匿） |

> `PORT` は Railway が自動注入するため設定不要です。
> 本番は Railway サービスの **Variables** に設定し、ローカルは `apps/web/.env.local` に記述します。

### 運用スクリプト実行時（最小限）

スクリプトはアプリ本体の全変数を必要としません。

| スクリプト | 必要な変数 |
|---|---|
| `sync-missions` | `NEXT_PUBLIC_SUPABASE_URL`（または `SUPABASE_URL`）, `SUPABASE_SERVICE_ROLE_KEY` |
| `register-commands` | `NEXT_PUBLIC_DISCORD_CLIENT_ID`（または `DISCORD_CLIENT_ID`）, `DISCORD_BOT_TOKEN` |

> [Railway CLI](https://docs.railway.app/develop/cli) があれば `railway run npm run sync-missions` でサービスの env を注入でき、ローカルに書かずに実行できます。
> `SUPABASE_SERVICE_ROLE_KEY` は RLS をバイパスする強力な鍵です。共有・コミットしないよう注意してください。

## ローカル開発

```bash
npm run dev:web          # 開発サーバー（http://localhost:3000）
cloudflared tunnel --url http://localhost:3000   # 別ターミナル
```

| コマンド | 内容 |
|---|---|
| `npm run dev:web` | 開発サーバー起動 |
| `npm run build` | 本番ビルド |
| `npm run typecheck` | 型チェック（`tsc --noEmit`） |
| `npm run lint` | ESLint |
| `npm run sync-missions` | ミッションを Supabase に同期 |
| `npm run register-commands` | Discord スラッシュコマンド登録 |

## デプロイ

`apps/web` を 1 サービスとして Railway にデプロイします。`main` への push で自動ビルド・デプロイされます。

| 項目 | 値 |
|---|---|
| Build Command | `npm install && npm run build -w apps/web` |
| Start Command | `npm run start -w apps/web` |
| Watch Path | `/apps/web/**` |

環境変数は [アプリ本体](#アプリ本体railway-フロントエンドサービス) の 5 つをサービスの **Variables** に設定します。

## ミッション管理

ミッション定義は `mission_data/`（`missions.yaml` / `categories.yaml`）で管理します。

### 追加・更新

```bash
# 1) mission_data/*.yaml を編集
# 2) Supabase に同期（slug で upsert）
npm run sync-missions
```

`sync-missions` はカテゴリとミッションを `slug` で upsert します。ミッションの `category_slug` が `categories.yaml` に無い場合はエラーで停止します（不整合防止）。

### 総入れ替え / リセット

カテゴリ構成を変えた場合などは、古い行を消してから入れ直します。**Supabase → SQL Editor** で実行:

```sql
-- 達成記録・ミッション・カテゴリを削除し、全員のポイントを 0 に
DELETE FROM achievements;
DELETE FROM missions;
DELETE FROM categories;
UPDATE users SET total_points = 0;
```

その後 `npm run sync-missions` で再投入します。完了状態だけ戻すなら `DELETE FROM achievements;` と `UPDATE users SET total_points = 0;` の 2 行で十分です。

> `mission_data/` はミッション内容を非公開にするため `.gitignore` 済みで、リポジトリには含まれません（ローカル管理）。

## データモデル

`supabase/migrations/` で管理。主なテーブルは以下のとおりです。

| テーブル | 役割 | 主なカラム |
|---|---|---|
| `users` | Discord ユーザー | `discord_user_id`, `username`, `avatar`, `guild_id`, `total_points` |
| `categories` | ミッションカテゴリ | `slug`, `title`, `sort_no` |
| `missions` | ミッション定義 | `slug`, `title`, `difficulty`, `points`, `submission_type`, `max_achievement_count`, `category_slug`, `is_hidden`, `icon_url`, `is_featured` |
| `achievements` | 達成記録 | `user_id`, `mission_id`, `submission_text`, `points_earned`, `achieved_at` |

- **RLS**: `missions` / `categories` / `users` / `achievements` は全ユーザー読み取り可。書き込みは service role（API ルート）のみ。
- **RPC**: `record_achievement(...)` が達成記録とポイント加算をアトミックに実行し、達成回数の上限もサーバー側で判定します。

## API

すべて `apps/web/src/app/api/` の Route Handler です。

| メソッド・パス | 役割 | 認証 |
|---|---|---|
| `POST /api/token` | Discord OAuth コードをアクセストークンに交換 | — |
| `POST /api/me` | Discord トークンを検証し、ユーザーを登録・更新 | Bearer |
| `GET /api/missions` | 公開ミッション + カテゴリを取得 | — |
| `GET /api/achievements?user_id=` | 指定ユーザーの達成履歴を取得 | — |
| `POST /api/achievements` | ミッション達成を記録 | Bearer |
| `GET /api/leaderboard/[guildId]` | ギルドのランキング（上位 50 件） | — |

## 認証フロー

```
[Activity 起動]
   │
   ▼
Discord SDK: ready() → authorize()            … OAuth コード取得
   │
   ▼
POST /api/token  (code → access_token)         … サーバーで秘密鍵を使い交換
   │
   ▼
Discord SDK: authenticate(access_token)
   │
   ▼
POST /api/me  (Bearer access_token)            … users テーブルに upsert
   │
   ▼
[ミッション / ランキング / プロフィール表示]
```

認証状態は `discord-provider.tsx`（React Context）で管理しています。

## ディレクトリ構成

```
.
├── apps/
│   └── web/                       # Next.js（UI + API + 運用スクリプト）
│       ├── src/
│       │   ├── app/
│       │   │   ├── api/           # Route Handlers（token / me / missions / achievements / leaderboard）
│       │   │   ├── layout.tsx
│       │   │   └── page.tsx
│       │   ├── components/        # 画面・UI コンポーネント（shadcn/ui を含む）
│       │   ├── features/          # ミッション関連の機能コンポーネント
│       │   ├── lib/               # supabase / discord-sdk / utils
│       │   └── types/             # DB 型定義
│       └── scripts/               # sync-missions / register-commands
├── supabase/
│   └── migrations/                # DB スキーマ・RPC
├── mission_data/                  # ミッション定義（非公開: .gitignore 済み / ローカル管理）
└── README.md
```

## 開発ガイドライン

- **ブランチ戦略**: `main` を常にデプロイ可能な状態に保ち、機能開発は `feat/*` ブランチで行います。
- **DB 変更**: スキーマ変更は `supabase/migrations/` に新しい連番ファイルを追加して適用し、型定義（`apps/web/src/types/database.ts`）も併せて更新します。
- **コミット前**: `npm run typecheck` と `npm run lint` の通過を確認します。
- **依存更新**: Dependabot の対象は `apps/web` です。破壊的なメジャー更新は内容を確認のうえ取り込みます。
