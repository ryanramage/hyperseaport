const libNet = require('@hyper-cmd/lib-net')
const libKeys = require('@hyper-cmd/lib-keys')
const net = require('net')
const connPiper = libNet.connPiper

module.exports = (options) => new Promise((resolve, reject) => {
  // required
  const { port, host, dht, keyPair } = options

  // optional
  const debug = options.debug
  const allow = options.allow
  const compress = options.compress || false

  const stats = {}

  const server = dht.createServer({
    firewall: (remotePublicKey, remoteHandshakePayload) => {
      if (allow && !libKeys.checkAllowList(allow, remotePublicKey)) {
        return true
      }

      return false
    },
    reusableSocket: true
  }, c => {
    connPiper(c, () => {
      return net.connect({ port, host, allowHalfOpen: true })
    }, { debug, isServer: true, compress }, stats)
  })

  const getStats = () => stats // should clone

  server.listen(keyPair).then(() => {
    resolve({ dht, getStats })
  })
})
