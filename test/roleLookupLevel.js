const test = require('tape')
const { MemoryLevel } = require('memory-level')
const RoleLookup = require('../lib/impl/roleLookup/level')

test('find exact match', async (t) => {
  const db = new MemoryLevel({ valueEncoding: 'json' })
  const rl = RoleLookup({db})
  await rl.add('couchdb', '1.8.3', '4b64a8956d8f2404c4f4b4e6f402ef439f610f7fe297718093641359130b0d45')
  await rl.add('couchdb', '2.1.3-beta.3', '5b64a8956d8f2404c4f4b4e6f402ef439f610f7fe297718093641359130b0d45')
  await rl.add('couchdb', '2.1.3', '6b64a8956d8f2404c4f4b4e6f402ef439f610f7fe297718093641359130b0d45')
  await rl.add('couchdb', '3.1.2', '7b64a8956d8f2404c4f4b4e6f402ef439f610f7fe297718093641359130b0d45')

  {
    const all = await rl.find('couchdb', '2.1.3-beta.3')
    t.equals(all[0].servicePublicKey, '5b64a8956d8f2404c4f4b4e6f402ef439f610f7fe297718093641359130b0d45')
    t.equals(all.length, 1)
  }
  {
    const all = await rl.find('couchdb', '2.1.3')
    t.equals(all[0].servicePublicKey, '6b64a8956d8f2404c4f4b4e6f402ef439f610f7fe297718093641359130b0d45')
    t.equals(all.length, 1)
  }

  t.end()
})

test('add a versions and finding matching ones', async (t) => {
  const db = new MemoryLevel({ valueEncoding: 'json' })
  const rl = RoleLookup({db})
  await rl.add('couchdb', '1.8.3', '4b64a8956d8f2404c4f4b4e6f402ef439f610f7fe297718093641359130b0d45')
  await rl.add('couchdb', '2.1.2', '5b64a8956d8f2404c4f4b4e6f402ef439f610f7fe297718093641359130b0d45')
  await rl.add('couchdb', '2.1.3', '6b64a8956d8f2404c4f4b4e6f402ef439f610f7fe297718093641359130b0d45')
  await rl.add('couchdb', '3.1.2', '7b64a8956d8f2404c4f4b4e6f402ef439f610f7fe297718093641359130b0d45')

  const all = await rl.find('couchdb', '2.x')
  const publicKeys = all.map(r => r.servicePublicKey)
  t.equals(publicKeys[0], '5b64a8956d8f2404c4f4b4e6f402ef439f610f7fe297718093641359130b0d45')
  t.equals(publicKeys[1], '6b64a8956d8f2404c4f4b4e6f402ef439f610f7fe297718093641359130b0d45')
  t.end()
})

test('remove a key', async (t) => {
  const db = new MemoryLevel({ valueEncoding: 'json' })
  const rl = RoleLookup({db})
  await rl.add('couchdb', '1.8.3', '4b64a8956d8f2404c4f4b4e6f402ef439f610f7fe297718093641359130b0d45')
  await rl.add('couchdb', '2.1.3-beta.3', '5b64a8956d8f2404c4f4b4e6f402ef439f610f7fe297718093641359130b0d45')
  await rl.add('couchdb', '2.1.3', '6b64a8956d8f2404c4f4b4e6f402ef439f610f7fe297718093641359130b0d45')
  await rl.add('couchdb', '3.1.2', '7b64a8956d8f2404c4f4b4e6f402ef439f610f7fe297718093641359130b0d45')

  await rl.del('couchdb', '2.1.3-beta.3', '5b64a8956d8f2404c4f4b4e6f402ef439f610f7fe297718093641359130b0d45')

  const all = await rl.find('couchdb', '2.x')
  const publicKeys = all.map(r => r.servicePublicKey)
  t.equals(publicKeys[0], '6b64a8956d8f2404c4f4b4e6f402ef439f610f7fe297718093641359130b0d45')
  t.equals(publicKeys.length, 1)
  t.end()
})
