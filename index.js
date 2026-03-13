class wr {
  static {
    this.SYSTEM_NAME = "SS-Helper";
  }
  /**
   * @param pluginName 当前初始化的插件系统名称，例如 'MemoryOS'
   * @param options 设置对象
   */
  constructor(e, r = {}) {
    this.pluginName = e, this.isQuiet = r.quiet ?? !1;
  }
  /**
   * 构建带有级别指示的标准化统一前缀
   */
  getPrefix(e) {
    return `[${wr.SYSTEM_NAME}]-[${this.pluginName}]-[${e}]`;
  }
  /**
   * 内部核心输出函数
   */
  print(e, r, ...n) {
    const o = this.getPrefix(e);
    console.log(
      `%c${o}`,
      `color: #fff; background: ${r}; padding: 2px 5px; border-radius: 4px; font-weight: 600; font-size: 11px;`,
      ...n
    );
  }
  /** 灰色：调试追踪记录，细粒度信息 */
  debug(...e) {
    this.isQuiet || this.print("DEBUG", "#6b7280", ...e);
  }
  /** 蓝色：常规流转信息 */
  info(...e) {
    this.isQuiet || this.print("INFO", "#3b82f6", ...e);
  }
  /** 绿色：任务成功结果 */
  success(...e) {
    this.print("SUCCESS", "#10b981", ...e);
  }
  /** 橙黄：警告、未按预期但不影响流程 */
  warn(...e) {
    this.print("WARN", "#f59e0b", ...e);
  }
  /** 红色：致命错误、异常拦截 */
  error(...e) {
    const r = this.getPrefix("ERROR");
    console.error(
      `%c${r}`,
      "color: #fff; background: #ef4444; padding: 2px 5px; border-radius: 4px; font-weight: 600; font-size: 11px;",
      ...e
    );
  }
  /**
   * 动态修改静默状态
   */
  setQuiet(e) {
    this.isQuiet = e;
  }
}
const Vn = 1;
var Xs = /* @__PURE__ */ ((t) => (t.TIMEOUT = "RPC_TIMEOUT", t.NO_HANDLER = "RPC_NO_HANDLER", t.HANDLER_ERROR = "RPC_HANDLER_ERROR", t.BAD_REQUEST = "RPC_BAD_REQUEST", t.PERMISSION_DENIED = "RPC_PERMISSION_DENIED", t))(Xs || {});
const Pp = {
  // 1. 全局单向广播
  "plugin:broadcast:state_changed": {
    id: "plugin:broadcast:state_changed",
    type: "broadcast",
    owner: "system",
    description: "通用状态更新广播。所有插件均可发出其自身的 enabled 等运行状态改变信息。",
    allowlist: ["*"]
  },
  // 2. 基础微服务 RPC
  "plugin:request:ping": {
    id: "plugin:request:ping",
    type: "rpc",
    owner: "system",
    description: "服务活性测试。用于确认对象服务是否 Alive 及拉取其 capabilities。",
    allowlist: ["*"]
  },
  "plugin:request:hello": {
    id: "plugin:request:hello",
    type: "rpc",
    owner: "stx_llmhub",
    description: "双向测例: LLMHub 专供问候接口。",
    allowlist: ["stx_memory_os", "stx_template"]
    // 仅限这几个可以调
  }
};
function Bp(t, e) {
  const r = Pp[t];
  return !r || !r.allowlist || r.allowlist.length === 0 || r.allowlist.includes("*") ? !0 : r.allowlist.includes(e);
}
const fr = new wr("STXBus-RPC"), xa = /* @__PURE__ */ new Set(), Up = 5e3;
function Hp(t) {
  return xa.has(t) ? !0 : (xa.add(t), setTimeout(() => xa.delete(t), Up), !1);
}
const ya = /* @__PURE__ */ new Map(), bc = 100;
async function Lu(t, e, r, n = {}) {
  const o = window.STX?.bus;
  if (!o)
    throw new Error("STX.bus has not been initialized yet.");
  if (ya.size >= bc)
    throw new Error(`[RPC Guard] Active requests exceeded ${bc}. Request dropped.`);
  const i = crypto.randomUUID(), c = n.timeoutMs ?? 5e3, d = `plugin:response:${i}`, h = {
    v: Vn,
    type: "rpc:req",
    reqId: i,
    topic: t,
    from: r,
    to: n.to,
    ts: Date.now(),
    ttlMs: c,
    data: e
  };
  return ya.set(i, { ts: h.ts }), new Promise((f, b) => {
    let v, E = () => {
    };
    const y = () => {
      clearTimeout(v), E(), ya.delete(i), n.signal && n.signal.removeEventListener("abort", $);
    }, $ = () => {
      y(), b(new Error(`RPC_ABORT: Request ${i} was manually aborted.`));
    };
    if (n.signal) {
      if (n.signal.aborted) return $();
      n.signal.addEventListener("abort", $);
    }
    E = o.once(d, (O) => {
      const L = O?.payload ?? O;
      if (!L || L.type !== "rpc:res") return;
      const D = L;
      y(), fr.info(`[Response <- ${t}] 收到回执, from: ${D.from}, reqId: ${i}, 耗时: ${Date.now() - h.ts}ms`), D.ok ? f(D.data) : b(new Error(`[RPC Error] ${D.error?.code}: ${D.error?.message}`));
    }), v = setTimeout(() => {
      y(), fr.warn(`[Timeout] 请求发往 ${t} 在 ${c}ms 后超时无响应, reqId: ${i}`), b(new Error(`[${Xs.TIMEOUT}] The request ${i} towards ${t} timed out after ${c}ms.`));
    }, c), fr.info(`[Request -> ${t}] 发起调用, to: ${n.to || "ALL"}, reqId: ${i}`), o.emit(t, h);
  });
}
function zp(t, e, r) {
  const n = window.STX?.bus;
  if (!n) return () => {
  };
  const o = async (i) => {
    const c = i?.payload ?? i;
    if (!c || c.type !== "rpc:req") return;
    const d = c;
    if (!(d.to && d.to !== e)) {
      if (!Bp(t, d.from))
        return vc(d.reqId, d.from, e, {
          code: Xs.PERMISSION_DENIED,
          message: `Namespace ${d.from} is strictly NOT allowed to invoke ${t}.`
        });
      if (Hp(d.reqId)) {
        fr.warn(`[RPC Idempotency] 拦截到重复的并发调用，已屏蔽执行, reqId: ${d.reqId}`);
        return;
      }
      try {
        fr.info(`[Handler <- ${t}] 开始接管业务请求, from: ${d.from}, reqId: ${d.reqId}`);
        const h = await r(d.data, d), f = {
          v: Vn,
          type: "rpc:res",
          reqId: d.reqId,
          topic: `plugin:response:${d.reqId}`,
          from: e,
          to: d.from,
          ts: Date.now(),
          ok: !0,
          data: h
        };
        fr.info(`[Response -> ${f.topic}] 业务就绪下发回执, to: ${d.from}, reqId: ${d.reqId}`), n.emit(f.topic, f);
      } catch (h) {
        fr.error(`[Handler Error] 微服务提供方内部发生崩溃抛错, topic: ${t}, reqId: ${d.reqId}`, h), vc(d.reqId, d.from, e, {
          code: Xs.HANDLER_ERROR,
          message: h?.message || "Unknown internal service exception occurred."
        });
      }
    }
  };
  return n.on(t, o);
}
function vc(t, e, r, n) {
  const o = window.STX?.bus;
  if (!o) return;
  const i = {
    v: Vn,
    type: "rpc:res",
    reqId: t,
    topic: `plugin:response:${t}`,
    from: r,
    to: e,
    ts: Date.now(),
    ok: !1,
    error: n
  };
  o.emit(i.topic, i);
}
const Ga = new wr("STXBus-Broadcast");
function Mu(t, e, r) {
  const n = window.STX?.bus;
  if (!n) {
    Ga.warn(`[Broadcast] 尝试发出 ${t}，但 STX.bus 未挂载。`);
    return;
  }
  const o = {
    v: Vn,
    type: "broadcast",
    topic: t,
    from: r,
    ts: Date.now(),
    data: e
  };
  Ga.info(`[Broadcast -> ${t}] 发送广播, from: ${r}`), n.emit(t, o);
}
function Gp(t, e, r) {
  const n = window.STX?.bus;
  if (!n) return () => {
  };
  const o = (i) => {
    const c = i?.payload ?? i;
    if (!c || c.v !== Vn || c.type !== "broadcast")
      return;
    const d = c;
    d.from === r.from && (Ga.info(`[Subscribe <- ${t}] 收到广播消息, from: ${d.from}`), e(d.data, d));
  };
  return n.on(t, o);
}
const Kp = "_SCOPE_ .stx-shared-button{--stx-button-text: var(--ss-theme-text, inherit);--stx-button-bg: var(--ss-theme-surface-3, rgba(197, 160, 89, .14));--stx-button-border: var(--ss-theme-border, rgba(197, 160, 89, .45));--stx-button-hover-bg: var(--ss-theme-list-item-hover-bg, rgba(197, 160, 89, .24));--stx-button-hover-border: var(--ss-theme-border-strong, rgba(197, 160, 89, .68));--stx-button-hover-shadow: inset 0 0 0 1px rgba(197, 160, 89, .26), 0 0 14px rgba(197, 160, 89, .2);--stx-button-focus-border: var(--ss-theme-border-strong, rgba(197, 160, 89, .72));--stx-button-focus-ring: var(--ss-theme-focus-ring, rgba(197, 160, 89, .22));display:inline-flex;align-items:center;justify-content:center;gap:6px;min-height:30px;padding:4px 10px;border:1px solid var(--stx-button-border);border-radius:7px;background:var(--stx-button-bg);color:var(--stx-button-text);font-size:12px;line-height:1.2;white-space:nowrap;box-sizing:border-box;cursor:pointer;transition:border-color .2s ease,background-color .2s ease,box-shadow .2s ease,transform .2s ease,opacity .2s ease}_SCOPE_ .stx-shared-button:hover:not(:disabled){border-color:var(--stx-button-hover-border);background:var(--stx-button-hover-bg);box-shadow:var(--stx-button-hover-shadow)}_SCOPE_ .stx-shared-button:focus-visible{outline:none;border-color:var(--stx-button-focus-border);box-shadow:0 0 0 2px var(--stx-button-focus-ring)}_SCOPE_ .stx-shared-button:disabled{opacity:.58;cursor:not-allowed;box-shadow:none}_SCOPE_ .stx-shared-button-icon{display:inline-flex;align-items:center;justify-content:center;flex:0 0 auto;width:1em;height:1em;font-size:.95em;line-height:1}_SCOPE_ .stx-shared-button-icon>i{font-size:inherit;line-height:inherit}_SCOPE_ .stx-shared-button-label{min-width:0;overflow:hidden;text-overflow:ellipsis}";
function Ou(t) {
  return String(t ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function Nn(t) {
  return Ou(t).replace(/`/g, "&#96;");
}
function jp(...t) {
  return t.filter(Boolean).join(" ");
}
function qp(t) {
  return t ? Object.entries(t).flatMap(([e, r]) => r == null || r === !1 ? [] : r === !0 ? [` ${e}`] : [` ${e}="${Nn(String(r))}"`]).join("") : "";
}
function Fp(t) {
  return t === "secondary" ? "secondary is-secondary" : t === "danger" ? "danger is-danger" : "primary is-primary";
}
function Vp(t) {
  return t ? `<span class="stx-shared-button-icon" aria-hidden="true"><i class="${Nn(t)}"></i></span>` : "";
}
function Yp(t) {
  const e = Vp(t.iconClassName), r = `<span class="stx-shared-button-label">${Ou(t.label)}</span>`, n = t.iconPosition ?? "start";
  return e ? n === "end" ? `${r}${e}` : `${e}${r}` : r;
}
function ct(t) {
  const e = t.variant ?? "primary", r = jp(
    "st-roll-btn",
    "stx-shared-button",
    Fp(e),
    t.className
  ), n = qp(t.attributes), o = t.disabled ? " disabled" : "", i = t.id ? ` id="${Nn(t.id)}"` : "", c = Nn(t.type ?? "button");
  return `<button${i} type="${c}" class="${Nn(r)}" data-ui="shared-button" data-tooltip-anchor="shared-button-control"${o}${n}>${Yp(t)}</button>`;
}
function Wp(t) {
  const e = t.trim() || ":root";
  return Kp.split("_SCOPE_").join(e);
}
const Xp = '_SCOPE_ .stx-shared-checkbox-card{--stx-checkbox-accent: var(--ss-theme-accent);--stx-checkbox-accent-soft: var(--ss-theme-focus-ring);--stx-checkbox-accent-strong: var(--ss-theme-accent-contrast);--stx-checkbox-border: var(--ss-theme-border);--stx-checkbox-surface: var(--ss-theme-surface-2);--stx-checkbox-surface-hover: var(--ss-theme-surface-3);--stx-checkbox-text-off: var(--ss-theme-text-muted);--stx-checkbox-box-border: var(--ss-theme-border);--stx-checkbox-box-bg: var(--ss-theme-surface-2);--stx-checkbox-control-shadow: none;position:relative;cursor:pointer;user-select:none}_SCOPE_ .stx-shared-checkbox-card.is-host-native{display:flex;align-items:center;gap:8px}_SCOPE_ .stx-shared-checkbox-card.is-host-native .stx-shared-checkbox-input{position:relative;inline-size:var(--mainFontSize, 15px);block-size:var(--mainFontSize, 15px);margin:0 0 0 8px;padding:0;border-radius:3px;border:1px solid var(--ss-theme-border, rgba(0, 0, 0, .5));background-color:var(--ss-theme-text, rgb(220, 220, 210));box-shadow:inset 0 0 2px 0 var(--ss-theme-shadow, rgba(0, 0, 0, .5));opacity:1;overflow:visible;pointer-events:auto;clip:auto;white-space:normal;order:2;cursor:pointer;transform:translateY(-.075em);display:grid;place-content:center;filter:brightness(1.2);appearance:none;-webkit-appearance:none}_SCOPE_ .stx-shared-checkbox-card.is-host-native .stx-shared-checkbox-input:before{content:"";inline-size:.65em;block-size:.65em;transform:scale(0);transition:var(--animation-duration, 125ms) transform ease-in-out;box-shadow:inset 1em 1em var(--ss-theme-text-muted, #222);transform-origin:bottom left;clip-path:polygon(14% 44%,0 65%,50% 100%,100% 16%,80% 0,43% 62%)}_SCOPE_ .stx-shared-checkbox-card.is-host-native .stx-shared-checkbox-input:checked:before{transform:scale(1)}_SCOPE_ .stx-shared-checkbox-card.is-host-native .stx-shared-checkbox-input:disabled{cursor:not-allowed;opacity:.6}_SCOPE_ .stx-shared-checkbox-card.is-host-native .stx-shared-checkbox-body{order:1;flex:1;min-width:0}_SCOPE_ .stx-shared-checkbox-card.is-host-native .stx-shared-checkbox-control{display:none!important}_SCOPE_ .stx-shared-checkbox-input{position:absolute;inline-size:1px;block-size:1px;margin:-1px;padding:0;border:0;opacity:0;overflow:hidden;pointer-events:none;clip:rect(0 0 0 0);white-space:nowrap}_SCOPE_ .stx-shared-checkbox-body{display:flex;align-items:center;justify-content:space-between;gap:8px;width:100%;min-width:0}_SCOPE_ .stx-shared-checkbox-copy{min-width:0;flex:1}_SCOPE_ .stx-shared-checkbox-title,_SCOPE_ .stx-shared-checkbox-description{display:block}_SCOPE_ .stx-shared-checkbox-control{display:inline-grid;grid-template-columns:16px minmax(28px,auto);align-items:center;padding:3px 8px 3px 4px;border-radius:999px;border:1px solid var(--stx-checkbox-border);background:var(--stx-checkbox-surface);box-shadow:var(--stx-checkbox-control-shadow);transition:border-color .22s ease,background-color .22s ease,box-shadow .22s ease,transform .22s ease}_SCOPE_ .stx-shared-checkbox-box{display:inline-grid;place-items:center;inline-size:16px;block-size:16px;border-radius:50%;border:1px solid var(--stx-checkbox-box-border);background:var(--stx-checkbox-box-bg);box-shadow:none;transition:border-color .22s ease,background-color .22s ease,box-shadow .22s ease,transform .22s ease}_SCOPE_ .stx-shared-checkbox-icon{inline-size:11px;block-size:11px}_SCOPE_ .stx-shared-checkbox-icon path{stroke:var(--stx-checkbox-accent-strong);stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:18;stroke-dashoffset:18;opacity:0;transition:stroke-dashoffset .24s ease,opacity .18s ease,transform .24s ease;transform:scale(.82);transform-origin:center}_SCOPE_ .stx-shared-checkbox-state{position:relative;display:grid;align-items:center;min-width:2.3em;font-size:10px;line-height:1;letter-spacing:.04em;white-space:nowrap;text-align:right}_SCOPE_ .stx-shared-checkbox-state-label{grid-area:1 / 1;transition:opacity .2s ease,transform .2s ease,color .2s ease}_SCOPE_ .stx-shared-checkbox-state-label.is-off{color:var(--stx-checkbox-text-off)}_SCOPE_ .stx-shared-checkbox-state-label.is-on{color:var(--stx-checkbox-accent-strong);opacity:0;transform:translateY(4px)}_SCOPE_ .stx-shared-checkbox-card:hover .stx-shared-checkbox-control{border-color:color-mix(in srgb,var(--stx-checkbox-accent) 58%,var(--stx-checkbox-border));background-color:var(--stx-checkbox-surface-hover);box-shadow:none;transform:translateY(-1px)}_SCOPE_ .stx-shared-checkbox-card:hover .stx-shared-checkbox-box{border-color:color-mix(in srgb,var(--stx-checkbox-accent) 62%,var(--stx-checkbox-box-border))}_SCOPE_ .stx-shared-checkbox-input:focus-visible+.stx-shared-checkbox-body .stx-shared-checkbox-control{border-color:var(--stx-checkbox-accent);box-shadow:0 0 0 2px var(--stx-checkbox-accent-soft)}_SCOPE_ .stx-shared-checkbox-input:checked+.stx-shared-checkbox-body .stx-shared-checkbox-control{border-color:var(--stx-checkbox-accent);background:var(--stx-checkbox-accent);box-shadow:none}_SCOPE_ .stx-shared-checkbox-input:checked+.stx-shared-checkbox-body .stx-shared-checkbox-box{border-color:var(--stx-checkbox-accent);background:var(--stx-checkbox-accent);box-shadow:none;transform:scale(1.02)}_SCOPE_ .stx-shared-checkbox-input:checked+.stx-shared-checkbox-body .stx-shared-checkbox-icon path{stroke-dashoffset:0;opacity:1;transform:scale(1)}_SCOPE_ .stx-shared-checkbox-input:checked+.stx-shared-checkbox-body .stx-shared-checkbox-state-label.is-off{opacity:0;transform:translateY(-4px)}_SCOPE_ .stx-shared-checkbox-input:checked+.stx-shared-checkbox-body .stx-shared-checkbox-state-label.is-on{opacity:1;transform:translateY(0)}_SCOPE_ .stx-shared-checkbox-input:disabled+.stx-shared-checkbox-body{opacity:.54}_SCOPE_ .stx-shared-checkbox-input:disabled+.stx-shared-checkbox-body .stx-shared-checkbox-control{transform:none;box-shadow:none}_SCOPE_ .stx-shared-checkbox-input:disabled+.stx-shared-checkbox-body .stx-shared-checkbox-box{transform:none}';
function $n(t) {
  return String(t ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function Te(t) {
  return $n(t).replace(/`/g, "&#96;");
}
function ur(...t) {
  return t.filter(Boolean).join(" ");
}
function xc(t) {
  return t ? Object.entries(t).flatMap(([e, r]) => r == null || r === !1 ? [] : r === !0 ? [` ${e}`] : [` ${e}="${Te(String(r))}"`]).join("") : "";
}
function Pu(t) {
  const e = $n(t.checkedLabel ?? "开启"), r = $n(t.uncheckedLabel ?? "关闭");
  return `
    <label
      class="${Te(ur("stx-shared-checkbox-card", t.containerClassName))}"
      data-ui="shared-checkbox"${xc(t.attributes)}
    >
      <input
        id="${Te(t.id)}"
        class="${Te(ur("stx-shared-checkbox-input", t.inputClassName))}"
        type="checkbox"${xc(t.inputAttributes)}
      />
      <span class="${Te(ur("stx-shared-checkbox-body", t.bodyClassName))}">
        <span class="${Te(ur("stx-shared-checkbox-copy", t.copyClassName))}">
          <span class="${Te(ur("stx-shared-checkbox-title", t.titleClassName))}">
            ${$n(t.title)}
          </span>
          ${t.description ? `
          <span class="${Te(
    ur("stx-shared-checkbox-description", t.descriptionClassName)
  )}">
            ${$n(t.description)}
          </span>` : ""}
        </span>
        <span
          class="${Te(ur("stx-shared-checkbox-control", t.controlClassName))}"
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
            <span class="stx-shared-checkbox-state-label is-on">${e}</span>
          </span>
        </span>
      </span>
    </label>
  `;
}
function Jp(t) {
  const e = t.trim() || ":root";
  return Xp.split("_SCOPE_").join(e);
}
const Qp = "_SCOPE_ .stx-shared-input{width:auto;background:var(--ss-theme-surface-2, rgba(0, 0, 0, .28));color:var(--ss-theme-text, inherit);border:1px solid var(--ss-theme-border, rgba(197, 160, 89, .36));border-radius:8px;box-sizing:border-box;font-size:12px;transition:border-color .2s ease,box-shadow .2s ease,background-color .2s ease,opacity .2s ease}_SCOPE_ .stx-shared-input::placeholder{color:color-mix(in srgb,var(--ss-theme-text, #dcdcd2) 60%,transparent)}_SCOPE_ input.stx-shared-input{min-height:30px;padding:4px 8px}_SCOPE_ input.stx-shared-input.st-roll-search{min-height:32px}_SCOPE_ textarea.stx-shared-input{width:100%;min-height:220px;padding:8px;line-height:1.5;resize:vertical}_SCOPE_ .stx-shared-input:hover:not(:disabled):not([readonly]){border-color:var(--ss-theme-border-strong, rgba(197, 160, 89, .58));background-color:var(--ss-theme-surface-3, rgba(0, 0, 0, .34));box-shadow:0 0 0 1px color-mix(in srgb,var(--ss-theme-focus-ring, rgba(197, 160, 89, .22)) 82%,transparent)}_SCOPE_ .stx-shared-input:focus{outline:none}_SCOPE_ .stx-shared-input:focus-visible,_SCOPE_ .stx-shared-input:focus{border-color:var(--ss-theme-border-strong, rgba(197, 160, 89, .72));box-shadow:0 0 0 2px var(--ss-theme-focus-ring, rgba(197, 160, 89, .22))}_SCOPE_ .stx-shared-input:disabled,_SCOPE_ .stx-shared-input[readonly]{cursor:default}_SCOPE_ .stx-shared-input:disabled{opacity:.6}";
function Bu(t) {
  return String(t ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function Fr(t) {
  return Bu(t).replace(/`/g, "&#96;");
}
function Zp(...t) {
  return t.filter(Boolean).join(" ");
}
function tf(t) {
  return t ? Object.entries(t).flatMap(([e, r]) => r == null || r === !1 ? [] : r === !0 ? [` ${e}`] : [` ${e}="${Fr(String(r))}"`]).join("") : "";
}
function ef(t, e) {
  return t === "textarea" ? "st-roll-textarea" : e === "search" ? "st-roll-search" : "st-roll-input";
}
function Gt(t) {
  const e = t.tag ?? "input", r = t.type ?? "text", n = Zp(ef(e, r), "stx-shared-input", t.className), o = t.id ? ` id="${Fr(t.id)}"` : "", i = t.disabled ? " disabled" : "", c = t.readOnly ? " readonly" : "", d = tf(t.attributes);
  if (e === "textarea")
    return `<textarea${o} class="${Fr(n)}" data-ui="shared-input" data-tooltip-anchor="shared-input-control"${i}${c}${d}>${Bu(String(t.value ?? ""))}</textarea>`;
  const h = ` value="${Fr(String(t.value ?? ""))}"`;
  return `<input${o} type="${Fr(r)}" class="${Fr(n)}" data-ui="shared-input" data-tooltip-anchor="shared-input-control"${h}${i}${c}${d} />`;
}
function rf(t) {
  const e = t.trim() || ":root";
  return Qp.split("_SCOPE_").join(e);
}
const nf = "_SCOPE_ .stx-shared-select{position:relative;display:inline-block;width:min(100%,240px);min-width:182px;max-width:100%;color:var(--ss-theme-text, inherit);vertical-align:middle}_SCOPE_ .stx-shared-select[data-shared-select-disabled=true]{opacity:.72}_SCOPE_ .stx-shared-select-native{position:absolute;inset:0;width:100%;height:100%;margin:0;opacity:0;pointer-events:none}_SCOPE_ .stx-shared-select-trigger{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:10px;width:100%;min-height:30px;padding:4px 10px;border:1px solid var(--ss-theme-border, rgba(197, 160, 89, .36));border-radius:8px;background:linear-gradient(135deg,#ffffff12,#ffffff05),var(--ss-theme-surface-2, rgba(0, 0, 0, .28));color:var(--ss-theme-text, inherit);box-sizing:border-box;cursor:pointer;transition:border-color .2s ease,box-shadow .2s ease,background-color .2s ease,transform .2s ease}_SCOPE_ .stx-shared-select-trigger:disabled{cursor:not-allowed}_SCOPE_ .stx-shared-select-label{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-align:left}_SCOPE_ .stx-shared-select-indicator{display:inline-grid;place-items:center;width:18px;height:18px;color:currentColor;opacity:.82;transition:transform .2s ease,opacity .2s ease}_SCOPE_ .stx-shared-select-indicator svg{width:12px;height:12px}_SCOPE_ .stx-shared-select.is-open .stx-shared-select-indicator{transform:rotate(180deg);opacity:1}_SCOPE_ .stx-shared-select-list,.stx-shared-select-list{position:fixed;left:0;top:0;z-index:40000;display:none;margin:0;padding:5px;border:1px solid var(--ss-theme-border, rgba(255, 255, 255, .18));border-radius:12px;background:radial-gradient(120% 130% at 100% 0%,rgba(197,160,89,.12),transparent 58%),var(--stx-shared-select-panel-bg, var(--ss-theme-panel-bg, rgba(18, 16, 18, .78)));-webkit-backdrop-filter:var( --stx-shared-select-panel-backdrop-filter, var(--ss-theme-backdrop-filter, blur(6px)) );backdrop-filter:var( --stx-shared-select-panel-backdrop-filter, var(--ss-theme-backdrop-filter, blur(6px)) );box-shadow:0 18px 40px #0000004d,0 0 0 1px #ffffff0a;box-sizing:border-box;overflow:auto;color:var(--ss-theme-text, inherit)}_SCOPE_ .stx-shared-select.is-open .stx-shared-select-list,_SCOPE_ .stx-shared-select-list.is-open,.stx-shared-select-list.is-open{display:block}_SCOPE_ .stx-shared-select-option,.stx-shared-select-list .stx-shared-select-option{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:8px;min-height:30px;padding:5px 9px;border:1px solid transparent;border-radius:8px;color:inherit;font-size:13px;line-height:1.35;box-sizing:border-box;cursor:pointer;user-select:none;transition:border-color .18s ease,background-color .18s ease,box-shadow .18s ease,transform .18s ease}_SCOPE_ .stx-shared-select-option+.stx-shared-select-option,.stx-shared-select-list .stx-shared-select-option+.stx-shared-select-option{margin-top:4px}_SCOPE_ .stx-shared-select-option[data-shared-select-disabled=true],.stx-shared-select-list .stx-shared-select-option[data-shared-select-disabled=true]{opacity:.45;cursor:not-allowed}_SCOPE_ .stx-shared-select-option-label,.stx-shared-select-list .stx-shared-select-option-label{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-align:left}_SCOPE_ .stx-shared-select-option-mark,.stx-shared-select-list .stx-shared-select-option-mark{width:12px;height:12px;border-radius:999px;border:1px solid transparent;opacity:0;transform:scale(.78);transition:opacity .18s ease,transform .18s ease,border-color .18s ease,background-color .18s ease}_SCOPE_ .stx-shared-select-option.is-highlighted:not([data-shared-select-disabled=true]),.stx-shared-select-list .stx-shared-select-option.is-highlighted:not([data-shared-select-disabled=true]){border-color:var(--ss-theme-border-strong, rgba(197, 160, 89, .58));background:var(--ss-theme-list-item-hover-bg, rgba(197, 160, 89, .16));box-shadow:0 0 0 1px #ffffff08;transform:translateY(-1px)}_SCOPE_ .stx-shared-select-option.is-selected,.stx-shared-select-list .stx-shared-select-option.is-selected{border-color:var(--ss-theme-border-strong, rgba(197, 160, 89, .74));background:var(--ss-theme-list-item-active-bg, rgba(197, 160, 89, .24));box-shadow:0 0 0 1px #c5a0593d}_SCOPE_ .stx-shared-select-option.is-selected .stx-shared-select-option-mark,.stx-shared-select-list .stx-shared-select-option.is-selected .stx-shared-select-option-mark{opacity:1;transform:scale(1);border-color:var(--ss-theme-accent, #c5a059);background:radial-gradient(circle at 50% 50%,var(--ss-theme-accent-contrast, #ffeac0) 0 28%,transparent 34%),var(--ss-theme-accent, #c5a059)}_SCOPE_ .stx-shared-select:not([data-shared-select-disabled=true]) .stx-shared-select-trigger:hover{border-color:var(--ss-theme-border-strong, rgba(197, 160, 89, .58));background:linear-gradient(135deg,#ffffff1a,#ffffff08),var(--ss-theme-surface-3, rgba(0, 0, 0, .34));box-shadow:0 0 0 1px var(--ss-theme-focus-ring, rgba(197, 160, 89, .22))}_SCOPE_ .stx-shared-select.is-open .stx-shared-select-trigger{border-color:var(--ss-theme-border-strong, rgba(197, 160, 89, .72));box-shadow:0 0 0 2px var(--ss-theme-focus-ring, rgba(197, 160, 89, .22)),0 10px 22px #00000029}_SCOPE_ .stx-shared-select-trigger:focus-visible{outline:none;border-color:var(--ss-theme-border-strong, rgba(197, 160, 89, .72));box-shadow:0 0 0 2px var(--ss-theme-focus-ring, rgba(197, 160, 89, .22))}_SCOPE_ .stx-shared-select-list::-webkit-scrollbar,.stx-shared-select-list::-webkit-scrollbar{width:8px}_SCOPE_ .stx-shared-select-list::-webkit-scrollbar-thumb,.stx-shared-select-list::-webkit-scrollbar-thumb{border-radius:999px;background:#ffffff29}", fi = {
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
}, sf = Object.entries(fi);
function of(t, e) {
  for (const [r, n] of sf)
    t.style.setProperty(n, e[r]);
}
function af(t) {
  for (const e of Object.values(fi))
    t.style.removeProperty(e);
}
const Uu = {
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
}, lf = {
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
}, cf = {
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
}, uf = {
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
}, df = {
  default: Uu,
  dark: lf,
  light: cf,
  host: uf
};
function Vr(t) {
  return df[t] ?? Uu;
}
const Hu = "stx_sdk_theme_global_v2";
function Yn(t) {
  const e = String(t ?? "").trim().toLowerCase();
  return e === "dark" ? "dark" : e === "light" ? "light" : e === "host" || e === "tavern" ? "host" : "default";
}
function mf() {
  try {
    const t = String(globalThis.localStorage?.getItem(Hu) ?? "").trim();
    return t ? Yn(t) : "default";
  } catch {
    return "default";
  }
}
function hf(t) {
  try {
    globalThis.localStorage?.setItem(Hu, t);
  } catch {
  }
}
function on() {
  const t = globalThis;
  if (t.__ssThemeKernelV2) return t.__ssThemeKernelV2;
  const e = {
    initialized: !1,
    state: { themeId: "default" },
    listeners: /* @__PURE__ */ new Set(),
    hosts: /* @__PURE__ */ new Set()
  };
  return t.__ssThemeKernelV2 = e, e;
}
function zu(t, e) {
  t.setAttribute("data-ss-theme", e), of(t, Vr(e));
}
function pf(t) {
  const e = on();
  for (const r of Array.from(e.hosts)) {
    if (!r.isConnected) {
      e.hosts.delete(r);
      continue;
    }
    zu(r, t.themeId);
  }
  for (const r of e.listeners)
    r(t);
}
function yo() {
  const t = on();
  return t.initialized || (t.state = { themeId: mf() }, t.initialized = !0), t.state;
}
function gi() {
  return yo();
}
function ff(t) {
  const e = on();
  yo();
  const r = Yn(t);
  return r === e.state.themeId || (e.state = { themeId: r }, hf(r), pf(e.state)), e.state;
}
function bi(t) {
  const e = on();
  return e.listeners.add(t), () => {
    e.listeners.delete(t);
  };
}
function gf(t) {
  const e = on(), r = yo();
  e.hosts.add(t), zu(t, r.themeId);
}
function bf(t) {
  on().hosts.delete(t), t.removeAttribute("data-ss-theme"), af(t);
}
function So(t) {
  gf(t);
}
function yc(t) {
  bf(t);
}
function vf(t) {
  const e = t.split(",").map((r) => r.trim()).filter((r) => r.length > 0);
  return e.length > 0 ? e : [":root"];
}
function xf(t, e = "") {
  return t.map((r) => `${r}${e}`).join(`,
    `);
}
function yf(t) {
  return Object.entries(fi).map(([e, r]) => `      ${r}: ${t[e]};`).join(`
`);
}
function Hr(t, e, r, n) {
  return `
    ${xf(t, e)} {
      color: var(--ss-theme-text, inherit);
${yf(r)}
${n ? n + `
` : ""}    }`;
}
function Sa(t = {}) {
  const e = [
    "      --SmartThemeBodyColor: var(--ss-theme-text);",
    "      --SmartThemeEmColor: var(--ss-theme-text-muted);",
    "      --SmartThemeQuoteColor: var(--ss-theme-accent);",
    "      --SmartThemeQuoteTextColor: var(--ss-theme-accent-contrast);",
    "      --SmartThemeBorderColor: var(--ss-theme-border);"
  ];
  return t.shadowWidth !== void 0 && e.push(`      --shadowWidth: ${t.shadowWidth};`), e.join(`
`);
}
function Sf(t) {
  const e = vf(t), r = Hr(e, "", Vr("default")), n = Hr(
    e,
    '[data-ss-theme="default"]',
    Vr("default"),
    Sa()
  ), o = Hr(
    e,
    '[data-ss-theme="dark"]',
    Vr("dark"),
    Sa()
  ), i = Hr(
    e,
    '[data-ss-theme="light"]',
    Vr("light"),
    Sa({ shadowWidth: "0" })
  ), c = Vr("host"), d = Hr(
    e,
    '[data-ss-theme="host"]',
    c
  ), h = Hr(
    e,
    '[data-ss-theme="tavern"]',
    c
  );
  return `${r}
${n}
${o}
${i}
${d}
${h}`;
}
let wt = null, Sc = !1, tn = 0, As = 0;
function vi(t, e) {
  if (e === void 0) {
    console.info(`[SS-Helper][SharedSelectTrace] ${t}`);
    return;
  }
  console.info(`[SS-Helper][SharedSelectTrace] ${t}`, e);
}
function zr(t) {
  t.stopPropagation();
}
function Bs(t) {
  return String(t ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function Xt(t) {
  return Bs(t).replace(/`/g, "&#96;");
}
function Gr(...t) {
  return t.filter(Boolean).join(" ");
}
function $s(t) {
  return t ? Object.entries(t).flatMap(([e, r]) => r == null || r === !1 ? [] : r === !0 ? [` ${e}`] : [` ${e}="${Xt(String(r))}"`]).join("") : "";
}
function Ec(t, e) {
  return `${t}__${e}`;
}
function Be(t) {
  const e = String(t.value ?? ""), r = t.options.find((c) => String(c.value) === e), n = r?.label ?? t.options[0]?.label ?? "", o = Ec(t.id, "trigger"), i = Ec(t.id, "listbox");
  return `
    <div
      class="${Xt(Gr("stx-shared-select", t.containerClassName))}"
      data-ui="shared-select"${$s(t.attributes)}
    >
      <select
        id="${Xt(t.id)}"
        class="${Xt(Gr("st-roll-select", "stx-shared-select-native", t.selectClassName))}"
        tabindex="-1"
        aria-hidden="true"${$s(t.selectAttributes)}
      >
        ${t.options.map((c, d) => {
    const h = String(c.value ?? ""), f = h === e || !r && !e && d === 0;
    return `<option value="${Xt(h)}"${c.disabled ? " disabled" : ""}${f ? " selected" : ""}${$s(c.attributes)}>${Bs(c.label)}</option>`;
  }).join("")}
      </select>
      <button
        id="${Xt(o)}"
        type="button"
        class="${Xt(Gr("stx-shared-select-trigger", t.triggerClassName))}"
        data-tooltip-anchor="shared-select-trigger"
        aria-haspopup="listbox"
        aria-expanded="false"
        aria-controls="${Xt(i)}"${$s(t.triggerAttributes)}
      >
        <span class="${Xt(Gr("stx-shared-select-label", t.labelClassName))}">${Bs(n)}</span>
        <span class="stx-shared-select-indicator" aria-hidden="true">
          <svg viewBox="0 0 16 16" fill="none">
            <path d="M4 6.5L8 10.5L12 6.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path>
          </svg>
        </span>
      </button>
      <div
        id="${Xt(i)}"
        class="${Xt(Gr("stx-shared-select-list", t.listClassName))}"
        role="listbox"
        aria-labelledby="${Xt(o)}"
        hidden
      >
        ${t.options.map((c, d) => {
    const h = String(c.value ?? "");
    return `
          <div
            class="${Xt(Gr("stx-shared-select-option", t.optionClassName))}"
            role="option"
            aria-selected="false"
            data-shared-select-option-index="${d}"
            data-shared-select-option-value="${Xt(h)}"
            data-shared-select-disabled="${c.disabled ? "true" : "false"}"
          >
            <span class="stx-shared-select-option-label">${Bs(c.label)}</span>
            <span class="stx-shared-select-option-mark" aria-hidden="true"></span>
          </div>`;
  }).join("")}
      </div>
    </div>
  `;
}
function Ef(t) {
  const e = t.trim() || ":root";
  return nf.split("_SCOPE_").join(e);
}
function ve(t) {
  const e = t.querySelector("select.stx-shared-select-native"), r = t.querySelector("button.stx-shared-select-trigger"), n = t.querySelector(".stx-shared-select-label"), o = String(r?.getAttribute("aria-controls") ?? "").trim(), i = (o ? document.getElementById(o) : null) || t.querySelector(".stx-shared-select-list");
  if (!e || !r || !n || !i) return null;
  const c = Array.from(i.querySelectorAll(".stx-shared-select-option"));
  return { root: t, select: e, trigger: r, label: n, list: i, options: c };
}
function xi(t) {
  const e = t.select.selectedIndex;
  return e >= 0 && e < t.options.length ? e : t.options.findIndex((r) => r.dataset.sharedSelectOptionValue === t.select.value);
}
function Eo(t) {
  const e = Number(t.dataset.sharedSelectHighlightIndex ?? "");
  return Number.isFinite(e) ? Math.floor(e) : -1;
}
function _c(t, e) {
  const r = t.options[e];
  if (!r) return;
  const n = t.list.getBoundingClientRect(), o = r.getBoundingClientRect();
  if (o.top < n.top) {
    t.list.scrollTop -= n.top - o.top;
    return;
  }
  o.bottom > n.bottom && (t.list.scrollTop += o.bottom - n.bottom);
}
function gr(t, e, r) {
  if (Eo(t.root) === e) {
    r && e >= 0 && _c(t, e);
    return;
  }
  t.options.forEach((o, i) => {
    o.classList.toggle("is-highlighted", i === e);
  }), t.root.dataset.sharedSelectHighlightIndex = String(e), r && e >= 0 && _c(t, e);
}
function Gu(t) {
  return t.options.map((e, r) => ({ item: e, index: r })).filter(({ item: e }) => e.dataset.sharedSelectDisabled !== "true").map(({ index: e }) => e);
}
function Tc(t, e, r) {
  const n = Gu(t);
  if (!n.length) return -1;
  if (e < 0)
    return r > 0 ? n[0] : n[n.length - 1];
  let o = e;
  for (let i = 0; i < t.options.length; i += 1)
    if (o += r, o < 0 && (o = t.options.length - 1), o >= t.options.length && (o = 0), t.options[o]?.dataset.sharedSelectDisabled !== "true")
      return o;
  return e;
}
function Ka(t, e) {
  const r = Gu(t);
  return r.length ? e === "start" ? r[0] : r[r.length - 1] : -1;
}
function _f(t) {
  return t.closest("dialog[open]") || document.querySelector("dialog[open]") || document.body;
}
function Tf(t) {
  const e = _f(t.root);
  t.list.parentElement !== e && e.appendChild(t.list);
  const r = !t.root.contains(t.list);
  t.list.dataset.sharedSelectDetached = r ? "true" : "false";
}
function yi(t) {
  t.list.dataset.sharedSelectDetached === "true" && So(t.list);
}
function Si(t) {
  Tf(t);
  const e = t.trigger.getBoundingClientRect(), r = window.innerWidth, n = window.innerHeight, o = Math.max(e.width, 160), i = t.list.scrollHeight, c = Math.min(Math.max(i, 120), 280), d = Math.max(0, n - e.bottom - 8), h = Math.max(0, e.top - 8), f = d < Math.min(c, 180) && h > d, b = Math.max(120, f ? h - 4 : d - 4), v = Math.min(c, b), E = Math.min(Math.max(o, 180), r - 16), y = Math.min(Math.max(8, e.left), Math.max(8, r - E - 8)), $ = f ? Math.max(8, e.top - v - 4) : Math.min(n - v - 8, e.bottom + 4);
  t.list.style.left = `${Math.round(y)}px`, t.list.style.top = `${Math.round($)}px`, t.list.style.minWidth = `${Math.round(o)}px`, t.list.style.maxWidth = `${Math.round(E)}px`, t.list.style.maxHeight = `${Math.round(Math.max(120, b))}px`, t.root.dataset.sharedSelectPlacement = f ? "top" : "bottom";
}
function ja() {
  tn || (tn = window.requestAnimationFrame(() => {
    tn = 0;
    const t = wt;
    if (!t) return;
    if (!t.isConnected) {
      wt = null;
      return;
    }
    const e = ve(t);
    if (!e) {
      wt = null;
      return;
    }
    Si(e);
  }));
}
function kf() {
  As && window.cancelAnimationFrame(As), As = window.requestAnimationFrame(() => {
    As = 0;
    const t = wt;
    if (vi("theme refresh frame fired", {
      hasOpenRoot: !!t,
      openRootConnected: !!t?.isConnected
    }), !t || !t.isConnected) {
      wt = null;
      return;
    }
    const e = ve(t);
    if (!e) {
      wt = null;
      return;
    }
    yi(e), ja();
  });
}
function Tr(t, e) {
  if (!t) return;
  const r = ve(t);
  if (!r) {
    wt === t && (wt = null);
    return;
  }
  t.classList.remove("is-open"), r.trigger.setAttribute("aria-expanded", "false"), r.list.classList.remove("is-open"), r.list.hidden = !0, t.dataset.sharedSelectHighlightIndex = String(xi(r)), wt === t && (wt = null), tn && (window.cancelAnimationFrame(tn), tn = 0), e && r.trigger.focus();
}
function Us(t) {
  wt && wt !== t && Tr(wt, !1);
  const e = ve(t);
  if (!e || e.select.disabled) return;
  const r = xi(e), n = r >= 0 ? r : Ka(e, "start");
  wt = t, t.classList.add("is-open"), e.list.classList.add("is-open"), e.list.hidden = !1, e.trigger.setAttribute("aria-expanded", "true"), gr(e, n, !1), Si(e), yi(e);
}
function wf(t) {
  if (t.classList.contains("is-open")) {
    Tr(t, !0);
    return;
  }
  Us(t);
}
function br(t) {
  const e = ve(t);
  if (!e) return;
  const r = xi(e), n = e.select.options[r] || e.select.options[0] || null;
  e.label.textContent = n?.textContent?.trim() || "", e.options.forEach((o, i) => {
    const c = i === r;
    o.classList.toggle("is-selected", c), o.setAttribute("aria-selected", c ? "true" : "false");
  }), e.trigger.disabled = e.select.disabled, e.root.dataset.sharedSelectDisabled = e.select.disabled ? "true" : "false", e.root.dataset.sharedSelectHighlightIndex = String(r >= 0 ? r : -1), e.root.classList.contains("is-open") && (Si(e), yi(e), gr(e, Eo(e.root), !1));
}
function Ku(t, e) {
  if (vi("commitSharedSelectValue", {
    selectId: t.select.id,
    previousValue: t.select.value,
    nextValue: e
  }), t.select.value === e) {
    br(t.root), Tr(t.root, !0);
    return;
  }
  t.select.value = e, t.select.dispatchEvent(new Event("input", { bubbles: !0 })), t.select.dispatchEvent(new Event("change", { bubbles: !0 })), br(t.root), Tr(t.root, !0);
}
function If(t, e) {
  const r = ve(t);
  if (!r || r.select.disabled) return;
  const n = t.classList.contains("is-open"), o = Eo(t);
  if (e.key === "Tab") {
    n && Tr(t, !1);
    return;
  }
  if (e.key === "Escape") {
    if (!n) return;
    e.preventDefault(), Tr(t, !0);
    return;
  }
  if (e.key === "ArrowDown") {
    if (e.preventDefault(), !n) {
      Us(t);
      return;
    }
    gr(r, Tc(r, o, 1), !0);
    return;
  }
  if (e.key === "ArrowUp") {
    if (e.preventDefault(), !n) {
      Us(t);
      return;
    }
    gr(r, Tc(r, o, -1), !0);
    return;
  }
  if (e.key === "Home") {
    if (!n) return;
    e.preventDefault(), gr(r, Ka(r, "start"), !0);
    return;
  }
  if (e.key === "End") {
    if (!n) return;
    e.preventDefault(), gr(r, Ka(r, "end"), !0);
    return;
  }
  if (e.key === "Enter" || e.key === " ") {
    if (e.preventDefault(), !n) {
      Us(t);
      return;
    }
    const i = r.options[o];
    if (!i || i.dataset.sharedSelectDisabled === "true") return;
    Ku(r, String(i.dataset.sharedSelectOptionValue ?? ""));
  }
}
function Af() {
  Sc || (Sc = !0, document.addEventListener("pointerdown", (t) => {
    const e = wt;
    if (!e) return;
    if (!e.isConnected) {
      wt = null;
      return;
    }
    const r = t.target, n = ve(e);
    r && (e.contains(r) || n?.list.contains(r)) || Tr(e, !1);
  }), document.addEventListener(
    "scroll",
    () => {
      const t = wt;
      if (!t) return;
      if (!t.isConnected) {
        wt = null;
        return;
      }
      if (!ve(t)) {
        wt = null;
        return;
      }
      ja();
    },
    !0
  ), window.addEventListener("resize", () => {
    const t = wt;
    if (!t) return;
    if (!t.isConnected) {
      wt = null;
      return;
    }
    if (!ve(t)) {
      wt = null;
      return;
    }
    ja();
  }), bi(() => {
    const t = wt;
    vi("subscribeTheme fired", {
      hasOpenRoot: !!t,
      openRootConnected: !!t?.isConnected
    }), !(!t || !t.isConnected) && kf();
  }));
}
function ju(t) {
  if (t.dataset.sharedSelectBound === "1") {
    br(t);
    return;
  }
  const e = ve(t);
  e && (t.dataset.sharedSelectBound = "1", Af(), e.trigger.addEventListener("pointerdown", (r) => {
    zr(r);
  }), e.trigger.addEventListener("mousedown", (r) => {
    zr(r);
  }), e.trigger.addEventListener("click", (r) => {
    zr(r), wf(t);
  }), e.trigger.addEventListener("keydown", (r) => {
    If(t, r);
  }), e.select.addEventListener("input", () => {
    br(t);
  }), e.select.addEventListener("change", () => {
    br(t);
  }), e.list.addEventListener("pointermove", (r) => {
    const o = r.target?.closest(".stx-shared-select-option");
    if (!o) return;
    const i = Number(o.dataset.sharedSelectOptionIndex ?? "");
    if (!Number.isFinite(i) || o.dataset.sharedSelectDisabled === "true") return;
    const c = Math.floor(i);
    c !== Eo(e.root) && gr(e, c, !1);
  }), e.list.addEventListener("pointerdown", (r) => {
    zr(r);
    const o = r.target?.closest(".stx-shared-select-option");
    if (!o || o.dataset.sharedSelectDisabled === "true" || r.button !== 0) return;
    r.preventDefault();
    const i = String(o.dataset.sharedSelectOptionValue ?? "");
    Ku(e, i);
  }), e.list.addEventListener("mousedown", (r) => {
    zr(r);
  }), e.list.addEventListener("click", (r) => {
    zr(r), r.target?.closest(".stx-shared-select-option") && r.preventDefault();
  }), br(t));
}
function qu(t) {
  t && t.querySelectorAll('[data-ui="shared-select"]').forEach((e) => {
    ju(e);
  });
}
function Ei(t) {
  t && t.querySelectorAll('[data-ui="shared-select"]').forEach((e) => {
    ju(e), br(e);
  });
}
function qa(t) {
  return String(t ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function fe(t) {
  return qa(t).replace(/`/g, "&#96;");
}
function wn(...t) {
  return t.filter(Boolean).join(" ");
}
function $f(t) {
  return t ? Object.entries(t).flatMap(([e, r]) => r == null || r === !1 ? [] : r === !0 ? [` ${e}`] : [` ${e}="${fe(String(r))}"`]).join("") : "";
}
function Rf(t) {
  const e = qa(t.title), r = t.badgeId && t.badgeText != null ? `<span id="${fe(t.badgeId)}" class="${fe(
    wn("stx-setting-badge", t.badgeClassName)
  )}">${qa(String(t.badgeText))}</span>` : "";
  return `
    <div class="${fe(wn("inline-drawer", "stx-setting-shell", t.shellClassName))}"${$f(
    t.attributes
  )}>
      <div class="${fe(
    wn("inline-drawer-toggle", "inline-drawer-header", "stx-setting-head", t.headerClassName)
  )}" id="${fe(t.drawerToggleId)}">
        <div class="${fe(wn("stx-setting-head-title", t.titleClassName))}">
          <span>${e}</span>
          ${r}
        </div>
        <div
          id="${fe(t.drawerIconId)}"
          class="inline-drawer-icon fa-solid fa-circle-chevron-down down interactable"
          tabindex="0"
          role="button"
        ></div>
      </div>

      <div class="${fe(
    wn("inline-drawer-content", "stx-setting-content", t.contentClassName)
  )}" id="${fe(t.drawerContentId)}" style="display:none;">
        ${t.contentHtml}
      </div>
    </div>
  `;
}
function Cf(t) {
  const e = t.trim() || ":root";
  return `
    ${e} .stx-setting-shell {
      width: 100%;
    }

    ${e} .stx-setting-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      min-width: 0;
      cursor: pointer;
      user-select: none;
    }

    ${e} .stx-setting-head-title {
      display: flex;
      align-items: center;
      gap: 6px;
      min-width: 0;
      font-weight: 700;
    }

    ${e} .stx-setting-badge {
      font-size: 11px;
      line-height: 1;
      font-weight: 700;
      letter-spacing: 0.3px;
    }

    ${e} .stx-setting-content {
      display: block;
    }
  `;
}
function kc(t, e) {
  t instanceof HTMLElement && t.classList.add("stx-setting-hydrated");
}
var Df = "./assets/images/ROLL-LOGO.png";
const Nf = new URL(Df, import.meta.url).href;
function Vt(t, e, r, n, o) {
  return Pu({
    id: t,
    title: e,
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
function Lf(t) {
  const e = `
        <div class="st-roll-filters flex-container">
          ${Gt({
    id: t.searchId,
    type: "search",
    className: "flex1",
    attributes: {
      placeholder: "搜索设置",
      "data-tip": "按关键词筛选设置项。"
    }
  })}
        </div>

        <div class="st-roll-tabs">
          <button id="${t.tabMainId}" type="button" class="st-roll-tab is-active" data-tip="查看主设置。">
            <i class="fa-solid fa-gear"></i><span>主设置</span>
          </button>
          <button id="${t.tabSkillId}" type="button" class="st-roll-tab" data-tip="查看技能设置。">
            <i class="fa-solid fa-bolt"></i><span>技能</span>
          </button>
          <button id="${t.tabRuleId}" type="button" class="st-roll-tab" data-tip="查看规则设置。">
            <i class="fa-solid fa-scroll"></i><span>规则</span>
          </button>
          <button id="${t.tabAboutId}" type="button" class="st-roll-tab" data-tip="查看插件信息。">
            <i class="fa-solid fa-circle-info"></i><span>关于</span>
          </button>
        </div>

        <div id="${t.panelMainId}" class="st-roll-panel">
          <div class="st-roll-divider"><i class="fa-solid fa-power-off"></i><span>基础开关</span><div class="st-roll-divider-line"></div></div>

          ${Vt(
    t.enabledId,
    "启用事件骰子系统",
    "总开关。关掉后不再做事件检定。",
    "enable event dice plugin",
    "事件骰子系统总开关。"
  )}

          <div class="st-roll-item st-roll-search-item" data-st-roll-search="theme ui dark light tavern">
            <div class="st-roll-item-main">
              <div class="st-roll-item-title">界面主题</div>
              <div class="st-roll-item-desc">切换设置界面外观：默认、深色、亮色或酒馆。</div>
            </div>
            <div class="st-roll-row">
              ${Be({
    id: t.themeId,
    value: "default",
    containerClassName: "st-roll-shared-select",
    options: [
      { value: "default", label: "默认 UI" },
      { value: "dark", label: "深色 UI" },
      { value: "light", label: "亮色 UI" },
      { value: "tavern", label: "酒馆 UI" }
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
              ${Be({
    id: t.scopeId,
    value: "protagonist_only",
    containerClassName: "st-roll-shared-select",
    attributes: {
      "data-tip": "设置事件作用范围。"
    },
    options: [
      { value: "protagonist_only", label: "仅主角事件" },
      { value: "all", label: "全部事件" }
    ]
  })}
            </div>
          </div>

          <div class="st-roll-divider"><i class="fa-solid fa-robot"></i><span>AI 协议</span><div class="st-roll-divider-line"></div></div>

          ${Vt(
    t.ruleId,
    "默认发送规则给 AI",
    "发送前自动加规则和摘要，减少跑偏。",
    "auto send rule inject",
    "发送前自动附加规则。"
  )}

          ${Vt(
    t.aiRollModeId,
    "允许 AI 决定自动/手动掷骰",
    "开：AI 可自动掷骰。关：你手动掷骰。",
    "rollMode auto manual",
    "让 AI 决定自动或手动掷骰。"
  )}

          ${Vt(
    t.aiRoundControlId,
    "是否开启持续轮",
    "开：AI 决定何时结束本轮。关：每次事件都开新轮。",
    "ai round end round_control end_round",
    "让 AI 决定何时结束本轮。"
  )}

          ${Vt(
    t.dynamicDcReasonId,
    "启用动态 DC 解释",
    "显示这次难度变化的原因。",
    "dynamic dc reason",
    "显示难度变化原因。"
  )}

          ${Vt(
    t.statusSystemEnabledId,
    "启用状态异常系统",
    "状态会影响后续检定结果。",
    "status debuff apply remove clear",
    "开启状态效果。"
  )}

          <div class="st-roll-item st-roll-search-item" data-st-roll-search="status editor">
            <div class="st-roll-item-main">
              <div class="st-roll-item-title">状态编辑器</div>
              <div class="st-roll-item-desc">可手动增删改当前聊天状态。</div>
            </div>
            <div class="st-roll-actions">
              ${ct({
    id: t.statusEditorOpenId,
    label: "打开编辑器",
    attributes: {
      "data-tip": "打开状态编辑器，按当前聊天管理状态。"
    }
  })}
            </div>
          </div>

          <div class="st-roll-divider"><i class="fa-solid fa-dice"></i><span>掷骰规则</span><div class="st-roll-divider-line"></div></div>

          ${Vt(
    t.explodingEnabledId,
    "启用爆骰",
    "满足条件时可追加掷骰。",
    "explode",
    "开启爆骰规则。"
  )}

          ${Vt(
    t.advantageEnabledId,
    "启用优势/劣势",
    "开启后按优势/劣势取高或取低。",
    "advantage disadvantage",
    "开启优势与劣势规则。"
  )}

          ${Vt(
    t.dynamicResultGuidanceId,
    "启用动态结果引导",
    "掷骰后给 AI 一句结果提示。",
    "dynamic result guidance",
    "给 AI 追加结果提示。"
  )}

          <div class="st-roll-item st-roll-search-item" data-st-roll-search="dice sides allowed">
            <div class="st-roll-item-main">
              <div class="st-roll-item-title">限制 AI 可用骰子面数</div>
              <div class="st-roll-item-desc">AI 只能用这里列出的骰子面数。</div>
            </div>
            <div class="st-roll-row">
              ${Gt({
    id: t.allowedDiceSidesId,
    attributes: {
      placeholder: "4,6,8,10,12,20,100",
      "data-tip": "限制 AI 可用的骰子面数。"
    }
  })}
            </div>
          </div>

          <div class="st-roll-divider"><i class="fa-solid fa-route"></i><span>剧情分支</span><div class="st-roll-divider-line"></div></div>

          ${Vt(
    t.outcomeBranchesId,
    "启用剧情走向分支",
    "成功、失败、爆骰可走不同后果。",
    "outcome branches",
    "开启剧情分支结果。"
  )}

          ${Vt(
    t.explodeOutcomeId,
    "启用爆骰特殊分支",
    "爆骰时使用专用后果文本。",
    "explode outcome branch",
    "开启爆骰专属分支。"
  )}

          ${Vt(
    t.listOutcomePreviewId,
    "列表卡预览走向",
    "未掷骰时先预览可能结果。",
    "list outcome preview",
    "在列表里预览结果分支。"
  )}

          <div class="st-roll-divider"><i class="fa-solid fa-file-lines"></i><span>摘要注入</span><div class="st-roll-divider-line"></div></div>

          <div class="st-roll-item st-roll-search-item" data-st-roll-search="summary detail mode">
            <div class="st-roll-item-main">
              <div class="st-roll-item-title">摘要信息等级</div>
              <div class="st-roll-item-desc">控制发给 AI 的摘要详细度。</div>
            </div>
            <div class="st-roll-row">
              ${Be({
    id: t.summaryDetailId,
    value: "minimal",
    containerClassName: "st-roll-shared-select",
    attributes: {
      "data-tip": "设置摘要详细度。"
    },
    options: [
      { value: "minimal", label: "简略" },
      { value: "balanced", label: "平衡" },
      { value: "detailed", label: "详细" }
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
              ${Gt({
    id: t.summaryRoundsId,
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

          ${Vt(
    t.includeOutcomeSummaryId,
    "摘要包含走向文本",
    "把本轮结果文本写进摘要。",
    "summary include outcome",
    "摘要里带上结果文本。"
  )}

          <div class="st-roll-divider"><i class="fa-solid fa-stopwatch"></i><span>时限控制</span><div class="st-roll-divider-line"></div></div>

          ${Vt(
    t.timeLimitEnabledId,
    "启用事件时限",
    "事件有倒计时，超时按失败处理。",
    "time limit timeout",
    "开启事件倒计时。"
  )}

          <div id="${t.timeLimitRowId}" class="st-roll-item st-roll-search-item" data-st-roll-search="minimum time limit seconds">
            <div class="st-roll-item-main">
              <div class="st-roll-item-title">最短时限（秒）</div>
              <div class="st-roll-item-desc">AI 给的时限太短时，用这个最小值。</div>
            </div>
            <div class="st-roll-row">
              ${Gt({
    id: t.timeLimitMinId,
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

        <div id="${t.panelSkillId}" class="st-roll-panel" hidden>
          <div class="st-roll-divider"><i class="fa-solid fa-bolt"></i><span>技能系统</span><div class="st-roll-divider-line"></div></div>

          ${Vt(
    t.skillEnabledId,
    "启用技能系统",
    "关掉后，技能加值不再生效。",
    "skill system enable",
    "开启技能系统。"
  )}

          <div class="st-roll-item st-roll-search-item" data-st-roll-search="skill editor modal">
            <div class="st-roll-item-main">
              <div class="st-roll-item-title">技能编辑器</div>
              <div class="st-roll-item-desc">在这里编辑技能预设和加值。</div>
            </div>
            <div class="st-roll-actions">
              ${ct({
    id: t.skillEditorOpenId,
    label: "打开编辑器",
    attributes: {
      "data-tip": "打开技能编辑器，管理技能预设和技能表。"
    }
  })}
            </div>
          </div>

          <dialog id="${t.skillModalId}" class="st-roll-skill-modal">
            <div class="st-roll-skill-modal-backdrop" data-skill-modal-role="backdrop"></div>
            <div class="st-roll-skill-modal-panel">
              <div class="st-roll-skill-modal-head">
                <div class="st-roll-skill-modal-title"><i class="fa-solid fa-bolt"></i><span>技能编辑器</span></div>
                ${ct({
    id: t.skillModalCloseId,
    label: "关闭",
    variant: "secondary",
    className: "st-roll-skill-modal-close",
    attributes: {
      "data-tip": "关闭技能编辑器。"
    }
  })}
              </div>

              <div class="st-roll-skill-modal-body">
                <div id="${t.skillPresetLayoutId}" class="st-roll-workbench st-roll-skill-layout">
                  <aside id="${t.skillPresetSidebarId}" class="st-roll-workbench-sidebar st-roll-skill-presets">
                    <div class="st-roll-workbench-toolbar st-roll-workbench-toolbar-sidebar">
                      ${Gt({
    id: `${t.skillModalId}__preset_search`,
    type: "search",
    className: "st-roll-skill-preset-search flex1",
    attributes: {
      placeholder: "搜索预设",
      "data-tip": "按预设名搜索技能预设。"
    }
  })}
                      ${Be({
    id: `${t.skillModalId}__preset_sort`,
    value: "recent",
    containerClassName: "st-roll-workbench-select",
    selectClassName: "st-roll-skill-preset-sort",
    triggerAttributes: {
      "data-tip": "切换预设排序方式"
    },
    options: [
      { value: "recent", label: "最近更新" },
      { value: "name", label: "按名称" },
      { value: "count", label: "按技能数" }
    ]
  })}
                    </div>

                    <div class="st-roll-workbench-sidebar-head st-roll-skill-presets-head">
                      <div class="st-roll-workbench-sidebar-copy">
                        <span class="st-roll-field-label">技能预设</span>
                        <div id="${t.skillPresetMetaId}" class="st-roll-skill-preset-meta"></div>
                      </div>
                      <div class="st-roll-actions">
                        ${ct({
    id: t.skillPresetCreateId,
    label: "新建",
    iconClassName: "fa-solid fa-plus",
    attributes: {
      "data-tip": "基于当前预设复制并新建一个预设。"
    }
  })}
                        ${ct({
    id: t.skillPresetDeleteId,
    label: "删除",
    variant: "danger",
    iconClassName: "fa-solid fa-trash",
    attributes: {
      "data-tip": "删除当前技能预设。"
    }
  })}
                        ${ct({
    id: t.skillPresetRestoreDefaultId,
    label: "恢复默认",
    variant: "secondary",
    iconClassName: "fa-solid fa-rotate-left",
    attributes: {
      "data-tip": "恢复默认技能预设的内置内容。"
    }
  })}
                      </div>
                    </div>
                    <div id="${t.skillPresetListId}" class="st-roll-skill-preset-list"></div>
                  </aside>

                  <section id="${t.skillEditorWrapId}" class="st-roll-workbench-main st-roll-skill-main">
                    <div class="st-roll-workbench-context st-roll-skill-preset-header">
                      <div class="st-roll-row st-roll-skill-rename-row">
                        <span class="st-roll-field-label">预设名称</span>
                        ${Gt({
    id: t.skillPresetNameId,
    className: "st-roll-skill-preset-name-input",
    attributes: {
      placeholder: "输入预设名称",
      "data-tip": "修改当前技能预设名称。"
    }
  })}
                        ${ct({
    id: t.skillPresetRenameId,
    label: "保存名称",
    variant: "secondary",
    attributes: {
      "data-tip": "保存当前预设名称。"
    }
  })}
                      </div>
                      <div class="st-roll-tip">名称必填；修正值必须是整数。支持搜索、排序、批量删除、复制与上下移动。</div>
                    </div>

                    <div class="st-roll-workbench-toolbar st-roll-skill-toolbar">
                      ${Gt({
    id: `${t.skillModalId}__skill_search`,
    type: "search",
    className: "st-roll-skill-row-search flex1",
    attributes: {
      placeholder: "搜索技能",
      "data-tip": "按技能名筛选当前预设中的技能。"
    }
  })}
                      ${Be({
    id: `${t.skillModalId}__skill_sort`,
    value: "manual",
    containerClassName: "st-roll-workbench-select",
    selectClassName: "st-roll-skill-row-sort",
    triggerAttributes: {
      "data-tip": "切换技能排序方式"
    },
    options: [
      { value: "manual", label: "手动顺序" },
      { value: "name", label: "按名称" },
      { value: "modifier_desc", label: "按修正值" }
    ]
  })}
                      <span class="st-roll-workbench-selection st-roll-skill-selection-count">已选 0 项</span>
                      ${ct({
    label: "全选可见",
    variant: "secondary",
    className: "st-roll-skill-select-visible",
    attributes: {
      "data-tip": "选中当前筛选结果中的全部技能。"
    }
  })}
                      ${ct({
    label: "清空选择",
    variant: "secondary",
    className: "st-roll-skill-clear-selection",
    attributes: {
      "data-tip": "取消当前技能选择。"
    }
  })}
                      ${ct({
    label: "批量删除",
    variant: "danger",
    className: "st-roll-skill-batch-delete",
    attributes: {
      "data-tip": "删除当前已选择的技能。"
    }
  })}
                    </div>

                    <div id="${t.skillDirtyHintId}" class="st-roll-skill-dirty" hidden>技能改动尚未保存，点击“保存技能表”后生效。</div>
                    <div id="${t.skillErrorsId}" class="st-roll-skill-errors" hidden></div>

                    <div class="st-roll-workbench-toolbar st-roll-workbench-toolbar-main st-roll-skill-head">
                      <div class="st-roll-workbench-head-copy">
                        <span class="st-roll-field-label">技能表</span>
                        <span class="st-roll-workbench-subtitle">按当前预设隔离，支持复制、移动和批量操作。</span>
                      </div>
                      <div class="st-roll-actions">
                        ${ct({
    id: t.skillAddId,
    label: "新增技能",
    iconClassName: "fa-solid fa-plus",
    attributes: {
      "data-tip": "新增一条技能记录。"
    }
  })}
                        ${ct({
    id: t.skillSaveId,
    label: "保存技能表",
    iconClassName: "fa-solid fa-floppy-disk",
    attributes: {
      "data-tip": "保存当前预设技能表。"
    }
  })}
                        ${ct({
    id: t.skillResetId,
    label: "重置为空",
    variant: "secondary",
    attributes: {
      "data-tip": "清空当前预设技能草稿。"
    }
  })}
                        ${ct({
    id: t.skillImportToggleId,
    label: "导入 JSON",
    variant: "secondary",
    attributes: {
      "data-tip": "展开或收起 JSON 导入区域。"
    }
  })}
                        ${ct({
    id: t.skillExportId,
    label: "导出 JSON",
    variant: "secondary",
    attributes: {
      "data-tip": "导出当前预设技能表 JSON。"
    }
  })}
                      </div>
                    </div>

                    <div class="st-roll-skill-cols"><span>技能名称</span><span>修正值</span><span>操作</span></div>
                    <div id="${t.skillRowsId}" class="st-roll-skill-rows"></div>

                    <div id="${t.skillImportAreaId}" class="st-roll-skill-import" hidden>
                      <div class="st-roll-row st-roll-workbench-toolbar-main" style="margin-bottom:8px;">
                        <span class="st-roll-field-label">粘贴 JSON 后点击应用</span>
                        <div class="st-roll-actions">
                          ${ct({
    id: t.skillImportApplyId,
    label: "应用导入",
    attributes: {
      "data-tip": "把文本框内的 JSON 解析为技能表。"
    }
  })}
                        </div>
                      </div>
                      ${Gt({
    id: t.skillTextId,
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

        <div id="${t.panelRuleId}" class="st-roll-panel" hidden>
          <div class="st-roll-divider"><i class="fa-solid fa-scroll"></i><span>事件协议规则</span><div class="st-roll-divider-line"></div></div>

          <div class="st-roll-textarea-wrap st-roll-search-item" data-st-roll-search="rule text save reset">
            <div class="st-roll-row" style="margin-bottom:8px;">
              <span class="st-roll-field-label">这里写补充规则。系统基础规则会自动放在前面。</span>
              <div class="st-roll-actions">
                ${ct({
    id: t.ruleSaveId,
    label: "保存补充",
    attributes: {
      "data-tip": "保存补充规则文本。"
    }
  })}
                ${ct({
    id: t.ruleResetId,
    label: "清空补充",
    variant: "secondary",
    attributes: {
      "data-tip": "清空补充规则文本。"
    }
  })}
              </div>
            </div>
            ${Gt({
    id: t.ruleTextId,
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

        <div id="${t.panelAboutId}" class="st-roll-panel" hidden>
          <div class="st-roll-divider"><i class="fa-solid fa-circle-info"></i><span>关于插件</span><div class="st-roll-divider-line"></div></div>

          <div class="st-roll-item st-roll-search-item st-roll-about-item" data-st-roll-search="about version author email github" style="margin-bottom: 12px; align-items: flex-start;">
            <div class="st-roll-item-main">
              <img class="st-roll-about-logo" src="${Nf}" alt="RollHelper Logo" />
              <div class="st-roll-item-title" style="display: flex; align-items: center; justify-content: center;font-size:18px;margin-bottom: 20px;">${t.displayName}</div>
              <div class="st-roll-item-desc st-roll-about-meta">
                <span class="st-roll-about-meta-item">
                  <i class="fa-solid fa-tag"></i>
                  <span>版本：${t.badgeText}</span>
                </span>
                <span class="st-roll-about-meta-item">
                  <i class="fa-solid fa-user"></i>
                  <span>作者：${t.authorText}</span>
                </span>
                <span class="st-roll-about-meta-item">
                  <i class="fa-solid fa-envelope"></i>
                  <span>邮箱：<a href="mailto:${t.emailText}">${t.emailText}</a></span>
                </span>
                <span class="st-roll-about-meta-item">
                  <i class="fa-brands fa-qq"></i>
                  <span>QQ群：${t.qqGroupText}</span>
                </span>
                <span class="st-roll-about-meta-item">
                  <i class="fa-brands fa-github"></i>
                  <span>GitHub：<a href="${t.githubUrl}" target="_blank" rel="noopener">${t.githubText}</a></span>
                </span>
              </div>
            </div>
          </div>

          <div class="st-roll-item st-roll-search-item st-roll-changelog-item" data-st-roll-search="更新日志 版本 历史 修复 新增 优化 调整 文档">
            <div class="st-roll-item-title">更新日志</div>
            ${t.changelogHtml}
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
    ${Rf({
    drawerToggleId: t.drawerToggleId,
    drawerContentId: t.drawerContentId,
    drawerIconId: t.drawerIconId,
    title: t.displayName,
    badgeId: t.badgeId,
    badgeText: t.badgeText,
    shellClassName: "st-roll-shell",
    headerClassName: "st-roll-head",
    contentClassName: "st-roll-content",
    titleClassName: "st-roll-head-title",
    badgeClassName: "st-roll-head-badge",
    contentHtml: e
  })}

    <dialog id="${t.statusModalId}" class="st-roll-status-modal">
      <div class="st-roll-status-modal-backdrop" data-status-modal-role="backdrop"></div>
      <div class="st-roll-status-modal-panel">
        <div class="st-roll-status-modal-head">
          <div class="st-roll-status-modal-title">
            <i class="fa-solid fa-heart-pulse"></i><span>状态编辑器</span>
          </div>
          ${ct({
    id: t.statusModalCloseId,
    label: "关闭",
    variant: "secondary",
    className: "st-roll-status-modal-close",
    attributes: {
      "data-tip": "关闭状态编辑器。"
    }
  })}
        </div>
        <div class="st-roll-status-modal-body">
          <div id="${t.statusLayoutId}" class="st-roll-workbench st-roll-status-layout">
            <aside id="${t.statusSidebarId}" class="st-roll-workbench-sidebar st-roll-status-sidebar">
              <div class="st-roll-workbench-toolbar st-roll-workbench-toolbar-sidebar">
                ${Gt({
    id: `${t.statusModalId}__chat_search`,
    type: "search",
    className: "st-roll-status-chat-search flex1",
    attributes: {
      placeholder: "搜索聊天",
      "data-tip": "按聊天名或聊天 ID 搜索。"
    }
  })}
                ${Be({
    id: `${t.statusModalId}__chat_source`,
    value: "all",
    containerClassName: "st-roll-workbench-select",
    selectClassName: "st-roll-status-chat-source",
    triggerAttributes: {
      "data-tip": "按聊天来源筛选。"
    },
    options: [
      { value: "all", label: "全部来源" },
      { value: "current", label: "仅当前" },
      { value: "local", label: "仅本地" },
      { value: "memory", label: "仅记忆库" }
    ]
  })}
                ${ct({
    id: t.statusRefreshId,
    label: "刷新",
    variant: "secondary",
    iconClassName: "fa-solid fa-rotate",
    attributes: {
      "data-tip": "刷新当前酒馆可见的聊天列表。"
    }
  })}
                ${ct({
    id: t.statusCleanUnusedId,
    label: "清理无用聊天",
    variant: "danger",
    iconClassName: "fa-solid fa-trash",
    attributes: {
      "data-tip": "根据当前酒馆的聊天列表，清理 RollHelper 本地已无用的聊天状态记录。"
    }
  })}
              </div>

              <div class="st-roll-workbench-sidebar-head st-roll-status-sidebar-head">
                <div class="st-roll-workbench-sidebar-copy st-roll-status-head-main">
                  <span class="st-roll-field-label">聊天列表</span>
                  <span id="${t.statusMemoryStateId}" class="st-roll-status-memory-state">记忆库：检测中</span>
                </div>
              </div>
              <div id="${t.statusChatListId}" class="st-roll-status-chat-list"></div>
            </aside>
            <div
              id="${t.statusSplitterId}"
              class="st-roll-status-splitter"
              role="separator"
              aria-orientation="vertical"
              aria-label="调整聊天侧栏宽度"
            ></div>
            <section class="st-roll-workbench-main st-roll-status-main">
              <div class="st-roll-status-mobile-sheet-head">
                ${ct({
    label: "返回聊天",
    variant: "secondary",
    iconClassName: "fa-solid fa-chevron-left",
    className: "st-roll-status-mobile-back",
    attributes: {
      "data-tip": "收起当前聊天的状态编辑抽屉。"
    }
  })}
                <div class="st-roll-status-mobile-sheet-copy">
                  <span class="st-roll-field-label">聊天状态编辑</span>
                </div>
              </div>
              <div class="st-roll-workbench-context st-roll-status-context">
                <div class="st-roll-workbench-head-copy">
                  <span class="st-roll-field-label">状态列表（按聊天隔离）</span>
                  <div id="${t.statusChatMetaId}" class="st-roll-status-chat-meta">未选择聊天</div>
                </div>
                <div class="st-roll-tip">名称必填；修正值必须是整数；按技能时技能列表不能为空。支持搜索、范围筛选、批量启用与批量删除。</div>
              </div>

              <div class="st-roll-workbench-toolbar st-roll-status-toolbar">
                ${Gt({
    id: `${t.statusModalId}__status_search`,
    type: "search",
    className: "st-roll-status-search flex1",
    attributes: {
      placeholder: "搜索状态",
      "data-tip": "按状态名称搜索当前聊天中的状态。"
    }
  })}
                ${Be({
    id: `${t.statusModalId}__status_scope`,
    value: "all",
    containerClassName: "st-roll-workbench-select",
    selectClassName: "st-roll-status-scope-filter",
    triggerAttributes: {
      "data-tip": "按状态作用范围筛选。"
    },
    options: [
      { value: "all", label: "全部范围" },
      { value: "skills", label: "按技能" },
      { value: "global", label: "全局" }
    ]
  })}
                <label class="st-roll-inline-toggle" data-tip="只显示当前已启用的状态。">
                  <input type="checkbox" class="st-roll-status-only-enabled" />
                  <span>仅看启用</span>
                </label>
                <span class="st-roll-workbench-selection st-roll-status-selection-count">已选 0 项</span>
                ${ct({
    label: "全选可见",
    variant: "secondary",
    iconClassName: "fa-solid fa-check-double",
    className: "st-roll-status-select-visible st-roll-toolbar-icon-btn",
    attributes: {
      "data-tip": "选中当前筛选结果中的全部状态。"
    }
  })}
                ${ct({
    label: "启用所选",
    variant: "secondary",
    iconClassName: "fa-solid fa-check",
    className: "st-roll-status-batch-enable st-roll-toolbar-icon-btn",
    attributes: {
      "data-tip": "批量启用当前选择的状态。"
    }
  })}
                ${ct({
    label: "禁用所选",
    variant: "secondary",
    iconClassName: "fa-solid fa-ban",
    className: "st-roll-status-batch-disable st-roll-toolbar-icon-btn",
    attributes: {
      "data-tip": "批量禁用当前选择的状态。"
    }
  })}
                ${ct({
    label: "删除所选",
    variant: "danger",
    iconClassName: "fa-solid fa-trash",
    className: "st-roll-status-batch-delete st-roll-toolbar-icon-btn",
    attributes: {
      "data-tip": "删除当前选择的状态。"
    }
  })}
              </div>

              <div class="st-roll-workbench-toolbar st-roll-workbench-toolbar-main st-roll-status-head">
                <div class="st-roll-workbench-head-copy">
                  <span class="st-roll-field-label">状态表</span>
                  <span class="st-roll-workbench-subtitle">支持复制状态、批量启用/禁用、按范围筛选。</span>
                </div>
                <div class="st-roll-actions">
                  ${ct({
    id: t.statusAddId,
    label: "新增状态",
    iconClassName: "fa-solid fa-plus",
    attributes: {
      "data-tip": "新增一条状态。"
    }
  })}
                  ${ct({
    id: t.statusSaveId,
    label: "保存",
    iconClassName: "fa-solid fa-floppy-disk",
    attributes: {
      "data-tip": "保存当前聊天的状态表。"
    }
  })}
                  ${ct({
    id: t.statusResetId,
    label: "重置",
    variant: "secondary",
    attributes: {
      "data-tip": "清空当前聊天的状态草稿。"
    }
  })}
                </div>
              </div>

              <div id="${t.statusColsId}" class="st-roll-status-cols">
                <span class="st-roll-status-col-head" data-status-col-key="name">名称<div class="st-roll-status-col-resizer" data-status-col-resize-key="name"></div></span>
                <span class="st-roll-status-col-head" data-status-col-key="modifier">修正<div class="st-roll-status-col-resizer" data-status-col-resize-key="modifier"></div></span>
                <span class="st-roll-status-col-head" data-status-col-key="duration">轮次<div class="st-roll-status-col-resizer" data-status-col-resize-key="duration"></div></span>
                <span class="st-roll-status-col-head" data-status-col-key="scope">范围<div class="st-roll-status-col-resizer" data-status-col-resize-key="scope"></div></span>
                <span class="st-roll-status-col-head" data-status-col-key="skills">技能（| 分隔）<div class="st-roll-status-col-resizer" data-status-col-resize-key="skills"></div></span>
                <span class="st-roll-status-col-head" data-status-col-key="enabled">启用<div class="st-roll-status-col-resizer" data-status-col-resize-key="enabled"></div></span>
                <span class="st-roll-status-col-head" data-status-col-key="actions">操作</span>
              </div>
              <div id="${t.statusRowsId}" class="st-roll-status-rows"></div>
              <div class="st-roll-status-footer">
                <div id="${t.statusErrorsId}" class="st-roll-status-errors" hidden></div>
                <div id="${t.statusDirtyHintId}" class="st-roll-status-dirty" hidden>当前聊天有未保存修改。</div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </dialog>
  `;
}
const Mf = "_SCOPE_ .stx-shared-box-checkbox{--stx-box-checkbox-size: 16px;--stx-box-checkbox-radius: 4px;--stx-box-checkbox-border: color-mix( in srgb, var(--ss-theme-accent, rgba(197, 160, 89, .9)) 52%, var(--ss-theme-border, rgba(255, 255, 255, .18)) );--stx-box-checkbox-bg: color-mix( in srgb, var(--ss-theme-surface-3, rgba(255, 255, 255, .06)) 92%, transparent );--stx-box-checkbox-hover-border: color-mix( in srgb, var(--ss-theme-accent, rgba(197, 160, 89, .9)) 72%, #fff 10% );--stx-box-checkbox-focus-ring: color-mix( in srgb, var(--ss-theme-accent, rgba(197, 160, 89, .9)) 24%, transparent );--stx-box-checkbox-checked-border: color-mix( in srgb, var(--ss-theme-accent, rgba(197, 160, 89, .9)) 84%, #fff 8% );--stx-box-checkbox-checked-bg: color-mix( in srgb, var(--ss-theme-accent, rgba(197, 160, 89, .9)) 24%, var(--ss-theme-surface-3, rgba(255, 255, 255, .06)) );--stx-box-checkbox-indicator: var( --ss-theme-accent-contrast, rgba(255, 234, 190, .96) );position:relative;display:inline-grid;place-items:center;inline-size:var(--stx-box-checkbox-size);block-size:var(--stx-box-checkbox-size);flex:0 0 auto;cursor:pointer;user-select:none;vertical-align:middle}_SCOPE_ .stx-shared-box-checkbox-input{position:absolute;inset:0;margin:0;opacity:0;cursor:pointer}_SCOPE_ .stx-shared-box-checkbox-control{display:inline-grid;place-items:center;inline-size:100%;block-size:100%;border-radius:var(--stx-box-checkbox-radius);border:1px solid var(--stx-box-checkbox-border);background:var(--stx-box-checkbox-bg);box-shadow:inset 0 1px #ffffff0d;box-sizing:border-box;transition:border-color .18s ease,background-color .18s ease,box-shadow .18s ease,transform .18s ease}_SCOPE_ .stx-shared-box-checkbox-indicator{inline-size:6px;block-size:6px;border-radius:2px;background:var(--stx-box-checkbox-indicator);opacity:0;transform:scale(.45);transition:opacity .18s ease,transform .18s ease,background-color .18s ease}_SCOPE_ .stx-shared-box-checkbox:hover .stx-shared-box-checkbox-control{border-color:var(--stx-box-checkbox-hover-border);box-shadow:inset 0 1px #ffffff14,0 0 0 1px color-mix(in srgb,var(--stx-box-checkbox-hover-border) 24%,transparent)}_SCOPE_ .stx-shared-box-checkbox-input:focus-visible+.stx-shared-box-checkbox-control{border-color:var(--stx-box-checkbox-hover-border);box-shadow:0 0 0 2px var(--stx-box-checkbox-focus-ring),inset 0 1px #ffffff14}_SCOPE_ .stx-shared-box-checkbox-input:checked+.stx-shared-box-checkbox-control{border-color:var(--stx-box-checkbox-checked-border);background:var(--stx-box-checkbox-checked-bg);box-shadow:inset 0 1px #ffffff1a,0 0 0 1px color-mix(in srgb,var(--stx-box-checkbox-checked-border) 20%,transparent)}_SCOPE_ .stx-shared-box-checkbox-input:checked+.stx-shared-box-checkbox-control .stx-shared-box-checkbox-indicator{opacity:1;transform:scale(1)}_SCOPE_ .stx-shared-box-checkbox-input:disabled+.stx-shared-box-checkbox-control{opacity:.58;cursor:not-allowed}";
function Of(t) {
  return String(t ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function Yr(t) {
  return Of(t).replace(/`/g, "&#96;");
}
function Rs(...t) {
  return t.filter(Boolean).join(" ");
}
function wc(t) {
  return t ? Object.entries(t).flatMap(([e, r]) => r == null || r === !1 ? [] : r === !0 ? [` ${e}`] : [` ${e}="${Yr(String(r))}"`]).join("") : "";
}
function Fu(t) {
  return `
    <label
      class="${Yr(Rs("stx-shared-box-checkbox", t.containerClassName))}"
      data-ui="shared-box-checkbox"${wc(t.attributes)}
    >
      <input
        id="${Yr(t.id)}"
        class="${Yr(Rs("stx-shared-box-checkbox-input", t.inputClassName))}"
        type="checkbox"${wc(t.inputAttributes)}
      />
      <span
        class="${Yr(Rs("stx-shared-box-checkbox-control", t.controlClassName))}"
        aria-hidden="true"
      >
        <span
          class="${Yr(Rs("stx-shared-box-checkbox-indicator", t.indicatorClassName))}"
        ></span>
      </span>
    </label>
  `;
}
function Pf(t) {
  const e = t.trim() || ":root";
  return Mf.split("_SCOPE_").join(e);
}
const Bf = "_SCOPE_ .stx-changelog{--stx-changelog-scrollbar: color-mix( in srgb, var(--ss-theme-accent, #c5a059) 42%, transparent );--stx-changelog-shell-border: var(--ss-theme-border, rgba(255, 255, 255, .18));--stx-changelog-shell-bg: linear-gradient(180deg, rgba(255, 255, 255, .03), rgba(255, 255, 255, .01)), var(--ss-theme-surface-2, rgba(0, 0, 0, .16));--stx-changelog-shell-shadow: inset 0 1px 0 rgba(255, 255, 255, .04);--stx-changelog-entry-border: color-mix( in srgb, var(--ss-theme-border, rgba(255, 255, 255, .18)) 72%, rgba(255, 255, 255, .1) );--stx-changelog-entry-bg: radial-gradient(circle at top right, color-mix(in srgb, var(--ss-theme-accent, #c5a059) 18%, transparent), transparent 42%), color-mix(in srgb, var(--ss-theme-surface-2, rgba(0, 0, 0, .16)) 84%, rgba(0, 0, 0, .18) 16%);--stx-changelog-version-color: var(--ss-theme-accent-contrast, #fff);--stx-changelog-date-color: var(--ss-theme-text-muted, rgba(255, 255, 255, .62));--stx-changelog-section-border: color-mix( in srgb, var(--ss-theme-border, rgba(255, 255, 255, .18)) 58%, rgba(255, 255, 255, .08) );--stx-changelog-section-bg: color-mix( in srgb, var(--ss-theme-surface-3, rgba(255, 255, 255, .04)) 86%, transparent );--stx-changelog-section-title-color: color-mix( in srgb, var(--ss-theme-text, inherit) 88%, transparent );width:100%;display:flex;flex-direction:column;gap:12px;padding:12px;max-height:400px;overflow-y:auto;border:1px solid var(--stx-changelog-shell-border);border-radius:10px;background:var(--stx-changelog-shell-bg);box-shadow:var(--stx-changelog-shell-shadow)}_SCOPE_ .stx-changelog::-webkit-scrollbar{width:6px}_SCOPE_ .stx-changelog::-webkit-scrollbar-thumb{background:var(--stx-changelog-scrollbar);border-radius:999px}_SCOPE_ .stx-changelog-entry{display:flex;flex-direction:column;gap:10px;padding:12px;border:1px solid var(--stx-changelog-entry-border);border-radius:10px;background:var(--stx-changelog-entry-bg)}_SCOPE_ .stx-changelog-entry-head{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap}_SCOPE_ .stx-changelog-entry-version{display:inline-flex;align-items:center;gap:8px;min-width:0;font-weight:700;color:var(--stx-changelog-version-color)}_SCOPE_ .stx-changelog-entry-version-text{font-size:14px;line-height:1.2}_SCOPE_ .stx-changelog-entry-date{font-size:11px;line-height:1.2;color:var(--stx-changelog-date-color);white-space:nowrap}_SCOPE_ .stx-changelog-sections{display:flex;flex-direction:column;gap:8px}_SCOPE_ .stx-changelog-section{display:flex;flex-direction:column;gap:8px;padding:10px 12px;border:1px solid var(--stx-changelog-section-border);border-radius:9px;background:var(--stx-changelog-section-bg)}_SCOPE_ .stx-changelog-section-head{display:inline-flex;align-items:center;gap:8px;min-width:0}_SCOPE_ .stx-changelog-section-badge{display:inline-flex;align-items:center;gap:6px;padding:4px 10px;border-radius:999px;font-size:11px;line-height:1;font-weight:700;letter-spacing:.2px;border:1px solid currentColor;white-space:nowrap}_SCOPE_ .stx-changelog-section-title{font-size:12px;line-height:1.4;color:var(--stx-changelog-section-title-color)}_SCOPE_ .stx-changelog-section-list{margin:0;padding-left:18px;display:flex;flex-direction:column;gap:6px}_SCOPE_ .stx-changelog-section-item{font-size:12px;line-height:1.55;color:var(--ss-theme-text, inherit)}_SCOPE_ .stx-changelog-empty{display:flex;align-items:center;justify-content:center;min-height:96px;text-align:center;color:var(--ss-theme-text-muted, rgba(255, 255, 255, .72))}_SCOPE_ .stx-changelog-section.is-added .stx-changelog-section-badge{color:#77d28b;background:#286e3f2e}_SCOPE_ .stx-changelog-section.is-fixed .stx-changelog-section-badge{color:#ff8d8d;background:#7a28282e}_SCOPE_ .stx-changelog-section.is-improved .stx-changelog-section-badge{color:#8ec7ff;background:#1f56852e}_SCOPE_ .stx-changelog-section.is-changed .stx-changelog-section-badge{color:#e9c07b;background:#6e4a1b2e}_SCOPE_ .stx-changelog-section.is-docs .stx-changelog-section-badge{color:#c7b7ff;background:#4e3a862e}_SCOPE_ .stx-changelog-section.is-other .stx-changelog-section-badge{color:#d4d4d4;background:#6969692e}_SCOPE_ [data-ss-theme=light] .stx-changelog,_SCOPE_[data-ss-theme=light] .stx-changelog{--stx-changelog-scrollbar: color-mix( in srgb, var(--ss-theme-accent, #2f6ee5) 26%, var(--ss-theme-border-strong, #8eaed9) 74% );--stx-changelog-shell-border: color-mix( in srgb, var(--ss-theme-border, #c6d1e2) 86%, white 14% );--stx-changelog-shell-bg: linear-gradient(180deg, rgba(255, 255, 255, .84), rgba(244, 248, 255, .98)), var(--ss-theme-surface-2, #eef3fa);--stx-changelog-shell-shadow: inset 0 1px 0 rgba(255, 255, 255, .72), 0 8px 22px rgba(186, 198, 216, .22);--stx-changelog-entry-border: color-mix( in srgb, var(--ss-theme-border-strong, #8eaed9) 48%, white 30% );--stx-changelog-entry-bg: radial-gradient(circle at top right, rgba(47, 110, 229, .08), transparent 44%), linear-gradient(180deg, rgba(255, 255, 255, .84), rgba(246, 250, 255, .96));--stx-changelog-version-color: color-mix( in srgb, var(--ss-theme-accent, #2f6ee5) 72%, var(--ss-theme-text, #1f2834) 28% );--stx-changelog-date-color: color-mix( in srgb, var(--ss-theme-text, #1f2834) 76%, transparent );--stx-changelog-section-border: color-mix( in srgb, var(--ss-theme-border, #c6d1e2) 88%, white 12% );--stx-changelog-section-bg: linear-gradient(180deg, rgba(255, 255, 255, .76), rgba(248, 251, 255, .94));--stx-changelog-section-title-color: color-mix( in srgb, var(--ss-theme-text, #1f2834) 94%, transparent )}_SCOPE_ [data-ss-theme=light] .stx-changelog-section.is-added .stx-changelog-section-badge,_SCOPE_[data-ss-theme=light] .stx-changelog-section.is-added .stx-changelog-section-badge{color:#2d8a57;background:#58c47924}_SCOPE_ [data-ss-theme=light] .stx-changelog-section.is-fixed .stx-changelog-section-badge,_SCOPE_[data-ss-theme=light] .stx-changelog-section.is-fixed .stx-changelog-section-badge{color:#c24b4b;background:#ef757524}_SCOPE_ [data-ss-theme=light] .stx-changelog-section.is-improved .stx-changelog-section-badge,_SCOPE_[data-ss-theme=light] .stx-changelog-section.is-improved .stx-changelog-section-badge{color:#2f6ee5;background:#2f6ee51f}_SCOPE_ [data-ss-theme=light] .stx-changelog-section.is-changed .stx-changelog-section-badge,_SCOPE_[data-ss-theme=light] .stx-changelog-section.is-changed .stx-changelog-section-badge{color:#9e6914;background:#dfab4a29}_SCOPE_ [data-ss-theme=light] .stx-changelog-section.is-docs .stx-changelog-section-badge,_SCOPE_[data-ss-theme=light] .stx-changelog-section.is-docs .stx-changelog-section-badge{color:#6b57cb;background:#8169e41f}_SCOPE_ [data-ss-theme=light] .stx-changelog-section.is-other .stx-changelog-section-badge,_SCOPE_[data-ss-theme=light] .stx-changelog-section.is-other .stx-changelog-section-badge{color:#5c6878;background:#78849424}@media(max-width:768px){_SCOPE_ .stx-changelog{max-height:240px;padding:10px;gap:10px}_SCOPE_ .stx-changelog-entry{padding:10px}_SCOPE_ .stx-changelog-section{padding:9px 10px}}", Ic = {
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
function mr(t) {
  return String(t ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function Cs(t) {
  return mr(t).replace(/`/g, "&#96;");
}
function Uf(...t) {
  return t.filter(Boolean).join(" ");
}
function Vu(t) {
  return Array.isArray(t) ? t.map((e) => String(e ?? "").trim()).filter((e) => e.length > 0) : [];
}
function Hf(t) {
  const e = String(t ?? "").trim().toLowerCase();
  return e === "added" || e === "fixed" || e === "improved" || e === "changed" || e === "docs" ? e : "other";
}
function zf(t) {
  return Ic[t] ?? Ic.other;
}
function Gf(t) {
  const e = Vu(t.items);
  if (e.length === 0) return null;
  const r = Hf(t.type), n = zf(r);
  return {
    type: r,
    title: String(t.title ?? "").trim() || n.label,
    items: e,
    badgeText: n.label,
    iconClassName: n.iconClassName,
    className: n.className
  };
}
function Kf(t) {
  const e = String(t.version ?? "").trim(), r = String(t.date ?? "").trim(), o = (Array.isArray(t.sections) ? t.sections ?? [] : [{ type: "other", title: "更新", items: Vu(t.changes) }]).map((i) => Gf(i)).filter((i) => i !== null);
  return !e && !r && o.length === 0 ? null : {
    version: e || "未命名版本",
    date: r,
    sections: o
  };
}
function jf(t) {
  return Array.isArray(t) ? t.map((e) => Kf(e)).filter((e) => e !== null) : [];
}
function qf(t, e) {
  const r = jf(t), n = Uf("stx-changelog", e?.containerClassName);
  if (r.length === 0)
    return `<div class="${Cs(n)} stx-changelog-empty">${mr(e?.emptyText)}</div>`;
  const o = r.map((i) => {
    const c = i.sections.map((d) => {
      const h = d.items.map((b) => `<li class="stx-changelog-section-item">${mr(b)}</li>`).join(""), f = d.title !== d.badgeText;
      return `
            <section class="stx-changelog-section ${Cs(d.className)}">
              <div class="stx-changelog-section-head">
                <span class="stx-changelog-section-badge">
                  <i class="${Cs(d.iconClassName)}" aria-hidden="true"></i>
                  <span>${mr(d.badgeText)}</span>
                </span>
                ${f ? `<span class="stx-changelog-section-title">${mr(d.title)}</span>` : ""}
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
              <span class="stx-changelog-entry-version-text">${mr(i.version)}</span>
            </div>
            ${i.date ? `<span class="stx-changelog-entry-date">${mr(i.date)}</span>` : ""}
          </header>
          <div class="stx-changelog-sections">${c}</div>
        </article>
      `;
  }).join("");
  return `<div class="${Cs(n)}" data-ui="shared-changelog">${o}</div>`;
}
function Ff(t) {
  const e = t.trim() || ":root";
  return Bf.replaceAll("_SCOPE_", e);
}
function Vf(t) {
  return `
    ${Cf(`#${t}`)}
    ${Ff(`#${t}`)}

    #${t} {
      margin-bottom: 5px;
      color: inherit;
    }


    ${Sf(`#${t} .st-roll-content, #${t} .st-roll-skill-modal, #${t} .st-roll-status-modal`)}

    #${t} .st-roll-shell {
      border: 0;
      border-radius: 0;
      overflow: visible;
      background: transparent;
      backdrop-filter: none;
    }

    #${t} .st-roll-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      min-width: 0;
      cursor: pointer;
      user-select: none;
    }

    #${t} .st-roll-head-title {
      display: flex;
      align-items: center;
      gap: 6px;
      font-weight: 700;
    }

    #${t} .st-roll-head-badge {
      color: inherit;
      opacity: 0.8;
      font-size: 0.8em;
      font-weight: 500;
      letter-spacing: 0.02em;
    }

    #${t} .st-roll-head .inline-drawer-icon {
      transition: transform 0.2s ease;
    }

    #${t} .st-roll-content {
      border-top: 1px solid var(--ss-theme-border);
      padding: 10px;
      display: block;
      color: var(--ss-theme-text);
      background: var(--ss-theme-surface-2);
    }

    #${t} .st-roll-filters {
      margin-bottom: 10px;
      gap: 8px;
    }

    #${t} .st-roll-search {
      min-height: 32px;
      transition: border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
    }

    #${t} .st-roll-search-item.is-hidden-by-search {
      display: none !important;
    }

    #${t} .st-roll-tabs {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 4px;
      border: 1px solid var(--ss-theme-border);
      border-radius: 999px;
      margin-bottom: 10px;
      background: var(--ss-theme-surface-2);
    }

    #${t} .st-roll-tab {
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

    #${t} .st-roll-tab.is-active {
      opacity: 1;
      color: var(--ss-theme-text);
      background: var(--ss-theme-list-item-active-bg);
    }

    #${t} .st-roll-panel {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    #${t} .st-roll-panel[hidden] {
      display: none !important;
    }

    #${t} .st-roll-divider {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 8px;
      margin-bottom: 6px;
      font-size: 13px;
      font-weight: 700;
      opacity: 0.95;
    }

    #${t} .st-roll-divider-line {
      flex: 1;
      height: 1px;
      background: var(--ss-theme-border);
    }

    #${t} .st-roll-item {
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

    #${t} .st-roll-item-main {
      min-width: 0;
      flex: 1;
    }

    #${t} .st-roll-item-title {
      font-size: 14px;
      font-weight: 700;
      margin-bottom: 5px;
    }

    #${t} .st-roll-item-desc {
      font-size: 11px;
      line-height: 1.45;
      opacity: 0.7;
    }

    #${t} .st-roll-about-meta {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 6px 24px;
      width: 100%;
      min-width: 0;
    }

    #${t} .st-roll-about-meta-item {
      display: inline-flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 6px;
      min-width: 0;
      max-width: 100%;
      white-space: normal;
    }

    #${t} .st-roll-about-meta-item > span {
      min-width: 0;
      overflow-wrap: anywhere;
      word-break: break-word;
    }

    #${t} .st-roll-about-meta-item i {
      width: 14px;
      text-align: center;
      opacity: 0.86;
    }

    #${t} .st-roll-about-meta a {
      color: inherit;
      text-decoration: none;
      border-bottom: 1px dashed rgba(255, 255, 255, 0.22);
      overflow-wrap: anywhere;
      word-break: break-word;
      transition: border-color 0.2s ease, text-shadow 0.2s ease;
    }

    #${t} .st-roll-about-meta a:hover {
      border-bottom-color: rgba(255, 255, 255, 0.5);
      text-shadow: 0 0 8px rgba(255, 255, 255, 0.22);
    }

    #${t} .st-roll-about-item {
      display: block;
    }

    #${t} .st-roll-about-logo {
      display: block;
      width: min(240px, 100%);
      height: auto;
      margin: 0 auto 14px;
      object-fit: contain;
    }

    #${t} .st-roll-inline {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-shrink: 0;
    }

    #${t} .st-roll-row {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 10px;
      flex-wrap: wrap;
    }

    #${t} .st-roll-field-label {
      font-size: 13px;
      opacity: 0.85;
      flex: 1;
    }

    #${t} .st-roll-shared-select {
      flex: 0 1 220px;
    }

    #${t} .st-roll-status-row .stx-shared-select,
    #${t} .st-roll-status-scope-select {
      width: 100%;
      min-width: 0;
    }

    #${t} .st-roll-select {
      background: rgba(0, 0, 0, 0.28);
      color: inherit;
      border: 1px solid rgba(197, 160, 89, 0.36);
      border-radius: 8px;
      box-sizing: border-box;
      transition:
        border-color 0.2s ease,
        box-shadow 0.2s ease,
        background-color 0.2s ease;
    }

    #${t} .st-roll-select {
      padding: 4px 8px;
      min-height: 30px;
    }

    #${t} .st-roll-select {
      min-width: 182px;
      max-width: 100%;
      text-align: left;
    }

    #${t} .st-roll-input {
      width: 120px;
    }

    #${t} .st-roll-item.is-disabled {
      opacity: 0.52;
    }

    #${t} .st-roll-actions {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: nowrap; 
      overflow: visible; 
    }

    #${t} .st-roll-btn {
      flex-shrink: 0;
    }

    #${t} .st-roll-btn {
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

    #${t} .st-roll-btn.secondary {
      border-color: rgba(255, 255, 255, 0.2);
      background: rgba(255, 255, 255, 0.08);
    }

    #${t} .st-roll-textarea-wrap {
      border: 1px solid rgba(255, 255, 255, 0.18);
      border-radius: 10px;
      background: rgba(0, 0, 0, 0.15);
      padding: 10px;
      transition: border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
    }

    #${t} .st-roll-changelog-item {
      flex-direction: column;
      align-items: stretch;
      gap: 10px;
      margin-bottom: 12px;
    }

    #${t} .st-roll-skill-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      margin-top: 8px;
      margin-bottom: 8px;
      flex-wrap: wrap;
    }

    #${t} .st-roll-skill-cols {
      display: grid;
      grid-template-columns: minmax(280px, 1fr) 84px 124px;
      gap: 10px;
      font-size: 12px;
      font-weight: 700;
      opacity: 0.72;
      margin-bottom: 4px;
      padding: 0 2px;
    }

    #${t} .st-roll-skill-cols span:nth-child(2),
    #${t} .st-roll-skill-cols span:nth-child(3) {
      text-align: center;
    }

    #${t} .st-roll-skill-rows {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    #${t} .st-roll-skill-row {
      display: grid;
      grid-template-columns: minmax(280px, 1fr) 84px 124px;
      gap: 10px;
      align-items: stretch;
    }

    #${t} .st-roll-skill-name,
    #${t} .st-roll-skill-modifier {
      width: 100%;
    }

    #${t} .st-roll-skill-modifier {
      text-align: center;
    }

    #${t} .st-roll-skill-remove {
      padding-left: 0;
      padding-right: 0;
    }

    #${t} .st-roll-skill-empty {
      border: 1px dashed rgba(255, 255, 255, 0.22);
      border-radius: 8px;
      padding: 10px;
      text-align: center;
      font-size: 12px;
      opacity: 0.7;
      background: rgba(255, 255, 255, 0.03);
    }

    #${t} .st-roll-skill-errors {
      border: 1px solid rgba(255, 110, 110, 0.45);
      border-radius: 8px;
      padding: 8px 10px;
      background: rgba(120, 20, 20, 0.22);
      margin-top: 8px;
      margin-bottom: 8px;
    }

    #${t} .st-roll-skill-error-item {
      font-size: 12px;
      line-height: 1.45;
      color: #ffd2d2;
    }

    #${t} .st-roll-skill-dirty {
      margin-top: 8px;
      margin-bottom: 2px;
      font-size: 12px;
      line-height: 1.4;
      color: #ffe0a6;
    }

    #${t} .st-roll-skill-import {
      margin-top: 10px;
      padding-top: 10px;
      border-top: 1px dashed rgba(255, 255, 255, 0.22);
    }

    #${t} .st-roll-skill-modal {
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

    #${t} .st-roll-skill-modal:not([open]) {
      display: none !important;
    }

    #${t} .st-roll-skill-modal[open] {
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }

    #${t} .st-roll-skill-modal::backdrop {
      background: var(--ss-theme-backdrop);
      backdrop-filter: var(--ss-theme-backdrop-filter);
    }

    #${t} .st-roll-skill-modal-backdrop {
      position: absolute;
      inset: 0;
      background: color-mix(in srgb, var(--ss-theme-backdrop) 55%, transparent);
      backdrop-filter: var(--ss-theme-backdrop-filter);
    }

    #${t} .st-roll-skill-modal-panel {
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
    }

    #${t} .st-roll-skill-modal-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      padding: 12px 14px;
      border-bottom: 1px solid var(--ss-theme-border);
      background: var(--ss-theme-toolbar-bg);
    }

    #${t} .st-roll-skill-modal-title {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      font-weight: 700;
    }

    #${t} .st-roll-skill-modal-close {
      min-width: 72px;
    }

    #${t} .st-roll-skill-modal-body {
      flex: 1;
      min-height: 0;
      overflow: auto;
      padding: 12px;
    }

    #${t} .st-roll-skill-layout {
      display: grid;
      grid-template-columns: minmax(220px, 280px) 1fr;
      gap: 10px;
      align-items: start;
    }

    #${t} .st-roll-skill-presets {
      border: 1px solid rgba(255, 255, 255, 0.18);
      border-radius: 10px;
      background: rgba(0, 0, 0, 0.16);
      padding: 10px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      min-height: 260px;
    }

    #${t} .st-roll-skill-presets-head {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    #${t} .st-roll-skill-preset-meta {
      min-height: 24px;
      font-size: 12px;
      line-height: 1.4;
      opacity: 0.78;
    }

    #${t} .st-roll-skill-preset-list {
      display: flex;
      flex-direction: column;
      gap: 6px;
      max-height: 360px;
      overflow: auto;
      padding-right: 2px;
    }

    #${t} .st-roll-skill-preset-item {
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

    #${t} .st-roll-skill-preset-item:hover {
      border-color: rgba(197, 160, 89, 0.58);
      background: rgba(197, 160, 89, 0.18);
    }

    #${t} .st-roll-skill-preset-item.is-active {
      border-color: rgba(197, 160, 89, 0.68);
      background: rgba(197, 160, 89, 0.24);
      box-shadow:
        0 0 0 1px rgba(197, 160, 89, 0.26),
        0 0 14px rgba(197, 160, 89, 0.18);
    }

    #${t} .st-roll-skill-preset-name-marquee {
      display: block;
      flex: 1 1 auto;
      min-width: 0;
      max-width: 100%;
      overflow: hidden;
    }

    #${t} .st-roll-skill-preset-name-marquee.is-overflowing {
      mask-image: linear-gradient(90deg, transparent 0, #000 6%, #000 94%, transparent 100%);
      -webkit-mask-image: linear-gradient(90deg, transparent 0, #000 6%, #000 94%, transparent 100%);
    }

    #${t} .st-roll-skill-preset-name-track {
      display: inline-flex;
      align-items: center;
      min-width: max-content;
      width: max-content;
      max-width: none;
      transform: translateX(0);
      will-change: transform;
    }

    #${t} .st-roll-skill-preset-name-marquee.is-overflowing .st-roll-skill-preset-name-track {
      animation: st-roll-skill-preset-marquee var(--st-roll-preset-marquee-duration, 8s) ease-in-out infinite alternate;
    }

    #${t} .st-roll-skill-preset-name {
      display: inline-flex;
      align-items: center;
      min-width: max-content;
      white-space: nowrap;
      text-align: left;
      font-weight: 700;
    }

    #${t} .st-roll-skill-preset-tags {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      flex-shrink: 0;
    }

    #${t} .st-roll-skill-preset-tag {
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

    #${t} .st-roll-skill-preset-tag.active {
      border-color: rgba(197, 160, 89, 0.55);
      background: rgba(197, 160, 89, 0.24);
    }

    #${t} .st-roll-skill-preset-tag.locked {
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

    #${t} .st-roll-skill-rename-row {
      justify-content: flex-start;
      gap: 8px;
      flex-wrap: wrap;
    }

    #${t} .st-roll-skill-preset-name-input {
      width: min(280px, 100%);
    }

    #${t} .st-roll-skill-preset-empty {
      border: 1px dashed rgba(255, 255, 255, 0.2);
      border-radius: 8px;
      padding: 10px;
      text-align: center;
      font-size: 12px;
      opacity: 0.7;
      background: rgba(255, 255, 255, 0.03);
    }

    #${t} .st-roll-status-modal {
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

    #${t} .st-roll-status-modal:not([open]) {
      display: none !important;
    }

    #${t} .st-roll-status-modal[open] {
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }

    #${t} .st-roll-status-modal::backdrop {
      background: var(--ss-theme-backdrop);
      backdrop-filter: var(--ss-theme-backdrop-filter);
    }

    #${t} .st-roll-status-modal-backdrop {
      position: absolute;
      inset: 0;
      background: color-mix(in srgb, var(--ss-theme-backdrop) 70%, transparent);
      backdrop-filter: var(--ss-theme-backdrop-filter);
      opacity: 1;
      transition: opacity 0.24s ease;
    }

    #${t} .st-roll-skill-modal[data-ss-theme="host"] .st-roll-skill-modal-backdrop,
    #${t} .st-roll-status-modal[data-ss-theme="host"] .st-roll-status-modal-backdrop {
      background: color-mix(in srgb, var(--ss-theme-backdrop) 55%, transparent);
      backdrop-filter: var(--ss-theme-backdrop-filter);
    }

    #${t} .st-roll-status-modal-panel {
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

    #${t} .st-roll-status-modal-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      padding: 12px 14px;
      border-bottom: 1px solid var(--ss-theme-border);
      background: var(--ss-theme-toolbar-bg);
    }

    #${t} .st-roll-status-modal-title {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      font-weight: 700;
    }

    #${t} .st-roll-status-modal-close {
      min-width: 72px;
    }

    #${t} .st-roll-status-modal-body {
      flex: 1;
      min-height: 0;
      overflow: hidden;
      padding: 12px;
      display: flex;
    }

    #${t} .st-roll-status-layout {
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

    #${t} .st-roll-status-sidebar {
      min-width: 180px;
      border-right: 1px solid rgba(255, 255, 255, 0.12);
      background: rgba(0, 0, 0, 0.26);
      display: flex;
      flex-direction: column;
      min-height: 0;
    }

    #${t} .st-roll-status-sidebar-head {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 8px;
      padding: 10px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      background: rgba(255, 255, 255, 0.03);
    }

    #${t} .st-roll-status-memory-state {
      font-size: 11px;
      opacity: 0.82;
      white-space: normal;
      overflow-wrap: anywhere;
      word-break: break-word;
      line-height: 1.35;
      max-width: 100%;
      flex: 1 1 100%;
    }

    #${t} .st-roll-status-chat-list {
      display: flex;
      flex-direction: column;
      gap: 6px;
      padding: 8px;
      overflow: auto;
      min-height: 0;
    }

    #${t} .st-roll-status-chat-item {
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

    #${t} .st-roll-status-chat-item:hover {
      border-color: rgba(197, 160, 89, 0.58);
      background: rgba(197, 160, 89, 0.16);
    }

    #${t} .st-roll-status-chat-item.is-active {
      border-color: rgba(197, 160, 89, 0.74);
      background: rgba(197, 160, 89, 0.24);
      box-shadow: 0 0 0 1px rgba(197, 160, 89, 0.24);
    }

    #${t} .st-roll-status-chat-avatar-wrap {
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

    #${t} .st-roll-status-chat-avatar {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    #${t} .st-roll-status-chat-avatar-fallback {
      width: 100%;
      height: 100%;
      display: grid;
      place-items: center;
      font-size: 15px;
      font-weight: 700;
      color: rgba(255, 236, 201, 0.92);
      background: linear-gradient(145deg, rgba(197, 160, 89, 0.32), rgba(197, 160, 89, 0.12));
    }

    #${t} .st-roll-status-chat-main {
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 2px;
      text-align: left;
    }

    #${t} .st-roll-status-chat-name-marquee {
      display: block;
      min-width: 0;
      max-width: 100%;
      overflow: hidden;
    }

    #${t} .st-roll-status-chat-name-marquee.is-overflowing {
      mask-image: linear-gradient(90deg, transparent 0, #000 6%, #000 94%, transparent 100%);
      -webkit-mask-image: linear-gradient(90deg, transparent 0, #000 6%, #000 94%, transparent 100%);
    }

    #${t} .st-roll-status-chat-name-track {
      display: inline-flex;
      align-items: center;
      min-width: max-content;
      width: max-content;
      max-width: none;
      transform: translateX(0);
      will-change: transform;
    }

    #${t} .st-roll-status-chat-name-marquee.is-overflowing .st-roll-status-chat-name-track {
      animation: st-roll-status-chat-marquee var(--st-roll-status-chat-marquee-duration, 8s) ease-in-out infinite alternate;
    }

    #${t} .st-roll-status-chat-name {
      font-size: 13px;
      font-weight: 700;
      display: inline-flex;
      align-items: center;
      min-width: max-content;
      white-space: nowrap;
    }

    #${t} .st-roll-status-chat-time {
      font-size: 11px;
      opacity: 0.78;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    #${t} .st-roll-status-chat-key {
      font-size: 11px;
      opacity: 0.7;
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    #${t} .st-roll-status-chat-meta-line {
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

    #${t} .st-roll-status-splitter {
      cursor: col-resize;
      user-select: none;
      background: rgba(255, 255, 255, 0.04);
      border-left: 1px solid rgba(255, 255, 255, 0.06);
      border-right: 1px solid rgba(255, 255, 255, 0.06);
      transition: background-color 0.2s ease;
    }

    #${t} .st-roll-status-splitter:hover,
    #${t} .st-roll-status-splitter.is-resizing {
      background: rgba(197, 160, 89, 0.42);
    }

    #${t} .st-roll-status-main {
      padding: 10px;
      min-width: 0;
      min-height: 0;
      overflow-x: auto;
      overflow-y: hidden;
      display: flex;
      flex-direction: column;
    }

    #${t} .st-roll-status-mobile-sheet-head {
      display: none;
    }

    #${t} .st-roll-status-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      margin-top: 8px;
      margin-bottom: 8px;
      flex-wrap: wrap;
    }

    #${t} .st-roll-status-head-main {
      display: flex;
      flex-direction: column;
      gap: 3px;
      min-width: 0;
      flex: 1;
    }

    #${t} .st-roll-status-chat-meta {
      font-size: 11px;
      line-height: 1.4;
      opacity: 0.8;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    #${t} .st-roll-status-cols {
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

    #${t} .st-roll-status-cols span:nth-child(1),
    #${t} .st-roll-status-cols span:nth-child(2),
    #${t} .st-roll-status-cols span:nth-child(3),
    #${t} .st-roll-status-cols span:nth-child(4),
    #${t} .st-roll-status-cols span:nth-child(5),
    #${t} .st-roll-status-cols span:nth-child(6),
    #${t} .st-roll-status-cols span:nth-child(7) {
      text-align: center;
    }

    #${t} .st-roll-status-rows {
      display: flex;
      flex-direction: column;
      gap: 8px;
      flex: 1 1 auto;
      min-height: 0;
      overflow-y: auto;
      overflow-x: visible;
      padding-bottom: 4px;
    }

    #${t} .st-roll-status-row {
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

    #${t} .st-roll-status-field {
      display: contents;
    }

    #${t} .st-roll-status-field-label {
      display: none;
    }

    #${t} .st-roll-status-field-content {
      display: contents;
      min-width: 0;
    }

    #${t} .st-roll-status-field-content > * {
      min-width: 0;
    }

    #${t} .st-roll-status-bottom-grid {
      display: contents;
    }

    #${t} .st-roll-status-row .st-roll-status-name-wrap,
    #${t} .st-roll-status-row .st-roll-status-enabled-wrap,
    #${t} .st-roll-status-row .st-roll-status-actions-group {
      min-height: 36px;
    }

    #${t} .st-roll-status-enabled-card {
      display: flex;
      align-items: stretch;
      min-height: 36px;
      padding: 0;
      border-radius: 0;
      border: 0;
      background: transparent;
      box-sizing: border-box;
    }

    #${t} .st-roll-status-enabled-card .stx-shared-checkbox-body {
      min-height: 34px;
    }

    #${t} .st-roll-status-col-head[data-status-col-key="enabled"] {
      text-align: center;
    }

    #${t} .st-roll-status-col-head[data-status-col-key="actions"] {
      text-align: center;
    }

    #${t} .st-roll-status-enabled-card .stx-shared-checkbox-copy,
    #${t} .st-roll-status-enabled-card .stx-shared-checkbox-title {
      display: none;
    }

    #${t} .st-roll-status-field-enabled .st-roll-status-field-content {
      justify-content: center;
    }

    #${t} .st-roll-status-enabled-card .stx-shared-checkbox-body {
      justify-content: center;
    }

    #${t} .st-roll-status-row .st-roll-status-actions-group {
      justify-self: center;
      justify-content: center;
    }

    #${t} .st-roll-status-enabled-card .stx-shared-checkbox-title {
      font-size: 12px;
      line-height: 1.2;
    }

    #${t} .st-roll-status-row .st-roll-status-name-wrap {
      width: 100%;
      align-self: stretch;
    }

    #${t} .st-roll-status-row .st-roll-status-name,
    #${t} .st-roll-status-row .st-roll-status-modifier,
    #${t} .st-roll-status-row .st-roll-status-duration,
    #${t} .st-roll-status-row .st-roll-status-skills {
      width: 100%;
      min-width: 0;
      min-height: 36px;
      height: 36px;
    }

    #${t} .st-roll-status-row .stx-shared-select-trigger {
      min-height: 36px;
      height: 36px;
      padding-top: 0;
      padding-bottom: 0;
    }

    #${t} .st-roll-status-col-head {
      position: relative;
      min-width: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      padding-right: 8px;
    }

    #${t} .st-roll-status-col-resizer {
      position: absolute;
      top: 0;
      right: -4px;
      bottom: 0;
      width: 8px;
      cursor: col-resize;
      user-select: none;
      background: transparent;
    }

    #${t} .st-roll-status-col-resizer::before {
      content: "";
      position: absolute;
      top: 14%;
      bottom: 14%;
      left: 50%;
      width: 1px;
      transform: translateX(-50%);
      background: rgba(255, 255, 255, 0.24);
    }

    #${t} .st-roll-status-col-resizer:hover,
    #${t} .st-roll-status-col-resizer.is-resizing {
      background: rgba(197, 160, 89, 0.55);
    }

    #${t} .st-roll-status-col-resizer:hover::before,
    #${t} .st-roll-status-col-resizer.is-resizing::before {
      background: rgba(255, 236, 201, 0.72);
    }

    #${t} .st-roll-status-modifier,
    #${t} .st-roll-status-duration {
      text-align: center;
    }

    #${t} .st-roll-status-enabled-wrap {
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

    #${t} .st-roll-status-remove {
      padding-left: 0;
      padding-right: 0;
    }

    #${t} .st-roll-status-empty {
      border: 1px dashed rgba(255, 255, 255, 0.22);
      border-radius: 8px;
      padding: 10px;
      text-align: center;
      font-size: 12px;
      opacity: 0.7;
      background: rgba(255, 255, 255, 0.03);
    }

    #${t} .st-roll-status-errors {
      border: 1px solid rgba(255, 110, 110, 0.45);
      border-radius: 8px;
      padding: 8px 10px;
      background: rgba(120, 20, 20, 0.22);
      margin: 0;
    }

    #${t} .st-roll-status-error-item {
      font-size: 12px;
      line-height: 1.45;
      color: #ffd2d2;
    }

    #${t} .st-roll-status-dirty {
      margin: 0;
      min-height: 28px;
      font-size: 12px;
      line-height: 1.4;
      color: #ffe0a6;
      display: flex;
      align-items: center;
    }

    #${t} .st-roll-status-footer {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding-top: 10px;
    }

    #${t} .st-roll-tip {
      font-size: 12px;
      line-height: 1.5;
      opacity: 0.78;
      padding-top: 4px;
    }

    ${Jp(`#${t}`)}
    ${Pf(`#${t}`)}
    ${Wp(`#${t}`)}
    ${rf(`#${t}`)}
    ${Ef(`#${t}`)}

    #${t} input[type="checkbox"] {
      accent-color: var(--ss-theme-accent);
      transition: filter 0.2s ease;
    }

    #${t} .st-roll-tab:hover {
      opacity: 1;
      background: var(--ss-theme-list-item-hover-bg);
      box-shadow: none;
    }

    #${t} .st-roll-item:hover {
      border-color: var(--ss-theme-border-strong);
      background: var(--ss-theme-list-item-hover-bg);
      box-shadow: none;
    }

    #${t} .st-roll-select:hover {
      border-color: var(--ss-theme-border-strong);
      background-color: var(--ss-theme-surface-3);
      box-shadow: 0 0 0 1px var(--ss-theme-focus-ring);
    }

    #${t} .st-roll-textarea-wrap:hover {
      border-color: var(--ss-theme-border-strong);
      box-shadow: none;
    }

    #${t} .st-roll-btn:hover {
      border-color: var(--ss-theme-border-strong);
      background: var(--ss-theme-list-item-hover-bg);
      box-shadow: none;
    }

    #${t} .st-roll-select:focus {
      outline: none;
      border-color: var(--ss-theme-border-strong);
      box-shadow: 0 0 0 2px var(--ss-theme-focus-ring);
    }

    #${t} .st-roll-shell {
      color: inherit;
      border-color: transparent;
      background: transparent;
      backdrop-filter: none;
    }

    #${t} .st-roll-content {
      border-top-color: var(--ss-theme-border);
      background: var(--ss-theme-surface-2);
    }

    #${t} .st-roll-tabs {
      border-color: var(--ss-theme-border);
      background: var(--ss-theme-surface-2);
    }

    #${t} .st-roll-tab.is-active {
      color: var(--ss-theme-text);
      background: var(--ss-theme-list-item-active-bg);
    }

    #${t} .st-roll-divider-line {
      background: var(--ss-theme-border);
    }

    #${t} .st-roll-item {
      border-color: var(--ss-theme-border);
      background: var(--ss-theme-surface-2);
    }

    #${t} .st-roll-about-meta a {
      border-bottom-color: var(--ss-theme-border);
    }

    #${t} .st-roll-select,
    #${t} .st-roll-select {
      color: var(--ss-theme-text);
      border-color: var(--ss-theme-border);
      background: var(--ss-theme-surface-2);
    }

    #${t} .st-roll-btn {
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

    #${t} .st-roll-btn.secondary {
      border-color: var(--ss-theme-border);
      background: var(--ss-theme-surface-2);
      --stx-button-border: var(--ss-theme-border);
      --stx-button-bg: var(--ss-theme-surface-2);
    }

    #${t} .st-roll-btn.danger {
      border-color: var(--ss-theme-border);
      background: var(--ss-theme-surface-2);
      --stx-button-border: var(--ss-theme-border);
      --stx-button-bg: var(--ss-theme-surface-2);
      --stx-button-hover-border: var(--ss-theme-border-strong);
      --stx-button-hover-bg: var(--ss-theme-list-item-hover-bg);
      --stx-button-hover-shadow: none;
    }

    #${t} .st-roll-textarea-wrap,
    #${t} .st-roll-skill-presets,
    #${t} .st-roll-status-layout {
      border-color: var(--ss-theme-border);
      background: var(--ss-theme-surface-2);
    }

    #${t} .st-roll-skill-modal-panel,
    #${t} .st-roll-status-modal-panel {
      border-color: var(--ss-theme-panel-border);
      background: var(--ss-theme-panel-bg);
      box-shadow: var(--ss-theme-panel-shadow);
    }

    #${t} .st-roll-skill-modal-head,
    #${t} .st-roll-status-modal-head {
      border-bottom-color: var(--ss-theme-border);
      background: var(--ss-theme-toolbar-bg);
    }

    #${t} .st-roll-status-layout {
      border-color: var(--ss-theme-border);
      background: var(--ss-theme-surface-2);
    }

    #${t} .st-roll-status-sidebar {
      border-right-color: var(--ss-theme-border);
      background: var(--ss-theme-surface-2);
    }

    #${t} .st-roll-status-sidebar-head {
      border-bottom-color: var(--ss-theme-border);
      background: var(--ss-theme-toolbar-bg);
    }

    #${t} .st-roll-status-chat-item,
    #${t} .st-roll-skill-preset-item {
      border-color: var(--ss-theme-border);
      background: var(--ss-theme-surface-3);
    }

    #${t} .st-roll-status-chat-item:hover,
    #${t} .st-roll-skill-preset-item:hover {
      border-color: var(--ss-theme-border-strong);
      background: var(--ss-theme-list-item-hover-bg);
    }

    #${t} .st-roll-status-chat-item.is-active,
    #${t} .st-roll-skill-preset-item.is-active {
      border-color: var(--ss-theme-border-strong);
      background: var(--ss-theme-list-item-active-bg);
      box-shadow: none;
    }

    #${t} .st-roll-status-splitter {
      user-select: none;
      background: var(--ss-theme-surface-2);
      border-left-color: var(--ss-theme-border);
      border-right-color: var(--ss-theme-border);
    }

    #${t} .st-roll-status-splitter:hover,
    #${t} .st-roll-status-splitter.is-resizing {
      background: var(--ss-theme-list-item-hover-bg);
    }

    #${t} .st-roll-skill-modal::backdrop,
    #${t} .st-roll-status-modal::backdrop {
      background: var(--ss-theme-backdrop);
      backdrop-filter: var(--ss-theme-backdrop-filter);
    }

    #${t} .stx-shared-box-checkbox {
      --stx-box-checkbox-border: color-mix(in srgb, var(--ss-theme-accent) 52%, var(--ss-theme-border));
      --stx-box-checkbox-bg: color-mix(in srgb, var(--ss-theme-surface-3) 92%, transparent);
      --stx-box-checkbox-hover-border: color-mix(in srgb, var(--ss-theme-accent) 72%, #fff 10%);
      --stx-box-checkbox-focus-ring: color-mix(in srgb, var(--ss-theme-accent) 24%, transparent);
      --stx-box-checkbox-checked-border: color-mix(in srgb, var(--ss-theme-accent) 84%, #fff 8%);
      --stx-box-checkbox-checked-bg: color-mix(in srgb, var(--ss-theme-accent) 24%, var(--ss-theme-surface-3));
      --stx-box-checkbox-indicator: var(--ss-theme-accent-contrast);
    }

    #${t} .st-roll-tab:hover {
      opacity: 1;
      background: var(--ss-theme-list-item-hover-bg);
      box-shadow: none;
    }

    #${t} .st-roll-item:hover {
      border-color: var(--ss-theme-border-strong);
      background: var(--ss-theme-list-item-hover-bg);
      box-shadow: none;
    }

    #${t} .st-roll-select:hover,
    #${t} .st-roll-input:hover,
    #${t} .st-roll-search:hover,
    #${t} .st-roll-textarea:hover {
      border-color: var(--ss-theme-border-strong);
      background-color: var(--ss-theme-surface-3);
      box-shadow: 0 0 0 1px var(--ss-theme-focus-ring);
    }

    #${t} .st-roll-textarea-wrap:hover {
      border-color: var(--ss-theme-border-strong);
      box-shadow: none;
    }

    #${t} .st-roll-btn:hover {
      border-color: var(--ss-theme-border-strong);
      background: var(--ss-theme-list-item-hover-bg);
      box-shadow: none;
    }

    #${t} .st-roll-btn.danger:hover {
      border-color: var(--ss-theme-border-strong);
      background: var(--ss-theme-list-item-hover-bg);
      box-shadow: none;
    }

    #${t} .st-roll-select:focus,
    #${t} .st-roll-input:focus,
    #${t} .st-roll-search:focus,
    #${t} .st-roll-textarea:focus {
      outline: none;
      border-color: var(--ss-theme-border-strong);
      box-shadow: 0 0 0 2px var(--ss-theme-focus-ring);
    }

    #${t} .st-roll-content[data-ss-theme="host"] .st-roll-select.text_pole,
    #${t} .st-roll-content[data-ss-theme="host"] .st-roll-input.text_pole,
    #${t} .st-roll-content[data-ss-theme="host"] .st-roll-search.text_pole,
    #${t} .st-roll-content[data-ss-theme="host"] .st-roll-textarea.text_pole {
      margin: 0;
      box-shadow: none;
    }

    #${t} .st-roll-content[data-ss-theme="host"] .st-roll-select.text_pole {
      background-image: none !important;
      text-align: left;
      text-align-last: left;
      appearance: auto;
      -webkit-appearance: auto;
      -moz-appearance: auto;
      padding-right: 20px;
    }

    #${t} .st-roll-content[data-ss-theme="host"] .st-roll-tab.menu_button,
    #${t} .st-roll-content[data-ss-theme="host"] .st-roll-btn.menu_button {
      margin: 0;
      width: auto;
      min-height: 30px;
    }

    #${t} .st-roll-content[data-ss-theme="host"] .st-roll-tab.menu_button {
      flex: 1;
      min-width: 0;
      border-radius: 999px;
      padding: 6px 10px;
      filter: grayscale(0.15);
      opacity: 0.85;
    }

    #${t} .st-roll-content[data-ss-theme="host"] .st-roll-tab.menu_button.is-active,
    #${t} .st-roll-content[data-ss-theme="host"] .st-roll-tab.menu_button.active {
      opacity: 1;
      filter: none;
      background-color: var(--white30a, rgba(255, 255, 255, 0.3));
    }

    #${t} .st-roll-content[data-ss-theme="host"] .st-roll-btn.menu_button {
      padding: 3px 8px;
    }

    #${t} .st-roll-content[data-ss-theme="host"] .st-roll-select.text_pole:hover,
    #${t} .st-roll-content[data-ss-theme="host"] .st-roll-input.text_pole:hover,
    #${t} .st-roll-content[data-ss-theme="host"] .st-roll-search.text_pole:hover,
    #${t} .st-roll-content[data-ss-theme="host"] .st-roll-textarea.text_pole:hover {
      border-color: var(--ss-theme-border);
      background-color: var(--black30a, rgba(0, 0, 0, 0.3));
      box-shadow: none;
    }

    #${t} .st-roll-content[data-ss-theme="host"] .st-roll-select.text_pole:focus,
    #${t} .st-roll-content[data-ss-theme="host"] .st-roll-input.text_pole:focus,
    #${t} .st-roll-content[data-ss-theme="host"] .st-roll-search.text_pole:focus,
    #${t} .st-roll-content[data-ss-theme="host"] .st-roll-textarea.text_pole:focus {
      border-color: var(--ss-theme-border);
      box-shadow: none;
    }

    #${t} .st-roll-content[data-ss-theme="host"] .st-roll-tab.menu_button:hover,
    #${t} .st-roll-content[data-ss-theme="host"] .st-roll-btn.menu_button:hover {
      border-color: var(--ss-theme-border);
      background-color: var(--white30a, rgba(255, 255, 255, 0.3));
      box-shadow: none;
    }

    #${t} .st-roll-content[data-ss-theme="host"] .st-roll-btn.danger.menu_button:hover {
      border-color: var(--ss-theme-border-strong);
      background: var(--ss-theme-list-item-hover-bg);
      box-shadow: none;
    }

    #${t} .st-roll-workbench {
      --st-roll-status-sidebar-width: 276px;
      display: grid;
      height: 100%;
      border: 1px solid var(--ss-theme-border);
      border-radius: 14px;
      background: var(--ss-theme-surface-2);
      overflow: hidden;
    }

    #${t} .st-roll-workbench-sidebar,
    #${t} .st-roll-workbench-main {
      min-width: 0;
      min-height: 0;
    }

    #${t} .st-roll-workbench-sidebar {
      display: flex;
      flex-direction: column;
      gap: 10px;
      padding: 10px;
      background: var(--ss-theme-surface-3);
      border-right: 1px solid var(--ss-theme-border);
    }

    #${t} .st-roll-workbench-main {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 14px;
      background: linear-gradient(180deg, var(--ss-theme-surface-3), transparent 100%);
    }

    #${t} .st-roll-workbench-context,
    #${t} .st-roll-workbench-toolbar {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
      padding: 10px 12px;
      border: 1px solid var(--ss-theme-border);
      border-radius: 12px;
      background: var(--ss-theme-toolbar-bg);
    }

    #${t} .st-roll-workbench-context {
      align-items: flex-start;
      justify-content: space-between;
    }

    #${t} .st-roll-status-context {
      display: grid;
      grid-template-columns: minmax(240px, auto) minmax(0, 1fr);
      align-items: center;
      gap: 6px 14px;
      padding: 8px 12px;
      min-height: 0;
    }

    #${t} .st-roll-status-context .st-roll-workbench-head-copy {
      gap: 2px;
    }

    #${t} .st-roll-status-context .st-roll-field-label {
      font-size: 14px;
      line-height: 1.2;
    }

    #${t} .st-roll-status-context .st-roll-status-chat-meta {
      font-size: 11px;
      line-height: 1.25;
    }

    #${t} .st-roll-status-context .st-roll-tip {
      padding-top: 0;
      margin: 0;
      font-size: 11px;
      line-height: 1.35;
      text-align: right;
      opacity: 0.72;
    }

    #${t} .st-roll-workbench-sidebar-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      padding: 10px 12px;
      border: 1px solid var(--ss-theme-border);
      border-radius: 12px;
      background: var(--ss-theme-toolbar-bg);
    }

    #${t} .st-roll-workbench-sidebar-copy,
    #${t} .st-roll-workbench-head-copy {
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 0;
    }

    #${t} .st-roll-workbench-subtitle,
    #${t} .st-roll-workbench-selection {
      font-size: 12px;
      line-height: 1.4;
      color: var(--ss-theme-text-muted);
    }

    #${t} .st-roll-workbench-selection {
      display: inline-flex;
      align-items: center;
      min-height: 30px;
      padding: 0 10px;
      border-radius: 999px;
      border: 1px solid var(--ss-theme-border);
      background: var(--ss-theme-list-item-hover-bg);
      white-space: nowrap;
    }

    #${t} .st-roll-status-selection-count {
      min-height: 28px;
      padding: 0 8px;
      font-size: 11px;
    }

    #${t} .st-roll-workbench-select {
      min-width: 132px;
    }

    #${t} .st-roll-inline-toggle {
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

    #${t} .st-roll-status-toolbar {
      gap: 6px;
      padding: 8px 10px;
    }

    #${t} .st-roll-status-toolbar .st-roll-workbench-select {
      min-width: 122px;
    }

    #${t} .st-roll-status-toolbar .st-roll-inline-toggle {
      min-height: 28px;
      padding: 0 8px;
      gap: 6px;
      font-size: 12px;
    }

    #${t} .st-roll-toolbar-icon-btn {
      width: 28px;
      min-width: 28px;
      min-height: 28px;
      padding: 0;
      border-radius: 8px;
      gap: 0;
      flex: 0 0 auto;
    }

    #${t} .st-roll-toolbar-icon-btn .stx-shared-button-label {
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

    #${t} .st-roll-toolbar-icon-btn .stx-shared-button-icon {
      width: 14px;
      height: 14px;
      font-size: 13px;
    }

    #${t} .st-roll-inline-toggle input[type="checkbox"] {
      margin: 0;
    }

    #${t} .st-roll-skill-layout,
    #${t} .st-roll-status-layout {
      background: var(--ss-theme-surface-2);
      border-color: var(--ss-theme-border);
    }

    #${t} .st-roll-skill-layout {
      grid-template-columns: minmax(260px, 320px) minmax(0, 1fr);
    }

    #${t} .st-roll-status-layout {
      grid-template-columns: minmax(220px, var(--st-roll-status-sidebar-width)) 8px minmax(0, 1fr);
    }

    #${t} .st-roll-skill-presets,
    #${t} .st-roll-status-sidebar {
      background: var(--ss-theme-surface-3);
      border-color: var(--ss-theme-border);
    }

    #${t} .st-roll-workbench-toolbar-sidebar {
      gap: 6px;
      padding: 8px;
    }

    #${t} .st-roll-status-sidebar .st-roll-workbench-toolbar-sidebar {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto auto;
      align-items: center;
      padding: 8px;
    }

    #${t} .st-roll-status-sidebar .st-roll-status-chat-search {
      grid-column: 1 / -1;
    }

    #${t} .st-roll-status-sidebar .st-roll-workbench-select {
      min-width: 0;
      width: 100%;
    }

    #${t} .st-roll-status-sidebar .stx-shared-select {
      width: 100%;
    }

    #${t} .st-roll-status-sidebar .st-roll-btn {
      min-height: 30px;
      padding: 4px 10px;
    }

    #${t} .st-roll-status-sidebar-head {
      padding: 8px 12px;
    }

    #${t} .st-roll-status-head-main {
      gap: 2px;
    }

    #${t} .st-roll-status-memory-state {
      font-size: 11px;
      line-height: 1.3;
    }

    #${t} .st-roll-status-chat-list {
      gap: 6px;
    }

    #${t} .st-roll-skill-main,
    #${t} .st-roll-status-main {
      overflow: hidden;
    }

    #${t} .st-roll-skill-preset-list,
    #${t} .st-roll-status-chat-list,
    #${t} .st-roll-skill-rows,
    #${t} .st-roll-status-rows {
      scrollbar-width: thin;
    }

    #${t} .st-roll-skill-preset-list,
    #${t} .st-roll-status-chat-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
      flex: 1 1 auto;
      min-height: 0;
      overflow-y: auto;
    }

    #${t} .st-roll-skill-preset-item,
    #${t} .st-roll-status-chat-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      padding: 12px;
      border-radius: 12px;
    }

    #${t} .st-roll-skill-preset-item {
      align-items: flex-start;
    }

    #${t} .st-roll-skill-preset-name {
      font-size: 14px;
      font-weight: 700;
      line-height: 1.35;
    }

    #${t} .st-roll-skill-preset-tags {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      flex-wrap: wrap;
      justify-content: flex-end;
    }

    #${t} .st-roll-skill-preset-tag {
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

    #${t} .st-roll-skill-preset-tag.active {
      color: var(--ss-theme-accent-contrast);
      background: var(--ss-theme-accent);
      border-color: var(--ss-theme-accent);
    }

    #${t} .st-roll-skill-preset-tag.locked {
      background: transparent;
    }

    #${t} .st-roll-skill-preset-meta,
    #${t} .st-roll-status-memory-state,
    #${t} .st-roll-status-chat-meta {
      font-size: 12px;
      line-height: 1.45;
      color: var(--ss-theme-text-muted);
    }

    #${t} .st-roll-status-chat-item {
      align-items: stretch;
      gap: 12px;
    }

    #${t} .st-roll-status-chat-main {
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 0;
      flex: 1 1 auto;
      text-align: left;
    }

    #${t} .st-roll-status-chat-name {
      font-size: 14px;
      font-weight: 700;
      line-height: 1.3;
    }

    #${t} .st-roll-status-chat-time,
    #${t} .st-roll-status-chat-key,
    #${t} .st-roll-status-chat-meta-line {
      font-size: 12px;
      line-height: 1.35;
      color: var(--ss-theme-text-muted);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    #${t} .st-roll-status-chat-meta-line {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    #${t} .st-roll-status-chat-avatar-wrap {
      flex: 0 0 56px;
      width: 56px;
      height: 56px;
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid var(--ss-theme-border);
      background: var(--ss-theme-list-item-hover-bg);
    }

    #${t} .st-roll-status-chat-avatar,
    #${t} .st-roll-status-chat-avatar-fallback {
      width: 100%;
      height: 100%;
    }

    #${t} .st-roll-status-chat-avatar {
      object-fit: cover;
      display: block;
    }

    #${t} .st-roll-status-chat-avatar-fallback {
      display: grid;
      place-items: center;
      font-size: 26px;
      font-weight: 700;
      color: var(--ss-theme-accent-contrast);
    }

    #${t} .st-roll-skill-cols,
    #${t} .st-roll-status-cols {
      background: transparent;
      border-bottom: 1px solid var(--ss-theme-border);
      padding-bottom: 8px;
      margin-bottom: 0;
    }

    #${t} .st-roll-skill-rows,
    #${t} .st-roll-status-rows {
      flex: 1 1 auto;
      min-height: 0;
      padding: 10px;
      border: 1px solid var(--ss-theme-border);
      border-radius: 14px;
      background: var(--ss-theme-surface-3);
    }

    #${t} .st-roll-skill-row,
    #${t} .st-roll-status-row {
      align-items: stretch;
    }

    #${t} .st-roll-skill-name-wrap,
    #${t} .st-roll-status-name-wrap {
      display: flex;
      align-items: center;
      gap: 6px;
      min-width: 0;
    }

    #${t} .st-roll-skill-name-wrap {
      width: 100%;
    }

    #${t} .st-roll-skill-name,
    #${t} .st-roll-skill-modifier {
      min-height: 32px;
    }

    #${t} .st-roll-skill-name {
      flex: 1 1 auto;
      width: 100%;
      min-width: 0;
    }

    #${t} .st-roll-skill-name {
      font-size: 13px;
    }

    #${t} .st-roll-skill-modifier {
      text-align: center;
      font-size: 13px;
      padding-left: 6px;
      padding-right: 6px;
    }

    #${t} .st-roll-skill-row-select,
    #${t} .st-roll-status-row-select {
      flex: 0 0 auto;
      width: 16px;
      height: 16px;
      margin: 0;
      display: inline-grid;
      place-items: center;
      align-self: center;
      --stx-box-checkbox-size: 16px;
    }

    #${t} .st-roll-skill-actions-group,
    #${t} .st-roll-status-actions-group {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-wrap: nowrap;
    }

    #${t} .st-roll-skill-actions-group {
      display: grid;
      grid-template-columns: repeat(4, 28px);
      gap: 4px;
      justify-content: end;
      align-content: center;
    }

    #${t} .st-roll-skill-actions-group .st-roll-btn,
    #${t} .st-roll-status-actions-group .st-roll-btn {
      min-height: 28px;
      padding: 3px 8px;
      font-size: 12px;
    }

    #${t} .st-roll-skill-actions-group .st-roll-btn {
      width: 28px;
      min-width: 28px;
      min-height: 28px;
      padding: 0;
      font-size: 11px;
      line-height: 1;
    }

    #${t} .st-roll-status-actions-group {
      justify-content: flex-end;
      display: grid;
      grid-template-columns: repeat(2, 28px);
      gap: 6px;
      align-content: center;
    }

    #${t} .st-roll-status-actions-group .st-roll-toolbar-icon-btn {
      width: 28px;
      min-width: 28px;
      min-height: 28px;
      padding: 0;
      line-height: 1;
    }

    #${t} .st-roll-skill-empty,
    #${t} .st-roll-status-empty {
      display: grid;
      place-items: center;
      min-height: 120px;
      border: 1px dashed var(--ss-theme-border);
      border-radius: 12px;
      background: var(--ss-theme-surface-3);
      color: var(--ss-theme-text-muted);
    }

    @media (max-width: 680px) {
      #${t} .st-roll-workbench-toolbar,
      #${t} .st-roll-workbench-context,
      #${t} .st-roll-workbench-sidebar-head {
        flex-direction: column;
        align-items: stretch;
      }

      #${t} .st-roll-workbench-selection,
      #${t} .st-roll-inline-toggle,
      #${t} .st-roll-workbench-select {
        width: 100%;
      }

      #${t} .st-roll-skill-modal-panel {
        width: 100vw;
        height: 100vh;
        margin: 0;
        border-radius: 0;
      }

      #${t} .st-roll-skill-modal-head {
        padding: 10px 12px;
      }

      #${t} .st-roll-skill-modal-body {
        padding: 10px;
      }

      #${t} .st-roll-skill-layout {
        grid-template-columns: 1fr;
      }

      #${t} .st-roll-skill-presets {
        min-height: 0;
      }

      #${t} .st-roll-skill-head {
        flex-direction: column;
        align-items: stretch;
      }

      #${t} .st-roll-skill-actions-group,
      #${t} .st-roll-status-actions-group {
        width: 100%;
      }

      #${t} .st-roll-skill-cols {
        display: none;
      }

      #${t} .st-roll-skill-row {
        grid-template-columns: 1fr;
      }

      #${t} .st-roll-skill-modifier {
        text-align: left;
      }

      #${t} .st-roll-skill-remove {
        width: 100%;
      }

      #${t} .st-roll-status-modal-panel {
        width: 100vw;
        height: 100vh;
        margin: 0;
        border-radius: 0;
      }

      #${t} .st-roll-status-modal {
        --st-roll-status-mobile-sheet-height: min(92vh, 920px);
        --st-roll-status-mobile-sheet-translate: calc(var(--st-roll-status-mobile-sheet-height) + 84px);
        --st-roll-status-mobile-sheet-backdrop-opacity: 0;
      }

      #${t} .st-roll-status-modal-backdrop {
        opacity: var(--st-roll-status-mobile-sheet-backdrop-opacity, 0);
      }

      #${t} .st-roll-status-modal.is-mobile-sheet-dragging .st-roll-status-modal-backdrop {
        transition: none;
      }

      #${t} .st-roll-status-modal-head {
        padding: 10px 12px;
      }

      #${t} .st-roll-status-modal-body {
        padding: 0;
        position: relative;
      }

      #${t} .st-roll-status-layout {
        display: block;
        position: relative;
        min-height: 0;
        height: 100%;
        border: 0;
        border-radius: 0;
        background: transparent;
      }

      #${t} .st-roll-status-sidebar {
        min-width: 0;
        height: 100%;
        border: 0;
        background: transparent;
        padding: 12px 12px 20px;
        gap: 10px;
      }

      #${t} .st-roll-status-splitter {
        display: none;
      }

      #${t} .st-roll-status-sidebar .st-roll-workbench-toolbar-sidebar {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto auto;
        gap: 8px;
        padding: 10px;
        border-radius: 16px;
      }

      #${t} .st-roll-status-sidebar .st-roll-status-chat-search {
        grid-column: 1 / -1;
      }

      #${t} .st-roll-status-sidebar .st-roll-workbench-select {
        min-width: 0;
      }

      #${t} .st-roll-status-sidebar .st-roll-btn {
        min-width: 84px;
        min-height: 34px;
      }

      #${t} .st-roll-status-sidebar-head {
        padding: 10px 12px;
        border-radius: 16px;
      }

      #${t} .st-roll-status-chat-list {
        flex: 1 1 auto;
        min-height: 0;
        overflow-y: auto;
        padding-bottom: 24px;
        gap: 10px;
      }

      #${t} .st-roll-status-chat-item {
        align-items: center;
        padding: 12px;
        min-height: 76px;
        border-radius: 16px;
      }

      #${t} .st-roll-status-chat-avatar-wrap {
        flex-basis: 60px;
        width: 60px;
        height: 60px;
      }

      #${t} .st-roll-status-main {
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

      #${t} .st-roll-status-modal.is-mobile-sheet-open .st-roll-status-main,
      #${t} .st-roll-status-modal.is-mobile-sheet-dragging .st-roll-status-main {
        pointer-events: auto;
      }

      #${t} .st-roll-status-modal.is-mobile-sheet-expanded .st-roll-status-main {
        box-shadow: 0 -22px 46px rgba(0, 0, 0, 0.5);
      }

      #${t} .st-roll-status-modal.is-mobile-sheet-dragging .st-roll-status-main {
        transition: none;
      }

      #${t} .st-roll-status-mobile-sheet-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        padding: 10px 4px 8px;
        position: relative;
        user-select: none;
        touch-action: none;
      }

      #${t} .st-roll-status-mobile-sheet-head::before {
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

      #${t} .st-roll-status-mobile-back {
        min-height: 32px;
      }

      #${t} .st-roll-status-mobile-sheet-copy {
        min-width: 0;
        flex: 1 1 auto;
        display: flex;
        align-items: center;
        justify-content: flex-end;
        font-size: 12px;
        color: var(--ss-theme-text-muted);
      }

      #${t} .st-roll-status-context {
        grid-template-columns: 1fr;
        gap: 4px;
        padding: 8px 10px;
        border-radius: 14px;
      }

      #${t} .st-roll-status-context .st-roll-tip {
        text-align: left;
        font-size: 11px;
        line-height: 1.35;
      }

      #${t} .st-roll-status-toolbar {
        display: grid;
        grid-template-columns: repeat(6, minmax(0, 1fr));
        gap: 8px;
        padding: 10px;
        border-radius: 16px;
      }

      #${t} .st-roll-status-toolbar .st-roll-status-search {
        grid-column: 1 / -1;
      }

      #${t} .st-roll-status-toolbar .st-roll-workbench-select {
        grid-column: span 3;
        min-width: 0;
        width: 100%;
      }

      #${t} .st-roll-status-toolbar .st-roll-inline-toggle {
        grid-column: span 3;
        width: 100%;
        min-height: 34px;
        justify-content: flex-start;
      }

      #${t} .st-roll-status-selection-count {
        grid-column: span 2;
        width: 100%;
        justify-content: center;
        min-height: 32px;
      }

      #${t} .st-roll-status-toolbar .st-roll-toolbar-icon-btn {
        width: 100%;
        min-width: 0;
        min-height: 34px;
        border-radius: 10px;
      }

      #${t} .st-roll-status-head {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        align-items: center;
        flex-wrap: nowrap;
        gap: 6px;
      }

      #${t} .st-roll-status-head-main {
        gap: 2px;
        min-width: 0;
      }

      #${t} .st-roll-status-head .st-roll-workbench-subtitle {
        font-size: 11px;
        line-height: 1.3;
      }

      #${t} .st-roll-status-head .st-roll-actions {
        display: grid;
        grid-auto-flow: column;
        grid-auto-columns: max-content;
        align-items: center;
        justify-content: end;
        gap: 6px;
        min-width: 0;
      }

      #${t} .st-roll-status-head .st-roll-btn {
        min-height: 30px;
        padding: 0 10px;
        font-size: 11px;
      }

      #${t} .st-roll-status-cols {
        display: none;
      }

      #${t} .st-roll-status-actions-group {
        width: 100%;
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 8px;
      }

      #${t} .st-roll-status-actions-group .st-roll-btn {
        width: 100%;
        min-width: 0;
        min-height: 32px;
      }

      #${t} .st-roll-status-rows {
        padding: 8px;
        border-radius: 16px;
        overflow-x: hidden;
        overflow-y: auto;
        -webkit-overflow-scrolling: touch;
      }

      #${t} .st-roll-status-row {
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 8px;
        padding: 12px;
        border: 1px solid var(--ss-theme-border);
        border-radius: 16px;
        background: color-mix(in srgb, var(--ss-theme-surface-3) 88%, transparent);
        min-width: 0;
      }

      #${t} .st-roll-status-field {
        display: flex;
        flex-direction: column;
        gap: 5px;
        min-width: 0;
      }

      #${t} .st-roll-status-field-label {
        display: block;
        padding: 0 2px;
        font-size: 10px;
        font-weight: 700;
        line-height: 1.2;
        letter-spacing: 0.04em;
        color: var(--ss-theme-text-muted);
        opacity: 0.72;
      }

      #${t} .st-roll-status-field-content {
        display: block;
        min-width: 0;
      }

      #${t} .st-roll-status-field-name,
      #${t} .st-roll-status-field-skills {
        grid-column: 1 / -1;
      }

      #${t} .st-roll-status-bottom-grid {
        grid-column: 1 / -1;
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        align-items: center;
        gap: 8px;
        min-width: 0;
      }

      #${t} .st-roll-status-field-enabled {
        min-width: 0;
      }

      #${t} .st-roll-status-field-actions {
        justify-self: end;
        width: max-content;
        max-width: 100%;
      }

      #${t} .st-roll-status-field-name .st-roll-status-field-label {
        padding-left: 32px;
      }

      #${t} .st-roll-status-field-enabled .st-roll-status-field-label {
        display: none;
      }

      #${t} .st-roll-status-field-actions .st-roll-status-field-label {
        display: none;
      }

      #${t} .st-roll-status-row .st-roll-status-name-wrap {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr);
        align-items: center;
        gap: 8px;
        width: 100%;
      }

      #${t} .st-roll-status-row .st-roll-status-name,
      #${t} .st-roll-status-row .st-roll-status-modifier,
      #${t} .st-roll-status-row .st-roll-status-duration,
      #${t} .st-roll-status-row .st-roll-status-skills,
      #${t} .st-roll-status-row .stx-shared-select {
        width: 100%;
        min-width: 0;
      }

      #${t} .st-roll-status-row .st-roll-status-name,
      #${t} .st-roll-status-row .st-roll-status-modifier,
      #${t} .st-roll-status-row .st-roll-status-duration,
      #${t} .st-roll-status-row .st-roll-status-skills,
      #${t} .st-roll-status-row .stx-shared-select-trigger,
      #${t} .st-roll-status-enabled-wrap {
        min-height: 36px;
        height: 36px;
      }

      #${t} .st-roll-status-modifier {
        text-align: left;
      }

      #${t} .st-roll-status-field-scope .st-roll-status-scope-select,
      #${t} .st-roll-status-field-scope .stx-shared-select {
        width: 100%;
      }

      #${t} .st-roll-status-enabled-card {
        width: auto;
        max-width: 100%;
        min-width: 0;
        min-height: 36px;
        margin-left: auto;
        padding: 0;
      }

      #${t} .st-roll-status-enabled-card .stx-shared-checkbox-body {
        justify-content: flex-end;
        gap: 4px;
      }

      #${t} .st-roll-status-enabled-card .stx-shared-checkbox-copy {
        flex: 0 0 auto;
      }

      #${t} .st-roll-status-enabled-card .stx-shared-checkbox-control {
        padding: 2px 6px 2px 4px;
      }

      #${t} .st-roll-status-enabled-card .stx-shared-checkbox-title {
        font-size: 12px;
      }

      #${t} .st-roll-status-field-enabled .st-roll-status-field-content,
      #${t} .st-roll-status-field-actions .st-roll-status-field-content {
        display: flex;
        align-items: center;
        min-height: 36px;
      }

      #${t} .st-roll-status-field-enabled .st-roll-status-field-content {
        justify-content: flex-end;
        width: 100%;
      }

      #${t} .st-roll-status-field-actions .st-roll-status-field-content {
        justify-content: flex-end;
        width: max-content;
        max-width: 100%;
      }

      #${t} .st-roll-status-actions-group {
        width: auto;
        grid-template-columns: repeat(2, 28px);
        gap: 6px;
        justify-content: flex-end;
      }

      #${t} .st-roll-status-actions-group .st-roll-btn,
      #${t} .st-roll-status-actions-group .st-roll-toolbar-icon-btn {
        width: 28px;
        min-width: 28px;
        min-height: 28px;
        border-radius: 9px;
        padding: 0;
      }

      #${t} .st-roll-status-actions-group .stx-shared-button-icon {
        font-size: 11px;
      }

      #${t} .st-roll-status-duplicate,
      #${t} .st-roll-status-remove {
        width: 28px;
      }
    }

    @media (max-width: 768px) {
      #${t} .st-roll-status-chat-meta {
        white-space: normal;
      }
    }
  `;
}
const Yf = "SS-Helper [骰子助手]", Wf = "Shion", Xf = "1.1.6", Jf = "https://github.com/ShionCox/SS-Helper-RollHelper", Qf = "348591466@qq.com", Fa = {
  display_name: Yf,
  author: Wf,
  version: Xf,
  homePage: Jf,
  email: Qf
}, $e = "stx_rollhelper", Bn = "st-roll-settings-Event-card", Zf = "st-roll-settings-Event-style", Yu = "st-roll-settings-Event-badge", _i = "st-roll-settings-Event-enabled", Ti = "st-roll-settings-Event-auto-rule", ki = "st-roll-settings-Event-ai-roll-mode", wi = "st-roll-settings-Event-ai-round-control", Ii = "st-roll-settings-Event-exploding-enabled", Ai = "st-roll-settings-Event-advantage-enabled", $i = "st-roll-settings-Event-dynamic-result-guidance", Ri = "st-roll-settings-Event-dynamic-dc-reason", Ci = "st-roll-settings-Event-status-system-enabled", Di = "st-roll-settings-Event-status-editor-open", _o = "st-roll-settings-Event-status-modal", Wu = "st-roll-settings-Event-status-modal-close", Ni = "st-roll-settings-Event-status-refresh", Li = "st-roll-settings-Event-status-clean-unused", Mi = "st-roll-settings-Event-status-rows", Xu = "st-roll-settings-Event-status-add", Ju = "st-roll-settings-Event-status-save", Qu = "st-roll-settings-Event-status-reset", Oi = "st-roll-settings-Event-status-errors", Pi = "st-roll-settings-Event-status-dirty-hint", tg = "st-roll-settings-Event-status-layout", eg = "st-roll-settings-Event-status-sidebar", Zu = "st-roll-settings-Event-status-splitter", td = "st-roll-settings-Event-status-chat-list", ed = "st-roll-settings-Event-status-chat-meta", rd = "st-roll-settings-Event-status-cols", nd = "st-roll-settings-Event-status-memory-state", Bi = "st-roll-settings-Event-allowed-dice-sides", Ui = "st-roll-settings-Event-theme", Hi = "st-roll-settings-Event-summary-detail", zi = "st-roll-settings-Event-summary-rounds", Gi = "st-roll-settings-Event-apply-scope", Ki = "st-roll-settings-Event-outcome-branches", ji = "st-roll-settings-Event-explode-outcome", qi = "st-roll-settings-Event-summary-outcome", Fi = "st-roll-settings-Event-list-outcome-preview", Vi = "st-roll-settings-Event-time-limit-enabled", Yi = "st-roll-settings-Event-time-limit-min-seconds", sd = "st-roll-settings-Event-time-limit-row", Wi = "st-roll-settings-Event-skill-enabled", rg = "st-roll-settings-Event-skill-editor-wrap", To = "st-roll-settings-Event-skill-rows", od = "st-roll-settings-Event-skill-add", ad = "st-roll-settings-Event-skill-text", id = "st-roll-settings-Event-skill-import-toggle", ld = "st-roll-settings-Event-skill-import-area", cd = "st-roll-settings-Event-skill-import-apply", ud = "st-roll-settings-Event-skill-export", dd = "st-roll-settings-Event-skill-save", md = "st-roll-settings-Event-skill-reset", hd = "st-roll-settings-Event-skill-errors", pd = "st-roll-settings-Event-skill-dirty-hint", fd = "st-roll-settings-Event-compatibility-mode", gd = "st-roll-settings-Event-remove-rolljson", bd = "st-roll-settings-Event-strip-internal", ng = "st-roll-settings-Event-skill-preset-layout", sg = "st-roll-settings-Event-skill-preset-sidebar", Xi = "st-roll-settings-Event-skill-preset-list", vd = "st-roll-settings-Event-skill-preset-create", Ji = "st-roll-settings-Event-skill-preset-delete", xd = "st-roll-settings-Event-skill-preset-restore-default", Qi = "st-roll-settings-Event-skill-preset-name", yd = "st-roll-settings-Event-skill-preset-rename", Sd = "st-roll-settings-Event-skill-preset-meta", Ed = "st-roll-settings-Event-skill-editor-open", ko = "st-roll-settings-Event-skill-modal", _d = "st-roll-settings-Event-skill-modal-close", Zi = "st-roll-settings-Event-rule-text", Td = "st-roll-settings-Event-rule-save", kd = "st-roll-settings-Event-rule-reset", wd = "st-roll-settings-Event-search", Id = "st-roll-settings-Event-tab-main", Ad = "st-roll-settings-Event-tab-skill", $d = "st-roll-settings-Event-tab-rule", Rd = "st-roll-settings-Event-tab-about", Cd = "st-roll-settings-Event-panel-main", Dd = "st-roll-settings-Event-panel-skill", Nd = "st-roll-settings-Event-panel-rule", Ld = "st-roll-settings-Event-panel-about", Ye = Fa, og = Ye.display_name.trim().length > 0 ? Ye.display_name.trim() : "SillyTavern-Roll Event", Md = Fa.version.trim().length > 0 ? Fa.version.trim() : "unknown", ag = Ye.author.trim().length > 0 ? Ye.author.trim() : "Shion", ig = Ye.email.trim().length > 0 ? Ye.email.trim() : "348591466@qq.com", Od = /^https?:\/\//i.test(Ye.homePage.trim()) ? Ye.homePage.trim() : "https://github.com/ShionCox/SillyTavern-Roll", lg = Od.replace(
  /^https?:\/\//i,
  ""
), cg = {
  SETTINGS_CARD_ID_Event: Bn,
  SETTINGS_DISPLAY_NAME_Event: og,
  SETTINGS_BADGE_ID_Event: Yu,
  SETTINGS_BADGE_VERSION_Event: Md,
  SETTINGS_AUTHOR_TEXT_Event: ag,
  SETTINGS_EMAIL_TEXT_Event: ig,
  SETTINGS_GITHUB_TEXT_Event: lg,
  SETTINGS_GITHUB_URL_Event: Od,
  SETTINGS_SEARCH_ID_Event: wd,
  SETTINGS_TAB_MAIN_ID_Event: Id,
  SETTINGS_TAB_SKILL_ID_Event: Ad,
  SETTINGS_TAB_RULE_ID_Event: $d,
  SETTINGS_TAB_ABOUT_ID_Event: Rd,
  SETTINGS_PANEL_MAIN_ID_Event: Cd,
  SETTINGS_PANEL_SKILL_ID_Event: Dd,
  SETTINGS_PANEL_RULE_ID_Event: Nd,
  SETTINGS_PANEL_ABOUT_ID_Event: Ld,
  SETTINGS_ENABLED_ID_Event: _i,
  SETTINGS_RULE_ID_Event: Ti,
  SETTINGS_AI_ROLL_MODE_ID_Event: ki,
  SETTINGS_AI_ROUND_CONTROL_ID_Event: wi,
  SETTINGS_EXPLODING_ENABLED_ID_Event: Ii,
  SETTINGS_ADVANTAGE_ENABLED_ID_Event: Ai,
  SETTINGS_DYNAMIC_RESULT_GUIDANCE_ID_Event: $i,
  SETTINGS_DYNAMIC_DC_REASON_ID_Event: Ri,
  SETTINGS_STATUS_SYSTEM_ENABLED_ID_Event: Ci,
  SETTINGS_STATUS_EDITOR_OPEN_ID_Event: Di,
  SETTINGS_STATUS_MODAL_ID_Event: _o,
  SETTINGS_STATUS_MODAL_CLOSE_ID_Event: Wu,
  SETTINGS_STATUS_REFRESH_ID_Event: Ni,
  SETTINGS_STATUS_CLEAN_UNUSED_ID_Event: Li,
  SETTINGS_STATUS_ROWS_ID_Event: Mi,
  SETTINGS_STATUS_ADD_ID_Event: Xu,
  SETTINGS_STATUS_SAVE_ID_Event: Ju,
  SETTINGS_STATUS_RESET_ID_Event: Qu,
  SETTINGS_STATUS_ERRORS_ID_Event: Oi,
  SETTINGS_STATUS_DIRTY_HINT_ID_Event: Pi,
  SETTINGS_STATUS_LAYOUT_ID_Event: tg,
  SETTINGS_STATUS_SIDEBAR_ID_Event: eg,
  SETTINGS_STATUS_SPLITTER_ID_Event: Zu,
  SETTINGS_STATUS_CHAT_LIST_ID_Event: td,
  SETTINGS_STATUS_CHAT_META_ID_Event: ed,
  SETTINGS_STATUS_COLS_ID_Event: rd,
  SETTINGS_STATUS_MEMORY_STATE_ID_Event: nd,
  SETTINGS_ALLOWED_DICE_SIDES_ID_Event: Bi,
  SETTINGS_THEME_ID_Event: Ui,
  SETTINGS_SUMMARY_DETAIL_ID_Event: Hi,
  SETTINGS_SUMMARY_ROUNDS_ID_Event: zi,
  SETTINGS_SCOPE_ID_Event: Gi,
  SETTINGS_OUTCOME_BRANCHES_ID_Event: Ki,
  SETTINGS_EXPLODE_OUTCOME_ID_Event: ji,
  SETTINGS_SUMMARY_OUTCOME_ID_Event: qi,
  SETTINGS_LIST_OUTCOME_PREVIEW_ID_Event: Fi,
  SETTINGS_TIME_LIMIT_ENABLED_ID_Event: Vi,
  SETTINGS_TIME_LIMIT_MIN_ID_Event: Yi,
  SETTINGS_TIME_LIMIT_ROW_ID_Event: sd,
  SETTINGS_COMPATIBILITY_MODE_ID_Event: fd,
  SETTINGS_REMOVE_ROLLJSON_ID_Event: gd,
  SETTINGS_STRIP_INTERNAL_ID_Event: bd,
  SETTINGS_SKILL_ENABLED_ID_Event: Wi,
  SETTINGS_SKILL_EDITOR_WRAP_ID_Event: rg,
  SETTINGS_SKILL_ROWS_ID_Event: To,
  SETTINGS_SKILL_ADD_ID_Event: od,
  SETTINGS_SKILL_TEXT_ID_Event: ad,
  SETTINGS_SKILL_IMPORT_TOGGLE_ID_Event: id,
  SETTINGS_SKILL_IMPORT_AREA_ID_Event: ld,
  SETTINGS_SKILL_IMPORT_APPLY_ID_Event: cd,
  SETTINGS_SKILL_EXPORT_ID_Event: ud,
  SETTINGS_SKILL_SAVE_ID_Event: dd,
  SETTINGS_SKILL_RESET_ID_Event: md,
  SETTINGS_SKILL_ERRORS_ID_Event: hd,
  SETTINGS_SKILL_DIRTY_HINT_ID_Event: pd,
  SETTINGS_SKILL_PRESET_LAYOUT_ID_Event: ng,
  SETTINGS_SKILL_PRESET_SIDEBAR_ID_Event: sg,
  SETTINGS_SKILL_PRESET_LIST_ID_Event: Xi,
  SETTINGS_SKILL_PRESET_CREATE_ID_Event: vd,
  SETTINGS_SKILL_PRESET_DELETE_ID_Event: Ji,
  SETTINGS_SKILL_PRESET_RESTORE_DEFAULT_ID_Event: xd,
  SETTINGS_SKILL_PRESET_NAME_ID_Event: Qi,
  SETTINGS_SKILL_PRESET_RENAME_ID_Event: yd,
  SETTINGS_SKILL_PRESET_META_ID_Event: Sd,
  SETTINGS_SKILL_EDITOR_OPEN_ID_Event: Ed,
  SETTINGS_SKILL_MODAL_ID_Event: ko,
  SETTINGS_SKILL_MODAL_CLOSE_ID_Event: _d,
  SETTINGS_RULE_SAVE_ID_Event: Td,
  SETTINGS_RULE_RESET_ID_Event: kd,
  SETTINGS_RULE_TEXT_ID_Event: Zi
}, ug = {
  SETTINGS_TAB_MAIN_ID_Event: Id,
  SETTINGS_TAB_SKILL_ID_Event: Ad,
  SETTINGS_TAB_RULE_ID_Event: $d,
  SETTINGS_TAB_ABOUT_ID_Event: Rd,
  SETTINGS_PANEL_MAIN_ID_Event: Cd,
  SETTINGS_PANEL_SKILL_ID_Event: Dd,
  SETTINGS_PANEL_RULE_ID_Event: Nd,
  SETTINGS_PANEL_ABOUT_ID_Event: Ld,
  SETTINGS_SKILL_MODAL_ID_Event: ko,
  SETTINGS_SKILL_EDITOR_OPEN_ID_Event: Ed,
  SETTINGS_SKILL_MODAL_CLOSE_ID_Event: _d,
  SETTINGS_STATUS_MODAL_ID_Event: _o,
  SETTINGS_STATUS_EDITOR_OPEN_ID_Event: Di,
  SETTINGS_STATUS_MODAL_CLOSE_ID_Event: Wu,
  SETTINGS_STATUS_REFRESH_ID_Event: Ni,
  SETTINGS_STATUS_CLEAN_UNUSED_ID_Event: Li,
  SETTINGS_SEARCH_ID_Event: wd
}, Hs = {
  SETTINGS_THEME_ID_Event: Ui,
  SETTINGS_ENABLED_ID_Event: _i,
  SETTINGS_RULE_ID_Event: Ti,
  SETTINGS_AI_ROLL_MODE_ID_Event: ki,
  SETTINGS_AI_ROUND_CONTROL_ID_Event: wi,
  SETTINGS_EXPLODING_ENABLED_ID_Event: Ii,
  SETTINGS_ADVANTAGE_ENABLED_ID_Event: Ai,
  SETTINGS_DYNAMIC_RESULT_GUIDANCE_ID_Event: $i,
  SETTINGS_DYNAMIC_DC_REASON_ID_Event: Ri,
  SETTINGS_STATUS_SYSTEM_ENABLED_ID_Event: Ci,
  SETTINGS_ALLOWED_DICE_SIDES_ID_Event: Bi,
  SETTINGS_SUMMARY_DETAIL_ID_Event: Hi,
  SETTINGS_SUMMARY_ROUNDS_ID_Event: zi,
  SETTINGS_SCOPE_ID_Event: Gi,
  SETTINGS_OUTCOME_BRANCHES_ID_Event: Ki,
  SETTINGS_EXPLODE_OUTCOME_ID_Event: ji,
  SETTINGS_SUMMARY_OUTCOME_ID_Event: qi,
  SETTINGS_LIST_OUTCOME_PREVIEW_ID_Event: Fi,
  SETTINGS_TIME_LIMIT_ENABLED_ID_Event: Vi,
  SETTINGS_TIME_LIMIT_MIN_ID_Event: Yi,
  SETTINGS_COMPATIBILITY_MODE_ID_Event: fd,
  SETTINGS_REMOVE_ROLLJSON_ID_Event: gd,
  SETTINGS_STRIP_INTERNAL_ID_Event: bd,
  SETTINGS_SKILL_ENABLED_ID_Event: Wi
}, dg = {
  SETTINGS_SKILL_PRESET_LIST_ID_Event: Xi,
  SETTINGS_SKILL_PRESET_CREATE_ID_Event: vd,
  SETTINGS_SKILL_PRESET_DELETE_ID_Event: Ji,
  SETTINGS_SKILL_PRESET_RESTORE_DEFAULT_ID_Event: xd,
  SETTINGS_SKILL_PRESET_NAME_ID_Event: Qi,
  SETTINGS_SKILL_PRESET_RENAME_ID_Event: yd
}, mg = {
  SETTINGS_SKILL_ROWS_ID_Event: To,
  SETTINGS_SKILL_ADD_ID_Event: od
}, hg = {
  SETTINGS_SKILL_IMPORT_TOGGLE_ID_Event: id,
  SETTINGS_SKILL_IMPORT_AREA_ID_Event: ld,
  SETTINGS_SKILL_TEXT_ID_Event: ad,
  SETTINGS_SKILL_IMPORT_APPLY_ID_Event: cd,
  SETTINGS_SKILL_EXPORT_ID_Event: ud,
  SETTINGS_SKILL_SAVE_ID_Event: dd,
  SETTINGS_SKILL_RESET_ID_Event: md
}, pg = {
  SETTINGS_RULE_TEXT_ID_Event: Zi,
  SETTINGS_RULE_SAVE_ID_Event: Td,
  SETTINGS_RULE_RESET_ID_Event: kd
}, fg = {
  SETTINGS_CARD_ID_Event: Bn,
  SETTINGS_THEME_ID_Event: Ui,
  SETTINGS_ENABLED_ID_Event: _i,
  SETTINGS_RULE_ID_Event: Ti,
  SETTINGS_AI_ROLL_MODE_ID_Event: ki,
  SETTINGS_AI_ROUND_CONTROL_ID_Event: wi,
  SETTINGS_EXPLODING_ENABLED_ID_Event: Ii,
  SETTINGS_ADVANTAGE_ENABLED_ID_Event: Ai,
  SETTINGS_DYNAMIC_RESULT_GUIDANCE_ID_Event: $i,
  SETTINGS_DYNAMIC_DC_REASON_ID_Event: Ri,
  SETTINGS_STATUS_SYSTEM_ENABLED_ID_Event: Ci,
  SETTINGS_ALLOWED_DICE_SIDES_ID_Event: Bi,
  SETTINGS_SUMMARY_DETAIL_ID_Event: Hi,
  SETTINGS_SUMMARY_ROUNDS_ID_Event: zi,
  SETTINGS_SCOPE_ID_Event: Gi,
  SETTINGS_OUTCOME_BRANCHES_ID_Event: Ki,
  SETTINGS_EXPLODE_OUTCOME_ID_Event: ji,
  SETTINGS_SUMMARY_OUTCOME_ID_Event: qi,
  SETTINGS_LIST_OUTCOME_PREVIEW_ID_Event: Fi,
  SETTINGS_TIME_LIMIT_ENABLED_ID_Event: Vi,
  SETTINGS_TIME_LIMIT_MIN_ID_Event: Yi,
  SETTINGS_TIME_LIMIT_ROW_ID_Event: sd,
  SETTINGS_SKILL_ENABLED_ID_Event: Wi,
  SETTINGS_SKILL_MODAL_ID_Event: ko,
  SETTINGS_STATUS_EDITOR_OPEN_ID_Event: Di,
  SETTINGS_STATUS_MODAL_ID_Event: _o,
  SETTINGS_STATUS_ROWS_ID_Event: Mi,
  SETTINGS_STATUS_ERRORS_ID_Event: Oi,
  SETTINGS_STATUS_DIRTY_HINT_ID_Event: Pi,
  SETTINGS_RULE_TEXT_ID_Event: Zi,
  SETTINGS_SKILL_ROWS_ID_Event: To
}, gg = "<dice_rules>", bg = "</dice_rules>", Pd = "<dice_round_summary>", Bd = "</dice_round_summary>", vg = "<dice_result_guidance>", xg = "</dice_result_guidance>", yg = "<dice_runtime_policy>", Sg = "</dice_runtime_policy>", Eg = "<dice_active_statuses>", _g = "</dice_active_statuses>", Tg = 20, kg = 60, tl = 1, el = 10, wg = 20, Ig = 400, rl = 1, Un = "skill_preset_default_general_trpg", Ud = "通用叙事TRPG（默认）", nl = "新预设", Ag = {
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
}, Hd = JSON.stringify(Ag, null, 2), zd = /^P(?=\d|T\d)(\d+Y)?(\d+M)?(\d+W)?(\d+D)?(T(?=\d)(\d+H)?(\d+M)?(\d+S)?)?$/i, Rn = 2, Gd = "", Ln = {
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
  ruleTextModeVersion: Rn,
  ruleText: Gd
};
function yt(t, e) {
  const r = String(t ?? "").trim();
  return r ? r.replace(/\s+/g, "_") : e;
}
function Re(t, e) {
  return yt(t, e).replace(/\.(jsonl|json)$/i, "");
}
function Kd(t) {
  return String(t ?? "").trim().toLowerCase().replace(/^default_/i, "").replace(/\.[a-z0-9]+$/i, "").replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
}
function jd(t) {
  const e = String(t ?? "").split("::");
  return {
    chatId: String(e[0] ?? "").trim(),
    groupId: String(e[1] ?? "").trim() || "no_group",
    roleId: String(e[2] ?? "").trim()
  };
}
function ie(t) {
  const e = String(t ?? "").trim();
  return !e || e === "fallback_chat" || jd(e).chatId === "fallback_chat";
}
function rn(t) {
  const e = yt(t.tavernInstanceId, "unknown_tavern"), r = yt(t.scopeType, "character"), n = yt(t.scopeId, "unknown_scope"), o = Re(t.chatId, "fallback_chat");
  return `${e}::${r}::${n}::${o}`;
}
function $g(t) {
  const e = String(t ?? "").split("::"), r = yt(e[0], "unknown_tavern"), n = String(e[1] ?? "").trim() === "group" ? "group" : "character", o = yt(e[2], "unknown_scope"), i = yt(e.slice(3).join("::"), "fallback_chat");
  return {
    tavernInstanceId: r,
    scopeType: n,
    scopeId: o,
    chatId: i
  };
}
function Cn(t, e) {
  if (t === "group")
    return yt(e, "unknown_scope").toLowerCase();
  const r = Kd(e);
  return yt(r || e, "unknown_scope").toLowerCase();
}
function ze(t) {
  const e = yt(t.tavernInstanceId, "unknown_tavern").toLowerCase(), r = t.scopeType === "group" ? "group" : "character", n = Cn(r, String(t.scopeId ?? "")), o = Re(t.chatId, "fallback_chat").toLowerCase();
  return !e || !n || !o || ie(o) ? "" : `${e}::${r}::${n}::${o}`;
}
function Jt(t, e) {
  const r = yt(
    e?.tavernInstanceId,
    "unknown_tavern"
  ), n = e?.scopeType === "group" ? "group" : "character", o = Cn(
    n,
    String(e?.scopeId ?? "")
  );
  if (typeof t == "string") {
    const d = String(t ?? "").trim();
    if (d.split("::").length >= 4) {
      const E = $g(d), y = E.scopeType === "group" ? "group" : "character";
      return {
        tavernInstanceId: yt(E.tavernInstanceId, r),
        scopeType: y,
        scopeId: Cn(y, E.scopeId),
        chatId: yt(E.chatId, "fallback_chat")
      };
    }
    const f = jd(d), b = yt(f.groupId, "no_group") !== "no_group" ? "group" : "character", v = b === "group" ? f.groupId : f.roleId;
    return {
      tavernInstanceId: r,
      scopeType: b,
      scopeId: Cn(b, v),
      chatId: yt(f.chatId, "fallback_chat")
    };
  }
  const i = t ?? {}, c = i.scopeType === "group" ? "group" : n;
  return {
    tavernInstanceId: yt(i.tavernInstanceId, r),
    scopeType: c,
    scopeId: Cn(c, String(i.scopeId ?? o)),
    chatId: yt(i.chatId, "fallback_chat")
  };
}
const Ea = "stx.rollhelper.tavernInstanceId", qd = "stx.rollhelper.tavernInstanceId.fallback";
function Rg() {
  try {
    const e = globalThis.SillyTavern?.getContext?.();
    if (!e || typeof e != "object") return null;
    const r = e.accountStorage;
    if (!r || typeof r != "object") return null;
    const n = r;
    return typeof n.getItem != "function" || typeof n.setItem != "function" ? null : n;
  } catch {
    return null;
  }
}
function Ac(t) {
  const e = String(t ?? "").trim();
  return /^[a-zA-Z0-9_-]{8,128}$/.test(e);
}
function Cg() {
  const t = (() => {
    try {
      if (typeof crypto < "u" && typeof crypto.randomUUID == "function")
        return crypto.randomUUID();
    } catch {
    }
    return "";
  })();
  return t ? `tavern_${t.replace(/-/g, "_")}` : `tavern_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}
function Dg() {
  try {
    const t = localStorage.getItem(qd);
    return String(t ?? "").trim();
  } catch {
    return "";
  }
}
function $c(t) {
  try {
    localStorage.setItem(qd, t);
  } catch {
  }
}
function wo() {
  const t = Rg(), e = t && typeof t.getItem == "function" ? String(t.getItem(Ea) ?? "").trim() : "", r = Dg(), n = Ac(e) ? e : Ac(r) ? r : "";
  if (n) {
    if (t && typeof t.setItem == "function" && n !== e)
      try {
        t.setItem(Ea, n);
      } catch {
      }
    return n !== r && $c(n), n;
  }
  const o = Cg();
  if (t && typeof t.setItem == "function")
    try {
      t.setItem(Ea, o);
    } catch {
    }
  return $c(o), o;
}
function Io() {
  try {
    const e = globalThis.SillyTavern?.getContext?.();
    return !e || typeof e != "object" ? null : e;
  } catch {
    return null;
  }
}
function Fd(t) {
  const e = Array.isArray(t?.characters) ? t.characters : [], r = [t?.characterId, t?.this_chid];
  for (const o of r) {
    const i = Number(o);
    if (Number.isInteger(i) && i >= 0 && i < e.length)
      return {
        character: e[i],
        index: i
      };
  }
  const n = String(t?.characterName ?? t?.name2 ?? "").trim().toLowerCase();
  if (n) {
    const o = e.findIndex((i) => String(i?.name ?? "").trim().toLowerCase() === n);
    if (o >= 0)
      return {
        character: e[o],
        index: o
      };
  }
  return e.length === 1 ? {
    character: e[0],
    index: 0
  } : {
    character: null,
    index: -1
  };
}
function Ng(t, e) {
  const r = t?.chat, n = r && typeof r == "object" && !Array.isArray(r) ? r.id : "";
  return Re(
    e?.chat ?? t?.chatId ?? t?.chat_id ?? n,
    "fallback_chat"
  );
}
function Lg(t) {
  const r = Fd(t).character, n = yt(r?.avatar, ""), o = String(r?.name ?? t?.characterName ?? t?.name2 ?? t?.name1 ?? "").trim() || "未知角色", i = yt(n || o, "default_role"), c = Kd(i) || "default_role", d = n ? `/characters/${encodeURIComponent(n)}` : "";
  return {
    roleId: i,
    roleKey: c,
    displayName: o,
    avatarName: n,
    avatarUrl: d
  };
}
function Mg(t) {
  const e = String(t?.groupId ?? "").trim();
  return e ? (Array.isArray(t?.groups) ? t.groups : []).find((o) => String(o?.id ?? "").trim() === e) ?? null : null;
}
function an() {
  const t = Io();
  if (!t) return null;
  const e = wo(), r = Mg(t);
  if (r) {
    const c = yt(r.id, "no_group"), d = Re(r.chat_id, "fallback_chat");
    return {
      tavernInstanceId: e,
      scopeType: "group",
      scopeId: c,
      roleKey: `group:${c}`,
      roleId: `group:${c}`,
      displayName: String(r.name ?? c).trim() || c,
      avatarUrl: String(r.avatar_url ?? "").trim(),
      groupId: c,
      characterId: -1,
      currentChatId: d
    };
  }
  const n = Fd(t), o = Lg(t), i = Ng(t, n.character);
  return {
    tavernInstanceId: e,
    scopeType: "character",
    scopeId: o.roleKey || "default_role",
    roleKey: o.roleKey,
    roleId: o.roleId,
    displayName: o.displayName,
    avatarUrl: o.avatarUrl,
    groupId: "no_group",
    characterId: n.index,
    currentChatId: i
  };
}
function ln() {
  const t = Io();
  return !t || typeof t != "object" ? null : t;
}
function Og() {
  const t = ln();
  return !t?.extensionSettings || typeof t.extensionSettings != "object" ? null : t.extensionSettings;
}
function Vd() {
  const t = ln();
  return !t?.eventSource || typeof t.eventSource != "object" ? null : t.eventSource;
}
function Yd() {
  const t = ln();
  return !t?.event_types || typeof t.event_types != "object" ? null : t.event_types;
}
function Ao() {
  const t = ln();
  return {
    parser: t?.SlashCommandParser ?? null,
    command: t?.SlashCommand ?? null,
    argument: t?.SlashCommandArgument ?? null,
    namedArgument: t?.SlashCommandNamedArgument ?? null,
    argumentType: t?.ARGUMENT_TYPE && typeof t.ARGUMENT_TYPE == "object" ? t.ARGUMENT_TYPE : null
  };
}
function Pg(t, e) {
  const r = ln();
  typeof r?.registerMacro == "function" && r.registerMacro(t, e);
}
function Bg(t) {
  return String(t ?? "");
}
function Wd(t) {
  return !t || typeof t != "object" ? "" : String(t.role ?? "").trim().toLowerCase();
}
function Ug(t) {
  const e = [];
  for (const r of t) {
    if (typeof r == "string") {
      e.push(r);
      continue;
    }
    if (!r || typeof r != "object") continue;
    const n = r, o = n.text ?? n.content ?? "";
    typeof o == "string" && o && e.push(o);
  }
  return e.join(`
`);
}
function Xd(t, e) {
  if (typeof t == "string")
    return e;
  if (Array.isArray(t)) {
    const r = t[0];
    if (typeof r == "string")
      return [e];
    if (r && typeof r == "object") {
      const n = r;
      if (typeof n.text == "string")
        return [{ ...n, text: e }];
      if (typeof n.content == "string")
        return [{ ...n, content: e }];
    }
    return [{ type: "text", text: e }];
  }
  if (t && typeof t == "object") {
    const r = t;
    return typeof r.text == "string" ? {
      ...r,
      text: e
    } : typeof r.content == "string" ? {
      ...r,
      content: e
    } : {
      ...r,
      text: e
    };
  }
  return e;
}
function Hg(t) {
  return Xd(t?.content ?? "", "");
}
function Rc(t, e) {
  const r = Object.prototype.hasOwnProperty.call(t, "content"), n = Object.prototype.hasOwnProperty.call(t, "mes"), o = Object.prototype.hasOwnProperty.call(t, "text");
  r && (t.content = Xd(t.content, e)), n && (t.mes = e), o && (t.text = e), !r && !n && !o && (t.content = e);
}
function zg(t, e) {
  const r = Math.floor(Number(e?.insertBeforeIndex) || 0);
  return Math.max(0, Math.min(r, t));
}
function Gg(t) {
  if (!t || typeof t != "object") return "";
  if (typeof t.content == "string")
    return t.content;
  if (Array.isArray(t.content))
    return Ug(t.content);
  if (t.content && typeof t.content == "object") {
    const e = t.content;
    if (typeof e.text == "string")
      return e.text;
  }
  return typeof t.mes == "string" ? t.mes : typeof t.text == "string" ? t.text : "";
}
function Jd(t, e) {
  if (!t || typeof t != "object") return;
  const r = Bg(e);
  Rc(t, r);
  const n = Number(t.swipe_id ?? t.swipeId), o = t.swipes;
  if (!Array.isArray(o) || !Number.isFinite(n) || n < 0 || n >= o.length)
    return;
  const i = o[n];
  if (typeof i == "string") {
    o[n] = r;
    return;
  }
  i && typeof i == "object" && Rc(i, r);
}
function Qd(t) {
  return !t || typeof t != "object" ? !1 : t.is_user === !0 ? !0 : Wd(t) === "user";
}
function Zd(t) {
  return !t || typeof t != "object" ? !1 : t.is_system === !0 ? !0 : Wd(t) === "system";
}
function Kg(t) {
  if (!Array.isArray(t)) return -1;
  for (let e = t.length - 1; e >= 0; e -= 1)
    if (Zd(t[e])) return e;
  return -1;
}
function jg(t) {
  if (!Array.isArray(t)) return -1;
  for (let e = t.length - 1; e >= 0; e -= 1)
    if (Qd(t[e])) return e;
  return -1;
}
function tm(t) {
  const e = [], r = /* @__PURE__ */ new Set(), n = (h, f) => {
    if (!Array.isArray(f)) return;
    const b = f;
    r.has(b) || (r.add(b), e.push({
      path: h,
      messages: b
    }));
  };
  if (Array.isArray(t))
    return n("payload", t), e;
  if (!t || typeof t != "object") return e;
  const o = t, i = o.prompt && typeof o.prompt == "object" ? o.prompt : null, c = o.data && typeof o.data == "object" ? o.data : null, d = o.chatCompletion && typeof o.chatCompletion == "object" ? o.chatCompletion : null;
  return n("payload.chatCompletion.messages", d?.messages), n("payload.messages", o.messages), n("payload.prompt.messages", i?.messages), n("payload.data.messages", c?.messages), n("payload.chat", o.chat), n("payload.prompt.chat", i?.chat), n("payload.data.chat", c?.chat), n("payload.message_list", o.message_list), e;
}
function qg(t) {
  return tm(t)[0]?.messages ?? null;
}
function Fg(t, e) {
  const r = {
    role: "system",
    is_system: !0,
    content: Hg(e?.template),
    mes: "",
    text: ""
  };
  Jd(r, e.text);
  const n = zg(t.length, e);
  return t.splice(n, 0, r), r;
}
function Vg() {
  const t = an();
  return t ? rn({
    ...t,
    chatId: t.currentChatId
  }) : "";
}
function em(t) {
  const e = Number(t);
  if (Number.isFinite(e) && e > 0) return e;
  const r = new Date(String(t ?? "")).getTime();
  return Number.isFinite(r) && r > 0 ? r : 0;
}
function rm() {
  const t = Io();
  if (t && typeof t.getRequestHeaders == "function") {
    const e = t.getRequestHeaders();
    if (e && typeof e == "object") return e;
  }
  return {
    "Content-Type": "application/json"
  };
}
async function Yg(t) {
  const e = String(t.avatar ?? "").trim();
  if (!e) return [];
  try {
    const r = await fetch("/api/characters/chats", {
      method: "POST",
      headers: rm(),
      body: JSON.stringify({ avatar_url: e })
    });
    if (!r.ok) return [];
    const n = await r.json();
    return !n || typeof n != "object" ? [] : n.error === !0 ? [] : Object.values(n);
  } catch {
    return [];
  }
}
async function Wg(t) {
  const e = [];
  for (const r of t) {
    const n = yt(r, "");
    if (n)
      try {
        const o = await fetch("/api/chats/group/info", {
          method: "POST",
          headers: rm(),
          body: JSON.stringify({ id: n })
        });
        if (!o.ok) continue;
        const i = await o.json();
        e.push(i ?? { file_name: n });
      } catch {
      }
  }
  return e;
}
function Xg(t) {
  return [...t].sort((e, r) => {
    const n = Number(r.updatedAt) - Number(e.updatedAt);
    return n !== 0 ? n : String(r.locator.chatId).localeCompare(String(e.locator.chatId));
  });
}
function Jg(t, e, r) {
  const n = yt(e.avatar, ""), o = String(e.name ?? "").trim(), i = yt(n || o, "default_role");
  if (!i || i === "default_role") return null;
  const c = String(i).trim().toLowerCase().replace(/^default_/i, "").replace(/\.[a-z0-9]+$/i, "").replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim() || i;
  return {
    tavernInstanceId: t,
    scopeType: "character",
    scopeId: c,
    roleKey: c,
    roleId: i,
    displayName: o || i,
    avatarUrl: n ? `/characters/${encodeURIComponent(n)}` : "",
    groupId: "no_group",
    characterId: r,
    currentChatId: Re(e.chat, "fallback_chat")
  };
}
function Qg(t, e) {
  const r = yt(e.id, "");
  return r ? {
    tavernInstanceId: t,
    scopeType: "group",
    scopeId: r,
    roleKey: `group:${r}`,
    roleId: `group:${r}`,
    displayName: String(e.name ?? r).trim() || r,
    avatarUrl: String(e.avatar_url ?? "").trim(),
    groupId: r,
    characterId: -1,
    currentChatId: Re(e.chat_id, "fallback_chat")
  } : null;
}
function nm(t, e) {
  const r = Re(e.chatId, "fallback_chat");
  if (ie(r)) return t;
  const n = {
    ...e,
    chatId: r
  }, o = rn(n);
  return t.some((i) => rn(i.locator) === o) ? t : [
    {
      locator: n,
      updatedAt: 0,
      messageCount: 0
    },
    ...t
  ];
}
async function Zg(t, e) {
  const r = Array.isArray(e.characters) ? e.characters : [], n = [];
  for (let o = 0; o < r.length; o += 1) {
    const i = r[o], c = Jg(t, i, o);
    if (!c) continue;
    const h = (await Yg(i)).map((f) => {
      const b = Re(f.file_name, "");
      return !b || ie(b) ? null : {
        locator: {
          ...c,
          chatId: b
        },
        updatedAt: em(f.last_mes),
        messageCount: Number(f.message_count) || 0
      };
    }).filter((f) => !!f);
    n.push(...nm(h, { ...c, chatId: c.currentChatId }));
  }
  return n;
}
async function tb(t, e) {
  const r = Array.isArray(e.groups) ? e.groups : [], n = [];
  for (const o of r) {
    const i = Qg(t, o);
    if (!i) continue;
    const c = new Set(
      (Array.isArray(o.chats) ? o.chats : []).map((b) => yt(b, "")).filter(Boolean)
    ), d = yt(o.chat_id, "");
    d && c.add(d);
    const f = (await Wg(Array.from(c))).map((b) => {
      const v = Re(b.file_name, "");
      return !v || ie(v) ? null : {
        locator: {
          ...i,
          chatId: v
        },
        updatedAt: em(b.last_mes),
        messageCount: Number(b.message_count) || 0
      };
    }).filter((b) => !!b);
    n.push(...nm(f, { ...i, chatId: i.currentChatId }));
  }
  return n;
}
function eb(t) {
  const e = /* @__PURE__ */ new Map();
  for (const r of t) {
    const n = rn(r.locator), o = e.get(n);
    (!o || Number(r.updatedAt) >= Number(o.updatedAt)) && e.set(n, r);
  }
  return Array.from(e.values());
}
async function rb() {
  const t = Io();
  if (!t) return [];
  const e = wo(), [r, n] = await Promise.all([
    Zg(e, t),
    tb(e, t)
  ]);
  return Xg(eb([...r, ...n]));
}
function Kr(t) {
  const e = Jt(t);
  return String(e.chatId ?? "").trim() || "unknown_chat";
}
function Cc(t) {
  return t === "host" ? 5 : t === "current" ? 4 : t === "local" ? 3 : t === "draft" ? 2 : 1;
}
function nb(t) {
  const e = Jt(t.chatKey);
  return {
    chatKey: String(t.chatKey ?? "").trim(),
    updatedAt: Number(t.updatedAt) || 0,
    chatId: yt(t.chatId || e.chatId, "fallback_chat"),
    displayName: String(t.displayName ?? "").trim(),
    avatarUrl: String(t.avatarUrl ?? "").trim(),
    scopeType: t.scopeType === "group" ? "group" : "character",
    scopeId: yt(t.scopeId || e.scopeId, "unknown_scope"),
    roleKey: String(t.roleKey ?? "").trim()
  };
}
function sb(t) {
  return {
    chatKey: String(t.chatKey ?? "").trim(),
    updatedAt: Number(t.updatedAt) || 0,
    activeStatusCount: Number(t.activeStatusCount) || 0,
    displayName: String(t.displayName ?? "").trim(),
    avatarUrl: String(t.avatarUrl ?? "").trim(),
    roleKey: String(t.roleKey ?? "").trim()
  };
}
function ob(t) {
  const e = String(t.currentChatKey ?? "").trim(), r = wo(), n = Jt(e, {
    tavernInstanceId: r
  }), o = ze(n), i = /* @__PURE__ */ new Map(), c = Array.isArray(t.taggedChatKeys) ? t.taggedChatKeys : [], d = new Set(
    c.map(
      (y) => ze(
        Jt(y, { tavernInstanceId: n.tavernInstanceId || r })
      )
    ).filter(Boolean)
  ), h = (y, $, O) => {
    if (!y) return;
    const L = i.get(y);
    if (!L) {
      i.set(y, {
        ...O,
        canonicalPriority: Cc($)
      });
      return;
    }
    const D = Cc($), G = !L.chatKey || D > L.canonicalPriority ? O.chatKey : L.chatKey;
    i.set(y, {
      chatKey: G,
      entityKey: y,
      chatId: String(L.chatId ?? "").trim() || String(O.chatId ?? "").trim(),
      displayName: (L.fromHost ? String(L.displayName ?? "").trim() : "") || ($ === "host" ? String(O.displayName ?? "").trim() : "") || String(L.displayName ?? "").trim() || String(O.displayName ?? "").trim() || Kr(G),
      avatarUrl: (L.fromHost ? String(L.avatarUrl ?? "").trim() : "") || ($ === "host" ? String(O.avatarUrl ?? "").trim() : "") || String(L.avatarUrl ?? "").trim() || String(O.avatarUrl ?? "").trim(),
      scopeType: L.scopeType || O.scopeType,
      scopeId: String(L.scopeId ?? "").trim() || String(O.scopeId ?? "").trim(),
      roleKey: String(L.roleKey ?? "").trim() || String(O.roleKey ?? "").trim(),
      updatedAt: Math.max(Number(L.updatedAt) || 0, Number(O.updatedAt) || 0),
      activeStatusCount: Math.max(
        Number(L.activeStatusCount) || 0,
        Number(O.activeStatusCount) || 0
      ),
      isCurrent: !!L.isCurrent || !!O.isCurrent,
      fromHost: !!L.fromHost || !!O.fromHost,
      fromLocal: !!L.fromLocal || !!O.fromLocal,
      fromDraft: !!L.fromDraft || !!O.fromDraft,
      fromTagged: !!L.fromTagged || !!O.fromTagged,
      canonicalPriority: Math.max(L.canonicalPriority, D)
    });
  }, f = (y) => {
    const $ = Jt(y, { tavernInstanceId: n.tavernInstanceId || r });
    return !$.chatId || ie($.chatId) ? !1 : !n.tavernInstanceId || n.tavernInstanceId === "unknown_tavern" ? !!($.tavernInstanceId && $.tavernInstanceId !== "unknown_tavern") : $.tavernInstanceId === n.tavernInstanceId;
  }, b = (Array.isArray(t.hostChats) ? t.hostChats : []).map(nb);
  for (const y of b) {
    if (!y.chatKey || !f(y.chatKey) || !y.chatId || ie(y.chatId)) continue;
    const $ = Jt(
      {
        tavernInstanceId: n.tavernInstanceId || r,
        scopeType: y.scopeType,
        scopeId: y.scopeId,
        chatId: y.chatId
      },
      { tavernInstanceId: n.tavernInstanceId || r }
    ), O = ze($);
    h(O, "host", {
      chatKey: y.chatKey,
      entityKey: O,
      chatId: $.chatId,
      displayName: y.displayName || Kr(y.chatKey),
      avatarUrl: y.avatarUrl,
      scopeType: $.scopeType,
      scopeId: $.scopeId,
      roleKey: y.roleKey,
      updatedAt: y.updatedAt,
      activeStatusCount: 0,
      isCurrent: y.chatKey === e,
      fromHost: !0,
      fromLocal: !1,
      fromDraft: !1,
      fromTagged: d.has(O)
    });
  }
  const v = (Array.isArray(t.localSummaries) ? t.localSummaries : []).map(
    sb
  );
  for (const y of v) {
    if (!y.chatKey || !f(y.chatKey)) continue;
    const $ = Jt(y.chatKey, {
      tavernInstanceId: n.tavernInstanceId || r
    });
    if (!$.chatId || ie($.chatId)) continue;
    const O = ze($);
    h(O, "local", {
      chatKey: y.chatKey,
      entityKey: O,
      chatId: $.chatId,
      displayName: y.displayName || Kr(y.chatKey),
      avatarUrl: y.avatarUrl || "",
      scopeType: $.scopeType,
      scopeId: $.scopeId,
      roleKey: y.roleKey || "",
      updatedAt: y.updatedAt,
      activeStatusCount: Number(y.activeStatusCount) || 0,
      isCurrent: y.chatKey === e,
      fromHost: !1,
      fromLocal: !0,
      fromDraft: !1,
      fromTagged: d.has(O)
    });
  }
  const E = Array.isArray(t.draftChatKeys) ? t.draftChatKeys : [];
  for (const y of E.map(($) => String($ ?? "").trim()).filter(Boolean)) {
    if (!f(y)) continue;
    const $ = Jt(y, { tavernInstanceId: n.tavernInstanceId || r });
    if (!$.chatId || ie($.chatId)) continue;
    const O = ze($);
    h(O, "draft", {
      chatKey: y,
      entityKey: O,
      chatId: $.chatId,
      displayName: Kr(y),
      avatarUrl: "",
      scopeType: $.scopeType,
      scopeId: $.scopeId,
      roleKey: "",
      updatedAt: 0,
      activeStatusCount: 0,
      isCurrent: y === e,
      fromHost: !1,
      fromLocal: !1,
      fromDraft: !0,
      fromTagged: d.has(O)
    });
  }
  for (const y of c.map(($) => String($ ?? "").trim()).filter(Boolean)) {
    if (!f(y)) continue;
    const $ = Jt(y, {
      tavernInstanceId: n.tavernInstanceId || r
    });
    if (!$.chatId || ie($.chatId)) continue;
    const O = ze($);
    h(O, "tagged", {
      chatKey: y,
      entityKey: O,
      chatId: $.chatId,
      displayName: Kr(y),
      avatarUrl: "",
      scopeType: $.scopeType,
      scopeId: $.scopeId,
      roleKey: "",
      updatedAt: 0,
      activeStatusCount: 0,
      isCurrent: y === e,
      fromHost: !1,
      fromLocal: !1,
      fromDraft: !1,
      fromTagged: !0
    });
  }
  return e && o && !i.has(o) && !ie(n.chatId) && h(o, "current", {
    chatKey: e,
    entityKey: o,
    chatId: n.chatId,
    displayName: Kr(e),
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
    fromTagged: d.has(o)
  }), Array.from(i.values()).map(({ canonicalPriority: y, ...$ }) => $).sort((y, $) => {
    if (y.isCurrent !== $.isCurrent) return Number($.isCurrent) - Number(y.isCurrent);
    const O = y.fromDraft ? 1 : 0, L = $.fromDraft ? 1 : 0;
    return O !== L ? L - O : y.fromHost !== $.fromHost ? Number($.fromHost) - Number(y.fromHost) : Number($.updatedAt) - Number(y.updatedAt);
  });
}
const Hn = "st-rh-roll-console", sl = "st-rh-roll-console-body", Dc = "st-rh-roll-console-style", ab = 50;
let ol = !1;
function ib() {
  if (document.getElementById(Dc)) return;
  const t = document.createElement("style");
  t.id = Dc, t.textContent = `
    #${Hn} {
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
    #${Hn}.st-rh-console-hidden {
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
    #${sl} {
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
  `, document.head.appendChild(t);
}
function sm() {
  ib();
  let t = document.getElementById(Hn);
  return t || (t = document.createElement("div"), t.id = Hn, t.classList.add("st-rh-console-hidden"), t.innerHTML = `
    <div class="st-rh-console-header">
      <span class="st-rh-console-title">
        <i class="fa-solid fa-dice-d20" aria-hidden="true"></i>
        Roll Console
      </span>
      <button class="st-rh-console-close" data-rh-console-close="1" aria-label="关闭">
        <i class="fa-solid fa-xmark" aria-hidden="true"></i>
      </button>
    </div>
    <div id="${sl}">
      <div class="st-rh-console-empty">暂无输出</div>
    </div>
  `, document.body.appendChild(t), t.querySelector("[data-rh-console-close]")?.addEventListener("click", () => {
    db();
  }), t);
}
function al() {
  return document.getElementById(sl);
}
function lb() {
  const t = al();
  if (!t) return;
  const e = t.querySelectorAll(".st-rh-console-entry");
  for (; e.length > ab; )
    e[0].remove();
}
function cb() {
  const t = al();
  if (!t) return;
  const e = t.querySelector(".st-rh-console-empty");
  e && e.remove();
}
function vr(t, e = "info") {
  sm();
  const r = al();
  if (!r) return;
  cb();
  const n = document.createElement("div");
  n.className = `st-rh-console-entry st-rh-console-${e}`, n.innerHTML = t, r.appendChild(n), lb(), r.scrollTop = r.scrollHeight, ol || ub();
}
function ub() {
  sm().classList.remove("st-rh-console-hidden"), ol = !0;
}
function db() {
  const t = document.getElementById(Hn);
  t && t.classList.add("st-rh-console-hidden"), ol = !1;
}
function Ie(t) {
  return t === 0 ? "0" : t > 0 ? `+${t}` : `${t}`;
}
function il(t, e, r) {
  return `${Ie(t)} + skill ${Ie(e)} = ${Ie(r)}`;
}
function Ir(t) {
  return `${t}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}
function om(t) {
  let e = 0;
  for (let r = 0; r < t.length; r++)
    e = (e << 5) - e + t.charCodeAt(r), e |= 0;
  return Math.abs(e).toString(36);
}
function cn(t) {
  return t == null ? "" : String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/'/g, "&#39;");
}
function ll(t) {
  return cn(t).replace(/`/g, "&#96;");
}
function zn(t) {
  return t.replace(/\n{3,}/g, `

`).trim();
}
function $o(t) {
  const e = String(t ?? "").trim();
  if (!e) return "";
  if (/^none$/i.test(e)) return "无";
  const r = e.match(/^P(?:(\d+)W)?(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/i);
  if (!r) return e;
  const n = Number(r[1] || 0), o = Number(r[2] || 0), i = Number(r[3] || 0), c = Number(r[4] || 0), d = Number(r[5] || 0), h = [];
  return n > 0 && h.push(`${n}周`), o > 0 && h.push(`${o}天`), i > 0 && h.push(`${i}小时`), c > 0 && h.push(`${c}分钟`), d > 0 && h.push(`${d}秒`), h.length > 0 ? h.join("") : "0秒";
}
const am = "stx.sdk.settings.v1", Jr = /* @__PURE__ */ new Map();
let Nc = !1;
function Kt(t) {
  return !!t && typeof t == "object" && !Array.isArray(t);
}
function im() {
  try {
    const e = globalThis.SillyTavern?.getContext?.();
    if (!Kt(e)) return null;
    const r = e.accountStorage;
    if (!Kt(r)) return null;
    const n = r;
    return typeof n.getItem != "function" || typeof n.setItem != "function" ? null : n;
  } catch {
    return null;
  }
}
function lm(t, e) {
  return `${am}::${t}::${e.tavernInstanceId}`;
}
function cl() {
  return {
    tavernInstanceId: wo()
  };
}
function un(t) {
  return String(t ?? "").trim();
}
function mb(t) {
  const e = im();
  return e && typeof e.getItem == "function" ? String(e.getItem(t) ?? "").trim() : "";
}
function hb(t) {
  try {
    return String(globalThis.localStorage?.getItem(t) ?? "").trim();
  } catch {
    return "";
  }
}
function pb(t, e) {
  const r = im();
  if (!(!r || typeof r.setItem != "function"))
    try {
      r.setItem(t, e);
    } catch {
    }
}
function fb(t, e) {
  try {
    globalThis.localStorage?.setItem(t, e);
  } catch {
  }
}
function cm(t, e) {
  pb(t, e), fb(t, e);
}
function _a(t, e) {
  return Kt(t) && Object.prototype.hasOwnProperty.call(t, e);
}
function gb(t) {
  return !!(!Kt(t) || !_a(t, "pluginSettings") || !Kt(t.pluginSettings) || !_a(t, "pluginUiState") || !Kt(t.pluginUiState) || _a(t, "pluginChatState"));
}
function Va(t) {
  if (Array.isArray(t))
    return t.map((r) => Va(r));
  if (!Kt(t))
    return t;
  const e = {};
  return Object.keys(t).sort((r, n) => r.localeCompare(n)).forEach((r) => {
    e[r] = Va(t[r]);
  }), e;
}
function bb(t) {
  return JSON.stringify(Va(t));
}
function zs(t) {
  const e = Ro(t);
  return bb({
    pluginSettings: e.pluginSettings,
    pluginUiState: e.pluginUiState,
    __sdkMeta: e.__sdkMeta
  });
}
function vb(t) {
  return t ? Object.keys(t.pluginSettings ?? {}).length + Object.keys(t.pluginUiState ?? {}).length : 0;
}
function xb(t) {
  if (!Kt(t)) return 1;
  const e = Kt(t.pluginSettings), r = Kt(t.pluginUiState);
  return e && r ? 3 : e || r ? 2 : 1;
}
function Lc(t) {
  const e = String(t ?? "").trim();
  if (!e)
    return {
      hasValue: !1,
      valid: !1,
      bucket: null,
      needsShapeRepair: !1,
      quality: 0,
      payloadSize: 0
    };
  try {
    const r = JSON.parse(e), n = Ro(r);
    return {
      hasValue: !0,
      valid: !0,
      bucket: n,
      needsShapeRepair: gb(r),
      quality: xb(r),
      payloadSize: vb(n)
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
function Ro(t) {
  if (!Kt(t))
    return {
      pluginSettings: {},
      pluginUiState: {},
      __sdkMeta: {
        updatedAt: 0
      }
    };
  const e = Kt(t.pluginSettings) ? t.pluginSettings : {}, r = Kt(t.pluginUiState) ? t.pluginUiState : {}, n = Number(
    Kt(t.__sdkMeta) ? t.__sdkMeta.updatedAt : 0
  );
  return {
    pluginSettings: { ...e },
    pluginUiState: { ...r },
    pluginChatState: {},
    __sdkMeta: {
      updatedAt: Number.isFinite(n) ? n : 0
    }
  };
}
function um(t, e) {
  const r = lm(t, e), n = Lc(mb(r)), o = Lc(hb(r)), i = Number(n.bucket?.__sdkMeta?.updatedAt ?? 0), c = Number(o.bucket?.__sdkMeta?.updatedAt ?? 0), h = n.valid && n.bucket && (i > c || i === c && (n.quality > o.quality || n.quality === o.quality && n.payloadSize >= o.payloadSize)) ? n.bucket : o.valid && o.bucket ? o.bucket : Ro(null), f = n.valid && n.bucket ? zs(n.bucket) : "", b = o.valid && o.bucket ? zs(o.bucket) : "", v = zs(h);
  return (n.hasValue && !n.valid && o.valid || o.hasValue && !o.valid && n.valid || n.valid && o.valid && f !== b || n.valid && n.needsShapeRepair || o.valid && o.needsShapeRepair || !n.valid && !o.valid && (n.hasValue || o.hasValue)) && cm(r, v), h;
}
function yb(t) {
  const e = String(t ?? "").trim();
  if (!e) return null;
  const r = `${am}::`;
  if (!e.startsWith(r)) return null;
  const n = e.slice(r.length), o = n.indexOf("::");
  if (o <= 0) return null;
  const i = n.slice(0, o).trim(), c = n.slice(o + 2).trim();
  return !i || !c ? null : {
    namespace: i,
    tavernInstanceId: c
  };
}
function Sb() {
  Nc || typeof window > "u" || typeof window.addEventListener != "function" || (Nc = !0, window.addEventListener("storage", (t) => {
    const e = yb(String(t.key ?? ""));
    if (!e) return;
    const r = Jr.get(e.namespace);
    if (!r || r.size <= 0) return;
    const n = cl();
    if (n.tavernInstanceId !== e.tavernInstanceId) return;
    const o = um(e.namespace, n);
    dm(e.namespace, {
      namespace: e.namespace,
      scope: n,
      pluginSettings: o.pluginSettings,
      pluginUiState: o.pluginUiState
    });
  }));
}
function dm(t, e) {
  const r = Jr.get(t);
  !r || r.size <= 0 || Array.from(r).forEach((n) => {
    try {
      n(e);
    } catch {
    }
  });
}
function mm(t, e, r) {
  const n = lm(t, e), o = Ro({
    ...r,
    __sdkMeta: {
      updatedAt: Date.now()
    }
  });
  try {
    cm(n, zs(o));
  } finally {
    dm(t, {
      namespace: t,
      scope: e,
      pluginSettings: o.pluginSettings,
      pluginUiState: o.pluginUiState
    });
  }
}
function Co(t) {
  const e = cl(), r = um(t, e);
  return {
    namespace: t,
    scope: e,
    pluginSettings: r.pluginSettings,
    pluginUiState: r.pluginUiState
  };
}
function Eb(t, e) {
  const r = Co(t), n = r.pluginSettings, o = typeof e == "function" ? e({ ...n }) : { ...n, ...e }, i = Kt(o) ? o : {};
  return mm(t, r.scope, {
    pluginSettings: i,
    pluginUiState: r.pluginUiState
  }), { ...i };
}
function _b(t) {
  return { ...Co(t).pluginSettings };
}
function Tb(t, e) {
  Sb();
  let r = Jr.get(t);
  return r || (r = /* @__PURE__ */ new Set(), Jr.set(t, r)), r.add(e), () => {
    const n = Jr.get(t);
    n && (n.delete(e), n.size <= 0 && Jr.delete(t));
  };
}
function kb(t, e, r) {
  const n = String(e ?? "").trim();
  if (!n) return r;
  const o = Co(t);
  return n in o.pluginUiState ? o.pluginUiState[n] : r;
}
function wb(t, e, r) {
  const n = String(e ?? "").trim();
  if (!n) return r;
  const o = Co(t);
  return mm(t, o.scope, {
    pluginSettings: o.pluginSettings,
    pluginUiState: {
      ...o.pluginUiState,
      [n]: r
    }
  }), r;
}
function hm() {
  return cl();
}
function Ib(t) {
  const e = un(t);
  return e ? _b(e) : {};
}
function Ab(t, e) {
  const r = un(t);
  if (!r) {
    const n = typeof e == "function" ? e({}) : { ...e ?? {} };
    return Kt(n) ? n : {};
  }
  return Eb(r, e);
}
function $b(t, e) {
  const r = un(t);
  return r ? Tb(r, e) : () => {
  };
}
function pm(t, e, r) {
  const n = un(t);
  return n ? kb(n, e, r) : r;
}
function fm(t, e, r) {
  const n = un(t);
  return n ? wb(n, e, r) : r;
}
function Rb(t) {
  const e = un(t.namespace), r = { ...t.defaults ?? {} }, n = t.normalize;
  return {
    read: () => {
      const d = Ib(e), h = {
        ...r,
        ...d
      };
      return n ? n(h) : h;
    },
    write: (d) => {
      const h = Ab(e, (b) => {
        const v = {
          ...r,
          ...b
        }, E = typeof d == "function" ? d(v) : {
          ...v,
          ...d
        }, y = n ? n(E) : E;
        return Kt(y) ? { ...y } : {};
      }), f = {
        ...r,
        ...h
      };
      return n ? n(f) : f;
    },
    subscribe: (d) => $b(e, (h) => {
      const f = {
        ...r,
        ...h.pluginSettings
      }, b = n ? n(f) : f;
      d(b, h.scope);
    }),
    readUiState: (d, h) => pm(e, d, h),
    writeUiState: (d, h) => fm(e, d, h),
    getScope: () => hm()
  };
}
var Cb = typeof globalThis < "u" ? globalThis : typeof window < "u" ? window : typeof global < "u" ? global : typeof self < "u" ? self : {};
function Db(t) {
  return t && t.__esModule && Object.prototype.hasOwnProperty.call(t, "default") ? t.default : t;
}
var Gs = { exports: {} }, Nb = Gs.exports, Mc;
function Lb() {
  return Mc || (Mc = 1, (function(t, e) {
    ((r, n) => {
      t.exports = n();
    })(Nb, function() {
      var r = function(s, a) {
        return (r = Object.setPrototypeOf || ({ __proto__: [] } instanceof Array ? function(l, u) {
          l.__proto__ = u;
        } : function(l, u) {
          for (var m in u) Object.prototype.hasOwnProperty.call(u, m) && (l[m] = u[m]);
        }))(s, a);
      }, n = function() {
        return (n = Object.assign || function(s) {
          for (var a, l = 1, u = arguments.length; l < u; l++) for (var m in a = arguments[l]) Object.prototype.hasOwnProperty.call(a, m) && (s[m] = a[m]);
          return s;
        }).apply(this, arguments);
      };
      function o(s, a, l) {
        for (var u, m = 0, p = a.length; m < p; m++) !u && m in a || ((u = u || Array.prototype.slice.call(a, 0, m))[m] = a[m]);
        return s.concat(u || Array.prototype.slice.call(a));
      }
      var i = typeof globalThis < "u" ? globalThis : typeof self < "u" ? self : typeof window < "u" ? window : Cb, c = Object.keys, d = Array.isArray;
      function h(s, a) {
        return typeof a == "object" && c(a).forEach(function(l) {
          s[l] = a[l];
        }), s;
      }
      typeof Promise > "u" || i.Promise || (i.Promise = Promise);
      var f = Object.getPrototypeOf, b = {}.hasOwnProperty;
      function v(s, a) {
        return b.call(s, a);
      }
      function E(s, a) {
        typeof a == "function" && (a = a(f(s))), (typeof Reflect > "u" ? c : Reflect.ownKeys)(a).forEach(function(l) {
          $(s, l, a[l]);
        });
      }
      var y = Object.defineProperty;
      function $(s, a, l, u) {
        y(s, a, h(l && v(l, "get") && typeof l.get == "function" ? { get: l.get, set: l.set, configurable: !0 } : { value: l, configurable: !0, writable: !0 }, u));
      }
      function O(s) {
        return { from: function(a) {
          return s.prototype = Object.create(a.prototype), $(s.prototype, "constructor", s), { extend: E.bind(null, s.prototype) };
        } };
      }
      var L = Object.getOwnPropertyDescriptor, D = [].slice;
      function G(s, a, l) {
        return D.call(s, a, l);
      }
      function P(s, a) {
        return a(s);
      }
      function K(s) {
        if (!s) throw new Error("Assertion Failed");
      }
      function X(s) {
        i.setImmediate ? setImmediate(s) : setTimeout(s, 0);
      }
      function F(s, a) {
        if (typeof a == "string" && v(s, a)) return s[a];
        if (!a) return s;
        if (typeof a != "string") {
          for (var l = [], u = 0, m = a.length; u < m; ++u) {
            var p = F(s, a[u]);
            l.push(p);
          }
          return l;
        }
        var g, x = a.indexOf(".");
        return x === -1 || (g = s[a.substr(0, x)]) == null ? void 0 : F(g, a.substr(x + 1));
      }
      function z(s, a, l) {
        if (s && a !== void 0 && !("isFrozen" in Object && Object.isFrozen(s))) if (typeof a != "string" && "length" in a) {
          K(typeof l != "string" && "length" in l);
          for (var u = 0, m = a.length; u < m; ++u) z(s, a[u], l[u]);
        } else {
          var p, g, x = a.indexOf(".");
          x !== -1 ? (p = a.substr(0, x), (x = a.substr(x + 1)) === "" ? l === void 0 ? d(s) && !isNaN(parseInt(p)) ? s.splice(p, 1) : delete s[p] : s[p] = l : z(g = (g = s[p]) && v(s, p) ? g : s[p] = {}, x, l)) : l === void 0 ? d(s) && !isNaN(parseInt(a)) ? s.splice(a, 1) : delete s[a] : s[a] = l;
        }
      }
      function Z(s) {
        var a, l = {};
        for (a in s) v(s, a) && (l[a] = s[a]);
        return l;
      }
      var H = [].concat;
      function B(s) {
        return H.apply([], s);
      }
      var Ot = "BigUint64Array,BigInt64Array,Array,Boolean,String,Date,RegExp,Blob,File,FileList,FileSystemFileHandle,FileSystemDirectoryHandle,ArrayBuffer,DataView,Uint8ClampedArray,ImageBitmap,ImageData,Map,Set,CryptoKey".split(",").concat(B([8, 16, 32, 64].map(function(s) {
        return ["Int", "Uint", "Float"].map(function(a) {
          return a + s + "Array";
        });
      }))).filter(function(s) {
        return i[s];
      }), tt = new Set(Ot.map(function(s) {
        return i[s];
      })), it = null;
      function dt(s) {
        return it = /* @__PURE__ */ new WeakMap(), s = (function a(l) {
          if (!l || typeof l != "object") return l;
          var u = it.get(l);
          if (u) return u;
          if (d(l)) {
            u = [], it.set(l, u);
            for (var m = 0, p = l.length; m < p; ++m) u.push(a(l[m]));
          } else if (tt.has(l.constructor)) u = l;
          else {
            var g, x = f(l);
            for (g in u = x === Object.prototype ? {} : Object.create(x), it.set(l, u), l) v(l, g) && (u[g] = a(l[g]));
          }
          return u;
        })(s), it = null, s;
      }
      var Tt = {}.toString;
      function Rt(s) {
        return Tt.call(s).slice(8, -1);
      }
      var pt = typeof Symbol < "u" ? Symbol.iterator : "@@iterator", rt = typeof pt == "symbol" ? function(s) {
        var a;
        return s != null && (a = s[pt]) && a.apply(s);
      } : function() {
        return null;
      };
      function vt(s, a) {
        a = s.indexOf(a), 0 <= a && s.splice(a, 1);
      }
      var Mt = {};
      function Pt(s) {
        var a, l, u, m;
        if (arguments.length === 1) {
          if (d(s)) return s.slice();
          if (this === Mt && typeof s == "string") return [s];
          if (m = rt(s)) for (l = []; !(u = m.next()).done; ) l.push(u.value);
          else {
            if (s == null) return [s];
            if (typeof (a = s.length) != "number") return [s];
            for (l = new Array(a); a--; ) l[a] = s[a];
          }
        } else for (a = arguments.length, l = new Array(a); a--; ) l[a] = arguments[a];
        return l;
      }
      var oe = typeof Symbol < "u" ? function(s) {
        return s[Symbol.toStringTag] === "AsyncFunction";
      } : function() {
        return !1;
      }, Ot = ["Unknown", "Constraint", "Data", "TransactionInactive", "ReadOnly", "Version", "NotFound", "InvalidState", "InvalidAccess", "Abort", "Timeout", "QuotaExceeded", "Syntax", "DataClone"], te = ["Modify", "Bulk", "OpenFailed", "VersionChange", "Schema", "Upgrade", "InvalidTable", "MissingAPI", "NoSuchDatabase", "InvalidArgument", "SubTransaction", "Unsupported", "Internal", "DatabaseClosed", "PrematureCommit", "ForeignAwait"].concat(Ot), Wt = { VersionChanged: "Database version changed by other database connection", DatabaseClosed: "Database has been closed", Abort: "Transaction aborted", TransactionInactive: "Transaction has already completed or failed", MissingAPI: "IndexedDB API missing. Please visit https://tinyurl.com/y2uuvskb" };
      function Ct(s, a) {
        this.name = s, this.message = a;
      }
      function Se(s, a) {
        return s + ". Errors: " + Object.keys(a).map(function(l) {
          return a[l].toString();
        }).filter(function(l, u, m) {
          return m.indexOf(l) === u;
        }).join(`
`);
      }
      function ce(s, a, l, u) {
        this.failures = a, this.failedKeys = u, this.successCount = l, this.message = Se(s, a);
      }
      function Zt(s, a) {
        this.name = "BulkError", this.failures = Object.keys(a).map(function(l) {
          return a[l];
        }), this.failuresByPos = a, this.message = Se(s, this.failures);
      }
      O(Ct).from(Error).extend({ toString: function() {
        return this.name + ": " + this.message;
      } }), O(ce).from(Ct), O(Zt).from(Ct);
      var rs = te.reduce(function(s, a) {
        return s[a] = a + "Error", s;
      }, {}), ap = Ct, ot = te.reduce(function(s, a) {
        var l = a + "Error";
        function u(m, p) {
          this.name = l, m ? typeof m == "string" ? (this.message = "".concat(m).concat(p ? `
 ` + p : ""), this.inner = p || null) : typeof m == "object" && (this.message = "".concat(m.name, " ").concat(m.message), this.inner = m) : (this.message = Wt[a] || l, this.inner = null);
        }
        return O(u).from(ap), s[a] = u, s;
      }, {}), Ml = (ot.Syntax = SyntaxError, ot.Type = TypeError, ot.Range = RangeError, Ot.reduce(function(s, a) {
        return s[a + "Error"] = ot[a], s;
      }, {}));
      Ot = te.reduce(function(s, a) {
        return ["Syntax", "Type", "Range"].indexOf(a) === -1 && (s[a + "Error"] = ot[a]), s;
      }, {});
      function xt() {
      }
      function mn(s) {
        return s;
      }
      function ip(s, a) {
        return s == null || s === mn ? a : function(l) {
          return a(s(l));
        };
      }
      function tr(s, a) {
        return function() {
          s.apply(this, arguments), a.apply(this, arguments);
        };
      }
      function lp(s, a) {
        return s === xt ? a : function() {
          var l = s.apply(this, arguments), u = (l !== void 0 && (arguments[0] = l), this.onsuccess), m = this.onerror, p = (this.onsuccess = null, this.onerror = null, a.apply(this, arguments));
          return u && (this.onsuccess = this.onsuccess ? tr(u, this.onsuccess) : u), m && (this.onerror = this.onerror ? tr(m, this.onerror) : m), p !== void 0 ? p : l;
        };
      }
      function cp(s, a) {
        return s === xt ? a : function() {
          s.apply(this, arguments);
          var l = this.onsuccess, u = this.onerror;
          this.onsuccess = this.onerror = null, a.apply(this, arguments), l && (this.onsuccess = this.onsuccess ? tr(l, this.onsuccess) : l), u && (this.onerror = this.onerror ? tr(u, this.onerror) : u);
        };
      }
      function up(s, a) {
        return s === xt ? a : function(m) {
          var u = s.apply(this, arguments), m = (h(m, u), this.onsuccess), p = this.onerror, g = (this.onsuccess = null, this.onerror = null, a.apply(this, arguments));
          return m && (this.onsuccess = this.onsuccess ? tr(m, this.onsuccess) : m), p && (this.onerror = this.onerror ? tr(p, this.onerror) : p), u === void 0 ? g === void 0 ? void 0 : g : h(u, g);
        };
      }
      function dp(s, a) {
        return s === xt ? a : function() {
          return a.apply(this, arguments) !== !1 && s.apply(this, arguments);
        };
      }
      function Bo(s, a) {
        return s === xt ? a : function() {
          var l = s.apply(this, arguments);
          if (l && typeof l.then == "function") {
            for (var u = this, m = arguments.length, p = new Array(m); m--; ) p[m] = arguments[m];
            return l.then(function() {
              return a.apply(u, p);
            });
          }
          return a.apply(this, arguments);
        };
      }
      Ot.ModifyError = ce, Ot.DexieError = Ct, Ot.BulkError = Zt;
      var me = typeof location < "u" && /^(http|https):\/\/(localhost|127\.0\.0\.1)/.test(location.href);
      function Ol(s) {
        me = s;
      }
      var hn = {}, Pl = 100, pn = typeof Promise > "u" ? [] : (te = Promise.resolve(), typeof crypto < "u" && crypto.subtle ? [pn = crypto.subtle.digest("SHA-512", new Uint8Array([0])), f(pn), te] : [te, f(te), te]), te = pn[0], Br = pn[1], Br = Br && Br.then, er = te && te.constructor, Uo = !!pn[2], fn = function(s, a) {
        gn.push([s, a]), ns && (queueMicrotask(hp), ns = !1);
      }, Ho = !0, ns = !0, rr = [], ss = [], zo = mn, Ce = { id: "global", global: !0, ref: 0, unhandleds: [], onunhandled: xt, pgp: !1, env: {}, finalize: xt }, st = Ce, gn = [], nr = 0, os = [];
      function J(s) {
        if (typeof this != "object") throw new TypeError("Promises must be constructed via new");
        this._listeners = [], this._lib = !1;
        var a = this._PSD = st;
        if (typeof s != "function") {
          if (s !== hn) throw new TypeError("Not a function");
          this._state = arguments[1], this._value = arguments[2], this._state === !1 && Ko(this, this._value);
        } else this._state = null, this._value = null, ++a.ref, (function l(u, m) {
          try {
            m(function(p) {
              if (u._state === null) {
                if (p === u) throw new TypeError("A promise cannot be resolved with itself.");
                var g = u._lib && Cr();
                p && typeof p.then == "function" ? l(u, function(x, T) {
                  p instanceof J ? p._then(x, T) : p.then(x, T);
                }) : (u._state = !0, u._value = p, Ul(u)), g && Dr();
              }
            }, Ko.bind(null, u));
          } catch (p) {
            Ko(u, p);
          }
        })(this, s);
      }
      var Go = { get: function() {
        var s = st, a = cs;
        function l(u, m) {
          var p = this, g = !s.global && (s !== st || a !== cs), x = g && !Ne(), T = new J(function(C, k) {
            jo(p, new Bl(zl(u, s, g, x), zl(m, s, g, x), C, k, s));
          });
          return this._consoleTask && (T._consoleTask = this._consoleTask), T;
        }
        return l.prototype = hn, l;
      }, set: function(s) {
        $(this, "then", s && s.prototype === hn ? Go : { get: function() {
          return s;
        }, set: Go.set });
      } };
      function Bl(s, a, l, u, m) {
        this.onFulfilled = typeof s == "function" ? s : null, this.onRejected = typeof a == "function" ? a : null, this.resolve = l, this.reject = u, this.psd = m;
      }
      function Ko(s, a) {
        var l, u;
        ss.push(a), s._state === null && (l = s._lib && Cr(), a = zo(a), s._state = !1, s._value = a, u = s, rr.some(function(m) {
          return m._value === u._value;
        }) || rr.push(u), Ul(s), l) && Dr();
      }
      function Ul(s) {
        var a = s._listeners;
        s._listeners = [];
        for (var l = 0, u = a.length; l < u; ++l) jo(s, a[l]);
        var m = s._PSD;
        --m.ref || m.finalize(), nr === 0 && (++nr, fn(function() {
          --nr == 0 && qo();
        }, []));
      }
      function jo(s, a) {
        if (s._state === null) s._listeners.push(a);
        else {
          var l = s._state ? a.onFulfilled : a.onRejected;
          if (l === null) return (s._state ? a.resolve : a.reject)(s._value);
          ++a.psd.ref, ++nr, fn(mp, [l, s, a]);
        }
      }
      function mp(s, a, l) {
        try {
          var u, m = a._value;
          !a._state && ss.length && (ss = []), u = me && a._consoleTask ? a._consoleTask.run(function() {
            return s(m);
          }) : s(m), a._state || ss.indexOf(m) !== -1 || ((p) => {
            for (var g = rr.length; g; ) if (rr[--g]._value === p._value) return rr.splice(g, 1);
          })(a), l.resolve(u);
        } catch (p) {
          l.reject(p);
        } finally {
          --nr == 0 && qo(), --l.psd.ref || l.psd.finalize();
        }
      }
      function hp() {
        sr(Ce, function() {
          Cr() && Dr();
        });
      }
      function Cr() {
        var s = Ho;
        return ns = Ho = !1, s;
      }
      function Dr() {
        var s, a, l;
        do
          for (; 0 < gn.length; ) for (s = gn, gn = [], l = s.length, a = 0; a < l; ++a) {
            var u = s[a];
            u[0].apply(null, u[1]);
          }
        while (0 < gn.length);
        ns = Ho = !0;
      }
      function qo() {
        for (var s = rr, a = (rr = [], s.forEach(function(u) {
          u._PSD.onunhandled.call(null, u._value, u);
        }), os.slice(0)), l = a.length; l; ) a[--l]();
      }
      function as(s) {
        return new J(hn, !1, s);
      }
      function _t(s, a) {
        var l = st;
        return function() {
          var u = Cr(), m = st;
          try {
            return Le(l, !0), s.apply(this, arguments);
          } catch (p) {
            a && a(p);
          } finally {
            Le(m, !1), u && Dr();
          }
        };
      }
      E(J.prototype, { then: Go, _then: function(s, a) {
        jo(this, new Bl(null, null, s, a, st));
      }, catch: function(s) {
        var a, l;
        return arguments.length === 1 ? this.then(null, s) : (a = s, l = arguments[1], typeof a == "function" ? this.then(null, function(u) {
          return (u instanceof a ? l : as)(u);
        }) : this.then(null, function(u) {
          return (u && u.name === a ? l : as)(u);
        }));
      }, finally: function(s) {
        return this.then(function(a) {
          return J.resolve(s()).then(function() {
            return a;
          });
        }, function(a) {
          return J.resolve(s()).then(function() {
            return as(a);
          });
        });
      }, timeout: function(s, a) {
        var l = this;
        return s < 1 / 0 ? new J(function(u, m) {
          var p = setTimeout(function() {
            return m(new ot.Timeout(a));
          }, s);
          l.then(u, m).finally(clearTimeout.bind(null, p));
        }) : this;
      } }), typeof Symbol < "u" && Symbol.toStringTag && $(J.prototype, Symbol.toStringTag, "Dexie.Promise"), Ce.env = Hl(), E(J, { all: function() {
        var s = Pt.apply(null, arguments).map(us);
        return new J(function(a, l) {
          s.length === 0 && a([]);
          var u = s.length;
          s.forEach(function(m, p) {
            return J.resolve(m).then(function(g) {
              s[p] = g, --u || a(s);
            }, l);
          });
        });
      }, resolve: function(s) {
        return s instanceof J ? s : s && typeof s.then == "function" ? new J(function(a, l) {
          s.then(a, l);
        }) : new J(hn, !0, s);
      }, reject: as, race: function() {
        var s = Pt.apply(null, arguments).map(us);
        return new J(function(a, l) {
          s.map(function(u) {
            return J.resolve(u).then(a, l);
          });
        });
      }, PSD: { get: function() {
        return st;
      }, set: function(s) {
        return st = s;
      } }, totalEchoes: { get: function() {
        return cs;
      } }, newPSD: De, usePSD: sr, scheduler: { get: function() {
        return fn;
      }, set: function(s) {
        fn = s;
      } }, rejectionMapper: { get: function() {
        return zo;
      }, set: function(s) {
        zo = s;
      } }, follow: function(s, a) {
        return new J(function(l, u) {
          return De(function(m, p) {
            var g = st;
            g.unhandleds = [], g.onunhandled = p, g.finalize = tr(function() {
              var x, T = this;
              x = function() {
                T.unhandleds.length === 0 ? m() : p(T.unhandleds[0]);
              }, os.push(function C() {
                x(), os.splice(os.indexOf(C), 1);
              }), ++nr, fn(function() {
                --nr == 0 && qo();
              }, []);
            }, g.finalize), s();
          }, a, l, u);
        });
      } }), er && (er.allSettled && $(J, "allSettled", function() {
        var s = Pt.apply(null, arguments).map(us);
        return new J(function(a) {
          s.length === 0 && a([]);
          var l = s.length, u = new Array(l);
          s.forEach(function(m, p) {
            return J.resolve(m).then(function(g) {
              return u[p] = { status: "fulfilled", value: g };
            }, function(g) {
              return u[p] = { status: "rejected", reason: g };
            }).then(function() {
              return --l || a(u);
            });
          });
        });
      }), er.any && typeof AggregateError < "u" && $(J, "any", function() {
        var s = Pt.apply(null, arguments).map(us);
        return new J(function(a, l) {
          s.length === 0 && l(new AggregateError([]));
          var u = s.length, m = new Array(u);
          s.forEach(function(p, g) {
            return J.resolve(p).then(function(x) {
              return a(x);
            }, function(x) {
              m[g] = x, --u || l(new AggregateError(m));
            });
          });
        });
      }), er.withResolvers) && (J.withResolvers = er.withResolvers);
      var Bt = { awaits: 0, echoes: 0, id: 0 }, pp = 0, is = [], ls = 0, cs = 0, fp = 0;
      function De(s, g, l, u) {
        var m = st, p = Object.create(m), g = (p.parent = m, p.ref = 0, p.global = !1, p.id = ++fp, Ce.env, p.env = Uo ? { Promise: J, PromiseProp: { value: J, configurable: !0, writable: !0 }, all: J.all, race: J.race, allSettled: J.allSettled, any: J.any, resolve: J.resolve, reject: J.reject } : {}, g && h(p, g), ++m.ref, p.finalize = function() {
          --this.parent.ref || this.parent.finalize();
        }, sr(p, s, l, u));
        return p.ref === 0 && p.finalize(), g;
      }
      function Nr() {
        return Bt.id || (Bt.id = ++pp), ++Bt.awaits, Bt.echoes += Pl, Bt.id;
      }
      function Ne() {
        return !!Bt.awaits && (--Bt.awaits == 0 && (Bt.id = 0), Bt.echoes = Bt.awaits * Pl, !0);
      }
      function us(s) {
        return Bt.echoes && s && s.constructor === er ? (Nr(), s.then(function(a) {
          return Ne(), a;
        }, function(a) {
          return Ne(), Dt(a);
        })) : s;
      }
      function gp() {
        var s = is[is.length - 1];
        is.pop(), Le(s, !1);
      }
      function Le(s, a) {
        var l, u, m = st;
        (a ? !Bt.echoes || ls++ && s === st : !ls || --ls && s === st) || queueMicrotask(a ? function(p) {
          ++cs, Bt.echoes && --Bt.echoes != 0 || (Bt.echoes = Bt.awaits = Bt.id = 0), is.push(st), Le(p, !0);
        }.bind(null, s) : gp), s !== st && (st = s, m === Ce && (Ce.env = Hl()), Uo) && (l = Ce.env.Promise, u = s.env, m.global || s.global) && (Object.defineProperty(i, "Promise", u.PromiseProp), l.all = u.all, l.race = u.race, l.resolve = u.resolve, l.reject = u.reject, u.allSettled && (l.allSettled = u.allSettled), u.any) && (l.any = u.any);
      }
      function Hl() {
        var s = i.Promise;
        return Uo ? { Promise: s, PromiseProp: Object.getOwnPropertyDescriptor(i, "Promise"), all: s.all, race: s.race, allSettled: s.allSettled, any: s.any, resolve: s.resolve, reject: s.reject } : {};
      }
      function sr(s, a, l, u, m) {
        var p = st;
        try {
          return Le(s, !0), a(l, u, m);
        } finally {
          Le(p, !1);
        }
      }
      function zl(s, a, l, u) {
        return typeof s != "function" ? s : function() {
          var m = st;
          l && Nr(), Le(a, !0);
          try {
            return s.apply(this, arguments);
          } finally {
            Le(m, !1), u && queueMicrotask(Ne);
          }
        };
      }
      function Fo(s) {
        Promise === er && Bt.echoes === 0 ? ls === 0 ? s() : enqueueNativeMicroTask(s) : setTimeout(s, 0);
      }
      ("" + Br).indexOf("[native code]") === -1 && (Nr = Ne = xt);
      var Dt = J.reject, or = "￿", Ee = "Invalid key provided. Keys must be of type string, number, Date or Array<string | number | Date>.", Gl = "String expected.", Lr = [], ds = "__dbnames", Vo = "readonly", Yo = "readwrite";
      function ar(s, a) {
        return s ? a ? function() {
          return s.apply(this, arguments) && a.apply(this, arguments);
        } : s : a;
      }
      var Kl = { type: 3, lower: -1 / 0, lowerOpen: !1, upper: [[]], upperOpen: !1 };
      function ms(s) {
        return typeof s != "string" || /\./.test(s) ? function(a) {
          return a;
        } : function(a) {
          return a[s] === void 0 && s in a && delete (a = dt(a))[s], a;
        };
      }
      function jl() {
        throw ot.Type("Entity instances must never be new:ed. Instances are generated by the framework bypassing the constructor.");
      }
      function mt(s, a) {
        try {
          var l = ql(s), u = ql(a);
          if (l !== u) return l === "Array" ? 1 : u === "Array" ? -1 : l === "binary" ? 1 : u === "binary" ? -1 : l === "string" ? 1 : u === "string" ? -1 : l === "Date" ? 1 : u !== "Date" ? NaN : -1;
          switch (l) {
            case "number":
            case "Date":
            case "string":
              return a < s ? 1 : s < a ? -1 : 0;
            case "binary":
              for (var m = Fl(s), p = Fl(a), g = m.length, x = p.length, T = g < x ? g : x, C = 0; C < T; ++C) if (m[C] !== p[C]) return m[C] < p[C] ? -1 : 1;
              return g === x ? 0 : g < x ? -1 : 1;
            case "Array":
              for (var k = s, S = a, I = k.length, A = S.length, w = I < A ? I : A, _ = 0; _ < w; ++_) {
                var N = mt(k[_], S[_]);
                if (N !== 0) return N;
              }
              return I === A ? 0 : I < A ? -1 : 1;
          }
        } catch {
        }
        return NaN;
      }
      function ql(s) {
        var a = typeof s;
        return a == "object" && (ArrayBuffer.isView(s) || (a = Rt(s)) === "ArrayBuffer") ? "binary" : a;
      }
      function Fl(s) {
        return s instanceof Uint8Array ? s : ArrayBuffer.isView(s) ? new Uint8Array(s.buffer, s.byteOffset, s.byteLength) : new Uint8Array(s);
      }
      function hs(s, a, l) {
        var u = s.schema.yProps;
        return u ? (a && 0 < l.numFailures && (a = a.filter(function(m, p) {
          return !l.failures[p];
        })), Promise.all(u.map(function(m) {
          return m = m.updatesTable, a ? s.db.table(m).where("k").anyOf(a).delete() : s.db.table(m).clear();
        })).then(function() {
          return l;
        })) : l;
      }
      Vl.prototype.execute = function(s) {
        var a = this["@@propmod"];
        if (a.add !== void 0) {
          var l = a.add;
          if (d(l)) return o(o([], d(s) ? s : [], !0), l).sort();
          if (typeof l == "number") return (Number(s) || 0) + l;
          if (typeof l == "bigint") try {
            return BigInt(s) + l;
          } catch {
            return BigInt(0) + l;
          }
          throw new TypeError("Invalid term ".concat(l));
        }
        if (a.remove !== void 0) {
          var u = a.remove;
          if (d(u)) return d(s) ? s.filter(function(m) {
            return !u.includes(m);
          }).sort() : [];
          if (typeof u == "number") return Number(s) - u;
          if (typeof u == "bigint") try {
            return BigInt(s) - u;
          } catch {
            return BigInt(0) - u;
          }
          throw new TypeError("Invalid subtrahend ".concat(u));
        }
        return l = (l = a.replacePrefix) == null ? void 0 : l[0], l && typeof s == "string" && s.startsWith(l) ? a.replacePrefix[1] + s.substring(l.length) : s;
      };
      var bn = Vl;
      function Vl(s) {
        this["@@propmod"] = s;
      }
      function Yl(s, a) {
        for (var l = c(a), u = l.length, m = !1, p = 0; p < u; ++p) {
          var g = l[p], x = a[g], T = F(s, g);
          x instanceof bn ? (z(s, g, x.execute(T)), m = !0) : T !== x && (z(s, g, x), m = !0);
        }
        return m;
      }
      Et.prototype._trans = function(s, a, l) {
        var u = this._tx || st.trans, m = this.name, p = me && typeof console < "u" && console.createTask && console.createTask("Dexie: ".concat(s === "readonly" ? "read" : "write", " ").concat(this.name));
        function g(C, k, S) {
          if (S.schema[m]) return a(S.idbtrans, S);
          throw new ot.NotFound("Table " + m + " not part of transaction");
        }
        var x = Cr();
        try {
          var T = u && u.db._novip === this.db._novip ? u === st.trans ? u._promise(s, g, l) : De(function() {
            return u._promise(s, g, l);
          }, { trans: u, transless: st.transless || st }) : (function C(k, S, I, A) {
            if (k.idbdb && (k._state.openComplete || st.letThrough || k._vip)) {
              var w = k._createTransaction(S, I, k._dbSchema);
              try {
                w.create(), k._state.PR1398_maxLoop = 3;
              } catch (_) {
                return _.name === rs.InvalidState && k.isOpen() && 0 < --k._state.PR1398_maxLoop ? (console.warn("Dexie: Need to reopen db"), k.close({ disableAutoOpen: !1 }), k.open().then(function() {
                  return C(k, S, I, A);
                })) : Dt(_);
              }
              return w._promise(S, function(_, N) {
                return De(function() {
                  return st.trans = w, A(_, N, w);
                });
              }).then(function(_) {
                if (S === "readwrite") try {
                  w.idbtrans.commit();
                } catch {
                }
                return S === "readonly" ? _ : w._completion.then(function() {
                  return _;
                });
              });
            }
            if (k._state.openComplete) return Dt(new ot.DatabaseClosed(k._state.dbOpenError));
            if (!k._state.isBeingOpened) {
              if (!k._state.autoOpen) return Dt(new ot.DatabaseClosed());
              k.open().catch(xt);
            }
            return k._state.dbReadyPromise.then(function() {
              return C(k, S, I, A);
            });
          })(this.db, s, [this.name], g);
          return p && (T._consoleTask = p, T = T.catch(function(C) {
            return console.trace(C), Dt(C);
          })), T;
        } finally {
          x && Dr();
        }
      }, Et.prototype.get = function(s, a) {
        var l = this;
        return s && s.constructor === Object ? this.where(s).first(a) : s == null ? Dt(new ot.Type("Invalid argument to Table.get()")) : this._trans("readonly", function(u) {
          return l.core.get({ trans: u, key: s }).then(function(m) {
            return l.hook.reading.fire(m);
          });
        }).then(a);
      }, Et.prototype.where = function(s) {
        if (typeof s == "string") return new this.db.WhereClause(this, s);
        if (d(s)) return new this.db.WhereClause(this, "[".concat(s.join("+"), "]"));
        var a = c(s);
        if (a.length === 1) return this.where(a[0]).equals(s[a[0]]);
        var l = this.schema.indexes.concat(this.schema.primKey).filter(function(x) {
          if (x.compound && a.every(function(C) {
            return 0 <= x.keyPath.indexOf(C);
          })) {
            for (var T = 0; T < a.length; ++T) if (a.indexOf(x.keyPath[T]) === -1) return !1;
            return !0;
          }
          return !1;
        }).sort(function(x, T) {
          return x.keyPath.length - T.keyPath.length;
        })[0];
        if (l && this.db._maxKey !== or) return g = l.keyPath.slice(0, a.length), this.where(g).equals(g.map(function(x) {
          return s[x];
        }));
        !l && me && console.warn("The query ".concat(JSON.stringify(s), " on ").concat(this.name, " would benefit from a ") + "compound index [".concat(a.join("+"), "]"));
        var u = this.schema.idxByName;
        function m(x, T) {
          return mt(x, T) === 0;
        }
        var g = a.reduce(function(k, T) {
          var C = k[0], k = k[1], S = u[T], I = s[T];
          return [C || S, C || !S ? ar(k, S && S.multi ? function(A) {
            return A = F(A, T), d(A) && A.some(function(w) {
              return m(I, w);
            });
          } : function(A) {
            return m(I, F(A, T));
          }) : k];
        }, [null, null]), p = g[0], g = g[1];
        return p ? this.where(p.name).equals(s[p.keyPath]).filter(g) : l ? this.filter(g) : this.where(a).equals("");
      }, Et.prototype.filter = function(s) {
        return this.toCollection().and(s);
      }, Et.prototype.count = function(s) {
        return this.toCollection().count(s);
      }, Et.prototype.offset = function(s) {
        return this.toCollection().offset(s);
      }, Et.prototype.limit = function(s) {
        return this.toCollection().limit(s);
      }, Et.prototype.each = function(s) {
        return this.toCollection().each(s);
      }, Et.prototype.toArray = function(s) {
        return this.toCollection().toArray(s);
      }, Et.prototype.toCollection = function() {
        return new this.db.Collection(new this.db.WhereClause(this));
      }, Et.prototype.orderBy = function(s) {
        return new this.db.Collection(new this.db.WhereClause(this, d(s) ? "[".concat(s.join("+"), "]") : s));
      }, Et.prototype.reverse = function() {
        return this.toCollection().reverse();
      }, Et.prototype.mapToClass = function(s) {
        for (var a = this.db, l = this.name, u = ((this.schema.mappedClass = s).prototype instanceof jl && (s = ((g) => {
          var x = k, T = g;
          if (typeof T != "function" && T !== null) throw new TypeError("Class extends value " + String(T) + " is not a constructor or null");
          function C() {
            this.constructor = x;
          }
          function k() {
            return g !== null && g.apply(this, arguments) || this;
          }
          return r(x, T), x.prototype = T === null ? Object.create(T) : (C.prototype = T.prototype, new C()), Object.defineProperty(k.prototype, "db", { get: function() {
            return a;
          }, enumerable: !1, configurable: !0 }), k.prototype.table = function() {
            return l;
          }, k;
        })(s)), /* @__PURE__ */ new Set()), m = s.prototype; m; m = f(m)) Object.getOwnPropertyNames(m).forEach(function(g) {
          return u.add(g);
        });
        function p(g) {
          if (!g) return g;
          var x, T = Object.create(s.prototype);
          for (x in g) if (!u.has(x)) try {
            T[x] = g[x];
          } catch {
          }
          return T;
        }
        return this.schema.readHook && this.hook.reading.unsubscribe(this.schema.readHook), this.schema.readHook = p, this.hook("reading", p), s;
      }, Et.prototype.defineClass = function() {
        return this.mapToClass(function(s) {
          h(this, s);
        });
      }, Et.prototype.add = function(s, a) {
        var l = this, u = this.schema.primKey, m = u.auto, p = u.keyPath, g = s;
        return p && m && (g = ms(p)(s)), this._trans("readwrite", function(x) {
          return l.core.mutate({ trans: x, type: "add", keys: a != null ? [a] : null, values: [g] });
        }).then(function(x) {
          return x.numFailures ? J.reject(x.failures[0]) : x.lastResult;
        }).then(function(x) {
          if (p) try {
            z(s, p, x);
          } catch {
          }
          return x;
        });
      }, Et.prototype.upsert = function(s, a) {
        var l = this, u = this.schema.primKey.keyPath;
        return this._trans("readwrite", function(m) {
          return l.core.get({ trans: m, key: s }).then(function(p) {
            var g = p ?? {};
            return Yl(g, a), u && z(g, u, s), l.core.mutate({ trans: m, type: "put", values: [g], keys: [s], upsert: !0, updates: { keys: [s], changeSpecs: [a] } }).then(function(x) {
              return x.numFailures ? J.reject(x.failures[0]) : !!p;
            });
          });
        });
      }, Et.prototype.update = function(s, a) {
        return typeof s != "object" || d(s) ? this.where(":id").equals(s).modify(a) : (s = F(s, this.schema.primKey.keyPath)) === void 0 ? Dt(new ot.InvalidArgument("Given object does not contain its primary key")) : this.where(":id").equals(s).modify(a);
      }, Et.prototype.put = function(s, a) {
        var l = this, u = this.schema.primKey, m = u.auto, p = u.keyPath, g = s;
        return p && m && (g = ms(p)(s)), this._trans("readwrite", function(x) {
          return l.core.mutate({ trans: x, type: "put", values: [g], keys: a != null ? [a] : null });
        }).then(function(x) {
          return x.numFailures ? J.reject(x.failures[0]) : x.lastResult;
        }).then(function(x) {
          if (p) try {
            z(s, p, x);
          } catch {
          }
          return x;
        });
      }, Et.prototype.delete = function(s) {
        var a = this;
        return this._trans("readwrite", function(l) {
          return a.core.mutate({ trans: l, type: "delete", keys: [s] }).then(function(u) {
            return hs(a, [s], u);
          }).then(function(u) {
            return u.numFailures ? J.reject(u.failures[0]) : void 0;
          });
        });
      }, Et.prototype.clear = function() {
        var s = this;
        return this._trans("readwrite", function(a) {
          return s.core.mutate({ trans: a, type: "deleteRange", range: Kl }).then(function(l) {
            return hs(s, null, l);
          });
        }).then(function(a) {
          return a.numFailures ? J.reject(a.failures[0]) : void 0;
        });
      }, Et.prototype.bulkGet = function(s) {
        var a = this;
        return this._trans("readonly", function(l) {
          return a.core.getMany({ keys: s, trans: l }).then(function(u) {
            return u.map(function(m) {
              return a.hook.reading.fire(m);
            });
          });
        });
      }, Et.prototype.bulkAdd = function(s, a, l) {
        var u = this, m = Array.isArray(a) ? a : void 0, p = (l = l || (m ? void 0 : a)) ? l.allKeys : void 0;
        return this._trans("readwrite", function(g) {
          var x = u.schema.primKey, C = x.auto, x = x.keyPath;
          if (x && m) throw new ot.InvalidArgument("bulkAdd(): keys argument invalid on tables with inbound keys");
          if (m && m.length !== s.length) throw new ot.InvalidArgument("Arguments objects and keys must have the same length");
          var T = s.length, C = x && C ? s.map(ms(x)) : s;
          return u.core.mutate({ trans: g, type: "add", keys: m, values: C, wantResults: p }).then(function(k) {
            var S = k.numFailures, I = k.failures;
            if (S === 0) return p ? k.results : k.lastResult;
            throw new Zt("".concat(u.name, ".bulkAdd(): ").concat(S, " of ").concat(T, " operations failed"), I);
          });
        });
      }, Et.prototype.bulkPut = function(s, a, l) {
        var u = this, m = Array.isArray(a) ? a : void 0, p = (l = l || (m ? void 0 : a)) ? l.allKeys : void 0;
        return this._trans("readwrite", function(g) {
          var x = u.schema.primKey, C = x.auto, x = x.keyPath;
          if (x && m) throw new ot.InvalidArgument("bulkPut(): keys argument invalid on tables with inbound keys");
          if (m && m.length !== s.length) throw new ot.InvalidArgument("Arguments objects and keys must have the same length");
          var T = s.length, C = x && C ? s.map(ms(x)) : s;
          return u.core.mutate({ trans: g, type: "put", keys: m, values: C, wantResults: p }).then(function(k) {
            var S = k.numFailures, I = k.failures;
            if (S === 0) return p ? k.results : k.lastResult;
            throw new Zt("".concat(u.name, ".bulkPut(): ").concat(S, " of ").concat(T, " operations failed"), I);
          });
        });
      }, Et.prototype.bulkUpdate = function(s) {
        var a = this, l = this.core, u = s.map(function(g) {
          return g.key;
        }), m = s.map(function(g) {
          return g.changes;
        }), p = [];
        return this._trans("readwrite", function(g) {
          return l.getMany({ trans: g, keys: u, cache: "clone" }).then(function(x) {
            var T = [], C = [], k = (s.forEach(function(S, I) {
              var A = S.key, w = S.changes, _ = x[I];
              if (_) {
                for (var N = 0, M = Object.keys(w); N < M.length; N++) {
                  var R = M[N], U = w[R];
                  if (R === a.schema.primKey.keyPath) {
                    if (mt(U, A) !== 0) throw new ot.Constraint("Cannot update primary key in bulkUpdate()");
                  } else z(_, R, U);
                }
                p.push(I), T.push(A), C.push(_);
              }
            }), T.length);
            return l.mutate({ trans: g, type: "put", keys: T, values: C, updates: { keys: u, changeSpecs: m } }).then(function(S) {
              var I = S.numFailures, A = S.failures;
              if (I === 0) return k;
              for (var w = 0, _ = Object.keys(A); w < _.length; w++) {
                var N, M = _[w], R = p[Number(M)];
                R != null && (N = A[M], delete A[M], A[R] = N);
              }
              throw new Zt("".concat(a.name, ".bulkUpdate(): ").concat(I, " of ").concat(k, " operations failed"), A);
            });
          });
        });
      }, Et.prototype.bulkDelete = function(s) {
        var a = this, l = s.length;
        return this._trans("readwrite", function(u) {
          return a.core.mutate({ trans: u, type: "delete", keys: s }).then(function(m) {
            return hs(a, s, m);
          });
        }).then(function(u) {
          var m = u.numFailures, p = u.failures;
          if (m === 0) return u.lastResult;
          throw new Zt("".concat(a.name, ".bulkDelete(): ").concat(m, " of ").concat(l, " operations failed"), p);
        });
      };
      var Wl = Et;
      function Et() {
      }
      function vn(s) {
        function a(g, x) {
          if (x) {
            for (var T = arguments.length, C = new Array(T - 1); --T; ) C[T - 1] = arguments[T];
            return l[g].subscribe.apply(null, C), s;
          }
          if (typeof g == "string") return l[g];
        }
        var l = {};
        a.addEventType = p;
        for (var u = 1, m = arguments.length; u < m; ++u) p(arguments[u]);
        return a;
        function p(g, x, T) {
          var C, k;
          if (typeof g != "object") return x = x || dp, k = { subscribers: [], fire: T = T || xt, subscribe: function(S) {
            k.subscribers.indexOf(S) === -1 && (k.subscribers.push(S), k.fire = x(k.fire, S));
          }, unsubscribe: function(S) {
            k.subscribers = k.subscribers.filter(function(I) {
              return I !== S;
            }), k.fire = k.subscribers.reduce(x, T);
          } }, l[g] = a[g] = k;
          c(C = g).forEach(function(S) {
            var I = C[S];
            if (d(I)) p(S, C[S][0], C[S][1]);
            else {
              if (I !== "asap") throw new ot.InvalidArgument("Invalid event config");
              var A = p(S, mn, function() {
                for (var w = arguments.length, _ = new Array(w); w--; ) _[w] = arguments[w];
                A.subscribers.forEach(function(N) {
                  X(function() {
                    N.apply(null, _);
                  });
                });
              });
            }
          });
        }
      }
      function xn(s, a) {
        return O(a).from({ prototype: s }), a;
      }
      function Mr(s, a) {
        return !(s.filter || s.algorithm || s.or) && (a ? s.justLimit : !s.replayFilter);
      }
      function Wo(s, a) {
        s.filter = ar(s.filter, a);
      }
      function Xo(s, a, l) {
        var u = s.replayFilter;
        s.replayFilter = u ? function() {
          return ar(u(), a());
        } : a, s.justLimit = l && !u;
      }
      function ps(s, a) {
        if (s.isPrimKey) return a.primaryKey;
        var l = a.getIndexByKeyPath(s.index);
        if (l) return l;
        throw new ot.Schema("KeyPath " + s.index + " on object store " + a.name + " is not indexed");
      }
      function Xl(s, a, l) {
        var u = ps(s, a.schema);
        return a.openCursor({ trans: l, values: !s.keysOnly, reverse: s.dir === "prev", unique: !!s.unique, query: { index: u, range: s.range } });
      }
      function fs(s, a, l, u) {
        var m, p, g = s.replayFilter ? ar(s.filter, s.replayFilter()) : s.filter;
        return s.or ? (m = {}, p = function(x, T, C) {
          var k, S;
          g && !g(T, C, function(I) {
            return T.stop(I);
          }, function(I) {
            return T.fail(I);
          }) || ((S = "" + (k = T.primaryKey)) == "[object ArrayBuffer]" && (S = "" + new Uint8Array(k)), v(m, S)) || (m[S] = !0, a(x, T, C));
        }, Promise.all([s.or._iterate(p, l), Jl(Xl(s, u, l), s.algorithm, p, !s.keysOnly && s.valueMapper)])) : Jl(Xl(s, u, l), ar(s.algorithm, g), a, !s.keysOnly && s.valueMapper);
      }
      function Jl(s, a, l, u) {
        var m = _t(u ? function(p, g, x) {
          return l(u(p), g, x);
        } : l);
        return s.then(function(p) {
          if (p) return p.start(function() {
            var g = function() {
              return p.continue();
            };
            a && !a(p, function(x) {
              return g = x;
            }, function(x) {
              p.stop(x), g = xt;
            }, function(x) {
              p.fail(x), g = xt;
            }) || m(p.value, p, function(x) {
              return g = x;
            }), g();
          });
        });
      }
      ft.prototype._read = function(s, a) {
        var l = this._ctx;
        return l.error ? l.table._trans(null, Dt.bind(null, l.error)) : l.table._trans("readonly", s).then(a);
      }, ft.prototype._write = function(s) {
        var a = this._ctx;
        return a.error ? a.table._trans(null, Dt.bind(null, a.error)) : a.table._trans("readwrite", s, "locked");
      }, ft.prototype._addAlgorithm = function(s) {
        var a = this._ctx;
        a.algorithm = ar(a.algorithm, s);
      }, ft.prototype._iterate = function(s, a) {
        return fs(this._ctx, s, a, this._ctx.table.core);
      }, ft.prototype.clone = function(s) {
        var a = Object.create(this.constructor.prototype), l = Object.create(this._ctx);
        return s && h(l, s), a._ctx = l, a;
      }, ft.prototype.raw = function() {
        return this._ctx.valueMapper = null, this;
      }, ft.prototype.each = function(s) {
        var a = this._ctx;
        return this._read(function(l) {
          return fs(a, s, l, a.table.core);
        });
      }, ft.prototype.count = function(s) {
        var a = this;
        return this._read(function(l) {
          var u, m = a._ctx, p = m.table.core;
          return Mr(m, !0) ? p.count({ trans: l, query: { index: ps(m, p.schema), range: m.range } }).then(function(g) {
            return Math.min(g, m.limit);
          }) : (u = 0, fs(m, function() {
            return ++u, !1;
          }, l, p).then(function() {
            return u;
          }));
        }).then(s);
      }, ft.prototype.sortBy = function(s, a) {
        var l = s.split(".").reverse(), u = l[0], m = l.length - 1;
        function p(T, C) {
          return C ? p(T[l[C]], C - 1) : T[u];
        }
        var g = this._ctx.dir === "next" ? 1 : -1;
        function x(T, C) {
          return mt(p(T, m), p(C, m)) * g;
        }
        return this.toArray(function(T) {
          return T.sort(x);
        }).then(a);
      }, ft.prototype.toArray = function(s) {
        var a = this;
        return this._read(function(l) {
          var u, m, p, g = a._ctx;
          return g.dir === "next" && Mr(g, !0) && 0 < g.limit ? (u = g.valueMapper, m = ps(g, g.table.core.schema), g.table.core.query({ trans: l, limit: g.limit, values: !0, query: { index: m, range: g.range } }).then(function(x) {
            return x = x.result, u ? x.map(u) : x;
          })) : (p = [], fs(g, function(x) {
            return p.push(x);
          }, l, g.table.core).then(function() {
            return p;
          }));
        }, s);
      }, ft.prototype.offset = function(s) {
        var a = this._ctx;
        return s <= 0 || (a.offset += s, Mr(a) ? Xo(a, function() {
          var l = s;
          return function(u, m) {
            return l === 0 || (l === 1 ? --l : m(function() {
              u.advance(l), l = 0;
            }), !1);
          };
        }) : Xo(a, function() {
          var l = s;
          return function() {
            return --l < 0;
          };
        })), this;
      }, ft.prototype.limit = function(s) {
        return this._ctx.limit = Math.min(this._ctx.limit, s), Xo(this._ctx, function() {
          var a = s;
          return function(l, u, m) {
            return --a <= 0 && u(m), 0 <= a;
          };
        }, !0), this;
      }, ft.prototype.until = function(s, a) {
        return Wo(this._ctx, function(l, u, m) {
          return !s(l.value) || (u(m), a);
        }), this;
      }, ft.prototype.first = function(s) {
        return this.limit(1).toArray(function(a) {
          return a[0];
        }).then(s);
      }, ft.prototype.last = function(s) {
        return this.reverse().first(s);
      }, ft.prototype.filter = function(s) {
        var a;
        return Wo(this._ctx, function(l) {
          return s(l.value);
        }), (a = this._ctx).isMatch = ar(a.isMatch, s), this;
      }, ft.prototype.and = function(s) {
        return this.filter(s);
      }, ft.prototype.or = function(s) {
        return new this.db.WhereClause(this._ctx.table, s, this);
      }, ft.prototype.reverse = function() {
        return this._ctx.dir = this._ctx.dir === "prev" ? "next" : "prev", this._ondirectionchange && this._ondirectionchange(this._ctx.dir), this;
      }, ft.prototype.desc = function() {
        return this.reverse();
      }, ft.prototype.eachKey = function(s) {
        var a = this._ctx;
        return a.keysOnly = !a.isMatch, this.each(function(l, u) {
          s(u.key, u);
        });
      }, ft.prototype.eachUniqueKey = function(s) {
        return this._ctx.unique = "unique", this.eachKey(s);
      }, ft.prototype.eachPrimaryKey = function(s) {
        var a = this._ctx;
        return a.keysOnly = !a.isMatch, this.each(function(l, u) {
          s(u.primaryKey, u);
        });
      }, ft.prototype.keys = function(s) {
        var a = this._ctx, l = (a.keysOnly = !a.isMatch, []);
        return this.each(function(u, m) {
          l.push(m.key);
        }).then(function() {
          return l;
        }).then(s);
      }, ft.prototype.primaryKeys = function(s) {
        var a = this._ctx;
        if (a.dir === "next" && Mr(a, !0) && 0 < a.limit) return this._read(function(u) {
          var m = ps(a, a.table.core.schema);
          return a.table.core.query({ trans: u, values: !1, limit: a.limit, query: { index: m, range: a.range } });
        }).then(function(u) {
          return u.result;
        }).then(s);
        a.keysOnly = !a.isMatch;
        var l = [];
        return this.each(function(u, m) {
          l.push(m.primaryKey);
        }).then(function() {
          return l;
        }).then(s);
      }, ft.prototype.uniqueKeys = function(s) {
        return this._ctx.unique = "unique", this.keys(s);
      }, ft.prototype.firstKey = function(s) {
        return this.limit(1).keys(function(a) {
          return a[0];
        }).then(s);
      }, ft.prototype.lastKey = function(s) {
        return this.reverse().firstKey(s);
      }, ft.prototype.distinct = function() {
        var s, a = this._ctx, a = a.index && a.table.schema.idxByName[a.index];
        return a && a.multi && (s = {}, Wo(this._ctx, function(u) {
          var u = u.primaryKey.toString(), m = v(s, u);
          return s[u] = !0, !m;
        })), this;
      }, ft.prototype.modify = function(s) {
        var a = this, l = this._ctx;
        return this._write(function(u) {
          function m(_, N) {
            var M = N.failures;
            I += _ - N.numFailures;
            for (var R = 0, U = c(M); R < U.length; R++) {
              var j = U[R];
              S.push(M[j]);
            }
          }
          var p = typeof s == "function" ? s : function(_) {
            return Yl(_, s);
          }, g = l.table.core, k = g.schema.primaryKey, x = k.outbound, T = k.extractKey, C = 200, k = a.db._options.modifyChunkSize, S = (k && (C = typeof k == "object" ? k[g.name] || k["*"] || 200 : k), []), I = 0, A = [], w = s === Ql;
          return a.clone().primaryKeys().then(function(_) {
            function N(R) {
              var U = Math.min(C, _.length - R), j = _.slice(R, R + U);
              return (w ? Promise.resolve([]) : g.getMany({ trans: u, keys: j, cache: "immutable" })).then(function(Y) {
                var W = [], q = [], et = x ? [] : null, Q = w ? j : [];
                if (!w) for (var V = 0; V < U; ++V) {
                  var nt = Y[V], ht = { value: dt(nt), primKey: _[R + V] };
                  p.call(ht, ht.value, ht) !== !1 && (ht.value == null ? Q.push(_[R + V]) : x || mt(T(nt), T(ht.value)) === 0 ? (q.push(ht.value), x && et.push(_[R + V])) : (Q.push(_[R + V]), W.push(ht.value)));
                }
                return Promise.resolve(0 < W.length && g.mutate({ trans: u, type: "add", values: W }).then(function(gt) {
                  for (var at in gt.failures) Q.splice(parseInt(at), 1);
                  m(W.length, gt);
                })).then(function() {
                  return (0 < q.length || M && typeof s == "object") && g.mutate({ trans: u, type: "put", keys: et, values: q, criteria: M, changeSpec: typeof s != "function" && s, isAdditionalChunk: 0 < R }).then(function(gt) {
                    return m(q.length, gt);
                  });
                }).then(function() {
                  return (0 < Q.length || M && w) && g.mutate({ trans: u, type: "delete", keys: Q, criteria: M, isAdditionalChunk: 0 < R }).then(function(gt) {
                    return hs(l.table, Q, gt);
                  }).then(function(gt) {
                    return m(Q.length, gt);
                  });
                }).then(function() {
                  return _.length > R + U && N(R + C);
                });
              });
            }
            var M = Mr(l) && l.limit === 1 / 0 && (typeof s != "function" || w) && { index: l.index, range: l.range };
            return N(0).then(function() {
              if (0 < S.length) throw new ce("Error modifying one or more objects", S, I, A);
              return _.length;
            });
          });
        });
      }, ft.prototype.delete = function() {
        var s = this._ctx, a = s.range;
        return !Mr(s) || s.table.schema.yProps || !s.isPrimKey && a.type !== 3 ? this.modify(Ql) : this._write(function(l) {
          var u = s.table.core.schema.primaryKey, m = a;
          return s.table.core.count({ trans: l, query: { index: u, range: m } }).then(function(p) {
            return s.table.core.mutate({ trans: l, type: "deleteRange", range: m }).then(function(T) {
              var x = T.failures, T = T.numFailures;
              if (T) throw new ce("Could not delete some values", Object.keys(x).map(function(C) {
                return x[C];
              }), p - T);
              return p - T;
            });
          });
        });
      };
      var bp = ft;
      function ft() {
      }
      var Ql = function(s, a) {
        return a.value = null;
      };
      function vp(s, a) {
        return s < a ? -1 : s === a ? 0 : 1;
      }
      function xp(s, a) {
        return a < s ? -1 : s === a ? 0 : 1;
      }
      function ee(s, a, l) {
        return s = s instanceof tc ? new s.Collection(s) : s, s._ctx.error = new (l || TypeError)(a), s;
      }
      function Or(s) {
        return new s.Collection(s, function() {
          return Zl("");
        }).limit(0);
      }
      function gs(A, a, l, u) {
        var m, p, g, x, T, C, k, S = l.length;
        if (!l.every(function(_) {
          return typeof _ == "string";
        })) return ee(A, Gl);
        function I(_) {
          m = _ === "next" ? function(M) {
            return M.toUpperCase();
          } : function(M) {
            return M.toLowerCase();
          }, p = _ === "next" ? function(M) {
            return M.toLowerCase();
          } : function(M) {
            return M.toUpperCase();
          }, g = _ === "next" ? vp : xp;
          var N = l.map(function(M) {
            return { lower: p(M), upper: m(M) };
          }).sort(function(M, R) {
            return g(M.lower, R.lower);
          });
          x = N.map(function(M) {
            return M.upper;
          }), T = N.map(function(M) {
            return M.lower;
          }), k = (C = _) === "next" ? "" : u;
        }
        I("next");
        var A = new A.Collection(A, function() {
          return Me(x[0], T[S - 1] + u);
        }), w = (A._ondirectionchange = function(_) {
          I(_);
        }, 0);
        return A._addAlgorithm(function(_, N, M) {
          var R = _.key;
          if (typeof R == "string") {
            var U = p(R);
            if (a(U, T, w)) return !0;
            for (var j = null, Y = w; Y < S; ++Y) {
              var W = ((q, et, Q, V, nt, ht) => {
                for (var gt = Math.min(q.length, V.length), at = -1, lt = 0; lt < gt; ++lt) {
                  var kt = et[lt];
                  if (kt !== V[lt]) return nt(q[lt], Q[lt]) < 0 ? q.substr(0, lt) + Q[lt] + Q.substr(lt + 1) : nt(q[lt], V[lt]) < 0 ? q.substr(0, lt) + V[lt] + Q.substr(lt + 1) : 0 <= at ? q.substr(0, at) + et[at] + Q.substr(at + 1) : null;
                  nt(q[lt], kt) < 0 && (at = lt);
                }
                return gt < V.length && ht === "next" ? q + Q.substr(q.length) : gt < q.length && ht === "prev" ? q.substr(0, Q.length) : at < 0 ? null : q.substr(0, at) + V[at] + Q.substr(at + 1);
              })(R, U, x[Y], T[Y], g, C);
              W === null && j === null ? w = Y + 1 : (j === null || 0 < g(j, W)) && (j = W);
            }
            N(j !== null ? function() {
              _.continue(j + k);
            } : M);
          }
          return !1;
        }), A;
      }
      function Me(s, a, l, u) {
        return { type: 2, lower: s, upper: a, lowerOpen: l, upperOpen: u };
      }
      function Zl(s) {
        return { type: 1, lower: s, upper: s };
      }
      Object.defineProperty(Ut.prototype, "Collection", { get: function() {
        return this._ctx.table.db.Collection;
      }, enumerable: !1, configurable: !0 }), Ut.prototype.between = function(s, a, l, u) {
        l = l !== !1, u = u === !0;
        try {
          return 0 < this._cmp(s, a) || this._cmp(s, a) === 0 && (l || u) && (!l || !u) ? Or(this) : new this.Collection(this, function() {
            return Me(s, a, !l, !u);
          });
        } catch {
          return ee(this, Ee);
        }
      }, Ut.prototype.equals = function(s) {
        return s == null ? ee(this, Ee) : new this.Collection(this, function() {
          return Zl(s);
        });
      }, Ut.prototype.above = function(s) {
        return s == null ? ee(this, Ee) : new this.Collection(this, function() {
          return Me(s, void 0, !0);
        });
      }, Ut.prototype.aboveOrEqual = function(s) {
        return s == null ? ee(this, Ee) : new this.Collection(this, function() {
          return Me(s, void 0, !1);
        });
      }, Ut.prototype.below = function(s) {
        return s == null ? ee(this, Ee) : new this.Collection(this, function() {
          return Me(void 0, s, !1, !0);
        });
      }, Ut.prototype.belowOrEqual = function(s) {
        return s == null ? ee(this, Ee) : new this.Collection(this, function() {
          return Me(void 0, s);
        });
      }, Ut.prototype.startsWith = function(s) {
        return typeof s != "string" ? ee(this, Gl) : this.between(s, s + or, !0, !0);
      }, Ut.prototype.startsWithIgnoreCase = function(s) {
        return s === "" ? this.startsWith(s) : gs(this, function(a, l) {
          return a.indexOf(l[0]) === 0;
        }, [s], or);
      }, Ut.prototype.equalsIgnoreCase = function(s) {
        return gs(this, function(a, l) {
          return a === l[0];
        }, [s], "");
      }, Ut.prototype.anyOfIgnoreCase = function() {
        var s = Pt.apply(Mt, arguments);
        return s.length === 0 ? Or(this) : gs(this, function(a, l) {
          return l.indexOf(a) !== -1;
        }, s, "");
      }, Ut.prototype.startsWithAnyOfIgnoreCase = function() {
        var s = Pt.apply(Mt, arguments);
        return s.length === 0 ? Or(this) : gs(this, function(a, l) {
          return l.some(function(u) {
            return a.indexOf(u) === 0;
          });
        }, s, or);
      }, Ut.prototype.anyOf = function() {
        var s, a, l = this, u = Pt.apply(Mt, arguments), m = this._cmp;
        try {
          u.sort(m);
        } catch {
          return ee(this, Ee);
        }
        return u.length === 0 ? Or(this) : ((s = new this.Collection(this, function() {
          return Me(u[0], u[u.length - 1]);
        }))._ondirectionchange = function(p) {
          m = p === "next" ? l._ascending : l._descending, u.sort(m);
        }, a = 0, s._addAlgorithm(function(p, g, x) {
          for (var T = p.key; 0 < m(T, u[a]); ) if (++a === u.length) return g(x), !1;
          return m(T, u[a]) === 0 || (g(function() {
            p.continue(u[a]);
          }), !1);
        }), s);
      }, Ut.prototype.notEqual = function(s) {
        return this.inAnyRange([[-1 / 0, s], [s, this.db._maxKey]], { includeLowers: !1, includeUppers: !1 });
      }, Ut.prototype.noneOf = function() {
        var s = Pt.apply(Mt, arguments);
        if (s.length === 0) return new this.Collection(this);
        try {
          s.sort(this._ascending);
        } catch {
          return ee(this, Ee);
        }
        var a = s.reduce(function(l, u) {
          return l ? l.concat([[l[l.length - 1][1], u]]) : [[-1 / 0, u]];
        }, null);
        return a.push([s[s.length - 1], this.db._maxKey]), this.inAnyRange(a, { includeLowers: !1, includeUppers: !1 });
      }, Ut.prototype.inAnyRange = function(s, M) {
        var l = this, u = this._cmp, m = this._ascending, p = this._descending, g = this._min, x = this._max;
        if (s.length === 0) return Or(this);
        if (!s.every(function(R) {
          return R[0] !== void 0 && R[1] !== void 0 && m(R[0], R[1]) <= 0;
        })) return ee(this, "First argument to inAnyRange() must be an Array of two-value Arrays [lower,upper] where upper must not be lower than lower", ot.InvalidArgument);
        var T = !M || M.includeLowers !== !1, C = M && M.includeUppers === !0, k, S = m;
        function I(R, U) {
          return S(R[0], U[0]);
        }
        try {
          (k = s.reduce(function(R, U) {
            for (var j = 0, Y = R.length; j < Y; ++j) {
              var W = R[j];
              if (u(U[0], W[1]) < 0 && 0 < u(U[1], W[0])) {
                W[0] = g(W[0], U[0]), W[1] = x(W[1], U[1]);
                break;
              }
            }
            return j === Y && R.push(U), R;
          }, [])).sort(I);
        } catch {
          return ee(this, Ee);
        }
        var A = 0, w = C ? function(R) {
          return 0 < m(R, k[A][1]);
        } : function(R) {
          return 0 <= m(R, k[A][1]);
        }, _ = T ? function(R) {
          return 0 < p(R, k[A][0]);
        } : function(R) {
          return 0 <= p(R, k[A][0]);
        }, N = w, M = new this.Collection(this, function() {
          return Me(k[0][0], k[k.length - 1][1], !T, !C);
        });
        return M._ondirectionchange = function(R) {
          S = R === "next" ? (N = w, m) : (N = _, p), k.sort(I);
        }, M._addAlgorithm(function(R, U, j) {
          for (var Y, W = R.key; N(W); ) if (++A === k.length) return U(j), !1;
          return !w(Y = W) && !_(Y) || (l._cmp(W, k[A][1]) === 0 || l._cmp(W, k[A][0]) === 0 || U(function() {
            S === m ? R.continue(k[A][0]) : R.continue(k[A][1]);
          }), !1);
        }), M;
      }, Ut.prototype.startsWithAnyOf = function() {
        var s = Pt.apply(Mt, arguments);
        return s.every(function(a) {
          return typeof a == "string";
        }) ? s.length === 0 ? Or(this) : this.inAnyRange(s.map(function(a) {
          return [a, a + or];
        })) : ee(this, "startsWithAnyOf() only works with strings");
      };
      var tc = Ut;
      function Ut() {
      }
      function he(s) {
        return _t(function(a) {
          return yn(a), s(a.target.error), !1;
        });
      }
      function yn(s) {
        s.stopPropagation && s.stopPropagation(), s.preventDefault && s.preventDefault();
      }
      var Sn = "storagemutated", Jo = "x-storagemutated-1", Oe = vn(null, Sn), yp = (pe.prototype._lock = function() {
        return K(!st.global), ++this._reculock, this._reculock !== 1 || st.global || (st.lockOwnerFor = this), this;
      }, pe.prototype._unlock = function() {
        if (K(!st.global), --this._reculock == 0) for (st.global || (st.lockOwnerFor = null); 0 < this._blockedFuncs.length && !this._locked(); ) {
          var s = this._blockedFuncs.shift();
          try {
            sr(s[1], s[0]);
          } catch {
          }
        }
        return this;
      }, pe.prototype._locked = function() {
        return this._reculock && st.lockOwnerFor !== this;
      }, pe.prototype.create = function(s) {
        var a = this;
        if (this.mode) {
          var l = this.db.idbdb, u = this.db._state.dbOpenError;
          if (K(!this.idbtrans), !s && !l) switch (u && u.name) {
            case "DatabaseClosedError":
              throw new ot.DatabaseClosed(u);
            case "MissingAPIError":
              throw new ot.MissingAPI(u.message, u);
            default:
              throw new ot.OpenFailed(u);
          }
          if (!this.active) throw new ot.TransactionInactive();
          K(this._completion._state === null), (s = this.idbtrans = s || (this.db.core || l).transaction(this.storeNames, this.mode, { durability: this.chromeTransactionDurability })).onerror = _t(function(m) {
            yn(m), a._reject(s.error);
          }), s.onabort = _t(function(m) {
            yn(m), a.active && a._reject(new ot.Abort(s.error)), a.active = !1, a.on("abort").fire(m);
          }), s.oncomplete = _t(function() {
            a.active = !1, a._resolve(), "mutatedParts" in s && Oe.storagemutated.fire(s.mutatedParts);
          });
        }
        return this;
      }, pe.prototype._promise = function(s, a, l) {
        var u, m = this;
        return s === "readwrite" && this.mode !== "readwrite" ? Dt(new ot.ReadOnly("Transaction is readonly")) : this.active ? this._locked() ? new J(function(p, g) {
          m._blockedFuncs.push([function() {
            m._promise(s, a, l).then(p, g);
          }, st]);
        }) : l ? De(function() {
          var p = new J(function(g, x) {
            m._lock();
            var T = a(g, x, m);
            T && T.then && T.then(g, x);
          });
          return p.finally(function() {
            return m._unlock();
          }), p._lib = !0, p;
        }) : ((u = new J(function(p, g) {
          var x = a(p, g, m);
          x && x.then && x.then(p, g);
        }))._lib = !0, u) : Dt(new ot.TransactionInactive());
      }, pe.prototype._root = function() {
        return this.parent ? this.parent._root() : this;
      }, pe.prototype.waitFor = function(s) {
        var a, l = this._root(), u = J.resolve(s), m = (l._waitingFor ? l._waitingFor = l._waitingFor.then(function() {
          return u;
        }) : (l._waitingFor = u, l._waitingQueue = [], a = l.idbtrans.objectStore(l.storeNames[0]), (function p() {
          for (++l._spinCount; l._waitingQueue.length; ) l._waitingQueue.shift()();
          l._waitingFor && (a.get(-1 / 0).onsuccess = p);
        })()), l._waitingFor);
        return new J(function(p, g) {
          u.then(function(x) {
            return l._waitingQueue.push(_t(p.bind(null, x)));
          }, function(x) {
            return l._waitingQueue.push(_t(g.bind(null, x)));
          }).finally(function() {
            l._waitingFor === m && (l._waitingFor = null);
          });
        });
      }, pe.prototype.abort = function() {
        this.active && (this.active = !1, this.idbtrans && this.idbtrans.abort(), this._reject(new ot.Abort()));
      }, pe.prototype.table = function(s) {
        var a = this._memoizedTables || (this._memoizedTables = {});
        if (v(a, s)) return a[s];
        var l = this.schema[s];
        if (l) return (l = new this.db.Table(s, l, this)).core = this.db.core.table(s), a[s] = l;
        throw new ot.NotFound("Table " + s + " not part of transaction");
      }, pe);
      function pe() {
      }
      function Qo(s, a, l, u, m, p, g, x) {
        return { name: s, keyPath: a, unique: l, multi: u, auto: m, compound: p, src: (l && !g ? "&" : "") + (u ? "*" : "") + (m ? "++" : "") + ec(a), type: x };
      }
      function ec(s) {
        return typeof s == "string" ? s : s ? "[" + [].join.call(s, "+") + "]" : "";
      }
      function Zo(s, a, l) {
        return { name: s, primKey: a, indexes: l, mappedClass: null, idxByName: (u = function(m) {
          return [m.name, m];
        }, l.reduce(function(m, p, g) {
          return p = u(p, g), p && (m[p[0]] = p[1]), m;
        }, {})) };
        var u;
      }
      var En = function(s) {
        try {
          return s.only([[]]), En = function() {
            return [[]];
          }, [[]];
        } catch {
          return En = function() {
            return or;
          }, or;
        }
      };
      function ta(s) {
        return s == null ? function() {
        } : typeof s == "string" ? (a = s).split(".").length === 1 ? function(l) {
          return l[a];
        } : function(l) {
          return F(l, a);
        } : function(l) {
          return F(l, s);
        };
        var a;
      }
      function rc(s) {
        return [].slice.call(s);
      }
      var Sp = 0;
      function _n(s) {
        return s == null ? ":id" : typeof s == "string" ? s : "[".concat(s.join("+"), "]");
      }
      function Ep(s, a, T) {
        function u(w) {
          if (w.type === 3) return null;
          if (w.type === 4) throw new Error("Cannot convert never type to IDBKeyRange");
          var S = w.lower, I = w.upper, A = w.lowerOpen, w = w.upperOpen;
          return S === void 0 ? I === void 0 ? null : a.upperBound(I, !!w) : I === void 0 ? a.lowerBound(S, !!A) : a.bound(S, I, !!A, !!w);
        }
        function m(k) {
          var S, I = k.name;
          return { name: I, schema: k, mutate: function(A) {
            var w = A.trans, _ = A.type, N = A.keys, M = A.values, R = A.range;
            return new Promise(function(U, j) {
              U = _t(U);
              var Y = w.objectStore(I), W = Y.keyPath == null, q = _ === "put" || _ === "add";
              if (!q && _ !== "delete" && _ !== "deleteRange") throw new Error("Invalid operation type: " + _);
              var et, Q = (N || M || { length: 1 }).length;
              if (N && M && N.length !== M.length) throw new Error("Given keys array must have same length as given values array.");
              if (Q === 0) return U({ numFailures: 0, failures: {}, results: [], lastResult: void 0 });
              function V(It) {
                ++gt, yn(It);
              }
              var nt = [], ht = [], gt = 0;
              if (_ === "deleteRange") {
                if (R.type === 4) return U({ numFailures: gt, failures: ht, results: [], lastResult: void 0 });
                R.type === 3 ? nt.push(et = Y.clear()) : nt.push(et = Y.delete(u(R)));
              } else {
                var W = q ? W ? [M, N] : [M, null] : [N, null], at = W[0], lt = W[1];
                if (q) for (var kt = 0; kt < Q; ++kt) nt.push(et = lt && lt[kt] !== void 0 ? Y[_](at[kt], lt[kt]) : Y[_](at[kt])), et.onerror = V;
                else for (kt = 0; kt < Q; ++kt) nt.push(et = Y[_](at[kt])), et.onerror = V;
              }
              function ae(It) {
                It = It.target.result, nt.forEach(function(cr, va) {
                  return cr.error != null && (ht[va] = cr.error);
                }), U({ numFailures: gt, failures: ht, results: _ === "delete" ? N : nt.map(function(cr) {
                  return cr.result;
                }), lastResult: It });
              }
              et.onerror = function(It) {
                V(It), ae(It);
              }, et.onsuccess = ae;
            });
          }, getMany: function(A) {
            var w = A.trans, _ = A.keys;
            return new Promise(function(N, M) {
              N = _t(N);
              for (var R, U = w.objectStore(I), j = _.length, Y = new Array(j), W = 0, q = 0, et = function(nt) {
                nt = nt.target, Y[nt._pos] = nt.result, ++q === W && N(Y);
              }, Q = he(M), V = 0; V < j; ++V) _[V] != null && ((R = U.get(_[V]))._pos = V, R.onsuccess = et, R.onerror = Q, ++W);
              W === 0 && N(Y);
            });
          }, get: function(A) {
            var w = A.trans, _ = A.key;
            return new Promise(function(N, M) {
              N = _t(N);
              var R = w.objectStore(I).get(_);
              R.onsuccess = function(U) {
                return N(U.target.result);
              }, R.onerror = he(M);
            });
          }, query: (S = x, function(A) {
            return new Promise(function(w, _) {
              w = _t(w);
              var N, M, R, q = A.trans, U = A.values, j = A.limit, W = A.query, Y = j === 1 / 0 ? void 0 : j, et = W.index, W = W.range, q = q.objectStore(I), q = et.isPrimaryKey ? q : q.index(et.name), et = u(W);
              if (j === 0) return w({ result: [] });
              S ? ((W = U ? q.getAll(et, Y) : q.getAllKeys(et, Y)).onsuccess = function(Q) {
                return w({ result: Q.target.result });
              }, W.onerror = he(_)) : (N = 0, M = !U && "openKeyCursor" in q ? q.openKeyCursor(et) : q.openCursor(et), R = [], M.onsuccess = function(Q) {
                var V = M.result;
                return !V || (R.push(U ? V.value : V.primaryKey), ++N === j) ? w({ result: R }) : void V.continue();
              }, M.onerror = he(_));
            });
          }), openCursor: function(A) {
            var w = A.trans, _ = A.values, N = A.query, M = A.reverse, R = A.unique;
            return new Promise(function(U, j) {
              U = _t(U);
              var q = N.index, Y = N.range, W = w.objectStore(I), W = q.isPrimaryKey ? W : W.index(q.name), q = M ? R ? "prevunique" : "prev" : R ? "nextunique" : "next", et = !_ && "openKeyCursor" in W ? W.openKeyCursor(u(Y), q) : W.openCursor(u(Y), q);
              et.onerror = he(j), et.onsuccess = _t(function(Q) {
                var V, nt, ht, gt, at = et.result;
                at ? (at.___id = ++Sp, at.done = !1, V = at.continue.bind(at), nt = (nt = at.continuePrimaryKey) && nt.bind(at), ht = at.advance.bind(at), gt = function() {
                  throw new Error("Cursor not stopped");
                }, at.trans = w, at.stop = at.continue = at.continuePrimaryKey = at.advance = function() {
                  throw new Error("Cursor not started");
                }, at.fail = _t(j), at.next = function() {
                  var lt = this, kt = 1;
                  return this.start(function() {
                    return kt-- ? lt.continue() : lt.stop();
                  }).then(function() {
                    return lt;
                  });
                }, at.start = function(lt) {
                  function kt() {
                    if (et.result) try {
                      lt();
                    } catch (It) {
                      at.fail(It);
                    }
                    else at.done = !0, at.start = function() {
                      throw new Error("Cursor behind last entry");
                    }, at.stop();
                  }
                  var ae = new Promise(function(It, cr) {
                    It = _t(It), et.onerror = he(cr), at.fail = cr, at.stop = function(va) {
                      at.stop = at.continue = at.continuePrimaryKey = at.advance = gt, It(va);
                    };
                  });
                  return et.onsuccess = _t(function(It) {
                    et.onsuccess = kt, kt();
                  }), at.continue = V, at.continuePrimaryKey = nt, at.advance = ht, kt(), ae;
                }, U(at)) : U(null);
              }, j);
            });
          }, count: function(A) {
            var w = A.query, _ = A.trans, N = w.index, M = w.range;
            return new Promise(function(R, U) {
              var j = _.objectStore(I), j = N.isPrimaryKey ? j : j.index(N.name), Y = u(M), Y = Y ? j.count(Y) : j.count();
              Y.onsuccess = _t(function(W) {
                return R(W.target.result);
              }), Y.onerror = he(U);
            });
          } };
        }
        p = T, g = rc((T = s).objectStoreNames);
        var p, T = { schema: { name: T.name, tables: g.map(function(k) {
          return p.objectStore(k);
        }).map(function(k) {
          var S = k.keyPath, I = k.autoIncrement, w = d(S), A = {}, w = { name: k.name, primaryKey: { name: null, isPrimaryKey: !0, outbound: S == null, compound: w, keyPath: S, autoIncrement: I, unique: !0, extractKey: ta(S) }, indexes: rc(k.indexNames).map(function(_) {
            return k.index(_);
          }).map(function(R) {
            var U = R.name, N = R.unique, M = R.multiEntry, R = R.keyPath, U = { name: U, compound: d(R), keyPath: R, unique: N, multiEntry: M, extractKey: ta(R) };
            return A[_n(R)] = U;
          }), getIndexByKeyPath: function(_) {
            return A[_n(_)];
          } };
          return A[":id"] = w.primaryKey, S != null && (A[_n(S)] = w.primaryKey), w;
        }) }, hasGetAll: 0 < g.length && "getAll" in p.objectStore(g[0]) && !(typeof navigator < "u" && /Safari/.test(navigator.userAgent) && !/(Chrome\/|Edge\/)/.test(navigator.userAgent) && [].concat(navigator.userAgent.match(/Safari\/(\d*)/))[1] < 604) }, g = T.schema, x = T.hasGetAll, T = g.tables.map(m), C = {};
        return T.forEach(function(k) {
          return C[k.name] = k;
        }), { stack: "dbcore", transaction: s.transaction.bind(s), table: function(k) {
          if (C[k]) return C[k];
          throw new Error("Table '".concat(k, "' not found"));
        }, MIN_KEY: -1 / 0, MAX_KEY: En(a), schema: g };
      }
      function _p(s, a, l, u) {
        return l = l.IDBKeyRange, a = Ep(a, l, u), { dbcore: s.dbcore.reduce(function(m, p) {
          return p = p.create, n(n({}, m), p(m));
        }, a) };
      }
      function bs(s, a) {
        var l = a.db, l = _p(s._middlewares, l, s._deps, a);
        s.core = l.dbcore, s.tables.forEach(function(u) {
          var m = u.name;
          s.core.schema.tables.some(function(p) {
            return p.name === m;
          }) && (u.core = s.core.table(m), s[m] instanceof s.Table) && (s[m].core = u.core);
        });
      }
      function vs(s, a, l, u) {
        l.forEach(function(m) {
          var p = u[m];
          a.forEach(function(g) {
            var x = (function T(C, k) {
              return L(C, k) || (C = f(C)) && T(C, k);
            })(g, m);
            (!x || "value" in x && x.value === void 0) && (g === s.Transaction.prototype || g instanceof s.Transaction ? $(g, m, { get: function() {
              return this.table(m);
            }, set: function(T) {
              y(this, m, { value: T, writable: !0, configurable: !0, enumerable: !0 });
            } }) : g[m] = new s.Table(m, p));
          });
        });
      }
      function ea(s, a) {
        a.forEach(function(l) {
          for (var u in l) l[u] instanceof s.Table && delete l[u];
        });
      }
      function Tp(s, a) {
        return s._cfg.version - a._cfg.version;
      }
      function kp(s, a, l, u) {
        var m = s._dbSchema, p = (l.objectStoreNames.contains("$meta") && !m.$meta && (m.$meta = Zo("$meta", sc("")[0], []), s._storeNames.push("$meta")), s._createTransaction("readwrite", s._storeNames, m)), g = (p.create(l), p._completion.catch(u), p._reject.bind(p)), x = st.transless || st;
        De(function() {
          if (st.trans = p, st.transless = x, a !== 0) return bs(s, l), C = a, ((T = p).storeNames.includes("$meta") ? T.table("$meta").get("version").then(function(k) {
            return k ?? C;
          }) : J.resolve(C)).then(function(N) {
            var S = s, I = N, A = p, w = l, _ = [], N = S._versions, M = S._dbSchema = ys(0, S.idbdb, w);
            return (N = N.filter(function(R) {
              return R._cfg.version >= I;
            })).length === 0 ? J.resolve() : (N.forEach(function(R) {
              _.push(function() {
                var U, j, Y, W = M, q = R._cfg.dbschema, et = (Ss(S, W, w), Ss(S, q, w), M = S._dbSchema = q, ra(W, q)), Q = (et.add.forEach(function(V) {
                  na(w, V[0], V[1].primKey, V[1].indexes);
                }), et.change.forEach(function(V) {
                  if (V.recreate) throw new ot.Upgrade("Not yet support for changing primary key");
                  var nt = w.objectStore(V.name);
                  V.add.forEach(function(ht) {
                    return xs(nt, ht);
                  }), V.change.forEach(function(ht) {
                    nt.deleteIndex(ht.name), xs(nt, ht);
                  }), V.del.forEach(function(ht) {
                    return nt.deleteIndex(ht);
                  });
                }), R._cfg.contentUpgrade);
                if (Q && R._cfg.version > I) return bs(S, w), A._memoizedTables = {}, U = Z(q), et.del.forEach(function(V) {
                  U[V] = W[V];
                }), ea(S, [S.Transaction.prototype]), vs(S, [S.Transaction.prototype], c(U), U), A.schema = U, (j = oe(Q)) && Nr(), q = J.follow(function() {
                  var V;
                  (Y = Q(A)) && j && (V = Ne.bind(null, null), Y.then(V, V));
                }), Y && typeof Y.then == "function" ? J.resolve(Y) : q.then(function() {
                  return Y;
                });
              }), _.push(function(U) {
                var j, Y, W = R._cfg.dbschema;
                j = W, Y = U, [].slice.call(Y.db.objectStoreNames).forEach(function(q) {
                  return j[q] == null && Y.db.deleteObjectStore(q);
                }), ea(S, [S.Transaction.prototype]), vs(S, [S.Transaction.prototype], S._storeNames, S._dbSchema), A.schema = S._dbSchema;
              }), _.push(function(U) {
                S.idbdb.objectStoreNames.contains("$meta") && (Math.ceil(S.idbdb.version / 10) === R._cfg.version ? (S.idbdb.deleteObjectStore("$meta"), delete S._dbSchema.$meta, S._storeNames = S._storeNames.filter(function(j) {
                  return j !== "$meta";
                })) : U.objectStore("$meta").put(R._cfg.version, "version"));
              });
            }), (function R() {
              return _.length ? J.resolve(_.shift()(A.idbtrans)).then(R) : J.resolve();
            })().then(function() {
              nc(M, w);
            }));
          }).catch(g);
          var T, C;
          c(m).forEach(function(k) {
            na(l, k, m[k].primKey, m[k].indexes);
          }), bs(s, l), J.follow(function() {
            return s.on.populate.fire(p);
          }).catch(g);
        });
      }
      function wp(s, a) {
        nc(s._dbSchema, a), a.db.version % 10 != 0 || a.objectStoreNames.contains("$meta") || a.db.createObjectStore("$meta").add(Math.ceil(a.db.version / 10 - 1), "version");
        var l = ys(0, s.idbdb, a);
        Ss(s, s._dbSchema, a);
        for (var u = 0, m = ra(l, s._dbSchema).change; u < m.length; u++) {
          var p = ((g) => {
            if (g.change.length || g.recreate) return console.warn("Unable to patch indexes of table ".concat(g.name, " because it has changes on the type of index or primary key.")), { value: void 0 };
            var x = a.objectStore(g.name);
            g.add.forEach(function(T) {
              me && console.debug("Dexie upgrade patch: Creating missing index ".concat(g.name, ".").concat(T.src)), xs(x, T);
            });
          })(m[u]);
          if (typeof p == "object") return p.value;
        }
      }
      function ra(s, a) {
        var l, u = { del: [], add: [], change: [] };
        for (l in s) a[l] || u.del.push(l);
        for (l in a) {
          var m = s[l], p = a[l];
          if (m) {
            var g = { name: l, def: p, recreate: !1, del: [], add: [], change: [] };
            if ("" + (m.primKey.keyPath || "") != "" + (p.primKey.keyPath || "") || m.primKey.auto !== p.primKey.auto) g.recreate = !0, u.change.push(g);
            else {
              var x = m.idxByName, T = p.idxByName, C = void 0;
              for (C in x) T[C] || g.del.push(C);
              for (C in T) {
                var k = x[C], S = T[C];
                k ? k.src !== S.src && g.change.push(S) : g.add.push(S);
              }
              (0 < g.del.length || 0 < g.add.length || 0 < g.change.length) && u.change.push(g);
            }
          } else u.add.push([l, p]);
        }
        return u;
      }
      function na(s, a, l, u) {
        var m = s.db.createObjectStore(a, l.keyPath ? { keyPath: l.keyPath, autoIncrement: l.auto } : { autoIncrement: l.auto });
        u.forEach(function(p) {
          return xs(m, p);
        });
      }
      function nc(s, a) {
        c(s).forEach(function(l) {
          a.db.objectStoreNames.contains(l) || (me && console.debug("Dexie: Creating missing table", l), na(a, l, s[l].primKey, s[l].indexes));
        });
      }
      function xs(s, a) {
        s.createIndex(a.name, a.keyPath, { unique: a.unique, multiEntry: a.multi });
      }
      function ys(s, a, l) {
        var u = {};
        return G(a.objectStoreNames, 0).forEach(function(m) {
          for (var p = l.objectStore(m), g = Qo(ec(C = p.keyPath), C || "", !0, !1, !!p.autoIncrement, C && typeof C != "string", !0), x = [], T = 0; T < p.indexNames.length; ++T) {
            var k = p.index(p.indexNames[T]), C = k.keyPath, k = Qo(k.name, C, !!k.unique, !!k.multiEntry, !1, C && typeof C != "string", !1);
            x.push(k);
          }
          u[m] = Zo(m, g, x);
        }), u;
      }
      function Ss(s, a, l) {
        for (var u = l.db.objectStoreNames, m = 0; m < u.length; ++m) {
          var p = u[m], g = l.objectStore(p);
          s._hasGetAll = "getAll" in g;
          for (var x = 0; x < g.indexNames.length; ++x) {
            var T, C = g.indexNames[x], k = g.index(C).keyPath, k = typeof k == "string" ? k : "[" + G(k).join("+") + "]";
            a[p] && (T = a[p].idxByName[k]) && (T.name = C, delete a[p].idxByName[k], a[p].idxByName[C] = T);
          }
        }
        typeof navigator < "u" && /Safari/.test(navigator.userAgent) && !/(Chrome\/|Edge\/)/.test(navigator.userAgent) && i.WorkerGlobalScope && i instanceof i.WorkerGlobalScope && [].concat(navigator.userAgent.match(/Safari\/(\d*)/))[1] < 604 && (s._hasGetAll = !1);
      }
      function sc(s) {
        return s.split(",").map(function(a, l) {
          var m = a.split(":"), u = (u = m[1]) == null ? void 0 : u.trim(), m = (a = m[0].trim()).replace(/([&*]|\+\+)/g, ""), p = /^\[/.test(m) ? m.match(/^\[(.*)\]$/)[1].split("+") : m;
          return Qo(m, p || null, /\&/.test(a), /\*/.test(a), /\+\+/.test(a), d(p), l === 0, u);
        });
      }
      Pr.prototype._createTableSchema = Zo, Pr.prototype._parseIndexSyntax = sc, Pr.prototype._parseStoresSpec = function(s, a) {
        var l = this;
        c(s).forEach(function(u) {
          if (s[u] !== null) {
            var m = l._parseIndexSyntax(s[u]), p = m.shift();
            if (!p) throw new ot.Schema("Invalid schema for table " + u + ": " + s[u]);
            if (p.unique = !0, p.multi) throw new ot.Schema("Primary key cannot be multiEntry*");
            m.forEach(function(g) {
              if (g.auto) throw new ot.Schema("Only primary key can be marked as autoIncrement (++)");
              if (!g.keyPath) throw new ot.Schema("Index must have a name and cannot be an empty string");
            }), p = l._createTableSchema(u, p, m), a[u] = p;
          }
        });
      }, Pr.prototype.stores = function(l) {
        var a = this.db, l = (this._cfg.storesSource = this._cfg.storesSource ? h(this._cfg.storesSource, l) : l, a._versions), u = {}, m = {};
        return l.forEach(function(p) {
          h(u, p._cfg.storesSource), m = p._cfg.dbschema = {}, p._parseStoresSpec(u, m);
        }), a._dbSchema = m, ea(a, [a._allTables, a, a.Transaction.prototype]), vs(a, [a._allTables, a, a.Transaction.prototype, this._cfg.tables], c(m), m), a._storeNames = c(m), this;
      }, Pr.prototype.upgrade = function(s) {
        return this._cfg.contentUpgrade = Bo(this._cfg.contentUpgrade || xt, s), this;
      };
      var Ip = Pr;
      function Pr() {
      }
      function sa(s, a) {
        var l = s._dbNamesDB;
        return l || (l = s._dbNamesDB = new _e(ds, { addons: [], indexedDB: s, IDBKeyRange: a })).version(1).stores({ dbnames: "name" }), l.table("dbnames");
      }
      function oa(s) {
        return s && typeof s.databases == "function";
      }
      function aa(s) {
        return De(function() {
          return st.letThrough = !0, s();
        });
      }
      function ia(s) {
        return !("from" in s);
      }
      var jt = function(s, a) {
        var l;
        if (!this) return l = new jt(), s && "d" in s && h(l, s), l;
        h(this, arguments.length ? { d: 1, from: s, to: 1 < arguments.length ? a : s } : { d: 0 });
      };
      function Tn(s, a, l) {
        var u = mt(a, l);
        if (!isNaN(u)) {
          if (0 < u) throw RangeError();
          if (ia(s)) return h(s, { from: a, to: l, d: 1 });
          var u = s.l, m = s.r;
          if (mt(l, s.from) < 0) return u ? Tn(u, a, l) : s.l = { from: a, to: l, d: 1, l: null, r: null }, ac(s);
          if (0 < mt(a, s.to)) return m ? Tn(m, a, l) : s.r = { from: a, to: l, d: 1, l: null, r: null }, ac(s);
          mt(a, s.from) < 0 && (s.from = a, s.l = null, s.d = m ? m.d + 1 : 1), 0 < mt(l, s.to) && (s.to = l, s.r = null, s.d = s.l ? s.l.d + 1 : 1), a = !s.r, u && !s.l && kn(s, u), m && a && kn(s, m);
        }
      }
      function kn(s, a) {
        ia(a) || (function l(u, m) {
          var p = m.from, g = m.l, x = m.r;
          Tn(u, p, m.to), g && l(u, g), x && l(u, x);
        })(s, a);
      }
      function oc(s, a) {
        var l = Es(a), u = l.next();
        if (!u.done) for (var m = u.value, p = Es(s), g = p.next(m.from), x = g.value; !u.done && !g.done; ) {
          if (mt(x.from, m.to) <= 0 && 0 <= mt(x.to, m.from)) return !0;
          mt(m.from, x.from) < 0 ? m = (u = l.next(x.from)).value : x = (g = p.next(m.from)).value;
        }
        return !1;
      }
      function Es(s) {
        var a = ia(s) ? null : { s: 0, n: s };
        return { next: function(l) {
          for (var u = 0 < arguments.length; a; ) switch (a.s) {
            case 0:
              if (a.s = 1, u) for (; a.n.l && mt(l, a.n.from) < 0; ) a = { up: a, n: a.n.l, s: 1 };
              else for (; a.n.l; ) a = { up: a, n: a.n.l, s: 1 };
            case 1:
              if (a.s = 2, !u || mt(l, a.n.to) <= 0) return { value: a.n, done: !1 };
            case 2:
              if (a.n.r) {
                a.s = 3, a = { up: a, n: a.n.r, s: 0 };
                continue;
              }
            case 3:
              a = a.up;
          }
          return { done: !0 };
        } };
      }
      function ac(s) {
        var a, l, u, m = (((m = s.r) == null ? void 0 : m.d) || 0) - (((m = s.l) == null ? void 0 : m.d) || 0), m = 1 < m ? "r" : m < -1 ? "l" : "";
        m && (a = m == "r" ? "l" : "r", l = n({}, s), u = s[m], s.from = u.from, s.to = u.to, s[m] = u[m], l[m] = u[a], (s[a] = l).d = ic(l)), s.d = ic(s);
      }
      function ic(l) {
        var a = l.r, l = l.l;
        return (a ? l ? Math.max(a.d, l.d) : a.d : l ? l.d : 0) + 1;
      }
      function _s(s, a) {
        return c(a).forEach(function(l) {
          s[l] ? kn(s[l], a[l]) : s[l] = (function u(m) {
            var p, g, x = {};
            for (p in m) v(m, p) && (g = m[p], x[p] = !g || typeof g != "object" || tt.has(g.constructor) ? g : u(g));
            return x;
          })(a[l]);
        }), s;
      }
      function la(s, a) {
        return s.all || a.all || Object.keys(s).some(function(l) {
          return a[l] && oc(a[l], s[l]);
        });
      }
      E(jt.prototype, ((te = { add: function(s) {
        return kn(this, s), this;
      }, addKey: function(s) {
        return Tn(this, s, s), this;
      }, addKeys: function(s) {
        var a = this;
        return s.forEach(function(l) {
          return Tn(a, l, l);
        }), this;
      }, hasKey: function(s) {
        var a = Es(this).next(s).value;
        return a && mt(a.from, s) <= 0 && 0 <= mt(a.to, s);
      } })[pt] = function() {
        return Es(this);
      }, te));
      var ir = {}, ca = {}, ua = !1;
      function Ts(s) {
        _s(ca, s), ua || (ua = !0, setTimeout(function() {
          ua = !1, da(ca, !(ca = {}));
        }, 0));
      }
      function da(s, a) {
        a === void 0 && (a = !1);
        var l = /* @__PURE__ */ new Set();
        if (s.all) for (var u = 0, m = Object.values(ir); u < m.length; u++) lc(x = m[u], s, l, a);
        else for (var p in s) {
          var g, x, p = /^idb\:\/\/(.*)\/(.*)\//.exec(p);
          p && (g = p[1], p = p[2], x = ir["idb://".concat(g, "/").concat(p)]) && lc(x, s, l, a);
        }
        l.forEach(function(T) {
          return T();
        });
      }
      function lc(s, a, l, u) {
        for (var m = [], p = 0, g = Object.entries(s.queries.query); p < g.length; p++) {
          for (var x = g[p], T = x[0], C = [], k = 0, S = x[1]; k < S.length; k++) {
            var I = S[k];
            la(a, I.obsSet) ? I.subscribers.forEach(function(N) {
              return l.add(N);
            }) : u && C.push(I);
          }
          u && m.push([T, C]);
        }
        if (u) for (var A = 0, w = m; A < w.length; A++) {
          var _ = w[A], T = _[0], C = _[1];
          s.queries.query[T] = C;
        }
      }
      function Ap(s) {
        var a = s._state, l = s._deps.indexedDB;
        if (a.isBeingOpened || s.idbdb) return a.dbReadyPromise.then(function() {
          return a.dbOpenError ? Dt(a.dbOpenError) : s;
        });
        a.isBeingOpened = !0, a.dbOpenError = null, a.openComplete = !1;
        var u = a.openCanceller, m = Math.round(10 * s.verno), p = !1;
        function g() {
          if (a.openCanceller !== u) throw new ot.DatabaseClosed("db.open() was cancelled");
        }
        function x() {
          return new J(function(I, A) {
            if (g(), !l) throw new ot.MissingAPI();
            var w = s.name, _ = a.autoSchema || !m ? l.open(w) : l.open(w, m);
            if (!_) throw new ot.MissingAPI();
            _.onerror = he(A), _.onblocked = _t(s._fireOnBlocked), _.onupgradeneeded = _t(function(N) {
              var M;
              k = _.transaction, a.autoSchema && !s._options.allowEmptyDB ? (_.onerror = yn, k.abort(), _.result.close(), (M = l.deleteDatabase(w)).onsuccess = M.onerror = _t(function() {
                A(new ot.NoSuchDatabase("Database ".concat(w, " doesnt exist")));
              })) : (k.onerror = he(A), M = N.oldVersion > Math.pow(2, 62) ? 0 : N.oldVersion, S = M < 1, s.idbdb = _.result, p && wp(s, k), kp(s, M / 10, k, A));
            }, A), _.onsuccess = _t(function() {
              k = null;
              var N, M, R, U, j, Y, W = s.idbdb = _.result, q = G(W.objectStoreNames);
              if (0 < q.length) try {
                var et = W.transaction((j = q).length === 1 ? j[0] : j, "readonly");
                if (a.autoSchema) Y = W, U = et, (R = s).verno = Y.version / 10, U = R._dbSchema = ys(0, Y, U), R._storeNames = G(Y.objectStoreNames, 0), vs(R, [R._allTables], c(U), U);
                else if (Ss(s, s._dbSchema, et), M = et, ((M = ra(ys(0, (N = s).idbdb, M), N._dbSchema)).add.length || M.change.some(function(Q) {
                  return Q.add.length || Q.change.length;
                })) && !p) return console.warn("Dexie SchemaDiff: Schema was extended without increasing the number passed to db.version(). Dexie will add missing parts and increment native version number to workaround this."), W.close(), m = W.version + 1, p = !0, I(x());
                bs(s, et);
              } catch {
              }
              Lr.push(s), W.onversionchange = _t(function(Q) {
                a.vcFired = !0, s.on("versionchange").fire(Q);
              }), W.onclose = _t(function() {
                s.close({ disableAutoOpen: !1 });
              }), S && (q = s._deps, j = w, oa(Y = q.indexedDB) || j === ds || sa(Y, q.IDBKeyRange).put({ name: j }).catch(xt)), I();
            }, A);
          }).catch(function(I) {
            switch (I?.name) {
              case "UnknownError":
                if (0 < a.PR1398_maxLoop) return a.PR1398_maxLoop--, console.warn("Dexie: Workaround for Chrome UnknownError on open()"), x();
                break;
              case "VersionError":
                if (0 < m) return m = 0, x();
            }
            return J.reject(I);
          });
        }
        var T, C = a.dbReadyResolve, k = null, S = !1;
        return J.race([u, (typeof navigator > "u" ? J.resolve() : !navigator.userAgentData && /Safari\//.test(navigator.userAgent) && !/Chrom(e|ium)\//.test(navigator.userAgent) && indexedDB.databases ? new Promise(function(I) {
          function A() {
            return indexedDB.databases().finally(I);
          }
          T = setInterval(A, 100), A();
        }).finally(function() {
          return clearInterval(T);
        }) : Promise.resolve()).then(x)]).then(function() {
          return g(), a.onReadyBeingFired = [], J.resolve(aa(function() {
            return s.on.ready.fire(s.vip);
          })).then(function I() {
            var A;
            if (0 < a.onReadyBeingFired.length) return A = a.onReadyBeingFired.reduce(Bo, xt), a.onReadyBeingFired = [], J.resolve(aa(function() {
              return A(s.vip);
            })).then(I);
          });
        }).finally(function() {
          a.openCanceller === u && (a.onReadyBeingFired = null, a.isBeingOpened = !1);
        }).catch(function(I) {
          a.dbOpenError = I;
          try {
            k && k.abort();
          } catch {
          }
          return u === a.openCanceller && s._close(), Dt(I);
        }).finally(function() {
          a.openComplete = !0, C();
        }).then(function() {
          var I;
          return S && (I = {}, s.tables.forEach(function(A) {
            A.schema.indexes.forEach(function(w) {
              w.name && (I["idb://".concat(s.name, "/").concat(A.name, "/").concat(w.name)] = new jt(-1 / 0, [[[]]]));
            }), I["idb://".concat(s.name, "/").concat(A.name, "/")] = I["idb://".concat(s.name, "/").concat(A.name, "/:dels")] = new jt(-1 / 0, [[[]]]);
          }), Oe(Sn).fire(I), da(I, !0)), s;
        });
      }
      function ma(s) {
        function a(p) {
          return s.next(p);
        }
        var l = m(a), u = m(function(p) {
          return s.throw(p);
        });
        function m(p) {
          return function(x) {
            var x = p(x), T = x.value;
            return x.done ? T : T && typeof T.then == "function" ? T.then(l, u) : d(T) ? Promise.all(T).then(l, u) : l(T);
          };
        }
        return m(a)();
      }
      function ks(s, a, l) {
        for (var u = d(s) ? s.slice() : [s], m = 0; m < l; ++m) u.push(a);
        return u;
      }
      var $p = { stack: "dbcore", name: "VirtualIndexMiddleware", level: 1, create: function(s) {
        return n(n({}, s), { table: function(u) {
          var l = s.table(u), u = l.schema, m = {}, p = [];
          function g(I, A, w) {
            var R = _n(I), _ = m[R] = m[R] || [], N = I == null ? 0 : typeof I == "string" ? 1 : I.length, M = 0 < A, R = n(n({}, w), { name: M ? "".concat(R, "(virtual-from:").concat(w.name, ")") : w.name, lowLevelIndex: w, isVirtual: M, keyTail: A, keyLength: N, extractKey: ta(I), unique: !M && w.unique });
            return _.push(R), R.isPrimaryKey || p.push(R), 1 < N && g(N === 2 ? I[0] : I.slice(0, N - 1), A + 1, w), _.sort(function(U, j) {
              return U.keyTail - j.keyTail;
            }), R;
          }
          var x = g(u.primaryKey.keyPath, 0, u.primaryKey);
          m[":id"] = [x];
          for (var T = 0, C = u.indexes; T < C.length; T++) {
            var k = C[T];
            g(k.keyPath, 0, k);
          }
          function S(I) {
            var A, w = I.query.index;
            return w.isVirtual ? n(n({}, I), { query: { index: w.lowLevelIndex, range: (A = I.query.range, w = w.keyTail, { type: A.type === 1 ? 2 : A.type, lower: ks(A.lower, A.lowerOpen ? s.MAX_KEY : s.MIN_KEY, w), lowerOpen: !0, upper: ks(A.upper, A.upperOpen ? s.MIN_KEY : s.MAX_KEY, w), upperOpen: !0 }) } }) : I;
          }
          return n(n({}, l), { schema: n(n({}, u), { primaryKey: x, indexes: p, getIndexByKeyPath: function(I) {
            return (I = m[_n(I)]) && I[0];
          } }), count: function(I) {
            return l.count(S(I));
          }, query: function(I) {
            return l.query(S(I));
          }, openCursor: function(I) {
            var A = I.query.index, w = A.keyTail, _ = A.keyLength;
            return A.isVirtual ? l.openCursor(S(I)).then(function(M) {
              return M && N(M);
            }) : l.openCursor(I);
            function N(M) {
              return Object.create(M, { continue: { value: function(R) {
                R != null ? M.continue(ks(R, I.reverse ? s.MAX_KEY : s.MIN_KEY, w)) : I.unique ? M.continue(M.key.slice(0, _).concat(I.reverse ? s.MIN_KEY : s.MAX_KEY, w)) : M.continue();
              } }, continuePrimaryKey: { value: function(R, U) {
                M.continuePrimaryKey(ks(R, s.MAX_KEY, w), U);
              } }, primaryKey: { get: function() {
                return M.primaryKey;
              } }, key: { get: function() {
                var R = M.key;
                return _ === 1 ? R[0] : R.slice(0, _);
              } }, value: { get: function() {
                return M.value;
              } } });
            }
          } });
        } });
      } };
      function ha(s, a, l, u) {
        return l = l || {}, u = u || "", c(s).forEach(function(m) {
          var p, g, x;
          v(a, m) ? (p = s[m], g = a[m], typeof p == "object" && typeof g == "object" && p && g ? (x = Rt(p)) !== Rt(g) ? l[u + m] = a[m] : x === "Object" ? ha(p, g, l, u + m + ".") : p !== g && (l[u + m] = a[m]) : p !== g && (l[u + m] = a[m])) : l[u + m] = void 0;
        }), c(a).forEach(function(m) {
          v(s, m) || (l[u + m] = a[m]);
        }), l;
      }
      function pa(s, a) {
        return a.type === "delete" ? a.keys : a.keys || a.values.map(s.extractKey);
      }
      var Rp = { stack: "dbcore", name: "HooksMiddleware", level: 2, create: function(s) {
        return n(n({}, s), { table: function(a) {
          var l = s.table(a), u = l.schema.primaryKey;
          return n(n({}, l), { mutate: function(m) {
            var p = st.trans, g = p.table(a).hook, x = g.deleting, T = g.creating, C = g.updating;
            switch (m.type) {
              case "add":
                if (T.fire === xt) break;
                return p._promise("readwrite", function() {
                  return k(m);
                }, !0);
              case "put":
                if (T.fire === xt && C.fire === xt) break;
                return p._promise("readwrite", function() {
                  return k(m);
                }, !0);
              case "delete":
                if (x.fire === xt) break;
                return p._promise("readwrite", function() {
                  return k(m);
                }, !0);
              case "deleteRange":
                if (x.fire === xt) break;
                return p._promise("readwrite", function() {
                  return (function S(I, A, w) {
                    return l.query({ trans: I, values: !1, query: { index: u, range: A }, limit: w }).then(function(_) {
                      var N = _.result;
                      return k({ type: "delete", keys: N, trans: I }).then(function(M) {
                        return 0 < M.numFailures ? Promise.reject(M.failures[0]) : N.length < w ? { failures: [], numFailures: 0, lastResult: void 0 } : S(I, n(n({}, A), { lower: N[N.length - 1], lowerOpen: !0 }), w);
                      });
                    });
                  })(m.trans, m.range, 1e4);
                }, !0);
            }
            return l.mutate(m);
            function k(S) {
              var I, A, w, _ = st.trans, N = S.keys || pa(u, S);
              if (N) return (S = S.type === "add" || S.type === "put" ? n(n({}, S), { keys: N }) : n({}, S)).type !== "delete" && (S.values = o([], S.values)), S.keys && (S.keys = o([], S.keys)), I = l, w = N, ((A = S).type === "add" ? Promise.resolve([]) : I.getMany({ trans: A.trans, keys: w, cache: "immutable" })).then(function(M) {
                var R = N.map(function(U, j) {
                  var Y, W, q, et = M[j], Q = { onerror: null, onsuccess: null };
                  return S.type === "delete" ? x.fire.call(Q, U, et, _) : S.type === "add" || et === void 0 ? (Y = T.fire.call(Q, U, S.values[j], _), U == null && Y != null && (S.keys[j] = U = Y, u.outbound || z(S.values[j], u.keyPath, U))) : (Y = ha(et, S.values[j]), (W = C.fire.call(Q, Y, U, et, _)) && (q = S.values[j], Object.keys(W).forEach(function(V) {
                    v(q, V) ? q[V] = W[V] : z(q, V, W[V]);
                  }))), Q;
                });
                return l.mutate(S).then(function(U) {
                  for (var j = U.failures, Y = U.results, W = U.numFailures, U = U.lastResult, q = 0; q < N.length; ++q) {
                    var et = (Y || N)[q], Q = R[q];
                    et == null ? Q.onerror && Q.onerror(j[q]) : Q.onsuccess && Q.onsuccess(S.type === "put" && M[q] ? S.values[q] : et);
                  }
                  return { failures: j, results: Y, numFailures: W, lastResult: U };
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
      } };
      function cc(s, a, l) {
        try {
          if (!a || a.keys.length < s.length) return null;
          for (var u = [], m = 0, p = 0; m < a.keys.length && p < s.length; ++m) mt(a.keys[m], s[p]) === 0 && (u.push(l ? dt(a.values[m]) : a.values[m]), ++p);
          return u.length === s.length ? u : null;
        } catch {
          return null;
        }
      }
      var Cp = { stack: "dbcore", level: -1, create: function(s) {
        return { table: function(a) {
          var l = s.table(a);
          return n(n({}, l), { getMany: function(u) {
            var m;
            return u.cache ? (m = cc(u.keys, u.trans._cache, u.cache === "clone")) ? J.resolve(m) : l.getMany(u).then(function(p) {
              return u.trans._cache = { keys: u.keys, values: u.cache === "clone" ? dt(p) : p }, p;
            }) : l.getMany(u);
          }, mutate: function(u) {
            return u.type !== "add" && (u.trans._cache = null), l.mutate(u);
          } });
        } };
      } };
      function uc(s, a) {
        return s.trans.mode === "readonly" && !!s.subscr && !s.trans.explicit && s.trans.db._options.cache !== "disabled" && !a.schema.primaryKey.outbound;
      }
      function dc(s, a) {
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
      var Dp = { stack: "dbcore", level: 0, name: "Observability", create: function(s) {
        var a = s.schema.name, l = new jt(s.MIN_KEY, s.MAX_KEY);
        return n(n({}, s), { transaction: function(u, m, p) {
          if (st.subscr && m !== "readonly") throw new ot.ReadOnly("Readwrite transaction in liveQuery context. Querier source: ".concat(st.querier));
          return s.transaction(u, m, p);
        }, table: function(u) {
          function m(N) {
            var _, N = N.query;
            return [_ = N.index, new jt((_ = (N = N.range).lower) != null ? _ : s.MIN_KEY, (_ = N.upper) != null ? _ : s.MAX_KEY)];
          }
          var p = s.table(u), g = p.schema, x = g.primaryKey, T = g.indexes, C = x.extractKey, k = x.outbound, S = x.autoIncrement && T.filter(function(w) {
            return w.compound && w.keyPath.includes(x.keyPath);
          }), I = n(n({}, p), { mutate: function(w) {
            function _(nt) {
              return nt = "idb://".concat(a, "/").concat(u, "/").concat(nt), j[nt] || (j[nt] = new jt());
            }
            var N, M, R, U = w.trans, j = w.mutatedParts || (w.mutatedParts = {}), Y = _(""), W = _(":dels"), q = w.type, Q = w.type === "deleteRange" ? [w.range] : w.type === "delete" ? [w.keys] : w.values.length < 50 ? [pa(x, w).filter(function(nt) {
              return nt;
            }), w.values] : [], et = Q[0], Q = Q[1], V = w.trans._cache;
            return d(et) ? (Y.addKeys(et), (q = q === "delete" || et.length === Q.length ? cc(et, V) : null) || W.addKeys(et), (q || Q) && (N = _, M = q, R = Q, g.indexes.forEach(function(nt) {
              var ht = N(nt.name || "");
              function gt(lt) {
                return lt != null ? nt.extractKey(lt) : null;
              }
              function at(lt) {
                nt.multiEntry && d(lt) ? lt.forEach(function(kt) {
                  return ht.addKey(kt);
                }) : ht.addKey(lt);
              }
              (M || R).forEach(function(lt, It) {
                var ae = M && gt(M[It]), It = R && gt(R[It]);
                mt(ae, It) !== 0 && (ae != null && at(ae), It != null) && at(It);
              });
            }))) : et ? (Q = { from: (V = et.lower) != null ? V : s.MIN_KEY, to: (q = et.upper) != null ? q : s.MAX_KEY }, W.add(Q), Y.add(Q)) : (Y.add(l), W.add(l), g.indexes.forEach(function(nt) {
              return _(nt.name).add(l);
            })), p.mutate(w).then(function(nt) {
              return !et || w.type !== "add" && w.type !== "put" || (Y.addKeys(nt.results), S && S.forEach(function(ht) {
                for (var gt = w.values.map(function(ae) {
                  return ht.extractKey(ae);
                }), at = ht.keyPath.findIndex(function(ae) {
                  return ae === x.keyPath;
                }), lt = 0, kt = nt.results.length; lt < kt; ++lt) gt[lt][at] = nt.results[lt];
                _(ht.name).addKeys(gt);
              })), U.mutatedParts = _s(U.mutatedParts || {}, j), nt;
            });
          } }), A = { get: function(w) {
            return [x, new jt(w.key)];
          }, getMany: function(w) {
            return [x, new jt().addKeys(w.keys)];
          }, count: m, query: m, openCursor: m };
          return c(A).forEach(function(w) {
            I[w] = function(_) {
              var N = st.subscr, M = !!N, R = uc(st, p) && dc(w, _) ? _.obsSet = {} : N;
              if (M) {
                var U, N = function(Q) {
                  return Q = "idb://".concat(a, "/").concat(u, "/").concat(Q), R[Q] || (R[Q] = new jt());
                }, j = N(""), Y = N(":dels"), M = A[w](_), W = M[0], M = M[1];
                if ((w === "query" && W.isPrimaryKey && !_.values ? Y : N(W.name || "")).add(M), !W.isPrimaryKey) {
                  if (w !== "count") return U = w === "query" && k && _.values && p.query(n(n({}, _), { values: !1 })), p[w].apply(this, arguments).then(function(Q) {
                    if (w === "query") {
                      if (k && _.values) return U.then(function(gt) {
                        return gt = gt.result, j.addKeys(gt), Q;
                      });
                      var V = _.values ? Q.result.map(C) : Q.result;
                      (_.values ? j : Y).addKeys(V);
                    } else {
                      var nt, ht;
                      if (w === "openCursor") return ht = _.values, (nt = Q) && Object.create(nt, { key: { get: function() {
                        return Y.addKey(nt.primaryKey), nt.key;
                      } }, primaryKey: { get: function() {
                        var gt = nt.primaryKey;
                        return Y.addKey(gt), gt;
                      } }, value: { get: function() {
                        return ht && j.addKey(nt.primaryKey), nt.value;
                      } } });
                    }
                    return Q;
                  });
                  Y.add(l);
                }
              }
              return p[w].apply(this, arguments);
            };
          }), I;
        } });
      } };
      function mc(s, a, l) {
        var u;
        return l.numFailures === 0 ? a : a.type === "deleteRange" || (u = a.keys ? a.keys.length : "values" in a && a.values ? a.values.length : 1, l.numFailures === u) ? null : (u = n({}, a), d(u.keys) && (u.keys = u.keys.filter(function(m, p) {
          return !(p in l.failures);
        })), "values" in u && d(u.values) && (u.values = u.values.filter(function(m, p) {
          return !(p in l.failures);
        })), u);
      }
      function fa(s, a) {
        return l = s, ((u = a).lower === void 0 || (u.lowerOpen ? 0 < mt(l, u.lower) : 0 <= mt(l, u.lower))) && (l = s, (u = a).upper === void 0 || (u.upperOpen ? mt(l, u.upper) < 0 : mt(l, u.upper) <= 0));
        var l, u;
      }
      function hc(s, a, l, u, m, p) {
        var g, x, T, C, k, S;
        return !l || l.length === 0 || (g = a.query.index, x = g.multiEntry, T = a.query.range, C = u.schema.primaryKey.extractKey, k = g.extractKey, S = (g.lowLevelIndex || g).extractKey, (u = l.reduce(function(I, A) {
          var w = I, _ = [];
          if (A.type === "add" || A.type === "put") for (var N = new jt(), M = A.values.length - 1; 0 <= M; --M) {
            var R, U = A.values[M], j = C(U);
            !N.hasKey(j) && (R = k(U), x && d(R) ? R.some(function(Q) {
              return fa(Q, T);
            }) : fa(R, T)) && (N.addKey(j), _.push(U));
          }
          switch (A.type) {
            case "add":
              var Y = new jt().addKeys(a.values ? I.map(function(V) {
                return C(V);
              }) : I), w = I.concat(a.values ? _.filter(function(V) {
                return V = C(V), !Y.hasKey(V) && (Y.addKey(V), !0);
              }) : _.map(function(V) {
                return C(V);
              }).filter(function(V) {
                return !Y.hasKey(V) && (Y.addKey(V), !0);
              }));
              break;
            case "put":
              var W = new jt().addKeys(A.values.map(function(V) {
                return C(V);
              }));
              w = I.filter(function(V) {
                return !W.hasKey(a.values ? C(V) : V);
              }).concat(a.values ? _ : _.map(function(V) {
                return C(V);
              }));
              break;
            case "delete":
              var q = new jt().addKeys(A.keys);
              w = I.filter(function(V) {
                return !q.hasKey(a.values ? C(V) : V);
              });
              break;
            case "deleteRange":
              var et = A.range;
              w = I.filter(function(V) {
                return !fa(C(V), et);
              });
          }
          return w;
        }, s)) === s) ? s : (u.sort(function(I, A) {
          return mt(S(I), S(A)) || mt(C(I), C(A));
        }), a.limit && a.limit < 1 / 0 && (u.length > a.limit ? u.length = a.limit : s.length === a.limit && u.length < a.limit && (m.dirty = !0)), p ? Object.freeze(u) : u);
      }
      function pc(s, a) {
        return mt(s.lower, a.lower) === 0 && mt(s.upper, a.upper) === 0 && !!s.lowerOpen == !!a.lowerOpen && !!s.upperOpen == !!a.upperOpen;
      }
      function Np(s, a) {
        return ((l, u, m, p) => {
          if (l === void 0) return u !== void 0 ? -1 : 0;
          if (u === void 0) return 1;
          if ((l = mt(l, u)) === 0) {
            if (m && p) return 0;
            if (m) return 1;
            if (p) return -1;
          }
          return l;
        })(s.lower, a.lower, s.lowerOpen, a.lowerOpen) <= 0 && 0 <= ((l, u, m, p) => {
          if (l === void 0) return u !== void 0 ? 1 : 0;
          if (u === void 0) return -1;
          if ((l = mt(l, u)) === 0) {
            if (m && p) return 0;
            if (m) return -1;
            if (p) return 1;
          }
          return l;
        })(s.upper, a.upper, s.upperOpen, a.upperOpen);
      }
      function Lp(s, a, l, u) {
        s.subscribers.add(l), u.addEventListener("abort", function() {
          var m, p;
          s.subscribers.delete(l), s.subscribers.size === 0 && (m = s, p = a, setTimeout(function() {
            m.subscribers.size === 0 && vt(p, m);
          }, 3e3));
        });
      }
      var Mp = { stack: "dbcore", level: 0, name: "Cache", create: function(s) {
        var a = s.schema.name;
        return n(n({}, s), { transaction: function(l, u, m) {
          var p, g, x = s.transaction(l, u, m);
          return u === "readwrite" && (m = (p = new AbortController()).signal, x.addEventListener("abort", (g = function(T) {
            return function() {
              if (p.abort(), u === "readwrite") {
                for (var C = /* @__PURE__ */ new Set(), k = 0, S = l; k < S.length; k++) {
                  var I = S[k], A = ir["idb://".concat(a, "/").concat(I)];
                  if (A) {
                    var w = s.table(I), _ = A.optimisticOps.filter(function(nt) {
                      return nt.trans === x;
                    });
                    if (x._explicit && T && x.mutatedParts) for (var N = 0, M = Object.values(A.queries.query); N < M.length; N++) for (var R = 0, U = (W = M[N]).slice(); R < U.length; R++) la((q = U[R]).obsSet, x.mutatedParts) && (vt(W, q), q.subscribers.forEach(function(nt) {
                      return C.add(nt);
                    }));
                    else if (0 < _.length) {
                      A.optimisticOps = A.optimisticOps.filter(function(nt) {
                        return nt.trans !== x;
                      });
                      for (var j = 0, Y = Object.values(A.queries.query); j < Y.length; j++) for (var W, q, et, Q = 0, V = (W = Y[j]).slice(); Q < V.length; Q++) (q = V[Q]).res != null && x.mutatedParts && (T && !q.dirty ? (et = Object.isFrozen(q.res), et = hc(q.res, q.req, _, w, q, et), q.dirty ? (vt(W, q), q.subscribers.forEach(function(nt) {
                        return C.add(nt);
                      })) : et !== q.res && (q.res = et, q.promise = J.resolve({ result: et }))) : (q.dirty && vt(W, q), q.subscribers.forEach(function(nt) {
                        return C.add(nt);
                      })));
                    }
                  }
                }
                C.forEach(function(nt) {
                  return nt();
                });
              }
            };
          })(!1), { signal: m }), x.addEventListener("error", g(!1), { signal: m }), x.addEventListener("complete", g(!0), { signal: m })), x;
        }, table: function(l) {
          var u = s.table(l), m = u.schema.primaryKey;
          return n(n({}, u), { mutate: function(p) {
            var g, x = st.trans;
            return !m.outbound && x.db._options.cache !== "disabled" && !x.explicit && x.idbtrans.mode === "readwrite" && (g = ir["idb://".concat(a, "/").concat(l)]) ? (x = u.mutate(p), p.type !== "add" && p.type !== "put" || !(50 <= p.values.length || pa(m, p).some(function(T) {
              return T == null;
            })) ? (g.optimisticOps.push(p), p.mutatedParts && Ts(p.mutatedParts), x.then(function(T) {
              0 < T.numFailures && (vt(g.optimisticOps, p), (T = mc(0, p, T)) && g.optimisticOps.push(T), p.mutatedParts) && Ts(p.mutatedParts);
            }), x.catch(function() {
              vt(g.optimisticOps, p), p.mutatedParts && Ts(p.mutatedParts);
            })) : x.then(function(T) {
              var C = mc(0, n(n({}, p), { values: p.values.map(function(k, S) {
                var I;
                return T.failures[S] ? k : (z(I = (I = m.keyPath) != null && I.includes(".") ? dt(k) : n({}, k), m.keyPath, T.results[S]), I);
              }) }), T);
              g.optimisticOps.push(C), queueMicrotask(function() {
                return p.mutatedParts && Ts(p.mutatedParts);
              });
            }), x) : u.mutate(p);
          }, query: function(p) {
            var g, x, T, C, k, S, I;
            return uc(st, u) && dc("query", p) ? (g = ((T = st.trans) == null ? void 0 : T.db._options.cache) === "immutable", x = (T = st).requery, T = T.signal, S = ((A, w, _, N) => {
              var M = ir["idb://".concat(A, "/").concat(w)];
              if (!M) return [];
              if (!(A = M.queries[_])) return [null, !1, M, null];
              var R = A[(N.query ? N.query.index.name : null) || ""];
              if (!R) return [null, !1, M, null];
              switch (_) {
                case "query":
                  var U = R.find(function(j) {
                    return j.req.limit === N.limit && j.req.values === N.values && pc(j.req.query.range, N.query.range);
                  });
                  return U ? [U, !0, M, R] : [R.find(function(j) {
                    return ("limit" in j.req ? j.req.limit : 1 / 0) >= N.limit && (!N.values || j.req.values) && Np(j.req.query.range, N.query.range);
                  }), !1, M, R];
                case "count":
                  return U = R.find(function(j) {
                    return pc(j.req.query.range, N.query.range);
                  }), [U, !!U, M, R];
              }
            })(a, l, "query", p), I = S[0], C = S[2], k = S[3], I && S[1] ? I.obsSet = p.obsSet : (S = u.query(p).then(function(A) {
              var w = A.result;
              if (I && (I.res = w), g) {
                for (var _ = 0, N = w.length; _ < N; ++_) Object.freeze(w[_]);
                Object.freeze(w);
              } else A.result = dt(w);
              return A;
            }).catch(function(A) {
              return k && I && vt(k, I), Promise.reject(A);
            }), I = { obsSet: p.obsSet, promise: S, subscribers: /* @__PURE__ */ new Set(), type: "query", req: p, dirty: !1 }, k ? k.push(I) : (k = [I], (C = C || (ir["idb://".concat(a, "/").concat(l)] = { queries: { query: {}, count: {} }, objs: /* @__PURE__ */ new Map(), optimisticOps: [], unsignaledParts: {} })).queries.query[p.query.index.name || ""] = k)), Lp(I, k, x, T), I.promise.then(function(A) {
              return { result: hc(A.result, p, C?.optimisticOps, u, I, g) };
            })) : u.query(p);
          } });
        } });
      } };
      function ws(s, a) {
        return new Proxy(s, { get: function(l, u, m) {
          return u === "db" ? a : Reflect.get(l, u, m);
        } });
      }
      Nt.prototype.version = function(s) {
        if (isNaN(s) || s < 0.1) throw new ot.Type("Given version is not a positive number");
        if (s = Math.round(10 * s) / 10, this.idbdb || this._state.isBeingOpened) throw new ot.Schema("Cannot add version when database is open");
        this.verno = Math.max(this.verno, s);
        var a = this._versions, l = a.filter(function(u) {
          return u._cfg.version === s;
        })[0];
        return l || (l = new this.Version(s), a.push(l), a.sort(Tp), l.stores({}), this._state.autoSchema = !1), l;
      }, Nt.prototype._whenReady = function(s) {
        var a = this;
        return this.idbdb && (this._state.openComplete || st.letThrough || this._vip) ? s() : new J(function(l, u) {
          if (a._state.openComplete) return u(new ot.DatabaseClosed(a._state.dbOpenError));
          if (!a._state.isBeingOpened) {
            if (!a._state.autoOpen) return void u(new ot.DatabaseClosed());
            a.open().catch(xt);
          }
          a._state.dbReadyPromise.then(l, u);
        }).then(s);
      }, Nt.prototype.use = function(m) {
        var a = m.stack, l = m.create, u = m.level, m = m.name, p = (m && this.unuse({ stack: a, name: m }), this._middlewares[a] || (this._middlewares[a] = []));
        return p.push({ stack: a, create: l, level: u ?? 10, name: m }), p.sort(function(g, x) {
          return g.level - x.level;
        }), this;
      }, Nt.prototype.unuse = function(s) {
        var a = s.stack, l = s.name, u = s.create;
        return a && this._middlewares[a] && (this._middlewares[a] = this._middlewares[a].filter(function(m) {
          return u ? m.create !== u : !!l && m.name !== l;
        })), this;
      }, Nt.prototype.open = function() {
        var s = this;
        return sr(Ce, function() {
          return Ap(s);
        });
      }, Nt.prototype._close = function() {
        this.on.close.fire(new CustomEvent("close"));
        var s = this._state, a = Lr.indexOf(this);
        if (0 <= a && Lr.splice(a, 1), this.idbdb) {
          try {
            this.idbdb.close();
          } catch {
          }
          this.idbdb = null;
        }
        s.isBeingOpened || (s.dbReadyPromise = new J(function(l) {
          s.dbReadyResolve = l;
        }), s.openCanceller = new J(function(l, u) {
          s.cancelOpen = u;
        }));
      }, Nt.prototype.close = function(a) {
        var a = (a === void 0 ? { disableAutoOpen: !0 } : a).disableAutoOpen, l = this._state;
        a ? (l.isBeingOpened && l.cancelOpen(new ot.DatabaseClosed()), this._close(), l.autoOpen = !1, l.dbOpenError = new ot.DatabaseClosed()) : (this._close(), l.autoOpen = this._options.autoOpen || l.isBeingOpened, l.openComplete = !1, l.dbOpenError = null);
      }, Nt.prototype.delete = function(s) {
        var a = this, l = (s === void 0 && (s = { disableAutoOpen: !0 }), 0 < arguments.length && typeof arguments[0] != "object"), u = this._state;
        return new J(function(m, p) {
          function g() {
            a.close(s);
            var x = a._deps.indexedDB.deleteDatabase(a.name);
            x.onsuccess = _t(function() {
              var T, C, k;
              T = a._deps, C = a.name, oa(k = T.indexedDB) || C === ds || sa(k, T.IDBKeyRange).delete(C).catch(xt), m();
            }), x.onerror = he(p), x.onblocked = a._fireOnBlocked;
          }
          if (l) throw new ot.InvalidArgument("Invalid closeOptions argument to db.delete()");
          u.isBeingOpened ? u.dbReadyPromise.then(g) : g();
        });
      }, Nt.prototype.backendDB = function() {
        return this.idbdb;
      }, Nt.prototype.isOpen = function() {
        return this.idbdb !== null;
      }, Nt.prototype.hasBeenClosed = function() {
        var s = this._state.dbOpenError;
        return s && s.name === "DatabaseClosed";
      }, Nt.prototype.hasFailed = function() {
        return this._state.dbOpenError !== null;
      }, Nt.prototype.dynamicallyOpened = function() {
        return this._state.autoSchema;
      }, Object.defineProperty(Nt.prototype, "tables", { get: function() {
        var s = this;
        return c(this._allTables).map(function(a) {
          return s._allTables[a];
        });
      }, enumerable: !1, configurable: !0 }), Nt.prototype.transaction = function() {
        var s = function(a, l, u) {
          var m = arguments.length;
          if (m < 2) throw new ot.InvalidArgument("Too few arguments");
          for (var p = new Array(m - 1); --m; ) p[m - 1] = arguments[m];
          return u = p.pop(), [a, B(p), u];
        }.apply(this, arguments);
        return this._transaction.apply(this, s);
      }, Nt.prototype._transaction = function(s, a, l) {
        var u, m, p = this, g = st.trans, x = (g && g.db === this && s.indexOf("!") === -1 || (g = null), s.indexOf("?") !== -1);
        s = s.replace("!", "").replace("?", "");
        try {
          if (m = a.map(function(C) {
            if (C = C instanceof p.Table ? C.name : C, typeof C != "string") throw new TypeError("Invalid table argument to Dexie.transaction(). Only Table or String are allowed");
            return C;
          }), s == "r" || s === Vo) u = Vo;
          else {
            if (s != "rw" && s != Yo) throw new ot.InvalidArgument("Invalid transaction mode: " + s);
            u = Yo;
          }
          if (g) {
            if (g.mode === Vo && u === Yo) {
              if (!x) throw new ot.SubTransaction("Cannot enter a sub-transaction with READWRITE mode when parent transaction is READONLY");
              g = null;
            }
            g && m.forEach(function(C) {
              if (g && g.storeNames.indexOf(C) === -1) {
                if (!x) throw new ot.SubTransaction("Table " + C + " not included in parent transaction.");
                g = null;
              }
            }), x && g && !g.active && (g = null);
          }
        } catch (C) {
          return g ? g._promise(null, function(k, S) {
            S(C);
          }) : Dt(C);
        }
        var T = function C(k, S, I, A, w) {
          return J.resolve().then(function() {
            var R = st.transless || st, _ = k._createTransaction(S, I, k._dbSchema, A), R = (_.explicit = !0, { trans: _, transless: R });
            if (A) _.idbtrans = A.idbtrans;
            else try {
              _.create(), _.idbtrans._explicit = !0, k._state.PR1398_maxLoop = 3;
            } catch (U) {
              return U.name === rs.InvalidState && k.isOpen() && 0 < --k._state.PR1398_maxLoop ? (console.warn("Dexie: Need to reopen db"), k.close({ disableAutoOpen: !1 }), k.open().then(function() {
                return C(k, S, I, null, w);
              })) : Dt(U);
            }
            var N, M = oe(w), R = (M && Nr(), J.follow(function() {
              var U;
              (N = w.call(_, _)) && (M ? (U = Ne.bind(null, null), N.then(U, U)) : typeof N.next == "function" && typeof N.throw == "function" && (N = ma(N)));
            }, R));
            return (N && typeof N.then == "function" ? J.resolve(N).then(function(U) {
              return _.active ? U : Dt(new ot.PrematureCommit("Transaction committed too early. See http://bit.ly/2kdckMn"));
            }) : R.then(function() {
              return N;
            })).then(function(U) {
              return A && _._resolve(), _._completion.then(function() {
                return U;
              });
            }).catch(function(U) {
              return _._reject(U), Dt(U);
            });
          });
        }.bind(null, this, u, m, g, l);
        return g ? g._promise(u, T, "lock") : st.trans ? sr(st.transless, function() {
          return p._whenReady(T);
        }) : this._whenReady(T);
      }, Nt.prototype.table = function(s) {
        if (v(this._allTables, s)) return this._allTables[s];
        throw new ot.InvalidTable("Table ".concat(s, " does not exist"));
      };
      var _e = Nt;
      function Nt(s, a) {
        var l, u, m, p, g, x = this, T = (this._middlewares = {}, this.verno = 0, Nt.dependencies), T = (this._options = a = n({ addons: Nt.addons, autoOpen: !0, indexedDB: T.indexedDB, IDBKeyRange: T.IDBKeyRange, cache: "cloned" }, a), this._deps = { indexedDB: a.indexedDB, IDBKeyRange: a.IDBKeyRange }, a.addons), C = (this._dbSchema = {}, this._versions = [], this._storeNames = [], this._allTables = {}, this.idbdb = null, this._novip = this, { dbOpenError: null, isBeingOpened: !1, onReadyBeingFired: null, openComplete: !1, dbReadyResolve: xt, dbReadyPromise: null, cancelOpen: xt, openCanceller: null, autoSchema: !0, PR1398_maxLoop: 3, autoOpen: a.autoOpen }), k = (C.dbReadyPromise = new J(function(S) {
          C.dbReadyResolve = S;
        }), C.openCanceller = new J(function(S, I) {
          C.cancelOpen = I;
        }), this._state = C, this.name = s, this.on = vn(this, "populate", "blocked", "versionchange", "close", { ready: [Bo, xt] }), this.once = function(S, I) {
          var A = function() {
            for (var w = [], _ = 0; _ < arguments.length; _++) w[_] = arguments[_];
            x.on(S).unsubscribe(A), I.apply(x, w);
          };
          return x.on(S, A);
        }, this.on.ready.subscribe = P(this.on.ready.subscribe, function(S) {
          return function(I, A) {
            Nt.vip(function() {
              var w, _ = x._state;
              _.openComplete ? (_.dbOpenError || J.resolve().then(I), A && S(I)) : _.onReadyBeingFired ? (_.onReadyBeingFired.push(I), A && S(I)) : (S(I), w = x, A || S(function N() {
                w.on.ready.unsubscribe(I), w.on.ready.unsubscribe(N);
              }));
            });
          };
        }), this.Collection = (l = this, xn(bp.prototype, function(N, _) {
          this.db = l;
          var A = Kl, w = null;
          if (_) try {
            A = _();
          } catch (R) {
            w = R;
          }
          var _ = N._ctx, N = _.table, M = N.hook.reading.fire;
          this._ctx = { table: N, index: _.index, isPrimKey: !_.index || N.schema.primKey.keyPath && _.index === N.schema.primKey.name, range: A, keysOnly: !1, dir: "next", unique: "", algorithm: null, filter: null, replayFilter: null, justLimit: !0, isMatch: null, offset: 0, limit: 1 / 0, error: w, or: _.or, valueMapper: M !== mn ? M : null };
        })), this.Table = (u = this, xn(Wl.prototype, function(S, I, A) {
          this.db = u, this._tx = A, this.name = S, this.schema = I, this.hook = u._allTables[S] ? u._allTables[S].hook : vn(null, { creating: [lp, xt], reading: [ip, mn], updating: [up, xt], deleting: [cp, xt] });
        })), this.Transaction = (m = this, xn(yp.prototype, function(S, I, A, w, _) {
          var N = this;
          S !== "readonly" && I.forEach(function(M) {
            M = (M = A[M]) == null ? void 0 : M.yProps, M && (I = I.concat(M.map(function(R) {
              return R.updatesTable;
            })));
          }), this.db = m, this.mode = S, this.storeNames = I, this.schema = A, this.chromeTransactionDurability = w, this.idbtrans = null, this.on = vn(this, "complete", "error", "abort"), this.parent = _ || null, this.active = !0, this._reculock = 0, this._blockedFuncs = [], this._resolve = null, this._reject = null, this._waitingFor = null, this._waitingQueue = null, this._spinCount = 0, this._completion = new J(function(M, R) {
            N._resolve = M, N._reject = R;
          }), this._completion.then(function() {
            N.active = !1, N.on.complete.fire();
          }, function(M) {
            var R = N.active;
            return N.active = !1, N.on.error.fire(M), N.parent ? N.parent._reject(M) : R && N.idbtrans && N.idbtrans.abort(), Dt(M);
          });
        })), this.Version = (p = this, xn(Ip.prototype, function(S) {
          this.db = p, this._cfg = { version: S, storesSource: null, dbschema: {}, tables: {}, contentUpgrade: null };
        })), this.WhereClause = (g = this, xn(tc.prototype, function(S, I, A) {
          if (this.db = g, this._ctx = { table: S, index: I === ":id" ? null : I, or: A }, this._cmp = this._ascending = mt, this._descending = function(w, _) {
            return mt(_, w);
          }, this._max = function(w, _) {
            return 0 < mt(w, _) ? w : _;
          }, this._min = function(w, _) {
            return mt(w, _) < 0 ? w : _;
          }, this._IDBKeyRange = g._deps.IDBKeyRange, !this._IDBKeyRange) throw new ot.MissingAPI();
        })), this.on("versionchange", function(S) {
          0 < S.newVersion ? console.warn("Another connection wants to upgrade database '".concat(x.name, "'. Closing db now to resume the upgrade.")) : console.warn("Another connection wants to delete database '".concat(x.name, "'. Closing db now to resume the delete request.")), x.close({ disableAutoOpen: !1 });
        }), this.on("blocked", function(S) {
          !S.newVersion || S.newVersion < S.oldVersion ? console.warn("Dexie.delete('".concat(x.name, "') was blocked")) : console.warn("Upgrade '".concat(x.name, "' blocked by other connection holding version ").concat(S.oldVersion / 10));
        }), this._maxKey = En(a.IDBKeyRange), this._createTransaction = function(S, I, A, w) {
          return new x.Transaction(S, I, A, x._options.chromeTransactionDurability, w);
        }, this._fireOnBlocked = function(S) {
          x.on("blocked").fire(S), Lr.filter(function(I) {
            return I.name === x.name && I !== x && !I._state.vcFired;
          }).map(function(I) {
            return I.on("versionchange").fire(S);
          });
        }, this.use(Cp), this.use(Mp), this.use(Dp), this.use($p), this.use(Rp), new Proxy(this, { get: function(S, I, A) {
          var w;
          return I === "_vip" || (I === "table" ? function(_) {
            return ws(x.table(_), k);
          } : (w = Reflect.get(S, I, A)) instanceof Wl ? ws(w, k) : I === "tables" ? w.map(function(_) {
            return ws(_, k);
          }) : I === "_createTransaction" ? function() {
            return ws(w.apply(this, arguments), k);
          } : w);
        } }));
        this.vip = k, T.forEach(function(S) {
          return S(x);
        });
      }
      var Is, Br = typeof Symbol < "u" && "observable" in Symbol ? Symbol.observable : "@@observable", Op = (ga.prototype.subscribe = function(s, a, l) {
        return this._subscribe(s && typeof s != "function" ? s : { next: s, error: a, complete: l });
      }, ga.prototype[Br] = function() {
        return this;
      }, ga);
      function ga(s) {
        this._subscribe = s;
      }
      try {
        Is = { indexedDB: i.indexedDB || i.mozIndexedDB || i.webkitIndexedDB || i.msIndexedDB, IDBKeyRange: i.IDBKeyRange || i.webkitIDBKeyRange };
      } catch {
        Is = { indexedDB: null, IDBKeyRange: null };
      }
      function fc(s) {
        var a, l = !1, u = new Op(function(m) {
          var p = oe(s), g, x = !1, T = {}, C = {}, k = { get closed() {
            return x;
          }, unsubscribe: function() {
            x || (x = !0, g && g.abort(), S && Oe.storagemutated.unsubscribe(A));
          } }, S = (m.start && m.start(k), !1), I = function() {
            return Fo(w);
          }, A = function(_) {
            _s(T, _), la(C, T) && I();
          }, w = function() {
            var _, N, M;
            !x && Is.indexedDB && (T = {}, _ = {}, g && g.abort(), g = new AbortController(), M = ((R) => {
              var U = Cr();
              try {
                p && Nr();
                var j = De(s, R);
                return j = p ? j.finally(Ne) : j;
              } finally {
                U && Dr();
              }
            })(N = { subscr: _, signal: g.signal, requery: I, querier: s, trans: null }), Promise.resolve(M).then(function(R) {
              l = !0, a = R, x || N.signal.aborted || (T = {}, ((U) => {
                for (var j in U) if (v(U, j)) return;
                return 1;
              })(C = _) || S || (Oe(Sn, A), S = !0), Fo(function() {
                return !x && m.next && m.next(R);
              }));
            }, function(R) {
              l = !1, ["DatabaseClosedError", "AbortError"].includes(R?.name) || x || Fo(function() {
                x || m.error && m.error(R);
              });
            }));
          };
          return setTimeout(I, 0), k;
        });
        return u.hasValue = function() {
          return l;
        }, u.getValue = function() {
          return a;
        }, u;
      }
      var lr = _e;
      function ba(s) {
        var a = Pe;
        try {
          Pe = !0, Oe.storagemutated.fire(s), da(s, !0);
        } finally {
          Pe = a;
        }
      }
      E(lr, n(n({}, Ot), { delete: function(s) {
        return new lr(s, { addons: [] }).delete();
      }, exists: function(s) {
        return new lr(s, { addons: [] }).open().then(function(a) {
          return a.close(), !0;
        }).catch("NoSuchDatabaseError", function() {
          return !1;
        });
      }, getDatabaseNames: function(s) {
        try {
          return a = lr.dependencies, l = a.indexedDB, a = a.IDBKeyRange, (oa(l) ? Promise.resolve(l.databases()).then(function(u) {
            return u.map(function(m) {
              return m.name;
            }).filter(function(m) {
              return m !== ds;
            });
          }) : sa(l, a).toCollection().primaryKeys()).then(s);
        } catch {
          return Dt(new ot.MissingAPI());
        }
        var a, l;
      }, defineClass: function() {
        return function(s) {
          h(this, s);
        };
      }, ignoreTransaction: function(s) {
        return st.trans ? sr(st.transless, s) : s();
      }, vip: aa, async: function(s) {
        return function() {
          try {
            var a = ma(s.apply(this, arguments));
            return a && typeof a.then == "function" ? a : J.resolve(a);
          } catch (l) {
            return Dt(l);
          }
        };
      }, spawn: function(s, a, l) {
        try {
          var u = ma(s.apply(l, a || []));
          return u && typeof u.then == "function" ? u : J.resolve(u);
        } catch (m) {
          return Dt(m);
        }
      }, currentTransaction: { get: function() {
        return st.trans || null;
      } }, waitFor: function(s, a) {
        return s = J.resolve(typeof s == "function" ? lr.ignoreTransaction(s) : s).timeout(a || 6e4), st.trans ? st.trans.waitFor(s) : s;
      }, Promise: J, debug: { get: function() {
        return me;
      }, set: function(s) {
        Ol(s);
      } }, derive: O, extend: h, props: E, override: P, Events: vn, on: Oe, liveQuery: fc, extendObservabilitySet: _s, getByKeyPath: F, setByKeyPath: z, delByKeyPath: function(s, a) {
        typeof a == "string" ? z(s, a, void 0) : "length" in a && [].map.call(a, function(l) {
          z(s, l, void 0);
        });
      }, shallowClone: Z, deepClone: dt, getObjectDiff: ha, cmp: mt, asap: X, minKey: -1 / 0, addons: [], connections: Lr, errnames: rs, dependencies: Is, cache: ir, semVer: "4.3.0", version: "4.3.0".split(".").map(function(s) {
        return parseInt(s);
      }).reduce(function(s, a, l) {
        return s + a / Math.pow(10, 2 * l);
      }) })), lr.maxKey = En(lr.dependencies.IDBKeyRange), typeof dispatchEvent < "u" && typeof addEventListener < "u" && (Oe(Sn, function(s) {
        Pe || (s = new CustomEvent(Jo, { detail: s }), Pe = !0, dispatchEvent(s), Pe = !1);
      }), addEventListener(Jo, function(s) {
        s = s.detail, Pe || ba(s);
      }));
      var Ur, Pe = !1, gc = function() {
      };
      return typeof BroadcastChannel < "u" && ((gc = function() {
        (Ur = new BroadcastChannel(Jo)).onmessage = function(s) {
          return s.data && ba(s.data);
        };
      })(), typeof Ur.unref == "function" && Ur.unref(), Oe(Sn, function(s) {
        Pe || Ur.postMessage(s);
      })), typeof addEventListener < "u" && (addEventListener("pagehide", function(s) {
        if (!_e.disableBfCache && s.persisted) {
          me && console.debug("Dexie: handling persisted pagehide"), Ur?.close();
          for (var a = 0, l = Lr; a < l.length; a++) l[a].close({ disableAutoOpen: !1 });
        }
      }), addEventListener("pageshow", function(s) {
        !_e.disableBfCache && s.persisted && (me && console.debug("Dexie: handling persisted pageshow"), gc(), ba({ all: new jt(-1 / 0, [[]]) }));
      })), J.rejectionMapper = function(s, a) {
        return !s || s instanceof Ct || s instanceof TypeError || s instanceof SyntaxError || !s.name || !Ml[s.name] ? s : (a = new Ml[s.name](a || s.message, s), "stack" in s && $(a, "stack", { get: function() {
          return this.inner.stack;
        } }), a);
      }, Ol(me), n(_e, Object.freeze({ __proto__: null, Dexie: _e, Entity: jl, PropModification: bn, RangeSet: jt, add: function(s) {
        return new bn({ add: s });
      }, cmp: mt, default: _e, liveQuery: fc, mergeRanges: kn, rangesOverlap: oc, remove: function(s) {
        return new bn({ remove: s });
      }, replacePrefix: function(s, a) {
        return new bn({ replacePrefix: [s, a] });
      } }), { default: _e }), _e;
    });
  })(Gs)), Gs.exports;
}
var Mb = Lb();
const Ya = /* @__PURE__ */ Db(Mb), Oc = /* @__PURE__ */ Symbol.for("Dexie"), Js = globalThis[Oc] || (globalThis[Oc] = Ya);
if (Ya.semVer !== Js.semVer)
  throw new Error(`Two different versions of Dexie loaded in the same app: ${Ya.semVer} and ${Js.semVer}`);
const {
  liveQuery: yE,
  mergeRanges: SE,
  rangesOverlap: EE,
  RangeSet: _E,
  cmp: TE,
  Entity: kE,
  PropModification: wE,
  replacePrefix: IE,
  add: AE,
  remove: $E,
  DexieYProvider: RE
} = Js;
class Ob extends Js {
  constructor() {
    super("ss-helper-db"), this.version(1).stores({
      // ── 公共三张表 ──
      chat_documents: "&chatKey, entityKey, updatedAt",
      chat_plugin_state: "[pluginId+chatKey], pluginId, chatKey, updatedAt",
      chat_plugin_records: "++id, [pluginId+chatKey+collection], [pluginId+chatKey+collection+ts], pluginId, chatKey, collection, recordId, ts",
      // ── MemoryOS 专属表（索引与旧 stx_memory_os 完全一致） ──
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
      // ── LLMHub 凭据表 ──
      llm_credentials: "&providerId, updatedAt"
    });
  }
}
const de = new Ob(), Pb = new wr("SDK-ChatData"), Bb = "stx_sdk", Ub = 180, Qs = /* @__PURE__ */ new Map(), Zs = /* @__PURE__ */ new Map(), to = /* @__PURE__ */ new Map(), Wa = /* @__PURE__ */ new Map();
let Xa = null;
function ul(t, e) {
  return `${t}::${e}`;
}
function gm() {
  Xa === null && (Xa = setTimeout(Hb, Ub));
}
async function Hb() {
  Xa = null;
  const t = Array.from(Wa.values()), e = Array.from(to.values());
  if (Wa.clear(), to.clear(), !(t.length === 0 && e.length === 0))
    try {
      await de.transaction("rw", [de.chat_documents, de.chat_plugin_state], async () => {
        for (const r of t)
          await de.chat_documents.put(r);
        for (const r of e)
          await de.chat_plugin_state.put(r);
      });
    } catch (r) {
      Pb.error("flushPending 写入失败:", r);
    }
}
function Wn(t, e, r) {
  try {
    Mu("sdk:chat_data:changed", { table: t, pluginId: e, chatKey: r }, Bb);
  } catch {
  }
}
function bm() {
  return {
    labels: [],
    flags: {},
    notes: "",
    signals: {}
  };
}
function zb(t) {
  if (!t || typeof t != "object" || Array.isArray(t)) return bm();
  const e = t;
  return {
    labels: Array.isArray(e.labels) ? e.labels.filter((r) => typeof r == "string") : [],
    flags: e.flags && typeof e.flags == "object" && !Array.isArray(e.flags) ? e.flags : {},
    notes: typeof e.notes == "string" ? e.notes : "",
    signals: e.signals && typeof e.signals == "object" && !Array.isArray(e.signals) ? e.signals : {}
  };
}
async function vm(t) {
  const e = Qs.get(t);
  if (e) return e;
  const r = await de.chat_documents.get(t);
  return r && (r.shared = zb(r.shared), Qs.set(t, r)), r ?? null;
}
async function Gb(t, e, r) {
  const n = await vm(t);
  if (n) return n;
  const o = `${e.tavernInstanceId}::${e.scopeType}::${e.scopeId}`, i = {
    chatKey: t,
    entityKey: o,
    ref: e,
    meta: r ?? {},
    shared: bm(),
    updatedAt: Date.now()
  };
  return await de.chat_documents.put(i), Qs.set(t, i), Wn("chat_documents", "", t), i;
}
async function Kb(t, e) {
  const r = await vm(t);
  if (!r) return;
  const n = { ...r.shared };
  if (e.labels !== void 0 && (n.labels = e.labels), e.flags !== void 0 && (n.flags = { ...n.flags, ...e.flags }), e.notes !== void 0 && (n.notes = e.notes), e.signals !== void 0) {
    n.signals = { ...n.signals };
    for (const [i, c] of Object.entries(e.signals))
      n.signals[i] = { ...n.signals[i] ?? {}, ...c };
  }
  const o = { ...r, shared: n, updatedAt: Date.now() };
  Qs.set(t, o), Wa.set(t, o), gm(), Wn("chat_documents", "", t);
}
async function xm(t, e) {
  const r = ul(t, e), n = Zs.get(r);
  if (n) return n;
  const o = await de.chat_plugin_state.get([t, e]);
  return o && Zs.set(r, o), o ?? null;
}
async function jb(t, e, r, n) {
  const o = ul(t, e), i = await xm(t, e), c = Date.now(), d = {
    pluginId: t,
    chatKey: e,
    schemaVersion: n?.schemaVersion ?? i?.schemaVersion ?? 1,
    state: { ...i?.state ?? {}, ...r },
    summary: n?.summary ?? i?.summary ?? {},
    updatedAt: c
  };
  Zs.set(o, d), to.set(o, d), gm(), Wn("chat_plugin_state", t, e);
}
async function qb(t, e) {
  const r = ul(t, e);
  Zs.delete(r), to.delete(r);
  try {
    return await de.chat_plugin_state.delete([t, e]), Wn("chat_plugin_state", t, e), !0;
  } catch {
    return !1;
  }
}
async function ym(t, e) {
  let o = await de.chat_plugin_state.where("pluginId").equals(t).toArray();
  return o.sort((i, c) => c.updatedAt - i.updatedAt), o.map((i) => ({
    pluginId: i.pluginId,
    chatKey: i.chatKey,
    summary: i.summary,
    updatedAt: i.updatedAt
  }));
}
async function Sm(t, e, r, n) {
  const o = Date.now(), i = {
    pluginId: t,
    chatKey: e,
    collection: r,
    recordId: n.recordId,
    payload: n.payload,
    ts: n.ts ?? o,
    updatedAt: o
  };
  await de.chat_plugin_records.add(i), Wn("chat_plugin_records", t, e);
}
new wr("SDK-AccessControl");
function Em(t) {
  const e = String(t ?? "").trim().toLowerCase();
  return e === "dark" ? "dark" : e === "light" ? "light" : e === "tavern" || e === "host" ? "tavern" : "default";
}
function Fb(t) {
  return t === "tavern" ? "host" : t;
}
function dl(t) {
  return t === "host" ? "tavern" : t;
}
Ao();
Og();
Vd();
Yd();
function Xn() {
  return ln();
}
const _m = /\[(APPLY_STATUS|REMOVE_STATUS|CLEAR_STATUS)\s*:(.*?)\]|\[(CLEAR_STATUS)\]/gi;
function Ae(t) {
  return typeof t == "string" ? t.trim() : "";
}
function ml(t) {
  if (t == null || t === "") return null;
  const e = Number(t);
  if (!Number.isFinite(e)) return null;
  const r = Math.floor(e);
  return r <= 0 ? null : r;
}
function dn(t) {
  const e = ml(t);
  return e == null ? "永久" : `剩余${e}轮`;
}
function Dn(t) {
  return Ae(t).toLowerCase();
}
function Do(t) {
  return Ae(t).toLowerCase();
}
function Vb(t) {
  const e = Ae(t);
  if (!e) return [];
  const r = e.split("|").map((n) => Do(n)).filter(Boolean);
  return Array.from(new Set(r));
}
function Yb(t) {
  const e = t.match(/(?:turns|duration)\s*=\s*([^,\]]+)/i);
  if (!e) return 1;
  const r = String(e[1] ?? "").trim();
  if (!r) return 1;
  if (/^(perm|permanent|forever|infinite|inf|\*)$/i.test(r))
    return null;
  const n = Number(r);
  return Number.isFinite(n) && Math.floor(n) >= 1 ? Math.floor(n) : (ut.warn(`状态标签 turns/duration 非法，已回退为 1 轮: ${r}`), 1);
}
function en(t) {
  const e = String(t || "").replace(_m, "").replace(/[ \t]{2,}/g, " ");
  return zn(e);
}
function Wb(t, e) {
  const r = [], n = String(t || ""), o = Do(e), i = new RegExp(_m.source, "gi");
  let c;
  for (; (c = i.exec(n)) !== null; ) {
    const d = String(c[1] || c[3] || "").trim().toUpperCase(), h = Ae(c[2] || "");
    if (d === "CLEAR_STATUS") {
      r.push({ kind: "clear" });
      continue;
    }
    if (d === "REMOVE_STATUS") {
      const L = Ae(h);
      if (!L) continue;
      r.push({ kind: "remove", name: L });
      continue;
    }
    if (d !== "APPLY_STATUS") continue;
    const f = h.split(",").map((L) => Ae(L)), b = f[0] || "", v = Number(f[1]);
    if (!b || !Number.isFinite(v)) continue;
    const E = f.slice(2).join(","), y = Yb(E);
    let $ = "skills", O = [];
    if (/scope\s*=\s*all/i.test(E))
      $ = "all";
    else {
      const L = E.match(/skills\s*=\s*([^,\]]+)/i);
      L && (O = Vb(L[1] || "")), O.length <= 0 && o && (O = [o]);
    }
    r.push({
      kind: "apply",
      name: b,
      modifier: v,
      durationRounds: y,
      scope: $,
      skills: O
    });
  }
  return r;
}
function Tm(t, e) {
  const r = Wb(t, e);
  return {
    cleanedText: en(t),
    commands: r
  };
}
function Xb(t, e = Date.now()) {
  if (!t || typeof t != "object") return null;
  const r = Ae(t.name), n = Number(t.modifier), o = ml(t.remainingRounds), c = Ae(t.scope).toLowerCase() === "all" ? "all" : "skills", d = t.enabled !== !1, h = Array.isArray(t.skills) ? t.skills : [], f = Array.from(
    new Set(
      h.map((L) => Do(L)).filter((L) => !!L)
    )
  ), b = Number(t.createdAt), v = Number(t.updatedAt), E = Number.isFinite(b) ? b : e, y = Number.isFinite(v) ? v : E, $ = Ae(t.source), O = $ === "manual_editor" || $ === "ai_tag" ? $ : void 0;
  return !r || !Number.isFinite(n) || c === "skills" && f.length <= 0 ? null : {
    name: r,
    modifier: n,
    remainingRounds: o,
    scope: c,
    skills: f,
    enabled: d,
    createdAt: E,
    updatedAt: y,
    source: O
  };
}
function ye(t) {
  if (!Array.isArray(t)) return [];
  const e = [], r = /* @__PURE__ */ new Map();
  for (const n of t) {
    const o = Xb(n);
    if (!o) continue;
    const i = Dn(o.name), c = r.get(i);
    if (c == null) {
      r.set(i, e.length), e.push(o);
      continue;
    }
    e[c] = o;
  }
  return e;
}
function Ar(t) {
  return Array.isArray(t.activeStatuses) || (t.activeStatuses = []), t.activeStatuses = ye(t.activeStatuses), t.activeStatuses;
}
function Jb(t, e, r, n = Date.now()) {
  if (!Array.isArray(e) || e.length <= 0) return !1;
  const o = Ar(t);
  let i = !1;
  for (const c of e) {
    if (c.kind === "clear") {
      o.length > 0 && (o.splice(0, o.length), i = !0);
      continue;
    }
    if (c.kind === "remove") {
      const d = Dn(c.name), h = o.findIndex((f) => Dn(f.name) === d);
      h >= 0 && (o.splice(h, 1), i = !0);
      continue;
    }
    if (c.kind === "apply") {
      const d = Dn(c.name), h = o.findIndex((v) => Dn(v.name) === d), f = h >= 0 ? o[h] : null, b = {
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
      h >= 0 ? o[h] = b : o.push(b), i = !0;
    }
  }
  return i;
}
function hl(t, e) {
  const r = ye(t), n = Do(e);
  let o = 0;
  const i = [];
  for (const c of r) {
    if (!c.enabled) continue;
    const d = ml(c.remainingRounds);
    if (c.remainingRounds != null && d == null) continue;
    const h = Number(c.modifier);
    if (Number.isFinite(h)) {
      if (c.scope === "all") {
        o += h, i.push({ name: c.name, modifier: h });
        continue;
      }
      n && c.skills.includes(n) && (o += h, i.push({ name: c.name, modifier: h }));
    }
  }
  return { modifier: o, matched: i };
}
function Qb(t, e, r) {
  const n = ye(t), o = [];
  if (o.push(e), n.length <= 0)
    return o.push("none"), o.push(r), zn(o.join(`
`));
  o.push(`count=${n.length}`);
  for (const i of n) {
    const c = i.scope, d = c === "all" ? "-" : i.skills.join("|"), h = dn(i.remainingRounds);
    o.push(
      `- name="${i.name}" mod=${i.modifier >= 0 ? `+${i.modifier}` : i.modifier} duration=${h} scope=${c} skills=${d} enabled=${i.enabled ? 1 : 0}`
    );
  }
  return o.push(r), zn(o.join(`
`));
}
const Pc = "[SS-Helper][StoreThemeTrace]";
let Ds = null, Ks = null, Bc = !1;
var eo = () => {
};
function Zb(t) {
  eo = t;
}
let Mn = "", We = null, Uc = 0;
function km(t, e) {
  if (e === void 0) {
    console.info(`${Pc} ${t}`);
    return;
  }
  console.info(`${Pc} ${t}`, e);
}
const js = {
  pendingRound: void 0,
  activeStatuses: [],
  outboundSummary: void 0,
  pendingResultGuidanceQueue: [],
  outboundResultGuidance: void 0,
  summaryHistory: [],
  lastPromptUserMsgId: void 0,
  lastProcessedAssistantMsgId: void 0
}, wm = {};
function No() {
  const t = an();
  return t ? (We = t, Mn = rn({
    ...t,
    chatId: t.currentChatId
  }), Mn) : (We = null, Mn = "", "");
}
function Im(t, e) {
  const r = Jn(
    typeof t.skillPresetStoreText == "string" ? t.skillPresetStoreText : ""
  ), n = Qn(r) ?? nn();
  return {
    skillPresetStoreText: JSON.stringify(n, null, 2),
    activeStatuses: ye(t.activeStatuses),
    lastBaseRoll: t.lastBaseRoll ?? null,
    pendingRound: t.pendingRound ?? null,
    summaryHistory: Array.isArray(t.summaryHistory) ? t.summaryHistory : []
  };
}
async function pl(t) {
  St().skillTableText;
  const e = await xm(
    $e,
    t
  );
  return Im(e?.state ?? {});
}
async function fl(t, e, r) {
  St().skillTableText;
  const n = await pl(t), o = typeof e == "function" ? e(n) : e, i = Im(
    {
      ...n,
      ...o ?? {}
    }
  ), c = We ?? an(), d = Jt(t, {
    tavernInstanceId: c?.tavernInstanceId
  });
  return String(d.chatId ?? "unknown_chat").trim(), await jb($e, t, i, {
    summary: {
      activeStatusCount: i.activeStatuses.length
    }
  }), i;
}
function tv(t) {
  const e = No();
  e && fl(e, (r) => ({
    ...r,
    skillPresetStoreText: t
  })).catch((r) => {
    ut.warn(`聊天级技能持久化失败，chatKey=${e}`, r);
  });
}
function ev() {
  const t = No();
  if (!t) return;
  const e = js, r = wm;
  (async () => {
    try {
      await fl(t, (o) => ({
        ...o,
        activeStatuses: ye(e.activeStatuses),
        lastBaseRoll: r.last ?? null,
        pendingRound: e.pendingRound ?? null,
        summaryHistory: Array.isArray(e.summaryHistory) ? e.summaryHistory : []
      }));
      const n = We ?? an();
      n && await Gb(t, {
        tavernInstanceId: n.tavernInstanceId,
        scopeType: n.scopeType,
        scopeId: n.scopeId,
        chatId: n.currentChatId
      }), await Kb(t, {
        signals: {
          stx_rollhelper: {
            lastRollSummary: r.last ? `${r.last.expr} = ${r.last.total}` : null,
            hasPendingRound: !!e.pendingRound,
            activeStatusCount: e.activeStatuses.length
          }
        }
      });
    } catch (n) {
      ut.warn(`运行时状态持久化失败，chatKey=${t}`, n);
    }
  })();
}
function gl() {
  return Mn || No();
}
async function rv() {
  const t = We ?? an();
  return t ? (We = t, (await ym($e)).map((r) => ({
    chatKey: String(r.chatKey ?? "").trim(),
    updatedAt: Number(r.updatedAt) || 0,
    activeStatusCount: Number(r.summary?.activeStatusCount) || 0,
    chatId: "",
    displayName: "",
    avatarUrl: "",
    scopeType: "character",
    scopeId: "",
    roleKey: ""
  }))) : [];
}
async function nv() {
  return (await rb()).map((e) => ({
    chatKey: rn(e.locator),
    updatedAt: Number(e.updatedAt) || 0,
    chatId: String(e.locator.chatId ?? "").trim(),
    displayName: String(e.locator.displayName ?? "").trim(),
    avatarUrl: String(e.locator.avatarUrl ?? "").trim(),
    scopeType: e.locator.scopeType === "group" ? "group" : "character",
    scopeId: String(e.locator.scopeId ?? "").trim(),
    roleKey: String(e.locator.roleKey ?? "").trim()
  })).filter((e) => e.chatKey && !ie(e.chatId));
}
async function sv(t) {
  const e = await pl(t);
  return ye(e.activeStatuses);
}
async function ov(t, e) {
  await fl(t, (r) => ({
    ...r,
    activeStatuses: ye(e)
  }));
}
async function av(t) {
  const e = We ?? an();
  if (!e)
    return {
      deletedCount: 0,
      deletedChatKeys: []
    };
  We = e;
  const r = new Set(
    (Array.isArray(t) ? t : []).map(
      (i) => ze(
        Jt(String(i ?? "").trim(), {
          tavernInstanceId: String(e.tavernInstanceId ?? "").trim()
        })
      )
    ).filter(Boolean)
  ), n = await ym($e), o = [];
  for (const i of n) {
    const c = String(i.chatKey ?? "").trim();
    if (!c) continue;
    const d = ze(
      Jt(c, {
        tavernInstanceId: String(e.tavernInstanceId ?? "").trim()
      })
    );
    !d || r.has(d) || !await qb($e, c) || o.push(c);
  }
  return {
    deletedCount: o.length,
    deletedChatKeys: o
  };
}
async function Am(t = "init") {
  const e = ++Uc, r = No();
  if (r)
    try {
      const n = await pl(r);
      if (e !== Uc) return;
      const o = St(), i = Jn(
        n.skillPresetStoreText,
        o.skillTableText
      ), c = Qn(i) ?? nn(), d = JSON.stringify(c, null, 2), h = oo(
        c,
        o.skillTableText
      ), f = $t();
      f.activeStatuses = ye(n.activeStatuses), f.pendingRound = n.pendingRound ?? void 0, f.summaryHistory = Array.isArray(n.summaryHistory) ? n.summaryHistory : [], f.outboundSummary = void 0, f.pendingResultGuidanceQueue = [], f.outboundResultGuidance = void 0, f.lastPromptUserMsgId = void 0, f.lastProcessedAssistantMsgId = void 0;
      const b = Gn();
      b.last = n.lastBaseRoll ?? void 0, b.lastTotal = n.lastBaseRoll?.total;
      let v = !1;
      (o.skillPresetStoreText !== d || o.skillTableText !== h) && (Kn({
        skillPresetStoreText: d,
        skillTableText: h
      }), v = !0), ao = "", ue = {}, v || eo();
    } catch (n) {
      ut.warn(`聊天级状态装载失败，已降级默认 (${t}) chatKey=${r}`, n);
      const o = St(), i = nn(), c = JSON.stringify(i, null, 2), d = oo(i, o.skillTableText), h = $t();
      h.activeStatuses = [], h.pendingRound = void 0, h.summaryHistory = [], h.outboundSummary = void 0, h.pendingResultGuidanceQueue = [], h.outboundResultGuidance = void 0, h.lastPromptUserMsgId = void 0, h.lastProcessedAssistantMsgId = void 0;
      const f = Gn();
      f.last = void 0, f.lastTotal = void 0;
      let b = !1;
      (o.skillPresetStoreText !== c || o.skillTableText !== d) && (Kn({
        skillPresetStoreText: c,
        skillTableText: d
      }), b = !0), ao = "", ue = {}, b || eo();
    }
}
function Gn() {
  return wm;
}
function $m(t) {
  const e = Gn();
  e.last = t, e.lastTotal = t.total, Xe();
  const r = gl();
  r && Sm($e, r, "roll_results", {
    recordId: Ir("roll"),
    payload: t
  }).catch(() => {
  });
}
function $t() {
  return Array.isArray(js.activeStatuses) || (js.activeStatuses = []), js;
}
function Xe() {
  ev();
}
function Rm(t) {
  return Em(t);
}
function bl() {
  const t = gi().themeId;
  return dl(t);
}
function Cm(t) {
  return String(t?.tavernInstanceId ?? "").trim() || "unknown_tavern";
}
function Dm() {
  return Cm(hm());
}
function vl(t) {
  return { ...t };
}
function iv(t) {
  return !Ks || Ks.scopeKey !== t ? null : Ks.settings;
}
function ro(t, e) {
  Ks = {
    scopeKey: t,
    settings: vl(e)
  };
}
function Nm(t) {
  const e = Lm(), r = Dm(), n = e.write((o) => {
    const i = vl(o);
    return {
      ...typeof t == "function" ? t(
        i
      ) : {
        ...i,
        ...t ?? {}
      },
      theme: bl()
    };
  });
  return ro(r, n), n;
}
function lv(t, e = !1) {
  const r = Rm(t.theme), n = bl();
  return r !== n ? (km("ensureSettingsThemeMirrorEvent writing mirrored theme back to settings", {
    settingsTheme: r,
    sdkSettingsTheme: n,
    allowSeedFromLegacy: e,
    settingsTheme_raw: t.theme
  }), Nm({
    theme: n
  })) : t.theme === n ? t : {
    ...t,
    theme: n
  };
}
function cv(t) {
  const e = {
    ...Ln,
    ...t ?? {}
  };
  e.enabled = e.enabled !== !1, e.autoSendRuleToAI = e.autoSendRuleToAI !== !1, e.enableAiRollMode = e.enableAiRollMode !== !1, e.enableAiRoundControl = e.enableAiRoundControl === !0, e.enableExplodingDice = e.enableExplodingDice !== !1, e.enableAdvantageSystem = e.enableAdvantageSystem !== !1, e.enableDynamicResultGuidance = e.enableDynamicResultGuidance === !0, e.enableDynamicDcReason = e.enableDynamicDcReason !== !1, e.enableStatusSystem = e.enableStatusSystem !== !1, e.aiAllowedDiceSidesText = typeof t?.aiAllowedDiceSidesText == "string" ? String(t.aiAllowedDiceSidesText).trim() : Ln.aiAllowedDiceSidesText;
  const r = String(t?.theme ?? "").trim().toLowerCase();
  e.theme = r === "dark" || r === "light" || r === "tavern" ? r : r === "host" ? "tavern" : "default", e.enableOutcomeBranches = e.enableOutcomeBranches !== !1, e.enableExplodeOutcomeBranch = e.enableExplodeOutcomeBranch !== !1, e.includeOutcomeInSummary = e.includeOutcomeInSummary !== !1, e.showOutcomePreviewInListCard = e.showOutcomePreviewInListCard !== !1;
  const n = String(t?.summaryDetailMode || "").toLowerCase();
  e.summaryDetailMode = n === "balanced" || n === "detailed" ? n : "minimal";
  const o = Number(t?.summaryHistoryRounds), i = Number.isFinite(o) ? Math.floor(o) : Ln.summaryHistoryRounds;
  e.summaryHistoryRounds = Math.min(
    el,
    Math.max(tl, i)
  ), e.eventApplyScope = e.eventApplyScope === "all" ? "all" : "protagonist_only", e.enableTimeLimit = e.enableTimeLimit !== !1;
  const c = Number(e.minTimeLimitSeconds), d = Number.isFinite(c) ? Math.floor(c) : 10;
  e.minTimeLimitSeconds = Math.max(1, d), e.enableSkillSystem = e.enableSkillSystem !== !1, e.skillTableText = typeof e.skillTableText == "string" && e.skillTableText.trim().length > 0 ? e.skillTableText : "{}", e.skillPresetStoreText = Jn(
    typeof t?.skillPresetStoreText == "string" ? String(t.skillPresetStoreText) : "",
    e.skillTableText
  );
  const h = Qn(e.skillPresetStoreText);
  return h && (e.skillTableText = oo(h, e.skillTableText), e.skillPresetStoreText = JSON.stringify(h, null, 2)), Number(t?.ruleTextModeVersion) !== Rn && (e.ruleText = "", e.ruleTextModeVersion = Rn), Number(e.ruleTextModeVersion) !== Rn && (e.ruleTextModeVersion = Rn), e.ruleText = typeof e.ruleText == "string" ? e.ruleText : Gd, e;
}
function Lm() {
  return Ds || (Ds = Rb({
    namespace: $e,
    defaults: Ln,
    normalize: cv
  })), Bc || (Bc = !0, Ds.subscribe((t, e) => {
    ro(Cm(e), t), eo();
  })), Ds;
}
function Mm() {
  const t = Xn(), e = t?.saveChat ?? t?.saveChatConditional ?? t?.saveChatDebounced;
  if (typeof e == "function")
    try {
      Promise.resolve(e.call(t)).catch((r) => {
        ut.warn("保存聊天失败", r);
      });
    } catch (r) {
      ut.warn("保存聊天失败", r);
    }
}
function St() {
  const t = Dm(), e = iv(t), r = e ?? Lm().read();
  e || ro(t, r);
  const n = lv(r, !1);
  return n !== r && ro(t, n), vl(n);
}
function Om(t = $t()) {
  return Array.isArray(t.activeStatuses) || (t.activeStatuses = []), t.activeStatuses = ye(t.activeStatuses), t.activeStatuses;
}
function uv(t) {
  const e = $t();
  e.activeStatuses = ye(Array.isArray(t) ? t : []), Xe();
}
function Kn(t) {
  const e = t;
  km("updateSettingsEvent", {
    patch: t,
    patchTheme: e.theme ?? null,
    sdkThemeBefore: bl()
  });
  const r = e.theme != null ? Rm(e.theme) : null, { theme: n, ...o } = e;
  Nm(
    r == null ? o : {
      ...o,
      theme: r
    }
  );
}
function jn(t) {
  return String(t ?? "").trim().toLowerCase();
}
function Pm(t, e) {
  return {
    rowId: Ir("skill_row"),
    skillName: t,
    modifierText: e
  };
}
function dv(t) {
  const e = sn(t);
  if (e == null) return 0;
  try {
    const r = JSON.parse(e);
    return !r || typeof r != "object" || Array.isArray(r) ? 0 : Object.keys(r).length;
  } catch {
    return 0;
  }
}
function no(t = Date.now()) {
  return {
    id: Un,
    name: Ud,
    locked: !0,
    skillTableText: Hd,
    createdAt: t,
    updatedAt: t
  };
}
function nn(t = Date.now()) {
  const e = no(t);
  return {
    version: rl,
    activePresetId: e.id,
    presets: [e]
  };
}
function mv(t, e, r = "") {
  const n = String(e ?? "").trim() || nl, o = new Set(
    t.presets.filter((d) => d.id !== r).map((d) => jn(d.name))
  );
  let i = n, c = 2;
  for (; o.has(jn(i)); )
    i = `${n} ${c}`, c += 1;
  return i;
}
function Jn(t, e) {
  const r = Date.now(), n = String(t ?? "").trim();
  let o = null;
  if (n)
    try {
      o = JSON.parse(n);
    } catch {
      o = null;
    }
  const i = [], c = /* @__PURE__ */ new Set(), d = /* @__PURE__ */ new Set(), h = (E, y, $, O = !1) => {
    const D = String(E?.id ?? "").trim() || Ir("skill_preset");
    let G = D;
    for (; c.has(G); )
      G = `${D}_${Math.random().toString(36).slice(2, 7)}`;
    c.add(G);
    const K = String(E?.name ?? "").trim() || $;
    let X = K, F = 2;
    for (; d.has(jn(X)); )
      X = `${K} ${F}`, F += 1;
    d.add(jn(X));
    const z = sn(String(E?.skillTableText ?? "{}")) ?? "{}", Z = Number(E?.createdAt), H = Number.isFinite(Z) ? Z : r, B = Number(E?.updatedAt), tt = Number.isFinite(B) ? B : H;
    i.push({
      id: G,
      name: X,
      locked: !!(E?.locked || O),
      skillTableText: z,
      createdAt: H,
      updatedAt: tt
    });
  };
  o && typeof o == "object" && !Array.isArray(o) && Array.isArray(o.presets) && o.presets.forEach((E, y) => {
    h(E, y, `${nl} ${y + 1}`);
  });
  let f = i.find((E) => E.id === Un) ?? null;
  f ? (f.name = Ud, f.locked = !0) : (f = no(r), i.unshift(f)), i.length || i.push(no(r));
  let b = String(o?.activePresetId ?? "").trim();
  return (!b || !i.some((E) => E.id === b)) && (b = Un), JSON.stringify({
    version: rl,
    activePresetId: b,
    presets: i
  }, null, 2);
}
function Qn(t) {
  const e = String(t ?? "").trim();
  if (!e) return null;
  try {
    const r = JSON.parse(e);
    if (!r || typeof r != "object" || Array.isArray(r) || Number(r.version) !== rl || !Array.isArray(r.presets)) return null;
    const n = String(r.activePresetId ?? "").trim(), o = r.presets;
    return !n || !o.length ? null : r;
  } catch {
    return null;
  }
}
function Ja(t = St()) {
  const e = String(t.skillPresetStoreText ?? ""), r = Jn(
    e,
    t.skillTableText
  ), n = Qn(r);
  return n || nn();
}
function Qa(t, e) {
  const r = String(e ?? "").trim();
  return r ? t.presets.find((n) => n.id === r) ?? null : null;
}
function so(t) {
  const e = Qa(t, t.activePresetId);
  if (e) return e;
  const r = Qa(t, Un);
  return r || (t.presets[0] ?? no());
}
function oo(t, e = "{}") {
  const r = so(t), n = sn(r.skillTableText) ?? sn(e) ?? "{}";
  return r.skillTableText = n, n;
}
function Hc(t) {
  const e = St(), r = Jn(
    JSON.stringify(t),
    e.skillTableText
  ), n = Qn(r) ?? nn(), o = oo(
    n,
    e.skillTableText
  ), i = JSON.stringify(n, null, 2);
  Kn({
    skillPresetStoreText: i,
    skillTableText: o
  }), tv(i);
}
function Bm(t) {
  return JSON.stringify(
    t.map((e) => ({
      skillName: String(e.skillName ?? ""),
      modifierText: String(e.modifierText ?? "")
    }))
  );
}
function hv(t) {
  return typeof t == "string" ? t.trim() : "";
}
function xl(t) {
  return hv(t).toLowerCase();
}
function Um(t) {
  if (!t || typeof t != "object" || Array.isArray(t)) return null;
  const e = {};
  for (const [r, n] of Object.entries(t)) {
    const o = xl(r);
    if (!o) continue;
    const i = Number(n);
    Number.isFinite(i) && (e[o] = i);
  }
  return e;
}
function sn(t) {
  const e = String(t ?? "").trim();
  if (!e) return "{}";
  try {
    const r = JSON.parse(e), n = Um(r);
    return n == null ? null : JSON.stringify(n, null, 2);
  } catch {
    return null;
  }
}
let ao = "", ue = {};
function pv(t) {
  const e = String(t.skillTableText ?? "").trim();
  if (e === ao)
    return ue;
  if (ao = e, !e)
    return ue = {}, ue;
  try {
    const r = JSON.parse(e), n = Um(r);
    return n == null ? (ut.warn("skillTableText 不是合法 JSON 对象，已按空表处理。"), ue = {}, ue) : (ue = n, ue);
  } catch (r) {
    return ut.warn("skillTableText 解析失败，已按空表处理。", r), ue = {}, ue;
  }
}
function Lo(t, e = St()) {
  if (!e.enableSkillSystem) return 0;
  const r = xl(t);
  if (!r) return 0;
  const n = pv(e), o = Number(n[r] ?? 0);
  return Number.isFinite(o) ? o : 0;
}
function Hm(t) {
  const e = String(t ?? "").trim();
  if (!e) return [];
  try {
    const r = JSON.parse(e);
    return !r || typeof r != "object" || Array.isArray(r) ? [] : Object.entries(r).map(
      ([n, o]) => Pm(String(n ?? ""), String(o ?? ""))
    );
  } catch {
    return [];
  }
}
function zm(t) {
  const e = [], r = {}, n = /* @__PURE__ */ new Map(), o = /^[+-]?\d+$/;
  return t.forEach((i, c) => {
    const d = c + 1, h = String(i.skillName ?? ""), f = String(i.modifierText ?? ""), b = h.trim(), v = xl(b);
    let E = !1;
    b || (e.push(`第 ${d} 行：技能名不能为空`), E = !0);
    let y = 0;
    const $ = f.trim();
    if ($ ? o.test($) ? (y = Number($), Number.isFinite(y) || (e.push(`第 ${d} 行：加值必须是有限整数`), E = !0)) : (e.push(`第 ${d} 行：加值必须是整数`), E = !0) : (e.push(`第 ${d} 行：加值不能为空`), E = !0), v) {
      const O = n.get(v);
      O != null ? (e.push(`第 ${d} 行：技能名与第 ${O + 1} 行重复`), E = !0) : n.set(v, c);
    }
    !E && v && (r[v] = y);
  }), { errors: e, table: r };
}
function fv(t) {
  const e = zm(t);
  return e.errors.length > 0 ? null : JSON.stringify(e.table, null, 2);
}
const zc = 1e3, Gc = 1e3, Kc = 1e4;
function gv(t) {
  const e = String(t || "").trim();
  if (!e) return null;
  const r = e.match(/\[DICE_ALLOWED_SIDES\]([\s\S]*?)\[\/DICE_ALLOWED_SIDES\]/i), o = (r ? r[1] : e).match(/allowed_sides\s*=\s*([^\n\r]+)/i);
  if (!o) return null;
  const i = o[1].split(/[,\s]+/).map((c) => Number(String(c || "").trim())).filter((c) => Number.isFinite(c) && Number.isInteger(c) && c > 0);
  return i.length === 0 ? null : new Set(i);
}
function bv(t, e) {
  const r = Je(t), n = gv(e);
  if (!(!n || n.size === 0) && !n.has(r.sides))
    throw new Error(
      `当前规则不允许 d${r.sides}，allowed_sides=${Array.from(n).sort((o, i) => o - i).join(",")}`
    );
}
function Je(t) {
  const e = String(t || "").replace(/\s+/g, ""), r = /^(\d*)d(\d+)(!)?(?:(kh|kl)(\d+))?([+\-]\d+)?$/i, n = e.match(r);
  if (!n)
    throw new Error(`无效的骰子表达式：${t}，示例：1d20、3d6+2、2d20kh1`);
  const o = Number(n[1] || 1), i = Number(n[2]), c = !!n[3], d = String(n[4] || "").toLowerCase(), h = d === "kh" || d === "kl" ? d : void 0, f = h ? Number(n[5] || 0) : void 0, b = Number(n[6] || 0);
  if (!Number.isFinite(o) || !Number.isInteger(o) || o <= 0)
    throw new Error(`骰子数量无效：${o}`);
  if (!Number.isFinite(i) || !Number.isInteger(i) || i <= 0)
    throw new Error(`骰子面数无效：${i}`);
  if (o > zc)
    throw new Error(`骰子数量过大（${o}），上限 ${zc}`);
  if (i > Gc)
    throw new Error(`骰子面数过大（${i}），上限 ${Gc}`);
  if (h) {
    if (!Number.isFinite(f) || !Number.isInteger(f) || f <= 0)
      throw new Error(`kh/kl 参数无效：${t}`);
    if (f > o)
      throw new Error(`kh/kl 保留数量不能大于骰子数量：${t}`);
  }
  if (c && h)
    throw new Error("当前版本不支持 ! 与 kh/kl 同时使用");
  return { count: o, sides: i, modifier: b, explode: c, keepMode: h, keepCount: f };
}
function jc(t) {
  const e = Math.floor(t);
  if (typeof crypto < "u" && typeof crypto.getRandomValues == "function") {
    const r = new Uint32Array(1), n = Math.floor(4294967295 / e) * e;
    let o;
    do
      crypto.getRandomValues(r), o = r[0];
    while (o >= n);
    return o % e + 1;
  }
  return Math.floor(Math.random() * e) + 1;
}
function vv(t, e, r) {
  let n = jc(t);
  if (r.push(n), !!e)
    for (; n === t; ) {
      if (r.length >= Kc)
        throw new Error(`爆骰次数超过安全上限 ${Kc}，请调整表达式`);
      n = jc(t), r.push(n);
    }
}
function In(t) {
  const { count: e, sides: r, modifier: n, explode: o, keepMode: i, keepCount: c } = Je(t), d = St(), h = o && d.enableExplodingDice, f = [];
  for (let D = 0; D < e; D++)
    vv(r, h, f);
  let b, v, E = "none";
  if (i && c && c < f.length) {
    const D = f.map((P, K) => ({ value: P, index: K }));
    D.sort((P, K) => P.value === K.value ? P.index - K.index : i === "kh" ? K.value - P.value : P.value - K.value);
    const G = new Set(D.slice(0, c).map((P) => P.index));
    b = f.filter((P, K) => G.has(K)), v = f.filter((P, K) => !G.has(K)), E = i === "kh" ? "keep_highest" : "keep_lowest";
  } else i && c && (b = [...f], v = [], E = i === "kh" ? "keep_highest" : "keep_lowest");
  const $ = (Array.isArray(b) ? b : f).reduce((D, G) => D + G, 0), O = $ + n, L = h && f.length > e;
  return {
    expr: t,
    count: e,
    sides: r,
    modifier: n,
    rolls: f,
    rawTotal: $,
    total: O,
    keepMode: i,
    keepCount: c,
    keptRolls: b,
    droppedRolls: v,
    selectionMode: E,
    exploding: h,
    explosionTriggered: L
  };
}
function Gm(t, e = {}) {
  e.rule && bv(t, e.rule);
  let r = In(t);
  if (e.adv) {
    const n = In(t), o = In(t);
    r = n.total >= o.total ? n : o;
  }
  if (e.dis) {
    const n = In(t), o = In(t);
    r = n.total <= o.total ? n : o;
  }
  return r;
}
function xv(t, e, r) {
  if (r == null || !Number.isFinite(r)) return null;
  switch (e) {
    case ">=":
      return t >= r;
    case ">":
      return t > r;
    case "<=":
      return t <= r;
    case "<":
      return t < r;
    default:
      return null;
  }
}
const yv = [
  {
    version: "v1.1.6",
    date: "2026-03-13",
    sections: [
      {
        type: "added",
        items: [
          "为事件卡片新增移动端模板与样式，补齐移动端列表卡、列表项、结算卡和结果卡布局。",
          "新增移动端专用的事件列表卡、事件列表项、结算卡与结果卡 HTML 模板文件。"
        ]
      },
      {
        type: "changed",
        items: [
          "收紧事件 ROLLJSON 提示约束，明确只有 checkDice 含 ! 时才允许输出 explode 分支，避免爆骰分支与骰式不一致。",
          "调整设置页主题挂载范围，扩展列表标题条恢复跟随酒馆官方 inline-drawer 样式，仅内容区和弹窗继续使用 SDK 主题。"
        ]
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
        items: [
          "将事件卡片样式拆分到 html/roll-cards 目录，改为模板文件加样式文件的组织方式。",
          "重构设置页模板、事件渲染与部分运行时依赖，统一新的组件与主题接入方式。"
        ]
      },
      {
        type: "improved",
        items: [
          "增强事件卡片预览、调试与测试输入能力，便于持续调样和验收。",
          "优化事件列表项、结果卡和基础卡片样式细节，提升视觉一致性。"
        ]
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
        items: [
          "将原有设置页逻辑拆分到 uiCard、uiTheme、statusEditor、skillEditor 等模块，降低耦合。",
          "重构部分 Tavern SDK、主题能力与提示体系，统一设置页与组件层的调用入口。"
        ]
      },
      {
        type: "improved",
        items: [
          "补强共享按钮、共享复选框与全局提示样式，使设置页控件外观更统一。",
          "提升状态编辑与聊天维度存储链路的可维护性，为后续按聊天隔离数据打基础。"
        ]
      }
    ]
  },
  {
    version: "v1.1.3",
    date: "2026-03-09",
    sections: [
      {
        type: "added",
        items: [
          "在设置卡片中新增主题选择项。"
        ]
      },
      {
        type: "improved",
        items: [
          "更新设置卡片样式，支持默认、深色、浅色和酒馆主题。",
          "优化复选框与主题变量映射，使设置页控件风格与主题系统保持一致。"
        ]
      }
    ]
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
        items: [
          "修复 summary 内按钮误触发展开/收起的问题，确保检定操作与折叠交互互不干扰。"
        ]
      },
      {
        type: "changed",
        items: [
          "状态数据改为按 chatKey 隔离存储与编辑：当前聊天保存即时生效，非当前聊天写入目标聊天，不再污染当前运行态。"
        ]
      },
      {
        type: "added",
        items: [
          "新增 MemoryOS SDK Bus 集成，可探测安装与启用状态、读取 memory chat keys 并订阅状态广播；未安装或未启用时自动降级为本地模式。"
        ]
      }
    ]
  },
  {
    version: "v1.1.1",
    date: "2026-03-03",
    sections: [
      {
        type: "added",
        items: [
          "新增手机分辨率适配。",
          "新增状态修正功能，AI 可以设定角色状态并自动修正检定结果。",
          "新增“系统动态规则注入 + 用户补充规则”机制，系统会按当前开关自动生成事件骰子协议，规则文本改为只填写补充内容。",
          "新增聊天级持久化，技能预设与角色状态按聊天维度保存，切换聊天会自动装载对应配置。",
          "新增状态持续轮次机制，支持 turns/duration 并在轮次切换时自动衰减与清理。",
          "新增 SSHelper 输入区工具栏，支持“技能预览 / 状态预览”弹窗。"
        ]
      },
      {
        type: "improved",
        items: [
          "升级爆骰策略，AI 自动检测每轮允许的爆骰事件数量，超出上限时自动降级为普通掷骰并记录原因。",
          "重构事件卡片与结果卡样式，统一提示气泡、补充爆骰信息与状态变化摘要，并优化移动端展示。",
          "增强设置页，新增“恢复默认预设”按钮，状态编辑器支持持续轮次输入并强化校验提示。"
        ]
      }
    ]
  }
], Ta = "#stx-shared-tooltip{position:fixed;left:0;top:0;z-index:40000;opacity:0;pointer-events:none;visibility:hidden;transition:opacity .16s ease,transform .2s cubic-bezier(.22,1,.36,1),visibility 0s linear .16s;transform:translate3d(-9999px,-9999px,0);will-change:transform,opacity}#stx-shared-tooltip.is-visible{opacity:1;visibility:visible;transition:opacity .16s ease,transform .2s cubic-bezier(.22,1,.36,1),visibility 0s}#stx-shared-tooltip.is-instant{transition:none!important}#stx-shared-tooltip .stx-shared-tooltip-body{max-width:min(78vw,360px);min-width:72px;padding:8px 10px;border:1px solid var(--ss-theme-border, rgba(197, 160, 89, .55));border-radius:8px;background:var(--ss-theme-panel-bg, rgba(23, 21, 24, .96));backdrop-filter:var(--ss-theme-backdrop-filter, blur(3px));color:var(--ss-theme-text, #ecdcb8);font-size:12px;line-height:1.55;text-align:left;white-space:pre-wrap;box-shadow:var(--ss-theme-shadow, 0 8px 20px rgba(0, 0, 0, .45))}#stx-shared-tooltip[data-stx-tooltip-scope=rollhelper-card] .stx-shared-tooltip-body{border-color:var(--ss-theme-roll-tooltip-border, var(--ss-theme-border, rgba(197, 160, 89, .55)));background:var(--ss-theme-roll-tooltip-bg, var(--ss-theme-panel-bg, rgba(23, 21, 24, .96)));color:var(--ss-theme-roll-tooltip-text, var(--ss-theme-text, #ecdcb8));box-shadow:var(--ss-theme-roll-tooltip-shadow, var(--ss-theme-shadow, 0 8px 20px rgba(0, 0, 0, .45)))}html body [data-tip]:before,html body [data-tip]:after,html body [data-tip]:hover:before,html body [data-tip]:hover:after,html body [data-tip]:focus:before,html body [data-tip]:focus:after,html body [data-tip]:focus-visible:before,html body [data-tip]:focus-visible:after{content:none!important;display:none!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important}@media(prefers-reduced-motion:reduce){#stx-shared-tooltip{transition:none}}", qc = "stx-shared-tooltip-style", Fc = "stx-shared-tooltip", ka = "__stxSharedTooltipState", Vc = 1, Sv = 90, Ev = 180, _v = 420;
function io(t) {
  t.setAttribute("data-stx-shared-tooltip-runtime", "");
}
function Tv(t) {
  t && (typeof t.hideTimer == "number" && clearTimeout(t.hideTimer), typeof t.hideCleanupTimer == "number" && clearTimeout(t.hideCleanupTimer), typeof t.positionFrame == "number" && cancelAnimationFrame(t.positionFrame), typeof t.themeRefreshFrame == "number" && cancelAnimationFrame(t.themeRefreshFrame), t.hideTimer = null, t.hideCleanupTimer = null, t.positionFrame = null, t.themeRefreshFrame = null, t.activeTarget = null);
}
function kv(t) {
  t.unbindHandlers.forEach((e) => {
    try {
      e();
    } catch {
    }
  }), t.unbindHandlers = [], Tv(t), t.runtime?.root?.isConnected && t.runtime.root.remove(), t.runtime = null, t.bound = !1;
}
function wv() {
  const t = globalThis, e = t[ka];
  if (e)
    if (e.version !== Vc)
      kv(e), delete t[ka];
    else
      return e;
  const r = {
    version: Vc,
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
  return t[ka] = r, r;
}
function Iv() {
  const t = document.getElementById(qc);
  if (t) {
    t.textContent !== Ta && (t.textContent = Ta), io(t);
    return;
  }
  const e = document.createElement("style");
  e.id = qc, e.textContent = Ta, io(e), document.head.appendChild(e);
}
function Av(t) {
  return t?.closest("dialog[open]") || document.querySelector("dialog[open]") || document.body;
}
function Zn(t, e) {
  Iv();
  const r = Av(e);
  let n = document.getElementById(Fc);
  n ? n.parentElement !== r && r.appendChild(n) : (n = document.createElement("div"), n.id = Fc, r.appendChild(n)), io(n);
  let o = n.querySelector(".stx-shared-tooltip-body");
  return o || (o = document.createElement("div"), o.className = "stx-shared-tooltip-body", n.appendChild(o)), io(o), t.runtime = { root: n, body: o }, t.runtime;
}
function $v(t) {
  return t.closest('[data-ui="shared-checkbox"]');
}
function Rv(t) {
  return t.closest('[data-ui="shared-select"]');
}
function Cv(t) {
  return t.matches('[data-ui="shared-input"]') ? t : t.closest('[data-ui="shared-input"]');
}
function Dv(t) {
  return t.matches('[data-ui="shared-button"]') ? t : t.closest('[data-ui="shared-button"]');
}
function yl(t) {
  const e = $v(t);
  if (e)
    return e.querySelector('[data-tooltip-anchor="shared-checkbox-control"]') || e;
  const r = Rv(t);
  if (r)
    return r.querySelector('[data-tooltip-anchor="shared-select-trigger"]') || r.querySelector(".stx-shared-select-trigger") || r;
  const n = Cv(t);
  if (n) return n;
  const o = Dv(t);
  return o || t;
}
function jr(t) {
  if (!(t instanceof HTMLElement)) return null;
  const e = t.closest("[data-tip]");
  if (!e) return null;
  const r = String(e.dataset.tip ?? "").trim();
  if (!r) return null;
  const n = yl(e);
  return String(n.dataset.tip ?? "").trim() || (n.dataset.tip = r), n;
}
function Yc(t, e, r) {
  return t < e ? e : t > r ? r : t;
}
function Za(t) {
  if (!t.activeTarget) return;
  const e = Zn(t), n = yl(t.activeTarget).getBoundingClientRect(), o = n.left + n.width / 2, i = n.top - 8;
  e.root.classList.add("is-visible");
  const c = Math.max(80, e.root.offsetWidth), d = Math.max(32, e.root.offsetHeight), h = 8, f = Yc(o - c / 2, h, window.innerWidth - c - h);
  let b = i - d;
  b < h && (b = Yc(n.bottom + 10, h, window.innerHeight - d - h)), e.root.style.transform = `translate3d(${Math.round(f)}px, ${Math.round(b)}px, 0)`;
}
function lo(t) {
  t.positionFrame === null && (t.positionFrame = requestAnimationFrame(() => {
    t.positionFrame = null, t.activeTarget && Za(t);
  }));
}
function Km(t) {
  t.hideCleanupTimer !== null && (clearTimeout(t.hideCleanupTimer), t.hideCleanupTimer = null);
}
function jm(t) {
  t.body.style.width = "", t.body.style.maxWidth = "";
}
function Nv(t) {
  return t && t.closest(".st-rh-card-scope") ? "rollhelper-card" : "";
}
function Lv(t) {
  Km(t);
  const e = Zn(t);
  t.hideCleanupTimer = window.setTimeout(() => {
    t.hideCleanupTimer = null, !t.activeTarget && (e.root.removeAttribute("data-stx-tooltip-scope"), jm(e));
  }, Ev);
}
function qm(t) {
  t.hideTimer !== null && (clearTimeout(t.hideTimer), t.hideTimer = null);
  const e = Zn(t), r = Math.ceil(e.body.getBoundingClientRect().width);
  r > 0 && (e.body.style.width = `${r}px`, e.body.style.maxWidth = `${r}px`), e.root.classList.remove("is-visible"), t.activeTarget = null, t.positionFrame !== null && (cancelAnimationFrame(t.positionFrame), t.positionFrame = null), Lv(t);
}
function Wc(t) {
  t.hideTimer !== null && (clearTimeout(t.hideTimer), t.hideTimer = null), t.hideTimer = window.setTimeout(() => {
    t.hideTimer = null, qm(t);
  }, Sv);
}
function Mv(t) {
  t.themeRefreshFrame !== null && cancelAnimationFrame(t.themeRefreshFrame), t.themeRefreshFrame = requestAnimationFrame(() => {
    t.themeRefreshFrame = null, !(!t.runtime || !t.activeTarget?.isConnected) && (So(t.runtime.root), lo(t));
  });
}
function Xc(t, e) {
  const r = String(t.dataset.tip ?? "").trim();
  if (!r) {
    qm(e);
    return;
  }
  e.hideTimer !== null && (clearTimeout(e.hideTimer), e.hideTimer = null);
  const n = Zn(e, t);
  if (Km(e), jm(n), So(n.root), e.activeTarget === t && n.body.textContent === r && n.root.classList.contains("is-visible")) {
    lo(e);
    return;
  }
  const i = yl(t).getBoundingClientRect(), c = i.left + i.width / 2, d = i.top + i.height / 2, h = n.root.classList.contains("is-visible"), b = e.lastCenterX !== null && e.lastCenterY !== null ? Math.hypot(c - e.lastCenterX, d - e.lastCenterY) : 0, v = !h || b >= _v;
  e.activeTarget = t;
  const E = Nv(t);
  E ? n.root.setAttribute("data-stx-tooltip-scope", E) : n.root.removeAttribute("data-stx-tooltip-scope"), n.body.textContent = r, v ? (n.root.classList.add("is-instant"), Za(e), requestAnimationFrame(() => n.root.classList.remove("is-instant"))) : Za(e), e.lastCenterX = c, e.lastCenterY = d;
}
function qr(t, e, r, n, o) {
  const i = o ?? !1;
  e.addEventListener(r, n, i), t.unbindHandlers.push(() => e.removeEventListener(r, n, i));
}
function Ov(t) {
  qr(t, window, "pointerover", (e) => {
    const r = jr(e.target);
    r && Xc(r, t);
  }, !0), qr(t, window, "pointerout", (e) => {
    const r = jr(e.target);
    !r || jr(e.relatedTarget ?? null) || t.activeTarget === r && Wc(t);
  }, !0), qr(t, window, "focusin", (e) => {
    const r = jr(e.target);
    r && Xc(r, t);
  }, !0), qr(t, window, "focusout", (e) => {
    const r = jr(e.target);
    !r || jr(e.relatedTarget ?? null) || t.activeTarget === r && Wc(t);
  }, !0), qr(t, window, "scroll", () => {
    t.activeTarget && lo(t);
  }, !0), qr(t, window, "resize", () => {
    t.activeTarget && lo(t);
  }), t.unbindHandlers.push(
    bi(() => {
      t.runtime && t.activeTarget && Mv(t);
    })
  );
}
function Fm() {
  const t = wv();
  Zn(t), !t.bound && (Ov(t), t.bound = !0);
}
let Jc = !1;
const wa = /* @__PURE__ */ new WeakMap();
function Pv(t, e) {
  if (e === void 0) {
    console.info(`[SS-Helper][RollHelperThemeUI] ${t}`);
    return;
  }
  console.info(`[SS-Helper][RollHelperThemeUI] ${t}`, e);
}
function qs(t, e) {
  if (!(t instanceof HTMLElement)) return;
  const n = Yn(e) === "host";
  t.querySelectorAll(
    "input.st-roll-input, input.st-roll-search, select.st-roll-select, textarea.st-roll-textarea"
  ).forEach((o) => {
    o.classList.toggle("text_pole", n);
  }), t.querySelectorAll("button.st-roll-btn, button.st-roll-tab").forEach((o) => {
    o.classList.toggle("menu_button", n), o.classList.contains("st-roll-tab") ? o.classList.toggle("active", n && o.classList.contains("is-active")) : n || o.classList.remove("active");
  });
}
function xe(t) {
  if (!(t instanceof HTMLElement)) return;
  const e = t.closest("[id][data-ss-theme]");
  e && qs(e, e.getAttribute("data-ss-theme") || "default");
}
function Ia(t) {
  t instanceof HTMLElement && t.isConnected && So(t);
}
function Aa(t, e) {
  if (!(t instanceof HTMLElement)) return !1;
  const r = t.getAttribute("data-ss-theme");
  return r === null ? !1 : r !== e;
}
function Bv(t) {
  if (!t.isConnected) return;
  const e = t.parentNode;
  if (!e) return;
  const r = t.nextSibling;
  e.removeChild(t), r && r.parentNode === e ? e.insertBefore(t, r) : e.appendChild(t);
}
function $a(t) {
  if (!(t instanceof HTMLElement) || !t.isConnected) return;
  const e = wa.get(t);
  e && window.cancelAnimationFrame(e);
  const r = window.requestAnimationFrame(() => {
    wa.delete(t), Bv(t), Ei(t);
  });
  wa.set(t, r);
}
function Sl(t) {
  const e = Yn(t.selection), r = t.settingsRoot?.querySelector(".st-roll-shell") ?? null, n = t.settingsRoot?.querySelector(".st-roll-content") ?? null, o = t.skillModal?.querySelector(".st-roll-skill-modal-panel") ?? t.skillModal ?? null, i = t.statusModal?.querySelector(".st-roll-status-modal-panel") ?? t.statusModal ?? null, c = Aa(n, e), d = Aa(o, e), h = Aa(i, e);
  t.themeInput && (t.themeInput.value = t.themeInputValue ?? e), t.settingsRoot instanceof HTMLElement && yc(t.settingsRoot), r instanceof HTMLElement && yc(r), n && Ia(n), t.skillModal && Ia(t.skillModal), t.statusModal && Ia(t.statusModal), qs(n ?? t.settingsRoot, e), qs(t.skillModal, e), qs(t.statusModal, e), t.syncSharedSelectsEvent !== !1 && Ei(n ?? t.settingsRoot ?? document), c && $a(n), d && $a(o), h && $a(i), Pv("applySettingsThemeSelectionEvent", {
    selection: e,
    settingsRoot: t.settingsRoot ? {
      ssTheme: t.settingsRoot.getAttribute("data-ss-theme")
    } : null,
    content: n ? {
      ssTheme: n.getAttribute("data-ss-theme")
    } : null,
    skillModal: t.skillModal ? {
      ssTheme: t.skillModal.getAttribute("data-ss-theme")
    } : null,
    statusModal: t.statusModal ? {
      ssTheme: t.statusModal.getAttribute("data-ss-theme")
    } : null
  });
}
function Uv(t, e, r) {
  Jc || (Jc = !0, bi(() => {
    const n = document.getElementById(t), o = n?.querySelector('select.stx-shared-select-native[id$="-theme"]') ?? null, { themeId: i } = gi(), c = dl(i);
    Sl({
      settingsRoot: n,
      themeInput: o,
      skillModal: document.getElementById(e),
      statusModal: document.getElementById(r),
      selection: i,
      themeInputValue: c
    });
  }));
}
function xr() {
  Fm();
}
function Qc(t) {
  xr(), qu(t.root), Uv(
    t.SETTINGS_CARD_ID_Event,
    t.SETTINGS_SKILL_MODAL_ID_Event,
    t.SETTINGS_STATUS_MODAL_ID_Event
  ), t.syncSettingsBadgeVersionEvent();
}
function Hv(t) {
  const e = document.getElementById(t.SETTINGS_BADGE_ID_Event);
  e && (e.textContent = t.SETTINGS_BADGE_VERSION_Event);
}
function zv(t) {
  if (document.getElementById(t.SETTINGS_STYLE_ID_Event)) return;
  const e = document.createElement("style");
  e.id = t.SETTINGS_STYLE_ID_Event, e.textContent = t.buildSettingsCardStylesTemplateEvent(t.SETTINGS_CARD_ID_Event), document.head.appendChild(e);
}
function Gv(t) {
  const e = qf(
    yv,
    {
      emptyText: "暂无更新记录"
    }
  );
  return {
    cardId: t.SETTINGS_CARD_ID_Event,
    drawerToggleId: t.drawerToggleId,
    drawerContentId: t.drawerContentId,
    drawerIconId: t.drawerIconId,
    displayName: t.SETTINGS_DISPLAY_NAME_Event,
    badgeId: t.SETTINGS_BADGE_ID_Event,
    badgeText: t.SETTINGS_BADGE_VERSION_Event,
    authorText: t.SETTINGS_AUTHOR_TEXT_Event,
    emailText: t.SETTINGS_EMAIL_TEXT_Event,
    qqGroupText: "862731343",
    githubText: t.SETTINGS_GITHUB_TEXT_Event,
    githubUrl: t.SETTINGS_GITHUB_URL_Event,
    changelogHtml: e,
    searchId: t.SETTINGS_SEARCH_ID_Event,
    tabMainId: t.SETTINGS_TAB_MAIN_ID_Event,
    tabSkillId: t.SETTINGS_TAB_SKILL_ID_Event,
    tabRuleId: t.SETTINGS_TAB_RULE_ID_Event,
    tabAboutId: t.SETTINGS_TAB_ABOUT_ID_Event,
    panelMainId: t.SETTINGS_PANEL_MAIN_ID_Event,
    panelSkillId: t.SETTINGS_PANEL_SKILL_ID_Event,
    panelRuleId: t.SETTINGS_PANEL_RULE_ID_Event,
    panelAboutId: t.SETTINGS_PANEL_ABOUT_ID_Event,
    enabledId: t.SETTINGS_ENABLED_ID_Event,
    ruleId: t.SETTINGS_RULE_ID_Event,
    aiRollModeId: t.SETTINGS_AI_ROLL_MODE_ID_Event,
    aiRoundControlId: t.SETTINGS_AI_ROUND_CONTROL_ID_Event,
    explodingEnabledId: t.SETTINGS_EXPLODING_ENABLED_ID_Event,
    advantageEnabledId: t.SETTINGS_ADVANTAGE_ENABLED_ID_Event,
    dynamicResultGuidanceId: t.SETTINGS_DYNAMIC_RESULT_GUIDANCE_ID_Event,
    dynamicDcReasonId: t.SETTINGS_DYNAMIC_DC_REASON_ID_Event,
    statusSystemEnabledId: t.SETTINGS_STATUS_SYSTEM_ENABLED_ID_Event,
    statusEditorOpenId: t.SETTINGS_STATUS_EDITOR_OPEN_ID_Event,
    statusModalId: t.SETTINGS_STATUS_MODAL_ID_Event,
    statusModalCloseId: t.SETTINGS_STATUS_MODAL_CLOSE_ID_Event,
    statusRefreshId: t.SETTINGS_STATUS_REFRESH_ID_Event,
    statusCleanUnusedId: t.SETTINGS_STATUS_CLEAN_UNUSED_ID_Event,
    statusRowsId: t.SETTINGS_STATUS_ROWS_ID_Event,
    statusAddId: t.SETTINGS_STATUS_ADD_ID_Event,
    statusSaveId: t.SETTINGS_STATUS_SAVE_ID_Event,
    statusResetId: t.SETTINGS_STATUS_RESET_ID_Event,
    statusErrorsId: t.SETTINGS_STATUS_ERRORS_ID_Event,
    statusDirtyHintId: t.SETTINGS_STATUS_DIRTY_HINT_ID_Event,
    statusLayoutId: t.SETTINGS_STATUS_LAYOUT_ID_Event,
    statusSidebarId: t.SETTINGS_STATUS_SIDEBAR_ID_Event,
    statusSplitterId: t.SETTINGS_STATUS_SPLITTER_ID_Event,
    statusChatListId: t.SETTINGS_STATUS_CHAT_LIST_ID_Event,
    statusChatMetaId: t.SETTINGS_STATUS_CHAT_META_ID_Event,
    statusColsId: t.SETTINGS_STATUS_COLS_ID_Event,
    statusMemoryStateId: t.SETTINGS_STATUS_MEMORY_STATE_ID_Event,
    allowedDiceSidesId: t.SETTINGS_ALLOWED_DICE_SIDES_ID_Event,
    themeId: t.SETTINGS_THEME_ID_Event,
    summaryDetailId: t.SETTINGS_SUMMARY_DETAIL_ID_Event,
    summaryRoundsId: t.SETTINGS_SUMMARY_ROUNDS_ID_Event,
    scopeId: t.SETTINGS_SCOPE_ID_Event,
    outcomeBranchesId: t.SETTINGS_OUTCOME_BRANCHES_ID_Event,
    explodeOutcomeId: t.SETTINGS_EXPLODE_OUTCOME_ID_Event,
    includeOutcomeSummaryId: t.SETTINGS_SUMMARY_OUTCOME_ID_Event,
    listOutcomePreviewId: t.SETTINGS_LIST_OUTCOME_PREVIEW_ID_Event,
    timeLimitEnabledId: t.SETTINGS_TIME_LIMIT_ENABLED_ID_Event,
    timeLimitMinId: t.SETTINGS_TIME_LIMIT_MIN_ID_Event,
    timeLimitRowId: t.SETTINGS_TIME_LIMIT_ROW_ID_Event,
    skillEnabledId: t.SETTINGS_SKILL_ENABLED_ID_Event,
    skillEditorWrapId: t.SETTINGS_SKILL_EDITOR_WRAP_ID_Event,
    skillRowsId: t.SETTINGS_SKILL_ROWS_ID_Event,
    skillAddId: t.SETTINGS_SKILL_ADD_ID_Event,
    skillTextId: t.SETTINGS_SKILL_TEXT_ID_Event,
    skillImportToggleId: t.SETTINGS_SKILL_IMPORT_TOGGLE_ID_Event,
    skillImportAreaId: t.SETTINGS_SKILL_IMPORT_AREA_ID_Event,
    skillImportApplyId: t.SETTINGS_SKILL_IMPORT_APPLY_ID_Event,
    skillExportId: t.SETTINGS_SKILL_EXPORT_ID_Event,
    skillSaveId: t.SETTINGS_SKILL_SAVE_ID_Event,
    skillResetId: t.SETTINGS_SKILL_RESET_ID_Event,
    skillErrorsId: t.SETTINGS_SKILL_ERRORS_ID_Event,
    skillDirtyHintId: t.SETTINGS_SKILL_DIRTY_HINT_ID_Event,
    skillPresetLayoutId: t.SETTINGS_SKILL_PRESET_LAYOUT_ID_Event,
    skillPresetSidebarId: t.SETTINGS_SKILL_PRESET_SIDEBAR_ID_Event,
    skillPresetListId: t.SETTINGS_SKILL_PRESET_LIST_ID_Event,
    skillPresetCreateId: t.SETTINGS_SKILL_PRESET_CREATE_ID_Event,
    skillPresetDeleteId: t.SETTINGS_SKILL_PRESET_DELETE_ID_Event,
    skillPresetRestoreDefaultId: t.SETTINGS_SKILL_PRESET_RESTORE_DEFAULT_ID_Event,
    skillPresetNameId: t.SETTINGS_SKILL_PRESET_NAME_ID_Event,
    skillPresetRenameId: t.SETTINGS_SKILL_PRESET_RENAME_ID_Event,
    skillPresetMetaId: t.SETTINGS_SKILL_PRESET_META_ID_Event,
    skillEditorOpenId: t.SETTINGS_SKILL_EDITOR_OPEN_ID_Event,
    skillModalId: t.SETTINGS_SKILL_MODAL_ID_Event,
    skillModalCloseId: t.SETTINGS_SKILL_MODAL_CLOSE_ID_Event,
    ruleSaveId: t.SETTINGS_RULE_SAVE_ID_Event,
    ruleResetId: t.SETTINGS_RULE_RESET_ID_Event,
    ruleTextId: t.SETTINGS_RULE_TEXT_ID_Event
  };
}
function Vm(t, e = 0) {
  const r = Number.isFinite(t.retryLimitEvent) ? Number(t.retryLimitEvent) : 60, n = Number.isFinite(t.retryDelayMsEvent) ? Number(t.retryDelayMsEvent) : 500, o = `${t.SETTINGS_CARD_ID_Event}-toggle`, i = `${t.SETTINGS_CARD_ID_Event}-content`, c = `${t.SETTINGS_CARD_ID_Event}-icon`, d = t.buildSettingsCardTemplateIdsEvent(
    o,
    i,
    c
  ), h = document.getElementById(t.SETTINGS_CARD_ID_Event);
  if (h) {
    kc(h), Qc({
      root: h,
      SETTINGS_CARD_ID_Event: t.SETTINGS_CARD_ID_Event,
      SETTINGS_SKILL_MODAL_ID_Event: t.SETTINGS_SKILL_MODAL_ID_Event,
      SETTINGS_STATUS_MODAL_ID_Event: t.SETTINGS_STATUS_MODAL_ID_Event,
      syncSettingsBadgeVersionEvent: t.syncSettingsBadgeVersionEvent
    }), t.onMountedEvent({ drawerToggleId: o, drawerContentId: i }), t.syncSettingsUiEvent();
    return;
  }
  const f = document.getElementById("extensions_settings");
  if (!f) {
    e < r && setTimeout(() => Vm(t, e + 1), n);
    return;
  }
  t.ensureSettingsCardStylesEvent();
  const b = document.createElement("div");
  b.id = t.SETTINGS_CARD_ID_Event, b.innerHTML = t.buildSettingsCardHtmlTemplateEvent(d), kc(b);
  const v = b.querySelector(`#${t.SETTINGS_SKILL_MODAL_ID_Event}`);
  v && b.appendChild(v);
  const E = b.querySelector(`#${t.SETTINGS_STATUS_MODAL_ID_Event}`);
  E && b.appendChild(E);
  let y = document.getElementById("ss-helper-plugins-container");
  y || (y = document.createElement("div"), y.id = "ss-helper-plugins-container", f.prepend(y)), y.appendChild(b), Qc({
    root: b,
    SETTINGS_CARD_ID_Event: t.SETTINGS_CARD_ID_Event,
    SETTINGS_SKILL_MODAL_ID_Event: t.SETTINGS_SKILL_MODAL_ID_Event,
    SETTINGS_STATUS_MODAL_ID_Event: t.SETTINGS_STATUS_MODAL_ID_Event,
    syncSettingsBadgeVersionEvent: t.syncSettingsBadgeVersionEvent
  }), t.onMountedEvent({ drawerToggleId: o, drawerContentId: i }), t.syncSettingsUiEvent();
}
let Ym = "", ti = "recent", Wm = "", ei = "manual";
const re = /* @__PURE__ */ new Set();
let Zc = !1, Ra = null;
function Kv(t) {
  const e = t.querySelector(
    '[data-st-roll-role="preset-name-track"]'
  ), r = t.querySelector(
    '[data-st-roll-role="preset-name-segment"]'
  );
  return !e || !r ? null : { track: e, segment: r };
}
function jv(t) {
  const e = Kv(t);
  if (!e) return !1;
  const { track: r, segment: n } = e, o = Math.ceil(
    t.clientWidth || t.getBoundingClientRect().width || 0
  ), i = Math.ceil(
    n.scrollWidth || n.getBoundingClientRect().width || 0
  );
  if (o <= 0 || i <= 0) return !1;
  r.style.removeProperty("--st-roll-preset-marquee-distance"), r.style.removeProperty("--st-roll-preset-marquee-duration"), t.classList.remove("is-overflowing");
  const c = i - o;
  return c <= 2 || (t.classList.add("is-overflowing"), r.style.setProperty("--st-roll-preset-marquee-distance", `-${c}px`), r.style.setProperty(
    "--st-roll-preset-marquee-duration",
    `${Math.max(6, Math.min(18, c / 18 + 4))}s`
  )), !0;
}
function co(t = document) {
  const e = [];
  t instanceof HTMLElement && t.matches('[data-st-roll-role="preset-name-marquee"]') && e.push(t), t.querySelectorAll?.('[data-st-roll-role="preset-name-marquee"]').forEach((r) => {
    r instanceof HTMLElement && e.push(r);
  }), e.length !== 0 && e.forEach((r) => {
    jv(r);
  });
}
function qv() {
  Zc || (Zc = !0, window.addEventListener("resize", () => {
    window.requestAnimationFrame(() => {
      co(document);
    });
  }));
}
function Fv(t) {
  !(t instanceof HTMLElement) || typeof ResizeObserver > "u" || (Ra || (Ra = new ResizeObserver((e) => {
    e.forEach((r) => {
      r.target instanceof HTMLElement && co(r.target);
    });
  })), Ra.observe(t));
}
function Vv(t) {
  const e = document.getElementById(
    t.SETTINGS_SKILL_PRESET_LIST_ID_Event
  ), r = document.getElementById(
    t.SETTINGS_SKILL_PRESET_CREATE_ID_Event
  ), n = document.getElementById(
    t.SETTINGS_SKILL_PRESET_DELETE_ID_Event
  ), o = document.getElementById(
    t.SETTINGS_SKILL_PRESET_RESTORE_DEFAULT_ID_Event
  ), i = document.getElementById(
    t.SETTINGS_SKILL_PRESET_NAME_ID_Event
  ), c = document.getElementById(
    t.SETTINGS_SKILL_PRESET_RENAME_ID_Event
  );
  e?.addEventListener("click", (h) => {
    const b = h.target?.closest("button[data-skill-preset-id]");
    if (!b) return;
    const v = String(b.dataset.skillPresetId ?? "");
    if (!v || v === t.getSkillEditorActivePresetIdEvent() || !t.confirmDiscardSkillDraftEvent()) return;
    const E = t.getSettingsEvent(), y = t.getSkillPresetStoreEvent(E), $ = t.getSkillPresetByIdEvent(y, v);
    $ && (y.activePresetId = $.id, t.saveSkillPresetStoreEvent(y));
  }), r?.addEventListener("click", () => {
    if (!t.confirmDiscardSkillDraftEvent()) return;
    const h = t.getSettingsEvent(), f = t.getSkillPresetStoreEvent(h), b = t.getActiveSkillPresetEvent(f), v = Date.now(), E = t.getUniqueSkillPresetNameEvent(f, t.SKILL_PRESET_NEW_NAME_BASE_Event), y = {
      id: t.createIdEvent("skill_preset"),
      name: E,
      locked: !1,
      skillTableText: b.skillTableText,
      createdAt: v,
      updatedAt: v
    };
    f.presets.push(y), f.activePresetId = y.id, t.saveSkillPresetStoreEvent(f);
  }), n?.addEventListener("click", () => {
    const h = t.getSettingsEvent(), f = t.getSkillPresetStoreEvent(h), b = t.getActiveSkillPresetEvent(f);
    if (b.locked) {
      t.appendToConsoleEvent("⚠️ 默认预设不可删除。", "warn");
      return;
    }
    if (!t.confirmDiscardSkillDraftEvent() || !window.confirm(`确认删除预设「${b.name}」吗？`)) return;
    f.presets = f.presets.filter((y) => y.id !== b.id);
    const E = t.getSkillPresetByIdEvent(f, t.SKILL_PRESET_DEFAULT_ID_Event) ?? f.presets[0] ?? null;
    E ? f.activePresetId = E.id : (f.presets = t.buildDefaultSkillPresetStoreEvent().presets, f.activePresetId = t.SKILL_PRESET_DEFAULT_ID_Event), t.saveSkillPresetStoreEvent(f);
  }), o?.addEventListener("click", () => {
    if (!t.confirmDiscardSkillDraftEvent() || !window.confirm("确认将默认预设恢复为内置技能表吗？这会覆盖默认预设当前内容。")) return;
    const f = t.getSettingsEvent(), b = t.getSkillPresetStoreEvent(f);
    let v = t.getSkillPresetByIdEvent(b, t.SKILL_PRESET_DEFAULT_ID_Event);
    if (!v) {
      const E = t.buildDefaultSkillPresetStoreEvent(), y = t.getSkillPresetByIdEvent(E, t.SKILL_PRESET_DEFAULT_ID_Event) ?? E.presets[0] ?? null;
      if (!y) return;
      b.presets.unshift(y), v = y;
    }
    v.locked = !0, v.skillTableText = t.DEFAULT_SKILL_PRESET_TABLE_TEXT_Event, v.updatedAt = Date.now(), t.saveSkillPresetStoreEvent(b), t.renderSkillValidationErrorsEvent([]), t.appendToConsoleEvent("技能编辑器：默认预设已恢复。");
  });
  const d = () => {
    const h = String(i?.value ?? "").trim();
    if (!h) {
      t.renderSkillValidationErrorsEvent(["预设名称不能为空。"]);
      return;
    }
    const f = t.getSettingsEvent(), b = t.getSkillPresetStoreEvent(f), v = t.getActiveSkillPresetEvent(b);
    if (b.presets.some(
      (y) => y.id !== v.id && t.normalizeSkillPresetNameKeyEvent(y.name) === t.normalizeSkillPresetNameKeyEvent(h)
    )) {
      t.renderSkillValidationErrorsEvent(["预设名称重复，请使用其他名称。"]);
      return;
    }
    v.name = h, v.updatedAt = Date.now(), t.saveSkillPresetStoreEvent(b), t.renderSkillValidationErrorsEvent([]);
  };
  c?.addEventListener("click", d), i?.addEventListener("keydown", (h) => {
    h.key === "Enter" && (h.preventDefault(), d());
  });
}
function Yv(t) {
  return {
    getRows: t.getRowsEvent,
    setRows: t.setRowsEvent,
    getSnapshot: t.getSnapshotEvent,
    setSnapshot: t.setSnapshotEvent
  };
}
function Wv(t) {
  const e = document.getElementById(t.SETTINGS_SKILL_ROWS_ID_Event), r = document.getElementById(t.SETTINGS_SKILL_ADD_ID_Event), n = e?.closest(".st-roll-skill-modal"), o = n?.querySelector(".st-roll-skill-preset-search"), i = n?.querySelector(".st-roll-skill-preset-sort"), c = n?.querySelector(".st-roll-skill-row-search"), d = n?.querySelector(".st-roll-skill-row-sort"), h = n?.querySelector(".st-roll-skill-select-visible"), f = n?.querySelector(".st-roll-skill-clear-selection"), b = n?.querySelector(".st-roll-skill-batch-delete");
  e?.dataset.skillWorkbenchBound !== "1" && (e?.setAttribute("data-skill-workbench-bound", "1"), o?.addEventListener("input", () => {
    Ym = String(o.value ?? ""), t.renderSkillRowsEvent();
  }), i?.addEventListener("change", () => {
    const v = String(i.value ?? "recent");
    ti = v === "name" || v === "count" ? v : "recent", t.renderSkillRowsEvent();
  }), c?.addEventListener("input", () => {
    Wm = String(c.value ?? ""), t.renderSkillRowsEvent();
  }), d?.addEventListener("change", () => {
    const v = String(d.value ?? "manual");
    ei = v === "name" || v === "modifier_desc" ? v : "manual", t.renderSkillRowsEvent();
  }), h?.addEventListener("click", () => {
    El(t.skillDraftAccessorEvent.getRows()).forEach((v) => {
      re.add(String(v.rowId ?? ""));
    }), t.renderSkillRowsEvent();
  }), f?.addEventListener("click", () => {
    re.clear(), t.renderSkillRowsEvent();
  }), b?.addEventListener("click", () => {
    if (re.size <= 0) return;
    const v = t.skillDraftAccessorEvent.getRows().filter((E) => !re.has(String(E.rowId ?? "")));
    re.clear(), t.skillDraftAccessorEvent.setRows(v), t.renderSkillRowsEvent(), t.refreshSkillDraftDirtyStateEvent(), t.renderSkillValidationErrorsEvent([]);
  })), e?.addEventListener("input", (v) => {
    const E = v.target;
    if (!E) return;
    const y = String(E.dataset.skillRowId ?? ""), $ = String(E.dataset.skillField ?? "");
    if (!y || !$) return;
    const L = t.skillDraftAccessorEvent.getRows().find((D) => D.rowId === y);
    L && ($ === "name" ? L.skillName = E.value : $ === "modifier" && (L.modifierText = E.value), t.refreshSkillDraftDirtyStateEvent(), t.renderSkillValidationErrorsEvent([]));
  }), e?.addEventListener("change", (v) => {
    const E = v.target;
    if (!E) return;
    const y = String(E.dataset.skillSelectId ?? "");
    y && (E.checked ? re.add(y) : re.delete(y), Jm(t.skillDraftAccessorEvent.getRows()));
  }), e?.addEventListener("click", (v) => {
    const E = v.target, y = E?.closest("button[data-skill-duplicate-id]");
    if (y) {
      const G = String(y.dataset.skillDuplicateId ?? ""), P = t.skillDraftAccessorEvent.getRows(), K = P.findIndex((z) => z.rowId === G);
      if (K < 0) return;
      const X = P[K], F = [...P];
      F.splice(
        K + 1,
        0,
        t.createSkillEditorRowDraftEvent(String(X.skillName ?? ""), String(X.modifierText ?? ""))
      ), t.skillDraftAccessorEvent.setRows(F), t.renderSkillRowsEvent(), t.refreshSkillDraftDirtyStateEvent(), t.renderSkillValidationErrorsEvent([]);
      return;
    }
    const $ = E?.closest("button[data-skill-move-id]");
    if ($) {
      const G = String($.dataset.skillMoveId ?? ""), P = String($.dataset.skillMoveDirection ?? ""), K = [...t.skillDraftAccessorEvent.getRows()], X = K.findIndex((Z) => Z.rowId === G);
      if (X < 0) return;
      const F = P === "up" ? X - 1 : X + 1;
      if (F < 0 || F >= K.length) return;
      const [z] = K.splice(X, 1);
      K.splice(F, 0, z), t.skillDraftAccessorEvent.setRows(K), t.renderSkillRowsEvent(), t.refreshSkillDraftDirtyStateEvent(), t.renderSkillValidationErrorsEvent([]);
      return;
    }
    const O = E?.closest("button[data-skill-remove-id]");
    if (!O) return;
    const L = String(O.dataset.skillRemoveId ?? "");
    if (!L) return;
    re.delete(L);
    const D = t.skillDraftAccessorEvent.getRows().filter((G) => G.rowId !== L);
    t.skillDraftAccessorEvent.setRows(D), t.renderSkillRowsEvent(), t.refreshSkillDraftDirtyStateEvent(), t.renderSkillValidationErrorsEvent([]);
  }), r?.addEventListener("click", () => {
    const v = [
      ...t.skillDraftAccessorEvent.getRows(),
      t.createSkillEditorRowDraftEvent("", "")
    ];
    t.skillDraftAccessorEvent.setRows(v), t.renderSkillRowsEvent(), t.refreshSkillDraftDirtyStateEvent(), t.renderSkillValidationErrorsEvent([]);
  });
}
function Xv(t) {
  const e = document.getElementById(
    t.SETTINGS_SKILL_IMPORT_TOGGLE_ID_Event
  ), r = document.getElementById(
    t.SETTINGS_SKILL_IMPORT_AREA_ID_Event
  ), n = document.getElementById(
    t.SETTINGS_SKILL_TEXT_ID_Event
  ), o = document.getElementById(
    t.SETTINGS_SKILL_IMPORT_APPLY_ID_Event
  ), i = document.getElementById(
    t.SETTINGS_SKILL_EXPORT_ID_Event
  ), c = document.getElementById(
    t.SETTINGS_SKILL_SAVE_ID_Event
  ), d = document.getElementById(
    t.SETTINGS_SKILL_RESET_ID_Event
  );
  e?.addEventListener("click", () => {
    if (!r) return;
    const h = r.hidden;
    if (r.hidden = !h, e.textContent = h ? "收起导入" : "导入 JSON", !h || !n) return;
    const f = t.serializeSkillRowsToSkillTableTextEvent(t.skillDraftAccessorEvent.getRows());
    n.value = f ?? t.getActiveSkillPresetEvent(t.getSkillPresetStoreEvent(t.getSettingsEvent())).skillTableText;
  }), o?.addEventListener("click", () => {
    const h = String(n?.value ?? "");
    if (t.normalizeSkillTableTextForSettingsEvent(h) == null) {
      t.renderSkillValidationErrorsEvent([
        '导入失败：必须是 JSON 对象（例如 {"察觉":15,"说服":8}）。'
      ]);
      return;
    }
    const f = t.deserializeSkillTableTextToRowsEvent(h), b = t.validateSkillRowsEvent(f);
    if (b.errors.length > 0) {
      t.renderSkillValidationErrorsEvent(b.errors);
      return;
    }
    t.skillDraftAccessorEvent.setRows(f), t.renderSkillRowsEvent(), t.refreshSkillDraftDirtyStateEvent(), t.renderSkillValidationErrorsEvent([]);
  }), i?.addEventListener("click", () => {
    const h = t.validateSkillRowsEvent(t.skillDraftAccessorEvent.getRows()), f = t.getSettingsEvent(), b = t.getActiveSkillPresetEvent(t.getSkillPresetStoreEvent(f)), v = h.errors.length ? b.skillTableText : JSON.stringify(h.table, null, 2);
    h.errors.length > 0 ? t.renderSkillValidationErrorsEvent([
      "当前草稿有校验错误，已导出已保存的技能表。"
    ]) : t.renderSkillValidationErrorsEvent([]), t.copyTextToClipboardEvent(v).then((E) => {
      if (E) {
        t.appendToConsoleEvent("✅ 技能表 JSON 已复制到剪贴板。");
        return;
      }
      r && (r.hidden = !1), e && (e.textContent = "收起导入"), n && (n.value = v), t.appendToConsoleEvent("⚠️ 剪贴板不可用，请在导入框中手动复制 JSON。", "warn");
    });
  }), c?.addEventListener("click", () => {
    const h = t.validateSkillRowsEvent(t.skillDraftAccessorEvent.getRows());
    if (h.errors.length > 0) {
      t.renderSkillValidationErrorsEvent(h.errors), t.appendToConsoleEvent("❌ 技能表保存失败，请先修正校验错误。", "error");
      return;
    }
    const f = JSON.stringify(h.table, null, 2), b = t.deserializeSkillTableTextToRowsEvent(f);
    t.skillDraftAccessorEvent.setRows(b), t.skillDraftAccessorEvent.setSnapshot(t.buildSkillDraftSnapshotEvent(b));
    const v = t.getSettingsEvent(), E = t.getSkillPresetStoreEvent(v), y = t.getActiveSkillPresetEvent(E);
    y.skillTableText = f, y.updatedAt = Date.now(), t.renderSkillRowsEvent(), t.setSkillDraftDirtyEvent(!1), t.renderSkillValidationErrorsEvent([]), t.saveSkillPresetStoreEvent(E), n && (n.value = f);
  }), d?.addEventListener("click", () => {
    t.skillDraftAccessorEvent.setRows([]), t.renderSkillRowsEvent(), t.refreshSkillDraftDirtyStateEvent(), t.renderSkillValidationErrorsEvent([]);
  });
}
function Jv(t) {
  return t.isSkillDraftDirtyEvent() ? window.confirm("技能改动未保存，是否丢弃并继续？") ? (t.hydrateSkillDraftFromSettingsEvent(!0), !0) : !1 : !0;
}
function Qv(t) {
  if (!t || t.hidden) return !1;
  const e = window.getComputedStyle(t);
  return e.display !== "none" && e.visibility !== "hidden";
}
function Zv(t) {
  return !navigator.clipboard || typeof navigator.clipboard.writeText != "function" ? Promise.resolve(!1) : navigator.clipboard.writeText(t).then(() => !0).catch(() => !1);
}
function t0(t, e) {
  const r = document.getElementById(e.SETTINGS_SKILL_ERRORS_ID_Event);
  if (r) {
    if (!t.length) {
      r.hidden = !0, r.innerHTML = "";
      return;
    }
    r.hidden = !1, r.innerHTML = t.map((n) => `<div class="st-roll-skill-error-item">${e.escapeHtmlEvent(n)}</div>`).join("");
  }
}
function Xm(t, e, r) {
  const n = String(Ym ?? "").trim().toLowerCase(), o = String(t.activePresetId ?? ""), i = [...t.presets].filter((c) => n ? String(c.name ?? "").trim().toLowerCase().includes(n) : !0);
  return i.sort((c, d) => {
    if (ti === "name")
      return String(c.name ?? "").localeCompare(String(d.name ?? ""), "zh-Hans-CN");
    if (ti === "count") {
      const h = c.id === o && Number.isFinite(Number(r)) ? Number(r) : e(c.skillTableText), f = d.id === o && Number.isFinite(Number(r)) ? Number(r) : e(d.skillTableText);
      return h !== f ? f - h : String(c.name ?? "").localeCompare(String(d.name ?? ""), "zh-Hans-CN");
    }
    return Number(d.updatedAt ?? 0) - Number(c.updatedAt ?? 0);
  }), i;
}
function El(t) {
  const e = String(Wm ?? "").trim().toLowerCase(), r = [...t].filter((n) => e ? String(n.skillName ?? "").trim().toLowerCase().includes(e) : !0);
  return ei === "name" ? r.sort(
    (n, o) => String(n.skillName ?? "").localeCompare(String(o.skillName ?? ""), "zh-Hans-CN")
  ) : ei === "modifier_desc" && r.sort((n, o) => {
    const i = Number(n.modifierText ?? 0) || 0, c = Number(o.modifierText ?? 0) || 0;
    return i !== c ? c - i : String(n.skillName ?? "").localeCompare(String(o.skillName ?? ""), "zh-Hans-CN");
  }), r;
}
function Jm(t) {
  const e = document.querySelector(".st-roll-skill-modal");
  if (!e) return;
  const r = new Set(t.map((b) => String(b.rowId ?? "")));
  Array.from(re).forEach((b) => {
    r.has(b) || re.delete(b);
  });
  const n = El(t), o = n.filter(
    (b) => re.has(String(b.rowId ?? ""))
  ).length, i = re.size, c = e.querySelector(".st-roll-skill-selection-count");
  c && (c.textContent = o > 0 && o !== i ? `已选 ${i} 项（可见 ${o} 项）` : `已选 ${i} 项`);
  const d = e.querySelector(".st-roll-skill-batch-delete");
  d && (d.disabled = i <= 0);
  const h = e.querySelector(".st-roll-skill-clear-selection");
  h && (h.disabled = i <= 0);
  const f = e.querySelector(".st-roll-skill-select-visible");
  f && (f.disabled = n.length <= 0);
}
function e0(t, e) {
  const r = document.getElementById(e.SETTINGS_SKILL_PRESET_LIST_ID_Event);
  if (!r) return;
  if (!t.presets.length) {
    r.innerHTML = '<div class="st-roll-skill-preset-empty">暂无预设</div>', xe(r);
    return;
  }
  const n = Xm(
    t,
    e.countSkillEntriesFromSkillTableTextEvent,
    e.activeDraftCountEvent
  );
  if (!n.length) {
    r.innerHTML = '<div class="st-roll-skill-preset-empty">没有匹配的预设</div>', xe(r);
    return;
  }
  r.innerHTML = n.map((o) => {
    const i = o.id === t.activePresetId, c = i && Number.isFinite(Number(e.activeDraftCountEvent)) ? Number(e.activeDraftCountEvent) : e.countSkillEntriesFromSkillTableTextEvent(o.skillTableText), d = e.escapeAttrEvent(o.id), h = e.escapeHtmlEvent(o.name);
    return `
        <button type="button" class="st-roll-skill-preset-item ${i ? "is-active" : ""}" data-skill-preset-id="${d}">
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
  }).join(""), xe(r), qv(), Fv(r), co(r), window.requestAnimationFrame(() => {
    co(r);
  });
}
function r0(t, e) {
  const r = e.getActiveSkillPresetEvent(t), n = document.getElementById(e.SETTINGS_SKILL_PRESET_META_ID_Event);
  if (n) {
    const c = Number.isFinite(Number(e.activeDraftCountEvent)) ? Number(e.activeDraftCountEvent) : e.countSkillEntriesFromSkillTableTextEvent(r.skillTableText), d = Xm(
      t,
      e.countSkillEntriesFromSkillTableTextEvent,
      e.activeDraftCountEvent
    ).length;
    n.textContent = `当前：${r.name} · 技能 ${c} 项 · 可见预设 ${d}/${t.presets.length}`;
  }
  const o = document.getElementById(
    e.SETTINGS_SKILL_PRESET_NAME_ID_Event
  );
  o && o.value !== r.name && (o.value = r.name);
  const i = document.getElementById(
    e.SETTINGS_SKILL_PRESET_DELETE_ID_Event
  );
  i && (i.disabled = r.locked, i.style.opacity = r.locked ? "0.5" : "1", r.locked ? i.dataset.tip = "默认预设不可删除" : i.removeAttribute("data-tip"));
}
function n0(t, e) {
  const r = document.getElementById(e.SETTINGS_SKILL_ROWS_ID_Event);
  if (!r) return;
  const n = El(t);
  if (Jm(t), !t.length) {
    r.innerHTML = '<div class="st-roll-skill-empty">暂无技能，点击“新增技能”开始配置。</div>', xe(r), xr(r.closest(".st-roll-skill-modal") || r);
    return;
  }
  if (!n.length) {
    r.innerHTML = '<div class="st-roll-skill-empty">没有匹配的技能</div>', xe(r), xr(r.closest(".st-roll-skill-modal") || r);
    return;
  }
  r.innerHTML = n.map((o) => {
    const i = e.escapeAttrEvent(String(o.rowId ?? "")), c = e.escapeAttrEvent(String(o.skillName ?? "")), d = e.escapeAttrEvent(String(o.modifierText ?? ""));
    return `
      <div class="st-roll-skill-row" data-row-id="${i}">
        <div class="st-roll-skill-name-wrap">
          ${Fu({
      id: `st-roll-skill-row-select-${i}`,
      containerClassName: "st-roll-skill-row-select",
      attributes: {
        "data-tip": "选择这条技能"
      },
      inputAttributes: {
        "data-skill-select-id": i,
        checked: re.has(String(o.rowId ?? ""))
      }
    })}
          ${Gt({
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
        ${Gt({
      value: d,
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
          ${ct({
      label: "复制",
      variant: "secondary",
      iconClassName: "fa-solid fa-copy",
      className: "st-roll-skill-duplicate st-roll-toolbar-icon-btn",
      attributes: {
        "data-skill-duplicate-id": i,
        "data-tip": "复制这条技能"
      }
    })}
          ${ct({
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
          ${ct({
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
          ${ct({
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
  }).join(""), xe(r), xr(r.closest(".st-roll-skill-modal") || r);
}
function je(t) {
  return String(t ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/'/g, "&#39;");
}
function qe(t) {
  return je(t).replace(/\x60/g, "&#96;");
}
function dr(t, e, r = "") {
  return `
    <div class="${["st-roll-status-field", String(r ?? "").trim()].filter(Boolean).join(" ")}">
      <span class="st-roll-status-field-label">${je(t)}</span>
      <div class="st-roll-status-field-content">${e}</div>
    </div>
  `;
}
function s0(t, e) {
  return Be({
    id: "st-roll-status-scope-" + t,
    value: e === "all" ? "all" : "skills",
    containerClassName: "st-roll-status-scope-select",
    selectClassName: "st-roll-status-scope",
    selectAttributes: {
      "data-status-row-id": t,
      "data-status-field": "scope"
    },
    triggerAttributes: {
      "data-tip": "状态范围"
    },
    options: [
      { value: "skills", label: "按技能" },
      { value: "all", label: "全局" }
    ]
  });
}
let bt = [], yr = "", qn = !1, kr = "", ne = "", Ca = "", Qr = "记忆库：检测中", tu = !1, be = "closed", Fe = !1, Wr = null, Ns = 0, Ls = 0, Ms = 0, Os = 0, we = 0, eu = null, Da = 0, ru = !1, Na = null;
function o0(t) {
  const e = t.querySelector(
    '[data-st-roll-role="status-chat-name-track"]'
  ), r = t.querySelector(
    '[data-st-roll-role="status-chat-name-segment"]'
  );
  return !e || !r ? null : { track: e, segment: r };
}
function a0(t) {
  const e = o0(t);
  if (!e) return !1;
  const { track: r, segment: n } = e, o = Math.ceil(
    t.clientWidth || t.getBoundingClientRect().width || 0
  ), i = Math.ceil(
    n.scrollWidth || n.getBoundingClientRect().width || 0
  );
  if (o <= 0 || i <= 0) return !1;
  r.style.removeProperty("--st-roll-status-chat-marquee-distance"), r.style.removeProperty("--st-roll-status-chat-marquee-duration"), t.classList.remove("is-overflowing");
  const c = i - o;
  return c <= 2 || (t.classList.add("is-overflowing"), r.style.setProperty("--st-roll-status-chat-marquee-distance", `-${c}px`), r.style.setProperty(
    "--st-roll-status-chat-marquee-duration",
    `${Math.max(6, Math.min(18, c / 18 + 4))}s`
  )), !0;
}
function uo(t = document) {
  const e = [];
  t instanceof HTMLElement && t.matches('[data-st-roll-role="status-chat-name-marquee"]') && e.push(t), t.querySelectorAll?.('[data-st-roll-role="status-chat-name-marquee"]').forEach((r) => {
    r instanceof HTMLElement && e.push(r);
  }), e.length !== 0 && e.forEach((r) => {
    a0(r);
  });
}
function i0() {
  ru || (ru = !0, window.addEventListener("resize", () => {
    window.requestAnimationFrame(() => {
      uo(document);
    });
  }));
}
function l0(t) {
  !(t instanceof HTMLElement) || typeof ResizeObserver > "u" || (Na || (Na = new ResizeObserver((e) => {
    e.forEach((r) => {
      r.target instanceof HTMLElement && uo(r.target);
    });
  })), Na.observe(t));
}
const Yt = /* @__PURE__ */ new Map();
let Ve = [], Qm = "", Fs = "all", Zm = "", ri = "all", th = !1, hr = !1;
const Lt = /* @__PURE__ */ new Set(), eh = "st_roll_status_editor_layout_v1", Vs = {
  name: 120,
  modifier: 72,
  duration: 90,
  scope: 90,
  skills: 160,
  enabled: 80,
  actions: 70
}, On = {
  name: "--st-roll-status-col-name",
  modifier: "--st-roll-status-col-modifier",
  duration: "--st-roll-status-col-duration",
  scope: "--st-roll-status-col-scope",
  skills: "--st-roll-status-col-skills",
  enabled: "--st-roll-status-col-enabled",
  actions: "--st-roll-status-col-actions"
};
function rh(t) {
  return t ? t.querySelector(".st-roll-status-layout") : null;
}
function nu(t) {
  return String(t ?? "").trim().toLowerCase();
}
function c0(t) {
  return String(t ?? "").trim().toLowerCase();
}
function u0(t) {
  const e = String(t ?? "").trim();
  if (!e) return [];
  const r = e.split("|").map((n) => c0(n)).filter(Boolean);
  return Array.from(new Set(r));
}
function ni(t = "", e = "", r = "", n = "skills", o = "", i = !0) {
  return {
    rowId: `status_row_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    name: t,
    modifierText: e,
    durationText: r,
    scope: n,
    skillsText: o,
    enabled: i
  };
}
function mo(t) {
  return JSON.stringify(
    t.map((e) => ({
      name: String(e.name ?? ""),
      modifierText: String(e.modifierText ?? ""),
      durationText: String(e.durationText ?? ""),
      scope: e.scope === "all" ? "all" : "skills",
      skillsText: String(e.skillsText ?? ""),
      enabled: e.enabled !== !1
    }))
  );
}
function nh(t) {
  return JSON.stringify(
    (Array.isArray(t) ? t : []).map((e) => ({
      name: String(e.name ?? ""),
      modifier: Number(e.modifier ?? 0),
      scope: e.scope === "all" ? "all" : "skills",
      skills: e.scope === "all" ? [] : Array.isArray(e.skills) ? e.skills : [],
      remainingRounds: e.remainingRounds == null ? null : Number(e.remainingRounds),
      enabled: e.enabled !== !1
    }))
  );
}
function sh(t) {
  return document.getElementById(t)?.closest(".st-roll-status-modal-panel");
}
function qt(t, e) {
  const r = document.getElementById(t);
  if (r) {
    if (!e.length) {
      r.hidden = !0, r.innerHTML = "";
      return;
    }
    r.hidden = !1, r.innerHTML = e.map((n) => `<div class="st-roll-status-error-item">${je(n)}</div>`).join("");
  }
}
function Mo(t) {
  const e = String(Zm ?? "").trim().toLowerCase();
  return t.filter((r) => th && r.enabled === !1 || ri === "skills" && r.scope !== "skills" || ri === "global" && r.scope !== "all" ? !1 : e ? String(r.name ?? "").trim().toLowerCase().includes(e) : !0);
}
function d0() {
  const t = String(Qm ?? "").trim().toLowerCase();
  return Ve.filter((e) => {
    if (Fs === "current" && !e.isCurrent || Fs === "local" && !e.fromRollLocal || Fs === "memory" && !e.fromMemory) return !1;
    if (!t) return !0;
    const r = String(e.chatId ?? "").toLowerCase(), n = String(e.displayName ?? "").toLowerCase();
    return r.includes(t) || n.includes(t);
  });
}
function oh(t) {
  const e = document.getElementById(t), r = e?.closest(".st-roll-status-modal");
  if (!e || !r) return;
  const n = new Set(bt.map((f) => String(f.rowId ?? "")));
  Array.from(Lt).forEach((f) => {
    n.has(f) || Lt.delete(f);
  });
  const o = Mo(bt), i = o.filter(
    (f) => Lt.has(String(f.rowId ?? ""))
  ).length, c = Lt.size, d = r.querySelector(".st-roll-status-selection-count");
  d && (d.textContent = i > 0 && i !== c ? `已选 ${c} 项（可见 ${i} 项）` : `已选 ${c} 项`), [
    ".st-roll-status-batch-enable",
    ".st-roll-status-batch-disable",
    ".st-roll-status-batch-delete"
  ].forEach((f) => {
    const b = r.querySelector(f);
    b && (b.disabled = c <= 0);
  });
  const h = r.querySelector(".st-roll-status-select-visible");
  h && (h.disabled = o.length <= 0);
}
function Xr(t) {
  const e = document.getElementById(t);
  if (!e) return;
  e.disabled = hr;
  const r = e.querySelector(".stx-shared-button-label");
  r && (r.textContent = hr ? "刷新中" : "刷新");
}
function Sr(t, e, r) {
  return !Number.isFinite(t) || e > r ? e : Math.max(e, Math.min(r, t));
}
function ah(t) {
  const r = document.getElementById(t)?.closest(".st-roll-status-modal");
  if (!r || !r.querySelector(".st-roll-status-main")) return null;
  const o = r.querySelector(".st-roll-status-layout"), i = r.querySelector(".st-roll-status-modal-body");
  return { modal: r, layout: o, body: i };
}
function si(t) {
  const e = ah(t), r = Number(
    e?.layout?.clientHeight ?? e?.body?.clientHeight ?? window.visualViewport?.height ?? window.innerHeight ?? 0
  ), n = Sr(Math.round(r), 320, 2e3), i = Sr(
    n - 8,
    280,
    n
  ), c = Sr(
    Math.round(n * 0.5),
    240,
    Math.max(240, i - 56)
  ), d = Math.max(0, Math.round(i - c)), h = Math.max(Math.round(i + 72), d + 120);
  return { fullHeight: i, halfTranslate: d, closedTranslate: h };
}
function m0(t, e) {
  return t === "full" ? 0 : t === "half" ? e.halfTranslate : e.closedTranslate;
}
function su(t, e, r) {
  const n = r.halfTranslate + (r.closedTranslate - r.halfTranslate) * 0.42;
  if (t >= n || e >= 1.05) return "closed";
  if (e <= -0.9) return "full";
  if (e >= 0.85) return "half";
  const o = Math.abs(t), i = Math.abs(t - r.halfTranslate);
  return o <= i ? "full" : "half";
}
function Ue(t) {
  const e = ah(t);
  if (!e) return null;
  const r = si(t), n = m0(
    be,
    r
  );
  we = Sr(
    Fe ? we : n,
    0,
    r.closedTranslate
  );
  const i = r.closedTranslate <= 0 ? 0 : Sr(
    1 - we / r.closedTranslate,
    0,
    1
  );
  return e.modal.dataset.mobileSheetState = be, e.modal.classList.toggle(
    "is-mobile-sheet-open",
    be !== "closed"
  ), e.modal.classList.toggle(
    "is-mobile-sheet-expanded",
    be === "full"
  ), e.modal.classList.toggle("is-mobile-sheet-dragging", Fe), e.modal.style.setProperty("--st-roll-status-mobile-sheet-height", `${r.fullHeight}px`), e.modal.style.setProperty(
    "--st-roll-status-mobile-sheet-translate",
    `${we}px`
  ), e.modal.style.setProperty(
    "--st-roll-status-mobile-sheet-backdrop-opacity",
    i.toFixed(3)
  ), r;
}
function Oo(t, e) {
  be = e, Fe = !1, Wr = null, Ue(t);
}
function oi(t) {
  Oo(t, "half");
}
function ai(t) {
  Oo(t, "closed");
}
function h0(t) {
  Oo(t, "full");
}
function p0(t) {
  Oo(t, "half");
}
function f0(t) {
  if (be === "closed") {
    oi(t);
    return;
  }
  if (be === "full") {
    p0(t);
    return;
  }
  h0(t);
}
function Er(t, e) {
  qn = !!t;
  const r = document.getElementById(e);
  r && (r.hidden = !qn);
}
function Ft(t) {
  const e = document.getElementById(t);
  if (!e) return;
  const r = Mo(bt);
  if (oh(t), !bt.length) {
    e.innerHTML = '<div class="st-roll-status-empty">暂无状态，点击“新增状态”开始配置。</div>', xe(e), xr(e.closest(".st-roll-status-modal") || e);
    return;
  }
  if (!r.length) {
    e.innerHTML = '<div class="st-roll-status-empty">没有匹配的状态</div>', xe(e), xr(e.closest(".st-roll-status-modal") || e);
    return;
  }
  const n = r.map((o) => {
    const i = qe(String(o.rowId ?? "")), c = qe(String(o.name ?? "")), d = qe(String(o.modifierText ?? "")), h = qe(String(o.durationText ?? "")), f = o.scope === "all" ? "all" : "skills", b = qe(String(o.skillsText ?? "")), v = o.enabled !== !1, E = f === "all" ? "范围为全局时会忽略此项" : "例如：反应|潜行", y = dr(
      "名称",
      `
          <div class="st-roll-status-name-wrap">
            ${Fu({
        id: `st-roll-status-row-select-${i}`,
        containerClassName: "st-roll-status-row-select",
        attributes: {
          "data-tip": "选择这条状态"
        },
        inputAttributes: {
          "data-status-select-id": i,
          checked: Lt.has(String(o.rowId ?? ""))
        }
      })}
            ${Gt({
        value: c,
        className: "st-roll-status-name",
        attributes: {
          "data-status-row-id": i,
          "data-status-field": "name",
          "data-tip": "状态名称。",
          placeholder: "状态名称"
        }
      })}
          </div>
        `,
      "st-roll-status-field-name"
    ), $ = dr(
      "修正",
      Gt({
        value: d,
        type: "number",
        className: "st-roll-status-modifier",
        attributes: {
          inputmode: "numeric",
          step: 1,
          "data-status-row-id": i,
          "data-status-field": "modifier",
          "data-tip": "状态加减值，必须是整数。",
          placeholder: "例如 -2"
        }
      }),
      "st-roll-status-field-modifier"
    ), O = dr(
      "轮次",
      Gt({
        value: h,
        type: "number",
        className: "st-roll-status-duration",
        attributes: {
          inputmode: "numeric",
          min: 1,
          step: 1,
          "data-status-row-id": i,
          "data-status-field": "duration",
          "data-tip": "持续轮次，留空表示永久。",
          placeholder: "留空=永久，例如 3"
        }
      }),
      "st-roll-status-field-duration"
    ), L = dr(
      "范围",
      s0(i, f),
      "st-roll-status-field-scope"
    ), D = dr(
      "技能",
      Gt({
        value: b,
        className: "st-roll-status-skills",
        disabled: f === "all",
        attributes: {
          "data-status-row-id": i,
          "data-status-field": "skills",
          "data-tip": "技能范围，用 | 分隔。",
          placeholder: E
        }
      }),
      "st-roll-status-field-skills"
    ), G = dr(
      "",
      Pu({
        id: `st-roll-status-enabled-${i}`,
        title: "启用",
        checkedLabel: "开",
        uncheckedLabel: "关",
        containerClassName: "st-roll-status-enabled-card",
        copyClassName: "st-roll-status-enabled-copy",
        titleClassName: "st-roll-status-enabled-title",
        controlClassName: "st-roll-status-enabled-control",
        inputAttributes: {
          "data-status-row-id": i,
          "data-status-field": "enabled",
          "data-tip": "是否启用该状态。",
          checked: v
        }
      }),
      "st-roll-status-field-enabled"
    ), P = dr(
      "操作",
      `
          <div class="st-roll-status-actions-group">
            ${ct({
        label: "复制",
        variant: "secondary",
        iconClassName: "fa-solid fa-copy",
        className: "st-roll-status-duplicate st-roll-toolbar-icon-btn",
        attributes: {
          "data-status-duplicate-id": i,
          "data-tip": "复制这条状态。",
          "aria-label": "复制状态"
        }
      })}
            ${ct({
        label: "删除",
        variant: "danger",
        iconClassName: "fa-solid fa-trash",
        className: "st-roll-status-remove st-roll-toolbar-icon-btn",
        attributes: {
          "data-status-remove-id": i,
          "data-tip": "删除这条状态。",
          "aria-label": "删除状态"
        }
      })}
          </div>
        `,
      "st-roll-status-field-actions"
    );
    return `
        <div class="st-roll-status-row" data-row-id="${i}">
          ${y}
          ${$}
          ${O}
          ${L}
          ${D}
          <div class="st-roll-status-bottom-grid">
            ${G}
            ${P}
          </div>
        </div>
      `;
  }).join("");
  e.innerHTML = n, qu(e), xe(e), xr(e.closest(".st-roll-status-modal") || e);
}
function _l(t) {
  return (Array.isArray(t) ? t : []).map(
    (e) => ni(
      String(e.name ?? ""),
      String(e.modifier ?? 0),
      e.remainingRounds == null ? "" : String(e.remainingRounds),
      e.scope === "all" ? "all" : "skills",
      e.scope === "all" ? "" : (Array.isArray(e.skills) ? e.skills : []).join("|"),
      e.enabled !== !1
    )
  );
}
function g0(t, e) {
  const r = [], n = [], o = /* @__PURE__ */ new Map(), i = /* @__PURE__ */ new Map();
  for (const h of e || []) {
    const f = nu(h.name);
    f && i.set(f, h);
  }
  const c = /^[+-]?\d+$/, d = Date.now();
  return t.forEach((h, f) => {
    const b = f + 1, v = String(h.name ?? "").trim(), E = nu(v), y = String(h.modifierText ?? "").trim(), $ = String(h.durationText ?? "").trim(), O = h.scope === "all" ? "all" : "skills", L = O === "all" ? [] : u0(String(h.skillsText ?? ""));
    let D = !1;
    if (v || (r.push(`第 ${b} 行：名称不能为空`), D = !0), E) {
      const X = o.get(E);
      X != null ? (r.push(`第 ${b} 行：名称与第 ${X + 1} 行重复`), D = !0) : o.set(E, f);
    }
    y ? c.test(y) || (r.push(`第 ${b} 行：修正值必须为整数`), D = !0) : (r.push(`第 ${b} 行：修正值不能为空`), D = !0);
    let G = null;
    if ($)
      if (!c.test($))
        r.push(`第 ${b} 行：持续轮次必须为整数（留空表示永久）`), D = !0;
      else {
        const X = Math.floor(Number($));
        !Number.isFinite(X) || X < 1 ? (r.push(`第 ${b} 行：持续轮次必须 >= 1（留空表示永久）`), D = !0) : G = X;
      }
    if (O === "skills" && L.length <= 0 && (r.push(`第 ${b} 行：范围为“按技能”时，技能列表不能为空`), D = !0), D) return;
    const P = Number(y), K = i.get(E);
    n.push({
      name: v,
      modifier: P,
      remainingRounds: G,
      scope: O,
      skills: L,
      enabled: h.enabled !== !1,
      createdAt: K?.createdAt ?? d,
      updatedAt: d,
      source: "manual_editor"
    });
  }), { errors: r, statuses: n };
}
function ih(t, e, r, n = !1) {
  const o = document.getElementById(e), i = JSON.stringify(
    (Array.isArray(t) ? t : []).map((c) => ({
      name: c.name,
      modifier: c.modifier,
      scope: c.scope,
      skills: c.scope === "all" ? [] : c.skills,
      remainingRounds: c.remainingRounds ?? null,
      enabled: c.enabled !== !1
    }))
  );
  !n && qn && o?.hasChildNodes() || !n && i === kr && o?.hasChildNodes() || (Lt.clear(), bt = _l(t), yr = mo(bt), kr = i, Er(!1, r), Ft(e));
}
function ho(t, e, r) {
  return Math.min(r, Math.max(e, t));
}
function Tl() {
  const t = pm(
    $e,
    eh,
    null
  );
  return !t || typeof t != "object" ? {} : t;
}
function lh(t) {
  fm(
    $e,
    eh,
    t
  );
}
function b0(t) {
  const e = sh(t);
  if (!e) return;
  const r = rh(e), n = Tl(), o = Number(n.sidebarWidth);
  if (Number.isFinite(o)) {
    const c = ho(o, 220, 520);
    r?.style.setProperty("--st-roll-status-sidebar-width", `${c}px`), e.style.setProperty("--st-roll-status-sidebar-width", `${c}px`);
  }
  const i = n.columns ?? {};
  Object.keys(On).forEach((c) => {
    const d = Number(i[c]);
    if (!Number.isFinite(d)) return;
    const h = ho(d, Vs[c], 520);
    e.style.setProperty(On[c], `${h}px`);
  });
}
function ch(t, e) {
  const r = t.closest(".st-roll-status-modal-panel");
  return r || sh(e);
}
function v0(t, e) {
  if (t.dataset.statusSplitterResizeBound === "1") return;
  t.dataset.statusSplitterResizeBound = "1", t.style.touchAction = "none";
  let r = null, n = null, o = null, i = 0, c = 300, d = !1;
  const h = (D) => {
    if (!d || !r) return;
    const G = ho(c + (D - i), 220, 520);
    n?.style.setProperty("--st-roll-status-sidebar-width", `${G}px`), r.style.setProperty("--st-roll-status-sidebar-width", `${G}px`);
  }, f = () => {
    if (!r) return;
    const D = n || r, G = Number.parseFloat(
      getComputedStyle(D).getPropertyValue("--st-roll-status-sidebar-width")
    );
    if (!Number.isFinite(G)) return;
    const P = Tl();
    lh({
      ...P,
      sidebarWidth: G
    });
  }, b = (D) => {
    if (d) {
      if (D && f(), d = !1, t.classList.remove("is-resizing"), window.removeEventListener("pointermove", E), window.removeEventListener("pointerup", y), window.removeEventListener("pointercancel", $), window.removeEventListener("mousemove", O), window.removeEventListener("mouseup", L), o != null)
        try {
          t.hasPointerCapture(o) && t.releasePointerCapture(o);
        } catch {
        }
      o = null, n = null, r = null;
    }
  }, v = (D, G) => {
    const P = ch(t, e);
    if (!P) return;
    r = P, n = rh(P), o = G, i = D;
    const K = t.previousElementSibling;
    if (c = Math.max(220, Math.round(K?.getBoundingClientRect().width ?? 300)), d = !0, t.classList.add("is-resizing"), window.addEventListener("pointermove", E), window.addEventListener("pointerup", y), window.addEventListener("pointercancel", $), window.addEventListener("mousemove", O), window.addEventListener("mouseup", L), G != null)
      try {
        t.setPointerCapture(G);
      } catch {
      }
  }, E = (D) => {
    d && (o != null && D.pointerId !== o || h(D.clientX));
  }, y = (D) => {
    d && (o != null && D.pointerId !== o || b(!0));
  }, $ = (D) => {
    d && (o != null && D.pointerId !== o || b(!1));
  }, O = (D) => {
    !d || o != null || h(D.clientX);
  }, L = () => {
    !d || o != null || b(!0);
  };
  t.addEventListener("pointerdown", (D) => {
    D.pointerType === "mouse" && D.button !== 0 || (D.preventDefault(), D.stopPropagation(), d && b(!1), v(D.clientX, D.pointerId));
  }), t.addEventListener("mousedown", (D) => {
    D.button === 0 && (d || (D.preventDefault(), D.stopPropagation(), v(D.clientX, null)));
  });
}
function x0(t, e) {
  if (t.dataset.statusColsResizeBound === "1") return;
  t.dataset.statusColsResizeBound = "1";
  let r = null, n = null, o = null, i = null, c = 0, d = 0, h = !1;
  const f = (P) => {
    if (!h || !r || !o) return;
    const K = ho(
      d + (P - c),
      Vs[o],
      520
    );
    r.style.setProperty(On[o], `${K}px`);
  }, b = () => {
    if (!r || !o) return;
    const P = Number.parseFloat(
      getComputedStyle(r).getPropertyValue(On[o])
    );
    if (!Number.isFinite(P)) return;
    const K = Tl();
    lh({
      ...K,
      columns: {
        ...K.columns ?? {},
        [o]: P
      }
    });
  }, v = (P) => {
    if (h) {
      if (P && b(), h = !1, n?.classList.remove("is-resizing"), window.removeEventListener("pointermove", y), window.removeEventListener("pointerup", $), window.removeEventListener("pointercancel", O), window.removeEventListener("mousemove", L), window.removeEventListener("mouseup", D), n && i != null)
        try {
          n.hasPointerCapture(i) && n.releasePointerCapture(i);
        } catch {
        }
      r = null, n = null, o = null, i = null;
    }
  }, E = (P, K, X, F) => {
    const z = ch(t, e);
    if (!z) return;
    r = z, n = P, o = K, i = F;
    const Z = t.querySelector(`[data-status-col-key="${K}"]`);
    if (c = X, d = Math.max(
      Vs[K],
      Math.round(Z?.getBoundingClientRect().width ?? Vs[K])
    ), h = !0, P.style.touchAction = "none", P.classList.add("is-resizing"), window.addEventListener("pointermove", y), window.addEventListener("pointerup", $), window.addEventListener("pointercancel", O), window.addEventListener("mousemove", L), window.addEventListener("mouseup", D), F != null)
      try {
        P.setPointerCapture(F);
      } catch {
      }
  }, y = (P) => {
    h && (i != null && P.pointerId !== i || f(P.clientX));
  }, $ = (P) => {
    h && (i != null && P.pointerId !== i || v(!0));
  }, O = (P) => {
    h && (i != null && P.pointerId !== i || v(!1));
  }, L = (P) => {
    !h || i != null || f(P.clientX);
  }, D = () => {
    !h || i != null || v(!0);
  }, G = (P) => {
    const X = P?.closest("[data-status-col-resize-key]");
    if (!X) return null;
    const F = String(X.dataset.statusColResizeKey ?? "");
    return !F || !On[F] ? null : { handle: X, key: F };
  };
  t.addEventListener("pointerdown", (P) => {
    if (P.pointerType === "mouse" && P.button !== 0) return;
    const K = G(P.target);
    K && (P.preventDefault(), P.stopPropagation(), h && v(!1), E(K.handle, K.key, P.clientX, P.pointerId));
  }), t.addEventListener("mousedown", (P) => {
    if (P.button !== 0 || h) return;
    const K = G(P.target);
    K && (P.preventDefault(), P.stopPropagation(), E(K.handle, K.key, P.clientX, null));
  });
}
function po(t) {
  const e = document.getElementById(t);
  e && (e.textContent = Qr);
}
function y0(t) {
  return String(t ?? "").trim().toLowerCase().replace(/^default_/i, "").replace(/\.[a-z0-9]+$/i, "").replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
}
function S0(t) {
  if (!Number.isFinite(t) || t <= 0) return "-";
  try {
    return new Date(t).toLocaleString();
  } catch {
    return "-";
  }
}
function Zr(t) {
  const e = String(ne ?? "").trim();
  e && (Yt.set(e, {
    rows: [...bt],
    snapshot: yr,
    metaSnapshot: kr,
    dirty: qn,
    updatedAt: Date.now(),
    activeStatusCount: bt.length
  }), Er(qn, t));
}
function E0(t) {
  const e = /* @__PURE__ */ new Set();
  return (Array.isArray(t) ? t : []).forEach((r) => {
    const n = uh(String(r ?? "").trim());
    n && e.add(n);
  }), e;
}
function ou(t, e) {
  const r = E0(e);
  return (Array.isArray(t) ? t : []).filter((n) => {
    const o = String(n ?? "").trim();
    if (!o) return !1;
    const i = uh(o);
    return i ? !r.has(i) : !1;
  });
}
function _0(t) {
  let e = 0;
  return (Array.isArray(t) ? t : []).forEach((r) => {
    const n = String(r ?? "").trim();
    n && Yt.has(n) && (Yt.delete(n), e += 1);
  }), e;
}
function T0(t) {
  return (Array.isArray(t) ? t : []).filter((e) => {
    const r = String(e ?? "").trim();
    return !!Yt.get(r)?.dirty;
  }).length;
}
function k0(t, e, r) {
  const n = Yt.get(t);
  return n ? (Lt.clear(), bt = [...n.rows], yr = String(n.snapshot ?? "[]"), kr = String(n.metaSnapshot ?? "[]"), Er(!!n.dirty, r), Ft(e), !0) : !1;
}
function w0(t) {
  const e = Jt(t);
  return {
    tavernInstanceId: String(e.tavernInstanceId ?? "").trim(),
    chatId: String(e.chatId ?? "").trim(),
    scopeType: e.scopeType === "group" ? "group" : "character",
    scopeId: String(e.scopeId ?? "").trim()
  };
}
function fo(t) {
  return String(t ?? "").trim().toLowerCase();
}
function I0(t, e) {
  const r = String(e ?? "").trim();
  if (!r) return "";
  if (t === "group") return fo(r);
  const n = y0(r);
  return fo(n || r);
}
function A0(t) {
  const e = fo(t.tavernInstanceId), r = fo(t.chatId), n = t.scopeType === "group" ? "group" : "character", o = I0(n, t.scopeId);
  return !e || !r || !o || ie(r) ? "" : `${e}::${n}::${o}::${r}`;
}
function uh(t) {
  const e = w0(t);
  return A0(e);
}
function dh(t) {
  const e = Jt(t);
  return String(e.chatId ?? "").trim() || "unknown_chat";
}
function $0(t, e, r, n) {
  const o = String(t ?? "").trim(), i = Array.from(Yt.keys());
  return ob({
    currentChatKey: o,
    hostChats: e,
    localSummaries: r,
    draftChatKeys: i,
    taggedChatKeys: n
  }).map((d) => {
    const h = Yt.get(d.chatKey);
    return {
      chatKey: d.chatKey,
      chatId: d.chatId,
      displayName: String(d.displayName ?? "").trim() || dh(d.chatKey),
      avatarUrl: String(d.avatarUrl ?? "").trim(),
      scopeType: d.scopeType,
      scopeId: String(d.scopeId ?? "").trim(),
      roleKey: String(d.roleKey ?? "").trim(),
      updatedAt: Math.max(Number(d.updatedAt) || 0, Number(h?.updatedAt) || 0),
      activeStatusCount: Math.max(
        Number(d.activeStatusCount) || 0,
        Number(h?.activeStatusCount) || 0
      ),
      isCurrent: d.isCurrent,
      fromRollLocal: d.fromLocal,
      fromHost: d.fromHost,
      fromMemory: d.fromTagged
    };
  }).filter((d) => {
    const h = Yt.get(d.chatKey);
    return d.isCurrent || d.fromHost || d.fromMemory || h?.dirty ? !0 : Number(d.activeStatusCount) > 0;
  }).sort((d, h) => {
    if (d.chatKey === o) return -1;
    if (h.chatKey === o) return 1;
    const f = Yt.get(d.chatKey)?.dirty ? 1 : 0, b = Yt.get(h.chatKey)?.dirty ? 1 : 0;
    return f !== b ? b - f : d.fromHost !== h.fromHost ? Number(h.fromHost) - Number(d.fromHost) : (h.updatedAt || 0) - (d.updatedAt || 0);
  });
}
function pr(t) {
  const e = document.getElementById(t);
  if (!e) return;
  const r = d0();
  if (!Ve.length) {
    e.innerHTML = '<div class="st-roll-status-empty">当前酒馆下暂无聊天记录。</div>';
    return;
  }
  if (!r.length) {
    e.innerHTML = '<div class="st-roll-status-empty">没有匹配的聊天。</div>';
    return;
  }
  e.innerHTML = r.map((n) => {
    const o = n.chatKey === ne, i = Yt.get(n.chatKey)?.dirty === !0, c = [];
    n.isCurrent && c.push("当前"), n.fromHost && c.push("宿主"), n.fromRollLocal && c.push("本地"), n.fromMemory && c.push("记忆库"), i && c.push("未保存");
    const d = String(n.chatId ?? "").trim(), h = String(n.displayName ?? "").trim() || dh(n.chatKey), f = String(n.avatarUrl ?? "").trim(), b = je(String(h).slice(0, 1).toUpperCase());
    return `
      <button type="button" class="st-roll-status-chat-item ${o ? "is-active" : ""}" data-status-chat-key="${qe(n.chatKey)}">
        <div class="st-roll-status-chat-avatar-wrap">
          ${f ? `<img class="st-roll-status-chat-avatar" src="${qe(f)}" alt="${qe(h)}" onerror="this.style.display='none'; const fb=this.nextElementSibling; if(fb){fb.style.display='grid';}" />` : ""}
          <div class="st-roll-status-chat-avatar-fallback" style="${f ? "display:none;" : ""}">${b}</div>
        </div>
        <div class="st-roll-status-chat-main">
          <span class="st-roll-status-chat-name-marquee" data-st-roll-role="status-chat-name-marquee">
            <span class="st-roll-status-chat-name-track" data-st-roll-role="status-chat-name-track">
              <span class="st-roll-status-chat-name" data-st-roll-role="status-chat-name-segment">${je(h)}</span>
            </span>
          </span>
          <span class="st-roll-status-chat-time">最后聊天：${je(S0(n.updatedAt))}</span>
          <span class="st-roll-status-chat-key">CHATID：${je(d)}</span>
          <span class="st-roll-status-chat-meta-line">${c.map((v) => `<span class="st-roll-skill-preset-tag">${je(v)}</span>`).join("")}</span>
        </div>
      </button>
    `;
  }).join(""), i0(), l0(e), uo(e), window.requestAnimationFrame(() => {
    uo(e);
  });
}
function Ge(t) {
  const e = document.getElementById(t);
  if (!e) return;
  const r = String(ne ?? "").trim();
  if (!r) {
    e.textContent = "未选择聊天";
    return;
  }
  const n = Ve.find((c) => c.chatKey === r);
  if (!n) {
    e.textContent = r;
    return;
  }
  const o = [];
  n.isCurrent && o.push("当前"), n.fromHost && o.push("宿主"), n.fromRollLocal && o.push("本地"), n.fromMemory && o.push("记忆库");
  const i = Mo(bt).length;
  e.textContent = `来源：${o.join("、") || "未知"}｜状态数：${n.activeStatusCount}｜可见：${i}`;
}
async function mh(t, e, r) {
  const n = String(t ?? "").trim();
  if (!n) return;
  if (r?.skipSaveCurrent || Zr(e.SETTINGS_STATUS_DIRTY_HINT_ID_Event), ne = n, !k0(
    n,
    e.SETTINGS_STATUS_ROWS_ID_Event,
    e.SETTINGS_STATUS_DIRTY_HINT_ID_Event
  )) {
    const i = String(e.getActiveChatKeyEvent() ?? "").trim(), c = n === i ? e.getActiveStatusesEvent() : await e.loadStatusesForChatKeyEvent(n);
    ih(
      c,
      e.SETTINGS_STATUS_ROWS_ID_Event,
      e.SETTINGS_STATUS_DIRTY_HINT_ID_Event,
      !0
    ), Zr(e.SETTINGS_STATUS_DIRTY_HINT_ID_Event);
  }
  pr(e.SETTINGS_STATUS_CHAT_LIST_ID_Event), Ge(e.SETTINGS_STATUS_CHAT_META_ID_Event), qt(e.SETTINGS_STATUS_ERRORS_ID_Event, []);
}
async function An(t) {
  const e = ++Da;
  hr = !0, Xr(t.SETTINGS_STATUS_REFRESH_ID_Event), Ca = String(t.getActiveChatKeyEvent() ?? "").trim(), Qr = "记忆库：检测中", po(t.SETTINGS_STATUS_MEMORY_STATE_ID_Event);
  const [r, n, o] = await Promise.all([
    t.listHostChatsForCurrentScopeEvent().catch(() => []),
    t.listChatScopedStatusSummariesEvent().catch(() => []),
    t.probeMemoryPluginEvent(1200).catch(() => ({
      available: !1,
      enabled: !1,
      pluginId: "stx_memory_os",
      version: "",
      capabilities: []
    }))
  ]);
  if (e !== Da) {
    hr = !1, Xr(t.SETTINGS_STATUS_REFRESH_ID_Event);
    return;
  }
  let i = [];
  if (!o.available)
    Qr = "记忆库：未安装";
  else if (!o.enabled)
    Qr = "记忆库：已安装（未启用）";
  else {
    Qr = "记忆库：已启用";
    const h = await t.fetchMemoryChatKeysEvent(1200).catch(() => ({ chatKeys: [], updatedAt: null }));
    if (e !== Da) {
      hr = !1, Xr(t.SETTINGS_STATUS_REFRESH_ID_Event);
      return;
    }
    i = Array.isArray(h.chatKeys) ? h.chatKeys : [];
  }
  Ve = $0(
    Ca,
    r,
    n,
    i
  ), po(t.SETTINGS_STATUS_MEMORY_STATE_ID_Event), pr(t.SETTINGS_STATUS_CHAT_LIST_ID_Event);
  const d = (Ve.some((h) => h.chatKey === ne) ? ne : "") || Ca || Ve[0]?.chatKey || "";
  if (!d) {
    ne = "", bt = [], yr = "[]", kr = "[]", Er(!1, t.SETTINGS_STATUS_DIRTY_HINT_ID_Event), Ft(t.SETTINGS_STATUS_ROWS_ID_Event), Ge(t.SETTINGS_STATUS_CHAT_META_ID_Event), qt(t.SETTINGS_STATUS_ERRORS_ID_Event, []), ai(t.SETTINGS_STATUS_ROWS_ID_Event), hr = !1, Xr(t.SETTINGS_STATUS_REFRESH_ID_Event);
    return;
  }
  await mh(d, t, { skipSaveCurrent: !0 }), hr = !1, Xr(t.SETTINGS_STATUS_REFRESH_ID_Event);
}
function hh(t) {
  const e = String(t.getActiveChatKeyEvent() ?? "").trim();
  if (!e || Yt.get(e)?.dirty) return;
  const n = t.getActiveStatusesEvent(), o = _l(n), i = mo(o), c = nh(n);
  Yt.set(e, {
    rows: o,
    snapshot: i,
    metaSnapshot: c,
    dirty: !1,
    updatedAt: Date.now(),
    activeStatusCount: n.length
  }), !(ne && ne !== e) && (ne = e, ih(
    n,
    t.SETTINGS_STATUS_ROWS_ID_Event,
    t.SETTINGS_STATUS_DIRTY_HINT_ID_Event,
    !0
  ));
}
function R0(t) {
  const e = document.getElementById(t.SETTINGS_STATUS_ROWS_ID_Event), r = document.getElementById(t.SETTINGS_STATUS_ADD_ID_Event), n = document.getElementById(t.SETTINGS_STATUS_SAVE_ID_Event), o = document.getElementById(t.SETTINGS_STATUS_RESET_ID_Event), i = document.getElementById(t.SETTINGS_STATUS_REFRESH_ID_Event), c = document.getElementById(t.SETTINGS_STATUS_CLEAN_UNUSED_ID_Event), d = document.getElementById(t.SETTINGS_STATUS_CHAT_LIST_ID_Event), h = document.getElementById(t.SETTINGS_STATUS_SPLITTER_ID_Event), f = document.getElementById(t.SETTINGS_STATUS_COLS_ID_Event), b = e?.closest(".st-roll-status-modal"), v = b?.querySelector(".st-roll-status-chat-search"), E = b?.querySelector(".st-roll-status-chat-source"), y = b?.querySelector(".st-roll-status-search"), $ = b?.querySelector(".st-roll-status-scope-filter"), O = b?.querySelector(".st-roll-status-only-enabled"), L = b?.querySelector(".st-roll-status-select-visible"), D = b?.querySelector(".st-roll-status-batch-enable"), G = b?.querySelector(".st-roll-status-batch-disable"), P = b?.querySelector(".st-roll-status-batch-delete"), K = b?.querySelector(".st-roll-status-mobile-back"), X = b?.querySelector(".st-roll-status-mobile-sheet-head");
  if (!e || e.dataset.statusEditorBound === "1") return;
  e.dataset.statusEditorBound = "1", b0(t.SETTINGS_STATUS_ROWS_ID_Event), h && v0(h, t.SETTINGS_STATUS_ROWS_ID_Event), f && x0(f, t.SETTINGS_STATUS_ROWS_ID_Event);
  const F = () => {
    const z = mo(bt);
    Er(z !== yr, t.SETTINGS_STATUS_DIRTY_HINT_ID_Event), Zr(t.SETTINGS_STATUS_DIRTY_HINT_ID_Event), pr(t.SETTINGS_STATUS_CHAT_LIST_ID_Event);
  };
  if (hh(t), qt(t.SETTINGS_STATUS_ERRORS_ID_Event, []), po(t.SETTINGS_STATUS_MEMORY_STATE_ID_Event), Ge(t.SETTINGS_STATUS_CHAT_META_ID_Event), Xr(t.SETTINGS_STATUS_REFRESH_ID_Event), Ue(t.SETTINGS_STATUS_ROWS_ID_Event), An(t), v?.addEventListener("input", () => {
    Qm = String(v.value ?? ""), pr(t.SETTINGS_STATUS_CHAT_LIST_ID_Event);
  }), E?.addEventListener("change", () => {
    const z = String(E.value ?? "all");
    Fs = z === "current" || z === "local" || z === "memory" ? z : "all", pr(t.SETTINGS_STATUS_CHAT_LIST_ID_Event);
  }), y?.addEventListener("input", () => {
    Zm = String(y.value ?? ""), Ft(t.SETTINGS_STATUS_ROWS_ID_Event), Ge(t.SETTINGS_STATUS_CHAT_META_ID_Event);
  }), $?.addEventListener("change", () => {
    const z = String($.value ?? "all");
    ri = z === "skills" || z === "global" ? z : "all", Ft(t.SETTINGS_STATUS_ROWS_ID_Event), Ge(t.SETTINGS_STATUS_CHAT_META_ID_Event);
  }), O?.addEventListener("change", () => {
    th = !!O.checked, Ft(t.SETTINGS_STATUS_ROWS_ID_Event), Ge(t.SETTINGS_STATUS_CHAT_META_ID_Event);
  }), L?.addEventListener("click", () => {
    Mo(bt).forEach((z) => {
      Lt.add(String(z.rowId ?? ""));
    }), Ft(t.SETTINGS_STATUS_ROWS_ID_Event);
  }), D?.addEventListener("click", () => {
    Lt.size <= 0 || (bt = bt.map(
      (z) => Lt.has(String(z.rowId ?? "")) ? { ...z, enabled: !0 } : z
    ), Ft(t.SETTINGS_STATUS_ROWS_ID_Event), F(), qt(t.SETTINGS_STATUS_ERRORS_ID_Event, []));
  }), G?.addEventListener("click", () => {
    Lt.size <= 0 || (bt = bt.map(
      (z) => Lt.has(String(z.rowId ?? "")) ? { ...z, enabled: !1 } : z
    ), Ft(t.SETTINGS_STATUS_ROWS_ID_Event), F(), qt(t.SETTINGS_STATUS_ERRORS_ID_Event, []));
  }), P?.addEventListener("click", () => {
    Lt.size <= 0 || (bt = bt.filter(
      (z) => !Lt.has(String(z.rowId ?? ""))
    ), Lt.clear(), Ft(t.SETTINGS_STATUS_ROWS_ID_Event), F(), qt(t.SETTINGS_STATUS_ERRORS_ID_Event, []));
  }), K?.addEventListener("click", () => {
    ai(t.SETTINGS_STATUS_ROWS_ID_Event);
  }), X) {
    let z = !1;
    const Z = () => {
      Fe = !1, Wr = null, Ns = 0, Ls = we, Ms = 0, Os = 0;
    };
    X.addEventListener("click", (H) => {
      if (z) {
        z = !1;
        return;
      }
      H.target?.closest(".st-roll-status-mobile-back") || f0(t.SETTINGS_STATUS_ROWS_ID_Event);
    }), X.addEventListener("pointerdown", (H) => {
      if (!(H.pointerType === "mouse" && H.button !== 0 || H.target?.closest(".st-roll-status-mobile-back")) && window.matchMedia("(max-width: 680px)").matches) {
        Ue(t.SETTINGS_STATUS_ROWS_ID_Event), Fe = !0, Wr = H.pointerId, Ns = H.clientY, Ls = we, Ms = H.clientY, Os = performance.now();
        try {
          X.setPointerCapture(H.pointerId);
        } catch {
        }
        Ue(t.SETTINGS_STATUS_ROWS_ID_Event);
      }
    }), X.addEventListener("pointermove", (H) => {
      if (!Fe || Wr !== H.pointerId) return;
      const B = Ue(t.SETTINGS_STATUS_ROWS_ID_Event);
      if (!B) return;
      const tt = H.clientY - Ns;
      we = Sr(
        Ls + tt,
        0,
        B.closedTranslate
      ), Ms = H.clientY, Os = performance.now(), Math.abs(tt) > 8 && (z = !0), Ue(t.SETTINGS_STATUS_ROWS_ID_Event), H.preventDefault();
    }), X.addEventListener("pointerup", (H) => {
      if (!Fe || Wr !== H.pointerId) return;
      const B = si(t.SETTINGS_STATUS_ROWS_ID_Event), tt = H.clientY - Ns, it = Sr(
        Ls + tt,
        0,
        B.closedTranslate
      ), dt = performance.now(), Tt = Math.max(1, dt - Os), Rt = (H.clientY - Ms) / Tt;
      we = it, be = su(
        it,
        Rt,
        B
      ), Z(), Ue(t.SETTINGS_STATUS_ROWS_ID_Event), z = Math.abs(tt) > 8;
      try {
        X.releasePointerCapture(H.pointerId);
      } catch {
      }
    }), X.addEventListener("pointercancel", (H) => {
      if (!Fe || Wr !== H.pointerId) return;
      const B = si(t.SETTINGS_STATUS_ROWS_ID_Event);
      be = su(
        we,
        0,
        B
      ), Z(), Ue(t.SETTINGS_STATUS_ROWS_ID_Event), z = !1;
      try {
        X.releasePointerCapture(H.pointerId);
      } catch {
      }
    });
  }
  e.addEventListener("input", (z) => {
    const Z = z.target;
    if (!Z) return;
    const H = String(Z.dataset.statusRowId ?? ""), B = String(Z.dataset.statusField ?? "");
    if (!H || !B) return;
    const tt = bt.find((it) => it.rowId === H);
    tt && (B === "name" && (tt.name = Z.value), B === "modifier" && (tt.modifierText = Z.value), B === "skills" && (tt.skillsText = Z.value), B === "duration" && (tt.durationText = Z.value), B === "scope" && (tt.scope = Z.value === "all" ? "all" : "skills", tt.scope === "all" && (tt.skillsText = ""), Ft(t.SETTINGS_STATUS_ROWS_ID_Event)), F(), qt(t.SETTINGS_STATUS_ERRORS_ID_Event, []));
  }), e.addEventListener("change", (z) => {
    const Z = z.target;
    if (!Z) return;
    const H = String(Z.dataset.statusSelectId ?? "");
    if (H) {
      Z.checked ? Lt.add(H) : Lt.delete(H), oh(t.SETTINGS_STATUS_ROWS_ID_Event);
      return;
    }
    const B = String(Z.dataset.statusRowId ?? ""), tt = String(Z.dataset.statusField ?? "");
    if (!B || tt !== "enabled") return;
    const it = bt.find((dt) => dt.rowId === B);
    it && (it.enabled = Z.checked, F(), qt(t.SETTINGS_STATUS_ERRORS_ID_Event, []));
  }), e.addEventListener("click", (z) => {
    const Z = z.target, H = Z?.closest("button[data-status-duplicate-id]");
    if (H) {
      const it = String(H.dataset.statusDuplicateId ?? ""), dt = bt.find((Tt) => Tt.rowId === it);
      if (!dt) return;
      bt = [
        ...bt,
        ni(
          String(dt.name ?? ""),
          String(dt.modifierText ?? ""),
          String(dt.durationText ?? ""),
          dt.scope === "all" ? "all" : "skills",
          String(dt.skillsText ?? ""),
          dt.enabled !== !1
        )
      ], Ft(t.SETTINGS_STATUS_ROWS_ID_Event), F(), qt(t.SETTINGS_STATUS_ERRORS_ID_Event, []);
      return;
    }
    const B = Z?.closest("button[data-status-remove-id]");
    if (!B) return;
    const tt = String(B.dataset.statusRemoveId ?? "");
    tt && (Lt.delete(tt), bt = bt.filter((it) => it.rowId !== tt), Ft(t.SETTINGS_STATUS_ROWS_ID_Event), F(), qt(t.SETTINGS_STATUS_ERRORS_ID_Event, []));
  }), d?.addEventListener("click", (z) => {
    const H = z.target?.closest("button[data-status-chat-key]");
    if (!H) return;
    const B = String(H.dataset.statusChatKey ?? "").trim();
    if (B) {
      if (B === ne) {
        be === "closed" && oi(t.SETTINGS_STATUS_ROWS_ID_Event);
        return;
      }
      mh(B, t).then(() => {
        oi(t.SETTINGS_STATUS_ROWS_ID_Event);
      });
    }
  }), r?.addEventListener("click", () => {
    bt = [...bt, ni()], Ft(t.SETTINGS_STATUS_ROWS_ID_Event), F(), qt(t.SETTINGS_STATUS_ERRORS_ID_Event, []);
  }), n?.addEventListener("click", () => {
    (async () => {
      const z = String(ne ?? "").trim();
      if (!z) return;
      const Z = String(t.getActiveChatKeyEvent() ?? "").trim(), H = z === Z ? t.getActiveStatusesEvent() : await t.loadStatusesForChatKeyEvent(z), B = g0(bt, H);
      if (B.errors.length > 0) {
        qt(t.SETTINGS_STATUS_ERRORS_ID_Event, B.errors);
        return;
      }
      z === Z ? t.setActiveStatusesEvent(B.statuses) : await t.saveStatusesForChatKeyEvent(z, B.statuses), Lt.clear(), bt = _l(B.statuses), yr = mo(bt), kr = nh(B.statuses), Er(!1, t.SETTINGS_STATUS_DIRTY_HINT_ID_Event), Zr(t.SETTINGS_STATUS_DIRTY_HINT_ID_Event);
      const tt = Ve.find((it) => it.chatKey === z);
      tt && (tt.updatedAt = Date.now(), tt.activeStatusCount = B.statuses.length), Ft(t.SETTINGS_STATUS_ROWS_ID_Event), pr(t.SETTINGS_STATUS_CHAT_LIST_ID_Event), Ge(t.SETTINGS_STATUS_CHAT_META_ID_Event), qt(t.SETTINGS_STATUS_ERRORS_ID_Event, []), t.syncSettingsUiEvent?.(), t.appendToConsoleEvent?.(
        z === Z ? "状态编辑器：已保存并立即应用到当前聊天。" : `状态编辑器：已保存到聊天 ${z}。`
      );
    })();
  }), o?.addEventListener("click", () => {
    (async () => {
      const z = String(ne ?? "").trim();
      if (!z) return;
      const Z = String(t.getActiveChatKeyEvent() ?? "").trim();
      z === Z ? t.setActiveStatusesEvent([]) : await t.saveStatusesForChatKeyEvent(z, []), Lt.clear(), bt = [], yr = "[]", kr = "[]", Er(!1, t.SETTINGS_STATUS_DIRTY_HINT_ID_Event), Zr(t.SETTINGS_STATUS_DIRTY_HINT_ID_Event);
      const H = Ve.find((B) => B.chatKey === z);
      H && (H.updatedAt = Date.now(), H.activeStatusCount = 0), Ft(t.SETTINGS_STATUS_ROWS_ID_Event), pr(t.SETTINGS_STATUS_CHAT_LIST_ID_Event), Ge(t.SETTINGS_STATUS_CHAT_META_ID_Event), qt(t.SETTINGS_STATUS_ERRORS_ID_Event, []), t.syncSettingsUiEvent?.(), t.appendToConsoleEvent?.(
        z === Z ? "状态编辑器：已重置当前聊天状态。" : `状态编辑器：聊天 ${z} 已重置。`
      );
    })();
  }), i?.addEventListener("click", () => {
    An(t);
  }), c?.addEventListener("click", () => {
    (async () => {
      Zr(t.SETTINGS_STATUS_DIRTY_HINT_ID_Event);
      let z, Z;
      try {
        [z, Z] = await Promise.all([
          t.listHostChatsForCurrentScopeEvent(),
          t.listChatScopedStatusSummariesEvent()
        ]);
      } catch {
        t.appendToConsoleEvent?.("状态编辑器：读取当前酒馆聊天列表失败，未执行清理。");
        return;
      }
      const H = String(t.getActiveChatKeyEvent() ?? "").trim(), B = Array.from(
        new Set([
          ...(Array.isArray(z) ? z : []).map((rt) => String(rt.chatKey ?? "").trim()),
          H
        ].filter(Boolean))
      ), tt = ou(
        (Array.isArray(Z) ? Z : []).map((rt) => String(rt.chatKey ?? "").trim()),
        B
      ), it = ou(
        Array.from(Yt.keys()),
        B
      );
      if (tt.length <= 0 && it.length <= 0) {
        t.appendToConsoleEvent?.("状态编辑器：当前没有可清理的无用聊天。");
        return;
      }
      const dt = T0(it);
      if (!window.confirm(
        [
          `将删除 ${tt.length} 条不在当前酒馆聊天列表中的本地聊天状态记录。`,
          `将同时移除 ${it.length} 条对应草稿${dt > 0 ? `（其中 ${dt} 条未保存）` : ""}。`,
          "此操作不会影响酒馆原始聊天，也不会影响记忆库。"
        ].join(`
`)
      )) return;
      const Rt = await t.cleanupUnusedChatStatesForCurrentTavernEvent(B), pt = _0(it);
      Lt.clear(), await An(t), qt(t.SETTINGS_STATUS_ERRORS_ID_Event, []), t.syncSettingsUiEvent?.(), t.appendToConsoleEvent?.(
        `状态编辑器：已清理 ${Rt.deletedCount} 条无用聊天状态，移除 ${pt} 条草稿。`
      );
    })();
  }), tu || (document.addEventListener("st-roll-status-editor-opened", () => {
    ai(t.SETTINGS_STATUS_ROWS_ID_Event), An(t);
  }), tu = !0), eu || (eu = t.subscribeMemoryPluginStateEvent((z) => {
    Qr = z.enabled ? "记忆库：已启用" : "记忆库：已安装（未启用）", po(t.SETTINGS_STATUS_MEMORY_STATE_ID_Event), An(t);
  }));
}
function C0(t) {
  return !!Yt.get(String(t ?? ""))?.dirty;
}
function D0(t, e) {
  if (e === void 0) {
    console.info(`[SS-Helper][RollHelperThemeInput] ${t}`);
    return;
  }
  console.info(`[SS-Helper][RollHelperThemeInput] ${t}`, e);
}
let au = !1, iu = !1;
function N0(t) {
  const e = document.getElementById(t.SETTINGS_TAB_MAIN_ID_Event), r = document.getElementById(t.SETTINGS_TAB_SKILL_ID_Event), n = document.getElementById(t.SETTINGS_TAB_RULE_ID_Event), o = document.getElementById(t.SETTINGS_TAB_ABOUT_ID_Event), i = document.getElementById(t.SETTINGS_PANEL_MAIN_ID_Event), c = document.getElementById(t.SETTINGS_PANEL_SKILL_ID_Event), d = document.getElementById(t.SETTINGS_PANEL_RULE_ID_Event), h = document.getElementById(t.SETTINGS_PANEL_ABOUT_ID_Event), f = document.getElementById(t.SETTINGS_SKILL_MODAL_ID_Event), b = document.getElementById(
    t.SETTINGS_SKILL_EDITOR_OPEN_ID_Event
  ), v = document.getElementById(
    t.SETTINGS_SKILL_MODAL_CLOSE_ID_Event
  ), E = document.getElementById(t.SETTINGS_STATUS_MODAL_ID_Event), y = document.getElementById(
    t.SETTINGS_STATUS_EDITOR_OPEN_ID_Event
  ), $ = document.getElementById(
    t.SETTINGS_STATUS_MODAL_CLOSE_ID_Event
  ), O = document.getElementById(t.SETTINGS_SEARCH_ID_Event), L = i ? Array.from(i.querySelectorAll(".st-roll-search-item")) : [], D = c ? Array.from(c.querySelectorAll(".st-roll-search-item")) : [], G = d ? Array.from(d.querySelectorAll(".st-roll-search-item")) : [], P = h ? Array.from(h.querySelectorAll(".st-roll-search-item")) : [], K = [
    ...L,
    ...D,
    ...G,
    ...P
  ];
  let X = "main";
  const F = () => {
    const rt = document.getElementById(t.drawerContentId);
    !rt || t.isElementVisibleEvent(rt) || (document.getElementById(t.drawerToggleId)?.click(), t.isElementVisibleEvent(rt)) || (rt.hidden = !1, rt.style.display = "block");
  }, z = () => {
    if (f) {
      if (f.open)
        try {
          f.close();
        } catch {
        }
      document.body.dataset.stRollSkillModalOpen === "1" && (document.body.style.overflow = document.body.dataset.stRollSkillModalOverflow || "", delete document.body.dataset.stRollSkillModalOpen, delete document.body.dataset.stRollSkillModalOverflow);
    }
  }, Z = () => {
    if (f) {
      if (F(), !f.open)
        try {
          f.showModal();
        } catch {
          f.setAttribute("open", "");
        }
      document.body.dataset.stRollSkillModalOpen !== "1" && (document.body.dataset.stRollSkillModalOpen = "1", document.body.dataset.stRollSkillModalOverflow = document.body.style.overflow || "", document.body.style.overflow = "hidden");
    }
  }, H = () => {
    if (E) {
      if (E.open)
        try {
          E.close();
        } catch {
        }
      document.body.dataset.stRollStatusModalOpen === "1" && (document.body.style.overflow = document.body.dataset.stRollStatusModalOverflow || "", delete document.body.dataset.stRollStatusModalOpen, delete document.body.dataset.stRollStatusModalOverflow);
    }
  }, B = () => {
    if (E) {
      if (F(), !E.open)
        try {
          E.showModal();
        } catch {
          E.setAttribute("open", "");
        }
      document.body.dataset.stRollStatusModalOpen !== "1" && (document.body.dataset.stRollStatusModalOpen = "1", document.body.dataset.stRollStatusModalOverflow = document.body.style.overflow || "", document.body.style.overflow = "hidden"), document.dispatchEvent(new CustomEvent("st-roll-status-editor-opened"));
    }
  }, tt = (rt) => {
    X = rt;
    const vt = rt === "main", Mt = rt === "skill", Pt = rt === "rule", oe = rt === "about";
    e?.classList.toggle("is-active", vt), r?.classList.toggle("is-active", Mt), n?.classList.toggle("is-active", Pt), o?.classList.toggle("is-active", oe), i && (i.hidden = !vt), c && (c.hidden = !Mt), d && (d.hidden = !Pt), h && (h.hidden = !oe), xe(e || r || n || o || i || c || d || h || null);
  }, it = (rt) => rt === X ? !0 : X === "skill" && rt !== "skill" && !t.confirmDiscardSkillDraftEvent() ? !1 : (rt !== "skill" && z(), H(), tt(rt), !0), dt = globalThis;
  dt.__stRollPreviewEditorBridgeBoundEvent || (document.addEventListener("st-roll-open-skill-editor", () => {
    it("skill") && Z();
  }), document.addEventListener("st-roll-open-status-editor", () => {
    it("main") && B();
  }), dt.__stRollPreviewEditorBridgeBoundEvent = !0);
  const Tt = () => {
    const vt = String(O?.value ?? "").trim().toLowerCase().split(/\s+/).filter(Boolean);
    for (const Ct of K) {
      const Se = `${Ct.dataset.stRollSearch ?? ""} ${Ct.textContent ?? ""}`.toLowerCase(), ce = vt.every((Zt) => Se.includes(Zt));
      Ct.classList.toggle("is-hidden-by-search", !ce);
    }
    if (!vt.length) return;
    const Mt = L.some(
      (Ct) => !Ct.classList.contains("is-hidden-by-search")
    ), Pt = D.some(
      (Ct) => !Ct.classList.contains("is-hidden-by-search")
    ), oe = G.some(
      (Ct) => !Ct.classList.contains("is-hidden-by-search")
    ), Ot = P.some(
      (Ct) => !Ct.classList.contains("is-hidden-by-search")
    ), Wt = {
      main: Mt,
      skill: Pt,
      rule: oe,
      about: Ot
    };
    if (!Wt[X]) {
      const Se = [
        "main",
        "skill",
        "rule",
        "about"
      ].find((ce) => Wt[ce]);
      Se && it(Se);
    }
  };
  tt("main"), e?.addEventListener("click", () => {
    it("main") && Tt();
  }), r?.addEventListener("click", () => {
    it("skill") && Tt();
  }), n?.addEventListener("click", () => {
    it("rule") && Tt();
  }), o?.addEventListener("click", () => {
    it("about") && Tt();
  }), O?.addEventListener("input", Tt), Tt(), b?.addEventListener("click", () => {
    it("skill") && Z();
  }), v?.addEventListener("click", () => {
    z();
  }), f?.addEventListener("click", (rt) => {
    const vt = rt.target;
    (rt.target === f || vt?.dataset.skillModalRole === "backdrop") && z();
  }), f?.addEventListener("cancel", (rt) => {
    rt.preventDefault(), z();
  }), y?.addEventListener("click", () => {
    it("main") && B();
  }), $?.addEventListener("click", () => {
    H();
  }), E?.addEventListener("click", (rt) => {
    const vt = rt.target;
    (rt.target === E || vt?.dataset.statusModalRole === "backdrop") && H();
  }), E?.addEventListener("cancel", (rt) => {
    rt.preventDefault(), H();
  }), iu || (window.addEventListener("keydown", (rt) => {
    rt.key === "Escape" && (z(), H());
  }), iu = !0);
  const Rt = document.getElementById(t.drawerToggleId), pt = document.getElementById(t.drawerContentId);
  Rt?.addEventListener(
    "click",
    (rt) => {
      if (t.isElementVisibleEvent(pt)) {
        if (t.confirmDiscardSkillDraftEvent()) {
          z(), H();
          return;
        }
        rt.preventDefault(), rt.stopPropagation(), typeof rt.stopImmediatePropagation == "function" && rt.stopImmediatePropagation();
      }
    },
    !0
  ), au || (window.addEventListener("beforeunload", (rt) => {
    t.isSkillDraftDirtyEvent() && (rt.preventDefault(), rt.returnValue = "");
  }), au = !0);
}
function L0(t) {
  const e = document.getElementById(t.SETTINGS_THEME_ID_Event), r = document.getElementById(t.SETTINGS_ENABLED_ID_Event), n = document.getElementById(t.SETTINGS_RULE_ID_Event), o = document.getElementById(
    t.SETTINGS_AI_ROLL_MODE_ID_Event
  ), i = document.getElementById(
    t.SETTINGS_AI_ROUND_CONTROL_ID_Event
  ), c = document.getElementById(
    t.SETTINGS_EXPLODING_ENABLED_ID_Event
  ), d = document.getElementById(
    t.SETTINGS_ADVANTAGE_ENABLED_ID_Event
  ), h = document.getElementById(
    t.SETTINGS_DYNAMIC_RESULT_GUIDANCE_ID_Event
  ), f = document.getElementById(
    t.SETTINGS_DYNAMIC_DC_REASON_ID_Event
  ), b = document.getElementById(
    t.SETTINGS_STATUS_SYSTEM_ENABLED_ID_Event
  ), v = document.getElementById(
    t.SETTINGS_ALLOWED_DICE_SIDES_ID_Event
  ), E = document.getElementById(
    t.SETTINGS_SUMMARY_DETAIL_ID_Event
  ), y = document.getElementById(
    t.SETTINGS_SUMMARY_ROUNDS_ID_Event
  ), $ = document.getElementById(t.SETTINGS_SCOPE_ID_Event), O = document.getElementById(
    t.SETTINGS_OUTCOME_BRANCHES_ID_Event
  ), L = document.getElementById(
    t.SETTINGS_EXPLODE_OUTCOME_ID_Event
  ), D = document.getElementById(
    t.SETTINGS_SUMMARY_OUTCOME_ID_Event
  ), G = document.getElementById(
    t.SETTINGS_LIST_OUTCOME_PREVIEW_ID_Event
  ), P = document.getElementById(
    t.SETTINGS_TIME_LIMIT_ENABLED_ID_Event
  ), K = document.getElementById(
    t.SETTINGS_TIME_LIMIT_MIN_ID_Event
  );
  document.getElementById(
    t.SETTINGS_COMPATIBILITY_MODE_ID_Event
  ), document.getElementById(
    t.SETTINGS_REMOVE_ROLLJSON_ID_Event
  ), document.getElementById(
    t.SETTINGS_STRIP_INTERNAL_ID_Event
  );
  const X = document.getElementById(
    t.SETTINGS_SKILL_ENABLED_ID_Event
  ), F = document.querySelector("[id^='st-roll-settings-'][id$='-card']") ?? null, z = document.querySelector("#st-roll-settings-Event-skill-modal") ?? null, Z = document.querySelector("#st-roll-settings-Event-status-modal") ?? null;
  e?.addEventListener("change", (H) => {
    const B = String(H.target.value || ""), tt = Em(B), it = Fb(tt);
    yo(), ff(it), D0("themeInput change", {
      rawValue: B,
      settingsValue: tt,
      sdkValue: it,
      nativeValue: e?.value
    }), Sl({
      settingsRoot: F,
      skillModal: z,
      statusModal: Z,
      selection: it,
      themeInput: e,
      themeInputValue: tt
    }), t.updateSettingsEvent({ theme: tt });
  }), r?.addEventListener("input", (H) => {
    const B = !!H.target.checked;
    t.updateSettingsEvent({ enabled: B });
  }), n?.addEventListener("input", (H) => {
    const B = !!H.target.checked;
    t.updateSettingsEvent({ autoSendRuleToAI: B });
  }), o?.addEventListener("input", (H) => {
    const B = !!H.target.checked;
    t.updateSettingsEvent({ enableAiRollMode: B });
  }), i?.addEventListener("input", (H) => {
    const B = !!H.target.checked;
    t.updateSettingsEvent({ enableAiRoundControl: B });
  }), c?.addEventListener("input", (H) => {
    const B = !!H.target.checked;
    t.updateSettingsEvent({ enableExplodingDice: B });
  }), d?.addEventListener("input", (H) => {
    const B = !!H.target.checked;
    t.updateSettingsEvent({ enableAdvantageSystem: B });
  }), h?.addEventListener("input", (H) => {
    const B = !!H.target.checked;
    t.updateSettingsEvent({ enableDynamicResultGuidance: B });
  }), f?.addEventListener("input", (H) => {
    const B = !!H.target.checked;
    t.updateSettingsEvent({ enableDynamicDcReason: B });
  }), b?.addEventListener("input", (H) => {
    const B = !!H.target.checked;
    t.updateSettingsEvent({ enableStatusSystem: B });
  }), v?.addEventListener("change", (H) => {
    const B = String(H.target.value || "").trim();
    t.updateSettingsEvent({ aiAllowedDiceSidesText: B });
  }), E?.addEventListener("change", (H) => {
    const B = String(H.target.value || ""), tt = B === "balanced" || B === "detailed" ? B : "minimal";
    t.updateSettingsEvent({ summaryDetailMode: tt });
  }), y?.addEventListener("change", (H) => {
    const B = Number(H.target.value), tt = Number.isFinite(B) ? Math.min(
      t.SUMMARY_HISTORY_ROUNDS_MAX_Event,
      Math.max(t.SUMMARY_HISTORY_ROUNDS_MIN_Event, Math.floor(B))
    ) : t.DEFAULT_SUMMARY_HISTORY_ROUNDS_Event;
    t.updateSettingsEvent({ summaryHistoryRounds: tt });
  }), $?.addEventListener("change", (H) => {
    const B = String(H.target.value || "");
    t.updateSettingsEvent({
      eventApplyScope: B === "all" ? "all" : "protagonist_only"
    });
  }), O?.addEventListener("input", (H) => {
    const B = !!H.target.checked;
    t.updateSettingsEvent({ enableOutcomeBranches: B });
  }), L?.addEventListener("input", (H) => {
    const B = !!H.target.checked;
    t.updateSettingsEvent({ enableExplodeOutcomeBranch: B });
  }), D?.addEventListener("input", (H) => {
    const B = !!H.target.checked;
    t.updateSettingsEvent({ includeOutcomeInSummary: B });
  }), G?.addEventListener("input", (H) => {
    const B = !!H.target.checked;
    t.updateSettingsEvent({ showOutcomePreviewInListCard: B });
  }), P?.addEventListener("input", (H) => {
    const B = !!H.target.checked;
    t.updateSettingsEvent({ enableTimeLimit: B });
  }), K?.addEventListener("change", (H) => {
    const B = Number(H.target.value), tt = Number.isFinite(B) ? Math.max(1, Math.floor(B)) : 10;
    t.updateSettingsEvent({ minTimeLimitSeconds: tt });
  }), X?.addEventListener("input", (H) => {
    const B = !!H.target.checked;
    t.updateSettingsEvent({ enableSkillSystem: B });
  });
}
function M0(t) {
  const e = document.getElementById(
    t.SETTINGS_RULE_TEXT_ID_Event
  ), r = document.getElementById(
    t.SETTINGS_RULE_SAVE_ID_Event
  ), n = document.getElementById(
    t.SETTINGS_RULE_RESET_ID_Event
  );
  r?.addEventListener("click", () => {
    const o = String(e?.value ?? "");
    t.updateSettingsEvent({ ruleText: o });
  }), n?.addEventListener("click", () => {
    e && (e.value = ""), t.updateSettingsEvent({ ruleText: "" });
  });
}
function O0(t) {
  const e = document.getElementById(t.SETTINGS_CARD_ID_Event);
  e?.dataset.stRollMountedBound !== "1" && (e && (e.dataset.stRollMountedBound = "1"), N0({
    drawerToggleId: t.drawerToggleId,
    drawerContentId: t.drawerContentId,
    ...t.tabsAndModalDepsEvent
  }), L0(t.basicSettingsInputsDepsEvent), Vv(t.skillPresetActionsDepsEvent), Wv(t.skillRowsEditingActionsDepsEvent), Xv(t.skillImportExportActionsDepsEvent), R0(t.statusEditorActionsDepsEvent), M0(t.ruleTextActionsDepsEvent));
}
function P0(t) {
  const e = t.getSettingsEvent(), r = document.getElementById(t.SETTINGS_CARD_ID_Event), n = document.getElementById(t.SETTINGS_THEME_ID_Event), o = document.getElementById(t.SETTINGS_ENABLED_ID_Event), i = document.getElementById(t.SETTINGS_RULE_ID_Event), c = document.getElementById(
    t.SETTINGS_AI_ROLL_MODE_ID_Event
  ), d = document.getElementById(
    t.SETTINGS_AI_ROUND_CONTROL_ID_Event
  ), h = document.getElementById(
    t.SETTINGS_EXPLODING_ENABLED_ID_Event
  ), f = document.getElementById(
    t.SETTINGS_ADVANTAGE_ENABLED_ID_Event
  ), b = document.getElementById(
    t.SETTINGS_DYNAMIC_RESULT_GUIDANCE_ID_Event
  ), v = document.getElementById(
    t.SETTINGS_DYNAMIC_DC_REASON_ID_Event
  ), E = document.getElementById(
    t.SETTINGS_STATUS_SYSTEM_ENABLED_ID_Event
  ), y = document.getElementById(
    t.SETTINGS_ALLOWED_DICE_SIDES_ID_Event
  ), $ = document.getElementById(
    t.SETTINGS_SUMMARY_DETAIL_ID_Event
  ), O = document.getElementById(
    t.SETTINGS_SUMMARY_ROUNDS_ID_Event
  ), L = document.getElementById(t.SETTINGS_SCOPE_ID_Event), D = document.getElementById(
    t.SETTINGS_OUTCOME_BRANCHES_ID_Event
  ), G = document.getElementById(
    t.SETTINGS_EXPLODE_OUTCOME_ID_Event
  ), P = document.getElementById(
    t.SETTINGS_SUMMARY_OUTCOME_ID_Event
  ), K = document.getElementById(
    t.SETTINGS_LIST_OUTCOME_PREVIEW_ID_Event
  ), X = document.getElementById(
    t.SETTINGS_TIME_LIMIT_ENABLED_ID_Event
  ), F = document.getElementById(
    t.SETTINGS_TIME_LIMIT_MIN_ID_Event
  ), z = document.getElementById(t.SETTINGS_TIME_LIMIT_ROW_ID_Event);
  document.getElementById(
    t.SETTINGS_COMPATIBILITY_MODE_ID_Event
  ), document.getElementById(
    t.SETTINGS_REMOVE_ROLLJSON_ID_Event
  ), document.getElementById(
    t.SETTINGS_STRIP_INTERNAL_ID_Event
  );
  const Z = document.getElementById(
    t.SETTINGS_SKILL_ENABLED_ID_Event
  ), H = document.getElementById(t.SETTINGS_SKILL_MODAL_ID_Event), B = document.getElementById(
    t.SETTINGS_STATUS_EDITOR_OPEN_ID_Event
  ), tt = document.getElementById(t.SETTINGS_STATUS_MODAL_ID_Event), it = document.getElementById(
    t.SETTINGS_RULE_TEXT_ID_Event
  ), dt = r?.querySelector(".st-roll-content") ?? r ?? null, Tt = Yn(gi().themeId), Rt = dl(Tt);
  if (n && (n.value = Rt), o && (o.checked = !!e.enabled), i && (i.checked = !!e.autoSendRuleToAI), c && (c.checked = !!e.enableAiRollMode), d && (d.checked = !!e.enableAiRoundControl), h && (h.checked = !!e.enableExplodingDice), f && (f.checked = !!e.enableAdvantageSystem), b && (b.checked = !!e.enableDynamicResultGuidance), v && (v.checked = !!e.enableDynamicDcReason), E && (E.checked = !!e.enableStatusSystem), y && (y.value = String(e.aiAllowedDiceSidesText || "")), $ && ($.value = e.summaryDetailMode), O && (O.value = String(e.summaryHistoryRounds)), L && (L.value = e.eventApplyScope), D && (D.checked = !!e.enableOutcomeBranches), G && (G.checked = !!e.enableExplodeOutcomeBranch), P && (P.checked = !!e.includeOutcomeInSummary), K && (K.checked = !!e.showOutcomePreviewInListCard), G && (G.disabled = !e.enableOutcomeBranches, G.style.opacity = e.enableOutcomeBranches ? "1" : "0.5"), P && (P.disabled = !e.enableOutcomeBranches, P.style.opacity = e.enableOutcomeBranches ? "1" : "0.5"), K && (K.disabled = !e.enableOutcomeBranches, K.style.opacity = e.enableOutcomeBranches ? "1" : "0.5"), X && (X.checked = !!e.enableTimeLimit), F && (F.value = String(e.minTimeLimitSeconds), F.disabled = !e.enableTimeLimit, F.style.opacity = e.enableTimeLimit ? "1" : "0.5"), z?.classList.toggle("is-disabled", !e.enableTimeLimit), Z && (Z.checked = !!e.enableSkillSystem), B && (B.disabled = !e.enableStatusSystem, B.style.opacity = e.enableStatusSystem ? "1" : "0.5"), Sl({
    settingsRoot: r,
    skillModal: H,
    statusModal: tt,
    selection: Tt,
    themeInput: n,
    themeInputValue: Rt,
    syncSharedSelectsEvent: !1
  }), Ei(dt ?? document), document.getElementById(t.SETTINGS_STATUS_ROWS_ID_Event)) {
    const rt = String(t.getActiveChatKeyEvent() ?? "").trim();
    rt && (hh({
      SETTINGS_STATUS_ROWS_ID_Event: t.SETTINGS_STATUS_ROWS_ID_Event,
      SETTINGS_STATUS_DIRTY_HINT_ID_Event: t.SETTINGS_STATUS_DIRTY_HINT_ID_Event,
      getActiveChatKeyEvent: () => rt,
      getActiveStatusesEvent: t.getActiveStatusesEvent
    }), C0(rt) || qt(t.SETTINGS_STATUS_ERRORS_ID_Event, []));
  }
  if (!t.isSkillDraftDirtyEvent()) {
    const rt = String(e.skillTableText ?? "{}"), vt = String(e.skillPresetStoreText ?? ""), Mt = document.getElementById(t.SETTINGS_SKILL_ROWS_ID_Event);
    (rt !== t.getSkillEditorLastSettingsTextEvent() || vt !== t.getSkillEditorLastPresetStoreTextEvent() || !Mt || !Mt.hasChildNodes()) && t.hydrateSkillDraftFromSettingsEvent();
  }
  if (it) {
    const rt = typeof e.ruleText == "string" ? e.ruleText : "";
    it.value !== rt && (it.value = rt);
  }
}
function B0(t) {
  let e = [], r = "[]", n = "", o = "", i = "", c = !1, d = "";
  function h(D) {
    c = !!D;
    const G = document.getElementById(
      t.SETTINGS_SKILL_DIRTY_HINT_ID_Event
    );
    G && (G.hidden = !c);
  }
  function f() {
    return c;
  }
  function b() {
    const D = t.buildSkillDraftSnapshotEvent(e);
    h(D !== r);
  }
  function v(D) {
    t0(D, {
      SETTINGS_SKILL_ERRORS_ID_Event: t.SETTINGS_SKILL_ERRORS_ID_Event,
      escapeHtmlEvent: t.escapeHtmlEvent
    });
  }
  function E() {
    const D = /* @__PURE__ */ new Set();
    for (const G of e) {
      const P = String(G.skillName ?? "").trim().toLowerCase();
      P && D.add(P);
    }
    return D.size;
  }
  function y() {
    const D = t.getSettingsEvent(), G = t.getSkillPresetStoreEvent(D), P = E();
    e0(G, {
      SETTINGS_SKILL_PRESET_LIST_ID_Event: t.SETTINGS_SKILL_PRESET_LIST_ID_Event,
      countSkillEntriesFromSkillTableTextEvent: t.countSkillEntriesFromSkillTableTextEvent,
      escapeAttrEvent: t.escapeAttrEvent,
      escapeHtmlEvent: t.escapeHtmlEvent,
      activeDraftCountEvent: P
    }), r0(G, {
      SETTINGS_SKILL_PRESET_META_ID_Event: t.SETTINGS_SKILL_PRESET_META_ID_Event,
      SETTINGS_SKILL_PRESET_NAME_ID_Event: t.SETTINGS_SKILL_PRESET_NAME_ID_Event,
      SETTINGS_SKILL_PRESET_DELETE_ID_Event: t.SETTINGS_SKILL_PRESET_DELETE_ID_Event,
      countSkillEntriesFromSkillTableTextEvent: t.countSkillEntriesFromSkillTableTextEvent,
      getActiveSkillPresetEvent: t.getActiveSkillPresetEvent,
      activeDraftCountEvent: P
    });
  }
  function $() {
    n0(e, {
      SETTINGS_SKILL_ROWS_ID_Event: t.SETTINGS_SKILL_ROWS_ID_Event,
      escapeAttrEvent: t.escapeAttrEvent
    }), y();
  }
  function O(D = !1) {
    if (!D && f()) return;
    const G = t.getSettingsEvent(), P = t.getSkillPresetStoreEvent(G), K = JSON.stringify(P, null, 2), X = t.getActiveSkillPresetEvent(P), F = t.normalizeSkillTableTextForSettingsEvent(X.skillTableText), z = F ?? "{}";
    F == null ? (e = [], d !== X.skillTableText && (d = X.skillTableText, ut.warn("技能预设配置无效，已按空表载入"), t.appendToConsoleEvent("技能预设配置格式无效，已按空表载入。", "warn"))) : (d = "", e = t.deserializeSkillTableTextToRowsEvent(z)), i = X.id, r = t.buildSkillDraftSnapshotEvent(e), n = z, o = K, h(!1), v([]), $();
  }
  function L() {
    return Jv({
      isSkillDraftDirtyEvent: f,
      hydrateSkillDraftFromSettingsEvent: O
    });
  }
  return {
    setSkillDraftDirtyEvent: h,
    isSkillDraftDirtyEvent: f,
    refreshSkillDraftDirtyStateEvent: b,
    renderSkillRowsEvent: $,
    renderSkillValidationErrorsEvent: v,
    hydrateSkillDraftFromSettingsEvent: O,
    confirmDiscardSkillDraftEvent: L,
    getSkillRowsDraftEvent: () => e,
    setSkillRowsDraftEvent: (D) => {
      e = D;
    },
    getSkillEditorActivePresetIdEvent: () => i,
    setSkillEditorLastSavedSnapshotEvent: (D) => {
      r = D;
    },
    getSkillEditorLastSavedSnapshotEvent: () => r,
    getSkillEditorLastSettingsTextEvent: () => n,
    getSkillEditorLastPresetStoreTextEvent: () => o
  };
}
function U0() {
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
function H0() {
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
function z0(t) {
  return `<pre>${t}</pre>`;
}
function G0(t) {
  return `骰子调试模式
<pre>${t}</pre>`;
}
function K0(t) {
  const {
    registerMacro: e,
    SlashCommandParser: r,
    SlashCommand: n,
    SlashCommandArgument: o,
    ARGUMENT_TYPE: i,
    getDiceMeta: c,
    rollExpression: d,
    saveLastRoll: h,
    buildResultMessage: f,
    appendToConsoleEvent: b
  } = t, v = globalThis;
  v.__stRollBaseMacrosRegisteredEvent || (e("lastRollTotal", () => {
    const E = c();
    return E.lastTotal == null ? "尚未掷骰，请先使用 /roll" : String(E.lastTotal);
  }), e("lastRoll", () => {
    const E = c();
    return E.last ? JSON.stringify(E.last, null, 2) : "尚未掷骰，请先使用 /roll";
  }), v.__stRollBaseMacrosRegisteredEvent = !0), !v.__stRollBaseCommandRegisteredEvent && (!r || !n || !o || !i || (r.addCommandObject(
    n.fromProps({
      name: "roll",
      aliases: ["dice"],
      returns: "通用骰子：支持 NdM+X，例如 3d6+2、1d20",
      namedArgumentList: [],
      unnamedArgumentList: [
        o.fromProps({
          description: "骰子表达式（如 1d20、3d6+2）。留空等于 1d20。",
          typeList: i.STRING,
          isRequired: !1
        })
      ],
      helpString: U0(),
      callback: (E, y) => {
        try {
          const O = (y ?? "").toString().trim() || "1d20", L = d(O);
          h(L);
          const D = f(L);
          return b(D), "";
        } catch ($) {
          const O = `掷骰出错：${$?.message ?? String($)}`;
          return b(O, "error"), "";
        }
      }
    })
  ), v.__stRollBaseCommandRegisteredEvent = !0));
}
function ph(t) {
  return t === 0 ? "0" : t > 0 ? `+${t}` : `${t}`;
}
function La(t) {
  return t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;").replace(/`/g, "&#96;");
}
function j0(t) {
  const e = [], r = Array.isArray(t.rolls) && t.rolls.length > 0 ? `[${t.rolls.join(", ")}]` : "[]", n = Number.isFinite(Number(t.rawTotal)) ? Number(t.rawTotal) : 0, o = Number.isFinite(Number(t.modifier)) ? Number(t.modifier) : 0, i = Number.isFinite(Number(t.total)) ? Number(t.total) : n + o;
  return e.push(`骰面 ${r}`), e.push(`原始值 ${n}`), e.push(`修正值 ${ph(o)}`), e.push(`总计 ${i}`), t.exploding && e.push(t.explosionTriggered ? "爆骰已触发" : "爆骰已启用"), e.join(" | ");
}
function ii(t, e, r, n = 56) {
  if (e === 6) {
    const h = ({
      1: [[24, 24]],
      2: [[14, 14], [34, 34]],
      3: [[14, 14], [24, 24], [34, 34]],
      4: [[14, 14], [14, 34], [34, 14], [34, 34]],
      5: [[14, 14], [14, 34], [24, 24], [34, 14], [34, 34]],
      6: [[14, 14], [14, 24], [14, 34], [34, 14], [34, 24], [34, 34]]
    }[t] || []).map(
      ([f, b]) => `<circle cx="${f}" cy="${b}" r="4" fill="${r}" />`
    ).join("");
    return `
      <svg width="${n}" height="${n}" viewBox="0 0 48 48" style="display:inline-block; vertical-align: middle;">
          <rect x="4" y="4" width="40" height="40" rx="8" ry="8" fill="none" stroke="${r}" stroke-width="3" />
          ${h}
      </svg>`;
  }
  return `
      <svg width="${n}" height="${n}" viewBox="0 0 48 48" style="display:inline-block; vertical-align: middle;">
          <path d="M24 4 L43 14 L43 34 L24 44 L5 34 L5 14 Z" fill="none" stroke="${r}" stroke-width="3" />
          <path d="M24 4 L24 24 M24 24 L43 34 M24 24 L5 34" stroke="${r}" stroke-width="1.5" opacity="0.6"/>
          <text x="24" y="33" font-size="18" text-anchor="middle" fill="${r}" font-weight="bold" style="font-family: sans-serif;">${t}</text>
      </svg>`;
}
function fh(t, e = 52) {
  const r = Math.round(e / 2), n = Math.max(20, Math.round(e * 0.42));
  return `
    <div class="cube-scene" style="perspective: 600px; width: ${e}px; height: ${e}px;">
      <div class="cube" style="
        width: 100%; height: 100%; position: relative; transform-style: preserve-3d;
      ">
        <div class="cube-face front"  style="position: absolute; width: ${e}px; height: ${e}px; border: 2px solid ${t}; background: rgba(43, 29, 29, 0.8); color: ${t}; line-height: ${e}px; text-align: center; font-weight: bold; font-size: ${n}px; transform: rotateY(  0deg) translateZ(${r}px);">?</div>
        <div class="cube-face back"   style="position: absolute; width: ${e}px; height: ${e}px; border: 2px solid ${t}; background: rgba(43, 29, 29, 0.8); color: ${t}; line-height: ${e}px; text-align: center; font-weight: bold; font-size: ${n}px; transform: rotateY(180deg) translateZ(${r}px);">?</div>
        <div class="cube-face right"  style="position: absolute; width: ${e}px; height: ${e}px; border: 2px solid ${t}; background: rgba(43, 29, 29, 0.8); color: ${t}; line-height: ${e}px; text-align: center; font-weight: bold; font-size: ${n}px; transform: rotateY( 90deg) translateZ(${r}px);">?</div>
        <div class="cube-face left"   style="position: absolute; width: ${e}px; height: ${e}px; border: 2px solid ${t}; background: rgba(43, 29, 29, 0.8); color: ${t}; line-height: ${e}px; text-align: center; font-weight: bold; font-size: ${n}px; transform: rotateY(-90deg) translateZ(${r}px);">?</div>
        <div class="cube-face top"    style="position: absolute; width: ${e}px; height: ${e}px; border: 2px solid ${t}; background: rgba(43, 29, 29, 0.8); color: ${t}; line-height: ${e}px; text-align: center; font-weight: bold; font-size: ${n}px; transform: rotateX( 90deg) translateZ(${r}px);">?</div>
        <div class="cube-face bottom" style="position: absolute; width: ${e}px; height: ${e}px; border: 2px solid ${t}; background: rgba(43, 29, 29, 0.8); color: ${t}; line-height: ${e}px; text-align: center; font-weight: bold; font-size: ${n}px; transform: rotateX(-90deg) translateZ(${r}px);">?</div>
      </div>
    </div>
  `;
}
function q0(t) {
  const e = ph(t.modifier), r = t.rolls.join(", "), n = t.modifier !== 0, o = "d" + Math.random().toString(36).substr(2, 9), i = {
    border: "#c5a059",
    bg: "linear-gradient(135deg, #2b1d1d 0%, #1a1010 100%)",
    headerBg: "rgba(0, 0, 0, 0.4)",
    textMain: "#e8dcb5",
    textHighlight: "#ffdb78",
    critSuccess: "#4caf50",
    critFail: "#f44336"
  };
  let c = "normal", d = "", h = i.textHighlight, f = "0 2px 4px rgba(0,0,0,0.5)", b = i.bg, v = i.border;
  if (t.count === 1) {
    const G = t.rolls[0], P = t.sides;
    G === P ? (c = "success", d = "大成功！", h = i.critSuccess, f = "0 0 15px rgba(76, 175, 80, 0.8)", b = "linear-gradient(135deg, #1b3320 0%, #0d1a10 100%)", v = i.critSuccess) : G === 1 && (c = "fail", d = "大失败！", h = i.critFail, f = "0 0 15px rgba(244, 67, 54, 0.8)", b = "linear-gradient(135deg, #331b1b 0%, #1a0d0d 100%)", v = i.critFail);
  }
  const E = t.rolls.length <= 5, y = j0(t), $ = E ? t.rolls.map((G, P) => {
    const K = ii(G, t.sides, h), X = `${y} | 第${P + 1}颗: ${G}`;
    return `<span style="display:inline-flex;cursor:help;" data-tip="${La(X)}">${K}</span>`;
  }).join(" ") : `<span style="display:inline-flex;cursor:help;" data-tip="${La(y)}">${ii(0, t.sides, h)}</span>`, O = fh(i.textHighlight), L = [];
  t.rolls.length && L.push(`骰面: [${r}]`), n && L.push(`修正值: ${e}`), t.exploding && L.push(t.explosionTriggered ? "爆骰已触发" : "爆骰已启用");
  const D = L.join(" | ");
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
    border: 2px solid ${v};
    border-radius: 4px;
    background: ${b};
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
        ">${t.expr}</span>
    </div>

    <div class="dice-wrapper-${o}">
        <div class="dice-rolling-${o}">
            ${O}
        </div>

        <div class="dice-result-${o}">
            ${d ? `<div class="${c === "success" ? `crit-success-${o}` : `crit-fail-${o}`}">${d}</div>` : ""}
          ${t.exploding ? `<div class="explosion-note-${o}">${t.explosionTriggered ? "连锁爆骰！" : "爆骰已开启"}</div>` : ""}
            
            <div style="margin-bottom: 12px; display: flex; justify-content: center; gap: 8px; flex-wrap: wrap;" data-tip="${La(y)}">
                ${$}
            </div>

            <div style="
                font-size: 2.5em;
                font-weight: bold;
                color: ${h};
                text-shadow: ${f};
                line-height: 1;
            ">
                ${t.total}
            </div>
            
            <div style="
                font-size: 0.9em;
                color: ${i.textMain};
                margin-top: 8px;
                opacity: 0.8;
            ">
              ${D}
            </div>
        </div>

    </div>
  </div>
  `;
}
function F0(t) {
  const e = t.compactMode === !0, r = e ? "92px" : "108px", n = e ? "8px 0" : "14px 0", o = e ? "0" : "12px", i = e ? "auto" : "100%";
  return `
    <style>
      @keyframes spin-3d-${t.uniqueId} {
        0% { transform: rotateX(0deg) rotateY(0deg); }
        100% { transform: rotateX(360deg) rotateY(360deg); }
      }
      @keyframes fade-out-${t.uniqueId} {
        0% { opacity: 1; }
        90% { opacity: 0; }
        100% { opacity: 0; display: none; }
      }
      @keyframes fade-in-${t.uniqueId} {
        0% { opacity: 0; transform: scale(0.8); }
        100% { opacity: 1; transform: scale(1); }
      }
      @keyframes pulse-crit-${t.uniqueId} {
        0% { transform: scale(1); }
        50% { transform: scale(1.1); }
        100% { transform: scale(1); }
      }
      @keyframes shake-crit-${t.uniqueId} {
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
      
      .dice-wrapper-${t.uniqueId} {
        position: relative;
        min-height: ${r};
        padding: ${n};
        margin-top: ${o};
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
      }
      
      .dice-rolling-${t.uniqueId} {
        position: absolute;
        top: 50%; left: 50%;
        transform: translate(-50%, -50%);
        animation: fade-out-${t.uniqueId} 0.2s forwards 1.2s;
        z-index: 10;
        display: flex;
        justify-content: center;
        align-items: center;
      }
      
      .dice-rolling-${t.uniqueId} .cube {
        animation: spin-3d-${t.uniqueId} 1.5s linear infinite;
      }

      .dice-result-${t.uniqueId} {
        opacity: 0;
        animation: fade-in-${t.uniqueId} 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards 1.3s;
        text-align: center;
        width: ${i};
      }

      .crit-success-${t.uniqueId} {
        animation: pulse-crit-${t.uniqueId} 1s infinite;
        color: #52c41a;
        font-weight: bold;
        margin-bottom: 8px;
        text-shadow: 0 0 10px rgba(82, 196, 26, 0.5);
      }

      .crit-fail-${t.uniqueId} {
        animation: shake-crit-${t.uniqueId} 0.5s;
        color: #ff4d4f;
        font-weight: bold;
        margin-bottom: 8px;
        text-shadow: 0 0 10px rgba(255, 77, 79, 0.5);
      }
    </style>
    
    <div class="dice-wrapper-${t.uniqueId}">
        <div class="dice-rolling-${t.uniqueId}">
            ${t.rollingVisualHtml}
        </div>

        <div class="dice-result-${t.uniqueId}">
            ${t.critText ? `<div class="${t.critType === "success" ? `crit-success-${t.uniqueId}` : `crit-fail-${t.uniqueId}`}">${t.critText}</div>` : ""}
             
            <div style="margin-bottom: 8px; display: flex; justify-content: center; gap: 8px; flex-wrap: wrap;">
                ${t.diceVisualsHtml}
            </div>
        </div>
    </div>
    `;
}
const _r = "stx_memory_os", gh = "stx_rollhelper";
async function V0(t = 1200) {
  try {
    const e = await Lu(
      "plugin:request:ping",
      {},
      gh,
      {
        to: _r,
        timeoutMs: t
      }
    );
    return {
      available: !!e?.alive,
      enabled: !!e?.isEnabled,
      pluginId: String(e?.pluginId ?? _r),
      version: String(e?.version ?? ""),
      capabilities: Array.isArray(e?.capabilities) ? e.capabilities.map((r) => String(r)) : []
    };
  } catch {
    return {
      available: !1,
      enabled: !1,
      pluginId: _r,
      version: "",
      capabilities: []
    };
  }
}
async function Y0(t = 1200) {
  try {
    const e = await Lu(
      "plugin:request:memory_chat_keys",
      {},
      gh,
      {
        to: _r,
        timeoutMs: t
      }
    ), r = Array.isArray(e?.chatKeys) ? e.chatKeys.map((n) => String(n ?? "").trim()).filter(Boolean) : [];
    return {
      chatKeys: Array.from(new Set(r)),
      updatedAt: Number.isFinite(Number(e?.updatedAt)) ? Number(e.updatedAt) : null
    };
  } catch {
    return {
      chatKeys: [],
      updatedAt: null
    };
  }
}
function W0(t) {
  try {
    return Gp(
      "plugin:broadcast:state_changed",
      (e) => {
        const r = String(e?.pluginId ?? "");
        r && r !== _r || t({
          enabled: !!e?.isEnabled,
          pluginId: r || _r
        });
      },
      { from: _r }
    );
  } catch {
    return () => {
    };
  }
}
const Qt = B0({
  SETTINGS_SKILL_DIRTY_HINT_ID_Event: pd,
  SETTINGS_SKILL_ERRORS_ID_Event: hd,
  SETTINGS_SKILL_ROWS_ID_Event: To,
  SETTINGS_SKILL_PRESET_LIST_ID_Event: Xi,
  SETTINGS_SKILL_PRESET_META_ID_Event: Sd,
  SETTINGS_SKILL_PRESET_NAME_ID_Event: Qi,
  SETTINGS_SKILL_PRESET_DELETE_ID_Event: Ji,
  getSettingsEvent: St,
  getSkillPresetStoreEvent: Ja,
  getActiveSkillPresetEvent: so,
  normalizeSkillTableTextForSettingsEvent: sn,
  deserializeSkillTableTextToRowsEvent: Hm,
  buildSkillDraftSnapshotEvent: Bm,
  countSkillEntriesFromSkillTableTextEvent: dv,
  appendToConsoleEvent: vr,
  escapeHtmlEvent: cn,
  escapeAttrEvent: ll
});
function X0(t, e, r) {
  return Gv({
    ...cg,
    drawerToggleId: t,
    drawerContentId: e,
    drawerIconId: r
  });
}
const bh = Qt.isSkillDraftDirtyEvent, lu = Qt.refreshSkillDraftDirtyStateEvent, cu = Qt.renderSkillRowsEvent, Ma = Qt.renderSkillValidationErrorsEvent, J0 = Qt.hydrateSkillDraftFromSettingsEvent, uu = Qt.confirmDiscardSkillDraftEvent, du = Yv({
  getRowsEvent: Qt.getSkillRowsDraftEvent,
  setRowsEvent: Qt.setSkillRowsDraftEvent,
  getSnapshotEvent: Qt.getSkillEditorLastSavedSnapshotEvent,
  setSnapshotEvent: Qt.setSkillEditorLastSavedSnapshotEvent
});
function Q0(t, e) {
  O0({
    SETTINGS_CARD_ID_Event: Bn,
    drawerToggleId: t,
    drawerContentId: e,
    tabsAndModalDepsEvent: {
      ...ug,
      confirmDiscardSkillDraftEvent: uu,
      isElementVisibleEvent: Qv,
      isSkillDraftDirtyEvent: bh
    },
    basicSettingsInputsDepsEvent: {
      ...Hs,
      SUMMARY_HISTORY_ROUNDS_MAX_Event: el,
      SUMMARY_HISTORY_ROUNDS_MIN_Event: tl,
      DEFAULT_SUMMARY_HISTORY_ROUNDS_Event: Ln.summaryHistoryRounds,
      updateSettingsEvent: Kn
    },
    skillPresetActionsDepsEvent: {
      ...dg,
      SKILL_PRESET_DEFAULT_ID_Event: Un,
      SKILL_PRESET_NEW_NAME_BASE_Event: nl,
      DEFAULT_SKILL_PRESET_TABLE_TEXT_Event: Hd,
      getSkillEditorActivePresetIdEvent: Qt.getSkillEditorActivePresetIdEvent,
      confirmDiscardSkillDraftEvent: uu,
      getSettingsEvent: St,
      getSkillPresetStoreEvent: Ja,
      getSkillPresetByIdEvent: Qa,
      saveSkillPresetStoreEvent: Hc,
      getActiveSkillPresetEvent: so,
      getUniqueSkillPresetNameEvent: mv,
      createIdEvent: Ir,
      buildDefaultSkillPresetStoreEvent: () => nn(),
      normalizeSkillPresetNameKeyEvent: jn,
      renderSkillValidationErrorsEvent: Ma,
      appendToConsoleEvent: vr
    },
    skillRowsEditingActionsDepsEvent: {
      ...mg,
      skillDraftAccessorEvent: du,
      createSkillEditorRowDraftEvent: Pm,
      renderSkillRowsEvent: cu,
      refreshSkillDraftDirtyStateEvent: lu,
      renderSkillValidationErrorsEvent: Ma
    },
    skillImportExportActionsDepsEvent: {
      ...hg,
      skillDraftAccessorEvent: du,
      serializeSkillRowsToSkillTableTextEvent: fv,
      getSettingsEvent: St,
      getSkillPresetStoreEvent: Ja,
      getActiveSkillPresetEvent: so,
      normalizeSkillTableTextForSettingsEvent: sn,
      deserializeSkillTableTextToRowsEvent: Hm,
      validateSkillRowsEvent: zm,
      renderSkillRowsEvent: cu,
      refreshSkillDraftDirtyStateEvent: lu,
      renderSkillValidationErrorsEvent: Ma,
      copyTextToClipboardEvent: Zv,
      appendToConsoleEvent: vr,
      buildSkillDraftSnapshotEvent: Bm,
      setSkillDraftDirtyEvent: Qt.setSkillDraftDirtyEvent,
      saveSkillPresetStoreEvent: Hc
    },
    statusEditorActionsDepsEvent: {
      SETTINGS_STATUS_ROWS_ID_Event: Mi,
      SETTINGS_STATUS_ADD_ID_Event: Xu,
      SETTINGS_STATUS_SAVE_ID_Event: Ju,
      SETTINGS_STATUS_RESET_ID_Event: Qu,
      SETTINGS_STATUS_REFRESH_ID_Event: Ni,
      SETTINGS_STATUS_CLEAN_UNUSED_ID_Event: Li,
      SETTINGS_STATUS_ERRORS_ID_Event: Oi,
      SETTINGS_STATUS_DIRTY_HINT_ID_Event: Pi,
      SETTINGS_STATUS_SPLITTER_ID_Event: Zu,
      SETTINGS_STATUS_COLS_ID_Event: rd,
      SETTINGS_STATUS_CHAT_LIST_ID_Event: td,
      SETTINGS_STATUS_CHAT_META_ID_Event: ed,
      SETTINGS_STATUS_MEMORY_STATE_ID_Event: nd,
      getActiveStatusesEvent: () => Om($t()),
      setActiveStatusesEvent: uv,
      getActiveChatKeyEvent: gl,
      listHostChatsForCurrentScopeEvent: nv,
      listChatScopedStatusSummariesEvent: rv,
      loadStatusesForChatKeyEvent: sv,
      saveStatusesForChatKeyEvent: ov,
      cleanupUnusedChatStatesForCurrentTavernEvent: av,
      probeMemoryPluginEvent: V0,
      fetchMemoryChatKeysEvent: Y0,
      subscribeMemoryPluginStateEvent: W0,
      syncSettingsUiEvent: kl,
      appendToConsoleEvent: vr
    },
    ruleTextActionsDepsEvent: {
      ...pg,
      updateSettingsEvent: Kn
    }
  });
}
function kl() {
  P0({
    getSettingsEvent: St,
    ...fg,
    SETTINGS_COMPATIBILITY_MODE_ID_Event: Hs.SETTINGS_COMPATIBILITY_MODE_ID_Event,
    SETTINGS_REMOVE_ROLLJSON_ID_Event: Hs.SETTINGS_REMOVE_ROLLJSON_ID_Event,
    SETTINGS_STRIP_INTERNAL_ID_Event: Hs.SETTINGS_STRIP_INTERNAL_ID_Event,
    isSkillDraftDirtyEvent: bh,
    hydrateSkillDraftFromSettingsEvent: J0,
    getActiveStatusesEvent: () => Om($t()),
    getActiveChatKeyEvent: gl,
    getSkillEditorLastSettingsTextEvent: Qt.getSkillEditorLastSettingsTextEvent,
    getSkillEditorLastPresetStoreTextEvent: Qt.getSkillEditorLastPresetStoreTextEvent
  });
}
function Z0(t = 0) {
  Vm(
    {
      SETTINGS_CARD_ID_Event: Bn,
      SETTINGS_SKILL_MODAL_ID_Event: ko,
      SETTINGS_STATUS_MODAL_ID_Event: _o,
      buildSettingsCardHtmlTemplateEvent: Lf,
      buildSettingsCardTemplateIdsEvent: X0,
      ensureSettingsCardStylesEvent: () => {
        zv({
          SETTINGS_STYLE_ID_Event: Zf,
          SETTINGS_CARD_ID_Event: Bn,
          buildSettingsCardStylesTemplateEvent: Vf
        });
      },
      syncSettingsBadgeVersionEvent: () => {
        Hv({
          SETTINGS_BADGE_ID_Event: Yu,
          SETTINGS_BADGE_VERSION_Event: Md
        });
      },
      syncSettingsUiEvent: kl,
      onMountedEvent: ({ drawerToggleId: e, drawerContentId: r }) => Q0(e, r)
    },
    t
  );
}
function tx() {
  const t = Ao();
  K0({
    registerMacro: Pg,
    SlashCommandParser: t.parser,
    SlashCommand: t.command,
    SlashCommandArgument: t.argument,
    ARGUMENT_TYPE: t.argumentType,
    getDiceMeta: Gn,
    rollExpression: Gm,
    saveLastRoll: $m,
    buildResultMessage: q0,
    appendToConsoleEvent: vr
  });
}
function ex() {
  Zb(() => {
    kl();
  });
}
function Po(t) {
  return t == null || t === "" ? ">=" : t === ">=" || t === ">" || t === "<=" || t === "<" ? t : null;
}
function zt(t) {
  return typeof t == "string" ? t.trim() : "";
}
function Oa(t, e, r, n) {
  const o = zt(t);
  if (!o) return;
  if (o.length <= n) return o;
  const i = o.slice(0, n);
  return ut.warn(`outcomes.${e} 过长，已截断: event=${r} len=${o.length}`), `${i}（已截断）`;
}
function rx(t, e, r) {
  const n = zt(t);
  if (!n) return;
  if (n.length <= r) return n;
  const o = n.slice(0, r);
  return ut.warn(`dc_reason 过长，已截断: event=${e} len=${n.length}`), `${o}（已截断）`;
}
function nx(t, e, r) {
  if (!t || typeof t != "object") return;
  const n = Oa(t.success, "success", e, r), o = Oa(t.failure, "failure", e, r), i = Oa(t.explode, "explode", e, r);
  if (!(!n && !o && !i))
    return { success: n, failure: o, explode: i };
}
function vh(t, e) {
  const r = zt(t);
  if (!r) return null;
  if (!e.test(r))
    return ut.warn("非法 timeLimit，按不限时处理:", r), null;
  const n = r.match(/^P(?:(\d+)W)?(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/i);
  if (!n)
    return ut.warn("不支持的 timeLimit 组合，按不限时处理:", r), null;
  const o = Number(n[1] || 0), i = Number(n[2] || 0), c = Number(n[3] || 0), d = Number(n[4] || 0), h = Number(n[5] || 0), b = ((((o * 7 + i) * 24 + c) * 60 + d) * 60 + h) * 1e3;
  return !Number.isFinite(b) || b < 0 ? (ut.warn("timeLimit 解析失败，按不限时处理:", r), null) : b;
}
function wl(t, e) {
  if (!e.enableTimeLimit || t == null) return null;
  const r = Math.max(1, Math.floor(Number(e.minTimeLimitSeconds) || 1)), n = r * 1e3;
  return t < n ? (ut.info(`timeLimit 低于最短时限，提升到 ${r}s（原始 ${t}ms）`), n) : t;
}
function sx(t) {
  const e = zt(t).toLowerCase();
  if (e) {
    if (e === "protagonist" || e === "player" || e === "user" || e === "mc" || e === "main_character")
      return "protagonist";
    if (e === "all" || e === "any" || e === "both")
      return "all";
    if (e === "character" || e === "assistant" || e === "npc" || e === "self")
      return "character";
  }
}
function ox(t) {
  const e = zt(t).toLowerCase();
  if (e) {
    if (e === "auto" || e === "automatic" || e === "system" || e === "ai")
      return "auto";
    if (e === "manual" || e === "user" || e === "player")
      return "manual";
  }
}
function ax(t) {
  const e = zt(t).toLowerCase();
  if (e) {
    if (e === "advantage" || e === "adv" || e === "up" || e === "high" || e === "benefit")
      return "advantage";
    if (e === "disadvantage" || e === "dis" || e === "down" || e === "low" || e === "penalty")
      return "disadvantage";
    if (e === "normal" || e === "none" || e === "neutral" || e === "off")
      return "normal";
  }
}
function ix(t) {
  const e = zt(t).toLowerCase();
  if (e) {
    if (e === "self" || e === "protagonist" || e === "player" || e === "mc" || e === "main_character")
      return "self";
    if (e === "scene" || e === "situation" || e === "environment" || e === "context")
      return "scene";
    if (e === "supporting" || e === "character" || e === "npc" || e === "assistant")
      return "supporting";
    if (e === "object" || e === "item" || e === "thing" || e === "prop")
      return "object";
    if (e === "other" || e === "misc")
      return "other";
  }
}
function lx(t, e) {
  const r = zt(e);
  return t === "self" ? "主角自己" : t === "scene" ? "场景" : t === "supporting" ? r ? `配角 ${r}` : "配角" : t === "object" ? r ? `物件 ${r}` : "物件" : r ? `其他对象 ${r}` : "其他对象";
}
function Il(t, e) {
  const r = t && typeof t == "object" && !Array.isArray(t) ? t : {};
  let n = ix(r.type ?? r.targetType ?? r.kind ?? t);
  const o = zt(
    r.name ?? r.targetName ?? r.label ?? r.value
  );
  n || (e === "protagonist" ? n = "self" : e === "character" ? n = "supporting" : n = "scene");
  const i = o || void 0;
  return {
    targetType: n,
    targetName: i,
    targetLabel: lx(n, i)
  };
}
function cx(t) {
  if (t.targetType === "self") return !0;
  if (t.targetType === "supporting" || t.targetType === "object") return !1;
  if (t.scope === "protagonist" || t.scope === "all") return !0;
  if (t.scope === "character") return !1;
  const e = `${t.title}
${t.desc}
${t.skill}
${t.targetLabel}`;
  return /(\byou\b|\byour\b|\bplayer\b|\bprotagonist\b|主角|玩家|你)/i.test(e);
}
function ux(t, e) {
  return e === "all" ? t : t.filter(cx);
}
function xh(t) {
  const e = zt(t);
  if (!e) return null;
  const r = e.split(/[,\s]+/).map((n) => Number(n.trim())).filter((n) => Number.isFinite(n) && n > 0 && Number.isInteger(n));
  return r.length === 0 ? null : new Set(r);
}
function dx(t, e) {
  const r = xh(e.aiAllowedDiceSidesText);
  if (!r || r.size === 0) return !0;
  try {
    const n = Je(t);
    return r.has(n.sides);
  } catch {
    return !1;
  }
}
function mx(t, e) {
  const r = xh(e.aiAllowedDiceSidesText), n = r ? Array.from(r).sort((f, b) => f - b) : [];
  if (n.length === 0)
    return { nextExpr: t, changed: !1, allowedSidesText: "" };
  const o = Je(t);
  if (r.has(o.sides))
    return {
      nextExpr: t,
      changed: !1,
      allowedSidesText: n.join(",")
    };
  const i = n[0], c = o.modifier === 0 ? "" : o.modifier > 0 ? `+${o.modifier}` : String(o.modifier), d = o.keepMode && o.keepCount ? `${o.keepMode}${o.keepCount}` : "";
  return {
    nextExpr: `${o.count}d${i}${o.explode ? "!" : ""}${d}${c}`,
    changed: !0,
    allowedSidesText: n.join(",")
  };
}
function hx(t, e) {
  if (!t || typeof t != "object") return null;
  const r = zt(t.id), n = zt(t.title);
  let o = zt(t.checkDice);
  const i = zt(t.skill), c = zt(t.timeLimit), d = zt(t.desc), h = Po(t.compare), f = sx(t.scope ?? t.eventScope ?? t.applyTo), b = Il(
    t.target ?? { type: t.targetType, name: t.targetName ?? t.targetLabel },
    f
  ), v = ox(t.rollMode), E = ax(
    t.advantageState ?? t.advantage ?? t.advState
  ), y = Number(t.dc), $ = rx(
    t.dc_reason ?? t.dcReason,
    r || "unknown_event",
    e.OUTCOME_TEXT_MAX_LEN_Event
  ), O = {
    success: t.successOutcome,
    failure: t.failureOutcome,
    explode: t.explodeOutcome
  }, L = t.outcomes && typeof t.outcomes == "object" ? { ...O, ...t.outcomes } : O, D = nx(L, r || "unknown_event", e.OUTCOME_TEXT_MAX_LEN_Event), G = vh(c, e.ISO_8601_DURATION_REGEX_Event), P = e.getSettingsEvent(), K = wl(G, P), X = c && G != null ? c : void 0;
  if (!r || !n || !o || !i || !d || h == null || !Number.isFinite(y)) return null;
  try {
    Je(o);
  } catch {
    return null;
  }
  if (!dx(o, P)) {
    const F = mx(o, P);
    if (F.changed)
      ut.warn(
        `事件骰式不在允许面数列表中，自动修正: event=${r} from=${o} to=${F.nextExpr} allowed=${F.allowedSidesText || "(未配置)"}`
      ), o = F.nextExpr;
    else {
      const z = zt(P.aiAllowedDiceSidesText);
      return ut.warn(
        `事件骰式不在允许面数列表中，已忽略: event=${r} checkDice=${o} allowed=${z || "(未配置)"}`
      ), null;
    }
  }
  return {
    id: r,
    title: n,
    checkDice: o,
    dc: y,
    compare: h,
    scope: f,
    rollMode: v,
    advantageState: E,
    skill: i,
    targetType: b.targetType,
    targetName: b.targetName,
    targetLabel: b.targetLabel,
    timeLimitMs: K,
    timeLimit: X,
    desc: d,
    dcReason: $,
    outcomes: D
  };
}
function px(t) {
  if (!t || typeof t != "object") return !1;
  const e = t;
  if ((e.end_round ?? e.endRound) === !0) return !0;
  const n = zt(
    e.round_control ?? e.roundControl ?? e.round_action ?? e.roundAction
  ).toLowerCase();
  return n ? n === "end_round" || n === "end" || n === "close" || n === "new_round" : !1;
}
function mu(t, e) {
  if (!t || typeof t != "object" || t.type !== "dice_events" || String(t.version) !== "1" || !Array.isArray(t.events)) return null;
  const r = px(t), n = [];
  for (const o of t.events) {
    const i = hx(o, e);
    if (!i) {
      ut.warn("丢弃非法事件字段", o);
      continue;
    }
    n.push(i);
  }
  return n.length === 0 && !r ? null : { events: n, shouldEndRound: r };
}
function hu(t) {
  const e = String(t || "").replace(/[\u200B-\u200D\u2060]/g, "").replace(/\uFEFF/g, "").trim();
  if (!e) return null;
  const r = [], n = (b) => {
    const v = b.trim();
    v && (r.includes(v) || r.push(v));
  }, o = (b) => b.replace(/[“”]/g, '"').replace(/[‘’]/g, "'").replace(/：/g, ":").replace(/，/g, ",").replace(/\u00A0/g, " "), i = (b) => b.replace(/,\s*([}\]])/g, "$1"), c = (b) => b.replace(/^\s*```[a-zA-Z0-9_-]*\s*[\r\n]+/, "").replace(/[\r\n]+\s*```\s*$/, "").trim(), d = (b) => b.replace(/^\s*(?:rolljson|json)\s*[\r\n]+/i, "").trim(), h = (b) => {
    const v = b.indexOf("{");
    if (v < 0) return null;
    let E = 0, y = !1, $ = !1;
    for (let O = v; O < b.length; O++) {
      const L = b[O];
      if (y) {
        if ($) {
          $ = !1;
          continue;
        }
        if (L === "\\") {
          $ = !0;
          continue;
        }
        L === '"' && (y = !1);
        continue;
      }
      if (L === '"') {
        y = !0;
        continue;
      }
      if (L === "{") {
        E += 1;
        continue;
      }
      if (L === "}" && (E -= 1, E === 0))
        return b.slice(v, O + 1);
    }
    return null;
  }, f = [
    e,
    c(e),
    d(e),
    d(c(e))
  ];
  for (const b of f) {
    if (!b) continue;
    n(b), n(o(b)), n(i(b)), n(i(o(b)));
    const v = h(b);
    v && (n(v), n(o(v)), n(i(v)), n(i(o(v))));
  }
  for (const b of r)
    try {
      return JSON.parse(b);
    } catch {
    }
  return null;
}
function pu(t) {
  try {
    const e = document.createElement("textarea");
    return e.innerHTML = t, e.value;
  } catch {
    return t.replace(/&quot;/g, '"').replace(/&#34;/g, '"').replace(/&apos;/g, "'").replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
  }
}
function fx(t, e) {
  const r = /```(?:rolljson|json)?\s*([\s\S]*?)```/gi, n = [], o = [];
  let i = !1, c;
  for (; (c = r.exec(t)) !== null; ) {
    const h = pu(c[1] ?? "").trim();
    if (!h) continue;
    const f = /"type"\s*:\s*"dice_events"/i.test(h);
    f && n.push({ start: c.index, end: c.index + c[0].length });
    let b;
    try {
      if (b = hu(h), !b) throw new Error("无法修复为合法 JSON");
    } catch (E) {
      f && ut.warn("事件 JSON 解析失败，已隐藏代码块", E);
      continue;
    }
    const v = mu(b, e);
    v && (o.push(...v.events), v.shouldEndRound && (i = !0));
  }
  const d = /<pre\b[\s\S]*?<\/pre>/gi;
  for (; (c = d.exec(t)) !== null; ) {
    const h = c[0], f = h.match(/<code\b[^>]*>([\s\S]*?)<\/code>/i), b = (f ? f[1] : h).replace(/<[^>]+>/g, ""), v = pu(b).trim();
    if (!v) continue;
    const E = /"type"\s*:\s*"dice_events"/i.test(v);
    E && n.push({ start: c.index, end: c.index + h.length });
    let y;
    try {
      if (y = hu(v), !y) throw new Error("无法修复为合法 JSON");
    } catch (O) {
      E && ut.warn("HTML 事件 JSON解析失败，已隐藏代码块", O);
      continue;
    }
    const $ = mu(y, e);
    $ && (o.push(...$.events), $.shouldEndRound && (i = !0));
  }
  return { events: o, ranges: n, shouldEndRound: i };
}
function gx(t, e, r) {
  if (e.length === 0) return t;
  const n = [...e].sort((c, d) => c.start - d.start);
  let o = 0, i = "";
  for (const c of n)
    c.start > o && (i += t.slice(o, c.start)), o = Math.max(o, c.end);
  return o < t.length && (i += t.slice(o)), r(i);
}
function bx(t, e, r = Date.now()) {
  e.ensureRoundEventTimersSyncedEvent(t);
  const n = e.getSettingsEvent(), o = [];
  let i = 0;
  for (const c of t.events) {
    const d = e.getLatestRollRecordForEvent(t, c.id), h = d ? d.source === "timeout_auto_fail" ? "timeout" : "done" : "pending", f = d && Number.isFinite(Number(d.result.total)) ? Number(d.result.total) : null, b = d ? d.success : null, v = e.resolveTriggeredOutcomeEvent(c, d, n);
    d && i++, o.push({
      id: c.id,
      title: c.title,
      desc: c.desc,
      targetLabel: c.targetLabel,
      skill: c.skill,
      checkDice: c.checkDice,
      compare: e.normalizeCompareOperatorEvent(c.compare) ?? ">=",
      dc: Number.isFinite(c.dc) ? Number(c.dc) : 0,
      dcReason: String(c.dcReason || ""),
      rollMode: c.rollMode === "auto" ? "auto" : "manual",
      advantageState: yx(
        d?.advantageStateApplied ?? c.advantageState
      ),
      timeLimit: c.timeLimit ?? "none",
      status: h,
      resultSource: d?.source ?? null,
      total: f,
      skillModifierApplied: Number(d?.skillModifierApplied ?? 0),
      statusModifierApplied: Number(d?.statusModifierApplied ?? 0),
      baseModifierUsed: Number(d?.baseModifierUsed ?? 0),
      finalModifierUsed: Number(d?.finalModifierUsed ?? 0),
      success: b,
      marginToDc: typeof d?.marginToDc == "number" && Number.isFinite(d.marginToDc) ? Number(d.marginToDc) : null,
      resultGrade: d?.resultGrade ?? null,
      outcomeKind: v.kind,
      outcomeText: en(v.text),
      explosionTriggered: v.explosionTriggered
    });
  }
  return {
    roundId: t.roundId,
    openedAt: t.openedAt,
    closedAt: r,
    eventsCount: t.events.length,
    rolledCount: i,
    events: o,
    sourceAssistantMsgIds: Array.isArray(t.sourceAssistantMsgIds) ? [...t.sourceAssistantMsgIds] : []
  };
}
function vx(t) {
  return Array.isArray(t.summaryHistory) || (t.summaryHistory = []), t.summaryHistory;
}
function xx(t, e) {
  t.length <= e || t.splice(0, t.length - e);
}
function yx(t) {
  return t === "advantage" || t === "disadvantage" || t === "normal" ? t : "normal";
}
function Sx(t) {
  const e = String(t ?? "").replace(/\s+/g, " ").trim();
  return e.length > 0 ? e : "（空）";
}
function He(t, e) {
  const r = Sx(t);
  return r.length <= e ? r : `${r.slice(0, Math.max(1, e))}（已截断）`;
}
function Ex(t) {
  return t === "minimal" ? 60 : t === "balanced" ? 90 : 140;
}
function _x(t) {
  return t === "manual_roll" ? "手动检定" : t === "ai_auto_roll" ? "AI自动检定" : t === "timeout_auto_fail" ? "超时判定" : "未知";
}
function Tx(t) {
  if (t.status === "pending")
    return "待判定（尚未掷骰）";
  if (t.status === "timeout" || t.resultSource === "timeout_auto_fail")
    return "超时未操作，系统判定失败";
  const e = t.total == null ? "-" : String(t.total);
  return t.success === !0 ? t.resultSource === "ai_auto_roll" ? `AI自动检定成功（总值 ${e}）` : `成功（总值 ${e}）` : t.success === !1 ? t.resultSource === "ai_auto_roll" ? `AI自动检定失败（总值 ${e}）` : `失败（总值 ${e}）` : `已完成（总值 ${e}）`;
}
function kx(t) {
  const e = He(t.outcomeText || "", 120);
  return t.outcomeKind === "explode" ? `爆骰走向：${e}` : t.outcomeKind === "success" ? `成功走向：${e}` : t.outcomeKind === "failure" ? `失败走向：${e}` : `走向：${e}`;
}
function wx(t, e, r) {
  const n = He(t.title, 48), o = He(t.desc, Ex(e)), i = He(t.targetLabel || "未指定", 20), c = Tx(t), d = r ? kx(t) : "", h = Number.isFinite(Number(t.baseModifierUsed)) ? Number(t.baseModifierUsed) : 0, f = Number.isFinite(Number(t.skillModifierApplied)) ? Number(t.skillModifierApplied) : 0, b = Number.isFinite(Number(t.statusModifierApplied)) ? Number(t.statusModifierApplied) : 0, v = Number.isFinite(Number(t.finalModifierUsed)) ? Number(t.finalModifierUsed) : h + f + b, E = `修正 ${Ie(h)} + 技能 ${Ie(
    f
  )} + 状态 ${Ie(b)} = ${Ie(v)}`;
  if (e === "minimal")
    return r ? `- 标题：${n}｜对象：${i}｜描述：${o}｜结果：${c}｜${d}` : `- 标题：${n}｜对象：${i}｜描述：${o}｜结果：${c}`;
  const y = He(t.skill, 20), $ = He(t.checkDice, 24), O = t.dcReason ? `（DC原因：${He(t.dcReason, 36)}）` : "", L = `${y} ${$}，条件 ${t.compare} ${t.dc}${O}`, D = t.advantageState === "normal" ? "" : `｜骰态=${t.advantageState}`, G = t.resultGrade ? `｜分级=${t.resultGrade}` : "";
  if (e === "balanced")
    return r ? `- 标题：${n}｜对象：${i}｜描述：${o}｜检定：${L}${D}｜${E}｜结果：${c}${G}｜${d}` : `- 标题：${n}｜对象：${i}｜描述：${o}｜检定：${L}${D}｜${E}｜结果：${c}${G}`;
  const P = _x(t.resultSource), K = He(
    $o(t.timeLimit || "none"),
    26
  );
  return r ? `- 标题：${n}｜对象：${i}｜描述：${o}｜检定：${L}${D}｜${E}｜来源：${P}｜模式：${t.rollMode}｜时限：${K}｜结果：${c}${G}｜${d}` : `- 标题：${n}｜对象：${i}｜描述：${o}｜检定：${L}${D}｜${E}｜来源：${P}｜模式：${t.rollMode}｜时限：${K}｜结果：${c}${G}`;
}
function Ix(t, e, r, n, o) {
  if (!Array.isArray(t) || t.length === 0) return "";
  const i = Math.min(
    o.SUMMARY_HISTORY_ROUNDS_MAX_Event,
    Math.max(o.SUMMARY_HISTORY_ROUNDS_MIN_Event, Math.floor(Number(r) || 1))
  ), c = t.slice(-i);
  if (c.length === 0) return "";
  const d = [];
  d.push(o.DICE_SUMMARY_BLOCK_START_Event), d.push(
    `v=5 fmt=nl detail=${e} window_rounds=${i} included_rounds=${c.length} include_outcome=${n ? "1" : "0"}`
  );
  let h = 0, f = !1;
  for (let b = 0; b < c.length; b++) {
    const v = c[b], E = Math.max(0, v.eventsCount - v.rolledCount);
    d.push(
      `【第 ${b + 1} 轮 / roundId=${v.roundId} / 关闭时间=${new Date(
        v.closedAt
      ).toISOString()}】`
    ), d.push(`本轮事件数=${v.eventsCount}，已结算=${v.rolledCount}，未结算=${E}`);
    const y = v.events.slice(0, o.SUMMARY_MAX_EVENTS_Event);
    for (const $ of y) {
      if (h >= o.SUMMARY_MAX_TOTAL_EVENT_LINES_Event) {
        f = !0;
        break;
      }
      d.push(wx($, e, n)), h++;
    }
    if (v.events.length > o.SUMMARY_MAX_EVENTS_Event && d.push(`注：本轮还有 ${v.events.length - o.SUMMARY_MAX_EVENTS_Event} 个事件未展开。`), f) break;
  }
  return f && d.push("注：后续事件因长度限制未展开。"), d.push(o.DICE_SUMMARY_BLOCK_END_Event), d.join(`
`);
}
const ke = "normal", fu = 1;
function yh(t) {
  return t === "advantage" || t === "disadvantage" || t === "normal" ? t : ke;
}
function Ax(t) {
  return Array.isArray(t.keptRolls) && t.keptRolls.length > 0 ? t.keptRolls : Array.isArray(t.rolls) ? t.rolls : [];
}
function $x(t) {
  return t.keepMode === "kh" ? "advantage" : t.keepMode === "kl" ? "disadvantage" : ke;
}
function Sh(t, e, r, n) {
  let o;
  try {
    o = n(t);
  } catch (h) {
    return {
      adv: !1,
      dis: !1,
      advantageStateApplied: ke,
      errorText: h?.message ?? String(h)
    };
  }
  const i = $x(o), c = yh(e.advantageState), d = o.keepMode === "kh" || o.keepMode === "kl";
  return r.enableAdvantageSystem ? d ? { adv: !1, dis: !1, advantageStateApplied: i } : c === "advantage" ? { adv: !0, dis: !1, advantageStateApplied: "advantage" } : c === "disadvantage" ? { adv: !1, dis: !0, advantageStateApplied: "disadvantage" } : { adv: !1, dis: !1, advantageStateApplied: ke } : d ? {
    adv: !1,
    dis: !1,
    advantageStateApplied: ke,
    errorText: `优势/劣势系统已关闭，当前表达式包含 kh/kl：${t}`
  } : c !== ke ? {
    adv: !1,
    dis: !1,
    advantageStateApplied: ke,
    errorText: `优势/劣势系统已关闭，事件设置了 advantageState=${c}`
  } : { adv: !1, dis: !1, advantageStateApplied: ke };
}
function Rx(t, e, r) {
  if (r == null || !Number.isFinite(r) || !Number.isFinite(t)) return null;
  switch (e) {
    case ">=":
      return t - r;
    case ">":
      return t - (r + 1);
    case "<=":
      return r - t;
    case "<":
      return r - 1 - t;
    default:
      return null;
  }
}
function Cx(t) {
  const e = Ax(t);
  if (e.length !== 1) return { isCandidate: !1 };
  const r = Number(e[0]), n = Number(t.sides);
  return !Number.isFinite(r) || !Number.isFinite(n) || n <= 0 ? { isCandidate: !1 } : { isCandidate: r === 1 || r === n };
}
function Al(t, e, r, n, o) {
  const i = Rx(Number(t.total), r, n);
  return o === "timeout_auto_fail" ? { resultGrade: "failure", marginToDc: i } : e !== !0 && e !== !1 ? { resultGrade: "failure", marginToDc: i } : Cx(t).isCandidate ? e ? { resultGrade: "critical_success", marginToDc: i } : { resultGrade: "critical_failure", marginToDc: i } : e ? i != null && i >= 1 && i <= 2 ? { resultGrade: "partial_success", marginToDc: i } : { resultGrade: "success", marginToDc: i } : { resultGrade: "failure", marginToDc: i };
}
function Dx(t) {
  return Array.isArray(t.pendingResultGuidanceQueue) || (t.pendingResultGuidanceQueue = []), t.pendingResultGuidanceQueue;
}
function go(t, e, r) {
  if (!r.resultGrade) return;
  const n = Dx(t);
  n.some((o) => o.rollId === r.rollId) || n.push({
    rollId: r.rollId,
    roundId: r.roundId,
    eventId: e.id,
    eventTitle: e.title,
    targetLabel: r.targetLabelUsed || e.targetLabel,
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
function Nx(t, e) {
  let r = 0, n = 0, o = 0;
  try {
    const i = e.parseDiceExpression(t.checkDice);
    r = i.count, n = i.sides, o = i.modifier;
  } catch {
  }
  return {
    expr: t.checkDice || "timeout",
    count: r,
    sides: n,
    modifier: o,
    rolls: [],
    rawTotal: 0,
    total: 0,
    selectionMode: "none"
  };
}
function Eh(t, e) {
  const r = Number.isFinite(Number(t.modifier)) ? Number(t.modifier) : 0, n = Number.isFinite(Number(e)) ? Number(e) : 0, o = r + n;
  return n === 0 ? { result: t, baseModifierUsed: r, finalModifierUsed: o } : {
    result: { ...t, modifier: o, total: Number(t.rawTotal) + o },
    baseModifierUsed: r,
    finalModifierUsed: o
  };
}
function $l(t, e) {
  const r = Number.isFinite(Number(t.modifier)) ? Number(t.modifier) : 0, n = Number.isFinite(Number(e)) ? Number(e) : 0, o = r + n;
  return n === 0 ? { result: t, finalModifierUsed: o } : {
    result: { ...t, modifier: o, total: Number(t.rawTotal) + o },
    finalModifierUsed: o
  };
}
function Rl(t, e, r) {
  if (!r.enableStatusSystem)
    return { modifier: 0, matched: [] };
  const n = Ar(e);
  return hl(n, t);
}
function Lx(t, e, r) {
  if (!r.enableOutcomeBranches) return "";
  const n = t.outcomes, o = !!e?.result?.explosionTriggered;
  return r.enableExplodeOutcomeBranch && o && n?.explode && n.explode.trim() ? n.explode.trim() : e?.success === !0 ? n?.success?.trim() || "判定成功，剧情向有利方向推进。" : e?.success === !1 || e?.source === "timeout_auto_fail" ? n?.failure?.trim() || "判定失败，剧情向不利方向推进。" : "尚未结算。";
}
function bo(t, e, r, n) {
  if (!n.enableStatusSystem) return !1;
  const o = Lx(e, r, n);
  if (!o) return !1;
  const i = Tm(o, e.skill || "");
  return Jb(t, i.commands, "ai_tag");
}
function _h(t) {
  return (!t.eventTimers || typeof t.eventTimers != "object") && (t.eventTimers = {}), t.eventTimers;
}
function Qe(t, e) {
  for (let r = t.rolls.length - 1; r >= 0; r--)
    if (t.rolls[r]?.eventId === e) return t.rolls[r];
  return null;
}
function Th(t, e) {
  const r = e.getSettingsEvent(), n = _h(t), o = Date.now(), i = /* @__PURE__ */ new Set();
  for (const c of t.events) {
    if (i.add(c.id), !c.targetType || !c.targetLabel) {
      const v = e.resolveEventTargetEvent(
        { type: c.targetType, name: c.targetName },
        c.scope
      );
      c.targetType = v.targetType, c.targetName = v.targetName, c.targetLabel = v.targetLabel;
    }
    const d = typeof c.timeLimitMs == "number" && Number.isFinite(c.timeLimitMs) ? Math.max(0, c.timeLimitMs) : e.parseIsoDurationToMsEvent(c.timeLimit || ""), h = e.applyTimeLimitPolicyMsEvent(d, r);
    c.timeLimitMs = h;
    let f = n[c.id];
    const b = Qe(t, c.id);
    if (!f) {
      const v = typeof c.offeredAt == "number" && Number.isFinite(c.offeredAt) ? c.offeredAt : o, E = h == null ? null : v + h;
      f = { offeredAt: v, deadlineAt: E }, n[c.id] = f;
    }
    b ? b.source === "timeout_auto_fail" && (f.expiredAt = b.timeoutAt ?? b.rolledAt) : (f.deadlineAt = h == null ? null : f.offeredAt + h, f.deadlineAt == null && delete f.expiredAt), c.offeredAt = f.offeredAt, c.deadlineAt = f.deadlineAt;
  }
  for (const c of Object.keys(n))
    i.has(c) || delete n[c];
}
function Mx(t) {
  if (t == null || t === "") return null;
  const e = Math.floor(Number(t));
  return !Number.isFinite(e) || e <= 0 ? null : e;
}
function Ox(t) {
  const e = Ar(t);
  if (e.length <= 0) return !1;
  const r = Date.now(), n = e.map((o) => {
    const i = Mx(o.remainingRounds);
    if (i == null) return { ...o, remainingRounds: null };
    const c = i - 1;
    return c <= 0 ? null : { ...o, remainingRounds: c, updatedAt: r };
  }).filter((o) => o != null);
  return n.length === e.length && n.every((o, i) => o.remainingRounds === e[i].remainingRounds) ? !1 : (t.activeStatuses = n, !0);
}
function Px(t, e) {
  const r = t.pendingRound?.status, n = e.now ? e.now() : Date.now();
  return (!t.pendingRound || r !== "open") && (t.pendingRound = {
    roundId: e.createIdEvent("round"),
    status: "open",
    events: [],
    rolls: [],
    eventTimers: {},
    sourceAssistantMsgIds: [],
    openedAt: n
  }), (!t.pendingRound.eventTimers || typeof t.pendingRound.eventTimers != "object") && (t.pendingRound.eventTimers = {}), t.pendingRound;
}
function Bx(t, e, r) {
  const n = r.getSettingsEvent(), o = r.getDiceMetaEvent(), i = o.pendingRound;
  i && i.status !== "open" && Ox(o);
  const c = Px(o, { createIdEvent: r.createIdEvent }), d = Date.now(), h = _h(c), f = /* @__PURE__ */ new Map();
  for (const b of c.events) f.set(b.id, { ...b });
  for (const b of t) {
    const v = { ...b }, E = f.get(v.id), y = Qe(c, v.id), $ = { ...E || {}, ...v };
    if (y) {
      const L = h[$.id];
      L ? ($.offeredAt = L.offeredAt, $.deadlineAt = L.deadlineAt) : E && ($.offeredAt = E.offeredAt, $.deadlineAt = E.deadlineAt ?? null);
    } else {
      const L = typeof $.timeLimitMs == "number" && Number.isFinite($.timeLimitMs) ? Math.max(0, $.timeLimitMs) : r.parseIsoDurationToMsEvent($.timeLimit || ""), D = r.applyTimeLimitPolicyMsEvent(L, n);
      $.timeLimitMs = D, $.offeredAt = d, $.deadlineAt = D == null ? null : d + D, h[$.id] = { offeredAt: $.offeredAt, deadlineAt: $.deadlineAt };
    }
    const O = r.resolveEventTargetEvent(
      { type: $.targetType, name: $.targetName },
      $.scope
    );
    $.targetType = O.targetType, $.targetName = O.targetName, $.targetLabel = O.targetLabel, f.set($.id, $);
  }
  return c.events = Array.from(f.values()), Th(c, {
    getSettingsEvent: r.getSettingsEvent,
    resolveEventTargetEvent: r.resolveEventTargetEvent,
    parseIsoDurationToMsEvent: r.parseIsoDurationToMsEvent,
    applyTimeLimitPolicyMsEvent: r.applyTimeLimitPolicyMsEvent
  }), c.sourceAssistantMsgIds.includes(e) || c.sourceAssistantMsgIds.push(e), r.saveMetadataSafeEvent(), c;
}
function Cl(t, e, r) {
  if (!r.enableOutcomeBranches)
    return { kind: "none", text: "走向分支已关闭。", explosionTriggered: !1 };
  const n = t.outcomes, o = !!e?.result?.explosionTriggered;
  return r.enableExplodeOutcomeBranch && o && n?.explode && n.explode.trim() ? { kind: "explode", text: n.explode.trim(), explosionTriggered: !0 } : e?.success === !0 ? { kind: "success", text: n?.success?.trim() || "判定成功，剧情向有利方向推进。", explosionTriggered: o } : e?.success === !1 || e?.source === "timeout_auto_fail" ? { kind: "failure", text: n?.failure?.trim() || "判定失败，剧情向不利方向推进。", explosionTriggered: o } : { kind: "none", text: "尚未结算。", explosionTriggered: o };
}
function Ux(t, e, r, n) {
  const o = n.getSettingsEvent(), i = n.getDiceMetaEvent(), c = n.normalizeCompareOperatorEvent(e.compare) ?? ">=", d = Number.isFinite(e.dc) ? Number(e.dc) : null;
  let h = n.createSyntheticTimeoutDiceResultEvent(e);
  const f = n.resolveSkillModifierBySkillNameEvent(e.skill, o), b = Eh(h, f);
  h = b.result;
  const v = Rl(e.skill, i, o), E = $l(h, v.modifier);
  h = E.result;
  const y = Al(h, !1, c, d, "timeout_auto_fail");
  return {
    rollId: n.createIdEvent("eroll"),
    roundId: t.roundId,
    eventId: e.id,
    eventTitle: e.title,
    diceExpr: e.checkDice,
    result: h,
    success: !1,
    compareUsed: c,
    dcUsed: d,
    advantageStateApplied: yh(e.advantageState),
    resultGrade: y.resultGrade,
    marginToDc: y.marginToDc,
    skillModifierApplied: f,
    statusModifierApplied: v.modifier,
    statusModifiersApplied: v.matched,
    baseModifierUsed: b.baseModifierUsed,
    finalModifierUsed: E.finalModifierUsed,
    targetLabelUsed: e.targetLabel,
    rolledAt: r,
    source: "timeout_auto_fail",
    timeoutAt: r
  };
}
function Hx(t, e, r, n = Date.now()) {
  if (!r.getSettingsEvent().enableTimeLimit || r.getLatestRollRecordForEvent(t, e.id)) return null;
  r.ensureRoundEventTimersSyncedEvent(t);
  const c = t.eventTimers[e.id];
  if (!c || c.deadlineAt == null || n <= c.deadlineAt) return null;
  const d = r.createTimeoutFailureRecordEvent(t, e, n);
  return t.rolls.push(d), c.expiredAt = n, d;
}
function zx(t) {
  const e = t.getSettingsEvent();
  if (!e.enabled || !e.enableTimeLimit) return !1;
  const r = t.getDiceMetaEvent(), n = r.pendingRound;
  if (!n || n.status !== "open") return !1;
  t.ensureRoundEventTimersSyncedEvent(n);
  const o = Date.now();
  let i = !1;
  for (const c of n.events) {
    const d = t.recordTimeoutFailureIfNeededEvent(n, c, o);
    d && (i = !0, e.enableDynamicResultGuidance && go(r, c, d), bo(r, c, d, e) && (i = !0));
  }
  return i && t.saveMetadataSafeEvent(), i;
}
function Gx(t, e, r, n) {
  n.sweepTimeoutFailuresEvent();
  const o = String(t || "").trim();
  if (!o)
    return "❌ 请提供事件 ID，例如：/eventroll roll lockpick_gate";
  const i = n.getDiceMetaEvent(), c = i.pendingRound;
  if (!c)
    return "❌ 当前没有可投掷的事件。";
  if (c.status !== "open")
    return "❌ 当前轮次已结束，请等待 AI 生成新轮次事件。";
  if (r && c.roundId !== r)
    return "❌ 该事件所属轮次已结束。";
  const d = c.events.find((tt) => tt.id === o);
  if (!d)
    return `❌ 找不到事件 ID：${o}`;
  const h = n.getSettingsEvent();
  if (!h.enabled)
    return "❌ RollHelper 主开关已关闭，当前不能执行事件掷骰。";
  n.ensureRoundEventTimersSyncedEvent(c);
  const f = n.recordTimeoutFailureIfNeededEvent(c, d);
  if (f && (h.enableDynamicResultGuidance && go(i, d, f), bo(i, d, f, h), n.saveMetadataSafeEvent()), n.getLatestRollRecordForEvent(c, d.id))
    return n.refreshAllWidgetsFromStateEvent(), n.refreshCountdownDomEvent(), "";
  const v = (e || d.checkDice || "").trim();
  if (!v)
    return `❌ 事件 ${o} 缺少可用骰式。`;
  const E = v.includes("!"), y = E ? h.enableExplodingDice ? "enabled" : "disabled_globally" : "not_requested", $ = E ? h.enableExplodingDice ? "已请求爆骰，按真实掷骰结果决定是否触发连爆。" : "已请求爆骰，但全局爆骰功能关闭，按普通骰结算。" : "未请求爆骰。", O = E && !h.enableExplodingDice ? v.replace("!", "") : v, L = Sh(O, d, h, n.parseDiceExpression);
  if (L.errorText)
    return `❌ 掷骰失败：${L.errorText}`;
  let D;
  try {
    D = n.rollExpression(O, {
      rule: h.ruleText,
      adv: L.adv,
      dis: L.dis
    });
  } catch (tt) {
    return `❌ 掷骰失败：${tt?.message ?? String(tt)}`;
  }
  const G = n.resolveSkillModifierBySkillNameEvent(d.skill, h), P = n.applySkillModifierToDiceResultEvent(D, G);
  D = P.result;
  const K = Rl(d.skill, i, h), X = $l(D, K.modifier);
  D = X.result, n.saveLastRoll(D);
  const F = n.normalizeCompareOperatorEvent(d.compare) ?? ">=", z = Number.isFinite(d.dc) ? Number(d.dc) : null, Z = n.evaluateSuccessEvent(D.total, F, z), H = Al(D, Z, F, z, "manual_roll"), B = {
    rollId: n.createIdEvent("eroll"),
    roundId: c.roundId,
    eventId: d.id,
    eventTitle: d.title,
    diceExpr: O,
    result: D,
    success: Z,
    compareUsed: F,
    dcUsed: z,
    advantageStateApplied: L.advantageStateApplied,
    resultGrade: H.resultGrade,
    marginToDc: H.marginToDc,
    skillModifierApplied: G,
    statusModifierApplied: K.modifier,
    statusModifiersApplied: K.matched,
    baseModifierUsed: P.baseModifierUsed,
    finalModifierUsed: X.finalModifierUsed,
    targetLabelUsed: d.targetLabel,
    rolledAt: Date.now(),
    source: "manual_roll",
    timeoutAt: null,
    explodePolicyApplied: y,
    explodePolicyReason: $
  };
  return c.rolls.push(B), h.enableDynamicResultGuidance && go(i, d, B), bo(i, d, B, h), n.saveMetadataSafeEvent(), n.refreshAllWidgetsFromStateEvent(), n.refreshCountdownDomEvent(), "";
}
function Kx(t, e) {
  const r = e.getSettingsEvent();
  if (!r.enableAiRollMode) return [];
  e.ensureRoundEventTimersSyncedEvent(t);
  const n = e.getDiceMetaEvent();
  let o = !1, i = null;
  const c = [];
  let d = t.rolls.filter(
    (h) => h?.source === "ai_auto_roll" && (h.explodePolicyApplied === "enabled" || String(h.diceExpr || "").includes("!"))
  ).length;
  for (const h of t.events) {
    if ((h.rollMode === "auto" ? "auto" : "manual") !== "auto" || e.getLatestRollRecordForEvent(t, h.id)) continue;
    const v = String(h.checkDice || "").trim();
    if (!v) continue;
    const E = v.includes("!");
    let y = "not_requested", $ = "未请求爆骰。", O = v;
    E && (r.enableExplodingDice ? d >= fu ? (y = "downgraded_by_ai_limit", $ = `已请求爆骰，但本轮 AI 自动爆骰上限为 ${fu}，按普通骰结算。`, O = v.replace("!", "")) : (y = "enabled", $ = "已请求爆骰，按真实掷骰结果决定是否触发连爆。", d += 1) : (y = "disabled_globally", $ = "已请求爆骰，但全局爆骰功能关闭，按普通骰结算。", O = v.replace("!", "")));
    const L = Sh(O, h, r, e.parseDiceExpression);
    if (L.errorText) {
      ut.warn(`AI 自动掷骰被跳过: event=${h.id} reason=${L.errorText}`);
      continue;
    }
    let D;
    try {
      D = e.rollExpression(O, {
        rule: r.ruleText,
        adv: L.adv,
        dis: L.dis
      });
    } catch (tt) {
      ut.warn(`AI 自动掷骰失败: event=${h.id}`, tt);
      continue;
    }
    const G = e.resolveSkillModifierBySkillNameEvent(h.skill, r), P = e.applySkillModifierToDiceResultEvent(D, G);
    D = P.result;
    const K = Rl(h.skill, n, r), X = $l(D, K.modifier);
    D = X.result;
    const F = e.normalizeCompareOperatorEvent(h.compare) ?? ">=", z = Number.isFinite(h.dc) ? Number(h.dc) : null, Z = e.evaluateSuccessEvent(D.total, F, z), H = Al(D, Z, F, z, "ai_auto_roll"), B = {
      rollId: e.createIdEvent("eroll"),
      roundId: t.roundId,
      eventId: h.id,
      eventTitle: h.title,
      diceExpr: O,
      result: D,
      success: Z,
      compareUsed: F,
      dcUsed: z,
      advantageStateApplied: L.advantageStateApplied,
      resultGrade: H.resultGrade,
      marginToDc: H.marginToDc,
      skillModifierApplied: G,
      statusModifierApplied: K.modifier,
      statusModifiersApplied: K.matched,
      baseModifierUsed: P.baseModifierUsed,
      finalModifierUsed: X.finalModifierUsed,
      targetLabelUsed: h.targetLabel,
      rolledAt: Date.now(),
      source: "ai_auto_roll",
      timeoutAt: null,
      explodePolicyApplied: y,
      explodePolicyReason: $
    };
    t.rolls.push(B), r.enableDynamicResultGuidance && go(n, h, B), bo(n, h, B, r), o = !0, i = D, c.push(e.buildEventRollResultCardEvent(h, B));
  }
  return o ? (i && e.saveLastRoll(i), e.saveMetadataSafeEvent(), c) : [];
}
function jx(t, e, r) {
  const n = r.getSettingsEvent(), o = Number.isFinite(Number(t.baseModifierUsed)) ? Number(t.baseModifierUsed) : Number(t.result.modifier) || 0, i = Number.isFinite(Number(t.skillModifierApplied)) ? Number(t.skillModifierApplied) : 0, c = Number.isFinite(Number(t.statusModifierApplied)) ? Number(t.statusModifierApplied) : 0, d = Number.isFinite(Number(t.finalModifierUsed)) ? Number(t.finalModifierUsed) : o + i + c;
  let h = "";
  if (n.enableOutcomeBranches) {
    const L = e ? r.resolveTriggeredOutcomeEvent(e, t, n) : t.result.explosionTriggered && n.enableExplodeOutcomeBranch ? { kind: "explode" } : t.success === !0 ? { kind: "success" } : t.success === !1 ? { kind: "failure" } : { kind: "none" };
    L.kind !== "none" && (h = ` | 走向:${L.kind}`);
  }
  const f = t.targetLabelUsed || e?.targetLabel || "", b = f ? ` | 对象:${f}` : "", v = n.enableSkillSystem ? ` | 修正:${r.formatEventModifierBreakdownEvent(
    o,
    i,
    d
  )}` : "", E = c !== 0 ? ` | 状态:${c > 0 ? `+${c}` : c}${Array.isArray(t.statusModifiersApplied) && t.statusModifiersApplied.length > 0 ? `(${t.statusModifiersApplied.map((L) => `${L.name}${L.modifier > 0 ? `+${L.modifier}` : L.modifier}`).join(",")})` : ""}` : "", y = t.advantageStateApplied && t.advantageStateApplied !== ke ? ` | 骰态:${t.advantageStateApplied}` : "", $ = t.resultGrade ? ` | 分级:${t.resultGrade}` : "";
  if (t.source === "timeout_auto_fail")
    return `超时自动判定失败${b}${v}${E}${y}${$}${h}`;
  if (t.source === "ai_auto_roll") {
    const L = t.success === null ? "未判定" : t.success ? "成功" : "失败";
    return `AI自动检定，总值 ${t.result.total} (${t.compareUsed} ${t.dcUsed ?? "?"} => ${L})${b}${v}${E}${y}${$}${h}`;
  }
  const O = t.success === null ? "未判定" : t.success ? "成功" : "失败";
  return `总值 ${t.result.total} (${t.compareUsed} ${t.dcUsed ?? "?"} => ${O})${b}${v}${E}${y}${$}${h}`;
}
const kh = "<dice_rules>", wh = "</dice_rules>", Ih = "<dice_round_summary>", Ah = "</dice_round_summary>", $h = "<dice_result_guidance>", Rh = "</dice_result_guidance>", Ch = "<dice_runtime_policy>", Dh = "</dice_runtime_policy>", Nh = "<dice_active_statuses>", Lh = "</dice_active_statuses>";
function Dl(t) {
  return String(t ?? "");
}
function li(t) {
  return String(t ?? "").replace(/\s+/g, " ").trim();
}
function gu(t) {
  return t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function se(t) {
  return zn(String(t || ""));
}
function qx(t) {
  const e = t?.ruleStart || kh, r = t?.ruleEnd || wh, n = t?.runtimePolicyStart || Ch, o = t?.runtimePolicyEnd || Dh, i = t?.summaryStart || Ih, c = t?.summaryEnd || Ah, d = t?.guidanceStart || $h, h = t?.guidanceEnd || Rh, f = t?.statusesStart || Nh, b = t?.statusesEnd || Lh;
  return [
    { start: e, end: r },
    { start: n, end: o },
    { start: i, end: c },
    { start: d, end: h },
    { start: f, end: b }
  ];
}
function Fx(t) {
  return !t || typeof t != "object" ? "" : String(t.role ?? "").trim().toLowerCase();
}
function Vx(t) {
  if (!t || typeof t != "object") return "";
  const e = t.create_date ?? t.create_time ?? t.timestamp ?? "";
  return String(e ?? "").trim();
}
function Yx(t) {
  if (!t || typeof t != "object") return "";
  const e = t.id ?? t.cid ?? t.uid;
  return e == null ? "" : String(e);
}
function Wx(t) {
  switch (t) {
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
function Xx(t) {
  const e = t.eventTitle || t.eventId;
  switch (t.resultGrade) {
    case "critical_success":
      return `玩家在「${e}」中掷出大成功，请用英雄化、戏剧性的口吻描述其完美完成动作，并给出额外收益。`;
    case "partial_success":
      return `玩家在「${e}」中勉强成功，请描述“成功但有代价”，代价可包含受伤、暴露、资源损失或引来威胁。`;
    case "success":
      return `玩家在「${e}」中成功，请给出稳定推进的叙事结果，避免额外惩罚。`;
    case "failure":
      return `玩家在「${e}」中失败，请描述受阻但剧情继续推进，可引入新的困难或替代路径。`;
    case "critical_failure":
      return `玩家在「${e}」中大失败，请描述显著且可感知的严重后果，同时保持后续可行动性。`;
    default:
      return `玩家在「${e}」中完成检定，请根据结果推进叙事。`;
  }
}
function Jx(t, e, r) {
  if (!Array.isArray(t) || t.length === 0) return "";
  const n = [];
  n.push(e), n.push(`v=1 count=${t.length}`);
  for (const o of t) {
    const i = Wx(o.resultGrade), c = `${o.compareUsed} ${o.dcUsed == null ? "N/A" : o.dcUsed}`, d = o.marginToDc == null ? "N/A" : String(o.marginToDc), h = o.advantageStateApplied || "normal";
    n.push(
      `- [${i}] event="${li(o.eventTitle)}" target="${li(
        o.targetLabel
      )}" total=${o.total} check=${c} margin=${d} advantage=${h}`
    ), n.push(`  instruction: ${Xx(o)}`);
  }
  return n.push(r), se(n.join(`
`));
}
function ge(t) {
  return Gg(t);
}
function Mh(t) {
  if (!t || typeof t != "object") return "";
  const e = Number(t.swipe_id ?? t.swipeId), r = t.swipes;
  if (Array.isArray(r) && Number.isFinite(e) && e >= 0 && e < r.length) {
    const n = String(r[e] ?? "");
    if (n.trim()) return n;
  }
  return typeof t.mes == "string" && t.mes.trim() ? t.mes : ge(t);
}
function Pn(t, e) {
  Jd(t, e);
}
function Qx(t) {
  return Qd(t);
}
function Zx(t) {
  return Zd(t);
}
function Oh(t) {
  if (!t || typeof t != "object" || Qx(t) || Zx(t)) return !1;
  const e = Fx(t);
  return e ? e === "assistant" : !0;
}
function ty(t) {
  return Kg(t);
}
function Pa(t) {
  return jg(t);
}
function ey(t, e, r) {
  return Fg(t, {
    insertBeforeIndex: e,
    template: r,
    text: ""
  });
}
function ry(t, e, r) {
  const n = String(t ?? ""), o = om(n), i = Yx(e);
  if (i)
    return `prompt_user:${i}:${o}`;
  const c = Vx(e);
  return c ? `prompt_user_ts:${c}:${o}` : `prompt_user_idx:${r}:${o}`;
}
function Ba(t, e) {
  let r = Dl(t);
  for (const n of qx(e)) {
    const o = new RegExp(`${gu(n.start)}[\\s\\S]*?${gu(n.end)}`, "gi");
    r = r.replace(o, `
`);
  }
  return se(r);
}
function ny(t, e, r) {
  const n = Dl(t).trim();
  return n ? n.includes(e) && n.includes(r) ? se(n) : se(`${e}
${n}
${r}`) : "";
}
function sy(t) {
  const e = ["NdM"];
  t.enableExplodingDice && e.push("[!]"), t.enableAdvantageSystem && e.push("[khX|klX]"), e.push("[+/-B]");
  const r = e.join(""), n = Ph(t.aiAllowedDiceSidesText), o = [];
  return o.push("【事件骰子协议（系统动态）】"), o.push("1. 仅在文末输出 ```rolljson 代码块（严禁 ```json）。"), o.push("2. 叙事正文禁止直接给出判定结果，先给事件，再由系统结算并推进剧情。"), o.push("3. rolljson 基本格式："), o.push("{"), o.push('  "type": "dice_events", "version": "1",'), o.push('  "events": [{'), o.push('    "id": "str", "title": "str", "dc": num, "desc": "str",'), o.push(`    "checkDice": "${r}",`), o.push('    "skill": "str",'), o.push('    "compare": ">=|>|<=|<",'), o.push('    "scope": "protagonist|character|all",'), o.push('    "target": { "type": "self|scene|supporting|object|other", "name": "str(可选)" }'), t.enableAiRollMode && o.push('    ,"rollMode": "auto|manual"'), t.enableAdvantageSystem && o.push('    ,"advantageState": "normal|advantage|disadvantage"'), t.enableDynamicDcReason && o.push('    ,"dc_reason": "str"'), t.enableTimeLimit && o.push('    ,"timeLimit": "PT30S"'), t.enableOutcomeBranches && (t.enableExplodingDice && t.enableExplodeOutcomeBranch ? o.push('    ,"outcomes": { "success": "str", "failure": "str", "explode": "str(爆骰优先)" }') : o.push('    ,"outcomes": { "success": "str", "failure": "str" }')), o.push("  }]"), t.enableAiRoundControl && (o.push('  ,"round_control": "continue|end_round",'), o.push('  "end_round": bool')), o.push("}"), o.push("4. 可用能力说明："), o.push(`   - checkDice 仅使用 ${r}，只能写骰式本体，禁止加入技能名、状态名、自然语言、标签或变量,仅允许一个可选修正值，禁止连续修正（如 1d20+1-1）。`), o.push("   - 合法示例：1d20、2d6+3、2d20kh1、2d20kl1、1d6!+2。"), o.push("   - 非法示例：1d20+1-1、1d20+体能、1d20+[虚弱]、1d20 (优势)。"), o.push("   - 若需施加或移除状态，请仅在 outcomes 文本中使用状态标签。"), t.enableExplodingDice && t.enableOutcomeBranches && t.enableExplodeOutcomeBranch && (o.push("   - 只有 checkDice 明确包含 ! 时，才允许提供 outcomes.explode；如果 checkDice 不含 !，必须完全省略 explode 字段。"), o.push('   - 正例：{"checkDice":"1d20!","outcomes":{"success":"...","failure":"...","explode":"..."}}'), o.push('   - 反例：{"checkDice":"1d20","outcomes":{"success":"...","failure":"...","explode":"..."}}')), n !== "none" && o.push(`   - 骰子面数限制：${n}。`), t.enableAiRollMode && o.push("   - 可使用 rollMode=auto|manual 指定是否自动掷骰。"), t.enableAiRoundControl && o.push("   - 可使用 round_control 或 end_round 控制轮次是否结束。"), t.enableExplodingDice && (o.push("   - 已启用爆骰：! 会在掷出最大面后连爆，结果会影响剧情走向。(骰式示例：1d6!+2)"), o.push("   - 爆骰是否触发由系统根据真实掷骰结果决定，不可直接声明“必爆”。"), o.push("   - 只有在你确实需要一条独立的爆骰后果分支时，才给该事件的 checkDice 加 !；没有 ! 就绝不能写 outcomes.explode。"), t.enableAiRollMode && (o.push("   - AI 自动检定时，同一轮最多仅 1 个事件使用 !，其余会按普通骰结算。"), o.push("   - 因此，请把 ! 和 outcomes.explode 留给本轮最关键、最值得出现爆骰分支的那个事件。"))), t.enableAdvantageSystem && o.push("   - 已启用优势/劣势：可用 advantageState 或 kh/kl，会改变结果并影响剧情走向。"), t.enableExplodingDice && t.enableAdvantageSystem && o.push("   - ! 与 kh/kl 不能同用。"), t.enableDynamicDcReason && o.push("   - 可填写 dc_reason 解释难度依据。"), t.enableTimeLimit && o.push("   - 可填写 timeLimit，且必须满足系统最小时限。"), t.enableOutcomeBranches && (o.push("   - outcomes 走向文本会直接影响后续剧情叙事。"), t.enableExplodingDice && t.enableExplodeOutcomeBranch && (o.push("   - 爆骰触发时优先使用 outcomes.explode。"), o.push("   - 如果你设想了“只有爆骰才发生”的特殊后果，就必须同时在 checkDice 中写 !；否则请把该后果合并到 success 或 failure。"))), t.enableStatusSystem && t.enableOutcomeBranches && (o.push("5. 可在 outcomes 中使用状态标签："), o.push("   - [APPLY_STATUS:名,整数值,turns=2,skills=A|B 或 scope=all]"), o.push("   - turns 默认 1；支持 duration= 作为 turns 别名；turns=perm 表示永久"), o.push("   - [REMOVE_STATUS:名]"), o.push("   - [CLEAR_STATUS]"), o.push("   - 负面状态必须使用负数；正面状态（加值）必须使用正数。"), o.push("   - 状态数值绝对值需与当前骰子面数匹配，避免失衡，还需要注意状态请勿轻易附加，避免破坏平衡！")), o.push("6. **必须遵守 <dice_runtime_policy> 的运行时限制。**"), se(o.join(`
`));
}
function oy(t) {
  const e = sy(t), r = Dl(t.ruleText || "").trim();
  return r ? se(`${e}

【用户自定义补充】
${r}`) : e;
}
function Ph(t) {
  const e = String(t || "").split(/[,\s]+/).map((r) => Number(String(r || "").trim())).filter((r) => Number.isFinite(r) && Number.isInteger(r) && r > 0);
  return e.length <= 0 ? "none" : Array.from(new Set(e)).sort((r, n) => r - n).join(",");
}
function ay(t, e = 20) {
  try {
    const r = JSON.parse(String(t || "{}"));
    if (!r || typeof r != "object" || Array.isArray(r))
      return { count: 0, preview: "empty" };
    const n = Object.entries(r).filter(([i, c]) => String(i || "").trim().length > 0 && Number.isFinite(Number(c))).map(([i, c]) => [String(i).trim(), Number(c)]);
    if (n.length <= 0)
      return { count: 0, preview: "empty" };
    const o = n.slice(0, Math.max(1, e)).map(([i, c]) => `${li(i)}:${c}`).join(",");
    return { count: n.length, preview: o || "empty" };
  } catch {
    return { count: 0, preview: "invalid_json" };
  }
}
function iy(t, e, r) {
  const n = Ph(t.aiAllowedDiceSidesText), o = ay(t.skillTableText), i = [];
  return i.push(e), i.push("v=1"), i.push(`apply_scope=${t.eventApplyScope}`), i.push(`round_mode=${t.enableAiRoundControl ? "continuous" : "per_round"}`), i.push(`roll_mode_allowed=${t.enableAiRollMode ? "auto|manual" : "manual_only"}`), i.push(`ai_round_control_enabled=${t.enableAiRoundControl ? 1 : 0}`), i.push(
    `round_control_allowed=${t.enableAiRoundControl ? "continue|end_round" : "disabled"}`
  ), i.push(`explode_enabled=${t.enableExplodingDice ? 1 : 0}`), i.push(`ai_auto_explode_event_limit_per_round=${t.enableAiRollMode ? 1 : 0}`), i.push(`advantage_enabled=${t.enableAdvantageSystem ? 1 : 0}`), i.push(`dynamic_dc_reason_enabled=${t.enableDynamicDcReason ? 1 : 0}`), i.push(`status_system_enabled=${t.enableStatusSystem ? 1 : 0}`), i.push(`status_tags_allowed=${t.enableStatusSystem ? 1 : 0}`), i.push(`status_sign_rule=${t.enableStatusSystem ? "debuff_negative,buff_positive" : "disabled"}`), i.push(`outcome_branches_enabled=${t.enableOutcomeBranches ? 1 : 0}`), i.push(`explode_outcome_enabled=${t.enableExplodeOutcomeBranch ? 1 : 0}`), i.push(`time_limit_enabled=${t.enableTimeLimit ? 1 : 0}`), i.push(`min_time_limit_seconds=${Math.max(1, Math.floor(Number(t.minTimeLimitSeconds) || 1))}`), i.push(`allowed_sides=${n}`), i.push(`skill_system_enabled=${t.enableSkillSystem ? 1 : 0}`), i.push(`skill_table_count=${o.count}`), i.push(`skill_table_preview=${o.preview}`), i.push(`summary_detail=${t.summaryDetailMode}`), i.push(`summary_rounds=${t.summaryHistoryRounds}`), i.push(`summary_include_outcome=${t.includeOutcomeInSummary ? 1 : 0}`), i.push(`list_outcome_preview=${t.showOutcomePreviewInListCard ? 1 : 0}`), i.push(r), se(i.join(`
`));
}
function ly(t, e) {
  const r = se(t), n = e.map((o) => se(o)).filter((o) => o.length > 0);
  return n.length ? r ? `${r}

${n.join(`

`)}` : n.join(`

`) : r;
}
function cy(t, e, r, n, o, i) {
  if (!e.enableDynamicResultGuidance)
    return t.outboundResultGuidance ? (delete t.outboundResultGuidance, { text: "", changedMeta: !0 }) : { text: "", changedMeta: !1 };
  if (n && t.outboundResultGuidance && t.outboundResultGuidance.userMsgId === r)
    return {
      text: se(t.outboundResultGuidance.guidanceText),
      changedMeta: !1
    };
  const c = Array.isArray(t.pendingResultGuidanceQueue) ? t.pendingResultGuidanceQueue : [];
  if (c.length <= 0)
    return t.outboundResultGuidance ? (delete t.outboundResultGuidance, { text: "", changedMeta: !0 }) : { text: "", changedMeta: !1 };
  const d = c.splice(0, c.length), h = Jx(d, o, i), f = d[d.length - 1]?.rollId || d[0]?.rollId || "";
  return t.outboundResultGuidance = {
    userMsgId: r,
    rollId: f,
    guidanceText: h
  }, { text: h, changedMeta: !0 };
}
function uy(t, e) {
  const r = t.findIndex((n) => n.roundId === e.roundId);
  return r >= 0 ? (t[r] = e, !0) : (t.push(e), !0);
}
function dy(t) {
  return tm(t);
}
function my(t) {
  return qg(t);
}
function hy(t, e, r = "unknown") {
  const n = e.getSettingsEvent();
  if (!n.enabled) return;
  e.sweepTimeoutFailuresEvent();
  const o = dy(t);
  if (o.length <= 0) return;
  const i = o.find((pt) => Pa(pt.messages) >= 0) || null;
  if (!i || i.messages.length <= 0) return;
  const c = Pa(i.messages);
  if (c < 0) return;
  const d = i.messages[c];
  if (!d) return;
  const h = e.DICE_RULE_BLOCK_START_Event || kh, f = e.DICE_RULE_BLOCK_END_Event || wh, b = e.DICE_RUNTIME_POLICY_BLOCK_START_Event || Ch, v = e.DICE_RUNTIME_POLICY_BLOCK_END_Event || Dh, E = e.DICE_SUMMARY_BLOCK_START_Event || Ih, y = e.DICE_SUMMARY_BLOCK_END_Event || Ah, $ = e.DICE_RESULT_GUIDANCE_BLOCK_START_Event || $h, O = e.DICE_RESULT_GUIDANCE_BLOCK_END_Event || Rh, L = e.DICE_ACTIVE_STATUSES_BLOCK_START_Event || Nh, D = e.DICE_ACTIVE_STATUSES_BLOCK_END_Event || Lh, G = {
    ruleStart: h,
    ruleEnd: f,
    runtimePolicyStart: b,
    runtimePolicyEnd: v,
    summaryStart: E,
    summaryEnd: y,
    guidanceStart: $,
    guidanceEnd: O,
    statusesStart: L,
    statusesEnd: D
  }, P = Ba(ge(d), G), K = ry(P, d, c);
  ge(d) !== P && Pn(d, P);
  const F = e.getDiceMetaEvent(), z = F.lastPromptUserMsgId === K;
  let Z = !1;
  if (z || (F.lastPromptUserMsgId = K, Z = !0), !z && F.pendingRound && Array.isArray(F.pendingRound.events) && F.pendingRound.events.length > 0) {
    const pt = e.ensureSummaryHistoryEvent(F), rt = e.createRoundSummarySnapshotEvent(F.pendingRound, Date.now());
    if (uy(pt, rt)) {
      e.trimSummaryHistoryEvent(pt), Z = !0;
      const vt = Vg();
      vt && Sm("stx_rollhelper", vt, "round_summaries", {
        recordId: rt.roundId,
        payload: rt
      });
    }
  }
  !z && !n.enableAiRoundControl && F.pendingRound?.status === "open" && (F.pendingRound.status = "closed", Z = !0, ut.info("已按“每轮模式”在用户发言后结束当前轮次"));
  let H = "", B = "";
  if (n.autoSendRuleToAI) {
    const pt = oy(n);
    H = ny(pt, h, f), B = iy(
      n,
      b,
      v
    );
  }
  let tt = "";
  if (z && F.outboundSummary && F.outboundSummary.userMsgId === K)
    tt = se(F.outboundSummary.summaryText);
  else {
    const pt = e.ensureSummaryHistoryEvent(F), rt = e.buildSummaryBlockFromHistoryEvent(
      pt,
      n.summaryDetailMode,
      n.summaryHistoryRounds,
      n.includeOutcomeInSummary
    );
    tt = se(rt), tt ? F.outboundSummary = {
      userMsgId: K,
      roundId: F.pendingRound?.roundId || "",
      summaryText: tt
    } : F.outboundSummary && delete F.outboundSummary, Z = !0;
  }
  const it = cy(
    F,
    n,
    K,
    z,
    $,
    O
  ), dt = se(it.text);
  it.changedMeta && (Z = !0);
  const Tt = n.enableStatusSystem ? Qb(Ar(F), L, D) : "", Rt = [];
  for (const pt of o) {
    const rt = Pa(pt.messages);
    if (rt < 0) {
      Rt.push(`${pt.path}:skip_no_user`);
      continue;
    }
    const vt = pt.messages[rt];
    if (!vt) {
      Rt.push(`${pt.path}:skip_no_user`);
      continue;
    }
    const Mt = Ba(ge(vt), G);
    ge(vt) !== Mt && Pn(vt, Mt);
    const oe = ty(pt.messages);
    let Ot = oe >= 0 ? pt.messages[oe] : null, Wt = oe >= 0 ? "reuse_system" : "create_system";
    const Ct = Ot ? ge(Ot) : "", Se = Ba(Ct, G), ce = ly(Se, [
      H,
      B,
      tt,
      dt,
      Tt
    ]);
    if (!Ot && ce && (Ot = ey(
      pt.messages,
      rt,
      vt
    )), Ot) {
      const Zt = ce;
      ge(Ot) !== Zt ? Pn(Ot, Zt) : Wt === "create_system" ? Wt = "create_system_unchanged" : Wt = "reuse_system_unchanged", Wt === "create_system" && !Zt ? Wt = "create_system_empty" : Wt === "reuse_system" && !Zt && (Wt = "reuse_system_cleared");
    } else
      Wt = "no_system_needed";
    Rt.push(`${pt.path}:${Wt}`);
  }
  Z && e.saveMetadataSafeEvent(), ut.info(
    `通过 ${r} 更新了提示词管理块 (路径=${o.map((pt) => pt.path).join(",")} 块=规则:${H ? 1 : 0},运行时:${B ? 1 : 0},摘要:${tt ? 1 : 0},指引:${dt ? 1 : 0},状态:${Tt ? 1 : 0} 操作=${Rt.join(
      ";"
    )})`
  );
}
function Bh(t) {
  return vh(t, zd);
}
function Ze(t) {
  Th(t, {
    getSettingsEvent: St,
    resolveEventTargetEvent: Il,
    parseIsoDurationToMsEvent: Bh,
    applyTimeLimitPolicyMsEvent: wl
  });
}
function Uh(t) {
  return fx(t, {
    getSettingsEvent: St,
    OUTCOME_TEXT_MAX_LEN_Event: Ig,
    ISO_8601_DURATION_REGEX_Event: zd
  });
}
function Hh(t, e) {
  return gx(t, e, zn);
}
function py(t) {
  return Nx(t, {
    parseDiceExpression: Je
  });
}
function fy(t, e, r) {
  return Ux(t, e, r, {
    getSettingsEvent: St,
    getDiceMetaEvent: $t,
    normalizeCompareOperatorEvent: Po,
    createSyntheticTimeoutDiceResultEvent: py,
    resolveSkillModifierBySkillNameEvent: Lo,
    createIdEvent: Ir
  });
}
function zh(t, e, r = Date.now()) {
  return Hx(
    t,
    e,
    {
      getSettingsEvent: St,
      getLatestRollRecordForEvent: Qe,
      ensureRoundEventTimersSyncedEvent: Ze,
      createTimeoutFailureRecordEvent: fy
    },
    r
  );
}
function $r() {
  return zx({
    getSettingsEvent: St,
    getDiceMetaEvent: $t,
    ensureRoundEventTimersSyncedEvent: Ze,
    recordTimeoutFailureIfNeededEvent: zh,
    saveMetadataSafeEvent: Xe
  });
}
function gy(t, e) {
  return Bx(t, e, {
    getSettingsEvent: St,
    getDiceMetaEvent: $t,
    createIdEvent: Ir,
    parseIsoDurationToMsEvent: Bh,
    applyTimeLimitPolicyMsEvent: wl,
    resolveEventTargetEvent: Il,
    saveMetadataSafeEvent: Xe
  });
}
function by(t, e) {
  return jx(t, e, {
    getSettingsEvent: St,
    resolveTriggeredOutcomeEvent: Cl,
    formatEventModifierBreakdownEvent: il
  });
}
function vy(t, e = Date.now()) {
  return bx(
    t,
    {
      ensureRoundEventTimersSyncedEvent: Ze,
      getSettingsEvent: St,
      getLatestRollRecordForEvent: Qe,
      resolveTriggeredOutcomeEvent: Cl,
      normalizeCompareOperatorEvent: Po
    },
    e
  );
}
function xy(t, e, r, n) {
  return Ix(t, e, r, n, {
    SUMMARY_HISTORY_ROUNDS_MAX_Event: el,
    SUMMARY_HISTORY_ROUNDS_MIN_Event: tl,
    SUMMARY_MAX_EVENTS_Event: Tg,
    SUMMARY_MAX_TOTAL_EVENT_LINES_Event: kg,
    DICE_SUMMARY_BLOCK_START_Event: Pd,
    DICE_SUMMARY_BLOCK_END_Event: Bd
  });
}
function yy(t) {
  xx(t, wg);
}
function Sy(t, e = "unknown") {
  hy(
    t,
    {
      getSettingsEvent: St,
      DICE_RULE_BLOCK_START_Event: gg,
      DICE_RULE_BLOCK_END_Event: bg,
      DICE_SUMMARY_BLOCK_START_Event: Pd,
      DICE_SUMMARY_BLOCK_END_Event: Bd,
      DICE_RESULT_GUIDANCE_BLOCK_START_Event: vg,
      DICE_RESULT_GUIDANCE_BLOCK_END_Event: xg,
      DICE_RUNTIME_POLICY_BLOCK_START_Event: yg,
      DICE_RUNTIME_POLICY_BLOCK_END_Event: Sg,
      DICE_ACTIVE_STATUSES_BLOCK_START_Event: Eg,
      DICE_ACTIVE_STATUSES_BLOCK_END_Event: _g,
      sweepTimeoutFailuresEvent: $r,
      getDiceMetaEvent: $t,
      ensureSummaryHistoryEvent: vx,
      createRoundSummarySnapshotEvent: vy,
      trimSummaryHistoryEvent: yy,
      buildSummaryBlockFromHistoryEvent: xy,
      saveMetadataSafeEvent: Xe
    },
    e
  );
}
const Ey = `.st-rh-card-scope{--st-rh-font-main: "STRHSourceSong";--st-rh-font-display: "STRHSourceSong";--st-rh-text: #dbd2c2;--st-rh-text-muted: #9e9381;--st-rh-title: #e6c587;--st-rh-label: #b0915a;--st-rh-meta: #7a6850;--st-rh-emphasis: #ffdc7a;--st-rh-emphasis-text-shadow: 0 1px 2px rgba(0, 0, 0, .72);--st-rh-border-soft: #4a3e2f;--st-rh-border-strong: #755b38;--st-rh-border-highlight: #b08f4c;--st-rh-royal-title: #efd8a5;--st-rh-royal-ink: #eadfc7;--st-rh-royal-shadow: rgba(8, 5, 3, .82);--st-rh-royal-border: #8e6b3c;--st-rh-royal-border-soft: rgba(182, 146, 85, .28);--st-rh-royal-red: #8b3b2d;--st-rh-royal-red-soft: rgba(139, 59, 45, .24);--st-rh-royal-glow: rgba(242, 212, 143, .15);--st-rh-royal-scroll: linear-gradient(180deg, rgba(73, 55, 37, .24), rgba(23, 16, 10, .18)), linear-gradient(135deg, rgba(218, 191, 144, .06), rgba(84, 60, 35, .1)), repeating-linear-gradient(0deg, rgba(255, 245, 220, .028) 0px, rgba(255, 245, 220, .028) 1px, transparent 1px, transparent 3px);--st-rh-royal-panel: radial-gradient(circle at top, rgba(246, 223, 172, .08), transparent 52%), linear-gradient(145deg, rgba(40, 30, 20, .96), rgba(14, 10, 7, .98));--st-rh-royal-panel-strong: radial-gradient(circle at top, rgba(250, 226, 178, .12), transparent 46%), linear-gradient(145deg, rgba(43, 31, 22, .98), rgba(10, 7, 5, 1));--st-rh-panel-bg: linear-gradient(135deg, rgba(28, 22, 17, .96) 0%, rgba(15, 11, 8, .98) 100%), url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" opacity="0.03"><filter id="noise"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" stitchTiles="stitch"/></filter><rect width="60" height="60" filter="url(%23noise)"/></svg>');--st-rh-panel-inner: rgba(10, 7, 5, .5);--st-rh-panel-soft: rgba(36, 28, 22, .7);--st-rh-shadow: 0 4px 12px rgba(0, 0, 0, .9), inset 0 0 20px rgba(0, 0, 0, .6);--st-rh-shadow-hover: 0 6px 16px rgba(0, 0, 0, .95), inset 0 0 30px rgba(0, 0, 0, .7), 0 0 10px rgba(176, 143, 76, .2);color:var(--st-rh-text);font-family:var(--st-rh-font-main);font-size:13px;text-align:left;line-height:1.35;container-type:inline-size}.st-rh-card-switch{width:100%;container-type:inline-size}.st-rh-widget-container>.st-rh-card-switch+.st-rh-card-switch{margin-top:12px}.st-rh-card-variant{width:100%}.st-rh-card-variant-mobile{display:none!important}.st-rh-card-variant-desktop{display:block}.st-rh-card-scope *{box-sizing:border-box}.st-rh-card-scope i[class*=fa-],.st-rh-card-scope .st-rh-fa-icon,.st-rh-card-scope .st-rh-chip-icon,.st-rh-card-scope .st-rh-summary-chip-icon,.st-rh-card-scope .st-rh-action-icon,.st-rh-card-scope .st-rh-btn-icon,.st-rh-card-scope .st-rh-fact-label-icon{color:inherit;-webkit-text-fill-color:currentColor}.st-rh-title-font{font-family:var(--st-rh-font-display);font-weight:700;letter-spacing:.03em;text-shadow:0 2px 4px rgba(0,0,0,.8)}.st-rh-title-text{color:var(--st-rh-title)}.st-rh-meta-text{color:var(--st-rh-meta)}.st-rh-emphasis-text{color:var(--st-rh-emphasis);text-shadow:var(--st-rh-emphasis-text-shadow)}.st-rh-inline-divider{display:inline-block;margin-inline:.25rem;color:var(--st-rh-border-soft)}.st-rh-inline-divider-wide{margin-inline:.4rem}.st-rh-inline-chip{display:inline-flex;align-items:center;border:1px solid var(--st-rh-border-soft);border-radius:1px;padding:.1rem .35rem;font-size:11px;line-height:1.2;font-family:var(--st-rh-font-display);box-shadow:1px 1px 2px #0009}.st-rh-inline-chip-gap{gap:.2rem}.st-rh-inline-chip-fluid{min-width:0;max-width:100%}.st-rh-chip-soft{background:var(--st-rh-panel-soft);color:var(--st-rh-text-muted);border-color:#5e4c3399}.st-rh-chip-strong{background:linear-gradient(180deg,#96764566,#30241acc);color:var(--st-rh-emphasis);border-color:var(--st-rh-border-strong);text-shadow:0 1px 2px rgba(0,0,0,.9)}.st-rh-status-badge{font-family:var(--st-rh-font-display);font-weight:800;letter-spacing:.15em;text-transform:uppercase;position:relative;overflow:hidden}.st-rh-status-pill{border:1px solid color-mix(in srgb,var(--st-rh-status-color, #d8aa58) 60%,transparent);background:linear-gradient(135deg,color-mix(in srgb,var(--st-rh-status-color, #d8aa58) 35%,rgba(0,0,0,.8)),#140f0ae6);color:color-mix(in srgb,var(--st-rh-status-color, #d8aa58) 80%,white 20%);text-shadow:0 2px 4px rgba(0,0,0,1);box-shadow:inset 0 0 10px #000c,0 0 15px color-mix(in srgb,var(--st-rh-status-color, #d8aa58) 25%,transparent)}.st-rh-status-pill:after{content:"";position:absolute;top:0;left:-100%;width:50%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.1),transparent);transform:skew(-20deg)}.st-rh-panel{border:1px solid var(--st-rh-border-strong);border-radius:1px;background:var(--st-rh-panel-inner);box-shadow:inset 0 0 6px #000c,0 2px 4px #00000080;position:relative}.st-rh-info-panel,.st-rh-meta-panel{padding:.5rem .6rem}.st-rh-kicker{font-family:var(--st-rh-font-display);font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--st-rh-label);padding-bottom:1px;margin-bottom:2px;margin-block-start:0}.st-rh-kicker-hero{letter-spacing:.15em;border-bottom:none}.st-rh-kicker-compact{font-size:9px;letter-spacing:.05em;margin-bottom:2px}.st-rh-panel-copy{margin-top:.3rem;font-size:12px;line-height:1.4}.st-rh-detail-note{color:var(--st-rh-text)}.st-rh-detail-note strong{color:var(--st-rh-title)}.st-rh-surface-card{padding:.4rem;border:1px solid var(--st-rh-border-soft);background:#0006;box-shadow:inset 0 2px 6px #0009;border-left:2px solid var(--st-rh-border-strong)}.st-rh-fact-label{margin-bottom:.1rem;color:var(--st-rh-meta);font-size:9px;font-family:var(--st-rh-font-display);text-transform:uppercase}.st-rh-fact-value{font-size:10px;line-height:1.35;color:var(--st-rh-text);text-shadow:0 1px 2px rgba(0,0,0,.8)}.st-rh-fact-value-accent{color:#7b99cc}.st-rh-fact-value-mono{font-family:ui-monospace,monospace}.st-rh-fact-subline{margin-top:.1rem;font-size:10px;color:var(--st-rh-meta)}.st-rh-subhint{margin-top:.1rem;font-size:10px;font-style:italic}.st-rh-body-copy{font-size:13px;line-height:1.4;color:var(--st-rh-text);text-indent:1em}.st-rh-meta-copy{margin-top:.25rem;font-size:11px;line-height:1.35;color:var(--st-rh-text-muted)}.st-rh-meta-copy-spaced{margin-top:.35rem}.st-rh-tip-label{display:inline-flex;align-items:center;gap:.35rem;cursor:help;color:var(--st-rh-label);border-bottom:1px dotted var(--st-rh-meta);font-family:var(--st-rh-font-main);font-size:12px}.st-rh-inline-tip-segment{display:inline-flex;align-items:baseline;gap:.18rem;cursor:help;border-bottom:1px dashed color-mix(in srgb,var(--st-rh-meta) 80%,transparent);line-height:1.1;text-decoration:none}.st-rh-impact-note,.st-rh-note-box{margin-top:.4rem;padding:.4rem;border-radius:1px;line-height:1.35;font-family:var(--st-rh-font-main)}.st-rh-impact-note{border:1px double #ad3131;background:radial-gradient(circle at center,#3c0f0f4d,#0009);font-size:12px;color:#eea4a4;box-shadow:inset 0 0 10px #50000066}.st-rh-note-box{border:1px dashed var(--st-rh-border-soft);background:#0006;font-size:12px}.st-rh-dc-note-stack{display:inline-flex;flex-wrap:wrap;align-items:center;gap:.45rem .55rem}.st-rh-dc-note-copy{color:var(--st-rh-text-muted);font-style:italic}.st-rh-dc-modifier-chip{gap:.32rem;padding-inline:.45rem;border-color:color-mix(in srgb,var(--st-rh-border-strong) 78%,transparent);background:linear-gradient(180deg,#98733257,#291c0ee6);color:var(--st-rh-emphasis)}.st-rh-dc-modifier-label{font-size:10px;letter-spacing:.08em;color:var(--st-rh-label)}.st-rh-dc-modifier-value{font-family:ui-monospace,monospace;font-size:12px;color:#f3d89b}.st-rh-stack-md>*+*{margin-top:1rem}.st-rh-mini-kicker{font-size:10px;font-family:var(--st-rh-font-display);color:var(--st-rh-label);border-bottom:1px solid rgba(255,255,255,.05);padding-bottom:6px}.st-rh-value-copy{margin-top:.25rem;font-size:13px;font-family:ui-monospace,monospace}.st-rh-distribution-copy,.st-rh-timeout-copy{margin-top:.35rem;text-align:center;font-size:13px}.st-rh-timeout-stamp{display:block;margin-top:.25rem;color:#a94442;font-weight:700}@media(prefers-reduced-motion:reduce){.st-rh-card-scope .st-rh-summary-toggle-icon,.st-rh-card-scope .st-rh-settlement-shell{transition:none;animation:none}}@supports not (container-type: inline-size){@media(max-width:680px){.st-rh-card-switch>.st-rh-card-variant-desktop{display:none!important}.st-rh-card-switch>.st-rh-card-variant-mobile{display:block!important}}}@container (max-width: 680px){.st-rh-card-switch>.st-rh-card-variant-desktop{display:none!important}.st-rh-card-switch>.st-rh-card-variant-mobile{display:block!important}}@media(max-width:680px){.st-rh-widget-container>.st-rh-card-switch+.st-rh-card-switch{margin-top:10px}}`, _y = `.st-rh-card-scope{--rh-border: #755b38;--rh-border-soft: rgba(176, 143, 76, .25);--rh-bg: linear-gradient(145deg, #18120f 0%, #0a0705 100%);--rh-text: #dbd2c2;--rh-text-dim: #9e9381;--rh-title: #e6c587;--rh-accent: #fce1a1;--rh-chip-bg: rgba(255, 255, 255, .03);--rh-chip-border: rgba(120, 100, 70, .2);--rh-glow: 0 4px 12px rgba(0, 0, 0, .8), inset 0 0 20px rgba(0, 0, 0, .5);color:var(--rh-text);font-family:var(--st-rh-font-main)}.st-rh-event-board{position:relative;border:1px solid var(--st-rh-border-strong);background:var(--st-rh-panel-bg);box-shadow:var(--st-rh-shadow);border-radius:3px;overflow:hidden;margin-top:10px;padding-bottom:8px}.st-rh-event-board:before{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(255,236,188,.04),transparent 18%),linear-gradient(90deg,rgba(176,143,76,.06),transparent 15%,transparent 85%,rgba(176,143,76,.04)),url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><path d="M0,0 L10,10 L0,20 Z" fill="rgba(176,143,76,0.03)"/><path d="M40,40 L30,30 L40,20 Z" fill="rgba(176,143,76,0.03)"/></svg>');pointer-events:none;z-index:0}.st-rh-event-board:after{content:"";position:absolute;inset:2px;border:1px solid rgba(176,143,76,.15);pointer-events:none;z-index:1}.st-rh-board-head{padding:10px 14px 9px;background:linear-gradient(180deg,#281c14fa,#0f0a08);border-bottom:2px solid var(--st-rh-border-strong);display:flex;justify-content:space-between;align-items:center;box-shadow:0 2px 8px #000c;position:relative}.st-rh-board-head:after{content:"";position:absolute;bottom:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(230,197,135,.3),transparent)}.st-rh-board-title{font-family:var(--st-rh-font-display);font-size:16px;color:var(--st-rh-title);text-shadow:0 2px 4px rgba(0,0,0,.9),0 0 10px rgba(230,197,135,.15);letter-spacing:.08em;display:flex;align-items:center;gap:8px}.st-rh-board-title:before{content:"♦";color:var(--st-rh-border-highlight);font-size:12px}.st-rh-board-id{font-size:11px;color:var(--st-rh-meta)}.st-rh-board-head-right{display:flex;flex-direction:column;align-items:flex-end;gap:4px;max-width:100%}.st-rh-event-list{list-style:none;padding:12px 12px 14px;margin:0;display:flex;flex-direction:column;gap:14px;background:linear-gradient(180deg,#07050438,#00000014)}@media(max-width:768px){.st-rh-event-board{margin-top:6px;border-radius:4px}.st-rh-board-head{flex-direction:row;align-items:center;gap:8px;padding:6px 10px}.st-rh-board-title{font-size:13px}.st-rh-board-id{max-width:100%;font-size:10px}.st-rh-board-head-right{align-items:flex-end;width:auto}.st-rh-event-list{padding:10px;gap:12px}}@media(max-width:430px){.st-rh-board-head{padding:6px 8px}.st-rh-board-title{font-size:12px;letter-spacing:0}.st-rh-board-id{display:none}.st-rh-event-list{padding:8px;gap:10px}}@container (max-width: 768px){.st-rh-event-board{margin-top:6px;border-radius:4px}.st-rh-board-head{flex-direction:row;align-items:center;gap:8px;padding:6px 10px}.st-rh-board-title{font-size:13px}.st-rh-board-id{max-width:100%;font-size:10px}.st-rh-board-head-right{align-items:flex-end;width:auto}.st-rh-event-list{padding:10px;gap:12px}}@container (max-width: 430px){.st-rh-board-head{padding:6px 8px}.st-rh-board-title{font-size:12px;letter-spacing:0}.st-rh-board-id{display:none}.st-rh-event-list{padding:8px;gap:10px}}`, Ty = ".st-rh-event-board-mobile{margin-top:8px;border-width:1px;border-radius:3px;padding-bottom:6px;background:linear-gradient(180deg,#120d0afa,#070504fa),radial-gradient(circle at top center,rgba(230,197,135,.08),transparent 48%)}.st-rh-event-board-mobile:before{background:linear-gradient(180deg,rgba(255,236,188,.05),transparent 16%),linear-gradient(90deg,rgba(176,143,76,.08),transparent 20%,transparent 80%,rgba(176,143,76,.05))}.st-rh-board-head-mobile{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:end;padding:8px 10px;border-bottom-width:1px}.st-rh-board-head-copy-mobile{min-width:0;display:flex;flex-direction:column;gap:2px}.st-rh-board-title-mobile{font-size:14px;letter-spacing:.1em}.st-rh-board-caption-mobile{color:#dcc49094;font-size:10px;letter-spacing:.18em;text-transform:uppercase}.st-rh-board-id-mobile{align-self:center;max-width:132px;font-size:10px;color:#dcc49080;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.st-rh-event-list-mobile{padding:8px;gap:10px}@media(min-width:481px)and (max-width:680px){.st-rh-board-head-mobile{padding:10px 12px}.st-rh-board-title-mobile{font-size:15px}.st-rh-board-id-mobile{max-width:176px}.st-rh-event-list-mobile{padding:10px;gap:12px}}", ky = `.st-rh-event-item{position:relative;border:1px solid rgba(176,143,76,.3);background:linear-gradient(180deg,#140f0cd9,#0a0806f2),repeating-linear-gradient(45deg,rgba(0,0,0,.03) 0px,rgba(0,0,0,.03) 2px,transparent 2px,transparent 4px);box-shadow:inset 0 0 0 1px #ffdfa30a,0 4px 12px #0009;border-radius:2px;margin-bottom:6px;transition:transform .2s ease,box-shadow .2s ease,border-color .2s ease}.st-rh-event-item:before{content:"";position:absolute;inset:1px;border:1px dashed rgba(176,143,76,.15);pointer-events:none;z-index:1}.st-rh-event-item:hover{border-color:#b08f4c99;box-shadow:inset 0 0 0 1px #ffdfa31a,0 6px 16px #000c,0 0 12px #b08f4c26;transform:translateY(-1px)}.st-rh-event-item:hover:before{border-color:#b08f4c4d}.st-rh-event-item:after{display:none}.st-rh-details-card{border-radius:0;background:transparent;padding:0;margin:0}.st-rh-details-card>summary{list-style:none;cursor:pointer}.st-rh-details-card>summary::-webkit-details-marker{display:none}.st-rh-collapse-summary{position:relative;padding:12px 14px 11px;background:linear-gradient(180deg,#201812f2,#0e0a08e0);border-bottom:1px solid rgba(255,255,255,.03);transition:background .2s cubic-bezier(.2,.8,.2,1),box-shadow .2s ease}.st-rh-collapse-summary:before{content:"";position:absolute;inset:0;background:linear-gradient(90deg,rgba(200,160,80,.15),transparent 20%,transparent 80%,rgba(200,160,80,.1)),radial-gradient(ellipse at top,rgba(255,236,188,.08),transparent 60%);opacity:0;transition:opacity .3s ease;pointer-events:none}.st-rh-collapse-summary:after{content:"";position:absolute;bottom:0;left:10%;right:10%;height:1px;background:radial-gradient(circle,rgba(176,143,76,.5) 0%,transparent 100%);opacity:.6}.st-rh-collapse-summary:hover:before,.st-rh-details-card[open]>.st-rh-collapse-summary:before{opacity:1}.st-rh-summary-layout{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px 14px;align-items:center}.st-rh-details-event .st-rh-summary-header{display:flex;position:relative;align-items:center;gap:10px;padding-bottom:10px;margin-bottom:10px;border-bottom:1px solid rgba(255,255,255,.1)}.st-rh-details-event .st-rh-header-deco-left,.st-rh-details-event .st-rh-header-deco-right{width:12px;height:12px;background:radial-gradient(circle at center,var(--st-rh-border-highlight) 30%,transparent 60%);flex-shrink:0;position:relative}.st-rh-details-event .st-rh-header-deco-left:after,.st-rh-details-event .st-rh-header-deco-right:after{content:"✦";position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);color:var(--st-rh-title);font-size:10px;text-shadow:0 0 4px rgba(255,200,100,.8)}.st-rh-details-event .st-rh-header-deco-left{margin-right:2px}.st-rh-details-event .st-rh-header-deco-right{margin-left:8px}.st-rh-details-event .st-rh-summary-main{min-width:0;display:flex;flex-direction:column;gap:8px}.st-rh-details-event .st-rh-summary-title-row{min-width:0;display:flex;flex:1 1 auto;align-items:center;gap:8px}.st-rh-details-event .st-rh-summary-badge-slot{display:inline-flex;align-items:center;flex:0 0 auto}.st-rh-details-event .st-rh-summary-badge-slot:empty{display:none}.st-rh-details-event .st-rh-summary-title{min-width:0;display:block;flex:1 1 auto;font-family:var(--st-rh-font-display);color:var(--rh-accent);font-size:16px;font-weight:700;line-height:1.28;text-shadow:0 1px 2px rgba(0,0,0,.8)}.st-rh-details-event .st-rh-summary-title-marquee-mobile{display:block;overflow:hidden}.st-rh-details-event .st-rh-summary-title-marquee-mobile.is-overflowing{mask-image:linear-gradient(90deg,transparent 0,#000 6%,#000 94%,transparent 100%);-webkit-mask-image:linear-gradient(90deg,transparent 0,#000 6%,#000 94%,transparent 100%)}.st-rh-details-event .st-rh-summary-title-track-mobile{display:inline-flex;align-items:center;min-width:max-content;width:max-content;transform:translate(0)}.st-rh-details-event .st-rh-summary-title-marquee-mobile.is-overflowing .st-rh-summary-title-track-mobile{animation:st-rh-mobile-title-marquee var(--st-rh-marquee-duration, 8s) ease-in-out infinite alternate}.st-rh-details-event .st-rh-summary-title-segment-mobile{display:inline-flex;align-items:center;white-space:nowrap}.st-rh-details-event .st-rh-summary-id{display:inline-flex;flex:0 0 auto;align-items:center;min-height:24px;max-width:180px;padding:0 2px;color:#d6bf9357;font-size:9px;letter-spacing:.04em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.st-rh-details-event .st-rh-summary-mobile-meta{display:flex;justify-content:flex-end;min-height:10px}.st-rh-summary-info-row{min-width:0;display:flex;align-items:center;gap:8px;flex-wrap:wrap}.st-rh-summary-info-bar{display:flex;flex-wrap:wrap;gap:6px;align-items:center;flex:1 1 auto}.st-rh-summary-runtime-slot{flex:1 1 220px;min-width:0}.st-rh-summary-runtime-slot .st-rh-runtime{width:100%;min-width:0;justify-content:center}.st-rh-badge-role{display:inline-flex;align-items:center;justify-content:center;width:64px;height:20px;margin-right:8px;font-size:11px;font-family:var(--st-rh-font-display);font-weight:700;letter-spacing:.1em;border-radius:2px;box-shadow:inset 0 0 6px #000c,0 2px 4px #0009;text-shadow:0 1px 2px rgba(0,0,0,.9);border:1px solid var(--st-rh-border-strong);vertical-align:top;position:relative;overflow:hidden}.st-rh-badge-role:after{content:"";position:absolute;top:0;left:-100%;width:50%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.15),transparent);transform:skew(-20deg)}.st-rh-badge-role-auto{background:linear-gradient(135deg,#7a2828,#4a1515);color:#f0d49e;border-color:#a53b3b}.st-rh-badge-role-manual{background:linear-gradient(135deg,#2c3e50,#1a252f);color:#bdc3c7;border-color:#4a657c}.st-rh-summary-chip{display:inline-flex;align-items:center;gap:.32rem;min-height:24px;padding:0 8px;border:1px solid rgba(110,87,52,.85);background:linear-gradient(180deg,#1c1510eb,#0a0705e0);color:var(--st-rh-text-muted);font-size:10px;letter-spacing:.04em;box-shadow:inset 0 0 6px #000000a6}.st-rh-summary-chip-check{color:#dfc48c;font-family:JetBrains Mono,Consolas,monospace}.st-rh-summary-chip-time{color:#d79282}.st-rh-summary-actions{display:grid;grid-auto-flow:column;grid-auto-columns:minmax(0,1fr);align-items:stretch;gap:8px;min-width:220px;width:clamp(332px,30vw,356px);justify-self:end;align-self:center}.st-rh-summary-actions>*{margin:0;flex:1 1 auto;min-width:0;white-space:nowrap}.st-rh-roll-btn,.st-rh-runtime,.st-rh-summary-lock,.st-rh-details-event .st-rh-summary-toggle-state{min-height:32px;height:32px;box-sizing:border-box;line-height:1;font-size:11px;display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:0 8px;margin:0;border-radius:3px;width:100%;white-space:nowrap}.st-rh-roll-btn{background:linear-gradient(180deg,#8a362a,#4a150e);border:1px solid #c76150;color:#faeed7;font-family:var(--st-rh-font-display);font-weight:700;cursor:pointer;box-shadow:0 2px 8px #000000e6,inset 0 1px 1px #ffa0a04d,inset 0 -2px 6px #0009;transition:all .2s cubic-bezier(.2,.8,.2,1);text-shadow:0 1px 3px rgba(0,0,0,1);position:relative;overflow:hidden}.st-rh-roll-btn:before{content:"";position:absolute;top:0;left:-100%;width:50%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.15),transparent);transform:skew(-20deg);transition:left .4s ease}.st-rh-roll-btn:hover:not(:disabled){background:linear-gradient(180deg,#a84436,#631d14);border-color:#d67a6b;box-shadow:0 4px 12px #000,inset 0 1px 2px #ffb4b466,0 0 15px #c8463766;transform:translateY(-1px)}.st-rh-roll-btn:hover:not(:disabled):before{left:200%}.st-rh-roll-btn:active:not(:disabled){background:linear-gradient(180deg,#5c2016,#3a0d08);box-shadow:0 1px 3px #000000e6,inset 0 3px 8px #000000d9;transform:translateY(1px)}.st-rh-roll-btn:disabled{background:#3a322e;color:#7a6e65;border-color:#2b2420;cursor:not-allowed;box-shadow:none;text-shadow:none}.st-rh-runtime{color:#f0b1a8;background:linear-gradient(180deg,#52161257,#1e0a0a73);border:1px solid rgba(189,84,73,.28);box-shadow:inset 0 0 8px #00000073;font-size:11px;text-shadow:0 1px 2px rgba(0,0,0,.9)}.st-rh-runtime-inline{margin:0;white-space:nowrap}.st-rh-summary-lock{border:1px solid rgba(176,143,76,.2);color:#8c7b60;background:#0a070599;letter-spacing:.04em;font-family:JetBrains Mono,Consolas,monospace}.st-rh-details-event .st-rh-summary-toggle-state{border:1px solid rgba(126,102,62,.72);background:linear-gradient(180deg,#2b211af5,#140f0ce6);color:var(--st-rh-text);font-family:var(--st-rh-font-display);font-size:10px;box-shadow:0 1px 4px #000000b8;transition:background .2s ease,border-color .2s ease,color .2s ease;cursor:pointer;user-select:none}.st-rh-details-event .st-rh-summary-toggle-state:hover{background:linear-gradient(180deg,#b89556eb,#886731eb);border-color:#c9a86a;color:#1a120c;font-weight:700}.st-rh-details-event .st-rh-summary-toggle-icon{width:1rem;height:1rem;display:inline-flex;justify-content:center;align-items:center;transition:transform .3s cubic-bezier(.4,0,.2,1);line-height:1;font-size:10px;opacity:.9}.st-rh-fa-icon{display:inline-flex;align-items:center;justify-content:center;flex:0 0 auto;line-height:1}.st-rh-summary-chip-icon{font-size:.82rem;opacity:.86}.st-rh-action-icon,.st-rh-btn-icon{font-size:.82rem;opacity:.9}.st-rh-fact-label-icon{color:#d8b87a;font-size:.84rem;opacity:.9}.st-rh-details-event .st-rh-summary-toggle-icon .fa-solid{font-size:.72rem}.st-rh-details-event .st-rh-toggle-open{display:none}.st-rh-details-event[open] .st-rh-toggle-open{display:inline}.st-rh-details-event[open] .st-rh-toggle-closed{display:none}.st-rh-details-event[open] .st-rh-summary-toggle-icon{transform:rotate(180deg);color:inherit}.st-rh-card-details-body{display:none}.st-rh-details-card[open]>.st-rh-card-details-body{display:block}.st-rh-card-details-body.st-rh-anim-opening{display:block!important;overflow:hidden;animation:st-rh-slide-open .3s ease-out forwards}.st-rh-card-details-body.st-rh-anim-closing{display:block!important;overflow:hidden;animation:st-rh-slide-close .25s ease-in forwards}@keyframes st-rh-slide-open{0%{max-height:0;opacity:0;transform:translateY(-6px)}to{max-height:2000px;opacity:1;transform:translateY(0)}}@keyframes st-rh-slide-close{0%{max-height:2000px;opacity:1;transform:translateY(0)}to{max-height:0;opacity:0;transform:translateY(-6px)}}@keyframes st-rh-mobile-title-marquee{0%{transform:translate(0)}12%{transform:translate(0)}88%{transform:translate(var(--st-rh-marquee-distance, 0px))}to{transform:translate(var(--st-rh-marquee-distance, 0px))}}.st-rh-card-details-body.st-rh-event-details{padding:12px;background:linear-gradient(180deg,#080604fa,#0d0a08eb);border-top:1px solid rgba(176,143,76,.36);box-shadow:inset 0 1px #ffdca00d}.st-rh-event-body{display:flex;flex-direction:column;gap:12px}.st-rh-event-narrative,.st-rh-event-note-stack{display:grid;gap:8px}.st-rh-event-desc{padding:10px 12px;border:1px solid rgba(176,143,76,.22);background:linear-gradient(180deg,#1b1510d6,#0c0907e0);font-size:13px;line-height:1.55;color:var(--st-rh-text);font-size:15px;font-family:var(--st-rh-font-main);font-weight:700;text-align:center;box-shadow:inset 0 0 14px #0000006b}.st-rh-event-preview-slot:empty,.st-rh-event-note-slot:empty,.st-rh-event-fact-modifier:empty{display:none}.st-rh-event-fact-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.st-rh-event-fact{min-width:0;padding:8px 10px;border:1px solid rgba(176,143,76,.25);background:linear-gradient(135deg,#1c140ff2,#0c0806e6);box-shadow:inset 0 0 16px #000c,0 2px 4px #00000080;position:relative;display:flex;flex-direction:column;gap:5px;align-items:center;text-align:center}.st-rh-event-fact:after{content:"";position:absolute;inset:1px;border:1px dashed rgba(255,255,255,.03);pointer-events:none}.st-rh-event-fact-wide{grid-column:1 / -1}.st-rh-event-fact-modifier{display:flex;flex-direction:row;justify-content:center;align-items:center;padding:8px 12px;background:linear-gradient(90deg,transparent,rgba(140,100,40,.2),transparent)!important;border:none!important;border-top:1px solid rgba(176,143,76,.3)!important;border-bottom:1px solid rgba(176,143,76,.3)!important;box-shadow:inset 0 0 20px #00000080!important}.st-rh-event-fact-modifier:after{display:none!important}.st-rh-event-fact-modifier .st-rh-chip{background:transparent!important;border:none!important;box-shadow:none!important;font-size:13px;font-family:var(--st-rh-font-main);color:#e6c587}.st-rh-event-fact-modifier .st-rh-chip .st-rh-tip-label{color:#d8b87a;font-weight:700;letter-spacing:.1em;border-bottom:1px dashed rgba(216,184,122,.5)}.st-rh-event-fact-modifier .st-rh-chip .st-rh-inline-tip-segment{color:#d8b87a;font-weight:700;letter-spacing:.04em;border-bottom-color:#d8b87a80}.st-rh-event-fact-label{display:flex;align-items:center;justify-content:center;gap:.35rem;min-height:16px;font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--st-rh-label);border-bottom:1px solid rgba(176,143,76,.2);padding-bottom:3px;width:100%}.st-rh-event-fact-label .st-rh-tip-label{color:var(--st-rh-label);border-bottom-color:#b08f4c59}.st-rh-event-fact-value{min-width:0;color:var(--st-rh-text);font-size:12px;line-height:1.4;word-break:break-word;text-shadow:0 1px 2px rgba(0,0,0,.72)}.st-rh-event-fact-value-target{color:#8ba5d6}.st-rh-event-fact-value-skill{color:#f1e4c2;cursor:help}.st-rh-event-fact-value-highlight{color:var(--st-rh-emphasis)}.st-rh-event-fact-value-mono{color:#e6c587;font-family:JetBrains Mono,Consolas,monospace}.st-rh-event-fact-value-time{color:#d99191}.st-rh-chip{display:inline-flex;align-items:center;justify-content:flex-start;gap:4px;font-size:12px;line-height:1.35;color:var(--st-rh-text);text-align:left}.st-rh-chip-highlight{color:#d4b574;font-weight:700}.st-rh-chip-target{color:#7b99cc}.st-rh-chip-dice,.st-rh-chip-check{color:#e6c587;font-family:JetBrains Mono,Consolas,monospace}.st-rh-chip-time{color:#cc4545}.st-rh-dc-reason,.st-rh-rolled-block{margin:0;padding:9px 11px;border-radius:1px}.st-rh-dc-reason{font-size:13px;line-height:1.5;color:var(--st-rh-text-muted);border:1px dashed rgba(176,143,76,.4);background:#0f0a0899;position:relative}.st-rh-dc-reason:before{content:"i";position:absolute;top:-8px;left:-8px;width:16px;height:16px;background:var(--st-rh-border-strong);color:#000;border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:var(--st-rh-font-display);font-size:10px;font-weight:700}.st-rh-dc-reason .st-rh-dc-note-stack{display:flex;justify-content:center;justify-items:center}.st-rh-rolled-block{display:flex;justify-items:center;justify-content:center;border:1px solid rgba(139,101,8,.42);background:linear-gradient(180deg,#17100af2,#0d0a08eb);font-size:12px;line-height:1.45;color:var(--st-rh-emphasis);text-align:left;box-shadow:inset 0 0 10px #0009;font-family:var(--st-rh-font-main)}.st-rh-event-footer{padding-top:2px;text-align:center}.st-rh-event-footer.is-centered{justify-content:center}.st-rh-command{display:inline-flex;align-items:center;max-width:100%;padding:4px 10px;background:linear-gradient(90deg,#000c,#140a0599,#000c);border-radius:2px;color:#a3947a;border:1px solid rgba(80,65,50,.8);border-top-color:#78645099;font-size:10px;box-shadow:inset 0 2px 4px #0009;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;position:relative}.st-rh-command:before{content:">_";color:var(--st-rh-border-strong);margin-right:6px;font-weight:700}.st-rh-mono{font-family:JetBrains Mono,Consolas,monospace}.st-rh-tip-label{display:inline-flex;align-items:center;justify-content:center;cursor:help;border-bottom:1px dotted rgba(255,223,163,.55);color:#e8dcb5}.st-rh-outcome-preview-wrap{margin-top:12px;margin-bottom:12px;padding:12px 14px;border:1px solid rgba(197,160,89,.4);border-radius:6px;background:linear-gradient(135deg,#1e1e1ebf,#0f0f0fe6);position:relative;box-shadow:inset 0 0 20px #000c,0 2px 8px #0000004d}.st-rh-outcome-preview-wrap:before{content:"";position:absolute;inset:2px;border:1px dashed rgba(197,160,89,.15);border-radius:4px;pointer-events:none}.st-rh-outcome-preview-header{margin-bottom:12px;display:flex;align-items:center;justify-content:center}.st-rh-outcome-preview-header-line{flex-grow:1;height:1px;background:linear-gradient(90deg,transparent,rgba(197,160,89,.5));margin-right:12px}.st-rh-outcome-preview-header-line.right{background:linear-gradient(270deg,transparent,rgba(197,160,89,.5));margin-right:0;margin-left:12px}.st-rh-outcome-preview-header-title{font-family:var(--st-rh-font-display);font-weight:700;color:#d1b67f;font-size:13px;letter-spacing:2px;text-shadow:0 1px 2px rgba(0,0,0,.8);display:flex;align-items:center}.st-rh-outcome-preview-row{display:flex;margin-bottom:8px;padding:8px 10px;border-radius:4px;border-left:3px solid transparent;transition:all .25s ease;background:#0003;border:1px solid rgba(255,255,255,.03);position:relative;overflow:hidden}.st-rh-outcome-preview-row:hover{background-color:#c5a05914;border-left-color:#c5a059b3;border-color:#c5a05933;box-shadow:inset 40px 0 40px -20px #c5a05926;transform:translate(2px)}.st-rh-outcome-preview-row:after{content:"";position:absolute;inset:0;background:url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="4" height="4"><rect width="4" height="4" fill="none"/><rect x="0" y="0" width="1" height="1" fill="rgba(255,255,255,0.03)"/></svg>');pointer-events:none;opacity:.5}.st-rh-outcome-success{border-left-color:#52c41a80}.st-rh-outcome-failure{border-left-color:#ff4d4f80}.st-rh-outcome-explode{border-left-color:#faad1480}.st-rh-outcome-preview-row:hover.st-rh-outcome-success{border-left-color:#52c41ae6}.st-rh-outcome-preview-row:hover.st-rh-outcome-failure{border-left-color:#ff4d4fe6}.st-rh-outcome-preview-row:hover.st-rh-outcome-explode{border-left-color:#faad14e6}.st-rh-outcome-preview-badge{display:inline-flex;align-items:center;justify-content:center;min-width:60px;padding:2px 10px;margin-right:12px;border-width:1px;border-style:solid;border-radius:4px;font-size:11px;font-weight:700;line-height:1.6;white-space:nowrap;user-select:none;box-shadow:0 2px 6px #0000004d,inset 0 1px #ffffff1a;text-shadow:0 1px 2px rgba(0,0,0,.6);position:relative;z-index:1}.st-rh-outcome-preview-content{flex:1;min-width:0;display:flex;flex-direction:column;gap:6px;justify-content:center;position:relative;z-index:1}.st-rh-outcome-preview-text{color:#e4d8c0;word-break:break-word;line-height:1.6;font-size:13px;text-shadow:0 1px 1px rgba(0,0,0,.8)}.st-rh-outcome-preview-status{display:inline-flex;align-items:center;gap:8px;padding:4px 10px;border-width:1px;border-style:solid;border-radius:4px;box-shadow:inset 0 1px 4px #0000004d;align-self:flex-start}.st-rh-outcome-preview-status-label{flex:0 0 auto;font-size:11px;letter-spacing:.08em;white-space:nowrap;line-height:1.2;font-weight:700;text-transform:uppercase;border-right:1px solid currentColor;padding-right:8px;opacity:.9}.st-rh-outcome-preview-status-text{color:#d9c8a2;font-size:11px;line-height:1.45;word-break:break-word}@media(max-width:860px){.st-rh-summary-layout{grid-template-columns:minmax(0,1fr)}.st-rh-summary-actions{display:flex;min-width:0;width:100%;justify-content:flex-start;padding-top:8px;border-top:1px dashed rgba(255,255,255,.08);flex-wrap:wrap}.st-rh-event-fact-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:768px){.st-rh-collapse-summary{padding:9px 10px}.st-rh-card-details-body.st-rh-event-details{padding:10px}.st-rh-event-fact-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.st-rh-details-event .st-rh-summary-title{font-size:14px}.st-rh-details-event .st-rh-summary-id{max-width:140px}}@media(max-width:520px){.st-rh-collapse-summary{padding:8px 9px}.st-rh-details-event .st-rh-summary-id{max-width:100%}.st-rh-summary-actions{min-width:100%;width:100%;gap:6px}.st-rh-runtime,.st-rh-roll-btn,.st-rh-summary-lock,.st-rh-details-event .st-rh-summary-toggle-state{width:100%}.st-rh-summary-actions>*:last-child:nth-child(odd){grid-column:1 / -1}.st-rh-event-desc,.st-rh-rolled-block,.st-rh-dc-reason{font-size:12px;line-height:1.45}}@media(prefers-reduced-motion:reduce){.st-rh-roll-btn,.st-rh-details-event .st-rh-summary-toggle-state,.st-rh-collapse-summary{transition:none}.st-rh-roll-btn:hover{transform:none}.st-rh-details-event .st-rh-summary-toggle-icon,.st-rh-card-details-body{transition:none;animation:none}.st-rh-details-event .st-rh-summary-title-marquee-mobile.is-overflowing .st-rh-summary-title-track-mobile{animation:none}}@container (max-width: 860px){.st-rh-summary-layout{grid-template-columns:minmax(0,1fr)}.st-rh-summary-actions{display:flex;min-width:0;width:100%;justify-content:flex-start;padding-top:8px;border-top:1px dashed rgba(255,255,255,.08);flex-wrap:wrap}.st-rh-event-fact-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@container (max-width: 768px){.st-rh-collapse-summary{padding:9px 10px}.st-rh-card-details-body.st-rh-event-details{padding:10px}.st-rh-event-fact-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.st-rh-details-event .st-rh-summary-title{font-size:14px}.st-rh-details-event .st-rh-summary-id{max-width:140px}}@container (max-width: 680px){.st-rh-collapse-summary{padding:10px 10px 9px}.st-rh-details-event .st-rh-summary-header{margin-bottom:8px;padding-bottom:8px}.st-rh-details-event .st-rh-summary-title{font-size:15px;line-height:1.34}.st-rh-summary-info-row{display:grid;grid-template-columns:repeat(3,minmax(max-content,1fr));gap:6px}.st-rh-summary-info-bar{display:contents}.st-rh-summary-chip,.st-rh-runtime{min-height:36px;justify-content:center;padding:0 10px;line-height:1;white-space:nowrap}.st-rh-summary-runtime-slot{flex:initial}.st-rh-summary-actions{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:6px;min-width:100%;width:100%;padding-top:0;border-top:none}.st-rh-roll-btn,.st-rh-summary-lock,.st-rh-details-event .st-rh-summary-toggle-state{min-height:38px;height:38px;width:100%;padding:0 10px}.st-rh-details-event .st-rh-summary-id{max-width:160px;min-height:auto;padding:0;border:none;background:transparent;color:#d6bf9338;font-size:8px;letter-spacing:.08em}.st-rh-event-desc{text-align:left;font-size:14px}.st-rh-event-fact-grid{grid-template-columns:minmax(0,1fr);gap:7px}.st-rh-event-fact{align-items:stretch;text-align:left}.st-rh-event-fact-label{justify-content:flex-start;font-size:10px}.st-rh-event-fact-value{text-align:left}.st-rh-dc-reason,.st-rh-rolled-block,.st-rh-command{font-size:12px;line-height:1.45}.st-rh-command{display:flex;width:100%;justify-content:flex-start;padding:7px 10px}}@container (min-width: 480px) and (max-width: 680px){.st-rh-event-fact-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.st-rh-event-fact-wide{grid-column:1 / -1}}@container (max-width: 380px){.st-rh-summary-info-row,.st-rh-summary-actions{grid-template-columns:minmax(0,1fr)}}`, wy = ".st-rh-event-item-mobile{margin-bottom:0;border-color:#b08f4c42;background:linear-gradient(180deg,#120d0aeb,#080605f7),repeating-linear-gradient(45deg,rgba(255,255,255,.01) 0px,rgba(255,255,255,.01) 2px,transparent 2px,transparent 4px);box-shadow:inset 0 0 0 1px #ffdfa308,0 4px 10px #0000009e}.st-rh-collapse-summary-mobile{padding:10px 10px 9px}.st-rh-summary-mobile-shell{display:flex;flex-direction:column;gap:9px}.st-rh-summary-mobile-head{display:block;min-width:0;padding-bottom:6px;border-bottom:1px solid rgba(255,255,255,.08);overflow:hidden}.st-rh-summary-title-row-mobile{display:flex;align-items:center;gap:8px;min-width:0}.st-rh-summary-badge-slot-mobile{display:inline-flex;align-items:center;flex:0 0 auto}.st-rh-summary-badge-slot-mobile:empty{display:none}.st-rh-summary-title-mobile{display:block;flex:1 1 auto;min-width:0;font-size:15px;line-height:1.34;text-align:left;overflow:hidden}.st-rh-summary-title-marquee-mobile{display:block;overflow:hidden}.st-rh-summary-title-marquee-mobile.is-overflowing{mask-image:linear-gradient(90deg,transparent 0,#000 6%,#000 94%,transparent 100%);-webkit-mask-image:linear-gradient(90deg,transparent 0,#000 6%,#000 94%,transparent 100%)}.st-rh-summary-title-track-mobile{display:inline-flex;align-items:center;min-width:max-content;width:max-content;transform:translate(0)}.st-rh-summary-title-marquee-mobile.is-overflowing .st-rh-summary-title-track-mobile{animation:st-rh-mobile-title-marquee var(--st-rh-marquee-duration, 8s) ease-in-out infinite alternate}.st-rh-summary-title-segment-mobile{display:inline-flex;align-items:center;white-space:nowrap}.st-rh-mobile-marquee{display:block;flex:1 1 auto;min-width:0;overflow:hidden}.st-rh-mobile-marquee.is-overflowing{mask-image:linear-gradient(90deg,transparent 0,#000 6%,#000 94%,transparent 100%);-webkit-mask-image:linear-gradient(90deg,transparent 0,#000 6%,#000 94%,transparent 100%)}.st-rh-mobile-marquee-track{display:inline-flex;align-items:center;min-width:max-content;width:max-content;transform:translate(0)}.st-rh-mobile-marquee.is-overflowing .st-rh-mobile-marquee-track{animation:st-rh-mobile-title-marquee var(--st-rh-marquee-duration, 8s) ease-in-out infinite alternate}.st-rh-mobile-marquee-segment{display:inline-flex;align-items:center;white-space:nowrap}.st-rh-summary-id-mobile{min-height:auto;max-width:160px;padding:0;color:#d6bf9338;font-size:8px;letter-spacing:.08em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.st-rh-summary-mobile-meta{display:flex;justify-content:flex-end;min-height:10px}@keyframes st-rh-mobile-title-marquee{0%{transform:translate(0)}12%{transform:translate(0)}88%{transform:translate(var(--st-rh-marquee-distance, 0px))}to{transform:translate(var(--st-rh-marquee-distance, 0px))}}.st-rh-summary-mobile-info-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}.st-rh-summary-mobile-info{display:inline-flex;align-items:center;justify-content:center;gap:6px;min-width:0;min-height:34px;padding:0 10px;border:1px solid rgba(110,87,52,.85);background:linear-gradient(180deg,#1c1510f5,#0b0806e6);color:var(--st-rh-text-muted);font-size:11px;line-height:1;letter-spacing:.04em;white-space:nowrap;box-shadow:inset 0 0 8px #000000b3}.st-rh-summary-mobile-info-check{color:#dfc48c;font-family:JetBrains Mono,Consolas,monospace}.st-rh-summary-mobile-info-time{justify-content:flex-start;overflow:hidden;color:#d79282}.st-rh-summary-mobile-info-time .st-rh-summary-chip-icon{flex:0 0 auto}.st-rh-summary-mobile-info-marquee{text-align:left}.st-rh-runtime-mobile{display:inline-flex;align-items:center;justify-content:center;min-height:36px;height:36px;padding:0 10px;font-size:11px;line-height:1;min-width:0;width:100%;white-space:nowrap}.st-rh-summary-mobile-actions{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:6px}.st-rh-summary-mobile-actions>*{min-width:0}.st-rh-summary-mobile-actions .st-rh-roll-btn,.st-rh-summary-mobile-actions .st-rh-summary-lock,.st-rh-summary-mobile-actions .st-rh-summary-toggle-state{min-height:38px;height:38px;width:100%;padding:0 10px;font-size:11px}.st-rh-event-details-mobile{padding:10px}.st-rh-event-body-mobile{gap:10px}.st-rh-event-mobile-lead{display:grid;gap:8px}.st-rh-event-desc-mobile{padding:10px 11px;font-size:14px;line-height:1.55;text-align:left}.st-rh-event-preview-slot-mobile .st-rh-outcome-preview-wrap{margin:0;padding:10px 11px}.st-rh-event-preview-slot-mobile .st-rh-outcome-preview-header-title{font-size:12px;letter-spacing:.12em}.st-rh-event-preview-slot-mobile .st-rh-outcome-preview-row{margin-bottom:6px;padding:8px 9px}.st-rh-event-preview-slot-mobile .st-rh-outcome-preview-badge{min-width:54px;margin-right:10px;padding:2px 8px}.st-rh-event-preview-slot-mobile .st-rh-outcome-preview-text{font-size:12px;line-height:1.5}.st-rh-event-fact-grid-mobile{grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}.st-rh-event-fact-mobile{padding:8px 10px;gap:4px}.st-rh-event-fact-mobile .st-rh-event-fact-label{justify-content:flex-start;font-size:10px}.st-rh-event-fact-mobile .st-rh-event-fact-value{text-align:left;font-size:12px}.st-rh-event-fact-grid-mobile .st-rh-event-fact-modifier{padding:6px 8px}.st-rh-event-fact-grid-mobile .st-rh-event-fact-modifier .st-rh-chip{font-size:12px}.st-rh-event-note-stack-mobile{gap:7px}.st-rh-event-note-stack-mobile .st-rh-dc-reason,.st-rh-event-note-stack-mobile .st-rh-rolled-block{padding:8px 10px;font-size:12px;line-height:1.5}.st-rh-event-footer-mobile{padding-top:0}.st-rh-command-mobile{display:flex;width:100%;justify-content:flex-start;padding:7px 10px;font-size:10px;white-space:nowrap}@media(min-width:481px)and (max-width:680px){.st-rh-collapse-summary-mobile{padding:11px 12px 10px}.st-rh-summary-title-mobile{font-size:16px}.st-rh-summary-mobile-actions .st-rh-roll-btn,.st-rh-summary-mobile-actions .st-rh-summary-lock,.st-rh-summary-mobile-actions .st-rh-summary-toggle-state{min-height:40px;height:40px}.st-rh-event-details-mobile{padding:12px}.st-rh-event-fact-grid-mobile{grid-template-columns:repeat(2,minmax(0,1fr))}.st-rh-event-fact-grid-mobile .st-rh-event-fact-wide{grid-column:1 / -1}}@media(max-width:380px){.st-rh-summary-mobile-info-grid,.st-rh-summary-mobile-actions{grid-template-columns:minmax(0,1fr)}}@media(prefers-reduced-motion:reduce){.st-rh-summary-title-marquee-mobile.is-overflowing .st-rh-summary-title-track-mobile{animation:none}}", Iy = '.st-rh-shell-frame{position:relative;overflow:hidden;border:1px solid var(--st-rh-royal-border);border-radius:2px;padding:2px;background:linear-gradient(135deg,#644b2cbf,#1f160ff5),repeating-linear-gradient(45deg,rgba(255,234,200,.03) 0px,rgba(255,234,200,.03) 2px,transparent 2px,transparent 5px);box-shadow:0 10px 20px #000000b8,inset 0 0 0 1px #000000e0,inset 0 0 18px #ffdc8c0a}.st-rh-shell-frame:before,.st-rh-shell-frame:after{content:"";position:absolute;width:16px;height:16px;border:2px solid var(--st-rh-border-highlight);pointer-events:none;z-index:3;opacity:.82;box-shadow:0 0 4px #000000bf}.st-rh-shell-frame:before{top:-1px;left:-1px;border-right:none;border-bottom:none}.st-rh-shell-frame:after{right:-1px;bottom:-1px;border-left:none;border-top:none}.st-rh-settlement-shell{position:relative;overflow:hidden;border:1px solid rgba(0,0,0,.85);background:var(--st-rh-royal-panel);box-shadow:var(--st-rh-shadow);transition:border-color .24s ease,box-shadow .24s ease,transform .24s ease}.st-rh-settlement-shell:before{content:"";position:absolute;inset:0;background:radial-gradient(circle at top,rgba(255,236,192,.06),transparent 40%),linear-gradient(180deg,rgba(255,223,153,.04),transparent 18%,transparent 82%,rgba(255,223,153,.03));pointer-events:none;opacity:.75}.st-rh-settlement-shell[open]{border-color:#8e6b3ce0;box-shadow:0 14px 28px #000000c7,inset 0 0 26px #0009,0 0 14px #b08f4c24}.st-rh-shell-topline{position:relative;height:4px;background:linear-gradient(90deg,transparent 0%,rgba(126,94,48,.22) 8%,rgba(218,186,120,.92) 50%,rgba(126,94,48,.22) 92%,transparent 100%);box-shadow:0 1px 3px #000c}.st-rh-shell-summary{display:block;cursor:pointer;list-style:none;position:relative}.st-rh-shell-summary::-webkit-details-marker{display:none}.st-rh-summary-wrap{display:grid;gap:.65rem;padding:.72rem .72rem .78rem;position:relative}.st-rh-result-summary-grid{grid-template-columns:minmax(0,1fr) auto;align-items:start;column-gap:14px}.st-rh-summary-ornament{grid-column:1 / -1;display:flex;align-items:center;justify-content:center;gap:10px;min-height:14px;opacity:.9;margin-bottom:5px}.st-rh-summary-ornament-line{flex:1 1 auto;max-width:140px;height:1px;background:linear-gradient(90deg,transparent,rgba(214,180,114,.56),transparent)}.st-rh-summary-ornament-seal{position:relative;width:24px;height:24px;border-radius:50%;border:1px solid rgba(219,190,126,.42);background:radial-gradient(circle at 35% 35%,rgba(255,239,191,.3),transparent 42%),radial-gradient(circle at center,#523216f2,#1a120bfa);box-shadow:inset 0 0 0 1px #ffe6b014,0 0 10px #b08f4c24}.st-rh-summary-ornament-seal:before,.st-rh-summary-ornament-seal:after{content:"";position:absolute;inset:5px;border:1px solid rgba(217,188,124,.28);transform:rotate(45deg)}.st-rh-summary-ornament-seal:after{inset:8px;background:radial-gradient(circle at center,rgba(235,205,148,.45),transparent 68%)}.st-rh-result-summary-main{min-width:0;display:flex;flex-direction:column;gap:.58rem}.st-rh-summary-banner{position:relative;padding:1px;background:linear-gradient(180deg,#c9a7656b,#47311b8c);box-shadow:0 6px 12px #0000006b,inset 0 0 0 1px #ffe5a30a}.st-rh-summary-banner-inner{position:relative;padding:.72rem .9rem;background:radial-gradient(circle at top,rgba(244,222,169,.1),transparent 58%),linear-gradient(180deg,#2e2117fa,#110b08f5);overflow:hidden}.st-rh-summary-banner-inner:before{content:"";position:absolute;inset:3px;border:1px solid rgba(212,180,112,.14);pointer-events:none}.st-rh-settlement-shell .st-rh-summary-header{display:flex;align-items:center;gap:10px;min-width:0}.st-rh-settlement-shell .st-rh-header-deco-left,.st-rh-settlement-shell .st-rh-header-deco-right{position:relative;flex:0 0 16px;width:16px;height:16px}.st-rh-settlement-shell .st-rh-header-deco-left:before,.st-rh-settlement-shell .st-rh-header-deco-right:before,.st-rh-settlement-shell .st-rh-header-deco-left:after,.st-rh-settlement-shell .st-rh-header-deco-right:after{content:"";position:absolute;inset:0}.st-rh-settlement-shell .st-rh-header-deco-left:before,.st-rh-settlement-shell .st-rh-header-deco-right:before{border:1px solid rgba(214,180,110,.52);transform:rotate(45deg)}.st-rh-settlement-shell .st-rh-header-deco-left:after,.st-rh-settlement-shell .st-rh-header-deco-right:after{inset:4px;border-radius:50%;background:radial-gradient(circle at center,rgba(237,214,162,.92),rgba(123,89,47,.32) 56%,transparent 62%)}.st-rh-settlement-shell .st-rh-summary-title{flex:1 1 auto;min-width:0;display:flex;align-items:center;overflow:hidden;color:var(--st-rh-royal-title);font-family:var(--st-rh-font-display);font-size:15px;line-height:1.35;letter-spacing:.04em;text-shadow:0 2px 4px var(--st-rh-royal-shadow)}.st-rh-settlement-shell .st-rh-summary-title-marquee{display:block;flex:1 1 auto;min-width:0;max-width:100%;overflow:hidden}.st-rh-settlement-shell .st-rh-summary-title-marquee.is-overflowing{mask-image:linear-gradient(90deg,transparent 0,#000 5%,#000 95%,transparent 100%);-webkit-mask-image:linear-gradient(90deg,transparent 0,#000 5%,#000 95%,transparent 100%)}.st-rh-settlement-shell .st-rh-summary-title-track{display:inline-flex;align-items:center;min-width:max-content;width:max-content;max-width:none;transform:translate(0);will-change:transform}.st-rh-settlement-shell .st-rh-summary-title-marquee.is-overflowing .st-rh-summary-title-track{animation:st-rh-settlement-title-marquee var(--st-rh-marquee-duration, 8s) ease-in-out infinite alternate}.st-rh-settlement-shell .st-rh-summary-title-segment{display:inline-flex;align-items:center;min-width:max-content;white-space:nowrap}@keyframes st-rh-settlement-title-marquee{0%{transform:translate(0)}12%{transform:translate(0)}88%{transform:translate(var(--st-rh-marquee-distance, 0px))}to{transform:translate(var(--st-rh-marquee-distance, 0px))}}.st-rh-settlement-shell .st-rh-summary-id{flex:0 0 auto;display:inline-flex;align-items:center;min-height:24px;max-width:180px;padding:0 6px;border:1px solid rgba(135,105,63,.38);background:#08060475;color:#e1cca094;font-size:10px;letter-spacing:.08em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.st-rh-summary-badge-desktop,.st-rh-summary-badge{display:inline-flex}.st-rh-summary-primary,.st-rh-summary-secondary{display:flex;flex-wrap:wrap;gap:7px}.st-rh-summary-judgement{position:relative;align-items:center;padding-left:5px;padding-right:5px;border:1px solid rgba(184,149,90,.32);background:linear-gradient(180deg,#2d2117eb,#100c09fa),repeating-linear-gradient(90deg,rgba(255,240,210,.015) 0px,rgba(255,240,210,.015) 1px,transparent 1px,transparent 5px);box-shadow:inset 0 0 0 1px #ffecc30a,inset 0 -12px 20px #0000003d,0 4px 10px #00000057}.st-rh-summary-judgement:before{content:"";position:absolute;inset:3px;border:1px dashed rgba(186,151,90,.12);pointer-events:none}.st-rh-summary-judgement>.st-rh-summary-badge,.st-rh-summary-judgement>.st-rh-inline-chip{position:relative;z-index:1;align-items:center}.st-rh-summary-judgement>.st-rh-inline-chip{min-height:24px;padding:.42rem .82rem;border-radius:2px;line-height:1;box-shadow:inset 0 0 0 1px #ffecc308,0 3px 8px #0000004d}.st-rh-summary-judgement>.st-rh-summary-badge{min-height:36px;padding:0;box-shadow:none}.st-rh-summary-judgement>.st-rh-summary-badge .st-rh-status-pill{min-height:24px;padding:.42rem .9rem;align-items:center;justify-content:center;line-height:1;border-radius:2px}.st-rh-summary-judgement>.st-rh-chip-strong{background:linear-gradient(180deg,#84623594,#342417eb);border-color:#ab884fa3}.st-rh-summary-judgement>.st-rh-chip-soft{background:linear-gradient(180deg,#392b1de0,#150f0bf0);border-color:#745a3985;color:#e3d0aadb}.st-rh-summary-outcome-wrap{position:relative;overflow:hidden;padding:0;border:1px solid rgba(174,138,79,.26);border-left:3px solid rgba(189,151,87,.62);background:var(--st-rh-royal-scroll);box-shadow:inset 0 0 0 1px #ffeebe08,0 4px 10px #0000003d}.st-rh-summary-outcome-wrap:before{content:"";position:absolute;inset:0;background:linear-gradient(90deg,rgba(255,226,164,.08),transparent 28%,transparent 72%,rgba(255,226,164,.06)),radial-gradient(circle at top left,rgba(255,238,191,.06),transparent 44%);pointer-events:none}.st-rh-summary-outcome-scroll{position:relative;z-index:1;display:flex;flex-direction:column;gap:0}.st-rh-summary-mobile-hero{display:none}.st-rh-chip-icon{margin-right:6px;opacity:.86;font-size:.9em;color:var(--st-rh-border-highlight)}.st-rh-summary-chip-outcome{display:block!important;border:none!important;background:transparent!important;padding:.82rem .92rem .76rem!important;color:var(--st-rh-royal-ink)!important;font-size:15px;font-style:italic;line-height:1.6;box-shadow:none!important}.st-rh-summary-chip-status-summary{display:flex!important;align-items:center;margin:0 .82rem .82rem;min-height:34px;padding:.55rem .78rem;border:1px solid rgba(122,94,57,.34)!important;border-radius:999px;background:linear-gradient(180deg,#322517db,#110b08eb)!important;color:#e6d6b2f5!important;box-shadow:inset 0 0 0 1px #ffecc308,inset 0 0 14px #00000047}.st-rh-summary-outcome-scroll>.st-rh-inline-chip:first-child{display:flex;align-items:center;min-height:38px;padding:.62rem .92rem;border:none!important;border-bottom:1px solid rgba(191,153,91,.18)!important;border-radius:0!important;background:linear-gradient(180deg,#533b226b,#22160e47)!important;color:#d5b880eb!important;box-shadow:inset 0 -1px #00000038!important;font-family:var(--st-rh-font-display);font-size:13px;letter-spacing:.06em}.st-rh-summary-outcome-scroll>.st-rh-inline-chip:first-child .st-rh-chip-icon{color:#d5b880d1;font-size:.95rem}.st-rh-summary-outcome-scroll .st-rh-summary-chip-outcome .st-rh-chip-icon{display:none}.st-rh-summary-outcome-scroll .st-rh-summary-chip-status-summary .st-rh-chip-icon{color:#e0bd78e6}.st-rh-result-summary-side{min-width:0;display:flex;flex-direction:column;align-items:flex-end;gap:10px}.st-rh-summary-visual-wrap{display:flex;justify-content:center;width:100%}.st-rh-summary-visual-dais{position:relative;display:inline-flex;align-items:center;justify-content:center;padding:10px;border:1px solid rgba(170,132,77,.42);background:radial-gradient(circle at top,rgba(244,224,179,.14),transparent 48%),linear-gradient(180deg,#3c2a19f2,#0e0a07fa);box-shadow:inset 0 0 0 1px #ffe8b60d,inset 0 -16px 18px #0000006b,0 6px 12px #0006}.st-rh-summary-visual-dais:before,.st-rh-summary-visual-dais:after{content:"";position:absolute;width:14px;height:14px;border:1px solid rgba(210,179,118,.42);transform:rotate(45deg);background:linear-gradient(135deg,#523a20f2,#130d09fa)}.st-rh-summary-visual-dais:before{top:-7px;left:calc(50% - 7px)}.st-rh-summary-visual-dais:after{bottom:-7px;left:calc(50% - 7px)}.st-rh-dice-slot{position:relative;display:inline-flex;align-items:center;justify-content:center;border:1px solid var(--st-rh-border-strong);border-radius:2px;padding:.35rem;background:radial-gradient(circle at center,rgba(255,225,162,.08),transparent 42%),linear-gradient(180deg,#100c09f2,#080604);box-shadow:inset 0 0 14px #000000eb,0 3px 8px #000000a6}.st-rh-dice-slot:after{content:"";position:absolute;inset:2px;border:1px dashed rgba(191,156,97,.18);pointer-events:none}.st-rh-dice-slot svg{max-width:100%;height:auto;filter:drop-shadow(0 2px 4px rgba(0,0,0,.8))}.st-rh-summary-visual-fallback{display:inline-flex;font-family:var(--st-rh-font-display);font-size:11px;font-weight:700;color:#ead5adb8;letter-spacing:.12em}.st-rh-settlement-shell .st-rh-summary-actions-compact{display:flex;justify-content:center;width:100%}.st-rh-settlement-shell .st-rh-summary-toggle-state{display:inline-flex;align-items:center;justify-content:center;min-height:32px;padding:0 12px;border:1px solid rgba(176,143,76,.58);background:linear-gradient(180deg,#5c4223f2,#2b1c11fa);color:var(--st-rh-royal-ink);font-family:var(--st-rh-font-display);font-size:11px;letter-spacing:.08em;white-space:nowrap;user-select:none;box-shadow:inset 0 1px #ffe8b31f,inset 0 -8px 12px #00000042,0 3px 8px #00000085;transition:border-color .2s ease,color .2s ease,background .2s ease,transform .2s ease}.st-rh-settlement-shell .st-rh-summary-toggle-state:hover{border-color:#d6b471d6;background:linear-gradient(180deg,#7e582af5,#3a2514fc);color:var(--st-rh-royal-title);transform:translateY(-1px)}.st-rh-settlement-shell .st-rh-summary-toggle-icon{width:1.1rem;height:1.1rem;display:inline-flex;align-items:center;justify-content:center;transition:transform .24s ease}.st-rh-settlement-shell .st-rh-toggle-open{display:none}.st-rh-settlement-shell[open] .st-rh-toggle-open{display:inline}.st-rh-settlement-shell[open] .st-rh-toggle-closed{display:none}.st-rh-marquee-clip{display:inline-flex;overflow:hidden;max-width:100%}.st-rh-marquee-track{display:inline-flex;align-items:center;min-width:max-content;white-space:nowrap;will-change:transform;animation:none}.is-marquee .st-rh-marquee-track{animation:st-rh-marquee-scroll 14s linear infinite}.is-marquee:hover .st-rh-marquee-track{animation-play-state:paused}.st-rh-marquee-text,.st-rh-marquee-gap{display:inline-flex;align-items:center;flex:0 0 auto}.st-rh-marquee-gap{margin-inline:.5rem}@keyframes st-rh-marquee-scroll{0%{transform:translate(0)}to{transform:translate(calc(-50% - .5rem))}}.st-rh-settlement-shell .st-rh-details-body{position:relative;padding:0 .72rem .72rem;border-top:1px solid rgba(124,93,53,.62);background:linear-gradient(180deg,rgba(10,7,5,.2),transparent 16%),linear-gradient(180deg,#0b0806f5,#110c09f0)}.st-rh-settlement-shell .st-rh-details-body:before{content:"";position:absolute;top:0;left:10%;right:10%;height:1px;background:linear-gradient(90deg,transparent,rgba(219,189,122,.45),transparent)}.st-rh-settlement-shell .st-rh-details-body.st-rh-anim-opening{display:block!important;overflow:hidden;animation:st-rh-slide-open .3s ease-out forwards}.st-rh-settlement-shell .st-rh-details-body.st-rh-anim-closing{display:block!important;overflow:hidden;animation:st-rh-slide-close .25s ease-in forwards}@keyframes st-rh-slide-open{0%{max-height:0;opacity:0;transform:translateY(-6px)}to{max-height:2200px;opacity:1;transform:translateY(0)}}@keyframes st-rh-slide-close{0%{max-height:2200px;opacity:1;transform:translateY(0)}to{max-height:0;opacity:0;transform:translateY(-6px)}}.st-rh-details-layout{display:grid;gap:.72rem;margin-top:.72rem}.st-rh-details-main,.st-rh-details-side{display:flex;flex-direction:column;gap:.72rem}.st-rh-details-side-primary{display:block}.st-rh-meta-panel,.st-rh-info-panel,.st-rh-result-core{position:relative;overflow:hidden;border:1px solid rgba(170,134,79,.34);background:var(--st-rh-royal-panel-strong);box-shadow:inset 0 0 0 1px #ffe7ad08,inset 0 -20px 28px #00000038,0 6px 14px #00000047}.st-rh-meta-panel:before,.st-rh-info-panel:before,.st-rh-result-core:before{content:"";position:absolute;inset:4px;border:1px solid rgba(191,156,97,.1);pointer-events:none}.st-rh-info-panel,.st-rh-meta-panel,.st-rh-result-core{padding:.72rem .8rem}.st-rh-info-panel .st-rh-kicker{font-size:12px;letter-spacing:.12em}.st-rh-outcome-panel{padding:.82rem .9rem .9rem;border-color:#b28d526b;background:radial-gradient(circle at top,rgba(245,224,173,.1),transparent 48%),linear-gradient(180deg,#3f2b19f5,#0d0907fc);box-shadow:inset 0 0 0 1px #ffe9b808,inset 0 -26px 36px #0000003d,0 8px 18px #00000057}.st-rh-outcome-head{display:flex;align-items:center;gap:.5rem;margin-bottom:.7rem}.st-rh-outcome-head-line{flex:1 1 auto;height:1px;min-width:16px;background:linear-gradient(90deg,transparent,rgba(212,179,117,.28),transparent)}.st-rh-outcome-head-seal{position:relative;flex:0 0 12px;width:12px;height:12px;transform:rotate(45deg);border:1px solid rgba(208,175,112,.34);background:radial-gradient(circle at center,rgba(246,223,173,.24),transparent 60%),linear-gradient(135deg,#573c22f2,#18100bfa);box-shadow:0 0 10px #d6b77a14}.st-rh-outcome-kicker{display:inline-flex;align-items:center;justify-content:center;margin:0;padding:.28rem .82rem .24rem;border:1px solid rgba(193,158,99,.34);background:linear-gradient(180deg,#6143269e,#24180fdb);color:var(--st-rh-royal-title);letter-spacing:.14em;text-shadow:0 2px 6px rgba(0,0,0,.65);box-shadow:inset 0 0 0 1px #ffeac108,0 0 16px #d6b77a0d;white-space:nowrap}.st-rh-outcome-scroll{position:relative;padding:1.05rem 1.1rem 1rem;border:1px solid rgba(187,151,96,.22);background:linear-gradient(180deg,#5c432a4d,#31201524),repeating-linear-gradient(0deg,rgba(248,228,187,.022) 0px,rgba(248,228,187,.022) 1px,transparent 1px,transparent 4px),radial-gradient(circle at top,rgba(240,218,173,.09),transparent 62%),linear-gradient(180deg,#322317e6,#120c09f0);box-shadow:inset 0 0 0 1px #fff0cd05,inset 0 -12px 18px #0000002e}.st-rh-outcome-scroll:before,.st-rh-outcome-scroll:after{content:"";position:absolute;left:16px;right:16px;height:1px;background:linear-gradient(90deg,transparent,rgba(222,190,128,.18),transparent)}.st-rh-outcome-scroll:before{top:8px}.st-rh-outcome-scroll:after{bottom:8px}.st-rh-outcome-copy{position:relative;color:#efe1c5f2;font-size:15px;line-height:1.88;text-shadow:0 1px 2px rgba(0,0,0,.56)}.st-rh-outcome-copy:before{content:"叙事札记";display:inline-block;margin-bottom:.5rem;margin-right:.75rem;padding:.12rem .42rem .08rem;border:1px solid rgba(189,155,97,.18);background:#4d361f47;color:#d6ba85ad;font-size:10px;letter-spacing:.18em;text-transform:uppercase}.st-rh-outcome-status-strip{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:.55rem;margin-top:.72rem}.st-rh-outcome-strip-item{display:flex;flex-direction:column;gap:.24rem;min-width:0;padding:.58rem .68rem;border:1px solid rgba(173,136,83,.22);background:linear-gradient(180deg,#47311e75,#150e0ab8);box-shadow:inset 0 0 0 1px #ffe9bc05}.st-rh-outcome-strip-label{color:#ccb07ac2;font-size:12px;letter-spacing:.14em;text-transform:uppercase}.st-rh-outcome-strip-value{color:#eddfc1f0;font-size:12px;line-height:1.58;word-break:break-word}.st-rh-outcome-strip-item-muted{border-color:#92724729;background:linear-gradient(180deg,#2f20155c,#100b0899)}.st-rh-outcome-strip-item-muted .st-rh-outcome-strip-label,.st-rh-outcome-strip-item-muted .st-rh-outcome-strip-value{color:#bfa87fa3}.st-rh-outcome-panel.st-rh-outcome-tone-success .st-rh-outcome-kicker{border-color:#a6975666;box-shadow:inset 0 0 0 1px #ffeac108,0 0 18px #95bb6014}.st-rh-outcome-panel.st-rh-outcome-tone-success .st-rh-outcome-scroll{border-color:#9ba95d33}.st-rh-outcome-panel.st-rh-outcome-tone-failure .st-rh-outcome-kicker,.st-rh-outcome-panel.st-rh-outcome-tone-explode .st-rh-outcome-kicker{border-color:#b07a576b;background:linear-gradient(180deg,#6c3e29a8,#2a1610e6)}.st-rh-outcome-panel.st-rh-outcome-tone-failure .st-rh-outcome-scroll,.st-rh-outcome-panel.st-rh-outcome-tone-explode .st-rh-outcome-scroll{border-color:#ad71533d}.st-rh-details-head{display:flex;flex-direction:column;gap:.5rem}.st-rh-details-head-copy{min-width:0}.st-rh-details-head-side{display:flex;align-items:center;gap:10px}.st-rh-details-head-seal{position:relative;width:20px;height:20px;flex:0 0 20px;transform:rotate(45deg);border:1px solid rgba(207,174,111,.34);background:radial-gradient(circle at center,rgba(240,216,164,.2),transparent 58%),linear-gradient(135deg,#4c341cf2,#120c09fa);box-shadow:0 0 10px #b08f4c1f}.st-rh-details-head-seal:before{content:"";position:absolute;inset:4px;transform:rotate(-45deg);border-radius:50%;background:radial-gradient(circle at center,rgba(239,216,165,.78),rgba(103,75,41,.2) 62%,transparent 68%)}.st-rh-details-heading{margin-top:.2rem;color:var(--st-rh-royal-title);font-family:var(--st-rh-font-display);font-size:15px;line-height:1.35;font-weight:700;letter-spacing:.04em;text-shadow:0 2px 4px var(--st-rh-royal-shadow)}.st-rh-details-badge{display:inline-flex;flex-wrap:wrap;justify-content:flex-end}.st-rh-fact-grid,.st-rh-result-meta-grid{display:grid;gap:.58rem;margin-top:.78rem}.st-rh-fact-card{position:relative;overflow:hidden}.st-rh-surface-card{padding:.62rem .7rem;border:1px solid rgba(170,132,78,.26);border-left:2px solid rgba(198,158,93,.58);background:linear-gradient(180deg,#2f2217c7,#110b08eb),repeating-linear-gradient(0deg,rgba(255,242,214,.018) 0px,rgba(255,242,214,.018) 1px,transparent 1px,transparent 4px);box-shadow:inset 0 0 0 1px #ffecc405,inset 0 -10px 16px #0000002e}.st-rh-fact-label{margin-bottom:.2rem;color:#cdb174eb;font-size:10px;letter-spacing:.1em;text-transform:uppercase}.st-rh-fact-value{color:var(--st-rh-royal-ink);line-height:1.45;text-shadow:0 1px 2px rgba(0,0,0,.72)}.st-rh-result-core{background:radial-gradient(circle at top,rgba(244,218,165,.12),transparent 45%),linear-gradient(180deg,#392817fa,#0e0a07fc)}.st-rh-result-core-head{display:flex;align-items:flex-start;justify-content:space-between;gap:.75rem}.st-rh-result-core-copy{min-width:0}.st-rh-score-row{display:inline-flex;align-items:baseline;gap:.45rem;margin-top:.4rem;padding:.1rem 0 .48rem;border-bottom:1px solid rgba(195,159,97,.26)}.st-rh-result-total{color:var(--st-rh-royal-title);font-size:30px;line-height:1;text-shadow:0 2px 8px rgba(0,0,0,.92),0 0 14px rgba(242,212,143,.12)}.st-rh-result-total-label{font-size:11px;color:#d6bb84eb;letter-spacing:.12em}.st-rh-result-visual{position:relative;display:flex;justify-content:center;margin-top:.8rem;padding:.72rem;border:1px solid rgba(182,144,87,.28);background:radial-gradient(circle at center,rgba(255,226,170,.08),transparent 42%),linear-gradient(180deg,#090705fa,#160f0bf2);box-shadow:inset 0 0 16px #000000eb,inset 0 0 0 1px #ffebb608}.st-rh-result-visual:before{content:"";position:absolute;inset:4px;border:1px dashed rgba(198,162,103,.14);pointer-events:none}.st-rh-empty-visual{padding:1rem;text-align:center;font-size:11px;color:#e2cfa89e;letter-spacing:.08em}.st-rh-status-badge{text-transform:uppercase;letter-spacing:.14em}.st-rh-status-pill{min-height:28px;padding:.2rem .7rem;border-radius:2px;border-color:color-mix(in srgb,var(--st-rh-status-color, #d8aa58) 65%,rgba(74,53,32,.8));background:linear-gradient(180deg,color-mix(in srgb,var(--st-rh-status-color, #d8aa58) 18%,rgba(87,55,28,.9)),#140e0af5)!important;box-shadow:inset 0 0 0 1px #ffe8ba0a,inset 0 -10px 14px #0000003d,0 0 10px color-mix(in srgb,var(--st-rh-status-color, #d8aa58) 16%,transparent)}.st-rh-status-pill:after{opacity:.55}@media(min-width:640px){.st-rh-summary-wrap,.st-rh-info-panel,.st-rh-meta-panel,.st-rh-result-core{padding:.86rem .96rem}.st-rh-settlement-shell .st-rh-summary-title{font-size:16px}.st-rh-summary-badge-desktop{display:flex}.st-rh-summary-badge-mobile{display:none}.st-rh-details-head{flex-direction:row;align-items:flex-start;justify-content:space-between}.st-rh-fact-grid,.st-rh-result-meta-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.st-rh-result-total{font-size:38px}}@media(min-width:860px){.st-rh-summary-wrap{padding:.95rem 1rem 1rem}.st-rh-settlement-shell .st-rh-summary-title{font-size:17px}.st-rh-summary-visual-wrap{margin-bottom:10px}}@media(max-width:859px){.st-rh-result-summary-grid{grid-template-columns:minmax(0,1fr)}.st-rh-result-summary-side{align-items:stretch}.st-rh-summary-visual-wrap,.st-rh-settlement-shell .st-rh-summary-actions-compact{justify-content:flex-start}}@media(max-width:639px){.st-rh-summary-wrap{padding:.62rem}.st-rh-summary-banner-inner{padding:.68rem .76rem}.st-rh-settlement-shell .st-rh-summary-header{flex-wrap:wrap}.st-rh-settlement-shell .st-rh-summary-id{max-width:100%}.st-rh-settlement-shell .st-rh-details-body{padding:0 .62rem .62rem}.st-rh-outcome-panel{padding:.72rem .72rem .76rem}.st-rh-outcome-head{gap:.35rem;margin-bottom:.58rem}.st-rh-outcome-kicker{max-width:100%;padding-inline:.64rem;font-size:11px;letter-spacing:.1em}.st-rh-outcome-scroll{padding:.86rem .82rem .84rem}.st-rh-outcome-copy{font-size:14px;line-height:1.78}.st-rh-outcome-status-strip{grid-template-columns:minmax(0,1fr);gap:.48rem}.st-rh-details-head-side{justify-content:space-between}}@media(max-width:520px){.st-rh-summary-judgement,.st-rh-summary-outcome-wrap,.st-rh-info-panel,.st-rh-meta-panel,.st-rh-result-core{padding-inline:.72rem}.st-rh-settlement-shell .st-rh-summary-toggle-state,.st-rh-settlement-shell .st-rh-summary-actions-compact{width:100%}.st-rh-outcome-head{flex-wrap:wrap}.st-rh-outcome-head-line,.st-rh-outcome-head-seal{display:none}.st-rh-outcome-kicker{width:100%}.st-rh-details-head-side{flex-wrap:wrap}}@media(prefers-reduced-motion:reduce){.st-rh-settlement-shell,.st-rh-settlement-shell .st-rh-summary-toggle-state,.st-rh-settlement-shell .st-rh-summary-title-track,.st-rh-marquee-track,.st-rh-settlement-shell .st-rh-details-body,.st-rh-settlement-shell .st-rh-summary-toggle-icon{transition:none;animation:none}.st-rh-settlement-shell .st-rh-summary-toggle-state:hover{transform:none}}@container (min-width: 640px){.st-rh-summary-wrap,.st-rh-info-panel,.st-rh-meta-panel,.st-rh-result-core{padding:.86rem .96rem}.st-rh-settlement-shell .st-rh-summary-title{font-size:16px}.st-rh-summary-badge-desktop{display:flex}.st-rh-summary-badge-mobile{display:none}.st-rh-details-head{flex-direction:row;align-items:flex-start;justify-content:space-between}.st-rh-fact-grid,.st-rh-result-meta-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.st-rh-result-total{font-size:38px}}@container (min-width: 860px){.st-rh-summary-wrap{padding:.95rem 1rem 1rem}.st-rh-settlement-shell .st-rh-summary-title{font-size:17px}.st-rh-summary-visual-wrap{margin-bottom:10px}}@container (max-width: 859px){.st-rh-result-summary-grid{grid-template-columns:minmax(0,1fr)}.st-rh-result-summary-side{align-items:stretch}.st-rh-summary-visual-wrap,.st-rh-settlement-shell .st-rh-summary-actions-compact{justify-content:flex-start}}@container (max-width: 680px){.st-rh-summary-wrap{padding:.66rem}.st-rh-summary-ornament{gap:8px;margin-bottom:2px}.st-rh-summary-ornament-line{max-width:84px}.st-rh-summary-banner-inner{padding:.68rem .76rem}.st-rh-settlement-shell .st-rh-summary-header{flex-wrap:wrap;gap:8px}.st-rh-settlement-shell .st-rh-summary-title{font-size:15px;line-height:1.4}.st-rh-outcome-panel{padding:.74rem .74rem .8rem}.st-rh-outcome-scroll{padding:.9rem .88rem .86rem}.st-rh-outcome-copy{font-size:14px;line-height:1.8}.st-rh-outcome-status-strip{grid-template-columns:minmax(0,1fr)}.st-rh-settlement-shell .st-rh-summary-id{width:100%;max-width:none;min-height:16px;justify-content:flex-end;padding:0;border:none;background:transparent;color:#e1cca042;font-size:8px;letter-spacing:.06em}.st-rh-summary-primary{gap:6px}.st-rh-summary-mobile-hero{display:block}.st-rh-summary-mobile-hero .st-rh-result-core{margin-top:.1rem;padding:.82rem .82rem .88rem}.st-rh-summary-mobile-hero .st-rh-result-core-head{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:.55rem .8rem}.st-rh-summary-mobile-hero .st-rh-result-core-copy{display:flex;flex-direction:column;gap:.26rem;min-width:0}.st-rh-summary-mobile-hero .st-rh-score-row{display:flex;flex-wrap:wrap;gap:.42rem;margin-top:0}.st-rh-summary-mobile-hero .st-rh-result-total{font-size:40px}.st-rh-summary-mobile-hero .st-rh-result-visual{margin-top:.72rem;padding:.8rem}.st-rh-summary-mobile-hero .st-rh-result-meta-grid{margin-top:.72rem;grid-template-columns:repeat(2,minmax(0,1fr));gap:.55rem .8rem}.st-rh-summary-mobile-hero .st-rh-result-meta-grid .st-rh-surface-card{display:flex;align-items:center;justify-content:space-between;gap:.75rem;min-height:40px;padding:.18rem 0;border:none;border-radius:0;border-top:1px solid rgba(191,153,91,.28);background:transparent;box-shadow:none}.st-rh-summary-mobile-hero .st-rh-result-meta-grid .st-rh-fact-label{margin-bottom:0;padding-right:.4rem;border-bottom:none;white-space:nowrap}.st-rh-summary-mobile-hero .st-rh-result-meta-grid .st-rh-fact-value{text-align:right;font-size:15px;white-space:nowrap}.st-rh-result-summary-side .st-rh-summary-visual-wrap{display:none}.st-rh-settlement-shell .st-rh-summary-actions-compact,.st-rh-settlement-shell .st-rh-summary-toggle-state{width:100%}.st-rh-settlement-shell .st-rh-details-body{padding:0 .66rem .7rem}.st-rh-details-layout{display:block;margin-top:.72rem}.st-rh-details-main,.st-rh-details-side{gap:.72rem}.st-rh-details-side-primary{display:none}.st-rh-details-head-side{justify-content:space-between;flex-wrap:wrap}.st-rh-fact-grid{grid-template-columns:1fr}.st-rh-info-panel,.st-rh-meta-panel{padding:.76rem .8rem}.st-rh-panel-copy,.st-rh-body-copy{text-indent:0;line-height:1.55}.st-rh-meta-copy,.st-rh-value-copy,.st-rh-distribution-copy,.st-rh-timeout-copy{line-height:1.5}.st-rh-note-box,.st-rh-impact-note{margin-top:.5rem}}@container (min-width: 480px) and (max-width: 680px){.st-rh-fact-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@container (max-width: 380px){.st-rh-summary-mobile-hero .st-rh-result-core-head{gap:.45rem .55rem}.st-rh-summary-mobile-hero .st-rh-result-total{font-size:36px}.st-rh-summary-mobile-hero .st-rh-result-meta-grid{gap:.5rem}.st-rh-summary-mobile-hero .st-rh-result-meta-grid .st-rh-surface-card{gap:.45rem}.st-rh-summary-mobile-hero .st-rh-result-meta-grid .st-rh-fact-value{font-size:14px}}', Ay = '.st-rh-settlement-shell-mobile{overflow:hidden}.st-rh-mobile-shell-summary{display:block}.st-rh-mobile-summary-wrap{display:flex;flex-direction:column;gap:.72rem;padding:.72rem .72rem .8rem}.st-rh-mobile-summary-head{position:relative;display:grid;grid-template-columns:auto minmax(0,1fr);gap:.45rem .7rem;align-items:center;padding:.82rem .84rem .78rem;border:1px solid rgba(179,143,84,.34);background:radial-gradient(circle at top,rgba(247,223,174,.12),transparent 48%),linear-gradient(180deg,#2e2117fa,#100b08fa);box-shadow:inset 0 0 0 1px #ffe8b50a,0 6px 12px #00000047}.st-rh-mobile-summary-head:before{content:"";position:absolute;inset:4px;border:1px solid rgba(198,161,103,.12);pointer-events:none}.st-rh-mobile-summary-crest{position:relative;width:18px;height:18px;transform:rotate(45deg);border:1px solid rgba(213,181,119,.42);background:radial-gradient(circle at center,rgba(245,221,171,.28),transparent 56%),linear-gradient(135deg,#573c20f5,#120c09fc)}.st-rh-mobile-summary-crest:before{content:"";position:absolute;inset:4px;transform:rotate(-45deg);border-radius:50%;background:radial-gradient(circle at center,rgba(240,218,170,.88),rgba(111,80,41,.16) 64%,transparent 68%)}.st-rh-mobile-summary-copy{min-width:0;display:flex;flex-direction:column;gap:.24rem}.st-rh-mobile-summary-kicker{min-width:0;margin:0;padding-bottom:0;border-bottom:none;font-size:10px;letter-spacing:.12em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.st-rh-mobile-summary-title{font-size:16px;line-height:1.38}.st-rh-mobile-summary-id{grid-column:auto;justify-self:end;align-self:start;min-width:0;max-width:140px;min-height:18px;padding:0 4px;border-color:#87693f2e;background:#08060429;color:#e1cca052;font-size:8px;letter-spacing:.04em;opacity:.72}.st-rh-mobile-summary-kicker-wrap{display:flex;flex-direction:row;justify-content:space-between;align-items:center;gap:.3rem .5rem;min-width:0}.st-rh-mobile-summary-kicker-wrap>*{min-width:0}.st-rh-mobile-summary-hero{position:relative}.st-rh-settlement-shell-mobile .st-rh-mobile-summary-hero .st-rh-result-core{margin:0;padding:.82rem .82rem .88rem}.st-rh-settlement-shell-mobile .st-rh-mobile-summary-hero .st-rh-result-core-head{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:.55rem .8rem}.st-rh-settlement-shell-mobile .st-rh-mobile-summary-hero .st-rh-result-core-copy{display:flex;flex-direction:column;gap:.26rem}.st-rh-settlement-shell-mobile .st-rh-mobile-summary-hero .st-rh-score-row{display:flex;flex-wrap:wrap;gap:.42rem;margin-top:0}.st-rh-settlement-shell-mobile .st-rh-mobile-summary-hero .st-rh-result-total{font-size:40px}.st-rh-settlement-shell-mobile .st-rh-mobile-summary-hero .st-rh-status-pill{align-self:center;justify-self:end}.st-rh-settlement-shell-mobile .st-rh-mobile-summary-hero .st-rh-result-visual{margin-top:.72rem;padding:.8rem}.st-rh-settlement-shell-mobile .st-rh-mobile-summary-hero .st-rh-result-meta-grid{margin-top:.72rem;grid-template-columns:repeat(2,minmax(0,1fr));gap:.55rem .8rem}.st-rh-settlement-shell-mobile .st-rh-mobile-summary-hero .st-rh-result-meta-grid .st-rh-surface-card{display:flex;flex-direction:column;align-items:flex-start;justify-content:flex-start;gap:.3rem;min-height:40px;padding:.18rem 0;border:none;border-radius:0;border-top:1px solid rgba(191,153,91,.28);background:transparent;box-shadow:none}.st-rh-settlement-shell-mobile .st-rh-mobile-summary-hero .st-rh-result-meta-grid .st-rh-fact-label{margin-bottom:0;padding-right:0;border-bottom:none;white-space:nowrap}.st-rh-settlement-shell-mobile .st-rh-mobile-summary-hero .st-rh-result-meta-grid .st-rh-fact-value{width:100%;text-align:left;font-size:15px;white-space:nowrap}.st-rh-mobile-summary-scroll{display:flex;flex-direction:column;gap:0;overflow:hidden;padding:0;border:1px solid rgba(170,134,79,.24);border-left:3px solid rgba(191,153,91,.58);background:linear-gradient(180deg,#3f2d1d3d,#110b0833),linear-gradient(135deg,#e3cd9e14,#6040251f),repeating-linear-gradient(0deg,rgba(255,242,214,.03) 0px,rgba(255,242,214,.03) 1px,transparent 1px,transparent 3px);box-shadow:inset 0 0 0 1px #ffecc308,0 4px 10px #00000038}.st-rh-mobile-summary-scroll>*{min-width:0}.st-rh-settlement-shell-mobile .st-rh-mobile-summary-scroll .st-rh-inline-chip{max-width:100%}.st-rh-settlement-shell-mobile .st-rh-mobile-summary-scroll>.st-rh-inline-chip:first-child{display:flex;align-items:center;min-height:36px;padding:.58rem .8rem;border:none!important;border-bottom:1px solid rgba(191,153,91,.18)!important;border-radius:0!important;background:linear-gradient(180deg,#533b226b,#22160e47)!important;color:#d5b880eb!important;box-shadow:inset 0 -1px #00000038!important;font-family:var(--st-rh-font-display);letter-spacing:.06em}.st-rh-settlement-shell-mobile .st-rh-mobile-summary-scroll>.st-rh-inline-chip:first-child .st-rh-chip-icon{color:#d5b880d1}.st-rh-settlement-shell-mobile .st-rh-mobile-summary-scroll .st-rh-summary-chip-outcome{padding:.78rem .8rem .72rem!important;color:var(--st-rh-royal-ink)!important;font-size:15px;line-height:1.62;text-shadow:0 1px 2px rgba(0,0,0,.56)}.st-rh-settlement-shell-mobile .st-rh-mobile-summary-scroll .st-rh-summary-chip-outcome .st-rh-chip-icon{display:none}.st-rh-settlement-shell-mobile .st-rh-mobile-summary-scroll .st-rh-summary-chip-status-summary{display:flex!important;align-self:auto;align-items:center;margin:0 .72rem .72rem;padding:.55rem .72rem;border-radius:999px;border-color:#a7854e57!important;background:linear-gradient(180deg,#322517db,#110b08eb)!important;color:#ecd9b6f0!important;box-shadow:inset 0 0 0 1px #ffecc308,inset 0 0 14px #00000047;line-height:1.45}.st-rh-settlement-shell-mobile .st-rh-mobile-summary-scroll .st-rh-summary-chip-status-summary .st-rh-chip-icon{color:#e0bd78e6}.st-rh-mobile-summary-actions{display:flex}.st-rh-settlement-shell-mobile .st-rh-mobile-summary-actions .st-rh-summary-toggle-state{width:100%;justify-content:center}.st-rh-mobile-details-body{padding:0 .72rem .78rem}.st-rh-details-layout-mobile{display:block;margin-top:.72rem}.st-rh-mobile-details-stack{display:flex;flex-direction:column;gap:.72rem}.st-rh-settlement-shell-mobile .st-rh-details-head{gap:.52rem}.st-rh-settlement-shell-mobile .st-rh-details-head-side{justify-content:space-between}.st-rh-settlement-shell-mobile .st-rh-fact-grid{grid-template-columns:1fr}.st-rh-settlement-shell-mobile .st-rh-info-panel,.st-rh-settlement-shell-mobile .st-rh-meta-panel{padding:.76rem .8rem}.st-rh-settlement-shell-mobile .st-rh-outcome-panel{padding:.76rem .8rem .82rem}.st-rh-settlement-shell-mobile .st-rh-outcome-head{gap:.32rem;margin-bottom:.56rem}.st-rh-settlement-shell-mobile .st-rh-outcome-head-line,.st-rh-settlement-shell-mobile .st-rh-outcome-head-seal{display:none}.st-rh-settlement-shell-mobile .st-rh-outcome-kicker{width:100%;padding-inline:.64rem;font-size:11px;letter-spacing:.1em}.st-rh-settlement-shell-mobile .st-rh-outcome-scroll{padding:.84rem .8rem .82rem}.st-rh-settlement-shell-mobile .st-rh-outcome-copy{font-size:14px;line-height:1.78}.st-rh-settlement-shell-mobile .st-rh-outcome-status-strip{grid-template-columns:minmax(0,1fr);gap:.46rem}.st-rh-settlement-shell-mobile .st-rh-panel-copy,.st-rh-settlement-shell-mobile .st-rh-body-copy{text-indent:0;line-height:1.55}.st-rh-settlement-shell-mobile .st-rh-meta-copy,.st-rh-settlement-shell-mobile .st-rh-value-copy,.st-rh-settlement-shell-mobile .st-rh-distribution-copy,.st-rh-settlement-shell-mobile .st-rh-timeout-copy{line-height:1.5}.st-rh-settlement-shell-mobile .st-rh-note-box,.st-rh-settlement-shell-mobile .st-rh-impact-note{margin-top:.5rem}@media(min-width:480px){.st-rh-settlement-shell-mobile .st-rh-fact-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:380px){.st-rh-mobile-summary-kicker-wrap{flex-wrap:wrap}.st-rh-mobile-summary-id{margin-left:auto;max-width:100%}.st-rh-settlement-shell-mobile .st-rh-mobile-summary-hero .st-rh-result-core-head{gap:.45rem .55rem}.st-rh-settlement-shell-mobile .st-rh-mobile-summary-hero .st-rh-result-total{font-size:36px}.st-rh-settlement-shell-mobile .st-rh-mobile-summary-hero .st-rh-result-meta-grid{gap:.5rem}.st-rh-settlement-shell-mobile .st-rh-mobile-summary-hero .st-rh-result-meta-grid .st-rh-surface-card{gap:.3rem}.st-rh-settlement-shell-mobile .st-rh-mobile-summary-hero .st-rh-result-meta-grid .st-rh-fact-value{font-size:14px}}@media(prefers-reduced-motion:reduce){.st-rh-mobile-summary-wrap,.st-rh-mobile-summary-head,.st-rh-mobile-summary-hero{animation:none;transition:none}}@container (max-width: 380px){.st-rh-mobile-summary-kicker-wrap{flex-wrap:wrap}.st-rh-mobile-summary-id{margin-left:auto;max-width:100%}}', $y = '.st-rh-settlement-shell-result{background:radial-gradient(circle at top,rgba(246,224,179,.1),transparent 34%),linear-gradient(180deg,#2f1f14fa,#0b0806)}.st-rh-settlement-shell-result .st-rh-summary-banner{background:linear-gradient(180deg,#d6b6768c,#57381e8f)}.st-rh-settlement-shell-result .st-rh-summary-banner-inner{background:radial-gradient(circle at top,rgba(253,232,188,.13),transparent 56%),linear-gradient(180deg,#352416fa,#120c09fa)}.st-rh-settlement-shell-result .st-rh-summary-ornament-seal:after,.st-rh-settlement-shell-result .st-rh-details-head-seal:before{background:radial-gradient(circle at center,rgba(246,219,156,.9),rgba(124,73,42,.26) 62%,transparent 70%)}.st-rh-settlement-shell-result .st-rh-summary-judgement{background:radial-gradient(circle at top right,rgba(136,61,47,.18),transparent 40%),linear-gradient(180deg,#322216f0,#100a08fa)}.st-rh-settlement-shell-result .st-rh-summary-outcome-wrap{border-left-color:#ba4e3cb8;background:linear-gradient(180deg,#5734213d,#1a110b29),linear-gradient(135deg,#e0c69614,#623d231f),repeating-linear-gradient(0deg,rgba(255,244,222,.03) 0px,rgba(255,244,222,.03) 1px,transparent 1px,transparent 3px)}.st-rh-summary-dice-slot-result{width:76px;height:76px}.st-rh-settlement-shell-result .st-rh-summary-visual-dais{padding:12px;border-color:#b68f5394;background:radial-gradient(circle at top,rgba(250,227,182,.16),transparent 46%),linear-gradient(180deg,#462d18f5,#0f0a07fc)}.st-rh-settlement-shell-result .st-rh-dice-slot{background:radial-gradient(circle at center,rgba(255,228,166,.14),transparent 44%),linear-gradient(180deg,#130d09fa,#070504)}.st-rh-settlement-shell-result .st-rh-details-layout-result .st-rh-details-main,.st-rh-settlement-shell-result .st-rh-details-layout-result .st-rh-details-side{gap:.78rem}.st-rh-settlement-shell-result:not(.st-rh-settlement-shell-mobile) .st-rh-fact-card{display:flex;flex-direction:column;align-items:flex-start}.st-rh-settlement-shell-result:not(.st-rh-settlement-shell-mobile) .st-rh-fact-label,.st-rh-settlement-shell-result:not(.st-rh-settlement-shell-mobile) .st-rh-fact-value{width:100%;text-align:left}.st-rh-settlement-shell-result:not(.st-rh-settlement-shell-mobile) .st-rh-fact-value{margin:0}.st-rh-settlement-shell-result .st-rh-result-core{background:radial-gradient(circle at top,rgba(249,225,172,.16),transparent 38%),radial-gradient(circle at bottom right,rgba(139,59,45,.16),transparent 32%),linear-gradient(180deg,#3f2918fc,#0c0806);border-color:#ba93546b}.st-rh-settlement-shell-result .st-rh-result-core-head{align-items:center}.st-rh-settlement-shell-result .st-rh-result-core-copy{position:relative;padding-right:10px}.st-rh-settlement-shell-result .st-rh-result-core-copy:after{content:"";position:absolute;top:6px;right:0;bottom:6px;width:1px;background:linear-gradient(180deg,transparent,rgba(214,181,119,.42),transparent)}.st-rh-settlement-shell-result .st-rh-kicker-compact{margin-bottom:0;color:#dfc592d6;font-size:10px;letter-spacing:.14em}.st-rh-settlement-shell-result .st-rh-details-head-copy>.st-rh-kicker{margin-left:0;color:#dec490db;font-size:11px;letter-spacing:.14em}.st-rh-settlement-shell-result .st-rh-details-heading{margin-top:.24rem;font-size:16px;line-height:1.34}.st-rh-settlement-shell-result .st-rh-mini-kicker{color:#d8bd89e0;font-size:10px;letter-spacing:.12em;border-bottom-color:#ba945829}.st-rh-settlement-shell-result .st-rh-score-row{gap:.55rem;padding-bottom:.58rem}.st-rh-settlement-shell-result .st-rh-result-total{font-size:34px;color:var(--st-rh-royal-title);text-shadow:0 3px 8px rgba(0,0,0,.92),0 0 16px rgba(242,212,143,.15)}.st-rh-settlement-shell-result .st-rh-result-total-label{color:#e5cda1eb}.st-rh-settlement-shell-result .st-rh-result-visual{padding:.9rem;border-color:#b8915457;background:radial-gradient(circle at center,rgba(255,232,179,.12),transparent 42%),linear-gradient(180deg,#0a0806,#1a110bfa)}.st-rh-settlement-shell-result .st-rh-result-meta-grid .st-rh-surface-card{background:radial-gradient(circle at top left,rgba(249,227,183,.06),transparent 34%),linear-gradient(180deg,#342417d6,#110b08f0)}.st-rh-settlement-shell-result .st-rh-meta-panel .st-rh-surface-card,.st-rh-settlement-shell-result .st-rh-info-panel .st-rh-surface-card{border-left-color:#bd9557a8}.st-rh-settlement-shell-result .st-rh-info-panel{background:radial-gradient(circle at top,rgba(247,223,169,.09),transparent 36%),linear-gradient(180deg,#362518f5,#100b08fa)}.st-rh-settlement-shell-result .st-rh-impact-note{border-color:#a34030eb;background:radial-gradient(circle at center,#7d251a38,#0000008c),linear-gradient(180deg,#451c16ad,#120a08d1);color:#f0c3bc}.st-rh-settlement-shell-result .st-rh-note-box{border-color:#bc975966;background:linear-gradient(180deg,#2c1e14c2,#0c0806e0)}.st-rh-settlement-shell-result .st-rh-status-pill{background:linear-gradient(180deg,color-mix(in srgb,var(--st-rh-status-color, #d8aa58) 22%,rgba(103,61,34,.94)),#110b08fa)!important;box-shadow:inset 0 0 0 1px #ffe8b60d,inset 0 -12px 14px #0000003d,0 0 12px color-mix(in srgb,var(--st-rh-status-color, #d8aa58) 18%,transparent)}@media(min-width:640px){.st-rh-settlement-shell-result:not(.st-rh-settlement-shell-mobile) .st-rh-fact-grid{grid-template-columns:repeat(3,minmax(0,1fr))}.st-rh-summary-dice-slot-result{width:88px;height:88px}.st-rh-settlement-shell-result .st-rh-result-total{font-size:42px}}@media(min-width:860px){.st-rh-details-layout-result{grid-template-columns:minmax(0,1fr) minmax(300px,.72fr)}}@media(max-width:859px){.st-rh-settlement-shell-result .st-rh-result-core-copy:after{display:none}}@media(max-width:520px){.st-rh-summary-dice-slot-result{width:72px;height:72px}.st-rh-settlement-shell-result .st-rh-result-total{font-size:32px}}@container (min-width: 640px){.st-rh-settlement-shell-result:not(.st-rh-settlement-shell-mobile) .st-rh-fact-grid{grid-template-columns:repeat(3,minmax(0,1fr))}.st-rh-summary-dice-slot-result{width:88px;height:88px}.st-rh-settlement-shell-result .st-rh-result-total{font-size:42px}}@container (min-width: 860px){.st-rh-details-layout-result{grid-template-columns:minmax(0,1fr) minmax(300px,.72fr)}}@container (max-width: 859px){.st-rh-settlement-shell-result .st-rh-result-core-copy:after{display:none}}@container (max-width: 680px){.st-rh-settlement-shell-result .st-rh-summary-mobile-hero .st-rh-result-core{background:radial-gradient(circle at top,rgba(249,225,172,.18),transparent 36%),radial-gradient(circle at bottom right,rgba(139,59,45,.18),transparent 32%),linear-gradient(180deg,#3f2918fc,#0c0806)}.st-rh-settlement-shell-result .st-rh-summary-mobile-hero .st-rh-result-total{font-size:42px}.st-rh-settlement-shell-result .st-rh-summary-mobile-hero .st-rh-result-visual{background:radial-gradient(circle at center,rgba(255,232,179,.14),transparent 42%),linear-gradient(180deg,#0a0806,#1a110bfa)}}@container (max-width: 520px){.st-rh-summary-dice-slot-result{width:72px;height:72px}.st-rh-settlement-shell-result .st-rh-result-total{font-size:32px}}', Ry = '.st-rh-settlement-shell-result.st-rh-settlement-shell-mobile .st-rh-mobile-summary-head{background:radial-gradient(circle at top,rgba(248,225,181,.14),transparent 48%),linear-gradient(180deg,#372517fa,#120c09fc)}.st-rh-settlement-shell-result.st-rh-settlement-shell-mobile .st-rh-mobile-summary-kicker-wrap{flex-wrap:nowrap;align-items:center}.st-rh-settlement-shell-result.st-rh-settlement-shell-mobile .st-rh-mobile-summary-kicker{flex:1 1 auto;font-size:10px}.st-rh-settlement-shell-result.st-rh-settlement-shell-mobile .st-rh-mobile-summary-id{flex:0 0 auto;margin-left:auto;max-width:132px;white-space:nowrap}.st-rh-settlement-shell-result.st-rh-settlement-shell-mobile .st-rh-mobile-summary-scroll{border-left-color:#ba4e3cb3}details.st-rh-settlement-shell-result.st-rh-settlement-shell-mobile[open] .st-rh-mobile-summary-wrap{gap:.46rem;padding-bottom:.58rem}details.st-rh-settlement-shell-result.st-rh-settlement-shell-mobile[open] .st-rh-mobile-summary-hero,details.st-rh-settlement-shell-result.st-rh-settlement-shell-mobile[open] .st-rh-mobile-summary-scroll{display:none}details.st-rh-settlement-shell-result.st-rh-settlement-shell-mobile[open] .st-rh-mobile-summary-actions{margin-top:.04rem}.st-rh-settlement-shell-result.st-rh-settlement-shell-mobile .st-rh-mobile-summary-hero .st-rh-result-core{background:radial-gradient(circle at top,rgba(249,225,172,.18),transparent 36%),radial-gradient(circle at bottom right,rgba(139,59,45,.18),transparent 32%),linear-gradient(180deg,#3f2918fc,#0c0806)}.st-rh-settlement-shell-result.st-rh-settlement-shell-mobile .st-rh-mobile-summary-hero .st-rh-result-core-head{display:flex;align-items:center;justify-content:space-between;gap:.72rem;padding:.5rem .7rem .56rem;border:1px solid rgba(188,149,87,.34);background:linear-gradient(90deg,rgba(88,56,30,.34),transparent 32%),linear-gradient(180deg,#4e331c66,#1a110b29);box-shadow:inset 0 0 0 1px #ffe9bd0a,inset 0 -10px 14px #0003}.st-rh-settlement-shell-result.st-rh-settlement-shell-mobile .st-rh-mobile-summary-hero .st-rh-result-core-copy{display:flex;align-items:flex-end;gap:.62rem;min-width:0}.st-rh-settlement-shell-result.st-rh-settlement-shell-mobile .st-rh-mobile-summary-hero .st-rh-kicker-compact{flex:0 0 auto;margin:0;padding:.18rem .46rem .16rem;border:1px solid rgba(194,158,98,.38);background:linear-gradient(180deg,#5e43259e,#291b11c7);color:#e5d0aae0;font-size:10px;letter-spacing:.14em;white-space:nowrap;box-shadow:inset 0 1px #ffe9bd14}.st-rh-settlement-shell-result.st-rh-settlement-shell-mobile .st-rh-mobile-summary-hero .st-rh-kicker-compact:before{content:"◆";margin-right:.28rem;color:#e5bf7bcc;font-size:.8em}.st-rh-settlement-shell-result.st-rh-settlement-shell-mobile .st-rh-mobile-summary-hero .st-rh-result-total{font-size:38px;line-height:.92}.st-rh-settlement-shell-result.st-rh-settlement-shell-mobile .st-rh-mobile-summary-hero .st-rh-result-visual{background:radial-gradient(circle at center,rgba(255,232,179,.14),transparent 42%),linear-gradient(180deg,#0a0806,#1a110bfa)}.st-rh-settlement-shell-result.st-rh-settlement-shell-mobile .st-rh-mobile-summary-hero .st-rh-score-row{flex:1 1 auto;flex-wrap:nowrap;align-items:baseline;gap:.34rem;min-width:0;padding:0;border-bottom:none;white-space:nowrap}.st-rh-settlement-shell-result.st-rh-settlement-shell-mobile .st-rh-mobile-summary-hero .st-rh-result-total-label{color:#e7d1a8e6;font-size:12px;letter-spacing:.12em;white-space:nowrap}.st-rh-settlement-shell-result.st-rh-settlement-shell-mobile .st-rh-mobile-summary-hero .st-rh-status-pill{flex:0 0 auto;min-height:30px;padding:.22rem .72rem;font-size:11px;letter-spacing:.12em;white-space:nowrap}.st-rh-settlement-shell-result.st-rh-settlement-shell-mobile .st-rh-info-panel .st-rh-kicker,.st-rh-settlement-shell-result.st-rh-settlement-shell-mobile .st-rh-details-head-copy>.st-rh-kicker{margin:0;color:#dec490db;font-size:12px;letter-spacing:.12em}.st-rh-settlement-shell-result.st-rh-settlement-shell-mobile .st-rh-mini-kicker{color:#d8bd89e0;font-size:10px;letter-spacing:.12em;border-bottom-color:#ba945829}.st-rh-settlement-shell-result.st-rh-settlement-shell-mobile .st-rh-fact-card{display:flex;flex-direction:column;align-items:flex-start}.st-rh-settlement-shell-result.st-rh-settlement-shell-mobile .st-rh-fact-label,.st-rh-settlement-shell-result.st-rh-settlement-shell-mobile .st-rh-fact-value{width:100%;margin:0;text-align:left}.st-rh-settlement-shell-result.st-rh-settlement-shell-mobile .st-rh-fact-label{margin-bottom:.2rem}@media(max-width:380px){.st-rh-settlement-shell-result.st-rh-settlement-shell-mobile .st-rh-mobile-summary-kicker-wrap{flex-wrap:nowrap}.st-rh-settlement-shell-result.st-rh-settlement-shell-mobile .st-rh-mobile-summary-id{max-width:112px}.st-rh-settlement-shell-result.st-rh-settlement-shell-mobile .st-rh-mobile-summary-hero .st-rh-result-core-head{gap:.5rem;padding-inline:.56rem}.st-rh-settlement-shell-result.st-rh-settlement-shell-mobile .st-rh-mobile-summary-hero .st-rh-result-core-copy{gap:.42rem}.st-rh-settlement-shell-result.st-rh-settlement-shell-mobile .st-rh-info-panel .st-rh-kicker,.st-rh-settlement-shell-result.st-rh-settlement-shell-mobile .st-rh-details-head-copy>.st-rh-kicker{font-size:11px}.st-rh-settlement-shell-result.st-rh-settlement-shell-mobile .st-rh-mobile-summary-hero .st-rh-kicker-compact{padding-inline:.38rem}.st-rh-settlement-shell-result.st-rh-settlement-shell-mobile .st-rh-mobile-summary-hero .st-rh-result-total{font-size:34px}.st-rh-settlement-shell-result.st-rh-settlement-shell-mobile .st-rh-mobile-summary-hero .st-rh-result-total-label{font-size:11px}.st-rh-settlement-shell-result.st-rh-settlement-shell-mobile .st-rh-mobile-summary-hero .st-rh-status-pill{padding-inline:.58rem;font-size:10px}.st-rh-settlement-shell-result.st-rh-settlement-shell-mobile .st-rh-mini-kicker{font-size:9px}}@container (max-width: 380px){.st-rh-settlement-shell-result.st-rh-settlement-shell-mobile .st-rh-mobile-summary-kicker-wrap{flex-wrap:nowrap}.st-rh-settlement-shell-result.st-rh-settlement-shell-mobile .st-rh-mobile-summary-id{max-width:112px}.st-rh-settlement-shell-result.st-rh-settlement-shell-mobile .st-rh-mobile-summary-hero .st-rh-result-core-head{gap:.5rem;padding-inline:.56rem}.st-rh-settlement-shell-result.st-rh-settlement-shell-mobile .st-rh-mobile-summary-hero .st-rh-result-core-copy{gap:.42rem}.st-rh-settlement-shell-result.st-rh-settlement-shell-mobile .st-rh-info-panel .st-rh-kicker,.st-rh-settlement-shell-result.st-rh-settlement-shell-mobile .st-rh-details-head-copy>.st-rh-kicker{font-size:11px}.st-rh-settlement-shell-result.st-rh-settlement-shell-mobile .st-rh-mobile-summary-hero .st-rh-kicker-compact{padding-inline:.38rem}.st-rh-settlement-shell-result.st-rh-settlement-shell-mobile .st-rh-mobile-summary-hero .st-rh-result-total{font-size:34px}.st-rh-settlement-shell-result.st-rh-settlement-shell-mobile .st-rh-mobile-summary-hero .st-rh-result-total-label{font-size:11px}.st-rh-settlement-shell-result.st-rh-settlement-shell-mobile .st-rh-mobile-summary-hero .st-rh-status-pill{padding-inline:.58rem;font-size:10px}.st-rh-settlement-shell-result.st-rh-settlement-shell-mobile .st-rh-mini-kicker{font-size:9px}}', Cy = `<div class="st-rh-card-scope">\r
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
`, Dy = `<div class="st-rh-card-scope">\r
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
`, Ny = `<li class="st-rh-event-item">\r
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
`, Ly = `<li class="st-rh-event-item st-rh-event-item-mobile">\r
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
`, My = `<div class="st-rh-card-scope">\r
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
`, Oy = `<div class="st-rh-card-scope">\r
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
`, bu = "st-rh-event-card-styles-v1", Py = "st-rh-event-card-external-style-v1", vu = "custom-", By = /\.(?=[A-Za-z_\\])((?:\\.|[A-Za-z0-9_%@/\-[\]:])+)/g, Uy = [
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
], Hy = `@font-face {
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
function zy(t) {
  return t.replace(By, (e, r) => r.startsWith(vu) ? e : `.${vu}${r}`);
}
const xu = [
  Ey,
  _y,
  Ty,
  ky,
  wy,
  Iy,
  Ay,
  $y,
  Ry
].join(`
`), Gy = `${Hy}
${xu}
${zy(xu)}`;
function Ky() {
  return Gy;
}
function jy(t = document) {
  t?.head && Uy.forEach((e, r) => {
    const n = `${Py}-${r}`, o = t.getElementById(n);
    if (o) {
      o.href !== e && (o.href = e);
      return;
    }
    const i = t.createElement("link");
    i.id = n, i.rel = "stylesheet", i.href = e, t.head.appendChild(i);
  });
}
function Nl(t = document) {
  if (!t?.head) return;
  jy(t);
  const e = Ky(), r = t.getElementById(bu);
  if (r) {
    r.textContent !== e && (r.textContent = e);
    return;
  }
  const n = t.createElement("style");
  n.id = bu, n.textContent = e, t.head.appendChild(n), qy(t);
}
const yu = "st-rh-details-anim-script-v1";
function qy(t) {
  if (t.getElementById(yu)) return;
  const e = t.createElement("script");
  e.id = yu, e.textContent = `
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
`, t.head.appendChild(e);
}
function ci(t, e) {
  return `${t}-${e}`;
}
function ui(t, e, r) {
  return t.replace(
    /<details\b/,
    `<details data-st-rh-sync-key="${e}" data-st-rh-template-variant="${r}"`
  );
}
function Gh(t, e, r) {
  return `<div class="st-rh-card-switch ${t}">
    <div class="st-rh-card-variant st-rh-card-variant-desktop" data-st-rh-template-variant="desktop">${e}</div>
    <div class="st-rh-card-variant st-rh-card-variant-mobile" data-st-rh-template-variant="mobile">${r}</div>
  </div>`;
}
function Fy(t, e) {
  return `<div class="st-rh-rolled-block">
  ${t} 已结算：${e}
</div>`;
}
function Vy(t) {
  return t ? "<span style='color:#ff4d4f;font-weight:bold;'>[超时]</span>" : "<span style='color:#52c41a;font-weight:bold;'>[已掷]</span>";
}
function Ht(t, e) {
  return `<span class="st-rh-tip-label" data-tip="${e}">${t}</span>`;
}
function di() {
  return `<span class="st-rh-summary-toggle-state" data-st-rh-role="toggle-state" aria-hidden="true">
            <span class="st-rh-toggle-closed"><i class="fa-solid fa-chevron-down fa-fw st-rh-fa-icon" style="margin-right:4px;"></i>展开详情</span>
            <span class="st-rh-toggle-open"><i class="fa-solid fa-chevron-up fa-fw st-rh-fa-icon" style="margin-right:4px;"></i>收起详情</span>
          </span>`.replace('class="st-rh-toggle-closed"', 'class="st-rh-toggle-closed" data-st-rh-role="toggle-closed"').replace('class="st-rh-toggle-open"', 'class="st-rh-toggle-open" data-st-rh-role="toggle-open"');
}
function Yy(t) {
  const e = t.buttonStateStyle ? ` style="${t.buttonStateStyle}"` : "";
  return `<button type="button" class="st-rh-roll-btn" data-dice-event-roll="1" data-round-id="${t.roundIdAttr}"
  data-dice-event-id="${t.eventIdAttr}" data-dice-expr="${t.diceExprAttr}" ${t.buttonDisabledAttr}${e}>
  <i class="fa-solid fa-dice-d20 fa-fw st-rh-fa-icon" aria-hidden="true" style="margin-right:6px; opacity:0.9;"></i>执行检定
</button>`;
}
function Wy(t) {
  const e = t.templateVariant ?? "desktop", r = ci(t.detailsIdAttr, e), n = e === "mobile" ? Ly : Ny, o = t.modifierTextHtml ? `<span class="st-rh-chip"><i class="fa-solid fa-calculator fa-fw st-rh-fa-icon st-rh-fact-label-icon" aria-hidden="true" style="margin-right: 6px; font-size: 0.85rem; color: #d8b87a; opacity: 0.9;"></i>${Ht("修正：", "总修正 = 基础修正 + 技能修正 + 状态修正。")} <span class="st-rh-chip-highlight">${t.modifierTextHtml}</span></span>` : "", i = t.rollButtonHtml ? t.rollButtonHtml : '<span class="st-rh-summary-lock st-rh-mono"><i class="fa-solid fa-lock fa-fw st-rh-fa-icon" style="margin-right:6px;"></i>已锁定</span>', c = t.dcReasonHtml ? `<div class="st-rh-dc-reason">${t.dcReasonHtml}</div>` : "", d = Fn(n, {
    title_html: t.titleHtml,
    roll_mode_badge_html: t.rollModeBadgeHtml,
    event_id_html: t.eventIdHtml,
    collapsed_check_html: t.collapsedCheckHtml,
    time_limit_html: t.timeLimitHtml,
    round_id_attr: t.roundIdAttr,
    event_id_attr: t.eventIdAttr,
    deadline_attr: t.deadlineAttr,
    runtime_style_attr: t.runtimeStyleAttr,
    collapsed_runtime_html: t.runtimeTextHtml || t.collapsedRuntimeHtml,
    roll_action_html: i,
    summary_toggle_state_html: di(),
    details_id_attr: r,
    desc_html: t.descHtml,
    outcome_preview_html: t.outcomePreviewHtml,
    tip_label_target_html: Ht("对象", "本次事件影响的叙事对象。"),
    target_html: t.targetHtml,
    tip_label_skill_html: Ht("技能", "参与检定并提供修正的技能项。"),
    skill_title_attr: t.skillTitleAttr,
    skill_html: t.skillHtml,
    tip_label_advantage_html: Ht("掷骰模式", "普通、优势、劣势会影响最终检定结果。"),
    advantage_state_html: t.advantageStateHtml,
    tip_label_dice_html: Ht("骰式", "本次检定使用的骰子表达式。"),
    check_dice_html: t.checkDiceHtml,
    tip_label_condition_html: Ht("条件", "将掷骰总值与 DC 按比较符进行判定。"),
    compare_html: t.compareHtml,
    dc_text: t.dcText,
    tip_label_time_html: Ht("时限", "超时未检定时，系统会按对应规则自动处理。"),
    modifier_badge_html: o,
    dc_reason_html: c,
    rolled_block_html: t.rolledBlockHtml,
    command_text_html: t.commandTextHtml
  });
  return ui(d, t.detailsIdAttr, e);
}
function Xy(t, e, r = e) {
  const n = Fn(Cy, {
    round_id_html: t,
    items_html: e
  }), o = Fn(Dy, {
    round_id_html: t,
    items_html: r
  });
  return Gh("st-rh-card-switch-event-board", n, o);
}
function Rr(...t) {
  return t.filter(Boolean).join(" ");
}
function Fn(t, e) {
  return t.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (r, n) => e[n] ?? "");
}
function Su(t, e, r, n) {
  if (!String(t ?? "").trim()) return "";
  const o = n ? ` data-tip="${n}"` : "";
  return `<span class="${Rr(
    "st-rh-status-pill st-rh-inline-chip st-rh-status-badge",
    r
  )}" style="--st-rh-status-color:${e};"${o}>${t}</span>`;
}
function Ua(t, e) {
  if (!String(t ?? "").trim()) return "";
  const r = e?.tipAttr ? ` data-tip="${e.tipAttr}"` : "", n = e?.iconClass ? `<i class="${e.iconClass} fa-fw st-rh-chip-icon" aria-hidden="true"></i>` : "";
  return `<span class="${Rr(
    e?.strong ? "st-rh-chip-strong st-rh-inline-chip st-rh-inline-chip-gap" : "st-rh-chip-soft st-rh-inline-chip st-rh-inline-chip-gap",
    e?.classes
  )}"${r}>${n}${t}</span>`;
}
function Eu(t, e, r, n, o) {
  if (!String(t ?? "").trim()) return "";
  const i = Rr(
    "st-rh-chip-soft st-rh-inline-chip st-rh-inline-chip-gap st-rh-inline-chip-fluid",
    r,
    n
  ), c = o ? `<i class="${o} fa-fw st-rh-chip-icon" aria-hidden="true"></i>` : "";
  return `<span class="${i}">${c}${t}</span>`;
}
function Ke(t, e, r) {
  return String(e ?? "").trim() ? `<div class="st-rh-fact-card st-rh-surface-card">
    <dt class="st-rh-fact-label">${t}</dt>
    <dd class="${Rr("st-rh-fact-value", r?.valueClasses)}">${e}</dd>
  </div>` : "";
}
function Jy(t, e, r) {
  return String(e ?? "").trim() ? `<div class="${Rr(
    "st-rh-panel st-rh-info-panel",
    r
  )}">
    <p class="st-rh-kicker">${t}</p>
    <div class="st-rh-detail-note st-rh-panel-copy">${e}</div>
  </div>` : "";
}
function Ha(t, e, r) {
  return String(e ?? "").trim() ? `<div class="${Rr("st-rh-outcome-strip-item", r)}">
    <span class="st-rh-outcome-strip-label">${t}</span>
    <span class="st-rh-outcome-strip-value">${e}</span>
  </div>` : "";
}
function Qy(t) {
  if (!String(t.outcomeTextHtml ?? "").trim()) return "";
  const e = String(t.currentStatusesHtml ?? "").trim(), r = [
    Ha("判定影响", t.statusImpactHtml),
    Ha("状态变化", t.outcomeStatusSummaryHtml),
    Ha(
      "当前状态",
      t.currentStatusesHtml,
      e === "无" ? "st-rh-outcome-strip-item-muted" : ""
    )
  ].filter(Boolean).join("");
  return `<section class="${Rr(
    "st-rh-panel st-rh-info-panel st-rh-outcome-panel",
    t.toneClassName
  )}">
    <div class="st-rh-outcome-head">
      <span class="st-rh-outcome-head-line" aria-hidden="true"></span>
      <span class="st-rh-outcome-head-seal" aria-hidden="true"></span>
      <p class="st-rh-kicker st-rh-outcome-kicker">${t.kickerText}</p>
      <span class="st-rh-outcome-head-seal" aria-hidden="true"></span>
      <span class="st-rh-outcome-head-line" aria-hidden="true"></span>
    </div>
    <div class="st-rh-outcome-scroll">
      <div class="st-rh-outcome-copy">${t.outcomeTextHtml}</div>
    </div>
    ${r ? `<div class="st-rh-outcome-status-strip">${r}</div>` : ""}
  </section>`;
}
function _u(t, e) {
  return String(t ?? "").trim() ? t : `<span class="st-rh-summary-visual-fallback">${e}</span>`;
}
function Tu(t) {
  const e = String(t.diceVisualBlockHtml ?? "").trim() ? t.diceVisualBlockHtml : `<div class="st-rh-empty-visual">${t.emptyVisualHint}</div>`;
  return `<div class="st-rh-panel st-rh-result-core">
    ${t.showVisual === !1 ? "" : `<div class="st-rh-result-visual">
      ${e}
    </div>`}
    <div class="st-rh-result-meta-grid">
      ${Ke(
    Ht("条件", "将总值与 DC 按比较符进行结算判定。"),
    `<span class="st-rh-mono st-rh-fact-value-mono">${t.compareHtml} ${t.dcText}</span>`,
    { valueClasses: "st-rh-fact-value-mono" }
  )}
      ${Ke(
    Ht("时限", "事件超时后，系统会按对应规则自动处理。"),
    t.timeLimitHtml
  )}
    </div>
  </div>`;
}
function Zy(t, e) {
  return `<span class="st-rh-mono st-rh-title-text">[${t}]</span>
    <span class="st-rh-inline-divider">•</span>
    <span class="st-rh-meta-text">修正：</span>
    <span class="st-rh-mono st-rh-emphasis-text">${e}</span>`;
}
function tS(t) {
  const e = Su(
    t.collapsedStatusHtml,
    t.statusColor,
    void 0,
    "本次结算的最终判定结果。"
  ), r = Su(t.statusText, t.statusColor), n = [
    Ua(
      `总点 <span class="st-rh-mono st-rh-title-text">${t.collapsedTotalHtml}</span>`,
      {
        strong: !0,
        iconClass: "fa-solid fa-dice-d20",
        tipAttr: "最终总点数，通常由骰面结果与各类修正共同组成。"
      }
    ),
    Ua(`<span class="st-rh-mono">${t.collapsedConditionHtml}</span>`, {
      iconClass: "fa-solid fa-bullseye",
      tipAttr: "结算时用于比较总点与 DC 的判定条件。"
    })
  ].filter(Boolean).join(""), o = [
    Ua(t.collapsedSourceHtml, { iconClass: "fa-solid fa-user-pen" }),
    Eu(
      t.collapsedOutcomeHtml,
      t.collapsedOutcomeTitleAttr,
      t.collapsedOutcomeChipClassName || "st-rh-summary-chip-outcome",
      "",
      "fa-solid fa-scroll"
    ),
    Eu(
      t.collapsedStatusSummaryHtml,
      t.collapsedStatusSummaryTitleAttr,
      t.collapsedStatusSummaryChipClassName || "st-rh-summary-chip-status-summary",
      "",
      "fa-solid fa-bolt-lightning"
    )
  ].filter(Boolean).join(""), i = [
    Ke(
      Ht("事件 ID", "事件唯一标识。"),
      `<span class="st-rh-mono st-rh-title-text">${t.eventIdHtml}</span>`,
      { valueClasses: "st-rh-fact-value-mono" }
    ),
    Ke(
      Ht("来源", "该次结算由谁触发：AI 自动、玩家手动或超时系统结算。"),
      t.sourceHtml
    ),
    Ke(
      Ht("对象", "本次事件影响的叙事对象。"),
      t.targetHtml,
      { valueClasses: "st-rh-fact-value-accent" }
    ),
    Ke(
      Ht("技能", "参与检定并提供修正的技能项。"),
      `<span data-tip="${t.skillTitleAttr}">${t.skillHtml}</span>`
    ),
    Ke(
      Ht("掷骰模式", "普通、优势、劣势会影响最终检定结果。"),
      t.advantageStateHtml
    ),
    Ke(
      Ht("骰式", "本次检定使用的骰子表达式。"),
      `${t.diceExprHtml}${t.diceModifierHintHtml ? `<div class="st-rh-subhint st-rh-emphasis-text">${t.diceModifierHintHtml}</div>` : ""}`,
      { valueClasses: "st-rh-fact-value-mono st-rh-title-text" }
    )
  ].filter(Boolean).join(""), c = Qy({
    kickerText: t.outcomeLabelHtml,
    toneClassName: t.outcomeToneClassName,
    outcomeTextHtml: t.outcomeTextHtml,
    statusImpactHtml: t.statusImpactHtml,
    outcomeStatusSummaryHtml: t.outcomeStatusSummaryHtml,
    currentStatusesHtml: t.currentStatusesHtml
  }), d = Tu({
    totalText: t.totalText,
    statusText: t.statusText,
    statusColor: t.statusColor,
    compareHtml: t.compareHtml,
    dcText: t.dcText,
    diceVisualBlockHtml: t.diceVisualBlockHtml,
    timeLimitHtml: t.timeLimitHtml,
    emptyVisualHint: "本次结算未生成骰面可视化。",
    showVisual: !1
  }), h = Tu({
    totalText: t.totalText,
    statusText: t.statusText,
    statusColor: t.statusColor,
    compareHtml: t.compareHtml,
    dcText: t.dcText,
    diceVisualBlockHtml: t.diceVisualBlockHtml,
    timeLimitHtml: t.timeLimitHtml,
    emptyVisualHint: "本次结算未生成骰面可视化。"
  }), f = [
    Jy(
      "判定拆解",
      `<div class="st-rh-stack-md">
         <div>
           <div class="st-rh-mini-kicker">${Ht("掷骰结果", "原始骰面与最终修正后的结果。")}</div>
           <div class="st-rh-value-copy st-rh-title-text">${t.rollsSummaryHtml}</div>
         </div>
         <div>
           <div class="st-rh-mini-kicker">${Ht("爆骰", "是否请求爆骰，以及是否真实触发连爆或被策略降级。")}</div>
           <div class="st-rh-value-copy">${t.explodeInfoHtml}</div>
         </div>
         ${t.modifierBreakdownHtml ? `<div>
                  <div class="st-rh-mini-kicker">${Ht("修正", "总修正 = 基础修正 + 技能修正 + 状态修正。")}</div>
                  <div class="st-rh-value-copy st-rh-emphasis-text">${t.modifierBreakdownHtml}</div>
                </div>` : ""}
         ${t.dcReasonHtml ? `<div class="st-rh-note-box"><strong>DC 说明：</strong>${t.dcReasonHtml}</div>` : ""}
       </div>`
    )
  ].filter(Boolean).join(""), b = ui(
    Fn(My, {
      shell_type_class: "st-rh-settlement-shell-result",
      dice_slot_type_class: "st-rh-summary-dice-slot-result",
      details_layout_type_class: "st-rh-details-layout-result",
      summary_kicker_text: "检定结果",
      title_html: t.titleHtml,
      roll_id_html: t.rollIdHtml,
      summary_status_badge_html: e,
      summary_primary_chips_html: n,
      summary_secondary_chips_html: o,
      summary_dice_visual_html: _u(t.collapsedDiceVisualHtml, "ROLL"),
      summary_toggle_html: di(),
      details_id_attr: ci(t.detailsIdAttr, "desktop"),
      details_kicker_text: "结果档案",
      details_heading_html: t.titleHtml,
      details_status_badge_html: r,
      detail_meta_html: i,
      outcome_section_html: c,
      footer_blocks_html: "",
      summary_result_core_html: d,
      detail_result_core_html: h,
      detail_aux_html: f
    }),
    t.detailsIdAttr,
    "desktop"
  ), v = ui(
    Fn(Oy, {
      shell_type_class: "st-rh-settlement-shell-result",
      dice_slot_type_class: "st-rh-summary-dice-slot-result",
      details_layout_type_class: "st-rh-details-layout-result",
      summary_kicker_text: "检定结果",
      title_html: t.titleHtml,
      roll_id_html: t.rollIdHtml,
      summary_status_badge_html: e,
      summary_primary_chips_html: n,
      summary_secondary_chips_html: o,
      summary_dice_visual_html: _u(t.collapsedDiceVisualHtml, "ROLL"),
      summary_toggle_html: di(),
      details_id_attr: ci(t.detailsIdAttr, "mobile"),
      details_kicker_text: "结果档案",
      details_heading_html: t.titleHtml,
      details_status_badge_html: r,
      detail_meta_html: i,
      outcome_section_html: c,
      footer_blocks_html: "",
      summary_result_core_html: d,
      detail_result_core_html: h,
      detail_aux_html: f
    }),
    t.detailsIdAttr,
    "mobile"
  );
  return Gh("st-rh-card-switch-settlement st-rh-card-switch-result", b, v);
}
function ku(t) {
  const e = Math.max(0, Math.ceil(t / 1e3)), r = Math.floor(e / 3600), n = Math.floor(e % 3600 / 60), o = e % 60;
  return r > 0 ? `${String(r).padStart(2, "0")}:${String(n).padStart(2, "0")}:${String(o).padStart(2, "0")}` : `${String(n).padStart(2, "0")}:${String(o).padStart(2, "0")}`;
}
function eS(t, e, r, n = Date.now()) {
  const o = r.getSettingsEvent(), i = r.getLatestRollRecordForEvent(t, e.id);
  if (i)
    return i.source === "timeout_auto_fail" ? { text: "已超时失败", tone: "danger", locked: !0 } : i.success === !1 ? { text: "已结算(失败)", tone: "danger", locked: !0 } : { text: "已结算", tone: "success", locked: !0 };
  if (!o.enableTimeLimit)
    return { text: "时限关闭", tone: "neutral", locked: !1 };
  r.ensureRoundEventTimersSyncedEvent(t);
  const c = t.eventTimers[e.id];
  if (!c || c.deadlineAt == null)
    return { text: "不限时", tone: "neutral", locked: !1 };
  const d = c.deadlineAt - n;
  return d <= 0 ? { text: "已超时", tone: "danger", locked: !0 } : d <= 1e4 ? { text: `剩余 ${ku(d)}`, tone: "warn", locked: !1 } : { text: `剩余 ${ku(d)}`, tone: "neutral", locked: !1 };
}
function Kh(t) {
  switch (t) {
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
function jh(t, e, r, n, o) {
  const i = [], c = String(t ?? "").trim(), d = Number.isFinite(e) && e !== 0;
  return r && c && i.push(`<span class="st-rh-dc-note-copy">${n(c)}</span>`), d && i.push(
    `<span class="st-rh-inline-chip st-rh-chip-strong st-rh-dc-modifier-chip"><span class="st-rh-dc-modifier-label">DC修正</span><span class="st-rh-dc-modifier-value">${n(o(e))}</span></span>`
  ), i.length === 0 ? "" : `<span class="st-rh-dc-note-stack">${i.join("")}</span>`;
}
function rS(t, e, r) {
  const n = Array.from(
    document.querySelectorAll("button[data-dice-event-roll='1']")
  );
  for (const o of n) {
    const i = o.getAttribute("data-round-id") || "", c = o.getAttribute("data-dice-event-id") || "";
    i !== t || c !== e || (o.disabled = r, o.style.display = r ? "none" : "inline-block", o.style.opacity = r ? "0.5" : "1", o.style.cursor = r ? "not-allowed" : "pointer", o.style.filter = r ? "grayscale(0.35)" : "");
  }
}
function nS(t) {
  const e = Array.from(
    document.querySelectorAll("[data-dice-countdown='1']")
  ), r = Array.from(
    document.querySelectorAll("button[data-dice-event-roll='1']")
  );
  if (e.length === 0 && r.length === 0) return;
  const o = t.getDiceMetaEvent().pendingRound;
  if (!o || o.status !== "open") {
    for (const c of r)
      c.disabled = !0, c.style.display = "none", c.style.opacity = "0.5", c.style.cursor = "not-allowed", c.style.filter = "grayscale(0.35)";
    return;
  }
  t.ensureRoundEventTimersSyncedEvent(o);
  const i = Date.now();
  for (const c of e) {
    const d = c.getAttribute("data-round-id") || "", h = c.getAttribute("data-event-id") || "";
    if (!d || !h || d !== o.roundId) continue;
    const f = o.events.find((E) => E.id === h);
    if (!f) continue;
    const b = t.getEventRuntimeViewStateEvent(o, f, i), v = t.getRuntimeToneStyleEvent(b.tone);
    c.textContent = `⏱ ${b.text}`, c.style.border = v.border, c.style.background = v.background, c.style.color = v.color, rS(o.roundId, f.id, b.locked);
  }
}
function qh() {
  try {
    const t = Array.from(document.querySelectorAll("pre"));
    for (const e of t) {
      if (e.classList.contains("language-rolljson") || e.querySelector(".language-rolljson") || e.querySelector("code.language-rolljson")) {
        e.remove();
        continue;
      }
      const r = (e.textContent || "").trim(), n = (e.innerHTML || "").trim();
      if (!r && !n) continue;
      const o = r.includes("dice_events") && r.includes('"events"') && r.includes('"type"'), i = n.includes("rolljson") || r.includes("rolljson"), c = n.includes("ROLLHELPER_SUMMARY_START");
      !o && !i && !c || e.remove();
    }
  } catch (t) {
    ut.warn("隐藏事件代码块失败", t);
  }
}
function sS(t, e, r) {
  if (!e.enableOutcomeBranches || !e.showOutcomePreviewInListCard) return "";
  const n = t.outcomes;
  if (!n || !!!(n.success?.trim() || n.failure?.trim() || n.explode?.trim())) return "";
  const i = n.success?.trim() || "", c = n.failure?.trim() || "", d = n.explode?.trim() || "", h = en(i) || "未设置", f = en(c) || "未设置", b = e.enableExplodeOutcomeBranch ? en(d) || "未设置" : "已关闭", v = e.enableStatusSystem ? Ys(i, t.skill) : "", E = e.enableStatusSystem ? Ys(c, t.skill) : "", y = e.enableStatusSystem && e.enableExplodeOutcomeBranch ? Ys(d, t.skill) : "", $ = (O, L, D, G, P = !1) => {
    const K = {
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
    }[O], X = G ? r(G) : "";
    return `
      <div class="st-rh-outcome-preview-row st-rh-outcome-${O}"${P ? ' style="margin-bottom:0;"' : ""}>
        <span class="st-rh-outcome-preview-badge" style="background:${K.badgeBg}; border-color:${K.badgeBorder}; color:${K.badgeColor};">
          <i class="${K.icon} fa-fw st-rh-fa-icon" aria-hidden="true" style="margin-right:4px;"></i>${L}
        </span>
        <div class="st-rh-outcome-preview-content">
          <span class="st-rh-outcome-preview-text">${r(D)}</span>
          ${X ? `<div class="st-rh-outcome-preview-status" style="border-color:${K.summaryBorder}; background:${K.summaryBg};">
                 <span class="st-rh-outcome-preview-status-label" style="color:${K.summaryColor};">状态</span>
                 <span class="st-rh-outcome-preview-status-text">${X}</span>
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
      ${$("success", "成功", h, v)}
      ${$("failure", "失败", f, E)}
      ${$("explode", "爆骰", b, y, !0)}
    </div>
  `;
}
function oS(t) {
  return t === "explode" ? "爆骰走向" : t === "success" ? "成功走向" : t === "failure" ? "失败走向" : "剧情走向";
}
function Fh(t) {
  return t === "advantage" ? "优势" : t === "disadvantage" ? "劣势" : "正常";
}
function mi(t) {
  const e = String(t ?? "").trim().toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  return e ? e.slice(0, 64) : `id-${Math.abs(
    Array.from(String(t ?? "id")).reduce((n, o) => n * 31 + o.charCodeAt(0) | 0, 7)
  )}`;
}
function aS(t, e) {
  const r = e.getSettingsEvent(), n = e.getDiceMetaEvent(), o = Ar(n);
  e.ensureRoundEventTimersSyncedEvent(t);
  const i = (h) => t.events.map((f) => {
    const b = f.compare ?? ">=", v = e.getLatestRollRecordForEvent(t, f.id), E = e.getEventRuntimeViewStateEvent(t, f, Date.now()), y = e.getRuntimeToneStyleEvent(E.tone), $ = e.escapeAttrEvent(
      `st-rh-event-${mi(t.roundId)}-${mi(f.id)}-details`
    ), O = e.buildEventRolledPrefixTemplateEvent(
      v?.source === "timeout_auto_fail"
    ), L = v ? e.buildEventRolledBlockTemplateEvent(
      O,
      e.escapeHtmlEvent(e.formatRollRecordSummaryEvent(v, f))
    ) : "", D = sS(f, r, e.escapeHtmlEvent), G = typeof f.deadlineAt == "number" && Number.isFinite(f.deadlineAt) ? String(f.deadlineAt) : "", P = E.locked ? "disabled" : "", K = E.locked ? "opacity:0.4;cursor:not-allowed;filter:grayscale(1);" : "cursor:pointer;", X = !E.locked && !v;
    r.enableTimeLimit && f.timeLimit && f.timeLimit;
    const F = r.enableTimeLimit ? $o(f.timeLimit ?? "无") : "关闭", z = r.enableStatusSystem ? hl(o, f.skill) : { modifier: 0, matched: [] }, Z = v ? Number.isFinite(Number(v.baseModifierUsed)) ? Number(v.baseModifierUsed) : 0 : (() => {
      try {
        return e.parseDiceExpression(f.checkDice).modifier;
      } catch {
        return 0;
      }
    })(), H = v ? Number.isFinite(Number(v.skillModifierApplied)) ? Number(v.skillModifierApplied) : 0 : e.resolveSkillModifierBySkillNameEvent(f.skill, r), B = v ? Number.isFinite(Number(v.statusModifierApplied)) ? Number(v.statusModifierApplied) : 0 : z.modifier, tt = v ? Array.isArray(v.statusModifiersApplied) ? v.statusModifiersApplied : [] : z.matched, it = v && Number.isFinite(Number(v.finalModifierUsed)) ? Number(v.finalModifierUsed) : Z + H + B, dt = Z !== 0 || H !== 0 || B !== 0 ? `${e.formatModifier(Z)} + 技能 ${e.formatModifier(
      H
    )} + 状态 ${e.formatModifier(B)} = ${e.formatModifier(
      it
    )}` : "", Tt = r.enableSkillSystem ? `技能修正：${e.formatModifier(H)}${B !== 0 ? `；状态 ${e.formatModifier(B)}${tt.length > 0 ? `（${tt.map((Pt) => `${Pt.name}${e.formatModifier(Pt.modifier)}`).join("，")}）` : ""}` : ""}${dt ? `（${dt}）` : ""}` : "技能系统已关闭", Rt = Vh(
      Z,
      H,
      B,
      it,
      f.skill,
      tt,
      e.escapeHtmlEvent,
      e.escapeAttrEvent
    ), pt = jh(
      f.dcReason,
      it,
      r.enableDynamicDcReason,
      e.escapeHtmlEvent,
      e.formatModifier
    ), rt = Fh(
      v?.advantageStateApplied ?? f.advantageState
    ), vt = X ? f.rollMode === "auto" ? '<span class="st-rh-summary-lock st-rh-mono" style="color: #d1b67f; border: 1px dashed rgba(209,182,127,0.3);"><i class="fa-solid fa-hourglass-half fa-fw st-rh-fa-icon" style="margin-right:6px;"></i>等待自动触发</span>' : e.buildEventRollButtonTemplateEvent({
      roundIdAttr: e.escapeAttrEvent(t.roundId),
      eventIdAttr: e.escapeAttrEvent(f.id),
      diceExprAttr: e.escapeAttrEvent(f.checkDice),
      buttonDisabledAttr: P,
      buttonStateStyle: K
    }) : "", Mt = f.rollMode === "auto" ? `<span class="st-rh-badge-role st-rh-badge-role-auto">${e.escapeHtmlEvent("自动结算")}</span>` : `<span class="st-rh-badge-role st-rh-badge-role-manual">${e.escapeHtmlEvent("需检定")}</span>`;
    return e.buildEventListItemTemplateEvent({
      detailsIdAttr: $,
      templateVariant: h,
      titleHtml: e.escapeHtmlEvent(f.title),
      rollModeBadgeHtml: Mt,
      eventIdHtml: e.escapeHtmlEvent(f.id),
      collapsedCheckHtml: e.escapeHtmlEvent(`${f.checkDice} ${b} ${String(f.dc)}`),
      collapsedRuntimeHtml: e.escapeHtmlEvent(E.text),
      descHtml: e.escapeHtmlEvent(f.desc),
      targetHtml: e.escapeHtmlEvent(f.targetLabel),
      skillHtml: e.escapeHtmlEvent(f.skill),
      skillTitleAttr: e.escapeAttrEvent(Tt),
      advantageStateHtml: e.escapeHtmlEvent(rt),
      modifierTextHtml: Rt,
      checkDiceHtml: e.escapeHtmlEvent(f.checkDice),
      compareHtml: e.escapeHtmlEvent(b),
      dcText: String(f.dc),
      dcReasonHtml: pt,
      timeLimitHtml: e.escapeHtmlEvent(F),
      roundIdAttr: e.escapeAttrEvent(t.roundId),
      eventIdAttr: e.escapeAttrEvent(f.id),
      deadlineAttr: e.escapeAttrEvent(G),
      runtimeStyleAttr: `style="border:${y.border};background:${y.background};color:${y.color};"`,
      runtimeTextHtml: e.escapeHtmlEvent(E.text),
      rolledBlockHtml: L,
      outcomePreviewHtml: D,
      commandTextHtml: `/eventroll roll ${e.escapeHtmlEvent(f.id)}`,
      rollButtonHtml: vt
    });
  }).join(""), c = i("desktop"), d = i("mobile");
  return e.buildEventListCardTemplateEvent(
    e.escapeHtmlEvent(t.roundId),
    c,
    d
  );
}
function wu(t) {
  return t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;").replace(/`/g, "&#96;");
}
function le(t) {
  return t > 0 ? `+${t}` : String(t);
}
function iS(t, e) {
  if (t === "all") return "全局";
  const r = Array.isArray(e) ? e.filter((n) => String(n || "").trim()) : [];
  return r.length <= 0 ? "当前技能" : r.join(" / ");
}
function Ys(t, e) {
  const r = Tm(t, e);
  if (!Array.isArray(r.commands) || r.commands.length <= 0) return "";
  const n = r.commands.filter((d) => d.kind === "apply").map(
    (d) => `获得「${d.name}」${le(d.modifier)}（${iS(
      d.scope,
      d.skills
    )}，${dn(d.durationRounds)}）`
  ), o = r.commands.filter((d) => d.kind === "remove").map((d) => `移除「${d.name}」`), i = r.commands.some((d) => d.kind === "clear"), c = [...n, ...o];
  return i && c.push("清空全部状态"), c.join("；");
}
function lS(t) {
  const e = Array.isArray(t) ? t.filter((r) => r?.enabled !== !1) : [];
  return e.length <= 0 ? "无" : e.map((r) => {
    const n = le(Number(r.modifier) || 0), o = r.scope === "all" ? "全局" : Array.isArray(r.skills) && r.skills.length > 0 ? r.skills.join(" / ") : "当前技能", i = dn(r.remainingRounds);
    return `${r.name}${n}（${o}，${i}）`;
  }).join("；");
}
function cS(t, e) {
  const r = String(t ?? "").trim() || "剧情走向", n = String(e ?? "").replace(/\s+/g, " ").trim() || "未设置", o = `${r}：${n}`;
  return {
    text: o,
    title: o,
    chipClassName: "st-rh-summary-chip-outcome"
  };
}
function uS(t) {
  const e = String(t ?? "").replace(/\s+/g, " ").trim();
  return e ? {
    text: `获得状态：${e}`,
    title: `获得状态：${e}`,
    chipClassName: "st-rh-summary-chip-status-summary"
  } : { text: "", title: "", chipClassName: "st-rh-summary-chip-status-summary" };
}
function dS(t, e, r, n) {
  const o = Array.isArray(t.rolls) && t.rolls.length > 0 ? `[${t.rolls.join(", ")}]` : "[]", i = Number.isFinite(Number(t.rawTotal)) ? Number(t.rawTotal) : 0, c = Number.isFinite(Number(t.total)) ? Number(t.total) : i, d = Number.isFinite(Number(r)), h = Number.isFinite(Number(e)) ? Number(e) : Number(t.modifier) || 0, f = d ? Number(r) : 0, b = Number.isFinite(Number(n)) ? Number(n) : d ? h + f : Number(t.modifier) || 0, v = [];
  return v.push(`骰面 ${o}`), v.push(`原始值 ${i}`), d ? (v.push(`基础修正 ${le(h)}`), v.push(`技能修正 ${le(f)}`), v.push(`最终修正 ${le(b)}`)) : v.push(`修正 ${le(Number(t.modifier) || 0)}`), v.push(`总计 ${c}`), t.exploding && v.push(t.explosionTriggered ? "爆骰已触发" : "爆骰已启用"), v.join(" | ");
}
function Ps(t, e, r, n, o) {
  const i = String(t ?? ""), c = le(e), d = i ? `${n(i)} ` : "";
  return `<span class="st-rh-inline-tip-segment" data-tip="${o(r)}">${d}<span class="st-rh-mono">${n(c)}</span></span>`;
}
function Vh(t, e, r, n, o, i, c, d) {
  if (t === 0 && e === 0 && r === 0)
    return "";
  const h = Array.isArray(i) && i.length > 0 ? `当前命中的状态：${i.map((y) => `${String(y.name ?? "").trim() || "未命名状态"}${le(Number(y.modifier) || 0)}`).join("、")}。` : "当前没有命中的状态修正。", f = Ps(
    "",
    t,
    `基础修正：来自骰式本身的固定修正值。当前值 ${le(t)}。`,
    c,
    d
  ), b = Ps(
    "技能",
    e,
    `技能修正：来自技能「${String(o ?? "").trim() || "未指定"}」。当前值 ${le(e)}。`,
    c,
    d
  ), v = Ps(
    "状态",
    r,
    `状态修正：由当前生效状态提供。当前值 ${le(r)}。${h}`,
    c,
    d
  ), E = Ps(
    "",
    n,
    `最终修正：基础修正 + 技能修正 + 状态修正。当前值 ${le(n)}。`,
    c,
    d
  );
  return `${f} + ${b} + ${v} = ${E}`;
}
function Yh(t, e, r) {
  const n = Math.max(40, Math.floor(r)), o = Math.max(14, Math.round(n * 0.34));
  return `
    <svg width="${n}" height="${n}" viewBox="0 0 48 48" style="display:inline-block; vertical-align: middle;">
      <rect x="4" y="4" width="40" height="40" rx="8" ry="8" fill="none" stroke="${e}" stroke-width="3" />
      <text x="24" y="31" font-size="${o}" text-anchor="middle" fill="${e}" font-weight="bold" style="font-family: monospace;">${t}</text>
    </svg>
  `;
}
function mS(t, e, r = !1, n = "") {
  if (!t || !Array.isArray(t.rolls) || t.rolls.length === 0)
    return "";
  const o = "d" + Math.random().toString(36).substr(2, 9);
  let i = "normal", c = "", d = "#ffdb78";
  if (t.count === 1) {
    const L = t.rolls[0], D = t.sides;
    L === D ? (i = "success", c = "大成功！", d = "#52c41a") : L === 1 && (i = "fail", c = "大失败！", d = "#ff4d4f");
  }
  const h = r ? 62 : 68, f = r ? 52 : 58, b = String(n || "").trim(), v = Number.isFinite(Number(t.total)) ? Number(t.total) : 0, E = Yh(v, d, h), y = b ? `<span style="display:inline-flex;cursor:help;" data-tip="${wu(
    `${b}`
  )}">${E}</span>` : E, $ = e.getRollingSvg("#ffdb78", f), O = e.buildAlreadyRolledDiceVisualTemplateEvent({
    uniqueId: o,
    rollingVisualHtml: $,
    diceVisualsHtml: y,
    critType: i,
    critText: c,
    compactMode: r
  });
  return b ? `<div style="display:inline-flex;align-items:center;justify-content:center;cursor:help;" data-tip="${wu(b)}">${O}</div>` : O;
}
function hS(t, e, r) {
  const n = r.getSettingsEvent(), o = r.resolveTriggeredOutcomeEvent(t, e, n), i = n.enableOutcomeBranches ? oS(o.kind) : "剧情走向", c = n.enableOutcomeBranches ? `st-rh-outcome-tone-${o.kind}` : "st-rh-outcome-tone-neutral", d = n.enableOutcomeBranches ? o.text : "走向分支已关闭。", h = en(d), f = cS(i, h), b = n.enableStatusSystem ? Ys(d, t.skill) : "", v = uS(b), E = n.enableStatusSystem ? lS(Ar(r.getDiceMetaEvent())) : "", y = e.success === null ? "待定" : e.success ? "判定成功" : "判定失败", $ = e.success === null ? "#ffdb78" : e.success ? "#52c41a" : "#ff4d4f", O = e.source === "timeout_auto_fail" ? "超时检定" : e.source === "ai_auto_roll" ? "自动检定" : "手动检定", L = Number.isFinite(Number(e.baseModifierUsed)) ? Number(e.baseModifierUsed) : Number(e.result.modifier) || 0, D = Number.isFinite(Number(e.skillModifierApplied)) ? Number(e.skillModifierApplied) : 0, G = Number.isFinite(Number(e.statusModifierApplied)) ? Number(e.statusModifierApplied) : 0, P = Number.isFinite(Number(e.finalModifierUsed)) ? Number(e.finalModifierUsed) : L + D + G, K = dS(
    e.result,
    L,
    D,
    P
  ), X = e.source === "timeout_auto_fail" ? "" : mS(
    e.result,
    {
      getDiceSvg: r.getDiceSvg,
      getRollingSvg: r.getRollingSvg,
      buildAlreadyRolledDiceVisualTemplateEvent: r.buildAlreadyRolledDiceVisualTemplateEvent
    },
    !1,
    K
  ), F = L !== 0 || D !== 0 || G !== 0 ? `${r.formatModifier(L)} + 技能 ${r.formatModifier(
    D
  )} + 状态 ${r.formatModifier(G)} = ${r.formatModifier(P)}` : "", z = n.enableSkillSystem ? `技能修正：${r.formatModifier(D)}；状态 ${r.formatModifier(
    G
  )}${F ? `（${F}）` : ""}` : "技能系统已关闭", Z = n.enableSkillSystem && (D !== 0 || G !== 0) ? `技能${r.formatModifier(D)} / 状态${r.formatModifier(G)}` : "";
  let H = "未请求爆骰";
  const B = Vh(
    L,
    D,
    G,
    P,
    t.skill,
    Array.isArray(e.statusModifiersApplied) ? e.statusModifiersApplied : [],
    r.escapeHtmlEvent,
    r.escapeAttrEvent
  );
  e.explodePolicyApplied === "disabled_globally" ? H = "已请求，系统关闭，按普通骰" : e.explodePolicyApplied === "downgraded_by_ai_limit" ? H = "已请求，超出本轮 AI 上限，按普通骰" : (e.explodePolicyApplied === "enabled" || e.result.exploding) && (H = e.result.explosionTriggered ? "已请求，已触发连爆" : "已请求，未触发连爆");
  const tt = G !== 0 ? `受状态影响 ${r.formatModifier(G)}${Array.isArray(e.statusModifiersApplied) && e.statusModifiersApplied.length > 0 ? `（${e.statusModifiersApplied.map((rt) => `${rt.name}${r.formatModifier(rt.modifier)}`).join("，")}）` : ""}` : "", it = jh(
    t.dcReason,
    P,
    n.enableDynamicDcReason,
    r.escapeHtmlEvent,
    r.formatModifier
  ), dt = r.escapeAttrEvent(
    `st-rh-result-${mi(e.rollId)}-details`
  ), Tt = `${e.compareUsed} ${String(e.dcUsed ?? "未设置")}`, Rt = e.source === "timeout_auto_fail" ? "" : Yh(
    Number.isFinite(Number(e.result.total)) ? Number(e.result.total) : 0,
    $,
    48
  ), pt = $o(t.timeLimit ?? "无");
  return r.buildEventRollResultCardTemplateEvent({
    detailsIdAttr: dt,
    collapsedStatusHtml: r.escapeHtmlEvent(y),
    collapsedConditionHtml: r.escapeHtmlEvent(Tt),
    collapsedSourceHtml: r.escapeHtmlEvent(O),
    collapsedTotalHtml: r.escapeHtmlEvent(String(e.result.total)),
    collapsedOutcomeHtml: r.escapeHtmlEvent(f.text),
    collapsedOutcomeTitleAttr: r.escapeAttrEvent(f.title),
    collapsedOutcomeChipClassName: f.chipClassName,
    collapsedStatusSummaryHtml: r.escapeHtmlEvent(v.text),
    collapsedStatusSummaryTitleAttr: r.escapeAttrEvent(v.title),
    collapsedStatusSummaryChipClassName: v.chipClassName,
    collapsedDiceVisualHtml: Rt,
    rollIdHtml: r.escapeHtmlEvent(e.rollId),
    titleHtml: r.escapeHtmlEvent(t.title),
    eventIdHtml: r.escapeHtmlEvent(t.id),
    sourceHtml: r.escapeHtmlEvent(O),
    targetHtml: r.escapeHtmlEvent(e.targetLabelUsed || t.targetLabel),
    skillHtml: r.escapeHtmlEvent(t.skill),
    skillTitleAttr: r.escapeAttrEvent(z),
    advantageStateHtml: r.escapeHtmlEvent(
      Fh(e.advantageStateApplied ?? t.advantageState)
    ),
    diceExprHtml: r.escapeHtmlEvent(e.diceExpr),
    diceModifierHintHtml: r.escapeHtmlEvent(Z),
    rollsSummaryHtml: r.buildRollsSummaryTemplateEvent(
      r.escapeHtmlEvent(e.result.rolls.join(", ")),
      r.escapeHtmlEvent(r.formatModifier(e.result.modifier))
    ),
    explodeInfoHtml: r.escapeHtmlEvent(H),
    modifierBreakdownHtml: B,
    compareHtml: r.escapeHtmlEvent(e.compareUsed),
    dcText: String(e.dcUsed ?? "未设置"),
    dcReasonHtml: it,
    statusText: y,
    statusColor: $,
    totalText: String(e.result.total),
    timeLimitHtml: r.escapeHtmlEvent(pt),
    diceVisualBlockHtml: X,
    outcomeLabelHtml: r.escapeHtmlEvent(i),
    outcomeToneClassName: c,
    outcomeTextHtml: r.escapeHtmlEvent(h),
    statusImpactHtml: r.escapeHtmlEvent(tt),
    outcomeStatusSummaryHtml: r.escapeHtmlEvent(b),
    currentStatusesHtml: r.escapeHtmlEvent(E)
  });
}
const pS = {
  getSettingsEvent: St,
  getDiceMetaEvent: $t,
  ensureRoundEventTimersSyncedEvent: Ze,
  getLatestRollRecordForEvent: Qe,
  getEventRuntimeViewStateEvent: Ll,
  getRuntimeToneStyleEvent: Kh,
  buildEventRolledPrefixTemplateEvent: Vy,
  buildEventRolledBlockTemplateEvent: Fy,
  formatRollRecordSummaryEvent: by,
  parseDiceExpression: Je,
  resolveSkillModifierBySkillNameEvent: Lo,
  formatEventModifierBreakdownEvent: il,
  formatModifier: Ie,
  buildEventRollButtonTemplateEvent: Yy,
  buildEventListItemTemplateEvent: Wy,
  buildEventListCardTemplateEvent: Xy,
  escapeHtmlEvent: cn,
  escapeAttrEvent: ll
};
function Ll(t, e, r = Date.now()) {
  return eS(
    t,
    e,
    {
      getSettingsEvent: St,
      getLatestRollRecordForEvent: Qe,
      ensureRoundEventTimersSyncedEvent: Ze
    },
    r
  );
}
function fS(t) {
  return Nl(), aS(t, {
    ...pS
  });
}
function Wh(t, e) {
  return Nl(), hS(t, e, {
    getSettingsEvent: St,
    getDiceMetaEvent: $t,
    resolveTriggeredOutcomeEvent: Cl,
    formatEventModifierBreakdownEvent: il,
    buildRollsSummaryTemplateEvent: Zy,
    formatModifier: Ie,
    buildEventRollResultCardTemplateEvent: tS,
    escapeHtmlEvent: cn,
    escapeAttrEvent: ll,
    getDiceSvg: ii,
    getRollingSvg: fh,
    buildAlreadyRolledDiceVisualTemplateEvent: F0
  });
}
function ts() {
  nS({
    getDiceMetaEvent: $t,
    ensureRoundEventTimersSyncedEvent: Ze,
    getEventRuntimeViewStateEvent: Ll,
    getRuntimeToneStyleEvent: Kh
  });
}
const hi = "st-rh-widget-container", Iu = "data-rh-widget";
function gS(t, e) {
  if (!t || !Array.isArray(e)) return null;
  const r = document.getElementById("chat");
  if (!r) return null;
  const n = t.split(":");
  if (n.length < 3) return null;
  const o = n[0], i = n[1];
  if (o === "assistant" && i)
    for (let c = e.length - 1; c >= 0; c -= 1) {
      const d = e[c], h = d?.id ?? d?.cid ?? d?.uid;
      if (h != null && String(h) === i) {
        const f = r.querySelector(`.mes[mesid="${c}"]`);
        if (f) return f;
      }
    }
  if (o === "assistant_idx" && i) {
    const c = Number(i);
    if (Number.isFinite(c) && c >= 0 && c < e.length)
      return r.querySelector(`.mes[mesid="${c}"]`);
  }
  return null;
}
function bS(t, e) {
  if (!Array.isArray(t) || t.length === 0) return null;
  for (let r = t.length - 1; r >= 0; r -= 1) {
    const n = gS(t[r], e);
    if (n) return n;
  }
  return null;
}
function vS(t, e, r) {
  if (!t || !r) return;
  let n = t.querySelector(
    `.${hi}[${Iu}="${r}"]`
  );
  if (!n) {
    n = document.createElement("div"), n.className = hi, n.setAttribute(Iu, r);
    const o = t.querySelector(".mes_block");
    o ? o.appendChild(n) : t.appendChild(n);
  }
  n.innerHTML = e;
}
function xS() {
  const t = Array.from(document.querySelectorAll(`.${hi}`));
  for (const e of t)
    e.remove();
}
function yS(t) {
  xS();
  const e = {
    mountedWidgetCount: 0,
    hasPendingRound: !1,
    pendingRoundMounted: !1,
    chatDomReady: !!document.getElementById("chat")
  }, n = t.getLiveContextEvent()?.chat, o = t.getDiceMetaEvent();
  if (o.pendingRound && o.pendingRound.events.length > 0 && (e.hasPendingRound = !0), !Array.isArray(n))
    return ut.warn("[卡片恢复] 当前 liveContext.chat 不可用，跳过挂载"), e;
  if (o.pendingRound && o.pendingRound.events.length > 0) {
    const i = o.pendingRound, c = bS(i.sourceAssistantMsgIds, n);
    if (c || ut.warn(
      `[卡片恢复] 未找到锚点消息 roundId=${i.roundId} sourceMsgIds=${JSON.stringify(i.sourceAssistantMsgIds)}`
    ), c) {
      const d = [];
      d.push(t.buildEventListCardEvent(i));
      for (const h of i.events) {
        const f = t.getLatestRollRecordForEvent(i, h.id);
        f && d.push(t.buildEventRollResultCardEvent(h, f));
      }
      vS(c, d.join(""), `round-${i.roundId}`), e.mountedWidgetCount += 1, e.pendingRoundMounted = !0;
    }
  }
  return e;
}
function pi(t = 0, e) {
  const r = e.getSettingsEvent();
  if (!r.enabled) return;
  const n = e.getLiveContextEvent();
  if (!n?.chat || !Array.isArray(n.chat)) return;
  const o = e.findLatestAssistantEvent(n.chat);
  if (!o) return;
  const i = e.getDiceMetaEvent(), c = e.buildAssistantMessageIdEvent(
    o.msg,
    o.index
  );
  if (i.lastProcessedAssistantMsgId === c) return;
  const d = [
    e.getPreferredAssistantSourceTextEvent(o.msg),
    e.getMessageTextEvent(o.msg)
  ].filter((L, D, G) => L && G.indexOf(L) === D);
  let h = "", f = [], b = [], v = !1;
  for (const L of d) {
    const D = e.parseEventEnvelopesEvent(L);
    if (D.events.length > 0 || D.ranges.length > 0) {
      h = L, f = D.events, b = D.ranges, v = D.shouldEndRound;
      break;
    }
    h || (h = L, f = D.events, b = D.ranges, v = D.shouldEndRound);
  }
  if (!h.trim()) {
    if (t < 4) {
      setTimeout(() => pi(t + 1, e), 100 + t * 120);
      return;
    }
    i.lastProcessedAssistantMsgId = c;
    return;
  }
  const E = e.filterEventsByApplyScopeEvent(f, r.eventApplyScope), y = b;
  if (E.length === 0 && y.length === 0) {
    if (t < 4) {
      setTimeout(() => pi(t + 1, e), 140 + t * 160);
      return;
    }
    i.lastProcessedAssistantMsgId = c;
    return;
  }
  i.lastProcessedAssistantMsgId = c;
  const $ = e.removeRangesEvent(h, y);
  e.setMessageTextEvent(o.msg, $), e.hideEventCodeBlocksInDomEvent(), y.length > 0 && e.persistChatSafeEvent();
  const O = i.pendingRound;
  if (O?.status === "open" && r.enableAiRoundControl && v && (O.status = "closed"), E.length > 0) {
    const L = e.mergeEventsIntoPendingRoundEvent(E, c);
    e.autoRollEventsByAiModeEvent(L), e.sweepTimeoutFailuresEvent(), e.refreshAllWidgetsFromStateEvent(), e.refreshCountdownDomEvent();
  }
  setTimeout(() => {
    e.hideEventCodeBlocksInDomEvent(), e.refreshCountdownDomEvent();
  }, 50);
}
function SS(t, e) {
  for (let r = t.length - 1; r >= 0; r--)
    if (e.isAssistantMessageEvent(t[r]))
      return { msg: t[r], index: r };
  return null;
}
function ES(t, e, r) {
  const n = t.id ?? t.cid ?? t.uid, o = r.simpleHashEvent(r.getMessageTextEvent(t));
  return n != null ? `assistant:${String(n)}:${o}` : `assistant_idx:${e}:${o}`;
}
function _S(t, e) {
  const r = [
    e.getPreferredAssistantSourceTextEvent(t),
    e.getMessageTextEvent(t)
  ].filter((n, o, i) => n && i.indexOf(n) === o);
  for (const n of r) {
    const { ranges: o } = e.parseEventEnvelopesEvent(n);
    if (o.length === 0) continue;
    const i = e.removeRangesEvent(n, o);
    return e.setMessageTextEvent(t, i), !0;
  }
  return !1;
}
function TS(t) {
  const e = t.getLiveContextEvent();
  if (!e?.chat || !Array.isArray(e.chat)) return;
  let r = !1;
  for (const n of e.chat)
    t.isAssistantMessageEvent(n) && t.sanitizeAssistantMessageEventBlocksEvent(n) && (r = !0);
  r && t.persistChatSafeEvent(), t.hideEventCodeBlocksInDomEvent();
}
function kS(t = "chat_reset", e) {
  const r = e.getDiceMetaEvent();
  if (String(t || "").toLowerCase() !== "chat_reset") {
    delete r.lastProcessedAssistantMsgId;
    return;
  }
  delete r.pendingRound, delete r.outboundSummary, delete r.pendingResultGuidanceQueue, delete r.outboundResultGuidance, delete r.summaryHistory, delete r.lastPromptUserMsgId, delete r.lastProcessedAssistantMsgId, e.saveMetadataSafeEvent();
}
function Ws(t) {
  return String(t ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function wS(t) {
  try {
    const e = JSON.parse(String(t ?? "{}"));
    return !e || typeof e != "object" || Array.isArray(e) ? [] : Object.entries(e).map(([r, n]) => ({ name: String(r ?? "").trim(), modifier: Number(n) })).filter((r) => r.name && Number.isFinite(r.modifier)).sort((r, n) => Math.abs(n.modifier) - Math.abs(r.modifier) || r.name.localeCompare(n.name, "zh-Hans-CN"));
  } catch {
    return [];
  }
}
const At = "SSHELPERTOOL", Au = "st-roll-sshelper-toolbar-style", vo = "is-collapsed", $u = "3", IS = 60, AS = 500, Xh = "展开工具栏", $S = "收起工具栏", RS = "技能预览", CS = "状态预览", Jh = "展开 SSHELPER 工具栏", DS = "收起 SSHELPER 工具栏", NS = "打开技能预览", LS = "打开状态预览";
function MS() {
  return `
    <div class="st-rh-ss-toolbar-shell" data-sshelper-toolbar-shell="1">
      ${ct({
    label: "",
    className: "st-rh-ss-toggle",
    iconClassName: "fa-solid fa-angles-right",
    attributes: {
      "data-sshelper-tool-toggle": "1",
      "data-tip": Xh,
      "aria-expanded": "false",
      "aria-label": Jh
    }
  })}
      <div class="st-rh-ss-actions" data-sshelper-tool-actions="1">
        ${ct({
    label: "",
    className: "st-rh-ss-preview-btn",
    iconClassName: "fa-solid fa-wand-magic-sparkles",
    attributes: {
      "data-event-preview-open": "skills",
      "data-tip": RS,
      "aria-label": NS
    }
  })}
        ${ct({
    label: "",
    className: "st-rh-ss-preview-btn",
    iconClassName: "fa-solid fa-heart-pulse",
    attributes: {
      "data-event-preview-open": "statuses",
      "data-tip": CS,
      "aria-label": LS
    }
  })}
      </div>
    </div>
  `;
}
function OS() {
  if (document.getElementById(Au)) return;
  const t = document.createElement("style");
  t.id = Au, t.textContent = `
    #${At} {
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
    #${At}.${vo} {
      padding: 0;
      border-color: transparent;
      background-color: transparent;
      box-shadow: none;
      backdrop-filter: none;
    }
    #${At} .st-rh-ss-toolbar-shell {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      max-width: min(100%, 480px);
      padding: 2px 0;
    }
    #${At} .st-rh-ss-toggle {
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
    #${At} .st-rh-ss-toggle:hover {
      border-color: #efd392;
      filter: brightness(1.08);
    }
    #${At} .st-rh-ss-actions {
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
    #${At}.${vo} .st-rh-ss-actions {
      max-width: 0;
      opacity: 0;
      transform: translateX(-18px);
      pointer-events: none;
      visibility: hidden;
    }
    #${At} .st-rh-ss-preview-btn {
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
    #${At} .st-rh-ss-toggle .stx-shared-button-label,
    #${At} .st-rh-ss-preview-btn .stx-shared-button-label {
      display: none;
    }
    #${At} .st-rh-ss-toggle.stx-shared-button,
    #${At} .st-rh-ss-preview-btn.stx-shared-button {
      gap: 0;
      padding: 0;
    }
    #${At} .st-rh-ss-preview-btn:hover {
      border-color: #efd392;
      filter: brightness(1.08);
    }
    @media (max-width: 768px) {
      #${At} {
        left: 6px;
        bottom: calc(100% + 6px);
        padding: 5px 6px;
      }
      #${At} .st-rh-ss-toolbar-shell {
        max-width: 100%;
      }
      #${At} .st-rh-ss-preview-btn {
        width: 28px;
        height: 28px;
        font-size: 12px;
      }
    }
    @media (prefers-reduced-motion: reduce) {
      #${At} .st-rh-ss-actions,
      #${At} .st-rh-ss-toggle,
      #${At} .st-rh-ss-preview-btn {
        transition: none;
      }
    }
  `, document.head.appendChild(t);
}
function Qh(t, e) {
  t.classList.toggle(vo, !e);
  const r = t.querySelector('button[data-sshelper-tool-toggle="1"]');
  if (!r) return;
  r.setAttribute("aria-expanded", e ? "true" : "false"), r.setAttribute(
    "aria-label",
    e ? DS : Jh
  );
  const n = r.querySelector("i");
  n && (n.className = e ? "fa-solid fa-angles-left" : "fa-solid fa-angles-right"), r.dataset.tip = e ? $S : Xh;
}
function PS(t) {
  const e = t.querySelector('[data-sshelper-toolbar-shell="1"]'), r = !!t.querySelector('button[data-event-preview-open="skills"]'), n = !!t.querySelector('button[data-event-preview-open="statuses"]'), o = !!t.querySelector('button[data-sshelper-tool-toggle="1"][data-tip]');
  (!e || !r || !n || !o || t.dataset.sshelperToolbarMarkupVersion !== $u) && (t.innerHTML = MS(), t.dataset.sshelperToolbarMarkupVersion = $u, delete t.dataset.sshelperToolbarInitialized), t.dataset.sshelperToolbarInitialized !== "1" && (Qh(t, !1), t.dataset.sshelperToolbarInitialized = "1");
}
function BS(t) {
  t > IS || setTimeout(() => {
    Zh(t);
  }, AS);
}
function Zh(t = 0) {
  OS();
  let e = document.getElementById(At);
  e || (e = document.createElement("div"), e.id = At), PS(e);
  const n = document.querySelector("#send_form.compact") || document.getElementById("send_form");
  return !n || !n.parentElement ? (BS(t + 1), e) : (window.getComputedStyle(n).position === "static" && (n.style.position = "relative"), e.parentElement !== n && n.appendChild(e), e);
}
function US() {
  if (document.getElementById("st-roll-event-preview-style")) return;
  const t = document.createElement("style");
  t.id = "st-roll-event-preview-style", t.textContent = `
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
  `, document.head.appendChild(t);
}
function tp() {
  const t = document.getElementById("st-roll-event-preview-dialog");
  if (t) return t;
  US();
  const e = document.createElement("dialog");
  return e.id = "st-roll-event-preview-dialog", e.className = "st-rh-preview-dialog", e.innerHTML = `
    <div class="st-rh-preview-wrap">
      <div class="st-rh-preview-head">
        <div class="st-rh-preview-title" data-preview-title="1"></div>
        <button type="button" class="st-rh-preview-btn secondary" data-preview-close="1">关闭</button>
      </div>
      <div class="st-rh-preview-body" data-preview-body="1"></div>
    </div>
  `, e.addEventListener("cancel", (r) => {
    r.preventDefault(), e.close();
  }), document.body.appendChild(e), e;
}
function HS(t) {
  const e = wS(t);
  return e.length <= 0 ? '<div class="st-rh-preview-empty">当前主角技能为空。</div>' : `<ul class="st-rh-preview-list">${e.map(
    (r) => `<li class="st-rh-preview-item"><strong>${Ws(r.name)}</strong>：${r.modifier >= 0 ? `+${r.modifier}` : r.modifier}</li>`
  ).join("")}</ul>`;
}
function zS(t) {
  const e = Array.isArray(t.activeStatuses) ? t.activeStatuses.filter((r) => r?.enabled !== !1) : [];
  return e.length <= 0 ? '<div class="st-rh-preview-empty">当前没有生效状态。</div>' : `<ul class="st-rh-preview-list">${e.map((r) => {
    const n = r.scope === "all" ? "全局" : Array.isArray(r.skills) && r.skills.length > 0 ? r.skills.join("|") : "当前技能", o = dn(r.remainingRounds), i = Number(r.modifier) || 0;
    return `<li class="st-rh-preview-item"><strong>${Ws(r.name)}</strong>：${i >= 0 ? `+${i}` : i} ｜ 范围=${Ws(n)} ｜ ${Ws(o)}</li>`;
  }).join("")}</ul>`;
}
function GS(t, e) {
  const r = tp(), n = r.querySelector('[data-preview-title="1"]'), o = r.querySelector('[data-preview-body="1"]');
  if (!n || !o) return;
  const i = e.getSettingsEvent();
  if (t === "skills" ? (n.textContent = "技能预览（当前主角）", o.innerHTML = i.enableSkillSystem === !1 ? '<div class="st-rh-preview-empty">技能系统已关闭。</div>' : HS(String(i.skillTableText ?? "{}"))) : (n.textContent = "状态预览（当前生效）", o.innerHTML = zS(e.getDiceMetaEvent())), !r.open)
    try {
      r.showModal();
    } catch {
      r.setAttribute("open", "");
    }
}
function KS(t) {
  const e = globalThis;
  Fm(), Zh(), !e.__stRollEventButtonsBoundEvent && (document.addEventListener(
    "click",
    (r) => {
      const n = r.target;
      if (!n) return;
      const o = n.closest(
        'button[data-sshelper-tool-toggle="1"]'
      );
      if (o) {
        r.preventDefault(), r.stopPropagation();
        const y = o.closest(`#${At}`);
        if (y) {
          const $ = !y.classList.contains(vo);
          Qh(y, !$);
        }
        return;
      }
      const i = n.closest(
        "button[data-event-preview-open]"
      );
      if (i) {
        r.preventDefault(), r.stopPropagation();
        const y = String(i.dataset.eventPreviewOpen ?? "").toLowerCase();
        (y === "skills" || y === "statuses") && GS(y, t);
        return;
      }
      if (n.closest(
        'button[data-preview-close="1"]'
      )) {
        r.preventDefault();
        const y = tp();
        y.open && y.close();
        return;
      }
      const d = n.closest(
        "button[data-rh-collapse-toggle='1']"
      );
      if (d) {
        r.preventDefault(), r.stopPropagation();
        const y = d.closest(
          "[data-rh-collapsible-card='1']"
        );
        if (!y) return;
        const O = y.classList.contains("is-collapsed");
        y.classList.toggle("is-collapsed", !O), d.setAttribute("aria-expanded", O ? "true" : "false");
        const L = d.dataset.labelExpand || "展开详情", D = d.dataset.labelCollapse || "收起详情", G = d.querySelector("[data-rh-collapse-label='1']");
        G && (G.textContent = O ? D : L);
        return;
      }
      const h = n.closest(
        "button[data-dice-event-roll='1']"
      );
      if (!h) return;
      r.preventDefault(), r.stopPropagation();
      const f = h.getAttribute("data-dice-event-id") || "", b = h.getAttribute("data-dice-expr") || "", v = h.getAttribute("data-round-id") || "", E = t.performEventRollByIdEvent(f, b || void 0, v || void 0);
      E && ut.warn(E);
    },
    !0
  ), e.__stRollEventButtonsBoundEvent = !0);
}
function jS(t) {
  const e = globalThis;
  e.__stRollEventCountdownTicker || (e.__stRollEventCountdownTicker = setInterval(() => {
    try {
      t.sweepTimeoutFailuresEvent(), t.refreshCountdownDomEvent();
    } catch (r) {
      ut.warn("倒计时刷新异常", r);
    }
  }, 1e3));
}
function qS(t) {
  const e = globalThis;
  if (e.__stRollEventHooksRegisteredEvent) return;
  const r = t.getLiveContextEvent(), n = r?.eventSource ?? t.eventSource, o = r?.event_types ?? t.event_types ?? {};
  if (!n?.on) return;
  t.loadChatScopedStateIntoRuntimeEvent("hook_register_init").catch((b) => {
    ut.warn("聊天级状态初始化装载失败", b);
  });
  const i = Array.from(
    new Set(
      [o.CHAT_COMPLETION_PROMPT_READY, "chat_completion_prompt_ready"].filter(
        (b) => typeof b == "string" && b.length > 0
      )
    )
  ), c = typeof n.makeLast == "function" ? n.makeLast.bind(n) : n.on.bind(n), d = Array.from(
    new Set(
      [o.GENERATION_ENDED, "generation_ended"].filter(
        (b) => typeof b == "string" && b.length > 0
      )
    )
  ), h = Array.from(
    new Set(
      [
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
      ].filter((b) => typeof b == "string" && b.length > 0)
    )
  );
  for (const b of i)
    c(b, (v) => {
      try {
        t.handlePromptReadyEvent(v, b);
      } catch (E) {
        ut.error("Prompt hook 错误", E);
      }
    });
  for (const b of d)
    n.on(b, () => {
      try {
        t.handleGenerationEndedEvent();
      } catch (v) {
        ut.error("Generation hook 错误", v);
      }
    });
  for (const b of h)
    n.on(b, () => {
      try {
        t.clearDiceMetaEventState(b), t.loadChatScopedStateIntoRuntimeEvent(b).catch((v) => {
          ut.warn(`聊天切换装载失败 (${b})`, v);
        }).finally(() => {
          setTimeout(() => {
            t.sanitizeCurrentChatEventBlocksEvent(), t.sweepTimeoutFailuresEvent(), t.refreshCountdownDomEvent(), t.refreshAllWidgetsFromStateEvent();
          }, 0);
        });
      } catch (v) {
        ut.error("Reset hook 错误", v);
      }
    });
  const f = Array.from(
    new Set(
      [
        o.MESSAGE_SWIPED,
        o.MESSAGE_EDITED,
        o.MESSAGE_DELETED,
        "message_swiped",
        "message_edited",
        "message_deleted"
      ].filter((b) => typeof b == "string" && b.length > 0)
    )
  );
  for (const b of f)
    n.on(b, () => {
      try {
        setTimeout(() => t.refreshAllWidgetsFromStateEvent(), 50);
      } catch (v) {
        ut.warn("Swipe/edit widget refresh 异常", v);
      }
    });
  e.__stRollEventHooksRegisteredEvent = !0;
}
function Ru() {
  return H0();
}
function xo(t) {
  return t > 0 ? `+${t}` : String(t);
}
function FS(t) {
  return t === "advantage" ? "优势" : t === "disadvantage" ? "劣势" : "正常";
}
function VS(t) {
  return t === "auto" ? "自动" : "手动";
}
function YS(t) {
  const e = t.scope === "all" ? "-" : t.skills.join("|"), r = t.scope === "all" ? "全局" : "按技能", n = dn(t.remainingRounds), o = t.enabled ? "启用" : "停用";
  return `- ${t.name} | ${xo(t.modifier)} | 持续=${n} | 范围=${r} | 技能=${e} | ${o}`;
}
function WS(t, e, r) {
  if (!t.enableStatusSystem) return "状态=关闭";
  const n = hl(e, r), o = /* @__PURE__ */ new Map();
  for (const c of e) {
    const d = String(c?.name ?? "").trim().toLowerCase();
    d && o.set(d, c.remainingRounds ?? null);
  }
  if (n.modifier === 0) return "状态=+0";
  const i = n.matched.length > 0 ? `（${n.matched.map(
    (c) => `${c.name}${xo(c.modifier)}(${dn(
      o.get(String(c.name ?? "").trim().toLowerCase()) ?? null
    )})`
  ).join("，")}）` : "";
  return `状态=${xo(n.modifier)}${i}`;
}
function XS(t, e) {
  const r = e.getSettingsEvent(), n = e.getDiceMetaEvent(), o = Ar(n);
  e.ensureRoundEventTimersSyncedEvent(t);
  const i = [];
  if (i.push(`当前轮次: ${t.roundId}`), i.push(`事件数量: ${t.events.length}`), i.push(`状态系统: ${r.enableStatusSystem ? "开启" : "关闭"}`), r.enableStatusSystem)
    if (o.length <= 0)
      i.push("Active_Statuses:"), i.push("- 无");
    else {
      i.push("Active_Statuses:");
      for (const c of o)
        i.push(YS(c));
    }
  for (const c of t.events) {
    const d = e.getEventRuntimeViewStateEvent(t, c), h = e.resolveSkillModifierBySkillNameEvent(c.skill, r), f = WS(r, o, c.skill), b = r.enableDynamicDcReason && c.dcReason ? ` | DC原因=${c.dcReason}` : "";
    i.push(
      `- ${c.id}: ${c.title} | 对象=${c.targetLabel} | 骰式=${c.checkDice} | 条件=${c.compare ?? ">="} ${c.dc}${b} | 技能=${c.skill} | 技能修正=${xo(
        h
      )} | 模式=${VS(c.rollMode)} | 骰态=${FS(
        c.advantageState
      )} | 时限=${$o(c.timeLimit ?? "无")} | ${f} | 状态=${d.text}`
    );
  }
  return i.join(`
`);
}
function JS(t) {
  const {
    SlashCommandParser: e,
    SlashCommand: r,
    SlashCommandArgument: n,
    ARGUMENT_TYPE: o,
    appendToConsoleEvent: i,
    sweepTimeoutFailuresEvent: c,
    getDiceMetaEvent: d,
    getSettingsEvent: h,
    ensureRoundEventTimersSyncedEvent: f,
    getEventRuntimeViewStateEvent: b,
    resolveSkillModifierBySkillNameEvent: v,
    performEventRollByIdEvent: E,
    escapeHtmlEvent: y
  } = t, $ = globalThis;
  $.__stRollEventCommandRegisteredEvent || !e || !r || !n || !o || (e.addCommandObject(
    r.fromProps({
      name: "eventroll",
      aliases: ["eroll"],
      returns: "事件骰子命令：list / roll / help",
      namedArgumentList: [],
      unnamedArgumentList: [
        n.fromProps({
          description: "子命令，例如：list | roll lockpick_gate 1d20+3",
          typeList: o.STRING,
          isRequired: !1
        })
      ],
      helpString: Ru(),
      callback: (O, L) => {
        const D = (L ?? "").toString().trim(), G = D ? D.split(/\s+/) : [], P = (G[0] || "help").toLowerCase();
        if (P === "help")
          return i(Ru()), "";
        if (P === "list") {
          c();
          const X = d().pendingRound;
          if (!X || X.status !== "open")
            return i("当前没有可用事件，请先等待 AI 输出事件 JSON。", "warn"), "";
          const F = z0(
            y(
              XS(X, {
                getSettingsEvent: h,
                getDiceMetaEvent: d,
                ensureRoundEventTimersSyncedEvent: f,
                getEventRuntimeViewStateEvent: b,
                resolveSkillModifierBySkillNameEvent: v
              })
            )
          );
          return i(F), "";
        }
        if (P === "roll") {
          const K = G[1] || "", X = G.length > 2 ? G.slice(2).join(" ") : void 0, F = E(K, X);
          return F && i(F, "error"), "";
        }
        return i("未知子命令，请使用 /eventroll help 查看帮助。", "warn"), "";
      }
    })
  ), $.__stRollEventCommandRegisteredEvent = !0);
}
function QS(t) {
  const {
    SlashCommandParser: e,
    SlashCommand: r,
    getDiceMeta: n,
    getDiceMetaEvent: o,
    escapeHtmlEvent: i,
    appendToConsoleEvent: c
  } = t, d = globalThis;
  d.__stRollDebugCommandRegisteredEvent || !e || !r || (e.addCommandObject(
    r.fromProps({
      name: "rollDebug",
      aliases: ["ddebug"],
      returns: "显示 diceRoller 元数据",
      namedArgumentList: [],
      unnamedArgumentList: [],
      callback: () => {
        const h = n(), f = o(), b = JSON.stringify({ legacy: h, eventMeta: f }, null, 2), v = G0(i(b));
        return c(v), "";
      }
    })
  ), d.__stRollDebugCommandRegisteredEvent = !0);
}
function ZS(t) {
  return SS(t, {
    isAssistantMessageEvent: Oh
  });
}
function tE(t, e) {
  return ES(t, e, {
    simpleHashEvent: om,
    getMessageTextEvent: ge
  });
}
function eE(t) {
  return _S(t, {
    getPreferredAssistantSourceTextEvent: Mh,
    getMessageTextEvent: ge,
    parseEventEnvelopesEvent: Uh,
    removeRangesEvent: Hh,
    setMessageTextEvent: Pn
  });
}
function ep() {
  TS({
    getLiveContextEvent: Xn,
    isAssistantMessageEvent: Oh,
    sanitizeAssistantMessageEventBlocksEvent: eE,
    persistChatSafeEvent: Mm,
    hideEventCodeBlocksInDomEvent: qh
  });
}
const rE = 12, nE = 250;
function es() {
  return yS({
    getLiveContextEvent: Xn,
    getDiceMetaEvent: $t,
    buildEventListCardEvent: fS,
    buildEventRollResultCardEvent: Wh,
    getLatestRollRecordForEvent: Qe
  });
}
function sE(t) {
  return t.hasPendingRound && !t.pendingRoundMounted;
}
function rp(t = 0) {
  ep(), $r(), ts();
  const e = es();
  if (sE(e)) {
    if (t >= rE) {
      ut.warn(`[卡片恢复] 初始化恢复重试耗尽 retry=${t}`);
      return;
    }
    setTimeout(() => {
      rp(t + 1);
    }, nE);
  }
}
const np = {
  getSettingsEvent: St,
  ensureRoundEventTimersSyncedEvent: Ze,
  getLatestRollRecordForEvent: Qe,
  rollExpression: Gm,
  parseDiceExpression: Je,
  resolveSkillModifierBySkillNameEvent: Lo,
  applySkillModifierToDiceResultEvent: Eh,
  normalizeCompareOperatorEvent: Po,
  evaluateSuccessEvent: xv,
  createIdEvent: Ir,
  buildEventRollResultCardEvent: Wh,
  saveLastRoll: $m,
  saveMetadataSafeEvent: Xe
};
function sp(t, e, r) {
  return Gx(t, e, r, {
    ...np,
    sweepTimeoutFailuresEvent: $r,
    getDiceMetaEvent: $t,
    recordTimeoutFailureIfNeededEvent: zh,
    refreshAllWidgetsFromStateEvent: es,
    refreshCountdownDomEvent: ts
  });
}
function oE(t) {
  return Kx(t, {
    ...np,
    getDiceMetaEvent: $t
  });
}
function aE(t = 0) {
  pi(t, {
    getSettingsEvent: St,
    getLiveContextEvent: Xn,
    findLatestAssistantEvent: ZS,
    getDiceMetaEvent: $t,
    buildAssistantMessageIdEvent: tE,
    getPreferredAssistantSourceTextEvent: Mh,
    getMessageTextEvent: ge,
    parseEventEnvelopesEvent: Uh,
    filterEventsByApplyScopeEvent: ux,
    removeRangesEvent: Hh,
    setMessageTextEvent: Pn,
    hideEventCodeBlocksInDomEvent: qh,
    persistChatSafeEvent: Mm,
    mergeEventsIntoPendingRoundEvent: gy,
    autoRollEventsByAiModeEvent: oE,
    refreshAllWidgetsFromStateEvent: es,
    sweepTimeoutFailuresEvent: $r,
    refreshCountdownDomEvent: ts,
    saveMetadataSafeEvent: Xe
  });
}
function iE(t = "chat_reset") {
  if (String(t || "").toLowerCase() !== "chat_reset") {
    const r = $t();
    delete r.lastProcessedAssistantMsgId;
    return;
  }
  kS(t, {
    getDiceMetaEvent: $t,
    saveMetadataSafeEvent: Xe
  });
}
function lE() {
  KS({
    performEventRollByIdEvent: sp,
    refreshAllWidgetsFromStateEvent: es,
    getSettingsEvent: St,
    getDiceMetaEvent: $t
  });
}
function cE() {
  const t = Ao();
  JS({
    SlashCommandParser: t.parser,
    SlashCommand: t.command,
    SlashCommandArgument: t.argument,
    ARGUMENT_TYPE: t.argumentType,
    appendToConsoleEvent: vr,
    sweepTimeoutFailuresEvent: $r,
    getDiceMetaEvent: $t,
    getSettingsEvent: St,
    ensureRoundEventTimersSyncedEvent: Ze,
    getEventRuntimeViewStateEvent: Ll,
    resolveSkillModifierBySkillNameEvent: Lo,
    performEventRollByIdEvent: sp,
    escapeHtmlEvent: cn
  });
}
function uE() {
  jS({
    sweepTimeoutFailuresEvent: $r,
    refreshCountdownDomEvent: ts
  });
}
function dE() {
  qS({
    getLiveContextEvent: Xn,
    eventSource: Vd() ?? void 0,
    event_types: Yd() ?? void 0,
    extractPromptChatFromPayloadEvent: my,
    handlePromptReadyEvent: Sy,
    handleGenerationEndedEvent: aE,
    clearDiceMetaEventState: iE,
    sanitizeCurrentChatEventBlocksEvent: ep,
    sweepTimeoutFailuresEvent: $r,
    refreshCountdownDomEvent: ts,
    loadChatScopedStateIntoRuntimeEvent: Am,
    refreshAllWidgetsFromStateEvent: es
  });
}
function mE() {
  const t = Ao();
  QS({
    SlashCommandParser: t.parser,
    SlashCommand: t.command,
    getDiceMeta: Gn,
    getDiceMetaEvent: $t,
    escapeHtmlEvent: cn,
    appendToConsoleEvent: vr
  });
}
ex();
const hE = 80, pE = 500;
function fE(t) {
  const e = [];
  return t.__stRollEventCommandRegisteredEvent || e.push("event_command"), t.__stRollBaseCommandRegisteredEvent || e.push("base_command"), t.__stRollDebugCommandRegisteredEvent || e.push("debug_command"), t.__stRollEventHooksRegisteredEvent || e.push("event_hooks"), e;
}
function op(t = 0) {
  if (Nl(), tx(), Z0(), lE(), cE(), mE(), dE(), uE(), Am("init_runtime").catch((n) => {
    ut.warn("初始化聊天级状态失败", n);
  }).finally(() => {
    rp();
  }), fE(globalThis).length > 0) {
    t < hE && setTimeout(() => op(t + 1), pE);
    return;
  }
}
const Cu = '@layer theme,base,components,utilities;@layer theme{@theme default{ --font-sans: ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"; --font-serif: ui-serif, Georgia, Cambria, "Times New Roman", Times, serif; --font-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; --color-red-50: oklch(97.1% .013 17.38); --color-red-100: oklch(93.6% .032 17.717); --color-red-200: oklch(88.5% .062 18.334); --color-red-300: oklch(80.8% .114 19.571); --color-red-400: oklch(70.4% .191 22.216); --color-red-500: oklch(63.7% .237 25.331); --color-red-600: oklch(57.7% .245 27.325); --color-red-700: oklch(50.5% .213 27.518); --color-red-800: oklch(44.4% .177 26.899); --color-red-900: oklch(39.6% .141 25.723); --color-red-950: oklch(25.8% .092 26.042); --color-orange-50: oklch(98% .016 73.684); --color-orange-100: oklch(95.4% .038 75.164); --color-orange-200: oklch(90.1% .076 70.697); --color-orange-300: oklch(83.7% .128 66.29); --color-orange-400: oklch(75% .183 55.934); --color-orange-500: oklch(70.5% .213 47.604); --color-orange-600: oklch(64.6% .222 41.116); --color-orange-700: oklch(55.3% .195 38.402); --color-orange-800: oklch(47% .157 37.304); --color-orange-900: oklch(40.8% .123 38.172); --color-orange-950: oklch(26.6% .079 36.259); --color-amber-50: oklch(98.7% .022 95.277); --color-amber-100: oklch(96.2% .059 95.617); --color-amber-200: oklch(92.4% .12 95.746); --color-amber-300: oklch(87.9% .169 91.605); --color-amber-400: oklch(82.8% .189 84.429); --color-amber-500: oklch(76.9% .188 70.08); --color-amber-600: oklch(66.6% .179 58.318); --color-amber-700: oklch(55.5% .163 48.998); --color-amber-800: oklch(47.3% .137 46.201); --color-amber-900: oklch(41.4% .112 45.904); --color-amber-950: oklch(27.9% .077 45.635); --color-yellow-50: oklch(98.7% .026 102.212); --color-yellow-100: oklch(97.3% .071 103.193); --color-yellow-200: oklch(94.5% .129 101.54); --color-yellow-300: oklch(90.5% .182 98.111); --color-yellow-400: oklch(85.2% .199 91.936); --color-yellow-500: oklch(79.5% .184 86.047); --color-yellow-600: oklch(68.1% .162 75.834); --color-yellow-700: oklch(55.4% .135 66.442); --color-yellow-800: oklch(47.6% .114 61.907); --color-yellow-900: oklch(42.1% .095 57.708); --color-yellow-950: oklch(28.6% .066 53.813); --color-lime-50: oklch(98.6% .031 120.757); --color-lime-100: oklch(96.7% .067 122.328); --color-lime-200: oklch(93.8% .127 124.321); --color-lime-300: oklch(89.7% .196 126.665); --color-lime-400: oklch(84.1% .238 128.85); --color-lime-500: oklch(76.8% .233 130.85); --color-lime-600: oklch(64.8% .2 131.684); --color-lime-700: oklch(53.2% .157 131.589); --color-lime-800: oklch(45.3% .124 130.933); --color-lime-900: oklch(40.5% .101 131.063); --color-lime-950: oklch(27.4% .072 132.109); --color-green-50: oklch(98.2% .018 155.826); --color-green-100: oklch(96.2% .044 156.743); --color-green-200: oklch(92.5% .084 155.995); --color-green-300: oklch(87.1% .15 154.449); --color-green-400: oklch(79.2% .209 151.711); --color-green-500: oklch(72.3% .219 149.579); --color-green-600: oklch(62.7% .194 149.214); --color-green-700: oklch(52.7% .154 150.069); --color-green-800: oklch(44.8% .119 151.328); --color-green-900: oklch(39.3% .095 152.535); --color-green-950: oklch(26.6% .065 152.934); --color-emerald-50: oklch(97.9% .021 166.113); --color-emerald-100: oklch(95% .052 163.051); --color-emerald-200: oklch(90.5% .093 164.15); --color-emerald-300: oklch(84.5% .143 164.978); --color-emerald-400: oklch(76.5% .177 163.223); --color-emerald-500: oklch(69.6% .17 162.48); --color-emerald-600: oklch(59.6% .145 163.225); --color-emerald-700: oklch(50.8% .118 165.612); --color-emerald-800: oklch(43.2% .095 166.913); --color-emerald-900: oklch(37.8% .077 168.94); --color-emerald-950: oklch(26.2% .051 172.552); --color-teal-50: oklch(98.4% .014 180.72); --color-teal-100: oklch(95.3% .051 180.801); --color-teal-200: oklch(91% .096 180.426); --color-teal-300: oklch(85.5% .138 181.071); --color-teal-400: oklch(77.7% .152 181.912); --color-teal-500: oklch(70.4% .14 182.503); --color-teal-600: oklch(60% .118 184.704); --color-teal-700: oklch(51.1% .096 186.391); --color-teal-800: oklch(43.7% .078 188.216); --color-teal-900: oklch(38.6% .063 188.416); --color-teal-950: oklch(27.7% .046 192.524); --color-cyan-50: oklch(98.4% .019 200.873); --color-cyan-100: oklch(95.6% .045 203.388); --color-cyan-200: oklch(91.7% .08 205.041); --color-cyan-300: oklch(86.5% .127 207.078); --color-cyan-400: oklch(78.9% .154 211.53); --color-cyan-500: oklch(71.5% .143 215.221); --color-cyan-600: oklch(60.9% .126 221.723); --color-cyan-700: oklch(52% .105 223.128); --color-cyan-800: oklch(45% .085 224.283); --color-cyan-900: oklch(39.8% .07 227.392); --color-cyan-950: oklch(30.2% .056 229.695); --color-sky-50: oklch(97.7% .013 236.62); --color-sky-100: oklch(95.1% .026 236.824); --color-sky-200: oklch(90.1% .058 230.902); --color-sky-300: oklch(82.8% .111 230.318); --color-sky-400: oklch(74.6% .16 232.661); --color-sky-500: oklch(68.5% .169 237.323); --color-sky-600: oklch(58.8% .158 241.966); --color-sky-700: oklch(50% .134 242.749); --color-sky-800: oklch(44.3% .11 240.79); --color-sky-900: oklch(39.1% .09 240.876); --color-sky-950: oklch(29.3% .066 243.157); --color-blue-50: oklch(97% .014 254.604); --color-blue-100: oklch(93.2% .032 255.585); --color-blue-200: oklch(88.2% .059 254.128); --color-blue-300: oklch(80.9% .105 251.813); --color-blue-400: oklch(70.7% .165 254.624); --color-blue-500: oklch(62.3% .214 259.815); --color-blue-600: oklch(54.6% .245 262.881); --color-blue-700: oklch(48.8% .243 264.376); --color-blue-800: oklch(42.4% .199 265.638); --color-blue-900: oklch(37.9% .146 265.522); --color-blue-950: oklch(28.2% .091 267.935); --color-indigo-50: oklch(96.2% .018 272.314); --color-indigo-100: oklch(93% .034 272.788); --color-indigo-200: oklch(87% .065 274.039); --color-indigo-300: oklch(78.5% .115 274.713); --color-indigo-400: oklch(67.3% .182 276.935); --color-indigo-500: oklch(58.5% .233 277.117); --color-indigo-600: oklch(51.1% .262 276.966); --color-indigo-700: oklch(45.7% .24 277.023); --color-indigo-800: oklch(39.8% .195 277.366); --color-indigo-900: oklch(35.9% .144 278.697); --color-indigo-950: oklch(25.7% .09 281.288); --color-violet-50: oklch(96.9% .016 293.756); --color-violet-100: oklch(94.3% .029 294.588); --color-violet-200: oklch(89.4% .057 293.283); --color-violet-300: oklch(81.1% .111 293.571); --color-violet-400: oklch(70.2% .183 293.541); --color-violet-500: oklch(60.6% .25 292.717); --color-violet-600: oklch(54.1% .281 293.009); --color-violet-700: oklch(49.1% .27 292.581); --color-violet-800: oklch(43.2% .232 292.759); --color-violet-900: oklch(38% .189 293.745); --color-violet-950: oklch(28.3% .141 291.089); --color-purple-50: oklch(97.7% .014 308.299); --color-purple-100: oklch(94.6% .033 307.174); --color-purple-200: oklch(90.2% .063 306.703); --color-purple-300: oklch(82.7% .119 306.383); --color-purple-400: oklch(71.4% .203 305.504); --color-purple-500: oklch(62.7% .265 303.9); --color-purple-600: oklch(55.8% .288 302.321); --color-purple-700: oklch(49.6% .265 301.924); --color-purple-800: oklch(43.8% .218 303.724); --color-purple-900: oklch(38.1% .176 304.987); --color-purple-950: oklch(29.1% .149 302.717); --color-fuchsia-50: oklch(97.7% .017 320.058); --color-fuchsia-100: oklch(95.2% .037 318.852); --color-fuchsia-200: oklch(90.3% .076 319.62); --color-fuchsia-300: oklch(83.3% .145 321.434); --color-fuchsia-400: oklch(74% .238 322.16); --color-fuchsia-500: oklch(66.7% .295 322.15); --color-fuchsia-600: oklch(59.1% .293 322.896); --color-fuchsia-700: oklch(51.8% .253 323.949); --color-fuchsia-800: oklch(45.2% .211 324.591); --color-fuchsia-900: oklch(40.1% .17 325.612); --color-fuchsia-950: oklch(29.3% .136 325.661); --color-pink-50: oklch(97.1% .014 343.198); --color-pink-100: oklch(94.8% .028 342.258); --color-pink-200: oklch(89.9% .061 343.231); --color-pink-300: oklch(82.3% .12 346.018); --color-pink-400: oklch(71.8% .202 349.761); --color-pink-500: oklch(65.6% .241 354.308); --color-pink-600: oklch(59.2% .249 .584); --color-pink-700: oklch(52.5% .223 3.958); --color-pink-800: oklch(45.9% .187 3.815); --color-pink-900: oklch(40.8% .153 2.432); --color-pink-950: oklch(28.4% .109 3.907); --color-rose-50: oklch(96.9% .015 12.422); --color-rose-100: oklch(94.1% .03 12.58); --color-rose-200: oklch(89.2% .058 10.001); --color-rose-300: oklch(81% .117 11.638); --color-rose-400: oklch(71.2% .194 13.428); --color-rose-500: oklch(64.5% .246 16.439); --color-rose-600: oklch(58.6% .253 17.585); --color-rose-700: oklch(51.4% .222 16.935); --color-rose-800: oklch(45.5% .188 13.697); --color-rose-900: oklch(41% .159 10.272); --color-rose-950: oklch(27.1% .105 12.094); --color-slate-50: oklch(98.4% .003 247.858); --color-slate-100: oklch(96.8% .007 247.896); --color-slate-200: oklch(92.9% .013 255.508); --color-slate-300: oklch(86.9% .022 252.894); --color-slate-400: oklch(70.4% .04 256.788); --color-slate-500: oklch(55.4% .046 257.417); --color-slate-600: oklch(44.6% .043 257.281); --color-slate-700: oklch(37.2% .044 257.287); --color-slate-800: oklch(27.9% .041 260.031); --color-slate-900: oklch(20.8% .042 265.755); --color-slate-950: oklch(12.9% .042 264.695); --color-gray-50: oklch(98.5% .002 247.839); --color-gray-100: oklch(96.7% .003 264.542); --color-gray-200: oklch(92.8% .006 264.531); --color-gray-300: oklch(87.2% .01 258.338); --color-gray-400: oklch(70.7% .022 261.325); --color-gray-500: oklch(55.1% .027 264.364); --color-gray-600: oklch(44.6% .03 256.802); --color-gray-700: oklch(37.3% .034 259.733); --color-gray-800: oklch(27.8% .033 256.848); --color-gray-900: oklch(21% .034 264.665); --color-gray-950: oklch(13% .028 261.692); --color-zinc-50: oklch(98.5% 0 0); --color-zinc-100: oklch(96.7% .001 286.375); --color-zinc-200: oklch(92% .004 286.32); --color-zinc-300: oklch(87.1% .006 286.286); --color-zinc-400: oklch(70.5% .015 286.067); --color-zinc-500: oklch(55.2% .016 285.938); --color-zinc-600: oklch(44.2% .017 285.786); --color-zinc-700: oklch(37% .013 285.805); --color-zinc-800: oklch(27.4% .006 286.033); --color-zinc-900: oklch(21% .006 285.885); --color-zinc-950: oklch(14.1% .005 285.823); --color-neutral-50: oklch(98.5% 0 0); --color-neutral-100: oklch(97% 0 0); --color-neutral-200: oklch(92.2% 0 0); --color-neutral-300: oklch(87% 0 0); --color-neutral-400: oklch(70.8% 0 0); --color-neutral-500: oklch(55.6% 0 0); --color-neutral-600: oklch(43.9% 0 0); --color-neutral-700: oklch(37.1% 0 0); --color-neutral-800: oklch(26.9% 0 0); --color-neutral-900: oklch(20.5% 0 0); --color-neutral-950: oklch(14.5% 0 0); --color-stone-50: oklch(98.5% .001 106.423); --color-stone-100: oklch(97% .001 106.424); --color-stone-200: oklch(92.3% .003 48.717); --color-stone-300: oklch(86.9% .005 56.366); --color-stone-400: oklch(70.9% .01 56.259); --color-stone-500: oklch(55.3% .013 58.071); --color-stone-600: oklch(44.4% .011 73.639); --color-stone-700: oklch(37.4% .01 67.558); --color-stone-800: oklch(26.8% .007 34.298); --color-stone-900: oklch(21.6% .006 56.043); --color-stone-950: oklch(14.7% .004 49.25); --color-mauve-50: oklch(98.5% 0 0); --color-mauve-100: oklch(96% .003 325.6); --color-mauve-200: oklch(92.2% .005 325.62); --color-mauve-300: oklch(86.5% .012 325.68); --color-mauve-400: oklch(71.1% .019 323.02); --color-mauve-500: oklch(54.2% .034 322.5); --color-mauve-600: oklch(43.5% .029 321.78); --color-mauve-700: oklch(36.4% .029 323.89); --color-mauve-800: oklch(26.3% .024 320.12); --color-mauve-900: oklch(21.2% .019 322.12); --color-mauve-950: oklch(14.5% .008 326); --color-olive-50: oklch(98.8% .003 106.5); --color-olive-100: oklch(96.6% .005 106.5); --color-olive-200: oklch(93% .007 106.5); --color-olive-300: oklch(88% .011 106.6); --color-olive-400: oklch(73.7% .021 106.9); --color-olive-500: oklch(58% .031 107.3); --color-olive-600: oklch(46.6% .025 107.3); --color-olive-700: oklch(39.4% .023 107.4); --color-olive-800: oklch(28.6% .016 107.4); --color-olive-900: oklch(22.8% .013 107.4); --color-olive-950: oklch(15.3% .006 107.1); --color-mist-50: oklch(98.7% .002 197.1); --color-mist-100: oklch(96.3% .002 197.1); --color-mist-200: oklch(92.5% .005 214.3); --color-mist-300: oklch(87.2% .007 219.6); --color-mist-400: oklch(72.3% .014 214.4); --color-mist-500: oklch(56% .021 213.5); --color-mist-600: oklch(45% .017 213.2); --color-mist-700: oklch(37.8% .015 216); --color-mist-800: oklch(27.5% .011 216.9); --color-mist-900: oklch(21.8% .008 223.9); --color-mist-950: oklch(14.8% .004 228.8); --color-taupe-50: oklch(98.6% .002 67.8); --color-taupe-100: oklch(96% .002 17.2); --color-taupe-200: oklch(92.2% .005 34.3); --color-taupe-300: oklch(86.8% .007 39.5); --color-taupe-400: oklch(71.4% .014 41.2); --color-taupe-500: oklch(54.7% .021 43.1); --color-taupe-600: oklch(43.8% .017 39.3); --color-taupe-700: oklch(36.7% .016 35.7); --color-taupe-800: oklch(26.8% .011 36.5); --color-taupe-900: oklch(21.4% .009 43.1); --color-taupe-950: oklch(14.7% .004 49.3); --color-black: #000; --color-white: #fff; --spacing: .25rem; --breakpoint-sm: 40rem; --breakpoint-md: 48rem; --breakpoint-lg: 64rem; --breakpoint-xl: 80rem; --breakpoint-2xl: 96rem; --container-3xs: 16rem; --container-2xs: 18rem; --container-xs: 20rem; --container-sm: 24rem; --container-md: 28rem; --container-lg: 32rem; --container-xl: 36rem; --container-2xl: 42rem; --container-3xl: 48rem; --container-4xl: 56rem; --container-5xl: 64rem; --container-6xl: 72rem; --container-7xl: 80rem; --text-xs: .75rem; --text-xs--line-height: calc(1 / .75); --text-sm: .875rem; --text-sm--line-height: calc(1.25 / .875); --text-base: 1rem; --text-base--line-height: 1.5 ; --text-lg: 1.125rem; --text-lg--line-height: calc(1.75 / 1.125); --text-xl: 1.25rem; --text-xl--line-height: calc(1.75 / 1.25); --text-2xl: 1.5rem; --text-2xl--line-height: calc(2 / 1.5); --text-3xl: 1.875rem; --text-3xl--line-height: 1.2 ; --text-4xl: 2.25rem; --text-4xl--line-height: calc(2.5 / 2.25); --text-5xl: 3rem; --text-5xl--line-height: 1; --text-6xl: 3.75rem; --text-6xl--line-height: 1; --text-7xl: 4.5rem; --text-7xl--line-height: 1; --text-8xl: 6rem; --text-8xl--line-height: 1; --text-9xl: 8rem; --text-9xl--line-height: 1; --font-weight-thin: 100; --font-weight-extralight: 200; --font-weight-light: 300; --font-weight-normal: 400; --font-weight-medium: 500; --font-weight-semibold: 600; --font-weight-bold: 700; --font-weight-extrabold: 800; --font-weight-black: 900; --tracking-tighter: -.05em; --tracking-tight: -.025em; --tracking-normal: 0em; --tracking-wide: .025em; --tracking-wider: .05em; --tracking-widest: .1em; --leading-tight: 1.25; --leading-snug: 1.375; --leading-normal: 1.5; --leading-relaxed: 1.625; --leading-loose: 2; --radius-xs: .125rem; --radius-sm: .25rem; --radius-md: .375rem; --radius-lg: .5rem; --radius-xl: .75rem; --radius-2xl: 1rem; --radius-3xl: 1.5rem; --radius-4xl: 2rem; --shadow-2xs: 0 1px rgb(0 0 0 / .05); --shadow-xs: 0 1px 2px 0 rgb(0 0 0 / .05); --shadow-sm: 0 1px 3px 0 rgb(0 0 0 / .1), 0 1px 2px -1px rgb(0 0 0 / .1); --shadow-md: 0 4px 6px -1px rgb(0 0 0 / .1), 0 2px 4px -2px rgb(0 0 0 / .1); --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / .1), 0 4px 6px -4px rgb(0 0 0 / .1); --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / .1), 0 8px 10px -6px rgb(0 0 0 / .1); --shadow-2xl: 0 25px 50px -12px rgb(0 0 0 / .25); --inset-shadow-2xs: inset 0 1px rgb(0 0 0 / .05); --inset-shadow-xs: inset 0 1px 1px rgb(0 0 0 / .05); --inset-shadow-sm: inset 0 2px 4px rgb(0 0 0 / .05); --drop-shadow-xs: 0 1px 1px rgb(0 0 0 / .05); --drop-shadow-sm: 0 1px 2px rgb(0 0 0 / .15); --drop-shadow-md: 0 3px 3px rgb(0 0 0 / .12); --drop-shadow-lg: 0 4px 4px rgb(0 0 0 / .15); --drop-shadow-xl: 0 9px 7px rgb(0 0 0 / .1); --drop-shadow-2xl: 0 25px 25px rgb(0 0 0 / .15); --text-shadow-2xs: 0px 1px 0px rgb(0 0 0 / .15); --text-shadow-xs: 0px 1px 1px rgb(0 0 0 / .2); --text-shadow-sm: 0px 1px 0px rgb(0 0 0 / .075), 0px 1px 1px rgb(0 0 0 / .075), 0px 2px 2px rgb(0 0 0 / .075); --text-shadow-md: 0px 1px 1px rgb(0 0 0 / .1), 0px 1px 2px rgb(0 0 0 / .1), 0px 2px 4px rgb(0 0 0 / .1); --text-shadow-lg: 0px 1px 2px rgb(0 0 0 / .1), 0px 3px 2px rgb(0 0 0 / .1), 0px 4px 8px rgb(0 0 0 / .1); --ease-in: cubic-bezier(.4, 0, 1, 1); --ease-out: cubic-bezier(0, 0, .2, 1); --ease-in-out: cubic-bezier(.4, 0, .2, 1); --animate-spin: spin 1s linear infinite; --animate-ping: ping 1s cubic-bezier(0, 0, .2, 1) infinite; --animate-pulse: pulse 2s cubic-bezier(.4, 0, .6, 1) infinite; --animate-bounce: bounce 1s infinite; @keyframes spin { to { transform: rotate(360deg); } } @keyframes ping { 75%, 100% { transform: scale(2); opacity: 0; } } @keyframes pulse { 50% { opacity: .5; } } @keyframes bounce { 0%, 100% { transform: translateY(-25%); animation-timing-function: cubic-bezier(.8, 0, 1, 1); } 50% { transform: none; animation-timing-function: cubic-bezier(0, 0, .2, 1); } } --blur-xs: 4px; --blur-sm: 8px; --blur-md: 12px; --blur-lg: 16px; --blur-xl: 24px; --blur-2xl: 40px; --blur-3xl: 64px; --perspective-dramatic: 100px; --perspective-near: 300px; --perspective-normal: 500px; --perspective-midrange: 800px; --perspective-distant: 1200px; --aspect-video: 16 / 9; --default-transition-duration: .15s; --default-transition-timing-function: cubic-bezier(.4, 0, .2, 1); --default-font-family: --theme(--font-sans, initial); --default-font-feature-settings: --theme(--font-sans--font-feature-settings, initial); --default-font-variation-settings: --theme(--font-sans--font-variation-settings, initial); --default-mono-font-family: --theme(--font-mono, initial); --default-mono-font-feature-settings: --theme(--font-mono--font-feature-settings, initial); --default-mono-font-variation-settings: --theme(--font-mono--font-variation-settings, initial); }@theme default inline reference{ --blur: 8px; --shadow: 0 1px 3px 0 rgb(0 0 0 / .1), 0 1px 2px -1px rgb(0 0 0 / .1); --shadow-inner: inset 0 2px 4px 0 rgb(0 0 0 / .05); --drop-shadow: 0 1px 2px rgb(0 0 0 / .1), 0 1px 1px rgb(0 0 0 / .06); --radius: .25rem; --max-width-prose: 65ch; }}@layer utilities{@tailwind utilities;}@source not "../MemoryOS/dist";@source not "../LLMHub/dist";@source not "../RollHelper/dist";:where(.stx-tw){color:var(--ss-theme-text, var(--SmartThemeBodyColor, inherit))}@utility stx-text-base{font-size: 13px; line-height: 1.5;}@utility stx-text-sm{font-size: 12px; line-height: 1.45;}@utility stx-text-muted{color: color-mix(in srgb,var(--ss-theme-text, #fff) 64%,transparent);}', Du = "stx-tailwind-runtime-style", Nu = "custom-", gE = /\.(?=[A-Za-z_\\])((?:\\.|[A-Za-z0-9_%@/\-[\]:])+)/g;
function bE(t) {
  return t.replace(gE, (e, r) => r.startsWith(Nu) ? e : `.${Nu}${r}`);
}
const za = `${Cu}
${bE(Cu)}`;
function vE() {
  const t = document.getElementById(Du);
  if (t instanceof HTMLStyleElement)
    return t.textContent !== za && (t.textContent = za), t;
  const e = document.createElement("style");
  return e.id = Du, e.textContent = za, document.head.appendChild(e), e;
}
function xE() {
  const t = globalThis;
  t.__stDiceRollerEventLoaded = !0, vE(), op();
}
const ut = new wr("骰子助手");
ut.info("骰子助手组件已载入环境");
zp("ping", "stx_rollhelper", async () => ({
  alive: !0,
  version: "1.0.0",
  isEnabled: !0,
  capabilities: ["roll", "event", "bus", "ui"]
}));
Mu("state_changed", {
  namespace: "stx_rollhelper",
  isEnabled: !0
}, "stx_rollhelper");
xE();
export {
  ut as logger
};
//# sourceMappingURL=index.js.map
