require('../typedefs');
const _ = require('lodash');
const passport = require('passport');
const passportCustom = require('passport-custom');
const CustomStrategy = passportCustom.Strategy;
const appLog = require('../lib/app-log');
const getHeaderUser = require('./get-header-user');

/**
 * An auth-proxy custom strategy
 * If enabled, iterate over headers and map the values to a user object
 * Look up that user and perform usual auth validations
 * @param {import('express').Request & Req} req
 * @param {function} done
 */
async function authProxyStrategy(req, done) {
  try {
    const { config, models } = req;

    const headerUser = getHeaderUser(req) || {};

    // If id and email are not provided we don't have anything to look existing user account up with
    // The request is incomplete and not authorized
    if (!headerUser._id && !headerUser.email) {
      return done(null, false);
    }

    if (!headerUser.role && config.get('authProxyDefaultRole')) {
      headerUser.role = config.get('authProxyDefaultRole');
    }

    // Try to find existing user in SQLPad's db
    // This tries to find a match on both id and email, with id taking priority
    let existingUser;
    if (headerUser._id) {
      existingUser = await models.users.findOneById(headerUser._id);
    }
    if (!existingUser && headerUser.email) {
      existingUser = await models.users.findOneByEmail(headerUser.email);
    }

    // If existing user is found, see if there are changes and update it
    // Only perform update if actual changes though
    if (existingUser) {
      // Get a subset of existing user to use for comparison
      const existingForCompare = {};
      Object.keys(headerUser).forEach(key => {
        existingForCompare[key] = existingUser[key];
      });

      if (!_.isEqual(headerUser, existingForCompare)) {
        _.merge(existingUser, headerUser);
        existingUser = await models.users.save(existingUser);
      }
      return done(null, existingUser);
    }

    // If auto sign up is turned on create user
    if (config.get('authProxyAutoSignUp')) {
      // If role or email are not provided no auth
      if (!headerUser.role || !headerUser.email) {
        return done(null, false);
      }

      // Auto create the user
      const newUser = await models.users.save(headerUser);
      return done(null, newUser);
    }

    return done(null, false);
  } catch (error) {
    done(error);
  }
}

/**
 * Adds auth proxy strategy if configured
 * @param {object} config
 */
function enableAuthProxy(config) {
  if (config.get('authProxyEnabled')) {
    appLog.info('Enabling Auth Proxy authentication strategy.');
    passport.use('auth-proxy', new CustomStrategy(authProxyStrategy));
  }
}

module.exports = enableAuthProxy;
