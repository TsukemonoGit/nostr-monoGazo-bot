import { css } from '../styled-system/css';
import type { Component } from 'solid-js';


import Contact from './Contact';
import About from './About';
import Home from './Home';
import style from "./App.module.css"; // import文を変更
import { A, Router, Route, Routes } from "@solidjs/router"; // 👈 Import the A component



const App: Component = () => {


  const scrollToTop = () => {
    window.scrollTo(0, 0); // ページのトップにスクロール
  };

  return (
    <>
      <header class={style.header}>

        <A href="/" class={css({ width: 'full', textAlign: 'center' })} onClick={scrollToTop}>Home</A> {/* 👈 Add a link to the about page */}

        <A href="/about" class={css({ width: 'full', textAlign: 'center' })} onClick={scrollToTop}>About</A> {/* 👈 Add a link to the about page */}
        <A href="/contact" class={css({ width: 'full', textAlign: 'center' })} onClick={scrollToTop}>ほか</A> {/* 👈 Add a link to the contact page */}
      </header>
      <div >
        <Routes>
          <Route path="/" component={Home} />
          <Route path="/about" component={About} />
          <Route path="/contact" component={Contact} />
        </Routes>
      </div>
    </>
  );
};


export default App;

