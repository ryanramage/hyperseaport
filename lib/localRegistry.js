const JRPC = require('json-rpc-on-a-stream')
const HyperDHT = require('@hyperswarm/dht')
const RAM = require('random-access-memory')
const Corestore = require('corestore')
const goodbye = require('graceful-goodbye')
const b4a = require('b4a')
const Logger = require('./logger') 
const ReaderRegistry = require('../lib/impl/readerRegistry')

module.exports = (remoteRegistryPublicKey, options) => {
  if (typeof remoteRegistryPublicKey === 'string') {
    remoteRegistryPublicKey = Buffer.from(remoteRegistryPublicKey, 'hex')
  }
  if (!options) options = {}
  const skipReaderRegistry = options.skipReaderRegistry || false

  const storage = options.readerStorageDir || RAM

  const store = new Corestore(storage)
  const swarm = new Hyperswarm()
  goodbye(() => swarm.destroy())

  const destroy = () => swarm.destroy()
  swarm.on('connection', conn => {
    store.replicate(conn)
  })
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
      readerRegistry = await ReaderRegistry(store, writerKey)
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
  
  const logger = async (logStream, publicKey) => {
    const core = store.get({ name: 'logs' })
    await core.ready()
    Logger(logStream, core)
    const loggerKey = b4a.toString(core.key, 'hex')
    await rpc.request('logger', {publickKey, loggerKey}
    return loggerKey
  }

  const destroy = () => {
    swarm.destroy()
    rpc.destroy()
  }

  return {
    connect,
    query,
    register,
    unregister,
    logger,
    destroy
  }
}
