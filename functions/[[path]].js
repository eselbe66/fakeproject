export async function onRequest(context) {
  const url = new URL(context.request.url);
  const sEnc = url.searchParams.get('s'); // URL Sumber (Base64)
  const uEnc = url.searchParams.get('u'); // URL Tujuan (Base64)
  const ua = context.request.headers.get("user-agent") || "";

  if (!sEnc || !uEnc) return context.next();

  try {
    const sourceUrl = atob(sEnc);
    const targetUrl = atob(uEnc);

    // Filter: Hanya berikan metadata jika yang datang adalah Bot Facebook
    if (ua.includes("facebookexternalhit") || ua.includes("Facebot")) {
      const response = await fetch(sourceUrl, {
        headers: { "User-Agent": "facebookexternalhit/1.1" }
      });
      const htmlText = await response.text();

      // Fungsi untuk mengambil meta tag secara otomatis
      const getMeta = (prop) => {
        const reg = new RegExp(`<meta[^>]*?(?:property|name)=["'](?:og:)?${prop}["'][^>]*?content=["']([^"']*)["']`, "i");
        const match = htmlText.match(reg);
        return match ? match[1] : "";
      };

      const title = getMeta("title") || "YouTube";
      const desc = getMeta("description") || "";
      const image = getMeta("image") || "";

      return new Response(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta property="og:title" content="${title}">
        <meta property="og:description" content="${desc}">
        <meta property="og:image" content="${image}">
        <meta property="og:site_name" content="YouTube">
        <meta property="og:type" content="website">
        <meta name="twitter:card" content="summary_large_image">
      </head>
      <body></body>
      </html>`, { headers: { "content-type": "text/html;charset=UTF-8" } });
    }

    // Jika yang klik adalah orang (bukan bot), langsung lempar ke tujuan
    return Response.redirect(targetUrl, 302);

  } catch (e) {
    // Jika gagal scraping, tetap redirect ke target agar tidak error
    return Response.redirect(atob(uEnc), 302);
  }
}
