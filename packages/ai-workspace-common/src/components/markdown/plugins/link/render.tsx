import { Popover, PopoverContent, PopoverTrigger } from './popover';

import { Source } from '@refly/openapi-schema';

function ATag({ ...props }, sources: Source[]) {
  if (!props.href) return <></>;
  const source = sources[+props.href - 1];
  if (!source) {
    try {
      const num = Number(props.href);
      if (!Number.isNaN(num) && num > sources.length) {
        console.log('source not found', props);
        return <></>;
      }
    } catch (err) {}

    return (
      <a href={props.href} target="_blank">
        {props.children}
      </a>
    );
  }
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

export default ATag;
