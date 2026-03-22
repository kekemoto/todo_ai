# CLAUDE.md

## プロジェクト概要

Cloudflare Workers + D1 で動く Todo アプリ。Hexagonal Architecture（Ports & Adapters）を採用している。

## 開発コマンド

```bash
npm run dev              # ローカル開発サーバー (http://localhost:8787)
npm run test             # ユニットテスト実行
npm run deploy           # Cloudflare Workers へデプロイ
npm run db:migrate:local # D1マイグレーション（ローカル）
npm run db:migrate:remote # D1マイグレーション（本番）
```

## アーキテクチャ

Hexagonal Architecture（Ports & Adapters）を採用。依存関係はドメインに向かって内側に流れる。

```
src/
├── domain/              # エンティティ・ポート定義（外部依存なし）
├── application/         # ユースケース（外部依存なし）
├── adapters/
│   ├── inbound/         # HTTPハンドラ（Hono）
│   └── outbound/        # リポジトリ実装（D1 / InMemory）
├── __tests__/           # ユニットテスト
└── index.ts             # エントリポイント（依存性の組み立てのみ）
```

### レイヤーの役割

| レイヤー | ファイル | 依存 |
|---------|---------|------|
| Domain | `domain/todo.ts`, `domain/todo-repository.ts` | なし |
| Application | `application/todo-use-cases.ts` | Domain のみ |
| Inbound Adapter | `adapters/inbound/http-handler.ts` | Application + Domain |
| Outbound Adapter | `adapters/outbound/d1-todo-repository.ts` | Domain |
| Test Adapter | `adapters/outbound/in-memory-todo-repository.ts` | Domain |

## テスト方針

- ユニットテストは `InMemoryTodoRepository` を使用。Cloudflare D1 不要で高速に動く
- ユースケース (`application/`) のロジックを中心にテストする
- 新しいユースケースを追加したら対応するテストも追加すること

## コーディングルール

- **新しいビジネスロジックは `application/` に書く** — HTTP や DB の詳細を持ち込まない
- **`ITodoRepository` を実装する形でDBアクセスを追加する** — D1以外のDBに差し替えやすくするため
- **`index.ts` は依存性の組み立てのみ** — ロジックを書かない

## スタック

- Runtime: Cloudflare Workers
- Framework: Hono
- Database: Cloudflare D1 (SQLite)
- Language: TypeScript
- Test: Vitest
