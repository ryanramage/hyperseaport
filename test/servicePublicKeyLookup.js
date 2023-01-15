const test = require('tape')
const ServicePublicKeyLookup = require('../lib/impl/servicePublicKeyLookup')

test('inc works', t => {
  const opts = { mode: 'static-roundRobin', dontRunUpdater: true }

  const list = [
    { servicePublicKey: 'a' },
    { servicePublicKey: 'b' },
    { servicePublicKey: 'c' }
  ]

  const servicePublicKeyLookup = ServicePublicKeyLookup(opts, {}, {}, '')

  const first = servicePublicKeyLookup.choose(list)
  t.equals(first, 'a')
  const second = servicePublicKeyLookup.choose(list)
  t.equals(second, 'b')
  const third = servicePublicKeyLookup.choose(list)
  t.equals(third, 'c')
  const forth = servicePublicKeyLookup.choose(list)
  t.equals(forth, 'a')
  t.end()
})
