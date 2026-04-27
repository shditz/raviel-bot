const { getUserRPG, updateUserRPG } = require("../database/rpg_db");

module.exports = {
  name: "title",
  aliases: ["titles", "settitle", "achievement", "achievements", "achieve"],
  async execute(sock, m, args, ctx) {
    const { jid, sender, cmd, PREFIX, getUser } = ctx;
    
    const gUser = getUser(sender) || { name: "Player" };
    const userRPG = getUserRPG(sender, gUser.name);

    if (cmd === "title" || cmd === "titles") {
      let text = `🏅 *GELAR KAMU (TITLE)* 🏅\n────────────────────\n🌟 *Gelar Aktif:* ${userRPG.activeTitle || "Tidak ada"}\n\n`;
      text += `📜 *Daftar Gelar:*\n`;
      if (userRPG.titles.length === 0) {
        text += `- Belum ada gelar\n`;
      } else {
        userRPG.titles.forEach((t, i) => {
           text += `${i+1}. ${t}\n`;
        });
      }
      text += `\n_Gunakan ${PREFIX}settitle <nama gelar> untuk mengganti_`;
      return sock.sendMessage(jid, { text }, { quoted: m });
    }

    if (cmd === "settitle") {
      const target = args.join(" ");
      if (!target) {
        return sock.sendMessage(jid, { text: `⚠️ Tulis nama gelar yang ingin dipakai!\nContoh: \`${PREFIX}settitle Beginner\`` }, { quoted: m });
      }
      
      const found = userRPG.titles.find(t => t.toLowerCase() === target.toLowerCase());
      if (!found) {
        return sock.sendMessage(jid, { text: `⚠️ Kamu tidak memiliki gelar *${target}*!` }, { quoted: m });
      }

      userRPG.activeTitle = found;
      updateUserRPG(sender, { activeTitle: found });
      return sock.sendMessage(jid, { text: `✅ Berhasil mengganti gelar aktif menjadi *[${found}]*!` }, { quoted: m });
    }

    if (cmd === "achievement" || cmd === "achievements" || cmd === "achieve") {
      const ach = userRPG.achievements;
      const count = Object.keys(ach).length;
      
      let text = `🏆 *ACHIEVEMENTS* 🏆\n────────────────────\nKamu telah membuka *${count}* Prestasi.\n\n`;
      
      const achList = [
         { id: "level_10", name: "Reaching Level 10" },
         { id: "level_50", name: "Reaching Level 50" },
         { id: "hunter_100", name: "Hunt 100 Monsters" },
         { id: "crafter_50", name: "Craft 50 Items" }
      ];

      achList.forEach(a => {
         const status = ach[a.id] ? "✅ (Terbuka)" : "❌ (Terkunci)";
         text += `- ${a.name} ${status}\n`;
      });

      return sock.sendMessage(jid, { text }, { quoted: m });
    }
  }
};
