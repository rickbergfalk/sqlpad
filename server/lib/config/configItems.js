// NOTE: uiDepencency=true items will be sent to client for front end config use
// Nothing else sent unless using configuration page/api
// This is to reduce leaking unnecessary information

const configItems = [
  {
    key: 'ip',
    cliFlag: 'ip',
    envVar: 'SQLPAD_IP',
    default: '0.0.0.0',
    description:
      'IP address to bind to. By default SQLPad will listen from all available addresses (0.0.0.0).'
  },
  {
    key: 'port',
    cliFlag: 'port',
    envVar: 'SQLPAD_PORT',
    default: 80,
    description: 'Port for SQLPad to listen on.'
  },
  {
    key: 'systemdSocket',
    cliFlag: 'systemd-socket',
    envVar: 'SQLPAD_SYSTEMD_SOCKET',
    default: false,
    description: 'Acquire socket from systemd if available'
  },
  {
    key: 'httpsPort',
    cliFlag: 'https-port',
    envVar: 'SQLPAD_HTTPS_PORT',
    default: 443,
    description: 'Port for SQLPad to listen on.'
  },
  {
    key: 'dbPath',
    cliFlag: ['db', 'dbPath', 'dir'],
    envVar: 'SQLPAD_DB_PATH',
    default: '$HOME/sqlpad/db',
    description:
      'Directory to store SQLPad embedded database content. This includes queries, users, query result cache files, etc.'
  },
  {
    key: 'baseUrl',
    cliFlag: 'base-url',
    envVar: 'SQLPAD_BASE_URL',
    default: '',
    uiDependency: true,
    description:
      "Path to mount sqlpad app following domain. \nFor example, if '/sqlpad' is provided, queries page \nwould be located at mydomain.com/sqlpad/queries instead of mydomain.com/queries. \nUseful when subdomain is not an option."
  },
  {
    key: 'passphrase',
    cliFlag: 'passphrase',
    envVar: 'SQLPAD_PASSPHRASE',
    default: "At least the sensitive bits won't be plain text?",
    description:
      'A string of text used to encrypt sensitive values when stored on disk.'
  },
  {
    key: 'certPassphrase',
    cliFlag: 'cert-passphrase',
    envVar: 'CERT_PASSPHRASE',
    default: 'No cert',
    description: 'Passphrase for your SSL certification file'
  },
  {
    key: 'keyPath',
    cliFlag: ['key', 'key-path', 'key-dir'],
    envVar: 'KEY_PATH',
    default: '',
    description: 'Absolute path to where SSL certificate key is stored'
  },
  {
    key: 'certPath',
    cliFlag: ['cert', 'cert-path', 'cert-dir'],
    envVar: 'CERT_PATH',
    default: '',
    description: 'Absolute path to where SSL certificate is stored'
  },
  {
    key: 'admin',
    cliFlag: 'admin',
    envVar: 'SQLPAD_ADMIN',
    default: '',
    description:
      'Email address to whitelist/give admin permissions to via command line or environment variable. Useful to preset Admin account or to reinstate admin access without access to the UI.'
  },
  {
    key: 'debug',
    cliFlag: 'debug',
    envVar: 'SQLPAD_DEBUG',
    default: false,
    description: 'Add a variety of logging to console while running SQLPad'
  },
  {
    key: 'googleClientId',
    envVar: 'GOOGLE_CLIENT_ID',
    description:
      "Google Client ID used for OAuth setup. Note: authorized redirect URI for sqlpad is '[baseurl]/auth/google/callback'",
    default: ''
  },
  {
    key: 'googleClientSecret',
    envVar: 'GOOGLE_CLIENT_SECRET',
    description:
      "Google Client Secret used for OAuth setup. Note: authorized redirect URI for sqlpad is '[baseurl]/auth/google/callback'",
    default: ''
  },
  {
    key: 'publicUrl',
    envVar: 'PUBLIC_URL',
    cliFlag: 'public-url',
    description:
      'Public URL used for OAuth setup and links in email communications. Protocol is expected to be provided. Example: https://mysqlpad.com',
    default: '',
    uiDependency: true
  },
  {
    key: 'disableUserpassAuth',
    envVar: 'DISABLE_USERPASS_AUTH',
    description:
      'Set to TRUE to disable built-in user authentication. Useful to restrict authentication to OAuth only.',
    default: false
  },
  {
    key: 'allowCsvDownload',
    label: 'Allow CSV/XLSX Download',
    description: 'Set to false to disable csv or xlsx downloads.',
    options: [true, false],
    uiDependency: true,
    default: true
  },
  {
    key: 'editorWordWrap',
    label: 'Editor Word Wrap',
    description: 'Set to true to enable word wrapping in SQL editor.',
    options: [true, false],
    uiDependency: true,
    default: false
  },
  {
    key: 'queryResultMaxRows',
    label: 'Query Result Max Rows',
    description: 'By default query results are limited to 50,000 records.',
    default: 50000,
    uiDependency: true
  },
  {
    key: 'slackWebhook',
    label: 'Slack Webhook URL',
    description: 'Supply incoming Slack webhook URL to post query when saved.',
    default: ''
  },
  {
    key: 'showSchemaCopyButton',
    label: 'Show Schema Copy Button',
    description:
      "Enable a button to copy an object's full schema path in schema explorer. Useful for databases that require fully qualified names.",
    options: [true, false],
    default: false,
    uiDependency: true
  },
  {
    key: 'tableChartLinksRequireAuth',
    label: 'Require Login for Table/Chart Links',
    description:
      'If set to false, table and chart result links will be operational without having to log in. (These links only execute saved SQL queries, and do not open an endpoint to execute raw SQL.)',
    options: [true, false],
    default: true
  },
  {
    key: 'smtpFrom',
    envVar: 'SQLPAD_SMTP_FROM',
    cliFlag: 'smtp-from',
    label: 'SMTP From',
    description:
      'From email address for SMTP. Required in order to send invitation emails.',
    default: ''
  },
  {
    key: 'smtpHost',
    envVar: 'SQLPAD_SMTP_HOST',
    cliFlag: 'smtp-host',
    label: 'SMTP Host',
    description:
      'Host address for SMTP. Required in order to send invitation emails.',
    default: ''
  },
  {
    key: 'smtpPort',
    envVar: 'SQLPAD_SMTP_PORT',
    cliFlag: 'smtp-port',
    label: 'SMTP Port',
    description: 'Port for SMTP. Required in order to send invitation emails.',
    default: ''
  },
  {
    key: 'smtpSecure',
    envVar: 'SQLPAD_SMTP_SECURE',
    cliFlag: 'smtp-secure',
    label: 'SMTP Use SSL',
    options: [true, false],
    description: 'Toggle to use secure connection when using SMTP.',
    default: true
  },
  {
    key: 'smtpUser',
    envVar: 'SQLPAD_SMTP_USER',
    cliFlag: 'smtp-user',
    label: 'SMTP User',
    description:
      'Username for SMTP. Required in order to send invitation emails.',
    default: ''
  },
  {
    key: 'smtpPassword',
    envVar: 'SQLPAD_SMTP_PASSWORD',
    cliFlag: 'smtp-password',
    label: 'SMTP Password',
    description: 'Password for SMTP.',
    default: ''
  },
  {
    key: 'whitelistedDomains',
    label: 'Whitelisted Domains',
    envVar: 'WHITELISTED_DOMAINS',
    cliFlag: 'whitelisted-domains',
    description:
      "Allows whitelisting of email domains so individual email addresses do not need to be whitelisted. Domains must be delimited by whitespace. For example, 'baz.com foo.bar.com' will whitelist sara@baz.com and john@foo.bar.com",
    default: ''
  },
  {
    key: 'disableUpdateCheck',
    envVar: 'SQLPAD_DISABLE_UPDATE_CHECK',
    cliFlag: 'disable-update-check',
    label: 'Disable update check',
    options: [true, false],
    description:
      'If disabled, SQLPad will no longer poll npmjs.com to see if an update is available.',
    default: false
  },
  {
    interface: 'env',
    key: 'samlEntryPoint',
    envVar: 'SAML_ENTRY_POINT',
    cliFlag: 'saml-entry-point',
    description: 'SAML Entry point URL',
    default: ''
  },
  {
    interface: 'env',
    key: 'samlIssuer',
    envVar: 'SAML_ISSUER',
    cliFlag: 'saml-issuer',
    description: 'SAML Issuer',
    default: ''
  },
  {
    interface: 'env',
    key: 'samlCallbackUrl',
    envVar: 'SAML_CALLBACK_URL',
    cliFlag: 'saml-callback-url',
    description: 'SAML callback URL',
    default: ''
  },
  {
    interface: 'env',
    key: 'samlCert',
    envVar: 'SAML_CERT',
    cliFlag: 'saml-cert',
    description: 'SAML certificate in Base64',
    default: ''
  },
  {
    interface: 'env',
    key: 'samlAuthContext',
    envVar: 'SAML_AUTH_CONTEXT',
    cliFlag: 'saml-auth-context',
    description: 'SAML authentication context URL',
    default: ''
  }
];

module.exports = configItems;
