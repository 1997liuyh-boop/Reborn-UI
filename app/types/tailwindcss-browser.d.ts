/**
 * @tailwindcss/browser 只发布了浏览器 IIFE 产物(dist/index.global.js),不带类型声明。
 * Playground 以副作用方式动态导入它(见 app/utils/runtimeTailwind.ts):
 * 导入即启动编译器,不需要任何导出成员,因此这里只声明模块存在。
 */
declare module "@tailwindcss/browser";
