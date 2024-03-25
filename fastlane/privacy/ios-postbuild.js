// load xcode package
const xcode = require('xcode');
const fs = require('fs');

// get the project file
const projectPath = 'ios/ReveilleRides.xcodeproj/project.pbxproj';
const project = xcode.project(projectPath);

// parse the project file
project.parse(function (error) {
    if (error) {
        console.log('Error parsing the project file');
    }

    // find the key of the group named 'ReveilleRides'
    const mainGroup = project.findPBXGroupKey({name: 'ReveilleRides'});

    // copy the file PrivacyInfo.xcprivacy to the group
    fs.copyFileSync('fastlane/privacy/PrivacyInfo.xcprivacy', 'ios/ReveilleRides/PrivacyInfo.xcprivacy');

    // add the file PrivacyInfo.xcprivacy to the project (it is a .plist file)
    project.addFile('ReveilleRides/PrivacyInfo.xcprivacy', mainGroup);

    console.log('Added PrivacyInfo.xcprivacy to the project!');

    // save the project file
    fs.writeFileSync(projectPath, project.writeSync());
});


