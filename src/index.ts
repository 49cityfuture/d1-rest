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
  const ip = c.req.header('CF-Connecting-IP')

  await c.env.DB.prepare(
    `INSERT INTO requests (method, url, user_agent, ip) VALUES (?, ?, ?, ?)`
  )
    .bind(method, url, userAgent, ip)
    .run()

  await next()
})

// Example route
app.get('/', (c) => {
  return c.text('Hello from Hono + D1!')
})

// Optional: view logs
app.get('/logs', async (c) => {

    const apiKey = c.req.header('x-api-key')
  const expectedKey = c.env.LOGS_API_KEY

  if (!apiKey || apiKey !== expectedKey) {
    return c.text('Unauthorized', 401)
  }

  const { results } = await c.env.DB.prepare(
    `SELECT * FROM requests`
  ).all()

  return c.json(results)
})

export default app