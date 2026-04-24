const fs = require("fs");
const path = require("path");
const NodeCache = require("node-cache");

const DB_DIR = path.join(__dirname);
const USERS_FILE = path.join(DB_DIR, "users.json");
const GROUPS_FILE = path.join(DB_DIR, "groups.json");

// Inisialisasi Cache dengan TTL 0 (tidak pernah kadaluarsa)
const dbCache = new NodeCache({ stdTTL: 0, checkperiod: 0 });

// === Inisialisasi File Database ===
if (!fs.existsSync(USERS_FILE)) {
  fs.writeFileSync(USERS_FILE, "{}", "utf8");
}
if (!fs.existsSync(GROUPS_FILE)) {
  fs.writeFileSync(GROUPS_FILE, "{}", "utf8");
}

// === Fungsi Internal (Load ke Cache) ===
function _loadToCache() {
  try {
    const users = JSON.parse(fs.readFileSync(USERS_FILE, "utf8"));
    const groups = JSON.parse(fs.readFileSync(GROUPS_FILE, "utf8"));
    
    dbCache.set("users", users);
    dbCache.set("groups", groups);
    console.log("✅ Database berhasil dimuat ke memori (Cache)");
  } catch (error) {
    console.error("❌ Gagal memuat database:", error);
    dbCache.set("users", {});
    dbCache.set("groups", {});
  }
}

// === Fungsi Internal (Save dari Cache ke Disk) ===
function _saveUsers() {
  const users = dbCache.get("users") || {};
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf8");
}

function _saveGroups() {
  const groups = dbCache.get("groups") || {};
  fs.writeFileSync(GROUPS_FILE, JSON.stringify(groups, null, 2), "utf8");
}

// Muat data saat file db.js pertama kali dipanggil
_loadToCache();

// === USER API ===
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
  dbCache.set("users", users); // Update Cache
  
  // Tulis ke disk secara asynchronous agar tidak memblokir event loop
  setTimeout(_saveUsers, 0); 
  
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
  setTimeout(_saveUsers, 0);
  return users[jid].warn;
}

function resetWarn(jid) {
  const users = dbCache.get("users") || {};
  if (users[jid]) {
    users[jid].warn = 0;
    dbCache.set("users", users);
    setTimeout(_saveUsers, 0);
  }
}

// === GROUP API ===
function getGroup(jid) {
  const groups = dbCache.get("groups") || {};
  return groups[jid] || null;
}

function updateGroup(jid, data) {
  const groups = dbCache.get("groups") || {};
  if (!groups[jid]) {
    groups[jid] = {};
  }
  
  groups[jid] = { ...groups[jid], ...data };
  dbCache.set("groups", groups); // Update Cache
  
  setTimeout(_saveGroups, 0);
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
  if (!users[jid]) return false; // Harus terdaftar dulu

  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  if (users[jid].lastRemoveBg === today) {
    return false; // Sudah dipakai hari ini
  }

  // Update tanggal
  users[jid].lastRemoveBg = today;
  dbCache.set("users", users);
  setTimeout(_saveUsers, 0);
  return true; // Boleh pakai
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
  checkRemoveBgLimit
};
