const fs = require("fs");
const path = require("path");
const { getUserRPG } = require("../database/rpg_db");
const { getLevelExp, calcTotalStats, checkRegen, WORLD_STATE } = require("../utils/rpg_core");

module.exports = {
  name: "rpgmenu",
  aliases: ["rpg", "menu-rpg"],
  async execute(sock, m, args, ctx) {
    const { jid, sender, isGroup, PREFIX, getUser } = ctx;
    
    // Get general user for name
    const gUser = getUser(sender) || { name: "Player" };
    
    // Get RPG user & Regen check
    let userRPG = getUserRPG(sender, gUser.name);
    userRPG = checkRegen(userRPG);
    
    const stats = calcTotalStats(userRPG);
    const reqExp = getLevelExp(userRPG.level);
    
    const imagePath = path.join(__dirname, "../assets/rpg_banner.jpg");
    let imageMsg = {};
    if (fs.existsSync(imagePath)) {
      imageMsg = { image: { url: imagePath } };
    }
    
    const text = `⚔️ *RAVIEL RPG MENU* ⚔️
────────────────────
👤 *Player:* ${userRPG.name}
🎖️ *Level:* ${userRPG.level} [${userRPG.exp}/${reqExp} EXP]
💼 *Class:* ${userRPG.job.toUpperCase()}
🌍 *Lokasi:* ${userRPG.location}
💰 *Money:* ${userRPG.money} Gold
❤️ *HP:* ${stats.hp}/${stats.maxHp}
🔷 *Mana:* ${stats.mana}/${stats.maxMana}
⚡ *Stamina:* ${stats.stamina}/${stats.maxStamina}
🗡️ *ATK:* ${stats.atk} | 🛡️ *DEF:* ${stats.def} | 🍀 *LUK:* ${stats.luck}
🌦️ *Cuaca Dunia:* ${WORLD_STATE.weather}
────────────────────
Silakan pilih fitur RPG di bawah ini:`;

    if (isGroup) {
      const rpgMenuButton = [
        {
          name: "single_select",
          buttonParamsJson: JSON.stringify({
            title: "⚔️ PILIH MENU RPG ⚔️",
            sections: [
              {
                title: "─── [ STATUS & CLASS ] ───",
                rows: [
                  { title: `${PREFIX}profile`, id: `${PREFIX}profile`, description: "Lihat profil lengkap" },
                  { title: `${PREFIX}class`, id: `${PREFIX}class`, description: "Pilih/ganti class" },
                  { title: `${PREFIX}inv`, id: `${PREFIX}inv`, description: "Buka tas / inventory" },
                  { title: `${PREFIX}equip`, id: `${PREFIX}equip`, description: "Pakai equipment" },
                  { title: `${PREFIX}use`, id: `${PREFIX}use`, description: "Gunakan item / potion" },
                  { title: `${PREFIX}pet`, id: `${PREFIX}pet`, description: "Kelola peliharaan" },
                  { title: `${PREFIX}effects`, id: `${PREFIX}effects`, description: "Lihat buff & debuff" },
                  { title: `${PREFIX}stamina`, id: `${PREFIX}stamina`, description: "Cek energi & rest" },
                  { title: `${PREFIX}cd`, id: `${PREFIX}cd`, description: "Cek semua cooldown" }
                ]
              },
              {
                title: "─── [ SKILL & BUILD ] ───",
                rows: [
                  { title: `${PREFIX}skilltree`, id: `${PREFIX}skilltree`, description: "Skill tree & build path" },
                  { title: `${PREFIX}stats`, id: `${PREFIX}stats`, description: "Lihat stats & skill point" },
                  { title: `${PREFIX}skill`, id: `${PREFIX}skill`, description: "Lihat skill aktif" }
                ]
              },
              {
                title: "─── [ DAILY & REWARD ] ───",
                rows: [
                  { title: `${PREFIX}daily`, id: `${PREFIX}daily`, description: "Klaim hadiah harian" },
                  { title: `${PREFIX}weekly`, id: `${PREFIX}weekly`, description: "Klaim hadiah mingguan" },
                  { title: `${PREFIX}quest`, id: `${PREFIX}quest`, description: "Cek misi harian" },
                  { title: `${PREFIX}gacha`, id: `${PREFIX}gacha`, description: "Buka Loot Box" },
                  { title: `${PREFIX}fortune`, id: `${PREFIX}fortune`, description: "Ramal keberuntungan" }
                ]
              },
              {
                title: "─── [ EKSPLORASI & COMBAT ] ───",
                rows: [
                  { title: `${PREFIX}map`, id: `${PREFIX}map`, description: "World Map & Region" },
                  { title: `${PREFIX}travel`, id: `${PREFIX}travel`, description: "Pindah ke lokasi lain" },
                  { title: `${PREFIX}hunt`, id: `${PREFIX}hunt`, description: "Berburu monster" },
                  { title: `${PREFIX}battle`, id: `${PREFIX}battle`, description: "Lawan monster spesifik" },
                  { title: `${PREFIX}arena`, id: `${PREFIX}arena`, description: "PvP Arena" },
                  { title: `${PREFIX}dungeon`, id: `${PREFIX}dungeon`, description: "Dungeon raid" },
                  { title: `${PREFIX}boss`, id: `${PREFIX}boss`, description: "World Boss" },
                  { title: `${PREFIX}event`, id: `${PREFIX}event`, description: "World Events" },
                  { title: `${PREFIX}weather`, id: `${PREFIX}weather`, description: "Cek cuaca dunia" }
                ]
              },
              {
                title: "─── [ EKONOMI & KERJA ] ───",
                rows: [
                  { title: `${PREFIX}mine`, id: `${PREFIX}mine`, description: "Menambang ore" },
                  { title: `${PREFIX}wood`, id: `${PREFIX}wood`, description: "Menebang kayu" },
                  { title: `${PREFIX}fish`, id: `${PREFIX}fish`, description: "Memancing ikan" },
                  { title: `${PREFIX}farm`, id: `${PREFIX}farm`, description: "Bertani" },
                  { title: `${PREFIX}auction`, id: `${PREFIX}auction`, description: "Auction House" },
                  { title: `${PREFIX}shop`, id: `${PREFIX}shop`, description: "Global RPG Shop" },
                  { title: `${PREFIX}bank`, id: `${PREFIX}bank`, description: "Bank Raviel" },
                  { title: `${PREFIX}crime`, id: `${PREFIX}crime`, description: "Aksi kriminal" },
                  { title: `${PREFIX}base`, id: `${PREFIX}base`, description: "Base / Housing" }
                ]
              },
              {
                title: "─── [ CRAFT & UPGRADE ] ───",
                rows: [
                  { title: `${PREFIX}craft`, id: `${PREFIX}craft`, description: "Craft equipment" },
                  { title: `${PREFIX}enchant`, id: `${PREFIX}enchant`, description: "Upgrade equipment" },
                  { title: `${PREFIX}luck`, id: `${PREFIX}luck`, description: "Lucky System" }
                ]
              },
              {
                title: "─── [ SOSIAL & RANKING ] ───",
                rows: [
                  { title: `${PREFIX}party`, id: `${PREFIX}party`, description: "Sistem kelompok" },
                  { title: `${PREFIX}guild`, id: `${PREFIX}guild`, description: "Guild / Aliansi" },
                  { title: `${PREFIX}guildwar`, id: `${PREFIX}guildwar`, description: "Guild War" },
                  { title: `${PREFIX}partner`, id: `${PREFIX}partner`, description: "Partner" },
                  { title: `${PREFIX}rank`, id: `${PREFIX}rank`, description: "Leaderboard" }
                ]
              },
              {
                title: "─── [ STORY & PRESTIGE ] ───",
                rows: [
                  { title: `${PREFIX}story`, id: `${PREFIX}story`, description: "Mini RPG Story" },
                  { title: `${PREFIX}rebirth`, id: `${PREFIX}rebirth`, description: "Prestige (Lv 999)" },
                  { title: `${PREFIX}codex`, id: `${PREFIX}codex`, description: "Collection / Codex" },
                  { title: `${PREFIX}title`, id: `${PREFIX}title`, description: "Gelar/Title" },
                  { title: `${PREFIX}achieve`, id: `${PREFIX}achieve`, description: "Achievement" }
                ]
              }
            ]
          })
        }
      ];

      return sock.sendMessage(jid, {
        interactiveMessage: {
          image: imageMsg.image,
          title: text,
          footer: `© ${new Date().getFullYear()} Raviel RPG`,
          buttons: rpgMenuButton
        }
      }, { quoted: m });
    } else {
      // Fallback for private chat
      let fallbackText = text + `\n\n📌 *Navigasi Perintah:*\n`;
      fallbackText += `🔹 ${PREFIX}profile / ${PREFIX}class / ${PREFIX}cd - Status\n`;
      fallbackText += `🔹 ${PREFIX}inv / ${PREFIX}equip / ${PREFIX}use - Item\n`;
      fallbackText += `🔹 ${PREFIX}skilltree / ${PREFIX}stats / ${PREFIX}effects - Build\n`;
      fallbackText += `🔹 ${PREFIX}daily / ${PREFIX}quest / ${PREFIX}fortune - Reward\n`;
      fallbackText += `🔹 ${PREFIX}hunt / ${PREFIX}battle / ${PREFIX}arena - Combat\n`;
      fallbackText += `🔹 ${PREFIX}map / ${PREFIX}travel / ${PREFIX}event / ${PREFIX}weather - Dunia\n`;
      fallbackText += `🔹 ${PREFIX}auction / ${PREFIX}shop / ${PREFIX}bank / ${PREFIX}mine - Ekonomi\n`;
      fallbackText += `🔹 ${PREFIX}base / ${PREFIX}craft / ${PREFIX}luck - Upgrade\n`;
      fallbackText += `🔹 ${PREFIX}rank / ${PREFIX}guild / ${PREFIX}guildwar - Sosial\n`;
      fallbackText += `🔹 ${PREFIX}story / ${PREFIX}codex / ${PREFIX}rebirth - Prestige\n`;
      fallbackText += `\nKetik perintah langsung untuk menggunakannya.`;

      if (imageMsg.image) {
         return sock.sendMessage(jid, { image: imageMsg.image, caption: fallbackText }, { quoted: m });
      } else {
         return sock.sendMessage(jid, { text: fallbackText }, { quoted: m });
      }
    }
  }
};
