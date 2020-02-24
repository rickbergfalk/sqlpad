#!/usr/bin/env node

const fs = require('fs');
const http = require('http');
const https = require('https');
const minimist = require('minimist');
const detectPort = require('detect-port');
const makeApp = require('./app');
const appLog = require('./lib/appLog');
const Config = require('./lib/config');
const { makeDb, getDb } = require('./lib/db');

// Parse command line flags to see if anything special needs to happen
require('./lib/cli-flow.js');

const argv = minimist(process.argv.slice(2));
const config = new Config(argv);

appLog.setLevel(config.get('appLogLevel'));
config.logDebugInfo();

makeDb(config);

const configValidations = config.getValidations();
configValidations.warnings.map(warning => appLog.warn(warning));
if (configValidations.errors.length > 0) {
  configValidations.errors.forEach(error => appLog.error(error));
  process.exit(1);
}

const baseUrl = config.get('baseUrl');
const ip = config.get('ip');
const port = config.get('port');
const httpsPort = config.get('port');
const certPassphrase = config.get('certPassphrase');
const keyPath = config.get('keyPath');
const certPath = config.get('certPath');
const systemdSocket = config.get('systemdSocket');
const timeoutSeconds = config.get('timeoutSeconds');

function isFdObject(ob) {
  return ob && typeof ob.fd === 'number';
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
    const passedSocketCount = parseInt(process.env.LISTEN_FDS, 10) || 0;

    // LISTEN_FDS contains number of sockets passed by Systemd. At least one
    // must be passed. The sockets are set to file descriptors starting from 3.
    // We just crab the first socket from fd 3 since sqlpad binds only one
    // port.
    if (passedSocketCount > 0) {
      appLog.info('Using port from Systemd');
      return Promise.resolve({ fd: 3 });
    } else {
      appLog.warn(
        'Warning: Systemd socket asked but not found. Trying to bind port %d manually',
        port
      );
    }
  }

  return detectPort(port);
}

/*  Start the Server
============================================================================= */
let server;

async function startServer(models) {
  const app = makeApp(config, models);

  // determine if key pair exists for certs
  if (keyPath && certPath) {
    // https only
    const _port = await detectPortOrSystemd(httpsPort);
    if (!isFdObject(_port) && parseInt(httpsPort, 10) !== parseInt(_port, 10)) {
      appLog.info(
        'Port %d already occupied. Using port %d instead.',
        httpsPort,
        _port
      );
      // TODO FIXME XXX  Persist the new port to the in-memory store.
      // config.set('httpsPort', _port)
    }

    const privateKey = fs.readFileSync(keyPath, 'utf8');
    const certificate = fs.readFileSync(certPath, 'utf8');
    const httpsOptions = {
      key: privateKey,
      cert: certificate,
      passphrase: certPassphrase
    };

    server = https
      .createServer(httpsOptions, app)
      .listen(_port, ip, function() {
        const hostIp = ip === '0.0.0.0' ? 'localhost' : ip;
        const url = `https://${hostIp}:${_port}${baseUrl}`;
        appLog.info('Welcome to SQLPad!. Visit %s to get started', url);
      });
  } else {
    // http only
    const _port = await detectPortOrSystemd(port);
    if (!isFdObject(_port) && parseInt(port, 10) !== parseInt(_port, 10)) {
      appLog.info(
        'Port %d already occupied. Using port %d instead.',
        port,
        _port
      );

      // TODO FIXME XXX  Persist the new port to the in-memory store.
      // config.set('port', _port)
    }
    server = http.createServer(app).listen(_port, ip, function() {
      const hostIp = ip === '0.0.0.0' ? 'localhost' : ip;
      const url = `http://${hostIp}:${_port}${baseUrl}`;
      appLog.info('Welcome to SQLPad! Visit %s to get started', url);
    });
  }
  server.setTimeout(timeoutSeconds * 1000);
}

getDb()
  .then(db => startServer(db.models))
  .catch(error => {
    appLog.error(error, 'Error starting SQLPad');
    process.exit(1);
  });

function handleShutdownSignal(signal) {
  if (!server) {
    appLog.info('Received %s, but no server to shutdown', signal);
    process.exit(0);
  } else {
    appLog.info('Received %s, shutting down server...', signal);
    server.close(function() {
      process.exit(0);
    });
  }
}

process.on('SIGTERM', handleShutdownSignal);
process.on('SIGINT', handleShutdownSignal);
