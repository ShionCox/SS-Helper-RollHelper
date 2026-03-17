var Zp = Object.create, jd = Object.defineProperty, ef = Object.getOwnPropertyDescriptor, tf = Object.getOwnPropertyNames, rf = Object.getPrototypeOf, nf = Object.prototype.hasOwnProperty, sf = (e, t) => () => (t || e((t = { exports: {} }).exports, t), t.exports), of = (e, t, r, n) => {
  if (t && typeof t == "object" || typeof t == "function")
    for (var o = tf(t), i = 0, c = o.length, u; i < c; i++)
      u = o[i], !nf.call(e, u) && u !== r && jd(e, u, {
        get: ((h) => t[h]).bind(null, u),
        enumerable: !(n = ef(t, u)) || n.enumerable
      });
  return e;
}, af = (e, t, r) => (r = e != null ? Zp(rf(e)) : {}, of(t || !e || !e.__esModule ? jd(r, "default", {
  value: e,
  enumerable: !0
}) : r, e)), Ya = /* @__PURE__ */ function(e) {
  return e.TIMEOUT = "RPC_TIMEOUT", e.NO_HANDLER = "RPC_NO_HANDLER", e.HANDLER_ERROR = "RPC_HANDLER_ERROR", e.BAD_REQUEST = "RPC_BAD_REQUEST", e.PERMISSION_DENIED = "RPC_PERMISSION_DENIED", e;
}({}), Xn = class qd {
  static SYSTEM_NAME = "SS-Helper";
  pluginName;
  isQuiet;
  constructor(t, r = {}) {
    this.pluginName = t, this.isQuiet = r.quiet ?? !1;
  }
  getPrefix(t) {
    return `[${qd.SYSTEM_NAME}]-[${this.pluginName}]-[${t}]`;
  }
  print(t, r, ...n) {
    const o = this.getPrefix(t);
    console.log(`%c${o}`, `color: #fff; background: ${r}; padding: 2px 5px; border-radius: 4px; font-weight: 600; font-size: 11px;`, ...n);
  }
  debug(...t) {
    this.isQuiet || this.print("DEBUG", "#6b7280", ...t);
  }
  info(...t) {
    this.isQuiet || this.print("INFO", "#3b82f6", ...t);
  }
  success(...t) {
    this.print("SUCCESS", "#10b981", ...t);
  }
  warn(...t) {
    this.print("WARN", "#f59e0b", ...t);
  }
  error(...t) {
    const r = this.getPrefix("ERROR");
    console.error(`%c${r}`, "color: #fff; background: #ef4444; padding: 2px 5px; border-radius: 4px; font-weight: 600; font-size: 11px;", ...t);
  }
  setQuiet(t) {
    this.isQuiet = t;
  }
}, Wa = new Xn("STXBus-Broadcast");
function Fd(e, t, r) {
  const n = window.STX?.bus;
  if (!n) {
    Wa.warn(`[Broadcast] 尝试发出 ${e}，但 STX.bus 未挂载。`);
    return;
  }
  const o = {
    v: 1,
    type: "broadcast",
    topic: e,
    from: r,
    ts: Date.now(),
    data: t
  };
  Wa.info(`[Broadcast -> ${e}] 发送广播, from: ${r}`), n.emit(e, o);
}
function lf(e, t, r) {
  const n = window.STX?.bus;
  if (!n) return () => {
  };
  const o = (i) => {
    const c = i?.payload ?? i;
    if (!c || c.v !== 1 || c.type !== "broadcast") return;
    const u = c;
    r?.from && u.from !== r.from || (Wa.info(`[Subscribe <- ${e}] 收到广播消息, from: ${u.from}`), t(u.data, u));
  };
  return n.on(e, o);
}
var cf = {
  "plugin:broadcast:state_changed": {
    id: "plugin:broadcast:state_changed",
    type: "broadcast",
    owner: "system",
    description: "通用状态更新广播。所有插件均可发出其自身的 enabled 等运行状态改变信息。",
    allowlist: ["*"]
  },
  "plugin:request:ping": {
    id: "plugin:request:ping",
    type: "rpc",
    owner: "system",
    description: "服务活性测试。用于确认对象服务是否 Alive 及拉取其 capabilities。",
    allowlist: ["*"]
  },
  "plugin:request:memory_append_outcome": {
    id: "plugin:request:memory_append_outcome",
    type: "rpc",
    owner: "stx_memory_os",
    description: "向 MemoryOS 写入外部结果/走向文本（如骰子结算结果）。",
    allowlist: ["*"]
  },
  "plugin:request:hello": {
    id: "plugin:request:hello",
    type: "rpc",
    owner: "stx_llmhub",
    description: "双向测例: LLMHub 专供问候接口。",
    allowlist: ["stx_memory_os", "stx_template"]
  }
};
function df(e, t) {
  const r = cf[e];
  return !r || !r.allowlist || r.allowlist.length === 0 || r.allowlist.includes("*") ? !0 : r.allowlist.includes(t);
}
var vr = new Xn("STXBus-RPC"), ka = /* @__PURE__ */ new Set(), uf = 5e3;
function mf(e) {
  return ka.has(e) ? !0 : (ka.add(e), setTimeout(() => ka.delete(e), uf), !1);
}
var wa = /* @__PURE__ */ new Map(), Ic = 100;
async function ki(e, t, r, n = {}) {
  const o = window.STX?.bus;
  if (!o) throw new Error("STX.bus has not been initialized yet.");
  if (wa.size >= Ic) throw new Error(`[RPC Guard] Active requests exceeded ${Ic}. Request dropped.`);
  const i = crypto.randomUUID(), c = n.timeoutMs ?? 5e3, u = `plugin:response:${i}`, h = {
    v: 1,
    type: "rpc:req",
    reqId: i,
    topic: e,
    from: r,
    to: n.to,
    ts: Date.now(),
    ttlMs: c,
    data: t
  };
  return wa.set(i, { ts: h.ts }), new Promise((f, v) => {
    let x, y = () => {
    };
    const S = () => {
      clearTimeout(x), y(), wa.delete(i), n.signal && n.signal.removeEventListener("abort", _);
    }, _ = () => {
      S(), v(/* @__PURE__ */ new Error(`RPC_ABORT: Request ${i} was manually aborted.`));
    };
    if (n.signal) {
      if (n.signal.aborted) return _();
      n.signal.addEventListener("abort", _);
    }
    y = o.once(u, (P) => {
      const L = P?.payload ?? P;
      if (!L || L.type !== "rpc:res") return;
      const M = L;
      S(), vr.info(`[Response <- ${e}] 收到回执, from: ${M.from}, reqId: ${i}, 耗时: ${Date.now() - h.ts}ms`), M.ok ? f(M.data) : v(/* @__PURE__ */ new Error(`[RPC Error] ${M.error?.code}: ${M.error?.message}`));
    }), x = setTimeout(() => {
      S(), vr.warn(`[Timeout] 请求发往 ${e} 在 ${c}ms 后超时无响应, reqId: ${i}`), v(/* @__PURE__ */ new Error(`[${Ya.TIMEOUT}] The request ${i} towards ${e} timed out after ${c}ms.`));
    }, c), vr.info(`[Request -> ${e}] 发起调用, to: ${n.to || "ALL"}, reqId: ${i}`), o.emit(e, h);
  });
}
function hf(e, t, r) {
  const n = window.STX?.bus;
  if (!n) return () => {
  };
  const o = async (i) => {
    const c = i?.payload ?? i;
    if (!c || c.type !== "rpc:req") return;
    const u = c;
    if (!(u.to && u.to !== t)) {
      if (!df(e, u.from)) return Ac(u.reqId, u.from, t, {
        code: Ya.PERMISSION_DENIED,
        message: `Namespace ${u.from} is strictly NOT allowed to invoke ${e}.`
      });
      if (mf(u.reqId)) {
        vr.warn(`[RPC Idempotency] 拦截到重复的并发调用，已屏蔽执行, reqId: ${u.reqId}`);
        return;
      }
      try {
        vr.info(`[Handler <- ${e}] 开始接管业务请求, from: ${u.from}, reqId: ${u.reqId}`);
        const h = await r(u.data, u), f = {
          v: 1,
          type: "rpc:res",
          reqId: u.reqId,
          topic: `plugin:response:${u.reqId}`,
          from: t,
          to: u.from,
          ts: Date.now(),
          ok: !0,
          data: h
        };
        vr.info(`[Response -> ${f.topic}] 业务就绪下发回执, to: ${u.from}, reqId: ${u.reqId}`), n.emit(f.topic, f);
      } catch (h) {
        vr.error(`[Handler Error] 微服务提供方内部发生崩溃抛错, topic: ${e}, reqId: ${u.reqId}`, h), Ac(u.reqId, u.from, t, {
          code: Ya.HANDLER_ERROR,
          message: h?.message || "Unknown internal service exception occurred."
        });
      }
    }
  };
  return n.on(e, o);
}
function Ac(e, t, r, n) {
  const o = window.STX?.bus;
  if (!o) return;
  const i = {
    v: 1,
    type: "rpc:res",
    reqId: e,
    topic: `plugin:response:${e}`,
    from: r,
    to: t,
    ts: Date.now(),
    ok: !1,
    error: n
  };
  o.emit(i.topic, i);
}
var pf = "SS-Helper [骰子助手]";
var ff = [], gf = [], vf = "index.js", bf = "Shion", xf = "1.1.7";
var yf = "https://github.com/ShionCox/SS-Helper-RollHelper", Sf = "348591466@qq.com", Sr = {
  display_name: pf,
  loading_order: -8,
  requires: ff,
  optional: gf,
  js: vf,
  author: bf,
  version: xf,
  auto_update: !1,
  homePage: yf,
  email: Sf
}, Ef = "_SCOPE_ .stx-shared-button{--stx-button-text: var(--ss-theme-text, inherit);--stx-button-bg: var(--ss-theme-surface-3, rgba(197, 160, 89, .14));--stx-button-border: var(--ss-theme-border, rgba(197, 160, 89, .45));--stx-button-hover-bg: var(--ss-theme-list-item-hover-bg, rgba(197, 160, 89, .24));--stx-button-hover-border: var(--ss-theme-border-strong, rgba(197, 160, 89, .68));--stx-button-hover-shadow: inset 0 0 0 1px rgba(197, 160, 89, .26), 0 0 14px rgba(197, 160, 89, .2);--stx-button-focus-border: var(--ss-theme-border-strong, rgba(197, 160, 89, .72));--stx-button-focus-ring: var(--ss-theme-focus-ring, rgba(197, 160, 89, .22));display:inline-flex;align-items:center;justify-content:center;gap:6px;min-height:30px;padding:4px 10px;border:1px solid var(--stx-button-border);border-radius:7px;background:var(--stx-button-bg);color:var(--stx-button-text);font-size:12px;line-height:1.2;white-space:nowrap;box-sizing:border-box;cursor:pointer;transition:border-color .2s ease,background-color .2s ease,box-shadow .2s ease,transform .2s ease,opacity .2s ease}_SCOPE_ .stx-shared-button:hover:not(:disabled){border-color:var(--stx-button-hover-border);background:var(--stx-button-hover-bg);box-shadow:var(--stx-button-hover-shadow)}_SCOPE_ .stx-shared-button:focus-visible{outline:none;border-color:var(--stx-button-focus-border);box-shadow:0 0 0 2px var(--stx-button-focus-ring)}_SCOPE_ .stx-shared-button:disabled{opacity:.58;cursor:not-allowed;box-shadow:none}_SCOPE_ .stx-shared-button-icon{display:inline-flex;align-items:center;justify-content:center;flex:0 0 auto;width:1em;height:1em;font-size:.95em;line-height:1}_SCOPE_ .stx-shared-button-icon>i{font-size:inherit;line-height:inherit}_SCOPE_ .stx-shared-button-label{min-width:0;overflow:hidden;text-overflow:ellipsis}";
function Vd(e) {
  return String(e ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function On(e) {
  return Vd(e).replace(/`/g, "&#96;");
}
function _f(...e) {
  return e.filter(Boolean).join(" ");
}
function Tf(e) {
  return e ? Object.entries(e).flatMap(([t, r]) => r == null || r === !1 ? [] : r === !0 ? [` ${t}`] : [` ${t}="${On(String(r))}"`]).join("") : "";
}
function kf(e) {
  return e === "secondary" ? "secondary is-secondary" : e === "danger" ? "danger is-danger" : "primary is-primary";
}
function wf(e) {
  return e ? `<span class="stx-shared-button-icon" aria-hidden="true"><i class="${On(e)}"></i></span>` : "";
}
function If(e) {
  const t = wf(e.iconClassName), r = `<span class="stx-shared-button-label">${Vd(e.label)}</span>`, n = e.iconPosition ?? "start";
  return t ? n === "end" ? `${r}${t}` : `${t}${r}` : r;
}
function me(e) {
  const t = _f("st-roll-btn", "stx-shared-button", kf(e.variant ?? "primary"), e.className), r = Tf(e.attributes), n = e.disabled ? " disabled" : "";
  return `<button${e.id ? ` id="${On(e.id)}"` : ""} type="${On(e.type ?? "button")}" class="${On(t)}" data-ui="shared-button" data-tooltip-anchor="shared-button-control"${n}${r}>${If(e)}</button>`;
}
function Af(e) {
  const t = e.trim() || ":root";
  return Ef.split("_SCOPE_").join(t);
}
var $f = '_SCOPE_ .stx-shared-checkbox-card{--stx-checkbox-accent: var(--ss-theme-accent);--stx-checkbox-accent-soft: var(--ss-theme-focus-ring);--stx-checkbox-accent-strong: var(--ss-theme-accent-contrast);--stx-checkbox-border: var(--ss-theme-border);--stx-checkbox-surface: var(--ss-theme-surface-2);--stx-checkbox-surface-hover: var(--ss-theme-surface-3);--stx-checkbox-text-off: var(--ss-theme-text-muted);--stx-checkbox-box-border: var(--ss-theme-border);--stx-checkbox-box-bg: var(--ss-theme-surface-2);--stx-checkbox-control-shadow: none;position:relative;cursor:pointer;user-select:none}_SCOPE_ .stx-shared-checkbox-card.is-host-native{display:flex;align-items:center;gap:8px}_SCOPE_ .stx-shared-checkbox-card.is-host-native .stx-shared-checkbox-input{position:relative;inline-size:var(--mainFontSize, 15px);block-size:var(--mainFontSize, 15px);margin:0 0 0 8px;padding:0;border-radius:3px;border:1px solid var(--ss-theme-border, rgba(0, 0, 0, .5));background-color:var(--ss-theme-text, rgb(220, 220, 210));box-shadow:inset 0 0 2px 0 var(--ss-theme-shadow, rgba(0, 0, 0, .5));opacity:1;overflow:visible;pointer-events:auto;clip:auto;white-space:normal;order:2;cursor:pointer;transform:translateY(-.075em);display:grid;place-content:center;filter:brightness(1.2);appearance:none;-webkit-appearance:none}_SCOPE_ .stx-shared-checkbox-card.is-host-native .stx-shared-checkbox-input:before{content:"";inline-size:.65em;block-size:.65em;transform:scale(0);transition:var(--animation-duration, 125ms) transform ease-in-out;box-shadow:inset 1em 1em var(--ss-theme-text-muted, #222);transform-origin:bottom left;clip-path:polygon(14% 44%,0 65%,50% 100%,100% 16%,80% 0,43% 62%)}_SCOPE_ .stx-shared-checkbox-card.is-host-native .stx-shared-checkbox-input:checked:before{transform:scale(1)}_SCOPE_ .stx-shared-checkbox-card.is-host-native .stx-shared-checkbox-input:disabled{cursor:not-allowed;opacity:.6}_SCOPE_ .stx-shared-checkbox-card.is-host-native .stx-shared-checkbox-body{order:1;flex:1;min-width:0}_SCOPE_ .stx-shared-checkbox-card.is-host-native .stx-shared-checkbox-control{display:none!important}_SCOPE_ .stx-shared-checkbox-input{position:absolute;inline-size:1px;block-size:1px;margin:-1px;padding:0;border:0;opacity:0;overflow:hidden;pointer-events:none;clip:rect(0 0 0 0);white-space:nowrap}_SCOPE_ .stx-shared-checkbox-body{display:flex;align-items:center;justify-content:space-between;gap:8px;width:100%;min-width:0}_SCOPE_ .stx-shared-checkbox-copy{min-width:0;flex:1}_SCOPE_ .stx-shared-checkbox-title,_SCOPE_ .stx-shared-checkbox-description{display:block;font-size:12px}_SCOPE_ .stx-shared-checkbox-control{display:inline-grid;grid-template-columns:16px minmax(28px,auto);align-items:center;padding:3px 8px 3px 4px;border-radius:999px;border:1px solid var(--stx-checkbox-border);background:var(--stx-checkbox-surface);box-shadow:var(--stx-checkbox-control-shadow);transition:border-color .22s ease,background-color .22s ease,box-shadow .22s ease,transform .22s ease}_SCOPE_ .stx-shared-checkbox-box{display:inline-grid;place-items:center;inline-size:16px;block-size:16px;border-radius:50%;border:1px solid var(--stx-checkbox-box-border);background:var(--stx-checkbox-box-bg);box-shadow:none;transition:border-color .22s ease,background-color .22s ease,box-shadow .22s ease,transform .22s ease}_SCOPE_ .stx-shared-checkbox-icon{inline-size:11px;block-size:11px}_SCOPE_ .stx-shared-checkbox-icon path{stroke:var(--stx-checkbox-accent-strong);stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:18;stroke-dashoffset:18;opacity:0;transition:stroke-dashoffset .24s ease,opacity .18s ease,transform .24s ease;transform:scale(.82);transform-origin:center}_SCOPE_ .stx-shared-checkbox-state{position:relative;display:grid;align-items:center;min-width:2.3em;font-size:10px;line-height:1;letter-spacing:.04em;white-space:nowrap;text-align:right}_SCOPE_ .stx-shared-checkbox-state-label{grid-area:1 / 1;transition:opacity .2s ease,transform .2s ease,color .2s ease}_SCOPE_ .stx-shared-checkbox-state-label.is-off{color:var(--stx-checkbox-text-off)}_SCOPE_ .stx-shared-checkbox-state-label.is-on{color:var(--stx-checkbox-accent-strong);opacity:0;transform:translateY(4px)}_SCOPE_ .stx-shared-checkbox-card:hover .stx-shared-checkbox-control{border-color:color-mix(in srgb,var(--stx-checkbox-accent) 58%,var(--stx-checkbox-border));background-color:var(--stx-checkbox-surface-hover);box-shadow:none;transform:translateY(-1px)}_SCOPE_ .stx-shared-checkbox-card:hover .stx-shared-checkbox-box{border-color:color-mix(in srgb,var(--stx-checkbox-accent) 62%,var(--stx-checkbox-box-border))}_SCOPE_ .stx-shared-checkbox-input:focus-visible+.stx-shared-checkbox-body .stx-shared-checkbox-control{border-color:var(--stx-checkbox-accent);box-shadow:0 0 0 2px var(--stx-checkbox-accent-soft)}_SCOPE_ .stx-shared-checkbox-input:checked+.stx-shared-checkbox-body .stx-shared-checkbox-control{border-color:var(--stx-checkbox-accent);background:var(--stx-checkbox-accent);box-shadow:none}_SCOPE_ .stx-shared-checkbox-input:checked+.stx-shared-checkbox-body .stx-shared-checkbox-box{border-color:var(--stx-checkbox-accent);background:var(--stx-checkbox-accent);box-shadow:none;transform:scale(1.02)}_SCOPE_ .stx-shared-checkbox-input:checked+.stx-shared-checkbox-body .stx-shared-checkbox-icon path{stroke-dashoffset:0;opacity:1;transform:scale(1)}_SCOPE_ .stx-shared-checkbox-input:checked+.stx-shared-checkbox-body .stx-shared-checkbox-state-label.is-off{opacity:0;transform:translateY(-4px)}_SCOPE_ .stx-shared-checkbox-input:checked+.stx-shared-checkbox-body .stx-shared-checkbox-state-label.is-on{opacity:1;transform:translateY(0)}_SCOPE_ .stx-shared-checkbox-input:disabled+.stx-shared-checkbox-body{opacity:.54}_SCOPE_ .stx-shared-checkbox-input:disabled+.stx-shared-checkbox-body .stx-shared-checkbox-control{transform:none;box-shadow:none}_SCOPE_ .stx-shared-checkbox-input:disabled+.stx-shared-checkbox-body .stx-shared-checkbox-box{transform:none}';
function Dn(e) {
  return String(e ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function _t(e) {
  return Dn(e).replace(/`/g, "&#96;");
}
function ur(...e) {
  return e.filter(Boolean).join(" ");
}
function $c(e) {
  return e ? Object.entries(e).flatMap(([t, r]) => r == null || r === !1 ? [] : r === !0 ? [` ${t}`] : [` ${t}="${_t(String(r))}"`]).join("") : "";
}
function Yd(e) {
  const t = Dn(e.checkedLabel ?? "开启"), r = Dn(e.uncheckedLabel ?? "关闭");
  return `
    <label
      class="${_t(ur("stx-shared-checkbox-card", e.containerClassName))}"
      data-ui="shared-checkbox"${$c(e.attributes)}
    >
      <input
        id="${_t(e.id)}"
        class="${_t(ur("stx-shared-checkbox-input", e.inputClassName))}"
        type="checkbox"${$c(e.inputAttributes)}
      />
      <span class="${_t(ur("stx-shared-checkbox-body", e.bodyClassName))}">
        <span class="${_t(ur("stx-shared-checkbox-copy", e.copyClassName))}">
          <span class="${_t(ur("stx-shared-checkbox-title", e.titleClassName))}">
            ${Dn(e.title)}
          </span>
          ${e.description ? `
          <span class="${_t(ur("stx-shared-checkbox-description", e.descriptionClassName))}">
            ${Dn(e.description)}
          </span>` : ""}
        </span>
        <span
          class="${_t(ur("stx-shared-checkbox-control", e.controlClassName))}"
          data-tooltip-anchor="shared-checkbox-control"
          aria-hidden="true"
        >
          <span class="stx-shared-checkbox-box">
            <svg class="stx-shared-checkbox-icon" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M3.5 8.5L6.6 11.4L12.5 4.8" />
            </svg>
          </span>
          <span class="stx-shared-checkbox-state">
            <span class="stx-shared-checkbox-state-label is-off">${r}</span>
            <span class="stx-shared-checkbox-state-label is-on">${t}</span>
          </span>
        </span>
      </span>
    </label>
  `;
}
function Rf(e) {
  const t = e.trim() || ":root";
  return $f.split("_SCOPE_").join(t);
}
var Cf = "_SCOPE_ .stx-shared-input{width:auto;background:var(--ss-theme-surface-2, rgba(0, 0, 0, .28));color:var(--ss-theme-text, inherit);border:1px solid var(--ss-theme-border, rgba(197, 160, 89, .36));border-radius:8px;box-sizing:border-box;font-size:12px;transition:border-color .2s ease,box-shadow .2s ease,background-color .2s ease,opacity .2s ease}_SCOPE_ .stx-shared-input::placeholder{color:color-mix(in srgb,var(--ss-theme-text, #dcdcd2) 60%,transparent)}_SCOPE_ input.stx-shared-input{min-height:30px;padding:4px 8px}_SCOPE_ input.stx-shared-input.st-roll-search{min-height:32px}_SCOPE_ textarea.stx-shared-input{width:100%;min-height:220px;padding:8px;line-height:1.5;resize:vertical}_SCOPE_ .stx-shared-input:hover:not(:disabled):not([readonly]){border-color:var(--ss-theme-border-strong, rgba(197, 160, 89, .58));background-color:var(--ss-theme-surface-3, rgba(0, 0, 0, .34));box-shadow:0 0 0 1px color-mix(in srgb,var(--ss-theme-focus-ring, rgba(197, 160, 89, .22)) 82%,transparent)}_SCOPE_ .stx-shared-input:focus{outline:none}_SCOPE_ .stx-shared-input:focus-visible,_SCOPE_ .stx-shared-input:focus{border-color:var(--ss-theme-border-strong, rgba(197, 160, 89, .72));box-shadow:0 0 0 2px var(--ss-theme-focus-ring, rgba(197, 160, 89, .22))}_SCOPE_ .stx-shared-input:disabled,_SCOPE_ .stx-shared-input[readonly]{cursor:default}_SCOPE_ .stx-shared-input:disabled{opacity:.6}";
function Wd(e) {
  return String(e ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function hr(e) {
  return Wd(e).replace(/`/g, "&#96;");
}
function Df(...e) {
  return e.filter(Boolean).join(" ");
}
function Nf(e) {
  return e ? Object.entries(e).flatMap(([t, r]) => r == null || r === !1 ? [] : r === !0 ? [` ${t}`] : [` ${t}="${hr(String(r))}"`]).join("") : "";
}
function Lf(e, t) {
  return e === "textarea" ? "st-roll-textarea" : t === "search" ? "st-roll-search" : "st-roll-input";
}
function je(e) {
  const t = e.tag ?? "input", r = e.type ?? "text", n = Df(Lf(t, r), "stx-shared-input", e.className), o = e.id ? ` id="${hr(e.id)}"` : "", i = e.disabled ? " disabled" : "", c = e.readOnly ? " readonly" : "", u = e.style ? ` style="${hr(e.style)}"` : "", h = Nf(e.attributes);
  if (t === "textarea") return `<textarea${o} class="${hr(n)}" data-ui="shared-input" data-tooltip-anchor="shared-input-control"${i}${c}${u}${h}>${Wd(String(e.value ?? ""))}</textarea>`;
  const f = ` value="${hr(String(e.value ?? ""))}"`;
  return `<input${o} type="${hr(r)}" class="${hr(n)}" data-ui="shared-input" data-tooltip-anchor="shared-input-control"${f}${i}${c}${u}${h} />`;
}
function Mf(e) {
  const t = e.trim() || ":root";
  return Cf.split("_SCOPE_").join(t);
}
var Of = "_SCOPE_ .stx-shared-select{position:relative;display:inline-block;width:min(100%,240px);min-width:182px;max-width:100%;color:var(--ss-theme-text, inherit);vertical-align:middle}_SCOPE_ .stx-shared-select.stx-shared-select-fluid{width:100%;min-width:0;max-width:100%}_SCOPE_ .stx-shared-select.stx-shared-select-inline{flex:1 1 auto;min-width:0}_SCOPE_ .stx-shared-select.stx-shared-select-flex-220{flex:0 1 220px}_SCOPE_ .stx-shared-select.stx-shared-select-workbench{min-width:132px}_SCOPE_ .stx-shared-select.stx-shared-select-workbench-compact{min-width:122px}_SCOPE_ .stx-shared-select.stx-shared-select-width-sm{width:116px;min-width:116px;max-width:116px}_SCOPE_ .stx-shared-select[data-shared-select-disabled=true]{opacity:.72}_SCOPE_ .stx-shared-select-native{position:absolute;inset:0;width:100%;height:100%;margin:0;opacity:0;pointer-events:none}_SCOPE_ .stx-shared-select-trigger{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:10px;width:100%;min-height:30px;padding:4px 10px;border:1px solid var(--ss-theme-border, rgba(197, 160, 89, .36));border-radius:8px;background:linear-gradient(135deg,#ffffff12,#ffffff05),var(--ss-theme-surface-2, rgba(0, 0, 0, .28));color:var(--ss-theme-text, inherit);box-sizing:border-box;cursor:pointer;transition:border-color .2s ease,box-shadow .2s ease,background-color .2s ease,transform .2s ease}_SCOPE_ .stx-shared-select-trigger.stx-shared-select-trigger-input{display:flex;align-items:center;justify-content:space-between;width:100%;min-width:0;min-height:34px;padding-top:0;padding-bottom:0;line-height:1;box-sizing:border-box}_SCOPE_ .stx-shared-select-trigger.stx-shared-select-trigger-input .stx-shared-select-trigger-copy,_SCOPE_ .stx-shared-select-trigger.stx-shared-select-trigger-input .stx-shared-select-main,_SCOPE_ .stx-shared-select-trigger.stx-shared-select-trigger-input .stx-shared-select-label,_SCOPE_ .stx-shared-select-trigger.stx-shared-select-trigger-input .stx-shared-select-indicator{min-height:0;display:flex;align-items:center}_SCOPE_ .stx-shared-select-trigger.stx-shared-select-trigger-input .stx-shared-select-trigger-copy,_SCOPE_ .stx-shared-select-trigger.stx-shared-select-trigger-input .stx-shared-select-main{flex:1 1 auto;min-width:0}_SCOPE_ .stx-shared-select-trigger.stx-shared-select-trigger-compact{min-height:32px;padding:4px 8px;gap:6px}_SCOPE_ .stx-shared-select-trigger.stx-shared-select-trigger-36{min-height:36px;height:36px;padding-top:0;padding-bottom:0}_SCOPE_ .stx-shared-select-trigger:disabled{cursor:not-allowed}_SCOPE_ .stx-shared-select-label{display:flex;align-items:center;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-align:left;line-height:1.2}_SCOPE_ .stx-shared-select-trigger-copy,_SCOPE_ .stx-shared-select-main,_SCOPE_ .stx-shared-select-option-label-wrap{min-width:0}_SCOPE_ .stx-shared-select-trigger-copy{display:flex;align-items:center;width:100%;min-height:30px}_SCOPE_ .stx-shared-select-main{display:inline-flex;align-items:center;flex-direction:row;justify-content:flex-start;gap:8px;width:100%;min-width:0;min-height:30px;flex-wrap:nowrap}.stx-shared-select-list .stx-shared-select-main{display:inline-flex;align-items:center;flex-direction:row;justify-content:flex-start;gap:8px;width:100%;min-width:0;min-height:30px;flex-wrap:nowrap}_SCOPE_ .stx-shared-select-media{display:inline-flex;align-items:center;justify-content:center;flex:0 0 auto;width:30px;height:30px;border-radius:999px;overflow:hidden;background:color-mix(in srgb,var(--ss-theme-surface-3, rgba(255, 255, 255, .08)) 100%,transparent);border:1px solid color-mix(in srgb,var(--ss-theme-border, rgba(255, 255, 255, .16)) 88%,transparent);align-self:center}_SCOPE_ .stx-shared-select-option .stx-shared-select-media,_SCOPE_ .stx-shared-select-trigger .stx-shared-select-media{width:30px;height:30px;min-width:30px;min-height:30px}.stx-shared-select-list .stx-shared-select-media{width:30px;height:30px;min-width:30px;min-height:30px;border-radius:999px;overflow:hidden;flex:0 0 auto;align-self:center}_SCOPE_ .stx-shared-select-media.is-icon{font-size:.9em;color:color-mix(in srgb,var(--ss-theme-text, inherit) 82%,transparent)}_SCOPE_ .stx-shared-select-media-image{width:100%;height:100%;min-width:100%;min-height:100%;max-width:none;max-height:none;object-fit:cover;display:block;border-radius:999px;flex:0 0 auto}.stx-shared-select-list .stx-shared-select-media-image{width:30px;height:30px;min-width:30px;min-height:30px;max-width:30px;max-height:30px;object-fit:cover;display:block;border-radius:999px;flex:0 0 auto}_SCOPE_ .stx-shared-select-indicator{display:inline-grid;place-items:center;width:18px;height:18px;color:currentColor;opacity:.82;transition:transform .2s ease,opacity .2s ease}_SCOPE_ .stx-shared-select-indicator svg{width:12px;height:12px}_SCOPE_ .stx-shared-select.is-open .stx-shared-select-indicator{transform:rotate(180deg);opacity:1}_SCOPE_ .stx-shared-select-list,.stx-shared-select-list{position:fixed;left:0;top:0;z-index:9999990;display:none;margin:0;padding:5px;border:1px solid var(--ss-theme-border, rgba(255, 255, 255, .18));border-radius:12px;background:radial-gradient(120% 130% at 100% 0%,rgba(197,160,89,.12),transparent 58%),var(--stx-shared-select-panel-bg, var(--ss-theme-panel-bg, rgba(18, 16, 18, .78)));-webkit-backdrop-filter:var( --stx-shared-select-panel-backdrop-filter, var(--ss-theme-backdrop-filter, blur(6px)) );backdrop-filter:var( --stx-shared-select-panel-backdrop-filter, var(--ss-theme-backdrop-filter, blur(6px)) );box-shadow:0 18px 40px #0000004d,0 0 0 1px #ffffff0a;box-sizing:border-box;overflow:auto;color:var(--ss-theme-text, inherit)}_SCOPE_ .stx-shared-select.is-open .stx-shared-select-list,_SCOPE_ .stx-shared-select-list.is-open,.stx-shared-select-list.is-open{display:block}_SCOPE_ .stx-shared-select-option,.stx-shared-select-list .stx-shared-select-option{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:8px;min-height:30px;padding:5px 9px;border:1px solid transparent;border-radius:8px;color:inherit;font-size:13px;line-height:1.35;box-sizing:border-box;cursor:pointer;user-select:none;transition:border-color .18s ease,background-color .18s ease,box-shadow .18s ease,transform .18s ease}_SCOPE_ .stx-shared-select-option+.stx-shared-select-option,.stx-shared-select-list .stx-shared-select-option+.stx-shared-select-option{margin-top:4px}_SCOPE_ .stx-shared-select-option[data-shared-select-disabled=true],.stx-shared-select-list .stx-shared-select-option[data-shared-select-disabled=true]{opacity:.45;cursor:not-allowed}_SCOPE_ .stx-shared-select-option-label,.stx-shared-select-list .stx-shared-select-option-label{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-align:left}_SCOPE_ .stx-shared-select-option-mark,.stx-shared-select-list .stx-shared-select-option-mark{width:12px;height:12px;border-radius:999px;border:1px solid transparent;opacity:0;transform:scale(.78);transition:opacity .18s ease,transform .18s ease,border-color .18s ease,background-color .18s ease}_SCOPE_ .stx-shared-select-option.is-highlighted:not([data-shared-select-disabled=true]),.stx-shared-select-list .stx-shared-select-option.is-highlighted:not([data-shared-select-disabled=true]){border-color:var(--ss-theme-border-strong, rgba(197, 160, 89, .58));background:var(--ss-theme-list-item-hover-bg, rgba(197, 160, 89, .16));box-shadow:0 0 0 1px #ffffff08;transform:translateY(-1px)}_SCOPE_ .stx-shared-select-option.is-selected,.stx-shared-select-list .stx-shared-select-option.is-selected{border-color:var(--ss-theme-border-strong, rgba(197, 160, 89, .74));background:var(--ss-theme-list-item-active-bg, rgba(197, 160, 89, .24));box-shadow:0 0 0 1px #c5a0593d}_SCOPE_ .stx-shared-select-option.is-selected .stx-shared-select-option-mark,.stx-shared-select-list .stx-shared-select-option.is-selected .stx-shared-select-option-mark{opacity:1;transform:scale(1);border-color:var(--ss-theme-accent, #c5a059);background:radial-gradient(circle at 50% 50%,var(--ss-theme-accent-contrast, #ffeac0) 0 28%,transparent 34%),var(--ss-theme-accent, #c5a059)}_SCOPE_ .stx-shared-select:not([data-shared-select-disabled=true]) .stx-shared-select-trigger:hover{border-color:var(--ss-theme-border-strong, rgba(197, 160, 89, .58));background:linear-gradient(135deg,#ffffff1a,#ffffff08),var(--ss-theme-surface-3, rgba(0, 0, 0, .34));box-shadow:0 0 0 1px var(--ss-theme-focus-ring, rgba(197, 160, 89, .22))}_SCOPE_ .stx-shared-select.is-open .stx-shared-select-trigger{border-color:var(--ss-theme-border-strong, rgba(197, 160, 89, .72));box-shadow:0 0 0 2px var(--ss-theme-focus-ring, rgba(197, 160, 89, .22)),0 10px 22px #00000029}_SCOPE_ .stx-shared-select-trigger:focus-visible{outline:none;border-color:var(--ss-theme-border-strong, rgba(197, 160, 89, .72));box-shadow:0 0 0 2px var(--ss-theme-focus-ring, rgba(197, 160, 89, .22))}_SCOPE_ .stx-shared-select-list::-webkit-scrollbar,.stx-shared-select-list::-webkit-scrollbar{width:8px}_SCOPE_ .stx-shared-select-list::-webkit-scrollbar-thumb,.stx-shared-select-list::-webkit-scrollbar-thumb{border-radius:999px;background:#ffffff29}@media (max-width: 680px){_SCOPE_ .stx-shared-select.stx-shared-select-workbench,_SCOPE_ .stx-shared-select.stx-shared-select-workbench-compact{width:100%;min-width:0;max-width:100%}_SCOPE_ .stx-shared-select.stx-shared-select-width-sm{width:108px;min-width:108px;max-width:108px}}", wi = {
  text: "--ss-theme-text",
  textMuted: "--ss-theme-text-muted",
  accent: "--ss-theme-accent",
  accentContrast: "--ss-theme-accent-contrast",
  surface1: "--ss-theme-surface-1",
  surface2: "--ss-theme-surface-2",
  surface3: "--ss-theme-surface-3",
  border: "--ss-theme-border",
  borderStrong: "--ss-theme-border-strong",
  focusRing: "--ss-theme-focus-ring",
  panelBg: "--ss-theme-panel-bg",
  panelBorder: "--ss-theme-panel-border",
  panelShadow: "--ss-theme-panel-shadow",
  toolbarBg: "--ss-theme-toolbar-bg",
  listItemHoverBg: "--ss-theme-list-item-hover-bg",
  listItemActiveBg: "--ss-theme-list-item-active-bg",
  backdrop: "--ss-theme-backdrop",
  backdropFilter: "--ss-theme-backdrop-filter",
  shadow: "--ss-theme-shadow",
  rollTooltipText: "--ss-theme-roll-tooltip-text",
  rollTooltipBg: "--ss-theme-roll-tooltip-bg",
  rollTooltipBorder: "--ss-theme-roll-tooltip-border",
  rollTooltipShadow: "--ss-theme-roll-tooltip-shadow"
}, Pf = Object.entries(wi);
function Bf(e, t) {
  for (const [r, n] of Pf) e.style.setProperty(n, t[r]);
}
function Uf(e) {
  for (const t of Object.values(wi)) e.style.removeProperty(t);
}
var Xd = {
  text: "#ecdcb8",
  textMuted: "rgba(255, 255, 255, 0.72)",
  accent: "#c5a059",
  accentContrast: "#ffeac0",
  surface1: "radial-gradient(120% 140% at 100% 0%, rgba(197, 160, 89, 0.12), transparent 55%), linear-gradient(160deg, rgba(31, 25, 25, 0.82), rgba(20, 18, 20, 0.82))",
  surface2: "rgba(0, 0, 0, 0.18)",
  surface3: "rgba(255, 255, 255, 0.03)",
  border: "rgba(197, 160, 89, 0.35)",
  borderStrong: "rgba(197, 160, 89, 0.58)",
  focusRing: "rgba(197, 160, 89, 0.22)",
  panelBg: "radial-gradient(110% 130% at 100% 0%, rgba(197, 160, 89, 0.14), transparent 56%), linear-gradient(160deg, rgba(23, 21, 24, 0.96), rgba(15, 14, 17, 0.96))",
  panelBorder: "rgba(197, 160, 89, 0.38)",
  panelShadow: "0 18px 54px rgba(0, 0, 0, 0.46)",
  toolbarBg: "rgba(255, 255, 255, 0.04)",
  listItemHoverBg: "rgba(197, 160, 89, 0.16)",
  listItemActiveBg: "rgba(197, 160, 89, 0.24)",
  backdrop: "rgba(0, 0, 0, 0.72)",
  backdropFilter: "blur(2px)",
  shadow: "0 18px 54px rgba(0, 0, 0, 0.46)",
  rollTooltipText: "#dbd2c2",
  rollTooltipBg: "radial-gradient(circle at top, rgba(246, 223, 172, 0.07), transparent 52%), linear-gradient(145deg, rgba(40, 30, 20, 0.97), rgba(14, 10, 7, 0.99))",
  rollTooltipBorder: "rgba(176, 143, 76, 0.55)",
  rollTooltipShadow: "0 6px 18px rgba(0, 0, 0, 0.8), inset 0 0 12px rgba(0, 0, 0, 0.4), 0 0 6px rgba(176, 143, 76, 0.1)"
}, Kf = {
  default: Xd,
  dark: {
    text: "#e6edf7",
    textMuted: "#a5b0c4",
    accent: "#5f8de5",
    accentContrast: "#f1f6ff",
    surface1: "#171f2f",
    surface2: "#182233",
    surface3: "#1f2a3d",
    border: "#35425e",
    borderStrong: "#5c74a5",
    focusRing: "rgba(95, 141, 229, 0.24)",
    panelBg: "#131c2b",
    panelBorder: "#34435f",
    panelShadow: "0 12px 30px #0b1020",
    toolbarBg: "#202c40",
    listItemHoverBg: "#2c3b56",
    listItemActiveBg: "#334766",
    backdrop: "rgba(15, 21, 32, 0.9)",
    backdropFilter: "none",
    shadow: "0 12px 30px #0b1020",
    rollTooltipText: "#dbd2c2",
    rollTooltipBg: "radial-gradient(circle at top, rgba(246, 223, 172, 0.07), transparent 52%), linear-gradient(145deg, rgba(40, 30, 20, 0.97), rgba(14, 10, 7, 0.99))",
    rollTooltipBorder: "rgba(176, 143, 76, 0.55)",
    rollTooltipShadow: "0 6px 18px rgba(0, 0, 0, 0.8), inset 0 0 12px rgba(0, 0, 0, 0.4), 0 0 6px rgba(176, 143, 76, 0.1)"
  },
  light: {
    text: "#1f2834",
    textMuted: "#5e6e84",
    accent: "#2f6ee5",
    accentContrast: "#ffffff",
    surface1: "#f8fbff",
    surface2: "#eef3fa",
    surface3: "#ffffff",
    border: "#c6d1e2",
    borderStrong: "#8eaed9",
    focusRing: "rgba(47, 110, 229, 0.18)",
    panelBg: "#f5f9ff",
    panelBorder: "#c6d3e6",
    panelShadow: "0 10px 24px rgba(198, 208, 223, 0.9)",
    toolbarBg: "#eef3fa",
    listItemHoverBg: "#e8f0ff",
    listItemActiveBg: "#d8e6ff",
    backdrop: "rgba(217, 225, 238, 0.86)",
    backdropFilter: "none",
    shadow: "0 10px 24px rgba(198, 208, 223, 0.9)",
    rollTooltipText: "#dbd2c2",
    rollTooltipBg: "radial-gradient(circle at top, rgba(246, 223, 172, 0.07), transparent 52%), linear-gradient(145deg, rgba(40, 30, 20, 0.97), rgba(14, 10, 7, 0.99))",
    rollTooltipBorder: "rgba(176, 143, 76, 0.55)",
    rollTooltipShadow: "0 6px 18px rgba(0, 0, 0, 0.8), inset 0 0 12px rgba(0, 0, 0, 0.4), 0 0 6px rgba(176, 143, 76, 0.1)"
  },
  host: {
    text: "var(--SmartThemeBodyColor, #dcdcd2)",
    textMuted: "var(--SmartThemeEmColor, rgba(255, 255, 255, 0.72))",
    accent: "var(--SmartThemeQuoteColor, #e18a24)",
    accentContrast: "var(--SmartThemeBodyColor, #dcdcd2)",
    surface1: "var(--SmartThemeBlurTintColor, rgba(23, 23, 23, 0.96))",
    surface2: "color-mix(in srgb, var(--SmartThemeBlurTintColor, rgba(23, 23, 23, 0.96)) 88%, #000 12%)",
    surface3: "color-mix(in srgb, var(--SmartThemeBlurTintColor, rgba(23, 23, 23, 0.96)) 92%, #000 8%)",
    border: "var(--SmartThemeBorderColor, rgba(0, 0, 0, 0.5))",
    borderStrong: "color-mix(in srgb, var(--SmartThemeQuoteColor, #e18a24) 56%, var(--SmartThemeBorderColor, rgba(0, 0, 0, 0.5)))",
    focusRing: "color-mix(in srgb, var(--SmartThemeQuoteColor, #e18a24) 32%, transparent)",
    panelBg: "var(--SmartThemeBlurTintColor, rgba(23, 23, 23, 1))",
    panelBorder: "var(--SmartThemeBorderColor, rgba(0, 0, 0, 0.5))",
    panelShadow: "0 14px 30px var(--SmartThemeShadowColor, rgba(0, 0, 0, 0.5))",
    toolbarBg: "color-mix(in srgb, var(--SmartThemeBlurTintColor, rgba(23, 23, 23, 1)) 82%, var(--SmartThemeBodyColor, #dcdcd2) 18%)",
    listItemHoverBg: "color-mix(in srgb, var(--SmartThemeQuoteColor, #e18a24) 16%, var(--SmartThemeBlurTintColor, rgba(23, 23, 23, 1)))",
    listItemActiveBg: "color-mix(in srgb, var(--SmartThemeQuoteColor, #e18a24) 24%, var(--SmartThemeBlurTintColor, rgba(23, 23, 23, 1)))",
    backdrop: "color-mix(in srgb, var(--SmartThemeBlurTintColor, rgba(23, 23, 23, 1)) 85%, #000 15%)",
    backdropFilter: "blur(var(--SmartThemeBlurStrength, 0px))",
    shadow: "0 14px 30px var(--SmartThemeShadowColor, rgba(0, 0, 0, 0.5))",
    rollTooltipText: "var(--SmartThemeBodyColor, #dcdcd2)",
    rollTooltipBg: "var(--SmartThemeBlurTintColor, rgba(23, 23, 23, 0.96))",
    rollTooltipBorder: "var(--SmartThemeBorderColor, rgba(0, 0, 0, 0.5))",
    rollTooltipShadow: "0 6px 18px var(--SmartThemeShadowColor, rgba(0, 0, 0, 0.5))"
  }
};
function Wr(e) {
  return Kf[e] ?? Xd;
}
var Jd = "stx_sdk_theme_global_v2";
function Jn(e) {
  const t = String(e ?? "").trim().toLowerCase();
  return t === "dark" ? "dark" : t === "light" ? "light" : t === "host" || t === "tavern" ? "host" : "default";
}
function Hf() {
  try {
    const e = String(globalThis.localStorage?.getItem(Jd) ?? "").trim();
    return e ? Jn(e) : "default";
  } catch {
    return "default";
  }
}
function Gf(e) {
  try {
    globalThis.localStorage?.setItem(Jd, e);
  } catch {
  }
}
function ln() {
  const e = globalThis;
  if (e.__ssThemeKernelV2) return e.__ssThemeKernelV2;
  const t = {
    initialized: !1,
    state: { themeId: "default" },
    listeners: /* @__PURE__ */ new Set(),
    hosts: /* @__PURE__ */ new Set()
  };
  return e.__ssThemeKernelV2 = t, t;
}
function Qd(e, t) {
  e.setAttribute("data-ss-theme", t), Bf(e, Wr(t));
}
function zf(e) {
  const t = ln();
  for (const r of Array.from(t.hosts)) {
    if (!r.isConnected) {
      t.hosts.delete(r);
      continue;
    }
    Qd(r, e.themeId);
  }
  for (const r of t.listeners) r(e);
}
function _o() {
  const e = ln();
  return e.initialized || (e.state = { themeId: Hf() }, e.initialized = !0), e.state;
}
function Ii() {
  return _o();
}
function jf(e) {
  const t = ln();
  _o();
  const r = Jn(e);
  return r === t.state.themeId || (t.state = { themeId: r }, Gf(r), zf(t.state)), t.state;
}
function Ai(e) {
  const t = ln();
  return t.listeners.add(e), () => {
    t.listeners.delete(e);
  };
}
function qf(e) {
  const t = ln(), r = _o();
  t.hosts.add(e), Qd(e, r.themeId);
}
function Ff(e) {
  ln().hosts.delete(e), e.removeAttribute("data-ss-theme"), Uf(e);
}
function To(e) {
  qf(e);
}
function Rc(e) {
  Ff(e);
}
function Vf(e) {
  const t = e.split(",").map((r) => r.trim()).filter((r) => r.length > 0);
  return t.length > 0 ? t : [":root"];
}
function Yf(e, t = "") {
  return e.map((r) => `${r}${t}`).join(`,
    `);
}
function Wf(e) {
  return Object.entries(wi).map(([t, r]) => `      ${r}: ${e[t]};`).join(`
`);
}
function zr(e, t, r, n) {
  return `
    ${Yf(e, t)} {
      color: var(--ss-theme-text, inherit);
${Wf(r)}
${n ? n + `
` : ""}    }`;
}
function Ia(e = {}) {
  const t = [
    "      --SmartThemeBodyColor: var(--ss-theme-text);",
    "      --SmartThemeEmColor: var(--ss-theme-text-muted);",
    "      --SmartThemeQuoteColor: var(--ss-theme-accent);",
    "      --SmartThemeQuoteTextColor: var(--ss-theme-accent-contrast);",
    "      --SmartThemeBorderColor: var(--ss-theme-border);"
  ];
  return e.shadowWidth !== void 0 && t.push(`      --shadowWidth: ${e.shadowWidth};`), t.join(`
`);
}
function Xf(e) {
  const t = Vf(e), r = zr(t, "", Wr("default")), n = zr(t, '[data-ss-theme="default"]', Wr("default"), Ia()), o = zr(t, '[data-ss-theme="dark"]', Wr("dark"), Ia()), i = zr(t, '[data-ss-theme="light"]', Wr("light"), Ia({ shadowWidth: "0" })), c = Wr("host");
  return `${r}
${n}
${o}
${i}
${zr(t, '[data-ss-theme="host"]', c)}
${zr(t, '[data-ss-theme="tavern"]', c)}`;
}
var Ge = null, Cc = !1, rn = 0, br = 0, Aa = null;
function ko(e, t) {
  if (t === void 0) {
    console.info(`[SS-Helper][SharedSelectTrace] ${e}`);
    return;
  }
  console.info(`[SS-Helper][SharedSelectTrace] ${e}`, t);
}
function jr(e) {
  e.stopPropagation();
}
function $i(e) {
  return String(e ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function ze(e) {
  return $i(e).replace(/`/g, "&#96;");
}
function qr(...e) {
  return e.filter(Boolean).join(" ");
}
function Nn(e) {
  return e ? Object.entries(e).flatMap(([t, r]) => r == null || r === !1 ? [] : r === !0 ? [` ${t}`] : [` ${t}="${ze(String(r))}"`]).join("") : "";
}
function Dc(e, t) {
  return `${e}__${t}`;
}
function Jf(e) {
  if (!e) return "";
  const t = { "data-media-type": e.type };
  return e.type === "image" && (t["data-media-src"] = e.src ?? "", t["data-media-alt"] = e.alt ?? ""), e.type === "icon" && (t["data-media-icon"] = e.iconClassName ?? ""), Nn(t);
}
function Qf(e) {
  if (!e) return null;
  const t = String(e.dataset.mediaType ?? "").trim();
  if (t === "image") {
    const r = String(e.dataset.mediaSrc ?? "").trim();
    return r ? {
      type: "image",
      src: r,
      alt: String(e.dataset.mediaAlt ?? "").trim()
    } : null;
  }
  if (t === "icon") {
    const r = String(e.dataset.mediaIcon ?? "").trim();
    return r ? {
      type: "icon",
      iconClassName: r
    } : null;
  }
  return null;
}
function Zf(e) {
  if (!e) return "";
  if (e.type === "image" && e.src) {
    const t = ze(e.alt ?? "");
    return `<span class="stx-shared-select-media is-image" aria-hidden="true"><img class="stx-shared-select-media-image" src="${ze(e.src)}" alt="${t}" /></span>`;
  }
  return e.type === "icon" && e.iconClassName ? `<span class="stx-shared-select-media is-icon" aria-hidden="true"><i class="${ze(e.iconClassName)}"></i></span>` : "";
}
function Xa(e, t) {
  return `
    <span class="stx-shared-select-main">
      ${Zf(t)}
      <span class="stx-shared-select-label">${$i(e)}</span>
    </span>
  `.trim();
}
function Ut(e) {
  const t = String(e.value ?? ""), r = e.options.find((u) => String(u.value) === t), n = r?.label ?? e.options[0]?.label ?? "", o = r?.media ?? e.options[0]?.media ?? null, i = Dc(e.id, "trigger"), c = Dc(e.id, "listbox");
  return `
    <div
      class="${ze(qr("stx-shared-select", e.containerClassName))}"
      data-ui="shared-select"${Nn(e.attributes)}
    >
      <select
        id="${ze(e.id)}"
        class="${ze(qr("st-roll-select", "stx-shared-select-native", e.selectClassName))}"
        tabindex="-1"
        aria-hidden="true"${Nn(e.selectAttributes)}
      >
        ${e.options.map((u, h) => {
    const f = String(u.value ?? ""), v = f === t || !r && !t && h === 0;
    return `<option value="${ze(f)}"${u.disabled ? " disabled" : ""}${v ? " selected" : ""}${Jf(u.media)}${Nn(u.attributes)}>${$i(u.label)}</option>`;
  }).join("")}
      </select>
      <button
        id="${ze(i)}"
        type="button"
        class="${ze(qr("stx-shared-select-trigger", e.triggerClassName))}"
        data-tooltip-anchor="shared-select-trigger"
        aria-haspopup="listbox"
        aria-expanded="false"
        aria-controls="${ze(c)}"${Nn(e.triggerAttributes)}
      >
        <span class="${ze(qr("stx-shared-select-trigger-copy", e.labelClassName))}">${Xa(n, o)}</span>
        <span class="stx-shared-select-indicator" aria-hidden="true">
          <svg viewBox="0 0 16 16" fill="none">
            <path d="M4 6.5L8 10.5L12 6.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path>
          </svg>
        </span>
      </button>
      <div
        id="${ze(c)}"
        class="${ze(qr("stx-shared-select-list", e.listClassName))}"
        role="listbox"
        aria-labelledby="${ze(i)}"
        hidden
      >
        ${e.options.map((u, h) => {
    const f = String(u.value ?? "");
    return `
          <div
            class="${ze(qr("stx-shared-select-option", e.optionClassName))}"
            role="option"
            aria-selected="false"
            data-shared-select-option-index="${h}"
            data-shared-select-option-value="${ze(f)}"
            data-shared-select-disabled="${u.disabled ? "true" : "false"}"
          >
            ${Xa(u.label, u.media)}
            <span class="stx-shared-select-option-mark" aria-hidden="true"></span>
          </div>`;
  }).join("")}
      </div>
    </div>
  `;
}
function eg(e) {
  const t = e.trim() || ":root";
  return Of.split("_SCOPE_").join(t);
}
function tg(e, t, r) {
  if (Ge?.root === e) return Ge.list;
  if (r && (!t || r.id === t) || !t) return r;
  const n = document.getElementById(t);
  return n instanceof HTMLElement ? n : r;
}
function Qn(e) {
  const t = e.querySelector("select.stx-shared-select-native"), r = e.querySelector("button.stx-shared-select-trigger"), n = e.querySelector(".stx-shared-select-trigger-copy"), o = tg(e, String(r?.getAttribute("aria-controls") ?? "").trim(), e.querySelector(".stx-shared-select-list"));
  return !t || !r || !n || !o ? null : {
    root: e,
    select: t,
    trigger: r,
    triggerCopy: n,
    list: o
  };
}
function $r(e) {
  return Array.from(e.list.querySelectorAll(".stx-shared-select-option"));
}
function wo(e) {
  const t = e.select.selectedIndex, r = $r(e);
  return t >= 0 && t < r.length ? t : r.findIndex((n) => n.dataset.sharedSelectOptionValue === e.select.value);
}
function Io(e) {
  const t = Number(e.dataset.sharedSelectHighlightIndex ?? "");
  return Number.isFinite(t) ? Math.floor(t) : -1;
}
function Nc(e, t) {
  const r = $r(e)[t];
  if (!r) return;
  const n = e.list.getBoundingClientRect(), o = r.getBoundingClientRect();
  if (o.top < n.top) {
    e.list.scrollTop -= n.top - o.top;
    return;
  }
  o.bottom > n.bottom && (e.list.scrollTop += o.bottom - n.bottom);
}
function Yt(e, t, r) {
  if (Io(e.root) === t) {
    r && t >= 0 && Nc(e, t);
    return;
  }
  $r(e).forEach((n, o) => {
    n.classList.toggle("is-highlighted", o === t);
  }), e.root.dataset.sharedSelectHighlightIndex = String(t), r && t >= 0 && Nc(e, t);
}
function Zd(e) {
  return $r(e).map((t, r) => ({
    item: t,
    index: r
  })).filter(({ item: t }) => t.dataset.sharedSelectDisabled !== "true").map(({ index: t }) => t);
}
function Lc(e, t, r) {
  const n = $r(e), o = Zd(e);
  if (!o.length) return -1;
  if (t < 0) return r > 0 ? o[0] : o[o.length - 1];
  let i = t;
  for (let c = 0; c < n.length; c += 1)
    if (i += r, i < 0 && (i = n.length - 1), i >= n.length && (i = 0), n[i]?.dataset.sharedSelectDisabled !== "true") return i;
  return t;
}
function Ja(e, t) {
  const r = Zd(e);
  return r.length ? t === "start" ? r[0] : r[r.length - 1] : -1;
}
function rg(e) {
  return e.closest("dialog[open]") || document.querySelector("dialog[open]") || document.body;
}
function ng(e) {
  const t = rg(e.root);
  e.list.parentElement !== t && t.appendChild(e.list);
  const r = !e.root.contains(e.list);
  e.list.dataset.sharedSelectDetached = r ? "true" : "false";
}
function Ri(e) {
  e.list.dataset.sharedSelectDetached === "true" && To(e.list);
}
function Ci(e) {
  ng(e);
  const t = e.trigger.getBoundingClientRect(), r = window.innerWidth, n = window.innerHeight, o = Math.max(t.width, 160), i = e.list.scrollHeight, c = Math.min(Math.max(i, 120), 280), u = Math.max(0, n - t.bottom - 8), h = Math.max(0, t.top - 8), f = u < Math.min(c, 180) && h > u, v = Math.max(120, f ? h - 4 : u - 4), x = Math.min(c, v), y = Math.min(Math.max(o, 180), r - 16), S = Math.min(Math.max(8, t.left), Math.max(8, r - y - 8)), _ = f ? Math.max(8, t.top - x - 4) : Math.min(n - x - 8, t.bottom + 4);
  e.list.style.left = `${Math.round(S)}px`, e.list.style.top = `${Math.round(_)}px`, e.list.style.minWidth = `${Math.round(o)}px`, e.list.style.maxWidth = `${Math.round(y)}px`, e.list.style.maxHeight = `${Math.round(Math.max(120, v))}px`, e.root.dataset.sharedSelectPlacement = f ? "top" : "bottom";
}
function sg(e, t) {
  return !e || !t ? !1 : e.root === t.root && e.select === t.select && e.trigger === t.trigger && e.triggerCopy === t.triggerCopy && e.list === t.list;
}
function xr(e) {
  return e.root.isConnected && e.select.isConnected && e.trigger.isConnected && e.triggerCopy.isConnected && e.list.isConnected && e.root.contains(e.select) && e.root.contains(e.trigger) && e.root.contains(e.triggerCopy);
}
function og(e) {
  return e.root.isConnected && e.select.isConnected && e.trigger.isConnected && e.triggerCopy.isConnected && e.root.contains(e.select) && e.root.contains(e.trigger) && e.root.contains(e.triggerCopy);
}
function ag(e) {
  e.list.style.left = "", e.list.style.top = "", e.list.style.minWidth = "", e.list.style.maxWidth = "", e.list.style.maxHeight = "", delete e.root.dataset.sharedSelectPlacement;
}
function ig(e) {
  if (ag(e), og(e)) {
    e.list.parentElement !== e.root && e.root.appendChild(e.list), e.list.dataset.sharedSelectDetached = "false";
    return;
  }
  e.list.isConnected && e.list.remove(), e.list.dataset.sharedSelectDetached = "false";
}
function lg() {
  rn && (window.cancelAnimationFrame(rn), rn = 0), br && (window.cancelAnimationFrame(br), br = 0);
}
function Ir(e, t) {
  if (!e) return;
  const r = sg(Ge, e);
  e.root.classList.remove("is-open"), e.trigger.setAttribute("aria-expanded", "false"), e.list.classList.remove("is-open"), e.list.hidden = !0, e.root.dataset.sharedSelectHighlightIndex = String(wo(e)), ig(e), r && (Ge = null, lg()), t && e.trigger.isConnected && e.trigger.focus();
}
function yr(e) {
  const t = Ge;
  t && (ko("force cleanup open shared select", {
    reason: e,
    selectId: t.select.id,
    rootConnected: t.root.isConnected,
    listConnected: t.list.isConnected
  }), Ir(t, !1));
}
function cg() {
  if (Aa || typeof MutationObserver > "u") return;
  const e = document.body || document.documentElement;
  e && (Aa = new MutationObserver(() => {
    const t = Ge;
    t && (xr(t) || yr("detected disconnected host"));
  }), Aa.observe(e, {
    childList: !0,
    subtree: !0
  }));
}
function Qa() {
  rn || (rn = window.requestAnimationFrame(() => {
    rn = 0;
    const e = Ge;
    if (e) {
      if (!xr(e)) {
        yr("detected disconnected instance during reposition");
        return;
      }
      Ci(e);
    }
  }));
}
function dg() {
  br && window.cancelAnimationFrame(br), br = window.requestAnimationFrame(() => {
    br = 0;
    const e = Ge;
    if (ko("theme refresh frame fired", {
      hasOpenRoot: !!e,
      openRootConnected: !!e?.root?.isConnected
    }), !!e) {
      if (!xr(e)) {
        yr("detected disconnected instance during theme refresh");
        return;
      }
      Ri(e), Qa();
    }
  });
}
function Za(e, t) {
  if (!e) return;
  if (Ge?.root === e) {
    Ir(Ge, t);
    return;
  }
  const r = Qn(e);
  r && Ir(r, t);
}
function Ks(e) {
  Ge && Ge.root !== e && Ir(Ge, !1);
  const t = Qn(e);
  if (!t || t.select.disabled) return;
  const r = wo(t), n = r >= 0 ? r : Ja(t, "start");
  Ge = t, e.classList.add("is-open"), t.list.classList.add("is-open"), t.list.hidden = !1, t.trigger.setAttribute("aria-expanded", "true"), Yt(t, n, !1), Ci(t), Ri(t);
}
function ug(e) {
  if (e.classList.contains("is-open")) {
    Za(e, !0);
    return;
  }
  Ks(e);
}
function Ln(e) {
  const t = Qn(e);
  if (!t) return;
  const r = wo(t), n = t.select.options[r] || t.select.options[0] || null, o = $r(t), i = n?.textContent?.trim() || "", c = Qf(n);
  t.triggerCopy.innerHTML = Xa(i, c), o.forEach((u, h) => {
    const f = h === r;
    u.classList.toggle("is-selected", f), u.setAttribute("aria-selected", f ? "true" : "false");
  }), t.trigger.disabled = t.select.disabled, t.root.dataset.sharedSelectDisabled = t.select.disabled ? "true" : "false", t.root.dataset.sharedSelectHighlightIndex = String(r >= 0 ? r : -1), t.root.classList.contains("is-open") && (Ci(t), Ri(t), Yt(t, Io(t.root), !1));
}
function eu(e, t) {
  const r = e;
  if (ko("commitSharedSelectValue", {
    selectId: e.select.id,
    previousValue: e.select.value,
    nextValue: t
  }), e.select.value === t) {
    Ir(r, !0);
    return;
  }
  e.select.value = t, e.select.dispatchEvent(new Event("input", { bubbles: !0 })), e.select.dispatchEvent(new Event("change", { bubbles: !0 })), Ir(r, !0);
}
function mg(e, t) {
  const r = Qn(e);
  if (!r || r.select.disabled) return;
  const n = e.classList.contains("is-open"), o = Io(e);
  if (t.key === "Tab") {
    n && Za(e, !1);
    return;
  }
  if (t.key === "Escape") {
    if (!n) return;
    t.preventDefault(), Za(e, !0);
    return;
  }
  if (t.key === "ArrowDown") {
    if (t.preventDefault(), !n) {
      Ks(e);
      return;
    }
    Yt(r, Lc(r, o, 1), !0);
    return;
  }
  if (t.key === "ArrowUp") {
    if (t.preventDefault(), !n) {
      Ks(e);
      return;
    }
    Yt(r, Lc(r, o, -1), !0);
    return;
  }
  if (t.key === "Home") {
    if (!n) return;
    t.preventDefault(), Yt(r, Ja(r, "start"), !0);
    return;
  }
  if (t.key === "End") {
    if (!n) return;
    t.preventDefault(), Yt(r, Ja(r, "end"), !0);
    return;
  }
  if (t.key === "Enter" || t.key === " ") {
    if (t.preventDefault(), !n) {
      Ks(e);
      return;
    }
    const i = $r(r)[o];
    if (!i || i.dataset.sharedSelectDisabled === "true") return;
    eu(r, String(i.dataset.sharedSelectOptionValue ?? ""));
  }
}
function hg() {
  Cc || (Cc = !0, cg(), document.addEventListener("pointerdown", (e) => {
    const t = Ge;
    if (!t) return;
    if (!xr(t)) {
      yr("detected disconnected instance during pointerdown");
      return;
    }
    const r = e.target;
    r && (t.root.contains(r) || t.list.contains(r)) || Ir(t, !1);
  }), document.addEventListener("scroll", () => {
    const e = Ge;
    if (e) {
      if (!xr(e)) {
        yr("detected disconnected instance during scroll");
        return;
      }
      Qa();
    }
  }, !0), window.addEventListener("resize", () => {
    const e = Ge;
    if (e) {
      if (!xr(e)) {
        yr("detected disconnected instance during resize");
        return;
      }
      Qa();
    }
  }), Ai(() => {
    const e = Ge;
    if (ko("subscribeTheme fired", {
      hasOpenRoot: !!e,
      openRootConnected: !!e?.root?.isConnected
    }), !!e) {
      if (!xr(e)) {
        yr("detected disconnected instance during theme subscribe");
        return;
      }
      dg();
    }
  }));
}
function tu(e) {
  if (e.dataset.sharedSelectBound === "1") {
    Ln(e);
    return;
  }
  const t = Qn(e);
  t && (e.dataset.sharedSelectBound = "1", hg(), t.trigger.addEventListener("pointerdown", (r) => {
    jr(r);
  }), t.trigger.addEventListener("mousedown", (r) => {
    jr(r);
  }), t.trigger.addEventListener("click", (r) => {
    jr(r), ug(e);
  }), t.trigger.addEventListener("keydown", (r) => {
    mg(e, r);
  }), t.select.addEventListener("input", () => {
    Ln(e);
  }), t.select.addEventListener("change", () => {
    Ln(e);
  }), t.list.addEventListener("pointermove", (r) => {
    const n = r.target?.closest(".stx-shared-select-option");
    if (!n) return;
    const o = Number(n.dataset.sharedSelectOptionIndex ?? "");
    if (!Number.isFinite(o) || n.dataset.sharedSelectDisabled === "true") return;
    const i = Math.floor(o);
    i !== Io(t.root) && Yt(t, i, !1);
  }), t.list.addEventListener("pointerleave", () => {
    Yt(t, wo(t), !1);
  }), t.list.addEventListener("pointerdown", (r) => {
    jr(r);
    const n = r.target?.closest(".stx-shared-select-option");
    !n || n.dataset.sharedSelectDisabled === "true" || r.button === 0 && (r.preventDefault(), eu(t, String(n.dataset.sharedSelectOptionValue ?? "")));
  }), t.list.addEventListener("mousedown", (r) => {
    jr(r);
  }), t.list.addEventListener("click", (r) => {
    jr(r), r.target?.closest(".stx-shared-select-option") && r.preventDefault();
  }), Ln(e));
}
function ru(e) {
  e && e.querySelectorAll('[data-ui="shared-select"]').forEach((t) => {
    tu(t);
  });
}
function Di(e) {
  e && e.querySelectorAll('[data-ui="shared-select"]').forEach((t) => {
    tu(t), Ln(t);
  });
}
function ei(e) {
  return String(e ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function gt(e) {
  return ei(e).replace(/`/g, "&#96;");
}
function $n(...e) {
  return e.filter(Boolean).join(" ");
}
function pg(e) {
  return e ? Object.entries(e).flatMap(([t, r]) => r == null || r === !1 ? [] : r === !0 ? [` ${t}`] : [` ${t}="${gt(String(r))}"`]).join("") : "";
}
function fg(e) {
  const t = ei(e.title), r = e.badgeId && e.badgeText != null ? `<span id="${gt(e.badgeId)}" class="${gt($n("stx-setting-badge", e.badgeClassName))}">${ei(String(e.badgeText))}</span>` : "";
  return `
    <div class="${gt($n("inline-drawer", "stx-setting-shell", e.shellClassName))}"${pg(e.attributes)}>
      <div class="${gt($n("inline-drawer-toggle", "inline-drawer-header", "stx-setting-head", e.headerClassName))}" id="${gt(e.drawerToggleId)}">
        <div class="${gt($n("stx-setting-head-title", e.titleClassName))}">
          <span>${t}</span>
          ${r}
        </div>
        <div
          id="${gt(e.drawerIconId)}"
          class="inline-drawer-icon fa-solid fa-circle-chevron-down down interactable"
          tabindex="0"
          role="button"
        ></div>
      </div>

      <div class="${gt($n("inline-drawer-content", "stx-setting-content", e.contentClassName))}" id="${gt(e.drawerContentId)}" style="display:none;">
        ${e.contentHtml}
      </div>
    </div>
  `;
}
function gg(e) {
  const t = e.trim() || ":root";
  return `
    ${t} .stx-setting-shell {
      width: 100%;
    }

    ${t} .stx-setting-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      min-width: 0;
      cursor: pointer;
      user-select: none;
    }

    ${t} .stx-setting-head-title {
      display: flex;
      align-items: center;
      gap: 6px;
      min-width: 0;
      font-weight: 700;
    }

    ${t} .stx-setting-badge {
      font-size: 11px;
      line-height: 1;
      font-weight: 700;
      letter-spacing: 0.3px;
    }

    ${t} .stx-setting-content {
      display: block;
    }
  `;
}
function Mc(e, t) {
  e instanceof HTMLElement && (e.classList.add("stx-setting-hydrated"), t?.onHydrated?.(e));
}
var vg = "./assets/images/ROLL-LOGO.png", bg = new URL(vg, import.meta.url).href;
function Je(e, t, r, n, o) {
  return Yd({
    id: e,
    title: t,
    description: r,
    checkedLabel: "开启",
    uncheckedLabel: "关闭",
    containerClassName: "st-roll-item st-roll-search-item",
    copyClassName: "st-roll-item-main",
    titleClassName: "st-roll-item-title",
    descriptionClassName: "st-roll-item-desc",
    attributes: {
      "data-st-roll-search": n,
      ...o ? { "data-tip": o } : {}
    }
  });
}
function xg(e) {
  const t = `
        <div class="st-roll-filters flex-container">
          ${je({
    id: e.searchId,
    type: "search",
    className: "flex1",
    attributes: {
      placeholder: "搜索设置",
      "data-tip": "按关键词筛选设置项。"
    }
  })}
        </div>

        <div class="st-roll-tabs">
          <button id="${e.tabMainId}" type="button" class="st-roll-tab is-active" data-tip="查看主设置。">
            <i class="fa-solid fa-gear"></i><span>主设置</span>
          </button>
          <button id="${e.tabSkillId}" type="button" class="st-roll-tab" data-tip="查看技能设置。">
            <i class="fa-solid fa-bolt"></i><span>技能</span>
          </button>
          <button id="${e.tabRuleId}" type="button" class="st-roll-tab" data-tip="查看规则设置。">
            <i class="fa-solid fa-scroll"></i><span>规则</span>
          </button>
          <button id="${e.tabAboutId}" type="button" class="st-roll-tab" data-tip="查看插件信息。">
            <i class="fa-solid fa-circle-info"></i><span>关于</span>
          </button>
        </div>

        <div id="${e.panelMainId}" class="st-roll-panel">
          <div class="st-roll-divider"><i class="fa-solid fa-power-off"></i><span>基础开关</span><div class="st-roll-divider-line"></div></div>

          ${Je(e.enabledId, "启用事件骰子系统", "总开关。关掉后不再做事件检定。", "enable event dice plugin", "事件骰子系统总开关。")}

          <div class="st-roll-item st-roll-search-item" data-st-roll-search="theme ui dark light tavern">
            <div class="st-roll-item-main">
              <div class="st-roll-item-title">界面主题</div>
              <div class="st-roll-item-desc">切换设置界面外观：默认、深色、亮色或酒馆。</div>
            </div>
            <div class="st-roll-row">
              ${Ut({
    id: e.themeId,
    value: "default",
    containerClassName: "stx-shared-select-flex-220",
    options: [
      {
        value: "default",
        label: "默认 UI"
      },
      {
        value: "dark",
        label: "深色 UI"
      },
      {
        value: "light",
        label: "亮色 UI"
      },
      {
        value: "tavern",
        label: "酒馆 UI"
      }
    ]
  })}
            </div>
          </div>

          <div class="st-roll-item st-roll-search-item" data-st-roll-search="scope protagonist all">
            <div class="st-roll-item-main">
              <div class="st-roll-item-title">事件应用范围</div>
              <div class="st-roll-item-desc">选择只处理主角，或处理全部角色。</div>
            </div>
            <div class="st-roll-row">
              ${Ut({
    id: e.scopeId,
    value: "protagonist_only",
    containerClassName: "stx-shared-select-flex-220",
    attributes: { "data-tip": "设置事件作用范围。" },
    options: [{
      value: "protagonist_only",
      label: "仅主角事件"
    }, {
      value: "all",
      label: "全部事件"
    }]
  })}
            </div>
          </div>

          <div class="st-roll-divider"><i class="fa-solid fa-robot"></i><span>AI 协议</span><div class="st-roll-divider-line"></div></div>

          ${Je(e.ruleId, "默认发送规则给 AI", "发送前自动加规则和摘要，减少跑偏。", "auto send rule inject", "发送前自动附加规则。")}

          ${Je(e.aiRollModeId, "允许 AI 决定自动/手动掷骰", "开：AI 可自动掷骰。关：你手动掷骰。", "rollMode auto manual", "让 AI 决定自动或手动掷骰。")}

          ${Je(e.aiRoundControlId, "是否开启持续轮", "开：AI 决定何时结束本轮。关：每次事件都开新轮。", "ai round end round_control end_round", "让 AI 决定何时结束本轮。")}

          ${Je(e.dynamicDcReasonId, "启用动态 DC 解释", "显示这次难度变化的原因。", "dynamic dc reason", "显示难度变化原因。")}

          ${Je(e.statusSystemEnabledId, "启用状态异常系统", "状态会影响后续检定结果。", "status debuff apply remove clear", "开启状态效果。")}

          <div class="st-roll-item st-roll-search-item" data-st-roll-search="status editor">
            <div class="st-roll-item-main">
              <div class="st-roll-item-title">状态编辑器</div>
              <div class="st-roll-item-desc">可手动增删改当前聊天状态。</div>
            </div>
            <div class="st-roll-actions">
              ${me({
    id: e.statusEditorOpenId,
    label: "打开编辑器",
    attributes: { "data-tip": "打开状态编辑器，按当前聊天管理状态。" }
  })}
            </div>
          </div>

          <div class="st-roll-divider"><i class="fa-solid fa-dice"></i><span>掷骰规则</span><div class="st-roll-divider-line"></div></div>

          ${Je(e.explodingEnabledId, "启用爆骰", "满足条件时可追加掷骰。", "explode", "开启爆骰规则。")}

          ${Je(e.advantageEnabledId, "启用优势/劣势", "开启后按优势/劣势取高或取低。", "advantage disadvantage", "开启优势与劣势规则。")}

          ${Je(e.dynamicResultGuidanceId, "启用动态结果引导", "掷骰后给 AI 一句结果提示。", "dynamic result guidance", "给 AI 追加结果提示。")}

          <div class="st-roll-item st-roll-search-item" data-st-roll-search="dice sides allowed">
            <div class="st-roll-item-main">
              <div class="st-roll-item-title">限制 AI 可用骰子面数</div>
              <div class="st-roll-item-desc">AI 只能用这里列出的骰子面数。</div>
            </div>
            <div class="st-roll-row">
              ${je({
    id: e.allowedDiceSidesId,
    attributes: {
      placeholder: "4,6,8,10,12,20,100",
      "data-tip": "限制 AI 可用的骰子面数。"
    }
  })}
            </div>
          </div>

          <div class="st-roll-divider"><i class="fa-solid fa-route"></i><span>剧情分支</span><div class="st-roll-divider-line"></div></div>

          ${Je(e.outcomeBranchesId, "启用剧情走向分支", "成功、失败、爆骰可走不同后果。", "outcome branches", "开启剧情分支结果。")}

          ${Je(e.explodeOutcomeId, "启用爆骰特殊分支", "爆骰时使用专用后果文本。", "explode outcome branch", "开启爆骰专属分支。")}

          ${Je(e.listOutcomePreviewId, "列表卡预览走向", "未掷骰时先预览可能结果。", "list outcome preview", "在列表里预览结果分支。")}

          <div class="st-roll-divider"><i class="fa-solid fa-file-lines"></i><span>摘要注入</span><div class="st-roll-divider-line"></div></div>

          <div class="st-roll-item st-roll-search-item" data-st-roll-search="summary detail mode">
            <div class="st-roll-item-main">
              <div class="st-roll-item-title">摘要信息等级</div>
              <div class="st-roll-item-desc">控制发给 AI 的摘要详细度。</div>
            </div>
            <div class="st-roll-row">
              ${Ut({
    id: e.summaryDetailId,
    value: "minimal",
    containerClassName: "stx-shared-select-flex-220",
    attributes: { "data-tip": "设置摘要详细度。" },
    options: [
      {
        value: "minimal",
        label: "简略"
      },
      {
        value: "balanced",
        label: "平衡"
      },
      {
        value: "detailed",
        label: "详细"
      }
    ]
  })}
            </div>
          </div>

          <div class="st-roll-item st-roll-search-item" data-st-roll-search="summary rounds history">
            <div class="st-roll-item-main">
              <div class="st-roll-item-title">历史轮次数</div>
              <div class="st-roll-item-desc">每次带上最近 N 轮记录。</div>
            </div>
            <div class="st-roll-row">
              ${je({
    id: e.summaryRoundsId,
    type: "number",
    attributes: {
      min: 1,
      max: 10,
      step: 1,
      "data-tip": "设置历史轮次数量。"
    }
  })}
            </div>
          </div>

          ${Je(e.includeOutcomeSummaryId, "摘要包含走向文本", "把本轮结果文本写进摘要。", "summary include outcome", "摘要里带上结果文本。")}

          <div class="st-roll-divider"><i class="fa-solid fa-stopwatch"></i><span>时限控制</span><div class="st-roll-divider-line"></div></div>

          ${Je(e.timeLimitEnabledId, "启用事件时限", "事件有倒计时，超时按失败处理。", "time limit timeout", "开启事件倒计时。")}

          <div id="${e.timeLimitRowId}" class="st-roll-item st-roll-search-item" data-st-roll-search="minimum time limit seconds">
            <div class="st-roll-item-main">
              <div class="st-roll-item-title">最短时限（秒）</div>
              <div class="st-roll-item-desc">AI 给的时限太短时，用这个最小值。</div>
            </div>
            <div class="st-roll-row">
              ${je({
    id: e.timeLimitMinId,
    type: "number",
    attributes: {
      min: 1,
      step: 1,
      "data-tip": "设置最短倒计时秒数。"
    }
  })}
            </div>
          </div>

          <div class="st-roll-tip st-roll-search-item" data-st-roll-search="prompt summary status block">
            发送前会自动加入规则、摘要和状态。
          </div>
        </div>

        <div id="${e.panelAiId}" class="st-roll-panel" hidden>
          <div class="st-roll-divider"><i class="fa-solid fa-robot"></i><span>AI 对接</span><div class="st-roll-divider-line"></div></div>

          <div class="st-roll-item st-roll-search-item" data-st-roll-search="llmhub bridge status online">
            <div class="st-roll-item-main">
              <div class="st-roll-item-title">LLMHub 连接状态</div>
              <div class="st-roll-item-desc">用于确认骰子插件是否被 LLMHub 在线识别。</div>
            </div>
            <div class="st-roll-ai-bridge-status">
              <span id="${e.aiBridgeStatusLightId}" class="st-roll-ai-bridge-light is-offline"></span>
              <span id="${e.aiBridgeStatusTextId}" class="st-roll-ai-bridge-text">未检测</span>
            </div>
          </div>
        </div>

        <div id="${e.panelSkillId}" class="st-roll-panel" hidden>
          <div class="st-roll-divider"><i class="fa-solid fa-bolt"></i><span>技能系统</span><div class="st-roll-divider-line"></div></div>

          ${Je(e.skillEnabledId, "启用技能系统", "关掉后，技能加值不再生效。", "skill system enable", "开启技能系统。")}

          <div class="st-roll-item st-roll-search-item" data-st-roll-search="skill editor modal">
            <div class="st-roll-item-main">
              <div class="st-roll-item-title">技能编辑器</div>
              <div class="st-roll-item-desc">在这里编辑技能预设和加值。</div>
            </div>
            <div class="st-roll-actions">
              ${me({
    id: e.skillEditorOpenId,
    label: "打开编辑器",
    attributes: { "data-tip": "打开技能编辑器，管理技能预设和技能表。" }
  })}
            </div>
          </div>

          <dialog id="${e.skillModalId}" class="st-roll-skill-modal">
            <div class="st-roll-skill-modal-backdrop" data-skill-modal-role="backdrop"></div>
            <div class="st-roll-skill-modal-panel">
              <div class="st-roll-skill-modal-head">
                <div class="st-roll-skill-modal-title"><i class="fa-solid fa-bolt"></i><span>技能编辑器</span></div>
                ${me({
    id: e.skillModalCloseId,
    label: "关闭",
    variant: "secondary",
    className: "st-roll-skill-modal-close",
    attributes: { "data-tip": "关闭技能编辑器。" }
  })}
              </div>

              <div class="st-roll-skill-modal-body">
                <div id="${e.skillPresetLayoutId}" class="st-roll-workbench st-roll-skill-layout">
                  <aside id="${e.skillPresetSidebarId}" class="st-roll-workbench-sidebar st-roll-skill-presets">
                    <div class="st-roll-workbench-toolbar st-roll-workbench-toolbar-sidebar st-roll-skill-preset-toolbar">
                      ${je({
    id: `${e.skillModalId}__preset_search`,
    type: "search",
    className: "st-roll-skill-preset-search flex1",
    attributes: {
      placeholder: "搜索预设",
      "data-tip": "按预设名搜索技能预设。"
    }
  })}
                      ${Ut({
    id: `${e.skillModalId}__preset_sort`,
    value: "recent",
    containerClassName: "stx-shared-select-width-sm",
    selectClassName: "st-roll-skill-preset-sort",
    triggerClassName: "stx-shared-select-trigger-compact",
    triggerAttributes: { "data-tip": "切换预设排序方式" },
    options: [
      {
        value: "recent",
        label: "最近更新"
      },
      {
        value: "name",
        label: "按名称"
      },
      {
        value: "count",
        label: "按技能数"
      }
    ]
  })}
                    </div>

                    <div class="st-roll-workbench-sidebar-head st-roll-skill-presets-head">
                      <div class="st-roll-workbench-sidebar-copy">
                        <span class="st-roll-field-label">技能预设</span>
                        <div id="${e.skillPresetMetaId}" class="st-roll-skill-preset-meta"></div>
                      </div>
                      <div class="st-roll-actions">
                        ${me({
    id: e.skillPresetCreateId,
    label: "新建",
    iconClassName: "fa-solid fa-plus",
    attributes: { "data-tip": "基于当前预设复制并新建一个预设。" }
  })}
                        ${me({
    id: e.skillPresetDeleteId,
    label: "删除",
    variant: "danger",
    iconClassName: "fa-solid fa-trash",
    attributes: { "data-tip": "删除当前技能预设。" }
  })}
                        ${me({
    id: e.skillPresetRestoreDefaultId,
    label: "恢复默认",
    variant: "secondary",
    iconClassName: "fa-solid fa-rotate-left",
    attributes: { "data-tip": "恢复默认技能预设的内置内容。" }
  })}
                      </div>
                    </div>
                    <div id="${e.skillPresetListId}" class="st-roll-skill-preset-list"></div>
                  </aside>

                  <section id="${e.skillEditorWrapId}" class="st-roll-workbench-main st-roll-skill-main">
                    <div class="st-roll-workbench-context st-roll-skill-preset-header">
                      <div class="st-roll-row st-roll-skill-rename-row">
                        <span class="st-roll-field-label">预设名称</span>
                        ${je({
    id: e.skillPresetNameId,
    className: "st-roll-skill-preset-name-input",
    attributes: {
      placeholder: "输入预设名称",
      "data-tip": "修改当前技能预设名称。"
    }
  })}
                        ${me({
    id: e.skillPresetRenameId,
    label: "保存名称",
    variant: "secondary",
    attributes: { "data-tip": "保存当前预设名称。" }
  })}
                      </div>
                      <div class="st-roll-tip">名称必填；修正值必须是整数。支持搜索、排序、批量删除、复制与上下移动。</div>
                    </div>

                    <div class="st-roll-workbench-toolbar st-roll-skill-toolbar">
                      ${je({
    id: `${e.skillModalId}__skill_search`,
    type: "search",
    className: "st-roll-skill-row-search flex1",
    attributes: {
      placeholder: "搜索技能",
      "data-tip": "按技能名筛选当前预设中的技能。"
    }
  })}
                      ${Ut({
    id: `${e.skillModalId}__skill_sort`,
    value: "manual",
    containerClassName: "stx-shared-select-workbench",
    selectClassName: "st-roll-skill-row-sort",
    triggerAttributes: { "data-tip": "切换技能排序方式" },
    options: [
      {
        value: "manual",
        label: "手动顺序"
      },
      {
        value: "name",
        label: "按名称"
      },
      {
        value: "modifier_desc",
        label: "按修正值"
      }
    ]
  })}
                      <span class="st-roll-workbench-selection st-roll-skill-selection-count">已选 0 项</span>
                      ${me({
    label: "全选可见",
    variant: "secondary",
    className: "st-roll-skill-select-visible",
    attributes: { "data-tip": "选中当前筛选结果中的全部技能。" }
  })}
                      ${me({
    label: "清空选择",
    variant: "secondary",
    className: "st-roll-skill-clear-selection",
    attributes: { "data-tip": "取消当前技能选择。" }
  })}
                      ${me({
    label: "批量删除",
    variant: "danger",
    className: "st-roll-skill-batch-delete",
    attributes: { "data-tip": "删除当前已选择的技能。" }
  })}
                    </div>

                    <div id="${e.skillDirtyHintId}" class="st-roll-skill-dirty" hidden>技能改动尚未保存，点击“保存技能表”后生效。</div>
                    <div id="${e.skillErrorsId}" class="st-roll-skill-errors" hidden></div>

                    <div class="st-roll-workbench-toolbar st-roll-workbench-toolbar-main st-roll-skill-head">
                      <div class="st-roll-workbench-head-copy">
                        <span class="st-roll-field-label">技能表</span>
                        <span class="st-roll-workbench-subtitle">按当前预设隔离，支持复制、移动和批量操作。</span>
                      </div>
                      <div class="st-roll-actions">
                        ${me({
    id: e.skillAddId,
    label: "新增技能",
    iconClassName: "fa-solid fa-plus",
    attributes: { "data-tip": "新增一条技能记录。" }
  })}
                        ${me({
    id: e.skillSaveId,
    label: "保存技能表",
    iconClassName: "fa-solid fa-floppy-disk",
    attributes: { "data-tip": "保存当前预设技能表。" }
  })}
                        ${me({
    id: e.skillResetId,
    label: "重置为空",
    variant: "secondary",
    attributes: { "data-tip": "清空当前预设技能草稿。" }
  })}
                        ${me({
    id: e.skillImportToggleId,
    label: "导入 JSON",
    variant: "secondary",
    attributes: { "data-tip": "展开或收起 JSON 导入区域。" }
  })}
                        ${me({
    id: e.skillExportId,
    label: "导出 JSON",
    variant: "secondary",
    attributes: { "data-tip": "导出当前预设技能表 JSON。" }
  })}
                      </div>
                    </div>

                    <div id="${e.skillColsId}" class="st-roll-skill-cols">
                      <span class="st-roll-skill-col-head" data-skill-col-key="name">技能名称<div class="st-roll-skill-col-resizer" data-skill-col-resize-key="name"></div></span>
                      <span class="st-roll-skill-col-head" data-skill-col-key="modifier">修正值<div class="st-roll-skill-col-resizer" data-skill-col-resize-key="modifier"></div></span>
                      <span class="st-roll-skill-col-head" data-skill-col-key="actions">操作<div class="st-roll-skill-col-resizer" data-skill-col-resize-key="actions"></div></span>
                    </div>
                    <div id="${e.skillRowsId}" class="st-roll-skill-rows"></div>

                    <div id="${e.skillImportAreaId}" class="st-roll-skill-import" hidden>
                      <div class="st-roll-row st-roll-workbench-toolbar-main" style="margin-bottom:8px;">
                        <span class="st-roll-field-label">粘贴 JSON 后点击应用</span>
                        <div class="st-roll-actions">
                          ${me({
    id: e.skillImportApplyId,
    label: "应用导入",
    attributes: { "data-tip": "把文本框内的 JSON 解析为技能表。" }
  })}
                        </div>
                      </div>
                      ${je({
    id: e.skillTextId,
    tag: "textarea",
    attributes: {
      rows: 7,
      placeholder: '{"察觉":10,"说服":8}',
      "data-tip": "导入技能表 JSON。"
    }
  })}
                    </div>
                  </section>
                </div>
              </div>
            </div>
          </dialog>
        </div>

        <div id="${e.panelRuleId}" class="st-roll-panel" hidden>
          <div class="st-roll-divider"><i class="fa-solid fa-scroll"></i><span>事件协议规则</span><div class="st-roll-divider-line"></div></div>

          <div class="st-roll-textarea-wrap st-roll-search-item" data-st-roll-search="rule text save reset">
            <div class="st-roll-row" style="margin-bottom:8px;">
              <span class="st-roll-field-label">这里写补充规则。系统基础规则会自动放在前面。</span>
              <div class="st-roll-actions">
                ${me({
    id: e.ruleSaveId,
    label: "保存补充",
    attributes: { "data-tip": "保存补充规则文本。" }
  })}
                ${me({
    id: e.ruleResetId,
    label: "清空补充",
    variant: "secondary",
    attributes: { "data-tip": "清空补充规则文本。" }
  })}
              </div>
            </div>
            ${je({
    id: e.ruleTextId,
    tag: "textarea",
    attributes: {
      rows: 12,
      "data-tip": "编辑补充规则文本。",
      placeholder: `只写额外约束，例如：
1. 场景以潜入风格推进。
2. outcomes 文本避免重复措辞。
3. 优势/劣势触发时加强叙事差异。`
    }
  })}
          </div>
        </div>

        <div id="${e.panelAboutId}" class="st-roll-panel" hidden>
          <div class="st-roll-divider"><i class="fa-solid fa-circle-info"></i><span>关于插件</span><div class="st-roll-divider-line"></div></div>

          <div class="st-roll-item st-roll-search-item st-roll-about-item" data-st-roll-search="about version author email github" style="margin-bottom: 12px; align-items: flex-start;">
            <div class="st-roll-item-main">
              <img class="st-roll-about-logo" src="${bg}" alt="RollHelper Logo" />
              <div class="st-roll-item-title" style="display: flex; align-items: center; justify-content: center;font-size:18px;margin-bottom: 20px;">${e.displayName}</div>
              <div class="st-roll-item-desc st-roll-about-meta">
                <span class="st-roll-about-meta-item">
                  <i class="fa-solid fa-tag"></i>
                  <span>版本：${e.badgeText}</span>
                </span>
                <span class="st-roll-about-meta-item">
                  <i class="fa-solid fa-user"></i>
                  <span>作者：${e.authorText}</span>
                </span>
                <span class="st-roll-about-meta-item">
                  <i class="fa-solid fa-envelope"></i>
                  <span>邮箱：<a href="mailto:${e.emailText}">${e.emailText}</a></span>
                </span>
                <span class="st-roll-about-meta-item">
                  <i class="fa-brands fa-qq"></i>
                  <span>QQ群：${e.qqGroupText}</span>
                </span>
                <span class="st-roll-about-meta-item">
                  <i class="fa-brands fa-github"></i>
                  <span>GitHub：<a href="${e.githubUrl}" target="_blank" rel="noopener">${e.githubText}</a></span>
                </span>
              </div>
            </div>
          </div>

          <div class="st-roll-item st-roll-search-item st-roll-changelog-item" data-st-roll-search="更新日志 版本 历史 修复 新增 优化 调整 文档">
            <div class="st-roll-item-title">更新日志</div>
            ${e.changelogHtml}
          </div>

          <div class="st-roll-item st-roll-search-item" data-st-roll-search="command eventroll roll list help">
            <div class="st-roll-item-main">
              <div class="st-roll-item-title">常用命令</div>
              <div class="st-roll-item-desc">常用命令：/roll 1d20、/eventroll list、/eventroll roll &lt;id&gt;</div>
            </div>
          </div>
        </div>
  `;
  return `
    ${fg({
    drawerToggleId: e.drawerToggleId,
    drawerContentId: e.drawerContentId,
    drawerIconId: e.drawerIconId,
    title: e.displayName,
    badgeId: e.badgeId,
    badgeText: e.badgeText,
    shellClassName: "st-roll-shell",
    headerClassName: "st-roll-head",
    contentClassName: "st-roll-content",
    titleClassName: "st-roll-head-title",
    badgeClassName: "st-roll-head-badge",
    contentHtml: t
  })}

    <dialog id="${e.statusModalId}" class="st-roll-status-modal">
      <div class="st-roll-status-modal-backdrop" data-status-modal-role="backdrop"></div>
      <div class="st-roll-status-modal-panel">
        <div class="st-roll-status-modal-head">
          <div class="st-roll-status-modal-title">
            <i class="fa-solid fa-heart-pulse"></i><span>状态编辑器</span>
          </div>
          ${me({
    id: e.statusModalCloseId,
    label: "关闭",
    variant: "secondary",
    className: "st-roll-status-modal-close",
    attributes: { "data-tip": "关闭状态编辑器。" }
  })}
        </div>
        <div class="st-roll-status-modal-body">
          <div id="${e.statusLayoutId}" class="st-roll-workbench st-roll-status-layout">
            <aside id="${e.statusSidebarId}" class="st-roll-workbench-sidebar st-roll-status-sidebar">
              <div class="st-roll-workbench-toolbar st-roll-workbench-toolbar-sidebar">
                ${je({
    id: `${e.statusModalId}__chat_search`,
    type: "search",
    className: "st-roll-status-chat-search flex1",
    attributes: {
      placeholder: "搜索聊天",
      "data-tip": "按聊天名或聊天 ID 搜索。"
    }
  })}
                ${Ut({
    id: `${e.statusModalId}__chat_source`,
    value: "all",
    containerClassName: "stx-shared-select-fluid stx-shared-select-workbench",
    selectClassName: "st-roll-status-chat-source",
    triggerAttributes: { "data-tip": "按聊天来源筛选。" },
    options: [
      {
        value: "all",
        label: "全部来源"
      },
      {
        value: "current",
        label: "仅当前"
      },
      {
        value: "local",
        label: "仅本地"
      },
      {
        value: "memory",
        label: "仅记忆库"
      }
    ]
  })}
                ${me({
    id: e.statusRefreshId,
    label: "刷新",
    variant: "secondary",
    iconClassName: "fa-solid fa-rotate",
    attributes: { "data-tip": "刷新当前酒馆可见的聊天列表。" }
  })}
                ${me({
    id: e.statusCleanUnusedId,
    label: "清理无用聊天",
    variant: "danger",
    iconClassName: "fa-solid fa-trash",
    attributes: { "data-tip": "根据当前酒馆的聊天列表，清理 RollHelper 本地已无用的聊天状态记录。" }
  })}
              </div>

              <div class="st-roll-workbench-sidebar-head st-roll-status-sidebar-head">
                <div class="st-roll-workbench-sidebar-copy st-roll-status-head-main">
                  <span class="st-roll-field-label">聊天列表</span>
                  <span id="${e.statusMemoryStateId}" class="st-roll-status-memory-state">记忆库：检测中</span>
                </div>
              </div>
              <div id="${e.statusChatListId}" class="st-roll-status-chat-list"></div>
            </aside>
            <div
              id="${e.statusSplitterId}"
              class="st-roll-status-splitter"
              role="separator"
              aria-orientation="vertical"
              aria-label="调整聊天侧栏宽度"
            ></div>
            <section class="st-roll-workbench-main st-roll-status-main">
              <div class="st-roll-status-mobile-sheet-head">
                ${me({
    label: "返回聊天",
    variant: "secondary",
    iconClassName: "fa-solid fa-chevron-left",
    className: "st-roll-status-mobile-back",
    attributes: { "data-tip": "收起当前聊天的状态编辑抽屉。" }
  })}
                <div class="st-roll-status-mobile-sheet-copy">
                  <span class="st-roll-field-label">聊天状态编辑</span>
                </div>
              </div>
              <div class="st-roll-workbench-context st-roll-status-context">
                <div class="st-roll-workbench-head-copy">
                  <span class="st-roll-field-label">状态列表（按聊天隔离）</span>
                  <div id="${e.statusChatMetaId}" class="st-roll-status-chat-meta">未选择聊天</div>
                </div>
                <div class="st-roll-tip">名称必填；修正值必须是整数；按技能时技能列表不能为空。支持搜索、范围筛选、批量启用与批量删除。</div>
              </div>

              <div class="st-roll-workbench-toolbar st-roll-status-toolbar">
                ${je({
    id: `${e.statusModalId}__status_search`,
    type: "search",
    className: "st-roll-status-search flex1",
    attributes: {
      placeholder: "搜索状态",
      "data-tip": "按状态名称搜索当前聊天中的状态。"
    }
  })}
                ${Ut({
    id: `${e.statusModalId}__status_scope`,
    value: "all",
    containerClassName: "stx-shared-select-workbench-compact",
    selectClassName: "st-roll-status-scope-filter",
    triggerAttributes: { "data-tip": "按状态作用范围筛选。" },
    options: [
      {
        value: "all",
        label: "全部范围"
      },
      {
        value: "skills",
        label: "按技能"
      },
      {
        value: "global",
        label: "全局"
      }
    ]
  })}
                <label class="st-roll-inline-toggle" data-tip="只显示当前已启用的状态。">
                  <input type="checkbox" class="st-roll-status-only-enabled" />
                  <span>仅看启用</span>
                </label>
                <span class="st-roll-workbench-selection st-roll-status-selection-count">已选 0 项</span>
                ${me({
    label: "全选可见",
    variant: "secondary",
    iconClassName: "fa-solid fa-check-double",
    className: "st-roll-status-select-visible st-roll-toolbar-icon-btn",
    attributes: { "data-tip": "选中当前筛选结果中的全部状态。" }
  })}
                ${me({
    label: "启用所选",
    variant: "secondary",
    iconClassName: "fa-solid fa-check",
    className: "st-roll-status-batch-enable st-roll-toolbar-icon-btn",
    attributes: { "data-tip": "批量启用当前选择的状态。" }
  })}
                ${me({
    label: "禁用所选",
    variant: "secondary",
    iconClassName: "fa-solid fa-ban",
    className: "st-roll-status-batch-disable st-roll-toolbar-icon-btn",
    attributes: { "data-tip": "批量禁用当前选择的状态。" }
  })}
                ${me({
    label: "删除所选",
    variant: "danger",
    iconClassName: "fa-solid fa-trash",
    className: "st-roll-status-batch-delete st-roll-toolbar-icon-btn",
    attributes: { "data-tip": "删除当前选择的状态。" }
  })}
              </div>

              <div class="st-roll-workbench-toolbar st-roll-workbench-toolbar-main st-roll-status-head">
                <div class="st-roll-workbench-head-copy">
                  <span class="st-roll-field-label">状态表</span>
                  <span class="st-roll-workbench-subtitle">支持复制状态、批量启用/禁用、按范围筛选。</span>
                </div>
                <div class="st-roll-actions">
                  ${me({
    id: e.statusAddId,
    label: "新增状态",
    iconClassName: "fa-solid fa-plus",
    attributes: { "data-tip": "新增一条状态。" }
  })}
                  ${me({
    id: e.statusSaveId,
    label: "保存",
    iconClassName: "fa-solid fa-floppy-disk",
    attributes: { "data-tip": "保存当前聊天的状态表。" }
  })}
                  ${me({
    id: e.statusResetId,
    label: "重置",
    variant: "secondary",
    attributes: { "data-tip": "清空当前聊天的状态草稿。" }
  })}
                </div>
              </div>

              <div id="${e.statusColsId}" class="st-roll-status-cols">
                <span class="st-roll-status-col-head" data-status-col-key="name">名称<div class="st-roll-status-col-resizer" data-status-col-resize-key="name"></div></span>
                <span class="st-roll-status-col-head" data-status-col-key="modifier">修正<div class="st-roll-status-col-resizer" data-status-col-resize-key="modifier"></div></span>
                <span class="st-roll-status-col-head" data-status-col-key="duration">轮次<div class="st-roll-status-col-resizer" data-status-col-resize-key="duration"></div></span>
                <span class="st-roll-status-col-head" data-status-col-key="scope">范围<div class="st-roll-status-col-resizer" data-status-col-resize-key="scope"></div></span>
                <span class="st-roll-status-col-head" data-status-col-key="skills">技能（| 分隔）<div class="st-roll-status-col-resizer" data-status-col-resize-key="skills"></div></span>
                <span class="st-roll-status-col-head" data-status-col-key="enabled">启用<div class="st-roll-status-col-resizer" data-status-col-resize-key="enabled"></div></span>
                <span class="st-roll-status-col-head" data-status-col-key="actions">操作</span>
              </div>
              <div id="${e.statusRowsId}" class="st-roll-status-rows"></div>
              <div class="st-roll-status-footer">
                <div id="${e.statusErrorsId}" class="st-roll-status-errors" hidden></div>
                <div id="${e.statusDirtyHintId}" class="st-roll-status-dirty" hidden>当前聊天有未保存修改。</div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </dialog>
  `;
}
var yg = "_SCOPE_ .stx-shared-box-checkbox{--stx-box-checkbox-size: 16px;--stx-box-checkbox-radius: 4px;--stx-box-checkbox-border: color-mix( in srgb, var(--ss-theme-accent, rgba(197, 160, 89, .9)) 52%, var(--ss-theme-border, rgba(255, 255, 255, .18)) );--stx-box-checkbox-bg: color-mix( in srgb, var(--ss-theme-surface-3, rgba(255, 255, 255, .06)) 92%, transparent );--stx-box-checkbox-hover-border: color-mix( in srgb, var(--ss-theme-accent, rgba(197, 160, 89, .9)) 72%, #fff 10% );--stx-box-checkbox-focus-ring: color-mix( in srgb, var(--ss-theme-accent, rgba(197, 160, 89, .9)) 24%, transparent );--stx-box-checkbox-checked-border: color-mix( in srgb, var(--ss-theme-accent, rgba(197, 160, 89, .9)) 84%, #fff 8% );--stx-box-checkbox-checked-bg: color-mix( in srgb, var(--ss-theme-accent, rgba(197, 160, 89, .9)) 24%, var(--ss-theme-surface-3, rgba(255, 255, 255, .06)) );--stx-box-checkbox-indicator: var( --ss-theme-accent-contrast, rgba(255, 234, 190, .96) );position:relative;display:inline-grid;place-items:center;inline-size:var(--stx-box-checkbox-size);block-size:var(--stx-box-checkbox-size);flex:0 0 auto;cursor:pointer;user-select:none;vertical-align:middle}_SCOPE_ .stx-shared-box-checkbox-input{position:absolute;inset:0;margin:0;opacity:0;cursor:pointer}_SCOPE_ .stx-shared-box-checkbox-control{display:inline-grid;place-items:center;inline-size:100%;block-size:100%;border-radius:var(--stx-box-checkbox-radius);border:1px solid var(--stx-box-checkbox-border);background:var(--stx-box-checkbox-bg);box-shadow:inset 0 1px #ffffff0d;box-sizing:border-box;transition:border-color .18s ease,background-color .18s ease,box-shadow .18s ease,transform .18s ease}_SCOPE_ .stx-shared-box-checkbox-indicator{inline-size:6px;block-size:6px;border-radius:2px;background:var(--stx-box-checkbox-indicator);opacity:0;transform:scale(.45);transition:opacity .18s ease,transform .18s ease,background-color .18s ease}_SCOPE_ .stx-shared-box-checkbox:hover .stx-shared-box-checkbox-control{border-color:var(--stx-box-checkbox-hover-border);box-shadow:inset 0 1px #ffffff14,0 0 0 1px color-mix(in srgb,var(--stx-box-checkbox-hover-border) 24%,transparent)}_SCOPE_ .stx-shared-box-checkbox-input:focus-visible+.stx-shared-box-checkbox-control{border-color:var(--stx-box-checkbox-hover-border);box-shadow:0 0 0 2px var(--stx-box-checkbox-focus-ring),inset 0 1px #ffffff14}_SCOPE_ .stx-shared-box-checkbox-input:checked+.stx-shared-box-checkbox-control{border-color:var(--stx-box-checkbox-checked-border);background:var(--stx-box-checkbox-checked-bg);box-shadow:inset 0 1px #ffffff1a,0 0 0 1px color-mix(in srgb,var(--stx-box-checkbox-checked-border) 20%,transparent)}_SCOPE_ .stx-shared-box-checkbox-input:checked+.stx-shared-box-checkbox-control .stx-shared-box-checkbox-indicator{opacity:1;transform:scale(1)}_SCOPE_ .stx-shared-box-checkbox-input:disabled+.stx-shared-box-checkbox-control{opacity:.58;cursor:not-allowed}";
function Sg(e) {
  return String(e ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function Xr(e) {
  return Sg(e).replace(/`/g, "&#96;");
}
function Ds(...e) {
  return e.filter(Boolean).join(" ");
}
function Oc(e) {
  return e ? Object.entries(e).flatMap(([t, r]) => r == null || r === !1 ? [] : r === !0 ? [` ${t}`] : [` ${t}="${Xr(String(r))}"`]).join("") : "";
}
function nu(e) {
  return `
    <label
      class="${Xr(Ds("stx-shared-box-checkbox", e.containerClassName))}"
      data-ui="shared-box-checkbox"${Oc(e.attributes)}
    >
      <input
        id="${Xr(e.id)}"
        class="${Xr(Ds("stx-shared-box-checkbox-input", e.inputClassName))}"
        type="checkbox"${Oc(e.inputAttributes)}
      />
      <span
        class="${Xr(Ds("stx-shared-box-checkbox-control", e.controlClassName))}"
        aria-hidden="true"
      >
        <span
          class="${Xr(Ds("stx-shared-box-checkbox-indicator", e.indicatorClassName))}"
        ></span>
      </span>
    </label>
  `;
}
function Eg(e) {
  const t = e.trim() || ":root";
  return yg.split("_SCOPE_").join(t);
}
var _g = "_SCOPE_ .stx-changelog{--stx-changelog-scrollbar: color-mix( in srgb, var(--ss-theme-accent, #c5a059) 42%, transparent );--stx-changelog-shell-border: var(--ss-theme-border, rgba(255, 255, 255, .18));--stx-changelog-shell-bg: linear-gradient(180deg, rgba(255, 255, 255, .03), rgba(255, 255, 255, .01)), var(--ss-theme-surface-2, rgba(0, 0, 0, .16));--stx-changelog-shell-shadow: inset 0 1px 0 rgba(255, 255, 255, .04);--stx-changelog-entry-border: color-mix( in srgb, var(--ss-theme-border, rgba(255, 255, 255, .18)) 72%, rgba(255, 255, 255, .1) );--stx-changelog-entry-bg: radial-gradient(circle at top right, color-mix(in srgb, var(--ss-theme-accent, #c5a059) 18%, transparent), transparent 42%), color-mix(in srgb, var(--ss-theme-surface-2, rgba(0, 0, 0, .16)) 84%, rgba(0, 0, 0, .18) 16%);--stx-changelog-version-color: var(--ss-theme-accent-contrast, #fff);--stx-changelog-date-color: var(--ss-theme-text-muted, rgba(255, 255, 255, .62));--stx-changelog-section-border: color-mix( in srgb, var(--ss-theme-border, rgba(255, 255, 255, .18)) 58%, rgba(255, 255, 255, .08) );--stx-changelog-section-bg: color-mix( in srgb, var(--ss-theme-surface-3, rgba(255, 255, 255, .04)) 86%, transparent );--stx-changelog-section-title-color: color-mix( in srgb, var(--ss-theme-text, inherit) 88%, transparent );width:100%;display:flex;flex-direction:column;gap:12px;padding:12px;max-height:400px;overflow-y:auto;border:1px solid var(--stx-changelog-shell-border);border-radius:10px;background:var(--stx-changelog-shell-bg);box-shadow:var(--stx-changelog-shell-shadow)}_SCOPE_ .stx-changelog::-webkit-scrollbar{width:6px}_SCOPE_ .stx-changelog::-webkit-scrollbar-thumb{background:var(--stx-changelog-scrollbar);border-radius:999px}_SCOPE_ .stx-changelog-entry{display:flex;flex-direction:column;gap:10px;padding:12px;border:1px solid var(--stx-changelog-entry-border);border-radius:10px;background:var(--stx-changelog-entry-bg)}_SCOPE_ .stx-changelog-entry-head{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap}_SCOPE_ .stx-changelog-entry-version{display:inline-flex;align-items:center;gap:8px;min-width:0;font-weight:700;color:var(--stx-changelog-version-color)}_SCOPE_ .stx-changelog-entry-version-text{font-size:14px;line-height:1.2}_SCOPE_ .stx-changelog-entry-date{font-size:11px;line-height:1.2;color:var(--stx-changelog-date-color);white-space:nowrap}_SCOPE_ .stx-changelog-sections{display:flex;flex-direction:column;gap:8px}_SCOPE_ .stx-changelog-section{display:flex;flex-direction:column;gap:8px;padding:10px 12px;border:1px solid var(--stx-changelog-section-border);border-radius:9px;background:var(--stx-changelog-section-bg)}_SCOPE_ .stx-changelog-section-head{display:inline-flex;align-items:center;gap:8px;min-width:0}_SCOPE_ .stx-changelog-section-badge{display:inline-flex;align-items:center;gap:6px;padding:4px 10px;border-radius:999px;font-size:11px;line-height:1;font-weight:700;letter-spacing:.2px;border:1px solid currentColor;white-space:nowrap}_SCOPE_ .stx-changelog-section-title{font-size:12px;line-height:1.4;color:var(--stx-changelog-section-title-color)}_SCOPE_ .stx-changelog-section-list{margin:0;padding-left:18px;display:flex;flex-direction:column;gap:6px}_SCOPE_ .stx-changelog-section-item{font-size:12px;line-height:1.55;color:var(--ss-theme-text, inherit)}_SCOPE_ .stx-changelog-empty{display:flex;align-items:center;justify-content:center;min-height:96px;text-align:center;color:var(--ss-theme-text-muted, rgba(255, 255, 255, .72))}_SCOPE_ .stx-changelog-section.is-added .stx-changelog-section-badge{color:#77d28b;background:#286e3f2e}_SCOPE_ .stx-changelog-section.is-fixed .stx-changelog-section-badge{color:#ff8d8d;background:#7a28282e}_SCOPE_ .stx-changelog-section.is-improved .stx-changelog-section-badge{color:#8ec7ff;background:#1f56852e}_SCOPE_ .stx-changelog-section.is-changed .stx-changelog-section-badge{color:#e9c07b;background:#6e4a1b2e}_SCOPE_ .stx-changelog-section.is-docs .stx-changelog-section-badge{color:#c7b7ff;background:#4e3a862e}_SCOPE_ .stx-changelog-section.is-other .stx-changelog-section-badge{color:#d4d4d4;background:#6969692e}_SCOPE_ [data-ss-theme=light] .stx-changelog,_SCOPE_[data-ss-theme=light] .stx-changelog{--stx-changelog-scrollbar: color-mix( in srgb, var(--ss-theme-accent, #2f6ee5) 26%, var(--ss-theme-border-strong, #8eaed9) 74% );--stx-changelog-shell-border: color-mix( in srgb, var(--ss-theme-border, #c6d1e2) 86%, white 14% );--stx-changelog-shell-bg: linear-gradient(180deg, rgba(255, 255, 255, .84), rgba(244, 248, 255, .98)), var(--ss-theme-surface-2, #eef3fa);--stx-changelog-shell-shadow: inset 0 1px 0 rgba(255, 255, 255, .72), 0 8px 22px rgba(186, 198, 216, .22);--stx-changelog-entry-border: color-mix( in srgb, var(--ss-theme-border-strong, #8eaed9) 48%, white 30% );--stx-changelog-entry-bg: radial-gradient(circle at top right, rgba(47, 110, 229, .08), transparent 44%), linear-gradient(180deg, rgba(255, 255, 255, .84), rgba(246, 250, 255, .96));--stx-changelog-version-color: color-mix( in srgb, var(--ss-theme-accent, #2f6ee5) 72%, var(--ss-theme-text, #1f2834) 28% );--stx-changelog-date-color: color-mix( in srgb, var(--ss-theme-text, #1f2834) 76%, transparent );--stx-changelog-section-border: color-mix( in srgb, var(--ss-theme-border, #c6d1e2) 88%, white 12% );--stx-changelog-section-bg: linear-gradient(180deg, rgba(255, 255, 255, .76), rgba(248, 251, 255, .94));--stx-changelog-section-title-color: color-mix( in srgb, var(--ss-theme-text, #1f2834) 94%, transparent )}_SCOPE_ [data-ss-theme=light] .stx-changelog-section.is-added .stx-changelog-section-badge,_SCOPE_[data-ss-theme=light] .stx-changelog-section.is-added .stx-changelog-section-badge{color:#2d8a57;background:#58c47924}_SCOPE_ [data-ss-theme=light] .stx-changelog-section.is-fixed .stx-changelog-section-badge,_SCOPE_[data-ss-theme=light] .stx-changelog-section.is-fixed .stx-changelog-section-badge{color:#c24b4b;background:#ef757524}_SCOPE_ [data-ss-theme=light] .stx-changelog-section.is-improved .stx-changelog-section-badge,_SCOPE_[data-ss-theme=light] .stx-changelog-section.is-improved .stx-changelog-section-badge{color:#2f6ee5;background:#2f6ee51f}_SCOPE_ [data-ss-theme=light] .stx-changelog-section.is-changed .stx-changelog-section-badge,_SCOPE_[data-ss-theme=light] .stx-changelog-section.is-changed .stx-changelog-section-badge{color:#9e6914;background:#dfab4a29}_SCOPE_ [data-ss-theme=light] .stx-changelog-section.is-docs .stx-changelog-section-badge,_SCOPE_[data-ss-theme=light] .stx-changelog-section.is-docs .stx-changelog-section-badge{color:#6b57cb;background:#8169e41f}_SCOPE_ [data-ss-theme=light] .stx-changelog-section.is-other .stx-changelog-section-badge,_SCOPE_[data-ss-theme=light] .stx-changelog-section.is-other .stx-changelog-section-badge{color:#5c6878;background:#78849424}@media (max-width: 768px){_SCOPE_ .stx-changelog{max-height:240px;padding:10px;gap:10px}_SCOPE_ .stx-changelog-entry{padding:10px}_SCOPE_ .stx-changelog-section{padding:9px 10px}}", Pc = {
  added: {
    label: "新增",
    iconClassName: "fa-solid fa-sparkles",
    className: "is-added"
  },
  fixed: {
    label: "修复",
    iconClassName: "fa-solid fa-bug",
    className: "is-fixed"
  },
  improved: {
    label: "优化",
    iconClassName: "fa-solid fa-wand-magic-sparkles",
    className: "is-improved"
  },
  changed: {
    label: "调整",
    iconClassName: "fa-solid fa-sliders",
    className: "is-changed"
  },
  docs: {
    label: "文档",
    iconClassName: "fa-solid fa-book-open",
    className: "is-docs"
  },
  other: {
    label: "更新",
    iconClassName: "fa-solid fa-layer-group",
    className: "is-other"
  }
};
function pr(e) {
  return String(e ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function Ns(e) {
  return pr(e).replace(/`/g, "&#96;");
}
function Tg(...e) {
  return e.filter(Boolean).join(" ");
}
function su(e) {
  return Array.isArray(e) ? e.map((t) => String(t ?? "").trim()).filter((t) => t.length > 0) : [];
}
function kg(e) {
  const t = String(e ?? "").trim().toLowerCase();
  return t === "added" || t === "fixed" || t === "improved" || t === "changed" || t === "docs" ? t : "other";
}
function wg(e) {
  return Pc[e] ?? Pc.other;
}
function Ig(e) {
  const t = su(e.items);
  if (t.length === 0) return null;
  const r = kg(e.type), n = wg(r);
  return {
    type: r,
    title: String(e.title ?? "").trim() || n.label,
    items: t,
    badgeText: n.label,
    iconClassName: n.iconClassName,
    className: n.className
  };
}
function Ag(e) {
  const t = String(e.version ?? "").trim(), r = String(e.date ?? "").trim(), n = (Array.isArray(e.sections) ? e.sections ?? [] : [{
    type: "other",
    title: "更新",
    items: su(e.changes)
  }]).map((o) => Ig(o)).filter((o) => o !== null);
  return !t && !r && n.length === 0 ? null : {
    version: t || "未命名版本",
    date: r,
    sections: n
  };
}
function $g(e) {
  return Array.isArray(e) ? e.map((t) => Ag(t)).filter((t) => t !== null) : [];
}
function Rg(e, t) {
  const r = $g(e), n = Tg("stx-changelog", t?.containerClassName);
  if (r.length === 0) return `<div class="${Ns(n)} stx-changelog-empty">${pr(t?.emptyText ?? "暂无更新记录")}</div>`;
  const o = r.map((i) => {
    const c = i.sections.map((u) => {
      const h = u.items.map((v) => `<li class="stx-changelog-section-item">${pr(v)}</li>`).join(""), f = u.title !== u.badgeText;
      return `
            <section class="stx-changelog-section ${Ns(u.className)}">
              <div class="stx-changelog-section-head">
                <span class="stx-changelog-section-badge">
                  <i class="${Ns(u.iconClassName)}" aria-hidden="true"></i>
                  <span>${pr(u.badgeText)}</span>
                </span>
                ${f ? `<span class="stx-changelog-section-title">${pr(u.title)}</span>` : ""}
              </div>
              <ul class="stx-changelog-section-list">${h}</ul>
            </section>
          `;
    }).join("");
    return `
        <article class="stx-changelog-entry">
          <header class="stx-changelog-entry-head">
            <div class="stx-changelog-entry-version">
              <i class="fa-solid fa-code-branch" aria-hidden="true"></i>
              <span class="stx-changelog-entry-version-text">${pr(i.version)}</span>
            </div>
            ${i.date ? `<span class="stx-changelog-entry-date">${pr(i.date)}</span>` : ""}
          </header>
          <div class="stx-changelog-sections">${c}</div>
        </article>
      `;
  }).join("");
  return `<div class="${Ns(n)}" data-ui="shared-changelog">${o}</div>`;
}
function Cg(e) {
  const t = e.trim() || ":root";
  return _g.split("_SCOPE_").join(t);
}
function Dg(e) {
  return `
    ${gg(`#${e}`)}
    ${Cg(`#${e}`)}

    #${e} {
      margin-bottom: 5px;
      color: inherit;
    }


    ${Xf(`#${e} .st-roll-content, #${e} .st-roll-skill-modal, #${e} .st-roll-status-modal`)}

    #${e} .st-roll-shell {
      border: 0;
      border-radius: 0;
      overflow: visible;
      background: transparent;
      backdrop-filter: none;
    }

    #${e} .st-roll-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      min-width: 0;
      cursor: pointer;
      user-select: none;
    }

    #${e} .st-roll-head-title {
      display: flex;
      align-items: center;
      gap: 6px;
      font-weight: 700;
    }

    #${e} .st-roll-head-badge {
      color: inherit;
      opacity: 0.8;
      font-size: 0.8em;
      font-weight: 500;
      letter-spacing: 0.02em;
    }

    #${e} .st-roll-head .inline-drawer-icon {
      transition: transform 0.2s ease;
    }

    #${e} .st-roll-content {
      border-top: 1px solid var(--ss-theme-border);
      padding: 10px;
      display: block;
      color: var(--ss-theme-text);
      background: var(--ss-theme-surface-2);
    }

    #${e} .st-roll-filters {
      margin-bottom: 10px;
      gap: 8px;
    }

    #${e} .st-roll-search {
      min-height: 32px;
      transition: border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
    }

    #${e} .st-roll-search-item.is-hidden-by-search {
      display: none !important;
    }

    #${e} .st-roll-tabs {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 4px;
      border: 1px solid var(--ss-theme-border);
      border-radius: 999px;
      margin-bottom: 10px;
      background: var(--ss-theme-surface-2);
    }

    #${e} .st-roll-tab {
      flex: 1;
      border: 0;
      border-radius: 999px;
      background: transparent;
      color: inherit;
      padding: 6px 10px;
      font-size: 12px;
      line-height: 1.2;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      opacity: 0.75;
      transition:
        background-color 0.2s ease,
        opacity 0.2s ease,
        box-shadow 0.2s ease;
    }

    #${e} .st-roll-tab.is-active {
      opacity: 1;
      color: var(--ss-theme-text);
      background: var(--ss-theme-list-item-active-bg);
    }

    #${e} .st-roll-panel {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    #${e} .st-roll-panel[hidden] {
      display: none !important;
    }

    #${e} .st-roll-divider {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 8px;
      margin-bottom: 6px;
      font-size: 13px;
      font-weight: 700;
      opacity: 0.95;
    }

    #${e} .st-roll-divider-line {
      flex: 1;
      height: 1px;
      background: var(--ss-theme-border);
    }

    #${e} .st-roll-item {
      border: 1px solid var(--ss-theme-border);
      border-radius: 10px;
      padding: 12px;
      margin: 2px 0;
      background: var(--ss-theme-surface-2);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      transition:
        border-color 0.2s ease,
        background-color 0.2s ease,
        box-shadow 0.2s ease;
    }

    #${e} .st-roll-item-stack {
      flex-direction: column;
      align-items: stretch;
    }

    #${e} .st-roll-item-main {
      min-width: 0;
      flex: 1;
    }

    #${e} .st-roll-item-title {
      font-size: 14px;
      font-weight: 700;
      margin-bottom: 5px;
    }

    #${e} .st-roll-item-desc {
      font-size: 11px;
      line-height: 1.45;
      opacity: 0.7;
    }

    #${e} .st-roll-ai-bridge-status {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      flex-shrink: 0;
      font-size: 12px;
      opacity: 0.9;
    }

    #${e} .st-roll-ai-bridge-light {
      width: 9px;
      height: 9px;
      border-radius: 50%;
      background: #d75a5a;
      box-shadow: 0 0 0 3px rgba(215, 90, 90, 0.18);
    }

    #${e} .st-roll-ai-bridge-light.is-online {
      background: #57d36a;
      box-shadow: 0 0 0 3px rgba(87, 211, 106, 0.2);
    }

    #${e} .st-roll-ai-bridge-light.is-checking {
      background: #d7bf5a;
      box-shadow: 0 0 0 3px rgba(215, 191, 90, 0.2);
    }


    #${e} .st-roll-about-meta {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 6px 24px;
      width: 100%;
      min-width: 0;
    }

    #${e} .st-roll-about-meta-item {
      display: inline-flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 6px;
      min-width: 0;
      max-width: 100%;
      white-space: normal;
    }

    #${e} .st-roll-about-meta-item > span {
      min-width: 0;
      overflow-wrap: anywhere;
      word-break: break-word;
    }

    #${e} .st-roll-about-meta-item i {
      width: 14px;
      text-align: center;
      opacity: 0.86;
    }

    #${e} .st-roll-about-meta a {
      color: inherit;
      text-decoration: none;
      border-bottom: 1px dashed rgba(255, 255, 255, 0.22);
      overflow-wrap: anywhere;
      word-break: break-word;
      transition: border-color 0.2s ease, text-shadow 0.2s ease;
    }

    #${e} .st-roll-about-meta a:hover {
      border-bottom-color: rgba(255, 255, 255, 0.5);
      text-shadow: 0 0 8px rgba(255, 255, 255, 0.22);
    }

    #${e} .st-roll-about-item {
      display: block;
    }

    #${e} .st-roll-about-logo {
      display: block;
      width: min(240px, 100%);
      height: auto;
      margin: 0 auto 14px;
      object-fit: contain;
    }

    #${e} .st-roll-inline {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-shrink: 0;
    }

    #${e} .st-roll-row {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 10px;
      flex-wrap: wrap;
    }

    #${e} .st-roll-field-label {
      font-size: 13px;
      opacity: 0.85;
      flex: 1;
    }

    #${e} .st-roll-input {
      width: 120px;
    }

    #${e} .st-roll-item.is-disabled {
      opacity: 0.52;
    }

    #${e} .st-roll-actions {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: nowrap; 
      overflow: visible; 
    }

    #${e} .st-roll-btn {
      flex-shrink: 0;
    }

    #${e} .st-roll-btn {
      cursor: pointer;
      padding: 4px 10px;
      border-radius: 7px;
      border: 1px solid rgba(197, 160, 89, 0.45);
      background: rgba(197, 160, 89, 0.14);
      color: inherit;
      font-size: 12px;
      transition:
        border-color 0.2s ease,
        background-color 0.2s ease,
        box-shadow 0.2s ease;
    }

    #${e} .st-roll-btn.secondary {
      border-color: rgba(255, 255, 255, 0.2);
      background: rgba(255, 255, 255, 0.08);
    }

    #${e} .st-roll-textarea-wrap {
      border: 1px solid rgba(255, 255, 255, 0.18);
      border-radius: 10px;
      background: rgba(0, 0, 0, 0.15);
      padding: 10px;
      transition: border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
    }

    #${e} .st-roll-changelog-item {
      flex-direction: column;
      align-items: stretch;
      gap: 10px;
      margin-bottom: 12px;
    }

    #${e} .st-roll-skill-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      margin-top: 8px;
      margin-bottom: 8px;
      flex-wrap: wrap;
    }

    #${e} .st-roll-skill-cols {
      display: grid;
      grid-template-columns:
        var(--st-roll-skill-col-name)
        var(--st-roll-skill-col-modifier)
        var(--st-roll-skill-col-actions);
      gap: 10px;
      font-size: 12px;
      font-weight: 700;
      opacity: 0.72;
      margin-bottom: 4px;
      padding: 0 2px;
      align-items: center;
      min-width: calc(var(--st-roll-skill-col-name) + var(--st-roll-skill-col-modifier) + var(--st-roll-skill-col-actions) + 20px);
    }

    #${e} .st-roll-skill-col-head {
      position: relative;
      display: block;
      min-width: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      padding-right: 8px;
    }

    #${e} .st-roll-skill-col-head[data-skill-col-key="modifier"],
    #${e} .st-roll-skill-col-head[data-skill-col-key="actions"] {
      text-align: center;
    }

    #${e} .st-roll-skill-col-resizer {
      position: absolute;
      top: 0;
      right: -4px;
      bottom: 0;
      width: 8px;
      cursor: col-resize;
      user-select: none;
      background: transparent;
    }

    #${e} .st-roll-skill-col-resizer::before {
      content: "";
      position: absolute;
      top: 14%;
      bottom: 14%;
      left: 50%;
      width: 1px;
      transform: translateX(-50%);
      background: rgba(255, 255, 255, 0.24);
    }

    #${e} .st-roll-skill-col-resizer:hover,
    #${e} .st-roll-skill-col-resizer.is-resizing {
      background: rgba(197, 160, 89, 0.55);
    }

    #${e} .st-roll-skill-col-resizer:hover::before,
    #${e} .st-roll-skill-col-resizer.is-resizing::before {
      background: rgba(255, 236, 201, 0.72);
    }

    #${e} .st-roll-skill-rows {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    #${e} .st-roll-skill-row {
      display: grid;
      grid-template-columns:
        var(--st-roll-skill-col-name)
        var(--st-roll-skill-col-modifier)
        var(--st-roll-skill-col-actions);
      gap: 10px;
      align-items: center;
      min-width: calc(var(--st-roll-skill-col-name) + var(--st-roll-skill-col-modifier) + var(--st-roll-skill-col-actions) + 20px);
    }

    #${e} .st-roll-skill-name,
    #${e} .st-roll-skill-modifier {
      width: 100%;
    }

    #${e} .st-roll-skill-modifier {
      text-align: center;
      justify-self: stretch;
    }

    #${e} .st-roll-skill-remove {
      padding-left: 0;
      padding-right: 0;
    }

    #${e} .st-roll-skill-empty {
      border: 1px dashed rgba(255, 255, 255, 0.22);
      border-radius: 8px;
      padding: 10px;
      text-align: center;
      font-size: 12px;
      opacity: 0.7;
      background: rgba(255, 255, 255, 0.03);
    }

    #${e} .st-roll-skill-errors {
      border: 1px solid rgba(255, 110, 110, 0.45);
      border-radius: 8px;
      padding: 8px 10px;
      background: rgba(120, 20, 20, 0.22);
      margin-top: 8px;
      margin-bottom: 8px;
    }

    #${e} .st-roll-skill-error-item {
      font-size: 12px;
      line-height: 1.45;
      color: #ffd2d2;
    }

    #${e} .st-roll-skill-dirty {
      margin-top: 8px;
      margin-bottom: 2px;
      font-size: 12px;
      line-height: 1.4;
      color: #ffe0a6;
    }

    #${e} .st-roll-skill-import {
      margin-top: 10px;
      padding-top: 10px;
      border-top: 1px dashed rgba(255, 255, 255, 0.22);
    }

    #${e} .st-roll-skill-modal {
      position: fixed;
      inset: 0;
      z-index: 32000;
      border: 0;
      padding: 0;
      margin: 0;
      width: 100vw;
      height: 100vh;
      max-width: none;
      max-height: none;
      background: transparent;
    }

    #${e} .st-roll-skill-modal:not([open]) {
      display: none !important;
    }

    #${e} .st-roll-skill-modal[open] {
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }

    #${e} .st-roll-skill-modal::backdrop {
      background: var(--ss-theme-backdrop);
      backdrop-filter: var(--ss-theme-backdrop-filter);
    }

    #${e} .st-roll-skill-modal-backdrop {
      position: absolute;
      inset: 0;
      background: color-mix(in srgb, var(--ss-theme-backdrop) 55%, transparent);
      backdrop-filter: var(--ss-theme-backdrop-filter);
    }

    #${e} .st-roll-skill-modal-panel {
      position: relative;
      z-index: 1;
      display: flex;
      flex-direction: column;
      width: min(1460px, 96vw);
      height: min(96vh, 920px);
      margin: 0;
      border: 1px solid var(--ss-theme-panel-border);
      border-radius: 14px;
      overflow: hidden;
      background: var(--ss-theme-panel-bg);
      box-shadow: var(--ss-theme-panel-shadow);
      --st-roll-skill-col-name: 280px;
      --st-roll-skill-col-modifier: 84px;
      --st-roll-skill-col-actions: 124px;
    }

    #${e} .st-roll-skill-modal-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      padding: 12px 14px;
      border-bottom: 1px solid var(--ss-theme-border);
      background: var(--ss-theme-toolbar-bg);
    }

    #${e} .st-roll-skill-modal-title {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      font-weight: 700;
    }

    #${e} .st-roll-skill-modal-close {
      min-width: 72px;
    }

    #${e} .st-roll-skill-modal-body {
      flex: 1;
      min-height: 0;
      overflow: auto;
      padding: 12px;
    }

    #${e} .st-roll-skill-layout {
      display: grid;
      grid-template-columns: minmax(220px, 280px) 1fr;
      gap: 10px;
      align-items: start;
    }

    #${e} .st-roll-skill-presets {
      border: 1px solid rgba(255, 255, 255, 0.18);
      border-radius: 10px;
      background: rgba(0, 0, 0, 0.16);
      padding: 10px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      min-height: 260px;
    }

    #${e} .st-roll-skill-presets-head {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    #${e} .st-roll-skill-preset-meta {
      min-height: 24px;
      font-size: 12px;
      line-height: 1.4;
      opacity: 0.78;
    }

    #${e} .st-roll-skill-preset-toolbar {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      align-items: center;
      gap: 8px;
    }

    #${e} .st-roll-skill-preset-toolbar .st-roll-skill-preset-search {
      width: 100%;
      min-width: 0;
    }

    #${e} .st-roll-skill-preset-list {
      display: flex;
      flex-direction: column;
      gap: 6px;
      max-height: 360px;
      overflow: auto;
      padding-right: 2px;
    }

    #${e} .st-roll-skill-preset-item {
      width: 100%;
      border: 1px solid rgba(255, 255, 255, 0.16);
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.04);
      color: inherit;
      padding: 8px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 6px;
      min-width: 0;
      cursor: pointer;
      font-size: 12px;
      line-height: 1.35;
      transition: border-color 0.2s ease, background-color 0.2s ease, box-shadow 0.2s ease;
    }

    #${e} .st-roll-skill-preset-item:hover {
      border-color: rgba(197, 160, 89, 0.58);
      background: rgba(197, 160, 89, 0.18);
    }

    #${e} .st-roll-skill-preset-item.is-active {
      border-color: rgba(197, 160, 89, 0.68);
      background: rgba(197, 160, 89, 0.24);
      box-shadow:
        0 0 0 1px rgba(197, 160, 89, 0.26),
        0 0 14px rgba(197, 160, 89, 0.18);
    }

    #${e} .st-roll-skill-preset-name-marquee {
      display: block;
      flex: 1 1 auto;
      min-width: 0;
      max-width: 100%;
      overflow: hidden;
    }

    #${e} .st-roll-skill-preset-name-marquee.is-overflowing {
      mask-image: linear-gradient(90deg, transparent 0, #000 6%, #000 94%, transparent 100%);
      -webkit-mask-image: linear-gradient(90deg, transparent 0, #000 6%, #000 94%, transparent 100%);
    }

    #${e} .st-roll-skill-preset-name-track {
      display: inline-flex;
      align-items: center;
      min-width: max-content;
      width: max-content;
      max-width: none;
      transform: translateX(0);
      will-change: transform;
    }

    #${e} .st-roll-skill-preset-name-marquee.is-overflowing .st-roll-skill-preset-name-track {
      animation: st-roll-skill-preset-marquee var(--st-roll-preset-marquee-duration, 8s) ease-in-out infinite alternate;
    }

    #${e} .st-roll-skill-preset-name {
      display: inline-flex;
      align-items: center;
      min-width: max-content;
      white-space: nowrap;
      text-align: left;
      font-weight: 700;
    }

    #${e} .st-roll-skill-preset-tags {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      flex-shrink: 0;
    }

    #${e} .st-roll-skill-preset-tag {
      display: inline-flex;
      align-items: center;
      height: 18px;
      padding: 0 6px;
      border-radius: 999px;
      font-size: 11px;
      opacity: 0.88;
      border: 1px solid rgba(255, 255, 255, 0.2);
      background: rgba(255, 255, 255, 0.08);
    }

    #${e} .st-roll-skill-preset-tag.active {
      border-color: rgba(197, 160, 89, 0.55);
      background: rgba(197, 160, 89, 0.24);
    }

    #${e} .st-roll-skill-preset-tag.locked {
      border-color: rgba(84, 196, 255, 0.45);
      background: rgba(84, 196, 255, 0.2);
    }

    @keyframes st-roll-skill-preset-marquee {
      0% {
        transform: translateX(0);
      }

      12% {
        transform: translateX(0);
      }

      88% {
        transform: translateX(var(--st-roll-preset-marquee-distance, 0px));
      }

      100% {
        transform: translateX(var(--st-roll-preset-marquee-distance, 0px));
      }
    }

    #${e} .st-roll-skill-rename-row {
      justify-content: flex-start;
      gap: 8px;
      flex-wrap: wrap;
    }

    #${e} .st-roll-skill-preset-name-input {
      width: min(280px, 100%);
    }

    #${e} .st-roll-skill-preset-empty {
      border: 1px dashed rgba(255, 255, 255, 0.2);
      border-radius: 8px;
      padding: 10px;
      text-align: center;
      font-size: 12px;
      opacity: 0.7;
      background: rgba(255, 255, 255, 0.03);
    }

    #${e} .st-roll-status-modal {
      position: fixed;
      inset: 0;
      z-index: 32000;
      border: 0;
      padding: 0;
      margin: 0;
      width: 100vw;
      height: 100vh;
      max-width: none;
      max-height: none;
      background: transparent;
    }

    #${e} .st-roll-status-modal:not([open]) {
      display: none !important;
    }

    #${e} .st-roll-status-modal[open] {
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }

    #${e} .st-roll-status-modal::backdrop {
      background: var(--ss-theme-backdrop);
      backdrop-filter: var(--ss-theme-backdrop-filter);
    }

    #${e} .st-roll-status-modal-backdrop {
      position: absolute;
      inset: 0;
      background: color-mix(in srgb, var(--ss-theme-backdrop) 70%, transparent);
      backdrop-filter: var(--ss-theme-backdrop-filter);
      opacity: 1;
      transition: opacity 0.24s ease;
    }

    #${e} .st-roll-skill-modal[data-ss-theme="host"] .st-roll-skill-modal-backdrop,
    #${e} .st-roll-status-modal[data-ss-theme="host"] .st-roll-status-modal-backdrop {
      background: color-mix(in srgb, var(--ss-theme-backdrop) 55%, transparent);
      backdrop-filter: var(--ss-theme-backdrop-filter);
    }

    #${e} .st-roll-status-modal-panel {
      position: relative;
      z-index: 1;
      display: flex;
      flex-direction: column;
      width: max(1220px, 90vw);
      height: max(85vh, 860px);
      margin: 0;
      border: 1px solid var(--ss-theme-panel-border);
      border-radius: 14px;
      overflow: hidden;
      background: var(--ss-theme-panel-bg);
      box-shadow: var(--ss-theme-panel-shadow);
      --st-roll-status-sidebar-width: 300px;
      --st-roll-status-col-name: 180px;
      --st-roll-status-col-modifier: 96px;
      --st-roll-status-col-duration: 110px;
      --st-roll-status-col-scope: 110px;
      --st-roll-status-col-skills: 1fr;
      --st-roll-status-col-enabled: 96px;
      --st-roll-status-col-actions: 84px;
    }

    #${e} .st-roll-status-modal-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      padding: 12px 14px;
      border-bottom: 1px solid var(--ss-theme-border);
      background: var(--ss-theme-toolbar-bg);
    }

    #${e} .st-roll-status-modal-title {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      font-weight: 700;
    }

    #${e} .st-roll-status-modal-close {
      min-width: 72px;
    }

    #${e} .st-roll-status-modal-body {
      flex: 1;
      min-height: 0;
      overflow: hidden;
      padding: 12px;
      display: flex;
    }

    #${e} .st-roll-status-layout {
      display: grid;
      grid-template-columns: var(--st-roll-status-sidebar-width) 8px minmax(0, 1fr);
      min-height: 0;
      height: 100%;
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 10px;
      overflow: hidden;
      background: rgba(0, 0, 0, 0.18);
      flex: 1;
    }

    #${e} .st-roll-status-sidebar {
      min-width: 180px;
      border-right: 1px solid rgba(255, 255, 255, 0.12);
      background: rgba(0, 0, 0, 0.26);
      display: flex;
      flex-direction: column;
      min-height: 0;
    }

    #${e} .st-roll-status-sidebar-head {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 8px;
      padding: 10px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      background: rgba(255, 255, 255, 0.03);
    }

    #${e} .st-roll-status-memory-state {
      font-size: 11px;
      opacity: 0.82;
      white-space: normal;
      overflow-wrap: anywhere;
      word-break: break-word;
      line-height: 1.35;
      max-width: 100%;
      flex: 1 1 100%;
    }

    #${e} .st-roll-status-chat-list {
      display: flex;
      flex-direction: column;
      gap: 6px;
      padding: 8px;
      overflow: auto;
      min-height: 0;
    }

    #${e} .st-roll-status-chat-item {
      border: 1px solid rgba(255, 255, 255, 0.14);
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.03);
      padding: 8px;
      display: grid;
      grid-template-columns: 42px minmax(0, 1fr);
      gap: 8px;
      align-items: center;
      cursor: pointer;
      transition: border-color 0.2s ease, background-color 0.2s ease, box-shadow 0.2s ease;
    }

    #${e} .st-roll-status-chat-item:hover {
      border-color: rgba(197, 160, 89, 0.58);
      background: rgba(197, 160, 89, 0.16);
    }

    #${e} .st-roll-status-chat-item.is-active {
      border-color: rgba(197, 160, 89, 0.74);
      background: rgba(197, 160, 89, 0.24);
      box-shadow: 0 0 0 1px rgba(197, 160, 89, 0.24);
    }

    #${e} .st-roll-status-chat-avatar-wrap {
      width: 42px;
      height: 42px;
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid rgba(255, 255, 255, 0.16);
      background: rgba(0, 0, 0, 0.35);
      display: grid;
      place-items: center;
      flex: 0 0 auto;
    }

    #${e} .st-roll-status-chat-avatar {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    #${e} .st-roll-status-chat-avatar-fallback {
      width: 100%;
      height: 100%;
      display: grid;
      place-items: center;
      font-size: 15px;
      font-weight: 700;
      color: rgba(255, 236, 201, 0.92);
      background: linear-gradient(145deg, rgba(197, 160, 89, 0.32), rgba(197, 160, 89, 0.12));
    }

    #${e} .st-roll-status-chat-main {
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 2px;
      text-align: left;
    }

    #${e} .st-roll-status-chat-name-marquee {
      display: block;
      min-width: 0;
      max-width: 100%;
      overflow: hidden;
    }

    #${e} .st-roll-status-chat-name-marquee.is-overflowing {
      mask-image: linear-gradient(90deg, transparent 0, #000 6%, #000 94%, transparent 100%);
      -webkit-mask-image: linear-gradient(90deg, transparent 0, #000 6%, #000 94%, transparent 100%);
    }

    #${e} .st-roll-status-chat-name-track {
      display: inline-flex;
      align-items: center;
      min-width: max-content;
      width: max-content;
      max-width: none;
      transform: translateX(0);
      will-change: transform;
    }

    #${e} .st-roll-status-chat-name-marquee.is-overflowing .st-roll-status-chat-name-track {
      animation: st-roll-status-chat-marquee var(--st-roll-status-chat-marquee-duration, 8s) ease-in-out infinite alternate;
    }

    #${e} .st-roll-status-chat-name {
      font-size: 13px;
      font-weight: 700;
      display: inline-flex;
      align-items: center;
      min-width: max-content;
      white-space: nowrap;
    }

    #${e} .st-roll-status-chat-time {
      font-size: 11px;
      opacity: 0.78;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    #${e} .st-roll-status-chat-key {
      font-size: 11px;
      opacity: 0.7;
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    #${e} .st-roll-status-chat-meta-line {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 11px;
      opacity: 0.8;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    @keyframes st-roll-status-chat-marquee {
      0% {
        transform: translateX(0);
      }

      12% {
        transform: translateX(0);
      }

      88% {
        transform: translateX(var(--st-roll-status-chat-marquee-distance, 0px));
      }

      100% {
        transform: translateX(var(--st-roll-status-chat-marquee-distance, 0px));
      }
    }

    #${e} .st-roll-status-splitter {
      cursor: col-resize;
      user-select: none;
      background: rgba(255, 255, 255, 0.04);
      border-left: 1px solid rgba(255, 255, 255, 0.06);
      border-right: 1px solid rgba(255, 255, 255, 0.06);
      transition: background-color 0.2s ease;
    }

    #${e} .st-roll-status-splitter:hover,
    #${e} .st-roll-status-splitter.is-resizing {
      background: rgba(197, 160, 89, 0.42);
    }

    #${e} .st-roll-status-main {
      padding: 10px;
      min-width: 0;
      min-height: 0;
      overflow-x: auto;
      overflow-y: hidden;
      display: flex;
      flex-direction: column;
    }

    #${e} .st-roll-status-mobile-sheet-head {
      display: none;
    }

    #${e} .st-roll-status-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      margin-top: 8px;
      margin-bottom: 8px;
      flex-wrap: wrap;
    }

    #${e} .st-roll-status-head-main {
      display: flex;
      flex-direction: column;
      gap: 3px;
      min-width: 0;
      flex: 1;
    }

    #${e} .st-roll-status-chat-meta {
      font-size: 11px;
      line-height: 1.4;
      opacity: 0.8;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    #${e} .st-roll-status-cols {
      display: grid;
      grid-template-columns:
        var(--st-roll-status-col-name)
        var(--st-roll-status-col-modifier)
        var(--st-roll-status-col-duration)
        var(--st-roll-status-col-scope)
        var(--st-roll-status-col-skills)
        var(--st-roll-status-col-enabled)
        var(--st-roll-status-col-actions);
      gap: 8px;
      font-size: 12px;
      font-weight: 700;
      opacity: 0.72;
      margin-bottom: 6px;
      padding: 0 2px;
      align-items: center;
      min-width: 760px;
    }

    #${e} .st-roll-status-cols span:nth-child(1),
    #${e} .st-roll-status-cols span:nth-child(2),
    #${e} .st-roll-status-cols span:nth-child(3),
    #${e} .st-roll-status-cols span:nth-child(4),
    #${e} .st-roll-status-cols span:nth-child(5),
    #${e} .st-roll-status-cols span:nth-child(6),
    #${e} .st-roll-status-cols span:nth-child(7) {
      text-align: center;
    }

    #${e} .st-roll-status-rows {
      display: flex;
      flex-direction: column;
      gap: 8px;
      flex: 1 1 auto;
      min-height: 0;
      overflow-y: auto;
      overflow-x: visible;
      padding-bottom: 4px;
    }

    #${e} .st-roll-status-row {
      display: grid;
      grid-template-columns:
        var(--st-roll-status-col-name)
        var(--st-roll-status-col-modifier)
        var(--st-roll-status-col-duration)
        var(--st-roll-status-col-scope)
        var(--st-roll-status-col-skills)
        var(--st-roll-status-col-enabled)
        var(--st-roll-status-col-actions);
      gap: 8px;
      align-items: center;
      min-width: 760px;
    }

    #${e} .st-roll-status-field {
      display: contents;
    }

    #${e} .st-roll-status-field-label {
      display: none;
    }

    #${e} .st-roll-status-field-content {
      display: contents;
      min-width: 0;
    }

    #${e} .st-roll-status-field-content > * {
      min-width: 0;
    }

    #${e} .st-roll-status-bottom-grid {
      display: contents;
    }

    #${e} .st-roll-status-row .st-roll-status-name-wrap,
    #${e} .st-roll-status-row .st-roll-status-enabled-wrap,
    #${e} .st-roll-status-row .st-roll-status-actions-group {
      min-height: 36px;
    }

    #${e} .st-roll-status-enabled-card {
      display: flex;
      align-items: stretch;
      min-height: 36px;
      padding: 0;
      border-radius: 0;
      border: 0;
      background: transparent;
      box-sizing: border-box;
    }

    #${e} .st-roll-status-enabled-card .stx-shared-checkbox-body {
      min-height: 34px;
    }

    #${e} .st-roll-status-col-head[data-status-col-key="enabled"] {
      text-align: center;
    }

    #${e} .st-roll-status-col-head[data-status-col-key="actions"] {
      text-align: center;
    }

    #${e} .st-roll-status-enabled-card .stx-shared-checkbox-copy,
    #${e} .st-roll-status-enabled-card .stx-shared-checkbox-title {
      display: none;
    }

    #${e} .st-roll-status-field-enabled .st-roll-status-field-content {
      justify-content: center;
    }

    #${e} .st-roll-status-enabled-card .stx-shared-checkbox-body {
      justify-content: center;
    }

    #${e} .st-roll-status-row .st-roll-status-actions-group {
      justify-self: center;
      justify-content: center;
    }

    #${e} .st-roll-status-enabled-card .stx-shared-checkbox-title {
      font-size: 12px;
      line-height: 1.2;
    }

    #${e} .st-roll-status-row .st-roll-status-name-wrap {
      width: 100%;
      align-self: stretch;
    }

    #${e} .st-roll-status-row .st-roll-status-name,
    #${e} .st-roll-status-row .st-roll-status-modifier,
    #${e} .st-roll-status-row .st-roll-status-duration,
    #${e} .st-roll-status-row .st-roll-status-skills {
      width: 100%;
      min-width: 0;
      min-height: 36px;
      height: 36px;
    }

    #${e} .st-roll-status-col-head {
      position: relative;
      min-width: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      padding-right: 8px;
    }

    #${e} .st-roll-status-col-resizer {
      position: absolute;
      top: 0;
      right: -4px;
      bottom: 0;
      width: 8px;
      cursor: col-resize;
      user-select: none;
      background: transparent;
    }

    #${e} .st-roll-status-col-resizer::before {
      content: "";
      position: absolute;
      top: 14%;
      bottom: 14%;
      left: 50%;
      width: 1px;
      transform: translateX(-50%);
      background: rgba(255, 255, 255, 0.24);
    }

    #${e} .st-roll-status-col-resizer:hover,
    #${e} .st-roll-status-col-resizer.is-resizing {
      background: rgba(197, 160, 89, 0.55);
    }

    #${e} .st-roll-status-col-resizer:hover::before,
    #${e} .st-roll-status-col-resizer.is-resizing::before {
      background: rgba(255, 236, 201, 0.72);
    }

    #${e} .st-roll-status-modifier,
    #${e} .st-roll-status-duration {
      text-align: center;
    }

    #${e} .st-roll-status-enabled-wrap {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      min-height: 36px;
      padding: 0 10px;
      font-size: 12px;
      opacity: 0.9;
      user-select: none;
      box-sizing: border-box;
    }

    #${e} .st-roll-status-remove {
      padding-left: 0;
      padding-right: 0;
    }

    #${e} .st-roll-status-empty {
      border: 1px dashed rgba(255, 255, 255, 0.22);
      border-radius: 8px;
      padding: 10px;
      text-align: center;
      font-size: 12px;
      opacity: 0.7;
      background: rgba(255, 255, 255, 0.03);
    }

    #${e} .st-roll-status-errors {
      border: 1px solid rgba(255, 110, 110, 0.45);
      border-radius: 8px;
      padding: 8px 10px;
      background: rgba(120, 20, 20, 0.22);
      margin: 0;
    }

    #${e} .st-roll-status-error-item {
      font-size: 12px;
      line-height: 1.45;
      color: #ffd2d2;
    }

    #${e} .st-roll-status-dirty {
      margin: 0;
      min-height: 28px;
      font-size: 12px;
      line-height: 1.4;
      color: #ffe0a6;
      display: flex;
      align-items: center;
    }

    #${e} .st-roll-status-footer {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding-top: 10px;
    }

    #${e} .st-roll-tip {
      font-size: 12px;
      line-height: 1.5;
      opacity: 0.78;
      padding-top: 4px;
    }

    ${Rf(`#${e}`)}
    ${Eg(`#${e}`)}
    ${Af(`#${e}`)}
    ${Mf(`#${e}`)}
    ${eg(`#${e}`)}

    #${e} input[type="checkbox"] {
      accent-color: var(--ss-theme-accent);
      transition: filter 0.2s ease;
    }

    #${e} .st-roll-tab:hover {
      opacity: 1;
      background: var(--ss-theme-list-item-hover-bg);
      box-shadow: none;
    }

    #${e} .st-roll-item:hover {
      border-color: var(--ss-theme-border-strong);
      background: var(--ss-theme-list-item-hover-bg);
      box-shadow: none;
    }

    #${e} .st-roll-textarea-wrap:hover {
      border-color: var(--ss-theme-border-strong);
      box-shadow: none;
    }

    #${e} .st-roll-btn:hover {
      border-color: var(--ss-theme-border-strong);
      background: var(--ss-theme-list-item-hover-bg);
      box-shadow: none;
    }

    #${e} .st-roll-shell {
      color: inherit;
      border-color: transparent;
      background: transparent;
      backdrop-filter: none;
    }

    #${e} .st-roll-content {
      border-top-color: var(--ss-theme-border);
      background: var(--ss-theme-surface-2);
    }

    #${e} .st-roll-tabs {
      border-color: var(--ss-theme-border);
      background: var(--ss-theme-surface-2);
    }

    #${e} .st-roll-tab.is-active {
      color: var(--ss-theme-text);
      background: var(--ss-theme-list-item-active-bg);
    }

    #${e} .st-roll-divider-line {
      background: var(--ss-theme-border);
    }

    #${e} .st-roll-item {
      border-color: var(--ss-theme-border);
      background: var(--ss-theme-surface-2);
    }

    #${e} .st-roll-about-meta a {
      border-bottom-color: var(--ss-theme-border);
    }

    #${e} .st-roll-btn {
      color: var(--ss-theme-text);
      border-color: var(--ss-theme-border);
      background: var(--ss-theme-surface-3);
      --stx-button-text: var(--ss-theme-text);
      --stx-button-border: var(--ss-theme-border);
      --stx-button-bg: var(--ss-theme-surface-3);
      --stx-button-hover-border: var(--ss-theme-border-strong);
      --stx-button-hover-bg: var(--ss-theme-list-item-hover-bg);
      --stx-button-hover-shadow: none;
    }

    #${e} .st-roll-btn.secondary {
      border-color: var(--ss-theme-border);
      background: var(--ss-theme-surface-2);
      --stx-button-border: var(--ss-theme-border);
      --stx-button-bg: var(--ss-theme-surface-2);
    }

    #${e} .st-roll-btn.danger {
      border-color: var(--ss-theme-border);
      background: var(--ss-theme-surface-2);
      --stx-button-border: var(--ss-theme-border);
      --stx-button-bg: var(--ss-theme-surface-2);
      --stx-button-hover-border: var(--ss-theme-border-strong);
      --stx-button-hover-bg: var(--ss-theme-list-item-hover-bg);
      --stx-button-hover-shadow: none;
    }

    #${e} .st-roll-textarea-wrap,
    #${e} .st-roll-skill-presets,
    #${e} .st-roll-status-layout {
      border-color: var(--ss-theme-border);
      background: var(--ss-theme-surface-2);
    }

    #${e} .st-roll-skill-modal-panel,
    #${e} .st-roll-status-modal-panel {
      border-color: var(--ss-theme-panel-border);
      background: var(--ss-theme-panel-bg);
      box-shadow: var(--ss-theme-panel-shadow);
    }

    #${e} .st-roll-skill-modal-head,
    #${e} .st-roll-status-modal-head {
      border-bottom-color: var(--ss-theme-border);
      background: var(--ss-theme-toolbar-bg);
    }

    #${e} .st-roll-status-layout {
      border-color: var(--ss-theme-border);
      background: var(--ss-theme-surface-2);
    }

    #${e} .st-roll-status-sidebar {
      border-right-color: var(--ss-theme-border);
      background: var(--ss-theme-surface-2);
    }

    #${e} .st-roll-status-sidebar-head {
      border-bottom-color: var(--ss-theme-border);
      background: var(--ss-theme-toolbar-bg);
    }

    #${e} .st-roll-status-chat-item,
    #${e} .st-roll-skill-preset-item {
      border-color: var(--ss-theme-border);
      background: var(--ss-theme-surface-3);
    }

    #${e} .st-roll-status-chat-item:hover,
    #${e} .st-roll-skill-preset-item:hover {
      border-color: var(--ss-theme-border-strong);
      background: var(--ss-theme-list-item-hover-bg);
    }

    #${e} .st-roll-status-chat-item.is-active,
    #${e} .st-roll-skill-preset-item.is-active {
      border-color: var(--ss-theme-border-strong);
      background: var(--ss-theme-list-item-active-bg);
      box-shadow: none;
    }

    #${e} .st-roll-status-splitter {
      user-select: none;
      background: var(--ss-theme-surface-2);
      border-left-color: var(--ss-theme-border);
      border-right-color: var(--ss-theme-border);
    }

    #${e} .st-roll-status-splitter:hover,
    #${e} .st-roll-status-splitter.is-resizing {
      background: var(--ss-theme-list-item-hover-bg);
    }

    #${e} .st-roll-skill-modal::backdrop,
    #${e} .st-roll-status-modal::backdrop {
      background: var(--ss-theme-backdrop);
      backdrop-filter: var(--ss-theme-backdrop-filter);
    }

    #${e} .stx-shared-box-checkbox {
      --stx-box-checkbox-border: color-mix(in srgb, var(--ss-theme-accent) 52%, var(--ss-theme-border));
      --stx-box-checkbox-bg: color-mix(in srgb, var(--ss-theme-surface-3) 92%, transparent);
      --stx-box-checkbox-hover-border: color-mix(in srgb, var(--ss-theme-accent) 72%, #fff 10%);
      --stx-box-checkbox-focus-ring: color-mix(in srgb, var(--ss-theme-accent) 24%, transparent);
      --stx-box-checkbox-checked-border: color-mix(in srgb, var(--ss-theme-accent) 84%, #fff 8%);
      --stx-box-checkbox-checked-bg: color-mix(in srgb, var(--ss-theme-accent) 24%, var(--ss-theme-surface-3));
      --stx-box-checkbox-indicator: var(--ss-theme-accent-contrast);
    }

    #${e} .st-roll-tab:hover {
      opacity: 1;
      background: var(--ss-theme-list-item-hover-bg);
      box-shadow: none;
    }

    #${e} .st-roll-item:hover {
      border-color: var(--ss-theme-border-strong);
      background: var(--ss-theme-list-item-hover-bg);
      box-shadow: none;
    }

    #${e} .st-roll-input:hover,
    #${e} .st-roll-search:hover,
    #${e} .st-roll-textarea:hover {
      border-color: var(--ss-theme-border-strong);
      background-color: var(--ss-theme-surface-3);
      box-shadow: 0 0 0 1px var(--ss-theme-focus-ring);
    }

    #${e} .st-roll-textarea-wrap:hover {
      border-color: var(--ss-theme-border-strong);
      box-shadow: none;
    }

    #${e} .st-roll-btn:hover {
      border-color: var(--ss-theme-border-strong);
      background: var(--ss-theme-list-item-hover-bg);
      box-shadow: none;
    }

    #${e} .st-roll-btn.danger:hover {
      border-color: var(--ss-theme-border-strong);
      background: var(--ss-theme-list-item-hover-bg);
      box-shadow: none;
    }

    #${e} .st-roll-input:focus,
    #${e} .st-roll-search:focus,
    #${e} .st-roll-textarea:focus {
      outline: none;
      border-color: var(--ss-theme-border-strong);
      box-shadow: 0 0 0 2px var(--ss-theme-focus-ring);
    }

    #${e} .st-roll-content[data-ss-theme="host"] .st-roll-input.text_pole,
    #${e} .st-roll-content[data-ss-theme="host"] .st-roll-search.text_pole,
    #${e} .st-roll-content[data-ss-theme="host"] .st-roll-textarea.text_pole {
      margin: 0;
      box-shadow: none;
    }

    #${e} .st-roll-content[data-ss-theme="host"] .st-roll-tab.menu_button,
    #${e} .st-roll-content[data-ss-theme="host"] .st-roll-btn.menu_button {
      margin: 0;
      width: auto;
      min-height: 30px;
    }

    #${e} .st-roll-content[data-ss-theme="host"] .st-roll-tab.menu_button {
      flex: 1;
      min-width: 0;
      border-radius: 999px;
      padding: 6px 10px;
      filter: grayscale(0.15);
      opacity: 0.85;
    }

    #${e} .st-roll-content[data-ss-theme="host"] .st-roll-tab.menu_button.is-active,
    #${e} .st-roll-content[data-ss-theme="host"] .st-roll-tab.menu_button.active {
      opacity: 1;
      filter: none;
      background-color: var(--white30a, rgba(255, 255, 255, 0.3));
    }

    #${e} .st-roll-content[data-ss-theme="host"] .st-roll-btn.menu_button {
      padding: 3px 8px;
    }

    #${e} .st-roll-content[data-ss-theme="host"] .st-roll-input.text_pole:hover,
    #${e} .st-roll-content[data-ss-theme="host"] .st-roll-search.text_pole:hover,
    #${e} .st-roll-content[data-ss-theme="host"] .st-roll-textarea.text_pole:hover {
      border-color: var(--ss-theme-border);
      background-color: var(--black30a, rgba(0, 0, 0, 0.3));
      box-shadow: none;
    }

    #${e} .st-roll-content[data-ss-theme="host"] .st-roll-input.text_pole:focus,
    #${e} .st-roll-content[data-ss-theme="host"] .st-roll-search.text_pole:focus,
    #${e} .st-roll-content[data-ss-theme="host"] .st-roll-textarea.text_pole:focus {
      border-color: var(--ss-theme-border);
      box-shadow: none;
    }

    #${e} .st-roll-content[data-ss-theme="host"] .st-roll-tab.menu_button:hover,
    #${e} .st-roll-content[data-ss-theme="host"] .st-roll-btn.menu_button:hover {
      border-color: var(--ss-theme-border);
      background-color: var(--white30a, rgba(255, 255, 255, 0.3));
      box-shadow: none;
    }

    #${e} .st-roll-content[data-ss-theme="host"] .st-roll-btn.danger.menu_button:hover {
      border-color: var(--ss-theme-border-strong);
      background: var(--ss-theme-list-item-hover-bg);
      box-shadow: none;
    }

    #${e} .st-roll-workbench {
      --st-roll-status-sidebar-width: 276px;
      display: grid;
      height: 100%;
      border: 1px solid var(--ss-theme-border);
      border-radius: 14px;
      background: var(--ss-theme-surface-2);
      overflow: hidden;
    }

    #${e} .st-roll-workbench-sidebar,
    #${e} .st-roll-workbench-main {
      min-width: 0;
      min-height: 0;
    }

    #${e} .st-roll-workbench-sidebar {
      display: flex;
      flex-direction: column;
      gap: 10px;
      padding: 10px;
      background: var(--ss-theme-surface-3);
      border-right: 1px solid var(--ss-theme-border);
    }

    #${e} .st-roll-workbench-main {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 14px;
      background: linear-gradient(180deg, var(--ss-theme-surface-3), transparent 100%);
    }

    #${e} .st-roll-workbench-context,
    #${e} .st-roll-workbench-toolbar {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
      padding: 10px 12px;
      border: 1px solid var(--ss-theme-border);
      border-radius: 12px;
      background: var(--ss-theme-toolbar-bg);
    }

    #${e} .st-roll-workbench-context {
      align-items: flex-start;
      justify-content: space-between;
    }

    #${e} .st-roll-status-context {
      display: grid;
      grid-template-columns: minmax(240px, auto) minmax(0, 1fr);
      align-items: center;
      gap: 6px 14px;
      padding: 8px 12px;
      min-height: 0;
    }

    #${e} .st-roll-status-context .st-roll-workbench-head-copy {
      gap: 2px;
    }

    #${e} .st-roll-status-context .st-roll-field-label {
      font-size: 14px;
      line-height: 1.2;
    }

    #${e} .st-roll-status-context .st-roll-status-chat-meta {
      font-size: 11px;
      line-height: 1.25;
    }

    #${e} .st-roll-status-context .st-roll-tip {
      padding-top: 0;
      margin: 0;
      font-size: 11px;
      line-height: 1.35;
      text-align: right;
      opacity: 0.72;
    }

    #${e} .st-roll-workbench-sidebar-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      padding: 10px 12px;
      border: 1px solid var(--ss-theme-border);
      border-radius: 12px;
      background: var(--ss-theme-toolbar-bg);
    }

    #${e} .st-roll-workbench-sidebar-copy,
    #${e} .st-roll-workbench-head-copy {
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 0;
    }

    #${e} .st-roll-workbench-subtitle,
    #${e} .st-roll-workbench-selection {
      font-size: 12px;
      line-height: 1.4;
      color: var(--ss-theme-text-muted);
    }

    #${e} .st-roll-workbench-selection {
      display: inline-flex;
      align-items: center;
      min-height: 30px;
      padding: 0 10px;
      border-radius: 999px;
      border: 1px solid var(--ss-theme-border);
      background: var(--ss-theme-list-item-hover-bg);
      white-space: nowrap;
    }

    #${e} .st-roll-status-selection-count {
      min-height: 28px;
      padding: 0 8px;
      font-size: 11px;
    }

    #${e} .st-roll-inline-toggle {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      min-height: 30px;
      padding: 0 10px;
      border-radius: 999px;
      border: 1px solid var(--ss-theme-border);
      background: var(--ss-theme-surface-3);
      cursor: pointer;
      user-select: none;
    }

    #${e} .st-roll-status-toolbar {
      gap: 6px;
      padding: 8px 10px;
    }

    #${e} .st-roll-status-toolbar .st-roll-inline-toggle {
      min-height: 28px;
      padding: 0 8px;
      gap: 6px;
      font-size: 12px;
    }

    #${e} .st-roll-toolbar-icon-btn {
      width: 28px;
      min-width: 28px;
      min-height: 28px;
      padding: 0;
      border-radius: 8px;
      gap: 0;
      flex: 0 0 auto;
    }

    #${e} .st-roll-toolbar-icon-btn .stx-shared-button-label {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }

    #${e} .st-roll-toolbar-icon-btn .stx-shared-button-icon {
      width: 14px;
      height: 14px;
      font-size: 13px;
    }

    #${e} .st-roll-inline-toggle input[type="checkbox"] {
      margin: 0;
    }

    #${e} .st-roll-skill-layout,
    #${e} .st-roll-status-layout {
      background: var(--ss-theme-surface-2);
      border-color: var(--ss-theme-border);
    }

    #${e} .st-roll-skill-layout {
      grid-template-columns: minmax(260px, 320px) minmax(0, 1fr);
    }

    #${e} .st-roll-status-layout {
      grid-template-columns: minmax(220px, var(--st-roll-status-sidebar-width)) 8px minmax(0, 1fr);
    }

    #${e} .st-roll-skill-presets,
    #${e} .st-roll-status-sidebar {
      background: var(--ss-theme-surface-3);
      border-color: var(--ss-theme-border);
    }

    #${e} .st-roll-workbench-toolbar-sidebar {
      gap: 6px;
      padding: 8px;
    }

    #${e} .st-roll-status-sidebar .st-roll-workbench-toolbar-sidebar {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto auto;
      align-items: center;
      padding: 8px;
    }

    #${e} .st-roll-status-sidebar .st-roll-status-chat-search {
      grid-column: 1 / -1;
    }

    #${e} .st-roll-status-sidebar .st-roll-btn {
      min-height: 30px;
      padding: 4px 10px;
    }

    #${e} .st-roll-status-sidebar-head {
      padding: 8px 12px;
    }

    #${e} .st-roll-status-head-main {
      gap: 2px;
    }

    #${e} .st-roll-status-memory-state {
      font-size: 11px;
      line-height: 1.3;
    }

    #${e} .st-roll-status-chat-list {
      gap: 6px;
    }

    #${e} .st-roll-skill-main {
      overflow-x: auto;
      overflow-y: hidden;
    }

    #${e} .st-roll-status-main {
      overflow: hidden;
    }

    #${e} .st-roll-skill-preset-list,
    #${e} .st-roll-status-chat-list,
    #${e} .st-roll-skill-rows,
    #${e} .st-roll-status-rows {
      scrollbar-width: thin;
    }

    #${e} .st-roll-skill-preset-list,
    #${e} .st-roll-status-chat-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
      flex: 1 1 auto;
      min-height: 0;
      overflow-y: auto;
    }

    #${e} .st-roll-skill-preset-item,
    #${e} .st-roll-status-chat-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      padding: 12px;
      border-radius: 12px;
    }

    #${e} .st-roll-skill-preset-item {
      align-items: flex-start;
    }

    #${e} .st-roll-skill-preset-name {
      font-size: 14px;
      font-weight: 700;
      line-height: 1.35;
    }

    #${e} .st-roll-skill-preset-tags {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      flex-wrap: wrap;
      justify-content: flex-end;
    }

    #${e} .st-roll-skill-preset-tag {
      display: inline-flex;
      align-items: center;
      min-height: 22px;
      padding: 0 8px;
      border-radius: 999px;
      font-size: 11px;
      line-height: 1;
      border: 1px solid var(--ss-theme-border);
      background: var(--ss-theme-list-item-hover-bg);
    }

    #${e} .st-roll-skill-preset-tag.active {
      color: var(--ss-theme-accent-contrast);
      background: var(--ss-theme-accent);
      border-color: var(--ss-theme-accent);
    }

    #${e} .st-roll-skill-preset-tag.locked {
      background: transparent;
    }

    #${e} .st-roll-skill-preset-meta,
    #${e} .st-roll-status-memory-state,
    #${e} .st-roll-status-chat-meta {
      font-size: 12px;
      line-height: 1.45;
      color: var(--ss-theme-text-muted);
    }

    #${e} .st-roll-status-chat-item {
      align-items: stretch;
      gap: 12px;
    }

    #${e} .st-roll-status-chat-main {
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 0;
      flex: 1 1 auto;
      text-align: left;
    }

    #${e} .st-roll-status-chat-name {
      font-size: 14px;
      font-weight: 700;
      line-height: 1.3;
    }

    #${e} .st-roll-status-chat-time,
    #${e} .st-roll-status-chat-key,
    #${e} .st-roll-status-chat-meta-line {
      font-size: 12px;
      line-height: 1.35;
      color: var(--ss-theme-text-muted);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    #${e} .st-roll-status-chat-meta-line {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    #${e} .st-roll-status-chat-avatar-wrap {
      flex: 0 0 56px;
      width: 56px;
      height: 56px;
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid var(--ss-theme-border);
      background: var(--ss-theme-list-item-hover-bg);
    }

    #${e} .st-roll-status-chat-avatar,
    #${e} .st-roll-status-chat-avatar-fallback {
      width: 100%;
      height: 100%;
    }

    #${e} .st-roll-status-chat-avatar {
      object-fit: cover;
      display: block;
    }

    #${e} .st-roll-status-chat-avatar-fallback {
      display: grid;
      place-items: center;
      font-size: 26px;
      font-weight: 700;
      color: var(--ss-theme-accent-contrast);
    }

    #${e} .st-roll-skill-cols,
    #${e} .st-roll-status-cols {
      background: transparent;
      border-bottom: 1px solid var(--ss-theme-border);
      padding-bottom: 8px;
      margin-bottom: 0;
    }

    #${e} .st-roll-skill-rows,
    #${e} .st-roll-status-rows {
      flex: 1 1 auto;
      min-height: 0;
      padding: 10px;
      border: 1px solid var(--ss-theme-border);
      border-radius: 14px;
      background: var(--ss-theme-surface-3);
    }

    #${e} .st-roll-skill-row,
    #${e} .st-roll-status-row {
      align-items: stretch;
    }

    #${e} .st-roll-skill-name-wrap,
    #${e} .st-roll-status-name-wrap {
      display: flex;
      align-items: center;
      gap: 6px;
      min-width: 0;
    }

    #${e} .st-roll-skill-name-wrap {
      width: 100%;
    }

    #${e} .st-roll-skill-name,
    #${e} .st-roll-skill-modifier {
      min-height: 32px;
    }

    #${e} .st-roll-skill-name {
      flex: 1 1 auto;
      width: 100%;
      min-width: 0;
    }

    #${e} .st-roll-skill-name {
      font-size: 13px;
    }

    #${e} .st-roll-skill-modifier {
      text-align: center;
      font-size: 13px;
      padding-left: 6px;
      padding-right: 6px;
    }

    #${e} .st-roll-skill-row-select,
    #${e} .st-roll-status-row-select {
      flex: 0 0 auto;
      width: 16px;
      height: 16px;
      margin: 0;
      display: inline-grid;
      place-items: center;
      align-self: center;
      --stx-box-checkbox-size: 16px;
    }

    #${e} .st-roll-skill-actions-group,
    #${e} .st-roll-status-actions-group {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-wrap: nowrap;
    }

    #${e} .st-roll-skill-actions-group {
      display: grid;
      grid-template-columns: repeat(4, 28px);
      gap: 4px;
      justify-self: center;
      justify-content: end;
      align-content: center;
    }

    #${e} .st-roll-skill-actions-group .st-roll-btn,
    #${e} .st-roll-status-actions-group .st-roll-btn {
      min-height: 28px;
      padding: 3px 8px;
      font-size: 12px;
    }

    #${e} .st-roll-skill-actions-group .st-roll-btn {
      width: 28px;
      min-width: 28px;
      min-height: 28px;
      padding: 0;
      font-size: 11px;
      line-height: 1;
    }

    #${e} .st-roll-status-actions-group {
      justify-content: flex-end;
      display: grid;
      grid-template-columns: repeat(2, 28px);
      gap: 6px;
      align-content: center;
    }

    #${e} .st-roll-status-actions-group .st-roll-toolbar-icon-btn {
      width: 28px;
      min-width: 28px;
      min-height: 28px;
      padding: 0;
      line-height: 1;
    }

    #${e} .st-roll-skill-empty,
    #${e} .st-roll-status-empty {
      display: grid;
      place-items: center;
      min-height: 120px;
      border: 1px dashed var(--ss-theme-border);
      border-radius: 12px;
      background: var(--ss-theme-surface-3);
      color: var(--ss-theme-text-muted);
    }

    @media (max-width: 680px) {
      #${e} .st-roll-workbench-toolbar,
      #${e} .st-roll-workbench-context,
      #${e} .st-roll-workbench-sidebar-head {
        flex-direction: column;
        align-items: stretch;
      }

      #${e} .st-roll-workbench-selection,
      #${e} .st-roll-inline-toggle {
        width: 100%;
      }

      #${e} .st-roll-skill-preset-toolbar {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        align-items: center;
        gap: 8px;
      }

      #${e} .st-roll-skill-modal-panel {
        width: 100vw;
        height: 100vh;
        margin: 0;
        border-radius: 0;
      }

      #${e} .st-roll-skill-modal-head {
        padding: 10px 12px;
      }

      #${e} .st-roll-skill-modal-body {
        padding: 10px;
        overflow-x: hidden;
        overflow-y: auto;
        -webkit-overflow-scrolling: touch;
        overscroll-behavior-y: contain;
      }

      #${e} .st-roll-workbench,
      #${e} .st-roll-skill-layout {
        height: auto;
        min-height: max-content;
        overflow: visible;
      }

      #${e} .st-roll-skill-layout {
        grid-template-columns: 1fr;
      }

      #${e} .st-roll-skill-presets {
        min-height: 0;
      }

      #${e} .st-roll-skill-main {
        overflow: visible;
        min-height: max-content;
      }

      #${e} .st-roll-skill-rows {
        overflow: visible;
      }

      #${e} .st-roll-skill-toolbar {
        flex-direction: row;
        align-items: stretch;
        justify-content: flex-start;
        flex-wrap: wrap;
      }

      #${e} .st-roll-skill-toolbar .st-roll-skill-row-search,
      #${e} .st-roll-skill-toolbar .st-roll-workbench-selection {
        width: 100%;
        min-width: 0;
        flex: 1 1 100%;
      }

      #${e} .st-roll-skill-toolbar .st-roll-skill-select-visible,
      #${e} .st-roll-skill-toolbar .st-roll-skill-clear-selection,
      #${e} .st-roll-skill-toolbar .st-roll-skill-batch-delete {
        min-width: 0;
        flex: 1 1 calc(33.333% - 6px);
      }

      #${e} .st-roll-skill-head {
        flex-direction: column;
        align-items: stretch;
      }

      #${e} .st-roll-skill-head .st-roll-workbench-head-copy {
        min-width: 0;
      }

      #${e} .st-roll-skill-head .st-roll-actions {
        width: 100%;
        flex-wrap: wrap;
        overflow: hidden;
      }

      #${e} .st-roll-skill-head .st-roll-actions .st-roll-btn {
        min-width: 0;
        flex: 1 1 calc(50% - 4px);
      }

      #${e} .st-roll-skill-actions-group,
      #${e} .st-roll-status-actions-group {
        width: 100%;
      }

      #${e} .st-roll-skill-cols {
        display: none;
      }

      #${e} .st-roll-skill-row {
        grid-template-columns: minmax(0, 1fr) auto;
        grid-template-areas:
          "name name"
          "modifier actions";
        gap: 6px 8px;
        align-items: center;
        min-width: 0;
      }

      #${e} .st-roll-skill-name-wrap {
        grid-area: name;
        gap: 4px;
      }

      #${e} .st-roll-skill-modifier {
        grid-area: modifier;
        text-align: left;
        min-height: 28px;
        max-width: 96px;
      }

      #${e} .st-roll-skill-row-select {
        width: 14px;
        height: 14px;
        --stx-box-checkbox-size: 14px;
      }

      #${e} .st-roll-skill-actions-group {
        grid-area: actions;
        width: auto;
        justify-self: end;
        grid-template-columns: repeat(4, 26px);
        gap: 4px;
      }

      #${e} .st-roll-skill-actions-group .st-roll-btn {
        width: 26px;
        min-width: 26px;
        min-height: 26px;
      }

      #${e} .st-roll-skill-remove {
        width: 100%;
      }

      #${e} .st-roll-status-modal-panel {
        width: 100vw;
        height: 100vh;
        margin: 0;
        border-radius: 0;
      }

      #${e} .st-roll-status-modal {
        --st-roll-status-mobile-sheet-height: min(92vh, 920px);
        --st-roll-status-mobile-sheet-translate: calc(var(--st-roll-status-mobile-sheet-height) + 84px);
        --st-roll-status-mobile-sheet-backdrop-opacity: 0;
      }

      #${e} .st-roll-status-modal-backdrop {
        opacity: var(--st-roll-status-mobile-sheet-backdrop-opacity, 0);
      }

      #${e} .st-roll-status-modal.is-mobile-sheet-dragging .st-roll-status-modal-backdrop {
        transition: none;
      }

      #${e} .st-roll-status-modal-head {
        padding: 10px 12px;
      }

      #${e} .st-roll-status-modal-body {
        padding: 0;
        position: relative;
      }

      #${e} .st-roll-status-layout {
        display: block;
        position: relative;
        min-height: 0;
        height: 100%;
        border: 0;
        border-radius: 0;
        background: transparent;
      }

      #${e} .st-roll-status-sidebar {
        min-width: 0;
        height: 100%;
        border: 0;
        background: transparent;
        padding: 12px 12px 20px;
        gap: 10px;
      }

      #${e} .st-roll-status-splitter {
        display: none;
      }

      #${e} .st-roll-status-sidebar .st-roll-workbench-toolbar-sidebar {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto auto;
        gap: 8px;
        padding: 10px;
        border-radius: 16px;
      }

      #${e} .st-roll-status-sidebar .st-roll-status-chat-search {
        grid-column: 1 / -1;
      }

      #${e} .st-roll-status-sidebar .st-roll-btn {
        min-width: 84px;
        min-height: 34px;
      }

      #${e} .st-roll-status-sidebar-head {
        padding: 10px 12px;
        border-radius: 16px;
      }

      #${e} .st-roll-status-chat-list {
        flex: 1 1 auto;
        min-height: 0;
        overflow-y: auto;
        padding-bottom: 24px;
        gap: 10px;
      }

      #${e} .st-roll-status-chat-item {
        align-items: center;
        padding: 12px;
        min-height: 76px;
        border-radius: 16px;
      }

      #${e} .st-roll-status-chat-avatar-wrap {
        flex-basis: 60px;
        width: 60px;
        height: 60px;
      }

      #${e} .st-roll-status-main {
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 4;
        height: var(--st-roll-status-mobile-sheet-height);
        padding: 12px 12px calc(12px + env(safe-area-inset-bottom, 0px));
        border-radius: 20px 20px 0 0;
        border: 1px solid var(--ss-theme-border);
        border-bottom: 0;
        background: var(--ss-theme-panel-bg);
        box-shadow: 0 -16px 36px rgba(0, 0, 0, 0.42);
        transform: translateY(var(--st-roll-status-mobile-sheet-translate));
        opacity: 1;
        pointer-events: none;
        transition: transform 0.26s cubic-bezier(0.22, 0.74, 0.22, 1);
        overflow: hidden;
        overscroll-behavior: contain;
        touch-action: pan-y;
        will-change: transform;
        display: grid;
        grid-template-rows: auto auto auto auto auto minmax(0, 1fr);
        gap: 10px;
      }

      #${e} .st-roll-status-modal.is-mobile-sheet-open .st-roll-status-main,
      #${e} .st-roll-status-modal.is-mobile-sheet-dragging .st-roll-status-main {
        pointer-events: auto;
      }

      #${e} .st-roll-status-modal.is-mobile-sheet-expanded .st-roll-status-main {
        box-shadow: 0 -22px 46px rgba(0, 0, 0, 0.5);
      }

      #${e} .st-roll-status-modal.is-mobile-sheet-dragging .st-roll-status-main {
        transition: none;
      }

      #${e} .st-roll-status-mobile-sheet-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        padding: 10px 4px 8px;
        position: relative;
        user-select: none;
        touch-action: none;
      }

      #${e} .st-roll-status-mobile-sheet-head::before {
        content: "";
        position: absolute;
        top: 0;
        left: 50%;
        width: 44px;
        height: 4px;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.22);
        transform: translateX(-50%);
      }

      #${e} .st-roll-status-mobile-back {
        min-height: 32px;
      }

      #${e} .st-roll-status-mobile-sheet-copy {
        min-width: 0;
        flex: 1 1 auto;
        display: flex;
        align-items: center;
        justify-content: flex-end;
        font-size: 12px;
        color: var(--ss-theme-text-muted);
      }

      #${e} .st-roll-status-context {
        grid-template-columns: 1fr;
        gap: 4px;
        padding: 8px 10px;
        border-radius: 14px;
      }

      #${e} .st-roll-status-context .st-roll-tip {
        text-align: left;
        font-size: 11px;
        line-height: 1.35;
      }

      #${e} .st-roll-status-toolbar {
        display: grid;
        grid-template-columns: repeat(6, minmax(0, 1fr));
        gap: 8px;
        padding: 10px;
        border-radius: 16px;
      }

      #${e} .st-roll-status-toolbar .st-roll-status-search {
        grid-column: 1 / -1;
      }

      #${e} .st-roll-status-toolbar .st-roll-inline-toggle {
        grid-column: span 3;
        width: 100%;
        min-height: 34px;
        justify-content: flex-start;
      }

      #${e} .st-roll-status-selection-count {
        grid-column: span 2;
        width: 100%;
        justify-content: center;
        min-height: 32px;
      }

      #${e} .st-roll-status-toolbar .st-roll-toolbar-icon-btn {
        width: 100%;
        min-width: 0;
        min-height: 34px;
        border-radius: 10px;
      }

      #${e} .st-roll-status-head {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        align-items: center;
        flex-wrap: nowrap;
        gap: 6px;
      }

      #${e} .st-roll-status-head-main {
        gap: 2px;
        min-width: 0;
      }

      #${e} .st-roll-status-head .st-roll-workbench-subtitle {
        font-size: 11px;
        line-height: 1.3;
      }

      #${e} .st-roll-status-head .st-roll-actions {
        display: grid;
        grid-auto-flow: column;
        grid-auto-columns: max-content;
        align-items: center;
        justify-content: end;
        gap: 6px;
        min-width: 0;
      }

      #${e} .st-roll-status-head .st-roll-btn {
        min-height: 30px;
        padding: 0 10px;
        font-size: 11px;
      }

      #${e} .st-roll-status-cols {
        display: none;
      }

      #${e} .st-roll-status-actions-group {
        width: 100%;
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 8px;
      }

      #${e} .st-roll-status-actions-group .st-roll-btn {
        width: 100%;
        min-width: 0;
        min-height: 32px;
      }

      #${e} .st-roll-status-rows {
        padding: 8px;
        border-radius: 16px;
        overflow-x: hidden;
        overflow-y: auto;
        -webkit-overflow-scrolling: touch;
      }

      #${e} .st-roll-status-row {
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 8px;
        padding: 12px;
        border: 1px solid var(--ss-theme-border);
        border-radius: 16px;
        background: color-mix(in srgb, var(--ss-theme-surface-3) 88%, transparent);
        min-width: 0;
      }

      #${e} .st-roll-status-field {
        display: flex;
        flex-direction: column;
        gap: 5px;
        min-width: 0;
      }

      #${e} .st-roll-status-field-label {
        display: block;
        padding: 0 2px;
        font-size: 10px;
        font-weight: 700;
        line-height: 1.2;
        letter-spacing: 0.04em;
        color: var(--ss-theme-text-muted);
        opacity: 0.72;
      }

      #${e} .st-roll-status-field-content {
        display: block;
        min-width: 0;
      }

      #${e} .st-roll-status-field-name,
      #${e} .st-roll-status-field-skills {
        grid-column: 1 / -1;
      }

      #${e} .st-roll-status-bottom-grid {
        grid-column: 1 / -1;
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        align-items: center;
        gap: 8px;
        min-width: 0;
      }

      #${e} .st-roll-status-field-enabled {
        min-width: 0;
      }

      #${e} .st-roll-status-field-actions {
        justify-self: end;
        width: max-content;
        max-width: 100%;
      }

      #${e} .st-roll-status-field-name .st-roll-status-field-label {
        padding-left: 32px;
      }

      #${e} .st-roll-status-field-enabled .st-roll-status-field-label {
        display: none;
      }

      #${e} .st-roll-status-field-actions .st-roll-status-field-label {
        display: none;
      }

      #${e} .st-roll-status-row .st-roll-status-name-wrap {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr);
        align-items: center;
        gap: 8px;
        width: 100%;
      }

      #${e} .st-roll-status-row .st-roll-status-name,
      #${e} .st-roll-status-row .st-roll-status-modifier,
      #${e} .st-roll-status-row .st-roll-status-duration,
      #${e} .st-roll-status-row .st-roll-status-skills {
        width: 100%;
        min-width: 0;
      }

      #${e} .st-roll-status-row .st-roll-status-name,
      #${e} .st-roll-status-row .st-roll-status-modifier,
      #${e} .st-roll-status-row .st-roll-status-duration,
      #${e} .st-roll-status-row .st-roll-status-skills,
      #${e} .st-roll-status-enabled-wrap {
        min-height: 36px;
        height: 36px;
      }

      #${e} .st-roll-status-modifier {
        text-align: left;
      }

      #${e} .st-roll-status-enabled-card {
        width: auto;
        max-width: 100%;
        min-width: 0;
        min-height: 36px;
        margin-left: auto;
        padding: 0;
      }

      #${e} .st-roll-status-enabled-card .stx-shared-checkbox-body {
        justify-content: flex-end;
        gap: 4px;
      }

      #${e} .st-roll-status-enabled-card .stx-shared-checkbox-copy {
        flex: 0 0 auto;
      }

      #${e} .st-roll-status-enabled-card .stx-shared-checkbox-control {
        padding: 2px 6px 2px 4px;
      }

      #${e} .st-roll-status-enabled-card .stx-shared-checkbox-title {
        font-size: 12px;
      }

      #${e} .st-roll-status-field-enabled .st-roll-status-field-content,
      #${e} .st-roll-status-field-actions .st-roll-status-field-content {
        display: flex;
        align-items: center;
        min-height: 36px;
      }

      #${e} .st-roll-status-field-enabled .st-roll-status-field-content {
        justify-content: flex-end;
        width: 100%;
      }

      #${e} .st-roll-status-field-actions .st-roll-status-field-content {
        justify-content: flex-end;
        width: max-content;
        max-width: 100%;
      }

      #${e} .st-roll-status-actions-group {
        width: auto;
        grid-template-columns: repeat(2, 28px);
        gap: 6px;
        justify-content: flex-end;
      }

      #${e} .st-roll-status-actions-group .st-roll-btn,
      #${e} .st-roll-status-actions-group .st-roll-toolbar-icon-btn {
        width: 28px;
        min-width: 28px;
        min-height: 28px;
        border-radius: 9px;
        padding: 0;
      }

      #${e} .st-roll-status-actions-group .stx-shared-button-icon {
        font-size: 11px;
      }

      #${e} .st-roll-status-duplicate,
      #${e} .st-roll-status-remove {
        width: 28px;
      }
    }

    @media (max-width: 768px) {
      #${e} .st-roll-status-chat-meta {
        white-space: normal;
      }
    }
  `;
}
var At = "stx_rollhelper", Gn = "st-roll-settings-Event-card", Ng = "st-roll-settings-Event-style", ou = "st-roll-settings-Event-badge", Ni = "st-roll-settings-Event-enabled", Li = "st-roll-settings-Event-auto-rule", Mi = "st-roll-settings-Event-ai-roll-mode", Oi = "st-roll-settings-Event-ai-round-control", Pi = "st-roll-settings-Event-exploding-enabled", Bi = "st-roll-settings-Event-advantage-enabled", Ui = "st-roll-settings-Event-dynamic-result-guidance", Ki = "st-roll-settings-Event-dynamic-dc-reason", Hi = "st-roll-settings-Event-status-system-enabled", Gi = "st-roll-settings-Event-status-editor-open", Ao = "st-roll-settings-Event-status-modal", au = "st-roll-settings-Event-status-modal-close", zi = "st-roll-settings-Event-status-refresh", ji = "st-roll-settings-Event-status-clean-unused", qi = "st-roll-settings-Event-status-rows", iu = "st-roll-settings-Event-status-add", lu = "st-roll-settings-Event-status-save", cu = "st-roll-settings-Event-status-reset", Fi = "st-roll-settings-Event-status-errors", Vi = "st-roll-settings-Event-status-dirty-hint", Lg = "st-roll-settings-Event-status-layout", Mg = "st-roll-settings-Event-status-sidebar", du = "st-roll-settings-Event-status-splitter", uu = "st-roll-settings-Event-status-chat-list", mu = "st-roll-settings-Event-status-chat-meta", hu = "st-roll-settings-Event-status-cols", pu = "st-roll-settings-Event-status-memory-state", Yi = "st-roll-settings-Event-allowed-dice-sides", Wi = "st-roll-settings-Event-theme", Xi = "st-roll-settings-Event-summary-detail", Ji = "st-roll-settings-Event-summary-rounds", Qi = "st-roll-settings-Event-apply-scope", Zi = "st-roll-settings-Event-outcome-branches", el = "st-roll-settings-Event-explode-outcome", tl = "st-roll-settings-Event-summary-outcome", rl = "st-roll-settings-Event-list-outcome-preview", nl = "st-roll-settings-Event-time-limit-enabled", sl = "st-roll-settings-Event-time-limit-min-seconds", fu = "st-roll-settings-Event-time-limit-row", ol = "st-roll-settings-Event-skill-enabled", Og = "st-roll-settings-Event-skill-editor-wrap", al = "st-roll-settings-Event-skill-cols", $o = "st-roll-settings-Event-skill-rows", gu = "st-roll-settings-Event-skill-add", vu = "st-roll-settings-Event-skill-text", bu = "st-roll-settings-Event-skill-import-toggle", xu = "st-roll-settings-Event-skill-import-area", yu = "st-roll-settings-Event-skill-import-apply", Su = "st-roll-settings-Event-skill-export", Eu = "st-roll-settings-Event-skill-save", _u = "st-roll-settings-Event-skill-reset", Tu = "st-roll-settings-Event-skill-errors", ku = "st-roll-settings-Event-skill-dirty-hint", wu = "st-roll-settings-Event-compatibility-mode", Iu = "st-roll-settings-Event-remove-rolljson", Au = "st-roll-settings-Event-strip-internal", Pg = "st-roll-settings-Event-skill-preset-layout", Bg = "st-roll-settings-Event-skill-preset-sidebar", il = "st-roll-settings-Event-skill-preset-list", $u = "st-roll-settings-Event-skill-preset-create", ll = "st-roll-settings-Event-skill-preset-delete", Ru = "st-roll-settings-Event-skill-preset-restore-default", cl = "st-roll-settings-Event-skill-preset-name", Cu = "st-roll-settings-Event-skill-preset-rename", Du = "st-roll-settings-Event-skill-preset-meta", Nu = "st-roll-settings-Event-skill-editor-open", Ro = "st-roll-settings-Event-skill-modal", Lu = "st-roll-settings-Event-skill-modal-close", dl = "st-roll-settings-Event-rule-text", Mu = "st-roll-settings-Event-rule-save", Ou = "st-roll-settings-Event-rule-reset", Pu = "st-roll-settings-Event-ai-bridge-light", Bu = "st-roll-settings-Event-ai-bridge-text", Uu = "st-roll-settings-Event-ai-bridge-refresh", Ku = "st-roll-settings-Event-search", Hu = "st-roll-settings-Event-tab-main", Gu = "st-roll-settings-Event-tab-ai", zu = "st-roll-settings-Event-tab-skill", ju = "st-roll-settings-Event-tab-rule", qu = "st-roll-settings-Event-tab-about", Fu = "st-roll-settings-Event-panel-main", Vu = "st-roll-settings-Event-panel-ai", Yu = "st-roll-settings-Event-panel-skill", Wu = "st-roll-settings-Event-panel-rule", Xu = "st-roll-settings-Event-panel-about", ct = Sr, Ug = typeof ct.display_name == "string" && ct.display_name.trim().length > 0 ? ct.display_name.trim() : "SillyTavern-Roll Event", Ju = typeof Sr.version == "string" && Sr.version.trim().length > 0 ? Sr.version.trim() : "unknown", Kg = typeof ct.author == "string" && ct.author.trim().length > 0 ? ct.author.trim() : "Shion", Hg = typeof ct.email == "string" && ct.email.trim().length > 0 ? ct.email.trim() : "348591466@qq.com", Qu = typeof ct.homePage == "string" && /^https?:\/\//i.test(ct.homePage.trim()) ? ct.homePage.trim() : "https://github.com/ShionCox/SillyTavern-Roll", Gg = Qu.replace(/^https?:\/\//i, ""), zg = {
  SETTINGS_CARD_ID_Event: Gn,
  SETTINGS_DISPLAY_NAME_Event: Ug,
  SETTINGS_BADGE_ID_Event: ou,
  SETTINGS_BADGE_VERSION_Event: Ju,
  SETTINGS_AUTHOR_TEXT_Event: Kg,
  SETTINGS_EMAIL_TEXT_Event: Hg,
  SETTINGS_GITHUB_TEXT_Event: Gg,
  SETTINGS_GITHUB_URL_Event: Qu,
  SETTINGS_SEARCH_ID_Event: Ku,
  SETTINGS_TAB_MAIN_ID_Event: Hu,
  SETTINGS_TAB_AI_ID_Event: Gu,
  SETTINGS_TAB_SKILL_ID_Event: zu,
  SETTINGS_TAB_RULE_ID_Event: ju,
  SETTINGS_TAB_ABOUT_ID_Event: qu,
  SETTINGS_PANEL_MAIN_ID_Event: Fu,
  SETTINGS_PANEL_AI_ID_Event: Vu,
  SETTINGS_PANEL_SKILL_ID_Event: Yu,
  SETTINGS_PANEL_RULE_ID_Event: Wu,
  SETTINGS_PANEL_ABOUT_ID_Event: Xu,
  SETTINGS_ENABLED_ID_Event: Ni,
  SETTINGS_RULE_ID_Event: Li,
  SETTINGS_AI_ROLL_MODE_ID_Event: Mi,
  SETTINGS_AI_ROUND_CONTROL_ID_Event: Oi,
  SETTINGS_EXPLODING_ENABLED_ID_Event: Pi,
  SETTINGS_ADVANTAGE_ENABLED_ID_Event: Bi,
  SETTINGS_DYNAMIC_RESULT_GUIDANCE_ID_Event: Ui,
  SETTINGS_DYNAMIC_DC_REASON_ID_Event: Ki,
  SETTINGS_STATUS_SYSTEM_ENABLED_ID_Event: Hi,
  SETTINGS_STATUS_EDITOR_OPEN_ID_Event: Gi,
  SETTINGS_STATUS_MODAL_ID_Event: Ao,
  SETTINGS_STATUS_MODAL_CLOSE_ID_Event: au,
  SETTINGS_STATUS_REFRESH_ID_Event: zi,
  SETTINGS_STATUS_CLEAN_UNUSED_ID_Event: ji,
  SETTINGS_STATUS_ROWS_ID_Event: qi,
  SETTINGS_STATUS_ADD_ID_Event: iu,
  SETTINGS_STATUS_SAVE_ID_Event: lu,
  SETTINGS_STATUS_RESET_ID_Event: cu,
  SETTINGS_STATUS_ERRORS_ID_Event: Fi,
  SETTINGS_STATUS_DIRTY_HINT_ID_Event: Vi,
  SETTINGS_STATUS_LAYOUT_ID_Event: Lg,
  SETTINGS_STATUS_SIDEBAR_ID_Event: Mg,
  SETTINGS_STATUS_SPLITTER_ID_Event: du,
  SETTINGS_STATUS_CHAT_LIST_ID_Event: uu,
  SETTINGS_STATUS_CHAT_META_ID_Event: mu,
  SETTINGS_STATUS_COLS_ID_Event: hu,
  SETTINGS_STATUS_MEMORY_STATE_ID_Event: pu,
  SETTINGS_ALLOWED_DICE_SIDES_ID_Event: Yi,
  SETTINGS_THEME_ID_Event: Wi,
  SETTINGS_SUMMARY_DETAIL_ID_Event: Xi,
  SETTINGS_SUMMARY_ROUNDS_ID_Event: Ji,
  SETTINGS_SCOPE_ID_Event: Qi,
  SETTINGS_OUTCOME_BRANCHES_ID_Event: Zi,
  SETTINGS_EXPLODE_OUTCOME_ID_Event: el,
  SETTINGS_SUMMARY_OUTCOME_ID_Event: tl,
  SETTINGS_LIST_OUTCOME_PREVIEW_ID_Event: rl,
  SETTINGS_TIME_LIMIT_ENABLED_ID_Event: nl,
  SETTINGS_TIME_LIMIT_MIN_ID_Event: sl,
  SETTINGS_TIME_LIMIT_ROW_ID_Event: fu,
  SETTINGS_COMPATIBILITY_MODE_ID_Event: wu,
  SETTINGS_REMOVE_ROLLJSON_ID_Event: Iu,
  SETTINGS_STRIP_INTERNAL_ID_Event: Au,
  SETTINGS_SKILL_ENABLED_ID_Event: ol,
  SETTINGS_SKILL_EDITOR_WRAP_ID_Event: Og,
  SETTINGS_SKILL_COLS_ID_Event: al,
  SETTINGS_SKILL_ROWS_ID_Event: $o,
  SETTINGS_SKILL_ADD_ID_Event: gu,
  SETTINGS_SKILL_TEXT_ID_Event: vu,
  SETTINGS_SKILL_IMPORT_TOGGLE_ID_Event: bu,
  SETTINGS_SKILL_IMPORT_AREA_ID_Event: xu,
  SETTINGS_SKILL_IMPORT_APPLY_ID_Event: yu,
  SETTINGS_SKILL_EXPORT_ID_Event: Su,
  SETTINGS_SKILL_SAVE_ID_Event: Eu,
  SETTINGS_SKILL_RESET_ID_Event: _u,
  SETTINGS_SKILL_ERRORS_ID_Event: Tu,
  SETTINGS_SKILL_DIRTY_HINT_ID_Event: ku,
  SETTINGS_SKILL_PRESET_LAYOUT_ID_Event: Pg,
  SETTINGS_SKILL_PRESET_SIDEBAR_ID_Event: Bg,
  SETTINGS_SKILL_PRESET_LIST_ID_Event: il,
  SETTINGS_SKILL_PRESET_CREATE_ID_Event: $u,
  SETTINGS_SKILL_PRESET_DELETE_ID_Event: ll,
  SETTINGS_SKILL_PRESET_RESTORE_DEFAULT_ID_Event: Ru,
  SETTINGS_SKILL_PRESET_NAME_ID_Event: cl,
  SETTINGS_SKILL_PRESET_RENAME_ID_Event: Cu,
  SETTINGS_SKILL_PRESET_META_ID_Event: Du,
  SETTINGS_SKILL_EDITOR_OPEN_ID_Event: Nu,
  SETTINGS_SKILL_MODAL_ID_Event: Ro,
  SETTINGS_SKILL_MODAL_CLOSE_ID_Event: Lu,
  SETTINGS_RULE_SAVE_ID_Event: Mu,
  SETTINGS_RULE_RESET_ID_Event: Ou,
  SETTINGS_RULE_TEXT_ID_Event: dl,
  SETTINGS_AI_BRIDGE_STATUS_LIGHT_ID_Event: Pu,
  SETTINGS_AI_BRIDGE_STATUS_TEXT_ID_Event: Bu,
  SETTINGS_AI_BRIDGE_REFRESH_ID_Event: Uu
}, jg = {
  SETTINGS_TAB_MAIN_ID_Event: Hu,
  SETTINGS_TAB_AI_ID_Event: Gu,
  SETTINGS_TAB_SKILL_ID_Event: zu,
  SETTINGS_TAB_RULE_ID_Event: ju,
  SETTINGS_TAB_ABOUT_ID_Event: qu,
  SETTINGS_PANEL_MAIN_ID_Event: Fu,
  SETTINGS_PANEL_AI_ID_Event: Vu,
  SETTINGS_PANEL_SKILL_ID_Event: Yu,
  SETTINGS_PANEL_RULE_ID_Event: Wu,
  SETTINGS_PANEL_ABOUT_ID_Event: Xu,
  SETTINGS_SKILL_MODAL_ID_Event: Ro,
  SETTINGS_SKILL_EDITOR_OPEN_ID_Event: Nu,
  SETTINGS_SKILL_MODAL_CLOSE_ID_Event: Lu,
  SETTINGS_STATUS_MODAL_ID_Event: Ao,
  SETTINGS_STATUS_EDITOR_OPEN_ID_Event: Gi,
  SETTINGS_STATUS_MODAL_CLOSE_ID_Event: au,
  SETTINGS_STATUS_REFRESH_ID_Event: zi,
  SETTINGS_STATUS_CLEAN_UNUSED_ID_Event: ji,
  SETTINGS_SEARCH_ID_Event: Ku,
  SETTINGS_AI_BRIDGE_STATUS_LIGHT_ID_Event: Pu,
  SETTINGS_AI_BRIDGE_STATUS_TEXT_ID_Event: Bu,
  SETTINGS_AI_BRIDGE_REFRESH_ID_Event: Uu
}, Hs = {
  SETTINGS_THEME_ID_Event: Wi,
  SETTINGS_ENABLED_ID_Event: Ni,
  SETTINGS_RULE_ID_Event: Li,
  SETTINGS_AI_ROLL_MODE_ID_Event: Mi,
  SETTINGS_AI_ROUND_CONTROL_ID_Event: Oi,
  SETTINGS_EXPLODING_ENABLED_ID_Event: Pi,
  SETTINGS_ADVANTAGE_ENABLED_ID_Event: Bi,
  SETTINGS_DYNAMIC_RESULT_GUIDANCE_ID_Event: Ui,
  SETTINGS_DYNAMIC_DC_REASON_ID_Event: Ki,
  SETTINGS_STATUS_SYSTEM_ENABLED_ID_Event: Hi,
  SETTINGS_ALLOWED_DICE_SIDES_ID_Event: Yi,
  SETTINGS_SUMMARY_DETAIL_ID_Event: Xi,
  SETTINGS_SUMMARY_ROUNDS_ID_Event: Ji,
  SETTINGS_SCOPE_ID_Event: Qi,
  SETTINGS_OUTCOME_BRANCHES_ID_Event: Zi,
  SETTINGS_EXPLODE_OUTCOME_ID_Event: el,
  SETTINGS_SUMMARY_OUTCOME_ID_Event: tl,
  SETTINGS_LIST_OUTCOME_PREVIEW_ID_Event: rl,
  SETTINGS_TIME_LIMIT_ENABLED_ID_Event: nl,
  SETTINGS_TIME_LIMIT_MIN_ID_Event: sl,
  SETTINGS_COMPATIBILITY_MODE_ID_Event: wu,
  SETTINGS_REMOVE_ROLLJSON_ID_Event: Iu,
  SETTINGS_STRIP_INTERNAL_ID_Event: Au,
  SETTINGS_SKILL_ENABLED_ID_Event: ol
}, qg = {
  SETTINGS_SKILL_PRESET_LIST_ID_Event: il,
  SETTINGS_SKILL_PRESET_CREATE_ID_Event: $u,
  SETTINGS_SKILL_PRESET_DELETE_ID_Event: ll,
  SETTINGS_SKILL_PRESET_RESTORE_DEFAULT_ID_Event: Ru,
  SETTINGS_SKILL_PRESET_NAME_ID_Event: cl,
  SETTINGS_SKILL_PRESET_RENAME_ID_Event: Cu
}, Fg = {
  SETTINGS_SKILL_COLS_ID_Event: al,
  SETTINGS_SKILL_ROWS_ID_Event: $o,
  SETTINGS_SKILL_ADD_ID_Event: gu
}, Vg = {
  SETTINGS_SKILL_IMPORT_TOGGLE_ID_Event: bu,
  SETTINGS_SKILL_IMPORT_AREA_ID_Event: xu,
  SETTINGS_SKILL_TEXT_ID_Event: vu,
  SETTINGS_SKILL_IMPORT_APPLY_ID_Event: yu,
  SETTINGS_SKILL_EXPORT_ID_Event: Su,
  SETTINGS_SKILL_SAVE_ID_Event: Eu,
  SETTINGS_SKILL_RESET_ID_Event: _u
}, Yg = {
  SETTINGS_RULE_TEXT_ID_Event: dl,
  SETTINGS_RULE_SAVE_ID_Event: Mu,
  SETTINGS_RULE_RESET_ID_Event: Ou
}, Wg = {
  SETTINGS_CARD_ID_Event: Gn,
  SETTINGS_THEME_ID_Event: Wi,
  SETTINGS_ENABLED_ID_Event: Ni,
  SETTINGS_RULE_ID_Event: Li,
  SETTINGS_AI_ROLL_MODE_ID_Event: Mi,
  SETTINGS_AI_ROUND_CONTROL_ID_Event: Oi,
  SETTINGS_EXPLODING_ENABLED_ID_Event: Pi,
  SETTINGS_ADVANTAGE_ENABLED_ID_Event: Bi,
  SETTINGS_DYNAMIC_RESULT_GUIDANCE_ID_Event: Ui,
  SETTINGS_DYNAMIC_DC_REASON_ID_Event: Ki,
  SETTINGS_STATUS_SYSTEM_ENABLED_ID_Event: Hi,
  SETTINGS_ALLOWED_DICE_SIDES_ID_Event: Yi,
  SETTINGS_SUMMARY_DETAIL_ID_Event: Xi,
  SETTINGS_SUMMARY_ROUNDS_ID_Event: Ji,
  SETTINGS_SCOPE_ID_Event: Qi,
  SETTINGS_OUTCOME_BRANCHES_ID_Event: Zi,
  SETTINGS_EXPLODE_OUTCOME_ID_Event: el,
  SETTINGS_SUMMARY_OUTCOME_ID_Event: tl,
  SETTINGS_LIST_OUTCOME_PREVIEW_ID_Event: rl,
  SETTINGS_TIME_LIMIT_ENABLED_ID_Event: nl,
  SETTINGS_TIME_LIMIT_MIN_ID_Event: sl,
  SETTINGS_TIME_LIMIT_ROW_ID_Event: fu,
  SETTINGS_SKILL_ENABLED_ID_Event: ol,
  SETTINGS_SKILL_MODAL_ID_Event: Ro,
  SETTINGS_STATUS_EDITOR_OPEN_ID_Event: Gi,
  SETTINGS_STATUS_MODAL_ID_Event: Ao,
  SETTINGS_STATUS_ROWS_ID_Event: qi,
  SETTINGS_STATUS_ERRORS_ID_Event: Fi,
  SETTINGS_STATUS_DIRTY_HINT_ID_Event: Vi,
  SETTINGS_RULE_TEXT_ID_Event: dl,
  SETTINGS_SKILL_ROWS_ID_Event: $o
}, Xg = "<dice_rules>", Jg = "</dice_rules>", Zu = "<dice_round_summary>", em = "</dice_round_summary>", Qg = "<dice_result_guidance>", Zg = "</dice_result_guidance>", ev = "<dice_runtime_policy>", tv = "</dice_runtime_policy>", rv = "<dice_active_statuses>", nv = "</dice_active_statuses>", Co = "skill_preset_default_general_trpg", tm = "通用叙事TRPG（默认）", rm = "新预设", sv = {
  察觉: 3,
  说服: 2,
  潜行: 1,
  调查: 3,
  交涉: 2,
  意志: 1,
  反应: 2,
  体能: 1,
  医疗: 3,
  知识: 2
}, nm = JSON.stringify(sv, null, 2), sm = /^P(?=\d|T\d)(\d+Y)?(\d+M)?(\d+W)?(\d+D)?(T(?=\d)(\d+H)?(\d+M)?(\d+S)?)?$/i;
var Pn = {
  enabled: !0,
  autoSendRuleToAI: !0,
  enableAiRollMode: !0,
  enableAiRoundControl: !1,
  enableExplodingDice: !0,
  enableAdvantageSystem: !0,
  enableDynamicResultGuidance: !1,
  enableDynamicDcReason: !0,
  enableStatusSystem: !0,
  aiAllowedDiceSidesText: "4,6,8,10,12,20,100",
  theme: "default",
  summaryDetailMode: "minimal",
  summaryHistoryRounds: 3,
  eventApplyScope: "protagonist_only",
  enableOutcomeBranches: !0,
  enableExplodeOutcomeBranch: !0,
  includeOutcomeInSummary: !0,
  showOutcomePreviewInListCard: !0,
  enableTimeLimit: !0,
  minTimeLimitSeconds: 10,
  enableSkillSystem: !0,
  skillTableText: "{}",
  skillPresetStoreText: "",
  ruleTextModeVersion: 2,
  ruleText: ""
};
function Se(e, t) {
  const r = String(e ?? "").trim();
  return r ? r.replace(/\s+/g, "_") : t;
}
function $t(e, t) {
  return Se(e, t).replace(/\.(jsonl|json)$/i, "");
}
function ul(e) {
  return String(e ?? "").trim().toLowerCase().replace(/^default_/i, "").replace(/\.[a-z0-9]+$/i, "").replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
}
function om(e, t) {
  const r = Se(e, "").toLowerCase(), n = ul(String(e ?? "")), o = String(t?.characterId ?? "").trim().toLowerCase(), i = !!o && o !== "-1" && o !== "unknown";
  return (/* @__PURE__ */ new Set([
    "",
    "default_role",
    "unknown_role",
    "unknown_character",
    "default",
    "unknown"
  ])).has(r) || (/* @__PURE__ */ new Set([
    "",
    "default role",
    "unknown role",
    "unknown character",
    "未知角色"
  ])).has(n) ? !1 : (/* @__PURE__ */ new Set([
    "assistant",
    "ai",
    "bot",
    "system",
    "helper",
    "助手",
    "助理"
  ])).has(n) ? i : !0;
}
function it(e) {
  const t = String(e ?? "").trim();
  return !t || t === "fallback_chat";
}
function sn(e) {
  return `${Se(e.tavernInstanceId, "unknown_tavern")}::${Se(e.scopeType, "character")}::${Se(e.scopeId, "unknown_scope")}::${$t(e.chatId, "fallback_chat")}`;
}
function ov(e) {
  const t = String(e ?? "").split("::");
  return {
    tavernInstanceId: Se(t[0], "unknown_tavern"),
    scopeType: String(t[1] ?? "").trim() === "group" ? "group" : "character",
    scopeId: Se(t[2], "unknown_scope"),
    chatId: Se(t.slice(3).join("::"), "fallback_chat")
  };
}
function Gs(e, t) {
  return e === "group" ? Se(t, "unknown_scope").toLowerCase() : Se(ul(t) || t, "unknown_scope").toLowerCase();
}
function Gt(e) {
  const t = Se(e.tavernInstanceId, "unknown_tavern").toLowerCase(), r = e.scopeType === "group" ? "group" : "character", n = Gs(r, String(e.scopeId ?? "")), o = $t(e.chatId, "fallback_chat").toLowerCase();
  return !t || !n || !o || it(o) ? "" : `${t}::${r}::${n}::${o}`;
}
function Ze(e, t) {
  const r = Se(t?.tavernInstanceId, "unknown_tavern"), n = t?.scopeType === "group" ? "group" : "character", o = Gs(n, String(t?.scopeId ?? ""));
  if (typeof e == "string") {
    const u = String(e ?? "").trim();
    if (u.split("::").length >= 4) {
      const h = ov(u), f = h.scopeType === "group" ? "group" : "character";
      return {
        tavernInstanceId: Se(h.tavernInstanceId, r),
        scopeType: f,
        scopeId: Gs(f, h.scopeId),
        chatId: Se(h.chatId, "fallback_chat")
      };
    }
    return {
      tavernInstanceId: r,
      scopeType: n,
      scopeId: o,
      chatId: Se(u, "fallback_chat")
    };
  }
  const i = e ?? {}, c = i.scopeType === "group" ? "group" : n;
  return {
    tavernInstanceId: Se(i.tavernInstanceId, r),
    scopeType: c,
    scopeId: Gs(c, String(i.scopeId ?? o)),
    chatId: Se(i.chatId, "fallback_chat")
  };
}
var $a = "stx.rollhelper.tavernInstanceId", am = "stx.rollhelper.tavernInstanceId.fallback";
function av() {
  try {
    const e = globalThis.SillyTavern?.getContext?.();
    if (!e || typeof e != "object") return null;
    const t = e.accountStorage;
    if (!t || typeof t != "object") return null;
    const r = t;
    return typeof r.getItem != "function" || typeof r.setItem != "function" ? null : r;
  } catch {
    return null;
  }
}
function Bc(e) {
  const t = String(e ?? "").trim();
  return /^[a-zA-Z0-9_-]{8,128}$/.test(t);
}
function iv() {
  const e = (() => {
    try {
      if (typeof crypto < "u" && typeof crypto.randomUUID == "function") return crypto.randomUUID();
    } catch {
    }
    return "";
  })();
  return e ? `tavern_${e.replace(/-/g, "_")}` : `tavern_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}
function lv() {
  try {
    const e = localStorage.getItem(am);
    return String(e ?? "").trim();
  } catch {
    return "";
  }
}
function Uc(e) {
  try {
    localStorage.setItem(am, e);
  } catch {
  }
}
function Do() {
  const e = av(), t = e && typeof e.getItem == "function" ? String(e.getItem($a) ?? "").trim() : "", r = lv(), n = Bc(t) ? t : Bc(r) ? r : "";
  if (n) {
    if (e && typeof e.setItem == "function" && n !== t) try {
      e.setItem($a, n);
    } catch {
    }
    return n !== r && Uc(n), n;
  }
  const o = iv();
  if (e && typeof e.setItem == "function") try {
    e.setItem($a, o);
  } catch {
  }
  return Uc(o), o;
}
function No() {
  try {
    const e = globalThis.SillyTavern?.getContext?.();
    return !e || typeof e != "object" ? null : e;
  } catch {
    return null;
  }
}
function im(e) {
  const t = Array.isArray(e?.characters) ? e.characters : [], r = [e?.characterId, e?.this_chid];
  for (const o of r) {
    const i = Number(o);
    if (Number.isInteger(i) && i >= 0 && i < t.length) return {
      character: t[i],
      index: i
    };
  }
  const n = String(e?.characterName ?? e?.name2 ?? "").trim().toLowerCase();
  if (n) {
    const o = t.findIndex((i) => String(i?.name ?? "").trim().toLowerCase() === n);
    if (o >= 0) return {
      character: t[o],
      index: o
    };
  }
  return t.length === 1 ? {
    character: t[0],
    index: 0
  } : {
    character: null,
    index: -1
  };
}
function cv(e, t) {
  const r = e?.chat, n = r && typeof r == "object" && !Array.isArray(r) ? r.id : "";
  return $t(t?.chat ?? e?.chatId ?? e?.chat_id ?? n, "fallback_chat");
}
function dv(e) {
  const t = im(e), r = t.character, n = Se(r?.avatar, ""), o = String(r?.name ?? e?.characterName ?? e?.name2 ?? e?.name1 ?? "").trim() || "未知角色", i = Se(n || o, ""), c = om(i, { characterId: t.index }) ? i : "";
  return {
    roleId: c,
    roleKey: c ? ul(c) : "",
    displayName: o,
    avatarName: n,
    avatarUrl: n ? `/characters/${encodeURIComponent(n)}` : ""
  };
}
function uv(e) {
  const t = String(e?.groupId ?? "").trim();
  return t ? (Array.isArray(e?.groups) ? e.groups : []).find((r) => String(r?.id ?? "").trim() === t) ?? null : null;
}
function cn() {
  const e = No();
  if (!e) return null;
  const t = Do(), r = uv(e);
  if (r) {
    const c = Se(r.id, "no_group"), u = $t(r.chat_id, "fallback_chat");
    return {
      tavernInstanceId: t,
      scopeType: "group",
      scopeId: c,
      roleKey: `group:${c}`,
      roleId: `group:${c}`,
      displayName: String(r.name ?? c).trim() || c,
      avatarUrl: String(r.avatar_url ?? "").trim(),
      groupId: c,
      characterId: -1,
      currentChatId: u
    };
  }
  const n = im(e), o = dv(e), i = cv(e, n.character);
  return {
    tavernInstanceId: t,
    scopeType: "character",
    scopeId: o.roleKey || "unknown_scope",
    roleKey: o.roleKey,
    roleId: o.roleId,
    displayName: o.displayName,
    avatarUrl: o.avatarUrl,
    groupId: "no_group",
    characterId: n.index,
    currentChatId: i
  };
}
function dn() {
  const e = No();
  return !e || typeof e != "object" ? null : e;
}
function mv() {
  const e = dn();
  return !e?.extensionSettings || typeof e.extensionSettings != "object" ? null : e.extensionSettings;
}
function lm() {
  const e = dn();
  return !e?.eventSource || typeof e.eventSource != "object" ? null : e.eventSource;
}
function cm() {
  const e = dn();
  return !e?.event_types || typeof e.event_types != "object" ? null : e.event_types;
}
function Lo() {
  const e = dn();
  return {
    parser: e?.SlashCommandParser ?? null,
    command: e?.SlashCommand ?? null,
    argument: e?.SlashCommandArgument ?? null,
    namedArgument: e?.SlashCommandNamedArgument ?? null,
    argumentType: e?.ARGUMENT_TYPE && typeof e.ARGUMENT_TYPE == "object" ? e.ARGUMENT_TYPE : null
  };
}
function hv(e, t) {
  const r = dn();
  typeof r?.registerMacro == "function" && r.registerMacro(e, t);
}
function pv(e) {
  return String(e ?? "");
}
function dm(e) {
  return !e || typeof e != "object" ? "" : String(e.role ?? "").trim().toLowerCase();
}
function fv(e) {
  const t = [];
  for (const r of e) {
    if (typeof r == "string") {
      t.push(r);
      continue;
    }
    if (!r || typeof r != "object") continue;
    const n = r, o = n.text ?? n.content ?? "";
    typeof o == "string" && o && t.push(o);
  }
  return t.join(`
`);
}
function um(e, t) {
  if (typeof e == "string") return t;
  if (Array.isArray(e)) {
    const r = e[0];
    if (typeof r == "string") return [t];
    if (r && typeof r == "object") {
      const n = r;
      if (typeof n.text == "string") return [{
        ...n,
        text: t
      }];
      if (typeof n.content == "string") return [{
        ...n,
        content: t
      }];
    }
    return [{
      type: "text",
      text: t
    }];
  }
  if (e && typeof e == "object") {
    const r = e;
    return typeof r.text == "string" ? {
      ...r,
      text: t
    } : typeof r.content == "string" ? {
      ...r,
      content: t
    } : {
      ...r,
      text: t
    };
  }
  return t;
}
function gv(e) {
  return um(e?.content ?? "", "");
}
function vv(e) {
  const t = e && typeof e == "object" ? e : null, r = {
    role: "system",
    is_system: !0
  }, n = !!t && Object.prototype.hasOwnProperty.call(t, "content"), o = !!t && Object.prototype.hasOwnProperty.call(t, "mes"), i = !!t && Object.prototype.hasOwnProperty.call(t, "text");
  return (n || !o && !i) && (r.content = gv(e)), o && (r.mes = ""), i && (r.text = ""), r;
}
function Kc(e, t) {
  const r = Object.prototype.hasOwnProperty.call(e, "content"), n = Object.prototype.hasOwnProperty.call(e, "mes"), o = Object.prototype.hasOwnProperty.call(e, "text");
  r && (e.content = um(e.content, t)), n && (e.mes = t), o && (e.text = t), !r && !n && !o && (e.content = t);
}
function bv(e, t) {
  const r = t?.insertMode ?? "before_index";
  if (r === "append") return Math.max(0, e);
  if (r === "before_end_offset") {
    const o = Math.max(0, Math.floor(Number(t?.offsetFromEnd) || 0));
    return o <= 0 ? Math.max(0, e) : Math.max(0, e - o);
  }
  const n = Math.floor(Number(t?.insertBeforeIndex) || 0);
  return Math.max(0, Math.min(n, e));
}
function xv(e) {
  if (!e || typeof e != "object") return "";
  if (typeof e.content == "string") return e.content;
  if (Array.isArray(e.content)) return fv(e.content);
  if (e.content && typeof e.content == "object") {
    const t = e.content;
    if (typeof t.text == "string") return t.text;
  }
  return typeof e.mes == "string" ? e.mes : typeof e.text == "string" ? e.text : "";
}
function mm(e, t) {
  if (!e || typeof e != "object") return;
  const r = pv(t);
  Kc(e, r);
  const n = Number(e.swipe_id ?? e.swipeId), o = e.swipes;
  if (!Array.isArray(o) || !Number.isFinite(n) || n < 0 || n >= o.length) return;
  const i = o[n];
  if (typeof i == "string") {
    o[n] = r;
    return;
  }
  i && typeof i == "object" && Kc(i, r);
}
function hm(e) {
  return !e || typeof e != "object" ? !1 : e.is_user === !0 ? !0 : dm(e) === "user";
}
function pm(e) {
  return !e || typeof e != "object" ? !1 : e.is_system === !0 ? !0 : dm(e) === "system";
}
function yv(e) {
  if (!Array.isArray(e)) return -1;
  for (let t = e.length - 1; t >= 0; t -= 1) if (pm(e[t])) return t;
  return -1;
}
function Sv(e) {
  if (!Array.isArray(e)) return -1;
  for (let t = e.length - 1; t >= 0; t -= 1) if (hm(e[t])) return t;
  return -1;
}
function fm(e) {
  const t = [], r = /* @__PURE__ */ new Set(), n = (u, h) => {
    if (!Array.isArray(h)) return;
    const f = h;
    r.has(f) || (r.add(f), t.push({
      path: u,
      messages: f
    }));
  };
  if (Array.isArray(e))
    return n("payload", e), t;
  if (!e || typeof e != "object") return t;
  const o = e, i = o.prompt && typeof o.prompt == "object" ? o.prompt : null, c = o.data && typeof o.data == "object" ? o.data : null;
  return n("payload.chatCompletion.messages", (o.chatCompletion && typeof o.chatCompletion == "object" ? o.chatCompletion : null)?.messages), n("payload.messages", o.messages), n("payload.prompt.messages", i?.messages), n("payload.data.messages", c?.messages), n("payload.chat", o.chat), n("payload.prompt.chat", i?.chat), n("payload.data.chat", c?.chat), n("payload.message_list", o.message_list), t;
}
function Ev(e) {
  return fm(e)[0]?.messages ?? null;
}
function _v(e, t) {
  const r = vv(t?.template);
  t?.text != null && mm(r, t.text);
  const n = bv(e.length, t);
  return e.splice(n, 0, r), r;
}
function Tv() {
  const e = cn();
  return e ? sn({
    ...e,
    chatId: e.currentChatId
  }) : "";
}
function gm(e) {
  const t = Number(e);
  if (Number.isFinite(t) && t > 0) return t;
  const r = new Date(String(e ?? "")).getTime();
  return Number.isFinite(r) && r > 0 ? r : 0;
}
function vm() {
  const e = No();
  if (e && typeof e.getRequestHeaders == "function") {
    const t = e.getRequestHeaders();
    if (t && typeof t == "object") return t;
  }
  return { "Content-Type": "application/json" };
}
async function kv(e) {
  const t = String(e.avatar ?? "").trim();
  if (!t) return [];
  try {
    const r = await fetch("/api/characters/chats", {
      method: "POST",
      headers: vm(),
      body: JSON.stringify({ avatar_url: t })
    });
    if (!r.ok) return [];
    const n = await r.json();
    return !n || typeof n != "object" ? [] : n.error === !0 ? [] : Object.values(n);
  } catch {
    return [];
  }
}
async function wv(e) {
  const t = [];
  for (const r of e) {
    const n = Se(r, "");
    if (n)
      try {
        const o = await fetch("/api/chats/group/info", {
          method: "POST",
          headers: vm(),
          body: JSON.stringify({ id: n })
        });
        if (!o.ok) continue;
        const i = await o.json();
        t.push(i ?? { file_name: n });
      } catch {
      }
  }
  return t;
}
function Iv(e) {
  return [...e].sort((t, r) => {
    const n = Number(r.updatedAt) - Number(t.updatedAt);
    return n !== 0 ? n : String(r.locator.chatId).localeCompare(String(t.locator.chatId));
  });
}
function Av(e, t, r) {
  const n = Se(t.avatar, ""), o = String(t.name ?? "").trim(), i = Se(n || o, "");
  if (!om(i, { characterId: r })) return null;
  const c = String(i).trim().toLowerCase().replace(/^default_/i, "").replace(/\.[a-z0-9]+$/i, "").replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim() || i;
  return {
    tavernInstanceId: e,
    scopeType: "character",
    scopeId: c,
    roleKey: c,
    roleId: i,
    displayName: o || i,
    avatarUrl: n ? `/characters/${encodeURIComponent(n)}` : "",
    groupId: "no_group",
    characterId: r,
    currentChatId: $t(t.chat, "fallback_chat")
  };
}
function $v(e, t) {
  const r = Se(t.id, "");
  return r ? {
    tavernInstanceId: e,
    scopeType: "group",
    scopeId: r,
    roleKey: `group:${r}`,
    roleId: `group:${r}`,
    displayName: String(t.name ?? r).trim() || r,
    avatarUrl: String(t.avatar_url ?? "").trim(),
    groupId: r,
    characterId: -1,
    currentChatId: $t(t.chat_id, "fallback_chat")
  } : null;
}
function bm(e, t) {
  const r = $t(t.chatId, "fallback_chat");
  if (it(r)) return e;
  const n = {
    ...t,
    chatId: r
  }, o = sn(n);
  return e.some((i) => sn(i.locator) === o) ? e : [{
    locator: n,
    updatedAt: 0,
    messageCount: 0
  }, ...e];
}
async function Rv(e, t) {
  const r = Array.isArray(t.characters) ? t.characters : [], n = [];
  for (let o = 0; o < r.length; o += 1) {
    const i = r[o], c = Av(e, i, o);
    if (!c) continue;
    const u = (await kv(i)).map((h) => {
      const f = $t(h.file_name, "");
      return !f || it(f) ? null : {
        locator: {
          ...c,
          chatId: f
        },
        updatedAt: gm(h.last_mes),
        messageCount: Number(h.message_count) || 0
      };
    }).filter((h) => !!h);
    n.push(...bm(u, {
      ...c,
      chatId: c.currentChatId
    }));
  }
  return n;
}
async function Cv(e, t) {
  const r = Array.isArray(t.groups) ? t.groups : [], n = [];
  for (const o of r) {
    const i = $v(e, o);
    if (!i) continue;
    const c = new Set((Array.isArray(o.chats) ? o.chats : []).map((f) => Se(f, "")).filter(Boolean)), u = Se(o.chat_id, "");
    u && c.add(u);
    const h = (await wv(Array.from(c))).map((f) => {
      const v = $t(f.file_name, "");
      return !v || it(v) ? null : {
        locator: {
          ...i,
          chatId: v
        },
        updatedAt: gm(f.last_mes),
        messageCount: Number(f.message_count) || 0
      };
    }).filter((f) => !!f);
    n.push(...bm(h, {
      ...i,
      chatId: i.currentChatId
    }));
  }
  return n;
}
function Dv(e) {
  const t = /* @__PURE__ */ new Map();
  for (const r of e) {
    const n = sn(r.locator), o = t.get(n);
    (!o || Number(r.updatedAt) >= Number(o.updatedAt)) && t.set(n, r);
  }
  return Array.from(t.values());
}
async function Nv() {
  const e = No();
  if (!e) return [];
  const t = Do(), [r, n] = await Promise.all([Rv(t, e), Cv(t, e)]);
  return Iv(Dv([...r, ...n]));
}
function Fr(e) {
  const t = Ze(e);
  return String(t.chatId ?? "").trim() || "unknown_chat";
}
function Hc(e) {
  return e === "host" ? 5 : e === "current" ? 4 : e === "local" ? 3 : e === "draft" ? 2 : 1;
}
function Lv(e) {
  const t = Ze(e.chatKey);
  return {
    chatKey: String(e.chatKey ?? "").trim(),
    updatedAt: Number(e.updatedAt) || 0,
    chatId: Se(e.chatId || t.chatId, "fallback_chat"),
    displayName: String(e.displayName ?? "").trim(),
    avatarUrl: String(e.avatarUrl ?? "").trim(),
    scopeType: e.scopeType === "group" ? "group" : "character",
    scopeId: Se(e.scopeId || t.scopeId, "unknown_scope"),
    roleKey: String(e.roleKey ?? "").trim()
  };
}
function Mv(e) {
  return {
    chatKey: String(e.chatKey ?? "").trim(),
    updatedAt: Number(e.updatedAt) || 0,
    activeStatusCount: Number(e.activeStatusCount) || 0,
    displayName: String(e.displayName ?? "").trim(),
    avatarUrl: String(e.avatarUrl ?? "").trim(),
    roleKey: String(e.roleKey ?? "").trim()
  };
}
function Ov(e) {
  const t = String(e.currentChatKey ?? "").trim(), r = Do(), n = Ze(t, { tavernInstanceId: r }), o = Gt(n), i = /* @__PURE__ */ new Map(), c = Array.isArray(e.taggedChatKeys) ? e.taggedChatKeys : [], u = new Set(c.map((S) => Gt(Ze(S, { tavernInstanceId: n.tavernInstanceId || r }))).filter(Boolean)), h = (S, _, P) => {
    if (!S) return;
    const L = i.get(S);
    if (!L) {
      i.set(S, {
        ...P,
        canonicalPriority: Hc(_)
      });
      return;
    }
    const M = Hc(_), B = !L.chatKey || M > L.canonicalPriority ? P.chatKey : L.chatKey;
    i.set(S, {
      chatKey: B,
      entityKey: S,
      chatId: String(L.chatId ?? "").trim() || String(P.chatId ?? "").trim(),
      displayName: (L.fromHost ? String(L.displayName ?? "").trim() : "") || (_ === "host" ? String(P.displayName ?? "").trim() : "") || String(L.displayName ?? "").trim() || String(P.displayName ?? "").trim() || Fr(B),
      avatarUrl: (L.fromHost ? String(L.avatarUrl ?? "").trim() : "") || (_ === "host" ? String(P.avatarUrl ?? "").trim() : "") || String(L.avatarUrl ?? "").trim() || String(P.avatarUrl ?? "").trim(),
      scopeType: L.scopeType || P.scopeType,
      scopeId: String(L.scopeId ?? "").trim() || String(P.scopeId ?? "").trim(),
      roleKey: String(L.roleKey ?? "").trim() || String(P.roleKey ?? "").trim(),
      updatedAt: Math.max(Number(L.updatedAt) || 0, Number(P.updatedAt) || 0),
      activeStatusCount: Math.max(Number(L.activeStatusCount) || 0, Number(P.activeStatusCount) || 0),
      isCurrent: !!L.isCurrent || !!P.isCurrent,
      fromHost: !!L.fromHost || !!P.fromHost,
      fromLocal: !!L.fromLocal || !!P.fromLocal,
      fromDraft: !!L.fromDraft || !!P.fromDraft,
      fromTagged: !!L.fromTagged || !!P.fromTagged,
      canonicalPriority: Math.max(L.canonicalPriority, M)
    });
  }, f = (S) => {
    const _ = Ze(S, { tavernInstanceId: n.tavernInstanceId || r });
    return !_.chatId || it(_.chatId) ? !1 : !n.tavernInstanceId || n.tavernInstanceId === "unknown_tavern" ? !!(_.tavernInstanceId && _.tavernInstanceId !== "unknown_tavern") : _.tavernInstanceId === n.tavernInstanceId;
  }, v = (Array.isArray(e.hostChats) ? e.hostChats : []).map(Lv);
  for (const S of v) {
    if (!S.chatKey || !f(S.chatKey) || !S.chatId || it(S.chatId)) continue;
    const _ = Ze({
      tavernInstanceId: n.tavernInstanceId || r,
      scopeType: S.scopeType,
      scopeId: S.scopeId,
      chatId: S.chatId
    }, { tavernInstanceId: n.tavernInstanceId || r }), P = Gt(_);
    h(P, "host", {
      chatKey: S.chatKey,
      entityKey: P,
      chatId: _.chatId,
      displayName: S.displayName || Fr(S.chatKey),
      avatarUrl: S.avatarUrl,
      scopeType: _.scopeType,
      scopeId: _.scopeId,
      roleKey: S.roleKey,
      updatedAt: S.updatedAt,
      activeStatusCount: 0,
      isCurrent: S.chatKey === t,
      fromHost: !0,
      fromLocal: !1,
      fromDraft: !1,
      fromTagged: u.has(P)
    });
  }
  const x = (Array.isArray(e.localSummaries) ? e.localSummaries : []).map(Mv);
  for (const S of x) {
    if (!S.chatKey || !f(S.chatKey)) continue;
    const _ = Ze(S.chatKey, { tavernInstanceId: n.tavernInstanceId || r });
    if (!_.chatId || it(_.chatId)) continue;
    const P = Gt(_);
    h(P, "local", {
      chatKey: S.chatKey,
      entityKey: P,
      chatId: _.chatId,
      displayName: S.displayName || Fr(S.chatKey),
      avatarUrl: S.avatarUrl || "",
      scopeType: _.scopeType,
      scopeId: _.scopeId,
      roleKey: S.roleKey || "",
      updatedAt: S.updatedAt,
      activeStatusCount: Number(S.activeStatusCount) || 0,
      isCurrent: S.chatKey === t,
      fromHost: !1,
      fromLocal: !0,
      fromDraft: !1,
      fromTagged: u.has(P)
    });
  }
  const y = Array.isArray(e.draftChatKeys) ? e.draftChatKeys : [];
  for (const S of y.map((_) => String(_ ?? "").trim()).filter(Boolean)) {
    if (!f(S)) continue;
    const _ = Ze(S, { tavernInstanceId: n.tavernInstanceId || r });
    if (!_.chatId || it(_.chatId)) continue;
    const P = Gt(_);
    h(P, "draft", {
      chatKey: S,
      entityKey: P,
      chatId: _.chatId,
      displayName: Fr(S),
      avatarUrl: "",
      scopeType: _.scopeType,
      scopeId: _.scopeId,
      roleKey: "",
      updatedAt: 0,
      activeStatusCount: 0,
      isCurrent: S === t,
      fromHost: !1,
      fromLocal: !1,
      fromDraft: !0,
      fromTagged: u.has(P)
    });
  }
  for (const S of c.map((_) => String(_ ?? "").trim()).filter(Boolean)) {
    if (!f(S)) continue;
    const _ = Ze(S, { tavernInstanceId: n.tavernInstanceId || r });
    if (!_.chatId || it(_.chatId)) continue;
    const P = Gt(_);
    h(P, "tagged", {
      chatKey: S,
      entityKey: P,
      chatId: _.chatId,
      displayName: Fr(S),
      avatarUrl: "",
      scopeType: _.scopeType,
      scopeId: _.scopeId,
      roleKey: "",
      updatedAt: 0,
      activeStatusCount: 0,
      isCurrent: S === t,
      fromHost: !1,
      fromLocal: !1,
      fromDraft: !1,
      fromTagged: !0
    });
  }
  return t && o && !i.has(o) && !it(n.chatId) && h(o, "current", {
    chatKey: t,
    entityKey: o,
    chatId: n.chatId,
    displayName: Fr(t),
    avatarUrl: "",
    scopeType: n.scopeType,
    scopeId: n.scopeId,
    roleKey: "",
    updatedAt: Date.now(),
    activeStatusCount: 0,
    isCurrent: !0,
    fromHost: !1,
    fromLocal: !1,
    fromDraft: !1,
    fromTagged: u.has(o)
  }), Array.from(i.values()).map(({ canonicalPriority: S, ..._ }) => _).sort((S, _) => {
    if (S.isCurrent !== _.isCurrent) return Number(_.isCurrent) - Number(S.isCurrent);
    const P = S.fromDraft ? 1 : 0, L = _.fromDraft ? 1 : 0;
    return P !== L ? L - P : S.fromHost !== _.fromHost ? Number(_.fromHost) - Number(S.fromHost) : Number(_.updatedAt) - Number(S.updatedAt);
  });
}
var zn = "st-rh-roll-console", ml = "st-rh-roll-console-body", Gc = "st-rh-roll-console-style", Pv = 50, hl = !1;
function Bv() {
  if (document.getElementById(Gc)) return;
  const e = document.createElement("style");
  e.id = Gc, e.textContent = `
    #${zn} {
      position: fixed;
      bottom: 60px;
      right: 16px;
      width: clamp(340px, 28vw, 480px);
      max-height: 55vh;
      background: linear-gradient(180deg, rgba(24,20,17,0.97), rgba(12,10,8,0.99));
      border: 1px solid rgba(176,143,76,0.35);
      border-radius: 10px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.04);
      display: flex;
      flex-direction: column;
      z-index: 10020;
      font-family: "Segoe UI", system-ui, sans-serif;
      font-size: 13px;
      color: #e8dcc6;
      overflow: hidden;
      transition: opacity 180ms ease, transform 180ms ease;
    }
    #${zn}.st-rh-console-hidden {
      opacity: 0;
      pointer-events: none;
      transform: translateY(12px);
    }
    .st-rh-console-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 14px;
      border-bottom: 1px solid rgba(176,143,76,0.2);
      background: rgba(30,25,20,0.6);
      user-select: none;
      flex-shrink: 0;
    }
    .st-rh-console-title {
      font-weight: 600;
      font-size: 12px;
      letter-spacing: 0.5px;
      color: #d1b67f;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .st-rh-console-close {
      background: none;
      border: none;
      color: rgba(236,219,183,0.55);
      cursor: pointer;
      font-size: 14px;
      padding: 2px 6px;
      border-radius: 4px;
      transition: color 120ms ease, background 120ms ease;
    }
    .st-rh-console-close:hover {
      color: #f3e6c3;
      background: rgba(176,143,76,0.15);
    }
    #${ml} {
      flex: 1;
      overflow-y: auto;
      padding: 10px 14px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      scrollbar-width: thin;
      scrollbar-color: rgba(176,143,76,0.25) transparent;
    }
    .st-rh-console-entry {
      padding: 8px 10px;
      border-radius: 6px;
      border: 1px solid rgba(176,143,76,0.15);
      background: rgba(20,17,14,0.5);
      font-size: 12.5px;
      line-height: 1.55;
      word-break: break-word;
      animation: st-rh-console-fadein 200ms ease;
    }
    .st-rh-console-entry.st-rh-console-info {
      border-color: rgba(173,201,255,0.2);
      background: rgba(20,30,50,0.35);
    }
    .st-rh-console-entry.st-rh-console-warn {
      border-color: rgba(255,196,87,0.25);
      background: rgba(50,40,15,0.35);
    }
    .st-rh-console-entry.st-rh-console-error {
      border-color: rgba(255,120,120,0.25);
      background: rgba(50,20,20,0.35);
    }
    .st-rh-console-entry.st-rh-console-card {
      padding: 0;
      border: none;
      background: none;
    }
    .st-rh-console-empty {
      text-align: center;
      color: rgba(236,219,183,0.4);
      font-size: 12px;
      padding: 24px 0;
    }
    @keyframes st-rh-console-fadein {
      from { opacity: 0; transform: translateY(6px); }
      to   { opacity: 1; transform: translateY(0); }
    }
  `, document.head.appendChild(e);
}
function xm() {
  Bv();
  let e = document.getElementById(zn);
  return e || (e = document.createElement("div"), e.id = zn, e.classList.add("st-rh-console-hidden"), e.innerHTML = `
    <div class="st-rh-console-header">
      <span class="st-rh-console-title">
        <i class="fa-solid fa-dice-d20" aria-hidden="true"></i>
        Roll Console
      </span>
      <button class="st-rh-console-close" data-rh-console-close="1" aria-label="关闭">
        <i class="fa-solid fa-xmark" aria-hidden="true"></i>
      </button>
    </div>
    <div id="${ml}">
      <div class="st-rh-console-empty">暂无输出</div>
    </div>
  `, document.body.appendChild(e), e.querySelector("[data-rh-console-close]")?.addEventListener("click", () => {
    Gv();
  }), e);
}
function pl() {
  return document.getElementById(ml);
}
function Uv() {
  const e = pl();
  if (!e) return;
  const t = e.querySelectorAll(".st-rh-console-entry");
  for (; t.length > Pv; ) t[0].remove();
}
function Kv() {
  const e = pl();
  if (!e) return;
  const t = e.querySelector(".st-rh-console-empty");
  t && t.remove();
}
function Er(e, t = "info") {
  xm();
  const r = pl();
  if (!r) return;
  Kv();
  const n = document.createElement("div");
  n.className = `st-rh-console-entry st-rh-console-${t}`, n.innerHTML = e, r.appendChild(n), Uv(), r.scrollTop = r.scrollHeight, hl || Hv();
}
function Hv() {
  xm().classList.remove("st-rh-console-hidden"), hl = !0;
}
function Gv() {
  const e = document.getElementById(zn);
  e && e.classList.add("st-rh-console-hidden"), hl = !1;
}
function wt(e) {
  return e === 0 ? "0" : e > 0 ? `+${e}` : `${e}`;
}
function fl(e, t, r) {
  return `${wt(e)} + skill ${wt(t)} = ${wt(r)}`;
}
function Rr(e) {
  return `${e}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}
function ym(e) {
  let t = 0;
  for (let r = 0; r < e.length; r++)
    t = (t << 5) - t + e.charCodeAt(r), t |= 0;
  return Math.abs(t).toString(36);
}
function un(e) {
  return e == null ? "" : String(e).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/'/g, "&#39;");
}
function gl(e) {
  return un(e).replace(/`/g, "&#96;");
}
function jn(e) {
  return e.replace(/\n{3,}/g, `

`).trim();
}
function Mo(e) {
  const t = String(e ?? "").trim();
  if (!t) return "";
  if (/^none$/i.test(t)) return "无";
  const r = t.match(/^P(?:(\d+)W)?(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/i);
  if (!r) return t;
  const n = Number(r[1] || 0), o = Number(r[2] || 0), i = Number(r[3] || 0), c = Number(r[4] || 0), u = Number(r[5] || 0), h = [];
  return n > 0 && h.push(`${n}周`), o > 0 && h.push(`${o}天`), i > 0 && h.push(`${i}小时`), c > 0 && h.push(`${c}分钟`), u > 0 && h.push(`${u}秒`), h.length > 0 ? h.join("") : "0秒";
}
var Sm = "stx.sdk.settings.v1", Zr = /* @__PURE__ */ new Map(), zc = !1;
function qe(e) {
  return !!e && typeof e == "object" && !Array.isArray(e);
}
function Em() {
  try {
    const e = globalThis.SillyTavern?.getContext?.();
    if (!qe(e)) return null;
    const t = e.accountStorage;
    if (!qe(t)) return null;
    const r = t;
    return typeof r.getItem != "function" || typeof r.setItem != "function" ? null : r;
  } catch {
    return null;
  }
}
function _m(e, t) {
  return `${Sm}::${e}::${t.tavernInstanceId}`;
}
function vl() {
  return { tavernInstanceId: Do() };
}
function mn(e) {
  return String(e ?? "").trim();
}
function zv(e) {
  const t = Em();
  return t && typeof t.getItem == "function" ? String(t.getItem(e) ?? "").trim() : "";
}
function jv(e) {
  try {
    return String(globalThis.localStorage?.getItem(e) ?? "").trim();
  } catch {
    return "";
  }
}
function qv(e, t) {
  const r = Em();
  if (!(!r || typeof r.setItem != "function"))
    try {
      r.setItem(e, t);
    } catch {
    }
}
function Fv(e, t) {
  try {
    globalThis.localStorage?.setItem(e, t);
  } catch {
  }
}
function Tm(e, t) {
  qv(e, t), Fv(e, t);
}
function Ra(e, t) {
  return qe(e) && Object.prototype.hasOwnProperty.call(e, t);
}
function Vv(e) {
  return !!(!qe(e) || !Ra(e, "pluginSettings") || !qe(e.pluginSettings) || !Ra(e, "pluginUiState") || !qe(e.pluginUiState) || Ra(e, "pluginChatState"));
}
function ti(e) {
  if (Array.isArray(e)) return e.map((r) => ti(r));
  if (!qe(e)) return e;
  const t = {};
  return Object.keys(e).sort((r, n) => r.localeCompare(n)).forEach((r) => {
    t[r] = ti(e[r]);
  }), t;
}
function Yv(e) {
  return JSON.stringify(ti(e));
}
function zs(e) {
  const t = Oo(e);
  return Yv({
    pluginSettings: t.pluginSettings,
    pluginUiState: t.pluginUiState,
    __sdkMeta: t.__sdkMeta
  });
}
function Wv(e) {
  return e ? Object.keys(e.pluginSettings ?? {}).length + Object.keys(e.pluginUiState ?? {}).length : 0;
}
function Xv(e) {
  if (!qe(e)) return 1;
  const t = qe(e.pluginSettings), r = qe(e.pluginUiState);
  return t && r ? 3 : t || r ? 2 : 1;
}
function jc(e) {
  const t = String(e ?? "").trim();
  if (!t) return {
    hasValue: !1,
    valid: !1,
    bucket: null,
    needsShapeRepair: !1,
    quality: 0,
    payloadSize: 0
  };
  try {
    const r = JSON.parse(t), n = Oo(r);
    return {
      hasValue: !0,
      valid: !0,
      bucket: n,
      needsShapeRepair: Vv(r),
      quality: Xv(r),
      payloadSize: Wv(n)
    };
  } catch {
    return {
      hasValue: !0,
      valid: !1,
      bucket: null,
      needsShapeRepair: !1,
      quality: 0,
      payloadSize: 0
    };
  }
}
function Oo(e) {
  if (!qe(e)) return {
    pluginSettings: {},
    pluginUiState: {},
    __sdkMeta: { updatedAt: 0 }
  };
  const t = qe(e.pluginSettings) ? e.pluginSettings : {}, r = qe(e.pluginUiState) ? e.pluginUiState : {}, n = Number(qe(e.__sdkMeta) ? e.__sdkMeta.updatedAt : 0);
  return {
    pluginSettings: { ...t },
    pluginUiState: { ...r },
    pluginChatState: {},
    __sdkMeta: { updatedAt: Number.isFinite(n) ? n : 0 }
  };
}
function km(e, t) {
  const r = _m(e, t), n = jc(zv(r)), o = jc(jv(r)), i = Number(n.bucket?.__sdkMeta?.updatedAt ?? 0), c = Number(o.bucket?.__sdkMeta?.updatedAt ?? 0), u = n.valid && n.bucket && (i > c || i === c && (n.quality > o.quality || n.quality === o.quality && n.payloadSize >= o.payloadSize)) ? n.bucket : o.valid && o.bucket ? o.bucket : Oo(null), h = n.valid && n.bucket ? zs(n.bucket) : "", f = o.valid && o.bucket ? zs(o.bucket) : "", v = zs(u);
  return (n.hasValue && !n.valid && o.valid || o.hasValue && !o.valid && n.valid || n.valid && o.valid && h !== f || n.valid && n.needsShapeRepair || o.valid && o.needsShapeRepair || !n.valid && !o.valid && (n.hasValue || o.hasValue)) && Tm(r, v), u;
}
function Jv(e) {
  const t = String(e ?? "").trim();
  if (!t) return null;
  const r = `${Sm}::`;
  if (!t.startsWith(r)) return null;
  const n = t.slice(r.length), o = n.indexOf("::");
  if (o <= 0) return null;
  const i = n.slice(0, o).trim(), c = n.slice(o + 2).trim();
  return !i || !c ? null : {
    namespace: i,
    tavernInstanceId: c
  };
}
function Qv() {
  zc || typeof window > "u" || typeof window.addEventListener != "function" || (zc = !0, window.addEventListener("storage", (e) => {
    const t = Jv(String(e.key ?? ""));
    if (!t) return;
    const r = Zr.get(t.namespace);
    if (!r || r.size <= 0) return;
    const n = vl();
    if (n.tavernInstanceId !== t.tavernInstanceId) return;
    const o = km(t.namespace, n);
    wm(t.namespace, {
      namespace: t.namespace,
      scope: n,
      pluginSettings: o.pluginSettings,
      pluginUiState: o.pluginUiState
    });
  }));
}
function wm(e, t) {
  const r = Zr.get(e);
  !r || r.size <= 0 || Array.from(r).forEach((n) => {
    try {
      n(t);
    } catch {
    }
  });
}
function Im(e, t, r) {
  const n = _m(e, t), o = Oo({
    ...r,
    __sdkMeta: { updatedAt: Date.now() }
  });
  try {
    Tm(n, zs(o));
  } finally {
    wm(e, {
      namespace: e,
      scope: t,
      pluginSettings: o.pluginSettings,
      pluginUiState: o.pluginUiState
    });
  }
}
function Po(e) {
  const t = vl(), r = km(e, t);
  return {
    namespace: e,
    scope: t,
    pluginSettings: r.pluginSettings,
    pluginUiState: r.pluginUiState
  };
}
function Zv(e, t) {
  const r = Po(e), n = r.pluginSettings, o = typeof t == "function" ? t({ ...n }) : {
    ...n,
    ...t
  }, i = qe(o) ? o : {};
  return Im(e, r.scope, {
    pluginSettings: i,
    pluginUiState: r.pluginUiState
  }), { ...i };
}
function eb(e) {
  return { ...Po(e).pluginSettings };
}
function tb(e, t) {
  Qv();
  let r = Zr.get(e);
  return r || (r = /* @__PURE__ */ new Set(), Zr.set(e, r)), r.add(t), () => {
    const n = Zr.get(e);
    n && (n.delete(t), n.size <= 0 && Zr.delete(e));
  };
}
function rb(e, t, r) {
  const n = String(t ?? "").trim();
  if (!n) return r;
  const o = Po(e);
  return n in o.pluginUiState ? o.pluginUiState[n] : r;
}
function nb(e, t, r) {
  const n = String(t ?? "").trim();
  if (!n) return r;
  const o = Po(e);
  return Im(e, o.scope, {
    pluginSettings: o.pluginSettings,
    pluginUiState: {
      ...o.pluginUiState,
      [n]: r
    }
  }), r;
}
function Am() {
  return vl();
}
function sb(e) {
  const t = mn(e);
  return t ? eb(t) : {};
}
function ob(e, t) {
  const r = mn(e);
  if (!r) {
    const n = typeof t == "function" ? t({}) : { ...t ?? {} };
    return qe(n) ? n : {};
  }
  return Zv(r, t);
}
function ab(e, t) {
  const r = mn(e);
  return r ? tb(r, t) : () => {
  };
}
function bl(e, t, r) {
  const n = mn(e);
  return n ? rb(n, t, r) : r;
}
function xl(e, t, r) {
  const n = mn(e);
  return n ? nb(n, t, r) : r;
}
function ib(e) {
  const t = mn(e.namespace), r = { ...e.defaults ?? {} }, n = e.normalize;
  return {
    read: () => {
      const u = sb(t), h = {
        ...r,
        ...u
      };
      return n ? n(h) : h;
    },
    write: (u) => {
      const h = ob(t, (v) => {
        const x = {
          ...r,
          ...v
        }, y = typeof u == "function" ? u(x) : {
          ...x,
          ...u
        }, S = n ? n(y) : y;
        return qe(S) ? { ...S } : {};
      }), f = {
        ...r,
        ...h
      };
      return n ? n(f) : f;
    },
    subscribe: (u) => ab(t, (h) => {
      const f = {
        ...r,
        ...h.pluginSettings
      };
      u(n ? n(f) : f, h.scope);
    }),
    readUiState: (u, h) => bl(t, u, h),
    writeUiState: (u, h) => xl(t, u, h),
    getScope: () => Am()
  };
}
var lb = /* @__PURE__ */ sf((e, t) => {
  ((r, n) => {
    typeof e == "object" && typeof t < "u" ? t.exports = n() : typeof define == "function" && define.amd ? define(n) : (r = typeof globalThis < "u" ? globalThis : r || self).Dexie = n();
  })(e, function() {
    var r = function(s, a) {
      return (r = Object.setPrototypeOf || ({ __proto__: [] } instanceof Array ? function(l, d) {
        l.__proto__ = d;
      } : function(l, d) {
        for (var m in d) Object.prototype.hasOwnProperty.call(d, m) && (l[m] = d[m]);
      }))(s, a);
    }, n = function() {
      return (n = Object.assign || function(s) {
        for (var a, l = 1, d = arguments.length; l < d; l++) for (var m in a = arguments[l]) Object.prototype.hasOwnProperty.call(a, m) && (s[m] = a[m]);
        return s;
      }).apply(this, arguments);
    };
    function o(s, a, l) {
      if (l || arguments.length === 2) for (var d, m = 0, p = a.length; m < p; m++) !d && m in a || ((d = d || Array.prototype.slice.call(a, 0, m))[m] = a[m]);
      return s.concat(d || Array.prototype.slice.call(a));
    }
    var i = typeof globalThis < "u" ? globalThis : typeof self < "u" ? self : typeof window < "u" ? window : global, c = Object.keys, u = Array.isArray;
    function h(s, a) {
      return typeof a == "object" && c(a).forEach(function(l) {
        s[l] = a[l];
      }), s;
    }
    typeof Promise > "u" || i.Promise || (i.Promise = Promise);
    var f = Object.getPrototypeOf, v = {}.hasOwnProperty;
    function x(s, a) {
      return v.call(s, a);
    }
    function y(s, a) {
      typeof a == "function" && (a = a(f(s))), (typeof Reflect > "u" ? c : Reflect.ownKeys)(a).forEach(function(l) {
        _(s, l, a[l]);
      });
    }
    var S = Object.defineProperty;
    function _(s, a, l, d) {
      S(s, a, h(l && x(l, "get") && typeof l.get == "function" ? {
        get: l.get,
        set: l.set,
        configurable: !0
      } : {
        value: l,
        configurable: !0,
        writable: !0
      }, d));
    }
    function P(s) {
      return { from: function(a) {
        return s.prototype = Object.create(a.prototype), _(s.prototype, "constructor", s), { extend: y.bind(null, s.prototype) };
      } };
    }
    var L = Object.getOwnPropertyDescriptor, M = [].slice;
    function B(s, a, l) {
      return M.call(s, a, l);
    }
    function C(s, a) {
      return a(s);
    }
    function G(s) {
      if (!s) throw new Error("Assertion Failed");
    }
    function F(s) {
      i.setImmediate ? setImmediate(s) : setTimeout(s, 0);
    }
    function Z(s, a) {
      if (typeof a == "string" && x(s, a)) return s[a];
      if (!a) return s;
      if (typeof a != "string") {
        for (var l = [], d = 0, m = a.length; d < m; ++d) {
          var p = Z(s, a[d]);
          l.push(p);
        }
        return l;
      }
      var g, b = a.indexOf(".");
      return b === -1 || (g = s[a.substr(0, b)]) == null ? void 0 : Z(g, a.substr(b + 1));
    }
    function H(s, a, l) {
      if (s && a !== void 0 && !("isFrozen" in Object && Object.isFrozen(s))) if (typeof a != "string" && "length" in a) {
        G(typeof l != "string" && "length" in l);
        for (var d = 0, m = a.length; d < m; ++d) H(s, a[d], l[d]);
      } else {
        var p, g, b = a.indexOf(".");
        b !== -1 ? (p = a.substr(0, b), (b = a.substr(b + 1)) === "" ? l === void 0 ? u(s) && !isNaN(parseInt(p)) ? s.splice(p, 1) : delete s[p] : s[p] = l : H(g = (g = s[p]) && x(s, p) ? g : s[p] = {}, b, l)) : l === void 0 ? u(s) && !isNaN(parseInt(a)) ? s.splice(a, 1) : delete s[a] : s[a] = l;
      }
    }
    function X(s) {
      var a, l = {};
      for (a in s) x(s, a) && (l[a] = s[a]);
      return l;
    }
    var K = [].concat;
    function z(s) {
      return K.apply([], s);
    }
    var Me = "BigUint64Array,BigInt64Array,Array,Boolean,String,Date,RegExp,Blob,File,FileList,FileSystemFileHandle,FileSystemDirectoryHandle,ArrayBuffer,DataView,Uint8ClampedArray,ImageBitmap,ImageData,Map,Set,CryptoKey".split(",").concat(z([
      8,
      16,
      32,
      64
    ].map(function(s) {
      return [
        "Int",
        "Uint",
        "Float"
      ].map(function(a) {
        return a + s + "Array";
      });
    }))).filter(function(s) {
      return i[s];
    }), se = new Set(Me.map(function(s) {
      return i[s];
    })), ie = null;
    function ue(s) {
      return ie = /* @__PURE__ */ new WeakMap(), s = function a(l) {
        if (!l || typeof l != "object") return l;
        var d = ie.get(l);
        if (d) return d;
        if (u(l)) {
          d = [], ie.set(l, d);
          for (var m = 0, p = l.length; m < p; ++m) d.push(a(l[m]));
        } else if (se.has(l.constructor)) d = l;
        else {
          var g, b = f(l);
          for (g in d = b === Object.prototype ? {} : Object.create(b), ie.set(l, d), l) x(l, g) && (d[g] = a(l[g]));
        }
        return d;
      }(s), ie = null, s;
    }
    var Ae = {}.toString;
    function le(s) {
      return Ae.call(s).slice(8, -1);
    }
    var be = typeof Symbol < "u" ? Symbol.iterator : "@@iterator", we = typeof be == "symbol" ? function(s) {
      var a;
      return s != null && (a = s[be]) && a.apply(s);
    } : function() {
      return null;
    };
    function Pe(s, a) {
      a = s.indexOf(a), 0 <= a && s.splice(a, 1);
    }
    var Fe = {};
    function xe(s) {
      var a, l, d, m;
      if (arguments.length === 1) {
        if (u(s)) return s.slice();
        if (this === Fe && typeof s == "string") return [s];
        if (m = we(s)) for (l = []; !(d = m.next()).done; ) l.push(d.value);
        else {
          if (s == null) return [s];
          if (typeof (a = s.length) != "number") return [s];
          for (l = new Array(a); a--; ) l[a] = s[a];
        }
      } else for (a = arguments.length, l = new Array(a); a--; ) l[a] = arguments[a];
      return l;
    }
    var Ve = typeof Symbol < "u" ? function(s) {
      return s[Symbol.toStringTag] === "AsyncFunction";
    } : function() {
      return !1;
    }, Me = [
      "Unknown",
      "Constraint",
      "Data",
      "TransactionInactive",
      "ReadOnly",
      "Version",
      "NotFound",
      "InvalidState",
      "InvalidAccess",
      "Abort",
      "Timeout",
      "QuotaExceeded",
      "Syntax",
      "DataClone"
    ], tt = [
      "Modify",
      "Bulk",
      "OpenFailed",
      "VersionChange",
      "Schema",
      "Upgrade",
      "InvalidTable",
      "MissingAPI",
      "NoSuchDatabase",
      "InvalidArgument",
      "SubTransaction",
      "Unsupported",
      "Internal",
      "DatabaseClosed",
      "PrematureCommit",
      "ForeignAwait"
    ].concat(Me), Rt = {
      VersionChanged: "Database version changed by other database connection",
      DatabaseClosed: "Database has been closed",
      Abort: "Transaction aborted",
      TransactionInactive: "Transaction has already completed or failed",
      MissingAPI: "IndexedDB API missing. Please visit https://tinyurl.com/y2uuvskb"
    };
    function Ct(s, a) {
      this.name = s, this.message = a;
    }
    function ae(s, a) {
      return s + ". Errors: " + Object.keys(a).map(function(l) {
        return a[l].toString();
      }).filter(function(l, d, m) {
        return m.indexOf(l) === d;
      }).join(`
`);
    }
    function Oe(s, a, l, d) {
      this.failures = a, this.failedKeys = d, this.successCount = l, this.message = ae(s, a);
    }
    function _e(s, a) {
      this.name = "BulkError", this.failures = Object.keys(a).map(function(l) {
        return a[l];
      }), this.failuresByPos = a, this.message = ae(s, this.failures);
    }
    P(Ct).from(Error).extend({ toString: function() {
      return this.name + ": " + this.message;
    } }), P(Oe).from(Ct), P(_e).from(Ct);
    var mt = tt.reduce(function(s, a) {
      return s[a] = a + "Error", s;
    }, {}), Lr = Ct, re = tt.reduce(function(s, a) {
      var l = a + "Error";
      function d(m, p) {
        this.name = l, m ? typeof m == "string" ? (this.message = "".concat(m).concat(p ? `
 ` + p : ""), this.inner = p || null) : typeof m == "object" && (this.message = "".concat(m.name, " ").concat(m.message), this.inner = m) : (this.message = Rt[a] || l, this.inner = null);
      }
      return P(d).from(Lr), s[a] = d, s;
    }, {}), ql = (re.Syntax = SyntaxError, re.Type = TypeError, re.Range = RangeError, Me.reduce(function(s, a) {
      return s[a + "Error"] = re[a], s;
    }, {}));
    Me = tt.reduce(function(s, a) {
      return [
        "Syntax",
        "Type",
        "Range"
      ].indexOf(a) === -1 && (s[a + "Error"] = re[a]), s;
    }, {});
    function ye() {
    }
    function pn(s) {
      return s;
    }
    function _p(s, a) {
      return s == null || s === pn ? a : function(l) {
        return a(s(l));
      };
    }
    function tr(s, a) {
      return function() {
        s.apply(this, arguments), a.apply(this, arguments);
      };
    }
    function Tp(s, a) {
      return s === ye ? a : function() {
        var l = s.apply(this, arguments), d = (l !== void 0 && (arguments[0] = l), this.onsuccess), m = this.onerror, p = (this.onsuccess = null, this.onerror = null, a.apply(this, arguments));
        return d && (this.onsuccess = this.onsuccess ? tr(d, this.onsuccess) : d), m && (this.onerror = this.onerror ? tr(m, this.onerror) : m), p !== void 0 ? p : l;
      };
    }
    function kp(s, a) {
      return s === ye ? a : function() {
        s.apply(this, arguments);
        var l = this.onsuccess, d = this.onerror;
        this.onsuccess = this.onerror = null, a.apply(this, arguments), l && (this.onsuccess = this.onsuccess ? tr(l, this.onsuccess) : l), d && (this.onerror = this.onerror ? tr(d, this.onerror) : d);
      };
    }
    function wp(s, a) {
      return s === ye ? a : function(m) {
        var d = s.apply(this, arguments), m = (h(m, d), this.onsuccess), p = this.onerror, g = (this.onsuccess = null, this.onerror = null, a.apply(this, arguments));
        return m && (this.onsuccess = this.onsuccess ? tr(m, this.onsuccess) : m), p && (this.onerror = this.onerror ? tr(p, this.onerror) : p), d === void 0 ? g === void 0 ? void 0 : g : h(d, g);
      };
    }
    function Ip(s, a) {
      return s === ye ? a : function() {
        return a.apply(this, arguments) !== !1 && s.apply(this, arguments);
      };
    }
    function jo(s, a) {
      return s === ye ? a : function() {
        var l = s.apply(this, arguments);
        if (l && typeof l.then == "function") {
          for (var d = this, m = arguments.length, p = new Array(m); m--; ) p[m] = arguments[m];
          return l.then(function() {
            return a.apply(d, p);
          });
        }
        return a.apply(this, arguments);
      };
    }
    Me.ModifyError = Oe, Me.DexieError = Ct, Me.BulkError = _e;
    var ht = typeof location < "u" && /^(http|https):\/\/(localhost|127\.0\.0\.1)/.test(location.href);
    function Fl(s) {
      ht = s;
    }
    var fn = {}, Vl = 100, gn = typeof Promise > "u" ? [] : (tt = Promise.resolve(), typeof crypto < "u" && crypto.subtle ? [
      gn = crypto.subtle.digest("SHA-512", new Uint8Array([0])),
      f(gn),
      tt
    ] : [
      tt,
      f(tt),
      tt
    ]), tt = gn[0], Gr = gn[1], Gr = Gr && Gr.then, rr = tt && tt.constructor, qo = !!gn[2], vn = function(s, a) {
      bn.push([s, a]), is && (queueMicrotask($p), is = !1);
    }, Fo = !0, is = !0, nr = [], ls = [], Vo = pn, Dt = {
      id: "global",
      global: !0,
      ref: 0,
      unhandleds: [],
      onunhandled: ye,
      pgp: !1,
      env: {},
      finalize: ye
    }, ne = Dt, bn = [], sr = 0, cs = [];
    function J(s) {
      if (typeof this != "object") throw new TypeError("Promises must be constructed via new");
      this._listeners = [], this._lib = !1;
      var a = this._PSD = ne;
      if (typeof s != "function") {
        if (s !== fn) throw new TypeError("Not a function");
        this._state = arguments[1], this._value = arguments[2], this._state === !1 && Wo(this, this._value);
      } else this._state = null, this._value = null, ++a.ref, function l(d, m) {
        try {
          m(function(p) {
            if (d._state === null) {
              if (p === d) throw new TypeError("A promise cannot be resolved with itself.");
              var g = d._lib && Mr();
              p && typeof p.then == "function" ? l(d, function(b, I) {
                p instanceof J ? p._then(b, I) : p.then(b, I);
              }) : (d._state = !0, d._value = p, Wl(d)), g && Or();
            }
          }, Wo.bind(null, d));
        } catch (p) {
          Wo(d, p);
        }
      }(this, s);
    }
    var Yo = {
      get: function() {
        var s = ne, a = hs;
        function l(d, m) {
          var p = this, g = !s.global && (s !== ne || a !== hs), b = g && !Lt(), I = new J(function(D, k) {
            Xo(p, new Yl(Jl(d, s, g, b), Jl(m, s, g, b), D, k, s));
          });
          return this._consoleTask && (I._consoleTask = this._consoleTask), I;
        }
        return l.prototype = fn, l;
      },
      set: function(s) {
        _(this, "then", s && s.prototype === fn ? Yo : {
          get: function() {
            return s;
          },
          set: Yo.set
        });
      }
    };
    function Yl(s, a, l, d, m) {
      this.onFulfilled = typeof s == "function" ? s : null, this.onRejected = typeof a == "function" ? a : null, this.resolve = l, this.reject = d, this.psd = m;
    }
    function Wo(s, a) {
      var l, d;
      ls.push(a), s._state === null && (l = s._lib && Mr(), a = Vo(a), s._state = !1, s._value = a, d = s, nr.some(function(m) {
        return m._value === d._value;
      }) || nr.push(d), Wl(s), l) && Or();
    }
    function Wl(s) {
      var a = s._listeners;
      s._listeners = [];
      for (var l = 0, d = a.length; l < d; ++l) Xo(s, a[l]);
      var m = s._PSD;
      --m.ref || m.finalize(), sr === 0 && (++sr, vn(function() {
        --sr == 0 && Jo();
      }, []));
    }
    function Xo(s, a) {
      if (s._state === null) s._listeners.push(a);
      else {
        var l = s._state ? a.onFulfilled : a.onRejected;
        if (l === null) return (s._state ? a.resolve : a.reject)(s._value);
        ++a.psd.ref, ++sr, vn(Ap, [
          l,
          s,
          a
        ]);
      }
    }
    function Ap(s, a, l) {
      try {
        var d, m = a._value;
        !a._state && ls.length && (ls = []), d = ht && a._consoleTask ? a._consoleTask.run(function() {
          return s(m);
        }) : s(m), a._state || ls.indexOf(m) !== -1 || ((p) => {
          for (var g = nr.length; g; ) if (nr[--g]._value === p._value) return nr.splice(g, 1);
        })(a), l.resolve(d);
      } catch (p) {
        l.reject(p);
      } finally {
        --sr == 0 && Jo(), --l.psd.ref || l.psd.finalize();
      }
    }
    function $p() {
      or(Dt, function() {
        Mr() && Or();
      });
    }
    function Mr() {
      var s = Fo;
      return is = Fo = !1, s;
    }
    function Or() {
      var s, a, l;
      do
        for (; 0 < bn.length; ) for (s = bn, bn = [], l = s.length, a = 0; a < l; ++a) {
          var d = s[a];
          d[0].apply(null, d[1]);
        }
      while (0 < bn.length);
      is = Fo = !0;
    }
    function Jo() {
      for (var s = nr, a = (nr = [], s.forEach(function(d) {
        d._PSD.onunhandled.call(null, d._value, d);
      }), cs.slice(0)), l = a.length; l; ) a[--l]();
    }
    function ds(s) {
      return new J(fn, !1, s);
    }
    function ke(s, a) {
      var l = ne;
      return function() {
        var d = Mr(), m = ne;
        try {
          return Mt(l, !0), s.apply(this, arguments);
        } catch (p) {
          a && a(p);
        } finally {
          Mt(m, !1), d && Or();
        }
      };
    }
    y(J.prototype, {
      then: Yo,
      _then: function(s, a) {
        Xo(this, new Yl(null, null, s, a, ne));
      },
      catch: function(s) {
        var a, l;
        return arguments.length === 1 ? this.then(null, s) : (a = s, l = arguments[1], typeof a == "function" ? this.then(null, function(d) {
          return (d instanceof a ? l : ds)(d);
        }) : this.then(null, function(d) {
          return (d && d.name === a ? l : ds)(d);
        }));
      },
      finally: function(s) {
        return this.then(function(a) {
          return J.resolve(s()).then(function() {
            return a;
          });
        }, function(a) {
          return J.resolve(s()).then(function() {
            return ds(a);
          });
        });
      },
      timeout: function(s, a) {
        var l = this;
        return s < 1 / 0 ? new J(function(d, m) {
          var p = setTimeout(function() {
            return m(new re.Timeout(a));
          }, s);
          l.then(d, m).finally(clearTimeout.bind(null, p));
        }) : this;
      }
    }), typeof Symbol < "u" && Symbol.toStringTag && _(J.prototype, Symbol.toStringTag, "Dexie.Promise"), Dt.env = Xl(), y(J, {
      all: function() {
        var s = xe.apply(null, arguments).map(ps);
        return new J(function(a, l) {
          s.length === 0 && a([]);
          var d = s.length;
          s.forEach(function(m, p) {
            return J.resolve(m).then(function(g) {
              s[p] = g, --d || a(s);
            }, l);
          });
        });
      },
      resolve: function(s) {
        return s instanceof J ? s : s && typeof s.then == "function" ? new J(function(a, l) {
          s.then(a, l);
        }) : new J(fn, !0, s);
      },
      reject: ds,
      race: function() {
        var s = xe.apply(null, arguments).map(ps);
        return new J(function(a, l) {
          s.map(function(d) {
            return J.resolve(d).then(a, l);
          });
        });
      },
      PSD: {
        get: function() {
          return ne;
        },
        set: function(s) {
          return ne = s;
        }
      },
      totalEchoes: { get: function() {
        return hs;
      } },
      newPSD: Nt,
      usePSD: or,
      scheduler: {
        get: function() {
          return vn;
        },
        set: function(s) {
          vn = s;
        }
      },
      rejectionMapper: {
        get: function() {
          return Vo;
        },
        set: function(s) {
          Vo = s;
        }
      },
      follow: function(s, a) {
        return new J(function(l, d) {
          return Nt(function(m, p) {
            var g = ne;
            g.unhandleds = [], g.onunhandled = p, g.finalize = tr(function() {
              var b, I = this;
              b = function() {
                I.unhandleds.length === 0 ? m() : p(I.unhandleds[0]);
              }, cs.push(function D() {
                b(), cs.splice(cs.indexOf(D), 1);
              }), ++sr, vn(function() {
                --sr == 0 && Jo();
              }, []);
            }, g.finalize), s();
          }, a, l, d);
        });
      }
    }), rr && (rr.allSettled && _(J, "allSettled", function() {
      var s = xe.apply(null, arguments).map(ps);
      return new J(function(a) {
        s.length === 0 && a([]);
        var l = s.length, d = new Array(l);
        s.forEach(function(m, p) {
          return J.resolve(m).then(function(g) {
            return d[p] = {
              status: "fulfilled",
              value: g
            };
          }, function(g) {
            return d[p] = {
              status: "rejected",
              reason: g
            };
          }).then(function() {
            return --l || a(d);
          });
        });
      });
    }), rr.any && typeof AggregateError < "u" && _(J, "any", function() {
      var s = xe.apply(null, arguments).map(ps);
      return new J(function(a, l) {
        s.length === 0 && l(/* @__PURE__ */ new AggregateError([]));
        var d = s.length, m = new Array(d);
        s.forEach(function(p, g) {
          return J.resolve(p).then(function(b) {
            return a(b);
          }, function(b) {
            m[g] = b, --d || l(new AggregateError(m));
          });
        });
      });
    }), rr.withResolvers) && (J.withResolvers = rr.withResolvers);
    var Be = {
      awaits: 0,
      echoes: 0,
      id: 0
    }, Rp = 0, us = [], ms = 0, hs = 0, Cp = 0;
    function Nt(s, g, l, d) {
      var m = ne, p = Object.create(m), g = (p.parent = m, p.ref = 0, p.global = !1, p.id = ++Cp, Dt.env, p.env = qo ? {
        Promise: J,
        PromiseProp: {
          value: J,
          configurable: !0,
          writable: !0
        },
        all: J.all,
        race: J.race,
        allSettled: J.allSettled,
        any: J.any,
        resolve: J.resolve,
        reject: J.reject
      } : {}, g && h(p, g), ++m.ref, p.finalize = function() {
        --this.parent.ref || this.parent.finalize();
      }, or(p, s, l, d));
      return p.ref === 0 && p.finalize(), g;
    }
    function Pr() {
      return Be.id || (Be.id = ++Rp), ++Be.awaits, Be.echoes += Vl, Be.id;
    }
    function Lt() {
      return !!Be.awaits && (--Be.awaits == 0 && (Be.id = 0), Be.echoes = Be.awaits * Vl, !0);
    }
    function ps(s) {
      return Be.echoes && s && s.constructor === rr ? (Pr(), s.then(function(a) {
        return Lt(), a;
      }, function(a) {
        return Lt(), De(a);
      })) : s;
    }
    function Dp() {
      var s = us[us.length - 1];
      us.pop(), Mt(s, !1);
    }
    function Mt(s, a) {
      var l, d, m = ne;
      (a ? !Be.echoes || ms++ && s === ne : !ms || --ms && s === ne) || queueMicrotask(a ? function(p) {
        ++hs, Be.echoes && --Be.echoes != 0 || (Be.echoes = Be.awaits = Be.id = 0), us.push(ne), Mt(p, !0);
      }.bind(null, s) : Dp), s !== ne && (ne = s, m === Dt && (Dt.env = Xl()), qo) && (l = Dt.env.Promise, d = s.env, m.global || s.global) && (Object.defineProperty(i, "Promise", d.PromiseProp), l.all = d.all, l.race = d.race, l.resolve = d.resolve, l.reject = d.reject, d.allSettled && (l.allSettled = d.allSettled), d.any) && (l.any = d.any);
    }
    function Xl() {
      var s = i.Promise;
      return qo ? {
        Promise: s,
        PromiseProp: Object.getOwnPropertyDescriptor(i, "Promise"),
        all: s.all,
        race: s.race,
        allSettled: s.allSettled,
        any: s.any,
        resolve: s.resolve,
        reject: s.reject
      } : {};
    }
    function or(s, a, l, d, m) {
      var p = ne;
      try {
        return Mt(s, !0), a(l, d, m);
      } finally {
        Mt(p, !1);
      }
    }
    function Jl(s, a, l, d) {
      return typeof s != "function" ? s : function() {
        var m = ne;
        l && Pr(), Mt(a, !0);
        try {
          return s.apply(this, arguments);
        } finally {
          Mt(m, !1), d && queueMicrotask(Lt);
        }
      };
    }
    function Qo(s) {
      Promise === rr && Be.echoes === 0 ? ms === 0 ? s() : enqueueNativeMicroTask(s) : setTimeout(s, 0);
    }
    ("" + Gr).indexOf("[native code]") === -1 && (Pr = Lt = ye);
    var De = J.reject, ar = "￿", St = "Invalid key provided. Keys must be of type string, number, Date or Array<string | number | Date>.", Ql = "String expected.", Br = [], fs = "__dbnames", Zo = "readonly", ea = "readwrite";
    function ir(s, a) {
      return s ? a ? function() {
        return s.apply(this, arguments) && a.apply(this, arguments);
      } : s : a;
    }
    var Zl = {
      type: 3,
      lower: -1 / 0,
      lowerOpen: !1,
      upper: [[]],
      upperOpen: !1
    };
    function gs(s) {
      return typeof s != "string" || /\./.test(s) ? function(a) {
        return a;
      } : function(a) {
        return a[s] === void 0 && s in a && delete (a = ue(a))[s], a;
      };
    }
    function ec() {
      throw re.Type("Entity instances must never be new:ed. Instances are generated by the framework bypassing the constructor.");
    }
    function he(s, a) {
      try {
        var l = tc(s), d = tc(a);
        if (l !== d) return l === "Array" ? 1 : d === "Array" ? -1 : l === "binary" ? 1 : d === "binary" ? -1 : l === "string" ? 1 : d === "string" ? -1 : l === "Date" ? 1 : d !== "Date" ? NaN : -1;
        switch (l) {
          case "number":
          case "Date":
          case "string":
            return a < s ? 1 : s < a ? -1 : 0;
          case "binary":
            for (var m = rc(s), p = rc(a), g = m.length, b = p.length, I = g < b ? g : b, D = 0; D < I; ++D) if (m[D] !== p[D]) return m[D] < p[D] ? -1 : 1;
            return g === b ? 0 : g < b ? -1 : 1;
          case "Array":
            for (var k = s, E = a, A = k.length, $ = E.length, w = A < $ ? A : $, T = 0; T < w; ++T) {
              var N = he(k[T], E[T]);
              if (N !== 0) return N;
            }
            return A === $ ? 0 : A < $ ? -1 : 1;
        }
      } catch {
      }
      return NaN;
    }
    function tc(s) {
      var a = typeof s;
      return a == "object" && (ArrayBuffer.isView(s) || (a = le(s)) === "ArrayBuffer") ? "binary" : a;
    }
    function rc(s) {
      return s instanceof Uint8Array ? s : ArrayBuffer.isView(s) ? new Uint8Array(s.buffer, s.byteOffset, s.byteLength) : new Uint8Array(s);
    }
    function vs(s, a, l) {
      var d = s.schema.yProps;
      return d ? (a && 0 < l.numFailures && (a = a.filter(function(m, p) {
        return !l.failures[p];
      })), Promise.all(d.map(function(m) {
        return m = m.updatesTable, a ? s.db.table(m).where("k").anyOf(a).delete() : s.db.table(m).clear();
      })).then(function() {
        return l;
      })) : l;
    }
    nc.prototype.execute = function(s) {
      var a = this["@@propmod"];
      if (a.add !== void 0) {
        var l = a.add;
        if (u(l)) return o(o([], u(s) ? s : [], !0), l, !0).sort();
        if (typeof l == "number") return (Number(s) || 0) + l;
        if (typeof l == "bigint") try {
          return BigInt(s) + l;
        } catch {
          return BigInt(0) + l;
        }
        throw new TypeError("Invalid term ".concat(l));
      }
      if (a.remove !== void 0) {
        var d = a.remove;
        if (u(d)) return u(s) ? s.filter(function(m) {
          return !d.includes(m);
        }).sort() : [];
        if (typeof d == "number") return Number(s) - d;
        if (typeof d == "bigint") try {
          return BigInt(s) - d;
        } catch {
          return BigInt(0) - d;
        }
        throw new TypeError("Invalid subtrahend ".concat(d));
      }
      return l = (l = a.replacePrefix) == null ? void 0 : l[0], l && typeof s == "string" && s.startsWith(l) ? a.replacePrefix[1] + s.substring(l.length) : s;
    };
    var xn = nc;
    function nc(s) {
      this["@@propmod"] = s;
    }
    function sc(s, a) {
      for (var l = c(a), d = l.length, m = !1, p = 0; p < d; ++p) {
        var g = l[p], b = a[g], I = Z(s, g);
        b instanceof xn ? (H(s, g, b.execute(I)), m = !0) : I !== b && (H(s, g, b), m = !0);
      }
      return m;
    }
    Te.prototype._trans = function(s, a, l) {
      var d = this._tx || ne.trans, m = this.name, p = ht && typeof console < "u" && console.createTask && console.createTask("Dexie: ".concat(s === "readonly" ? "read" : "write", " ").concat(this.name));
      function g(D, k, E) {
        if (E.schema[m]) return a(E.idbtrans, E);
        throw new re.NotFound("Table " + m + " not part of transaction");
      }
      var b = Mr();
      try {
        var I = d && d.db._novip === this.db._novip ? d === ne.trans ? d._promise(s, g, l) : Nt(function() {
          return d._promise(s, g, l);
        }, {
          trans: d,
          transless: ne.transless || ne
        }) : function D(k, E, A, $) {
          if (k.idbdb && (k._state.openComplete || ne.letThrough || k._vip)) {
            var w = k._createTransaction(E, A, k._dbSchema);
            try {
              w.create(), k._state.PR1398_maxLoop = 3;
            } catch (T) {
              return T.name === mt.InvalidState && k.isOpen() && 0 < --k._state.PR1398_maxLoop ? (console.warn("Dexie: Need to reopen db"), k.close({ disableAutoOpen: !1 }), k.open().then(function() {
                return D(k, E, A, $);
              })) : De(T);
            }
            return w._promise(E, function(T, N) {
              return Nt(function() {
                return ne.trans = w, $(T, N, w);
              });
            }).then(function(T) {
              if (E === "readwrite") try {
                w.idbtrans.commit();
              } catch {
              }
              return E === "readonly" ? T : w._completion.then(function() {
                return T;
              });
            });
          }
          if (k._state.openComplete) return De(new re.DatabaseClosed(k._state.dbOpenError));
          if (!k._state.isBeingOpened) {
            if (!k._state.autoOpen) return De(new re.DatabaseClosed());
            k.open().catch(ye);
          }
          return k._state.dbReadyPromise.then(function() {
            return D(k, E, A, $);
          });
        }(this.db, s, [this.name], g);
        return p && (I._consoleTask = p, I = I.catch(function(D) {
          return console.trace(D), De(D);
        })), I;
      } finally {
        b && Or();
      }
    }, Te.prototype.get = function(s, a) {
      var l = this;
      return s && s.constructor === Object ? this.where(s).first(a) : s == null ? De(new re.Type("Invalid argument to Table.get()")) : this._trans("readonly", function(d) {
        return l.core.get({
          trans: d,
          key: s
        }).then(function(m) {
          return l.hook.reading.fire(m);
        });
      }).then(a);
    }, Te.prototype.where = function(s) {
      if (typeof s == "string") return new this.db.WhereClause(this, s);
      if (u(s)) return new this.db.WhereClause(this, "[".concat(s.join("+"), "]"));
      var a = c(s);
      if (a.length === 1) return this.where(a[0]).equals(s[a[0]]);
      var l = this.schema.indexes.concat(this.schema.primKey).filter(function(b) {
        if (b.compound && a.every(function(D) {
          return 0 <= b.keyPath.indexOf(D);
        })) {
          for (var I = 0; I < a.length; ++I) if (a.indexOf(b.keyPath[I]) === -1) return !1;
          return !0;
        }
        return !1;
      }).sort(function(b, I) {
        return b.keyPath.length - I.keyPath.length;
      })[0];
      if (l && this.db._maxKey !== ar) return g = l.keyPath.slice(0, a.length), this.where(g).equals(g.map(function(b) {
        return s[b];
      }));
      !l && ht && console.warn("The query ".concat(JSON.stringify(s), " on ").concat(this.name, " would benefit from a ") + "compound index [".concat(a.join("+"), "]"));
      var d = this.schema.idxByName;
      function m(b, I) {
        return he(b, I) === 0;
      }
      var g = a.reduce(function(k, I) {
        var D = k[0], k = k[1], E = d[I], A = s[I];
        return [D || E, D || !E ? ir(k, E && E.multi ? function($) {
          return $ = Z($, I), u($) && $.some(function(w) {
            return m(A, w);
          });
        } : function($) {
          return m(A, Z($, I));
        }) : k];
      }, [null, null]), p = g[0], g = g[1];
      return p ? this.where(p.name).equals(s[p.keyPath]).filter(g) : l ? this.filter(g) : this.where(a).equals("");
    }, Te.prototype.filter = function(s) {
      return this.toCollection().and(s);
    }, Te.prototype.count = function(s) {
      return this.toCollection().count(s);
    }, Te.prototype.offset = function(s) {
      return this.toCollection().offset(s);
    }, Te.prototype.limit = function(s) {
      return this.toCollection().limit(s);
    }, Te.prototype.each = function(s) {
      return this.toCollection().each(s);
    }, Te.prototype.toArray = function(s) {
      return this.toCollection().toArray(s);
    }, Te.prototype.toCollection = function() {
      return new this.db.Collection(new this.db.WhereClause(this));
    }, Te.prototype.orderBy = function(s) {
      return new this.db.Collection(new this.db.WhereClause(this, u(s) ? "[".concat(s.join("+"), "]") : s));
    }, Te.prototype.reverse = function() {
      return this.toCollection().reverse();
    }, Te.prototype.mapToClass = function(s) {
      for (var a = this.db, l = this.name, d = ((this.schema.mappedClass = s).prototype instanceof ec && (s = ((g) => {
        var b = k, I = g;
        if (typeof I != "function" && I !== null) throw new TypeError("Class extends value " + String(I) + " is not a constructor or null");
        function D() {
          this.constructor = b;
        }
        function k() {
          return g !== null && g.apply(this, arguments) || this;
        }
        return r(b, I), b.prototype = I === null ? Object.create(I) : (D.prototype = I.prototype, new D()), Object.defineProperty(k.prototype, "db", {
          get: function() {
            return a;
          },
          enumerable: !1,
          configurable: !0
        }), k.prototype.table = function() {
          return l;
        }, k;
      })(s)), /* @__PURE__ */ new Set()), m = s.prototype; m; m = f(m)) Object.getOwnPropertyNames(m).forEach(function(g) {
        return d.add(g);
      });
      function p(g) {
        if (!g) return g;
        var b, I = Object.create(s.prototype);
        for (b in g) if (!d.has(b)) try {
          I[b] = g[b];
        } catch {
        }
        return I;
      }
      return this.schema.readHook && this.hook.reading.unsubscribe(this.schema.readHook), this.schema.readHook = p, this.hook("reading", p), s;
    }, Te.prototype.defineClass = function() {
      return this.mapToClass(function(s) {
        h(this, s);
      });
    }, Te.prototype.add = function(s, a) {
      var l = this, d = this.schema.primKey, m = d.auto, p = d.keyPath, g = s;
      return p && m && (g = gs(p)(s)), this._trans("readwrite", function(b) {
        return l.core.mutate({
          trans: b,
          type: "add",
          keys: a != null ? [a] : null,
          values: [g]
        });
      }).then(function(b) {
        return b.numFailures ? J.reject(b.failures[0]) : b.lastResult;
      }).then(function(b) {
        if (p) try {
          H(s, p, b);
        } catch {
        }
        return b;
      });
    }, Te.prototype.upsert = function(s, a) {
      var l = this, d = this.schema.primKey.keyPath;
      return this._trans("readwrite", function(m) {
        return l.core.get({
          trans: m,
          key: s
        }).then(function(p) {
          var g = p ?? {};
          return sc(g, a), d && H(g, d, s), l.core.mutate({
            trans: m,
            type: "put",
            values: [g],
            keys: [s],
            upsert: !0,
            updates: {
              keys: [s],
              changeSpecs: [a]
            }
          }).then(function(b) {
            return b.numFailures ? J.reject(b.failures[0]) : !!p;
          });
        });
      });
    }, Te.prototype.update = function(s, a) {
      return typeof s != "object" || u(s) ? this.where(":id").equals(s).modify(a) : (s = Z(s, this.schema.primKey.keyPath)) === void 0 ? De(new re.InvalidArgument("Given object does not contain its primary key")) : this.where(":id").equals(s).modify(a);
    }, Te.prototype.put = function(s, a) {
      var l = this, d = this.schema.primKey, m = d.auto, p = d.keyPath, g = s;
      return p && m && (g = gs(p)(s)), this._trans("readwrite", function(b) {
        return l.core.mutate({
          trans: b,
          type: "put",
          values: [g],
          keys: a != null ? [a] : null
        });
      }).then(function(b) {
        return b.numFailures ? J.reject(b.failures[0]) : b.lastResult;
      }).then(function(b) {
        if (p) try {
          H(s, p, b);
        } catch {
        }
        return b;
      });
    }, Te.prototype.delete = function(s) {
      var a = this;
      return this._trans("readwrite", function(l) {
        return a.core.mutate({
          trans: l,
          type: "delete",
          keys: [s]
        }).then(function(d) {
          return vs(a, [s], d);
        }).then(function(d) {
          return d.numFailures ? J.reject(d.failures[0]) : void 0;
        });
      });
    }, Te.prototype.clear = function() {
      var s = this;
      return this._trans("readwrite", function(a) {
        return s.core.mutate({
          trans: a,
          type: "deleteRange",
          range: Zl
        }).then(function(l) {
          return vs(s, null, l);
        });
      }).then(function(a) {
        return a.numFailures ? J.reject(a.failures[0]) : void 0;
      });
    }, Te.prototype.bulkGet = function(s) {
      var a = this;
      return this._trans("readonly", function(l) {
        return a.core.getMany({
          keys: s,
          trans: l
        }).then(function(d) {
          return d.map(function(m) {
            return a.hook.reading.fire(m);
          });
        });
      });
    }, Te.prototype.bulkAdd = function(s, a, l) {
      var d = this, m = Array.isArray(a) ? a : void 0, p = (l = l || (m ? void 0 : a)) ? l.allKeys : void 0;
      return this._trans("readwrite", function(g) {
        var b = d.schema.primKey, D = b.auto, b = b.keyPath;
        if (b && m) throw new re.InvalidArgument("bulkAdd(): keys argument invalid on tables with inbound keys");
        if (m && m.length !== s.length) throw new re.InvalidArgument("Arguments objects and keys must have the same length");
        var I = s.length, D = b && D ? s.map(gs(b)) : s;
        return d.core.mutate({
          trans: g,
          type: "add",
          keys: m,
          values: D,
          wantResults: p
        }).then(function(k) {
          var E = k.numFailures, A = k.failures;
          if (E === 0) return p ? k.results : k.lastResult;
          throw new _e("".concat(d.name, ".bulkAdd(): ").concat(E, " of ").concat(I, " operations failed"), A);
        });
      });
    }, Te.prototype.bulkPut = function(s, a, l) {
      var d = this, m = Array.isArray(a) ? a : void 0, p = (l = l || (m ? void 0 : a)) ? l.allKeys : void 0;
      return this._trans("readwrite", function(g) {
        var b = d.schema.primKey, D = b.auto, b = b.keyPath;
        if (b && m) throw new re.InvalidArgument("bulkPut(): keys argument invalid on tables with inbound keys");
        if (m && m.length !== s.length) throw new re.InvalidArgument("Arguments objects and keys must have the same length");
        var I = s.length, D = b && D ? s.map(gs(b)) : s;
        return d.core.mutate({
          trans: g,
          type: "put",
          keys: m,
          values: D,
          wantResults: p
        }).then(function(k) {
          var E = k.numFailures, A = k.failures;
          if (E === 0) return p ? k.results : k.lastResult;
          throw new _e("".concat(d.name, ".bulkPut(): ").concat(E, " of ").concat(I, " operations failed"), A);
        });
      });
    }, Te.prototype.bulkUpdate = function(s) {
      var a = this, l = this.core, d = s.map(function(g) {
        return g.key;
      }), m = s.map(function(g) {
        return g.changes;
      }), p = [];
      return this._trans("readwrite", function(g) {
        return l.getMany({
          trans: g,
          keys: d,
          cache: "clone"
        }).then(function(b) {
          var I = [], D = [], k = (s.forEach(function(E, A) {
            var $ = E.key, w = E.changes, T = b[A];
            if (T) {
              for (var N = 0, O = Object.keys(w); N < O.length; N++) {
                var R = O[N], U = w[R];
                if (R === a.schema.primKey.keyPath) {
                  if (he(U, $) !== 0) throw new re.Constraint("Cannot update primary key in bulkUpdate()");
                } else H(T, R, U);
              }
              p.push(A), I.push($), D.push(T);
            }
          }), I.length);
          return l.mutate({
            trans: g,
            type: "put",
            keys: I,
            values: D,
            updates: {
              keys: d,
              changeSpecs: m
            }
          }).then(function(E) {
            var A = E.numFailures, $ = E.failures;
            if (A === 0) return k;
            for (var w = 0, T = Object.keys($); w < T.length; w++) {
              var N, O = T[w], R = p[Number(O)];
              R != null && (N = $[O], delete $[O], $[R] = N);
            }
            throw new _e("".concat(a.name, ".bulkUpdate(): ").concat(A, " of ").concat(k, " operations failed"), $);
          });
        });
      });
    }, Te.prototype.bulkDelete = function(s) {
      var a = this, l = s.length;
      return this._trans("readwrite", function(d) {
        return a.core.mutate({
          trans: d,
          type: "delete",
          keys: s
        }).then(function(m) {
          return vs(a, s, m);
        });
      }).then(function(d) {
        var m = d.numFailures, p = d.failures;
        if (m === 0) return d.lastResult;
        throw new _e("".concat(a.name, ".bulkDelete(): ").concat(m, " of ").concat(l, " operations failed"), p);
      });
    };
    var oc = Te;
    function Te() {
    }
    function yn(s) {
      function a(g, b) {
        if (b) {
          for (var I = arguments.length, D = new Array(I - 1); --I; ) D[I - 1] = arguments[I];
          return l[g].subscribe.apply(null, D), s;
        }
        if (typeof g == "string") return l[g];
      }
      var l = {};
      a.addEventType = p;
      for (var d = 1, m = arguments.length; d < m; ++d) p(arguments[d]);
      return a;
      function p(g, b, I) {
        var D, k;
        if (typeof g != "object") return b = b || Ip, k = {
          subscribers: [],
          fire: I = I || ye,
          subscribe: function(E) {
            k.subscribers.indexOf(E) === -1 && (k.subscribers.push(E), k.fire = b(k.fire, E));
          },
          unsubscribe: function(E) {
            k.subscribers = k.subscribers.filter(function(A) {
              return A !== E;
            }), k.fire = k.subscribers.reduce(b, I);
          }
        }, l[g] = a[g] = k;
        c(D = g).forEach(function(E) {
          var A = D[E];
          if (u(A)) p(E, D[E][0], D[E][1]);
          else {
            if (A !== "asap") throw new re.InvalidArgument("Invalid event config");
            var $ = p(E, pn, function() {
              for (var w = arguments.length, T = new Array(w); w--; ) T[w] = arguments[w];
              $.subscribers.forEach(function(N) {
                F(function() {
                  N.apply(null, T);
                });
              });
            });
          }
        });
      }
    }
    function Sn(s, a) {
      return P(a).from({ prototype: s }), a;
    }
    function Ur(s, a) {
      return !(s.filter || s.algorithm || s.or) && (a ? s.justLimit : !s.replayFilter);
    }
    function ta(s, a) {
      s.filter = ir(s.filter, a);
    }
    function ra(s, a, l) {
      var d = s.replayFilter;
      s.replayFilter = d ? function() {
        return ir(d(), a());
      } : a, s.justLimit = l && !d;
    }
    function bs(s, a) {
      if (s.isPrimKey) return a.primaryKey;
      var l = a.getIndexByKeyPath(s.index);
      if (l) return l;
      throw new re.Schema("KeyPath " + s.index + " on object store " + a.name + " is not indexed");
    }
    function ac(s, a, l) {
      var d = bs(s, a.schema);
      return a.openCursor({
        trans: l,
        values: !s.keysOnly,
        reverse: s.dir === "prev",
        unique: !!s.unique,
        query: {
          index: d,
          range: s.range
        }
      });
    }
    function xs(s, a, l, d) {
      var m, p, g = s.replayFilter ? ir(s.filter, s.replayFilter()) : s.filter;
      return s.or ? (m = {}, p = function(b, I, D) {
        var k, E;
        g && !g(I, D, function(A) {
          return I.stop(A);
        }, function(A) {
          return I.fail(A);
        }) || ((E = "" + (k = I.primaryKey)) == "[object ArrayBuffer]" && (E = "" + new Uint8Array(k)), x(m, E)) || (m[E] = !0, a(b, I, D));
      }, Promise.all([s.or._iterate(p, l), ic(ac(s, d, l), s.algorithm, p, !s.keysOnly && s.valueMapper)])) : ic(ac(s, d, l), ir(s.algorithm, g), a, !s.keysOnly && s.valueMapper);
    }
    function ic(s, a, l, d) {
      var m = ke(d ? function(p, g, b) {
        return l(d(p), g, b);
      } : l);
      return s.then(function(p) {
        if (p) return p.start(function() {
          var g = function() {
            return p.continue();
          };
          a && !a(p, function(b) {
            return g = b;
          }, function(b) {
            p.stop(b), g = ye;
          }, function(b) {
            p.fail(b), g = ye;
          }) || m(p.value, p, function(b) {
            return g = b;
          }), g();
        });
      });
    }
    fe.prototype._read = function(s, a) {
      var l = this._ctx;
      return l.error ? l.table._trans(null, De.bind(null, l.error)) : l.table._trans("readonly", s).then(a);
    }, fe.prototype._write = function(s) {
      var a = this._ctx;
      return a.error ? a.table._trans(null, De.bind(null, a.error)) : a.table._trans("readwrite", s, "locked");
    }, fe.prototype._addAlgorithm = function(s) {
      var a = this._ctx;
      a.algorithm = ir(a.algorithm, s);
    }, fe.prototype._iterate = function(s, a) {
      return xs(this._ctx, s, a, this._ctx.table.core);
    }, fe.prototype.clone = function(s) {
      var a = Object.create(this.constructor.prototype), l = Object.create(this._ctx);
      return s && h(l, s), a._ctx = l, a;
    }, fe.prototype.raw = function() {
      return this._ctx.valueMapper = null, this;
    }, fe.prototype.each = function(s) {
      var a = this._ctx;
      return this._read(function(l) {
        return xs(a, s, l, a.table.core);
      });
    }, fe.prototype.count = function(s) {
      var a = this;
      return this._read(function(l) {
        var d, m = a._ctx, p = m.table.core;
        return Ur(m, !0) ? p.count({
          trans: l,
          query: {
            index: bs(m, p.schema),
            range: m.range
          }
        }).then(function(g) {
          return Math.min(g, m.limit);
        }) : (d = 0, xs(m, function() {
          return ++d, !1;
        }, l, p).then(function() {
          return d;
        }));
      }).then(s);
    }, fe.prototype.sortBy = function(s, a) {
      var l = s.split(".").reverse(), d = l[0], m = l.length - 1;
      function p(I, D) {
        return D ? p(I[l[D]], D - 1) : I[d];
      }
      var g = this._ctx.dir === "next" ? 1 : -1;
      function b(I, D) {
        return he(p(I, m), p(D, m)) * g;
      }
      return this.toArray(function(I) {
        return I.sort(b);
      }).then(a);
    }, fe.prototype.toArray = function(s) {
      var a = this;
      return this._read(function(l) {
        var d, m, p, g = a._ctx;
        return g.dir === "next" && Ur(g, !0) && 0 < g.limit ? (d = g.valueMapper, m = bs(g, g.table.core.schema), g.table.core.query({
          trans: l,
          limit: g.limit,
          values: !0,
          query: {
            index: m,
            range: g.range
          }
        }).then(function(b) {
          return b = b.result, d ? b.map(d) : b;
        })) : (p = [], xs(g, function(b) {
          return p.push(b);
        }, l, g.table.core).then(function() {
          return p;
        }));
      }, s);
    }, fe.prototype.offset = function(s) {
      var a = this._ctx;
      return s <= 0 || (a.offset += s, Ur(a) ? ra(a, function() {
        var l = s;
        return function(d, m) {
          return l === 0 || (l === 1 ? --l : m(function() {
            d.advance(l), l = 0;
          }), !1);
        };
      }) : ra(a, function() {
        var l = s;
        return function() {
          return --l < 0;
        };
      })), this;
    }, fe.prototype.limit = function(s) {
      return this._ctx.limit = Math.min(this._ctx.limit, s), ra(this._ctx, function() {
        var a = s;
        return function(l, d, m) {
          return --a <= 0 && d(m), 0 <= a;
        };
      }, !0), this;
    }, fe.prototype.until = function(s, a) {
      return ta(this._ctx, function(l, d, m) {
        return !s(l.value) || (d(m), a);
      }), this;
    }, fe.prototype.first = function(s) {
      return this.limit(1).toArray(function(a) {
        return a[0];
      }).then(s);
    }, fe.prototype.last = function(s) {
      return this.reverse().first(s);
    }, fe.prototype.filter = function(s) {
      var a;
      return ta(this._ctx, function(l) {
        return s(l.value);
      }), (a = this._ctx).isMatch = ir(a.isMatch, s), this;
    }, fe.prototype.and = function(s) {
      return this.filter(s);
    }, fe.prototype.or = function(s) {
      return new this.db.WhereClause(this._ctx.table, s, this);
    }, fe.prototype.reverse = function() {
      return this._ctx.dir = this._ctx.dir === "prev" ? "next" : "prev", this._ondirectionchange && this._ondirectionchange(this._ctx.dir), this;
    }, fe.prototype.desc = function() {
      return this.reverse();
    }, fe.prototype.eachKey = function(s) {
      var a = this._ctx;
      return a.keysOnly = !a.isMatch, this.each(function(l, d) {
        s(d.key, d);
      });
    }, fe.prototype.eachUniqueKey = function(s) {
      return this._ctx.unique = "unique", this.eachKey(s);
    }, fe.prototype.eachPrimaryKey = function(s) {
      var a = this._ctx;
      return a.keysOnly = !a.isMatch, this.each(function(l, d) {
        s(d.primaryKey, d);
      });
    }, fe.prototype.keys = function(s) {
      var a = this._ctx, l = (a.keysOnly = !a.isMatch, []);
      return this.each(function(d, m) {
        l.push(m.key);
      }).then(function() {
        return l;
      }).then(s);
    }, fe.prototype.primaryKeys = function(s) {
      var a = this._ctx;
      if (a.dir === "next" && Ur(a, !0) && 0 < a.limit) return this._read(function(d) {
        var m = bs(a, a.table.core.schema);
        return a.table.core.query({
          trans: d,
          values: !1,
          limit: a.limit,
          query: {
            index: m,
            range: a.range
          }
        });
      }).then(function(d) {
        return d.result;
      }).then(s);
      a.keysOnly = !a.isMatch;
      var l = [];
      return this.each(function(d, m) {
        l.push(m.primaryKey);
      }).then(function() {
        return l;
      }).then(s);
    }, fe.prototype.uniqueKeys = function(s) {
      return this._ctx.unique = "unique", this.keys(s);
    }, fe.prototype.firstKey = function(s) {
      return this.limit(1).keys(function(a) {
        return a[0];
      }).then(s);
    }, fe.prototype.lastKey = function(s) {
      return this.reverse().firstKey(s);
    }, fe.prototype.distinct = function() {
      var s, a = this._ctx, a = a.index && a.table.schema.idxByName[a.index];
      return a && a.multi && (s = {}, ta(this._ctx, function(d) {
        var d = d.primaryKey.toString(), m = x(s, d);
        return s[d] = !0, !m;
      })), this;
    }, fe.prototype.modify = function(s) {
      var a = this, l = this._ctx;
      return this._write(function(d) {
        function m(T, N) {
          var O = N.failures;
          A += T - N.numFailures;
          for (var R = 0, U = c(O); R < U.length; R++) {
            var j = U[R];
            E.push(O[j]);
          }
        }
        var p = typeof s == "function" ? s : function(T) {
          return sc(T, s);
        }, g = l.table.core, k = g.schema.primaryKey, b = k.outbound, I = k.extractKey, D = 200, k = a.db._options.modifyChunkSize, E = (k && (D = typeof k == "object" ? k[g.name] || k["*"] || 200 : k), []), A = 0, $ = [], w = s === lc;
        return a.clone().primaryKeys().then(function(T) {
          function N(R) {
            var U = Math.min(D, T.length - R), j = T.slice(R, R + U);
            return (w ? Promise.resolve([]) : g.getMany({
              trans: d,
              keys: j,
              cache: "immutable"
            })).then(function(W) {
              var Y = [], q = [], ee = b ? [] : null, Q = w ? j : [];
              if (!w) for (var V = 0; V < U; ++V) {
                var te = W[V], pe = {
                  value: ue(te),
                  primKey: T[R + V]
                };
                p.call(pe, pe.value, pe) !== !1 && (pe.value == null ? Q.push(T[R + V]) : b || he(I(te), I(pe.value)) === 0 ? (q.push(pe.value), b && ee.push(T[R + V])) : (Q.push(T[R + V]), Y.push(pe.value)));
              }
              return Promise.resolve(0 < Y.length && g.mutate({
                trans: d,
                type: "add",
                values: Y
              }).then(function(ge) {
                for (var oe in ge.failures) Q.splice(parseInt(oe), 1);
                m(Y.length, ge);
              })).then(function() {
                return (0 < q.length || O && typeof s == "object") && g.mutate({
                  trans: d,
                  type: "put",
                  keys: ee,
                  values: q,
                  criteria: O,
                  changeSpec: typeof s != "function" && s,
                  isAdditionalChunk: 0 < R
                }).then(function(ge) {
                  return m(q.length, ge);
                });
              }).then(function() {
                return (0 < Q.length || O && w) && g.mutate({
                  trans: d,
                  type: "delete",
                  keys: Q,
                  criteria: O,
                  isAdditionalChunk: 0 < R
                }).then(function(ge) {
                  return vs(l.table, Q, ge);
                }).then(function(ge) {
                  return m(Q.length, ge);
                });
              }).then(function() {
                return T.length > R + U && N(R + D);
              });
            });
          }
          var O = Ur(l) && l.limit === 1 / 0 && (typeof s != "function" || w) && {
            index: l.index,
            range: l.range
          };
          return N(0).then(function() {
            if (0 < E.length) throw new Oe("Error modifying one or more objects", E, A, $);
            return T.length;
          });
        });
      });
    }, fe.prototype.delete = function() {
      var s = this._ctx, a = s.range;
      return !Ur(s) || s.table.schema.yProps || !s.isPrimKey && a.type !== 3 ? this.modify(lc) : this._write(function(l) {
        var d = s.table.core.schema.primaryKey, m = a;
        return s.table.core.count({
          trans: l,
          query: {
            index: d,
            range: m
          }
        }).then(function(p) {
          return s.table.core.mutate({
            trans: l,
            type: "deleteRange",
            range: m
          }).then(function(I) {
            var b = I.failures, I = I.numFailures;
            if (I) throw new Oe("Could not delete some values", Object.keys(b).map(function(D) {
              return b[D];
            }), p - I);
            return p - I;
          });
        });
      });
    };
    var Np = fe;
    function fe() {
    }
    var lc = function(s, a) {
      return a.value = null;
    };
    function Lp(s, a) {
      return s < a ? -1 : s === a ? 0 : 1;
    }
    function Mp(s, a) {
      return a < s ? -1 : s === a ? 0 : 1;
    }
    function rt(s, a, l) {
      return s = s instanceof dc ? new s.Collection(s) : s, s._ctx.error = new (l || TypeError)(a), s;
    }
    function Kr(s) {
      return new s.Collection(s, function() {
        return cc("");
      }).limit(0);
    }
    function ys($, a, l, d) {
      var m, p, g, b, I, D, k, E = l.length;
      if (!l.every(function(T) {
        return typeof T == "string";
      })) return rt($, Ql);
      function A(T) {
        m = T === "next" ? function(O) {
          return O.toUpperCase();
        } : function(O) {
          return O.toLowerCase();
        }, p = T === "next" ? function(O) {
          return O.toLowerCase();
        } : function(O) {
          return O.toUpperCase();
        }, g = T === "next" ? Lp : Mp;
        var N = l.map(function(O) {
          return {
            lower: p(O),
            upper: m(O)
          };
        }).sort(function(O, R) {
          return g(O.lower, R.lower);
        });
        b = N.map(function(O) {
          return O.upper;
        }), I = N.map(function(O) {
          return O.lower;
        }), k = (D = T) === "next" ? "" : d;
      }
      A("next");
      var $ = new $.Collection($, function() {
        return Ot(b[0], I[E - 1] + d);
      }), w = ($._ondirectionchange = function(T) {
        A(T);
      }, 0);
      return $._addAlgorithm(function(T, N, O) {
        var R = T.key;
        if (typeof R == "string") {
          var U = p(R);
          if (a(U, I, w)) return !0;
          for (var j = null, W = w; W < E; ++W) {
            var Y = ((q, ee, Q, V, te, pe) => {
              for (var ge = Math.min(q.length, V.length), oe = -1, ce = 0; ce < ge; ++ce) {
                var Ie = ee[ce];
                if (Ie !== V[ce]) return te(q[ce], Q[ce]) < 0 ? q.substr(0, ce) + Q[ce] + Q.substr(ce + 1) : te(q[ce], V[ce]) < 0 ? q.substr(0, ce) + V[ce] + Q.substr(ce + 1) : 0 <= oe ? q.substr(0, oe) + ee[oe] + Q.substr(oe + 1) : null;
                te(q[ce], Ie) < 0 && (oe = ce);
              }
              return ge < V.length && pe === "next" ? q + Q.substr(q.length) : ge < q.length && pe === "prev" ? q.substr(0, Q.length) : oe < 0 ? null : q.substr(0, oe) + V[oe] + Q.substr(oe + 1);
            })(R, U, b[W], I[W], g, D);
            Y === null && j === null ? w = W + 1 : (j === null || 0 < g(j, Y)) && (j = Y);
          }
          N(j !== null ? function() {
            T.continue(j + k);
          } : O);
        }
        return !1;
      }), $;
    }
    function Ot(s, a, l, d) {
      return {
        type: 2,
        lower: s,
        upper: a,
        lowerOpen: l,
        upperOpen: d
      };
    }
    function cc(s) {
      return {
        type: 1,
        lower: s,
        upper: s
      };
    }
    Object.defineProperty(Ue.prototype, "Collection", {
      get: function() {
        return this._ctx.table.db.Collection;
      },
      enumerable: !1,
      configurable: !0
    }), Ue.prototype.between = function(s, a, l, d) {
      l = l !== !1, d = d === !0;
      try {
        return 0 < this._cmp(s, a) || this._cmp(s, a) === 0 && (l || d) && (!l || !d) ? Kr(this) : new this.Collection(this, function() {
          return Ot(s, a, !l, !d);
        });
      } catch {
        return rt(this, St);
      }
    }, Ue.prototype.equals = function(s) {
      return s == null ? rt(this, St) : new this.Collection(this, function() {
        return cc(s);
      });
    }, Ue.prototype.above = function(s) {
      return s == null ? rt(this, St) : new this.Collection(this, function() {
        return Ot(s, void 0, !0);
      });
    }, Ue.prototype.aboveOrEqual = function(s) {
      return s == null ? rt(this, St) : new this.Collection(this, function() {
        return Ot(s, void 0, !1);
      });
    }, Ue.prototype.below = function(s) {
      return s == null ? rt(this, St) : new this.Collection(this, function() {
        return Ot(void 0, s, !1, !0);
      });
    }, Ue.prototype.belowOrEqual = function(s) {
      return s == null ? rt(this, St) : new this.Collection(this, function() {
        return Ot(void 0, s);
      });
    }, Ue.prototype.startsWith = function(s) {
      return typeof s != "string" ? rt(this, Ql) : this.between(s, s + ar, !0, !0);
    }, Ue.prototype.startsWithIgnoreCase = function(s) {
      return s === "" ? this.startsWith(s) : ys(this, function(a, l) {
        return a.indexOf(l[0]) === 0;
      }, [s], ar);
    }, Ue.prototype.equalsIgnoreCase = function(s) {
      return ys(this, function(a, l) {
        return a === l[0];
      }, [s], "");
    }, Ue.prototype.anyOfIgnoreCase = function() {
      var s = xe.apply(Fe, arguments);
      return s.length === 0 ? Kr(this) : ys(this, function(a, l) {
        return l.indexOf(a) !== -1;
      }, s, "");
    }, Ue.prototype.startsWithAnyOfIgnoreCase = function() {
      var s = xe.apply(Fe, arguments);
      return s.length === 0 ? Kr(this) : ys(this, function(a, l) {
        return l.some(function(d) {
          return a.indexOf(d) === 0;
        });
      }, s, ar);
    }, Ue.prototype.anyOf = function() {
      var s, a, l = this, d = xe.apply(Fe, arguments), m = this._cmp;
      try {
        d.sort(m);
      } catch {
        return rt(this, St);
      }
      return d.length === 0 ? Kr(this) : ((s = new this.Collection(this, function() {
        return Ot(d[0], d[d.length - 1]);
      }))._ondirectionchange = function(p) {
        m = p === "next" ? l._ascending : l._descending, d.sort(m);
      }, a = 0, s._addAlgorithm(function(p, g, b) {
        for (var I = p.key; 0 < m(I, d[a]); ) if (++a === d.length) return g(b), !1;
        return m(I, d[a]) === 0 || (g(function() {
          p.continue(d[a]);
        }), !1);
      }), s);
    }, Ue.prototype.notEqual = function(s) {
      return this.inAnyRange([[-1 / 0, s], [s, this.db._maxKey]], {
        includeLowers: !1,
        includeUppers: !1
      });
    }, Ue.prototype.noneOf = function() {
      var s = xe.apply(Fe, arguments);
      if (s.length === 0) return new this.Collection(this);
      try {
        s.sort(this._ascending);
      } catch {
        return rt(this, St);
      }
      var a = s.reduce(function(l, d) {
        return l ? l.concat([[l[l.length - 1][1], d]]) : [[-1 / 0, d]];
      }, null);
      return a.push([s[s.length - 1], this.db._maxKey]), this.inAnyRange(a, {
        includeLowers: !1,
        includeUppers: !1
      });
    }, Ue.prototype.inAnyRange = function(s, O) {
      var l = this, d = this._cmp, m = this._ascending, p = this._descending, g = this._min, b = this._max;
      if (s.length === 0) return Kr(this);
      if (!s.every(function(R) {
        return R[0] !== void 0 && R[1] !== void 0 && m(R[0], R[1]) <= 0;
      })) return rt(this, "First argument to inAnyRange() must be an Array of two-value Arrays [lower,upper] where upper must not be lower than lower", re.InvalidArgument);
      var I = !O || O.includeLowers !== !1, D = O && O.includeUppers === !0, k, E = m;
      function A(R, U) {
        return E(R[0], U[0]);
      }
      try {
        (k = s.reduce(function(R, U) {
          for (var j = 0, W = R.length; j < W; ++j) {
            var Y = R[j];
            if (d(U[0], Y[1]) < 0 && 0 < d(U[1], Y[0])) {
              Y[0] = g(Y[0], U[0]), Y[1] = b(Y[1], U[1]);
              break;
            }
          }
          return j === W && R.push(U), R;
        }, [])).sort(A);
      } catch {
        return rt(this, St);
      }
      var $ = 0, w = D ? function(R) {
        return 0 < m(R, k[$][1]);
      } : function(R) {
        return 0 <= m(R, k[$][1]);
      }, T = I ? function(R) {
        return 0 < p(R, k[$][0]);
      } : function(R) {
        return 0 <= p(R, k[$][0]);
      }, N = w, O = new this.Collection(this, function() {
        return Ot(k[0][0], k[k.length - 1][1], !I, !D);
      });
      return O._ondirectionchange = function(R) {
        E = R === "next" ? (N = w, m) : (N = T, p), k.sort(A);
      }, O._addAlgorithm(function(R, U, j) {
        for (var W, Y = R.key; N(Y); ) if (++$ === k.length) return U(j), !1;
        return !w(W = Y) && !T(W) || (l._cmp(Y, k[$][1]) === 0 || l._cmp(Y, k[$][0]) === 0 || U(function() {
          E === m ? R.continue(k[$][0]) : R.continue(k[$][1]);
        }), !1);
      }), O;
    }, Ue.prototype.startsWithAnyOf = function() {
      var s = xe.apply(Fe, arguments);
      return s.every(function(a) {
        return typeof a == "string";
      }) ? s.length === 0 ? Kr(this) : this.inAnyRange(s.map(function(a) {
        return [a, a + ar];
      })) : rt(this, "startsWithAnyOf() only works with strings");
    };
    var dc = Ue;
    function Ue() {
    }
    function pt(s) {
      return ke(function(a) {
        return En(a), s(a.target.error), !1;
      });
    }
    function En(s) {
      s.stopPropagation && s.stopPropagation(), s.preventDefault && s.preventDefault();
    }
    var _n = "storagemutated", na = "x-storagemutated-1", Pt = yn(null, _n), Op = (ft.prototype._lock = function() {
      return G(!ne.global), ++this._reculock, this._reculock !== 1 || ne.global || (ne.lockOwnerFor = this), this;
    }, ft.prototype._unlock = function() {
      if (G(!ne.global), --this._reculock == 0) for (ne.global || (ne.lockOwnerFor = null); 0 < this._blockedFuncs.length && !this._locked(); ) {
        var s = this._blockedFuncs.shift();
        try {
          or(s[1], s[0]);
        } catch {
        }
      }
      return this;
    }, ft.prototype._locked = function() {
      return this._reculock && ne.lockOwnerFor !== this;
    }, ft.prototype.create = function(s) {
      var a = this;
      if (this.mode) {
        var l = this.db.idbdb, d = this.db._state.dbOpenError;
        if (G(!this.idbtrans), !s && !l) switch (d && d.name) {
          case "DatabaseClosedError":
            throw new re.DatabaseClosed(d);
          case "MissingAPIError":
            throw new re.MissingAPI(d.message, d);
          default:
            throw new re.OpenFailed(d);
        }
        if (!this.active) throw new re.TransactionInactive();
        G(this._completion._state === null), (s = this.idbtrans = s || (this.db.core || l).transaction(this.storeNames, this.mode, { durability: this.chromeTransactionDurability })).onerror = ke(function(m) {
          En(m), a._reject(s.error);
        }), s.onabort = ke(function(m) {
          En(m), a.active && a._reject(new re.Abort(s.error)), a.active = !1, a.on("abort").fire(m);
        }), s.oncomplete = ke(function() {
          a.active = !1, a._resolve(), "mutatedParts" in s && Pt.storagemutated.fire(s.mutatedParts);
        });
      }
      return this;
    }, ft.prototype._promise = function(s, a, l) {
      var d, m = this;
      return s === "readwrite" && this.mode !== "readwrite" ? De(new re.ReadOnly("Transaction is readonly")) : this.active ? this._locked() ? new J(function(p, g) {
        m._blockedFuncs.push([function() {
          m._promise(s, a, l).then(p, g);
        }, ne]);
      }) : l ? Nt(function() {
        var p = new J(function(g, b) {
          m._lock();
          var I = a(g, b, m);
          I && I.then && I.then(g, b);
        });
        return p.finally(function() {
          return m._unlock();
        }), p._lib = !0, p;
      }) : ((d = new J(function(p, g) {
        var b = a(p, g, m);
        b && b.then && b.then(p, g);
      }))._lib = !0, d) : De(new re.TransactionInactive());
    }, ft.prototype._root = function() {
      return this.parent ? this.parent._root() : this;
    }, ft.prototype.waitFor = function(s) {
      var a, l = this._root(), d = J.resolve(s), m = (l._waitingFor ? l._waitingFor = l._waitingFor.then(function() {
        return d;
      }) : (l._waitingFor = d, l._waitingQueue = [], a = l.idbtrans.objectStore(l.storeNames[0]), function p() {
        for (++l._spinCount; l._waitingQueue.length; ) l._waitingQueue.shift()();
        l._waitingFor && (a.get(-1 / 0).onsuccess = p);
      }()), l._waitingFor);
      return new J(function(p, g) {
        d.then(function(b) {
          return l._waitingQueue.push(ke(p.bind(null, b)));
        }, function(b) {
          return l._waitingQueue.push(ke(g.bind(null, b)));
        }).finally(function() {
          l._waitingFor === m && (l._waitingFor = null);
        });
      });
    }, ft.prototype.abort = function() {
      this.active && (this.active = !1, this.idbtrans && this.idbtrans.abort(), this._reject(new re.Abort()));
    }, ft.prototype.table = function(s) {
      var a = this._memoizedTables || (this._memoizedTables = {});
      if (x(a, s)) return a[s];
      var l = this.schema[s];
      if (l) return (l = new this.db.Table(s, l, this)).core = this.db.core.table(s), a[s] = l;
      throw new re.NotFound("Table " + s + " not part of transaction");
    }, ft);
    function ft() {
    }
    function sa(s, a, l, d, m, p, g, b) {
      return {
        name: s,
        keyPath: a,
        unique: l,
        multi: d,
        auto: m,
        compound: p,
        src: (l && !g ? "&" : "") + (d ? "*" : "") + (m ? "++" : "") + uc(a),
        type: b
      };
    }
    function uc(s) {
      return typeof s == "string" ? s : s ? "[" + [].join.call(s, "+") + "]" : "";
    }
    function oa(s, a, l) {
      return {
        name: s,
        primKey: a,
        indexes: l,
        mappedClass: null,
        idxByName: (d = function(m) {
          return [m.name, m];
        }, l.reduce(function(m, p, g) {
          return p = d(p, g), p && (m[p[0]] = p[1]), m;
        }, {}))
      };
      var d;
    }
    var Tn = function(s) {
      try {
        return s.only([[]]), Tn = function() {
          return [[]];
        }, [[]];
      } catch {
        return Tn = function() {
          return ar;
        }, ar;
      }
    };
    function aa(s) {
      return s == null ? function() {
      } : typeof s == "string" ? (a = s).split(".").length === 1 ? function(l) {
        return l[a];
      } : function(l) {
        return Z(l, a);
      } : function(l) {
        return Z(l, s);
      };
      var a;
    }
    function mc(s) {
      return [].slice.call(s);
    }
    var Pp = 0;
    function kn(s) {
      return s == null ? ":id" : typeof s == "string" ? s : "[".concat(s.join("+"), "]");
    }
    function Bp(s, a, I) {
      function d(w) {
        if (w.type === 3) return null;
        if (w.type === 4) throw new Error("Cannot convert never type to IDBKeyRange");
        var E = w.lower, A = w.upper, $ = w.lowerOpen, w = w.upperOpen;
        return E === void 0 ? A === void 0 ? null : a.upperBound(A, !!w) : A === void 0 ? a.lowerBound(E, !!$) : a.bound(E, A, !!$, !!w);
      }
      function m(k) {
        var E, A = k.name;
        return {
          name: A,
          schema: k,
          mutate: function($) {
            var w = $.trans, T = $.type, N = $.keys, O = $.values, R = $.range;
            return new Promise(function(U, j) {
              U = ke(U);
              var W = w.objectStore(A), Y = W.keyPath == null, q = T === "put" || T === "add";
              if (!q && T !== "delete" && T !== "deleteRange") throw new Error("Invalid operation type: " + T);
              var ee, Q = (N || O || { length: 1 }).length;
              if (N && O && N.length !== O.length) throw new Error("Given keys array must have same length as given values array.");
              if (Q === 0) return U({
                numFailures: 0,
                failures: {},
                results: [],
                lastResult: void 0
              });
              function V($e) {
                ++ge, En($e);
              }
              var te = [], pe = [], ge = 0;
              if (T === "deleteRange") {
                if (R.type === 4) return U({
                  numFailures: ge,
                  failures: pe,
                  results: [],
                  lastResult: void 0
                });
                R.type === 3 ? te.push(ee = W.clear()) : te.push(ee = W.delete(d(R)));
              } else {
                var Y = q ? Y ? [O, N] : [O, null] : [N, null], oe = Y[0], ce = Y[1];
                if (q) for (var Ie = 0; Ie < Q; ++Ie) te.push(ee = ce && ce[Ie] !== void 0 ? W[T](oe[Ie], ce[Ie]) : W[T](oe[Ie])), ee.onerror = V;
                else for (Ie = 0; Ie < Q; ++Ie) te.push(ee = W[T](oe[Ie])), ee.onerror = V;
              }
              function at($e) {
                $e = $e.target.result, te.forEach(function(dr, Ta) {
                  return dr.error != null && (pe[Ta] = dr.error);
                }), U({
                  numFailures: ge,
                  failures: pe,
                  results: T === "delete" ? N : te.map(function(dr) {
                    return dr.result;
                  }),
                  lastResult: $e
                });
              }
              ee.onerror = function($e) {
                V($e), at($e);
              }, ee.onsuccess = at;
            });
          },
          getMany: function($) {
            var w = $.trans, T = $.keys;
            return new Promise(function(N, O) {
              N = ke(N);
              for (var R, U = w.objectStore(A), j = T.length, W = new Array(j), Y = 0, q = 0, ee = function(te) {
                te = te.target, W[te._pos] = te.result, ++q === Y && N(W);
              }, Q = pt(O), V = 0; V < j; ++V) T[V] != null && ((R = U.get(T[V]))._pos = V, R.onsuccess = ee, R.onerror = Q, ++Y);
              Y === 0 && N(W);
            });
          },
          get: function($) {
            var w = $.trans, T = $.key;
            return new Promise(function(N, O) {
              N = ke(N);
              var R = w.objectStore(A).get(T);
              R.onsuccess = function(U) {
                return N(U.target.result);
              }, R.onerror = pt(O);
            });
          },
          query: (E = b, function($) {
            return new Promise(function(w, T) {
              w = ke(w);
              var N, O, R, q = $.trans, U = $.values, j = $.limit, Y = $.query, W = j === 1 / 0 ? void 0 : j, ee = Y.index, Y = Y.range, q = q.objectStore(A), q = ee.isPrimaryKey ? q : q.index(ee.name), ee = d(Y);
              if (j === 0) return w({ result: [] });
              E ? ((Y = U ? q.getAll(ee, W) : q.getAllKeys(ee, W)).onsuccess = function(Q) {
                return w({ result: Q.target.result });
              }, Y.onerror = pt(T)) : (N = 0, O = !U && "openKeyCursor" in q ? q.openKeyCursor(ee) : q.openCursor(ee), R = [], O.onsuccess = function(Q) {
                var V = O.result;
                return !V || (R.push(U ? V.value : V.primaryKey), ++N === j) ? w({ result: R }) : void V.continue();
              }, O.onerror = pt(T));
            });
          }),
          openCursor: function($) {
            var w = $.trans, T = $.values, N = $.query, O = $.reverse, R = $.unique;
            return new Promise(function(U, j) {
              U = ke(U);
              var q = N.index, W = N.range, Y = w.objectStore(A), Y = q.isPrimaryKey ? Y : Y.index(q.name), q = O ? R ? "prevunique" : "prev" : R ? "nextunique" : "next", ee = !T && "openKeyCursor" in Y ? Y.openKeyCursor(d(W), q) : Y.openCursor(d(W), q);
              ee.onerror = pt(j), ee.onsuccess = ke(function(Q) {
                var V, te, pe, ge, oe = ee.result;
                oe ? (oe.___id = ++Pp, oe.done = !1, V = oe.continue.bind(oe), te = (te = oe.continuePrimaryKey) && te.bind(oe), pe = oe.advance.bind(oe), ge = function() {
                  throw new Error("Cursor not stopped");
                }, oe.trans = w, oe.stop = oe.continue = oe.continuePrimaryKey = oe.advance = function() {
                  throw new Error("Cursor not started");
                }, oe.fail = ke(j), oe.next = function() {
                  var ce = this, Ie = 1;
                  return this.start(function() {
                    return Ie-- ? ce.continue() : ce.stop();
                  }).then(function() {
                    return ce;
                  });
                }, oe.start = function(ce) {
                  function Ie() {
                    if (ee.result) try {
                      ce();
                    } catch ($e) {
                      oe.fail($e);
                    }
                    else oe.done = !0, oe.start = function() {
                      throw new Error("Cursor behind last entry");
                    }, oe.stop();
                  }
                  var at = new Promise(function($e, dr) {
                    $e = ke($e), ee.onerror = pt(dr), oe.fail = dr, oe.stop = function(Ta) {
                      oe.stop = oe.continue = oe.continuePrimaryKey = oe.advance = ge, $e(Ta);
                    };
                  });
                  return ee.onsuccess = ke(function($e) {
                    ee.onsuccess = Ie, Ie();
                  }), oe.continue = V, oe.continuePrimaryKey = te, oe.advance = pe, Ie(), at;
                }, U(oe)) : U(null);
              }, j);
            });
          },
          count: function($) {
            var w = $.query, T = $.trans, N = w.index, O = w.range;
            return new Promise(function(R, U) {
              var j = T.objectStore(A), j = N.isPrimaryKey ? j : j.index(N.name), W = d(O), W = W ? j.count(W) : j.count();
              W.onsuccess = ke(function(Y) {
                return R(Y.target.result);
              }), W.onerror = pt(U);
            });
          }
        };
      }
      p = I, g = mc((I = s).objectStoreNames);
      var p, I = {
        schema: {
          name: I.name,
          tables: g.map(function(k) {
            return p.objectStore(k);
          }).map(function(k) {
            var E = k.keyPath, A = k.autoIncrement, w = u(E), $ = {}, w = {
              name: k.name,
              primaryKey: {
                name: null,
                isPrimaryKey: !0,
                outbound: E == null,
                compound: w,
                keyPath: E,
                autoIncrement: A,
                unique: !0,
                extractKey: aa(E)
              },
              indexes: mc(k.indexNames).map(function(T) {
                return k.index(T);
              }).map(function(R) {
                var U = R.name, N = R.unique, O = R.multiEntry, R = R.keyPath, U = {
                  name: U,
                  compound: u(R),
                  keyPath: R,
                  unique: N,
                  multiEntry: O,
                  extractKey: aa(R)
                };
                return $[kn(R)] = U;
              }),
              getIndexByKeyPath: function(T) {
                return $[kn(T)];
              }
            };
            return $[":id"] = w.primaryKey, E != null && ($[kn(E)] = w.primaryKey), w;
          })
        },
        hasGetAll: 0 < g.length && "getAll" in p.objectStore(g[0]) && !(typeof navigator < "u" && /Safari/.test(navigator.userAgent) && !/(Chrome\/|Edge\/)/.test(navigator.userAgent) && [].concat(navigator.userAgent.match(/Safari\/(\d*)/))[1] < 604)
      }, g = I.schema, b = I.hasGetAll, I = g.tables.map(m), D = {};
      return I.forEach(function(k) {
        return D[k.name] = k;
      }), {
        stack: "dbcore",
        transaction: s.transaction.bind(s),
        table: function(k) {
          if (D[k]) return D[k];
          throw new Error("Table '".concat(k, "' not found"));
        },
        MIN_KEY: -1 / 0,
        MAX_KEY: Tn(a),
        schema: g
      };
    }
    function Up(s, a, l, d) {
      return l = l.IDBKeyRange, a = Bp(a, l, d), { dbcore: s.dbcore.reduce(function(m, p) {
        return p = p.create, n(n({}, m), p(m));
      }, a) };
    }
    function Ss(s, a) {
      var l = a.db, l = Up(s._middlewares, l, s._deps, a);
      s.core = l.dbcore, s.tables.forEach(function(d) {
        var m = d.name;
        s.core.schema.tables.some(function(p) {
          return p.name === m;
        }) && (d.core = s.core.table(m), s[m] instanceof s.Table) && (s[m].core = d.core);
      });
    }
    function Es(s, a, l, d) {
      l.forEach(function(m) {
        var p = d[m];
        a.forEach(function(g) {
          var b = function I(D, k) {
            return L(D, k) || (D = f(D)) && I(D, k);
          }(g, m);
          (!b || "value" in b && b.value === void 0) && (g === s.Transaction.prototype || g instanceof s.Transaction ? _(g, m, {
            get: function() {
              return this.table(m);
            },
            set: function(I) {
              S(this, m, {
                value: I,
                writable: !0,
                configurable: !0,
                enumerable: !0
              });
            }
          }) : g[m] = new s.Table(m, p));
        });
      });
    }
    function ia(s, a) {
      a.forEach(function(l) {
        for (var d in l) l[d] instanceof s.Table && delete l[d];
      });
    }
    function Kp(s, a) {
      return s._cfg.version - a._cfg.version;
    }
    function Hp(s, a, l, d) {
      var m = s._dbSchema, p = (l.objectStoreNames.contains("$meta") && !m.$meta && (m.$meta = oa("$meta", pc("")[0], []), s._storeNames.push("$meta")), s._createTransaction("readwrite", s._storeNames, m)), g = (p.create(l), p._completion.catch(d), p._reject.bind(p)), b = ne.transless || ne;
      Nt(function() {
        if (ne.trans = p, ne.transless = b, a !== 0) return Ss(s, l), D = a, ((I = p).storeNames.includes("$meta") ? I.table("$meta").get("version").then(function(k) {
          return k ?? D;
        }) : J.resolve(D)).then(function(N) {
          var E = s, A = N, $ = p, w = l, T = [], N = E._versions, O = E._dbSchema = Ts(0, E.idbdb, w);
          return (N = N.filter(function(R) {
            return R._cfg.version >= A;
          })).length === 0 ? J.resolve() : (N.forEach(function(R) {
            T.push(function() {
              var U, j, W, Y = O, q = R._cfg.dbschema, ee = (ks(E, Y, w), ks(E, q, w), O = E._dbSchema = q, la(Y, q)), Q = (ee.add.forEach(function(V) {
                ca(w, V[0], V[1].primKey, V[1].indexes);
              }), ee.change.forEach(function(V) {
                if (V.recreate) throw new re.Upgrade("Not yet support for changing primary key");
                var te = w.objectStore(V.name);
                V.add.forEach(function(pe) {
                  return _s(te, pe);
                }), V.change.forEach(function(pe) {
                  te.deleteIndex(pe.name), _s(te, pe);
                }), V.del.forEach(function(pe) {
                  return te.deleteIndex(pe);
                });
              }), R._cfg.contentUpgrade);
              if (Q && R._cfg.version > A) return Ss(E, w), $._memoizedTables = {}, U = X(q), ee.del.forEach(function(V) {
                U[V] = Y[V];
              }), ia(E, [E.Transaction.prototype]), Es(E, [E.Transaction.prototype], c(U), U), $.schema = U, (j = Ve(Q)) && Pr(), q = J.follow(function() {
                var V;
                (W = Q($)) && j && (V = Lt.bind(null, null), W.then(V, V));
              }), W && typeof W.then == "function" ? J.resolve(W) : q.then(function() {
                return W;
              });
            }), T.push(function(U) {
              var j = R._cfg.dbschema, W = U;
              [].slice.call(W.db.objectStoreNames).forEach(function(Y) {
                return j[Y] == null && W.db.deleteObjectStore(Y);
              }), ia(E, [E.Transaction.prototype]), Es(E, [E.Transaction.prototype], E._storeNames, E._dbSchema), $.schema = E._dbSchema;
            }), T.push(function(U) {
              E.idbdb.objectStoreNames.contains("$meta") && (Math.ceil(E.idbdb.version / 10) === R._cfg.version ? (E.idbdb.deleteObjectStore("$meta"), delete E._dbSchema.$meta, E._storeNames = E._storeNames.filter(function(j) {
                return j !== "$meta";
              })) : U.objectStore("$meta").put(R._cfg.version, "version"));
            });
          }), function R() {
            return T.length ? J.resolve(T.shift()($.idbtrans)).then(R) : J.resolve();
          }().then(function() {
            hc(O, w);
          }));
        }).catch(g);
        var I, D;
        c(m).forEach(function(k) {
          ca(l, k, m[k].primKey, m[k].indexes);
        }), Ss(s, l), J.follow(function() {
          return s.on.populate.fire(p);
        }).catch(g);
      });
    }
    function Gp(s, a) {
      hc(s._dbSchema, a), a.db.version % 10 != 0 || a.objectStoreNames.contains("$meta") || a.db.createObjectStore("$meta").add(Math.ceil(a.db.version / 10 - 1), "version");
      var l = Ts(0, s.idbdb, a);
      ks(s, s._dbSchema, a);
      for (var d = 0, m = la(l, s._dbSchema).change; d < m.length; d++) {
        var p = ((g) => {
          if (g.change.length || g.recreate) return console.warn("Unable to patch indexes of table ".concat(g.name, " because it has changes on the type of index or primary key.")), { value: void 0 };
          var b = a.objectStore(g.name);
          g.add.forEach(function(I) {
            ht && console.debug("Dexie upgrade patch: Creating missing index ".concat(g.name, ".").concat(I.src)), _s(b, I);
          });
        })(m[d]);
        if (typeof p == "object") return p.value;
      }
    }
    function la(s, a) {
      var l, d = {
        del: [],
        add: [],
        change: []
      };
      for (l in s) a[l] || d.del.push(l);
      for (l in a) {
        var m = s[l], p = a[l];
        if (m) {
          var g = {
            name: l,
            def: p,
            recreate: !1,
            del: [],
            add: [],
            change: []
          };
          if ("" + (m.primKey.keyPath || "") != "" + (p.primKey.keyPath || "") || m.primKey.auto !== p.primKey.auto) g.recreate = !0, d.change.push(g);
          else {
            var b = m.idxByName, I = p.idxByName, D = void 0;
            for (D in b) I[D] || g.del.push(D);
            for (D in I) {
              var k = b[D], E = I[D];
              k ? k.src !== E.src && g.change.push(E) : g.add.push(E);
            }
            (0 < g.del.length || 0 < g.add.length || 0 < g.change.length) && d.change.push(g);
          }
        } else d.add.push([l, p]);
      }
      return d;
    }
    function ca(s, a, l, d) {
      var m = s.db.createObjectStore(a, l.keyPath ? {
        keyPath: l.keyPath,
        autoIncrement: l.auto
      } : { autoIncrement: l.auto });
      d.forEach(function(p) {
        return _s(m, p);
      });
    }
    function hc(s, a) {
      c(s).forEach(function(l) {
        a.db.objectStoreNames.contains(l) || (ht && console.debug("Dexie: Creating missing table", l), ca(a, l, s[l].primKey, s[l].indexes));
      });
    }
    function _s(s, a) {
      s.createIndex(a.name, a.keyPath, {
        unique: a.unique,
        multiEntry: a.multi
      });
    }
    function Ts(s, a, l) {
      var d = {};
      return B(a.objectStoreNames, 0).forEach(function(m) {
        for (var p = l.objectStore(m), g = sa(uc(D = p.keyPath), D || "", !0, !1, !!p.autoIncrement, D && typeof D != "string", !0), b = [], I = 0; I < p.indexNames.length; ++I) {
          var k = p.index(p.indexNames[I]), D = k.keyPath, k = sa(k.name, D, !!k.unique, !!k.multiEntry, !1, D && typeof D != "string", !1);
          b.push(k);
        }
        d[m] = oa(m, g, b);
      }), d;
    }
    function ks(s, a, l) {
      for (var d = l.db.objectStoreNames, m = 0; m < d.length; ++m) {
        var p = d[m], g = l.objectStore(p);
        s._hasGetAll = "getAll" in g;
        for (var b = 0; b < g.indexNames.length; ++b) {
          var I, D = g.indexNames[b], k = g.index(D).keyPath, k = typeof k == "string" ? k : "[" + B(k).join("+") + "]";
          a[p] && (I = a[p].idxByName[k]) && (I.name = D, delete a[p].idxByName[k], a[p].idxByName[D] = I);
        }
      }
      typeof navigator < "u" && /Safari/.test(navigator.userAgent) && !/(Chrome\/|Edge\/)/.test(navigator.userAgent) && i.WorkerGlobalScope && i instanceof i.WorkerGlobalScope && [].concat(navigator.userAgent.match(/Safari\/(\d*)/))[1] < 604 && (s._hasGetAll = !1);
    }
    function pc(s) {
      return s.split(",").map(function(a, l) {
        var m = a.split(":"), d = (d = m[1]) == null ? void 0 : d.trim(), m = (a = m[0].trim()).replace(/([&*]|\+\+)/g, ""), p = /^\[/.test(m) ? m.match(/^\[(.*)\]$/)[1].split("+") : m;
        return sa(m, p || null, /\&/.test(a), /\*/.test(a), /\+\+/.test(a), u(p), l === 0, d);
      });
    }
    Hr.prototype._createTableSchema = oa, Hr.prototype._parseIndexSyntax = pc, Hr.prototype._parseStoresSpec = function(s, a) {
      var l = this;
      c(s).forEach(function(d) {
        if (s[d] !== null) {
          var m = l._parseIndexSyntax(s[d]), p = m.shift();
          if (!p) throw new re.Schema("Invalid schema for table " + d + ": " + s[d]);
          if (p.unique = !0, p.multi) throw new re.Schema("Primary key cannot be multiEntry*");
          m.forEach(function(g) {
            if (g.auto) throw new re.Schema("Only primary key can be marked as autoIncrement (++)");
            if (!g.keyPath) throw new re.Schema("Index must have a name and cannot be an empty string");
          }), p = l._createTableSchema(d, p, m), a[d] = p;
        }
      });
    }, Hr.prototype.stores = function(l) {
      var a = this.db, l = (this._cfg.storesSource = this._cfg.storesSource ? h(this._cfg.storesSource, l) : l, a._versions), d = {}, m = {};
      return l.forEach(function(p) {
        h(d, p._cfg.storesSource), m = p._cfg.dbschema = {}, p._parseStoresSpec(d, m);
      }), a._dbSchema = m, ia(a, [
        a._allTables,
        a,
        a.Transaction.prototype
      ]), Es(a, [
        a._allTables,
        a,
        a.Transaction.prototype,
        this._cfg.tables
      ], c(m), m), a._storeNames = c(m), this;
    }, Hr.prototype.upgrade = function(s) {
      return this._cfg.contentUpgrade = jo(this._cfg.contentUpgrade || ye, s), this;
    };
    var zp = Hr;
    function Hr() {
    }
    function da(s, a) {
      var l = s._dbNamesDB;
      return l || (l = s._dbNamesDB = new Et(fs, {
        addons: [],
        indexedDB: s,
        IDBKeyRange: a
      })).version(1).stores({ dbnames: "name" }), l.table("dbnames");
    }
    function ua(s) {
      return s && typeof s.databases == "function";
    }
    function ma(s) {
      return Nt(function() {
        return ne.letThrough = !0, s();
      });
    }
    function ha(s) {
      return !("from" in s);
    }
    var Ye = function(s, a) {
      var l;
      if (!this) return l = new Ye(), s && "d" in s && h(l, s), l;
      h(this, arguments.length ? {
        d: 1,
        from: s,
        to: 1 < arguments.length ? a : s
      } : { d: 0 });
    };
    function wn(s, a, l) {
      var d = he(a, l);
      if (!isNaN(d)) {
        if (0 < d) throw RangeError();
        if (ha(s)) return h(s, {
          from: a,
          to: l,
          d: 1
        });
        var d = s.l, m = s.r;
        if (he(l, s.from) < 0) return d ? wn(d, a, l) : s.l = {
          from: a,
          to: l,
          d: 1,
          l: null,
          r: null
        }, gc(s);
        if (0 < he(a, s.to)) return m ? wn(m, a, l) : s.r = {
          from: a,
          to: l,
          d: 1,
          l: null,
          r: null
        }, gc(s);
        he(a, s.from) < 0 && (s.from = a, s.l = null, s.d = m ? m.d + 1 : 1), 0 < he(l, s.to) && (s.to = l, s.r = null, s.d = s.l ? s.l.d + 1 : 1), a = !s.r, d && !s.l && In(s, d), m && a && In(s, m);
      }
    }
    function In(s, a) {
      ha(a) || function l(d, m) {
        var p = m.from, g = m.l, b = m.r;
        wn(d, p, m.to), g && l(d, g), b && l(d, b);
      }(s, a);
    }
    function fc(s, a) {
      var l = ws(a), d = l.next();
      if (!d.done) for (var m = d.value, p = ws(s), g = p.next(m.from), b = g.value; !d.done && !g.done; ) {
        if (he(b.from, m.to) <= 0 && 0 <= he(b.to, m.from)) return !0;
        he(m.from, b.from) < 0 ? m = (d = l.next(b.from)).value : b = (g = p.next(m.from)).value;
      }
      return !1;
    }
    function ws(s) {
      var a = ha(s) ? null : {
        s: 0,
        n: s
      };
      return { next: function(l) {
        for (var d = 0 < arguments.length; a; ) switch (a.s) {
          case 0:
            if (a.s = 1, d) for (; a.n.l && he(l, a.n.from) < 0; ) a = {
              up: a,
              n: a.n.l,
              s: 1
            };
            else for (; a.n.l; ) a = {
              up: a,
              n: a.n.l,
              s: 1
            };
          case 1:
            if (a.s = 2, !d || he(l, a.n.to) <= 0) return {
              value: a.n,
              done: !1
            };
          case 2:
            if (a.n.r) {
              a.s = 3, a = {
                up: a,
                n: a.n.r,
                s: 0
              };
              continue;
            }
          case 3:
            a = a.up;
        }
        return { done: !0 };
      } };
    }
    function gc(s) {
      var a, l, d, m = (((m = s.r) == null ? void 0 : m.d) || 0) - (((m = s.l) == null ? void 0 : m.d) || 0), m = 1 < m ? "r" : m < -1 ? "l" : "";
      m && (a = m == "r" ? "l" : "r", l = n({}, s), d = s[m], s.from = d.from, s.to = d.to, s[m] = d[m], l[m] = d[a], (s[a] = l).d = vc(l)), s.d = vc(s);
    }
    function vc(l) {
      var a = l.r, l = l.l;
      return (a ? l ? Math.max(a.d, l.d) : a.d : l ? l.d : 0) + 1;
    }
    function Is(s, a) {
      return c(a).forEach(function(l) {
        s[l] ? In(s[l], a[l]) : s[l] = function d(m) {
          var p, g, b = {};
          for (p in m) x(m, p) && (g = m[p], b[p] = !g || typeof g != "object" || se.has(g.constructor) ? g : d(g));
          return b;
        }(a[l]);
      }), s;
    }
    function pa(s, a) {
      return s.all || a.all || Object.keys(s).some(function(l) {
        return a[l] && fc(a[l], s[l]);
      });
    }
    y(Ye.prototype, ((tt = {
      add: function(s) {
        return In(this, s), this;
      },
      addKey: function(s) {
        return wn(this, s, s), this;
      },
      addKeys: function(s) {
        var a = this;
        return s.forEach(function(l) {
          return wn(a, l, l);
        }), this;
      },
      hasKey: function(s) {
        var a = ws(this).next(s).value;
        return a && he(a.from, s) <= 0 && 0 <= he(a.to, s);
      }
    })[be] = function() {
      return ws(this);
    }, tt));
    var lr = {}, fa = {}, ga = !1;
    function As(s) {
      Is(fa, s), ga || (ga = !0, setTimeout(function() {
        ga = !1, va(fa, !(fa = {}));
      }, 0));
    }
    function va(s, a) {
      a === void 0 && (a = !1);
      var l = /* @__PURE__ */ new Set();
      if (s.all) for (var d = 0, m = Object.values(lr); d < m.length; d++) bc(b = m[d], s, l, a);
      else for (var p in s) {
        var g, b, p = /^idb\:\/\/(.*)\/(.*)\//.exec(p);
        p && (g = p[1], p = p[2], b = lr["idb://".concat(g, "/").concat(p)]) && bc(b, s, l, a);
      }
      l.forEach(function(I) {
        return I();
      });
    }
    function bc(s, a, l, d) {
      for (var m = [], p = 0, g = Object.entries(s.queries.query); p < g.length; p++) {
        for (var b = g[p], I = b[0], D = [], k = 0, E = b[1]; k < E.length; k++) {
          var A = E[k];
          pa(a, A.obsSet) ? A.subscribers.forEach(function(N) {
            return l.add(N);
          }) : d && D.push(A);
        }
        d && m.push([I, D]);
      }
      if (d) for (var $ = 0, w = m; $ < w.length; $++) {
        var T = w[$], I = T[0], D = T[1];
        s.queries.query[I] = D;
      }
    }
    function jp(s) {
      var a = s._state, l = s._deps.indexedDB;
      if (a.isBeingOpened || s.idbdb) return a.dbReadyPromise.then(function() {
        return a.dbOpenError ? De(a.dbOpenError) : s;
      });
      a.isBeingOpened = !0, a.dbOpenError = null, a.openComplete = !1;
      var d = a.openCanceller, m = Math.round(10 * s.verno), p = !1;
      function g() {
        if (a.openCanceller !== d) throw new re.DatabaseClosed("db.open() was cancelled");
      }
      function b() {
        return new J(function(A, $) {
          if (g(), !l) throw new re.MissingAPI();
          var w = s.name, T = a.autoSchema || !m ? l.open(w) : l.open(w, m);
          if (!T) throw new re.MissingAPI();
          T.onerror = pt($), T.onblocked = ke(s._fireOnBlocked), T.onupgradeneeded = ke(function(N) {
            var O;
            k = T.transaction, a.autoSchema && !s._options.allowEmptyDB ? (T.onerror = En, k.abort(), T.result.close(), (O = l.deleteDatabase(w)).onsuccess = O.onerror = ke(function() {
              $(new re.NoSuchDatabase("Database ".concat(w, " doesnt exist")));
            })) : (k.onerror = pt($), O = N.oldVersion > Math.pow(2, 62) ? 0 : N.oldVersion, E = O < 1, s.idbdb = T.result, p && Gp(s, k), Hp(s, O / 10, k, $));
          }, $), T.onsuccess = ke(function() {
            k = null;
            var N, O, R, U, j, W, Y = s.idbdb = T.result, q = B(Y.objectStoreNames);
            if (0 < q.length) try {
              var ee = Y.transaction((j = q).length === 1 ? j[0] : j, "readonly");
              if (a.autoSchema) W = Y, U = ee, (R = s).verno = W.version / 10, U = R._dbSchema = Ts(0, W, U), R._storeNames = B(W.objectStoreNames, 0), Es(R, [R._allTables], c(U), U);
              else if (ks(s, s._dbSchema, ee), O = ee, ((O = la(Ts(0, (N = s).idbdb, O), N._dbSchema)).add.length || O.change.some(function(Q) {
                return Q.add.length || Q.change.length;
              })) && !p) return console.warn("Dexie SchemaDiff: Schema was extended without increasing the number passed to db.version(). Dexie will add missing parts and increment native version number to workaround this."), Y.close(), m = Y.version + 1, p = !0, A(b());
              Ss(s, ee);
            } catch {
            }
            Br.push(s), Y.onversionchange = ke(function(Q) {
              a.vcFired = !0, s.on("versionchange").fire(Q);
            }), Y.onclose = ke(function() {
              s.close({ disableAutoOpen: !1 });
            }), E && (q = s._deps, j = w, ua(W = q.indexedDB) || j === fs || da(W, q.IDBKeyRange).put({ name: j }).catch(ye)), A();
          }, $);
        }).catch(function(A) {
          switch (A?.name) {
            case "UnknownError":
              if (0 < a.PR1398_maxLoop) return a.PR1398_maxLoop--, console.warn("Dexie: Workaround for Chrome UnknownError on open()"), b();
              break;
            case "VersionError":
              if (0 < m) return m = 0, b();
          }
          return J.reject(A);
        });
      }
      var I, D = a.dbReadyResolve, k = null, E = !1;
      return J.race([d, (typeof navigator > "u" ? J.resolve() : !navigator.userAgentData && /Safari\//.test(navigator.userAgent) && !/Chrom(e|ium)\//.test(navigator.userAgent) && indexedDB.databases ? new Promise(function(A) {
        function $() {
          return indexedDB.databases().finally(A);
        }
        I = setInterval($, 100), $();
      }).finally(function() {
        return clearInterval(I);
      }) : Promise.resolve()).then(b)]).then(function() {
        return g(), a.onReadyBeingFired = [], J.resolve(ma(function() {
          return s.on.ready.fire(s.vip);
        })).then(function A() {
          var $;
          if (0 < a.onReadyBeingFired.length) return $ = a.onReadyBeingFired.reduce(jo, ye), a.onReadyBeingFired = [], J.resolve(ma(function() {
            return $(s.vip);
          })).then(A);
        });
      }).finally(function() {
        a.openCanceller === d && (a.onReadyBeingFired = null, a.isBeingOpened = !1);
      }).catch(function(A) {
        a.dbOpenError = A;
        try {
          k && k.abort();
        } catch {
        }
        return d === a.openCanceller && s._close(), De(A);
      }).finally(function() {
        a.openComplete = !0, D();
      }).then(function() {
        var A;
        return E && (A = {}, s.tables.forEach(function($) {
          $.schema.indexes.forEach(function(w) {
            w.name && (A["idb://".concat(s.name, "/").concat($.name, "/").concat(w.name)] = new Ye(-1 / 0, [[[]]]));
          }), A["idb://".concat(s.name, "/").concat($.name, "/")] = A["idb://".concat(s.name, "/").concat($.name, "/:dels")] = new Ye(-1 / 0, [[[]]]);
        }), Pt(_n).fire(A), va(A, !0)), s;
      });
    }
    function ba(s) {
      function a(p) {
        return s.next(p);
      }
      var l = m(a), d = m(function(p) {
        return s.throw(p);
      });
      function m(p) {
        return function(b) {
          var b = p(b), I = b.value;
          return b.done ? I : I && typeof I.then == "function" ? I.then(l, d) : u(I) ? Promise.all(I).then(l, d) : l(I);
        };
      }
      return m(a)();
    }
    function $s(s, a, l) {
      for (var d = u(s) ? s.slice() : [s], m = 0; m < l; ++m) d.push(a);
      return d;
    }
    var qp = {
      stack: "dbcore",
      name: "VirtualIndexMiddleware",
      level: 1,
      create: function(s) {
        return n(n({}, s), { table: function(d) {
          var l = s.table(d), d = l.schema, m = {}, p = [];
          function g(A, $, w) {
            var R = kn(A), T = m[R] = m[R] || [], N = A == null ? 0 : typeof A == "string" ? 1 : A.length, O = 0 < $, R = n(n({}, w), {
              name: O ? "".concat(R, "(virtual-from:").concat(w.name, ")") : w.name,
              lowLevelIndex: w,
              isVirtual: O,
              keyTail: $,
              keyLength: N,
              extractKey: aa(A),
              unique: !O && w.unique
            });
            return T.push(R), R.isPrimaryKey || p.push(R), 1 < N && g(N === 2 ? A[0] : A.slice(0, N - 1), $ + 1, w), T.sort(function(U, j) {
              return U.keyTail - j.keyTail;
            }), R;
          }
          var b = g(d.primaryKey.keyPath, 0, d.primaryKey);
          m[":id"] = [b];
          for (var I = 0, D = d.indexes; I < D.length; I++) {
            var k = D[I];
            g(k.keyPath, 0, k);
          }
          function E(A) {
            var $, w = A.query.index;
            return w.isVirtual ? n(n({}, A), { query: {
              index: w.lowLevelIndex,
              range: ($ = A.query.range, w = w.keyTail, {
                type: $.type === 1 ? 2 : $.type,
                lower: $s($.lower, $.lowerOpen ? s.MAX_KEY : s.MIN_KEY, w),
                lowerOpen: !0,
                upper: $s($.upper, $.upperOpen ? s.MIN_KEY : s.MAX_KEY, w),
                upperOpen: !0
              })
            } }) : A;
          }
          return n(n({}, l), {
            schema: n(n({}, d), {
              primaryKey: b,
              indexes: p,
              getIndexByKeyPath: function(A) {
                return (A = m[kn(A)]) && A[0];
              }
            }),
            count: function(A) {
              return l.count(E(A));
            },
            query: function(A) {
              return l.query(E(A));
            },
            openCursor: function(A) {
              var $ = A.query.index, w = $.keyTail, T = $.keyLength;
              return $.isVirtual ? l.openCursor(E(A)).then(function(O) {
                return O && N(O);
              }) : l.openCursor(A);
              function N(O) {
                return Object.create(O, {
                  continue: { value: function(R) {
                    R != null ? O.continue($s(R, A.reverse ? s.MAX_KEY : s.MIN_KEY, w)) : A.unique ? O.continue(O.key.slice(0, T).concat(A.reverse ? s.MIN_KEY : s.MAX_KEY, w)) : O.continue();
                  } },
                  continuePrimaryKey: { value: function(R, U) {
                    O.continuePrimaryKey($s(R, s.MAX_KEY, w), U);
                  } },
                  primaryKey: { get: function() {
                    return O.primaryKey;
                  } },
                  key: { get: function() {
                    var R = O.key;
                    return T === 1 ? R[0] : R.slice(0, T);
                  } },
                  value: { get: function() {
                    return O.value;
                  } }
                });
              }
            }
          });
        } });
      }
    };
    function xa(s, a, l, d) {
      return l = l || {}, d = d || "", c(s).forEach(function(m) {
        var p, g, b;
        x(a, m) ? (p = s[m], g = a[m], typeof p == "object" && typeof g == "object" && p && g ? (b = le(p)) !== le(g) ? l[d + m] = a[m] : b === "Object" ? xa(p, g, l, d + m + ".") : p !== g && (l[d + m] = a[m]) : p !== g && (l[d + m] = a[m])) : l[d + m] = void 0;
      }), c(a).forEach(function(m) {
        x(s, m) || (l[d + m] = a[m]);
      }), l;
    }
    function ya(s, a) {
      return a.type === "delete" ? a.keys : a.keys || a.values.map(s.extractKey);
    }
    var Fp = {
      stack: "dbcore",
      name: "HooksMiddleware",
      level: 2,
      create: function(s) {
        return n(n({}, s), { table: function(a) {
          var l = s.table(a), d = l.schema.primaryKey;
          return n(n({}, l), { mutate: function(m) {
            var p = ne.trans, g = p.table(a).hook, b = g.deleting, I = g.creating, D = g.updating;
            switch (m.type) {
              case "add":
                if (I.fire === ye) break;
                return p._promise("readwrite", function() {
                  return k(m);
                }, !0);
              case "put":
                if (I.fire === ye && D.fire === ye) break;
                return p._promise("readwrite", function() {
                  return k(m);
                }, !0);
              case "delete":
                if (b.fire === ye) break;
                return p._promise("readwrite", function() {
                  return k(m);
                }, !0);
              case "deleteRange":
                if (b.fire === ye) break;
                return p._promise("readwrite", function() {
                  return function E(A, $, w) {
                    return l.query({
                      trans: A,
                      values: !1,
                      query: {
                        index: d,
                        range: $
                      },
                      limit: w
                    }).then(function(T) {
                      var N = T.result;
                      return k({
                        type: "delete",
                        keys: N,
                        trans: A
                      }).then(function(O) {
                        return 0 < O.numFailures ? Promise.reject(O.failures[0]) : N.length < w ? {
                          failures: [],
                          numFailures: 0,
                          lastResult: void 0
                        } : E(A, n(n({}, $), {
                          lower: N[N.length - 1],
                          lowerOpen: !0
                        }), w);
                      });
                    });
                  }(m.trans, m.range, 1e4);
                }, !0);
            }
            return l.mutate(m);
            function k(E) {
              var A, $, w, T = ne.trans, N = E.keys || ya(d, E);
              if (N) return (E = E.type === "add" || E.type === "put" ? n(n({}, E), { keys: N }) : n({}, E)).type !== "delete" && (E.values = o([], E.values, !0)), E.keys && (E.keys = o([], E.keys, !0)), A = l, w = N, (($ = E).type === "add" ? Promise.resolve([]) : A.getMany({
                trans: $.trans,
                keys: w,
                cache: "immutable"
              })).then(function(O) {
                var R = N.map(function(U, j) {
                  var W, Y, q, ee = O[j], Q = {
                    onerror: null,
                    onsuccess: null
                  };
                  return E.type === "delete" ? b.fire.call(Q, U, ee, T) : E.type === "add" || ee === void 0 ? (W = I.fire.call(Q, U, E.values[j], T), U == null && W != null && (E.keys[j] = U = W, d.outbound || H(E.values[j], d.keyPath, U))) : (W = xa(ee, E.values[j]), (Y = D.fire.call(Q, W, U, ee, T)) && (q = E.values[j], Object.keys(Y).forEach(function(V) {
                    x(q, V) ? q[V] = Y[V] : H(q, V, Y[V]);
                  }))), Q;
                });
                return l.mutate(E).then(function(U) {
                  for (var j = U.failures, W = U.results, Y = U.numFailures, U = U.lastResult, q = 0; q < N.length; ++q) {
                    var ee = (W || N)[q], Q = R[q];
                    ee == null ? Q.onerror && Q.onerror(j[q]) : Q.onsuccess && Q.onsuccess(E.type === "put" && O[q] ? E.values[q] : ee);
                  }
                  return {
                    failures: j,
                    results: W,
                    numFailures: Y,
                    lastResult: U
                  };
                }).catch(function(U) {
                  return R.forEach(function(j) {
                    return j.onerror && j.onerror(U);
                  }), Promise.reject(U);
                });
              });
              throw new Error("Keys missing");
            }
          } });
        } });
      }
    };
    function xc(s, a, l) {
      try {
        if (!a || a.keys.length < s.length) return null;
        for (var d = [], m = 0, p = 0; m < a.keys.length && p < s.length; ++m) he(a.keys[m], s[p]) === 0 && (d.push(l ? ue(a.values[m]) : a.values[m]), ++p);
        return d.length === s.length ? d : null;
      } catch {
        return null;
      }
    }
    var Vp = {
      stack: "dbcore",
      level: -1,
      create: function(s) {
        return { table: function(a) {
          var l = s.table(a);
          return n(n({}, l), {
            getMany: function(d) {
              var m;
              return d.cache ? (m = xc(d.keys, d.trans._cache, d.cache === "clone")) ? J.resolve(m) : l.getMany(d).then(function(p) {
                return d.trans._cache = {
                  keys: d.keys,
                  values: d.cache === "clone" ? ue(p) : p
                }, p;
              }) : l.getMany(d);
            },
            mutate: function(d) {
              return d.type !== "add" && (d.trans._cache = null), l.mutate(d);
            }
          });
        } };
      }
    };
    function yc(s, a) {
      return s.trans.mode === "readonly" && !!s.subscr && !s.trans.explicit && s.trans.db._options.cache !== "disabled" && !a.schema.primaryKey.outbound;
    }
    function Sc(s, a) {
      switch (s) {
        case "query":
          return a.values && !a.unique;
        case "get":
        case "getMany":
        case "count":
        case "openCursor":
          return !1;
      }
    }
    var Yp = {
      stack: "dbcore",
      level: 0,
      name: "Observability",
      create: function(s) {
        var a = s.schema.name, l = new Ye(s.MIN_KEY, s.MAX_KEY);
        return n(n({}, s), {
          transaction: function(d, m, p) {
            if (ne.subscr && m !== "readonly") throw new re.ReadOnly("Readwrite transaction in liveQuery context. Querier source: ".concat(ne.querier));
            return s.transaction(d, m, p);
          },
          table: function(d) {
            function m(N) {
              var T, N = N.query;
              return [T = N.index, new Ye((T = (N = N.range).lower) != null ? T : s.MIN_KEY, (T = N.upper) != null ? T : s.MAX_KEY)];
            }
            var p = s.table(d), g = p.schema, b = g.primaryKey, I = g.indexes, D = b.extractKey, k = b.outbound, E = b.autoIncrement && I.filter(function(w) {
              return w.compound && w.keyPath.includes(b.keyPath);
            }), A = n(n({}, p), { mutate: function(w) {
              function T(te) {
                return te = "idb://".concat(a, "/").concat(d, "/").concat(te), j[te] || (j[te] = new Ye());
              }
              var N, O, R, U = w.trans, j = w.mutatedParts || (w.mutatedParts = {}), W = T(""), Y = T(":dels"), q = w.type, Q = w.type === "deleteRange" ? [w.range] : w.type === "delete" ? [w.keys] : w.values.length < 50 ? [ya(b, w).filter(function(te) {
                return te;
              }), w.values] : [], ee = Q[0], Q = Q[1], V = w.trans._cache;
              return u(ee) ? (W.addKeys(ee), (q = q === "delete" || ee.length === Q.length ? xc(ee, V) : null) || Y.addKeys(ee), (q || Q) && (N = T, O = q, R = Q, g.indexes.forEach(function(te) {
                var pe = N(te.name || "");
                function ge(ce) {
                  return ce != null ? te.extractKey(ce) : null;
                }
                function oe(ce) {
                  te.multiEntry && u(ce) ? ce.forEach(function(Ie) {
                    return pe.addKey(Ie);
                  }) : pe.addKey(ce);
                }
                (O || R).forEach(function(ce, $e) {
                  var at = O && ge(O[$e]), $e = R && ge(R[$e]);
                  he(at, $e) !== 0 && (at != null && oe(at), $e != null) && oe($e);
                });
              }))) : ee ? (Q = {
                from: (V = ee.lower) != null ? V : s.MIN_KEY,
                to: (q = ee.upper) != null ? q : s.MAX_KEY
              }, Y.add(Q), W.add(Q)) : (W.add(l), Y.add(l), g.indexes.forEach(function(te) {
                return T(te.name).add(l);
              })), p.mutate(w).then(function(te) {
                return !ee || w.type !== "add" && w.type !== "put" || (W.addKeys(te.results), E && E.forEach(function(pe) {
                  for (var ge = w.values.map(function(at) {
                    return pe.extractKey(at);
                  }), oe = pe.keyPath.findIndex(function(at) {
                    return at === b.keyPath;
                  }), ce = 0, Ie = te.results.length; ce < Ie; ++ce) ge[ce][oe] = te.results[ce];
                  T(pe.name).addKeys(ge);
                })), U.mutatedParts = Is(U.mutatedParts || {}, j), te;
              });
            } }), $ = {
              get: function(w) {
                return [b, new Ye(w.key)];
              },
              getMany: function(w) {
                return [b, new Ye().addKeys(w.keys)];
              },
              count: m,
              query: m,
              openCursor: m
            };
            return c($).forEach(function(w) {
              A[w] = function(T) {
                var N = ne.subscr, O = !!N, R = yc(ne, p) && Sc(w, T) ? T.obsSet = {} : N;
                if (O) {
                  var U, N = function(Q) {
                    return Q = "idb://".concat(a, "/").concat(d, "/").concat(Q), R[Q] || (R[Q] = new Ye());
                  }, j = N(""), W = N(":dels"), O = $[w](T), Y = O[0], O = O[1];
                  if ((w === "query" && Y.isPrimaryKey && !T.values ? W : N(Y.name || "")).add(O), !Y.isPrimaryKey) {
                    if (w !== "count") return U = w === "query" && k && T.values && p.query(n(n({}, T), { values: !1 })), p[w].apply(this, arguments).then(function(Q) {
                      if (w === "query") {
                        if (k && T.values) return U.then(function(ge) {
                          return ge = ge.result, j.addKeys(ge), Q;
                        });
                        var V = T.values ? Q.result.map(D) : Q.result;
                        (T.values ? j : W).addKeys(V);
                      } else {
                        var te, pe;
                        if (w === "openCursor") return pe = T.values, (te = Q) && Object.create(te, {
                          key: { get: function() {
                            return W.addKey(te.primaryKey), te.key;
                          } },
                          primaryKey: { get: function() {
                            var ge = te.primaryKey;
                            return W.addKey(ge), ge;
                          } },
                          value: { get: function() {
                            return pe && j.addKey(te.primaryKey), te.value;
                          } }
                        });
                      }
                      return Q;
                    });
                    W.add(l);
                  }
                }
                return p[w].apply(this, arguments);
              };
            }), A;
          }
        });
      }
    };
    function Ec(s, a, l) {
      var d;
      return l.numFailures === 0 ? a : a.type === "deleteRange" || (d = a.keys ? a.keys.length : "values" in a && a.values ? a.values.length : 1, l.numFailures === d) ? null : (d = n({}, a), u(d.keys) && (d.keys = d.keys.filter(function(m, p) {
        return !(p in l.failures);
      })), "values" in d && u(d.values) && (d.values = d.values.filter(function(m, p) {
        return !(p in l.failures);
      })), d);
    }
    function Sa(s, a) {
      return l = s, ((d = a).lower === void 0 || (d.lowerOpen ? 0 < he(l, d.lower) : 0 <= he(l, d.lower))) && (l = s, (d = a).upper === void 0 || (d.upperOpen ? he(l, d.upper) < 0 : he(l, d.upper) <= 0));
      var l, d;
    }
    function _c(s, a, l, d, m, p) {
      var g, b, I, D, k, E;
      return !l || l.length === 0 || (g = a.query.index, b = g.multiEntry, I = a.query.range, D = d.schema.primaryKey.extractKey, k = g.extractKey, E = (g.lowLevelIndex || g).extractKey, (d = l.reduce(function(A, $) {
        var w = A, T = [];
        if ($.type === "add" || $.type === "put") for (var N = new Ye(), O = $.values.length - 1; 0 <= O; --O) {
          var R, U = $.values[O], j = D(U);
          !N.hasKey(j) && (R = k(U), b && u(R) ? R.some(function(Q) {
            return Sa(Q, I);
          }) : Sa(R, I)) && (N.addKey(j), T.push(U));
        }
        switch ($.type) {
          case "add":
            var W = new Ye().addKeys(a.values ? A.map(function(V) {
              return D(V);
            }) : A), w = A.concat(a.values ? T.filter(function(V) {
              return V = D(V), !W.hasKey(V) && (W.addKey(V), !0);
            }) : T.map(function(V) {
              return D(V);
            }).filter(function(V) {
              return !W.hasKey(V) && (W.addKey(V), !0);
            }));
            break;
          case "put":
            var Y = new Ye().addKeys($.values.map(function(V) {
              return D(V);
            }));
            w = A.filter(function(V) {
              return !Y.hasKey(a.values ? D(V) : V);
            }).concat(a.values ? T : T.map(function(V) {
              return D(V);
            }));
            break;
          case "delete":
            var q = new Ye().addKeys($.keys);
            w = A.filter(function(V) {
              return !q.hasKey(a.values ? D(V) : V);
            });
            break;
          case "deleteRange":
            var ee = $.range;
            w = A.filter(function(V) {
              return !Sa(D(V), ee);
            });
        }
        return w;
      }, s)) === s) ? s : (d.sort(function(A, $) {
        return he(E(A), E($)) || he(D(A), D($));
      }), a.limit && a.limit < 1 / 0 && (d.length > a.limit ? d.length = a.limit : s.length === a.limit && d.length < a.limit && (m.dirty = !0)), p ? Object.freeze(d) : d);
    }
    function Tc(s, a) {
      return he(s.lower, a.lower) === 0 && he(s.upper, a.upper) === 0 && !!s.lowerOpen == !!a.lowerOpen && !!s.upperOpen == !!a.upperOpen;
    }
    function Wp(s, a) {
      return ((l, d, m, p) => {
        if (l === void 0) return d !== void 0 ? -1 : 0;
        if (d === void 0) return 1;
        if ((l = he(l, d)) === 0) {
          if (m && p) return 0;
          if (m) return 1;
          if (p) return -1;
        }
        return l;
      })(s.lower, a.lower, s.lowerOpen, a.lowerOpen) <= 0 && 0 <= ((l, d, m, p) => {
        if (l === void 0) return d !== void 0 ? 1 : 0;
        if (d === void 0) return -1;
        if ((l = he(l, d)) === 0) {
          if (m && p) return 0;
          if (m) return -1;
          if (p) return 1;
        }
        return l;
      })(s.upper, a.upper, s.upperOpen, a.upperOpen);
    }
    function Xp(s, a, l, d) {
      s.subscribers.add(l), d.addEventListener("abort", function() {
        var m, p;
        s.subscribers.delete(l), s.subscribers.size === 0 && (m = s, p = a, setTimeout(function() {
          m.subscribers.size === 0 && Pe(p, m);
        }, 3e3));
      });
    }
    var Jp = {
      stack: "dbcore",
      level: 0,
      name: "Cache",
      create: function(s) {
        var a = s.schema.name;
        return n(n({}, s), {
          transaction: function(l, d, m) {
            var p, g, b = s.transaction(l, d, m);
            return d === "readwrite" && (m = (p = new AbortController()).signal, b.addEventListener("abort", (g = function(I) {
              return function() {
                if (p.abort(), d === "readwrite") {
                  for (var D = /* @__PURE__ */ new Set(), k = 0, E = l; k < E.length; k++) {
                    var A = E[k], $ = lr["idb://".concat(a, "/").concat(A)];
                    if ($) {
                      var w = s.table(A), T = $.optimisticOps.filter(function(te) {
                        return te.trans === b;
                      });
                      if (b._explicit && I && b.mutatedParts) for (var N = 0, O = Object.values($.queries.query); N < O.length; N++) for (var R = 0, U = (Y = O[N]).slice(); R < U.length; R++) pa((q = U[R]).obsSet, b.mutatedParts) && (Pe(Y, q), q.subscribers.forEach(function(te) {
                        return D.add(te);
                      }));
                      else if (0 < T.length) {
                        $.optimisticOps = $.optimisticOps.filter(function(te) {
                          return te.trans !== b;
                        });
                        for (var j = 0, W = Object.values($.queries.query); j < W.length; j++) for (var Y, q, ee, Q = 0, V = (Y = W[j]).slice(); Q < V.length; Q++) (q = V[Q]).res != null && b.mutatedParts && (I && !q.dirty ? (ee = Object.isFrozen(q.res), ee = _c(q.res, q.req, T, w, q, ee), q.dirty ? (Pe(Y, q), q.subscribers.forEach(function(te) {
                          return D.add(te);
                        })) : ee !== q.res && (q.res = ee, q.promise = J.resolve({ result: ee }))) : (q.dirty && Pe(Y, q), q.subscribers.forEach(function(te) {
                          return D.add(te);
                        })));
                      }
                    }
                  }
                  D.forEach(function(te) {
                    return te();
                  });
                }
              };
            })(!1), { signal: m }), b.addEventListener("error", g(!1), { signal: m }), b.addEventListener("complete", g(!0), { signal: m })), b;
          },
          table: function(l) {
            var d = s.table(l), m = d.schema.primaryKey;
            return n(n({}, d), {
              mutate: function(p) {
                var g, b = ne.trans;
                return !m.outbound && b.db._options.cache !== "disabled" && !b.explicit && b.idbtrans.mode === "readwrite" && (g = lr["idb://".concat(a, "/").concat(l)]) ? (b = d.mutate(p), p.type !== "add" && p.type !== "put" || !(50 <= p.values.length || ya(m, p).some(function(I) {
                  return I == null;
                })) ? (g.optimisticOps.push(p), p.mutatedParts && As(p.mutatedParts), b.then(function(I) {
                  0 < I.numFailures && (Pe(g.optimisticOps, p), (I = Ec(0, p, I)) && g.optimisticOps.push(I), p.mutatedParts) && As(p.mutatedParts);
                }), b.catch(function() {
                  Pe(g.optimisticOps, p), p.mutatedParts && As(p.mutatedParts);
                })) : b.then(function(I) {
                  var D = Ec(0, n(n({}, p), { values: p.values.map(function(k, E) {
                    var A;
                    return I.failures[E] ? k : (H(A = (A = m.keyPath) != null && A.includes(".") ? ue(k) : n({}, k), m.keyPath, I.results[E]), A);
                  }) }), I);
                  g.optimisticOps.push(D), queueMicrotask(function() {
                    return p.mutatedParts && As(p.mutatedParts);
                  });
                }), b) : d.mutate(p);
              },
              query: function(p) {
                var g, b, I, D, k, E, A;
                return yc(ne, d) && Sc("query", p) ? (g = ((I = ne.trans) == null ? void 0 : I.db._options.cache) === "immutable", b = (I = ne).requery, I = I.signal, E = (($, w, T, N) => {
                  var O = lr["idb://".concat($, "/").concat(w)];
                  if (!O) return [];
                  if (!($ = O.queries[T])) return [
                    null,
                    !1,
                    O,
                    null
                  ];
                  var R = $[(N.query ? N.query.index.name : null) || ""];
                  if (!R) return [
                    null,
                    !1,
                    O,
                    null
                  ];
                  switch (T) {
                    case "query":
                      var U = R.find(function(j) {
                        return j.req.limit === N.limit && j.req.values === N.values && Tc(j.req.query.range, N.query.range);
                      });
                      return U ? [
                        U,
                        !0,
                        O,
                        R
                      ] : [
                        R.find(function(j) {
                          return ("limit" in j.req ? j.req.limit : 1 / 0) >= N.limit && (!N.values || j.req.values) && Wp(j.req.query.range, N.query.range);
                        }),
                        !1,
                        O,
                        R
                      ];
                    case "count":
                      return U = R.find(function(j) {
                        return Tc(j.req.query.range, N.query.range);
                      }), [
                        U,
                        !!U,
                        O,
                        R
                      ];
                  }
                })(a, l, "query", p), A = E[0], D = E[2], k = E[3], A && E[1] ? A.obsSet = p.obsSet : (E = d.query(p).then(function($) {
                  var w = $.result;
                  if (A && (A.res = w), g) {
                    for (var T = 0, N = w.length; T < N; ++T) Object.freeze(w[T]);
                    Object.freeze(w);
                  } else $.result = ue(w);
                  return $;
                }).catch(function($) {
                  return k && A && Pe(k, A), Promise.reject($);
                }), A = {
                  obsSet: p.obsSet,
                  promise: E,
                  subscribers: /* @__PURE__ */ new Set(),
                  type: "query",
                  req: p,
                  dirty: !1
                }, k ? k.push(A) : (k = [A], (D = D || (lr["idb://".concat(a, "/").concat(l)] = {
                  queries: {
                    query: {},
                    count: {}
                  },
                  objs: /* @__PURE__ */ new Map(),
                  optimisticOps: [],
                  unsignaledParts: {}
                })).queries.query[p.query.index.name || ""] = k)), Xp(A, k, b, I), A.promise.then(function($) {
                  return { result: _c($.result, p, D?.optimisticOps, d, A, g) };
                })) : d.query(p);
              }
            });
          }
        });
      }
    };
    function Rs(s, a) {
      return new Proxy(s, { get: function(l, d, m) {
        return d === "db" ? a : Reflect.get(l, d, m);
      } });
    }
    Ne.prototype.version = function(s) {
      if (isNaN(s) || s < 0.1) throw new re.Type("Given version is not a positive number");
      if (s = Math.round(10 * s) / 10, this.idbdb || this._state.isBeingOpened) throw new re.Schema("Cannot add version when database is open");
      this.verno = Math.max(this.verno, s);
      var a = this._versions, l = a.filter(function(d) {
        return d._cfg.version === s;
      })[0];
      return l || (l = new this.Version(s), a.push(l), a.sort(Kp), l.stores({}), this._state.autoSchema = !1), l;
    }, Ne.prototype._whenReady = function(s) {
      var a = this;
      return this.idbdb && (this._state.openComplete || ne.letThrough || this._vip) ? s() : new J(function(l, d) {
        if (a._state.openComplete) return d(new re.DatabaseClosed(a._state.dbOpenError));
        if (!a._state.isBeingOpened) {
          if (!a._state.autoOpen) return void d(new re.DatabaseClosed());
          a.open().catch(ye);
        }
        a._state.dbReadyPromise.then(l, d);
      }).then(s);
    }, Ne.prototype.use = function(m) {
      var a = m.stack, l = m.create, d = m.level, m = m.name, p = (m && this.unuse({
        stack: a,
        name: m
      }), this._middlewares[a] || (this._middlewares[a] = []));
      return p.push({
        stack: a,
        create: l,
        level: d ?? 10,
        name: m
      }), p.sort(function(g, b) {
        return g.level - b.level;
      }), this;
    }, Ne.prototype.unuse = function(s) {
      var a = s.stack, l = s.name, d = s.create;
      return a && this._middlewares[a] && (this._middlewares[a] = this._middlewares[a].filter(function(m) {
        return d ? m.create !== d : !!l && m.name !== l;
      })), this;
    }, Ne.prototype.open = function() {
      var s = this;
      return or(Dt, function() {
        return jp(s);
      });
    }, Ne.prototype._close = function() {
      this.on.close.fire(new CustomEvent("close"));
      var s = this._state, a = Br.indexOf(this);
      if (0 <= a && Br.splice(a, 1), this.idbdb) {
        try {
          this.idbdb.close();
        } catch {
        }
        this.idbdb = null;
      }
      s.isBeingOpened || (s.dbReadyPromise = new J(function(l) {
        s.dbReadyResolve = l;
      }), s.openCanceller = new J(function(l, d) {
        s.cancelOpen = d;
      }));
    }, Ne.prototype.close = function(a) {
      var a = (a === void 0 ? { disableAutoOpen: !0 } : a).disableAutoOpen, l = this._state;
      a ? (l.isBeingOpened && l.cancelOpen(new re.DatabaseClosed()), this._close(), l.autoOpen = !1, l.dbOpenError = new re.DatabaseClosed()) : (this._close(), l.autoOpen = this._options.autoOpen || l.isBeingOpened, l.openComplete = !1, l.dbOpenError = null);
    }, Ne.prototype.delete = function(s) {
      var a = this, l = (s === void 0 && (s = { disableAutoOpen: !0 }), 0 < arguments.length && typeof arguments[0] != "object"), d = this._state;
      return new J(function(m, p) {
        function g() {
          a.close(s);
          var b = a._deps.indexedDB.deleteDatabase(a.name);
          b.onsuccess = ke(function() {
            var I = a._deps, D = a.name, k;
            ua(k = I.indexedDB) || D === fs || da(k, I.IDBKeyRange).delete(D).catch(ye), m();
          }), b.onerror = pt(p), b.onblocked = a._fireOnBlocked;
        }
        if (l) throw new re.InvalidArgument("Invalid closeOptions argument to db.delete()");
        d.isBeingOpened ? d.dbReadyPromise.then(g) : g();
      });
    }, Ne.prototype.backendDB = function() {
      return this.idbdb;
    }, Ne.prototype.isOpen = function() {
      return this.idbdb !== null;
    }, Ne.prototype.hasBeenClosed = function() {
      var s = this._state.dbOpenError;
      return s && s.name === "DatabaseClosed";
    }, Ne.prototype.hasFailed = function() {
      return this._state.dbOpenError !== null;
    }, Ne.prototype.dynamicallyOpened = function() {
      return this._state.autoSchema;
    }, Object.defineProperty(Ne.prototype, "tables", {
      get: function() {
        var s = this;
        return c(this._allTables).map(function(a) {
          return s._allTables[a];
        });
      },
      enumerable: !1,
      configurable: !0
    }), Ne.prototype.transaction = function() {
      var s = function(a, l, d) {
        var m = arguments.length;
        if (m < 2) throw new re.InvalidArgument("Too few arguments");
        for (var p = new Array(m - 1); --m; ) p[m - 1] = arguments[m];
        return d = p.pop(), [
          a,
          z(p),
          d
        ];
      }.apply(this, arguments);
      return this._transaction.apply(this, s);
    }, Ne.prototype._transaction = function(s, a, l) {
      var d, m, p = this, g = ne.trans, b = (g && g.db === this && s.indexOf("!") === -1 || (g = null), s.indexOf("?") !== -1);
      s = s.replace("!", "").replace("?", "");
      try {
        if (m = a.map(function(D) {
          if (D = D instanceof p.Table ? D.name : D, typeof D != "string") throw new TypeError("Invalid table argument to Dexie.transaction(). Only Table or String are allowed");
          return D;
        }), s == "r" || s === Zo) d = Zo;
        else {
          if (s != "rw" && s != ea) throw new re.InvalidArgument("Invalid transaction mode: " + s);
          d = ea;
        }
        if (g) {
          if (g.mode === Zo && d === ea) {
            if (!b) throw new re.SubTransaction("Cannot enter a sub-transaction with READWRITE mode when parent transaction is READONLY");
            g = null;
          }
          g && m.forEach(function(D) {
            if (g && g.storeNames.indexOf(D) === -1) {
              if (!b) throw new re.SubTransaction("Table " + D + " not included in parent transaction.");
              g = null;
            }
          }), b && g && !g.active && (g = null);
        }
      } catch (D) {
        return g ? g._promise(null, function(k, E) {
          E(D);
        }) : De(D);
      }
      var I = function D(k, E, A, $, w) {
        return J.resolve().then(function() {
          var R = ne.transless || ne, T = k._createTransaction(E, A, k._dbSchema, $), R = (T.explicit = !0, {
            trans: T,
            transless: R
          });
          if ($) T.idbtrans = $.idbtrans;
          else try {
            T.create(), T.idbtrans._explicit = !0, k._state.PR1398_maxLoop = 3;
          } catch (U) {
            return U.name === mt.InvalidState && k.isOpen() && 0 < --k._state.PR1398_maxLoop ? (console.warn("Dexie: Need to reopen db"), k.close({ disableAutoOpen: !1 }), k.open().then(function() {
              return D(k, E, A, null, w);
            })) : De(U);
          }
          var N, O = Ve(w), R = (O && Pr(), J.follow(function() {
            var U;
            (N = w.call(T, T)) && (O ? (U = Lt.bind(null, null), N.then(U, U)) : typeof N.next == "function" && typeof N.throw == "function" && (N = ba(N)));
          }, R));
          return (N && typeof N.then == "function" ? J.resolve(N).then(function(U) {
            return T.active ? U : De(new re.PrematureCommit("Transaction committed too early. See http://bit.ly/2kdckMn"));
          }) : R.then(function() {
            return N;
          })).then(function(U) {
            return $ && T._resolve(), T._completion.then(function() {
              return U;
            });
          }).catch(function(U) {
            return T._reject(U), De(U);
          });
        });
      }.bind(null, this, d, m, g, l);
      return g ? g._promise(d, I, "lock") : ne.trans ? or(ne.transless, function() {
        return p._whenReady(I);
      }) : this._whenReady(I);
    }, Ne.prototype.table = function(s) {
      if (x(this._allTables, s)) return this._allTables[s];
      throw new re.InvalidTable("Table ".concat(s, " does not exist"));
    };
    var Et = Ne;
    function Ne(s, a) {
      var l, d, m, p, g, b = this, I = (this._middlewares = {}, this.verno = 0, Ne.dependencies), I = (this._options = a = n({
        addons: Ne.addons,
        autoOpen: !0,
        indexedDB: I.indexedDB,
        IDBKeyRange: I.IDBKeyRange,
        cache: "cloned"
      }, a), this._deps = {
        indexedDB: a.indexedDB,
        IDBKeyRange: a.IDBKeyRange
      }, a.addons), D = (this._dbSchema = {}, this._versions = [], this._storeNames = [], this._allTables = {}, this.idbdb = null, this._novip = this, {
        dbOpenError: null,
        isBeingOpened: !1,
        onReadyBeingFired: null,
        openComplete: !1,
        dbReadyResolve: ye,
        dbReadyPromise: null,
        cancelOpen: ye,
        openCanceller: null,
        autoSchema: !0,
        PR1398_maxLoop: 3,
        autoOpen: a.autoOpen
      }), k = (D.dbReadyPromise = new J(function(E) {
        D.dbReadyResolve = E;
      }), D.openCanceller = new J(function(E, A) {
        D.cancelOpen = A;
      }), this._state = D, this.name = s, this.on = yn(this, "populate", "blocked", "versionchange", "close", { ready: [jo, ye] }), this.once = function(E, A) {
        var $ = function() {
          for (var w = [], T = 0; T < arguments.length; T++) w[T] = arguments[T];
          b.on(E).unsubscribe($), A.apply(b, w);
        };
        return b.on(E, $);
      }, this.on.ready.subscribe = C(this.on.ready.subscribe, function(E) {
        return function(A, $) {
          Ne.vip(function() {
            var w, T = b._state;
            T.openComplete ? (T.dbOpenError || J.resolve().then(A), $ && E(A)) : T.onReadyBeingFired ? (T.onReadyBeingFired.push(A), $ && E(A)) : (E(A), w = b, $ || E(function N() {
              w.on.ready.unsubscribe(A), w.on.ready.unsubscribe(N);
            }));
          });
        };
      }), this.Collection = (l = this, Sn(Np.prototype, function(N, T) {
        this.db = l;
        var $ = Zl, w = null;
        if (T) try {
          $ = T();
        } catch (R) {
          w = R;
        }
        var T = N._ctx, N = T.table, O = N.hook.reading.fire;
        this._ctx = {
          table: N,
          index: T.index,
          isPrimKey: !T.index || N.schema.primKey.keyPath && T.index === N.schema.primKey.name,
          range: $,
          keysOnly: !1,
          dir: "next",
          unique: "",
          algorithm: null,
          filter: null,
          replayFilter: null,
          justLimit: !0,
          isMatch: null,
          offset: 0,
          limit: 1 / 0,
          error: w,
          or: T.or,
          valueMapper: O !== pn ? O : null
        };
      })), this.Table = (d = this, Sn(oc.prototype, function(E, A, $) {
        this.db = d, this._tx = $, this.name = E, this.schema = A, this.hook = d._allTables[E] ? d._allTables[E].hook : yn(null, {
          creating: [Tp, ye],
          reading: [_p, pn],
          updating: [wp, ye],
          deleting: [kp, ye]
        });
      })), this.Transaction = (m = this, Sn(Op.prototype, function(E, A, $, w, T) {
        var N = this;
        E !== "readonly" && A.forEach(function(O) {
          O = (O = $[O]) == null ? void 0 : O.yProps, O && (A = A.concat(O.map(function(R) {
            return R.updatesTable;
          })));
        }), this.db = m, this.mode = E, this.storeNames = A, this.schema = $, this.chromeTransactionDurability = w, this.idbtrans = null, this.on = yn(this, "complete", "error", "abort"), this.parent = T || null, this.active = !0, this._reculock = 0, this._blockedFuncs = [], this._resolve = null, this._reject = null, this._waitingFor = null, this._waitingQueue = null, this._spinCount = 0, this._completion = new J(function(O, R) {
          N._resolve = O, N._reject = R;
        }), this._completion.then(function() {
          N.active = !1, N.on.complete.fire();
        }, function(O) {
          var R = N.active;
          return N.active = !1, N.on.error.fire(O), N.parent ? N.parent._reject(O) : R && N.idbtrans && N.idbtrans.abort(), De(O);
        });
      })), this.Version = (p = this, Sn(zp.prototype, function(E) {
        this.db = p, this._cfg = {
          version: E,
          storesSource: null,
          dbschema: {},
          tables: {},
          contentUpgrade: null
        };
      })), this.WhereClause = (g = this, Sn(dc.prototype, function(E, A, $) {
        if (this.db = g, this._ctx = {
          table: E,
          index: A === ":id" ? null : A,
          or: $
        }, this._cmp = this._ascending = he, this._descending = function(w, T) {
          return he(T, w);
        }, this._max = function(w, T) {
          return 0 < he(w, T) ? w : T;
        }, this._min = function(w, T) {
          return he(w, T) < 0 ? w : T;
        }, this._IDBKeyRange = g._deps.IDBKeyRange, !this._IDBKeyRange) throw new re.MissingAPI();
      })), this.on("versionchange", function(E) {
        0 < E.newVersion ? console.warn("Another connection wants to upgrade database '".concat(b.name, "'. Closing db now to resume the upgrade.")) : console.warn("Another connection wants to delete database '".concat(b.name, "'. Closing db now to resume the delete request.")), b.close({ disableAutoOpen: !1 });
      }), this.on("blocked", function(E) {
        !E.newVersion || E.newVersion < E.oldVersion ? console.warn("Dexie.delete('".concat(b.name, "') was blocked")) : console.warn("Upgrade '".concat(b.name, "' blocked by other connection holding version ").concat(E.oldVersion / 10));
      }), this._maxKey = Tn(a.IDBKeyRange), this._createTransaction = function(E, A, $, w) {
        return new b.Transaction(E, A, $, b._options.chromeTransactionDurability, w);
      }, this._fireOnBlocked = function(E) {
        b.on("blocked").fire(E), Br.filter(function(A) {
          return A.name === b.name && A !== b && !A._state.vcFired;
        }).map(function(A) {
          return A.on("versionchange").fire(E);
        });
      }, this.use(Vp), this.use(Jp), this.use(Yp), this.use(qp), this.use(Fp), new Proxy(this, { get: function(E, A, $) {
        var w;
        return A === "_vip" || (A === "table" ? function(T) {
          return Rs(b.table(T), k);
        } : (w = Reflect.get(E, A, $)) instanceof oc ? Rs(w, k) : A === "tables" ? w.map(function(T) {
          return Rs(T, k);
        }) : A === "_createTransaction" ? function() {
          return Rs(w.apply(this, arguments), k);
        } : w);
      } }));
      this.vip = k, I.forEach(function(E) {
        return E(b);
      });
    }
    var Cs, Gr = typeof Symbol < "u" && "observable" in Symbol ? Symbol.observable : "@@observable", Qp = (Ea.prototype.subscribe = function(s, a, l) {
      return this._subscribe(s && typeof s != "function" ? s : {
        next: s,
        error: a,
        complete: l
      });
    }, Ea.prototype[Gr] = function() {
      return this;
    }, Ea);
    function Ea(s) {
      this._subscribe = s;
    }
    try {
      Cs = {
        indexedDB: i.indexedDB || i.mozIndexedDB || i.webkitIndexedDB || i.msIndexedDB,
        IDBKeyRange: i.IDBKeyRange || i.webkitIDBKeyRange
      };
    } catch {
      Cs = {
        indexedDB: null,
        IDBKeyRange: null
      };
    }
    function kc(s) {
      var a, l = !1, d = new Qp(function(m) {
        var p = Ve(s), g, b = !1, I = {}, D = {}, k = {
          get closed() {
            return b;
          },
          unsubscribe: function() {
            b || (b = !0, g && g.abort(), E && Pt.storagemutated.unsubscribe($));
          }
        }, E = (m.start && m.start(k), !1), A = function() {
          return Qo(w);
        }, $ = function(T) {
          Is(I, T), pa(D, I) && A();
        }, w = function() {
          var T, N, O;
          !b && Cs.indexedDB && (I = {}, T = {}, g && g.abort(), g = new AbortController(), O = ((R) => {
            var U = Mr();
            try {
              p && Pr();
              var j = Nt(s, R);
              return j = p ? j.finally(Lt) : j;
            } finally {
              U && Or();
            }
          })(N = {
            subscr: T,
            signal: g.signal,
            requery: A,
            querier: s,
            trans: null
          }), Promise.resolve(O).then(function(R) {
            l = !0, a = R, b || N.signal.aborted || (I = {}, ((U) => {
              for (var j in U) if (x(U, j)) return;
              return 1;
            })(D = T) || E || (Pt(_n, $), E = !0), Qo(function() {
              return !b && m.next && m.next(R);
            }));
          }, function(R) {
            l = !1, ["DatabaseClosedError", "AbortError"].includes(R?.name) || b || Qo(function() {
              b || m.error && m.error(R);
            });
          }));
        };
        return setTimeout(A, 0), k;
      });
      return d.hasValue = function() {
        return l;
      }, d.getValue = function() {
        return a;
      }, d;
    }
    var cr = Et;
    function _a(s) {
      var a = Bt;
      try {
        Bt = !0, Pt.storagemutated.fire(s), va(s, !0);
      } finally {
        Bt = a;
      }
    }
    y(cr, n(n({}, Me), {
      delete: function(s) {
        return new cr(s, { addons: [] }).delete();
      },
      exists: function(s) {
        return new cr(s, { addons: [] }).open().then(function(a) {
          return a.close(), !0;
        }).catch("NoSuchDatabaseError", function() {
          return !1;
        });
      },
      getDatabaseNames: function(s) {
        try {
          return a = cr.dependencies, l = a.indexedDB, a = a.IDBKeyRange, (ua(l) ? Promise.resolve(l.databases()).then(function(d) {
            return d.map(function(m) {
              return m.name;
            }).filter(function(m) {
              return m !== fs;
            });
          }) : da(l, a).toCollection().primaryKeys()).then(s);
        } catch {
          return De(new re.MissingAPI());
        }
        var a, l;
      },
      defineClass: function() {
        return function(s) {
          h(this, s);
        };
      },
      ignoreTransaction: function(s) {
        return ne.trans ? or(ne.transless, s) : s();
      },
      vip: ma,
      async: function(s) {
        return function() {
          try {
            var a = ba(s.apply(this, arguments));
            return a && typeof a.then == "function" ? a : J.resolve(a);
          } catch (l) {
            return De(l);
          }
        };
      },
      spawn: function(s, a, l) {
        try {
          var d = ba(s.apply(l, a || []));
          return d && typeof d.then == "function" ? d : J.resolve(d);
        } catch (m) {
          return De(m);
        }
      },
      currentTransaction: { get: function() {
        return ne.trans || null;
      } },
      waitFor: function(s, a) {
        return s = J.resolve(typeof s == "function" ? cr.ignoreTransaction(s) : s).timeout(a || 6e4), ne.trans ? ne.trans.waitFor(s) : s;
      },
      Promise: J,
      debug: {
        get: function() {
          return ht;
        },
        set: function(s) {
          Fl(s);
        }
      },
      derive: P,
      extend: h,
      props: y,
      override: C,
      Events: yn,
      on: Pt,
      liveQuery: kc,
      extendObservabilitySet: Is,
      getByKeyPath: Z,
      setByKeyPath: H,
      delByKeyPath: function(s, a) {
        typeof a == "string" ? H(s, a, void 0) : "length" in a && [].map.call(a, function(l) {
          H(s, l, void 0);
        });
      },
      shallowClone: X,
      deepClone: ue,
      getObjectDiff: xa,
      cmp: he,
      asap: F,
      minKey: -1 / 0,
      addons: [],
      connections: Br,
      errnames: mt,
      dependencies: Cs,
      cache: lr,
      semVer: "4.3.0",
      version: "4.3.0".split(".").map(function(s) {
        return parseInt(s);
      }).reduce(function(s, a, l) {
        return s + a / Math.pow(10, 2 * l);
      })
    })), cr.maxKey = Tn(cr.dependencies.IDBKeyRange), typeof dispatchEvent < "u" && typeof addEventListener < "u" && (Pt(_n, function(s) {
      Bt || (s = new CustomEvent(na, { detail: s }), Bt = !0, dispatchEvent(s), Bt = !1);
    }), addEventListener(na, function(s) {
      s = s.detail, Bt || _a(s);
    }));
    var An, Bt = !1, wc = function() {
    };
    return typeof BroadcastChannel < "u" && ((wc = function() {
      (An = new BroadcastChannel(na)).onmessage = function(s) {
        return s.data && _a(s.data);
      };
    })(), typeof An.unref == "function" && An.unref(), Pt(_n, function(s) {
      Bt || An.postMessage(s);
    })), typeof addEventListener < "u" && (addEventListener("pagehide", function(s) {
      if (!Et.disableBfCache && s.persisted) {
        ht && console.debug("Dexie: handling persisted pagehide"), An?.close();
        for (var a = 0, l = Br; a < l.length; a++) l[a].close({ disableAutoOpen: !1 });
      }
    }), addEventListener("pageshow", function(s) {
      !Et.disableBfCache && s.persisted && (ht && console.debug("Dexie: handling persisted pageshow"), wc(), _a({ all: new Ye(-1 / 0, [[]]) }));
    })), J.rejectionMapper = function(s, a) {
      return !s || s instanceof Ct || s instanceof TypeError || s instanceof SyntaxError || !s.name || !ql[s.name] ? s : (a = new ql[s.name](a || s.message, s), "stack" in s && _(a, "stack", { get: function() {
        return this.inner.stack;
      } }), a);
    }, Fl(ht), n(Et, Object.freeze({
      __proto__: null,
      Dexie: Et,
      Entity: ec,
      PropModification: xn,
      RangeSet: Ye,
      add: function(s) {
        return new xn({ add: s });
      },
      cmp: he,
      default: Et,
      liveQuery: kc,
      mergeRanges: In,
      rangesOverlap: fc,
      remove: function(s) {
        return new xn({ remove: s });
      },
      replacePrefix: function(s, a) {
        return new xn({ replacePrefix: [s, a] });
      }
    }), { default: Et }), Et;
  });
}), ri = /* @__PURE__ */ af(lb(), 1), qc = Symbol.for("Dexie"), Zs = globalThis[qc] || (globalThis[qc] = ri.default);
if (ri.default.semVer !== Zs.semVer) throw new Error(`Two different versions of Dexie loaded in the same app: ${ri.default.semVer} and ${Zs.semVer}`);
var { liveQuery: a_, mergeRanges: i_, rangesOverlap: l_, RangeSet: c_, cmp: d_, Entity: u_, PropModification: m_, replacePrefix: h_, add: p_, remove: f_, DexieYProvider: g_ } = Zs, cb = class extends Zs {
  chat_documents;
  chat_plugin_state;
  chat_plugin_records;
  events;
  facts;
  world_state;
  summaries;
  templates;
  audit;
  meta;
  worldinfo_cache;
  template_bindings;
  vector_chunks;
  vector_embeddings;
  vector_meta;
  relationship_memory;
  memory_candidate_buffer;
  memory_recall_log;
  llm_credentials;
  constructor() {
    super("ss-helper-db"), this.version(1).stores({
      chat_documents: "&chatKey, entityKey, updatedAt",
      chat_plugin_state: "[pluginId+chatKey], pluginId, chatKey, updatedAt",
      chat_plugin_records: "++id, [pluginId+chatKey+collection], [pluginId+chatKey+collection+ts], pluginId, chatKey, collection, recordId, ts",
      events: "&eventId, [chatKey+ts], [chatKey+type+ts], [chatKey+source.pluginId+ts]",
      facts: "&factKey, [chatKey+type], [chatKey+entity.kind+entity.id], [chatKey+path], [chatKey+updatedAt]",
      world_state: "&stateKey, [chatKey+path]",
      summaries: "&summaryId, [chatKey+level+createdAt]",
      templates: "&templateId, [chatKey+createdAt], [chatKey+worldType], [chatKey+worldInfoHash]",
      audit: "&auditId, chatKey, ts, action",
      meta: "&chatKey",
      worldinfo_cache: "&cacheKey, chatKey, [chatKey+bookName]",
      template_bindings: "&bindingKey, chatKey",
      vector_chunks: "&chunkId, chatKey, [chatKey+bookId]",
      vector_embeddings: "&embeddingId, chunkId, chatKey",
      vector_meta: "&metaKey, chatKey, [chatKey+bookId]",
      llm_credentials: "&providerId, updatedAt"
    }), this.version(2).stores({
      chat_documents: "&chatKey, entityKey, updatedAt",
      chat_plugin_state: "[pluginId+chatKey], pluginId, chatKey, updatedAt",
      chat_plugin_records: "++id, [pluginId+chatKey+collection], [pluginId+chatKey+collection+ts], pluginId, chatKey, collection, recordId, ts",
      events: "&eventId, [chatKey+ts], [chatKey+type+ts], [chatKey+source.pluginId+ts]",
      facts: "&factKey, [chatKey+type], [chatKey+entity.kind+entity.id], [chatKey+path], [chatKey+updatedAt]",
      world_state: "&stateKey, [chatKey+path]",
      summaries: "&summaryId, [chatKey+level+createdAt]",
      templates: "&templateId, [chatKey+createdAt], [chatKey+worldType], [chatKey+worldInfoHash]",
      audit: "&auditId, chatKey, ts, action",
      meta: "&chatKey",
      worldinfo_cache: "&cacheKey, chatKey, [chatKey+bookName]",
      template_bindings: "&bindingKey, chatKey",
      vector_chunks: "&chunkId, chatKey, [chatKey+bookId]",
      vector_embeddings: "&embeddingId, chunkId, chatKey",
      vector_meta: "&metaKey, chatKey, [chatKey+bookId]",
      relationship_memory: "&relationshipKey, [chatKey+updatedAt], [chatKey+actorKey+targetKey], chatKey, actorKey, targetKey, updatedAt",
      memory_candidate_buffer: "&candidateId, [chatKey+ts], [chatKey+kind+ts], chatKey, kind, ts",
      memory_recall_log: "&recallId, [chatKey+ts], [chatKey+section+ts], [chatKey+selected+ts], chatKey, section, recordKey, ts",
      llm_credentials: "&providerId, updatedAt"
    });
  }
}, ut = new cb(), db = new Xn("SDK-ChatData"), ub = "stx_sdk", mb = 180, eo = /* @__PURE__ */ new Map(), to = /* @__PURE__ */ new Map(), ro = /* @__PURE__ */ new Map(), ni = /* @__PURE__ */ new Map(), si = null;
function yl(e, t) {
  return `${e}::${t}`;
}
function $m() {
  si === null && (si = setTimeout(hb, mb));
}
async function hb() {
  si = null;
  const e = Array.from(ni.values()), t = Array.from(ro.values());
  if (ni.clear(), ro.clear(), !(e.length === 0 && t.length === 0))
    try {
      await ut.transaction("rw", [ut.chat_documents, ut.chat_plugin_state], async () => {
        for (const r of e) await ut.chat_documents.put(r);
        for (const r of t) await ut.chat_plugin_state.put(r);
      });
    } catch (r) {
      db.error("flushPending 写入失败:", r);
    }
}
function Zn(e, t, r) {
  try {
    Fd("sdk:chat_data:changed", {
      table: e,
      pluginId: t,
      chatKey: r
    }, ub);
  } catch {
  }
}
function Rm() {
  return {
    labels: [],
    flags: {},
    notes: "",
    signals: {}
  };
}
function pb(e) {
  if (!e || typeof e != "object" || Array.isArray(e)) return Rm();
  const t = e;
  return {
    labels: Array.isArray(t.labels) ? t.labels.filter((r) => typeof r == "string") : [],
    flags: t.flags && typeof t.flags == "object" && !Array.isArray(t.flags) ? t.flags : {},
    notes: typeof t.notes == "string" ? t.notes : "",
    signals: t.signals && typeof t.signals == "object" && !Array.isArray(t.signals) ? t.signals : {}
  };
}
async function Cm(e) {
  const t = eo.get(e);
  if (t) return t;
  const r = await ut.chat_documents.get(e);
  return r && (r.shared = pb(r.shared), eo.set(e, r)), r ?? null;
}
async function fb(e, t, r) {
  const n = await Cm(e);
  if (n) return n;
  const o = {
    chatKey: e,
    entityKey: `${t.tavernInstanceId}::${t.scopeType}::${t.scopeId}`,
    ref: t,
    meta: r ?? {},
    shared: Rm(),
    updatedAt: Date.now()
  };
  return await ut.chat_documents.put(o), eo.set(e, o), Zn("chat_documents", "", e), o;
}
async function gb(e, t) {
  const r = await Cm(e);
  if (!r) return;
  const n = { ...r.shared };
  if (t.labels !== void 0 && (n.labels = t.labels), t.flags !== void 0 && (n.flags = {
    ...n.flags,
    ...t.flags
  }), t.notes !== void 0 && (n.notes = t.notes), t.signals !== void 0) {
    n.signals = { ...n.signals };
    for (const [i, c] of Object.entries(t.signals)) n.signals[i] = {
      ...n.signals[i] ?? {},
      ...c
    };
  }
  const o = {
    ...r,
    shared: n,
    updatedAt: Date.now()
  };
  eo.set(e, o), ni.set(e, o), $m(), Zn("chat_documents", "", e);
}
async function Dm(e, t) {
  const r = yl(e, t), n = to.get(r);
  if (n) return n;
  const o = await ut.chat_plugin_state.get([e, t]);
  return o && to.set(r, o), o ?? null;
}
async function vb(e, t, r, n) {
  const o = yl(e, t), i = await Dm(e, t), c = Date.now(), u = {
    pluginId: e,
    chatKey: t,
    schemaVersion: n?.schemaVersion ?? i?.schemaVersion ?? 1,
    state: {
      ...i?.state ?? {},
      ...r
    },
    summary: n?.summary ?? i?.summary ?? {},
    updatedAt: c
  };
  to.set(o, u), ro.set(o, u), $m(), Zn("chat_plugin_state", e, t);
}
async function bb(e, t) {
  const r = yl(e, t);
  to.delete(r), ro.delete(r);
  try {
    return await ut.chat_plugin_state.delete([e, t]), Zn("chat_plugin_state", e, t), !0;
  } catch {
    return !1;
  }
}
async function Nm(e, t) {
  const r = await ut.chat_plugin_state.where("pluginId").equals(e).toArray();
  let n = r;
  if (t?.chatKeyPrefix) {
    const o = t.chatKeyPrefix;
    n = r.filter((i) => i.chatKey.startsWith(o));
  }
  return n.sort((o, i) => i.updatedAt - o.updatedAt), t?.limit && t.limit > 0 && (n = n.slice(0, t.limit)), n.map((o) => ({
    pluginId: o.pluginId,
    chatKey: o.chatKey,
    summary: o.summary,
    updatedAt: o.updatedAt
  }));
}
async function Lm(e, t, r, n) {
  const o = Date.now(), i = {
    pluginId: e,
    chatKey: t,
    collection: r,
    recordId: n.recordId,
    payload: n.payload,
    ts: n.ts ?? o,
    updatedAt: o
  };
  await ut.chat_plugin_records.add(i), Zn("chat_plugin_records", e, t);
}
var v_ = new Xn("SDK-AccessControl");
function Mm(e) {
  const t = String(e ?? "").trim().toLowerCase();
  return t === "dark" ? "dark" : t === "light" ? "light" : t === "tavern" || t === "host" ? "tavern" : "default";
}
function xb(e) {
  return e === "tavern" ? "host" : e;
}
function Sl(e) {
  return e === "host" ? "tavern" : e;
}
var es = Lo(), b_ = es.parser, x_ = es.command, y_ = es.argument, S_ = es.namedArgument, E_ = es.argumentType, __ = mv() ?? void 0, T_ = lm() ?? void 0, k_ = cm() ?? void 0;
function ts() {
  return dn();
}
var Om = /\[(APPLY_STATUS|REMOVE_STATUS|CLEAR_STATUS)\s*:(.*?)\]|\[(CLEAR_STATUS)\]/gi;
function It(e) {
  return typeof e == "string" ? e.trim() : "";
}
function El(e) {
  if (e == null || e === "") return null;
  const t = Number(e);
  if (!Number.isFinite(t)) return null;
  const r = Math.floor(t);
  return r <= 0 ? null : r;
}
function hn(e) {
  const t = El(e);
  return t == null ? "永久" : `剩余${t}轮`;
}
function Mn(e) {
  return It(e).toLowerCase();
}
function Bo(e) {
  return It(e).toLowerCase();
}
function yb(e) {
  const t = It(e);
  if (!t) return [];
  const r = t.split("|").map((n) => Bo(n)).filter(Boolean);
  return Array.from(new Set(r));
}
function Sb(e) {
  const t = e.match(/(?:turns|duration)\s*=\s*([^,\]]+)/i);
  if (!t) return 1;
  const r = String(t[1] ?? "").trim();
  if (!r) return 1;
  if (/^(perm|permanent|forever|infinite|inf|\*)$/i.test(r)) return null;
  const n = Number(r);
  return Number.isFinite(n) && Math.floor(n) >= 1 ? Math.floor(n) : (de.warn(`状态标签 turns/duration 非法，已回退为 1 轮: ${r}`), 1);
}
function nn(e) {
  return jn(String(e || "").replace(Om, "").replace(/[ \t]{2,}/g, " "));
}
function Eb(e, t) {
  const r = [], n = String(e || ""), o = Bo(t), i = new RegExp(Om.source, "gi");
  let c;
  for (; (c = i.exec(n)) !== null; ) {
    const u = String(c[1] || c[3] || "").trim().toUpperCase(), h = It(c[2] || "");
    if (u === "CLEAR_STATUS") {
      r.push({ kind: "clear" });
      continue;
    }
    if (u === "REMOVE_STATUS") {
      const L = It(h);
      if (!L) continue;
      r.push({
        kind: "remove",
        name: L
      });
      continue;
    }
    if (u !== "APPLY_STATUS") continue;
    const f = h.split(",").map((L) => It(L)), v = f[0] || "", x = Number(f[1]);
    if (!v || !Number.isFinite(x)) continue;
    const y = f.slice(2).join(","), S = Sb(y);
    let _ = "skills", P = [];
    if (/scope\s*=\s*all/i.test(y)) _ = "all";
    else {
      const L = y.match(/skills\s*=\s*([^,\]]+)/i);
      L && (P = yb(L[1] || "")), P.length <= 0 && o && (P = [o]);
    }
    r.push({
      kind: "apply",
      name: v,
      modifier: x,
      durationRounds: S,
      scope: _,
      skills: P
    });
  }
  return r;
}
function Pm(e, t) {
  const r = Eb(e, t);
  return {
    cleanedText: nn(e),
    commands: r
  };
}
function _b(e, t = Date.now()) {
  if (!e || typeof e != "object") return null;
  const r = It(e.name), n = Number(e.modifier), o = El(e.remainingRounds), i = It(e.scope).toLowerCase() === "all" ? "all" : "skills", c = e.enabled !== !1, u = Array.isArray(e.skills) ? e.skills : [], h = Array.from(new Set(u.map((P) => Bo(P)).filter((P) => !!P))), f = Number(e.createdAt), v = Number(e.updatedAt), x = Number.isFinite(f) ? f : t, y = Number.isFinite(v) ? v : x, S = It(e.source), _ = S === "manual_editor" || S === "ai_tag" ? S : void 0;
  return !r || !Number.isFinite(n) || i === "skills" && h.length <= 0 ? null : {
    name: r,
    modifier: n,
    remainingRounds: o,
    scope: i,
    skills: h,
    enabled: c,
    createdAt: x,
    updatedAt: y,
    source: _
  };
}
function yt(e) {
  if (!Array.isArray(e)) return [];
  const t = [], r = /* @__PURE__ */ new Map();
  for (const n of e) {
    const o = _b(n);
    if (!o) continue;
    const i = Mn(o.name), c = r.get(i);
    if (c == null) {
      r.set(i, t.length), t.push(o);
      continue;
    }
    t[c] = o;
  }
  return t;
}
function Cr(e) {
  return Array.isArray(e.activeStatuses) || (e.activeStatuses = []), e.activeStatuses = yt(e.activeStatuses), e.activeStatuses;
}
function Tb(e, t, r, n = Date.now()) {
  if (!Array.isArray(t) || t.length <= 0) return !1;
  const o = Cr(e);
  let i = !1;
  for (const c of t) {
    if (c.kind === "clear") {
      o.length > 0 && (o.splice(0, o.length), i = !0);
      continue;
    }
    if (c.kind === "remove") {
      const u = Mn(c.name), h = o.findIndex((f) => Mn(f.name) === u);
      h >= 0 && (o.splice(h, 1), i = !0);
      continue;
    }
    if (c.kind === "apply") {
      const u = Mn(c.name), h = o.findIndex((x) => Mn(x.name) === u), f = h >= 0 ? o[h] : null, v = {
        name: c.name,
        modifier: c.modifier,
        remainingRounds: c.durationRounds == null ? null : Math.max(1, Math.floor(c.durationRounds)),
        scope: c.scope,
        skills: c.scope === "all" ? [] : Array.from(new Set(c.skills)),
        enabled: !0,
        createdAt: f?.createdAt ?? n,
        updatedAt: n,
        source: r
      };
      h >= 0 ? o[h] = v : o.push(v), i = !0;
    }
  }
  return i;
}
function _l(e, t) {
  const r = yt(e), n = Bo(t);
  let o = 0;
  const i = [];
  for (const c of r) {
    if (!c.enabled) continue;
    const u = El(c.remainingRounds);
    if (c.remainingRounds != null && u == null) continue;
    const h = Number(c.modifier);
    if (Number.isFinite(h)) {
      if (c.scope === "all") {
        o += h, i.push({
          name: c.name,
          modifier: h
        });
        continue;
      }
      n && c.skills.includes(n) && (o += h, i.push({
        name: c.name,
        modifier: h
      }));
    }
  }
  return {
    modifier: o,
    matched: i
  };
}
function kb(e, t, r) {
  const n = yt(e), o = [];
  if (o.push(t), n.length <= 0)
    return o.push("none"), o.push(r), jn(o.join(`
`));
  o.push(`count=${n.length}`);
  for (const i of n) {
    const c = i.scope, u = c === "all" ? "-" : i.skills.join("|"), h = hn(i.remainingRounds);
    o.push(`- name="${i.name}" mod=${i.modifier >= 0 ? `+${i.modifier}` : i.modifier} duration=${h} scope=${c} skills=${u} enabled=${i.enabled ? 1 : 0}`);
  }
  return o.push(r), jn(o.join(`
`));
}
var Fc = "[SS-Helper][StoreThemeTrace]", Ls = null, js = null, Vc = !1;
function wb(e) {
  const t = e.pendingRound;
  if (t) {
    const n = Array.isArray(t.sourceAssistantMsgIds) ? t.sourceAssistantMsgIds.map((i) => String(i ?? "").trim()).filter(Boolean) : [];
    if (n.length > 0) return n[n.length - 1];
    const o = Array.isArray(t.events) ? t.events.map((i) => String(i?.sourceAssistantMsgId ?? "").trim()).filter(Boolean) : [];
    if (o.length > 0) return o[o.length - 1];
  }
  const r = Array.isArray(e.summaryHistory) ? e.summaryHistory : [];
  for (let n = r.length - 1; n >= 0; n -= 1) {
    const o = r[n], i = Array.isArray(o?.sourceAssistantMsgIds) ? o.sourceAssistantMsgIds.map((u) => String(u ?? "").trim()).filter(Boolean) : [];
    if (i.length > 0) return i[i.length - 1];
    const c = Array.isArray(o?.events) ? o.events.map((u) => String(u?.sourceAssistantMsgId ?? "").trim()).filter(Boolean) : [];
    if (c.length > 0) return c[c.length - 1];
  }
}
var no = () => {
};
function Ib(e) {
  no = e;
}
var Bn = "", Xt = null, Yc = 0;
function Bm(e, t) {
  if (t === void 0) {
    console.info(`${Fc} ${e}`);
    return;
  }
  console.info(`${Fc} ${e}`, t);
}
var qs = {
  pendingRound: void 0,
  activeStatuses: [],
  outboundSummary: void 0,
  pendingResultGuidanceQueue: [],
  outboundResultGuidance: void 0,
  summaryHistory: [],
  lastPromptUserMsgId: void 0,
  lastProcessedAssistantMsgId: void 0
}, Um = {};
function Uo() {
  const e = cn();
  return e ? (Xt = e, Bn = sn({
    ...e,
    chatId: e.currentChatId
  }), Bn) : (Xt = null, Bn = "", "");
}
function Km(e, t) {
  const r = ns(rs(typeof e.skillPresetStoreText == "string" ? e.skillPresetStoreText : "", t)) ?? on();
  return {
    skillPresetStoreText: JSON.stringify(r, null, 2),
    activeStatuses: yt(e.activeStatuses),
    lastBaseRoll: e.lastBaseRoll ?? null,
    pendingRound: e.pendingRound ?? null,
    summaryHistory: Array.isArray(e.summaryHistory) ? e.summaryHistory : []
  };
}
async function Tl(e) {
  const t = Ee().skillTableText;
  return Km((await Dm("stx_rollhelper", e))?.state ?? {}, t);
}
async function kl(e, t, r) {
  const n = Ee().skillTableText, o = await Tl(e), i = typeof t == "function" ? t(o) : t, c = Km({
    ...o,
    ...i ?? {}
  }, n), u = Ze(e, { tavernInstanceId: (Xt ?? cn())?.tavernInstanceId });
  return String(u.chatId ?? "unknown_chat").trim(), await vb(At, e, c, { summary: { activeStatusCount: c.activeStatuses.length } }), c;
}
function Ab(e) {
  const t = Uo();
  t && kl(t, (r) => ({
    ...r,
    skillPresetStoreText: e
  })).catch((r) => {
    de.warn(`聊天级技能持久化失败，chatKey=${t}`, r);
  });
}
function $b() {
  const e = Uo();
  if (!e) return;
  const t = qs, r = Um;
  (async () => {
    try {
      await kl(e, (o) => ({
        ...o,
        activeStatuses: yt(t.activeStatuses),
        lastBaseRoll: r.last ?? null,
        pendingRound: t.pendingRound ?? null,
        summaryHistory: Array.isArray(t.summaryHistory) ? t.summaryHistory : []
      }));
      const n = Xt ?? cn();
      n && await fb(e, {
        tavernInstanceId: n.tavernInstanceId,
        scopeType: n.scopeType,
        scopeId: n.scopeId,
        chatId: n.currentChatId
      }), await gb(e, { signals: { stx_rollhelper: {
        lastRollSummary: r.last ? `${r.last.expr} = ${r.last.total}` : null,
        hasPendingRound: !!t.pendingRound,
        activeStatusCount: t.activeStatuses.length
      } } });
    } catch (n) {
      de.warn(`运行时状态持久化失败，chatKey=${e}`, n);
    }
  })();
}
function wl() {
  return Bn || Uo();
}
async function Rb() {
  const e = Xt ?? cn();
  return e ? (Xt = e, (await Nm(At)).map((t) => ({
    chatKey: String(t.chatKey ?? "").trim(),
    updatedAt: Number(t.updatedAt) || 0,
    activeStatusCount: Number(t.summary?.activeStatusCount) || 0,
    chatId: "",
    displayName: "",
    avatarUrl: "",
    scopeType: "character",
    scopeId: "",
    roleKey: ""
  }))) : [];
}
async function Cb() {
  return (await Nv()).map((e) => ({
    chatKey: sn(e.locator),
    updatedAt: Number(e.updatedAt) || 0,
    chatId: String(e.locator.chatId ?? "").trim(),
    displayName: String(e.locator.displayName ?? "").trim(),
    avatarUrl: String(e.locator.avatarUrl ?? "").trim(),
    scopeType: e.locator.scopeType === "group" ? "group" : "character",
    scopeId: String(e.locator.scopeId ?? "").trim(),
    roleKey: String(e.locator.roleKey ?? "").trim()
  })).filter((e) => e.chatKey && !it(e.chatId));
}
async function Db(e) {
  return yt((await Tl(e)).activeStatuses);
}
async function Nb(e, t) {
  await kl(e, (r) => ({
    ...r,
    activeStatuses: yt(t)
  }));
}
async function Lb(e) {
  const t = Xt ?? cn();
  if (!t) return {
    deletedCount: 0,
    deletedChatKeys: []
  };
  Xt = t;
  const r = new Set((Array.isArray(e) ? e : []).map((i) => Gt(Ze(String(i ?? "").trim(), { tavernInstanceId: String(t.tavernInstanceId ?? "").trim() }))).filter(Boolean)), n = await Nm(At), o = [];
  for (const i of n) {
    const c = String(i.chatKey ?? "").trim();
    if (!c) continue;
    const u = Gt(Ze(c, { tavernInstanceId: String(t.tavernInstanceId ?? "").trim() }));
    !u || r.has(u) || await bb("stx_rollhelper", c) && o.push(c);
  }
  return {
    deletedCount: o.length,
    deletedChatKeys: o
  };
}
async function Hm(e = "init") {
  const t = ++Yc, r = Uo();
  if (r)
    try {
      const n = await Tl(r);
      if (t !== Yc) return;
      const o = Ee(), i = ns(rs(n.skillPresetStoreText)) ?? on(), c = JSON.stringify(i, null, 2), u = io(i, o.skillTableText), h = Ce();
      h.activeStatuses = yt(n.activeStatuses), h.pendingRound = n.pendingRound ?? void 0, h.summaryHistory = Array.isArray(n.summaryHistory) ? n.summaryHistory : [], h.outboundSummary = void 0, h.pendingResultGuidanceQueue = [], h.outboundResultGuidance = void 0, h.lastPromptUserMsgId = void 0, h.lastProcessedAssistantMsgId = wb(n);
      const f = qn();
      f.last = n.lastBaseRoll ?? void 0, f.lastTotal = n.lastBaseRoll?.total;
      let v = !1;
      (o.skillPresetStoreText !== c || o.skillTableText !== u) && (Fn({
        skillPresetStoreText: c,
        skillTableText: u
      }), v = !0), lo = "", dt = {}, v || no();
    } catch (n) {
      de.warn(`聊天级状态装载失败，已降级默认 (${e}) chatKey=${r}`, n);
      const o = Ee(), i = on(), c = JSON.stringify(i, null, 2), u = io(i, o.skillTableText), h = Ce();
      h.activeStatuses = [], h.pendingRound = void 0, h.summaryHistory = [], h.outboundSummary = void 0, h.pendingResultGuidanceQueue = [], h.outboundResultGuidance = void 0, h.lastPromptUserMsgId = void 0, h.lastProcessedAssistantMsgId = void 0;
      const f = qn();
      f.last = void 0, f.lastTotal = void 0;
      let v = !1;
      (o.skillPresetStoreText !== c || o.skillTableText !== u) && (Fn({
        skillPresetStoreText: c,
        skillTableText: u
      }), v = !0), lo = "", dt = {}, v || no();
    }
}
function qn() {
  return Um;
}
function Gm(e) {
  const t = qn();
  t.last = e, t.lastTotal = e.total, Jt();
  const r = wl();
  r && Lm(At, r, "roll_results", {
    recordId: Rr("roll"),
    payload: e
  }).catch(() => {
  });
}
function Ce() {
  return Array.isArray(qs.activeStatuses) || (qs.activeStatuses = []), qs;
}
function Jt() {
  $b();
}
function zm(e) {
  return Mm(e);
}
function Il() {
  const e = Ii().themeId;
  return Sl(e);
}
function jm(e) {
  return String(e?.tavernInstanceId ?? "").trim() || "unknown_tavern";
}
function qm() {
  return jm(Am());
}
function Al(e) {
  return { ...e };
}
function Mb(e) {
  return !js || js.scopeKey !== e ? null : js.settings;
}
function so(e, t) {
  js = {
    scopeKey: e,
    settings: Al(t)
  };
}
function Fm(e) {
  const t = Vm(), r = qm(), n = t.write((o) => {
    const i = Al(o);
    return {
      ...typeof e == "function" ? e(i) : {
        ...i,
        ...e ?? {}
      },
      theme: Il()
    };
  });
  return so(r, n), n;
}
function Ob(e, t = !1) {
  const r = zm(e.theme), n = Il();
  return r !== n ? (Bm("ensureSettingsThemeMirrorEvent writing mirrored theme back to settings", {
    settingsTheme: r,
    sdkSettingsTheme: n,
    allowSeedFromLegacy: t,
    settingsTheme_raw: e.theme
  }), Fm({ theme: n })) : e.theme === n ? e : {
    ...e,
    theme: n
  };
}
function Pb(e) {
  const t = {
    ...Pn,
    ...e ?? {}
  };
  t.enabled = t.enabled !== !1, t.autoSendRuleToAI = t.autoSendRuleToAI !== !1, t.enableAiRollMode = t.enableAiRollMode !== !1, t.enableAiRoundControl = t.enableAiRoundControl === !0, t.enableExplodingDice = t.enableExplodingDice !== !1, t.enableAdvantageSystem = t.enableAdvantageSystem !== !1, t.enableDynamicResultGuidance = t.enableDynamicResultGuidance === !0, t.enableDynamicDcReason = t.enableDynamicDcReason !== !1, t.enableStatusSystem = t.enableStatusSystem !== !1, t.aiAllowedDiceSidesText = typeof e?.aiAllowedDiceSidesText == "string" ? String(e.aiAllowedDiceSidesText).trim() : Pn.aiAllowedDiceSidesText;
  const r = String(e?.theme ?? "").trim().toLowerCase();
  t.theme = r === "dark" || r === "light" || r === "tavern" ? r : r === "host" ? "tavern" : "default", t.enableOutcomeBranches = t.enableOutcomeBranches !== !1, t.enableExplodeOutcomeBranch = t.enableExplodeOutcomeBranch !== !1, t.includeOutcomeInSummary = t.includeOutcomeInSummary !== !1, t.showOutcomePreviewInListCard = t.showOutcomePreviewInListCard !== !1;
  const n = String(e?.summaryDetailMode || "").toLowerCase();
  t.summaryDetailMode = n === "balanced" || n === "detailed" ? n : "minimal";
  const o = Number(e?.summaryHistoryRounds), i = Number.isFinite(o) ? Math.floor(o) : Pn.summaryHistoryRounds;
  t.summaryHistoryRounds = Math.min(10, Math.max(1, i)), t.eventApplyScope = t.eventApplyScope === "all" ? "all" : "protagonist_only", t.enableTimeLimit = t.enableTimeLimit !== !1;
  const c = Number(t.minTimeLimitSeconds), u = Number.isFinite(c) ? Math.floor(c) : 10;
  t.minTimeLimitSeconds = Math.max(1, u), t.enableSkillSystem = t.enableSkillSystem !== !1, t.skillTableText = typeof t.skillTableText == "string" && t.skillTableText.trim().length > 0 ? t.skillTableText : "{}", t.skillPresetStoreText = rs(typeof e?.skillPresetStoreText == "string" ? String(e.skillPresetStoreText) : "", t.skillTableText);
  const h = ns(t.skillPresetStoreText);
  return h && (t.skillTableText = io(h, t.skillTableText), t.skillPresetStoreText = JSON.stringify(h, null, 2)), Number(e?.ruleTextModeVersion) !== 2 && (t.ruleText = "", t.ruleTextModeVersion = 2), Number(t.ruleTextModeVersion) !== 2 && (t.ruleTextModeVersion = 2), t.ruleText = typeof t.ruleText == "string" ? t.ruleText : "", t;
}
function Vm() {
  return Ls || (Ls = ib({
    namespace: At,
    defaults: Pn,
    normalize: Pb
  })), Vc || (Vc = !0, Ls.subscribe((e, t) => {
    so(jm(t), e), no();
  })), Ls;
}
function Ym() {
  const e = ts(), t = e?.saveChat ?? e?.saveChatConditional ?? e?.saveChatDebounced;
  if (typeof t == "function")
    try {
      Promise.resolve(t.call(e)).catch((r) => {
        de.warn("保存聊天失败", r);
      });
    } catch (r) {
      de.warn("保存聊天失败", r);
    }
}
function Ee() {
  const e = qm(), t = Mb(e), r = t ?? Vm().read();
  t || so(e, r);
  const n = Ob(r, !1);
  return n !== r && so(e, n), Al(n);
}
function Wm(e = Ce()) {
  return Array.isArray(e.activeStatuses) || (e.activeStatuses = []), e.activeStatuses = yt(e.activeStatuses), e.activeStatuses;
}
function Bb(e) {
  const t = Ce();
  t.activeStatuses = yt(Array.isArray(e) ? e : []), Jt();
}
function Fn(e) {
  const t = e;
  Bm("updateSettingsEvent", {
    patch: e,
    patchTheme: t.theme ?? null,
    sdkThemeBefore: Il()
  });
  const r = t.theme != null ? zm(t.theme) : null, { theme: n, ...o } = t;
  Fm(r == null ? o : {
    ...o,
    theme: r
  });
}
function Vn(e) {
  return String(e ?? "").trim().toLowerCase();
}
function Xm(e, t) {
  return {
    rowId: Rr("skill_row"),
    skillName: e,
    modifierText: t
  };
}
function Ub(e) {
  const t = an(e);
  if (t == null) return 0;
  try {
    const r = JSON.parse(t);
    return !r || typeof r != "object" || Array.isArray(r) ? 0 : Object.keys(r).length;
  } catch {
    return 0;
  }
}
function oo(e = Date.now()) {
  return {
    id: Co,
    name: tm,
    locked: !0,
    skillTableText: nm,
    createdAt: e,
    updatedAt: e
  };
}
function on(e = Date.now()) {
  const t = oo(e);
  return {
    version: 1,
    activePresetId: t.id,
    presets: [t]
  };
}
function Kb(e, t, r = "") {
  const n = String(t ?? "").trim() || "新预设", o = new Set(e.presets.filter((u) => u.id !== r).map((u) => Vn(u.name)));
  let i = n, c = 2;
  for (; o.has(Vn(i)); )
    i = `${n} ${c}`, c += 1;
  return i;
}
function rs(e, t) {
  const r = Date.now(), n = String(e ?? "").trim();
  let o = null;
  if (n) try {
    o = JSON.parse(n);
  } catch {
    o = null;
  }
  const i = [], c = /* @__PURE__ */ new Set(), u = /* @__PURE__ */ new Set(), h = (y, S, _, P = !1) => {
    const L = String(y?.id ?? "").trim() || Rr("skill_preset");
    let M = L;
    for (; c.has(M); ) M = `${L}_${Math.random().toString(36).slice(2, 7)}`;
    c.add(M);
    const B = String(y?.name ?? "").trim() || _;
    let C = B, G = 2;
    for (; u.has(Vn(C)); )
      C = `${B} ${G}`, G += 1;
    u.add(Vn(C));
    const F = an(String(y?.skillTableText ?? "{}")) ?? "{}", Z = Number(y?.createdAt), H = Number.isFinite(Z) ? Z : r, X = Number(y?.updatedAt), K = Number.isFinite(X) ? X : H;
    i.push({
      id: M,
      name: C,
      locked: !!(y?.locked || P),
      skillTableText: F,
      createdAt: H,
      updatedAt: K
    });
  };
  o && typeof o == "object" && !Array.isArray(o) && Array.isArray(o.presets) && o.presets.forEach((y, S) => {
    h(y, S, `${rm} ${S + 1}`);
  });
  let f = i.find((y) => y.id === "skill_preset_default_general_trpg") ?? null;
  f ? (f.name = tm, f.locked = !0) : (f = oo(r), i.unshift(f)), i.length || i.push(oo(r));
  let v = String(o?.activePresetId ?? "").trim();
  return (!v || !i.some((y) => y.id === v)) && (v = Co), JSON.stringify({
    version: 1,
    activePresetId: v,
    presets: i
  }, null, 2);
}
function ns(e) {
  const t = String(e ?? "").trim();
  if (!t) return null;
  try {
    const r = JSON.parse(t);
    if (!r || typeof r != "object" || Array.isArray(r) || Number(r.version) !== 1 || !Array.isArray(r.presets)) return null;
    const n = String(r.activePresetId ?? "").trim(), o = r.presets;
    return !n || !o.length ? null : r;
  } catch {
    return null;
  }
}
function oi(e = Ee()) {
  const t = ns(rs(String(e.skillPresetStoreText ?? "")));
  return t || on();
}
function ai(e, t) {
  const r = String(t ?? "").trim();
  return r ? e.presets.find((n) => n.id === r) ?? null : null;
}
function ao(e) {
  const t = ai(e, e.activePresetId);
  if (t) return t;
  const r = ai(e, Co);
  return r || (e.presets[0] ?? oo());
}
function io(e, t = "{}") {
  const r = ao(e), n = an(r.skillTableText) ?? an(t) ?? "{}";
  return r.skillTableText = n, n;
}
function Wc(e) {
  const t = Ee(), r = ns(rs(JSON.stringify(e))) ?? on(), n = io(r, t.skillTableText), o = JSON.stringify(r, null, 2);
  Fn({
    skillPresetStoreText: o,
    skillTableText: n
  }), Ab(o);
}
function Jm(e) {
  return JSON.stringify(e.map((t) => ({
    skillName: String(t.skillName ?? ""),
    modifierText: String(t.modifierText ?? "")
  })));
}
function Hb(e) {
  return typeof e == "string" ? e.trim() : "";
}
function $l(e) {
  return Hb(e).toLowerCase();
}
function Qm(e) {
  if (!e || typeof e != "object" || Array.isArray(e)) return null;
  const t = {};
  for (const [r, n] of Object.entries(e)) {
    const o = $l(r);
    if (!o) continue;
    const i = Number(n);
    Number.isFinite(i) && (t[o] = i);
  }
  return t;
}
function an(e) {
  const t = String(e ?? "").trim();
  if (!t) return "{}";
  try {
    const r = Qm(JSON.parse(t));
    return r == null ? null : JSON.stringify(r, null, 2);
  } catch {
    return null;
  }
}
var lo = "", dt = {};
function Gb(e) {
  const t = String(e.skillTableText ?? "").trim();
  if (t === lo) return dt;
  if (lo = t, !t)
    return dt = {}, dt;
  try {
    const r = Qm(JSON.parse(t));
    return r == null ? (de.warn("skillTableText 不是合法 JSON 对象，已按空表处理。"), dt = {}, dt) : (dt = r, dt);
  } catch (r) {
    return de.warn("skillTableText 解析失败，已按空表处理。", r), dt = {}, dt;
  }
}
function Ko(e, t = Ee()) {
  if (!t.enableSkillSystem) return 0;
  const r = $l(e);
  if (!r) return 0;
  const n = Gb(t), o = Number(n[r] ?? 0);
  return Number.isFinite(o) ? o : 0;
}
function Zm(e) {
  const t = String(e ?? "").trim();
  if (!t) return [];
  try {
    const r = JSON.parse(t);
    return !r || typeof r != "object" || Array.isArray(r) ? [] : Object.entries(r).map(([n, o]) => Xm(String(n ?? ""), String(o ?? "")));
  } catch {
    return [];
  }
}
function eh(e) {
  const t = [], r = {}, n = /* @__PURE__ */ new Map(), o = /^[+-]?\d+$/;
  return e.forEach((i, c) => {
    const u = c + 1, h = String(i.skillName ?? ""), f = String(i.modifierText ?? ""), v = h.trim(), x = $l(v);
    let y = !1;
    v || (t.push(`第 ${u} 行：技能名不能为空`), y = !0);
    let S = 0;
    const _ = f.trim();
    if (_ ? o.test(_) ? (S = Number(_), Number.isFinite(S) || (t.push(`第 ${u} 行：加值必须是有限整数`), y = !0)) : (t.push(`第 ${u} 行：加值必须是整数`), y = !0) : (t.push(`第 ${u} 行：加值不能为空`), y = !0), x) {
      const P = n.get(x);
      P != null ? (t.push(`第 ${u} 行：技能名与第 ${P + 1} 行重复`), y = !0) : n.set(x, c);
    }
    !y && x && (r[x] = S);
  }), {
    errors: t,
    table: r
  };
}
function zb(e) {
  const t = eh(e);
  return t.errors.length > 0 ? null : JSON.stringify(t.table, null, 2);
}
var Xc = 1e3, Jc = 1e3, Qc = 1e4;
function jb(e) {
  const t = String(e || "").trim();
  if (!t) return null;
  const r = t.match(/\[DICE_ALLOWED_SIDES\]([\s\S]*?)\[\/DICE_ALLOWED_SIDES\]/i), n = (r ? r[1] : t).match(/allowed_sides\s*=\s*([^\n\r]+)/i);
  if (!n) return null;
  const o = n[1].split(/[,\s]+/).map((i) => Number(String(i || "").trim())).filter((i) => Number.isFinite(i) && Number.isInteger(i) && i > 0);
  return o.length === 0 ? null : new Set(o);
}
function qb(e, t) {
  const r = Qt(e), n = jb(t);
  if (!(!n || n.size === 0) && !n.has(r.sides))
    throw new Error(`当前规则不允许 d${r.sides}，allowed_sides=${Array.from(n).sort((o, i) => o - i).join(",")}`);
}
function Qt(e) {
  const t = String(e || "").replace(/\s+/g, "").match(/^(\d*)d(\d+)(!)?(?:(kh|kl)(\d+))?([+\-]\d+)?$/i);
  if (!t) throw new Error(`无效的骰子表达式：${e}，示例：1d20、3d6+2、2d20kh1`);
  const r = Number(t[1] || 1), n = Number(t[2]), o = !!t[3], i = String(t[4] || "").toLowerCase(), c = i === "kh" || i === "kl" ? i : void 0, u = c ? Number(t[5] || 0) : void 0, h = Number(t[6] || 0);
  if (!Number.isFinite(r) || !Number.isInteger(r) || r <= 0) throw new Error(`骰子数量无效：${r}`);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n <= 0) throw new Error(`骰子面数无效：${n}`);
  if (r > Xc) throw new Error(`骰子数量过大（${r}），上限 ${Xc}`);
  if (n > Jc) throw new Error(`骰子面数过大（${n}），上限 ${Jc}`);
  if (c) {
    if (!Number.isFinite(u) || !Number.isInteger(u) || u <= 0) throw new Error(`kh/kl 参数无效：${e}`);
    if (u > r) throw new Error(`kh/kl 保留数量不能大于骰子数量：${e}`);
  }
  if (o && c) throw new Error("当前版本不支持 ! 与 kh/kl 同时使用");
  return {
    count: r,
    sides: n,
    modifier: h,
    explode: o,
    keepMode: c,
    keepCount: u
  };
}
function Zc(e) {
  const t = Math.floor(e);
  if (typeof crypto < "u" && typeof crypto.getRandomValues == "function") {
    const r = new Uint32Array(1), n = Math.floor(4294967295 / t) * t;
    let o;
    do
      crypto.getRandomValues(r), o = r[0];
    while (o >= n);
    return o % t + 1;
  }
  return Math.floor(Math.random() * t) + 1;
}
function Fb(e, t, r) {
  let n = Zc(e);
  if (r.push(n), !!t)
    for (; n === e; ) {
      if (r.length >= Qc) throw new Error(`爆骰次数超过安全上限 ${Qc}，请调整表达式`);
      n = Zc(e), r.push(n);
    }
}
function Rn(e) {
  const { count: t, sides: r, modifier: n, explode: o, keepMode: i, keepCount: c } = Qt(e), u = Ee(), h = o && u.enableExplodingDice, f = [];
  for (let L = 0; L < t; L++) Fb(r, h, f);
  let v, x, y = "none";
  if (i && c && c < f.length) {
    const L = f.map((B, C) => ({
      value: B,
      index: C
    }));
    L.sort((B, C) => B.value === C.value ? B.index - C.index : i === "kh" ? C.value - B.value : B.value - C.value);
    const M = new Set(L.slice(0, c).map((B) => B.index));
    v = f.filter((B, C) => M.has(C)), x = f.filter((B, C) => !M.has(C)), y = i === "kh" ? "keep_highest" : "keep_lowest";
  } else i && c && (v = [...f], x = [], y = i === "kh" ? "keep_highest" : "keep_lowest");
  const S = (Array.isArray(v) ? v : f).reduce((L, M) => L + M, 0), _ = S + n, P = h && f.length > t;
  return {
    expr: e,
    count: t,
    sides: r,
    modifier: n,
    rolls: f,
    rawTotal: S,
    total: _,
    keepMode: i,
    keepCount: c,
    keptRolls: v,
    droppedRolls: x,
    selectionMode: y,
    exploding: h,
    explosionTriggered: P
  };
}
function th(e, t = {}) {
  t.rule && qb(e, t.rule);
  let r = Rn(e);
  if (t.adv) {
    const n = Rn(e), o = Rn(e);
    r = n.total >= o.total ? n : o;
  }
  if (t.dis) {
    const n = Rn(e), o = Rn(e);
    r = n.total <= o.total ? n : o;
  }
  return r;
}
function Vb(e, t, r) {
  if (r == null || !Number.isFinite(r)) return null;
  switch (t) {
    case ">=":
      return e >= r;
    case ">":
      return e > r;
    case "<=":
      return e <= r;
    case "<":
      return e < r;
    default:
      return null;
  }
}
var Yb = [
  {
    version: "v1.1.7",
    date: "2026-03-17",
    sections: [{
      type: "added",
      items: ["为 SS-Helper-MemoryOS 插件进行了兼容。"]
    }, {
      type: "improved",
      items: ["优化了技能编辑器在电脑模式下的UI，修复了手机模式下无法滚动的问题。"]
    }]
  },
  {
    version: "v1.1.6",
    date: "2026-03-13",
    sections: [
      {
        type: "added",
        items: ["为事件卡片新增移动端模板与样式，补齐移动端列表卡、列表项、结算卡和结果卡布局。", "新增移动端专用的事件列表卡、事件列表项、结算卡与结果卡 HTML 模板文件。"]
      },
      {
        type: "changed",
        items: ["收紧事件 ROLLJSON 提示约束，明确只有 checkDice 含 ! 时才允许输出 explode 分支，避免爆骰分支与骰式不一致。", "调整设置页主题挂载范围，扩展列表标题条恢复跟随酒馆官方 inline-drawer 样式，仅内容区和弹窗继续使用 SDK 主题。"]
      },
      {
        type: "improved",
        items: [
          "优化卡片在手机端的渐变、排版与响应式展示，提升详情区可读性。",
          "完善桌面与移动端卡片渲染衔接，为后续独立适配留出结构空间。",
          "将 RollHelper 卡片内的 Tooltip 配色接入 SDK 主题系统，并放大相邻 Tooltip 目标间的平滑移动检测范围。",
          "优化亮色主题下的设置页可读性，修正文本阴影、选中标签、共享复选框悬浮边框和更新日志面板层次表现。",
          "为技能预设列表和状态编辑器侧栏名称补充超长文本跑马灯逻辑，宽度不足时自动滚动显示完整名称。"
        ]
      }
    ]
  },
  {
    version: "v1.1.5",
    date: "2026-03-11",
    sections: [
      {
        type: "added",
        items: [
          "新增事件列表项模板与掷骰结果卡片模板，开始切换到新的事件卡片渲染链路。",
          "新增 RollHelper 卡片测试页与 Vite 构建链路，并补充 Tailwind、PostCSS 与 CSS 类型声明。",
          "新增共享 Changelog 组件，以及 SDK Tavern Prompt/Runtime 封装能力。"
        ]
      },
      {
        type: "changed",
        items: ["将事件卡片样式拆分到 html/roll-cards 目录，改为模板文件加样式文件的组织方式。", "重构设置页模板、事件渲染与部分运行时依赖，统一新的组件与主题接入方式。"]
      },
      {
        type: "improved",
        items: ["增强事件卡片预览、调试与测试输入能力，便于持续调样和验收。", "优化事件列表项、结果卡和基础卡片样式细节，提升视觉一致性。"]
      }
    ]
  },
  {
    version: "v1.1.4",
    date: "2026-03-10",
    sections: [
      {
        type: "added",
        items: [
          "新增共享输入框与共享选择组件，支持统一样式、键盘交互和动态定位。",
          "新增 SDK 设置管理、插件聊天状态接口与 Tavern ChatKey 生成能力。",
          "新增设置页容器组件，并落地状态编辑器、技能编辑器与设置卡片拆分架构。",
          "新增消息净化模块与历史清理工具，用于处理外部摘要和记忆插件带入的数据。"
        ]
      },
      {
        type: "changed",
        items: ["将原有设置页逻辑拆分到 uiCard、uiTheme、statusEditor、skillEditor 等模块，降低耦合。", "重构部分 Tavern SDK、主题能力与提示体系，统一设置页与组件层的调用入口。"]
      },
      {
        type: "improved",
        items: ["补强共享按钮、共享复选框与全局提示样式，使设置页控件外观更统一。", "提升状态编辑与聊天维度存储链路的可维护性，为后续按聊天隔离数据打基础。"]
      }
    ]
  },
  {
    version: "v1.1.3",
    date: "2026-03-09",
    sections: [{
      type: "added",
      items: ["在设置卡片中新增主题选择项。"]
    }, {
      type: "improved",
      items: ["更新设置卡片样式，支持默认、深色、浅色和酒馆主题。", "优化复选框与主题变量映射，使设置页控件风格与主题系统保持一致。"]
    }]
  },
  {
    version: "v1.1.2",
    date: "2026-03-03",
    sections: [
      {
        type: "improved",
        items: [
          "重构三类 Roll 卡片（当前事件、检定结果、已结算）为默认收起的可展开结构，摘要只展示关键字段，展开后查看完整详情。",
          "当前事件卡收起态保留“执行检定”直达按钮，提升常用操作效率。",
          "结果卡与结算卡摘要补充骰子可视化与关键信息（状态、总点、条件、来源），并同步完善渲染参数。",
          "统一卡片按钮与交互样式，补齐展开状态指示、悬停反馈、结果区标题与骰子居中、移动端细节适配及 reduced-motion 兼容。",
          "状态编辑器 UI 全面重构为左右分栏，支持聊天侧栏与右侧编辑区协同工作，并支持侧栏宽度与表格列宽拖拽。",
          "聊天列表改为横向信息布局，补充头像、名称、最后聊天时间与 CHATID 展示，并完善中文化与长文本裁切。",
          "优化滚动行为：左栏承担整体纵向滚动，右侧表格仅数据区滚动且表头固定，列宽拖拽手柄增加视觉提示。"
        ]
      },
      {
        type: "fixed",
        items: ["修复 summary 内按钮误触发展开/收起的问题，确保检定操作与折叠交互互不干扰。"]
      },
      {
        type: "changed",
        items: ["状态数据改为按 chatKey 隔离存储与编辑：当前聊天保存即时生效，非当前聊天写入目标聊天，不再污染当前运行态。"]
      },
      {
        type: "added",
        items: ["新增 MemoryOS SDK Bus 集成，可探测安装与启用状态、读取 memory chat keys 并订阅状态广播；未安装或未启用时自动降级为本地模式。"]
      }
    ]
  },
  {
    version: "v1.1.1",
    date: "2026-03-03",
    sections: [{
      type: "added",
      items: [
        "新增手机分辨率适配。",
        "新增状态修正功能，AI 可以设定角色状态并自动修正检定结果。",
        "新增“系统动态规则注入 + 用户补充规则”机制，系统会按当前开关自动生成事件骰子协议，规则文本改为只填写补充内容。",
        "新增聊天级持久化，技能预设与角色状态按聊天维度保存，切换聊天会自动装载对应配置。",
        "新增状态持续轮次机制，支持 turns/duration 并在轮次切换时自动衰减与清理。",
        "新增 SSHelper 输入区工具栏，支持“技能预览 / 状态预览”弹窗。"
      ]
    }, {
      type: "improved",
      items: [
        "升级爆骰策略，AI 自动检测每轮允许的爆骰事件数量，超出上限时自动降级为普通掷骰并记录原因。",
        "重构事件卡片与结果卡样式，统一提示气泡、补充爆骰信息与状态变化摘要，并优化移动端展示。",
        "增强设置页，新增“恢复默认预设”按钮，状态编辑器支持持续轮次输入并强化校验提示。"
      ]
    }]
  }
], ed = "#stx-shared-tooltip{position:fixed;left:0;top:0;z-index:2147483000;opacity:0;pointer-events:none;visibility:hidden;transition:opacity .16s ease,transform .2s cubic-bezier(.22,1,.36,1),visibility 0s linear .16s;transform:translate3d(-9999px,-9999px,0);will-change:transform,opacity}#stx-shared-tooltip.is-visible{opacity:1;visibility:visible;transition:opacity .16s ease,transform .2s cubic-bezier(.22,1,.36,1),visibility 0s}#stx-shared-tooltip.is-instant{transition:none!important}#stx-shared-tooltip .stx-shared-tooltip-body{max-width:min(78vw,360px);min-width:72px;padding:8px 10px;border:1px solid var(--ss-theme-border, rgba(197, 160, 89, .55));border-radius:8px;background:var(--ss-theme-panel-bg, rgba(23, 21, 24, .96));backdrop-filter:var(--ss-theme-backdrop-filter, blur(3px));color:var(--ss-theme-text, #ecdcb8);font-size:12px;line-height:1.55;text-align:left;white-space:pre-wrap;box-shadow:var(--ss-theme-shadow, 0 8px 20px rgba(0, 0, 0, .45))}#stx-shared-tooltip[data-stx-tooltip-scope=rollhelper-card] .stx-shared-tooltip-body{border-color:var(--ss-theme-roll-tooltip-border, var(--ss-theme-border, rgba(197, 160, 89, .55)));background:var(--ss-theme-roll-tooltip-bg, var(--ss-theme-panel-bg, rgba(23, 21, 24, .96)));color:var(--ss-theme-roll-tooltip-text, var(--ss-theme-text, #ecdcb8));box-shadow:var(--ss-theme-roll-tooltip-shadow, var(--ss-theme-shadow, 0 8px 20px rgba(0, 0, 0, .45)))}html body [data-tip]:before,html body [data-tip]:after,html body [data-tip]:hover:before,html body [data-tip]:hover:after,html body [data-tip]:focus:before,html body [data-tip]:focus:after,html body [data-tip]:focus-visible:before,html body [data-tip]:focus-visible:after{content:none!important;display:none!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important}@media (prefers-reduced-motion: reduce){#stx-shared-tooltip{transition:none}}[data-tip]{pointer-events:auto!important;cursor:help!important}", td = "stx-shared-tooltip-style", rd = "stx-shared-tooltip", Ca = "__stxSharedTooltipState", nd = 1, Wb = 2147483e3, Xb = 90, Jb = 180, Qb = 420;
function co(e) {
  e.setAttribute("data-stx-shared-tooltip-runtime", "");
}
function Zb(e) {
  e && (typeof e.hideTimer == "number" && clearTimeout(e.hideTimer), typeof e.hideCleanupTimer == "number" && clearTimeout(e.hideCleanupTimer), typeof e.positionFrame == "number" && cancelAnimationFrame(e.positionFrame), typeof e.themeRefreshFrame == "number" && cancelAnimationFrame(e.themeRefreshFrame), e.hideTimer = null, e.hideCleanupTimer = null, e.positionFrame = null, e.themeRefreshFrame = null, e.activeTarget = null);
}
function e0(e) {
  e.unbindHandlers.forEach((t) => {
    try {
      t();
    } catch {
    }
  }), e.unbindHandlers = [], Zb(e), e.runtime?.root?.isConnected && e.runtime.root.remove(), e.runtime = null, e.bound = !1;
}
function t0() {
  const e = globalThis, t = e[Ca];
  if (t) if (t.version !== nd)
    e0(t), delete e[Ca];
  else return t;
  const r = {
    version: nd,
    bound: !1,
    runtime: null,
    activeTarget: null,
    lastCenterX: null,
    lastCenterY: null,
    hideTimer: null,
    hideCleanupTimer: null,
    positionFrame: null,
    themeRefreshFrame: null,
    unbindHandlers: []
  };
  return e[Ca] = r, r;
}
function r0() {
  const e = document.getElementById(td);
  if (e) {
    e.textContent !== "#stx-shared-tooltip{position:fixed;left:0;top:0;z-index:2147483000;opacity:0;pointer-events:none;visibility:hidden;transition:opacity .16s ease,transform .2s cubic-bezier(.22,1,.36,1),visibility 0s linear .16s;transform:translate3d(-9999px,-9999px,0);will-change:transform,opacity}#stx-shared-tooltip.is-visible{opacity:1;visibility:visible;transition:opacity .16s ease,transform .2s cubic-bezier(.22,1,.36,1),visibility 0s}#stx-shared-tooltip.is-instant{transition:none!important}#stx-shared-tooltip .stx-shared-tooltip-body{max-width:min(78vw,360px);min-width:72px;padding:8px 10px;border:1px solid var(--ss-theme-border, rgba(197, 160, 89, .55));border-radius:8px;background:var(--ss-theme-panel-bg, rgba(23, 21, 24, .96));backdrop-filter:var(--ss-theme-backdrop-filter, blur(3px));color:var(--ss-theme-text, #ecdcb8);font-size:12px;line-height:1.55;text-align:left;white-space:pre-wrap;box-shadow:var(--ss-theme-shadow, 0 8px 20px rgba(0, 0, 0, .45))}#stx-shared-tooltip[data-stx-tooltip-scope=rollhelper-card] .stx-shared-tooltip-body{border-color:var(--ss-theme-roll-tooltip-border, var(--ss-theme-border, rgba(197, 160, 89, .55)));background:var(--ss-theme-roll-tooltip-bg, var(--ss-theme-panel-bg, rgba(23, 21, 24, .96)));color:var(--ss-theme-roll-tooltip-text, var(--ss-theme-text, #ecdcb8));box-shadow:var(--ss-theme-roll-tooltip-shadow, var(--ss-theme-shadow, 0 8px 20px rgba(0, 0, 0, .45)))}html body [data-tip]:before,html body [data-tip]:after,html body [data-tip]:hover:before,html body [data-tip]:hover:after,html body [data-tip]:focus:before,html body [data-tip]:focus:after,html body [data-tip]:focus-visible:before,html body [data-tip]:focus-visible:after{content:none!important;display:none!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important}@media (prefers-reduced-motion: reduce){#stx-shared-tooltip{transition:none}}[data-tip]{pointer-events:auto!important;cursor:help!important}" && (e.textContent = ed), co(e);
    return;
  }
  const t = document.createElement("style");
  t.id = td, t.textContent = ed, co(t), document.head.appendChild(t);
}
function n0() {
  return document.body;
}
function ss(e) {
  r0();
  const t = n0();
  let r = document.getElementById(rd);
  r ? r.parentElement !== t && t.appendChild(r) : (r = document.createElement("div"), r.id = rd, t.appendChild(r)), r.style.setProperty("z-index", String(Wb), "important"), co(r);
  let n = r.querySelector(".stx-shared-tooltip-body");
  return n || (n = document.createElement("div"), n.className = "stx-shared-tooltip-body", r.appendChild(n)), co(n), e.runtime = {
    root: r,
    body: n
  }, e.runtime;
}
function s0(e) {
  return e.closest('[data-ui="shared-checkbox"]');
}
function o0(e) {
  return e.closest('[data-ui="shared-select"]');
}
function a0(e) {
  return e.matches('[data-ui="shared-input"]') ? e : e.closest('[data-ui="shared-input"]');
}
function i0(e) {
  return e.matches('[data-ui="shared-button"]') ? e : e.closest('[data-ui="shared-button"]');
}
function Rl(e) {
  const t = s0(e);
  if (t) return t.querySelector('[data-tooltip-anchor="shared-checkbox-control"]') || t;
  const r = o0(e);
  if (r) return r.querySelector('[data-tooltip-anchor="shared-select-trigger"]') || r.querySelector(".stx-shared-select-trigger") || r;
  const n = a0(e);
  if (n) return n;
  const o = i0(e);
  return o || e;
}
function Vr(e) {
  const t = e instanceof HTMLElement || e instanceof Element ? e : e instanceof Node ? e.parentElement : null;
  if (!t) return null;
  const r = t.closest("[data-tip]");
  if (!r) return null;
  const n = String(r.dataset.tip ?? "").trim();
  if (!n) return null;
  const o = Rl(r);
  return String(o.dataset.tip ?? "").trim() || (o.dataset.tip = n), o;
}
function sd(e, t, r) {
  return e < t ? t : e > r ? r : e;
}
function ii(e) {
  if (!e.activeTarget) return;
  const t = ss(e), r = Rl(e.activeTarget).getBoundingClientRect(), n = r.left + r.width / 2, o = r.top - 8;
  t.root.classList.add("is-visible");
  const i = Math.max(80, t.root.offsetWidth), c = Math.max(32, t.root.offsetHeight), u = 8, h = sd(n - i / 2, u, window.innerWidth - i - u);
  let f = o - c;
  f < u && (f = sd(r.bottom + 10, u, window.innerHeight - c - u)), t.root.style.transform = `translate3d(${Math.round(h)}px, ${Math.round(f)}px, 0)`;
}
function uo(e) {
  e.positionFrame === null && (e.positionFrame = requestAnimationFrame(() => {
    e.positionFrame = null, e.activeTarget && ii(e);
  }));
}
function rh(e) {
  e.hideCleanupTimer !== null && (clearTimeout(e.hideCleanupTimer), e.hideCleanupTimer = null);
}
function nh(e) {
  e.body.style.width = "", e.body.style.maxWidth = "";
}
function l0(e) {
  return e && e.closest(".st-rh-card-scope") ? "rollhelper-card" : "";
}
function c0(e) {
  rh(e);
  const t = ss(e);
  e.hideCleanupTimer = window.setTimeout(() => {
    e.hideCleanupTimer = null, !e.activeTarget && (t.root.removeAttribute("data-stx-tooltip-scope"), nh(t));
  }, Jb);
}
function sh(e) {
  e.hideTimer !== null && (clearTimeout(e.hideTimer), e.hideTimer = null);
  const t = ss(e), r = Math.ceil(t.body.getBoundingClientRect().width);
  r > 0 && (t.body.style.width = `${r}px`, t.body.style.maxWidth = `${r}px`), t.root.classList.remove("is-visible"), e.activeTarget = null, e.positionFrame !== null && (cancelAnimationFrame(e.positionFrame), e.positionFrame = null), c0(e);
}
function od(e) {
  e.hideTimer !== null && (clearTimeout(e.hideTimer), e.hideTimer = null), e.hideTimer = window.setTimeout(() => {
    e.hideTimer = null, sh(e);
  }, Xb);
}
function d0(e) {
  e.themeRefreshFrame !== null && cancelAnimationFrame(e.themeRefreshFrame), e.themeRefreshFrame = requestAnimationFrame(() => {
    e.themeRefreshFrame = null, !(!e.runtime || !e.activeTarget?.isConnected) && (To(e.runtime.root), uo(e));
  });
}
function ad(e, t) {
  const r = String(e.dataset.tip ?? "").trim();
  if (!r) {
    sh(t);
    return;
  }
  t.hideTimer !== null && (clearTimeout(t.hideTimer), t.hideTimer = null);
  const n = ss(t);
  if (rh(t), nh(n), To(n.root), t.activeTarget === e && n.body.textContent === r && n.root.classList.contains("is-visible")) {
    uo(t);
    return;
  }
  const o = Rl(e).getBoundingClientRect(), i = o.left + o.width / 2, c = o.top + o.height / 2, u = n.root.classList.contains("is-visible"), h = t.lastCenterX !== null && t.lastCenterY !== null ? Math.hypot(i - t.lastCenterX, c - t.lastCenterY) : 0, f = !u || h >= Qb;
  t.activeTarget = e;
  const v = l0(e);
  v ? n.root.setAttribute("data-stx-tooltip-scope", v) : n.root.removeAttribute("data-stx-tooltip-scope"), e.getAttribute("data-tip-html") === "true" ? n.body.innerHTML = r : n.body.textContent = r, f ? (n.root.classList.add("is-instant"), ii(t), requestAnimationFrame(() => n.root.classList.remove("is-instant"))) : ii(t), t.lastCenterX = i, t.lastCenterY = c;
}
function Yr(e, t, r, n, o) {
  const i = o ?? !1;
  t.addEventListener(r, n, i), e.unbindHandlers.push(() => t.removeEventListener(r, n, i));
}
function u0(e) {
  Yr(e, window, "pointerover", (t) => {
    const r = Vr(t.target);
    r && ad(r, e);
  }, !0), Yr(e, window, "pointerout", (t) => {
    const r = Vr(t.target);
    r && (Vr(t.relatedTarget ?? null) || e.activeTarget === r && od(e));
  }, !0), Yr(e, window, "focusin", (t) => {
    const r = Vr(t.target);
    r && ad(r, e);
  }, !0), Yr(e, window, "focusout", (t) => {
    const r = Vr(t.target);
    r && (Vr(t.relatedTarget ?? null) || e.activeTarget === r && od(e));
  }, !0), Yr(e, window, "scroll", () => {
    e.activeTarget && uo(e);
  }, !0), Yr(e, window, "resize", () => {
    e.activeTarget && uo(e);
  }), e.unbindHandlers.push(Ai(() => {
    e.runtime && e.activeTarget && d0(e);
  }));
}
function oh() {
  const e = t0();
  ss(e), !e.bound && (u0(e), e.bound = !0);
}
var id = !1, Da = /* @__PURE__ */ new WeakMap();
function m0(e, t) {
  if (t === void 0) {
    console.info(`[SS-Helper][RollHelperThemeUI] ${e}`);
    return;
  }
  console.info(`[SS-Helper][RollHelperThemeUI] ${e}`, t);
}
function Fs(e, t) {
  if (!(e instanceof HTMLElement)) return;
  const r = Jn(t) === "host";
  e.querySelectorAll("input.st-roll-input, input.st-roll-search, select.st-roll-select, textarea.st-roll-textarea").forEach((n) => {
    n.classList.toggle("text_pole", r);
  }), e.querySelectorAll("button.st-roll-btn, button.st-roll-tab").forEach((n) => {
    n.classList.toggle("menu_button", r), n.classList.contains("st-roll-tab") ? n.classList.toggle("active", r && n.classList.contains("is-active")) : r || n.classList.remove("active");
  });
}
function xt(e) {
  if (!(e instanceof HTMLElement)) return;
  const t = e.closest("[id][data-ss-theme]");
  t && Fs(t, t.getAttribute("data-ss-theme") || "default");
}
function Na(e) {
  e instanceof HTMLElement && e.isConnected && To(e);
}
function La(e, t) {
  if (!(e instanceof HTMLElement)) return !1;
  const r = e.getAttribute("data-ss-theme");
  return r === null ? !1 : r !== t;
}
function h0(e) {
  if (!e.isConnected) return;
  const t = e.parentNode;
  if (!t) return;
  const r = e.nextSibling;
  t.removeChild(e), r && r.parentNode === t ? t.insertBefore(e, r) : t.appendChild(e);
}
function Ma(e) {
  if (!(e instanceof HTMLElement) || !e.isConnected) return;
  const t = Da.get(e);
  t && window.cancelAnimationFrame(t);
  const r = window.requestAnimationFrame(() => {
    Da.delete(e), h0(e), Di(e);
  });
  Da.set(e, r);
}
function Cl(e) {
  const t = Jn(e.selection), r = e.settingsRoot?.querySelector(".st-roll-shell") ?? null, n = e.settingsRoot?.querySelector(".st-roll-content") ?? null, o = e.skillModal?.querySelector(".st-roll-skill-modal-panel") ?? e.skillModal ?? null, i = e.statusModal?.querySelector(".st-roll-status-modal-panel") ?? e.statusModal ?? null, c = La(n, t), u = La(o, t), h = La(i, t);
  e.themeInput && (e.themeInput.value = e.themeInputValue ?? t), e.settingsRoot instanceof HTMLElement && Rc(e.settingsRoot), r instanceof HTMLElement && Rc(r), n && Na(n), e.skillModal && Na(e.skillModal), e.statusModal && Na(e.statusModal), Fs(n ?? e.settingsRoot, t), Fs(e.skillModal, t), Fs(e.statusModal, t), e.syncSharedSelectsEvent !== !1 && Di(n ?? e.settingsRoot ?? document), c && Ma(n), u && Ma(o), h && Ma(i), m0("applySettingsThemeSelectionEvent", {
    selection: t,
    settingsRoot: e.settingsRoot ? { ssTheme: e.settingsRoot.getAttribute("data-ss-theme") } : null,
    content: n ? { ssTheme: n.getAttribute("data-ss-theme") } : null,
    skillModal: e.skillModal ? { ssTheme: e.skillModal.getAttribute("data-ss-theme") } : null,
    statusModal: e.statusModal ? { ssTheme: e.statusModal.getAttribute("data-ss-theme") } : null
  });
}
function p0(e, t, r) {
  id || (id = !0, Ai(() => {
    const n = document.getElementById(e), o = n?.querySelector('select.stx-shared-select-native[id$="-theme"]') ?? null, { themeId: i } = Ii(), c = Sl(i);
    Cl({
      settingsRoot: n,
      themeInput: o,
      skillModal: document.getElementById(t),
      statusModal: document.getElementById(r),
      selection: i,
      themeInputValue: c
    });
  }));
}
function _r(e) {
  oh();
}
function ld(e) {
  _r(), ru(e.root), p0(e.SETTINGS_CARD_ID_Event, e.SETTINGS_SKILL_MODAL_ID_Event, e.SETTINGS_STATUS_MODAL_ID_Event), e.syncSettingsBadgeVersionEvent();
}
function f0(e) {
  const t = document.getElementById(e.SETTINGS_BADGE_ID_Event);
  t && (t.textContent = e.SETTINGS_BADGE_VERSION_Event);
}
function g0(e) {
  if (document.getElementById(e.SETTINGS_STYLE_ID_Event)) return;
  const t = document.createElement("style");
  t.id = e.SETTINGS_STYLE_ID_Event, t.textContent = e.buildSettingsCardStylesTemplateEvent(e.SETTINGS_CARD_ID_Event), document.head.appendChild(t);
}
function v0(e) {
  const t = Rg(Yb, { emptyText: "暂无更新记录" });
  return {
    cardId: e.SETTINGS_CARD_ID_Event,
    drawerToggleId: e.drawerToggleId,
    drawerContentId: e.drawerContentId,
    drawerIconId: e.drawerIconId,
    displayName: e.SETTINGS_DISPLAY_NAME_Event,
    badgeId: e.SETTINGS_BADGE_ID_Event,
    badgeText: e.SETTINGS_BADGE_VERSION_Event,
    authorText: e.SETTINGS_AUTHOR_TEXT_Event,
    emailText: e.SETTINGS_EMAIL_TEXT_Event,
    qqGroupText: "862731343",
    githubText: e.SETTINGS_GITHUB_TEXT_Event,
    githubUrl: e.SETTINGS_GITHUB_URL_Event,
    changelogHtml: t,
    searchId: e.SETTINGS_SEARCH_ID_Event,
    tabMainId: e.SETTINGS_TAB_MAIN_ID_Event,
    tabAiId: e.SETTINGS_TAB_AI_ID_Event,
    tabSkillId: e.SETTINGS_TAB_SKILL_ID_Event,
    tabRuleId: e.SETTINGS_TAB_RULE_ID_Event,
    tabAboutId: e.SETTINGS_TAB_ABOUT_ID_Event,
    panelMainId: e.SETTINGS_PANEL_MAIN_ID_Event,
    panelAiId: e.SETTINGS_PANEL_AI_ID_Event,
    panelSkillId: e.SETTINGS_PANEL_SKILL_ID_Event,
    panelRuleId: e.SETTINGS_PANEL_RULE_ID_Event,
    panelAboutId: e.SETTINGS_PANEL_ABOUT_ID_Event,
    enabledId: e.SETTINGS_ENABLED_ID_Event,
    ruleId: e.SETTINGS_RULE_ID_Event,
    aiRollModeId: e.SETTINGS_AI_ROLL_MODE_ID_Event,
    aiRoundControlId: e.SETTINGS_AI_ROUND_CONTROL_ID_Event,
    explodingEnabledId: e.SETTINGS_EXPLODING_ENABLED_ID_Event,
    advantageEnabledId: e.SETTINGS_ADVANTAGE_ENABLED_ID_Event,
    dynamicResultGuidanceId: e.SETTINGS_DYNAMIC_RESULT_GUIDANCE_ID_Event,
    dynamicDcReasonId: e.SETTINGS_DYNAMIC_DC_REASON_ID_Event,
    statusSystemEnabledId: e.SETTINGS_STATUS_SYSTEM_ENABLED_ID_Event,
    statusEditorOpenId: e.SETTINGS_STATUS_EDITOR_OPEN_ID_Event,
    statusModalId: e.SETTINGS_STATUS_MODAL_ID_Event,
    statusModalCloseId: e.SETTINGS_STATUS_MODAL_CLOSE_ID_Event,
    statusRefreshId: e.SETTINGS_STATUS_REFRESH_ID_Event,
    statusCleanUnusedId: e.SETTINGS_STATUS_CLEAN_UNUSED_ID_Event,
    statusRowsId: e.SETTINGS_STATUS_ROWS_ID_Event,
    statusAddId: e.SETTINGS_STATUS_ADD_ID_Event,
    statusSaveId: e.SETTINGS_STATUS_SAVE_ID_Event,
    statusResetId: e.SETTINGS_STATUS_RESET_ID_Event,
    statusErrorsId: e.SETTINGS_STATUS_ERRORS_ID_Event,
    statusDirtyHintId: e.SETTINGS_STATUS_DIRTY_HINT_ID_Event,
    statusLayoutId: e.SETTINGS_STATUS_LAYOUT_ID_Event,
    statusSidebarId: e.SETTINGS_STATUS_SIDEBAR_ID_Event,
    statusSplitterId: e.SETTINGS_STATUS_SPLITTER_ID_Event,
    statusChatListId: e.SETTINGS_STATUS_CHAT_LIST_ID_Event,
    statusChatMetaId: e.SETTINGS_STATUS_CHAT_META_ID_Event,
    statusColsId: e.SETTINGS_STATUS_COLS_ID_Event,
    statusMemoryStateId: e.SETTINGS_STATUS_MEMORY_STATE_ID_Event,
    allowedDiceSidesId: e.SETTINGS_ALLOWED_DICE_SIDES_ID_Event,
    themeId: e.SETTINGS_THEME_ID_Event,
    summaryDetailId: e.SETTINGS_SUMMARY_DETAIL_ID_Event,
    summaryRoundsId: e.SETTINGS_SUMMARY_ROUNDS_ID_Event,
    scopeId: e.SETTINGS_SCOPE_ID_Event,
    outcomeBranchesId: e.SETTINGS_OUTCOME_BRANCHES_ID_Event,
    explodeOutcomeId: e.SETTINGS_EXPLODE_OUTCOME_ID_Event,
    includeOutcomeSummaryId: e.SETTINGS_SUMMARY_OUTCOME_ID_Event,
    listOutcomePreviewId: e.SETTINGS_LIST_OUTCOME_PREVIEW_ID_Event,
    timeLimitEnabledId: e.SETTINGS_TIME_LIMIT_ENABLED_ID_Event,
    timeLimitMinId: e.SETTINGS_TIME_LIMIT_MIN_ID_Event,
    timeLimitRowId: e.SETTINGS_TIME_LIMIT_ROW_ID_Event,
    skillEnabledId: e.SETTINGS_SKILL_ENABLED_ID_Event,
    skillEditorWrapId: e.SETTINGS_SKILL_EDITOR_WRAP_ID_Event,
    skillColsId: e.SETTINGS_SKILL_COLS_ID_Event,
    skillRowsId: e.SETTINGS_SKILL_ROWS_ID_Event,
    skillAddId: e.SETTINGS_SKILL_ADD_ID_Event,
    skillTextId: e.SETTINGS_SKILL_TEXT_ID_Event,
    skillImportToggleId: e.SETTINGS_SKILL_IMPORT_TOGGLE_ID_Event,
    skillImportAreaId: e.SETTINGS_SKILL_IMPORT_AREA_ID_Event,
    skillImportApplyId: e.SETTINGS_SKILL_IMPORT_APPLY_ID_Event,
    skillExportId: e.SETTINGS_SKILL_EXPORT_ID_Event,
    skillSaveId: e.SETTINGS_SKILL_SAVE_ID_Event,
    skillResetId: e.SETTINGS_SKILL_RESET_ID_Event,
    skillErrorsId: e.SETTINGS_SKILL_ERRORS_ID_Event,
    skillDirtyHintId: e.SETTINGS_SKILL_DIRTY_HINT_ID_Event,
    skillPresetLayoutId: e.SETTINGS_SKILL_PRESET_LAYOUT_ID_Event,
    skillPresetSidebarId: e.SETTINGS_SKILL_PRESET_SIDEBAR_ID_Event,
    skillPresetListId: e.SETTINGS_SKILL_PRESET_LIST_ID_Event,
    skillPresetCreateId: e.SETTINGS_SKILL_PRESET_CREATE_ID_Event,
    skillPresetDeleteId: e.SETTINGS_SKILL_PRESET_DELETE_ID_Event,
    skillPresetRestoreDefaultId: e.SETTINGS_SKILL_PRESET_RESTORE_DEFAULT_ID_Event,
    skillPresetNameId: e.SETTINGS_SKILL_PRESET_NAME_ID_Event,
    skillPresetRenameId: e.SETTINGS_SKILL_PRESET_RENAME_ID_Event,
    skillPresetMetaId: e.SETTINGS_SKILL_PRESET_META_ID_Event,
    skillEditorOpenId: e.SETTINGS_SKILL_EDITOR_OPEN_ID_Event,
    skillModalId: e.SETTINGS_SKILL_MODAL_ID_Event,
    skillModalCloseId: e.SETTINGS_SKILL_MODAL_CLOSE_ID_Event,
    ruleSaveId: e.SETTINGS_RULE_SAVE_ID_Event,
    ruleResetId: e.SETTINGS_RULE_RESET_ID_Event,
    ruleTextId: e.SETTINGS_RULE_TEXT_ID_Event,
    aiBridgeStatusLightId: e.SETTINGS_AI_BRIDGE_STATUS_LIGHT_ID_Event,
    aiBridgeStatusTextId: e.SETTINGS_AI_BRIDGE_STATUS_TEXT_ID_Event,
    aiBridgeRefreshId: e.SETTINGS_AI_BRIDGE_REFRESH_ID_Event
  };
}
function ah(e, t = 0) {
  const r = Number.isFinite(e.retryLimitEvent) ? Number(e.retryLimitEvent) : 60, n = Number.isFinite(e.retryDelayMsEvent) ? Number(e.retryDelayMsEvent) : 500, o = `${e.SETTINGS_CARD_ID_Event}-toggle`, i = `${e.SETTINGS_CARD_ID_Event}-content`, c = `${e.SETTINGS_CARD_ID_Event}-icon`, u = e.buildSettingsCardTemplateIdsEvent(o, i, c), h = document.getElementById(e.SETTINGS_CARD_ID_Event);
  if (h) {
    Mc(h), ld({
      root: h,
      SETTINGS_CARD_ID_Event: e.SETTINGS_CARD_ID_Event,
      SETTINGS_SKILL_MODAL_ID_Event: e.SETTINGS_SKILL_MODAL_ID_Event,
      SETTINGS_STATUS_MODAL_ID_Event: e.SETTINGS_STATUS_MODAL_ID_Event,
      syncSettingsBadgeVersionEvent: e.syncSettingsBadgeVersionEvent
    }), e.onMountedEvent({
      drawerToggleId: o,
      drawerContentId: i
    }), e.syncSettingsUiEvent();
    return;
  }
  const f = document.getElementById("extensions_settings");
  if (!f) {
    t < r && setTimeout(() => ah(e, t + 1), n);
    return;
  }
  e.ensureSettingsCardStylesEvent();
  const v = document.createElement("div");
  v.id = e.SETTINGS_CARD_ID_Event, v.innerHTML = e.buildSettingsCardHtmlTemplateEvent(u), Mc(v);
  const x = v.querySelector(`#${e.SETTINGS_SKILL_MODAL_ID_Event}`);
  x && v.appendChild(x);
  const y = v.querySelector(`#${e.SETTINGS_STATUS_MODAL_ID_Event}`);
  y && v.appendChild(y);
  let S = document.getElementById("ss-helper-plugins-container");
  S || (S = document.createElement("div"), S.id = "ss-helper-plugins-container", f.prepend(S)), S.appendChild(v), ld({
    root: v,
    SETTINGS_CARD_ID_Event: e.SETTINGS_CARD_ID_Event,
    SETTINGS_SKILL_MODAL_ID_Event: e.SETTINGS_SKILL_MODAL_ID_Event,
    SETTINGS_STATUS_MODAL_ID_Event: e.SETTINGS_STATUS_MODAL_ID_Event,
    syncSettingsBadgeVersionEvent: e.syncSettingsBadgeVersionEvent
  }), e.onMountedEvent({
    drawerToggleId: o,
    drawerContentId: i
  }), e.syncSettingsUiEvent();
}
var ih = "", li = "recent", lh = "", ci = "manual", nt = /* @__PURE__ */ new Set(), cd = !1, Oa = null, ch = "st_roll_skill_editor_layout_v1", Vs = {
  name: 180,
  modifier: 72,
  actions: 120
}, Un = {
  name: "--st-roll-skill-col-name",
  modifier: "--st-roll-skill-col-modifier",
  actions: "--st-roll-skill-col-actions"
};
function dh(e, t, r) {
  return Math.min(r, Math.max(t, e));
}
function uh() {
  const e = bl(At, ch, null);
  return !e || typeof e != "object" ? {} : e;
}
function b0(e) {
  xl(At, ch, e);
}
function mh(e) {
  return document.getElementById(e)?.closest(".st-roll-skill-modal-panel");
}
function x0(e, t) {
  const r = e.closest(".st-roll-skill-modal-panel");
  return r || mh(t);
}
function y0(e) {
  const t = mh(e);
  if (!t) return;
  const r = uh().columns ?? {};
  Object.keys(Un).forEach((n) => {
    const o = Number(r[n]);
    if (!Number.isFinite(o)) return;
    const i = dh(o, Vs[n], 640);
    t.style.setProperty(Un[n], `${i}px`);
  });
}
function S0(e, t) {
  if (e.dataset.skillColsResizeBound === "1") return;
  e.dataset.skillColsResizeBound = "1";
  let r = null, n = null, o = null, i = null, c = 0, u = 0, h = !1;
  const f = (C) => {
    if (!h || !r || !o) return;
    const G = dh(u + (C - c), Vs[o], 640);
    r.style.setProperty(Un[o], `${G}px`);
  }, v = () => {
    if (!r || !o) return;
    const C = Number.parseFloat(getComputedStyle(r).getPropertyValue(Un[o]));
    if (!Number.isFinite(C)) return;
    const G = uh();
    b0({
      ...G,
      columns: {
        ...G.columns ?? {},
        [o]: C
      }
    });
  }, x = (C) => {
    if (h) {
      if (C && v(), h = !1, n?.classList.remove("is-resizing"), window.removeEventListener("pointermove", S), window.removeEventListener("pointerup", _), window.removeEventListener("pointercancel", P), window.removeEventListener("mousemove", L), window.removeEventListener("mouseup", M), n && i != null) try {
        n.hasPointerCapture(i) && n.releasePointerCapture(i);
      } catch {
      }
      r = null, n = null, o = null, i = null;
    }
  }, y = (C, G, F, Z) => {
    const H = x0(e, t);
    if (!H) return;
    r = H, n = C, o = G, i = Z;
    const X = e.querySelector(`[data-skill-col-key="${G}"]`);
    if (c = F, u = Math.max(Vs[G], Math.round(X?.getBoundingClientRect().width ?? Vs[G])), h = !0, C.style.touchAction = "none", C.classList.add("is-resizing"), window.addEventListener("pointermove", S), window.addEventListener("pointerup", _), window.addEventListener("pointercancel", P), window.addEventListener("mousemove", L), window.addEventListener("mouseup", M), Z != null) try {
      C.setPointerCapture(Z);
    } catch {
    }
  }, S = (C) => {
    h && (i != null && C.pointerId !== i || f(C.clientX));
  }, _ = (C) => {
    h && (i != null && C.pointerId !== i || x(!0));
  }, P = (C) => {
    h && (i != null && C.pointerId !== i || x(!1));
  }, L = (C) => {
    !h || i != null || f(C.clientX);
  }, M = () => {
    !h || i != null || x(!0);
  }, B = (C) => {
    const G = C?.closest("[data-skill-col-resize-key]");
    if (!G) return null;
    const F = String(G.dataset.skillColResizeKey ?? "");
    return !F || !Un[F] ? null : {
      handle: G,
      key: F
    };
  };
  e.addEventListener("pointerdown", (C) => {
    if (C.pointerType === "mouse" && C.button !== 0) return;
    const G = B(C.target);
    G && (C.preventDefault(), C.stopPropagation(), h && x(!1), y(G.handle, G.key, C.clientX, C.pointerId));
  }), e.addEventListener("mousedown", (C) => {
    if (C.button !== 0 || h) return;
    const G = B(C.target);
    G && (C.preventDefault(), C.stopPropagation(), y(G.handle, G.key, C.clientX, null));
  });
}
function E0(e) {
  const t = e.querySelector('[data-st-roll-role="preset-name-track"]'), r = e.querySelector('[data-st-roll-role="preset-name-segment"]');
  return !t || !r ? null : {
    track: t,
    segment: r
  };
}
function _0(e) {
  const t = E0(e);
  if (!t) return !1;
  const { track: r, segment: n } = t, o = Math.ceil(e.clientWidth || e.getBoundingClientRect().width || 0), i = Math.ceil(n.scrollWidth || n.getBoundingClientRect().width || 0);
  if (o <= 0 || i <= 0) return !1;
  r.style.removeProperty("--st-roll-preset-marquee-distance"), r.style.removeProperty("--st-roll-preset-marquee-duration"), e.classList.remove("is-overflowing");
  const c = i - o;
  return c <= 2 || (e.classList.add("is-overflowing"), r.style.setProperty("--st-roll-preset-marquee-distance", `-${c}px`), r.style.setProperty("--st-roll-preset-marquee-duration", `${Math.max(6, Math.min(18, c / 18 + 4))}s`)), !0;
}
function mo(e = document) {
  const t = [];
  e instanceof HTMLElement && e.matches('[data-st-roll-role="preset-name-marquee"]') && t.push(e), e.querySelectorAll?.('[data-st-roll-role="preset-name-marquee"]').forEach((r) => {
    r instanceof HTMLElement && t.push(r);
  }), t.length !== 0 && t.forEach((r) => {
    _0(r);
  });
}
function T0() {
  cd || (cd = !0, window.addEventListener("resize", () => {
    window.requestAnimationFrame(() => {
      mo(document);
    });
  }));
}
function k0(e) {
  !(e instanceof HTMLElement) || typeof ResizeObserver > "u" || (Oa || (Oa = new ResizeObserver((t) => {
    t.forEach((r) => {
      r.target instanceof HTMLElement && mo(r.target);
    });
  })), Oa.observe(e));
}
function w0(e) {
  const t = document.getElementById(e.SETTINGS_SKILL_PRESET_LIST_ID_Event), r = document.getElementById(e.SETTINGS_SKILL_PRESET_CREATE_ID_Event), n = document.getElementById(e.SETTINGS_SKILL_PRESET_DELETE_ID_Event), o = document.getElementById(e.SETTINGS_SKILL_PRESET_RESTORE_DEFAULT_ID_Event), i = document.getElementById(e.SETTINGS_SKILL_PRESET_NAME_ID_Event), c = document.getElementById(e.SETTINGS_SKILL_PRESET_RENAME_ID_Event);
  t?.addEventListener("click", (h) => {
    const f = h.target?.closest("button[data-skill-preset-id]");
    if (!f) return;
    const v = String(f.dataset.skillPresetId ?? "");
    if (!v || v === e.getSkillEditorActivePresetIdEvent() || !e.confirmDiscardSkillDraftEvent()) return;
    const x = e.getSettingsEvent(), y = e.getSkillPresetStoreEvent(x), S = e.getSkillPresetByIdEvent(y, v);
    S && (y.activePresetId = S.id, e.saveSkillPresetStoreEvent(y));
  }), r?.addEventListener("click", () => {
    if (!e.confirmDiscardSkillDraftEvent()) return;
    const h = e.getSettingsEvent(), f = e.getSkillPresetStoreEvent(h), v = e.getActiveSkillPresetEvent(f), x = Date.now(), y = e.getUniqueSkillPresetNameEvent(f, e.SKILL_PRESET_NEW_NAME_BASE_Event), S = {
      id: e.createIdEvent("skill_preset"),
      name: y,
      locked: !1,
      skillTableText: v.skillTableText,
      createdAt: x,
      updatedAt: x
    };
    f.presets.push(S), f.activePresetId = S.id, e.saveSkillPresetStoreEvent(f);
  }), n?.addEventListener("click", () => {
    const h = e.getSettingsEvent(), f = e.getSkillPresetStoreEvent(h), v = e.getActiveSkillPresetEvent(f);
    if (v.locked) {
      e.appendToConsoleEvent("⚠️ 默认预设不可删除。", "warn");
      return;
    }
    if (!e.confirmDiscardSkillDraftEvent() || !window.confirm(`确认删除预设「${v.name}」吗？`)) return;
    f.presets = f.presets.filter((y) => y.id !== v.id);
    const x = e.getSkillPresetByIdEvent(f, e.SKILL_PRESET_DEFAULT_ID_Event) ?? f.presets[0] ?? null;
    x ? f.activePresetId = x.id : (f.presets = e.buildDefaultSkillPresetStoreEvent().presets, f.activePresetId = e.SKILL_PRESET_DEFAULT_ID_Event), e.saveSkillPresetStoreEvent(f);
  }), o?.addEventListener("click", () => {
    if (!e.confirmDiscardSkillDraftEvent() || !window.confirm("确认将默认预设恢复为内置技能表吗？这会覆盖默认预设当前内容。")) return;
    const h = e.getSettingsEvent(), f = e.getSkillPresetStoreEvent(h);
    let v = e.getSkillPresetByIdEvent(f, e.SKILL_PRESET_DEFAULT_ID_Event);
    if (!v) {
      const x = e.buildDefaultSkillPresetStoreEvent(), y = e.getSkillPresetByIdEvent(x, e.SKILL_PRESET_DEFAULT_ID_Event) ?? x.presets[0] ?? null;
      if (!y) return;
      f.presets.unshift(y), v = y;
    }
    v.locked = !0, v.skillTableText = e.DEFAULT_SKILL_PRESET_TABLE_TEXT_Event, v.updatedAt = Date.now(), e.saveSkillPresetStoreEvent(f), e.renderSkillValidationErrorsEvent([]), e.appendToConsoleEvent("技能编辑器：默认预设已恢复。");
  });
  const u = () => {
    const h = String(i?.value ?? "").trim();
    if (!h) {
      e.renderSkillValidationErrorsEvent(["预设名称不能为空。"]);
      return;
    }
    const f = e.getSettingsEvent(), v = e.getSkillPresetStoreEvent(f), x = e.getActiveSkillPresetEvent(v);
    if (v.presets.some((y) => y.id !== x.id && e.normalizeSkillPresetNameKeyEvent(y.name) === e.normalizeSkillPresetNameKeyEvent(h))) {
      e.renderSkillValidationErrorsEvent(["预设名称重复，请使用其他名称。"]);
      return;
    }
    x.name = h, x.updatedAt = Date.now(), e.saveSkillPresetStoreEvent(v), e.renderSkillValidationErrorsEvent([]);
  };
  c?.addEventListener("click", u), i?.addEventListener("keydown", (h) => {
    h.key === "Enter" && (h.preventDefault(), u());
  });
}
function I0(e) {
  return {
    getRows: e.getRowsEvent,
    setRows: e.setRowsEvent,
    getSnapshot: e.getSnapshotEvent,
    setSnapshot: e.setSnapshotEvent
  };
}
function A0(e) {
  const t = document.getElementById(e.SETTINGS_SKILL_COLS_ID_Event), r = document.getElementById(e.SETTINGS_SKILL_ROWS_ID_Event), n = document.getElementById(e.SETTINGS_SKILL_ADD_ID_Event), o = r?.closest(".st-roll-skill-modal"), i = o?.querySelector(".st-roll-skill-preset-search"), c = o?.querySelector(".st-roll-skill-preset-sort"), u = o?.querySelector(".st-roll-skill-row-search"), h = o?.querySelector(".st-roll-skill-row-sort"), f = o?.querySelector(".st-roll-skill-select-visible"), v = o?.querySelector(".st-roll-skill-clear-selection"), x = o?.querySelector(".st-roll-skill-batch-delete");
  y0(e.SETTINGS_SKILL_ROWS_ID_Event), t && S0(t, e.SETTINGS_SKILL_ROWS_ID_Event), r?.dataset.skillWorkbenchBound !== "1" && (r?.setAttribute("data-skill-workbench-bound", "1"), i?.addEventListener("input", () => {
    ih = String(i.value ?? ""), e.renderSkillRowsEvent();
  }), c?.addEventListener("change", () => {
    const y = String(c.value ?? "recent");
    li = y === "name" || y === "count" ? y : "recent", e.renderSkillRowsEvent();
  }), u?.addEventListener("input", () => {
    lh = String(u.value ?? ""), e.renderSkillRowsEvent();
  }), h?.addEventListener("change", () => {
    const y = String(h.value ?? "manual");
    ci = y === "name" || y === "modifier_desc" ? y : "manual", e.renderSkillRowsEvent();
  }), f?.addEventListener("click", () => {
    Dl(e.skillDraftAccessorEvent.getRows()).forEach((y) => {
      nt.add(String(y.rowId ?? ""));
    }), e.renderSkillRowsEvent();
  }), v?.addEventListener("click", () => {
    nt.clear(), e.renderSkillRowsEvent();
  }), x?.addEventListener("click", () => {
    if (nt.size <= 0) return;
    const y = e.skillDraftAccessorEvent.getRows().filter((S) => !nt.has(String(S.rowId ?? "")));
    nt.clear(), e.skillDraftAccessorEvent.setRows(y), e.renderSkillRowsEvent(), e.refreshSkillDraftDirtyStateEvent(), e.renderSkillValidationErrorsEvent([]);
  })), r?.addEventListener("input", (y) => {
    const S = y.target;
    if (!S) return;
    const _ = String(S.dataset.skillRowId ?? ""), P = String(S.dataset.skillField ?? "");
    if (!_ || !P) return;
    const L = e.skillDraftAccessorEvent.getRows().find((M) => M.rowId === _);
    L && (P === "name" ? L.skillName = S.value : P === "modifier" && (L.modifierText = S.value), e.refreshSkillDraftDirtyStateEvent(), e.renderSkillValidationErrorsEvent([]));
  }), r?.addEventListener("change", (y) => {
    const S = y.target;
    if (!S) return;
    const _ = String(S.dataset.skillSelectId ?? "");
    _ && (S.checked ? nt.add(_) : nt.delete(_), ph(e.skillDraftAccessorEvent.getRows()));
  }), r?.addEventListener("click", (y) => {
    const S = y.target, _ = S?.closest("button[data-skill-duplicate-id]");
    if (_) {
      const C = String(_.dataset.skillDuplicateId ?? ""), G = e.skillDraftAccessorEvent.getRows(), F = G.findIndex((X) => X.rowId === C);
      if (F < 0) return;
      const Z = G[F], H = [...G];
      H.splice(F + 1, 0, e.createSkillEditorRowDraftEvent(String(Z.skillName ?? ""), String(Z.modifierText ?? ""))), e.skillDraftAccessorEvent.setRows(H), e.renderSkillRowsEvent(), e.refreshSkillDraftDirtyStateEvent(), e.renderSkillValidationErrorsEvent([]);
      return;
    }
    const P = S?.closest("button[data-skill-move-id]");
    if (P) {
      const C = String(P.dataset.skillMoveId ?? ""), G = String(P.dataset.skillMoveDirection ?? ""), F = [...e.skillDraftAccessorEvent.getRows()], Z = F.findIndex((K) => K.rowId === C);
      if (Z < 0) return;
      const H = G === "up" ? Z - 1 : Z + 1;
      if (H < 0 || H >= F.length) return;
      const [X] = F.splice(Z, 1);
      F.splice(H, 0, X), e.skillDraftAccessorEvent.setRows(F), e.renderSkillRowsEvent(), e.refreshSkillDraftDirtyStateEvent(), e.renderSkillValidationErrorsEvent([]);
      return;
    }
    const L = S?.closest("button[data-skill-remove-id]");
    if (!L) return;
    const M = String(L.dataset.skillRemoveId ?? "");
    if (!M) return;
    nt.delete(M);
    const B = e.skillDraftAccessorEvent.getRows().filter((C) => C.rowId !== M);
    e.skillDraftAccessorEvent.setRows(B), e.renderSkillRowsEvent(), e.refreshSkillDraftDirtyStateEvent(), e.renderSkillValidationErrorsEvent([]);
  }), n?.addEventListener("click", () => {
    const y = [...e.skillDraftAccessorEvent.getRows(), e.createSkillEditorRowDraftEvent("", "")];
    e.skillDraftAccessorEvent.setRows(y), e.renderSkillRowsEvent(), e.refreshSkillDraftDirtyStateEvent(), e.renderSkillValidationErrorsEvent([]);
  });
}
function $0(e) {
  const t = document.getElementById(e.SETTINGS_SKILL_IMPORT_TOGGLE_ID_Event), r = document.getElementById(e.SETTINGS_SKILL_IMPORT_AREA_ID_Event), n = document.getElementById(e.SETTINGS_SKILL_TEXT_ID_Event), o = document.getElementById(e.SETTINGS_SKILL_IMPORT_APPLY_ID_Event), i = document.getElementById(e.SETTINGS_SKILL_EXPORT_ID_Event), c = document.getElementById(e.SETTINGS_SKILL_SAVE_ID_Event), u = document.getElementById(e.SETTINGS_SKILL_RESET_ID_Event);
  t?.addEventListener("click", () => {
    if (!r) return;
    const h = r.hidden;
    r.hidden = !h, t.textContent = h ? "收起导入" : "导入 JSON", !(!h || !n) && (n.value = e.serializeSkillRowsToSkillTableTextEvent(e.skillDraftAccessorEvent.getRows()) ?? e.getActiveSkillPresetEvent(e.getSkillPresetStoreEvent(e.getSettingsEvent())).skillTableText);
  }), o?.addEventListener("click", () => {
    const h = String(n?.value ?? "");
    if (e.normalizeSkillTableTextForSettingsEvent(h) == null) {
      e.renderSkillValidationErrorsEvent(['导入失败：必须是 JSON 对象（例如 {"察觉":15,"说服":8}）。']);
      return;
    }
    const f = e.deserializeSkillTableTextToRowsEvent(h), v = e.validateSkillRowsEvent(f);
    if (v.errors.length > 0) {
      e.renderSkillValidationErrorsEvent(v.errors);
      return;
    }
    e.skillDraftAccessorEvent.setRows(f), e.renderSkillRowsEvent(), e.refreshSkillDraftDirtyStateEvent(), e.renderSkillValidationErrorsEvent([]);
  }), i?.addEventListener("click", () => {
    const h = e.validateSkillRowsEvent(e.skillDraftAccessorEvent.getRows()), f = e.getSettingsEvent(), v = e.getActiveSkillPresetEvent(e.getSkillPresetStoreEvent(f)), x = h.errors.length ? v.skillTableText : JSON.stringify(h.table, null, 2);
    h.errors.length > 0 ? e.renderSkillValidationErrorsEvent(["当前草稿有校验错误，已导出已保存的技能表。"]) : e.renderSkillValidationErrorsEvent([]), e.copyTextToClipboardEvent(x).then((y) => {
      if (y) {
        e.appendToConsoleEvent("✅ 技能表 JSON 已复制到剪贴板。");
        return;
      }
      r && (r.hidden = !1), t && (t.textContent = "收起导入"), n && (n.value = x), e.appendToConsoleEvent("⚠️ 剪贴板不可用，请在导入框中手动复制 JSON。", "warn");
    });
  }), c?.addEventListener("click", () => {
    const h = e.validateSkillRowsEvent(e.skillDraftAccessorEvent.getRows());
    if (h.errors.length > 0) {
      e.renderSkillValidationErrorsEvent(h.errors), e.appendToConsoleEvent("❌ 技能表保存失败，请先修正校验错误。", "error");
      return;
    }
    const f = JSON.stringify(h.table, null, 2), v = e.deserializeSkillTableTextToRowsEvent(f);
    e.skillDraftAccessorEvent.setRows(v), e.skillDraftAccessorEvent.setSnapshot(e.buildSkillDraftSnapshotEvent(v));
    const x = e.getSettingsEvent(), y = e.getSkillPresetStoreEvent(x), S = e.getActiveSkillPresetEvent(y);
    S.skillTableText = f, S.updatedAt = Date.now(), e.renderSkillRowsEvent(), e.setSkillDraftDirtyEvent(!1), e.renderSkillValidationErrorsEvent([]), e.saveSkillPresetStoreEvent(y), n && (n.value = f);
  }), u?.addEventListener("click", () => {
    e.skillDraftAccessorEvent.setRows([]), e.renderSkillRowsEvent(), e.refreshSkillDraftDirtyStateEvent(), e.renderSkillValidationErrorsEvent([]);
  });
}
function R0(e) {
  return e.isSkillDraftDirtyEvent() ? window.confirm("技能改动未保存，是否丢弃并继续？") ? (e.hydrateSkillDraftFromSettingsEvent(!0), !0) : !1 : !0;
}
function C0(e) {
  if (!e || e.hidden) return !1;
  const t = window.getComputedStyle(e);
  return t.display !== "none" && t.visibility !== "hidden";
}
function D0(e) {
  return !navigator.clipboard || typeof navigator.clipboard.writeText != "function" ? Promise.resolve(!1) : navigator.clipboard.writeText(e).then(() => !0).catch(() => !1);
}
function N0(e, t) {
  const r = document.getElementById(t.SETTINGS_SKILL_ERRORS_ID_Event);
  if (r) {
    if (!e.length) {
      r.hidden = !0, r.innerHTML = "";
      return;
    }
    r.hidden = !1, r.innerHTML = e.map((n) => `<div class="st-roll-skill-error-item">${t.escapeHtmlEvent(n)}</div>`).join("");
  }
}
function hh(e, t, r) {
  const n = String(ih ?? "").trim().toLowerCase(), o = String(e.activePresetId ?? ""), i = [...e.presets].filter((c) => n ? String(c.name ?? "").trim().toLowerCase().includes(n) : !0);
  return i.sort((c, u) => {
    if (li === "name") return String(c.name ?? "").localeCompare(String(u.name ?? ""), "zh-Hans-CN");
    if (li === "count") {
      const h = c.id === o && Number.isFinite(Number(r)) ? Number(r) : t(c.skillTableText), f = u.id === o && Number.isFinite(Number(r)) ? Number(r) : t(u.skillTableText);
      return h !== f ? f - h : String(c.name ?? "").localeCompare(String(u.name ?? ""), "zh-Hans-CN");
    }
    return Number(u.updatedAt ?? 0) - Number(c.updatedAt ?? 0);
  }), i;
}
function Dl(e) {
  const t = String(lh ?? "").trim().toLowerCase(), r = [...e].filter((n) => t ? String(n.skillName ?? "").trim().toLowerCase().includes(t) : !0);
  return ci === "name" ? r.sort((n, o) => String(n.skillName ?? "").localeCompare(String(o.skillName ?? ""), "zh-Hans-CN")) : ci === "modifier_desc" && r.sort((n, o) => {
    const i = Number(n.modifierText ?? 0) || 0, c = Number(o.modifierText ?? 0) || 0;
    return i !== c ? c - i : String(n.skillName ?? "").localeCompare(String(o.skillName ?? ""), "zh-Hans-CN");
  }), r;
}
function ph(e) {
  const t = document.querySelector(".st-roll-skill-modal");
  if (!t) return;
  const r = new Set(e.map((v) => String(v.rowId ?? "")));
  Array.from(nt).forEach((v) => {
    r.has(v) || nt.delete(v);
  });
  const n = Dl(e), o = n.filter((v) => nt.has(String(v.rowId ?? ""))).length, i = nt.size, c = t.querySelector(".st-roll-skill-selection-count");
  c && (c.textContent = o > 0 && o !== i ? `已选 ${i} 项（可见 ${o} 项）` : `已选 ${i} 项`);
  const u = t.querySelector(".st-roll-skill-batch-delete");
  u && (u.disabled = i <= 0);
  const h = t.querySelector(".st-roll-skill-clear-selection");
  h && (h.disabled = i <= 0);
  const f = t.querySelector(".st-roll-skill-select-visible");
  f && (f.disabled = n.length <= 0);
}
function L0(e, t) {
  const r = document.getElementById(t.SETTINGS_SKILL_PRESET_LIST_ID_Event);
  if (!r) return;
  if (!e.presets.length) {
    r.innerHTML = '<div class="st-roll-skill-preset-empty">暂无预设</div>', xt(r);
    return;
  }
  const n = hh(e, t.countSkillEntriesFromSkillTableTextEvent, t.activeDraftCountEvent);
  if (!n.length) {
    r.innerHTML = '<div class="st-roll-skill-preset-empty">没有匹配的预设</div>', xt(r);
    return;
  }
  r.innerHTML = n.map((o) => {
    const i = o.id === e.activePresetId, c = i && Number.isFinite(Number(t.activeDraftCountEvent)) ? Number(t.activeDraftCountEvent) : t.countSkillEntriesFromSkillTableTextEvent(o.skillTableText), u = t.escapeAttrEvent(o.id), h = t.escapeHtmlEvent(o.name);
    return `
        <button type="button" class="st-roll-skill-preset-item ${i ? "is-active" : ""}" data-skill-preset-id="${u}">
          <span class="st-roll-skill-preset-name-marquee" data-st-roll-role="preset-name-marquee">
            <span class="st-roll-skill-preset-name-track" data-st-roll-role="preset-name-track">
              <span class="st-roll-skill-preset-name" data-st-roll-role="preset-name-segment">${h}</span>
            </span>
          </span>
          <span class="st-roll-skill-preset-tags">
            <span class="st-roll-skill-preset-tag">${c}</span>
            ${i ? '<span class="st-roll-skill-preset-tag active">生效中</span>' : ""}
            ${o.locked ? '<span class="st-roll-skill-preset-tag locked">默认</span>' : ""}
          </span>
        </button>
      `;
  }).join(""), xt(r), T0(), k0(r), mo(r), window.requestAnimationFrame(() => {
    mo(r);
  });
}
function M0(e, t) {
  const r = t.getActiveSkillPresetEvent(e), n = document.getElementById(t.SETTINGS_SKILL_PRESET_META_ID_Event);
  if (n) {
    const c = Number.isFinite(Number(t.activeDraftCountEvent)) ? Number(t.activeDraftCountEvent) : t.countSkillEntriesFromSkillTableTextEvent(r.skillTableText), u = hh(e, t.countSkillEntriesFromSkillTableTextEvent, t.activeDraftCountEvent).length;
    n.textContent = `当前：${r.name} · 技能 ${c} 项 · 可见预设 ${u}/${e.presets.length}`;
  }
  const o = document.getElementById(t.SETTINGS_SKILL_PRESET_NAME_ID_Event);
  o && o.value !== r.name && (o.value = r.name);
  const i = document.getElementById(t.SETTINGS_SKILL_PRESET_DELETE_ID_Event);
  i && (i.disabled = r.locked, i.style.opacity = r.locked ? "0.5" : "1", r.locked ? i.dataset.tip = "默认预设不可删除" : i.removeAttribute("data-tip"));
}
function O0(e, t) {
  const r = document.getElementById(t.SETTINGS_SKILL_ROWS_ID_Event);
  if (!r) return;
  const n = Dl(e);
  if (ph(e), !e.length) {
    r.innerHTML = '<div class="st-roll-skill-empty">暂无技能，点击“新增技能”开始配置。</div>', xt(r), _r(r.closest(".st-roll-skill-modal") || r);
    return;
  }
  if (!n.length) {
    r.innerHTML = '<div class="st-roll-skill-empty">没有匹配的技能</div>', xt(r), _r(r.closest(".st-roll-skill-modal") || r);
    return;
  }
  r.innerHTML = n.map((o) => {
    const i = t.escapeAttrEvent(String(o.rowId ?? "")), c = t.escapeAttrEvent(String(o.skillName ?? "")), u = t.escapeAttrEvent(String(o.modifierText ?? ""));
    return `
      <div class="st-roll-skill-row" data-row-id="${i}">
        <div class="st-roll-skill-name-wrap">
          ${nu({
      id: `st-roll-skill-row-select-${i}`,
      containerClassName: "st-roll-skill-row-select",
      attributes: { "data-tip": "选择这条技能" },
      inputAttributes: {
        "data-skill-select-id": i,
        checked: nt.has(String(o.rowId ?? ""))
      }
    })}
          ${je({
      value: c,
      className: "st-roll-skill-name",
      attributes: {
        placeholder: "例如：察觉",
        "data-skill-row-id": i,
        "data-skill-field": "name",
        "data-tip": "技能名称。"
      }
    })}
        </div>
        ${je({
      value: u,
      type: "number",
      className: "st-roll-skill-modifier",
      attributes: {
        inputmode: "numeric",
        step: 1,
        placeholder: "例如：15",
        "data-skill-row-id": i,
        "data-skill-field": "modifier",
        "data-tip": "技能加值（整数）。"
      }
    })}
        <div class="st-roll-skill-actions-group">
          ${me({
      label: "复制",
      variant: "secondary",
      iconClassName: "fa-solid fa-copy",
      className: "st-roll-skill-duplicate st-roll-toolbar-icon-btn",
      attributes: {
        "data-skill-duplicate-id": i,
        "data-tip": "复制这条技能"
      }
    })}
          ${me({
      label: "上移",
      variant: "secondary",
      iconClassName: "fa-solid fa-arrow-up",
      className: "st-roll-skill-move-up st-roll-toolbar-icon-btn",
      attributes: {
        "data-skill-move-id": i,
        "data-skill-move-direction": "up",
        "data-tip": "上移这条技能"
      }
    })}
          ${me({
      label: "下移",
      variant: "secondary",
      iconClassName: "fa-solid fa-arrow-down",
      className: "st-roll-skill-move-down st-roll-toolbar-icon-btn",
      attributes: {
        "data-skill-move-id": i,
        "data-skill-move-direction": "down",
        "data-tip": "下移这条技能"
      }
    })}
          ${me({
      label: "删除",
      variant: "danger",
      iconClassName: "fa-solid fa-trash",
      className: "st-roll-skill-remove st-roll-toolbar-icon-btn",
      attributes: {
        "data-skill-remove-id": i,
        "data-tip": "删除这条技能"
      }
    })}
        </div>
      </div>
    `;
  }).join(""), xt(r), _r(r.closest(".st-roll-skill-modal") || r);
}
function qt(e) {
  return String(e ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/'/g, "&#39;");
}
function Ft(e) {
  return qt(e).replace(/\x60/g, "&#96;");
}
function mr(e, t, r = "") {
  return `
    <div class="${["st-roll-status-field", String(r ?? "").trim()].filter(Boolean).join(" ")}">
      <span class="st-roll-status-field-label">${qt(e)}</span>
      <div class="st-roll-status-field-content">${t}</div>
    </div>
  `;
}
function P0(e, t) {
  return Ut({
    id: "st-roll-status-scope-" + e,
    value: t === "all" ? "all" : "skills",
    containerClassName: "stx-shared-select-fluid",
    selectClassName: "st-roll-status-scope",
    triggerClassName: "stx-shared-select-trigger-36",
    selectAttributes: {
      "data-status-row-id": e,
      "data-status-field": "scope"
    },
    triggerAttributes: { "data-tip": "状态范围" },
    options: [{
      value: "skills",
      label: "按技能"
    }, {
      value: "all",
      label: "全局"
    }]
  });
}
var ve = [], Tr = "", Yn = !1, Ar = "", st = "", Pa = "", en = "记忆库：检测中", dd = !1, bt = "closed", Vt = !1, Jr = null, Ms = 0, Os = 0, Ps = 0, Bs = 0, kt = 0, ud = null, Ba = 0, md = !1, Ua = null;
function B0(e) {
  const t = e.querySelector('[data-st-roll-role="status-chat-name-track"]'), r = e.querySelector('[data-st-roll-role="status-chat-name-segment"]');
  return !t || !r ? null : {
    track: t,
    segment: r
  };
}
function U0(e) {
  const t = B0(e);
  if (!t) return !1;
  const { track: r, segment: n } = t, o = Math.ceil(e.clientWidth || e.getBoundingClientRect().width || 0), i = Math.ceil(n.scrollWidth || n.getBoundingClientRect().width || 0);
  if (o <= 0 || i <= 0) return !1;
  r.style.removeProperty("--st-roll-status-chat-marquee-distance"), r.style.removeProperty("--st-roll-status-chat-marquee-duration"), e.classList.remove("is-overflowing");
  const c = i - o;
  return c <= 2 || (e.classList.add("is-overflowing"), r.style.setProperty("--st-roll-status-chat-marquee-distance", `-${c}px`), r.style.setProperty("--st-roll-status-chat-marquee-duration", `${Math.max(6, Math.min(18, c / 18 + 4))}s`)), !0;
}
function ho(e = document) {
  const t = [];
  e instanceof HTMLElement && e.matches('[data-st-roll-role="status-chat-name-marquee"]') && t.push(e), e.querySelectorAll?.('[data-st-roll-role="status-chat-name-marquee"]').forEach((r) => {
    r instanceof HTMLElement && t.push(r);
  }), t.length !== 0 && t.forEach((r) => {
    U0(r);
  });
}
function K0() {
  md || (md = !0, window.addEventListener("resize", () => {
    window.requestAnimationFrame(() => {
      ho(document);
    });
  }));
}
function H0(e) {
  !(e instanceof HTMLElement) || typeof ResizeObserver > "u" || (Ua || (Ua = new ResizeObserver((t) => {
    t.forEach((r) => {
      r.target instanceof HTMLElement && ho(r.target);
    });
  })), Ua.observe(e));
}
var Qe = /* @__PURE__ */ new Map(), Wt = [], fh = "", Ys = "all", gh = "", di = "all", vh = !1, fr = !1, Le = /* @__PURE__ */ new Set(), bh = "st_roll_status_editor_layout_v1", Ws = {
  name: 120,
  modifier: 72,
  duration: 90,
  scope: 90,
  skills: 160,
  enabled: 80,
  actions: 70
}, Kn = {
  name: "--st-roll-status-col-name",
  modifier: "--st-roll-status-col-modifier",
  duration: "--st-roll-status-col-duration",
  scope: "--st-roll-status-col-scope",
  skills: "--st-roll-status-col-skills",
  enabled: "--st-roll-status-col-enabled",
  actions: "--st-roll-status-col-actions"
};
function xh(e) {
  return e ? e.querySelector(".st-roll-status-layout") : null;
}
function hd(e) {
  return String(e ?? "").trim().toLowerCase();
}
function G0(e) {
  return String(e ?? "").trim().toLowerCase();
}
function z0(e) {
  const t = String(e ?? "").trim();
  if (!t) return [];
  const r = t.split("|").map((n) => G0(n)).filter(Boolean);
  return Array.from(new Set(r));
}
function ui(e = "", t = "", r = "", n = "skills", o = "", i = !0) {
  return {
    rowId: `status_row_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    name: e,
    modifierText: t,
    durationText: r,
    scope: n,
    skillsText: o,
    enabled: i
  };
}
function po(e) {
  return JSON.stringify(e.map((t) => ({
    name: String(t.name ?? ""),
    modifierText: String(t.modifierText ?? ""),
    durationText: String(t.durationText ?? ""),
    scope: t.scope === "all" ? "all" : "skills",
    skillsText: String(t.skillsText ?? ""),
    enabled: t.enabled !== !1
  })));
}
function yh(e) {
  return JSON.stringify((Array.isArray(e) ? e : []).map((t) => ({
    name: String(t.name ?? ""),
    modifier: Number(t.modifier ?? 0),
    scope: t.scope === "all" ? "all" : "skills",
    skills: t.scope === "all" ? [] : Array.isArray(t.skills) ? t.skills : [],
    remainingRounds: t.remainingRounds == null ? null : Number(t.remainingRounds),
    enabled: t.enabled !== !1
  })));
}
function Sh(e) {
  return document.getElementById(e)?.closest(".st-roll-status-modal-panel");
}
function We(e, t) {
  const r = document.getElementById(e);
  if (r) {
    if (!t.length) {
      r.hidden = !0, r.innerHTML = "";
      return;
    }
    r.hidden = !1, r.innerHTML = t.map((n) => `<div class="st-roll-status-error-item">${qt(n)}</div>`).join("");
  }
}
function Ho(e) {
  const t = String(gh ?? "").trim().toLowerCase();
  return e.filter((r) => vh && r.enabled === !1 || di === "skills" && r.scope !== "skills" || di === "global" && r.scope !== "all" ? !1 : t ? String(r.name ?? "").trim().toLowerCase().includes(t) : !0);
}
function j0() {
  const e = String(fh ?? "").trim().toLowerCase();
  return Wt.filter((t) => {
    if (Ys === "current" && !t.isCurrent || Ys === "local" && !t.fromRollLocal || Ys === "memory" && !t.fromMemory) return !1;
    if (!e) return !0;
    const r = String(t.chatId ?? "").toLowerCase(), n = String(t.displayName ?? "").toLowerCase();
    return r.includes(e) || n.includes(e);
  });
}
function Eh(e) {
  const t = document.getElementById(e), r = t?.closest(".st-roll-status-modal");
  if (!t || !r) return;
  const n = new Set(ve.map((f) => String(f.rowId ?? "")));
  Array.from(Le).forEach((f) => {
    n.has(f) || Le.delete(f);
  });
  const o = Ho(ve), i = o.filter((f) => Le.has(String(f.rowId ?? ""))).length, c = Le.size, u = r.querySelector(".st-roll-status-selection-count");
  u && (u.textContent = i > 0 && i !== c ? `已选 ${c} 项（可见 ${i} 项）` : `已选 ${c} 项`), [
    ".st-roll-status-batch-enable",
    ".st-roll-status-batch-disable",
    ".st-roll-status-batch-delete"
  ].forEach((f) => {
    const v = r.querySelector(f);
    v && (v.disabled = c <= 0);
  });
  const h = r.querySelector(".st-roll-status-select-visible");
  h && (h.disabled = o.length <= 0);
}
function Qr(e) {
  const t = document.getElementById(e);
  if (!t) return;
  t.disabled = fr;
  const r = t.querySelector(".stx-shared-button-label");
  r && (r.textContent = fr ? "刷新中" : "刷新");
}
function kr(e, t, r) {
  return !Number.isFinite(e) || t > r ? t : Math.max(t, Math.min(r, e));
}
function _h(e) {
  const t = document.getElementById(e)?.closest(".st-roll-status-modal");
  return !t || !t.querySelector(".st-roll-status-main") ? null : {
    modal: t,
    layout: t.querySelector(".st-roll-status-layout"),
    body: t.querySelector(".st-roll-status-modal-body")
  };
}
function mi(e) {
  const t = _h(e), r = Number(t?.layout?.clientHeight ?? t?.body?.clientHeight ?? window.visualViewport?.height ?? window.innerHeight ?? 0), n = kr(Math.round(r), 320, 2e3), o = kr(n - 8, 280, n), i = kr(Math.round(n * 0.5), 240, Math.max(240, o - 56)), c = Math.max(0, Math.round(o - i));
  return {
    fullHeight: o,
    halfTranslate: c,
    closedTranslate: Math.max(Math.round(o + 72), c + 120)
  };
}
function q0(e, t) {
  return e === "full" ? 0 : e === "half" ? t.halfTranslate : t.closedTranslate;
}
function pd(e, t, r) {
  return e >= r.halfTranslate + (r.closedTranslate - r.halfTranslate) * 0.42 || t >= 1.05 ? "closed" : t <= -0.9 ? "full" : t >= 0.85 ? "half" : Math.abs(e) <= Math.abs(e - r.halfTranslate) ? "full" : "half";
}
function Kt(e) {
  const t = _h(e);
  if (!t) return null;
  const r = mi(e), n = q0(bt, r);
  kt = kr(Vt ? kt : n, 0, r.closedTranslate);
  const o = r.closedTranslate <= 0 ? 0 : kr(1 - kt / r.closedTranslate, 0, 1);
  return t.modal.dataset.mobileSheetState = bt, t.modal.classList.toggle("is-mobile-sheet-open", bt !== "closed"), t.modal.classList.toggle("is-mobile-sheet-expanded", bt === "full"), t.modal.classList.toggle("is-mobile-sheet-dragging", Vt), t.modal.style.setProperty("--st-roll-status-mobile-sheet-height", `${r.fullHeight}px`), t.modal.style.setProperty("--st-roll-status-mobile-sheet-translate", `${kt}px`), t.modal.style.setProperty("--st-roll-status-mobile-sheet-backdrop-opacity", o.toFixed(3)), r;
}
function Go(e, t) {
  bt = t, Vt = !1, Jr = null, Kt(e);
}
function hi(e) {
  Go(e, "half");
}
function pi(e) {
  Go(e, "closed");
}
function F0(e) {
  Go(e, "full");
}
function V0(e) {
  Go(e, "half");
}
function Y0(e) {
  if (bt === "closed") {
    hi(e);
    return;
  }
  if (bt === "full") {
    V0(e);
    return;
  }
  F0(e);
}
function wr(e, t) {
  Yn = !!e;
  const r = document.getElementById(t);
  r && (r.hidden = !Yn);
}
function Xe(e) {
  const t = document.getElementById(e);
  if (!t) return;
  const r = Ho(ve);
  if (Eh(e), !ve.length) {
    t.innerHTML = '<div class="st-roll-status-empty">暂无状态，点击“新增状态”开始配置。</div>', xt(t), _r(t.closest(".st-roll-status-modal") || t);
    return;
  }
  if (!r.length) {
    t.innerHTML = '<div class="st-roll-status-empty">没有匹配的状态</div>', xt(t), _r(t.closest(".st-roll-status-modal") || t);
    return;
  }
  t.innerHTML = r.map((n) => {
    const o = Ft(String(n.rowId ?? "")), i = Ft(String(n.name ?? "")), c = Ft(String(n.modifierText ?? "")), u = Ft(String(n.durationText ?? "")), h = n.scope === "all" ? "all" : "skills", f = Ft(String(n.skillsText ?? "")), v = n.enabled !== !1, x = h === "all" ? "范围为全局时会忽略此项" : "例如：反应|潜行";
    return `
        <div class="st-roll-status-row" data-row-id="${o}">
          ${mr("名称", `
          <div class="st-roll-status-name-wrap">
            ${nu({
      id: `st-roll-status-row-select-${o}`,
      containerClassName: "st-roll-status-row-select",
      attributes: { "data-tip": "选择这条状态" },
      inputAttributes: {
        "data-status-select-id": o,
        checked: Le.has(String(n.rowId ?? ""))
      }
    })}
            ${je({
      value: i,
      className: "st-roll-status-name",
      attributes: {
        "data-status-row-id": o,
        "data-status-field": "name",
        "data-tip": "状态名称。",
        placeholder: "状态名称"
      }
    })}
          </div>
        `, "st-roll-status-field-name")}
          ${mr("修正", je({
      value: c,
      type: "number",
      className: "st-roll-status-modifier",
      attributes: {
        inputmode: "numeric",
        step: 1,
        "data-status-row-id": o,
        "data-status-field": "modifier",
        "data-tip": "状态加减值，必须是整数。",
        placeholder: "例如 -2"
      }
    }), "st-roll-status-field-modifier")}
          ${mr("轮次", je({
      value: u,
      type: "number",
      className: "st-roll-status-duration",
      attributes: {
        inputmode: "numeric",
        min: 1,
        step: 1,
        "data-status-row-id": o,
        "data-status-field": "duration",
        "data-tip": "持续轮次，留空表示永久。",
        placeholder: "留空=永久，例如 3"
      }
    }), "st-roll-status-field-duration")}
          ${mr("范围", P0(o, h), "st-roll-status-field-scope")}
          ${mr("技能", je({
      value: f,
      className: "st-roll-status-skills",
      disabled: h === "all",
      attributes: {
        "data-status-row-id": o,
        "data-status-field": "skills",
        "data-tip": "技能范围，用 | 分隔。",
        placeholder: x
      }
    }), "st-roll-status-field-skills")}
          <div class="st-roll-status-bottom-grid">
            ${mr("", Yd({
      id: `st-roll-status-enabled-${o}`,
      title: "启用",
      checkedLabel: "开",
      uncheckedLabel: "关",
      containerClassName: "st-roll-status-enabled-card",
      copyClassName: "st-roll-status-enabled-copy",
      titleClassName: "st-roll-status-enabled-title",
      controlClassName: "st-roll-status-enabled-control",
      inputAttributes: {
        "data-status-row-id": o,
        "data-status-field": "enabled",
        "data-tip": "是否启用该状态。",
        checked: v
      }
    }), "st-roll-status-field-enabled")}
            ${mr("操作", `
          <div class="st-roll-status-actions-group">
            ${me({
      label: "复制",
      variant: "secondary",
      iconClassName: "fa-solid fa-copy",
      className: "st-roll-status-duplicate st-roll-toolbar-icon-btn",
      attributes: {
        "data-status-duplicate-id": o,
        "data-tip": "复制这条状态。",
        "aria-label": "复制状态"
      }
    })}
            ${me({
      label: "删除",
      variant: "danger",
      iconClassName: "fa-solid fa-trash",
      className: "st-roll-status-remove st-roll-toolbar-icon-btn",
      attributes: {
        "data-status-remove-id": o,
        "data-tip": "删除这条状态。",
        "aria-label": "删除状态"
      }
    })}
          </div>
        `, "st-roll-status-field-actions")}
          </div>
        </div>
      `;
  }).join(""), ru(t), xt(t), _r(t.closest(".st-roll-status-modal") || t);
}
function Nl(e) {
  return (Array.isArray(e) ? e : []).map((t) => ui(String(t.name ?? ""), String(t.modifier ?? 0), t.remainingRounds == null ? "" : String(t.remainingRounds), t.scope === "all" ? "all" : "skills", t.scope === "all" ? "" : (Array.isArray(t.skills) ? t.skills : []).join("|"), t.enabled !== !1));
}
function W0(e, t) {
  const r = [], n = [], o = /* @__PURE__ */ new Map(), i = /* @__PURE__ */ new Map();
  for (const h of t || []) {
    const f = hd(h.name);
    f && i.set(f, h);
  }
  const c = /^[+-]?\d+$/, u = Date.now();
  return e.forEach((h, f) => {
    const v = f + 1, x = String(h.name ?? "").trim(), y = hd(x), S = String(h.modifierText ?? "").trim(), _ = String(h.durationText ?? "").trim(), P = h.scope === "all" ? "all" : "skills", L = P === "all" ? [] : z0(String(h.skillsText ?? ""));
    let M = !1;
    if (x || (r.push(`第 ${v} 行：名称不能为空`), M = !0), y) {
      const F = o.get(y);
      F != null ? (r.push(`第 ${v} 行：名称与第 ${F + 1} 行重复`), M = !0) : o.set(y, f);
    }
    S ? c.test(S) || (r.push(`第 ${v} 行：修正值必须为整数`), M = !0) : (r.push(`第 ${v} 行：修正值不能为空`), M = !0);
    let B = null;
    if (_) if (!c.test(_))
      r.push(`第 ${v} 行：持续轮次必须为整数（留空表示永久）`), M = !0;
    else {
      const F = Math.floor(Number(_));
      !Number.isFinite(F) || F < 1 ? (r.push(`第 ${v} 行：持续轮次必须 >= 1（留空表示永久）`), M = !0) : B = F;
    }
    if (P === "skills" && L.length <= 0 && (r.push(`第 ${v} 行：范围为“按技能”时，技能列表不能为空`), M = !0), M) return;
    const C = Number(S), G = i.get(y);
    n.push({
      name: x,
      modifier: C,
      remainingRounds: B,
      scope: P,
      skills: L,
      enabled: h.enabled !== !1,
      createdAt: G?.createdAt ?? u,
      updatedAt: u,
      source: "manual_editor"
    });
  }), {
    errors: r,
    statuses: n
  };
}
function Th(e, t, r, n = !1) {
  const o = document.getElementById(t), i = JSON.stringify((Array.isArray(e) ? e : []).map((c) => ({
    name: c.name,
    modifier: c.modifier,
    scope: c.scope,
    skills: c.scope === "all" ? [] : c.skills,
    remainingRounds: c.remainingRounds ?? null,
    enabled: c.enabled !== !1
  })));
  !n && Yn && o?.hasChildNodes() || !n && i === Ar && o?.hasChildNodes() || (Le.clear(), ve = Nl(e), Tr = po(ve), Ar = i, wr(!1, r), Xe(t));
}
function fo(e, t, r) {
  return Math.min(r, Math.max(t, e));
}
function Ll() {
  const e = bl(At, bh, null);
  return !e || typeof e != "object" ? {} : e;
}
function kh(e) {
  xl(At, bh, e);
}
function X0(e) {
  const t = Sh(e);
  if (!t) return;
  const r = xh(t), n = Ll(), o = Number(n.sidebarWidth);
  if (Number.isFinite(o)) {
    const c = fo(o, 220, 520);
    r?.style.setProperty("--st-roll-status-sidebar-width", `${c}px`), t.style.setProperty("--st-roll-status-sidebar-width", `${c}px`);
  }
  const i = n.columns ?? {};
  Object.keys(Kn).forEach((c) => {
    const u = Number(i[c]);
    if (!Number.isFinite(u)) return;
    const h = fo(u, Ws[c], 520);
    t.style.setProperty(Kn[c], `${h}px`);
  });
}
function wh(e, t) {
  const r = e.closest(".st-roll-status-modal-panel");
  return r || Sh(t);
}
function J0(e, t) {
  if (e.dataset.statusSplitterResizeBound === "1") return;
  e.dataset.statusSplitterResizeBound = "1", e.style.touchAction = "none";
  let r = null, n = null, o = null, i = 0, c = 300, u = !1;
  const h = (M) => {
    if (!u || !r) return;
    const B = fo(c + (M - i), 220, 520);
    n?.style.setProperty("--st-roll-status-sidebar-width", `${B}px`), r.style.setProperty("--st-roll-status-sidebar-width", `${B}px`);
  }, f = () => {
    if (!r) return;
    const M = n || r, B = Number.parseFloat(getComputedStyle(M).getPropertyValue("--st-roll-status-sidebar-width"));
    Number.isFinite(B) && kh({
      ...Ll(),
      sidebarWidth: B
    });
  }, v = (M) => {
    if (u) {
      if (M && f(), u = !1, e.classList.remove("is-resizing"), window.removeEventListener("pointermove", y), window.removeEventListener("pointerup", S), window.removeEventListener("pointercancel", _), window.removeEventListener("mousemove", P), window.removeEventListener("mouseup", L), o != null) try {
        e.hasPointerCapture(o) && e.releasePointerCapture(o);
      } catch {
      }
      o = null, n = null, r = null;
    }
  }, x = (M, B) => {
    const C = wh(e, t);
    if (!C) return;
    r = C, n = xh(C), o = B, i = M;
    const G = e.previousElementSibling;
    if (c = Math.max(220, Math.round(G?.getBoundingClientRect().width ?? 300)), u = !0, e.classList.add("is-resizing"), window.addEventListener("pointermove", y), window.addEventListener("pointerup", S), window.addEventListener("pointercancel", _), window.addEventListener("mousemove", P), window.addEventListener("mouseup", L), B != null) try {
      e.setPointerCapture(B);
    } catch {
    }
  }, y = (M) => {
    u && (o != null && M.pointerId !== o || h(M.clientX));
  }, S = (M) => {
    u && (o != null && M.pointerId !== o || v(!0));
  }, _ = (M) => {
    u && (o != null && M.pointerId !== o || v(!1));
  }, P = (M) => {
    !u || o != null || h(M.clientX);
  }, L = () => {
    !u || o != null || v(!0);
  };
  e.addEventListener("pointerdown", (M) => {
    M.pointerType === "mouse" && M.button !== 0 || (M.preventDefault(), M.stopPropagation(), u && v(!1), x(M.clientX, M.pointerId));
  }), e.addEventListener("mousedown", (M) => {
    M.button === 0 && (u || (M.preventDefault(), M.stopPropagation(), x(M.clientX, null)));
  });
}
function Q0(e, t) {
  if (e.dataset.statusColsResizeBound === "1") return;
  e.dataset.statusColsResizeBound = "1";
  let r = null, n = null, o = null, i = null, c = 0, u = 0, h = !1;
  const f = (C) => {
    if (!h || !r || !o) return;
    const G = fo(u + (C - c), Ws[o], 520);
    r.style.setProperty(Kn[o], `${G}px`);
  }, v = () => {
    if (!r || !o) return;
    const C = Number.parseFloat(getComputedStyle(r).getPropertyValue(Kn[o]));
    if (!Number.isFinite(C)) return;
    const G = Ll();
    kh({
      ...G,
      columns: {
        ...G.columns ?? {},
        [o]: C
      }
    });
  }, x = (C) => {
    if (h) {
      if (C && v(), h = !1, n?.classList.remove("is-resizing"), window.removeEventListener("pointermove", S), window.removeEventListener("pointerup", _), window.removeEventListener("pointercancel", P), window.removeEventListener("mousemove", L), window.removeEventListener("mouseup", M), n && i != null) try {
        n.hasPointerCapture(i) && n.releasePointerCapture(i);
      } catch {
      }
      r = null, n = null, o = null, i = null;
    }
  }, y = (C, G, F, Z) => {
    const H = wh(e, t);
    if (!H) return;
    r = H, n = C, o = G, i = Z;
    const X = e.querySelector(`[data-status-col-key="${G}"]`);
    if (c = F, u = Math.max(Ws[G], Math.round(X?.getBoundingClientRect().width ?? Ws[G])), h = !0, C.style.touchAction = "none", C.classList.add("is-resizing"), window.addEventListener("pointermove", S), window.addEventListener("pointerup", _), window.addEventListener("pointercancel", P), window.addEventListener("mousemove", L), window.addEventListener("mouseup", M), Z != null) try {
      C.setPointerCapture(Z);
    } catch {
    }
  }, S = (C) => {
    h && (i != null && C.pointerId !== i || f(C.clientX));
  }, _ = (C) => {
    h && (i != null && C.pointerId !== i || x(!0));
  }, P = (C) => {
    h && (i != null && C.pointerId !== i || x(!1));
  }, L = (C) => {
    !h || i != null || f(C.clientX);
  }, M = () => {
    !h || i != null || x(!0);
  }, B = (C) => {
    const G = C?.closest("[data-status-col-resize-key]");
    if (!G) return null;
    const F = String(G.dataset.statusColResizeKey ?? "");
    return !F || !Kn[F] ? null : {
      handle: G,
      key: F
    };
  };
  e.addEventListener("pointerdown", (C) => {
    if (C.pointerType === "mouse" && C.button !== 0) return;
    const G = B(C.target);
    G && (C.preventDefault(), C.stopPropagation(), h && x(!1), y(G.handle, G.key, C.clientX, C.pointerId));
  }), e.addEventListener("mousedown", (C) => {
    if (C.button !== 0 || h) return;
    const G = B(C.target);
    G && (C.preventDefault(), C.stopPropagation(), y(G.handle, G.key, C.clientX, null));
  });
}
function go(e) {
  const t = document.getElementById(e);
  t && (t.textContent = en);
}
function Z0(e) {
  return String(e ?? "").trim().toLowerCase().replace(/^default_/i, "").replace(/\.[a-z0-9]+$/i, "").replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
}
function ex(e) {
  if (!Number.isFinite(e) || e <= 0) return "-";
  try {
    return new Date(e).toLocaleString();
  } catch {
    return "-";
  }
}
function tn(e) {
  const t = String(st ?? "").trim();
  t && (Qe.set(t, {
    rows: [...ve],
    snapshot: Tr,
    metaSnapshot: Ar,
    dirty: Yn,
    updatedAt: Date.now(),
    activeStatusCount: ve.length
  }), wr(Yn, e));
}
function tx(e) {
  const t = /* @__PURE__ */ new Set();
  return (Array.isArray(e) ? e : []).forEach((r) => {
    const n = Ih(String(r ?? "").trim());
    n && t.add(n);
  }), t;
}
function fd(e, t) {
  const r = tx(t);
  return (Array.isArray(e) ? e : []).filter((n) => {
    const o = String(n ?? "").trim();
    if (!o) return !1;
    const i = Ih(o);
    return i ? !r.has(i) : !1;
  });
}
function rx(e) {
  let t = 0;
  return (Array.isArray(e) ? e : []).forEach((r) => {
    const n = String(r ?? "").trim();
    n && Qe.has(n) && (Qe.delete(n), t += 1);
  }), t;
}
function nx(e) {
  return (Array.isArray(e) ? e : []).filter((t) => {
    const r = String(t ?? "").trim();
    return !!Qe.get(r)?.dirty;
  }).length;
}
function sx(e, t, r) {
  const n = Qe.get(e);
  return n ? (Le.clear(), ve = [...n.rows], Tr = String(n.snapshot ?? "[]"), Ar = String(n.metaSnapshot ?? "[]"), wr(!!n.dirty, r), Xe(t), !0) : !1;
}
function ox(e) {
  const t = Ze(e);
  return {
    tavernInstanceId: String(t.tavernInstanceId ?? "").trim(),
    chatId: String(t.chatId ?? "").trim(),
    scopeType: t.scopeType === "group" ? "group" : "character",
    scopeId: String(t.scopeId ?? "").trim()
  };
}
function vo(e) {
  return String(e ?? "").trim().toLowerCase();
}
function ax(e, t) {
  const r = String(t ?? "").trim();
  return r ? vo(e === "group" ? r : Z0(r) || r) : "";
}
function ix(e) {
  const t = vo(e.tavernInstanceId), r = vo(e.chatId), n = e.scopeType === "group" ? "group" : "character", o = ax(n, e.scopeId);
  return !t || !r || !o || it(r) ? "" : `${t}::${n}::${o}::${r}`;
}
function Ih(e) {
  return ix(ox(e));
}
function Ah(e) {
  const t = Ze(e);
  return String(t.chatId ?? "").trim() || "unknown_chat";
}
function lx(e, t, r, n) {
  const o = String(e ?? "").trim();
  return Ov({
    currentChatKey: o,
    hostChats: t,
    localSummaries: r,
    draftChatKeys: Array.from(Qe.keys()),
    taggedChatKeys: n
  }).map((i) => {
    const c = Qe.get(i.chatKey);
    return {
      chatKey: i.chatKey,
      chatId: i.chatId,
      displayName: String(i.displayName ?? "").trim() || Ah(i.chatKey),
      avatarUrl: String(i.avatarUrl ?? "").trim(),
      scopeType: i.scopeType,
      scopeId: String(i.scopeId ?? "").trim(),
      roleKey: String(i.roleKey ?? "").trim(),
      updatedAt: Math.max(Number(i.updatedAt) || 0, Number(c?.updatedAt) || 0),
      activeStatusCount: Math.max(Number(i.activeStatusCount) || 0, Number(c?.activeStatusCount) || 0),
      isCurrent: i.isCurrent,
      fromRollLocal: i.fromLocal,
      fromHost: i.fromHost,
      fromMemory: i.fromTagged
    };
  }).filter((i) => {
    const c = Qe.get(i.chatKey);
    return i.isCurrent || i.fromHost || i.fromMemory || c?.dirty ? !0 : Number(i.activeStatusCount) > 0;
  }).sort((i, c) => {
    if (i.chatKey === o) return -1;
    if (c.chatKey === o) return 1;
    const u = Qe.get(i.chatKey)?.dirty ? 1 : 0, h = Qe.get(c.chatKey)?.dirty ? 1 : 0;
    return u !== h ? h - u : i.fromHost !== c.fromHost ? Number(c.fromHost) - Number(i.fromHost) : (c.updatedAt || 0) - (i.updatedAt || 0);
  });
}
function gr(e) {
  const t = document.getElementById(e);
  if (!t) return;
  const r = j0();
  if (!Wt.length) {
    t.innerHTML = '<div class="st-roll-status-empty">当前酒馆下暂无聊天记录。</div>';
    return;
  }
  if (!r.length) {
    t.innerHTML = '<div class="st-roll-status-empty">没有匹配的聊天。</div>';
    return;
  }
  t.innerHTML = r.map((n) => {
    const o = n.chatKey === st, i = Qe.get(n.chatKey)?.dirty === !0, c = [];
    n.isCurrent && c.push("当前"), n.fromHost && c.push("宿主"), n.fromRollLocal && c.push("本地"), n.fromMemory && c.push("记忆库"), i && c.push("未保存");
    const u = String(n.chatId ?? "").trim(), h = String(n.displayName ?? "").trim() || Ah(n.chatKey), f = String(n.avatarUrl ?? "").trim(), v = qt(String(h || "未").slice(0, 1).toUpperCase());
    return `
      <button type="button" class="st-roll-status-chat-item ${o ? "is-active" : ""}" data-status-chat-key="${Ft(n.chatKey)}">
        <div class="st-roll-status-chat-avatar-wrap">
          ${f ? `<img class="st-roll-status-chat-avatar" src="${Ft(f)}" alt="${Ft(h)}" onerror="this.style.display='none'; const fb=this.nextElementSibling; if(fb){fb.style.display='grid';}" />` : ""}
          <div class="st-roll-status-chat-avatar-fallback" style="${f ? "display:none;" : ""}">${v}</div>
        </div>
        <div class="st-roll-status-chat-main">
          <span class="st-roll-status-chat-name-marquee" data-st-roll-role="status-chat-name-marquee">
            <span class="st-roll-status-chat-name-track" data-st-roll-role="status-chat-name-track">
              <span class="st-roll-status-chat-name" data-st-roll-role="status-chat-name-segment">${qt(h)}</span>
            </span>
          </span>
          <span class="st-roll-status-chat-time">最后聊天：${qt(ex(n.updatedAt))}</span>
          <span class="st-roll-status-chat-key">CHATID：${qt(u)}</span>
          <span class="st-roll-status-chat-meta-line">${c.map((x) => `<span class="st-roll-skill-preset-tag">${qt(x)}</span>`).join("")}</span>
        </div>
      </button>
    `;
  }).join(""), K0(), H0(t), ho(t), window.requestAnimationFrame(() => {
    ho(t);
  });
}
function zt(e) {
  const t = document.getElementById(e);
  if (!t) return;
  const r = String(st ?? "").trim();
  if (!r) {
    t.textContent = "未选择聊天";
    return;
  }
  const n = Wt.find((c) => c.chatKey === r);
  if (!n) {
    t.textContent = r;
    return;
  }
  const o = [];
  n.isCurrent && o.push("当前"), n.fromHost && o.push("宿主"), n.fromRollLocal && o.push("本地"), n.fromMemory && o.push("记忆库");
  const i = Ho(ve).length;
  t.textContent = `来源：${o.join("、") || "未知"}｜状态数：${n.activeStatusCount}｜可见：${i}`;
}
async function $h(e, t, r) {
  const n = String(e ?? "").trim();
  n && (r?.skipSaveCurrent || tn(t.SETTINGS_STATUS_DIRTY_HINT_ID_Event), st = n, sx(n, t.SETTINGS_STATUS_ROWS_ID_Event, t.SETTINGS_STATUS_DIRTY_HINT_ID_Event) || (Th(n === String(t.getActiveChatKeyEvent() ?? "").trim() ? t.getActiveStatusesEvent() : await t.loadStatusesForChatKeyEvent(n), t.SETTINGS_STATUS_ROWS_ID_Event, t.SETTINGS_STATUS_DIRTY_HINT_ID_Event, !0), tn(t.SETTINGS_STATUS_DIRTY_HINT_ID_Event)), gr(t.SETTINGS_STATUS_CHAT_LIST_ID_Event), zt(t.SETTINGS_STATUS_CHAT_META_ID_Event), We(t.SETTINGS_STATUS_ERRORS_ID_Event, []));
}
async function Cn(e) {
  const t = ++Ba;
  fr = !0, Qr(e.SETTINGS_STATUS_REFRESH_ID_Event), Pa = String(e.getActiveChatKeyEvent() ?? "").trim(), en = "记忆库：检测中", go(e.SETTINGS_STATUS_MEMORY_STATE_ID_Event);
  const [r, n, o] = await Promise.all([
    e.listHostChatsForCurrentScopeEvent().catch(() => []),
    e.listChatScopedStatusSummariesEvent().catch(() => []),
    e.probeMemoryPluginEvent(1200).catch(() => ({
      available: !1,
      enabled: !1,
      pluginId: "stx_memory_os",
      version: "",
      capabilities: []
    }))
  ]);
  if (t !== Ba) {
    fr = !1, Qr(e.SETTINGS_STATUS_REFRESH_ID_Event);
    return;
  }
  let i = [];
  if (!o.available) en = "记忆库：未安装";
  else if (!o.enabled) en = "记忆库：已安装（未启用）";
  else {
    en = "记忆库：已启用";
    const u = await e.fetchMemoryChatKeysEvent(1200).catch(() => ({
      chatKeys: [],
      updatedAt: null
    }));
    if (t !== Ba) {
      fr = !1, Qr(e.SETTINGS_STATUS_REFRESH_ID_Event);
      return;
    }
    i = Array.isArray(u.chatKeys) ? u.chatKeys : [];
  }
  Wt = lx(Pa, r, n, i), go(e.SETTINGS_STATUS_MEMORY_STATE_ID_Event), gr(e.SETTINGS_STATUS_CHAT_LIST_ID_Event);
  const c = (Wt.some((u) => u.chatKey === st) ? st : "") || Pa || Wt[0]?.chatKey || "";
  if (!c) {
    st = "", ve = [], Tr = "[]", Ar = "[]", wr(!1, e.SETTINGS_STATUS_DIRTY_HINT_ID_Event), Xe(e.SETTINGS_STATUS_ROWS_ID_Event), zt(e.SETTINGS_STATUS_CHAT_META_ID_Event), We(e.SETTINGS_STATUS_ERRORS_ID_Event, []), pi(e.SETTINGS_STATUS_ROWS_ID_Event), fr = !1, Qr(e.SETTINGS_STATUS_REFRESH_ID_Event);
    return;
  }
  await $h(c, e, { skipSaveCurrent: !0 }), fr = !1, Qr(e.SETTINGS_STATUS_REFRESH_ID_Event);
}
function Rh(e) {
  const t = String(e.getActiveChatKeyEvent() ?? "").trim();
  if (!t || Qe.get(t)?.dirty) return;
  const r = e.getActiveStatusesEvent(), n = Nl(r), o = po(n), i = yh(r);
  Qe.set(t, {
    rows: n,
    snapshot: o,
    metaSnapshot: i,
    dirty: !1,
    updatedAt: Date.now(),
    activeStatusCount: r.length
  }), !(st && st !== t) && (st = t, Th(r, e.SETTINGS_STATUS_ROWS_ID_Event, e.SETTINGS_STATUS_DIRTY_HINT_ID_Event, !0));
}
function cx(e) {
  const t = document.getElementById(e.SETTINGS_STATUS_ROWS_ID_Event), r = document.getElementById(e.SETTINGS_STATUS_ADD_ID_Event), n = document.getElementById(e.SETTINGS_STATUS_SAVE_ID_Event), o = document.getElementById(e.SETTINGS_STATUS_RESET_ID_Event), i = document.getElementById(e.SETTINGS_STATUS_REFRESH_ID_Event), c = document.getElementById(e.SETTINGS_STATUS_CLEAN_UNUSED_ID_Event), u = document.getElementById(e.SETTINGS_STATUS_CHAT_LIST_ID_Event), h = document.getElementById(e.SETTINGS_STATUS_SPLITTER_ID_Event), f = document.getElementById(e.SETTINGS_STATUS_COLS_ID_Event), v = t?.closest(".st-roll-status-modal"), x = v?.querySelector(".st-roll-status-chat-search"), y = v?.querySelector(".st-roll-status-chat-source"), S = v?.querySelector(".st-roll-status-search"), _ = v?.querySelector(".st-roll-status-scope-filter"), P = v?.querySelector(".st-roll-status-only-enabled"), L = v?.querySelector(".st-roll-status-select-visible"), M = v?.querySelector(".st-roll-status-batch-enable"), B = v?.querySelector(".st-roll-status-batch-disable"), C = v?.querySelector(".st-roll-status-batch-delete"), G = v?.querySelector(".st-roll-status-mobile-back"), F = v?.querySelector(".st-roll-status-mobile-sheet-head");
  if (!t || t.dataset.statusEditorBound === "1") return;
  t.dataset.statusEditorBound = "1", X0(e.SETTINGS_STATUS_ROWS_ID_Event), h && J0(h, e.SETTINGS_STATUS_ROWS_ID_Event), f && Q0(f, e.SETTINGS_STATUS_ROWS_ID_Event);
  const Z = () => {
    wr(po(ve) !== Tr, e.SETTINGS_STATUS_DIRTY_HINT_ID_Event), tn(e.SETTINGS_STATUS_DIRTY_HINT_ID_Event), gr(e.SETTINGS_STATUS_CHAT_LIST_ID_Event);
  };
  if (Rh(e), We(e.SETTINGS_STATUS_ERRORS_ID_Event, []), go(e.SETTINGS_STATUS_MEMORY_STATE_ID_Event), zt(e.SETTINGS_STATUS_CHAT_META_ID_Event), Qr(e.SETTINGS_STATUS_REFRESH_ID_Event), Kt(e.SETTINGS_STATUS_ROWS_ID_Event), Cn(e), x?.addEventListener("input", () => {
    fh = String(x.value ?? ""), gr(e.SETTINGS_STATUS_CHAT_LIST_ID_Event);
  }), y?.addEventListener("change", () => {
    const H = String(y.value ?? "all");
    Ys = H === "current" || H === "local" || H === "memory" ? H : "all", gr(e.SETTINGS_STATUS_CHAT_LIST_ID_Event);
  }), S?.addEventListener("input", () => {
    gh = String(S.value ?? ""), Xe(e.SETTINGS_STATUS_ROWS_ID_Event), zt(e.SETTINGS_STATUS_CHAT_META_ID_Event);
  }), _?.addEventListener("change", () => {
    const H = String(_.value ?? "all");
    di = H === "skills" || H === "global" ? H : "all", Xe(e.SETTINGS_STATUS_ROWS_ID_Event), zt(e.SETTINGS_STATUS_CHAT_META_ID_Event);
  }), P?.addEventListener("change", () => {
    vh = !!P.checked, Xe(e.SETTINGS_STATUS_ROWS_ID_Event), zt(e.SETTINGS_STATUS_CHAT_META_ID_Event);
  }), L?.addEventListener("click", () => {
    Ho(ve).forEach((H) => {
      Le.add(String(H.rowId ?? ""));
    }), Xe(e.SETTINGS_STATUS_ROWS_ID_Event);
  }), M?.addEventListener("click", () => {
    Le.size <= 0 || (ve = ve.map((H) => Le.has(String(H.rowId ?? "")) ? {
      ...H,
      enabled: !0
    } : H), Xe(e.SETTINGS_STATUS_ROWS_ID_Event), Z(), We(e.SETTINGS_STATUS_ERRORS_ID_Event, []));
  }), B?.addEventListener("click", () => {
    Le.size <= 0 || (ve = ve.map((H) => Le.has(String(H.rowId ?? "")) ? {
      ...H,
      enabled: !1
    } : H), Xe(e.SETTINGS_STATUS_ROWS_ID_Event), Z(), We(e.SETTINGS_STATUS_ERRORS_ID_Event, []));
  }), C?.addEventListener("click", () => {
    Le.size <= 0 || (ve = ve.filter((H) => !Le.has(String(H.rowId ?? ""))), Le.clear(), Xe(e.SETTINGS_STATUS_ROWS_ID_Event), Z(), We(e.SETTINGS_STATUS_ERRORS_ID_Event, []));
  }), G?.addEventListener("click", () => {
    pi(e.SETTINGS_STATUS_ROWS_ID_Event);
  }), F) {
    let H = !1;
    const X = () => {
      Vt = !1, Jr = null, Ms = 0, Os = kt, Ps = 0, Bs = 0;
    };
    F.addEventListener("click", (K) => {
      if (H) {
        H = !1;
        return;
      }
      K.target?.closest(".st-roll-status-mobile-back") || Y0(e.SETTINGS_STATUS_ROWS_ID_Event);
    }), F.addEventListener("pointerdown", (K) => {
      if (!(K.pointerType === "mouse" && K.button !== 0) && !K.target?.closest(".st-roll-status-mobile-back") && window.matchMedia("(max-width: 680px)").matches) {
        Kt(e.SETTINGS_STATUS_ROWS_ID_Event), Vt = !0, Jr = K.pointerId, Ms = K.clientY, Os = kt, Ps = K.clientY, Bs = performance.now();
        try {
          F.setPointerCapture(K.pointerId);
        } catch {
        }
        Kt(e.SETTINGS_STATUS_ROWS_ID_Event);
      }
    }), F.addEventListener("pointermove", (K) => {
      if (!Vt || Jr !== K.pointerId) return;
      const z = Kt(e.SETTINGS_STATUS_ROWS_ID_Event);
      if (!z) return;
      const se = K.clientY - Ms;
      kt = kr(Os + se, 0, z.closedTranslate), Ps = K.clientY, Bs = performance.now(), Math.abs(se) > 8 && (H = !0), Kt(e.SETTINGS_STATUS_ROWS_ID_Event), K.preventDefault();
    }), F.addEventListener("pointerup", (K) => {
      if (!Vt || Jr !== K.pointerId) return;
      const z = mi(e.SETTINGS_STATUS_ROWS_ID_Event), se = K.clientY - Ms, ie = kr(Os + se, 0, z.closedTranslate), ue = performance.now(), Ae = Math.max(1, ue - Bs), le = (K.clientY - Ps) / Ae;
      kt = ie, bt = pd(ie, le, z), X(), Kt(e.SETTINGS_STATUS_ROWS_ID_Event), H = Math.abs(se) > 8;
      try {
        F.releasePointerCapture(K.pointerId);
      } catch {
      }
    }), F.addEventListener("pointercancel", (K) => {
      if (!Vt || Jr !== K.pointerId) return;
      const z = mi(e.SETTINGS_STATUS_ROWS_ID_Event);
      bt = pd(kt, 0, z), X(), Kt(e.SETTINGS_STATUS_ROWS_ID_Event), H = !1;
      try {
        F.releasePointerCapture(K.pointerId);
      } catch {
      }
    });
  }
  t.addEventListener("input", (H) => {
    const X = H.target;
    if (!X) return;
    const K = String(X.dataset.statusRowId ?? ""), z = String(X.dataset.statusField ?? "");
    if (!K || !z) return;
    const se = ve.find((ie) => ie.rowId === K);
    se && (z === "name" && (se.name = X.value), z === "modifier" && (se.modifierText = X.value), z === "skills" && (se.skillsText = X.value), z === "duration" && (se.durationText = X.value), z === "scope" && (se.scope = X.value === "all" ? "all" : "skills", se.scope === "all" && (se.skillsText = ""), Xe(e.SETTINGS_STATUS_ROWS_ID_Event)), Z(), We(e.SETTINGS_STATUS_ERRORS_ID_Event, []));
  }), t.addEventListener("change", (H) => {
    const X = H.target;
    if (!X) return;
    const K = String(X.dataset.statusSelectId ?? "");
    if (K) {
      X.checked ? Le.add(K) : Le.delete(K), Eh(e.SETTINGS_STATUS_ROWS_ID_Event);
      return;
    }
    const z = String(X.dataset.statusRowId ?? ""), se = String(X.dataset.statusField ?? "");
    if (!z || se !== "enabled") return;
    const ie = ve.find((ue) => ue.rowId === z);
    ie && (ie.enabled = X.checked, Z(), We(e.SETTINGS_STATUS_ERRORS_ID_Event, []));
  }), t.addEventListener("click", (H) => {
    const X = H.target, K = X?.closest("button[data-status-duplicate-id]");
    if (K) {
      const ie = String(K.dataset.statusDuplicateId ?? ""), ue = ve.find((Ae) => Ae.rowId === ie);
      if (!ue) return;
      ve = [...ve, ui(String(ue.name ?? ""), String(ue.modifierText ?? ""), String(ue.durationText ?? ""), ue.scope === "all" ? "all" : "skills", String(ue.skillsText ?? ""), ue.enabled !== !1)], Xe(e.SETTINGS_STATUS_ROWS_ID_Event), Z(), We(e.SETTINGS_STATUS_ERRORS_ID_Event, []);
      return;
    }
    const z = X?.closest("button[data-status-remove-id]");
    if (!z) return;
    const se = String(z.dataset.statusRemoveId ?? "");
    se && (Le.delete(se), ve = ve.filter((ie) => ie.rowId !== se), Xe(e.SETTINGS_STATUS_ROWS_ID_Event), Z(), We(e.SETTINGS_STATUS_ERRORS_ID_Event, []));
  }), u?.addEventListener("click", (H) => {
    const X = H.target?.closest("button[data-status-chat-key]");
    if (!X) return;
    const K = String(X.dataset.statusChatKey ?? "").trim();
    if (K) {
      if (K === st) {
        bt === "closed" && hi(e.SETTINGS_STATUS_ROWS_ID_Event);
        return;
      }
      $h(K, e).then(() => {
        hi(e.SETTINGS_STATUS_ROWS_ID_Event);
      });
    }
  }), r?.addEventListener("click", () => {
    ve = [...ve, ui()], Xe(e.SETTINGS_STATUS_ROWS_ID_Event), Z(), We(e.SETTINGS_STATUS_ERRORS_ID_Event, []);
  }), n?.addEventListener("click", () => {
    (async () => {
      const H = String(st ?? "").trim();
      if (!H) return;
      const X = String(e.getActiveChatKeyEvent() ?? "").trim(), K = H === X ? e.getActiveStatusesEvent() : await e.loadStatusesForChatKeyEvent(H), z = W0(ve, K);
      if (z.errors.length > 0) {
        We(e.SETTINGS_STATUS_ERRORS_ID_Event, z.errors);
        return;
      }
      H === X ? e.setActiveStatusesEvent(z.statuses) : await e.saveStatusesForChatKeyEvent(H, z.statuses), Le.clear(), ve = Nl(z.statuses), Tr = po(ve), Ar = yh(z.statuses), wr(!1, e.SETTINGS_STATUS_DIRTY_HINT_ID_Event), tn(e.SETTINGS_STATUS_DIRTY_HINT_ID_Event);
      const se = Wt.find((ie) => ie.chatKey === H);
      se && (se.updatedAt = Date.now(), se.activeStatusCount = z.statuses.length), Xe(e.SETTINGS_STATUS_ROWS_ID_Event), gr(e.SETTINGS_STATUS_CHAT_LIST_ID_Event), zt(e.SETTINGS_STATUS_CHAT_META_ID_Event), We(e.SETTINGS_STATUS_ERRORS_ID_Event, []), e.syncSettingsUiEvent?.(), e.appendToConsoleEvent?.(H === X ? "状态编辑器：已保存并立即应用到当前聊天。" : `状态编辑器：已保存到聊天 ${H}。`);
    })();
  }), o?.addEventListener("click", () => {
    (async () => {
      const H = String(st ?? "").trim();
      if (!H) return;
      const X = String(e.getActiveChatKeyEvent() ?? "").trim();
      H === X ? e.setActiveStatusesEvent([]) : await e.saveStatusesForChatKeyEvent(H, []), Le.clear(), ve = [], Tr = "[]", Ar = "[]", wr(!1, e.SETTINGS_STATUS_DIRTY_HINT_ID_Event), tn(e.SETTINGS_STATUS_DIRTY_HINT_ID_Event);
      const K = Wt.find((z) => z.chatKey === H);
      K && (K.updatedAt = Date.now(), K.activeStatusCount = 0), Xe(e.SETTINGS_STATUS_ROWS_ID_Event), gr(e.SETTINGS_STATUS_CHAT_LIST_ID_Event), zt(e.SETTINGS_STATUS_CHAT_META_ID_Event), We(e.SETTINGS_STATUS_ERRORS_ID_Event, []), e.syncSettingsUiEvent?.(), e.appendToConsoleEvent?.(H === X ? "状态编辑器：已重置当前聊天状态。" : `状态编辑器：聊天 ${H} 已重置。`);
    })();
  }), i?.addEventListener("click", () => {
    Cn(e);
  }), c?.addEventListener("click", () => {
    (async () => {
      tn(e.SETTINGS_STATUS_DIRTY_HINT_ID_Event);
      let H, X;
      try {
        [H, X] = await Promise.all([e.listHostChatsForCurrentScopeEvent(), e.listChatScopedStatusSummariesEvent()]);
      } catch {
        e.appendToConsoleEvent?.("状态编辑器：读取当前酒馆聊天列表失败，未执行清理。");
        return;
      }
      const K = String(e.getActiveChatKeyEvent() ?? "").trim(), z = Array.from(new Set([...(Array.isArray(H) ? H : []).map((be) => String(be.chatKey ?? "").trim()), K].filter(Boolean))), se = fd((Array.isArray(X) ? X : []).map((be) => String(be.chatKey ?? "").trim()), z), ie = fd(Array.from(Qe.keys()), z);
      if (se.length <= 0 && ie.length <= 0) {
        e.appendToConsoleEvent?.("状态编辑器：当前没有可清理的无用聊天。");
        return;
      }
      const ue = nx(ie);
      if (!window.confirm([
        `将删除 ${se.length} 条不在当前酒馆聊天列表中的本地聊天状态记录。`,
        `将同时移除 ${ie.length} 条对应草稿${ue > 0 ? `（其中 ${ue} 条未保存）` : ""}。`,
        "此操作不会影响酒馆原始聊天，也不会影响记忆库。"
      ].join(`
`))) return;
      const Ae = await e.cleanupUnusedChatStatesForCurrentTavernEvent(z), le = rx(ie);
      Le.clear(), await Cn(e), We(e.SETTINGS_STATUS_ERRORS_ID_Event, []), e.syncSettingsUiEvent?.(), e.appendToConsoleEvent?.(`状态编辑器：已清理 ${Ae.deletedCount} 条无用聊天状态，移除 ${le} 条草稿。`);
    })();
  }), dd || (document.addEventListener("st-roll-status-editor-opened", () => {
    pi(e.SETTINGS_STATUS_ROWS_ID_Event), Cn(e);
  }), dd = !0), ud || (ud = e.subscribeMemoryPluginStateEvent((H) => {
    en = H.enabled ? "记忆库：已启用" : "记忆库：已安装（未启用）", go(e.SETTINGS_STATUS_MEMORY_STATE_ID_Event), Cn(e);
  }));
}
function dx(e) {
  return !!Qe.get(String(e ?? ""))?.dirty;
}
var ux = "stx_rollhelper", mx = "stx_llmhub";
function hx(e, t) {
  if (t === void 0) {
    console.info(`[SS-Helper][RollHelperThemeInput] ${e}`);
    return;
  }
  console.info(`[SS-Helper][RollHelperThemeInput] ${e}`, t);
}
var gd = !1, vd = !1;
function px(e) {
  const t = document.getElementById(e.SETTINGS_TAB_MAIN_ID_Event), r = document.getElementById(e.SETTINGS_TAB_AI_ID_Event), n = document.getElementById(e.SETTINGS_TAB_SKILL_ID_Event), o = document.getElementById(e.SETTINGS_TAB_RULE_ID_Event), i = document.getElementById(e.SETTINGS_TAB_ABOUT_ID_Event), c = document.getElementById(e.SETTINGS_PANEL_MAIN_ID_Event), u = document.getElementById(e.SETTINGS_PANEL_AI_ID_Event), h = document.getElementById(e.SETTINGS_PANEL_SKILL_ID_Event), f = document.getElementById(e.SETTINGS_PANEL_RULE_ID_Event), v = document.getElementById(e.SETTINGS_PANEL_ABOUT_ID_Event), x = document.getElementById(e.SETTINGS_SKILL_MODAL_ID_Event), y = document.getElementById(e.SETTINGS_SKILL_EDITOR_OPEN_ID_Event), S = document.getElementById(e.SETTINGS_SKILL_MODAL_CLOSE_ID_Event), _ = document.getElementById(e.SETTINGS_STATUS_MODAL_ID_Event), P = document.getElementById(e.SETTINGS_STATUS_EDITOR_OPEN_ID_Event), L = document.getElementById(e.SETTINGS_STATUS_MODAL_CLOSE_ID_Event), M = document.getElementById(e.SETTINGS_SEARCH_ID_Event), B = document.getElementById(e.SETTINGS_AI_BRIDGE_STATUS_LIGHT_ID_Event), C = document.getElementById(e.SETTINGS_AI_BRIDGE_STATUS_TEXT_ID_Event), G = document.getElementById(e.SETTINGS_AI_BRIDGE_REFRESH_ID_Event), F = c ? Array.from(c.querySelectorAll(".st-roll-search-item")) : [], Z = u ? Array.from(u.querySelectorAll(".st-roll-search-item")) : [], H = h ? Array.from(h.querySelectorAll(".st-roll-search-item")) : [], X = f ? Array.from(f.querySelectorAll(".st-roll-search-item")) : [], K = v ? Array.from(v.querySelectorAll(".st-roll-search-item")) : [], z = [
    ...F,
    ...Z,
    ...H,
    ...X,
    ...K
  ];
  let se = "main";
  const ie = () => {
    const ae = document.getElementById(e.drawerContentId);
    ae && (e.isElementVisibleEvent(ae) || (document.getElementById(e.drawerToggleId)?.click(), !e.isElementVisibleEvent(ae) && (ae.hidden = !1, ae.style.display = "block")));
  }, ue = () => {
    if (x) {
      if (x.open) try {
        x.close();
      } catch {
      }
      document.body.dataset.stRollSkillModalOpen === "1" && (document.body.style.overflow = document.body.dataset.stRollSkillModalOverflow || "", delete document.body.dataset.stRollSkillModalOpen, delete document.body.dataset.stRollSkillModalOverflow);
    }
  }, Ae = () => {
    if (x) {
      if (ie(), !x.open) try {
        x.showModal();
      } catch {
        x.setAttribute("open", "");
      }
      document.body.dataset.stRollSkillModalOpen !== "1" && (document.body.dataset.stRollSkillModalOpen = "1", document.body.dataset.stRollSkillModalOverflow = document.body.style.overflow || "", document.body.style.overflow = "hidden");
    }
  }, le = () => {
    if (_) {
      if (_.open) try {
        _.close();
      } catch {
      }
      document.body.dataset.stRollStatusModalOpen === "1" && (document.body.style.overflow = document.body.dataset.stRollStatusModalOverflow || "", delete document.body.dataset.stRollStatusModalOpen, delete document.body.dataset.stRollStatusModalOverflow);
    }
  }, be = () => {
    if (_) {
      if (ie(), !_.open) try {
        _.showModal();
      } catch {
        _.setAttribute("open", "");
      }
      document.body.dataset.stRollStatusModalOpen !== "1" && (document.body.dataset.stRollStatusModalOpen = "1", document.body.dataset.stRollStatusModalOverflow = document.body.style.overflow || "", document.body.style.overflow = "hidden"), document.dispatchEvent(new CustomEvent("st-roll-status-editor-opened"));
    }
  }, we = (ae, Oe) => {
    B && (B.classList.remove("is-online", "is-offline", "is-checking"), B.classList.add(`is-${ae}`)), C && (C.textContent = Oe);
  }, Pe = async () => {
    we("checking", "检测中...");
    try {
      const ae = await ki("plugin:request:ping", {}, ux, {
        to: mx,
        timeoutMs: 1200
      });
      if (ae?.alive) {
        const Oe = String(ae?.version ?? "").trim();
        we("online", `已连接 LLMHub${Oe ? ` (v${Oe})` : ""}`);
        return;
      }
      we("offline", "LLMHub 未在线");
    } catch {
      we("offline", "LLMHub 未在线");
    }
  }, Fe = (ae) => {
    se = ae;
    const Oe = ae === "main", _e = ae === "ai", mt = ae === "skill", Lr = ae === "rule", re = ae === "about";
    t?.classList.toggle("is-active", Oe), r?.classList.toggle("is-active", _e), n?.classList.toggle("is-active", mt), o?.classList.toggle("is-active", Lr), i?.classList.toggle("is-active", re), c && (c.hidden = !Oe), u && (u.hidden = !_e), h && (h.hidden = !mt), f && (f.hidden = !Lr), v && (v.hidden = !re), xt(t || n || o || i || c || h || f || v || null);
  }, xe = (ae) => ae === se ? !0 : se === "skill" && ae !== "skill" && !e.confirmDiscardSkillDraftEvent() ? !1 : (ae !== "skill" && ue(), le(), Fe(ae), !0), Ve = globalThis;
  Ve.__stRollPreviewEditorBridgeBoundEvent || (document.addEventListener("st-roll-open-skill-editor", () => {
    xe("skill") && Ae();
  }), document.addEventListener("st-roll-open-status-editor", () => {
    xe("main") && be();
  }), Ve.__stRollPreviewEditorBridgeBoundEvent = !0);
  const Me = () => {
    const ae = String(M?.value ?? "").trim().toLowerCase().split(/\s+/).filter(Boolean);
    for (const _e of z) {
      const mt = `${_e.dataset.stRollSearch ?? ""} ${_e.textContent ?? ""}`.toLowerCase(), Lr = ae.every((re) => mt.includes(re));
      _e.classList.toggle("is-hidden-by-search", !Lr);
    }
    if (!ae.length) return;
    const Oe = {
      main: F.some((_e) => !_e.classList.contains("is-hidden-by-search")),
      ai: Z.some((_e) => !_e.classList.contains("is-hidden-by-search")),
      skill: H.some((_e) => !_e.classList.contains("is-hidden-by-search")),
      rule: X.some((_e) => !_e.classList.contains("is-hidden-by-search")),
      about: K.some((_e) => !_e.classList.contains("is-hidden-by-search"))
    };
    if (!Oe[se]) {
      const _e = [
        "main",
        "ai",
        "skill",
        "rule",
        "about"
      ].find((mt) => Oe[mt]);
      _e && xe(_e);
    }
  };
  Fe("main"), t?.addEventListener("click", () => {
    xe("main") && Me();
  }), r?.addEventListener("click", () => {
    xe("ai") && (Me(), Pe());
  }), n?.addEventListener("click", () => {
    xe("skill") && Me();
  }), o?.addEventListener("click", () => {
    xe("rule") && Me();
  }), i?.addEventListener("click", () => {
    xe("about") && Me();
  }), G?.addEventListener("click", () => {
    Pe();
  }), M?.addEventListener("input", Me), Me(), we("offline", "待检测"), y?.addEventListener("click", () => {
    xe("skill") && Ae();
  }), S?.addEventListener("click", () => {
    ue();
  }), x?.addEventListener("click", (ae) => {
    const Oe = ae.target;
    (ae.target === x || Oe?.dataset.skillModalRole === "backdrop") && ue();
  }), x?.addEventListener("cancel", (ae) => {
    ae.preventDefault(), ue();
  }), P?.addEventListener("click", () => {
    xe("main") && be();
  }), L?.addEventListener("click", () => {
    le();
  }), _?.addEventListener("click", (ae) => {
    const Oe = ae.target;
    (ae.target === _ || Oe?.dataset.statusModalRole === "backdrop") && le();
  }), _?.addEventListener("cancel", (ae) => {
    ae.preventDefault(), le();
  }), vd || (window.addEventListener("keydown", (ae) => {
    ae.key === "Escape" && (ue(), le());
  }), vd = !0);
  const Rt = document.getElementById(e.drawerToggleId), Ct = document.getElementById(e.drawerContentId);
  Rt?.addEventListener("click", (ae) => {
    if (e.isElementVisibleEvent(Ct)) {
      if (e.confirmDiscardSkillDraftEvent()) {
        ue(), le();
        return;
      }
      ae.preventDefault(), ae.stopPropagation(), typeof ae.stopImmediatePropagation == "function" && ae.stopImmediatePropagation();
    }
  }, !0), gd || (window.addEventListener("beforeunload", (ae) => {
    e.isSkillDraftDirtyEvent() && (ae.preventDefault(), ae.returnValue = "");
  }), gd = !0);
}
function fx(e) {
  const t = document.getElementById(e.SETTINGS_THEME_ID_Event), r = document.getElementById(e.SETTINGS_ENABLED_ID_Event), n = document.getElementById(e.SETTINGS_RULE_ID_Event), o = document.getElementById(e.SETTINGS_AI_ROLL_MODE_ID_Event), i = document.getElementById(e.SETTINGS_AI_ROUND_CONTROL_ID_Event), c = document.getElementById(e.SETTINGS_EXPLODING_ENABLED_ID_Event), u = document.getElementById(e.SETTINGS_ADVANTAGE_ENABLED_ID_Event), h = document.getElementById(e.SETTINGS_DYNAMIC_RESULT_GUIDANCE_ID_Event), f = document.getElementById(e.SETTINGS_DYNAMIC_DC_REASON_ID_Event), v = document.getElementById(e.SETTINGS_STATUS_SYSTEM_ENABLED_ID_Event), x = document.getElementById(e.SETTINGS_ALLOWED_DICE_SIDES_ID_Event), y = document.getElementById(e.SETTINGS_SUMMARY_DETAIL_ID_Event), S = document.getElementById(e.SETTINGS_SUMMARY_ROUNDS_ID_Event), _ = document.getElementById(e.SETTINGS_SCOPE_ID_Event), P = document.getElementById(e.SETTINGS_OUTCOME_BRANCHES_ID_Event), L = document.getElementById(e.SETTINGS_EXPLODE_OUTCOME_ID_Event), M = document.getElementById(e.SETTINGS_SUMMARY_OUTCOME_ID_Event), B = document.getElementById(e.SETTINGS_LIST_OUTCOME_PREVIEW_ID_Event), C = document.getElementById(e.SETTINGS_TIME_LIMIT_ENABLED_ID_Event), G = document.getElementById(e.SETTINGS_TIME_LIMIT_MIN_ID_Event);
  document.getElementById(e.SETTINGS_COMPATIBILITY_MODE_ID_Event), document.getElementById(e.SETTINGS_REMOVE_ROLLJSON_ID_Event), document.getElementById(e.SETTINGS_STRIP_INTERNAL_ID_Event);
  const F = document.getElementById(e.SETTINGS_SKILL_ENABLED_ID_Event), Z = document.querySelector("[id^='st-roll-settings-'][id$='-card']") ?? null, H = document.querySelector("#st-roll-settings-Event-skill-modal") ?? null, X = document.querySelector("#st-roll-settings-Event-status-modal") ?? null;
  t?.addEventListener("change", (K) => {
    const z = String(K.target.value || ""), se = Mm(z), ie = xb(se);
    _o(), jf(ie), hx("themeInput change", {
      rawValue: z,
      settingsValue: se,
      sdkValue: ie,
      nativeValue: t?.value
    }), Cl({
      settingsRoot: Z,
      skillModal: H,
      statusModal: X,
      selection: ie,
      themeInput: t,
      themeInputValue: se
    }), e.updateSettingsEvent({ theme: se });
  }), r?.addEventListener("input", (K) => {
    const z = !!K.target.checked;
    e.updateSettingsEvent({ enabled: z });
  }), n?.addEventListener("input", (K) => {
    const z = !!K.target.checked;
    e.updateSettingsEvent({ autoSendRuleToAI: z });
  }), o?.addEventListener("input", (K) => {
    const z = !!K.target.checked;
    e.updateSettingsEvent({ enableAiRollMode: z });
  }), i?.addEventListener("input", (K) => {
    const z = !!K.target.checked;
    e.updateSettingsEvent({ enableAiRoundControl: z });
  }), c?.addEventListener("input", (K) => {
    const z = !!K.target.checked;
    e.updateSettingsEvent({ enableExplodingDice: z });
  }), u?.addEventListener("input", (K) => {
    const z = !!K.target.checked;
    e.updateSettingsEvent({ enableAdvantageSystem: z });
  }), h?.addEventListener("input", (K) => {
    const z = !!K.target.checked;
    e.updateSettingsEvent({ enableDynamicResultGuidance: z });
  }), f?.addEventListener("input", (K) => {
    const z = !!K.target.checked;
    e.updateSettingsEvent({ enableDynamicDcReason: z });
  }), v?.addEventListener("input", (K) => {
    const z = !!K.target.checked;
    e.updateSettingsEvent({ enableStatusSystem: z });
  }), x?.addEventListener("change", (K) => {
    const z = String(K.target.value || "").trim();
    e.updateSettingsEvent({ aiAllowedDiceSidesText: z });
  }), y?.addEventListener("change", (K) => {
    const z = String(K.target.value || ""), se = z === "balanced" || z === "detailed" ? z : "minimal";
    e.updateSettingsEvent({ summaryDetailMode: se });
  }), S?.addEventListener("change", (K) => {
    const z = Number(K.target.value), se = Number.isFinite(z) ? Math.min(e.SUMMARY_HISTORY_ROUNDS_MAX_Event, Math.max(e.SUMMARY_HISTORY_ROUNDS_MIN_Event, Math.floor(z))) : e.DEFAULT_SUMMARY_HISTORY_ROUNDS_Event;
    e.updateSettingsEvent({ summaryHistoryRounds: se });
  }), _?.addEventListener("change", (K) => {
    const z = String(K.target.value || "");
    e.updateSettingsEvent({ eventApplyScope: z === "all" ? "all" : "protagonist_only" });
  }), P?.addEventListener("input", (K) => {
    const z = !!K.target.checked;
    e.updateSettingsEvent({ enableOutcomeBranches: z });
  }), L?.addEventListener("input", (K) => {
    const z = !!K.target.checked;
    e.updateSettingsEvent({ enableExplodeOutcomeBranch: z });
  }), M?.addEventListener("input", (K) => {
    const z = !!K.target.checked;
    e.updateSettingsEvent({ includeOutcomeInSummary: z });
  }), B?.addEventListener("input", (K) => {
    const z = !!K.target.checked;
    e.updateSettingsEvent({ showOutcomePreviewInListCard: z });
  }), C?.addEventListener("input", (K) => {
    const z = !!K.target.checked;
    e.updateSettingsEvent({ enableTimeLimit: z });
  }), G?.addEventListener("change", (K) => {
    const z = Number(K.target.value), se = Number.isFinite(z) ? Math.max(1, Math.floor(z)) : 10;
    e.updateSettingsEvent({ minTimeLimitSeconds: se });
  }), F?.addEventListener("input", (K) => {
    const z = !!K.target.checked;
    e.updateSettingsEvent({ enableSkillSystem: z });
  });
}
function gx(e) {
  const t = document.getElementById(e.SETTINGS_RULE_TEXT_ID_Event), r = document.getElementById(e.SETTINGS_RULE_SAVE_ID_Event), n = document.getElementById(e.SETTINGS_RULE_RESET_ID_Event);
  r?.addEventListener("click", () => {
    const o = String(t?.value ?? "");
    e.updateSettingsEvent({ ruleText: o });
  }), n?.addEventListener("click", () => {
    t && (t.value = ""), e.updateSettingsEvent({ ruleText: "" });
  });
}
function vx(e) {
  const t = document.getElementById(e.SETTINGS_CARD_ID_Event);
  t?.dataset.stRollMountedBound !== "1" && (t && (t.dataset.stRollMountedBound = "1"), px({
    drawerToggleId: e.drawerToggleId,
    drawerContentId: e.drawerContentId,
    ...e.tabsAndModalDepsEvent
  }), fx(e.basicSettingsInputsDepsEvent), w0(e.skillPresetActionsDepsEvent), A0(e.skillRowsEditingActionsDepsEvent), $0(e.skillImportExportActionsDepsEvent), cx(e.statusEditorActionsDepsEvent), gx(e.ruleTextActionsDepsEvent));
}
function bx(e) {
  const t = e.getSettingsEvent(), r = document.getElementById(e.SETTINGS_CARD_ID_Event), n = document.getElementById(e.SETTINGS_THEME_ID_Event), o = document.getElementById(e.SETTINGS_ENABLED_ID_Event), i = document.getElementById(e.SETTINGS_RULE_ID_Event), c = document.getElementById(e.SETTINGS_AI_ROLL_MODE_ID_Event), u = document.getElementById(e.SETTINGS_AI_ROUND_CONTROL_ID_Event), h = document.getElementById(e.SETTINGS_EXPLODING_ENABLED_ID_Event), f = document.getElementById(e.SETTINGS_ADVANTAGE_ENABLED_ID_Event), v = document.getElementById(e.SETTINGS_DYNAMIC_RESULT_GUIDANCE_ID_Event), x = document.getElementById(e.SETTINGS_DYNAMIC_DC_REASON_ID_Event), y = document.getElementById(e.SETTINGS_STATUS_SYSTEM_ENABLED_ID_Event), S = document.getElementById(e.SETTINGS_ALLOWED_DICE_SIDES_ID_Event), _ = document.getElementById(e.SETTINGS_SUMMARY_DETAIL_ID_Event), P = document.getElementById(e.SETTINGS_SUMMARY_ROUNDS_ID_Event), L = document.getElementById(e.SETTINGS_SCOPE_ID_Event), M = document.getElementById(e.SETTINGS_OUTCOME_BRANCHES_ID_Event), B = document.getElementById(e.SETTINGS_EXPLODE_OUTCOME_ID_Event), C = document.getElementById(e.SETTINGS_SUMMARY_OUTCOME_ID_Event), G = document.getElementById(e.SETTINGS_LIST_OUTCOME_PREVIEW_ID_Event), F = document.getElementById(e.SETTINGS_TIME_LIMIT_ENABLED_ID_Event), Z = document.getElementById(e.SETTINGS_TIME_LIMIT_MIN_ID_Event), H = document.getElementById(e.SETTINGS_TIME_LIMIT_ROW_ID_Event);
  document.getElementById(e.SETTINGS_COMPATIBILITY_MODE_ID_Event), document.getElementById(e.SETTINGS_REMOVE_ROLLJSON_ID_Event), document.getElementById(e.SETTINGS_STRIP_INTERNAL_ID_Event);
  const X = document.getElementById(e.SETTINGS_SKILL_ENABLED_ID_Event), K = document.getElementById(e.SETTINGS_SKILL_MODAL_ID_Event), z = document.getElementById(e.SETTINGS_STATUS_EDITOR_OPEN_ID_Event), se = document.getElementById(e.SETTINGS_STATUS_MODAL_ID_Event), ie = document.getElementById(e.SETTINGS_RULE_TEXT_ID_Event), ue = r?.querySelector(".st-roll-content") ?? r ?? null, Ae = Jn(Ii().themeId), le = Sl(Ae);
  if (n && (n.value = le), o && (o.checked = !!t.enabled), i && (i.checked = !!t.autoSendRuleToAI), c && (c.checked = !!t.enableAiRollMode), u && (u.checked = !!t.enableAiRoundControl), h && (h.checked = !!t.enableExplodingDice), f && (f.checked = !!t.enableAdvantageSystem), v && (v.checked = !!t.enableDynamicResultGuidance), x && (x.checked = !!t.enableDynamicDcReason), y && (y.checked = !!t.enableStatusSystem), S && (S.value = String(t.aiAllowedDiceSidesText || "")), _ && (_.value = t.summaryDetailMode), P && (P.value = String(t.summaryHistoryRounds)), L && (L.value = t.eventApplyScope), M && (M.checked = !!t.enableOutcomeBranches), B && (B.checked = !!t.enableExplodeOutcomeBranch), C && (C.checked = !!t.includeOutcomeInSummary), G && (G.checked = !!t.showOutcomePreviewInListCard), B && (B.disabled = !t.enableOutcomeBranches, B.style.opacity = t.enableOutcomeBranches ? "1" : "0.5"), C && (C.disabled = !t.enableOutcomeBranches, C.style.opacity = t.enableOutcomeBranches ? "1" : "0.5"), G && (G.disabled = !t.enableOutcomeBranches, G.style.opacity = t.enableOutcomeBranches ? "1" : "0.5"), F && (F.checked = !!t.enableTimeLimit), Z && (Z.value = String(t.minTimeLimitSeconds), Z.disabled = !t.enableTimeLimit, Z.style.opacity = t.enableTimeLimit ? "1" : "0.5"), H?.classList.toggle("is-disabled", !t.enableTimeLimit), X && (X.checked = !!t.enableSkillSystem), z && (z.disabled = !t.enableStatusSystem, z.style.opacity = t.enableStatusSystem ? "1" : "0.5"), Cl({
    settingsRoot: r,
    skillModal: K,
    statusModal: se,
    selection: Ae,
    themeInput: n,
    themeInputValue: le,
    syncSharedSelectsEvent: !1
  }), Di(ue ?? document), document.getElementById(e.SETTINGS_STATUS_ROWS_ID_Event)) {
    const be = String(e.getActiveChatKeyEvent() ?? "").trim();
    be && (Rh({
      SETTINGS_STATUS_ROWS_ID_Event: e.SETTINGS_STATUS_ROWS_ID_Event,
      SETTINGS_STATUS_DIRTY_HINT_ID_Event: e.SETTINGS_STATUS_DIRTY_HINT_ID_Event,
      getActiveChatKeyEvent: () => be,
      getActiveStatusesEvent: e.getActiveStatusesEvent
    }), dx(be) || We(e.SETTINGS_STATUS_ERRORS_ID_Event, []));
  }
  if (!e.isSkillDraftDirtyEvent()) {
    const be = String(t.skillTableText ?? "{}"), we = String(t.skillPresetStoreText ?? ""), Pe = document.getElementById(e.SETTINGS_SKILL_ROWS_ID_Event);
    (be !== e.getSkillEditorLastSettingsTextEvent() || we !== e.getSkillEditorLastPresetStoreTextEvent() || !Pe || !Pe.hasChildNodes()) && e.hydrateSkillDraftFromSettingsEvent();
  }
  if (ie) {
    const be = typeof t.ruleText == "string" ? t.ruleText : "";
    ie.value !== be && (ie.value = be);
  }
}
function xx(e) {
  let t = [], r = "[]", n = "", o = "", i = "", c = !1, u = "";
  function h(M) {
    c = !!M;
    const B = document.getElementById(e.SETTINGS_SKILL_DIRTY_HINT_ID_Event);
    B && (B.hidden = !c);
  }
  function f() {
    return c;
  }
  function v() {
    h(e.buildSkillDraftSnapshotEvent(t) !== r);
  }
  function x(M) {
    N0(M, {
      SETTINGS_SKILL_ERRORS_ID_Event: e.SETTINGS_SKILL_ERRORS_ID_Event,
      escapeHtmlEvent: e.escapeHtmlEvent
    });
  }
  function y() {
    const M = /* @__PURE__ */ new Set();
    for (const B of t) {
      const C = String(B.skillName ?? "").trim().toLowerCase();
      C && M.add(C);
    }
    return M.size;
  }
  function S() {
    const M = e.getSettingsEvent(), B = e.getSkillPresetStoreEvent(M), C = y();
    L0(B, {
      SETTINGS_SKILL_PRESET_LIST_ID_Event: e.SETTINGS_SKILL_PRESET_LIST_ID_Event,
      countSkillEntriesFromSkillTableTextEvent: e.countSkillEntriesFromSkillTableTextEvent,
      escapeAttrEvent: e.escapeAttrEvent,
      escapeHtmlEvent: e.escapeHtmlEvent,
      activeDraftCountEvent: C
    }), M0(B, {
      SETTINGS_SKILL_PRESET_META_ID_Event: e.SETTINGS_SKILL_PRESET_META_ID_Event,
      SETTINGS_SKILL_PRESET_NAME_ID_Event: e.SETTINGS_SKILL_PRESET_NAME_ID_Event,
      SETTINGS_SKILL_PRESET_DELETE_ID_Event: e.SETTINGS_SKILL_PRESET_DELETE_ID_Event,
      countSkillEntriesFromSkillTableTextEvent: e.countSkillEntriesFromSkillTableTextEvent,
      getActiveSkillPresetEvent: e.getActiveSkillPresetEvent,
      activeDraftCountEvent: C
    });
  }
  function _() {
    O0(t, {
      SETTINGS_SKILL_ROWS_ID_Event: e.SETTINGS_SKILL_ROWS_ID_Event,
      escapeAttrEvent: e.escapeAttrEvent
    }), S();
  }
  function P(M = !1) {
    if (!M && f()) return;
    const B = e.getSettingsEvent(), C = e.getSkillPresetStoreEvent(B), G = JSON.stringify(C, null, 2), F = e.getActiveSkillPresetEvent(C), Z = e.normalizeSkillTableTextForSettingsEvent(F.skillTableText), H = Z ?? "{}";
    Z == null ? (t = [], u !== F.skillTableText && (u = F.skillTableText, de.warn("技能预设配置无效，已按空表载入"), e.appendToConsoleEvent("技能预设配置格式无效，已按空表载入。", "warn"))) : (u = "", t = e.deserializeSkillTableTextToRowsEvent(H)), i = F.id, r = e.buildSkillDraftSnapshotEvent(t), n = H, o = G, h(!1), x([]), _();
  }
  function L() {
    return R0({
      isSkillDraftDirtyEvent: f,
      hydrateSkillDraftFromSettingsEvent: P
    });
  }
  return {
    setSkillDraftDirtyEvent: h,
    isSkillDraftDirtyEvent: f,
    refreshSkillDraftDirtyStateEvent: v,
    renderSkillRowsEvent: _,
    renderSkillValidationErrorsEvent: x,
    hydrateSkillDraftFromSettingsEvent: P,
    confirmDiscardSkillDraftEvent: L,
    getSkillRowsDraftEvent: () => t,
    setSkillRowsDraftEvent: (M) => {
      t = M;
    },
    getSkillEditorActivePresetIdEvent: () => i,
    setSkillEditorLastSavedSnapshotEvent: (M) => {
      r = M;
    },
    getSkillEditorLastSavedSnapshotEvent: () => r,
    getSkillEditorLastSettingsTextEvent: () => n,
    getSkillEditorLastPresetStoreTextEvent: () => o
  };
}
function yx() {
  return `
      <div>
        通用掷骰命令，支持 <code>NdM[!][khX|klX][+/-B]</code>：
      </div>
      <ul>
        <li><code>/roll</code>（等同于 <code>/roll 1d20</code>）</li>
        <li><code>/roll 1d20</code></li>
        <li><code>/roll 3d6+2</code></li>
        <li><code>/roll 2d10-1</code></li>
        <li><code>/roll 1d6!+2</code>（<code>!</code> 表示爆骰）</li>
        <li><code>/roll 2d20kh1</code>（保留最高 1 个）</li>
        <li><code>/roll 2d20kl1</code>（保留最低 1 个）</li>
      </ul>
      <div>
        结果可通过
        <code>{{lastRoll}}</code> / <code>{{lastRollTotal}}</code> 读取。
      </div>
    `;
}
function Sx() {
  return `
  <div>
    <div><strong>/eventroll 命令帮助</strong></div>
    <ul>
      <li><code>/eventroll list</code>：列出当前轮次事件</li>
      <li><code>/eventroll roll &lt;eventId&gt;</code>：掷指定事件</li>
      <li><code>/eventroll roll &lt;eventId&gt; &lt;diceExpr&gt;</code>：用自定义骰式覆盖默认骰式</li>
      <li><code>/eventroll help</code>：显示帮助</li>
    </ul>
    <div>
      <strong>rolljson 结果分支（outcomes）</strong>：
      <code>events[i].outcomes.success</code> / <code>failure</code> / <code>explode</code>.
      当 <code>checkDice</code> 含 <code>!</code> 且触发爆骰时，优先使用 <code>explode</code>。
    </div>
    <div>
      <strong>优势 / 劣势</strong>：
      你可以把 <code>events[i].advantageState</code> 设为
      <code>normal</code> / <code>advantage</code> / <code>disadvantage</code>,
      也可以直接在 <code>checkDice</code> 里写保留语法，例如
      <code>2d20kh1</code> / <code>2d20kl1</code>.
      表达式里的保留语法优先级高于 <code>advantageState</code>。
    </div>
    <div>
      <strong>动态规则注入</strong>：
      系统会根据当前设置自动注入可用能力（如爆骰、优势/劣势、走向分支）。
      爆骰与优劣骰会改变判定结果，并通过 <code>outcomes</code> 直接影响剧情走向。
    </div>
    <div>
      <strong>事件目标</strong>：
      可选 <code>events[i].target = { type, name? }</code>，其中
      <code>type</code> 可为 <code>self</code>/<code>scene</code>/<code>supporting</code>/<code>object</code>/<code>other</code>。
    </div>
  </div>`;
}
function Ex(e) {
  return `<pre>${e}</pre>`;
}
function _x(e) {
  return `骰子调试模式
<pre>${e}</pre>`;
}
function Tx(e) {
  const { registerMacro: t, SlashCommandParser: r, SlashCommand: n, SlashCommandArgument: o, ARGUMENT_TYPE: i, getDiceMeta: c, rollExpression: u, saveLastRoll: h, buildResultMessage: f, appendToConsoleEvent: v } = e, x = globalThis;
  x.__stRollBaseMacrosRegisteredEvent || (t("lastRollTotal", () => {
    const y = c();
    return y.lastTotal == null ? "尚未掷骰，请先使用 /roll" : String(y.lastTotal);
  }), t("lastRoll", () => {
    const y = c();
    return y.last ? JSON.stringify(y.last, null, 2) : "尚未掷骰，请先使用 /roll";
  }), x.__stRollBaseMacrosRegisteredEvent = !0), !x.__stRollBaseCommandRegisteredEvent && (!r || !n || !o || !i || (r.addCommandObject(n.fromProps({
    name: "roll",
    aliases: ["dice"],
    returns: "通用骰子：支持 NdM+X，例如 3d6+2、1d20",
    namedArgumentList: [],
    unnamedArgumentList: [o.fromProps({
      description: "骰子表达式（如 1d20、3d6+2）。留空等于 1d20。",
      typeList: i.STRING,
      isRequired: !1
    })],
    helpString: yx(),
    callback: (y, S) => {
      try {
        const _ = u((S ?? "").toString().trim() || "1d20");
        return h(_), v(f(_)), "";
      } catch (_) {
        return v(`掷骰出错：${_?.message ?? String(_)}`, "error"), "";
      }
    }
  })), x.__stRollBaseCommandRegisteredEvent = !0));
}
function Ch(e) {
  return e === 0 ? "0" : e > 0 ? `+${e}` : `${e}`;
}
function Ka(e) {
  return e.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;").replace(/`/g, "&#96;");
}
function kx(e) {
  const t = [], r = Array.isArray(e.rolls) && e.rolls.length > 0 ? `[${e.rolls.join(", ")}]` : "[]", n = Number.isFinite(Number(e.rawTotal)) ? Number(e.rawTotal) : 0, o = Number.isFinite(Number(e.modifier)) ? Number(e.modifier) : 0, i = Number.isFinite(Number(e.total)) ? Number(e.total) : n + o;
  return t.push(`骰面 ${r}`), t.push(`原始值 ${n}`), t.push(`修正值 ${Ch(o)}`), t.push(`总计 ${i}`), e.exploding && t.push(e.explosionTriggered ? "爆骰已触发" : "爆骰已启用"), t.join(" | ");
}
function fi(e, t, r, n = 56) {
  return t === 6 ? `
      <svg width="${n}" height="${n}" viewBox="0 0 48 48" style="display:inline-block; vertical-align: middle;">
          <rect x="4" y="4" width="40" height="40" rx="8" ry="8" fill="none" stroke="${r}" stroke-width="3" />
          ${({
    1: [[24, 24]],
    2: [[14, 14], [34, 34]],
    3: [
      [14, 14],
      [24, 24],
      [34, 34]
    ],
    4: [
      [14, 14],
      [14, 34],
      [34, 14],
      [34, 34]
    ],
    5: [
      [14, 14],
      [14, 34],
      [24, 24],
      [34, 14],
      [34, 34]
    ],
    6: [
      [14, 14],
      [14, 24],
      [14, 34],
      [34, 14],
      [34, 24],
      [34, 34]
    ]
  }[e] || []).map(([c, u]) => `<circle cx="${c}" cy="${u}" r="4" fill="${r}" />`).join("")}
      </svg>` : `
      <svg width="${n}" height="${n}" viewBox="0 0 48 48" style="display:inline-block; vertical-align: middle;">
          <path d="M24 4 L43 14 L43 34 L24 44 L5 34 L5 14 Z" fill="none" stroke="${r}" stroke-width="3" />
          <path d="M24 4 L24 24 M24 24 L43 34 M24 24 L5 34" stroke="${r}" stroke-width="1.5" opacity="0.6"/>
          <text x="24" y="33" font-size="18" text-anchor="middle" fill="${r}" font-weight="bold" style="font-family: sans-serif;">${e}</text>
      </svg>`;
}
function Dh(e, t = 52) {
  const r = Math.round(t / 2), n = Math.max(20, Math.round(t * 0.42));
  return `
    <div class="cube-scene" style="perspective: 600px; width: ${t}px; height: ${t}px;">
      <div class="cube" style="
        width: 100%; height: 100%; position: relative; transform-style: preserve-3d;
      ">
        <div class="cube-face front"  style="position: absolute; width: ${t}px; height: ${t}px; border: 2px solid ${e}; background: rgba(43, 29, 29, 0.8); color: ${e}; line-height: ${t}px; text-align: center; font-weight: bold; font-size: ${n}px; transform: rotateY(  0deg) translateZ(${r}px);">?</div>
        <div class="cube-face back"   style="position: absolute; width: ${t}px; height: ${t}px; border: 2px solid ${e}; background: rgba(43, 29, 29, 0.8); color: ${e}; line-height: ${t}px; text-align: center; font-weight: bold; font-size: ${n}px; transform: rotateY(180deg) translateZ(${r}px);">?</div>
        <div class="cube-face right"  style="position: absolute; width: ${t}px; height: ${t}px; border: 2px solid ${e}; background: rgba(43, 29, 29, 0.8); color: ${e}; line-height: ${t}px; text-align: center; font-weight: bold; font-size: ${n}px; transform: rotateY( 90deg) translateZ(${r}px);">?</div>
        <div class="cube-face left"   style="position: absolute; width: ${t}px; height: ${t}px; border: 2px solid ${e}; background: rgba(43, 29, 29, 0.8); color: ${e}; line-height: ${t}px; text-align: center; font-weight: bold; font-size: ${n}px; transform: rotateY(-90deg) translateZ(${r}px);">?</div>
        <div class="cube-face top"    style="position: absolute; width: ${t}px; height: ${t}px; border: 2px solid ${e}; background: rgba(43, 29, 29, 0.8); color: ${e}; line-height: ${t}px; text-align: center; font-weight: bold; font-size: ${n}px; transform: rotateX( 90deg) translateZ(${r}px);">?</div>
        <div class="cube-face bottom" style="position: absolute; width: ${t}px; height: ${t}px; border: 2px solid ${e}; background: rgba(43, 29, 29, 0.8); color: ${e}; line-height: ${t}px; text-align: center; font-weight: bold; font-size: ${n}px; transform: rotateX(-90deg) translateZ(${r}px);">?</div>
      </div>
    </div>
  `;
}
function wx(e) {
  const t = Ch(e.modifier), r = e.rolls.join(", "), n = e.modifier !== 0, o = "d" + Math.random().toString(36).substr(2, 9), i = {
    border: "#c5a059",
    bg: "linear-gradient(135deg, #2b1d1d 0%, #1a1010 100%)",
    headerBg: "rgba(0, 0, 0, 0.4)",
    textMain: "#e8dcb5",
    textHighlight: "#ffdb78",
    critSuccess: "#4caf50",
    critFail: "#f44336"
  };
  let c = "normal", u = "", h = i.textHighlight, f = "0 2px 4px rgba(0,0,0,0.5)", v = i.bg, x = i.border;
  if (e.count === 1) {
    const B = e.rolls[0];
    B === e.sides ? (c = "success", u = "大成功！", h = i.critSuccess, f = "0 0 15px rgba(76, 175, 80, 0.8)", v = "linear-gradient(135deg, #1b3320 0%, #0d1a10 100%)", x = i.critSuccess) : B === 1 && (c = "fail", u = "大失败！", h = i.critFail, f = "0 0 15px rgba(244, 67, 54, 0.8)", v = "linear-gradient(135deg, #331b1b 0%, #1a0d0d 100%)", x = i.critFail);
  }
  const y = e.rolls.length <= 5, S = kx(e), _ = y ? e.rolls.map((B, C) => {
    const G = fi(B, e.sides, h);
    return `<span style="display:inline-flex;cursor:help;" data-tip="${Ka(`${S} | 第${C + 1}颗: ${B}`)}">${G}</span>`;
  }).join(" ") : `<span style="display:inline-flex;cursor:help;" data-tip="${Ka(S)}">${fi(0, e.sides, h)}</span>`, P = Dh(i.textHighlight), L = [];
  e.rolls.length && L.push(`骰面: [${r}]`), n && L.push(`修正值: ${t}`), e.exploding && L.push(e.explosionTriggered ? "爆骰已触发" : "爆骰已启用");
  const M = L.join(" | ");
  return `
  <style>
    @keyframes spin-3d-${o} {
      0% { transform: rotateX(0deg) rotateY(0deg); }
      100% { transform: rotateX(360deg) rotateY(360deg); }
    }
    @keyframes fade-out-${o} {
      0% { opacity: 1; }
      90% { opacity: 0; }
      100% { opacity: 0; display: none; }
    }
    @keyframes fade-in-${o} {
      0% { opacity: 0; transform: scale(0.8); }
      100% { opacity: 1; transform: scale(1); }
    }
    @keyframes pulse-crit-${o} {
      0% { transform: scale(1); }
      50% { transform: scale(1.1); }
      100% { transform: scale(1); }
    }
    @keyframes shake-crit-${o} {
      0% { transform: translate(1px, 1px) rotate(0deg); }
      10% { transform: translate(-1px, -2px) rotate(-1deg); }
      20% { transform: translate(-3px, 0px) rotate(1deg); }
      30% { transform: translate(3px, 2px) rotate(0deg); }
      40% { transform: translate(1px, -1px) rotate(1deg); }
      50% { transform: translate(-1px, 2px) rotate(-1deg); }
      60% { transform: translate(-3px, 1px) rotate(0deg); }
      70% { transform: translate(3px, 1px) rotate(-1deg); }
      80% { transform: translate(-1px, -1px) rotate(1deg); }
      90% { transform: translate(1px, 2px) rotate(0deg); }
      100% { transform: translate(1px, -2px) rotate(-1deg); }
    }
    
    .dice-wrapper-${o} {
      position: relative;
      min-height: 100px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }
    
    .dice-rolling-${o} {
      position: absolute;
      top: 50%; left: 50%;
      transform: translate(-50%, -50%);
      animation: fade-out-${o} 0.2s forwards 1.2s;
      z-index: 10;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    
    .dice-rolling-${o} .cube {
      animation: spin-3d-${o} 1.5s linear infinite;
    }

    .dice-result-${o} {
      opacity: 0;
      animation: fade-in-${o} 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards 1.3s;
      text-align: center;
      width: 100%;
    }

    .crit-success-${o} {
      animation: pulse-crit-${o} 1s infinite;
      color: ${i.critSuccess};
      font-weight: bold;
      margin-bottom: 8px;
      text-shadow: 0 0 10px rgba(76, 175, 80, 0.5);
    }

    .crit-fail-${o} {
      animation: shake-crit-${o} 0.5s;
      color: ${i.critFail};
      font-weight: bold;
      margin-bottom: 8px;
      text-shadow: 0 0 10px rgba(244, 67, 54, 0.5);
    }

    .explosion-note-${o} {
      color: #ffae42;
      font-weight: bold;
      margin-bottom: 8px;
      letter-spacing: 1px;
      text-shadow: 0 0 12px rgba(255, 174, 66, 0.6);
    }
  </style>
  
  <div style="
    border: 2px solid ${x};
    border-radius: 4px;
    background: ${v};
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.5), inset 0 0 30px rgba(0,0,0,0.6);
    font-family: 'Georgia', 'Times New Roman', serif;
    overflow: hidden;
    margin: 8px 0;
    width: 100%;
    box-sizing: border-box;
    color: ${i.textMain};
    position: relative;
  ">
    <div style="position: absolute; top: 0; left: 0; width: 6px; height: 6px; border-top: 2px solid ${i.border}; border-left: 2px solid ${i.border};"></div>
    <div style="position: absolute; top: 0; right: 0; width: 6px; height: 6px; border-top: 2px solid ${i.border}; border-right: 2px solid ${i.border};"></div>
    <div style="position: absolute; bottom: 0; left: 0; width: 6px; height: 6px; border-bottom: 2px solid ${i.border}; border-left: 2px solid ${i.border};"></div>
    <div style="position: absolute; bottom: 0; right: 0; width: 6px; height: 6px; border-bottom: 2px solid ${i.border}; border-right: 2px solid ${i.border};"></div>

    <div style="
        background-color: ${i.headerBg};
        padding: 8px 12px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid rgba(197, 160, 89, 0.3);
        font-size: 0.9em;
        letter-spacing: 1px;
        text-transform: uppercase;
    ">
        <span style="display: flex; align-items: center; gap: 8px; color: ${i.textHighlight};">
            <span style="font-weight: bold;">骰子系统</span>
        </span>
        <span style="
            font-family: monospace;
            color: ${i.textMain};
            background: rgba(0,0,0,0.3);
            padding: 2px 8px;
            border: 1px solid rgba(197, 160, 89, 0.2);
            border-radius: 2px;
            font-size: 0.9em;
        ">${e.expr}</span>
    </div>

    <div class="dice-wrapper-${o}">
        <div class="dice-rolling-${o}">
            ${P}
        </div>

        <div class="dice-result-${o}">
            ${u ? `<div class="${c === "success" ? `crit-success-${o}` : `crit-fail-${o}`}">${u}</div>` : ""}
          ${e.exploding ? `<div class="explosion-note-${o}">${e.explosionTriggered ? "连锁爆骰！" : "爆骰已开启"}</div>` : ""}
            
            <div style="margin-bottom: 12px; display: flex; justify-content: center; gap: 8px; flex-wrap: wrap;" data-tip="${Ka(S)}">
                ${_}
            </div>

            <div style="
                font-size: 2.5em;
                font-weight: bold;
                color: ${h};
                text-shadow: ${f};
                line-height: 1;
            ">
                ${e.total}
            </div>
            
            <div style="
                font-size: 0.9em;
                color: ${i.textMain};
                margin-top: 8px;
                opacity: 0.8;
            ">
              ${M}
            </div>
        </div>

    </div>
  </div>
  `;
}
function Ix(e) {
  const t = e.compactMode === !0, r = t ? "92px" : "108px", n = t ? "8px 0" : "14px 0", o = t ? "0" : "12px", i = t ? "auto" : "100%";
  return `
    <style>
      @keyframes spin-3d-${e.uniqueId} {
        0% { transform: rotateX(0deg) rotateY(0deg); }
        100% { transform: rotateX(360deg) rotateY(360deg); }
      }
      @keyframes fade-out-${e.uniqueId} {
        0% { opacity: 1; }
        90% { opacity: 0; }
        100% { opacity: 0; display: none; }
      }
      @keyframes fade-in-${e.uniqueId} {
        0% { opacity: 0; transform: scale(0.8); }
        100% { opacity: 1; transform: scale(1); }
      }
      @keyframes pulse-crit-${e.uniqueId} {
        0% { transform: scale(1); }
        50% { transform: scale(1.1); }
        100% { transform: scale(1); }
      }
      @keyframes shake-crit-${e.uniqueId} {
        0% { transform: translate(1px, 1px) rotate(0deg); }
        10% { transform: translate(-1px, -2px) rotate(-1deg); }
        20% { transform: translate(-3px, 0px) rotate(1deg); }
        30% { transform: translate(3px, 2px) rotate(0deg); }
        40% { transform: translate(1px, -1px) rotate(1deg); }
        50% { transform: translate(-1px, 2px) rotate(-1deg); }
        60% { transform: translate(-3px, 1px) rotate(0deg); }
        70% { transform: translate(3px, 1px) rotate(-1deg); }
        80% { transform: translate(-1px, -1px) rotate(1deg); }
        90% { transform: translate(1px, 2px) rotate(0deg); }
        100% { transform: translate(1px, -2px) rotate(-1deg); }
      }
      
      .dice-wrapper-${e.uniqueId} {
        position: relative;
        min-height: ${r};
        padding: ${n};
        margin-top: ${o};
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
      }
      
      .dice-rolling-${e.uniqueId} {
        position: absolute;
        top: 50%; left: 50%;
        transform: translate(-50%, -50%);
        animation: fade-out-${e.uniqueId} 0.2s forwards 1.2s;
        z-index: 10;
        display: flex;
        justify-content: center;
        align-items: center;
      }
      
      .dice-rolling-${e.uniqueId} .cube {
        animation: spin-3d-${e.uniqueId} 1.5s linear infinite;
      }

      .dice-result-${e.uniqueId} {
        opacity: 0;
        animation: fade-in-${e.uniqueId} 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards 1.3s;
        text-align: center;
        width: ${i};
      }

      .crit-success-${e.uniqueId} {
        animation: pulse-crit-${e.uniqueId} 1s infinite;
        color: #52c41a;
        font-weight: bold;
        margin-bottom: 8px;
        text-shadow: 0 0 10px rgba(82, 196, 26, 0.5);
      }

      .crit-fail-${e.uniqueId} {
        animation: shake-crit-${e.uniqueId} 0.5s;
        color: #ff4d4f;
        font-weight: bold;
        margin-bottom: 8px;
        text-shadow: 0 0 10px rgba(255, 77, 79, 0.5);
      }
    </style>
    
    <div class="dice-wrapper-${e.uniqueId}">
        <div class="dice-rolling-${e.uniqueId}">
            ${e.rollingVisualHtml}
        </div>

        <div class="dice-result-${e.uniqueId}">
            ${e.critText ? `<div class="${e.critType === "success" ? `crit-success-${e.uniqueId}` : `crit-fail-${e.uniqueId}`}">${e.critText}</div>` : ""}
             
            <div style="margin-bottom: 8px; display: flex; justify-content: center; gap: 8px; flex-wrap: wrap;">
                ${e.diceVisualsHtml}
            </div>
        </div>
    </div>
    `;
}
var bo = "stx_memory_os", Nh = "stx_rollhelper";
async function Ax(e = 1200) {
  try {
    const t = await ki("plugin:request:ping", {}, Nh, {
      to: bo,
      timeoutMs: e
    });
    return {
      available: !!t?.alive,
      enabled: !!t?.isEnabled,
      pluginId: String(t?.pluginId ?? "stx_memory_os"),
      version: String(t?.version ?? ""),
      capabilities: Array.isArray(t?.capabilities) ? t.capabilities.map((r) => String(r)) : []
    };
  } catch {
    return {
      available: !1,
      enabled: !1,
      pluginId: bo,
      version: "",
      capabilities: []
    };
  }
}
async function $x(e = 1200) {
  try {
    const t = await ki("plugin:request:memory_chat_keys", {}, Nh, {
      to: bo,
      timeoutMs: e
    }), r = Array.isArray(t?.chatKeys) ? t.chatKeys.map((n) => String(n ?? "").trim()).filter(Boolean) : [];
    return {
      chatKeys: Array.from(new Set(r)),
      updatedAt: Number.isFinite(Number(t?.updatedAt)) ? Number(t.updatedAt) : null
    };
  } catch {
    return {
      chatKeys: [],
      updatedAt: null
    };
  }
}
function Rx(e) {
  try {
    return lf("plugin:broadcast:state_changed", (t) => {
      const r = String(t?.pluginId ?? "");
      r && r !== "stx_memory_os" || e({
        enabled: !!t?.isEnabled,
        pluginId: r || "stx_memory_os"
      });
    }, { from: bo });
  } catch {
    return () => {
    };
  }
}
var et = xx({
  SETTINGS_SKILL_DIRTY_HINT_ID_Event: ku,
  SETTINGS_SKILL_ERRORS_ID_Event: Tu,
  SETTINGS_SKILL_COLS_ID_Event: al,
  SETTINGS_SKILL_ROWS_ID_Event: $o,
  SETTINGS_SKILL_PRESET_LIST_ID_Event: il,
  SETTINGS_SKILL_PRESET_META_ID_Event: Du,
  SETTINGS_SKILL_PRESET_NAME_ID_Event: cl,
  SETTINGS_SKILL_PRESET_DELETE_ID_Event: ll,
  getSettingsEvent: Ee,
  getSkillPresetStoreEvent: oi,
  getActiveSkillPresetEvent: ao,
  normalizeSkillTableTextForSettingsEvent: an,
  deserializeSkillTableTextToRowsEvent: Zm,
  buildSkillDraftSnapshotEvent: Jm,
  countSkillEntriesFromSkillTableTextEvent: Ub,
  appendToConsoleEvent: Er,
  escapeHtmlEvent: un,
  escapeAttrEvent: gl
});
function Cx(e, t, r) {
  return v0({
    ...zg,
    drawerToggleId: e,
    drawerContentId: t,
    drawerIconId: r
  });
}
var Lh = et.isSkillDraftDirtyEvent, bd = et.refreshSkillDraftDirtyStateEvent, xd = et.renderSkillRowsEvent, Ha = et.renderSkillValidationErrorsEvent, Dx = et.hydrateSkillDraftFromSettingsEvent, yd = et.confirmDiscardSkillDraftEvent, Sd = I0({
  getRowsEvent: et.getSkillRowsDraftEvent,
  setRowsEvent: et.setSkillRowsDraftEvent,
  getSnapshotEvent: et.getSkillEditorLastSavedSnapshotEvent,
  setSnapshotEvent: et.setSkillEditorLastSavedSnapshotEvent
});
function Nx(e, t) {
  vx({
    SETTINGS_CARD_ID_Event: Gn,
    drawerToggleId: e,
    drawerContentId: t,
    tabsAndModalDepsEvent: {
      ...jg,
      confirmDiscardSkillDraftEvent: yd,
      isElementVisibleEvent: C0,
      isSkillDraftDirtyEvent: Lh
    },
    basicSettingsInputsDepsEvent: {
      ...Hs,
      SUMMARY_HISTORY_ROUNDS_MAX_Event: 10,
      SUMMARY_HISTORY_ROUNDS_MIN_Event: 1,
      DEFAULT_SUMMARY_HISTORY_ROUNDS_Event: Pn.summaryHistoryRounds,
      updateSettingsEvent: Fn
    },
    skillPresetActionsDepsEvent: {
      ...qg,
      SKILL_PRESET_DEFAULT_ID_Event: Co,
      SKILL_PRESET_NEW_NAME_BASE_Event: rm,
      DEFAULT_SKILL_PRESET_TABLE_TEXT_Event: nm,
      getSkillEditorActivePresetIdEvent: et.getSkillEditorActivePresetIdEvent,
      confirmDiscardSkillDraftEvent: yd,
      getSettingsEvent: Ee,
      getSkillPresetStoreEvent: oi,
      getSkillPresetByIdEvent: ai,
      saveSkillPresetStoreEvent: Wc,
      getActiveSkillPresetEvent: ao,
      getUniqueSkillPresetNameEvent: Kb,
      createIdEvent: Rr,
      buildDefaultSkillPresetStoreEvent: () => on(),
      normalizeSkillPresetNameKeyEvent: Vn,
      renderSkillValidationErrorsEvent: Ha,
      appendToConsoleEvent: Er
    },
    skillRowsEditingActionsDepsEvent: {
      ...Fg,
      skillDraftAccessorEvent: Sd,
      createSkillEditorRowDraftEvent: Xm,
      renderSkillRowsEvent: xd,
      refreshSkillDraftDirtyStateEvent: bd,
      renderSkillValidationErrorsEvent: Ha
    },
    skillImportExportActionsDepsEvent: {
      ...Vg,
      skillDraftAccessorEvent: Sd,
      serializeSkillRowsToSkillTableTextEvent: zb,
      getSettingsEvent: Ee,
      getSkillPresetStoreEvent: oi,
      getActiveSkillPresetEvent: ao,
      normalizeSkillTableTextForSettingsEvent: an,
      deserializeSkillTableTextToRowsEvent: Zm,
      validateSkillRowsEvent: eh,
      renderSkillRowsEvent: xd,
      refreshSkillDraftDirtyStateEvent: bd,
      renderSkillValidationErrorsEvent: Ha,
      copyTextToClipboardEvent: D0,
      appendToConsoleEvent: Er,
      buildSkillDraftSnapshotEvent: Jm,
      setSkillDraftDirtyEvent: et.setSkillDraftDirtyEvent,
      saveSkillPresetStoreEvent: Wc
    },
    statusEditorActionsDepsEvent: {
      SETTINGS_STATUS_ROWS_ID_Event: qi,
      SETTINGS_STATUS_ADD_ID_Event: iu,
      SETTINGS_STATUS_SAVE_ID_Event: lu,
      SETTINGS_STATUS_RESET_ID_Event: cu,
      SETTINGS_STATUS_REFRESH_ID_Event: zi,
      SETTINGS_STATUS_CLEAN_UNUSED_ID_Event: ji,
      SETTINGS_STATUS_ERRORS_ID_Event: Fi,
      SETTINGS_STATUS_DIRTY_HINT_ID_Event: Vi,
      SETTINGS_STATUS_SPLITTER_ID_Event: du,
      SETTINGS_STATUS_COLS_ID_Event: hu,
      SETTINGS_STATUS_CHAT_LIST_ID_Event: uu,
      SETTINGS_STATUS_CHAT_META_ID_Event: mu,
      SETTINGS_STATUS_MEMORY_STATE_ID_Event: pu,
      getActiveStatusesEvent: () => Wm(Ce()),
      setActiveStatusesEvent: Bb,
      getActiveChatKeyEvent: wl,
      listHostChatsForCurrentScopeEvent: Cb,
      listChatScopedStatusSummariesEvent: Rb,
      loadStatusesForChatKeyEvent: Db,
      saveStatusesForChatKeyEvent: Nb,
      cleanupUnusedChatStatesForCurrentTavernEvent: Lb,
      probeMemoryPluginEvent: Ax,
      fetchMemoryChatKeysEvent: $x,
      subscribeMemoryPluginStateEvent: Rx,
      syncSettingsUiEvent: Ml,
      appendToConsoleEvent: Er
    },
    ruleTextActionsDepsEvent: {
      ...Yg,
      updateSettingsEvent: Fn
    }
  });
}
function Ml() {
  bx({
    getSettingsEvent: Ee,
    ...Wg,
    SETTINGS_COMPATIBILITY_MODE_ID_Event: Hs.SETTINGS_COMPATIBILITY_MODE_ID_Event,
    SETTINGS_REMOVE_ROLLJSON_ID_Event: Hs.SETTINGS_REMOVE_ROLLJSON_ID_Event,
    SETTINGS_STRIP_INTERNAL_ID_Event: Hs.SETTINGS_STRIP_INTERNAL_ID_Event,
    isSkillDraftDirtyEvent: Lh,
    hydrateSkillDraftFromSettingsEvent: Dx,
    getActiveStatusesEvent: () => Wm(Ce()),
    getActiveChatKeyEvent: wl,
    getSkillEditorLastSettingsTextEvent: et.getSkillEditorLastSettingsTextEvent,
    getSkillEditorLastPresetStoreTextEvent: et.getSkillEditorLastPresetStoreTextEvent
  });
}
function Lx(e = 0) {
  ah({
    SETTINGS_CARD_ID_Event: Gn,
    SETTINGS_SKILL_MODAL_ID_Event: Ro,
    SETTINGS_STATUS_MODAL_ID_Event: Ao,
    buildSettingsCardHtmlTemplateEvent: xg,
    buildSettingsCardTemplateIdsEvent: Cx,
    ensureSettingsCardStylesEvent: () => {
      g0({
        SETTINGS_STYLE_ID_Event: Ng,
        SETTINGS_CARD_ID_Event: Gn,
        buildSettingsCardStylesTemplateEvent: Dg
      });
    },
    syncSettingsBadgeVersionEvent: () => {
      f0({
        SETTINGS_BADGE_ID_Event: ou,
        SETTINGS_BADGE_VERSION_Event: Ju
      });
    },
    syncSettingsUiEvent: Ml,
    onMountedEvent: ({ drawerToggleId: t, drawerContentId: r }) => Nx(t, r)
  }, e);
}
function Mx() {
  const e = Lo();
  Tx({
    registerMacro: hv,
    SlashCommandParser: e.parser,
    SlashCommand: e.command,
    SlashCommandArgument: e.argument,
    ARGUMENT_TYPE: e.argumentType,
    getDiceMeta: qn,
    rollExpression: th,
    saveLastRoll: Gm,
    buildResultMessage: wx,
    appendToConsoleEvent: Er
  });
}
function Ox() {
  Ib(() => {
    Ml();
  });
}
function zo(e) {
  return e == null || e === "" ? ">=" : e === ">=" || e === ">" || e === "<=" || e === "<" ? e : null;
}
function He(e) {
  return typeof e == "string" ? e.trim() : "";
}
function Ga(e, t, r, n) {
  const o = He(e);
  if (!o) return;
  if (o.length <= n) return o;
  const i = o.slice(0, n);
  return de.warn(`outcomes.${t} 过长，已截断: event=${r} len=${o.length}`), `${i}（已截断）`;
}
function Px(e, t, r) {
  const n = He(e);
  if (!n) return;
  if (n.length <= r) return n;
  const o = n.slice(0, r);
  return de.warn(`dc_reason 过长，已截断: event=${t} len=${n.length}`), `${o}（已截断）`;
}
function Bx(e, t, r) {
  if (!e || typeof e != "object") return;
  const n = Ga(e.success, "success", t, r), o = Ga(e.failure, "failure", t, r), i = Ga(e.explode, "explode", t, r);
  if (!(!n && !o && !i))
    return {
      success: n,
      failure: o,
      explode: i
    };
}
function Mh(e, t) {
  const r = He(e);
  if (!r) return null;
  if (!t.test(r))
    return de.warn("非法 timeLimit，按不限时处理:", r), null;
  const n = r.match(/^P(?:(\d+)W)?(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/i);
  if (!n)
    return de.warn("不支持的 timeLimit 组合，按不限时处理:", r), null;
  const o = Number(n[1] || 0), i = Number(n[2] || 0), c = Number(n[3] || 0), u = Number(n[4] || 0), h = Number(n[5] || 0), f = ((((o * 7 + i) * 24 + c) * 60 + u) * 60 + h) * 1e3;
  return !Number.isFinite(f) || f < 0 ? (de.warn("timeLimit 解析失败，按不限时处理:", r), null) : f;
}
function Ol(e, t) {
  if (!t.enableTimeLimit || e == null) return null;
  const r = Math.max(1, Math.floor(Number(t.minTimeLimitSeconds) || 1)), n = r * 1e3;
  return e < n ? (de.info(`timeLimit 低于最短时限，提升到 ${r}s（原始 ${e}ms）`), n) : e;
}
function Ux(e) {
  const t = He(e).toLowerCase();
  if (t) {
    if (t === "protagonist" || t === "player" || t === "user" || t === "mc" || t === "main_character") return "protagonist";
    if (t === "all" || t === "any" || t === "both") return "all";
    if (t === "character" || t === "assistant" || t === "npc" || t === "self") return "character";
  }
}
function Kx(e) {
  const t = He(e).toLowerCase();
  if (t) {
    if (t === "auto" || t === "automatic" || t === "system" || t === "ai") return "auto";
    if (t === "manual" || t === "user" || t === "player") return "manual";
  }
}
function Hx(e) {
  const t = He(e).toLowerCase();
  if (t) {
    if (t === "advantage" || t === "adv" || t === "up" || t === "high" || t === "benefit") return "advantage";
    if (t === "disadvantage" || t === "dis" || t === "down" || t === "low" || t === "penalty") return "disadvantage";
    if (t === "normal" || t === "none" || t === "neutral" || t === "off") return "normal";
  }
}
function Gx(e) {
  const t = He(e).toLowerCase();
  if (t) {
    if (t === "self" || t === "protagonist" || t === "player" || t === "mc" || t === "main_character") return "self";
    if (t === "scene" || t === "situation" || t === "environment" || t === "context") return "scene";
    if (t === "supporting" || t === "character" || t === "npc" || t === "assistant") return "supporting";
    if (t === "object" || t === "item" || t === "thing" || t === "prop") return "object";
    if (t === "other" || t === "misc") return "other";
  }
}
function zx(e, t) {
  const r = He(t);
  return e === "self" ? "主角自己" : e === "scene" ? "场景" : e === "supporting" ? r ? `配角 ${r}` : "配角" : e === "object" ? r ? `物件 ${r}` : "物件" : r ? `其他对象 ${r}` : "其他对象";
}
function Pl(e, t) {
  const r = e && typeof e == "object" && !Array.isArray(e) ? e : {};
  let n = Gx(r.type ?? r.targetType ?? r.kind ?? e);
  const o = He(r.name ?? r.targetName ?? r.label ?? r.value);
  n || (t === "protagonist" ? n = "self" : t === "character" ? n = "supporting" : n = "scene");
  const i = o || void 0;
  return {
    targetType: n,
    targetName: i,
    targetLabel: zx(n, i)
  };
}
function jx(e) {
  if (e.targetType === "self") return !0;
  if (e.targetType === "supporting" || e.targetType === "object") return !1;
  if (e.scope === "protagonist" || e.scope === "all") return !0;
  if (e.scope === "character") return !1;
  const t = `${e.title}
${e.desc}
${e.skill}
${e.targetLabel}`;
  return /(\byou\b|\byour\b|\bplayer\b|\bprotagonist\b|主角|玩家|你)/i.test(t);
}
function qx(e, t) {
  return t === "all" ? e : e.filter(jx);
}
function Oh(e) {
  const t = He(e);
  if (!t) return null;
  const r = t.split(/[,\s]+/).map((n) => Number(n.trim())).filter((n) => Number.isFinite(n) && n > 0 && Number.isInteger(n));
  return r.length === 0 ? null : new Set(r);
}
function Fx(e, t) {
  const r = Oh(t.aiAllowedDiceSidesText);
  if (!r || r.size === 0) return !0;
  try {
    const n = Qt(e);
    return r.has(n.sides);
  } catch {
    return !1;
  }
}
function Vx(e, t) {
  const r = Oh(t.aiAllowedDiceSidesText), n = r ? Array.from(r).sort((h, f) => h - f) : [];
  if (n.length === 0) return {
    nextExpr: e,
    changed: !1,
    allowedSidesText: ""
  };
  const o = Qt(e);
  if (r.has(o.sides)) return {
    nextExpr: e,
    changed: !1,
    allowedSidesText: n.join(",")
  };
  const i = n[0], c = o.modifier === 0 ? "" : o.modifier > 0 ? `+${o.modifier}` : String(o.modifier), u = o.keepMode && o.keepCount ? `${o.keepMode}${o.keepCount}` : "";
  return {
    nextExpr: `${o.count}d${i}${o.explode ? "!" : ""}${u}${c}`,
    changed: !0,
    allowedSidesText: n.join(",")
  };
}
function Yx(e, t) {
  if (!e || typeof e != "object") return null;
  const r = He(e.id), n = He(e.title);
  let o = He(e.checkDice);
  const i = He(e.skill), c = He(e.timeLimit), u = He(e.desc), h = zo(e.compare), f = Ux(e.scope ?? e.eventScope ?? e.applyTo), v = Pl(e.target ?? {
    type: e.targetType,
    name: e.targetName ?? e.targetLabel
  }, f), x = Kx(e.rollMode), y = Hx(e.advantageState ?? e.advantage ?? e.advState), S = Number(e.dc), _ = Px(e.dc_reason ?? e.dcReason, r || "unknown_event", t.OUTCOME_TEXT_MAX_LEN_Event), P = {
    success: e.successOutcome,
    failure: e.failureOutcome,
    explode: e.explodeOutcome
  }, L = Bx(e.outcomes && typeof e.outcomes == "object" ? {
    ...P,
    ...e.outcomes
  } : P, r || "unknown_event", t.OUTCOME_TEXT_MAX_LEN_Event), M = Mh(c, t.ISO_8601_DURATION_REGEX_Event), B = t.getSettingsEvent(), C = Ol(M, B), G = c && M != null ? c : void 0;
  if (!r || !n || !o || !i || !u || h == null || !Number.isFinite(S)) return null;
  try {
    Qt(o);
  } catch {
    return null;
  }
  if (!Fx(o, B)) {
    const F = Vx(o, B);
    if (F.changed)
      de.warn(`事件骰式不在允许面数列表中，自动修正: event=${r} from=${o} to=${F.nextExpr} allowed=${F.allowedSidesText || "(未配置)"}`), o = F.nextExpr;
    else {
      const Z = He(B.aiAllowedDiceSidesText);
      return de.warn(`事件骰式不在允许面数列表中，已忽略: event=${r} checkDice=${o} allowed=${Z || "(未配置)"}`), null;
    }
  }
  return {
    id: r,
    title: n,
    checkDice: o,
    dc: S,
    compare: h,
    scope: f,
    rollMode: x,
    advantageState: y,
    skill: i,
    targetType: v.targetType,
    targetName: v.targetName,
    targetLabel: v.targetLabel,
    timeLimitMs: C,
    timeLimit: G,
    desc: u,
    dcReason: _,
    outcomes: L
  };
}
function Wx(e) {
  if (!e || typeof e != "object") return !1;
  const t = e;
  if ((t.end_round ?? t.endRound) === !0) return !0;
  const r = He(t.round_control ?? t.roundControl ?? t.round_action ?? t.roundAction).toLowerCase();
  return r ? r === "end_round" || r === "end" || r === "close" || r === "new_round" : !1;
}
function Ed(e, t) {
  if (!e || typeof e != "object" || e.type !== "dice_events" || String(e.version) !== "1" || !Array.isArray(e.events)) return null;
  const r = Wx(e), n = [];
  for (const o of e.events) {
    const i = Yx(o, t);
    if (!i) {
      de.warn("丢弃非法事件字段", o);
      continue;
    }
    n.push(i);
  }
  return n.length === 0 && !r ? null : {
    events: n,
    shouldEndRound: r
  };
}
function _d(e) {
  const t = String(e || "").replace(/[\u200B-\u200F\u202A-\u202E\u2060-\u206F]/g, "").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").replace(/\uFEFF/g, "").trim();
  if (!t) return null;
  const r = [], n = (y) => {
    const S = y.trim();
    S && (r.includes(S) || r.push(S));
  }, o = (y) => y.replace(/[\u201C\u201D\uFF02]/g, '"').replace(/[\u2018\u2019\uFF07]/g, "'").replace(/[\uFF1A\uFE55]/g, ":").replace(/[\uFF0C\u3001]/g, ",").replace(/[\uFF08]/g, "(").replace(/[\uFF09]/g, ")").replace(/[\uFF3B\u3010]/g, "[").replace(/[\uFF3D\u3011]/g, "]").replace(/[\uFF5B]/g, "{").replace(/[\uFF5D]/g, "}").replace(/\u00A0/g, " "), i = (y) => y.replace(/,\s*([}\]])/g, "$1"), c = (y) => y.replace(/^\s*```[a-zA-Z0-9_-]*\s*[\r\n]+/, "").replace(/[\r\n]+\s*```\s*$/, "").trim(), u = (y) => y.replace(/^\s*(?:rolljson|json)\s*[\r\n]+/i, "").trim(), h = (y, S) => {
    if (S < 0) return null;
    let _ = 0, P = !1, L = !1;
    for (let M = S; M < y.length; M++) {
      const B = y[M];
      if (P) {
        if (L) {
          L = !1;
          continue;
        }
        if (B === "\\") {
          L = !0;
          continue;
        }
        B === '"' && (P = !1);
        continue;
      }
      if (B === '"') {
        P = !0;
        continue;
      }
      if (B === "{") {
        _ += 1;
        continue;
      }
      if (B === "}" && (_ -= 1, _ === 0))
        return y.slice(S, M + 1);
    }
    return null;
  }, f = (y) => h(y, y.indexOf("{")), v = (y) => {
    const S = y.search(/"type"\s*:\s*"dice_events"/i);
    return S < 0 ? null : h(y, y.lastIndexOf("{", S));
  }, x = [
    t,
    c(t),
    u(t),
    u(c(t))
  ];
  for (const y of x) {
    if (!y) continue;
    const S = o(y), _ = i(y), P = i(S);
    n(y), n(S), n(_), n(P);
    const L = f(y);
    L && (n(L), n(o(L)), n(i(L)), n(i(o(L))));
    const M = f(S);
    M && (n(M), n(i(M)));
    const B = v(y);
    B && (n(B), n(o(B)), n(i(B)), n(i(o(B))));
    const C = v(S);
    C && (n(C), n(i(C)));
  }
  for (const y of r) try {
    return JSON.parse(y);
  } catch {
  }
  return null;
}
function Td(e) {
  try {
    const t = document.createElement("textarea");
    return t.innerHTML = e, t.value;
  } catch {
    return e.replace(/&quot;/g, '"').replace(/&#34;/g, '"').replace(/&apos;/g, "'").replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
  }
}
function Xx(e, t) {
  const r = /```(?:rolljson|json)?\s*([\s\S]*?)```/gi, n = [], o = [];
  let i = !1, c;
  for (; (c = r.exec(e)) !== null; ) {
    const h = Td(c[1] ?? "").trim();
    if (!h) continue;
    const f = /"type"\s*:\s*"dice_events"/i.test(h);
    f && n.push({
      start: c.index,
      end: c.index + c[0].length
    });
    let v;
    try {
      if (v = _d(h), !v) throw new Error("无法修复为合法 JSON");
    } catch (y) {
      f && (de.warn("事件 JSON 解析失败，已隐藏代码块", y), de.debug("解析失败的原始文本:", h));
      continue;
    }
    const x = Ed(v, t);
    x && (o.push(...x.events), x.shouldEndRound && (i = !0));
  }
  const u = /<pre\b[\s\S]*?<\/pre>/gi;
  for (; (c = u.exec(e)) !== null; ) {
    const h = c[0], f = h.match(/<code\b[^>]*>([\s\S]*?)<\/code>/i), v = Td((f ? f[1] : h).replace(/<[^>]+>/g, "")).trim();
    if (!v) continue;
    const x = /"type"\s*:\s*"dice_events"/i.test(v);
    x && n.push({
      start: c.index,
      end: c.index + h.length
    });
    let y;
    try {
      if (y = _d(v), !y) throw new Error("无法修复为合法 JSON");
    } catch (_) {
      x && de.warn("HTML 事件 JSON解析失败，已隐藏代码块", _);
      continue;
    }
    const S = Ed(y, t);
    S && (o.push(...S.events), S.shouldEndRound && (i = !0));
  }
  return {
    events: o,
    ranges: n,
    shouldEndRound: i
  };
}
function Jx(e, t, r) {
  if (t.length === 0) return e;
  const n = [...t].sort((c, u) => c.start - u.start);
  let o = 0, i = "";
  for (const c of n)
    c.start > o && (i += e.slice(o, c.start)), o = Math.max(o, c.end);
  return o < e.length && (i += e.slice(o)), r(i);
}
function Qx(e, t, r = Date.now()) {
  t.ensureRoundEventTimersSyncedEvent(e);
  const n = t.getSettingsEvent(), o = [];
  let i = 0;
  for (const c of e.events) {
    const u = t.getLatestRollRecordForEvent(e, c.id), h = u ? u.source === "timeout_auto_fail" ? "timeout" : "done" : "pending", f = u && Number.isFinite(Number(u.result.total)) ? Number(u.result.total) : null, v = u ? u.success : null, x = t.resolveTriggeredOutcomeEvent(c, u, n);
    u && i++, o.push({
      id: c.id,
      title: c.title,
      desc: c.desc,
      targetLabel: c.targetLabel,
      skill: c.skill,
      checkDice: c.checkDice,
      compare: t.normalizeCompareOperatorEvent(c.compare) ?? ">=",
      dc: Number.isFinite(c.dc) ? Number(c.dc) : 0,
      dcReason: String(c.dcReason || ""),
      rollMode: c.rollMode === "auto" ? "auto" : "manual",
      advantageState: ty(u?.advantageStateApplied ?? c.advantageState),
      timeLimit: c.timeLimit ?? "none",
      status: h,
      resultSource: u?.source ?? null,
      total: f,
      skillModifierApplied: Number(u?.skillModifierApplied ?? 0),
      statusModifierApplied: Number(u?.statusModifierApplied ?? 0),
      baseModifierUsed: Number(u?.baseModifierUsed ?? 0),
      finalModifierUsed: Number(u?.finalModifierUsed ?? 0),
      success: v,
      marginToDc: typeof u?.marginToDc == "number" && Number.isFinite(u.marginToDc) ? Number(u.marginToDc) : null,
      resultGrade: u?.resultGrade ?? null,
      outcomeKind: x.kind,
      outcomeText: nn(x.text),
      explosionTriggered: x.explosionTriggered,
      sourceAssistantMsgId: c.sourceAssistantMsgId,
      rollId: u?.rollId,
      rolledAt: u?.rolledAt,
      targetLabelUsed: u?.targetLabelUsed,
      statusModifiersApplied: u?.statusModifiersApplied ? [...u.statusModifiersApplied] : void 0,
      explodePolicyApplied: u?.explodePolicyApplied,
      rollsSnapshot: u?.result ? {
        rolls: Array.isArray(u.result.rolls) ? [...u.result.rolls] : [],
        modifier: Number(u.result.modifier) || 0,
        total: Number(u.result.total) || 0,
        rawTotal: Number(u.result.rawTotal) || 0,
        count: Number(u.result.count) || 0,
        sides: Number(u.result.sides) || 0,
        exploding: u.result.exploding,
        explosionTriggered: u.result.explosionTriggered
      } : void 0
    });
  }
  return {
    roundId: e.roundId,
    openedAt: e.openedAt,
    closedAt: r,
    eventsCount: e.events.length,
    rolledCount: i,
    events: o,
    sourceAssistantMsgIds: Array.isArray(e.sourceAssistantMsgIds) ? [...e.sourceAssistantMsgIds] : []
  };
}
function Zx(e) {
  return Array.isArray(e.summaryHistory) || (e.summaryHistory = []), e.summaryHistory;
}
function ey(e, t) {
  e.length <= t || e.splice(0, e.length - t);
}
function ty(e) {
  return e === "advantage" || e === "disadvantage" || e === "normal" ? e : "normal";
}
function ry(e) {
  const t = String(e ?? "").replace(/\s+/g, " ").trim();
  return t.length > 0 ? t : "（空）";
}
function Ht(e, t) {
  const r = ry(e);
  return r.length <= t ? r : `${r.slice(0, Math.max(1, t))}（已截断）`;
}
function ny(e) {
  return e === "minimal" ? 60 : e === "balanced" ? 90 : 140;
}
function sy(e) {
  return e === "manual_roll" ? "手动检定" : e === "ai_auto_roll" ? "AI自动检定" : e === "timeout_auto_fail" ? "超时判定" : "未知";
}
function oy(e) {
  if (e.status === "pending") return "待判定（尚未掷骰）";
  if (e.status === "timeout" || e.resultSource === "timeout_auto_fail") return "超时未操作，系统判定失败";
  const t = e.total == null ? "-" : String(e.total);
  return e.success === !0 ? e.resultSource === "ai_auto_roll" ? `AI自动检定成功（总值 ${t}）` : `成功（总值 ${t}）` : e.success === !1 ? e.resultSource === "ai_auto_roll" ? `AI自动检定失败（总值 ${t}）` : `失败（总值 ${t}）` : `已完成（总值 ${t}）`;
}
function ay(e) {
  const t = Ht(e.outcomeText || "", 120);
  return e.outcomeKind === "explode" ? `爆骰走向：${t}` : e.outcomeKind === "success" ? `成功走向：${t}` : e.outcomeKind === "failure" ? `失败走向：${t}` : `走向：${t}`;
}
function iy(e, t, r) {
  const n = Ht(e.title, 48), o = Ht(e.desc, ny(t)), i = Ht(e.targetLabel || "未指定", 20), c = oy(e), u = r ? ay(e) : "", h = Number.isFinite(Number(e.baseModifierUsed)) ? Number(e.baseModifierUsed) : 0, f = Number.isFinite(Number(e.skillModifierApplied)) ? Number(e.skillModifierApplied) : 0, v = Number.isFinite(Number(e.statusModifierApplied)) ? Number(e.statusModifierApplied) : 0, x = Number.isFinite(Number(e.finalModifierUsed)) ? Number(e.finalModifierUsed) : h + f + v, y = `修正 ${wt(h)} + 技能 ${wt(f)} + 状态 ${wt(v)} = ${wt(x)}`;
  if (t === "minimal") return r ? `- 标题：${n}｜对象：${i}｜描述：${o}｜结果：${c}｜${u}` : `- 标题：${n}｜对象：${i}｜描述：${o}｜结果：${c}`;
  const S = Ht(e.skill, 20), _ = Ht(e.checkDice, 24), P = e.dcReason ? `（DC原因：${Ht(e.dcReason, 36)}）` : "", L = `${S} ${_}，条件 ${e.compare} ${e.dc}${P}`, M = e.advantageState === "normal" ? "" : `｜骰态=${e.advantageState}`, B = e.resultGrade ? `｜分级=${e.resultGrade}` : "";
  if (t === "balanced") return r ? `- 标题：${n}｜对象：${i}｜描述：${o}｜检定：${L}${M}｜${y}｜结果：${c}${B}｜${u}` : `- 标题：${n}｜对象：${i}｜描述：${o}｜检定：${L}${M}｜${y}｜结果：${c}${B}`;
  const C = sy(e.resultSource), G = Ht(Mo(e.timeLimit || "none"), 26);
  return r ? `- 标题：${n}｜对象：${i}｜描述：${o}｜检定：${L}${M}｜${y}｜来源：${C}｜模式：${e.rollMode}｜时限：${G}｜结果：${c}${B}｜${u}` : `- 标题：${n}｜对象：${i}｜描述：${o}｜检定：${L}${M}｜${y}｜来源：${C}｜模式：${e.rollMode}｜时限：${G}｜结果：${c}${B}`;
}
function ly(e, t, r, n, o) {
  if (!Array.isArray(e) || e.length === 0) return "";
  const i = Math.min(o.SUMMARY_HISTORY_ROUNDS_MAX_Event, Math.max(o.SUMMARY_HISTORY_ROUNDS_MIN_Event, Math.floor(Number(r) || 1))), c = e.slice(-i);
  if (c.length === 0) return "";
  const u = [];
  u.push(o.DICE_SUMMARY_BLOCK_START_Event), u.push(`v=5 fmt=nl detail=${t} window_rounds=${i} included_rounds=${c.length} include_outcome=${n ? "1" : "0"}`);
  let h = 0, f = !1;
  for (let v = 0; v < c.length; v++) {
    const x = c[v], y = Math.max(0, x.eventsCount - x.rolledCount);
    u.push(`【第 ${v + 1} 轮 / roundId=${x.roundId} / 关闭时间=${new Date(x.closedAt).toISOString()}】`), u.push(`本轮事件数=${x.eventsCount}，已结算=${x.rolledCount}，未结算=${y}`);
    const S = x.events.slice(0, o.SUMMARY_MAX_EVENTS_Event);
    for (const _ of S) {
      if (h >= o.SUMMARY_MAX_TOTAL_EVENT_LINES_Event) {
        f = !0;
        break;
      }
      u.push(iy(_, t, n)), h++;
    }
    if (x.events.length > o.SUMMARY_MAX_EVENTS_Event && u.push(`注：本轮还有 ${x.events.length - o.SUMMARY_MAX_EVENTS_Event} 个事件未展开。`), f) break;
  }
  return f && u.push("注：后续事件因长度限制未展开。"), u.push(o.DICE_SUMMARY_BLOCK_END_Event), u.join(`
`);
}
var Tt = "normal", kd = 1;
function Ph(e) {
  return e === "advantage" || e === "disadvantage" || e === "normal" ? e : Tt;
}
function cy(e) {
  return Array.isArray(e.keptRolls) && e.keptRolls.length > 0 ? e.keptRolls : Array.isArray(e.rolls) ? e.rolls : [];
}
function dy(e) {
  return e.keepMode === "kh" ? "advantage" : e.keepMode === "kl" ? "disadvantage" : Tt;
}
function Bh(e, t, r, n) {
  let o;
  try {
    o = n(e);
  } catch (h) {
    return {
      adv: !1,
      dis: !1,
      advantageStateApplied: Tt,
      errorText: h?.message ?? String(h)
    };
  }
  const i = dy(o), c = Ph(t.advantageState), u = o.keepMode === "kh" || o.keepMode === "kl";
  return r.enableAdvantageSystem ? u ? {
    adv: !1,
    dis: !1,
    advantageStateApplied: i
  } : c === "advantage" ? {
    adv: !0,
    dis: !1,
    advantageStateApplied: "advantage"
  } : c === "disadvantage" ? {
    adv: !1,
    dis: !0,
    advantageStateApplied: "disadvantage"
  } : {
    adv: !1,
    dis: !1,
    advantageStateApplied: Tt
  } : u ? {
    adv: !1,
    dis: !1,
    advantageStateApplied: Tt,
    errorText: `优势/劣势系统已关闭，当前表达式包含 kh/kl：${e}`
  } : c !== Tt ? {
    adv: !1,
    dis: !1,
    advantageStateApplied: Tt,
    errorText: `优势/劣势系统已关闭，事件设置了 advantageState=${c}`
  } : {
    adv: !1,
    dis: !1,
    advantageStateApplied: Tt
  };
}
function uy(e, t, r) {
  if (r == null || !Number.isFinite(r) || !Number.isFinite(e)) return null;
  switch (t) {
    case ">=":
      return e - r;
    case ">":
      return e - (r + 1);
    case "<=":
      return r - e;
    case "<":
      return r - 1 - e;
    default:
      return null;
  }
}
function my(e) {
  const t = cy(e);
  if (t.length !== 1) return { isCandidate: !1 };
  const r = Number(t[0]), n = Number(e.sides);
  return !Number.isFinite(r) || !Number.isFinite(n) || n <= 0 ? { isCandidate: !1 } : { isCandidate: r === 1 || r === n };
}
function Bl(e, t, r, n, o) {
  const i = uy(Number(e.total), r, n);
  return o === "timeout_auto_fail" ? {
    resultGrade: "failure",
    marginToDc: i
  } : t !== !0 && t !== !1 ? {
    resultGrade: "failure",
    marginToDc: i
  } : my(e).isCandidate ? t ? {
    resultGrade: "critical_success",
    marginToDc: i
  } : {
    resultGrade: "critical_failure",
    marginToDc: i
  } : t ? i != null && i >= 1 && i <= 2 ? {
    resultGrade: "partial_success",
    marginToDc: i
  } : {
    resultGrade: "success",
    marginToDc: i
  } : {
    resultGrade: "failure",
    marginToDc: i
  };
}
function hy(e) {
  return Array.isArray(e.pendingResultGuidanceQueue) || (e.pendingResultGuidanceQueue = []), e.pendingResultGuidanceQueue;
}
function xo(e, t, r) {
  if (!r.resultGrade) return;
  const n = hy(e);
  n.some((o) => o.rollId === r.rollId) || n.push({
    rollId: r.rollId,
    roundId: r.roundId,
    eventId: t.id,
    eventTitle: t.title,
    targetLabel: r.targetLabelUsed || t.targetLabel,
    resultGrade: r.resultGrade,
    marginToDc: r.marginToDc ?? null,
    total: Number(r.result.total) || 0,
    dcUsed: r.dcUsed ?? null,
    compareUsed: r.compareUsed,
    advantageStateApplied: r.advantageStateApplied,
    source: r.source,
    rolledAt: r.rolledAt
  });
}
function py(e, t) {
  let r = 0, n = 0, o = 0;
  try {
    const i = t.parseDiceExpression(e.checkDice);
    r = i.count, n = i.sides, o = i.modifier;
  } catch {
  }
  return {
    expr: e.checkDice || "timeout",
    count: r,
    sides: n,
    modifier: o,
    rolls: [],
    rawTotal: 0,
    total: 0,
    selectionMode: "none"
  };
}
function Uh(e, t) {
  const r = Number.isFinite(Number(e.modifier)) ? Number(e.modifier) : 0, n = Number.isFinite(Number(t)) ? Number(t) : 0, o = r + n;
  return n === 0 ? {
    result: e,
    baseModifierUsed: r,
    finalModifierUsed: o
  } : {
    result: {
      ...e,
      modifier: o,
      total: Number(e.rawTotal) + o
    },
    baseModifierUsed: r,
    finalModifierUsed: o
  };
}
function Ul(e, t) {
  const r = Number.isFinite(Number(e.modifier)) ? Number(e.modifier) : 0, n = Number.isFinite(Number(t)) ? Number(t) : 0, o = r + n;
  return n === 0 ? {
    result: e,
    finalModifierUsed: o
  } : {
    result: {
      ...e,
      modifier: o,
      total: Number(e.rawTotal) + o
    },
    finalModifierUsed: o
  };
}
function Kl(e, t, r) {
  return r.enableStatusSystem ? _l(Cr(t), e) : {
    modifier: 0,
    matched: []
  };
}
function fy(e, t, r) {
  if (!r.enableOutcomeBranches) return "";
  const n = e.outcomes, o = !!t?.result?.explosionTriggered;
  return r.enableExplodeOutcomeBranch && o && n?.explode && n.explode.trim() ? n.explode.trim() : t?.success === !0 ? n?.success?.trim() || "判定成功，剧情向有利方向推进。" : t?.success === !1 || t?.source === "timeout_auto_fail" ? n?.failure?.trim() || "判定失败，剧情向不利方向推进。" : "尚未结算。";
}
function yo(e, t, r, n) {
  if (!n.enableStatusSystem) return !1;
  const o = fy(t, r, n);
  return o ? Tb(e, Pm(o, t.skill || "").commands, "ai_tag") : !1;
}
function Kh(e) {
  return (!e.eventTimers || typeof e.eventTimers != "object") && (e.eventTimers = {}), e.eventTimers;
}
function Zt(e, t) {
  for (let r = e.rolls.length - 1; r >= 0; r--) if (e.rolls[r]?.eventId === t) return e.rolls[r];
  return null;
}
function Hh(e, t) {
  const r = t.getSettingsEvent(), n = Kh(e), o = Date.now(), i = /* @__PURE__ */ new Set();
  for (const c of e.events) {
    if (i.add(c.id), !c.targetType || !c.targetLabel) {
      const x = t.resolveEventTargetEvent({
        type: c.targetType,
        name: c.targetName
      }, c.scope);
      c.targetType = x.targetType, c.targetName = x.targetName, c.targetLabel = x.targetLabel;
    }
    const u = typeof c.timeLimitMs == "number" && Number.isFinite(c.timeLimitMs) ? Math.max(0, c.timeLimitMs) : t.parseIsoDurationToMsEvent(c.timeLimit || ""), h = t.applyTimeLimitPolicyMsEvent(u, r);
    c.timeLimitMs = h;
    let f = n[c.id];
    const v = Zt(e, c.id);
    if (!f) {
      const x = typeof c.offeredAt == "number" && Number.isFinite(c.offeredAt) ? c.offeredAt : o;
      f = {
        offeredAt: x,
        deadlineAt: h == null ? null : x + h
      }, n[c.id] = f;
    }
    v ? v.source === "timeout_auto_fail" && (f.expiredAt = v.timeoutAt ?? v.rolledAt) : (f.deadlineAt = h == null ? null : f.offeredAt + h, f.deadlineAt == null && delete f.expiredAt), c.offeredAt = f.offeredAt, c.deadlineAt = f.deadlineAt;
  }
  for (const c of Object.keys(n)) i.has(c) || delete n[c];
}
function gy(e) {
  if (e == null || e === "") return null;
  const t = Math.floor(Number(e));
  return !Number.isFinite(t) || t <= 0 ? null : t;
}
function vy(e) {
  const t = Cr(e);
  if (t.length <= 0) return !1;
  const r = Date.now(), n = t.map((o) => {
    const i = gy(o.remainingRounds);
    if (i == null) return {
      ...o,
      remainingRounds: null
    };
    const c = i - 1;
    return c <= 0 ? null : {
      ...o,
      remainingRounds: c,
      updatedAt: r
    };
  }).filter((o) => o != null);
  return n.length === t.length && n.every((o, i) => o.remainingRounds === t[i].remainingRounds) ? !1 : (e.activeStatuses = n, !0);
}
function by(e, t) {
  const r = e.pendingRound?.status, n = t.now ? t.now() : Date.now();
  return (!e.pendingRound || r !== "open") && (e.pendingRound = {
    roundId: t.createIdEvent("round"),
    status: "open",
    events: [],
    rolls: [],
    eventTimers: {},
    sourceAssistantMsgIds: [],
    openedAt: n
  }), (!e.pendingRound.eventTimers || typeof e.pendingRound.eventTimers != "object") && (e.pendingRound.eventTimers = {}), e.pendingRound;
}
function xy(e, t, r) {
  const n = r.getSettingsEvent(), o = r.getDiceMetaEvent(), i = o.pendingRound;
  i && i.status !== "open" && vy(o);
  const c = by(o, { createIdEvent: r.createIdEvent }), u = Date.now(), h = Kh(c), f = /* @__PURE__ */ new Map();
  for (const v of c.events) f.set(v.id, { ...v });
  for (const v of e) {
    const x = { ...v }, y = f.get(x.id), S = Zt(c, x.id), _ = {
      ...y || {},
      ...x
    };
    if (S) {
      const L = h[_.id];
      L ? (_.offeredAt = L.offeredAt, _.deadlineAt = L.deadlineAt) : y && (_.offeredAt = y.offeredAt, _.deadlineAt = y.deadlineAt ?? null);
    } else {
      const L = typeof _.timeLimitMs == "number" && Number.isFinite(_.timeLimitMs) ? Math.max(0, _.timeLimitMs) : r.parseIsoDurationToMsEvent(_.timeLimit || ""), M = r.applyTimeLimitPolicyMsEvent(L, n);
      _.timeLimitMs = M, _.offeredAt = u, _.deadlineAt = M == null ? null : u + M, h[_.id] = {
        offeredAt: _.offeredAt,
        deadlineAt: _.deadlineAt
      };
    }
    const P = r.resolveEventTargetEvent({
      type: _.targetType,
      name: _.targetName
    }, _.scope);
    _.targetType = P.targetType, _.targetName = P.targetName, _.targetLabel = P.targetLabel, _.sourceAssistantMsgId = t, f.set(_.id, _);
  }
  return c.events = Array.from(f.values()), Hh(c, {
    getSettingsEvent: r.getSettingsEvent,
    resolveEventTargetEvent: r.resolveEventTargetEvent,
    parseIsoDurationToMsEvent: r.parseIsoDurationToMsEvent,
    applyTimeLimitPolicyMsEvent: r.applyTimeLimitPolicyMsEvent
  }), c.sourceAssistantMsgIds.includes(t) || c.sourceAssistantMsgIds.push(t), r.saveMetadataSafeEvent(), c;
}
function Hl(e, t, r) {
  if (!r.enableOutcomeBranches) return {
    kind: "none",
    text: "走向分支已关闭。",
    explosionTriggered: !1
  };
  const n = e.outcomes, o = !!t?.result?.explosionTriggered;
  return r.enableExplodeOutcomeBranch && o && n?.explode && n.explode.trim() ? {
    kind: "explode",
    text: n.explode.trim(),
    explosionTriggered: !0
  } : t?.success === !0 ? {
    kind: "success",
    text: n?.success?.trim() || "判定成功，剧情向有利方向推进。",
    explosionTriggered: o
  } : t?.success === !1 || t?.source === "timeout_auto_fail" ? {
    kind: "failure",
    text: n?.failure?.trim() || "判定失败，剧情向不利方向推进。",
    explosionTriggered: o
  } : {
    kind: "none",
    text: "尚未结算。",
    explosionTriggered: o
  };
}
function yy(e, t, r, n) {
  const o = n.getSettingsEvent(), i = n.getDiceMetaEvent(), c = n.normalizeCompareOperatorEvent(t.compare) ?? ">=", u = Number.isFinite(t.dc) ? Number(t.dc) : null;
  let h = n.createSyntheticTimeoutDiceResultEvent(t);
  const f = n.resolveSkillModifierBySkillNameEvent(t.skill, o), v = Uh(h, f);
  h = v.result;
  const x = Kl(t.skill, i, o), y = Ul(h, x.modifier);
  h = y.result;
  const S = Bl(h, !1, c, u, "timeout_auto_fail");
  return {
    rollId: n.createIdEvent("eroll"),
    roundId: e.roundId,
    eventId: t.id,
    eventTitle: t.title,
    diceExpr: t.checkDice,
    result: h,
    success: !1,
    compareUsed: c,
    dcUsed: u,
    advantageStateApplied: Ph(t.advantageState),
    resultGrade: S.resultGrade,
    marginToDc: S.marginToDc,
    skillModifierApplied: f,
    statusModifierApplied: x.modifier,
    statusModifiersApplied: x.matched,
    baseModifierUsed: v.baseModifierUsed,
    finalModifierUsed: y.finalModifierUsed,
    targetLabelUsed: t.targetLabel,
    rolledAt: r,
    source: "timeout_auto_fail",
    timeoutAt: r,
    sourceAssistantMsgId: t.sourceAssistantMsgId
  };
}
function Sy(e, t, r, n = Date.now()) {
  if (!r.getSettingsEvent().enableTimeLimit || r.getLatestRollRecordForEvent(e, t.id)) return null;
  r.ensureRoundEventTimersSyncedEvent(e);
  const o = e.eventTimers[t.id];
  if (!o || o.deadlineAt == null || n <= o.deadlineAt) return null;
  const i = r.createTimeoutFailureRecordEvent(e, t, n);
  return e.rolls.push(i), o.expiredAt = n, i;
}
function Ey(e) {
  const t = e.getSettingsEvent();
  if (!t.enabled || !t.enableTimeLimit) return !1;
  const r = e.getDiceMetaEvent(), n = r.pendingRound;
  if (!n || n.status !== "open") return !1;
  e.ensureRoundEventTimersSyncedEvent(n);
  const o = Date.now();
  let i = !1;
  for (const c of n.events) {
    const u = e.recordTimeoutFailureIfNeededEvent(n, c, o);
    u && (i = !0, t.enableDynamicResultGuidance && xo(r, c, u), yo(r, c, u, t) && (i = !0));
  }
  return i && e.saveMetadataSafeEvent(), i;
}
function _y(e, t, r, n) {
  n.sweepTimeoutFailuresEvent();
  const o = String(e || "").trim();
  if (!o) return "❌ 请提供事件 ID，例如：/eventroll roll lockpick_gate";
  const i = n.getDiceMetaEvent(), c = i.pendingRound;
  if (!c) return "❌ 当前没有可投掷的事件。";
  if (c.status !== "open") return "❌ 当前轮次已结束，请等待 AI 生成新轮次事件。";
  if (r && c.roundId !== r) return "❌ 该事件所属轮次已结束。";
  const u = c.events.find((z) => z.id === o);
  if (!u) return `❌ 找不到事件 ID：${o}`;
  const h = n.getSettingsEvent();
  if (!h.enabled) return "❌ RollHelper 主开关已关闭，当前不能执行事件掷骰。";
  n.ensureRoundEventTimersSyncedEvent(c);
  const f = n.recordTimeoutFailureIfNeededEvent(c, u);
  if (f && (h.enableDynamicResultGuidance && xo(i, u, f), yo(i, u, f, h), n.saveMetadataSafeEvent()), n.getLatestRollRecordForEvent(c, u.id))
    return n.refreshAllWidgetsFromStateEvent(), n.refreshCountdownDomEvent(), "";
  const v = (t || u.checkDice || "").trim();
  if (!v) return `❌ 事件 ${o} 缺少可用骰式。`;
  const x = v.includes("!"), y = x ? h.enableExplodingDice ? "enabled" : "disabled_globally" : "not_requested", S = x ? h.enableExplodingDice ? "已请求爆骰，按真实掷骰结果决定是否触发连爆。" : "已请求爆骰，但全局爆骰功能关闭，按普通骰结算。" : "未请求爆骰。", _ = x && !h.enableExplodingDice ? v.replace("!", "") : v, P = Bh(_, u, h, n.parseDiceExpression);
  if (P.errorText) return `❌ 掷骰失败：${P.errorText}`;
  let L;
  try {
    L = n.rollExpression(_, {
      rule: h.ruleText,
      adv: P.adv,
      dis: P.dis
    });
  } catch (z) {
    return `❌ 掷骰失败：${z?.message ?? String(z)}`;
  }
  const M = n.resolveSkillModifierBySkillNameEvent(u.skill, h), B = n.applySkillModifierToDiceResultEvent(L, M);
  L = B.result;
  const C = Kl(u.skill, i, h), G = Ul(L, C.modifier);
  L = G.result, n.saveLastRoll(L);
  const F = n.normalizeCompareOperatorEvent(u.compare) ?? ">=", Z = Number.isFinite(u.dc) ? Number(u.dc) : null, H = n.evaluateSuccessEvent(L.total, F, Z), X = Bl(L, H, F, Z, "manual_roll"), K = {
    rollId: n.createIdEvent("eroll"),
    roundId: c.roundId,
    eventId: u.id,
    eventTitle: u.title,
    diceExpr: _,
    result: L,
    success: H,
    compareUsed: F,
    dcUsed: Z,
    advantageStateApplied: P.advantageStateApplied,
    resultGrade: X.resultGrade,
    marginToDc: X.marginToDc,
    skillModifierApplied: M,
    statusModifierApplied: C.modifier,
    statusModifiersApplied: C.matched,
    baseModifierUsed: B.baseModifierUsed,
    finalModifierUsed: G.finalModifierUsed,
    targetLabelUsed: u.targetLabel,
    rolledAt: Date.now(),
    source: "manual_roll",
    timeoutAt: null,
    explodePolicyApplied: y,
    explodePolicyReason: S,
    sourceAssistantMsgId: u.sourceAssistantMsgId
  };
  return c.rolls.push(K), h.enableDynamicResultGuidance && xo(i, u, K), yo(i, u, K, h), n.saveMetadataSafeEvent(), n.refreshAllWidgetsFromStateEvent(), n.refreshCountdownDomEvent(), "";
}
function Ty(e, t) {
  const r = t.getSettingsEvent();
  if (!r.enableAiRollMode) return [];
  t.ensureRoundEventTimersSyncedEvent(e);
  const n = t.getDiceMetaEvent();
  let o = !1, i = null;
  const c = [];
  let u = e.rolls.filter((h) => h?.source === "ai_auto_roll" && (h.explodePolicyApplied === "enabled" || String(h.diceExpr || "").includes("!"))).length;
  for (const h of e.events) {
    if ((h.rollMode === "auto" ? "auto" : "manual") != "auto" || t.getLatestRollRecordForEvent(e, h.id)) continue;
    const f = String(h.checkDice || "").trim();
    if (!f) continue;
    const v = f.includes("!");
    let x = "not_requested", y = "未请求爆骰。", S = f;
    v && (r.enableExplodingDice ? u >= kd ? (x = "downgraded_by_ai_limit", y = `已请求爆骰，但本轮 AI 自动爆骰上限为 ${kd}，按普通骰结算。`, S = f.replace("!", "")) : (x = "enabled", y = "已请求爆骰，按真实掷骰结果决定是否触发连爆。", u += 1) : (x = "disabled_globally", y = "已请求爆骰，但全局爆骰功能关闭，按普通骰结算。", S = f.replace("!", "")));
    const _ = Bh(S, h, r, t.parseDiceExpression);
    if (_.errorText) {
      de.warn(`AI 自动掷骰被跳过: event=${h.id} reason=${_.errorText}`);
      continue;
    }
    let P;
    try {
      P = t.rollExpression(S, {
        rule: r.ruleText,
        adv: _.adv,
        dis: _.dis
      });
    } catch (K) {
      de.warn(`AI 自动掷骰失败: event=${h.id}`, K);
      continue;
    }
    const L = t.resolveSkillModifierBySkillNameEvent(h.skill, r), M = t.applySkillModifierToDiceResultEvent(P, L);
    P = M.result;
    const B = Kl(h.skill, n, r), C = Ul(P, B.modifier);
    P = C.result;
    const G = t.normalizeCompareOperatorEvent(h.compare) ?? ">=", F = Number.isFinite(h.dc) ? Number(h.dc) : null, Z = t.evaluateSuccessEvent(P.total, G, F), H = Bl(P, Z, G, F, "ai_auto_roll"), X = {
      rollId: t.createIdEvent("eroll"),
      roundId: e.roundId,
      eventId: h.id,
      eventTitle: h.title,
      diceExpr: S,
      result: P,
      success: Z,
      compareUsed: G,
      dcUsed: F,
      advantageStateApplied: _.advantageStateApplied,
      resultGrade: H.resultGrade,
      marginToDc: H.marginToDc,
      skillModifierApplied: L,
      statusModifierApplied: B.modifier,
      statusModifiersApplied: B.matched,
      baseModifierUsed: M.baseModifierUsed,
      finalModifierUsed: C.finalModifierUsed,
      targetLabelUsed: h.targetLabel,
      rolledAt: Date.now(),
      source: "ai_auto_roll",
      timeoutAt: null,
      explodePolicyApplied: x,
      explodePolicyReason: y,
      sourceAssistantMsgId: h.sourceAssistantMsgId
    };
    e.rolls.push(X), r.enableDynamicResultGuidance && xo(n, h, X), yo(n, h, X, r), o = !0, i = P, c.push(t.buildEventRollResultCardEvent(h, X));
  }
  return o ? (i && t.saveLastRoll(i), t.saveMetadataSafeEvent(), c) : [];
}
function ky(e, t, r) {
  const n = r.getSettingsEvent(), o = Number.isFinite(Number(e.baseModifierUsed)) ? Number(e.baseModifierUsed) : Number(e.result.modifier) || 0, i = Number.isFinite(Number(e.skillModifierApplied)) ? Number(e.skillModifierApplied) : 0, c = Number.isFinite(Number(e.statusModifierApplied)) ? Number(e.statusModifierApplied) : 0, u = Number.isFinite(Number(e.finalModifierUsed)) ? Number(e.finalModifierUsed) : o + i + c;
  let h = "";
  if (n.enableOutcomeBranches) {
    const L = t ? r.resolveTriggeredOutcomeEvent(t, e, n) : e.result.explosionTriggered && n.enableExplodeOutcomeBranch ? { kind: "explode" } : e.success === !0 ? { kind: "success" } : e.success === !1 ? { kind: "failure" } : { kind: "none" };
    L.kind !== "none" && (h = ` | 走向:${L.kind}`);
  }
  const f = e.targetLabelUsed || t?.targetLabel || "", v = f ? ` | 对象:${f}` : "", x = n.enableSkillSystem ? ` | 修正:${r.formatEventModifierBreakdownEvent(o, i, u)}` : "", y = c !== 0 ? ` | 状态:${c > 0 ? `+${c}` : c}${Array.isArray(e.statusModifiersApplied) && e.statusModifiersApplied.length > 0 ? `(${e.statusModifiersApplied.map((L) => `${L.name}${L.modifier > 0 ? `+${L.modifier}` : L.modifier}`).join(",")})` : ""}` : "", S = e.advantageStateApplied && e.advantageStateApplied !== Tt ? ` | 骰态:${e.advantageStateApplied}` : "", _ = e.resultGrade ? ` | 分级:${e.resultGrade}` : "";
  if (e.source === "timeout_auto_fail") return `超时自动判定失败${v}${x}${y}${S}${_}${h}`;
  if (e.source === "ai_auto_roll") {
    const L = e.success === null ? "未判定" : e.success ? "成功" : "失败";
    return `AI自动检定，总值 ${e.result.total} (${e.compareUsed} ${e.dcUsed ?? "?"} => ${L})${v}${x}${y}${S}${_}${h}`;
  }
  const P = e.success === null ? "未判定" : e.success ? "成功" : "失败";
  return `总值 ${e.result.total} (${e.compareUsed} ${e.dcUsed ?? "?"} => ${P})${v}${x}${y}${S}${_}${h}`;
}
var Gh = "<dice_rules>", zh = "</dice_rules>", jh = "<dice_round_summary>", qh = "</dice_round_summary>", Fh = "<dice_result_guidance>", Vh = "</dice_result_guidance>", Yh = "<dice_runtime_policy>", Wh = "</dice_runtime_policy>", Xh = "<dice_active_statuses>", Jh = "</dice_active_statuses>";
function Gl(e) {
  return String(e ?? "");
}
function gi(e) {
  return String(e ?? "").replace(/\s+/g, " ").trim();
}
function wd(e) {
  return e.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function ot(e) {
  return jn(String(e || ""));
}
function wy(e) {
  const t = e?.ruleStart || Gh, r = e?.ruleEnd || zh, n = e?.runtimePolicyStart || Yh, o = e?.runtimePolicyEnd || Wh, i = e?.summaryStart || jh, c = e?.summaryEnd || qh, u = e?.guidanceStart || Fh, h = e?.guidanceEnd || Vh, f = e?.statusesStart || Xh, v = e?.statusesEnd || Jh;
  return [
    {
      start: t,
      end: r
    },
    {
      start: n,
      end: o
    },
    {
      start: i,
      end: c
    },
    {
      start: u,
      end: h
    },
    {
      start: f,
      end: v
    }
  ];
}
function Iy(e) {
  return !e || typeof e != "object" ? "" : String(e.role ?? "").trim().toLowerCase();
}
function Ay(e) {
  if (!e || typeof e != "object") return "";
  const t = e.create_date ?? e.create_time ?? e.timestamp ?? "";
  return String(t ?? "").trim();
}
function $y(e) {
  if (!e || typeof e != "object") return "";
  const t = e.id ?? e.cid ?? e.uid;
  return t == null ? "" : String(t);
}
function Ry(e) {
  switch (e) {
    case "critical_success":
      return "大成功";
    case "partial_success":
      return "勉强成功";
    case "success":
      return "成功";
    case "failure":
      return "失败";
    case "critical_failure":
      return "大失败";
    default:
      return "结果";
  }
}
function Cy(e) {
  const t = e.eventTitle || e.eventId;
  switch (e.resultGrade) {
    case "critical_success":
      return `玩家在「${t}」中掷出大成功，请用英雄化、戏剧性的口吻描述其完美完成动作，并给出额外收益。`;
    case "partial_success":
      return `玩家在「${t}」中勉强成功，请描述“成功但有代价”，代价可包含受伤、暴露、资源损失或引来威胁。`;
    case "success":
      return `玩家在「${t}」中成功，请给出稳定推进的叙事结果，避免额外惩罚。`;
    case "failure":
      return `玩家在「${t}」中失败，请描述受阻但剧情继续推进，可引入新的困难或替代路径。`;
    case "critical_failure":
      return `玩家在「${t}」中大失败，请描述显著且可感知的严重后果，同时保持后续可行动性。`;
    default:
      return `玩家在「${t}」中完成检定，请根据结果推进叙事。`;
  }
}
function Dy(e, t, r) {
  if (!Array.isArray(e) || e.length === 0) return "";
  const n = [];
  n.push(t), n.push(`v=1 count=${e.length}`);
  for (const o of e) {
    const i = Ry(o.resultGrade), c = `${o.compareUsed} ${o.dcUsed == null ? "N/A" : o.dcUsed}`, u = o.marginToDc == null ? "N/A" : String(o.marginToDc), h = o.advantageStateApplied || "normal";
    n.push(`- [${i}] event="${gi(o.eventTitle)}" target="${gi(o.targetLabel)}" total=${o.total} check=${c} margin=${u} advantage=${h}`), n.push(`  instruction: ${Cy(o)}`);
  }
  return n.push(r), ot(n.join(`
`));
}
function vt(e) {
  return xv(e);
}
function Qh(e) {
  if (!e || typeof e != "object") return "";
  const t = Number(e.swipe_id ?? e.swipeId), r = e.swipes;
  if (Array.isArray(r) && Number.isFinite(t) && t >= 0 && t < r.length) {
    const n = String(r[t] ?? "");
    if (n.trim()) return n;
  }
  return typeof e.mes == "string" && e.mes.trim() ? e.mes : vt(e);
}
function Hn(e, t) {
  mm(e, t);
}
function Ny(e) {
  return hm(e);
}
function Ly(e) {
  return pm(e);
}
function Zh(e) {
  if (!e || typeof e != "object" || Ny(e) || Ly(e)) return !1;
  const t = Iy(e);
  return t ? t === "assistant" : !0;
}
function My(e) {
  return yv(e);
}
function za(e) {
  return Sv(e);
}
function Oy(e, t, r) {
  return _v(e, {
    insertMode: "before_index",
    insertBeforeIndex: t,
    template: r,
    text: ""
  });
}
function Py(e, t, r) {
  const n = ym(String(e ?? "")), o = $y(t);
  if (o) return `prompt_user:${o}:${n}`;
  const i = Ay(t);
  return i ? `prompt_user_ts:${i}:${n}` : `prompt_user_idx:${r}:${n}`;
}
function ja(e, t) {
  let r = Gl(e);
  for (const n of wy(t)) {
    const o = new RegExp(`${wd(n.start)}[\\s\\S]*?${wd(n.end)}`, "gi");
    r = r.replace(o, `
`);
  }
  return ot(r);
}
function By(e, t, r) {
  const n = Gl(e).trim();
  return n ? n.includes(t) && n.includes(r) ? ot(n) : ot(`${t}
${n}
${r}`) : "";
}
function Uy(e) {
  const t = ["NdM"];
  e.enableExplodingDice && t.push("[!]"), e.enableAdvantageSystem && t.push("[khX|klX]"), t.push("[+/-B]");
  const r = t.join(""), n = ep(e.aiAllowedDiceSidesText), o = [];
  return o.push("【事件骰子协议（系统动态）】"), o.push("1. 仅在文末输出 ```rolljson 代码块（严禁 ```json）。"), o.push("2. 叙事正文禁止直接给出判定结果，先给事件，再由系统结算并推进剧情。"), o.push("3. rolljson 基本格式："), o.push("{"), o.push('  "type": "dice_events", "version": "1",'), o.push('  "events": [{'), o.push('    "id": "str", "title": "str", "dc": num, "desc": "str",'), o.push(`    "checkDice": "${r}",`), o.push('    "skill": "str",'), o.push('    "compare": ">=|>|<=|<",'), o.push('    "scope": "protagonist|character|all",'), o.push('    "target": { "type": "self|scene|supporting|object|other", "name": "str(可选)" }'), e.enableAiRollMode && o.push('    ,"rollMode": "auto|manual"'), e.enableAdvantageSystem && o.push('    ,"advantageState": "normal|advantage|disadvantage"'), e.enableDynamicDcReason && o.push('    ,"dc_reason": "str"'), e.enableTimeLimit && o.push('    ,"timeLimit": "PT30S"'), e.enableOutcomeBranches && (e.enableExplodingDice && e.enableExplodeOutcomeBranch ? o.push('    ,"outcomes": { "success": "str", "failure": "str", "explode": "str(爆骰优先)" }') : o.push('    ,"outcomes": { "success": "str", "failure": "str" }')), o.push("  }]"), e.enableAiRoundControl && (o.push('  ,"round_control": "continue|end_round",'), o.push('  "end_round": bool')), o.push("}"), o.push("4. 可用能力说明："), o.push(`   - checkDice 仅使用 ${r}，只能写骰式本体，禁止加入技能名、状态名、自然语言、标签或变量,仅允许一个可选修正值，禁止连续修正（如 1d20+1-1）。`), o.push("   - 合法示例：1d20、2d6+3、2d20kh1、2d20kl1、1d6!+2。"), o.push("   - 非法示例：1d20+1-1、1d20+体能、1d20+[虚弱]、1d20 (优势)。"), o.push("   - 若需施加或移除状态，请仅在 outcomes 文本中使用状态标签。"), e.enableExplodingDice && e.enableOutcomeBranches && e.enableExplodeOutcomeBranch && (o.push("   - 只有 checkDice 明确包含 ! 时，才允许提供 outcomes.explode；如果 checkDice 不含 !，必须完全省略 explode 字段。"), o.push('   - 正例：{"checkDice":"1d20!","outcomes":{"success":"...","failure":"...","explode":"..."}}'), o.push('   - 反例：{"checkDice":"1d20","outcomes":{"success":"...","failure":"...","explode":"..."}}')), n !== "none" && o.push(`   - 骰子面数限制：${n}。`), e.enableAiRollMode && o.push("   - 可使用 rollMode=auto|manual 指定是否自动掷骰。"), e.enableAiRoundControl && o.push("   - 可使用 round_control 或 end_round 控制轮次是否结束。"), e.enableExplodingDice && (o.push("   - 已启用爆骰：! 会在掷出最大面后连爆，结果会影响剧情走向。(骰式示例：1d6!+2)"), o.push("   - 爆骰是否触发由系统根据真实掷骰结果决定，不可直接声明“必爆”。"), o.push("   - 只有在你确实需要一条独立的爆骰后果分支时，才给该事件的 checkDice 加 !；没有 ! 就绝不能写 outcomes.explode。"), e.enableAiRollMode && (o.push("   - AI 自动检定时，同一轮最多仅 1 个事件使用 !，其余会按普通骰结算。"), o.push("   - 因此，请把 ! 和 outcomes.explode 留给本轮最关键、最值得出现爆骰分支的那个事件。"))), e.enableAdvantageSystem && o.push("   - 已启用优势/劣势：可用 advantageState 或 kh/kl，会改变结果并影响剧情走向。"), e.enableExplodingDice && e.enableAdvantageSystem && o.push("   - ! 与 kh/kl 不能同用。"), e.enableDynamicDcReason && o.push("   - 可填写 dc_reason 解释难度依据。"), e.enableTimeLimit && o.push("   - 可填写 timeLimit，且必须满足系统最小时限。"), e.enableOutcomeBranches && (o.push("   - outcomes 走向文本会直接影响后续剧情叙事。"), e.enableExplodingDice && e.enableExplodeOutcomeBranch && (o.push("   - 爆骰触发时优先使用 outcomes.explode。"), o.push("   - 如果你设想了“只有爆骰才发生”的特殊后果，就必须同时在 checkDice 中写 !；否则请把该后果合并到 success 或 failure。"))), e.enableStatusSystem && e.enableOutcomeBranches && (o.push("5. 可在 outcomes 中使用状态标签："), o.push("   - [APPLY_STATUS:名,整数值,turns=2,skills=A|B 或 scope=all]"), o.push("   - turns 默认 1；支持 duration= 作为 turns 别名；turns=perm 表示永久"), o.push("   - [REMOVE_STATUS:名]"), o.push("   - [CLEAR_STATUS]"), o.push("   - 负面状态必须使用负数；正面状态（加值）必须使用正数。"), o.push("   - 状态数值绝对值需与当前骰子面数匹配，避免失衡，还需要注意状态请勿轻易附加，避免破坏平衡！")), o.push("6. **必须遵守 <dice_runtime_policy> 的运行时限制。**"), ot(o.join(`
`));
}
function Ky(e) {
  const t = Uy(e), r = Gl(e.ruleText || "").trim();
  return r ? ot(`${t}

【用户自定义补充】
${r}`) : t;
}
function ep(e) {
  const t = String(e || "").split(/[,\s]+/).map((r) => Number(String(r || "").trim())).filter((r) => Number.isFinite(r) && Number.isInteger(r) && r > 0);
  return t.length <= 0 ? "none" : Array.from(new Set(t)).sort((r, n) => r - n).join(",");
}
function Hy(e, t = 20) {
  try {
    const r = JSON.parse(String(e || "{}"));
    if (!r || typeof r != "object" || Array.isArray(r)) return {
      count: 0,
      preview: "empty"
    };
    const n = Object.entries(r).filter(([i, c]) => String(i || "").trim().length > 0 && Number.isFinite(Number(c))).map(([i, c]) => [String(i).trim(), Number(c)]);
    if (n.length <= 0) return {
      count: 0,
      preview: "empty"
    };
    const o = n.slice(0, Math.max(1, t)).map(([i, c]) => `${gi(i)}:${c}`).join(",");
    return {
      count: n.length,
      preview: o || "empty"
    };
  } catch {
    return {
      count: 0,
      preview: "invalid_json"
    };
  }
}
function Gy(e, t, r) {
  const n = ep(e.aiAllowedDiceSidesText), o = Hy(e.skillTableText), i = [];
  return i.push(t), i.push("v=1"), i.push(`apply_scope=${e.eventApplyScope}`), i.push(`round_mode=${e.enableAiRoundControl ? "continuous" : "per_round"}`), i.push(`roll_mode_allowed=${e.enableAiRollMode ? "auto|manual" : "manual_only"}`), i.push(`ai_round_control_enabled=${e.enableAiRoundControl ? 1 : 0}`), i.push(`round_control_allowed=${e.enableAiRoundControl ? "continue|end_round" : "disabled"}`), i.push(`explode_enabled=${e.enableExplodingDice ? 1 : 0}`), i.push(`ai_auto_explode_event_limit_per_round=${e.enableAiRollMode ? 1 : 0}`), i.push(`advantage_enabled=${e.enableAdvantageSystem ? 1 : 0}`), i.push(`dynamic_dc_reason_enabled=${e.enableDynamicDcReason ? 1 : 0}`), i.push(`status_system_enabled=${e.enableStatusSystem ? 1 : 0}`), i.push(`status_tags_allowed=${e.enableStatusSystem ? 1 : 0}`), i.push(`status_sign_rule=${e.enableStatusSystem ? "debuff_negative,buff_positive" : "disabled"}`), i.push(`outcome_branches_enabled=${e.enableOutcomeBranches ? 1 : 0}`), i.push(`explode_outcome_enabled=${e.enableExplodeOutcomeBranch ? 1 : 0}`), i.push(`time_limit_enabled=${e.enableTimeLimit ? 1 : 0}`), i.push(`min_time_limit_seconds=${Math.max(1, Math.floor(Number(e.minTimeLimitSeconds) || 1))}`), i.push(`allowed_sides=${n}`), i.push(`skill_system_enabled=${e.enableSkillSystem ? 1 : 0}`), i.push(`skill_table_count=${o.count}`), i.push(`skill_table_preview=${o.preview}`), i.push(`summary_detail=${e.summaryDetailMode}`), i.push(`summary_rounds=${e.summaryHistoryRounds}`), i.push(`summary_include_outcome=${e.includeOutcomeInSummary ? 1 : 0}`), i.push(`list_outcome_preview=${e.showOutcomePreviewInListCard ? 1 : 0}`), i.push(r), ot(i.join(`
`));
}
function zy(e, t) {
  const r = ot(e), n = t.map((o) => ot(o)).filter((o) => o.length > 0);
  return n.length ? r ? `${r}

${n.join(`

`)}` : n.join(`

`) : r;
}
function jy(e, t, r, n, o, i) {
  if (!t.enableDynamicResultGuidance)
    return e.outboundResultGuidance ? (delete e.outboundResultGuidance, {
      text: "",
      changedMeta: !0
    }) : {
      text: "",
      changedMeta: !1
    };
  if (n && e.outboundResultGuidance && e.outboundResultGuidance.userMsgId === r) return {
    text: ot(e.outboundResultGuidance.guidanceText),
    changedMeta: !1
  };
  const c = Array.isArray(e.pendingResultGuidanceQueue) ? e.pendingResultGuidanceQueue : [];
  if (c.length <= 0)
    return e.outboundResultGuidance ? (delete e.outboundResultGuidance, {
      text: "",
      changedMeta: !0
    }) : {
      text: "",
      changedMeta: !1
    };
  const u = c.splice(0, c.length), h = Dy(u, o, i);
  return e.outboundResultGuidance = {
    userMsgId: r,
    rollId: u[u.length - 1]?.rollId || u[0]?.rollId || "",
    guidanceText: h
  }, {
    text: h,
    changedMeta: !0
  };
}
function qy(e, t) {
  const r = e.findIndex((n) => n.roundId === t.roundId);
  return r >= 0 ? (e[r] = t, !0) : (e.push(t), !0);
}
function Fy(e) {
  return fm(e);
}
function Vy(e) {
  return Ev(e);
}
function Yy(e, t, r = "unknown") {
  const n = t.getSettingsEvent();
  if (!n.enabled) return;
  t.sweepTimeoutFailuresEvent();
  const o = Fy(e);
  if (o.length <= 0) return;
  const i = o.find((le) => za(le.messages) >= 0) || null;
  if (!i || i.messages.length <= 0) return;
  const c = za(i.messages);
  if (c < 0) return;
  const u = i.messages[c];
  if (!u) return;
  const h = t.DICE_RULE_BLOCK_START_Event || Gh, f = t.DICE_RULE_BLOCK_END_Event || zh, v = t.DICE_RUNTIME_POLICY_BLOCK_START_Event || Yh, x = t.DICE_RUNTIME_POLICY_BLOCK_END_Event || Wh, y = t.DICE_SUMMARY_BLOCK_START_Event || jh, S = t.DICE_SUMMARY_BLOCK_END_Event || qh, _ = t.DICE_RESULT_GUIDANCE_BLOCK_START_Event || Fh, P = t.DICE_RESULT_GUIDANCE_BLOCK_END_Event || Vh, L = t.DICE_ACTIVE_STATUSES_BLOCK_START_Event || Xh, M = t.DICE_ACTIVE_STATUSES_BLOCK_END_Event || Jh, B = {
    ruleStart: h,
    ruleEnd: f,
    runtimePolicyStart: v,
    runtimePolicyEnd: x,
    summaryStart: y,
    summaryEnd: S,
    guidanceStart: _,
    guidanceEnd: P,
    statusesStart: L,
    statusesEnd: M
  }, C = ja(vt(u), B), G = Py(C, u, c);
  vt(u) !== C && Hn(u, C);
  const F = t.getDiceMetaEvent(), Z = F.lastPromptUserMsgId === G;
  let H = !1;
  if (Z || (F.lastPromptUserMsgId = G, H = !0), !Z && F.pendingRound && Array.isArray(F.pendingRound.events) && F.pendingRound.events.length > 0) {
    const le = t.ensureSummaryHistoryEvent(F), be = t.createRoundSummarySnapshotEvent(F.pendingRound, Date.now());
    if (qy(le, be)) {
      t.trimSummaryHistoryEvent(le), H = !0;
      const we = Tv();
      we && Lm("stx_rollhelper", we, "round_summaries", {
        recordId: be.roundId,
        payload: be
      });
    }
  }
  !Z && !n.enableAiRoundControl && F.pendingRound?.status === "open" && (F.pendingRound.status = "closed", H = !0, de.info("已按“每轮模式”在用户发言后结束当前轮次"));
  let X = "", K = "";
  n.autoSendRuleToAI && (X = By(Ky(n), h, f), K = Gy(n, v, x));
  let z = "";
  if (Z && F.outboundSummary && F.outboundSummary.userMsgId === G) z = ot(F.outboundSummary.summaryText);
  else {
    const le = t.ensureSummaryHistoryEvent(F);
    z = ot(t.buildSummaryBlockFromHistoryEvent(le, n.summaryDetailMode, n.summaryHistoryRounds, n.includeOutcomeInSummary)), z ? F.outboundSummary = {
      userMsgId: G,
      roundId: F.pendingRound?.roundId || "",
      summaryText: z
    } : F.outboundSummary && delete F.outboundSummary, H = !0;
  }
  const se = jy(F, n, G, Z, _, P), ie = ot(se.text);
  se.changedMeta && (H = !0);
  const ue = n.enableStatusSystem ? kb(Cr(F), L, M) : "", Ae = [];
  for (const le of o) {
    const be = za(le.messages);
    if (be < 0) {
      Ae.push(`${le.path}:skip_no_user`);
      continue;
    }
    const we = le.messages[be];
    if (!we) {
      Ae.push(`${le.path}:skip_no_user`);
      continue;
    }
    const Pe = ja(vt(we), B);
    vt(we) !== Pe && Hn(we, Pe);
    const Fe = My(le.messages);
    let xe = Fe >= 0 ? le.messages[Fe] : null, Ve = Fe >= 0 ? "reuse_system" : "create_system";
    const Me = zy(ja(xe ? vt(xe) : "", B), [
      X,
      K,
      z,
      ie,
      ue
    ]);
    if (!xe && Me && (xe = Oy(le.messages, be, we)), xe) {
      const Rt = Me;
      vt(xe) !== Rt ? Hn(xe, Rt) : Ve === "create_system" ? Ve = "create_system_unchanged" : Ve = "reuse_system_unchanged", Ve === "create_system" && !Rt ? Ve = "create_system_empty" : Ve === "reuse_system" && !Rt && (Ve = "reuse_system_cleared");
    } else Ve = "no_system_needed";
    Ae.push(`${le.path}:${Ve}`);
  }
  H && t.saveMetadataSafeEvent(), de.info(`通过 ${r} 更新了提示词管理块 (路径=${o.map((le) => le.path).join(",")} 块=规则:${X ? 1 : 0},运行时:${K ? 1 : 0},摘要:${z ? 1 : 0},指引:${ie ? 1 : 0},状态:${ue ? 1 : 0} 操作=${Ae.join(";")})`);
}
function tp(e) {
  return Mh(e, sm);
}
function er(e) {
  Hh(e, {
    getSettingsEvent: Ee,
    resolveEventTargetEvent: Pl,
    parseIsoDurationToMsEvent: tp,
    applyTimeLimitPolicyMsEvent: Ol
  });
}
function rp(e) {
  return Xx(e, {
    getSettingsEvent: Ee,
    OUTCOME_TEXT_MAX_LEN_Event: 400,
    ISO_8601_DURATION_REGEX_Event: sm
  });
}
function np(e, t) {
  return Jx(e, t, jn);
}
function Wy(e) {
  return py(e, { parseDiceExpression: Qt });
}
function Xy(e, t, r) {
  return yy(e, t, r, {
    getSettingsEvent: Ee,
    getDiceMetaEvent: Ce,
    normalizeCompareOperatorEvent: zo,
    createSyntheticTimeoutDiceResultEvent: Wy,
    resolveSkillModifierBySkillNameEvent: Ko,
    createIdEvent: Rr
  });
}
function sp(e, t, r = Date.now()) {
  return Sy(e, t, {
    getSettingsEvent: Ee,
    getLatestRollRecordForEvent: Zt,
    ensureRoundEventTimersSyncedEvent: er,
    createTimeoutFailureRecordEvent: Xy
  }, r);
}
function Dr() {
  return Ey({
    getSettingsEvent: Ee,
    getDiceMetaEvent: Ce,
    ensureRoundEventTimersSyncedEvent: er,
    recordTimeoutFailureIfNeededEvent: sp,
    saveMetadataSafeEvent: Jt
  });
}
function Jy(e, t) {
  return xy(e, t, {
    getSettingsEvent: Ee,
    getDiceMetaEvent: Ce,
    createIdEvent: Rr,
    parseIsoDurationToMsEvent: tp,
    applyTimeLimitPolicyMsEvent: Ol,
    resolveEventTargetEvent: Pl,
    saveMetadataSafeEvent: Jt
  });
}
function Qy(e, t) {
  return ky(e, t, {
    getSettingsEvent: Ee,
    resolveTriggeredOutcomeEvent: Hl,
    formatEventModifierBreakdownEvent: fl
  });
}
function Zy(e, t = Date.now()) {
  return Qx(e, {
    ensureRoundEventTimersSyncedEvent: er,
    getSettingsEvent: Ee,
    getLatestRollRecordForEvent: Zt,
    resolveTriggeredOutcomeEvent: Hl,
    normalizeCompareOperatorEvent: zo
  }, t);
}
function eS(e, t, r, n) {
  return ly(e, t, r, n, {
    SUMMARY_HISTORY_ROUNDS_MAX_Event: 10,
    SUMMARY_HISTORY_ROUNDS_MIN_Event: 1,
    SUMMARY_MAX_EVENTS_Event: 20,
    SUMMARY_MAX_TOTAL_EVENT_LINES_Event: 60,
    DICE_SUMMARY_BLOCK_START_Event: Zu,
    DICE_SUMMARY_BLOCK_END_Event: em
  });
}
function tS(e) {
  ey(e, 20);
}
function rS(e, t = "unknown") {
  Yy(e, {
    getSettingsEvent: Ee,
    DICE_RULE_BLOCK_START_Event: Xg,
    DICE_RULE_BLOCK_END_Event: Jg,
    DICE_SUMMARY_BLOCK_START_Event: Zu,
    DICE_SUMMARY_BLOCK_END_Event: em,
    DICE_RESULT_GUIDANCE_BLOCK_START_Event: Qg,
    DICE_RESULT_GUIDANCE_BLOCK_END_Event: Zg,
    DICE_RUNTIME_POLICY_BLOCK_START_Event: ev,
    DICE_RUNTIME_POLICY_BLOCK_END_Event: tv,
    DICE_ACTIVE_STATUSES_BLOCK_START_Event: rv,
    DICE_ACTIVE_STATUSES_BLOCK_END_Event: nv,
    sweepTimeoutFailuresEvent: Dr,
    getDiceMetaEvent: Ce,
    ensureSummaryHistoryEvent: Zx,
    createRoundSummarySnapshotEvent: Zy,
    trimSummaryHistoryEvent: tS,
    buildSummaryBlockFromHistoryEvent: eS,
    saveMetadataSafeEvent: Jt
  }, t);
}
var nS = `.st-rh-card-scope{--st-rh-font-main: "STRHSourceSong";--st-rh-font-display: "STRHSourceSong";--st-rh-text: #dbd2c2;--st-rh-text-muted: #9e9381;--st-rh-title: #e6c587;--st-rh-label: #b0915a;--st-rh-meta: #7a6850;--st-rh-emphasis: #ffdc7a;--st-rh-emphasis-text-shadow: 0 1px 2px rgba(0, 0, 0, .72);--st-rh-border-soft: #4a3e2f;--st-rh-border-strong: #755b38;--st-rh-border-highlight: #b08f4c;--st-rh-royal-title: #efd8a5;--st-rh-royal-ink: #eadfc7;--st-rh-royal-shadow: rgba(8, 5, 3, .82);--st-rh-royal-border: #8e6b3c;--st-rh-royal-border-soft: rgba(182, 146, 85, .28);--st-rh-royal-red: #8b3b2d;--st-rh-royal-red-soft: rgba(139, 59, 45, .24);--st-rh-royal-glow: rgba(242, 212, 143, .15);--st-rh-royal-scroll: linear-gradient(180deg, rgba(73, 55, 37, .24), rgba(23, 16, 10, .18)), linear-gradient(135deg, rgba(218, 191, 144, .06), rgba(84, 60, 35, .1)), repeating-linear-gradient(0deg, rgba(255, 245, 220, .028) 0px, rgba(255, 245, 220, .028) 1px, transparent 1px, transparent 3px);--st-rh-royal-panel: radial-gradient(circle at top, rgba(246, 223, 172, .08), transparent 52%), linear-gradient(145deg, rgba(40, 30, 20, .96), rgba(14, 10, 7, .98));--st-rh-royal-panel-strong: radial-gradient(circle at top, rgba(250, 226, 178, .12), transparent 46%), linear-gradient(145deg, rgba(43, 31, 22, .98), rgba(10, 7, 5, 1));--st-rh-panel-bg: linear-gradient(135deg, rgba(28, 22, 17, .96) 0%, rgba(15, 11, 8, .98) 100%), url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" opacity="0.03"><filter id="noise"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" stitchTiles="stitch"/></filter><rect width="60" height="60" filter="url(%23noise)"/></svg>');--st-rh-panel-inner: rgba(10, 7, 5, .5);--st-rh-panel-soft: rgba(36, 28, 22, .7);--st-rh-shadow: 0 4px 12px rgba(0, 0, 0, .9), inset 0 0 20px rgba(0, 0, 0, .6);--st-rh-shadow-hover: 0 6px 16px rgba(0, 0, 0, .95), inset 0 0 30px rgba(0, 0, 0, .7), 0 0 10px rgba(176, 143, 76, .2);color:var(--st-rh-text);font-family:var(--st-rh-font-main);font-size:13px;text-align:left;line-height:1.35;container-type:inline-size}.st-rh-card-switch{width:100%;container-type:inline-size}.st-rh-widget-container>.st-rh-card-switch+.st-rh-card-switch{margin-top:12px}.st-rh-card-variant{width:100%}.st-rh-card-variant-mobile{display:none!important}.st-rh-card-variant-desktop{display:block}.st-rh-card-scope *{box-sizing:border-box}.st-rh-card-scope i[class*=fa-],.st-rh-card-scope .st-rh-fa-icon,.st-rh-card-scope .st-rh-chip-icon,.st-rh-card-scope .st-rh-summary-chip-icon,.st-rh-card-scope .st-rh-action-icon,.st-rh-card-scope .st-rh-btn-icon,.st-rh-card-scope .st-rh-fact-label-icon{color:inherit;-webkit-text-fill-color:currentColor}.st-rh-title-font{font-family:var(--st-rh-font-display);font-weight:700;letter-spacing:.03em;text-shadow:0 2px 4px rgba(0,0,0,.8)}.st-rh-title-text{color:var(--st-rh-title)}.st-rh-meta-text{color:var(--st-rh-meta)}.st-rh-emphasis-text{color:var(--st-rh-emphasis);text-shadow:var(--st-rh-emphasis-text-shadow)}.st-rh-inline-divider{display:inline-block;margin-inline:.25rem;color:var(--st-rh-border-soft)}.st-rh-inline-divider-wide{margin-inline:.4rem}.st-rh-inline-chip{display:inline-flex;align-items:center;border:1px solid var(--st-rh-border-soft);border-radius:1px;padding:.1rem .35rem;font-size:11px;line-height:1.2;font-family:var(--st-rh-font-display);box-shadow:1px 1px 2px #0009}.st-rh-inline-chip-gap{gap:.2rem}.st-rh-inline-chip-fluid{min-width:0;max-width:100%}.st-rh-chip-soft{background:var(--st-rh-panel-soft);color:var(--st-rh-text-muted);border-color:#5e4c3399}.st-rh-chip-strong{background:linear-gradient(180deg,#96764566,#30241acc);color:var(--st-rh-emphasis);border-color:var(--st-rh-border-strong);text-shadow:0 1px 2px rgba(0,0,0,.9)}.st-rh-status-badge{font-family:var(--st-rh-font-display);font-weight:800;letter-spacing:.15em;text-transform:uppercase;position:relative;overflow:hidden}.st-rh-status-pill{border:1px solid color-mix(in srgb,var(--st-rh-status-color, #d8aa58) 60%,transparent);background:linear-gradient(135deg,color-mix(in srgb,var(--st-rh-status-color, #d8aa58) 35%,rgba(0,0,0,.8)),#140f0ae6);color:color-mix(in srgb,var(--st-rh-status-color, #d8aa58) 80%,white 20%);text-shadow:0 2px 4px rgba(0,0,0,1);box-shadow:inset 0 0 10px #000c,0 0 15px color-mix(in srgb,var(--st-rh-status-color, #d8aa58) 25%,transparent)}.st-rh-status-pill:after{content:"";position:absolute;top:0;left:-100%;width:50%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.1),transparent);transform:skew(-20deg)}.st-rh-panel{border:1px solid var(--st-rh-border-strong);border-radius:1px;background:var(--st-rh-panel-inner);box-shadow:inset 0 0 6px #000c,0 2px 4px #00000080;position:relative}.st-rh-info-panel,.st-rh-meta-panel{padding:.5rem .6rem}.st-rh-kicker{font-family:var(--st-rh-font-display);font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--st-rh-label);padding-bottom:1px;margin-bottom:2px;margin-block-start:0}.st-rh-kicker-hero{letter-spacing:.15em;border-bottom:none}.st-rh-kicker-compact{font-size:9px;letter-spacing:.05em;margin-bottom:2px}.st-rh-panel-copy{margin-top:.3rem;font-size:12px;line-height:1.4}.st-rh-detail-note{color:var(--st-rh-text)}.st-rh-detail-note strong{color:var(--st-rh-title)}.st-rh-surface-card{padding:.4rem;border:1px solid var(--st-rh-border-soft);background:#0006;box-shadow:inset 0 2px 6px #0009;border-left:2px solid var(--st-rh-border-strong)}.st-rh-fact-label{margin-bottom:.1rem;color:var(--st-rh-meta);font-size:9px;font-family:var(--st-rh-font-display);text-transform:uppercase}.st-rh-fact-value{font-size:10px;line-height:1.35;color:var(--st-rh-text);text-shadow:0 1px 2px rgba(0,0,0,.8)}.st-rh-fact-value-accent{color:#7b99cc}.st-rh-fact-value-mono{font-family:ui-monospace,monospace}.st-rh-fact-subline{margin-top:.1rem;font-size:10px;color:var(--st-rh-meta)}.st-rh-subhint{margin-top:.1rem;font-size:10px;font-style:italic}.st-rh-body-copy{font-size:13px;line-height:1.4;color:var(--st-rh-text);text-indent:1em}.st-rh-meta-copy{margin-top:.25rem;font-size:11px;line-height:1.35;color:var(--st-rh-text-muted)}.st-rh-meta-copy-spaced{margin-top:.35rem}.st-rh-tip-label{display:inline-flex;align-items:center;gap:.35rem;cursor:help;color:var(--st-rh-label);border-bottom:1px dotted var(--st-rh-meta);font-family:var(--st-rh-font-main);font-size:12px}.st-rh-inline-tip-segment{display:inline-flex;align-items:baseline;gap:.18rem;cursor:help;border-bottom:1px dashed color-mix(in srgb,var(--st-rh-meta) 80%,transparent);line-height:1.1;text-decoration:none}.st-rh-impact-note,.st-rh-note-box{margin-top:.4rem;padding:.4rem;border-radius:1px;line-height:1.35;font-family:var(--st-rh-font-main)}.st-rh-impact-note{border:1px double #ad3131;background:radial-gradient(circle at center,#3c0f0f4d,#0009);font-size:12px;color:#eea4a4;box-shadow:inset 0 0 10px #50000066}.st-rh-note-box{border:1px dashed var(--st-rh-border-soft);background:#0006;font-size:12px}.st-rh-dc-note-stack{display:inline-flex;flex-wrap:wrap;align-items:center;gap:.45rem .55rem}.st-rh-dc-note-copy{color:var(--st-rh-text-muted);font-style:italic}.st-rh-dc-modifier-chip{gap:.32rem;padding-inline:.45rem;border-color:color-mix(in srgb,var(--st-rh-border-strong) 78%,transparent);background:linear-gradient(180deg,#98733257,#291c0ee6);color:var(--st-rh-emphasis)}.st-rh-dc-modifier-label{font-size:10px;letter-spacing:.08em;color:var(--st-rh-label)}.st-rh-dc-modifier-value{font-family:ui-monospace,monospace;font-size:12px;color:#f3d89b}.st-rh-stack-md>*+*{margin-top:1rem}.st-rh-mini-kicker{font-size:10px;font-family:var(--st-rh-font-display);color:var(--st-rh-label);border-bottom:1px solid rgba(255,255,255,.05);padding-bottom:6px}.st-rh-value-copy{margin-top:.25rem;font-size:13px;font-family:ui-monospace,monospace}.st-rh-distribution-copy,.st-rh-timeout-copy{margin-top:.35rem;text-align:center;font-size:13px}.st-rh-timeout-stamp{display:block;margin-top:.25rem;color:#a94442;font-weight:700}@media (prefers-reduced-motion: reduce){.st-rh-card-scope .st-rh-summary-toggle-icon,.st-rh-card-scope .st-rh-settlement-shell{transition:none;animation:none}}@supports not (container-type: inline-size){@media (max-width: 680px){.st-rh-card-switch>.st-rh-card-variant-desktop{display:none!important}.st-rh-card-switch>.st-rh-card-variant-mobile{display:block!important}}}@container (max-width: 680px){.st-rh-card-switch>.st-rh-card-variant-desktop{display:none!important}.st-rh-card-switch>.st-rh-card-variant-mobile{display:block!important}}@media (max-width: 680px){.st-rh-widget-container>.st-rh-card-switch+.st-rh-card-switch{margin-top:10px}}`, sS = `.st-rh-card-scope{--rh-border: #755b38;--rh-border-soft: rgba(176, 143, 76, .25);--rh-bg: linear-gradient(145deg, #18120f 0%, #0a0705 100%);--rh-text: #dbd2c2;--rh-text-dim: #9e9381;--rh-title: #e6c587;--rh-accent: #fce1a1;--rh-chip-bg: rgba(255, 255, 255, .03);--rh-chip-border: rgba(120, 100, 70, .2);--rh-glow: 0 4px 12px rgba(0, 0, 0, .8), inset 0 0 20px rgba(0, 0, 0, .5);color:var(--rh-text);font-family:var(--st-rh-font-main)}.st-rh-event-board{position:relative;border:1px solid var(--st-rh-border-strong);background:var(--st-rh-panel-bg);box-shadow:var(--st-rh-shadow);border-radius:3px;overflow:hidden;margin-top:10px;padding-bottom:8px}.st-rh-event-board:before{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(255,236,188,.04),transparent 18%),linear-gradient(90deg,rgba(176,143,76,.06),transparent 15%,transparent 85%,rgba(176,143,76,.04)),url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><path d="M0,0 L10,10 L0,20 Z" fill="rgba(176,143,76,0.03)"/><path d="M40,40 L30,30 L40,20 Z" fill="rgba(176,143,76,0.03)"/></svg>');pointer-events:none;z-index:0}.st-rh-event-board:after{content:"";position:absolute;inset:2px;border:1px solid rgba(176,143,76,.15);pointer-events:none;z-index:1}.st-rh-board-head{padding:10px 14px 9px;background:linear-gradient(180deg,#281c14fa,#0f0a08);border-bottom:2px solid var(--st-rh-border-strong);display:flex;justify-content:space-between;align-items:center;box-shadow:0 2px 8px #000c;position:relative}.st-rh-board-head:after{content:"";position:absolute;bottom:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(230,197,135,.3),transparent)}.st-rh-board-title{font-family:var(--st-rh-font-display);font-size:16px;color:var(--st-rh-title);text-shadow:0 2px 4px rgba(0,0,0,.9),0 0 10px rgba(230,197,135,.15);letter-spacing:.08em;display:flex;align-items:center;gap:8px}.st-rh-board-title:before{content:"♦";color:var(--st-rh-border-highlight);font-size:12px}.st-rh-board-id{font-size:11px;color:var(--st-rh-meta)}.st-rh-board-head-right{display:flex;flex-direction:column;align-items:flex-end;gap:4px;max-width:100%}.st-rh-event-list{list-style:none;padding:12px 12px 14px;margin:0;display:flex;flex-direction:column;gap:14px;background:linear-gradient(180deg,#07050438,#00000014)}@media (max-width: 768px){.st-rh-event-board{margin-top:6px;border-radius:4px}.st-rh-board-head{flex-direction:row;align-items:center;gap:8px;padding:6px 10px}.st-rh-board-title{font-size:13px}.st-rh-board-id{max-width:100%;font-size:10px}.st-rh-board-head-right{align-items:flex-end;width:auto}.st-rh-event-list{padding:10px;gap:12px}}@media (max-width: 430px){.st-rh-board-head{padding:6px 8px}.st-rh-board-title{font-size:12px;letter-spacing:0}.st-rh-board-id{display:none}.st-rh-event-list{padding:8px;gap:10px}}@container (max-width: 768px){.st-rh-event-board{margin-top:6px;border-radius:4px}.st-rh-board-head{flex-direction:row;align-items:center;gap:8px;padding:6px 10px}.st-rh-board-title{font-size:13px}.st-rh-board-id{max-width:100%;font-size:10px}.st-rh-board-head-right{align-items:flex-end;width:auto}.st-rh-event-list{padding:10px;gap:12px}}@container (max-width: 430px){.st-rh-board-head{padding:6px 8px}.st-rh-board-title{font-size:12px;letter-spacing:0}.st-rh-board-id{display:none}.st-rh-event-list{padding:8px;gap:10px}}`, oS = ".st-rh-event-board-mobile{margin-top:8px;border-width:1px;border-radius:3px;padding-bottom:6px;background:linear-gradient(180deg,#120d0afa,#070504fa),radial-gradient(circle at top center,rgba(230,197,135,.08),transparent 48%)}.st-rh-event-board-mobile:before{background:linear-gradient(180deg,rgba(255,236,188,.05),transparent 16%),linear-gradient(90deg,rgba(176,143,76,.08),transparent 20%,transparent 80%,rgba(176,143,76,.05))}.st-rh-board-head-mobile{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:end;padding:8px 10px;border-bottom-width:1px}.st-rh-board-head-copy-mobile{min-width:0;display:flex;flex-direction:column;gap:2px}.st-rh-board-title-mobile{font-size:14px;letter-spacing:.1em}.st-rh-board-caption-mobile{color:#dcc49094;font-size:10px;letter-spacing:.18em;text-transform:uppercase}.st-rh-board-id-mobile{align-self:center;max-width:132px;font-size:10px;color:#dcc49080;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.st-rh-event-list-mobile{padding:8px;gap:10px}@media (min-width: 481px) and (max-width: 680px){.st-rh-board-head-mobile{padding:10px 12px}.st-rh-board-title-mobile{font-size:15px}.st-rh-board-id-mobile{max-width:176px}.st-rh-event-list-mobile{padding:10px;gap:12px}}", aS = `.st-rh-event-item{position:relative;border:1px solid rgba(176,143,76,.3);background:linear-gradient(180deg,#140f0cd9,#0a0806f2),repeating-linear-gradient(45deg,rgba(0,0,0,.03) 0px,rgba(0,0,0,.03) 2px,transparent 2px,transparent 4px);box-shadow:inset 0 0 0 1px #ffdfa30a,0 4px 12px #0009;border-radius:2px;margin-bottom:6px;transition:transform .2s ease,box-shadow .2s ease,border-color .2s ease}.st-rh-event-item:before{content:"";position:absolute;inset:1px;border:1px dashed rgba(176,143,76,.15);pointer-events:none;z-index:1}.st-rh-event-item:hover{border-color:#b08f4c99;box-shadow:inset 0 0 0 1px #ffdfa31a,0 6px 16px #000c,0 0 12px #b08f4c26;transform:translateY(-1px)}.st-rh-event-item:hover:before{border-color:#b08f4c4d}.st-rh-event-item:after{display:none}.st-rh-details-card{border-radius:0;background:transparent;padding:0;margin:0}.st-rh-details-card>summary{list-style:none;cursor:pointer}.st-rh-details-card>summary::-webkit-details-marker{display:none}.st-rh-collapse-summary{position:relative;padding:12px 14px 11px;background:linear-gradient(180deg,#201812f2,#0e0a08e0);border-bottom:1px solid rgba(255,255,255,.03);transition:background .2s cubic-bezier(.2,.8,.2,1),box-shadow .2s ease}.st-rh-collapse-summary:before{content:"";position:absolute;inset:0;background:linear-gradient(90deg,rgba(200,160,80,.15),transparent 20%,transparent 80%,rgba(200,160,80,.1)),radial-gradient(ellipse at top,rgba(255,236,188,.08),transparent 60%);opacity:0;transition:opacity .3s ease;pointer-events:none}.st-rh-collapse-summary:after{content:"";position:absolute;bottom:0;left:10%;right:10%;height:1px;background:radial-gradient(circle,rgba(176,143,76,.5) 0%,transparent 100%);opacity:.6}.st-rh-collapse-summary:hover:before,.st-rh-details-card[open]>.st-rh-collapse-summary:before{opacity:1}.st-rh-summary-layout{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px 14px;align-items:center}.st-rh-details-event .st-rh-summary-header{display:flex;position:relative;align-items:center;gap:10px;padding-bottom:10px;margin-bottom:10px;border-bottom:1px solid rgba(255,255,255,.1)}.st-rh-details-event .st-rh-header-deco-left,.st-rh-details-event .st-rh-header-deco-right{width:12px;height:12px;background:radial-gradient(circle at center,var(--st-rh-border-highlight) 30%,transparent 60%);flex-shrink:0;position:relative}.st-rh-details-event .st-rh-header-deco-left:after,.st-rh-details-event .st-rh-header-deco-right:after{content:"✦";position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);color:var(--st-rh-title);font-size:10px;text-shadow:0 0 4px rgba(255,200,100,.8)}.st-rh-details-event .st-rh-header-deco-left{margin-right:2px}.st-rh-details-event .st-rh-header-deco-right{margin-left:8px}.st-rh-details-event .st-rh-summary-main{min-width:0;display:flex;flex-direction:column;gap:8px}.st-rh-details-event .st-rh-summary-title-row{min-width:0;display:flex;flex:1 1 auto;align-items:center;gap:8px}.st-rh-details-event .st-rh-summary-badge-slot{display:inline-flex;align-items:center;flex:0 0 auto}.st-rh-details-event .st-rh-summary-badge-slot:empty{display:none}.st-rh-details-event .st-rh-summary-title{min-width:0;display:block;flex:1 1 auto;font-family:var(--st-rh-font-display);color:var(--rh-accent);font-size:16px;font-weight:700;line-height:1.28;text-shadow:0 1px 2px rgba(0,0,0,.8)}.st-rh-details-event .st-rh-summary-title-marquee-mobile{display:block;overflow:hidden}.st-rh-details-event .st-rh-summary-title-marquee-mobile.is-overflowing{mask-image:linear-gradient(90deg,transparent 0,#000 6%,#000 94%,transparent 100%);-webkit-mask-image:linear-gradient(90deg,transparent 0,#000 6%,#000 94%,transparent 100%)}.st-rh-details-event .st-rh-summary-title-track-mobile{display:inline-flex;align-items:center;min-width:max-content;width:max-content;transform:translate(0)}.st-rh-details-event .st-rh-summary-title-marquee-mobile.is-overflowing .st-rh-summary-title-track-mobile{animation:st-rh-mobile-title-marquee var(--st-rh-marquee-duration, 8s) ease-in-out infinite alternate}.st-rh-details-event .st-rh-summary-title-segment-mobile{display:inline-flex;align-items:center;white-space:nowrap}.st-rh-details-event .st-rh-summary-id{display:inline-flex;flex:0 0 auto;align-items:center;min-height:24px;max-width:180px;padding:0 2px;color:#d6bf9357;font-size:9px;letter-spacing:.04em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.st-rh-details-event .st-rh-summary-mobile-meta{display:flex;justify-content:flex-end;min-height:10px}.st-rh-summary-info-row{min-width:0;display:flex;align-items:center;gap:8px;flex-wrap:wrap}.st-rh-summary-info-bar{display:flex;flex-wrap:wrap;gap:6px;align-items:center;flex:1 1 auto}.st-rh-summary-runtime-slot{flex:1 1 220px;min-width:0}.st-rh-summary-runtime-slot .st-rh-runtime{width:100%;min-width:0;justify-content:center}.st-rh-badge-role{display:inline-flex;align-items:center;justify-content:center;width:64px;height:20px;margin-right:8px;font-size:11px;font-family:var(--st-rh-font-display);font-weight:700;letter-spacing:.1em;border-radius:2px;box-shadow:inset 0 0 6px #000c,0 2px 4px #0009;text-shadow:0 1px 2px rgba(0,0,0,.9);border:1px solid var(--st-rh-border-strong);vertical-align:top;position:relative;overflow:hidden}.st-rh-badge-role:after{content:"";position:absolute;top:0;left:-100%;width:50%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.15),transparent);transform:skew(-20deg)}.st-rh-badge-role-auto{background:linear-gradient(135deg,#7a2828,#4a1515);color:#f0d49e;border-color:#a53b3b}.st-rh-badge-role-manual{background:linear-gradient(135deg,#2c3e50,#1a252f);color:#bdc3c7;border-color:#4a657c}.st-rh-summary-chip{display:inline-flex;align-items:center;gap:.32rem;min-height:24px;padding:0 8px;border:1px solid rgba(110,87,52,.85);background:linear-gradient(180deg,#1c1510eb,#0a0705e0);color:var(--st-rh-text-muted);font-size:10px;letter-spacing:.04em;box-shadow:inset 0 0 6px #000000a6}.st-rh-summary-chip-check{color:#dfc48c;font-family:JetBrains Mono,Consolas,monospace}.st-rh-summary-chip-time{color:#d79282}.st-rh-summary-actions{display:grid;grid-auto-flow:column;grid-auto-columns:minmax(0,1fr);align-items:stretch;gap:8px;min-width:220px;width:clamp(332px,30vw,356px);justify-self:end;align-self:center}.st-rh-summary-actions>*{margin:0;flex:1 1 auto;min-width:0;white-space:nowrap}.st-rh-roll-btn,.st-rh-runtime,.st-rh-summary-lock,.st-rh-details-event .st-rh-summary-toggle-state{min-height:32px;height:32px;box-sizing:border-box;line-height:1;font-size:11px;display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:0 8px;margin:0;border-radius:3px;width:100%;white-space:nowrap}.st-rh-roll-btn{background:linear-gradient(180deg,#8a362a,#4a150e);border:1px solid #c76150;color:#faeed7;font-family:var(--st-rh-font-display);font-weight:700;cursor:pointer;box-shadow:0 2px 8px #000000e6,inset 0 1px 1px #ffa0a04d,inset 0 -2px 6px #0009;transition:all .2s cubic-bezier(.2,.8,.2,1);text-shadow:0 1px 3px rgba(0,0,0,1);position:relative;overflow:hidden}.st-rh-roll-btn:before{content:"";position:absolute;top:0;left:-100%;width:50%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.15),transparent);transform:skew(-20deg);transition:left .4s ease}.st-rh-roll-btn:hover:not(:disabled){background:linear-gradient(180deg,#a84436,#631d14);border-color:#d67a6b;box-shadow:0 4px 12px #000,inset 0 1px 2px #ffb4b466,0 0 15px #c8463766;transform:translateY(-1px)}.st-rh-roll-btn:hover:not(:disabled):before{left:200%}.st-rh-roll-btn:active:not(:disabled){background:linear-gradient(180deg,#5c2016,#3a0d08);box-shadow:0 1px 3px #000000e6,inset 0 3px 8px #000000d9;transform:translateY(1px)}.st-rh-roll-btn:disabled{background:#3a322e;color:#7a6e65;border-color:#2b2420;cursor:not-allowed;box-shadow:none;text-shadow:none}.st-rh-runtime{color:#f0b1a8;background:linear-gradient(180deg,#52161257,#1e0a0a73);border:1px solid rgba(189,84,73,.28);box-shadow:inset 0 0 8px #00000073;font-size:11px;text-shadow:0 1px 2px rgba(0,0,0,.9)}.st-rh-runtime-inline{margin:0;white-space:nowrap}.st-rh-summary-lock{border:1px solid rgba(176,143,76,.2);color:#8c7b60;background:#0a070599;letter-spacing:.04em;font-family:JetBrains Mono,Consolas,monospace}.st-rh-details-event .st-rh-summary-toggle-state{border:1px solid rgba(126,102,62,.72);background:linear-gradient(180deg,#2b211af5,#140f0ce6);color:var(--st-rh-text);font-family:var(--st-rh-font-display);font-size:10px;box-shadow:0 1px 4px #000000b8;transition:background .2s ease,border-color .2s ease,color .2s ease;cursor:pointer;user-select:none}.st-rh-details-event .st-rh-summary-toggle-state:hover{background:linear-gradient(180deg,#b89556eb,#886731eb);border-color:#c9a86a;color:#1a120c;font-weight:700}.st-rh-details-event .st-rh-summary-toggle-icon{width:1rem;height:1rem;display:inline-flex;justify-content:center;align-items:center;transition:transform .3s cubic-bezier(.4,0,.2,1);line-height:1;font-size:10px;opacity:.9}.st-rh-fa-icon{display:inline-flex;align-items:center;justify-content:center;flex:0 0 auto;line-height:1}.st-rh-summary-chip-icon{font-size:.82rem;opacity:.86}.st-rh-action-icon,.st-rh-btn-icon{font-size:.82rem;opacity:.9}.st-rh-fact-label-icon{color:#d8b87a;font-size:.84rem;opacity:.9}.st-rh-details-event .st-rh-summary-toggle-icon .fa-solid{font-size:.72rem}.st-rh-details-event .st-rh-toggle-open{display:none}.st-rh-details-event[open] .st-rh-toggle-open{display:inline}.st-rh-details-event[open] .st-rh-toggle-closed{display:none}.st-rh-details-event[open] .st-rh-summary-toggle-icon{transform:rotate(180deg);color:inherit}.st-rh-card-details-body{display:none}.st-rh-details-card[open]>.st-rh-card-details-body{display:block}.st-rh-card-details-body.st-rh-anim-opening{display:block!important;overflow:hidden;animation:st-rh-slide-open .3s ease-out forwards}.st-rh-card-details-body.st-rh-anim-closing{display:block!important;overflow:hidden;animation:st-rh-slide-close .25s ease-in forwards}@keyframes st-rh-slide-open{0%{max-height:0;opacity:0;transform:translateY(-6px)}to{max-height:2000px;opacity:1;transform:translateY(0)}}@keyframes st-rh-slide-close{0%{max-height:2000px;opacity:1;transform:translateY(0)}to{max-height:0;opacity:0;transform:translateY(-6px)}}@keyframes st-rh-mobile-title-marquee{0%{transform:translate(0)}12%{transform:translate(0)}88%{transform:translate(var(--st-rh-marquee-distance, 0px))}to{transform:translate(var(--st-rh-marquee-distance, 0px))}}.st-rh-card-details-body.st-rh-event-details{padding:12px;background:linear-gradient(180deg,#080604fa,#0d0a08eb);border-top:1px solid rgba(176,143,76,.36);box-shadow:inset 0 1px #ffdca00d}.st-rh-event-body{display:flex;flex-direction:column;gap:12px}.st-rh-event-narrative,.st-rh-event-note-stack{display:grid;gap:8px}.st-rh-event-desc{padding:10px 12px;border:1px solid rgba(176,143,76,.22);background:linear-gradient(180deg,#1b1510d6,#0c0907e0);font-size:13px;line-height:1.55;color:var(--st-rh-text);font-size:15px;font-family:var(--st-rh-font-main);font-weight:700;text-align:center;box-shadow:inset 0 0 14px #0000006b}.st-rh-event-preview-slot:empty,.st-rh-event-note-slot:empty,.st-rh-event-fact-modifier:empty{display:none}.st-rh-event-fact-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.st-rh-event-fact{min-width:0;padding:8px 10px;border:1px solid rgba(176,143,76,.25);background:linear-gradient(135deg,#1c140ff2,#0c0806e6);box-shadow:inset 0 0 16px #000c,0 2px 4px #00000080;position:relative;display:flex;flex-direction:column;gap:5px;align-items:center;text-align:center}.st-rh-event-fact:after{content:"";position:absolute;inset:1px;border:1px dashed rgba(255,255,255,.03);pointer-events:none}.st-rh-event-fact-wide{grid-column:1 / -1}.st-rh-event-fact-modifier{display:flex;flex-direction:row;justify-content:center;align-items:center;padding:8px 12px;background:linear-gradient(90deg,transparent,rgba(140,100,40,.2),transparent)!important;border:none!important;border-top:1px solid rgba(176,143,76,.3)!important;border-bottom:1px solid rgba(176,143,76,.3)!important;box-shadow:inset 0 0 20px #00000080!important}.st-rh-event-fact-modifier:after{display:none!important}.st-rh-event-fact-modifier .st-rh-chip{background:transparent!important;border:none!important;box-shadow:none!important;font-size:13px;font-family:var(--st-rh-font-main);color:#e6c587}.st-rh-event-fact-modifier .st-rh-chip .st-rh-tip-label{color:#d8b87a;font-weight:700;letter-spacing:.1em;border-bottom:1px dashed rgba(216,184,122,.5)}.st-rh-event-fact-modifier .st-rh-chip .st-rh-inline-tip-segment{color:#d8b87a;font-weight:700;letter-spacing:.04em;border-bottom-color:#d8b87a80}.st-rh-event-fact-label{display:flex;align-items:center;justify-content:center;gap:.35rem;min-height:16px;font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--st-rh-label);border-bottom:1px solid rgba(176,143,76,.2);padding-bottom:3px;width:100%}.st-rh-event-fact-label .st-rh-tip-label{color:var(--st-rh-label);border-bottom-color:#b08f4c59}.st-rh-event-fact-value{min-width:0;color:var(--st-rh-text);font-size:12px;line-height:1.4;word-break:break-word;text-shadow:0 1px 2px rgba(0,0,0,.72)}.st-rh-event-fact-value-target{color:#8ba5d6}.st-rh-event-fact-value-skill{color:#f1e4c2;cursor:help}.st-rh-event-fact-value-highlight{color:var(--st-rh-emphasis)}.st-rh-event-fact-value-mono{color:#e6c587;font-family:JetBrains Mono,Consolas,monospace}.st-rh-event-fact-value-time{color:#d99191}.st-rh-chip{display:inline-flex;align-items:center;justify-content:flex-start;gap:4px;font-size:12px;line-height:1.35;color:var(--st-rh-text);text-align:left}.st-rh-chip-highlight{color:#d4b574;font-weight:700}.st-rh-chip-target{color:#7b99cc}.st-rh-chip-dice,.st-rh-chip-check{color:#e6c587;font-family:JetBrains Mono,Consolas,monospace}.st-rh-chip-time{color:#cc4545}.st-rh-dc-reason,.st-rh-rolled-block{margin:0;padding:9px 11px;border-radius:1px}.st-rh-dc-reason{font-size:13px;line-height:1.5;color:var(--st-rh-text-muted);border:1px dashed rgba(176,143,76,.4);background:#0f0a0899;position:relative}.st-rh-dc-reason:before{content:"i";position:absolute;top:-8px;left:-8px;width:16px;height:16px;background:var(--st-rh-border-strong);color:#000;border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:var(--st-rh-font-display);font-size:10px;font-weight:700}.st-rh-dc-reason .st-rh-dc-note-stack{display:flex;justify-content:center;justify-items:center}.st-rh-rolled-block{display:flex;justify-items:center;justify-content:center;border:1px solid rgba(139,101,8,.42);background:linear-gradient(180deg,#17100af2,#0d0a08eb);font-size:12px;line-height:1.45;color:var(--st-rh-emphasis);text-align:left;box-shadow:inset 0 0 10px #0009;font-family:var(--st-rh-font-main)}.st-rh-event-footer{padding-top:2px;text-align:center}.st-rh-event-footer.is-centered{justify-content:center}.st-rh-command{display:inline-flex;align-items:center;max-width:100%;padding:4px 10px;background:linear-gradient(90deg,#000c,#140a0599,#000c);border-radius:2px;color:#a3947a;border:1px solid rgba(80,65,50,.8);border-top-color:#78645099;font-size:10px;box-shadow:inset 0 2px 4px #0009;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;position:relative}.st-rh-command:before{content:">_";color:var(--st-rh-border-strong);margin-right:6px;font-weight:700}.st-rh-mono{font-family:JetBrains Mono,Consolas,monospace}.st-rh-tip-label{display:inline-flex;align-items:center;justify-content:center;cursor:help;border-bottom:1px dotted rgba(255,223,163,.55);color:#e8dcb5}.st-rh-outcome-preview-wrap{margin-top:12px;margin-bottom:12px;padding:12px 14px;border:1px solid rgba(197,160,89,.4);border-radius:6px;background:linear-gradient(135deg,#1e1e1ebf,#0f0f0fe6);position:relative;box-shadow:inset 0 0 20px #000c,0 2px 8px #0000004d}.st-rh-outcome-preview-wrap:before{content:"";position:absolute;inset:2px;border:1px dashed rgba(197,160,89,.15);border-radius:4px;pointer-events:none}.st-rh-outcome-preview-header{margin-bottom:12px;display:flex;align-items:center;justify-content:center}.st-rh-outcome-preview-header-line{flex-grow:1;height:1px;background:linear-gradient(90deg,transparent,rgba(197,160,89,.5));margin-right:12px}.st-rh-outcome-preview-header-line.right{background:linear-gradient(270deg,transparent,rgba(197,160,89,.5));margin-right:0;margin-left:12px}.st-rh-outcome-preview-header-title{font-family:var(--st-rh-font-display);font-weight:700;color:#d1b67f;font-size:13px;letter-spacing:2px;text-shadow:0 1px 2px rgba(0,0,0,.8);display:flex;align-items:center}.st-rh-outcome-preview-row{display:flex;margin-bottom:8px;padding:8px 10px;border-radius:4px;border-left:3px solid transparent;transition:all .25s ease;background:#0003;border:1px solid rgba(255,255,255,.03);position:relative;overflow:hidden}.st-rh-outcome-preview-row:hover{background-color:#c5a05914;border-left-color:#c5a059b3;border-color:#c5a05933;box-shadow:inset 40px 0 40px -20px #c5a05926;transform:translate(2px)}.st-rh-outcome-preview-row:after{content:"";position:absolute;inset:0;background:url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="4" height="4"><rect width="4" height="4" fill="none"/><rect x="0" y="0" width="1" height="1" fill="rgba(255,255,255,0.03)"/></svg>');pointer-events:none;opacity:.5}.st-rh-outcome-success{border-left-color:#52c41a80}.st-rh-outcome-failure{border-left-color:#ff4d4f80}.st-rh-outcome-explode{border-left-color:#faad1480}.st-rh-outcome-preview-row:hover.st-rh-outcome-success{border-left-color:#52c41ae6}.st-rh-outcome-preview-row:hover.st-rh-outcome-failure{border-left-color:#ff4d4fe6}.st-rh-outcome-preview-row:hover.st-rh-outcome-explode{border-left-color:#faad14e6}.st-rh-outcome-preview-badge{display:inline-flex;align-items:center;justify-content:center;min-width:60px;padding:2px 10px;margin-right:12px;border-width:1px;border-style:solid;border-radius:4px;font-size:11px;font-weight:700;line-height:1.6;white-space:nowrap;user-select:none;box-shadow:0 2px 6px #0000004d,inset 0 1px #ffffff1a;text-shadow:0 1px 2px rgba(0,0,0,.6);position:relative;z-index:1}.st-rh-outcome-preview-content{flex:1;min-width:0;display:flex;flex-direction:column;gap:6px;justify-content:center;position:relative;z-index:1}.st-rh-outcome-preview-text{color:#e4d8c0;word-break:break-word;line-height:1.6;font-size:13px;text-shadow:0 1px 1px rgba(0,0,0,.8)}.st-rh-outcome-preview-status{display:inline-flex;align-items:center;gap:8px;padding:4px 10px;border-width:1px;border-style:solid;border-radius:4px;box-shadow:inset 0 1px 4px #0000004d;align-self:flex-start}.st-rh-outcome-preview-status-label{flex:0 0 auto;font-size:11px;letter-spacing:.08em;white-space:nowrap;line-height:1.2;font-weight:700;text-transform:uppercase;border-right:1px solid currentColor;padding-right:8px;opacity:.9}.st-rh-outcome-preview-status-text{color:#d9c8a2;font-size:11px;line-height:1.45;word-break:break-word}@media (max-width: 860px){.st-rh-summary-layout{grid-template-columns:minmax(0,1fr)}.st-rh-summary-actions{display:flex;min-width:0;width:100%;justify-content:flex-start;padding-top:8px;border-top:1px dashed rgba(255,255,255,.08);flex-wrap:wrap}.st-rh-event-fact-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media (max-width: 768px){.st-rh-collapse-summary{padding:9px 10px}.st-rh-card-details-body.st-rh-event-details{padding:10px}.st-rh-event-fact-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.st-rh-details-event .st-rh-summary-title{font-size:14px}.st-rh-details-event .st-rh-summary-id{max-width:140px}}@media (max-width: 520px){.st-rh-collapse-summary{padding:8px 9px}.st-rh-details-event .st-rh-summary-id{max-width:100%}.st-rh-summary-actions{min-width:100%;width:100%;gap:6px}.st-rh-runtime,.st-rh-roll-btn,.st-rh-summary-lock,.st-rh-details-event .st-rh-summary-toggle-state{width:100%}.st-rh-summary-actions>*:last-child:nth-child(odd){grid-column:1 / -1}.st-rh-event-desc,.st-rh-rolled-block,.st-rh-dc-reason{font-size:12px;line-height:1.45}}@media (prefers-reduced-motion: reduce){.st-rh-roll-btn,.st-rh-details-event .st-rh-summary-toggle-state,.st-rh-collapse-summary{transition:none}.st-rh-roll-btn:hover{transform:none}.st-rh-details-event .st-rh-summary-toggle-icon,.st-rh-card-details-body{transition:none;animation:none}.st-rh-details-event .st-rh-summary-title-marquee-mobile.is-overflowing .st-rh-summary-title-track-mobile{animation:none}}@container (max-width: 860px){.st-rh-summary-layout{grid-template-columns:minmax(0,1fr)}.st-rh-summary-actions{display:flex;min-width:0;width:100%;justify-content:flex-start;padding-top:8px;border-top:1px dashed rgba(255,255,255,.08);flex-wrap:wrap}.st-rh-event-fact-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@container (max-width: 768px){.st-rh-collapse-summary{padding:9px 10px}.st-rh-card-details-body.st-rh-event-details{padding:10px}.st-rh-event-fact-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.st-rh-details-event .st-rh-summary-title{font-size:14px}.st-rh-details-event .st-rh-summary-id{max-width:140px}}@container (max-width: 680px){.st-rh-collapse-summary{padding:10px 10px 9px}.st-rh-details-event .st-rh-summary-header{margin-bottom:8px;padding-bottom:8px}.st-rh-details-event .st-rh-summary-title{font-size:15px;line-height:1.34}.st-rh-summary-info-row{display:grid;grid-template-columns:repeat(3,minmax(max-content,1fr));gap:6px}.st-rh-summary-info-bar{display:contents}.st-rh-summary-chip,.st-rh-runtime{min-height:36px;justify-content:center;padding:0 10px;line-height:1;white-space:nowrap}.st-rh-summary-runtime-slot{flex:initial}.st-rh-summary-actions{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:6px;min-width:100%;width:100%;padding-top:0;border-top:none}.st-rh-roll-btn,.st-rh-summary-lock,.st-rh-details-event .st-rh-summary-toggle-state{min-height:38px;height:38px;width:100%;padding:0 10px}.st-rh-details-event .st-rh-summary-id{max-width:160px;min-height:auto;padding:0;border:none;background:transparent;color:#d6bf9338;font-size:8px;letter-spacing:.08em}.st-rh-event-desc{text-align:left;font-size:14px}.st-rh-event-fact-grid{grid-template-columns:minmax(0,1fr);gap:7px}.st-rh-event-fact{align-items:stretch;text-align:left}.st-rh-event-fact-label{justify-content:flex-start;font-size:10px}.st-rh-event-fact-value{text-align:left}.st-rh-dc-reason,.st-rh-rolled-block,.st-rh-command{font-size:12px;line-height:1.45}.st-rh-command{display:flex;width:100%;justify-content:flex-start;padding:7px 10px}}@container (min-width: 480px) and (max-width: 680px){.st-rh-event-fact-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.st-rh-event-fact-wide{grid-column:1 / -1}}@container (max-width: 380px){.st-rh-summary-info-row,.st-rh-summary-actions{grid-template-columns:minmax(0,1fr)}}`, iS = ".st-rh-event-item-mobile{margin-bottom:0;border-color:#b08f4c42;background:linear-gradient(180deg,#120d0aeb,#080605f7),repeating-linear-gradient(45deg,rgba(255,255,255,.01) 0px,rgba(255,255,255,.01) 2px,transparent 2px,transparent 4px);box-shadow:inset 0 0 0 1px #ffdfa308,0 4px 10px #0000009e}.st-rh-collapse-summary-mobile{padding:10px 10px 9px}.st-rh-summary-mobile-shell{display:flex;flex-direction:column;gap:9px}.st-rh-summary-mobile-head{display:block;min-width:0;padding-bottom:6px;border-bottom:1px solid rgba(255,255,255,.08);overflow:hidden}.st-rh-summary-title-row-mobile{display:flex;align-items:center;gap:8px;min-width:0}.st-rh-summary-badge-slot-mobile{display:inline-flex;align-items:center;flex:0 0 auto}.st-rh-summary-badge-slot-mobile:empty{display:none}.st-rh-summary-title-mobile{display:block;flex:1 1 auto;min-width:0;font-size:15px;line-height:1.34;text-align:left;overflow:hidden}.st-rh-summary-title-marquee-mobile{display:block;overflow:hidden}.st-rh-summary-title-marquee-mobile.is-overflowing{mask-image:linear-gradient(90deg,transparent 0,#000 6%,#000 94%,transparent 100%);-webkit-mask-image:linear-gradient(90deg,transparent 0,#000 6%,#000 94%,transparent 100%)}.st-rh-summary-title-track-mobile{display:inline-flex;align-items:center;min-width:max-content;width:max-content;transform:translate(0)}.st-rh-summary-title-marquee-mobile.is-overflowing .st-rh-summary-title-track-mobile{animation:st-rh-mobile-title-marquee var(--st-rh-marquee-duration, 8s) ease-in-out infinite alternate}.st-rh-summary-title-segment-mobile{display:inline-flex;align-items:center;white-space:nowrap}.st-rh-mobile-marquee{display:block;flex:1 1 auto;min-width:0;overflow:hidden}.st-rh-mobile-marquee.is-overflowing{mask-image:linear-gradient(90deg,transparent 0,#000 6%,#000 94%,transparent 100%);-webkit-mask-image:linear-gradient(90deg,transparent 0,#000 6%,#000 94%,transparent 100%)}.st-rh-mobile-marquee-track{display:inline-flex;align-items:center;min-width:max-content;width:max-content;transform:translate(0)}.st-rh-mobile-marquee.is-overflowing .st-rh-mobile-marquee-track{animation:st-rh-mobile-title-marquee var(--st-rh-marquee-duration, 8s) ease-in-out infinite alternate}.st-rh-mobile-marquee-segment{display:inline-flex;align-items:center;white-space:nowrap}.st-rh-summary-id-mobile{min-height:auto;max-width:160px;padding:0;color:#d6bf9338;font-size:8px;letter-spacing:.08em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.st-rh-summary-mobile-meta{display:flex;justify-content:flex-end;min-height:10px}@keyframes st-rh-mobile-title-marquee{0%{transform:translate(0)}12%{transform:translate(0)}88%{transform:translate(var(--st-rh-marquee-distance, 0px))}to{transform:translate(var(--st-rh-marquee-distance, 0px))}}.st-rh-summary-mobile-info-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}.st-rh-summary-mobile-info{display:inline-flex;align-items:center;justify-content:center;gap:6px;min-width:0;min-height:34px;padding:0 10px;border:1px solid rgba(110,87,52,.85);background:linear-gradient(180deg,#1c1510f5,#0b0806e6);color:var(--st-rh-text-muted);font-size:11px;line-height:1;letter-spacing:.04em;white-space:nowrap;box-shadow:inset 0 0 8px #000000b3}.st-rh-summary-mobile-info-check{color:#dfc48c;font-family:JetBrains Mono,Consolas,monospace}.st-rh-summary-mobile-info-time{justify-content:flex-start;overflow:hidden;color:#d79282}.st-rh-summary-mobile-info-time .st-rh-summary-chip-icon{flex:0 0 auto}.st-rh-summary-mobile-info-marquee{text-align:left}.st-rh-runtime-mobile{display:inline-flex;align-items:center;justify-content:center;min-height:36px;height:36px;padding:0 10px;font-size:11px;line-height:1;min-width:0;width:100%;white-space:nowrap}.st-rh-summary-mobile-actions{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:6px}.st-rh-summary-mobile-actions>*{min-width:0}.st-rh-summary-mobile-actions .st-rh-roll-btn,.st-rh-summary-mobile-actions .st-rh-summary-lock,.st-rh-summary-mobile-actions .st-rh-summary-toggle-state{min-height:38px;height:38px;width:100%;padding:0 10px;font-size:11px}.st-rh-event-details-mobile{padding:10px}.st-rh-event-body-mobile{gap:10px}.st-rh-event-mobile-lead{display:grid;gap:8px}.st-rh-event-desc-mobile{padding:10px 11px;font-size:14px;line-height:1.55;text-align:left}.st-rh-event-preview-slot-mobile .st-rh-outcome-preview-wrap{margin:0;padding:10px 11px}.st-rh-event-preview-slot-mobile .st-rh-outcome-preview-header-title{font-size:12px;letter-spacing:.12em}.st-rh-event-preview-slot-mobile .st-rh-outcome-preview-row{margin-bottom:6px;padding:8px 9px}.st-rh-event-preview-slot-mobile .st-rh-outcome-preview-badge{min-width:54px;margin-right:10px;padding:2px 8px}.st-rh-event-preview-slot-mobile .st-rh-outcome-preview-text{font-size:12px;line-height:1.5}.st-rh-event-fact-grid-mobile{grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}.st-rh-event-fact-mobile{padding:8px 10px;gap:4px}.st-rh-event-fact-mobile .st-rh-event-fact-label{justify-content:flex-start;font-size:10px}.st-rh-event-fact-mobile .st-rh-event-fact-value{text-align:left;font-size:12px}.st-rh-event-fact-grid-mobile .st-rh-event-fact-modifier{padding:6px 8px}.st-rh-event-fact-grid-mobile .st-rh-event-fact-modifier .st-rh-chip{font-size:12px}.st-rh-event-note-stack-mobile{gap:7px}.st-rh-event-note-stack-mobile .st-rh-dc-reason,.st-rh-event-note-stack-mobile .st-rh-rolled-block{padding:8px 10px;font-size:12px;line-height:1.5}.st-rh-event-footer-mobile{padding-top:0}.st-rh-command-mobile{display:flex;width:100%;justify-content:flex-start;padding:7px 10px;font-size:10px;white-space:nowrap}@media (min-width: 481px) and (max-width: 680px){.st-rh-collapse-summary-mobile{padding:11px 12px 10px}.st-rh-summary-title-mobile{font-size:16px}.st-rh-summary-mobile-actions .st-rh-roll-btn,.st-rh-summary-mobile-actions .st-rh-summary-lock,.st-rh-summary-mobile-actions .st-rh-summary-toggle-state{min-height:40px;height:40px}.st-rh-event-details-mobile{padding:12px}.st-rh-event-fact-grid-mobile{grid-template-columns:repeat(2,minmax(0,1fr))}.st-rh-event-fact-grid-mobile .st-rh-event-fact-wide{grid-column:1 / -1}}@media (max-width: 380px){.st-rh-summary-mobile-info-grid,.st-rh-summary-mobile-actions{grid-template-columns:minmax(0,1fr)}}@media (prefers-reduced-motion: reduce){.st-rh-summary-title-marquee-mobile.is-overflowing .st-rh-summary-title-track-mobile{animation:none}}", lS = '.st-rh-shell-frame{position:relative;overflow:hidden;border:1px solid var(--st-rh-royal-border);border-radius:2px;padding:2px;background:linear-gradient(135deg,#644b2cbf,#1f160ff5),repeating-linear-gradient(45deg,rgba(255,234,200,.03) 0px,rgba(255,234,200,.03) 2px,transparent 2px,transparent 5px);box-shadow:0 10px 20px #000000b8,inset 0 0 0 1px #000000e0,inset 0 0 18px #ffdc8c0a}.st-rh-shell-frame:before,.st-rh-shell-frame:after{content:"";position:absolute;width:16px;height:16px;border:2px solid var(--st-rh-border-highlight);pointer-events:none;z-index:3;opacity:.82;box-shadow:0 0 4px #000000bf}.st-rh-shell-frame:before{top:-1px;left:-1px;border-right:none;border-bottom:none}.st-rh-shell-frame:after{right:-1px;bottom:-1px;border-left:none;border-top:none}.st-rh-settlement-shell{position:relative;overflow:hidden;border:1px solid rgba(0,0,0,.85);background:var(--st-rh-royal-panel);box-shadow:var(--st-rh-shadow);transition:border-color .24s ease,box-shadow .24s ease,transform .24s ease}.st-rh-settlement-shell:before{content:"";position:absolute;inset:0;background:radial-gradient(circle at top,rgba(255,236,192,.06),transparent 40%),linear-gradient(180deg,rgba(255,223,153,.04),transparent 18%,transparent 82%,rgba(255,223,153,.03));pointer-events:none;opacity:.75}.st-rh-settlement-shell[open]{border-color:#8e6b3ce0;box-shadow:0 14px 28px #000000c7,inset 0 0 26px #0009,0 0 14px #b08f4c24}.st-rh-shell-topline{position:relative;height:4px;background:linear-gradient(90deg,transparent 0%,rgba(126,94,48,.22) 8%,rgba(218,186,120,.92) 50%,rgba(126,94,48,.22) 92%,transparent 100%);box-shadow:0 1px 3px #000c}.st-rh-shell-summary{display:block;cursor:pointer;list-style:none;position:relative}.st-rh-shell-summary::-webkit-details-marker{display:none}.st-rh-summary-wrap{display:grid;gap:.65rem;padding:.72rem .72rem .78rem;position:relative}.st-rh-result-summary-grid{grid-template-columns:minmax(0,1fr) auto;align-items:start;column-gap:14px}.st-rh-summary-ornament{grid-column:1 / -1;display:flex;align-items:center;justify-content:center;gap:10px;min-height:14px;opacity:.9;margin-bottom:5px}.st-rh-summary-ornament-line{flex:1 1 auto;max-width:140px;height:1px;background:linear-gradient(90deg,transparent,rgba(214,180,114,.56),transparent)}.st-rh-summary-ornament-seal{position:relative;width:24px;height:24px;border-radius:50%;border:1px solid rgba(219,190,126,.42);background:radial-gradient(circle at 35% 35%,rgba(255,239,191,.3),transparent 42%),radial-gradient(circle at center,#523216f2,#1a120bfa);box-shadow:inset 0 0 0 1px #ffe6b014,0 0 10px #b08f4c24}.st-rh-summary-ornament-seal:before,.st-rh-summary-ornament-seal:after{content:"";position:absolute;inset:5px;border:1px solid rgba(217,188,124,.28);transform:rotate(45deg)}.st-rh-summary-ornament-seal:after{inset:8px;background:radial-gradient(circle at center,rgba(235,205,148,.45),transparent 68%)}.st-rh-result-summary-main{min-width:0;display:flex;flex-direction:column;gap:.58rem}.st-rh-summary-banner{position:relative;padding:1px;background:linear-gradient(180deg,#c9a7656b,#47311b8c);box-shadow:0 6px 12px #0000006b,inset 0 0 0 1px #ffe5a30a}.st-rh-summary-banner-inner{position:relative;padding:.72rem .9rem;background:radial-gradient(circle at top,rgba(244,222,169,.1),transparent 58%),linear-gradient(180deg,#2e2117fa,#110b08f5);overflow:hidden}.st-rh-summary-banner-inner:before{content:"";position:absolute;inset:3px;border:1px solid rgba(212,180,112,.14);pointer-events:none}.st-rh-settlement-shell .st-rh-summary-header{display:flex;align-items:center;gap:10px;min-width:0}.st-rh-settlement-shell .st-rh-header-deco-left,.st-rh-settlement-shell .st-rh-header-deco-right{position:relative;flex:0 0 16px;width:16px;height:16px}.st-rh-settlement-shell .st-rh-header-deco-left:before,.st-rh-settlement-shell .st-rh-header-deco-right:before,.st-rh-settlement-shell .st-rh-header-deco-left:after,.st-rh-settlement-shell .st-rh-header-deco-right:after{content:"";position:absolute;inset:0}.st-rh-settlement-shell .st-rh-header-deco-left:before,.st-rh-settlement-shell .st-rh-header-deco-right:before{border:1px solid rgba(214,180,110,.52);transform:rotate(45deg)}.st-rh-settlement-shell .st-rh-header-deco-left:after,.st-rh-settlement-shell .st-rh-header-deco-right:after{inset:4px;border-radius:50%;background:radial-gradient(circle at center,rgba(237,214,162,.92),rgba(123,89,47,.32) 56%,transparent 62%)}.st-rh-settlement-shell .st-rh-summary-title{flex:1 1 auto;min-width:0;display:flex;align-items:center;overflow:hidden;color:var(--st-rh-royal-title);font-family:var(--st-rh-font-display);font-size:15px;line-height:1.35;letter-spacing:.04em;text-shadow:0 2px 4px var(--st-rh-royal-shadow)}.st-rh-settlement-shell .st-rh-summary-title-marquee{display:block;flex:1 1 auto;min-width:0;max-width:100%;overflow:hidden}.st-rh-settlement-shell .st-rh-summary-title-marquee.is-overflowing{mask-image:linear-gradient(90deg,transparent 0,#000 5%,#000 95%,transparent 100%);-webkit-mask-image:linear-gradient(90deg,transparent 0,#000 5%,#000 95%,transparent 100%)}.st-rh-settlement-shell .st-rh-summary-title-track{display:inline-flex;align-items:center;min-width:max-content;width:max-content;max-width:none;transform:translate(0);will-change:transform}.st-rh-settlement-shell .st-rh-summary-title-marquee.is-overflowing .st-rh-summary-title-track{animation:st-rh-settlement-title-marquee var(--st-rh-marquee-duration, 8s) ease-in-out infinite alternate}.st-rh-settlement-shell .st-rh-summary-title-segment{display:inline-flex;align-items:center;min-width:max-content;white-space:nowrap}@keyframes st-rh-settlement-title-marquee{0%{transform:translate(0)}12%{transform:translate(0)}88%{transform:translate(var(--st-rh-marquee-distance, 0px))}to{transform:translate(var(--st-rh-marquee-distance, 0px))}}.st-rh-settlement-shell .st-rh-summary-id{flex:0 0 auto;display:inline-flex;align-items:center;min-height:24px;max-width:180px;padding:0 6px;border:1px solid rgba(135,105,63,.38);background:#08060475;color:#e1cca094;font-size:10px;letter-spacing:.08em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.st-rh-summary-badge-desktop,.st-rh-summary-badge{display:inline-flex}.st-rh-summary-primary,.st-rh-summary-secondary{display:flex;flex-wrap:wrap;gap:7px}.st-rh-summary-judgement{position:relative;align-items:center;padding-left:5px;padding-right:5px;border:1px solid rgba(184,149,90,.32);background:linear-gradient(180deg,#2d2117eb,#100c09fa),repeating-linear-gradient(90deg,rgba(255,240,210,.015) 0px,rgba(255,240,210,.015) 1px,transparent 1px,transparent 5px);box-shadow:inset 0 0 0 1px #ffecc30a,inset 0 -12px 20px #0000003d,0 4px 10px #00000057}.st-rh-summary-judgement:before{content:"";position:absolute;inset:3px;border:1px dashed rgba(186,151,90,.12);pointer-events:none}.st-rh-summary-judgement>.st-rh-summary-badge,.st-rh-summary-judgement>.st-rh-inline-chip{position:relative;z-index:1;align-items:center}.st-rh-summary-judgement>.st-rh-inline-chip{min-height:24px;padding:.42rem .82rem;border-radius:2px;line-height:1;box-shadow:inset 0 0 0 1px #ffecc308,0 3px 8px #0000004d}.st-rh-summary-judgement>.st-rh-summary-badge{min-height:36px;padding:0;box-shadow:none}.st-rh-summary-judgement>.st-rh-summary-badge .st-rh-status-pill{min-height:24px;padding:.42rem .9rem;align-items:center;justify-content:center;line-height:1;border-radius:2px}.st-rh-summary-judgement>.st-rh-chip-strong{background:linear-gradient(180deg,#84623594,#342417eb);border-color:#ab884fa3}.st-rh-summary-judgement>.st-rh-chip-soft{background:linear-gradient(180deg,#392b1de0,#150f0bf0);border-color:#745a3985;color:#e3d0aadb}.st-rh-summary-outcome-wrap{position:relative;overflow:hidden;padding:0;border:1px solid rgba(174,138,79,.26);border-left:3px solid rgba(189,151,87,.62);background:var(--st-rh-royal-scroll);box-shadow:inset 0 0 0 1px #ffeebe08,0 4px 10px #0000003d}.st-rh-summary-outcome-wrap:before{content:"";position:absolute;inset:0;background:linear-gradient(90deg,rgba(255,226,164,.08),transparent 28%,transparent 72%,rgba(255,226,164,.06)),radial-gradient(circle at top left,rgba(255,238,191,.06),transparent 44%);pointer-events:none}.st-rh-summary-outcome-scroll{position:relative;z-index:1;display:flex;flex-direction:column;gap:0}.st-rh-summary-mobile-hero{display:none}.st-rh-chip-icon{margin-right:6px;opacity:.86;font-size:.9em;color:var(--st-rh-border-highlight)}.st-rh-summary-chip-outcome{display:block!important;border:none!important;background:transparent!important;padding:.82rem .92rem .76rem!important;color:var(--st-rh-royal-ink)!important;font-size:15px;font-style:italic;line-height:1.6;box-shadow:none!important}.st-rh-summary-chip-status-summary{display:flex!important;align-items:center;margin:0 .82rem .82rem;min-height:34px;padding:.55rem .78rem;border:1px solid rgba(122,94,57,.34)!important;border-radius:999px;background:linear-gradient(180deg,#322517db,#110b08eb)!important;color:#e6d6b2f5!important;box-shadow:inset 0 0 0 1px #ffecc308,inset 0 0 14px #00000047}.st-rh-summary-outcome-scroll>.st-rh-inline-chip:first-child{display:flex;align-items:center;min-height:38px;padding:.62rem .92rem;border:none!important;border-bottom:1px solid rgba(191,153,91,.18)!important;border-radius:0!important;background:linear-gradient(180deg,#533b226b,#22160e47)!important;color:#d5b880eb!important;box-shadow:inset 0 -1px #00000038!important;font-family:var(--st-rh-font-display);font-size:13px;letter-spacing:.06em}.st-rh-summary-outcome-scroll>.st-rh-inline-chip:first-child .st-rh-chip-icon{color:#d5b880d1;font-size:.95rem}.st-rh-summary-outcome-scroll .st-rh-summary-chip-outcome .st-rh-chip-icon{display:none}.st-rh-summary-outcome-scroll .st-rh-summary-chip-status-summary .st-rh-chip-icon{color:#e0bd78e6}.st-rh-result-summary-side{min-width:0;display:flex;flex-direction:column;align-items:flex-end;gap:10px}.st-rh-summary-visual-wrap{display:flex;justify-content:center;width:100%}.st-rh-summary-visual-dais{position:relative;display:inline-flex;align-items:center;justify-content:center;padding:10px;border:1px solid rgba(170,132,77,.42);background:radial-gradient(circle at top,rgba(244,224,179,.14),transparent 48%),linear-gradient(180deg,#3c2a19f2,#0e0a07fa);box-shadow:inset 0 0 0 1px #ffe8b60d,inset 0 -16px 18px #0000006b,0 6px 12px #0006}.st-rh-summary-visual-dais:before,.st-rh-summary-visual-dais:after{content:"";position:absolute;width:14px;height:14px;border:1px solid rgba(210,179,118,.42);transform:rotate(45deg);background:linear-gradient(135deg,#523a20f2,#130d09fa)}.st-rh-summary-visual-dais:before{top:-7px;left:calc(50% - 7px)}.st-rh-summary-visual-dais:after{bottom:-7px;left:calc(50% - 7px)}.st-rh-dice-slot{position:relative;display:inline-flex;align-items:center;justify-content:center;border:1px solid var(--st-rh-border-strong);border-radius:2px;padding:.35rem;background:radial-gradient(circle at center,rgba(255,225,162,.08),transparent 42%),linear-gradient(180deg,#100c09f2,#080604);box-shadow:inset 0 0 14px #000000eb,0 3px 8px #000000a6}.st-rh-dice-slot:after{content:"";position:absolute;inset:2px;border:1px dashed rgba(191,156,97,.18);pointer-events:none}.st-rh-dice-slot svg{max-width:100%;height:auto;filter:drop-shadow(0 2px 4px rgba(0,0,0,.8))}.st-rh-summary-visual-fallback{display:inline-flex;font-family:var(--st-rh-font-display);font-size:11px;font-weight:700;color:#ead5adb8;letter-spacing:.12em}.st-rh-settlement-shell .st-rh-summary-actions-compact{display:flex;justify-content:center;width:100%}.st-rh-settlement-shell .st-rh-summary-toggle-state{display:inline-flex;align-items:center;justify-content:center;min-height:32px;padding:0 12px;border:1px solid rgba(176,143,76,.58);background:linear-gradient(180deg,#5c4223f2,#2b1c11fa);color:var(--st-rh-royal-ink);font-family:var(--st-rh-font-display);font-size:11px;letter-spacing:.08em;white-space:nowrap;user-select:none;box-shadow:inset 0 1px #ffe8b31f,inset 0 -8px 12px #00000042,0 3px 8px #00000085;transition:border-color .2s ease,color .2s ease,background .2s ease,transform .2s ease}.st-rh-settlement-shell .st-rh-summary-toggle-state:hover{border-color:#d6b471d6;background:linear-gradient(180deg,#7e582af5,#3a2514fc);color:var(--st-rh-royal-title);transform:translateY(-1px)}.st-rh-settlement-shell .st-rh-summary-toggle-icon{width:1.1rem;height:1.1rem;display:inline-flex;align-items:center;justify-content:center;transition:transform .24s ease}.st-rh-settlement-shell .st-rh-toggle-open{display:none}.st-rh-settlement-shell[open] .st-rh-toggle-open{display:inline}.st-rh-settlement-shell[open] .st-rh-toggle-closed{display:none}.st-rh-marquee-clip{display:inline-flex;overflow:hidden;max-width:100%}.st-rh-marquee-track{display:inline-flex;align-items:center;min-width:max-content;white-space:nowrap;will-change:transform;animation:none}.is-marquee .st-rh-marquee-track{animation:st-rh-marquee-scroll 14s linear infinite}.is-marquee:hover .st-rh-marquee-track{animation-play-state:paused}.st-rh-marquee-text,.st-rh-marquee-gap{display:inline-flex;align-items:center;flex:0 0 auto}.st-rh-marquee-gap{margin-inline:.5rem}@keyframes st-rh-marquee-scroll{0%{transform:translate(0)}to{transform:translate(calc(-50% - .5rem))}}.st-rh-settlement-shell .st-rh-details-body{position:relative;padding:0 .72rem .72rem;border-top:1px solid rgba(124,93,53,.62);background:linear-gradient(180deg,rgba(10,7,5,.2),transparent 16%),linear-gradient(180deg,#0b0806f5,#110c09f0)}.st-rh-settlement-shell .st-rh-details-body:before{content:"";position:absolute;top:0;left:10%;right:10%;height:1px;background:linear-gradient(90deg,transparent,rgba(219,189,122,.45),transparent)}.st-rh-settlement-shell .st-rh-details-body.st-rh-anim-opening{display:block!important;overflow:hidden;animation:st-rh-slide-open .3s ease-out forwards}.st-rh-settlement-shell .st-rh-details-body.st-rh-anim-closing{display:block!important;overflow:hidden;animation:st-rh-slide-close .25s ease-in forwards}@keyframes st-rh-slide-open{0%{max-height:0;opacity:0;transform:translateY(-6px)}to{max-height:2200px;opacity:1;transform:translateY(0)}}@keyframes st-rh-slide-close{0%{max-height:2200px;opacity:1;transform:translateY(0)}to{max-height:0;opacity:0;transform:translateY(-6px)}}.st-rh-details-layout{display:grid;gap:.72rem;margin-top:.72rem}.st-rh-details-main,.st-rh-details-side{display:flex;flex-direction:column;gap:.72rem}.st-rh-details-side-primary{display:block}.st-rh-meta-panel,.st-rh-info-panel,.st-rh-result-core{position:relative;overflow:hidden;border:1px solid rgba(170,134,79,.34);background:var(--st-rh-royal-panel-strong);box-shadow:inset 0 0 0 1px #ffe7ad08,inset 0 -20px 28px #00000038,0 6px 14px #00000047}.st-rh-meta-panel:before,.st-rh-info-panel:before,.st-rh-result-core:before{content:"";position:absolute;inset:4px;border:1px solid rgba(191,156,97,.1);pointer-events:none}.st-rh-info-panel,.st-rh-meta-panel,.st-rh-result-core{padding:.72rem .8rem}.st-rh-info-panel .st-rh-kicker{font-size:12px;letter-spacing:.12em}.st-rh-outcome-panel{padding:.82rem .9rem .9rem;border-color:#b28d526b;background:radial-gradient(circle at top,rgba(245,224,173,.1),transparent 48%),linear-gradient(180deg,#3f2b19f5,#0d0907fc);box-shadow:inset 0 0 0 1px #ffe9b808,inset 0 -26px 36px #0000003d,0 8px 18px #00000057}.st-rh-outcome-head{display:flex;align-items:center;gap:.5rem;margin-bottom:.7rem}.st-rh-outcome-head-line{flex:1 1 auto;height:1px;min-width:16px;background:linear-gradient(90deg,transparent,rgba(212,179,117,.28),transparent)}.st-rh-outcome-head-seal{position:relative;flex:0 0 12px;width:12px;height:12px;transform:rotate(45deg);border:1px solid rgba(208,175,112,.34);background:radial-gradient(circle at center,rgba(246,223,173,.24),transparent 60%),linear-gradient(135deg,#573c22f2,#18100bfa);box-shadow:0 0 10px #d6b77a14}.st-rh-outcome-kicker{display:inline-flex;align-items:center;justify-content:center;margin:0;padding:.28rem .82rem .24rem;border:1px solid rgba(193,158,99,.34);background:linear-gradient(180deg,#6143269e,#24180fdb);color:var(--st-rh-royal-title);letter-spacing:.14em;text-shadow:0 2px 6px rgba(0,0,0,.65);box-shadow:inset 0 0 0 1px #ffeac108,0 0 16px #d6b77a0d;white-space:nowrap}.st-rh-outcome-scroll{position:relative;padding:1.05rem 1.1rem 1rem;border:1px solid rgba(187,151,96,.22);background:linear-gradient(180deg,#5c432a4d,#31201524),repeating-linear-gradient(0deg,rgba(248,228,187,.022) 0px,rgba(248,228,187,.022) 1px,transparent 1px,transparent 4px),radial-gradient(circle at top,rgba(240,218,173,.09),transparent 62%),linear-gradient(180deg,#322317e6,#120c09f0);box-shadow:inset 0 0 0 1px #fff0cd05,inset 0 -12px 18px #0000002e}.st-rh-outcome-scroll:before,.st-rh-outcome-scroll:after{content:"";position:absolute;left:16px;right:16px;height:1px;background:linear-gradient(90deg,transparent,rgba(222,190,128,.18),transparent)}.st-rh-outcome-scroll:before{top:8px}.st-rh-outcome-scroll:after{bottom:8px}.st-rh-outcome-copy{position:relative;color:#efe1c5f2;font-size:15px;line-height:1.88;text-shadow:0 1px 2px rgba(0,0,0,.56)}.st-rh-outcome-copy:before{content:"叙事札记";display:inline-block;margin-bottom:.5rem;margin-right:.75rem;padding:.12rem .42rem .08rem;border:1px solid rgba(189,155,97,.18);background:#4d361f47;color:#d6ba85ad;font-size:10px;letter-spacing:.18em;text-transform:uppercase}.st-rh-outcome-status-strip{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:.55rem;margin-top:.72rem}.st-rh-outcome-strip-item{display:flex;flex-direction:column;gap:.24rem;min-width:0;padding:.58rem .68rem;border:1px solid rgba(173,136,83,.22);background:linear-gradient(180deg,#47311e75,#150e0ab8);box-shadow:inset 0 0 0 1px #ffe9bc05}.st-rh-outcome-strip-label{color:#ccb07ac2;font-size:12px;letter-spacing:.14em;text-transform:uppercase}.st-rh-outcome-strip-value{color:#eddfc1f0;font-size:12px;line-height:1.58;word-break:break-word}.st-rh-outcome-strip-item-muted{border-color:#92724729;background:linear-gradient(180deg,#2f20155c,#100b0899)}.st-rh-outcome-strip-item-muted .st-rh-outcome-strip-label,.st-rh-outcome-strip-item-muted .st-rh-outcome-strip-value{color:#bfa87fa3}.st-rh-outcome-panel.st-rh-outcome-tone-success .st-rh-outcome-kicker{border-color:#a6975666;box-shadow:inset 0 0 0 1px #ffeac108,0 0 18px #95bb6014}.st-rh-outcome-panel.st-rh-outcome-tone-success .st-rh-outcome-scroll{border-color:#9ba95d33}.st-rh-outcome-panel.st-rh-outcome-tone-failure .st-rh-outcome-kicker,.st-rh-outcome-panel.st-rh-outcome-tone-explode .st-rh-outcome-kicker{border-color:#b07a576b;background:linear-gradient(180deg,#6c3e29a8,#2a1610e6)}.st-rh-outcome-panel.st-rh-outcome-tone-failure .st-rh-outcome-scroll,.st-rh-outcome-panel.st-rh-outcome-tone-explode .st-rh-outcome-scroll{border-color:#ad71533d}.st-rh-details-head{display:flex;flex-direction:column;gap:.5rem}.st-rh-details-head-copy{min-width:0}.st-rh-details-head-side{display:flex;align-items:center;gap:10px}.st-rh-details-head-seal{position:relative;width:20px;height:20px;flex:0 0 20px;transform:rotate(45deg);border:1px solid rgba(207,174,111,.34);background:radial-gradient(circle at center,rgba(240,216,164,.2),transparent 58%),linear-gradient(135deg,#4c341cf2,#120c09fa);box-shadow:0 0 10px #b08f4c1f}.st-rh-details-head-seal:before{content:"";position:absolute;inset:4px;transform:rotate(-45deg);border-radius:50%;background:radial-gradient(circle at center,rgba(239,216,165,.78),rgba(103,75,41,.2) 62%,transparent 68%)}.st-rh-details-heading{margin-top:.2rem;color:var(--st-rh-royal-title);font-family:var(--st-rh-font-display);font-size:15px;line-height:1.35;font-weight:700;letter-spacing:.04em;text-shadow:0 2px 4px var(--st-rh-royal-shadow)}.st-rh-details-badge{display:inline-flex;flex-wrap:wrap;justify-content:flex-end}.st-rh-fact-grid,.st-rh-result-meta-grid{display:grid;gap:.58rem;margin-top:.78rem}.st-rh-fact-card{position:relative;overflow:hidden}.st-rh-surface-card{padding:.62rem .7rem;border:1px solid rgba(170,132,78,.26);border-left:2px solid rgba(198,158,93,.58);background:linear-gradient(180deg,#2f2217c7,#110b08eb),repeating-linear-gradient(0deg,rgba(255,242,214,.018) 0px,rgba(255,242,214,.018) 1px,transparent 1px,transparent 4px);box-shadow:inset 0 0 0 1px #ffecc405,inset 0 -10px 16px #0000002e}.st-rh-fact-label{margin-bottom:.2rem;color:#cdb174eb;font-size:10px;letter-spacing:.1em;text-transform:uppercase}.st-rh-fact-value{color:var(--st-rh-royal-ink);line-height:1.45;text-shadow:0 1px 2px rgba(0,0,0,.72)}.st-rh-result-core{background:radial-gradient(circle at top,rgba(244,218,165,.12),transparent 45%),linear-gradient(180deg,#392817fa,#0e0a07fc)}.st-rh-result-core-head{display:flex;align-items:flex-start;justify-content:space-between;gap:.75rem}.st-rh-result-core-copy{min-width:0}.st-rh-score-row{display:inline-flex;align-items:baseline;gap:.45rem;margin-top:.4rem;padding:.1rem 0 .48rem;border-bottom:1px solid rgba(195,159,97,.26)}.st-rh-result-total{color:var(--st-rh-royal-title);font-size:30px;line-height:1;text-shadow:0 2px 8px rgba(0,0,0,.92),0 0 14px rgba(242,212,143,.12)}.st-rh-result-total-label{font-size:11px;color:#d6bb84eb;letter-spacing:.12em}.st-rh-result-visual{position:relative;display:flex;justify-content:center;margin-top:.8rem;padding:.72rem;border:1px solid rgba(182,144,87,.28);background:radial-gradient(circle at center,rgba(255,226,170,.08),transparent 42%),linear-gradient(180deg,#090705fa,#160f0bf2);box-shadow:inset 0 0 16px #000000eb,inset 0 0 0 1px #ffebb608}.st-rh-result-visual:before{content:"";position:absolute;inset:4px;border:1px dashed rgba(198,162,103,.14);pointer-events:none}.st-rh-empty-visual{padding:1rem;text-align:center;font-size:11px;color:#e2cfa89e;letter-spacing:.08em}.st-rh-status-badge{text-transform:uppercase;letter-spacing:.14em}.st-rh-status-pill{min-height:28px;padding:.2rem .7rem;border-radius:2px;border-color:color-mix(in srgb,var(--st-rh-status-color, #d8aa58) 65%,rgba(74,53,32,.8));background:linear-gradient(180deg,color-mix(in srgb,var(--st-rh-status-color, #d8aa58) 18%,rgba(87,55,28,.9)),#140e0af5)!important;box-shadow:inset 0 0 0 1px #ffe8ba0a,inset 0 -10px 14px #0000003d,0 0 10px color-mix(in srgb,var(--st-rh-status-color, #d8aa58) 16%,transparent)}.st-rh-status-pill:after{opacity:.55}@media (min-width: 640px){.st-rh-summary-wrap,.st-rh-info-panel,.st-rh-meta-panel,.st-rh-result-core{padding:.86rem .96rem}.st-rh-settlement-shell .st-rh-summary-title{font-size:16px}.st-rh-summary-badge-desktop{display:flex}.st-rh-summary-badge-mobile{display:none}.st-rh-details-head{flex-direction:row;align-items:flex-start;justify-content:space-between}.st-rh-fact-grid,.st-rh-result-meta-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.st-rh-result-total{font-size:38px}}@media (min-width: 860px){.st-rh-summary-wrap{padding:.95rem 1rem 1rem}.st-rh-settlement-shell .st-rh-summary-title{font-size:17px}.st-rh-summary-visual-wrap{margin-bottom:10px}}@media (max-width: 859px){.st-rh-result-summary-grid{grid-template-columns:minmax(0,1fr)}.st-rh-result-summary-side{align-items:stretch}.st-rh-summary-visual-wrap,.st-rh-settlement-shell .st-rh-summary-actions-compact{justify-content:flex-start}}@media (max-width: 639px){.st-rh-summary-wrap{padding:.62rem}.st-rh-summary-banner-inner{padding:.68rem .76rem}.st-rh-settlement-shell .st-rh-summary-header{flex-wrap:wrap}.st-rh-settlement-shell .st-rh-summary-id{max-width:100%}.st-rh-settlement-shell .st-rh-details-body{padding:0 .62rem .62rem}.st-rh-outcome-panel{padding:.72rem .72rem .76rem}.st-rh-outcome-head{gap:.35rem;margin-bottom:.58rem}.st-rh-outcome-kicker{max-width:100%;padding-inline:.64rem;font-size:11px;letter-spacing:.1em}.st-rh-outcome-scroll{padding:.86rem .82rem .84rem}.st-rh-outcome-copy{font-size:14px;line-height:1.78}.st-rh-outcome-status-strip{grid-template-columns:minmax(0,1fr);gap:.48rem}.st-rh-details-head-side{justify-content:space-between}}@media (max-width: 520px){.st-rh-summary-judgement,.st-rh-summary-outcome-wrap,.st-rh-info-panel,.st-rh-meta-panel,.st-rh-result-core{padding-inline:.72rem}.st-rh-settlement-shell .st-rh-summary-toggle-state,.st-rh-settlement-shell .st-rh-summary-actions-compact{width:100%}.st-rh-outcome-head{flex-wrap:wrap}.st-rh-outcome-head-line,.st-rh-outcome-head-seal{display:none}.st-rh-outcome-kicker{width:100%}.st-rh-details-head-side{flex-wrap:wrap}}@media (prefers-reduced-motion: reduce){.st-rh-settlement-shell,.st-rh-settlement-shell .st-rh-summary-toggle-state,.st-rh-settlement-shell .st-rh-summary-title-track,.st-rh-marquee-track,.st-rh-settlement-shell .st-rh-details-body,.st-rh-settlement-shell .st-rh-summary-toggle-icon{transition:none;animation:none}.st-rh-settlement-shell .st-rh-summary-toggle-state:hover{transform:none}}@container (min-width: 640px){.st-rh-summary-wrap,.st-rh-info-panel,.st-rh-meta-panel,.st-rh-result-core{padding:.86rem .96rem}.st-rh-settlement-shell .st-rh-summary-title{font-size:16px}.st-rh-summary-badge-desktop{display:flex}.st-rh-summary-badge-mobile{display:none}.st-rh-details-head{flex-direction:row;align-items:flex-start;justify-content:space-between}.st-rh-fact-grid,.st-rh-result-meta-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.st-rh-result-total{font-size:38px}}@container (min-width: 860px){.st-rh-summary-wrap{padding:.95rem 1rem 1rem}.st-rh-settlement-shell .st-rh-summary-title{font-size:17px}.st-rh-summary-visual-wrap{margin-bottom:10px}}@container (max-width: 859px){.st-rh-result-summary-grid{grid-template-columns:minmax(0,1fr)}.st-rh-result-summary-side{align-items:stretch}.st-rh-summary-visual-wrap,.st-rh-settlement-shell .st-rh-summary-actions-compact{justify-content:flex-start}}@container (max-width: 680px){.st-rh-summary-wrap{padding:.66rem}.st-rh-summary-ornament{gap:8px;margin-bottom:2px}.st-rh-summary-ornament-line{max-width:84px}.st-rh-summary-banner-inner{padding:.68rem .76rem}.st-rh-settlement-shell .st-rh-summary-header{flex-wrap:wrap;gap:8px}.st-rh-settlement-shell .st-rh-summary-title{font-size:15px;line-height:1.4}.st-rh-outcome-panel{padding:.74rem .74rem .8rem}.st-rh-outcome-scroll{padding:.9rem .88rem .86rem}.st-rh-outcome-copy{font-size:14px;line-height:1.8}.st-rh-outcome-status-strip{grid-template-columns:minmax(0,1fr)}.st-rh-settlement-shell .st-rh-summary-id{width:100%;max-width:none;min-height:16px;justify-content:flex-end;padding:0;border:none;background:transparent;color:#e1cca042;font-size:8px;letter-spacing:.06em}.st-rh-summary-primary{gap:6px}.st-rh-summary-mobile-hero{display:block}.st-rh-summary-mobile-hero .st-rh-result-core{margin-top:.1rem;padding:.82rem .82rem .88rem}.st-rh-summary-mobile-hero .st-rh-result-core-head{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:.55rem .8rem}.st-rh-summary-mobile-hero .st-rh-result-core-copy{display:flex;flex-direction:column;gap:.26rem;min-width:0}.st-rh-summary-mobile-hero .st-rh-score-row{display:flex;flex-wrap:wrap;gap:.42rem;margin-top:0}.st-rh-summary-mobile-hero .st-rh-result-total{font-size:40px}.st-rh-summary-mobile-hero .st-rh-result-visual{margin-top:.72rem;padding:.8rem}.st-rh-summary-mobile-hero .st-rh-result-meta-grid{margin-top:.72rem;grid-template-columns:repeat(2,minmax(0,1fr));gap:.55rem .8rem}.st-rh-summary-mobile-hero .st-rh-result-meta-grid .st-rh-surface-card{display:flex;align-items:center;justify-content:space-between;gap:.75rem;min-height:40px;padding:.18rem 0;border:none;border-radius:0;border-top:1px solid rgba(191,153,91,.28);background:transparent;box-shadow:none}.st-rh-summary-mobile-hero .st-rh-result-meta-grid .st-rh-fact-label{margin-bottom:0;padding-right:.4rem;border-bottom:none;white-space:nowrap}.st-rh-summary-mobile-hero .st-rh-result-meta-grid .st-rh-fact-value{text-align:right;font-size:15px;white-space:nowrap}.st-rh-result-summary-side .st-rh-summary-visual-wrap{display:none}.st-rh-settlement-shell .st-rh-summary-actions-compact,.st-rh-settlement-shell .st-rh-summary-toggle-state{width:100%}.st-rh-settlement-shell .st-rh-details-body{padding:0 .66rem .7rem}.st-rh-details-layout{display:block;margin-top:.72rem}.st-rh-details-main,.st-rh-details-side{gap:.72rem}.st-rh-details-side-primary{display:none}.st-rh-details-head-side{justify-content:space-between;flex-wrap:wrap}.st-rh-fact-grid{grid-template-columns:1fr}.st-rh-info-panel,.st-rh-meta-panel{padding:.76rem .8rem}.st-rh-panel-copy,.st-rh-body-copy{text-indent:0;line-height:1.55}.st-rh-meta-copy,.st-rh-value-copy,.st-rh-distribution-copy,.st-rh-timeout-copy{line-height:1.5}.st-rh-note-box,.st-rh-impact-note{margin-top:.5rem}}@container (min-width: 480px) and (max-width: 680px){.st-rh-fact-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@container (max-width: 380px){.st-rh-summary-mobile-hero .st-rh-result-core-head{gap:.45rem .55rem}.st-rh-summary-mobile-hero .st-rh-result-total{font-size:36px}.st-rh-summary-mobile-hero .st-rh-result-meta-grid{gap:.5rem}.st-rh-summary-mobile-hero .st-rh-result-meta-grid .st-rh-surface-card{gap:.45rem}.st-rh-summary-mobile-hero .st-rh-result-meta-grid .st-rh-fact-value{font-size:14px}}', cS = '.st-rh-settlement-shell-mobile{overflow:hidden}.st-rh-mobile-shell-summary{display:block}.st-rh-mobile-summary-wrap{display:flex;flex-direction:column;gap:.72rem;padding:.72rem .72rem .8rem}.st-rh-mobile-summary-head{position:relative;display:grid;grid-template-columns:auto minmax(0,1fr);gap:.45rem .7rem;align-items:center;padding:.82rem .84rem .78rem;border:1px solid rgba(179,143,84,.34);background:radial-gradient(circle at top,rgba(247,223,174,.12),transparent 48%),linear-gradient(180deg,#2e2117fa,#100b08fa);box-shadow:inset 0 0 0 1px #ffe8b50a,0 6px 12px #00000047}.st-rh-mobile-summary-head:before{content:"";position:absolute;inset:4px;border:1px solid rgba(198,161,103,.12);pointer-events:none}.st-rh-mobile-summary-crest{position:relative;width:18px;height:18px;transform:rotate(45deg);border:1px solid rgba(213,181,119,.42);background:radial-gradient(circle at center,rgba(245,221,171,.28),transparent 56%),linear-gradient(135deg,#573c20f5,#120c09fc)}.st-rh-mobile-summary-crest:before{content:"";position:absolute;inset:4px;transform:rotate(-45deg);border-radius:50%;background:radial-gradient(circle at center,rgba(240,218,170,.88),rgba(111,80,41,.16) 64%,transparent 68%)}.st-rh-mobile-summary-copy{min-width:0;display:flex;flex-direction:column;gap:.24rem}.st-rh-mobile-summary-kicker{min-width:0;margin:0;padding-bottom:0;border-bottom:none;font-size:10px;letter-spacing:.12em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.st-rh-mobile-summary-title{font-size:16px;line-height:1.38}.st-rh-mobile-summary-id{grid-column:auto;justify-self:end;align-self:start;min-width:0;max-width:140px;min-height:18px;padding:0 4px;border-color:#87693f2e;background:#08060429;color:#e1cca052;font-size:8px;letter-spacing:.04em;opacity:.72}.st-rh-mobile-summary-kicker-wrap{display:flex;flex-direction:row;justify-content:space-between;align-items:center;gap:.3rem .5rem;min-width:0}.st-rh-mobile-summary-kicker-wrap>*{min-width:0}.st-rh-mobile-summary-hero{position:relative}.st-rh-settlement-shell-mobile .st-rh-mobile-summary-hero .st-rh-result-core{margin:0;padding:.82rem .82rem .88rem}.st-rh-settlement-shell-mobile .st-rh-mobile-summary-hero .st-rh-result-core-head{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:.55rem .8rem}.st-rh-settlement-shell-mobile .st-rh-mobile-summary-hero .st-rh-result-core-copy{display:flex;flex-direction:column;gap:.26rem}.st-rh-settlement-shell-mobile .st-rh-mobile-summary-hero .st-rh-score-row{display:flex;flex-wrap:wrap;gap:.42rem;margin-top:0}.st-rh-settlement-shell-mobile .st-rh-mobile-summary-hero .st-rh-result-total{font-size:40px}.st-rh-settlement-shell-mobile .st-rh-mobile-summary-hero .st-rh-status-pill{align-self:center;justify-self:end}.st-rh-settlement-shell-mobile .st-rh-mobile-summary-hero .st-rh-result-visual{margin-top:.72rem;padding:.8rem}.st-rh-settlement-shell-mobile .st-rh-mobile-summary-hero .st-rh-result-meta-grid{margin-top:.72rem;grid-template-columns:repeat(2,minmax(0,1fr));gap:.55rem .8rem}.st-rh-settlement-shell-mobile .st-rh-mobile-summary-hero .st-rh-result-meta-grid .st-rh-surface-card{display:flex;flex-direction:column;align-items:flex-start;justify-content:flex-start;gap:.3rem;min-height:40px;padding:.18rem 0;border:none;border-radius:0;border-top:1px solid rgba(191,153,91,.28);background:transparent;box-shadow:none}.st-rh-settlement-shell-mobile .st-rh-mobile-summary-hero .st-rh-result-meta-grid .st-rh-fact-label{margin-bottom:0;padding-right:0;border-bottom:none;white-space:nowrap}.st-rh-settlement-shell-mobile .st-rh-mobile-summary-hero .st-rh-result-meta-grid .st-rh-fact-value{width:100%;text-align:left;font-size:15px;white-space:nowrap}.st-rh-mobile-summary-scroll{display:flex;flex-direction:column;gap:0;overflow:hidden;padding:0;border:1px solid rgba(170,134,79,.24);border-left:3px solid rgba(191,153,91,.58);background:linear-gradient(180deg,#3f2d1d3d,#110b0833),linear-gradient(135deg,#e3cd9e14,#6040251f),repeating-linear-gradient(0deg,rgba(255,242,214,.03) 0px,rgba(255,242,214,.03) 1px,transparent 1px,transparent 3px);box-shadow:inset 0 0 0 1px #ffecc308,0 4px 10px #00000038}.st-rh-mobile-summary-scroll>*{min-width:0}.st-rh-settlement-shell-mobile .st-rh-mobile-summary-scroll .st-rh-inline-chip{max-width:100%}.st-rh-settlement-shell-mobile .st-rh-mobile-summary-scroll>.st-rh-inline-chip:first-child{display:flex;align-items:center;min-height:36px;padding:.58rem .8rem;border:none!important;border-bottom:1px solid rgba(191,153,91,.18)!important;border-radius:0!important;background:linear-gradient(180deg,#533b226b,#22160e47)!important;color:#d5b880eb!important;box-shadow:inset 0 -1px #00000038!important;font-family:var(--st-rh-font-display);letter-spacing:.06em}.st-rh-settlement-shell-mobile .st-rh-mobile-summary-scroll>.st-rh-inline-chip:first-child .st-rh-chip-icon{color:#d5b880d1}.st-rh-settlement-shell-mobile .st-rh-mobile-summary-scroll .st-rh-summary-chip-outcome{padding:.78rem .8rem .72rem!important;color:var(--st-rh-royal-ink)!important;font-size:15px;line-height:1.62;text-shadow:0 1px 2px rgba(0,0,0,.56)}.st-rh-settlement-shell-mobile .st-rh-mobile-summary-scroll .st-rh-summary-chip-outcome .st-rh-chip-icon{display:none}.st-rh-settlement-shell-mobile .st-rh-mobile-summary-scroll .st-rh-summary-chip-status-summary{display:flex!important;align-self:auto;align-items:center;margin:0 .72rem .72rem;padding:.55rem .72rem;border-radius:999px;border-color:#a7854e57!important;background:linear-gradient(180deg,#322517db,#110b08eb)!important;color:#ecd9b6f0!important;box-shadow:inset 0 0 0 1px #ffecc308,inset 0 0 14px #00000047;line-height:1.45}.st-rh-settlement-shell-mobile .st-rh-mobile-summary-scroll .st-rh-summary-chip-status-summary .st-rh-chip-icon{color:#e0bd78e6}.st-rh-mobile-summary-actions{display:flex}.st-rh-settlement-shell-mobile .st-rh-mobile-summary-actions .st-rh-summary-toggle-state{width:100%;justify-content:center}.st-rh-mobile-details-body{padding:0 .72rem .78rem}.st-rh-details-layout-mobile{display:block;margin-top:.72rem}.st-rh-mobile-details-stack{display:flex;flex-direction:column;gap:.72rem}.st-rh-settlement-shell-mobile .st-rh-details-head{gap:.52rem}.st-rh-settlement-shell-mobile .st-rh-details-head-side{justify-content:space-between}.st-rh-settlement-shell-mobile .st-rh-fact-grid{grid-template-columns:1fr}.st-rh-settlement-shell-mobile .st-rh-info-panel,.st-rh-settlement-shell-mobile .st-rh-meta-panel{padding:.76rem .8rem}.st-rh-settlement-shell-mobile .st-rh-outcome-panel{padding:.76rem .8rem .82rem}.st-rh-settlement-shell-mobile .st-rh-outcome-head{gap:.32rem;margin-bottom:.56rem}.st-rh-settlement-shell-mobile .st-rh-outcome-head-line,.st-rh-settlement-shell-mobile .st-rh-outcome-head-seal{display:none}.st-rh-settlement-shell-mobile .st-rh-outcome-kicker{width:100%;padding-inline:.64rem;font-size:11px;letter-spacing:.1em}.st-rh-settlement-shell-mobile .st-rh-outcome-scroll{padding:.84rem .8rem .82rem}.st-rh-settlement-shell-mobile .st-rh-outcome-copy{font-size:14px;line-height:1.78}.st-rh-settlement-shell-mobile .st-rh-outcome-status-strip{grid-template-columns:minmax(0,1fr);gap:.46rem}.st-rh-settlement-shell-mobile .st-rh-panel-copy,.st-rh-settlement-shell-mobile .st-rh-body-copy{text-indent:0;line-height:1.55}.st-rh-settlement-shell-mobile .st-rh-meta-copy,.st-rh-settlement-shell-mobile .st-rh-value-copy,.st-rh-settlement-shell-mobile .st-rh-distribution-copy,.st-rh-settlement-shell-mobile .st-rh-timeout-copy{line-height:1.5}.st-rh-settlement-shell-mobile .st-rh-note-box,.st-rh-settlement-shell-mobile .st-rh-impact-note{margin-top:.5rem}@media (min-width: 480px){.st-rh-settlement-shell-mobile .st-rh-fact-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media (max-width: 380px){.st-rh-mobile-summary-kicker-wrap{flex-wrap:wrap}.st-rh-mobile-summary-id{margin-left:auto;max-width:100%}.st-rh-settlement-shell-mobile .st-rh-mobile-summary-hero .st-rh-result-core-head{gap:.45rem .55rem}.st-rh-settlement-shell-mobile .st-rh-mobile-summary-hero .st-rh-result-total{font-size:36px}.st-rh-settlement-shell-mobile .st-rh-mobile-summary-hero .st-rh-result-meta-grid{gap:.5rem}.st-rh-settlement-shell-mobile .st-rh-mobile-summary-hero .st-rh-result-meta-grid .st-rh-surface-card{gap:.3rem}.st-rh-settlement-shell-mobile .st-rh-mobile-summary-hero .st-rh-result-meta-grid .st-rh-fact-value{font-size:14px}}@media (prefers-reduced-motion: reduce){.st-rh-mobile-summary-wrap,.st-rh-mobile-summary-head,.st-rh-mobile-summary-hero{animation:none;transition:none}}@container (max-width: 380px){.st-rh-mobile-summary-kicker-wrap{flex-wrap:wrap}.st-rh-mobile-summary-id{margin-left:auto;max-width:100%}}', dS = '.st-rh-settlement-shell-result{background:radial-gradient(circle at top,rgba(246,224,179,.1),transparent 34%),linear-gradient(180deg,#2f1f14fa,#0b0806)}.st-rh-settlement-shell-result .st-rh-summary-banner{background:linear-gradient(180deg,#d6b6768c,#57381e8f)}.st-rh-settlement-shell-result .st-rh-summary-banner-inner{background:radial-gradient(circle at top,rgba(253,232,188,.13),transparent 56%),linear-gradient(180deg,#352416fa,#120c09fa)}.st-rh-settlement-shell-result .st-rh-summary-ornament-seal:after,.st-rh-settlement-shell-result .st-rh-details-head-seal:before{background:radial-gradient(circle at center,rgba(246,219,156,.9),rgba(124,73,42,.26) 62%,transparent 70%)}.st-rh-settlement-shell-result .st-rh-summary-judgement{background:radial-gradient(circle at top right,rgba(136,61,47,.18),transparent 40%),linear-gradient(180deg,#322216f0,#100a08fa)}.st-rh-settlement-shell-result .st-rh-summary-outcome-wrap{border-left-color:#ba4e3cb8;background:linear-gradient(180deg,#5734213d,#1a110b29),linear-gradient(135deg,#e0c69614,#623d231f),repeating-linear-gradient(0deg,rgba(255,244,222,.03) 0px,rgba(255,244,222,.03) 1px,transparent 1px,transparent 3px)}.st-rh-summary-dice-slot-result{width:76px;height:76px}.st-rh-settlement-shell-result .st-rh-summary-visual-dais{padding:12px;border-color:#b68f5394;background:radial-gradient(circle at top,rgba(250,227,182,.16),transparent 46%),linear-gradient(180deg,#462d18f5,#0f0a07fc)}.st-rh-settlement-shell-result .st-rh-dice-slot{background:radial-gradient(circle at center,rgba(255,228,166,.14),transparent 44%),linear-gradient(180deg,#130d09fa,#070504)}.st-rh-settlement-shell-result .st-rh-details-layout-result .st-rh-details-main,.st-rh-settlement-shell-result .st-rh-details-layout-result .st-rh-details-side{gap:.78rem}.st-rh-settlement-shell-result:not(.st-rh-settlement-shell-mobile) .st-rh-fact-card{display:flex;flex-direction:column;align-items:flex-start}.st-rh-settlement-shell-result:not(.st-rh-settlement-shell-mobile) .st-rh-fact-label,.st-rh-settlement-shell-result:not(.st-rh-settlement-shell-mobile) .st-rh-fact-value{width:100%;text-align:left}.st-rh-settlement-shell-result:not(.st-rh-settlement-shell-mobile) .st-rh-fact-value{margin:0}.st-rh-settlement-shell-result .st-rh-result-core{background:radial-gradient(circle at top,rgba(249,225,172,.16),transparent 38%),radial-gradient(circle at bottom right,rgba(139,59,45,.16),transparent 32%),linear-gradient(180deg,#3f2918fc,#0c0806);border-color:#ba93546b}.st-rh-settlement-shell-result .st-rh-result-core-head{align-items:center}.st-rh-settlement-shell-result .st-rh-result-core-copy{position:relative;padding-right:10px}.st-rh-settlement-shell-result .st-rh-result-core-copy:after{content:"";position:absolute;top:6px;right:0;bottom:6px;width:1px;background:linear-gradient(180deg,transparent,rgba(214,181,119,.42),transparent)}.st-rh-settlement-shell-result .st-rh-kicker-compact{margin-bottom:0;color:#dfc592d6;font-size:10px;letter-spacing:.14em}.st-rh-settlement-shell-result .st-rh-details-head-copy>.st-rh-kicker{margin-left:0;color:#dec490db;font-size:11px;letter-spacing:.14em}.st-rh-settlement-shell-result .st-rh-details-heading{margin-top:.24rem;font-size:16px;line-height:1.34}.st-rh-settlement-shell-result .st-rh-mini-kicker{color:#d8bd89e0;font-size:10px;letter-spacing:.12em;border-bottom-color:#ba945829}.st-rh-settlement-shell-result .st-rh-score-row{gap:.55rem;padding-bottom:.58rem}.st-rh-settlement-shell-result .st-rh-result-total{font-size:34px;color:var(--st-rh-royal-title);text-shadow:0 3px 8px rgba(0,0,0,.92),0 0 16px rgba(242,212,143,.15)}.st-rh-settlement-shell-result .st-rh-result-total-label{color:#e5cda1eb}.st-rh-settlement-shell-result .st-rh-result-visual{padding:.9rem;border-color:#b8915457;background:radial-gradient(circle at center,rgba(255,232,179,.12),transparent 42%),linear-gradient(180deg,#0a0806,#1a110bfa)}.st-rh-settlement-shell-result .st-rh-result-meta-grid .st-rh-surface-card{background:radial-gradient(circle at top left,rgba(249,227,183,.06),transparent 34%),linear-gradient(180deg,#342417d6,#110b08f0)}.st-rh-settlement-shell-result .st-rh-meta-panel .st-rh-surface-card,.st-rh-settlement-shell-result .st-rh-info-panel .st-rh-surface-card{border-left-color:#bd9557a8}.st-rh-settlement-shell-result .st-rh-info-panel{background:radial-gradient(circle at top,rgba(247,223,169,.09),transparent 36%),linear-gradient(180deg,#362518f5,#100b08fa)}.st-rh-settlement-shell-result .st-rh-impact-note{border-color:#a34030eb;background:radial-gradient(circle at center,#7d251a38,#0000008c),linear-gradient(180deg,#451c16ad,#120a08d1);color:#f0c3bc}.st-rh-settlement-shell-result .st-rh-note-box{border-color:#bc975966;background:linear-gradient(180deg,#2c1e14c2,#0c0806e0)}.st-rh-settlement-shell-result .st-rh-status-pill{background:linear-gradient(180deg,color-mix(in srgb,var(--st-rh-status-color, #d8aa58) 22%,rgba(103,61,34,.94)),#110b08fa)!important;box-shadow:inset 0 0 0 1px #ffe8b60d,inset 0 -12px 14px #0000003d,0 0 12px color-mix(in srgb,var(--st-rh-status-color, #d8aa58) 18%,transparent)}@media (min-width: 640px){.st-rh-settlement-shell-result:not(.st-rh-settlement-shell-mobile) .st-rh-fact-grid{grid-template-columns:repeat(3,minmax(0,1fr))}.st-rh-summary-dice-slot-result{width:88px;height:88px}.st-rh-settlement-shell-result .st-rh-result-total{font-size:42px}}@media (min-width: 860px){.st-rh-details-layout-result{grid-template-columns:minmax(0,1fr) minmax(300px,.72fr)}}@media (max-width: 859px){.st-rh-settlement-shell-result .st-rh-result-core-copy:after{display:none}}@media (max-width: 520px){.st-rh-summary-dice-slot-result{width:72px;height:72px}.st-rh-settlement-shell-result .st-rh-result-total{font-size:32px}}@container (min-width: 640px){.st-rh-settlement-shell-result:not(.st-rh-settlement-shell-mobile) .st-rh-fact-grid{grid-template-columns:repeat(3,minmax(0,1fr))}.st-rh-summary-dice-slot-result{width:88px;height:88px}.st-rh-settlement-shell-result .st-rh-result-total{font-size:42px}}@container (min-width: 860px){.st-rh-details-layout-result{grid-template-columns:minmax(0,1fr) minmax(300px,.72fr)}}@container (max-width: 859px){.st-rh-settlement-shell-result .st-rh-result-core-copy:after{display:none}}@container (max-width: 680px){.st-rh-settlement-shell-result .st-rh-summary-mobile-hero .st-rh-result-core{background:radial-gradient(circle at top,rgba(249,225,172,.18),transparent 36%),radial-gradient(circle at bottom right,rgba(139,59,45,.18),transparent 32%),linear-gradient(180deg,#3f2918fc,#0c0806)}.st-rh-settlement-shell-result .st-rh-summary-mobile-hero .st-rh-result-total{font-size:42px}.st-rh-settlement-shell-result .st-rh-summary-mobile-hero .st-rh-result-visual{background:radial-gradient(circle at center,rgba(255,232,179,.14),transparent 42%),linear-gradient(180deg,#0a0806,#1a110bfa)}}@container (max-width: 520px){.st-rh-summary-dice-slot-result{width:72px;height:72px}.st-rh-settlement-shell-result .st-rh-result-total{font-size:32px}}', uS = '.st-rh-settlement-shell-result.st-rh-settlement-shell-mobile .st-rh-mobile-summary-head{background:radial-gradient(circle at top,rgba(248,225,181,.14),transparent 48%),linear-gradient(180deg,#372517fa,#120c09fc)}.st-rh-settlement-shell-result.st-rh-settlement-shell-mobile .st-rh-mobile-summary-kicker-wrap{flex-wrap:nowrap;align-items:center}.st-rh-settlement-shell-result.st-rh-settlement-shell-mobile .st-rh-mobile-summary-kicker{flex:1 1 auto;font-size:10px}.st-rh-settlement-shell-result.st-rh-settlement-shell-mobile .st-rh-mobile-summary-id{flex:0 0 auto;margin-left:auto;max-width:132px;white-space:nowrap}.st-rh-settlement-shell-result.st-rh-settlement-shell-mobile .st-rh-mobile-summary-scroll{border-left-color:#ba4e3cb3}details.st-rh-settlement-shell-result.st-rh-settlement-shell-mobile[open] .st-rh-mobile-summary-wrap{gap:.46rem;padding-bottom:.58rem}details.st-rh-settlement-shell-result.st-rh-settlement-shell-mobile[open] .st-rh-mobile-summary-hero,details.st-rh-settlement-shell-result.st-rh-settlement-shell-mobile[open] .st-rh-mobile-summary-scroll{display:none}details.st-rh-settlement-shell-result.st-rh-settlement-shell-mobile[open] .st-rh-mobile-summary-actions{margin-top:.04rem}.st-rh-settlement-shell-result.st-rh-settlement-shell-mobile .st-rh-mobile-summary-hero .st-rh-result-core{background:radial-gradient(circle at top,rgba(249,225,172,.18),transparent 36%),radial-gradient(circle at bottom right,rgba(139,59,45,.18),transparent 32%),linear-gradient(180deg,#3f2918fc,#0c0806)}.st-rh-settlement-shell-result.st-rh-settlement-shell-mobile .st-rh-mobile-summary-hero .st-rh-result-core-head{display:flex;align-items:center;justify-content:space-between;gap:.72rem;padding:.5rem .7rem .56rem;border:1px solid rgba(188,149,87,.34);background:linear-gradient(90deg,rgba(88,56,30,.34),transparent 32%),linear-gradient(180deg,#4e331c66,#1a110b29);box-shadow:inset 0 0 0 1px #ffe9bd0a,inset 0 -10px 14px #0003}.st-rh-settlement-shell-result.st-rh-settlement-shell-mobile .st-rh-mobile-summary-hero .st-rh-result-core-copy{display:flex;align-items:flex-end;gap:.62rem;min-width:0}.st-rh-settlement-shell-result.st-rh-settlement-shell-mobile .st-rh-mobile-summary-hero .st-rh-kicker-compact{flex:0 0 auto;margin:0;padding:.18rem .46rem .16rem;border:1px solid rgba(194,158,98,.38);background:linear-gradient(180deg,#5e43259e,#291b11c7);color:#e5d0aae0;font-size:10px;letter-spacing:.14em;white-space:nowrap;box-shadow:inset 0 1px #ffe9bd14}.st-rh-settlement-shell-result.st-rh-settlement-shell-mobile .st-rh-mobile-summary-hero .st-rh-kicker-compact:before{content:"◆";margin-right:.28rem;color:#e5bf7bcc;font-size:.8em}.st-rh-settlement-shell-result.st-rh-settlement-shell-mobile .st-rh-mobile-summary-hero .st-rh-result-total{font-size:38px;line-height:.92}.st-rh-settlement-shell-result.st-rh-settlement-shell-mobile .st-rh-mobile-summary-hero .st-rh-result-visual{background:radial-gradient(circle at center,rgba(255,232,179,.14),transparent 42%),linear-gradient(180deg,#0a0806,#1a110bfa)}.st-rh-settlement-shell-result.st-rh-settlement-shell-mobile .st-rh-mobile-summary-hero .st-rh-score-row{flex:1 1 auto;flex-wrap:nowrap;align-items:baseline;gap:.34rem;min-width:0;padding:0;border-bottom:none;white-space:nowrap}.st-rh-settlement-shell-result.st-rh-settlement-shell-mobile .st-rh-mobile-summary-hero .st-rh-result-total-label{color:#e7d1a8e6;font-size:12px;letter-spacing:.12em;white-space:nowrap}.st-rh-settlement-shell-result.st-rh-settlement-shell-mobile .st-rh-mobile-summary-hero .st-rh-status-pill{flex:0 0 auto;min-height:30px;padding:.22rem .72rem;font-size:11px;letter-spacing:.12em;white-space:nowrap}.st-rh-settlement-shell-result.st-rh-settlement-shell-mobile .st-rh-info-panel .st-rh-kicker,.st-rh-settlement-shell-result.st-rh-settlement-shell-mobile .st-rh-details-head-copy>.st-rh-kicker{margin:0;color:#dec490db;font-size:12px;letter-spacing:.12em}.st-rh-settlement-shell-result.st-rh-settlement-shell-mobile .st-rh-mini-kicker{color:#d8bd89e0;font-size:10px;letter-spacing:.12em;border-bottom-color:#ba945829}.st-rh-settlement-shell-result.st-rh-settlement-shell-mobile .st-rh-fact-card{display:flex;flex-direction:column;align-items:flex-start}.st-rh-settlement-shell-result.st-rh-settlement-shell-mobile .st-rh-fact-label,.st-rh-settlement-shell-result.st-rh-settlement-shell-mobile .st-rh-fact-value{width:100%;margin:0;text-align:left}.st-rh-settlement-shell-result.st-rh-settlement-shell-mobile .st-rh-fact-label{margin-bottom:.2rem}@media (max-width: 380px){.st-rh-settlement-shell-result.st-rh-settlement-shell-mobile .st-rh-mobile-summary-kicker-wrap{flex-wrap:nowrap}.st-rh-settlement-shell-result.st-rh-settlement-shell-mobile .st-rh-mobile-summary-id{max-width:112px}.st-rh-settlement-shell-result.st-rh-settlement-shell-mobile .st-rh-mobile-summary-hero .st-rh-result-core-head{gap:.5rem;padding-inline:.56rem}.st-rh-settlement-shell-result.st-rh-settlement-shell-mobile .st-rh-mobile-summary-hero .st-rh-result-core-copy{gap:.42rem}.st-rh-settlement-shell-result.st-rh-settlement-shell-mobile .st-rh-info-panel .st-rh-kicker,.st-rh-settlement-shell-result.st-rh-settlement-shell-mobile .st-rh-details-head-copy>.st-rh-kicker{font-size:11px}.st-rh-settlement-shell-result.st-rh-settlement-shell-mobile .st-rh-mobile-summary-hero .st-rh-kicker-compact{padding-inline:.38rem}.st-rh-settlement-shell-result.st-rh-settlement-shell-mobile .st-rh-mobile-summary-hero .st-rh-result-total{font-size:34px}.st-rh-settlement-shell-result.st-rh-settlement-shell-mobile .st-rh-mobile-summary-hero .st-rh-result-total-label{font-size:11px}.st-rh-settlement-shell-result.st-rh-settlement-shell-mobile .st-rh-mobile-summary-hero .st-rh-status-pill{padding-inline:.58rem;font-size:10px}.st-rh-settlement-shell-result.st-rh-settlement-shell-mobile .st-rh-mini-kicker{font-size:9px}}@container (max-width: 380px){.st-rh-settlement-shell-result.st-rh-settlement-shell-mobile .st-rh-mobile-summary-kicker-wrap{flex-wrap:nowrap}.st-rh-settlement-shell-result.st-rh-settlement-shell-mobile .st-rh-mobile-summary-id{max-width:112px}.st-rh-settlement-shell-result.st-rh-settlement-shell-mobile .st-rh-mobile-summary-hero .st-rh-result-core-head{gap:.5rem;padding-inline:.56rem}.st-rh-settlement-shell-result.st-rh-settlement-shell-mobile .st-rh-mobile-summary-hero .st-rh-result-core-copy{gap:.42rem}.st-rh-settlement-shell-result.st-rh-settlement-shell-mobile .st-rh-info-panel .st-rh-kicker,.st-rh-settlement-shell-result.st-rh-settlement-shell-mobile .st-rh-details-head-copy>.st-rh-kicker{font-size:11px}.st-rh-settlement-shell-result.st-rh-settlement-shell-mobile .st-rh-mobile-summary-hero .st-rh-kicker-compact{padding-inline:.38rem}.st-rh-settlement-shell-result.st-rh-settlement-shell-mobile .st-rh-mobile-summary-hero .st-rh-result-total{font-size:34px}.st-rh-settlement-shell-result.st-rh-settlement-shell-mobile .st-rh-mobile-summary-hero .st-rh-result-total-label{font-size:11px}.st-rh-settlement-shell-result.st-rh-settlement-shell-mobile .st-rh-mobile-summary-hero .st-rh-status-pill{padding-inline:.58rem;font-size:10px}.st-rh-settlement-shell-result.st-rh-settlement-shell-mobile .st-rh-mini-kicker{font-size:9px}}', mS = `<div class="st-rh-card-scope">\r
  <div class="st-rh-event-board">\r
    <div class="st-rh-board-head">\r
      <strong class="st-rh-board-title">当前事件</strong>\r
      <div class="st-rh-board-head-right">\r
        <span class="st-rh-board-id st-rh-mono" data-tip="{{round_id_html}}">轮次 ID: {{round_id_html}}</span>\r
      </div>\r
    </div>\r
    <ul class="st-rh-event-list">{{items_html}}</ul>\r
  </div>\r
</div>\r
`, hS = `<div class="st-rh-card-scope">\r
  <div class="st-rh-event-board st-rh-event-board-mobile">\r
    <div class="st-rh-board-head st-rh-board-head-mobile">\r
      <div class="st-rh-board-head-copy-mobile">\r
        <strong class="st-rh-board-title st-rh-board-title-mobile">当前事件</strong>\r
      </div>\r
      <span class="st-rh-board-id st-rh-board-id-mobile st-rh-mono" data-tip="{{round_id_html}}">轮次 {{round_id_html}}</span>\r
    </div>\r
    <ul class="st-rh-event-list st-rh-event-list-mobile">{{items_html}}</ul>\r
  </div>\r
</div>\r
`, pS = `<li class="st-rh-event-item">\r
  <details class="st-rh-details-card st-rh-details-event">\r
    <summary class="st-rh-collapse-summary" data-st-rh-role="summary">\r
      <div class="st-rh-summary-header">\r
        <div class="st-rh-header-deco-left"></div>\r
        <div class="st-rh-summary-title-row">\r
          <span class="st-rh-summary-badge-slot">{{roll_mode_badge_html}}</span>\r
          <strong class="st-rh-summary-title">\r
            <span class="st-rh-summary-title-marquee-mobile" data-st-rh-role="title-marquee">\r
              <span class="st-rh-summary-title-track-mobile" data-st-rh-role="title-track">\r
                <span class="st-rh-summary-title-segment-mobile" data-st-rh-role="title-segment">{{title_html}}</span>\r
              </span>\r
            </span>\r
          </strong>\r
        </div>\r
        <span class="st-rh-summary-id st-rh-mono" data-tip="{{event_id_html}}">#{{event_id_html}}</span>\r
        <div class="st-rh-header-deco-right"></div>\r
      </div>\r
      <div class="st-rh-summary-layout">\r
        <div class="st-rh-summary-main">\r
          <div class="st-rh-summary-info-row">\r
            <div class="st-rh-summary-info-bar">\r
              <span class="st-rh-summary-chip st-rh-summary-chip-check">\r
                <i class="fa-solid fa-dice-d20 fa-fw st-rh-fa-icon st-rh-summary-chip-icon" aria-hidden="true"></i>\r
                {{collapsed_check_html}}\r
              </span>\r
              <span class="st-rh-summary-chip st-rh-summary-chip-time">\r
                <i class="fa-solid fa-hourglass-clock fa-fw st-rh-fa-icon st-rh-summary-chip-icon"\r
                  aria-hidden="true"></i>\r
                时限 {{time_limit_html}}\r
              </span>\r
            </div>\r
          </div>\r
        </div>\r
\r
        <div class="st-rh-summary-actions">\r
          <div class="st-rh-summary-runtime-slot">\r
            <div data-dice-countdown="1" data-round-id="{{round_id_attr}}" data-event-id="{{event_id_attr}}"\r
              data-deadline-at="{{deadline_attr}}" class="st-rh-runtime st-rh-runtime-inline st-rh-mono"\r
              {{runtime_style_attr}}>\r
              <i class="fa-solid fa-stopwatch fa-fw st-rh-fa-icon st-rh-action-icon" aria-hidden="true"></i>\r
              {{collapsed_runtime_html}}\r
            </div>\r
          </div>\r
          {{roll_action_html}}\r
          {{summary_toggle_state_html}}\r
        </div>\r
      </div>\r
    </summary>\r
\r
    <div id="{{details_id_attr}}" class="st-rh-card-details-body st-rh-event-details" data-st-rh-role="details-body">\r
      <div class="st-rh-event-body">\r
        <div class="st-rh-event-narrative">\r
          <div class="st-rh-event-desc">\r
            {{desc_html}}\r
          </div>\r
          <div class="st-rh-event-preview-slot">{{outcome_preview_html}}</div>\r
        </div>\r
\r
        <div class="st-rh-event-fact-grid">\r
          <div class="st-rh-event-fact">\r
            <div class="st-rh-event-fact-label">\r
              <i class="fa-solid fa-crosshairs fa-fw st-rh-fa-icon st-rh-fact-label-icon" aria-hidden="true"></i>\r
              {{tip_label_target_html}}\r
            </div>\r
            <div class="st-rh-event-fact-value st-rh-event-fact-value-target">{{target_html}}</div>\r
          </div>\r
          <div class="st-rh-event-fact">\r
            <div class="st-rh-event-fact-label">\r
              <i class="fa-solid fa-wand-sparkles fa-fw st-rh-fa-icon st-rh-fact-label-icon" aria-hidden="true"></i>\r
              {{tip_label_skill_html}}\r
            </div>\r
            <div class="st-rh-event-fact-value st-rh-event-fact-value-skill" data-tip="{{skill_title_attr}}">\r
              {{skill_html}}</div>\r
          </div>\r
          <div class="st-rh-event-fact">\r
            <div class="st-rh-event-fact-label">\r
              <i class="fa-solid fa-scale-balanced fa-fw st-rh-fa-icon st-rh-fact-label-icon" aria-hidden="true"></i>\r
              {{tip_label_advantage_html}}\r
            </div>\r
            <div class="st-rh-event-fact-value st-rh-event-fact-value-highlight">{{advantage_state_html}}</div>\r
          </div>\r
          <div class="st-rh-event-fact">\r
            <div class="st-rh-event-fact-label">\r
              <i class="fa-solid fa-dice-d20 fa-fw st-rh-fa-icon st-rh-fact-label-icon" aria-hidden="true"></i>\r
              {{tip_label_dice_html}}\r
            </div>\r
            <div class="st-rh-event-fact-value st-rh-event-fact-value-mono">{{check_dice_html}}</div>\r
          </div>\r
          <div class="st-rh-event-fact">\r
            <div class="st-rh-event-fact-label">\r
              <i class="fa-solid fa-list-check fa-fw st-rh-fa-icon st-rh-fact-label-icon" aria-hidden="true"></i>\r
              {{tip_label_condition_html}}\r
            </div>\r
            <div class="st-rh-event-fact-value st-rh-event-fact-value-mono">{{compare_html}} {{dc_text}}</div>\r
          </div>\r
          <div class="st-rh-event-fact">\r
            <div class="st-rh-event-fact-label">\r
              <i class="fa-solid fa-hourglass-clock fa-fw st-rh-fa-icon st-rh-fact-label-icon" aria-hidden="true"></i>\r
              {{tip_label_time_html}}\r
            </div>\r
            <div class="st-rh-event-fact-value st-rh-event-fact-value-time">{{time_limit_html}}</div>\r
          </div>\r
          <div class="st-rh-event-fact st-rh-event-fact-wide st-rh-event-fact-modifier">\r
            {{modifier_badge_html}}\r
          </div>\r
        </div>\r
\r
        <div class="st-rh-event-note-stack">\r
          <div class="st-rh-event-note-slot">{{dc_reason_html}}</div>\r
          <div class="st-rh-event-note-slot">{{rolled_block_html}}</div>\r
        </div>\r
\r
        <div class="st-rh-event-footer is-centered">\r
          <code class="st-rh-command">{{command_text_html}}</code>\r
        </div>\r
      </div>\r
    </div>\r
  </details>\r
</li>\r
`, fS = `<li class="st-rh-event-item st-rh-event-item-mobile">\r
  <details class="st-rh-details-card st-rh-details-event st-rh-details-event-mobile">\r
    <summary class="st-rh-collapse-summary st-rh-collapse-summary-mobile" data-st-rh-role="summary">\r
      <div class="st-rh-summary-mobile-shell">\r
        <div class="st-rh-summary-mobile-head">\r
          <div class="st-rh-summary-title-row-mobile">\r
            <span class="st-rh-summary-badge-slot-mobile">{{roll_mode_badge_html}}</span>\r
            <strong class="st-rh-summary-title st-rh-summary-title-mobile">\r
              <span class="st-rh-summary-title-marquee-mobile" data-st-rh-role="title-marquee">\r
                <span class="st-rh-summary-title-track-mobile" data-st-rh-role="title-track">\r
                  <span class="st-rh-summary-title-segment-mobile" data-st-rh-role="title-segment">{{title_html}}</span>\r
                </span>\r
              </span>\r
            </strong>\r
          </div>\r
        </div>\r
\r
        <div class="st-rh-summary-mobile-info-grid">\r
          <span class="st-rh-summary-mobile-info st-rh-summary-mobile-info-check">\r
            <i class="fa-solid fa-dice-d20 fa-fw st-rh-fa-icon st-rh-summary-chip-icon" aria-hidden="true"></i>\r
            <span class="st-rh-mobile-marquee st-rh-summary-mobile-info-marquee" data-st-rh-role="inline-marquee">\r
              <span class="st-rh-mobile-marquee-track" data-st-rh-role="inline-track">\r
                <span class="st-rh-mobile-marquee-segment" data-st-rh-role="inline-segment">{{collapsed_check_html}}</span>\r
              </span>\r
            </span>\r
          </span>\r
          <span class="st-rh-summary-mobile-info st-rh-summary-mobile-info-time">\r
            <i class="fa-solid fa-hourglass-clock fa-fw st-rh-fa-icon st-rh-summary-chip-icon" aria-hidden="true"></i>\r
            <span class="st-rh-mobile-marquee st-rh-summary-mobile-info-marquee" data-st-rh-role="inline-marquee">\r
              <span class="st-rh-mobile-marquee-track" data-st-rh-role="inline-track">\r
                <span class="st-rh-mobile-marquee-segment" data-st-rh-role="inline-segment">时限 {{time_limit_html}}</span>\r
              </span>\r
            </span>\r
          </span>\r
          <div data-dice-countdown="1" data-round-id="{{round_id_attr}}" data-event-id="{{event_id_attr}}"\r
            data-deadline-at="{{deadline_attr}}" class="st-rh-runtime st-rh-runtime-mobile st-rh-mono"\r
            {{runtime_style_attr}}>\r
            <i class="fa-solid fa-stopwatch fa-fw st-rh-fa-icon st-rh-action-icon" aria-hidden="true"></i>\r
            {{collapsed_runtime_html}}\r
          </div>\r
        </div>\r
\r
        <div class="st-rh-summary-mobile-actions">\r
          {{roll_action_html}}\r
          {{summary_toggle_state_html}}\r
        </div>\r
\r
        <div class="st-rh-summary-mobile-meta">\r
          <span class="st-rh-summary-id st-rh-summary-id-mobile st-rh-mono" data-tip="{{event_id_html}}">#{{event_id_html}}</span>\r
        </div>\r
      </div>\r
    </summary>\r
\r
    <div id="{{details_id_attr}}" class="st-rh-card-details-body st-rh-event-details st-rh-event-details-mobile" data-st-rh-role="details-body">\r
      <div class="st-rh-event-body st-rh-event-body-mobile">\r
        <div class="st-rh-event-mobile-lead">\r
          <div class="st-rh-event-desc st-rh-event-desc-mobile">\r
            {{desc_html}}\r
          </div>\r
          <div class="st-rh-event-preview-slot st-rh-event-preview-slot-mobile">{{outcome_preview_html}}</div>\r
        </div>\r
\r
        <div class="st-rh-event-fact-grid st-rh-event-fact-grid-mobile">\r
          <div class="st-rh-event-fact st-rh-event-fact-mobile">\r
            <div class="st-rh-event-fact-label">\r
              <i class="fa-solid fa-crosshairs fa-fw st-rh-fa-icon st-rh-fact-label-icon" aria-hidden="true"></i>\r
              {{tip_label_target_html}}\r
            </div>\r
            <div class="st-rh-event-fact-value st-rh-event-fact-value-target">{{target_html}}</div>\r
          </div>\r
          <div class="st-rh-event-fact st-rh-event-fact-mobile">\r
            <div class="st-rh-event-fact-label">\r
              <i class="fa-solid fa-wand-sparkles fa-fw st-rh-fa-icon st-rh-fact-label-icon" aria-hidden="true"></i>\r
              {{tip_label_skill_html}}\r
            </div>\r
            <div class="st-rh-event-fact-value st-rh-event-fact-value-skill" data-tip="{{skill_title_attr}}">\r
              {{skill_html}}\r
            </div>\r
          </div>\r
          <div class="st-rh-event-fact st-rh-event-fact-mobile">\r
            <div class="st-rh-event-fact-label">\r
              <i class="fa-solid fa-scale-balanced fa-fw st-rh-fa-icon st-rh-fact-label-icon" aria-hidden="true"></i>\r
              {{tip_label_advantage_html}}\r
            </div>\r
            <div class="st-rh-event-fact-value st-rh-event-fact-value-highlight">{{advantage_state_html}}</div>\r
          </div>\r
          <div class="st-rh-event-fact st-rh-event-fact-mobile">\r
            <div class="st-rh-event-fact-label">\r
              <i class="fa-solid fa-dice-d20 fa-fw st-rh-fa-icon st-rh-fact-label-icon" aria-hidden="true"></i>\r
              {{tip_label_dice_html}}\r
            </div>\r
            <div class="st-rh-event-fact-value st-rh-event-fact-value-mono">{{check_dice_html}}</div>\r
          </div>\r
          <div class="st-rh-event-fact st-rh-event-fact-mobile">\r
            <div class="st-rh-event-fact-label">\r
              <i class="fa-solid fa-list-check fa-fw st-rh-fa-icon st-rh-fact-label-icon" aria-hidden="true"></i>\r
              {{tip_label_condition_html}}\r
            </div>\r
            <div class="st-rh-event-fact-value st-rh-event-fact-value-mono">{{compare_html}} {{dc_text}}</div>\r
          </div>\r
          <div class="st-rh-event-fact st-rh-event-fact-mobile">\r
            <div class="st-rh-event-fact-label">\r
              <i class="fa-solid fa-hourglass-clock fa-fw st-rh-fa-icon st-rh-fact-label-icon" aria-hidden="true"></i>\r
              {{tip_label_time_html}}\r
            </div>\r
            <div class="st-rh-event-fact-value st-rh-event-fact-value-time">{{time_limit_html}}</div>\r
          </div>\r
          <div class="st-rh-event-fact st-rh-event-fact-wide st-rh-event-fact-modifier st-rh-event-fact-mobile">\r
            {{modifier_badge_html}}\r
          </div>\r
        </div>\r
\r
        <div class="st-rh-event-note-stack st-rh-event-note-stack-mobile">\r
          <div class="st-rh-event-note-slot">{{dc_reason_html}}</div>\r
          <div class="st-rh-event-note-slot">{{rolled_block_html}}</div>\r
        </div>\r
\r
        <div class="st-rh-event-footer st-rh-event-footer-mobile is-centered">\r
          <code class="st-rh-command st-rh-command-mobile">{{command_text_html}}</code>\r
        </div>\r
      </div>\r
    </div>\r
  </details>\r
</li>\r
`, gS = `<div class="st-rh-card-scope">\r
  <details\r
    class="st-rh-settlement-shell {{shell_type_class}} st-rh-shell-frame"\r
  >\r
    <summary class="st-rh-shell-summary" data-st-rh-role="summary">\r
      <div class="st-rh-shell-topline st-rh-shell-line"></div>\r
      <div class="st-rh-summary-wrap st-rh-result-summary-grid">\r
        <div class="st-rh-summary-ornament" aria-hidden="true">\r
          <span class="st-rh-summary-ornament-line"></span>\r
          <span class="st-rh-summary-ornament-seal"></span>\r
          <spen style="font-size: 20px; margin-bottom: 3px"\r
            >{{summary_kicker_text}}</spen\r
          >\r
          <span class="st-rh-summary-ornament-seal"></span>\r
          <span class="st-rh-summary-ornament-line"></span>\r
        </div>\r
        <div class="st-rh-result-summary-main">\r
          <div class="st-rh-summary-banner">\r
            <div class="st-rh-summary-banner-inner">\r
              <div class="st-rh-summary-header">\r
                <div class="st-rh-header-deco-left"></div>\r
                <strong class="st-rh-summary-title">\r
                  <span\r
                    class="st-rh-summary-title-marquee"\r
                    data-st-rh-role="title-marquee"\r
                  >\r
                    <span\r
                      class="st-rh-summary-title-track"\r
                      data-st-rh-role="title-track"\r
                    >\r
                      <span\r
                        class="st-rh-summary-title-segment"\r
                        data-st-rh-role="title-segment"\r
                        >{{title_html}}</span\r
                      >\r
                    </span>\r
                  </span>\r
                </strong>\r
                <span class="st-rh-summary-id st-rh-mono"\r
                  >#{{roll_id_html}}</span\r
                >\r
                <div class="st-rh-header-deco-right"></div>\r
              </div>\r
            </div>\r
          </div>\r
          <div class="st-rh-summary-primary st-rh-summary-judgement">\r
            <div class="st-rh-summary-badge">{{summary_status_badge_html}}</div>\r
            {{summary_primary_chips_html}}\r
          </div>\r
          <div class="st-rh-summary-mobile-hero">\r
            {{summary_result_core_html}}\r
          </div>\r
          <div class="st-rh-summary-outcome-wrap">\r
            <div class="st-rh-summary-outcome-scroll">\r
              {{summary_secondary_chips_html}}\r
            </div>\r
          </div>\r
        </div>\r
        <div class="st-rh-result-summary-side">\r
          <div class="st-rh-summary-visual-wrap">\r
            <div class="st-rh-summary-visual-dais">\r
              <div\r
                class="st-rh-dice-slot st-rh-summary-dice-slot {{dice_slot_type_class}}"\r
              >\r
                {{summary_dice_visual_html}}\r
              </div>\r
            </div>\r
          </div>\r
          <div class="st-rh-summary-actions-compact">\r
            {{summary_toggle_html}}\r
          </div>\r
        </div>\r
      </div>\r
    </summary>\r
\r
    <div\r
      id="{{details_id_attr}}"\r
      class="st-rh-details-body"\r
      data-st-rh-role="details-body"\r
    >\r
      <div class="st-rh-details-layout {{details_layout_type_class}}">\r
        <section class="st-rh-details-main">\r
          <div class="st-rh-panel st-rh-meta-panel">\r
            <div class="st-rh-details-head">\r
              <div class="st-rh-details-head-copy">\r
                <p class="st-rh-kicker">{{details_kicker_text}}</p>\r
                <div class="st-rh-details-heading">\r
                  {{details_heading_html}}\r
                </div>\r
              </div>\r
            </div>\r
            <dl class="st-rh-fact-grid">{{detail_meta_html}}</dl>\r
          </div>\r
\r
          {{outcome_section_html}} {{footer_blocks_html}}\r
        </section>\r
\r
        <aside class="st-rh-details-side">\r
          <div class="st-rh-details-side-primary">\r
            {{detail_result_core_html}}\r
          </div>\r
          {{detail_aux_html}}\r
        </aside>\r
      </div>\r
    </div>\r
  </details>\r
</div>\r
`, vS = `<div class="st-rh-card-scope">\r
  <details\r
    class="st-rh-settlement-shell st-rh-settlement-shell-mobile {{shell_type_class}} st-rh-shell-frame"\r
  >\r
    <summary class="st-rh-shell-summary st-rh-mobile-shell-summary" data-st-rh-role="summary">\r
      <div class="st-rh-shell-topline st-rh-shell-line"></div>\r
      <div class="st-rh-mobile-summary-wrap">\r
        <div class="st-rh-mobile-summary-head">\r
          <div class="st-rh-mobile-summary-crest" aria-hidden="true"></div>\r
          <div class="st-rh-mobile-summary-copy">\r
            <div class="st-rh-mobile-summary-kicker-wrap">\r
              <p class="st-rh-kicker st-rh-mobile-summary-kicker">\r
                {{summary_kicker_text}}\r
              </p>\r
              <span class="st-rh-summary-id st-rh-mono st-rh-mobile-summary-id"\r
                >#{{roll_id_html}}</span\r
              >\r
            </div>\r
            <strong class="st-rh-summary-title st-rh-mobile-summary-title">\r
              <span class="st-rh-summary-title-marquee" data-st-rh-role="title-marquee">\r
                <span class="st-rh-summary-title-track" data-st-rh-role="title-track">\r
                  <span class="st-rh-summary-title-segment" data-st-rh-role="title-segment"\r
                    >{{title_html}}</span\r
                  >\r
                </span>\r
              </span>\r
            </strong>\r
          </div>\r
        </div>\r
\r
        <div class="st-rh-mobile-summary-hero">{{summary_result_core_html}}</div>\r
\r
        <div class="st-rh-mobile-summary-scroll">\r
          {{summary_secondary_chips_html}}\r
        </div>\r
\r
        <div class="st-rh-mobile-summary-actions">{{summary_toggle_html}}</div>\r
      </div>\r
    </summary>\r
\r
    <div\r
      id="{{details_id_attr}}"\r
      class="st-rh-details-body st-rh-mobile-details-body"\r
      data-st-rh-role="details-body"\r
    >\r
      <div\r
        class="st-rh-details-layout st-rh-details-layout-mobile {{details_layout_type_class}}"\r
      >\r
        <section class="st-rh-mobile-details-stack">\r
          {{outcome_section_html}}\r
\r
          <div class="st-rh-panel st-rh-meta-panel">\r
            <div class="st-rh-details-head">\r
              <div class="st-rh-details-head-copy">\r
                <p class="st-rh-kicker">{{details_kicker_text}}</p>\r
              </div>\r
              <div class="st-rh-details-head-side">\r
\r
                <div class="st-rh-details-badge">\r
                  {{details_status_badge_html}}\r
                </div>\r
              </div>\r
            </div>\r
            <dl class="st-rh-fact-grid">{{detail_meta_html}}</dl>\r
          </div>\r
\r
          {{detail_result_core_html}} {{detail_aux_html}} {{footer_blocks_html}}\r
        </section>\r
      </div>\r
    </div>\r
  </details>\r
</div>\r
`, Id = "st-rh-event-card-styles-v1", bS = "st-rh-event-card-external-style-v1", Ad = "custom-", xS = /\.(?=[A-Za-z_\\])((?:\\.|[A-Za-z0-9_%@/\-[\]:])+)/g, yS = [
  "https://site-assets.fontawesome.com/releases/v7.2.0/css/all.css",
  "https://site-assets.fontawesome.com/releases/v7.2.0/css/sharp-solid.css",
  "https://site-assets.fontawesome.com/releases/v7.2.0/css/sharp-regular.css",
  "https://site-assets.fontawesome.com/releases/v7.2.0/css/sharp-light.css",
  "https://site-assets.fontawesome.com/releases/v7.2.0/css/duotone.css",
  "https://site-assets.fontawesome.com/releases/v7.2.0/css/sharp-duotone-solid.css",
  "https://site-assets.fontawesome.com/releases/v7.2.0/css/chisel-regular.css",
  "https://site-assets.fontawesome.com/releases/v7.2.0/css/etch-solid.css",
  "https://site-assets.fontawesome.com/releases/v7.2.0/css/graphite-thin.css",
  "https://site-assets.fontawesome.com/releases/v7.2.0/css/jelly-regular.css",
  "https://site-assets.fontawesome.com/releases/v7.2.0/css/notdog-solid.css",
  "https://site-assets.fontawesome.com/releases/v7.2.0/css/slab-regular.css",
  "https://site-assets.fontawesome.com/releases/v7.2.0/css/thumbprint-light.css",
  "https://site-assets.fontawesome.com/releases/v7.2.0/css/utility-semibold.css",
  "https://site-assets.fontawesome.com/releases/v7.2.0/css/whiteboard-semibold.css"
], SS = `@font-face {
  font-family: "STRHSourceSong";
  src: url("${new URL(
  /* @vite-ignore */
  "./assets/font/思源宋体.otf",
  import.meta.url
).href}") format("opentype");
  font-style: normal;
  font-weight: 400 900;
  font-display: swap;
}`;
function ES(e) {
  return e.replace(xS, (t, r) => r.startsWith(Ad) ? t : `.${Ad}${r}`);
}
var $d = [
  nS,
  sS,
  oS,
  aS,
  iS,
  lS,
  cS,
  dS,
  uS
].join(`
`), _S = `${SS}
${$d}
${ES($d)}`;
function TS() {
  return _S;
}
function kS(e = document) {
  e?.head && yS.forEach((t, r) => {
    const n = `${bS}-${r}`, o = e.getElementById(n);
    if (o) {
      o.href !== t && (o.href = t);
      return;
    }
    const i = e.createElement("link");
    i.id = n, i.rel = "stylesheet", i.href = t, e.head.appendChild(i);
  });
}
function zl(e = document) {
  if (!e?.head) return;
  kS(e);
  const t = TS(), r = e.getElementById(Id);
  if (r) {
    r.textContent !== t && (r.textContent = t);
    return;
  }
  const n = e.createElement("style");
  n.id = Id, n.textContent = t, e.head.appendChild(n), wS(e);
}
var Rd = "st-rh-details-anim-script-v1";
function wS(e) {
  if (e.getElementById(Rd)) return;
  const t = e.createElement("script");
  t.id = Rd, t.textContent = `
(function(){
  if(window.__stRhDetailsAnimBound)return;
  window.__stRhDetailsAnimBound=true;
  var marqueeRefreshQueued=false;
  var marqueeResizeObserver=null;
  var observedMarqueeResizeTargets=typeof WeakSet==='function'?new WeakSet():null;
  function resolveMarqueeNodes(marquee){
    var track=marquee.querySelector('[data-st-rh-role="title-track"], [data-st-rh-role="inline-track"]');
    var segment=marquee.querySelector('[data-st-rh-role="title-segment"], [data-st-rh-role="inline-segment"]');
    if(!track||!segment)return null;
    return {track:track,segment:segment};
  }
  function refreshSingleMobileMarquee(marquee){
    var nodes=resolveMarqueeNodes(marquee);
    if(!nodes)return false;
    var track=nodes.track;
    var segment=nodes.segment;
    var visibleWidth=Math.ceil(marquee.clientWidth||marquee.getBoundingClientRect().width||0);
    var contentWidth=Math.ceil(segment.scrollWidth||segment.getBoundingClientRect().width||0);
    if(visibleWidth<=0||contentWidth<=0)return false;
    track.style.removeProperty('--st-rh-marquee-distance');
    track.style.removeProperty('--st-rh-marquee-duration');
    marquee.classList.remove('is-overflowing');
    var overflowWidth=contentWidth-visibleWidth;
    if(overflowWidth<=2)return true;
    marquee.classList.add('is-overflowing');
    track.style.setProperty('--st-rh-marquee-distance', '-' + overflowWidth + 'px');
    track.style.setProperty('--st-rh-marquee-duration', Math.max(6, Math.min(18, overflowWidth / 18 + 4)) + 's');
    return true;
  }
  function refreshMobileMarquee(){
    var marquees=document.querySelectorAll('[data-st-rh-role="title-marquee"], [data-st-rh-role="inline-marquee"]');
    marquees.forEach(function(marquee){
      refreshSingleMobileMarquee(marquee);
    });
  }
  function queueMobileMarqueeRefresh(){
    if(marqueeRefreshQueued)return;
    marqueeRefreshQueued=true;
    requestAnimationFrame(function(){
      refreshMobileMarquee();
      requestAnimationFrame(function(){
        refreshMobileMarquee();
        window.setTimeout(function(){
          marqueeRefreshQueued=false;
          refreshMobileMarquee();
        },120);
      });
    });
  }
  function observeMarqueeResizeTarget(target){
    if(!marqueeResizeObserver||!target)return;
    if(observedMarqueeResizeTargets&&observedMarqueeResizeTargets.has(target))return;
    if(observedMarqueeResizeTargets)observedMarqueeResizeTargets.add(target);
    marqueeResizeObserver.observe(target);
  }
  function observeMobileTitleMarqueeTargets(root){
    if(!root)return;
    if(root.nodeType===1&&root.matches&&root.matches('.st-rh-card-switch, [data-st-rh-role="title-marquee"], [data-st-rh-role="inline-marquee"]')){
      observeMarqueeResizeTarget(root);
    }
    if(!root.querySelectorAll)return;
    root.querySelectorAll('.st-rh-card-switch, [data-st-rh-role="title-marquee"], [data-st-rh-role="inline-marquee"]').forEach(function(target){
      observeMarqueeResizeTarget(target);
    });
  }
  function syncDetailsVariants(details,shouldOpen){
    var syncKey=details.getAttribute('data-st-rh-sync-key');
    if(!syncKey)return;
    var peers=document.querySelectorAll('details[data-st-rh-sync-key]');
    peers.forEach(function(peer){
      if(peer===details)return;
      if(peer.getAttribute('data-st-rh-sync-key')!==syncKey)return;
      var body=peer.querySelector('[data-st-rh-role="details-body"]');
      if(body){
        body.classList.remove('st-rh-anim-opening','st-rh-anim-closing');
      }
      if(shouldOpen){
        peer.setAttribute('open','');
      }else{
        peer.removeAttribute('open');
      }
    });
  }
  if(window.ResizeObserver){
    marqueeResizeObserver=new ResizeObserver(function(){
      queueMobileMarqueeRefresh();
    });
    observeMobileTitleMarqueeTargets(document);
  }
  queueMobileMarqueeRefresh();
  window.addEventListener('resize',queueMobileMarqueeRefresh,{passive:true});
  window.addEventListener('load',queueMobileMarqueeRefresh,{passive:true});
  if(document.fonts&&typeof document.fonts.ready==='object'&&typeof document.fonts.ready.then==='function'){
    document.fonts.ready.then(function(){
      queueMobileMarqueeRefresh();
    });
  }
  if(document.body&&window.MutationObserver){
    var mutationObserver=new MutationObserver(function(mutations){
      mutations.forEach(function(mutation){
        if(mutation.type!=='childList')return;
        mutation.addedNodes.forEach(function(node){
          if(!node||node.nodeType!==1)return;
          observeMobileTitleMarqueeTargets(node);
        });
      });
      queueMobileMarqueeRefresh();
    });
    mutationObserver.observe(document.body,{childList:true,subtree:true,characterData:true});
  }
  document.addEventListener('click',function(e){
    var t=e.target;
    if(!t)return;
    if(t.closest&&t.closest('button'))return;
    var summary=t.closest?t.closest('[data-st-rh-role="summary"]'):null;
    if(!summary){
      if(t.tagName==='SUMMARY'&&t.getAttribute('data-st-rh-role')==='summary')summary=t;
      else if(t.parentElement&&t.parentElement.tagName==='SUMMARY')summary=t.parentElement;
      else return;
    }
    var d=summary.parentElement;
    if(!d||d.tagName!=='DETAILS')return;
    e.preventDefault();
    var b=d.querySelector('[data-st-rh-role="details-body"]');
    if(!b){d.open=!d.open;return}
    b.classList.remove('st-rh-anim-opening','st-rh-anim-closing');
    if(d.open){
      b.classList.add('st-rh-anim-closing');
      function cl(){b.removeEventListener('animationend',cl);b.classList.remove('st-rh-anim-closing');d.removeAttribute('open')}
      b.addEventListener('animationend',cl);
      syncDetailsVariants(d,false);
      setTimeout(function(){b.classList.remove('st-rh-anim-closing');if(d.open)d.removeAttribute('open')},300);
    }else{
      d.setAttribute('open','');
      syncDetailsVariants(d,true);
      b.classList.add('st-rh-anim-opening');
      function op(){b.removeEventListener('animationend',op);b.classList.remove('st-rh-anim-opening')}
      b.addEventListener('animationend',op);
      setTimeout(function(){b.classList.remove('st-rh-anim-opening')},350);
    }
  },true);
})();
`, e.head.appendChild(t);
}
function vi(e, t) {
  return `${e}-${t}`;
}
function bi(e, t, r) {
  return e.replace(/<details\b/, `<details data-st-rh-sync-key="${t}" data-st-rh-template-variant="${r}"`);
}
function op(e, t, r) {
  return `<div class="st-rh-card-switch ${e}">
    <div class="st-rh-card-variant st-rh-card-variant-desktop" data-st-rh-template-variant="desktop">${t}</div>
    <div class="st-rh-card-variant st-rh-card-variant-mobile" data-st-rh-template-variant="mobile">${r}</div>
  </div>`;
}
function IS(e, t) {
  return `<div class="st-rh-rolled-block">
  ${e} 已结算：${t}
</div>`;
}
function AS(e) {
  return e ? "<span style='color:#ff4d4f;font-weight:bold;'>[超时]</span>" : "<span style='color:#52c41a;font-weight:bold;'>[已掷]</span>";
}
function Ke(e, t) {
  return `<span class="st-rh-tip-label" data-tip="${t}">${e}</span>`;
}
function xi() {
  return `<span class="st-rh-summary-toggle-state" data-st-rh-role="toggle-state" aria-hidden="true">
            <span class="st-rh-toggle-closed"><i class="fa-solid fa-chevron-down fa-fw st-rh-fa-icon" style="margin-right:4px;"></i>展开详情</span>
            <span class="st-rh-toggle-open"><i class="fa-solid fa-chevron-up fa-fw st-rh-fa-icon" style="margin-right:4px;"></i>收起详情</span>
          </span>`.replace('class="st-rh-toggle-closed"', 'class="st-rh-toggle-closed" data-st-rh-role="toggle-closed"').replace('class="st-rh-toggle-open"', 'class="st-rh-toggle-open" data-st-rh-role="toggle-open"');
}
function $S(e) {
  const t = e.buttonStateStyle ? ` style="${e.buttonStateStyle}"` : "";
  return `<button type="button" class="st-rh-roll-btn" data-dice-event-roll="1" data-round-id="${e.roundIdAttr}"
  data-dice-event-id="${e.eventIdAttr}" data-dice-expr="${e.diceExprAttr}" ${e.buttonDisabledAttr}${t}>
  <i class="fa-solid fa-dice-d20 fa-fw st-rh-fa-icon" aria-hidden="true" style="margin-right:6px; opacity:0.9;"></i>执行检定
</button>`;
}
function RS(e) {
  const t = e.templateVariant ?? "desktop", r = vi(e.detailsIdAttr, t), n = t === "mobile" ? fS : pS, o = e.modifierTextHtml ? `<span class="st-rh-chip"><i class="fa-solid fa-calculator fa-fw st-rh-fa-icon st-rh-fact-label-icon" aria-hidden="true" style="margin-right: 6px; font-size: 0.85rem; color: #d8b87a; opacity: 0.9;"></i>${Ke("修正：", "总修正 = 基础修正 + 技能修正 + 状态修正。")} <span class="st-rh-chip-highlight">${e.modifierTextHtml}</span></span>` : "", i = e.rollButtonHtml ? e.rollButtonHtml : '<span class="st-rh-summary-lock st-rh-mono"><i class="fa-solid fa-lock fa-fw st-rh-fa-icon" style="margin-right:6px;"></i>已锁定</span>', c = e.dcReasonHtml ? `<div class="st-rh-dc-reason">${e.dcReasonHtml}</div>` : "";
  return bi(Wn(n, {
    title_html: e.titleHtml,
    roll_mode_badge_html: e.rollModeBadgeHtml,
    event_id_html: e.eventIdHtml,
    collapsed_check_html: e.collapsedCheckHtml,
    time_limit_html: e.timeLimitHtml,
    round_id_attr: e.roundIdAttr,
    event_id_attr: e.eventIdAttr,
    deadline_attr: e.deadlineAttr,
    runtime_style_attr: e.runtimeStyleAttr,
    collapsed_runtime_html: e.runtimeTextHtml || e.collapsedRuntimeHtml,
    roll_action_html: i,
    summary_toggle_state_html: xi(),
    details_id_attr: r,
    desc_html: e.descHtml,
    outcome_preview_html: e.outcomePreviewHtml,
    tip_label_target_html: Ke("对象", "本次事件影响的叙事对象。"),
    target_html: e.targetHtml,
    tip_label_skill_html: Ke("技能", "参与检定并提供修正的技能项。"),
    skill_title_attr: e.skillTitleAttr,
    skill_html: e.skillHtml,
    tip_label_advantage_html: Ke("掷骰模式", "普通、优势、劣势会影响最终检定结果。"),
    advantage_state_html: e.advantageStateHtml,
    tip_label_dice_html: Ke("骰式", "本次检定使用的骰子表达式。"),
    check_dice_html: e.checkDiceHtml,
    tip_label_condition_html: Ke("条件", "将掷骰总值与 DC 按比较符进行判定。"),
    compare_html: e.compareHtml,
    dc_text: e.dcText,
    tip_label_time_html: Ke("时限", "超时未检定时，系统会按对应规则自动处理。"),
    modifier_badge_html: o,
    dc_reason_html: c,
    rolled_block_html: e.rolledBlockHtml,
    command_text_html: e.commandTextHtml
  }), e.detailsIdAttr, t);
}
function CS(e, t, r = t) {
  return op("st-rh-card-switch-event-board", Wn(mS, {
    round_id_html: e,
    items_html: t
  }), Wn(hS, {
    round_id_html: e,
    items_html: r
  }));
}
function Nr(...e) {
  return e.filter(Boolean).join(" ");
}
function Wn(e, t) {
  return e.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (r, n) => t[n] ?? "");
}
function Cd(e, t, r, n) {
  if (!String(e ?? "").trim()) return "";
  const o = n ? ` data-tip="${n}"` : "";
  return `<span class="${Nr("st-rh-status-pill st-rh-inline-chip st-rh-status-badge", r)}" style="--st-rh-status-color:${t};"${o}>${e}</span>`;
}
function qa(e, t) {
  if (!String(e ?? "").trim()) return "";
  const r = t?.tipAttr ? ` data-tip="${t.tipAttr}"` : "", n = t?.iconClass ? `<i class="${t.iconClass} fa-fw st-rh-chip-icon" aria-hidden="true"></i>` : "";
  return `<span class="${Nr(t?.strong ? "st-rh-chip-strong st-rh-inline-chip st-rh-inline-chip-gap" : "st-rh-chip-soft st-rh-inline-chip st-rh-inline-chip-gap", t?.classes)}"${r}>${n}${e}</span>`;
}
function Dd(e, t, r, n, o) {
  return String(e ?? "").trim() ? `<span class="${Nr("st-rh-chip-soft st-rh-inline-chip st-rh-inline-chip-gap st-rh-inline-chip-fluid", r, n)}">${o ? `<i class="${o} fa-fw st-rh-chip-icon" aria-hidden="true"></i>` : ""}${e}</span>` : "";
}
function jt(e, t, r) {
  return String(t ?? "").trim() ? `<div class="st-rh-fact-card st-rh-surface-card">
    <dt class="st-rh-fact-label">${e}</dt>
    <dd class="${Nr("st-rh-fact-value", r?.valueClasses)}">${t}</dd>
  </div>` : "";
}
function DS(e, t, r) {
  return String(t ?? "").trim() ? `<div class="${Nr("st-rh-panel st-rh-info-panel", r)}">
    <p class="st-rh-kicker">${e}</p>
    <div class="st-rh-detail-note st-rh-panel-copy">${t}</div>
  </div>` : "";
}
function Fa(e, t, r) {
  return String(t ?? "").trim() ? `<div class="${Nr("st-rh-outcome-strip-item", r)}">
    <span class="st-rh-outcome-strip-label">${e}</span>
    <span class="st-rh-outcome-strip-value">${t}</span>
  </div>` : "";
}
function NS(e) {
  if (!String(e.outcomeTextHtml ?? "").trim()) return "";
  const t = String(e.currentStatusesHtml ?? "").trim(), r = [
    Fa("判定影响", e.statusImpactHtml),
    Fa("状态变化", e.outcomeStatusSummaryHtml),
    Fa("当前状态", e.currentStatusesHtml, t === "无" ? "st-rh-outcome-strip-item-muted" : "")
  ].filter(Boolean).join("");
  return `<section class="${Nr("st-rh-panel st-rh-info-panel st-rh-outcome-panel", e.toneClassName)}">
    <div class="st-rh-outcome-head">
      <span class="st-rh-outcome-head-line" aria-hidden="true"></span>
      <span class="st-rh-outcome-head-seal" aria-hidden="true"></span>
      <p class="st-rh-kicker st-rh-outcome-kicker">${e.kickerText}</p>
      <span class="st-rh-outcome-head-seal" aria-hidden="true"></span>
      <span class="st-rh-outcome-head-line" aria-hidden="true"></span>
    </div>
    <div class="st-rh-outcome-scroll">
      <div class="st-rh-outcome-copy">${e.outcomeTextHtml}</div>
    </div>
    ${r ? `<div class="st-rh-outcome-status-strip">${r}</div>` : ""}
  </section>`;
}
function Nd(e, t) {
  return String(e ?? "").trim() ? e : `<span class="st-rh-summary-visual-fallback">${t}</span>`;
}
function Ld(e) {
  const t = String(e.diceVisualBlockHtml ?? "").trim() ? e.diceVisualBlockHtml : `<div class="st-rh-empty-visual">${e.emptyVisualHint}</div>`;
  return `<div class="st-rh-panel st-rh-result-core">
    ${e.showVisual === !1 ? "" : `<div class="st-rh-result-visual">
      ${t}
    </div>`}
    <div class="st-rh-result-meta-grid">
      ${jt(Ke("条件", "将总值与 DC 按比较符进行结算判定。"), `<span class="st-rh-mono st-rh-fact-value-mono">${e.compareHtml} ${e.dcText}</span>`, { valueClasses: "st-rh-fact-value-mono" })}
      ${jt(Ke("时限", "事件超时后，系统会按对应规则自动处理。"), e.timeLimitHtml)}
    </div>
  </div>`;
}
function LS(e, t) {
  return `<span class="st-rh-mono st-rh-title-text">[${e}]</span>
    <span class="st-rh-inline-divider">•</span>
    <span class="st-rh-meta-text">修正：</span>
    <span class="st-rh-mono st-rh-emphasis-text">${t}</span>`;
}
function MS(e) {
  const t = Cd(e.collapsedStatusHtml, e.statusColor, void 0, "本次结算的最终判定结果。"), r = Cd(e.statusText, e.statusColor), n = [qa(`总点 <span class="st-rh-mono st-rh-title-text">${e.collapsedTotalHtml}</span>`, {
    strong: !0,
    iconClass: "fa-solid fa-dice-d20",
    tipAttr: "最终总点数，通常由骰面结果与各类修正共同组成。"
  }), qa(`<span class="st-rh-mono">${e.collapsedConditionHtml}</span>`, {
    iconClass: "fa-solid fa-bullseye",
    tipAttr: "结算时用于比较总点与 DC 的判定条件。"
  })].filter(Boolean).join(""), o = [
    qa(e.collapsedSourceHtml, { iconClass: "fa-solid fa-user-pen" }),
    Dd(e.collapsedOutcomeHtml, e.collapsedOutcomeTitleAttr, e.collapsedOutcomeChipClassName || "st-rh-summary-chip-outcome", "", "fa-solid fa-scroll"),
    Dd(e.collapsedStatusSummaryHtml, e.collapsedStatusSummaryTitleAttr, e.collapsedStatusSummaryChipClassName || "st-rh-summary-chip-status-summary", "", "fa-solid fa-bolt-lightning")
  ].filter(Boolean).join(""), i = [
    jt(Ke("事件 ID", "事件唯一标识。"), `<span class="st-rh-mono st-rh-title-text">${e.eventIdHtml}</span>`, { valueClasses: "st-rh-fact-value-mono" }),
    jt(Ke("来源", "该次结算由谁触发：AI 自动、玩家手动或超时系统结算。"), e.sourceHtml),
    jt(Ke("对象", "本次事件影响的叙事对象。"), e.targetHtml, { valueClasses: "st-rh-fact-value-accent" }),
    jt(Ke("技能", "参与检定并提供修正的技能项。"), `<span data-tip="${e.skillTitleAttr}">${e.skillHtml}</span>`),
    jt(Ke("掷骰模式", "普通、优势、劣势会影响最终检定结果。"), e.advantageStateHtml),
    jt(Ke("骰式", "本次检定使用的骰子表达式。"), `${e.diceExprHtml}${e.diceModifierHintHtml ? `<div class="st-rh-subhint st-rh-emphasis-text">${e.diceModifierHintHtml}</div>` : ""}`, { valueClasses: "st-rh-fact-value-mono st-rh-title-text" })
  ].filter(Boolean).join(""), c = NS({
    kickerText: e.outcomeLabelHtml,
    toneClassName: e.outcomeToneClassName,
    outcomeTextHtml: e.outcomeTextHtml,
    statusImpactHtml: e.statusImpactHtml,
    outcomeStatusSummaryHtml: e.outcomeStatusSummaryHtml,
    currentStatusesHtml: e.currentStatusesHtml
  }), u = Ld({
    kickerText: "结算结果",
    totalText: e.totalText,
    statusText: e.statusText,
    statusColor: e.statusColor,
    compareHtml: e.compareHtml,
    dcText: e.dcText,
    diceVisualBlockHtml: e.diceVisualBlockHtml,
    timeLimitHtml: e.timeLimitHtml,
    emptyVisualHint: "本次结算未生成骰面可视化。",
    showVisual: !1
  }), h = Ld({
    kickerText: "结算结果",
    totalText: e.totalText,
    statusText: e.statusText,
    statusColor: e.statusColor,
    compareHtml: e.compareHtml,
    dcText: e.dcText,
    diceVisualBlockHtml: e.diceVisualBlockHtml,
    timeLimitHtml: e.timeLimitHtml,
    emptyVisualHint: "本次结算未生成骰面可视化。"
  }), f = [DS("判定拆解", `<div class="st-rh-stack-md">
         <div>
           <div class="st-rh-mini-kicker">${Ke("掷骰结果", "原始骰面与最终修正后的结果。")}</div>
           <div class="st-rh-value-copy st-rh-title-text">${e.rollsSummaryHtml}</div>
         </div>
         <div>
           <div class="st-rh-mini-kicker">${Ke("爆骰", "是否请求爆骰，以及是否真实触发连爆或被策略降级。")}</div>
           <div class="st-rh-value-copy">${e.explodeInfoHtml}</div>
         </div>
         ${e.modifierBreakdownHtml ? `<div>
                  <div class="st-rh-mini-kicker">${Ke("修正", "总修正 = 基础修正 + 技能修正 + 状态修正。")}</div>
                  <div class="st-rh-value-copy st-rh-emphasis-text">${e.modifierBreakdownHtml}</div>
                </div>` : ""}
         ${e.dcReasonHtml ? `<div class="st-rh-note-box"><strong>DC 说明：</strong>${e.dcReasonHtml}</div>` : ""}
       </div>`)].filter(Boolean).join("");
  return op("st-rh-card-switch-settlement st-rh-card-switch-result", bi(Wn(gS, {
    shell_type_class: "st-rh-settlement-shell-result",
    dice_slot_type_class: "st-rh-summary-dice-slot-result",
    details_layout_type_class: "st-rh-details-layout-result",
    summary_kicker_text: "检定结果",
    title_html: e.titleHtml,
    roll_id_html: e.rollIdHtml,
    summary_status_badge_html: t,
    summary_primary_chips_html: n,
    summary_secondary_chips_html: o,
    summary_dice_visual_html: Nd(e.collapsedDiceVisualHtml, "ROLL"),
    summary_toggle_html: xi(),
    details_id_attr: vi(e.detailsIdAttr, "desktop"),
    details_kicker_text: "结果档案",
    details_heading_html: e.titleHtml,
    details_status_badge_html: r,
    detail_meta_html: i,
    outcome_section_html: c,
    footer_blocks_html: "",
    summary_result_core_html: u,
    detail_result_core_html: h,
    detail_aux_html: f
  }), e.detailsIdAttr, "desktop"), bi(Wn(vS, {
    shell_type_class: "st-rh-settlement-shell-result",
    dice_slot_type_class: "st-rh-summary-dice-slot-result",
    details_layout_type_class: "st-rh-details-layout-result",
    summary_kicker_text: "检定结果",
    title_html: e.titleHtml,
    roll_id_html: e.rollIdHtml,
    summary_status_badge_html: t,
    summary_primary_chips_html: n,
    summary_secondary_chips_html: o,
    summary_dice_visual_html: Nd(e.collapsedDiceVisualHtml, "ROLL"),
    summary_toggle_html: xi(),
    details_id_attr: vi(e.detailsIdAttr, "mobile"),
    details_kicker_text: "结果档案",
    details_heading_html: e.titleHtml,
    details_status_badge_html: r,
    detail_meta_html: i,
    outcome_section_html: c,
    footer_blocks_html: "",
    summary_result_core_html: u,
    detail_result_core_html: h,
    detail_aux_html: f
  }), e.detailsIdAttr, "mobile"));
}
function Md(e) {
  const t = Math.max(0, Math.ceil(e / 1e3)), r = Math.floor(t / 3600), n = Math.floor(t % 3600 / 60), o = t % 60;
  return r > 0 ? `${String(r).padStart(2, "0")}:${String(n).padStart(2, "0")}:${String(o).padStart(2, "0")}` : `${String(n).padStart(2, "0")}:${String(o).padStart(2, "0")}`;
}
function OS(e, t, r, n = Date.now()) {
  const o = r.getSettingsEvent(), i = r.getLatestRollRecordForEvent(e, t.id);
  if (i)
    return i.source === "timeout_auto_fail" ? {
      text: "已超时失败",
      tone: "danger",
      locked: !0
    } : i.success === !1 ? {
      text: "已结算(失败)",
      tone: "danger",
      locked: !0
    } : {
      text: "已结算",
      tone: "success",
      locked: !0
    };
  if (!o.enableTimeLimit) return {
    text: "时限关闭",
    tone: "neutral",
    locked: !1
  };
  r.ensureRoundEventTimersSyncedEvent(e);
  const c = e.eventTimers[t.id];
  if (!c || c.deadlineAt == null) return {
    text: "不限时",
    tone: "neutral",
    locked: !1
  };
  const u = c.deadlineAt - n;
  return u <= 0 ? {
    text: "已超时",
    tone: "danger",
    locked: !0
  } : u <= 1e4 ? {
    text: `剩余 ${Md(u)}`,
    tone: "warn",
    locked: !1
  } : {
    text: `剩余 ${Md(u)}`,
    tone: "neutral",
    locked: !1
  };
}
function ap(e) {
  switch (e) {
    case "warn":
      return {
        border: "1px solid rgba(255,196,87,0.55)",
        background: "rgba(71,47,14,0.45)",
        color: "#ffd987"
      };
    case "danger":
      return {
        border: "1px solid rgba(255,120,120,0.55)",
        background: "rgba(80,20,20,0.45)",
        color: "#ffb6b6"
      };
    case "success":
      return {
        border: "1px solid rgba(136,255,173,0.55)",
        background: "rgba(18,54,36,0.45)",
        color: "#bfffd1"
      };
    default:
      return {
        border: "1px solid rgba(173,201,255,0.45)",
        background: "rgba(20,36,62,0.45)",
        color: "#d1e6ff"
      };
  }
}
function ip(e, t, r, n, o) {
  const i = [], c = String(e ?? "").trim(), u = Number.isFinite(t) && t !== 0;
  return r && c && i.push(`<span class="st-rh-dc-note-copy">${n(c)}</span>`), u && i.push(`<span class="st-rh-inline-chip st-rh-chip-strong st-rh-dc-modifier-chip"><span class="st-rh-dc-modifier-label">DC修正</span><span class="st-rh-dc-modifier-value">${n(o(t))}</span></span>`), i.length === 0 ? "" : `<span class="st-rh-dc-note-stack">${i.join("")}</span>`;
}
function PS(e, t, r) {
  const n = Array.from(document.querySelectorAll("button[data-dice-event-roll='1']"));
  for (const o of n) {
    const i = o.getAttribute("data-round-id") || "", c = o.getAttribute("data-dice-event-id") || "";
    i !== e || c !== t || (o.disabled = r, o.style.display = r ? "none" : "inline-block", o.style.opacity = r ? "0.5" : "1", o.style.cursor = r ? "not-allowed" : "pointer", o.style.filter = r ? "grayscale(0.35)" : "");
  }
}
function BS(e) {
  const t = Array.from(document.querySelectorAll("[data-dice-countdown='1']")), r = Array.from(document.querySelectorAll("button[data-dice-event-roll='1']"));
  if (t.length === 0 && r.length === 0) return;
  const n = e.getDiceMetaEvent().pendingRound;
  if (!n || n.status !== "open") {
    for (const i of r)
      i.disabled = !0, i.style.display = "none", i.style.opacity = "0.5", i.style.cursor = "not-allowed", i.style.filter = "grayscale(0.35)";
    return;
  }
  e.ensureRoundEventTimersSyncedEvent(n);
  const o = Date.now();
  for (const i of t) {
    const c = i.getAttribute("data-round-id") || "", u = i.getAttribute("data-event-id") || "";
    if (!c || !u || c !== n.roundId) continue;
    const h = n.events.find((x) => x.id === u);
    if (!h) continue;
    const f = e.getEventRuntimeViewStateEvent(n, h, o), v = e.getRuntimeToneStyleEvent(f.tone);
    i.textContent = `⏱ ${f.text}`, i.style.border = v.border, i.style.background = v.background, i.style.color = v.color, PS(n.roundId, h.id, f.locked);
  }
}
function lp() {
  try {
    const e = Array.from(document.querySelectorAll("pre"));
    for (const t of e) {
      if (t.classList.contains("language-rolljson") || t.querySelector(".language-rolljson") || t.querySelector("code.language-rolljson")) {
        t.remove();
        continue;
      }
      const r = (t.textContent || "").trim(), n = (t.innerHTML || "").trim();
      if (!r && !n) continue;
      const o = r.includes("dice_events") && r.includes('"events"') && r.includes('"type"'), i = n.includes("rolljson") || r.includes("rolljson"), c = n.includes("ROLLHELPER_SUMMARY_START");
      !o && !i && !c || t.remove();
    }
  } catch (e) {
    de.warn("隐藏事件代码块失败", e);
  }
}
function US(e, t, r) {
  if (!t.enableOutcomeBranches || !t.showOutcomePreviewInListCard) return "";
  const n = e.outcomes;
  if (!n || !(n.success?.trim() || n.failure?.trim() || n.explode?.trim())) return "";
  const o = n.success?.trim() || "", i = n.failure?.trim() || "", c = n.explode?.trim() || "", u = nn(o) || "未设置", h = nn(i) || "未设置", f = t.enableExplodeOutcomeBranch ? nn(c) || "未设置" : "已关闭", v = t.enableStatusSystem ? Xs(o, e.skill) : "", x = t.enableStatusSystem ? Xs(i, e.skill) : "", y = t.enableStatusSystem && t.enableExplodeOutcomeBranch ? Xs(c, e.skill) : "", S = (_, P, L, M, B = !1) => {
    const C = {
      success: {
        badgeBg: "rgba(82,196,26,0.15)",
        badgeBorder: "rgba(82,196,26,0.4)",
        badgeColor: "#73d13d",
        summaryBg: "rgba(57,168,40,0.10)",
        summaryBorder: "rgba(82,196,26,0.24)",
        summaryColor: "#b7ef8f",
        icon: "fa-solid fa-check-circle"
      },
      failure: {
        badgeBg: "rgba(255,77,79,0.15)",
        badgeBorder: "rgba(255,77,79,0.4)",
        badgeColor: "#ff7875",
        summaryBg: "rgba(171,54,57,0.12)",
        summaryBorder: "rgba(255,120,120,0.22)",
        summaryColor: "#ffb3b3",
        icon: "fa-solid fa-xmark-circle"
      },
      explode: {
        badgeBg: "rgba(250,173,20,0.15)",
        badgeBorder: "rgba(250,173,20,0.4)",
        badgeColor: "#ffc53d",
        summaryBg: "rgba(173,113,20,0.12)",
        summaryBorder: "rgba(250,173,20,0.22)",
        summaryColor: "#ffd98a",
        icon: "fa-solid fa-star"
      }
    }[_], G = M ? r(M) : "";
    return `
      <div class="st-rh-outcome-preview-row st-rh-outcome-${_}"${B ? ' style="margin-bottom:0;"' : ""}>
        <span class="st-rh-outcome-preview-badge" style="background:${C.badgeBg}; border-color:${C.badgeBorder}; color:${C.badgeColor};">
          <i class="${C.icon} fa-fw st-rh-fa-icon" aria-hidden="true" style="margin-right:4px;"></i>${P}
        </span>
        <div class="st-rh-outcome-preview-content">
          <span class="st-rh-outcome-preview-text">${r(L)}</span>
          ${G ? `<div class="st-rh-outcome-preview-status" style="border-color:${C.summaryBorder}; background:${C.summaryBg};">
                 <span class="st-rh-outcome-preview-status-label" style="color:${C.summaryColor};">状态</span>
                 <span class="st-rh-outcome-preview-status-text">${G}</span>
               </div>` : ""}
        </div>
      </div>
    `;
  };
  return `
    <div class="st-rh-outcome-preview-wrap">
      <div class="st-rh-outcome-preview-header">
        <div class="st-rh-outcome-preview-header-line"></div>
        <span class="st-rh-outcome-preview-header-title">
          <i class="fa-solid fa-scroll fa-fw st-rh-fa-icon" aria-hidden="true" style="margin-right: 6px; font-size: 0.9em; opacity: 0.9;"></i>走向预览
        </span>
        <div class="st-rh-outcome-preview-header-line right"></div>
      </div>
      ${S("success", "成功", u, v)}
      ${S("failure", "失败", h, x)}
      ${S("explode", "爆骰", f, y, !0)}
    </div>
  `;
}
function KS(e) {
  return e === "explode" ? "爆骰走向" : e === "success" ? "成功走向" : e === "failure" ? "失败走向" : "剧情走向";
}
function cp(e) {
  return e === "advantage" ? "优势" : e === "disadvantage" ? "劣势" : "正常";
}
function yi(e) {
  const t = String(e ?? "").trim().toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  return t ? t.slice(0, 64) : `id-${Math.abs(Array.from(String(e ?? "id")).reduce((r, n) => r * 31 + n.charCodeAt(0) | 0, 7))}`;
}
function HS(e, t) {
  const r = t.getSettingsEvent(), n = Cr(t.getDiceMetaEvent());
  t.ensureRoundEventTimersSyncedEvent(e);
  const o = (u) => e.events.map((h) => {
    const f = h.compare ?? ">=", v = t.getLatestRollRecordForEvent(e, h.id), x = t.getEventRuntimeViewStateEvent(e, h, Date.now()), y = t.getRuntimeToneStyleEvent(x.tone), S = t.escapeAttrEvent(`st-rh-event-${yi(e.roundId)}-${yi(h.id)}-details`), _ = t.buildEventRolledPrefixTemplateEvent(v?.source === "timeout_auto_fail"), P = v ? t.buildEventRolledBlockTemplateEvent(_, t.escapeHtmlEvent(t.formatRollRecordSummaryEvent(v, h))) : "", L = US(h, r, t.escapeHtmlEvent), M = typeof h.deadlineAt == "number" && Number.isFinite(h.deadlineAt) ? String(h.deadlineAt) : "", B = x.locked ? "disabled" : "", C = x.locked ? "opacity:0.4;cursor:not-allowed;filter:grayscale(1);" : "cursor:pointer;", G = !x.locked && !v;
    r.enableTimeLimit && h.timeLimit && h.timeLimit;
    const F = r.enableTimeLimit ? Mo(h.timeLimit ?? "无") : "关闭", Z = r.enableStatusSystem ? _l(n, h.skill) : {
      modifier: 0,
      matched: []
    }, H = v ? Number.isFinite(Number(v.baseModifierUsed)) ? Number(v.baseModifierUsed) : 0 : (() => {
      try {
        return t.parseDiceExpression(h.checkDice).modifier;
      } catch {
        return 0;
      }
    })(), X = v ? Number.isFinite(Number(v.skillModifierApplied)) ? Number(v.skillModifierApplied) : 0 : t.resolveSkillModifierBySkillNameEvent(h.skill, r), K = v ? Number.isFinite(Number(v.statusModifierApplied)) ? Number(v.statusModifierApplied) : 0 : Z.modifier, z = v ? Array.isArray(v.statusModifiersApplied) ? v.statusModifiersApplied : [] : Z.matched, se = v && Number.isFinite(Number(v.finalModifierUsed)) ? Number(v.finalModifierUsed) : H + X + K, ie = H !== 0 || X !== 0 || K !== 0 ? `${t.formatModifier(H)} + 技能 ${t.formatModifier(X)} + 状态 ${t.formatModifier(K)} = ${t.formatModifier(se)}` : "", ue = r.enableSkillSystem ? `技能修正：${t.formatModifier(X)}${K !== 0 ? `；状态 ${t.formatModifier(K)}${z.length > 0 ? `（${z.map((Fe) => `${Fe.name}${t.formatModifier(Fe.modifier)}`).join("，")}）` : ""}` : ""}${ie ? `（${ie}）` : ""}` : "技能系统已关闭", Ae = dp(H, X, K, se, h.skill, z, t.escapeHtmlEvent, t.escapeAttrEvent), le = ip(h.dcReason, se, r.enableDynamicDcReason, t.escapeHtmlEvent, t.formatModifier), be = cp(v?.advantageStateApplied ?? h.advantageState), we = G ? h.rollMode === "auto" ? '<span class="st-rh-summary-lock st-rh-mono" style="color: #d1b67f; border: 1px dashed rgba(209,182,127,0.3);"><i class="fa-solid fa-hourglass-half fa-fw st-rh-fa-icon" style="margin-right:6px;"></i>等待自动触发</span>' : t.buildEventRollButtonTemplateEvent({
      roundIdAttr: t.escapeAttrEvent(e.roundId),
      eventIdAttr: t.escapeAttrEvent(h.id),
      diceExprAttr: t.escapeAttrEvent(h.checkDice),
      buttonDisabledAttr: B,
      buttonStateStyle: C
    }) : "", Pe = h.rollMode === "auto" ? `<span class="st-rh-badge-role st-rh-badge-role-auto">${t.escapeHtmlEvent("自动结算")}</span>` : `<span class="st-rh-badge-role st-rh-badge-role-manual">${t.escapeHtmlEvent("需检定")}</span>`;
    return t.buildEventListItemTemplateEvent({
      detailsIdAttr: S,
      templateVariant: u,
      titleHtml: t.escapeHtmlEvent(h.title),
      rollModeBadgeHtml: Pe,
      eventIdHtml: t.escapeHtmlEvent(h.id),
      collapsedCheckHtml: t.escapeHtmlEvent(`${h.checkDice} ${f} ${String(h.dc)}`),
      collapsedRuntimeHtml: t.escapeHtmlEvent(x.text),
      descHtml: t.escapeHtmlEvent(h.desc),
      targetHtml: t.escapeHtmlEvent(h.targetLabel),
      skillHtml: t.escapeHtmlEvent(h.skill),
      skillTitleAttr: t.escapeAttrEvent(ue),
      advantageStateHtml: t.escapeHtmlEvent(be),
      modifierTextHtml: Ae,
      checkDiceHtml: t.escapeHtmlEvent(h.checkDice),
      compareHtml: t.escapeHtmlEvent(f),
      dcText: String(h.dc),
      dcReasonHtml: le,
      timeLimitHtml: t.escapeHtmlEvent(F),
      roundIdAttr: t.escapeAttrEvent(e.roundId),
      eventIdAttr: t.escapeAttrEvent(h.id),
      deadlineAttr: t.escapeAttrEvent(M),
      runtimeStyleAttr: `style="border:${y.border};background:${y.background};color:${y.color};"`,
      runtimeTextHtml: t.escapeHtmlEvent(x.text),
      rolledBlockHtml: P,
      outcomePreviewHtml: L,
      commandTextHtml: `/eventroll roll ${t.escapeHtmlEvent(h.id)}`,
      rollButtonHtml: we
    });
  }).join(""), i = o("desktop"), c = o("mobile");
  return t.buildEventListCardTemplateEvent(t.escapeHtmlEvent(e.roundId), i, c);
}
function Od(e) {
  return e.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;").replace(/`/g, "&#96;");
}
function lt(e) {
  return e > 0 ? `+${e}` : String(e);
}
function GS(e, t) {
  if (e === "all") return "全局";
  const r = Array.isArray(t) ? t.filter((n) => String(n || "").trim()) : [];
  return r.length <= 0 ? "当前技能" : r.join(" / ");
}
function Xs(e, t) {
  const r = Pm(e, t);
  if (!Array.isArray(r.commands) || r.commands.length <= 0) return "";
  const n = r.commands.filter((u) => u.kind === "apply").map((u) => `获得「${u.name}」${lt(u.modifier)}（${GS(u.scope, u.skills)}，${hn(u.durationRounds)}）`), o = r.commands.filter((u) => u.kind === "remove").map((u) => `移除「${u.name}」`), i = r.commands.some((u) => u.kind === "clear"), c = [...n, ...o];
  return i && c.push("清空全部状态"), c.join("；");
}
function zS(e) {
  const t = Array.isArray(e) ? e.filter((r) => r?.enabled !== !1) : [];
  return t.length <= 0 ? "无" : t.map((r) => {
    const n = lt(Number(r.modifier) || 0), o = r.scope === "all" ? "全局" : Array.isArray(r.skills) && r.skills.length > 0 ? r.skills.join(" / ") : "当前技能", i = hn(r.remainingRounds);
    return `${r.name}${n}（${o}，${i}）`;
  }).join("；");
}
function jS(e, t) {
  const r = `${String(e ?? "").trim() || "剧情走向"}：${String(t ?? "").replace(/\s+/g, " ").trim() || "未设置"}`;
  return {
    text: r,
    title: r,
    chipClassName: "st-rh-summary-chip-outcome"
  };
}
function qS(e) {
  const t = String(e ?? "").replace(/\s+/g, " ").trim();
  return t ? {
    text: `获得状态：${t}`,
    title: `获得状态：${t}`,
    chipClassName: "st-rh-summary-chip-status-summary"
  } : {
    text: "",
    title: "",
    chipClassName: "st-rh-summary-chip-status-summary"
  };
}
function FS(e, t, r, n) {
  const o = Array.isArray(e.rolls) && e.rolls.length > 0 ? `[${e.rolls.join(", ")}]` : "[]", i = Number.isFinite(Number(e.rawTotal)) ? Number(e.rawTotal) : 0, c = Number.isFinite(Number(e.total)) ? Number(e.total) : i, u = Number.isFinite(Number(r)), h = Number.isFinite(Number(t)) ? Number(t) : Number(e.modifier) || 0, f = u ? Number(r) : 0, v = Number.isFinite(Number(n)) ? Number(n) : u ? h + f : Number(e.modifier) || 0, x = [];
  return x.push(`骰面 ${o}`), x.push(`原始值 ${i}`), u ? (x.push(`基础修正 ${lt(h)}`), x.push(`技能修正 ${lt(f)}`), x.push(`最终修正 ${lt(v)}`)) : x.push(`修正 ${lt(Number(e.modifier) || 0)}`), x.push(`总计 ${c}`), e.exploding && x.push(e.explosionTriggered ? "爆骰已触发" : "爆骰已启用"), x.join(" | ");
}
function Us(e, t, r, n, o) {
  const i = String(e ?? ""), c = lt(t), u = i ? `${n(i)} ` : "";
  return `<span class="st-rh-inline-tip-segment" data-tip="${o(r)}">${u}<span class="st-rh-mono">${n(c)}</span></span>`;
}
function dp(e, t, r, n, o, i, c, u) {
  if (e === 0 && t === 0 && r === 0) return "";
  const h = Array.isArray(i) && i.length > 0 ? `当前命中的状态：${i.map((f) => `${String(f.name ?? "").trim() || "未命名状态"}${lt(Number(f.modifier) || 0)}`).join("、")}。` : "当前没有命中的状态修正。";
  return `${Us("", e, `基础修正：来自骰式本身的固定修正值。当前值 ${lt(e)}。`, c, u)} + ${Us("技能", t, `技能修正：来自技能「${String(o ?? "").trim() || "未指定"}」。当前值 ${lt(t)}。`, c, u)} + ${Us("状态", r, `状态修正：由当前生效状态提供。当前值 ${lt(r)}。${h}`, c, u)} = ${Us("", n, `最终修正：基础修正 + 技能修正 + 状态修正。当前值 ${lt(n)}。`, c, u)}`;
}
function up(e, t, r) {
  const n = Math.max(40, Math.floor(r));
  return `
    <svg width="${n}" height="${n}" viewBox="0 0 48 48" style="display:inline-block; vertical-align: middle;">
      <rect x="4" y="4" width="40" height="40" rx="8" ry="8" fill="none" stroke="${t}" stroke-width="3" />
      <text x="24" y="31" font-size="${Math.max(14, Math.round(n * 0.34))}" text-anchor="middle" fill="${t}" font-weight="bold" style="font-family: monospace;">${e}</text>
    </svg>
  `;
}
function VS(e, t, r = !1, n = "") {
  if (!e || !Array.isArray(e.rolls) || e.rolls.length === 0) return "";
  const o = "d" + Math.random().toString(36).substr(2, 9);
  let i = "normal", c = "", u = "#ffdb78";
  if (e.count === 1) {
    const P = e.rolls[0];
    P === e.sides ? (i = "success", c = "大成功！", u = "#52c41a") : P === 1 && (i = "fail", c = "大失败！", u = "#ff4d4f");
  }
  const h = r ? 62 : 68, f = r ? 52 : 58, v = String(n || "").trim(), x = up(Number.isFinite(Number(e.total)) ? Number(e.total) : 0, u, h), y = v ? `<span style="display:inline-flex;cursor:help;" data-tip="${Od(`${v}`)}">${x}</span>` : x, S = t.getRollingSvg("#ffdb78", f), _ = t.buildAlreadyRolledDiceVisualTemplateEvent({
    uniqueId: o,
    rollingVisualHtml: S,
    diceVisualsHtml: y,
    critType: i,
    critText: c,
    compactMode: r
  });
  return v ? `<div style="display:inline-flex;align-items:center;justify-content:center;cursor:help;" data-tip="${Od(v)}">${_}</div>` : _;
}
function YS(e, t, r) {
  const n = r.getSettingsEvent(), o = r.resolveTriggeredOutcomeEvent(e, t, n), i = n.enableOutcomeBranches ? KS(o.kind) : "剧情走向", c = n.enableOutcomeBranches ? `st-rh-outcome-tone-${o.kind}` : "st-rh-outcome-tone-neutral", u = n.enableOutcomeBranches ? o.text : "走向分支已关闭。", h = nn(u), f = jS(i, h), v = n.enableStatusSystem ? Xs(u, e.skill) : "", x = qS(v), y = n.enableStatusSystem ? zS(Cr(r.getDiceMetaEvent())) : "", S = t.success === null ? "待定" : t.success ? "判定成功" : "判定失败", _ = t.success === null ? "#ffdb78" : t.success ? "#52c41a" : "#ff4d4f", P = t.source === "timeout_auto_fail" ? "超时检定" : t.source === "ai_auto_roll" ? "自动检定" : "手动检定", L = Number.isFinite(Number(t.baseModifierUsed)) ? Number(t.baseModifierUsed) : Number(t.result.modifier) || 0, M = Number.isFinite(Number(t.skillModifierApplied)) ? Number(t.skillModifierApplied) : 0, B = Number.isFinite(Number(t.statusModifierApplied)) ? Number(t.statusModifierApplied) : 0, C = Number.isFinite(Number(t.finalModifierUsed)) ? Number(t.finalModifierUsed) : L + M + B, G = FS(t.result, L, M, C), F = t.source === "timeout_auto_fail" ? "" : VS(t.result, {
    getDiceSvg: r.getDiceSvg,
    getRollingSvg: r.getRollingSvg,
    buildAlreadyRolledDiceVisualTemplateEvent: r.buildAlreadyRolledDiceVisualTemplateEvent
  }, !1, G), Z = L !== 0 || M !== 0 || B !== 0 ? `${r.formatModifier(L)} + 技能 ${r.formatModifier(M)} + 状态 ${r.formatModifier(B)} = ${r.formatModifier(C)}` : "", H = n.enableSkillSystem ? `技能修正：${r.formatModifier(M)}；状态 ${r.formatModifier(B)}${Z ? `（${Z}）` : ""}` : "技能系统已关闭", X = n.enableSkillSystem && (M !== 0 || B !== 0) ? `技能${r.formatModifier(M)} / 状态${r.formatModifier(B)}` : "";
  let K = "未请求爆骰";
  const z = dp(L, M, B, C, e.skill, Array.isArray(t.statusModifiersApplied) ? t.statusModifiersApplied : [], r.escapeHtmlEvent, r.escapeAttrEvent);
  t.explodePolicyApplied === "disabled_globally" ? K = "已请求，系统关闭，按普通骰" : t.explodePolicyApplied === "downgraded_by_ai_limit" ? K = "已请求，超出本轮 AI 上限，按普通骰" : (t.explodePolicyApplied === "enabled" || t.result.exploding) && (K = t.result.explosionTriggered ? "已请求，已触发连爆" : "已请求，未触发连爆");
  const se = B !== 0 ? `受状态影响 ${r.formatModifier(B)}${Array.isArray(t.statusModifiersApplied) && t.statusModifiersApplied.length > 0 ? `（${t.statusModifiersApplied.map((we) => `${we.name}${r.formatModifier(we.modifier)}`).join("，")}）` : ""}` : "", ie = ip(e.dcReason, C, n.enableDynamicDcReason, r.escapeHtmlEvent, r.formatModifier), ue = r.escapeAttrEvent(`st-rh-result-${yi(t.rollId)}-details`), Ae = `${t.compareUsed} ${String(t.dcUsed ?? "未设置")}`, le = t.source === "timeout_auto_fail" ? "" : up(Number.isFinite(Number(t.result.total)) ? Number(t.result.total) : 0, _, 48), be = Mo(e.timeLimit ?? "无");
  return r.buildEventRollResultCardTemplateEvent({
    detailsIdAttr: ue,
    collapsedStatusHtml: r.escapeHtmlEvent(S),
    collapsedConditionHtml: r.escapeHtmlEvent(Ae),
    collapsedSourceHtml: r.escapeHtmlEvent(P),
    collapsedTotalHtml: r.escapeHtmlEvent(String(t.result.total)),
    collapsedOutcomeHtml: r.escapeHtmlEvent(f.text),
    collapsedOutcomeTitleAttr: r.escapeAttrEvent(f.title),
    collapsedOutcomeChipClassName: f.chipClassName,
    collapsedStatusSummaryHtml: r.escapeHtmlEvent(x.text),
    collapsedStatusSummaryTitleAttr: r.escapeAttrEvent(x.title),
    collapsedStatusSummaryChipClassName: x.chipClassName,
    collapsedDiceVisualHtml: le,
    rollIdHtml: r.escapeHtmlEvent(t.rollId),
    titleHtml: r.escapeHtmlEvent(e.title),
    eventIdHtml: r.escapeHtmlEvent(e.id),
    sourceHtml: r.escapeHtmlEvent(P),
    targetHtml: r.escapeHtmlEvent(t.targetLabelUsed || e.targetLabel),
    skillHtml: r.escapeHtmlEvent(e.skill),
    skillTitleAttr: r.escapeAttrEvent(H),
    advantageStateHtml: r.escapeHtmlEvent(cp(t.advantageStateApplied ?? e.advantageState)),
    diceExprHtml: r.escapeHtmlEvent(t.diceExpr),
    diceModifierHintHtml: r.escapeHtmlEvent(X),
    rollsSummaryHtml: r.buildRollsSummaryTemplateEvent(r.escapeHtmlEvent(t.result.rolls.join(", ")), r.escapeHtmlEvent(r.formatModifier(t.result.modifier))),
    explodeInfoHtml: r.escapeHtmlEvent(K),
    modifierBreakdownHtml: z,
    compareHtml: r.escapeHtmlEvent(t.compareUsed),
    dcText: String(t.dcUsed ?? "未设置"),
    dcReasonHtml: ie,
    statusText: S,
    statusColor: _,
    totalText: String(t.result.total),
    timeLimitHtml: r.escapeHtmlEvent(be),
    diceVisualBlockHtml: F,
    outcomeLabelHtml: r.escapeHtmlEvent(i),
    outcomeToneClassName: c,
    outcomeTextHtml: r.escapeHtmlEvent(h),
    statusImpactHtml: r.escapeHtmlEvent(se),
    outcomeStatusSummaryHtml: r.escapeHtmlEvent(v),
    currentStatusesHtml: r.escapeHtmlEvent(y)
  });
}
var WS = {
  getSettingsEvent: Ee,
  getDiceMetaEvent: Ce,
  ensureRoundEventTimersSyncedEvent: er,
  getLatestRollRecordForEvent: Zt,
  getEventRuntimeViewStateEvent: jl,
  getRuntimeToneStyleEvent: ap,
  buildEventRolledPrefixTemplateEvent: AS,
  buildEventRolledBlockTemplateEvent: IS,
  formatRollRecordSummaryEvent: Qy,
  parseDiceExpression: Qt,
  resolveSkillModifierBySkillNameEvent: Ko,
  formatEventModifierBreakdownEvent: fl,
  formatModifier: wt,
  buildEventRollButtonTemplateEvent: $S,
  buildEventListItemTemplateEvent: RS,
  buildEventListCardTemplateEvent: CS,
  escapeHtmlEvent: un,
  escapeAttrEvent: gl
};
function jl(e, t, r = Date.now()) {
  return OS(e, t, {
    getSettingsEvent: Ee,
    getLatestRollRecordForEvent: Zt,
    ensureRoundEventTimersSyncedEvent: er
  }, r);
}
function XS(e) {
  return zl(), HS(e, { ...WS });
}
function mp(e, t) {
  return zl(), YS(e, t, {
    getSettingsEvent: Ee,
    getDiceMetaEvent: Ce,
    resolveTriggeredOutcomeEvent: Hl,
    formatEventModifierBreakdownEvent: fl,
    buildRollsSummaryTemplateEvent: LS,
    formatModifier: wt,
    buildEventRollResultCardTemplateEvent: MS,
    escapeHtmlEvent: un,
    escapeAttrEvent: gl,
    getDiceSvg: fi,
    getRollingSvg: Dh,
    buildAlreadyRolledDiceVisualTemplateEvent: Ix
  });
}
function os() {
  BS({
    getDiceMetaEvent: Ce,
    ensureRoundEventTimersSyncedEvent: er,
    getEventRuntimeViewStateEvent: jl,
    getRuntimeToneStyleEvent: ap
  });
}
var Si = "st-rh-widget-container", Pd = "data-rh-widget";
function Ei(e, t) {
  if (!e || !Array.isArray(t)) return null;
  const r = document.getElementById("chat");
  if (!r) return null;
  const n = e.split(":");
  if (n.length < 3) return null;
  const o = n[0], i = n[1];
  if (o === "assistant" && i) for (let c = t.length - 1; c >= 0; c -= 1) {
    const u = t[c], h = u?.id ?? u?.cid ?? u?.uid;
    if (h != null && String(h) === i) {
      const f = r.querySelector(`.mes[mesid="${c}"]`);
      if (f) return f;
    }
  }
  if (o === "assistant_idx" && i) {
    const c = Number(i);
    if (Number.isFinite(c) && c >= 0 && c < t.length) return r.querySelector(`.mes[mesid="${c}"]`);
  }
  return null;
}
function _i(e, t, r) {
  if (!e || !r) return;
  let n = e.querySelector(`.${Si}[${Pd}="${r}"]`);
  if (!n) {
    n = document.createElement("div"), n.className = Si, n.setAttribute(Pd, r);
    const o = e.querySelector(".mes_block");
    o ? o.appendChild(n) : e.appendChild(n);
  }
  n.innerHTML = t;
}
function JS() {
  const e = Array.from(document.querySelectorAll(`.${Si}`));
  for (const t of e) t.remove();
}
function QS(e, t) {
  if (!e.rollsSnapshot || !e.rollId) return null;
  const r = e.rollsSnapshot, n = {
    id: e.id,
    title: e.title,
    checkDice: e.checkDice,
    dc: e.dc,
    compare: e.compare,
    skill: e.skill,
    targetType: "self",
    targetLabel: e.targetLabel,
    desc: e.desc,
    dcReason: e.dcReason,
    rollMode: e.rollMode,
    advantageState: e.advantageState,
    timeLimit: e.timeLimit,
    outcomes: e.outcomeKind !== "none" ? { [e.outcomeKind]: e.outcomeText } : void 0,
    sourceAssistantMsgId: e.sourceAssistantMsgId
  }, o = {
    expr: e.checkDice,
    rolls: r.rolls,
    modifier: r.modifier,
    rawTotal: r.rawTotal,
    total: r.total,
    count: r.count,
    sides: r.sides,
    selectionMode: "none",
    exploding: r.exploding,
    explosionTriggered: r.explosionTriggered
  };
  return {
    event: n,
    record: {
      rollId: e.rollId,
      roundId: t,
      eventId: e.id,
      eventTitle: e.title,
      diceExpr: e.checkDice,
      result: o,
      success: e.success,
      compareUsed: e.compare,
      dcUsed: e.dc,
      advantageStateApplied: e.advantageState,
      resultGrade: e.resultGrade ?? void 0,
      marginToDc: e.marginToDc,
      skillModifierApplied: e.skillModifierApplied,
      statusModifierApplied: e.statusModifierApplied,
      statusModifiersApplied: e.statusModifiersApplied,
      baseModifierUsed: e.baseModifierUsed,
      finalModifierUsed: e.finalModifierUsed,
      targetLabelUsed: e.targetLabelUsed ?? e.targetLabel,
      rolledAt: e.rolledAt ?? 0,
      source: e.resultSource ?? "manual_roll",
      explodePolicyApplied: e.explodePolicyApplied ?? "not_requested",
      sourceAssistantMsgId: e.sourceAssistantMsgId
    }
  };
}
function ZS(e, t, r) {
  let n = 0;
  const o = e.sourceAssistantMsgIds.length > 0 ? e.sourceAssistantMsgIds[e.sourceAssistantMsgIds.length - 1] : void 0, i = /* @__PURE__ */ new Map();
  for (const c of e.events) {
    const u = c.sourceAssistantMsgId || o || "";
    if (!u) continue;
    let h = i.get(u);
    h || (h = {
      events: [],
      records: []
    }, i.set(u, h)), h.events.push(c);
    const f = r.getLatestRollRecordForEvent(e, c.id);
    f && h.records.push(f);
  }
  for (const [c, u] of i) {
    if (u.records.length <= 0 && c !== o) continue;
    const h = Ei(c, t);
    if (!h) continue;
    const f = [];
    c === o && f.push(r.buildEventListCardEvent(e));
    for (const v of u.events) {
      const x = r.getLatestRollRecordForEvent(e, v.id);
      x && f.push(r.buildEventRollResultCardEvent(v, x));
    }
    f.length > 0 && (_i(h, f.join(""), `round-${e.roundId}-floor-${c}`), n += 1);
  }
  if (n <= 0 && o) {
    const c = Ei(o, t);
    c && (_i(c, r.buildEventListCardEvent(e), `round-${e.roundId}-floor-${o}`), n += 1);
  }
  return {
    mountedCount: n,
    anyMounted: n > 0
  };
}
function eE(e, t, r) {
  let n = 0;
  const o = /* @__PURE__ */ new Map();
  for (const i of e.events) {
    if (i.status === "pending" || !i.sourceAssistantMsgId) continue;
    const c = QS(i, e.roundId);
    if (!c) continue;
    const u = i.sourceAssistantMsgId;
    let h = o.get(u);
    h || (h = [], o.set(u, h)), h.push(c);
  }
  for (const [i, c] of o) {
    if (c.length <= 0) continue;
    const u = Ei(i, t);
    if (!u) continue;
    const h = [];
    for (const { event: f, record: v } of c) h.push(r.buildEventRollResultCardEvent(f, v));
    h.length > 0 && (_i(u, h.join(""), `history-${e.roundId}-floor-${i}`), n += 1);
  }
  return n;
}
function tE(e, t) {
  return !e || !Array.isArray(t) || t.length === 0 ? !1 : t.some((r) => String(r?.roundId ?? "") === String(e.roundId ?? ""));
}
function rE(e) {
  JS();
  const t = {
    mountedWidgetCount: 0,
    hasPendingRound: !1,
    pendingRoundMounted: !1,
    chatDomReady: !!document.getElementById("chat")
  }, r = e.getLiveContextEvent()?.chat, n = e.getDiceMetaEvent(), o = !!n.pendingRound && n.pendingRound.events.length > 0 && !tE(n.pendingRound, n.summaryHistory);
  if (o && (t.hasPendingRound = !0), !Array.isArray(r))
    return de.warn("[卡片恢复] 当前 liveContext.chat 不可用，跳过挂载"), t;
  if (o && n.pendingRound) {
    const i = n.pendingRound, { mountedCount: c, anyMounted: u } = ZS(i, r, e);
    t.mountedWidgetCount += c, t.pendingRoundMounted = u, u || de.warn(`[卡片恢复] 未找到锚点消息 roundId=${i.roundId} sourceMsgIds=${JSON.stringify(i.sourceAssistantMsgIds)}`);
  }
  if (Array.isArray(n.summaryHistory)) for (const i of n.summaryHistory) {
    if (!i.events || i.events.length <= 0) continue;
    const c = eE(i, r, e);
    t.mountedWidgetCount += c;
  }
  return t;
}
function Ti(e = 0, t) {
  const r = t.getSettingsEvent();
  if (!r.enabled) return;
  const n = t.getLiveContextEvent();
  if (!n?.chat || !Array.isArray(n.chat)) return;
  const o = t.findLatestAssistantEvent(n.chat);
  if (!o) return;
  const i = t.getDiceMetaEvent(), c = t.buildAssistantMessageIdEvent(o.msg, o.index);
  if (i.lastProcessedAssistantMsgId === c) return;
  const u = [t.getPreferredAssistantSourceTextEvent(o.msg), t.getMessageTextEvent(o.msg)].filter((L, M, B) => L && B.indexOf(L) === M);
  let h = "", f = [], v = [], x = !1;
  for (const L of u) {
    const M = t.parseEventEnvelopesEvent(L);
    if (M.events.length > 0 || M.ranges.length > 0) {
      h = L, f = M.events, v = M.ranges, x = M.shouldEndRound;
      break;
    }
    h || (h = L, f = M.events, v = M.ranges, x = M.shouldEndRound);
  }
  if (!h.trim()) {
    if (e < 4) {
      setTimeout(() => Ti(e + 1, t), 100 + e * 120);
      return;
    }
    i.lastProcessedAssistantMsgId = c;
    return;
  }
  const y = t.filterEventsByApplyScopeEvent(f, r.eventApplyScope), S = v;
  if (y.length === 0 && S.length === 0) {
    if (e < 4) {
      setTimeout(() => Ti(e + 1, t), 140 + e * 160);
      return;
    }
    i.lastProcessedAssistantMsgId = c;
    return;
  }
  i.lastProcessedAssistantMsgId = c;
  const _ = t.removeRangesEvent(h, S);
  t.setMessageTextEvent(o.msg, _), t.hideEventCodeBlocksInDomEvent(), S.length > 0 && t.persistChatSafeEvent();
  const P = i.pendingRound;
  if (P?.status === "open" && r.enableAiRoundControl && x && (P.status = "closed"), y.length > 0) {
    const L = t.mergeEventsIntoPendingRoundEvent(y, c);
    t.autoRollEventsByAiModeEvent(L), t.sweepTimeoutFailuresEvent(), t.refreshAllWidgetsFromStateEvent(), t.refreshCountdownDomEvent();
  }
  setTimeout(() => {
    t.hideEventCodeBlocksInDomEvent(), t.refreshCountdownDomEvent();
  }, 50);
}
function nE(e, t) {
  for (let r = e.length - 1; r >= 0; r--) if (t.isAssistantMessageEvent(e[r])) return {
    msg: e[r],
    index: r
  };
  return null;
}
function sE(e, t, r) {
  const n = e.id ?? e.cid ?? e.uid, o = r.simpleHashEvent(r.getMessageTextEvent(e));
  return n != null ? `assistant:${String(n)}:${o}` : `assistant_idx:${t}:${o}`;
}
function oE(e, t) {
  const r = [t.getPreferredAssistantSourceTextEvent(e), t.getMessageTextEvent(e)].filter((n, o, i) => n && i.indexOf(n) === o);
  for (const n of r) {
    const { ranges: o } = t.parseEventEnvelopesEvent(n);
    if (o.length === 0) continue;
    const i = t.removeRangesEvent(n, o);
    return t.setMessageTextEvent(e, i), !0;
  }
  return !1;
}
function aE(e) {
  const t = e.getLiveContextEvent();
  if (!t?.chat || !Array.isArray(t.chat)) return;
  let r = !1;
  for (const n of t.chat)
    e.isAssistantMessageEvent(n) && e.sanitizeAssistantMessageEventBlocksEvent(n) && (r = !0);
  r && e.persistChatSafeEvent(), e.hideEventCodeBlocksInDomEvent();
}
function iE(e = "chat_reset", t) {
  const r = t.getDiceMetaEvent();
  if (String(e || "").toLowerCase() !== "chat_reset") {
    delete r.lastProcessedAssistantMsgId;
    return;
  }
  delete r.pendingRound, delete r.outboundSummary, delete r.pendingResultGuidanceQueue, delete r.outboundResultGuidance, delete r.summaryHistory, delete r.lastPromptUserMsgId, delete r.lastProcessedAssistantMsgId, t.saveMetadataSafeEvent();
}
function Js(e) {
  return String(e ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function lE(e) {
  try {
    const t = JSON.parse(String(e ?? "{}"));
    return !t || typeof t != "object" || Array.isArray(t) ? [] : Object.entries(t).map(([r, n]) => ({
      name: String(r ?? "").trim(),
      modifier: Number(n)
    })).filter((r) => r.name && Number.isFinite(r.modifier)).sort((r, n) => Math.abs(n.modifier) - Math.abs(r.modifier) || r.name.localeCompare(n.name, "zh-Hans-CN"));
  } catch {
    return [];
  }
}
var Re = "SSHELPERTOOL", Bd = "st-roll-sshelper-toolbar-style", So = "is-collapsed", Ud = "3", cE = 60, dE = 500, hp = "展开工具栏", uE = "收起工具栏", mE = "技能预览", hE = "状态预览", pp = "展开 SSHELPER 工具栏", pE = "收起 SSHELPER 工具栏", fE = "打开技能预览", gE = "打开状态预览";
function vE() {
  return `
    <div class="st-rh-ss-toolbar-shell" data-sshelper-toolbar-shell="1">
      ${me({
    label: "",
    className: "st-rh-ss-toggle",
    iconClassName: "fa-solid fa-angles-right",
    attributes: {
      "data-sshelper-tool-toggle": "1",
      "data-tip": hp,
      "aria-expanded": "false",
      "aria-label": pp
    }
  })}
      <div class="st-rh-ss-actions" data-sshelper-tool-actions="1">
        ${me({
    label: "",
    className: "st-rh-ss-preview-btn",
    iconClassName: "fa-solid fa-wand-magic-sparkles",
    attributes: {
      "data-event-preview-open": "skills",
      "data-tip": mE,
      "aria-label": fE
    }
  })}
        ${me({
    label: "",
    className: "st-rh-ss-preview-btn",
    iconClassName: "fa-solid fa-heart-pulse",
    attributes: {
      "data-event-preview-open": "statuses",
      "data-tip": hE,
      "aria-label": gE
    }
  })}
      </div>
    </div>
  `;
}
function bE() {
  if (document.getElementById(Bd)) return;
  const e = document.createElement("style");
  e.id = Bd, e.textContent = `
    #${Re} {
      width: auto;
      display: flex;
      align-items: center;
      justify-content: flex-start;
      margin: 0;
      padding: 6px 8px;
      box-sizing: border-box;
      border: 1px solid var(--ss-theme-border, rgba(197, 160, 89, 0.35));
      border-radius: 12px;
      background-color: var(--ss-theme-panel-bg, rgba(20, 16, 14, 0.82));
      backdrop-filter: var(--ss-theme-backdrop-filter, blur(8px));
      box-shadow: 0 8px 18px rgba(0, 0, 0, 0.32);
      pointer-events: auto;
      position: absolute;
      left: 8px;
      bottom: calc(100% + 8px);
      z-index: 45;
      transition:
        background-color 0.22s ease,
        border-color 0.22s ease,
        box-shadow 0.22s ease,
        padding 0.22s ease,
        opacity 0.18s ease;
    }
    #${Re}.${So} {
      padding: 0;
      border-color: transparent;
      background-color: transparent;
      box-shadow: none;
      backdrop-filter: none;
    }
    #${Re} .st-rh-ss-toolbar-shell {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      max-width: min(100%, 480px);
      padding: 2px 0;
    }
    #${Re} .st-rh-ss-toggle {
      width: 28px;
      height: 28px;
      border: 1px solid rgba(197, 160, 89, 0.55);
      border-radius: 8px;
      background: linear-gradient(135deg, #2b1d12, #120d09);
      color: #f1d8a1;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      line-height: 1;
      padding: 0;
      transition: border-color 0.2s ease, filter 0.2s ease;
      flex: 0 0 auto;
    }
    #${Re} .st-rh-ss-toggle:hover {
      border-color: #efd392;
      filter: brightness(1.08);
    }
    #${Re} .st-rh-ss-actions {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      overflow: visible;
      max-width: 360px;
      opacity: 1;
      transform: translateX(0);
      transform-origin: left center;
      transition: max-width 0.24s ease, transform 0.24s ease, opacity 0.18s ease;
      white-space: nowrap;
    }
    #${Re}.${So} .st-rh-ss-actions {
      max-width: 0;
      opacity: 0;
      transform: translateX(-18px);
      pointer-events: none;
      visibility: hidden;
    }
    #${Re} .st-rh-ss-preview-btn {
      border: 1px solid rgba(197, 160, 89, 0.52);
      background: linear-gradient(135deg, rgba(58, 37, 21, 0.92), rgba(22, 14, 10, 0.94));
      color: #f1d8a1;
      border-radius: 8px;
      width: 30px;
      height: 30px;
      padding: 0;
      font-size: 13px;
      letter-spacing: 0.4px;
      font-family: "Noto Serif SC", "STSong", "Georgia", serif;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition: border-color 0.2s ease, filter 0.2s ease;
    }
    #${Re} .st-rh-ss-toggle .stx-shared-button-label,
    #${Re} .st-rh-ss-preview-btn .stx-shared-button-label {
      display: none;
    }
    #${Re} .st-rh-ss-toggle.stx-shared-button,
    #${Re} .st-rh-ss-preview-btn.stx-shared-button {
      gap: 0;
      padding: 0;
    }
    #${Re} .st-rh-ss-preview-btn:hover {
      border-color: #efd392;
      filter: brightness(1.08);
    }
    @media (max-width: 768px) {
      #${Re} {
        left: 6px;
        bottom: calc(100% + 6px);
        padding: 5px 6px;
      }
      #${Re} .st-rh-ss-toolbar-shell {
        max-width: 100%;
      }
      #${Re} .st-rh-ss-preview-btn {
        width: 28px;
        height: 28px;
        font-size: 12px;
      }
    }
    @media (prefers-reduced-motion: reduce) {
      #${Re} .st-rh-ss-actions,
      #${Re} .st-rh-ss-toggle,
      #${Re} .st-rh-ss-preview-btn {
        transition: none;
      }
    }
  `, document.head.appendChild(e);
}
function fp(e, t) {
  e.classList.toggle(So, !t);
  const r = e.querySelector('button[data-sshelper-tool-toggle="1"]');
  if (!r) return;
  r.setAttribute("aria-expanded", t ? "true" : "false"), r.setAttribute("aria-label", t ? pE : pp);
  const n = r.querySelector("i");
  n && (n.className = t ? "fa-solid fa-angles-left" : "fa-solid fa-angles-right"), r.dataset.tip = t ? uE : hp;
}
function xE(e) {
  const t = e.querySelector('[data-sshelper-toolbar-shell="1"]'), r = !!e.querySelector('button[data-event-preview-open="skills"]'), n = !!e.querySelector('button[data-event-preview-open="statuses"]'), o = !!e.querySelector('button[data-sshelper-tool-toggle="1"][data-tip]');
  (!t || !r || !n || !o || e.dataset.sshelperToolbarMarkupVersion !== Ud) && (e.innerHTML = vE(), e.dataset.sshelperToolbarMarkupVersion = Ud, delete e.dataset.sshelperToolbarInitialized), e.dataset.sshelperToolbarInitialized !== "1" && (fp(e, !1), e.dataset.sshelperToolbarInitialized = "1");
}
function yE(e) {
  e > cE || setTimeout(() => {
    gp(e);
  }, dE);
}
function gp(e = 0) {
  bE();
  let t = document.getElementById(Re);
  t || (t = document.createElement("div"), t.id = Re), xE(t);
  const r = document.querySelector("#send_form.compact") || document.getElementById("send_form");
  return !r || !r.parentElement ? (yE(e + 1), t) : (window.getComputedStyle(r).position === "static" && (r.style.position = "relative"), t.parentElement !== r && r.appendChild(t), t);
}
function SE() {
  if (document.getElementById("st-roll-event-preview-style")) return;
  const e = document.createElement("style");
  e.id = "st-roll-event-preview-style", e.textContent = `
    .st-rh-preview-dialog { border: none; background: transparent; padding: 0; max-width: 96vw; }
    .st-rh-preview-dialog::backdrop { background: rgba(0, 0, 0, 0.58); backdrop-filter: blur(2px); }
    .st-rh-preview-wrap { width: min(720px, 92vw); max-height: min(76vh, 680px); border: 1px solid rgba(197, 160, 89, 0.5); border-radius: 12px; background: linear-gradient(145deg, #1c1412 0%, #0d0806 100%); color: #e9ddbc; box-shadow: 0 18px 36px rgba(0,0,0,0.52); display: flex; flex-direction: column; }
    .st-rh-preview-head { display: flex; justify-content: space-between; gap: 10px; align-items: center; padding: 12px 14px; border-bottom: 1px solid rgba(197, 160, 89, 0.24); }
    .st-rh-preview-title { font-size: 15px; font-weight: 700; letter-spacing: 0.5px; }
    .st-rh-preview-body { max-height: none; overflow: auto; padding: 12px 14px; font-size: 13px; line-height: 1.6; -webkit-overflow-scrolling: touch; }
    .st-rh-preview-empty { opacity: 0.75; padding: 10px; border: 1px dashed rgba(197,160,89,0.35); border-radius: 8px; text-align: center; }
    .st-rh-preview-list { margin: 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 8px; }
    .st-rh-preview-item { padding: 8px 10px; border: 1px solid rgba(197,160,89,0.25); border-radius: 8px; background: rgba(255,255,255,0.03); }
    .st-rh-preview-item strong { color: #ffd987; }
    .st-rh-preview-btn { border: 1px solid rgba(197,160,89,0.55); background: linear-gradient(135deg, #3a2515, #1a100a); color: #f3d69c; border-radius: 8px; padding: 6px 12px; cursor: pointer; }
    .st-rh-preview-btn.secondary { background: rgba(18, 12, 8, 0.75); color: #d1c5a5; }
    @media (max-width: 640px) {
      .st-rh-preview-dialog {
        width: 100vw;
        max-width: 100vw;
        margin: 0;
        min-height: 100dvh;
        display: flex;
        align-items: flex-end;
        justify-content: center;
      }
      .st-rh-preview-wrap {
        width: 100vw;
        max-width: 100vw;
        max-height: min(84dvh, 720px);
        border-left: none;
        border-right: none;
        border-bottom: none;
        border-radius: 14px 14px 0 0;
        box-shadow: 0 -10px 28px rgba(0,0,0,0.48);
      }
      .st-rh-preview-head {
        position: sticky;
        top: 0;
        z-index: 1;
        padding: 12px;
        background: linear-gradient(180deg, rgba(24,16,12,0.98), rgba(12,8,6,0.95));
      }
      .st-rh-preview-title {
        font-size: 14px;
        line-height: 1.4;
      }
      .st-rh-preview-body {
        padding: 10px 12px 14px;
        font-size: 13px;
      }
      .st-rh-preview-item {
        padding: 10px 11px;
      }
      .st-rh-preview-btn {
        min-height: 36px;
        padding: 6px 12px;
      }
    }
    @media (max-width: 420px) {
      .st-rh-preview-wrap {
        max-height: 88dvh;
      }
      .st-rh-preview-title {
        font-size: 13px;
      }
      .st-rh-preview-body {
        font-size: 12px;
      }
      .st-rh-preview-btn {
        min-height: 34px;
        font-size: 12px;
      }
    }
  `, document.head.appendChild(e);
}
function vp() {
  const e = document.getElementById("st-roll-event-preview-dialog");
  if (e) return e;
  SE();
  const t = document.createElement("dialog");
  return t.id = "st-roll-event-preview-dialog", t.className = "st-rh-preview-dialog", t.innerHTML = `
    <div class="st-rh-preview-wrap">
      <div class="st-rh-preview-head">
        <div class="st-rh-preview-title" data-preview-title="1"></div>
        <button type="button" class="st-rh-preview-btn secondary" data-preview-close="1">关闭</button>
      </div>
      <div class="st-rh-preview-body" data-preview-body="1"></div>
    </div>
  `, t.addEventListener("cancel", (r) => {
    r.preventDefault(), t.close();
  }), document.body.appendChild(t), t;
}
function EE(e) {
  const t = lE(e);
  return t.length <= 0 ? '<div class="st-rh-preview-empty">当前主角技能为空。</div>' : `<ul class="st-rh-preview-list">${t.map((r) => `<li class="st-rh-preview-item"><strong>${Js(r.name)}</strong>：${r.modifier >= 0 ? `+${r.modifier}` : r.modifier}</li>`).join("")}</ul>`;
}
function _E(e) {
  const t = Array.isArray(e.activeStatuses) ? e.activeStatuses.filter((r) => r?.enabled !== !1) : [];
  return t.length <= 0 ? '<div class="st-rh-preview-empty">当前没有生效状态。</div>' : `<ul class="st-rh-preview-list">${t.map((r) => {
    const n = r.scope === "all" ? "全局" : Array.isArray(r.skills) && r.skills.length > 0 ? r.skills.join("|") : "当前技能", o = hn(r.remainingRounds), i = Number(r.modifier) || 0;
    return `<li class="st-rh-preview-item"><strong>${Js(r.name)}</strong>：${i >= 0 ? `+${i}` : i} ｜ 范围=${Js(n)} ｜ ${Js(o)}</li>`;
  }).join("")}</ul>`;
}
function TE(e, t) {
  const r = vp(), n = r.querySelector('[data-preview-title="1"]'), o = r.querySelector('[data-preview-body="1"]');
  if (!n || !o) return;
  const i = t.getSettingsEvent();
  if (e === "skills" ? (n.textContent = "技能预览（当前主角）", o.innerHTML = i.enableSkillSystem === !1 ? '<div class="st-rh-preview-empty">技能系统已关闭。</div>' : EE(String(i.skillTableText ?? "{}"))) : (n.textContent = "状态预览（当前生效）", o.innerHTML = _E(t.getDiceMetaEvent())), !r.open) try {
    r.showModal();
  } catch {
    r.setAttribute("open", "");
  }
}
function kE(e) {
  const t = globalThis;
  oh(), gp(), !t.__stRollEventButtonsBoundEvent && (document.addEventListener("click", (r) => {
    const n = r.target;
    if (!n) return;
    const o = n.closest('button[data-sshelper-tool-toggle="1"]');
    if (o) {
      r.preventDefault(), r.stopPropagation();
      const y = o.closest(`#${Re}`);
      y && fp(y, !!y.classList.contains(So));
      return;
    }
    const i = n.closest("button[data-event-preview-open]");
    if (i) {
      r.preventDefault(), r.stopPropagation();
      const y = String(i.dataset.eventPreviewOpen ?? "").toLowerCase();
      (y === "skills" || y === "statuses") && TE(y, e);
      return;
    }
    if (n.closest('button[data-preview-close="1"]')) {
      r.preventDefault();
      const y = vp();
      y.open && y.close();
      return;
    }
    const c = n.closest("button[data-rh-collapse-toggle='1']");
    if (c) {
      r.preventDefault(), r.stopPropagation();
      const y = c.closest("[data-rh-collapsible-card='1']");
      if (!y) return;
      const S = y.classList.contains("is-collapsed");
      y.classList.toggle("is-collapsed", !S), c.setAttribute("aria-expanded", S ? "true" : "false");
      const _ = c.dataset.labelExpand || "展开详情", P = c.dataset.labelCollapse || "收起详情", L = c.querySelector("[data-rh-collapse-label='1']");
      L && (L.textContent = S ? P : _);
      return;
    }
    const u = n.closest("button[data-dice-event-roll='1']");
    if (!u) return;
    r.preventDefault(), r.stopPropagation();
    const h = u.getAttribute("data-dice-event-id") || "", f = u.getAttribute("data-dice-expr") || "", v = u.getAttribute("data-round-id") || "", x = e.performEventRollByIdEvent(h, f || void 0, v || void 0);
    x && de.warn(x);
  }, !0), t.__stRollEventButtonsBoundEvent = !0);
}
function wE(e) {
  const t = globalThis;
  t.__stRollEventCountdownTicker || (t.__stRollEventCountdownTicker = setInterval(() => {
    try {
      e.sweepTimeoutFailuresEvent(), e.refreshCountdownDomEvent();
    } catch (r) {
      de.warn("倒计时刷新异常", r);
    }
  }, 1e3));
}
function IE(e) {
  const t = globalThis;
  if (t.__stRollEventHooksRegisteredEvent) return;
  const r = e.getLiveContextEvent(), n = r?.eventSource ?? e.eventSource, o = r?.event_types ?? e.event_types ?? {};
  if (!n?.on) return;
  e.loadChatScopedStateIntoRuntimeEvent("hook_register_init").catch((v) => {
    de.warn("聊天级状态初始化装载失败", v);
  });
  const i = Array.from(new Set([o.CHAT_COMPLETION_PROMPT_READY, "chat_completion_prompt_ready"].filter((v) => typeof v == "string" && v.length > 0))), c = typeof n.makeLast == "function" ? n.makeLast.bind(n) : n.on.bind(n), u = Array.from(new Set([o.GENERATION_ENDED, "generation_ended"].filter((v) => typeof v == "string" && v.length > 0))), h = Array.from(new Set([
    o.CHAT_CHANGED,
    o.CHAT_RESET,
    o.CHAT_STARTED,
    o.CHAT_NEW,
    o.CHAT_CREATED,
    "chat_changed",
    "chat_reset",
    "chat_started",
    "chat_new",
    "chat_created"
  ].filter((v) => typeof v == "string" && v.length > 0)));
  for (const v of i) c(v, (x) => {
    try {
      e.handlePromptReadyEvent(x, v);
    } catch (y) {
      de.error("Prompt hook 错误", y);
    }
  });
  for (const v of u) n.on(v, () => {
    try {
      e.handleGenerationEndedEvent();
    } catch (x) {
      de.error("Generation hook 错误", x);
    }
  });
  for (const v of h) n.on(v, () => {
    try {
      e.clearDiceMetaEventState(v), e.loadChatScopedStateIntoRuntimeEvent(v).catch((x) => {
        de.warn(`聊天切换装载失败 (${v})`, x);
      }).finally(() => {
        setTimeout(() => {
          e.sanitizeCurrentChatEventBlocksEvent(), e.sweepTimeoutFailuresEvent(), e.refreshCountdownDomEvent(), e.refreshAllWidgetsFromStateEvent();
        }, 0);
      });
    } catch (x) {
      de.error("Reset hook 错误", x);
    }
  });
  const f = Array.from(new Set([
    o.MESSAGE_SWIPED,
    o.MESSAGE_EDITED,
    o.MESSAGE_DELETED,
    "message_swiped",
    "message_edited",
    "message_deleted"
  ].filter((v) => typeof v == "string" && v.length > 0)));
  for (const v of f) n.on(v, () => {
    try {
      setTimeout(() => e.refreshAllWidgetsFromStateEvent(), 50);
    } catch (x) {
      de.warn("Swipe/edit widget refresh 异常", x);
    }
  });
  t.__stRollEventHooksRegisteredEvent = !0;
}
function Kd() {
  return Sx();
}
function Eo(e) {
  return e > 0 ? `+${e}` : String(e);
}
function AE(e) {
  return e === "advantage" ? "优势" : e === "disadvantage" ? "劣势" : "正常";
}
function $E(e) {
  return e === "auto" ? "自动" : "手动";
}
function RE(e) {
  const t = e.scope === "all" ? "-" : e.skills.join("|"), r = e.scope === "all" ? "全局" : "按技能", n = hn(e.remainingRounds), o = e.enabled ? "启用" : "停用";
  return `- ${e.name} | ${Eo(e.modifier)} | 持续=${n} | 范围=${r} | 技能=${t} | ${o}`;
}
function CE(e, t, r) {
  if (!e.enableStatusSystem) return "状态=关闭";
  const n = _l(t, r), o = /* @__PURE__ */ new Map();
  for (const c of t) {
    const u = String(c?.name ?? "").trim().toLowerCase();
    u && o.set(u, c.remainingRounds ?? null);
  }
  if (n.modifier === 0) return "状态=+0";
  const i = n.matched.length > 0 ? `（${n.matched.map((c) => `${c.name}${Eo(c.modifier)}(${hn(o.get(String(c.name ?? "").trim().toLowerCase()) ?? null)})`).join("，")}）` : "";
  return `状态=${Eo(n.modifier)}${i}`;
}
function DE(e, t) {
  const r = t.getSettingsEvent(), n = Cr(t.getDiceMetaEvent());
  t.ensureRoundEventTimersSyncedEvent(e);
  const o = [];
  if (o.push(`当前轮次: ${e.roundId}`), o.push(`事件数量: ${e.events.length}`), o.push(`状态系统: ${r.enableStatusSystem ? "开启" : "关闭"}`), r.enableStatusSystem) if (n.length <= 0)
    o.push("Active_Statuses:"), o.push("- 无");
  else {
    o.push("Active_Statuses:");
    for (const i of n) o.push(RE(i));
  }
  for (const i of e.events) {
    const c = t.getEventRuntimeViewStateEvent(e, i), u = t.resolveSkillModifierBySkillNameEvent(i.skill, r), h = CE(r, n, i.skill), f = r.enableDynamicDcReason && i.dcReason ? ` | DC原因=${i.dcReason}` : "";
    o.push(`- ${i.id}: ${i.title} | 对象=${i.targetLabel} | 骰式=${i.checkDice} | 条件=${i.compare ?? ">="} ${i.dc}${f} | 技能=${i.skill} | 技能修正=${Eo(u)} | 模式=${$E(i.rollMode)} | 骰态=${AE(i.advantageState)} | 时限=${Mo(i.timeLimit ?? "无")} | ${h} | 状态=${c.text}`);
  }
  return o.join(`
`);
}
function NE(e) {
  const { SlashCommandParser: t, SlashCommand: r, SlashCommandArgument: n, ARGUMENT_TYPE: o, appendToConsoleEvent: i, sweepTimeoutFailuresEvent: c, getDiceMetaEvent: u, getSettingsEvent: h, ensureRoundEventTimersSyncedEvent: f, getEventRuntimeViewStateEvent: v, resolveSkillModifierBySkillNameEvent: x, performEventRollByIdEvent: y, escapeHtmlEvent: S } = e, _ = globalThis;
  _.__stRollEventCommandRegisteredEvent || !t || !r || !n || !o || (t.addCommandObject(r.fromProps({
    name: "eventroll",
    aliases: ["eroll"],
    returns: "事件骰子命令：list / roll / help",
    namedArgumentList: [],
    unnamedArgumentList: [n.fromProps({
      description: "子命令，例如：list | roll lockpick_gate 1d20+3",
      typeList: o.STRING,
      isRequired: !1
    })],
    helpString: Kd(),
    callback: (P, L) => {
      const M = (L ?? "").toString().trim(), B = M ? M.split(/\s+/) : [], C = (B[0] || "help").toLowerCase();
      if (C === "help")
        return i(Kd()), "";
      if (C === "list") {
        c();
        const G = u().pendingRound;
        return !G || G.status !== "open" ? (i("当前没有可用事件，请先等待 AI 输出事件 JSON。", "warn"), "") : (i(Ex(S(DE(G, {
          getSettingsEvent: h,
          getDiceMetaEvent: u,
          ensureRoundEventTimersSyncedEvent: f,
          getEventRuntimeViewStateEvent: v,
          resolveSkillModifierBySkillNameEvent: x
        })))), "");
      }
      if (C === "roll") {
        const G = y(B[1] || "", B.length > 2 ? B.slice(2).join(" ") : void 0);
        return G && i(G, "error"), "";
      }
      return i("未知子命令，请使用 /eventroll help 查看帮助。", "warn"), "";
    }
  })), _.__stRollEventCommandRegisteredEvent = !0);
}
function LE(e) {
  const { SlashCommandParser: t, SlashCommand: r, getDiceMeta: n, getDiceMetaEvent: o, escapeHtmlEvent: i, appendToConsoleEvent: c } = e, u = globalThis;
  u.__stRollDebugCommandRegisteredEvent || !t || !r || (t.addCommandObject(r.fromProps({
    name: "rollDebug",
    aliases: ["ddebug"],
    returns: "显示 diceRoller 元数据",
    namedArgumentList: [],
    unnamedArgumentList: [],
    callback: () => {
      const h = n(), f = o();
      return c(_x(i(JSON.stringify({
        legacy: h,
        eventMeta: f
      }, null, 2)))), "";
    }
  })), u.__stRollDebugCommandRegisteredEvent = !0);
}
function ME(e) {
  return nE(e, { isAssistantMessageEvent: Zh });
}
function OE(e, t) {
  return sE(e, t, {
    simpleHashEvent: ym,
    getMessageTextEvent: vt
  });
}
function PE(e) {
  return oE(e, {
    getPreferredAssistantSourceTextEvent: Qh,
    getMessageTextEvent: vt,
    parseEventEnvelopesEvent: rp,
    removeRangesEvent: np,
    setMessageTextEvent: Hn
  });
}
function bp() {
  aE({
    getLiveContextEvent: ts,
    isAssistantMessageEvent: Zh,
    sanitizeAssistantMessageEventBlocksEvent: PE,
    persistChatSafeEvent: Ym,
    hideEventCodeBlocksInDomEvent: lp
  });
}
var BE = 12, UE = 250;
function as() {
  return rE({
    getLiveContextEvent: ts,
    getDiceMetaEvent: Ce,
    buildEventListCardEvent: XS,
    buildEventRollResultCardEvent: mp,
    getLatestRollRecordForEvent: Zt
  });
}
function KE(e) {
  return e.hasPendingRound && !e.pendingRoundMounted;
}
function xp(e = 0) {
  if (bp(), Dr(), os(), !!KE(as())) {
    if (e >= BE) {
      de.warn(`[卡片恢复] 初始化恢复重试耗尽 retry=${e}`);
      return;
    }
    setTimeout(() => {
      xp(e + 1);
    }, UE);
  }
}
var yp = {
  getSettingsEvent: Ee,
  ensureRoundEventTimersSyncedEvent: er,
  getLatestRollRecordForEvent: Zt,
  rollExpression: th,
  parseDiceExpression: Qt,
  resolveSkillModifierBySkillNameEvent: Ko,
  applySkillModifierToDiceResultEvent: Uh,
  normalizeCompareOperatorEvent: zo,
  evaluateSuccessEvent: Vb,
  createIdEvent: Rr,
  buildEventRollResultCardEvent: mp,
  saveLastRoll: Gm,
  saveMetadataSafeEvent: Jt
};
function Sp(e, t, r) {
  return _y(e, t, r, {
    ...yp,
    sweepTimeoutFailuresEvent: Dr,
    getDiceMetaEvent: Ce,
    recordTimeoutFailureIfNeededEvent: sp,
    refreshAllWidgetsFromStateEvent: as,
    refreshCountdownDomEvent: os
  });
}
function HE(e) {
  return Ty(e, {
    ...yp,
    getDiceMetaEvent: Ce
  });
}
function GE(e = 0) {
  Ti(e, {
    getSettingsEvent: Ee,
    getLiveContextEvent: ts,
    findLatestAssistantEvent: ME,
    getDiceMetaEvent: Ce,
    buildAssistantMessageIdEvent: OE,
    getPreferredAssistantSourceTextEvent: Qh,
    getMessageTextEvent: vt,
    parseEventEnvelopesEvent: rp,
    filterEventsByApplyScopeEvent: qx,
    removeRangesEvent: np,
    setMessageTextEvent: Hn,
    hideEventCodeBlocksInDomEvent: lp,
    persistChatSafeEvent: Ym,
    mergeEventsIntoPendingRoundEvent: Jy,
    autoRollEventsByAiModeEvent: HE,
    refreshAllWidgetsFromStateEvent: as,
    sweepTimeoutFailuresEvent: Dr,
    refreshCountdownDomEvent: os,
    saveMetadataSafeEvent: Jt
  });
}
function zE(e = "chat_reset") {
  if (String(e || "").toLowerCase() !== "chat_reset") {
    const t = Ce();
    delete t.lastProcessedAssistantMsgId;
    return;
  }
  iE(e, {
    getDiceMetaEvent: Ce,
    saveMetadataSafeEvent: Jt
  });
}
function jE() {
  kE({
    performEventRollByIdEvent: Sp,
    refreshAllWidgetsFromStateEvent: as,
    getSettingsEvent: Ee,
    getDiceMetaEvent: Ce
  });
}
function qE() {
  const e = Lo();
  NE({
    SlashCommandParser: e.parser,
    SlashCommand: e.command,
    SlashCommandArgument: e.argument,
    ARGUMENT_TYPE: e.argumentType,
    appendToConsoleEvent: Er,
    sweepTimeoutFailuresEvent: Dr,
    getDiceMetaEvent: Ce,
    getSettingsEvent: Ee,
    ensureRoundEventTimersSyncedEvent: er,
    getEventRuntimeViewStateEvent: jl,
    resolveSkillModifierBySkillNameEvent: Ko,
    performEventRollByIdEvent: Sp,
    escapeHtmlEvent: un
  });
}
function FE() {
  wE({
    sweepTimeoutFailuresEvent: Dr,
    refreshCountdownDomEvent: os
  });
}
function VE() {
  IE({
    getLiveContextEvent: ts,
    eventSource: lm() ?? void 0,
    event_types: cm() ?? void 0,
    extractPromptChatFromPayloadEvent: Vy,
    handlePromptReadyEvent: rS,
    handleGenerationEndedEvent: GE,
    clearDiceMetaEventState: zE,
    sanitizeCurrentChatEventBlocksEvent: bp,
    sweepTimeoutFailuresEvent: Dr,
    refreshCountdownDomEvent: os,
    loadChatScopedStateIntoRuntimeEvent: Hm,
    refreshAllWidgetsFromStateEvent: as
  });
}
function YE() {
  const e = Lo();
  LE({
    SlashCommandParser: e.parser,
    SlashCommand: e.command,
    getDiceMeta: qn,
    getDiceMetaEvent: Ce,
    escapeHtmlEvent: un,
    appendToConsoleEvent: Er
  });
}
Ox();
var WE = 80, XE = 500;
function JE(e) {
  const t = [];
  return e.__stRollEventCommandRegisteredEvent || t.push("event_command"), e.__stRollBaseCommandRegisteredEvent || t.push("base_command"), e.__stRollDebugCommandRegisteredEvent || t.push("debug_command"), e.__stRollEventHooksRegisteredEvent || t.push("event_hooks"), t;
}
function Ep(e = 0) {
  if (zl(), Mx(), Lx(), jE(), qE(), YE(), VE(), FE(), Hm("init_runtime").catch((t) => {
    de.warn("初始化聊天级状态失败", t);
  }).finally(() => {
    xp();
  }), JE(globalThis).length > 0) {
    e < WE && setTimeout(() => Ep(e + 1), XE);
    return;
  }
}
var Hd = '@layer theme,base,components,utilities;@layer theme{@theme default{ --font-sans: ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"; --font-serif: ui-serif, Georgia, Cambria, "Times New Roman", Times, serif; --font-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; --color-red-50: oklch(97.1% .013 17.38); --color-red-100: oklch(93.6% .032 17.717); --color-red-200: oklch(88.5% .062 18.334); --color-red-300: oklch(80.8% .114 19.571); --color-red-400: oklch(70.4% .191 22.216); --color-red-500: oklch(63.7% .237 25.331); --color-red-600: oklch(57.7% .245 27.325); --color-red-700: oklch(50.5% .213 27.518); --color-red-800: oklch(44.4% .177 26.899); --color-red-900: oklch(39.6% .141 25.723); --color-red-950: oklch(25.8% .092 26.042); --color-orange-50: oklch(98% .016 73.684); --color-orange-100: oklch(95.4% .038 75.164); --color-orange-200: oklch(90.1% .076 70.697); --color-orange-300: oklch(83.7% .128 66.29); --color-orange-400: oklch(75% .183 55.934); --color-orange-500: oklch(70.5% .213 47.604); --color-orange-600: oklch(64.6% .222 41.116); --color-orange-700: oklch(55.3% .195 38.402); --color-orange-800: oklch(47% .157 37.304); --color-orange-900: oklch(40.8% .123 38.172); --color-orange-950: oklch(26.6% .079 36.259); --color-amber-50: oklch(98.7% .022 95.277); --color-amber-100: oklch(96.2% .059 95.617); --color-amber-200: oklch(92.4% .12 95.746); --color-amber-300: oklch(87.9% .169 91.605); --color-amber-400: oklch(82.8% .189 84.429); --color-amber-500: oklch(76.9% .188 70.08); --color-amber-600: oklch(66.6% .179 58.318); --color-amber-700: oklch(55.5% .163 48.998); --color-amber-800: oklch(47.3% .137 46.201); --color-amber-900: oklch(41.4% .112 45.904); --color-amber-950: oklch(27.9% .077 45.635); --color-yellow-50: oklch(98.7% .026 102.212); --color-yellow-100: oklch(97.3% .071 103.193); --color-yellow-200: oklch(94.5% .129 101.54); --color-yellow-300: oklch(90.5% .182 98.111); --color-yellow-400: oklch(85.2% .199 91.936); --color-yellow-500: oklch(79.5% .184 86.047); --color-yellow-600: oklch(68.1% .162 75.834); --color-yellow-700: oklch(55.4% .135 66.442); --color-yellow-800: oklch(47.6% .114 61.907); --color-yellow-900: oklch(42.1% .095 57.708); --color-yellow-950: oklch(28.6% .066 53.813); --color-lime-50: oklch(98.6% .031 120.757); --color-lime-100: oklch(96.7% .067 122.328); --color-lime-200: oklch(93.8% .127 124.321); --color-lime-300: oklch(89.7% .196 126.665); --color-lime-400: oklch(84.1% .238 128.85); --color-lime-500: oklch(76.8% .233 130.85); --color-lime-600: oklch(64.8% .2 131.684); --color-lime-700: oklch(53.2% .157 131.589); --color-lime-800: oklch(45.3% .124 130.933); --color-lime-900: oklch(40.5% .101 131.063); --color-lime-950: oklch(27.4% .072 132.109); --color-green-50: oklch(98.2% .018 155.826); --color-green-100: oklch(96.2% .044 156.743); --color-green-200: oklch(92.5% .084 155.995); --color-green-300: oklch(87.1% .15 154.449); --color-green-400: oklch(79.2% .209 151.711); --color-green-500: oklch(72.3% .219 149.579); --color-green-600: oklch(62.7% .194 149.214); --color-green-700: oklch(52.7% .154 150.069); --color-green-800: oklch(44.8% .119 151.328); --color-green-900: oklch(39.3% .095 152.535); --color-green-950: oklch(26.6% .065 152.934); --color-emerald-50: oklch(97.9% .021 166.113); --color-emerald-100: oklch(95% .052 163.051); --color-emerald-200: oklch(90.5% .093 164.15); --color-emerald-300: oklch(84.5% .143 164.978); --color-emerald-400: oklch(76.5% .177 163.223); --color-emerald-500: oklch(69.6% .17 162.48); --color-emerald-600: oklch(59.6% .145 163.225); --color-emerald-700: oklch(50.8% .118 165.612); --color-emerald-800: oklch(43.2% .095 166.913); --color-emerald-900: oklch(37.8% .077 168.94); --color-emerald-950: oklch(26.2% .051 172.552); --color-teal-50: oklch(98.4% .014 180.72); --color-teal-100: oklch(95.3% .051 180.801); --color-teal-200: oklch(91% .096 180.426); --color-teal-300: oklch(85.5% .138 181.071); --color-teal-400: oklch(77.7% .152 181.912); --color-teal-500: oklch(70.4% .14 182.503); --color-teal-600: oklch(60% .118 184.704); --color-teal-700: oklch(51.1% .096 186.391); --color-teal-800: oklch(43.7% .078 188.216); --color-teal-900: oklch(38.6% .063 188.416); --color-teal-950: oklch(27.7% .046 192.524); --color-cyan-50: oklch(98.4% .019 200.873); --color-cyan-100: oklch(95.6% .045 203.388); --color-cyan-200: oklch(91.7% .08 205.041); --color-cyan-300: oklch(86.5% .127 207.078); --color-cyan-400: oklch(78.9% .154 211.53); --color-cyan-500: oklch(71.5% .143 215.221); --color-cyan-600: oklch(60.9% .126 221.723); --color-cyan-700: oklch(52% .105 223.128); --color-cyan-800: oklch(45% .085 224.283); --color-cyan-900: oklch(39.8% .07 227.392); --color-cyan-950: oklch(30.2% .056 229.695); --color-sky-50: oklch(97.7% .013 236.62); --color-sky-100: oklch(95.1% .026 236.824); --color-sky-200: oklch(90.1% .058 230.902); --color-sky-300: oklch(82.8% .111 230.318); --color-sky-400: oklch(74.6% .16 232.661); --color-sky-500: oklch(68.5% .169 237.323); --color-sky-600: oklch(58.8% .158 241.966); --color-sky-700: oklch(50% .134 242.749); --color-sky-800: oklch(44.3% .11 240.79); --color-sky-900: oklch(39.1% .09 240.876); --color-sky-950: oklch(29.3% .066 243.157); --color-blue-50: oklch(97% .014 254.604); --color-blue-100: oklch(93.2% .032 255.585); --color-blue-200: oklch(88.2% .059 254.128); --color-blue-300: oklch(80.9% .105 251.813); --color-blue-400: oklch(70.7% .165 254.624); --color-blue-500: oklch(62.3% .214 259.815); --color-blue-600: oklch(54.6% .245 262.881); --color-blue-700: oklch(48.8% .243 264.376); --color-blue-800: oklch(42.4% .199 265.638); --color-blue-900: oklch(37.9% .146 265.522); --color-blue-950: oklch(28.2% .091 267.935); --color-indigo-50: oklch(96.2% .018 272.314); --color-indigo-100: oklch(93% .034 272.788); --color-indigo-200: oklch(87% .065 274.039); --color-indigo-300: oklch(78.5% .115 274.713); --color-indigo-400: oklch(67.3% .182 276.935); --color-indigo-500: oklch(58.5% .233 277.117); --color-indigo-600: oklch(51.1% .262 276.966); --color-indigo-700: oklch(45.7% .24 277.023); --color-indigo-800: oklch(39.8% .195 277.366); --color-indigo-900: oklch(35.9% .144 278.697); --color-indigo-950: oklch(25.7% .09 281.288); --color-violet-50: oklch(96.9% .016 293.756); --color-violet-100: oklch(94.3% .029 294.588); --color-violet-200: oklch(89.4% .057 293.283); --color-violet-300: oklch(81.1% .111 293.571); --color-violet-400: oklch(70.2% .183 293.541); --color-violet-500: oklch(60.6% .25 292.717); --color-violet-600: oklch(54.1% .281 293.009); --color-violet-700: oklch(49.1% .27 292.581); --color-violet-800: oklch(43.2% .232 292.759); --color-violet-900: oklch(38% .189 293.745); --color-violet-950: oklch(28.3% .141 291.089); --color-purple-50: oklch(97.7% .014 308.299); --color-purple-100: oklch(94.6% .033 307.174); --color-purple-200: oklch(90.2% .063 306.703); --color-purple-300: oklch(82.7% .119 306.383); --color-purple-400: oklch(71.4% .203 305.504); --color-purple-500: oklch(62.7% .265 303.9); --color-purple-600: oklch(55.8% .288 302.321); --color-purple-700: oklch(49.6% .265 301.924); --color-purple-800: oklch(43.8% .218 303.724); --color-purple-900: oklch(38.1% .176 304.987); --color-purple-950: oklch(29.1% .149 302.717); --color-fuchsia-50: oklch(97.7% .017 320.058); --color-fuchsia-100: oklch(95.2% .037 318.852); --color-fuchsia-200: oklch(90.3% .076 319.62); --color-fuchsia-300: oklch(83.3% .145 321.434); --color-fuchsia-400: oklch(74% .238 322.16); --color-fuchsia-500: oklch(66.7% .295 322.15); --color-fuchsia-600: oklch(59.1% .293 322.896); --color-fuchsia-700: oklch(51.8% .253 323.949); --color-fuchsia-800: oklch(45.2% .211 324.591); --color-fuchsia-900: oklch(40.1% .17 325.612); --color-fuchsia-950: oklch(29.3% .136 325.661); --color-pink-50: oklch(97.1% .014 343.198); --color-pink-100: oklch(94.8% .028 342.258); --color-pink-200: oklch(89.9% .061 343.231); --color-pink-300: oklch(82.3% .12 346.018); --color-pink-400: oklch(71.8% .202 349.761); --color-pink-500: oklch(65.6% .241 354.308); --color-pink-600: oklch(59.2% .249 .584); --color-pink-700: oklch(52.5% .223 3.958); --color-pink-800: oklch(45.9% .187 3.815); --color-pink-900: oklch(40.8% .153 2.432); --color-pink-950: oklch(28.4% .109 3.907); --color-rose-50: oklch(96.9% .015 12.422); --color-rose-100: oklch(94.1% .03 12.58); --color-rose-200: oklch(89.2% .058 10.001); --color-rose-300: oklch(81% .117 11.638); --color-rose-400: oklch(71.2% .194 13.428); --color-rose-500: oklch(64.5% .246 16.439); --color-rose-600: oklch(58.6% .253 17.585); --color-rose-700: oklch(51.4% .222 16.935); --color-rose-800: oklch(45.5% .188 13.697); --color-rose-900: oklch(41% .159 10.272); --color-rose-950: oklch(27.1% .105 12.094); --color-slate-50: oklch(98.4% .003 247.858); --color-slate-100: oklch(96.8% .007 247.896); --color-slate-200: oklch(92.9% .013 255.508); --color-slate-300: oklch(86.9% .022 252.894); --color-slate-400: oklch(70.4% .04 256.788); --color-slate-500: oklch(55.4% .046 257.417); --color-slate-600: oklch(44.6% .043 257.281); --color-slate-700: oklch(37.2% .044 257.287); --color-slate-800: oklch(27.9% .041 260.031); --color-slate-900: oklch(20.8% .042 265.755); --color-slate-950: oklch(12.9% .042 264.695); --color-gray-50: oklch(98.5% .002 247.839); --color-gray-100: oklch(96.7% .003 264.542); --color-gray-200: oklch(92.8% .006 264.531); --color-gray-300: oklch(87.2% .01 258.338); --color-gray-400: oklch(70.7% .022 261.325); --color-gray-500: oklch(55.1% .027 264.364); --color-gray-600: oklch(44.6% .03 256.802); --color-gray-700: oklch(37.3% .034 259.733); --color-gray-800: oklch(27.8% .033 256.848); --color-gray-900: oklch(21% .034 264.665); --color-gray-950: oklch(13% .028 261.692); --color-zinc-50: oklch(98.5% 0 0); --color-zinc-100: oklch(96.7% .001 286.375); --color-zinc-200: oklch(92% .004 286.32); --color-zinc-300: oklch(87.1% .006 286.286); --color-zinc-400: oklch(70.5% .015 286.067); --color-zinc-500: oklch(55.2% .016 285.938); --color-zinc-600: oklch(44.2% .017 285.786); --color-zinc-700: oklch(37% .013 285.805); --color-zinc-800: oklch(27.4% .006 286.033); --color-zinc-900: oklch(21% .006 285.885); --color-zinc-950: oklch(14.1% .005 285.823); --color-neutral-50: oklch(98.5% 0 0); --color-neutral-100: oklch(97% 0 0); --color-neutral-200: oklch(92.2% 0 0); --color-neutral-300: oklch(87% 0 0); --color-neutral-400: oklch(70.8% 0 0); --color-neutral-500: oklch(55.6% 0 0); --color-neutral-600: oklch(43.9% 0 0); --color-neutral-700: oklch(37.1% 0 0); --color-neutral-800: oklch(26.9% 0 0); --color-neutral-900: oklch(20.5% 0 0); --color-neutral-950: oklch(14.5% 0 0); --color-stone-50: oklch(98.5% .001 106.423); --color-stone-100: oklch(97% .001 106.424); --color-stone-200: oklch(92.3% .003 48.717); --color-stone-300: oklch(86.9% .005 56.366); --color-stone-400: oklch(70.9% .01 56.259); --color-stone-500: oklch(55.3% .013 58.071); --color-stone-600: oklch(44.4% .011 73.639); --color-stone-700: oklch(37.4% .01 67.558); --color-stone-800: oklch(26.8% .007 34.298); --color-stone-900: oklch(21.6% .006 56.043); --color-stone-950: oklch(14.7% .004 49.25); --color-mauve-50: oklch(98.5% 0 0); --color-mauve-100: oklch(96% .003 325.6); --color-mauve-200: oklch(92.2% .005 325.62); --color-mauve-300: oklch(86.5% .012 325.68); --color-mauve-400: oklch(71.1% .019 323.02); --color-mauve-500: oklch(54.2% .034 322.5); --color-mauve-600: oklch(43.5% .029 321.78); --color-mauve-700: oklch(36.4% .029 323.89); --color-mauve-800: oklch(26.3% .024 320.12); --color-mauve-900: oklch(21.2% .019 322.12); --color-mauve-950: oklch(14.5% .008 326); --color-olive-50: oklch(98.8% .003 106.5); --color-olive-100: oklch(96.6% .005 106.5); --color-olive-200: oklch(93% .007 106.5); --color-olive-300: oklch(88% .011 106.6); --color-olive-400: oklch(73.7% .021 106.9); --color-olive-500: oklch(58% .031 107.3); --color-olive-600: oklch(46.6% .025 107.3); --color-olive-700: oklch(39.4% .023 107.4); --color-olive-800: oklch(28.6% .016 107.4); --color-olive-900: oklch(22.8% .013 107.4); --color-olive-950: oklch(15.3% .006 107.1); --color-mist-50: oklch(98.7% .002 197.1); --color-mist-100: oklch(96.3% .002 197.1); --color-mist-200: oklch(92.5% .005 214.3); --color-mist-300: oklch(87.2% .007 219.6); --color-mist-400: oklch(72.3% .014 214.4); --color-mist-500: oklch(56% .021 213.5); --color-mist-600: oklch(45% .017 213.2); --color-mist-700: oklch(37.8% .015 216); --color-mist-800: oklch(27.5% .011 216.9); --color-mist-900: oklch(21.8% .008 223.9); --color-mist-950: oklch(14.8% .004 228.8); --color-taupe-50: oklch(98.6% .002 67.8); --color-taupe-100: oklch(96% .002 17.2); --color-taupe-200: oklch(92.2% .005 34.3); --color-taupe-300: oklch(86.8% .007 39.5); --color-taupe-400: oklch(71.4% .014 41.2); --color-taupe-500: oklch(54.7% .021 43.1); --color-taupe-600: oklch(43.8% .017 39.3); --color-taupe-700: oklch(36.7% .016 35.7); --color-taupe-800: oklch(26.8% .011 36.5); --color-taupe-900: oklch(21.4% .009 43.1); --color-taupe-950: oklch(14.7% .004 49.3); --color-black: #000; --color-white: #fff; --spacing: .25rem; --breakpoint-sm: 40rem; --breakpoint-md: 48rem; --breakpoint-lg: 64rem; --breakpoint-xl: 80rem; --breakpoint-2xl: 96rem; --container-3xs: 16rem; --container-2xs: 18rem; --container-xs: 20rem; --container-sm: 24rem; --container-md: 28rem; --container-lg: 32rem; --container-xl: 36rem; --container-2xl: 42rem; --container-3xl: 48rem; --container-4xl: 56rem; --container-5xl: 64rem; --container-6xl: 72rem; --container-7xl: 80rem; --text-xs: .75rem; --text-xs--line-height: calc(1 / .75); --text-sm: .875rem; --text-sm--line-height: calc(1.25 / .875); --text-base: 1rem; --text-base--line-height: 1.5 ; --text-lg: 1.125rem; --text-lg--line-height: calc(1.75 / 1.125); --text-xl: 1.25rem; --text-xl--line-height: calc(1.75 / 1.25); --text-2xl: 1.5rem; --text-2xl--line-height: calc(2 / 1.5); --text-3xl: 1.875rem; --text-3xl--line-height: 1.2 ; --text-4xl: 2.25rem; --text-4xl--line-height: calc(2.5 / 2.25); --text-5xl: 3rem; --text-5xl--line-height: 1; --text-6xl: 3.75rem; --text-6xl--line-height: 1; --text-7xl: 4.5rem; --text-7xl--line-height: 1; --text-8xl: 6rem; --text-8xl--line-height: 1; --text-9xl: 8rem; --text-9xl--line-height: 1; --font-weight-thin: 100; --font-weight-extralight: 200; --font-weight-light: 300; --font-weight-normal: 400; --font-weight-medium: 500; --font-weight-semibold: 600; --font-weight-bold: 700; --font-weight-extrabold: 800; --font-weight-black: 900; --tracking-tighter: -.05em; --tracking-tight: -.025em; --tracking-normal: 0em; --tracking-wide: .025em; --tracking-wider: .05em; --tracking-widest: .1em; --leading-tight: 1.25; --leading-snug: 1.375; --leading-normal: 1.5; --leading-relaxed: 1.625; --leading-loose: 2; --radius-xs: .125rem; --radius-sm: .25rem; --radius-md: .375rem; --radius-lg: .5rem; --radius-xl: .75rem; --radius-2xl: 1rem; --radius-3xl: 1.5rem; --radius-4xl: 2rem; --shadow-2xs: 0 1px rgb(0 0 0 / .05); --shadow-xs: 0 1px 2px 0 rgb(0 0 0 / .05); --shadow-sm: 0 1px 3px 0 rgb(0 0 0 / .1), 0 1px 2px -1px rgb(0 0 0 / .1); --shadow-md: 0 4px 6px -1px rgb(0 0 0 / .1), 0 2px 4px -2px rgb(0 0 0 / .1); --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / .1), 0 4px 6px -4px rgb(0 0 0 / .1); --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / .1), 0 8px 10px -6px rgb(0 0 0 / .1); --shadow-2xl: 0 25px 50px -12px rgb(0 0 0 / .25); --inset-shadow-2xs: inset 0 1px rgb(0 0 0 / .05); --inset-shadow-xs: inset 0 1px 1px rgb(0 0 0 / .05); --inset-shadow-sm: inset 0 2px 4px rgb(0 0 0 / .05); --drop-shadow-xs: 0 1px 1px rgb(0 0 0 / .05); --drop-shadow-sm: 0 1px 2px rgb(0 0 0 / .15); --drop-shadow-md: 0 3px 3px rgb(0 0 0 / .12); --drop-shadow-lg: 0 4px 4px rgb(0 0 0 / .15); --drop-shadow-xl: 0 9px 7px rgb(0 0 0 / .1); --drop-shadow-2xl: 0 25px 25px rgb(0 0 0 / .15); --text-shadow-2xs: 0px 1px 0px rgb(0 0 0 / .15); --text-shadow-xs: 0px 1px 1px rgb(0 0 0 / .2); --text-shadow-sm: 0px 1px 0px rgb(0 0 0 / .075), 0px 1px 1px rgb(0 0 0 / .075), 0px 2px 2px rgb(0 0 0 / .075); --text-shadow-md: 0px 1px 1px rgb(0 0 0 / .1), 0px 1px 2px rgb(0 0 0 / .1), 0px 2px 4px rgb(0 0 0 / .1); --text-shadow-lg: 0px 1px 2px rgb(0 0 0 / .1), 0px 3px 2px rgb(0 0 0 / .1), 0px 4px 8px rgb(0 0 0 / .1); --ease-in: cubic-bezier(.4, 0, 1, 1); --ease-out: cubic-bezier(0, 0, .2, 1); --ease-in-out: cubic-bezier(.4, 0, .2, 1); --animate-spin: spin 1s linear infinite; --animate-ping: ping 1s cubic-bezier(0, 0, .2, 1) infinite; --animate-pulse: pulse 2s cubic-bezier(.4, 0, .6, 1) infinite; --animate-bounce: bounce 1s infinite; @keyframes spin { to { transform: rotate(360deg); } } @keyframes ping { 75%, 100% { transform: scale(2); opacity: 0; } } @keyframes pulse { 50% { opacity: .5; } } @keyframes bounce { 0%, 100% { transform: translateY(-25%); animation-timing-function: cubic-bezier(.8, 0, 1, 1); } 50% { transform: none; animation-timing-function: cubic-bezier(0, 0, .2, 1); } } --blur-xs: 4px; --blur-sm: 8px; --blur-md: 12px; --blur-lg: 16px; --blur-xl: 24px; --blur-2xl: 40px; --blur-3xl: 64px; --perspective-dramatic: 100px; --perspective-near: 300px; --perspective-normal: 500px; --perspective-midrange: 800px; --perspective-distant: 1200px; --aspect-video: 16 / 9; --default-transition-duration: .15s; --default-transition-timing-function: cubic-bezier(.4, 0, .2, 1); --default-font-family: --theme(--font-sans, initial); --default-font-feature-settings: --theme(--font-sans--font-feature-settings, initial); --default-font-variation-settings: --theme(--font-sans--font-variation-settings, initial); --default-mono-font-family: --theme(--font-mono, initial); --default-mono-font-feature-settings: --theme(--font-mono--font-feature-settings, initial); --default-mono-font-variation-settings: --theme(--font-mono--font-variation-settings, initial); }@theme default inline reference{ --blur: 8px; --shadow: 0 1px 3px 0 rgb(0 0 0 / .1), 0 1px 2px -1px rgb(0 0 0 / .1); --shadow-inner: inset 0 2px 4px 0 rgb(0 0 0 / .05); --drop-shadow: 0 1px 2px rgb(0 0 0 / .1), 0 1px 1px rgb(0 0 0 / .06); --radius: .25rem; --max-width-prose: 65ch; }}@layer utilities{@tailwind utilities;}@source not "../MemoryOS/dist";@source not "../LLMHub/dist";@source not "../RollHelper/dist";:where(.stx-tw){color:var(--ss-theme-text, var(--SmartThemeBodyColor, inherit))}@utility stx-text-base{font-size: 13px; line-height: 1.5;}@utility stx-text-sm{font-size: 12px; line-height: 1.45;}@utility stx-text-muted{color: color-mix(in srgb,var(--ss-theme-text, #fff) 64%,transparent);}', Gd = "stx-tailwind-runtime-style", zd = "custom-", QE = /\.(?=[A-Za-z_\\])((?:\\.|[A-Za-z0-9_%@/\-[\]:])+)/g;
function ZE(e) {
  return e.replace(QE, (t, r) => r.startsWith(zd) ? t : `.${zd}${r}`);
}
var Va = `${Hd}
${ZE(Hd)}`;
function e_() {
  const e = document.getElementById(Gd);
  if (e instanceof HTMLStyleElement)
    return e.textContent !== Va && (e.textContent = Va), e;
  const t = document.createElement("style");
  return t.id = Gd, t.textContent = Va, document.head.appendChild(t), t;
}
function t_() {
  const e = globalThis;
  e.__stDiceRollerEventLoaded = !0, e_(), Ep();
}
var Qs = "stx_rollhelper", r_ = {
  pluginId: Qs,
  name: "RollHelper",
  displayName: Sr.display_name || "SS-Helper [骰子助手]",
  version: Sr.version || "1.0.0",
  capabilities: {
    events: ["plugin:request:ping", "plugin:broadcast:state_changed"],
    memory: [],
    llm: []
  },
  scopes: [
    "chat",
    "roll",
    "status"
  ],
  requiresSDK: "^1.0.0",
  source: "manifest_json"
}, de = new Xn("骰子助手");
function n_() {
  return {
    alive: !0,
    version: Sr.version || "1.0.0",
    isEnabled: !0,
    capabilities: [
      "roll",
      "event",
      "bus",
      "ui"
    ]
  };
}
function s_() {
  window.STX?.registry?.register?.(r_);
}
function o_() {
  hf("plugin:request:ping", Qs, async () => n_()), Fd("plugin:broadcast:state_changed", {
    pluginId: Qs,
    isEnabled: !0
  }, Qs);
}
de.info("骰子助手组件已加载");
s_();
o_();
t_();
export {
  de as logger
};

//# sourceMappingURL=index.js.map