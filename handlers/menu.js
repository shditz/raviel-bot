const config = require("../config");
const { getUser } = require("../database/db");

const PREFIX = config.prefix;

const mainMenuButton = [
  {
    name: "single_select",
    buttonParamsJson: JSON.stringify({
      title: "📋 Buka Menu",
      sections: [
        {
          title: "📌 Informasi",
          rows: [
            { title: `${PREFIX}owner`, description: "Lihat info pemilik bot", id: `${PREFIX}owner` },
            { title: `${PREFIX}profil`, description: "Lihat data diri kamu", id: `${PREFIX}profil` },
          ],
        },
        {
          title: "🛠️ Utilitas",
          rows: [
            { title: `${PREFIX}ping`, description: "Cek kecepatan respon bot", id: `${PREFIX}ping` },
          ],
        },
      ],
    }),
  },
];


async function sendMenuWithImage(sock, jid) {
  const user = getUser(jid);
  const userName = user ? user.name : "User";
  const userAge = user ? `${user.age} tahun` : "-";
  const userSince = user
    ? new Date(user.registeredAt).toLocaleDateString("id-ID")
    : "-";

  const body = [
    `╭━━━━━━━━━━━━━━━━━╮`,
    `┃   *${config.botName}*`,
    `╰━━━━━━━━━━━━━━━━━╯`,
    ``,
    `Halo, *${userName}*! 👋`,
    ``,
    `╭──── 👤 *Data Kamu* ─────`,
    `│ 📛 Nama  : *${userName}*`,
    `│ 🎂 Umur  : *${userAge}*`,
    `│ 📅 Sejak : *${userSince}*`,
    `╰─────────────────────`,
    ``,
    `_Klik tombol di bawah untuk_`,
    `_melihat daftar perintah._`,
  ].join("\n");

  await sock.sendMessage(jid, {
    interactiveMessage: {
      image: config.botImage,
      title: body,
      footer: `© ${new Date().getFullYear()} ${config.botName} • ${config.ownerName}`,
      buttons: mainMenuButton,
    },
  });
}

module.exports = { sendMenuWithImage };
