/* @refresh reload */
import { render } from 'solid-js/web';

import './index.css';
import App from './App';
import About from './About'
import Contact from './Contact';
import { Router, Route, Routes } from "@solidjs/router";
import styles from "./App.module.css";
const root = document.getElementById('root');

if (import.meta.env.DEV && !(root instanceof HTMLElement)) {
  throw new Error(
    'Root element not found. Did you forget to add it to your index.html? Or maybe the id attribute got misspelled?',
  );
}

render(
  () => (
    <Router>
      <App />
    </Router>
  ),
  root!
);
