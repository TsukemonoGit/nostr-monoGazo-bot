import { css } from "../styled-system/css";
import { type Component } from "solid-js";

const App: Component = () => {
  return (
    <div class={styles.container}>
      <nostr-naddr
        sortOrder="reverse"
        naddr="naddr1qvzqqqr4xvpzpp9sc34tdxdvxh4jeg5xgu9ctcypmvsg0n00vwfjydkrjaqh0qh4qqyx6mmwdakk76nfhw6njd"
      ></nostr-naddr>
    </div>
  );
};

export default App;

const styles = {
  container: css({
    fontFamily: "Arial, sans-serif",
    padding: "42px 0px 24px 0px",
    maxWidth: "800px",
    margin: "0 auto",
  }),
};
