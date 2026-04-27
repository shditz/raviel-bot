const { getUserRPG, updateUserRPG } = require("../database/rpg_db");
const { CLASSES, ADVANCED_COOLDOWNS, REGIONS } = require("./rpg_advanced");

// =======================
// RPG DATA DEFINITIONS
// =======================

const ITEMS = {
  // Consumables
  health_potion: { name: "Health Potion", type: "consumable", price: 50, healPercent: 0.3, desc: "Memulihkan 30% HP" },
  mana_potion: { name: "Mana Potion", type: "consumable", price: 50, healMana: 50, desc: "Memulihkan 50 Mana" },
  stamina_potion: { name: "Stamina Potion", type: "consumable", price: 100, healStamina: 50, desc: "Memulihkan 50 Stamina" },
  elixir: { name: "Elixir", type: "consumable", price: 500, healPercent: 1.0, healMana: 200, healStamina: 200, desc: "Memulihkan semua secara penuh" },
  
  // Materials
  wood: { name: "Wood", type: "material", price: 10, desc: "Kayu biasa dari hutan" },
  stone: { name: "Stone", type: "material", price: 15, desc: "Batu kasar dari tambang" },
  iron_ore: { name: "Iron Ore", type: "material", price: 30, desc: "Bijih besi murni" },
  gold_ore: { name: "Gold Ore", type: "material", price: 100, desc: "Bijih emas berharga" },
  diamond: { name: "Diamond", type: "material", price: 1000, desc: "Berlian langka" },
  leather: { name: "Leather", type: "material", price: 25, desc: "Kulit binatang" },
  monster_bone: { name: "Monster Bone", type: "material", price: 20, desc: "Tulang monster" },
  slime_gel: { name: "Slime Gel", type: "material", price: 15, desc: "Gel dari slime" },
  enchant_stone: { name: "Enchant Stone", type: "material", price: 200, desc: "Batu ajaib untuk upgrade equipment" },
  magic_core: { name: "Magic Core", type: "material", price: 500, desc: "Inti sihir dari monster kuat" },
  
  // Weapons
  wooden_sword: { name: "Wooden Sword", type: "weapon", price: 100, stats: { atk: 5 }, desc: "Pedang latihan dari kayu" },
  iron_sword: { name: "Iron Sword", type: "weapon", price: 500, stats: { atk: 15 }, desc: "Pedang besi standar" },
  steel_sword: { name: "Steel Sword", type: "weapon", price: 1200, stats: { atk: 35 }, desc: "Pedang baja tajam" },
  mythril_blade: { name: "Mythril Blade", type: "weapon", price: 3000, stats: { atk: 70, spd: 10 }, desc: "Pedang mythril ringan" },
  dragon_blade: { name: "Dragon Blade", type: "weapon", price: 5000, stats: { atk: 100, luck: 10 }, desc: "Pedang legendaris" },
  
  // Armors
  cloth_armor: { name: "Cloth Armor", type: "armor", price: 150, stats: { def: 5, maxHp: 20 }, desc: "Baju kain biasa" },
  leather_armor: { name: "Leather Armor", type: "armor", price: 400, stats: { def: 10, maxHp: 50 }, desc: "Zirah kulit" },
  iron_armor: { name: "Iron Armor", type: "armor", price: 1000, stats: { def: 30, maxHp: 100 }, desc: "Zirah besi kuat" },
  dragon_armor: { name: "Dragon Armor", type: "armor", price: 5000, stats: { def: 80, maxHp: 300 }, desc: "Zirah skala naga" },
  
  // Accessories
  ring_of_luck: { name: "Ring of Luck", type: "accessory", price: 1500, stats: { luck: 25 }, desc: "Meningkatkan keberuntungan secara drastis" },
  speed_boots: { name: "Speed Boots", type: "accessory", price: 2000, stats: { spd: 30 }, desc: "Sepatu penambah kelincahan" },
  pendant_of_mana: { name: "Mana Pendant", type: "accessory", price: 1800, stats: { maxMana: 100 }, desc: "Meningkatkan kapasitas mana" },
  amulet_of_fire: { name: "Fire Amulet", type: "accessory", price: 3000, stats: { atk: 20, luck: 10 }, desc: "Jimat api yang membakar" },
  shadow_cloak: { name: "Shadow Cloak", type: "accessory", price: 4000, stats: { spd: 25, luck: 15 }, desc: "Jubah bayangan" },

  // More Weapons
  bone_club: { name: "Bone Club", type: "weapon", price: 200, stats: { atk: 8 }, desc: "Gada tulang kasar" },
  silver_lance: { name: "Silver Lance", type: "weapon", price: 2000, stats: { atk: 45, spd: 5 }, desc: "Tombak perak tajam" },
  shadow_dagger: { name: "Shadow Dagger", type: "weapon", price: 2500, stats: { atk: 40, spd: 15, luck: 5 }, desc: "Belati bayangan mematikan" },
  arcane_staff: { name: "Arcane Staff", type: "weapon", price: 3500, stats: { atk: 55, maxMana: 50 }, desc: "Tongkat arkanis untuk mage" },
  demon_axe: { name: "Demon Axe", type: "weapon", price: 8000, stats: { atk: 130 }, desc: "Kapak iblis yang mengerikan" },
  celestial_bow: { name: "Celestial Bow", type: "weapon", price: 10000, stats: { atk: 110, luck: 25, spd: 15 }, desc: "Busur surgawi langka" },

  // More Armors
  chain_mail: { name: "Chain Mail", type: "armor", price: 700, stats: { def: 18, maxHp: 70 }, desc: "Baju rantai standar" },
  steel_plate: { name: "Steel Plate", type: "armor", price: 2500, stats: { def: 50, maxHp: 180 }, desc: "Baja tebal pelindung" },
  shadow_robe: { name: "Shadow Robe", type: "armor", price: 3000, stats: { def: 25, maxMana: 80, spd: 10 }, desc: "Jubah sihir gelap" },
  phoenix_armor: { name: "Phoenix Armor", type: "armor", price: 8000, stats: { def: 100, maxHp: 400 }, desc: "Zirah phoenix tak terkalahkan" },

  // More Materials
  crystal: { name: "Crystal", type: "material", price: 150, desc: "Kristal jernih bersinar" },
  dragon_scale: { name: "Dragon Scale", type: "material", price: 800, desc: "Sisik naga kuat" },
  ancient_rune: { name: "Ancient Rune", type: "material", price: 600, desc: "Rune kuno penuh kekuatan" },
  dark_essence: { name: "Dark Essence", type: "material", price: 400, desc: "Esensi kegelapan" },
  fish: { name: "Fish", type: "material", price: 12, desc: "Ikan segar" },
  wheat: { name: "Wheat", type: "material", price: 8, desc: "Gandum segar" },

  // More Consumables
  super_potion: { name: "Super Potion", type: "consumable", price: 200, healPercent: 0.6, desc: "Memulihkan 60% HP" },
  antidote: { name: "Antidote", type: "consumable", price: 80, clearDebuff: true, desc: "Menghilangkan efek negatif" },
  attack_scroll: { name: "Attack Scroll", type: "consumable", price: 300, buffEffect: { name: "ATK Boost", effects: { atk: 20 }, duration: 600000 }, desc: "Buff ATK +20 selama 10 menit" },
  defense_scroll: { name: "Defense Scroll", type: "consumable", price: 300, buffEffect: { name: "DEF Boost", effects: { def: 20 }, duration: 600000 }, desc: "Buff DEF +20 selama 10 menit" },
  lucky_charm: { name: "Lucky Charm", type: "consumable", price: 500, buffEffect: { name: "Luck Boost", effects: { luck: 25 }, duration: 900000 }, desc: "Buff Luck +25 selama 15 menit" },

  // Eggs & Boxes
  common_egg: { name: "Common Pet Egg", type: "egg", price: 1000, desc: "Telur pet biasa" },
  rare_egg: { name: "Rare Pet Egg", type: "egg", price: 5000, desc: "Telur pet langka" },
  epic_egg: { name: "Epic Pet Egg", type: "egg", price: 15000, desc: "Telur pet epik sangat langka" },
  wooden_chest: { name: "Wooden Chest", type: "lootbox", price: 500, desc: "Peti kayu biasa" },
  golden_chest: { name: "Golden Chest", type: "lootbox", price: 3000, desc: "Peti emas" },
  diamond_chest: { name: "Diamond Chest", type: "lootbox", price: 10000, desc: "Peti berlian legendaris" },
  wedding_ring: { name: "Wedding Ring", type: "special", price: 10000, desc: "Cincin lamaran" },
  revive_feather: { name: "Revive Feather", type: "special", price: 2000, desc: "Digunakan otomatis saat mati (Coming Soon)" },
  respec_tome: { name: "Respec Tome", type: "special", price: 5000, desc: "Reset skill tree" },
  god_potion: { name: "God Potion", type: "consumable", price: 2000, healPercent: 1.0, healMana: 1000, desc: "Ramuan dewa yang memulihkan segalanya" },
  void_crystal: { name: "Void Crystal", type: "material", price: 5000, desc: "Kristal hampa dari dimensi lain" },
  essence_of_chaos: { name: "Essence of Chaos", type: "material", price: 8000, desc: "Esensi kekacauan murni" },
  infinity_blade: { name: "Infinity Blade", type: "weapon", price: 50000, stats: { atk: 500, luck: 50, spd: 30 }, desc: "Pedang tanpa batas" },
  void_plate: { name: "Void Plate", type: "armor", price: 45000, stats: { def: 300, maxHp: 2000 }, desc: "Zirah hampa yang menyerap serangan" }
};

// Monster DB: Scalable
const MONSTERS_DB = [
  { id: "slime", name: "Slime", minLevel: 1, maxLevel: 5, baseHp: 30, baseAtk: 5, baseDef: 2, drop: "slime_gel", tier: "common" },
  { id: "goblin", name: "Goblin", minLevel: 2, maxLevel: 8, baseHp: 50, baseAtk: 8, baseDef: 3, drop: "monster_bone", tier: "common" },
  { id: "wolf", name: "Wild Wolf", minLevel: 4, maxLevel: 12, baseHp: 80, baseAtk: 15, baseDef: 5, drop: "leather", tier: "common" },
  { id: "skeleton", name: "Skeleton", minLevel: 6, maxLevel: 15, baseHp: 100, baseAtk: 20, baseDef: 10, drop: "monster_bone", tier: "common" },
  { id: "orc", name: "Orc Fighter", minLevel: 10, maxLevel: 20, baseHp: 150, baseAtk: 30, baseDef: 15, drop: "iron_ore", tier: "common" },
  { id: "bandit", name: "Bandit", minLevel: 12, maxLevel: 25, baseHp: 180, baseAtk: 35, baseDef: 12, drop: "leather", tier: "common" },
  { id: "harpy", name: "Harpy", minLevel: 15, maxLevel: 30, baseHp: 200, baseAtk: 45, baseDef: 15, drop: "magic_core", tier: "rare" },
  { id: "lizardman", name: "Lizardman", minLevel: 18, maxLevel: 35, baseHp: 250, baseAtk: 50, baseDef: 30, drop: "iron_ore", tier: "common" },
  { id: "ent", name: "Forest Ent", minLevel: 20, maxLevel: 40, baseHp: 400, baseAtk: 40, baseDef: 50, drop: "wood", tier: "rare" },
  { id: "dark_mage", name: "Dark Mage", minLevel: 25, maxLevel: 45, baseHp: 250, baseAtk: 80, baseDef: 10, drop: "magic_core", tier: "rare" },
  { id: "troll", name: "Cave Troll", minLevel: 30, maxLevel: 50, baseHp: 600, baseAtk: 70, baseDef: 40, drop: "stone", tier: "elite" },
  { id: "gargoyle", name: "Gargoyle", minLevel: 35, maxLevel: 55, baseHp: 500, baseAtk: 80, baseDef: 80, drop: "stone", tier: "rare" },
  { id: "ogre", name: "Ogre", minLevel: 40, maxLevel: 65, baseHp: 800, baseAtk: 100, baseDef: 50, drop: "monster_bone", tier: "elite" },
  { id: "minotaur", name: "Minotaur", minLevel: 45, maxLevel: 75, baseHp: 1000, baseAtk: 120, baseDef: 60, drop: "leather", tier: "elite" },
  { id: "ghost", name: "Wraith", minLevel: 50, maxLevel: 80, baseHp: 400, baseAtk: 150, baseDef: 0, drop: "magic_core", tier: "rare" },
  { id: "golem", name: "Stone Golem", minLevel: 55, maxLevel: 85, baseHp: 1500, baseAtk: 90, baseDef: 120, drop: "stone", tier: "elite" },
  { id: "succubus", name: "Succubus", minLevel: 60, maxLevel: 90, baseHp: 700, baseAtk: 180, baseDef: 40, drop: "magic_core", tier: "elite" },
  { id: "dullahan", name: "Dullahan", minLevel: 70, maxLevel: 100, baseHp: 1200, baseAtk: 200, baseDef: 100, drop: "iron_ore", tier: "elite" },
  { id: "vampire", name: "Vampire Lord", minLevel: 80, maxLevel: 120, baseHp: 2000, baseAtk: 250, baseDef: 100, drop: "magic_core", tier: "elite" },
  { id: "wyvern", name: "Wyvern", minLevel: 90, maxLevel: 150, baseHp: 2500, baseAtk: 300, baseDef: 150, drop: "diamond", tier: "elite" },
  { id: "dragon", name: "Ancient Dragon", minLevel: 100, maxLevel: 999, baseHp: 5000, baseAtk: 500, baseDef: 300, drop: "dragon_blade", tier: "elite" },
  // More monsters
  { id: "spider", name: "Giant Spider", minLevel: 5, maxLevel: 15, baseHp: 60, baseAtk: 12, baseDef: 4, drop: "leather", tier: "common" },
  { id: "bat", name: "Cave Bat", minLevel: 3, maxLevel: 10, baseHp: 35, baseAtk: 10, baseDef: 2, drop: "monster_bone", tier: "common" },
  { id: "bear", name: "Grizzly Bear", minLevel: 8, maxLevel: 20, baseHp: 120, baseAtk: 22, baseDef: 8, drop: "leather", tier: "common" },
  { id: "scorpion", name: "Desert Scorpion", minLevel: 15, maxLevel: 30, baseHp: 160, baseAtk: 40, baseDef: 20, drop: "monster_bone", tier: "common" },
  { id: "siren", name: "Siren", minLevel: 35, maxLevel: 60, baseHp: 350, baseAtk: 90, baseDef: 25, drop: "magic_core", tier: "rare" },
  { id: "cerberus", name: "Cerberus", minLevel: 50, maxLevel: 80, baseHp: 900, baseAtk: 130, baseDef: 70, drop: "dark_essence", tier: "elite" },
  { id: "lich", name: "Lich King", minLevel: 65, maxLevel: 100, baseHp: 1800, baseAtk: 220, baseDef: 80, drop: "ancient_rune", tier: "elite" },
  { id: "hydra", name: "Hydra", minLevel: 85, maxLevel: 150, baseHp: 3000, baseAtk: 280, baseDef: 200, drop: "dragon_scale", tier: "elite" },
  { id: "kraken", name: "Kraken", minLevel: 95, maxLevel: 200, baseHp: 4000, baseAtk: 350, baseDef: 250, drop: "crystal", tier: "elite" },
  { id: "titan", name: "Ancient Titan", minLevel: 120, maxLevel: 999, baseHp: 8000, baseAtk: 600, baseDef: 400, drop: "ancient_rune", tier: "elite" },
  { id: "reaper", name: "Grim Reaper", minLevel: 150, maxLevel: 999, baseHp: 10000, baseAtk: 800, baseDef: 300, drop: "dark_essence", tier: "elite" },
  { id: "chthulhu", name: "Cthulhu Spawn", minLevel: 300, maxLevel: 999, baseHp: 25000, baseAtk: 1500, baseDef: 800, drop: "void_crystal", tier: "elite" },
  { id: "world_eater", name: "World Eater", minLevel: 500, maxLevel: 999, baseHp: 60000, baseAtk: 3000, baseDef: 1500, drop: "essence_of_chaos", tier: "elite" }
];

const BOSSES = {
  demon_lord: { name: "Demon Lord", baseHp: 10000, baseAtk: 500, baseDef: 300, drop: "dragon_blade", tier: "boss" },
  sea_leviathan: { name: "Leviathan", baseHp: 15000, baseAtk: 400, baseDef: 500, drop: "diamond", tier: "boss" }
};

const PETS = [
  { id: "dog", name: "Loyal Dog", rarity: "common", stats: { maxHp: 50, atk: 5 } },
  { id: "cat", name: "Nimble Cat", rarity: "common", stats: { spd: 10, luck: 5 } },
  { id: "wolf", name: "Fierce Wolf", rarity: "rare", stats: { atk: 20, spd: 10 } },
  { id: "fairy", name: "Healing Fairy", rarity: "rare", stats: { maxHp: 200, maxMana: 50 } },
  { id: "dragon", name: "Baby Dragon", rarity: "epic", stats: { atk: 50, def: 30, maxHp: 100 } },
  { id: "phoenix", name: "Phoenix", rarity: "epic", stats: { maxHp: 500, luck: 20 } }
];

const RECIPES = {
  wooden_sword: { wood: 5 },
  bone_club: { monster_bone: 3, wood: 2 },
  iron_sword: { iron_ore: 5, wood: 2 },
  steel_sword: { iron_ore: 15, wood: 5 },
  silver_lance: { iron_ore: 10, gold_ore: 3 },
  shadow_dagger: { iron_ore: 8, dark_essence: 2, leather: 3 },
  arcane_staff: { wood: 10, magic_core: 3, crystal: 2 },
  mythril_blade: { iron_ore: 20, magic_core: 5, gold_ore: 5 },
  demon_axe: { iron_ore: 30, dark_essence: 5, dragon_scale: 2 },
  celestial_bow: { wood: 15, crystal: 5, ancient_rune: 3 },
  cloth_armor: { leather: 2 },
  leather_armor: { leather: 5, monster_bone: 2 },
  chain_mail: { iron_ore: 8, leather: 3 },
  iron_armor: { iron_ore: 10, leather: 5 },
  steel_plate: { iron_ore: 25, leather: 10, gold_ore: 3 },
  shadow_robe: { leather: 8, dark_essence: 3, magic_core: 2 },
  dragon_armor: { dragon_scale: 5, iron_ore: 20, magic_core: 5 },
  phoenix_armor: { dragon_scale: 8, crystal: 5, ancient_rune: 5 },
  super_potion: { health_potion: 3, slime_gel: 2 },
  antidote: { slime_gel: 3, wheat: 2 },
  enchant_stone: { stone: 10, magic_core: 1, crystal: 1 },
  respec_tome: { ancient_rune: 3, magic_core: 2, crystal: 2 },
  infinity_blade: { mythril_blade: 1, dragon_blade: 1, magic_core: 10, crystal: 20, ancient_rune: 5 },
  void_plate: { dragon_armor: 1, phoenix_armor: 1, dark_essence: 15, crystal: 25, void_crystal: 2 }
};

const LOCATIONS = {
  village: { name: "Village", reqLevel: 1, desc: "Aman, tempat pemula." },
  forest: { name: "Forest", reqLevel: 5, desc: "Hutan lebat." },
  cave: { name: "Dark Cave", reqLevel: 15, desc: "Gua gelap penuh monster." },
  ruins: { name: "Ancient Ruins", reqLevel: 25, desc: "Reruntuhan kuno berbahaya." },
  mountain: { name: "Dragon Mountain", reqLevel: 40, desc: "Gunung berbahaya." }
};

// JOBS replaced by CLASSES from rpg_advanced.js
const JOBS = CLASSES;

const SKILLS = {
  basic_attack: { name: "Basic Attack", mana: 0, stamina: 5, damageMult: 1.0, type: "attack", desc: "Serangan biasa." },
  power_strike: { name: "Power Strike", mana: 0, stamina: 20, damageMult: 1.8, type: "attack", desc: "Serangan fisik kuat." },
  fireball: { name: "Fireball", mana: 30, stamina: 0, damageMult: 2.5, type: "attack", desc: "Bola api membakar musuh." },
  heal: { name: "Heal", mana: 40, stamina: 0, type: "heal", power: 200, desc: "Memulihkan 200 HP." }
};

const LOOTBOXES = {
  wooden_chest: [
    { type: "money", min: 100, max: 500, prob: 0.5 },
    { type: "item", id: "health_potion", qty: 2, prob: 0.3 },
    { type: "item", id: "iron_ore", qty: 3, prob: 0.2 }
  ],
  golden_chest: [
    { type: "money", min: 1000, max: 5000, prob: 0.4 },
    { type: "item", id: "diamond", qty: 1, prob: 0.1 },
    { type: "item", id: "rare_egg", qty: 1, prob: 0.2 },
    { type: "item", id: "enchant_stone", qty: 2, prob: 0.3 }
  ]
};

const STORY_CHAPTERS = {
  1: {
    title: "Kebangkitan di Desa",
    desc: "Desa diserang oleh sekumpulan slime ganas. Kalahkan Slime King!",
    reqLevel: 1,
    boss: { name: "Slime King", hp: 500, atk: 20, def: 5 },
    reward: { money: 1000, item: "wooden_chest", qty: 1 }
  },
  2: {
    title: "Misteri Hutan Terkutuk",
    desc: "Telah lama hutan ini tidak dimasuki orang. Ada serigala raksasa di sana.",
    reqLevel: 10,
    boss: { name: "Alpha Dire Wolf", hp: 1500, atk: 60, def: 20 },
    reward: { money: 3000, exp: 2000, title: "Forest Explorer" }
  }
};

const COOLDOWNS = ADVANCED_COOLDOWNS;

// Global State
let WORLD_STATE = {
  weather: "Cerah",
  event: null,
  lastUpdate: Date.now()
};

function updateWorldState() {
  const now = Date.now();
  if (now - WORLD_STATE.lastUpdate > 4 * 60 * 60 * 1000) {
    const weathers = ["Cerah", "Cerah", "Cerah", "Hujan", "Badai", "Malam Berkabut"];
    WORLD_STATE.weather = weathers[Math.floor(Math.random() * weathers.length)];
    if (Math.random() < 0.2) {
       const events = ["double_exp", "double_money", "boss_invasion"];
       WORLD_STATE.event = events[Math.floor(Math.random() * events.length)];
    } else {
       WORLD_STATE.event = null;
    }
    WORLD_STATE.lastUpdate = now;
  }
}

function checkRegen(user) {
  const now = Date.now();
  const diffMinutes = Math.floor((now - (user.lastRegen || now)) / 60000);
  if (diffMinutes > 0) {
    user.stamina = Math.min(user.maxStamina, user.stamina + (diffMinutes * 5));
    user.mana = Math.min(user.maxMana, user.mana + (diffMinutes * 5));
    user.lastRegen = now;
  }
  return user;
}

function checkCooldown(user, action) {
  const now = Date.now();
  const lastTime = user.cooldowns[action] || 0;
  const cdTime = COOLDOWNS[action] || 0;
  if (now - lastTime < cdTime) {
    const timeLeft = cdTime - (now - lastTime);
    const minutes = Math.floor(timeLeft / 60000);
    const seconds = Math.floor((timeLeft % 60000) / 1000);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) return { onCooldown: true, time: `${hours}h ${minutes%60}m` };
    return { onCooldown: true, time: `${minutes}m ${seconds}s` };
  }
  return { onCooldown: false };
}

function setCooldown(jid, action) {
  const user = getUserRPG(jid);
  user.cooldowns[action] = Date.now();
  updateUserRPG(jid, { cooldowns: user.cooldowns });
}

function getLevelExp(level) {
  // Moderate exponential scaling
  return Math.floor(50 * Math.pow(level, 1.3));
}

function calcTotalStats(user) {
  let total = {
    hp: user.hp || 0, maxHp: user.maxHp || 100, atk: user.atk || 1, def: user.def || 0,
    spd: user.spd || 0, luck: user.luck || 0, mana: user.mana || 0, maxMana: user.maxMana || 0,
    stamina: user.stamina || 0, maxStamina: user.maxStamina || 100
  };

  for (const slot of ['weapon', 'armor', 'accessory']) {
    const eqId = user.equipment[slot];
    if (eqId && ITEMS[eqId] && ITEMS[eqId].stats) {
      const eqStats = ITEMS[eqId].stats;
      const upgradeLevel = user.equipmentUpgrades ? (user.equipmentUpgrades[slot] || 0) : 0;
      const upgradeMultiplier = 1 + (upgradeLevel * 0.1); 
      for (const stat in eqStats) {
        const val = Math.floor(eqStats[stat] * upgradeMultiplier);
        if (total[stat] !== undefined) total[stat] += val;
        if (stat === 'maxHp') total.maxHp += val;
        if (stat === 'maxMana') total.maxMana += val;
      }
    }
  }

  if (user.pet && user.pet.active) {
    const petData = PETS.find(p => p.id === user.pet.active);
    if (petData && petData.stats) {
      for (const stat in petData.stats) {
        if (total[stat] !== undefined) total[stat] += petData.stats[stat];
        if (stat === 'maxHp') total.maxHp += petData.stats[stat];
        if (stat === 'maxMana') total.maxMana += petData.stats[stat];
      }
    }
  }

  // Class bonus (replaces old job bonus)
  if (user.job && CLASSES[user.job]) {
    const cls = CLASSES[user.job];
    for (const stat in cls.bonus) {
        if (total[stat] !== undefined) total[stat] += cls.bonus[stat];
    }
    for (const stat in cls.weakness) {
        if (total[stat] !== undefined) total[stat] += cls.weakness[stat];
    }
  }

  // Skill tree bonuses
  if (user.skillTree) {
    const { SKILL_TREES } = require("./rpg_advanced");
    for (const treeId in user.skillTree) {
      const tree = SKILL_TREES[treeId];
      if (!tree) continue;
      for (const nodeId of user.skillTree[treeId]) {
        const node = tree.nodes.find(n => n.id === nodeId);
        if (node && node.effect) {
          for (const stat in node.effect) {
            if (total[stat] !== undefined) total[stat] += node.effect[stat];
          }
        }
      }
    }
  }

  // Base housing bonus
  if (user.base && user.base.level > 0) {
    const { BASE_LEVELS } = require("./rpg_advanced");
    const baseDef = BASE_LEVELS[user.base.level];
    if (baseDef) total.maxHp += baseDef.regenBonus * 10;
  }

  if (user.rebirth && user.rebirth.count > 0) {
    const rbMult = 1 + (user.rebirth.count * 0.05);
    total.atk = Math.floor(total.atk * rbMult);
    total.def = Math.floor(total.def * rbMult);
    total.maxHp = Math.floor(total.maxHp * rbMult);
  }

  if (user.buffs && user.buffs.length > 0) {
    const now = Date.now();
    user.buffs = user.buffs.filter(b => b.expire > now);
    for (const b of user.buffs) {
       for(const stat in b.effects) {
          if (total[stat] !== undefined) total[stat] += b.effects[stat];
       }
    }
  }

  if (user.activeTitle === "Monster Hunter") total.atk += 10;
  else if (user.activeTitle === "Rich") total.luck += 10;

  if (total.hp > total.maxHp) total.hp = total.maxHp;
  if (total.mana > total.maxMana) total.mana = total.maxMana;

  return total;
}

// -------------------------------------------------------------------
// NEW SYSTEM: COMBAT CALCULATION & MONSTER SPAWNING
// -------------------------------------------------------------------

function generateMonster(playerLevel) {
  // Filter eligible monsters
  const validMobs = MONSTERS_DB.filter(m => playerLevel >= m.minLevel - 2 && playerLevel <= m.maxLevel + 10);
  
  if (validMobs.length === 0) {
    return createScaledMonster(MONSTERS_DB[0], playerLevel);
  }

  const selected = validMobs[Math.floor(Math.random() * validMobs.length)];
  return createScaledMonster(selected, playerLevel);
}

function createScaledMonster(mobTemplate, playerLevel) {
  // Monster level is around player level, clamped by mob template min/max limits loosely
  let mLevel = Math.max(1, playerLevel + Math.floor(Math.random() * 5) - 2);
  
  const mult = 1 + (mLevel * 0.15); // Moderate scaling per level
  
  // Calculate reward scaling (Early 50-150, Mid 200-800, Late 1000+)
  const baseRewardMultiplier = Math.pow(mLevel, 1.2);

  return {
    id: mobTemplate.id,
    name: mobTemplate.name,
    level: mLevel,
    tier: mobTemplate.tier,
    hp: Math.floor(mobTemplate.baseHp * mult),
    maxHp: Math.floor(mobTemplate.baseHp * mult),
    atk: Math.floor(mobTemplate.baseAtk * mult),
    def: Math.floor(mobTemplate.baseDef * mult),
    spd: Math.floor((mobTemplate.baseAtk * 0.2) * mult),
    exp: Math.floor(20 * baseRewardMultiplier),
    money: Math.floor(30 * baseRewardMultiplier),
    drop: mobTemplate.drop,
    dropRate: mobTemplate.tier === "common" ? 0.6 : (mobTemplate.tier === "rare" ? 0.3 : 0.1)
  };
}

function calculateDamage(attackerAtk, defenderDef, attackerLuck, defenderSpd, maxTargetHp, isMonsterAttackingPlayer = false) {
  // BASE DAMAGE: max(1, ATK - (DEF * 0.5))
  let baseDamage = Math.max(1, attackerAtk - (defenderDef * 0.5));
  
  // RNG Fluctuation (0.8x to 1.2x)
  let fluctuation = 0.8 + (Math.random() * 0.4);
  let finalDamage = baseDamage * fluctuation;

  // CRITICAL HIT
  let isCrit = false;
  let critChance = Math.min(0.5, 0.05 + (attackerLuck * 0.005)); // Cap 50%
  if (Math.random() < critChance) {
    isCrit = true;
    finalDamage *= 1.5;
  }

  // DODGE
  let isDodge = false;
  let dodgeChance = Math.min(0.3, 0.02 + (defenderSpd * 0.002)); // Cap 30%
  if (Math.random() < dodgeChance) {
    isDodge = true;
    finalDamage = 0;
  }

  finalDamage = Math.floor(finalDamage);

  // DAMAGE CAP (Safety mechanism): 
  // Monster cannot deal more than 40% of player max HP in a single hit. (Bosses bypass this usually, but we apply it to normal battle)
  if (isMonsterAttackingPlayer && maxTargetHp > 0) {
     const cap = Math.floor(maxTargetHp * 0.4);
     if (finalDamage > cap) finalDamage = cap;
  }

  return { damage: finalDamage, isCrit, isDodge };
}

// -------------------------------------------------------------------

function addExp(jid, amount) {
  const user = getUserRPG(jid);
  updateWorldState();
  
  if (WORLD_STATE.event === "double_exp") amount *= 2;
  if (user.partner) amount = Math.floor(amount * 1.1); 
  
  user.exp += amount;
  let leveledUp = false;
  let reqExp = getLevelExp(user.level);

  while (user.exp >= reqExp && user.level < 999) {
    user.exp -= reqExp;
    user.level += 1;
    user.statPoints += 3;
    
    user.maxHp += 10;
    user.hp = user.maxHp;
    user.atk += 2;
    user.def += 1;
    user.spd += 1;
    user.maxMana += 5;
    user.mana = user.maxMana;
    
    leveledUp = true;
    reqExp = getLevelExp(user.level);
  }
  
  if (user.level >= 999) user.exp = reqExp;

  updateUserRPG(jid, { 
    exp: user.exp, level: user.level, statPoints: user.statPoints,
    hp: user.hp, maxHp: user.maxHp, atk: user.atk, def: user.def,
    spd: user.spd, mana: user.mana, maxMana: user.maxMana
  });

  return { leveledUp, newLevel: user.level };
}

function randomChance(prob, luck = 0) {
  const adjustedProb = prob * (1 + (luck * 0.01)); 
  return Math.random() < adjustedProb;
}

function checkAchievements(jid) {
  const user = getUserRPG(jid);
  let newUnlocks = [];

  const checks = [
    { id: "level_10", name: "Reaching Level 10", cond: () => user.level >= 10, reward: { money: 1000 } },
    { id: "level_50", name: "Reaching Level 50", cond: () => user.level >= 50, reward: { money: 10000, item: "enchant_stone", qty: 1 } },
    { id: "hunter_100", name: "Hunt 100 Monsters", cond: () => user.stats.huntCount >= 100, reward: { title: "Monster Hunter" } },
    { id: "crafter_50", name: "Craft 50 Items", cond: () => user.stats.itemCraft >= 50, reward: { money: 5000 } },
    { id: "dungeon_10", name: "Clear 10 Dungeons", cond: () => user.stats.dungeonClear >= 10, reward: { title: "Dungeon Master" } }
  ];

  for (const check of checks) {
    if (!user.achievements[check.id] && check.cond()) {
      user.achievements[check.id] = true;
      newUnlocks.push(check);
      if (check.reward.money) user.money += check.reward.money;
      if (check.reward.title && !user.titles.includes(check.reward.title)) user.titles.push(check.reward.title);
      if (check.reward.item) {
        user.inventory[check.reward.item] = (user.inventory[check.reward.item] || 0) + check.reward.qty;
      }
    }
  }

  if (newUnlocks.length > 0) {
    updateUserRPG(jid, { achievements: user.achievements, money: user.money, titles: user.titles, inventory: user.inventory });
  }

  return newUnlocks;
}

module.exports = {
  ITEMS, MONSTERS_DB, BOSSES, PETS, RECIPES, COOLDOWNS,
  LOCATIONS, JOBS, SKILLS, LOOTBOXES, STORY_CHAPTERS, WORLD_STATE,
  checkCooldown, setCooldown, getLevelExp, calcTotalStats,
  addExp, randomChance, checkAchievements, checkRegen, updateWorldState,
  generateMonster, calculateDamage, createScaledMonster,
  CLASSES
};
