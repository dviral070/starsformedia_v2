const addAdminScene    = require('./addAdmin');
const removeAdminScene = require('./removeAdmin');
const setChannelScene  = require('./setChannel');
const broadcastScene   = require('./broadcast');
const editPackageScene = require('./editPackage');

module.exports = [
  addAdminScene,
  removeAdminScene,
  setChannelScene,
  broadcastScene,
  editPackageScene,
];
