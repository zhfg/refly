
export interface Source {
    pageContent: string;
    meta: {
        source: string;
        title: string;
    }
    score: number;
}

export interface SessionItem {
    question: string;
    sources: Source[];
    answer: string;
    relatedQuestions: string[]; // 推荐问题列表
}