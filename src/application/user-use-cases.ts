import type { IUserRepository } from '../domain/user-repository'
import type { User } from '../domain/user'

export const listUsers = (repo: IUserRepository): Promise<User[]> =>
  repo.findAll()

export const createUser = async (repo: IUserRepository, name: string): Promise<User> => {
  const trimmed = name.trim()
  if (!trimmed) throw new Error('ユーザー名を入力してください')
  return repo.create(trimmed)
}

export const getUser = (repo: IUserRepository, id: number): Promise<User | null> =>
  repo.findById(id)

export const deleteUser = (repo: IUserRepository, id: number): Promise<void> =>
  repo.delete(id)
