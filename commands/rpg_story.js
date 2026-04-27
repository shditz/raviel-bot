const { getUserRPG, updateUserRPG } = require("../database/rpg_db");
const { STORY_CHAPTERS, calcTotalStats, addExp } = require("../utils/rpg_core");

module.exports = {
  name: "story",
  aliases: ["chapter", "rpgstory", "queststory"],
  async execute(sock, m, args, ctx) {
    const { jid, sender, PREFIX, getUser } = ctx;
    const gUser = getUser(sender) || { name: "Player" };
    const userRPG = getUserRPG(sender, gUser.name);

    if (!userRPG.storyProgress) {
       userRPG.storyProgress = { chapter: 1, step: 1 };
       updateUserRPG(sender, { storyProgress: userRPG.storyProgress });
    }

    const chapId = userRPG.storyProgress.chapter;
    const chapterData = STORY_CHAPTERS[chapId];

    if (!chapterData) {
       return sock.sendMessage(jid, { text: `📜 *STORY SELESAI* 📜\nKamu telah menyelesaikan semua chapter cerita saat ini! Nantikan update selanjutnya.` }, { quoted: m });
    }

    if (args[0] !== "fight") {
      let text = `📜 *MINI RPG STORY - Chapter ${chapId}* 📜
────────────────────
📖 *Judul:* ${chapterData.title}
💬 *Cerita:* ${chapterData.desc}
🛡️ *Tantangan:* Kalahkan Boss "${chapterData.boss.name}"

Syarat Level: ${chapterData.reqLevel}
────────────────────`;
      
      if (userRPG.level >= chapterData.reqLevel) {
         text += `\n✅ Level mencukupi. Gunakan \`${PREFIX}story fight\` untuk melawan Boss Chapter!`;
      } else {
         text += `\n❌ Butuh Level ${chapterData.reqLevel} untuk melanjutkan cerita.`;
      }

      return sock.sendMessage(jid, { text }, { quoted: m });
    }

    if (args[0] === "fight") {
       if (userRPG.level < chapterData.reqLevel) {
          return sock.sendMessage(jid, { text: `⚠️ Level kamu belum cukup untuk melawan Boss Chapter!` }, { quoted: m });
       }

       let stats = calcTotalStats(userRPG);
       if (stats.hp <= 0) return sock.sendMessage(jid, { text: `☠️ HP kamu habis! Pulihkan diri dulu.` }, { quoted: m });

       const boss = chapterData.boss;
       
       let pDmg = Math.max(1, stats.atk - boss.def);
       let bDmg = Math.max(0, boss.atk - stats.def);

       const turnsToKill = Math.ceil(boss.hp / pDmg);
       const dmgReceived = turnsToKill * bDmg;

       if (dmgReceived >= stats.hp) {
          userRPG.hp = 0;
          updateUserRPG(sender, { hp: 0 });
          return sock.sendMessage(jid, { text: `☠️ Kamu gagal mengalahkan *${boss.name}* dan mati. Pulihkan diri dan coba lagi!` }, { quoted: m });
       }

       // Win
       userRPG.hp -= dmgReceived;
       userRPG.storyProgress.chapter += 1;
       
       const reward = chapterData.reward;
       if (reward.money) userRPG.money += reward.money;
       if (reward.item) {
          const { updateInventory } = require("../database/rpg_db");
          updateInventory(sender, reward.item, reward.qty || 1);
       }
       if (reward.title && !userRPG.titles.includes(reward.title)) {
          userRPG.titles.push(reward.title);
       }

       let resExpText = "";
       if (reward.exp) {
          const expRes = addExp(sender, reward.exp);
          resExpText = `✨ Mendapat ${reward.exp} EXP!`;
          if (expRes.leveledUp) resExpText += `\n🎊 LEVEL UP! Level ${expRes.newLevel}`;
       }

       updateUserRPG(sender, { hp: userRPG.hp, money: userRPG.money, titles: userRPG.titles, storyProgress: userRPG.storyProgress });

       return sock.sendMessage(jid, { text: `🎉 *CHAPTER CLEARED!* 🎉\nKamu berhasil mengalahkan ${boss.name}!\n\n${resExpText}\nSilakan gunakan \`${PREFIX}story\` untuk melihat chapter berikutnya!` }, { quoted: m });
    }
  }
};
