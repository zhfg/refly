import React, { useState } from 'react';
import { Command } from 'cmdk';
import { useSearchStore } from '@refly-packages/ai-workspace-common/stores/search';
import * as Popover from '@radix-ui/react-popover';
import { Logo, LinearIcon, FigmaIcon, SlackIcon, YouTubeIcon, RaycastIcon } from './icons';
import {} from '@heroicons/react/24/outline';
import {
  IconSearch,
  IconMessage,
  IconFile,
  IconApps,
  IconBook,
  IconEdit,
  IconRobot,
} from '@arco-design/web-react/icon';
import { useDebouncedCallback } from 'use-debounce';

import './index.scss';
import { Modal } from '@arco-design/web-react';

// request
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';
import { SearchDomain, SearchRequest, SearchResult } from '@refly/openapi-schema';

export const Search = () => {
  const ref = React.useRef<HTMLDivElement | null>(null);
  const [searchValue, setSearchValue] = useState('');
  const [value, setValue] = React.useState('');
  const searchStore = useSearchStore();
  const [displayMode, setDisplayMode] = useState<'search' | 'list'>('list');
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const listRef = React.useRef(null);

  const [pages, setPages] = React.useState<string[]>(['home']);
  const activePage = pages[pages.length - 1];
  const isHome = activePage === 'home';

  const popPage = React.useCallback(() => {
    setPages((pages) => {
      const x = [...pages];
      x.splice(-1, 1);
      return x;
    });
  }, []);

  const onKeyDown = React.useCallback(
    (e: KeyboardEvent) => {
      if (isHome || searchValue.length) {
        return;
      }

      if (e.key === 'Backspace') {
        e.preventDefault();
        popPage();
      }
    },
    [searchValue.length, isHome, popPage],
  );

  function bounce() {
    if (ref.current) {
      ref.current.style.transform = 'scale(0.96)';
      setTimeout(() => {
        if (ref.current) {
          ref.current.style.transform = '';
        }
      }, 100);

      setSearchValue('');
    }
  }

  const getMappedPageToDomain = (activePage: string) => {
    switch (activePage) {
      case 'home':
        return '';
      case 'notes':
        return 'resource';
      case 'readSesources':
        return 'resource';
      case 'knowledgeBases':
        return 'collection';
      case 'convs':
        return 'conversation';
      case 'skills':
        return 'skill';
      default:
        return '';
    }
  };

  const handleBigSearchValueChange = async (searchVal: string, activePage: string) => {
    setSearchValue(searchVal);
    const domain = getMappedPageToDomain(activePage);
    console.log('searchVal', searchVal);

    // searchVal 为空的时候获取正常列表的内容
    if (!searchVal) {
      setDisplayMode('list');
      debouncedSearch({
        searchVal: '',
        domains: domain ? [domain] : undefined,
      });
    } else {
      // searchVal 不为空的时候获取搜索的内容
      setDisplayMode('search');
      debouncedSearch({
        searchVal,
        domains: domain ? [domain] : undefined,
      });
    }
  };

  const debouncedSearch = useDebouncedCallback(
    async ({ searchVal, domains }: { searchVal: string; domains?: Array<SearchDomain> }) => {
      try {
        const res = await getClient().search({
          body: {
            query: searchVal,
            scope: 'user',
            domains: domains,
          },
        });

        const resData = res?.data?.data || [];

        // notes
        const notes =
          resData.filter((item) => item?.metadata?.resourceType === 'note' && item?.domain === 'resource') || [];
        const readResources =
          resData.filter((item) => item?.metadata?.resourceType !== 'note' && item?.domain === 'resource') || [];
        const knowledgeBases = resData.filter((item) => item?.domain === 'collection') || [];
        const convs = resData.filter((item) => item?.domain === 'conversation') || [];
        const skills = resData.filter((item) => item?.domain === 'skill') || [];

        searchStore.setSearchedRes({
          notes,
          readResources,
          knowledgeBases,
          convs,
          skills,
        });
      } catch (err) {
        console.log('big search err: ', err);
      }
    },
    200,
  );

  React.useEffect(() => {
    inputRef?.current?.focus();

    if (activePage === 'home') {
      handleBigSearchValueChange('', 'home');
    }
  }, [activePage]);

  return (
    <div className="vercel">
      <Command
        ref={ref}
        onKeyDown={(e: React.KeyboardEvent) => {
          if (e.key === 'Enter') {
            bounce();
          }

          if (isHome || searchValue.length) {
            return;
          }

          if (e.key === 'Backspace') {
            e.preventDefault();
            popPage();
            bounce();
          }
        }}
      >
        <div>
          {pages.map((p) => (
            <div key={p} cmdk-vercel-badge="">
              {p}
            </div>
          ))}
        </div>
        <Command.Input
          autoFocus
          ref={inputRef}
          placeholder="Search for skills, notes, resources and more..."
          value={searchValue}
          onValueChange={(val) => handleBigSearchValueChange(val, activePage)}
        />
        <Command.List>
          <Command.Empty>No results found.</Command.Empty>
          {activePage === 'home' && (
            <Home displayMode={displayMode} pages={pages} setPages={(pages: string[]) => setPages(pages)} />
          )}
          {activePage === 'skills' && <Skills data={searchStore.searchedSkills} />}
          {activePage === 'notes' && <Notes data={searchStore.searchedNotes} />}
          {activePage === 'readResources' && <ReadResources data={searchStore.searchedReadResources} />}
          {activePage === 'knowledgeBases' && <KnowledgeBases data={searchStore.searchedKnowledgeBases} />}
          {activePage === 'convs' && <Convs data={searchStore.searchedConvs} />}
        </Command.List>
      </Command>
    </div>
  );
};

function Home({
  pages,
  setPages,
  displayMode,
}: {
  pages: string[];
  setPages: (pages: string[]) => void;
  displayMode: 'list' | 'search';
}) {
  const searchStore = useSearchStore();

  return (
    <>
      {/* <Command.Group heading="Projects">
        <Item
          shortcut="S P"
          onSelect={() => {
            searchProjects();
          }}
        >
          <ProjectsIcon />
          Search Projects...
        </Item>
        <Item>
          <PlusIcon />
          Create New Project...
        </Item>
      </Command.Group> */}
      <Command.Group heading="建议">
        <Item
          value="newConv"
          keywords={['NewConv']}
          shortcut="S A"
          onSelect={() => {
            // searchProjects();
          }}
        >
          <IconMessage style={{ fontSize: 12 }} />
          问问小飞
        </Item>
        <Item
          value="newAISearch"
          keywords={['AISearch']}
          shortcut="S A"
          onSelect={() => {
            // searchProjects();
          }}
        >
          <IconSearch style={{ fontSize: 12 }} />
          AI 搜索
        </Item>
      </Command.Group>
      <Command.Group heading="技能">
        {searchStore?.searchedSkills?.slice(0, 5)?.map((item, index) => (
          <Item key={index} value={`skills-${index}-${item?.title}`}>
            <IconRobot style={{ fontSize: 12 }} />
            {item?.title}
          </Item>
        ))}
        {displayMode === 'list' && searchStore?.searchedSkills?.length > 0 ? (
          <Item
            value="allSkills"
            keywords={['AskKnowledgeBase']}
            onSelect={() => {
              setPages([...pages, 'skills']);
            }}
          >
            <IconApps style={{ fontSize: 12 }} />
            查看所有技能
          </Item>
        ) : null}
      </Command.Group>
      <Command.Group heading="笔记">
        {searchStore?.searchedNotes?.slice(0, 5)?.map((item, index) => (
          <Item key={index} value={`notes-${index}-${item?.title}`}>
            <IconEdit style={{ fontSize: 12 }} />
            {item?.title}
          </Item>
        ))}
        {displayMode === 'list' && searchStore?.searchedNotes?.length > 0 ? (
          <Item
            value="allNotes"
            keywords={['AskKnowledgeBase']}
            onSelect={() => {
              setPages([...pages, 'notes']);
            }}
          >
            <IconApps style={{ fontSize: 12 }} />
            查看所有笔记
          </Item>
        ) : null}
      </Command.Group>

      <Command.Group heading="阅读资源">
        {searchStore?.searchedReadResources?.slice(0, 5)?.map((item, index) => (
          <Item key={index} value={`readResources-${index}-${item?.title}`}>
            <IconBook style={{ fontSize: 12 }} />
            {item?.title}
          </Item>
        ))}
        {displayMode === 'list' && searchStore?.searchedReadResources?.length > 0 ? (
          <Item
            value="allReadResources"
            keywords={['AskKnowledgeBase']}
            onSelect={() => {
              setPages([...pages, 'readResources']);
            }}
          >
            <IconApps style={{ fontSize: 12 }} />
            查看所有阅读资源
          </Item>
        ) : null}
      </Command.Group>

      <Command.Group heading="知识库">
        {searchStore?.searchedKnowledgeBases?.slice(0, 5)?.map((item, index) => (
          <Item key={index} value={`knowledgeBases-${index}-${item?.title}`}>
            <IconFile style={{ fontSize: 12 }} />
            {item?.title}
          </Item>
        ))}
        {displayMode === 'list' && searchStore?.searchedKnowledgeBases?.length > 0 ? (
          <Item
            value="allKnowledgeBases"
            keywords={['AskKnowledgeBase']}
            onSelect={() => {
              setPages([...pages, 'knowledgeBases']);
            }}
          >
            <IconApps style={{ fontSize: 12 }} />
            查看所有知识库
          </Item>
        ) : null}
      </Command.Group>

      <Command.Group heading="会话">
        {searchStore?.searchedConvs?.slice(0, 5)?.map((item, index) => (
          <Item key={index} value={`convs-${index}-${item?.title}`}>
            <IconMessage style={{ fontSize: 12 }} />
            {item?.title}
          </Item>
        ))}
        {displayMode === 'list' && searchStore?.searchedConvs?.length > 0 ? (
          <Item
            value="allConvs"
            keywords={['AskKnowledgeBase']}
            onSelect={() => {
              setPages([...pages, 'convs']);
            }}
          >
            <IconApps style={{ fontSize: 12 }} />
            查看所有会话
          </Item>
        ) : null}
      </Command.Group>
    </>
  );
}

function Skills({ data }: { data: SearchResult[] }) {
  return (
    <>
      {data?.map((item, index) => (
        <Item key={index} value={`skills-${index}-${item?.title}`}>
          <IconRobot style={{ fontSize: 12 }} />
          {item?.title}
        </Item>
      ))}
    </>
  );
}

function Notes({ data }: { data: SearchResult[] }) {
  return (
    <>
      {data?.map((item, index) => (
        <Item key={index} value={`convs-${index}-${item?.title}`}>
          <IconMessage style={{ fontSize: 12 }} />
          {item?.title}
        </Item>
      ))}
    </>
  );
}

function ReadResources({ data }: { data: SearchResult[] }) {
  return (
    <>
      {data?.map((item, index) => (
        <Item key={index} value={`readResources-${index}-${item?.title}`}>
          <IconBook style={{ fontSize: 12 }} />
          {item?.title}
        </Item>
      ))}
    </>
  );
}

function KnowledgeBases({ data }: { data: SearchResult[] }) {
  return (
    <>
      {data?.map((item, index) => (
        <Item key={index} value={`knowledgeBases-${index}-${item?.title}`}>
          <IconFile style={{ fontSize: 12 }} />
          {item?.title}
        </Item>
      ))}
    </>
  );
}

function Convs({ data }: { data: SearchResult[] }) {
  return (
    <>
      {data?.map((item, index) => (
        <Item key={index} value={`convs-${index}-${item?.title}`}>
          <IconMessage style={{ fontSize: 12 }} />
          {item?.title}
        </Item>
      ))}
    </>
  );
}

function Item({
  children,
  shortcut,
  value,
  keywords,
  onSelect = () => {},
}: {
  children: React.ReactNode;
  shortcut?: string;
  value?: string;
  keywords?: string[];
  onSelect?: (value: string) => void;
}) {
  return (
    <Command.Item onSelect={onSelect} value={value} keywords={keywords}>
      {children}
      {shortcut && (
        <div cmdk-vercel-shortcuts="">
          {shortcut.split(' ').map((key) => {
            return <kbd key={key}>{key}</kbd>;
          })}
        </div>
      )}
    </Command.Item>
  );
}
