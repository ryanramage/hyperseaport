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

# CLI Usage

### 1. Generate a unique seed for your registry

Your registry is unique! The seed ensures a unique and consistent public key. Only those who know the public key can connect and uses the services the registry maintains.

```
$ hyperseaport seed > ~/.config/hyperseaport

```

If you inspect the file ```~/.config/hyperseaport``` it will look like

```
registrySeed=c84c7034a0309479299d81468b7bc59592a96b3a919fd1ff159aea1879407382
registryPublicKey=5b64a8956d8f2404c4f4b4e6f402ef439f610f7fe297718093641359130b0d45
```
The registrySeed should be secret! It's what makes your registry your own.
The registryPublicKey should be shared so services and consumers can connect and use.
To make the instructions cleaner below we dont show passing this option, as the cli will just read this file as a first priory.

This file is read each time by hyperseaport according to the [rc](https://www.npmjs.com/package/rc) rules.

### 2. Start a registry

```
$ hyperseaport

Registry started.
registryPublicKey=5b64a8956d8f2404c4f4b4e6f402ef439f610f7fe297718093641359130b0d45

```

### 3. Register a service

Here is an example that registers couchdb running on localhost port (-p) 5984 as a service.
The role (-r) of the service a semver string that represents the name and version of the running instace.
We use the registry publicKey from step 2 to find and connect to the registry, and register our service.

The code below can be run on the same different host than step 2, and it automagically connects and registers the service.

```
$ hyperseaport service --port 5984 --role couchdb@3.2.2

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

### 4. Register a proxy

This is the part that is like ngrok, or a reverse proxy. You want to USE the service somewhere else, without knowing the IP, or vpn.
So you start a hyperseaport proxy on a port that makes it look like the service is running locally on that port.

This can be done on the same or different host then the steps above.

Lookup the service by a role (r) and expose the service locally on a totally different port (p).
We use the registry publicKey from step 2 to find and connect to the registry, and find the service.

```
$ hyperseaport proxy --port 5985 --role couchdb@3.x

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

### 5. Use the service locally

Now port 5985 is proxied to the remote service without knowing where it is. Magic. Call it normally

```
$ curl http://localhost:5985
{"couchdb":"Welcome","version":"3.2.2","git_sha":"d5b746b7c","uuid":"5e3ccc9fd986f473f182ce246c1e214c","features":["access-ready","partitioned","pluggable-storage-engines","reshard","scheduler"],"vendor":{"name":"The Apache Software Foundation"}}

```

# Node Usage

When you write a node webserver or other service on a port, you can register it very easy like so

````
const {Service, KeyPair} = require('hypersearport')

// Boilerplate node
const http = require('http')
const port = 8992
const requestListener = function (req, res) {
  res.writeHead(200);
  res.end('Hello, World!')
}
const server = http.createServer(requestListener)
server.listen(port)

// The intersting stuff!!
const registryPublicKey = process.argv[2] // we need one thing from the cli
console.log(registryPublicKey)
const role = 'helloworld@1.0.0'
const keyPair = KeyPair()
const service = Service({ registryPublicKey, role, port, keyPair })
await service.setup()

console.log('service connected')

process.once('SIGINT', function () {
  service.destroy()
})
```

and then if you want to consume services, here is an example how you'd look it up and call it

```
const {Consumer} = require('hypersearport')

const registryPublicKey = process.argv[2] // we need one thing from the cli
const roles = ['helloworld@1.0.0']
const options = { registryPublicKey }

// notice we could pass in a bunch of roles we need in the array
const consumer = Consumer(roles, options)
const [helloworld] = await consumer.setup()

const url = `http://localhost:${helloworld.port}`
const resp = await fetch(url)
const data = resp.text()
console.log(data) // 'Hello, World!'

// clean up when done
consumer.destroy().then(() => process.exit())


```

See more runnable [examples](https://github.com/ryanramage/hyperseaport/tree/master/examples).
