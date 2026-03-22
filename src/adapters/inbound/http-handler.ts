import { Hono } from 'hono'
import { html } from 'hono/html'
import type { ITodoRepository } from '../../domain/todo-repository'
import { listTodos, createTodo, toggleTodo, deleteTodo } from '../../application/todo-use-cases'

export const createHttpHandler = (repo: ITodoRepository) => {
  const app = new Hono()

  app.get('/', async (c) => {
    const todos = await listTodos(repo)

    return c.html(html`<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Todo List</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, sans-serif; max-width: 600px; margin: 2rem auto; padding: 0 1rem; background: #f5f5f5; }
    h1 { margin-bottom: 1.5rem; font-size: 1.75rem; }
    #add-form { display: flex; gap: .5rem; margin-bottom: 1.5rem; }
    #add-form input { flex: 1; padding: .6rem .8rem; border: 1px solid #ccc; border-radius: 6px; font-size: 1rem; }
    #add-form input:focus { outline: none; border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,.15); }
    #add-form button { padding: .6rem 1.2rem; background: #2563eb; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-size: 1rem; }
    #add-form button:hover { background: #1d4ed8; }
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
  <h1>Todo List</h1>
  <form id="add-form" method="POST" action="/todos">
    <input type="text" name="title" placeholder="やることを入力..." autocomplete="off" required>
    <button type="submit">追加</button>
  </form>
  <ul id="todo-list">
    ${todos.map((todo) => html`
    <li class="todo-item">
      <form method="POST" action="/todos/${todo.id}/toggle">
        <button type="submit" class="toggle-btn ${todo.completed ? 'done' : ''}">${todo.completed ? '✓' : ''}</button>
      </form>
      <span class="title ${todo.completed ? 'done' : ''}">${todo.title}</span>
      <form method="POST" action="/todos/${todo.id}/delete">
        <button type="submit" class="delete-btn" title="削除">✕</button>
      </form>
    </li>`)}
  </ul>
  ${todos.length === 0 ? html`<p id="empty-state">Todoがありません。上から追加してください。</p>` : ''}
</body>
</html>`)
  })

  app.post('/todos', async (c) => {
    const body = await c.req.parseBody()
    await createTodo(repo, String(body['title'] ?? ''))
    return c.redirect('/')
  })

  app.post('/todos/:id/toggle', async (c) => {
    await toggleTodo(repo, Number(c.req.param('id')))
    return c.redirect('/')
  })

  app.post('/todos/:id/delete', async (c) => {
    await deleteTodo(repo, Number(c.req.param('id')))
    return c.redirect('/')
  })

  return app
}
