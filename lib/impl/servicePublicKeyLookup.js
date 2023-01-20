// the bridge between a localRegistry and a remoteRegistry to find the best servicePublicKey
const Hash = require('./staticHash')
const goodbye = require('graceful-goodbye')

const perf =
  typeof performance === 'object' && // eslint-disable-line
  performance && // eslint-disable-line
  typeof performance.now === 'function' // eslint-disable-line
    ? performance // eslint-disable-line
    : Date

const now = () => perf.now()

module.exports = (opts, meta, localRegistry, keyPair) => {
  if (!opts) opts = {}

  const updateIntervalMS = opts.updateIntervalMS || 5000

  // the current service based on mode, available, and localBanned
  let chosenServicePublicKey = null

  // options around locally banned services
  const localBannedMS = opts.localBannedMS || 10000
  const localBanned = {}

  // helpers around load balancing modes
  let roundRobin = 0
  const hash = Hash(keyPair)
  const inc = (length) => (roundRobin >= length) ? 0 : roundRobin++
  const setMode = mode => { opts.mode = mode }

  // given a list of services, set the chosenServicePublicKey
  const choose = (list) => {
    const available = []
    list.forEach(item => {
      const banned = localBanned[item.servicePublicKey]
      if (banned) {
        if (now() > banned + localBannedMS) delete localBanned[item.servicePublicKey]
        else return
      }
      available.push(item.servicePublicKey)
    })
    if (roundRobin > available.length) roundRobin = 0

    if (!opts.mode || opts.mode === 'static-first') return available[0]
    if (opts.mode === 'static-roundRobin') {
      const index = inc(available.length)
      return available[index]
    }
    if (opts.mode === 'static-hash') return hash.get(available)
    // failback
    return available[0]
  }

  // run the update
  const update = async () => {
    const list = await localRegistry.query(meta)
    chosenServicePublicKey = choose(list)
    return chosenServicePublicKey
  }

  const reportError = (servicePublicKey, err) => {
    console.log('error', err, 'reported on', servicePublicKey)
    localBanned[servicePublicKey] = now()
  }

  const get = () => chosenServicePublicKey

  let interval = null

  // cleanup
  const destroy = () => {
    if (interval) clearInterval(interval)
  }

  if (!opts.dontRunUpdater) {
    // our updater. in future lets listen for changes
    interval = setInterval(update, updateIntervalMS)

    // right away update the list
    setImmediate(update)

    goodbye(() => destroy())
  }

  return { get, setMode, choose, reportError, destroy }
}
