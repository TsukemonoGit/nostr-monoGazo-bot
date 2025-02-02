/* @refresh reload */
import { render } from 'solid-js/web';

import './index.css';
import { A, Route, Router } from '@solidjs/router';
import { css } from '../styled-system/css';
import About from './About';
import Contact from './Contact';
import Home from './Home';


const root = document.getElementById('root');
const Layout = (props: any) => {
  const scrollToTop = () => {
    window.scrollTo(0, 0); // ページのトップにスクロール
  };

  return (
    <>
      <header >
        <A href="/" class={css({ width: 'full', textAlign: 'center' })} onClick={scrollToTop}>Home</A> {/* 👈 Add a link to the about page */}

        <A href="/about" class={css({ width: 'full', textAlign: 'center' })} onClick={scrollToTop}>About</A> {/* 👈 Add a link to the about page */}
        <A href="/contact" class={css({ width: 'full', textAlign: 'center' })} onClick={scrollToTop}>ほか</A> {/* 👈 Add a link to the contact page */}
      </header>
      {props.children}
      <footer>Footer</footer>
    </>
  );
};



if (import.meta.env.DEV && !(root instanceof HTMLElement)) {
  throw new Error(
    'Root element not found. Did you forget to add it to your index.html? Or maybe the id attribute got misspelled?',
  );
}

render(
  () => (
    <Router root={Layout} base="/nostr-monoGazo-bot" >
      <Route path="/" component={Home} />
      <Route path="/about" component={About} />
      <Route path="/contact" component={Contact} />
    </Router>
  ),
  root!
);
