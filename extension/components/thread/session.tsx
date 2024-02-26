import { Skeleton } from '@arco-design/web-react';
import React from 'react';
import type { Message, SessionItem, Source } from '~types';

// stores

interface SessionProps {
    session: SessionItem;
}

const SourceItem = (props: { source: Source, rank: number }) => {
    const { source, rank } = props;
    return (
        <div>
            <a href={source.meta?.source} target='_blank'></a>
            <div>{source?.meta?.title}</div>
            <div>
                <div>排名：{rank}</div>
                <div><img src={`https://www.google.com/s2/favicons?domain=${source?.meta?.source}&sz=${16}`} alt={source?.meta?.source} /> </div>
            </div>
        </div>
    )
}

export const Session = (props: SessionProps) => {
    const { session } = props;

    return (
        <div>
            <div>问题<p>{session.question}</p></div>
            {session?.sources?.length > 0 && (
                <div>来源
                    {session.sources?.map((item, index) => <SourceItem source={item} key={index} rank={index + 1} />)}
                </div>
            )}
            {
                session?.answer ? (
                    <div>答案 <p>{session.answer}</p></div>
                ) : <Skeleton></Skeleton>
            }
            {session?.relatedQuestions && (
                <div>相关问题：
                    {session?.relatedQuestions?.map(item => (
                        <div>{item}</div>
                    ))}
                </div>
            )}
        </div>
    )
}