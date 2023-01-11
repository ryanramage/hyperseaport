const test = require('tape')
const LocalHyperbeeRegistry = require('../lib/impl/localHyperbeeRegistry')
const RemoteHyperbeeRegistry = require('../lib/impl/remoteHyperbeeRegistry')
const RAM = require('random-access-memory')

test('connecting local and remote registry', (t) => new Promise(async (resolve) => {

  const remote = await RemoteHyperbeeRegistry(RAM)
  const serverRegistryBeeKey = remote.getDiscoveryKey()

  const meta = { role: 'couchdb', version: '2.3.1'}
  const readyToTest = async (conn, local) => {
    const list = await local.query(meta)
    console.log(list)
    t.ok(list.length, 1)
    remote.destroy()
    local.destroy()
    resolve()
  }

  await LocalHyperbeeRegistry(RAM, serverRegistryBeeKey, readyToTest)
  await remote.register('a', 'a', meta) 

}))
