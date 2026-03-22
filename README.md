# todo-ai

Cloudflare Workers と D1 データベースを使ったシンプルな Todo アプリです。

## 技術スタック

- **ランタイム**: [Cloudflare Workers](https://workers.cloudflare.com/)
- **フレームワーク**: [Hono](https://hono.dev/)
- **データベース**: [Cloudflare D1](https://developers.cloudflare.com/d1/) (SQLite)
- **言語**: TypeScript

## 機能

- Todo の追加
- Todo の完了/未完了の切り替え
- Todo の削除

## セットアップ

### 前提条件

- Node.js
- Cloudflare アカウント
- Wrangler CLI (`npm install -g wrangler`)

### インストール

```bash
npm install
```

### D1 データベースの作成

```bash
wrangler d1 create todo-ai-db
```

コマンド出力に表示される `database_id` を `wrangler.toml` の `database_id` に設定してください。

### マイグレーションの実行

ローカル環境:

```bash
npm run db:migrate:local
```

本番環境:

```bash
npm run db:migrate:remote
```

## 開発

ローカルサーバーを起動します:

```bash
npm run dev
```

ブラウザで `http://localhost:8787` を開くと Todo アプリが確認できます。

## デプロイ

Cloudflare Workers にデプロイします:

```bash
npm run deploy
```

## ライセンス

[LICENSE](./LICENSE) を参照してください。
