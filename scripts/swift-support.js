#!/usr/bin/env node

// This hook is derived from iosrtc-swift-support.js in cordova-plugin-iosrtc
//
// Usage in cordova project config.xml:
// <platform name="ios">
//    <hook type="after_platform_add" src="plugins/cordova-plugin-qrscanner/scripts/swift-support.js" />
// </platform>

const fs = require('fs');
const path = require('path');
const xcode = require('xcode');

const BUILD_VERSION = '7.0';
const SWIFT_VERSION_XCODE = '2.3';
const BUILD_VERSION_XCODE = `"${BUILD_VERSION}"`;
const RUNPATH_SEARCH_PATHS = '@executable_path/Frameworks';
const RUNPATH_SEARCH_PATHS_XCODE = `"${RUNPATH_SEARCH_PATHS}"`;
const ENABLE_BITCODE = 'NO';
const ENABLE_BITCODE_XCODE = `"${ENABLE_BITCODE}"`;
const BRIDGING_HEADER_END = '/Plugins/cordova-plugin-qrscanner/QRScanner-Bridging-Header.h';
const COMMENT_KEY = /_comment$/;

// Helpers

// Returns the project name
function getProjectName(protoPath) {
  const cordovaConfigPath = path.join(protoPath, 'config.xml');
  const content = fs.readFileSync(cordovaConfigPath, 'utf-8');

  return /<name>([\s\S]*)<\/name>/mi.exec(content)[1].trim();
}

// Drops the comments
function nonComments(obj) {
  const keys = Object.keys(obj);
  const newObj = {};
  let i = 0;

  for (i; i < keys.length; i += 1) {
    if (!COMMENT_KEY.test(keys[i])) {
      newObj[keys[i]] = obj[keys[i]];
    }
  }

  return newObj;
}

function debug(msg) {
  console.log(`swift-support.js [INFO] ${msg}`);
}

function debugerror(msg) {
  console.error(`swift-support.js [ERROR] ${msg}`);
}

// Starting here

module.exports = function(context) {
  const projectRoot = context.opts.projectRoot;
  const projectName = getProjectName(projectRoot);
  const xcconfigPath = path.join(projectRoot, '/platforms/ios/cordova/build.xcconfig');
  const xcodeProjectName = `${projectName}.xcodeproj`;
  const xcodeProjectPath = path.join(projectRoot, 'platforms', 'ios', xcodeProjectName, 'project.pbxproj');
  const swiftBridgingHead = projectName + BRIDGING_HEADER_END;
  const swiftBridgingHeadXcode = `"${swiftBridgingHead}"`;
  const swiftOptions = ['']; // <-- begin to file appending AFTER initial newline
  // let xcodeProject;

  debug('Enabling Swift for cordova-plugin-qrscanner.');

  // Checking if the project files are in the right place
  if (!fs.existsSync(xcodeProjectPath)) {
    debugerror(`an error occurred searching the project file at: "${xcodeProjectPath}"`);

    return;
  }

  debug(`".pbxproj" project file found: ${xcodeProjectPath}`);

  if (!fs.existsSync(xcconfigPath)) {
    debugerror(`an error occurred searching the project file at: "${xcconfigPath}"`);

    return;
  }
  debug(`".xcconfig" project file found: ${xcconfigPath}`);

  const xcodeProject = xcode.project(xcodeProjectPath);

  // Showing info about the tasks to do
  debug('fixing issues in the generated project files:');
  debug(`- "iOS Deployment Target" and "Deployment Target" to: ${BUILD_VERSION_XCODE}`);
  debug(`- "Runpath Search Paths" to: ${RUNPATH_SEARCH_PATHS_XCODE}`);
  debug(`- "Objective-C Bridging Header" to: ${swiftBridgingHeadXcode}`);
  debug(`- "ENABLE_BITCODE" set to: ${ENABLE_BITCODE_XCODE}`);

  // Massaging the files

  // "build.xcconfig"
  swiftOptions.push(`LD_RUNPATH_SEARCH_PATHS = ${RUNPATH_SEARCH_PATHS}`);
  swiftOptions.push(`SWIFT_OBJC_BRIDGING_HEADER = ${swiftBridgingHead}`);
  swiftOptions.push(`IPHONEOS_DEPLOYMENT_TARGET = ${BUILD_VERSION}`);
  swiftOptions.push(`ENABLE_BITCODE = ${ENABLE_BITCODE}`);
  // NOTE: Not needed
  // swiftOptions.push('EMBEDDED_CONTENT_CONTAINS_SWIFT = YES');
  fs.appendFileSync(xcconfigPath, swiftOptions.join('\n'));
  debug(`file correctly fixed: ${xcconfigPath}`);

  // "project.pbxproj"
  // Parsing it
  xcodeProject.parse(error => {
    // let configurations;
    let buildSettings;

    if (error) {
      debugerror('an error occurred during the parsing of the project file');

      return;
    }


    const configurations = nonComments(xcodeProject.pbxXCBuildConfigurationSection());
    // Adding or changing the parameters we need
    Object.keys(configurations).forEach(config => {
      buildSettings = configurations[config].buildSettings;
      buildSettings.LD_RUNPATH_SEARCH_PATHS = RUNPATH_SEARCH_PATHS_XCODE;
      buildSettings.SWIFT_OBJC_BRIDGING_HEADER = swiftBridgingHeadXcode;
      buildSettings.IPHONEOS_DEPLOYMENT_TARGET = BUILD_VERSION_XCODE;
      buildSettings.ENABLE_BITCODE = ENABLE_BITCODE_XCODE;
      buildSettings.SWIFT_VERSION = SWIFT_VERSION_XCODE;
    });

    // Writing the file again
    fs.writeFileSync(xcodeProjectPath, xcodeProject.writeSync(), 'utf-8');
    debug(`file correctly fixed: ${xcodeProjectPath}`);
  });
};
