#!/usr/bin/env node
const rc = require('rc')
const HyperDHT = require('@hyperswarm/dht')
const fixMeta = require('./lib/fixMeta')
const randomBytes = require('./lib/randomBytes')
const LocalRegistry = require('./lib/localRegistry')
const RegistryServer = require('./lib/registryServer')
const SimpleMemoryRegistry = require('./lib/impl/simpleMemoryRegistry')
const Service = require('./lib/service')
const Proxy = require('./lib/proxy')

function registry (options) {
  const seedStr = options.registrySeed || randomBytes(32).toString('hex')
  const seed = Buffer.from(seedStr, 'hex')
  const keyPair = HyperDHT.keyPair(seed)

  const registry = SimpleMemoryRegistry()
  const registryServer = RegistryServer(registry, options.dhtOptions, keyPair)
  registryServer.start().then(keyPair => {
    console.log('Registry started')
    console.log(`registryPublicKey=${keyPair.publicKey.toString('hex')}`)
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
    const localRegistry = LocalRegistry(registryPublicKey)
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
  const seed = Buffer.from(seedStr, 'hex')
  const keyPair = HyperDHT.keyPair(seed)
  const dht = new HyperDHT(keyPair)
  localRegistry.connect().then(() => {
    console.log('connected to registry')
    localRegistry.waitFor(meta).then(servicePublicKey => {
      console.log('starting', port, servicePublicKey)
      Proxy({ port, servicePublicKey, dht }).then(({ getStats }) => {
        console.log('proxy from ', port, 'to p2p service', servicePublicKey)
        process.once('SIGINT', function () {
          dht.destroy()
        })
      })
    }).catch(e => {
      console.log('unable to find service', e)
      localRegistry.destroy()
      process.exit(-1)
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
