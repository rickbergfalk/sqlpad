const fs = require('fs');
const path = require('path');
const express = require('express');
const helmet = require('helmet');
const pino = require('pino');
const session = require('express-session');
const FileStore = require('session-file-store')(session);
const appLog = require('./lib/app-log');
const bodyParser = require('body-parser');
const favicon = require('serve-favicon');
const passport = require('passport');
const authStrategies = require('./auth-strategies');
const sessionlessAuth = require('./middleware/sessionless-auth.js');
const ResponseUtils = require('./lib/response-utils.js');
const expressPinoLogger = require('express-pino-logger');

/**
 * Create an express app using config
 * @param {object} config
 */
function makeApp(config, models) {
  if (typeof config.get !== 'function') {
    throw new Error('config is required to create app');
  }
  if (!models) {
    throw new Error('models is required to create app');
  }

  const expressPino = expressPinoLogger({
    level: config.get('webLogLevel'),
    timestamp: pino.stdTimeFunctions.isoTime,
    name: 'sqlpad-web',
    // express-pino-logger logs all the headers by default
    // Removing these for now but open to adding them back in based on feedback
    redact: {
      paths: [
        'req.headers',
        'res.headers',
        'req.remoteAddress',
        'req.remotePort'
      ],
      remove: true
    }
  });

  /*  Express setup
  ============================================================================= */
  const app = express();

  // Default helmet protections, minus frameguard (becaue of sqlpad iframe embed), adding referrerPolicy
  app.use(helmet.dnsPrefetchControl());
  app.use(helmet.hidePoweredBy());
  app.use(helmet.hsts({}));
  app.use(helmet.ieNoOpen());
  app.use(helmet.noSniff());
  app.use(helmet.xssFilter());
  app.use(helmet.referrerPolicy({ policy: 'same-origin' }));

  // Decorate req and res with SQLPad objects and utils
  app.use(function(req, res, next) {
    req.config = config;
    req.models = models;
    req.appLog = appLog;

    res.utils = new ResponseUtils(res, next);

    next();
  });

  app.use(expressPino);
  app.use(favicon(path.join(__dirname, '/public/favicon.ico')));
  app.use(bodyParser.json());
  app.use(
    bodyParser.urlencoded({
      extended: true
    })
  );

  const cookieMaxAgeMs = parseInt(config.get('sessionMinutes'), 10) * 60 * 1000;
  const sessionPath = path.join(config.get('dbPath'), '/sessions');

  app.use(
    session({
      store: new FileStore({
        path: sessionPath,
        logFn: () => {}
      }),
      saveUninitialized: false,
      resave: true,
      rolling: true,
      cookie: { maxAge: cookieMaxAgeMs },
      secret: config.get('cookieSecret'),
      name: config.get('cookieName')
    })
  );

  const baseUrl = config.get('baseUrl');

  app.use(baseUrl, express.static(path.join(__dirname, 'public')));

  /*  Passport setup
  ============================================================================= */
  authStrategies(config);
  app.use(passport.initialize());
  app.use(passport.session());

  /*  Routes
  ============================================================================= */
  const preAuthRouters = [
    require('./routes/forgot-password.js'),
    require('./routes/password-reset.js'),
    require('./routes/signout.js'),
    require('./routes/signup.js'),
    require('./routes/signin.js'),
    require('./routes/google-auth.js'),
    require('./routes/saml.js')
  ];

  // Add pre-auth routes to app
  preAuthRouters.forEach(router => app.use(baseUrl, router));

  // Add sessionless authentication middleware
  // This handles things like HTTP basic, auth proxy, disable auth, and JWT service tokens
  // These attempt to authenticate the request based on information passed every request
  // They do not persist a session
  app.use(sessionlessAuth);

  const authRequiredRouters = [
    require('./routes/query-result.js'),
    require('./routes/download-results.js'),
    require('./routes/queries.js'),
    require('./routes/drivers.js'),
    require('./routes/users.js'),
    require('./routes/connections.js'),
    require('./routes/connection-accesses.js'),
    require('./routes/connection-clients.js'),
    require('./routes/test-connection.js'),
    require('./routes/query-history.js'),
    require('./routes/schema-info.js'),
    require('./routes/tags.js'),
    require('./routes/format-sql.js'),
    require('./routes/service-tokens.js')
  ];

  // Add all core routes to the baseUrl except for the */api/app route
  authRequiredRouters.forEach(router => app.use(baseUrl, router));

  // Add '*/api/app' route last and without baseUrl
  app.use(require('./routes/app.js'));

  // For any missing api route, return a 404
  // NOTE - this cannot be a general catch-all because it might be a valid non-api route from a front-end perspective
  app.use(baseUrl + '/api/', function(req, res) {
    req.log.debug('reached catch all api route');
    return res.utils.notFound();
  });

  // Add an error handler for /api
  app.use(baseUrl + '/api/', function(err, req, res, next) {
    if (res.headersSent) {
      return next(err);
    }
    console.log(err);
    return res.status(500).json({
      title: 'Internal Server Error'
    });
  });

  // Anything else should render the client-side app
  // Client-side routing will take care of things from here
  // Because index.html will be served via static plugin,
  // we need to rename it to something else and switch out the URLs to consider the baseUrl
  const indexPath = path.join(__dirname, 'public/index.html');
  const indexTemplatePath = path.join(__dirname, 'public/index-template.html');

  if (fs.existsSync(indexPath)) {
    fs.renameSync(indexPath, indexTemplatePath);
  }

  if (fs.existsSync(indexTemplatePath)) {
    const html = fs.readFileSync(indexTemplatePath, 'utf8');
    const baseUrlHtml = html
      .replace(/="\/stylesheets/g, `="${baseUrl}/stylesheets`)
      .replace(/="\/javascripts/g, `="${baseUrl}/javascripts`)
      .replace(/="\/images/g, `="${baseUrl}/images`)
      .replace(/="\/fonts/g, `="${baseUrl}/fonts`)
      .replace(/="\/static/g, `="${baseUrl}/static`);
    app.use((req, res) => res.send(baseUrlHtml));
  } else {
    appLog.warn('NO FRONT END TEMPLATE DETECTED');
    appLog.warn('If not running in dev mode please report this issue.');
  }

  return app;
}

module.exports = makeApp;
