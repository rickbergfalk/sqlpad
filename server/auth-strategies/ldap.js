const passport = require('passport');
const ldap = require('ldapjs');
const appLog = require('../lib/app-log');
const LdapStrategy = require('passport-ldapauth');

function bindClient(client, bindDN, ldapPassword) {
  return new Promise((resolve, reject) => {
    client.bind(bindDN, ldapPassword, function (err) {
      if (err) {
        return reject(err);
      }
      return resolve();
    });
  });
}

/**
 * Convenience wrapper to query ldap and get an array of results
 * If nothing found empty array is returned
 * @param {*} client
 * @param {string} searchBase
 * @param {string} scope - base or sub
 * @param {string} filter - ldap query string
 */
function queryLdap(client, searchBase, scope, filter) {
  const opts = {
    scope,
    filter,
  };
  return new Promise((resolve, reject) => {
    client.search(searchBase, opts, (err, res) => {
      const results = [];
      if (err) {
        return reject(err);
      }

      // eslint-disable-next-line no-unused-vars
      res.on('searchEntry', function (entry) {
        results.push(entry.object);
      });
      res.on('error', function (err) {
        reject(err);
      });
      res.on('end', function () {
        resolve(results);
      });
    });
  });
}

function enableLdap(config) {
  if (!(config.get('ldapAuthEnabled') || config.get('enableLdapAuth'))) {
    return;
  }

  const bindDN =
    config.get('ldapBindDN') ||
    config.get('ldapUsername') ||
    config.get('ldapUsername_d');

  const bindCredentials =
    config.get('ldapPassword') || config.get('ldapPassword_d');

  const searchBase =
    config.get('ldapSearchBase') ||
    config.get('ldapBaseDN') ||
    config.get('ldapBaseDN_d');

  appLog.info('Enabling ldap authentication strategy.');
  passport.use(
    new LdapStrategy(
      {
        passReqToCallback: true,
        integrated: false,
        // email field from local auth is used for username when using LDAP
        usernameField: 'email',
        passwordField: 'password',
        server: {
          url: config.get('ldapUrl') || config.get('ldapUrl_d'),
          searchBase,
          bindDN,
          bindCredentials,
          searchFilter: config.get('ldapSearchFilter'),
          groupSearchBase: config.get('ldapBaseDN'),
          groupSearchFilter: '(cn={{dn}})',
        },
      },
      async function passportLdapStrategyHandler(req, profile, done) {
        try {
          const { models } = req;

          const profileUsername = profile.uid || profile.sAMAccountName;
          const adminRoleFilter = config.get('ldapRoleAdminFilter');
          const editorRoleFilter = config.get('ldapRoleEditorFilter');

          // At least with test setup, jpegPhoto is gnarly output
          // Remove prior to logging
          delete profile.jpegPhoto;
          appLog.debug(profile, 'Found user');

          // not quite sure if uid is returned for ActiveDirectory
          if (!profileUsername) {
            return done(null, false, {
              message: 'wrong LDAP username or password',
            });
          }

          // Derive a userId fiter based on profile that is found
          // ActiveDirectory will have sAMAccountName, while OpenLDAP will have uid
          let userIdFilter = '';
          if (profile.sAMAccountName) {
            userIdFilter = `(sAMAccountName=${profile.sAMAccountName})`;
          } else if (profile.uid) {
            userIdFilter = `(uid=${profile.uid})`;
          }

          // Email could be multi-valued
          // For now first is used, but might need to check both in future?
          let email = Array.isArray(profile.mail)
            ? profile.mail[0]
            : profile.mail;

          email = email.toLowerCase();

          let role = '';

          // If all rbac configs are set,
          // update role later on if user is found and current role doesn't match
          let rbacByProfile = false;

          // If admin or editor role filters are specified, open a connection to LDAP server and run additional queries
          // Try to find a role by running searches with a restriction on user that was found
          // Searches should start with most priveleged, then progress onward
          // If a row is returned, the user can be assigned that role and no other queries are needed
          if (adminRoleFilter || editorRoleFilter) {
            // Establish LDAP client to make additional queries
            const client = ldap.createClient({
              url: config.get('ldapUrl'),
            });
            await bindClient(client, bindDN, bindCredentials);

            try {
              rbacByProfile = true;

              if (adminRoleFilter) {
                const results = await queryLdap(
                  client,
                  searchBase,
                  'sub',
                  `(&${userIdFilter}${adminRoleFilter})`
                );
                if (results.length > 0) {
                  appLog.debug(
                    `${profileUsername} successfully logged in with role admin`
                  );
                  role = 'admin';
                }
              }

              // If role wasn't found for admin, try running editor search
              if (!role && editorRoleFilter) {
                const results = await queryLdap(
                  client,
                  searchBase,
                  'sub',
                  `(&${userIdFilter}${adminRoleFilter})`
                );
                if (results.length > 0) {
                  appLog.debug(
                    `${profileUsername} successfully logged in with role editor`
                  );
                  role = 'editor';
                }
              }

              // Close connection to LDAP server
              client.unbind();
            } catch (error) {
              // If an error happened, make sure LDAP connection is closed then rethrow error
              client.unbind();
              throw error;
            }
          }

          // If role wasn't set by RBAC, use default
          if (!role) {
            role = config.get('ldapDefaultRole');
          }

          let [openAdminRegistration, user] = await Promise.all([
            models.users.adminRegistrationOpen(),
            models.users.findOneByEmail(email),
          ]);

          if (user) {
            if (user.disabled) {
              return done(null, false);
            }

            // If user already exists but role doesn't match, update it
            if (user.role !== role && rbacByProfile) {
              const newUser = await models.users.update(user.id, {
                role,
              });
              return done(null, newUser);
            }

            // Otherwise return found user
            return done(null, user);
          }

          if (openAdminRegistration || config.get('ldapAutoSignUp')) {
            appLog.debug(`adding user ${profileUsername} to role ${role}`);
            const newUser = await models.users.create({
              email,
              role,
              signupAt: new Date(),
            });
            return done(null, newUser);
          }

          // If no user was found, and config does not allow initial log in or auto-creating users,
          // Return not authorized
          return done(null, false);
        } catch (error) {
          done(error);
        }
      }
    )
  );
}

module.exports = enableLdap;
