import type { ITodoRepository } from '../../domain/todo-repository'
import type { Todo } from '../../domain/todo'

export class D1TodoRepository implements ITodoRepository {
  constructor(private readonly db: D1Database) {}

  async findAll(): Promise<Todo[]> {
    const { results } = await this.db
      .prepare('SELECT * FROM todos ORDER BY created_at DESC')
      .all<Todo>()
    return results
  }

  async create(title: string): Promise<void> {
    await this.db
      .prepare('INSERT INTO todos (title) VALUES (?)')
      .bind(title)
      .run()
  }

  async toggle(id: number): Promise<void> {
    await this.db
      .prepare('UPDATE todos SET completed = 1 - completed WHERE id = ?')
      .bind(id)
      .run()
  }

  async delete(id: number): Promise<void> {
    await this.db
      .prepare('DELETE FROM todos WHERE id = ?')
      .bind(id)
      .run()
  }
}
