// store.js — персистентность на Supabase Postgres через PostgREST (fetch, без зависимостей).
// Таблица kv_store(key text PK, value jsonb, exp timestamptz).
// Интерфейс store.get/put/del/list — как в Deno-версии (put: {expireInMs}).

function cfg(env) {
  const url = env.SUPABASE_URL || "";
  const key = env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!url || !key) throw new Error("need SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY secrets");
  return { url: url.replace(/\/$/, ""), key };
}
function headers(env) {
  const { key } = cfg(env);
  return {
    apikey: key,
    authorization: "Bearer " + key,
    "content-type": "application/json",
  };
}
async function pg(env, path, opts = {}) {
  const { url } = cfg(env);
  const r = await fetch(url + "/rest/v1" + path, {
    ...opts,
    headers: { ...headers(env), ...(opts.headers || {}) },
  });
  if (r.status === 409) {
    const e = new Error("conflict");
    e.code = 409;
    throw e;
  }
  if (!r.ok) throw new Error("pg " + r.status + " " + (await r.text()).slice(0, 200));
  const t = await r.text();
  return t ? JSON.parse(t) : null;
}
const eq = (v) => "eq." + encodeURIComponent(v);

export const store = {
  async get(env, k) {
    const rows = await pg(env, `/kv_store?key=${eq(k)}&select=value,exp`);
    const row = rows && rows[0];
    if (!row) return null;
    if (row.exp && new Date(row.exp).getTime() < Date.now()) {
      await this.del(env, k).catch(() => {});
      return null;
    }
    return row.value ?? null;
  },
  async put(env, k, v, opts = {}) {
    const exp = opts.expireInMs ? new Date(Date.now() + opts.expireInMs).toISOString() : null;
    await pg(env, "/kv_store", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates" },
      body: JSON.stringify({ key: k, value: v, exp }),
    });
  },
  // insert без upsert: 409 = уже есть (для nonce-replay, если понадобится строгий вариант)
  async putOnce(env, k, v, opts = {}) {
    const exp = opts.expireInMs ? new Date(Date.now() + opts.expireInMs).toISOString() : null;
    await pg(env, "/kv_store", {
      method: "POST",
      body: JSON.stringify({ key: k, value: v, exp }),
    });
  },
  async del(env, k) {
    await pg(env, `/kv_store?key=${eq(k)}`, { method: "DELETE" });
  },
  async list(env, prefix) {
    const rows = await pg(env, `/kv_store?key=like.${encodeURIComponent(prefix)}*&select=key,value,exp`);
    const now = Date.now();
    const out = [];
    for (const r of rows || []) {
      if (r.exp && new Date(r.exp).getTime() < now) continue;
      out.push({ name: r.key, value: r.value });
    }
    return out;
  },

  async ensureSeed(env) {
    const adminEmail = (env.ADMIN_EMAIL || "admin@cheat.com").toLowerCase();
    const adminPw = env.ADMIN_PASSWORD || "123098";
    const existing = await this.get(env, `users:${adminEmail}`);
    if (!existing) {
      const { hashPassword } = await import("./crypto.js");
      await this.put(env, `users:${adminEmail}`, {
        email: adminEmail,
        pass: await hashPassword(adminPw),
        role: "admin",
        permissions: ["*"],
        active: true,
        createdAt: new Date().toISOString(),
      });
    }
  },

  userKey: (email) => `users:${String(email).toLowerCase()}`,
  async getUser(env, email) {
    return this.get(env, this.userKey(email));
  },
  async putUser(env, u) {
    return this.put(env, this.userKey(u.email), u);
  },
  async listUsers(env) {
    const all = await this.list(env, "users:");
    return all.map((x) => {
      const { pass, ...safe } = x.value || {};
      return safe;
    });
  },
};
