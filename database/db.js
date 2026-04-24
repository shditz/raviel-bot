const fs = require("fs");
const path = require("path");

const DB_DIR = path.join(__dirname);
const USERS_FILE = path.join(DB_DIR, "users.json");

if (!fs.existsSync(USERS_FILE)) {
  fs.writeFileSync(USERS_FILE, "{}", "utf8");
}

function loadUsers() {
  try {
    return JSON.parse(fs.readFileSync(USERS_FILE, "utf8"));
  } catch {
    return {};
  }
}

function saveUsers(data) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(data, null, 2), "utf8");
}

function getUser(jid) {
  const users = loadUsers();
  return users[jid] || null;
}

function registerUser(jid, name, age) {
  const users = loadUsers();
  users[jid] = {
    name,
    age: parseInt(age),
    registeredAt: new Date().toISOString(),
  };
  saveUsers(users);
  return users[jid];
}

function isRegistered(jid) {
  return !!getUser(jid);
}

module.exports = { loadUsers, saveUsers, getUser, registerUser, isRegistered };
