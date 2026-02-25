const i18n = require('i18n');

i18n.configure({
  locales: ['en', 'es'], // Add your supported locales
  directory: __dirname + '/../locales', // Adjust the path to your locales directory
  defaultLocale: 'en',
  autoReload: true,
  syncFiles: true,
  register: global,
});

module.exports = i18n.init;
