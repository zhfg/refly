import { IRuntime } from './env';

export type BackgroundMsgType =
  | 'apiRequest'
  | 'others'
  | 'registerEvent'
  | 'operateTabStorage'
  | 'injectContentSelectorCss'
  | 'toggleCopilot';

export type SyncMarkEventName = 'syncMarkEvent' | 'syncMarkEventBack' | 'syncMarkStatusEvent';
export type CopilotMsgName =
  | 'toggleCopilotCSUI'
  | 'toggleCopilot'
  | 'toggleCopilotSidePanel'
  | 'checkSidePanelOpenStatus';
export type MessageName =
  | 'getOpenedTabs'
  | 'getCurrentMockResourceByTabId'
  | 'getTabId'
  | 'currentMockResource'
  | 'registerSidePanel'
  | 'sidePanelHeartBeat'
  | CopilotMsgName
  | SyncMarkEventName;

export interface BackgroundMessage<T = any> {
  name: MessageName;
  body?: T;
  type?: BackgroundMsgType;
  source: IRuntime;
  target?: any;
  args?: any;
}
