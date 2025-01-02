export const formatStorage = (num: number | string) => {
  const numValue = typeof num === 'string' ? parseFloat(num) : num;

  const units = ['B', 'KB', 'MB', 'GB'];
  const base = 1024;
  let value = Math.abs(numValue);
  let unitIndex = 0;

  while (value >= base && unitIndex < units.length - 1) {
    value /= base;
    unitIndex++;
  }

  // Format with at most 2 decimal places and remove trailing zeros
  const formattedValue = Number(value.toFixed(2)).toString();
  return `${formattedValue} ${units[unitIndex]}`;
};
