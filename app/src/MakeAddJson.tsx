import { Component, createSignal, Show } from "solid-js";
import styles from "./MakeAddJson.module.css";
import { css } from "../styled-system/css";
import { writeClipboard } from "@solid-primitives/clipboard";
import toast, { Toaster } from "solid-toast";

const App: Component = () => {
  const formatDate = (): string => {
    const date = new Date();
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${year}/${month}/${day}`;
  };

  const [url, setUrl] = createSignal("");
  const [author, setAuthor] = createSignal(""); // nostr: npub or atp: did
  const [id, setId] = createSignal(""); // nostr: note_id or atp: id
  const [date, setDate] = createSignal("");
  const [memo, setMemo] = createSignal("");
  const [platform, setPlatform] = createSignal<"nostr" | "atp">("nostr");

  const onClickCopy = async (): Promise<void> => {
    let data: object;

    const baseData = {
      url: url(),
      date: date() !== "" ? date() : formatDate(),
    };

    const platformData =
      platform() === "nostr"
        ? {
            nostr: {
              author: author(),
              post_id: id(),
            },
          }
        : {
            // atp
            atp: {
              author: author(),
              id: id(),
            },
          };

    // memoが空でない場合のみ追加
    const memoData = memo() !== "" ? { memo: memo() } : {};

    data = {
      ...baseData,
      ...memoData,
      ...platformData,
    };

    try {
      await writeClipboard(JSON.stringify(data, null, 2));
      toast.success("copied");
    } catch (error) {
      toast.error("failed to copy");
    }
  };

  const onClickReset = (): void => {
    setUrl("");
    setAuthor("");
    setId("");
    setDate("");
    setMemo("");
    setPlatform("nostr");
  };

  return (
    <>
      <div class={css({ wordBreak: "break-all", whiteSpace: "pre-wrap" })}>
        {/* プラットフォーム選択 */}
        <div class={styles.platformSelector}>
          <label>
            <input
              type="radio"
              name="platform"
              value="nostr"
              checked={platform() === "nostr"}
              onChange={() => setPlatform("nostr")}
            />
            Nostr
          </label>
          <label style={{ "margin-left": "10px" }}>
            <input
              type="radio"
              name="platform"
              value="atp"
              checked={platform() === "atp"}
              onChange={() => setPlatform("atp")}
            />
            ATP (Bluesky)
          </label>
        </div>

        {/* 入力フィールド */}
        <ul>
          <li>
            image url:{" "}
            <input
              type="text"
              class={styles.input}
              value={url()}
              onInput={(e) => setUrl(e.currentTarget.value)}
            />
          </li>
          <li>
            <Show when={platform() === "nostr"} fallback={"author (did): "}>
              author (npub):
            </Show>
            <input
              type="text"
              class={styles.input}
              value={author()}
              onInput={(e) => setAuthor(e.currentTarget.value)}
            />
          </li>
          <li>
            <Show when={platform() === "nostr"} fallback={"id (post id): "}>
              id (note id):
            </Show>
            <input
              type="text"
              class={styles.input}
              value={id()}
              onInput={(e) => setId(e.currentTarget.value)}
            />
          </li>
          <li>
            date (デフォルト: {formatDate()}):{" "}
            <input
              type="text"
              class={styles.input}
              value={date()}
              onInput={(e) => setDate(e.currentTarget.value)}
            />
          </li>
          <li>
            memo:{" "}
            <input
              type="text"
              class={styles.input}
              value={memo()}
              onInput={(e) => setMemo(e.currentTarget.value)}
            />
          </li>
        </ul>
        <button
          type="button"
          class={`${styles.button} ${styles.btn1}`}
          onClick={onClickCopy}
        >
          Copy
        </button>
        <button
          type="button"
          class={`${styles.button} ${styles.btn2}`}
          onClick={onClickReset}
        >
          Reset
        </button>
      </div>

      <Toaster />
    </>
  );
};

export default App;
