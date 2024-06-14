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
import { LOCALE } from '@refly/constants';
import { languageNameToLocale } from '@refly/utils';

// resize hook
const SubMenu = Menu.SubMenu;
const MenuItem = Menu.Item;

export const NoteSelectedContextPanel = () => {
  const { currentSelectedText } = useCopilotContextState();
  const searchStateStore = useSearchStateStore();
  const knowledgeBaseStore = useKnowledgeBaseStore();
  const { runTask } = useBuildThreadAndRun();

  const { t, i18n } = useTranslation();
  const uiLocale = (i18n?.languages?.[0] as LOCALE) || LOCALE.EN;
  const localeList = languageNameToLocale?.[uiLocale];

  console.log('NoteSelectedContextPanel', uiLocale, localeList);

  const writingSkills = [
    // 编辑或 review - editOrReviewSelection
    {
      prompt: '以更适于写作的目的优化目标文本',
      key: 'improveWriting',
      title: '改进写作',
      group: 'editOrReviewSelection',
    },
    {
      prompt: '修复拼写和语法错误',
      key: 'fixSpllingAndGrammar',
      title: '修复拼写和语法错误',
      group: 'editOrReviewSelection',
    },
    {
      prompt: '缩短并精炼内容',
      key: 'makeShorter',
      title: '缩短内容',
      group: 'editOrReviewSelection',
    },
    {
      prompt: '扩写内容',
      key: 'makeLonger',
      title: '扩写内容',
      group: 'editOrReviewSelection',
    },
    {
      prompt: '将选中内容修改为 {tone} 语气',
      key: 'changeTone',
      title: '修改语气',
      itemList: ['专业的', '随意的', '直接的', '自信的', '友好的'],
      variable: 'tone',
      group: 'editOrReviewSelection',
    },
    {
      prompt: '以一年级小学生能够听懂的形式保持语义不变的前提下简化这段内容',
      key: 'simplifyLanguage',
      title: '简化语言',
      group: 'editOrReviewSelection',
    },
    // 生成：generateFromSelection
    {
      prompt: '总结选中内容',
      key: 'summary',
      title: '总结',
      group: 'generateFromSelection',
    },
    {
      prompt: '将选中内容翻译为 {language} 语言',
      key: 'translate',
      title: '翻译',
      variable: 'language',
      itemList: Object.keys(localeList || {}) || [],
      group: 'generateFromSelection',
    },
    {
      prompt: '解释选中内容',
      key: 'explainThis',
      title: '解释',
      itemList: [],
      group: 'generateFromSelection',
    },
    {
      prompt: '提取待办事项',
      key: 'findActionItem',
      title: '提取代办事项',
      itemList: [],
      group: 'generateFromSelection',
    },
    // write with AI
    {
      prompt: '基于当前上下文续写并将内容补充完整',
      key: 'continueWriying',
      title: '续写',
      itemList: [],
      group: 'writeWithAI',
    },
    // Draft with AI
    {
      prompt: '脑暴想法',
      key: 'brainstormIdeas',
      title: '脑暴想法',
      itemList: [],
      group: 'draftWithAI',
    },
    {
      prompt: '撰写博客文章',
      key: 'blogPost',
      title: '撰写博客文章',
      itemList: [],
      group: 'draftWithAI',
    },
    {
      prompt: '撰写文章大纲',
      key: 'outline',
      title: '撰写文章大纲',
      itemList: [],
      group: 'draftWithAI',
    },
    {
      prompt: '撰写社交媒体文章',
      key: 'socialMediaPost',
      title: '撰写社交媒体文章',
      itemList: [],
      group: 'draftWithAI',
    },
  ];

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
                      runTask(skill?.prompt?.replace(`{${skill?.variable || ''}}`, localeList?.[subSkill]));
                    } else {
                      runTask(skill?.prompt?.replace(`{${skill?.variable || ''}}`, subSkill));
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
                runTask(skill?.prompt);
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
        <div className="context-state-action-list">
          {writingSkills.slice(0, containCnt).map((skill, index) => (
            <div className="context-state-action-item" key={index}>
              <Button
                type="primary"
                size="mini"
                style={{ borderRadius: 8 }}
                onClick={() => {
                  runTask(skill?.prompt);
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
      <div className="context-state-card-footer"></div>
    </div>
  );
};
