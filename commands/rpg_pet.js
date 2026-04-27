const { getUserRPG, updateUserRPG, updateInventory } = require("../database/rpg_db");
const { PETS, ITEMS, randomChance } = require("../utils/rpg_core");

module.exports = {
  name: "pet",
  aliases: ["hatch", "setpet"],
  async execute(sock, m, args, ctx) {
    const { jid, sender, cmd, PREFIX, getUser } = ctx;
    
    const gUser = getUser(sender) || { name: "Player" };
    const userRPG = getUserRPG(sender, gUser.name);

    if (cmd === "pet") {
      let petList = userRPG.pet.list;
      let activePet = userRPG.pet.active;
      
      let text = `🐾 *PET COMPANION* 🐾\n────────────────────\n`;
      text += `🌟 *Pet Aktif:* ${activePet ? activePet : "Tidak ada"}\n\n`;
      
      const isGroup = jid.endsWith("@g.us");

      if (isGroup) {
        const rows = petList.map(p => {
          const pDef = PETS.find(x => x.id === p);
          return {
            title: pDef.name,
            id: `${PREFIX}setpet ${p}`,
            description: `Rarity: ${pDef.rarity}`
          };
        });

        const hatchRows = [];
        if (userRPG.inventory["common_egg"] > 0) {
          hatchRows.push({ title: "Tetaskan Common Egg", id: `${PREFIX}hatch`, description: `Miliki: ${userRPG.inventory["common_egg"]}x` });
        }
        if (userRPG.inventory["rare_egg"] > 0) {
          hatchRows.push({ title: "Tetaskan Rare Egg", id: `${PREFIX}hatch`, description: `Miliki: ${userRPG.inventory["rare_egg"]}x` });
        }

        const sections = [];
        if (rows.length > 0) sections.push({ title: "DAFTAR PET KAMU", rows: rows });
        if (hatchRows.length > 0) sections.push({ title: "HATCH EGG", rows: hatchRows });

        if (sections.length === 0) {
          return sock.sendMessage(jid, { text: text + `_Kamu belum memiliki pet. Gunakan telur pet dari tas untuk menetaskannya._` }, { quoted: m });
        }

        return sock.sendMessage(jid, {
          interactiveMessage: {
            title: text + "Pilih pet untuk diaktifkan atau tetaskan telur:",
            footer: "Raviel RPG Pet System",
            buttons: [
              {
                name: "single_select",
                buttonParamsJson: JSON.stringify({
                  title: "🐾 KELOLA PET",
                  sections: sections
                })
              }
            ]
          }
        }, { quoted: m });
      } else {
        if (petList.length === 0) {
          text += `_Kamu belum memiliki pet. Gunakan ${PREFIX}hatch untuk menetaskan telur._`;
        } else {
          text += `📋 *Daftar Pet Kamu:*\n`;
          petList.forEach((p, idx) => {
            const pDef = PETS.find(x => x.id === p);
            text += `${idx + 1}. ${pDef.name} (${pDef.rarity})\n`;
          });
          text += `\n_Gunakan ${PREFIX}setpet <nama_pet> untuk mengaktifkan._`;
        }
        return sock.sendMessage(jid, { text }, { quoted: m });
      }
    }

    if (cmd === "hatch") {
      // Check if user has common_egg or rare_egg
      let eggToUse = null;
      if (userRPG.inventory["rare_egg"] > 0) eggToUse = "rare_egg";
      else if (userRPG.inventory["common_egg"] > 0) eggToUse = "common_egg";

      if (!eggToUse) {
        return sock.sendMessage(jid, { text: `⚠️ Kamu tidak memiliki Pet Egg apapun di inventory!` }, { quoted: m });
      }

      updateInventory(sender, eggToUse, -1);
      
      // Gacha pool
      let possiblePets = [];
      if (eggToUse === "common_egg") {
        possiblePets = PETS.filter(p => p.rarity === "common");
        if (randomChance(0.1)) possiblePets = possiblePets.concat(PETS.filter(p => p.rarity === "rare"));
      } else {
        possiblePets = PETS.filter(p => p.rarity === "rare");
        if (randomChance(0.3)) possiblePets = possiblePets.concat(PETS.filter(p => p.rarity === "epic"));
      }

      const hatchedPet = possiblePets[Math.floor(Math.random() * possiblePets.length)];
      
      if (!userRPG.pet.list.includes(hatchedPet.id)) {
        userRPG.pet.list.push(hatchedPet.id);
      }

      // If no active pet, auto active
      if (!userRPG.pet.active) {
        userRPG.pet.active = hatchedPet.id;
      }

      updateUserRPG(sender, { pet: userRPG.pet });
      return sock.sendMessage(jid, { text: `✨ *MENETASKAN TELUR...* ✨\n\n🎉 Selamat! Kamu mendapatkan pet *${hatchedPet.name}* (${hatchedPet.rarity})!` }, { quoted: m });
    }

    if (cmd === "setpet") {
      if (args.length < 1) {
        return sock.sendMessage(jid, { text: `⚠️ Gunakan: \`${PREFIX}setpet <id_pet>\`` }, { quoted: m });
      }

      const target = args[0].toLowerCase();
      if (!userRPG.pet.list.includes(target)) {
        return sock.sendMessage(jid, { text: `⚠️ Kamu tidak memiliki pet dengan ID *${target}*!` }, { quoted: m });
      }

      userRPG.pet.active = target;
      updateUserRPG(sender, { pet: userRPG.pet });
      
      const petDef = PETS.find(p => p.id === target);
      return sock.sendMessage(jid, { text: `✅ Berhasil mengaktifkan pet *${petDef.name}*! Stat kamu akan bertambah.` }, { quoted: m });
    }
  }
};
