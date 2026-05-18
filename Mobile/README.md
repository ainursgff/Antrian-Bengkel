# 🔧 Antrian Bengkel — Mobile App

Sistem antrian digital premium untuk UMKM bengkel.

## 📱 Tech Stack

- **Framework**: Flutter (latest stable)
- **State Management**: Provider
- **HTTP Client**: Dio + Auto Retry
- **Routing**: GoRouter
- **Design**: Material 3 (Light + Dark Mode)
- **Backend**: Express.js + MySQL (existing)

## 🚀 Setup Development

```bash
# 1. Install dependencies
flutter pub get

# 2. Run on Chrome (development)
flutter run -d chrome

# 3. Run on Android device
flutter run -d <device_id>

# 4. Check connected devices
flutter devices
```

## 🔧 Environment Configuration

Edit `lib/core/config/env_config.dart`:

| Environment | Base URL |
|-------------|----------|
| Dev (Web) | `http://localhost:5001/api` |
| Dev (Android) | `http://10.0.2.2:5001/api` |
| Staging | `http://192.168.1.100:5001/api` |
| Production | `https://api.antrianbengkel.com/api` |

## 🏗️ Build Release APK

```bash
# Build APK
flutter build apk --release

# Build App Bundle (for Play Store)
flutter build appbundle --release
```

Output: `build/app/outputs/flutter-apk/app-release.apk`

## 📁 Project Structure

```
lib/
├── core/
│   ├── config/         # Environment config
│   ├── constants/      # Colors, spacing, constants
│   ├── network/        # Dio client with retry
│   ├── theme/          # Light + Dark theme
│   ├── utils/          # Helpers, validators
│   └── widgets/        # Reusable widgets
├── features/
│   ├── admin/          # Admin panel (CRUD)
│   ├── antrian/        # Queue screens
│   ├── auth/           # Login, Register
│   ├── home/           # Customer shell
│   ├── montir/         # Mechanic panel
│   ├── notifikasi/     # Notifications
│   ├── onboarding/     # Onboarding
│   ├── profil/         # Profile + Settings
│   └── splash/         # Splash screen
├── models/             # Data models
├── providers/          # State management
├── routes/             # GoRouter config
├── services/           # API services
└── main.dart           # App entry point
```

## 🧪 Testing

```bash
# Run all tests
flutter test

# Run with coverage
flutter test --coverage
```

## 📋 Release Checklist

- [ ] Update `applicationId` in `android/app/build.gradle.kts`
- [ ] Create release keystore
- [ ] Update `env_config.dart` production URL
- [ ] Run `flutter analyze` (0 errors)
- [ ] Run `flutter test` (all pass)
- [ ] Build release APK: `flutter build apk --release`
- [ ] Test on physical device
- [ ] Test all roles: Pelanggan, Admin, Montir

## 👥 Roles

| Role | Dashboard | Features |
|------|-----------|----------|
| Pelanggan | Customer Dashboard | Ambil antrian, riwayat, notifikasi |
| Admin | Admin Panel | CRUD layanan/jadwal/user, queue mgmt |
| Montir | Mechanic Panel | Task management, status update |

## 📜 API Endpoints Used

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/register` | Register |
| GET | `/api/antrian` | List antrian |
| POST | `/api/antrian` | Create antrian |
| PUT | `/api/antrian/:id/batal` | Cancel antrian |
| PUT | `/api/antrian/:id/dilayani` | Start service |
| PUT | `/api/antrian/:id/selesai` | Complete |
| GET | `/api/layanan` | List services |
| GET | `/api/notifikasi` | Notifications |
| PUT | `/api/notifikasi/read-all` | Mark all read |
| GET | `/api/laporan/hari-ini` | Daily report |
