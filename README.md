hyperseaport
============

service registry and tcp proxy over secure p2p

![Seaport](https://web.archive.org/web/20141205152524im_/http://substack.net/images/seaport.png "Seaport")

Kind of like [ngrok](https://ngrok.com) but with

 1. A private registry of services and
 2. Over p2p

As your micro service architecture grows to span many processes on many machines just register your services and easily find and connect them together.

# Install

```
npm i -g hyperseaport
```

The following instructions are for the CLI usage. See the [examples](https://github.com/ryanramage/hyperseaport/tree/master/examples) directory for usage as a module in a node app to register or consume services.


# 1. Generate a unique seed for your registry

Your registry is unique! The seed ensures a unique and consistent public key. Only those who know the public key can connect and uses the services the registry maintains.

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

Here is an example that registers couchdb running on localhost port (-p) 5984 as a service.
The role (-r) of the service a semver string that represents the name and version of the running instace.
We use the registry publicKey from step 2 to find and connect to the registry, and register our service.

The code below can be run on the same different host than step 2, and it automagically connects and registers the service.

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

Note: for service registration the server version should be exact

# 4. Register a proxy

This is the part that is like ngrok, or a reverse proxy. You want to USE the service somewhere else, without knowing the IP, or vpn.
So you start a hyperseaport proxy on a port that makes it look like the service is running locally on that port.

This can be done on the same or different host then the steps above.

Lookup the service by a role (r) and expose the service locally on a totally different port (p).
We use the registry publicKey from step 2 to find and connect to the registry, and find the service.

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

Note: for service discovery, the version can be a semver range.

# 5. Use the service locally

Now port 5985 is proxied to the remote service without knowing where it is. Magic. Call it normally

```
$ curl http://localhost:5985
{"couchdb":"Welcome","version":"3.2.2","git_sha":"d5b746b7c","uuid":"5e3ccc9fd986f473f182ce246c1e214c","features":["access-ready","partitioned","pluggable-storage-engines","reshard","scheduler"],"vendor":{"name":"The Apache Software Foundation"}}

```
