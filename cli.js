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

function registry (dhtOptions, keyPair) {
  const registry = SimpleMemoryRegistry()
  const registryServer = RegistryServer(registry, dhtOptions, keyPair)
  registryServer.start().then(keyPair => {
    console.log('Registry listening. Connect with pubkey ', keyPair.publicKey.toString('hex'))
  })
}

function service (registryPubKey, role, port, keyPair, allow) {
  if (!port) {
    console.log('running client on cli needs a port specified. use -p <port>')
    process.exit(1)
  }
  const meta = fixMeta(role)
  Service(port, '127.0.0.1', keyPair, allow).then(({ dht, getStats }) => {
    console.log('started p2p service on', keyPair.publicKey.toString('hex'))
    const localRegistry = LocalRegistry(registryPubKey)
    localRegistry.connect().then(() => {
      localRegistry.register(meta, keyPair.publicKey)
    })
    process.once('SIGINT', function () {
      dht.destroy()
      localRegistry.destroy()
    })
  })
}

function proxy (registryPubKey, role, port, keyPair, portOptions) {
  const meta = fixMeta(role)
  const localRegistry = LocalRegistry(registryPubKey)
  localRegistry.connect().then(() => {
    console.log('connected to registry')
    localRegistry.waitFor(meta).then(servicePublicKey => {
      const withPort = (port) => {
        Proxy(port, keyPair, servicePublicKey).then(({ dht, getStats }) => {
          console.log('proxy from ', port, 'to p2p service', servicePublicKey)
          process.once('SIGINT', function () {
            dht.destroy()
          })
        })
      }
      if (port) return withPort(port)
      // else getPort(portOptions).then(withPort).catch(e => console.error(e))
    }).catch(e => {
      console.log('unable to find service', e)
      localRegistry.destroy()
      process.exit(-1)
    })
  })
}

const options = rc('seaport')
const command = options._[0]
const registryPubKey = options._[1]
const port = options.port || options.p
const role = options.role || options.r
const seedStr = options.seed || randomBytes(32).toString('hex')
const seed = Buffer.from(seedStr, 'hex')
const keyPair = HyperDHT.keyPair(seed)

if (command === 'seed') {
  console.log('Generated a random seed for you!')
  console.log('--seed', seedStr)
  console.log('services and proxies will connect with pubkey', keyPair.publicKey.toString('hex'))
  process.exit()
}

if (command === 'registry') registry(options.dht, keyPair)
else if (command === 'service') service(registryPubKey, role, port, keyPair, options.allow)
else if (command === 'proxy') proxy(registryPubKey, role, port, keyPair, options.portOptions)
else proxy(registryPubKey, role, port, keyPair, options.portOptions)
