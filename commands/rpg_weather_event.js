const { WORLD_STATE, updateWorldState } = require("../utils/rpg_core");

module.exports = {
  name: "weather",
  aliases: ["event", "timeevent", "worldstate"],
  async execute(sock, m, args, ctx) {
    const { jid } = ctx;
    
    // Force update
    updateWorldState();

    let text = `🌍 *WORLD STATE* 🌍\n────────────────────\n`;
    
    let weatherEmoji = "☀️";
    if (WORLD_STATE.weather === "Hujan") weatherEmoji = "🌧️";
    if (WORLD_STATE.weather === "Badai") weatherEmoji = "⛈️";
    if (WORLD_STATE.weather === "Malam Berkabut") weatherEmoji = "🌫️";

    text += `${weatherEmoji} *Cuaca Saat Ini:* ${WORLD_STATE.weather}\n\n`;

    if (WORLD_STATE.event) {
       let eventName = WORLD_STATE.event.replace("_", " ").toUpperCase();
       text += `🎉 *EVENT GLOBAL AKTIF:* ${eventName}\n`;
       if (WORLD_STATE.event === "double_exp") text += `_(Semua perolehan EXP digandakan!)_\n`;
       if (WORLD_STATE.event === "boss_invasion") text += `_(Boss liar terlihat di sekitar village!)_\n`;
    } else {
       text += `_Tidak ada event global yang berlangsung._\n`;
    }
    
    text += `────────────────────\n_Sistem cuaca/event akan diperbarui setiap 4 jam secara acak._`;

    return sock.sendMessage(jid, { text }, { quoted: m });
  }
};
