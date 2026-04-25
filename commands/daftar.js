module.exports = {
  name: "daftar",
  aliases: ["register"],
  description: "Mendaftarkan identitas Anda ke database bot untuk mengakses seluruh fitur.",
  async execute(sock, m, args, { jid, sender, isRegistered, getUser, registerUser, PREFIX }) {
    if (isRegistered(sender)) {
      const u = getUser(sender);
      return await sock.sendMessage(jid, { text: `✅ *SUDAH TERDAFTAR*\n\nAnda sudah terdaftar di database kami sebagai *${u.name}* (${u.age} Tahun).` }, { quoted: m });
    }

    const input = args.join(" "); 
    if (!input || !input.includes("#")) {
      return await sock.sendMessage(jid, { 
          text: `❌ *FORMAT SALAH*\n\nGunakan format: *${PREFIX}daftar nama#umur*\n*Contoh:* ${PREFIX}daftar Budi#17` 
      }, { quoted: m });
    }

    const [name, ageStr] = input.split("#");
    const age = parseInt(ageStr);
    if (!name.trim() || isNaN(age) || age < 1 || age > 100) {
      return await sock.sendMessage(jid, { text: `❌ *UMUR TIDAK VALID*\n\nSilakan masukkan umur yang valid (antara 1 hingga 100 tahun).` }, { quoted: m });
    }

    const user = registerUser(sender, name.trim(), age);
    await sock.sendMessage(jid, { 
        text: `✨ *REGISTRASI BERHASIL*\n\nSelamat! Identitas Anda telah tersimpan di database kami.\n\n👤 *Nama:* ${user.name}\n🎂 *Umur:* ${user.age} Tahun\n\n────────────────────\n_Ketik *${PREFIX}menu* untuk melihat daftar perintah._` 
    }, { quoted: m });
  }
};
