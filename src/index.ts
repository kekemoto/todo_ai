import { createHttpHandler } from './adapters/inbound/http-handler'
import { D1TodoRepository } from './adapters/outbound/d1-todo-repository'
import { D1UserRepository } from './adapters/outbound/d1-user-repository'

type Bindings = { DB: D1Database }

export default {
  fetch(request: Request, env: Bindings, ctx: ExecutionContext) {
    const todoRepo = new D1TodoRepository(env.DB)
    const userRepo = new D1UserRepository(env.DB)
    const app = createHttpHandler(todoRepo, userRepo)
    return app.fetch(request, env, ctx)
  },
}
