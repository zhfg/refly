import { IconLoading } from '@arco-design/web-react/icon';
import { memo, useEffect, useRef, useState, lazy, Suspense, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';

import RemarkBreaks from 'remark-breaks';
import RemarkGfm from 'remark-gfm';

import { cn, markdownCitationParse } from '@refly/utils';

// plugins
import LinkElement from './plugins/link';
import CodeElement from './plugins/code';

// styles
import './styles/markdown.scss';
import './styles/highlight.scss';
import { Source } from '@refly/openapi-schema';
import { useTranslation } from 'react-i18next';

export const Markdown = memo(
  (
    props: {
      content: string;
      loading?: boolean;
      sources?: Source[];
      className?: string;
    } & React.DOMAttributes<HTMLDivElement>,
  ) => {
    const mdRef = useRef<HTMLDivElement>(null);
    const { t } = useTranslation();
    const [isKatexLoaded, setIsKatexLoaded] = useState(false);

    // Add state for dynamically loaded plugins
    const [plugins, setPlugins] = useState({
      RemarkMath: null,
      RehypeKatex: null,
      RehypeHighlight: null,
    });

    // Dynamically import KaTeX CSS
    useEffect(() => {
      import('katex/dist/katex.min.css').then(() => setIsKatexLoaded(true));
    }, []);

    // Dynamically import heavy plugins
    useEffect(() => {
      Promise.all([import('remark-math'), import('rehype-katex'), import('rehype-highlight')]).then(
        ([RemarkMath, RehypeKatex, RehypeHighlight]) => {
          setPlugins({
            RemarkMath: RemarkMath.default,
            RehypeKatex: RehypeKatex.default,
            RehypeHighlight: RehypeHighlight.default,
          });
        },
      );
    }, []);

    const shouldLoading = props.loading;
    const parsedContent = markdownCitationParse(props?.content || '');

    return (
      <div className={cn('markdown-body', props.className)} ref={mdRef}>
        {shouldLoading ? (
          <IconLoading />
        ) : (
          <Suspense fallback={<div>{t('common.loading')}</div>}>
            {isKatexLoaded && plugins.RemarkMath && plugins.RehypeKatex && plugins.RehypeHighlight && (
              <ReactMarkdown
                remarkPlugins={[RemarkGfm, RemarkBreaks, plugins.RemarkMath]}
                rehypePlugins={[
                  plugins.RehypeKatex,
                  [
                    plugins.RehypeHighlight,
                    {
                      detect: false,
                      ignoreMissing: true,
                    },
                  ],
                ]}
                components={{
                  // ...canvasComponents,
                  pre: CodeElement.Component,
                  a: (args) => LinkElement.Component(args, props?.sources || []),
                }}
                linkTarget={'_blank'}
              >
                {parsedContent}
              </ReactMarkdown>
            )}
          </Suspense>
        )}
      </div>
    );
  },
);
