import { Component } from "solid-js"
import styles from './About.module.css';
import { css } from "../styled-system/css";
import { readBuilderProgram } from "typescript";



const App: Component = () => {
    return (<>
        <div class={styles.background} />

        <h1 class={styles.title}>About</h1>
        <div >
            <p class={css({backgroundColor:'rgba(255, 255, 255, 0.5)'})}>もの画像BOTのコマンドの情報とかなんとか</p>
            <p class={css({backgroundColor:'rgba(255, 255, 255, 0.5)'})}>もの画像BOTが起動したときに₍ ･ᴗ･ ₎がでます</p>

            <div class={styles.grid}>
                <div class={styles.gridItem}>反応ワード</div>
                <div class={styles.gridItem}>条件</div>
                <div class={styles.gridItem}>説明</div>

                <hr /><hr /><hr />

                <div class={styles.gridItem}>もの画像<br />mono画像</div>
                <div class={styles.gridItem}>完全一致</div>
                <div class={styles.gridItem}>もの画像リストの中から一枚リプライします</div>



                <div class={styles.gridItem}>あるふぉふぉ<br />あるんふぉふぉ</div>
                <div class={styles.gridItem}>が含まれる</div>
                <div class={styles.gridItem}>もの画像のアイコンが変わる<br />嬉しいので</div>



                <div class={styles.gridItem}>ないふぉふぉ<br />ないんふぉふぉ</div>
                <div class={styles.gridItem}>が含まれる</div>
                <div class={styles.gridItem}>あるふぉふぉがもらえる</div>

                <div class={styles.gridItem}>もの画像　[number]<br />mono画像 [number]</div>
                <div class={styles.gridItem}>リプライ</div>
                <div class={styles.gridItem}>もの画像リストの[number]番の画像をリプライします（0始まり）</div>

                <div class={styles.gridItem}>[nostr:npub~] に<br />&nbsp;ある(ん)ふぉふぉ(を)送って</div>
                <div class={styles.gridItem}>リプライ</div>
                <div class={styles.gridItem}>[nostr:npub~]さんにあるふぉふぉをおくります</div>

                <div class={styles.gridItem}>もの画像 長さ<br/>mono画像 枚数</div>
                <div class={styles.gridItem}>リプライ</div>
                <div class={styles.gridItem}>現在のもの画像の総数をリプライします</div>

                <div class={styles.gridItem}>和暦</div>
                <div class={styles.gridItem}>リプライ</div>
                <div class={styles.gridItem}>和暦で今日の日付を教えてくれるよ<br/>便利だね</div>
            </div>
        </div>
    </>
    )
}

export default App;

