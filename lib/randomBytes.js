const sodium = require('sodium-universal')

module.exports = function randomBytes (n) {
  const b = Buffer.alloc(n)
  sodium.randombytes_buf(b)
  return b
}
