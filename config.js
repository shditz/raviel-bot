require("dotenv").config();
const path = require("path");
const fs = require("fs");

module.exports = {
  botName: process.env.BOT_NAME || "RAVIEL BOT",
  ownerName: process.env.OWNER_NAME || "ShDitz",
  ownerNumber: "6282268744897",
  prefix: "!",
  botImage: fs.readFileSync(path.join(__dirname, "assets", "image", "menu.jpg")),
};
