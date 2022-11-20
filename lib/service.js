const connHandler = require('hypertele/lib.js').connHandler
const net = require('net')

module.exports = (options) => new Promise((resolve, reject) => {
  // required
  const { port, host, keyPair, dht } = options

  // optional
  const debug = options.debug

  const stats = {}

  const server = dht.createServer({ reusableSocket: true }, c => {
    return connHandler(c, () => {
      // check allow list here
      return net.connect({ port, host, allowHalfOpen: true })
    }, { debug }, stats)
  })

  const getStats = () => stats // should clone

  server.listen(keyPair).then(() => {
    resolve({ dht, getStats })
  })
})
