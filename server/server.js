#!/usr/bin/env node

const fs = require('fs')
const http = require('http')
const https = require('https')
const detectPort = require('detect-port')

// Parse command line flags to see if anything special needs to happen
require('./lib/cli-flow.js')

const app = require('./app')
const {
  baseUrl,
  ip,
  port,
  httpsPort,
  certPassphrase,
  keyPath,
  certPath,
  systemdSocket
} = require('./lib/config').getConfig()
const db = require('./lib/db')

function isFdObject(ob) {
  return ob && typeof ob.fd === 'number'
}

// When --systemd-socket is passed we will try to acquire the bound socket
// directly from Systemd.
//
// More info
//
// https://github.com/rickbergfalk/sqlpad/pull/185
// https://www.freedesktop.org/software/systemd/man/systemd.socket.html
// https://www.freedesktop.org/software/systemd/man/sd_listen_fds.html
function detectPortOrSystemd(port) {
  if (systemdSocket) {
    const passedSocketCount = parseInt(process.env.LISTEN_FDS, 10) || 0

    // LISTEN_FDS contains number of sockets passed by Systemd. At least one
    // must be passed. The sockets are set to file descriptors starting from 3.
    // We just crab the first socket from fd 3 since sqlpad binds only one
    // port.
    if (passedSocketCount > 0) {
      console.log('Using port from Systemd')
      return Promise.resolve({ fd: 3 })
    } else {
      console.error(
        'Warning: Systemd socket asked but not found. Trying to bind port ' +
          port +
          ' manually'
      )
    }
  }

  return detectPort(port)
}

/*  Start the Server
============================================================================= */
db.onLoad(function(err) {
  if (err) throw err

  // determine if key pair exists for certs
  if (keyPath && certPath) {
    // https only
    detectPortOrSystemd(httpsPort).then(function(_port) {
      if (!isFdObject(_port) && httpsPort !== _port) {
        console.log(
          '\nPort %d already occupied. Using port %d instead.',
          httpsPort,
          _port
        )
        // TODO FIXME XXX  Persist the new port to the in-memory store.
        // config.set('httpsPort', _port)
      }

      const privateKey = fs.readFileSync(keyPath, 'utf8')
      const certificate = fs.readFileSync(certPath, 'utf8')
      const httpsOptions = {
        key: privateKey,
        cert: certificate,
        passphrase: certPassphrase
      }

      https.createServer(httpsOptions, app).listen(_port, ip, function() {
        console.log(
          '\nWelcome to ' +
            app.locals.title +
            '!. Visit https://' +
            (ip === '0.0.0.0' ? 'localhost' : ip) +
            ':' +
            _port +
            baseUrl +
            ' to get started'
        )
      })
    })
  } else {
    // http only
    detectPortOrSystemd(port).then(function(_port) {
      if (!isFdObject(_port) && port !== _port) {
        console.log(
          '\nPort %d already occupied. Using port %d instead.',
          port,
          _port
        )
        // TODO FIXME XXX  Persist the new port to the in-memory store.
        // config.set('port', _port)
      }
      http.createServer(app).listen(_port, ip, function() {
        console.log(
          '\nWelcome to ' +
            app.locals.title +
            '!. Visit http://' +
            (ip === '0.0.0.0' ? 'localhost' : ip) +
            ':' +
            _port +
            baseUrl +
            ' to get started'
        )
      })
    })
  }
})
