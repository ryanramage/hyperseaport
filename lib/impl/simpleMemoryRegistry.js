const semver = require('semver')
const RoleLookup = require('../roleLookup')

module.exports = (opts) => {
  if (!opts) opts = {}
  opts.waitForTimeout = opts.waitForTimeout || 15000
  opts.waitForExpiryInterval = opts.waitForExpiryInterval || 1000

  const registry = RoleLookup()
  const servicePublicKeyByRemotePublicKey = {}

  // data structures for waiting on a service to appear
  const waiting = []

  const interval = setInterval(() => {
    const now = Date.now()
    waiting.forEach((details, i) => {
      if (now < details.expires) return
      if (details.reject) process.nextTick(() => details.reject(new Error('timeout waiting for service')))
      waiting.splice(i)
    })
  }, opts.waitForExpiryInterval)

  // on a new service registration, this will resolve clients that were waiting
  const checkWaitingFor = (meta, registation) => {
    waiting.forEach((details, i) => {
      if (details.meta.role !== meta.role) return
      if (!semver.satisfies(meta.version, details.meta.version)) return
      if (details.resolve) process.nextTick(() => details.resolve(registation))
      waiting.splice(i)
    })
  }
  /* public methods below, used by RPC */

  const stopWaitingForExpiry = () => clearInterval(interval)

  const query = (meta) => {
    const registrations = registry.get(meta)
    const entry = getRandomIntInclusive(0, registrations.list.length - 1)
    return registrations.list[entry]
  }

  const waitFor = async (meta) => {
    const details = query(meta)
    if (details) return details
    return new Promise((resolve, reject) => {
      const expires = Date.now() + opts.waitForTimeout
      waiting.push({ resolve, reject, meta, expires })
    })
  }

  const register = (servicePublicKey, remotePublicKey, meta) => {
    const registration = { id: servicePublicKey, remotePublicKey, meta }
    registry.add(meta, registration)
    const byRemotePublicKey = servicePublicKeyByRemotePublicKey[remotePublicKey] || []
    byRemotePublicKey.push(servicePublicKey)
    servicePublicKeyByRemotePublicKey[remotePublicKey] = byRemotePublicKey
    checkWaitingFor(meta, registration)
    console.log('registered service', registration)
    return { meta, ok: true }
  }

  const remove = (remotePublicKey) => {
    // remove all services associated with this remotePublicKey
    const byRemotePublicKey = servicePublicKeyByRemotePublicKey[remotePublicKey] || []
    byRemotePublicKey.forEach(servicePublicKey => {
      registry.remove(servicePublicKey)
      // should notify anyone using this to change to another service
    })
    delete servicePublicKeyByRemotePublicKey[remotePublicKey]
  }

  return { query, register, waitFor, remove, stopWaitingForExpiry }
}

function getRandomIntInclusive (min, max) {
  min = Math.ceil(min)
  max = Math.floor(max)
  return Math.floor(Math.random() * (max - min + 1) + min) // The maximum is inclusive and the minimum is inclusive
}
