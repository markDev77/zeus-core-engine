class ConcurrencyManager {
  constructor({ globalLimit = 8, perStoreLimit = 2 }) {
    this.globalLimit = globalLimit;
    this.perStoreLimit = perStoreLimit;

    this.globalActive = 0;
    this.storeActive = new Map();
  }

  canRun(shop) {
    const activeForShop = this.storeActive.get(shop) || 0;
    return this.globalActive < this.globalLimit && activeForShop < this.perStoreLimit;
  }

  start(shop) {
    this.globalActive += 1;
    this.storeActive.set(shop, (this.storeActive.get(shop) || 0) + 1);
  }

  finish(shop) {
    this.globalActive = Math.max(0, this.globalActive - 1);

    const current = this.storeActive.get(shop) || 0;
    if (current <= 1) {
      this.storeActive.delete(shop);
    } else {
      this.storeActive.set(shop, current - 1);
    }
  }

  snapshot() {
    return {
      globalLimit: this.globalLimit,
      globalActive: this.globalActive,
      perStoreLimit: this.perStoreLimit,
      storesActive: Object.fromEntries(this.storeActive.entries())
    };
  }
}

module.exports = { ConcurrencyManager };
