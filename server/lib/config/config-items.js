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
    key: 'httpsPort',
    envVar: 'SQLPAD_HTTPS_PORT',
    default: 443,
  },
  {
    key: 'dbPath',
    envVar: 'SQLPAD_DB_PATH',
    default: '',
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
    key: 'googleClientId',
    envVar: 'GOOGLE_CLIENT_ID',
    default: '',
  },
  {
    key: 'googleClientSecret',
    envVar: 'GOOGLE_CLIENT_SECRET',
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
    key: 'serviceTokenSecret',
    envVar: 'SERVICE_TOKEN_SECRET',
    default: '',
  },
  {
    key: 'disableAuth',
    envVar: 'DISABLE_AUTH',
    default: false,
  },
  {
    key: 'disableAuthDefaultRole',
    envVar: 'SQLPAD_DISABLE_AUTH_DEFAULT_ROLE',
    default: 'editor',
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
    envVar: 'SAML_ENTRY_POINT',
    default: '',
  },
  {
    key: 'samlIssuer',
    envVar: 'SAML_ISSUER',
    default: '',
  },
  {
    key: 'samlCallbackUrl',
    envVar: 'SAML_CALLBACK_URL',
    default: '',
  },
  {
    key: 'samlCert',
    envVar: 'SAML_CERT',
    default: '',
  },
  {
    key: 'samlAuthContext',
    envVar: 'SAML_AUTH_CONTEXT',
    default: '',
  },
  {
    key: 'samlLinkHtml',
    envVar: 'SAML_LINK_HTML',
    default: 'Sign in with SSO',
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
];

module.exports = configItems;
