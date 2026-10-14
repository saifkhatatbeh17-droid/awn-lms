// Host-injected runtime settings. Production is the safe default.
(() => {
  const apiMeta = document.querySelector('meta[name="awn-api-base-url"]');
  const demoMeta = document.querySelector('meta[name="awn-demo-mode"]');
  const rawApiBaseUrl = String(apiMeta?.content ?? '').trim();
  const demoRequested = String(demoMeta?.content ?? '').trim().toLowerCase() === 'true';
  let apiBaseUrl = '';
  let invalidApiBaseUrl = false;

  if (rawApiBaseUrl) {
    try {
      const parsed = new URL(rawApiBaseUrl, window.location.origin);
      if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password || parsed.search || parsed.hash) {
        throw new Error('Invalid API base URL');
      }
      apiBaseUrl = parsed.href.replace(/\/+$/, '');
    } catch {
      invalidApiBaseUrl = true;
    }
  }

  // Any configured API wins. Invalid or absent settings never enable demo data implicitly.
  const demoMode = demoRequested && !rawApiBaseUrl;
  window.AWN_CONFIG = Object.freeze({
    apiBaseUrl,
    demoMode,
    apiConfigured: Boolean(rawApiBaseUrl) && !invalidApiBaseUrl,
    configurationError: invalidApiBaseUrl ? 'INVALID_API_BASE_URL' : null,
  });
})();