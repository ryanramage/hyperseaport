const getPorts = require('getports')
const map = require('async/mapLimit')
const parallel = require('async/parallel')
const HyperDHT = require('hyperdht')
const fixMeta = require('./lib/fixMeta')
const LocalRegistry = require('./lib/localRegistry')
const ServicePublicKeyLookup = require('./lib/impl/servicePublicKeyLookup')
const Proxy = require('./lib/proxyDynamic')

module.exports = (roles, options) => {
  // required things
  const { registryPublicKey, keyPair } = options

  // optional things
  const localRegistry = options.localRegistry || LocalRegistry(registryPublicKey)
  const dht = options.dht || new HyperDHT(keyPair)
  const loadBalanceOptions = options.loadBalanceOptions || {}

  const internals = { dht, localRegistry, connected: [] }

  // allow the caller to inspect and clean up things
  const getInternals = () => internals
  const destroy = () => {
    localRegistry.destroy()
    return dht.destroy()
  }

  const setup = () => new Promise((resolve, reject) => {
    const tasks = {
      ports: cb => getPorts(roles.length, cb),
      localRegistry: cb => localRegistry.connect().then(() => cb())
    }
    parallel(tasks, (err, { ports }) => {
      if (err) return reject(err)
      const todo = roles.map((role, i) => {
        const port = ports[i]
        const url = `http://localhost:${port}`
        return { localRegistry, loadBalanceOptions, keyPair, dht, role, port, url }
      })
      map(todo, 1, createService, (err, connected) => {
        if (err) return reject(err)
        internals.connected = connected
        setTimeout(() => resolve(connected), 100) // TODO - for some reason we need this on the node usage example
      })
    })
  })

  return { setup, getInternals, destroy }
}

function createService ({ localRegistry, loadBalanceOptions, keyPair, dht, role, port, url }, cb) {
  const meta = fixMeta(role)
  const servicePublicKeyLookup = ServicePublicKeyLookup(loadBalanceOptions, meta, localRegistry, keyPair)
  const onComplete = ({ getStats }) => cb(null, { role, port, url, meta, getStats, servicePublicKeyLookup })
  Proxy({ port, servicePublicKeyLookup, dht }).then(onComplete).catch(cb)
}
