import React, { useRef } from 'react'
import { Button, Skeleton, Space, Input, } from '@arco-design/web-react'
import {
    IconMinusCircle,
    IconSend
} from "@arco-design/web-react/icon"

import styleText from "data-text:./index.scss"

// stores
import { useChatStore } from '~stores/chat'
import { useMessageStateStore } from '~stores/message-state'
// 组件
import { Session } from './session'
import { TASK_TYPE, type SessionItem } from '~types'
import type { PlasmoGetStyle } from 'plasmo'
import type { RefTextAreaType } from '@arco-design/web-react/es/Input'
import { useBuildTask } from '~hooks/use-build-task'
import { useSiderSendMessage } from '~hooks/use-sider-send-message'

interface ThreadItemProps {
    sessions: SessionItem[];
}

export const getStyle: PlasmoGetStyle = () => {
    const style = document.createElement("style")
    style.textContent = styleText
    return style
}

const TextArea = Input.TextArea

export const ThreadItem = (props: ThreadItemProps) => {
    const { sessions } = props;
    const inputRef = useRef<RefTextAreaType>()
    const { handleSideSendMessage } = useSiderSendMessage();
    const chatStore = useChatStore();
    const messageStateStore = useMessageStateStore();
    const { buildShutdownTaskAndGenResponse } = useBuildTask()

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        e.stopPropagation()

        inputRef.current?.dom?.onkeydown?.(e as any as KeyboardEvent)
    }

    const handleAskFollowing = () => {
        const question = chatStore.newQAText;
        console.log('handleThread', chatStore.isNewConversation, chatStore.newQAText
        )
        handleSideSendMessage(question);
    }

    return (
        <div className='session-container'>
            <div className='session-inner-container'>
                {sessions?.map((item, index) => <Session key={index} session={item} />)}
            </div>
            {!messageStateStore?.pending &&
                <div className="footer input-panel">
                    <div className="actions">
                        {messageStateStore.taskType === TASK_TYPE.CHAT &&
                            messageStateStore?.pending && (
                                <div className="stop-reponse">
                                    <Button
                                        type="outline"
                                        className="btn"
                                        icon={<IconMinusCircle />}
                                        onClick={buildShutdownTaskAndGenResponse}>
                                        停止响应
                                    </Button>
                                </div>
                            )}
                    </div>

                    <div className="input-box">
                        <TextArea
                            ref={inputRef}
                            className="message-input"
                            autoFocus
                            value={chatStore?.newQAText}
                            onChange={(value) => {
                                chatStore.setNewQAText(value);
                            }}
                            placeholder="基于网页进行提问任何内容..."
                            onKeyDownCapture={(e) => handleKeyDown(e)}
                            autoSize={{ minRows: 4, maxRows: 4 }}
                            style={{ borderRadius: 8, resize: "none", minHeight: 98, height: 98 }}></TextArea>
                        <div>
                            <div className="toolbar">
                                <Space>
                                </Space>
                                <Button shape="circle" icon={<IconSend color="white" />} onClick={handleAskFollowing}></Button>

                            </div>

                        </div>
                    </div>
                </div>
            }
        </div>
    )
}