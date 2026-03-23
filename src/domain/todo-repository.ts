import type { Todo } from './todo'

export interface ITodoRepository {
  findAll(userId: number): Promise<Todo[]>
  create(userId: number, title: string): Promise<void>
  toggle(id: number): Promise<void>
  delete(id: number): Promise<void>
}
