import { Component } from "solid-js"
import styles from './Contact.module.css';
import MakeAddJson from "./MakeAddJson";
import { css } from "../styled-system/css";



const App: Component = () => {
  return (<div class={style.container}>
    <h1 class={styles.title}>ほか</h1>
    <h3 class={styles.h3}>リンク</h3>
    <div class={styles.item}><a class={styles.link} href="https://nostter.vercel.app/mono_gazo@tsukemonoGit.github.io" target="_blank" // 新しいタブでリンクを開く設定
      rel="noopener noreferrer" // セキュリティのために追加 recommended
    >もの画像BOT</a></div>

    <div class={styles.item}><a class={styles.link} href="https://github.com/TsukemonoGit/nostr-monoGazo-bot" target="_blank" // 新しいタブでリンクを開く設定
      rel="noopener noreferrer" // セキュリティのために追加 recommended
    >このページのソースコード</a>  </div>

    <div class={styles.item}><a class={styles.link} href="https://nostter.vercel.app/mono@tsukemonogit.github.io" target="_blank" // 新しいタブでリンクを開く設定
      rel="noopener noreferrer" // セキュリティのために追加 recommended
    >作者（mono）</a>    </div>

    <h3 class={styles.h3}>作ったNostrのツールたち</h3>

    <div class={styles.item}><a class={styles.link} href="https://nostviewstr.vercel.app/" target="_blank" // 新しいタブでリンクを開く設定
      rel="noopener noreferrer" // セキュリティのために追加 recommended
    >のすとびうあ</a></div>
    <div class={styles.item}><a class={styles.link} href="https://nostr-bookmark-viewer3.vercel.app/" target="_blank" // 新しいタブでリンクを開く設定
      rel="noopener noreferrer" // セキュリティのために追加 recommended
    >ぶくまびうあ</a></div>
    <div class={styles.item}><a class={styles.link} href="https://dupstr.vercel.app/" target="_blank" // 新しいタブでリンクを開く設定
      rel="noopener noreferrer" // セキュリティのために追加 recommended
    >イベント単品で他リレーに複製するやつ</a></div>

    <div class={css({ marginTop: '6rem' })}>
      <p class={css({ marginTop: '10' })}>//管理者のためだけの画像追加用のやつ</p>
      <MakeAddJson />
    </div>
  </div>
  )
}

export default App;

const style = {
  container: css({
    fontFamily: 'Arial, sans-serif',
    padding: '20px',
    maxWidth: '800px',
    margin: '0 auto',
  }),
};