import { Component } from "solid-js"
import styles from './About.module.css';
import { css } from "../styled-system/css";
import { writeClipboard } from "@solid-primitives/clipboard";
import toast, { Toaster } from 'solid-toast';

let url: HTMLInputElement;
let author: HTMLInputElement;
let date: HTMLInputElement;
let note: HTMLInputElement;
let memo: HTMLInputElement

const App: Component = () => {

    // const [url, setURL] = createSignal("");
    // const [author, setAuthor] = createSignal("");
    // const [date, setDate] = createSignal("");
    // const [note, setNote] = createSignal("");
    // const [memo, setMemo] = createSignal("");

    // const handleChange = (event: Event): void => {

    // }
    const formatDate=():string=>{
        const date=new Date;
        const year=date.getFullYear();
        const month=date.getMonth()+1;
        const day=date.getDate();
        return `${year}/${month}/${day}`
    }
    const onClickCopy = async (): Promise<void> => {

const data={
    url:url.value,
    author:author.value,
    date:date.value!==""?date.value: formatDate(),
    note:note.value,
    memo:memo.value
}

        console.log(data.date);
        try{
        await writeClipboard(JSON.stringify(data));
        toast.success("copied")
        }catch(error){
            toast.error("failed to copy")
        }
    }
    return (<>
        <div class={styles.background} />

        <h1 class={styles.title}>About</h1>
        <div >
            <p class={css({ backgroundColor: 'rgba(255, 255, 255, 0.5)' })}>もの画像BOTのコマンドの情報とかなんとか</p>
            <p class={css({ backgroundColor: 'rgba(255, 255, 255, 0.5)' })}>もの画像BOTが起動したときに₍ ･ᴗ･ ₎がでます</p>

            <div class={styles.grid}>
                <div class={styles.gridItem}>反応ワード</div>
                <div class={styles.gridItem}>条件</div>
                <div class={styles.gridItem}>説明</div>

                <hr /><hr /><hr />

                <div class={styles.gridItem}>もの画像
                    <hr class={styles.hr} />
                    mono画像</div>
                <div class={styles.gridItem}>完全一致</div>
                <div class={styles.gridItem}>もの画像リストの中から一枚リプライします</div>



                <div class={styles.gridItem}>あるふぉふぉ
                    <hr class={styles.hr} />
                    あるんふぉふぉ</div>
                <div class={styles.gridItem}>が含まれる</div>
                <div class={styles.gridItem}>もの画像のアイコンが変わる<br />嬉しいので</div>



                <div class={styles.gridItem}>ないふぉふぉ
                    <hr class={styles.hr} />
                    ないんふぉふぉ</div>
                <div class={styles.gridItem}>が含まれる</div>
                <div class={styles.gridItem}>あるふぉふぉがもらえる</div>

                <div class={styles.gridItem}>もの画像　[number]
                    <hr class={styles.hr} />
                    mono画像 [number]</div>
                <div class={styles.gridItem}>リプライ</div>
                <div class={styles.gridItem}>もの画像リストの[number]番の画像をリプライします（0始まり）</div>

                <div class={styles.gridItem}>[nostr:npub~] に<br />ある(ん)ふぉふぉ(を)送って</div>
                <div class={styles.gridItem}>リプライ</div>
                <div class={styles.gridItem}>[nostr:npub~]さんにあるふぉふぉをおくります</div>

                <div class={styles.gridItem}>もの画像 長さ
                    <hr class={styles.hr} />
                    mono画像 枚数</div>
                <div class={styles.gridItem}>リプライ</div>
                <div class={styles.gridItem}>現在のもの画像の総数をリプライします</div>

                <div class={styles.gridItem}>和暦</div>
                <div class={styles.gridItem}>リプライ</div>
                <div class={styles.gridItem}>和暦で今日の日付を教えてくれるよ<br />便利だね</div>
            </div>
            <div class={css({ wordBreak: 'break-all', whiteSpace: 'pre-wrap' })}>

//管理者用テンプレ
                <ul>
                    <li>
                        image url: <input type="text" class={styles.input} ref={url} />
                    </li>
                    <li>
                        author: <input type="text" class={styles.input} ref={author} /></li>
                    <li>
                        date (デフォルト: {formatDate()}): <input type="text" class={styles.input} ref={date} /> </li>
                    <li>
                        noteID: <input type="text" class={styles.input} ref={note} /> </li>
                    <li>
                        memo: <input type="text" class={styles.input} ref={memo} /> </li>
                </ul>
                <button type="button" class={styles.button} onClick={onClickCopy}>Copy</button>
            </div>
        </div>
        <Toaster/>
    </>
    )
}

export default App;

