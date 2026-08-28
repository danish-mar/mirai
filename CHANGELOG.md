# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.3] - 2026-08-29

### Changed
- **Streaming Provider Migration**: Replaced the AllAnime provider (`allanime.day`), which is now gated behind a CAPTCHA challenge upstream, with a new `anidb.app`-based provider (`lib/anidb.ts`), mirroring the switch made by ani-cli 5.0.x. Source resolution now scrapes anidb's search page, episode API, and HLS embed/playlist chain directly instead of the old AllAnime GraphQL API.

### Fixed
- **Playback CORS Errors**: The `/api/proxy` route now rewrites HLS playlist contents so segment URLs are also routed through the proxy, fixing `fragLoadError`/CORS failures caused by the new provider's CDN not sending `Access-Control-Allow-Origin` on segment responses.
- **First-Run Setup Flow**: `/login` now checks for zero registered users server-side and redirects to `/setup`, so wiping the database (or a fresh install) correctly prompts for initial admin creation instead of showing a login form with no accounts to log into.

## [0.2.2] - 2026-05-25

### Changed
- **AllAnime Provider**: Refactored source fetching logic to use native `URLSearchParams`, improved JSON parsing, and added `Origin` headers for better reliability.
- **AllAnime Provider**: Source resolution is now executed in parallel for faster loading times.
- **Dependencies**: Upgraded `better-sqlite3` from 11.9.1 to 12.10.0.

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
