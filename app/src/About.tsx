import { Component } from "solid-js"
import styles from './About.module.css';



const App: Component = () => {
    return (<>
    <div class={styles.background}/>
   
    <h1 class={styles.title}>About</h1>
    <div>
        ここにボットのコマンドの情報とかなんとかが書かれる予定
        
        </div>
    </>
    )
}

export default App;

