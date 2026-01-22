export async function onRequest(context) {
  const { searchParams } = new URL(context.request.url);
  
  // Decode URL dari parameter
  const targetUrl = atob(searchParams.get('u') || "");
  const sourceUrl = atob(searchParams.get('s') || "");

  if (!targetUrl || !sourceUrl) {
    return new Response("Missing parameters", { status: 400 });
  }

  try {
    // 1. Curi (Scrape) konten dari URL yang ditembak
    const response = await fetch(sourceUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)" }
    });
    const htmlText = await response.text();

    // 2. Ekstrak Meta Tags menggunakan Regex sederhana
    const getMeta = (tag) => {
      const match = htmlText.match(new RegExp(`<meta[^>]*property=["']${tag}["'][^>]*content=["']([^"']*)["']`, "i")) ||
                    htmlText.match(new RegExp(`<meta[^>]*name=["']${tag}["'][^>]*content=["']([^"']*)["']`, "i"));
      return match ? match[1] : "";
    };

    const title = getMeta("og:title") || "Loading...";
    const desc = getMeta("og:description") || "";
    const image = getMeta("og:image") || "";

    // 3. Rakit HTML palsu untuk Facebook
    const fakeHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${title}</title>
        <meta property="og:title" content="${title}">
        <meta property="og:description" content="${desc}">
        <meta property="og:image" content="${image}">
        <meta property="og:type" content="website">
        <meta name="twitter:card" content="summary_large_image">
        
        <script>
          // Langsung lempar ke URL Tujuan asli
          window.location.replace("${targetUrl}");
        </script>
      </head>
      <body>
        <p>Redirecting to ${title}...</p>
      </body>
      </html>
    `;

    return new Response(fakeHtml, {
      headers: { "content-type": "text/html;charset=UTF-8" }
    });

  } catch (e) {
    return new Response("Error scraping source", { status: 500 });
  }
}
