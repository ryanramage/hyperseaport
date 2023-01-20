module.exports = (keyPair) => {
  let lastLength = 1
  let index = 0

  // we assume that the buf is random, so 0 witll be random bits
  const hash = (buf, size) => buf[0] % size

  const recompute = (available) => {
    if (!keyPair || !keyPair.publicKey) return 0 // be safe
    if (available.length === 1) return 0 // be safe
    return hash(keyPair.publicKey, available.length)
  }

  const get = (available) => {
    if (available.length === lastLength) return available[index]
    index = recompute(available)
    lastLength = available.length
    return available[index]
  }
  return { get, recompute, hash }
}
