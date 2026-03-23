import { Hono } from 'hono'
import { html } from 'hono/html'
import type { ITodoRepository } from '../../domain/todo-repository'
import type { IUserRepository } from '../../domain/user-repository'
import { listTodos, createTodo, toggleTodo, deleteTodo } from '../../application/todo-use-cases'
import { listUsers, createUser, getUser, deleteUser } from '../../application/user-use-cases'

const commonStyles = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: system-ui, sans-serif; max-width: 600px; margin: 2rem auto; padding: 0 1rem; background: #f5f5f5; }
  h1 { margin-bottom: 1.5rem; font-size: 1.75rem; }
  .btn { padding: .6rem 1.2rem; border: none; border-radius: 6px; cursor: pointer; font-size: 1rem; }
  .btn-primary { background: #2563eb; color: #fff; }
  .btn-primary:hover { background: #1d4ed8; }
  .btn-danger { background: none; border: 1px solid #ef4444; color: #ef4444; padding: .3rem .7rem; font-size: .85rem; border-radius: 6px; cursor: pointer; }
  .btn-danger:hover { background: #fee2e2; }
  #add-form { display: flex; gap: .5rem; margin-bottom: 1.5rem; }
  #add-form input { flex: 1; padding: .6rem .8rem; border: 1px solid #ccc; border-radius: 6px; font-size: 1rem; }
  #add-form input:focus { outline: none; border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,.15); }
  a { color: #2563eb; text-decoration: none; }
  a:hover { text-decoration: underline; }
  .back-link { display: inline-block; margin-bottom: 1rem; color: #555; font-size: .9rem; }
`

export const createHttpHandler = (todoRepo: ITodoRepository, userRepo: IUserRepository) => {
  const app = new Hono()

  // ユーザー一覧
  app.get('/', async (c) => {
    const users = await listUsers(userRepo)

    return c.html(html`<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ユーザー一覧</title>
  <style>
    ${commonStyles}
    #user-list { list-style: none; display: flex; flex-direction: column; gap: .5rem; }
    .user-item { display: flex; align-items: center; gap: .75rem; background: #fff; padding: .75rem 1rem; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,.07); }
    .user-name { flex: 1; font-size: 1rem; }
    #empty-state { color: #888; text-align: center; padding: 2rem 0; }
  </style>
</head>
<body>
  <h1>ユーザー一覧</h1>
  <form id="add-form" method="POST" action="/users">
    <input type="text" name="name" placeholder="ユーザー名を入力..." autocomplete="off" required>
    <button type="submit" class="btn btn-primary">追加</button>
  </form>
  <ul id="user-list">
    ${users.map((user) => html`
    <li class="user-item">
      <span class="user-name"><a href="/users/${user.id}">${user.name}</a></span>
      <form method="POST" action="/users/${user.id}/delete">
        <button type="submit" class="btn-danger">削除</button>
      </form>
    </li>`)}
  </ul>
  ${users.length === 0 ? html`<p id="empty-state">ユーザーがいません。上から追加してください。</p>` : ''}
</body>
</html>`)
  })

  // ユーザー作成
  app.post('/users', async (c) => {
    const body = await c.req.parseBody()
    const user = await createUser(userRepo, String(body['name'] ?? ''))
    return c.redirect(`/users/${user.id}`)
  })

  // ユーザー削除
  app.post('/users/:userId/delete', async (c) => {
    await deleteUser(userRepo, Number(c.req.param('userId')))
    return c.redirect('/')
  })

  // ユーザーのTodo一覧
  app.get('/users/:userId', async (c) => {
    const userId = Number(c.req.param('userId'))
    const user = await getUser(userRepo, userId)
    if (!user) return c.notFound()

    const todos = await listTodos(todoRepo, userId)

    return c.html(html`<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${user.name} の Todo</title>
  <style>
    ${commonStyles}
    #todo-list { list-style: none; display: flex; flex-direction: column; gap: .5rem; }
    .todo-item { display: flex; align-items: center; gap: .75rem; background: #fff; padding: .75rem 1rem; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,.07); }
    .todo-item form { display: contents; }
    .toggle-btn { width: 1.4rem; height: 1.4rem; border: 1.5px solid #ccc; border-radius: 50%; background: none; cursor: pointer; flex-shrink: 0; font-size: .8rem; }
    .toggle-btn.done { background: #2563eb; border-color: #2563eb; color: #fff; }
    .title { flex: 1; font-size: 1rem; word-break: break-word; }
    .title.done { text-decoration: line-through; color: #888; }
    .delete-btn { background: none; border: none; cursor: pointer; color: #ef4444; font-size: 1.1rem; padding: .1rem .3rem; border-radius: 4px; flex-shrink: 0; }
    .delete-btn:hover { background: #fee2e2; }
    #empty-state { color: #888; text-align: center; padding: 2rem 0; }
  </style>
</head>
<body>
  <a href="/" class="back-link">← ユーザー一覧</a>
  <h1>${user.name} の Todo</h1>
  <form id="add-form" method="POST" action="/users/${userId}/todos">
    <input type="text" name="title" placeholder="やることを入力..." autocomplete="off" required>
    <button type="submit" class="btn btn-primary">追加</button>
  </form>
  <ul id="todo-list">
    ${todos.map((todo) => html`
    <li class="todo-item">
      <form method="POST" action="/users/${userId}/todos/${todo.id}/toggle">
        <button type="submit" class="toggle-btn ${todo.completed ? 'done' : ''}">${todo.completed ? '✓' : ''}</button>
      </form>
      <span class="title ${todo.completed ? 'done' : ''}">${todo.title}</span>
      <form method="POST" action="/users/${userId}/todos/${todo.id}/delete">
        <button type="submit" class="delete-btn" title="削除">✕</button>
      </form>
    </li>`)}
  </ul>
  ${todos.length === 0 ? html`<p id="empty-state">Todoがありません。上から追加してください。</p>` : ''}
</body>
</html>`)
  })

  // Todo作成
  app.post('/users/:userId/todos', async (c) => {
    const userId = Number(c.req.param('userId'))
    const body = await c.req.parseBody()
    await createTodo(todoRepo, userId, String(body['title'] ?? ''))
    return c.redirect(`/users/${userId}`)
  })

  // Todoトグル
  app.post('/users/:userId/todos/:id/toggle', async (c) => {
    const userId = Number(c.req.param('userId'))
    await toggleTodo(todoRepo, Number(c.req.param('id')))
    return c.redirect(`/users/${userId}`)
  })

  // Todo削除
  app.post('/users/:userId/todos/:id/delete', async (c) => {
    const userId = Number(c.req.param('userId'))
    await deleteTodo(todoRepo, Number(c.req.param('id')))
    return c.redirect(`/users/${userId}`)
  })

  return app
}
