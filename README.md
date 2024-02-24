hyperseaport
============

A p2p Service Registry (🕳🥊 a holepunch project)

![Seaport](https://web.archive.org/web/20141205152524im_/http://substack.net/images/seaport.png "Seaport")

Features

 - 📇 Add existing services (apis, dbs, etc) to the registry
 - 💻 In just a few lines of code, node apis can be registered
 - ⚖️ Failover and load balancing between multiple service instances
 - 👩‍👧‍👧 run multiple versions of apis running, giving time to depreciate them
 - 🥡 clients request versions of apis with wildcard matching
 - 📚 clients keep local copies of a readable registry for fast lookups and replication between them
 - 📱 an experimental web proxy to expose services to webapps

Devops in a p2p world is much easier. Come aboard! ⛴ 🚢

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


### 2. Start a registry

```
$ hyperseaport --web 8777
⦖ ./cli.js --web 8777
Writer started.
storing in /Users/ryanr/Library/Preferences/hyperseaport
Registry started.
registryPublicKey=5b64a8956d8f2404c4f4b4e6f402ef439f610f7fe297718093641359130b0d45
web server listening on port 8777

```
The registry is stored as a hyperbee in /Users/ryanr/Library/Prefrences/hyperseaport.  
We've started with the experimental web proxy on port 8777. We'll show that off later.

### 3. Register a service (📇 Add existing services)

Here is an example that registers and existing couchdb running on localhost port (-p) 5984 as a service.
The role (-r) of the service a semver string that represents the name and version of the running instace.
We use the registry publicKey from step 2 to find and connect to the registry, and register our service.

The code below can be run on the same different host than step 2, and it automagically connects and registers the service.

```
$ hyperseaport service --port 5984 --role couchdb@3.2.2 --registryPublicKey 5b64a8956d8f2404c4f4b4e6f402ef439f610f7fe297718093641359130b0d45

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

### 4. Try out the web proxy (📱 - mobile access)

Assuming the service you registered in 3 is an http service, you can now use the registry proxy (if enabled).

Try some urls like

 - curl localhost:8777/role/couchdb@3.2.2/
 - curl localhost:8777/role/couchdb@3.x/some/path/on/the/service
 - curl localhost:8777/list/couchdb@3.x
 - curl localhost:877/instance/abe213285052e5c2f2166d144afcd71e31aa5c7d72656d7b956a2c93f76d260f/some/path/on/this/service

```
/role/${role@version}/path/on/service
```

This could be a one stop shop for your mobile apps. We will add more features to it (auth, etc) so it is experimental.

If you dont want to start the web proxy with the registry, or you want more redundand web proxies (round robin dns), you can start them up

```
$ hyperseaport web --port 5984 --registryPublicKey 5b64a8956d8f2404c4f4b4e6f402ef439f610f7fe297718093641359130b0d45

```

### 5. Register a proxy

This is the part that is like ngrok, or a reverse proxy. You want to USE the service somewhere else, without knowing the IP, or vpn.
So you start a hyperseaport proxy on a port that makes it look like the service is running locally on that port.

This can be done on the same or different host then the steps above.

Lookup the service by a role (r) and expose the service locally on a totally different port (p).
We use the registry publicKey from step 2 to find and connect to the registry, and find the service.

```
$ hyperseaport proxy --port 5985 --role couchdb@3.x --registryPublicKey 5b64a8956d8f2404c4f4b4e6f402ef439f610f7fe297718093641359130b0d45

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

### 5. Use the service

Now port 5985 is proxied to the remote service without knowing where it is. Magic. Call it normally

```
$ curl http://localhost:5985
{"couchdb":"Welcome","version":"3.2.2","git_sha":"d5b746b7c","uuid":"5e3ccc9fd986f473f182ce246c1e214c","features":["access-ready","partitioned","pluggable-storage-engines","reshard","scheduler"],"vendor":{"name":"The Apache Software Foundation"}}

```

# Node Usage

### Create a service (💻 In just a few lines of code, node apis can be registered)

```
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

Consume the service from another process

```
import { Consumer } from 'hyperseaport'

const registryPublicKey = process.argv[2] // we need one thing from the cli
const roles = ['ollama@1.0.0']
const options = { registryPublicKey }

// notice we could pass in a bunch of roles we need in the array
const consumer = Consumer(roles, options)
const [helloworld] = await consumer.setup()
const resp = await fetch(helloworld.url)
const data = await resp.text()
console.log(data) // 'ollama is running'

// clean up when done
consumer.destroy().then(() => process.exit())

```

See more runnable [examples](https://github.com/ryanramage/hyperseaport/tree/master/examples).
