import type { IUserRepository } from '../../domain/user-repository'
import type { User } from '../../domain/user'

export class D1UserRepository implements IUserRepository {
  constructor(private readonly db: D1Database) {}

  async findAll(): Promise<User[]> {
    const { results } = await this.db
      .prepare('SELECT * FROM users ORDER BY created_at ASC, id ASC')
      .all<User>()
    return results
  }

  async create(name: string): Promise<User> {
    const result = await this.db
      .prepare('INSERT INTO users (name) VALUES (?) RETURNING *')
      .bind(name)
      .first<User>()
    if (!result) throw new Error('Failed to create user')
    return result
  }

  async findById(id: number): Promise<User | null> {
    return (await this.db
      .prepare('SELECT * FROM users WHERE id = ?')
      .bind(id)
      .first<User>()) ?? null
  }

  async delete(id: number): Promise<void> {
    await this.db.prepare('DELETE FROM todos WHERE user_id = ?').bind(id).run()
    await this.db.prepare('DELETE FROM users WHERE id = ?').bind(id).run()
  }
}
