const test = require('tape')
const { MemoryLevel } = require('memory-level')
const RoleLookup = require('../lib/impl/roleLookup/level')

test('add a version and get it back', async (t) => {
  const db = new MemoryLevel({ valueEncoding: 'json' })
  const rl = RoleLookup({db})
  await rl.add('couchdb', '2.1.3-beta.3', '5b64a8956d8f2404c4f4b4e6f402ef439f610f7fe297718093641359130b0d45')
  await rl.add('couchdb', '2.1.3', '6b64a8956d8f2404c4f4b4e6f402ef439f610f7fe297718093641359130b0d45')
  await rl.add('couchdb', '3.1.2', '7b64a8956d8f2404c4f4b4e6f402ef439f610f7fe297718093641359130b0d45')

  const all = await rl.find('couchdb', '2.x')
  console.log(all)
  t.end()
})
