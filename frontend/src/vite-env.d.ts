/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Network id passed to the Lace wallet (e.g. 'preview', 'preprod') */
  readonly VITE_NETWORK_ID?: string;
  /** Deployed DevMatch contract address */
  readonly VITE_CONTRACT_ADDRESS?: string;
  /** Indexer HTTP URL */
  readonly VITE_INDEXER_URL?: string;
  /** Indexer WebSocket URL */
  readonly VITE_INDEXER_WS_URL?: string;
  /** Proof server URL (default http://127.0.0.1:6300) */
  readonly VITE_PROOF_SERVER_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
