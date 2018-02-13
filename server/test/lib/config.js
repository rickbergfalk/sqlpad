const assert = require('assert')
const configUtil = require('../../lib/config')
const db = require('../../lib/db')

const configItems = require('../../lib/config/configItems')
const fromDefault = require('../../lib/config/fromDefault')
const fromEnv = require('../../lib/config/fromEnv')
const fromCli = require('../../lib/config/fromCli')
const nonUiConfig = require('../../lib/config').getPreDbConfig()

describe('config', function() {
  it('default', function() {
    const conf = fromDefault()
    assert.equal(conf.port, 80, 'default port')
    assert(conf.dbPath !== '$HOME/sqlpad/db', 'dbPath should change')
  })

  it('env', function() {
    const conf = fromEnv({ SQLPAD_PORT: 8000 })
    assert.equal(conf.port, 8000, 'conf.port')
  })

  it('cli', function() {
    const conf = fromCli({
      'key-path': 'key/path',
      cert: 'cert/path',
      admin: 'admin@email.com'
    })
    assert.equal(conf.keyPath, 'key/path', 'keyPath')
    assert.equal(conf.certPath, 'cert/path', 'certPath')
    assert.equal(conf.admin, 'admin@email.com', 'admin')
  })

  it('nonUI', function() {
    assert.equal(Object.keys(nonUiConfig).length, configItems.length)
  })
})

describe('lib/config', function() {
  // TODO test when control is inverted/dependencies injected
  // set any process.env variables or args here
  // process.argv.push('--debug')
  // process.env.SQLPAD_DEBUG = 'FALSE'
  // process.env.GOOGLE_CLIENT_ID = 'google-client-id'

  describe('#get()', function() {
    it('should get a value provided by default', function() {
      return configUtil.getHelper(db).then(config => {
        assert.equal(config.get('port'), 80, 'port=80')
      })
    })
    it('should only accept key in config items', function() {
      return configUtil.getHelper(db).then(config => {
        assert.throws(() => config.get('non-existent-key'), Error)
      })
    })
  })
})
