const { getTopUsersBy } = require("../database/rpg_db");

const CATEGORIES = {
  level: { label: "🎖️ Level", field: "level", format: u => `Lv. ${u.level}` },
  money: { label: "💰 Gold", field: "money", format: u => `${u.money} Gold` },
  huntCount: { label: "🐾 Hunt Count", field: "huntCount", format: u => `${u.stats?.huntCount || 0} hunts` },
  battleWin: { label: "⚔️ Battle Win", field: "battleWin", format: u => `${u.stats?.battleWin || 0} wins` },
  dungeonClear: { label: "🏰 Dungeon", field: "dungeonClear", format: u => `${u.stats?.dungeonClear || 0} clears` },
  bossKill: { label: "👹 Boss Kill", field: "bossKill", format: u => `${u.stats?.bossKill || 0} kills` },
  rebirth: { label: "🔥 Rebirth", field: "rebirth", format: u => `${u.rebirth?.count || 0} rebirths` },
  collection: { label: "📖 Collection", field: "collection", format: u => {
    const t = (u.codex?.monsters?.length||0)+(u.codex?.items?.length||0)+(u.codex?.pets?.length||0);
    return `${t} entries`;
  }}
};

module.exports = {
  name: "leaderboard",
  aliases: ["top", "rank"],
  async execute(sock, m, args, ctx) {
    const { jid, PREFIX } = ctx;
    const isGroup = jid.endsWith("@g.us");
    const catId = args[0]?.toLowerCase();

    if (isGroup && !catId) {
      const rows = Object.keys(CATEGORIES).map(k => ({
        title: CATEGORIES[k].label, id: `${PREFIX}rank ${k}`, description: `Top 10 by ${CATEGORIES[k].label}`
      }));
      return sock.sendMessage(jid, {
        interactiveMessage: {
          title: "🏆 *GLOBAL LEADERBOARD* 🏆\nPilih kategori ranking:",
          footer: "Raviel RPG Leaderboard",
          buttons: [{ name: "single_select", buttonParamsJson: JSON.stringify({ title: "🏆 KATEGORI", sections: [{ title: "PILIH KATEGORI", rows }] }) }]
        }
      }, { quoted: m });
    }

    const cat = CATEGORIES[catId] || CATEGORIES.level;
    const topUsers = getTopUsersBy(cat.field, 10);

    let text = `🏆 *GLOBAL LEADERBOARD* 🏆\nKategori: *${cat.label}*\n────────────────────\n`;
    topUsers.forEach((u, i) => {
      const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i+1}.`;
      text += `${medal} *${u.name}* — ${cat.format(u)}\n`;
    });
    text += `────────────────────\n_Kategori: ${Object.keys(CATEGORIES).join(", ")}_`;

    return sock.sendMessage(jid, { text }, { quoted: m });
  }
};
