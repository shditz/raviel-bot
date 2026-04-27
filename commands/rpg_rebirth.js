const { getUserRPG, updateUserRPG } = require("../database/rpg_db");

module.exports = {
  name: "rebirth",
  aliases: ["prestige"],
  async execute(sock, m, args, ctx) {
    const { jid, sender, PREFIX, getUser } = ctx;
    const gUser = getUser(sender) || { name: "Player" };
    const userRPG = getUserRPG(sender, gUser.name);

    // Max Level Config
    const MAX_LEVEL = 999;

    if (args[0] !== "confirm") {
      let text = `🔥 *REBIRTH / PRESTIGE SYSTEM* 🔥
────────────────────
Syarat Rebirth: *Level ${MAX_LEVEL}*
Level Kamu Saat Ini: *${userRPG.level}*

Jika kamu melakukan Rebirth:
1. Level kembali menjadi 1.
2. Exp, HP, Mana, Base Stat kembali seperti awal.
3. Mendapat bonus permanen *Stat & Exp Multiplier (+5% per rebirth)*.
4. Mendapat +1 Rebirth Point.
*(Inventory, Gold, Pet, Equipment, & Skill TETAP AMAN)*

────────────────────`;
      if (userRPG.level >= MAX_LEVEL) {
         text += `\n✅ Syarat terpenuhi! Gunakan \`${PREFIX}rebirth confirm\` untuk melakukan Rebirth!`;
      } else {
         text += `\n❌ Syarat belum terpenuhi. Teruslah berjuang!`;
      }
      return sock.sendMessage(jid, { text }, { quoted: m });
    }

    if (userRPG.level < MAX_LEVEL) {
      return sock.sendMessage(jid, { text: `⚠️ Level kamu belum mencapai ${MAX_LEVEL}!` }, { quoted: m });
    }

    // Process Rebirth
    userRPG.rebirth.count += 1;
    userRPG.rebirth.points += 1;
    
    // Reset core stats
    userRPG.level = 1;
    userRPG.exp = 0;
    userRPG.maxHp = 100;
    userRPG.hp = 100;
    userRPG.atk = 10;
    userRPG.def = 5;
    userRPG.spd = 5;
    userRPG.maxMana = 50;
    userRPG.mana = 50;

    updateUserRPG(sender, { 
      rebirth: userRPG.rebirth,
      level: 1, exp: 0, 
      hp: 100, maxHp: 100, atk: 10, def: 5, spd: 5, mana: 50, maxMana: 50
    });

    let text = `🔥 *REBIRTH BERHASIL!* 🔥\nSelamat, ${userRPG.name}! Kamu telah dilahirkan kembali.\n\nTotal Rebirth: ${userRPG.rebirth.count}\nSemua stat dasar multiplier meningkat sebesar 5%!`;
    return sock.sendMessage(jid, { text }, { quoted: m });
  }
};
