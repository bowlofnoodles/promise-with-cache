
'use strict'

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./promise-with-cache.cjs.production.min.js')
} else {
  module.exports = require('./promise-with-cache.cjs.development.js')
}
