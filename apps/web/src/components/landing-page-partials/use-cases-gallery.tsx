import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AiOutlineAppstore } from 'react-icons/ai';
import { cn } from '@refly-packages/ai-workspace-common/utils/cn';
import { RiRobot2Fill, RiMarkdownLine, RiFile2Fill } from 'react-icons/ri';
import { Share2Icon, GitBranchIcon, LucideIcon } from 'lucide-react';
import { IconType } from 'react-icons';
import { Button, Card, Typography, Space } from 'antd';

const { Title, Paragraph } = Typography;

// Define TypeScript interfaces for our data structure
interface UseCase {
  id: string;
  title: string;
  description: string;
  category: string;
  coverImage: 'https://static.refly.ai/share-cover/can-zxoztlncdztm6wtvc893dvkt.png';
  icon?: IconType | LucideIcon;
}

interface Category {
  id: string;
  name: string;
}

const UseCasesGallery = () => {
  const { i18n } = useTranslation();
  const [activeCategory, setActiveCategory] = useState<string>('featured');

  // Header configuration
  const header = {
    tag: 'Use Case Gallery',
    tagIcon: <AiOutlineAppstore />,
    title: 'Learn how Refly handles real-world tasks through step-by-step workflow on Canvas.',
    color: '#000000',
    tagShadow:
      '0 3px 20px 0 rgba(0,0,0,0.10), 0 2px 4px 0 rgba(0,0,0,0.10), inset 0 -4px 0 0 rgba(227,227,227,0.50)',
  };

  // Mock categories
  const categories: Category[] = [
    { id: 'featured', name: 'Featured' },
    { id: 'research', name: 'Research' },
    { id: 'life', name: 'Life' },
    { id: 'data', name: 'Data Analysis' },
    { id: 'education', name: 'Education' },
    { id: 'productivity', name: 'Productivity' },
    { id: 'wtf', name: 'WTF' },
  ];

  // Mock icons that will be randomly assigned to use cases
  const icons: (IconType | LucideIcon)[] = [
    RiRobot2Fill,
    RiMarkdownLine,
    RiFile2Fill,
    Share2Icon,
    GitBranchIcon,
  ];

  // Mock use cases data
  const useCases: UseCase[] = [
    {
      id: '1',
      title: 'Trip to Japan in April',
      description:
        'Manus integrates comprehensive travel information to create personalized itineraries and produces a custom travel handbook tailored specifically for your Japanese adventure.',
      category: 'featured',
      coverImage: 'https://static.refly.ai/share-cover/can-zxoztlncdztm6wtvc893dvkt.png',
      icon: icons[0],
    },
    {
      id: '2',
      title: 'Deeply Analyze Tesla Stocks',
      description:
        "Manus delivers in-depth stock analysis with visually compelling dashboards that showcase comprehensive insights into Tesla's market performance and financial metrics.",
      category: 'featured',
      coverImage: 'https://static.refly.ai/share-cover/can-zxoztlncdztm6wtvc893dvkt.png',
      icon: icons[1],
    },
    {
      id: '3',
      title: 'Interactive Course on the Momentum Theorem',
      description:
        'Manus develops engaging video presentations for middle school educators, clearly explaining the momentum theorem through accessible and educational content.',
      category: 'education',
      coverImage: 'https://static.refly.ai/share-cover/can-zxoztlncdztm6wtvc893dvkt.png',
      icon: icons[2],
    },
    {
      id: '4',
      title: 'Comparative Analysis of Insurance Policies',
      description:
        'Looking to compare insurance options? Manus generates clear, structured comparison tables highlighting key policy information with optimal recommendations tailored to your needs.',
      category: 'featured',
      coverImage: 'https://static.refly.ai/share-cover/can-zxoztlncdztm6wtvc893dvkt.png',
      icon: icons[3],
    },
    {
      id: '5',
      title: 'B2B Supplier Sourcing',
      description:
        'Manus conducts comprehensive research across extensive networks to identify the most suitable suppliers for your specific requirements. As your dedicated agent, Manus works exclusively in your best interest.',
      category: 'research',
      coverImage: 'https://static.refly.ai/share-cover/can-zxoztlncdztm6wtvc893dvkt.png',
      icon: icons[4],
    },
    {
      id: '6',
      title: 'Research on AI Products for the Clothing Industry',
      description:
        'Manus conducted in-depth research on AI search products in the clothing industry with comprehensive product analysis and competitive positioning.',
      category: 'research',
      coverImage: 'https://static.refly.ai/share-cover/can-zxoztlncdztm6wtvc893dvkt.png',
      icon: icons[0],
    },
    {
      id: '7',
      title: 'List of YC Companies',
      description:
        'Manus expertly navigated the YC W25 database to identify all qualifying B2B companies, meticulously compiling this valuable information into a structured table.',
      category: 'data',
      coverImage: 'https://static.refly.ai/share-cover/can-zxoztlncdztm6wtvc893dvkt.png',
      icon: icons[1],
    },
    {
      id: '8',
      title: 'Online Store Operation Analysis',
      description:
        'Upload your Amazon store sales data and Manus delivers actionable insights, detailed visualizations, and customized strategies designed to increase your sales performance.',
      category: 'data',
      coverImage: 'https://static.refly.ai/share-cover/can-zxoztlncdztm6wtvc893dvkt.png',
      icon: icons[2],
    },
  ];

  // Filter use cases based on active category
  const filteredUseCases = useCases.filter(
    (useCase) => activeCategory === 'featured' || useCase.category === activeCategory,
  );

  return (
    <section className="relative mx-auto mt-[98px] max-w-7xl px-4 py-16 sm:px-6 sm:py-24">
      {/* Header Section */}
      <div className="mb-16 text-center">
        <span
          className="mb-8 inline-flex items-center justify-center rounded-lg border border-solid border-black/10 bg-white px-6 py-2 font-['Alibaba_PuHuiTi_Bold',system-ui,-apple-system,sans-serif] text-sm"
          style={{
            color: header?.color ?? '#000000',
            boxShadow: header?.tagShadow ?? '0 3px 20px 0 rgba(0,0,0,0.10)',
          }}
        >
          {header?.tagIcon && (
            <span className="mr-2 flex items-center" style={{ color: header?.color ?? '#000000' }}>
              {typeof header.tagIcon === 'string' ? header.tagIcon : header.tagIcon}
            </span>
          )}
          <span>{header?.tag}</span>
        </span>
        <section className="text-center">
          <Title
            level={2}
            className="font-['Alibaba_PuHuiTi_Bold',system-ui,-apple-system,sans-serif]"
          >
            {i18n.language === 'zh-CN' ? (
              <div className="mt-2">
                <span className="relative text-[#3B82F6]">
                  使用案例展示
                  <span className="absolute bottom-0 left-0 h-1 w-full bg-[#3B82F6]" />
                </span>
              </div>
            ) : (
              <div className="mt-2">
                <span className="relative text-[#3B82F6]">
                  Use case gallery
                  <span className="absolute bottom-0 left-0 h-1 w-full bg-[#3B82F6]" />
                </span>
              </div>
            )}
          </Title>
          <Paragraph className="mx-auto mt-4 max-w-3xl text-center text-gray-500">
            {header.title}
          </Paragraph>
        </section>
      </div>

      {/* Category Tabs */}
      <Space wrap className="mb-10 flex justify-center">
        {categories.map((category) => (
          <Button
            key={category.id}
            type={activeCategory === category.id ? 'primary' : 'default'}
            onClick={() => setActiveCategory(category.id)}
            shape="round"
            className={cn(
              'transition-all duration-200',
              activeCategory === category.id && 'shadow-md',
            )}
          >
            {category.name}
          </Button>
        ))}
      </Space>

      {/* Use Cases Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {filteredUseCases.map((useCase) => {
          const IconComponent = useCase.icon || icons[Math.floor(Math.random() * icons.length)];

          return (
            <Card
              key={useCase.id}
              className="group overflow-hidden transition-all duration-300 hover:shadow-lg"
              bodyStyle={{ padding: 0 }}
              cover={
                <div className="relative h-48 w-full overflow-hidden">
                  <img
                    src={useCase.coverImage}
                    alt={useCase.title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
              }
            >
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                      <IconComponent className="h-4 w-4" />
                    </div>
                  </div>
                </div>
                <div className="min-w-0 flex-1 mt-2">
                  <Title level={4} className="!mb-2 !mt-0 line-clamp-2">
                    {useCase.title}
                  </Title>
                  <Paragraph className="!mb-0 text-gray-600 line-clamp-3">
                    {useCase.description}
                  </Paragraph>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </section>
  );
};

export default UseCasesGallery;
