
class MessageBuilder {
  static _cache = new Map();

  static register(name, templateFn) {
    MessageBuilder._cache.set(name, templateFn);
  }

  static build(name, vars = {}) {
    const templateFn = MessageBuilder._cache.get(name);
    if (!templateFn) {
      console.warn(`⚠️ Template "${name}" not found`);
      return "";
    }
    return templateFn(vars);
  }

  static MAINTENANCE = `⚠️ *PEMELIHARAAN SISTEM*\n\nServer kami sedang dalam masa pembaruan. Kami akan segera kembali online. Terima kasih atas kesabaran Anda.`;

  static BANNED = `❌ *AKSES DIBATASI*\n\nAkun Anda telah dibatasi dari penggunaan layanan ini karena adanya pelanggaran kebijakan.`;

  static INTERNAL_ERROR = `❌ *KESALAHAN INTERNAL*\n\nTerjadi kesalahan tak terduga saat menjalankan perintah. Silakan lapor ke administrator jika masalah berlanjut.`;

  static rateLimit(sender) {
    return `⚠️ *RATE LIMIT TERDETEKSI*\n\nMaaf @${sender.split("@")[0]}, Anda telah mencapai batas penggunaan (10 perintah/menit). Silakan coba lagi dalam beberapa saat agar bot tetap aman.`;
  }

  static registerRequired(prefix) {
    return (
      `📝 *REGISTRASI DIPERLUKAN*\n\n` +
      `Anda belum terdaftar di database kami. Silakan selesaikan proses registrasi di bawah ini:\n\n` +
      `┌─────────────────\n` +
      `│ Format: *${prefix}daftar nama#umur*\n` +
      `│ Contoh: *${prefix}daftar Budi#17*\n` +
      `└─────────────────\n\n` +
      `_Registrasi gratis dan hanya memakan waktu beberapa detik._`
    );
  }

  static antiLinkWarn(sender) {
    return `🚫 *PERINGATAN KEAMANAN*\n\nLink terdeteksi dari @${sender.split("@")[0]}. Akses dicabut demi menjaga keamanan grup.`;
  }
}

module.exports = { MessageBuilder };
