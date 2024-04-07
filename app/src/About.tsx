import { Component, For, Show } from "solid-js";
import styles from "./About.module.css";
import { css } from "../styled-system/css";
import { commandList } from "./aboutData";

const App: Component = () => {
  return (
    <div class={style.container}>
      <div class={styles.background} />

      <h1 class={styles.title}>About</h1>
      <div>
        <p class={css({ backgroundColor: "rgba(255, 255, 255, 0.5)" })}>
          もの画像BOTのコマンドの情報とかなんとか
        </p>
        <p class={css({ backgroundColor: "rgba(255, 255, 255, 0.5)" })}>
          もの画像BOTが起動したときに₍ ･ᴗ･ ₎がでます
        </p>
        <p class={css({ backgroundColor: "rgba(255, 255, 255, 0.5)" })}>
          ものの部分はmonoでもOk
        </p>
        <div class={styles.grid}>
          <div class={styles.gridItem}>反応ワード</div>
          <div class={styles.gridItem}>条件</div>
          <div class={styles.gridItem}>説明</div>

          <hr />
          <hr />
          <hr />
          <For each={commandList}>
            {(item, index) => (
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

                <div class={styles.gridItem}>{item.rule}</div>
                <div class={styles.gridItem}>{item.description}</div>
              </>
            )}
          </For>
        </div>
      </div>
      <div class={css({ marginTop: "2rem", padding: "2rem" })}>
        <p class={css({ backgroundColor: "rgba(255, 255, 255, 0.5)" })}>
          (以下管理者限定コマンド)
        </p>

        <div class={styles.grid}>
          <div class={styles.gridItem}>反応ワード</div>
          <div class={styles.gridItem}>条件</div>
          <div class={styles.gridItem}>説明</div>

          <hr />
          <hr />
          <hr />

          <div class={styles.gridItem}>{"追加 {(追加するURLなど)}"}</div>
          <div class={styles.gridItem}>リプライ</div>
          <div class={styles.gridItem}>もの画像リストに追加</div>

          <div class={styles.gridItem}>削除 [number]</div>
          <div class={styles.gridItem}>リプライ</div>
          <div class={styles.gridItem}>もの画像リストから削除</div>

          <div class={styles.gridItem}>p [number] [comment]</div>
          <div class={styles.gridItem}></div>
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
