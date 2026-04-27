const blackjackEngine = require("../utils/blackjackEngine");
const { getUserRPG, updateUserRPG } = require("../database/rpg_db");
const { MessageBuilder } = require("../utils/messageBuilder");

// In-memory game storage
const blackjackGames = {};

module.exports = {
  name: "blackjack",
  aliases: ["bj"],
  async execute(sock, m, args, ctx) {
    const { jid, sender, isGroup, PREFIX, isOwner } = ctx;

    if (!isGroup) {
      return sock.sendMessage(jid, { text: "❌ Perintah ini hanya bisa digunakan di dalam grup!" }, { quoted: m });
    }

    const command = args[0]?.toLowerCase();

    // ─── ACTION HANDLERS (From Buttons) ───
    
    if (command === "join") return handleJoin(sock, m, sender, jid, blackjackGames);
    if (command === "start") return handleStart(sock, m, sender, jid, blackjackGames);
    if (command === "cancel") return handleCancel(sock, m, sender, jid, blackjackGames);
    if (command === "hit") return handleHit(sock, m, sender, jid, blackjackGames);
    if (command === "stand") return handleStand(sock, m, sender, jid, blackjackGames);
    if (command === "double") return handleDouble(sock, m, sender, jid, blackjackGames);

    // ─── INITIALIZATION (New Game) ───

    // Cooldown check
    const userRPG = getUserRPG(sender);
    const now = Date.now();
    const lastBj = userRPG.cooldowns?.blackjack || 0;
    const cooldownTime = 30000;
    if (now - lastBj < cooldownTime && !isOwner) {
      const timeLeft = Math.ceil((cooldownTime - (now - lastBj)) / 1000);
      return sock.sendMessage(jid, { text: `🕒 Cooldown! Tunggu ${timeLeft} detik lagi untuk memulai game baru.` }, { quoted: m });
    }

    if (blackjackGames[jid]) {
      return sock.sendMessage(jid, { text: "❌ Ada permainan yang sedang berjalan di grup ini!" }, { quoted: m });
    }

    const bet = parseInt(args[0]) || 100;
    if (bet < 10) {
      return sock.sendMessage(jid, { text: "❌ Minimal taruhan adalah 10 Gold!" }, { quoted: m });
    }

    // Check money for host
    const user = getUserRPG(sender);
    if (user.money < bet) {
      return sock.sendMessage(jid, { text: `❌ Saldo kamu tidak cukup! Kamu butuh ${bet} Gold, saldo kamu saat ini: ${user.money} Gold.` }, { quoted: m });
    }

    // Update cooldown
    userRPG.cooldowns = userRPG.cooldowns || {};
    userRPG.cooldowns.blackjack = now;
    updateUserRPG(sender, { cooldowns: userRPG.cooldowns });

    // Create game state
    blackjackGames[jid] = {
      host: sender,
      players: [sender],
      deck: blackjackEngine.createDeck(),
      dealer: [],
      hands: {
        [sender]: {
          cards: [],
          total: 0,
          status: "active",
          busted: false,
          bet: bet,
          extraTurn: 0
        }
      },
      turnIndex: 0,
      started: false,
      finished: false,
      bet: bet,
      createdAt: Date.now(),
      timeout: null
    };

    const text = `🃏 *BLACKJACK MULTIPLAYER* 🃏\n\n` +
      `👤 *Host:* @${sender.split("@")[0]}\n` +
      `💰 *Taruhan:* ${bet} Gold\n` +
      `👥 *Players:* 1/10\n\n` +
      `Silakan klik tombol di bawah untuk bergabung! Game akan dimulai otomatis jika sudah 10 player atau Host menekan START.`;

    const buttons = [
      {
        name: "quick_reply",
        buttonParamsJson: JSON.stringify({
          display_text: "JOIN ➕",
          id: `${PREFIX}blackjack join`
        })
      },
      {
        name: "quick_reply",
        buttonParamsJson: JSON.stringify({
          display_text: "START ▶️",
          id: `${PREFIX}blackjack start`
        })
      },
      {
        name: "quick_reply",
        buttonParamsJson: JSON.stringify({
          display_text: "CANCEL ❌",
          id: `${PREFIX}blackjack cancel`
        })
      }
    ];

    await sock.sendMessage(jid, {
      interactiveMessage: {
        title: text,
        footer: "Raviel Blackjack System",
        buttons: buttons
      },
      mentions: [sender]
    }, { quoted: m });
  }
};

// ─── HELPER FUNCTIONS ───

async function handleJoin(sock, m, sender, jid, games) {
  const game = games[jid];
  if (!game) return;
  if (game.started) return sock.sendMessage(jid, { text: "❌ Game sudah dimulai!" }, { quoted: m });
  if (game.players.includes(sender)) return sock.sendMessage(jid, { text: "❌ Kamu sudah bergabung!" }, { quoted: m });
  if (game.players.length >= 10) return sock.sendMessage(jid, { text: "❌ Player sudah penuh (Max 10)!" }, { quoted: m });

  const user = getUserRPG(sender);
  if (user.money < game.bet) {
    return sock.sendMessage(jid, { text: `❌ Saldo kamu tidak cukup! Kamu butuh ${game.bet} Gold.` }, { quoted: m });
  }

  game.players.push(sender);
  game.hands[sender] = {
    cards: [],
    total: 0,
    status: "active",
    busted: false,
    bet: game.bet,
    extraTurn: 0
  };

  const text = `✅ @${sender.split("@")[0]} bergabung!\n👥 *Players:* ${game.players.length}/10`;
  await sock.sendMessage(jid, { text, mentions: [sender] }, { quoted: m });
}

async function handleCancel(sock, m, sender, jid, games) {
  const game = games[jid];
  if (!game) return;
  if (game.host !== sender) return sock.sendMessage(jid, { text: "❌ Hanya Host yang bisa membatalkan room!" }, { quoted: m });
  if (game.started) return sock.sendMessage(jid, { text: "❌ Game sudah berjalan!" }, { quoted: m });

  delete games[jid];
  await sock.sendMessage(jid, { text: "⚠️ Room Blackjack telah dibatalkan oleh Host." }, { quoted: m });
}

async function handleStart(sock, m, sender, jid, games) {
  const game = games[jid];
  if (!game) return;
  if (game.host !== sender) return sock.sendMessage(jid, { text: "❌ Hanya Host yang bisa memulai game!" }, { quoted: m });
  if (game.started) return;
  if (game.players.length < 1) return sock.sendMessage(jid, { text: "❌ Butuh minimal 1 player untuk memulai!" }, { quoted: m });

  game.started = true;

  // Potong uang player
  for (const p of game.players) {
    const user = getUserRPG(p);
    updateUserRPG(p, { money: user.money - game.bet });
  }

  // Bagi kartu
  game.dealer = [game.deck.pop(), game.deck.pop()];
  for (const p of game.players) {
    game.hands[p].cards = [game.deck.pop(), game.deck.pop()];
    game.hands[p].total = blackjackEngine.calculateTotal(game.hands[p].cards);
    
    // Kirim kartu ke private chat
    const privateText = `🃏 *KARTU KAMU*\n` +
      `${blackjackEngine.formatHand(game.hands[p].cards)}\n` +
      `Total: ${game.hands[p].total}`;
    
    await sock.sendMessage(p, { text: privateText }).catch(() => {
      sock.sendMessage(jid, { text: `⚠️ Gagal mengirim kartu ke @${p.split("@")[0]} via DM. Pastikan bot tidak diblokir!`, mentions: [p] });
    });
  }

  await announceTurn(sock, jid, games);
}

async function announceTurn(sock, jid, games) {
  const game = games[jid];
  if (!game) return;

  const currentPlayer = game.players[game.turnIndex];
  const hand = game.hands[currentPlayer];

  if (hand.status === "stand") {
    return nextTurn(sock, jid, games);
  }

  const text = `🔔 *GILIRAN:* @${currentPlayer.split("@")[0]}\n\n` +
    `🎩 *Dealer:* ${blackjackEngine.formatCard(game.dealer[0])} [ ? ]\n` +
    `👤 *Player Card:* Private Chat\n` +
    `💰 *Bet:* ${hand.bet} Gold\n` +
    `${hand.busted ? "⚠️ *STATUS: BUSTED (>21)* (Sisa 2 aksi lagi)" : ""}\n\n` +
    `Waktu: 30 detik.`;

  const buttons = [
    {
      name: "quick_reply",
      buttonParamsJson: JSON.stringify({
        display_text: "HIT 🃏",
        id: `${PREFIX}blackjack hit`
      })
    },
    {
      name: "quick_reply",
      buttonParamsJson: JSON.stringify({
        display_text: "STAND 🛑",
        id: `${PREFIX}blackjack stand`
      })
    },
    {
      name: "quick_reply",
      buttonParamsJson: JSON.stringify({
        display_text: "DOUBLE 💰",
        id: `${PREFIX}blackjack double`
      })
    }
  ];

  // Set timeout
  if (game.timeout) clearTimeout(game.timeout);
  game.timeout = setTimeout(async () => {
    if (games[jid]) {
      await sock.sendMessage(jid, { text: `⏰ Waktu habis! @${currentPlayer.split("@")[0]} otomatis STAND.`, mentions: [currentPlayer] });
      await handleStand(sock, null, currentPlayer, jid, games);
    }
  }, 30000);

  await sock.sendMessage(jid, {
    interactiveMessage: {
      title: text,
      footer: "Klik tombol untuk bertindak",
      buttons: buttons
    },
    mentions: [currentPlayer]
  });
}

async function handleHit(sock, m, sender, jid, games) {
  const game = games[jid];
  if (!game || !game.started || game.finished) return;

  const currentPlayer = game.players[game.turnIndex];
  if (sender !== currentPlayer) return;

  const hand = game.hands[sender];
  hand.cards.push(game.deck.pop());
  hand.total = blackjackEngine.calculateTotal(hand.cards);

  if (hand.total > 21) {
    if (!hand.busted) {
      hand.busted = true;
    } else {
      hand.extraTurn++;
    }
  }

  // Update private chat
  const privateText = `🃏 *KARTU KAMU (UPDATE)*\n` +
    `${blackjackEngine.formatHand(hand.cards)}\n` +
    `Total: ${hand.total}\n` +
    `${hand.busted ? "⚠️ *BUSTED!* Total melebihi 21." : ""}`;
  
  await sock.sendMessage(sender, { text: privateText }).catch(() => {});

  if (hand.extraTurn >= 2) {
    await sock.sendMessage(jid, { text: `💀 @${sender.split("@")[0]} sudah mencapai limit aksi setelah BUST. Otomatis STAND.`, mentions: [sender] });
    return handleStand(sock, m, sender, jid, games);
  }

  await announceTurn(sock, jid, games);
}

async function handleStand(sock, m, sender, jid, games) {
  const game = games[jid];
  if (!game || !game.started || game.finished) return;

  const currentPlayer = game.players[game.turnIndex];
  if (sender !== currentPlayer) return;

  game.hands[sender].status = "stand";
  await nextTurn(sock, jid, games);
}

async function handleDouble(sock, m, sender, jid, games) {
  const game = games[jid];
  if (!game || !game.started || game.finished) return;

  const currentPlayer = game.players[game.turnIndex];
  if (sender !== currentPlayer) return;

  const hand = game.hands[sender];
  const user = getUserRPG(sender);

  if (user.money < hand.bet) {
    return sock.sendMessage(jid, { text: "❌ Saldo tidak cukup untuk Double!" });
  }

  // Potong tambahan bet
  updateUserRPG(sender, { money: user.money - hand.bet });
  hand.bet *= 2;

  // Ambil 1 kartu
  hand.cards.push(game.deck.pop());
  hand.total = blackjackEngine.calculateTotal(hand.cards);

  if (hand.total > 21) {
    hand.busted = true;
    hand.extraTurn++;
  }

  // Update private chat
  const privateText = `🃏 *KARTU KAMU (DOUBLE)*\n` +
    `${blackjackEngine.formatHand(hand.cards)}\n` +
    `Total: ${hand.total}\n` +
    `Bet: ${hand.bet} Gold`;
  
  await sock.sendMessage(sender, { text: privateText }).catch(() => {});

  if (hand.extraTurn >= 2) {
    return handleStand(sock, m, sender, jid, games);
  }

  await announceTurn(sock, jid, games);
}

async function nextTurn(sock, jid, games) {
  const game = games[jid];
  if (!game) return;

  game.turnIndex++;

  if (game.turnIndex >= game.players.length) {
    // Dealer Turn & End Game
    await handleDealerTurn(sock, jid, games);
  } else {
    await announceTurn(sock, jid, games);
  }
}

async function handleDealerTurn(sock, jid, games) {
  const game = games[jid];
  if (game.timeout) clearTimeout(game.timeout);

  let dealerTotal = blackjackEngine.calculateTotal(game.dealer);

  // Dealer draws until 17
  while (dealerTotal < 17) {
    game.dealer.push(game.deck.pop());
    dealerTotal = blackjackEngine.calculateTotal(game.dealer);
  }

  await showResult(sock, jid, games);
}

async function showResult(sock, jid, games) {
  const game = games[jid];
  const dealerTotal = blackjackEngine.calculateTotal(game.dealer);
  const dealerBusted = dealerTotal > 21;

  let resultText = `🏁 *HASIL BLACKJACK*\n\n`;
  resultText += `🎩 *Dealer:* ${blackjackEngine.formatHand(game.dealer)} (${dealerTotal})\n`;
  resultText += `────────────────────\n\n`;

  let winners = [];
  const mentions = [...game.players];

  for (const p of game.players) {
    const hand = game.hands[p];
    const playerTotal = hand.total;
    const playerBusted = hand.busted;
    let status = "";
    let winAmount = 0;

    if (playerBusted) {
      status = "💀 (BUSTED)";
    } else if (dealerBusted || playerTotal > dealerTotal) {
      status = "✅ (WIN)";
      winAmount = Math.floor(hand.bet * 2);
    } else if (playerTotal === dealerTotal) {
      status = "🤝 (PUSH)";
      winAmount = hand.bet;
    } else {
      status = "❌ (LOSE)";
    }

    resultText += `👤 @${p.split("@")[0]} → ${playerTotal} ${status}\n`;

    if (winAmount > 0) {
      const user = getUserRPG(p);
      updateUserRPG(p, { money: user.money + winAmount });
      winners.push({ jid: p, amount: winAmount });
    }
  }

  resultText += `\n🏆 *PEMENANG:*\n`;
  if (winners.length > 0) {
    winners.forEach(w => {
      resultText += `@${w.jid.split("@")[0]} (+${w.amount} Gold)\n`;
    });
  } else {
    resultText += `Dealer menang!\n`;
  }

  await sock.sendMessage(jid, { text: resultText, mentions }, { quoted: null });
  delete games[jid];
}
