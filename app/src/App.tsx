import { css } from '../styled-system/css';
import type { Component } from 'solid-js';

import { A, Routes, Route } from "@solidjs/router"; // 👈 Import the A component
import Contact from './Contact';
import About from './About';
import Home from './Home';
import style from "./App.module.css"; // import文を変更




const App: Component = () => {


  const scrollToTop = () => {
    window.scrollTo(0, 0); // ページのトップにスクロール
  };
  
  return (
    <>
      <header class={style.header}>

        <A href="/nostr-monoGazo-bot/" class={css({width:'full',textAlign:'center'})}  onClick={scrollToTop}>Home</A> {/* 👈 Add a link to the about page */}

        <A href="/nostr-monoGazo-bot/about" class={css({width:'full',textAlign:'center'})} onClick={scrollToTop}>About</A> {/* 👈 Add a link to the about page */}
        <A href="/nostr-monoGazo-bot/contact" class={css({width:'full',textAlign:'center'})} onClick={scrollToTop}>Contact</A> {/* 👈 Add a link to the contact page */}
      </header>
      <Routes>
        <Route path="/nostr-monoGazo-bot/" component={Home} />
        <Route path="/nostr-monoGazo-bot/about" component={About} />
        <Route path="/nostr-monoGazo-bot/contact" component={Contact} />
      </Routes>
    </>
  );
};


export default App;