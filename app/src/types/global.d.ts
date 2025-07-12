export {};

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "nostr-container": {
        relays?: string;
        children?: any;
      };
      "nostr-profile": {
        id?: string;
        display?: string;
      };
    }
  }
}
