import { Spin as AntdSpin, SpinProps } from 'antd';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';

export const Spin = (props: SpinProps) => {
  return <AntdSpin indicator={<AiOutlineLoading3Quarters className="animate-spin" />} {...props} />;
};
