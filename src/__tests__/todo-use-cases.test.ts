import { describe, it, expect, beforeAll, beforeEach } from 'vitest'
import { env } from 'cloudflare:test'
import { D1TodoRepository } from '../adapters/outbound/d1-todo-repository'
import { listTodos, createTodo, toggleTodo, deleteTodo } from '../application/todo-use-cases'

const TEST_USER_ID = 1

beforeAll(async () => {
  await env.DB.prepare(
    `CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT (datetime('now')))`
  ).run()
  await env.DB.prepare(
    `CREATE TABLE IF NOT EXISTS todos (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL DEFAULT 1, title TEXT NOT NULL, completed INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT (datetime('now')))`
  ).run()
  // テスト用ユーザーを用意
  await env.DB.prepare(`INSERT OR IGNORE INTO users (id, name) VALUES (?, 'TestUser')`).bind(TEST_USER_ID).run()
})

describe('todo use cases', () => {
  let repo: D1TodoRepository

  beforeEach(async () => {
    await env.DB.exec('DELETE FROM todos')
    repo = new D1TodoRepository(env.DB)
  })

  it('空の状態ではtodoが0件', async () => {
    const todos = await listTodos(repo, TEST_USER_ID)
    expect(todos).toHaveLength(0)
  })

  it('todoを作成できる', async () => {
    await createTodo(repo, TEST_USER_ID, '牛乳を買う')
    const todos = await listTodos(repo, TEST_USER_ID)
    expect(todos).toHaveLength(1)
    expect(todos[0].title).toBe('牛乳を買う')
    expect(todos[0].completed).toBe(0)
  })

  it('空白のタイトルは無視される', async () => {
    await createTodo(repo, TEST_USER_ID, '   ')
    const todos = await listTodos(repo, TEST_USER_ID)
    expect(todos).toHaveLength(0)
  })

  it('タイトルはトリムされる', async () => {
    await createTodo(repo, TEST_USER_ID, '  掃除する  ')
    const todos = await listTodos(repo, TEST_USER_ID)
    expect(todos[0].title).toBe('掃除する')
  })

  it('todoをトグルできる', async () => {
    await createTodo(repo, TEST_USER_ID, '買い物')
    const [todo] = await listTodos(repo, TEST_USER_ID)

    await toggleTodo(repo, todo.id)
    const [toggled] = await listTodos(repo, TEST_USER_ID)
    expect(toggled.completed).toBe(1)

    await toggleTodo(repo, todo.id)
    const [reset] = await listTodos(repo, TEST_USER_ID)
    expect(reset.completed).toBe(0)
  })

  it('todoを削除できる', async () => {
    await createTodo(repo, TEST_USER_ID, '削除するtodo')
    const [todo] = await listTodos(repo, TEST_USER_ID)

    await deleteTodo(repo, todo.id)
    const todos = await listTodos(repo, TEST_USER_ID)
    expect(todos).toHaveLength(0)
  })

  it('複数todoの順序は新しい順', async () => {
    await createTodo(repo, TEST_USER_ID, '最初')
    await createTodo(repo, TEST_USER_ID, '次')
    await createTodo(repo, TEST_USER_ID, '最後')
    const todos = await listTodos(repo, TEST_USER_ID)
    expect(todos.map((t) => t.title)).toEqual(['最後', '次', '最初'])
  })

  it('異なるユーザーのtodoは分離される', async () => {
    const OTHER_USER_ID = 2
    await env.DB.prepare(`INSERT OR IGNORE INTO users (id, name) VALUES (?, 'OtherUser')`).bind(OTHER_USER_ID).run()

    await createTodo(repo, TEST_USER_ID, 'ユーザー1のtodo')
    await createTodo(repo, OTHER_USER_ID, 'ユーザー2のtodo')

    const user1Todos = await listTodos(repo, TEST_USER_ID)
    const user2Todos = await listTodos(repo, OTHER_USER_ID)

    expect(user1Todos).toHaveLength(1)
    expect(user1Todos[0].title).toBe('ユーザー1のtodo')
    expect(user2Todos).toHaveLength(1)
    expect(user2Todos[0].title).toBe('ユーザー2のtodo')
  })
})
