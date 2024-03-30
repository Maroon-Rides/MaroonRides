// load xcode package
const xcode = require('xcode');
const fs = require('fs');

// get the project file
const projectPath = 'ios/MaroonRides.xcodeproj/project.pbxproj';
const project = xcode.project(projectPath);

// parse the project file
project.parse(function (error) {
    if (error) {
        console.log('Error parsing the project file');
    }

    // find the key of the group named 'MaroonRides'
    const mainGroup = project.findPBXGroupKey({name: 'MaroonRides'});

    // copy the file PrivacyInfo.xcprivacy to the group
    fs.copyFileSync('fastlane/privacy/PrivacyInfo.xcprivacy', 'ios/MaroonRides/PrivacyInfo.xcprivacy');

    // add the file PrivacyInfo.xcprivacy to the project (it is a .plist file)
    project.addFile('MaroonRides/PrivacyInfo.xcprivacy', mainGroup);

    console.log('Added PrivacyInfo.xcprivacy to the project!');

    // save the project file
    fs.writeFileSync(projectPath, project.writeSync());
});


