// the bridge between a localRegistry and a remoteRegistry to find the best servicePublicKey
const Hash = require('./staticHash')

module.exports = (opts, meta, localRegistry, keyPair ) => {
  if (!opts) opts = {}

  let available = []
  let roundRobin = 0
  const hash = Hash(keyPair)
  const inc = () => (roundRobin >= available.length) ? 0 : roundRobin++

  // it would be nice if we could be async but
  // https://github.com/prdn/hyper-cmd-lib-net/blob/main/index.js#L4 is
  // not allowing that
  const get = () => {
    if (!opts.mode || opts.mode === 'static-first') return available[0]
    if (opts.mode === 'static-roundRobin') return available[inc()]
    if (opts.mode === 'static-hash') return hash.get(available)
  }

  const setMode = mode => { opts.mode = mode }
  const setAvailable = _available => {
    available = _available
    if (roundRobin > available.length) roundRobin = 0
  }

  return { get, setMode, inc, setAvailable }
}
