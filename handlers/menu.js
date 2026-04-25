const config = require("../config");
const {getUser} = require("../database/db");

const PREFIX = config.prefix;

const mainMenuButton = [
  {
    name: "single_select",
    buttonParamsJson: JSON.stringify({
      title: "Buka Menu",
      sections: [
        {
          title: "INFORMASI",
          rows: [
            {title: `${PREFIX}owner`, id: `${PREFIX}owner`},
            {title: `${PREFIX}profil`, id: `${PREFIX}profil`},
            {title: `${PREFIX}cuaca`, id: `${PREFIX}cuaca`},
            {title: `${PREFIX}cuacaalert`, id: `${PREFIX}cuacaalert`},
            {title: `${PREFIX}gempa`, id: `${PREFIX}gempa`},
          ],
        },
        {
          title: "SEARCH",
          rows: [
            {title: `${PREFIX}kbbi`, id: `${PREFIX}kbbi`},
            {title: `${PREFIX}wiki`, id: `${PREFIX}wiki`},
            {title: `${PREFIX}lirik`, id: `${PREFIX}lirik`},
            {title: `${PREFIX}pinterest`, id: `${PREFIX}pinterest`},
            {title: `${PREFIX}yaho`, id: `${PREFIX}yaho`},
            {title: `${PREFIX}lahelu`, id: `${PREFIX}lahelu`},
          ],
        },
        {
          title: "GRUP",
          rows: [
            {title: `${PREFIX}setwelcome`, id: `${PREFIX}setwelcome`},
            {title: `${PREFIX}setleave`, id: `${PREFIX}setleave`},
            {title: `${PREFIX}promote`, id: `${PREFIX}promote`},
            {title: `${PREFIX}demote`, id: `${PREFIX}demote`},
            {title: `${PREFIX}kick`, id: `${PREFIX}kick`},
            {title: `${PREFIX}tagall`, id: `${PREFIX}tagall`},
            {title: `${PREFIX}hidetag`, id: `${PREFIX}hidetag`},
            {title: `${PREFIX}groupinfo`, id: `${PREFIX}groupinfo`},
            {title: `${PREFIX}linkgroup`, id: `${PREFIX}linkgroup`},
            {title: `${PREFIX}warn`, id: `${PREFIX}warn`},
            {title: `${PREFIX}antilink`, id: `${PREFIX}antilink`},
          ],
        },
        {
          title: "ISLAMI",
          rows: [
            {title: `${PREFIX}sholat`, id: `${PREFIX}sholat`},
            {title: `${PREFIX}quran`, id: `${PREFIX}quran`},
          ],
        },
        {
          title: "TOOLS",
          rows: [
            {title: `${PREFIX}sticker`, id: `${PREFIX}sticker`},
            {title: `${PREFIX}removebg`, id: `${PREFIX}removebg`},
            {title: `${PREFIX}tts`, id: `${PREFIX}tts`},
            {title: `${PREFIX}kalkulator`, id: `${PREFIX}kalkulator`},
          ],
        },
        {
          title: "AI",
          rows: [
            {title: `${PREFIX}tr`, id: `${PREFIX}tr`},
            {title: `${PREFIX}summarize`, id: `${PREFIX}summarize`},
            {title: `${PREFIX}paraphrase`, id: `${PREFIX}paraphrase`},
            {title: `${PREFIX}expand`, id: `${PREFIX}expand`},
            {title: `${PREFIX}grammar`, id: `${PREFIX}grammar`},
            {title: `${PREFIX}dracintts`, id: `${PREFIX}dracintts`},
            {title: `${PREFIX}geminiai`, id: `${PREFIX}geminiai`},
            {title: `${PREFIX}gptai`, id: `${PREFIX}gptai`},
            {title: `${PREFIX}deepseekai`, id: `${PREFIX}deepseekai`},
            {title: `${PREFIX}quillbot`, id: `${PREFIX}quillbot`},
          ],
        },
        {
          title: "DOWNLOADER",
          rows: [
            {title: `${PREFIX}tiktok`, id: `${PREFIX}tiktok`},
            {title: `${PREFIX}ig`, id: `${PREFIX}ig`},
            {title: `${PREFIX}ytmp3`, id: `${PREFIX}ytmp3`},
            {title: `${PREFIX}ytmp4`, id: `${PREFIX}ytmp4`},
            {title: `${PREFIX}fb`, id: `${PREFIX}fb`},
            {title: `${PREFIX}twitter`, id: `${PREFIX}twitter`},
            {title: `${PREFIX}spotify`, id: `${PREFIX}spotify`},
          ],
        },
        {
          title: "BOT",
          rows: [
            {title: `${PREFIX}ping`, id: `${PREFIX}ping`},
            {title: `${PREFIX}speed`, id: `${PREFIX}speed`},
            {title: `${PREFIX}runtime`, id: `${PREFIX}runtime`},
            {title: `${PREFIX}status`, id: `${PREFIX}status`},
          ],
        },
        {
          title: "OWNER",
          rows: [
            {title: `${PREFIX}whitelist`, id: `${PREFIX}whitelist`},
            {title: `${PREFIX}botmode`, id: `${PREFIX}botmode`},
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

  const isGroup = jid.endsWith("@g.us");

  if (isGroup) {
    const body = [
      `╭━━━━━━━━━━━━━━━━━━━━━━━╮`,
      `┃      🌟 *${config.botName.toUpperCase()}* 🌟`,
      `╰━━━━━━━━━━━━━━━━━━━━━━━╯`,
      ``,
      `Halo, *${userName}*! 👋`,
      ``,
      `╭─── 👤 *STATS PENGGUNA* ────`,
      `│ 📛 Nama  : *${userName}*`,
      `│ 🎂 Umur  : *${userAge}*`,
      `│ 📅 Sejak : *${userSince}*`,
      `╰─────────────────────────`,
      ``,
      `_Klik tombol dibawah untuk memilih_`,
      `_dan mencari fitur yang tersedia._`,
      ``,
      `💡 *Info:* Gunakan perintah *${PREFIX}help <nama_fitur>*`,
      `untuk melihat kegunaan dari fitur tersebut.`,
    ].join("\n");

    await sock.sendMessage(jid, {
      interactiveMessage: {
        image: config.botImage,
        title: body,
        footer: `© ${new Date().getFullYear()} ${config.botName} • ${config.ownerName}`,
        buttons: mainMenuButton,
      },
    });
  } else {
    const body = [
      `╭━━━━━━━━━━━━━━━━━━━━━━━╮`,
      `┃      🌟 *${config.botName.toUpperCase()}* 🌟`,
      `╰━━━━━━━━━━━━━━━━━━━━━━━╯`,
      ``,
      `Halo, *${userName}*! Selamat datang di layanan bot pribadi. 👋`,
      ``,
      `╭─── 👤 *STATS PENGGUNA* ────`,
      `│ 📛 *Nama*   : ${userName}`,
      `│ 🎂 *Umur*   : ${userAge}`,
      `│ 📅 *Sejak*  : ${userSince}`,
      `╰─────────────────────────`,
      ``,
      `┏━━━ 📌 *DAFTAR PERINTAH* ━━━┓`,
      `┃`,
      `┃  *INFORMASI*`,
      `┃ ├ • *${PREFIX}owner*`,
      `┃ ├ • *${PREFIX}profil*`,
      `┃ ├ • *${PREFIX}cuaca*`,
      `┃ ├ • *${PREFIX}cuacaalert*`,
      `┃ ├ • *${PREFIX}gempa*`,
      `┃`,
      `┃  *SEARCH*`,
      `┃ ├ • *${PREFIX}kbbi*`,
      `┃ ├ • *${PREFIX}wiki*`,
      `┃ ├ • *${PREFIX}lirik*`,
      `┃ ├ • *${PREFIX}pinterest*`,
      `┃ ├ • *${PREFIX}yaho*`,
      `┃ ├ • *${PREFIX}lahelu*`,
      `┃`,
      `┃  *GRUP*`,
      `┃ ├ • *${PREFIX}setwelcome*`,
      `┃ ├ • *${PREFIX}setleave*`,
      `┃ ├ • *${PREFIX}promote*`,
      `┃ ├ • *${PREFIX}demote*`,
      `┃ ├ • *${PREFIX}kick*`,
      `┃ ├ • *${PREFIX}tagall*`,
      `┃ ├ • *${PREFIX}hidetag*`,
      `┃ ├ • *${PREFIX}groupinfo*`,
      `┃ ├ • *${PREFIX}linkgroup*`,
      `┃ ├ • *${PREFIX}warn*`,
      `┃ ├ • *${PREFIX}antilink*`,
      `┃`,
      `┃  *ISLAMI*`,
      `┃ ├ • *${PREFIX}sholat*`,
      `┃ ├ • *${PREFIX}quran*`,
      `┃`,
      `┃  *TOOLS*`,
      `┃ ├ • *${PREFIX}sticker*`,
      `┃ ├ • *${PREFIX}removebg*`,
      `┃ ├ • *${PREFIX}tts*`,
      `┃ ├ • *${PREFIX}kalkulator*`,
      `┃`,
      `┃  *AI*`,
      `┃ ├ • *${PREFIX}tr*`,
      `┃ ├ • *${PREFIX}summarize*`,
      `┃ ├ • *${PREFIX}paraphrase*`,
      `┃ ├ • *${PREFIX}expand*`,
      `┃ ├ • *${PREFIX}grammar*`,
      `┃ ├ • *${PREFIX}dracintts*`,
      `┃ ├ • *${PREFIX}geminiai*`,
      `┃ ├ • *${PREFIX}gptai*`,
      `┃ ├ • *${PREFIX}deepseekai*`,
      `┃ ├ • *${PREFIX}quillbot*`,
      `┃`,
      `┃  *DOWNLOADER*`,
      `┃ ├ • *${PREFIX}tiktok*`,
      `┃ ├ • *${PREFIX}ig*`,
      `┃ ├ • *${PREFIX}ytmp3*`,
      `┃ ├ • *${PREFIX}ytmp4*`,
      `┃ ├ • *${PREFIX}fb*`,
      `┃ ├ • *${PREFIX}twitter*`,
      `┃ ├ • *${PREFIX}spotify*`,
      `┃`,
      `┃  *BOT*`,
      `┃ ├ • *${PREFIX}ping*`,
      `┃ ├ • *${PREFIX}speed*`,
      `┃ ├ • *${PREFIX}runtime*`,
      `┃ ├ • *${PREFIX}status*`,
      `┃`,
      `┃  *OWNER*`,
      `┃ ├ • *${PREFIX}whitelist*`,
      `┃ ├ • *${PREFIX}botmode*`,
      `┃`,
      `┗━━━━━━━━━━━━━━━━━━━━━━━┛`,
      ``,
      `💡 *Info:* Gunakan perintah *${PREFIX}help <nama_fitur>*`,
      `untuk melihat fungsi dan deskripsi detail.`,
      ``,
      `─────────────────────────`,
      `✨ _© ${new Date().getFullYear()} ${config.botName} • ${config.ownerName}_ ✨`,
    ].join("\n");

    await sock.sendMessage(jid, {
      image: config.botImage,
      caption: body,
    });
  }
}

module.exports = {sendMenuWithImage};
