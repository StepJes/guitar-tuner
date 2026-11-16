# Release Build and Signing

This document describes how to build, sign, verify, and install the standalone PitchLab Lite Android app. The release APK embeds the JavaScript bundle and does not need Metro.

## 1. Prerequisites

- Node.js 20+
- JDK 21. On this machine: `C:\Program Files\Android\Android Studio\jbr`
- Android SDK with:
  - Platform 36
  - Build Tools 36.0.0
  - NDK 27.1.12297006
- `ANDROID_HOME` or `ANDROID_SDK_ROOT` set to the SDK directory
- Network access for the first Gradle dependency download

Verify the toolchain:

```powershell
node --version
$env:JAVA_HOME = 'C:\Program Files\Android\Android Studio\jbr'
& "$env:JAVA_HOME\bin\java.exe" -version
adb version
```

## 2. Signing configuration

The Gradle build reads signing values from `android/keystore.properties`. This file and all `*.keystore` files are ignored by Git.

```properties
storeFile=app/pitchlab-release.keystore
storePassword=CHANGE_ME
keyAlias=pitchlab
keyPassword=CHANGE_ME
```

A local development release key was generated for this workspace:

- Keystore: `android/app/pitchlab-release.keystore`
- Alias: `pitchlab`
- Passwords: configured in `android/keystore.properties`

**Replace this key for production.** Keep the real keystore and passwords outside the repository, back them up securely, and never commit them. Losing an application signing key prevents updates to an app already published under that identity.

To create a new key:

```powershell
& "$env:JAVA_HOME\bin\keytool.exe" -genkeypair -v `
  -storetype PKCS12 `
  -keystore android\app\pitchlab-release.keystore `
  -alias pitchlab `
  -keyalg RSA -keysize 2048 -validity 10000 `
  -dname "CN=PitchLab, OU=Mobile, O=PitchLab, L=City, ST=State, C=US"
```

Then update `android/keystore.properties` with the new passwords. If the properties file is absent, Gradle falls back to the debug key; do not publish an APK built that way.

## 3. Build the signed release APK

```powershell
$env:JAVA_HOME = 'C:\Program Files\Android\Android Studio\jbr'
cd android
.\gradlew.bat clean assembleRelease --console=plain
```

Output:

```text
android/app/build/outputs/apk/release/app-release.apk
```

Confirm the signer:

```powershell
& "$env:ANDROID_HOME\build-tools\36.0.0\apksigner.bat" verify `
  --print-certs `
  app\build\outputs\apk\release\app-release.apk
```

The certificate DN should contain `CN=PitchLab` for the local development key.

## 4. Build an Android App Bundle for Play

```powershell
.\gradlew.bat bundleRelease --console=plain
```

Output:

```text
android/app/build/outputs/bundle/release/app-release.aab
```

The AAB is signed with the same release configuration.

## 5. Install and smoke-test

```powershell
adb install -r app\build\outputs\apk\release\app-release.apk
adb shell am start -n com.pitchlab.tuner/com.pitchlabapp.MainActivity
```

The release build must launch without Metro. Grant microphone permission when prompted and verify that a real reading appears when sound is present. The emulator can verify installation, permissions, lifecycle and UI state, but real acoustic accuracy must be checked on a physical device. See [TESTING.md](TESTING.md) for the full smoke checklist.

## 6. Versioning

Update both values in `android/app/build.gradle` for each release:

```gradle
versionCode 22
versionName "1.0.22"
```

`versionCode` must increase for every Play upload. The Android application ID is `com.pitchlab.tuner`; the Kotlin namespace is `com.pitchlabapp`.

## 7. Architecture and size

The release APK contains React Native native libraries for all configured ABIs. For smaller store downloads, use an AAB (recommended) or add ABI splits. Do not strip the React Native or app native libraries.

## 8. Troubleshooting

- **`JAVA_HOME is not set` / wrong Java version**: point `JAVA_HOME` at JDK 21, not the system JRE.
- **Gradle wrapper download timeout**: the wrapper uses Gradle 8.14.3. A manually downloaded `gradle-8.14.3-bin.zip` can be placed in `%USERPROFILE%\.gradle\wrapper\dists\gradle-8.14.3-bin\<hash>\`.
- **`SDK location not found`**: set `ANDROID_HOME` or create `android/local.properties` containing `sdk.dir=C\:\\Users\\<you>\\AppData\\Local\\Android\\Sdk`.
- **Codegen error in a dependency**: this project pins `react-native-screens` to `4.16.0` for React Native 0.81 compatibility. Do not upgrade it without re-testing codegen.
- **Metro red screen in a debug build**: start Metro and run `adb reverse tcp:8081 tcp:8081`; use a release build for a standalone APK.
