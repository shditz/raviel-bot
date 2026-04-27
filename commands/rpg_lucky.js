const { getUserRPG, updateUserRPG } = require("../database/rpg_db");
const { calcTotalStats } = require("../utils/rpg_core");

module.exports = {
  name: "luck",
  aliases: ["fortune", "rng"],
  async execute(sock, m, args, ctx) {
    const { jid, sender, cmd, PREFIX, getUser } = ctx;
    const gUser = getUser(sender) || { name: "Player" };
    const userRPG = getUserRPG(sender, gUser.name);
    const stats = calcTotalStats(userRPG);

    if (cmd === "fortune") {
      // Fortune telling — random event
      const fortunes = [
        { msg: "🌟 Bintang keberuntungan bersinar atas dirimu! Drop rate +10% selama 1 jam!", buff: { name: "Fortune Star", effects: { luck: 10 }, duration: 3600000 } },
        { msg: "🍀 Dewi Fortune tersenyum. EXP +15% selama 30 menit!", buff: { name: "Fortune Smile", effects: { luck: 5 }, duration: 1800000 } },
        { msg: "💀 Awan kegelapan menyelimuti... Tidak ada bonus kali ini.", buff: null },
        { msg: "✨ Angin keberuntungan berhembus! Gold find +20% selama 1 jam!", buff: { name: "Gold Wind", effects: { luck: 8 }, duration: 3600000 } },
        { msg: "🔮 Kristal meramal masa depan cerah. ATK +5 selama 30 menit!", buff: { name: "Crystal Vision", effects: { atk: 5 }, duration: 1800000 } },
        { msg: "🌙 Bulan purnama memberikan kekuatan. DEF +5 selama 30 menit!", buff: { name: "Moon Power", effects: { def: 5 }, duration: 1800000 } },
        { msg: "⚡ Petir menyambar dan memberikan energi! SPD +10 selama 30 menit!", buff: { name: "Thunder Charge", effects: { spd: 10 }, duration: 1800000 } }
      ];

      // Luck affects fortune outcome
      const luckBonus = Math.min(0.3, stats.luck * 0.005);
      const goodChance = 0.4 + luckBonus;
      const roll = Math.random();
      const fortune = roll < goodChance 
        ? fortunes.filter(f => f.buff)[Math.floor(Math.random() * fortunes.filter(f => f.buff).length)]
        : fortunes.find(f => !f.buff);

      let text = `🔮 *FORTUNE TELLING* 🔮\n────────────────────\n${fortune.msg}\n`;

      if (fortune.buff) {
        userRPG.buffs = userRPG.buffs || [];
        userRPG.buffs.push({ ...fortune.buff, expire: Date.now() + fortune.buff.duration });
        updateUserRPG(sender, { buffs: userRPG.buffs });
        text += `\n✅ Buff *${fortune.buff.name}* aktif!`;
      }

      return sock.sendMessage(jid, { text }, { quoted: m });
    }

    // Default: show luck info
    let text = `🍀 *LUCKY SYSTEM* 🍀\n────────────────────\n`;
    text += `🍀 *Total Luck:* ${stats.luck}\n\n`;
    text += `📊 *SUMBER BONUS LUCK:*\n`;
    text += `• Base Luck: ${userRPG.luck}\n`;

    // Equipment luck
    const { ITEMS } = require("../utils/rpg_core");
    for (const slot of ["weapon", "armor", "accessory"]) {
      const eq = userRPG.equipment?.[slot];
      if (eq && ITEMS[eq]?.stats?.luck) text += `• ${ITEMS[eq].name}: +${ITEMS[eq].stats.luck}\n`;
    }

    // Pet luck
    const { PETS } = require("../utils/rpg_core");
    if (userRPG.pet?.active) {
      const pet = PETS.find(p => p.id === userRPG.pet.active);
      if (pet?.stats?.luck) text += `• Pet ${pet.name}: +${pet.stats.luck}\n`;
    }

    // Buff luck
    const now = Date.now();
    (userRPG.buffs || []).filter(b => b.expire > now && b.effects?.luck).forEach(b => {
      text += `• Buff ${b.name}: +${b.effects.luck}\n`;
    });

    text += `\n────────────────────\n📈 *EFEK LUCK:*\n`;
    text += `• Drop Rate Bonus: +${Math.floor(stats.luck * 0.5)}%\n`;
    text += `• Crit Chance: +${(stats.luck * 0.5).toFixed(1)}%\n`;
    text += `• Gacha Luck: +${Math.floor(stats.luck * 0.3)}%\n`;
    text += `\n_Gunakan: ${PREFIX}fortune untuk meramal keberuntungan!_`;

    return sock.sendMessage(jid, { text }, { quoted: m });
  }
};
