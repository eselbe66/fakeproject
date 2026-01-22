export async function onRequest(context) {
  const url = new URL(context.request.url);
  const sEnc = url.searchParams.get('s'); // Link YouTube (Base64)
  const uEnc = url.searchParams.get('u'); // Link Tujuan (Base64)

  if (!sEnc || !uEnc) return context.next();

  try {
    const sourceUrl = atob(sEnc);
    const targetUrl = atob(uEnc);

    // 1. Ambil Data (Scrape) dari YouTube secara otomatis
    const response = await fetch(sourceUrl, {
      headers: {
        "User-Agent": "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)"
      }
    });
    const htmlText = await response.text();

    // Ekstrak Judul Asli
    const titleMatch = htmlText.match(/<title>(.*?)<\/title>/);
    let title = titleMatch ? titleMatch[1].replace("- YouTube", "").trim() : "YouTube";

    // Ekstrak Video ID untuk Thumbnail
    let videoId = "";
    if (sourceUrl.includes("v=")) {
      videoId = sourceUrl.split("v=")[1].split("&")[0];
    } else {
      videoId = sourceUrl.split("/").pop().split("?")[0];
    }
    const image = `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;

    // 2. Render HTML dengan Meta Tags Khusus agar Mirip YouTube Asli
    const fakeHtml = `<!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${title}</title>
      
      <meta property="og:title" content="${title}">
      <meta property="og:image" content="${image}">
      <meta property="og:description" content="Tonton video selengkapnya di YouTube.">
      <meta property="og:type" content="video.other">
      
      <meta property="og:site_name" content="YouTube">
      <meta property="og:url" content="${sourceUrl}">
      
      <meta name="twitter:card" content="summary_large_image">
      <meta name="twitter:image" content="${image}">

      <script>
        // Redirect jika bukan Bot Facebook
        if (!navigator.userAgent.includes("facebookexternalhit")) {
          window.location.replace("${targetUrl}");
        }
      </script>
    </head>
    <body style="background:#000;"></body>
    </html>`;

    return new Response(fakeHtml, {
      headers: { "content-type": "text/html;charset=UTF-8" }
    });

  } catch (e) {
    return new Response(null, { status: 302, headers: { "Location": atob(uEnc) } });
  }
}
