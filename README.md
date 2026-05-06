<div align="center">

# 🌸 Mirai (未来) 🌸

✨ _Your next-generation, aesthetic anime streaming experience!_ ✨

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)

</div>

---

## 🎀 What is Mirai?

**Mirai** (Japanese for _Future_) is an elegant, high-performance anime streaming platform built with modern web technologies. Designed with love and aesthetics in mind, Mirai offers a seamless and ad-free experience, combining rich metadata from AniList with a custom, high-quality video player powered by Vidstack.

Whether you're tracking your watchlist or catching up on the latest trending episodes, Mirai delivers a beautiful, immersive, and _kawaii_ viewing experience! (ﾉ◕ヮ◕)ﾉ*:･ﾟ✧

---

## 🎥 Demo Video

Watch Mirai in action: [https://www.youtube.com/watch?v=6BENSniVc8U](https://www.youtube.com/watch?v=6BENSniVc8U)

---

## ✨ Features

- 📺 **Ad-Free Anime Streaming:** Enjoy your favorite shows without interruptions.
- 📖 **Rich Metadata:** Powered by the AniList API for detailed anime information, character stats, and trending lists.
- 🎨 **Modern & Aesthetic UI:** A beautifully crafted, responsive interface utilizing Tailwind CSS 4 and smooth animations via Framer Motion.
- 🔐 **Secure Local Authentication:** Built-in login and user setup with bcrypt and JWT.
- 💾 **Personalized Tracking:** Keep track of your watch history and favorites using a fast, local SQLite database (`better-sqlite3`).
- 🎬 **Premium Video Player:** An elegant playback experience using `vidstack/react` to handle cross-origin streaming sources seamlessly.
- ⚡ **Server-Side Rendered:** Lightning-fast page loads and optimized SEO thanks to Next.js 15 App Router.

---

## 🛠️ Tech Stack

| Category           | Technology                               |
| :----------------- | :--------------------------------------- |
| **Framework**      | Next.js 15 (App Router)                  |
| **Frontend**       | React 19, Tailwind CSS v4, Framer Motion |
| **Language**       | TypeScript                               |
| **Database**       | SQLite (`better-sqlite3`)                |
| **Authentication** | `bcryptjs`, `jose` (JWT)                 |
| **Video Player**   | Vidstack React                           |
| **Metadata**       | `@tdanks2000/anilist-wrapper`            |

---

## 🚀 Getting Started

Ready to launch Mirai locally? Follow these simple steps! (๑•̀ㅂ•́)و✧

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or pnpm
- Git

### Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/danish-mar/mirai.git
   cd mirai
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Environment Setup:**
   Copy the example environment variables and update them if necessary.

   ```bash
   cp .env.example .env
   ```

4. **Run the Development Server:**

   ```bash
   npm run dev
   ```

5. **Open in Browser:**
   Visit `http://localhost:3000` to see Mirai in action! 🌸

_(Note: Docker support is also available via the included `Dockerfile` and `docker-compose.yml` for quick containerized deployment!)_

---

## 💖 Contributing

Contributions are always welcome! If you have ideas to make Mirai even more _kawaii_ or want to fix a bug, feel free to open an issue or submit a pull request. Let's build the future of anime streaming together! 💕

---

## ⚠️ Disclaimer

> **IMPORTANT:** Mirai is an open-source project created strictly for educational and personal use.

This platform acts solely as an aggregator and a client interface. **Mirai does not host, store, or upload any media content or videos on its own servers.** All streaming links, video content, and metadata are dynamically scraped and served from third-party websites, providers, and APIs (such as AniList) over which the developers of Mirai have no control.

The developers of Mirai hold no responsibility for the content hosted by these external third-party providers. Any copyright infringement or DMCA takedown requests should be directed to the respective third-party media hosts. Use this software responsibly and at your own risk.

---

<div align="center">
  <p>Made with 💖 by danish-mar!~</p>
</div>
