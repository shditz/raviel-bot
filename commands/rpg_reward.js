const { getUserRPG, updateUserRPG, updateInventory } = require("../database/rpg_db");
const { addExp } = require("../utils/rpg_core");

module.exports = {
  name: "daily",
  aliases: ["weekly", "claimdaily", "claimweekly"],
  async execute(sock, m, args, ctx) {
    const { jid, sender, cmd, getUser } = ctx;
    const gUser = getUser(sender) || { name: "Player" };
    const userRPG = getUserRPG(sender, gUser.name);

    const now = Date.now();
    const isWeekly = cmd === "weekly" || cmd === "claimweekly";
    
    if (isWeekly) {
      const WEEK = 7 * 24 * 60 * 60 * 1000;
      if (now - userRPG.weeklyReward.lastClaim < WEEK) {
        const timeLeft = WEEK - (now - userRPG.weeklyReward.lastClaim);
        const days = Math.floor(timeLeft / (24*60*60*1000));
        const hours = Math.floor((timeLeft % (24*60*60*1000)) / (60*60*1000));
        return sock.sendMessage(jid, { text: `⏳ Kamu sudah klaim weekly reward! Tunggu ${days} hari ${hours} jam lagi.` }, { quoted: m });
      }

      const rewardMoney = 5000;
      const rewardExp = 2000;
      userRPG.money += rewardMoney;
      const expRes = addExp(sender, rewardExp);
      updateInventory(sender, "golden_chest", 1);
      
      userRPG.weeklyReward.lastClaim = now;
      updateUserRPG(sender, { money: userRPG.money, weeklyReward: userRPG.weeklyReward });

      let text = `🎁 *WEEKLY REWARD CLAIMED!* 🎁\nMendapatkan:\n- ${rewardMoney} Gold\n- ${rewardExp} EXP\n- 1x Golden Chest`;
      if (expRes.leveledUp) text += `\n🎊 Level Up! Level ${expRes.newLevel}`;
      return sock.sendMessage(jid, { text }, { quoted: m });
    } else {
      // Daily Reward with Streak
      const DAY = 24 * 60 * 60 * 1000;
      const timeSinceLast = now - userRPG.dailyReward.lastClaim;
      
      if (timeSinceLast < DAY) {
        const timeLeft = DAY - timeSinceLast;
        const hours = Math.floor(timeLeft / (60*60*1000));
        const minutes = Math.floor((timeLeft % (60*60*1000)) / (60*1000));
        return sock.sendMessage(jid, { text: `⏳ Kamu sudah klaim daily hari ini! Tunggu ${hours} jam ${minutes} menit lagi.` }, { quoted: m });
      }

      // Check streak break
      if (timeSinceLast > 2 * DAY) {
        userRPG.dailyReward.streak = 0; // reset
      }
      
      userRPG.dailyReward.streak += 1;
      userRPG.dailyReward.lastClaim = now;

      // Base reward + streak bonus (cap at 7)
      const streakBonus = Math.min(userRPG.dailyReward.streak, 7);
      const rewardMoney = 500 + (streakBonus * 100);
      const rewardExp = 200 + (streakBonus * 50);

      userRPG.money += rewardMoney;
      const expRes = addExp(sender, rewardExp);
      
      let items = [];
      if (streakBonus >= 7) {
        updateInventory(sender, "wooden_chest", 1);
        items.push("1x Wooden Chest");
      }

      updateUserRPG(sender, { money: userRPG.money, dailyReward: userRPG.dailyReward });

      let text = `🎁 *DAILY REWARD CLAIMED!* 🎁\n🔥 *Streak:* ${userRPG.dailyReward.streak} Hari\n────────────────────\nMendapatkan:\n- ${rewardMoney} Gold\n- ${rewardExp} EXP`;
      if (items.length) text += `\n- ${items.join(", ")}`;
      if (expRes.leveledUp) text += `\n🎊 Level Up! Level ${expRes.newLevel}`;
      
      return sock.sendMessage(jid, { text }, { quoted: m });
    }
  }
};
