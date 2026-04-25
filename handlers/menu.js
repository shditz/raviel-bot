const config = require("../config");
const {getUser} = require("../database/db");

const PREFIX = config.prefix;

const mainMenuButton = [
  {
    name: "single_select",
    buttonParamsJson: JSON.stringify({
      title: "PILIH KATEGORI MENU",
      sections: [
        {
          title: "─── [ ℹ️ INFORMASI ] ───",
          rows: [
            {title: "👤 Owner Info", id: `${PREFIX}owner`, description: "Informasi mengenai pemilik bot ini"},
            {title: "📋 User Profile", id: `${PREFIX}profil`, description: "Lihat data statistik profil Anda"},
            {title: "🌤️ Info Cuaca", id: `${PREFIX}cuaca`, description: "Cek kondisi cuaca di lokasi Anda"},
            {title: "⚠️ Cuaca Alert", id: `${PREFIX}cuacaalert`, description: "Peringatan cuaca ekstrem terbaru"},
            {title: "🌋 Info Gempa", id: `${PREFIX}gempa`, description: "Update gempa bumi terkini dari BMKG"},
          ],
        },
        {
          title: "─── [ 🔍 SEARCH ENGINE ] ───",
          rows: [
            {title: "📚 KBBI Daring", id: `${PREFIX}kbbi`, description: "Cari definisi kata dalam Bahasa Indonesia"},
            {title: "🌐 Wikipedia", id: `${PREFIX}wiki`, description: "Cari informasi di ensiklopedia bebas"},
            {title: "🎶 Lirik Lagu", id: `${PREFIX}lirik`, description: "Cari lirik lagu favorit Anda"},
            {title: "🖼️ Pinterest", id: `${PREFIX}pinterest`, description: "Cari inspirasi gambar di Pinterest"},
            {title: "🎥 Yaho Search", id: `${PREFIX}yaho`, description: "Cari konten video menarik"},
            {title: "🤡 Lahelu Meme", id: `${PREFIX}lahelu`, description: "Cari meme lucu di platform Lahelu"},
          ],
        },
        {
          title: "─── [ 👥 GRUP MANAGER ] ───",
          rows: [
            {title: "👋 Set Welcome", id: `${PREFIX}setwelcome`, description: "Atur pesan sambutan anggota baru"},
            {title: "🚪 Set Leave", id: `${PREFIX}setleave`, description: "Atur pesan perpisahan anggota keluar"},
            {title: "🔼 Promote Admin", id: `${PREFIX}promote`, description: "Jadikan anggota sebagai admin grup"},
            {title: "🔽 Demote Admin", id: `${PREFIX}demote`, description: "Hapus jabatan admin anggota"},
            {title: "🚪 Kick Member", id: `${PREFIX}kick`, description: "Keluarkan anggota dari dalam grup"},
            {title: "📢 Tag All", id: `${PREFIX}tagall`, description: "Tag seluruh anggota grup sekaligus"},
            {title: "👻 Hide Tag", id: `${PREFIX}hidetag`, description: "Tag seluruh anggota tanpa terlihat"},
            {title: "ℹ️ Group Info", id: `${PREFIX}groupinfo`, description: "Lihat informasi lengkap grup ini"},
            {title: "🔗 Group Link", id: `${PREFIX}linkgroup`, description: "Ambil link undangan grup ini"},
            {title: "⚠️ Warn User", id: `${PREFIX}warn`, description: "Beri peringatan kepada pelanggar"},
            {title: "🚫 Anti Link", id: `${PREFIX}antilink`, description: "Aktifkan perlindungan link otomatis"},
            {title: "📝 Set Desc", id: `${PREFIX}setdesc`, description: "Ubah deskripsi informasi grup"},
          ],
        },
        {
          title: "─── [ 🎮 MINIGAMES ] ───",
          rows: [
            {title: "🧩 Tebak Kata", id: `${PREFIX}tebakkata`, description: "Uji kemampuan kosakata Anda"},
            {title: "🧠 Kuis Pintar", id: `${PREFIX}kuis`, description: "Jawab kuis pengetahuan umum"},
            {title: "🖼️ Tebak Gambar", id: `${PREFIX}tebakgambar`, description: "Tebak kata dari gambar yang muncul"},
          ],
        },
        {
          title: "─── [ 🕋 ISLAMI ] ───",
          rows: [
            {title: "🕒 Jadwal Sholat", id: `${PREFIX}sholat`, description: "Cek waktu sholat di wilayah Anda"},
            {title: "📖 Al-Quran Digital", id: `${PREFIX}quran`, description: "Baca ayat suci Al-Quran & terjemahan"},
          ],
        },
        {
          title: "─── [ 🛠️ TOOLS & EDIT ] ───",
          rows: [
            {title: "🎨 Sticker Maker", id: `${PREFIX}sticker`, description: "Ubah gambar menjadi stiker WhatsApp"},
            {title: "✂️ Remove BG", id: `${PREFIX}removebg`, description: "Hapus latar belakang foto otomatis"},
            {title: "🗣️ Text To Speech", id: `${PREFIX}tts`, description: "Ubah teks menjadi pesan suara"},
            {title: "🔢 Kalkulator", id: `${PREFIX}kalkulator`, description: "Hitung matematika dengan cepat"},
            {title: "📲 QR Generator", id: `${PREFIX}qr generate`, description: "Buat kode QR sesuai keinginan"},
            {title: "🔍 QR Scanner", id: `${PREFIX}qr scan`, description: "Scan kode QR dari gambar"},
            {title: "🖼️ To Image", id: `${PREFIX}toimg`, description: "Ubah stiker kembali menjadi gambar"},
            {title: "✨ Unblur Photo", id: `${PREFIX}unblur`, description: "Pertajam foto yang buram/blur"},
            {title: "💎 Remini HD", id: `${PREFIX}remini`, description: "Tingkatkan kualitas foto menjadi HD"},
            {title: "🌈 Colorize Foto", id: `${PREFIX}colorize`, description: "Warnai foto hitam putih jadul"},
            {title: "🎭 Sticker Meme", id: `${PREFIX}smeme`, description: "Buat stiker meme dengan teks"},
          ],
        },
        {
          title: "─── [ 🎬 ANIME HUB ] ───",
          rows: [
            {title: "📺 Otakudesu", id: `${PREFIX}otakudesu`, description: "Cari, detail, dan tonton anime terbaru"},
            {title: "🐲 Donghua Center", id: `${PREFIX}donghua`, description: "Cari dan tonton donghua favorit"},
            {title: "📖 Novel Light", id: `${PREFIX}novel`, description: "Cari dan baca novel secara online"},
            {title: "🖼️ Trace Moe", id: `${PREFIX}tracemoe`, description: "Cari judul anime dari cuplikan gambar"},
          ],
        },
        {
          title: "─── [ 🤖 AI ASSISTANT ] ───",
          rows: [
            {title: "🌍 Translate", id: `${PREFIX}tr`, description: "Terjemahkan bahasa antar negara"},
            {title: "📝 Summarize", id: `${PREFIX}summarize`, description: "Ringkas dokumen/teks panjang"},
            {title: "🔄 Paraphrase", id: `${PREFIX}paraphrase`, description: "Ubah susunan kalimat teks"},
            {title: "➕ Expand Text", id: `${PREFIX}expand`, description: "Perluas ide dari teks singkat"},
            {title: "✅ Grammar Fix", id: `${PREFIX}grammar`, description: "Perbaiki tata bahasa tulisan"},
            {title: "🎙️ Dracin TTS", id: `${PREFIX}dracintts`, description: "TTS dengan suara khas drama china"},
            {title: "🌟 Gemini AI", id: `${PREFIX}geminiai`, description: "Tanya apa saja ke Google Gemini"},
            {title: "💬 ChatGPT-4", id: `${PREFIX}gptai`, description: "Tanya apa saja ke OpenAI ChatGPT"},
            {title: "🔎 DeepSeek AI", id: `${PREFIX}deepseekai`, description: "AI pintar untuk analisis mendalam"},
            {title: "🖋️ Quillbot AI", id: `${PREFIX}quillbot`, description: "Tulis ulang teks secara profesional"},
          ],
        },
        {
          title: "─── [ 📥 DOWNLOADER ] ───",
          rows: [
            {title: "📱 TikTok DL", id: `${PREFIX}tiktok`, description: "Unduh video TikTok tanpa watermark"},
            {title: "📸 Instagram DL", id: `${PREFIX}ig`, description: "Unduh video/foto dari Instagram"},
            {title: "🎵 YouTube MP3", id: `${PREFIX}ytmp3`, description: "Unduh lagu dari link YouTube"},
            {title: "🎞️ YouTube MP4", id: `${PREFIX}ytmp4`, description: "Unduh video dari link YouTube"},
            {title: "🔵 Facebook DL", id: `${PREFIX}fb`, description: "Unduh video dari platform Facebook"},
            {title: "🐦 Twitter DL", id: `${PREFIX}twitter`, description: "Unduh video dari platform X/Twitter"},
            {title: "🟢 Spotify DL", id: `${PREFIX}spotify`, description: "Unduh lagu dari platform Spotify"},
          ],
        },
        {
          title: "─── [ 🤖 BOT SYSTEM ] ───",
          rows: [
            {title: "🏓 Ping Test", id: `${PREFIX}ping`, description: "Cek kecepatan respon bot"},
            {title: "⚡ Speed Test", id: `${PREFIX}speed`, description: "Tes kecepatan server bot"},
            {title: "⏳ Runtime", id: `${PREFIX}runtime`, description: "Cek waktu aktif operasional bot"},
            {title: "📊 Status Bot", id: `${PREFIX}status`, description: "Lihat statistik sistem bot"},
          ],
        },
        {
          title: "─── [ 👑 OWNER PANEL ] ───",
          rows: [
            {title: "⚪ Whitelist", id: `${PREFIX}whitelist`, description: "Kelola daftar putih bot"},
            {title: "⚙️ Bot Mode", id: `${PREFIX}botmode`, description: "Ubah mode operasional bot"},
            {title: "🔄 Restart", id: `${PREFIX}restart`, description: "Mulai ulang sistem bot"},
            {title: "🛑 Shutdown", id: `${PREFIX}shutdown`, description: "Matikan sistem bot total"},
            {title: "⌨️ Set Prefix", id: `${PREFIX}setprefix`, description: "Ubah prefix perintah bot"},
            {title: "🛠️ Maintenance", id: `${PREFIX}maintenance`, description: "Aktifkan mode perbaikan"},
            {title: "🚫 Ban User", id: `${PREFIX}ban`, description: "Blokir akses user ke bot"},
            {title: "🔓 Unban User", id: `${PREFIX}unban`, description: "Buka blokir akses user"},
            {title: "⚫ Blacklist", id: `${PREFIX}blacklist`, description: "Kelola daftar hitam bot"},
          ],
        },
      ],
    }),
  },
];

async function sendMenuWithImage(sock, jid, sender) {
  const user = getUser(sender);
  const userName = user ? user.name : "User";
  const userAge = user ? `${user.age} tahun` : "-";
  const userSince = user ? new Date(user.registeredAt).toLocaleDateString("id-ID") : "-";
  const time = new Date().toLocaleTimeString("id-ID", { timeZone: "Asia/Jakarta" });
  const date = new Date().toLocaleDateString("id-ID", { timeZone: "Asia/Jakarta" });

  const isGroup = jid.endsWith("@g.us");

  const headerBox = [
    `╭━━━━━━━━━━━━━━━━━━━━━━━╮`,
    `┃      🚀 *${config.botName.toUpperCase()}* 🌟`,
    `╰━━━━━━━━━━━━━━━━━━━━━━━╯`,
    `👋 Halo, *${userName}*!`,
    ``,
    `📅 *DATE:* ${date}`,
    `⌚ *TIME:* ${time} WIB`,
    `────────────────────`,
    `📂 *USER INFO*`,
    `├ 👤 *Nama:* ${userName}`,
    `├ 🎂 *Umur:* ${userAge}`,
    `└ 📅 *Join:* ${userSince}`,
    `────────────────────`,
    `💻 *BOT STATS*`,
    `├ 💠 *Prefix:* [ ${PREFIX} ]`,
    `└ 🛡️ *Status:* Online`,
    `────────────────────`,
  ].join("\n");

  if (isGroup) {
    const body = headerBox + `\n\nSilakan pilih kategori menu melalui tombol di bawah ini untuk melihat daftar perintah selengkapnya!`;

    await sock.sendMessage(jid, {
      interactiveMessage: {
        image: config.botImage,
        title: body,
        footer: `© ${new Date().getFullYear()} ${config.botName} • ${config.ownerName}`,
        buttons: mainMenuButton,
      },
    });
  } else {
    const menuLines = [
      headerBox,
      `📖 *DAFTAR PERINTAH*`,
      ``,
      `┌─ [ ℹ️ *INFORMASI* ]`,
      `│ ◦ *${PREFIX}owner*`,
      `│ ◦ *${PREFIX}profil*`,
      `│ ◦ *${PREFIX}cuaca*`,
      `│ ◦ *${PREFIX}cuacaalert*`,
      `│ ◦ *${PREFIX}gempa*`,
      `└───────────────`,
      ``,
      `┌─ [ 🔍 *SEARCH* ]`,
      `│ ◦ *${PREFIX}kbbi*`,
      `│ ◦ *${PREFIX}wiki*`,
      `│ ◦ *${PREFIX}lirik*`,
      `│ ◦ *${PREFIX}pinterest*`,
      `│ ◦ *${PREFIX}yaho*`,
      `│ ◦ *${PREFIX}lahelu*`,
      `└───────────────`,
      ``,
      `┌─ [ 👥 *GRUP* ]`,
      `│ ◦ *${PREFIX}setwelcome*`,
      `│ ◦ *${PREFIX}setleave*`,
      `│ ◦ *${PREFIX}promote*`,
      `│ ◦ *${PREFIX}demote*`,
      `│ ◦ *${PREFIX}kick*`,
      `│ ◦ *${PREFIX}tagall*`,
      `│ ◦ *${PREFIX}hidetag*`,
      `│ ◦ *${PREFIX}groupinfo*`,
      `│ ◦ *${PREFIX}linkgroup*`,
      `│ ◦ *${PREFIX}warn*`,
      `│ ◦ *${PREFIX}antilink*`,
      `│ ◦ *${PREFIX}setdesc*`,
      `└───────────────`,
      ``,
      `┌─ [ 🎮 *MINIGAME* ]`,
      `│ ◦ *${PREFIX}tebakkata*`,
      `│ ◦ *${PREFIX}kuis*`,
      `│ ◦ *${PREFIX}tebakgambar*`,
      `└───────────────`,
      ``,
      `┌─ [ 🕋 *ISLAMI* ]`,
      `│ ◦ *${PREFIX}sholat*`,
      `│ ◦ *${PREFIX}quran*`,
      `└───────────────`,
      ``,
      `┌─ [ 🛠️ *TOOLS* ]`,
      `│ ◦ *${PREFIX}sticker*`,
      `│ ◦ *${PREFIX}removebg*`,
      `│ ◦ *${PREFIX}tts*`,
      `│ ◦ *${PREFIX}kalkulator*`,
      `│ ◦ *${PREFIX}qr generate*`,
      `│ ◦ *${PREFIX}qr scan*`,
      `│ ◦ *${PREFIX}toimg*`,
      `│ ◦ *${PREFIX}unblur*`,
      `│ ◦ *${PREFIX}remini*`,
      `│ ◦ *${PREFIX}colorize*`,
      `│ ◦ *${PREFIX}smeme*`,
      `└───────────────`,
      ``,
      `┌─ [ 🎬 *ANIME* ]`,
      `│ ◦ *${PREFIX}otakudesu*`,
      `│ ◦ *${PREFIX}donghua*`,
      `│ ◦ *${PREFIX}novel*`,
      `│ ◦ *${PREFIX}tracemoe*`,
      `└───────────────`,
      ``,
      `┌─ [ 🤖 *AI* ]`,
      `│ ◦ *${PREFIX}tr*`,
      `│ ◦ *${PREFIX}summarize*`,
      `│ ◦ *${PREFIX}paraphrase*`,
      `│ ◦ *${PREFIX}expand*`,
      `│ ◦ *${PREFIX}grammar*`,
      `│ ◦ *${PREFIX}dracintts*`,
      `│ ◦ *${PREFIX}geminiai*`,
      `│ ◦ *${PREFIX}gptai*`,
      `│ ◦ *${PREFIX}deepseekai*`,
      `│ ◦ *${PREFIX}quillbot*`,
      `└───────────────`,
      ``,
      `┌─ [ 📥 *DOWNLOAD* ]`,
      `│ ◦ *${PREFIX}tiktok*`,
      `│ ◦ *${PREFIX}ig*`,
      `│ ◦ *${PREFIX}ytmp3*`,
      `│ ◦ *${PREFIX}ytmp4*`,
      `│ ◦ *${PREFIX}fb*`,
      `│ ◦ *${PREFIX}twitter*`,
      `│ ◦ *${PREFIX}spotify*`,
      `└───────────────`,
      ``,
      `┌─ [ 👑 *OWNER* ]`,
      `│ ◦ *${PREFIX}whitelist*`,
      `│ ◦ *${PREFIX}botmode*`,
      `│ ◦ *${PREFIX}restart*`,
      `│ ◦ *${PREFIX}shutdown*`,
      `│ ◦ *${PREFIX}setprefix*`,
      `│ ◦ *${PREFIX}maintenance*`,
      `│ ◦ *${PREFIX}ban*`,
      `│ ◦ *${PREFIX}unban*`,
      `│ ◦ *${PREFIX}blacklist*`,
      `└───────────────`,
      ``,
      `© ${new Date().getFullYear()} ${config.botName} • ${config.ownerName}`,
    ].join("\n");

    await sock.sendMessage(jid, { image: config.botImage, caption: menuLines }, { quoted: m });
  }
}

module.exports = {
  mainMenuButton,
  sendMenuWithImage,
};
