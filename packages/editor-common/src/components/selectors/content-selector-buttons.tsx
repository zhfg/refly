import { Tooltip } from '@arco-design/web-react';
import { Button } from '../ui/button';
import { BsChatLeftQuote } from 'react-icons/bs';
import { useTranslation } from 'react-i18next';

interface ContentSelectorButtonsProps {
  text: string;
  handleClick: () => void;
}

export const ContentSelectorButtons: React.FC<ContentSelectorButtonsProps> = (props) => {
  const { text, handleClick } = props;
  const { t } = useTranslation();

  return (
    <Tooltip content={t('knowledgeBase.canvas.editor.toolbar.quote')}>
      <div className="flex">
        <Button size="sm" variant="ghost" className="rounded-none" onClick={handleClick}>
          <BsChatLeftQuote style={{ color: '#00968F' }} />
        </Button>
      </div>
    </Tooltip>
  );
};
