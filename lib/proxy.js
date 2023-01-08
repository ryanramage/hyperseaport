const net = require('net')
const libNet = require('@hyper-cmd/lib-net')
const connPiper = libNet.connPiper

module.exports = (options) => new Promise((resolve, reject) => {
  // required things
  const { port, servicePublicKey, dht } = options

  // optional
  const compress = options.compress || false

  const stats = {}
  const proxy = net.createServer({ allowHalfOpen: true }, c => {
    return connPiper(c, () => {
      return dht.connect(Buffer.from(servicePublicKey, 'hex'), { reusableSocket: true })
    }, { compress }, stats)
  })

  const getStats = () => stats // should clone

  proxy.listen(port, () => {
    resolve({ dht, getStats })
  })
})
