// const {Consumer, KeyPair} = require('hypersearport')
const {Consumer, KeyPair} = require('../../')
const assert = require('assert')

// The intersting stuff!!
const registryPubKey = process.argv[2] // we need one thing from the cli
const roles = ['helloworld@1.0.0']
const options = { registryPubKey }

const consumer = Consumer(roles, options)
consumer.setup().then(([helloworld]) => {

  // use the api url like you would
  const url = `http://localhost:${helloworld.port}`
  fetch(url).then(resp => resp.text()).then(data => {
    console.log(data) // 'Hello, World!'

    // clean up when done
    consumer.destroy().then(() => {
      process.exit()
    })
  })
})
