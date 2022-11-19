hyperseaport
============

service registry and tcp proxy over secure p2p

![Seaport](https://web.archive.org/web/20141205152524im_/http://substack.net/images/seaport.png "Seaport")

# Install

```
npm i -g hyperseaport
```


# 1. Generate a seed for your registry public key

```
$ hyperseaport seed

Generated a random seed for you!
--seed c84c7034a0309479299d81468b7bc59592a96b3a919fd1ff159aea1879407382
services and proxies will connect with pubkey 5b64a8956d8f2404c4f4b4e6f402ef439f610f7fe297718093641359130b0d45
```

# 2. Start a registry

Grab the seed from step 1 and use it to boot the registry. 

```
$ hyperseaport registry --seed c84c7034a0309479299d81468b7bc59592a96b3a919fd1ff159aea1879407382

Registry listening. Connect with pubkey  5b64a8956d8f2404c4f4b4e6f402ef439f610f7fe297718093641359130b0d45

```

# 3. Register a service

Semver is used for identify the service. Here is an example that uses couchdb running on localhost on port 5984
We pass the registry publicKey from above so it can store the port (p) and role (r) couchdb@3.2.2

The code below can be run on a different host than step 2, and it automagically connects and registers the service to the registry above.

```
$ hyperseaport service 5b64a8956d8f2404c4f4b4e6f402ef439f610f7fe297718093641359130b0d45  -p 5984 -r couchdb@3.2.2

started p2p service on abe213285052e5c2f2166d144afcd71e31aa5c7d72656d7b956a2c93f76d260f
connecting to registry 5b64a8956d8f2404c4f4b4e6f402ef439f610f7fe297718093641359130b0d45
registered service {
  role: 'couchdb',
  version: '3.2.2',
  _tags: {},
  tags: [],
  hash: 'couchdb|3.2.2|'
}
```

# 4. Register a proxy

This can be done on a different host then the steps above.

Lookup the service by a role (r) and expose the service locally on a totally different port (p)

```
$ hyperseaport proxy 5b64a8956d8f2404c4f4b4e6f402ef439f610f7fe297718093641359130b0d45 -p 5985 -r couchdb@3.x

connecting to registry 5b64a8956d8f2404c4f4b4e6f402ef439f610f7fe297718093641359130b0d45
connected to registry
found service {
  id: 'abe213285052e5c2f2166d144afcd71e31aa5c7d72656d7b956a2c93f76d260f',
  remotePublicKey: '03008865d93c046129d65b8d68829e5a4757b3b24844bbd1d36d27fe1e683b59',
  meta: {
    role: 'couchdb',
    version: '3.2.2',
    _tags: {},
    tags: [],
    hash: 'couchdb|3.2.2|'
  }
}
proxy from  5985 to p2p service abe213285052e5c2f2166d144afcd71e31aa5c7d72656d7b956a2c93f76d260f

```

# 5. Use the service locally

Now port 5985 is proxied to the remote service without knowing where it is. Magic. Call it normally

```
$ curl http://localhost:5985
{"couchdb":"Welcome","version":"3.2.2","git_sha":"d5b746b7c","uuid":"5e3ccc9fd986f473f182ce246c1e214c","features":["access-ready","partitioned","pluggable-storage-engines","reshard","scheduler"],"vendor":{"name":"The Apache Software Foundation"}}

```
