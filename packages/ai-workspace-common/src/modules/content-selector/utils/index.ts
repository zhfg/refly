export type ElementType = 'table' | 'link' | 'image' | 'video' | 'audio' | 'text';

export function getElementType(element) {
  // 检查元素是否为 table 元素
  if (element.tagName.toLowerCase() === 'table') {
    return 'table';
  }
  // 检查元素是否为 a 标签(链接)
  else if (element.tagName.toLowerCase() === 'a') {
    return 'link';
  }
  // 检查元素是否为 img 标签(图像)
  else if (element.tagName.toLowerCase() === 'img') {
    return 'image';
  }
  // 检查元素是否为 video 标签
  else if (element.tagName.toLowerCase() === 'video') {
    return 'video';
  }
  // 检查元素是否为 audio 标签
  else if (element.tagName.toLowerCase() === 'audio') {
    return 'audio';
  }
  // 如果以上都不是,则认为是文本元素
  else {
    return 'text';
  }
}
