const { getUserRPG, updateUserRPG } = require("../database/rpg_db");

module.exports = {
  name: "bank",
  aliases: ["deposit", "withdraw", "store", "take"],
  async execute(sock, m, args, ctx) {
    const { jid, sender, cmd, PREFIX, getUser } = ctx;
    const gUser = getUser(sender) || { name: "Player" };
    const userRPG = getUserRPG(sender, gUser.name);

    if (!userRPG.bank) {
       userRPG.bank = { money: 0, items: {} };
       updateUserRPG(sender, { bank: userRPG.bank });
    }

    if (cmd === "bank") {
      let text = `🏦 *BANK RAVIEL* 🏦\n────────────────────\n`;
      text += `💳 *Saldo Tersimpan:* ${userRPG.bank.money} Gold\n\n`;
      text += `_Bank melindungimu dari perampokan (Crime)._\n`;
      text += `_Gunakan ${PREFIX}deposit <jumlah> / ${PREFIX}withdraw <jumlah>_`;
      return sock.sendMessage(jid, { text }, { quoted: m });
    }

    if (cmd === "deposit") {
      let amount = args[0] === "all" ? userRPG.money : parseInt(args[0]);
      if (isNaN(amount) || amount <= 0) return sock.sendMessage(jid, { text: `⚠️ Jumlah tidak valid!` }, { quoted: m });
      if (userRPG.money < amount) return sock.sendMessage(jid, { text: `⚠️ Uang kamu di tangan tidak cukup!` }, { quoted: m });

      userRPG.money -= amount;
      userRPG.bank.money += amount;
      updateUserRPG(sender, { money: userRPG.money, bank: userRPG.bank });

      return sock.sendMessage(jid, { text: `✅ Berhasil menabung ${amount} Gold ke Bank!` }, { quoted: m });
    }

    if (cmd === "withdraw") {
      let amount = args[0] === "all" ? userRPG.bank.money : parseInt(args[0]);
      if (isNaN(amount) || amount <= 0) return sock.sendMessage(jid, { text: `⚠️ Jumlah tidak valid!` }, { quoted: m });
      if (userRPG.bank.money < amount) return sock.sendMessage(jid, { text: `⚠️ Saldo bank kamu tidak cukup!` }, { quoted: m });

      userRPG.bank.money -= amount;
      userRPG.money += amount;
      updateUserRPG(sender, { money: userRPG.money, bank: userRPG.bank });

      return sock.sendMessage(jid, { text: `✅ Berhasil menarik ${amount} Gold dari Bank!` }, { quoted: m });
    }

    // Storage items is skipped for brevity but easily implementable by moving from inventory to bank.items
  }
};
