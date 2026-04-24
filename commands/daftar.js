module.exports = {
  name: "daftar",
  aliases: ["register"],
  description: "Mendaftarkan diri ke database bot. Format: !daftar nama#umur",
  async execute(sock, m, args, { jid, sender, isRegistered, getUser, registerUser, PREFIX }) {
    if (isRegistered(sender)) {
      const u = getUser(sender);
      return await sock.sendMessage(jid, { text: `✅ Kamu sudah terdaftar sebagai *${u.name}*.` }, { quoted: m });
    }

    const input = args.join(" "); 
    if (!input || !input.includes("#")) {
      return await sock.sendMessage(jid, { text: `❌ Format: *${PREFIX}daftar nama#umur*\nContoh: *${PREFIX}daftar Budi#17*` }, { quoted: m });
    }

    const [name, ageStr] = input.split("#");
    const age = parseInt(ageStr);
    if (!name.trim() || isNaN(age) || age < 1 || age > 100) {
      return await sock.sendMessage(jid, { text: `❌ Umur tidak valid (1-100).` }, { quoted: m });
    }

    const user = registerUser(sender, name.trim(), age);
    await sock.sendMessage(jid, { text: `✅ *Registrasi berhasil!*\nNama: ${user.name}\nUmur: ${user.age}\nKetik *${PREFIX}menu*.` }, { quoted: m });
  }
};
