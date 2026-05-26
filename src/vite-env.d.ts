/// <reference types="vite/client" />

declare module 'react-dom' {
  import type { ReactNode } from 'react';

  export function createPortal(children: ReactNode, container: Element | DocumentFragment): React.ReactPortal;
}

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_GOOGLE_CLIENT_ID: string;
  readonly VITE_ENABLE_DEV_BILLING?: string;
}
