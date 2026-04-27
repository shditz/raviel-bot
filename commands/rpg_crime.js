const { getUserRPG, updateUserRPG } = require("../database/rpg_db");
const { checkCooldown, setCooldown, randomChance } = require("../utils/rpg_core");

module.exports = {
  name: "crime",
  aliases: ["rob", "heist"],
  async execute(sock, m, args, ctx) {
    const { jid, sender, cmd, PREFIX, getUser } = ctx;
    const gUser = getUser(sender) || { name: "Player" };
    const userRPG = getUserRPG(sender, gUser.name);

    const cd = checkCooldown(userRPG, "crime");
    if (cd.onCooldown) {
      return sock.sendMessage(jid, { text: `🚔 Kamu sedang dalam pengejaran polisi! Sembunyi selama ${cd.time}.` }, { quoted: m });
    }

    const isGroup = jid.endsWith("@g.us");

    if (args.length < 1 && isGroup) {
      const buttons = [
        {
          name: "single_select",
          buttonParamsJson: JSON.stringify({
            title: "🕵️ PILIH AKSI KRIMINAL",
            sections: [
              {
                title: "OPSI KEJAHATAN",
                rows: [
                  { title: "🥷 Mencopet", id: `${PREFIX}crime rob`, description: "Risiko Rendah | Hasil Kecil" },
                  { title: "🏦 Merampok Bank", id: `${PREFIX}crime heist`, description: "Risiko Tinggi | Hasil Besar" },
                  { title: "💎 Penyelundupan", id: `${PREFIX}crime diamond`, description: "Risiko Sedang | Bonus Item" }
                ]
              }
            ]
          })
        }
      ];

      return sock.sendMessage(jid, {
        interactiveMessage: {
          title: "🕵️ *DUNIA BAWAH TANAH* 🕵️\nApakah Anda siap menanggung risikonya? Pilih aksi Anda:",
          footer: "Raviel RPG Crime System",
          buttons: buttons
        }
      }, { quoted: m });
    }

    setCooldown(sender, "crime");

    // Success rate is affected by Job and Luck
    let baseRate = 0.4; // 40% chance
    if (userRPG.job === "thief") baseRate += 0.2;

    const isSuccess = randomChance(baseRate, userRPG.luck);

    if (isSuccess) {
       const stealAmount = Math.floor(Math.random() * 3000) + 1000;
       userRPG.money += stealAmount;
       
       let bonusItem = "";
       if (randomChance(0.1, userRPG.luck)) {
          const { updateInventory } = require("../database/rpg_db");
          updateInventory(sender, "rare_egg", 1);
          bonusItem = "\n📦 Jackpot! Kamu menemukan 1x Rare Egg!";
       }

       updateUserRPG(sender, { money: userRPG.money });
       return sock.sendMessage(jid, { text: `🥷 *AKSI BERHASIL!* 🥷\nKamu berhasil melakukan perampokan dan mendapat ${stealAmount} Gold!${bonusItem}` }, { quoted: m });
    } else {
       const fine = Math.floor(userRPG.money * 0.1) + 500; // 10% of money + 500 flat
       userRPG.money = Math.max(0, userRPG.money - fine);
       userRPG.hp = Math.max(1, userRPG.hp - 50); // Get beaten
       
       updateUserRPG(sender, { money: userRPG.money, hp: userRPG.hp });
       return sock.sendMessage(jid, { text: `🚔 *TERTANGKAP!* 🚔\nAksimu ketahuan! Kamu dihajar (HP -50) dan didenda ${fine} Gold!` }, { quoted: m });
    }
  }
};
