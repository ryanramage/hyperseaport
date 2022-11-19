const JRPC = require('json-rpc-on-a-stream')
const HyperDHT = require('@hyperswarm/dht')

module.exports = (registryImpl, dhtOptions, keyPair) => {
  if (!keyPair) keyPair = HyperDHT.keyPair()
  const node = new HyperDHT(dhtOptions)
  const rpcConnections = []
  const server = node.createServer()
  server.on('connection', (noiseSocket) => {
    // could check an allow list here

    const remotePublicKey = noiseSocket.remotePublicKey.toString('hex')

    const rpc = new JRPC(noiseSocket)
    rpc.respond('register', async ({ meta, servicePublicKey }) => registryImpl.register(servicePublicKey, remotePublicKey, meta))
    rpc.respond('waitFor', async (meta) => await registryImpl.waitFor(meta))
    rpc.respond('query', async (meta) => registryImpl.query(meta))
    rpcConnections.push(rpc)

    noiseSocket.on('close', () => registryImpl.remove(remotePublicKey))
  })

  const start = () => new Promise((resolve, reject) => {
    server.listen(keyPair).then(resolve(keyPair)).catch(reject)
  })

  return { start }
}
