const net = require('net')
const connHandler = require('hypertele/lib.js').connHandler

module.exports = (options) => new Promise((resolve, reject) => {
  // required things
  const { port, servicePublicKey, dht } = options

  const stats = {}
  const proxy = net.createServer({ allowHalfOpen: true }, c => {
    return connHandler(c, () => {
      return dht.connect(Buffer.from(servicePublicKey, 'hex'), { reusableSocket: true })
    }, {}, stats)
  })

  const getStats = () => stats // should clone

  proxy.listen(port, () => {
    resolve({ dht, getStats })
  })
})
