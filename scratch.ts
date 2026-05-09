import { searchAnime, getEpisodeSources } from "./lib/allanime";

async function testHls() {
  console.log("🔍 Searching for 'One Piece'...");
  const results = await searchAnime("One Piece");
  if (results.length === 0) {
    console.error("❌ No results found.");
    return;
  }

  const show = results[0];
  console.log(`✅ Found: ${show.name} (${show.id})`);

  console.log("📺 Fetching sources for episode 1...");
  const sources = await getEpisodeSources(show.id, "1");
  if (sources.length === 0) {
    console.error("❌ No sources found.");
    return;
  }

  console.log(`✅ Found ${sources.length} sources.`);

  for (const source of sources) {
    console.log(`\n🔗 Testing Source: ${source.sourceName}`);
    console.log(`📍 URL: ${source.sourceUrl}`);

    if (!source.sourceUrl.includes(".m3u8")) {
      console.log("ℹ️ Not an HLS stream (direct MP4?), skipping detailed playlist analysis.");
      continue;
    }

    try {
      const res = await fetch(source.sourceUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Referer": "https://allmanga.to"
        }
      });

      if (!res.ok) {
        console.error(`❌ Failed to fetch playlist: ${res.status} ${res.statusText}`);
        continue;
      }

      const text = await res.text();
      console.log("📝 Playlist Header:");
      console.log(text.split("\n").slice(0, 10).join("\n"));

      const hasQualities = text.includes("#EXT-X-STREAM-INF");
      if (hasQualities) {
        console.log("✨ YES! This is a Master Playlist with multiple quality streams.");
        
        // Extract resolutions
        const resolutions = text.match(/RESOLUTION=(\d+x\d+)/g);
        if (resolutions) {
          console.log("📊 Available Resolutions:", resolutions.map(r => r.split("=")[1]).join(", "));
        }
        
        const bandwidths = text.match(/BANDWIDTH=(\d+)/g);
        if (bandwidths) {
           console.log("🚀 Max Bandwidth:", Math.max(...bandwidths.map(b => parseInt(b.split("=")[1]))) / 1000, "kbps");
        }
      } else {
        console.log("ℹ️ This is a Single Media Playlist (no multiple quality options found in this file).");
      }
    } catch (e: any) {
      console.error(`❌ Error testing source: ${e.message}`);
    }
  }
}

testHls();
