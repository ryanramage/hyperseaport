const KeyPair = require('./keypair')
const Service = require('./service')
const Consumer = require('./consumer')

// this is to be required but node services that want to
// - register a service
// - consume one or more services

module.exports = {
  KeyPair, Service, Consumer
}
