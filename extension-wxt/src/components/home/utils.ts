import type { UploadingStatus } from './types'

export const getLoadingStatusText = (uploadingStatus: UploadingStatus) => {
    switch (uploadingStatus) {
        case 'normal': return ''
        case 'loading': return '阅读中...'
        case 'success': return '已完成阅读，可以基于此网页进行提问！'
        case 'failed': return '阅读失败，请尝试重试'
    }
}