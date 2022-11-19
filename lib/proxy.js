const HyperDHT = require('@hyperswarm/dht')
const connHandler = require('hypertele/lib.js').connHandler
const net = require('net')

module.exports = (port, keyPair, servicePublicKey) => new Promise((resolve, reject) => {
  const stats = {}
  const dht = new HyperDHT(keyPair)
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
