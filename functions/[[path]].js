export async function onRequest(context) {
  const { request, params } = context;
  const ua = request.headers.get("user-agent") || "";
  const country = request.cf.country; 
  const url = new URL(request.url);
  const fullPath = params.path ? params.path.join('/') : "";

  // 1. JIKA KETIK DOMAIN SAJA: Langsung lempar ke /ROWX/ buat orang Indo
  if (!fullPath || fullPath === "" || fullPath === "index.html") {
    if (country === "ID") {
      return Response.redirect(`${url.origin}/ROWX/`, 302);
    }
    return context.next(); 
  }

  try {
    const [sEnc, uEnc] = fullPath.split('.');
    if (!sEnc || !uEnc) return context.next();

    const sourceUrl = atob(sEnc.replace(/-/g, '+').replace(/_/g, '/'));
    const targetUrl = atob(uEnc.replace(/-/g, '+').replace(/_/g, '/'));

    // 2. KHUSUS BOT FACEBOOK (Settingan agar Muncul Tombol Play di Komen)
    if (ua.includes("facebookexternalhit") || ua.includes("Facebot")) {
      const response = await fetch(sourceUrl, {
        headers: { "User-Agent": "facebookexternalhit/1.1" }
      });
      const html = await response.text();
      const getMeta = (p) => {
        const m = html.match(new RegExp(`<meta[^>]*?(?:property|name)=["'](?:og:)?${p}["'][^>]*?content=["']([^"']*)["']`, "i"));
        return m ? m[1] : "";
      };

      let title = getMeta("title") || "Video Viral";
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
        <meta property="og:video:url" content="${sourceUrl}">
        <meta property="og:video:secure_url" content="${sourceUrl}">
        <meta property="og:video:type" content="text/html">
        <meta property="og:video:width" content="1280">
        <meta property="og:video:height" content="720">
        
        <meta name="twitter:card" content="summary_large_image">
        <meta name="twitter:image" content="${img}">
      </head><body></body></html>`, { headers: { "content-type": "text/html;charset=UTF-8" } });
    }

    // 3. LOGIKA REDIRECT INDO KE /ROWX/
    if (country === "ID") {
      return Response.redirect(`${url.origin}/ROWX/`, 302);
    }

    // 4. LUAR NEGERI KE TARGET ASLI
    return Response.redirect(targetUrl, 302);

  } catch (e) {
    return context.next();
  }
}
