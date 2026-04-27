const { getUserRPG, updateUserRPG } = require("../database/rpg_db");
const { ITEMS, MONSTERS_DB, PETS } = require("../utils/rpg_core");

module.exports = {
  name: "codex",
  aliases: ["collection", "album", "dex"],
  async execute(sock, m, args, ctx) {
    const { jid, sender, cmd, PREFIX, getUser } = ctx;
    const isGroup = jid.endsWith("@g.us");
    const gUser = getUser(sender) || { name: "Player" };
    const userRPG = getUserRPG(sender, gUser.name);
    const codex = userRPG.codex || { monsters: [], items: [], pets: [], regions: [] };

    const category = args[0]?.toLowerCase() || "summary";

    if (category === "monsters" || category === "monster") {
      const total = MONSTERS_DB.length;
      const found = codex.monsters?.length || 0;
      let text = `📖 *CODEX — MONSTERS* 📖\n────────────────────\n📊 Progress: ${found}/${total} (${Math.floor(found/total*100)}%)\n\n`;
      MONSTERS_DB.forEach(m => {
        const discovered = codex.monsters.includes(m.id);
        text += `${discovered ? "✅" : "❓"} ${discovered ? m.name : "???"} (Lv.${m.minLevel}-${m.maxLevel})\n`;
      });
      return sock.sendMessage(jid, { text }, { quoted: m });
    }

    if (category === "items" || category === "item") {
      const allItems = Object.keys(ITEMS);
      const total = allItems.length;
      const found = codex.items?.length || 0;
      let text = `📖 *CODEX — ITEMS* 📖\n────────────────────\n📊 Progress: ${found}/${total} (${Math.floor(found/total*100)}%)\n\n`;
      allItems.forEach(k => {
        const discovered = codex.items.includes(k);
        text += `${discovered ? "✅" : "❓"} ${discovered ? ITEMS[k].name : "???"}\n`;
      });
      return sock.sendMessage(jid, { text }, { quoted: m });
    }

    if (category === "pets" || category === "pet") {
      const total = PETS.length;
      const found = codex.pets?.length || 0;
      let text = `📖 *CODEX — PETS* 📖\n────────────────────\n📊 Progress: ${found}/${total} (${Math.floor(found/total*100)}%)\n\n`;
      PETS.forEach(p => {
        const discovered = codex.pets.includes(p.id);
        text += `${discovered ? "✅" : "❓"} ${discovered ? `${p.name} (${p.rarity})` : "???"}\n`;
      });
      return sock.sendMessage(jid, { text }, { quoted: m });
    }

    // Summary
    const mTotal = MONSTERS_DB.length, mFound = codex.monsters?.length || 0;
    const iTotal = Object.keys(ITEMS).length, iFound = codex.items?.length || 0;
    const pTotal = PETS.length, pFound = codex.pets?.length || 0;
    const grandTotal = mTotal + iTotal + pTotal;
    const grandFound = mFound + iFound + pFound;

    let text = `📖 *CODEX / COLLECTION* 📖\n────────────────────\n`;
    text += `📊 *Total Progress:* ${grandFound}/${grandTotal} (${Math.floor(grandFound/grandTotal*100)}%)\n\n`;
    text += `👹 *Monsters:* ${mFound}/${mTotal}\n`;
    text += `📦 *Items:* ${iFound}/${iTotal}\n`;
    text += `🐾 *Pets:* ${pFound}/${pTotal}\n`;
    text += `\n────────────────────\nGunakan: \`${PREFIX}codex <monsters/items/pets>\``;

    // Completion rewards check
    if (grandFound >= grandTotal) text += `\n\n🏆 *MASTER COLLECTOR! Semua koleksi sudah lengkap!*`;
    else if (grandFound >= Math.floor(grandTotal * 0.5)) text += `\n\n🌟 *Half Collector! 50% koleksi terkumpul!*`;

    if (isGroup) {
      const rows = [
        { title: "👹 Monsters", id: `${PREFIX}codex monsters`, description: `${mFound}/${mTotal} ditemukan` },
        { title: "📦 Items", id: `${PREFIX}codex items`, description: `${iFound}/${iTotal} ditemukan` },
        { title: "🐾 Pets", id: `${PREFIX}codex pets`, description: `${pFound}/${pTotal} ditemukan` }
      ];
      return sock.sendMessage(jid, {
        interactiveMessage: { title: text, footer: "Raviel RPG Codex",
          buttons: [{ name: "single_select", buttonParamsJson: JSON.stringify({ title: "📖 KATEGORI", sections: [{ title: "CODEX", rows }] }) }] }
      }, { quoted: m });
    }
    return sock.sendMessage(jid, { text }, { quoted: m });
  }
};
