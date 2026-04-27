const { getUserRPG, updateUserRPG, getGuild, updateGuild, getAllGuilds } = require("../database/rpg_db");
const { checkCooldown, setCooldown, calcTotalStats, randomChance } = require("../utils/rpg_core");

module.exports = {
  name: "guildwar",
  aliases: ["war", "attackguild", "defendguild", "warstatus"],
  async execute(sock, m, args, ctx) {
    const { jid, sender, cmd, PREFIX, getUser } = ctx;
    const isGroup = jid.endsWith("@g.us");
    const gUser = getUser(sender) || { name: "Player" };
    const userRPG = getUserRPG(sender, gUser.name);

    if (!userRPG.guild) return sock.sendMessage(jid, { text: `⚠️ Kamu harus bergabung guild dulu!` }, { quoted: m });
    const myGuild = getGuild(userRPG.guild);
    if (!myGuild) return sock.sendMessage(jid, { text: `⚠️ Guild tidak ditemukan!` }, { quoted: m });

    // Init war data if needed
    if (!myGuild.war) myGuild.war = { target: null, score: 0, enemyScore: 0, active: false, startTime: 0 };

    if (cmd === "warstatus") {
      if (!myGuild.war.active) return sock.sendMessage(jid, { text: `📋 Guild kamu tidak sedang berperang.` }, { quoted: m });
      const enemy = getGuild(myGuild.war.target);
      let text = `⚔️ *GUILD WAR STATUS* ⚔️\n────────────────────\n`;
      text += `🏰 *${myGuild.name}* vs 🏰 *${enemy?.name || "???"}*\n`;
      text += `📊 Skor: ${myGuild.war.score} — ${myGuild.war.enemyScore}\n`;
      text += `⏱️ Dimulai: ${new Date(myGuild.war.startTime).toLocaleString("id-ID")}\n`;
      text += `\n_Gunakan ${PREFIX}attackguild untuk menyerang!_`;
      return sock.sendMessage(jid, { text }, { quoted: m });
    }

    if (cmd === "guildwar" || cmd === "war") {
      if (myGuild.war.active) return sock.sendMessage(jid, { text: `⚠️ Guild sudah dalam perang! Gunakan ${PREFIX}warstatus.` }, { quoted: m });
      if (sender !== myGuild.leader) return sock.sendMessage(jid, { text: `⚠️ Hanya Guild Leader yang bisa mendeklarasi perang!` }, { quoted: m });

      const targetId = args[0];
      if (!targetId) {
        const allGuilds = getAllGuilds();
        const others = Object.entries(allGuilds).filter(([id]) => id !== userRPG.guild);
        if (others.length === 0) return sock.sendMessage(jid, { text: `⚠️ Tidak ada guild lain untuk diperangi!` }, { quoted: m });

        let text = `⚔️ *DECLARE GUILD WAR* ⚔️\n────────────────────\n`;
        others.forEach(([id, g]) => { text += `🏰 *${g.name}* (ID: ${id}) — Lv.${g.level} | ${g.members.length} members\n`; });
        text += `\nGunakan: \`${PREFIX}guildwar <guild_id>\``;

        if (isGroup) {
          const rows = others.map(([id, g]) => ({ title: g.name, id: `${PREFIX}guildwar ${id}`, description: `Lv.${g.level} | ${g.members.length} members` }));
          return sock.sendMessage(jid, {
            interactiveMessage: { title: text, footer: "Raviel RPG Guild War",
              buttons: [{ name: "single_select", buttonParamsJson: JSON.stringify({ title: "⚔️ PILIH TARGET", sections: [{ title: "GUILDS", rows }] }) }] }
          }, { quoted: m });
        }
        return sock.sendMessage(jid, { text }, { quoted: m });
      }

      const enemyGuild = getGuild(targetId);
      if (!enemyGuild) return sock.sendMessage(jid, { text: `⚠️ Guild target tidak ditemukan!` }, { quoted: m });
      if (targetId === userRPG.guild) return sock.sendMessage(jid, { text: `⚠️ Tidak bisa memerangi guild sendiri!` }, { quoted: m });

      myGuild.war = { target: targetId, score: 0, enemyScore: 0, active: true, startTime: Date.now() };
      if (!enemyGuild.war) enemyGuild.war = {};
      enemyGuild.war = { target: userRPG.guild, score: 0, enemyScore: 0, active: true, startTime: Date.now() };

      updateGuild(userRPG.guild, { war: myGuild.war });
      updateGuild(targetId, { war: enemyGuild.war });

      return sock.sendMessage(jid, { text: `⚔️ *GUILD WAR DIDEKLARASI!*\n\n🏰 *${myGuild.name}* vs 🏰 *${enemyGuild.name}*\n\nGunakan \`${PREFIX}attackguild\` untuk menyerang!\nGunakan \`${PREFIX}warstatus\` untuk cek skor!` }, { quoted: m });
    }

    if (cmd === "attackguild") {
      if (!myGuild.war.active) return sock.sendMessage(jid, { text: `⚠️ Guild tidak sedang berperang!` }, { quoted: m });
      
      const cd = checkCooldown(userRPG, "guildwar");
      if (cd.onCooldown) return sock.sendMessage(jid, { text: `⏳ Cooldown serangan guild: ${cd.time}` }, { quoted: m });

      setCooldown(sender, "guildwar");
      const stats = calcTotalStats(userRPG);
      const power = stats.atk + stats.def + Math.floor(stats.luck * 0.5);
      const roll = Math.floor(Math.random() * power) + Math.floor(power * 0.3);
      const points = Math.floor(roll / 10);

      myGuild.war.score += points;
      userRPG.guildWarContrib = (userRPG.guildWarContrib || 0) + points;

      // Check auto-end (first to 100 wins)
      let warEnd = false;
      if (myGuild.war.score >= 100) {
        warEnd = true;
        const reward = 5000;
        myGuild.war.active = false;
        const enemyGuild = getGuild(myGuild.war.target);
        if (enemyGuild?.war) { enemyGuild.war.active = false; updateGuild(myGuild.war.target, { war: enemyGuild.war }); }
        userRPG.money += reward;
        updateUserRPG(sender, { money: userRPG.money, guildWarContrib: userRPG.guildWarContrib });
      }

      updateGuild(userRPG.guild, { war: myGuild.war });
      updateUserRPG(sender, { guildWarContrib: userRPG.guildWarContrib });

      let text = `⚔️ *GUILD ATTACK!* ⚔️\n────────────────────\n`;
      text += `⚡ Power: ${power}\n🎯 Poin diperoleh: +${points}\n📊 Skor guild: ${myGuild.war.score}\n`;

      if (warEnd) text += `\n🎉 *GUILD WAR MENANG!* Reward: 5000 Gold!`;

      return sock.sendMessage(jid, { text }, { quoted: m });
    }

    if (cmd === "defendguild") {
      if (!myGuild.war.active) return sock.sendMessage(jid, { text: `⚠️ Guild tidak sedang berperang!` }, { quoted: m });
      const stats = calcTotalStats(userRPG);
      const defPower = stats.def + stats.maxHp * 0.1;
      const blocked = Math.floor(defPower / 20);
      
      const enemyGuild = getGuild(myGuild.war.target);
      if (enemyGuild?.war) {
        enemyGuild.war.score = Math.max(0, enemyGuild.war.score - blocked);
        updateGuild(myGuild.war.target, { war: enemyGuild.war });
      }

      return sock.sendMessage(jid, { text: `🛡️ *GUILD DEFEND!*\n\nKamu memblokir ${blocked} poin musuh!\nSkor musuh dikurangi.` }, { quoted: m });
    }
  }
};
