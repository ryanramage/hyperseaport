const JRPC = require('json-rpc-on-a-stream')
const HyperDHT = require('@hyperswarm/dht')

module.exports = (remoteRegistryPublicKey) => {
  if (typeof remoteRegistryPublicKey === 'string') {
    remoteRegistryPublicKey = Buffer.from(remoteRegistryPublicKey, 'hex')
  }

  const cached = {}
  let rpc = null

  const connect = () => new Promise((resolve, reject) => {
    if (rpc) return resolve() // in case connect is called more than once
    console.log('connecting to registry', remoteRegistryPublicKey.toString('hex'))
    const node = new HyperDHT()
    const socket = node.connect(remoteRegistryPublicKey)
    rpc = new JRPC(socket)

    /* events that can be sent from the registryServer */

    //onNodeAvailable - consumer is alerted that a new node is online that in in their watch list of services
    rpc.on('onNodeAvailable', async (registration) => {})

    // onNodeShutdown - consumer is alerted that a node is offline that is in their watch list of serviced
    rpc.on('onNodeShutdown', async (registration) => {})

    // useNode - registry is asking consumer to use a specific node
    rpc.on('useNode', async (registration) => {})

    // onNodeWeights - consumer is notified of updated weights for weighted loadBalancing
    rpc.on('onNodeWeights', async (nodeWeights) => {})

    // useLoadBalanceMode - registry is asking consumer to update loadBalance mode
    rpc.on('useLoadBalanceMode', async (registration) => {})

    socket.on('open', resolve)
  })

  // register a service
  const register = (meta, servicePublicKey) => {
    if (typeof servicePublicKey !== 'string') {
      servicePublicKey = servicePublicKey.toString('hex')
    }
    console.log('registered service', meta)
    rpc.request('register', { meta, servicePublicKey })
  }
  const destroy = () => rpc.destroy()
  return { connect, register, destroy }
}
