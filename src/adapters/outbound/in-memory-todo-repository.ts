import Database from 'better-sqlite3'
import type { ITodoRepository } from '../../domain/todo-repository'
import type { Todo } from '../../domain/todo'

export class InMemoryTodoRepository implements ITodoRepository {
  private readonly db: Database.Database

  constructor() {
    this.db = new Database(':memory:')
    this.db.exec(`
      CREATE TABLE todos (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        title      TEXT    NOT NULL,
        completed  INTEGER NOT NULL DEFAULT 0,
        created_at TEXT    NOT NULL DEFAULT (datetime('now'))
      )
    `)
  }

  async findAll(): Promise<Todo[]> {
    return this.db.prepare('SELECT * FROM todos ORDER BY created_at DESC, id DESC').all() as Todo[]
  }

  async create(title: string): Promise<void> {
    this.db.prepare('INSERT INTO todos (title) VALUES (?)').run(title)
  }

  async toggle(id: number): Promise<void> {
    this.db.prepare('UPDATE todos SET completed = 1 - completed WHERE id = ?').run(id)
  }

  async delete(id: number): Promise<void> {
    this.db.prepare('DELETE FROM todos WHERE id = ?').run(id)
  }
}
