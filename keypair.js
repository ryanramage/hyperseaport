const HyperDHT = require('hyperdht')
const randomBytes = require('./lib/randomBytes')

module.exports = (options) => {
  const opts = options || {}
  const seedStr = opts.seed || randomBytes(32).toString('hex')
  const _seed = Buffer.from(seedStr, 'hex')
  const keyPair = HyperDHT.keyPair(_seed)
  return keyPair
}
