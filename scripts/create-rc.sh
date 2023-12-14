set -e

if [ -z "$VERSION" ] || [ -z "$RC" ]
then
  echo "First set the VERSION and RC environment variables."
  exit 1
fi

git tag -s "v$VERSION-rc.$RC" -m "v$VERSION-rc.$RC"
git push origin tag "v$VERSION-rc.$RC"
make distsign
