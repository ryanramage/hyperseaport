module.exports = (version) => {
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
    const [patchr, prereleaseString] = patch.split('-')
    patch = patchr
    if (prereleaseString) prerelease = prereleaseString.split('.')
  }
  return {major, minor, patch, prerelease}
}
