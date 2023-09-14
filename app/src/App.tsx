import { css } from '../styled-system/css';
import type { Component } from 'solid-js';
import jsonData from "./assets/data/imageList.json";
import { displayPartsToString } from 'typescript';




const App: Component = () => {
  return (
    <div class={styles.container}>
      <h1 class={styles.title}>monoGazo List</h1>
      {jsonData && jsonData.length > 0 ? (
        <div class={styles.imageList}>
          {jsonData.map((item, index) => (
            <div class={styles.imageItem}>
              <img src={item.url} alt={`Image ${index}`} />
              <div class={styles.imageInfo}>
                <p>
                  No.{index} {item.date}<a target="_blank"
                    rel="noopener noreferrer" href={`https://nostter.vercel.app/${item.note}`}>
                    <svg class={styles.linkIcon} xmlns="http://www.w3.org/2000/svg" height="16" viewBox="0 -960 960 960" width="16">
                      <path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h280v80H200v560h560v-280h80v280q0 33-23.5 56.5T760-120H200Zm188-212-56-56 372-372H560v-80h280v280h-80v-144L388-332Z" fill="#0000FF" />
                    </svg></a>
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p class={styles.noData}>No data available.</p>
      )
      }
    </div >
  );
};




const styles = {

  linkIcon: css({
    display: 'inline-block',
    marginRight: '4px', // アイコンとテキストの間隔を調整
    verticalAlign: 'top', // アイコンをテキストと中央揃え
  }),
  container: css({
    fontFamily: 'Arial, sans-serif',
    padding: '20px',
    maxWidth: '800px',
    margin: '0 auto',
  }),
  title: css({
    fontSize: '2rem',
    fontWeight: 'bold',
    marginBottom: '20px',
  }),
  imageList: css({
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '20px',
  }),
  imageItem: css({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '5px',
  }),
  imageInfo: css({
    marginTop: '10px',
  }),
  noData: css({
    fontSize: '1.2rem',
    color: 'gray',
    textAlign: 'center',
    marginTop: '20px',
  }),
};

export default App;