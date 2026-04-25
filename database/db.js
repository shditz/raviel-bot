const fs = require("fs").promises;
const fsSync = require("fs");
const path = require("path");
const NodeCache = require("node-cache");
const {Debouncer} = require("../utils/debounce");

const DB_DIR = path.join(__dirname);
const USERS_FILE = path.join(DB_DIR, "users.json");
const GROUPS_FILE = path.join(DB_DIR, "groups.json");
const WHITELIST_FILE = path.join(DB_DIR, "whitelist.json");
const SETTINGS_FILE = path.join(DB_DIR, "settings.json");

const dbCache = new NodeCache({stdTTL: 0, checkperiod: 0});

async function _initializeFiles() {
  try {
    if (!fsSync.existsSync(USERS_FILE)) {
      await fs.writeFile(USERS_FILE, "{}", "utf8");
    }
    if (!fsSync.existsSync(GROUPS_FILE)) {
      await fs.writeFile(GROUPS_FILE, "{}", "utf8");
    }
    if (!fsSync.existsSync(WHITELIST_FILE)) {
      await fs.writeFile(WHITELIST_FILE, JSON.stringify({enabled: false, groups: []}), "utf8");
    }
    if (!fsSync.existsSync(SETTINGS_FILE)) {
      await fs.writeFile(SETTINGS_FILE, JSON.stringify({botMode: "all", maintenance: false, prefix: "!"}), "utf8");
    }
  } catch (err) {
    console.error("Failed to initialize files:", err.message);
  }
}
async function _loadToCache() {
  try {
    const [usersData, groupsData, whitelistData, settingsData] = await Promise.all([
      fs.readFile(USERS_FILE, "utf8"),
      fs.readFile(GROUPS_FILE, "utf8"),
      fs.readFile(WHITELIST_FILE, "utf8"),
      fs.readFile(SETTINGS_FILE, "utf8"),
    ]);

    const users = JSON.parse(usersData);
    const groups = JSON.parse(groupsData);
    const whitelist = JSON.parse(whitelistData);
    const settings = JSON.parse(settingsData);

    dbCache.set("users", users);
    dbCache.set("groups", groups);
    dbCache.set("whitelist", whitelist);
    dbCache.set("settings", settings);
    console.log("✅ Database berhasil dimuat ke memori (Cache)");
  } catch (error) {
    console.error("❌ Gagal memuat database:", error.message);
    dbCache.set("users", {});
    dbCache.set("groups", {});
    dbCache.set("whitelist", {enabled: false, groups: []});
    dbCache.set("settings", {botMode: "all", maintenance: false, prefix: "!"});
  }
}

async function _saveUsersAsync() {
  try {
    const users = dbCache.get("users") || {};
    await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2), "utf8");
  } catch (err) {
    console.error("Failed to save users:", err.message);
  }
}

async function _saveGroupsAsync() {
  try {
    const groups = dbCache.get("groups") || {};
    await fs.writeFile(GROUPS_FILE, JSON.stringify(groups, null, 2), "utf8");
  } catch (err) {
    console.error("Failed to save groups:", err.message);
  }
}

async function _saveWhitelistAsync() {
  try {
    const whitelist = dbCache.get("whitelist") || {enabled: false, groups: []};
    await fs.writeFile(WHITELIST_FILE, JSON.stringify(whitelist, null, 2), "utf8");
  } catch (err) {
    console.error("Failed to save whitelist:", err.message);
  }
}

async function _saveSettingsAsync() {
  try {
    const settings = dbCache.get("settings") || {botMode: "all", maintenance: false, prefix: "!"};
    await fs.writeFile(SETTINGS_FILE, JSON.stringify(settings, null, 2), "utf8");
  } catch (err) {
    console.error("Failed to save settings:", err.message);
  }
}

const userSaveDebouncer = new Debouncer(_saveUsersAsync, 500);
const groupSaveDebouncer = new Debouncer(_saveGroupsAsync, 500);
const whitelistSaveDebouncer = new Debouncer(_saveWhitelistAsync, 500);
const settingsSaveDebouncer = new Debouncer(_saveSettingsAsync, 500);

_initializeFiles().then(() => _loadToCache());

function getUser(jid) {
  const users = dbCache.get("users") || {};
  return users[jid] || null;
}

function registerUser(jid, name, age) {
  const users = dbCache.get("users") || {};
  users[jid] = {
    name,
    age: parseInt(age),
    registeredAt: new Date().toISOString(),
  };
  dbCache.set("users", users); 

  userSaveDebouncer.execute();

  return users[jid];
}

function isRegistered(jid) {
  return !!getUser(jid);
}

function addWarn(jid) {
  const users = dbCache.get("users") || {};
  if (!users[jid]) return 0;
  users[jid].warn = (users[jid].warn || 0) + 1;
  dbCache.set("users", users);
  userSaveDebouncer.execute();
  return users[jid].warn;
}

function resetWarn(jid) {
  const users = dbCache.get("users") || {};
  if (users[jid]) {
    users[jid].warn = 0;
    dbCache.set("users", users);
    userSaveDebouncer.execute();
  }
}

function banUser(jid) {
  const users = dbCache.get("users") || {};
  if (!users[jid]) {
    users[jid] = {
      name: "Banned User",
      registeredAt: new Date().toISOString(),
    };
  }
  users[jid].isBanned = true;
  dbCache.set("users", users);
  userSaveDebouncer.execute();
}

function unbanUser(jid) {
  const users = dbCache.get("users") || {};
  if (users[jid]) {
    users[jid].isBanned = false;
    dbCache.set("users", users);
    userSaveDebouncer.execute();
  }
}

function isBanned(jid) {
  const users = dbCache.get("users") || {};
  return !!users[jid]?.isBanned || !!users[jid]?.isBlacklist;
}

function setBlacklist(jid, status = true) {
  const users = dbCache.get("users") || {};
  if (!users[jid]) {
    users[jid] = {
      name: "Blacklisted",
      registeredAt: new Date().toISOString(),
    };
  }
  users[jid].isBlacklist = status;
  dbCache.set("users", users);
  userSaveDebouncer.execute();
}

function getGroup(jid) {
  const groups = dbCache.get("groups") || {};
  return groups[jid] || null;
}

function updateGroup(jid, data) {
  const groups = dbCache.get("groups") || {};
  if (!groups[jid]) {
    groups[jid] = {};
  }

  groups[jid] = {...groups[jid], ...data};
  dbCache.set("groups", groups); 
  groupSaveDebouncer.execute();
  return groups[jid];
}

function getTotalUsers() {
  const users = dbCache.get("users") || {};
  return Object.keys(users).length;
}

function getTotalGroups() {
  const groups = dbCache.get("groups") || {};
  return Object.keys(groups).length;
}

function checkRemoveBgLimit(jid) {
  const users = dbCache.get("users") || {};
  if (!users[jid]) return false; 

  const today = new Date().toISOString().split("T")[0]; 
  if (users[jid].lastRemoveBg === today) {
    return false; 
  }

  users[jid].lastRemoveBg = today;
  dbCache.set("users", users);
  userSaveDebouncer.execute();
  return true; 
}

function isWhitelistEnabled() {
  const whitelist = dbCache.get("whitelist") || {enabled: false, groups: []};
  return whitelist.enabled;
}

function enableWhitelist() {
  const whitelist = dbCache.get("whitelist") || {enabled: false, groups: []};
  whitelist.enabled = true;
  dbCache.set("whitelist", whitelist);
  whitelistSaveDebouncer.execute();
  return true;
}

function disableWhitelist() {
  const whitelist = dbCache.get("whitelist") || {enabled: false, groups: []};
  whitelist.enabled = false;
  dbCache.set("whitelist", whitelist);
  whitelistSaveDebouncer.execute();
  return true;
}

function addToWhitelist(jid) {
  const whitelist = dbCache.get("whitelist") || {enabled: false, groups: []};
  if (!whitelist.groups.includes(jid)) {
    whitelist.groups.push(jid);
    dbCache.set("whitelist", whitelist);
    whitelistSaveDebouncer.execute();
  }
  return whitelist;
}

function removeFromWhitelist(jid) {
  const whitelist = dbCache.get("whitelist") || {enabled: false, groups: []};
  whitelist.groups = whitelist.groups.filter((g) => g !== jid);
  dbCache.set("whitelist", whitelist);
  whitelistSaveDebouncer.execute();
  return whitelist;
}

function isGroupWhitelisted(jid) {
  const whitelist = dbCache.get("whitelist") || {enabled: false, groups: []};
  if (!whitelist.enabled) return true; 
  return whitelist.groups.includes(jid);
}

function getWhitelistGroups() {
  const whitelist = dbCache.get("whitelist") || {enabled: false, groups: []};
  return whitelist;
}

function getBotMode() {
  const settings = dbCache.get("settings") || {botMode: "all"};
  return settings.botMode; 
}

function setBotMode(mode) {
  if (mode !== "all" && mode !== "group") {
    throw new Error("Mode harus 'all' atau 'group'");
  }
  const settings = dbCache.get("settings") || {botMode: "all"};
  settings.botMode = mode;
  dbCache.set("settings", settings);
  settingsSaveDebouncer.execute();
  return settings;
}

function isBotAllowedInDM() {
  return getBotMode() === "all";
}

function getSettings() {
  return dbCache.get("settings") || {botMode: "all", maintenance: false, prefix: "!"};
}

function updateSettings(data) {
  const settings = dbCache.get("settings") || {botMode: "all", maintenance: false, prefix: "!"};
  Object.assign(settings, data);
  dbCache.set("settings", settings);
  settingsSaveDebouncer.execute();
  return settings;
}

function isMaintenance() {
  const settings = getSettings();
  return !!settings.maintenance;
}

function flushAllDebouncers() {
  userSaveDebouncer.flush();
  groupSaveDebouncer.flush();
  whitelistSaveDebouncer.flush();
  settingsSaveDebouncer.flush();
}

module.exports = {
  getUser,
  registerUser,
  isRegistered,
  addWarn,
  resetWarn,
  getGroup,
  updateGroup,
  getTotalUsers,
  getTotalGroups,
  checkRemoveBgLimit,
  isWhitelistEnabled,
  enableWhitelist,
  disableWhitelist,
  addToWhitelist,
  removeFromWhitelist,
  isGroupWhitelisted,
  getWhitelistGroups,
  getBotMode,
  setBotMode,
  isBotAllowedInDM,
  getSettings,
  updateSettings,
  isMaintenance,
  banUser,
  unbanUser,
  isBanned,
  setBlacklist,
  flushAllDebouncers,
};
