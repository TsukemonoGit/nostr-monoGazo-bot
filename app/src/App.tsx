import { css } from '../styled-system/css';
import type { Component } from 'solid-js';
//import jsonData from "./assets/data/imageList.json"; // JSONファイルのパスを正しく指定
import { createSignal, onMount } from "solid-js";


const App: Component = () => {
  const [jsonData, setJsonData] = createSignal(null);

  // JSONデータを取得する関数
  async function fetchJsonData() {
    try {
      const response = await fetch("https://github.com/TsukemonoGit/nostr-monoGazo-bot/raw/main/imageList.json");
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const data = await response.json();
      setJsonData(data);
    } catch (error) {
      console.error("Error fetching JSON data:", error);
    }
  }

  // コンポーネントがマウントされたらJSONデータを取得
  onMount(fetchJsonData);




  return (
    <div>
      <div class={css({ fontSize: "2xl", fontWeight: 'bold' })}>monoGazo List</div>
      {jsonData() && jsonData().length > 0 ? (
        <ul>
          {jsonData().map((item, index) => (

            <li ><div className={css({ display: 'flex', height: 36 })} >{index}
              <img src={item.url} alt={`Image ${index}`} />: {item.date}</div></li>
          ))}
        </ul>
      ) : (
        <p>No data available.</p>
      )}
    </div>
  );
};

export default App;
