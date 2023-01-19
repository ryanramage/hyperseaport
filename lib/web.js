const http = require('http')
const libNet = require('@hyper-cmd/lib-net')
const fixMeta = require('./fixMeta')
const connPiper = libNet.connPiper
//const { URL } = require('node:url')
const url = require('url')

module.exports = (config, registry, dht) => {
  const stats = {}
  const compress = config.compress || false

  const handler = async (req, res) => {
    const parts = url.parse(req.url)
    if (parts.pathname === '/') return root(req, res)

    const role = parts.pathname.split('/')[1]
    const newPath = '/' + parts.pathname.split('/').slice(2).join('/')


    if (!role || role.length === 0) return error('Invalid request role', req, res)
    const meta = fixMeta(role)
    const available = await registry.query(meta)
    if (!available || !available.length) return notFound(role, req, res)

    // choose a random one
    const choice = available[Math.floor(Math.random()*available.length)]
    const servicePublicKey = choice.servicePublicKey

    const key = Buffer.from(servicePublicKey, 'hex')
    const createSocket = () => dht.connect(key)
    const serverSocket = createSocket()

    serverSocket.on('data', (d) => {
      res.write(d)
      if (d.length < 65536)  {
        res.end()
        serverSocket.destroy()
      }
    })
    req.on('abort', () => {
      serverSocket.destroy()
    })
    req.on('error', () => {
      serverSocket.destroy()
    })

    const headers = []
    for (let i = 0; i < req.rawHeaders.length; i = i + 2) {
      const header = `${req.rawHeaders[i]}: ${req.rawHeaders[i+1]}`
      headers.push(header)
    }
    const head = `${req.method} ${newPath} HTTP/1.1\r\n` + headers.join('\r\n') + '\r\n\r\n'
    serverSocket.write(head)

    req.on('data', chunk => {
      serverSocket.write(chunk)
    })
  }

  const server = http.createServer(handler)
  server.on('clientError', (err, socket) => {
    if (err.code === 'ECONNRESET' || !socket.writable) {
      return;
    }

    socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
  })

  server.listen(config.web)
  return registry
}

function notFound(role, req, res) {
  res.writeHead(404, {
    'Content-Type': 'text/plain'
  })
  res.write(`role ${role} not found`)
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
