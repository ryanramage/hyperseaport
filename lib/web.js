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
    console.log('in handler')
    const parts = url.parse(req.url)
    if (parts.pathname === '/') return root(req, res)

    const role = parts.pathname.split('/')[1]
    // const new_path = parts.pathname.split('/').slice(2).join('/')
    // parts.pathname = '/' + new_path

    if (!role || role.length === 0) return error('Invalid request role', req, res)
    console.log('role', role)
    const meta = fixMeta(role)
    console.log('got meta', meta)
    const available = await registry.query(meta)
    if (!available || !available.length) return error('none found', req, res)

    // for now, we will refactor choose from servicePublicKeyLookup
    const choice = available[0]
    const servicePublicKey = choice.servicePublicKey

    const key = Buffer.from(servicePublicKey, 'hex')
    const createSocket = () => dht.connect(key)
    const serverSocket = createSocket()
    serverSocket.on('data', d => {
      res.write(d)
      res.end()
    })
    serverSocket.write('GET / HTTP/1.1\r\n')
    const headers = []
    for (let i = 0; i < req.rawHeaders.length; i = i + 2) {
      const header = `${req.rawHeaders[i]}: ${req.rawHeaders[i+1]}`
      headers.push(header)
    }
    const head = headers.join('\r\n') + '\r\n\r\n'
    serverSocket.write(head)
 
    serverSocket.on('error', destroy).on('close', destroy)

    let destroyed = false
    function destroy (err) {
      console.log('destroy called', err)
      if (destroyed) return
      destroyed = true
      res.end()
      console.log('ended')
      serverSocket.destroy(err)
    }

  }

  const server = http.createServer(handler)


  server.listen(config.web)
  return registry
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
