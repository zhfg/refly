## 如何启动插件？

安装依赖，然后开启服务：

```bash
cd extension
sudo pnpm install
sudo pnpm dev
```

打开浏览器插件页面：

![image](https://github.com/refly-ai/refly/assets/26423749/848faa3a-bd39-4d75-b264-79a9ba300d28)

打开右上角的开发者模式，然后选择『加载已解压的扩展程序』，之后选择插件目录下的 `build/chrome-mv3-dev` 文件：

![image](https://github.com/refly-ai/refly/assets/26423749/d8f20506-7ae4-428a-8355-d7b66ad5be55)

> 请注意：需要同时开启 `reflyd` 的服务搭配使用。

接着就可以打开一个页面，通过悬浮按钮打开插件使用：

![image](https://github.com/refly-ai/refly/assets/26423749/164b40ed-5624-4df4-94e7-4252ae712f1d)

插件开发和 Web 开发类似，核心是改 `components/*` 下面的组件，即打开的浏览器页面里面的侧边栏的界面：

![image](https://github.com/refly-ai/refly/assets/26423749/9aaba4d7-0a23-4cf6-bc3a-c791751e32d1)

插件里面还包括 `popup`、`background` 等。

下面的是 Popup：

![image](https://github.com/refly-ai/refly/assets/26423749/cdbc7549-d1fa-4eeb-9aeb-0c2c67bd1beb)

background 则需要打开插件详情 > Service Worker：

![image](https://github.com/refly-ai/refly/assets/26423749/1054d11d-182d-400a-b1d9-89dfcc3bf9dc)



