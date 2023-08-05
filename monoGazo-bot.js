import 'websocket-polyfill'
import { createRxNostr, createRxForwardReq, verify, uniq, now } from "rx-nostr";
import env from "dotenv";
env.config();
import { urlList } from './imageList.js';



const nsec = process.env.NSEC;
const npub = process.env.PUBHEX;
const rxNostr = createRxNostr();
await rxNostr.switchRelays(["wss://yabu.me"]);

const rxReq = createRxForwardReq();

// Create observable
const observable = rxNostr.use(rxReq)
  .pipe(
    // Verify event hash and signature
    verify(),
    // Uniq by event hash
    uniq(),

  );

//rxNostr.send({kind:1,content:"test",pubkey:npub},nsec);

// Start subscription
const subscription = observable.subscribe((packet) => {
  // Your minimal application!
  console.log(packet);
  const content = packet.event.content.trim();
  if (content === "もの画像" || content === "mono画像") {
    const urlIndex = Math.floor(Math.random() * urlList.length);
    console.log("ものがぞうりくえすときました:" + urlIndex);
    const tags = [
      ["p", packet.event.pubkey],
      ["e", packet.event.id],
      ["r", urlList[urlIndex].url],
      ["t", "もの画像"]];

    const root = packet.event.tags.find((item) => item[item.length - 1] === "root");

    // rootが見つかった場合、tagsにrootを追加
    if (root) {
      tags.push(root);
    }
    console.log(packet.event.created_at + 1);

    const res = rxNostr.send({
      kind: packet.event.kind,
      content: `#もの画像\n${urlList[urlIndex].url}\n作: nostr:${urlList[urlIndex].author} ${urlList[urlIndex].memo ? " (" + urlList[urlIndex].memo + ")" : ""}`,
      tags: tags,
      pubkey: npub,
    }, {
      created_at: packet.event.created_at + 1,
      seckey: nsec
    }).subscribe({
      next: ({ from }) => {
        console.log("OK", from);
      },
      complete: () => {
        console.log("Send complete");
      }
    });
  }
});

// Send REQ message to listen kind1 events
rxReq.emit({ kinds: [1, 42], since: now });
