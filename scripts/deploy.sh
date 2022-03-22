#!/bin/bash

cd build
tar -zcvf ../build.tar.gz .
cd -
echo "Packaging finished..."
scp build.tar.gz ubuntu@54.70.209.151:/home/bitnami/tmp
echo "Package uploaded."
ssh ubuntu@54.70.209.151 "rm -rf /home/bitnami/apps/wordpress/htdocs/covid19-US-Counties/* && tar -xvf /home/bitnami/tmp/build.tar.gz -C /home/bitnami/apps/wordpress/htdocs/covid19-US-Counties"
node ./scripts/slack.js
echo "Done!"