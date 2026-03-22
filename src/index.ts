import { Hono } from 'hono'
import { cors } from 'hono/cors'

type Bindings = {
  DB: D1Database
}

type Todo = {
  id: number
  title: string
  completed: boolean
  created_at: string
}

type D1Todo = Omit<Todo, 'completed'> & { completed: number }

function toTodo(row: D1Todo): Todo {
  return { ...row, completed: row.completed === 1 }
}

const app = new Hono<{ Bindings: Bindings }>()

app.use('/api/*', cors())

// List all todos, newest first
app.get('/api/todos', async (c) => {
  const { results } = await c.env.DB.prepare(
    'SELECT * FROM todos ORDER BY created_at DESC'
  ).all<D1Todo>()
  return c.json(results.map(toTodo))
})

// Create a todo
app.post('/api/todos', async (c) => {
  const { title } = await c.req.json<{ title: string }>()
  if (!title?.trim()) {
    return c.json({ error: 'title is required' }, 400)
  }
  const result = await c.env.DB.prepare(
    'INSERT INTO todos (title) VALUES (?) RETURNING *'
  ).bind(title.trim()).first<D1Todo>()
  if (!result) return c.json({ error: 'insert failed' }, 500)
  return c.json(toTodo(result), 201)
})

// Update a todo (toggle completed and/or rename)
app.patch('/api/todos/:id', async (c) => {
  const id = Number(c.req.param('id'))
  const body = await c.req.json<{ completed?: boolean; title?: string }>()

  const fields: string[] = []
  const values: unknown[] = []

  if (typeof body.completed === 'boolean') {
    fields.push('completed = ?')
    values.push(body.completed ? 1 : 0)
  }
  if (typeof body.title === 'string' && body.title.trim()) {
    fields.push('title = ?')
    values.push(body.title.trim())
  }
  if (fields.length === 0) {
    return c.json({ error: 'nothing to update' }, 400)
  }

  values.push(id)
  const result = await c.env.DB.prepare(
    `UPDATE todos SET ${fields.join(', ')} WHERE id = ? RETURNING *`
  ).bind(...values).first<D1Todo>()

  if (!result) return c.json({ error: 'not found' }, 404)
  return c.json(toTodo(result))
})

// Delete a todo
app.delete('/api/todos/:id', async (c) => {
  const id = Number(c.req.param('id'))
  const result = await c.env.DB.prepare(
    'DELETE FROM todos WHERE id = ? RETURNING id'
  ).bind(id).first<{ id: number }>()
  if (!result) return c.json({ error: 'not found' }, 404)
  return c.json({ deleted: true })
})

// Serve frontend
app.get('/', (c) => c.html(getHtml()))

function getHtml(): string {
  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Todo List</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: system-ui, -apple-system, sans-serif;
      max-width: 600px;
      margin: 2rem auto;
      padding: 0 1rem;
      background: #f5f5f5;
      color: #1a1a1a;
    }
    h1 { margin-bottom: 1.5rem; font-size: 1.75rem; }
    #add-form {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 1.5rem;
    }
    #add-form input {
      flex: 1;
      padding: 0.6rem 0.8rem;
      border: 1px solid #ccc;
      border-radius: 6px;
      font-size: 1rem;
      outline: none;
    }
    #add-form input:focus { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,0.15); }
    #add-form button {
      padding: 0.6rem 1.2rem;
      background: #2563eb;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 1rem;
      white-space: nowrap;
    }
    #add-form button:hover { background: #1d4ed8; }
    #todo-list { list-style: none; display: flex; flex-direction: column; gap: 0.5rem; }
    .todo-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      background: white;
      padding: 0.75rem 1rem;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.07);
    }
    .todo-item input[type="checkbox"] { width: 1.1rem; height: 1.1rem; cursor: pointer; flex-shrink: 0; }
    .todo-item span {
      flex: 1;
      font-size: 1rem;
      word-break: break-word;
    }
    .todo-item span.done { text-decoration: line-through; color: #888; }
    .delete-btn {
      background: none;
      border: none;
      cursor: pointer;
      color: #ef4444;
      font-size: 1.1rem;
      padding: 0.1rem 0.3rem;
      border-radius: 4px;
      flex-shrink: 0;
      line-height: 1;
    }
    .delete-btn:hover { background: #fee2e2; }
    #empty-state { color: #888; text-align: center; padding: 2rem 0; }
  </style>
</head>
<body>
  <h1>Todo List</h1>
  <form id="add-form">
    <input type="text" id="new-todo" placeholder="やることを入力..." autocomplete="off" required>
    <button type="submit">追加</button>
  </form>
  <ul id="todo-list"></ul>
  <p id="empty-state" style="display:none">Todoがありません。上から追加してください。</p>

  <script>
    const list = document.getElementById('todo-list');
    const emptyState = document.getElementById('empty-state');
    const form = document.getElementById('add-form');
    const input = document.getElementById('new-todo');

    function escHtml(str) {
      return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    }

    async function api(method, path, body) {
      const res = await fetch(path, {
        method,
        headers: body ? { 'Content-Type': 'application/json' } : {},
        body: body ? JSON.stringify(body) : undefined,
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    }

    function renderTodos(todos) {
      list.innerHTML = '';
      emptyState.style.display = todos.length === 0 ? 'block' : 'none';
      todos.forEach(todo => {
        const li = document.createElement('li');
        li.className = 'todo-item';
        li.innerHTML = \`
          <input type="checkbox" \${todo.completed ? 'checked' : ''}>
          <span class="\${todo.completed ? 'done' : ''}">\${escHtml(todo.title)}</span>
          <button class="delete-btn" title="削除">✕</button>
        \`;
        li.querySelector('input').addEventListener('change', () =>
          toggleTodo(todo.id, !todo.completed)
        );
        li.querySelector('.delete-btn').addEventListener('click', () =>
          deleteTodo(todo.id)
        );
        list.appendChild(li);
      });
    }

    async function loadTodos() {
      const todos = await api('GET', '/api/todos');
      renderTodos(todos);
    }

    async function toggleTodo(id, completed) {
      await api('PATCH', '/api/todos/' + id, { completed });
      await loadTodos();
    }

    async function deleteTodo(id) {
      await api('DELETE', '/api/todos/' + id);
      await loadTodos();
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const title = input.value.trim();
      if (!title) return;
      input.value = '';
      await api('POST', '/api/todos', { title });
      await loadTodos();
    });

    loadTodos();
  </script>
</body>
</html>`
}

export default app
