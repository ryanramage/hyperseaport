#!/usr/bin/env node
const rc = require('rc')
const HyperDHT = require('@hyperswarm/dht')
const fixMeta = require('../lib/fixMeta')
const randomBytes = require('../lib/randomBytes')
const LocalRegistry = require('../lib/localRegistry')
const ServicePublicKeyLookup = require('../lib/impl/servicePublicKeyLookup')
const Proxy = require('../lib/proxyDynamic')

function proxy (options) {
  const { port, role, registryPublicKey } = options
  const meta = fixMeta(role)

  if (!options.skipReaderRegistry) options.skipReaderRegistry = true

  const localRegistry = LocalRegistry(registryPublicKey, options)
  const seedStr = options.seed || randomBytes(32).toString('hex')
  const loadBalanceOptions = options.loadBalanceOptions || {}
  const seed = Buffer.from(seedStr, 'hex')
  const keyPair = HyperDHT.keyPair(seed)
  const dht = new HyperDHT(keyPair)
  localRegistry.connect().then(() => {
    console.log('connected to registry')
    const servicePublicKeyLookup = ServicePublicKeyLookup(loadBalanceOptions, meta, localRegistry, keyPair)
    Proxy({ port, servicePublicKeyLookup, dht }).then(({ getStats }) => {
      process.once('SIGINT', function () {
        dht.destroy()
      })
    })
  })
}

const options = rc('hyperseaport')

proxy(options)
