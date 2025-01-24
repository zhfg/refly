import { LOCALE } from '@refly/common-types';
import dayjsConfig from './dayjsConfig';

export function timestampFormat(timestamp: number = new Date().getTime(), language = 'cn') {
  function zeroize(num: number) {
    return (String(num).length === 1 ? '0' : '') + num;
  }

  const curTimestamp = new Date().getTime() / 1000;
  const updateTimestamp = timestamp / 1000;
  const timestampDiff = curTimestamp - updateTimestamp;

  const curDate = new Date(curTimestamp * 1000);
  const tmDate = new Date(updateTimestamp * 1000);

  const Y = tmDate.getFullYear();
  const m = tmDate.getMonth() + 1;
  const d = tmDate.getDate();
  const H = tmDate.getHours();
  const i = tmDate.getMinutes();
  const _s = tmDate.getSeconds();

  if (timestampDiff < 60) {
    return language === 'en' ? 'just now' : '刚刚';
  }
  if (timestampDiff < 3600) {
    return Math.floor(timestampDiff / 60) + language === 'en' ? ' minutes ago' : '分钟前';
  }
  if (curDate.getFullYear() === Y && curDate.getMonth() + 1 === m && curDate.getDate() === d) {
    return language === 'en' ? 'today ' : `今天 ${zeroize(H)}:${zeroize(i)}`;
  }
  const newDate = new Date((curTimestamp - 86400) * 1000);
  if (newDate.getFullYear() === Y && newDate.getMonth() + 1 === m && newDate.getDate() === d) {
    return language === 'en' ? 'yesterday ' : `昨天 ${zeroize(H)}:${zeroize(i)}`;
  }
  if (curDate.getFullYear() === Y) {
    return zeroize(m) + language === 'en'
      ? 'month'
      : `月${zeroize(d)}${language}` === 'en'
        ? 'day'
        : `日${zeroize(H)}:${zeroize(i)}`;
  }
  return Y + language === 'en'
    ? 'year'
    : `年 ${zeroize(m)}${language}` === 'en'
      ? 'month'
      : `月${zeroize(d)}${language}` === 'en'
        ? 'day'
        : `日 ${zeroize(H)}:${zeroize(i)}`;
}

export const time = (
  date: string | number | Date | dayjsConfig.Dayjs,
  locale: LOCALE = LOCALE.EN,
) => {
  return dayjsConfig(date, { locale });
};

export const getCurrentDateInfo = () => {
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1; // Months are zero-indexed, so we add 1
  const day = currentDate.getDate();

  console.log(`Today is ${year}-${month}-${day}`); // Output: Today is 2024-3-29

  return { year, month, day };
};
