set -e

if [ -z "$VERSION" ] || [ -z "$RC" ]
then
  echo "First set the VERSION and RC environment variables."
  exit 1
fi
if [ -z "$APACHE_USERNAME" ]
then
  echo "First set the APACHE_USERNAME environment variable."
  exit 1
fi

svn co https://dist.apache.org/repos/dist/dev/incubator/annotator/source dev
mkdir -p dev/$VERSION/rc.$RC
cp apache-annotator-$VERSION-rc.$RC-incubating.tar.gz* dev/$VERSION/rc.$RC
if [ $RC == "1" ]
then
  svn add dev/$VERSION
else
  svn add dev/$VERSION/rc.$RC
fi
svn propset svn:mime-type text/plain dev/$VERSION/rc.$RC/*.gz.asc dev/$VERSION/rc.$RC/*.gz.sha*
svn ci --username $APACHE_USERNAME -m "Add Annotator $VERSION rc.$RC to dev tree" dev
