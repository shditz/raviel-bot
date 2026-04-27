// This file now redirects to rpg_class.js (Class System replaced Job System)
const rpgClass = require("./rpg_class");

module.exports = {
  name: "job_legacy",
  aliases: [],
  execute: rpgClass.execute
};
