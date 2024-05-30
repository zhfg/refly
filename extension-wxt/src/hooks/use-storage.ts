import { useEffect, useState } from "react";
import { Storage } from "wxt/browser";
import { storage } from "wxt/storage";

export const useStorage = <T>(
  key: string,
  defaultVal: T,
  location: "local" | "sync" | "session" | "managed" = "local"
): [T, (val: T) => void] => {
  const [storageValue, setStorageValue] = useState<T>(defaultVal);

  console.log("key", key, location);
  // const storageItem = storage.defineItem<T>(`local:showChangelogOnUpdate}`, {
  //   defaultValue: defaultVal,
  // });
  // console.log("storage", storageItem);

  const syncStorageValue = async (newStorageValue: T) => {
    // await storageItem.setValue(newStorageValue);
    setStorageValue(newStorageValue);
  };

  useEffect(() => {
    browser.storage.sync.onChanged.addListener(
      (changes: Storage.StorageAreaSyncOnChangedChangesType) => {
        console.log("changes");
      }
    );
    // storageItem.watch((newValue) => setStorageValue(newValue));
  }, []);

  return [storageValue, syncStorageValue];
};
