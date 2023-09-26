import { Component } from "solid-js"
import styles from './Contact.module.css';
import MakeAddJson from "./MakeAddJson";
import { css } from "../styled-system/css";



const App: Component = () => {
    return (<>
    <h1 class={styles.title}>ほか</h1>
    <h3 class={styles.h3}>作者のNostrアカウント</h3>
    <a class={styles.link} href="https://nostter.vercel.app/mono@tsukemonogit.github.io" target="_blank" // 新しいタブでリンクを開く設定
      rel="noopener noreferrer" // セキュリティのために追加 recommended
 >mono</a>

    <h3 class={styles.h3}>作ったNostrのツールたち</h3>
    <div  class={css({display:'flex'})}>
        <a class={styles.link} href="https://nostr-bookmark-viewer3.vercel.app/" target="_blank" // 新しいタブでリンクを開く設定
      rel="noopener noreferrer" // セキュリティのために追加 recommended
 >ぶくまびうあ</a>
       <a class={styles.link} href="https://dupstr.vercel.app/" target="_blank" // 新しいタブでリンクを開く設定
      rel="noopener noreferrer" // セキュリティのために追加 recommended
 >イベント単品で他リレーに複製するやつ</a>
    </div>
    <div class={css({marginTop:'6rem'})}>
    <p class={css({marginTop:'10'})}>//管理者のためだけの画像追加用のやつ</p>
    <MakeAddJson/>
    </div>
    </>
    )
}

export default App;

