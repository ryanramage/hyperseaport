localregistry - our local information about services and nodes

  // loadBalance modes - the localRegistry of the consumer holds the mode
  static
  - static-first - use first node on list from registry (registry sets priorities)
  - static-hash something and then pick node from list
  - static-roundRobin - every request, pick a random node
  - static-weightedRoundRobin method (someone/something sets the weights)
  dynamic
  - dynamic-leastConnection - use the stats from each node and pick least connected one
  - dynamic-leastResponseTime - registry accepts stats updates from peer consumers
  - dynamic-resourceBased - registry accepts resource updates from peer services

  // events about services received
  onNodeAvailable - consumer is alerted that a new node is online that in in their watch list of services
  onNodeShutdown - consumer is alerted that a node is offline that is in their watch list of serviced
  onNodeWeights - consumer is notified of updated weights for weighted loadBalancing
  useNode - registry is asking consumer to use a specific node
  useLoadBalanceMode - registry is asking consumer to update loadBalance mode

  // notify issues about services
  watch - set watch list of services
  failover - as a consumer, update registry about a failover, and next node selection
  updateNodeResponseTimeStats - as a consumer, update registry with response times since last period
  updateNodeStats - as a service, update registry with current usage since last period
