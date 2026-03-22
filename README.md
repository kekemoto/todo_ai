# Todo List (Cloudflare Workers + D1)

シンプルな TODO リストアプリです。Cloudflare Workers + D1 で動作し、JavaScript なしのサーバーサイドレンダリングで実装しています。

## 技術スタック

- **Cloudflare Workers** — サーバーレス実行環境
- **Cloudflare D1** — SQLite ベースのエッジデータベース
- **Hono** — Workers 向け軽量 Web フレームワーク
- **TypeScript**

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. D1 データベースの作成（初回のみ）

```bash
npx wrangler d1 create todo-ai-db
```

出力された `database_id` を `wrangler.toml` に貼り付けます。

```toml
[[d1_databases]]
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"  # ← ここに貼り付け
```

### 3. ローカル DB の初期化

```bash
npm run db:migrate:local
```

### 4. 開発サーバーの起動

```bash
npm run dev
```

`http://localhost:8787` でアクセスできます。

## デプロイ

```bash
npm run db:migrate:remote  # 本番 D1 にマイグレーションを適用
npm run deploy             # Workers にデプロイ
```

## 設計の概要

HTML フォームと PRG（Post/Redirect/Get）パターンによるサーバーサイドレンダリングです。クライアント側の JavaScript は一切使用しておらず、`hono/html` のタグ付きテンプレートによりサーバー側で HTML エスケープを行っています。

| ルート | 説明 |
|---|---|
| `GET /` | Todo 一覧を HTML で返す |
| `POST /todos` | Todo を追加 → `/` にリダイレクト |
| `POST /todos/:id/toggle` | 完了状態を切り替え → `/` にリダイレクト |
| `POST /todos/:id/delete` | Todo を削除 → `/` にリダイレクト |
