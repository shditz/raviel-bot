// ============================================
// RAVIEL RPG — ADVANCED SYSTEMS DATA
// ============================================

// --- CLASS SYSTEM (replaces Job) ---
const CLASSES = {
  novice: { name: "Novice", desc: "Pemula tanpa keahlian.", bonus: {}, weakness: {}, passive: null, activityBonus: {} },
  warrior: { name: "Warrior", desc: "Ahli pedang & pertahanan.", bonus: { atk: 30, maxHp: 200, def: 15 }, weakness: { maxMana: -30 }, passive: "rage_chance", activityBonus: { battle: 1.2 } },
  mage: { name: "Mage", desc: "Penguasa sihir elemental.", bonus: { maxMana: 250, atk: 10, luck: 10 }, weakness: { def: -10 }, passive: "mana_regen", activityBonus: { dungeon: 1.2 } },
  assassin: { name: "Assassin", desc: "Pembunuh bayangan.", bonus: { atk: 25, spd: 40, luck: 15 }, weakness: { maxHp: -50, def: -15 }, passive: "crit_boost", activityBonus: { crime: 1.3, hunt: 1.1 } },
  tank: { name: "Tank", desc: "Benteng hidup.", bonus: { maxHp: 400, def: 40 }, weakness: { atk: -10, spd: -15 }, passive: "damage_reduce", activityBonus: { boss: 1.2 } },
  hunter: { name: "Hunter", desc: "Pemburu profesional.", bonus: { atk: 15, spd: 20, luck: 20 }, weakness: { def: -5 }, passive: "drop_boost", activityBonus: { hunt: 1.3, fish: 1.2, wood: 1.2 } },
  healer: { name: "Healer", desc: "Penyembuh suci.", bonus: { maxMana: 200, maxHp: 150 }, weakness: { atk: -15 }, passive: "heal_boost", activityBonus: { dungeon: 1.15 } },
  merchant: { name: "Merchant", desc: "Pedagang ulung.", bonus: { luck: 30 }, weakness: {}, passive: "sell_bonus", activityBonus: { market: 1.2 } },
  miner: { name: "Miner", desc: "Penambang handal.", bonus: { def: 25, maxHp: 100 }, weakness: { spd: -10 }, passive: "mine_boost", activityBonus: { mine: 1.5, farm: 1.2 } },
  necromancer: { name: "Necromancer", desc: "Pemanggil arwah.", bonus: { maxMana: 300, atk: 20 }, weakness: { maxHp: -40, luck: -10 }, passive: "lifesteal", activityBonus: { dungeon: 1.25, story: 1.2 } },
  paladin: { name: "Paladin", desc: "Ksatria suci pelindung.", bonus: { maxHp: 300, def: 30, maxMana: 100 }, weakness: { spd: -20 }, passive: "holy_shield", activityBonus: { boss: 1.3, guildwar: 1.2 } },
  archer: { name: "Archer", desc: "Pemanah jitu.", bonus: { atk: 25, spd: 30, luck: 15 }, weakness: { maxHp: -30, def: -10 }, passive: "multi_shot", activityBonus: { hunt: 1.4, event: 1.2 } }
};

// --- REGIONS ---
const REGIONS = {
  village: { name: "Village", reqLevel: 1, difficulty: 1, desc: "Desa aman untuk pemula.", monsterIds: ["slime", "goblin"], drops: ["wood", "stone"], travelTime: 0 },
  forest: { name: "Enchanted Forest", reqLevel: 3, difficulty: 2, desc: "Hutan lebat penuh misteri.", monsterIds: ["goblin", "wolf", "ent"], drops: ["wood", "leather", "slime_gel"], travelTime: 30000 },
  cave: { name: "Dark Cave", reqLevel: 10, difficulty: 3, desc: "Gua gelap berbahaya.", monsterIds: ["skeleton", "orc", "troll"], drops: ["stone", "iron_ore", "gold_ore"], travelTime: 60000 },
  desert: { name: "Scorching Desert", reqLevel: 18, difficulty: 4, desc: "Gurun panas tanpa ampun.", monsterIds: ["bandit", "lizardman", "dark_mage"], drops: ["gold_ore", "enchant_stone"], travelTime: 90000 },
  mountain: { name: "Dragon Mountain", reqLevel: 30, difficulty: 5, desc: "Gunung naga legendaris.", monsterIds: ["gargoyle", "ogre", "wyvern"], drops: ["iron_ore", "diamond", "magic_core"], travelTime: 120000 },
  ruins: { name: "Ancient Ruins", reqLevel: 25, difficulty: 5, desc: "Reruntuhan kuno mistis.", monsterIds: ["ghost", "dark_mage", "dullahan"], drops: ["magic_core", "enchant_stone"], travelTime: 90000 },
  swamp: { name: "Poison Swamp", reqLevel: 15, difficulty: 3, desc: "Rawa beracun.", monsterIds: ["slime", "lizardman", "harpy"], drops: ["slime_gel", "leather", "monster_bone"], travelTime: 60000 },
  sea: { name: "Abyssal Sea", reqLevel: 40, difficulty: 6, desc: "Lautan dalam penuh bahaya.", monsterIds: ["succubus", "vampire", "dragon"], drops: ["diamond", "magic_core"], travelTime: 150000 },
  city: { name: "Royal City", reqLevel: 20, difficulty: 2, desc: "Kota kerajaan, pusat perdagangan.", monsterIds: [], drops: [], travelTime: 60000 },
  dungeon_gate: { name: "Dungeon Gate", reqLevel: 35, difficulty: 7, desc: "Gerbang menuju kedalaman.", monsterIds: ["golem", "minotaur", "dullahan", "vampire"], drops: ["diamond", "enchant_stone", "magic_core"], travelTime: 120000 },
  sky_islands: { name: "Sky Islands", reqLevel: 60, difficulty: 8, desc: "Pulau melayang di atas awan.", monsterIds: ["wyvern", "harpy", "titan"], drops: ["crystal", "ancient_rune"], travelTime: 180000 },
  hell_gate: { name: "Hell Gate", reqLevel: 100, difficulty: 9, desc: "Gerbang neraka yang membara.", monsterIds: ["cerberus", "lich", "reaper"], drops: ["dark_essence", "void_crystal"], travelTime: 240000 },
  void_dimension: { name: "Void Dimension", reqLevel: 200, difficulty: 10, desc: "Dimensi kehampaan abadi.", monsterIds: ["chthulhu", "world_eater"], drops: ["void_crystal", "essence_of_chaos"], travelTime: 300000 }
};

// --- STATUS EFFECTS ---
const STATUS_EFFECTS = {
  burn: { name: "🔥 Burn", type: "debuff", dmgPerTurn: 0.05, duration: 3, stackable: false, desc: "Terbakar, kehilangan 5% HP per turn" },
  poison: { name: "☠️ Poison", type: "debuff", dmgPerTurn: 0.03, duration: 5, stackable: true, maxStack: 3, desc: "Keracunan, kehilangan 3% HP per turn" },
  stun: { name: "⚡ Stun", type: "debuff", skipTurn: true, duration: 1, stackable: false, desc: "Terpaku, melewatkan 1 turn" },
  freeze: { name: "❄️ Freeze", type: "debuff", spdReduction: 0.5, duration: 2, stackable: false, desc: "Membeku, SPD -50% selama 2 turn" },
  slow: { name: "🐌 Slow", type: "debuff", spdReduction: 0.3, duration: 3, stackable: false, desc: "Melambat, SPD -30% selama 3 turn" },
  blind: { name: "🌑 Blind", type: "debuff", missChance: 0.4, duration: 2, stackable: false, desc: "Buta, 40% serangan meleset" },
  shield: { name: "🛡️ Shield", type: "buff", dmgReduction: 0.3, duration: 3, stackable: false, desc: "Pelindung, damage -30% selama 3 turn" },
  rage: { name: "💢 Rage", type: "buff", atkBoost: 0.5, defReduction: 0.2, duration: 3, stackable: false, desc: "Mengamuk, ATK +50% DEF -20%" },
  regen: { name: "💚 Regen", type: "buff", healPerTurn: 0.05, duration: 4, stackable: false, desc: "Regenerasi, pulihkan 5% HP per turn" }
};

// --- SKILL TREE / BUILD ---
const SKILL_TREES = {
  warrior: { name: "Path of Blade", nodes: [
    { id: "w1", name: "Iron Will", cost: 1, effect: { maxHp: 50 }, req: null },
    { id: "w2", name: "Heavy Strike", cost: 2, effect: { atk: 15 }, req: "w1" },
    { id: "w3", name: "Berserker", cost: 3, effect: { atk: 30, def: -10 }, req: "w2" },
    { id: "w4", name: "Fortress", cost: 4, effect: { def: 40, maxHp: 100 }, req: "w3" }
  ]},
  assassin: { name: "Shadow Path", nodes: [
    { id: "a1", name: "Quick Step", cost: 1, effect: { spd: 15 }, req: null },
    { id: "a2", name: "Backstab", cost: 2, effect: { atk: 20, luck: 5 }, req: "a1" },
    { id: "a3", name: "Shadow Dance", cost: 3, effect: { spd: 30, luck: 10 }, req: "a2" },
    { id: "a4", name: "Death Mark", cost: 4, effect: { atk: 40 }, req: "a3" }
  ]},
  tank: { name: "Bulwark Path", nodes: [
    { id: "t1", name: "Thick Skin", cost: 1, effect: { def: 15 }, req: null },
    { id: "t2", name: "Stone Wall", cost: 2, effect: { def: 20, maxHp: 80 }, req: "t1" },
    { id: "t3", name: "Unyielding", cost: 3, effect: { maxHp: 200 }, req: "t2" },
    { id: "t4", name: "Titan Guard", cost: 4, effect: { def: 50, maxHp: 150 }, req: "t3" }
  ]},
  mage: { name: "Arcane Path", nodes: [
    { id: "m1", name: "Mana Flow", cost: 1, effect: { maxMana: 50 }, req: null },
    { id: "m2", name: "Arcane Power", cost: 2, effect: { atk: 15, maxMana: 30 }, req: "m1" },
    { id: "m3", name: "Elemental Mastery", cost: 3, effect: { atk: 25, luck: 10 }, req: "m2" },
    { id: "m4", name: "Meteor Storm", cost: 4, effect: { atk: 50 }, req: "m3" }
  ]},
  hunter: { name: "Ranger Path", nodes: [
    { id: "h1", name: "Eagle Eye", cost: 1, effect: { luck: 10 }, req: null },
    { id: "h2", name: "Trap Master", cost: 2, effect: { atk: 10, luck: 10 }, req: "h1" },
    { id: "h3", name: "Wild Instinct", cost: 3, effect: { spd: 20, luck: 15 }, req: "h2" },
    { id: "h4", name: "Perfect Shot", cost: 4, effect: { atk: 35, luck: 20 }, req: "h3" }
  ]},
  support: { name: "Holy Path", nodes: [
    { id: "s1", name: "Blessing", cost: 1, effect: { maxHp: 30, maxMana: 30 }, req: null },
    { id: "s2", name: "Divine Shield", cost: 2, effect: { def: 15, maxHp: 50 }, req: "s1" },
    { id: "s3", name: "Restoration", cost: 3, effect: { maxHp: 100, maxMana: 60 }, req: "s2" },
    { id: "s4", name: "Miracle", cost: 4, effect: { maxHp: 150, def: 25, luck: 15 }, req: "s3" }
  ]}
};

// --- WORLD EVENTS ---
const WORLD_EVENTS_LIST = [
  { id: "double_exp", name: "🌟 Double EXP Festival", desc: "Semua EXP x2!", duration: 4 * 3600000, effect: { expMult: 2 } },
  { id: "double_money", name: "💰 Gold Rush", desc: "Semua Gold x2!", duration: 4 * 3600000, effect: { moneyMult: 2 } },
  { id: "rare_drop", name: "🍀 Rare Drop Boost", desc: "Drop rate naik 50%!", duration: 3 * 3600000, effect: { dropMult: 1.5 } },
  { id: "boss_invasion", name: "👹 Boss Invasion", desc: "Boss muncul di mana-mana!", duration: 2 * 3600000, effect: { bossSpawn: true } },
  { id: "treasure_rain", name: "🎁 Treasure Rain", desc: "Peti harta muncul di mana-mana!", duration: 2 * 3600000, effect: { treasureChance: 0.3 } },
  { id: "guild_season", name: "⚔️ Guild War Season", desc: "Poin guild war x2!", duration: 6 * 3600000, effect: { guildWarMult: 2 } },
  { id: "craft_bonus", name: "🔨 Master Crafter", desc: "Crafting gratis material 1x!", duration: 3 * 3600000, effect: { craftDiscount: true } },
  { id: "heal_spring", name: "💧 Healing Spring", desc: "HP/Mana regen x3!", duration: 4 * 3600000, effect: { regenMult: 3 } }
];

// --- AI BEHAVIORS (for bosses/elites) ---
function getAIAction(enemy, enemyHp, enemyMaxHp, turn) {
  const hpPercent = enemyHp / enemyMaxHp;
  if (hpPercent < 0.15 && turn > 2) return { action: "rage", desc: "mengamuk dengan kekuatan penuh", atkMult: 2.0, defMult: 0.5 };
  if (hpPercent < 0.3 && Math.random() < 0.5) return { action: "heal", desc: "memulihkan diri", healPercent: 0.15 };
  if (turn === 1 && Math.random() < 0.6) return { action: "buff", desc: "memperkuat diri", atkMult: 1.3, duration: 2 };
  if (Math.random() < 0.15) return { action: "skill", desc: "menggunakan skill spesial", atkMult: 1.8, effect: "burn" };
  return { action: "attack", desc: "menyerang", atkMult: 1.0 };
}

// --- BASE / HOUSING ---
const BASE_LEVELS = [
  { level: 0, name: "Tanah Kosong", cost: 0, storage: 0, passiveIncome: 0, regenBonus: 0, craftBonus: 0 },
  { level: 1, name: "Tenda Kecil", cost: 2000, storage: 10, passiveIncome: 50, regenBonus: 1, craftBonus: 0 },
  { level: 2, name: "Gubuk Kayu", cost: 5000, storage: 20, passiveIncome: 100, regenBonus: 2, craftBonus: 0.05 },
  { level: 3, name: "Rumah Batu", cost: 15000, storage: 40, passiveIncome: 250, regenBonus: 3, craftBonus: 0.1 },
  { level: 4, name: "Rumah Besar", cost: 40000, storage: 60, passiveIncome: 500, regenBonus: 5, craftBonus: 0.15 },
  { level: 5, name: "Mansion", cost: 100000, storage: 100, passiveIncome: 1000, regenBonus: 8, craftBonus: 0.2 },
  { level: 6, name: "Kastil", cost: 250000, storage: 150, passiveIncome: 2000, regenBonus: 10, craftBonus: 0.25 }
];

// --- ANTI-ABUSE ---
const ABUSE_LIMITS = {
  maxActionsPerMinute: 8,
  maxMarketListings: 5,
  minMarketPrice: 10,
  maxMarketPrice: 999999
};

// --- EXTENDED COOLDOWNS ---
const ADVANCED_COOLDOWNS = {
  hunt: 45 * 1000,
  mine: 2 * 60 * 1000,
  fish: 2 * 60 * 1000,
  farm: 2 * 60 * 1000,
  wood: 2 * 60 * 1000,
  battle: 90 * 1000,
  crime: 10 * 60 * 1000,
  dungeon: 20 * 60 * 1000,
  boss: 6 * 60 * 60 * 1000,
  arena: 10 * 60 * 1000,
  daily_quest: 24 * 60 * 60 * 1000,
  guildwar: 30 * 60 * 1000,
  auction_sell: 5 * 60 * 1000,
  auction_buy: 60 * 1000,
  travel: 30 * 1000,
  respec: 60 * 60 * 1000,
  changeclass: 24 * 60 * 60 * 1000,
  fortune: 30 * 60 * 1000,
  upgradebase: 10 * 60 * 1000,
  event_join: 5 * 60 * 1000,
  story: 5 * 60 * 1000
};

// --- COOLDOWN LABELS ---
const COOLDOWN_LABELS = {
  hunt: "⚔️ Berburu", mine: "⛏️ Menambang", fish: "🎣 Memancing", farm: "🌾 Bertani",
  wood: "🪓 Menebang", battle: "🗡️ Battle", crime: "🕵️ Crime", dungeon: "🏰 Dungeon",
  boss: "👹 Boss", arena: "🏟️ Arena", daily_quest: "📜 Daily Quest", guildwar: "⚔️ Guild War",
  auction_sell: "🏪 Jual Market", auction_buy: "🛒 Beli Market", travel: "🗺️ Travel",
  respec: "🔄 Respec", changeclass: "🎭 Ganti Class", fortune: "🔮 Fortune",
  upgradebase: "🏠 Upgrade Base", event_join: "🎉 Join Event", story: "📖 Story"
};

// --- HELPER: Format cooldown ---
function formatCooldown(ms) {
  if (ms <= 0) return "Siap!";
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  if (h > 0) return `${h}j ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

// --- HELPER: Get all active cooldowns for a user ---
function getAllActiveCooldowns(userRPG) {
  const now = Date.now();
  const active = [];
  for (const action in userRPG.cooldowns) {
    const lastTime = userRPG.cooldowns[action];
    const cdTime = ADVANCED_COOLDOWNS[action] || 0;
    const timeLeft = cdTime - (now - lastTime);
    if (timeLeft > 0) {
      active.push({
        action,
        label: COOLDOWN_LABELS[action] || action,
        timeLeft,
        formatted: formatCooldown(timeLeft),
        readyAt: new Date(lastTime + cdTime).toLocaleTimeString("id-ID")
      });
    }
  }
  return active;
}

// --- HELPER: Check anti-abuse ---
function checkAntiAbuse(userRPG, action) {
  if (!userRPG.antiAbuse) userRPG.antiAbuse = { lastActions: [], warnings: 0 };
  const now = Date.now();
  userRPG.antiAbuse.lastActions = userRPG.antiAbuse.lastActions.filter(a => now - a.time < 60000);
  const recentCount = userRPG.antiAbuse.lastActions.length;
  if (recentCount >= ABUSE_LIMITS.maxActionsPerMinute) {
    userRPG.antiAbuse.warnings += 1;
    return { blocked: true, reason: "Terlalu banyak aksi dalam 1 menit! Tunggu sebentar." };
  }
  userRPG.antiAbuse.lastActions.push({ action, time: now });
  return { blocked: false };
}

// --- HELPER: Apply status effect in combat ---
function applyStatusEffects(combatEffects, hp, maxHp, atk, def, spd) {
  let totalDmg = 0, skipTurn = false, missChance = 0;
  let modAtk = atk, modDef = def, modSpd = spd, healAmt = 0;
  const logs = [];

  for (const eff of combatEffects) {
    const def_e = STATUS_EFFECTS[eff.id];
    if (!def_e) continue;
    if (def_e.dmgPerTurn) { const d = Math.floor(maxHp * def_e.dmgPerTurn * (eff.stacks || 1)); totalDmg += d; logs.push(`${def_e.name}: -${d} HP`); }
    if (def_e.healPerTurn) { const h = Math.floor(maxHp * def_e.healPerTurn); healAmt += h; logs.push(`${def_e.name}: +${h} HP`); }
    if (def_e.skipTurn) { skipTurn = true; logs.push(`${def_e.name}: Skip turn!`); }
    if (def_e.spdReduction) { modSpd = Math.floor(modSpd * (1 - def_e.spdReduction)); }
    if (def_e.missChance) { missChance = def_e.missChance; }
    if (def_e.dmgReduction) { modDef = Math.floor(modDef * (1 + def_e.dmgReduction)); }
    if (def_e.atkBoost) { modAtk = Math.floor(modAtk * (1 + def_e.atkBoost)); }
    if (def_e.defReduction) { modDef = Math.floor(modDef * (1 - def_e.defReduction)); }
    eff.turnsLeft = (eff.turnsLeft || def_e.duration) - 1;
  }

  return { totalDmg, skipTurn, missChance, modAtk, modDef, modSpd, healAmt, logs, remaining: combatEffects.filter(e => e.turnsLeft > 0) };
}

module.exports = {
  CLASSES, REGIONS, STATUS_EFFECTS, SKILL_TREES, WORLD_EVENTS_LIST,
  BASE_LEVELS, ABUSE_LIMITS, ADVANCED_COOLDOWNS, COOLDOWN_LABELS,
  getAIAction, formatCooldown, getAllActiveCooldowns,
  checkAntiAbuse, applyStatusEffects
};
