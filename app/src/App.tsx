import { css } from '../styled-system/css';
import type { Component } from 'solid-js';
import jsonData from "./assets/data/imageList.json"; // JSONファイルのパスを正しく指定

const App: Component = () => {
  console.log(jsonData);


  return (
    <div>
       <div class={css({ fontSize: "2xl", fontWeight: 'bold' })}>monoGazo List</div>
      {jsonData && jsonData.length > 0 ? (
        <ul>
          {jsonData.map((item, index) => (
            
            <li ><div className={css({ display: 'flex' , height:36})} >{index} 
            <img src={item.url}></img>: {item.date}</div></li>
          ))}
        </ul>
      ) : (
        <p>No data available.</p>
      )}
    </div>
  );
};

export default App;
