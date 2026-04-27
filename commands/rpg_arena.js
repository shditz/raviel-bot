const { getUserRPG, updateUserRPG } = require("../database/rpg_db");
const { checkCooldown, setCooldown, calcTotalStats, randomChance } = require("../utils/rpg_core");

module.exports = {
  name: "arena",
  aliases: ["pvp", "duel"],
  async execute(sock, m, args, ctx) {
    const { jid, sender, isGroup, PREFIX, getUser } = ctx;
    
    if (!isGroup) {
      return sock.sendMessage(jid, { text: `⚠️ Perintah arena hanya bisa digunakan di grup!` }, { quoted: m });
    }

    if (m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length === 0) {
      return sock.sendMessage(jid, { text: `⚠️ Tag lawanmu!\nContoh: \`${PREFIX}arena @user\`` }, { quoted: m });
    }

    const target = m.message.extendedTextMessage.contextInfo.mentionedJid[0];
    if (target === sender) {
      return sock.sendMessage(jid, { text: `⚠️ Kamu tidak bisa melawan dirimu sendiri!` }, { quoted: m });
    }

    const gUser = getUser(sender) || { name: "Player" };
    const userRPG = getUserRPG(sender, gUser.name);
    
    const tUser = getUser(target) || { name: "Opponent" };
    const targetRPG = getUserRPG(target, tUser.name);

    const cd = checkCooldown(userRPG, "arena");
    if (cd.onCooldown) {
      return sock.sendMessage(jid, { text: `⏳ Kamu harus istirahat sebelum ke arena lagi. Tunggu ${cd.time}.` }, { quoted: m });
    }

    let pStats = calcTotalStats(userRPG);
    let tStats = calcTotalStats(targetRPG);

    if (pStats.hp <= 0) {
      return sock.sendMessage(jid, { text: `☠️ HP kamu habis, pulihkan diri dulu.` }, { quoted: m });
    }

    setCooldown(sender, "arena");

    // Fast PVP simulation
    let p1Hp = pStats.hp;
    let p2Hp = tStats.hp;
    
    let p1Dmg = Math.max(1, pStats.atk - tStats.def);
    let p2Dmg = Math.max(1, tStats.atk - pStats.def);
    
    let turn = 1;
    let log = [];

    while (p1Hp > 0 && p2Hp > 0 && turn <= 5) {
      // P1 attack
      if (!randomChance(0.05 + (tStats.spd * 0.005))) {
        let crit = randomChance(0.1 + (pStats.luck * 0.01)) ? 1.5 : 1;
        let dmg = Math.floor(p1Dmg * crit);
        p2Hp -= dmg;
      }
      if (p2Hp <= 0) break;

      // P2 attack
      if (!randomChance(0.05 + (pStats.spd * 0.005))) {
        let crit = randomChance(0.1 + (tStats.luck * 0.01)) ? 1.5 : 1;
        let dmg = Math.floor(p2Dmg * crit);
        p1Hp -= dmg;
      }
      turn++;
    }

    let winner, loser, winMoney, loseMoney;

    if (p1Hp > p2Hp) {
      winner = userRPG;
      loser = targetRPG;
      winMoney = 500;
      loseMoney = 100;
    } else {
      winner = targetRPG;
      loser = userRPG;
      winMoney = 200; // P2 wins automatically (offline defend)
      loseMoney = 300; // Penalty to attacker for losing
    }

    winner.money += winMoney;
    loser.money = Math.max(0, loser.money - loseMoney); // Anti min

    userRPG.hp = Math.max(0, p1Hp);
    
    updateUserRPG(winner.id, { money: winner.money });
    updateUserRPG(loser.id, { money: loser.money });
    
    if (userRPG.id === winner.id) {
       updateUserRPG(sender, { hp: userRPG.hp }); // update attacker HP specifically
    } else {
       updateUserRPG(sender, { hp: userRPG.hp });
    }

    let text = `⚔️ *ARENA DUEL RESULT* ⚔️
────────────────────
🥇 *Pemenang:* ${winner.name} (+${winMoney} Gold)
💀 *Kalah:* ${loser.name} (-${loseMoney} Gold)
────────────────────
Sisa HP ${userRPG.name}: ${Math.max(0, p1Hp)}
Sisa HP ${targetRPG.name}: ${Math.max(0, p2Hp)}`;

    await sock.sendMessage(jid, { text, mentions: [sender, target] }, { quoted: m });
  }
};
