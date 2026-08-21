/* eslint-disable no-undef */
self.onmessage = async function (event) {
  // 失败时回传 error 字段,避免主线程的 Promise 永远挂起(插件侧已支持 reject)
  try {
    self.postMessage({
      uid: event.data.uid,
      message: await handleMessage(event.data.message)
    })
  } catch (error) {
    self.postMessage({
      uid: event.data.uid,
      error: error instanceof Error ? error.message : String(error)
    })
  }
}

function handleMessage(message) {
  switch (message.type) {
    case 'format':
      return handleFormatMessage(message)
  }
}

async function handleFormatMessage(message) {
  if (!globalThis.prettier) {
    await Promise.all([
      import('https://cdn.jsdelivr.net/npm/prettier@3.7.4/standalone.js'),
      import('https://cdn.jsdelivr.net/npm/prettier@3.7.4/plugins/babel.js'),
      import('https://cdn.jsdelivr.net/npm/prettier@3.7.4/plugins/estree.js'),
      import('https://cdn.jsdelivr.net/npm/prettier@3.7.4/plugins/html.js'),
      import('https://cdn.jsdelivr.net/npm/prettier@3.7.4/plugins/markdown.js'),
      import('https://cdn.jsdelivr.net/npm/prettier@3.7.4/plugins/typescript.js'),
      import('https://cdn.jsdelivr.net/npm/prettier@3.7.4/plugins/postcss.js')
    ])
  }

  const { options, source } = message
  const formatted = await prettier.format(source, {
    parser: 'markdown',
    plugins: prettierPlugins,
    ...options
  })

  return formatted
}
