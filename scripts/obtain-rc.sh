set -e

if [ -z "$VERSION" ] || [ -z "$RC" ]
then
  echo "First set the VERSION and RC environment variables."
  exit 1
fi

curl -O https://dist.apache.org/repos/dist/dev/incubator/annotator/source/$VERSION/rc.$RC/apache-annotator-$VERSION-rc.$RC-incubating.tar.gz
curl -O https://dist.apache.org/repos/dist/dev/incubator/annotator/source/$VERSION/rc.$RC/apache-annotator-$VERSION-rc.$RC-incubating.tar.gz.asc
curl -O https://dist.apache.org/repos/dist/dev/incubator/annotator/source/$VERSION/rc.$RC/apache-annotator-$VERSION-rc.$RC-incubating.tar.gz.sha256
curl -O https://dist.apache.org/repos/dist/dev/incubator/annotator/source/$VERSION/rc.$RC/apache-annotator-$VERSION-rc.$RC-incubating.tar.gz.sha512
