const getPorts = require('getports')
const map = require('async/mapLimit')
const parallel = require('async/parallel')
const HyperDHT = require('@hyperswarm/dht')
const fixMeta = require('./lib/fixMeta')
const LocalRegistry = require('./lib/localRegistry')

module.exports = (roles, options) => {
  // required things
  const { registryPubKey, keyPair } = options

  // optional things
  const localRegistry = options.localRegistry || LocalRegistry(registryPubKey)
  const dht = options.dht || new HyperDHT(keyPair)

  const internals = { dht, localRegistry, connected: [] }

  // allow the caller to inspect and clean up things
  const getInternals = () => internals
  const destroy = () => {
    dht.destroy()
    localRegistry.destroy()
  }

  const setup = () => new Promise((resolve, reject) => {
    const tasks = {
      ports: cb => getPorts(roles.length, cb),
      localRegistry: cb => localRegistry.connect().then(() => cb())
    }
    parallel(tasks, (err, { ports }) => {
      if (err) return reject(err)
      const todo = roles.map((role, i) => ({ localRegistry, dht, role, port: ports[i] }))
      map(todo, 1, createService, (err, connected) => {
        if (err) return reject(err)
        internals.connected = connected
        resolve(connected)
      })
    })
  })

  return { setup, getInternals, destroy }
}

function createService ({ localRegistry, dht, role, port }, cb) {
  const meta = fixMeta(role)
  const onComplete = ({ getStats }) => cb(null, { role, port, meta, getStats })
  const onService = servicePublicKey => Proxy({ port, servicePublicKey, dht })
    .then(onComplete).catch(cb)

  localRegistry.waitFor(meta).then(onService).catch(cb)
}
