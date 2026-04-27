const { getUserRPG, updateUserRPG, updateInventory } = require("../database/rpg_db");

module.exports = {
  name: "marry",
  aliases: ["partner", "couple", "divorce"],
  async execute(sock, m, args, ctx) {
    const { jid, sender, cmd, isGroup, PREFIX, getUser } = ctx;
    
    if (!isGroup) {
      return sock.sendMessage(jid, { text: `⚠️ Perintah partner hanya bisa digunakan di grup!` }, { quoted: m });
    }

    const gUser = getUser(sender) || { name: "Player" };
    const userRPG = getUserRPG(sender, gUser.name);

    if (cmd === "divorce") {
      if (!userRPG.partner) {
         return sock.sendMessage(jid, { text: `⚠️ Kamu belum memiliki partner!` }, { quoted: m });
      }

      const exId = userRPG.partner;
      const exUser = getUserRPG(exId);
      
      userRPG.partner = null;
      if (exUser) {
         exUser.partner = null;
         updateUserRPG(exId, { partner: null });
      }
      
      updateUserRPG(sender, { partner: null });
      return sock.sendMessage(jid, { text: `💔 Kamu telah menceraikan partnermu. Hubungan kalian telah berakhir.` }, { quoted: m });
    }

    if (cmd === "marry" || cmd === "partner" || cmd === "couple") {
      if (userRPG.partner) {
         return sock.sendMessage(jid, { text: `❤️ Kamu sudah memiliki partner! Cerai dulu dengan ${PREFIX}divorce jika ingin ganti.` }, { quoted: m });
      }

      const target = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
      if (!target) {
         return sock.sendMessage(jid, { text: `⚠️ Tag orang yang ingin kamu jadikan partner!\nContoh: \`${PREFIX}marry @user\`` }, { quoted: m });
      }

      if (target === sender) {
         return sock.sendMessage(jid, { text: `⚠️ Kamu tidak bisa menikahi dirimu sendiri!` }, { quoted: m });
      }

      const tUser = getUser(target) || { name: "Player" };
      const targetRPG = getUserRPG(target, tUser.name);

      if (targetRPG.partner) {
         return sock.sendMessage(jid, { text: `⚠️ Orang tersebut sudah memiliki partner!` }, { quoted: m });
      }

      // Simplified: Instant marry if you have wedding ring
      if (!userRPG.inventory["wedding_ring"] || userRPG.inventory["wedding_ring"] < 1) {
         return sock.sendMessage(jid, { text: `⚠️ Kamu butuh *1x Wedding Ring* untuk melamar seseorang! Beli di Shop.` }, { quoted: m });
      }

      // Execute marriage
      updateInventory(sender, "wedding_ring", -1);
      
      userRPG.partner = target;
      targetRPG.partner = sender;

      updateUserRPG(sender, { partner: target });
      updateUserRPG(target, { partner: sender });

      const text = `🎉 *HAPPY WEDDING!* 🎉
────────────────────
Selamat! @${sender.split("@")[0]} telah melamar dan resmi berpasangan dengan @${target.split("@")[0]}! 💖
Kalian berdua kini mendapatkan buff bonus EXP 10% setiap kali mendapatkan EXP.
────────────────────`;

      return sock.sendMessage(jid, { text, mentions: [sender, target] }, { quoted: m });
    }
  }
};
