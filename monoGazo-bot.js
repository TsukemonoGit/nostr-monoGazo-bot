import 'websocket-polyfill'
import { createRxNostr, createRxForwardReq, verify, uniq , now } from "rx-nostr";
import env from "dotenv";
env.config();
import { urlList } from './imageList.js';



const nsec=process.env.NSEC;
const npub=process.env.PUBHEX;
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
  if(packet.event.content==="もの画像"||packet.event.content==="mono画像"){
    const urlIndex = Math.floor(Math.random()*urlList.length);
    console.log("ものがぞうりくえすときました:"+urlIndex);

    const res=rxNostr.send({
      kind:1,
      content:`#もの画像\n${urlList[urlIndex].url}\n作：nostr:${urlList[urlIndex].author} ${urlList[urlIndex].memo?" ("+urlList[urlIndex].memo+")":""}`,
      tags:[
      ["p",packet.event.pubkey],
      ["e",packet.event.id],
      ["r",urlList[urlIndex].url],
      ["t","もの画像"]
      ],
      pubkey:npub,
    },{seckey:nsec}).subscribe({
      next:({from}) =>{
        console.log("OK",from);
      },
      complete: ()=>{
        console.log("Send complete");
      }
  });
}
});

// Send REQ message to listen kind1 events
rxReq.emit({ kinds: [1] ,since:now });
