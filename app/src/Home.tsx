import { css } from "../styled-system/css";
import { createSignal, Index, onMount, Show, type Component } from "solid-js";
import jsonData from "./assets/data/imageList.json";
//import Rss from "./Rss";
import MonoGazoPosts from "./MonoGazoPosts";
import { A } from "@solidjs/router";
/* import "@konemono/nostr-web-components";
import "@konemono/nostr-web-components/style.css"; */

const App: Component = () => {
  const [nostrReady, setNostrReady] = createSignal(false);

  onMount(async () => {
    try {
      /*      await import("@konemono/nostr-web-components");
      await import("@konemono/nostr-web-components/style.css");

      await customElements.whenDefined("nostr-container");
      await customElements.whenDefined("nostr-profile"); */

      setNostrReady(true);
    } catch (error) {
      console.error("Failed to load nostr components:", error);
    }
  });

  const rootUrl = window.location.origin + "/nostr-monoGazo-bot/";
  return (
    <div class={styles.appContainer}>
      <div class={styles.container}>
        <h1 class={styles.title}>
          <img
            class={css({
              height: "1.5em",
              width: "auto",
              display: "flex",
              marginRight: "2",
            })}
            src="/nostr-monoGazo-bot/images/2.png"
            alt="₍ ･ᴗ･ ₎"
          />{" "}
          monoGazo List
          <span
            class={`makibishi ${css({ marginLeft: "6px" })}`}
            data-url={rootUrl}
          ></span>
        </h1>

        <p class={css({ paddingBottom: 2 })}>
          nostrの
          <span class={css({ display: "inline-flex", padding: "0 4px " })}>
            <nostr-profile
              display="name"
              user="npub1lxrlhyrfdl9sjdvx9xhwhag4d6s95sz3q8z09kgzp0cz73l2ffys9p726u"
            ></nostr-profile>
          </span>
          が集めた画像たち
        </p>

        <p class={css({ paddingBottom: 2 })}>
          <A href="/moji" class={css({ textDecoration: "underline" })}>
            ものもじリスト
          </A>
          もあるよ
        </p>

        <Show
          when={jsonData && jsonData.length > 0}
          fallback={<p class={styles.noData}>No data available.</p>}
        >
          <Show when={nostrReady()}>
            <nostr-container relays='["wss://nos.lol","wss://yabu.me","wss://wot.nostr.net"]'>
              <div class={styles.imageList}>
                <Index each={jsonData}>
                  {(item, index) => (
                    <div class={styles.imageItem}>
                      <Show
                        when={
                          item().url.endsWith(".mov") ||
                          item().url.endsWith(".mp4") ||
                          item().url.endsWith(".avi")
                        }
                        fallback={
                          <img
                            src={item().url}
                            alt={`Image ${index}`}
                            loading="lazy"
                          />
                        }
                      >
                        <video controls width="200">
                          <source src={item().url} type="video/mp4" />
                          Your browser does not support the video tag.
                        </video>
                      </Show>

                      <div class={styles.imageInfo}>
                        <p class={styles.infoLine}>
                          <span>
                            <b>No.{index}</b> {item().date}
                          </span>
                          <a
                            aria-label="open in nostter"
                            target="_blank"
                            rel="noopener noreferrer"
                            href={`https://njump.me/${item().note}`}
                            class={styles.link}
                          >
                            <svg
                              class={styles.linkIcon}
                              xmlns="http://www.w3.org/2000/svg"
                              height="16"
                              viewBox="0 -960 960 960"
                              width="16"
                            >
                              <path
                                d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h280v80H200v560h560v-280h80v280q0 33-23.5 56.5T760-120H200Zm188-212-56-56 372-372H560v-80h280v280h-80v-144L388-332Z"
                                fill="#0000FF"
                              />
                            </svg>
                          </a>
                        </p>
                        <p class={styles.authorLine}>
                          Author:
                          <nostr-profile display="name" user={item().author} />
                        </p>
                      </div>
                    </div>
                  )}
                </Index>
              </div>
            </nostr-container>
          </Show>
        </Show>
      </div>
      {/*   <Rss /> */}
      <MonoGazoPosts />
    </div>
  );
};

export default App;

const styles = {
  appContainer: css({
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  }),

  container: css({
    padding: "20px",
    maxWidth: "1100px",
    margin: "0 auto",
    "@media (min-width: 1000px) and (max-width: 1600px)": {
      marginRight: "18em",
    },
  }),

  linkIcon: css({
    display: "inline-block",
    marginRight: "4px",
    verticalAlign: "top",
    width: "16px",
    height: "16px",
    flexShrink: 0,
    cursor: "pointer",
    transition: "fill 0.2s ease",
  }),

  title: css({
    fontSize: "2rem",
    fontWeight: "bold",
    marginBottom: "20px",
    display: "flex",
    marginTop: "20px",
  }),

  imageList: css({
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
    gap: "20px",
  }),

  imageItem: css({
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "14px 12px",
    border: "1px solid #ddd",
    borderRadius: "5px",
    backgroundColor: "#fafafa",
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
  }),

  imageInfo: css({
    marginTop: "10px",
    width: "100%",
    fontSize: "14px",
    color: "#333",
  }),

  infoLine: css({
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    margin: 0,
    gap: "8px",
  }),

  authorLine: css({
    marginTop: "6px",
    fontSize: "13px",
    color: "#666",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    marginBottom: 0,
  }),

  link: css({
    textDecoration: "none",
    color: "inherit",
    "&:hover path": {
      fill: "#0050b3",
    },
  }),

  noData: css({
    fontSize: "1.2rem",
    color: "gray",
    textAlign: "center",
    marginTop: "20px",
  }),
};
