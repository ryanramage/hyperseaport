const JRPC = require('json-rpc-on-a-stream')
const HyperDHT = require('@hyperswarm/dht')

module.exports = (remoteRegistryPublicKey) => {
  if (typeof remoteRegistryPublicKey === 'string') {
    remoteRegistryPublicKey = Buffer.from(remoteRegistryPublicKey, 'hex')
  }

  const cached = {}
  let rpc = null

  const connect = () => new Promise((resolve, reject) => {
    console.log('connecting to registry', remoteRegistryPublicKey.toString('hex'))
    const node = new HyperDHT()
    const socket = node.connect(remoteRegistryPublicKey)
    rpc = new JRPC(socket)
    socket.on('open', resolve)
  })

  const query = (meta) => rpc.request('query', meta)

  const waitFor = (meta) => {
    return new Promise((resolve, reject) => {
      rpc.request('waitFor', meta).then(registration => {
        console.log('found service', registration.info)
        cached[meta.hash] = registration
        resolve(registration.info.id)
      }).catch(reject)
    })
  }

  const get = (meta) => {
    const registration = this.cached[meta.hash]
    console.log('we found a registration', registration)
    return registration.info.id // the id is the servicePublicKey
  }

  const register = (meta, servicePublicKey) => {
    if (typeof servicePublicKey !== 'string') {
      servicePublicKey = servicePublicKey.toString('hex')
    }
    console.log('registered service', meta)

    rpc.request('register', { meta, servicePublicKey })
  }
  const destroy = () => rpc.destroy()
  return { connect, query, waitFor, get, register, destroy }
}
