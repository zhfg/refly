import { getLastActiveTab } from '@/utils/extension/tabs';
import type { HandlerRequest, HandlerResponse } from '@refly/common-types';
import type { ListPageProps } from '@refly/common-types';

const handler = async (req: HandlerRequest<ListPageProps>): Promise<HandlerResponse<void>> => {
  console.log(`injectContent`, req.body);

  const injectStyles = (id: number) => {
    chrome.scripting
      .executeScript({
        target: { tabId: id },
        func: () => {
          const style = document.createElement('style');
          style.textContent = `
        * {
        cursor: default !important;
      }
      .refly-content-selector-mark {
        cursor: pointer !important;
      }
      .refly-content-selector-mark:hover {
        color: unset !important;
        border-bottom: 2px solid rgb(255, 212, 0) !important;
        background-color: #ffd40024 !important;
        cursor: pointer !important;
      }
      input,
      textarea {
        pointer-events: none;
      }

      .refly-content-selected-target {
        color: unset !important;
        border-bottom: 2px solid rgb(255, 212, 0) !important;
        background-color: #ffd40024 !important;
        cursor: pointer !important;
      }
        `;
          document.head.appendChild(style);
        },
      })
      .then(() => {
        console.log('Inject content selector style success');
      })
      .catch((err) => console.log(`Inject content selector style failed: ${err}`));
  };

  const tabs = (await chrome.tabs.query({ active: true, currentWindow: true })) || [];
  if (Array.isArray(tabs) && tabs?.length > 0) {
    injectStyles(tabs?.[0]?.id as number);
  } else {
    const lastActiveTab = await getLastActiveTab();

    if (lastActiveTab?.id) {
      injectStyles(lastActiveTab?.id);
    }
  }
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    const { id } = tabs?.[0];
    console.log('currentTabid', id);
  });

  return {
    success: true,
  };
};

export default handler;
