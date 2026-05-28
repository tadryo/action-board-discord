# クイックスタート

最短で「動かす・更新する」ための手順です。詳細は [README.md](./README.md) を参照してください。

> 前提: Supabase プロジェクトと Railway へのデプロイ、Discord アプリ（Activity）は設定済み。

---

## 0. 取得とインストール

```bash
git clone https://github.com/tadryo/action-board-discord.git
cd action-board-discord
npm install
```

---

## 1. ローカル用の環境変数を用意

`apps/web/.env.local` を作成します。値は **Railway → `@action-board/frontend` → Variables**（👁で表示）からコピー。

```bash
cat > apps/web/.env.local <<'EOF'
NEXT_PUBLIC_DISCORD_CLIENT_ID=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
DISCORD_CLIENT_SECRET=
SUPABASE_SERVICE_ROLE_KEY=
EOF
```

- **アプリをローカルで起動する**なら上記 5 つ
- **`sync-missions` だけ動かす**なら `NEXT_PUBLIC_SUPABASE_URL` と `SUPABASE_SERVICE_ROLE_KEY` の 2 つだけで OK

> Railway CLI があれば `.env.local` を作らず `railway run npm run sync-missions` でも実行できます。

---

## 2. ミッションを編集して反映

ミッション定義はローカルの `mission_data/`（非公開・`.gitignore` 済み）にあります。

```bash
# 1) 内容を編集
#    mission_data/missions.yaml / mission_data/categories.yaml

# 2) Supabase に同期（slug で upsert）
npm run sync-missions
```

---

## 3. ミッションを総入れ替え / 全リセットしたいとき

カテゴリ構成を変えた場合など、古い行を消してから入れ直します。**Supabase → SQL Editor** で実行:

```sql
-- 達成記録・ミッション・カテゴリを削除し、全員のポイントを 0 に
DELETE FROM achievements;
DELETE FROM missions;
DELETE FROM categories;
UPDATE users SET total_points = 0;
```

その後、新しい内容を投入:

```bash
npm run sync-missions
```

> 「完了状態だけリセット」したいなら `DELETE FROM achievements;` と `UPDATE users SET total_points = 0;` の 2 行だけでも可。

---

## 4. アプリをローカルで起動（任意）

```bash
# 開発サーバー（http://localhost:3000）
npm run dev:web

# 別ターミナル: Discord Activity 用トンネル
cloudflared tunnel --url http://localhost:3000
```

Discord Developer Portal の **URL Mappings** `/` を cloudflared の URL に向け、Discord から Activity を起動します。

---

## 5. デプロイ

`main` に push すると Railway が自動でビルド・デプロイします。手動操作は不要です。

```bash
git push origin main
```

---

## よく使うコマンド

| コマンド | 内容 |
|---|---|
| `npm run dev:web` | 開発サーバー起動 |
| `npm run build` | 本番ビルド |
| `npm run typecheck` | 型チェック |
| `npm run lint` | ESLint |
| `npm run sync-missions` | ミッションを Supabase に同期 |
| `npm run register-commands` | Discord スラッシュコマンド登録 |
