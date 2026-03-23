import type { ITodoRepository } from '../domain/todo-repository'
import type { Todo } from '../domain/todo'

export const listTodos = (repo: ITodoRepository, userId: number): Promise<Todo[]> =>
  repo.findAll(userId)

export const createTodo = async (repo: ITodoRepository, userId: number, title: string): Promise<void> => {
  const trimmed = title.trim()
  if (!trimmed) return
  await repo.create(userId, trimmed)
}

export const toggleTodo = (repo: ITodoRepository, id: number): Promise<void> =>
  repo.toggle(id)

export const deleteTodo = (repo: ITodoRepository, id: number): Promise<void> =>
  repo.delete(id)
