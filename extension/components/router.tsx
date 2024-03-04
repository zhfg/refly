import React, { useEffect, useState } from "react"
import { useNavigate, useMatch } from 'react-router-dom'
import classNames from 'classnames';
import { Routing } from '~routes/index';
import { IconSearch, IconStorage } from "@arco-design/web-react/icon"


export const ContentRouter = () => {
    // 导航相关
    const navigate = useNavigate();
    const isThreadItem = useMatch('/thread/:threadId');
    const isHomePage = useMatch('/');

    // 处理状态
    const [activeTab, setActiveTab] = useState<'home' | 'session-library'>('home')

    useEffect(() => {
        if (!isThreadItem) {
            if (isHomePage) {
                setActiveTab('home')
            } else {
                setActiveTab('session-library')
            }
        }
    }, [isHomePage])

    return (
        <div>
            <Routing />
            {!isThreadItem && (
                <div className="footer-nav-container">
                    <div className="footer-nav">
                        <div className={classNames('nav-item', activeTab === 'home' && 'nav-item-active')} onClick={() => {
                            navigate('/')
                            setActiveTab('home')
                        }}>
                            <div className="nav-item-inner">
                                <IconSearch style={{ fontSize: 22 }} />
                                <p className="nav-item-title">主页</p>
                            </div>
                        </div>
                        <div className={classNames('nav-item', activeTab === 'session-library' && 'nav-item-active')} onClick={() => {
                            navigate('/thread')
                            setActiveTab('session-library')
                        }}>
                            <div className="nav-item-inner">
                                <IconStorage style={{ fontSize: 22 }} />
                                <p className="nav-item-title">会话库</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}