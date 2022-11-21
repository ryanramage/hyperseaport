// const {Service, KeyPair} = require('hypersearport')
const {Service, KeyPair} = require('../../')

// Boilerplate node
const http = require('http')
const port = 8992
const requestListener = function (req, res) {
  res.writeHead(200);
  res.end('Hello, World!')
}
const server = http.createServer(requestListener)
server.listen(port)

// The intersting stuff!!
const registryPubKey = process.argv[2] // we need one thing from the cli!
const role = 'helloworld@1.0.0'
const keyPair = KeyPair()
const service = Service({ registryPubKey, role, port, keyPair })
service.setup()

process.once('SIGINT', function () {
  service.destroy()
})
