export const getExtensionVersion = () => {
  return chrome.runtime.getManifest().version
}
