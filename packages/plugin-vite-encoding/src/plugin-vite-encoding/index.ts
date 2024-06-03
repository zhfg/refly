import type { Plugin } from 'vite';
import type { OutputChunk, OutputAsset } from 'rollup';

const pkg = require('../../package.json');

export function toUtf8(str: string) {
  return str
    .split('')
    .map((ch) => (ch.charCodeAt(0) <= 0x7f ? ch : '\\u' + ('0000' + ch.charCodeAt(0).toString(16)).slice(-4)))
    .join('');
}

export default function vitePluginArcoImport(): Plugin {
  return {
    name: pkg.name,

    generateBundle(options, bundle) {
      options;
      // 遍历所有 chunk
      for (const file in bundle) {
        const chunk = bundle[file] as OutputAsset | OutputChunk;
        console.log('file', file, chunk.type, chunk);

        // 如果是 JavaScript 文件
        if (chunk.type === 'chunk' && chunk?.code && /\.js$/.test(file)) {
          console.log('file', file);
          // 将内容转换为 UTF-8 编码
          const utf8Content = toUtf8(chunk.code as string);
          chunk.code = utf8Content;
        }
      }
    },
  };
}
