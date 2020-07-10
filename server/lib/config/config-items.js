const configItems = [
  {
    key: 'allowedDomains',
    envVar: 'SQLPAD_ALLOWED_DOMAINS',
    default: '',
  },
  {
    key: 'config',
    envVar: 'SQLPAD_CONFIG',
    default: '',
  },
  {
    key: 'migrate',
    envVar: 'SQLPAD_MIGRATE',
    default: '',
  },
  {
    key: 'cookieName',
    envVar: 'SQLPAD_COOKIE_NAME',
    default: 'sqlpad.sid',
  },
  {
    key: 'cookieSecret',
    envVar: 'SQLPAD_COOKIE_SECRET',
    default: 'secret-used-to-sign-cookies-please-set-and-make-strong',
  },
  {
    key: 'sessionMinutes',
    envVar: 'SQLPAD_SESSION_MINUTES',
    default: 60,
  },
  {
    key: 'timeoutSeconds',
    envVar: 'SQLPAD_TIMEOUT_SECONDS',
    default: 300,
  },
  {
    key: 'ip',
    envVar: 'SQLPAD_IP',
    default: '0.0.0.0',
  },
  {
    key: 'port',
    envVar: 'SQLPAD_PORT',
    default: 80,
  },
  {
    key: 'systemdSocket',
    envVar: 'SQLPAD_SYSTEMD_SOCKET',
    default: false,
  },
  {
    key: 'dbPath',
    envVar: 'SQLPAD_DB_PATH',
    default: '',
  },
  {
    key: 'dbAutomigrate',
    envVar: 'SQLPAD_DB_AUTOMIGRATE',
    default: true,
  },
  {
    key: 'baseUrl',
    envVar: 'SQLPAD_BASE_URL',
    default: '',
  },
  {
    key: 'passphrase',
    envVar: 'SQLPAD_PASSPHRASE',
    default: "At least the sensitive bits won't be plain text?",
  },
  {
    key: 'certPassphrase',
    envVar: 'CERT_PASSPHRASE',
    default: '',
    deprecated:
      'To be removed in v6. Delegate SSL to reverse proxy instead https://github.com/goldbergyoni/nodebestpractices/blob/master/sections/production/delegatetoproxy.md',
  },
  {
    key: 'keyPath',
    envVar: 'KEY_PATH',
    default: '',
    deprecated:
      'To be removed in v6. Delegate SSL to reverse proxy instead https://github.com/goldbergyoni/nodebestpractices/blob/master/sections/production/delegatetoproxy.md',
  },
  {
    key: 'certPath',
    envVar: 'CERT_PATH',
    default: '',
    deprecated:
      'To be removed in v6. Delegate SSL to reverse proxy instead https://github.com/goldbergyoni/nodebestpractices/blob/master/sections/production/delegatetoproxy.md',
  },
  {
    key: 'admin',
    envVar: 'SQLPAD_ADMIN',
    default: '',
  },
  {
    key: 'adminPassword',
    envVar: 'SQLPAD_ADMIN_PASSWORD',
    default: '',
  },
  {
    key: 'defaultConnectionId',
    envVar: 'SQLPAD_DEFAULT_CONNECTION_ID',
    default: '',
  },
  {
    key: 'googleClientId_d',
    envVar: 'GOOGLE_CLIENT_ID',
    default: '',
    deprecated: 'To be removed in v6. Use SQLPAD_GOOGLE_CLIENT_ID instead.',
  },
  {
    key: 'googleClientId',
    envVar: 'SQLPAD_GOOGLE_CLIENT_ID',
    default: '',
  },
  {
    key: 'googleClientSecret_d',
    envVar: 'GOOGLE_CLIENT_SECRET',
    default: '',
    deprecated: 'To be removed in v6. Use SQLPAD_GOOGLE_CLIENT_SECRET instead.',
  },
  {
    key: 'googleClientSecret',
    envVar: 'SQLPAD_GOOGLE_CLIENT_SECRET',
    default: '',
  },
  {
    key: 'publicUrl',
    envVar: 'PUBLIC_URL',
    default: '',
  },
  {
    key: 'disableUserpassAuth',
    envVar: 'DISABLE_USERPASS_AUTH',
    default: false,
  },
  {
    key: 'enableLdapAuth',
    envVar: 'ENABLE_LDAP_AUTH',
    default: false,
  },
  {
    key: 'ldapUrl',
    envVar: 'LDAP_URL',
    default: '',
  },
  {
    key: 'ldapBaseDN',
    envVar: 'LDAP_BASE_DN',
    default: '',
  },
  {
    key: 'ldapUsername',
    envVar: 'LDAP_USERNAME',
    default: '',
  },
  {
    key: 'ldapPassword',
    envVar: 'LDAP_PASSWORD',
    default: '',
  },
  {
    key: 'serviceTokenSecret',
    envVar: 'SERVICE_TOKEN_SECRET',
    default: '',
  },
  {
    key: 'disableAuth',
    envVar: 'DISABLE_AUTH',
    default: false,
    deprecated: 'To be deprecated in v6. Use AUTH_DISABLED instead.',
  },
  {
    key: `authDisabled`,
    envVar: 'SQLPAD_AUTH_DISABLED',
    default: false,
  },
  {
    key: 'disableAuthDefaultRole',
    envVar: 'SQLPAD_DISABLE_AUTH_DEFAULT_ROLE',
    default: 'editor',
    deprecated:
      'To be deprecated in v6. Use SQLPAD_AUTH_DISABLED_DEFAULT_ROLE instead.',
  },
  {
    key: 'authDisabledDefaultRole',
    envVar: 'SQLPAD_AUTH_DISABLED_DEFAULT_ROLE',
    default: '', // TODO change to 'editor' in v6, when removing SQLPAD_DISABLE_AUTH_DEFAULT_ROLE
  },
  {
    key: 'allowCsvDownload',
    envVar: 'SQLPAD_ALLOW_CSV_DOWNLOAD',
    default: true,
  },
  {
    key: 'editorWordWrap',
    envVar: 'SQLPAD_EDITOR_WORD_WRAP',
    default: false,
  },
  {
    key: 'queryResultMaxRows',
    envVar: 'SQLPAD_QUERY_RESULT_MAX_ROWS',
    default: 50000,
  },
  {
    key: 'slackWebhook',
    envVar: 'SQLPAD_SLACK_WEBHOOK',
    default: '',
  },
  {
    key: 'smtpFrom',
    envVar: 'SQLPAD_SMTP_FROM',
    default: '',
  },
  {
    key: 'smtpHost',
    envVar: 'SQLPAD_SMTP_HOST',
    default: '',
  },
  {
    key: 'smtpPort',
    envVar: 'SQLPAD_SMTP_PORT',
    default: '',
  },
  {
    key: 'smtpSecure',
    envVar: 'SQLPAD_SMTP_SECURE',
    default: true,
  },
  {
    key: 'smtpUser',
    envVar: 'SQLPAD_SMTP_USER',
    default: '',
  },
  {
    key: 'smtpPassword',
    envVar: 'SQLPAD_SMTP_PASSWORD',
    default: '',
  },
  {
    key: 'whitelistedDomains',
    envVar: 'WHITELISTED_DOMAINS',
    default: '',
    deprecated: 'To be removed in v6. Use allowedDomains instead',
  },
  {
    key: 'samlEntryPoint',
    envVar: 'SQLPAD_SAML_ENTRY_POINT',
    default: '',
  },
  {
    key: 'samlEntryPoint_d',
    envVar: 'SAML_ENTRY_POINT',
    default: '',
    deprecated: 'To be removed in v6. Use SQLPAD_SAML_ENTRY_POINT instead',
  },
  {
    key: 'samlIssuer',
    envVar: 'SQLPAD_SAML_ISSUER',
    default: '',
  },
  {
    key: 'samlIssuer_d',
    envVar: 'SAML_ISSUER',
    default: '',
    deprecated: 'To be removed in v6. Use SQLPAD_SAML_ISSUER instead',
  },
  {
    key: 'samlCallbackUrl',
    envVar: 'SQLPAD_SAML_CALLBACK_URL',
    default: '',
  },
  {
    key: 'samlCallbackUrl_d',
    envVar: 'SAML_CALLBACK_URL',
    default: '',
    deprecated: 'To be removed in v6. Use SQLPAD_SAML_CALLBACK_URL instead',
  },
  {
    key: 'samlCert',
    envVar: 'SQLPAD_SAML_CERT',
    default: '',
  },
  {
    key: 'samlCert_d',
    envVar: 'SAML_CERT',
    default: '',
    deprecated: 'To be removed in v6. Use SQLPAD_SAML_CERT instead',
  },
  {
    key: 'samlAuthContext',
    envVar: 'SQLPAD_SAML_AUTH_CONTEXT',
    default: '',
  },
  {
    key: 'samlAuthContext_d',
    envVar: 'SAML_AUTH_CONTEXT',
    default: '',
    deprecated: 'To be removed in v6. Use SQLPAD_SAML_AUTH_CONTEXT instead',
  },
  {
    key: 'samlLinkHtml',
    envVar: 'SQLPAD_SAML_LINK_HTML',
    default: '', // Change to 'Sign in with SSO' in v6 when removing samlLinkHtml_d
  },
  {
    key: 'samlLinkHtml_d',
    envVar: 'SAML_LINK_HTML',
    default: 'Sign in with SSO',
    deprecated: 'To be removed in v6. Use SQLPAD_SAML_LINK_HTML instead',
  },
  {
    key: 'samlAutoSignUp',
    envVar: 'SQLPAD_SAML_AUTO_SIGN_UP',
    default: false,
  },
  {
    key: 'samlDefaultRole',
    envVar: 'SQLPAD_SAML_DEFAULT_ROLE',
    default: 'editor',
  },
  {
    key: 'allowConnectionAccessToEveryone',
    envVar: 'SQLPAD_ALLOW_CONNECTION_ACCESS_TO_EVERYONE',
    default: true,
  },
  {
    key: 'queryHistoryRetentionTimeInDays',
    envVar: 'SQLPAD_QUERY_HISTORY_RETENTION_TIME_IN_DAYS',
    default: 30,
  },
  {
    key: 'queryHistoryResultMaxRows',
    envVar: 'SQLPAD_QUERY_HISTORY_RESULT_MAX_ROWS',
    default: 1000,
  },
  {
    key: 'appLogLevel',
    envVar: 'SQLPAD_APP_LOG_LEVEL',
    default: 'info',
  },
  {
    key: 'webLogLevel',
    envVar: 'SQLPAD_WEB_LOG_LEVEL',
    default: 'info',
  },
  {
    key: 'dbInMemory',
    envVar: 'SQLPAD_DB_IN_MEMORY',
    default: false,
  },
  {
    key: 'backendDatabaseUri',
    envVar: 'SQLPAD_BACKEND_DB_URI',
    default: '',
  },
  {
    key: 'seedDataPath',
    envVar: 'SQLPAD_SEED_DATA_PATH',
    default: '',
  },
  {
    key: 'authProxyEnabled',
    envVar: 'SQLPAD_AUTH_PROXY_ENABLED',
    default: false,
  },
  {
    key: 'authProxyAutoSignUp',
    envVar: 'SQLPAD_AUTH_PROXY_AUTO_SIGN_UP',
    default: false,
  },
  {
    key: 'authProxyDefaultRole',
    envVar: 'SQLPAD_AUTH_PROXY_DEFAULT_ROLE',
    default: '',
  },
  // Define headers to map to user attributes, space delimited
  // At a minimum, email or id must be mapped, as they will be used as a user identifier
  // Other attributes may be mapped as well, including data attributes via data.somePropertyName
  // Example `id:X-WEBAUTH-ID email:X-WEBAUTH-EMAIL name:X-WEBAUTH-NAME role:X-WEBAUTH-ROLE data.field:X-WEBAUTH-field`
  {
    key: 'authProxyHeaders',
    envVar: 'SQLPAD_AUTH_PROXY_HEADERS',
    default: '',
  },
  {
    key: 'oidcClientId',
    envVar: 'SQLPAD_OIDC_CLIENT_ID',
    default: '',
  },
  {
    key: 'oidcClientSecret',
    envVar: 'SQLPAD_OIDC_CLIENT_SECRET',
    default: '',
  },
  {
    key: 'oidcIssuer',
    envVar: 'SQLPAD_OIDC_ISSUER',
    default: '',
  },
  {
    key: 'oidcAuthorizationUrl',
    envVar: 'SQLPAD_OIDC_AUTHORIZATION_URL',
    default: '',
  },
  {
    key: 'oidcTokenUrl',
    envVar: 'SQLPAD_OIDC_TOKEN_URL',
    default: '',
  },
  {
    key: 'oidcUserInfoUrl',
    envVar: 'SQLPAD_OIDC_USER_INFO_URL',
    default: '',
  },
  {
    key: 'oidcLinkHtml',
    envVar: 'SQLPAD_OIDC_LINK_HTML',
    default: 'Sign in with OpenID',
  },
];

module.exports = configItems;
