const messages = {
  loadmore: {
    loading: '正在加载...',
    finished: '没有更多了',
    error: '加载失败',
    retry: '点击重试',
  },
}

export const useTranslate = (name?: keyof typeof messages) => {
  const translate = (key: string) => {
    if (!name) return key
    return (messages[name] as Record<string, string>)[key] ?? key
  }

  return { translate }
}
