const fs = require('fs');
const path = require('path');

const mobileDir = path.resolve(__dirname, '..');
const androidSettingsGradle = path.join(mobileDir, 'android', 'settings.gradle');
const androidAppBuildGradle = path.join(mobileDir, 'android', 'app', 'build.gradle');

// 1. Patch settings.gradle for monorepo resolution of @react-native/gradle-plugin
if (fs.existsSync(androidSettingsGradle)) {
  let content = fs.readFileSync(androidSettingsGradle, 'utf8');
  if (!content.includes("require.resolve('react-native/package.json')")) {
    content = content.replace(
      /require\.resolve\('@react-native\/gradle-plugin\/package\.json'\)/g,
      "require.resolve('@react-native/gradle-plugin/package.json', { paths: [require.resolve('react-native/package.json')] })"
    );
    fs.writeFileSync(androidSettingsGradle, content, 'utf8');
    console.log('✅ Successfully patched android/settings.gradle for monorepo');
  } else {
    // If line 7 specifically still has unpatched require.resolve('@react-native/gradle-plugin/package.json')
    const unpatchedLine = '"require.resolve(\'@react-native/gradle-plugin/package.json\')"';
    const patchedLine = '"require.resolve(\'@react-native/gradle-plugin/package.json\', { paths: [require.resolve(\'react-native/package.json\')] })"';
    if (content.includes(unpatchedLine)) {
      content = content.replace(unpatchedLine, patchedLine);
      fs.writeFileSync(androidSettingsGradle, content, 'utf8');
      console.log('✅ Successfully patched android/settings.gradle line 7 for monorepo');
    }
  }
}

// 2. Patch app/build.gradle to skip lint abort on release builds
if (fs.existsSync(androidAppBuildGradle)) {
  let content = fs.readFileSync(androidAppBuildGradle, 'utf8');
  if (!content.includes('checkReleaseBuilds false')) {
    content = content.replace(
      /android\s*\{/,
      `android {\n    lint {\n        abortOnError false\n        checkReleaseBuilds false\n    }`
    );
    fs.writeFileSync(androidAppBuildGradle, content, 'utf8');
    console.log('✅ Successfully patched android/app/build.gradle for no-lint release');
  }
}

console.log('🎉 Expo prebuild patches applied successfully.');
