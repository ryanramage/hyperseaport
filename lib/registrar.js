const JRPC = require('json-rpc-on-a-stream')
const HyperDHT = require('@hyperswarm/dht')

module.exports = (writerRegistry, dhtOptions, keyPair) => {
  if (!keyPair) keyPair = HyperDHT.keyPair()
  const node = new HyperDHT(dhtOptions)
  const rpcConnections = []
  const server = node.createServer()
  server.on('connection', (noiseSocket) => {
    // could check an allow list here

    const remotePublicKey = noiseSocket.remotePublicKey.toString('hex')

    const rpc = new JRPC(noiseSocket)
    rpc.respond('register', async ({ meta, servicePublicKey }) => writerRegistry.register(servicePublicKey, remotePublicKey, meta))
    rpc.respond('unregister', async ({ meta, servicePublicKey }) => writerRegistry.unregister(servicePublicKey, remotePublicKey, meta))
    rpc.respond('query', async (meta) => writerRegistry.query(meta))
    rpc.respond('getRegistryKey', () => writerRegistry.getRegistryKey())
    rpcConnections.push(rpc)

    // closing the connection should not remove it for now
    // they have to unregister
    // noiseSocket.on('close', () => writerRegistry.remove(remotePublicKey))
  })

  const start = () => new Promise((resolve, reject) => {
    server.listen(keyPair).then(resolve(keyPair)).catch(reject)
  })

  return { start }
}
