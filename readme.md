めも
うまく行かなかったからactionsでやろうとしたけど
なんだかんだもとの方法でやったからアクション図のフォルダ諸々不要

と思いきや
imageList.jsonのなかみを表示させたいけど

ボットとSolidJS間のデータの受け渡しが無理無理の無理だったので
（imageList.jsonを変更したときに、App内のimageList.jsonに干渉できなかった、
App外部のデータを取り込めなかった）

push したときにGithub上でjsonを更新してからgithub pagesをデプロイする感じにした

その関係でボットはコミットプッシュする前にぷるする

と思いきや（？）

github上のapp/src/assets/data/imageList.jsonが更新されてるかと思いきや
更新されてない。pagesの方はデータ更新されてるのに

とりあえずおもてのimageList.jsonは更新されるしpagesも更新されるからとりあえず良しとする？

なんもわからん

pushできるようになりました

```
permissions:
  contents: write
```
にしないとpushできないよ

ということでちゃんとgithub上のapp/src/assets/data/imageList.jsonが更新されました

jekyllは無限に
```
 Conversion error: Jekyll::Converters::Scss encountered an error while converting 'assets/css/style.scss':
                    No such file or directory @ dir_chdir - /github/workspace/docs
```
ってなってる

なんももわからん

本体起動時に起動
crontab -e
@reboot sudo supervisorctl start monoGazo

