import { createHttpHandler } from './adapters/inbound/http-handler'
import { D1TodoRepository } from './adapters/outbound/d1-todo-repository'

type Bindings = { DB: D1Database }

export default {
  fetch(request: Request, env: Bindings, ctx: ExecutionContext) {
    const repo = new D1TodoRepository(env.DB)
    const app = createHttpHandler(repo)
    return app.fetch(request, env, ctx)
  },
}
