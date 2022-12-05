module.export = (roleLookup, listenerLookup, loadManager, notifier) => {
  const register = async ({ meta, servicePublicKey, nodeStats }) => {
    const registration = { id: servicePublicKey, remotePublicKey, meta }
    await registry.add(meta, registration)
    const interested = await listenerLookup(meta)
    const notify = i => notifier.onNodeAvailable(i)
    await async.each(interested, notify)
  }
  const watch = async ({ consumerPublicKey, metas }) => {
    const process = meta => {
      listenerLookup.add({consumerPublicKey, meta})
      const _nodes = registry.get(meta)
      return loadManager.sort(nodes)
    }
    // return nodes for each meta requested
    return await async.map(metas, process)
  }
  const failover = async ({ consumerPublicKey, servicePublicKey }) => {
    loadManager.recordFailover({ consumerPublicKey, servicePublicKey })
  }
  const updateNodeResponseTimeStats = async ({ servicePublicKey, responseTimeStats }) => {
    loadManager.recordNodeResponseTimeStats({ servicePublicKey, responseTimeStats })
  }
  const updateNodeLoadStats => async ({ servicePublicKey, updateStats }) => {
    loadManager.recordNodeLoadStats({ servicePublicKey, responseTimeStats })
  }
}
