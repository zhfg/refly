import { useBuildThreadAndRun } from '@refly-packages/ai-workspace-common/hooks/use-build-thread-and-run';
import { useCopilotContextState } from '@refly-packages/ai-workspace-common/hooks/use-copilot-context-state';
import { useKnowledgeBaseStore } from '@refly-packages/ai-workspace-common/stores/knowledge-base';
import { SearchTarget, useSearchStateStore } from '@refly-packages/ai-workspace-common/stores/search-state';
import { getQuickActionPrompt } from '@refly-packages/ai-workspace-common/utils/quickActionPrompt';
import { Button, Tag, Dropdown, Menu } from '@arco-design/web-react';
import { IconCloseCircle, IconFontColors, IconMore } from '@arco-design/web-react/icon';
import { useResizeBox } from '@refly-packages/ai-workspace-common/hooks/use-resize-box';
import { getPopupContainer } from '@refly-packages/ai-workspace-common/utils/ui';
import { useTranslation } from 'react-i18next';
import { LOCALE } from '@refly/common-types';
import { languageNameToLocale } from '@refly/common-types';
import { writingSkills } from '@refly/utils/ai-writing';

// resize hook
const SubMenu = Menu.SubMenu;
const MenuItem = Menu.Item;

export const NoteSelectedContextPanel = () => {
  const { currentSelectedText } = useCopilotContextState();
  const searchStateStore = useSearchStateStore();
  const knowledgeBaseStore = useKnowledgeBaseStore();
  const { runSkill } = useBuildThreadAndRun();

  const { t, i18n } = useTranslation();
  const uiLocale = (i18n?.languages?.[0] as LOCALE) || LOCALE.EN;
  const localeList = languageNameToLocale?.[uiLocale];

  console.log('NoteSelectedContextPanel', uiLocale, localeList);

  const [containCnt] = useResizeBox({
    getGroupSelector: () => {
      const container = getPopupContainer();
      const elem = container.querySelector('.context-state-card');

      return elem as HTMLElement;
    },
    getResizeSelector: () => {
      const container = getPopupContainer();
      const elems = container.querySelectorAll('.context-state-action-item') as NodeListOf<HTMLElement>;

      return elems;
    },
    initialContainCnt: writingSkills.length,
    paddingSize: 0,
    placeholderWidth: 120,
  });

  console.log('containCnt', containCnt);

  const dropList = (
    <Menu>
      {writingSkills.slice(containCnt).map((skill, index) => {
        if (skill?.itemList && skill?.itemList?.length > 0) {
          return (
            <SubMenu key={`${skill.key}`} title={skill?.title}>
              {skill?.itemList?.map((subSkill, subIndex) => (
                <MenuItem
                  key={`${skill.key}_${subIndex}`}
                  onClick={() => {
                    if (skill?.key === 'translate') {
                      runSkill(skill?.prompt?.replace(`{${skill?.variable || ''}}`, localeList?.[subSkill]));
                    } else {
                      runSkill(skill?.prompt?.replace(`{${skill?.variable || ''}}`, subSkill));
                    }
                  }}
                >
                  {subSkill}
                </MenuItem>
              ))}
            </SubMenu>
          );
        } else {
          return (
            <MenuItem
              key={`${skill.key}`}
              onClick={() => {
                runSkill(skill?.prompt);
              }}
            >
              {skill.title}
            </MenuItem>
          );
        }
      })}
    </Menu>
  );

  return (
    <div className="context-state-card context-state-current-page">
      <div className="context-state-card-header">
        <div className="context-state-card-header-left">
          <IconFontColors />
          <span className="context-state-card-header-title">基于选中笔记操作</span>
        </div>
        <div className="context-state-card-header-right">
          <IconCloseCircle
            onClick={() => {
              knowledgeBaseStore.updateSelectedText('');
              searchStateStore.setSearchTarget(SearchTarget.CurrentPage);
            }}
          />
        </div>
      </div>
      <div className="context-state-card-body">
        <div className="context-state-resource-item">
          <Tag icon={<IconFontColors />} bordered className="context-state-resource-item-tag">
            {currentSelectedText}
          </Tag>
        </div>
      </div>
      <div className="context-state-card-footer">
        <div className="context-state-action-list">
          {writingSkills.slice(0, containCnt).map((skill, index) => (
            <div className="context-state-action-item" key={index}>
              <Button
                type="primary"
                size="mini"
                style={{ borderRadius: 8 }}
                onClick={() => {
                  runSkill(skill?.prompt);
                }}
              >
                {skill.title}
              </Button>
            </div>
          ))}
          {containCnt === writingSkills.length ? null : (
            <div className="context-state-action-item">
              <Dropdown droplist={dropList}>
                <Button type="primary" size="mini" icon={<IconMore />} style={{ borderRadius: 8 }}>
                  更多
                </Button>
              </Dropdown>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
