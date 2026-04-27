const { getUserRPG, updateUserRPG, updateInventory, getMarket, addMarketItem, removeMarketItem } = require("../database/rpg_db");
const { ITEMS, checkCooldown, setCooldown } = require("../utils/rpg_core");
const { ABUSE_LIMITS } = require("../utils/rpg_advanced");

module.exports = {
  name: "auction",
  aliases: ["sellitem", "buyitem", "cancelmarket", "mylistings"],
  async execute(sock, m, args, ctx) {
    const { jid, sender, cmd, PREFIX, getUser } = ctx;
    const isGroup = jid.endsWith("@g.us");
    const gUser = getUser(sender) || { name: "Player" };
    const userRPG = getUserRPG(sender, gUser.name);

    if (cmd === "sellitem") {
      const cd = checkCooldown(userRPG, "auction_sell");
      if (cd.onCooldown) return sock.sendMessage(jid, { text: `⏳ Cooldown listing: ${cd.time}` }, { quoted: m });

      const itemId = args[0]?.toLowerCase();
      const price = parseInt(args[1]);
      if (!itemId || !price || price < ABUSE_LIMITS.minMarketPrice || price > ABUSE_LIMITS.maxMarketPrice) {
        return sock.sendMessage(jid, { text: `⚠️ Gunakan: \`${PREFIX}sellitem <item_id> <harga>\`\nHarga: ${ABUSE_LIMITS.minMarketPrice}–${ABUSE_LIMITS.maxMarketPrice}` }, { quoted: m });
      }
      if (!ITEMS[itemId]) return sock.sendMessage(jid, { text: `⚠️ Item tidak dikenali!` }, { quoted: m });
      if ((userRPG.inventory[itemId] || 0) < 1) return sock.sendMessage(jid, { text: `⚠️ Kamu tidak memiliki ${ITEMS[itemId].name}!` }, { quoted: m });

      const market = getMarket();
      const myListings = market.filter(l => l.seller === sender);
      if (myListings.length >= ABUSE_LIMITS.maxMarketListings) {
        return sock.sendMessage(jid, { text: `⚠️ Maksimal ${ABUSE_LIMITS.maxMarketListings} listing di market!` }, { quoted: m });
      }

      updateInventory(sender, itemId, -1);
      const listingId = `M${Date.now().toString(36).toUpperCase()}`;
      addMarketItem({ id: listingId, seller: sender, sellerName: userRPG.name, itemId, itemName: ITEMS[itemId].name, price, listedAt: Date.now() });
      setCooldown(sender, "auction_sell");
      return sock.sendMessage(jid, { text: `✅ *ITEM LISTED!*\n\n📦 ${ITEMS[itemId].name}\n💰 Harga: ${price} Gold\n🆔 Listing ID: ${listingId}\n\n_Pajak 5% saat terjual._` }, { quoted: m });
    }

    if (cmd === "buyitem") {
      const cd = checkCooldown(userRPG, "auction_buy");
      if (cd.onCooldown) return sock.sendMessage(jid, { text: `⏳ Cooldown beli: ${cd.time}` }, { quoted: m });

      const listingId = args[0]?.toUpperCase();
      if (!listingId) return sock.sendMessage(jid, { text: `⚠️ Gunakan: \`${PREFIX}buyitem <listing_id>\`` }, { quoted: m });

      const market = getMarket();
      const listing = market.find(l => l.id === listingId);
      if (!listing) return sock.sendMessage(jid, { text: `⚠️ Listing tidak ditemukan!` }, { quoted: m });
      if (listing.seller === sender) return sock.sendMessage(jid, { text: `⚠️ Tidak bisa membeli item sendiri!` }, { quoted: m });
      if (userRPG.money < listing.price) return sock.sendMessage(jid, { text: `⚠️ Gold tidak cukup! (Butuh: ${listing.price}, Punya: ${userRPG.money})` }, { quoted: m });

      userRPG.money -= listing.price;
      updateInventory(sender, listing.itemId, 1);
      const tax = Math.floor(listing.price * 0.05);
      const sellerRPG = getUserRPG(listing.seller);
      sellerRPG.money += (listing.price - tax);
      updateUserRPG(listing.seller, { money: sellerRPG.money });
      removeMarketItem(listingId);
      setCooldown(sender, "auction_buy");
      updateUserRPG(sender, { money: userRPG.money });

      return sock.sendMessage(jid, { text: `✅ *ITEM DIBELI!*\n\n📦 ${listing.itemName}\n💰 Harga: ${listing.price} Gold\n💸 Pajak: ${tax} Gold\n\nPenjual (${listing.sellerName}) menerima ${listing.price - tax} Gold.` }, { quoted: m });
    }

    if (cmd === "cancelmarket") {
      const listingId = args[0]?.toUpperCase();
      if (!listingId) return sock.sendMessage(jid, { text: `⚠️ Gunakan: \`${PREFIX}cancelmarket <listing_id>\`` }, { quoted: m });
      const market = getMarket();
      const listing = market.find(l => l.id === listingId && l.seller === sender);
      if (!listing) return sock.sendMessage(jid, { text: `⚠️ Listing tidak ditemukan atau bukan milikmu!` }, { quoted: m });
      updateInventory(sender, listing.itemId, 1);
      removeMarketItem(listingId);
      return sock.sendMessage(jid, { text: `✅ Listing ${listingId} dibatalkan. ${listing.itemName} dikembalikan ke tas.` }, { quoted: m });
    }

    if (cmd === "mylistings") {
      const market = getMarket();
      const mine = market.filter(l => l.seller === sender);
      if (mine.length === 0) return sock.sendMessage(jid, { text: `📋 Kamu tidak punya listing di market.` }, { quoted: m });
      let text = `🏪 *LISTING KAMU* 🏪\n────────────────────\n`;
      mine.forEach(l => { text += `🆔 ${l.id} | 📦 ${l.itemName} | 💰 ${l.price} Gold\n`; });
      return sock.sendMessage(jid, { text }, { quoted: m });
    }

    // Default: show market
    const market = getMarket();
    if (market.length === 0) {
      return sock.sendMessage(jid, { text: `🏪 *AUCTION HOUSE* 🏪\n────────────────────\nMarket kosong! Jadilah yang pertama menjual.\n\nGunakan: \`${PREFIX}sellitem <item_id> <harga>\`` }, { quoted: m });
    }

    let text = `🏪 *AUCTION HOUSE* 🏪\n────────────────────\n`;
    market.slice(0, 15).forEach(l => {
      text += `🆔 *${l.id}* — 📦 ${l.itemName}\n   💰 ${l.price} Gold | 👤 ${l.sellerName}\n\n`;
    });
    text += `────────────────────\n📋 Total: ${market.length} listing\nBeli: \`${PREFIX}buyitem <id>\`\nJual: \`${PREFIX}sellitem <item> <harga>\``;

    if (isGroup && market.length > 0) {
      const rows = market.slice(0, 10).map(l => ({
        title: `${l.itemName} — ${l.price}G`, id: `${PREFIX}buyitem ${l.id}`,
        description: `Penjual: ${l.sellerName}`
      }));
      return sock.sendMessage(jid, {
        interactiveMessage: { title: text, footer: "Raviel RPG Auction",
          buttons: [{ name: "single_select", buttonParamsJson: JSON.stringify({ title: "🛒 BELI ITEM", sections: [{ title: "LISTINGS", rows }] }) }] }
      }, { quoted: m });
    }
    return sock.sendMessage(jid, { text }, { quoted: m });
  }
};
