const test = require('tape')
const Hash = require('../lib/impl/staticHash')

test('a hash of one', t => {
  const publicKey = Buffer.from('this is a test')
  const keyPair = { publicKey }
  const hash = Hash(keyPair)
  const index = hash.recompute(['a'])
  t.equals(index, 0)
  t.end()
})

test('a hash of a couple things', t => {
  const publicKey = Buffer.from('this is a test')
  const keyPair = { publicKey }
  const hash = Hash(keyPair)
  const index = hash.recompute(['a', 'b', 'c'])
  t.equals(index, 2)
  t.end()
})

test('a hash of a couple things', t => {
  const publicKey = Buffer.from('is is a test')
  const keyPair = { publicKey }
  const hash = Hash(keyPair)
  const index = hash.recompute(['a', 'b', 'c'])
  t.equals(index, 0)
  t.end()
})
