/* eslint-disable no-unused-expressions */
/* eslint-env mocha */
require('chai').should()

describe('lib/config.js', function() {
  // set any process.env variables here
  // or any process.env.args
  process.argv.push('--debug')
  process.env.SQLPAD_DEBUG = 'FALSE'
  process.env.GOOGLE_CLIENT_ID = 'google-client-id'

  // This could be loaded elsewhere
  // Config stuff should be redesigned
  delete require.cache[require.resolve('../../lib/config.js')]
  delete require.cache[require.resolve('../../models/ConfigItem')]

  const config = require('../../lib/config.js')

  describe('#get()', function() {
    it('should get a value provided by default', function() {
      config.get('port').should.equal(80)
    })
    it('should get a value provided by environment', function() {
      config.get('googleClientId').should.equal('google-client-id')
    })
    it('cli should override env var', function() {
      config.get('debug').should.equal(true)
    })
    it('should only accept key in config items', function() {
      var fn = function() {
        config.get('non-existent-key')
      }
      fn.should.throw(Error)
    })
  })
})
