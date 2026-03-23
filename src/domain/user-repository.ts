import type { User } from './user'

export interface IUserRepository {
  findAll(): Promise<User[]>
  create(name: string): Promise<User>
  findById(id: number): Promise<User | null>
  delete(id: number): Promise<void>
}
