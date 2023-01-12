const test = require('tape')
const ReaderRegistry = require('../lib/impl/readerRegistry')
const WriterRegistry = require('../lib/impl/writerRegistry')
const RAM = require('random-access-memory')

test('connecting reader and writer registry', (t) => new Promise((resolve) => {
  const meta = { role: 'couchdb', version: '2.3.1' }
  const writer = WriterRegistry(RAM)
  writer.start().then(async (writerKey) => {
    await writer.register('a', 'a', meta)
    const onReady = async (conn, reader) => {
      const list = await reader.query(meta)
      console.log(list)
      t.ok(list.length, 1)
      writer.destroy()
      reader.destroy()
      resolve()
    }

    await ReaderRegistry(RAM, writerKey, onReady)
  })
}))
