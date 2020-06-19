const passport = require('passport');
// const PassportLocalStrategy = require('passport-local').Strategy;
const appLog = require('../lib/app-log');
// const passhash = require('../lib/passhash.js');
const ActiveDirectoryStrategy = require('passport-activedirectory');
// const ActiveDirectory = require('activedirectory');

function enableLdap(config) {
  if (!config.get('enableLdapAuth')) {
    return;
  }

  appLog.info('Enabling ldap authentication strategy.');
  passport.use(
    new ActiveDirectoryStrategy(
      {
        passReqToCallback: true,
        integrated: false,
        usernameField: 'email',
        passwordField: 'password',
        ldap: {
          url: config.get('ldapUrl'),
          baseDN: config.get('ldapBaseDN'),
          username: config.get('ldapUsername'),
          password: config.get('ldapPassword'),
        },
      },
      async function passportLdapStrategyHandler(req, profile, ad, done) {
        try {
          const { models } = req;
          const mail = profile._json.mail.toLowerCase();
          const user = await models.users.findOneByEmail(mail);
          if (!user) {
            return done(null, false, {
              message: 'wrong LDAP username or password',
            });
          }
          return done(null, {
            id: user.id,
            role: user.role,
            email: user.email,
          });
        } catch (error) {
          done(error);
        }
      }
    )
  );
}

module.exports = enableLdap;
