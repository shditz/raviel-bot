const axios = require("axios");

const GEMINI_API = "https://puruboy-api.vercel.app/api/ai/gemini-v2";

// Cache untuk soal yang sudah pernah diberikan (maksimal 100 soal per kategori)
const usedQuestions = {
  tebakkata: new Set(),
  kuis: new Set(),
};

const MAX_CACHE_SIZE = 100;

// Fungsi untuk generate unique question
async function generateUniqueQuestion(cmd, isRetry = false) {
  let prompt = "";
  let maxRetries = 3;
  let attempts = 0;

  while (attempts < maxRetries) {
    attempts++;

    if (cmd === "tebakkata") {
      prompt =
        'Berikan satu kata untuk permainan tebak kata dalam bahasa Indonesia. Berikan petunjuknya yang menantang namun masuk akal, dan berikan jawabannya. Balas HANYA dengan format JSON: {"word": "...", "hint": "...", "answer": "..."}. Pastikan jawabannya adalah kata dasar atau kata yang umum.';
    } else if (cmd === "kuis") {
      prompt =
        'Berikan satu pertanyaan kuis pengetahuan umum yang menarik beserta jawabannya. Balas HANYA dengan format JSON: {"question": "...", "answer": "..."}.';
    }

    if (isRetry) {
      prompt +=
        " PENTING: Jangan gunakan soal yang sudah ada sebelumnya. Berikan soal yang BENAR-BENAR BARU dan berbeda!";
    }

    try {
      const response = await axios.post(GEMINI_API, {prompt});
      const dataStr = response.data.result?.answer || "";

      const jsonMatch = dataStr.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("Invalid JSON response");

      const gameData = JSON.parse(jsonMatch[0]);

      // Tentukan key untuk check duplikat
      let questionKey = "";
      if (cmd === "tebakkata") {
        questionKey = (gameData.answer || gameData.word).toLowerCase().trim();
      } else if (cmd === "kuis") {
        questionKey = gameData.question.toLowerCase().trim();
      }

      // Cek apakah soal sudah pernah digunakan
      if (usedQuestions[cmd].has(questionKey)) {
        // Jika ini attempt pertama, retry dengan flag
        if (attempts < maxRetries) {
          console.log(`[MINIGAME] Duplikat ${cmd} terdeteksi, generating ulang...`);
          continue; // Retry dengan isRetry = true logic
        }
      }

      // Soal baru, tambahkan ke cache
      usedQuestions[cmd].add(questionKey);

      // Maintain cache size
      if (usedQuestions[cmd].size > MAX_CACHE_SIZE) {
        const firstItem = usedQuestions[cmd].values().next().value;
        usedQuestions[cmd].delete(firstItem);
      }

      return gameData;
    } catch (err) {
      console.error(`[MINIGAME] Error generating ${cmd}:`, err.message);
      if (attempts < maxRetries) continue;
      throw err;
    }
  }

  throw new Error("Gagal generate soal unik setelah beberapa kali coba");
}

// Fungsi untuk set timeout game dengan delay yang tepat
function setGameTimeout(sock, jid, gameSessions, timeoutMs = 90000) {
  const timeoutId = setTimeout(() => {
    if (gameSessions.has(jid)) {
      const session = gameSessions.get(jid);
      sock.sendMessage(jid, {
        text: `⏰ *WAKTU HABIS!*\n\nSayang sekali, tidak ada yang menjawab dengan benar.\n\n✅ *Jawaban:* *${session.answer.toUpperCase()}*`,
      });
      gameSessions.delete(jid);
    }
  }, timeoutMs);

  // Simpan timeout ID agar bisa dibatalkan jika ada jawaban benar
  if (!gameSessions.has(jid)) {
    gameSessions.set(jid, {timeoutId});
  } else {
    gameSessions.get(jid).timeoutId = timeoutId;
  }
}

module.exports = {
  name: "minigame",
  aliases: ["tebakkata", "kuis", "tebakgambar"],
  description:
    "Kategori permainan interaktif: Tebak Kata, Kuis Pengetahuan Umum, dan Tebak Gambar AI.",
  async execute(sock, m, args, {jid, gameSessions, PREFIX, cmd}) {
    if (gameSessions.has(jid)) {
      return await sock.sendMessage(
        jid,
        {
          text: "⚠️ *GAME MASIH BERJALAN*\n\nMasih ada permainan yang sedang berlangsung di chat ini! Selesaikan terlebih dahulu atau tunggu hingga waktu habis.",
        },
        {quoted: m},
      );
    }

    await sock.sendMessage(
      jid,
      {
        text: "🎮 *MENYIAPKAN PERMAINAN...*\n\nMohon tunggu sebentar, sistem sedang merancang tantangan seru untuk Anda.",
      },
      {quoted: m},
    );

    try {
      let gameData;

      // Generate unique questions untuk tebakkata dan kuis, regular untuk tebakgambar
      if (cmd === "tebakkata" || cmd === "kuis") {
        gameData = await generateUniqueQuestion(cmd);
      } else if (cmd === "tebakgambar") {
        const prompt =
          'Berikan satu kata benda (objek tunggal) yang unik dan menarik untuk permainan tebak gambar, beserta jawabannya. Balas HANYA dengan format JSON: {"object": "...", "answer": "..."}. Contoh: \'Candi Borobudur\', \'Menara Eiffel\', \'Komodo\'.';

        const response = await axios.post(GEMINI_API, {prompt});
        const dataStr = response.data.result?.answer || "";

        const jsonMatch = dataStr.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error("Gagal memproses respons AI");

        gameData = JSON.parse(jsonMatch[0]);
      }

      if (cmd === "tebakkata") {
        const answer = (gameData.answer || gameData.word).trim();
        gameSessions.set(jid, {
          answer: answer.toLowerCase(),
          startTime: Date.now(),
        });

        const letters = answer.split("");
        const visibleCount = Math.max(1, Math.floor(answer.length * 0.3));
        const visibleIndices = new Set([0]);

        let attempts = 0;
        while (visibleIndices.size < visibleCount && attempts < 20) {
          visibleIndices.add(Math.floor(Math.random() * answer.length));
          attempts++;
        }

        const clue = letters
          .map((char, index) => {
            if (char === " ") return " ";
            return visibleIndices.has(index) ? char : "-";
          })
          .join(" ");

        await sock.sendMessage(
          jid,
          {
            text:
              `🧩 *TEBAK KATA*\n\n` +
              `💡 *Petunjuk:* _${gameData.hint}_\n` +
              `📝 *Clue:* \`${clue.toUpperCase()}\`\n\n` +
              `────────────────────\n` +
              `*Ketik jawaban Anda langsung tanpa awalan simbol!*`,
          },
          {quoted: m},
        );

        // SET TIMEOUT SETELAH PERTANYAAN DIKIRIM
        setGameTimeout(sock, jid, gameSessions, 90000);
      } else if (cmd === "kuis") {
        gameSessions.set(jid, {
          answer: gameData.answer.toLowerCase(),
          startTime: Date.now(),
        });

        await sock.sendMessage(
          jid,
          {
            text:
              `❓ *KUIS PENGETAHUAN UMUM*\n\n` +
              `💬 *Pertanyaan:* \n*${gameData.question}*\n\n` +
              `────────────────────\n` +
              `*Ketik jawaban Anda langsung tanpa awalan simbol!*`,
          },
          {quoted: m},
        );

        // SET TIMEOUT SETELAH PERTANYAAN DIKIRIM
        setGameTimeout(sock, jid, gameSessions, 90000);
      } else if (cmd === "tebakgambar") {
        const object = gameData.object || gameData.answer;

        const responseFlux = await axios.post(
          "https://puruboy-api.vercel.app/api/ai/flux",
          {prompt: object},
          {responseType: "stream"},
        );

        let resultJsonUrl = "";
        await new Promise((resolve, reject) => {
          let timeout = setTimeout(() => resolve(), 30000);
          responseFlux.data.on("data", (chunk) => {
            const text = chunk.toString();
            if (text.includes("[true]")) {
              resultJsonUrl = text.split("[true]")[1].trim();
              clearTimeout(timeout);
              resolve();
            }
          });
          responseFlux.data.on("end", () => resolve());
          responseFlux.data.on("error", (err) => reject(err));
        });

        if (!resultJsonUrl) throw new Error("Gagal mendapatkan URL gambar.");

        const resJson = await axios.get(resultJsonUrl);
        const finalImageUrl = resJson.data.result.url;

        const responseImg = await axios.get(finalImageUrl, {responseType: "arraybuffer"});
        const buffer = Buffer.from(responseImg.data);

        gameSessions.set(jid, {
          answer: object.toLowerCase(),
          startTime: Date.now(),
        });

        const letters = object.split("");
        const visibleCount = Math.max(1, Math.floor(object.length * 0.3));
        const visibleIndices = new Set([0]);
        let attempts = 0;
        while (visibleIndices.size < visibleCount && attempts < 20) {
          visibleIndices.add(Math.floor(Math.random() * object.length));
          attempts++;
        }
        const clue = letters
          .map((char, index) => {
            if (char === " ") return " ";
            return visibleIndices.has(index) ? char : "-";
          })
          .join(" ");

        await sock.sendMessage(
          jid,
          {
            image: buffer,
            caption:
              `🖼️ *TEBAK GAMBAR AI*\n\n` +
              `🤔 *Siapakah/Apakah objek pada gambar di atas?*\n` +
              `📝 *Clue:* \`${clue.toUpperCase()}\`\n\n` +
              `────────────────────\n` +
              `*Ketik jawaban Anda langsung tanpa awalan simbol!*`,
          },
          {quoted: m},
        );

        // SET TIMEOUT SETELAH GAMBAR DIKIRIM
        setGameTimeout(sock, jid, gameSessions, 120000);
      }
    } catch (err) {
      console.error(err);
      await sock.sendMessage(
        jid,
        {
          text: "❌ *GAGAL MENYIAPKAN GAME*\n\nTerjadi kendala saat menghubungi server permainan. Silakan coba beberapa saat lagi!",
        },
        {quoted: m},
      );
    }
  },
};
