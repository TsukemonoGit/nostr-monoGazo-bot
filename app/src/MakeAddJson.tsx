import { Component, createSignal } from "solid-js";
import styles from './MakeAddJson.module.css';
import { css } from "../styled-system/css";
import { writeClipboard } from "@solid-primitives/clipboard";
import toast, { Toaster } from 'solid-toast';

const App: Component = () => {
    const formatDate = (): string => {
        const date = new Date();
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        return `${year}/${month}/${day}`;
    };

    // createSignal を使用して各入力値を管理
    const [url, setUrl] = createSignal("");
    const [author, setAuthor] = createSignal("");
    const [date, setDate] = createSignal("");
    const [note, setNote] = createSignal("");
    const [memo, setMemo] = createSignal("");

    const onClickCopy = async (): Promise<void> => {
        const data = memo() !== "" ? {
            url: url(),
            author: author(),
            date: date() !== "" ? date() : formatDate(),
            note: note(),
            memo: memo()
        } : {
            url: url(),
            author: author(),
            date: date() !== "" ? date() : formatDate(),
            note: note()
        };

        console.log(data.date);
        try {
            await writeClipboard(JSON.stringify(data));
            toast.success("copied");
        } catch (error) {
            toast.error("failed to copy");
        }
    };

    const onClickReset = (): void => {
        setUrl("");
        setAuthor("");
        setDate("");
        setNote("");
        setMemo("");
    };

    return (
        <>
            <div class={css({ wordBreak: 'break-all', whiteSpace: 'pre-wrap' })}>
                <ul>
                    <li>
                        image url: <input type="text" class={styles.input} value={url()} onInput={(e) => setUrl(e.currentTarget.value)} />
                    </li>
                    <li>
                        author: <input type="text" class={styles.input} value={author()} onInput={(e) => setAuthor(e.currentTarget.value)} />
                    </li>
                    <li>
                        date (デフォルト: {formatDate()}): <input type="text" class={styles.input} value={date()} onInput={(e) => setDate(e.currentTarget.value)} />
                    </li>
                    <li>
                        noteID: <input type="text" class={styles.input} value={note()} onInput={(e) => setNote(e.currentTarget.value)} />
                    </li>
                    <li>
                        memo: <input type="text" class={styles.input} value={memo()} onInput={(e) => setMemo(e.currentTarget.value)} />
                    </li>
                </ul>
                <button type="button" class={`${styles.button} ${styles.btn1}`} onClick={onClickCopy}>Copy</button>
                <button type="button" class={`${styles.button} ${styles.btn2}`} onClick={onClickReset}>Reset</button>
            </div>

            <Toaster />
        </>
    );
};

export default App;
