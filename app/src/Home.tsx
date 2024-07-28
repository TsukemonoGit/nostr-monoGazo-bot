import { css } from "../styled-system/css";
import { Index, Show, type Component } from "solid-js";
import jsonData from "./assets/data/imageList.json";
import Rss from "./Rss";

const App: Component = () => {
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
        </h1>
        <span class="makibishi"></span>
        <p class={css({ paddingBottom: 2 })}>
          nostrの{" "}
          <a
            class={css({ textDecoration: "underline" })}
            target="_blank"
            rel="noopener noreferrer"
            href={`https://nostter.app/npub1lxrlhyrfdl9sjdvx9xhwhag4d6s95sz3q8z09kgzp0cz73l2ffys9p726u`}
          >
            もの画像BOT
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
          が集めた画像たち
        </p>

        <p class={css({ paddingBottom: 2 })}>
          <a
            class={css({ textDecoration: "underline" })}
            target="_blank"
            rel="noopener noreferrer"
            href={`https://nostviewstr.vercel.app/naddr1qqyx6mmwdakk76nfqgsgfvxyd2mfntp4avk29pj8pwz7pqwmyzrummmrjv3rdsuhg9mc9agrqsqqqafnn3n5r5`}
          >
            ものもじリスト
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
          もあるよ
        </p>

        <Show
          when={jsonData && jsonData.length > 0}
          fallback={<p class={styles.noData}>No data available.</p>}
        >
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
                    fallback={<img src={item().url} alt={`Image ${index}`} />}
                  >
                    <video controls width="200">
                      <source src={item().url} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                  </Show>
                  <div class={styles.imageInfo}>
                    <p>
                      <b>No.{index}</b> {item().date}
                      <a
                        aria-label={"open in nostter"}
                        target="_blank"
                        rel="noopener noreferrer"
                        href={`https://nostter.app/${item().note}`}
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
                  </div>
                </div>
              )}
            </Index>
          </div>
        </Show>
      </div>
      <Rss />
    </div>
  );
};

export default App;

const styles = {
  appContainer: css({
    display: "flex",
    flexDirection: "row", // デフォルトは横に並べる
    flexWrap: "wrap", // コンポーネントが横幅を超えた場合に折り返す
    justifyContent: "space-between", // コンポーネント間のスペースを最大化
  }),

  container: css({
    // maxHeight: "screen",
    // overflowY: 'auto',
    padding: "20px",
    maxWidth: "1000px",
    margin: "0 auto",
    "@media (min-width: 800px) and (max-width: 1600px) ": {
      marginRight: "18em",
    },
  }),

  header: css({}),
  link: css({}),
  linkIcon: css({
    display: "inline-block",
    marginRight: "4px", // アイコンとテキストの間隔を調整
    verticalAlign: "top", // アイコンをテキストと中央揃え
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
    padding: "10px",
    border: "1px solid #ddd",
    borderRadius: "5px",
  }),
  imageInfo: css({
    marginTop: "10px",
  }),
  noData: css({
    fontSize: "1.2rem",
    color: "gray",
    textAlign: "center",
    marginTop: "20px",
  }),
};
