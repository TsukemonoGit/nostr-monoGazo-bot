#!/bin/bash
cd /home/mono/documents/nostr/nostr-monoGazo-bot
d=`date "+%F"` #全体をバッククォートで囲む
echo $d
git add .
git commit -m $d
git push origin test