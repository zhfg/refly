import { useEffect, useState } from 'react';
import { storage } from '@refly/ai-workspace-common/utils/storage';
import { safeParseJSON } from '@refly/ai-workspace-common/utils/parse';

export type StorageLocation = 'local' | 'sync' | 'session' | 'managed';

export const useStorage = <T>(
  key: string,
  defaultVal: T,
  location: 'local' | 'sync' | 'session' | 'managed' = 'local',
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
    storageItem.watch((newValue) => {
      console.log('new Syn storage value', newValue);
      setStorageValue(newValue);
    });
  }, []);

  return [storageValue, syncStorageValue];
};

export const handleGetAndWatchValue = async <T>(
  key: string,
  location: StorageLocation = 'local',
  onCallback: (val: T) => void,
) => {
  // 默认对 storage 都序列化
  const val = await storage.getItem(`${location}:${key}`);

  // 可能已经有了，直接设置
  if (val) {
    onCallback(safeParseJSON(val));
  }

  // 否则 watch 更新
  storage.watch(`${location}:${key}`, (newVal: T | null) => {
    onCallback(newVal as T);
  });
};

// just watch some storage and then get notify
export const useWatchStorage = <T>(
  key: string,

  location: StorageLocation = 'local',
): [T | undefined, (val: T) => void] => {
  const [storageValue, setStorageValue] = useState<T>();

  useEffect(() => {
    handleGetAndWatchValue<T>(key, location, (val: T) => setStorageValue(val));
  }, []);

  return [storageValue, setStorageValue];
};
