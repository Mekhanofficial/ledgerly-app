const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const projectRoot = __dirname;
const config = getDefaultConfig(projectRoot);

const escapeForRegex = (value) => value.replace(/[\\^$.*+?()[\]{}|]/g, '\\$&');

const backendPath = escapeForRegex(path.resolve(projectRoot, '..', 'ledgerly-backend'));
const websitePath = escapeForRegex(path.resolve(projectRoot, '..', 'ledgerly-website'));

config.watchFolders = [projectRoot];
config.resolver.blockList = [
  new RegExp(`${backendPath}[/\\\\].*`),
  new RegExp(`${websitePath}[/\\\\].*`),
];

module.exports = config;
