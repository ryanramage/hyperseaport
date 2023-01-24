const Hyperbee = require('hyperbee')
const RoleLookup = require('./roleLookup')
const b4a = require('b4a')

module.exports = async (store, swarm, remoteKey) => {
  const core = store.get({ key: b4a.from(remoteKey, 'hex') })
  const hyperbee = new Hyperbee(core, { keyEncoding: 'utf-8', valueEncoding: 'json' })
  const roleLookup = RoleLookup(hyperbee)

  await core.ready()

  const query = async (meta) => {
    const { role, version } = meta
    return roleLookup.find(role, version)
  }
  const registry = { query }

  swarm.join(core.discoveryKey)
  return registry
}
