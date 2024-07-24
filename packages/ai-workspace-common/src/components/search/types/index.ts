import { SearchResult } from '@refly/openapi-schema';

export interface RenderItem {
  domain: string;
  heading: string;
  data: SearchResult[];
  icon: React.ReactNode;
  action?: boolean;
  actionHeading?: { create: string };
  onItemClick?: (item: SearchResult) => void;
  onCreateClick?: () => void;
}
