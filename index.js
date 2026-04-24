const fs = require("fs");
const path = require("path");
const ffmpeg = require("ffmpeg-static");
process.env.FFMPEG_PATH = ffmpeg;
const pino = require("pino");
const {
  default: makeWASocket,
  DisconnectReason,
  delay,
  useMultiFileAuthState,
  makeCacheableSignalKeyStore,
  makeInMemoryStore,
  Browsers,
} = require("lilys-baileys");
const config = require("./config");
const { sendMenuWithImage } = require("./handlers/menu");
const { getUser, registerUser, isRegistered, getGroup, updateGroup, addWarn, resetWarn, getTotalUsers, getTotalGroups } = require("./database/db");
const { normalizeJid, isAdmin } = require("./utils/jid");
const canvafy = require("canvafy");

const commands = new Map();
const commandFiles = fs.readdirSync(path.join(__dirname, "commands")).filter(f => f.endsWith(".js"));
for (const file of commandFiles) {
  const cmd = require(`./commands/${file}`);
  commands.set(cmd.name, cmd);
}

const AUTH_DIR = path.join(__dirname, "auth");
if (!fs.existsSync(AUTH_DIR)) fs.mkdirSync(AUTH_DIR, { recursive: true });

// Gunakan logger fatal agar terminal benar-benar bersih dari log internal baileys yang tidak penting
const logger = pino({ level: "fatal" });
const PREFIX = config.prefix;

// Inisialisasi in-memory store untuk caching Baileys (mempercepat bot)
const store = makeInMemoryStore({ logger: pino().child({ level: "silent", stream: "store" }) });
store.readFromFile("./auth/baileys_store_multi.json");
setInterval(() => {
  store.writeToFile("./auth/baileys_store_multi.json");
}, 10_000);

const _origError = console.error;
const _origWarn = console.warn;
const _origLog = console.log;
const _origInfo = console.info;
const _origDebug = console.debug;

const filterLog = (origFunc, args) => {
  const s = String(args.join(" ")).toLowerCase();
  if (
    s.includes("newsletter") ||
    s.includes("closing open session") ||
    s.includes("closing session") ||
    s.includes("sessionentry") ||
    s.includes("failed to decrypt") ||
    s.includes("bad mac") ||
    s.includes("session error") ||
    s.includes("timed out")
  ) {
    return;
  }
  origFunc.apply(console, args);
};

console.log = (...args) => filterLog(_origLog, args);
console.info = (...args) => filterLog(_origInfo || _origLog, args);
console.debug = (...args) => filterLog(_origDebug || _origLog, args);
console.error = (...args) => filterLog(_origError, args);
console.warn = (...args) => filterLog(_origWarn, args);

process.on("uncaughtException", (err) => {
  if (err.message?.includes("Bad MAC")) return;
  _origError("⚠️ Uncaught Exception:", err.message);
});
process.on("unhandledRejection", (err) => {
  if (err?.message?.includes("Bad MAC")) return;
  _origError("⚠️ Unhandled Rejection:", err?.message || err);
});


function extractText(msg) {
  if (!msg) return "";

  const unwrap = (m) =>
    m?.ephemeralMessage?.message ||
    m?.viewOnceMessage?.message ||
    m?.viewOnceMessageV2?.message ||
    m?.viewOnceMessageV2Extension?.message ||
    m?.documentWithCaptionMessage?.message ||
    m?.editedMessage?.message ||
    null;

  let content = msg;
  for (let i = 0; i < 5; i++) {
    const inner = unwrap(content);
    if (!inner) break;
    content = inner;
  }

  if (content.conversation) return content.conversation;
  if (content.extendedTextMessage?.text) return content.extendedTextMessage.text;
  if (content.imageMessage?.caption) return content.imageMessage.caption;
  if (content.videoMessage?.caption) return content.videoMessage.caption;

  if (content.interactiveResponseMessage) {
    try {
      const params = JSON.parse(
        content.interactiveResponseMessage.nativeFlowResponseMessage?.paramsJson || "{}",
      );
      return params.id || "";
    } catch {
      return "";
    }
  }

  if (content.buttonsResponseMessage?.selectedButtonId)
    return content.buttonsResponseMessage.selectedButtonId;
  if (content.listResponseMessage?.singleSelectReply?.selectedRowId)
    return content.listResponseMessage.singleSelectReply.selectedRowId;
  if (content.templateButtonReplyMessage?.selectedId)
    return content.templateButtonReplyMessage.selectedId;

  return "";
}

async function connectToWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);

  const usePairingCode = !!process.env.PAIRING_NUMBER;

  const sock = makeWASocket({
    printQRInTerminal: true, // HARUS true agar sistem bawaan lilys-baileys tidak memunculkan prompt (Masukan Nomornya) yang membuat bot nge-stuck!
    logger,
    browser: ["Ubuntu", "Chrome", "20.0.04"], // Menggunakan format bawaan yang paling stabil di Baileys ini
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, logger), // SANGAT PENTING: Mencegah Bad MAC & Session Error yang berujung Logged Out
    },
    syncFullHistory: false,
    markOnlineOnConnect: false, // Cegah WA memutus koneksi di awal
    generateHighQualityLinkPreview: false, // Hemat RAM dan performa
    getMessage: async () => {
      return { conversation: "pesan" }; // Mencegah bot crash jika histori pesan tidak sinkron
    },
  });

  store.bind(sock.ev);

  // Jika menggunakan Pairing Code dan belum login
  if (usePairingCode && !state.creds.me) {
    const phoneNumber = process.env.PAIRING_NUMBER.replace(/[^0-9]/g, "");
    
    // Tunggu sebentar agar socket siap
    setTimeout(async () => {
      // CEK VITAL: Jika di pertengahan waktu tunggu ternyata bot sudah berhasil login/konek, batalkan request!
      // Meminta pairing code pada sesi yang sudah terhubung akan memicu pemutusan sepihak oleh server WA (Log Out 401)
      if (sock.authState.creds.me) return;

      try {
        let code = await sock.requestPairingCode(phoneNumber);
        code = code?.match(/.{1,4}/g)?.join("-") || code;
        
        // Simpan ke file agar mudah dibaca di cPanel
        fs.writeFileSync(path.join(__dirname, "pairing_code.txt"), code);

        console.log("\n" + "=".repeat(30));
        console.log(`🔑 KODE PAIRING KAMU: ${code}`);
        console.log("=".repeat(30) + "\n");
        console.log("Cara pakai:");
        console.log("1. Buka WhatsApp > Titik Tiga > Perangkat Tertaut");
        console.log("2. Pilih 'Tautkan Perangkat'");
        console.log("3. Pilih 'Tautkan dengan nomor telepon saja' di bagian bawah");
        console.log("4. Masukkan kode di atas.\n");
      } catch (err) {
        console.error("Gagal mendapatkan kode pairing:", err.message);
      }
    }, 3000);
  }

  sock.ev.on("creds.update", saveCreds);

  // ============================================================
  // Koneksi
  // ============================================================
  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log("\n📱 Scan QR code di atas dengan WhatsApp kamu!");
      console.log("   Buka WhatsApp > Settings > Linked Devices > Link a Device\n");
    }

    if (connection === "close") {
      const code = lastDisconnect?.error?.output?.statusCode;
      if (code !== DisconnectReason.loggedOut) {
        console.log(`🔄 Reconnecting... (code: ${code})`);
        
        // Cegah memory leak dari socket lama
        sock.ev.removeAllListeners();
        
        await delay(5000); // Jeda 5 detik agar tidak spam reconnect dan menghindari code 401
        connectToWhatsApp();
      } else {
        console.log("❌ Logged out. Menghapus folder auth dan restart otomatis...");
        if (fs.existsSync(AUTH_DIR)) {
          fs.rmSync(AUTH_DIR, { recursive: true, force: true });
        }
        process.exit(1); // Keluar agar process manager (seperti PM2 atau nodemon) me-restart ulang dengan bersih
      }
    }

    if (connection === "open") {
      console.log("✅ SHIRA BOT connected!");
      console.log("👤 User:", sock.user?.id);

      if (typeof sock.ev.flush === "function") {
        setTimeout(() => sock.ev.flush(), 2000);
      }
    }
  });

  // ============================================================
  // Event Grup (Welcome / Leave)
  // ============================================================
  sock.ev.on("group-participants.update", async (update) => {
    try {
      const { id, participants, action } = update;
      const groupInfo = getGroup(id);
      if (!groupInfo) return;

      let metadata;
      try { metadata = await sock.groupMetadata(id); } catch { return; }
      const groupName = metadata.subject;
      const memberCount = metadata.participants.length;

      for (const participant of participants) {
        const isWelcome = action === "add";
        const template = isWelcome ? groupInfo.welcomeMessage : groupInfo.leaveMessage;
        if (!template) continue;

        let ppUrl;
        try { ppUrl = await sock.profilePictureUrl(participant, "image"); }
        catch { ppUrl = "https://i.ibb.co/1s8T3sY/48f7ce63c7aa.jpg"; }

        const caption = template
          .replace(/@user/g, `@${participant.split("@")[0]}`)
          .replace(/@group/g, groupName);

        const image = await new canvafy.WelcomeLeave()
          .setAvatar(ppUrl)
          .setBackground("image", "https://img.freepik.com/free-photo/abstract-luxury-gradient-blue-background-smooth-dark-blue-with-black-vignette_1258-54470.jpg")
          .setTitle(isWelcome ? "Welcome!" : "Goodbye!")
          .setDescription(isWelcome
            ? `Selamat bergabung di ${groupName}! 🎉`
            : `Sampai jumpa lagi! 👋`)
          .setMember(`Member ke-${memberCount}`)
          .setBorder(isWelcome ? "#00d4ff" : "#ff4757")
          .setAvatarBorder(isWelcome ? "#00d4ff" : "#ff4757")
          .setOverlayOpacity(0.3)
          .build();

        await sock.sendMessage(id, { image, caption, mentions: [participant] });
      }
    } catch (err) {
      console.error("Gagal mengirim welcome/leave:", err);
    }
  });

  sock.ev.on("messages.upsert", async ({ messages }) => {
    try {
      if (!messages?.length) return;
      const m = messages[0];
      
      const jid = m.key.remoteJid;
      if (jid === "status@broadcast") return;

      const text = extractText(m.message).trim();

      const isGroup = jid.endsWith("@g.us");

      if (!m?.message) return;

      const botId = normalizeJid(sock.user.id);
      let sender = m.key.fromMe ? botId : normalizeJid(m.key.participant || m.key.remoteJid);

      if (isGroup && text.match(/(chat\.whatsapp\.com\/)/gi)) {
        const groupInfo = getGroup(jid) || {};
        if (groupInfo.antiLink) {
          const gm = await sock.groupMetadata(jid);
          if (!isAdmin(gm, sender) && isAdmin(gm, botId)) {
            await sock.sendMessage(jid, { delete: m.key });
            await sock.sendMessage(jid, { text: `⚠️ Link terdeteksi! @${sender.split("@")[0]} dikeluarkan.`, mentions: [sender] });
            await sock.groupParticipantsUpdate(jid, [sender], "remove");
            return;
          }
        }
      }

      if (!text || !text.startsWith(PREFIX)) return;

      const rawCmd = text.slice(PREFIX.length).trim();
      if (!rawCmd) return;
      const args = rawCmd.split(/\s+/);
      const cmd = args.shift().toLowerCase();


      console.log(`📩 [${isGroup ? "GRUP" : "DM"}] ${text}`);

      // === Cek registrasi (kecuali command daftar) ===
      if (cmd !== "daftar" && cmd !== "register") {
        if (!isRegistered(sender)) {
          await sock.sendMessage(jid, {
            text:
              `⚠️ *Kamu belum terdaftar!*\n\n` +
              `Silakan daftar terlebih dahulu:\n` +
              `┌─────────────────\n` +
              `│ Format: *${PREFIX}daftar nama#umur*\n` +
              `│ Contoh: *${PREFIX}daftar Budi#17*\n` +
              `└─────────────────`,
          }, { quoted: m });
          return;
        }
      }

      // === Proses command ===
      const command = commands.get(cmd) || Array.from(commands.values()).find(c => c.aliases?.includes(cmd));
      
      if (command) {
        try {
          await command.execute(sock, m, args, { jid, sender, isGroup, botId, PREFIX, config, getUser, registerUser, isRegistered, getGroup, updateGroup, addWarn, resetWarn, getTotalUsers, getTotalGroups, commands });
        } catch (err) {
          console.error(`Error pada command ${cmd}:`, err);
          await sock.sendMessage(jid, { text: `❌ Terjadi kesalahan saat menjalankan perintah.` }, { quoted: m });
        }
      } else {
        await sock.sendMessage(jid, {
          text: `❓ Command *${PREFIX}${cmd}* tidak ditemukan.\nKetik *${PREFIX}menu* untuk melihat daftar perintah.`
        }, { quoted: m });
      }
    } catch (err) {
      if (!err.message?.includes("Bad MAC") && !err.message?.includes("decrypt")) {
        _origError("⚠️ Error:", err.message);
      }
    }
  });

  return sock;
}

connectToWhatsApp().catch((err) => {
  _origError("Connection error:", err);
  process.exit(1);
});