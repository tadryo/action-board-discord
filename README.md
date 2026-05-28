# チームみらい学生チーム アクションボード

チームみらいの学生チーム向けアクションボード。**Discord Activity** として Discord 内で完結する、ゲーミフィケーション型のアクション促進プラットフォームです。ミッションに挑戦してポイントを貯め、サーバー内のランキングで仲間と競い合えます。

[チームみらいボランティア向けアクションボード](https://github.com/team-mirai-volunteer/action-board) を参考に、学生チーム用にカスタマイズしました。

> 🚀 手早く始めたい / ミッションを更新したい方は **[QUICKSTART.md](./QUICKSTART.md)** へ。

---

## 目次

- [機能](#機能)
- [アーキテクチャ](#アーキテクチャ)
- [技術スタック](#技術スタック)
- [データモデル](#データモデル)
- [API ルート](#api-ルート)
- [認証フロー](#認証フロー)
- [セットアップ](#セットアップ)
- [ローカル開発](#ローカル開発)
- [デプロイ（Railway）](#デプロイrailway)
- [運用スクリプト](#運用スクリプト)
- [ミッションの追加・更新](#ミッションの追加更新)
- [プロジェクト構成](#プロジェクト構成)
- [ミッションカテゴリ](#ミッションカテゴリ)
- [開発ガイドライン](#開発ガイドライン)

---

## 機能

- **ミッションシステム**: 8 カテゴリ・30 以上のミッション（発信・学習・イベント参加・投票など）。難易度とポイントが設定され、達成回数の上限を持つミッションもあります
- **ポイント・ランキング**: Discord サーバー（ギルド）ごとのリーダーボードを表示。上位はメダル表示
- **達成履歴**: プロフィール画面で自分の達成記録とポイントを振り返り
- **楽観的 UI**: ミッション達成時はリロードせず、その場で即座に状態が更新されます
- **Discord ネイティブ**: Discord Activity として動作し、別途ログイン不要。Discord アカウントでそのまま利用できます

## アーキテクチャ

本アプリは **Discord の iframe（Activity）内** で動作します。Discord のサンドボックスは外部ドメインへの通信を CSP でブロックするため、ブラウザから Supabase を直接呼び出すことはできません。そのため **データ取得・更新はすべて同一オリジンの Next.js API ルート経由** で行います。

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

UI と API を **Next.js の単一アプリ（`apps/web`）** に集約しています（旧構成の Vite フロントエンド + Express バックエンドから移行済み）。

## 技術スタック

| 領域 | 技術 |
|---|---|
| Discord 統合 | `@discord/embedded-app-sdk` |
| アプリ（UI + API） | Next.js 14 (App Router) + React 18 + TypeScript |
| スタイリング | Tailwind CSS + shadcn/ui + framer-motion |
| アイコン | lucide-react |
| バリデーション | zod |
| データベース | Supabase (PostgreSQL + Row Level Security) |
| ホスティング | Railway |
| モノレポ | npm workspaces |

> **Note**: React 18 に固定しています。shadcn/ui・lucide-react が React 19 で型エラーを出すため、安定性を優先して Next.js 14 系を採用しています。

## データモデル

`supabase/migrations/` で管理。主なテーブルは以下のとおりです。

| テーブル | 役割 | 主なカラム |
|---|---|---|
| `users` | Discord ユーザー | `discord_user_id`, `username`, `avatar`, `guild_id`, `total_points` |
| `categories` | ミッションカテゴリ | `slug`, `title`, `sort_no` |
| `missions` | ミッション定義 | `slug`, `title`, `difficulty`, `points`, `submission_type`, `max_achievement_count`, `category_slug`, `is_hidden`, `icon_url`, `is_featured` |
| `achievements` | 達成記録 | `user_id`, `mission_id`, `submission_text`, `points_earned`, `achieved_at` |

**RLS（Row Level Security）**: `missions` / `categories` / `users` / `achievements` は全ユーザー読み取り可。書き込みは service role（API ルート）のみに制限しています。

**RPC（関数）**:
- `record_achievement(...)` — 達成の記録とポイント加算をアトミックに実行（達成回数上限・重複をサーバー側で判定）
- `increment_user_points(uid, delta)` — ポイントの加算

| マイグレーション | 内容 |
|---|---|
| `001_initial_schema.sql` | テーブル・RLS・インデックス |
| `002_seed_missions.sql` | 初期ミッションのシード |
| `003_atomic_achievement.sql` | `record_achievement` RPC |
| `004_fix_achievement_lock.sql` | 達成記録のロック修正 |
| `005_missions_add_icon_featured.sql` | `icon_url` / `is_featured` カラム追加 |

## API ルート

すべて `apps/web/src/app/api/` 配下の Route Handler です。

| メソッド・パス | 役割 | 認証 |
|---|---|---|
| `POST /api/token` | Discord OAuth コードをアクセストークンに交換 | — |
| `POST /api/me` | Discord トークンを検証し、ユーザーを登録・更新 | Bearer |
| `GET /api/missions` | 公開ミッション + カテゴリを取得 | — |
| `GET /api/achievements?user_id=` | 指定ユーザーの達成履歴を取得 | — |
| `POST /api/achievements` | ミッション達成を記録（`record_achievement`） | Bearer |
| `GET /api/leaderboard/[guildId]` | ギルドのランキング（上位 50 件） | — |

## 認証フロー

```
[Activity 起動]
   │
   ▼
Discord SDK: ready() → authorize()           … OAuth コード取得
   │
   ▼
POST /api/token  (code → access_token)        … サーバーで秘密鍵を使い交換
   │
   ▼
Discord SDK: authenticate(access_token)
   │
   ▼
POST /api/me  (Bearer access_token)           … users テーブルに upsert
   │
   ▼
[ミッション / ランキング / プロフィール表示]
```

クライアントの認証状態は `discord-provider.tsx`（React Context）で管理しています。

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数

#### アプリ本体（Railway フロントエンドサービス）

アプリを動かすにはこの 5 つを設定します。

| 変数名 | 用途 |
|---|---|
| `NEXT_PUBLIC_DISCORD_CLIENT_ID` | Discord アプリの Client ID（ブラウザに公開） |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase プロジェクト URL（ブラウザに公開） |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon キー（ブラウザに公開） |
| `DISCORD_CLIENT_SECRET` | Discord OAuth コード交換用（サーバー専用・秘匿） |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role キー（サーバー専用・秘匿） |

> `PORT` は Railway が自動で注入するため設定不要です。

- **本番（Railway）**: フロントエンドサービスの **Variables** に上記を設定します。環境変数ファイルは使いません。
- **ローカル開発**: `apps/web/.env.local` を作成して記述します（`.gitignore` 済み・初期状態では存在しません）。

```bash
# 例: ローカル開発用に apps/web/.env.local を作成
cat > apps/web/.env.local <<'EOF'
NEXT_PUBLIC_DISCORD_CLIENT_ID=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
DISCORD_CLIENT_SECRET=
SUPABASE_SERVICE_ROLE_KEY=
EOF
```

#### 運用スクリプト実行時に必要な変数（最小限）

スクリプトはアプリ本体の全変数を必要としません。

| スクリプト | 必要な変数 |
|---|---|
| `sync-missions` | `NEXT_PUBLIC_SUPABASE_URL`（または `SUPABASE_URL`）, `SUPABASE_SERVICE_ROLE_KEY` |
| `register-commands` | `NEXT_PUBLIC_DISCORD_CLIENT_ID`（または `DISCORD_CLIENT_ID`）, `DISCORD_BOT_TOKEN` |

Railway を使っている場合、これらの値はすでにサービスの Variables に入っています。ローカルで実行するときは `apps/web/.env.local` に該当する変数だけ書けば十分です（[Railway CLI](https://docs.railway.app/develop/cli) があれば `railway run npm run sync-missions` で env を注入でき、ローカルに書かずに済みます）。

### 3. Discord Developer Portal の設定

1. https://discord.com/developers/applications でアプリを作成
2. **「Activities」タブを有効化**
3. OAuth2 スコープ: `identify`, `guilds`
4. **URL Mappings**: `/` → アプリのホスト（ローカルは cloudflared の URL、本番は Railway フロントエンドの URL）
   - すべてのリクエスト（UI + `/api/*`）を Next.js が処理します
5. スラッシュコマンドの登録は [運用スクリプト](#運用スクリプト) を参照

### 4. Supabase のセットアップ

1. [supabase.com](https://supabase.com) でプロジェクト作成
2. SQL Editor で `supabase/migrations/` 配下を番号順に実行（`001` → `005`）
3. `npm run sync-missions` でミッション・カテゴリを投入（[運用スクリプト](#運用スクリプト)）

## ローカル開発

```bash
# Next.js アプリを起動（http://localhost:3000）
npm run dev:web

# Discord Activity 用トンネル（別ターミナル）
cloudflared tunnel --url http://localhost:3000
```

その後、Developer Portal の URL Mapping (`/`) に cloudflared の URL を登録し、Discord のボイスチャンネル or App Launcher から Activity を起動します。

| コマンド | 内容 |
|---|---|
| `npm run dev:web` | 開発サーバー起動 |
| `npm run build` | 本番ビルド |
| `npm run lint` | ESLint |
| `npm run typecheck` | 型チェック（`tsc --noEmit`） |

## デプロイ（Railway）

`apps/web` を 1 サービスとしてデプロイします。

| 項目 | 値 |
|---|---|
| Build Command | `npm install && npm run build -w apps/web` |
| Start Command | `npm run start -w apps/web` |
| Watch Path | `/apps/web/**` |

環境変数は [セットアップ手順 2](#2-環境変数) と同じものをサービスの **Variables** に設定してください。

## 運用スクリプト

ミッション登録・コマンド登録は単発スクリプトで行います（常駐サーバーは不要）。リポジトリのルートから実行でき、必要な変数は [運用スクリプト実行時に必要な変数](#運用スクリプト実行時に必要な変数最小限) を参照してください（`apps/web/.env.local`、または `railway run` で注入）。

```bash
# missions.yaml / categories.yaml を Supabase に同期
#   必要: NEXT_PUBLIC_SUPABASE_URL（または SUPABASE_URL）, SUPABASE_SERVICE_ROLE_KEY
npm run sync-missions

# Discord のスラッシュコマンド（Activity 起動エントリ）を登録 / 更新
#   必要: NEXT_PUBLIC_DISCORD_CLIENT_ID（または DISCORD_CLIENT_ID）, DISCORD_BOT_TOKEN
npm run register-commands
```

## ミッションの追加・更新

1. `mission_data/missions.yaml`（必要なら `mission_data/categories.yaml`）を編集
2. `npm run sync-missions` を実行して Supabase に同期

`sync-missions` はカテゴリとミッションを `slug` で upsert します。ミッションの `category_slug` が `categories.yaml` に存在しない場合はエラーで停止します（不整合を防止）。

> **Note**: `mission_data/` はミッション内容を非公開にするため `.gitignore` 済みで、リポジトリには含まれません（ローカルでのみ管理）。クローン環境では別途ファイルを用意してください。

## プロジェクト構成

```
.
├── apps/
│   └── web/                       # Next.js 14（UI + API + 運用スクリプト）
│       ├── src/
│       │   ├── app/
│       │   │   ├── api/           # Route Handlers（token / me / missions / achievements / leaderboard）
│       │   │   ├── layout.tsx
│       │   │   └── page.tsx       # Discord SDK をブラウザ専用で動的読み込み
│       │   ├── components/        # 画面・UI コンポーネント（shadcn/ui を含む）
│       │   ├── features/          # ミッション関連の機能コンポーネント
│       │   ├── lib/               # supabase / discord-sdk / utils
│       │   └── types/             # DB 型定義
│       └── scripts/               # sync-missions / register-commands
├── supabase/
│   └── migrations/                # DB スキーマ・シード・RPC
├── mission_data/                  # ミッション定義（YAML・非公開: .gitignore 済み / ローカル管理）
└── README.md
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

## 開発ガイドライン

- **ブランチ戦略**: `main` を常にデプロイ可能な状態に保ちます。機能開発は `feat/*` ブランチで行い、レビュー後に `main` へマージします
- **DB 変更**: スキーマ変更は `supabase/migrations/` に新しい連番ファイルを追加し、Supabase の SQL Editor で適用します。型定義（`apps/web/src/types/database.ts`）も併せて更新してください
- **コミット前**: `npm run typecheck` と `npm run lint` の通過を確認してください
- **依存更新**: Dependabot の対象は `apps/web` です。React 18 / Next.js 14 / Tailwind v3 は意図的に固定しているため、これらのメジャー更新 PR は原則クローズします
