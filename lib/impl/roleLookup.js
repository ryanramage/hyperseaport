const semver = require('semver')
const semverParse = require('semver/functions/parse')
const versionParse = require('./versionParse')

const pad = n => String(n).padStart(6, '0')
const gtPad = n => (n === 'x') ? '000000' : pad(n)
const ltPad = n => (n === 'x') ? '999999' : pad(n)

module.exports = (db) => {
  const add = async (role, version, servicePublicKey) => {
    const sv = semverParse(version)
    const value = { servicePublicKey, role, version }
    if (sv.prerelease) value.prerelease = sv.prerelease

    const roleDB = db.sub(role)
    const key = `${pad(sv.major)}|${pad(sv.minor)}|${pad(sv.patch)}|${servicePublicKey}`
    await roleDB.put(key, value)
  }

  const find = async (role, version) => {
    if (!version) version = '*'
    const query = {}
    if (version !== '*') {
      const { major, minor, patch } = versionParse(version)
      query.gt = `${gtPad(major)}|${gtPad(minor)}|${gtPad(patch)}|`
      query.lt = `${ltPad(major)}|${ltPad(minor)}|${ltPad(patch)}||`
    }

    const results = []
    const roleDB = db.sub(role)
    for await (const { value } of roleDB.createReadStream(query)) {
      const testVersion = (version === '*') ? semver.coerce(value.version) : value.version
      if (semver.satisfies(testVersion, version)) results.push(value)
    }
    return results
  }

  const del = async (role, version, servicePublicKey) => {
    const sv = semverParse(version)
    const key = `${pad(sv.major)}|${pad(sv.minor)}|${pad(sv.patch)}|${servicePublicKey}`
    const roleDB = db.sub(role)
    await roleDB.del(key)
  }

  return { add, find, del }
}
