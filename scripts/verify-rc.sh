set -e

if [ -z "$VERSION" ] || [ -z "$RC" ]
then
  echo "First set the VERSION and RC environment variables."
  exit 1
fi

gpg --verify apache-annotator-*.tar.gz.asc

sha256sum --check apache-annotator-*.tar.gz.sha256
sha512sum --check apache-annotator-*.tar.gz.sha512

tar xzf apache-annotator-$VERSION-rc.$RC-incubating.tar.gz
cd apache-annotator-$VERSION-incubating

git remote show origin

git fetch --unshallow origin tag v$VERSION-rc.$RC

git describe

git status --ignored

# We need Apache RAT.
RAT_VERSION="0.13"
RAT_JAR_FOLDER="$HOME/.apache-rat-used-for-verifying-annotator"
RAT_JAR_FILE_PATH="$RAT_JAR_FOLDER/apache-rat-${RAT_VERSION}/apache-rat-${RAT_VERSION}.jar"
if [ ! -f "$RAT_JAR_FILE_PATH" ]
then
  read -p "Did not find Apache RAT at $RAT_JAR_FILE_PATH. Download it? [y/N] " response
  if [[ $response =~ (Y|y|YES|Yes|yes) ]]
  then
    wget -c -P "$RAT_JAR_FOLDER" "https://dlcdn.apache.org/creadur/apache-rat-${RAT_VERSION}/apache-rat-${RAT_VERSION}-bin.zip"
    unzip -d "$RAT_JAR_FOLDER" "$RAT_JAR_FOLDER/apache-rat-${RAT_VERSION}-bin.zip"
  else
    exit 0
  fi
fi
java -jar "$RAT_JAR_FILE_PATH" -E .ratignore -d .

make
yarn build
make check

yarn clean
git status --ignored
