require("dotenv").config();
const path = require("path");
const fs = require("fs");

module.exports = {
  botName: process.env.BOT_NAME || "RAVIEL BOT",
  ownerName: process.env.OWNER_NAME || "ShDitz",
  ownerNumber: "6282268744897",
  prefix: "!",
  botImage: fs.readFileSync(path.join(__dirname, "assets", "image", "menu.jpg")),
  ownerImage: fs.readFileSync(path.join(__dirname, "assets", "image", "owner.jfif")),
  pingImage: fs.readFileSync(path.join(__dirname, "assets", "image", "ping.jfif")),
  speedImage: fs.readFileSync(path.join(__dirname, "assets", "image", "speed.webp")),
  runtimeImage: fs.readFileSync(path.join(__dirname, "assets", "image", "runtime.webp")),
  statusImage: fs.readFileSync(path.join(__dirname, "assets", "image", "status.jfif")),
};
