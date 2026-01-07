declare module '#app' {
  interface NuxtApp {
    $prettier: {
        format: (code: string, options?: any) => Promise<string>
    }
  }
}

declare module 'vue' {
  interface ComponentCustomProperties {
    $prettier: {
        format: (code: string, options?: any) => Promise<string>
    }
  }
}

export {}
