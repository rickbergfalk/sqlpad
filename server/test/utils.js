const assert = require('assert');
const { v4: uuidv4 } = require('uuid');
const rimraf = require('rimraf');
const mkdirp = require('mkdirp');
const path = require('path');
const request = require('supertest');
const Config = require('../lib/config');
const appLog = require('../lib/app-log');
const db = require('../lib/db');
const makeApp = require('../app');
const migrate = require('../lib/migrate');
const loadSeedData = require('../lib/load-seed-data');

const TEST_ARTIFACTS_DIR = path.join(__dirname, '/artifacts');

function clearArtifacts() {
  mkdirp.sync(TEST_ARTIFACTS_DIR);
  return new Promise((resolve, reject) => {
    return rimraf(path.join(__dirname, '/artifacts/*'), err => {
      if (err) {
        return reject(err);
      }
      resolve();
    });
  });
}

class TestUtils {
  constructor(args = {}) {
    const config = new Config(
      {
        debug: true,
        // Despite being in-memory, still need a file path for cache and session files
        // Eventually these will be moved to sqlite and we can be fully-in-memory
        dbPath: TEST_ARTIFACTS_DIR,
        dbInMemory: true,
        appLogLevel: 'silent',
        webLogLevel: 'silent',
        proxyAuthEnabled: true,
        proxyAuthHeaders: 'email:X-WEBAUTH-EMAIL',
        ...args
      },
      {}
    );

    // TODO - this is problematic because multiple TestUtils are created all at once in describe()
    // and last one wins. This modifies a global state,
    // so there is no way for this to be enabled just for 1 test and not another
    appLog.setLevel(config.get('appLogLevel'));

    this.config = config;
    this.appLog = appLog;
    this.instanceAlias = uuidv4();
    this.sequelizeDb = undefined;
    this.app = undefined;
    this.models = undefined;
    this.nedb = undefined;

    this.users = {
      admin: {
        _id: undefined, // set if created
        email: 'admin@test.com',
        password: 'admin',
        role: 'admin'
      },
      editor: {
        _id: undefined, // set if created
        email: 'editor@test.com',
        password: 'editor',
        role: 'editor'
      },
      editor2: {
        _id: undefined, // set if created
        email: 'editor2@test.com',
        password: 'editor2',
        role: 'editor2'
      }
    };
  }

  async initDbs() {
    db.makeDb(this.config, this.instanceAlias);
    const { models, nedb, sequelizeDb } = await db.getDb(this.instanceAlias);
    this.models = models;
    this.nedb = nedb;
    this.sequelizeDb = sequelizeDb;
  }

  async migrate() {
    await migrate(
      this.config,
      this.appLog,
      this.nedb,
      this.sequelizeDb.sequelize
    );
  }

  async loadSeedData() {
    await loadSeedData(this.appLog, this.config, this.models);
  }

  async addUserApiHelper(key, user) {
    const newUser = await this.models.users.save(user);
    // If user already exists, update the _id, otherwise add new one (using the original data)
    if (this.users[key]) {
      this.users[key]._id = newUser._id;
    } else {
      // We must use original user object passed in as it has the password. the response from .save() does not
      this.users[key] = { ...user, _id: newUser._id };
    }
    return newUser;
  }

  async init(withUsers) {
    await clearArtifacts();
    await this.initDbs();
    await this.migrate();
    await this.loadSeedData();

    this.app = makeApp(this.config, this.models);

    assert.throws(() => {
      db.makeDb(this.config, this.instanceAlias);
    }, 'ensure nedb can be made once');

    if (withUsers) {
      for (const key of Object.keys(this.users)) {
        // eslint-disable-next-line no-await-in-loop
        await this.addUserApiHelper(key, this.users[key]);
      }
    }
  }

  async del(userKey, url, statusCode = 200) {
    const req = request(this.app).delete(url);
    if (this.users[userKey]) {
      req.set('X-WEBAUTH-EMAIL', this.users[userKey].email);
    }
    const response = await req.expect(statusCode);
    return response.body;
  }

  async get(userKey, url, statusCode = 200) {
    const req = request(this.app).get(url);
    if (this.users[userKey]) {
      req.set('X-WEBAUTH-EMAIL', this.users[userKey].email);
    }
    const response = await req.expect(statusCode);
    return response.body;
  }

  async post(userKey, url, body, statusCode = 200) {
    const req = request(this.app).post(url);
    if (this.users[userKey]) {
      req.set('X-WEBAUTH-EMAIL', this.users[userKey].email);
    }
    const response = await req.send(body).expect(statusCode);
    return response.body;
  }

  async put(userKey, url, body, statusCode = 200) {
    const req = request(this.app).put(url);
    if (this.users[userKey]) {
      req.set('X-WEBAUTH-EMAIL', this.users[userKey].email);
    }
    const response = await req.send(body).expect(statusCode);
    return response.body;
  }
}

module.exports = TestUtils;
