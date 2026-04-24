const {default: makeInMemoryStore} = require("@fadzzzdigital-corp/baileys");

module.exports = (config) => {
  const store = makeInMemoryStore(config);
  store?.readFromFile?.(config.store);

  setInterval(() => {
    store?.writeToFile?.(config.store);
  }, 10_000);

  return {
    state: {
      creds: undefined,
      keys: {
        get: async (type, ids) => {
          /* ... */
        },
        set: async (data) => {
          /* ... */
        },
      },
    },
    saveCreds: async (data) => {
      await store?.store?.("creds", data);
    },
  };
};
