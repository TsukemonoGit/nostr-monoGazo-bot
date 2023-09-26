import { Component } from "solid-js"
import styles from './MakeAddJson.module.css';
import { css } from "../styled-system/css";
import { writeClipboard } from "@solid-primitives/clipboard";
import toast, { Toaster } from 'solid-toast';

let url: HTMLInputElement;
let author: HTMLInputElement;
let date: HTMLInputElement;
let note: HTMLInputElement;
let memo: HTMLInputElement
const App: Component = () => {
    const formatDate = (): string => {
        const date = new Date;
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        return `${year}/${month}/${day}`
    }
    const onClickCopy = async (): Promise<void> => {

        const data = {
            url: url.value,
            author: author.value,
            date: date.value !== "" ? date.value : formatDate(),
            note: note.value,
            memo: memo.value
        }

        console.log(data.date);
        try {
            await writeClipboard(JSON.stringify(data));
            toast.success("copied")
        } catch (error) {
            toast.error("failed to copy")
        }
    }

    return (<>
        <div class={css({ wordBreak: 'break-all', whiteSpace: 'pre-wrap' })}>
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

        <Toaster />
    </>
    )
}

export default App;

