const axios = require("axios");
const fs = require("fs");
const path = require("path");

const TMP_DIR = path.join(__dirname, "tmp");
if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, {recursive: true});

async function streamUrlToTemp(url, ext = "jpg") {
  const res = await axios.get(url, {responseType: "stream"});
  const filename = `${Date.now()}.${ext}`;
  const filePath = path.join(TMP_DIR, filename);
  const ws = fs.createWriteStream(filePath);
  res.data.pipe(ws);
  await new Promise((ok, no) => {
    ws.on("finish", ok);
    ws.on("error", no);
  });
  return filePath;
}

module.exports = {streamUrlToTemp, TMP_DIR};
