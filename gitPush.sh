#!/bin/bash

d=`date "+%F"` #全体をバッククォートで囲む
echo $d
git config --global --add safr.directory /home/mono/documents/nostr/nostr-monoGazo-bot

git add .
git commit -m $d
git push origin main