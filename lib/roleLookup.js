const SemverStore = require('semver-store')
const semver = require('semver')

module.exports = () => {
  const byRole = {}
  const byId = {}

  const add = (meta, info) => {
    if (!semver.valid(meta.version)) throw new Error('needs to be valid semver')
    if (!info.id) throw new Error('info needs an id property')

    const store = byRole[meta.role] || new SemverStore()
    const registrations = store.get(meta.version) || { list: [], set: true }
    if (registrations.set) {
      delete registrations.set
      store.set(meta.version, registrations)
    }
    registrations.list.push({ meta, info })
    byRole[meta.role] = store
    byId[info.id] = registrations
    return registrations
  }

  const get = (meta) => {
    const notFound = { list: [] }
    const store = byRole[meta.role]
    if (!store) return notFound
    const registrations = store.get(meta.version)
    if (!registrations) return notFound
    return registrations
  }

  const remove = (id) => {
    const registrations = byId[id]
    if (!registrations) return
    const index = registrations.list.findIndex(element => {
      if (!element.info) return false
      return element.info.id === id
    })
    if (index < 0) return
    const [details] = registrations.list.splice(index)
    return details
  }

  return { add, get, remove }
}
