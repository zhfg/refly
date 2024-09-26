import { IconLoading } from '@arco-design/web-react/icon';
import { memo, useEffect, useRef, useState, lazy, Suspense } from 'react';
import ReactMarkdown from 'react-markdown';
import { Message as message } from '@arco-design/web-react';
import { Popover, PopoverContent, PopoverTrigger } from './popover';

import copyToClipboard from 'copy-to-clipboard';
import RemarkBreaks from 'remark-breaks';
import RemarkGfm from 'remark-gfm';

import { markdownCitationParse } from '@refly/utils';

// styles
import './styles/markdown.scss';
import './styles/highlight.scss';
import { Source } from '@refly/openapi-schema';
import { useTranslation } from 'react-i18next';

export function PreCode(props: { children: any }) {
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
      ></span>
      {props.children}
    </pre>
  );
}

export function ATag({ ...props }, sources: Source[]) {
  if (!props.href) return <></>;
  const source = sources[+props.href - 1];
  if (!source) return <a href={props.href}>{props.children}</a>;
  return (
    <span className="inline-block w-4">
      <Popover>
        <PopoverTrigger asChild>
          <span
            title={source.metadata?.title}
            className="inline-block h-6 !w-6 origin-top-left scale-[60%] transform cursor-pointer rounded-full bg-zinc-300 text-center font-medium no-underline hover:bg-zinc-400"
          >
            {props.href}
          </span>
        </PopoverTrigger>
        <PopoverContent
          align={'start'}
          style={{ backgroundColor: '#fcfcf9' }}
          className="flex flex-col gap-2 max-w-screen-md text-xs ring-4 shadow-transparent ring-zinc-50"
        >
          <div className="overflow-hidden font-medium whitespace-nowrap text-ellipsis">{source.title}</div>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="break-words line-clamp-4 text-zinc-500">{source.pageContent}</div>
            </div>
          </div>

          <div className="flex gap-2 items-center">
            <div className="overflow-hidden flex-1">
              <div className="overflow-hidden text-blue-500 whitespace-nowrap text-ellipsis">
                <a title={source?.title} href={source?.url} target="_blank">
                  {source?.url}
                </a>
              </div>
            </div>
            <div className="flex relative flex-none items-center">
              <img
                className="w-3 h-3"
                alt={source?.url}
                src={`https://www.google.com/s2/favicons?domain=${source?.url}&sz=${16}`}
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </span>
  );
}

export const Markdown = memo(
  (
    props: {
      content: string;
      loading?: boolean;
      fontSize?: number;
      sources?: Source[];
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
      <div className="markdown-body" style={{ fontSize: `${props.fontSize ?? 15}px` }} ref={mdRef}>
        {shouldLoading ? (
          <IconLoading />
        ) : (
          <Suspense fallback={<div>{t('components.markdown.loading')}</div>}>
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
                  pre: PreCode,
                  a: (args) => ATag(args, props?.sources || []),
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
