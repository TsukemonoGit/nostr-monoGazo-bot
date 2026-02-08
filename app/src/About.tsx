import { Component, For, Show } from "solid-js";
import styles from "./About.module.css";
import { css } from "../styled-system/css";
import { commandList } from "./aboutData";

const App: Component = () => {
  return (
    <div class={style.container}>
      <div class={styles.background} />

      <h1 class={styles.title}>もの画像BOT About</h1>
      <div>
        <p class={css({ backgroundColor: "rgba(255, 255, 255, 0.5)" })}>
          もの画像BOTのコマンドの情報と、NostrおよびATP (Bluesky)
          での対応状況です。
        </p>

        <p class={css({ backgroundColor: "rgba(255, 255, 255, 0.5)" })}>
          ものの部分はmonoでもOkです。
        </p>

        {/* --- 共通/一般ユーザー向けコマンド --- */}
        <h2 class={css({ marginTop: "2rem", marginBottom: "1rem" })}>
          一般ユーザー向けコマンド
        </h2>
        <div class={styles.grid}>
          <div class={styles.gridItem}>反応ワード</div>
          <div class={styles.gridItem}>Nostr</div>
          <div class={styles.gridItem}>ATP (Bluesky)</div>
          <div class={styles.gridItem}>説明</div>

          <hr />
          <hr />
          <hr />
          <hr />

          <For each={commandList}>
            {(item) => (
              <>
                <div class={styles.gridItem}>
                  <For each={item.command}>
                    {(command, index2) => (
                      <>
                        {command}
                        <Show when={index2() < item.command.length - 1}>
                          <hr class={styles.hr} />
                        </Show>
                      </>
                    )}
                  </For>
                </div>

                {/* Nostr対応 */}
                <div class={styles.gridItem}>{item.rule}</div>
                {/* ATP対応 */}
                <div class={styles.gridItem}>{item.atpRule || "未実装"}</div>
                {/* 説明 */}
                <div class={styles.gridItem}>{item.description}</div>
              </>
            )}
          </For>
        </div>
      </div>

      {/* --- 管理者/特殊コマンド --- */}
      <div class={css({ marginTop: "2rem", padding: "2rem" })}>
        <h2 class={css({ marginTop: "0", marginBottom: "1rem" })}>
          管理者・特殊コマンド
        </h2>
        <p class={css({ backgroundColor: "rgba(255, 255, 255, 0.5)" })}>
          (以下、一部は管理者限定コマンドです)
        </p>

        <div class={styles.grid}>
          <div class={styles.gridItem}>反応ワード</div>
          <div class={styles.gridItem}>Nostr</div>
          <div class={styles.gridItem}>ATP (Bluesky)</div>
          <div class={styles.gridItem}>説明</div>

          <hr />
          <hr />
          <hr />
          <hr />

          {/* 追加コマンド */}
          <div class={styles.gridItem}>{"追加 {(追加するURLなど)}"}</div>
          <div class={styles.gridItem}>リプライ (管理者)</div>
          <div class={styles.gridItem}>未実装</div>
          <div class={styles.gridItem}>もの画像リストに追加</div>

          {/* 削除コマンド */}
          <div class={styles.gridItem}>削除 [number]</div>
          <div class={styles.gridItem}>
            リプライ (管理者)
            <hr class={styles.hr} />
            リプライ (元投稿主)
          </div>
          <div class={styles.gridItem}>未実装</div>
          <div class={styles.gridItem}>
            もの画像リストから削除。管理者に加えて、対象画像の作者（同一pubkey）からの削除を受け付けています。
          </div>

          {/* p (point) コマンド */}
          <div class={styles.gridItem}>p [number] [comment]</div>
          <div class={styles.gridItem}>リプライ (管理者)</div>
          <div class={styles.gridItem}>リプライ (管理者)</div>
          <div class={styles.gridItem}>
            pointlog.jsonに保存され、現在のポイント獲得数をreactionする
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;

const style = {
  container: css({
    fontFamily: "Arial, sans-serif",
    padding: "20px",
    maxWidth: "800px",
    margin: "0 auto",
  }),
};
