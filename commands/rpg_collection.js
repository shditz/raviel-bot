const { getUserRPG } = require("../database/rpg_db");
const { MONSTERS, ITEMS, PETS } = require("../utils/rpg_core");

module.exports = {
  name: "collection",
  aliases: ["album", "dex"],
  async execute(sock, m, args, ctx) {
    const { jid, sender, getUser } = ctx;
    const gUser = getUser(sender) || { name: "Player" };
    const userRPG = getUserRPG(sender, gUser.name);

    const coll = userRPG.collection || { monsters: [], items: [], pets: [] };

    let totalMonsters = Object.keys(MONSTERS).length;
    let totalItems = Object.keys(ITEMS).length;
    let totalPets = PETS.length;

    let text = `📖 *COLLECTION ALBUM* 📖
────────────────────
Koleksimu mengukur seberapa jauh kamu bereksplorasi di dunia ini.

👾 *Monsters Defeated:* ${coll.monsters.length} / ${totalMonsters}
🎒 *Items Discovered:* ${coll.items.length} / ${totalItems}
🐾 *Pets Tamed:* ${coll.pets.length} / ${totalPets}
────────────────────
_Koleksi ini bertambah otomatis setiap kamu memburu monster baru, mendapat item baru, atau menetaskan pet baru._`;

    return sock.sendMessage(jid, { text }, { quoted: m });
  }
};
