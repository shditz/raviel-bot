const { getUserRPG, updateUserRPG, getGuild, createGuild, updateGuild, deleteGuild } = require("../database/rpg_db");

module.exports = {
  name: "guild",
  aliases: ["createguild", "joinguild", "leaveguild", "guildinfo"],
  async execute(sock, m, args, ctx) {
    const { jid, sender, cmd, PREFIX, getUser } = ctx;
    
    const gUser = getUser(sender) || { name: "Player" };
    const userRPG = getUserRPG(sender, gUser.name);

    if (cmd === "createguild") {
      if (userRPG.guild) {
        return sock.sendMessage(jid, { text: `⚠️ Kamu sudah berada di guild *${userRPG.guild}*!` }, { quoted: m });
      }
      
      const guildName = args.join(" ");
      if (!guildName || guildName.length < 3) {
        return sock.sendMessage(jid, { text: `⚠️ Nama guild minimal 3 huruf.\nGunakan: \`${PREFIX}createguild <nama>\`` }, { quoted: m });
      }

      if (userRPG.money < 5000) {
        return sock.sendMessage(jid, { text: `⚠️ Kamu butuh 5000 Gold untuk membuat guild!` }, { quoted: m });
      }

      const guildId = guildName.toLowerCase().replace(/[^a-z0-9]/g, "");
      if (getGuild(guildId)) {
        return sock.sendMessage(jid, { text: `⚠️ Guild dengan ID/Nama tersebut sudah ada!` }, { quoted: m });
      }

      userRPG.money -= 5000;
      userRPG.guild = guildId;
      updateUserRPG(sender, { money: userRPG.money, guild: guildId });
      
      createGuild(guildId, {
        id: guildId,
        name: guildName,
        leader: sender,
        level: 1,
        exp: 0,
        members: [sender]
      });

      return sock.sendMessage(jid, { text: `✅ Berhasil mendirikan Guild *${guildName}*!` }, { quoted: m });
    }

    if (cmd === "joinguild") {
      if (userRPG.guild) {
        return sock.sendMessage(jid, { text: `⚠️ Kamu sudah memiliki guild!` }, { quoted: m });
      }

      const guildId = args[0]?.toLowerCase().replace(/[^a-z0-9]/g, "");
      const guild = getGuild(guildId);
      
      if (!guild) {
        return sock.sendMessage(jid, { text: `⚠️ Guild tidak ditemukan!` }, { quoted: m });
      }

      if (guild.members.length >= 15) {
        return sock.sendMessage(jid, { text: `⚠️ Guild ini sudah penuh! (Max 15 member)` }, { quoted: m });
      }

      guild.members.push(sender);
      updateGuild(guildId, { members: guild.members });
      
      userRPG.guild = guildId;
      updateUserRPG(sender, { guild: guildId });

      return sock.sendMessage(jid, { text: `✅ Kamu berhasil bergabung dengan Guild *${guild.name}*!` }, { quoted: m });
    }

    if (cmd === "leaveguild") {
      if (!userRPG.guild) {
        return sock.sendMessage(jid, { text: `⚠️ Kamu belum masuk guild manapun!` }, { quoted: m });
      }

      const guildId = userRPG.guild;
      const guild = getGuild(guildId);
      
      if (guild) {
        guild.members = guild.members.filter(m => m !== sender);
        
        if (guild.leader === sender && guild.members.length > 0) {
           // Auto transfer leader
           guild.leader = guild.members[0];
           updateGuild(guildId, { leader: guild.leader, members: guild.members });
        } else if (guild.members.length === 0) {
           deleteGuild(guildId);
        } else {
           updateGuild(guildId, { members: guild.members });
        }
      }

      userRPG.guild = null;
      updateUserRPG(sender, { guild: null });

      return sock.sendMessage(jid, { text: `🚪 Kamu telah keluar dari guild.` }, { quoted: m });
    }

    if (cmd === "guild" || cmd === "guildinfo") {
      if (!userRPG.guild) {
        return sock.sendMessage(jid, { text: `⚠️ Kamu belum memiliki Guild!\n\nGunakan \`${PREFIX}createguild <nama>\` atau \`${PREFIX}joinguild <id>\`` }, { quoted: m });
      }

      const guild = getGuild(userRPG.guild);
      if (!guild) {
         userRPG.guild = null;
         updateUserRPG(sender, { guild: null });
         return sock.sendMessage(jid, { text: `⚠️ Guild kamu tidak ditemukan. Sistem mereset guild-mu.` }, { quoted: m });
      }

      const text = `🏰 *GUILD INFO* 🏰\n────────────────────\n📛 *Nama:* ${guild.name} (ID: ${guild.id})\n👑 *Leader:* @${guild.leader.split("@")[0]}\n🌟 *Level:* ${guild.level} [${guild.exp} EXP]\n👥 *Members:* ${guild.members.length}/40\n────────────────────`;

      return sock.sendMessage(jid, { text, mentions: [guild.leader] }, { quoted: m });
    }
  }
};
