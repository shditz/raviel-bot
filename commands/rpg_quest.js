const { getUserRPG, updateUserRPG } = require("../database/rpg_db");
const { checkCooldown, setCooldown, randomChance } = require("../utils/rpg_core");

const QUESTS = [
  { id: "q1", desc: "Berburu (Hunt) 3 Monster", target: 3, type: "hunt", reward: { money: 500, exp: 200 } },
  { id: "q2", desc: "Menambang (Mine) 3 kali", target: 3, type: "mine", reward: { money: 300, exp: 150 } },
  { id: "q3", desc: "Menebang Kayu (Wood) 3 kali", target: 3, type: "wood", reward: { money: 300, exp: 150 } }
];

module.exports = {
  name: "quest",
  aliases: ["questclaim"],
  async execute(sock, m, args, ctx) {
    const { jid, sender, cmd, PREFIX, getUser } = ctx;
    
    const gUser = getUser(sender) || { name: "Player" };
    const userRPG = getUserRPG(sender, gUser.name);

    // Roll new daily quest if not exist or expired (check cooldown daily_quest)
    const cd = checkCooldown(userRPG, "daily_quest");
    
    if (!cd.onCooldown || !userRPG.quest.daily) {
      // Give new daily quest
      const newQuest = QUESTS[Math.floor(Math.random() * QUESTS.length)];
      userRPG.quest.daily = {
        id: newQuest.id,
        desc: newQuest.desc,
        target: newQuest.target,
        progress: 0,
        type: newQuest.type,
        reward: newQuest.reward
      };
      setCooldown(sender, "daily_quest");
      updateUserRPG(sender, { quest: userRPG.quest });
    }

    if (cmd === "quest") {
      const q = userRPG.quest.daily;
      const isFinished = q.progress >= q.target && q.progress !== -1;
      const status = q.progress === -1 ? "✅ Sudah Di-claim" : (q.progress >= q.target ? "✅ Selesai (Bisa di Claim)" : "⏳ Berjalan");
      
      const text = `📜 *QUEST HARIAN* 📜\n────────────────────\n🎯 *Tugas:* ${q.desc}\n📊 *Progress:* ${q.progress === -1 ? q.target : q.progress} / ${q.target}\n🎁 *Reward:* ${q.reward.money} Gold, ${q.reward.exp} EXP\n📌 *Status:* ${status}\n────────────────────\n`;
      
      const isGroup = jid.endsWith("@g.us");

      if (isGroup) {
        const buttons = [
          {
            name: "single_select",
            buttonParamsJson: JSON.stringify({
              title: "📜 MENU QUEST",
              sections: [
                {
                  title: "AKSI QUEST",
                  rows: [
                    { title: "Klaim Hadiah", id: `${PREFIX}questclaim`, description: isFinished ? "Ambil hadiah sekarang!" : "Belum selesai" },
                    { title: "Cek Progress", id: `${PREFIX}quest`, description: "Refresh status quest" }
                  ]
                }
              ]
            })
          }
        ];

        return sock.sendMessage(jid, {
          interactiveMessage: {
            title: text + "Pilih aksi di bawah ini:",
            footer: "Raviel RPG Quest Board",
            buttons: buttons
          }
        }, { quoted: m });
      } else {
        let fallback = text + `_Gunakan ${PREFIX}questclaim jika sudah selesai._`;
        return sock.sendMessage(jid, { text: fallback }, { quoted: m });
      }
    }

    if (cmd === "questclaim") {
      const q = userRPG.quest.daily;
      
      if (q.progress < q.target) {
         return sock.sendMessage(jid, { text: `⚠️ Quest belum selesai! Progress: ${q.progress}/${q.target}` }, { quoted: m });
      }

      // Claim logic
      userRPG.money += q.reward.money;
      const { addExp } = require("../utils/rpg_core");
      const expRes = addExp(sender, q.reward.exp);
      
      userRPG.quest.completed += 1;
      
      // Clear quest so they can't claim twice
      userRPG.quest.daily.progress = -1; // -1 means claimed
      userRPG.quest.daily.desc = "Sudah di-claim hari ini.";
      
      updateUserRPG(sender, { money: userRPG.money, quest: userRPG.quest });
      
      let text = `🎉 *BERHASIL CLAIM QUEST!* 🎉\nMendapatkan:\n- ${q.reward.money} Gold\n- ${q.reward.exp} EXP`;
      if (expRes.leveledUp) {
         text += `\n🎊 Level Up ke Level ${expRes.newLevel}!`;
      }
      
      return sock.sendMessage(jid, { text }, { quoted: m });
    }
  }
};
