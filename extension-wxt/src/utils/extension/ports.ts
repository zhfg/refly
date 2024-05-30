import { Runtime } from "wxt/browser";

let portStore: { [key: string]: Runtime.Port } = {};
export const getPort = (name: string) => {
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
  }
};
