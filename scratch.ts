import { searchAnime, getEpisodeSources, getEpisodesList } from "./lib/allanime";

async function test() {
  const title = "Sousou no Frieren"; // or whatever 195600 is
  console.log("Searching for:", title);
  const searchResults = await searchAnime(title);
  console.log("Results length:", searchResults.length);
  if (searchResults.length > 0) {
    console.log("First result:", searchResults[0]);
    const showId = searchResults[0].id;
    const eps = await getEpisodesList(showId);
    console.log("Eps:", eps);
    const sources = await getEpisodeSources(showId, "1", "sub");
    console.log("Sources:", sources);
  }
}

test().catch(console.error);
