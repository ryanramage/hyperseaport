const http = require('http')
const fixMeta = require('./fixMeta')
const { URL } = require('node:url')

module.exports = (config, registry, dht) => {
  const handler = async (req, res) => {
    const _url = new URL(req.url, 'http://{req.headers.host}')
    const path = _url.pathname + _url.search
    if (_url.pathname === '/') return root(req, res)

    const [, requestType, id] = path.split('/')
    const newPath = '/' + path.split('/').slice(3).join('/')
    if (requestType === 'role') return byRole(req, res, registry, dht, id, newPath)
    if (requestType === 'list') return listByRole(req, res, registry, id)
    if (requestType === 'instance') return byInstance(req, res, dht, id, newPath)
    return root(req, res)
  }

  const server = http.createServer(handler)
  server.on('clientError', (err, socket) => {
    if (err.code === 'ECONNRESET' || !socket.writable) {
      return
    }

    socket.end('HTTP/1.1 400 Bad Request\r\n\r\n')
  })

  server.listen(config.web)
  return registry
}

async function listByRole (req, res, registry, role) {
  if (!role || role.length === 0) return error('Invalid request role', req, res)
  const meta = fixMeta(role)
  const available = await registry.query(meta)
  if (!available || !available.length) return notFound(role, req, res)
  res.writeHead(200, {
    'Content-Type': 'application/json'
  })
  res.write(JSON.stringify(available))
  res.end()
}

async function byInstance (req, res, dht, servicePublicKey, newPath) {
  return makeRequest(req, res, dht, servicePublicKey, newPath)
}

async function byRole (req, res, registry, dht, role, newPath) {
  if (!role || role.length === 0) return error('Invalid request role', req, res)
  const meta = fixMeta(role)
  const available = await registry.query(meta)
  if (!available || !available.length) return notFound(role, req, res)

  // choose a random one
  const choice = available[Math.floor(Math.random() * available.length)]
  const servicePublicKey = choice.servicePublicKey
  makeRequest(req, res, dht, servicePublicKey, newPath)
}

async function makeRequest (req, res, dht, servicePublicKey, newPath) {
  const key = Buffer.from(servicePublicKey, 'hex')
  const createSocket = () => dht.connect(key)
  const serverSocket = createSocket()

  const destroy = () => {
    try {
      serverSocket.destroy()
    } catch (e) {
      console.log(e)
    }
  }

  serverSocket.on('error', destroy).on('close', destroy)
  serverSocket.on('data', (d) => {
    res.write(d)
    if (d.length < 65536) {
      res.end()
      destroy()
    }
  })
  req.on('abort', () => {
    destroy()
  })
  req.on('error', () => {
    destroy()
  })

  const headers = []
  for (let i = 0; i < req.rawHeaders.length; i = i + 2) {
    const header = `${req.rawHeaders[i]}: ${req.rawHeaders[i + 1]}`
    headers.push(header)
  }
  const head = `${req.method} ${newPath} HTTP/1.1\r\n` + headers.join('\r\n') + '\r\n\r\n'
  serverSocket.write(head)

  req.on('data', chunk => {
    serverSocket.write(chunk)
  })
}

function notFound (id, req, res) {
  res.writeHead(404, {
    'Content-Type': 'text/plain'
  })
  res.write(`${id} not found`)
  res.end()
}

function error (message, req, res) {
  res.writeHead(500, {
    'Content-Type': 'text/plain'
  })
  res.write(message)
  res.end()
}

function root (req, res) {
  res.writeHead(200, {
    'Content-Type': 'text/html'
  })
  res.write('<h2>hyperseaport router</h2>')
  res.end()
}
