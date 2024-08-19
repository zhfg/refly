import { useState } from 'react';
import { Input } from '@arco-design/web-react';

import Logo from '@/assets/logo.svg';
import './index.scss';

import { Search } from '@refly-packages/ai-workspace-common/components/search';
import { useUserStore } from '@refly-packages/ai-workspace-common/stores/user';

export const WorkSpaceSearch = () => {
  const userStore = useUserStore();

  const [showList, setShowList] = useState(false);

  return (
    <div className="work-space-search flex flex-col justify-center items-center">
      <img className="logo" src={Logo} alt="Refly" />
      <div className="text-2xl my-8 font-medium">
        Hello {userStore?.userProfile?.name},<span className="text-black/50"> How can I help you today?</span>
      </div>
      <div className="relative h-20 w-[750px]">
        <Search
          showList={showList}
          onSearchValueChange={(value) => {
            if (value && !showList) {
              setShowList(true);
            }
          }}
          style={{ width: '750px', position: 'absolute', top: '-10%', zIndex: 1000, margin: 'auto' }}
          onClick={() => setShowList(true)}
          onClickOutside={() => setShowList(false)}
        />
      </div>
    </div>
  );
};
