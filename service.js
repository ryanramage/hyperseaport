const HyperDHT = require('@hyperswarm/dht')
const fixMeta = require('./lib/fixMeta')
const Service = require('./lib/service')
const LocalRegistry = require('./lib/localRegistry')

// a very light wrapping around the internal service
// should just make it easy to spin up a service with little config

module.exports = (options) => {
  // required things
  const { registryPublicKey, role, port, keyPair } = options

  // optional things
  const host = options.host || '127.0.0.1'
  const allow = options.allow // a list of publicKeys allowed to access the service
  const localRegistry = options.localRegistry || LocalRegistry(registryPublicKey, { skipReaderRegistry: true })
  const meta = fixMeta(role)
  const dht = options.dht || new HyperDHT()

  const internals = { dht, localRegistry, getStats: null }

  // allow the caller to inspect and clean up things
  const getInternals = () => internals
  const destroy = () => {
    localRegistry.destroy()
    return dht.destroy()
  }

  const setup = () => new Promise((resolve, reject) => {
    Service({ port, host, keyPair, allow, dht }).then(({ dht, getStats }) => {
      localRegistry.connect().then(() => {
        localRegistry.register(meta, keyPair.publicKey)
        resolve()
      })
    })
  })

  return { setup, getInternals, destroy }
}
