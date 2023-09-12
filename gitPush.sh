#!/bin/bash

d=`date "+%F"` #全体をバッククォートで囲む
echo $d
git add .
git commit -m $d
git push origin main