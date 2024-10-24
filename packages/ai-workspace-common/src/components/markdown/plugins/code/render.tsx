import { memo, useRef } from 'react';
import { Message as message } from '@arco-design/web-react';

import copyToClipboard from 'copy-to-clipboard';

import { useTranslation } from 'react-i18next';

function PreCode(props: { children: any }) {
  const ref = useRef<HTMLPreElement>(null);
  const { t } = useTranslation();

  return (
    <pre ref={ref}>
      <span
        className="copy-code-button"
        onClick={() => {
          if (ref.current) {
            const code = ref.current.innerText;
            copyToClipboard(code);
            message.success(t('components.markdown.copySuccess'));
          }
        }}
      >
        {t('copilot.message.copy')}
      </span>
      {props.children}
    </pre>
  );
}

export default PreCode;
