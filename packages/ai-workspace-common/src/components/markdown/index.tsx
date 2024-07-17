import { IconLoading } from '@arco-design/web-react/icon';
import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Message as message } from '@arco-design/web-react';
import { Popover, PopoverContent, PopoverTrigger } from './popover';

import 'katex/dist/katex.min.css';

import copyToClipboard from 'copy-to-clipboard';
import RehypeHighlight from 'rehype-highlight';
import RehypeKatex from 'rehype-katex';
import RemarkBreaks from 'remark-breaks';
import RemarkGfm from 'remark-gfm';
import RemarkMath from 'remark-math';

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
  if (!source) return <a href={props.href}>{props.href}</a>;
  return (
    <span className="inline-block w-4">
      <Popover>
        <PopoverTrigger asChild>
          <span
            title={source.metadata?.title}
            className="inline-block h-6 w-6 origin-top-left scale-[60%] transform cursor-pointer rounded-full bg-zinc-300 text-center font-medium no-underline hover:bg-zinc-400"
          >
            {props.href}
          </span>
        </PopoverTrigger>
        <PopoverContent
          align={'start'}
          style={{ backgroundColor: '#fcfcf9' }}
          className="flex flex-col max-w-screen-md gap-2 text-xs shadow-transparent ring-4 ring-zinc-50"
        >
          <div className="overflow-hidden font-medium text-ellipsis whitespace-nowrap">{source.metadata?.title}</div>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="break-words line-clamp-4 text-zinc-500">{source.pageContent}</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex-1 overflow-hidden">
              <div className="overflow-hidden text-blue-500 text-ellipsis whitespace-nowrap">
                <a title={source.metadata?.title} href={source.metadata?.source} target="_blank">
                  {source.metadata?.source}
                </a>
              </div>
            </div>
            <div className="relative flex items-center flex-none">
              <img
                className="w-3 h-3"
                alt={source.metadata?.source}
                src={`https://www.google.com/s2/favicons?domain=${source.metadata?.source}&sz=${16}`}
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </span>
  );
}

export function Markdown(
  props: {
    content: string;
    loading?: boolean;
    fontSize?: number;
    sources?: Source[];
  } & React.DOMAttributes<HTMLDivElement>,
) {
  const mdRef = useRef<HTMLDivElement>(null);

  const md = mdRef.current;
  const rendered = useRef(true); // disable lazy loading for bad ux
  const [counter, setCounter] = useState(0);

  useEffect(() => {
    // to triggr rerender
    setCounter(counter + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.loading]);

  const shouldLoading = props.loading;
  const parsedContent = props.content
    ?.replace(/\[\[([cC])itation/g, '[citation')
    .replace(/[cC]itation:(\d+)]]/g, 'citation:$1]')
    .replace(/\[\[([cC]itation:\d+)]](?!])/g, `[$1]`)
    .replace(/\[[cC]itation:(\d+)]/g, '[citation]($1)');

  return (
    <div className="markdown-body" style={{ fontSize: `${props.fontSize ?? 14}px` }} ref={mdRef}>
      {shouldLoading ? (
        <IconLoading />
      ) : (
        <ReactMarkdown
          remarkPlugins={[RemarkMath, RemarkGfm, RemarkBreaks]}
          rehypePlugins={[
            RehypeKatex,
            [
              RehypeHighlight,
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
    </div>
  );
}
