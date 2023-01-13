// the bridge between a localRegistry and a remoteRegistry to find the best servicePublicKey
const Hash = require('./staticHash')

module.exports = (opts, meta, localRegistry, keyPair) => {
  if (!opts) opts = {}

  let available = []
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
    available = list.map(item => item.servicePublicKey)
    if (roundRobin > available.length) roundRobin = 0
  }
  const reportError = (servicePublicKey, err) => {
    console.log('error', err, 'reported on', servicePublicKey)
  }

  return { get, setMode, inc, update, reportError }
}
