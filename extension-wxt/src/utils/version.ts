export const getExtensionVersion = () => {
  return browser.runtime.getManifest().version;
};
