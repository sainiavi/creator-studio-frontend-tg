/// <reference types="vite/client" />

declare global {
  interface Window {
    __creatorStudioRoot?: import("react-dom/client").Root;
  }
}

declare module "*.MOV" {
  const src: string;
  export default src;
}

declare module "*.mov" {
  const src: string;
  export default src;
}
