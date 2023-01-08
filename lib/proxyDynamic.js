const libNet = require('@hyper-cmd/lib-net')
const connPiper = libNet.connPiper

// like proxy, but look up the service to use everytime

module.exports = (options) => new Promise((resolve, reject) => {
  // required things
  const { port, servicePublicKeyLookup, dht } = options

  // optional
  const compress = options.compress || false

  const stats = {}
  const proxy = net.createServer({ allowHalfOpen: true }, c => {
    return connPiper(c, () => {
      const servicePublicKey = servicePublicKeyLookup.get()
      return dht.connect(Buffer.from(servicePublicKey, 'hex'), { reusableSocket: true })
    }, { compress }, stats)
  })

  const getStats = () => stats // should clone

  proxy.listen(port, (e) => {
    if (e) return reject(e)
    resolve({ dht, getStats })
  })
})
