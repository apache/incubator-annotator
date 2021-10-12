set -e

#VERSION=0.2.0
#RC=1

if [ -z "$VERSION" ] || [ -z "$RC" ]
then
  echo "First set the VERSION and RC environment variables."
  exit 1
fi

gpg --verify apache-annotator-*.tar.gz.asc

sleep 5

sha256sum --check apache-annotator-*.tar.gz.sha256
sha512sum --check apache-annotator-*.tar.gz.sha512

sleep 5

tar xzf apache-annotator-$VERSION-rc.$RC-incubating.tar.gz
cd apache-annotator-$VERSION-incubating

git remote show origin

sleep 5

git fetch --unshallow origin tag v$VERSION-rc.$RC

git describe

sleep 5

git status --ignored

sleep 5

# Expects Apache RAT 0.13 jar to be present in home directory
# wget https://dlcdn.apache.org/creadur/apache-rat-0.13/apache-rat-0.13-bin.zip
# unzip apache-rat-0.13-bin.zip
java -jar ~/apache-rat-0.13.jar -E .ratignore -d .

sleep 5

make
yarn build
make check

sleep 5

yarn clean
git status --ignored
