var mt=class t{static SYSTEM_NAME="SS-Helper";pluginName;isQuiet;constructor(e,n={}){this.pluginName=e,this.isQuiet=n.quiet??!1}getPrefix(e){return`[${t.SYSTEM_NAME}]-[${this.pluginName}]-[${e}]`}print(e,n,...r){let s=this.getPrefix(e);console.log(`%c${s}`,`color: #fff; background: ${n}; padding: 2px 5px; border-radius: 4px; font-weight: 600; font-size: 11px;`,...r)}debug(...e){this.isQuiet||this.print("DEBUG","#6b7280",...e)}info(...e){this.isQuiet||this.print("INFO","#3b82f6",...e)}success(...e){this.print("SUCCESS","#10b981",...e)}warn(...e){this.print("WARN","#f59e0b",...e)}error(...e){let n=this.getPrefix("ERROR");console.error(`%c${n}`,"color: #fff; background: #ef4444; padding: 2px 5px; border-radius: 4px; font-weight: 600; font-size: 11px;",...e)}setQuiet(e){this.isQuiet=e}};var $a={"plugin:broadcast:state_changed":{id:"plugin:broadcast:state_changed",type:"broadcast",owner:"system",description:"\u901A\u7528\u72B6\u6001\u66F4\u65B0\u5E7F\u64AD\u3002\u6240\u6709\u63D2\u4EF6\u5747\u53EF\u53D1\u51FA\u5176\u81EA\u8EAB\u7684 enabled \u7B49\u8FD0\u884C\u72B6\u6001\u6539\u53D8\u4FE1\u606F\u3002",allowlist:["*"]},"plugin:request:ping":{id:"plugin:request:ping",type:"rpc",owner:"system",description:"\u670D\u52A1\u6D3B\u6027\u6D4B\u8BD5\u3002\u7528\u4E8E\u786E\u8BA4\u5BF9\u8C61\u670D\u52A1\u662F\u5426 Alive \u53CA\u62C9\u53D6\u5176 capabilities\u3002",allowlist:["*"]},"plugin:request:hello":{id:"plugin:request:hello",type:"rpc",owner:"stx_llmhub",description:"\u53CC\u5411\u6D4B\u4F8B: LLMHub \u4E13\u4F9B\u95EE\u5019\u63A5\u53E3\u3002",allowlist:["stx_memory_os","stx_template"]}};function us(t,e){let n=$a[t];return!n||!n.allowlist||n.allowlist.length===0||n.allowlist.includes("*")?!0:n.allowlist.includes(e)}var xt=new mt("STXBus-RPC"),hn=new Set,Pa=5e3;function Oa(t){return hn.has(t)?!0:(hn.add(t),setTimeout(()=>hn.delete(t),Pa),!1)}var In=new Map,Es=100;async function xn(t,e,n,r={}){let s=window.STX?.bus;if(!s)throw new Error("STX.bus has not been initialized yet.");if(In.size>=Es)throw new Error(`[RPC Guard] Active requests exceeded ${Es}. Request dropped.`);let i=crypto.randomUUID(),o=r.timeoutMs??5e3,l=`plugin:response:${i}`,a={v:1,type:"rpc:req",reqId:i,topic:t,from:n,to:r.to,ts:Date.now(),ttlMs:o,data:e};return In.set(i,{ts:a.ts}),new Promise((d,c)=>{let u,E=()=>{},v=()=>{clearTimeout(u),E(),In.delete(i),r.signal&&r.signal.removeEventListener("abort",m)},m=()=>{v(),c(new Error(`RPC_ABORT: Request ${i} was manually aborted.`))};if(r.signal){if(r.signal.aborted)return m();r.signal.addEventListener("abort",m)}E=s.once(l,f=>{let S=f?.payload??f;if(!S||S.type!=="rpc:res")return;let g=S;v(),xt.info(`[Response <- ${t}] \u6536\u5230\u56DE\u6267, from: ${g.from}, reqId: ${i}, \u8017\u65F6: ${Date.now()-a.ts}ms`),g.ok?d(g.data):c(new Error(`[RPC Error] ${g.error?.code}: ${g.error?.message}`))}),u=setTimeout(()=>{v(),xt.warn(`[Timeout] \u8BF7\u6C42\u53D1\u5F80 ${t} \u5728 ${o}ms \u540E\u8D85\u65F6\u65E0\u54CD\u5E94, reqId: ${i}`),c(new Error(`[RPC_TIMEOUT] The request ${i} towards ${t} timed out after ${o}ms.`))},o),xt.info(`[Request -> ${t}] \u53D1\u8D77\u8C03\u7528, to: ${r.to||"ALL"}, reqId: ${i}`),s.emit(t,a)})}function ms(t,e,n){let r=window.STX?.bus;if(!r)return()=>{};let s=async i=>{let o=i?.payload??i;if(!o||o.type!=="rpc:req")return;let l=o;if(!(l.to&&l.to!==e)){if(!us(t,l.from))return vs(l.reqId,l.from,e,{code:"RPC_PERMISSION_DENIED",message:`Namespace ${l.from} is strictly NOT allowed to invoke ${t}.`});if(Oa(l.reqId)){xt.warn(`[RPC Idempotency] \u62E6\u622A\u5230\u91CD\u590D\u7684\u5E76\u53D1\u8C03\u7528\uFF0C\u5DF2\u5C4F\u853D\u6267\u884C, reqId: ${l.reqId}`);return}try{xt.info(`[Handler <- ${t}] \u5F00\u59CB\u63A5\u7BA1\u4E1A\u52A1\u8BF7\u6C42, from: ${l.from}, reqId: ${l.reqId}`);let a=await n(l.data,l),d={v:1,type:"rpc:res",reqId:l.reqId,topic:`plugin:response:${l.reqId}`,from:e,to:l.from,ts:Date.now(),ok:!0,data:a};xt.info(`[Response -> ${d.topic}] \u4E1A\u52A1\u5C31\u7EEA\u4E0B\u53D1\u56DE\u6267, to: ${l.from}, reqId: ${l.reqId}`),r.emit(d.topic,d)}catch(a){xt.error(`[Handler Error] \u5FAE\u670D\u52A1\u63D0\u4F9B\u65B9\u5185\u90E8\u53D1\u751F\u5D29\u6E83\u629B\u9519, topic: ${t}, reqId: ${l.reqId}`,a),vs(l.reqId,l.from,e,{code:"RPC_HANDLER_ERROR",message:a?.message||"Unknown internal service exception occurred."})}}};return r.on(t,s)}function vs(t,e,n,r){let s=window.STX?.bus;if(!s)return;let i={v:1,type:"rpc:res",reqId:t,topic:`plugin:response:${t}`,from:n,to:e,ts:Date.now(),ok:!1,error:r};s.emit(i.topic,i)}var yn=new mt("STXBus-Broadcast");function gs(t,e,n){let r=window.STX?.bus;if(!r){yn.warn(`[Broadcast] \u5C1D\u8BD5\u53D1\u51FA ${t}\uFF0C\u4F46 STX.bus \u672A\u6302\u8F7D\u3002`);return}let s={v:1,type:"broadcast",topic:t,from:n,ts:Date.now(),data:e};yn.info(`[Broadcast -> ${t}] \u53D1\u9001\u5E7F\u64AD, from: ${n}`),r.emit(t,s)}function Ss(t,e,n){let r=window.STX?.bus;if(!r)return()=>{};let s=i=>{let o=i?.payload??i;if(!o||o.v!==1||o.type!=="broadcast")return;let l=o;n?.from&&l.from!==n.from||(yn.info(`[Subscribe <- ${t}] \u6536\u5230\u5E7F\u64AD\u6D88\u606F, from: ${l.from}`),e(l.data,l))};return r.on(t,s)}function ps(t){return`
    <div class="inline-drawer st-roll-shell">
      <div class="inline-drawer-toggle inline-drawer-header st-roll-head" id="${t.drawerToggleId}">
        <div class="st-roll-head-title">
          <span style="margin-bottom: 2px;">${t.displayName}</span>
          <span id="${t.badgeId}" class="st-roll-head-badge">${t.badgeText}</span>
        </div>
        <div id="${t.drawerIconId}" class="inline-drawer-icon fa-solid fa-circle-chevron-down down interactable" tabindex="0" role="button"></div>
      </div>

      <div class="inline-drawer-content st-roll-content" id="${t.drawerContentId}" style="display:none;">
        <div class="st-roll-filters flex-container">
          <input id="${t.searchId}" class="text_pole flex1 st-roll-search" placeholder="\u641C\u7D22\u8BBE\u7F6E" type="search" />
        </div>

        <div class="st-roll-tabs">
          <button id="${t.tabMainId}" type="button" class="st-roll-tab is-active">
            <i class="fa-solid fa-gear"></i><span>\u4E3B\u8BBE\u7F6E</span>
          </button>
          <button id="${t.tabSkillId}" type="button" class="st-roll-tab">
            <i class="fa-solid fa-bolt"></i><span>\u6280\u80FD</span>
          </button>
          <button id="${t.tabRuleId}" type="button" class="st-roll-tab">
            <i class="fa-solid fa-scroll"></i><span>\u89C4\u5219</span>
          </button>
          <button id="${t.tabAboutId}" type="button" class="st-roll-tab">
            <i class="fa-solid fa-circle-info"></i><span>\u5173\u4E8E</span>
          </button>
        </div>

        <div id="${t.panelMainId}" class="st-roll-panel">
          <div class="st-roll-divider"><i class="fa-solid fa-power-off"></i><span>\u57FA\u7840\u5F00\u5173</span><div class="st-roll-divider-line"></div></div>

          <label class="st-roll-item st-roll-search-item" data-st-roll-search="enable event dice plugin">
            <div class="st-roll-item-main">
              <div class="st-roll-item-title">\u542F\u7528\u4E8B\u4EF6\u9AB0\u5B50\u7CFB\u7EDF</div>
              <div class="st-roll-item-desc">\u603B\u5F00\u5173\u3002\u5173\u95ED\u540E\u5C06\u4E0D\u518D\u89E3\u6790\u4E8B\u4EF6\uFF0C\u4E5F\u4E0D\u4F1A\u6267\u884C\u4E8B\u4EF6\u68C0\u5B9A\u3002</div>
            </div>
            <div class="st-roll-inline"><input id="${t.enabledId}" type="checkbox" /></div>
          </label>

          <div class="st-roll-item st-roll-search-item" data-st-roll-search="scope protagonist all">
            <div class="st-roll-item-main">
              <div class="st-roll-item-title">\u4E8B\u4EF6\u5E94\u7528\u8303\u56F4</div>
              <div class="st-roll-item-desc">\u9009\u62E9\u53EA\u5904\u7406\u4E3B\u89D2\u4E8B\u4EF6\uFF0C\u6216\u5904\u7406\u6240\u6709\u89D2\u8272\u4E8B\u4EF6\u3002</div>
            </div>
            <div class="st-roll-row">
              <select id="${t.scopeId}" class="st-roll-select">
                <option value="protagonist_only">\u4EC5\u4E3B\u89D2\u4E8B\u4EF6</option>
                <option value="all">\u5168\u90E8\u4E8B\u4EF6</option>
              </select>
            </div>
          </div>

          <div class="st-roll-divider"><i class="fa-solid fa-robot"></i><span>AI \u534F\u8BAE</span><div class="st-roll-divider-line"></div></div>

          <label class="st-roll-item st-roll-search-item" data-st-roll-search="auto send rule inject">
            <div class="st-roll-item-main">
              <div class="st-roll-item-title">\u9ED8\u8BA4\u53D1\u9001\u89C4\u5219\u7ED9 AI</div>
              <div class="st-roll-item-desc">\u4F60\u53D1\u9001\u6D88\u606F\u524D\uFF0C\u81EA\u52A8\u9644\u52A0\u89C4\u5219\u548C\u6458\u8981\uFF0C\u51CF\u5C11 AI \u8F93\u51FA\u683C\u5F0F\u9519\u8BEF\u3002</div>
            </div>
            <div class="st-roll-inline"><input id="${t.ruleId}" type="checkbox" /></div>
          </label>

          <label class="st-roll-item st-roll-search-item" data-st-roll-search="rollMode auto manual">
            <div class="st-roll-item-main">
              <div class="st-roll-item-title">\u5141\u8BB8 AI \u51B3\u5B9A\u81EA\u52A8/\u624B\u52A8\u63B7\u9AB0</div>
              <div class="st-roll-item-desc">\u5F00\u542F\u540E AI \u53EF\u628A\u4E8B\u4EF6\u8BBE\u4E3A\u81EA\u52A8\u63B7\u9AB0\uFF1B\u5173\u95ED\u540E\u90FD\u9700\u8981\u4F60\u624B\u52A8\u63B7\u9AB0\u3002</div>
            </div>
            <div class="st-roll-inline"><input id="${t.aiRollModeId}" type="checkbox" /></div>
          </label>

          <label class="st-roll-item st-roll-search-item" data-st-roll-search="ai round end round_control end_round">
            <div class="st-roll-item-main">
              <div class="st-roll-item-title">\u662F\u5426\u5F00\u542F\u6301\u7EED\u8F6E</div>
              <div class="st-roll-item-desc">\u5F00\u542F\uFF1A\u6CBF\u7528\u5F53\u524D\u8F6E\uFF0C\u7531 AI \u901A\u8FC7 round_control=end_round / end_round=true \u51B3\u5B9A\u4F55\u65F6\u7ED3\u675F\u3002\u5173\u95ED\uFF1A\u6309\u6BCF\u8F6E\u5904\u7406\uFF0C\u6BCF\u6B21\u65B0\u4E8B\u4EF6\u90FD\u4F1A\u5F00\u542F\u65B0\u8F6E\u3002</div>
            </div>
            <div class="st-roll-inline"><input id="${t.aiRoundControlId}" type="checkbox" /></div>
          </label>

          <label class="st-roll-item st-roll-search-item" data-st-roll-search="dynamic dc reason">
            <div class="st-roll-item-main">
              <div class="st-roll-item-title">\u542F\u7528\u52A8\u6001 DC \u89E3\u91CA</div>
              <div class="st-roll-item-desc">\u5728\u5361\u7247\u4E2D\u663E\u793A\u201C\u4E3A\u4EC0\u4E48\u8FD9\u6B21\u96BE\u5EA6\u66F4\u9AD8\u6216\u66F4\u4F4E\u201D\u3002</div>
            </div>
            <div class="st-roll-inline"><input id="${t.dynamicDcReasonId}" type="checkbox" /></div>
          </label>

          <label class="st-roll-item st-roll-search-item" data-st-roll-search="status debuff apply remove clear">
            <div class="st-roll-item-main">
              <div class="st-roll-item-title">\u542F\u7528\u72B6\u6001\u5F02\u5E38\u7CFB\u7EDF</div>
              <div class="st-roll-item-desc">\u4E8B\u4EF6\u53EF\u7ED9\u89D2\u8272\u52A0\u72B6\u6001\uFF08\u5982\u53D7\u4F24\u3001\u60CA\u5413\uFF09\uFF0C\u540E\u7EED\u68C0\u5B9A\u4F1A\u81EA\u52A8\u52A0\u51CF\u503C\u3002</div>
            </div>
            <div class="st-roll-inline"><input id="${t.statusSystemEnabledId}" type="checkbox" /></div>
          </label>

          <div class="st-roll-item st-roll-search-item" data-st-roll-search="status editor">
            <div class="st-roll-item-main">
              <div class="st-roll-item-title">\u72B6\u6001\u7F16\u8F91\u5668</div>
              <div class="st-roll-item-desc">\u624B\u52A8\u7BA1\u7406\u5F53\u524D\u4F1A\u8BDD\u7684\u72B6\u6001\u5217\u8868\uFF0C\u9002\u5408\u4E34\u65F6\u8C03\u6574\u5267\u60C5\u72B6\u6001\u3002</div>
            </div>
            <div class="st-roll-actions"><button id="${t.statusEditorOpenId}" type="button" class="st-roll-btn">\u6253\u5F00\u7F16\u8F91\u5668</button></div>
          </div>

          <div class="st-roll-divider"><i class="fa-solid fa-dice"></i><span>\u63B7\u9AB0\u89C4\u5219</span><div class="st-roll-divider-line"></div></div>

          <label class="st-roll-item st-roll-search-item" data-st-roll-search="explode">
            <div class="st-roll-item-main">
              <div class="st-roll-item-title">\u542F\u7528\u7206\u9AB0</div>
              <div class="st-roll-item-desc">\u5F00\u542F\u540E\u6EE1\u8DB3\u6761\u4EF6\u65F6\u53EF\u8FFD\u52A0\u63B7\u9AB0\uFF1B\u5173\u95ED\u540E\u4E0D\u8FFD\u52A0\u3002</div>
            </div>
            <div class="st-roll-inline"><input id="${t.explodingEnabledId}" type="checkbox" /></div>
          </label>

          <label class="st-roll-item st-roll-search-item" data-st-roll-search="advantage disadvantage">
            <div class="st-roll-item-main">
              <div class="st-roll-item-title">\u542F\u7528\u4F18\u52BF/\u52A3\u52BF</div>
              <div class="st-roll-item-desc">\u652F\u6301\u4F18\u52BF\u548C\u52A3\u52BF\u89C4\u5219\uFF0C\u4F1A\u81EA\u52A8\u53D6\u66F4\u9AD8\u6216\u66F4\u4F4E\u7ED3\u679C\u3002</div>
            </div>
            <div class="st-roll-inline"><input id="${t.advantageEnabledId}" type="checkbox" /></div>
          </label>

          <label class="st-roll-item st-roll-search-item" data-st-roll-search="dynamic result guidance">
            <div class="st-roll-item-main">
              <div class="st-roll-item-title">\u542F\u7528\u52A8\u6001\u7ED3\u679C\u5F15\u5BFC</div>
              <div class="st-roll-item-desc">\u63B7\u9AB0\u540E\u4F1A\u7ED9 AI \u4E00\u6761\u7B80\u77ED\u63D0\u793A\uFF0C\u5E2E\u52A9\u5B83\u66F4\u81EA\u7136\u5730\u8854\u63A5\u5267\u60C5\u3002</div>
            </div>
            <div class="st-roll-inline"><input id="${t.dynamicResultGuidanceId}" type="checkbox" /></div>
          </label>

          <div class="st-roll-item st-roll-search-item" data-st-roll-search="dice sides allowed">
            <div class="st-roll-item-main">
              <div class="st-roll-item-title">\u9650\u5236 AI \u53EF\u7528\u9AB0\u5B50\u9762\u6570</div>
              <div class="st-roll-item-desc">AI \u53EA\u80FD\u4F7F\u7528\u8FD9\u91CC\u586B\u5199\u7684\u9762\u6570\uFF0C\u4F8B\u5982\uFF1A4,6,8,10,12,20,100\u3002</div>
            </div>
            <div class="st-roll-row">
              <input id="${t.allowedDiceSidesId}" class="st-roll-input" type="text" placeholder="4,6,8,10,12,20,100" />
            </div>
          </div>

          <div class="st-roll-divider"><i class="fa-solid fa-route"></i><span>\u5267\u60C5\u5206\u652F</span><div class="st-roll-divider-line"></div></div>

          <label class="st-roll-item st-roll-search-item" data-st-roll-search="outcome branches">
            <div class="st-roll-item-main">
              <div class="st-roll-item-title">\u542F\u7528\u5267\u60C5\u8D70\u5411\u5206\u652F</div>
              <div class="st-roll-item-desc">\u53EF\u4E3A\u6210\u529F\u3001\u5931\u8D25\u3001\u7206\u9AB0\u5206\u522B\u8BBE\u7F6E\u4E0D\u540C\u540E\u679C\u3002</div>
            </div>
            <div class="st-roll-inline"><input id="${t.outcomeBranchesId}" type="checkbox" /></div>
          </label>

          <label class="st-roll-item st-roll-search-item" data-st-roll-search="explode outcome branch">
            <div class="st-roll-item-main">
              <div class="st-roll-item-title">\u542F\u7528\u7206\u9AB0\u7279\u6B8A\u5206\u652F</div>
              <div class="st-roll-item-desc">\u51FA\u73B0\u7206\u9AB0\u65F6\uFF0C\u4F18\u5148\u4F7F\u7528\u7206\u9AB0\u540E\u679C\u6587\u672C\u3002</div>
            </div>
            <div class="st-roll-inline"><input id="${t.explodeOutcomeId}" type="checkbox" /></div>
          </label>

          <label class="st-roll-item st-roll-search-item" data-st-roll-search="list outcome preview">
            <div class="st-roll-item-main">
              <div class="st-roll-item-title">\u5217\u8868\u5361\u9884\u89C8\u8D70\u5411</div>
              <div class="st-roll-item-desc">\u8FD8\u6CA1\u63B7\u9AB0\u65F6\uFF0C\u4E5F\u80FD\u5148\u770B\u5230\u53EF\u80FD\u51FA\u73B0\u7684\u4E09\u79CD\u7ED3\u679C\u3002</div>
            </div>
            <div class="st-roll-inline"><input id="${t.listOutcomePreviewId}" type="checkbox" /></div>
          </label>

          <div class="st-roll-divider"><i class="fa-solid fa-file-lines"></i><span>\u6458\u8981\u6CE8\u5165</span><div class="st-roll-divider-line"></div></div>

          <div class="st-roll-item st-roll-search-item" data-st-roll-search="summary detail mode">
            <div class="st-roll-item-main">
              <div class="st-roll-item-title">\u6458\u8981\u4FE1\u606F\u7B49\u7EA7</div>
              <div class="st-roll-item-desc">\u63A7\u5236\u53D1\u7ED9 AI \u7684\u5386\u53F2\u6458\u8981\u662F\u7B80\u7565\u3001\u5E73\u8861\u8FD8\u662F\u8BE6\u7EC6\u3002</div>
            </div>
            <div class="st-roll-row">
              <select id="${t.summaryDetailId}" class="st-roll-select">
                <option value="minimal">\u7B80\u7565</option>
                <option value="balanced">\u5E73\u8861</option>
                <option value="detailed">\u8BE6\u7EC6</option>
              </select>
            </div>
          </div>

          <div class="st-roll-item st-roll-search-item" data-st-roll-search="summary rounds history">
            <div class="st-roll-item-main">
              <div class="st-roll-item-title">\u5386\u53F2\u8F6E\u6B21\u6570</div>
              <div class="st-roll-item-desc">\u6BCF\u6B21\u9644\u5E26\u6700\u8FD1 N \u8F6E\u8BB0\u5F55\u3002\u6570\u5B57\u8D8A\u5927\uFF0CAI \u4E0A\u4E0B\u6587\u8D8A\u5B8C\u6574\u3002</div>
            </div>
            <div class="st-roll-row"><input id="${t.summaryRoundsId}" class="st-roll-input" type="number" min="1" max="10" step="1" /></div>
          </div>

          <label class="st-roll-item st-roll-search-item" data-st-roll-search="summary include outcome">
            <div class="st-roll-item-main">
              <div class="st-roll-item-title">\u6458\u8981\u5305\u542B\u8D70\u5411\u6587\u672C</div>
              <div class="st-roll-item-desc">\u628A\u672C\u8F6E\u547D\u4E2D\u7684\u540E\u679C\u6587\u672C\u4E5F\u5199\u8FDB\u6458\u8981\u3002</div>
            </div>
            <div class="st-roll-inline"><input id="${t.includeOutcomeSummaryId}" type="checkbox" /></div>
          </label>

          <div class="st-roll-divider"><i class="fa-solid fa-stopwatch"></i><span>\u65F6\u9650\u63A7\u5236</span><div class="st-roll-divider-line"></div></div>

          <label class="st-roll-item st-roll-search-item" data-st-roll-search="time limit timeout">
            <div class="st-roll-item-main">
              <div class="st-roll-item-title">\u542F\u7528\u4E8B\u4EF6\u65F6\u9650</div>
              <div class="st-roll-item-desc">\u4E8B\u4EF6\u4F1A\u5012\u8BA1\u65F6\uFF0C\u8D85\u65F6\u540E\u81EA\u52A8\u6309\u5931\u8D25\u7ED3\u7B97\u3002</div>
            </div>
            <div class="st-roll-inline"><input id="${t.timeLimitEnabledId}" type="checkbox" /></div>
          </label>

          <div id="${t.timeLimitRowId}" class="st-roll-item st-roll-search-item" data-st-roll-search="minimum time limit seconds">
            <div class="st-roll-item-main">
              <div class="st-roll-item-title">\u6700\u77ED\u65F6\u9650\uFF08\u79D2\uFF09</div>
              <div class="st-roll-item-desc">AI \u7ED9\u7684\u65F6\u9650\u592A\u77ED\u65F6\uFF0C\u4F1A\u81EA\u52A8\u63D0\u9AD8\u5230\u8FD9\u4E2A\u503C\u3002</div>
            </div>
            <div class="st-roll-row"><input id="${t.timeLimitMinId}" class="st-roll-input" type="number" min="1" step="1" /></div>
          </div>

          <div class="st-roll-tip st-roll-search-item" data-st-roll-search="prompt summary status block">
            \u53D1\u9001\u524D\u4F1A\u81EA\u52A8\u6CE8\u5165\u89C4\u5219\u3001\u6458\u8981\u548C\u72B6\u6001\u4FE1\u606F\uFF0C\u5E2E\u52A9 AI \u6301\u7EED\u7406\u89E3\u5F53\u524D\u8FDB\u5C55\u3002
          </div>
        </div>

        <div id="${t.panelSkillId}" class="st-roll-panel" hidden>
          <div class="st-roll-divider"><i class="fa-solid fa-bolt"></i><span>\u6280\u80FD\u7CFB\u7EDF</span><div class="st-roll-divider-line"></div></div>

          <label class="st-roll-item st-roll-search-item" data-st-roll-search="skill system enable">
            <div class="st-roll-item-main">
              <div class="st-roll-item-title">\u542F\u7528\u6280\u80FD\u7CFB\u7EDF</div>
              <div class="st-roll-item-desc">\u5173\u95ED\u540E\uFF0C\u6280\u80FD\u52A0\u503C\u4E0D\u518D\u53C2\u4E0E\u63B7\u9AB0\u8BA1\u7B97\u3002</div>
            </div>
            <div class="st-roll-inline"><input id="${t.skillEnabledId}" type="checkbox" /></div>
          </label>

          <div class="st-roll-item st-roll-search-item" data-st-roll-search="skill editor modal">
            <div class="st-roll-item-main">
              <div class="st-roll-item-title">\u6280\u80FD\u7F16\u8F91\u5668</div>
              <div class="st-roll-item-desc">\u5728\u8FD9\u91CC\u7EF4\u62A4\u6280\u80FD\u9884\u8BBE\u548C\u6BCF\u4E2A\u6280\u80FD\u7684\u52A0\u503C\u3002</div>
            </div>
            <div class="st-roll-actions">
              <button id="${t.skillEditorOpenId}" type="button" class="st-roll-btn">\u6253\u5F00\u7F16\u8F91\u5668</button>
            </div>
          </div>

          <dialog id="${t.skillModalId}" class="st-roll-skill-modal">
            <div class="st-roll-skill-modal-backdrop" data-skill-modal-role="backdrop"></div>
            <div class="st-roll-skill-modal-panel">
              <div class="st-roll-skill-modal-head">
                <div class="st-roll-skill-modal-title"><i class="fa-solid fa-bolt"></i><span>\u6280\u80FD\u9884\u8BBE\u7F16\u8F91\u5668</span></div>
                <button id="${t.skillModalCloseId}" type="button" class="st-roll-btn secondary st-roll-skill-modal-close">\u5173\u95ED</button>
              </div>

              <div class="st-roll-skill-modal-body">
                <div id="${t.skillPresetLayoutId}" class="st-roll-skill-layout">
                  <aside id="${t.skillPresetSidebarId}" class="st-roll-skill-presets">
                    <div class="st-roll-skill-presets-head">
                      <span class="st-roll-field-label">\u6280\u80FD\u9884\u8BBE</span>
                      <div class="st-roll-actions">
                        <button id="${t.skillPresetCreateId}" type="button" class="st-roll-btn">\u65B0\u5EFA\u9884\u8BBE</button>
                        <button id="${t.skillPresetDeleteId}" type="button" class="st-roll-btn secondary">\u5220\u9664\u9884\u8BBE</button>
                        <button id="${t.skillPresetRestoreDefaultId}" type="button" class="st-roll-btn secondary">\u6062\u590D\u9ED8\u8BA4</button>
                      </div>
                    </div>
                    <div id="${t.skillPresetMetaId}" class="st-roll-skill-preset-meta"></div>
                    <div id="${t.skillPresetListId}" class="st-roll-skill-preset-list"></div>
                  </aside>

                  <div id="${t.skillEditorWrapId}" class="st-roll-textarea-wrap">
                    <div class="st-roll-row st-roll-skill-rename-row">
                      <span class="st-roll-field-label">\u9884\u8BBE\u540D\u79F0</span>
                      <input id="${t.skillPresetNameId}" class="st-roll-input st-roll-skill-preset-name-input" type="text" placeholder="\u8F93\u5165\u9884\u8BBE\u540D\u79F0" />
                      <button id="${t.skillPresetRenameId}" type="button" class="st-roll-btn">\u4FDD\u5B58\u540D\u79F0</button>
                    </div>

                    <div class="st-roll-tip">\u540D\u79F0\u4E0D\u80FD\u4E3A\u7A7A\uFF1B\u4FEE\u6B63\u503C\u5FC5\u987B\u662F\u6574\u6570\uFF1B\u6301\u7EED\u8F6E\u6B21\u7559\u7A7A=\u6C38\u4E45\uFF0C\u586B\u5199\u65F6\u5FC5\u987B\u4E3A\u6574\u6570\u4E14 >=1\uFF1B\u8303\u56F4\u4E3A\u201C\u6309\u6280\u80FD\u201D\u65F6\u6280\u80FD\u5217\u8868\u4E0D\u80FD\u4E3A\u7A7A\uFF1B\u540C\u540D\u72B6\u6001\u4E0D\u80FD\u91CD\u590D\u3002</div>
                    <div id="${t.skillDirtyHintId}" class="st-roll-skill-dirty" hidden>\u6280\u80FD\u6539\u52A8\u5C1A\u672A\u4FDD\u5B58\uFF0C\u70B9\u51FB\u201C\u4FDD\u5B58\u6280\u80FD\u8868\u201D\u540E\u751F\u6548\u3002</div>
                    <div id="${t.skillErrorsId}" class="st-roll-skill-errors" hidden></div>

                    <div class="st-roll-skill-head">
                      <span class="st-roll-field-label">\u6280\u80FD\u8868\uFF08\u5F53\u524D\u9884\u8BBE\uFF09</span>
                      <div class="st-roll-actions">
                        <button id="${t.skillAddId}" type="button" class="st-roll-btn">\u65B0\u589E\u6280\u80FD</button>
                        <button id="${t.skillSaveId}" type="button" class="st-roll-btn">\u4FDD\u5B58\u6280\u80FD\u8868</button>
                        <button id="${t.skillResetId}" type="button" class="st-roll-btn secondary">\u91CD\u7F6E\u4E3A\u7A7A</button>
                        <button id="${t.skillImportToggleId}" type="button" class="st-roll-btn secondary">\u5BFC\u5165 JSON</button>
                        <button id="${t.skillExportId}" type="button" class="st-roll-btn secondary">\u5BFC\u51FA JSON</button>
                      </div>
                    </div>

                    <div class="st-roll-skill-cols"><span>\u6280\u80FD\u540D</span><span>\u52A0\u503C\uFF08\u6574\u6570\uFF09</span><span>\u64CD\u4F5C</span></div>
                    <div id="${t.skillRowsId}" class="st-roll-skill-rows"></div>

                    <div id="${t.skillImportAreaId}" class="st-roll-skill-import" hidden>
                      <div class="st-roll-row" style="margin-bottom:8px;">
                        <span class="st-roll-field-label">\u7C98\u8D34 JSON \u540E\u70B9\u51FB\u5E94\u7528</span>
                        <div class="st-roll-actions">
                          <button id="${t.skillImportApplyId}" type="button" class="st-roll-btn">\u5E94\u7528\u5BFC\u5165</button>
                        </div>
                      </div>
                      <textarea id="${t.skillTextId}" class="st-roll-textarea" rows="7" placeholder='{"\u5BDF\u89C9":10,"\u8BF4\u670D":8}'></textarea>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </dialog>
        </div>

        <div id="${t.panelRuleId}" class="st-roll-panel" hidden>
          <div class="st-roll-divider"><i class="fa-solid fa-scroll"></i><span>\u4E8B\u4EF6\u534F\u8BAE\u89C4\u5219</span><div class="st-roll-divider-line"></div></div>

          <div class="st-roll-textarea-wrap st-roll-search-item" data-st-roll-search="rule text save reset">
            <div class="st-roll-row" style="margin-bottom:8px;">
              <span class="st-roll-field-label">\u8FD9\u91CC\u586B\u5199\u201C\u81EA\u5B9A\u4E49\u8865\u5145\u89C4\u5219\u201D\uFF0C\u7CFB\u7EDF\u57FA\u7840\u89C4\u5219\u4F1A\u6309\u5F53\u524D\u5F00\u5173\u52A8\u6001\u751F\u6210\u5E76\u56FA\u5B9A\u5728\u524D\uFF0C\u4F60\u7684\u5185\u5BB9\u4F1A\u8FFD\u52A0\u5728\u6700\u540E\u3002</span>
              <div class="st-roll-actions">
                <button id="${t.ruleSaveId}" type="button" class="st-roll-btn">\u4FDD\u5B58\u8865\u5145</button>
                <button id="${t.ruleResetId}" type="button" class="st-roll-btn secondary">\u6E05\u7A7A\u8865\u5145</button>
              </div>
            </div>
            <textarea id="${t.ruleTextId}" class="st-roll-textarea" rows="12" placeholder="\u53EA\u5199\u989D\u5916\u7EA6\u675F\uFF0C\u4F8B\u5982\uFF1A
1. \u573A\u666F\u4EE5\u6F5C\u5165\u98CE\u683C\u63A8\u8FDB\u3002
2. outcomes \u6587\u672C\u907F\u514D\u91CD\u590D\u63AA\u8F9E\u3002
3. \u4F18\u52BF/\u52A3\u52BF\u89E6\u53D1\u65F6\u52A0\u5F3A\u53D9\u4E8B\u5DEE\u5F02\u3002"></textarea>
          </div>
        </div>

        <div id="${t.panelAboutId}" class="st-roll-panel" hidden>
          <div class="st-roll-divider"><i class="fa-solid fa-circle-info"></i><span>\u5173\u4E8E\u63D2\u4EF6</span><div class="st-roll-divider-line"></div></div>

          <div class="st-roll-item st-roll-search-item" data-st-roll-search="about version author email github" style="margin-bottom: 12px; align-items: flex-start;">
            <div class="st-roll-item-main">
              <div class="st-roll-item-title">${t.displayName}</div>
              <div class="st-roll-item-desc st-roll-about-meta">
                <span class="st-roll-about-meta-item">
                  <i class="fa-solid fa-tag"></i>
                  <span>\u7248\u672C\uFF1A${t.badgeText}</span>
                </span>
                <span class="st-roll-about-meta-item">
                  <i class="fa-solid fa-user"></i>
                  <span>\u4F5C\u8005\uFF1A${t.authorText}</span>
                </span>
                <span class="st-roll-about-meta-item">
                  <i class="fa-solid fa-envelope"></i>
                  <span>\u90AE\u7BB1\uFF1A<a href="mailto:${t.emailText}">${t.emailText}</a></span>
                </span>
                <span class="st-roll-about-meta-item">
                  <i class="fa-brands fa-github"></i>
                  <span>GitHub\uFF1A<a href="${t.githubUrl}" target="_blank" rel="noopener">${t.githubText}</a></span>
                </span>
              </div>
            </div>
          </div>

          <div class="st-roll-item st-roll-search-item" style="flex-direction: column; align-items: flex-start; margin-bottom: 12px;" data-st-roll-search="changelog updates history">
            <div class="st-roll-item-title">\u66F4\u65B0\u65E5\u5FD7 (Changelog)</div>
            <div class="st-roll-changelog">
              ${t.changelogHtml}
            </div>
          </div>

          <div class="st-roll-item st-roll-search-item" data-st-roll-search="command eventroll roll list help">
            <div class="st-roll-item-main">
              <div class="st-roll-item-title">\u5E38\u7528\u547D\u4EE4</div>
              <div class="st-roll-item-desc">/roll 1d20 /eventroll list /eventroll roll &lt;id&gt;</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!--
    <dialog id="${t.statusModalId}__legacy_hidden" class="st-roll-status-modal" hidden>
      <div class="st-roll-status-modal-backdrop" data-status-modal-role="backdrop"></div>
      <div class="st-roll-status-modal-panel">
        <div class="st-roll-status-modal-head">
          <div class="st-roll-status-modal-title">
            <i class="fa-solid fa-heart-pulse"></i><span>\u72B6\u6001\u7F16\u8F91\u5668\uFF08\u5F53\u524D\u4F1A\u8BDD\uFF09</span>
          </div>
          <button id="${t.statusModalCloseId}" type="button" class="st-roll-btn secondary st-roll-status-modal-close">\u5173\u95ED</button>
        </div>
        <div class="st-roll-status-modal-body">
          <div class="st-roll-tip">\u540D\u79F0\u4E0D\u80FD\u4E3A\u7A7A\uFF1B\u4FEE\u6B63\u503C\u5FC5\u987B\u662F\u6574\u6570\uFF1B\u8303\u56F4\u4E3A\u201C\u6309\u6280\u80FD\u201D\u65F6\uFF0C\u6280\u80FD\u5217\u8868\u4E0D\u80FD\u4E3A\u7A7A\uFF1B\u540C\u540D\u72B6\u6001\u4E0D\u80FD\u91CD\u590D\u3002</div>
          <div id="${t.statusDirtyHintId}" class="st-roll-status-dirty" hidden>\u72B6\u6001\u6539\u52A8\u5C1A\u672A\u4FDD\u5B58\uFF0C\u70B9\u51FB\u201C\u4FDD\u5B58\u72B6\u6001\u201D\u540E\u7ACB\u5373\u751F\u6548\u3002</div>
          <div id="${t.statusErrorsId}" class="st-roll-status-errors" hidden></div>
          <div class="st-roll-status-head">
            <span class="st-roll-field-label">Active_Statuses\uFF08\u4F1A\u8BDD\u7EA7\uFF09</span>
            <div class="st-roll-actions">
              <button id="${t.statusAddId}" type="button" class="st-roll-btn">\u65B0\u589E\u72B6\u6001</button>
              <button id="${t.statusSaveId}" type="button" class="st-roll-btn">\u4FDD\u5B58\u72B6\u6001</button>
              <button id="${t.statusResetId}" type="button" class="st-roll-btn secondary">\u91CD\u7F6E\u4E3A\u7A7A</button>
            </div>
          </div>
          <div class="st-roll-status-cols">
            <span>\u540D\u79F0</span><span>\u4FEE\u6B63</span><span>\u6301\u7EED\u8F6E\u6B21</span><span>\u8303\u56F4</span><span>\u6280\u80FD\u5217\u8868\uFF08\u7528 | \u5206\u9694\uFF09</span><span>\u542F\u7528</span><span>\u64CD\u4F5C</span>
          </div>
          <div id="${t.statusRowsId}" class="st-roll-status-rows"></div>
        </div>
      </div>
    </dialog>
    -->

    <dialog id="${t.statusModalId}" class="st-roll-status-modal">
      <div class="st-roll-status-modal-backdrop" data-status-modal-role="backdrop"></div>
      <div class="st-roll-status-modal-panel">
        <div class="st-roll-status-modal-head">
          <div class="st-roll-status-modal-title">
            <i class="fa-solid fa-heart-pulse"></i><span>\u72B6\u6001\u7F16\u8F91\u5668</span>
          </div>
          <button id="${t.statusModalCloseId}" type="button" class="st-roll-btn secondary st-roll-status-modal-close">\u5173\u95ED</button>
        </div>
        <div class="st-roll-status-modal-body">
          <div id="${t.statusLayoutId}" class="st-roll-status-layout">
            <aside id="${t.statusSidebarId}" class="st-roll-status-sidebar">
              <div class="st-roll-status-sidebar-head">
                <span class="st-roll-field-label">\u804A\u5929\u5217\u8868</span>
                <span id="${t.statusMemoryStateId}" class="st-roll-status-memory-state">\u8BB0\u5FC6\u5E93\uFF1A\u68C0\u6D4B\u4E2D</span>
              </div>
              <div id="${t.statusChatListId}" class="st-roll-status-chat-list"></div>
            </aside>
            <div
              id="${t.statusSplitterId}"
              class="st-roll-status-splitter"
              role="separator"
              aria-orientation="vertical"
              aria-label="\u8C03\u6574\u804A\u5929\u4FA7\u680F\u5BBD\u5EA6"
            ></div>
            <section class="st-roll-status-main">
              <div class="st-roll-tip">
                \u8BF4\u660E\uFF1A\u540D\u79F0\u5FC5\u586B\uFF1B\u4FEE\u6B63\u503C\u5FC5\u987B\u4E3A\u6574\u6570\uFF1B\u8303\u56F4\u4E3A\u201C\u6309\u6280\u80FD\u201D\u65F6\uFF0C\u6280\u80FD\u5217\u8868\u4E0D\u80FD\u4E3A\u7A7A\u3002
              </div>
              <div id="${t.statusDirtyHintId}" class="st-roll-status-dirty" hidden>\u5F53\u524D\u804A\u5929\u6709\u672A\u4FDD\u5B58\u4FEE\u6539\u3002</div>
              <div id="${t.statusErrorsId}" class="st-roll-status-errors" hidden></div>
              <div class="st-roll-status-head">
                <div class="st-roll-status-head-main">
                  <span class="st-roll-field-label">Active_Statuses\uFF08\u6309\u804A\u5929\u9694\u79BB\uFF09</span>
                  <div id="${t.statusChatMetaId}" class="st-roll-status-chat-meta">\u672A\u9009\u62E9\u804A\u5929</div>
                </div>
                <div class="st-roll-actions">
                  <button id="${t.statusAddId}" type="button" class="st-roll-btn">\u65B0\u589E\u72B6\u6001</button>
                  <button id="${t.statusSaveId}" type="button" class="st-roll-btn">\u4FDD\u5B58</button>
                  <button id="${t.statusResetId}" type="button" class="st-roll-btn secondary">\u91CD\u7F6E</button>
                </div>
              </div>
              <div id="${t.statusColsId}" class="st-roll-status-cols">
                <span class="st-roll-status-col-head" data-status-col-key="name">\u540D\u79F0<div class="st-roll-status-col-resizer" data-status-col-resize-key="name"></div></span>
                <span class="st-roll-status-col-head" data-status-col-key="modifier">\u4FEE\u6B63<div class="st-roll-status-col-resizer" data-status-col-resize-key="modifier"></div></span>
                <span class="st-roll-status-col-head" data-status-col-key="duration">\u8F6E\u6B21<div class="st-roll-status-col-resizer" data-status-col-resize-key="duration"></div></span>
                <span class="st-roll-status-col-head" data-status-col-key="scope">\u8303\u56F4<div class="st-roll-status-col-resizer" data-status-col-resize-key="scope"></div></span>
                <span class="st-roll-status-col-head" data-status-col-key="skills">\u6280\u80FD\uFF08|\uFF09<div class="st-roll-status-col-resizer" data-status-col-resize-key="skills"></div></span>
                <span class="st-roll-status-col-head" data-status-col-key="enabled">\u542F\u7528<div class="st-roll-status-col-resizer" data-status-col-resize-key="enabled"></div></span>
                <span class="st-roll-status-col-head" data-status-col-key="actions">\u64CD\u4F5C</span>
              </div>
              <div id="${t.statusRowsId}" class="st-roll-status-rows"></div>
            </section>
          </div>
        </div>
      </div>
    </dialog>
  `}function fs(t){return`
    #${t} {
      margin-bottom: 5px;
      color: var(--SmartThemeBodyColor, inherit);
    }

    #${t} .st-roll-shell {
      border: 1px solid rgba(197, 160, 89, 0.35);
      border-radius: 12px;
      overflow: hidden;
      background:
        radial-gradient(120% 140% at 100% 0%, rgba(197, 160, 89, 0.12), transparent 55%),
        linear-gradient(160deg, rgba(31, 25, 25, 0.82), rgba(20, 18, 20, 0.82));
      backdrop-filter: blur(3px);
    }

    #${t} .st-roll-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      margin-bottom: 0 !important;
      padding: 10px 12px;
      cursor: pointer;
      user-select: none;
      transition: background-color 0.2s ease, box-shadow 0.2s ease;
    }

    #${t} .st-roll-head-title {
      display: flex;
      align-items: center;
      gap: 6px;
      font-weight: 700;
    }

    #${t} .st-roll-head-badge {
      color: #f06464;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.3px;
    }

    #${t} .st-roll-head .inline-drawer-icon {
      transition: transform 0.2s ease;
    }

    #${t} .st-roll-content {
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      padding: 10px;
      display: block;
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
      border: 1px solid rgba(255, 255, 255, 0.16);
      border-radius: 999px;
      margin-bottom: 10px;
      background: rgba(0, 0, 0, 0.2);
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
      color: var(--SmartThemeQuoteTextColor, #fff);
      background: rgba(197, 160, 89, 0.58);
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
      background: linear-gradient(
        90deg,
        rgba(255, 255, 255, 0),
        rgba(255, 255, 255, 0.2) 18%,
        rgba(255, 255, 255, 0.26) 50%,
        rgba(255, 255, 255, 0.2) 82%,
        rgba(255, 255, 255, 0)
      );
    }

    #${t} .st-roll-item {
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 10px;
      padding: 12px;
      margin: 2px 0;
      background: rgba(0, 0, 0, 0.16);
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
      margin-bottom: 3px;
    }

    #${t} .st-roll-item-desc {
      font-size: 12px;
      line-height: 1.45;
      opacity: 0.75;
    }

    #${t} .st-roll-about-meta {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 10px 24px;
    }

    #${t} .st-roll-about-meta-item {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      white-space: nowrap;
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
      transition: border-color 0.2s ease, text-shadow 0.2s ease;
    }

    #${t} .st-roll-about-meta a:hover {
      border-bottom-color: rgba(255, 255, 255, 0.5);
      text-shadow: 0 0 8px rgba(255, 255, 255, 0.22);
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
      min-width: 200px;
    }

    #${t} .st-roll-select,
    #${t} .st-roll-input,
    #${t} .st-roll-textarea {
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

    #${t} .st-roll-select,
    #${t} .st-roll-input {
      padding: 4px 8px;
      min-height: 30px;
    }

    #${t} .st-roll-select {
      min-width: 182px;
      max-width: 100%;
      text-align: center;
      text-align-last: center;
      appearance: none;
      -webkit-appearance: none;
      -moz-appearance: none;
      padding-right: 32px;
      background-image:
        linear-gradient(45deg, transparent 50%, rgba(255, 255, 255, 0.75) 50%),
        linear-gradient(135deg, rgba(255, 255, 255, 0.75) 50%, transparent 50%),
        linear-gradient(to right, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.05));
      background-position:
        calc(100% - 16px) calc(50% - 1px),
        calc(100% - 11px) calc(50% - 1px),
        calc(100% - 30px) 50%;
      background-size: 6px 6px, 6px 6px, 1px 62%;
      background-repeat: no-repeat;
    }

    #${t} .st-roll-select option {
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

    #${t} .st-roll-textarea {
      width: 100%;
      resize: vertical;
      padding: 8px;
      font-size: 12px;
      line-height: 1.5;
      min-height: 220px;
    }

    #${t} .st-roll-changelog {
      width: 100%;
      font-size: 12px;
      background: rgba(0, 0, 0, 0.15);
      border: 1px solid rgba(255, 255, 255, 0.18);
      border-radius: 8px;
      padding: 10px;
      max-height: 240px;
      overflow-y: auto;
    }

    #${t} .st-roll-changelog ul {
      list-style-type: disc;
      color: inherit;
    }

    #${t} .st-roll-changelog li {
      margin-bottom: 4px;
    }

    #${t} .st-roll-changelog::-webkit-scrollbar {
      width: 6px;
    }

    #${t} .st-roll-changelog::-webkit-scrollbar-thumb {
      background: rgba(197, 160, 89, 0.4);
      border-radius: 4px;
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
      grid-template-columns: minmax(160px, 1fr) 130px 76px;
      gap: 8px;
      font-size: 12px;
      font-weight: 700;
      opacity: 0.72;
      margin-bottom: 6px;
      padding: 0 2px;
    }

    #${t} .st-roll-skill-cols span:nth-child(2),
    #${t} .st-roll-skill-cols span:nth-child(3) {
      text-align: center;
    }

    #${t} .st-roll-skill-rows {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    #${t} .st-roll-skill-row {
      display: grid;
      grid-template-columns: minmax(160px, 1fr) 130px 76px;
      gap: 8px;
      align-items: center;
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
      background: rgba(0, 0, 0, 0.72);
      backdrop-filter: blur(2px);
    }

    #${t} .st-roll-skill-modal-backdrop {
      position: absolute;
      inset: 0;
      background: transparent;
      backdrop-filter: none;
    }

    #${t} .st-roll-skill-modal-panel {
      position: relative;
      z-index: 1;
      display: flex;
      flex-direction: column;
      width: min(1460px, 96vw);
      height: min(96vh, 920px);
      margin: 0;
      border: 1px solid rgba(197, 160, 89, 0.38);
      border-radius: 14px;
      overflow: hidden;
      background:
        radial-gradient(110% 130% at 100% 0%, rgba(197, 160, 89, 0.14), transparent 56%),
        linear-gradient(160deg, rgba(23, 21, 24, 0.96), rgba(15, 14, 17, 0.96));
      box-shadow: 0 18px 54px rgba(0, 0, 0, 0.46);
    }

    #${t} .st-roll-skill-modal-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      padding: 12px 14px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      background: rgba(255, 255, 255, 0.04);
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

    #${t} .st-roll-skill-preset-name {
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
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

    #${t} .st-roll-skill-rename-row {
      justify-content: flex-start;
      gap: 8px;
      margin-bottom: 8px;
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
      background: rgba(0, 0, 0, 0.72);
      backdrop-filter: blur(2px);
    }

    #${t} .st-roll-status-modal-backdrop {
      position: absolute;
      inset: 0;
      background: transparent;
    }

    #${t} .st-roll-status-modal-panel {
      position: relative;
      z-index: 1;
      display: flex;
      flex-direction: column;
      width: min(1220px, 96vw);
      height: min(92vh, 860px);
      margin: 0;
      border: 1px solid rgba(197, 160, 89, 0.38);
      border-radius: 14px;
      overflow: hidden;
      background:
        radial-gradient(110% 130% at 100% 0%, rgba(197, 160, 89, 0.14), transparent 56%),
        linear-gradient(160deg, rgba(23, 21, 24, 0.96), rgba(15, 14, 17, 0.96));
      box-shadow: 0 18px 54px rgba(0, 0, 0, 0.46);
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
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      background: rgba(255, 255, 255, 0.04);
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

    #${t} .st-roll-status-chat-name {
      font-size: 13px;
      font-weight: 700;
      overflow: hidden;
      text-overflow: ellipsis;
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

    #${t} .st-roll-status-splitter {
      cursor: col-resize;
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

    #${t} .st-roll-status-cols span:nth-child(2),
    #${t} .st-roll-status-cols span:nth-child(3),
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
      font-size: 12px;
      opacity: 0.9;
      user-select: none;
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
      margin-top: 8px;
      margin-bottom: 8px;
    }

    #${t} .st-roll-status-error-item {
      font-size: 12px;
      line-height: 1.45;
      color: #ffd2d2;
    }

    #${t} .st-roll-status-dirty {
      margin-top: 8px;
      margin-bottom: 2px;
      font-size: 12px;
      line-height: 1.4;
      color: #ffe0a6;
    }

    #${t} .st-roll-tip {
      font-size: 12px;
      line-height: 1.5;
      opacity: 0.78;
      padding-top: 4px;
    }

    #${t} input[type="checkbox"] {
      accent-color: rgba(197, 160, 89, 0.92);
      transition: filter 0.2s ease;
    }

    #${t} .st-roll-head:hover {
      background: rgba(255, 255, 255, 0.04);
      box-shadow: inset 0 -1px 0 rgba(255, 255, 255, 0.08);
    }

    #${t} .st-roll-tab:hover {
      opacity: 1;
      background: rgba(197, 160, 89, 0.2);
      box-shadow: 0 0 12px rgba(197, 160, 89, 0.2);
    }

    #${t} .st-roll-item:hover {
      border-color: rgba(197, 160, 89, 0.48);
      background: rgba(0, 0, 0, 0.24);
      box-shadow:
        0 0 0 1px rgba(197, 160, 89, 0.2),
        0 0 16px rgba(197, 160, 89, 0.16);
    }

    #${t} .st-roll-select:hover,
    #${t} .st-roll-input:hover,
    #${t} .st-roll-search:hover,
    #${t} .st-roll-textarea:hover {
      border-color: rgba(197, 160, 89, 0.58);
      background-color: rgba(0, 0, 0, 0.34);
      box-shadow: 0 0 0 1px rgba(197, 160, 89, 0.18);
    }

    #${t} .st-roll-textarea-wrap:hover {
      border-color: rgba(197, 160, 89, 0.45);
      box-shadow: 0 10px 22px rgba(0, 0, 0, 0.2);
    }

    #${t} .st-roll-btn:hover {
      border-color: rgba(197, 160, 89, 0.68);
      background: rgba(197, 160, 89, 0.24);
      box-shadow:
        inset 0 0 0 1px rgba(197, 160, 89, 0.26),
        0 0 14px rgba(197, 160, 89, 0.2);
    }

    #${t} .st-roll-select:focus,
    #${t} .st-roll-input:focus,
    #${t} .st-roll-search:focus,
    #${t} .st-roll-textarea:focus {
      outline: none;
      border-color: rgba(197, 160, 89, 0.72);
      box-shadow: 0 0 0 2px rgba(197, 160, 89, 0.22);
    }

    @media (max-width: 680px) {
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

      #${t} .st-roll-status-modal-head {
        padding: 10px 12px;
      }

      #${t} .st-roll-status-modal-body {
        padding: 10px;
      }

      #${t} .st-roll-status-layout {
        grid-template-columns: 1fr;
        min-height: 0;
      }

      #${t} .st-roll-status-sidebar {
        border-right: 0;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        max-height: 220px;
      }

      #${t} .st-roll-status-splitter {
        display: none;
      }

      #${t} .st-roll-status-head {
        flex-direction: column;
        align-items: stretch;
      }

      #${t} .st-roll-status-cols {
        display: none;
      }

      #${t} .st-roll-status-row {
        grid-template-columns: 1fr;
      }

      #${t} .st-roll-status-modifier {
        text-align: left;
      }

      #${t} .st-roll-status-enabled-wrap {
        justify-content: flex-start;
      }

      #${t} .st-roll-status-remove {
        width: 100%;
      }
    }

    @media (max-width: 768px) {
      #${t} .st-roll-status-chat-meta {
        white-space: normal;
      }
    }
  `}var Qt={display_name:"SS-Helper [\u9AB0\u5B50\u52A9\u624B]",loading_order:-8,requires:[],optional:[],js:"index.js",author:"Shion",version:"1.1.2",auto_update:!1,homePage:"https://github.com/ShionCox/SS-Helper-RollHelper",email:"348591466@qq.com"};var Zt="SillyTavern-Roll",be="st-roll-settings-Event-card",Ts="st-roll-settings-Event-style",Dn="st-roll-settings-Event-badge",Rn="st-roll-settings-Event-enabled",An="st-roll-settings-Event-auto-rule",kn="st-roll-settings-Event-ai-roll-mode",Ln="st-roll-settings-Event-ai-round-control",Mn="st-roll-settings-Event-exploding-enabled",Nn="st-roll-settings-Event-advantage-enabled",wn="st-roll-settings-Event-dynamic-result-guidance",Cn="st-roll-settings-Event-dynamic-dc-reason",$n="st-roll-settings-Event-status-system-enabled",Pn="st-roll-settings-Event-status-editor-open",he="st-roll-settings-Event-status-modal",_s="st-roll-settings-Event-status-modal-close",Ie="st-roll-settings-Event-status-rows",On="st-roll-settings-Event-status-add",Hn="st-roll-settings-Event-status-save",Bn="st-roll-settings-Event-status-reset",xe="st-roll-settings-Event-status-errors",ye="st-roll-settings-Event-status-dirty-hint",Ba="st-roll-settings-Event-status-layout",Ga="st-roll-settings-Event-status-sidebar",Gn="st-roll-settings-Event-status-splitter",Un="st-roll-settings-Event-status-chat-list",Kn="st-roll-settings-Event-status-chat-meta",Fn="st-roll-settings-Event-status-cols",zn="st-roll-settings-Event-status-memory-state",Vn="st-roll-settings-Event-allowed-dice-sides",Yn="st-roll-settings-Event-summary-detail",jn="st-roll-settings-Event-summary-rounds",Xn="st-roll-settings-Event-apply-scope",qn="st-roll-settings-Event-outcome-branches",Wn="st-roll-settings-Event-explode-outcome",Jn="st-roll-settings-Event-summary-outcome",Qn="st-roll-settings-Event-list-outcome-preview",Zn="st-roll-settings-Event-time-limit-enabled",tr="st-roll-settings-Event-time-limit-min-seconds",bs="st-roll-settings-Event-time-limit-row",er="st-roll-settings-Event-skill-enabled",Ua="st-roll-settings-Event-skill-editor-wrap",te="st-roll-settings-Event-skill-rows",hs="st-roll-settings-Event-skill-add",Is="st-roll-settings-Event-skill-text",xs="st-roll-settings-Event-skill-import-toggle",ys="st-roll-settings-Event-skill-import-area",Ds="st-roll-settings-Event-skill-import-apply",Rs="st-roll-settings-Event-skill-export",As="st-roll-settings-Event-skill-save",ks="st-roll-settings-Event-skill-reset",nr="st-roll-settings-Event-skill-errors",rr="st-roll-settings-Event-skill-dirty-hint",Ka="st-roll-settings-Event-skill-preset-layout",Fa="st-roll-settings-Event-skill-preset-sidebar",De="st-roll-settings-Event-skill-preset-list",Ls="st-roll-settings-Event-skill-preset-create",Re="st-roll-settings-Event-skill-preset-delete",Ms="st-roll-settings-Event-skill-preset-restore-default",Ae="st-roll-settings-Event-skill-preset-name",Ns="st-roll-settings-Event-skill-preset-rename",sr="st-roll-settings-Event-skill-preset-meta",ws="st-roll-settings-Event-skill-editor-open",ke="st-roll-settings-Event-skill-modal",Cs="st-roll-settings-Event-skill-modal-close",ir="st-roll-settings-Event-rule-text",$s="st-roll-settings-Event-rule-save",Ps="st-roll-settings-Event-rule-reset",Os="st-roll-settings-Event-search",Hs="st-roll-settings-Event-tab-main",Bs="st-roll-settings-Event-tab-skill",Gs="st-roll-settings-Event-tab-rule",Us="st-roll-settings-Event-tab-about",Ks="st-roll-settings-Event-panel-main",Fs="st-roll-settings-Event-panel-skill",zs="st-roll-settings-Event-panel-rule",Vs="st-roll-settings-Event-panel-about",Y=Qt,za=typeof Y.display_name=="string"&&Y.display_name.trim().length>0?Y.display_name.trim():"SillyTavern-Roll Event",or=typeof Qt.version=="string"&&Qt.version.trim().length>0?Qt.version.trim():"unknown",Va=typeof Y.author=="string"&&Y.author.trim().length>0?Y.author.trim():"Shion",Ya=typeof Y.email=="string"&&Y.email.trim().length>0?Y.email.trim():"348591466@qq.com",Ys=typeof Y.homePage=="string"&&/^https?:\/\//i.test(Y.homePage.trim())?Y.homePage.trim():"https://github.com/ShionCox/SillyTavern-Roll",ja=Ys.replace(/^https?:\/\//i,""),js={SETTINGS_CARD_ID_Event:be,SETTINGS_DISPLAY_NAME_Event:za,SETTINGS_BADGE_ID_Event:Dn,SETTINGS_BADGE_VERSION_Event:or,SETTINGS_AUTHOR_TEXT_Event:Va,SETTINGS_EMAIL_TEXT_Event:Ya,SETTINGS_GITHUB_TEXT_Event:ja,SETTINGS_GITHUB_URL_Event:Ys,SETTINGS_SEARCH_ID_Event:Os,SETTINGS_TAB_MAIN_ID_Event:Hs,SETTINGS_TAB_SKILL_ID_Event:Bs,SETTINGS_TAB_RULE_ID_Event:Gs,SETTINGS_TAB_ABOUT_ID_Event:Us,SETTINGS_PANEL_MAIN_ID_Event:Ks,SETTINGS_PANEL_SKILL_ID_Event:Fs,SETTINGS_PANEL_RULE_ID_Event:zs,SETTINGS_PANEL_ABOUT_ID_Event:Vs,SETTINGS_ENABLED_ID_Event:Rn,SETTINGS_RULE_ID_Event:An,SETTINGS_AI_ROLL_MODE_ID_Event:kn,SETTINGS_AI_ROUND_CONTROL_ID_Event:Ln,SETTINGS_EXPLODING_ENABLED_ID_Event:Mn,SETTINGS_ADVANTAGE_ENABLED_ID_Event:Nn,SETTINGS_DYNAMIC_RESULT_GUIDANCE_ID_Event:wn,SETTINGS_DYNAMIC_DC_REASON_ID_Event:Cn,SETTINGS_STATUS_SYSTEM_ENABLED_ID_Event:$n,SETTINGS_STATUS_EDITOR_OPEN_ID_Event:Pn,SETTINGS_STATUS_MODAL_ID_Event:he,SETTINGS_STATUS_MODAL_CLOSE_ID_Event:_s,SETTINGS_STATUS_ROWS_ID_Event:Ie,SETTINGS_STATUS_ADD_ID_Event:On,SETTINGS_STATUS_SAVE_ID_Event:Hn,SETTINGS_STATUS_RESET_ID_Event:Bn,SETTINGS_STATUS_ERRORS_ID_Event:xe,SETTINGS_STATUS_DIRTY_HINT_ID_Event:ye,SETTINGS_STATUS_LAYOUT_ID_Event:Ba,SETTINGS_STATUS_SIDEBAR_ID_Event:Ga,SETTINGS_STATUS_SPLITTER_ID_Event:Gn,SETTINGS_STATUS_CHAT_LIST_ID_Event:Un,SETTINGS_STATUS_CHAT_META_ID_Event:Kn,SETTINGS_STATUS_COLS_ID_Event:Fn,SETTINGS_STATUS_MEMORY_STATE_ID_Event:zn,SETTINGS_ALLOWED_DICE_SIDES_ID_Event:Vn,SETTINGS_SUMMARY_DETAIL_ID_Event:Yn,SETTINGS_SUMMARY_ROUNDS_ID_Event:jn,SETTINGS_SCOPE_ID_Event:Xn,SETTINGS_OUTCOME_BRANCHES_ID_Event:qn,SETTINGS_EXPLODE_OUTCOME_ID_Event:Wn,SETTINGS_SUMMARY_OUTCOME_ID_Event:Jn,SETTINGS_LIST_OUTCOME_PREVIEW_ID_Event:Qn,SETTINGS_TIME_LIMIT_ENABLED_ID_Event:Zn,SETTINGS_TIME_LIMIT_MIN_ID_Event:tr,SETTINGS_TIME_LIMIT_ROW_ID_Event:bs,SETTINGS_SKILL_ENABLED_ID_Event:er,SETTINGS_SKILL_EDITOR_WRAP_ID_Event:Ua,SETTINGS_SKILL_ROWS_ID_Event:te,SETTINGS_SKILL_ADD_ID_Event:hs,SETTINGS_SKILL_TEXT_ID_Event:Is,SETTINGS_SKILL_IMPORT_TOGGLE_ID_Event:xs,SETTINGS_SKILL_IMPORT_AREA_ID_Event:ys,SETTINGS_SKILL_IMPORT_APPLY_ID_Event:Ds,SETTINGS_SKILL_EXPORT_ID_Event:Rs,SETTINGS_SKILL_SAVE_ID_Event:As,SETTINGS_SKILL_RESET_ID_Event:ks,SETTINGS_SKILL_ERRORS_ID_Event:nr,SETTINGS_SKILL_DIRTY_HINT_ID_Event:rr,SETTINGS_SKILL_PRESET_LAYOUT_ID_Event:Ka,SETTINGS_SKILL_PRESET_SIDEBAR_ID_Event:Fa,SETTINGS_SKILL_PRESET_LIST_ID_Event:De,SETTINGS_SKILL_PRESET_CREATE_ID_Event:Ls,SETTINGS_SKILL_PRESET_DELETE_ID_Event:Re,SETTINGS_SKILL_PRESET_RESTORE_DEFAULT_ID_Event:Ms,SETTINGS_SKILL_PRESET_NAME_ID_Event:Ae,SETTINGS_SKILL_PRESET_RENAME_ID_Event:Ns,SETTINGS_SKILL_PRESET_META_ID_Event:sr,SETTINGS_SKILL_EDITOR_OPEN_ID_Event:ws,SETTINGS_SKILL_MODAL_ID_Event:ke,SETTINGS_SKILL_MODAL_CLOSE_ID_Event:Cs,SETTINGS_RULE_SAVE_ID_Event:$s,SETTINGS_RULE_RESET_ID_Event:Ps,SETTINGS_RULE_TEXT_ID_Event:ir},Xs={SETTINGS_TAB_MAIN_ID_Event:Hs,SETTINGS_TAB_SKILL_ID_Event:Bs,SETTINGS_TAB_RULE_ID_Event:Gs,SETTINGS_TAB_ABOUT_ID_Event:Us,SETTINGS_PANEL_MAIN_ID_Event:Ks,SETTINGS_PANEL_SKILL_ID_Event:Fs,SETTINGS_PANEL_RULE_ID_Event:zs,SETTINGS_PANEL_ABOUT_ID_Event:Vs,SETTINGS_SKILL_MODAL_ID_Event:ke,SETTINGS_SKILL_EDITOR_OPEN_ID_Event:ws,SETTINGS_SKILL_MODAL_CLOSE_ID_Event:Cs,SETTINGS_STATUS_MODAL_ID_Event:he,SETTINGS_STATUS_EDITOR_OPEN_ID_Event:Pn,SETTINGS_STATUS_MODAL_CLOSE_ID_Event:_s,SETTINGS_SEARCH_ID_Event:Os},qs={SETTINGS_ENABLED_ID_Event:Rn,SETTINGS_RULE_ID_Event:An,SETTINGS_AI_ROLL_MODE_ID_Event:kn,SETTINGS_AI_ROUND_CONTROL_ID_Event:Ln,SETTINGS_EXPLODING_ENABLED_ID_Event:Mn,SETTINGS_ADVANTAGE_ENABLED_ID_Event:Nn,SETTINGS_DYNAMIC_RESULT_GUIDANCE_ID_Event:wn,SETTINGS_DYNAMIC_DC_REASON_ID_Event:Cn,SETTINGS_STATUS_SYSTEM_ENABLED_ID_Event:$n,SETTINGS_ALLOWED_DICE_SIDES_ID_Event:Vn,SETTINGS_SUMMARY_DETAIL_ID_Event:Yn,SETTINGS_SUMMARY_ROUNDS_ID_Event:jn,SETTINGS_SCOPE_ID_Event:Xn,SETTINGS_OUTCOME_BRANCHES_ID_Event:qn,SETTINGS_EXPLODE_OUTCOME_ID_Event:Wn,SETTINGS_SUMMARY_OUTCOME_ID_Event:Jn,SETTINGS_LIST_OUTCOME_PREVIEW_ID_Event:Qn,SETTINGS_TIME_LIMIT_ENABLED_ID_Event:Zn,SETTINGS_TIME_LIMIT_MIN_ID_Event:tr,SETTINGS_SKILL_ENABLED_ID_Event:er},Ws={SETTINGS_SKILL_PRESET_LIST_ID_Event:De,SETTINGS_SKILL_PRESET_CREATE_ID_Event:Ls,SETTINGS_SKILL_PRESET_DELETE_ID_Event:Re,SETTINGS_SKILL_PRESET_RESTORE_DEFAULT_ID_Event:Ms,SETTINGS_SKILL_PRESET_NAME_ID_Event:Ae,SETTINGS_SKILL_PRESET_RENAME_ID_Event:Ns},Js={SETTINGS_SKILL_ROWS_ID_Event:te,SETTINGS_SKILL_ADD_ID_Event:hs},Qs={SETTINGS_SKILL_IMPORT_TOGGLE_ID_Event:xs,SETTINGS_SKILL_IMPORT_AREA_ID_Event:ys,SETTINGS_SKILL_TEXT_ID_Event:Is,SETTINGS_SKILL_IMPORT_APPLY_ID_Event:Ds,SETTINGS_SKILL_EXPORT_ID_Event:Rs,SETTINGS_SKILL_SAVE_ID_Event:As,SETTINGS_SKILL_RESET_ID_Event:ks},Zs={SETTINGS_RULE_TEXT_ID_Event:ir,SETTINGS_RULE_SAVE_ID_Event:$s,SETTINGS_RULE_RESET_ID_Event:Ps},ti={SETTINGS_ENABLED_ID_Event:Rn,SETTINGS_RULE_ID_Event:An,SETTINGS_AI_ROLL_MODE_ID_Event:kn,SETTINGS_AI_ROUND_CONTROL_ID_Event:Ln,SETTINGS_EXPLODING_ENABLED_ID_Event:Mn,SETTINGS_ADVANTAGE_ENABLED_ID_Event:Nn,SETTINGS_DYNAMIC_RESULT_GUIDANCE_ID_Event:wn,SETTINGS_DYNAMIC_DC_REASON_ID_Event:Cn,SETTINGS_STATUS_SYSTEM_ENABLED_ID_Event:$n,SETTINGS_ALLOWED_DICE_SIDES_ID_Event:Vn,SETTINGS_SUMMARY_DETAIL_ID_Event:Yn,SETTINGS_SUMMARY_ROUNDS_ID_Event:jn,SETTINGS_SCOPE_ID_Event:Xn,SETTINGS_OUTCOME_BRANCHES_ID_Event:qn,SETTINGS_EXPLODE_OUTCOME_ID_Event:Wn,SETTINGS_SUMMARY_OUTCOME_ID_Event:Jn,SETTINGS_LIST_OUTCOME_PREVIEW_ID_Event:Qn,SETTINGS_TIME_LIMIT_ENABLED_ID_Event:Zn,SETTINGS_TIME_LIMIT_MIN_ID_Event:tr,SETTINGS_TIME_LIMIT_ROW_ID_Event:bs,SETTINGS_SKILL_ENABLED_ID_Event:er,SETTINGS_STATUS_EDITOR_OPEN_ID_Event:Pn,SETTINGS_STATUS_ROWS_ID_Event:Ie,SETTINGS_STATUS_ERRORS_ID_Event:xe,SETTINGS_STATUS_DIRTY_HINT_ID_Event:ye,SETTINGS_RULE_TEXT_ID_Event:ir,SETTINGS_SKILL_ROWS_ID_Event:te},ei="<dice_rules>",ni="</dice_rules>",lr="<dice_round_summary>",ar="</dice_round_summary>",ri="<dice_result_guidance>",si="</dice_result_guidance>",ii="<dice_runtime_policy>",oi="</dice_runtime_policy>",li="<dice_active_statuses>",ai="</dice_active_statuses>",di=20,ci=60,Ht=1,Bt=10,ui=20,Ei=400,yt=1,ot="skill_preset_default_general_trpg",ee="\u901A\u7528\u53D9\u4E8BTRPG\uFF08\u9ED8\u8BA4\uFF09";var ne="\u65B0\u9884\u8BBE",Xa={\u5BDF\u89C9:3,\u8BF4\u670D:2,\u6F5C\u884C:1,\u8C03\u67E5:3,\u4EA4\u6D89:2,\u610F\u5FD7:1,\u53CD\u5E94:2,\u4F53\u80FD:1,\u533B\u7597:3,\u77E5\u8BC6:2},Gt=JSON.stringify(Xa,null,2),dr=/^P(?=\d|T\d)(\d+Y)?(\d+M)?(\d+W)?(\d+D)?(T(?=\d)(\d+H)?(\d+M)?(\d+S)?)?$/i,Ut=2,cr="",Dt={enabled:!0,autoSendRuleToAI:!0,enableAiRollMode:!0,enableAiRoundControl:!1,enableExplodingDice:!0,enableAdvantageSystem:!0,enableDynamicResultGuidance:!1,enableDynamicDcReason:!0,enableStatusSystem:!0,aiAllowedDiceSidesText:"4,6,8,10,12,20,100",summaryDetailMode:"minimal",summaryHistoryRounds:3,eventApplyScope:"protagonist_only",enableOutcomeBranches:!0,enableExplodeOutcomeBranch:!0,includeOutcomeInSummary:!0,showOutcomePreviewInListCard:!0,enableTimeLimit:!0,minTimeLimitSeconds:10,enableSkillSystem:!0,skillTableText:"{}",skillPresetStoreText:"",ruleTextModeVersion:Ut,ruleText:cr};var qa=SillyTavern.getContext(),{chatMetadata:Le,saveMetadata:vi,registerMacro:mi,SlashCommandParser:re,SlashCommand:se,SlashCommandArgument:Me,SlashCommandNamedArgument:Hu,ARGUMENT_TYPE:Ne,sendSystemMessage:ur,extensionSettings:gi,saveSettingsDebounced:Si,eventSource:pi,event_types:fi}=qa;function J(){try{return SillyTavern.getContext()}catch{return null}}function j(t){if(typeof ur=="function")try{ur("generic",t,{uses_system_ui:!0,isSmallSys:!0});return}catch(e){b.error("\u53D1\u9001\u5230\u804A\u5929\u6846\u5931\u8D25:",e)}return t}function X(t){return t===0?"0":t>0?`+${t}`:`${t}`}function Kt(t,e,n){return`${X(t)} + skill ${X(e)} = ${X(n)}`}function nt(t){return`${t}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,9)}`}function we(t){let e=0;for(let n=0;n<t.length;n++)e=(e<<5)-e+t.charCodeAt(n),e|=0;return Math.abs(e).toString(36)}function rt(t){return t.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\"/g,"&quot;").replace(/'/g,"&#39;")}function ie(t){return rt(t).replace(/`/g,"&#96;")}function gt(t){return t.replace(/\n{3,}/g,`

`).trim()}var Ti=/\[(APPLY_STATUS|REMOVE_STATUS|CLEAR_STATUS)\s*:(.*?)\]|\[(CLEAR_STATUS)\]/gi;function lt(t){return typeof t=="string"?t.trim():""}function Er(t){if(t==null||t==="")return null;let e=Number(t);if(!Number.isFinite(e))return null;let n=Math.floor(e);return n<=0?null:n}function at(t){let e=Er(t);return e==null?"\u6C38\u4E45":`\u5269\u4F59${e}\u8F6E`}function oe(t){return lt(t).toLowerCase()}function Ce(t){return lt(t).toLowerCase()}function Wa(t){let e=lt(t);if(!e)return[];let n=e.split("|").map(r=>Ce(r)).filter(Boolean);return Array.from(new Set(n))}function Ja(t){let e=t.match(/(?:turns|duration)\s*=\s*([^,\]]+)/i);if(!e)return 1;let n=String(e[1]??"").trim();if(!n)return 1;if(/^(perm|permanent|forever|infinite|inf|\*)$/i.test(n))return null;let r=Number(n);return Number.isFinite(r)&&Math.floor(r)>=1?Math.floor(r):(b.warn(`\u72B6\u6001\u6807\u7B7E turns/duration \u975E\u6CD5\uFF0C\u5DF2\u56DE\u9000\u4E3A 1 \u8F6E: ${n}`),1)}function dt(t){let e=String(t||"").replace(Ti,"").replace(/[ \t]{2,}/g," ");return gt(e)}function Qa(t,e){let n=[],r=String(t||""),s=Ce(e),i=new RegExp(Ti.source,"gi"),o;for(;(o=i.exec(r))!==null;){let l=String(o[1]||o[3]||"").trim().toUpperCase(),a=lt(o[2]||"");if(l==="CLEAR_STATUS"){n.push({kind:"clear"});continue}if(l==="REMOVE_STATUS"){let S=lt(a);if(!S)continue;n.push({kind:"remove",name:S});continue}if(l!=="APPLY_STATUS")continue;let d=a.split(",").map(S=>lt(S)),c=d[0]||"",u=Number(d[1]);if(!c||!Number.isFinite(u))continue;let E=d.slice(2).join(","),v=Ja(E),m="skills",f=[];if(/scope\s*=\s*all/i.test(E))m="all";else{let S=E.match(/skills\s*=\s*([^,\]]+)/i);S&&(f=Wa(S[1]||"")),f.length<=0&&s&&(f=[s])}n.push({kind:"apply",name:c,modifier:u,durationRounds:v,scope:m,skills:f})}return n}function $e(t,e){let n=Qa(t,e);return{cleanedText:dt(t),commands:n}}function Za(t,e=Date.now()){if(!t||typeof t!="object")return null;let n=lt(t.name),r=Number(t.modifier),s=Er(t.remainingRounds),o=lt(t.scope).toLowerCase()==="all"?"all":"skills",l=t.enabled!==!1,a=Array.isArray(t.skills)?t.skills:[],d=Array.from(new Set(a.map(S=>Ce(S)).filter(S=>!!S))),c=Number(t.createdAt),u=Number(t.updatedAt),E=Number.isFinite(c)?c:e,v=Number.isFinite(u)?u:E,m=lt(t.source),f=m==="manual_editor"||m==="ai_tag"?m:void 0;return!n||!Number.isFinite(r)||o==="skills"&&d.length<=0?null:{name:n,modifier:r,remainingRounds:s,scope:o,skills:d,enabled:l,createdAt:E,updatedAt:v,source:f}}function B(t){if(!Array.isArray(t))return[];let e=[],n=new Map;for(let r of t){let s=Za(r);if(!s)continue;let i=oe(s.name),o=n.get(i);if(o==null){n.set(i,e.length),e.push(s);continue}e[o]=s}return e}function q(t){return Array.isArray(t.activeStatuses)||(t.activeStatuses=[]),t.activeStatuses=B(t.activeStatuses),t.activeStatuses}function _i(t,e,n,r=Date.now()){if(!Array.isArray(e)||e.length<=0)return!1;let s=q(t),i=!1;for(let o of e){if(o.kind==="clear"){s.length>0&&(s.splice(0,s.length),i=!0);continue}if(o.kind==="remove"){let l=oe(o.name),a=s.findIndex(d=>oe(d.name)===l);a>=0&&(s.splice(a,1),i=!0);continue}if(o.kind==="apply"){let l=oe(o.name),a=s.findIndex(u=>oe(u.name)===l),d=a>=0?s[a]:null,c={name:o.name,modifier:o.modifier,remainingRounds:o.durationRounds==null?null:Math.max(1,Math.floor(o.durationRounds)),scope:o.scope,skills:o.scope==="all"?[]:Array.from(new Set(o.skills)),enabled:!0,createdAt:d?.createdAt??r,updatedAt:r,source:n};a>=0?s[a]=c:s.push(c),i=!0}}return i}function Ft(t,e){let n=B(t),r=Ce(e),s=0,i=[];for(let o of n){if(!o.enabled)continue;let l=Er(o.remainingRounds);if(o.remainingRounds!=null&&l==null)continue;let a=Number(o.modifier);if(Number.isFinite(a)){if(o.scope==="all"){s+=a,i.push({name:o.name,modifier:a});continue}r&&o.skills.includes(r)&&(s+=a,i.push({name:o.name,modifier:a}))}}return{modifier:s,matched:i}}function bi(t,e,n){let r=B(t),s=[];if(s.push(e),r.length<=0)return s.push("none"),s.push(n),gt(s.join(`
`));s.push(`count=${r.length}`);for(let i of r){let o=i.scope,l=o==="all"?"-":i.skills.join("|"),a=at(i.remainingRounds);s.push(`- name="${i.name}" mod=${i.modifier>=0?`+${i.modifier}`:i.modifier} duration=${a} scope=${o} skills=${l} enabled=${i.enabled?1:0}`)}return s.push(n),gt(s.join(`
`))}var td="st_roll_event_chat_scoped_v1",pt="chat_scoped_state",hi=1,ed=180,Pe=null,le=new Map,mr=new Map,vr=new Map;function Rt(t,e){let n=String(t??"").trim();return n?n.replace(/\s+/g,"_"):e}function Ii(t){let e={id:ot,name:ee,locked:!0,skillTableText:Gt,createdAt:t,updatedAt:t},n={version:yt,activePresetId:e.id,presets:[e]};return JSON.stringify(n,null,2)}function nd(t){let e=String(t??"").trim();if(!e)return!1;try{let n=JSON.parse(e);return!(!n||typeof n!="object"||Array.isArray(n)||Number(n.version)!==yt||!Array.isArray(n.presets)||String(n.activePresetId??"").trim().length<=0)}catch{return!1}}function xi(t,e){let n=String(t??"").trim();return nd(n)?n:Ii(e)}function yi(t,e=Date.now()){return{chatKey:t,schemaVersion:hi,skillPresetStoreText:Ii(e),activeStatuses:[],updatedAt:e}}function gr(t,e){let n=Date.now(),r=Rt(t?.chatKey,e),s=Number(t?.schemaVersion),i=Number.isFinite(s)?Math.max(1,Math.floor(s)):hi,o=xi(t?.skillPresetStoreText,n),l=B(t?.activeStatuses),a=Number(t?.updatedAt),d=Number.isFinite(a)?a:n;return{chatKey:r,schemaVersion:i,skillPresetStoreText:o,activeStatuses:l,updatedAt:d}}function St(t){return{chatKey:t.chatKey,schemaVersion:t.schemaVersion,skillPresetStoreText:t.skillPresetStoreText,activeStatuses:B(t.activeStatuses),updatedAt:t.updatedAt}}async function Sr(){return typeof indexedDB>"u"?null:Pe||(Pe=new Promise(t=>{let e;try{e=indexedDB.open(td,1)}catch(n){b.warn("\u804A\u5929\u7EA7\u72B6\u6001\uFF1A\u6253\u5F00 IndexedDB \u5931\u8D25\uFF0C\u964D\u7EA7\u5185\u5B58\u7F13\u5B58\u3002",n),t(null);return}e.onupgradeneeded=()=>{let n=e.result;n.objectStoreNames.contains(pt)||n.createObjectStore(pt,{keyPath:"chatKey"})},e.onsuccess=()=>t(e.result),e.onerror=()=>{b.warn("\u804A\u5929\u7EA7\u72B6\u6001\uFF1AIndexedDB \u521D\u59CB\u5316\u5931\u8D25\uFF0C\u964D\u7EA7\u5185\u5B58\u7F13\u5B58\u3002",e.error),t(null)}}),Pe)}async function rd(t){let e=await Sr();return e?new Promise(n=>{try{let i=e.transaction(pt,"readonly").objectStore(pt).get(t);i.onsuccess=()=>{if(!i.result){n(null);return}n(gr(i.result,t))},i.onerror=()=>{b.warn(`\u804A\u5929\u7EA7\u72B6\u6001\uFF1A\u8BFB\u53D6\u5931\u8D25\uFF0CchatKey=${t}`,i.error),n(null)}}catch(r){b.warn(`\u804A\u5929\u7EA7\u72B6\u6001\uFF1A\u8BFB\u53D6\u5F02\u5E38\uFF0CchatKey=${t}`,r),n(null)}}):null}async function sd(){let t=await Sr();return t?new Promise(e=>{try{let r=t.transaction(pt,"readonly").objectStore(pt),s=[];if(typeof r.getAll=="function"){let o=r.getAll();o.onsuccess=()=>{let l=Array.isArray(o.result)?o.result:[];e(l.map(a=>gr(a,"fallback_chat::no_group::default_role")))},o.onerror=()=>{b.warn("\u804A\u5929\u7EA7\u72B6\u6001\uFF1A\u6279\u91CF\u8BFB\u53D6\u5931\u8D25",o.error),e([])};return}let i=r.openCursor();i.onsuccess=()=>{let o=i.result;if(!o){e(s);return}s.push(gr(o.value,"fallback_chat::no_group::default_role")),o.continue()},i.onerror=()=>{b.warn("\u804A\u5929\u7EA7\u72B6\u6001\uFF1A\u6E38\u6807\u8BFB\u53D6\u5931\u8D25",i.error),e([])}}catch(n){b.warn("\u804A\u5929\u7EA7\u72B6\u6001\uFF1A\u6279\u91CF\u8BFB\u53D6\u5F02\u5E38",n),e([])}}):[]}async function id(t){let e=await Sr();return e?new Promise(n=>{try{let r=e.transaction(pt,"readwrite");r.objectStore(pt).put(t),r.oncomplete=()=>n(!0),r.onerror=()=>{b.warn(`\u804A\u5929\u7EA7\u72B6\u6001\uFF1A\u5199\u5165\u5931\u8D25\uFF0CchatKey=${t.chatKey}`,r.error),n(!1)},r.onabort=()=>{b.warn(`\u804A\u5929\u7EA7\u72B6\u6001\uFF1A\u5199\u5165\u4E2D\u65AD\uFF0CchatKey=${t.chatKey}`,r.error),n(!1)}}catch(r){b.warn(`\u804A\u5929\u7EA7\u72B6\u6001\uFF1A\u5199\u5165\u5F02\u5E38\uFF0CchatKey=${t.chatKey}`,r),n(!1)}}):!1}async function od(t){let e=mr.get(t);if(!e)return;mr.delete(t),await id(e)||b.warn(`\u804A\u5929\u7EA7\u72B6\u6001\uFF1A\u5DF2\u964D\u7EA7\u4E3A\u5185\u5B58\u7F13\u5B58\uFF0CchatKey=${t}`)}function Di(t){mr.set(t.chatKey,St(t));let e=vr.get(t.chatKey);e&&clearTimeout(e);let n=setTimeout(()=>{vr.delete(t.chatKey),od(t.chatKey)},ed);vr.set(t.chatKey,n)}function Ri(t){let e=Rt(t?.chatId??t?.chat_id??t?.chat?.id,"fallback_chat"),n=Rt(t?.groupId??t?.group_id,"no_group"),r=Array.isArray(t?.characters)?t.characters:[],s=Number(t?.characterId),i="";if(Number.isInteger(s)&&s>=0&&s<r.length){let o=r[s]??{};i=Rt(o.avatar??o.id??o.name,"")}return i||(i=Rt(t?.characterName??t?.name1??t?.characterId,"default_role")),`${e}::${n}::${i}`}async function Oe(t){let e=Rt(t,"fallback_chat::no_group::default_role"),n=le.get(e);if(n)return St(n);let r=await rd(e);if(r)return le.set(e,St(r)),St(r);let s=yi(e);return le.set(e,St(s)),Di(s),St(s)}async function Ai(t){let e=Rt(t.chatKey,"fallback_chat::no_group::default_role"),n=await Oe(e)??yi(e),r=Date.now(),s={chatKey:e,schemaVersion:Number.isFinite(Number(t.schemaVersion))?Math.max(1,Math.floor(Number(t.schemaVersion))):n.schemaVersion,skillPresetStoreText:t.skillPresetStoreText==null?n.skillPresetStoreText:xi(t.skillPresetStoreText,r),activeStatuses:t.activeStatuses==null?B(n.activeStatuses):B(t.activeStatuses),updatedAt:Number.isFinite(Number(t.updatedAt))?Number(t.updatedAt):r};return le.set(e,St(s)),Di(s),St(s)}async function ki(t,e){await Ai({chatKey:t,skillPresetStoreText:e,updatedAt:Date.now()})}async function pr(t,e){await Ai({chatKey:t,activeStatuses:e,updatedAt:Date.now()})}async function Li(t){let e=await Oe(t);return B(e.activeStatuses)}async function Mi(t,e){await pr(t,B(e))}async function Ni(){let t=new Map;for(let[n,r]of le.entries())t.set(n,{chatKey:n,updatedAt:Number(r.updatedAt)||0,activeStatusCount:Array.isArray(r.activeStatuses)?r.activeStatuses.length:0});let e=await sd();for(let n of e){let r=String(n.chatKey??"").trim();if(!r)continue;let s={chatKey:r,updatedAt:Number(n.updatedAt)||0,activeStatusCount:Array.isArray(n.activeStatuses)?n.activeStatuses.length:0},i=t.get(r);(!i||s.updatedAt>=i.updatedAt)&&t.set(r,s)}return Array.from(t.values()).sort((n,r)=>r.updatedAt-n.updatedAt)}var ld={},ad={...Dt},He=()=>{};function Ci(t){He=t}var fr="",wi=0;function Fe(){let t=Ri(J());return fr=t,t}function dd(t){let e=Fe();ki(e,t).catch(n=>{b.warn(`\u804A\u5929\u7EA7\u6280\u80FD\u6301\u4E45\u5316\u5931\u8D25\uFF0CchatKey=${e}`,n)})}function $i(t){let e=Fe();pr(e,t).catch(n=>{b.warn(`\u804A\u5929\u7EA7\u72B6\u6001\u6301\u4E45\u5316\u5931\u8D25\uFF0CchatKey=${e}`,n)})}function Tr(){return fr||Fe()}async function Pi(){return(await Ni()).map(e=>({chatKey:String(e.chatKey??"").trim(),updatedAt:Number(e.updatedAt)||0,activeStatusCount:Number(e.activeStatusCount)||0}))}async function Oi(t){return B(await Li(t))}async function Hi(t,e){await Mi(t,B(e))}async function ze(t="init"){let e=++wi,n=Fe();try{let r=await Oe(n);if(e!==wi)return;let s=R(),i=je(r.skillPresetStoreText,s.skillTableText),o=Xe(i)??Vt();s.skillPresetStoreText=JSON.stringify(o,null,2),s.skillTableText=Ue(o,s.skillTableText);let l=L();l.activeStatuses=B(r.activeStatuses),Z(),Ke="",Q={},He(),b.info(`\u804A\u5929\u7EA7\u72B6\u6001\u5DF2\u88C5\u8F7D (${t}) chatKey=${n}`)}catch(r){b.warn(`\u804A\u5929\u7EA7\u72B6\u6001\u88C5\u8F7D\u5931\u8D25\uFF0C\u5DF2\u964D\u7EA7\u9ED8\u8BA4 (${t}) chatKey=${n}`,r);let s=R(),i=Vt();s.skillPresetStoreText=JSON.stringify(i,null,2),s.skillTableText=Ue(i,s.skillTableText);let o=L();o.activeStatuses=[],Z(),Ke="",Q={},He()}}function ae(){return Le.diceRoller||(Le.diceRoller={}),Le.diceRoller}function Ve(t){let e=ae();e.last=t,e.lastTotal=t.total,vi()}function cd(){let t=J();return t?((!t.chatMetadata||typeof t.chatMetadata!="object")&&(t.chatMetadata={}),t.chatMetadata):ld}function L(){let t=cd();(!t.diceRollerEvent||typeof t.diceRollerEvent!="object")&&(t.diceRollerEvent={});let e=t.diceRollerEvent;return Array.isArray(e.activeStatuses)||(e.activeStatuses=[]),e}function Z(){let t=J();if(typeof t?.saveMetadata=="function")try{t.saveMetadata()}catch(n){b.warn("\u4FDD\u5B58 Event \u5143\u6570\u636E\u5931\u8D25",n)}let e=L();Array.isArray(e.activeStatuses)&&$i(e.activeStatuses)}function ud(){let t=J(),e=t?.saveSettingsDebounced??Si;if(typeof e=="function")try{e.call(t)}catch(n){b.warn("\u4FDD\u5B58\u6269\u5C55\u8BBE\u7F6E\u5931\u8D25",n)}}function _r(){let t=J(),e=t?.saveChat??t?.saveChatConditional??t?.saveChatDebounced;if(typeof e=="function")try{Promise.resolve(e.call(t)).catch(n=>{b.warn("\u4FDD\u5B58\u804A\u5929\u5931\u8D25",n)})}catch(n){b.warn("\u4FDD\u5B58\u804A\u5929\u5931\u8D25",n)}}function R(){let e=J()?.extensionSettings??gi;if(!e||typeof e!="object")return ad;(!e[Zt]||typeof e[Zt]!="object")&&(e[Zt]={...Dt});let n=e[Zt];n.enabled=n.enabled!==!1,n.autoSendRuleToAI=n.autoSendRuleToAI!==!1,n.enableAiRollMode=n.enableAiRollMode!==!1,n.enableAiRoundControl=n.enableAiRoundControl===!0,n.enableExplodingDice=n.enableExplodingDice!==!1,n.enableAdvantageSystem=n.enableAdvantageSystem!==!1,n.enableDynamicResultGuidance=n.enableDynamicResultGuidance===!0,n.enableDynamicDcReason=n.enableDynamicDcReason!==!1,n.enableStatusSystem=n.enableStatusSystem!==!1,n.aiAllowedDiceSidesText=typeof n.aiAllowedDiceSidesText=="string"?String(n.aiAllowedDiceSidesText).trim():Dt.aiAllowedDiceSidesText,n.enableOutcomeBranches=n.enableOutcomeBranches!==!1,n.enableExplodeOutcomeBranch=n.enableExplodeOutcomeBranch!==!1,n.includeOutcomeInSummary=n.includeOutcomeInSummary!==!1,n.showOutcomePreviewInListCard=n.showOutcomePreviewInListCard!==!1;let r=String(n.summaryDetailMode||"").toLowerCase();n.summaryDetailMode=r==="balanced"||r==="detailed"?r:"minimal";let s=Number(n.summaryHistoryRounds),i=Number.isFinite(s)?Math.floor(s):Dt.summaryHistoryRounds;n.summaryHistoryRounds=Math.min(Bt,Math.max(Ht,i)),n.eventApplyScope=n.eventApplyScope==="all"?"all":"protagonist_only",n.enableTimeLimit=n.enableTimeLimit!==!1;let o=Number(n.minTimeLimitSeconds),l=Number.isFinite(o)?Math.floor(o):10;n.minTimeLimitSeconds=Math.max(1,l),n.enableSkillSystem=n.enableSkillSystem!==!1,n.skillTableText=typeof n.skillTableText=="string"&&n.skillTableText.trim().length>0?n.skillTableText:"{}",n.skillPresetStoreText=je(typeof n.skillPresetStoreText=="string"?String(n.skillPresetStoreText):"",n.skillTableText);let a=Xe(n.skillPresetStoreText);return a&&(n.skillTableText=Ue(a,n.skillTableText),n.skillPresetStoreText=JSON.stringify(a,null,2)),Number(n.ruleTextModeVersion)!==Ut&&(n.ruleText="",n.ruleTextModeVersion=Ut),Number(n.ruleTextModeVersion)!==Ut&&(n.ruleTextModeVersion=Ut),n.ruleText=typeof n.ruleText=="string"?n.ruleText:cr,n}function br(t=L()){return Array.isArray(t.activeStatuses)||(t.activeStatuses=[]),t.activeStatuses=B(t.activeStatuses),t.activeStatuses}function Bi(t){let e=L();e.activeStatuses=B(Array.isArray(t)?t:[]),Z(),$i(e.activeStatuses)}function Ye(t){let e=R();Object.assign(e,t),ud(),He()}function zt(t){return String(t??"").trim().toLowerCase()}function hr(t,e){return{rowId:nt("skill_row"),skillName:t,modifierText:e}}function Gi(t){let e=At(t);if(e==null)return 0;try{let n=JSON.parse(e);return!n||typeof n!="object"||Array.isArray(n)?0:Object.keys(n).length}catch{return 0}}function Be(t=Date.now()){return{id:ot,name:ee,locked:!0,skillTableText:Gt,createdAt:t,updatedAt:t}}function Vt(t=Date.now()){let e=Be(t);return{version:yt,activePresetId:e.id,presets:[e]}}function Ui(t,e,n=""){let r=String(e??"").trim()||ne,s=new Set(t.presets.filter(l=>l.id!==n).map(l=>zt(l.name))),i=r,o=2;for(;s.has(zt(i));)i=`${r} ${o}`,o+=1;return i}function je(t,e){let n=Date.now(),r=String(t??"").trim(),s=null;if(r)try{s=JSON.parse(r)}catch{s=null}let i=[],o=new Set,l=new Set,a=(E,v,m,f=!1)=>{let g=String(E?.id??"").trim()||nt("skill_preset"),_=g;for(;o.has(_);)_=`${g}_${Math.random().toString(36).slice(2,7)}`;o.add(_);let x=String(E?.name??"").trim()||m,T=x,p=2;for(;l.has(zt(T));)T=`${x} ${p}`,p+=1;l.add(zt(T));let I=At(String(E?.skillTableText??"{}"))??"{}",A=Number(E?.createdAt),k=Number.isFinite(A)?A:n,D=Number(E?.updatedAt),N=Number.isFinite(D)?D:k;i.push({id:_,name:T,locked:!!(E?.locked||f),skillTableText:I,createdAt:k,updatedAt:N})};s&&typeof s=="object"&&!Array.isArray(s)&&Array.isArray(s.presets)&&s.presets.forEach((E,v)=>{a(E,v,`${ne} ${v+1}`)});let d=i.find(E=>E.id===ot)??null;d?(d.name=ee,d.locked=!0):(d=Be(n),i.unshift(d)),i.length||i.push(Be(n));let c=String(s?.activePresetId??"").trim();return(!c||!i.some(E=>E.id===c))&&(c=ot),JSON.stringify({version:yt,activePresetId:c,presets:i},null,2)}function Xe(t){let e=String(t??"").trim();if(!e)return null;try{let n=JSON.parse(e);if(!n||typeof n!="object"||Array.isArray(n)||Number(n.version)!==yt||!Array.isArray(n.presets))return null;let r=String(n.activePresetId??"").trim(),s=n.presets;return!r||!s.length?null:n}catch{return null}}function qe(t=R()){let e=String(t.skillPresetStoreText??""),n=je(e,t.skillTableText),r=Xe(n);return r||Vt()}function Ge(t,e){let n=String(e??"").trim();return n?t.presets.find(r=>r.id===n)??null:null}function de(t){let e=Ge(t,t.activePresetId);if(e)return e;let n=Ge(t,ot);return n||(t.presets[0]??Be())}function Ue(t,e="{}"){let n=de(t),r=At(n.skillTableText)??At(e)??"{}";return n.skillTableText=r,r}function Ir(t){let e=R(),n=je(JSON.stringify(t),e.skillTableText),r=Xe(n)??Vt(),s=Ue(r,e.skillTableText),i=JSON.stringify(r,null,2);Ye({skillPresetStoreText:i,skillTableText:s}),dd(i)}function xr(t){return JSON.stringify(t.map(e=>({skillName:String(e.skillName??""),modifierText:String(e.modifierText??"")})))}function Ed(t){return typeof t=="string"?t.trim():""}function yr(t){return Ed(t).toLowerCase()}function Ki(t){if(!t||typeof t!="object"||Array.isArray(t))return null;let e={};for(let[n,r]of Object.entries(t)){let s=yr(n);if(!s)continue;let i=Number(r);Number.isFinite(i)&&(e[s]=i)}return e}function At(t){let e=String(t??"").trim();if(!e)return"{}";try{let n=JSON.parse(e),r=Ki(n);return r==null?null:JSON.stringify(r,null,2)}catch{return null}}var Ke="",Q={};function vd(t){let e=String(t.skillTableText??"").trim();if(e===Ke)return Q;if(Ke=e,!e)return Q={},Q;try{let n=JSON.parse(e),r=Ki(n);return r==null?(b.warn("skillTableText \u4E0D\u662F\u5408\u6CD5 JSON \u5BF9\u8C61\uFF0C\u5DF2\u6309\u7A7A\u8868\u5904\u7406\u3002"),Q={},Q):(Q=r,Q)}catch(n){return b.warn("skillTableText \u89E3\u6790\u5931\u8D25\uFF0C\u5DF2\u6309\u7A7A\u8868\u5904\u7406\u3002",n),Q={},Q}}function kt(t,e=R()){if(!e.enableSkillSystem)return 0;let n=yr(t);if(!n)return 0;let r=vd(e),s=Number(r[n]??0);return Number.isFinite(s)?s:0}function Dr(t){let e=String(t??"").trim();if(!e)return[];try{let n=JSON.parse(e);return!n||typeof n!="object"||Array.isArray(n)?[]:Object.entries(n).map(([r,s])=>hr(String(r??""),String(s??"")))}catch{return[]}}function Rr(t){let e=[],n={},r=new Map,s=/^[+-]?\d+$/;return t.forEach((i,o)=>{let l=o+1,a=String(i.skillName??""),d=String(i.modifierText??""),c=a.trim(),u=yr(c),E=!1;c||(e.push(`\u7B2C ${l} \u884C\uFF1A\u6280\u80FD\u540D\u4E0D\u80FD\u4E3A\u7A7A`),E=!0);let v=0,m=d.trim();if(m?s.test(m)?(v=Number(m),Number.isFinite(v)||(e.push(`\u7B2C ${l} \u884C\uFF1A\u52A0\u503C\u5FC5\u987B\u662F\u6709\u9650\u6574\u6570`),E=!0)):(e.push(`\u7B2C ${l} \u884C\uFF1A\u52A0\u503C\u5FC5\u987B\u662F\u6574\u6570`),E=!0):(e.push(`\u7B2C ${l} \u884C\uFF1A\u52A0\u503C\u4E0D\u80FD\u4E3A\u7A7A`),E=!0),u){let f=r.get(u);f!=null?(e.push(`\u7B2C ${l} \u884C\uFF1A\u6280\u80FD\u540D\u4E0E\u7B2C ${f+1} \u884C\u91CD\u590D`),E=!0):r.set(u,o)}!E&&u&&(n[u]=v)}),{errors:e,table:n}}function Fi(t){let e=Rr(t);return e.errors.length>0?null:JSON.stringify(e.table,null,2)}var zi=1e3,Vi=1e3,Yi=1e4;function md(t){let e=String(t||"").trim();if(!e)return null;let n=e.match(/\[DICE_ALLOWED_SIDES\]([\s\S]*?)\[\/DICE_ALLOWED_SIDES\]/i),s=(n?n[1]:e).match(/allowed_sides\s*=\s*([^\n\r]+)/i);if(!s)return null;let i=s[1].split(/[,\s]+/).map(o=>Number(String(o||"").trim())).filter(o=>Number.isFinite(o)&&Number.isInteger(o)&&o>0);return i.length===0?null:new Set(i)}function gd(t,e){let n=W(t),r=md(e);if(!(!r||r.size===0)&&!r.has(n.sides))throw new Error(`\u5F53\u524D\u89C4\u5219\u4E0D\u5141\u8BB8 d${n.sides}\uFF0Callowed_sides=${Array.from(r).sort((s,i)=>s-i).join(",")}`)}function W(t){let e=String(t||"").replace(/\s+/g,""),n=/^(\d*)d(\d+)(!)?(?:(kh|kl)(\d+))?([+\-]\d+)?$/i,r=e.match(n);if(!r)throw new Error(`\u65E0\u6548\u7684\u9AB0\u5B50\u8868\u8FBE\u5F0F\uFF1A${t}\uFF0C\u793A\u4F8B\uFF1A1d20\u30013d6+2\u30012d20kh1`);let s=Number(r[1]||1),i=Number(r[2]),o=!!r[3],l=String(r[4]||"").toLowerCase(),a=l==="kh"||l==="kl"?l:void 0,d=a?Number(r[5]||0):void 0,c=Number(r[6]||0);if(!Number.isFinite(s)||!Number.isInteger(s)||s<=0)throw new Error(`\u9AB0\u5B50\u6570\u91CF\u65E0\u6548\uFF1A${s}`);if(!Number.isFinite(i)||!Number.isInteger(i)||i<=0)throw new Error(`\u9AB0\u5B50\u9762\u6570\u65E0\u6548\uFF1A${i}`);if(s>zi)throw new Error(`\u9AB0\u5B50\u6570\u91CF\u8FC7\u5927\uFF08${s}\uFF09\uFF0C\u4E0A\u9650 ${zi}`);if(i>Vi)throw new Error(`\u9AB0\u5B50\u9762\u6570\u8FC7\u5927\uFF08${i}\uFF09\uFF0C\u4E0A\u9650 ${Vi}`);if(a){if(!Number.isFinite(d)||!Number.isInteger(d)||d<=0)throw new Error(`kh/kl \u53C2\u6570\u65E0\u6548\uFF1A${t}`);if(d>s)throw new Error(`kh/kl \u4FDD\u7559\u6570\u91CF\u4E0D\u80FD\u5927\u4E8E\u9AB0\u5B50\u6570\u91CF\uFF1A${t}`)}if(o&&a)throw new Error("\u5F53\u524D\u7248\u672C\u4E0D\u652F\u6301 ! \u4E0E kh/kl \u540C\u65F6\u4F7F\u7528");return{count:s,sides:i,modifier:c,explode:o,keepMode:a,keepCount:d}}function ji(t){let e=Math.floor(t);if(typeof crypto<"u"&&typeof crypto.getRandomValues=="function"){let n=new Uint32Array(1),r=Math.floor(4294967295/e)*e,s;do crypto.getRandomValues(n),s=n[0];while(s>=r);return s%e+1}return Math.floor(Math.random()*e)+1}function Sd(t,e,n){let r=ji(t);if(n.push(r),!!e)for(;r===t;){if(n.length>=Yi)throw new Error(`\u7206\u9AB0\u6B21\u6570\u8D85\u8FC7\u5B89\u5168\u4E0A\u9650 ${Yi}\uFF0C\u8BF7\u8C03\u6574\u8868\u8FBE\u5F0F`);r=ji(t),n.push(r)}}function ce(t){let{count:e,sides:n,modifier:r,explode:s,keepMode:i,keepCount:o}=W(t),l=R(),a=s&&l.enableExplodingDice,d=[];for(let g=0;g<e;g++)Sd(n,a,d);let c,u,E="none";if(i&&o&&o<d.length){let g=d.map((h,x)=>({value:h,index:x}));g.sort((h,x)=>h.value===x.value?h.index-x.index:i==="kh"?x.value-h.value:h.value-x.value);let _=new Set(g.slice(0,o).map(h=>h.index));c=d.filter((h,x)=>_.has(x)),u=d.filter((h,x)=>!_.has(x)),E=i==="kh"?"keep_highest":"keep_lowest"}else i&&o&&(c=[...d],u=[],E=i==="kh"?"keep_highest":"keep_lowest");let m=(Array.isArray(c)?c:d).reduce((g,_)=>g+_,0),f=m+r,S=a&&d.length>e;return{expr:t,count:e,sides:n,modifier:r,rolls:d,rawTotal:m,total:f,keepMode:i,keepCount:o,keptRolls:c,droppedRolls:u,selectionMode:E,exploding:a,explosionTriggered:S}}function We(t,e={}){e.rule&&gd(t,e.rule);let n=ce(t);if(e.adv){let r=ce(t),s=ce(t);n=r.total>=s.total?r:s}if(e.dis){let r=ce(t),s=ce(t);n=r.total<=s.total?r:s}return n}function Xi(t,e,n){if(n==null||!Number.isFinite(n))return null;switch(e){case">=":return t>=n;case">":return t>n;case"<=":return t<=n;case"<":return t<n;default:return null}}var Je=[{version:"v1.1.2",date:"2026-03-03",changes:["1. \u91CD\u6784\u4E09\u7C7B Roll \u5361\u7247\uFF08\u5F53\u524D\u4E8B\u4EF6/\u68C0\u5B9A\u7ED3\u679C/\u5DF2\u7ED3\u7B97\uFF09\u4E3A\u9ED8\u8BA4\u6536\u8D77\u7684\u53EF\u5C55\u5F00\u7ED3\u6784\uFF1A\u6458\u8981\u5C55\u793A\u5173\u952E\u5B57\u6BB5\uFF0C\u5C55\u5F00\u540E\u67E5\u770B\u5B8C\u6574\u8BE6\u60C5\u3002","2. \u5F53\u524D\u4E8B\u4EF6\u5361\u6536\u8D77\u6001\u4FDD\u7559\u201C\u6267\u884C\u68C0\u5B9A\u201D\u76F4\u8FBE\u6309\u94AE\uFF1B\u4FEE\u590D summary \u5185\u6309\u94AE\u8BEF\u89E6\u53D1\u5C55\u5F00/\u6536\u8D77\u95EE\u9898\uFF0C\u68C0\u5B9A\u64CD\u4F5C\u4E0E\u6298\u53E0\u4EA4\u4E92\u4E92\u4E0D\u5E72\u6270\u3002","3. \u7ED3\u679C\u5361\u4E0E\u7ED3\u7B97\u5361\u6458\u8981\u8865\u5145\u9AB0\u5B50\u53EF\u89C6\u5316\u4E0E\u5173\u952E\u4FE1\u606F\uFF08\u72B6\u6001\u3001\u603B\u70B9\u3001\u6761\u4EF6\u3001\u6765\u6E90\uFF09\uFF0C\u5E76\u540C\u6B65\u5B8C\u5584\u6E32\u67D3\u53C2\u6570\u4F9B\u7ED9\u3002","4. \u7EDF\u4E00\u5361\u7247\u6309\u94AE\u4E0E\u4EA4\u4E92\u6837\u5F0F\uFF1A\u5C55\u5F00\u6001\u6307\u793A\u3001\u60AC\u505C\u53CD\u9988\u3001\u7ED3\u679C\u533A\u6807\u9898\u4E0E\u9AB0\u5B50\u5C45\u4E2D\u3001\u79FB\u52A8\u7AEF\u7EC6\u8282\u9002\u914D\u53CA reduced-motion \u517C\u5BB9\u3002","5. \u72B6\u6001\u7F16\u8F91\u5668 UI \u5168\u9762\u91CD\u6784\u4E3A\u5DE6\u53F3\u5206\u680F\uFF1A\u5DE6\u4FA7\u804A\u5929\u9009\u62E9\uFF0C\u53F3\u4FA7\u72B6\u6001\u7F16\u8F91\uFF1B\u652F\u6301\u4FA7\u680F\u5BBD\u5EA6\u4E0E\u8868\u683C\u5217\u5BBD\u62D6\u62FD\u3002","6. \u804A\u5929\u5217\u8868\u9879\u6539\u4E3A\u6A2A\u5411\u4FE1\u606F\u5E03\u5C40\uFF1A\u5934\u50CF\u9884\u89C8 + \u89D2\u8272\u540D + \u6700\u540E\u804A\u5929\u65F6\u95F4 + CHATID\uFF0C\u5E76\u5B8C\u6210\u754C\u9762\u4E2D\u6587\u5316\u4E0E\u8D85\u957F\u6587\u672C\u88C1\u5207\u3002","7. \u6EDA\u52A8\u884C\u4E3A\u4F18\u5316\uFF1A\u4EC5\u5DE6\u680F\u627F\u62C5\u6574\u4F53\u7EB5\u5411\u6EDA\u52A8\uFF1B\u53F3\u4FA7\u8868\u683C\u4EC5\u6570\u636E\u533A\u6EDA\u52A8\uFF0C\u8868\u5934\u56FA\u5B9A\uFF1B\u5217\u5BBD\u62D6\u62FD\u624B\u67C4\u589E\u52A0\u6D45\u8272\u7AD6\u7EBF\u63D0\u793A\u3002","8. \u72B6\u6001\u6570\u636E\u6539\u4E3A\u6309 chatKey \u9694\u79BB\u5B58\u50A8\u4E0E\u7F16\u8F91\uFF1A\u5F53\u524D\u804A\u5929\u4FDD\u5B58\u5373\u65F6\u751F\u6548\uFF0C\u975E\u5F53\u524D\u804A\u5929\u5199\u5165\u76EE\u6807\u804A\u5929\uFF0C\u4E0D\u6C61\u67D3\u5F53\u524D\u8FD0\u884C\u6001\u3002","9. \u65B0\u589E MemoryOS SDK Bus \u96C6\u6210\uFF1A\u63A2\u6D4B\u5B89\u88C5/\u542F\u7528\u72B6\u6001\u3001\u62C9\u53D6 memory chat keys\u3001\u8BA2\u9605\u72B6\u6001\u5E7F\u64AD\uFF1B\u672A\u5B89\u88C5\u6216\u672A\u542F\u7528\u65F6\u81EA\u52A8\u964D\u7EA7\u4E3A\u672C\u5730\u6A21\u5F0F\u3002"]},{version:"v1.1.1",date:"2026-03-03",changes:["1. \u65B0\u589E\u4E86\u624B\u673A\u5206\u8FA8\u7387\u9002\u914D","2. \u65B0\u589E\u72B6\u6001\u4FEE\u6B63\u529F\u80FD\uFF0CAI\u53EF\u4EE5\u8BBE\u5B9A\u89D2\u8272\u72B6\u6001\uFF0C\u5E76\u81EA\u52A8\u4FEE\u6B63\u68C0\u5B9A\u7ED3\u679C","3. \u65B0\u589E\u201C\u7CFB\u7EDF\u52A8\u6001\u89C4\u5219\u6CE8\u5165 + \u7528\u6237\u8865\u5145\u89C4\u5219\u201D\u673A\u5236\uFF1A\u7CFB\u7EDF\u4F1A\u6309\u5F53\u524D\u5F00\u5173\u81EA\u52A8\u751F\u6210\u4E8B\u4EF6\u9AB0\u5B50\u534F\u8BAE\uFF0C\u89C4\u5219\u6587\u672C\u6539\u4E3A\u201C\u4EC5\u586B\u5199\u8865\u5145\u5185\u5BB9\u201D\u3002","4. \u65B0\u589E\u804A\u5929\u7EA7\u6301\u4E45\u5316\uFF1A\u6280\u80FD\u9884\u8BBE\u4E0E\u89D2\u8272\u72B6\u6001\u6309\u804A\u5929\u7EF4\u5EA6\u4FDD\u5B58\uFF0C\u5207\u6362\u804A\u5929\u4F1A\u81EA\u52A8\u88C5\u8F7D\u5BF9\u5E94\u914D\u7F6E\u3002","5. \u72B6\u6001\u7CFB\u7EDF\u589E\u5F3A\uFF1A\u652F\u6301\u6301\u7EED\u8F6E\u6B21\uFF08\u7559\u7A7A=\u6C38\u4E45\uFF09\uFF0C\u53EF\u5728\u72B6\u6001\u6807\u7B7E\u4E2D\u4F7F\u7528 turns/duration\uFF0C\u8F6E\u6B21\u5207\u6362\u65F6\u81EA\u52A8\u8870\u51CF\u4E0E\u6E05\u7406\u3002","6. \u7206\u9AB0\u7B56\u7565\u5347\u7EA7\uFF1AAI \u81EA\u52A8\u68C0\u5B9A\u6BCF\u8F6E\u6700\u591A\u5141\u8BB8 1 \u4E2A\u7206\u9AB0\u4E8B\u4EF6\uFF0C\u8D85\u51FA\u4E0A\u9650\u81EA\u52A8\u964D\u7EA7\u4E3A\u666E\u901A\u9AB0\uFF0C\u5E76\u8BB0\u5F55\u7B56\u7565\u539F\u56E0\u3002","7. \u65B0\u589E SSHELPER \u8F93\u5165\u533A\u5DE5\u5177\u680F\uFF1A\u652F\u6301\u201C\u6280\u80FD\u9884\u89C8/\u72B6\u6001\u9884\u89C8\u201D\u5F39\u7A97\uFF0C\u4FBF\u4E8E\u5FEB\u901F\u67E5\u770B\u5F53\u524D\u6709\u6548\u6570\u636E\u3002","8. \u91CD\u6784\u4E8B\u4EF6\u5361\u7247\u4E0E\u7ED3\u679C\u5361\u6837\u5F0F\uFF1A\u7EDF\u4E00\u63D0\u793A\u6C14\u6CE1\u3001\u8865\u5145\u7206\u9AB0\u4FE1\u606F\u4E0E\u72B6\u6001\u53D8\u5316\u6458\u8981\uFF0C\u5E76\u4F18\u5316\u79FB\u52A8\u7AEF\u663E\u793A\u3002","9. \u8BBE\u7F6E\u9875\u589E\u5F3A\uFF1A\u65B0\u589E\u201C\u6062\u590D\u9ED8\u8BA4\u9884\u8BBE\u201D\u6309\u94AE\uFF0C\u72B6\u6001\u7F16\u8F91\u5668\u652F\u6301\u6301\u7EED\u8F6E\u6B21\u8F93\u5165\u5E76\u5F3A\u5316\u6821\u9A8C\u63D0\u793A\u3002"]}];function Lt(t){return String(t??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}function ft(t){return Lt(t).replace(/`/g,"&#96;")}function to(t){let e=document.getElementById(t.SETTINGS_BADGE_ID_Event);e&&(e.textContent=t.SETTINGS_BADGE_VERSION_Event)}function eo(t){if(document.getElementById(t.SETTINGS_STYLE_ID_Event))return;let e=document.createElement("style");e.id=t.SETTINGS_STYLE_ID_Event,e.textContent=t.buildSettingsCardStylesTemplateEvent(t.SETTINGS_CARD_ID_Event),document.head.appendChild(e)}function no(t){function e(){return!Array.isArray(Je)||Je.length===0?"\u6682\u65E0\u66F4\u65B0\u8BB0\u5F55":Je.map(n=>`
      <div style="margin-bottom: 12px;">
        <div style="display: flex; align-items: baseline; gap: 8px; margin-bottom: 4px;">
            <span style="font-weight: bold; color: var(--SmartThemeQuoteTextColor, #fff); font-size: 13px;">${n.version}</span>
            ${n.date?`<span style="font-size: 11px; opacity: 0.6;">${n.date}</span>`:""}
        </div>
        <ul style="margin: 0; padding-left: 20px; font-size: 12px; opacity: 0.85;">
          ${n.changes.map(r=>`<li style="margin-bottom: 4px; line-height: 1.4;">${r}</li>`).join("")}
        </ul>
      </div>
    `).join("")}return{cardId:t.SETTINGS_CARD_ID_Event,drawerToggleId:t.drawerToggleId,drawerContentId:t.drawerContentId,drawerIconId:t.drawerIconId,displayName:t.SETTINGS_DISPLAY_NAME_Event,badgeId:t.SETTINGS_BADGE_ID_Event,badgeText:t.SETTINGS_BADGE_VERSION_Event,authorText:t.SETTINGS_AUTHOR_TEXT_Event,emailText:t.SETTINGS_EMAIL_TEXT_Event,githubText:t.SETTINGS_GITHUB_TEXT_Event,githubUrl:t.SETTINGS_GITHUB_URL_Event,changelogHtml:e(),searchId:t.SETTINGS_SEARCH_ID_Event,tabMainId:t.SETTINGS_TAB_MAIN_ID_Event,tabSkillId:t.SETTINGS_TAB_SKILL_ID_Event,tabRuleId:t.SETTINGS_TAB_RULE_ID_Event,tabAboutId:t.SETTINGS_TAB_ABOUT_ID_Event,panelMainId:t.SETTINGS_PANEL_MAIN_ID_Event,panelSkillId:t.SETTINGS_PANEL_SKILL_ID_Event,panelRuleId:t.SETTINGS_PANEL_RULE_ID_Event,panelAboutId:t.SETTINGS_PANEL_ABOUT_ID_Event,enabledId:t.SETTINGS_ENABLED_ID_Event,ruleId:t.SETTINGS_RULE_ID_Event,aiRollModeId:t.SETTINGS_AI_ROLL_MODE_ID_Event,aiRoundControlId:t.SETTINGS_AI_ROUND_CONTROL_ID_Event,explodingEnabledId:t.SETTINGS_EXPLODING_ENABLED_ID_Event,advantageEnabledId:t.SETTINGS_ADVANTAGE_ENABLED_ID_Event,dynamicResultGuidanceId:t.SETTINGS_DYNAMIC_RESULT_GUIDANCE_ID_Event,dynamicDcReasonId:t.SETTINGS_DYNAMIC_DC_REASON_ID_Event,statusSystemEnabledId:t.SETTINGS_STATUS_SYSTEM_ENABLED_ID_Event,statusEditorOpenId:t.SETTINGS_STATUS_EDITOR_OPEN_ID_Event,statusModalId:t.SETTINGS_STATUS_MODAL_ID_Event,statusModalCloseId:t.SETTINGS_STATUS_MODAL_CLOSE_ID_Event,statusRowsId:t.SETTINGS_STATUS_ROWS_ID_Event,statusAddId:t.SETTINGS_STATUS_ADD_ID_Event,statusSaveId:t.SETTINGS_STATUS_SAVE_ID_Event,statusResetId:t.SETTINGS_STATUS_RESET_ID_Event,statusErrorsId:t.SETTINGS_STATUS_ERRORS_ID_Event,statusDirtyHintId:t.SETTINGS_STATUS_DIRTY_HINT_ID_Event,statusLayoutId:t.SETTINGS_STATUS_LAYOUT_ID_Event,statusSidebarId:t.SETTINGS_STATUS_SIDEBAR_ID_Event,statusSplitterId:t.SETTINGS_STATUS_SPLITTER_ID_Event,statusChatListId:t.SETTINGS_STATUS_CHAT_LIST_ID_Event,statusChatMetaId:t.SETTINGS_STATUS_CHAT_META_ID_Event,statusColsId:t.SETTINGS_STATUS_COLS_ID_Event,statusMemoryStateId:t.SETTINGS_STATUS_MEMORY_STATE_ID_Event,allowedDiceSidesId:t.SETTINGS_ALLOWED_DICE_SIDES_ID_Event,summaryDetailId:t.SETTINGS_SUMMARY_DETAIL_ID_Event,summaryRoundsId:t.SETTINGS_SUMMARY_ROUNDS_ID_Event,scopeId:t.SETTINGS_SCOPE_ID_Event,outcomeBranchesId:t.SETTINGS_OUTCOME_BRANCHES_ID_Event,explodeOutcomeId:t.SETTINGS_EXPLODE_OUTCOME_ID_Event,includeOutcomeSummaryId:t.SETTINGS_SUMMARY_OUTCOME_ID_Event,listOutcomePreviewId:t.SETTINGS_LIST_OUTCOME_PREVIEW_ID_Event,timeLimitEnabledId:t.SETTINGS_TIME_LIMIT_ENABLED_ID_Event,timeLimitMinId:t.SETTINGS_TIME_LIMIT_MIN_ID_Event,timeLimitRowId:t.SETTINGS_TIME_LIMIT_ROW_ID_Event,skillEnabledId:t.SETTINGS_SKILL_ENABLED_ID_Event,skillEditorWrapId:t.SETTINGS_SKILL_EDITOR_WRAP_ID_Event,skillRowsId:t.SETTINGS_SKILL_ROWS_ID_Event,skillAddId:t.SETTINGS_SKILL_ADD_ID_Event,skillTextId:t.SETTINGS_SKILL_TEXT_ID_Event,skillImportToggleId:t.SETTINGS_SKILL_IMPORT_TOGGLE_ID_Event,skillImportAreaId:t.SETTINGS_SKILL_IMPORT_AREA_ID_Event,skillImportApplyId:t.SETTINGS_SKILL_IMPORT_APPLY_ID_Event,skillExportId:t.SETTINGS_SKILL_EXPORT_ID_Event,skillSaveId:t.SETTINGS_SKILL_SAVE_ID_Event,skillResetId:t.SETTINGS_SKILL_RESET_ID_Event,skillErrorsId:t.SETTINGS_SKILL_ERRORS_ID_Event,skillDirtyHintId:t.SETTINGS_SKILL_DIRTY_HINT_ID_Event,skillPresetLayoutId:t.SETTINGS_SKILL_PRESET_LAYOUT_ID_Event,skillPresetSidebarId:t.SETTINGS_SKILL_PRESET_SIDEBAR_ID_Event,skillPresetListId:t.SETTINGS_SKILL_PRESET_LIST_ID_Event,skillPresetCreateId:t.SETTINGS_SKILL_PRESET_CREATE_ID_Event,skillPresetDeleteId:t.SETTINGS_SKILL_PRESET_DELETE_ID_Event,skillPresetRestoreDefaultId:t.SETTINGS_SKILL_PRESET_RESTORE_DEFAULT_ID_Event,skillPresetNameId:t.SETTINGS_SKILL_PRESET_NAME_ID_Event,skillPresetRenameId:t.SETTINGS_SKILL_PRESET_RENAME_ID_Event,skillPresetMetaId:t.SETTINGS_SKILL_PRESET_META_ID_Event,skillEditorOpenId:t.SETTINGS_SKILL_EDITOR_OPEN_ID_Event,skillModalId:t.SETTINGS_SKILL_MODAL_ID_Event,skillModalCloseId:t.SETTINGS_SKILL_MODAL_CLOSE_ID_Event,ruleSaveId:t.SETTINGS_RULE_SAVE_ID_Event,ruleResetId:t.SETTINGS_RULE_RESET_ID_Event,ruleTextId:t.SETTINGS_RULE_TEXT_ID_Event}}function Mr(t,e=0){let n=Number.isFinite(t.retryLimitEvent)?Number(t.retryLimitEvent):60,r=Number.isFinite(t.retryDelayMsEvent)?Number(t.retryDelayMsEvent):500;if(document.getElementById(t.SETTINGS_CARD_ID_Event)){t.syncSettingsBadgeVersionEvent(),t.syncSettingsUiEvent();return}let s=document.getElementById("extensions_settings");if(!s){e<n&&setTimeout(()=>Mr(t,e+1),r);return}t.ensureSettingsCardStylesEvent();let i=document.createElement("div");i.id=t.SETTINGS_CARD_ID_Event;let o=`${t.SETTINGS_CARD_ID_Event}-toggle`,l=`${t.SETTINGS_CARD_ID_Event}-content`,a=`${t.SETTINGS_CARD_ID_Event}-icon`,d=t.buildSettingsCardTemplateIdsEvent(o,l,a);i.innerHTML=t.buildSettingsCardHtmlTemplateEvent(d);let c=i.querySelector(`#${t.SETTINGS_SKILL_MODAL_ID_Event}`);c&&i.appendChild(c);let u=i.querySelector(`#${t.SETTINGS_STATUS_MODAL_ID_Event}`);u&&i.appendChild(u);let E=document.getElementById("ss-helper-plugins-container");E||(E=document.createElement("div"),E.id="ss-helper-plugins-container",s.prepend(E)),E.appendChild(i),t.syncSettingsBadgeVersionEvent(),t.onMountedEvent({drawerToggleId:o,drawerContentId:l}),t.syncSettingsUiEvent()}var qi=!1,Wi=!1;function fd(t){let e=document.getElementById(t.SETTINGS_TAB_MAIN_ID_Event),n=document.getElementById(t.SETTINGS_TAB_SKILL_ID_Event),r=document.getElementById(t.SETTINGS_TAB_RULE_ID_Event),s=document.getElementById(t.SETTINGS_TAB_ABOUT_ID_Event),i=document.getElementById(t.SETTINGS_PANEL_MAIN_ID_Event),o=document.getElementById(t.SETTINGS_PANEL_SKILL_ID_Event),l=document.getElementById(t.SETTINGS_PANEL_RULE_ID_Event),a=document.getElementById(t.SETTINGS_PANEL_ABOUT_ID_Event),d=document.getElementById(t.SETTINGS_SKILL_MODAL_ID_Event),c=document.getElementById(t.SETTINGS_SKILL_EDITOR_OPEN_ID_Event),u=document.getElementById(t.SETTINGS_SKILL_MODAL_CLOSE_ID_Event),E=document.getElementById(t.SETTINGS_STATUS_MODAL_ID_Event),v=document.getElementById(t.SETTINGS_STATUS_EDITOR_OPEN_ID_Event),m=document.getElementById(t.SETTINGS_STATUS_MODAL_CLOSE_ID_Event),f=document.getElementById(t.SETTINGS_SEARCH_ID_Event),S=i?Array.from(i.querySelectorAll(".st-roll-search-item")):[],g=o?Array.from(o.querySelectorAll(".st-roll-search-item")):[],_=l?Array.from(l.querySelectorAll(".st-roll-search-item")):[],h=a?Array.from(a.querySelectorAll(".st-roll-search-item")):[],x=[...S,...g,..._,...h],T="main",p=()=>{let y=document.getElementById(t.drawerContentId);!y||t.isElementVisibleEvent(y)||(document.getElementById(t.drawerToggleId)?.click(),t.isElementVisibleEvent(y))||(y.hidden=!1,y.style.display="block")},I=()=>{if(d){if(d.open)try{d.close()}catch{}document.body.dataset.stRollSkillModalOpen==="1"&&(document.body.style.overflow=document.body.dataset.stRollSkillModalOverflow||"",delete document.body.dataset.stRollSkillModalOpen,delete document.body.dataset.stRollSkillModalOverflow)}},A=()=>{if(d){if(p(),!d.open)try{d.showModal()}catch{d.setAttribute("open","")}document.body.dataset.stRollSkillModalOpen!=="1"&&(document.body.dataset.stRollSkillModalOpen="1",document.body.dataset.stRollSkillModalOverflow=document.body.style.overflow||"",document.body.style.overflow="hidden")}},k=()=>{if(E){if(E.open)try{E.close()}catch{}document.body.dataset.stRollStatusModalOpen==="1"&&(document.body.style.overflow=document.body.dataset.stRollStatusModalOverflow||"",delete document.body.dataset.stRollStatusModalOpen,delete document.body.dataset.stRollStatusModalOverflow)}},D=()=>{if(E){if(p(),!E.open)try{E.showModal()}catch{E.setAttribute("open","")}document.body.dataset.stRollStatusModalOpen!=="1"&&(document.body.dataset.stRollStatusModalOpen="1",document.body.dataset.stRollStatusModalOverflow=document.body.style.overflow||"",document.body.style.overflow="hidden"),document.dispatchEvent(new CustomEvent("st-roll-status-editor-opened"))}},N=y=>{T=y;let U=y==="main",z=y==="skill",vt=y==="rule",Te=y==="about";e?.classList.toggle("is-active",U),n?.classList.toggle("is-active",z),r?.classList.toggle("is-active",vt),s?.classList.toggle("is-active",Te),i&&(i.hidden=!U),o&&(o.hidden=!z),l&&(l.hidden=!vt),a&&(a.hidden=!Te)},M=y=>y===T?!0:T==="skill"&&y!=="skill"&&!t.confirmDiscardSkillDraftEvent()?!1:(y!=="skill"&&I(),k(),N(y),!0),H=globalThis;H.__stRollPreviewEditorBridgeBoundEvent||(document.addEventListener("st-roll-open-skill-editor",()=>{M("skill")&&A()}),document.addEventListener("st-roll-open-status-editor",()=>{M("main")&&D()}),H.__stRollPreviewEditorBridgeBoundEvent=!0);let P=()=>{let U=String(f?.value??"").trim().toLowerCase().split(/\s+/).filter(Boolean);for(let V of x){let _e=`${V.dataset.stRollSearch??""} ${V.textContent??""}`.toLowerCase(),bn=U.every(Ca=>_e.includes(Ca));V.classList.toggle("is-hidden-by-search",!bn)}if(!U.length)return;let z=S.some(V=>!V.classList.contains("is-hidden-by-search")),vt=g.some(V=>!V.classList.contains("is-hidden-by-search")),Te=_.some(V=>!V.classList.contains("is-hidden-by-search")),wa=h.some(V=>!V.classList.contains("is-hidden-by-search")),cs={main:z,skill:vt,rule:Te,about:wa};if(!cs[T]){let _e=["main","skill","rule","about"].find(bn=>cs[bn]);_e&&M(_e)}};N("main"),e?.addEventListener("click",()=>{M("main")&&P()}),n?.addEventListener("click",()=>{M("skill")&&P()}),r?.addEventListener("click",()=>{M("rule")&&P()}),s?.addEventListener("click",()=>{M("about")&&P()}),f?.addEventListener("input",P),P(),c?.addEventListener("click",()=>{M("skill")&&A()}),u?.addEventListener("click",()=>{I()}),d?.addEventListener("click",y=>{let U=y.target;(y.target===d||U?.dataset.skillModalRole==="backdrop")&&I()}),d?.addEventListener("cancel",y=>{y.preventDefault(),I()}),v?.addEventListener("click",()=>{M("main")&&D()}),m?.addEventListener("click",()=>{k()}),E?.addEventListener("click",y=>{let U=y.target;(y.target===E||U?.dataset.statusModalRole==="backdrop")&&k()}),E?.addEventListener("cancel",y=>{y.preventDefault(),k()}),Wi||(window.addEventListener("keydown",y=>{y.key==="Escape"&&(I(),k())}),Wi=!0);let fe=document.getElementById(t.drawerToggleId),_n=document.getElementById(t.drawerContentId);fe?.addEventListener("click",y=>{if(t.isElementVisibleEvent(_n)){if(t.confirmDiscardSkillDraftEvent()){I(),k();return}y.preventDefault(),y.stopPropagation(),typeof y.stopImmediatePropagation=="function"&&y.stopImmediatePropagation()}},!0),qi||(window.addEventListener("beforeunload",y=>{t.isSkillDraftDirtyEvent()&&(y.preventDefault(),y.returnValue="")}),qi=!0)}function Td(t){let e=document.getElementById(t.SETTINGS_ENABLED_ID_Event),n=document.getElementById(t.SETTINGS_RULE_ID_Event),r=document.getElementById(t.SETTINGS_AI_ROLL_MODE_ID_Event),s=document.getElementById(t.SETTINGS_AI_ROUND_CONTROL_ID_Event),i=document.getElementById(t.SETTINGS_EXPLODING_ENABLED_ID_Event),o=document.getElementById(t.SETTINGS_ADVANTAGE_ENABLED_ID_Event),l=document.getElementById(t.SETTINGS_DYNAMIC_RESULT_GUIDANCE_ID_Event),a=document.getElementById(t.SETTINGS_DYNAMIC_DC_REASON_ID_Event),d=document.getElementById(t.SETTINGS_STATUS_SYSTEM_ENABLED_ID_Event),c=document.getElementById(t.SETTINGS_ALLOWED_DICE_SIDES_ID_Event),u=document.getElementById(t.SETTINGS_SUMMARY_DETAIL_ID_Event),E=document.getElementById(t.SETTINGS_SUMMARY_ROUNDS_ID_Event),v=document.getElementById(t.SETTINGS_SCOPE_ID_Event),m=document.getElementById(t.SETTINGS_OUTCOME_BRANCHES_ID_Event),f=document.getElementById(t.SETTINGS_EXPLODE_OUTCOME_ID_Event),S=document.getElementById(t.SETTINGS_SUMMARY_OUTCOME_ID_Event),g=document.getElementById(t.SETTINGS_LIST_OUTCOME_PREVIEW_ID_Event),_=document.getElementById(t.SETTINGS_TIME_LIMIT_ENABLED_ID_Event),h=document.getElementById(t.SETTINGS_TIME_LIMIT_MIN_ID_Event),x=document.getElementById(t.SETTINGS_SKILL_ENABLED_ID_Event);e?.addEventListener("input",T=>{let p=!!T.target.checked;t.updateSettingsEvent({enabled:p})}),n?.addEventListener("input",T=>{let p=!!T.target.checked;t.updateSettingsEvent({autoSendRuleToAI:p})}),r?.addEventListener("input",T=>{let p=!!T.target.checked;t.updateSettingsEvent({enableAiRollMode:p})}),s?.addEventListener("input",T=>{let p=!!T.target.checked;t.updateSettingsEvent({enableAiRoundControl:p})}),i?.addEventListener("input",T=>{let p=!!T.target.checked;t.updateSettingsEvent({enableExplodingDice:p})}),o?.addEventListener("input",T=>{let p=!!T.target.checked;t.updateSettingsEvent({enableAdvantageSystem:p})}),l?.addEventListener("input",T=>{let p=!!T.target.checked;t.updateSettingsEvent({enableDynamicResultGuidance:p})}),a?.addEventListener("input",T=>{let p=!!T.target.checked;t.updateSettingsEvent({enableDynamicDcReason:p})}),d?.addEventListener("input",T=>{let p=!!T.target.checked;t.updateSettingsEvent({enableStatusSystem:p})}),c?.addEventListener("change",T=>{let p=String(T.target.value||"").trim();t.updateSettingsEvent({aiAllowedDiceSidesText:p})}),u?.addEventListener("change",T=>{let p=String(T.target.value||""),I=p==="balanced"||p==="detailed"?p:"minimal";t.updateSettingsEvent({summaryDetailMode:I})}),E?.addEventListener("change",T=>{let p=Number(T.target.value),I=Number.isFinite(p)?Math.min(t.SUMMARY_HISTORY_ROUNDS_MAX_Event,Math.max(t.SUMMARY_HISTORY_ROUNDS_MIN_Event,Math.floor(p))):t.DEFAULT_SUMMARY_HISTORY_ROUNDS_Event;t.updateSettingsEvent({summaryHistoryRounds:I})}),v?.addEventListener("change",T=>{let p=String(T.target.value||"");t.updateSettingsEvent({eventApplyScope:p==="all"?"all":"protagonist_only"})}),m?.addEventListener("input",T=>{let p=!!T.target.checked;t.updateSettingsEvent({enableOutcomeBranches:p})}),f?.addEventListener("input",T=>{let p=!!T.target.checked;t.updateSettingsEvent({enableExplodeOutcomeBranch:p})}),S?.addEventListener("input",T=>{let p=!!T.target.checked;t.updateSettingsEvent({includeOutcomeInSummary:p})}),g?.addEventListener("input",T=>{let p=!!T.target.checked;t.updateSettingsEvent({showOutcomePreviewInListCard:p})}),_?.addEventListener("input",T=>{let p=!!T.target.checked;t.updateSettingsEvent({enableTimeLimit:p})}),h?.addEventListener("change",T=>{let p=Number(T.target.value),I=Number.isFinite(p)?Math.max(1,Math.floor(p)):10;t.updateSettingsEvent({minTimeLimitSeconds:I})}),x?.addEventListener("input",T=>{let p=!!T.target.checked;t.updateSettingsEvent({enableSkillSystem:p})})}function _d(t){let e=document.getElementById(t.SETTINGS_SKILL_PRESET_LIST_ID_Event),n=document.getElementById(t.SETTINGS_SKILL_PRESET_CREATE_ID_Event),r=document.getElementById(t.SETTINGS_SKILL_PRESET_DELETE_ID_Event),s=document.getElementById(t.SETTINGS_SKILL_PRESET_RESTORE_DEFAULT_ID_Event),i=document.getElementById(t.SETTINGS_SKILL_PRESET_NAME_ID_Event),o=document.getElementById(t.SETTINGS_SKILL_PRESET_RENAME_ID_Event);e?.addEventListener("click",a=>{let c=a.target?.closest("button[data-skill-preset-id]");if(!c)return;let u=String(c.dataset.skillPresetId??"");if(!u||u===t.getSkillEditorActivePresetIdEvent()||!t.confirmDiscardSkillDraftEvent())return;let E=t.getSettingsEvent(),v=t.getSkillPresetStoreEvent(E),m=t.getSkillPresetByIdEvent(v,u);m&&(v.activePresetId=m.id,t.saveSkillPresetStoreEvent(v))}),n?.addEventListener("click",()=>{if(!t.confirmDiscardSkillDraftEvent())return;let a=t.getSettingsEvent(),d=t.getSkillPresetStoreEvent(a),c=t.getActiveSkillPresetEvent(d),u=Date.now(),E=t.getUniqueSkillPresetNameEvent(d,t.SKILL_PRESET_NEW_NAME_BASE_Event),v={id:t.createIdEvent("skill_preset"),name:E,locked:!1,skillTableText:c.skillTableText,createdAt:u,updatedAt:u};d.presets.push(v),d.activePresetId=v.id,t.saveSkillPresetStoreEvent(d)}),r?.addEventListener("click",()=>{let a=t.getSettingsEvent(),d=t.getSkillPresetStoreEvent(a),c=t.getActiveSkillPresetEvent(d);if(c.locked){t.pushToChat("\u26A0\uFE0F \u9ED8\u8BA4\u9884\u8BBE\u4E0D\u53EF\u5220\u9664\u3002");return}if(!t.confirmDiscardSkillDraftEvent()||!window.confirm(`\u786E\u8BA4\u5220\u9664\u9884\u8BBE\u300C${c.name}\u300D\u5417\uFF1F`))return;d.presets=d.presets.filter(v=>v.id!==c.id);let E=t.getSkillPresetByIdEvent(d,t.SKILL_PRESET_DEFAULT_ID_Event)??d.presets[0]??null;E?d.activePresetId=E.id:(d.presets=t.buildDefaultSkillPresetStoreEvent().presets,d.activePresetId=t.SKILL_PRESET_DEFAULT_ID_Event),t.saveSkillPresetStoreEvent(d)}),s?.addEventListener("click",()=>{if(!t.confirmDiscardSkillDraftEvent()||!window.confirm("\u786E\u8BA4\u5C06\u9ED8\u8BA4\u9884\u8BBE\u6062\u590D\u4E3A\u5185\u7F6E\u6280\u80FD\u8868\u5417\uFF1F\u8FD9\u4F1A\u8986\u76D6\u9ED8\u8BA4\u9884\u8BBE\u5F53\u524D\u5185\u5BB9\u3002"))return;let d=t.getSettingsEvent(),c=t.getSkillPresetStoreEvent(d),u=t.getSkillPresetByIdEvent(c,t.SKILL_PRESET_DEFAULT_ID_Event);if(!u){let E=t.buildDefaultSkillPresetStoreEvent(),v=t.getSkillPresetByIdEvent(E,t.SKILL_PRESET_DEFAULT_ID_Event)??E.presets[0]??null;if(!v)return;c.presets.unshift(v),u=v}u.locked=!0,u.skillTableText=t.DEFAULT_SKILL_PRESET_TABLE_TEXT_Event,u.updatedAt=Date.now(),t.saveSkillPresetStoreEvent(c),t.renderSkillValidationErrorsEvent([]),t.pushToChat("\u6280\u80FD\u7F16\u8F91\u5668\uFF1A\u9ED8\u8BA4\u9884\u8BBE\u5DF2\u6062\u590D\u3002")});let l=()=>{let a=String(i?.value??"").trim();if(!a){t.renderSkillValidationErrorsEvent(["\u9884\u8BBE\u540D\u79F0\u4E0D\u80FD\u4E3A\u7A7A\u3002"]);return}let d=t.getSettingsEvent(),c=t.getSkillPresetStoreEvent(d),u=t.getActiveSkillPresetEvent(c);if(c.presets.some(v=>v.id!==u.id&&t.normalizeSkillPresetNameKeyEvent(v.name)===t.normalizeSkillPresetNameKeyEvent(a))){t.renderSkillValidationErrorsEvent(["\u9884\u8BBE\u540D\u79F0\u91CD\u590D\uFF0C\u8BF7\u4F7F\u7528\u5176\u4ED6\u540D\u79F0\u3002"]);return}u.name=a,u.updatedAt=Date.now(),t.saveSkillPresetStoreEvent(c),t.renderSkillValidationErrorsEvent([])};o?.addEventListener("click",l),i?.addEventListener("keydown",a=>{a.key==="Enter"&&(a.preventDefault(),l())})}function bd(t){let e=document.getElementById(t.SETTINGS_RULE_TEXT_ID_Event),n=document.getElementById(t.SETTINGS_RULE_SAVE_ID_Event),r=document.getElementById(t.SETTINGS_RULE_RESET_ID_Event);n?.addEventListener("click",()=>{let s=String(e?.value??"");t.updateSettingsEvent({ruleText:s})}),r?.addEventListener("click",()=>{e&&(e.value=""),t.updateSettingsEvent({ruleText:""})})}var w=[],Mt="",ge=!1,wt="",K="",Ar="",Yt="\u8BB0\u5FC6\u5E93\uFF1A\u68C0\u6D4B\u4E2D",Ji=!1,Qi=null,kr=0,ct=new Map,_t=[],ro="st_roll_status_editor_layout_v1",Qe={name:120,modifier:72,duration:90,scope:90,skills:160,enabled:80,actions:70},ue={name:"--st-roll-status-col-name",modifier:"--st-roll-status-col-modifier",duration:"--st-roll-status-col-duration",scope:"--st-roll-status-col-scope",skills:"--st-roll-status-col-skills",enabled:"--st-roll-status-col-enabled",actions:"--st-roll-status-col-actions"};function Zi(t){return String(t??"").trim().toLowerCase()}function hd(t){return String(t??"").trim().toLowerCase()}function Id(t){let e=String(t??"").trim();if(!e)return[];let n=e.split("|").map(r=>hd(r)).filter(Boolean);return Array.from(new Set(n))}function so(t="",e="",n="",r="skills",s="",i=!0){return{rowId:`status_row_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,8)}`,name:t,modifierText:e,durationText:n,scope:r,skillsText:s,enabled:i}}function Ze(t){return JSON.stringify(t.map(e=>({name:String(e.name??""),modifierText:String(e.modifierText??""),durationText:String(e.durationText??""),scope:e.scope==="all"?"all":"skills",skillsText:String(e.skillsText??""),enabled:e.enabled!==!1})))}function io(t){return JSON.stringify((Array.isArray(t)?t:[]).map(e=>({name:String(e.name??""),modifier:Number(e.modifier??0),scope:e.scope==="all"?"all":"skills",skills:e.scope==="all"?[]:Array.isArray(e.skills)?e.skills:[],remainingRounds:e.remainingRounds==null?null:Number(e.remainingRounds),enabled:e.enabled!==!1})))}function Nr(t){return document.getElementById(t)?.closest(".st-roll-status-modal-panel")}function tt(t,e){let n=document.getElementById(t);if(n){if(!e.length){n.hidden=!0,n.innerHTML="";return}n.hidden=!1,n.innerHTML=e.map(r=>`<div class="st-roll-status-error-item">${Lt(r)}</div>`).join("")}}function Nt(t,e){ge=!!t;let n=document.getElementById(e);n&&(n.hidden=!ge)}function Tt(t){let e=document.getElementById(t);if(e){if(!w.length){e.innerHTML='<div class="st-roll-status-empty">\u6682\u65E0\u72B6\u6001\uFF0C\u70B9\u51FB\u201C\u65B0\u589E\u72B6\u6001\u201D\u5F00\u59CB\u914D\u7F6E\u3002</div>';return}e.innerHTML=w.map(n=>{let r=ft(String(n.rowId??"")),s=ft(String(n.name??"")),i=ft(String(n.modifierText??"")),o=ft(String(n.durationText??"")),l=n.scope==="all"?"all":"skills",a=ft(String(n.skillsText??"")),d=n.enabled!==!1;return`
        <div class="st-roll-status-row" data-row-id="${r}">
          <input class="st-roll-input st-roll-status-name" type="text" data-status-row-id="${r}" data-status-field="name" value="${s}" placeholder="\u72B6\u6001\u540D\u79F0" />
          <input class="st-roll-input st-roll-status-modifier" type="text" inputmode="numeric" data-status-row-id="${r}" data-status-field="modifier" value="${i}" placeholder="\u4F8B\u5982 -2" />
          <input class="st-roll-input st-roll-status-duration" type="text" inputmode="numeric" data-status-row-id="${r}" data-status-field="duration" value="${o}" placeholder="\u7559\u7A7A=\u6C38\u4E45\uFF0C\u4F8B\u5982 3" />
          <select class="st-roll-select st-roll-status-scope" data-status-row-id="${r}" data-status-field="scope">
            <option value="skills" ${l==="skills"?"selected":""}>\u6309\u6280\u80FD</option>
            <option value="all" ${l==="all"?"selected":""}>\u5168\u5C40</option>
          </select>
          <input class="st-roll-input st-roll-status-skills" type="text" data-status-row-id="${r}" data-status-field="skills" value="${a}" placeholder="${l==="all"?"\u8303\u56F4\u4E3A\u5168\u5C40\u65F6\u4F1A\u5FFD\u7565\u6B64\u9879":"\u4F8B\u5982\uFF1A\u6F5C\u884C|\u5BDF\u89C9"}" ${l==="all"?"disabled":""} />
          <label class="st-roll-status-enabled-wrap">
            <input type="checkbox" data-status-row-id="${r}" data-status-field="enabled" ${d?"checked":""} />
            <span>\u542F\u7528</span>
          </label>
          <button type="button" class="st-roll-btn secondary st-roll-status-remove" data-status-remove-id="${r}">\u5220\u9664</button>
        </div>
      `}).join("")}}function wr(t){return(Array.isArray(t)?t:[]).map(e=>so(String(e.name??""),String(e.modifier??0),e.remainingRounds==null?"":String(e.remainingRounds),e.scope==="all"?"all":"skills",e.scope==="all"?"":(Array.isArray(e.skills)?e.skills:[]).join("|"),e.enabled!==!1))}function xd(t,e){let n=[],r=[],s=new Map,i=new Map;for(let a of e||[]){let d=Zi(a.name);d&&i.set(d,a)}let o=/^[+-]?\d+$/,l=Date.now();return t.forEach((a,d)=>{let c=d+1,u=String(a.name??"").trim(),E=Zi(u),v=String(a.modifierText??"").trim(),m=String(a.durationText??"").trim(),f=a.scope==="all"?"all":"skills",S=f==="all"?[]:Id(String(a.skillsText??"")),g=!1;if(u||(n.push(`\u7B2C ${c} \u884C\uFF1A\u540D\u79F0\u4E0D\u80FD\u4E3A\u7A7A`),g=!0),E){let T=s.get(E);T!=null?(n.push(`\u7B2C ${c} \u884C\uFF1A\u540D\u79F0\u4E0E\u7B2C ${T+1} \u884C\u91CD\u590D`),g=!0):s.set(E,d)}v?o.test(v)||(n.push(`\u7B2C ${c} \u884C\uFF1A\u4FEE\u6B63\u503C\u5FC5\u987B\u4E3A\u6574\u6570`),g=!0):(n.push(`\u7B2C ${c} \u884C\uFF1A\u4FEE\u6B63\u503C\u4E0D\u80FD\u4E3A\u7A7A`),g=!0);let _=null;if(m)if(!o.test(m))n.push(`\u7B2C ${c} \u884C\uFF1A\u6301\u7EED\u8F6E\u6B21\u5FC5\u987B\u4E3A\u6574\u6570\uFF08\u7559\u7A7A\u8868\u793A\u6C38\u4E45\uFF09`),g=!0;else{let T=Math.floor(Number(m));!Number.isFinite(T)||T<1?(n.push(`\u7B2C ${c} \u884C\uFF1A\u6301\u7EED\u8F6E\u6B21\u5FC5\u987B >= 1\uFF08\u7559\u7A7A\u8868\u793A\u6C38\u4E45\uFF09`),g=!0):_=T}if(f==="skills"&&S.length<=0&&(n.push(`\u7B2C ${c} \u884C\uFF1A\u8303\u56F4\u4E3A\u201C\u6309\u6280\u80FD\u201D\u65F6\uFF0C\u6280\u80FD\u5217\u8868\u4E0D\u80FD\u4E3A\u7A7A`),g=!0),g)return;let h=Number(v),x=i.get(E);r.push({name:u,modifier:h,remainingRounds:_,scope:f,skills:S,enabled:a.enabled!==!1,createdAt:x?.createdAt??l,updatedAt:l,source:"manual_editor"})}),{errors:n,statuses:r}}function oo(t,e,n,r=!1){let s=document.getElementById(e),i=JSON.stringify((Array.isArray(t)?t:[]).map(o=>({name:o.name,modifier:o.modifier,scope:o.scope,skills:o.scope==="all"?[]:o.skills,remainingRounds:o.remainingRounds??null,enabled:o.enabled!==!1})));!r&&ge&&s?.hasChildNodes()||!r&&i===wt&&s?.hasChildNodes()||(w=wr(t),Mt=Ze(w),wt=i,Nt(!1,n),Tt(e))}function tn(t,e,n){return Math.min(n,Math.max(e,t))}function Cr(){try{let t=localStorage.getItem(ro);if(!t)return{};let e=JSON.parse(t);return e&&typeof e=="object"?e:{}}catch{return{}}}function lo(t){try{localStorage.setItem(ro,JSON.stringify(t))}catch{}}function yd(t){let e=Nr(t);if(!e)return;let n=Cr(),r=Number(n.sidebarWidth);if(Number.isFinite(r)){let i=tn(r,220,520);e.style.setProperty("--st-roll-status-sidebar-width",`${i}px`)}let s=n.columns??{};Object.keys(ue).forEach(i=>{let o=Number(s[i]);if(!Number.isFinite(o))return;let l=tn(o,Qe[i],520);e.style.setProperty(ue[i],`${l}px`)})}function Dd(t,e){t.addEventListener("mousedown",n=>{let r=Nr(e);if(!r)return;n.preventDefault(),t.classList.add("is-resizing");let s=n.clientX,i=Number.parseFloat(getComputedStyle(r).getPropertyValue("--st-roll-status-sidebar-width"))||300,o=a=>{let d=tn(i+(a.clientX-s),220,520);r.style.setProperty("--st-roll-status-sidebar-width",`${d}px`)},l=()=>{t.classList.remove("is-resizing"),window.removeEventListener("mousemove",o),window.removeEventListener("mouseup",l);let a=Number.parseFloat(getComputedStyle(r).getPropertyValue("--st-roll-status-sidebar-width"));if(Number.isFinite(a)){let d=Cr();lo({...d,sidebarWidth:a})}};window.addEventListener("mousemove",o),window.addEventListener("mouseup",l)})}function Rd(t,e){t.addEventListener("mousedown",n=>{let s=n.target?.closest("[data-status-col-resize-key]");if(!s)return;let i=String(s.dataset.statusColResizeKey??"");if(!i||!ue[i])return;let o=Nr(e);if(!o)return;n.preventDefault(),n.stopPropagation(),s.classList.add("is-resizing");let l=t.querySelector(`[data-status-col-key="${i}"]`),a=n.clientX,d=Math.max(Qe[i],Math.round(l?.getBoundingClientRect().width??Qe[i])),c=E=>{let v=tn(d+(E.clientX-a),Qe[i],520);o.style.setProperty(ue[i],`${v}px`)},u=()=>{s.classList.remove("is-resizing"),window.removeEventListener("mousemove",c),window.removeEventListener("mouseup",u);let E=Number.parseFloat(getComputedStyle(o).getPropertyValue(ue[i]));if(!Number.isFinite(E))return;let v=Cr();lo({...v,columns:{...v.columns??{},[i]:E}})};window.addEventListener("mousemove",c),window.addEventListener("mouseup",u)})}function en(t){let e=document.getElementById(t);e&&(e.textContent=Yt)}function ao(){try{return window.SillyTavern?.getContext?.()||null}catch{return null}}function $r(t){let e=String(t??"").split("::");return{chatId:String(e[0]??"").trim()||"-",roleId:String(e[2]??"").trim()||String(e[0]??"").trim()||"\u672A\u77E5"}}function Ad(t){let{roleId:e}=$r(t),n=ao(),r=Array.isArray(n?.characters)?n.characters:[],s=null;for(let l of r){let a=String(l?.avatar??"").trim();if(a&&(e===a||e.startsWith(a+"_"))){s=l;break}}if(!s)for(let l of r){let a=String(l?.name??"").trim();if(a&&e.toLowerCase().includes(a.toLowerCase())){s=l;break}}return s?.name?String(s.name):e.replace(/\.[a-z0-9]+$/i,"").replace(/^default_/i,"").replace(/[_-]+/g," ").trim()||e||"\u672A\u77E5\u89D2\u8272"}function kd(t){let{roleId:e}=$r(t),n=ao(),r=Array.isArray(n?.characters)?n.characters:[],s="";for(let i of r){let o=String(i?.avatar??"").trim();if(o&&(e===o||e.startsWith(o+"_"))){s=o;break}}return!s&&/\.(png|jpe?g|webp|gif|bmp)$/i.test(e)&&(s=e),s?`/characters/${encodeURIComponent(s)}`:""}function Ld(t){if(!Number.isFinite(t)||t<=0)return"-";try{return new Date(t).toLocaleString()}catch{return"-"}}function Ee(t){let e=String(K??"").trim();e&&(ct.set(e,{rows:[...w],snapshot:Mt,metaSnapshot:wt,dirty:ge,updatedAt:Date.now(),activeStatusCount:w.length}),Nt(ge,t))}function Md(t,e,n){let r=ct.get(t);return r?(w=[...r.rows],Mt=String(r.snapshot??"[]"),wt=String(r.metaSnapshot??"[]"),Nt(!!r.dirty,n),Tt(e),!0):!1}function Nd(t,e,n){let r=new Map,s=String(t??"").trim();s&&r.set(s,{chatKey:s,updatedAt:Date.now(),activeStatusCount:0,isCurrent:!0,fromRollLocal:!1,fromMemory:!1});for(let i of e){let o=String(i.chatKey??"").trim();if(!o)continue;let l=r.get(o);r.set(o,{chatKey:o,updatedAt:Math.max(Number(i.updatedAt)||0,Number(l?.updatedAt)||0),activeStatusCount:Number(i.activeStatusCount)||0,isCurrent:o===s||!!l?.isCurrent,fromRollLocal:!0,fromMemory:!!l?.fromMemory})}for(let i of n){let o=String(i??"").trim();if(!o)continue;let l=r.get(o);r.set(o,{chatKey:o,updatedAt:Number(l?.updatedAt)||0,activeStatusCount:Number(l?.activeStatusCount)||0,isCurrent:o===s||!!l?.isCurrent,fromRollLocal:!!l?.fromRollLocal,fromMemory:!0})}for(let[i,o]of ct.entries())r.has(i)||r.set(i,{chatKey:i,updatedAt:Number(o.updatedAt)||0,activeStatusCount:Number(o.activeStatusCount)||0,isCurrent:i===s,fromRollLocal:!1,fromMemory:!1});return Array.from(r.values()).sort((i,o)=>{if(i.chatKey===s)return-1;if(o.chatKey===s)return 1;let l=ct.get(i.chatKey)?.dirty?1:0,a=ct.get(o.chatKey)?.dirty?1:0;return l!==a?a-l:(o.updatedAt||0)-(i.updatedAt||0)})}function ve(t){let e=document.getElementById(t);if(e){if(!_t.length){e.innerHTML='<div class="st-roll-status-empty">\u6682\u65E0\u804A\u5929\u8BB0\u5F55\u3002</div>';return}e.innerHTML=_t.map(n=>{let r=n.chatKey===K,s=ct.get(n.chatKey)?.dirty===!0,i=[];n.isCurrent&&i.push("\u5F53\u524D"),n.fromRollLocal&&i.push("\u672C\u5730"),n.fromMemory&&i.push("\u8BB0\u5FC6\u5E93"),s&&i.push("\u672A\u4FDD\u5B58");let{chatId:o}=$r(n.chatKey),l=Ad(n.chatKey),a=kd(n.chatKey),d=Lt(String(l||"\u672A").slice(0,1).toUpperCase());return`
      <button type="button" class="st-roll-status-chat-item ${r?"is-active":""}" data-status-chat-key="${ft(n.chatKey)}">
        <div class="st-roll-status-chat-avatar-wrap">
          ${a?`<img class="st-roll-status-chat-avatar" src="${ft(a)}" alt="${ft(l)}" onerror="this.style.display='none'; const fb=this.nextElementSibling; if(fb){fb.style.display='grid';}" />`:""}
          <div class="st-roll-status-chat-avatar-fallback" style="${a?"display:none;":""}">${d}</div>
        </div>
        <div class="st-roll-status-chat-main">
          <span class="st-roll-status-chat-name">${Lt(l)}</span>
          <span class="st-roll-status-chat-time">\u6700\u540E\u804A\u5929\uFF1A${Lt(Ld(n.updatedAt))}</span>
          <span class="st-roll-status-chat-key">CHATID\uFF1A${Lt(o)}</span>
          <span class="st-roll-status-chat-meta-line">${Lt(i.join(" | "))}</span>
        </div>
      </button>
    `}).join("")}}function me(t){let e=document.getElementById(t);if(!e)return;let n=String(K??"").trim();if(!n){e.textContent="\u672A\u9009\u62E9\u804A\u5929";return}let r=_t.find(i=>i.chatKey===n);if(!r){e.textContent=n;return}let s=[];r.isCurrent&&s.push("\u5F53\u524D"),r.fromRollLocal&&s.push("\u672C\u5730"),r.fromMemory&&s.push("\u8BB0\u5FC6\u5E93"),e.textContent=`\u6765\u6E90\uFF1A${s.join("\u3001")||"\u672A\u77E5"}\uFF5C\u72B6\u6001\u6570\uFF1A${r.activeStatusCount}`}async function co(t,e,n){let r=String(t??"").trim();if(!r)return;if(n?.skipSaveCurrent||Ee(e.SETTINGS_STATUS_DIRTY_HINT_ID_Event),K=r,!Md(r,e.SETTINGS_STATUS_ROWS_ID_Event,e.SETTINGS_STATUS_DIRTY_HINT_ID_Event)){let i=String(e.getActiveChatKeyEvent()??"").trim(),o=r===i?e.getActiveStatusesEvent():await e.loadStatusesForChatKeyEvent(r);oo(o,e.SETTINGS_STATUS_ROWS_ID_Event,e.SETTINGS_STATUS_DIRTY_HINT_ID_Event,!0),Ee(e.SETTINGS_STATUS_DIRTY_HINT_ID_Event)}ve(e.SETTINGS_STATUS_CHAT_LIST_ID_Event),me(e.SETTINGS_STATUS_CHAT_META_ID_Event),tt(e.SETTINGS_STATUS_ERRORS_ID_Event,[])}async function Lr(t){let e=++kr;Ar=String(t.getActiveChatKeyEvent()??"").trim(),Yt="\u8BB0\u5FC6\u5E93\uFF1A\u68C0\u6D4B\u4E2D",en(t.SETTINGS_STATUS_MEMORY_STATE_ID_Event);let[n,r]=await Promise.all([t.listChatScopedStatusSummariesEvent().catch(()=>[]),t.probeMemoryPluginEvent(1200).catch(()=>({available:!1,enabled:!1,pluginId:"stx_memory_os",version:"",capabilities:[]}))]);if(e!==kr)return;let s=[];if(!r.available)Yt="\u8BB0\u5FC6\u5E93\uFF1A\u672A\u5B89\u88C5";else if(!r.enabled)Yt="\u8BB0\u5FC6\u5E93\uFF1A\u5DF2\u5B89\u88C5\uFF08\u672A\u542F\u7528\uFF09";else{Yt="\u8BB0\u5FC6\u5E93\uFF1A\u5DF2\u542F\u7528";let l=await t.fetchMemoryChatKeysEvent(1200).catch(()=>({chatKeys:[],updatedAt:null}));if(e!==kr)return;s=Array.isArray(l.chatKeys)?l.chatKeys:[]}_t=Nd(Ar,n,s),en(t.SETTINGS_STATUS_MEMORY_STATE_ID_Event),ve(t.SETTINGS_STATUS_CHAT_LIST_ID_Event);let o=(_t.some(l=>l.chatKey===K)?K:"")||Ar||_t[0]?.chatKey||"";if(!o){K="",w=[],Mt="[]",wt="[]",Nt(!1,t.SETTINGS_STATUS_DIRTY_HINT_ID_Event),Tt(t.SETTINGS_STATUS_ROWS_ID_Event),me(t.SETTINGS_STATUS_CHAT_META_ID_Event),tt(t.SETTINGS_STATUS_ERRORS_ID_Event,[]);return}await co(o,t,{skipSaveCurrent:!0})}function uo(t){let e=String(t.getActiveChatKeyEvent()??"").trim();if(!e||ct.get(e)?.dirty)return;let r=t.getActiveStatusesEvent(),s=wr(r),i=Ze(s),o=io(r);ct.set(e,{rows:s,snapshot:i,metaSnapshot:o,dirty:!1,updatedAt:Date.now(),activeStatusCount:r.length}),!(K&&K!==e)&&(K=e,oo(r,t.SETTINGS_STATUS_ROWS_ID_Event,t.SETTINGS_STATUS_DIRTY_HINT_ID_Event,!0))}function wd(t){let e=document.getElementById(t.SETTINGS_STATUS_ROWS_ID_Event),n=document.getElementById(t.SETTINGS_STATUS_ADD_ID_Event),r=document.getElementById(t.SETTINGS_STATUS_SAVE_ID_Event),s=document.getElementById(t.SETTINGS_STATUS_RESET_ID_Event),i=document.getElementById(t.SETTINGS_STATUS_CHAT_LIST_ID_Event),o=document.getElementById(t.SETTINGS_STATUS_SPLITTER_ID_Event),l=document.getElementById(t.SETTINGS_STATUS_COLS_ID_Event);if(!e||e.dataset.statusEditorBound==="1")return;e.dataset.statusEditorBound="1",yd(t.SETTINGS_STATUS_ROWS_ID_Event),o&&Dd(o,t.SETTINGS_STATUS_ROWS_ID_Event),l&&Rd(l,t.SETTINGS_STATUS_ROWS_ID_Event);let a=()=>{let d=Ze(w);Nt(d!==Mt,t.SETTINGS_STATUS_DIRTY_HINT_ID_Event),Ee(t.SETTINGS_STATUS_DIRTY_HINT_ID_Event),ve(t.SETTINGS_STATUS_CHAT_LIST_ID_Event)};uo(t),tt(t.SETTINGS_STATUS_ERRORS_ID_Event,[]),en(t.SETTINGS_STATUS_MEMORY_STATE_ID_Event),me(t.SETTINGS_STATUS_CHAT_META_ID_Event),Lr(t),e.addEventListener("input",d=>{let c=d.target;if(!c)return;let u=String(c.dataset.statusRowId??""),E=String(c.dataset.statusField??"");if(!u||!E)return;let v=w.find(m=>m.rowId===u);v&&(E==="name"&&(v.name=c.value),E==="modifier"&&(v.modifierText=c.value),E==="skills"&&(v.skillsText=c.value),E==="duration"&&(v.durationText=c.value),E==="scope"&&(v.scope=c.value==="all"?"all":"skills",v.scope==="all"&&(v.skillsText=""),Tt(t.SETTINGS_STATUS_ROWS_ID_Event)),E==="enabled"&&(v.enabled=c.checked),a(),tt(t.SETTINGS_STATUS_ERRORS_ID_Event,[]))}),e.addEventListener("change",d=>{let c=d.target;if(!c)return;let u=String(c.dataset.statusRowId??""),E=String(c.dataset.statusField??"");if(!u||E!=="enabled")return;let v=w.find(m=>m.rowId===u);v&&(v.enabled=c.checked,a(),tt(t.SETTINGS_STATUS_ERRORS_ID_Event,[]))}),e.addEventListener("click",d=>{let u=d.target?.closest("button[data-status-remove-id]");if(!u)return;let E=String(u.dataset.statusRemoveId??"");E&&(w=w.filter(v=>v.rowId!==E),Tt(t.SETTINGS_STATUS_ROWS_ID_Event),a(),tt(t.SETTINGS_STATUS_ERRORS_ID_Event,[]))}),i?.addEventListener("click",d=>{let u=d.target?.closest("button[data-status-chat-key]");if(!u)return;let E=String(u.dataset.statusChatKey??"").trim();!E||E===K||co(E,t)}),n?.addEventListener("click",()=>{w=[...w,so()],Tt(t.SETTINGS_STATUS_ROWS_ID_Event),a(),tt(t.SETTINGS_STATUS_ERRORS_ID_Event,[])}),r?.addEventListener("click",()=>{(async()=>{let d=String(K??"").trim();if(!d)return;let c=String(t.getActiveChatKeyEvent()??"").trim(),u=d===c?t.getActiveStatusesEvent():await t.loadStatusesForChatKeyEvent(d),E=xd(w,u);if(E.errors.length>0){tt(t.SETTINGS_STATUS_ERRORS_ID_Event,E.errors);return}d===c?t.setActiveStatusesEvent(E.statuses):await t.saveStatusesForChatKeyEvent(d,E.statuses),w=wr(E.statuses),Mt=Ze(w),wt=io(E.statuses),Nt(!1,t.SETTINGS_STATUS_DIRTY_HINT_ID_Event),Ee(t.SETTINGS_STATUS_DIRTY_HINT_ID_Event);let v=_t.find(m=>m.chatKey===d);v&&(v.updatedAt=Date.now(),v.activeStatusCount=E.statuses.length),Tt(t.SETTINGS_STATUS_ROWS_ID_Event),ve(t.SETTINGS_STATUS_CHAT_LIST_ID_Event),me(t.SETTINGS_STATUS_CHAT_META_ID_Event),tt(t.SETTINGS_STATUS_ERRORS_ID_Event,[]),t.syncSettingsUiEvent?.(),t.pushToChat?.(d===c?"\u72B6\u6001\u7F16\u8F91\u5668\uFF1A\u5DF2\u4FDD\u5B58\u5E76\u7ACB\u5373\u5E94\u7528\u5230\u5F53\u524D\u804A\u5929\u3002":`\u72B6\u6001\u7F16\u8F91\u5668\uFF1A\u5DF2\u4FDD\u5B58\u5230\u804A\u5929 ${d}\u3002`)})()}),s?.addEventListener("click",()=>{(async()=>{let d=String(K??"").trim();if(!d)return;let c=String(t.getActiveChatKeyEvent()??"").trim();d===c?t.setActiveStatusesEvent([]):await t.saveStatusesForChatKeyEvent(d,[]),w=[],Mt="[]",wt="[]",Nt(!1,t.SETTINGS_STATUS_DIRTY_HINT_ID_Event),Ee(t.SETTINGS_STATUS_DIRTY_HINT_ID_Event);let u=_t.find(E=>E.chatKey===d);u&&(u.updatedAt=Date.now(),u.activeStatusCount=0),Tt(t.SETTINGS_STATUS_ROWS_ID_Event),ve(t.SETTINGS_STATUS_CHAT_LIST_ID_Event),me(t.SETTINGS_STATUS_CHAT_META_ID_Event),tt(t.SETTINGS_STATUS_ERRORS_ID_Event,[]),t.syncSettingsUiEvent?.(),t.pushToChat?.(d===c?"\u72B6\u6001\u7F16\u8F91\u5668\uFF1A\u5DF2\u91CD\u7F6E\u5F53\u524D\u804A\u5929\u72B6\u6001\u3002":`\u72B6\u6001\u7F16\u8F91\u5668\uFF1A\u804A\u5929 ${d} \u5DF2\u91CD\u7F6E\u3002`)})()}),Ji||(document.addEventListener("st-roll-status-editor-opened",()=>{Lr(t)}),Ji=!0),Qi||(Qi=t.subscribeMemoryPluginStateEvent(d=>{Yt=d.enabled?"\u8BB0\u5FC6\u5E93\uFF1A\u5DF2\u542F\u7528":"\u8BB0\u5FC6\u5E93\uFF1A\u5DF2\u5B89\u88C5\uFF08\u672A\u542F\u7528\uFF09",en(t.SETTINGS_STATUS_MEMORY_STATE_ID_Event),Lr(t)}))}function Eo(t){fd({drawerToggleId:t.drawerToggleId,drawerContentId:t.drawerContentId,...t.tabsAndModalDepsEvent}),Td(t.basicSettingsInputsDepsEvent),_d(t.skillPresetActionsDepsEvent),Cd(t.skillRowsEditingActionsDepsEvent),$d(t.skillImportExportActionsDepsEvent),wd(t.statusEditorActionsDepsEvent),bd(t.ruleTextActionsDepsEvent)}function vo(t){return{getRows:t.getRowsEvent,setRows:t.setRowsEvent,getSnapshot:t.getSnapshotEvent,setSnapshot:t.setSnapshotEvent}}function Cd(t){let e=document.getElementById(t.SETTINGS_SKILL_ROWS_ID_Event),n=document.getElementById(t.SETTINGS_SKILL_ADD_ID_Event);e?.addEventListener("input",r=>{let s=r.target;if(!s)return;let i=String(s.dataset.skillRowId??""),o=String(s.dataset.skillField??"");if(!i||!o)return;let a=t.skillDraftAccessorEvent.getRows().find(d=>d.rowId===i);a&&(o==="name"?a.skillName=s.value:o==="modifier"&&(a.modifierText=s.value),t.refreshSkillDraftDirtyStateEvent(),t.renderSkillValidationErrorsEvent([]))}),e?.addEventListener("click",r=>{let i=r.target?.closest("button[data-skill-remove-id]");if(!i)return;let o=String(i.dataset.skillRemoveId??"");if(!o)return;let l=t.skillDraftAccessorEvent.getRows().filter(a=>a.rowId!==o);t.skillDraftAccessorEvent.setRows(l),t.renderSkillRowsEvent(),t.refreshSkillDraftDirtyStateEvent(),t.renderSkillValidationErrorsEvent([])}),n?.addEventListener("click",()=>{let r=[...t.skillDraftAccessorEvent.getRows(),t.createSkillEditorRowDraftEvent("","")];t.skillDraftAccessorEvent.setRows(r),t.renderSkillRowsEvent(),t.refreshSkillDraftDirtyStateEvent(),t.renderSkillValidationErrorsEvent([])})}function $d(t){let e=document.getElementById(t.SETTINGS_SKILL_IMPORT_TOGGLE_ID_Event),n=document.getElementById(t.SETTINGS_SKILL_IMPORT_AREA_ID_Event),r=document.getElementById(t.SETTINGS_SKILL_TEXT_ID_Event),s=document.getElementById(t.SETTINGS_SKILL_IMPORT_APPLY_ID_Event),i=document.getElementById(t.SETTINGS_SKILL_EXPORT_ID_Event),o=document.getElementById(t.SETTINGS_SKILL_SAVE_ID_Event),l=document.getElementById(t.SETTINGS_SKILL_RESET_ID_Event);e?.addEventListener("click",()=>{if(!n)return;let a=n.hidden;if(n.hidden=!a,e.textContent=a?"\u6536\u8D77\u5BFC\u5165":"\u5BFC\u5165 JSON",!a||!r)return;let d=t.serializeSkillRowsToSkillTableTextEvent(t.skillDraftAccessorEvent.getRows());r.value=d??t.getActiveSkillPresetEvent(t.getSkillPresetStoreEvent(t.getSettingsEvent())).skillTableText}),s?.addEventListener("click",()=>{let a=String(r?.value??"");if(t.normalizeSkillTableTextForSettingsEvent(a)==null){t.renderSkillValidationErrorsEvent(['\u5BFC\u5165\u5931\u8D25\uFF1A\u5FC5\u987B\u662F JSON \u5BF9\u8C61\uFF08\u4F8B\u5982 {"\u5BDF\u89C9":15,"\u8BF4\u670D":8}\uFF09\u3002']);return}let d=t.deserializeSkillTableTextToRowsEvent(a),c=t.validateSkillRowsEvent(d);if(c.errors.length>0){t.renderSkillValidationErrorsEvent(c.errors);return}t.skillDraftAccessorEvent.setRows(d),t.renderSkillRowsEvent(),t.refreshSkillDraftDirtyStateEvent(),t.renderSkillValidationErrorsEvent([])}),i?.addEventListener("click",()=>{let a=t.validateSkillRowsEvent(t.skillDraftAccessorEvent.getRows()),d=t.getSettingsEvent(),c=t.getActiveSkillPresetEvent(t.getSkillPresetStoreEvent(d)),u=a.errors.length?c.skillTableText:JSON.stringify(a.table,null,2);a.errors.length>0?t.renderSkillValidationErrorsEvent(["\u5F53\u524D\u8349\u7A3F\u6709\u6821\u9A8C\u9519\u8BEF\uFF0C\u5DF2\u5BFC\u51FA\u5DF2\u4FDD\u5B58\u7684\u6280\u80FD\u8868\u3002"]):t.renderSkillValidationErrorsEvent([]),t.copyTextToClipboardEvent(u).then(E=>{if(E){t.pushToChat("\u2705 \u6280\u80FD\u8868 JSON \u5DF2\u590D\u5236\u5230\u526A\u8D34\u677F\u3002");return}n&&(n.hidden=!1),e&&(e.textContent="\u6536\u8D77\u5BFC\u5165"),r&&(r.value=u),t.pushToChat("\u26A0\uFE0F \u526A\u8D34\u677F\u4E0D\u53EF\u7528\uFF0C\u8BF7\u5728\u5BFC\u5165\u6846\u4E2D\u624B\u52A8\u590D\u5236 JSON\u3002")})}),o?.addEventListener("click",()=>{let a=t.validateSkillRowsEvent(t.skillDraftAccessorEvent.getRows());if(a.errors.length>0){t.renderSkillValidationErrorsEvent(a.errors),t.pushToChat("\u274C \u6280\u80FD\u8868\u4FDD\u5B58\u5931\u8D25\uFF0C\u8BF7\u5148\u4FEE\u6B63\u6821\u9A8C\u9519\u8BEF\u3002");return}let d=JSON.stringify(a.table,null,2),c=t.deserializeSkillTableTextToRowsEvent(d);t.skillDraftAccessorEvent.setRows(c),t.skillDraftAccessorEvent.setSnapshot(t.buildSkillDraftSnapshotEvent(c));let u=t.getSettingsEvent(),E=t.getSkillPresetStoreEvent(u),v=t.getActiveSkillPresetEvent(E);v.skillTableText=d,v.updatedAt=Date.now(),t.renderSkillRowsEvent(),t.setSkillDraftDirtyEvent(!1),t.renderSkillValidationErrorsEvent([]),t.saveSkillPresetStoreEvent(E),r&&(r.value=d)}),l?.addEventListener("click",()=>{t.skillDraftAccessorEvent.setRows([]),t.renderSkillRowsEvent(),t.refreshSkillDraftDirtyStateEvent(),t.renderSkillValidationErrorsEvent([])})}function mo(t){return t.isSkillDraftDirtyEvent()?window.confirm("\u6280\u80FD\u6539\u52A8\u672A\u4FDD\u5B58\uFF0C\u662F\u5426\u4E22\u5F03\u5E76\u7EE7\u7EED\uFF1F")?(t.hydrateSkillDraftFromSettingsEvent(!0),!0):!1:!0}function go(t){if(!t||t.hidden)return!1;let e=window.getComputedStyle(t);return e.display!=="none"&&e.visibility!=="hidden"}function So(t){return!navigator.clipboard||typeof navigator.clipboard.writeText!="function"?Promise.resolve(!1):navigator.clipboard.writeText(t).then(()=>!0).catch(()=>!1)}function po(t,e){let n=document.getElementById(e.SETTINGS_SKILL_ERRORS_ID_Event);if(n){if(!t.length){n.hidden=!0,n.innerHTML="";return}n.hidden=!1,n.innerHTML=t.map(r=>`<div class="st-roll-skill-error-item">${e.escapeHtmlEvent(r)}</div>`).join("")}}function fo(t,e){let n=document.getElementById(e.SETTINGS_SKILL_PRESET_LIST_ID_Event);if(n){if(!t.presets.length){n.innerHTML='<div class="st-roll-skill-preset-empty">\u6682\u65E0\u9884\u8BBE</div>';return}n.innerHTML=t.presets.map(r=>{let s=r.id===t.activePresetId,i=s&&Number.isFinite(Number(e.activeDraftCountEvent))?Number(e.activeDraftCountEvent):e.countSkillEntriesFromSkillTableTextEvent(r.skillTableText),o=e.escapeAttrEvent(r.id),l=e.escapeHtmlEvent(r.name);return`
        <button type="button" class="st-roll-skill-preset-item ${s?"is-active":""}" data-skill-preset-id="${o}">
          <span class="st-roll-skill-preset-name">${l}</span>
          <span class="st-roll-skill-preset-tags">
            <span class="st-roll-skill-preset-tag">${i}</span>
            ${s?'<span class="st-roll-skill-preset-tag active">\u751F\u6548\u4E2D</span>':""}
            ${r.locked?'<span class="st-roll-skill-preset-tag locked">\u9ED8\u8BA4</span>':""}
          </span>
        </button>
      `}).join("")}}function To(t,e){let n=e.getActiveSkillPresetEvent(t),r=document.getElementById(e.SETTINGS_SKILL_PRESET_META_ID_Event);if(r){let o=Number.isFinite(Number(e.activeDraftCountEvent))?Number(e.activeDraftCountEvent):e.countSkillEntriesFromSkillTableTextEvent(n.skillTableText);r.textContent=`\u5F53\u524D\u9884\u8BBE\uFF1A${n.name}\uFF08\u6280\u80FD ${o} \u9879\uFF09`}let s=document.getElementById(e.SETTINGS_SKILL_PRESET_NAME_ID_Event);s&&s.value!==n.name&&(s.value=n.name);let i=document.getElementById(e.SETTINGS_SKILL_PRESET_DELETE_ID_Event);i&&(i.disabled=n.locked,i.style.opacity=n.locked?"0.5":"1",i.title=n.locked?"\u9ED8\u8BA4\u9884\u8BBE\u4E0D\u53EF\u5220\u9664":"")}function _o(t,e){let n=document.getElementById(e.SETTINGS_SKILL_ROWS_ID_Event);if(n){if(!t.length){n.innerHTML='<div class="st-roll-skill-empty">\u6682\u65E0\u6280\u80FD\uFF0C\u70B9\u51FB\u201C\u65B0\u589E\u6280\u80FD\u201D\u5F00\u59CB\u914D\u7F6E\u3002</div>';return}n.innerHTML=t.map(r=>{let s=e.escapeAttrEvent(String(r.rowId??"")),i=e.escapeAttrEvent(String(r.skillName??"")),o=e.escapeAttrEvent(String(r.modifierText??""));return`
      <div class="st-roll-skill-row" data-row-id="${s}">
        <input
          class="st-roll-input st-roll-skill-name"
          type="text"
          placeholder="\u4F8B\u5982\uFF1A\u5BDF\u89C9"
          data-skill-row-id="${s}"
          data-skill-field="name"
          value="${i}"
        />
        <input
          class="st-roll-input st-roll-skill-modifier"
          type="text"
          inputmode="numeric"
          placeholder="\u4F8B\u5982\uFF1A15"
          data-skill-row-id="${s}"
          data-skill-field="modifier"
          value="${o}"
        />
        <button type="button" class="st-roll-btn secondary st-roll-skill-remove" data-skill-remove-id="${s}">
          \u5220\u9664
        </button>
      </div>
    `}).join("")}}function bo(t){let e=t.getSettingsEvent(),n=document.getElementById(t.SETTINGS_ENABLED_ID_Event),r=document.getElementById(t.SETTINGS_RULE_ID_Event),s=document.getElementById(t.SETTINGS_AI_ROLL_MODE_ID_Event),i=document.getElementById(t.SETTINGS_AI_ROUND_CONTROL_ID_Event),o=document.getElementById(t.SETTINGS_EXPLODING_ENABLED_ID_Event),l=document.getElementById(t.SETTINGS_ADVANTAGE_ENABLED_ID_Event),a=document.getElementById(t.SETTINGS_DYNAMIC_RESULT_GUIDANCE_ID_Event),d=document.getElementById(t.SETTINGS_DYNAMIC_DC_REASON_ID_Event),c=document.getElementById(t.SETTINGS_STATUS_SYSTEM_ENABLED_ID_Event),u=document.getElementById(t.SETTINGS_ALLOWED_DICE_SIDES_ID_Event),E=document.getElementById(t.SETTINGS_SUMMARY_DETAIL_ID_Event),v=document.getElementById(t.SETTINGS_SUMMARY_ROUNDS_ID_Event),m=document.getElementById(t.SETTINGS_SCOPE_ID_Event),f=document.getElementById(t.SETTINGS_OUTCOME_BRANCHES_ID_Event),S=document.getElementById(t.SETTINGS_EXPLODE_OUTCOME_ID_Event),g=document.getElementById(t.SETTINGS_SUMMARY_OUTCOME_ID_Event),_=document.getElementById(t.SETTINGS_LIST_OUTCOME_PREVIEW_ID_Event),h=document.getElementById(t.SETTINGS_TIME_LIMIT_ENABLED_ID_Event),x=document.getElementById(t.SETTINGS_TIME_LIMIT_MIN_ID_Event),T=document.getElementById(t.SETTINGS_TIME_LIMIT_ROW_ID_Event),p=document.getElementById(t.SETTINGS_SKILL_ENABLED_ID_Event),I=document.getElementById(t.SETTINGS_STATUS_EDITOR_OPEN_ID_Event),A=document.getElementById(t.SETTINGS_RULE_TEXT_ID_Event);if(n&&(n.checked=!!e.enabled),r&&(r.checked=!!e.autoSendRuleToAI),s&&(s.checked=!!e.enableAiRollMode),i&&(i.checked=!!e.enableAiRoundControl),o&&(o.checked=!!e.enableExplodingDice),l&&(l.checked=!!e.enableAdvantageSystem),a&&(a.checked=!!e.enableDynamicResultGuidance),d&&(d.checked=!!e.enableDynamicDcReason),c&&(c.checked=!!e.enableStatusSystem),u&&(u.value=String(e.aiAllowedDiceSidesText||"")),E&&(E.value=e.summaryDetailMode),v&&(v.value=String(e.summaryHistoryRounds)),m&&(m.value=e.eventApplyScope),f&&(f.checked=!!e.enableOutcomeBranches),S&&(S.checked=!!e.enableExplodeOutcomeBranch),g&&(g.checked=!!e.includeOutcomeInSummary),_&&(_.checked=!!e.showOutcomePreviewInListCard),S&&(S.disabled=!e.enableOutcomeBranches,S.style.opacity=e.enableOutcomeBranches?"1":"0.5"),g&&(g.disabled=!e.enableOutcomeBranches,g.style.opacity=e.enableOutcomeBranches?"1":"0.5"),_&&(_.disabled=!e.enableOutcomeBranches,_.style.opacity=e.enableOutcomeBranches?"1":"0.5"),h&&(h.checked=!!e.enableTimeLimit),x&&(x.value=String(e.minTimeLimitSeconds),x.disabled=!e.enableTimeLimit,x.style.opacity=e.enableTimeLimit?"1":"0.5"),T?.classList.toggle("is-disabled",!e.enableTimeLimit),p&&(p.checked=!!e.enableSkillSystem),I&&(I.disabled=!e.enableStatusSystem,I.style.opacity=e.enableStatusSystem?"1":"0.5"),document.getElementById(t.SETTINGS_STATUS_ROWS_ID_Event)){let D=String(t.getActiveChatKeyEvent()??"").trim();D&&(uo({SETTINGS_STATUS_ROWS_ID_Event:t.SETTINGS_STATUS_ROWS_ID_Event,SETTINGS_STATUS_DIRTY_HINT_ID_Event:t.SETTINGS_STATUS_DIRTY_HINT_ID_Event,getActiveChatKeyEvent:()=>D,getActiveStatusesEvent:t.getActiveStatusesEvent}),ct.get(D)?.dirty||tt(t.SETTINGS_STATUS_ERRORS_ID_Event,[]))}if(!t.isSkillDraftDirtyEvent()){let D=String(e.skillTableText??"{}"),N=String(e.skillPresetStoreText??""),M=document.getElementById(t.SETTINGS_SKILL_ROWS_ID_Event);(D!==t.getSkillEditorLastSettingsTextEvent()||N!==t.getSkillEditorLastPresetStoreTextEvent()||!M||!M.hasChildNodes())&&t.hydrateSkillDraftFromSettingsEvent()}if(A){let D=typeof e.ruleText=="string"?e.ruleText:"";A.value!==D&&(A.value=D)}}function ho(t){let e=[],n="[]",r="",s="",i="",o=!1,l="";function a(g){o=!!g;let _=document.getElementById(t.SETTINGS_SKILL_DIRTY_HINT_ID_Event);_&&(_.hidden=!o)}function d(){return o}function c(){let g=t.buildSkillDraftSnapshotEvent(e);a(g!==n)}function u(g){po(g,{SETTINGS_SKILL_ERRORS_ID_Event:t.SETTINGS_SKILL_ERRORS_ID_Event,escapeHtmlEvent:t.escapeHtmlEvent})}function E(){let g=new Set;for(let _ of e){let h=String(_.skillName??"").trim().toLowerCase();h&&g.add(h)}return g.size}function v(){let g=t.getSettingsEvent(),_=t.getSkillPresetStoreEvent(g),h=E();fo(_,{SETTINGS_SKILL_PRESET_LIST_ID_Event:t.SETTINGS_SKILL_PRESET_LIST_ID_Event,countSkillEntriesFromSkillTableTextEvent:t.countSkillEntriesFromSkillTableTextEvent,escapeAttrEvent:t.escapeAttrEvent,escapeHtmlEvent:t.escapeHtmlEvent,activeDraftCountEvent:h}),To(_,{SETTINGS_SKILL_PRESET_META_ID_Event:t.SETTINGS_SKILL_PRESET_META_ID_Event,SETTINGS_SKILL_PRESET_NAME_ID_Event:t.SETTINGS_SKILL_PRESET_NAME_ID_Event,SETTINGS_SKILL_PRESET_DELETE_ID_Event:t.SETTINGS_SKILL_PRESET_DELETE_ID_Event,countSkillEntriesFromSkillTableTextEvent:t.countSkillEntriesFromSkillTableTextEvent,getActiveSkillPresetEvent:t.getActiveSkillPresetEvent,activeDraftCountEvent:h})}function m(){_o(e,{SETTINGS_SKILL_ROWS_ID_Event:t.SETTINGS_SKILL_ROWS_ID_Event,escapeAttrEvent:t.escapeAttrEvent}),v()}function f(g=!1){if(!g&&d())return;let _=t.getSettingsEvent(),h=t.getSkillPresetStoreEvent(_),x=JSON.stringify(h,null,2),T=t.getActiveSkillPresetEvent(h),p=t.normalizeSkillTableTextForSettingsEvent(T.skillTableText),I=p??"{}";p==null?(e=[],l!==T.skillTableText&&(l=T.skillTableText,b.warn("\u6280\u80FD\u9884\u8BBE\u914D\u7F6E\u65E0\u6548\uFF0C\u5DF2\u6309\u7A7A\u8868\u8F7D\u5165"),t.pushToChatEvent("\u6280\u80FD\u9884\u8BBE\u914D\u7F6E\u683C\u5F0F\u65E0\u6548\uFF0C\u5DF2\u6309\u7A7A\u8868\u8F7D\u5165\u3002"))):(l="",e=t.deserializeSkillTableTextToRowsEvent(I)),i=T.id,n=t.buildSkillDraftSnapshotEvent(e),r=I,s=x,a(!1),u([]),m()}function S(){return mo({isSkillDraftDirtyEvent:d,hydrateSkillDraftFromSettingsEvent:f})}return{setSkillDraftDirtyEvent:a,isSkillDraftDirtyEvent:d,refreshSkillDraftDirtyStateEvent:c,renderSkillRowsEvent:m,renderSkillValidationErrorsEvent:u,hydrateSkillDraftFromSettingsEvent:f,confirmDiscardSkillDraftEvent:S,getSkillRowsDraftEvent:()=>e,setSkillRowsDraftEvent:g=>{e=g},getSkillEditorActivePresetIdEvent:()=>i,setSkillEditorLastSavedSnapshotEvent:g=>{n=g},getSkillEditorLastSavedSnapshotEvent:()=>n,getSkillEditorLastSettingsTextEvent:()=>r,getSkillEditorLastPresetStoreTextEvent:()=>s}}function Io(){return`
      <div>
        \u901A\u7528\u63B7\u9AB0\u547D\u4EE4\uFF0C\u652F\u6301 <code>NdM[!][khX|klX][+/-B]</code>\uFF1A
      </div>
      <ul>
        <li><code>/roll</code>\uFF08\u7B49\u540C\u4E8E <code>/roll 1d20</code>\uFF09</li>
        <li><code>/roll 1d20</code></li>
        <li><code>/roll 3d6+2</code></li>
        <li><code>/roll 2d10-1</code></li>
        <li><code>/roll 1d6!+2</code>\uFF08<code>!</code> \u8868\u793A\u7206\u9AB0\uFF09</li>
        <li><code>/roll 2d20kh1</code>\uFF08\u4FDD\u7559\u6700\u9AD8 1 \u4E2A\uFF09</li>
        <li><code>/roll 2d20kl1</code>\uFF08\u4FDD\u7559\u6700\u4F4E 1 \u4E2A\uFF09</li>
      </ul>
      <div>
        \u7ED3\u679C\u4F1A\u4FDD\u5B58\u5230 <code>chatMetadata.lastRoll</code>\uFF0C\u53EF\u901A\u8FC7
        <code>{{lastRoll}}</code> / <code>{{lastRollTotal}}</code> \u8BFB\u53D6\u3002
      </div>
    `}function xo(){return`
  <div>
    <div><strong>/eventroll \u547D\u4EE4\u5E2E\u52A9</strong></div>
    <ul>
      <li><code>/eventroll list</code>\uFF1A\u5217\u51FA\u5F53\u524D\u8F6E\u6B21\u4E8B\u4EF6</li>
      <li><code>/eventroll roll &lt;eventId&gt;</code>\uFF1A\u63B7\u6307\u5B9A\u4E8B\u4EF6</li>
      <li><code>/eventroll roll &lt;eventId&gt; &lt;diceExpr&gt;</code>\uFF1A\u7528\u81EA\u5B9A\u4E49\u9AB0\u5F0F\u8986\u76D6\u9ED8\u8BA4\u9AB0\u5F0F</li>
      <li><code>/eventroll help</code>\uFF1A\u663E\u793A\u5E2E\u52A9</li>
    </ul>
    <div>
      <strong>rolljson \u7ED3\u679C\u5206\u652F\uFF08outcomes\uFF09</strong>\uFF1A
      <code>events[i].outcomes.success</code> / <code>failure</code> / <code>explode</code>.
      \u5F53 <code>checkDice</code> \u542B <code>!</code> \u4E14\u89E6\u53D1\u7206\u9AB0\u65F6\uFF0C\u4F18\u5148\u4F7F\u7528 <code>explode</code>\u3002
    </div>
    <div>
      <strong>\u4F18\u52BF / \u52A3\u52BF</strong>\uFF1A
      \u4F60\u53EF\u4EE5\u628A <code>events[i].advantageState</code> \u8BBE\u4E3A
      <code>normal</code> / <code>advantage</code> / <code>disadvantage</code>,
      \u4E5F\u53EF\u4EE5\u76F4\u63A5\u5728 <code>checkDice</code> \u91CC\u5199\u4FDD\u7559\u8BED\u6CD5\uFF0C\u4F8B\u5982
      <code>2d20kh1</code> / <code>2d20kl1</code>.
      \u8868\u8FBE\u5F0F\u91CC\u7684\u4FDD\u7559\u8BED\u6CD5\u4F18\u5148\u7EA7\u9AD8\u4E8E <code>advantageState</code>\u3002
    </div>
    <div>
      <strong>\u52A8\u6001\u89C4\u5219\u6CE8\u5165</strong>\uFF1A
      \u7CFB\u7EDF\u4F1A\u6839\u636E\u5F53\u524D\u8BBE\u7F6E\u81EA\u52A8\u6CE8\u5165\u53EF\u7528\u80FD\u529B\uFF08\u5982\u7206\u9AB0\u3001\u4F18\u52BF/\u52A3\u52BF\u3001\u8D70\u5411\u5206\u652F\uFF09\u3002
      \u7206\u9AB0\u4E0E\u4F18\u52A3\u9AB0\u4F1A\u6539\u53D8\u5224\u5B9A\u7ED3\u679C\uFF0C\u5E76\u901A\u8FC7 <code>outcomes</code> \u76F4\u63A5\u5F71\u54CD\u5267\u60C5\u8D70\u5411\u3002
    </div>
    <div>
      <strong>\u4E8B\u4EF6\u76EE\u6807</strong>\uFF1A
      \u53EF\u9009 <code>events[i].target = { type, name? }</code>\uFF0C\u5176\u4E2D
      <code>type</code> \u53EF\u4E3A <code>self</code>/<code>scene</code>/<code>supporting</code>/<code>object</code>/<code>other</code>\u3002
    </div>
  </div>`}function yo(t){return`<pre>${t}</pre>`}function Do(t){return`\u9AB0\u5B50\u8C03\u8BD5\u6A21\u5F0F
<pre>${t}</pre>`}function Ro(t){let{registerMacro:e,SlashCommandParser:n,SlashCommand:r,SlashCommandArgument:s,ARGUMENT_TYPE:i,getDiceMeta:o,rollExpression:l,saveLastRoll:a,buildResultMessage:d,pushToChat:c}=t,u=globalThis;u.__stRollBaseMacrosRegisteredEvent||(e("lastRollTotal",()=>{let E=o();return E.lastTotal==null?"\u5C1A\u672A\u63B7\u9AB0\uFF0C\u8BF7\u5148\u4F7F\u7528 /roll":String(E.lastTotal)}),e("lastRoll",()=>{let E=o();return E.last?JSON.stringify(E.last,null,2):"\u5C1A\u672A\u63B7\u9AB0\uFF0C\u8BF7\u5148\u4F7F\u7528 /roll"}),u.__stRollBaseMacrosRegisteredEvent=!0),!u.__stRollBaseCommandRegisteredEvent&&(!n||!r||!s||!i||(n.addCommandObject(r.fromProps({name:"roll",aliases:["dice"],returns:"\u901A\u7528\u9AB0\u5B50\uFF1A\u652F\u6301 NdM+X\uFF0C\u4F8B\u5982 3d6+2\u30011d20",namedArgumentList:[],unnamedArgumentList:[s.fromProps({description:"\u9AB0\u5B50\u8868\u8FBE\u5F0F\uFF08\u5982 1d20\u30013d6+2\uFF09\u3002\u7559\u7A7A\u7B49\u4E8E 1d20\u3002",typeList:i.STRING,isRequired:!1})],helpString:Io(),callback:(E,v)=>{try{let f=(v??"").toString().trim()||"1d20",S=l(f);a(S);let g=d(S);return c(g)??""}catch(m){let f=`\u63B7\u9AB0\u51FA\u9519\uFF1A${m?.message??String(m)}`;return c(f)??""}}})),u.__stRollBaseCommandRegisteredEvent=!0))}function Ao(t){return t===0?"0":t>0?`+${t}`:`${t}`}function Pr(t){return t.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;").replace(/`/g,"&#96;")}function Pd(t){let e=[],n=Array.isArray(t.rolls)&&t.rolls.length>0?`[${t.rolls.join(", ")}]`:"[]",r=Number.isFinite(Number(t.rawTotal))?Number(t.rawTotal):0,s=Number.isFinite(Number(t.modifier))?Number(t.modifier):0,i=Number.isFinite(Number(t.total))?Number(t.total):r+s;return e.push(`\u9AB0\u9762 ${n}`),e.push(`\u539F\u59CB\u503C ${r}`),e.push(`\u4FEE\u6B63\u503C ${Ao(s)}`),e.push(`\u603B\u8BA1 ${i}`),t.exploding&&e.push(t.explosionTriggered?"\u7206\u9AB0\u5DF2\u89E6\u53D1":"\u7206\u9AB0\u5DF2\u542F\u7528"),e.join(" | ")}function Se(t,e,n,r=56){if(e===6){let a=({1:[[24,24]],2:[[14,14],[34,34]],3:[[14,14],[24,24],[34,34]],4:[[14,14],[14,34],[34,14],[34,34]],5:[[14,14],[14,34],[24,24],[34,14],[34,34]],6:[[14,14],[14,24],[14,34],[34,14],[34,24],[34,34]]}[t]||[]).map(([d,c])=>`<circle cx="${d}" cy="${c}" r="4" fill="${n}" />`).join("");return`
      <svg width="${r}" height="${r}" viewBox="0 0 48 48" style="display:inline-block; vertical-align: middle;">
          <rect x="4" y="4" width="40" height="40" rx="8" ry="8" fill="none" stroke="${n}" stroke-width="3" />
          ${a}
      </svg>`}return`
      <svg width="${r}" height="${r}" viewBox="0 0 48 48" style="display:inline-block; vertical-align: middle;">
          <path d="M24 4 L43 14 L43 34 L24 44 L5 34 L5 14 Z" fill="none" stroke="${n}" stroke-width="3" />
          <path d="M24 4 L24 24 M24 24 L43 34 M24 24 L5 34" stroke="${n}" stroke-width="1.5" opacity="0.6"/>
          <text x="24" y="33" font-size="18" text-anchor="middle" fill="${n}" font-weight="bold" style="font-family: sans-serif;">${t}</text>
      </svg>`}function nn(t,e=52){let n=Math.round(e/2),r=Math.max(20,Math.round(e*.42));return`
    <div class="cube-scene" style="perspective: 600px; width: ${e}px; height: ${e}px;">
      <div class="cube" style="
        width: 100%; height: 100%; position: relative; transform-style: preserve-3d;
      ">
        <div class="cube-face front"  style="position: absolute; width: ${e}px; height: ${e}px; border: 2px solid ${t}; background: rgba(43, 29, 29, 0.8); color: ${t}; line-height: ${e}px; text-align: center; font-weight: bold; font-size: ${r}px; transform: rotateY(  0deg) translateZ(${n}px);">?</div>
        <div class="cube-face back"   style="position: absolute; width: ${e}px; height: ${e}px; border: 2px solid ${t}; background: rgba(43, 29, 29, 0.8); color: ${t}; line-height: ${e}px; text-align: center; font-weight: bold; font-size: ${r}px; transform: rotateY(180deg) translateZ(${n}px);">?</div>
        <div class="cube-face right"  style="position: absolute; width: ${e}px; height: ${e}px; border: 2px solid ${t}; background: rgba(43, 29, 29, 0.8); color: ${t}; line-height: ${e}px; text-align: center; font-weight: bold; font-size: ${r}px; transform: rotateY( 90deg) translateZ(${n}px);">?</div>
        <div class="cube-face left"   style="position: absolute; width: ${e}px; height: ${e}px; border: 2px solid ${t}; background: rgba(43, 29, 29, 0.8); color: ${t}; line-height: ${e}px; text-align: center; font-weight: bold; font-size: ${r}px; transform: rotateY(-90deg) translateZ(${n}px);">?</div>
        <div class="cube-face top"    style="position: absolute; width: ${e}px; height: ${e}px; border: 2px solid ${t}; background: rgba(43, 29, 29, 0.8); color: ${t}; line-height: ${e}px; text-align: center; font-weight: bold; font-size: ${r}px; transform: rotateX( 90deg) translateZ(${n}px);">?</div>
        <div class="cube-face bottom" style="position: absolute; width: ${e}px; height: ${e}px; border: 2px solid ${t}; background: rgba(43, 29, 29, 0.8); color: ${t}; line-height: ${e}px; text-align: center; font-weight: bold; font-size: ${r}px; transform: rotateX(-90deg) translateZ(${n}px);">?</div>
      </div>
    </div>
  `}function Or(t){let e=Ao(t.modifier),n=t.rolls.join(", "),r=t.modifier!==0,s="d"+Math.random().toString(36).substr(2,9),i={border:"#c5a059",bg:"linear-gradient(135deg, #2b1d1d 0%, #1a1010 100%)",headerBg:"rgba(0, 0, 0, 0.4)",textMain:"#e8dcb5",textHighlight:"#ffdb78",critSuccess:"#4caf50",critFail:"#f44336"},o="normal",l="",a=i.textHighlight,d="0 2px 4px rgba(0,0,0,0.5)",c=i.bg,u=i.border;if(t.count===1){let _=t.rolls[0],h=t.sides;_===h?(o="success",l="\u5927\u6210\u529F\uFF01",a=i.critSuccess,d="0 0 15px rgba(76, 175, 80, 0.8)",c="linear-gradient(135deg, #1b3320 0%, #0d1a10 100%)",u=i.critSuccess):_===1&&(o="fail",l="\u5927\u5931\u8D25\uFF01",a=i.critFail,d="0 0 15px rgba(244, 67, 54, 0.8)",c="linear-gradient(135deg, #331b1b 0%, #1a0d0d 100%)",u=i.critFail)}let E=t.rolls.length<=5,v=Pd(t),m=E?t.rolls.map((_,h)=>{let x=Se(_,t.sides,a),T=`${v} | \u7B2C${h+1}\u9897: ${_}`;return`<span style="display:inline-flex;cursor:help;" title="${Pr(T)}">${x}</span>`}).join(" "):`<span style="display:inline-flex;cursor:help;" title="${Pr(v)}">${Se(0,t.sides,a)}</span>`,f=nn(i.textHighlight),S=[];t.rolls.length&&S.push(`\u9AB0\u9762: [${n}]`),r&&S.push(`\u4FEE\u6B63\u503C: ${e}`),t.exploding&&S.push(t.explosionTriggered?"\u7206\u9AB0\u5DF2\u89E6\u53D1":"\u7206\u9AB0\u5DF2\u542F\u7528");let g=S.join(" | ");return`
  <style>
    @keyframes spin-3d-${s} {
      0% { transform: rotateX(0deg) rotateY(0deg); }
      100% { transform: rotateX(360deg) rotateY(360deg); }
    }
    @keyframes fade-out-${s} {
      0% { opacity: 1; }
      90% { opacity: 0; }
      100% { opacity: 0; display: none; }
    }
    @keyframes fade-in-${s} {
      0% { opacity: 0; transform: scale(0.8); }
      100% { opacity: 1; transform: scale(1); }
    }
    @keyframes pulse-crit-${s} {
      0% { transform: scale(1); }
      50% { transform: scale(1.1); }
      100% { transform: scale(1); }
    }
    @keyframes shake-crit-${s} {
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
    
    .dice-wrapper-${s} {
      position: relative;
      min-height: 100px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }
    
    .dice-rolling-${s} {
      position: absolute;
      top: 50%; left: 50%;
      transform: translate(-50%, -50%);
      animation: fade-out-${s} 0.2s forwards 1.2s;
      z-index: 10;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    
    .dice-rolling-${s} .cube {
      animation: spin-3d-${s} 1.5s linear infinite;
    }

    .dice-result-${s} {
      opacity: 0;
      animation: fade-in-${s} 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards 1.3s;
      text-align: center;
      width: 100%;
    }

    .crit-success-${s} {
      animation: pulse-crit-${s} 1s infinite;
      color: ${i.critSuccess};
      font-weight: bold;
      margin-bottom: 8px;
      text-shadow: 0 0 10px rgba(76, 175, 80, 0.5);
    }

    .crit-fail-${s} {
      animation: shake-crit-${s} 0.5s;
      color: ${i.critFail};
      font-weight: bold;
      margin-bottom: 8px;
      text-shadow: 0 0 10px rgba(244, 67, 54, 0.5);
    }

    .explosion-note-${s} {
      color: #ffae42;
      font-weight: bold;
      margin-bottom: 8px;
      letter-spacing: 1px;
      text-shadow: 0 0 12px rgba(255, 174, 66, 0.6);
    }
  </style>
  
  <div style="
    border: 2px solid ${u};
    border-radius: 4px;
    background: ${c};
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
            <span style="font-weight: bold;">\u9AB0\u5B50\u7CFB\u7EDF</span>
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

    <div class="dice-wrapper-${s}">
        <div class="dice-rolling-${s}">
            ${f}
        </div>

        <div class="dice-result-${s}">
            ${l?`<div class="${o==="success"?`crit-success-${s}`:`crit-fail-${s}`}">${l}</div>`:""}
          ${t.exploding?`<div class="explosion-note-${s}">${t.explosionTriggered?"\u8FDE\u9501\u7206\u9AB0\uFF01":"\u7206\u9AB0\u5DF2\u5F00\u542F"}</div>`:""}
            
            <div style="margin-bottom: 12px; display: flex; justify-content: center; gap: 8px; flex-wrap: wrap;" title="${Pr(v)}">
                ${m}
            </div>

            <div style="
                font-size: 2.5em;
                font-weight: bold;
                color: ${a};
                text-shadow: ${d};
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
              ${g}
            </div>
        </div>

    </div>
  </div>
  `}function Hr(t){let e=t.compactMode===!0,n=e?"92px":"108px",r=e?"8px 0":"14px 0",s=e?"0":"12px",i=e?"auto":"100%";return`
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
        min-height: ${n};
        padding: ${r};
        margin-top: ${s};
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
            ${t.critText?`<div class="${t.critType==="success"?`crit-success-${t.uniqueId}`:`crit-fail-${t.uniqueId}`}">${t.critText}</div>`:""}
             
            <div style="margin-bottom: 8px; display: flex; justify-content: center; gap: 8px; flex-wrap: wrap;">
                ${t.diceVisualsHtml}
            </div>
        </div>
    </div>
    `}var Ct="stx_memory_os",ko="stx_rollhelper";async function Lo(t=1200){try{let e=await xn("plugin:request:ping",{},ko,{to:Ct,timeoutMs:t});return{available:!!e?.alive,enabled:!!e?.isEnabled,pluginId:String(e?.pluginId??Ct),version:String(e?.version??""),capabilities:Array.isArray(e?.capabilities)?e.capabilities.map(n=>String(n)):[]}}catch{return{available:!1,enabled:!1,pluginId:Ct,version:"",capabilities:[]}}}async function Mo(t=1200){try{let e=await xn("plugin:request:memory_chat_keys",{},ko,{to:Ct,timeoutMs:t}),n=Array.isArray(e?.chatKeys)?e.chatKeys.map(r=>String(r??"").trim()).filter(Boolean):[];return{chatKeys:Array.from(new Set(n)),updatedAt:Number.isFinite(Number(e?.updatedAt))?Number(e.updatedAt):null}}catch{return{chatKeys:[],updatedAt:null}}}function No(t){try{return Ss("plugin:broadcast:state_changed",e=>{let n=String(e?.pluginId??"");n&&n!==Ct||t({enabled:!!e?.isEnabled,pluginId:n||Ct})},{from:Ct})}catch{return()=>{}}}var G=ho({SETTINGS_SKILL_DIRTY_HINT_ID_Event:rr,SETTINGS_SKILL_ERRORS_ID_Event:nr,SETTINGS_SKILL_ROWS_ID_Event:te,SETTINGS_SKILL_PRESET_LIST_ID_Event:De,SETTINGS_SKILL_PRESET_META_ID_Event:sr,SETTINGS_SKILL_PRESET_NAME_ID_Event:Ae,SETTINGS_SKILL_PRESET_DELETE_ID_Event:Re,getSettingsEvent:R,getSkillPresetStoreEvent:qe,getActiveSkillPresetEvent:de,normalizeSkillTableTextForSettingsEvent:At,deserializeSkillTableTextToRowsEvent:Dr,buildSkillDraftSnapshotEvent:xr,countSkillEntriesFromSkillTableTextEvent:Gi,pushToChatEvent:j,escapeHtmlEvent:rt,escapeAttrEvent:ie});function Od(t,e,n){return no({...js,drawerToggleId:t,drawerContentId:e,drawerIconId:n})}var Oo=G.isSkillDraftDirtyEvent,wo=G.refreshSkillDraftDirtyStateEvent,Co=G.renderSkillRowsEvent,Br=G.renderSkillValidationErrorsEvent,Hd=G.hydrateSkillDraftFromSettingsEvent,$o=G.confirmDiscardSkillDraftEvent,Po=vo({getRowsEvent:G.getSkillRowsDraftEvent,setRowsEvent:G.setSkillRowsDraftEvent,getSnapshotEvent:G.getSkillEditorLastSavedSnapshotEvent,setSnapshotEvent:G.setSkillEditorLastSavedSnapshotEvent});function Bd(t,e){Eo({drawerToggleId:t,drawerContentId:e,tabsAndModalDepsEvent:{...Xs,confirmDiscardSkillDraftEvent:$o,isElementVisibleEvent:go,isSkillDraftDirtyEvent:Oo},basicSettingsInputsDepsEvent:{...qs,SUMMARY_HISTORY_ROUNDS_MAX_Event:Bt,SUMMARY_HISTORY_ROUNDS_MIN_Event:Ht,DEFAULT_SUMMARY_HISTORY_ROUNDS_Event:Dt.summaryHistoryRounds,updateSettingsEvent:Ye},skillPresetActionsDepsEvent:{...Ws,SKILL_PRESET_DEFAULT_ID_Event:ot,SKILL_PRESET_NEW_NAME_BASE_Event:ne,DEFAULT_SKILL_PRESET_TABLE_TEXT_Event:Gt,getSkillEditorActivePresetIdEvent:G.getSkillEditorActivePresetIdEvent,confirmDiscardSkillDraftEvent:$o,getSettingsEvent:R,getSkillPresetStoreEvent:qe,getSkillPresetByIdEvent:Ge,saveSkillPresetStoreEvent:Ir,getActiveSkillPresetEvent:de,getUniqueSkillPresetNameEvent:Ui,createIdEvent:nt,buildDefaultSkillPresetStoreEvent:()=>Vt(),normalizeSkillPresetNameKeyEvent:zt,renderSkillValidationErrorsEvent:Br,pushToChat:j},skillRowsEditingActionsDepsEvent:{...Js,skillDraftAccessorEvent:Po,createSkillEditorRowDraftEvent:hr,renderSkillRowsEvent:Co,refreshSkillDraftDirtyStateEvent:wo,renderSkillValidationErrorsEvent:Br},skillImportExportActionsDepsEvent:{...Qs,skillDraftAccessorEvent:Po,serializeSkillRowsToSkillTableTextEvent:Fi,getSettingsEvent:R,getSkillPresetStoreEvent:qe,getActiveSkillPresetEvent:de,normalizeSkillTableTextForSettingsEvent:At,deserializeSkillTableTextToRowsEvent:Dr,validateSkillRowsEvent:Rr,renderSkillRowsEvent:Co,refreshSkillDraftDirtyStateEvent:wo,renderSkillValidationErrorsEvent:Br,copyTextToClipboardEvent:So,pushToChat:j,buildSkillDraftSnapshotEvent:xr,setSkillDraftDirtyEvent:G.setSkillDraftDirtyEvent,saveSkillPresetStoreEvent:Ir},statusEditorActionsDepsEvent:{SETTINGS_STATUS_ROWS_ID_Event:Ie,SETTINGS_STATUS_ADD_ID_Event:On,SETTINGS_STATUS_SAVE_ID_Event:Hn,SETTINGS_STATUS_RESET_ID_Event:Bn,SETTINGS_STATUS_ERRORS_ID_Event:xe,SETTINGS_STATUS_DIRTY_HINT_ID_Event:ye,SETTINGS_STATUS_SPLITTER_ID_Event:Gn,SETTINGS_STATUS_COLS_ID_Event:Fn,SETTINGS_STATUS_CHAT_LIST_ID_Event:Un,SETTINGS_STATUS_CHAT_META_ID_Event:Kn,SETTINGS_STATUS_MEMORY_STATE_ID_Event:zn,getActiveStatusesEvent:()=>br(L()),setActiveStatusesEvent:Bi,getActiveChatKeyEvent:Tr,listChatScopedStatusSummariesEvent:Pi,loadStatusesForChatKeyEvent:Oi,saveStatusesForChatKeyEvent:Hi,probeMemoryPluginEvent:Lo,fetchMemoryChatKeysEvent:Mo,subscribeMemoryPluginStateEvent:No,syncSettingsUiEvent:Gr,pushToChat:j},ruleTextActionsDepsEvent:{...Zs,updateSettingsEvent:Ye}})}function Gr(){bo({getSettingsEvent:R,...ti,isSkillDraftDirtyEvent:Oo,hydrateSkillDraftFromSettingsEvent:Hd,getActiveStatusesEvent:()=>br(L()),getActiveChatKeyEvent:Tr,getSkillEditorLastSettingsTextEvent:G.getSkillEditorLastSettingsTextEvent,getSkillEditorLastPresetStoreTextEvent:G.getSkillEditorLastPresetStoreTextEvent})}function Ho(t=0){Mr({SETTINGS_CARD_ID_Event:be,SETTINGS_SKILL_MODAL_ID_Event:ke,SETTINGS_STATUS_MODAL_ID_Event:he,buildSettingsCardHtmlTemplateEvent:ps,buildSettingsCardTemplateIdsEvent:Od,ensureSettingsCardStylesEvent:()=>{eo({SETTINGS_STYLE_ID_Event:Ts,SETTINGS_CARD_ID_Event:be,buildSettingsCardStylesTemplateEvent:fs})},syncSettingsBadgeVersionEvent:()=>{to({SETTINGS_BADGE_ID_Event:Dn,SETTINGS_BADGE_VERSION_Event:or})},syncSettingsUiEvent:Gr,onMountedEvent:({drawerToggleId:e,drawerContentId:n})=>Bd(e,n)},t)}function Bo(){Ro({registerMacro:mi,SlashCommandParser:re,SlashCommand:se,SlashCommandArgument:Me,ARGUMENT_TYPE:Ne,getDiceMeta:ae,rollExpression:We,saveLastRoll:Ve,buildResultMessage:Or,pushToChat:j})}function Go(){Ci(()=>{Gr()})}function jt(t){return t==null||t===""?">=":t===">="||t===">"||t==="<="||t==="<"?t:null}function O(t){return typeof t=="string"?t.trim():""}function Ur(t,e,n,r){let s=O(t);if(!s)return;if(s.length<=r)return s;let i=s.slice(0,r);return b.warn(`outcomes.${e} \u8FC7\u957F\uFF0C\u5DF2\u622A\u65AD: event=${n} len=${s.length}`),`${i}\uFF08\u5DF2\u622A\u65AD\uFF09`}function Gd(t,e,n){let r=O(t);if(!r)return;if(r.length<=n)return r;let s=r.slice(0,n);return b.warn(`dc_reason \u8FC7\u957F\uFF0C\u5DF2\u622A\u65AD: event=${e} len=${r.length}`),`${s}\uFF08\u5DF2\u622A\u65AD\uFF09`}function Ud(t,e,n){if(!t||typeof t!="object")return;let r=Ur(t.success,"success",e,n),s=Ur(t.failure,"failure",e,n),i=Ur(t.explode,"explode",e,n);if(!(!r&&!s&&!i))return{success:r,failure:s,explode:i}}function Kr(t,e){let n=O(t);if(!n)return null;if(!e.test(n))return b.warn("\u975E\u6CD5 timeLimit\uFF0C\u6309\u4E0D\u9650\u65F6\u5904\u7406:",n),null;let r=n.match(/^P(?:(\d+)W)?(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/i);if(!r)return b.warn("\u4E0D\u652F\u6301\u7684 timeLimit \u7EC4\u5408\uFF0C\u6309\u4E0D\u9650\u65F6\u5904\u7406:",n),null;let s=Number(r[1]||0),i=Number(r[2]||0),o=Number(r[3]||0),l=Number(r[4]||0),a=Number(r[5]||0),c=((((s*7+i)*24+o)*60+l)*60+a)*1e3;return!Number.isFinite(c)||c<0?(b.warn("timeLimit \u89E3\u6790\u5931\u8D25\uFF0C\u6309\u4E0D\u9650\u65F6\u5904\u7406:",n),null):c}function rn(t,e){if(!e.enableTimeLimit||t==null)return null;let n=Math.max(1,Math.floor(Number(e.minTimeLimitSeconds)||1)),r=n*1e3;return t<r?(b.info(`timeLimit \u4F4E\u4E8E\u6700\u77ED\u65F6\u9650\uFF0C\u63D0\u5347\u5230 ${n}s\uFF08\u539F\u59CB ${t}ms\uFF09`),r):t}function Kd(t){let e=O(t).toLowerCase();if(e){if(e==="protagonist"||e==="player"||e==="user"||e==="mc"||e==="main_character")return"protagonist";if(e==="all"||e==="any"||e==="both")return"all";if(e==="character"||e==="assistant"||e==="npc"||e==="self")return"character"}}function Fd(t){let e=O(t).toLowerCase();if(e){if(e==="auto"||e==="automatic"||e==="system"||e==="ai")return"auto";if(e==="manual"||e==="user"||e==="player")return"manual"}}function zd(t){let e=O(t).toLowerCase();if(e){if(e==="advantage"||e==="adv"||e==="up"||e==="high"||e==="benefit")return"advantage";if(e==="disadvantage"||e==="dis"||e==="down"||e==="low"||e==="penalty")return"disadvantage";if(e==="normal"||e==="none"||e==="neutral"||e==="off")return"normal"}}function Vd(t){let e=O(t).toLowerCase();if(e){if(e==="self"||e==="protagonist"||e==="player"||e==="mc"||e==="main_character")return"self";if(e==="scene"||e==="situation"||e==="environment"||e==="context")return"scene";if(e==="supporting"||e==="character"||e==="npc"||e==="assistant")return"supporting";if(e==="object"||e==="item"||e==="thing"||e==="prop")return"object";if(e==="other"||e==="misc")return"other"}}function Yd(t,e){let n=O(e);return t==="self"?"\u4E3B\u89D2\u81EA\u5DF1":t==="scene"?"\u573A\u666F":t==="supporting"?n?`\u914D\u89D2 ${n}`:"\u914D\u89D2":t==="object"?n?`\u7269\u4EF6 ${n}`:"\u7269\u4EF6":n?`\u5176\u4ED6\u5BF9\u8C61 ${n}`:"\u5176\u4ED6\u5BF9\u8C61"}function sn(t,e){let n=t&&typeof t=="object"&&!Array.isArray(t)?t:{},r=Vd(n.type??n.targetType??n.kind??t),s=O(n.name??n.targetName??n.label??n.value);r||(e==="protagonist"?r="self":e==="character"?r="supporting":r="scene");let i=s||void 0;return{targetType:r,targetName:i,targetLabel:Yd(r,i)}}function jd(t){if(t.targetType==="self")return!0;if(t.targetType==="supporting"||t.targetType==="object")return!1;if(t.scope==="protagonist"||t.scope==="all")return!0;if(t.scope==="character")return!1;let e=`${t.title}
${t.desc}
${t.skill}
${t.targetLabel}`;return/(\byou\b|\byour\b|\bplayer\b|\bprotagonist\b|主角|玩家|你)/i.test(e)}function Fr(t,e){return e==="all"?t:t.filter(jd)}function zo(t){let e=O(t);if(!e)return null;let n=e.split(/[,\s]+/).map(r=>Number(r.trim())).filter(r=>Number.isFinite(r)&&r>0&&Number.isInteger(r));return n.length===0?null:new Set(n)}function Xd(t,e){let n=zo(e.aiAllowedDiceSidesText);if(!n||n.size===0)return!0;try{let r=W(t);return n.has(r.sides)}catch{return!1}}function qd(t,e){let n=zo(e.aiAllowedDiceSidesText),r=n?Array.from(n).sort((d,c)=>d-c):[];if(r.length===0)return{nextExpr:t,changed:!1,allowedSidesText:""};let s=W(t);if(n.has(s.sides))return{nextExpr:t,changed:!1,allowedSidesText:r.join(",")};let i=r[0],o=s.modifier===0?"":s.modifier>0?`+${s.modifier}`:String(s.modifier),l=s.keepMode&&s.keepCount?`${s.keepMode}${s.keepCount}`:"";return{nextExpr:`${s.count}d${i}${s.explode?"!":""}${l}${o}`,changed:!0,allowedSidesText:r.join(",")}}function Wd(t,e){if(!t||typeof t!="object")return null;let n=O(t.id),r=O(t.title),s=O(t.checkDice),i=O(t.skill),o=O(t.timeLimit),l=O(t.desc),a=jt(t.compare),d=Kd(t.scope??t.eventScope??t.applyTo),c=sn(t.target??{type:t.targetType,name:t.targetName??t.targetLabel},d),u=Fd(t.rollMode),E=zd(t.advantageState??t.advantage??t.advState),v=Number(t.dc),m=Gd(t.dc_reason??t.dcReason,n||"unknown_event",e.OUTCOME_TEXT_MAX_LEN_Event),f={success:t.successOutcome,failure:t.failureOutcome,explode:t.explodeOutcome},S=t.outcomes&&typeof t.outcomes=="object"?{...f,...t.outcomes}:f,g=Ud(S,n||"unknown_event",e.OUTCOME_TEXT_MAX_LEN_Event),_=Kr(o,e.ISO_8601_DURATION_REGEX_Event),h=e.getSettingsEvent(),x=rn(_,h),T=o&&_!=null?o:void 0;if(!n||!r||!s||!i||!l||a==null||!Number.isFinite(v))return null;try{W(s)}catch{return null}if(!Xd(s,h)){let p=qd(s,h);if(p.changed)b.warn(`\u4E8B\u4EF6\u9AB0\u5F0F\u4E0D\u5728\u5141\u8BB8\u9762\u6570\u5217\u8868\u4E2D\uFF0C\u81EA\u52A8\u4FEE\u6B63: event=${n} from=${s} to=${p.nextExpr} allowed=${p.allowedSidesText||"(\u672A\u914D\u7F6E)"}`),s=p.nextExpr;else{let I=O(h.aiAllowedDiceSidesText);return b.warn(`\u4E8B\u4EF6\u9AB0\u5F0F\u4E0D\u5728\u5141\u8BB8\u9762\u6570\u5217\u8868\u4E2D\uFF0C\u5DF2\u5FFD\u7565: event=${n} checkDice=${s} allowed=${I||"(\u672A\u914D\u7F6E)"}`),null}}return{id:n,title:r,checkDice:s,dc:v,compare:a,scope:d,rollMode:u,advantageState:E,skill:i,targetType:c.targetType,targetName:c.targetName,targetLabel:c.targetLabel,timeLimitMs:x,timeLimit:T,desc:l,dcReason:m,outcomes:g}}function Jd(t){if(!t||typeof t!="object")return!1;let e=t;if((e.end_round??e.endRound)===!0)return!0;let r=O(e.round_control??e.roundControl??e.round_action??e.roundAction).toLowerCase();return r?r==="end_round"||r==="end"||r==="close"||r==="new_round":!1}function Uo(t,e){if(!t||typeof t!="object"||t.type!=="dice_events"||String(t.version)!=="1"||!Array.isArray(t.events))return null;let n=Jd(t),r=[];for(let s of t.events){let i=Wd(s,e);if(!i){b.warn("\u4E22\u5F03\u975E\u6CD5\u4E8B\u4EF6\u5B57\u6BB5",s);continue}r.push(i)}return r.length===0&&!n?null:{events:r,shouldEndRound:n}}function Ko(t){let e=String(t||"").replace(/[\u200B-\u200D\u2060]/g,"").replace(/\uFEFF/g,"").trim();if(!e)return null;let n=[],r=c=>{let u=c.trim();u&&(n.includes(u)||n.push(u))},s=c=>c.replace(/[“”]/g,'"').replace(/[‘’]/g,"'").replace(/：/g,":").replace(/，/g,",").replace(/\u00A0/g," "),i=c=>c.replace(/,\s*([}\]])/g,"$1"),o=c=>c.replace(/^\s*```[a-zA-Z0-9_-]*\s*[\r\n]+/,"").replace(/[\r\n]+\s*```\s*$/,"").trim(),l=c=>c.replace(/^\s*(?:rolljson|json)\s*[\r\n]+/i,"").trim(),a=c=>{let u=c.indexOf("{");if(u<0)return null;let E=0,v=!1,m=!1;for(let f=u;f<c.length;f++){let S=c[f];if(v){if(m){m=!1;continue}if(S==="\\"){m=!0;continue}S==='"'&&(v=!1);continue}if(S==='"'){v=!0;continue}if(S==="{"){E+=1;continue}if(S==="}"&&(E-=1,E===0))return c.slice(u,f+1)}return null},d=[e,o(e),l(e),l(o(e))];for(let c of d){if(!c)continue;r(c),r(s(c)),r(i(c)),r(i(s(c)));let u=a(c);u&&(r(u),r(s(u)),r(i(u)),r(i(s(u))))}for(let c of n)try{return JSON.parse(c)}catch{}return null}function Fo(t){try{let e=document.createElement("textarea");return e.innerHTML=t,e.value}catch{return t.replace(/&quot;/g,'"').replace(/&#34;/g,'"').replace(/&apos;/g,"'").replace(/&#39;/g,"'").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&amp;/g,"&")}}function Vo(t,e){let n=/```(?:rolljson|json)?\s*([\s\S]*?)```/gi,r=[],s=[],i=!1,o;for(;(o=n.exec(t))!==null;){let a=Fo(o[1]??"").trim();if(!a)continue;let d=/"type"\s*:\s*"dice_events"/i.test(a);d&&r.push({start:o.index,end:o.index+o[0].length});let c;try{if(c=Ko(a),!c)throw new Error("\u65E0\u6CD5\u4FEE\u590D\u4E3A\u5408\u6CD5 JSON")}catch(E){d&&b.warn("\u4E8B\u4EF6 JSON \u89E3\u6790\u5931\u8D25\uFF0C\u5DF2\u9690\u85CF\u4EE3\u7801\u5757",E);continue}let u=Uo(c,e);u&&(s.push(...u.events),u.shouldEndRound&&(i=!0))}let l=/<pre\b[\s\S]*?<\/pre>/gi;for(;(o=l.exec(t))!==null;){let a=o[0],d=a.match(/<code\b[^>]*>([\s\S]*?)<\/code>/i),c=(d?d[1]:a).replace(/<[^>]+>/g,""),u=Fo(c).trim();if(!u)continue;let E=/"type"\s*:\s*"dice_events"/i.test(u);E&&r.push({start:o.index,end:o.index+a.length});let v;try{if(v=Ko(u),!v)throw new Error("\u65E0\u6CD5\u4FEE\u590D\u4E3A\u5408\u6CD5 JSON")}catch(f){E&&b.warn("HTML \u4E8B\u4EF6 JSON\u89E3\u6790\u5931\u8D25\uFF0C\u5DF2\u9690\u85CF\u4EE3\u7801\u5757",f);continue}let m=Uo(v,e);m&&(s.push(...m.events),m.shouldEndRound&&(i=!0))}return{events:s,ranges:r,shouldEndRound:i}}function Yo(t,e,n){if(e.length===0)return t;let r=[...e].sort((o,l)=>o.start-l.start),s=0,i="";for(let o of r)o.start>s&&(i+=t.slice(s,o.start)),s=Math.max(s,o.end);return s<t.length&&(i+=t.slice(s)),n(i)}function jo(t,e,n=Date.now()){e.ensureRoundEventTimersSyncedEvent(t);let r=e.getSettingsEvent(),s=[],i=0;for(let o of t.events){let l=e.getLatestRollRecordForEvent(t,o.id),a=l?l.source==="timeout_auto_fail"?"timeout":"done":"pending",d=l&&Number.isFinite(Number(l.result.total))?Number(l.result.total):null,c=l?l.success:null,u=e.resolveTriggeredOutcomeEvent(o,l,r);l&&i++,s.push({id:o.id,title:o.title,desc:o.desc,targetLabel:o.targetLabel,skill:o.skill,checkDice:o.checkDice,compare:e.normalizeCompareOperatorEvent(o.compare)??">=",dc:Number.isFinite(o.dc)?Number(o.dc):0,dcReason:String(o.dcReason||""),rollMode:o.rollMode==="auto"?"auto":"manual",advantageState:Qd(l?.advantageStateApplied??o.advantageState),timeLimit:o.timeLimit??"none",status:a,resultSource:l?.source??null,total:d,skillModifierApplied:Number(l?.skillModifierApplied??0),statusModifierApplied:Number(l?.statusModifierApplied??0),baseModifierUsed:Number(l?.baseModifierUsed??0),finalModifierUsed:Number(l?.finalModifierUsed??0),success:c,marginToDc:typeof l?.marginToDc=="number"&&Number.isFinite(l.marginToDc)?Number(l.marginToDc):null,resultGrade:l?.resultGrade??null,outcomeKind:u.kind,outcomeText:dt(u.text),explosionTriggered:u.explosionTriggered})}return{roundId:t.roundId,openedAt:t.openedAt,closedAt:n,eventsCount:t.events.length,rolledCount:i,events:s}}function Xo(t){return Array.isArray(t.summaryHistory)||(t.summaryHistory=[]),t.summaryHistory}function qo(t,e){t.length<=e||t.splice(0,t.length-e)}function Qd(t){return t==="advantage"||t==="disadvantage"||t==="normal"?t:"normal"}function Zd(t){let e=String(t??"").replace(/\s+/g," ").trim();return e.length>0?e:"\uFF08\u7A7A\uFF09"}function bt(t,e){let n=Zd(t);return n.length<=e?n:`${n.slice(0,Math.max(1,e))}\uFF08\u5DF2\u622A\u65AD\uFF09`}function tc(t){return t==="minimal"?60:t==="balanced"?90:140}function ec(t){return t==="manual_roll"?"\u624B\u52A8\u68C0\u5B9A":t==="ai_auto_roll"?"AI\u81EA\u52A8\u68C0\u5B9A":t==="timeout_auto_fail"?"\u8D85\u65F6\u5224\u5B9A":"\u672A\u77E5"}function nc(t){if(t.status==="pending")return"\u5F85\u5224\u5B9A\uFF08\u5C1A\u672A\u63B7\u9AB0\uFF09";if(t.status==="timeout"||t.resultSource==="timeout_auto_fail")return"\u8D85\u65F6\u672A\u64CD\u4F5C\uFF0C\u7CFB\u7EDF\u5224\u5B9A\u5931\u8D25";let e=t.total==null?"-":String(t.total);return t.success===!0?t.resultSource==="ai_auto_roll"?`AI\u81EA\u52A8\u68C0\u5B9A\u6210\u529F\uFF08\u603B\u503C ${e}\uFF09`:`\u6210\u529F\uFF08\u603B\u503C ${e}\uFF09`:t.success===!1?t.resultSource==="ai_auto_roll"?`AI\u81EA\u52A8\u68C0\u5B9A\u5931\u8D25\uFF08\u603B\u503C ${e}\uFF09`:`\u5931\u8D25\uFF08\u603B\u503C ${e}\uFF09`:`\u5DF2\u5B8C\u6210\uFF08\u603B\u503C ${e}\uFF09`}function rc(t){let e=bt(t.outcomeText||"",120);return t.outcomeKind==="explode"?`\u7206\u9AB0\u8D70\u5411\uFF1A${e}`:t.outcomeKind==="success"?`\u6210\u529F\u8D70\u5411\uFF1A${e}`:t.outcomeKind==="failure"?`\u5931\u8D25\u8D70\u5411\uFF1A${e}`:`\u8D70\u5411\uFF1A${e}`}function sc(t,e,n){let r=bt(t.title,48),s=bt(t.desc,tc(e)),i=bt(t.targetLabel||"\u672A\u6307\u5B9A",20),o=nc(t),l=n?rc(t):"",a=Number.isFinite(Number(t.baseModifierUsed))?Number(t.baseModifierUsed):0,d=Number.isFinite(Number(t.skillModifierApplied))?Number(t.skillModifierApplied):0,c=Number.isFinite(Number(t.statusModifierApplied))?Number(t.statusModifierApplied):0,u=Number.isFinite(Number(t.finalModifierUsed))?Number(t.finalModifierUsed):a+d+c,E=`\u4FEE\u6B63 ${X(a)} + \u6280\u80FD ${X(d)} + \u72B6\u6001 ${X(c)} = ${X(u)}`;if(e==="minimal")return n?`- \u6807\u9898\uFF1A${r}\uFF5C\u5BF9\u8C61\uFF1A${i}\uFF5C\u63CF\u8FF0\uFF1A${s}\uFF5C\u7ED3\u679C\uFF1A${o}\uFF5C${l}`:`- \u6807\u9898\uFF1A${r}\uFF5C\u5BF9\u8C61\uFF1A${i}\uFF5C\u63CF\u8FF0\uFF1A${s}\uFF5C\u7ED3\u679C\uFF1A${o}`;let v=bt(t.skill,20),m=bt(t.checkDice,24),f=t.dcReason?`\uFF08DC\u539F\u56E0\uFF1A${bt(t.dcReason,36)}\uFF09`:"",S=`${v} ${m}\uFF0C\u6761\u4EF6 ${t.compare} ${t.dc}${f}`,g=t.advantageState==="normal"?"":`\uFF5C\u9AB0\u6001=${t.advantageState}`,_=t.resultGrade?`\uFF5C\u5206\u7EA7=${t.resultGrade}`:"";if(e==="balanced")return n?`- \u6807\u9898\uFF1A${r}\uFF5C\u5BF9\u8C61\uFF1A${i}\uFF5C\u63CF\u8FF0\uFF1A${s}\uFF5C\u68C0\u5B9A\uFF1A${S}${g}\uFF5C${E}\uFF5C\u7ED3\u679C\uFF1A${o}${_}\uFF5C${l}`:`- \u6807\u9898\uFF1A${r}\uFF5C\u5BF9\u8C61\uFF1A${i}\uFF5C\u63CF\u8FF0\uFF1A${s}\uFF5C\u68C0\u5B9A\uFF1A${S}${g}\uFF5C${E}\uFF5C\u7ED3\u679C\uFF1A${o}${_}`;let h=ec(t.resultSource),x=bt(t.timeLimit||"none",26);return n?`- \u6807\u9898\uFF1A${r}\uFF5C\u5BF9\u8C61\uFF1A${i}\uFF5C\u63CF\u8FF0\uFF1A${s}\uFF5C\u68C0\u5B9A\uFF1A${S}${g}\uFF5C${E}\uFF5C\u6765\u6E90\uFF1A${h}\uFF5C\u6A21\u5F0F\uFF1A${t.rollMode}\uFF5C\u65F6\u9650\uFF1A${x}\uFF5C\u7ED3\u679C\uFF1A${o}${_}\uFF5C${l}`:`- \u6807\u9898\uFF1A${r}\uFF5C\u5BF9\u8C61\uFF1A${i}\uFF5C\u63CF\u8FF0\uFF1A${s}\uFF5C\u68C0\u5B9A\uFF1A${S}${g}\uFF5C${E}\uFF5C\u6765\u6E90\uFF1A${h}\uFF5C\u6A21\u5F0F\uFF1A${t.rollMode}\uFF5C\u65F6\u9650\uFF1A${x}\uFF5C\u7ED3\u679C\uFF1A${o}${_}`}function Wo(t,e,n,r,s){if(!Array.isArray(t)||t.length===0)return"";let i=Math.min(s.SUMMARY_HISTORY_ROUNDS_MAX_Event,Math.max(s.SUMMARY_HISTORY_ROUNDS_MIN_Event,Math.floor(Number(n)||1))),o=t.slice(-i);if(o.length===0)return"";let l=[];l.push(s.DICE_SUMMARY_BLOCK_START_Event),l.push(`v=5 fmt=nl detail=${e} window_rounds=${i} included_rounds=${o.length} include_outcome=${r?"1":"0"}`);let a=0,d=!1;for(let c=0;c<o.length;c++){let u=o[c],E=Math.max(0,u.eventsCount-u.rolledCount);l.push(`\u3010\u7B2C ${c+1} \u8F6E / roundId=${u.roundId} / \u5173\u95ED\u65F6\u95F4=${new Date(u.closedAt).toISOString()}\u3011`),l.push(`\u672C\u8F6E\u4E8B\u4EF6\u6570=${u.eventsCount}\uFF0C\u5DF2\u7ED3\u7B97=${u.rolledCount}\uFF0C\u672A\u7ED3\u7B97=${E}`);let v=u.events.slice(0,s.SUMMARY_MAX_EVENTS_Event);for(let m of v){if(a>=s.SUMMARY_MAX_TOTAL_EVENT_LINES_Event){d=!0;break}l.push(sc(m,e,r)),a++}if(u.events.length>s.SUMMARY_MAX_EVENTS_Event&&l.push(`\u6CE8\uFF1A\u672C\u8F6E\u8FD8\u6709 ${u.events.length-s.SUMMARY_MAX_EVENTS_Event} \u4E2A\u4E8B\u4EF6\u672A\u5C55\u5F00\u3002`),d)break}return d&&l.push("\u6CE8\uFF1A\u540E\u7EED\u4E8B\u4EF6\u56E0\u957F\u5EA6\u9650\u5236\u672A\u5C55\u5F00\u3002"),l.push(s.DICE_SUMMARY_BLOCK_END_Event),l.join(`
`)}var ut="normal",Jo=1;function Qo(t){return t==="advantage"||t==="disadvantage"||t==="normal"?t:ut}function ic(t){return Array.isArray(t.keptRolls)&&t.keptRolls.length>0?t.keptRolls:Array.isArray(t.rolls)?t.rolls:[]}function oc(t){return t.keepMode==="kh"?"advantage":t.keepMode==="kl"?"disadvantage":ut}function Zo(t,e,n,r){let s;try{s=r(t)}catch(a){return{adv:!1,dis:!1,advantageStateApplied:ut,errorText:a?.message??String(a)}}let i=oc(s),o=Qo(e.advantageState),l=s.keepMode==="kh"||s.keepMode==="kl";return n.enableAdvantageSystem?l?{adv:!1,dis:!1,advantageStateApplied:i}:o==="advantage"?{adv:!0,dis:!1,advantageStateApplied:"advantage"}:o==="disadvantage"?{adv:!1,dis:!0,advantageStateApplied:"disadvantage"}:{adv:!1,dis:!1,advantageStateApplied:ut}:l?{adv:!1,dis:!1,advantageStateApplied:ut,errorText:`\u4F18\u52BF/\u52A3\u52BF\u7CFB\u7EDF\u5DF2\u5173\u95ED\uFF0C\u5F53\u524D\u8868\u8FBE\u5F0F\u5305\u542B kh/kl\uFF1A${t}`}:o!==ut?{adv:!1,dis:!1,advantageStateApplied:ut,errorText:`\u4F18\u52BF/\u52A3\u52BF\u7CFB\u7EDF\u5DF2\u5173\u95ED\uFF0C\u4E8B\u4EF6\u8BBE\u7F6E\u4E86 advantageState=${o}`}:{adv:!1,dis:!1,advantageStateApplied:ut}}function lc(t,e,n){if(n==null||!Number.isFinite(n)||!Number.isFinite(t))return null;switch(e){case">=":return t-n;case">":return t-(n+1);case"<=":return n-t;case"<":return n-1-t;default:return null}}function ac(t){let e=ic(t);if(e.length!==1)return{isCandidate:!1};let n=Number(e[0]),r=Number(t.sides);return!Number.isFinite(n)||!Number.isFinite(r)||r<=0?{isCandidate:!1}:{isCandidate:n===1||n===r}}function zr(t,e,n,r,s){let i=lc(Number(t.total),n,r);return s==="timeout_auto_fail"?{resultGrade:"failure",marginToDc:i}:e!==!0&&e!==!1?{resultGrade:"failure",marginToDc:i}:ac(t).isCandidate?e?{resultGrade:"critical_success",marginToDc:i}:{resultGrade:"critical_failure",marginToDc:i}:e?i!=null&&i>=1&&i<=2?{resultGrade:"partial_success",marginToDc:i}:{resultGrade:"success",marginToDc:i}:{resultGrade:"failure",marginToDc:i}}function dc(t){return Array.isArray(t.pendingResultGuidanceQueue)||(t.pendingResultGuidanceQueue=[]),t.pendingResultGuidanceQueue}function on(t,e,n){if(!n.resultGrade)return;let r=dc(t);r.some(s=>s.rollId===n.rollId)||r.push({rollId:n.rollId,roundId:n.roundId,eventId:e.id,eventTitle:e.title,targetLabel:n.targetLabelUsed||e.targetLabel,resultGrade:n.resultGrade,marginToDc:n.marginToDc??null,total:Number(n.result.total)||0,dcUsed:n.dcUsed??null,compareUsed:n.compareUsed,advantageStateApplied:n.advantageStateApplied,source:n.source,rolledAt:n.rolledAt})}function tl(t,e){let n=0,r=0,s=0;try{let i=e.parseDiceExpression(t.checkDice);n=i.count,r=i.sides,s=i.modifier}catch{}return{expr:t.checkDice||"timeout",count:n,sides:r,modifier:s,rolls:[],rawTotal:0,total:0,selectionMode:"none"}}function Vr(t,e){let n=Number.isFinite(Number(t.modifier))?Number(t.modifier):0,r=Number.isFinite(Number(e))?Number(e):0,s=n+r;return r===0?{result:t,baseModifierUsed:n,finalModifierUsed:s}:{result:{...t,modifier:s,total:Number(t.rawTotal)+s},baseModifierUsed:n,finalModifierUsed:s}}function Yr(t,e){let n=Number.isFinite(Number(t.modifier))?Number(t.modifier):0,r=Number.isFinite(Number(e))?Number(e):0,s=n+r;return r===0?{result:t,finalModifierUsed:s}:{result:{...t,modifier:s,total:Number(t.rawTotal)+s},finalModifierUsed:s}}function jr(t,e,n){if(!n.enableStatusSystem)return{modifier:0,matched:[]};let r=q(e);return Ft(r,t)}function cc(t,e,n){if(!n.enableOutcomeBranches)return"";let r=t.outcomes,s=!!e?.result?.explosionTriggered;return n.enableExplodeOutcomeBranch&&s&&r?.explode&&r.explode.trim()?r.explode.trim():e?.success===!0?r?.success?.trim()||"\u5224\u5B9A\u6210\u529F\uFF0C\u5267\u60C5\u5411\u6709\u5229\u65B9\u5411\u63A8\u8FDB\u3002":e?.success===!1||e?.source==="timeout_auto_fail"?r?.failure?.trim()||"\u5224\u5B9A\u5931\u8D25\uFF0C\u5267\u60C5\u5411\u4E0D\u5229\u65B9\u5411\u63A8\u8FDB\u3002":"\u5C1A\u672A\u7ED3\u7B97\u3002"}function ln(t,e,n,r){if(!r.enableStatusSystem)return!1;let s=cc(e,n,r);if(!s)return!1;let i=$e(s,e.skill||"");return _i(t,i.commands,"ai_tag")}function el(t){return(!t.eventTimers||typeof t.eventTimers!="object")&&(t.eventTimers={}),t.eventTimers}function st(t,e){for(let n=t.rolls.length-1;n>=0;n--)if(t.rolls[n]?.eventId===e)return t.rolls[n];return null}function Xr(t,e){let n=e.getSettingsEvent(),r=el(t),s=Date.now(),i=new Set;for(let o of t.events){if(i.add(o.id),!o.targetType||!o.targetLabel){let u=e.resolveEventTargetEvent({type:o.targetType,name:o.targetName},o.scope);o.targetType=u.targetType,o.targetName=u.targetName,o.targetLabel=u.targetLabel}let l=typeof o.timeLimitMs=="number"&&Number.isFinite(o.timeLimitMs)?Math.max(0,o.timeLimitMs):e.parseIsoDurationToMsEvent(o.timeLimit||""),a=e.applyTimeLimitPolicyMsEvent(l,n);o.timeLimitMs=a;let d=r[o.id],c=st(t,o.id);if(!d){let u=typeof o.offeredAt=="number"&&Number.isFinite(o.offeredAt)?o.offeredAt:s,E=a==null?null:u+a;d={offeredAt:u,deadlineAt:E},r[o.id]=d}c?c.source==="timeout_auto_fail"&&(d.expiredAt=c.timeoutAt??c.rolledAt):(d.deadlineAt=a==null?null:d.offeredAt+a,d.deadlineAt==null&&delete d.expiredAt),o.offeredAt=d.offeredAt,o.deadlineAt=d.deadlineAt}for(let o of Object.keys(r))i.has(o)||delete r[o]}function uc(t){if(t==null||t==="")return null;let e=Math.floor(Number(t));return!Number.isFinite(e)||e<=0?null:e}function Ec(t){let e=q(t);if(e.length<=0)return!1;let n=Date.now(),r=e.map(s=>{let i=uc(s.remainingRounds);if(i==null)return{...s,remainingRounds:null};let o=i-1;return o<=0?null:{...s,remainingRounds:o,updatedAt:n}}).filter(s=>s!=null);return r.length===e.length&&r.every((s,i)=>s.remainingRounds===e[i].remainingRounds)?!1:(t.activeStatuses=r,!0)}function vc(t,e){let n=t.pendingRound?.status,r=e.now?e.now():Date.now();return(!t.pendingRound||n!=="open")&&(t.pendingRound={roundId:e.createIdEvent("round"),status:"open",events:[],rolls:[],eventTimers:{},sourceAssistantMsgIds:[],openedAt:r}),(!t.pendingRound.eventTimers||typeof t.pendingRound.eventTimers!="object")&&(t.pendingRound.eventTimers={}),t.pendingRound}function nl(t,e,n){let r=n.getSettingsEvent(),s=n.getDiceMetaEvent(),i=s.pendingRound;i&&i.status!=="open"&&Ec(s)&&b.info("\u8F6E\u6B21\u5207\u6362\uFF1A\u5DF2\u5B8C\u6210\u72B6\u6001\u6301\u7EED\u8F6E\u6B21\u8870\u51CF");let o=vc(s,{createIdEvent:n.createIdEvent}),l=Date.now(),a=el(o),d=new Map;for(let c of o.events)d.set(c.id,{...c});for(let c of t){let u={...c},E=d.get(u.id),v=st(o,u.id),m={...E||{},...u};if(v){let S=a[m.id];S?(m.offeredAt=S.offeredAt,m.deadlineAt=S.deadlineAt):E&&(m.offeredAt=E.offeredAt,m.deadlineAt=E.deadlineAt??null)}else{let S=typeof m.timeLimitMs=="number"&&Number.isFinite(m.timeLimitMs)?Math.max(0,m.timeLimitMs):n.parseIsoDurationToMsEvent(m.timeLimit||""),g=n.applyTimeLimitPolicyMsEvent(S,r);m.timeLimitMs=g,m.offeredAt=l,m.deadlineAt=g==null?null:l+g,a[m.id]={offeredAt:m.offeredAt,deadlineAt:m.deadlineAt}}let f=n.resolveEventTargetEvent({type:m.targetType,name:m.targetName},m.scope);m.targetType=f.targetType,m.targetName=f.targetName,m.targetLabel=f.targetLabel,d.set(m.id,m)}return o.events=Array.from(d.values()),Xr(o,{getSettingsEvent:n.getSettingsEvent,resolveEventTargetEvent:n.resolveEventTargetEvent,parseIsoDurationToMsEvent:n.parseIsoDurationToMsEvent,applyTimeLimitPolicyMsEvent:n.applyTimeLimitPolicyMsEvent}),o.sourceAssistantMsgIds.includes(e)||o.sourceAssistantMsgIds.push(e),n.saveMetadataSafeEvent(),o}function Xt(t,e,n){if(!n.enableOutcomeBranches)return{kind:"none",text:"\u8D70\u5411\u5206\u652F\u5DF2\u5173\u95ED\u3002",explosionTriggered:!1};let r=t.outcomes,s=!!e?.result?.explosionTriggered;return n.enableExplodeOutcomeBranch&&s&&r?.explode&&r.explode.trim()?{kind:"explode",text:r.explode.trim(),explosionTriggered:!0}:e?.success===!0?{kind:"success",text:r?.success?.trim()||"\u5224\u5B9A\u6210\u529F\uFF0C\u5267\u60C5\u5411\u6709\u5229\u65B9\u5411\u63A8\u8FDB\u3002",explosionTriggered:s}:e?.success===!1||e?.source==="timeout_auto_fail"?{kind:"failure",text:r?.failure?.trim()||"\u5224\u5B9A\u5931\u8D25\uFF0C\u5267\u60C5\u5411\u4E0D\u5229\u65B9\u5411\u63A8\u8FDB\u3002",explosionTriggered:s}:{kind:"none",text:"\u5C1A\u672A\u7ED3\u7B97\u3002",explosionTriggered:s}}function rl(t,e,n,r){let s=r.getSettingsEvent(),i=r.getDiceMetaEvent(),o=r.normalizeCompareOperatorEvent(e.compare)??">=",l=Number.isFinite(e.dc)?Number(e.dc):null,a=r.createSyntheticTimeoutDiceResultEvent(e),d=r.resolveSkillModifierBySkillNameEvent(e.skill,s),c=Vr(a,d);a=c.result;let u=jr(e.skill,i,s),E=Yr(a,u.modifier);a=E.result;let v=zr(a,!1,o,l,"timeout_auto_fail");return{rollId:r.createIdEvent("eroll"),roundId:t.roundId,eventId:e.id,eventTitle:e.title,diceExpr:e.checkDice,result:a,success:!1,compareUsed:o,dcUsed:l,advantageStateApplied:Qo(e.advantageState),resultGrade:v.resultGrade,marginToDc:v.marginToDc,skillModifierApplied:d,statusModifierApplied:u.modifier,statusModifiersApplied:u.matched,baseModifierUsed:c.baseModifierUsed,finalModifierUsed:E.finalModifierUsed,targetLabelUsed:e.targetLabel,rolledAt:n,source:"timeout_auto_fail",timeoutAt:n}}function sl(t,e,n,r=Date.now()){if(!n.getSettingsEvent().enableTimeLimit||n.getLatestRollRecordForEvent(t,e.id))return null;n.ensureRoundEventTimersSyncedEvent(t);let o=t.eventTimers[e.id];if(!o||o.deadlineAt==null||r<=o.deadlineAt)return null;let l=n.createTimeoutFailureRecordEvent(t,e,r);return t.rolls.push(l),o.expiredAt=r,l}function il(t){let e=t.getSettingsEvent();if(!e.enabled||!e.enableTimeLimit)return!1;let n=t.getDiceMetaEvent(),r=n.pendingRound;if(!r||r.status!=="open")return!1;t.ensureRoundEventTimersSyncedEvent(r);let s=Date.now(),i=!1;for(let o of r.events){let l=t.recordTimeoutFailureIfNeededEvent(r,o,s);l&&(i=!0,e.enableDynamicResultGuidance&&on(n,o,l),ln(n,o,l,e)&&(i=!0))}return i&&t.saveMetadataSafeEvent(),i}function ol(t,e,n,r){r.sweepTimeoutFailuresEvent();let s=String(t||"").trim();if(!s)return"\u274C \u8BF7\u63D0\u4F9B\u4E8B\u4EF6 ID\uFF0C\u4F8B\u5982\uFF1A/eventroll roll lockpick_gate";let i=r.getDiceMetaEvent(),o=i.pendingRound;if(!o)return"\u274C \u5F53\u524D\u6CA1\u6709\u53EF\u6295\u63B7\u7684\u4E8B\u4EF6\u3002";if(o.status!=="open")return"\u274C \u5F53\u524D\u8F6E\u6B21\u5DF2\u7ED3\u675F\uFF0C\u8BF7\u7B49\u5F85 AI \u751F\u6210\u65B0\u8F6E\u6B21\u4E8B\u4EF6\u3002";if(n&&o.roundId!==n)return"\u274C \u8BE5\u4E8B\u4EF6\u6240\u5C5E\u8F6E\u6B21\u5DF2\u7ED3\u675F\u3002";let l=o.events.find(H=>H.id===s);if(!l)return`\u274C \u627E\u4E0D\u5230\u4E8B\u4EF6 ID\uFF1A${s}`;let a=r.getSettingsEvent();r.ensureRoundEventTimersSyncedEvent(o);let d=r.recordTimeoutFailureIfNeededEvent(o,l);d&&(a.enableDynamicResultGuidance&&on(i,l,d),ln(i,l,d,a),r.saveMetadataSafeEvent());let c=r.getLatestRollRecordForEvent(o,l.id);if(c){let H=r.buildEventAlreadyRolledCardEvent(l,c),P=r.pushToChat(H);return r.refreshCountdownDomEvent(),typeof P=="string"?P:""}let u=(e||l.checkDice||"").trim();if(!u)return`\u274C \u4E8B\u4EF6 ${s} \u7F3A\u5C11\u53EF\u7528\u9AB0\u5F0F\u3002`;let E=u.includes("!"),v=E?a.enableExplodingDice?"enabled":"disabled_globally":"not_requested",m=E?a.enableExplodingDice?"\u5DF2\u8BF7\u6C42\u7206\u9AB0\uFF0C\u6309\u771F\u5B9E\u63B7\u9AB0\u7ED3\u679C\u51B3\u5B9A\u662F\u5426\u89E6\u53D1\u8FDE\u7206\u3002":"\u5DF2\u8BF7\u6C42\u7206\u9AB0\uFF0C\u4F46\u5168\u5C40\u7206\u9AB0\u529F\u80FD\u5173\u95ED\uFF0C\u6309\u666E\u901A\u9AB0\u7ED3\u7B97\u3002":"\u672A\u8BF7\u6C42\u7206\u9AB0\u3002",f=E&&!a.enableExplodingDice?u.replace("!",""):u,S=Zo(f,l,a,r.parseDiceExpression);if(S.errorText)return`\u274C \u63B7\u9AB0\u5931\u8D25\uFF1A${S.errorText}`;let g;try{g=r.rollExpression(f,{rule:a.ruleText,adv:S.adv,dis:S.dis})}catch(H){return`\u274C \u63B7\u9AB0\u5931\u8D25\uFF1A${H?.message??String(H)}`}let _=r.resolveSkillModifierBySkillNameEvent(l.skill,a),h=r.applySkillModifierToDiceResultEvent(g,_);g=h.result;let x=jr(l.skill,i,a),T=Yr(g,x.modifier);g=T.result,r.saveLastRoll(g);let p=r.normalizeCompareOperatorEvent(l.compare)??">=",I=Number.isFinite(l.dc)?Number(l.dc):null,A=r.evaluateSuccessEvent(g.total,p,I),k=zr(g,A,p,I,"manual_roll"),D={rollId:r.createIdEvent("eroll"),roundId:o.roundId,eventId:l.id,eventTitle:l.title,diceExpr:f,result:g,success:A,compareUsed:p,dcUsed:I,advantageStateApplied:S.advantageStateApplied,resultGrade:k.resultGrade,marginToDc:k.marginToDc,skillModifierApplied:_,statusModifierApplied:x.modifier,statusModifiersApplied:x.matched,baseModifierUsed:h.baseModifierUsed,finalModifierUsed:T.finalModifierUsed,targetLabelUsed:l.targetLabel,rolledAt:Date.now(),source:"manual_roll",timeoutAt:null,explodePolicyApplied:v,explodePolicyReason:m};o.rolls.push(D),a.enableDynamicResultGuidance&&on(i,l,D),ln(i,l,D,a),r.saveMetadataSafeEvent(),r.refreshCountdownDomEvent();let N=r.buildEventRollResultCardEvent(l,D),M=r.pushToChat(N);return typeof M=="string"?M:""}function ll(t,e){let n=e.getSettingsEvent();if(!n.enableAiRollMode)return[];e.ensureRoundEventTimersSyncedEvent(t);let r=e.getDiceMetaEvent(),s=!1,i=null,o=[],l=t.rolls.filter(a=>a?.source==="ai_auto_roll"&&(a.explodePolicyApplied==="enabled"||String(a.diceExpr||"").includes("!"))).length;for(let a of t.events){if((a.rollMode==="auto"?"auto":"manual")!=="auto"||e.getLatestRollRecordForEvent(t,a.id))continue;let u=String(a.checkDice||"").trim();if(!u)continue;let E=u.includes("!"),v="not_requested",m="\u672A\u8BF7\u6C42\u7206\u9AB0\u3002",f=u;E&&(n.enableExplodingDice?l>=Jo?(v="downgraded_by_ai_limit",m=`\u5DF2\u8BF7\u6C42\u7206\u9AB0\uFF0C\u4F46\u672C\u8F6E AI \u81EA\u52A8\u7206\u9AB0\u4E0A\u9650\u4E3A ${Jo}\uFF0C\u6309\u666E\u901A\u9AB0\u7ED3\u7B97\u3002`,f=u.replace("!","")):(v="enabled",m="\u5DF2\u8BF7\u6C42\u7206\u9AB0\uFF0C\u6309\u771F\u5B9E\u63B7\u9AB0\u7ED3\u679C\u51B3\u5B9A\u662F\u5426\u89E6\u53D1\u8FDE\u7206\u3002",l+=1):(v="disabled_globally",m="\u5DF2\u8BF7\u6C42\u7206\u9AB0\uFF0C\u4F46\u5168\u5C40\u7206\u9AB0\u529F\u80FD\u5173\u95ED\uFF0C\u6309\u666E\u901A\u9AB0\u7ED3\u7B97\u3002",f=u.replace("!","")));let S=Zo(f,a,n,e.parseDiceExpression);if(S.errorText){b.warn(`AI \u81EA\u52A8\u63B7\u9AB0\u88AB\u8DF3\u8FC7: event=${a.id} reason=${S.errorText}`);continue}let g;try{g=e.rollExpression(f,{rule:n.ruleText,adv:S.adv,dis:S.dis})}catch(N){b.warn(`AI \u81EA\u52A8\u63B7\u9AB0\u5931\u8D25: event=${a.id}`,N);continue}let _=e.resolveSkillModifierBySkillNameEvent(a.skill,n),h=e.applySkillModifierToDiceResultEvent(g,_);g=h.result;let x=jr(a.skill,r,n),T=Yr(g,x.modifier);g=T.result;let p=e.normalizeCompareOperatorEvent(a.compare)??">=",I=Number.isFinite(a.dc)?Number(a.dc):null,A=e.evaluateSuccessEvent(g.total,p,I),k=zr(g,A,p,I,"ai_auto_roll"),D={rollId:e.createIdEvent("eroll"),roundId:t.roundId,eventId:a.id,eventTitle:a.title,diceExpr:f,result:g,success:A,compareUsed:p,dcUsed:I,advantageStateApplied:S.advantageStateApplied,resultGrade:k.resultGrade,marginToDc:k.marginToDc,skillModifierApplied:_,statusModifierApplied:x.modifier,statusModifiersApplied:x.matched,baseModifierUsed:h.baseModifierUsed,finalModifierUsed:T.finalModifierUsed,targetLabelUsed:a.targetLabel,rolledAt:Date.now(),source:"ai_auto_roll",timeoutAt:null,explodePolicyApplied:v,explodePolicyReason:m};t.rolls.push(D),n.enableDynamicResultGuidance&&on(r,a,D),ln(r,a,D,n),s=!0,i=g,o.push(e.buildEventRollResultCardEvent(a,D))}return s?(i&&e.saveLastRoll(i),e.saveMetadataSafeEvent(),o):[]}function al(t,e,n){let r=n.getSettingsEvent(),s=Number.isFinite(Number(t.baseModifierUsed))?Number(t.baseModifierUsed):Number(t.result.modifier)||0,i=Number.isFinite(Number(t.skillModifierApplied))?Number(t.skillModifierApplied):0,o=Number.isFinite(Number(t.statusModifierApplied))?Number(t.statusModifierApplied):0,l=Number.isFinite(Number(t.finalModifierUsed))?Number(t.finalModifierUsed):s+i+o,a="";if(r.enableOutcomeBranches){let S=e?n.resolveTriggeredOutcomeEvent(e,t,r):t.result.explosionTriggered&&r.enableExplodeOutcomeBranch?{kind:"explode"}:t.success===!0?{kind:"success"}:t.success===!1?{kind:"failure"}:{kind:"none"};S.kind!=="none"&&(a=` | \u8D70\u5411:${S.kind}`)}let d=t.targetLabelUsed||e?.targetLabel||"",c=d?` | \u5BF9\u8C61:${d}`:"",u=r.enableSkillSystem?` | \u4FEE\u6B63:${n.formatEventModifierBreakdownEvent(s,i,l)}`:"",E=o!==0?` | \u72B6\u6001:${o>0?`+${o}`:o}${Array.isArray(t.statusModifiersApplied)&&t.statusModifiersApplied.length>0?`(${t.statusModifiersApplied.map(S=>`${S.name}${S.modifier>0?`+${S.modifier}`:S.modifier}`).join(",")})`:""}`:"",v=t.advantageStateApplied&&t.advantageStateApplied!==ut?` | \u9AB0\u6001:${t.advantageStateApplied}`:"",m=t.resultGrade?` | \u5206\u7EA7:${t.resultGrade}`:"";if(t.source==="timeout_auto_fail")return`\u8D85\u65F6\u81EA\u52A8\u5224\u5B9A\u5931\u8D25${c}${u}${E}${v}${m}${a}`;if(t.source==="ai_auto_roll"){let S=t.success===null?"\u672A\u5224\u5B9A":t.success?"\u6210\u529F":"\u5931\u8D25";return`AI\u81EA\u52A8\u68C0\u5B9A\uFF0C\u603B\u503C ${t.result.total} (${t.compareUsed} ${t.dcUsed??"?"} => ${S})${c}${u}${E}${v}${m}${a}`}let f=t.success===null?"\u672A\u5224\u5B9A":t.success?"\u6210\u529F":"\u5931\u8D25";return`\u603B\u503C ${t.result.total} (${t.compareUsed} ${t.dcUsed??"?"} => ${f})${c}${u}${E}${v}${m}${a}`}var El="<dice_rules>",vl="</dice_rules>",ml="<dice_round_summary>",gl="</dice_round_summary>",Sl="<dice_result_guidance>",pl="</dice_result_guidance>",fl="<dice_runtime_policy>",Tl="</dice_runtime_policy>",_l="<dice_active_statuses>",bl="</dice_active_statuses>";function an(t){return String(t??"")}function qr(t){return String(t??"").replace(/\s+/g," ").trim()}function dl(t){return t.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}function F(t){return gt(String(t||""))}function mc(t){let e=t?.ruleStart||El,n=t?.ruleEnd||vl,r=t?.runtimePolicyStart||fl,s=t?.runtimePolicyEnd||Tl,i=t?.summaryStart||ml,o=t?.summaryEnd||gl,l=t?.guidanceStart||Sl,a=t?.guidanceEnd||pl,d=t?.statusesStart||_l,c=t?.statusesEnd||bl;return[{start:e,end:n},{start:r,end:s},{start:i,end:o},{start:l,end:a},{start:d,end:c}]}function Wr(t){return!t||typeof t!="object"?"":String(t.role??"").trim().toLowerCase()}function gc(t){let e=[];for(let n of t){if(typeof n=="string"){e.push(n);continue}if(!n||typeof n!="object")continue;let r=n.text??n.content??"";typeof r=="string"&&r&&e.push(r)}return e.join(`
`)}function Sc(t){if(!t||typeof t!="object")return"";let e=t.create_date??t.create_time??t.timestamp??"";return String(e??"").trim()}function pc(t){if(!t||typeof t!="object")return"";let e=t.id??t.cid??t.uid;return e==null?"":String(e)}function cl(t){return Array.isArray(t)}function fc(t){switch(t){case"critical_success":return"\u5927\u6210\u529F";case"partial_success":return"\u52C9\u5F3A\u6210\u529F";case"success":return"\u6210\u529F";case"failure":return"\u5931\u8D25";case"critical_failure":return"\u5927\u5931\u8D25";default:return"\u7ED3\u679C"}}function Tc(t){let e=t.eventTitle||t.eventId;switch(t.resultGrade){case"critical_success":return`\u73A9\u5BB6\u5728\u300C${e}\u300D\u4E2D\u63B7\u51FA\u5927\u6210\u529F\uFF0C\u8BF7\u7528\u82F1\u96C4\u5316\u3001\u620F\u5267\u6027\u7684\u53E3\u543B\u63CF\u8FF0\u5176\u5B8C\u7F8E\u5B8C\u6210\u52A8\u4F5C\uFF0C\u5E76\u7ED9\u51FA\u989D\u5916\u6536\u76CA\u3002`;case"partial_success":return`\u73A9\u5BB6\u5728\u300C${e}\u300D\u4E2D\u52C9\u5F3A\u6210\u529F\uFF0C\u8BF7\u63CF\u8FF0\u201C\u6210\u529F\u4F46\u6709\u4EE3\u4EF7\u201D\uFF0C\u4EE3\u4EF7\u53EF\u5305\u542B\u53D7\u4F24\u3001\u66B4\u9732\u3001\u8D44\u6E90\u635F\u5931\u6216\u5F15\u6765\u5A01\u80C1\u3002`;case"success":return`\u73A9\u5BB6\u5728\u300C${e}\u300D\u4E2D\u6210\u529F\uFF0C\u8BF7\u7ED9\u51FA\u7A33\u5B9A\u63A8\u8FDB\u7684\u53D9\u4E8B\u7ED3\u679C\uFF0C\u907F\u514D\u989D\u5916\u60E9\u7F5A\u3002`;case"failure":return`\u73A9\u5BB6\u5728\u300C${e}\u300D\u4E2D\u5931\u8D25\uFF0C\u8BF7\u63CF\u8FF0\u53D7\u963B\u4F46\u5267\u60C5\u7EE7\u7EED\u63A8\u8FDB\uFF0C\u53EF\u5F15\u5165\u65B0\u7684\u56F0\u96BE\u6216\u66FF\u4EE3\u8DEF\u5F84\u3002`;case"critical_failure":return`\u73A9\u5BB6\u5728\u300C${e}\u300D\u4E2D\u5927\u5931\u8D25\uFF0C\u8BF7\u63CF\u8FF0\u663E\u8457\u4E14\u53EF\u611F\u77E5\u7684\u4E25\u91CD\u540E\u679C\uFF0C\u540C\u65F6\u4FDD\u6301\u540E\u7EED\u53EF\u884C\u52A8\u6027\u3002`;default:return`\u73A9\u5BB6\u5728\u300C${e}\u300D\u4E2D\u5B8C\u6210\u68C0\u5B9A\uFF0C\u8BF7\u6839\u636E\u7ED3\u679C\u63A8\u8FDB\u53D9\u4E8B\u3002`}}function _c(t,e,n){if(!Array.isArray(t)||t.length===0)return"";let r=[];r.push(e),r.push(`v=1 count=${t.length}`);for(let s of t){let i=fc(s.resultGrade),o=`${s.compareUsed} ${s.dcUsed==null?"N/A":s.dcUsed}`,l=s.marginToDc==null?"N/A":String(s.marginToDc),a=s.advantageStateApplied||"normal";r.push(`- [${i}] event="${qr(s.eventTitle)}" target="${qr(s.targetLabel)}" total=${s.total} check=${o} margin=${l} advantage=${a}`),r.push(`  instruction: ${Tc(s)}`)}return r.push(n),F(r.join(`
`))}function ht(t){return!t||typeof t!="object"?"":typeof t.content=="string"?t.content:Array.isArray(t.content)?gc(t.content):t.content&&typeof t.content=="object"&&typeof t.content.text=="string"?String(t.content.text):typeof t.mes=="string"?t.mes:typeof t.text=="string"?t.text:""}function Jr(t){if(!t||typeof t!="object")return"";let e=Number(t.swipe_id??t.swipeId),n=t.swipes;if(Array.isArray(n)&&Number.isFinite(e)&&e>=0&&e<n.length){let r=String(n[e]??"");if(r.trim())return r}return typeof t.mes=="string"&&t.mes.trim()?t.mes:ht(t)}function pe(t,e){if(!t||typeof t!="object")return;let n=an(e),r=Object.prototype.hasOwnProperty.call(t,"content"),s=Object.prototype.hasOwnProperty.call(t,"mes");r&&(t.content=n),s&&(t.mes=n),!r&&!s&&(t.content=n)}function hl(t){return!t||typeof t!="object"?!1:t.is_user===!0?!0:Wr(t)==="user"}function Il(t){return!t||typeof t!="object"?!1:t.is_system===!0?!0:Wr(t)==="system"}function Qr(t){if(!t||typeof t!="object"||hl(t)||Il(t))return!1;let e=Wr(t);return e?e==="assistant":!0}function bc(t){if(!Array.isArray(t))return-1;for(let e=t.length-1;e>=0;e--)if(Il(t[e]))return e;return-1}function hc(t){if(!Array.isArray(t))return-1;for(let e=t.length-1;e>=0;e--)if(hl(t[e]))return e;return-1}function Ic(t,e,n){let r=String(t??""),s=we(r),i=pc(e);if(i)return`prompt_user:${i}:${s}`;let o=Sc(e);return o?`prompt_user_ts:${o}:${s}`:`prompt_user_idx:${n}:${s}`}function ul(t,e){let n=an(t);for(let r of mc(e)){let s=new RegExp(`${dl(r.start)}[\\s\\S]*?${dl(r.end)}`,"gi");n=n.replace(s,`
`)}return F(n)}function xc(t,e,n){let r=an(t).trim();return r?r.includes(e)&&r.includes(n)?F(r):F(`${e}
${r}
${n}`):""}function yc(t){let e=["NdM"];t.enableExplodingDice&&e.push("[!]"),t.enableAdvantageSystem&&e.push("[khX|klX]"),e.push("[+/-B]");let n=e.join(""),r=xl(t.aiAllowedDiceSidesText),s=[];return s.push("\u3010\u4E8B\u4EF6\u9AB0\u5B50\u534F\u8BAE\uFF08\u7CFB\u7EDF\u52A8\u6001\uFF09\u3011"),s.push("1. \u4EC5\u5728\u6587\u672B\u8F93\u51FA ```rolljson \u4EE3\u7801\u5757\uFF08\u4E25\u7981 ```json\uFF09\u3002"),s.push("2. \u53D9\u4E8B\u6B63\u6587\u7981\u6B62\u76F4\u63A5\u7ED9\u51FA\u5224\u5B9A\u7ED3\u679C\uFF0C\u5148\u7ED9\u4E8B\u4EF6\uFF0C\u518D\u7531\u7CFB\u7EDF\u7ED3\u7B97\u5E76\u63A8\u8FDB\u5267\u60C5\u3002"),s.push("3. rolljson \u57FA\u672C\u683C\u5F0F\uFF1A"),s.push("{"),s.push('  "type": "dice_events", "version": "1",'),s.push('  "events": [{'),s.push('    "id": "str", "title": "str", "dc": num, "desc": "str",'),s.push(`    "checkDice": "${n}",`),s.push('    "skill": "str",'),s.push('    "compare": ">=|>|<=|<",'),s.push('    "scope": "protagonist|character|all",'),s.push('    "target": { "type": "self|scene|supporting|object|other", "name": "str(\u53EF\u9009)" }'),t.enableAiRollMode&&s.push('    ,"rollMode": "auto|manual"'),t.enableAdvantageSystem&&s.push('    ,"advantageState": "normal|advantage|disadvantage"'),t.enableDynamicDcReason&&s.push('    ,"dc_reason": "str"'),t.enableTimeLimit&&s.push('    ,"timeLimit": "PT30S"'),t.enableOutcomeBranches&&(t.enableExplodingDice&&t.enableExplodeOutcomeBranch?s.push('    ,"outcomes": { "success": "str", "failure": "str", "explode": "str(\u7206\u9AB0\u4F18\u5148)" }'):s.push('    ,"outcomes": { "success": "str", "failure": "str" }')),s.push("  }]"),t.enableAiRoundControl&&(s.push('  ,"round_control": "continue|end_round",'),s.push('  "end_round": bool')),s.push("}"),s.push("4. \u53EF\u7528\u80FD\u529B\u8BF4\u660E\uFF1A"),s.push(`   - checkDice \u4EC5\u4F7F\u7528 ${n}\uFF0C\u53EA\u80FD\u5199\u9AB0\u5F0F\u672C\u4F53\uFF0C\u7981\u6B62\u52A0\u5165\u6280\u80FD\u540D\u3001\u72B6\u6001\u540D\u3001\u81EA\u7136\u8BED\u8A00\u3001\u6807\u7B7E\u6216\u53D8\u91CF,\u4EC5\u5141\u8BB8\u4E00\u4E2A\u53EF\u9009\u4FEE\u6B63\u503C\uFF0C\u7981\u6B62\u8FDE\u7EED\u4FEE\u6B63\uFF08\u5982 1d20+1-1\uFF09\u3002`),s.push("   - \u5408\u6CD5\u793A\u4F8B\uFF1A1d20\u30012d6+3\u30012d20kh1\u30012d20kl1\u30011d6!+2\u3002"),s.push("   - \u975E\u6CD5\u793A\u4F8B\uFF1A1d20+1-1\u30011d20+\u4F53\u80FD\u30011d20+[\u865A\u5F31]\u30011d20 (\u4F18\u52BF)\u3002"),s.push("   - \u82E5\u9700\u65BD\u52A0\u6216\u79FB\u9664\u72B6\u6001\uFF0C\u8BF7\u4EC5\u5728 outcomes \u6587\u672C\u4E2D\u4F7F\u7528\u72B6\u6001\u6807\u7B7E\u3002"),r!=="none"&&s.push(`   - \u9AB0\u5B50\u9762\u6570\u9650\u5236\uFF1A${r}\u3002`),t.enableAiRollMode&&s.push("   - \u53EF\u4F7F\u7528 rollMode=auto|manual \u6307\u5B9A\u662F\u5426\u81EA\u52A8\u63B7\u9AB0\u3002"),t.enableAiRoundControl&&s.push("   - \u53EF\u4F7F\u7528 round_control \u6216 end_round \u63A7\u5236\u8F6E\u6B21\u662F\u5426\u7ED3\u675F\u3002"),t.enableExplodingDice&&(s.push("   - \u5DF2\u542F\u7528\u7206\u9AB0\uFF1A! \u4F1A\u5728\u63B7\u51FA\u6700\u5927\u9762\u540E\u8FDE\u7206\uFF0C\u7ED3\u679C\u4F1A\u5F71\u54CD\u5267\u60C5\u8D70\u5411\u3002"),s.push("   - \u7206\u9AB0\u662F\u5426\u89E6\u53D1\u7531\u7CFB\u7EDF\u6839\u636E\u771F\u5B9E\u63B7\u9AB0\u7ED3\u679C\u51B3\u5B9A\uFF0C\u4E0D\u53EF\u76F4\u63A5\u58F0\u660E\u201C\u5FC5\u7206\u201D\u3002"),t.enableAiRollMode&&s.push("   - AI \u81EA\u52A8\u68C0\u5B9A\u65F6\uFF0C\u540C\u4E00\u8F6E\u6700\u591A\u4EC5 1 \u4E2A\u4E8B\u4EF6\u4F7F\u7528 !\uFF0C\u5176\u4F59\u4F1A\u6309\u666E\u901A\u9AB0\u7ED3\u7B97\u3002")),t.enableAdvantageSystem&&s.push("   - \u5DF2\u542F\u7528\u4F18\u52BF/\u52A3\u52BF\uFF1A\u53EF\u7528 advantageState \u6216 kh/kl\uFF0C\u4F1A\u6539\u53D8\u7ED3\u679C\u5E76\u5F71\u54CD\u5267\u60C5\u8D70\u5411\u3002"),t.enableExplodingDice&&t.enableAdvantageSystem&&s.push("   - ! \u4E0E kh/kl \u4E0D\u80FD\u540C\u7528\u3002"),t.enableDynamicDcReason&&s.push("   - \u53EF\u586B\u5199 dc_reason \u89E3\u91CA\u96BE\u5EA6\u4F9D\u636E\u3002"),t.enableTimeLimit&&s.push("   - \u53EF\u586B\u5199 timeLimit\uFF0C\u4E14\u5FC5\u987B\u6EE1\u8DB3\u7CFB\u7EDF\u6700\u5C0F\u65F6\u9650\u3002"),t.enableOutcomeBranches&&(s.push("   - outcomes \u8D70\u5411\u6587\u672C\u4F1A\u76F4\u63A5\u5F71\u54CD\u540E\u7EED\u5267\u60C5\u53D9\u4E8B\u3002"),t.enableExplodingDice&&t.enableExplodeOutcomeBranch&&s.push("   - \u7206\u9AB0\u89E6\u53D1\u65F6\u4F18\u5148\u4F7F\u7528 outcomes.explode\u3002")),t.enableStatusSystem&&t.enableOutcomeBranches&&(s.push("5. \u53EF\u5728 outcomes \u4E2D\u4F7F\u7528\u72B6\u6001\u6807\u7B7E\uFF1A"),s.push("   - [APPLY_STATUS:\u540D,\u6574\u6570\u503C,turns=2,skills=A|B \u6216 scope=all]"),s.push("   - turns \u9ED8\u8BA4 1\uFF1B\u652F\u6301 duration= \u4F5C\u4E3A turns \u522B\u540D\uFF1Bturns=perm \u8868\u793A\u6C38\u4E45"),s.push("   - [REMOVE_STATUS:\u540D]"),s.push("   - [CLEAR_STATUS]"),s.push("   - \u8D1F\u9762\u72B6\u6001\u5FC5\u987B\u4F7F\u7528\u8D1F\u6570\uFF1B\u6B63\u9762\u72B6\u6001\uFF08\u52A0\u503C\uFF09\u5FC5\u987B\u4F7F\u7528\u6B63\u6570\u3002"),s.push("   - \u72B6\u6001\u6570\u503C\u7EDD\u5BF9\u503C\u9700\u4E0E\u5F53\u524D\u9AB0\u5B50\u9762\u6570\u5339\u914D\uFF0C\u907F\u514D\u5931\u8861\uFF0C\u8FD8\u9700\u8981\u6CE8\u610F\u72B6\u6001\u8BF7\u52FF\u8F7B\u6613\u9644\u52A0\uFF0C\u907F\u514D\u7834\u574F\u5E73\u8861\uFF01")),s.push("6. **\u5FC5\u987B\u9075\u5B88 <dice_runtime_policy> \u7684\u8FD0\u884C\u65F6\u9650\u5236\u3002**"),F(s.join(`
`))}function Dc(t){let e=yc(t),n=an(t.ruleText||"").trim();return n?F(`${e}

\u3010\u7528\u6237\u81EA\u5B9A\u4E49\u8865\u5145\u3011
${n}`):e}function xl(t){let e=String(t||"").split(/[,\s]+/).map(n=>Number(String(n||"").trim())).filter(n=>Number.isFinite(n)&&Number.isInteger(n)&&n>0);return e.length<=0?"none":Array.from(new Set(e)).sort((n,r)=>n-r).join(",")}function Rc(t,e=20){try{let n=JSON.parse(String(t||"{}"));if(!n||typeof n!="object"||Array.isArray(n))return{count:0,preview:"empty"};let r=Object.entries(n).filter(([i,o])=>String(i||"").trim().length>0&&Number.isFinite(Number(o))).map(([i,o])=>[String(i).trim(),Number(o)]);if(r.length<=0)return{count:0,preview:"empty"};let s=r.slice(0,Math.max(1,e)).map(([i,o])=>`${qr(i)}:${o}`).join(",");return{count:r.length,preview:s||"empty"}}catch{return{count:0,preview:"invalid_json"}}}function Ac(t,e,n){let r=xl(t.aiAllowedDiceSidesText),s=Rc(t.skillTableText),i=[];return i.push(e),i.push("v=1"),i.push(`apply_scope=${t.eventApplyScope}`),i.push(`round_mode=${t.enableAiRoundControl?"continuous":"per_round"}`),i.push(`roll_mode_allowed=${t.enableAiRollMode?"auto|manual":"manual_only"}`),i.push(`ai_round_control_enabled=${t.enableAiRoundControl?1:0}`),i.push(`round_control_allowed=${t.enableAiRoundControl?"continue|end_round":"disabled"}`),i.push(`explode_enabled=${t.enableExplodingDice?1:0}`),i.push(`ai_auto_explode_event_limit_per_round=${t.enableAiRollMode?1:0}`),i.push(`advantage_enabled=${t.enableAdvantageSystem?1:0}`),i.push(`dynamic_dc_reason_enabled=${t.enableDynamicDcReason?1:0}`),i.push(`status_system_enabled=${t.enableStatusSystem?1:0}`),i.push(`status_tags_allowed=${t.enableStatusSystem?1:0}`),i.push(`status_sign_rule=${t.enableStatusSystem?"debuff_negative,buff_positive":"disabled"}`),i.push(`outcome_branches_enabled=${t.enableOutcomeBranches?1:0}`),i.push(`explode_outcome_enabled=${t.enableExplodeOutcomeBranch?1:0}`),i.push(`time_limit_enabled=${t.enableTimeLimit?1:0}`),i.push(`min_time_limit_seconds=${Math.max(1,Math.floor(Number(t.minTimeLimitSeconds)||1))}`),i.push(`allowed_sides=${r}`),i.push(`skill_system_enabled=${t.enableSkillSystem?1:0}`),i.push(`skill_table_count=${s.count}`),i.push(`skill_table_preview=${s.preview}`),i.push(`summary_detail=${t.summaryDetailMode}`),i.push(`summary_rounds=${t.summaryHistoryRounds}`),i.push(`summary_include_outcome=${t.includeOutcomeInSummary?1:0}`),i.push(`list_outcome_preview=${t.showOutcomePreviewInListCard?1:0}`),i.push(n),F(i.join(`
`))}function kc(t,e){let n=F(t),r=e.map(s=>F(s)).filter(s=>s.length>0);return r.length?n?`${n}

${r.join(`

`)}`:r.join(`

`):n}function Lc(t,e,n,r,s,i){if(!e.enableDynamicResultGuidance)return t.outboundResultGuidance?(delete t.outboundResultGuidance,{text:"",changedMeta:!0}):{text:"",changedMeta:!1};if(r&&t.outboundResultGuidance&&t.outboundResultGuidance.userMsgId===n)return{text:F(t.outboundResultGuidance.guidanceText),changedMeta:!1};let o=Array.isArray(t.pendingResultGuidanceQueue)?t.pendingResultGuidanceQueue:[];if(o.length<=0)return t.outboundResultGuidance?(delete t.outboundResultGuidance,{text:"",changedMeta:!0}):{text:"",changedMeta:!1};let l=o.splice(0,o.length),a=_c(l,s,i),d=l[l.length-1]?.rollId||l[0]?.rollId||"";return t.outboundResultGuidance={userMsgId:n,rollId:d,guidanceText:a},{text:a,changedMeta:!0}}function Mc(t,e){let n=t.findIndex(r=>r.roundId===e.roundId);return n>=0?(t[n]=e,!0):(t.push(e),!0)}function Zr(t){if(cl(t))return t;if(!t||typeof t!="object")return null;let e=[t.chat,t.messages,t.message_list,t.prompt?.chat,t.prompt?.messages,t.data?.chat,t.data?.messages,t.chatCompletion?.messages];for(let n of e)if(cl(n))return n;return null}function yl(t,e,n="unknown"){let r=e.getSettingsEvent();if(!r.enabled)return;e.sweepTimeoutFailuresEvent();let s=Zr(t);if(!s||s.length===0)return;let i=hc(s);if(i<0)return;let o=s[i];if(!o)return;let l=bc(s),a=l>=0?s[l]:o;if(!a)return;let d=l>=0?"system":"user_fallback",c=e.DICE_RULE_BLOCK_START_Event||El,u=e.DICE_RULE_BLOCK_END_Event||vl,E=e.DICE_RUNTIME_POLICY_BLOCK_START_Event||fl,v=e.DICE_RUNTIME_POLICY_BLOCK_END_Event||Tl,m=e.DICE_SUMMARY_BLOCK_START_Event||ml,f=e.DICE_SUMMARY_BLOCK_END_Event||gl,S=e.DICE_RESULT_GUIDANCE_BLOCK_START_Event||Sl,g=e.DICE_RESULT_GUIDANCE_BLOCK_END_Event||pl,_=e.DICE_ACTIVE_STATUSES_BLOCK_START_Event||_l,h=e.DICE_ACTIVE_STATUSES_BLOCK_END_Event||bl,x={ruleStart:c,ruleEnd:u,runtimePolicyStart:E,runtimePolicyEnd:v,summaryStart:m,summaryEnd:f,guidanceStart:S,guidanceEnd:g,statusesStart:_,statusesEnd:h},T=ul(ht(o),x),p=Ic(T,o,i);a!==o&&ht(o)!==T&&pe(o,T);let I=e.getDiceMetaEvent(),A=I.lastPromptUserMsgId===p,k=!1;if(A||(I.lastPromptUserMsgId=p,k=!0),!A&&I.pendingRound&&Array.isArray(I.pendingRound.events)&&I.pendingRound.events.length>0){let z=e.ensureSummaryHistoryEvent(I),vt=e.createRoundSummarySnapshotEvent(I.pendingRound,Date.now());Mc(z,vt)&&(e.trimSummaryHistoryEvent(z),k=!0)}!A&&!r.enableAiRoundControl&&I.pendingRound?.status==="open"&&(I.pendingRound.status="closed",k=!0,b.info("\u5DF2\u6309\u201C\u6BCF\u8F6E\u6A21\u5F0F\u201D\u5728\u7528\u6237\u53D1\u8A00\u540E\u7ED3\u675F\u5F53\u524D\u8F6E\u6B21"));let D=ht(a),N=ul(D,x),M="",H="";if(r.autoSendRuleToAI){let z=Dc(r);M=xc(z,c,u),H=Ac(r,E,v)}let P="";if(A&&I.outboundSummary&&I.outboundSummary.userMsgId===p)P=F(I.outboundSummary.summaryText);else{let z=e.ensureSummaryHistoryEvent(I),vt=e.buildSummaryBlockFromHistoryEvent(z,r.summaryDetailMode,r.summaryHistoryRounds,r.includeOutcomeInSummary);P=F(vt),P?I.outboundSummary={userMsgId:p,roundId:I.pendingRound?.roundId||"",summaryText:P}:I.outboundSummary&&delete I.outboundSummary,k=!0}let fe=Lc(I,r,p,A,S,g),_n=F(fe.text);fe.changedMeta&&(k=!0);let y=r.enableStatusSystem?bi(q(I),_,h):"",U=kc(N,[M,H,P,_n,y]);U!==D&&pe(a,U),k&&e.saveMetadataSafeEvent(),b.info(`Prompt managed blocks updated via ${n} (target=${d})`)}function Dl(t){return Kr(t,dr)}function it(t){Xr(t,{getSettingsEvent:R,resolveEventTargetEvent:sn,parseIsoDurationToMsEvent:Dl,applyTimeLimitPolicyMsEvent:rn})}function ts(t){return Vo(t,{getSettingsEvent:R,OUTCOME_TEXT_MAX_LEN_Event:Ei,ISO_8601_DURATION_REGEX_Event:dr})}function es(t,e){return Yo(t,e,gt)}function Nc(t){return tl(t,{parseDiceExpression:W})}function wc(t,e,n){return rl(t,e,n,{getSettingsEvent:R,getDiceMetaEvent:L,normalizeCompareOperatorEvent:jt,createSyntheticTimeoutDiceResultEvent:Nc,resolveSkillModifierBySkillNameEvent:kt,createIdEvent:nt})}function ns(t,e,n=Date.now()){return sl(t,e,{getSettingsEvent:R,getLatestRollRecordForEvent:st,ensureRoundEventTimersSyncedEvent:it,createTimeoutFailureRecordEvent:wc},n)}function Et(){return il({getSettingsEvent:R,getDiceMetaEvent:L,ensureRoundEventTimersSyncedEvent:it,recordTimeoutFailureIfNeededEvent:ns,saveMetadataSafeEvent:Z})}function Rl(t,e){return nl(t,e,{getSettingsEvent:R,getDiceMetaEvent:L,createIdEvent:nt,parseIsoDurationToMsEvent:Dl,applyTimeLimitPolicyMsEvent:rn,resolveEventTargetEvent:sn,saveMetadataSafeEvent:Z})}function Al(t,e){return al(t,e,{getSettingsEvent:R,resolveTriggeredOutcomeEvent:Xt,formatEventModifierBreakdownEvent:Kt})}function Cc(t,e=Date.now()){return jo(t,{ensureRoundEventTimersSyncedEvent:it,getSettingsEvent:R,getLatestRollRecordForEvent:st,resolveTriggeredOutcomeEvent:Xt,normalizeCompareOperatorEvent:jt},e)}function $c(t,e,n,r){return Wo(t,e,n,r,{SUMMARY_HISTORY_ROUNDS_MAX_Event:Bt,SUMMARY_HISTORY_ROUNDS_MIN_Event:Ht,SUMMARY_MAX_EVENTS_Event:di,SUMMARY_MAX_TOTAL_EVENT_LINES_Event:ci,DICE_SUMMARY_BLOCK_START_Event:lr,DICE_SUMMARY_BLOCK_END_Event:ar})}function Pc(t){qo(t,ui)}function kl(t,e="unknown"){yl(t,{getSettingsEvent:R,DICE_RULE_BLOCK_START_Event:ei,DICE_RULE_BLOCK_END_Event:ni,DICE_SUMMARY_BLOCK_START_Event:lr,DICE_SUMMARY_BLOCK_END_Event:ar,DICE_RESULT_GUIDANCE_BLOCK_START_Event:ri,DICE_RESULT_GUIDANCE_BLOCK_END_Event:si,DICE_RUNTIME_POLICY_BLOCK_START_Event:ii,DICE_RUNTIME_POLICY_BLOCK_END_Event:oi,DICE_ACTIVE_STATUSES_BLOCK_START_Event:li,DICE_ACTIVE_STATUSES_BLOCK_END_Event:ai,sweepTimeoutFailuresEvent:Et,getDiceMetaEvent:L,ensureSummaryHistoryEvent:Xo,createRoundSummarySnapshotEvent:Cc,trimSummaryHistoryEvent:Pc,buildSummaryBlockFromHistoryEvent:$c,saveMetadataSafeEvent:Z},e)}function dn(){return`
  <style>
    .st-rh-card-scope {
      --rh-border: #8c7b60;
      --rh-border-soft: rgba(197, 160, 89, 0.25);
      --rh-bg: linear-gradient(145deg, #1c1412 0%, #0d0806 100%);
      --rh-text: #d1c5a5;
      --rh-text-dim: #8c7b60;
      --rh-title: #e8dcb5;
      --rh-accent: #ffdfa3;
      --rh-chip-bg: rgba(255, 255, 255, 0.05);
      --rh-chip-border: rgba(150, 150, 150, 0.2);
      --rh-glow: 0 8px 24px rgba(0, 0, 0, 0.4), inset 0 0 30px rgba(0, 0, 0, 0.6);
      color: var(--rh-text);
      font-family: "Noto Sans SC", "Microsoft YaHei", "Segoe UI", sans-serif;
    }
    .st-rh-card-scope * {
      box-sizing: border-box;
    }
    .st-rh-details-card {
      position: relative;
      overflow: hidden;
    }
    .st-rh-details-card > summary {
      list-style: none;
      cursor: pointer;
    }
    .st-rh-details-card > summary::-webkit-details-marker {
      display: none;
    }
    .st-rh-collapse-summary {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      padding: 10px 12px;
      border: 1px solid rgba(197, 160, 89, 0.3);
      border-radius: 10px;
      background: linear-gradient(135deg, rgba(46, 31, 24, 0.85), rgba(18, 12, 9, 0.92));
      box-shadow: inset 0 1px 0 rgba(255, 223, 163, 0.08), 0 8px 18px rgba(0, 0, 0, 0.26);
    }
    .st-rh-collapse-summary-result {
      margin-bottom: 2px;
    }
    .st-rh-summary-main {
      min-width: 0;
      flex: 1;
    }
    .st-rh-collapse-title-row {
      display: flex;
      align-items: center;
      gap: 8px;
      min-width: 0;
    }
    .st-rh-summary-title {
      font-family: "Noto Serif SC", "STSong", "Georgia", serif;
      color: var(--rh-accent);
      font-size: 15px;
      letter-spacing: 0.4px;
      font-weight: 700;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .st-rh-summary-id {
      font-size: 11px;
      color: #7d6a50;
      opacity: 0.9;
      flex-shrink: 0;
      max-width: 240px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .st-rh-summary-meta-row {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 6px;
      margin-top: 7px;
    }
    .st-rh-summary-chip {
      display: inline-flex;
      align-items: center;
      border: 1px solid rgba(197, 160, 89, 0.24);
      background: rgba(255, 255, 255, 0.04);
      border-radius: 999px;
      padding: 3px 9px;
      font-size: 11px;
      line-height: 1.45;
      color: #dbc79f;
      max-width: 100%;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .st-rh-summary-pill {
      --rh-pill: #52c41a;
      display: inline-flex;
      align-items: center;
      border: 1px solid var(--rh-pill);
      background: rgba(0, 0, 0, 0.24);
      color: var(--rh-pill);
      border-radius: 999px;
      padding: 3px 9px;
      font-size: 11px;
      line-height: 1.4;
      font-weight: 700;
      white-space: nowrap;
    }
    .st-rh-summary-actions {
      display: inline-flex;
      align-items: center;
      justify-content: flex-end;
      gap: 8px;
      flex-shrink: 0;
    }
    .st-rh-summary-dice {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 54px;
      min-height: 54px;
      border: 1px solid rgba(197, 160, 89, 0.3);
      border-radius: 9px;
      background: rgba(0, 0, 0, 0.22);
      padding: 2px;
      box-shadow: inset 0 1px 0 rgba(255, 223, 163, 0.08);
    }
    .st-rh-summary-dice svg {
      display: block;
      width: 48px;
      height: 48px;
    }
    .st-rh-summary-toggle-state {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      white-space: nowrap;
      user-select: none;
    }
    .st-rh-roll-btn,
    .st-rh-summary-toggle-state {
      border: 1px solid #c5a059;
      background: linear-gradient(135deg, #3a2515, #1a100a);
      color: var(--rh-accent);
      border-radius: 8px;
      min-height: 32px;
      padding: 6px 12px;
      font-family: "Noto Serif SC", "STSong", "Georgia", serif;
      font-weight: 700;
      font-size: 12px;
      letter-spacing: 0.8px;
      line-height: 1;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
      transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease, filter 0.2s ease;
      text-transform: uppercase;
    }
    .st-rh-roll-btn {
      cursor: pointer;
    }
    .st-rh-summary-toggle-state {
      cursor: pointer;
    }
    .st-rh-roll-btn:hover,
    .st-rh-details-card:hover .st-rh-summary-toggle-state {
      border-color: #efd392;
      filter: brightness(1.08);
      transform: translateY(-1px);
      box-shadow: 0 6px 12px rgba(0, 0, 0, 0.36);
    }
    .st-rh-runtime-inline {
      margin: 0;
      white-space: nowrap;
    }
    .st-rh-summary-lock {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 30px;
      min-width: 72px;
      padding: 4px 9px;
      border: 1px dashed rgba(197, 160, 89, 0.36);
      border-radius: 8px;
      color: #a89472;
      background: rgba(18, 11, 8, 0.5);
      font-size: 11px;
    }
    .st-rh-summary-toggle-icon {
      display: inline-flex;
      transition: transform 0.2s ease;
      line-height: 1;
      font-size: 11px;
      opacity: 0.9;
    }
    .st-rh-toggle-open {
      display: none;
    }
    .st-rh-details-card[open] .st-rh-toggle-open {
      display: inline;
    }
    .st-rh-details-card[open] .st-rh-toggle-closed {
      display: none;
    }
    .st-rh-details-card[open] .st-rh-summary-toggle-icon {
      transform: rotate(180deg);
    }
    .st-rh-card-details-body {
      margin-top: 12px;
      display: none;
      animation: st-rh-details-reveal 0.2s ease;
    }
    .st-rh-details-card[open] > .st-rh-card-details-body {
      display: block;
    }
    @keyframes st-rh-details-reveal {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }
    .st-rh-event-board,
    .st-rh-result-card {
      border: 1px solid var(--rh-border);
      background: var(--rh-bg);
      color: var(--rh-text);
      box-shadow: var(--rh-glow);
      padding: 16px;
    }
    .st-rh-board-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 10px;
      margin-bottom: 16px;
      border-bottom: 1px solid #4a3b2c;
      padding-bottom: 10px;
    }
    .st-rh-board-title {
      color: var(--rh-title);
      font-size: 17px;
      letter-spacing: 2px;
      font-family: "Noto Serif SC", "STSong", "Georgia", serif;
      font-weight: 700;
    }
    .st-rh-board-id {
      font-size: 11px;
      color: #6b5a45;
      font-family: "JetBrains Mono", "Consolas", monospace;
      max-width: 240px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .st-rh-board-head-right {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 6px;
      max-width: 100%;
    }
    .st-rh-event-list {
      padding: 0;
      margin: 0;
      list-style: none;
    }
    .st-rh-event-item {
      margin-bottom: 16px;
      border: 1px solid var(--rh-border-soft);
      border-left: 3px solid #c5a059;
      border-radius: 8px;
      padding: 14px;
      background: linear-gradient(135deg, rgba(30, 20, 18, 0.82), rgba(15, 10, 10, 0.92));
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.28);
    }
    .st-rh-event-item-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 10px;
    }
    .st-rh-event-title {
      margin: 0;
      color: var(--rh-accent);
      font-size: 17px;
      letter-spacing: 0.8px;
      font-family: "Noto Serif SC", "STSong", "Georgia", serif;
      font-weight: 700;
      word-break: break-word;
    }
    .st-rh-event-id {
      font-size: 11px;
      font-family: "JetBrains Mono", "Consolas", monospace;
      color: var(--rh-text-dim);
      background: rgba(0, 0, 0, 0.5);
      border: 1px solid rgba(197, 160, 89, 0.2);
      padding: 3px 8px;
      border-radius: 4px;
      max-width: 150px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .st-rh-event-desc {
      margin: 0 0 12px;
      font-size: 13px;
      line-height: 1.7;
      text-align: center;
      color: var(--rh-text);
      opacity: 0.95;
    }
    .st-rh-chip-row {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      align-items: center;
      gap: 8px;
      margin: 12px 0;
    }
    .st-rh-chip {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 11px;
      padding: 4px 9px;
      border: 1px solid var(--rh-chip-border);
      background: var(--rh-chip-bg);
      color: var(--rh-text);
      text-transform: uppercase;
      border-radius: 6px;
      letter-spacing: 0.3px;
      line-height: 1.4;
    }
    .st-rh-chip-highlight {
      color: #ffd987;
    }
    .st-rh-chip-target {
      color: #9ad1ff;
    }
    .st-rh-chip-dice {
      color: var(--rh-accent);
    }
    .st-rh-chip-check {
      color: #ffbbbb;
    }
    .st-rh-chip-time {
      color: #a0d9a0;
    }
    .st-rh-dc-reason {
      margin: 8px 0;
      font-size: 12px;
      line-height: 1.6;
      text-align: center;
      color: #c8d6a1;
      border: 1px dashed rgba(160, 197, 110, 0.35);
      background: rgba(34, 44, 22, 0.38);
      padding: 8px 10px;
      border-radius: 6px;
    }
    .st-rh-runtime-wrap {
      display: flex;
      justify-content: center;
      margin-bottom: 4px;
    }
    .st-rh-runtime {
      display: inline-block;
      padding: 4px 10px;
      font-size: 11px;
      font-family: "JetBrains Mono", "Consolas", monospace;
      letter-spacing: 1px;
      border-radius: 6px;
    }
    .st-rh-event-footer {
      margin-top: 14px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      border-top: 1px dashed rgba(197, 160, 89, 0.2);
      padding-top: 12px;
    }
    .st-rh-event-footer.is-centered {
      justify-content: center;
    }
    .st-rh-command {
      font-size: 11px;
      color: var(--rh-text-dim);
      background: none;
      padding: 0;
      font-family: "JetBrains Mono", "Consolas", monospace;
      word-break: break-all;
    }
    .st-rh-result-details .st-rh-result-head {
      margin-bottom: 12px;
    }
    .st-rh-result-details .st-rh-result-title {
      margin-bottom: 12px;
    }
    .st-rh-result-head {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      gap: 10px;
      margin-bottom: 14px;
      border-bottom: 1px solid #4a3b2c;
      padding-bottom: 10px;
    }
    .st-rh-result-head-centered {
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      gap: 4px;
    }
    .st-rh-result-head-centered .st-rh-result-id {
      text-align: center;
    }
    .st-rh-result-heading {
      color: var(--rh-title);
      font-size: 16px;
      letter-spacing: 1px;
      font-family: "Noto Serif SC", "STSong", "Georgia", serif;
      font-weight: 700;
    }
    .st-rh-result-id {
      font-size: 11px;
      color: #6b5a45;
      font-family: "JetBrains Mono", "Consolas", monospace;
      text-align: right;
    }
    .st-rh-result-title {
      margin-bottom: 12px;
      font-weight: 700;
      font-size: 20px;
      color: var(--rh-accent);
      text-align: center;
      font-family: "Noto Serif SC", "STSong", "Georgia", serif;
      letter-spacing: 0.5px;
    }
    .st-rh-meta-grid {
      display: grid;
      grid-template-columns: auto 1fr;
      gap: 7px 12px;
      font-size: 12px;
      line-height: 1.5;
      background: rgba(0, 0, 0, 0.3);
      padding: 12px;
      border: 1px solid rgba(197, 160, 89, 0.15);
      border-radius: 8px;
      overflow: visible;
    }
    .st-rh-meta-label {
      color: var(--rh-text-dim);
      text-align: right;
      white-space: nowrap;
    }
    .st-rh-meta-value {
      color: var(--rh-text);
      word-break: break-word;
    }
    .st-rh-mono {
      font-family: "JetBrains Mono", "Consolas", monospace;
    }
    .st-rh-result-main {
      margin-top: 16px;
      display: grid;
      grid-template-columns: 1fr auto 1fr;
      align-items: center;
      gap: 12px;
      background: linear-gradient(90deg, rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.1));
      padding: 12px;
      border-left: 3px solid var(--status-color, #52c41a);
      border-radius: 8px;
    }
    .st-rh-result-main-left {
      justify-self: start;
    }
    .st-rh-result-main-center {
      justify-self: center;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .st-rh-result-main-right {
      justify-self: end;
      text-align: right;
      overflow: visible;
    }
    .st-rh-details-result .st-rh-result-main {
      grid-template-columns: 1fr;
      text-align: center;
      gap: 10px;
    }
    .st-rh-details-result .st-rh-result-main-left,
    .st-rh-details-result .st-rh-result-main-center,
    .st-rh-details-result .st-rh-result-main-right {
      justify-self: center;
      text-align: center;
    }
    .st-rh-result-kicker {
      font-size: 11px;
      color: var(--rh-text-dim);
      letter-spacing: 1px;
      text-transform: uppercase;
      margin-bottom: 4px;
    }
    .st-rh-result-status {
      font-weight: 700;
      font-size: 16px;
      color: var(--status-color, #52c41a);
      letter-spacing: 1px;
    }
    .st-rh-outcome-box {
      margin-top: 10px;
      padding: 10px;
      border: 1px solid rgba(197, 160, 89, 0.2);
      background: rgba(0, 0, 0, 0.25);
      border-radius: 8px;
    }
    .st-rh-outcome-label {
      font-size: 11px;
      color: var(--rh-text-dim);
      letter-spacing: 1px;
      text-transform: uppercase;
      margin-bottom: 6px;
    }
    .st-rh-outcome-text {
      font-size: 13px;
      line-height: 1.7;
      color: var(--rh-title);
    }
    .st-rh-outcome-status-change {
      margin-top: 8px;
      padding: 8px 10px;
      border: 1px dashed rgba(111, 194, 255, 0.45);
      border-radius: 8px;
      background: rgba(10, 26, 38, 0.38);
      font-size: 12px;
      line-height: 1.55;
      color: #b6e0ff;
      word-break: break-word;
    }
    .st-rh-outcome-status-current {
      margin-top: 8px;
      padding: 8px 10px;
      border: 1px dashed rgba(160, 197, 110, 0.42);
      border-radius: 8px;
      background: rgba(28, 42, 20, 0.34);
      font-size: 12px;
      line-height: 1.55;
      color: #d7f0b0;
      word-break: break-word;
    }
    .st-rh-time-limit {
      margin-top: 12px;
      font-size: 11px;
      color: #6b5a45;
      text-align: right;
      font-family: "JetBrains Mono", "Consolas", monospace;
    }
    .st-rh-already-card {
      border-left: 3px solid rgba(197, 160, 89, 0.58);
    }
    .st-rh-already-details .st-rh-result-head {
      margin-bottom: 8px;
      padding-bottom: 8px;
    }
    .st-rh-already-stack {
      display: flex;
      flex-direction: column;
      gap: 6px;
      margin-bottom: 10px;
      font-size: 13px;
      line-height: 1.6;
      color: #c8b796;
    }
    .st-rh-already-line {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-wrap: wrap;
    }
    .st-rh-already-line-condition {
      padding-top: 6px;
      border-top: 1px solid rgba(197, 160, 89, 0.18);
    }
    .st-rh-already-label {
      color: #8f7a58;
      white-space: nowrap;
    }
    .st-rh-already-dc-reason {
      color: #c8d6a1;
      font-size: 12px;
      line-height: 1.5;
    }
    .st-rh-tip {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: help;
      border-bottom: 1px dotted rgba(255, 223, 163, 0.55);
      color: #e8dcb5;
    }

    @media (max-width: 768px) {
      .st-rh-event-board,
      .st-rh-result-card {
        padding: 12px;
      }
      .st-rh-board-head {
        flex-direction: column;
        align-items: flex-start;
      }
      .st-rh-board-id {
        max-width: 100%;
      }
      .st-rh-board-head-right {
        align-items: flex-start;
        width: 100%;
      }
      .st-rh-event-item {
        padding: 12px;
      }
      .st-rh-collapse-summary {
        flex-direction: column;
        align-items: stretch;
        gap: 9px;
      }
      .st-rh-summary-title {
        font-size: 14px;
      }
      .st-rh-summary-id {
        max-width: 100%;
      }
      .st-rh-summary-actions {
        width: 100%;
        justify-content: space-between;
      }
      .st-rh-summary-dice {
        min-width: 48px;
        min-height: 48px;
      }
      .st-rh-summary-dice svg {
        width: 42px;
        height: 42px;
      }
      .st-rh-runtime-inline {
        flex: 1 1 auto;
      }
      .st-rh-summary-toggle-state {
        margin-left: auto;
      }
      .st-rh-event-title {
        font-size: 16px;
      }
      .st-rh-event-id {
        max-width: 100%;
      }
      .st-rh-event-footer {
        flex-direction: column;
        justify-content: center;
      }
      .st-rh-command {
        text-align: center;
      }
      .st-rh-roll-btn {
        width: auto;
        max-width: 220px;
      }
      .st-rh-result-title {
        font-size: 18px;
      }
      .st-rh-meta-grid {
        grid-template-columns: 1fr;
        gap: 4px;
      }
      .st-rh-meta-label {
        text-align: left;
        margin-top: 8px;
      }
      .st-rh-result-main {
        grid-template-columns: 1fr;
        text-align: center;
      }
      .st-rh-result-main-left,
      .st-rh-result-main-center,
      .st-rh-result-main-right {
        justify-self: center;
        text-align: center;
      }
      .st-rh-time-limit {
        text-align: center;
      }
    }

    @media (max-width: 430px) {
      .st-rh-board-title {
        font-size: 15px;
      }
      .st-rh-event-desc,
      .st-rh-outcome-text {
        font-size: 12px;
      }
      .st-rh-outcome-status-change {
        font-size: 11px;
      }
      .st-rh-outcome-status-current {
        font-size: 11px;
      }
      .st-rh-chip {
        font-size: 10px;
        padding: 3px 7px;
      }
      .st-rh-result-status {
        font-size: 15px;
      }
      .st-rh-summary-chip,
      .st-rh-summary-pill {
        font-size: 10px;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .st-rh-roll-btn {
        transition: none;
      }
      .st-rh-roll-btn:hover {
        transform: none;
      }
      .st-rh-summary-toggle-state {
        transition: none;
      }
      .st-rh-summary-toggle-icon,
      .st-rh-card-details-body {
        transition: none;
        animation: none;
      }
    }
  </style>`}function Ll(t,e){return`<div style="margin-top:10px;padding:8px;border:1px solid rgba(82, 196, 26, 0.3);background:rgba(20, 35, 20, 0.6);font-size:12px;color:#a0d9a0;text-align:center;letter-spacing:0.5px;">
            ${t} \u5DF2\u7ED3\u7B97\uFF1A${e}
          </div>`}function Ml(t){return t?"<span style='color:#ff4d4f;font-weight:bold;'>[\u8D85\u65F6]</span>":"<span style='color:#52c41a;font-weight:bold;'>[\u5DF2\u63B7]</span>"}function C(t,e){return`<span class="st-rh-tip" data-tip="${e}">${t}</span>`}function rs(){return`<span class="st-rh-summary-toggle-state" aria-hidden="true">
            <span class="st-rh-summary-toggle-icon">\u25BE</span>
            <span class="st-rh-toggle-closed">\u5C55\u5F00\u8BE6\u60C5</span>
            <span class="st-rh-toggle-open">\u6536\u8D77\u8BE6\u60C5</span>
          </span>`}function Nl(t){return`<button type="button" class="st-rh-roll-btn" data-dice-event-roll="1" data-round-id="${t.roundIdAttr}" data-dice-event-id="${t.eventIdAttr}" data-dice-expr="${t.diceExprAttr}" ${t.buttonDisabledAttr} style="${t.buttonStateStyle}">
            \u6267\u884C\u68C0\u5B9A
          </button>`}function wl(t){let e="st-rh-event-footer is-centered",n=t.modifierTextHtml?`<span class="st-rh-chip">${C("\u4FEE\u6B63","\u603B\u4FEE\u6B63 = \u57FA\u7840\u4FEE\u6B63 + \u6280\u80FD\u4FEE\u6B63 + \u72B6\u6001\u4FEE\u6B63\u3002")} <span class="st-rh-chip-highlight">${t.modifierTextHtml}</span></span>`:"",r=t.rollButtonHtml?t.rollButtonHtml:'<span class="st-rh-summary-lock st-rh-mono">\u5DF2\u9501\u5B9A</span>',s=t.dcReasonHtml?`<div class="st-rh-dc-reason">${C("DC \u539F\u56E0","\u7528\u4E8E\u89E3\u91CA\u8BE5\u4E8B\u4EF6\u96BE\u5EA6\uFF08DC\uFF09\u8BBE\u7F6E\u7684\u53D9\u4E8B\u4F9D\u636E\u3002")}\uFF1A${t.dcReasonHtml}</div>`:"";return`
      <li class="st-rh-event-item">
        <details class="st-rh-details-card st-rh-details-event">
          <summary class="st-rh-collapse-summary">
          <div class="st-rh-summary-main">
            <div class="st-rh-collapse-title-row">
              <strong class="st-rh-summary-title">\u25CF ${t.titleHtml}</strong>
              <span class="st-rh-summary-id st-rh-mono" title="${t.eventIdHtml}">ID: ${t.eventIdHtml}</span>
            </div>
            <div class="st-rh-summary-meta-row">
              <span class="st-rh-summary-chip">${t.collapsedCheckHtml}</span>
              <span class="st-rh-summary-chip">\u65F6\u9650 ${t.timeLimitHtml}</span>
            </div>
          </div>
          <div class="st-rh-summary-actions">
            <div data-dice-countdown="1" data-round-id="${t.roundIdAttr}" data-event-id="${t.eventIdAttr}" data-deadline-at="${t.deadlineAttr}" class="st-rh-runtime st-rh-runtime-inline st-rh-mono" style="border:${t.runtimeBorder};background:${t.runtimeBackground};color:${t.runtimeColor};">
              \u23F1 ${t.collapsedRuntimeHtml}
            </div>
            ${r}
            ${rs()}
          </div>
          </summary>

          <div id="${t.detailsIdAttr}" class="st-rh-card-details-body st-rh-event-details">
          <div class="st-rh-event-desc">
            ${t.descHtml}
          </div>

          ${t.outcomePreviewHtml}

          <div class="st-rh-chip-row">
            <span class="st-rh-chip">${C("\u5BF9\u8C61","\u672C\u6B21\u4E8B\u4EF6\u5F71\u54CD\u7684\u53D9\u4E8B\u5BF9\u8C61\u3002")} <span class="st-rh-chip-target">${t.targetHtml}</span></span>
            <span class="st-rh-chip">${C("\u6280\u80FD","\u53C2\u4E0E\u68C0\u5B9A\u5E76\u63D0\u4F9B\u4FEE\u6B63\u7684\u6280\u80FD\u9879\u3002")} <span style="color:#fff;cursor:help;" title="${t.skillTitleAttr}">${t.skillHtml}</span></span>
            <span class="st-rh-chip">${C("\u9AB0\u6001","\u9AB0\u6001\u5206\u4E3A\uFF1A\u666E\u901A\uFF08normal\uFF09\u3001\u4F18\u52BF\uFF08advantage\uFF09\u3001\u52A3\u52BF\uFF08disadvantage\uFF09\uFF0C\u4F1A\u5F71\u54CD\u63B7\u9AB0\u7ED3\u679C\u3002")} <span class="st-rh-chip-highlight">${t.advantageStateHtml}</span></span>
            <span class="st-rh-chip">${C("\u9AB0\u5F0F","\u672C\u6B21\u63B7\u9AB0\u8868\u8FBE\u5F0F\uFF0C\u5982 1d20\u30011d20!\u30012d20kh1\u3002")} <span class="st-rh-chip-dice">${t.checkDiceHtml}</span></span>
            <span class="st-rh-chip">${C("\u6761\u4EF6","\u5C06\u63B7\u9AB0\u603B\u503C\u4E0E DC \u6309\u6BD4\u8F83\u7B26\u8FDB\u884C\u5224\u5B9A\u3002")} <span class="st-rh-chip-check">${t.compareHtml} ${t.dcText}</span></span>
            <span class="st-rh-chip">${C("\u65F6\u9650","\u8D85\u65F6\u672A\u63B7\u9AB0\u65F6\uFF0C\u7CFB\u7EDF\u4F1A\u6309\u8D85\u65F6\u89C4\u5219\u5904\u7406\u3002")} <span class="st-rh-chip-time">${t.timeLimitHtml}</span></span>
            ${n}
          </div>
          ${s}

          ${t.rolledBlockHtml}

          <div class="${e}">
            <code class="st-rh-command">${t.commandTextHtml}</code>
          </div>
          </div>
        </details>
      </li>`}function Cl(t,e){return`
  <div class="st-rh-card-scope">
    ${dn()}
    <div class="st-rh-event-board">
      <div class="st-rh-board-head">
        <strong class="st-rh-board-title">\u5F53\u524D\u4E8B\u4EF6</strong>
        <div class="st-rh-board-head-right">
          <span class="st-rh-board-id st-rh-mono" title="${t}">\u8F6E\u6B21 ID: ${t}</span>
        </div>
      </div>
      <ul class="st-rh-event-list">${e}</ul>
    </div>
  </div>`}function $l(t){let e=t.modifierBreakdownHtml?`<div class="st-rh-meta-label">${C("\u4FEE\u6B63","\u603B\u4FEE\u6B63 = \u57FA\u7840\u4FEE\u6B63 + \u6280\u80FD\u4FEE\u6B63 + \u72B6\u6001\u4FEE\u6B63\u3002")}</div>
       <div class="st-rh-meta-value st-rh-mono" style="color:#ffd987;">${t.modifierBreakdownHtml}</div>`:"";return`
  <div class="st-rh-card-scope">
    ${dn()}
    <details class="st-rh-result-card st-rh-details-card st-rh-details-result">
      <summary class="st-rh-collapse-summary st-rh-collapse-summary-result">
        <div class="st-rh-summary-main">
          <div class="st-rh-collapse-title-row">
            <strong class="st-rh-summary-title">${t.titleHtml}</strong>
            <span class="st-rh-summary-id st-rh-mono">${t.rollIdHtml}</span>
          </div>
          <div class="st-rh-summary-meta-row">
            <span class="st-rh-summary-pill" style="--rh-pill:${t.statusColor};">${t.collapsedStatusHtml}</span>
            <span class="st-rh-summary-chip st-rh-mono">\u603B\u70B9 ${t.collapsedTotalHtml}</span>
            <span class="st-rh-summary-chip st-rh-mono">${t.collapsedConditionHtml}</span>
            <span class="st-rh-summary-chip">${t.collapsedSourceHtml}</span>
          </div>
        </div>
        <div class="st-rh-summary-actions">
          ${t.collapsedDiceVisualHtml?`<span class="st-rh-summary-dice">${t.collapsedDiceVisualHtml}</span>`:""}
          ${rs()}
        </div>
      </summary>

      <div id="${t.detailsIdAttr}" class="st-rh-card-details-body st-rh-result-details">
        <div class="st-rh-result-head st-rh-result-head-centered">
          <strong class="st-rh-result-heading">\u68C0\u5B9A\u7ED3\u679C</strong>
          <span class="st-rh-result-id">${t.rollIdHtml}</span>
        </div>

        <div class="st-rh-result-title">${t.titleHtml}</div>

        <div class="st-rh-meta-grid">
          <div class="st-rh-meta-label">${C("\u4E8B\u4EF6 ID","\u4E8B\u4EF6\u552F\u4E00\u6807\u8BC6\u3002")}</div>
          <div class="st-rh-meta-value st-rh-mono">${t.eventIdHtml}</div>

          <div class="st-rh-meta-label">${C("\u6765\u6E90","\u8BE5\u6B21\u7ED3\u7B97\u7531\u8C01\u89E6\u53D1\uFF1AAI \u81EA\u52A8\u3001\u73A9\u5BB6\u624B\u52A8\u6216\u8D85\u65F6\u7CFB\u7EDF\u7ED3\u7B97\u3002")}</div>
          <div class="st-rh-meta-value">${t.sourceHtml}</div>

          <div class="st-rh-meta-label">${C("\u5BF9\u8C61","\u672C\u6B21\u4E8B\u4EF6\u5F71\u54CD\u7684\u53D9\u4E8B\u5BF9\u8C61\u3002")}</div>
          <div class="st-rh-meta-value" style="color:#9ad1ff;">${t.targetHtml}</div>

          <div class="st-rh-meta-label">${C("\u6280\u80FD","\u53C2\u4E0E\u68C0\u5B9A\u5E76\u63D0\u4F9B\u4FEE\u6B63\u7684\u6280\u80FD\u9879\u3002")}</div>
          <div class="st-rh-meta-value" style="color:#fff;"><span style="cursor:help;" title="${t.skillTitleAttr}">${t.skillHtml}</span></div>

          <div class="st-rh-meta-label">${C("\u9AB0\u6001","\u9AB0\u6001\u5206\u4E3A\uFF1A\u666E\u901A\uFF08normal\uFF09\u3001\u4F18\u52BF\uFF08advantage\uFF09\u3001\u52A3\u52BF\uFF08disadvantage\uFF09\uFF0C\u4F1A\u5F71\u54CD\u63B7\u9AB0\u7ED3\u679C\u3002")}</div>
          <div class="st-rh-meta-value st-rh-chip-highlight">${t.advantageStateHtml}</div>

          <div class="st-rh-meta-label">${C("\u9AB0\u5F0F","\u672C\u6B21\u63B7\u9AB0\u8868\u8FBE\u5F0F\uFF0C\u5982 1d20\u30011d20!\u30012d20kh1\u3002")}</div>
          <div class="st-rh-meta-value st-rh-mono" style="color:#ffdfa3;">${t.diceExprHtml}${t.diceModifierHintHtml?`<span style="margin-left:8px;color:#ffd987;">${t.diceModifierHintHtml}</span>`:""}</div>

          <div class="st-rh-meta-label">${C("\u63B7\u9AB0\u7ED3\u679C","\u539F\u59CB\u63B7\u9AB0\u9762\u503C\u4E0E\u6700\u7EC8\u4FEE\u6B63\u540E\u7684\u7ED3\u679C\u3002")}</div>
          <div class="st-rh-meta-value st-rh-mono">${t.rollsSummaryHtml}</div>

          <div class="st-rh-meta-label">${C("\u7206\u9AB0","\u662F\u5426\u8BF7\u6C42\u7206\u9AB0\uFF0C\u4EE5\u53CA\u662F\u5426\u771F\u5B9E\u89E6\u53D1\u8FDE\u7206\u6216\u88AB\u7B56\u7565\u964D\u7EA7\u3002")}</div>
          <div class="st-rh-meta-value">${t.explodeInfoHtml}</div>

          ${e}
        </div>

        <div class="st-rh-result-main" style="--status-color:${t.statusColor};">
          <div class="st-rh-result-main-left">
            <div class="st-rh-result-kicker">\u7ED3\u679C</div>
          </div>
          <div class="st-rh-result-main-center">
            ${t.diceVisualBlockHtml}
          </div>
          <div class="st-rh-result-main-right">
            <div class="st-rh-result-kicker">\u7CFB\u7EDF\u5224\u5B9A</div>
            <div class="st-rh-meta-value st-rh-mono" style="margin-bottom:2px;">${C("\u6761\u4EF6","\u5C06\u603B\u503C\u4E0E DC \u6309\u6BD4\u8F83\u7B26\u5224\u5B9A\u6210\u529F\u6216\u5931\u8D25\u3002")}: ${t.compareHtml} ${t.dcText}</div>
            ${t.dcReasonHtml?`<div class="st-rh-meta-value" style="font-size:12px;color:#c8d6a1;line-height:1.45;">${C("DC \u539F\u56E0","\u7528\u4E8E\u89E3\u91CA\u8BE5\u4E8B\u4EF6\u96BE\u5EA6\uFF08DC\uFF09\u8BBE\u7F6E\u7684\u53D9\u4E8B\u4F9D\u636E\u3002")}: ${t.dcReasonHtml}</div>`:""}
            <div class="st-rh-result-status">[ ${t.statusText} ]</div>
          </div>
        </div>

        <div class="st-rh-outcome-box">
          <div class="st-rh-outcome-label">${t.outcomeLabelHtml}</div>
          <div class="st-rh-outcome-text">${t.outcomeTextHtml}</div>
          ${t.outcomeStatusSummaryHtml?`<div class="st-rh-outcome-status-change">\u72B6\u6001\u53D8\u5316\uFF1A${t.outcomeStatusSummaryHtml}</div>`:""}
        </div>
        ${t.statusImpactHtml?`<div style="margin-top:8px;padding:8px;border:1px dashed rgba(155,200,255,0.36);background:rgba(20,28,40,0.32);font-size:12px;line-height:1.5;color:#b8d8ff;border-radius:8px;">${t.statusImpactHtml}</div>`:""}
        ${t.currentStatusesHtml?`<div class="st-rh-outcome-status-current">\u5F53\u524D\u72B6\u6001\uFF1A${t.currentStatusesHtml}</div>`:""}

        <div class="st-rh-time-limit">
          \u65F6\u95F4\u9650\u5236: ${t.timeLimitHtml}
        </div>
      </div>
    </details>
  </div>`}function Pl(t,e){return`[${t}] <span style="color:#8c7b60;">|</span> \u4FEE\u6B63 ${e}`}function Ol(t){let e=t.modifierBreakdownHtml?`<div><span style="color:#8c7b60;" title="\u603B\u4FEE\u6B63 = \u57FA\u7840\u4FEE\u6B63 + \u6280\u80FD\u4FEE\u6B63 + \u72B6\u6001\u4FEE\u6B63\u3002">\u4FEE\u6B63:</span> <code style="font-size:11px;color:#ffdfa3;">${t.modifierBreakdownHtml}</code></div>`:"";return`
  <div class="st-rh-card-scope">
    ${dn()}
    <details class="st-rh-result-card st-rh-already-card st-rh-details-card st-rh-details-already">
      <summary class="st-rh-collapse-summary st-rh-collapse-summary-result">
        <div class="st-rh-summary-main">
          <div class="st-rh-collapse-title-row">
            <strong class="st-rh-summary-title">${t.eventTitleHtml}</strong>
            <span class="st-rh-summary-id st-rh-mono">${t.rollIdHtml}</span>
          </div>
          <div class="st-rh-summary-meta-row">
            <span class="st-rh-summary-pill" style="--rh-pill:${t.statusColor};">${t.collapsedStatusHtml}</span>
            <span class="st-rh-summary-chip">${t.collapsedSourceHtml}</span>
            <span class="st-rh-summary-chip st-rh-mono">${t.collapsedConditionHtml}</span>
          </div>
        </div>
        <div class="st-rh-summary-actions">
          ${t.collapsedDiceVisualHtml?`<span class="st-rh-summary-dice">${t.collapsedDiceVisualHtml}</span>`:""}
          ${rs()}
        </div>
      </summary>

      <div id="${t.detailsIdAttr}" class="st-rh-card-details-body st-rh-already-details">
        <div class="st-rh-result-head">
          <strong class="st-rh-result-heading">${t.titleTextHtml}</strong>
          <span class="st-rh-result-id">${t.rollIdHtml}</span>
        </div>

        <div class="st-rh-already-stack">
          <div class="st-rh-already-line"><span class="st-rh-already-label">\u4E8B\u4EF6:</span> <strong>${t.eventTitleHtml}</strong> <code class="st-rh-mono">(${t.eventIdHtml})</code></div>
          <div class="st-rh-already-line"><span class="st-rh-already-label">\u6765\u6E90:</span> ${t.sourceTextHtml}</div>
          <div class="st-rh-already-line"><span class="st-rh-already-label">\u5BF9\u8C61:</span> ${t.targetHtml}</div>
          <div class="st-rh-already-line"><span class="st-rh-already-label">\u9AB0\u6001:</span> ${t.advantageStateHtml}</div>
          <div class="st-rh-already-line"><span class="st-rh-already-label">\u7206\u9AB0:</span> ${t.explodeInfoHtml}</div>
          ${e?`<div class="st-rh-already-line">${e}</div>`:""}
          <div class="st-rh-already-line st-rh-already-line-condition">
            <span class="st-rh-already-label">\u6761\u4EF6:</span>
            <span class="st-rh-mono">${t.compareHtml} ${t.dcText}</span>
            <span class="st-rh-summary-pill" style="--rh-pill:${t.statusColor};">${t.statusText}</span>
          </div>
          ${t.dcReasonHtml?`<div class="st-rh-already-line st-rh-already-dc-reason">DC \u539F\u56E0: ${t.dcReasonHtml}</div>`:""}
        </div>

        ${t.diceVisualBlockHtml}
        ${t.distributionBlockHtml}

        <div class="st-rh-outcome-box">
          <div class="st-rh-outcome-label">${t.outcomeLabelHtml}</div>
          <div class="st-rh-outcome-text">${t.outcomeTextHtml}</div>
          ${t.outcomeStatusSummaryHtml?`<div class="st-rh-outcome-status-change">\u72B6\u6001\u53D8\u5316\uFF1A${t.outcomeStatusSummaryHtml}</div>`:""}
          ${t.currentStatusesHtml?`<div class="st-rh-outcome-status-current">\u5F53\u524D\u72B6\u6001\uFF1A${t.currentStatusesHtml}</div>`:""}
        </div>
        ${t.statusImpactHtml?`<div style="margin-top:6px;padding:8px;border:1px dashed rgba(155,200,255,0.36);background:rgba(20,28,40,0.32);font-size:12px;line-height:1.5;color:#b8d8ff;">${t.statusImpactHtml}</div>`:""}
        ${t.timeoutBlockHtml}
      </div>
    </details>
  </div>`}function Hl(t,e){return`
      <div style="font-size:11px;color:#6b5a45;margin-top:6px;text-align:center;background:rgba(0,0,0,0.3);padding:4px;border-radius:4px;">
        <span style="color:#8c7b60;">\u63B7\u9AB0:</span> [${t}] <span style="color:#8c7b60;margin:0 4px;">|</span> <span style="color:#8c7b60;">\u4FEE\u6B63</span> ${e}
      </div>
      `}function Bl(t){return`<div style="font-size:11px;color:#8c7b60;margin-top:6px;font-family:monospace;text-align:right;">\u8D85\u65F6\u7ED3\u7B97\u65F6\u95F4\uFF1A${t}</div>`}function Gl(t){let e=Math.max(0,Math.ceil(t/1e3)),n=Math.floor(e/3600),r=Math.floor(e%3600/60),s=e%60;return n>0?`${String(n).padStart(2,"0")}:${String(r).padStart(2,"0")}:${String(s).padStart(2,"0")}`:`${String(r).padStart(2,"0")}:${String(s).padStart(2,"0")}`}function Kl(t,e,n,r=Date.now()){let s=n.getSettingsEvent(),i=n.getLatestRollRecordForEvent(t,e.id);if(i)return i.source==="timeout_auto_fail"?{text:"\u5DF2\u8D85\u65F6\u5931\u8D25",tone:"danger",locked:!0}:i.success===!1?{text:"\u5DF2\u7ED3\u7B97(\u5931\u8D25)",tone:"danger",locked:!0}:{text:"\u5DF2\u7ED3\u7B97",tone:"success",locked:!0};if(!s.enableTimeLimit)return{text:"\u65F6\u9650\u5173\u95ED",tone:"neutral",locked:!1};n.ensureRoundEventTimersSyncedEvent(t);let o=t.eventTimers[e.id];if(!o||o.deadlineAt==null)return{text:"\u4E0D\u9650\u65F6",tone:"neutral",locked:!1};let l=o.deadlineAt-r;return l<=0?{text:"\u5DF2\u8D85\u65F6",tone:"danger",locked:!0}:l<=1e4?{text:`\u5269\u4F59 ${Gl(l)}`,tone:"warn",locked:!1}:{text:`\u5269\u4F59 ${Gl(l)}`,tone:"neutral",locked:!1}}function ss(t){switch(t){case"warn":return{border:"1px solid rgba(255,196,87,0.55)",background:"rgba(71,47,14,0.45)",color:"#ffd987"};case"danger":return{border:"1px solid rgba(255,120,120,0.55)",background:"rgba(80,20,20,0.45)",color:"#ffb6b6"};case"success":return{border:"1px solid rgba(136,255,173,0.55)",background:"rgba(18,54,36,0.45)",color:"#bfffd1"};default:return{border:"1px solid rgba(173,201,255,0.45)",background:"rgba(20,36,62,0.45)",color:"#d1e6ff"}}}function Oc(t,e,n){let r=Array.from(document.querySelectorAll("button[data-dice-event-roll='1']"));for(let s of r){let i=s.getAttribute("data-round-id")||"",o=s.getAttribute("data-dice-event-id")||"";i!==t||o!==e||(s.disabled=n,s.style.display=n?"none":"inline-block",s.style.opacity=n?"0.5":"1",s.style.cursor=n?"not-allowed":"pointer",s.style.filter=n?"grayscale(0.35)":"")}}function Fl(t){let e=Array.from(document.querySelectorAll("[data-dice-countdown='1']")),n=Array.from(document.querySelectorAll("button[data-dice-event-roll='1']"));if(e.length===0&&n.length===0)return;let s=t.getDiceMetaEvent().pendingRound;if(!s||s.status!=="open"){for(let o of n)o.disabled=!0,o.style.display="none",o.style.opacity="0.5",o.style.cursor="not-allowed",o.style.filter="grayscale(0.35)";return}t.ensureRoundEventTimersSyncedEvent(s);let i=Date.now();for(let o of e){let l=o.getAttribute("data-round-id")||"",a=o.getAttribute("data-event-id")||"";if(!l||!a||l!==s.roundId)continue;let d=s.events.find(E=>E.id===a);if(!d)continue;let c=t.getEventRuntimeViewStateEvent(s,d,i),u=t.getRuntimeToneStyleEvent(c.tone);o.textContent=`\u23F1 ${c.text}`,o.style.border=u.border,o.style.background=u.background,o.style.color=u.color,Oc(s.roundId,d.id,c.locked)}}function is(){try{let t=Array.from(document.querySelectorAll("pre"));for(let e of t){let n=(e.textContent||"").trim();!n||!(n.includes("dice_events")&&n.includes('"events"')&&n.includes('"type"'))||e.remove()}}catch(t){b.warn("\u9690\u85CF\u4E8B\u4EF6\u4EE3\u7801\u5757\u5931\u8D25",t)}}function Hc(t,e,n){if(!e.enableOutcomeBranches||!e.showOutcomePreviewInListCard)return"";let r=t.outcomes;if(!r||!!!(r.success?.trim()||r.failure?.trim()||r.explode?.trim()))return"";let i=dt(t.outcomes?.success?.trim()||"")||"\u672A\u8BBE\u7F6E",o=dt(t.outcomes?.failure?.trim()||"")||"\u672A\u8BBE\u7F6E",l=e.enableExplodeOutcomeBranch?dt(t.outcomes?.explode?.trim()||"")||"\u672A\u8BBE\u7F6E":"\u5DF2\u5173\u95ED";return`
    <style>
      .st-roll-preview-row {
        display:flex; margin-bottom:6px; align-items:flex-start; padding: 4px; border-radius: 4px; border-left: 2px solid transparent; transition: all 0.2s ease; cursor: default;
      }
      .st-roll-preview-row:hover {
        background-color: rgba(197, 160, 89, 0.1) !important;
        border-left: 2px solid rgba(197, 160, 89, 0.8) !important;
        box-shadow: inset 24px 0 24px -24px rgba(197, 160, 89, 0.3) !important;
      }
    </style>
    <div style="margin-top:8px; margin-bottom:12px; padding:12px; border:1px solid rgba(197,160,89,0.3); border-radius:6px; background:linear-gradient(135deg, rgba(30,30,30,0.6) 0%, rgba(15,15,15,0.8) 100%); font-size:12px; line-height:1.6; box-shadow:inset 0 1px 4px rgba(0,0,0,0.5);">
      <div style="margin-bottom:10px; font-weight:600; color:#d1b67f; font-size:11px; letter-spacing:1px; display:flex; align-items:center;">
        <span style="flex-grow:1; height:1px; background:linear-gradient(90deg, transparent, rgba(197,160,89,0.4)); margin-right:8px;"></span>
        \u8D70\u5411\u9884\u89C8
        <span style="margin-left:8px; flex-grow:1; height:1px; background:linear-gradient(270deg, transparent, rgba(197,160,89,0.4));"></span>
      </div>
      <div class="st-roll-preview-row">
        <span style="display:inline-block; padding:0 6px; margin-right:10px; background:rgba(82,196,26,0.15); border:1px solid rgba(82,196,26,0.4); border-radius:4px; color:#73d13d; font-size:10px; font-family:monospace; line-height:1.6; white-space:nowrap; user-select:none; box-shadow:0 0 4px rgba(82,196,26,0.1);">\u6210\u529F</span>
        <span style="color:#e0e0e0; flex:1; word-break:break-word;">${n(i)}</span>
      </div>
      <div class="st-roll-preview-row">
        <span style="display:inline-block; padding:0 6px; margin-right:10px; background:rgba(255,77,79,0.15); border:1px solid rgba(255,77,79,0.4); border-radius:4px; color:#ff7875; font-size:10px; font-family:monospace; line-height:1.6; white-space:nowrap; user-select:none; box-shadow:0 0 4px rgba(255,77,79,0.1);">\u5931\u8D25</span>
        <span style="color:#e0e0e0; flex:1; word-break:break-word;">${n(o)}</span>
      </div>
      <div class="st-roll-preview-row" style="margin-bottom:0;">
        <span style="display:inline-block; padding:0 6px; margin-right:10px; background:rgba(250,173,20,0.15); border:1px solid rgba(250,173,20,0.4); border-radius:4px; color:#ffc53d; font-size:10px; font-family:monospace; line-height:1.6; white-space:nowrap; user-select:none; box-shadow:0 0 4px rgba(250,173,20,0.1);">\u7206\u9AB0</span>
        <span style="color:#e0e0e0; flex:1; word-break:break-word;">${n(l)}</span>
      </div>
    </div>
  `}function zl(t){return t==="explode"?"\u7206\u9AB0\u8D70\u5411":t==="success"?"\u6210\u529F\u8D70\u5411":t==="failure"?"\u5931\u8D25\u8D70\u5411":"\u5267\u60C5\u8D70\u5411"}function os(t){return t==="advantage"?"\u4F18\u52BF":t==="disadvantage"?"\u52A3\u52BF":"\u6B63\u5E38"}function cn(t){let e=String(t??"").trim().toLowerCase().replace(/[^a-z0-9_-]+/g,"-").replace(/-+/g,"-").replace(/^-|-$/g,"");return e?e.slice(0,64):`id-${Math.abs(Array.from(String(t??"id")).reduce((r,s)=>r*31+s.charCodeAt(0)|0,7))}`}function Vl(t,e){let n=e.getSettingsEvent(),r=e.getDiceMetaEvent(),s=q(r);e.ensureRoundEventTimersSyncedEvent(t);let i=t.events.map(o=>{let l=o.compare??">=",a=e.getLatestRollRecordForEvent(t,o.id),d=e.getEventRuntimeViewStateEvent(t,o,Date.now()),c=e.getRuntimeToneStyleEvent(d.tone),u=e.escapeAttrEvent(`st-rh-event-${cn(t.roundId)}-${cn(o.id)}-details`),E=e.buildEventRolledPrefixTemplateEvent(a?.source==="timeout_auto_fail"),v=a?e.buildEventRolledBlockTemplateEvent(E,e.escapeHtmlEvent(e.formatRollRecordSummaryEvent(a,o))):"",m=Hc(o,n,e.escapeHtmlEvent),f=typeof o.deadlineAt=="number"&&Number.isFinite(o.deadlineAt)?String(o.deadlineAt):"",S=d.locked?"disabled":"",g=d.locked?"opacity:0.4;cursor:not-allowed;filter:grayscale(1);":"cursor:pointer;",_=!d.locked&&!a,h=n.enableTimeLimit?o.timeLimit?o.timeLimit:"\u65E0":"\u5173\u95ED",x=n.enableStatusSystem?Ft(s,o.skill):{modifier:0,matched:[]},T=a?Number.isFinite(Number(a.baseModifierUsed))?Number(a.baseModifierUsed):0:(()=>{try{return e.parseDiceExpression(o.checkDice).modifier}catch{return 0}})(),p=a?Number.isFinite(Number(a.skillModifierApplied))?Number(a.skillModifierApplied):0:e.resolveSkillModifierBySkillNameEvent(o.skill,n),I=a?Number.isFinite(Number(a.statusModifierApplied))?Number(a.statusModifierApplied):0:x.modifier,A=a?Array.isArray(a.statusModifiersApplied)?a.statusModifiersApplied:[]:x.matched,k=a&&Number.isFinite(Number(a.finalModifierUsed))?Number(a.finalModifierUsed):T+p+I,D=n.enableSkillSystem||I!==0?`${e.formatModifier(T)} + \u6280\u80FD ${e.formatModifier(p)} + \u72B6\u6001 ${e.formatModifier(I)} = ${e.formatModifier(k)}`:"",N=n.enableSkillSystem?`\u6280\u80FD\u4FEE\u6B63\uFF1A${e.formatModifier(p)}${I!==0?`\uFF1B\u72B6\u6001 ${e.formatModifier(I)}${A.length>0?`\uFF08${A.map(P=>`${P.name}${e.formatModifier(P.modifier)}`).join("\uFF0C")}\uFF09`:""}`:""}${D?`\uFF08${D}\uFF09`:""}`:"\u6280\u80FD\u7CFB\u7EDF\u5DF2\u5173\u95ED",M=os(a?.advantageStateApplied??o.advantageState),H=_?e.buildEventRollButtonTemplateEvent({roundIdAttr:e.escapeAttrEvent(t.roundId),eventIdAttr:e.escapeAttrEvent(o.id),diceExprAttr:e.escapeAttrEvent(o.checkDice),buttonDisabledAttr:S,buttonStateStyle:g}):"";return e.buildEventListItemTemplateEvent({detailsIdAttr:u,titleHtml:e.escapeHtmlEvent(o.title),eventIdHtml:e.escapeHtmlEvent(o.id),collapsedCheckHtml:e.escapeHtmlEvent(`${o.checkDice} ${l} ${String(o.dc)}`),collapsedRuntimeHtml:e.escapeHtmlEvent(d.text),descHtml:e.escapeHtmlEvent(o.desc),targetHtml:e.escapeHtmlEvent(o.targetLabel),skillHtml:e.escapeHtmlEvent(o.skill),skillTitleAttr:e.escapeAttrEvent(N),advantageStateHtml:e.escapeHtmlEvent(M),modifierTextHtml:e.escapeHtmlEvent(D),checkDiceHtml:e.escapeHtmlEvent(o.checkDice),compareHtml:e.escapeHtmlEvent(l),dcText:String(o.dc),dcReasonHtml:n.enableDynamicDcReason&&o.dcReason?e.escapeHtmlEvent(o.dcReason):"",timeLimitHtml:e.escapeHtmlEvent(h),roundIdAttr:e.escapeAttrEvent(t.roundId),eventIdAttr:e.escapeAttrEvent(o.id),deadlineAttr:e.escapeAttrEvent(f),runtimeTextHtml:e.escapeHtmlEvent(d.text),runtimeBorder:c.border,runtimeBackground:c.background,runtimeColor:c.color,rolledBlockHtml:v,outcomePreviewHtml:m,commandTextHtml:`/eventroll roll ${e.escapeHtmlEvent(o.id)}`,rollButtonHtml:H})}).join("");return e.buildEventListCardTemplateEvent(e.escapeHtmlEvent(t.roundId),i)}function Ul(t){return t.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;").replace(/`/g,"&#96;")}function qt(t){return t>0?`+${t}`:String(t)}function Bc(t,e){if(t==="all")return"\u5168\u5C40";let n=Array.isArray(e)?e.filter(r=>String(r||"").trim()):[];return n.length<=0?"\u5F53\u524D\u6280\u80FD":n.join(" / ")}function Yl(t,e){let n=$e(t,e);if(!Array.isArray(n.commands)||n.commands.length<=0)return"";let r=n.commands.filter(l=>l.kind==="apply").map(l=>`\u83B7\u5F97\u300C${l.name}\u300D${qt(l.modifier)}\uFF08${Bc(l.scope,l.skills)}\uFF0C${at(l.durationRounds)}\uFF09`),s=n.commands.filter(l=>l.kind==="remove").map(l=>`\u79FB\u9664\u300C${l.name}\u300D`),i=n.commands.some(l=>l.kind==="clear"),o=[...r,...s];return i&&o.push("\u6E05\u7A7A\u5168\u90E8\u72B6\u6001"),o.join("\uFF1B")}function jl(t){let e=Array.isArray(t)?t.filter(n=>n?.enabled!==!1):[];return e.length<=0?"\u65E0":e.map(n=>{let r=qt(Number(n.modifier)||0),s=n.scope==="all"?"\u5168\u5C40":Array.isArray(n.skills)&&n.skills.length>0?n.skills.join(" / "):"\u5F53\u524D\u6280\u80FD",i=at(n.remainingRounds);return`${n.name}${r}\uFF08${s}\uFF0C${i}\uFF09`}).join("\uFF1B")}function Xl(t,e,n,r){let s=Array.isArray(t.rolls)&&t.rolls.length>0?`[${t.rolls.join(", ")}]`:"[]",i=Number.isFinite(Number(t.rawTotal))?Number(t.rawTotal):0,o=Number.isFinite(Number(t.total))?Number(t.total):i,l=Number.isFinite(Number(n)),a=Number.isFinite(Number(e))?Number(e):Number(t.modifier)||0,d=l?Number(n):0,c=Number.isFinite(Number(r))?Number(r):l?a+d:Number(t.modifier)||0,u=[];return u.push(`\u9AB0\u9762 ${s}`),u.push(`\u539F\u59CB\u503C ${i}`),l?(u.push(`\u57FA\u7840\u4FEE\u6B63 ${qt(a)}`),u.push(`\u6280\u80FD\u4FEE\u6B63 ${qt(d)}`),u.push(`\u6700\u7EC8\u4FEE\u6B63 ${qt(c)}`)):u.push(`\u4FEE\u6B63 ${qt(Number(t.modifier)||0)}`),u.push(`\u603B\u8BA1 ${o}`),t.exploding&&u.push(t.explosionTriggered?"\u7206\u9AB0\u5DF2\u89E6\u53D1":"\u7206\u9AB0\u5DF2\u542F\u7528"),u.join(" | ")}function ls(t,e,n){let r=Math.max(40,Math.floor(n)),s=Math.max(14,Math.round(r*.34));return`
    <svg width="${r}" height="${r}" viewBox="0 0 48 48" style="display:inline-block; vertical-align: middle;">
      <rect x="4" y="4" width="40" height="40" rx="8" ry="8" fill="none" stroke="${e}" stroke-width="3" />
      <text x="24" y="31" font-size="${s}" text-anchor="middle" fill="${e}" font-weight="bold" style="font-family: monospace;">${t}</text>
    </svg>
  `}function ql(t,e,n=!1,r=""){if(!t||!Array.isArray(t.rolls)||t.rolls.length===0)return"";let s="d"+Math.random().toString(36).substr(2,9),i="normal",o="",l="#ffdb78";if(t.count===1){let S=t.rolls[0],g=t.sides;S===g?(i="success",o="\u5927\u6210\u529F\uFF01",l="#52c41a"):S===1&&(i="fail",o="\u5927\u5931\u8D25\uFF01",l="#ff4d4f")}let a=n?62:68,d=n?52:58,c=String(r||"").trim(),u=Number.isFinite(Number(t.total))?Number(t.total):0,E=ls(u,l,a),v=c?`<span style="display:inline-flex;cursor:help;" title="${Ul(`${c}`)}">${E}</span>`:E,m=e.getRollingSvg("#ffdb78",d),f=e.buildAlreadyRolledDiceVisualTemplateEvent({uniqueId:s,rollingVisualHtml:m,diceVisualsHtml:v,critType:i,critText:o,compactMode:n});return c?`<div style="display:inline-flex;align-items:center;justify-content:center;cursor:help;" title="${Ul(c)}">${f}</div>`:f}function Wl(t,e,n){let r=n.getSettingsEvent(),s=n.resolveTriggeredOutcomeEvent(t,e,r),i=r.enableOutcomeBranches?zl(s.kind):"\u5267\u60C5\u8D70\u5411",o=r.enableOutcomeBranches?s.text:"\u8D70\u5411\u5206\u652F\u5DF2\u5173\u95ED\u3002",l=dt(o),a=r.enableStatusSystem?Yl(o,t.skill):"",d=r.enableStatusSystem?jl(q(n.getDiceMetaEvent())):"",c=e.success===null?"\u5F85\u5B9A":e.success?"\u5224\u5B9A\u6210\u529F":"\u5224\u5B9A\u5931\u8D25",u=e.success===null?"#ffdb78":e.success?"#52c41a":"#ff4d4f",E=e.source==="timeout_auto_fail"?"\u8D85\u65F6\u81EA\u52A8\u68C0\u5B9A":e.source==="ai_auto_roll"?"AI \u81EA\u52A8\u68C0\u5B9A":"\u4E3B\u52A8\u68C0\u5B9A",v=Number.isFinite(Number(e.baseModifierUsed))?Number(e.baseModifierUsed):Number(e.result.modifier)||0,m=Number.isFinite(Number(e.skillModifierApplied))?Number(e.skillModifierApplied):0,f=Number.isFinite(Number(e.statusModifierApplied))?Number(e.statusModifierApplied):0,S=Number.isFinite(Number(e.finalModifierUsed))?Number(e.finalModifierUsed):v+m+f,g=Xl(e.result,v,m,S),_=e.source==="timeout_auto_fail"?"":ql(e.result,{getDiceSvg:n.getDiceSvg,getRollingSvg:n.getRollingSvg,buildAlreadyRolledDiceVisualTemplateEvent:n.buildAlreadyRolledDiceVisualTemplateEvent},!1,g),h=r.enableSkillSystem||f!==0?`${n.formatModifier(v)} + \u6280\u80FD ${n.formatModifier(m)} + \u72B6\u6001 ${n.formatModifier(f)} = ${n.formatModifier(S)}`:"",x=r.enableSkillSystem?`\u6280\u80FD\u4FEE\u6B63\uFF1A${n.formatModifier(m)}\uFF1B\u72B6\u6001 ${n.formatModifier(f)}${h?`\uFF08${h}\uFF09`:""}`:"\u6280\u80FD\u7CFB\u7EDF\u5DF2\u5173\u95ED",T=r.enableSkillSystem&&(m!==0||f!==0)?`\u6280\u80FD${n.formatModifier(m)} / \u72B6\u6001${n.formatModifier(f)}`:"",p="\u672A\u8BF7\u6C42\u7206\u9AB0";e.explodePolicyApplied==="disabled_globally"?p="\u5DF2\u8BF7\u6C42\uFF0C\u7CFB\u7EDF\u5173\u95ED\uFF0C\u6309\u666E\u901A\u9AB0":e.explodePolicyApplied==="downgraded_by_ai_limit"?p="\u5DF2\u8BF7\u6C42\uFF0C\u8D85\u51FA\u672C\u8F6E AI \u4E0A\u9650\uFF0C\u6309\u666E\u901A\u9AB0":(e.explodePolicyApplied==="enabled"||e.result.exploding)&&(p=e.result.explosionTriggered?"\u5DF2\u8BF7\u6C42\uFF0C\u5DF2\u89E6\u53D1\u8FDE\u7206":"\u5DF2\u8BF7\u6C42\uFF0C\u672A\u89E6\u53D1\u8FDE\u7206");let I=f!==0?`\u53D7\u72B6\u6001\u5F71\u54CD ${n.formatModifier(f)}${Array.isArray(e.statusModifiersApplied)&&e.statusModifiersApplied.length>0?`\uFF08${e.statusModifiersApplied.map(N=>`${N.name}${n.formatModifier(N.modifier)}`).join("\uFF0C")}\uFF09`:""}`:"",A=n.escapeAttrEvent(`st-rh-result-${cn(e.rollId)}-details`),k=`${e.compareUsed} ${String(e.dcUsed??"\u672A\u8BBE\u7F6E")}`,D=e.source==="timeout_auto_fail"?"":ls(Number.isFinite(Number(e.result.total))?Number(e.result.total):0,u,48);return n.buildEventRollResultCardTemplateEvent({detailsIdAttr:A,collapsedStatusHtml:n.escapeHtmlEvent(c),collapsedConditionHtml:n.escapeHtmlEvent(k),collapsedSourceHtml:n.escapeHtmlEvent(E),collapsedTotalHtml:n.escapeHtmlEvent(String(e.result.total)),collapsedDiceVisualHtml:D,rollIdHtml:n.escapeHtmlEvent(e.rollId),titleHtml:n.escapeHtmlEvent(t.title),eventIdHtml:n.escapeHtmlEvent(t.id),sourceHtml:n.escapeHtmlEvent(E),targetHtml:n.escapeHtmlEvent(e.targetLabelUsed||t.targetLabel),skillHtml:n.escapeHtmlEvent(t.skill),skillTitleAttr:n.escapeAttrEvent(x),advantageStateHtml:n.escapeHtmlEvent(os(e.advantageStateApplied??t.advantageState)),diceExprHtml:n.escapeHtmlEvent(e.diceExpr),diceModifierHintHtml:n.escapeHtmlEvent(T),rollsSummaryHtml:n.buildRollsSummaryTemplateEvent(n.escapeHtmlEvent(e.result.rolls.join(", ")),n.escapeHtmlEvent(n.formatModifier(e.result.modifier))),explodeInfoHtml:n.escapeHtmlEvent(p),modifierBreakdownHtml:n.escapeHtmlEvent(h),compareHtml:n.escapeHtmlEvent(e.compareUsed),dcText:String(e.dcUsed??"\u672A\u8BBE\u7F6E"),dcReasonHtml:r.enableDynamicDcReason&&t.dcReason?n.escapeHtmlEvent(t.dcReason):"",statusText:c,statusColor:u,totalText:String(e.result.total),timeLimitHtml:n.escapeHtmlEvent(t.timeLimit??"\u65E0"),diceVisualBlockHtml:_,outcomeLabelHtml:n.escapeHtmlEvent(i),outcomeTextHtml:n.escapeHtmlEvent(l),statusImpactHtml:n.escapeHtmlEvent(I),outcomeStatusSummaryHtml:n.escapeHtmlEvent(a),currentStatusesHtml:n.escapeHtmlEvent(d)})}function Jl(t,e,n){let r=n.getSettingsEvent(),s=n.resolveTriggeredOutcomeEvent(t,e,r),i=r.enableOutcomeBranches?zl(s.kind):"\u5267\u60C5\u8D70\u5411",o=r.enableOutcomeBranches?s.text:"\u8D70\u5411\u5206\u652F\u5DF2\u5173\u95ED\u3002",l=dt(o),a=r.enableStatusSystem?Yl(o,t.skill):"",d=r.enableStatusSystem?jl(q(n.getDiceMetaEvent())):"",c=e.source==="timeout_auto_fail",u=c?"[\u8D85\u65F6] \u4E8B\u4EF6\u5DF2\u7ED3\u675F":"[\u5B8C\u6210] \u68C0\u5B9A\u5DF2\u7ED3\u7B97",E=c?"\u7CFB\u7EDF\u5F3A\u5236\u7ED3\u7B97":e.source==="ai_auto_roll"?"AI \u81EA\u52A8\u68C0\u5B9A":"\u73A9\u5BB6\u4E3B\u52A8\u68C0\u5B9A",v=e.success===null?"\u672A\u51B3":e.success?"\u6210\u529F":"\u5931\u8D25",m=e.success===null?"#a3957a":e.success?"#52c41a":"#ff4d4f",f=Number.isFinite(Number(e.baseModifierUsed))?Number(e.baseModifierUsed):Number(e.result.modifier)||0,S=Number.isFinite(Number(e.skillModifierApplied))?Number(e.skillModifierApplied):0,g=Number.isFinite(Number(e.statusModifierApplied))?Number(e.statusModifierApplied):0,_=Number.isFinite(Number(e.finalModifierUsed))?Number(e.finalModifierUsed):f+S+g,h=Xl(e.result,f,S,_),x=c?"":ql(e.result,{getDiceSvg:n.getDiceSvg,getRollingSvg:n.getRollingSvg,buildAlreadyRolledDiceVisualTemplateEvent:n.buildAlreadyRolledDiceVisualTemplateEvent},!1,h),T=r.enableSkillSystem||g!==0?`${n.formatModifier(f)} + \u6280\u80FD ${n.formatModifier(S)} + \u72B6\u6001 ${n.formatModifier(g)} = ${n.formatModifier(_)}`:"",p="\u672A\u8BF7\u6C42\u7206\u9AB0";e.explodePolicyApplied==="disabled_globally"?p="\u5DF2\u8BF7\u6C42\uFF0C\u7CFB\u7EDF\u5173\u95ED\uFF0C\u6309\u666E\u901A\u9AB0":e.explodePolicyApplied==="downgraded_by_ai_limit"?p="\u5DF2\u8BF7\u6C42\uFF0C\u8D85\u51FA\u672C\u8F6E AI \u4E0A\u9650\uFF0C\u6309\u666E\u901A\u9AB0":(e.explodePolicyApplied==="enabled"||e.result.exploding)&&(p=e.result.explosionTriggered?"\u5DF2\u8BF7\u6C42\uFF0C\u5DF2\u89E6\u53D1\u8FDE\u7206":"\u5DF2\u8BF7\u6C42\uFF0C\u672A\u89E6\u53D1\u8FDE\u7206");let I=g!==0?`\u53D7\u72B6\u6001\u5F71\u54CD ${n.formatModifier(g)}${Array.isArray(e.statusModifiersApplied)&&e.statusModifiersApplied.length>0?`\uFF08${e.statusModifiersApplied.map(H=>`${H.name}${n.formatModifier(H.modifier)}`).join("\uFF0C")}\uFF09`:""}`:"",A=!c&&e.result?n.buildEventDistributionBlockTemplateEvent(n.escapeHtmlEvent(e.result.rolls.join(", ")),n.escapeHtmlEvent(n.formatModifier(e.result.modifier))):"",k=e.timeoutAt?n.buildEventTimeoutAtBlockTemplateEvent(n.escapeHtmlEvent(new Date(e.timeoutAt).toISOString())):"",D=n.escapeAttrEvent(`st-rh-already-${cn(e.rollId)}-details`),N=`${e.compareUsed} ${String(e.dcUsed??"\u672A\u8BBE\u7F6E")}`,M=c?"":ls(Number.isFinite(Number(e.result.total))?Number(e.result.total):0,m,40);return n.buildEventAlreadyRolledCardTemplateEvent({detailsIdAttr:D,collapsedStatusHtml:n.escapeHtmlEvent(v),collapsedConditionHtml:n.escapeHtmlEvent(N),collapsedSourceHtml:n.escapeHtmlEvent(E),collapsedDiceVisualHtml:M,titleTextHtml:u,rollIdHtml:n.escapeHtmlEvent(e.rollId),eventTitleHtml:n.escapeHtmlEvent(t.title),eventIdHtml:n.escapeHtmlEvent(t.id),sourceTextHtml:n.escapeHtmlEvent(E),targetHtml:n.escapeHtmlEvent(e.targetLabelUsed||t.targetLabel),advantageStateHtml:n.escapeHtmlEvent(os(e.advantageStateApplied??t.advantageState)),explodeInfoHtml:n.escapeHtmlEvent(p),modifierBreakdownHtml:n.escapeHtmlEvent(T),compareHtml:n.escapeHtmlEvent(e.compareUsed),dcText:String(e.dcUsed??"\u672A\u8BBE\u7F6E"),dcReasonHtml:r.enableDynamicDcReason&&t.dcReason?n.escapeHtmlEvent(t.dcReason):"",statusText:v,statusColor:m,diceVisualBlockHtml:x,distributionBlockHtml:A,outcomeLabelHtml:n.escapeHtmlEvent(i),outcomeTextHtml:n.escapeHtmlEvent(l),statusImpactHtml:n.escapeHtmlEvent(I),outcomeStatusSummaryHtml:n.escapeHtmlEvent(a),currentStatusesHtml:n.escapeHtmlEvent(d),timeoutBlockHtml:k})}var Gc={getSettingsEvent:R,getDiceMetaEvent:L,ensureRoundEventTimersSyncedEvent:it,getLatestRollRecordForEvent:st,getEventRuntimeViewStateEvent:un,getRuntimeToneStyleEvent:ss,buildEventRolledPrefixTemplateEvent:Ml,buildEventRolledBlockTemplateEvent:Ll,formatRollRecordSummaryEvent:Al,parseDiceExpression:W,resolveSkillModifierBySkillNameEvent:kt,formatEventModifierBreakdownEvent:Kt,formatModifier:X,buildEventRollButtonTemplateEvent:Nl,buildEventListItemTemplateEvent:wl,buildEventListCardTemplateEvent:Cl,escapeHtmlEvent:rt,escapeAttrEvent:ie};function un(t,e,n=Date.now()){return Kl(t,e,{getSettingsEvent:R,getLatestRollRecordForEvent:st,ensureRoundEventTimersSyncedEvent:it},n)}function Ql(t){return Vl(t,{...Gc})}function Zl(t,e){return Wl(t,e,{getSettingsEvent:R,getDiceMetaEvent:L,resolveTriggeredOutcomeEvent:Xt,formatEventModifierBreakdownEvent:Kt,buildRollsSummaryTemplateEvent:Pl,formatModifier:X,buildEventRollResultCardTemplateEvent:$l,escapeHtmlEvent:rt,escapeAttrEvent:ie,getDiceSvg:Se,getRollingSvg:nn,buildAlreadyRolledDiceVisualTemplateEvent:Hr})}function ta(t,e){return Jl(t,e,{getSettingsEvent:R,getDiceMetaEvent:L,resolveTriggeredOutcomeEvent:Xt,formatEventModifierBreakdownEvent:Kt,buildEventDistributionBlockTemplateEvent:Hl,buildEventTimeoutAtBlockTemplateEvent:Bl,buildEventAlreadyRolledCardTemplateEvent:Ol,escapeHtmlEvent:rt,formatModifier:X,getDiceSvg:Se,getRollingSvg:nn,buildAlreadyRolledDiceVisualTemplateEvent:Hr})}function $t(){Fl({getDiceMetaEvent:L,ensureRoundEventTimersSyncedEvent:it,getEventRuntimeViewStateEvent:un,getRuntimeToneStyleEvent:ss})}var ea="st-roll-shared-tooltip-style",Pt="st-roll-shared-tooltip";var Wt=null,It=null,En=null,vn=null,et=null;function na(t,e,n){return t<e?e:t>n?n:t}function Jt(t){if(!(t instanceof HTMLElement))return null;let e=t.closest("[data-tip]");if(e&&String(e.dataset.tip??"").trim())return e;let n=t.closest("[title]");if(!n||!!!n.closest(".st-rh-card-scope"))return null;let s=String(n.getAttribute("title")??"").trim();return s?(n.dataset.tip=s,n.removeAttribute("title"),n.classList.contains("st-rh-tip")||n.classList.add("st-rh-tip"),n):null}function Uc(){if(document.getElementById(ea))return;let t=document.createElement("style");t.id=ea,t.textContent=`
    #${Pt} {
      position: fixed;
      left: 0;
      top: 0;
      z-index: 40000;
      opacity: 0;
      pointer-events: none;
      visibility: hidden;
      transition:
        opacity 0.16s ease,
        transform 0.2s cubic-bezier(0.22, 1, 0.36, 1),
        visibility 0s linear 0.16s;
      transform: translate3d(-9999px, -9999px, 0);
      will-change: transform, opacity;
    }
    #${Pt}.is-visible {
      opacity: 1;
      visibility: visible;
      transition:
        opacity 0.16s ease,
        transform 0.2s cubic-bezier(0.22, 1, 0.36, 1),
        visibility 0s;
    }
    #${Pt}.is-instant {
      transition: none !important;
    }
    #${Pt} .st-rh-global-tooltip-body {
      max-width: min(78vw, 320px);
      min-width: 72px;
      padding: 8px 10px;
      border: 1px solid rgba(197, 160, 89, 0.55);
      border-radius: 8px;
      background: rgba(12, 8, 6, 0.96);
      color: #ecdcb8;
      font-size: 12px;
      line-height: 1.5;
      text-align: center;
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.45);
      white-space: normal;
    }
    html body .st-rh-tip::before,
    html body .st-rh-tip::after,
    html body .st-rh-ss-tip::before,
    html body .st-rh-ss-tip::after,
    html body [data-tip]::before,
    html body [data-tip]::after,
    html body [data-tip]:hover::before,
    html body [data-tip]:hover::after,
    html body [data-tip]:focus::before,
    html body [data-tip]:focus::after,
    html body [data-tip]:focus-visible::before,
    html body [data-tip]:focus-visible::after {
      content: none !important;
      display: none !important;
      visibility: hidden !important;
      opacity: 0 !important;
      pointer-events: none !important;
    }
    @media (prefers-reduced-motion: reduce) {
      #${Pt} {
        transition: none;
      }
    }
  `,document.head.appendChild(t)}function gn(){if(Wt)return Wt;Uc();let t=document.getElementById(Pt);if(t){let r=t.querySelector(".st-rh-global-tooltip-body");if(r)return Wt={root:t,body:r},Wt;t.remove()}let e=document.createElement("div");e.id=Pt;let n=document.createElement("div");return n.className="st-rh-global-tooltip-body",e.appendChild(n),document.body.appendChild(e),Wt={root:e,body:n},Wt}function ia(){et!==null&&(clearTimeout(et),et=null),gn().root.classList.remove("is-visible"),It=null}function ra(){et!==null&&(clearTimeout(et),et=null),et=window.setTimeout(()=>{et=null,ia()},90)}function mn(){if(!It)return;let t=gn(),e=It.getBoundingClientRect(),n=e.left+e.width/2,r=e.top-8;t.root.classList.add("is-visible");let s=Math.max(80,t.root.offsetWidth),i=Math.max(32,t.root.offsetHeight),o=8,l=na(n-s/2,o,window.innerWidth-s-o),a=r-i,d=!1;a<o&&(d=!0,a=na(e.bottom+10,o,window.innerHeight-i-o)),t.root.classList.toggle("is-below",d),t.root.style.transform=`translate3d(${Math.round(l)}px, ${Math.round(a)}px, 0)`}function sa(t){let e=String(t.dataset.tip??"").trim();if(!e){ia();return}et!==null&&(clearTimeout(et),et=null);let n=gn(),r=t.getBoundingClientRect(),s=r.left+r.width/2,i=r.top+r.height/2,o=n.root.classList.contains("is-visible"),a=En!==null&&vn!==null?Math.hypot(s-En,i-vn):0,d=!o||a>=260;if(It=t,n.body.textContent=e,d){n.root.classList.add("is-instant"),mn(),requestAnimationFrame(()=>{n.root.classList.remove("is-instant")}),En=s,vn=i;return}mn(),En=s,vn=i}function oa(){let t=globalThis;t.__stRollSharedTooltipBoundEvent||(gn(),document.addEventListener("pointerover",e=>{let n=Jt(e.target);n&&sa(n)},!0),document.addEventListener("pointerout",e=>{let n=Jt(e.target);!n||Jt(e.relatedTarget??null)||It===n&&ra()},!0),document.addEventListener("focusin",e=>{let n=Jt(e.target);n&&sa(n)},!0),document.addEventListener("focusout",e=>{let n=Jt(e.target);!n||Jt(e.relatedTarget??null)||It===n&&ra()},!0),window.addEventListener("scroll",()=>{It&&mn()},!0),window.addEventListener("resize",()=>{It&&mn()}),t.__stRollSharedTooltipBoundEvent=!0)}function pn(t=0,e){let n=e.getSettingsEvent();if(!n.enabled)return;let r=e.getLiveContextEvent();if(!r?.chat||!Array.isArray(r.chat))return;let s=e.findLatestAssistantEvent(r.chat);if(!s)return;let i=e.getDiceMetaEvent(),o=e.buildAssistantMessageIdEvent(s.msg,s.index);if(i.lastProcessedAssistantMsgId===o)return;let l=[e.getPreferredAssistantSourceTextEvent(s.msg),e.getMessageTextEvent(s.msg)].filter((g,_,h)=>g&&h.indexOf(g)===_),a="",d=[],c=[],u=!1;for(let g of l){let _=e.parseEventEnvelopesEvent(g);if(_.events.length>0||_.ranges.length>0){a=g,d=_.events,c=_.ranges,u=_.shouldEndRound;break}a||(a=g,d=_.events,c=_.ranges,u=_.shouldEndRound)}if(!a.trim()){if(t<4){setTimeout(()=>pn(t+1,e),100+t*120);return}i.lastProcessedAssistantMsgId=o,e.saveMetadataSafeEvent();return}let E=e.filterEventsByApplyScopeEvent(d,n.eventApplyScope),v=c;if(E.length===0&&v.length===0){if(t<4){setTimeout(()=>pn(t+1,e),140+t*160);return}i.lastProcessedAssistantMsgId=o,e.saveMetadataSafeEvent();return}i.lastProcessedAssistantMsgId=o;let m=e.removeRangesEvent(a,v);e.setMessageTextEvent(s.msg,m),e.hideEventCodeBlocksInDomEvent(),v.length>0&&e.persistChatSafeEvent();let f=!1,S=i.pendingRound;if(S?.status==="open"&&n.enableAiRoundControl&&u&&(S.status="closed",f=!0,b.info("AI \u6307\u4EE4\u7ED3\u675F\u5F53\u524D\u8F6E\u6B21\uFF08round_control=end_round\uFF09")),E.length>0){let g=e.mergeEventsIntoPendingRoundEvent(E,o),_=e.autoRollEventsByAiModeEvent(g),h=e.buildEventListCardEvent(g);e.pushToChat(h);for(let x of _)e.pushToChat(x);e.sweepTimeoutFailuresEvent(),e.refreshCountdownDomEvent()}else d.length>0&&n.eventApplyScope==="protagonist_only"&&b.info("\u4E8B\u4EF6\u5DF2\u6309\u201C\u4EC5\u4E3B\u89D2\u884C\u52A8\u4E8B\u4EF6\u201D\u8FC7\u6EE4\uFF0C\u672C\u6B21\u65E0\u53EF\u7528\u4E8B\u4EF6"),f&&b.info("\u5F53\u524D\u8F6E\u6B21\u5DF2\u7ED3\u675F\uFF0C\u7B49\u5F85\u4E0B\u4E00\u8F6E\u4E8B\u4EF6"),e.saveMetadataSafeEvent();setTimeout(()=>{e.hideEventCodeBlocksInDomEvent(),e.refreshCountdownDomEvent()},50)}function da(t,e){for(let n=t.length-1;n>=0;n--)if(e.isAssistantMessageEvent(t[n]))return{msg:t[n],index:n};return null}function ca(t,e,n){let r=t.id??t.cid??t.uid,s=n.simpleHashEvent(n.getMessageTextEvent(t));return r!=null?`assistant:${String(r)}:${s}`:`assistant_idx:${e}:${s}`}function ua(t,e){let n=[e.getPreferredAssistantSourceTextEvent(t),e.getMessageTextEvent(t)].filter((r,s,i)=>r&&i.indexOf(r)===s);for(let r of n){let{ranges:s}=e.parseEventEnvelopesEvent(r);if(s.length===0)continue;let i=e.removeRangesEvent(r,s);return e.setMessageTextEvent(t,i),!0}return!1}function Ea(t){let e=t.getLiveContextEvent();if(!e?.chat||!Array.isArray(e.chat))return;let n=!1;for(let r of e.chat)t.isAssistantMessageEvent(r)&&t.sanitizeAssistantMessageEventBlocksEvent(r)&&(n=!0);n&&t.persistChatSafeEvent(),t.hideEventCodeBlocksInDomEvent()}function va(t="chat_reset",e){let n=e.getDiceMetaEvent();if(String(t||"").toLowerCase()!=="chat_reset"){delete n.lastProcessedAssistantMsgId,e.saveMetadataSafeEvent(),b.info(`\u4FDD\u7559 Event \u8F6E\u6B21\u72B6\u6001\uFF0C\u4EC5\u91CD\u7F6E\u4F1A\u8BDD\u6E38\u6807 (${t})`);return}delete n.pendingRound,delete n.outboundSummary,delete n.pendingResultGuidanceQueue,delete n.outboundResultGuidance,delete n.summaryHistory,delete n.lastPromptUserMsgId,delete n.lastProcessedAssistantMsgId,e.saveMetadataSafeEvent(),b.info(`\u5DF2\u6E05\u7406 Event \u8F6E\u6B21\u72B6\u6001 (${t})`)}function Sn(t){return String(t??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}function Kc(t){try{let e=JSON.parse(String(t??"{}"));return!e||typeof e!="object"||Array.isArray(e)?[]:Object.entries(e).map(([n,r])=>({name:String(n??"").trim(),modifier:Number(r)})).filter(n=>n.name&&Number.isFinite(n.modifier)).sort((n,r)=>Math.abs(r.modifier)-Math.abs(n.modifier)||n.name.localeCompare(r.name,"zh-Hans-CN"))}catch{return[]}}var $="SSHELPERTOOL",la="st-roll-sshelper-toolbar-style",fn="is-collapsed",aa="2",Fc=60,zc=500,ma="\u5C55\u5F00\u5DE5\u5177\u680F",Vc="\u6536\u8D77\u5DE5\u5177\u680F",Yc="\u6280\u80FD\u9884\u89C8",jc="\u72B6\u6001\u9884\u89C8",ga="\u5C55\u5F00 SSHELPER \u5DE5\u5177\u680F",Xc="\u6536\u8D77 SSHELPER \u5DE5\u5177\u680F",qc="\u6253\u5F00\u6280\u80FD\u9884\u89C8",Wc="\u6253\u5F00\u72B6\u6001\u9884\u89C8";function Jc(){return`
    <div class="st-rh-ss-toolbar-shell" data-sshelper-toolbar-shell="1">
      <span class="st-rh-tip st-rh-ss-tip" data-tip="${ma}">
        <button
          type="button"
          class="st-rh-ss-toggle"
          data-sshelper-tool-toggle="1"
          aria-expanded="false"
          aria-label="${ga}"
        ><i class="fa-solid fa-angles-right" aria-hidden="true"></i></button>
      </span>
      <div class="st-rh-ss-actions" data-sshelper-tool-actions="1">
        <span class="st-rh-tip st-rh-ss-tip" data-tip="${Yc}">
          <button
            type="button"
            class="st-rh-ss-preview-btn"
            data-event-preview-open="skills"
            aria-label="${qc}"
          ><i class="fa-solid fa-wand-magic-sparkles" aria-hidden="true"></i></button>
        </span>
        <span class="st-rh-tip st-rh-ss-tip" data-tip="${jc}">
          <button
            type="button"
            class="st-rh-ss-preview-btn"
            data-event-preview-open="statuses"
            aria-label="${Wc}"
          ><i class="fa-solid fa-heart-pulse" aria-hidden="true"></i></button>
        </span>
      </div>
    </div>
  `}function Qc(){if(document.getElementById(la))return;let t=document.createElement("style");t.id=la,t.textContent=`
    #${$} {
      width: auto;
      display: flex;
      align-items: center;
      justify-content: flex-start;
      margin: 0;
      padding: 6px 8px;
      box-sizing: border-box;
      border: 1px solid var(--SmartThemeBorderColor, rgba(197, 160, 89, 0.35));
      border-radius: 12px;
      background-color: var(--SmartThemeBlurTintColor, rgba(20, 16, 14, 0.82));
      backdrop-filter: blur(var(--SmartThemeBlurStrength, 8px));
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
    #${$}.${fn} {
      padding: 0;
      border-color: transparent;
      background-color: transparent;
      box-shadow: none;
      backdrop-filter: none;
    }
    #${$} .st-rh-ss-toolbar-shell {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      max-width: min(100%, 480px);
      padding: 2px 0;
    }
    #${$} .st-rh-ss-tip {
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    #${$} .st-rh-ss-toggle {
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
    #${$} .st-rh-ss-toggle:hover {
      border-color: #efd392;
      filter: brightness(1.08);
    }
    #${$} .st-rh-ss-actions {
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
    #${$}.${fn} .st-rh-ss-actions {
      max-width: 0;
      opacity: 0;
      transform: translateX(-18px);
      pointer-events: none;
      visibility: hidden;
    }
    #${$} .st-rh-ss-preview-btn {
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
    #${$} .st-rh-ss-preview-btn:hover {
      border-color: #efd392;
      filter: brightness(1.08);
    }
    @media (max-width: 768px) {
      #${$} {
        left: 6px;
        bottom: calc(100% + 6px);
        padding: 5px 6px;
      }
      #${$} .st-rh-ss-toolbar-shell {
        max-width: 100%;
      }
      #${$} .st-rh-ss-preview-btn {
        width: 28px;
        height: 28px;
        font-size: 12px;
      }
    }
    @media (prefers-reduced-motion: reduce) {
      #${$} .st-rh-ss-actions,
      #${$} .st-rh-ss-toggle,
      #${$} .st-rh-ss-preview-btn {
        transition: none;
      }
    }
  `,document.head.appendChild(t)}function Sa(t,e){t.classList.toggle(fn,!e);let n=t.querySelector('button[data-sshelper-tool-toggle="1"]');if(!n)return;let r=n.closest(".st-rh-ss-tip");n.setAttribute("aria-expanded",e?"true":"false"),n.setAttribute("aria-label",e?Xc:ga),n.innerHTML=e?'<i class="fa-solid fa-angles-left" aria-hidden="true"></i>':'<i class="fa-solid fa-angles-right" aria-hidden="true"></i>',r&&(r.dataset.tip=e?Vc:ma)}function Zc(t){let e=t.querySelector('[data-sshelper-toolbar-shell="1"]'),n=!!t.querySelector('button[data-event-preview-open="skills"]'),r=!!t.querySelector('button[data-event-preview-open="statuses"]'),s=!!t.querySelector(".st-rh-ss-tip[data-tip]");(!e||!n||!r||!s||t.dataset.sshelperToolbarMarkupVersion!==aa)&&(t.innerHTML=Jc(),t.dataset.sshelperToolbarMarkupVersion=aa,delete t.dataset.sshelperToolbarInitialized),t.dataset.sshelperToolbarInitialized!=="1"&&(Sa(t,!1),t.dataset.sshelperToolbarInitialized="1")}function tu(t){t>Fc||setTimeout(()=>{pa(t)},zc)}function pa(t=0){Qc();let e=document.getElementById($);e||(e=document.createElement("div"),e.id=$),Zc(e);let r=document.querySelector("#send_form.compact")||document.getElementById("send_form");return!r||!r.parentElement?(tu(t+1),e):(window.getComputedStyle(r).position==="static"&&(r.style.position="relative"),e.parentElement!==r&&r.appendChild(e),e)}function eu(){if(document.getElementById("st-roll-event-preview-style"))return;let t=document.createElement("style");t.id="st-roll-event-preview-style",t.textContent=`
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
  `,document.head.appendChild(t)}function fa(){let t=document.getElementById("st-roll-event-preview-dialog");if(t)return t;eu();let e=document.createElement("dialog");return e.id="st-roll-event-preview-dialog",e.className="st-rh-preview-dialog",e.innerHTML=`
    <div class="st-rh-preview-wrap">
      <div class="st-rh-preview-head">
        <div class="st-rh-preview-title" data-preview-title="1"></div>
        <button type="button" class="st-rh-preview-btn secondary" data-preview-close="1">\u5173\u95ED</button>
      </div>
      <div class="st-rh-preview-body" data-preview-body="1"></div>
    </div>
  `,e.addEventListener("cancel",n=>{n.preventDefault(),e.close()}),document.body.appendChild(e),e}function nu(t){let e=Kc(t);return e.length<=0?'<div class="st-rh-preview-empty">\u5F53\u524D\u4E3B\u89D2\u6280\u80FD\u4E3A\u7A7A\u3002</div>':`<ul class="st-rh-preview-list">${e.map(n=>`<li class="st-rh-preview-item"><strong>${Sn(n.name)}</strong>\uFF1A${n.modifier>=0?`+${n.modifier}`:n.modifier}</li>`).join("")}</ul>`}function ru(t){let e=Array.isArray(t.activeStatuses)?t.activeStatuses.filter(n=>n?.enabled!==!1):[];return e.length<=0?'<div class="st-rh-preview-empty">\u5F53\u524D\u6CA1\u6709\u751F\u6548\u72B6\u6001\u3002</div>':`<ul class="st-rh-preview-list">${e.map(n=>{let r=n.scope==="all"?"\u5168\u5C40":Array.isArray(n.skills)&&n.skills.length>0?n.skills.join("|"):"\u5F53\u524D\u6280\u80FD",s=at(n.remainingRounds),i=Number(n.modifier)||0;return`<li class="st-rh-preview-item"><strong>${Sn(n.name)}</strong>\uFF1A${i>=0?`+${i}`:i} \uFF5C \u8303\u56F4=${Sn(r)} \uFF5C ${Sn(s)}</li>`}).join("")}</ul>`}function su(t,e){let n=fa(),r=n.querySelector('[data-preview-title="1"]'),s=n.querySelector('[data-preview-body="1"]');if(!r||!s)return;let i=e.getSettingsEvent();if(t==="skills"?(r.textContent="\u6280\u80FD\u9884\u89C8\uFF08\u5F53\u524D\u4E3B\u89D2\uFF09",s.innerHTML=i.enableSkillSystem===!1?'<div class="st-rh-preview-empty">\u6280\u80FD\u7CFB\u7EDF\u5DF2\u5173\u95ED\u3002</div>':nu(String(i.skillTableText??"{}"))):(r.textContent="\u72B6\u6001\u9884\u89C8\uFF08\u5F53\u524D\u751F\u6548\uFF09",s.innerHTML=ru(e.getDiceMetaEvent())),!n.open)try{n.showModal()}catch{n.setAttribute("open","")}}function Ta(t){let e=globalThis;oa(),pa(),!e.__stRollEventButtonsBoundEvent&&(document.addEventListener("click",n=>{let r=n.target;if(!r)return;let s=r.closest('button[data-sshelper-tool-toggle="1"]');if(s){n.preventDefault(),n.stopPropagation();let v=s.closest(`#${$}`);if(v){let m=!v.classList.contains(fn);Sa(v,!m)}return}let i=r.closest("button[data-event-preview-open]");if(i){n.preventDefault(),n.stopPropagation();let v=String(i.dataset.eventPreviewOpen??"").toLowerCase();(v==="skills"||v==="statuses")&&su(v,t);return}if(r.closest('button[data-preview-close="1"]')){n.preventDefault();let v=fa();v.open&&v.close();return}let l=r.closest("button[data-rh-collapse-toggle='1']");if(l){n.preventDefault(),n.stopPropagation();let v=l.closest("[data-rh-collapsible-card='1']");if(!v)return;let f=v.classList.contains("is-collapsed");v.classList.toggle("is-collapsed",!f),l.setAttribute("aria-expanded",f?"true":"false");let S=l.dataset.labelExpand||"\u5C55\u5F00\u8BE6\u60C5",g=l.dataset.labelCollapse||"\u6536\u8D77\u8BE6\u60C5",_=l.querySelector("[data-rh-collapse-label='1']");_&&(_.textContent=f?g:S);return}let a=r.closest("button[data-dice-event-roll='1']");if(!a)return;n.preventDefault(),n.stopPropagation();let d=a.getAttribute("data-dice-event-id")||"",c=a.getAttribute("data-dice-expr")||"",u=a.getAttribute("data-round-id")||"",E=t.performEventRollByIdEvent(d,c||void 0,u||void 0);E&&t.pushToChat(E)},!0),e.__stRollEventButtonsBoundEvent=!0)}function _a(t){let e=globalThis;e.__stRollEventCountdownTicker||(e.__stRollEventCountdownTicker=setInterval(()=>{try{t.sweepTimeoutFailuresEvent(),t.refreshCountdownDomEvent()}catch(n){b.warn("\u5012\u8BA1\u65F6\u5237\u65B0\u5F02\u5E38",n)}},1e3))}function ba(t){let e=globalThis;if(e.__stRollEventHooksRegisteredEvent)return;let n=t.getLiveContextEvent(),r=n?.eventSource??t.eventSource,s=n?.event_types??t.event_types??{};if(!r?.on)return;t.loadChatScopedStateIntoRuntimeEvent("hook_register_init").catch(d=>{b.warn("\u804A\u5929\u7EA7\u72B6\u6001\u521D\u59CB\u5316\u88C5\u8F7D\u5931\u8D25",d)});let i=Array.from(new Set([s.CHAT_COMPLETION_PROMPT_READY,"chat_completion_prompt_ready"].filter(d=>typeof d=="string"&&d.length>0)));b.info(`prompt \u6CE8\u5165\u76D1\u542C\u4E8B\u4EF6: ${i.length>0?i.join(", "):"(none)"}`);let o=typeof r.makeLast=="function"?r.makeLast.bind(r):r.on.bind(r),l=Array.from(new Set([s.GENERATION_ENDED,"generation_ended"].filter(d=>typeof d=="string"&&d.length>0))),a=Array.from(new Set([s.CHAT_CHANGED,s.CHAT_RESET,s.CHAT_STARTED,s.CHAT_NEW,s.CHAT_CREATED,"chat_changed","chat_reset","chat_started","chat_new","chat_created"].filter(d=>typeof d=="string"&&d.length>0)));for(let d of i)o(d,c=>{try{t.extractPromptChatFromPayloadEvent(c)||b.info(`${d} \u5DF2\u89E6\u53D1\uFF0C\u4F46 payload \u4E2D\u672A\u53D1\u73B0 chat/messages`),t.handlePromptReadyEvent(c,d)}catch(u){b.error("Prompt hook \u9519\u8BEF",u)}});for(let d of l)r.on(d,()=>{try{t.handleGenerationEndedEvent()}catch(c){b.error("Generation hook \u9519\u8BEF",c)}});for(let d of a)r.on(d,()=>{try{t.clearDiceMetaEventState(d),t.loadChatScopedStateIntoRuntimeEvent(d).catch(c=>{b.warn(`\u804A\u5929\u5207\u6362\u88C5\u8F7D\u5931\u8D25 (${d})`,c)}).finally(()=>{setTimeout(()=>{t.sanitizeCurrentChatEventBlocksEvent(),t.sweepTimeoutFailuresEvent(),t.refreshCountdownDomEvent()},0)})}catch(c){b.error("Reset hook \u9519\u8BEF",c)}});e.__stRollEventHooksRegisteredEvent=!0}function ha(){return xo()}function Tn(t){return t>0?`+${t}`:String(t)}function iu(t){return t==="advantage"?"\u4F18\u52BF":t==="disadvantage"?"\u52A3\u52BF":"\u6B63\u5E38"}function ou(t){return t==="auto"?"\u81EA\u52A8":"\u624B\u52A8"}function lu(t){let e=t.scope==="all"?"-":t.skills.join("|"),n=t.scope==="all"?"\u5168\u5C40":"\u6309\u6280\u80FD",r=at(t.remainingRounds),s=t.enabled?"\u542F\u7528":"\u505C\u7528";return`- ${t.name} | ${Tn(t.modifier)} | \u6301\u7EED=${r} | \u8303\u56F4=${n} | \u6280\u80FD=${e} | ${s}`}function au(t,e,n){if(!t.enableStatusSystem)return"\u72B6\u6001=\u5173\u95ED";let r=Ft(e,n),s=new Map;for(let o of e){let l=String(o?.name??"").trim().toLowerCase();l&&s.set(l,o.remainingRounds??null)}if(r.modifier===0)return"\u72B6\u6001=+0";let i=r.matched.length>0?`\uFF08${r.matched.map(o=>`${o.name}${Tn(o.modifier)}(${at(s.get(String(o.name??"").trim().toLowerCase())??null)})`).join("\uFF0C")}\uFF09`:"";return`\u72B6\u6001=${Tn(r.modifier)}${i}`}function du(t,e){let n=e.getSettingsEvent(),r=e.getDiceMetaEvent(),s=q(r);e.ensureRoundEventTimersSyncedEvent(t);let i=[];if(i.push(`\u5F53\u524D\u8F6E\u6B21: ${t.roundId}`),i.push(`\u4E8B\u4EF6\u6570\u91CF: ${t.events.length}`),i.push(`\u72B6\u6001\u7CFB\u7EDF: ${n.enableStatusSystem?"\u5F00\u542F":"\u5173\u95ED"}`),n.enableStatusSystem)if(s.length<=0)i.push("Active_Statuses:"),i.push("- \u65E0");else{i.push("Active_Statuses:");for(let o of s)i.push(lu(o))}for(let o of t.events){let l=e.getEventRuntimeViewStateEvent(t,o),a=e.resolveSkillModifierBySkillNameEvent(o.skill,n),d=au(n,s,o.skill),c=n.enableDynamicDcReason&&o.dcReason?` | DC\u539F\u56E0=${o.dcReason}`:"";i.push(`- ${o.id}: ${o.title} | \u5BF9\u8C61=${o.targetLabel} | \u9AB0\u5F0F=${o.checkDice} | \u6761\u4EF6=${o.compare??">="} ${o.dc}${c} | \u6280\u80FD=${o.skill} | \u6280\u80FD\u4FEE\u6B63=${Tn(a)} | \u6A21\u5F0F=${ou(o.rollMode)} | \u9AB0\u6001=${iu(o.advantageState)} | \u65F6\u9650=${o.timeLimit??"\u65E0"} | ${d} | \u72B6\u6001=${l.text}`)}return i.join(`
`)}function Ia(t){let{SlashCommandParser:e,SlashCommand:n,SlashCommandArgument:r,ARGUMENT_TYPE:s,pushToChat:i,sweepTimeoutFailuresEvent:o,getDiceMetaEvent:l,getSettingsEvent:a,ensureRoundEventTimersSyncedEvent:d,getEventRuntimeViewStateEvent:c,resolveSkillModifierBySkillNameEvent:u,performEventRollByIdEvent:E,escapeHtmlEvent:v}=t,m=globalThis;m.__stRollEventCommandRegisteredEvent||!e||!n||!r||!s||(e.addCommandObject(n.fromProps({name:"eventroll",aliases:["eroll"],returns:"\u4E8B\u4EF6\u9AB0\u5B50\u547D\u4EE4\uFF1Alist / roll / help",namedArgumentList:[],unnamedArgumentList:[r.fromProps({description:"\u5B50\u547D\u4EE4\uFF0C\u4F8B\u5982\uFF1Alist | roll lockpick_gate 1d20+3",typeList:s.STRING,isRequired:!1})],helpString:ha(),callback:(f,S)=>{let g=(S??"").toString().trim(),_=g?g.split(/\s+/):[],h=(_[0]||"help").toLowerCase();if(h==="help")return i(ha())??"";if(h==="list"){o();let p=l().pendingRound;if(!p||p.status!=="open")return i("\u5F53\u524D\u6CA1\u6709\u53EF\u7528\u4E8B\u4EF6\uFF0C\u8BF7\u5148\u7B49\u5F85 AI \u8F93\u51FA\u4E8B\u4EF6 JSON\u3002")??"";let I=yo(v(du(p,{getSettingsEvent:a,getDiceMetaEvent:l,ensureRoundEventTimersSyncedEvent:d,getEventRuntimeViewStateEvent:c,resolveSkillModifierBySkillNameEvent:u})));return i(I)??""}if(h==="roll"){let T=_[1]||"",p=_.length>2?_.slice(2).join(" "):void 0,I=E(T,p);return I?i(I)??"":""}return i("\u672A\u77E5\u5B50\u547D\u4EE4\uFF0C\u8BF7\u4F7F\u7528 /eventroll help \u67E5\u770B\u5E2E\u52A9\u3002")??""}})),m.__stRollEventCommandRegisteredEvent=!0)}function xa(t){let{SlashCommandParser:e,SlashCommand:n,getDiceMeta:r,getDiceMetaEvent:s,escapeHtmlEvent:i,pushToChat:o}=t,l=globalThis;l.__stRollDebugCommandRegisteredEvent||!e||!n||(e.addCommandObject(n.fromProps({name:"rollDebug",aliases:["ddebug"],returns:"\u663E\u793A diceRoller \u5143\u6570\u636E",namedArgumentList:[],unnamedArgumentList:[],callback:()=>{let a=r(),d=s(),c=JSON.stringify({legacy:a,eventMeta:d},null,2),u=Do(i(c));return o(u),""}})),l.__stRollDebugCommandRegisteredEvent=!0)}function cu(t){return da(t,{isAssistantMessageEvent:Qr})}function uu(t,e){return ca(t,e,{simpleHashEvent:we,getMessageTextEvent:ht})}function Eu(t){return ua(t,{getPreferredAssistantSourceTextEvent:Jr,getMessageTextEvent:ht,parseEventEnvelopesEvent:ts,removeRangesEvent:es,setMessageTextEvent:pe})}function as(){Ea({getLiveContextEvent:J,isAssistantMessageEvent:Qr,sanitizeAssistantMessageEventBlocksEvent:Eu,persistChatSafeEvent:_r,hideEventCodeBlocksInDomEvent:is})}var ya={getSettingsEvent:R,ensureRoundEventTimersSyncedEvent:it,getLatestRollRecordForEvent:st,rollExpression:We,parseDiceExpression:W,resolveSkillModifierBySkillNameEvent:kt,applySkillModifierToDiceResultEvent:Vr,normalizeCompareOperatorEvent:jt,evaluateSuccessEvent:Xi,createIdEvent:nt,buildEventRollResultCardEvent:Zl,saveLastRoll:Ve,saveMetadataSafeEvent:Z};function Da(t,e,n){return ol(t,e,n,{...ya,sweepTimeoutFailuresEvent:Et,getDiceMetaEvent:L,recordTimeoutFailureIfNeededEvent:ns,buildEventAlreadyRolledCardEvent:ta,pushToChat:j,refreshCountdownDomEvent:$t})}function vu(t){return ll(t,{...ya,getDiceMetaEvent:L})}function mu(t=0){pn(t,{getSettingsEvent:R,getLiveContextEvent:J,findLatestAssistantEvent:cu,getDiceMetaEvent:L,buildAssistantMessageIdEvent:uu,getPreferredAssistantSourceTextEvent:Jr,getMessageTextEvent:ht,parseEventEnvelopesEvent:ts,filterEventsByApplyScopeEvent:Fr,removeRangesEvent:es,setMessageTextEvent:pe,hideEventCodeBlocksInDomEvent:is,persistChatSafeEvent:_r,mergeEventsIntoPendingRoundEvent:Rl,autoRollEventsByAiModeEvent:vu,buildEventListCardEvent:Ql,pushToChat:j,sweepTimeoutFailuresEvent:Et,refreshCountdownDomEvent:$t,saveMetadataSafeEvent:Z})}function gu(t="chat_reset"){va(t,{getDiceMetaEvent:L,saveMetadataSafeEvent:Z})}function Ra(){Ta({performEventRollByIdEvent:Da,pushToChat:j,getSettingsEvent:R,getDiceMetaEvent:L})}function Aa(){Ia({SlashCommandParser:re,SlashCommand:se,SlashCommandArgument:Me,ARGUMENT_TYPE:Ne,pushToChat:j,sweepTimeoutFailuresEvent:Et,getDiceMetaEvent:L,getSettingsEvent:R,ensureRoundEventTimersSyncedEvent:it,getEventRuntimeViewStateEvent:un,resolveSkillModifierBySkillNameEvent:kt,performEventRollByIdEvent:Da,escapeHtmlEvent:rt})}function ka(){_a({sweepTimeoutFailuresEvent:Et,refreshCountdownDomEvent:$t})}function La(){ba({getLiveContextEvent:J,eventSource:pi,event_types:fi,extractPromptChatFromPayloadEvent:Zr,handlePromptReadyEvent:kl,handleGenerationEndedEvent:mu,clearDiceMetaEventState:gu,sanitizeCurrentChatEventBlocksEvent:as,sweepTimeoutFailuresEvent:Et,refreshCountdownDomEvent:$t,loadChatScopedStateIntoRuntimeEvent:ze})}function Ma(){xa({SlashCommandParser:re,SlashCommand:se,getDiceMeta:ae,getDiceMetaEvent:L,escapeHtmlEvent:rt,pushToChat:j})}Go();var Su=80,pu=500;function ds(t=0){Bo(),Ho(),Ra(),Aa(),Ma(),La(),ze("init_runtime").catch(n=>{b.warn("\u521D\u59CB\u5316\u804A\u5929\u7EA7\u72B6\u6001\u5931\u8D25",n)}),ka(),Et(),$t(),as();let e=globalThis;if(!e.__stRollEventCommandRegisteredEvent||!e.__stRollBaseCommandRegisteredEvent||!e.__stRollDebugCommandRegisteredEvent||!e.__stRollEventHooksRegisteredEvent){t<Su&&setTimeout(()=>ds(t+1),pu);return}b.info("Event \u521D\u59CB\u5316\u5B8C\u6210")}function Na(){let t=globalThis;t.__stDiceRollerEventLoaded||(t.__stDiceRollerEventLoaded=!0,ds())}var b=new mt("\u9AB0\u5B50\u52A9\u624B");b.info("\u9AB0\u5B50\u52A9\u624B\u7EC4\u4EF6\u5DF2\u8F7D\u5165\u73AF\u5883");ms("ping","stx_rollhelper",async(t,e)=>({alive:!0,version:"1.0.0",isEnabled:!0,capabilities:["roll","event","bus","ui"]}));gs("state_changed",{namespace:"stx_rollhelper",isEnabled:!0},"stx_rollhelper");Na();export{b as logger};
//# sourceMappingURL=index.js.map
