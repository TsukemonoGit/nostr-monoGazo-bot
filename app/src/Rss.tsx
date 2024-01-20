import { css } from '../styled-system/css';
import { createSignal, onCleanup, type Component, onMount } from 'solid-js';
import jsonData from "./assets/data/imageList.json";

interface Entry {
  id: string;
  link: string;
  content: string;
  updated: string;
}
const Rss: Component = () => {
  const [rssData, setRssData] = createSignal<Entry[]>([]); // 初期値を空の配列に変更


  // RSSデータを取得する関数
  async function fetchRssData(url: string) {
    const response = await fetch(url);
    const xmlText = await response.text();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, "application/xml");

    // XMLデータをJavaScriptオブジェクトに変換
    const entries: Entry[] = Array.from(xmlDoc.querySelectorAll("entry")).map((entry) => {
      return {
        id: entry?.querySelector("id")?.textContent ?? "",
        link: entry?.querySelector("link[rel='alternate']")?.getAttribute("href") ?? "",
        content: entry?.querySelector("content")?.textContent ?? "",
        updated: entry?.querySelector("updated")?.textContent ?? "",
      };
    });

    setRssData(entries);
    console.log(entries);
  }

  // コンポーネントがマウントされたときにRSSデータを取得
  onMount(() => {
    fetchRssData("https://njump.me/npub1lxrlhyrfdl9sjdvx9xhwhag4d6s95sz3q8z09kgzp0cz73l2ffys9p726u.rss");
  });

  return (
    <div class={styles.rss}>
      <h2 class={styles.rssTitle}>Nostr もの画像 Posts</h2>
      <div class={styles.rssContainer}>

        {rssData().map((entry, index) => (
          <div class={styles.rssEntry}>


            <a href={entry.link} target="_blank" rel="noopener noreferrer">
              もの画像 <p> {entry.updated}</p>
              <div innerHTML={entry.content} />


            </a>
          </div>
        ))}
      </div></div>
  );
};


export default Rss;


const styles = {
  rssTitle: css({
    margin: '5px 10px 0 10px',
    fontWeight: 'bolder'
  }),
  rss: css({
    backgroundColor: 'amber.300',
    //width: '100%', // デフォルトは100%、画面の横幅いっぱいに表示
    order: 2, // デフォルトは2、画面が広いときは右側に表示
    // marginBottom: '20px', // マージンを設定してください
    '@media (min-width: 800px)': {
      position: 'fixed',
      top: '4em',
      bottom: '2em',
      right: '5px',
      width: "15em",
    },
    '@media (min-width: 1500px)': {
      position: 'fixed',
      top: '4em',
      bottom: '2em',
      right: '15px',
      width: "15em",

    },
    margin: '5px',
    //padding: '5px',
    border: '1px solid #ddd',
    borderRadius: '5px',
    display: 'grid',
    //maxHeight: "screen",
    maxWidth: "screen",
    // maxHeight: "40em",

  }),
  rssContainer: css({
    //backgroundColor: 'rgba(255, 255, 255, 0.8)',
    //maxWidth: "20em",
    maxHeight: "screen",
    overflowY: 'auto',
  }),
  rssEntry: css({
    backgroundColor: 'white',
    margin: ' 10px',
    padding: '5px',
    border: '1px solid #ddd',
    borderRadius: '5px',
    marginBottom: '10px',
    '& img': {
      maxWidth: '12em',
    },
  }),
};
