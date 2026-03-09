export class AbortablePromise<T> {
  promise: Promise<T>
  private rejectFn: ((reason?: any) => void) | null = null

  constructor(executor: (resolve: (value: T | PromiseLike<T>) => void, reject: (reason?: any) => void) => void) {
    this.promise = new Promise<T>((resolve, reject) => {
      this.rejectFn = reject
      executor(resolve, reject)
    })
  }

  abort(reason?: any) {
    this.rejectFn?.(reason)
  }

  then<TResult1 = T, TResult2 = never>(
    onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null,
  ) {
    return this.promise.then(onfulfilled ?? undefined, onrejected ?? undefined)
  }

  catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null) {
    return this.promise.catch(onrejected ?? undefined)
  }
}
