import { Component } from "solid-js"
import styles from './About.module.css';
import { style } from "solid-js/web";


const App: Component = () => {
    return (<>
    <div class={styles.background}/>
    <div class={styles.main}>
        ここにボットのコマンドの情報とかなんとかが書かれる予定
        
        </div>
    </>
    )
}

export default App;

