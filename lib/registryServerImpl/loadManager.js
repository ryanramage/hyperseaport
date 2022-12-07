const staticFirst = require('./sort/staticFirst')

module.exports = (db, options) => {
  const sort = async (consumerPublicKey, servicePublicKeys) => {

    // these are client directed sorting
    if (options.sort === 'static-hash') return servicePublicKeys
    if (options.sort === 'static-first') return servicePublicKeys
    if (options.sort === 'static-roundRobin') return servicePublicKeys
    if (options.sort === 'static-weightedRoundRobin') return servicePublicKeys

    /*
    static
    - static-first - use first node on list from registry (registry sets priorities)

    - static-roundRobin - every request, pick a random node
    - static-weightedRoundRobin method (someone/something sets the weights)
    dynamic
    - dynamic-leastConnection - use the stats from each node and pick least connected one
    - dynamic-leastResponseTime - registry accepts stats updates from peer consumers
    - dynamic-resourceBased - registry accepts resource updates from peer services
    */

    // allow sorting to be different per consumer
    const keys = []
    servicePublicKeys.forEach(servicePublicKey => {
      keys.push(`${servicePublicKey}|loadStats|latest`)
      keys.push(`${servicePublicKey}|response|latest|${consumerPublicKey}`)
    })
    const stats = await db.getMany(keys)

    // extened mode - for each servicePublicKey, get all response times from all consumers
    const responseTimes = servicePublicKeys.map(async (servicePublicKey) => {
      const gt = `${servicePublicKey}|response|latest|`
      const lt = `${servicePublicKey}|response|latest||`
      return for await (const value of db.values({ gt, lt })).all()
    })
    console.log(keys, responseTimes)

    // do some fancy sorting with all the info we got
    return servicePublicKeys
  }

  const recordFailover = async (consumerPublicKey, servicePublicKey) => {
    const date = Date.now()
    const key = `${servicePublicKey}|response|latest|${consumerPublicKey}`
    const event = { date, failover: true }
    await db.put(key, event)
    if (options.keepHistory) {
      const historyKey = `${servicePublicKey}|response|history|${date}|${consumerPublicKey}`
      setTimeout(() => db.put(historyKey, event), 10)
    }
  }

  const recordResponseTime = async (consumerPublicKey, stats) => {
    const date = Date.now()
    const key = `${servicePublicKey}|response|latest|${consumerPublicKey}`
    const event = { date, stats }
    await db.put(key, event)
    if (options.keepHistory) {
      const historyKey = `${servicePublicKey}|response|history|${date}|${consumerPublicKey}`
      setTimeout(() => db.put(historyKey, event), 10)
    }
  }

  const recordLoadStats = async (servicePublicKey, stats) => {
    const date = Date.now()
    const key = `${servicePublicKey}|loadStats|latest`
    const event = { date, stats }
    await db.put(key, event)
    if (options.keepHistory) {
      const historyKey = `${servicePublicKey}|loadStats|history|${date}`
      setTimeout(() => db.put(historyKey, event), 10)
    }
  }
  return { sort, recordFailover, recordResponseTime, recordLoadStats }
}
