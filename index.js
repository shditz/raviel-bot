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
const {sendMenuWithImage} = require("./handlers/menu");
const {
  getUser,
  registerUser,
  isRegistered,
  getGroup,
  updateGroup,
  addWarn,
  resetWarn,
  getTotalUsers,
  getTotalGroups,
  isGroupWhitelisted,
  isBotAllowedInDM,
  flushAllDebouncers,
  getSettings,
  updateSettings,
  isMaintenance,
  isBanned,
} = require("./database/db");
const {normalizeJid, isAdmin} = require("./utils/jid");
const canvafy = require("canvafy");
const {TempFileCleanup} = require("./utils/cleanup");
const {LRUCache} = require("./utils/cache");

config.preloadImages().catch((err) => console.error("Failed to preload images:", err.message));

const tempCleanup = new TempFileCleanup();
tempCleanup.start(600000);

const apiResponseCache = new LRUCache(200, 300000);

const avatarCache = new Map();
const AVATAR_CACHE_TTL = 3600000;

const commands = new Map();
const commandFiles = fs
  .readdirSync(path.join(__dirname, "commands"))
  .filter((f) => f.endsWith(".js"));
for (const file of commandFiles) {
  const cmd = require(`./commands/${file}`);
  commands.set(cmd.name, cmd);
}

const AUTH_DIR = path.join(__dirname, "auth");
if (!fs.existsSync(AUTH_DIR)) fs.mkdirSync(AUTH_DIR, {recursive: true});

const logger = pino({level: "fatal"});

const gameSessions = new Map();

const store = makeInMemoryStore({logger: pino().child({level: "silent", stream: "store"})});
store.readFromFile("./auth/baileys_store_multi.json");
setInterval(() => {
  store.writeToFile("./auth/baileys_store_multi.json");
}, 10_000);

const _origError = console.error;
const _origWarn = console.warn;
const _origLog = console.log;
const _origInfo = console.info;
const _origDebug = console.debug;

const LOG_FILTERS = [
  /newsletter/i,
  /closing open session/i,
  /closing session/i,
  /sessionentry/i,
  /failed to decrypt/i,
  /bad mac/i,
  /session error/i,
  /timed out/i,
];

const filterLog = (origFunc, args) => {
  const msg = String(args.join(" "));
  for (const pattern of LOG_FILTERS) {
    if (pattern.test(msg)) {
      return;
    }
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
  const {state, saveCreds} = await useMultiFileAuthState(AUTH_DIR);

  const usePairingCode = !!process.env.PAIRING_NUMBER;

  const sock = makeWASocket({
    printQRInTerminal: true,
    logger,
    browser: ["Ubuntu", "Chrome", "20.0.04"],
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, logger),
    },
    syncFullHistory: false,
    markOnlineOnConnect: false,
    generateHighQualityLinkPreview: false,
    getMessage: async () => {
      return {conversation: "pesan"};
    },
  });

  store.bind(sock.ev);

  if (usePairingCode && !state.creds.me) {
    const phoneNumber = process.env.PAIRING_NUMBER.replace(/[^0-9]/g, "");

    setTimeout(async () => {
      if (sock.authState.creds.me) return;

      try {
        let code = await sock.requestPairingCode(phoneNumber);
        code = code?.match(/.{1,4}/g)?.join("-") || code;

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

  sock.ev.on("connection.update", async (update) => {
    const {connection, lastDisconnect, qr} = update;

    if (qr) {
      console.log("\n📱 Scan QR code di atas dengan WhatsApp kamu!");
      console.log("   Buka WhatsApp > Settings > Linked Devices > Link a Device\n");
    }

    if (connection === "close") {
      const code = lastDisconnect?.error?.output?.statusCode;
      if (code !== DisconnectReason.loggedOut) {
        console.log(`🔄 Reconnecting... (code: ${code})`);
        sock.ev.removeAllListeners();
        await delay(5000);
        connectToWhatsApp();
      } else {
        console.log("❌ Logged out. Menghapus folder auth dan restart otomatis...");
        if (fs.existsSync(AUTH_DIR)) {
          fs.rmSync(AUTH_DIR, {recursive: true, force: true});
        }
        process.exit(1);
      }
    }

    if (connection === "open") {
      console.log("✅ SHIRA BOT connected!");
      console.log("👤 User:", sock.user?.id);

      setTimeout(async () => {
        const { restarted, restartJid } = getSettings();
        const ownerJid = config.ownerNumber + "@s.whatsapp.net";
        
        const notifyMsg = [
            `🚀 *NOTIFIKASI SISTEM*`,
            `────────────────────`,
            `✅ Bot telah berhasil terhubung dan sekarang online!`,
            `📅 Tanggal: ${new Date().toLocaleDateString("id-ID")}`,
            `⌚ Waktu: ${new Date().toLocaleTimeString("id-ID")} WIB`,
            `────────────────────`,
        ].join("\n");

        if (restarted && restartJid) {
          await sock.sendMessage(restartJid, { text: notifyMsg });
          updateSettings({ restarted: false, restartJid: null });
        } else {
          await sock.sendMessage(ownerJid, { text: notifyMsg });
          updateSettings({ restarted: false, restartJid: null });
        }
      }, 3000);

      if (typeof sock.ev.flush === "function") {
        setTimeout(() => sock.ev.flush(), 2000);
      }
    }
  });

  sock.ev.on("group-participants.update", async (update) => {
    try {
      const {id, participants, action} = update;
      const groupInfo = getGroup(id);
      if (!groupInfo) return;

      let metadata;
      try {
        metadata = await sock.groupMetadata(id);
      } catch {
        return;
      }
      const groupName = metadata.subject;
      const memberCount = metadata.participants.length;

      for (const participant of participants) {
        const isWelcome = action === "add";
        const template = isWelcome ? groupInfo.welcomeMessage : groupInfo.leaveMessage;
        if (!template) continue;

        let ppUrl;
        try {
          ppUrl = await sock.profilePictureUrl(participant, "image");
        } catch {
          ppUrl = "https://i.ibb.co/1s8T3sY/48f7ce63c7aa.jpg";
        }

        const caption = template
          .replace(/@user/g, `@${participant.split("@")[0]}`)
          .replace(/@group/g, groupName);

        let cachedPP = avatarCache.get(participant);
        if (cachedPP && cachedPP.expires > Date.now()) {
          ppUrl = cachedPP.url;
        } else {
          avatarCache.set(participant, {
            url: ppUrl,
            expires: Date.now() + AVATAR_CACHE_TTL,
          });
        }

        const image = await new canvafy.WelcomeLeave()
          .setAvatar(ppUrl)
          .setBackground(
            "image",
            "https://img.freepik.com/free-photo/abstract-luxury-gradient-blue-background-smooth-dark-blue-with-black-vignette_1258-54470.jpg",
          )
          .setTitle(isWelcome ? "Welcome!" : "Goodbye!")
          .setDescription(
            isWelcome ? `Selamat bergabung di ${groupName}! 🎉` : `Sampai jumpa lagi! 👋`,
          )
          .setMember(`Member ke-${memberCount}`)
          .setBorder(isWelcome ? "#00d4ff" : "#ff4757")
          .setAvatarBorder(isWelcome ? "#00d4ff" : "#ff4757")
          .setOverlayOpacity(0.3)
          .build();

        await sock.sendMessage(id, {image, caption, mentions: [participant]});
      }
    } catch (err) {
      console.error("Gagal mengirim welcome/leave:", err);
    }
  });

  sock.ev.on("messages.upsert", async ({messages}) => {
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

      if (isGroup && !isGroupWhitelisted(jid)) {
        return;
      }

      if (!isGroup && !isBotAllowedInDM()) {
        return;
      }

      if (isGroup && text.match(/(chat\.whatsapp\.com\/)/gi)) {
        const groupInfo = getGroup(jid) || {};
        if (groupInfo.antiLink) {
          const gm = await sock.groupMetadata(jid);
          if (!isAdmin(gm, sender) && isAdmin(gm, botId)) {
            await sock.sendMessage(jid, {delete: m.key});
            await sock.sendMessage(jid, {
              text: `🚫 *PERINGATAN KEAMANAN*\n\nLink terdeteksi dari @${sender.split("@")[0]}. Akses dicabut demi menjaga keamanan grup.`,
              mentions: [sender],
            });
            await sock.groupParticipantsUpdate(jid, [sender], "remove");
            return;
          }
        }
      }

      const {prefix: dbPrefix, maintenance} = getSettings();
      const currentPrefix = dbPrefix || config.prefix;

      const isOwner = sender.startsWith(config.ownerNumber) || m.key.fromMe;

      if (maintenance && !isOwner) {
        if (text.startsWith(currentPrefix)) {
          await sock.sendMessage(
            jid,
            {text: `⚠️ *PEMELIHARAAN SISTEM*\n\nServer kami sedang dalam masa pembaruan. Kami akan segera kembali online. Terima kasih atas kesabaran Anda.`},
            {quoted: m},
          );
        }
        return;
      }

      if (isBanned(sender) && !isOwner) {
        if (text.startsWith(currentPrefix)) {
          await sock.sendMessage(
            jid,
            {text: `❌ *AKSES DIBATASI*\n\nAkun Anda telah dibatasi dari penggunaan layanan ini karena adanya pelanggaran kebijakan.`},
            {quoted: m},
          );
        }
        return;
      }

      if (!text || !text.startsWith(currentPrefix)) {
        const session = gameSessions.get(jid);
        if (session && text) {
          if (text.toLowerCase() === session.answer.toLowerCase()) {
            const timeTaken = ((Date.now() - session.startTime) / 1000).toFixed(1);
            await sock.sendMessage(
              jid,
              {
                text: `🎉 *JAWABAN BENAR!*\n\nSelamat @${sender.split("@")[0]}!\n✨ Jawaban: *${session.answer}*\n⏱️ Waktu: ${timeTaken} detik`,
                mentions: [sender],
              },
              {quoted: m},
            );
            gameSessions.delete(jid);
          }
        }
        return;
      }

      const rawCmd = text.slice(currentPrefix.length).trim();
      if (!rawCmd) return;
      const args = rawCmd.split(/\s+/);
      const cmd = args.shift().toLowerCase();

      if (cmd !== "daftar" && cmd !== "register") {
        if (!isRegistered(sender)) {
          await sock.sendMessage(
            jid,
            {
              text:
                `📝 *REGISTRASI DIPERLUKAN*\n\n` +
                `Anda belum terdaftar di database kami. Silakan selesaikan proses registrasi di bawah ini:\n\n` +
                `┌─────────────────\n` +
                `│ Format: *${currentPrefix}daftar nama#umur*\n` +
                `│ Contoh: *${currentPrefix}daftar Budi#17*\n` +
                `└─────────────────\n\n` +
                `_Registrasi gratis dan hanya memakan waktu beberapa detik._`,
            },
            {quoted: m},
          );
          return;
        }
      }

      const command =
        commands.get(cmd) || Array.from(commands.values()).find((c) => c.aliases?.includes(cmd));

      if (command) {
        try {
          await command.execute(sock, m, args, {
            jid,
            sender,
            isGroup,
            botId,
            PREFIX: currentPrefix,
            config,
            getUser,
            registerUser,
            isRegistered,
            getGroup,
            updateGroup,
            addWarn,
            resetWarn,
            getTotalUsers,
            getTotalGroups,
            commands,
            gameSessions,
            isOwner,
            cmd,
          });
        } catch (err) {
          await sock.sendMessage(
            jid,
            {text: `❌ *KESALAHAN INTERNAL*\n\nTerjadi kesalahan tak terduga saat menjalankan perintah. Silakan lapor ke administrator jika masalah berlanjut.`},
            {quoted: m},
          );
        }
      } else {
        await sock.sendMessage(
          jid,
          {
            text: `❓ *PERINTAH TIDAK DIKENAL*\n\nPerintah *${currentPrefix}${cmd}* tidak ditemukan. Silakan gunakan *${currentPrefix}menu* untuk melihat layanan yang tersedia.`,
          },
          {quoted: m},
        );
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

process.on("SIGINT", async () => {
  console.log("\n⏹️ Shutting down gracefully...");
  flushAllDebouncers();
  tempCleanup.stop();
  setTimeout(() => process.exit(130), 1000);
});

process.on("SIGTERM", async () => {
  console.log("\n⏹️ Shutting down gracefully...");
  flushAllDebouncers();
  tempCleanup.stop();
  setTimeout(() => process.exit(130), 1000);
});
