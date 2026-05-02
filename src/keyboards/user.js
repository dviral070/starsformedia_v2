const { Markup } = require('telegraf');
const { getNextTier } = require('../utils/referral');

function mainUserKeyboard(isAdmin = false) {
  const rows = [
    ['🔗 My Referral Link', '📊 My Stats'],
    ['⭐ Buy with Stars', '🎁 Buy with Points'],
  ];
  if (isAdmin) rows.push(['🔐 Switch to Admin View']);
  return Markup.keyboard(rows).resize();
}

// Colored inline keyboard attached to the /start welcome message (image-2 style).
// Uses background_color for Telegram Bot API colored button support.
function startInlineKeyboard(user, packages, isAdmin, memberCount) {
  const inviteCount = user.inviteCount || 0;
  const nextTier    = getNextTier(inviteCount);
  const nextStr     = nextTier
    ? `Next: ${nextTier.emoji} ${nextTier.name} (${inviteCount}/${nextTier.invites})`
    : '🏆 Max Tier!';

  const rows = [
    [Markup.button.callback(`👥 INVITE FRIENDS | ${nextStr}`, 'start_invite')],
    [Markup.button.callback(`❤️ My Referral Progress (${inviteCount})`, 'ref_progress')],
  ];

  for (const pkg of packages) {
    rows.push([Markup.button.callback(`⭐ ${pkg.stars} Stars = ${pkg.mediaCount} Videos`, `buy_pkg:${pkg._id}`)]);
  }

  rows.push([Markup.button.callback('⭐ 📊 Referral Leaderboard', 'ref_leaderboard')]);

  if (isAdmin) rows.push([Markup.button.callback(`👥 Admin View: ${memberCount} Members`, 'switch_admin_inline')]);

  return Markup.inlineKeyboard(rows);
}

// Transparent inline keyboard for the My Stats message (image-1 style).
function statsInlineKeyboard(user, packages, isAdmin, memberCount) {
  const inviteCount = user.inviteCount || 0;
  const nextTier    = getNextTier(inviteCount);
  const nextStr     = nextTier
    ? `${nextTier.emoji} ${nextTier.name} (${inviteCount}/${nextTier.invites})`
    : '🏆 Max Tier!';

  const rows = [
    [Markup.button.callback(`👥 INVITE FRIENDS | Next: ${nextStr}`, 'start_invite')],
    [Markup.button.callback(`🏆 My Referral Progress (${inviteCount} invite${inviteCount !== 1 ? 's' : ''})`, 'ref_progress')],
  ];

  for (const pkg of packages) {
    rows.push([Markup.button.callback(`⭐ ${pkg.stars} Stars = ${pkg.mediaCount} Premium Videos`, `buy_pkg:${pkg._id}`)]);
  }

  rows.push([Markup.button.callback('📊 Referral Leaderboard', 'ref_leaderboard')]);

  if (isAdmin) {
    rows.push([Markup.button.callback(`👥 Admin View: ${memberCount} Members`, 'switch_admin_inline')]);
  }

  return Markup.inlineKeyboard(rows);
}

function packagesKeyboard(packages) {
  const rows = packages.map((pkg) => [
    Markup.button.callback(
      `⭐ ${pkg.stars} Stars → 🎬 ${pkg.mediaCount} Media`,
      `buy_pkg:${pkg._id}`
    ),
  ]);
  rows.push([Markup.button.callback('« Back', 'back_to_main')]);
  return Markup.inlineKeyboard(rows);
}

module.exports = { mainUserKeyboard, startInlineKeyboard, statsInlineKeyboard, packagesKeyboard };
