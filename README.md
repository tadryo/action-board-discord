# Discord アクションボード

**Action Board for Discord** — Discord 内で完結する、コミュニティ向けのゲーミフィケーション型アクションボード。
メンバーがミッションに挑戦してポイントを貯め、サーバー内のランキングで楽しみながら、コミュニティの活動とエンゲージメントを高めます。

<p>
  <img alt="Next.js" src="https://img.shields.io/badge/Next.js-15-black?logo=nextdotjs">
  <img alt="React" src="https://img.shields.io/badge/React-19-20232a?logo=react&logoColor=61DAFB">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white">
  <img alt="Supabase" src="https://img.shields.io/badge/Supabase-PostgreSQL-3ecf8e?logo=supabase&logoColor=white">
  <img alt="Railway" src="https://img.shields.io/badge/Deploy-Railway-0b0d0e?logo=railway&logoColor=white">
</p>

Discord サーバーを持つ**あらゆるコミュニティ**で使えます — ファンコミュニティ、サークル、社内チーム、ボランティア団体、学習グループなど。ミッションは自由に定義でき、コミュニティの目的に合わせてカスタマイズできます。

> [team-mirai-volunteer/action-board](https://github.com/team-mirai-volunteer/action-board) のコンセプトを参考に、Discord Activity 向けに再設計した汎用版です。

---

## 目次

- [クイックスタート](#クイックスタート)
  - [とりあえず動かす（デプロイのみ）](#とりあえず動かすデプロイのみ)
  - [2次開発のためのローカル環境構築](#2次開発のためのローカル環境構築)
- [特長](#特長)
- [技術スタック](#技術スタック)
- [アーキテクチャ](#アーキテクチャ)
- [環境変数](#環境変数)
- [ミッション管理](#ミッション管理)
- [カスタマイズ（ブランディング）](#カスタマイズブランディング)
- [デプロイ](#デプロイ)
- [データモデル](#データモデル)
- [API](#api)
- [認証フロー](#認証フロー)
- [ディレクトリ構成](#ディレクトリ構成)
- [開発ガイドライン](#開発ガイドライン)

---

## クイックスタート

### とりあえず動かす（デプロイのみ）

**コードを書かずに自分のコミュニティで動かすための最小手順**です。必要なもの:

- [Supabase](https://supabase.com) プロジェクト
- [Discord アプリ](https://discord.com/developers/applications)（Activity 有効化済み）
- [Railway](https://railway.app) アカウント

#### 1. Supabase — DB を初期化

[Supabase CLI](https://supabase.com/docs/guides/cli) がインストール済みであれば、コマンド一発で完了します:

```bash
supabase link   # 初回のみ（Project ID を入力）
supabase db push
```

CLI を使わない場合は、Supabase ダッシュボードの **SQL Editor** で `supabase/migrations/` 配下のファイルを番号順に手動実行してください。

#### 2. Discord — アプリを設定

1. [Discord Developer Portal](https://discord.com/developers/applications) でアプリを作成し **Activities** を有効化
2. **OAuth2 スコープ**: `identify`, `guilds`, `guilds.members.read`
3. **OAuth2 リダイレクト URI**: 以下を追加（デフォルトは localhost しか入っていないため要追加）
   - `https://your-app.up.railway.app`（Railway デプロイ後の URL）
   - `http://localhost:3000`（ローカル開発用）
4. **URL Mappings**: `/` → Railway デプロイ後の URL（デプロイ後に設定）
5. サーバーへの導入: Installation の Install Link（スコープに `applications.commands` を含める）

#### 3. Railway — デプロイ

1. このリポジトリを Railway に接続
2. **Variables** に以下の5つを設定:

| 変数名 | 取得元 |
|---|---|
| `NEXT_PUBLIC_DISCORD_CLIENT_ID` | Discord Developer Portal → アプリ → General Information |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 〃 |
| `DISCORD_CLIENT_SECRET` | Discord Developer Portal → OAuth2 |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API |

3. Build / Start コマンドを設定（[デプロイ](#デプロイ) 参照）
4. デプロイが完了したら、Railway の URL を Discord の **URL Mappings** に設定

#### 4. スラッシュコマンドを登録

Railway の Variables に `DISCORD_BOT_TOKEN` を一時的に追加し、Railway のコンソールまたはローカルから実行:

```bash
npm run register-commands
```

登録後は `DISCORD_BOT_TOKEN` を Variables から削除して構いません。

#### 5. ミッションを投入

ローカルに `mission_data/categories.yaml` と `mission_data/missions.yaml` を作成し（[ミッション管理](#ミッション管理) 参照）、Supabase に同期:

```bash
npm run sync-missions
```

以上でアプリが動作します。Discord のボイスチャンネルまたは App Launcher から Activity を起動してください。

---

### 2次開発のためのローカル環境構築

**コードを改変・拡張したい場合**のフルセットアップです。

#### 前提

- Node.js 20 以上
- [cloudflared](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/)（Discord Activity のローカルデバッグ用トンネル）

#### 1. リポジトリを取得

```bash
git clone https://github.com/tadryo/action-board-discord.git
cd action-board-discord
npm install
```

#### 2. 環境変数を設定

`apps/web/.env.local` を作成します（`.gitignore` 済みで git に入りません）:

```bash
cat > apps/web/.env.local <<'EOF'
NEXT_PUBLIC_DISCORD_CLIENT_ID=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
DISCORD_CLIENT_SECRET=
SUPABASE_SERVICE_ROLE_KEY=
# スクリプト実行時のみ必要
DISCORD_BOT_TOKEN=
EOF
```

各値の取得先は[環境変数](#環境変数)を参照してください。

#### 3. Discord URL Mappings をローカル向けに設定

cloudflared でトンネルを張り、その URL を Discord Developer Portal の **URL Mappings** と **OAuth2 リダイレクト URI** に登録します:

```bash
cloudflared tunnel --url http://localhost:3000
# → https://xxxx.trycloudflare.com が払い出される
```

払い出された URL を Discord Developer Portal で設定:
- **OAuth2 → リダイレクト URI**: `https://xxxx.trycloudflare.com` を追加
- **アクティビティ → URL Mappings**: `/` → `https://xxxx.trycloudflare.com`

#### 4. 開発サーバーを起動

```bash
npm run dev:web          # http://localhost:3000
# 別ターミナルで cloudflared を起動したまま
```

Discord のボイスチャンネルから Activity を起動すると、ローカルの開発サーバーが表示されます。

#### 主要コマンド

| コマンド | 内容 |
|---|---|
| `npm run dev:web` | 開発サーバー起動 |
| `npm run build` | 本番ビルド |
| `npm run typecheck` | 型チェック（`tsc --noEmit`） |
| `npm run lint` | ESLint |
| `npm run sync-missions` | ミッションを Supabase に同期 |
| `npm run sync-app-settings` | アプリ設定を Supabase に同期 |
| `npm run register-commands` | Discord スラッシュコマンド登録 |

---

## 特長

- **Discord ネイティブ** — Discord Activity として動作し、別アカウントやログインは不要。Discord のまま使えます。
- **自由なミッション設計** — 学び・発信・参加・貢献など、コミュニティに合わせたミッションを YAML で自由に定義できます。
- **ポイント & サーバーランキング** — ミッション達成でポイントが貯まり、Discord サーバー（ギルド）ごとのリーダーボードで競い合えます。
- **達成履歴** — プロフィールから自分の活動とポイントを振り返れます。
- **サクサク動作** — 全画面を起動時にプリロードし、タブ切り替えは瞬時。ミッション達成はリロードなしで即反映されます。

## 技術スタック

| 領域 | 技術 |
|---|---|
| Discord 統合 | `@discord/embedded-app-sdk` |
| アプリ（UI + API） | Next.js 15 (App Router) + React 19 + TypeScript |
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
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Next.js (apps/web)                                    │  │
│  │  ├─ App Router (UI: Server / Client Components)       │  │
│  │  └─ Route Handlers (/api/*)  ── service role ──┐      │  │
│  └───────────────────────────────────────────────┼──────┘  │
└──────────────────────────────────────────────────│─────────┘
                                                   ▼
                                         Supabase (PostgreSQL + RLS)
```

## 環境変数

### どこに何を置くか

| 変数名 | Railway（本番） | `.env.local`（ローカル） | 用途 |
|---|---|---|---|
| `NEXT_PUBLIC_DISCORD_CLIENT_ID` | **必須** | ローカルで動かすなら必要 | Discord Client ID |
| `NEXT_PUBLIC_SUPABASE_URL` | **必須** | 〃 | Supabase URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **必須** | 〃 | Supabase anon キー |
| `DISCORD_CLIENT_SECRET` | **必須** | 〃 | OAuth 交換用（秘匿） |
| `SUPABASE_SERVICE_ROLE_KEY` | **必須** | 〃 / スクリプト用 | service role（秘匿） |
| `DISCORD_BOT_TOKEN` | **不要** | スクリプト用 | `register-commands` 専用 |

- `PORT` は Railway が自動注入するため設定不要です。
- `DISCORD_BOT_TOKEN` は本番アプリでは使いません。スラッシュコマンド登録スクリプト専用です。
- アプリ名・キャッチコピーなどのブランディングは環境変数ではなく **Supabase の `app_settings` テーブル** で管理します（[カスタマイズ](#カスタマイズブランディング) 参照）。

### スクリプトに必要な最小限

| スクリプト | 必要な変数 |
|---|---|
| `sync-missions` | `NEXT_PUBLIC_SUPABASE_URL`（または `SUPABASE_URL`）, `SUPABASE_SERVICE_ROLE_KEY` |
| `sync-app-settings` | 同上 |
| `register-commands` | `NEXT_PUBLIC_DISCORD_CLIENT_ID`（または `DISCORD_CLIENT_ID`）, `DISCORD_BOT_TOKEN` |

> [Railway CLI](https://docs.railway.app/develop/cli) があれば `railway run npm run sync-missions` で Railway の env を注入でき、`.env.local` なしで実行できます。

## ミッション管理

ミッションとカテゴリは `mission_data/` の YAML で管理します。**このディレクトリは `.gitignore` 済みで git 管理外**です。各コミュニティが独自の内容を用意してください。

### ファイル形式

`mission_data/categories.yaml`:

```yaml
categories:
  - slug: start          # 一意なID（英数字）
    title: はじめの一歩  # 画面に表示される名前
    sort_no: 100         # 表示順（昇順）
    group_key: general   # general（通常） or dept（チームタスク）
```

`mission_data/missions.yaml`:

```yaml
missions:
  - slug: welcome
    title: ようこそ！自己紹介しよう
    description: 自己紹介チャンネルに投稿しよう。
    difficulty: 1                 # 1〜5（⭐の数）
    points: 10
    submission_type: NONE         # NONE / TEXT / LINK
    max_achievement_count: 1      # 達成上限（null で無制限）
    category_slug: start
    is_hidden: false
```

### 反映

```bash
# 編集後、Supabase に同期（slug で upsert）
npm run sync-missions
```

### 総入れ替え / リセット

**Supabase → SQL Editor** で実行してからミッションを再投入します:

```sql
-- 達成記録・ミッション・カテゴリを削除し、全員のポイントを 0 に
DELETE FROM achievements;
DELETE FROM missions;
DELETE FROM categories;
UPDATE users SET total_points = 0;
```

## カスタマイズ（ブランディング）

ブランディング設定は **Supabase の `app_settings` テーブル**で管理します。コードを変更せず、再デプロイも不要で変更できます。

### app_settings テーブルの主なキー

| key | 既定値 | 説明 |
|---|---|---|
| `app_name` | `アクションボード` | アプリ名（タイトル・ヘッダー） |
| `app_tagline` | `アクションでポイントを貯めよう。` | トップのキャッチコピー |
| `group_label_general` | `みんなでやろう` | 通常ミッションのタブ名 |
| `group_label_dept` | `チームタスク` | チームタスクのタブ名 |

### 一括反映スクリプト

`config/app_settings.yaml` を編集して実行すると Supabase に反映されます:

```bash
npm run sync-app-settings
```

### その他のカスタマイズ

| 変更したいもの | 方法 |
|---|---|
| カラーテーマ | `apps/web/src/app/globals.css`（CSS 変数 `--primary` ほか） |
| カテゴリの絵文字 | `apps/web/src/components/mission-card.tsx`（`CATEGORY_EMOJI`） |
| ミッション内容 | `mission_data/*.yaml`（[ミッション管理](#ミッション管理)） |

## デプロイ

`apps/web` を 1 サービスとして Railway にデプロイします。`main` への push で自動ビルド・デプロイされます。

| 項目 | 値 |
|---|---|
| Build Command | `npm ci && npm run build -w apps/web` |
| Start Command | `npm run start -w apps/web` |
| Watch Path | `/apps/web/**` |

## データモデル

`supabase/migrations/` で管理。主なテーブル:

| テーブル | 役割 | 主なカラム |
|---|---|---|
| `users` | Discord ユーザー | `discord_user_id`, `username`, `avatar`, `guild_id`, `total_points` |
| `categories` | ミッションカテゴリ | `slug`, `title`, `sort_no`, `group_key` |
| `missions` | ミッション定義 | `slug`, `title`, `difficulty`, `points`, `submission_type`, `max_achievement_count`, `category_slug`, `is_hidden` |
| `achievements` | 達成記録 | `user_id`, `mission_id`, `submission_text`, `points_earned`, `achieved_at` |
| `app_settings` | アプリ設定 | `key`, `value` |

- **RLS**: 全テーブルで有効。読み取りは全ユーザー可、書き込みは service role（API ルート）のみ。
- **RPC**: `record_achievement(...)` が達成記録とポイント加算をアトミックに実行し、達成上限もサーバー側で判定。

## API

すべて `apps/web/src/app/api/` の Route Handler です。

| メソッド・パス | 役割 | 認証 |
|---|---|---|
| `POST /api/token` | Discord OAuth コードをアクセストークンに交換 | — |
| `POST /api/me` | Discord トークンを検証し、ユーザーを登録・更新 | Bearer |
| `GET /api/missions` | 公開ミッション + カテゴリ + 全体達成数を取得 | — |
| `GET /api/achievements?user_id=` | 指定ユーザーの達成履歴を取得 | — |
| `POST /api/achievements` | ミッション達成を記録 | Bearer |
| `GET /api/leaderboard/[guildId]` | ギルドのランキング（上位 50 件） | — |
| `GET /api/app-settings` | アプリ設定（名前・キャッチコピー等）を取得 | — |

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
│       │   │   ├── api/           # Route Handlers
│       │   │   ├── layout.tsx
│       │   │   └── page.tsx
│       │   ├── components/        # 画面・UI コンポーネント
│       │   ├── features/          # ミッション関連の機能コンポーネント
│       │   ├── lib/               # supabase / discord-sdk / utils
│       │   └── types/             # DB 型定義
│       └── scripts/               # sync-missions / sync-app-settings / register-commands
├── config/
│   └── app_settings.yaml          # ブランディング設定（sync-app-settings で Supabase に反映）
├── supabase/
│   └── migrations/                # DB スキーマ・RPC
├── mission_data/                  # ミッション定義（.gitignore 済み / ローカル管理）
└── README.md
```

## 開発ガイドライン

- **ブランチ戦略**: `main` を常にデプロイ可能な状態に保ち、機能開発は `feat/*` ブランチで行います。
- **DB 変更**: スキーマ変更は `supabase/migrations/` に新しいタイムスタンプ付きファイルを追加し、型定義（`apps/web/src/types/database.ts`）も併せて更新します。
- **コミット前**: `npm run typecheck` と `npm run lint` の通過を確認します。
- **依存更新**: Dependabot の対象は `apps/web` です。破壊的なメジャー更新は内容を確認のうえ取り込みます。
