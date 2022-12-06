const semver = require('semver')
const semverParse = require('semver/functions/parse')
const versionParse = require('../versionParse')

module.exports = (db) => {
  const add = async (role, version, servicePublicKey) => {
    const sv = semverParse(version)
    const value = { servicePublicKey, role, version, prerelease: sv.prerelease }
    const key = [role, sv.major, sv.minor, sv.patch, servicePublicKey]
    await db.put(key, value)
  }

  const find = async (role, version) => {
    if (typeof version !== 'string') return null
    if (version === '*') version = 'x.x.x'
    const { major, minor, patch } = versionParse(version)

    const gt = [role, major]
    const lt = [role, major]

    if (minor === 'x') lt.push('|')
    else {
      gt.push(minor)
      lt.push(minor)
      if (patch === 'x') lt.push('|')
      else {
        gt.push(patch)
        lt.push(patch)
        lt.push('|')
      }
    }
    const query = { gt, lt }
    const results = []
    for await (const value of db.values(query)) {
      if (semver.satisfies(value.version, version)) results.push(value)
    }
    return results
  }

  const del = async (role, version, servicePublicKey) => {
    const sv = semverParse(version)
    const key = [role, sv.major, sv.minor, sv.patch, servicePublicKey]
    await db.del(key)
  }

  return { add, find, del }
}
