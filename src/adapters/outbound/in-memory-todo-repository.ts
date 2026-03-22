import type { ITodoRepository } from '../../domain/todo-repository'
import type { Todo } from '../../domain/todo'

export class InMemoryTodoRepository implements ITodoRepository {
  private todos: Todo[] = []
  private nextId = 1

  async findAll(): Promise<Todo[]> {
    return [...this.todos].reverse()
  }

  async create(title: string): Promise<void> {
    this.todos.push({
      id: this.nextId++,
      title,
      completed: 0,
      created_at: new Date().toISOString(),
    })
  }

  async toggle(id: number): Promise<void> {
    const todo = this.todos.find((t) => t.id === id)
    if (todo) todo.completed = todo.completed === 0 ? 1 : 0
  }

  async delete(id: number): Promise<void> {
    this.todos = this.todos.filter((t) => t.id !== id)
  }
}
