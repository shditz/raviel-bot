const fs = require("fs").promises;
const fsSync = require("fs");
const path = require("path");
const NodeCache = require("node-cache");
const { Debouncer } = require("../utils/debounce");

const DB_DIR = path.join(__dirname);
const RPG_USERS_FILE = path.join(DB_DIR, "rpg.json");
const GUILDS_FILE = path.join(DB_DIR, "guilds.json");
const MARKET_FILE = path.join(DB_DIR, "rpg_market.json");
const PARTIES_FILE = path.join(DB_DIR, "rpg_parties.json");

const rpgCache = new NodeCache({ stdTTL: 0, checkperiod: 0 });

async function _initializeRpgFiles() {
  try {
    if (!fsSync.existsSync(RPG_USERS_FILE)) await fs.writeFile(RPG_USERS_FILE, "{}", "utf8");
    if (!fsSync.existsSync(GUILDS_FILE)) await fs.writeFile(GUILDS_FILE, "{}", "utf8");
    if (!fsSync.existsSync(MARKET_FILE)) await fs.writeFile(MARKET_FILE, "[]", "utf8");
    if (!fsSync.existsSync(PARTIES_FILE)) await fs.writeFile(PARTIES_FILE, "{}", "utf8");
  } catch (err) {
    console.error("Failed to initialize RPG files:", err.message);
  }
}

async function _loadRpgToCache() {
  try {
    const [rpgData, guildData, marketData, partiesData] = await Promise.all([
      fs.readFile(RPG_USERS_FILE, "utf8"),
      fs.readFile(GUILDS_FILE, "utf8"),
      fs.readFile(MARKET_FILE, "utf8"),
      fs.readFile(PARTIES_FILE, "utf8")
    ]);

    rpgCache.set("users", JSON.parse(rpgData));
    rpgCache.set("guilds", JSON.parse(guildData));
    rpgCache.set("market", JSON.parse(marketData));
    rpgCache.set("parties", JSON.parse(partiesData));
    console.log("✅ Database RPG berhasil dimuat ke memori (Cache)");
  } catch (error) {
    console.error("❌ Gagal memuat database RPG:", error.message);
    rpgCache.set("users", {});
    rpgCache.set("guilds", {});
    rpgCache.set("market", []);
    rpgCache.set("parties", {});
  }
}

async function _saveRpgUsersAsync() {
  try {
    await fs.writeFile(RPG_USERS_FILE, JSON.stringify(rpgCache.get("users") || {}, null, 2), "utf8");
  } catch (err) { console.error("Failed to save RPG users:", err.message); }
}

async function _saveGuildsAsync() {
  try {
    await fs.writeFile(GUILDS_FILE, JSON.stringify(rpgCache.get("guilds") || {}, null, 2), "utf8");
  } catch (err) { console.error("Failed to save Guilds:", err.message); }
}

async function _saveMarketAsync() {
  try {
    await fs.writeFile(MARKET_FILE, JSON.stringify(rpgCache.get("market") || [], null, 2), "utf8");
  } catch (err) { console.error("Failed to save Market:", err.message); }
}

async function _savePartiesAsync() {
  try {
    await fs.writeFile(PARTIES_FILE, JSON.stringify(rpgCache.get("parties") || {}, null, 2), "utf8");
  } catch (err) { console.error("Failed to save Parties:", err.message); }
}

const rpgSaveDebouncer = new Debouncer(_saveRpgUsersAsync, 500);
const guildSaveDebouncer = new Debouncer(_saveGuildsAsync, 500);
const marketSaveDebouncer = new Debouncer(_saveMarketAsync, 500);
const partiesSaveDebouncer = new Debouncer(_savePartiesAsync, 500);

_initializeRpgFiles().then(() => _loadRpgToCache());

function createDefaultRpgUser(jid, name) {
  return {
    id: jid,
    name: name,
    level: 1,
    exp: 0,
    money: 100,
    hp: 100,
    maxHp: 100,
    atk: 10,
    def: 5,
    spd: 5,
    luck: 5,
    mana: 50,
    maxMana: 50,
    stamina: 100,
    maxStamina: 100,
    statPoints: 0,
    inventory: {
      health_potion: 3
    },
    equipment: {
      weapon: null,
      armor: null,
      accessory: null
    },
    equipmentUpgrades: { weapon: 0, armor: 0, accessory: 0 },
    quest: { daily: null, completed: 0, lastClaim: 0 },
    pet: { active: null, list: [] },
    guild: null,
    activeTitle: null,
    titles: ["Beginner"],
    achievements: {},
    cooldowns: {},
    stats: { huntCount: 0, battleWin: 0, itemCraft: 0, dungeonClear: 0, bossKill: 0, arenaWin: 0, questDone: 0 },
    skills: ["basic_attack"],
    location: "village",
    unlockedAreas: ["village", "forest"],
    bank: { money: 0, items: {} },
    collection: { monsters: [], items: [], pets: [], regions: ["village"] },
    rebirth: { count: 0, points: 0 },
    partner: null,
    job: "novice",
    party: null,
    buffs: [],
    storyProgress: { chapter: 1, step: 1 },
    dailyReward: { streak: 0, lastClaim: 0 },
    weeklyReward: { lastClaim: 0 },
    lastRegen: Date.now(),
    // Advanced features
    skillTree: {},
    skillPoints: 0,
    statusEffects: [],
    base: { level: 0, lastIncome: Date.now() },
    codex: { monsters: [], items: [], pets: [], regions: ["village"] },
    luckyStreak: 0,
    antiAbuse: { lastActions: [], warnings: 0 },
    guildWarContrib: 0
  };
}

function getUserRPG(jid, name = "Unknown") {
  const users = rpgCache.get("users") || {};
  if (!users[jid]) {
    users[jid] = createDefaultRpgUser(jid, name);
    rpgCache.set("users", users);
    rpgSaveDebouncer.execute();
  }
  
  // Backward compatibility for all versions
  const u = users[jid];
  if (u.stamina === undefined) u.stamina = 100;
  if (u.maxStamina === undefined) u.maxStamina = 100;
  if (u.location === undefined) {
    u.location = "village";
    u.unlockedAreas = ["village", "forest"];
    u.bank = { money: 0, items: {} };
    u.rebirth = { count: 0, points: 0 };
    u.job = "novice";
    u.skills = ["basic_attack"];
    u.buffs = [];
    u.dailyReward = { streak: 0, lastClaim: 0 };
    u.collection = { monsters: [], items: [], pets: [], regions: ["village"] };
  }
  // v2 advanced features migration
  if (u.skillTree === undefined) u.skillTree = {};
  if (u.skillPoints === undefined) u.skillPoints = 0;
  if (u.statusEffects === undefined) u.statusEffects = [];
  if (u.base === undefined) u.base = { level: 0, lastIncome: Date.now() };
  if (u.codex === undefined) u.codex = { monsters: [], items: [], pets: [], regions: ["village"] };
  if (u.luckyStreak === undefined) u.luckyStreak = 0;
  if (u.antiAbuse === undefined) u.antiAbuse = { lastActions: [], warnings: 0 };
  if (u.guildWarContrib === undefined) u.guildWarContrib = 0;
  if (!u.stats.bossKill) u.stats.bossKill = 0;
  if (!u.stats.arenaWin) u.stats.arenaWin = 0;
  if (!u.stats.questDone) u.stats.questDone = 0;
  if (!u.collection.regions) u.collection.regions = ["village"];
  
  return u;
}

function updateUserRPG(jid, data) {
  const users = rpgCache.get("users") || {};
  if (!users[jid]) return null;
  users[jid] = { ...users[jid], ...data };
  rpgCache.set("users", users);
  rpgSaveDebouncer.execute();
  return users[jid];
}

function updateInventory(jid, itemId, quantity) {
  const user = getUserRPG(jid);
  user.inventory[itemId] = (user.inventory[itemId] || 0) + quantity;
  if (user.inventory[itemId] <= 0) {
    delete user.inventory[itemId];
  }
  updateUserRPG(jid, { inventory: user.inventory });
  return user.inventory;
}

// Guild
function getGuild(id) { const g = rpgCache.get("guilds") || {}; return g[id] || null; }
function createGuild(id, data) { const g = rpgCache.get("guilds") || {}; g[id] = data; rpgCache.set("guilds", g); guildSaveDebouncer.execute(); return g[id]; }
function updateGuild(id, data) { const g = rpgCache.get("guilds") || {}; if(!g[id]) return null; g[id] = {...g[id], ...data}; rpgCache.set("guilds", g); guildSaveDebouncer.execute(); return g[id]; }
function deleteGuild(id) { const g = rpgCache.get("guilds") || {}; delete g[id]; rpgCache.set("guilds", g); guildSaveDebouncer.execute(); }
function getAllGuilds() { return rpgCache.get("guilds") || {}; }

// Market
function getMarket() { return rpgCache.get("market") || []; }
function addMarketItem(data) {
  const m = rpgCache.get("market") || [];
  m.push(data);
  rpgCache.set("market", m);
  marketSaveDebouncer.execute();
}
function removeMarketItem(id) {
  let m = rpgCache.get("market") || [];
  m = m.filter(item => item.id !== id);
  rpgCache.set("market", m);
  marketSaveDebouncer.execute();
}

// Party
function getParty(id) { const p = rpgCache.get("parties") || {}; return p[id] || null; }
function createParty(id, data) { const p = rpgCache.get("parties") || {}; p[id] = data; rpgCache.set("parties", p); partiesSaveDebouncer.execute(); return p[id]; }
function updateParty(id, data) { const p = rpgCache.get("parties") || {}; if(!p[id]) return null; p[id] = {...p[id], ...data}; rpgCache.set("parties", p); partiesSaveDebouncer.execute(); return p[id]; }
function deleteParty(id) { const p = rpgCache.get("parties") || {}; delete p[id]; rpgCache.set("parties", p); partiesSaveDebouncer.execute(); }

function getTopUsersBy(field = "level", limit = 10) {
    const users = rpgCache.get("users") || {};
    return Object.values(users)
        .sort((a, b) => {
           if (field === "rebirth") return (b.rebirth?.count || 0) - (a.rebirth?.count || 0) || b.level - a.level;
           if (field === "money") return b.money - a.money;
           if (field === "huntCount") return (b.stats?.huntCount || 0) - (a.stats?.huntCount || 0);
           if (field === "battleWin") return (b.stats?.battleWin || 0) - (a.stats?.battleWin || 0);
           if (field === "dungeonClear") return (b.stats?.dungeonClear || 0) - (a.stats?.dungeonClear || 0);
           if (field === "bossKill") return (b.stats?.bossKill || 0) - (a.stats?.bossKill || 0);
           if (field === "collection") {
             const aTotal = (a.codex?.monsters?.length||0)+(a.codex?.items?.length||0)+(a.codex?.pets?.length||0);
             const bTotal = (b.codex?.monsters?.length||0)+(b.codex?.items?.length||0)+(b.codex?.pets?.length||0);
             return bTotal - aTotal;
           }
           return b.level - a.level || b.exp - a.exp;
        })
        .slice(0, limit);
}

function getAllUsers() { return rpgCache.get("users") || {}; }

module.exports = {
  getUserRPG, updateUserRPG, updateInventory,
  getGuild, createGuild, updateGuild, deleteGuild, getAllGuilds,
  getMarket, addMarketItem, removeMarketItem,
  getParty, createParty, updateParty, deleteParty,
  getTopUsersBy, getAllUsers
};
