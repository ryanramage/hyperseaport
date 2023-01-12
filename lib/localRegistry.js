const JRPC = require('json-rpc-on-a-stream')
const HyperDHT = require('@hyperswarm/dht')

module.exports = (remoteRegistryPublicKey) => {
  if (typeof remoteRegistryPublicKey === 'string') {
    remoteRegistryPublicKey = Buffer.from(remoteRegistryPublicKey, 'hex')
  }

  let rpc = null

  const connect = () => new Promise((resolve, reject) => {
    if (rpc) return resolve() // in case connect is called more than once
    console.log('connecting to registry', remoteRegistryPublicKey.toString('hex'))
    const node = new HyperDHT()
    const socket = node.connect(remoteRegistryPublicKey)
    rpc = new JRPC(socket)
    socket.on('open', resolve)

    // should have some reconnect logic here
    socket.on('error', () => {})
  })

  const query = (meta) => rpc.request('query', meta)

  const waitFor = (meta) => {
    return new Promise((resolve, reject) => {
      rpc.request('waitFor', meta).then(registration => {
        console.log('found service', registration.info)
        resolve(registration.info.id)
      }).catch(reject)
    })
  }

  const register = (meta, servicePublicKey) => {
    if (typeof servicePublicKey !== 'string') {
      servicePublicKey = servicePublicKey.toString('hex')
    }
    console.log('registered service', meta)

    rpc.request('register', { meta, servicePublicKey })
  }

  // should be fast as can be, as this is inside a network request
  const servicePublicKeyLookup = async (meta) => {

  }

  const destroy = () => rpc.destroy()
  return { connect, query, waitFor, servicePublicKeyLookup, register, destroy }
}
