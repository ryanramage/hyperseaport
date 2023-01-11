const Hyperswarm = require('hyperswarm')
const Corestore = require('corestore')
const Hyperbee = require('hyperbee')
const RoleLookup = require('./roleLookup')
const b4a = require('b4a')
const goodbye = require('graceful-goodbye')

module.exports = async (storage, onConnection) => {
  const store = new Corestore(storage)
  const swarm = new Hyperswarm()
  goodbye(() => swarm.destroy())
  swarm.on('connection', conn => {
    store.replicate(conn)
    if (onConnection) onConnection(conn)
  })
  const core = store.get({ name: 'roleLookup' })
  const hyperbee = new Hyperbee(core, { keyEncoding: 'utf-8', valueEncoding: 'json' })
  const roleLookup = RoleLookup(hyperbee)

  await core.ready()
  const discovery = swarm.join(core.discoveryKey)
  await discovery.flushed()

  const getKey = () => b4a.toString(core.key, 'hex')

  const register = async (servicePublicKey, remotePublicKey, meta) => {
    const { role, version } = meta
    await roleLookup.add(role, version, servicePublicKey)
  }

  const unregister = async (servicePublicKey, remotePublicKey, meta) => {
    const { role, version } = meta
    await roleLookup.del(role, version, servicePublicKey)
  }

  const query = async (meta) => {
    const { role, version } = meta
    return await roleLookup.find(role, version)
  }
  const destroy = () => swarm.destroy()
  return { register, unregister, query, getKey, destroy }
}

