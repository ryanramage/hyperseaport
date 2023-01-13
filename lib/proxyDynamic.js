const net = require('net')
const libNet = require('@hyper-cmd/lib-net')
const connPiper = libNet.connPiper

// like proxy, but look up the service to use everytime

module.exports = (options) => new Promise((resolve, reject) => {
  // required things
  const { port, servicePublicKeyLookup, dht } = options
  // optional
  const compress = options.compress || false

  const stats = {}

  const onConnection = async (c) => {
    const servicePublicKey = await servicePublicKeyLookup.get()
    const key = Buffer.from(servicePublicKey, 'hex')
    const createSocket = () => dht.connect(key, { reusableSocket: true })
    const onDestroy = (err) => {
      if (!err) return
      servicePublicKeyLookup.reportError(servicePublicKey, err)
    }
    connPiper(c, createSocket, { compress, onDestroy }, stats)
  }

  const proxy = net.createServer({ allowHalfOpen: true }, onConnection)

  const getStats = () => stats // should clone

  proxy.listen(port, (e) => {
    if (e) return reject(e)
    resolve({ dht, getStats })
  })
})
