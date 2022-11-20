const HyperDHT = require('@hyperswarm/dht')
const randomBytes = require('./lib/randomBytes')

module.export = ({ seed }) => {
  const seedStr = seed || randomBytes(32).toString('hex')
  const _seed = Buffer.from(seedStr, 'hex')
  const keyPair = HyperDHT.keyPair(_seed)
  return keyPair
}
