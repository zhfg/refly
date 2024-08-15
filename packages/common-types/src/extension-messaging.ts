import { IRuntime } from './env';

export type BackgroundMsgType =
  | 'apiRequest'
  | 'others'
  | 'registerEvent'
  | 'operateTabStorage'
  | 'injectContentSelectorCss';

export type SyncMarkEventName = 'syncMarkEvent' | 'syncMarkEventBack' | 'syncMarkStatusEvent';
export type MessageName =
  | 'openCopilot'
  | 'getOpenedTabs'
  | 'getCurrentMockResourceByTabId'
  | 'getTabId'
  | 'currentMockResource'
  | 'registerSidePanel'
  | SyncMarkEventName;

export interface BackgroundMessage<T = any> {
  name: MessageName;
  body?: T;
  type?: BackgroundMsgType;
  source: IRuntime;
  target?: any;
  args?: any;
}
