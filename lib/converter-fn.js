async function converterFn (rec) {
  for (const k of ['lat', 'lng']) {
    rec[k] = parseFloat(rec[k]) ?? null
  }
  for (const k of ['dem', 'elev', 'pop']) {
    rec[k] = parseInt(rec[k] === '' ? 0 : rec[k]) ?? null
  }
  for (const k of ['altName', 'countryAlt']) {
    delete rec[k]
  }
  if (rec.country) rec.country = rec.country.toUpperCase()
  rec.geonamesId = parseInt(rec.geonamesId)
  return rec
}

export default converterFn
