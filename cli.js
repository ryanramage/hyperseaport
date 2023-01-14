#!/usr/bin/env node
const rc = require('rc')
const HyperDHT = require('@hyperswarm/dht')
const fixMeta = require('./lib/fixMeta')
const randomBytes = require('./lib/randomBytes')
const LocalRegistry = require('./lib/localRegistry')
const Registrar = require('./lib/registrar')
const WriterRegistry = require('./lib/impl/WriterRegistry')
const ServicePublicKeyLookup = require('./lib/impl/servicePublicKeyLookup')
const Service = require('./lib/service')
const Proxy = require('./lib/proxyDynamic')
const dataDir = require('./lib/dataDir')

function registry (options) {
  const seedStr = options.registrySeed || randomBytes(32).toString('hex')
  const seed = Buffer.from(seedStr, 'hex')
  const keyPair = HyperDHT.keyPair(seed)

  const storageDir = options.registryDir || dataDir('hyperseaport')

  const writerRegistry = WriterRegistry(storageDir)
  writerRegistry.start().then(writerKey => {
    console.log('Writer started.')
    console.log(`storing in ${storageDir}`)
    const registrar = Registrar(writerRegistry, options.dhtOptions, keyPair)
    registrar.start().then(keyPair => {
      console.log('Registry started.')
      console.log(`registryPublicKey=${keyPair.publicKey.toString('hex')}`)
    })
  })
}

function service (options) {
  const { port, role, registryPublicKey } = options
  if (!port) {
    console.log('running client on cli needs a port specified. use -p <port>')
    process.exit(1)
  }
  const meta = fixMeta(role)
  const dht = new HyperDHT()
  const host = '127.0.0.1'
  const seedStr = options.seed || randomBytes(32).toString('hex')
  const seed = Buffer.from(seedStr, 'hex')
  const keyPair = HyperDHT.keyPair(seed)

  const opts = { host, port, dht, keyPair }
  Service(opts).then(({ dht, getStats }) => {
    console.log('started p2p service on', keyPair.publicKey.toString('hex'))

    const localRegistry = LocalRegistry(registryPublicKey, { skipReaderRegistry: true })
    localRegistry.connect().then(() => {
      localRegistry.register(meta, keyPair.publicKey)
    })
    process.once('SIGINT', function () {
      dht.destroy()
      localRegistry.destroy()
    })
  })
}

function proxy (options) {
  const { port, role, registryPublicKey } = options
  const meta = fixMeta(role)
  const localRegistry = LocalRegistry(registryPublicKey)
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
const command = options._[0]

if (command === 'seed') {
  const seedStr = randomBytes(32).toString('hex')
  const seed = Buffer.from(seedStr, 'hex')
  const keyPair = HyperDHT.keyPair(seed)
  console.log(`registrySeed=${seedStr}`)
  console.log(`registryPublicKey=${keyPair.publicKey.toString('hex')}`)
  process.exit()
}

if (command === 'registry') registry(options)
else if (command === 'service') service(options)
else if (command === 'proxy') proxy(options)
else registry(options)
