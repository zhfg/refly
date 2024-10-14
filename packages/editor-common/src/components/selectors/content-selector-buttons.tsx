import { Button } from '../ui/button';

interface ContentSelectorButtonsProps {
  text: string;
  handleClick: () => void;
}
export const ContentSelectorButtons: React.FC<ContentSelectorButtonsProps> = (props) => {
  const { text, handleClick } = props;

  return (
    <div className="flex">
      <Button size="sm" variant="ghost" className="rounded-none" onClick={handleClick}>
        {text}
      </Button>
    </div>
  );
};
