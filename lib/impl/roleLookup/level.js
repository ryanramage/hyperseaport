const { Level } = require('level')
const semverParse = require('semver/functions/parse')

module.exports = (config) => {
  const dbname = config.roleLookupDB || 'roles'
  const db = config.db || new Level(dbname, { valueEncoding: 'json' })

  const add = async (role, version, servicePublicKey, meta) => {
    const sv = semverParse(version)
    if (!meta) meta = {}
    const value = { meta, servicePublicKey, role, version } 
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
    const patch = secondDot === -1
      ? 'x'
      : version.slice(secondDot + 1)

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
    return await db.values({ gt, lt, limit: 10 }).all()
  }

  return {add, find}
}
