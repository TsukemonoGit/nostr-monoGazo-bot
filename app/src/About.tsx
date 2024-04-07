import { Component } from "solid-js";
import styles from "./About.module.css";
import { css } from "../styled-system/css";

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

          <div class={styles.gridItem}>もの画像</div>

          <div class={styles.gridItem}>完全一致</div>
          <div class={styles.gridItem}>もの画像リストの中から一枚リプライ</div>

          <div class={styles.gridItem}>
            あるふぉふぉ
            <hr class={styles.hr} />
            あるんふぉふぉ
          </div>
          <div class={styles.gridItem}>が含まれる</div>
          <div class={styles.gridItem}>
            もの画像のアイコンが変わる
            <br />
            嬉しいので
          </div>

          <div class={styles.gridItem}>
            ないふぉふぉ
            <hr class={styles.hr} />
            ないんふぉふぉ
          </div>
          <div class={styles.gridItem}>が含まれる</div>
          <div class={styles.gridItem}>あるふぉふぉがもらえる</div>

          <div class={styles.gridItem}>もの画像　[number]</div>
          <div class={styles.gridItem}>リプライ</div>
          <div class={styles.gridItem}>
            もの画像リストの[number]番の画像をリプライ（0始まり）
          </div>

          <div class={styles.gridItem}>ある（ん）ふぉふぉください</div>
          <div class={styles.gridItem}>リプライ</div>
          <div class={styles.gridItem}>あるんふぉふぉがもらえる</div>

          <div class={styles.gridItem}>
            [nostr:npub~] に<br />
            ある(ん)ふぉふぉ(を)送って
          </div>
          <div class={styles.gridItem}>リプライ</div>
          <div class={styles.gridItem}>
            [nostr:npub~]さんにあるふぉふぉをおくる
          </div>

          <div class={styles.gridItem}>ある（ん）ふぉふぉあげて</div>
          <div class={styles.gridItem}>リプライ</div>
          <div class={styles.gridItem}>TLにあるんふぉふぉを放流する</div>

          <div class={styles.gridItem}>もの画像 枚数</div>
          <div class={styles.gridItem}>リプライ</div>
          <div class={styles.gridItem}>現在のもの画像の総数をリプライ</div>

          <div class={styles.gridItem}>和暦</div>
          <div class={styles.gridItem}>リプライ</div>
          <div class={styles.gridItem}>
            和暦で今日の日付を教えてくれる
            <br />
            便利だね
          </div>

          <div class={styles.gridItem}>もの画像どこ？</div>
          <div class={styles.gridItem}></div>
          <div class={styles.gridItem}>もの画像Botがでてくる</div>

          <div class={styles.gridItem}>ものサイトどこ？</div>
          <div class={styles.gridItem}></div>
          <div class={styles.gridItem}>このサイトのURLをリプライ</div>
          <div class={styles.gridItem}>もの、〇〇vs△△vs...して</div>
          <div class={styles.gridItem}></div>
          <div class={styles.gridItem}>〇〇,△△,...からランダムでリプライ</div>
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
