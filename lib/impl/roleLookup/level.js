const { Level } = require('level')
const semver = require('semver')
const semverParse = require('semver/functions/parse')

module.exports = (config) => {
  const dbname = config.roleLookupDB || 'roles'
  const db = config.db || new Level(dbname, { valueEncoding: 'json' })

  const add = async (role, version, servicePublicKey) => {
    const sv = semverParse(version)
    const value = { servicePublicKey, role, version, prerelease: sv.prerelease }
    const key = [role, sv.major, sv.minor, sv.patch, servicePublicKey]
    await db.put(key, value)
  }

  const find = async (role, version) => {
    if (typeof version !== 'string') return null
    if (version === '*') version = 'x.x.x'
    const firstDot = version.indexOf('.')
    const secondDot = version.indexOf('.', firstDot + 1)
    const major = version.slice(0, firstDot)
    const minor = secondDot === -1
      ? version.slice(firstDot + 1)
      : version.slice(firstDot + 1, secondDot)
    let patch = secondDot === -1
      ? 'x'
      : version.slice(secondDot + 1)

    let prerelease = []
    if (patch.indexOf('-')) {
      let [patchr, prereleaseParts] = patch.split('-')
      patch = patchr
      if (prereleaseParts) prerelease = prereleaseParts.split('.')
    }

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

  return {add, find, del}
}
