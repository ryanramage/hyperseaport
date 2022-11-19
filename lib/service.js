const HyperDHT = require('@hyperswarm/dht')
const connHandler = require('hypertele/lib.js').connHandler
const net = require('net')

module.exports = (port, host, keyPair, allow, debug) => new Promise((resolve, reject) => {
  const stats = {}
  const dht = new HyperDHT()
  const server = dht.createServer({ reusableSocket: true }, c => {
    return connHandler(c, () => {
      // check allow list here
      return net.connect({ port, host, allowHalfOpen: true })
    }, { debug: debug }, stats)
  })

  const getStats = () => stats // should clone

  server.listen(keyPair).then(() => {
    resolve({ dht, getStats })
  })
})
