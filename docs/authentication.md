# Authentication

## Local Authentication

By default, SQLPad supports local authentication with email and password. Passwords are stored in SQLPad's embedded database using bcrypt hashing.

Once SQLPad is running, you may create an initial admin account by navigating to [http://localhost/signup](http://localhost/signup).

Once an initial admin account has been created, all future users must be added by an admin within the users page. Other users may also be given admin rights, allowing them to add/edit database connections and add/modify/remove SQLPad users.

If for whatever reason you lose admin rights, and the last-admin-standing won't give you admin rights back, you can reinstate them to yourself by setting environment variable `SQLPAD_ADMIN=yourEmailAddress@domain.com`.

Local authentication can be disabled by setting `SQLPAD_USERPASS_AUTH_DISABLED=true`.

## No Authentication

?> Available as of `4.2.0`

SQLPad can be configured to run without any authentication at all. This can be enabled by setting `SQLPAD_AUTH_DISABLED` to `true`.

If enabled, `SQLPAD_AUTH_DISABLED_DEFAULT_ROLE` is used to assign admin or editor role to users. Set to `editor` if you want to restrict SQLPad to connections defined via configuration.

## Auth Proxy

?> Available as of `4.2.0`

!> When using this feature be sure to restrict access to SQLPad by listening to a restricted IP using `ip`/`SQLPAD_IP` configuration or other method

An HTTP reverse proxy may be used to handle authentication as of SQLPad `4.2.0` or later.

In this setup a proxy handles authentication, passing headers to SQLPad that map to SQLPad user fields. Headers are mapped to user fields, using a space-delimited string using a `<fieldName>:<HEADER-NAME>` syntax.

At a minimum, a user's `email` must be provided in the header mapping (assuming a default role is provided by `SQLPAD_AUTH_PROXY_DEFAULT_ROLE`). Role may otherwise be provided via a header mapping.

SQLPad users do not need to be added ahead of time, and may be created on the fly using `SQLPAD_AUTH_PROXY_AUTO_SIGN_UP`. Whenever a new user is detected (unable to match to existing user on either id or email), a user record will be added to SQLPad's user table and a user signed in. By default users are not auto-created and must otherwise be added ahead of time.

In addition to specifying core SQLPad user fields, custom user data fields may be populated using the field mapping `data.<customFieldName>`. This allows storing custom values to a specific user that may be referenced dynamically in connection configuration using mustache template syntax `{{user.data.<customFieldName>}}`. For example, you may map a user's a database username to `data.dbuser:X-WEBAUTH-DBUSER`, then later reference that value dynamically in a connection configuration by setting username to `{{user.data.dbuser}}`.

User fields available to map are:

- `id` - used to identify users (optional - random value generated for SQLPad user.\_id if not provided)
- `email` - natural identifier for users (required)
- `role` - role for user (optional if `SQLPAD_AUTH_PROXY_DEFAULT_ROLE` defined, otherwise required mapping)
- `name` - name for user (optional)
- `data.<customFieldName>` - custom data field(s) for dynamic connection configuration (optional)

Auth proxy settings are as follows:

```sh
# Enable auth proxy authentication
SQLPAD_AUTH_PROXY_ENABLED = true
# Auto create user record if it does not exist
SQLPAD_AUTH_PROXY_AUTO_SIGN_UP = true
# default role to use if not provided by header
SQLPAD_AUTH_PROXY_DEFAULT_ROLE = editor
# header mappings space-delimited.
# convention is <user-field-to-map-to>:<header-name-to-use-for-value>
SQLPAD_AUTH_PROXY_HEADERS = "id:X-WEBAUTH-ID email:X-WEBAUTH-EMAIL name:X-WEBAUTH-NAME role:X-WEBAUTH-ROLE data.customField:X-WEBAUTH-CUSTOM-FIELD"
```

## Google OAuth

Google OAuth authentication can be enabled by setting the necessary environment variables and configuring your Google API config appropriately.

For OAuth to work be sure to enable the Google+ API for your Google API project. If this isn't enabled it might be why the user profile isn't being fetched.

Next you'll need to set your JavaScript origins and redirect URIs. If you're testing locally, that might look like the below. Remember to consider the base url/mounting path if SQLPad is not running at the root of the domain.

- `Authorized JavaScript origins`: `http://localhost:8080`
- `Authorized redirect URIs`: `http://localhost:8080/auth/google/callback`

Once the Google API config is set, configure the required settings in SQLPad.
For OAuth to be useful this usually involves the following:

- `SQLPAD_GOOGLE_CLIENT_ID`
- `SQLPAD_GOOGLE_CLIENT_SECRET`
- `PUBLIC_URL`=`http://localhost`
- `SQLPAD_USERPASS_AUTH_DISABLED`=`true` (optional - disables plain local user logins)

## OpenID Connect

OpenID Connect authentication can be enabled by setting the following required environment variables:

```sh
# localhost used in dev
PUBLIC_URL = "http://localhost:3010"
SQLPAD_OIDC_CLIENT_ID = "actual-client-id"
SQLPAD_OIDC_CLIENT_SECRET = "actual-client-secret"
# URLs will vary by provider
SQLPAD_OIDC_ISSUER = "https://some.openidprovider.com/oauth2/default"
SQLPAD_OIDC_AUTHORIZATION_URL = "https://some.openidprovider.com/oauth2/default/v1/authorize"
SQLPAD_OIDC_TOKEN_URL = "https://some.openidprovider.com/oauth2/default/v1/token"
SQLPAD_OIDC_USER_INFO_URL = "https://some.openidprovider.okta.com/oauth2/default/v1/userinfo"
```

The callback redirect URI used by SQLPad is `<baseurl>/auth/oidc/callback`.

For the above configuration, assuming `SQLPAD_BASE_URL = "/sqlpad"`, the callback URI configured with the provider should be `http://localhost:3010/sqlpad/auth/oidc/callback`.

The contents of the OpenID sign in button can be customized with the following

```sh
SQLPAD_OIDC_LINK_HTML = "text or inner html here"
```

Prior to authenticating via OpenID, users must still be added to SQLPad with their email address used to log in.

This can be bypassed by using allowed domains to auto-add users for emails belonging to certain domains.

```sh
# space delimited list of domains to allow
SQLPAD_ALLOWED_DOMAINS = "mycompany.com"
```

## SAML

SAML-based authentication can be enabled by setting the necessary environment variables:

- `SAML_LINK_HTML`
- `SAML_AUTH_CONTEXT`
- `SAML_CALLBACK_URL`
- `SAML_CERT`
- `SAML_ENTRY_POINT`
- `SAML_ISSUER`
- `SQLPAD_SAML_AUTO_SIGN_UP`
- `SQLPAD_SAML_DEFAULT_ROLE`
- `PUBLIC_URL`
- `SQLPAD_USERPASS_AUTH_DISABLED`=`true` (optional - disables plain local user logins)

SQLPad users do not need to be added ahead of time, and may be created on the fly using `SQLPAD_SAML_AUTO_SIGN_UP`. Whenever a new user is detected (unable to match to existing user email), a user record will be added to SQLPad's user table and a user signed in. By default users are not auto-created and must otherwise be added ahead of time.

## LDAP (Experimental)

LDAP-based authentication can be enabled by setting the necessary environment variables:

- `SQLPAD_LDAP_AUTH_ENABLED` - Set to TRUE if LDAP enable, FALSE if LDAP disable.
- `SQLPAD_LDAP_URL` - LDAP URL that supports protocols: `ldap://` and `ldaps://`, eg: `ldap://localhost:389`.
- `SQLPAD_LDAP_SEARCH_BASE` - Base LDAP DN to search for users in, eg: `dc=domain,dc=com`.
- `SQLPAD_LDAP_BIND_DN` - The bind user will be used to lookup information about other LDAP users.
- `SQLPAD_LDAP_PASSWORD` - The password to bind with for the lookup user.
- `SQLPAD_LDAP_SEARCH_FILTER` - LDAP search filter, e.g. `(uid={{username}})` in OpenLDAP or `(sAMAccountName={{username}})` in ActiveDirectory. Use literal {{username}} to have the given username used in the search.
- `SQLPAD_USERPASS_AUTH_DISABLED`=`false` (need to enable local user logins)
- `SQLPAD_LDAP_AUTO_SIGN_UP`=`true` (auto sign up ldap users)
- `SQLPAD_LDAP_ROLE_ADMIN_FILTER` - LDAP filter used to determine if a user should be assigned SQLPad admin role
- `SQLPAD_LDAP_ROLE_EDITOR_FILTER` - LDAP filter used to determine if a user should be assigned SQLPad editor role
- `SQLPAD_LDAP_DEFAULT_ROLE`- Default role for users that do not match LDAP role filters. May be either `admin`, `editor`, `denied`, or empty. If `denied` or empty, a user _must_ match an LDAP role filter to be admitted into SQLPad, unless they are previously created as a SQLPad user in advanced.

To assign roles via LDAP-RBAC, you may specify a profile attribute and value to look to for a particular role.

For example, if your LDAP implementation supports `memberOf`, you may decide to use group DN values. In this case two groups are needed, one for editors and one for admins.

```sh
SQLPAD_LDAP_SEARCH_FILTER = "(&(|(memberOf=cn=sqlpad-editors,dc=example,dc=com)(memberOf=cn=sqlpad-admins,dc=example,dc=com))(uid={{username}}))"
SQLPAD_LDAP_ROLE_ADMIN_FILTER = "(memberOf=cn=sqlpad-admins,dc=example,dc=com)"
SQLPAD_LDAP_ROLE_EDITOR_FILTER = "(memberOf=cn=sqlpad-editors,dc=example,dc=com)"
```

The role filters will be combined with the `uid`/`sAMAccountName` filter depending on the profile returned. For example, the `SQLPAD_LDAP_ROLE_ADMIN_FILTER` above would become `(&(memberOf=cn=sqlpad-admins,dc=example,dc=com)(uid=username))` for OpenLDAP or `(&(memberOf=cn=sqlpad-admins,dc=example,dc=com)(sAMAccountName=username))` for ActiveDirectory.

The above example could be simplified, as users that do not match a role filter will not be allowed in unless `SQLPAD_LDAP_DEFAULT_ROLE` is also set.

```sh
# Initial search filter authenticates anyone found in LDAP
SQLPAD_LDAP_SEARCH_FILTER = "(uid={{username}})"
# User must then match one of these filters
SQLPAD_LDAP_ROLE_ADMIN_FILTER = "(memberOf=cn=sqlpad-admins,dc=example,dc=com)"
SQLPAD_LDAP_ROLE_EDITOR_FILTER = "(memberOf=cn=sqlpad-editors,dc=example,dc=com)"
# If a match is not found by role filter, default role will be used if set.
# If not set, or set to "denied", the user will not be allowed in unless previously added manually in SQLPad UI
SQLPAD_LDAP_DEFAULT_ROLE = "denied"
```

LDAP-based authentication can be enabled and used with local authencation together. When both LDAP and local authentication are enabled, LDAP users can sign in using their LDAP username (not an email address) and password, while local users may sign in using their email address and local password.

## Allowed Domains for User Administration

An entire domain can be allowed for username administration by setting environment variable `SQLPAD_ALLOWED_DOMAINS`. This may be particularly useful in combination with OAuth.

## Service Token

The REST API may be called using generated service tokens scoped by role and some optional amount of time.

To enable the creation of service tokens, a token secret must be supplied via `SQLPAD_SERVICE_TOKEN_SECRET`.

To generate a service token, log into SQLPad as an `admin` user and click `Service Tokens`. A service token can be scoped to a certain role (admin or editor) and limited to a window of time.

The generated Bearer token may be used by passing it via the Authorization header:

```sh
curl -X GET -H 'Accept: application/json' -H "Authorization: Bearer the.generated.token" http://localhost:3010/sqlpad/api/users
```

For more information on APIs available see [API Overview](/api-overview).
