const test = require('tape')
const ReaderRegistry = require('../lib/impl/readerRegistry')
const WriterRegistry = require('../lib/impl/writerRegistry')
const RAM = require('random-access-memory')

test('connecting reader and writer registry', (t) => new Promise(async (resolve) => {

  const writer = await WriterRegistry(RAM)
  const writerKey = writer.getKey()

  const meta = { role: 'couchdb', version: '2.3.1'}
  const onReady = async (conn, reader) => {
    const list = await reader.query(meta)
    console.log(list)
    t.ok(list.length, 1)
    writer.destroy()
    reader.destroy()
    resolve()
  }

  await ReaderRegistry(RAM, writerKey, onReady)
  await writer.register('a', 'a', meta) 

}))
