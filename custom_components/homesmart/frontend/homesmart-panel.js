/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const fe = globalThis, Ae = fe.ShadowRoot && (fe.ShadyCSS === void 0 || fe.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, ke = Symbol(), Ve = /* @__PURE__ */ new WeakMap();
let Ge = class {
  constructor(e, t, i) {
    if (this._$cssResult$ = !0, i !== ke) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    this.cssText = e, this.t = t;
  }
  get styleSheet() {
    let e = this.o;
    const t = this.t;
    if (Ae && e === void 0) {
      const i = t !== void 0 && t.length === 1;
      i && (e = Ve.get(t)), e === void 0 && ((this.o = e = new CSSStyleSheet()).replaceSync(this.cssText), i && Ve.set(t, e));
    }
    return e;
  }
  toString() {
    return this.cssText;
  }
};
const tt = (r) => new Ge(typeof r == "string" ? r : r + "", void 0, ke), k = (r, ...e) => {
  const t = r.length === 1 ? r[0] : e.reduce((i, s, n) => i + ((a) => {
    if (a._$cssResult$ === !0) return a.cssText;
    if (typeof a == "number") return a;
    throw Error("Value passed to 'css' function must be a 'css' function result: " + a + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
  })(s) + r[n + 1], r[0]);
  return new Ge(t, r, ke);
}, it = (r, e) => {
  if (Ae) r.adoptedStyleSheets = e.map((t) => t instanceof CSSStyleSheet ? t : t.styleSheet);
  else for (const t of e) {
    const i = document.createElement("style"), s = fe.litNonce;
    s !== void 0 && i.setAttribute("nonce", s), i.textContent = t.cssText, r.appendChild(i);
  }
}, Le = Ae ? (r) => r : (r) => r instanceof CSSStyleSheet ? ((e) => {
  let t = "";
  for (const i of e.cssRules) t += i.cssText;
  return tt(t);
})(r) : r;
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const { is: st, defineProperty: rt, getOwnPropertyDescriptor: nt, getOwnPropertyNames: at, getOwnPropertySymbols: ot, getPrototypeOf: ct } = Object, S = globalThis, Se = S.trustedTypes, lt = Se ? Se.emptyScript : "", ye = S.reactiveElementPolyfillSupport, oe = (r, e) => r, be = { toAttribute(r, e) {
  switch (e) {
    case Boolean:
      r = r ? lt : null;
      break;
    case Object:
    case Array:
      r = r == null ? r : JSON.stringify(r);
  }
  return r;
}, fromAttribute(r, e) {
  let t = r;
  switch (e) {
    case Boolean:
      t = r !== null;
      break;
    case Number:
      t = r === null ? null : Number(r);
      break;
    case Object:
    case Array:
      try {
        t = JSON.parse(r);
      } catch {
        t = null;
      }
  }
  return t;
} }, Ce = (r, e) => !st(r, e), Te = { attribute: !0, type: String, converter: be, reflect: !1, useDefault: !1, hasChanged: Ce };
Symbol.metadata ?? (Symbol.metadata = Symbol("metadata")), S.litPropertyMetadata ?? (S.litPropertyMetadata = /* @__PURE__ */ new WeakMap());
let Z = class extends HTMLElement {
  static addInitializer(e) {
    this._$Ei(), (this.l ?? (this.l = [])).push(e);
  }
  static get observedAttributes() {
    return this.finalize(), this._$Eh && [...this._$Eh.keys()];
  }
  static createProperty(e, t = Te) {
    if (t.state && (t.attribute = !1), this._$Ei(), this.prototype.hasOwnProperty(e) && ((t = Object.create(t)).wrapped = !0), this.elementProperties.set(e, t), !t.noAccessor) {
      const i = Symbol(), s = this.getPropertyDescriptor(e, i, t);
      s !== void 0 && rt(this.prototype, e, s);
    }
  }
  static getPropertyDescriptor(e, t, i) {
    const { get: s, set: n } = nt(this.prototype, e) ?? { get() {
      return this[t];
    }, set(a) {
      this[t] = a;
    } };
    return { get: s, set(a) {
      const o = s == null ? void 0 : s.call(this);
      n == null || n.call(this, a), this.requestUpdate(e, o, i);
    }, configurable: !0, enumerable: !0 };
  }
  static getPropertyOptions(e) {
    return this.elementProperties.get(e) ?? Te;
  }
  static _$Ei() {
    if (this.hasOwnProperty(oe("elementProperties"))) return;
    const e = ct(this);
    e.finalize(), e.l !== void 0 && (this.l = [...e.l]), this.elementProperties = new Map(e.elementProperties);
  }
  static finalize() {
    if (this.hasOwnProperty(oe("finalized"))) return;
    if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(oe("properties"))) {
      const t = this.properties, i = [...at(t), ...ot(t)];
      for (const s of i) this.createProperty(s, t[s]);
    }
    const e = this[Symbol.metadata];
    if (e !== null) {
      const t = litPropertyMetadata.get(e);
      if (t !== void 0) for (const [i, s] of t) this.elementProperties.set(i, s);
    }
    this._$Eh = /* @__PURE__ */ new Map();
    for (const [t, i] of this.elementProperties) {
      const s = this._$Eu(t, i);
      s !== void 0 && this._$Eh.set(s, t);
    }
    this.elementStyles = this.finalizeStyles(this.styles);
  }
  static finalizeStyles(e) {
    const t = [];
    if (Array.isArray(e)) {
      const i = new Set(e.flat(1 / 0).reverse());
      for (const s of i) t.unshift(Le(s));
    } else e !== void 0 && t.push(Le(e));
    return t;
  }
  static _$Eu(e, t) {
    const i = t.attribute;
    return i === !1 ? void 0 : typeof i == "string" ? i : typeof e == "string" ? e.toLowerCase() : void 0;
  }
  constructor() {
    super(), this._$Ep = void 0, this.isUpdatePending = !1, this.hasUpdated = !1, this._$Em = null, this._$Ev();
  }
  _$Ev() {
    var e;
    this._$ES = new Promise((t) => this.enableUpdating = t), this._$AL = /* @__PURE__ */ new Map(), this._$E_(), this.requestUpdate(), (e = this.constructor.l) == null || e.forEach((t) => t(this));
  }
  addController(e) {
    var t;
    (this._$EO ?? (this._$EO = /* @__PURE__ */ new Set())).add(e), this.renderRoot !== void 0 && this.isConnected && ((t = e.hostConnected) == null || t.call(e));
  }
  removeController(e) {
    var t;
    (t = this._$EO) == null || t.delete(e);
  }
  _$E_() {
    const e = /* @__PURE__ */ new Map(), t = this.constructor.elementProperties;
    for (const i of t.keys()) this.hasOwnProperty(i) && (e.set(i, this[i]), delete this[i]);
    e.size > 0 && (this._$Ep = e);
  }
  createRenderRoot() {
    const e = this.shadowRoot ?? this.attachShadow(this.constructor.shadowRootOptions);
    return it(e, this.constructor.elementStyles), e;
  }
  connectedCallback() {
    var e;
    this.renderRoot ?? (this.renderRoot = this.createRenderRoot()), this.enableUpdating(!0), (e = this._$EO) == null || e.forEach((t) => {
      var i;
      return (i = t.hostConnected) == null ? void 0 : i.call(t);
    });
  }
  enableUpdating(e) {
  }
  disconnectedCallback() {
    var e;
    (e = this._$EO) == null || e.forEach((t) => {
      var i;
      return (i = t.hostDisconnected) == null ? void 0 : i.call(t);
    });
  }
  attributeChangedCallback(e, t, i) {
    this._$AK(e, i);
  }
  _$ET(e, t) {
    var n;
    const i = this.constructor.elementProperties.get(e), s = this.constructor._$Eu(e, i);
    if (s !== void 0 && i.reflect === !0) {
      const a = (((n = i.converter) == null ? void 0 : n.toAttribute) !== void 0 ? i.converter : be).toAttribute(t, i.type);
      this._$Em = e, a == null ? this.removeAttribute(s) : this.setAttribute(s, a), this._$Em = null;
    }
  }
  _$AK(e, t) {
    var n, a;
    const i = this.constructor, s = i._$Eh.get(e);
    if (s !== void 0 && this._$Em !== s) {
      const o = i.getPropertyOptions(s), c = typeof o.converter == "function" ? { fromAttribute: o.converter } : ((n = o.converter) == null ? void 0 : n.fromAttribute) !== void 0 ? o.converter : be;
      this._$Em = s;
      const g = c.fromAttribute(t, o.type);
      this[s] = g ?? ((a = this._$Ej) == null ? void 0 : a.get(s)) ?? g, this._$Em = null;
    }
  }
  requestUpdate(e, t, i, s = !1, n) {
    var a;
    if (e !== void 0) {
      const o = this.constructor;
      if (s === !1 && (n = this[e]), i ?? (i = o.getPropertyOptions(e)), !((i.hasChanged ?? Ce)(n, t) || i.useDefault && i.reflect && n === ((a = this._$Ej) == null ? void 0 : a.get(e)) && !this.hasAttribute(o._$Eu(e, i)))) return;
      this.C(e, t, i);
    }
    this.isUpdatePending === !1 && (this._$ES = this._$EP());
  }
  C(e, t, { useDefault: i, reflect: s, wrapped: n }, a) {
    i && !(this._$Ej ?? (this._$Ej = /* @__PURE__ */ new Map())).has(e) && (this._$Ej.set(e, a ?? t ?? this[e]), n !== !0 || a !== void 0) || (this._$AL.has(e) || (this.hasUpdated || i || (t = void 0), this._$AL.set(e, t)), s === !0 && this._$Em !== e && (this._$Eq ?? (this._$Eq = /* @__PURE__ */ new Set())).add(e));
  }
  async _$EP() {
    this.isUpdatePending = !0;
    try {
      await this._$ES;
    } catch (t) {
      Promise.reject(t);
    }
    const e = this.scheduleUpdate();
    return e != null && await e, !this.isUpdatePending;
  }
  scheduleUpdate() {
    return this.performUpdate();
  }
  performUpdate() {
    var i;
    if (!this.isUpdatePending) return;
    if (!this.hasUpdated) {
      if (this.renderRoot ?? (this.renderRoot = this.createRenderRoot()), this._$Ep) {
        for (const [n, a] of this._$Ep) this[n] = a;
        this._$Ep = void 0;
      }
      const s = this.constructor.elementProperties;
      if (s.size > 0) for (const [n, a] of s) {
        const { wrapped: o } = a, c = this[n];
        o !== !0 || this._$AL.has(n) || c === void 0 || this.C(n, void 0, a, c);
      }
    }
    let e = !1;
    const t = this._$AL;
    try {
      e = this.shouldUpdate(t), e ? (this.willUpdate(t), (i = this._$EO) == null || i.forEach((s) => {
        var n;
        return (n = s.hostUpdate) == null ? void 0 : n.call(s);
      }), this.update(t)) : this._$EM();
    } catch (s) {
      throw e = !1, this._$EM(), s;
    }
    e && this._$AE(t);
  }
  willUpdate(e) {
  }
  _$AE(e) {
    var t;
    (t = this._$EO) == null || t.forEach((i) => {
      var s;
      return (s = i.hostUpdated) == null ? void 0 : s.call(i);
    }), this.hasUpdated || (this.hasUpdated = !0, this.firstUpdated(e)), this.updated(e);
  }
  _$EM() {
    this._$AL = /* @__PURE__ */ new Map(), this.isUpdatePending = !1;
  }
  get updateComplete() {
    return this.getUpdateComplete();
  }
  getUpdateComplete() {
    return this._$ES;
  }
  shouldUpdate(e) {
    return !0;
  }
  update(e) {
    this._$Eq && (this._$Eq = this._$Eq.forEach((t) => this._$ET(t, this[t]))), this._$EM();
  }
  updated(e) {
  }
  firstUpdated(e) {
  }
};
Z.elementStyles = [], Z.shadowRootOptions = { mode: "open" }, Z[oe("elementProperties")] = /* @__PURE__ */ new Map(), Z[oe("finalized")] = /* @__PURE__ */ new Map(), ye == null || ye({ ReactiveElement: Z }), (S.reactiveElementVersions ?? (S.reactiveElementVersions = [])).push("2.1.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const ce = globalThis, Pe = (r) => r, me = ce.trustedTypes, ze = me ? me.createPolicy("lit-html", { createHTML: (r) => r }) : void 0, qe = "$lit$", L = `lit$${Math.random().toFixed(9).slice(2)}$`, We = "?" + L, dt = `<${We}>`, N = document, le = () => N.createComment(""), de = (r) => r === null || typeof r != "object" && typeof r != "function", Me = Array.isArray, ht = (r) => Me(r) || typeof (r == null ? void 0 : r[Symbol.iterator]) == "function", xe = `[ 	
\f\r]`, ae = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, Oe = /-->/g, Ie = />/g, I = RegExp(`>|${xe}(?:([^\\s"'>=/]+)(${xe}*=${xe}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`, "g"), je = /'/g, De = /"/g, Ye = /^(?:script|style|textarea|title)$/i, pt = (r) => (e, ...t) => ({ _$litType$: r, strings: e, values: t }), l = pt(1), ee = Symbol.for("lit-noChange"), y = Symbol.for("lit-nothing"), Ne = /* @__PURE__ */ new WeakMap(), j = N.createTreeWalker(N, 129);
function Xe(r, e) {
  if (!Me(r) || !r.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return ze !== void 0 ? ze.createHTML(e) : e;
}
const ut = (r, e) => {
  const t = r.length - 1, i = [];
  let s, n = e === 2 ? "<svg>" : e === 3 ? "<math>" : "", a = ae;
  for (let o = 0; o < t; o++) {
    const c = r[o];
    let g, p, h = -1, v = 0;
    for (; v < c.length && (a.lastIndex = v, p = a.exec(c), p !== null); ) v = a.lastIndex, a === ae ? p[1] === "!--" ? a = Oe : p[1] !== void 0 ? a = Ie : p[2] !== void 0 ? (Ye.test(p[2]) && (s = RegExp("</" + p[2], "g")), a = I) : p[3] !== void 0 && (a = I) : a === I ? p[0] === ">" ? (a = s ?? ae, h = -1) : p[1] === void 0 ? h = -2 : (h = a.lastIndex - p[2].length, g = p[1], a = p[3] === void 0 ? I : p[3] === '"' ? De : je) : a === De || a === je ? a = I : a === Oe || a === Ie ? a = ae : (a = I, s = void 0);
    const w = a === I && r[o + 1].startsWith("/>") ? " " : "";
    n += a === ae ? c + dt : h >= 0 ? (i.push(g), c.slice(0, h) + qe + c.slice(h) + L + w) : c + L + (h === -2 ? o : w);
  }
  return [Xe(r, n + (r[t] || "<?>") + (e === 2 ? "</svg>" : e === 3 ? "</math>" : "")), i];
};
class he {
  constructor({ strings: e, _$litType$: t }, i) {
    let s;
    this.parts = [];
    let n = 0, a = 0;
    const o = e.length - 1, c = this.parts, [g, p] = ut(e, t);
    if (this.el = he.createElement(g, i), j.currentNode = this.el.content, t === 2 || t === 3) {
      const h = this.el.content.firstChild;
      h.replaceWith(...h.childNodes);
    }
    for (; (s = j.nextNode()) !== null && c.length < o; ) {
      if (s.nodeType === 1) {
        if (s.hasAttributes()) for (const h of s.getAttributeNames()) if (h.endsWith(qe)) {
          const v = p[a++], w = s.getAttribute(h).split(L), m = /([.?@])?(.*)/.exec(v);
          c.push({ type: 1, index: n, name: m[2], strings: w, ctor: m[1] === "." ? ft : m[1] === "?" ? bt : m[1] === "@" ? mt : ve }), s.removeAttribute(h);
        } else h.startsWith(L) && (c.push({ type: 6, index: n }), s.removeAttribute(h));
        if (Ye.test(s.tagName)) {
          const h = s.textContent.split(L), v = h.length - 1;
          if (v > 0) {
            s.textContent = me ? me.emptyScript : "";
            for (let w = 0; w < v; w++) s.append(h[w], le()), j.nextNode(), c.push({ type: 2, index: ++n });
            s.append(h[v], le());
          }
        }
      } else if (s.nodeType === 8) if (s.data === We) c.push({ type: 2, index: n });
      else {
        let h = -1;
        for (; (h = s.data.indexOf(L, h + 1)) !== -1; ) c.push({ type: 7, index: n }), h += L.length - 1;
      }
      n++;
    }
  }
  static createElement(e, t) {
    const i = N.createElement("template");
    return i.innerHTML = e, i;
  }
}
function te(r, e, t = r, i) {
  var a, o;
  if (e === ee) return e;
  let s = i !== void 0 ? (a = t._$Co) == null ? void 0 : a[i] : t._$Cl;
  const n = de(e) ? void 0 : e._$litDirective$;
  return (s == null ? void 0 : s.constructor) !== n && ((o = s == null ? void 0 : s._$AO) == null || o.call(s, !1), n === void 0 ? s = void 0 : (s = new n(r), s._$AT(r, t, i)), i !== void 0 ? (t._$Co ?? (t._$Co = []))[i] = s : t._$Cl = s), s !== void 0 && (e = te(r, s._$AS(r, e.values), s, i)), e;
}
class gt {
  constructor(e, t) {
    this._$AV = [], this._$AN = void 0, this._$AD = e, this._$AM = t;
  }
  get parentNode() {
    return this._$AM.parentNode;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  u(e) {
    const { el: { content: t }, parts: i } = this._$AD, s = ((e == null ? void 0 : e.creationScope) ?? N).importNode(t, !0);
    j.currentNode = s;
    let n = j.nextNode(), a = 0, o = 0, c = i[0];
    for (; c !== void 0; ) {
      if (a === c.index) {
        let g;
        c.type === 2 ? g = new pe(n, n.nextSibling, this, e) : c.type === 1 ? g = new c.ctor(n, c.name, c.strings, this, e) : c.type === 6 && (g = new vt(n, this, e)), this._$AV.push(g), c = i[++o];
      }
      a !== (c == null ? void 0 : c.index) && (n = j.nextNode(), a++);
    }
    return j.currentNode = N, s;
  }
  p(e) {
    let t = 0;
    for (const i of this._$AV) i !== void 0 && (i.strings !== void 0 ? (i._$AI(e, i, t), t += i.strings.length - 2) : i._$AI(e[t])), t++;
  }
}
class pe {
  get _$AU() {
    var e;
    return ((e = this._$AM) == null ? void 0 : e._$AU) ?? this._$Cv;
  }
  constructor(e, t, i, s) {
    this.type = 2, this._$AH = y, this._$AN = void 0, this._$AA = e, this._$AB = t, this._$AM = i, this.options = s, this._$Cv = (s == null ? void 0 : s.isConnected) ?? !0;
  }
  get parentNode() {
    let e = this._$AA.parentNode;
    const t = this._$AM;
    return t !== void 0 && (e == null ? void 0 : e.nodeType) === 11 && (e = t.parentNode), e;
  }
  get startNode() {
    return this._$AA;
  }
  get endNode() {
    return this._$AB;
  }
  _$AI(e, t = this) {
    e = te(this, e, t), de(e) ? e === y || e == null || e === "" ? (this._$AH !== y && this._$AR(), this._$AH = y) : e !== this._$AH && e !== ee && this._(e) : e._$litType$ !== void 0 ? this.$(e) : e.nodeType !== void 0 ? this.T(e) : ht(e) ? this.k(e) : this._(e);
  }
  O(e) {
    return this._$AA.parentNode.insertBefore(e, this._$AB);
  }
  T(e) {
    this._$AH !== e && (this._$AR(), this._$AH = this.O(e));
  }
  _(e) {
    this._$AH !== y && de(this._$AH) ? this._$AA.nextSibling.data = e : this.T(N.createTextNode(e)), this._$AH = e;
  }
  $(e) {
    var n;
    const { values: t, _$litType$: i } = e, s = typeof i == "number" ? this._$AC(e) : (i.el === void 0 && (i.el = he.createElement(Xe(i.h, i.h[0]), this.options)), i);
    if (((n = this._$AH) == null ? void 0 : n._$AD) === s) this._$AH.p(t);
    else {
      const a = new gt(s, this), o = a.u(this.options);
      a.p(t), this.T(o), this._$AH = a;
    }
  }
  _$AC(e) {
    let t = Ne.get(e.strings);
    return t === void 0 && Ne.set(e.strings, t = new he(e)), t;
  }
  k(e) {
    Me(this._$AH) || (this._$AH = [], this._$AR());
    const t = this._$AH;
    let i, s = 0;
    for (const n of e) s === t.length ? t.push(i = new pe(this.O(le()), this.O(le()), this, this.options)) : i = t[s], i._$AI(n), s++;
    s < t.length && (this._$AR(i && i._$AB.nextSibling, s), t.length = s);
  }
  _$AR(e = this._$AA.nextSibling, t) {
    var i;
    for ((i = this._$AP) == null ? void 0 : i.call(this, !1, !0, t); e !== this._$AB; ) {
      const s = Pe(e).nextSibling;
      Pe(e).remove(), e = s;
    }
  }
  setConnected(e) {
    var t;
    this._$AM === void 0 && (this._$Cv = e, (t = this._$AP) == null || t.call(this, e));
  }
}
class ve {
  get tagName() {
    return this.element.tagName;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  constructor(e, t, i, s, n) {
    this.type = 1, this._$AH = y, this._$AN = void 0, this.element = e, this.name = t, this._$AM = s, this.options = n, i.length > 2 || i[0] !== "" || i[1] !== "" ? (this._$AH = Array(i.length - 1).fill(new String()), this.strings = i) : this._$AH = y;
  }
  _$AI(e, t = this, i, s) {
    const n = this.strings;
    let a = !1;
    if (n === void 0) e = te(this, e, t, 0), a = !de(e) || e !== this._$AH && e !== ee, a && (this._$AH = e);
    else {
      const o = e;
      let c, g;
      for (e = n[0], c = 0; c < n.length - 1; c++) g = te(this, o[i + c], t, c), g === ee && (g = this._$AH[c]), a || (a = !de(g) || g !== this._$AH[c]), g === y ? e = y : e !== y && (e += (g ?? "") + n[c + 1]), this._$AH[c] = g;
    }
    a && !s && this.j(e);
  }
  j(e) {
    e === y ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, e ?? "");
  }
}
class ft extends ve {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(e) {
    this.element[this.name] = e === y ? void 0 : e;
  }
}
class bt extends ve {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(e) {
    this.element.toggleAttribute(this.name, !!e && e !== y);
  }
}
class mt extends ve {
  constructor(e, t, i, s, n) {
    super(e, t, i, s, n), this.type = 5;
  }
  _$AI(e, t = this) {
    if ((e = te(this, e, t, 0) ?? y) === ee) return;
    const i = this._$AH, s = e === y && i !== y || e.capture !== i.capture || e.once !== i.once || e.passive !== i.passive, n = e !== y && (i === y || s);
    s && this.element.removeEventListener(this.name, this, i), n && this.element.addEventListener(this.name, this, e), this._$AH = e;
  }
  handleEvent(e) {
    var t;
    typeof this._$AH == "function" ? this._$AH.call(((t = this.options) == null ? void 0 : t.host) ?? this.element, e) : this._$AH.handleEvent(e);
  }
}
class vt {
  constructor(e, t, i) {
    this.element = e, this.type = 6, this._$AN = void 0, this._$AM = t, this.options = i;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AI(e) {
    te(this, e);
  }
}
const we = ce.litHtmlPolyfillSupport;
we == null || we(he, pe), (ce.litHtmlVersions ?? (ce.litHtmlVersions = [])).push("3.3.3");
const yt = (r, e, t) => {
  const i = (t == null ? void 0 : t.renderBefore) ?? e;
  let s = i._$litPart$;
  if (s === void 0) {
    const n = (t == null ? void 0 : t.renderBefore) ?? null;
    i._$litPart$ = s = new pe(e.insertBefore(le(), n), n, void 0, t ?? {});
  }
  return s._$AI(r), s;
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const D = globalThis;
class _ extends Z {
  constructor() {
    super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
  }
  createRenderRoot() {
    var t;
    const e = super.createRenderRoot();
    return (t = this.renderOptions).renderBefore ?? (t.renderBefore = e.firstChild), e;
  }
  update(e) {
    const t = this.render();
    this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(e), this._$Do = yt(t, this.renderRoot, this.renderOptions);
  }
  connectedCallback() {
    var e;
    super.connectedCallback(), (e = this._$Do) == null || e.setConnected(!0);
  }
  disconnectedCallback() {
    var e;
    super.disconnectedCallback(), (e = this._$Do) == null || e.setConnected(!1);
  }
  render() {
    return ee;
  }
}
var Ze;
_._$litElement$ = !0, _.finalized = !0, (Ze = D.litElementHydrateSupport) == null || Ze.call(D, { LitElement: _ });
const _e = D.litElementPolyfillSupport;
_e == null || _e({ LitElement: _ });
(D.litElementVersions ?? (D.litElementVersions = [])).push("4.2.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const H = (r) => (e, t) => {
  t !== void 0 ? t.addInitializer(() => {
    customElements.define(r, e);
  }) : customElements.define(r, e);
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const xt = { attribute: !0, type: String, converter: be, reflect: !1, hasChanged: Ce }, wt = (r = xt, e, t) => {
  const { kind: i, metadata: s } = t;
  let n = globalThis.litPropertyMetadata.get(s);
  if (n === void 0 && globalThis.litPropertyMetadata.set(s, n = /* @__PURE__ */ new Map()), i === "setter" && ((r = Object.create(r)).wrapped = !0), n.set(t.name, r), i === "accessor") {
    const { name: a } = t;
    return { set(o) {
      const c = e.get.call(this);
      e.set.call(this, o), this.requestUpdate(a, c, r, !0, o);
    }, init(o) {
      return o !== void 0 && this.C(a, void 0, r, o), o;
    } };
  }
  if (i === "setter") {
    const { name: a } = t;
    return function(o) {
      const c = this[a];
      e.call(this, o), this.requestUpdate(a, c, r, !0, o);
    };
  }
  throw Error("Unsupported decorator location: " + i);
};
function u(r) {
  return (e, t) => typeof t == "object" ? wt(r, e, t) : ((i, s, n) => {
    const a = s.hasOwnProperty(n);
    return s.constructor.createProperty(n, i), a ? Object.getOwnPropertyDescriptor(s, n) : void 0;
  })(r, e, t);
}
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
function b(r) {
  return u({ ...r, state: !0, attribute: !1 });
}
const $e = {
  vi: {
    // App & Layout
    app_title: "HomeSmart",
    all_areas: "Tất cả khu vực",
    unassigned: "Thiết bị khác",
    overview: "Tổng quan",
    lights_active: "đèn đang bật",
    devices_active: "thiết bị đang chạy",
    no_entities: "Không tìm thấy thiết bị nào trong khu vực này.",
    tap_to_wake: "Chạm màn hình hoặc nhấn phím bất kỳ để đánh thức",
    // States
    state_on: "Bật",
    state_off: "Tắt",
    state_open: "Đang mở",
    state_closed: "Đang đóng",
    state_opening: "Đang mở lên",
    state_closing: "Đang đóng lại",
    state_locked: "Đã khóa",
    state_unlocked: "Mở khóa",
    state_heat: "Sưởi ấm",
    state_cool: "Làm mát",
    state_auto: "Tự động",
    state_fan_only: "Chỉ quạt",
    state_dry: "Hút ẩm",
    state_playing: "Đang phát",
    state_paused: "Tạm dừng",
    state_idle: "Chờ",
    state_home: "Ở nhà",
    state_not_home: "Vắng nhà",
    state_unavailable: "Không khả dụng",
    // Controls
    brightness: "Độ sáng",
    cover_position: "Độ mở",
    fan_speed: "Tốc độ quạt",
    temperature: "Nhiệt độ",
    current_temp: "Hiện tại",
    target_temp: "Cài đặt",
    volume: "Âm lượng",
    source: "Nguồn phát",
    open_btn: "Mở",
    stop_btn: "Dừng",
    close_btn: "Đóng",
    power_btn: "Nguồn",
    // Themes
    theme_aurora: "Bắc Cực Quang (Aurora)",
    theme_ocean: "Đại Dương Xanh (Ocean)",
    theme_wine: "Rượu Vang Đỏ (Wine)",
    theme_graphite: "Than Chì (Graphite)",
    theme_emerald: "Ngọc Lục Bảo (Emerald)",
    theme_sunset: "Hoàng Hôn (Sunset)",
    // Layouts
    layout_auto: "Tự động thích ứng",
    layout_sidebar: "Thanh điều hướng bên",
    layout_focus: "Tập trung (Focus)",
    layout_grid: "Lưới Bento cân xứng",
    layout_tv: "Màn hình TV (10-Foot UI)",
    // Visual Editor
    visual_editor: "Tùy Biến Giao Diện",
    edit_mode: "Chế độ sửa",
    exit_edit: "Hoàn tất",
    save_sync: "Lưu & Đồng Bộ",
    saving: "Đang lưu...",
    saved_success: "Đã lưu cấu hình lên Home Assistant!",
    save_error: "Lỗi khi lưu cấu hình. Vui lòng thử lại.",
    theme_select: "Chủ đề kính mờ",
    layout_select: "Bố cục hiển thị",
    screensaver_toggle: "Bảo vệ màn hình OLED",
    screensaver_timeout: "Thời gian chờ kích hoạt",
    language_select: "Ngôn ngữ",
    card_size: "Kích thước thẻ",
    card_protection: "Cơ chế bảo vệ",
    prot_none: "Bình thường",
    prot_confirm: "Xác nhận chạm 2 lần",
    prot_pin: "Mã PIN 4 số",
    hide_card: "Ẩn thẻ này",
    show_all_hidden: "Hiện tất cả thẻ đã ẩn",
    edit_card_settings: "Cài đặt thẻ",
    // Protected Modal
    confirm_title: "Xác Nhận Thao Tác",
    confirm_msg: "Bạn có chắc chắn muốn thao tác trên thiết bị an ninh này không?",
    pin_title: "Yêu Cầu Mã PIN",
    pin_msg: "Vui lòng nhập mã PIN bảo mật 4 số để tiếp tục:",
    incorrect_pin: "Mã PIN không đúng. Vui lòng nhập lại!",
    cancel: "Hủy bỏ",
    confirm: "Xác nhận",
    clear: "Xóa"
  },
  en: {
    // App & Layout
    app_title: "HomeSmart",
    all_areas: "All Areas",
    unassigned: "Other Devices",
    overview: "Overview",
    lights_active: "lights turned on",
    devices_active: "devices active",
    no_entities: "No devices found in this area.",
    tap_to_wake: "Tap screen or press any key to wake",
    // States
    state_on: "On",
    state_off: "Off",
    state_open: "Open",
    state_closed: "Closed",
    state_opening: "Opening",
    state_closing: "Closing",
    state_locked: "Locked",
    state_unlocked: "Unlocked",
    state_heat: "Heat",
    state_cool: "Cool",
    state_auto: "Auto",
    state_fan_only: "Fan Only",
    state_dry: "Dry",
    state_playing: "Playing",
    state_paused: "Paused",
    state_idle: "Idle",
    state_home: "Home",
    state_not_home: "Away",
    state_unavailable: "Unavailable",
    // Controls
    brightness: "Brightness",
    cover_position: "Position",
    fan_speed: "Fan Speed",
    temperature: "Temperature",
    current_temp: "Current",
    target_temp: "Target",
    volume: "Volume",
    source: "Source",
    open_btn: "Open",
    stop_btn: "Stop",
    close_btn: "Close",
    power_btn: "Power",
    // Themes
    theme_aurora: "Aurora Borealis",
    theme_ocean: "Deep Ocean",
    theme_wine: "Ruby Wine",
    theme_graphite: "Graphite Slate",
    theme_emerald: "Cyber Emerald",
    theme_sunset: "Golden Sunset",
    // Layouts
    layout_auto: "Auto Responsive",
    layout_sidebar: "Sidebar Navigation",
    layout_focus: "Focus Mode",
    layout_grid: "Bento Grid",
    layout_tv: "TV Console (10-Foot UI)",
    // Visual Editor
    visual_editor: "Visual Customizer",
    edit_mode: "Edit Mode",
    exit_edit: "Done",
    save_sync: "Save & Sync",
    saving: "Saving...",
    saved_success: "Dashboard configuration saved to Home Assistant!",
    save_error: "Failed to save configuration. Please try again.",
    theme_select: "Glassmorphism Theme",
    layout_select: "Layout Mode",
    screensaver_toggle: "OLED Screensaver",
    screensaver_timeout: "Screensaver Timeout",
    language_select: "Language",
    card_size: "Card Size",
    card_protection: "Protection Guard",
    prot_none: "None",
    prot_confirm: "Double-Tap Confirm",
    prot_pin: "4-Digit PIN Code",
    hide_card: "Hide Card",
    show_all_hidden: "Unhide All Cards",
    edit_card_settings: "Card Settings",
    // Protected Modal
    confirm_title: "Confirm Action",
    confirm_msg: "Are you sure you want to trigger this protected device?",
    pin_title: "Security PIN Required",
    pin_msg: "Enter the 4-digit security PIN to proceed:",
    incorrect_pin: "Incorrect PIN code. Please try again!",
    cancel: "Cancel",
    confirm: "Confirm",
    clear: "Clear"
  }
};
function d(r, e = "vi") {
  return ($e[e] || $e.vi)[r] || $e.en[r] || r;
}
const _t = k`
  @import url('https://fonts.googleapis.com/css2?family=Figtree:wght@300;400;500;600;700&family=Outfit:wght@300;400;500;600;700;800&display=swap');

  :host {
    display: block;
    width: 100%;
    height: 100%;
    min-height: 100vh;
    font-family: 'Figtree', 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    color: #ffffff;
    box-sizing: border-box;
    overflow-x: hidden;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;

    /* Base Tokens */
    --hs-font-display: 'Outfit', sans-serif;
    --hs-font-body: 'Figtree', sans-serif;
    --hs-radius-sm: 10px;
    --hs-radius-md: 16px;
    --hs-radius-lg: 24px;
    --hs-radius-xl: 32px;
    --hs-transition-fast: 0.15s cubic-bezier(0.16, 1, 0.3, 1);
    --hs-transition-normal: 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    --hs-transition-slow: 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  }

  /* ========================================================
     THEME 1: AURORA (VIOLET / INDIGO / NEON TEAL GLOW)
     ======================================================== */
  :host([data-theme='aurora']),
  .theme-aurora {
    --hs-bg-gradient: radial-gradient(circle at 10% 20%, #1f1444 0%, #0d0a21 40%, #05040d 100%),
      radial-gradient(circle at 90% 80%, rgba(0, 242, 254, 0.15) 0%, transparent 50%);
    --hs-glass-bg: rgba(25, 20, 52, 0.45);
    --hs-glass-bg-hover: rgba(35, 28, 72, 0.65);
    --hs-glass-bg-active: rgba(45, 36, 92, 0.85);
    --hs-glass-border: rgba(147, 128, 255, 0.18);
    --hs-glass-border-hover: rgba(180, 165, 255, 0.4);
    --hs-glass-border-active: rgba(0, 242, 254, 0.65);
    --hs-accent: #00f2fe;
    --hs-accent-secondary: #7f5af0;
    --hs-glow-color: rgba(0, 242, 254, 0.35);
    --hs-text-primary: #ffffff;
    --hs-text-secondary: rgba(255, 255, 255, 0.7);
    --hs-text-muted: rgba(255, 255, 255, 0.45);
    --hs-sidebar-bg: rgba(13, 10, 33, 0.75);
    --hs-active-gradient: linear-gradient(135deg, #00f2fe 0%, #4facfe 100%);
  }

  /* ========================================================
     THEME 2: OCEAN (DEEP SAPPHIRE / NAVY / CYAN)
     ======================================================== */
  :host([data-theme='ocean']),
  .theme-ocean {
    --hs-bg-gradient: radial-gradient(circle at 20% 10%, #0c2547 0%, #07162c 50%, #020813 100%),
      radial-gradient(circle at 85% 85%, rgba(0, 198, 255, 0.18) 0%, transparent 55%);
    --hs-glass-bg: rgba(11, 37, 69, 0.45);
    --hs-glass-bg-hover: rgba(19, 58, 104, 0.65);
    --hs-glass-bg-active: rgba(28, 80, 140, 0.85);
    --hs-glass-border: rgba(77, 166, 255, 0.2);
    --hs-glass-border-hover: rgba(120, 195, 255, 0.45);
    --hs-glass-border-active: rgba(0, 217, 255, 0.7);
    --hs-accent: #00d9ff;
    --hs-accent-secondary: #0072ff;
    --hs-glow-color: rgba(0, 217, 255, 0.4);
    --hs-text-primary: #ffffff;
    --hs-text-secondary: rgba(230, 245, 255, 0.75);
    --hs-text-muted: rgba(180, 215, 255, 0.45);
    --hs-sidebar-bg: rgba(7, 22, 44, 0.8);
    --hs-active-gradient: linear-gradient(135deg, #00c6ff 0%, #0072ff 100%);
  }

  /* ========================================================
     THEME 3: WINE (DARK RUBY / BURGUNDY / ROSE)
     ======================================================== */
  :host([data-theme='wine']),
  .theme-wine {
    --hs-bg-gradient: radial-gradient(circle at 20% 15%, #3a0d24 0%, #1c0511 50%, #090105 100%),
      radial-gradient(circle at 80% 85%, rgba(255, 75, 114, 0.16) 0%, transparent 50%);
    --hs-glass-bg: rgba(58, 13, 36, 0.45);
    --hs-glass-bg-hover: rgba(85, 20, 54, 0.65);
    --hs-glass-bg-active: rgba(112, 28, 72, 0.85);
    --hs-glass-border: rgba(255, 105, 140, 0.22);
    --hs-glass-border-hover: rgba(255, 145, 175, 0.48);
    --hs-glass-border-active: rgba(255, 75, 114, 0.7);
    --hs-accent: #ff4b72;
    --hs-accent-secondary: #f857a6;
    --hs-glow-color: rgba(255, 75, 114, 0.38);
    --hs-text-primary: #ffffff;
    --hs-text-secondary: rgba(255, 230, 238, 0.75);
    --hs-text-muted: rgba(255, 190, 210, 0.45);
    --hs-sidebar-bg: rgba(28, 5, 17, 0.8);
    --hs-active-gradient: linear-gradient(135deg, #ff4b72 0%, #f857a6 100%);
  }

  /* ========================================================
     THEME 4: GRAPHITE (TITANIUM / DARK SLATE / MONOCHROME)
     ======================================================== */
  :host([data-theme='graphite']),
  .theme-graphite {
    --hs-bg-gradient: radial-gradient(circle at 30% 10%, #20242b 0%, #121417 55%, #08090a 100%),
      radial-gradient(circle at 75% 85%, rgba(226, 232, 240, 0.08) 0%, transparent 60%);
    --hs-glass-bg: rgba(30, 34, 42, 0.5);
    --hs-glass-bg-hover: rgba(45, 51, 62, 0.7);
    --hs-glass-bg-active: rgba(58, 66, 80, 0.88);
    --hs-glass-border: rgba(255, 255, 255, 0.12);
    --hs-glass-border-hover: rgba(255, 255, 255, 0.25);
    --hs-glass-border-active: rgba(255, 255, 255, 0.55);
    --hs-accent: #38bdf8;
    --hs-accent-secondary: #e2e8f0;
    --hs-glow-color: rgba(56, 189, 248, 0.35);
    --hs-text-primary: #ffffff;
    --hs-text-secondary: rgba(226, 232, 240, 0.75);
    --hs-text-muted: rgba(148, 163, 184, 0.5);
    --hs-sidebar-bg: rgba(18, 20, 23, 0.82);
    --hs-active-gradient: linear-gradient(135deg, #38bdf8 0%, #818cf8 100%);
  }

  /* ========================================================
     THEME 5: EMERALD (CYBER OBSIDIAN / JADE / MINT)
     ======================================================== */
  :host([data-theme='emerald']),
  .theme-emerald {
    --hs-bg-gradient: radial-gradient(circle at 20% 10%, #0d2e23 0%, #071a14 50%, #020a07 100%),
      radial-gradient(circle at 80% 85%, rgba(0, 245, 160, 0.16) 0%, transparent 50%);
    --hs-glass-bg: rgba(13, 46, 35, 0.45);
    --hs-glass-bg-hover: rgba(20, 68, 52, 0.65);
    --hs-glass-bg-active: rgba(28, 92, 70, 0.85);
    --hs-glass-border: rgba(0, 245, 160, 0.2);
    --hs-glass-border-hover: rgba(80, 255, 190, 0.45);
    --hs-glass-border-active: rgba(0, 245, 160, 0.7);
    --hs-accent: #00f5a0;
    --hs-accent-secondary: #00d9f5;
    --hs-glow-color: rgba(0, 245, 160, 0.38);
    --hs-text-primary: #ffffff;
    --hs-text-secondary: rgba(230, 255, 245, 0.75);
    --hs-text-muted: rgba(160, 225, 200, 0.45);
    --hs-sidebar-bg: rgba(7, 26, 20, 0.8);
    --hs-active-gradient: linear-gradient(135deg, #00f5a0 0%, #00d9f5 100%);
  }

  /* ========================================================
     THEME 6: SUNSET (CORAL / DUSK AMBER / TWILIGHT)
     ======================================================== */
  :host([data-theme='sunset']),
  .theme-sunset {
    --hs-bg-gradient: radial-gradient(circle at 15% 15%, #3d1428 0%, #1f0b18 50%, #0a0308 100%),
      radial-gradient(circle at 85% 80%, rgba(255, 126, 95, 0.18) 0%, transparent 50%);
    --hs-glass-bg: rgba(61, 20, 40, 0.45);
    --hs-glass-bg-hover: rgba(88, 30, 58, 0.65);
    --hs-glass-bg-active: rgba(118, 42, 78, 0.85);
    --hs-glass-border: rgba(255, 126, 95, 0.22);
    --hs-glass-border-hover: rgba(254, 180, 123, 0.48);
    --hs-glass-border-active: rgba(255, 126, 95, 0.7);
    --hs-accent: #ff7e5f;
    --hs-accent-secondary: #feb47b;
    --hs-glow-color: rgba(255, 126, 95, 0.4);
    --hs-text-primary: #ffffff;
    --hs-text-secondary: rgba(255, 235, 230, 0.75);
    --hs-text-muted: rgba(255, 195, 180, 0.45);
    --hs-sidebar-bg: rgba(31, 11, 24, 0.8);
    --hs-active-gradient: linear-gradient(135deg, #ff7e5f 0%, #feb47b 100%);
  }

  /* Global App Container */
  .homesmart-shell {
    position: relative;
    width: 100%;
    min-height: 100vh;
    background: var(--hs-bg-gradient);
    background-attachment: fixed;
    background-size: cover;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    overflow-x: hidden;
  }

  /* Glass Card Foundation */
  .glass-card {
    background: var(--hs-glass-bg);
    backdrop-filter: blur(20px) saturate(180%);
    -webkit-backdrop-filter: blur(20px) saturate(180%);
    border: 1px solid var(--hs-glass-border);
    border-radius: var(--hs-radius-lg);
    box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
    transition: all var(--hs-transition-normal);
    position: relative;
    overflow: hidden;
    user-select: none;
    -webkit-user-select: none;
  }

  .glass-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.35), transparent);
    pointer-events: none;
  }

  .glass-card:hover {
    background: var(--hs-glass-bg-hover);
    border-color: var(--hs-glass-border-hover);
    transform: translateY(-2px);
    box-shadow: 0 12px 36px 0 rgba(0, 0, 0, 0.45);
  }

  .glass-card.active {
    background: var(--hs-glass-bg-active);
    border-color: var(--hs-glass-border-active);
    box-shadow: 0 0 24px var(--hs-glow-color), 0 8px 32px 0 rgba(0, 0, 0, 0.4);
  }

  /* TV / D-Pad Focus Ring */
  .glass-card:focus-visible,
  .glass-card.dpad-focused {
    outline: none !important;
    border-color: var(--hs-accent) !important;
    box-shadow: 0 0 0 3px var(--hs-accent), 0 0 30px var(--hs-glow-color) !important;
    transform: scale(1.03) translateY(-4px) !important;
    z-index: 10;
  }

  /* Scrollbar Styling */
  ::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  ::-webkit-scrollbar-track {
    background: transparent;
  }
  ::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.15);
    border-radius: 4px;
  }
  ::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.3);
  }
`, $t = /* @__PURE__ */ new Set([
  "light",
  "switch",
  "climate",
  "cover",
  "media_player",
  "camera",
  "fan",
  "lock",
  "sensor",
  "binary_sensor",
  "water_heater"
]);
function At(r, e) {
  var t;
  switch (r) {
    case "climate":
    case "camera":
    case "media_player":
      return "2x2";
    case "cover":
      return "2x1";
    case "light":
      return e && e.attributes && ((t = e.attributes.supported_color_modes) != null && t.some((i) => i !== "onoff") || e.attributes.brightness !== void 0 || e.attributes.supported_features && e.attributes.supported_features & 1) ? "2x1" : "1x1";
    case "fan":
      return e && e.attributes && (e.attributes.percentage !== void 0 || e.attributes.supported_features && e.attributes.supported_features & 1) ? "2x1" : "1x1";
    case "water_heater":
      return "2x1";
    case "switch":
    case "lock":
    case "sensor":
    case "binary_sensor":
    default:
      return "1x1";
  }
}
function kt(r) {
  return r === "lock" ? { type: "confirm" } : { type: "none" };
}
function Ct(r, e, t = !1) {
  var a, o, c, g;
  if (!r || !r.states)
    return [];
  const i = /* @__PURE__ */ new Map();
  if (r.areas)
    for (const [p, h] of Object.entries(r.areas))
      i.set(p, {
        id: p,
        name: h.name || p,
        icon: h.icon || Mt(h.name || p),
        picture: h.picture,
        entities: []
      });
  const s = {
    id: "unassigned",
    name: e.locale === "vi" ? "Thiết bị khác" : "Other Devices",
    icon: "mdi:devices",
    entities: []
  };
  for (const [p, h] of Object.entries(r.states)) {
    const v = p.split(".")[0];
    if (!$t.has(v))
      continue;
    const w = (a = e.hidden_entities) == null ? void 0 : a.includes(p), m = (o = e.custom_cards) == null ? void 0 : o[p], He = (m == null ? void 0 : m.hidden) ?? w;
    if (He && !t)
      continue;
    let ne = null;
    const V = (c = r.entities) == null ? void 0 : c[p];
    if (V != null && V.area_id)
      ne = V.area_id;
    else if (V != null && V.device_id && r.devices) {
      const ge = r.devices[V.device_id];
      ge != null && ge.area_id && (ne = ge.area_id);
    }
    const Ke = (m == null ? void 0 : m.size) || At(v, h), Je = (m == null ? void 0 : m.protection) || ((g = e.protected_entities) == null ? void 0 : g[p]) || kt(v), Qe = (m == null ? void 0 : m.custom_name) || h.attributes.friendly_name || p, et = (m == null ? void 0 : m.custom_icon) || h.attributes.icon || Ht(v, h.state), Ee = {
      entity_id: p,
      domain: v,
      name: Qe,
      icon: et,
      state: h.state,
      attributes: h.attributes,
      size: Ke,
      protection: Je,
      hidden: !!He
    };
    ne && i.has(ne) ? i.get(ne).entities.push(Ee) : s.entities.push(Ee);
  }
  const n = [];
  for (const p of i.values())
    p.entities.length > 0 && (Re(p.entities), n.push(p));
  return s.entities.length > 0 && (Re(s.entities), n.push(s)), e.area_order && e.area_order.length > 0 && n.sort((p, h) => {
    const v = e.area_order.indexOf(p.id), w = e.area_order.indexOf(h.id);
    return v !== -1 && w !== -1 ? v - w : v !== -1 ? -1 : w !== -1 ? 1 : p.name.localeCompare(h.name);
  }), n;
}
function Re(r) {
  const e = {
    "2x2": 1,
    "2x1": 2,
    "1x1": 3
  };
  r.sort((t, i) => {
    const s = e[t.size] - e[i.size];
    return s !== 0 ? s : t.name.localeCompare(i.name);
  });
}
function Mt(r) {
  const e = r.toLowerCase();
  return e.includes("khách") || e.includes("living") ? "mdi:sofa" : e.includes("ngủ") || e.includes("bed") ? "mdi:bed" : e.includes("bếp") || e.includes("kitchen") ? "mdi:silverware-fork-knife" : e.includes("tắm") || e.includes("bath") || e.includes("wc") ? "mdi:shower" : e.includes("sân") || e.includes("vườn") || e.includes("yard") || e.includes("garden") ? "mdi:tree" : e.includes("gara") || e.includes("garage") || e.includes("xe") ? "mdi:garage" : e.includes("làm việc") || e.includes("office") || e.includes("desk") ? "mdi:desk" : e.includes("ninh") || e.includes("cổng") || e.includes("gate") || e.includes("security") ? "mdi:shield-home" : "mdi:home-outline";
}
function Ht(r, e) {
  switch (r) {
    case "light":
      return e === "on" ? "mdi:lightbulb-on" : "mdi:lightbulb-outline";
    case "switch":
      return "mdi:power";
    case "climate":
      return "mdi:air-conditioner";
    case "cover":
      return e === "open" ? "mdi:curtains-open" : "mdi:curtains";
    case "media_player":
      return "mdi:television-ambient-light";
    case "camera":
      return "mdi:cctv";
    case "fan":
      return "mdi:fan";
    case "lock":
      return e === "locked" ? "mdi:lock" : "mdi:lock-open-variant";
    case "water_heater":
      return "mdi:water-boiler";
    case "binary_sensor":
      return "mdi:motion-sensor";
    case "sensor":
    default:
      return "mdi:gauge";
  }
}
function Et(r) {
  let e = 0, t = 0;
  for (const i of r)
    for (const s of i.entities)
      s.domain === "light" && s.state === "on" && e++, (s.domain === "switch" && s.state === "on" || s.domain === "fan" && s.state === "on" || s.domain === "climate" && s.state !== "off" || s.domain === "media_player" && (s.state === "playing" || s.state === "on")) && t++;
  return { lightsOn: e, totalActive: t };
}
function Ue(r = "auto", e, t) {
  const i = e ?? (typeof window < "u" ? window.innerWidth : 1200), s = t ?? (typeof window < "u" ? window.innerHeight : 800), n = typeof navigator < "u" ? navigator.userAgent.toLowerCase() : "", a = n.includes("android tv") || n.includes("smart-tv") || n.includes("googletv") || n.includes("crkey") || n.includes("hbbtv") || n.includes("tizen"), o = r === "tv" || a;
  let c, g;
  o ? (c = "tv", g = 4) : i < 768 ? (c = "phone", g = 2) : i < 1440 ? (c = "tablet", g = 4) : (c = "desktop", g = 6);
  const p = typeof window < "u" && ("ontouchstart" in window || navigator.maxTouchPoints > 0);
  return {
    width: i,
    height: s,
    device: c,
    gridColumns: g,
    isTouch: p,
    isTV: o
  };
}
function Vt(r, e) {
  return r !== "auto" ? r : e.isTV ? "tv" : e.device === "phone" ? "focus" : "sidebar";
}
class Lt {
  constructor(e) {
    this.currentFocus = null, this.isEnabled = !0, this.container = e, this.keydownHandler = this.handleKeyDown.bind(this), this.attach();
  }
  attach() {
    window.addEventListener("keydown", this.keydownHandler);
  }
  destroy() {
    window.removeEventListener("keydown", this.keydownHandler), this.clearFocus();
  }
  setEnabled(e) {
    this.isEnabled = e, e || this.clearFocus();
  }
  handleKeyDown(e) {
    var s;
    if (!this.isEnabled)
      return;
    const t = (s = document.activeElement) == null ? void 0 : s.tagName.toLowerCase();
    if (t === "input" || t === "textarea" || t === "select")
      return;
    const i = e.key;
    i === "ArrowUp" || i === "Up" ? (e.preventDefault(), this.moveFocus("up")) : i === "ArrowDown" || i === "Down" ? (e.preventDefault(), this.moveFocus("down")) : i === "ArrowLeft" || i === "Left" ? (e.preventDefault(), this.moveFocus("left")) : i === "ArrowRight" || i === "Right" ? (e.preventDefault(), this.moveFocus("right")) : (i === "Enter" || i === " " || i === "Select") && this.currentFocus && (e.preventDefault(), this.currentFocus.click());
  }
  moveFocus(e) {
    const t = this.getFocusableElements();
    if (t.length === 0)
      return;
    if (!this.currentFocus || !this.container.contains(this.currentFocus)) {
      this.setFocus(t[0]);
      return;
    }
    const i = this.currentFocus.getBoundingClientRect();
    let s = null, n = 1 / 0;
    for (const a of t) {
      if (a === this.currentFocus)
        continue;
      const o = a.getBoundingClientRect();
      if (o.width === 0 || o.height === 0 || !this.isInDirection(i, o, e))
        continue;
      const g = this.calculateSpatialDistance(i, o, e);
      g < n && (n = g, s = a);
    }
    s && this.setFocus(s);
  }
  getFocusableElements() {
    const e = [
      ".glass-card",
      "button",
      '[tabindex="0"]',
      ".sidebar-item",
      ".tv-tab-item"
    ].join(",");
    return Array.from(this.container.querySelectorAll(e)).filter((i) => {
      const s = window.getComputedStyle(i);
      return s.display !== "none" && s.visibility !== "hidden" && s.opacity !== "0" && !i.hasAttribute("disabled");
    });
  }
  isInDirection(e, t, i) {
    const s = { x: e.left + e.width / 2, y: e.top + e.height / 2 }, n = { x: t.left + t.width / 2, y: t.top + t.height / 2 };
    switch (i) {
      case "up":
        return n.y < s.y - 10;
      case "down":
        return n.y > s.y + 10;
      case "left":
        return n.x < s.x - 10;
      case "right":
        return n.x > s.x + 10;
    }
  }
  calculateSpatialDistance(e, t, i) {
    const s = { x: e.left + e.width / 2, y: e.top + e.height / 2 }, n = { x: t.left + t.width / 2, y: t.top + t.height / 2 }, a = Math.abs(n.x - s.x), o = Math.abs(n.y - s.y);
    return i === "up" || i === "down" ? o + a * 2.2 : a + o * 2.2;
  }
  setFocus(e) {
    this.clearFocus(), this.currentFocus = e, this.currentFocus.classList.add("dpad-focused"), this.currentFocus.focus(), this.currentFocus.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "nearest"
    });
  }
  clearFocus() {
    this.currentFocus && (this.currentFocus.classList.remove("dpad-focused"), this.currentFocus = null);
  }
}
function f(r, e = 24, t = "") {
  const i = r.toLowerCase().replace("mdi:", ""), s = Be[i] || Be.default;
  return l`
    <svg
      class="hs-icon ${t}"
      viewBox="0 0 24 24"
      width="${e}"
      height="${e}"
      fill="currentColor"
      style="display: inline-block; vertical-align: middle; flex-shrink: 0;"
    >
      <path d="${s}" />
    </svg>
  `;
}
const Be = {
  // Navigation / Rooms
  sofa: "M20 10V7A2 2 0 0 0 18 5H6A2 2 0 0 0 4 7V10A4 4 0 0 0 2 14V17A1 1 0 0 0 3 18H4V19A1 1 0 0 0 5 20H6A1 1 0 0 0 7 19V18H17V19A1 1 0 0 0 18 20H19A1 1 0 0 0 20 19V18H21A1 1 0 0 0 22 17V14A4 4 0 0 0 20 10M6 7H18V10H6V7M20 16H4V14A2 2 0 0 1 6 12H18A2 2 0 0 1 20 14V16Z",
  bed: "M19 7H11V14H3V5H1V20H3V17H21V20H23V11A4 4 0 0 0 19 7M7 13A3 3 0 1 1 10 10A3 3 0 0 1 7 13Z",
  "silverware-fork-knife": "M11 9H9V2H7V9H5V2H3V9C3 11.12 4.66 12.84 6.75 12.97V22H9.25V12.97C11.34 12.84 13 11.12 13 9V2H11V9M16 6V14H18.5V22H21V2C18.24 2 16 4.24 16 6Z",
  shower: "M12 2A4 4 0 0 0 8 6V9H6A2 2 0 0 0 4 11V12A1 1 0 0 0 5 13H19A1 1 0 0 0 20 12V11A2 2 0 0 0 18 9H16V6A4 4 0 0 0 12 2M10 6A2 2 0 0 1 14 6V9H10V6M6 16A1 1 0 1 0 7 17A1 1 0 0 0 6 16M12 16A1 1 0 1 0 13 17A1 1 0 0 0 12 16M18 16A1 1 0 1 0 19 17A1 1 0 0 0 18 16M9 19A1 1 0 1 0 10 20A1 1 0 0 0 9 19M15 19A1 1 0 1 0 16 20A1 1 0 0 0 15 19Z",
  "shield-home": "M12 2L4 5V11.09C4 16.14 7.41 20.85 12 22C16.59 20.85 20 16.14 20 11.09V5L12 2M12 7L17 11V17H13V13H11V17H7V11L12 7Z",
  tree: "M11 21V16.74C7.53 16.3 5 13.39 5 10C5 6.87 7.15 4.25 10.1 3.58A6 6 0 0 1 21 8C21 11.16 18.73 13.8 15.69 14.36L13 21H11Z",
  garage: "M19 20H17V11H7V20H5V9L12 5L19 9V20M8 12H16V14H8V12M8 15H16V17H8V15M8 18H16V19H8V18M22 9V20A2 2 0 0 1 20 22H4A2 2 0 0 1 2 20V9L12 3L22 9Z",
  desk: "M2 6V8H4V18H6V8H18V18H20V8H22V6H2M6 10H18V12H6V10M6 14H18V16H6V14Z",
  devices: "M4 6H20V16H4M20 18A2 2 0 0 0 22 16V6C22 4.89 21.1 4 20 4H4C2.89 4 2 4.89 2 6V16A2 2 0 0 0 4 18H0V20H24V18H20Z",
  "home-outline": "M12 5.69L17 10.19V18H15V12H9V18H7V10.19L12 5.69M12 3L2 12H5V20H11V14H13V20H19V12H22L12 3Z",
  // Devices & Entities
  "lightbulb-on": "M12 2A7 7 0 0 0 5 9C5 11.38 6.19 13.47 8 14.74V17A1 1 0 0 0 9 18H15A1 1 0 0 0 16 17V14.74C17.81 13.47 19 11.38 19 9A7 7 0 0 0 12 2M9 21A1 1 0 0 0 10 22H14A1 1 0 0 0 15 21V20H9V21Z",
  "lightbulb-outline": "M12 2A7 7 0 0 0 5 9C5 11.38 6.19 13.47 8 14.74V17A1 1 0 0 0 9 18H15A1 1 0 0 0 16 17V14.74C17.81 13.47 19 11.38 19 9A7 7 0 0 0 12 2M7 9A5 5 0 0 1 17 9C17 10.87 15.93 12.53 14.39 13.54L14 13.8V16H10V13.8L9.61 13.54C8.07 12.53 7 10.87 7 9M9 21A1 1 0 0 0 10 22H14A1 1 0 0 0 15 21V20H9V21Z",
  power: "M16.56 5.44L15.15 6.85C16.89 8.37 18 10.56 18 13A6 6 0 0 1 6 13C6 10.56 7.11 8.37 8.84 6.85L7.44 5.44C5.31 7.29 4 10 4 13A8 8 0 0 0 12 21A8 8 0 0 0 20 13C20 10 18.69 7.29 16.56 5.44M13 3H11V11H13V3Z",
  fan: "M12 11A1 1 0 0 0 11 12A1 1 0 0 0 12 13A1 1 0 0 0 13 12A1 1 0 0 0 12 11M12 2A10 10 0 0 0 2 12A10 10 0 0 0 12 22A10 10 0 0 0 22 12A10 10 0 0 0 12 2M16.25 16.25C15.22 17.28 13.62 17.5 12.35 16.83L13.88 15.3C14.39 15.29 14.86 14.98 15.13 14.47C15.5 13.78 15.35 12.92 14.77 12.37L16.25 10.89C17.39 12.5 17.26 14.73 16.25 16.25M7.75 7.75C8.78 6.72 10.38 6.5 11.65 7.17L10.12 8.7C9.61 8.71 9.14 9.02 8.87 9.53C8.5 10.22 8.65 11.08 9.23 11.63L7.75 13.11C6.61 11.5 6.74 9.27 7.75 7.75Z",
  "air-conditioner": "M19 4H5A3 3 0 0 0 2 7V14A3 3 0 0 0 5 17H7V18H9V17H15V18H17V17H19A3 3 0 0 0 22 14V7A3 3 0 0 0 19 4M20 14A1 1 0 0 1 19 15H5A1 1 0 0 1 4 14V13H20V14M20 11H4V7A1 1 0 0 1 5 6H19A1 1 0 0 1 20 7V11M8 8H6V10H8V8M18 8H10V10H18V8Z",
  curtains: "M20 19V3H4V19H2V21H22V19H20M6 5H11V19H6V5M18 19H13V5H18V19Z",
  "curtains-open": "M20 19V3H4V19H2V21H22V19H20M6 5H8.5V19H6V5M18 19H15.5V5H18V19Z",
  "television-ambient-light": "M21 3H3C1.9 3 1 3.9 1 5V17C1 18.1 1.9 19 3 19H8V21H16V19H21C22.1 19 23 18.1 23 17V5C23 3.9 22.1 3 21 3M21 17H3V5H21V17Z",
  cctv: "M17.41 6.59L15 4.17L10.76 8.41L13.17 10.83L17.41 6.59M4 14V20H6V16H10.59L8.41 13.83L4 18.24V14H4M19.78 4.22C19.39 3.83 18.76 3.83 18.37 4.22L16.24 6.35L17.65 7.76L19.78 5.63C20.17 5.24 20.17 4.61 19.78 4.22M2 2V4H3.59L7.17 7.59L4.59 10.17L6 11.59L8.59 9L11.59 12L13 10.59L10 7.59L12.59 5L11.17 3.59L8.59 6.17L5 2.59V2H2Z",
  lock: "M12 17A2 2 0 0 0 14 15A2 2 0 0 0 12 13A2 2 0 0 0 10 15A2 2 0 0 0 12 17M18 8H17V6A5 5 0 0 0 7 6V8H6A2 2 0 0 0 4 10V20A2 2 0 0 0 6 22H18A2 2 0 0 0 20 20V10A2 2 0 0 0 18 8M9 6A3 3 0 0 1 15 6V8H9V6Z",
  "lock-open-variant": "M18 10V8A6 6 0 0 0 6 8H8A4 4 0 0 1 16 8V10H6A2 2 0 0 0 4 12V20A2 2 0 0 0 6 22H18A2 2 0 0 0 20 20V12A2 2 0 0 0 18 10M12 17A2 2 0 0 1 10 15A2 2 0 0 1 12 13A2 2 0 0 1 14 15A2 2 0 0 1 12 17Z",
  "water-boiler": "M8 2H16A4 4 0 0 1 20 6V18A4 4 0 0 1 16 22H8A4 4 0 0 1 4 18V6A4 4 0 0 1 8 2M12 4A2 2 0 0 0 10 6A2 2 0 0 0 12 8A2 2 0 0 0 14 6A2 2 0 0 0 12 4M12 14A3 3 0 0 0 9 17A3 3 0 0 0 12 20A3 3 0 0 0 15 17A3 3 0 0 0 12 14Z",
  "motion-sensor": "M12 2A2 2 0 0 1 14 4A2 2 0 0 1 12 6A2 2 0 0 1 10 4A2 2 0 0 1 12 2M10.5 7H13.5C14.6 7 15.5 7.9 15.5 9V14.5L14 13V9H10V13L8.5 14.5V9C8.5 7.9 9.4 7 10.5 7M4 12A8 8 0 0 1 12 4V2A10 10 0 0 0 2 12H4M20 12A8 8 0 0 0 12 4V2A10 10 0 0 1 22 12H20Z",
  gauge: "M12 2A10 10 0 0 0 2 12A10 10 0 0 0 12 22A10 10 0 0 0 22 12A10 10 0 0 0 12 2M12 4A8 8 0 0 1 20 12C20 13.9 19.34 15.65 18.24 17.03L15.03 13.82C15.64 12.86 15.82 11.66 15.42 10.54C14.88 9.04 13.43 8.07 11.83 8.16L10.74 4.09C11.16 4.03 11.58 4 12 4M12 10A2 2 0 0 1 14 12A2 2 0 0 1 12 14A2 2 0 0 1 10 12A2 2 0 0 1 12 10Z",
  // UI Icons
  cog: "M12 15.5A3.5 3.5 0 0 1 8.5 12A3.5 3.5 0 0 1 12 8.5A3.5 3.5 0 0 1 15.5 12A3.5 3.5 0 0 1 12 15.5M19.43 12.97C19.47 12.65 19.5 12.33 19.5 12C19.5 11.67 19.47 11.34 19.43 11L21.54 9.37C21.73 9.22 21.78 8.95 21.66 8.73L19.66 5.27C19.54 5.05 19.27 4.96 19.05 5.05L16.56 6.05C16.04 5.66 15.5 5.32 14.87 5.07L14.5 2.42C14.46 2.18 14.25 2 14 2H10C9.75 2 9.54 2.18 9.5 2.42L9.13 5.07C8.5 5.32 7.96 5.66 7.44 6.05L4.95 5.05C4.73 4.96 4.46 5.05 4.34 5.27L2.34 8.73C2.21 8.95 2.27 9.22 2.46 9.37L4.57 11C4.53 11.34 4.5 11.67 4.5 12C4.5 12.33 4.53 12.65 4.57 12.97L2.46 14.63C2.27 14.78 2.21 15.05 2.34 15.27L4.34 18.73C4.46 18.95 4.73 19.03 4.95 18.95L7.44 17.94C7.96 18.34 8.5 18.68 9.13 18.93L9.5 21.58C9.54 21.82 9.75 22 10 22H14C14.25 22 14.46 21.82 14.5 21.58L14.87 18.93C15.5 18.67 16.04 18.34 16.56 17.94L19.05 18.95C19.27 19.03 19.54 18.95 19.66 18.73L21.66 15.27C21.78 15.05 21.73 14.78 21.54 14.63L19.43 12.97Z",
  play: "M8 5.14V19.14L19 12.14L8 5.14Z",
  pause: "M14 19H18V5H14M6 19H10V5H6V19Z",
  "skip-next": "M16 18H18V6H16M6 18L14.5 12L6 6V18Z",
  "skip-previous": "M6 6H8V18H6M9.5 12L18 18V6L9.5 12Z",
  "volume-high": "M14 3.23V5.29C16.89 6.15 19 8.83 19 12C19 15.17 16.89 17.84 14 18.7V20.77C18 19.86 21 16.28 21 12C21 7.72 18 4.14 14 3.23M16.5 12C16.5 10.23 15.5 8.71 14 7.97V16C15.5 15.29 16.5 13.76 16.5 12M3 9V15H7L12 20V4L7 9H3Z",
  "volume-mute": "M12 4L9.91 6.09L12 8.18M4.27 3L3 4.27L7.73 9H3V15H7L12 20V13.27L16.25 17.53C15.58 18.04 14.83 18.46 14 18.7V20.77C15.38 20.45 16.63 19.82 17.68 18.96L19.73 21L21 19.73L4.27 3M19 12C19 12.82 18.73 13.69 18.41 14.46L19.9 15.95C20.61 14.8 21 13.46 21 12C21 7.72 18 4.14 14 3.23V5.29C16.89 6.15 19 8.83 19 12M16.5 12C16.5 10.23 15.5 8.71 14 7.97V10.18L16.45 12.63C16.5 12.43 16.5 12.21 16.5 12Z",
  fullscreen: "M5 5H10V7H7V10H5V5M14 5H19V10H17V7H14V5M17 14H19V19H14V17H17V14M10 17V19H5V14H7V17H10Z",
  "shield-check": "M12 1L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 1M10 17L6 13L7.41 11.59L10 14.17L16.59 7.58L18 9L10 17Z",
  close: "M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z",
  check: "M21 7L9 19L3.5 13.5L4.91 12.09L9 16.17L19.59 5.59L21 7Z",
  plus: "M19 13H13V19H11V13H5V11H11V5H13V11H19V13Z",
  minus: "M19 13H5V11H19V13Z",
  "arrow-up": "M7.41 15.41L12 10.83L16.59 15.41L18 14L12 8L6 14L7.41 15.41Z",
  "arrow-down": "M7.41 8.59L12 13.17L16.59 8.59L18 10L12 16L6 10L7.41 8.59Z",
  "arrow-left": "M15.41 16.59L10.83 12L15.41 7.41L14 6L8 12L14 18L15.41 16.59Z",
  "arrow-right": "M8.59 16.59L13.17 12L8.59 7.41L10 6L16 12L10 18L8.59 16.59Z",
  eye: "M12 4.5C7 4.5 2.73 7.61 1 12C2.73 16.39 7 19.5 12 19.5C17 19.5 21.27 16.39 23 12C21.27 7.61 17 4.5 12 4.5M12 17C9.24 17 7 14.76 7 12C7 9.24 9.24 7 12 7C14.76 7 17 9.24 17 12C17 14.76 14.76 17 12 17M12 9C10.34 9 9 10.34 9 12C9 13.66 10.34 15 12 15C13.66 15 15 13.66 15 12C15 10.34 13.66 9 12 9Z",
  "eye-off": "M11.83 9L15 12.16C15 12.11 15 12.05 15 12A3 3 0 0 0 12 9C11.94 9 11.89 9 11.83 9M7.53 9.8L9.08 11.35C9.03 11.56 9 11.77 9 12A3 3 0 0 0 12 15C12.22 15 12.44 14.97 12.65 14.92L14.2 16.47C13.53 16.8 12.79 17 12 17A5 5 0 0 1 7 12C7 11.21 7.2 10.47 7.53 9.8M2 4.27L4.28 6.55L4.73 7C3.08 8.3 1.78 10 1 12C2.73 16.39 7 19.5 12 19.5C13.55 19.5 15.03 19.2 16.38 18.66L16.8 19.08L19.73 22L21 20.73L3.27 3M12 7A5 5 0 0 1 17 12C17 12.64 16.87 13.26 16.64 13.82L19.56 16.75C21.07 15.5 22.27 13.87 23 12C21.27 7.61 17 4.5 12 4.5C10.6 4.5 9.26 4.75 8.04 5.24L10.16 7.36C10.74 7.13 11.35 7 12 7Z",
  "weather-sunny": "M12 7A5 5 0 0 1 17 12A5 5 0 0 1 12 17A5 5 0 0 1 7 12A5 5 0 0 1 12 7M12 9A3 3 0 0 0 9 12A3 3 0 0 0 12 15A3 3 0 0 0 15 12A3 3 0 0 0 12 9M12 2L14.39 5.42C13.65 5.15 12.84 5 12 5C11.16 5 10.35 5.15 9.61 5.42L12 2M3.34 7L7.5 6.65C6.9 7.16 6.36 7.78 5.94 8.5C5.5 9.24 5.25 10 5.11 10.79L3.34 7M3.36 17L5.12 13.23C5.26 14 5.53 14.77 5.95 15.5C6.37 16.24 6.91 16.86 7.5 17.37L3.36 17M20.65 7L18.88 10.79C18.74 10 18.47 9.23 18.05 8.5C17.63 7.76 17.1 7.14 16.5 16.63L20.65 7M20.64 17L16.5 17.35C17.1 16.84 17.64 16.22 18.06 15.5C18.5 14.76 18.75 14 18.89 13.21L20.64 17M12 22L9.59 18.56C10.33 18.83 11.14 19 12 19C12.82 19 13.63 18.83 14.37 18.56L12 22Z",
  // Default fallback
  default: "M12 2A10 10 0 1 0 22 12A10 10 0 0 0 12 2M12 20A8 8 0 1 1 20 12A8 8 0 0 1 12 20M11 6H13V14H11M11 16H13V18H11Z"
};
var z = function(r, e, t, i) {
  var s = arguments.length, n = s < 3 ? e : i === null ? i = Object.getOwnPropertyDescriptor(e, t) : i, a;
  if (typeof Reflect == "object" && typeof Reflect.decorate == "function") n = Reflect.decorate(r, e, t, i);
  else for (var o = r.length - 1; o >= 0; o--) (a = r[o]) && (n = (s < 3 ? a(n) : s > 3 ? a(e, t, n) : a(e, t)) || n);
  return s > 3 && n && Object.defineProperty(e, t, n), n;
}, G;
let C = (G = class extends _ {
  constructor() {
    super(...arguments), this.areas = [], this.selectedAreaId = "", this.device = "desktop", this.locale = "vi", this.lightsOn = 0, this.totalActive = 0, this.editMode = !1;
  }
  render() {
    return this.device === "phone" ? this.renderMobileBar() : this.renderDesktopSidebar();
  }
  renderDesktopSidebar() {
    return l`
      <div class="sidebar-wrapper">
        <div>
          <div class="brand-header">
            <div class="brand-logo">
              ${f("shield-home", 22)}
            </div>
            <span class="brand-title">${d("app_title", this.locale)}</span>
            <span class="brand-version">PRO</span>
          </div>

          <div class="nav-list">
            <!-- All Areas tab -->
            <button
              class="nav-item ${this.selectedAreaId === "" ? "active" : ""}"
              @click="${() => this.selectArea("")}"
            >
              <div class="nav-item-left">
                ${f("home-outline", 20)}
                <span class="nav-label">${d("all_areas", this.locale)}</span>
              </div>
            </button>

            <!-- Specific Areas -->
            ${this.areas.map((e) => l`
                <button
                  class="nav-item ${this.selectedAreaId === e.id ? "active" : ""}"
                  @click="${() => this.selectArea(e.id)}"
                >
                  <div class="nav-item-left">
                    ${f(e.icon, 20)}
                    <span class="nav-label">${e.name}</span>
                  </div>
                  <span class="nav-badge">${e.entities.length}</span>
                </button>
              `)}
          </div>
        </div>

        <div class="sidebar-footer">
          <div class="stats-chip-row">
            <div class="stat-chip">
              <span class="stat-val">${this.lightsOn}</span>
              <span class="stat-lbl">${d("lights_active", this.locale)}</span>
            </div>
            <div class="stat-chip">
              <span class="stat-val">${this.totalActive}</span>
              <span class="stat-lbl">${d("devices_active", this.locale)}</span>
            </div>
          </div>

          <button
            class="edit-toggle-btn ${this.editMode ? "editing" : ""}"
            @click="${this.toggleEdit}"
          >
            ${f("cog", 18)}
            <span>${this.editMode ? d("exit_edit", this.locale) : d("visual_editor", this.locale)}</span>
          </button>
        </div>
      </div>
    `;
  }
  renderMobileBar() {
    return l`
      <div class="mobile-bar">
        <button
          class="mobile-tab ${this.selectedAreaId === "" ? "active" : ""}"
          @click="${() => this.selectArea("")}"
        >
          ${f("home-outline", 18)}
          <span class="mobile-tab-label">${d("all_areas", this.locale)}</span>
        </button>

        ${this.areas.map((e) => l`
            <button
              class="mobile-tab ${this.selectedAreaId === e.id ? "active" : ""}"
              @click="${() => this.selectArea(e.id)}"
            >
              ${f(e.icon, 18)}
              <span class="mobile-tab-label">${e.name}</span>
            </button>
          `)}

        <button class="mobile-gear" @click="${this.toggleEdit}">
          ${f("cog", 18)}
        </button>
      </div>
    `;
  }
  selectArea(e) {
    this.dispatchEvent(new CustomEvent("area-selected", {
      bubbles: !0,
      composed: !0,
      detail: { areaId: e }
    }));
  }
  toggleEdit() {
    this.dispatchEvent(new CustomEvent("toggle-edit-mode", {
      bubbles: !0,
      composed: !0
    }));
  }
}, G.styles = k`
    :host {
      display: block;
      box-sizing: border-box;
      z-index: 100;
    }

    /* Desktop / Tablet Left Sidebar */
    .sidebar-wrapper {
      width: 260px;
      height: 100vh;
      position: sticky;
      top: 0;
      background: var(--hs-sidebar-bg, rgba(13, 10, 33, 0.75));
      backdrop-filter: blur(24px) saturate(180%);
      -webkit-backdrop-filter: blur(24px) saturate(180%);
      border-right: 1px solid var(--hs-glass-border, rgba(255, 255, 255, 0.12));
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 24px 16px;
      box-sizing: border-box;
    }

    .brand-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 0 8px 20px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }

    .brand-logo {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      background: var(--hs-active-gradient, linear-gradient(135deg, #00f2fe 0%, #4facfe 100%));
      display: flex;
      align-items: center;
      justify-content: center;
      color: #05040d;
      box-shadow: 0 0 16px var(--hs-glow-color, rgba(0, 242, 254, 0.45));
    }

    .brand-title {
      font-size: 19px;
      font-weight: 800;
      color: #ffffff;
      font-family: var(--hs-font-display, sans-serif);
      letter-spacing: -0.5px;
    }

    .brand-version {
      font-size: 10px;
      font-weight: 700;
      color: var(--hs-accent, #00f2fe);
      background: rgba(0, 242, 254, 0.15);
      padding: 2px 6px;
      border-radius: 6px;
      margin-left: 4px;
    }

    /* Area List */
    .nav-list {
      flex: 1;
      overflow-y: auto;
      margin: 16px 0;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .nav-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 14px;
      border-radius: var(--hs-radius-md, 16px);
      background: transparent;
      border: 1px solid transparent;
      color: var(--hs-text-secondary, rgba(255, 255, 255, 0.7));
      cursor: pointer;
      transition: all var(--hs-transition-fast, 0.15s ease);
      text-decoration: none;
      outline: none;
    }

    .nav-item:hover {
      background: rgba(255, 255, 255, 0.08);
      color: #fff;
    }

    .nav-item.active {
      background: var(--hs-glass-bg-active, rgba(45, 36, 92, 0.85));
      border-color: var(--hs-glass-border-active, rgba(0, 242, 254, 0.65));
      color: #ffffff;
      box-shadow: 0 0 16px var(--hs-glow-color, rgba(0, 242, 254, 0.35));
    }

    .nav-item-left {
      display: flex;
      align-items: center;
      gap: 12px;
      min-width: 0;
    }

    .nav-label {
      font-size: 14px;
      font-weight: 600;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .nav-badge {
      font-size: 11px;
      background: rgba(255, 255, 255, 0.12);
      padding: 2px 7px;
      border-radius: 10px;
      color: var(--hs-text-muted, rgba(255, 255, 255, 0.6));
    }

    .nav-item.active .nav-badge {
      background: var(--hs-accent, #00f2fe);
      color: #000;
      font-weight: 700;
    }

    /* Footer / Summary */
    .sidebar-footer {
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      padding-top: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .stats-chip-row {
      display: flex;
      gap: 8px;
    }

    .stat-chip {
      flex: 1;
      padding: 8px 10px;
      border-radius: 12px;
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.1);
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
    }

    .stat-val {
      font-size: 16px;
      font-weight: 800;
      color: var(--hs-accent, #00f2fe);
      font-family: var(--hs-font-display, sans-serif);
    }

    .stat-lbl {
      font-size: 10px;
      color: var(--hs-text-muted, rgba(255, 255, 255, 0.5));
    }

    .edit-toggle-btn {
      width: 100%;
      padding: 10px 14px;
      border-radius: 12px;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.15);
      color: #fff;
      font-size: 13px;
      font-weight: 600;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .edit-toggle-btn:hover,
    .edit-toggle-btn.editing {
      background: var(--hs-active-gradient, linear-gradient(135deg, #00f2fe 0%, #4facfe 100%));
      color: #05040d;
      border-color: transparent;
      box-shadow: 0 0 16px var(--hs-glow-color, rgba(0, 242, 254, 0.4));
    }

    /* Mobile Bottom Navigation Bar */
    .mobile-bar {
      position: fixed;
      bottom: 12px;
      left: 12px;
      right: 12px;
      height: 64px;
      background: var(--hs-sidebar-bg, rgba(13, 10, 33, 0.88));
      backdrop-filter: blur(28px) saturate(180%);
      -webkit-backdrop-filter: blur(28px) saturate(180%);
      border: 1px solid var(--hs-glass-border, rgba(255, 255, 255, 0.18));
      border-radius: 24px;
      display: flex;
      align-items: center;
      padding: 0 8px;
      box-sizing: border-box;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6);
      overflow-x: auto;
      gap: 4px;
    }

    .mobile-tab {
      flex: 1;
      min-width: 68px;
      height: 48px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 2px;
      border-radius: 16px;
      color: var(--hs-text-muted, rgba(255, 255, 255, 0.5));
      background: transparent;
      border: none;
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.15s ease;
    }

    .mobile-tab.active {
      color: var(--hs-accent, #00f2fe);
      background: rgba(0, 242, 254, 0.12);
    }

    .mobile-tab-label {
      font-size: 10px;
      font-weight: 600;
    }

    .mobile-gear {
      min-width: 44px;
      height: 44px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 50%;
      border: none;
      cursor: pointer;
    }
  `, G);
z([
  u({ type: Array })
], C.prototype, "areas", void 0);
z([
  u({ type: String })
], C.prototype, "selectedAreaId", void 0);
z([
  u({ type: String })
], C.prototype, "device", void 0);
z([
  u({ type: String })
], C.prototype, "locale", void 0);
z([
  u({ type: Number })
], C.prototype, "lightsOn", void 0);
z([
  u({ type: Number })
], C.prototype, "totalActive", void 0);
z([
  u({ type: Boolean })
], C.prototype, "editMode", void 0);
C = z([
  H("homesmart-sidebar-nav")
], C);
var ue = function(r, e, t, i) {
  var s = arguments.length, n = s < 3 ? e : i === null ? i = Object.getOwnPropertyDescriptor(e, t) : i, a;
  if (typeof Reflect == "object" && typeof Reflect.decorate == "function") n = Reflect.decorate(r, e, t, i);
  else for (var o = r.length - 1; o >= 0; o--) (a = r[o]) && (n = (s < 3 ? a(n) : s > 3 ? a(e, t, n) : a(e, t)) || n);
  return s > 3 && n && Object.defineProperty(e, t, n), n;
}, q;
let ie = (q = class extends _ {
  constructor() {
    super(...arguments), this.editMode = !1, this.locale = "vi";
  }
  render() {
    const e = this.computeIsActive(), t = this.computeStateLabel();
    return l`
      <div
        class="glass-card card-inner ${e ? "active" : ""}"
        tabindex="0"
        @click="${this.handleClick}"
      >
        <div class="top-row">
          <div class="icon-container">
            ${f(this.entity.icon, 24)}
          </div>
          ${this.entity.protection.type !== "none" ? l`
                <div class="protection-badge">
                  ${f("shield-check", 14)}
                  <span>${this.entity.protection.type === "pin" ? "PIN" : "2x"}</span>
                </div>
              ` : ""}
        </div>

        <div class="bottom-info">
          <span class="entity-name" title="${this.entity.name}">${this.entity.name}</span>
          <span class="entity-state">${t}</span>
        </div>

        ${this.editMode ? this.renderEditControls() : ""}
      </div>
    `;
  }
  computeIsActive() {
    const e = this.entity.state.toLowerCase();
    return this.entity.domain === "lock" ? e === "locked" : e === "on" || e === "open" || e === "active" || e === "playing";
  }
  computeStateLabel() {
    const e = this.entity.state, t = `state_${e.toLowerCase()}`, i = d(t, this.locale);
    return i !== t ? i : this.entity.domain === "sensor" && this.entity.attributes.unit_of_measurement ? `${e} ${this.entity.attributes.unit_of_measurement}` : e;
  }
  handleClick(e) {
    if (!this.editMode) {
      if (this.entity.protection.type !== "none") {
        this.dispatchEvent(new CustomEvent("request-protected-action", {
          bubbles: !0,
          composed: !0,
          detail: {
            entity: this.entity,
            action: () => this.executeToggle()
          }
        }));
        return;
      }
      this.executeToggle();
    }
  }
  executeToggle() {
    if (!this.hass)
      return;
    const e = this.entity.domain, t = this.entity.entity_id;
    if (e === "light" || e === "switch" || e === "fan")
      this.hass.callService(e, "toggle", { entity_id: t });
    else if (e === "lock") {
      const i = this.entity.state === "locked" ? "unlock" : "lock";
      this.hass.callService("lock", i, { entity_id: t });
    }
  }
  renderEditControls() {
    return l`
      <div class="edit-controls" @click="${(e) => e.stopPropagation()}">
        <button
          class="edit-btn"
          title="${d("card_size", this.locale)}"
          @click="${() => this.changeSize("2x1")}"
        >
          2x1
        </button>
        <button
          class="edit-btn"
          title="${d("card_size", this.locale)}"
          @click="${() => this.changeSize("2x2")}"
        >
          2x2
        </button>
        <button
          class="edit-btn"
          title="${d("card_protection", this.locale)}"
          @click="${this.cycleProtection}"
        >
          🛡️
        </button>
        <button
          class="edit-btn"
          title="${d("hide_card", this.locale)}"
          @click="${this.toggleHide}"
        >
          👁️
        </button>
      </div>
    `;
  }
  changeSize(e) {
    this.dispatchEvent(new CustomEvent("card-config-change", {
      bubbles: !0,
      composed: !0,
      detail: {
        entity_id: this.entity.entity_id,
        size: e
      }
    }));
  }
  cycleProtection() {
    const e = this.entity.protection.type === "none" ? "confirm" : this.entity.protection.type === "confirm" ? "pin" : "none";
    this.dispatchEvent(new CustomEvent("card-config-change", {
      bubbles: !0,
      composed: !0,
      detail: {
        entity_id: this.entity.entity_id,
        protection: { type: e, pin: "1234" }
      }
    }));
  }
  toggleHide() {
    this.dispatchEvent(new CustomEvent("card-config-change", {
      bubbles: !0,
      composed: !0,
      detail: {
        entity_id: this.entity.entity_id,
        hidden: !this.entity.hidden
      }
    }));
  }
}, q.styles = k`
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }

    .card-inner {
      width: 100%;
      height: 100%;
      min-height: 120px;
      box-sizing: border-box;
      padding: 16px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      cursor: pointer;
      border-radius: var(--hs-radius-lg, 24px);
      position: relative;
    }

    .top-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
    }

    .icon-container {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.12);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--hs-text-muted, rgba(255, 255, 255, 0.5));
      transition: all var(--hs-transition-normal, 0.25s ease);
    }

    .active .icon-container {
      background: var(--hs-active-gradient, linear-gradient(135deg, #00f2fe 0%, #4facfe 100%));
      color: #05040d;
      border-color: transparent;
      box-shadow: 0 0 16px var(--hs-glow-color, rgba(0, 242, 254, 0.45));
    }

    .protection-badge {
      color: var(--hs-accent, #00f2fe);
      background: rgba(0, 242, 254, 0.15);
      border-radius: 12px;
      padding: 2px 6px;
      font-size: 11px;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .bottom-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
      margin-top: 12px;
    }

    .entity-name {
      font-size: 15px;
      font-weight: 600;
      color: var(--hs-text-primary, #ffffff);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      font-family: var(--hs-font-display, sans-serif);
    }

    .entity-state {
      font-size: 13px;
      color: var(--hs-text-secondary, rgba(255, 255, 255, 0.7));
      font-weight: 400;
    }

    /* Edit Overlay */
    .edit-controls {
      position: absolute;
      top: 6px;
      right: 6px;
      display: flex;
      gap: 6px;
      z-index: 5;
    }

    .edit-btn {
      background: rgba(0, 0, 0, 0.65);
      border: 1px solid rgba(255, 255, 255, 0.25);
      border-radius: 8px;
      color: #fff;
      font-size: 11px;
      padding: 3px 6px;
      cursor: pointer;
    }

    .edit-btn:hover {
      background: var(--hs-accent, #00f2fe);
      color: #000;
    }
  `, q);
ue([
  u({ type: Object })
], ie.prototype, "hass", void 0);
ue([
  u({ type: Object })
], ie.prototype, "entity", void 0);
ue([
  u({ type: Boolean })
], ie.prototype, "editMode", void 0);
ue([
  u({ type: String })
], ie.prototype, "locale", void 0);
ie = ue([
  H("homesmart-card-1x1")
], ie);
var B = function(r, e, t, i) {
  var s = arguments.length, n = s < 3 ? e : i === null ? i = Object.getOwnPropertyDescriptor(e, t) : i, a;
  if (typeof Reflect == "object" && typeof Reflect.decorate == "function") n = Reflect.decorate(r, e, t, i);
  else for (var o = r.length - 1; o >= 0; o--) (a = r[o]) && (n = (s < 3 ? a(n) : s > 3 ? a(e, t, n) : a(e, t)) || n);
  return s > 3 && n && Object.defineProperty(e, t, n), n;
}, W;
let T = (W = class extends _ {
  constructor() {
    super(...arguments), this.editMode = !1, this.locale = "vi", this.dragging = !1, this.localValue = null, this.debounceTimer = null;
  }
  render() {
    const e = this.computeIsActive(), t = this.getCurrentPercent(), i = this.entity.domain === "cover";
    return l`
      <div class="glass-card card-inner ${e ? "active" : ""}" tabindex="0">
        <div class="header-row">
          <div class="left-meta">
            <div class="icon-container" @click="${this.handleIconClick}">
              ${f(this.entity.icon, 24)}
            </div>
            <div class="title-group">
              <span class="entity-name" title="${this.entity.name}">${this.entity.name}</span>
              <span class="entity-desc">${this.computeDescription()}</span>
            </div>
          </div>
          <div class="value-badge">${t}%</div>
        </div>

        <div class="slider-section">
          <div
            class="slider-track"
            @pointerdown="${this.onPointerDown}"
            @pointermove="${this.onPointerMove}"
            @pointerup="${this.onPointerUp}"
            @pointercancel="${this.onPointerUp}"
          >
            <div class="slider-fill" style="width: ${t}%"></div>
            <div class="slider-thumb" style="left: ${t}%"></div>
          </div>

          ${i ? l`
                <div class="cover-buttons">
                  <button class="cover-btn" @click="${() => this.triggerCover("open_cover")}">
                    ${f("arrow-up", 16)}
                    <span>${d("open_btn", this.locale)}</span>
                  </button>
                  <button class="cover-btn" @click="${() => this.triggerCover("stop_cover")}">
                    ${f("pause", 16)}
                    <span>${d("stop_btn", this.locale)}</span>
                  </button>
                  <button class="cover-btn" @click="${() => this.triggerCover("close_cover")}">
                    ${f("arrow-down", 16)}
                    <span>${d("close_btn", this.locale)}</span>
                  </button>
                </div>
              ` : ""}
        </div>

        ${this.editMode ? this.renderEditControls() : ""}
      </div>
    `;
  }
  computeIsActive() {
    const e = this.entity.state.toLowerCase();
    return e === "on" || e === "open";
  }
  computeDescription() {
    return this.entity.domain === "light" ? d("brightness", this.locale) : this.entity.domain === "cover" ? d("cover_position", this.locale) : this.entity.domain === "fan" ? d("fan_speed", this.locale) : "";
  }
  getCurrentPercent() {
    if (this.localValue !== null)
      return this.localValue;
    const e = this.entity.attributes;
    return this.entity.domain === "light" ? this.entity.state === "off" ? 0 : e.brightness !== void 0 ? Math.round(e.brightness / 255 * 100) : this.entity.state === "on" ? 100 : 0 : this.entity.domain === "cover" ? e.current_position !== void 0 ? Math.round(e.current_position) : this.entity.state === "open" ? 100 : 0 : this.entity.domain === "fan" ? e.percentage !== void 0 ? Math.round(e.percentage) : this.entity.state === "on" ? 100 : 0 : 0;
  }
  handleIconClick(e) {
    if (e.stopPropagation(), !this.editMode) {
      if (this.entity.protection.type !== "none") {
        this.dispatchEvent(new CustomEvent("request-protected-action", {
          bubbles: !0,
          composed: !0,
          detail: {
            entity: this.entity,
            action: () => this.toggleEntity()
          }
        }));
        return;
      }
      this.toggleEntity();
    }
  }
  toggleEntity() {
    if (!this.hass)
      return;
    const e = this.entity.domain, t = this.entity.entity_id;
    if (e === "cover") {
      const i = this.entity.state === "open" ? "close_cover" : "open_cover";
      this.hass.callService("cover", i, { entity_id: t });
    } else
      this.hass.callService(e, "toggle", { entity_id: t });
  }
  triggerCover(e) {
    if (this.hass) {
      if (this.entity.protection.type !== "none") {
        this.dispatchEvent(new CustomEvent("request-protected-action", {
          bubbles: !0,
          composed: !0,
          detail: {
            entity: this.entity,
            action: () => this.hass.callService("cover", e, { entity_id: this.entity.entity_id })
          }
        }));
        return;
      }
      this.hass.callService("cover", e, { entity_id: this.entity.entity_id });
    }
  }
  onPointerDown(e) {
    const t = e.currentTarget;
    t.setPointerCapture(e.pointerId), this.dragging = !0, this.updateValueFromPointer(e, t);
  }
  onPointerMove(e) {
    if (!this.dragging)
      return;
    const t = e.currentTarget;
    this.updateValueFromPointer(e, t);
  }
  onPointerUp(e) {
    if (!this.dragging)
      return;
    this.dragging = !1;
    const t = e.currentTarget;
    try {
      t.releasePointerCapture(e.pointerId);
    } catch {
    }
    this.commitValue();
  }
  updateValueFromPointer(e, t) {
    const i = t.getBoundingClientRect(), s = Math.max(0, Math.min(e.clientX - i.left, i.width)), n = Math.round(s / i.width * 100);
    this.localValue = n;
  }
  commitValue() {
    if (this.localValue === null || !this.hass)
      return;
    const e = this.localValue;
    this.debounceTimer && window.clearTimeout(this.debounceTimer), this.debounceTimer = window.setTimeout(() => {
      const t = this.entity.domain, i = this.entity.entity_id;
      t === "light" ? e === 0 ? this.hass.callService("light", "turn_off", { entity_id: i }) : this.hass.callService("light", "turn_on", {
        entity_id: i,
        brightness_pct: e
      }) : t === "cover" ? this.hass.callService("cover", "set_cover_position", {
        entity_id: i,
        position: e
      }) : t === "fan" && (e === 0 ? this.hass.callService("fan", "turn_off", { entity_id: i }) : this.hass.callService("fan", "set_percentage", {
        entity_id: i,
        percentage: e
      })), this.localValue = null;
    }, 150);
  }
  renderEditControls() {
    return l`
      <div class="edit-controls" @click="${(e) => e.stopPropagation()}">
        <button class="edit-btn" @click="${() => this.changeSize("1x1")}">1x1</button>
        <button class="edit-btn" @click="${() => this.changeSize("2x2")}">2x2</button>
        <button class="edit-btn" @click="${this.cycleProtection}">🛡️</button>
        <button class="edit-btn" @click="${this.toggleHide}">👁️</button>
      </div>
    `;
  }
  changeSize(e) {
    this.dispatchEvent(new CustomEvent("card-config-change", {
      bubbles: !0,
      composed: !0,
      detail: {
        entity_id: this.entity.entity_id,
        size: e
      }
    }));
  }
  cycleProtection() {
    const e = this.entity.protection.type === "none" ? "confirm" : this.entity.protection.type === "confirm" ? "pin" : "none";
    this.dispatchEvent(new CustomEvent("card-config-change", {
      bubbles: !0,
      composed: !0,
      detail: {
        entity_id: this.entity.entity_id,
        protection: { type: e, pin: "1234" }
      }
    }));
  }
  toggleHide() {
    this.dispatchEvent(new CustomEvent("card-config-change", {
      bubbles: !0,
      composed: !0,
      detail: {
        entity_id: this.entity.entity_id,
        hidden: !this.entity.hidden
      }
    }));
  }
}, W.styles = k`
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }

    .card-inner {
      width: 100%;
      height: 100%;
      min-height: 120px;
      box-sizing: border-box;
      padding: 16px 20px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      border-radius: var(--hs-radius-lg, 24px);
      position: relative;
    }

    .header-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
    }

    .left-meta {
      display: flex;
      align-items: center;
      gap: 14px;
      min-width: 0;
    }

    .icon-container {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.12);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--hs-text-muted, rgba(255, 255, 255, 0.5));
      cursor: pointer;
      transition: all var(--hs-transition-normal, 0.25s ease);
      flex-shrink: 0;
    }

    .active .icon-container {
      background: var(--hs-active-gradient, linear-gradient(135deg, #00f2fe 0%, #4facfe 100%));
      color: #05040d;
      border-color: transparent;
      box-shadow: 0 0 16px var(--hs-glow-color, rgba(0, 242, 254, 0.45));
    }

    .title-group {
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
    }

    .entity-name {
      font-size: 15px;
      font-weight: 600;
      color: var(--hs-text-primary, #ffffff);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      font-family: var(--hs-font-display, sans-serif);
    }

    .entity-desc {
      font-size: 12px;
      color: var(--hs-text-secondary, rgba(255, 255, 255, 0.7));
    }

    .value-badge {
      font-size: 15px;
      font-weight: 700;
      color: var(--hs-accent, #00f2fe);
      background: rgba(0, 242, 254, 0.12);
      border: 1px solid rgba(0, 242, 254, 0.25);
      border-radius: 12px;
      padding: 4px 10px;
      font-family: var(--hs-font-display, sans-serif);
    }

    /* Slider Container */
    .slider-section {
      width: 100%;
      margin-top: 14px;
    }

    .slider-track {
      position: relative;
      width: 100%;
      height: 38px;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 20px;
      overflow: hidden;
      cursor: pointer;
      touch-action: none;
      user-select: none;
    }

    .slider-fill {
      position: absolute;
      top: 0;
      left: 0;
      height: 100%;
      background: var(--hs-active-gradient, linear-gradient(135deg, #00f2fe 0%, #4facfe 100%));
      border-radius: 20px;
      transition: width 0.1s ease;
      opacity: 0.85;
    }

    .slider-track:hover .slider-fill {
      opacity: 1;
    }

    .slider-thumb {
      position: absolute;
      top: 50%;
      width: 28px;
      height: 28px;
      background: #ffffff;
      border-radius: 50%;
      transform: translate(-50%, -50%);
      box-shadow: 0 0 10px rgba(0, 0, 0, 0.5), 0 0 12px var(--hs-glow-color, rgba(0, 242, 254, 0.5));
      pointer-events: none;
      transition: left 0.1s ease;
    }

    /* Cover Button Row */
    .cover-buttons {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 10px;
    }

    .cover-btn {
      flex: 1;
      height: 32px;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 10px;
      color: #fff;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      transition: all 0.2s ease;
    }

    .cover-btn:hover {
      background: rgba(255, 255, 255, 0.2);
      border-color: var(--hs-accent, #00f2fe);
    }

    /* Edit Controls */
    .edit-controls {
      position: absolute;
      top: 6px;
      right: 6px;
      display: flex;
      gap: 6px;
      z-index: 5;
    }

    .edit-btn {
      background: rgba(0, 0, 0, 0.65);
      border: 1px solid rgba(255, 255, 255, 0.25);
      border-radius: 8px;
      color: #fff;
      font-size: 11px;
      padding: 3px 6px;
      cursor: pointer;
    }

    .edit-btn:hover {
      background: var(--hs-accent, #00f2fe);
      color: #000;
    }
  `, W);
B([
  u({ type: Object })
], T.prototype, "hass", void 0);
B([
  u({ type: Object })
], T.prototype, "entity", void 0);
B([
  u({ type: Boolean })
], T.prototype, "editMode", void 0);
B([
  u({ type: String })
], T.prototype, "locale", void 0);
B([
  b()
], T.prototype, "dragging", void 0);
B([
  b()
], T.prototype, "localValue", void 0);
T = B([
  H("homesmart-card-2x1-slider")
], T);
var se = function(r, e, t, i) {
  var s = arguments.length, n = s < 3 ? e : i === null ? i = Object.getOwnPropertyDescriptor(e, t) : i, a;
  if (typeof Reflect == "object" && typeof Reflect.decorate == "function") n = Reflect.decorate(r, e, t, i);
  else for (var o = r.length - 1; o >= 0; o--) (a = r[o]) && (n = (s < 3 ? a(n) : s > 3 ? a(e, t, n) : a(e, t)) || n);
  return s > 3 && n && Object.defineProperty(e, t, n), n;
}, Y;
let R = (Y = class extends _ {
  constructor() {
    super(...arguments), this.editMode = !1, this.locale = "vi", this.localTargetTemp = null, this.debounceTimer = null;
  }
  render() {
    const e = this.entity.state !== "off", t = this.entity.attributes.current_temperature ?? 24, i = this.getTargetTemp(), s = this.entity.attributes.min_temp ?? 16, n = this.entity.attributes.max_temp ?? 30, a = this.entity.attributes.hvac_modes ?? ["off", "cool", "heat", "auto"], c = Math.PI * 65, g = Math.max(0, Math.min((i - s) / (n - s), 1)), p = c * (1 - g);
    return l`
      <div class="glass-card card-inner ${e ? "active" : ""}" tabindex="0">
        <div class="header-row">
          <div class="device-title">
            <div class="icon-container" @click="${this.togglePower}">
              ${f(this.entity.icon, 22)}
            </div>
            <div class="name-col">
              <span class="entity-name">${this.entity.name}</span>
              <span class="entity-hvac-action">${this.getHvacActionLabel()}</span>
            </div>
          </div>
        </div>

        <div class="dial-center">
          <svg class="svg-dial" viewBox="0 0 160 95">
            <defs>
              <linearGradient id="climateGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stop-color="#00f2fe" />
                <stop offset="100%" stop-color="#4facfe" />
              </linearGradient>
            </defs>
            <!-- Background Arc -->
            <path
              class="arc-bg"
              d="M 15 80 A 65 65 0 0 1 145 80"
              stroke-dasharray="${c}"
              stroke-dashoffset="0"
            />
            <!-- Progress Arc -->
            <path
              class="arc-progress"
              d="M 15 80 A 65 65 0 0 1 145 80"
              stroke-dasharray="${c}"
              stroke-dashoffset="${p}"
            />
          </svg>

          <div class="temp-readout">
            <div class="current-temp-val">
              ${t}<span class="temp-unit">°C</span>
            </div>
            <span class="current-label">${d("current_temp", this.locale)}</span>
          </div>
        </div>

        <div class="target-controls">
          <button class="round-btn" @click="${() => this.adjustTarget(-0.5)}">
            ${f("minus", 18)}
          </button>
          <div class="target-display">
            <span class="target-val">${i.toFixed(1)}°C</span>
            <span class="target-lbl">${d("target_temp", this.locale)}</span>
          </div>
          <button class="round-btn" @click="${() => this.adjustTarget(0.5)}">
            ${f("plus", 18)}
          </button>
        </div>

        <div class="mode-pills">
          ${a.map((h) => l`
              <button
                class="mode-pill ${this.entity.state === h ? "selected" : ""}"
                @click="${() => this.setMode(h)}"
              >
                ${d(`state_${h}`, this.locale)}
              </button>
            `)}
        </div>

        ${this.editMode ? this.renderEditControls() : ""}
      </div>
    `;
  }
  getTargetTemp() {
    return this.localTargetTemp !== null ? this.localTargetTemp : this.entity.attributes.temperature ?? 22;
  }
  getHvacActionLabel() {
    const e = this.entity.attributes.hvac_action || this.entity.state;
    return d(`state_${e}`, this.locale);
  }
  adjustTarget(e) {
    const t = this.getTargetTemp(), i = this.entity.attributes.min_temp ?? 16, s = this.entity.attributes.max_temp ?? 30, n = Math.max(i, Math.min(s, t + e));
    this.localTargetTemp = n, this.debounceTimer && window.clearTimeout(this.debounceTimer), this.debounceTimer = window.setTimeout(() => {
      this.hass && this.localTargetTemp !== null && (this.hass.callService("climate", "set_temperature", {
        entity_id: this.entity.entity_id,
        temperature: this.localTargetTemp
      }), this.localTargetTemp = null);
    }, 400);
  }
  setMode(e) {
    this.hass && this.hass.callService("climate", "set_hvac_mode", {
      entity_id: this.entity.entity_id,
      hvac_mode: e
    });
  }
  togglePower() {
    if (!this.hass)
      return;
    const e = this.entity.state === "off" ? "cool" : "off";
    this.setMode(e);
  }
  renderEditControls() {
    return l`
      <div class="edit-controls" @click="${(e) => e.stopPropagation()}">
        <button class="edit-btn" @click="${() => this.changeSize("1x1")}">1x1</button>
        <button class="edit-btn" @click="${() => this.changeSize("2x1")}">2x1</button>
        <button class="edit-btn" @click="${this.cycleProtection}">🛡️</button>
        <button class="edit-btn" @click="${this.toggleHide}">👁️</button>
      </div>
    `;
  }
  changeSize(e) {
    this.dispatchEvent(new CustomEvent("card-config-change", {
      bubbles: !0,
      composed: !0,
      detail: {
        entity_id: this.entity.entity_id,
        size: e
      }
    }));
  }
  cycleProtection() {
    const e = this.entity.protection.type === "none" ? "confirm" : this.entity.protection.type === "confirm" ? "pin" : "none";
    this.dispatchEvent(new CustomEvent("card-config-change", {
      bubbles: !0,
      composed: !0,
      detail: {
        entity_id: this.entity.entity_id,
        protection: { type: e, pin: "1234" }
      }
    }));
  }
  toggleHide() {
    this.dispatchEvent(new CustomEvent("card-config-change", {
      bubbles: !0,
      composed: !0,
      detail: {
        entity_id: this.entity.entity_id,
        hidden: !this.entity.hidden
      }
    }));
  }
}, Y.styles = k`
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }

    .card-inner {
      width: 100%;
      height: 100%;
      min-height: 250px;
      box-sizing: border-box;
      padding: 20px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      border-radius: var(--hs-radius-lg, 24px);
      position: relative;
    }

    .header-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
    }

    .device-title {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .icon-container {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.12);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--hs-accent, #00f2fe);
    }

    .active .icon-container {
      background: var(--hs-active-gradient, linear-gradient(135deg, #00f2fe 0%, #4facfe 100%));
      color: #05040d;
      box-shadow: 0 0 16px var(--hs-glow-color, rgba(0, 242, 254, 0.4));
    }

    .name-col {
      display: flex;
      flex-direction: column;
    }

    .entity-name {
      font-size: 16px;
      font-weight: 700;
      color: var(--hs-text-primary, #ffffff);
      font-family: var(--hs-font-display, sans-serif);
    }

    .entity-hvac-action {
      font-size: 12px;
      color: var(--hs-text-secondary, rgba(255, 255, 255, 0.7));
    }

    /* Circular Arc Dial Area */
    .dial-center {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      position: relative;
      margin: 10px 0;
    }

    .svg-dial {
      width: 170px;
      height: 110px;
      overflow: visible;
    }

    .arc-bg {
      fill: none;
      stroke: rgba(255, 255, 255, 0.1);
      stroke-width: 10;
      stroke-linecap: round;
    }

    .arc-progress {
      fill: none;
      stroke: url(#climateGradient);
      stroke-width: 10;
      stroke-linecap: round;
      transition: stroke-dashoffset 0.3s ease;
    }

    .temp-readout {
      position: absolute;
      top: 36px;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .current-temp-val {
      font-size: 34px;
      font-weight: 800;
      font-family: var(--hs-font-display, sans-serif);
      color: #ffffff;
      line-height: 1;
      display: flex;
      align-items: baseline;
    }

    .temp-unit {
      font-size: 18px;
      font-weight: 500;
      margin-left: 2px;
      color: var(--hs-text-secondary, rgba(255, 255, 255, 0.7));
    }

    .current-label {
      font-size: 12px;
      color: var(--hs-text-muted, rgba(255, 255, 255, 0.5));
      margin-top: 4px;
    }

    /* Target Temp Controls */
    .target-controls {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 16px;
      margin-top: 6px;
    }

    .round-btn {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.18);
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;
      outline: none;
    }

    .round-btn:hover {
      background: rgba(255, 255, 255, 0.22);
      border-color: var(--hs-accent, #00f2fe);
      transform: scale(1.08);
    }

    .round-btn:active {
      transform: scale(0.94);
    }

    .target-display {
      display: flex;
      flex-direction: column;
      align-items: center;
      min-width: 80px;
    }

    .target-val {
      font-size: 18px;
      font-weight: 700;
      color: var(--hs-accent, #00f2fe);
      font-family: var(--hs-font-display, sans-serif);
    }

    .target-lbl {
      font-size: 11px;
      color: var(--hs-text-muted, rgba(255, 255, 255, 0.5));
    }

    /* Mode selector pills */
    .mode-pills {
      display: flex;
      align-items: center;
      justify-content: space-around;
      gap: 6px;
      background: rgba(0, 0, 0, 0.25);
      padding: 4px;
      border-radius: 16px;
      border: 1px solid rgba(255, 255, 255, 0.08);
      margin-top: 10px;
    }

    .mode-pill {
      flex: 1;
      padding: 6px 4px;
      border-radius: 12px;
      background: transparent;
      border: none;
      color: var(--hs-text-muted, rgba(255, 255, 255, 0.5));
      font-size: 11px;
      font-weight: 600;
      cursor: pointer;
      text-transform: capitalize;
      transition: all 0.2s ease;
      text-align: center;
      white-space: nowrap;
    }

    .mode-pill:hover {
      color: #fff;
      background: rgba(255, 255, 255, 0.08);
    }

    .mode-pill.selected {
      background: var(--hs-active-gradient, linear-gradient(135deg, #00f2fe 0%, #4facfe 100%));
      color: #05040d;
      box-shadow: 0 0 10px var(--hs-glow-color, rgba(0, 242, 254, 0.4));
    }

    /* Edit Controls */
    .edit-controls {
      position: absolute;
      top: 6px;
      right: 6px;
      display: flex;
      gap: 6px;
      z-index: 5;
    }

    .edit-btn {
      background: rgba(0, 0, 0, 0.65);
      border: 1px solid rgba(255, 255, 255, 0.25);
      border-radius: 8px;
      color: #fff;
      font-size: 11px;
      padding: 3px 6px;
      cursor: pointer;
    }

    .edit-btn:hover {
      background: var(--hs-accent, #00f2fe);
      color: #000;
    }
  `, Y);
se([
  u({ type: Object })
], R.prototype, "hass", void 0);
se([
  u({ type: Object })
], R.prototype, "entity", void 0);
se([
  u({ type: Boolean })
], R.prototype, "editMode", void 0);
se([
  u({ type: String })
], R.prototype, "locale", void 0);
se([
  b()
], R.prototype, "localTargetTemp", void 0);
R = se([
  H("homesmart-card-2x2-climate")
], R);
var re = function(r, e, t, i) {
  var s = arguments.length, n = s < 3 ? e : i === null ? i = Object.getOwnPropertyDescriptor(e, t) : i, a;
  if (typeof Reflect == "object" && typeof Reflect.decorate == "function") n = Reflect.decorate(r, e, t, i);
  else for (var o = r.length - 1; o >= 0; o--) (a = r[o]) && (n = (s < 3 ? a(n) : s > 3 ? a(e, t, n) : a(e, t)) || n);
  return s > 3 && n && Object.defineProperty(e, t, n), n;
}, X;
let U = (X = class extends _ {
  constructor() {
    super(...arguments), this.editMode = !1, this.locale = "vi", this.showFullscreen = !1;
  }
  render() {
    const e = this.entity.domain === "camera";
    return l`
      <div class="glass-card card-inner" tabindex="0">
        ${e ? this.renderCamera() : this.renderMediaPlayer()}
        ${this.editMode ? this.renderEditControls() : ""}
      </div>

      ${this.showFullscreen && e ? this.renderFullscreenModal() : ""}
    `;
  }
  renderCamera() {
    const e = this.entity.attributes.entity_picture, t = e ? `${e}&token=${Date.now()}` : "";
    return l`
      <div class="camera-container">
        ${t ? l`<img class="camera-img" src="${t}" alt="${this.entity.name}" />` : l`
              <div class="camera-placeholder">
                ${f("cctv", 48)}
                <span>Camera Stream</span>
              </div>
            `}

        <div class="camera-overlay">
          <div class="camera-top">
            <div class="live-badge">
              <span class="live-dot"></span>
              <span>LIVE</span>
            </div>
          </div>
          <div class="camera-bottom">
            <span class="camera-name">${this.entity.name}</span>
            <button
              class="fullscreen-btn"
              title="Fullscreen"
              @click="${() => this.showFullscreen = !0}"
            >
              ${f("fullscreen", 18)}
            </button>
          </div>
        </div>
      </div>
    `;
  }
  renderFullscreenModal() {
    const e = this.entity.attributes.entity_picture;
    return l`
      <div class="fs-modal">
        <button class="fs-close" @click="${() => this.showFullscreen = !1}">
          ${f("close", 24)}
        </button>
        <img class="fs-img" src="${e}" alt="${this.entity.name}" />
      </div>
    `;
  }
  renderMediaPlayer() {
    const e = this.entity.attributes, t = this.entity.state === "playing", i = e.entity_picture || "", s = e.media_title || this.entity.name, n = e.media_artist || d(`state_${this.entity.state}`, this.locale), a = Math.round((e.volume_level ?? 0.5) * 100);
    return l`
      <div class="media-container">
        ${i ? l`<div class="media-backdrop" style="background-image: url('${i}')"></div>` : ""}

        <div class="media-content">
          <div class="media-header">
            <div class="media-device-info">
              ${i ? l`<img class="media-artwork-small" src="${i}" alt="" />` : f("television-ambient-light", 28)}
              <div class="media-titles">
                <span class="track-title" title="${s}">${s}</span>
                <span class="track-artist" title="${n}">${n}</span>
              </div>
            </div>
            <button class="nav-btn" @click="${this.togglePower}">
              ${f("power", 18)}
            </button>
          </div>

          <div class="media-controls-row">
            <button class="nav-btn" @click="${() => this.mediaService("media_previous_track")}">
              ${f("skip-previous", 20)}
            </button>
            <button class="play-btn" @click="${() => this.mediaService("media_play_pause")}">
              ${f(t ? "pause" : "play", 24)}
            </button>
            <button class="nav-btn" @click="${() => this.mediaService("media_next_track")}">
              ${f("skip-next", 20)}
            </button>
          </div>

          <div class="volume-slider-row">
            ${f("volume-high", 18)}
            <input
              type="range"
              class="vol-slider"
              min="0"
              max="100"
              .value="${a.toString()}"
              @change="${this.onVolumeChange}"
            />
          </div>
        </div>
      </div>
    `;
  }
  mediaService(e) {
    this.hass && this.hass.callService("media_player", e, { entity_id: this.entity.entity_id });
  }
  togglePower() {
    this.hass && this.hass.callService("media_player", "toggle", { entity_id: this.entity.entity_id });
  }
  onVolumeChange(e) {
    const t = e.target, i = parseFloat(t.value) / 100;
    this.hass && this.hass.callService("media_player", "volume_set", {
      entity_id: this.entity.entity_id,
      volume_level: i
    });
  }
  renderEditControls() {
    return l`
      <div class="edit-controls" @click="${(e) => e.stopPropagation()}">
        <button class="edit-btn" @click="${() => this.changeSize("1x1")}">1x1</button>
        <button class="edit-btn" @click="${() => this.changeSize("2x1")}">2x1</button>
        <button class="edit-btn" @click="${this.cycleProtection}">🛡️</button>
        <button class="edit-btn" @click="${this.toggleHide}">👁️</button>
      </div>
    `;
  }
  changeSize(e) {
    this.dispatchEvent(new CustomEvent("card-config-change", {
      bubbles: !0,
      composed: !0,
      detail: {
        entity_id: this.entity.entity_id,
        size: e
      }
    }));
  }
  cycleProtection() {
    const e = this.entity.protection.type === "none" ? "confirm" : this.entity.protection.type === "confirm" ? "pin" : "none";
    this.dispatchEvent(new CustomEvent("card-config-change", {
      bubbles: !0,
      composed: !0,
      detail: {
        entity_id: this.entity.entity_id,
        protection: { type: e, pin: "1234" }
      }
    }));
  }
  toggleHide() {
    this.dispatchEvent(new CustomEvent("card-config-change", {
      bubbles: !0,
      composed: !0,
      detail: {
        entity_id: this.entity.entity_id,
        hidden: !this.entity.hidden
      }
    }));
  }
}, X.styles = k`
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }

    .card-inner {
      width: 100%;
      height: 100%;
      min-height: 250px;
      box-sizing: border-box;
      border-radius: var(--hs-radius-lg, 24px);
      position: relative;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    /* Camera Card */
    .camera-container {
      width: 100%;
      height: 100%;
      position: relative;
      background: #000;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: var(--hs-radius-lg, 24px);
      overflow: hidden;
    }

    .camera-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    .camera-placeholder {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      color: rgba(255, 255, 255, 0.4);
    }

    .camera-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(180deg, rgba(0, 0, 0, 0.6) 0%, transparent 40%, rgba(0, 0, 0, 0.8) 100%);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 16px;
      box-sizing: border-box;
      pointer-events: none;
    }

    .camera-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      pointer-events: auto;
    }

    .live-badge {
      display: flex;
      align-items: center;
      gap: 6px;
      background: rgba(255, 75, 114, 0.85);
      color: #fff;
      font-size: 11px;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 10px;
      letter-spacing: 0.5px;
    }

    .live-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #fff;
      animation: pulse 1.5s infinite;
    }

    .camera-bottom {
      display: flex;
      align-items: center;
      justify-content: space-between;
      pointer-events: auto;
    }

    .camera-name {
      font-size: 15px;
      font-weight: 600;
      color: #fff;
      text-shadow: 0 1px 4px rgba(0, 0, 0, 0.8);
    }

    .fullscreen-btn {
      width: 34px;
      height: 34px;
      border-radius: 50%;
      background: rgba(0, 0, 0, 0.5);
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .fullscreen-btn:hover {
      background: var(--hs-accent, #00f2fe);
      color: #000;
    }

    /* Media Player Card */
    .media-container {
      width: 100%;
      height: 100%;
      padding: 20px;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      position: relative;
    }

    .media-backdrop {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-size: cover;
      background-position: center;
      filter: blur(24px) brightness(0.35);
      transform: scale(1.15);
      z-index: 0;
    }

    .media-content {
      position: relative;
      z-index: 1;
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    .media-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .media-device-info {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .media-artwork-small {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      object-fit: cover;
      border: 1px solid rgba(255, 255, 255, 0.2);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
    }

    .media-titles {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    .track-title {
      font-size: 15px;
      font-weight: 700;
      color: #fff;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      font-family: var(--hs-font-display, sans-serif);
    }

    .track-artist {
      font-size: 12px;
      color: var(--hs-text-secondary, rgba(255, 255, 255, 0.7));
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .media-controls-row {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 20px;
      margin: 14px 0;
    }

    .play-btn {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: var(--hs-active-gradient, linear-gradient(135deg, #00f2fe 0%, #4facfe 100%));
      color: #05040d;
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: 0 0 16px var(--hs-glow-color, rgba(0, 242, 254, 0.45));
      transition: all 0.2s ease;
    }

    .play-btn:hover {
      transform: scale(1.08);
    }

    .nav-btn {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.15);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .nav-btn:hover {
      background: rgba(255, 255, 255, 0.2);
    }

    .volume-slider-row {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .vol-slider {
      flex: 1;
      height: 6px;
      appearance: none;
      -webkit-appearance: none;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 3px;
      outline: none;
    }

    .vol-slider::-webkit-slider-thumb {
      -webkit-appearance: none;
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: var(--hs-accent, #00f2fe);
      cursor: pointer;
    }

    /* Fullscreen Modal */
    .fs-modal {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: #000;
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .fs-close {
      position: absolute;
      top: 24px;
      right: 24px;
      background: rgba(255, 255, 255, 0.2);
      border: none;
      color: #fff;
      width: 44px;
      height: 44px;
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2;
    }

    .fs-img {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.3; }
    }

    /* Edit Controls */
    .edit-controls {
      position: absolute;
      top: 6px;
      right: 6px;
      display: flex;
      gap: 6px;
      z-index: 5;
    }

    .edit-btn {
      background: rgba(0, 0, 0, 0.65);
      border: 1px solid rgba(255, 255, 255, 0.25);
      border-radius: 8px;
      color: #fff;
      font-size: 11px;
      padding: 3px 6px;
      cursor: pointer;
    }

    .edit-btn:hover {
      background: var(--hs-accent, #00f2fe);
      color: #000;
    }
  `, X);
re([
  u({ type: Object })
], U.prototype, "hass", void 0);
re([
  u({ type: Object })
], U.prototype, "entity", void 0);
re([
  u({ type: Boolean })
], U.prototype, "editMode", void 0);
re([
  u({ type: String })
], U.prototype, "locale", void 0);
re([
  b()
], U.prototype, "showFullscreen", void 0);
U = re([
  H("homesmart-card-2x2-media-cam")
], U);
var F = function(r, e, t, i) {
  var s = arguments.length, n = s < 3 ? e : i === null ? i = Object.getOwnPropertyDescriptor(e, t) : i, a;
  if (typeof Reflect == "object" && typeof Reflect.decorate == "function") n = Reflect.decorate(r, e, t, i);
  else for (var o = r.length - 1; o >= 0; o--) (a = r[o]) && (n = (s < 3 ? a(n) : s > 3 ? a(e, t, n) : a(e, t)) || n);
  return s > 3 && n && Object.defineProperty(e, t, n), n;
}, K;
let P = (K = class extends _ {
  constructor() {
    super(...arguments), this.open = !1, this.showHidden = !1, this.locale = "vi", this.saving = !1, this.saveStatus = "";
  }
  render() {
    if (!this.open)
      return l``;
    const e = [
      { id: "aurora", dotClass: "dot-aurora", name: "Aurora" },
      { id: "ocean", dotClass: "dot-ocean", name: "Ocean" },
      { id: "wine", dotClass: "dot-wine", name: "Wine" },
      { id: "graphite", dotClass: "dot-graphite", name: "Graphite" },
      { id: "emerald", dotClass: "dot-emerald", name: "Emerald" },
      { id: "sunset", dotClass: "dot-sunset", name: "Sunset" }
    ], t = [
      { id: "auto", label: "Auto" },
      { id: "sidebar", label: "Sidebar" },
      { id: "focus", label: "Focus" },
      { id: "grid", label: "Grid" },
      { id: "tv", label: "TV" }
    ], i = [60, 180, 300, 600];
    return l`
      <div class="editor-drawer">
        <div class="section-group">
          <!-- Theme Picker -->
          <div class="control-item">
            <span class="control-label">${d("theme_select", this.locale)}</span>
            <div class="pills-group">
              ${e.map((s) => l`
                  <button
                    class="pill-btn ${this.config.theme === s.id ? "active" : ""}"
                    @click="${() => this.changeTheme(s.id)}"
                  >
                    <span class="theme-color-dot ${s.dotClass}"></span>
                    <span>${s.name}</span>
                  </button>
                `)}
            </div>
          </div>

          <!-- Layout Picker -->
          <div class="control-item">
            <span class="control-label">${d("layout_select", this.locale)}</span>
            <div class="pills-group">
              ${t.map((s) => l`
                  <button
                    class="pill-btn ${this.config.layout === s.id ? "active" : ""}"
                    @click="${() => this.changeLayout(s.id)}"
                  >
                    ${s.label}
                  </button>
                `)}
            </div>
          </div>

          <!-- Screensaver Timeout -->
          <div class="control-item">
            <span class="control-label">${d("screensaver_timeout", this.locale)}</span>
            <div class="pills-group">
              ${i.map((s) => l`
                  <button
                    class="pill-btn ${this.config.screensaver.timeout_seconds === s ? "active" : ""}"
                    @click="${() => this.changeScreensaverTimeout(s)}"
                  >
                    ${s / 60}m
                  </button>
                `)}
            </div>
          </div>

          <!-- Language Picker -->
          <div class="control-item">
            <span class="control-label">${d("language_select", this.locale)}</span>
            <div class="pills-group">
              <button
                class="pill-btn ${this.config.locale === "vi" ? "active" : ""}"
                @click="${() => this.changeLanguage("vi")}"
              >
                Tiếng Việt
              </button>
              <button
                class="pill-btn ${this.config.locale === "en" ? "active" : ""}"
                @click="${() => this.changeLanguage("en")}"
              >
                English
              </button>
            </div>
          </div>
        </div>

        <div class="actions-group">
          <button class="action-btn btn-secondary" @click="${this.toggleShowHidden}">
            ${f(this.showHidden ? "eye-off" : "eye", 18)}
            <span>${this.showHidden ? "Ẩn thẻ đã ẩn" : d("show_all_hidden", this.locale)}</span>
          </button>

          <button class="action-btn btn-save" ?disabled="${this.saving}" @click="${this.saveConfig}">
            ${f("check", 18)}
            <span>${this.saving ? d("saving", this.locale) : d("save_sync", this.locale)}</span>
          </button>

          ${this.saveStatus ? l`<span class="status-msg">${this.saveStatus}</span>` : ""}
        </div>
      </div>
    `;
  }
  changeTheme(e) {
    this.dispatchEvent(new CustomEvent("update-dashboard-config", {
      bubbles: !0,
      composed: !0,
      detail: { theme: e }
    }));
  }
  changeLayout(e) {
    this.dispatchEvent(new CustomEvent("update-dashboard-config", {
      bubbles: !0,
      composed: !0,
      detail: { layout: e }
    }));
  }
  changeScreensaverTimeout(e) {
    this.dispatchEvent(new CustomEvent("update-dashboard-config", {
      bubbles: !0,
      composed: !0,
      detail: {
        screensaver: {
          ...this.config.screensaver,
          timeout_seconds: e
        }
      }
    }));
  }
  changeLanguage(e) {
    this.dispatchEvent(new CustomEvent("update-dashboard-config", {
      bubbles: !0,
      composed: !0,
      detail: { locale: e }
    }));
  }
  toggleShowHidden() {
    this.dispatchEvent(new CustomEvent("toggle-show-hidden", {
      bubbles: !0,
      composed: !0
    }));
  }
  async saveConfig() {
    this.saving = !0, this.saveStatus = "", this.dispatchEvent(new CustomEvent("request-save-config", {
      bubbles: !0,
      composed: !0,
      detail: {
        onSuccess: () => {
          this.saving = !1, this.saveStatus = d("saved_success", this.locale), setTimeout(() => {
            this.saveStatus = "";
          }, 3e3);
        },
        onError: () => {
          this.saving = !1, this.saveStatus = d("save_error", this.locale);
        }
      }
    }));
  }
}, K.styles = k`
    :host {
      display: block;
      position: sticky;
      top: 0;
      z-index: 900;
    }

    .editor-drawer {
      background: rgba(10, 8, 22, 0.92);
      backdrop-filter: blur(28px) saturate(200%);
      -webkit-backdrop-filter: blur(28px) saturate(200%);
      border-bottom: 1px solid var(--hs-glass-border, rgba(255, 255, 255, 0.15));
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.6);
      padding: 16px 24px;
      box-sizing: border-box;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      animation: slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .section-group {
      display: flex;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;
    }

    .control-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .control-label {
      font-size: 11px;
      font-weight: 700;
      color: var(--hs-text-muted, rgba(255, 255, 255, 0.5));
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .pills-group {
      display: flex;
      align-items: center;
      gap: 4px;
      background: rgba(255, 255, 255, 0.06);
      padding: 3px;
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .pill-btn {
      padding: 6px 12px;
      border-radius: 10px;
      background: transparent;
      border: none;
      color: var(--hs-text-secondary, rgba(255, 255, 255, 0.7));
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: all 0.15s ease;
      white-space: nowrap;
    }

    .pill-btn:hover {
      color: #fff;
      background: rgba(255, 255, 255, 0.1);
    }

    .pill-btn.active {
      background: var(--hs-active-gradient, linear-gradient(135deg, #00f2fe 0%, #4facfe 100%));
      color: #05040d;
      box-shadow: 0 0 12px var(--hs-glow-color, rgba(0, 242, 254, 0.4));
    }

    .theme-color-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      display: inline-block;
    }

    .dot-aurora { background: #00f2fe; }
    .dot-ocean { background: #0072ff; }
    .dot-wine { background: #ff4b72; }
    .dot-graphite { background: #94a3b8; }
    .dot-emerald { background: #00f5a0; }
    .dot-sunset { background: #ff7e5f; }

    /* Actions Group */
    .actions-group {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .action-btn {
      padding: 10px 18px;
      border-radius: 14px;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      border: none;
      transition: all 0.2s ease;
    }

    .btn-secondary {
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.15);
      color: #fff;
    }

    .btn-secondary:hover {
      background: rgba(255, 255, 255, 0.18);
    }

    .btn-save {
      background: var(--hs-active-gradient, linear-gradient(135deg, #00f2fe 0%, #4facfe 100%));
      color: #05040d;
      box-shadow: 0 0 16px var(--hs-glow-color, rgba(0, 242, 254, 0.45));
    }

    .btn-save:hover {
      transform: translateY(-1px);
      filter: brightness(1.1);
    }

    .status-msg {
      font-size: 12px;
      font-weight: 600;
      color: #00f5a0;
      animation: fadeIn 0.3s ease;
    }

    @keyframes slideDown {
      from { transform: translateY(-100%); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
  `, K);
F([
  u({ type: Object })
], P.prototype, "config", void 0);
F([
  u({ type: Boolean })
], P.prototype, "open", void 0);
F([
  u({ type: Boolean })
], P.prototype, "showHidden", void 0);
F([
  u({ type: String })
], P.prototype, "locale", void 0);
F([
  b()
], P.prototype, "saving", void 0);
F([
  b()
], P.prototype, "saveStatus", void 0);
P = F([
  H("homesmart-visual-editor-bar")
], P);
var E = function(r, e, t, i) {
  var s = arguments.length, n = s < 3 ? e : i === null ? i = Object.getOwnPropertyDescriptor(e, t) : i, a;
  if (typeof Reflect == "object" && typeof Reflect.decorate == "function") n = Reflect.decorate(r, e, t, i);
  else for (var o = r.length - 1; o >= 0; o--) (a = r[o]) && (n = (s < 3 ? a(n) : s > 3 ? a(e, t, n) : a(e, t)) || n);
  return s > 3 && n && Object.defineProperty(e, t, n), n;
}, J;
let A = (J = class extends _ {
  constructor() {
    super(...arguments), this.open = !1, this.protection = { type: "confirm" }, this.entityName = "", this.entityIcon = "mdi:shield-check", this.locale = "vi", this.enteredPin = "", this.isShaking = !1, this.errorMessage = "";
  }
  render() {
    if (!this.open)
      return l``;
    const e = this.protection.type === "pin";
    return l`
      <div class="modal-overlay ${this.open ? "open" : ""}" @click="${this.handleBackdropClick}">
        <div class="modal-box ${this.isShaking ? "shake" : ""}" @click="${(t) => t.stopPropagation()}">
          <div class="icon-badge">
            ${f(this.entityIcon, 32)}
          </div>

          <h3 class="title">${e ? d("pin_title", this.locale) : d("confirm_title", this.locale)}</h3>
          <p class="subtitle">
            ${e ? d("pin_msg", this.locale) : d("confirm_msg", this.locale)}
            <br />
            <strong>${this.entityName}</strong>
          </p>

          ${e ? l`
                <div class="pin-display">
                  ${[0, 1, 2, 3].map((t) => l`
                      <div class="pin-dot ${t < this.enteredPin.length ? "filled" : ""}"></div>
                    `)}
                </div>

                <div class="keypad">
                  ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((t) => l`
                      <button class="key-btn" @click="${() => this.handleNumberClick(t.toString())}">
                        ${t}
                      </button>
                    `)}
                  <button class="key-btn action" @click="${this.handleClear}">
                    ${d("clear", this.locale)}
                  </button>
                  <button class="key-btn" @click="${() => this.handleNumberClick("0")}">0</button>
                  <button class="key-btn action" @click="${this.handleBackspace}">
                    ${f("arrow-left", 20)}
                  </button>
                </div>

                <div class="error-text">${this.errorMessage}</div>
              ` : ""}

          <div class="actions">
            <button class="btn btn-cancel" @click="${this.handleCancel}">
              ${d("cancel", this.locale)}
            </button>
            ${e ? "" : l`
                  <button class="btn btn-confirm" @click="${this.handleConfirmSuccess}">
                    ${d("confirm", this.locale)}
                  </button>
                `}
          </div>
        </div>
      </div>
    `;
  }
  handleNumberClick(e) {
    this.enteredPin.length >= 4 || (this.errorMessage = "", this.enteredPin += e, this.enteredPin.length === 4 && this.validatePin());
  }
  handleBackspace() {
    this.errorMessage = "", this.enteredPin = this.enteredPin.slice(0, -1);
  }
  handleClear() {
    this.errorMessage = "", this.enteredPin = "";
  }
  validatePin() {
    const e = this.protection.pin || "1234";
    this.enteredPin === e ? this.handleConfirmSuccess() : (this.isShaking = !0, this.errorMessage = d("incorrect_pin", this.locale), setTimeout(() => {
      this.isShaking = !1, this.enteredPin = "";
    }, 500));
  }
  handleConfirmSuccess() {
    this.enteredPin = "", this.errorMessage = "", this.dispatchEvent(new CustomEvent("confirm-success", { bubbles: !0, composed: !0 }));
  }
  handleCancel() {
    this.enteredPin = "", this.errorMessage = "", this.dispatchEvent(new CustomEvent("confirm-cancel", { bubbles: !0, composed: !0 }));
  }
  handleBackdropClick() {
    this.handleCancel();
  }
}, J.styles = k`
    :host {
      display: block;
    }

    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.75);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.25s ease;
      padding: 16px;
      box-sizing: border-box;
    }

    .modal-overlay.open {
      opacity: 1;
      pointer-events: auto;
    }

    .modal-box {
      width: 100%;
      max-width: 380px;
      background: var(--hs-glass-bg, rgba(20, 16, 40, 0.85));
      border: 1px solid var(--hs-glass-border, rgba(255, 255, 255, 0.2));
      border-radius: var(--hs-radius-xl, 32px);
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6), 0 0 30px var(--hs-glow-color, rgba(0, 242, 254, 0.3));
      padding: 28px 24px;
      box-sizing: border-box;
      text-align: center;
      transform: scale(0.92);
      transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      color: #fff;
    }

    .modal-overlay.open .modal-box {
      transform: scale(1);
    }

    .icon-badge {
      width: 60px;
      height: 60px;
      margin: 0 auto 16px;
      border-radius: 50%;
      background: var(--hs-active-gradient, linear-gradient(135deg, #00f2fe 0%, #4facfe 100%));
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 0 20px var(--hs-glow-color, rgba(0, 242, 254, 0.4));
      color: #000;
    }

    .title {
      font-size: 20px;
      font-weight: 700;
      margin: 0 0 8px;
      font-family: var(--hs-font-display, sans-serif);
    }

    .subtitle {
      font-size: 14px;
      color: var(--hs-text-secondary, rgba(255, 255, 255, 0.7));
      margin: 0 0 20px;
      line-height: 1.4;
    }

    /* PIN Dots */
    .pin-display {
      display: flex;
      justify-content: center;
      gap: 16px;
      margin: 20px 0 24px;
    }

    .pin-dot {
      width: 18px;
      height: 18px;
      border-radius: 50%;
      border: 2px solid var(--hs-accent, #00f2fe);
      background: transparent;
      transition: all 0.2s ease;
    }

    .pin-dot.filled {
      background: var(--hs-accent, #00f2fe);
      box-shadow: 0 0 12px var(--hs-accent, #00f2fe);
      transform: scale(1.15);
    }

    /* Keypad */
    .keypad {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      max-width: 280px;
      margin: 0 auto 20px;
    }

    .key-btn {
      aspect-ratio: 1;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.15);
      color: #fff;
      font-size: 22px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.15s ease;
      outline: none;
    }

    .key-btn:hover {
      background: rgba(255, 255, 255, 0.2);
      border-color: var(--hs-accent, #00f2fe);
      transform: scale(1.05);
    }

    .key-btn:active {
      transform: scale(0.95);
      background: var(--hs-accent, #00f2fe);
      color: #000;
    }

    .key-btn.action {
      font-size: 14px;
      background: transparent;
      border-color: transparent;
    }

    /* Action Buttons */
    .actions {
      display: flex;
      gap: 12px;
      margin-top: 16px;
    }

    .btn {
      flex: 1;
      padding: 12px 18px;
      border-radius: var(--hs-radius-md, 16px);
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      border: none;
      outline: none;
      transition: all 0.2s ease;
    }

    .btn-cancel {
      background: rgba(255, 255, 255, 0.1);
      color: #fff;
      border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .btn-cancel:hover {
      background: rgba(255, 255, 255, 0.18);
    }

    .btn-confirm {
      background: var(--hs-active-gradient, linear-gradient(135deg, #00f2fe 0%, #4facfe 100%));
      color: #05040d;
      box-shadow: 0 0 16px var(--hs-glow-color, rgba(0, 242, 254, 0.4));
    }

    .btn-confirm:hover {
      filter: brightness(1.1);
      transform: translateY(-1px);
    }

    /* Error Shake */
    .shake {
      animation: shake 0.4s ease-in-out;
    }

    .error-text {
      color: #ff4b72;
      font-size: 13px;
      margin-top: 8px;
      min-height: 18px;
    }

    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      20%, 60% { transform: translateX(-8px); }
      40%, 80% { transform: translateX(8px); }
    }
  `, J);
E([
  u({ type: Boolean })
], A.prototype, "open", void 0);
E([
  u({ type: Object })
], A.prototype, "protection", void 0);
E([
  u({ type: String })
], A.prototype, "entityName", void 0);
E([
  u({ type: String })
], A.prototype, "entityIcon", void 0);
E([
  u({ type: String })
], A.prototype, "locale", void 0);
E([
  b()
], A.prototype, "enteredPin", void 0);
E([
  b()
], A.prototype, "isShaking", void 0);
E([
  b()
], A.prototype, "errorMessage", void 0);
A = E([
  H("homesmart-confirm-dialog")
], A);
var O = function(r, e, t, i) {
  var s = arguments.length, n = s < 3 ? e : i === null ? i = Object.getOwnPropertyDescriptor(e, t) : i, a;
  if (typeof Reflect == "object" && typeof Reflect.decorate == "function") n = Reflect.decorate(r, e, t, i);
  else for (var o = r.length - 1; o >= 0; o--) (a = r[o]) && (n = (s < 3 ? a(n) : s > 3 ? a(e, t, n) : a(e, t)) || n);
  return s > 3 && n && Object.defineProperty(e, t, n), n;
}, Q;
let M = (Q = class extends _ {
  constructor() {
    super(...arguments), this.active = !1, this.locale = "vi", this.currentTime = "", this.currentDate = "", this.shiftX = 0, this.shiftY = 0, this.clockTimer = null, this.pixelShiftTimer = null;
  }
  connectedCallback() {
    super.connectedCallback(), this.updateClock(), this.clockTimer = window.setInterval(() => this.updateClock(), 1e3), this.pixelShiftTimer = window.setInterval(() => this.shiftPixels(), 6e4);
  }
  disconnectedCallback() {
    super.disconnectedCallback(), this.clockTimer && window.clearInterval(this.clockTimer), this.pixelShiftTimer && window.clearInterval(this.pixelShiftTimer);
  }
  render() {
    return l`
      <div
        class="screensaver-overlay ${this.active ? "active" : ""}"
        @click="${this.dismiss}"
        @pointerdown="${this.dismiss}"
      >
        <div
          class="display-box"
          style="transform: translate(${this.shiftX}px, ${this.shiftY}px)"
        >
          <div class="clock-text">${this.currentTime}</div>
          <div class="date-text">${this.currentDate}</div>

          ${this.weatherEntity ? this.renderWeather() : ""}
        </div>

        <div class="hint-text">${d("tap_to_wake", this.locale)}</div>
      </div>
    `;
  }
  renderWeather() {
    if (!this.weatherEntity)
      return "";
    const e = this.weatherEntity.attributes.temperature ?? "--", t = this.weatherEntity.state;
    return l`
      <div class="weather-row">
        ${f("weather-sunny", 26)}
        <span class="weather-temp">${e}°C</span>
        <span class="weather-desc">${t}</span>
      </div>
    `;
  }
  updateClock() {
    const e = /* @__PURE__ */ new Date(), t = e.getHours().toString().padStart(2, "0"), i = e.getMinutes().toString().padStart(2, "0");
    this.currentTime = `${t}:${i}`;
    const s = {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    };
    this.currentDate = e.toLocaleDateString(this.locale === "vi" ? "vi-VN" : "en-US", s);
  }
  shiftPixels() {
    this.shiftX = Math.floor(Math.random() * 32) - 16, this.shiftY = Math.floor(Math.random() * 32) - 16;
  }
  dismiss() {
    this.active && this.dispatchEvent(new CustomEvent("screensaver-dismiss", { bubbles: !0, composed: !0 }));
  }
}, Q.styles = k`
    :host {
      display: block;
    }

    .screensaver-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: #000000;
      z-index: 99999;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      user-select: none;
      -webkit-user-select: none;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.8s ease;
    }

    .screensaver-overlay.active {
      opacity: 1;
      pointer-events: auto;
    }

    .display-box {
      display: flex;
      flex-direction: column;
      align-items: center;
      transition: transform 1s ease-in-out;
      padding: 32px;
      border-radius: 32px;
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.05);
      box-shadow: 0 0 80px rgba(0, 242, 254, 0.08);
    }

    .clock-text {
      font-size: clamp(72px, 12vw, 130px);
      font-weight: 800;
      font-family: var(--hs-font-display, 'Outfit', sans-serif);
      color: #ffffff;
      line-height: 1;
      letter-spacing: -2px;
      text-shadow: 0 0 30px rgba(255, 255, 255, 0.25);
    }

    .date-text {
      font-size: clamp(18px, 2.8vw, 26px);
      font-weight: 500;
      color: var(--hs-text-secondary, rgba(255, 255, 255, 0.75));
      margin-top: 14px;
      text-transform: capitalize;
    }

    .weather-row {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-top: 24px;
      padding: 10px 20px;
      border-radius: 20px;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.08);
    }

    .weather-temp {
      font-size: 22px;
      font-weight: 700;
      color: var(--hs-accent, #00f2fe);
      font-family: var(--hs-font-display, sans-serif);
    }

    .weather-desc {
      font-size: 14px;
      color: var(--hs-text-secondary, rgba(255, 255, 255, 0.7));
      text-transform: capitalize;
    }

    .hint-text {
      position: absolute;
      bottom: 40px;
      font-size: 13px;
      color: rgba(255, 255, 255, 0.3);
      letter-spacing: 0.5px;
    }
  `, Q);
O([
  u({ type: Boolean })
], M.prototype, "active", void 0);
O([
  u({ type: Object })
], M.prototype, "weatherEntity", void 0);
O([
  u({ type: String })
], M.prototype, "locale", void 0);
O([
  b()
], M.prototype, "currentTime", void 0);
O([
  b()
], M.prototype, "currentDate", void 0);
O([
  b()
], M.prototype, "shiftX", void 0);
O([
  b()
], M.prototype, "shiftY", void 0);
M = O([
  H("homesmart-oled-screensaver")
], M);
var St = Object.defineProperty, Tt = Object.getOwnPropertyDescriptor, $ = (r, e, t, i) => {
  for (var s = i > 1 ? void 0 : i ? Tt(e, t) : e, n = r.length - 1, a; n >= 0; n--)
    (a = r[n]) && (s = (i ? a(e, t, s) : a(s)) || s);
  return i && s && St(e, t, s), s;
};
const Fe = {
  version: 1,
  theme: "aurora",
  layout: "auto",
  locale: "vi",
  screensaver: {
    enabled: !0,
    timeout_seconds: 180,
    show_clock: !0,
    show_weather: !0,
    pixel_shift: !0
  },
  custom_cards: {},
  hidden_entities: [],
  protected_entities: {},
  area_order: []
};
let x = class extends _ {
  constructor() {
    super(...arguments), this.config = { ...Fe }, this.selectedAreaId = "", this.editMode = !1, this.showHidden = !1, this.viewport = Ue(), this.screensaverActive = !1, this.confirmModalOpen = !1, this.pendingProtectedAction = null, this.protectedModalEntityName = "", this.protectedModalEntityIcon = "mdi:shield-check", this.protectedModalConfig = { type: "confirm" }, this.dpadNavigator = null, this.resizeHandler = () => {
    }, this.idleTimer = null, this.userActivityHandler = () => {
    };
  }
  set hass(r) {
    const e = this._hass;
    this._hass = r, this.requestUpdate("hass", e), !e && r && this.loadConfigFromHass();
  }
  get hass() {
    return this._hass;
  }
  connectedCallback() {
    super.connectedCallback(), this.updateViewport(), this.resizeHandler = () => this.updateViewport(), window.addEventListener("resize", this.resizeHandler), this.setupInactivityTracker(), this.setupListeners();
  }
  firstUpdated() {
    this.dpadNavigator = new Lt(this.renderRoot);
  }
  disconnectedCallback() {
    super.disconnectedCallback(), window.removeEventListener("resize", this.resizeHandler), this.removeInactivityTracker(), this.dpadNavigator && this.dpadNavigator.destroy();
  }
  updateViewport() {
    this.viewport = Ue(this.config.layout), this.style.setProperty("--hs-columns", this.viewport.gridColumns.toString());
  }
  setupListeners() {
    this.addEventListener("area-selected", (r) => {
      this.selectedAreaId = r.detail.areaId;
    }), this.addEventListener("toggle-edit-mode", () => {
      this.editMode = !this.editMode;
    }), this.addEventListener("toggle-show-hidden", () => {
      this.showHidden = !this.showHidden;
    }), this.addEventListener("update-dashboard-config", (r) => {
      this.config = { ...this.config, ...r.detail }, this.setAttribute("data-theme", this.config.theme), this.updateViewport();
    }), this.addEventListener("card-config-change", (r) => {
      const { entity_id: e, ...t } = r.detail, i = { ...this.config.custom_cards };
      i[e] = {
        ...i[e],
        entity_id: e,
        ...t
      }, this.config = { ...this.config, custom_cards: i };
    }), this.addEventListener("request-protected-action", (r) => {
      const { entity: e, action: t } = r.detail;
      this.protectedModalEntityName = e.name, this.protectedModalEntityIcon = e.icon, this.protectedModalConfig = e.protection, this.pendingProtectedAction = t, this.confirmModalOpen = !0;
    }), this.addEventListener("request-save-config", async (r) => {
      const { onSuccess: e, onError: t } = r.detail;
      try {
        await this.saveConfigToHass(), e && e();
      } catch {
        t && t();
      }
    }), this.addEventListener("screensaver-dismiss", () => {
      this.screensaverActive = !1, this.resetIdleTimer();
    });
  }
  setupInactivityTracker() {
    this.userActivityHandler = () => {
      this.screensaverActive && (this.screensaverActive = !1), this.resetIdleTimer();
    }, window.addEventListener("pointerdown", this.userActivityHandler), window.addEventListener("keydown", this.userActivityHandler), window.addEventListener("mousemove", this.userActivityHandler), this.resetIdleTimer();
  }
  removeInactivityTracker() {
    window.removeEventListener("pointerdown", this.userActivityHandler), window.removeEventListener("keydown", this.userActivityHandler), window.removeEventListener("mousemove", this.userActivityHandler), this.idleTimer && window.clearTimeout(this.idleTimer);
  }
  resetIdleTimer() {
    if (this.idleTimer && window.clearTimeout(this.idleTimer), !this.config.screensaver.enabled) return;
    const r = (this.config.screensaver.timeout_seconds || 180) * 1e3;
    this.idleTimer = window.setTimeout(() => {
      this.screensaverActive = !0;
    }, r);
  }
  async loadConfigFromHass() {
    if (this._hass)
      try {
        const r = await this._hass.callWS({
          type: "homesmart/config/get"
        });
        r && typeof r == "object" && (this.config = { ...Fe, ...r }, this.setAttribute("data-theme", this.config.theme), this.updateViewport());
      } catch (r) {
        console.warn("[HomeSmart] Using default config, HA store not initialized:", r);
      }
  }
  async saveConfigToHass() {
    this._hass && await this._hass.callWS({
      type: "homesmart/config/save",
      config: this.config
    });
  }
  render() {
    var s;
    const r = Ct(this.hass, this.config, this.showHidden), e = Et(r), t = Vt(this.config.layout, this.viewport), i = (s = this.hass) != null && s.states ? Object.values(this.hass.states).find((n) => n.entity_id.startsWith("weather.")) : void 0;
    return l`
      <div class="homesmart-shell theme-${this.config.theme}" data-theme="${this.config.theme}">
        <!-- In-App Visual Editor Toolbar -->
        <homesmart-visual-editor-bar
          .config="${this.config}"
          .open="${this.editMode}"
          .showHidden="${this.showHidden}"
          .locale="${this.config.locale}"
        ></homesmart-visual-editor-bar>

        <div class="app-layout">
          <!-- Sidebar: Shown when in 'sidebar' layout OR 'auto' on tablet/desktop -->
          ${t === "sidebar" ? l`
                <homesmart-sidebar-nav
                  .areas="${r}"
                  .selectedAreaId="${this.selectedAreaId}"
                  .device="${this.viewport.device}"
                  .locale="${this.config.locale}"
                  .lightsOn="${e.lightsOn}"
                  .totalActive="${e.totalActive}"
                  .editMode="${this.editMode}"
                ></homesmart-sidebar-nav>
              ` : ""}

          <!-- Main Content Viewport -->
          <main class="main-content ${this.viewport.device}">
            ${this.renderLayoutView(t, r)}
          </main>
        </div>

        <!-- Phone Bottom Bar: Shown when on phone in non-sidebar mode -->
        ${this.viewport.device === "phone" && t !== "sidebar" ? l`
              <homesmart-sidebar-nav
                .areas="${r}"
                .selectedAreaId="${this.selectedAreaId}"
                .device="${this.viewport.device}"
                .locale="${this.config.locale}"
                .lightsOn="${e.lightsOn}"
                .totalActive="${e.totalActive}"
                .editMode="${this.editMode}"
              ></homesmart-sidebar-nav>
            ` : ""}

        <!-- Security Protected Confirmation Modal -->
        <homesmart-confirm-dialog
          .open="${this.confirmModalOpen}"
          .protection="${this.protectedModalConfig}"
          .entityName="${this.protectedModalEntityName}"
          .entityIcon="${this.protectedModalEntityIcon}"
          .locale="${this.config.locale}"
          @confirm-success="${this.handleConfirmSuccess}"
          @confirm-cancel="${() => this.confirmModalOpen = !1}"
        ></homesmart-confirm-dialog>

        <!-- OLED Screensaver for Tablets & TV -->
        <homesmart-oled-screensaver
          .active="${this.screensaverActive}"
          .weatherEntity="${i}"
          .locale="${this.config.locale}"
        ></homesmart-oled-screensaver>
      </div>
    `;
  }
  renderLayoutView(r, e) {
    switch (r) {
      case "tv":
        return this.renderTvLayout(e);
      case "focus":
        return this.renderFocusLayout(e);
      case "grid":
        return this.renderGridLayout(e);
      case "sidebar":
      default:
        return this.renderSidebarMainContent(e);
    }
  }
  /**
   * TV Console (10-Foot UI) Layout
   */
  renderTvLayout(r) {
    const e = r.find((t) => t.id === this.selectedAreaId) || r[0] || null;
    return l`
      <div class="tv-header">
        ${r.map(
      (t) => l`
            <button
              class="tv-tab-item ${(e == null ? void 0 : e.id) === t.id ? "active" : ""}"
              @click="${() => this.selectedAreaId = t.id}"
            >
              ${f(t.icon, 22)}
              <span>${t.name}</span>
            </button>
          `
    )}
      </div>

      ${e ? this.renderAreaBentoGrid(e) : l`<div class="empty-notice">${d("no_entities", this.config.locale)}</div>`}
    `;
  }
  /**
   * Focus Mode Layout (Single Room with Top Tab Switcher)
   */
  renderFocusLayout(r) {
    const e = r.find((t) => t.id === this.selectedAreaId) || r[0] || null;
    return l`
      <div class="focus-header">
        ${r.map(
      (t) => l`
            <button
              class="focus-tab ${(e == null ? void 0 : e.id) === t.id ? "active" : ""}"
              @click="${() => this.selectedAreaId = t.id}"
            >
              ${f(t.icon, 16)}
              <span>${t.name}</span>
            </button>
          `
    )}
      </div>

      ${e ? this.renderAreaBentoGrid(e) : l`<div class="empty-notice">${d("no_entities", this.config.locale)}</div>`}
    `;
  }
  /**
   * Grid Mode Layout (All Areas stacked in Bento groups)
   */
  renderGridLayout(r) {
    return l`
      ${r.map(
      (e) => l`
          <section class="grid-area-section">
            <div class="area-title-bar">
              <div class="area-heading">
                ${f(e.icon, 26)}
                <span class="area-title-text">${e.name}</span>
              </div>
              <span class="area-count-chip">${e.entities.length}</span>
            </div>
            ${this.renderAreaBentoGrid(e)}
          </section>
        `
    )}
    `;
  }
  /**
   * Standard Sidebar Main Content View
   */
  renderSidebarMainContent(r) {
    if (this.selectedAreaId === "")
      return this.renderGridLayout(r);
    const e = r.find((t) => t.id === this.selectedAreaId);
    return e ? l`
      <div class="area-title-bar">
        <div class="area-heading">
          ${f(e.icon, 28)}
          <span class="area-title-text">${e.name}</span>
        </div>
        <span class="area-count-chip">${e.entities.length}</span>
      </div>
      ${this.renderAreaBentoGrid(e)}
    ` : l`<div class="empty-notice">${d("no_entities", this.config.locale)}</div>`;
  }
  /**
   * Render Bento Cards for a given area
   */
  renderAreaBentoGrid(r) {
    return !r.entities || r.entities.length === 0 ? l`<div class="empty-notice">${d("no_entities", this.config.locale)}</div>` : l`
      <div class="bento-grid">
        ${r.entities.map((e) => this.renderEntityCard(e))}
      </div>
    `;
  }
  /**
   * Render individual Bento card based on its size and domain
   */
  renderEntityCard(r) {
    const e = r.size;
    return l`
      <div class="card-item size-${e}">
        ${e === "1x1" ? l`
              <homesmart-card-1x1
                .hass="${this.hass}"
                .entity="${r}"
                .editMode="${this.editMode}"
                .locale="${this.config.locale}"
              ></homesmart-card-1x1>
            ` : e === "2x1" ? l`
              <homesmart-card-2x1-slider
                .hass="${this.hass}"
                .entity="${r}"
                .editMode="${this.editMode}"
                .locale="${this.config.locale}"
              ></homesmart-card-2x1-slider>
            ` : r.domain === "climate" || r.domain === "water_heater" ? l`
              <homesmart-card-2x2-climate
                .hass="${this.hass}"
                .entity="${r}"
                .editMode="${this.editMode}"
                .locale="${this.config.locale}"
              ></homesmart-card-2x2-climate>
            ` : l`
              <homesmart-card-2x2-media-cam
                .hass="${this.hass}"
                .entity="${r}"
                .editMode="${this.editMode}"
                .locale="${this.config.locale}"
              ></homesmart-card-2x2-media-cam>
            `}
      </div>
    `;
  }
  handleConfirmSuccess() {
    this.confirmModalOpen = !1, this.pendingProtectedAction && (this.pendingProtectedAction(), this.pendingProtectedAction = null);
  }
};
x.styles = [
  _t,
  k`
      :host {
        display: block;
        width: 100%;
        min-height: 100vh;
        background: #000;
        box-sizing: border-box;
      }

      .app-layout {
        display: flex;
        width: 100%;
        min-height: 100vh;
        box-sizing: border-box;
      }

      .main-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        min-width: 0;
        padding: 24px;
        box-sizing: border-box;
        overflow-y: auto;
      }

      .main-content.phone {
        padding: 16px 14px 90px; /* Space for mobile bottom bar */
      }

      /* TV Layout Header */
      .tv-header {
        display: flex;
        align-items: center;
        gap: 12px;
        overflow-x: auto;
        padding-bottom: 16px;
        margin-bottom: 20px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      }

      .tv-tab-item {
        padding: 12px 22px;
        border-radius: 18px;
        background: rgba(255, 255, 255, 0.08);
        border: 1px solid rgba(255, 255, 255, 0.14);
        color: #fff;
        font-size: 16px;
        font-weight: 700;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 10px;
        white-space: nowrap;
        transition: all 0.2s ease;
      }

      .tv-tab-item:hover,
      .tv-tab-item.active {
        background: var(--hs-active-gradient, linear-gradient(135deg, #00f2fe 0%, #4facfe 100%));
        color: #05040d;
        box-shadow: 0 0 20px var(--hs-glow-color, rgba(0, 242, 254, 0.45));
      }

      /* Focus Layout Header */
      .focus-header {
        display: flex;
        align-items: center;
        gap: 8px;
        overflow-x: auto;
        padding-bottom: 14px;
        margin-bottom: 16px;
      }

      .focus-tab {
        padding: 8px 16px;
        border-radius: 14px;
        background: rgba(255, 255, 255, 0.06);
        border: 1px solid rgba(255, 255, 255, 0.1);
        color: var(--hs-text-secondary, rgba(255, 255, 255, 0.7));
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 6px;
        white-space: nowrap;
      }

      .focus-tab.active {
        background: var(--hs-accent, #00f2fe);
        color: #000;
        font-weight: 700;
      }

      /* Area Title Bar */
      .area-title-bar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 20px;
      }

      .area-heading {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .area-title-text {
        font-size: 24px;
        font-weight: 800;
        color: #ffffff;
        font-family: var(--hs-font-display, sans-serif);
      }

      .area-count-chip {
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.15);
        border-radius: 12px;
        padding: 3px 10px;
        font-size: 12px;
        font-weight: 600;
        color: var(--hs-text-secondary, rgba(255, 255, 255, 0.8));
      }

      /* Bento Grid Foundation */
      .bento-grid {
        display: grid;
        grid-template-columns: repeat(var(--hs-columns, 4), 1fr);
        grid-auto-rows: minmax(130px, auto);
        gap: 18px;
        width: 100%;
        box-sizing: border-box;
      }

      /* Bento Card Span Rules */
      .card-item.size-1x1 {
        grid-column: span 1;
        grid-row: span 1;
      }

      .card-item.size-2x1 {
        grid-column: span 2;
        grid-row: span 1;
      }

      .card-item.size-2x2 {
        grid-column: span 2;
        grid-row: span 2;
      }

      /* Phone Viewport adjustments */
      .phone .bento-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
      }

      .phone .card-item.size-2x1,
      .phone .card-item.size-2x2 {
        grid-column: span 2;
      }

      /* Grid Mode (All Areas stacked) */
      .grid-area-section {
        margin-bottom: 36px;
      }

      .empty-notice {
        padding: 40px 20px;
        text-align: center;
        color: var(--hs-text-muted, rgba(255, 255, 255, 0.45));
        font-size: 15px;
      }
    `
];
$([
  u({ attribute: !1 })
], x.prototype, "hass", 1);
$([
  b()
], x.prototype, "config", 2);
$([
  b()
], x.prototype, "selectedAreaId", 2);
$([
  b()
], x.prototype, "editMode", 2);
$([
  b()
], x.prototype, "showHidden", 2);
$([
  b()
], x.prototype, "viewport", 2);
$([
  b()
], x.prototype, "screensaverActive", 2);
$([
  b()
], x.prototype, "confirmModalOpen", 2);
$([
  b()
], x.prototype, "pendingProtectedAction", 2);
$([
  b()
], x.prototype, "protectedModalEntityName", 2);
$([
  b()
], x.prototype, "protectedModalEntityIcon", 2);
$([
  b()
], x.prototype, "protectedModalConfig", 2);
x = $([
  H("homesmart-panel")
], x);
export {
  x as HomeSmartPanel
};
