let portStore: { [key: string]: any } = {};
export const getPort = async (name: string) => {
  const { browser } = await import('wxt/browser');
  if (portStore?.[name]) return;

  const port = browser.runtime.connect({
    name,
  });
  portStore[name] = port;

  return port;
};

export const removePort = (name: string) => {
  const port = portStore?.[name];

  if (port) {
    port.disconnect();
    delete portStore[name];
  }
};
