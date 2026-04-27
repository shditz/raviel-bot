const { getUserRPG, updateUserRPG, getParty, createParty, updateParty, deleteParty } = require("../database/rpg_db");
const { v4: uuidv4 } = require('uuid');

function generatePartyId() {
  return "P" + Math.random().toString(36).substring(2, 6).toUpperCase();
}

module.exports = {
  name: "party",
  aliases: ["createparty", "joinparty", "leaveparty", "kickparty"],
  async execute(sock, m, args, ctx) {
    const { jid, sender, cmd, PREFIX, getUser } = ctx;
    const gUser = getUser(sender) || { name: "Player" };
    const userRPG = getUserRPG(sender, gUser.name);

    if (cmd === "createparty") {
      if (userRPG.party) return sock.sendMessage(jid, { text: `⚠️ Kamu sudah berada di party!` }, { quoted: m });

      const partyId = generatePartyId();
      createParty(partyId, {
         id: partyId,
         leader: sender,
         members: [sender],
         max: 4
      });

      userRPG.party = partyId;
      updateUserRPG(sender, { party: partyId });

      return sock.sendMessage(jid, { text: `✅ Party berhasil dibuat! ID Party: *${partyId}*.\nBerikan ID ini ke teman untuk bergabung menggunakan ${PREFIX}joinparty ${partyId}.` }, { quoted: m });
    }

    if (cmd === "joinparty") {
      if (userRPG.party) return sock.sendMessage(jid, { text: `⚠️ Kamu sudah berada di party!` }, { quoted: m });
      
      const partyId = args[0]?.toUpperCase();
      if (!partyId) return sock.sendMessage(jid, { text: `⚠️ Gunakan: ${PREFIX}joinparty <ID>` }, { quoted: m });

      const party = getParty(partyId);
      if (!party) return sock.sendMessage(jid, { text: `⚠️ Party tidak ditemukan!` }, { quoted: m });

      if (party.members.length >= party.max) {
         return sock.sendMessage(jid, { text: `⚠️ Party sudah penuh!` }, { quoted: m });
      }

      party.members.push(sender);
      updateParty(partyId, { members: party.members });

      userRPG.party = partyId;
      updateUserRPG(sender, { party: partyId });

      return sock.sendMessage(jid, { text: `✅ Berhasil bergabung dengan Party *${partyId}*!` }, { quoted: m });
    }

    if (cmd === "leaveparty") {
      if (!userRPG.party) return sock.sendMessage(jid, { text: `⚠️ Kamu tidak berada di party mana pun.` }, { quoted: m });

      const partyId = userRPG.party;
      const party = getParty(partyId);

      if (party) {
         party.members = party.members.filter(m => m !== sender);
         if (party.members.length === 0) {
            deleteParty(partyId);
         } else if (party.leader === sender) {
            party.leader = party.members[0]; // pass leader
            updateParty(partyId, party);
         } else {
            updateParty(partyId, party);
         }
      }

      userRPG.party = null;
      updateUserRPG(sender, { party: null });
      return sock.sendMessage(jid, { text: `🚪 Kamu telah keluar dari party.` }, { quoted: m });
    }

    if (cmd === "party") {
      if (!userRPG.party) return sock.sendMessage(jid, { text: `⚠️ Kamu tidak berada di party mana pun.\nGunakan ${PREFIX}createparty atau ${PREFIX}joinparty.` }, { quoted: m });
      
      const party = getParty(userRPG.party);
      if (!party) {
         userRPG.party = null;
         updateUserRPG(sender, { party: null });
         return sock.sendMessage(jid, { text: `⚠️ Party tidak ditemukan. Di-reset.` }, { quoted: m });
      }

      let text = `👥 *PARTY INFO [${party.id}]* 👥\n────────────────────\n`;
      text += `👑 *Leader:* @${party.leader.split("@")[0]}\n`;
      text += `👥 *Members (${party.members.length}/${party.max}):*\n`;
      
      party.members.forEach((m, i) => {
         text += `${i+1}. @${m.split("@")[0]}\n`;
      });

      text += `────────────────────\n_Sistem party membagikan tambahan persentase EXP ke seluruh member saat berdekatan_`;

      return sock.sendMessage(jid, { text, mentions: party.members }, { quoted: m });
    }
  }
};
