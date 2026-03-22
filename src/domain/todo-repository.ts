import type { Todo } from './todo'

export interface ITodoRepository {
  findAll(): Promise<Todo[]>
  create(title: string): Promise<void>
  toggle(id: number): Promise<void>
  delete(id: number): Promise<void>
}
