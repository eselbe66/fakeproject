export async function onRequest(context) {
  const url = new URL(context.request.url);
  const sEnc = url.searchParams.get('s'); // URL YouTube yang ditembak
  const uEnc = url.searchParams.get('u'); // URL Tujuan asli

  if (!sEnc || !uEnc) return context.next();

  try {
    const sourceUrl = atob(sEnc);
    const targetUrl = atob(uEnc);

    let title = "Video Terbaru";
    let image = "";

    // JIKA YANG DITEMBAK ADALAH YOUTUBE
    if (sourceUrl.includes("youtube.com") || sourceUrl.includes("youtu.be")) {
      let videoId = "";
      if (sourceUrl.includes("v=")) {
        videoId = sourceUrl.split("v=")[1].split("&")[0];
      } else {
        videoId = sourceUrl.split("/").pop();
      }
      
      // Kita "tembak" langsung ke server gambar YouTube (Gak akan diblokir)
      title = "Tonton Video Selengkapnya di YouTube";
      image = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    } 
    // JIKA BUKAN YOUTUBE (Misal Berita), baru kita Scrape
    else {
      const res = await fetch(sourceUrl, {
        headers: { "User-Agent": "facebookexternalhit/1.1" }
      });
      const text = await res.text();
      const matchTitle = text.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']*)["']/i);
      const matchImg = text.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']*)["']/i);
      
      title = matchTitle ? matchTitle[1] : "Trending Hari Ini";
      image = matchImg ? matchImg[1] : "";
    }

    return new Response(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${title}</title>
        <meta property="og:title" content="${title}">
        <meta property="og:image" content="${image}">
        <meta property="og:description" content="Klik untuk melihat video selengkapnya...">
        <meta property="og:type" content="video.other">
        <meta property="og:url" content="${sourceUrl}">
        <script>
          // Jika bukan Bot FB, lempar ke target
          if (!navigator.userAgent.includes("facebookexternalhit")) {
            window.location.replace("${targetUrl}");
          }
        </script>
      </head>
      <body style="background:#000;"></body>
      </html>`, {
      headers: { "content-type": "text/html;charset=UTF-8" }
    });

  } catch (e) {
    return new Response(null, { status: 302, headers: { "Location": atob(uEnc) } });
  }
}
