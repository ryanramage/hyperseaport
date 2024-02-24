const Hyperswarm = require('hyperswarm')
const Corestore = require('corestore')
const Hyperbee = require('hyperbee')
const RoleLookup = require('./roleLookup')
const b4a = require('b4a')
const goodbye = require('graceful-goodbye')

module.exports = async (storage, remoteKey, onConnection) => {
  const store = new Corestore(storage)
  const swarm = new Hyperswarm()
  goodbye(() => swarm.destroy())
  const core = store.get({ key: b4a.from(remoteKey, 'hex') })
  const hyperbee = new Hyperbee(core, { keyEncoding: 'utf-8', valueEncoding: 'json' })
  const roleLookup = RoleLookup(hyperbee)

  await core.ready()
  await hyperbee.ready()

  const query = async (meta) => {
    const { role, version } = meta
    return roleLookup.find(role, version)
  }
  const destroy = () => swarm.destroy()
  const registry = { query, destroy }
  swarm.on('connection', async conn => {
    store.replicate(conn)
    await core.update({ wait: true })
    // this can be called multiple times
    if (onConnection) onConnection(conn, registry)
  })

  swarm.join(core.discoveryKey)
  return registry
}
