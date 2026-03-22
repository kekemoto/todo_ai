import { describe, it, expect, beforeAll, beforeEach } from 'vitest'
import { env } from 'cloudflare:test'
import { D1TodoRepository } from '../adapters/outbound/d1-todo-repository'
import { listTodos, createTodo, toggleTodo, deleteTodo } from '../application/todo-use-cases'

beforeAll(async () => {
  await env.DB.prepare(
    `CREATE TABLE IF NOT EXISTS todos (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, completed INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT (datetime('now')))`
  ).run()
})

describe('todo use cases', () => {
  let repo: D1TodoRepository

  beforeEach(async () => {
    await env.DB.exec('DELETE FROM todos')
    repo = new D1TodoRepository(env.DB)
  })

  it('空の状態ではtodoが0件', async () => {
    const todos = await listTodos(repo)
    expect(todos).toHaveLength(0)
  })

  it('todoを作成できる', async () => {
    await createTodo(repo, '牛乳を買う')
    const todos = await listTodos(repo)
    expect(todos).toHaveLength(1)
    expect(todos[0].title).toBe('牛乳を買う')
    expect(todos[0].completed).toBe(0)
  })

  it('空白のタイトルは無視される', async () => {
    await createTodo(repo, '   ')
    const todos = await listTodos(repo)
    expect(todos).toHaveLength(0)
  })

  it('タイトルはトリムされる', async () => {
    await createTodo(repo, '  掃除する  ')
    const todos = await listTodos(repo)
    expect(todos[0].title).toBe('掃除する')
  })

  it('todoをトグルできる', async () => {
    await createTodo(repo, '買い物')
    const [todo] = await listTodos(repo)

    await toggleTodo(repo, todo.id)
    const [toggled] = await listTodos(repo)
    expect(toggled.completed).toBe(1)

    await toggleTodo(repo, todo.id)
    const [reset] = await listTodos(repo)
    expect(reset.completed).toBe(0)
  })

  it('todoを削除できる', async () => {
    await createTodo(repo, '削除するtodo')
    const [todo] = await listTodos(repo)

    await deleteTodo(repo, todo.id)
    const todos = await listTodos(repo)
    expect(todos).toHaveLength(0)
  })

  it('複数todoの順序は新しい順', async () => {
    await createTodo(repo, '最初')
    await createTodo(repo, '次')
    await createTodo(repo, '最後')
    const todos = await listTodos(repo)
    expect(todos.map((t) => t.title)).toEqual(['最後', '次', '最初'])
  })
})
