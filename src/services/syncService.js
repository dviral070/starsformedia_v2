const Media = require('../models/Media');
const User  = require('../models/User');

async function syncMediaPool(bot) {
  const all = await Media.find({}, { _id: 1, fileId: 1 }).lean();
  if (!all.length) {
    console.log('[sync] Media pool is empty, nothing to check');
    return;
  }

  console.log(`[sync] Checking ${all.length} media record(s)...`);

  const results = await Promise.allSettled(
    all.map((m) => bot.telegram.getFile(m.fileId).then(() => null).catch(() => m._id))
  );

  const stale = results
    .filter((r) => r.status === 'fulfilled' && r.value !== null)
    .map((r) => r.value);

  if (!stale.length) {
    console.log('[sync] All media accessible — pool is clean');
    return;
  }

  await Media.deleteMany({ _id: { $in: stale } });
  await User.updateMany(
    { receivedMedia: { $in: stale } },
    { $pull: { receivedMedia: { $in: stale } } }
  );

  console.log(`[sync] Removed ${stale.length} inaccessible record(s) and cleared from user history`);
}

module.exports = { syncMediaPool };
