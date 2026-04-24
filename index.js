const fs = require("fs");
const path = require("path");
const pino = require("pino");
const {
  default: makeWASocket,
  DisconnectReason,
  delay,
  useMultiFileAuthState,
} = require("@fadzzzdigital-corp/baileys");
const config = require("./config");
const { sendMenuWithImage } = require("./handlers/menu");
const { getUser, registerUser, isRegistered } = require("./database/db");

const AUTH_DIR = path.join(__dirname, "auth");
if (!fs.existsSync(AUTH_DIR)) fs.mkdirSync(AUTH_DIR, { recursive: true });

const logger = pino({ level: "silent" });
const PREFIX = config.prefix;

const _origError = console.error;
const _origWarn = console.warn;
console.error = (...args) => {
  const s = String(args[0] || "");
  if (s.includes("Failed to decrypt") || s.includes("Bad MAC") || s.includes("Session error")) return;
  _origError.apply(console, args);
};
console.warn = (...args) => {
  const s = String(args[0] || "");
  if (s.includes("closed session")) return;
  _origWarn.apply(console, args);
};

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
    printQRInTerminal: !usePairingCode, // Matikan QR jika pakai pairing code
    logger,
    browser: ["Ubuntu", "Chrome", "20.0.04"],
    auth: state,
    syncFullHistory: false,
    markOnlineOnConnect: true,
    getMessage: async () => undefined,
  });

  // Jika menggunakan Pairing Code dan belum login
  if (usePairingCode && !sock.authState.creds.registered) {
    const phoneNumber = process.env.PAIRING_NUMBER.replace(/[^0-9]/g, "");
    
    // Tunggu sebentar agar socket siap
    setTimeout(async () => {
      try {
        let code = await sock.requestPairingCode(phoneNumber);
        code = code?.match(/.{1,4}/g)?.join("-") || code;
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
        await delay(3000);
        connectToWhatsApp();
      } else {
        console.log("❌ Logged out. Hapus folder auth/ lalu jalankan ulang.");
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

  sock.ev.on("messages.upsert", async ({ messages }) => {
    try {
      if (!messages?.length) return;
      const m = messages[0];
      if (!m?.message) return;
      if (m.key.fromMe) return;
      if (m.key.remoteJid === "status@broadcast") return;

      const jid = m.key.remoteJid;
      const text = extractText(m.message).trim();

      if (!text || !text.startsWith(PREFIX)) return;

      const rawCmd = text.slice(PREFIX.length).trim();
      if (!rawCmd) return;
      const args = rawCmd.split(/\s+/);
      const cmd = args.shift().toLowerCase();

      const isGroup = jid.endsWith("@g.us");
      console.log(`📩 [${isGroup ? "GRUP" : "DM"}] ${text}`);

      await sock.sendPresenceUpdate("composing", jid);

      // === Cek registrasi (kecuali command daftar) ===
      if (cmd !== "daftar" && cmd !== "register") {
        if (!isRegistered(jid)) {
          await sock.sendMessage(jid, {
            text:
              `⚠️ *Kamu belum terdaftar!*\n\n` +
              `Silakan daftar terlebih dahulu:\n` +
              `┌─────────────────\n` +
              `│ Format: *${PREFIX}daftar nama#umur*\n` +
              `│ Contoh: *${PREFIX}daftar Budi#17*\n` +
              `└─────────────────`,
          });
          return;
        }
      }

      // === Proses command ===
      switch (cmd) {
        // ─── REGISTRASI ───────────────────────
        case "daftar":
        case "register": {
          if (isRegistered(jid)) {
            const u = getUser(jid);
            await sock.sendMessage(jid, {
              text:
                `✅ Kamu sudah terdaftar!\n\n` +
                `┌─────────────────\n` +
                `│ 📛 *${u.name}*\n` +
                `│ 🎂 ${u.age} tahun\n` +
                `│ 📅 ${new Date(u.registeredAt).toLocaleDateString("id-ID")}\n` +
                `└─────────────────\n\n` +
                `Ketik *${PREFIX}menu* untuk mulai.`,
            });
            return;
          }

          const input = args.join(" "); 
          if (!input || !input.includes("#")) {
            await sock.sendMessage(jid, {
              text:
                `❌ *Format salah!*\n\n` +
                `┌─────────────────\n` +
                `│ Gunakan: *${PREFIX}daftar nama#umur*\n` +
                `│ Contoh : *${PREFIX}daftar Budi#17*\n` +
                `└─────────────────`,
            });
            return;
          }

          const [name, ageStr] = input.split("#");
          const age = parseInt(ageStr);
          if (!name.trim() || isNaN(age) || age < 1 || age > 100) {
            await sock.sendMessage(jid, {
              text: `❌ Nama atau umur tidak valid. Umur harus angka 1-100.`,
            });
            return;
          }

          const user = registerUser(jid, name.trim(), age);
          await sock.sendMessage(jid, {
            text:
              `✅ *Registrasi berhasil!*\n\n` +
              `╭━━━━━━━━━━━━━━━━━╮\n` +
              `┃ 📛 Nama : *${user.name}*\n` +
              `┃ 🎂 Umur : *${user.age} tahun*\n` +
              `┃ 📅 Tanggal: *${new Date(user.registeredAt).toLocaleDateString("id-ID")}*\n` +
              `╰━━━━━━━━━━━━━━━━━╯\n\n` +
              `Sekarang kamu bisa menggunakan bot.\n` +
              `Ketik *${PREFIX}menu* untuk melihat menu.`,
          });
          break;
        }

        // ─── MENU ─────────────────────────────
        case "menu":
        case "help":
          await sendMenuWithImage(sock, jid);
          break;

        // ─── OWNER ────────────────────────────
        case "owner":
          await sock.sendMessage(jid, {
            text:
              `╭━━━━ 👑 *Owner* ━━━━╮\n` +
              `┃\n` +
              `┃ 📛 Nama   : *${config.ownerName}*\n` +
              `┃ 📱 Nomor  : *+${config.ownerNumber}*\n` +
              `┃ 🤖 Bot    : *${config.botName}*\n` +
              `┃\n` +
              `╰━━━━━━━━━━━━━━━━━━━╯\n\n` +
              `_Ketik *${PREFIX}menu* untuk kembali._`,
          });
          break;

        // ─── PING ─────────────────────────────
        case "ping": {
          const start = Date.now();
          await sock.sendMessage(jid, {
            text: `🏓 *Pong!*  _${Date.now() - start}ms_\n⚡ Bot aktif dan siap melayani.`,
          });
          break;
        }

        // ─── PROFIL ───────────────────────────
        case "profil":
        case "profile":
        case "me": {
          const u = getUser(jid);
          if (!u) {
            await sock.sendMessage(jid, { text: `❌ Data tidak ditemukan.` });
            return;
          }
          await sock.sendMessage(jid, {
            text:
              `╭━━━━ 👤 *Profil* ━━━━╮\n` +
              `┃\n` +
              `┃ 📛 Nama : *${u.name}*\n` +
              `┃ 🎂 Umur : *${u.age} tahun*\n` +
              `┃ 📅 Sejak: *${new Date(u.registeredAt).toLocaleDateString("id-ID")}*\n` +
              `┃\n` +
              `╰━━━━━━━━━━━━━━━━━━━╯`,
          });
          break;
        }

        // ─── COMMAND TIDAK DIKENAL ────────────
        default:
          await sock.sendMessage(jid, {
            text:
              `❓ Command *${PREFIX}${cmd}* tidak ditemukan.\n` +
              `Ketik *${PREFIX}menu* untuk melihat daftar perintah.`,
          });
          break;
      }

      await sock.sendPresenceUpdate("paused", jid);
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