const { getUserRPG, updateUserRPG } = require("../database/rpg_db");
const { CLASSES } = require("../utils/rpg_advanced");
const { checkCooldown, setCooldown } = require("../utils/rpg_core");

module.exports = {
  name: "class",
  aliases: ["chooseclass", "changeclass", "profession", "job"],
  async execute(sock, m, args, ctx) {
    const { jid, sender, cmd, PREFIX, getUser } = ctx;
    const isGroup = jid.endsWith("@g.us");
    const gUser = getUser(sender) || { name: "Player" };
    const userRPG = getUserRPG(sender, gUser.name);

    if (cmd === "class" || cmd === "profession" || cmd === "job") {
      if (args.length < 1) {
        const currentClass = CLASSES[userRPG.job] || CLASSES.novice;
        let text = `🎭 *CLASS SYSTEM* 🎭\n────────────────────\n`;
        text += `📛 *Class Aktif:* ${currentClass.name}\n📝 ${currentClass.desc}\n`;
        if (currentClass.passive) text += `🌟 *Passive:* ${currentClass.passive}\n`;

        text += `\n────────────────────\n📋 *DAFTAR CLASS:*\n`;
        for (const cId in CLASSES) {
          if (cId === "novice") continue;
          const c = CLASSES[cId];
          let bonusStr = Object.entries(c.bonus).map(([k,v]) => `${k.toUpperCase()}+${v}`).join(", ");
          let weakStr = Object.entries(c.weakness).map(([k,v]) => `${k.toUpperCase()}${v}`).join(", ");
          text += `\n🔹 *${c.name}* (${cId})\n   ${c.desc}\n   ✅ Bonus: ${bonusStr || "-"}\n   ❌ Weakness: ${weakStr || "-"}\n`;
        }
        text += `\n────────────────────\nGunakan: \`${PREFIX}chooseclass <id>\``;

        if (isGroup) {
          const rows = Object.keys(CLASSES).filter(k => k !== "novice").map(k => ({
            title: CLASSES[k].name, id: `${PREFIX}chooseclass ${k}`,
            description: CLASSES[k].desc
          }));
          return sock.sendMessage(jid, {
            interactiveMessage: {
              title: text, footer: "Raviel RPG Class System",
              buttons: [{ name: "single_select", buttonParamsJson: JSON.stringify({ title: "🎭 PILIH CLASS", sections: [{ title: "DAFTAR CLASS", rows }] }) }]
            }
          }, { quoted: m });
        }
        return sock.sendMessage(jid, { text }, { quoted: m });
      }
    }

    if (cmd === "chooseclass" || cmd === "changeclass") {
      const targetClass = args[0]?.toLowerCase();
      if (!targetClass || !CLASSES[targetClass] || targetClass === "novice") {
        return sock.sendMessage(jid, { text: `⚠️ Class tidak valid! Gunakan \`${PREFIX}class\` untuk melihat daftar.` }, { quoted: m });
      }

      if (userRPG.job === targetClass) {
        return sock.sendMessage(jid, { text: `⚠️ Kamu sudah menggunakan class ${CLASSES[targetClass].name}!` }, { quoted: m });
      }

      if (userRPG.job !== "novice") {
        const cd = checkCooldown(userRPG, "changeclass");
        if (cd.onCooldown) {
          return sock.sendMessage(jid, { text: `⏳ Kamu harus menunggu ${cd.time} sebelum bisa berganti class lagi.` }, { quoted: m });
        }
        if (userRPG.money < 3000) {
          return sock.sendMessage(jid, { text: `⚠️ Berganti class membutuhkan 3000 Gold!` }, { quoted: m });
        }
        userRPG.money -= 3000;
        setCooldown(sender, "changeclass");
      }

      userRPG.job = targetClass;
      updateUserRPG(sender, { job: targetClass, money: userRPG.money });
      const cls = CLASSES[targetClass];
      return sock.sendMessage(jid, { text: `✅ *CLASS BERUBAH!*\n\nKamu sekarang adalah *${cls.name}*!\n📝 ${cls.desc}\n🌟 Passive: ${cls.passive || "-"}` }, { quoted: m });
    }
  }
};
