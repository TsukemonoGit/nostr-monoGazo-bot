import { css } from "../styled-system/css";
import { createSignal, type Component, onMount, Show } from "solid-js";
import "@konemono/nostr-web-components";
import "@konemono/nostr-web-components/style.css";
const MonoGazoPosts: Component = () => {
  /*  const [nostrReady, setNostrReady] = createSignal(false);

  onMount(async () => {
    try {
      await import("@konemono/nostr-web-components");
      await import("@konemono/nostr-web-components/style.css");

      await customElements.whenDefined("nostr-container");
      await customElements.whenDefined("nostr-profile");
      await customElements.whenDefined("nostr-list");
      setNostrReady(true);
    } catch (error) {
      console.error("Failed to load nostr components:", error);
    }
  }); */
  return (
    <div class={styless.rss}>
      <h2 class={styless.rssTitle}>Nostr もの画像 Posts</h2>
      <div class={styless.rssContainer}>
        {/*    <Show when={nostrReady()}> */}
        <nostr-list
          filters='[{"kinds":[1],"limit":50 ,"authors":["f987fb90696fcb09358629aeebf5156ea05a405101c4f2d9020bf02f47ea4a49"]}]'
          limit="20"
        ></nostr-list>
        {/*   </Show> */}
      </div>
    </div>
  );
};

export default MonoGazoPosts;

const styless = {
  rssTitle: css({
    margin: "0 auto",
    fontWeight: "bolder",
  }),
  rss: css({
    backgroundColor: "amber.300",
    //width: '100%', // デフォルトは100%、画面の横幅いっぱいに表示
    order: 2, // デフォルトは2、画面が広いときは右側に表示
    // marginBottom: '20px', // マージンを設定してください
    "@media (min-width: 800px)": {
      position: "fixed",
      top: "4em",
      bottom: "2em",
      right: "5px",
      width: "18em",
    },
    "@media (min-width: 1500px)": {
      position: "fixed",
      top: "4em",
      bottom: "2em",
      right: "15px",
      width: "18em",
    },
    margin: "5px",
    //padding: '5px',
    border: "1px solid #ddd",
    borderRadius: "5px",
    display: "grid",
    //maxHeight: "screen",
    maxWidth: "screen",
    // maxHeight: "40em",
    "& a": {
      textDecoration: "underline",
    },
    "& blockquote": {
      border: "1px solid #ddd",
      borderRadius: "10px",
      padding: "10px",
    },
  }),
  rssContainer: css({
    //backgroundColor: 'rgba(255, 255, 255, 0.8)',
    //maxWidth: "20em",
    padding: "4px",
    maxHeight: "screen",
    overflowY: "auto",
    overflowX: "hidden",
  }),
  rssEntry: css({
    overflowX: "none",
    backgroundColor: "white",
    margin: "0px 10px 10px 10px",
    padding: "5px",
    border: "1px solid #ddd",
    borderRadius: "5px",
    marginBottom: "10px",
    "& img , video": {
      maxWidth: "full",
      width: "15em",
    },
  }),
};
