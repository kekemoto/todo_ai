import { describe, it, expect, beforeAll, beforeEach } from 'vitest'
import { env } from 'cloudflare:test'
import { D1UserRepository } from '../adapters/outbound/d1-user-repository'
import { listUsers, createUser, getUser, deleteUser } from '../application/user-use-cases'

beforeAll(async () => {
  await env.DB.prepare(
    `CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT (datetime('now')))`
  ).run()
  await env.DB.prepare(
    `CREATE TABLE IF NOT EXISTS todos (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL DEFAULT 1, title TEXT NOT NULL, completed INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT (datetime('now')))`
  ).run()
})

describe('user use cases', () => {
  let repo: D1UserRepository

  beforeEach(async () => {
    await env.DB.exec('DELETE FROM todos')
    await env.DB.exec('DELETE FROM users')
    repo = new D1UserRepository(env.DB)
  })

  it('空の状態ではユーザーが0件', async () => {
    expect(await listUsers(repo)).toHaveLength(0)
  })

  it('ユーザーを作成できる', async () => {
    const user = await createUser(repo, 'Alice')
    expect(user.name).toBe('Alice')
    expect(user.id).toBeTypeOf('number')
    const users = await listUsers(repo)
    expect(users).toHaveLength(1)
  })

  it('空白の名前はエラーになる', async () => {
    await expect(createUser(repo, '   ')).rejects.toThrow()
  })

  it('名前はトリムされる', async () => {
    const user = await createUser(repo, '  Bob  ')
    expect(user.name).toBe('Bob')
  })

  it('IDでユーザーを取得できる', async () => {
    const created = await createUser(repo, 'Carol')
    const found = await getUser(repo, created.id)
    expect(found?.name).toBe('Carol')
  })

  it('存在しないIDはnullを返す', async () => {
    expect(await getUser(repo, 9999)).toBeNull()
  })

  it('ユーザーを削除するとTodoも削除される', async () => {
    const user = await createUser(repo, 'Dave')
    await env.DB.prepare('INSERT INTO todos (user_id, title) VALUES (?, ?)').bind(user.id, 'タスク').run()
    await deleteUser(repo, user.id)
    const { results } = await env.DB.prepare('SELECT * FROM todos WHERE user_id = ?').bind(user.id).all()
    expect(results).toHaveLength(0)
    expect(await getUser(repo, user.id)).toBeNull()
  })
})
