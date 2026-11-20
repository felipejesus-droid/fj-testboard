function env(name) {
  const v = process.env[name];
  return v && v.trim().length > 0 ? v.trim() : null;
}

export function adapterConfig() {
  return {
    url: env('FJTB_API_URL'),
    key: env('FJTB_API_KEY'),
    model: env('FJTB_API_MODEL'),
    timeout_ms: Number(env('FJTB_API_TIMEOUT_MS') || 120000),
  };
}

export function adapterEnabled() {
  return adapterConfig().url !== null;
}

export function testConnection() {
  const cfg = adapterConfig();
  return { enabled: cfg.url !== null, has_key: cfg.key !== null, has_model: cfg.model !== null };
}

export async function generate({ prompt, tools }) {
  const cfg = adapterConfig();
  if (!cfg.url) {
    throw new Error('adaptador http não configurado: defina FJTB_API_URL (e FJTB_API_KEY, FJTB_API_MODEL em .env, fora do repositório)');
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), cfg.timeout_ms);
  let response;
  try {
    response = await fetch(cfg.url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(cfg.key ? { authorization: `Bearer ${cfg.key}` } : {}),
      },
      body: JSON.stringify({ prompt, tools: tools ?? {}, model: cfg.model }),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
  if (!response.ok) {
    throw new Error(`adaptador respondeu HTTP ${response.status}`);
  }
  const data = await response.json();
  return {
    text: typeof data.text === 'string' ? data.text : null,
    files: data.files && typeof data.files === 'object' ? data.files : null,
    usage: {
      tokens_in: Number.isFinite(data?.usage?.tokens_in) ? data.usage.tokens_in : null,
      tokens_out: Number.isFinite(data?.usage?.tokens_out) ? data.usage.tokens_out : null,
      cost_brl: Number.isFinite(data?.usage?.cost_brl) ? data.usage.cost_brl : null,
      duration_s: Number.isFinite(data?.usage?.duration_s) ? data.usage.duration_s : null,
      tools_actually_used: Array.isArray(data?.usage?.tools_actually_used) ? data.usage.tools_actually_used : [],
    },
  };
}
