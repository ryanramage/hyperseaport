// const {Service, KeyPair} = require('hypersearport')
const { Service, KeyPair } = require('../../')

// Boilerplate node
const http = require('http')
const port = 8992
const requestListener = function (req, res) {
  res.writeHead(200)
  res.end('Hello, World!')
}
const server = http.createServer(requestListener)
server.listen(port)

// The intersting stuff!!
const registryPublicKey = process.argv[2] // we need one thing from the cli
console.log(registryPublicKey)
const role = 'helloworld@1.0.0'
const keyPair = KeyPair()
const service = Service({ registryPublicKey, role, port, keyPair })
service.setup().then(() => console.log('service connected'))

process.once('SIGINT', function () {
  service.destroy()
})
