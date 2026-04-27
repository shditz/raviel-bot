const { getUserRPG, updateUserRPG } = require("../database/rpg_db");
const { SKILL_TREES } = require("../utils/rpg_advanced");
const { checkCooldown, setCooldown } = require("../utils/rpg_core");

module.exports = {
  name: "skilltree",
  aliases: ["build", "addstat", "respec", "stats"],
  async execute(sock, m, args, ctx) {
    const { jid, sender, cmd, PREFIX, getUser } = ctx;
    const isGroup = jid.endsWith("@g.us");
    const gUser = getUser(sender) || { name: "Player" };
    const userRPG = getUserRPG(sender, gUser.name);

    if (cmd === "stats") {
      let text = `📊 *STATS & SKILL POINTS* 📊\n────────────────────\n`;
      text += `🎖️ Level: ${userRPG.level}\n`;
      text += `🔷 Skill Points: ${userRPG.skillPoints || 0}\n`;
      text += `⚔️ ATK: ${userRPG.atk} | 🛡️ DEF: ${userRPG.def}\n`;
      text += `💨 SPD: ${userRPG.spd} | 🍀 LUK: ${userRPG.luck}\n`;
      text += `❤️ MaxHP: ${userRPG.maxHp} | 🔷 MaxMana: ${userRPG.maxMana}\n`;
      text += `\n_Gunakan ${PREFIX}addstat <atk/def/spd/luck/hp/mana> <jumlah> untuk alokasi_`;
      return sock.sendMessage(jid, { text }, { quoted: m });
    }

    if (cmd === "addstat") {
      const stat = args[0]?.toLowerCase();
      const amount = parseInt(args[1]) || 1;
      const validStats = { atk: "atk", def: "def", spd: "spd", luck: "luck", hp: "maxHp", mana: "maxMana" };
      if (!validStats[stat]) return sock.sendMessage(jid, { text: `⚠️ Stat tidak valid! Pilih: ${Object.keys(validStats).join(", ")}` }, { quoted: m });
      if ((userRPG.skillPoints || 0) < amount) return sock.sendMessage(jid, { text: `⚠️ Skill point tidak cukup! (Punya: ${userRPG.skillPoints || 0})` }, { quoted: m });
      
      const field = validStats[stat];
      const addVal = stat === "hp" ? amount * 10 : stat === "mana" ? amount * 5 : amount * 2;
      userRPG[field] = (userRPG[field] || 0) + addVal;
      userRPG.skillPoints -= amount;
      if (field === "maxHp") userRPG.hp = Math.min(userRPG.hp, userRPG.maxHp);
      if (field === "maxMana") userRPG.mana = Math.min(userRPG.mana, userRPG.maxMana);
      updateUserRPG(sender, { [field]: userRPG[field], skillPoints: userRPG.skillPoints, hp: userRPG.hp, mana: userRPG.mana });
      return sock.sendMessage(jid, { text: `✅ *${stat.toUpperCase()}* +${addVal}! (Sisa SP: ${userRPG.skillPoints})` }, { quoted: m });
    }

    if (cmd === "respec") {
      const cd = checkCooldown(userRPG, "respec");
      if (cd.onCooldown) return sock.sendMessage(jid, { text: `⏳ Respec cooldown: ${cd.time}` }, { quoted: m });

      const hasItem = (userRPG.inventory?.respec_tome || 0) > 0;
      if (!hasItem && userRPG.money < 5000) return sock.sendMessage(jid, { text: `⚠️ Butuh 1x Respec Tome atau 5000 Gold!` }, { quoted: m });

      if (hasItem) { userRPG.inventory.respec_tome -= 1; if (userRPG.inventory.respec_tome <= 0) delete userRPG.inventory.respec_tome; }
      else userRPG.money -= 5000;

      // Calculate total SP spent in trees
      let refund = 0;
      if (userRPG.skillTree) {
        for (const treeId in userRPG.skillTree) {
          const tree = SKILL_TREES[treeId];
          if (!tree) continue;
          for (const nodeId of userRPG.skillTree[treeId]) {
            const node = tree.nodes.find(n => n.id === nodeId);
            if (node) refund += node.cost;
          }
        }
      }
      userRPG.skillTree = {};
      userRPG.skillPoints = (userRPG.skillPoints || 0) + refund;
      setCooldown(sender, "respec");
      updateUserRPG(sender, { skillTree: {}, skillPoints: userRPG.skillPoints, money: userRPG.money, inventory: userRPG.inventory });
      return sock.sendMessage(jid, { text: `✅ *RESPEC BERHASIL!* Mendapatkan kembali ${refund} Skill Points.` }, { quoted: m });
    }

    // Default: show skill tree
    const treeId = args[0]?.toLowerCase();
    if (treeId && SKILL_TREES[treeId]) {
      const tree = SKILL_TREES[treeId];
      const userNodes = userRPG.skillTree?.[treeId] || [];
      let text = `🌳 *${tree.name}* 🌳\n────────────────────\n🔷 SP Tersedia: ${userRPG.skillPoints || 0}\n\n`;
      tree.nodes.forEach(n => {
        const owned = userNodes.includes(n.id);
        const canLearn = !owned && (!n.req || userNodes.includes(n.req));
        const icon = owned ? "✅" : canLearn ? "🔓" : "🔒";
        const effects = Object.entries(n.effect).map(([k,v]) => `${k.toUpperCase()}${v>0?"+":""}${v}`).join(", ");
        text += `${icon} *${n.name}* (SP: ${n.cost})\n   Efek: ${effects}\n`;
      });
      text += `\n_Gunakan: ${PREFIX}build ${treeId} <node_id>_`;

      if (isGroup) {
        const rows = tree.nodes.filter(n => !userNodes.includes(n.id) && (!n.req || userNodes.includes(n.req))).map(n => ({
          title: n.name, id: `${PREFIX}build ${treeId} ${n.id}`, description: `SP: ${n.cost} | ${Object.entries(n.effect).map(([k,v]) => `${k}${v>0?"+":""}${v}`).join(", ")}`
        }));
        if (rows.length > 0) {
          return sock.sendMessage(jid, {
            interactiveMessage: { title: text, footer: "Raviel RPG Skill Tree",
              buttons: [{ name: "single_select", buttonParamsJson: JSON.stringify({ title: "🌳 LEARN NODE", sections: [{ title: "NODES", rows }] }) }] }
          }, { quoted: m });
        }
      }
      return sock.sendMessage(jid, { text }, { quoted: m });
    }

    // Show all trees
    let text = `🌳 *SKILL TREE* 🌳\n────────────────────\n🔷 SP: ${userRPG.skillPoints || 0}\n\n`;
    for (const tid in SKILL_TREES) {
      const t = SKILL_TREES[tid];
      const count = userRPG.skillTree?.[tid]?.length || 0;
      text += `🔹 *${t.name}* (${tid}) — ${count}/${t.nodes.length} nodes\n`;
    }
    text += `\n────────────────────\nGunakan: \`${PREFIX}skilltree <tree_id>\``;

    if (isGroup) {
      const rows = Object.keys(SKILL_TREES).map(k => ({
        title: SKILL_TREES[k].name, id: `${PREFIX}skilltree ${k}`,
        description: `${userRPG.skillTree?.[k]?.length || 0}/${SKILL_TREES[k].nodes.length} nodes`
      }));
      return sock.sendMessage(jid, {
        interactiveMessage: { title: text, footer: "Raviel RPG Skill Tree",
          buttons: [{ name: "single_select", buttonParamsJson: JSON.stringify({ title: "🌳 PILIH TREE", sections: [{ title: "SKILL TREES", rows }] }) }] }
      }, { quoted: m });
    }
    return sock.sendMessage(jid, { text }, { quoted: m });
  }
};
