export function uniqueFunc(arr, uniId) {
  const res = new Map();
  return arr.filter((item) => {
    if (!res.has(item?.payload?.[uniId])) {
      res.set(item?.payload?.[uniId], 1);
      return true;
    }

    return false;
  });
}
