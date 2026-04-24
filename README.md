# RAVIEL BOT - WhatsApp Bot Interaktif

Bot WhatsApp interaktif menggunakan library Baileys dengan fitur menu list, registrasi user, dan penanganan session yang stabil.

## ✨ Fitur
- **Interactive Menu:** Menggunakan tombol list selector (single select) yang rapi.
- **User Registration:** Sistem pendaftaran user (Nama & Umur) berbasis JSON database.
- **Pairing Code:** Mendukung koneksi via kode pairing (cocok untuk hosting panel seperti Wispbyte).
- **Fast Response:** Optimalisasi event loop untuk respon yang lebih cepat.
- **Clean Logs:** Hanya menampilkan command yang diproses di terminal.

## 🚀 Cara Install & Jalankan

### 1. Persiapan
Pastikan kamu sudah menginstal [Node.js](https://nodejs.org/) v20 atau lebih tinggi.

### 2. Clone Repository
```bash
git clone https://github.com/USERNAME/REPO_NAME.git
cd RAVIEL-BOT
```

### 3. Instal Dependensi
```bash
npm install
```

### 4. Konfigurasi
Buat file `.env` di direktori utama:
```env
BOT_NAME=RAVIEL BOT
OWNER_NAME=NamaKamu
OWNER_NUMBER=628xxx
PAIRING_NUMBER=628xxx
```

### 5. Jalankan Bot
```bash
node index.js
```

## 📝 Catatan
- Folder `auth/` berisi session WhatsApp kamu, jangan pernah dibagikan.
- File `.env` berisi data sensitif, pastikan tetap berada dalam `.gitignore`.

## 👑 Credits
- [Baileys](https://github.com/adiwajshing/Baileys)
- Dev: ShDitz
