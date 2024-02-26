import React from 'react'
import { Skeleton } from '@arco-design/web-react'

// stores
import { useChatStore } from '~stores/chat'
// 组件
import { Session } from './session'
import type { SessionItem } from '~types'

interface ThreadItemProps {
    sessions: SessionItem[];
}

export const ThreadItem = (props: ThreadItemProps) => {
    const { sessions } = props;

    return (
        <div>
            {sessions?.map((item, index) => <Session key={index} session={item} />)}
        </div>
    )
}