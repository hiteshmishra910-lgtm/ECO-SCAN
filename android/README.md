# EcoScan - Smart Waste Management Native Android App
### Built with Kotlin & Jetpack Compose (Material 3)

---

## 📌 Overview
EcoScan is a smart waste management platform developed as a native Android application using **Kotlin** and **Jetpack Compose**. It features real-time household waste detection using Gemini AI Vision, dry/wet waste segregation, collector duty tracking with GPS, house route navigation, and administrator city analytics.

---

## 🚀 How to Build the APK in Android Studio (for College Submission)

### Prerequisites:
- **Android Studio**: Android Studio Koala, Ladybug, or Iguana (2024+)
- **JDK**: Java Development Kit 17 or 21 (bundled inside Android Studio)
- **Android SDK**: API 35 / 34 (Android 14 or 15)

### Step 1: Open the Project
1. Open **Android Studio**.
2. Click **File > Open...** (or Open on the Welcome Screen).
3. Navigate to and select the `android/` directory of this project.
4. Click **OK**. Android Studio will automatically perform a Gradle Sync.

### Step 2: Build the Debug APK
1. In the top menu bar, click:
   `Build > Build Bundle(s) / APK(s) > Build APK(s)`
2. Android Studio will run Gradle build.
3. Once completed (~45 seconds), a notification will pop up in the bottom-right corner:
   **"APK(s) generated successfully for 1 module: Locate"**
4. Click **"Locate"**.
   The generated APK is located at:
   `android/app/build/outputs/apk/debug/app-debug.apk`

### Step 3: Command Line Build (Alternative)
If you have Gradle installed on your computer, simply run:
```bash
cd android
./gradlew assembleDebug
```
The APK will be generated at `app/build/outputs/apk/debug/app-debug.apk`.

---

## 📱 Features Included in the Native Android App:

1. **Role-Based Authentication (RBAC)**:
   - Resident, Collector, and Admin roles.
   - Quick role switcher for live demonstration.

2. **Resident Portal**:
   - Household segregation stats (Dry vs Wet waste kg).
   - Real-time CameraX Waste Scanner.
   - AI Waste Detection result cards (Plastic Bottle, Wrappers, Paper, Cardboard, Metal, Glass, Organic Food Waste).
   - Recyclability indicator and Recommended Bin (`Dry Waste Bin (Blue)` vs `Wet Waste Bin (Green)`).
   - Human/Non-waste safeguard warning.
   - Household collection history.

3. **Waste Collector Portal**:
   - Duty status toggle (On Duty / Active GPS).
   - Vehicle profile (`MH-31-EQ-4421`).
   - Assigned houses list with distance and status.
   - Mark as collected.

4. **Administrator Portal**:
   - Key metrics (Total Residents, Collectors, Waste Collected).
   - Visual segregation efficiency bar (Dry Recycled vs Wet Compost).
   - Live fleet vehicle tracking.

---

## 🛠 Technology Stack
- **Language**: Kotlin 2.0+
- **UI Toolkit**: Jetpack Compose (Material 3)
- **Architecture**: MVVM with Jetpack Lifecycle & ViewModel
- **Networking**: Retrofit 2 + OkHttp 3 + Gson
- **Camera**: CameraX (camera-camera2, camera-lifecycle, camera-view)
- **Build System**: Gradle 8.11 with Kotlin DSL (`build.gradle.kts`)
