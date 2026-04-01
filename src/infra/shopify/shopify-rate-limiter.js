class ShopifyRateLimiter {
  constructor({
    safeRemainingBudget = 80,
    defaultRestoreRate = 50,
    defaultCurrentlyAvailable = 1000
  } = {}) {
    this.safeRemainingBudget = safeRemainingBudget;
    this.defaultRestoreRate = defaultRestoreRate;
    this.defaultCurrentlyAvailable = defaultCurrentlyAvailable;
    this.shops = new Map();
  }

  ensureShop(shop) {
    if (!this.shops.has(shop)) {
      this.shops.set(shop, {
        currentlyAvailable: this.defaultCurrentlyAvailable,
        restoreRate: this.defaultRestoreRate,
        maximumAvailable: 1000,
        updatedAt: Date.now()
      });
    }
    return this.shops.get(shop);
  }

  refill(shopState) {
    const now = Date.now();
    const elapsedSeconds = Math.max(0, (now - shopState.updatedAt) / 1000);
    const restored = elapsedSeconds * shopState.restoreRate;

    shopState.currentlyAvailable = Math.min(
      shopState.maximumAvailable,
      shopState.currentlyAvailable + restored
    );
    shopState.updatedAt = now;
  }

  async waitForBudget(shop, estimatedCost = 50) {
    const state = this.ensureShop(shop);
    this.refill(state);

    const required = estimatedCost + this.safeRemainingBudget;

    if (state.currentlyAvailable >= required) {
      state.currentlyAvailable -= estimatedCost;
      return;
    }

    const deficit = required - state.currentlyAvailable;
    const waitMs = Math.ceil((deficit / Math.max(1, state.restoreRate)) * 1000);

    await new Promise((resolve) => setTimeout(resolve, waitMs));

    this.refill(state);
    state.currentlyAvailable = Math.max(0, state.currentlyAvailable - estimatedCost);
  }

  updateFromGraphQLThrottle(shop, throttleStatus) {
    if (!throttleStatus) return;

    const state = this.ensureShop(shop);
    state.maximumAvailable = throttleStatus.maximumAvailable || state.maximumAvailable;
    state.currentlyAvailable = throttleStatus.currentlyAvailable ?? state.currentlyAvailable;
    state.restoreRate = throttleStatus.restoreRate || state.restoreRate;
    state.updatedAt = Date.now();
  }

  penalize(shop) {
    const state = this.ensureShop(shop);
    state.currentlyAvailable = Math.max(0, state.currentlyAvailable * 0.5);
    state.updatedAt = Date.now();
  }

  snapshot(shop) {
    return this.ensureShop(shop);
  }
}

module.exports = { ShopifyRateLimiter };
