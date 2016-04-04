# this script creates a test cordovaTests directory as a sibling of the
# cordova-plugin-qrscanner directory

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )";

mkdir $DIR/../../cordovaPluginTests
cd $DIR/../../cordovaPluginTests
rm -r QRScannerTests/
cordova create QRScannerTests
cd QRScannerTests/
TESTS_DIR=`pwd`
cordova plugin add ../../cordova-plugin-qrscanner
cordova plugin add ../../cordova-plugin-qrscanner/tests
cordova plugin add cordova-plugin-test-framework

# timestamp the bundle ID so permissions are reset each build
TIMESTAMP="`date +%s`"; sed "s/io\.cordova\.hellocordova/test\.qrscanner\.$TIMESTAMP/" config.xml > config.xml.tmp
sed 's/index\.html/cdvtests\/index\.html/' config.xml.tmp > config.xml.tmp2
sed 's/<platform name="ios">/<platform name="ios"><hook type="after_platform_add" src="plugins\/cordova-plugin-qrscanner\/scripts\/swift-support\.js" \/>/' config.xml.tmp2 > config.xml
rm config.xml.tmp config.xml.tmp2

npm install xcode

cordova platform add ios
cordova build ios

echo ''
echo ''
echo '-------------'
echo ''
echo 'The cordovaPluginTests directory is a sibling of cordova-plugin-qrscanner.'
echo '$ cd '$TESTS_DIR
echo ''
echo 'Run tests on connected device: $ cordova run ios --device'
echo 'Run tests on ios simulator: $ cordova emulate ios'
echo 'Open test project in xcode: $ open ../cordovaPluginTests/QRScannerTests/platforms/ios/HelloCordova.xcodeproj/'
echo ''
echo ''

# cordova run ios --device
# cordova emulate ios
open $TESTS_DIR/platforms/ios/HelloCordova.xcodeproj/
