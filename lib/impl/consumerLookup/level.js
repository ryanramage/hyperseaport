const { Level } = require('level')
const semver = require('semver')
const semverParse = require('semver/functions/parse')
const versionParse = require('../../versionParse')

module.exports = (config) => {
  const dbname = config.consumerLookupDB || 'consumer'
  const db = config.db || new Level(dbname, { valueEncoding: 'json' })

  const add = async (role, version, consumerPublicKey) => {
    const q = versionParse(version)
    const value = { consumerPublicKey, role, version, prerelease: q.prerelease }
    const key = [role, q.major, q.minor, q.patch, consumerPublicKey]
    await db.put(key, value)
  }

  const find = async (role, version) => {
    const sv = semverParse(version)
    const {major, minor, patch} = sv

    // join 3 querys
    const results = []
    // exact
    {
      const gt = [role, major, minor, patch]
      const lt = [role, major, minor, patch, '|']
      for await (const value of db.values({ gt, lt })) {
        if (semver.satisfies(version, value.version)) results.push(value)
      }
    }
    // patch wildcard
    {
      const gt = [role, major, minor, 'x']
      const lt = [role, major, minor, 'x', '|']
      for await (const value of db.values({ gt, lt })) {
        if (semver.satisfies(version, value.version)) results.push(value)
      }
    }
    // minor wildcard
    {
      const gt = [role, major, 'x', 'x']
      const lt = [role, major, 'x', 'x', '|']
      for await (const value of db.values({ gt, lt })) {
        if (semver.satisfies(version, value.version)) results.push(value)
      }
    }
    // should we allow x.x.x wildcards? change my mind
    return results
  }

  const del = async (role, version, consumerPublicKey) => {
    const q = versionParse(version)
    const key = [role, q.major, q.minor, q.patch, consumerPublicKey]
    await db.del(key)
  }

  return { add, find, del }
}
