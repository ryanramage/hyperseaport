const JRPC = require('json-rpc-on-a-stream')
const HyperDHT = require('hyperdht')
const ReaderRegistry = require('../lib/impl/readerRegistry')
const RAM = require('random-access-memory')

module.exports = (remoteRegistryPublicKey, options) => {
  if (typeof remoteRegistryPublicKey === 'string') {
    remoteRegistryPublicKey = Buffer.from(remoteRegistryPublicKey, 'hex')
  }
  if (!options) options = {}
  const skipReaderRegistry = options.skipReaderRegistry || false

  const readerStorage = options.readerStorageDir || RAM

  let rpc = null
  let readerRegistry = null
  const readerConnected = false

  const connect = () => new Promise((resolve, reject) => {
    if (rpc) return resolve() // in case connect is called more than once
    console.log('connecting to registry', remoteRegistryPublicKey.toString('hex'))
    const node = new HyperDHT()
    const socket = node.connect(remoteRegistryPublicKey)
    rpc = new JRPC(socket)
    socket.on('open', async () => {
      if (skipReaderRegistry) return resolve()
      const writerKey = await rpc.request('getRegistryKey')
      const onReaderConnect = () => {
        console.log('reader registry ready')
      }
      readerRegistry = await ReaderRegistry(readerStorage, writerKey, onReaderConnect)
      resolve()
    })

    // should have some reconnect logic here
    socket.on('error', () => {})
  })

  const query = async (meta) => {
    if (!readerRegistry) return await rpc.request('query', meta)
    if (!readerConnected) return await rpc.request('query', meta)
    return await readerRegistry.query(meta)
  }

  const register = (meta, servicePublicKey) => {
    if (typeof servicePublicKey !== 'string') {
      servicePublicKey = servicePublicKey.toString('hex')
    }
    rpc.request('register', { meta, servicePublicKey })
    console.log('registered service', meta)
  }

  const unregister = (meta, servicePublicKey) => {
    rpc.request('unregister', { meta, servicePublicKey })
  }

  const destroy = () => {
    if (readerRegistry) readerRegistry.destroy()
    rpc.destroy()
  }

  return {
    connect,
    query,
    register,
    unregister,
    destroy
  }
}
