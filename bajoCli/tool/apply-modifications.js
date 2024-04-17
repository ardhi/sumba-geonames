import maintenance from '../../lib/maintenance.js'
import converterFn from '../../lib/converter-fn.js'
import headers from '../../lib/headers.js'

async function applyModifications ({ path, args }) {
  await maintenance.call(this, { type: 'modifications', headers, converterFn, date: args[0] })
}

export default applyModifications
