const test = require('tape')
const { MemoryLevel } = require('memory-level')
const ConsumerLookup = require('../lib/impl/consumerLookup/level')

test('find exact match', async (t) => {
  const db = new MemoryLevel({ valueEncoding: 'json' })
  const cl = ConsumerLookup({ db })
  await cl.add('couchdb', '2.1.0', '3b64a8956d8f2404c4f4b4e6f402ef439f610f7fe297718093641359130b0d45')
  await cl.add('couchdb', '2.1.1', '4b64a8956d8f2404c4f4b4e6f402ef439f610f7fe297718093641359130b0d45')
  await cl.add('couchdb', '2.1.2', '5b64a8956d8f2404c4f4b4e6f402ef439f610f7fe297718093641359130b0d45')

  const matching = await cl.find('couchdb', '2.1.1')
  t.equals(matching.length, 1)
  t.equals(matching[0].consumerPublicKey, '4b64a8956d8f2404c4f4b4e6f402ef439f610f7fe297718093641359130b0d45')
  t.end()
})

test('find with a patch wildcard', async (t) => {
  const db = new MemoryLevel({ valueEncoding: 'json' })
  const cl = ConsumerLookup({ db })
  await cl.add('couchdb', '2.1.0', '3b64a8956d8f2404c4f4b4e6f402ef439f610f7fe297718093641359130b0d45')
  await cl.add('couchdb', '2.1.x', '4b64a8956d8f2404c4f4b4e6f402ef439f610f7fe297718093641359130b0d45')
  await cl.add('couchdb', '2.1.2', '5b64a8956d8f2404c4f4b4e6f402ef439f610f7fe297718093641359130b0d45')

  const matching = await cl.find('couchdb', '2.1.1')
  t.equals(matching.length, 1)
  t.equals(matching[0].consumerPublicKey, '4b64a8956d8f2404c4f4b4e6f402ef439f610f7fe297718093641359130b0d45')
  t.end()
})

test('find with a minor wildcard', async (t) => {
  const db = new MemoryLevel({ valueEncoding: 'json' })
  const cl = ConsumerLookup({ db })
  await cl.add('couchdb', '2.1.0', '3b64a8956d8f2404c4f4b4e6f402ef439f610f7fe297718093641359130b0d45')
  await cl.add('couchdb', '2.x.x', '4b64a8956d8f2404c4f4b4e6f402ef439f610f7fe297718093641359130b0d45')
  await cl.add('couchdb', '2.1.2', '5b64a8956d8f2404c4f4b4e6f402ef439f610f7fe297718093641359130b0d45')

  const matching = await cl.find('couchdb', '2.1.1')
  t.equals(matching.length, 1)
  t.equals(matching[0].consumerPublicKey, '4b64a8956d8f2404c4f4b4e6f402ef439f610f7fe297718093641359130b0d45')
  t.end()
})

test('find with prerelease tags works', async (t) => {
  const db = new MemoryLevel({ valueEncoding: 'json' })
  const cl = ConsumerLookup({ db })
  await cl.add('couchdb', '2.1.0', '3b64a8956d8f2404c4f4b4e6f402ef439f610f7fe297718093641359130b0d45')
  await cl.add('couchdb', '2.1.1-beta.2', '4b64a8956d8f2404c4f4b4e6f402ef439f610f7fe297718093641359130b0d45')
  await cl.add('couchdb', '2.1.1-beta.3', '5b64a8956d8f2404c4f4b4e6f402ef439f610f7fe297718093641359130b0d45')
  await cl.add('couchdb', '2.1.1-beta.4', '6b64a8956d8f2404c4f4b4e6f402ef439f610f7fe297718093641359130b0d45')
  await cl.add('couchdb', '2.1.2', '7b64a8956d8f2404c4f4b4e6f402ef439f610f7fe297718093641359130b0d45')

  const matching = await cl.find('couchdb', '2.1.1-beta.3')
  t.equals(matching.length, 1)
  t.equals(matching[0].consumerPublicKey, '5b64a8956d8f2404c4f4b4e6f402ef439f610f7fe297718093641359130b0d45')
  t.end()
})

test('remove a consumer and make sure it does not match', async (t) => {
  const db = new MemoryLevel({ valueEncoding: 'json' })
  const cl = ConsumerLookup({ db })
  await cl.add('couchdb', '2.x.x', '3b64a8956d8f2404c4f4b4e6f402ef439f610f7fe297718093641359130b0d45')
  await cl.add('couchdb', '2.x.x', '4b64a8956d8f2404c4f4b4e6f402ef439f610f7fe297718093641359130b0d45')
  await cl.add('couchdb', '2.1.2', '5b64a8956d8f2404c4f4b4e6f402ef439f610f7fe297718093641359130b0d45')

  await cl.del('couchdb', '2.x.x', '3b64a8956d8f2404c4f4b4e6f402ef439f610f7fe297718093641359130b0d45')

  const matching = await cl.find('couchdb', '2.1.1')
  t.equals(matching.length, 1)
  t.equals(matching[0].consumerPublicKey, '4b64a8956d8f2404c4f4b4e6f402ef439f610f7fe297718093641359130b0d45')
  t.end()
})
