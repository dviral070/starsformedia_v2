const User    = require('../models/User');
const Package = require('../models/Package');
const adminCache = require('../cache');
const { POINTS_PER_MEDIA } = require('../constants');
const { checkAndAwardTiers, buildTiersList } = require('../utils/referral');
const { mainUserKeyboard, startInlineKeyboard } = require('../keyboards/user');
const { mainAdminKeyboard } = require('../keyboards/admin');
const { buildAdminStats } = require('../utils/stats');

module.exports = (bot) => {
  bot.start(async (ctx) => {
    try {
      const { id, username, first_name, last_name } = ctx.from;
      const args = ctx.startPayload;

      const isNewUser = !(await User.exists({ telegramId: id }));

      const user = await User.findOneAndUpdate(
        { telegramId: id },
        { $set: { username: username || null, firstName: first_name || '', lastName: last_name || '' } },
        { upsert: true, new: true }
      );

      // Handle referral
      const referrerId = parseInt(args, 10);
      const hasReferral = args && !isNaN(referrerId);

      if (hasReferral) {
        if (referrerId === id) {
          await ctx.reply("You can't use your own referral link.");
        } else if (!isNewUser) {
          await ctx.reply("Referral links only apply to new accounts — you're already registered.");
        } else {
          const referrer = await User.findOne({ telegramId: referrerId });
          if (referrer) {
            user.referrerId = referrerId;
            await user.save();

            referrer.inviteCount += 1;
            referrer.points = (referrer.points || 0) + 1;

            // Check and award any newly unlocked referral tiers
            const newTiers = checkAndAwardTiers(referrer);
            await referrer.save();

            const joinerName = first_name + (username ? ` (@${username})` : '');
            const redeemable = Math.floor(referrer.points / POINTS_PER_MEDIA);

            let refMsg =
              `👥 *New referral!*\n${joinerName} joined using your link.\n\n` +
              `Total invites: *${referrer.inviteCount}*\n` +
              `Points: *${referrer.points}* (${redeemable} media redeemable)`;

            if (newTiers.length) {
              refMsg += '\n\n🎉 *Tier Unlocked!*\n' +
                newTiers.map((t) => `${t.emoji} ${t.name}: +${t.reward} free videos!`).join('\n');
            }

            ctx.telegram.sendMessage(referrerId, refMsg, { parse_mode: 'Markdown' }).catch(() => {});
          }
        }
      }

      const isAdmin = adminCache.isAdmin(id, username);

      if (isAdmin && user.viewMode === 'admin') {
        const stats = await buildAdminStats(ctx.telegram);
        await ctx.reply(
          `Welcome back, ${first_name}!\n\n${stats}`,
          { parse_mode: 'Markdown', ...mainAdminKeyboard() }
        );
        return;
      }

      // User mode — show welcome with referral tiers and colored inline keyboard
      const packages   = await Package.find({ isActive: true }).sort('order');
      const memberCount = isAdmin ? await User.countDocuments() : 0;

      const welcomeText =
        `❤️ Welcome to the Premium Video Club! 👋\n\n` +
        `🔥 *Invite friends and earn FREE premium videos!*\n\n` +
        `👥 *Referral Rewards:*\n${buildTiersList()}\n\n` +
        `⭐ Start inviting and unlock your rewards! ⭐`;

      await ctx.reply(welcomeText, {
        parse_mode: 'Markdown',
        ...mainUserKeyboard(isAdmin),
        ...startInlineKeyboard(user, packages, isAdmin, memberCount),
      });
    } catch (err) {
      console.error('[start handler]', err);
      await ctx.reply('Something went wrong. Please try again.').catch(() => {});
    }
  });
};
