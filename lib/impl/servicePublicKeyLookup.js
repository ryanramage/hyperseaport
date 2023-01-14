// the bridge between a localRegistry and a remoteRegistry to find the best servicePublicKey
const Hash = require('./staticHash')

const perf =
  typeof performance === 'object' && // eslint-disable-line
  performance && // eslint-disable-line
  typeof performance.now === 'function' // eslint-disable-line
    ? performance // eslint-disable-line
    : Date

const now = () => perf.now()

module.exports = (opts, meta, localRegistry, keyPair) => {
  if (!opts) opts = {}

  const localBannedMS = opts.localBannedMS || 10000

  let available = []
  const localBanned = {}
  let roundRobin = 0
  const hash = Hash(keyPair)
  const inc = () => (roundRobin >= available.length) ? 0 : roundRobin++

  const get = async () => {
    await update()
    if (!opts.mode || opts.mode === 'static-first') return available[0]
    if (opts.mode === 'static-roundRobin') return available[inc()]
    if (opts.mode === 'static-hash') return hash.get(available)
  }

  const setMode = mode => { opts.mode = mode }

  const update = async () => {
    const list = await localRegistry.query(meta)
    available = []
    list.forEach(item => {
      const banned = localBanned[item.servicePublicKey]
      if (banned) {
        if (now() > banned + localBannedMS) delete localBanned[item.servicePublicKey]
        else return
      }
      available.push(item.servicePublicKey)
    })
    if (roundRobin > available.length) roundRobin = 0
  }
  const reportError = (servicePublicKey, err) => {
    console.log('error', err, 'reported on', servicePublicKey)
    localBanned[servicePublicKey] = now()
  }

  return { get, setMode, inc, update, reportError }
}
