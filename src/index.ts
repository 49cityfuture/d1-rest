import { Hono } from 'hono'

type Bindings = {
  DB: D1Database
}

const app = new Hono<{ Bindings: Bindings }>()

// Middleware to log every request
app.use('*', async (c, next) => {
  const { method } = c.req
  const url = c.req.url
  const userAgent = c.req.header('user-agent') || 'unknown'

  await c.env.DB.prepare(
    `INSERT INTO requests (method, url, user_agent) VALUES (?, ?, ?)`
  )
    .bind(method, url, userAgent)
    .run()

  await next()
})

// Example route
app.get('/', (c) => {
  return c.text('Hello from Hono + D1!')
})

// Optional: view logs
app.get('/logs', async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT * FROM requests ORDER BY created_at DESC LIMIT 50`
  ).all()

  return c.json(results)
})

export default app