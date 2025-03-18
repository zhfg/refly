import { useTranslation } from 'react-i18next';
import { Card, Typography, Button } from 'antd';
import { AiOutlineAppstore } from 'react-icons/ai';
import { memo, useEffect } from 'react';
import { useSiderStoreShallow } from '@refly-packages/ai-workspace-common/stores/sider';

const { Title, Paragraph } = Typography;

// Define TypeScript interfaces for our data structure
interface Artifact {
  id: string;
  title: string;
  description?: string;
  coverImage: string;
  type: 'canvas' | 'code' | 'answer' | 'doc';
  author?: string;
  authorEmail?: string;
  url: string;
}

interface ArtifactGalleryProps {
  maxItems?: number;
  showViewMore?: boolean;
  title?: string;
  description?: string;
  showHeader?: boolean;
}

// Sample artifacts data
const sampleArtifacts: Artifact[] = [
  {
    id: '1',
    title: 'JAPAN LBO QUEST',
    description:
      'An interactive quest game with a Japanese theme, featuring leaderboards and battle stats tracking.',
    coverImage: 'https://static.refly.ai/share-cover/can-zxoztlncdztm6wtvc893dvkt.png',
    type: 'canvas',
    author: 'kavan',
    authorEmail: 'kavan****rick@gmail.com',
    url: '/share/canvas/japenese-quest',
  },
  {
    id: '2',
    title: 'Quantum Computing Learning Hub',
    description:
      'Explore the fascinating world of quantum computing through interactive visualizations and learning experiences.',
    coverImage: 'https://static.refly.ai/share-cover/can-io39kq9tiaoey5tkm4gngbfj.png',
    type: 'canvas',
    author: 'roxa',
    authorEmail: 'roxa****g@gmail.com',
    url: '/share/canvas/quantum-computing',
  },
  {
    id: '3',
    title: 'Stock Pattern Matcher',
    description:
      'Advanced tool for identifying stock patterns and market trends with visual comparisons.',
    coverImage: 'https://static.refly.ai/share-cover/can-nnz3d3ly5115zxyx5ufy0yj2.png',
    type: 'code',
    author: '142',
    authorEmail: '142****@g****.com',
    url: '/share/code/stock-pattern',
  },
  {
    id: '4',
    title: 'Discover the Wonder of Physics',
    description:
      'Comprehensive physics modules designed to make learning engaging and interactive for middle school students.',
    coverImage: 'https://static.refly.ai/share-cover/can-zxoztlncdztm6wtvc893dvkt.png',
    type: 'doc',
    author: 'tin',
    authorEmail: 'tin****206@gmail.com',
    url: '/share/doc/physics-wonder',
  },
  {
    id: '5',
    title: 'IBIT ETF Dashboard',
    description:
      'Financial dashboard for tracking and analyzing IBIT ETF performance with price history and market comparison.',
    coverImage: 'https://static.refly.ai/share-cover/can-zxoztlncdztm6wtvc893dvkt.png',
    type: 'canvas',
    author: 'je',
    authorEmail: 'je****001@gmail.com',
    url: '/share/canvas/ibit-dashboard',
  },
  {
    id: '6',
    title: 'Super Mario Minecraft Style',
    description:
      'A creative fusion of Super Mario and Minecraft game elements in an interactive environment.',
    coverImage: 'https://static.refly.ai/share-cover/can-zxoztlncdztm6wtvc893dvkt.png',
    type: 'code',
    author: 'eric',
    authorEmail: 'eric****@s***.com',
    url: '/share/code/mario-minecraft',
  },
  {
    id: '7',
    title: 'Room with Calm Pop Culture Vibe',
    description:
      'Interior design concepts featuring calm aesthetics with pop culture influences and custom styling.',
    coverImage: 'https://static.refly.ai/share-cover/can-zxoztlncdztm6wtvc893dvkt.png',
    type: 'canvas',
    author: 'eric',
    authorEmail: 'eric****lab@gmail.com',
    url: '/share/canvas/calm-room',
  },
  {
    id: '8',
    title: 'Zinc Oxide Growth on Nickel Foam',
    description:
      'Scientific research on hydrothermal synthesis process for growing ZnO crystals on nickel foam substrates.',
    coverImage: 'https://static.refly.ai/share-cover/can-zxoztlncdztm6wtvc893dvkt.png',
    type: 'doc',
    author: 'kate',
    authorEmail: 'kate****sci@gmail.com',
    url: '/share/doc/zinc-oxide-growth',
  },
];

const ArtifactGallery = memo(
  ({
    maxItems = 8,
    showViewMore = true,
    title,
    description,
    showHeader = true,
  }: ArtifactGalleryProps) => {
    const { i18n } = useTranslation();

    const { setCollapse } = useSiderStoreShallow((state) => ({
      collapse: state.collapse,
      setCollapse: state.setCollapse,
    }));

    // Force collapse by default
    useEffect(() => {
      setCollapse(true);
    }, [setCollapse]);

    // Default header configuration
    const defaultHeader = {
      tag: 'Refly Artifacts Gallery',
      tagIcon: <AiOutlineAppstore />,
      title: 'Discover and explore incredible artifacts created with Refly.',
      color: '#333333',
      tagShadow:
        '0 3px 20px 0 rgba(0,0,0,0.10), 0 2px 4px 0 rgba(0,0,0,0.10), inset 0 -4px 0 0 rgba(227,227,227,0.50)',
    };

    // Limit the number of artifacts to display
    const displayedArtifacts = sampleArtifacts.slice(0, maxItems);

    return (
      <section
        className={`relative mx-auto ${
          showHeader ? 'mt-[98px]' : ''
        } max-w-7xl px-4 py-16 sm:px-6 sm:py-24`}
      >
        {/* Header Section */}
        {showHeader ? (
          <div className="mb-16 text-center">
            <span
              className="mb-8 inline-flex items-center justify-center rounded-lg border border-solid border-black/10 bg-white px-6 py-2 font-['Alibaba_PuHuiTi_Bold',system-ui,-apple-system,sans-serif] text-sm"
              style={{
                color: defaultHeader.color,
                boxShadow: defaultHeader.tagShadow,
              }}
            >
              <span className="mr-2 flex items-center" style={{ color: defaultHeader.color }}>
                {defaultHeader.tagIcon}
              </span>
              <span>{defaultHeader.tag}</span>
            </span>
            <section className="text-center">
              <Title
                level={2}
                className="font-['Alibaba_PuHuiTi_Bold',system-ui,-apple-system,sans-serif]"
              >
                {i18n.language === 'zh-CN' ? (
                  <div className="mt-2">
                    <span className="relative text-[#333333]">
                      {title || 'Refly Spaces 展示'}
                      <span className="absolute bottom-0 left-0 h-1 w-full bg-[#333333]" />
                    </span>
                  </div>
                ) : (
                  <div className="mt-2">
                    <span className="relative text-[#333333]">
                      {title || 'Refly Spaces gallery'}
                      <span className="absolute bottom-0 left-0 h-1 w-full bg-[#333333]" />
                    </span>
                  </div>
                )}
              </Title>
              <Paragraph className="mx-auto mt-4 max-w-3xl text-center text-gray-500">
                {description || defaultHeader.title}
              </Paragraph>
            </section>
          </div>
        ) : null}

        {/* Artifacts Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {displayedArtifacts.map((artifact) => (
            <a
              key={artifact.id}
              href={artifact.url}
              target="_blank"
              rel="noopener noreferrer"
              className="no-underline text-inherit"
            >
              <Card
                className="group overflow-hidden transition-all duration-300 hover:shadow-md cursor-pointer h-full"
                bodyStyle={{ padding: 0 }}
                cover={
                  <div className="relative h-48 w-full overflow-hidden">
                    <img
                      src={artifact.coverImage}
                      alt={artifact.title}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                }
              >
                <div className="p-6 flex flex-col h-[calc(100%-12rem)]">
                  <Title
                    level={4}
                    className="!mb-2 !mt-0 line-clamp-2"
                    style={{ color: '#333333' }}
                  >
                    {artifact.title}
                  </Title>
                  {artifact.description && (
                    <Paragraph className="!mb-4 text-gray-600 line-clamp-2 flex-grow">
                      {artifact.description}
                    </Paragraph>
                  )}
                  <div className="text-sm text-gray-400 mt-auto">
                    From {artifact.authorEmail || 'Anonymous'}
                  </div>
                </div>
              </Card>
            </a>
          ))}
        </div>

        {/* View More Button */}
        {showViewMore && (
          <div className="mt-12 text-center">
            <Button
              type="primary"
              shape="round"
              size="large"
              className="px-8 py-2 no-underline"
              style={{ backgroundColor: '#333333' }}
              href="/artifact-gallery"
            >
              Explore more Spaces
            </Button>
          </div>
        )}
      </section>
    );
  },
);

export default ArtifactGallery;
