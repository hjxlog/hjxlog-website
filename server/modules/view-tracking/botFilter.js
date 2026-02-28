const BOT_UA_RE = /(bot|spider|crawler|bingpreview|headless|monitor|uptime|pingdom|curl|wget|python-requests|postmanruntime)/i;

export function isBotUserAgent(userAgent) {
  if (!userAgent) return false;
  return BOT_UA_RE.test(userAgent);
}
