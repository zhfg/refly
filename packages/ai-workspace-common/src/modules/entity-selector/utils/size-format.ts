export const formatStorage = (num: number | string) => {
  const numValue = typeof num === 'string' ? parseFloat(num) : num;
  if (numValue < 1024) {
    return `${numValue} B`;
  } else if (numValue < 1024 * 1024) {
    return `${(numValue / 1024).toFixed(2)} KB`;
  } else if (numValue < 1024 * 1024 * 1024) {
    return `${(numValue / (1024 * 1024)).toFixed(2)} MB`;
  } else {
    return `${(numValue / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  }
};
