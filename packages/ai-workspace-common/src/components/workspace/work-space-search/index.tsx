import { Input } from '@arco-design/web-react';

import Logo from '@/assets/logo.svg'
import './index.scss'

import { useUserStore } from "@refly-packages/ai-workspace-common/stores/user"

const TextArea = Input.TextArea;

export const WorkSpaceSearch = () => {
  const userStore = useUserStore()
  return (
    <div className="work-space-search flex flex-col justify-center items-center">
      <img className="logo" src={Logo} alt="Refly" />
      <div className="text-2xl mt-5 mb-4 font-medium">
        Hello {userStore?.userProfile?.name},
        <span className="text-black/50"> How can I help you today?</span>
      </div>
      <TextArea placeholder='Enter something' style={{ minHeight: 64, width: 350 }} />
    </div>
  );
};
