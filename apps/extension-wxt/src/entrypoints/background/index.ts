// import { onExternalMessage } from "./events/externalMessage";
// import { onActivated } from './events/activated';
// import { onMessage } from './events/message';
// import { onPort } from './events/ports';

export default defineBackground(() => {
  console.log('hello background');
  // 接收 refly 官网的消息，了解登录的状态
  // browser.runtime.onMessageExternal.addListener(onExternalMessage);
  // browser.tabs.onActivated.addListener(onActivated);
  // browser.runtime.onMessage.addListener(onMessage);
  // browser.runtime.onConnect.addListener(onPort);
});
