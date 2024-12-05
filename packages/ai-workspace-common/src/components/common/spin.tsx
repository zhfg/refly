import { Spin as AntdSpin, SpinProps } from 'antd';
import { IconLoading } from './icon';

export const Spin = (props: SpinProps) => {
  return <AntdSpin indicator={<IconLoading className="animate-spin" />} {...props} />;
};
