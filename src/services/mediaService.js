const Media = require('../models/Media');
const { isTelegramUnreachableError } = require('../utils/helpers');

/**
 * Delivers up to `count` media items to `chatId`.
 * Pass `excludeIds` to skip items the user has already received.
 * Returns the array of delivered Media documents so the caller can
 * deduct exactly `items.length * pricePerItem` and update history.
 */
async function deliverMedia(bot, chatId, count, { excludeIds = [] } = {}) {
  const filter = excludeIds.length ? { _id: { $nin: excludeIds } } : {};
  const available = await Media.countDocuments(filter);

  if (available === 0) return [];

  const toSend = Math.min(count, available);
  const pipeline = [
    ...(excludeIds.length ? [{ $match: filter }] : []),
    { $sample: { size: Math.min(toSend * 3, available) } },
  ];
  const sampled = await Media.aggregate(pipeline);

  // Deduplicate within this batch
  const seen = new Set();
  const items = [];
  for (const item of sampled) {
    const id = item._id.toString();
    if (!seen.has(id)) { seen.add(id); items.push(item); }
    if (items.length === toSend) break;
  }

  const results = await Promise.allSettled(
    items.map((item) =>
      item.fileType === 'photo'
        ? bot.telegram.sendPhoto(chatId, item.fileId)
        : bot.telegram.sendVideo(chatId, item.fileId)
    )
  );

  const delivered = [];
  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    if (r.status === 'fulfilled') {
      delivered.push(items[i]);
      continue;
    }
    if (!isTelegramUnreachableError(r.reason)) {
      console.error('[deliverMedia]', r.reason);
    }
  }

  return delivered;
}

module.exports = { deliverMedia };
