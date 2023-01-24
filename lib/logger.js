const split2 = require('split2')

module.exports = (logStream, core) => {
  logStream.pipe(split2()).on('data', (line) => {
    // could gain some speed by not buffer converts
    // but probably fast enough for now
    core.append(Buffer.from(line))
  }).on('close', () => {
    core.close()
  })
}
