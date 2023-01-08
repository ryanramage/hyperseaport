// the bridge between a localRegistry and a remoteRegistry to find the best servicePublicKey

module.exports = (opts, meta, localRegistry, bootServicePublicKey) => {
  if (!opts) opts = {}

  let available = [bootServicePublicKey]
  let roundRobin = 0

  const inc = () => (roundRobin >= available.length)  ? 0 : roundRobin++


  // it would be nice if we could be async but
  // https://github.com/prdn/hyper-cmd-lib-net/blob/main/index.js#L4 is
  // not allowing that
  const get = () => {
    if (!opts.mode || opts.mode === 'static-first') return available[0]
    if (opts.mode === 'static-roundRobin') return available[inc()]
  }

  const setMode = mode => opts.mode = mode
  const setAvailable = _available => available = _available

  return { get, setMode, inc, setAvailable }
}
