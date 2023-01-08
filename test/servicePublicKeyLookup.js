const test = require('tape')
const ServicePublicKeyLookup = require('../lib/impl/servicePublicKeyLookup')

test('inc works', t => {
  const opts = { mode: 'static-roundRobin' }
  const servicePublicKeyLookup = ServicePublicKeyLookup(opts, {}, {}, '')
  servicePublicKeyLookup.setAvailable(['a', 'b', 'c'])
  const first = servicePublicKeyLookup.get()
  t.equals(first, 'a')
  const second = servicePublicKeyLookup.get()
  t.equals(second, 'b')
  const third = servicePublicKeyLookup.get()
  t.equals(third, 'c')
  const forth = servicePublicKeyLookup.get()
  t.equals(forth, 'a')
  t.end()
})
