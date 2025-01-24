import md5 from 'md5';
import { v4 as UUIDV4 } from 'uuid';

export const genUniqueId = () => {
  const uuid = UUIDV4();
  const timestamp = new Date().getTime();
  const randomString =
    Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  const id = `${uuid}${timestamp}${randomString}`;
  return md5(id);
};

export function timestampFormat(timestamp: number) {
  function zeroize(num: number) {
    return (String(num).length === 1 ? '0' : '') + num;
  }

  const curTimestamp = new Date().getTime() / 1000; // 当前时间戳
  const updateTimestamp = timestamp / 1000;
  const timestampDiff = curTimestamp - updateTimestamp; // 参数时间戳与当前时间戳相差秒数

  const curDate = new Date(curTimestamp * 1000); // 当前时间日期对象
  const tmDate = new Date(updateTimestamp * 1000); // 参数时间戳转换成的日期对象

  const Y = tmDate.getFullYear();
  const m = tmDate.getMonth() + 1;
  const d = tmDate.getDate();
  const H = tmDate.getHours();
  const i = tmDate.getMinutes();
  const _s = tmDate.getSeconds();

  if (timestampDiff < 60) {
    return '刚刚';
  }
  if (timestampDiff < 3600) {
    return `${Math.floor(timestampDiff / 60)}分钟前`;
  }
  if (curDate.getFullYear() === Y && curDate.getMonth() + 1 === m && curDate.getDate() === d) {
    return `今天${zeroize(H)}:${zeroize(i)}`;
  }
  const newDate = new Date((curTimestamp - 86400) * 1000); // 参数中的时间戳加一天转换成的日期对象
  if (newDate.getFullYear() === Y && newDate.getMonth() + 1 === m && newDate.getDate() === d) {
    return `昨天${zeroize(H)}:${zeroize(i)}`;
  }
  if (curDate.getFullYear() === Y) {
    return `${zeroize(m)}月${zeroize(d)}日 ${zeroize(H)}:${zeroize(i)}`;
  }
  return `${Y}年${zeroize(m)}月${zeroize(d)}日 ${zeroize(H)}:${zeroize(i)}`;
}

export function copyToClipboard(text: string) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text);
  } else {
    const textarea = document.createElement('textarea');
    document.body.appendChild(textarea);
    textarea.style.position = 'fixed';
    textarea.style.clip = 'rect(0 0 0 0)';
    textarea.style.top = '10px';
    textarea.value = text;
    textarea.select();
    document.execCommand('copy', true);
    document.body.removeChild(textarea);
  }
}

export const downloadPlugin = async () => {
  window.open('http://localhost:5173/');
};

export const openGetStartDocument = async () => {
  window.open('https://refly.ai/docs');
};
