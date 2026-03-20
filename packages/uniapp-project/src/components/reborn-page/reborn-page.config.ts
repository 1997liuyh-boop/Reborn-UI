const config = {
    slots: {
        root: 'min-h-screen w-full  bg-gray-2 transition-colors duration-300',
        header: 'flex flex-col gap-2 p-4',
        title: 'text-xl font-bold text-gray-800 dark:text-white',
        description: 'text-sm text-gray-5 dark:text-gray-3',
        body: 'p-4 flex flex-col gap-4',
    },
} as const

export type PageUI = {
    root?: string
    header?: string
    title?: string
    description?: string
    body?: string
}

export default config
