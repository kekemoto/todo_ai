import type { ITodoRepository } from '../domain/todo-repository'
import type { Todo } from '../domain/todo'

export const listTodos = (repo: ITodoRepository): Promise<Todo[]> =>
  repo.findAll()

export const createTodo = async (repo: ITodoRepository, title: string): Promise<void> => {
  const trimmed = title.trim()
  if (!trimmed) return
  await repo.create(trimmed)
}

export const toggleTodo = (repo: ITodoRepository, id: number): Promise<void> =>
  repo.toggle(id)

export const deleteTodo = (repo: ITodoRepository, id: number): Promise<void> =>
  repo.delete(id)
