// Mock das APIs do Chrome que não existem no jsdom
globalThis.chrome = {
  runtime: {
    sendMessage: () => Promise.resolve({ ok: true, data: null }),
    onMessage:   { addListener: () => {} },
    getURL:      (path) => `chrome-extension://fake-id/${path}`,
  },
  tabs: {
    query:       () => Promise.resolve([{ id: 1, url: 'https://www.reclameaqui.com.br/empresa-teste/' }]),
    create:      () => Promise.resolve({ id: 2 }),
    sendMessage: () => Promise.resolve({}),
    onActivated: { addListener: () => {} },
    onUpdated:   { addListener: () => {} },
  },
  storage: {
    local: {
      get:    () => Promise.resolve({}),
      set:    () => Promise.resolve(),
      remove: () => Promise.resolve(),
    },
  },
  alarms: {
    create:       () => {},
    clearAll:     () => Promise.resolve(),
    onAlarm:      { addListener: () => {} },
  },
  notifications: {
    create: () => {},
    onButtonClicked: { addListener: () => {} },
  },
  sidePanel: {
    open: () => Promise.resolve(),
  },
  windows: {
    update: () => Promise.resolve(),
  },
}
