import { IRuntime } from './env';

export type BackgroundMsgType =
  | 'apiRequest'
  | 'others'
  | 'registerEvent'
  | 'syncInfo'
  | 'injectContentSelectorCss'
  | 'toggleCopilot';

export type SyncMarkEventName = 'syncMarkEvent' | 'syncMarkEventBack' | 'syncMarkStatusEvent';
export type CopilotMsgName =
  | 'toggleCopilotCSUI'
  | 'toggleCopilot'
  | 'toggleCopilotSidePanel'
  | 'toggleCopilotFromPopup'
  | 'checkSidePanelOpenStatus';
export type SidePanelMsgName = 'registerSidePanel' | 'unregisterSidePanel';
export type MessageName =
  | 'getOpenedTabs'
  | 'getCurrentMockResourceByTabId'
  | 'getTabId'
  | 'currentMockResource'
  | 'sidePanelHeartBeat'
  | 'reflyStatusCheck'
  | CopilotMsgName
  | SyncMarkEventName
  | SidePanelMsgName;

export interface BackgroundMessage<T = any> {
  name: MessageName;
  body?: T;
  type?: BackgroundMsgType;
  source: IRuntime;
  target?: any;
  args?: any;
}
