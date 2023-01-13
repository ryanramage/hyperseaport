const test = require('tape')
const ServicePublicKeyLookup = require('../lib/impl/servicePublicKeyLookup')

test('inc works', t => {
  const opts = { mode: 'static-roundRobin' }

  const query = async () => {
    return [
      { servicePublicKey: 'a' },
      { servicePublicKey: 'b' },
      { servicePublicKey: 'c' }
    ]
  }
  const localRegistryMock = { query }

  const servicePublicKeyLookup = ServicePublicKeyLookup(opts, {}, localRegistryMock, '')

  const run = async () => {
    const first = await servicePublicKeyLookup.get()
    t.equals(first, 'a')
    const second = await servicePublicKeyLookup.get()
    t.equals(second, 'b')
    const third = await servicePublicKeyLookup.get()
    t.equals(third, 'c')
    const forth = await servicePublicKeyLookup.get()
    t.equals(forth, 'a')
    t.end()
  }
  run()
})
