import React, { useState } from 'react';

// 静态资源
import Logo from "~assets/logo.svg"
import CloseGraySVG from "~assets/side/close.svg"
import NotificationSVG from "~assets/side/notification.svg"
import SettingGraySVG from "~assets/side/setting.svg"
import FullScreenSVG from "~assets/side/full-screen.svg"

// 组件
import { Avatar, List, Button, Skeleton } from "@arco-design/web-react"
// stores
import { useSiderStore } from "~stores/sider"
import { IconTip } from '~components/home/icon-tip';
import { IconClockCircle, IconRightCircle } from '@arco-design/web-react/icon';
import type { PlasmoGetStyle } from 'plasmo';
import { useNavigate } from 'react-router-dom';

const names = ['Socrates', 'Balzac', 'Plato'];
const avatarSrc = [
    '//p1-arco.byteimg.com/tos-cn-i-uwbnlip3yd/a8c8cdb109cb051163646151a4a5083b.png~tplv-uwbnlip3yd-webp.webp',
    '//p1-arco.byteimg.com/tos-cn-i-uwbnlip3yd/e278888093bef8910e829486fb45dd69.png~tplv-uwbnlip3yd-webp.webp',
    '//p1-arco.byteimg.com/tos-cn-i-uwbnlip3yd/9eeb1800d9b78349b24682c3518ac4a3.png~tplv-uwbnlip3yd-webp.webp',
];
const imageSrc = [
    '//p1-arco.byteimg.com/tos-cn-i-uwbnlip3yd/29c1f9d7d17c503c5d7bf4e538cb7c4f.png~tplv-uwbnlip3yd-webp.webp',
    '//p1-arco.byteimg.com/tos-cn-i-uwbnlip3yd/04d7bc31dd67dcdf380bc3f6aa07599f.png~tplv-uwbnlip3yd-webp.webp',
    '//p1-arco.byteimg.com/tos-cn-i-uwbnlip3yd/1f61854a849a076318ed527c8fca1bbf.png~tplv-uwbnlip3yd-webp.webp',
];
const dataSource = new Array(15).fill(null).map((_, index) => {
    return {
        id: index,
        index: index,
        avatar: avatarSrc[index % avatarSrc.length],
        title: names[index % names.length],
        description:
            'Beijing ByteDance Technology Co., Ltd. is an enterprise located in China. ByteDance has products such as TikTok, Toutiao, volcano video and Douyin (the Chinese version of TikTok).',
        imageSrc: imageSrc[index % imageSrc.length],
    };
});

const Header = () => {
    const siderStore = useSiderStore();

    return (
        <header>
            <div className="brand">
                <img src={Logo} alt="Refly" />
                <span>Refly</span>
            </div>
            <div className="funcs">
                <IconTip text="全屏">
                    <img src={FullScreenSVG} alt="全屏" />
                </IconTip>
                <IconTip text="通知">
                    <img src={NotificationSVG} alt="通知" />
                </IconTip>
                <IconTip text="设置">
                    <img src={SettingGraySVG} alt="设置" />
                </IconTip>
                <IconTip text="账户">
                    <Avatar size={16}>
                        <img
                            alt="avatar"
                            src="//p1-arco.byteimg.com/tos-cn-i-uwbnlip3yd/3ee5f13fb09879ecb5185e440cef6eb9.png~tplv-uwbnlip3yd-webp.webp"
                        />
                    </Avatar>
                </IconTip>
                <IconTip text="关闭">
                    <img
                        src={CloseGraySVG}
                        alt="关闭"
                        onClick={(_) => siderStore.setShowSider(false)}
                    />
                </IconTip>
            </div>
        </header>
    )
}

export const ThreadLibrary = () => {
    const [scrollLoading, setScrollLoading] = useState(<Skeleton />);
    const navigate = useNavigate();

    const fetchData = (currentPage) => {

    }

    return <div
        style={{
            height: "100%",
            display: "flex",
            flexDirection: "column"
        }}>
        <Header />
        <div className="thread-library-container">
            <p className='thread-library-title'>会话库</p>
            <div className="thread-library-list">
                <List
                    className='thread-library-list-item'
                    wrapperStyle={{ width: '100%' }}
                    bordered={false}
                    pagination={false}
                    dataSource={dataSource}
                    scrollLoading={scrollLoading}
                    onReachBottom={(currentPage) => fetchData(currentPage)}
                    noDataElement={<div>暂无数据</div>}
                    render={(item, index) => (
                        <List.Item
                            key={index}
                            style={{ padding: '20px 0', borderBottom: '1px solid var(--color-fill-3)' }}
                            actionLayout='vertical'
                            actions={[
                                <span key={1} className='thread-library-list-item-continue-ask with-border with-hover' onClick={() => {
                                    navigate(`/thread/${item?.id}`)
                                }}>
                                    <IconRightCircle style={{ fontSize: 14, color: '#64645F' }} />
                                    <span className='thread-library-list-item-text'>继续提问</span>
                                </span>,
                                <span key={2}>
                                    <IconClockCircle style={{ fontSize: 14, color: '#64645F' }} />
                                    <span className='thread-library-list-item-text'>13h</span>
                                </span>
                            ]}
                        >
                            <List.Item.Meta
                                title={item.title}
                                description={item.description}
                            />
                        </List.Item>
                    )}
                />
            </div>
        </div>
    </div>
}