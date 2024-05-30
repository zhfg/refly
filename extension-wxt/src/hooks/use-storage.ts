import { useEffect, useState } from "react";
import { Storage } from "wxt/browser";
import { storage } from "wxt/storage";

export const useStorage = <T>(
  key: string,
  defaultVal: T,
  location: "local" | "sync" | "session" | "managed" = "local"
): [T, (val: T) => void] => {
  const [storageValue, setStorageValue] = useState<T>(defaultVal);
  const storageItem = storage.defineItem<T>(`${location}:${key}`, {
    defaultValue: defaultVal,
  });

  const syncStorageValue = async (newStorageValue: T) => {
    await storageItem.setValue(newStorageValue);
    setStorageValue(newStorageValue);
  };

  useEffect(() => {
    storageItem.watch((newValue) => setStorageValue(newValue));
  }, []);

  return [storageValue, syncStorageValue];
};
