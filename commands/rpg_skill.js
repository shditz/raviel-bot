const { getUserRPG, updateUserRPG } = require("../database/rpg_db");
const { SKILLS, calcTotalStats, checkRegen } = require("../utils/rpg_core");

module.exports = {
  name: "skill",
  aliases: ["skills", "learnskill", "useskill"],
  async execute(sock, m, args, ctx) {
    const { jid, sender, cmd, PREFIX, getUser } = ctx;
    const gUser = getUser(sender) || { name: "Player" };
    let userRPG = getUserRPG(sender, gUser.name);
    
    // Regenerate stats first
    userRPG = checkRegen(userRPG);

    if (cmd === "skill" || cmd === "skills") {
      let text = `✨ *SKILLS & ABILITIES* ✨\n────────────────────\n`;
      const isGroup = jid.endsWith("@g.us");

      if (isGroup) {
        if (!userRPG.skills || userRPG.skills.length === 0) {
          return sock.sendMessage(jid, { text: `⚠️ Kamu belum memiliki skill apa pun.` }, { quoted: m });
        }

        const rows = userRPG.skills.map(s => {
          const def = SKILLS[s];
          return {
            title: def.name,
            id: `${PREFIX}useskill ${s}`,
            description: `Mana: ${def.mana} | Stamina: ${def.stamina} | ${def.desc}`
          };
        });

        return sock.sendMessage(jid, {
          interactiveMessage: {
            title: text + "Pilih skill yang ingin Anda gunakan:",
            footer: "Raviel RPG Spellbook",
            buttons: [
              {
                name: "single_select",
                buttonParamsJson: JSON.stringify({
                  title: "✨ GUNAKAN SKILL",
                  sections: [
                    { title: "DAFTAR SKILL", rows: rows }
                  ]
                })
              }
            ]
          }
        }, { quoted: m });
      } else {
        if (!userRPG.skills || userRPG.skills.length === 0) {
          text += `_Kamu belum memiliki skill apapun._\n`;
        } else {
          userRPG.skills.forEach((s, idx) => {
             const def = SKILLS[s];
             text += `${idx+1}. *${def.name}* (Mana: ${def.mana}, Stamina: ${def.stamina})\n   ${def.desc}\n`;
          });
        }
        text += `────────────────────\n_Gunakan ${PREFIX}learnskill <skill> (Admin/Event) atau ${PREFIX}useskill <skill>_`;
        return sock.sendMessage(jid, { text }, { quoted: m });
      }
    }

    if (cmd === "learnskill") {
      // Simplified: for now, allow players to buy basic skills or learn if they have money
      // In a deep game, this requires skill points
      const skillId = args[0]?.toLowerCase();
      if (!SKILLS[skillId]) return sock.sendMessage(jid, { text: `⚠️ Skill tidak ditemukan!` }, { quoted: m });
      if (userRPG.skills.includes(skillId)) return sock.sendMessage(jid, { text: `⚠️ Kamu sudah memiliki skill ini!` }, { quoted: m });
      
      if (userRPG.money < 2000) return sock.sendMessage(jid, { text: `⚠️ Mempelajari skill butuh 2000 Gold!` }, { quoted: m });
      
      userRPG.money -= 2000;
      userRPG.skills.push(skillId);
      updateUserRPG(sender, { money: userRPG.money, skills: userRPG.skills });
      return sock.sendMessage(jid, { text: `✅ Berhasil mempelajari skill *${SKILLS[skillId].name}*!` }, { quoted: m });
    }

    if (cmd === "useskill") {
      const skillId = args[0]?.toLowerCase();
      if (!userRPG.skills.includes(skillId)) return sock.sendMessage(jid, { text: `⚠️ Kamu belum mempelajari skill ini!` }, { quoted: m });
      
      const skillDef = SKILLS[skillId];
      if (userRPG.mana < skillDef.mana || userRPG.stamina < skillDef.stamina) {
         return sock.sendMessage(jid, { text: `⚠️ Mana / Stamina tidak cukup!\nButuh: ${skillDef.mana} Mana, ${skillDef.stamina} Stamina` }, { quoted: m });
      }

      userRPG.mana -= skillDef.mana;
      userRPG.stamina -= skillDef.stamina;

      let effectText = "";
      if (skillDef.type === "heal") {
         const stats = calcTotalStats(userRPG);
         userRPG.hp = Math.min(stats.maxHp, userRPG.hp + skillDef.power);
         effectText = `Kamu memulihkan ${skillDef.power} HP! (Sisa HP: ${userRPG.hp})`;
      } else if (skillDef.type === "attack") {
         effectText = `Kamu menggunakan ${skillDef.name}! Serangan ini akan berguna di fitur Battle (Fitur terpisah).`;
      }

      updateUserRPG(sender, { mana: userRPG.mana, stamina: userRPG.stamina, hp: userRPG.hp });
      return sock.sendMessage(jid, { text: `✨ Menggunakan *${skillDef.name}*!\n${effectText}` }, { quoted: m });
    }
  }
};
