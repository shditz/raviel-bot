const { getUserRPG, updateUserRPG, updateInventory, getMarket, addMarketItem, removeMarketItem } = require("../database/rpg_db");
const { ITEMS } = require("../utils/rpg_core");
const { v4: uuidv4 } = require('uuid'); // We will use simple Math.random if uuid isn't available

function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

module.exports = {
  name: "market",
  aliases: ["trade", "sellitem", "buyitem"],
  async execute(sock, m, args, ctx) {
    const { jid, sender, cmd, PREFIX, getUser } = ctx;
    const gUser = getUser(sender) || { name: "Player" };
    const userRPG = getUserRPG(sender, gUser.name);

    if (cmd === "market" || cmd === "trade") {
      const market = getMarket();
      let text = `🛒 *GLOBAL MARKETPLACE* 🛒\n────────────────────\n`;
      
      if (market.length === 0) {
         text += `_Marketplace saat ini sedang kosong. Ayo jual barangmu!_\n`;
      } else {
         market.slice(0, 15).forEach((item, idx) => { // show max 15
            const itemDef = ITEMS[item.itemId];
            text += `[${item.id}] *${itemDef?.name || item.itemId}* x${item.qty}\n   👤 ${item.sellerName} | 💰 Harga: ${item.price} Gold\n`;
         });
         if (market.length > 15) text += `\n_...dan ${market.length - 15} barang lainnya._\n`;
      }

      text += `────────────────────
Gunakan:
- \`${PREFIX}sellitem <item_id> <jumlah> <harga>\`
- \`${PREFIX}buyitem <market_id>\``;
      
      return sock.sendMessage(jid, { text }, { quoted: m });
    }

    if (cmd === "sellitem") {
      if (args.length < 3) {
        return sock.sendMessage(jid, { text: `⚠️ Format salah!\nGunakan: \`${PREFIX}sellitem <item_id> <jumlah> <harga>\`` }, { quoted: m });
      }

      const itemId = args[0].toLowerCase();
      const qty = parseInt(args[1]);
      const price = parseInt(args[2]);

      if (!ITEMS[itemId]) return sock.sendMessage(jid, { text: `⚠️ Item tidak valid!` }, { quoted: m });
      if (isNaN(qty) || qty <= 0) return sock.sendMessage(jid, { text: `⚠️ Jumlah harus angka positif!` }, { quoted: m });
      if (isNaN(price) || price <= 0) return sock.sendMessage(jid, { text: `⚠️ Harga harus angka positif!` }, { quoted: m });
      
      const hasQty = userRPG.inventory[itemId] || 0;
      if (hasQty < qty) return sock.sendMessage(jid, { text: `⚠️ Kamu tidak punya item sebanyak itu!` }, { quoted: m });

      // Potong inventory
      updateInventory(sender, itemId, -qty);

      // Tambah ke market
      const marketId = generateId();
      addMarketItem({
        id: marketId,
        seller: sender,
        sellerName: userRPG.name,
        itemId: itemId,
        qty: qty,
        price: price,
        timestamp: Date.now()
      });

      return sock.sendMessage(jid, { text: `✅ Berhasil menaruh ${qty}x ${ITEMS[itemId].name} di Market dengan ID *${marketId}* seharga ${price} Gold!` }, { quoted: m });
    }

    if (cmd === "buyitem") {
      const targetId = args[0];
      if (!targetId) return sock.sendMessage(jid, { text: `⚠️ Format salah!\nGunakan: \`${PREFIX}buyitem <market_id>\`` }, { quoted: m });

      const market = getMarket();
      const listing = market.find(m => m.id === targetId);

      if (!listing) return sock.sendMessage(jid, { text: `⚠️ Barang dengan ID tersebut tidak ditemukan di Market!` }, { quoted: m });
      
      if (listing.seller === sender) {
         // Claim back
         updateInventory(sender, listing.itemId, listing.qty);
         removeMarketItem(targetId);
         return sock.sendMessage(jid, { text: `📦 Kamu membatalkan jualanmu dan mengambil kembali ${listing.qty}x ${ITEMS[listing.itemId]?.name || listing.itemId}.` }, { quoted: m });
      }

      if (userRPG.money < listing.price) {
        return sock.sendMessage(jid, { text: `⚠️ Uangmu tidak cukup! Butuh ${listing.price} Gold.` }, { quoted: m });
      }

      // Transaksi
      userRPG.money -= listing.price;
      updateUserRPG(sender, { money: userRPG.money });
      updateInventory(sender, listing.itemId, listing.qty);

      // Berikan uang ke penjual (dengan pajak 5%)
      const tax = Math.floor(listing.price * 0.05);
      const netProfit = listing.price - tax;
      const sellerRPG = getUserRPG(listing.seller);
      if (sellerRPG) {
         sellerRPG.money += netProfit;
         updateUserRPG(listing.seller, { money: sellerRPG.money });
      }

      removeMarketItem(targetId);

      return sock.sendMessage(jid, { text: `✅ Berhasil membeli ${listing.qty}x ${ITEMS[listing.itemId]?.name || listing.itemId} seharga ${listing.price} Gold! (Pajak 5% dipotong dari penjual)` }, { quoted: m });
    }
  }
};
