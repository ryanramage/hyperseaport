const fixMeta = require('./lib/fixMeta')
const Service = require('./lib/service')
const LocalRegistry = require('./lib/localRegistry')

// a very light wrapping around the internal service
// should just make it easy to spin up a service with little config

module.exports = (options) => {
  // required things
  const { registryPubKey, role, port, keyPair } = options

  // optional things
  const host = options.host || '127.0.0.1'
  const allow = options.allow // a list of publicKeys allowed to access the service
  const localRegistry = options.localRegistry || LocalRegistry(registryPubKey)
  const meta = fixMeta(role)

  const internals = { dht: null, getStats: null, localRegistry }

  // allow the caller to inspect and clean up things
  const getInternals = () => internals
  const destroy = () => {
    if (dht) dht.destroy()
    localRegistry.destroy()
  }

  const setup = () => new Promise((resolve, reject) => {
    Service(port, host, keyPair, allow).then(({ dht, getStats }) => {
      localRegistry.connect().then(() => {
        localRegistry.register(meta, keyPair.publicKey)
        resolve()
      })
    })
  })

  return { setup, getInternals, destroy }
}
