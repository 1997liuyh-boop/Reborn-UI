const mode = ['scaleToFill', 'aspectFit', 'aspectFill', 'widthFix', 'heightFix', 'top', 'bottom', 'center', 'left', 'right', 'top left', 'top right', 'bottom left', 'bottom right']
export default {
  slots: {
    root: 'relative flex flex-row items-center justify-center overflow-hidden',
    error: 'absolute h-full w-full bg-gray-2 dark:bg-gray-7 flex flex-col items-center justify-center',
    errorIcon: 'text-gray-4',
    loading: 'absolute h-full w-full bg-gray-2 dark:bg-gray-7 flex flex-col items-center justify-center',
    loadingIcon: 'text-gray-4',
    inner: 'w-full h-full',
  },
  variants: {
    round: {
      true: {
        root: 'rounded-xl',
      },
    },
  },
}

export { mode as imageMode }
