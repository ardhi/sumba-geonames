import maintenance from '../../lib/maintenance.js'

async function converterFn (rec) {
  rec.id = parseInt(rec.id)
  return rec
}

const headers = ['geonamesId', 'name', 'reason']

async function applyDeletes (path, ...args) {
  await maintenance.call(this, { type: 'deletes', headers, converterFn, date: args[0] })
}

export default applyDeletes
