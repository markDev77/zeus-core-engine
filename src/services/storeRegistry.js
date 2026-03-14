/*
========================================
ZEUS STORE REGISTRY
========================================
Guarda las tiendas conectadas
*/

const stores = [];

function registerStore(shop, token) {

  const store = {
    shop,
    token,
    createdAt: new Date()
  };

  stores.push(store);

  console.log("STORE REGISTERED:", shop);

  return store;

}

function getStore(shop) {

  return stores.find(s => s.shop === shop);

}

function getAllStores() {

  return stores;

}

module.exports = {
  registerStore,
  getStore,
  getAllStores
};