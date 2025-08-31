// GitHub経由でimageList.jsonを取得するURL
const imageListURL =
  "https://raw.githubusercontent.com/TsukemonoGit/nostr-monoGazo-bot/refs/heads/main/imageList.json";

import { css, cx } from "../styled-system/css";
import {
  createSignal,
  Index,
  onMount,
  Show,
  type Component,
  createResource,
} from "solid-js";

import MonoGazoPosts from "./MonoGazoPosts";
import { A } from "@solidjs/router";
import { JsonData } from "./types/types";
import { getItemStyle, itemStyles } from "./borderColors";

// ATPプロフィール取得関数
async function fetchAtpProfile(did: string) {
  const res = await fetch(
    `https://public.api.bsky.app/xrpc/app.bsky.actor.getProfile?actor=${did}`
  );
  if (!res.ok) throw new Error("failed to fetch atp profile");
  return res.json();
}

const AtpAuthor: Component<{ did: string }> = (props) => {
  const [profile] = createResource(() => props.did, fetchAtpProfile);

  return (
    <Show when={profile()}>
      {(p) => (
        <A
          href={`https://bsky.app/profile/${props.did}`}
          target="_blank"
          rel="noopener noreferrer"
          class={css({
            color: "#0066cc",
            textDecoration: "underline",
            textDecorationColor: "transparent",
            fontWeight: "500",
            cursor: "pointer",
            transition: "all 0.2s ease",
            "&:hover": {
              color: "#0050b3",
              textDecorationColor: "#0050b3",
              textShadow: "0 1px 2px rgba(0, 102, 204, 0.2)",
            },
            "&:active": {
              color: "#003d82",
            },
          })}
        >
          {p().displayName ?? p().handle ?? props.did}
        </A>
      )}
    </Show>
  );
};

const App: Component = () => {
  const [nostrReady, setNostrReady] = createSignal(false);
  const [jsonData, setJsonData] = createSignal<JsonData>([]);

  onMount(async () => {
    try {
      const res = await fetch(imageListURL);
      if (!res.ok) throw new Error("fetch failed");
      const data: JsonData = await res.json();
      setJsonData(data);
      setNostrReady(true);
    } catch (error) {
      console.error("Failed to load data or nostr components:", error);
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
          when={jsonData().length > 0}
          fallback={<p class={styles.noData}>No data available.</p>}
        >
          <Show when={nostrReady()}>
            <nostr-container relays='["wss://nos.lol","wss://yabu.me","wss://nostr.compile-error.net"]'>
              <div class={styles.imageList}>
                <Index each={jsonData().slice().reverse()}>
                  {(item, index) => {
                    const reversedIndex = jsonData().length - 1 - index;
                    const url = item().url;
                    const isVideo =
                      url.endsWith(".mov") ||
                      url.endsWith(".mp4") ||
                      url.endsWith(".avi");

                    const linkHref = item().nostr
                      ? `https://njump.me/${item().nostr!.post_id}`
                      : item().atp
                        ? `https://bsky.app/profile/${item().atp!.author}/post/${item().atp!.id}`
                        : "#";

                    return (
                      <div class={getItemStyle(item())} id={item().id}>
                        <Show
                          when={isVideo}
                          fallback={
                            <img
                              src={url}
                              alt={`Image ${reversedIndex}`}
                              loading="lazy"
                            />
                          }
                        >
                          <video controls width="200">
                            <source src={url} type="video/mp4" />
                            Your browser does not support the video tag.
                          </video>
                        </Show>

                        <div class={styles.imageInfo}>
                          <p class={styles.infoLine}>
                            <span>
                              <b>No.{reversedIndex}</b> {item().date}
                            </span>
                            <a
                              aria-label="open in service"
                              target="_blank"
                              rel="noopener noreferrer"
                              href={linkHref}
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
                            Author:{" "}
                            <Show
                              when={item().nostr}
                              fallback={<AtpAuthor did={item().atp!.author} />}
                            >
                              <nostr-profile
                                display="name"
                                user={item().nostr!.author}
                              />
                            </Show>
                          </p>
                        </div>
                      </div>
                    );
                  }}
                </Index>
              </div>
            </nostr-container>
          </Show>
        </Show>
      </div>
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
    "@media (min-width: 800px) and (max-width: 1600px)": {
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
