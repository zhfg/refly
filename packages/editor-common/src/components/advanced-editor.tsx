import {
  EditorCommand,
  EditorCommandEmpty,
  EditorCommandItem,
  EditorCommandList,
} from '@refly-packages/editor-core/components';
import { useState } from 'react';
import { ColorSelector } from './selectors/color-selector';
import { LinkSelector } from './selectors/link-selector';
import { NodeSelector } from './selectors/node-selector';
import { ContentSelectorButtons } from './selectors/content-selector-buttons';
import { Separator } from './ui/separator';

import GenerativeMenuSwitch from './generative/generative-menu-switch';
import GenerativeBlockMenu from './generative/generative-block-menu';
import { TextButtons } from './selectors/text-buttons';
import { configureSuggestionItems } from './slash-command';

import './styles/globals.css';
import './styles/prosemirror.css';

export const CollabEditorCommand = (props: { entityId: string; entityType: string }) => {
  const suggestionItems = configureSuggestionItems(props);

  return (
    <EditorCommand className="z-50 h-auto max-h-[330px] overflow-y-auto rounded-md border border-muted bg-background px-1 py-2 shadow-md transition-all">
      <EditorCommandEmpty className="px-2 text-muted-foreground">No results</EditorCommandEmpty>
      <EditorCommandList>
        {suggestionItems.map((item) => (
          <EditorCommandItem
            value={item.title}
            onCommand={(val) => item.command(val)}
            className="flex items-center w-full px-2 py-1 space-x-2 text-sm text-left rounded-md hover:bg-accent aria-selected:bg-accent"
            key={item.title}
          >
            <div className="flex items-center justify-center w-10 h-10 border rounded-md border-muted bg-background">
              {item.icon}
            </div>
            <div>
              <p className="font-medium">{item.title}</p>
              <p className="text-xs text-muted-foreground">{item.description}</p>
            </div>
          </EditorCommandItem>
        ))}
      </EditorCommandList>
    </EditorCommand>
  );
};

interface CollabGenAIMenuSwitchProps {
  contentSelector: {
    text: string;
    handleClick: () => void;
  };
  nodeSelector: {
    items: { name: string; icon: React.ReactNode }[];
  };
}
export const CollabGenAIMenuSwitch: React.FC<CollabGenAIMenuSwitchProps> = (props) => {
  const { contentSelector, nodeSelector } = props;
  const [openNode, setOpenNode] = useState(false);
  const [openColor, setOpenColor] = useState(false);
  const [openLink, setOpenLink] = useState(false);
  const [openAI, setOpenAI] = useState(false);

  return (
    <GenerativeMenuSwitch open={openAI} onOpenChange={setOpenAI}>
      <ContentSelectorButtons text={contentSelector?.text} handleClick={contentSelector?.handleClick} />
      <Separator orientation="vertical" />
      <NodeSelector open={openNode} onOpenChange={setOpenNode} textItems={nodeSelector.items} />
      <Separator orientation="vertical" />
      <LinkSelector open={openLink} onOpenChange={setOpenLink} />
      <Separator orientation="vertical" />
      <TextButtons />
      <Separator orientation="vertical" />
      <ColorSelector open={openColor} onOpenChange={setOpenColor} />
    </GenerativeMenuSwitch>
  );
};

export const CollabGenAIBlockMenu = () => {
  const [openAI, setOpenAI] = useState(false);

  return <GenerativeBlockMenu open={openAI} onOpenChange={setOpenAI}></GenerativeBlockMenu>;
};
