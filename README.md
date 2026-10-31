# English Explorer for Kids (לימוד אנגלית לילדים) 🌟

[![Download Android APK](https://img.shields.io/badge/Download-Android%20APK-brightgreen?logo=android&style=for-the-badge)](https://github.com/iagranat/EnglishForKids/releases/latest/download/EnglishForKids.apk)
[![Build and Release Android APK](https://github.com/iagranat/EnglishForKids/actions/workflows/build-apk.yml/badge.svg)](https://github.com/iagranat/EnglishForKids/actions/workflows/build-apk.yml)

A fun, interactive mobile application built with **React Native** and **Expo** designed specifically for **native Hebrew-speaking kids (ages 8+)** learning English letters, sounds, and initial phonics reading.

> 📲 **Direct Download**: Get the latest Android APK directly on your phone from the **[Releases Page](https://github.com/iagranat/EnglishForKids/releases)** or via direct link: **[Download EnglishForKids.apk](https://github.com/iagranat/EnglishForKids/releases/latest/download/EnglishForKids.apk)**!

---

## 🚀 How to Run the App

In your terminal in `d:\Projects\EnglishForKids`:

### 1. On your Phone or Tablet (iOS / Android)
```bash
npx expo start
```
1. Download the free **Expo Go** app on your iPhone, iPad, or Android device:
   - **iOS**: App Store -> *Expo Go*
   - **Android**: Google Play -> *Expo Go*
2. Scan the QR code displayed in your terminal or browser with your phone's camera (iOS) or the Expo Go app (Android).
3. The app loads instantly on your device!

### 2. On your Computer Browser (Web)
```bash
npx expo start --web
```
Press `w` in the terminal to open the web simulator in your browser.

---

## 🎯 Educational Features Tailored for Hebrew Speakers

### 1. 🔤 Letters Explorer (כרטיסי אותיות A-Z)
- All 26 letters with **Uppercase** (Capital) and **Lowercase** (Small) pairings (`Aa`, `Bb`, `Cc`...).
- **3 Audio modes per letter**:
  1. **Letter Name**: e.g. "A", "B", "C".
  2. **Phonics Sound**: e.g. "A says /æ/ as in Apple".
  3. **Example Word & Sentence**: e.g. "Apple! A is for Apple."
- **Vowel vs. Consonant Highlights**: Vowels (A, E, I, O, U) are tagged with special badges and explained as working like Hebrew Nikkud (כמו ניקוד בעברית).
- **Hebrew Sound Bridges**: Hints connecting English phonemes to Hebrew letters (e.g. `B = בּ דגושה`, `F = פ רפה`, `J = ג׳`, `W = וּוּ`, `V = ו/ב רפה`).
- **Hebrew Translation Hints Toggle**: A switch in the top header allows kids or parents to toggle Hebrew translations and hints on or off anytime.

### 2. 🎯 Capital & Small Letter Match (התאמת אות גדולה וקטנה)
- Specifically addresses the Hebrew-to-English transition where Hebrew has no upper/lowercase distinction.
- Matching game connecting capital letters on the left with scrambled lowercase letters on the right.
- Highlighting, audio pronunciation, celebratory feedback, score, and star rewards (+10 points & bonus stars).

### 3. 👂 Phonics Ear Quiz ("מה הצליל?")
- Auditory ear-training challenge.
- Plays a phonics sound or starting sound of an English word (e.g. *"Which letter makes the sound /d/?"* or *"What letter does Bear start with?"*).
- 4 multiple-choice letter cards with instant auditory feedback and streak multipliers 🔥.
- "Listen Again" button so kids can listen at their own pace.

### 4. ✏️ Letter Tracing & Draw Pad (לוח ציור ותרגול אותיות)
- Interactive touch canvas to practice handwriting capital and small letters.
- Faint guide outline with Left-to-Right writing indicators (➡️ כותבים משמאל לימין).
- Marker color palette, sound replay, and star celebration on completion.

### 5. 🧩 Word Blend (מחברים צלילים למילים - CVC)
- The natural step from individual sounds to reading words!
- Features 3-letter CVC words (CAT, DOG, SUN, BAT, FOX, BUS, etc.).
- Kids tap each individual letter to hear its phonics sound (`/k/` - `/æ/` - `/t/`), then tap **Blend & Read Word** to read the full word together with its Hebrew meaning.

---

## 🛠️ Verification & Quality Checks
- `npx expo-doctor`: 20/20 checks passed.
- `npx tsc --noEmit`: 0 TypeScript errors.
- `npx eslint .`: 0 errors, 0 warnings.
