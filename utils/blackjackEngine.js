/**
 * Blackjack Engine for Raviel Bot
 * Handles deck creation, shuffling, and hand calculations.
 */

class BlackjackEngine {
  constructor() {
    this.suits = ["♠", "♥", "♦", "♣"];
    this.values = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
  }

  createDeck() {
    let deck = [];
    for (let suit of this.suits) {
      for (let value of this.values) {
        deck.push({ suit, value });
      }
    }
    return this.shuffle(deck);
  }

  shuffle(deck) {
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
  }

  calculateTotal(cards) {
    let total = 0;
    let aces = 0;

    for (let card of cards) {
      if (card.value === "A") {
        aces += 1;
        total += 11;
      } else if (["J", "Q", "K"].includes(card.value)) {
        total += 10;
      } else {
        total += parseInt(card.value);
      }
    }

    while (total > 21 && aces > 0) {
      total -= 10;
      aces -= 1;
    }

    return total;
  }

  formatCard(card) {
    return `[ ${card.value}${card.suit} ]`;
  }

  formatHand(cards) {
    return cards.map(c => this.formatCard(c)).join(" ");
  }

  isBlackjack(cards) {
    return cards.length === 2 && this.calculateTotal(cards) === 21;
  }
}

module.exports = new BlackjackEngine();
