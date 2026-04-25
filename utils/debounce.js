
class Debouncer {
  constructor(func, delay = 500) {
    this.func = func;
    this.delay = delay;
    this.timeoutId = null;
    this.isPending = false;
  }

  execute(...args) {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }

    this.isPending = true;
    this.timeoutId = setTimeout(() => {
      try {
        this.func(...args);
      } catch (err) {
        console.error("Debounce error:", err.message);
      }
      this.isPending = false;
      this.timeoutId = null;
    }, this.delay);
  }

  flush() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.isPending = true;
      this.func();
      this.isPending = false;
      this.timeoutId = null;
    }
  }

  cancel() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.isPending = false;
      this.timeoutId = null;
    }
  }
}

class Throttler {
  constructor(func, delay = 500) {
    this.func = func;
    this.delay = delay;
    this.lastCall = 0;
  }

  execute(...args) {
    const now = Date.now();
    if (now - this.lastCall >= this.delay) {
      this.lastCall = now;
      return this.func(...args);
    }
  }
}

module.exports = {Debouncer, Throttler};
