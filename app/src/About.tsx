import { Component } from "solid-js"
import styles from './About.module.css';
import { css } from "../styled-system/css";



const App: Component = () => {
    return (<>
        <div class={styles.background} />

        <h1 class={styles.title}>About</h1>
        <div >
            もの画像BOTのコマンドの情報とかなんとか
            <div class={styles.grid}>
                <div class={styles.gridItem}>反応ワード</div>
                <div class={styles.gridItem}>条件</div>
                <div class={styles.gridItem}>説明</div>

            <hr/><hr/><hr/>

                <div class={styles.gridItem}>もの画像<br/>mono画像</div>
                <div class={styles.gridItem}>完全一致</div>
                <div class={styles.gridItem}>もの画像リストの中から一枚リプライします</div>

            

                <div class={styles.gridItem}>あるふぉふぉ<br />あるんふぉふぉ</div>
                <div class={styles.gridItem}>が含まれる</div>
                <div class={styles.gridItem}>もの画像のアイコンが変わる<br />嬉しいので</div>

                

                <div class={styles.gridItem}>ないふぉふぉ<br />ないんふぉふぉ</div>
                <div class={styles.gridItem}>が含まれる</div>
                <div class={styles.gridItem}>あるふぉふぉがもらえる</div>

                <div class={styles.gridItem}>もの画像　[number]<br/>mono画像 [number]</div>
                <div class={styles.gridItem}>リプライ</div>
                <div class={styles.gridItem}>もの画像リストの[number]番の画像をリプライします（0始まり）</div>



            </div>
        </div>
    </>
    )
}

export default App;

