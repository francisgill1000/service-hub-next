const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Prevent Metro from crawling up into the parent Next.js project
config.watchFolders = [__dirname];
config.resolver.blockList = [
  new RegExp(path.resolve(__dirname, '..', 'node_modules').replace(/[/\\]/g, '[/\\\\]')),
  new RegExp(path.resolve(__dirname, '..', 'src').replace(/[/\\]/g, '[/\\\\]')),
  new RegExp(path.resolve(__dirname, '..', '\\.next').replace(/[/\\]/g, '[/\\\\]')),
];

module.exports = config;
