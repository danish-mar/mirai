# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.1] - 2026-05-09

### Added
- **24-Hour Caching**: Implemented a robust server-side database caching layer for Home, Trending, Popular, and Search results.
- **Dynamic OG Tags**: Added Open Graph and Twitter Card support for all anime and watch pages, providing rich link previews.
- **Bot Bypass**: Updated middleware to allow social media crawlers (Discord, Twitter, etc.) to access metadata without authentication.
- **Share Button**: Integrated a new "Share" button with native Web Share API support and clipboard fallback.
- **HLS Quality Selection**: Added a manual quality selection menu to the video player for HLS streams.

### Fixed
- **Server/Client Leak**: Resolved 'fs' module errors by refactoring AniList types into a shared utility file.
- **Browser Caching**: Optimized page performance with 1-hour browser cache and 24-hour SWR headers.

## [0.2.0] - 2026-05-08

### Added
- **Full History Resumption**: Added support for resuming playback from the exact timestamp saved in the database.
- **AniList Episode Thumbnails**: Integrated rich episode-level thumbnails from AniList's streaming metadata with graceful show-cover fallback.
- **Avatar Upload**: Implemented professional avatar upload functionality with automatic center-cropping and 256x256 resizing.
- **Fullscreen UI**: Added a dedicated fullscreen button and optimized the player overlay for better visibility in fullscreen mode.
- **AniSkip Integration**: Added precise "Skip Intro/Outro/Recap" buttons powered by the AniSkip API.
- **Next Episode Countdown**: Added a 10-second visual countdown with a "Play Now" button at the end of episodes.
- **Streaming URL Caching**: Implemented a database-backed cache for streaming URLs with an 8-hour renewal policy and intelligent "Force Refresh" capabilities if a link expires early.
- **Navbar Integration**: Synchronized the user's profile picture with the global navigation bar for a unified identity experience.
- **Episode Tracking**: Added a "Watched" status feature. Episodes are now visually marked with a checkmark and badge once completed, helping you track your progress across any series.

### Fixed
- **CI/CD Stabilization**: Resolved a critical TypeScript type mismatch in the streaming API that was blocking production builds.
- **Robust Migrations**: Improved the database migration logic to automatically handle schema updates for existing installations.

### Changed
- **Scrollbar Visibility**: Significantly improved global scrollbar visibility and clickability.
- **Keyboard Shortcuts**: Added standard player shortcuts (`Space`, `Arrows`, `F`, `M`).
- **Source Selection**: Improved source selection UI with active state highlighting and direct links.

### Fixed
- Fixed critical crash in `WatchPlayer` caused by accidental code deletion during edits.
- Fixed broken prop references (`title`/`cover`) in `PlayerSection`.
- Fixed sub/dub switching logic to prevent flickering and ensure preference persistence.

## [0.1.0] - 2026-05-02

### Added
- Initial project structure with Next.js and SQLite.
- Core streaming infrastructure using AllAnime provider.
- User authentication and watchlist management.
