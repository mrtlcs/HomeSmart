/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const Se = globalThis, Be = Se.ShadowRoot && (Se.ShadyCSS === void 0 || Se.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, Ue = Symbol(), Ye = /* @__PURE__ */ new WeakMap();
let ht = class {
  constructor(e, t, i) {
    if (this._$cssResult$ = !0, i !== Ue) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    this.cssText = e, this.t = t;
  }
  get styleSheet() {
    let e = this.o;
    const t = this.t;
    if (Be && e === void 0) {
      const i = t !== void 0 && t.length === 1;
      i && (e = Ye.get(t)), e === void 0 && ((this.o = e = new CSSStyleSheet()).replaceSync(this.cssText), i && Ye.set(t, e));
    }
    return e;
  }
  toString() {
    return this.cssText;
  }
};
const yt = (a) => new ht(typeof a == "string" ? a : a + "", void 0, Ue), _ = (a, ...e) => {
  const t = a.length === 1 ? a[0] : e.reduce((i, s, r) => i + ((o) => {
    if (o._$cssResult$ === !0) return o.cssText;
    if (typeof o == "number") return o;
    throw Error("Value passed to 'css' function must be a 'css' function result: " + o + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
  })(s) + a[r + 1], a[0]);
  return new ht(t, a, Ue);
}, wt = (a, e) => {
  if (Be) a.adoptedStyleSheets = e.map((t) => t instanceof CSSStyleSheet ? t : t.styleSheet);
  else for (const t of e) {
    const i = document.createElement("style"), s = Se.litNonce;
    s !== void 0 && i.setAttribute("nonce", s), i.textContent = t.cssText, a.appendChild(i);
  }
}, We = Be ? (a) => a : (a) => a instanceof CSSStyleSheet ? ((e) => {
  let t = "";
  for (const i of e.cssRules) t += i.cssText;
  return yt(t);
})(a) : a;
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const { is: _t, defineProperty: $t, getOwnPropertyDescriptor: kt, getOwnPropertyNames: At, getOwnPropertySymbols: Ct, getPrototypeOf: Mt } = Object, T = globalThis, Xe = T.trustedTypes, Ht = Xe ? Xe.emptyScript : "", De = T.reactiveElementPolyfillSupport, be = (a, e) => a, Ee = { toAttribute(a, e) {
  switch (e) {
    case Boolean:
      a = a ? Ht : null;
      break;
    case Object:
    case Array:
      a = a == null ? a : JSON.stringify(a);
  }
  return a;
}, fromAttribute(a, e) {
  let t = a;
  switch (e) {
    case Boolean:
      t = a !== null;
      break;
    case Number:
      t = a === null ? null : Number(a);
      break;
    case Object:
    case Array:
      try {
        t = JSON.parse(a);
      } catch {
        t = null;
      }
  }
  return t;
} }, Fe = (a, e) => !_t(a, e), Ke = { attribute: !0, type: String, converter: Ee, reflect: !1, useDefault: !1, hasChanged: Fe };
Symbol.metadata ?? (Symbol.metadata = Symbol("metadata")), T.litPropertyMetadata ?? (T.litPropertyMetadata = /* @__PURE__ */ new WeakMap());
let q = class extends HTMLElement {
  static addInitializer(e) {
    this._$Ei(), (this.l ?? (this.l = [])).push(e);
  }
  static get observedAttributes() {
    return this.finalize(), this._$Eh && [...this._$Eh.keys()];
  }
  static createProperty(e, t = Ke) {
    if (t.state && (t.attribute = !1), this._$Ei(), this.prototype.hasOwnProperty(e) && ((t = Object.create(t)).wrapped = !0), this.elementProperties.set(e, t), !t.noAccessor) {
      const i = Symbol(), s = this.getPropertyDescriptor(e, i, t);
      s !== void 0 && $t(this.prototype, e, s);
    }
  }
  static getPropertyDescriptor(e, t, i) {
    const { get: s, set: r } = kt(this.prototype, e) ?? { get() {
      return this[t];
    }, set(o) {
      this[t] = o;
    } };
    return { get: s, set(o) {
      const n = s == null ? void 0 : s.call(this);
      r == null || r.call(this, o), this.requestUpdate(e, n, i);
    }, configurable: !0, enumerable: !0 };
  }
  static getPropertyOptions(e) {
    return this.elementProperties.get(e) ?? Ke;
  }
  static _$Ei() {
    if (this.hasOwnProperty(be("elementProperties"))) return;
    const e = Mt(this);
    e.finalize(), e.l !== void 0 && (this.l = [...e.l]), this.elementProperties = new Map(e.elementProperties);
  }
  static finalize() {
    if (this.hasOwnProperty(be("finalized"))) return;
    if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(be("properties"))) {
      const t = this.properties, i = [...At(t), ...Ct(t)];
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
      for (const s of i) t.unshift(We(s));
    } else e !== void 0 && t.push(We(e));
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
    return wt(e, this.constructor.elementStyles), e;
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
    var r;
    const i = this.constructor.elementProperties.get(e), s = this.constructor._$Eu(e, i);
    if (s !== void 0 && i.reflect === !0) {
      const o = (((r = i.converter) == null ? void 0 : r.toAttribute) !== void 0 ? i.converter : Ee).toAttribute(t, i.type);
      this._$Em = e, o == null ? this.removeAttribute(s) : this.setAttribute(s, o), this._$Em = null;
    }
  }
  _$AK(e, t) {
    var r, o;
    const i = this.constructor, s = i._$Eh.get(e);
    if (s !== void 0 && this._$Em !== s) {
      const n = i.getPropertyOptions(s), d = typeof n.converter == "function" ? { fromAttribute: n.converter } : ((r = n.converter) == null ? void 0 : r.fromAttribute) !== void 0 ? n.converter : Ee;
      this._$Em = s;
      const f = d.fromAttribute(t, n.type);
      this[s] = f ?? ((o = this._$Ej) == null ? void 0 : o.get(s)) ?? f, this._$Em = null;
    }
  }
  requestUpdate(e, t, i, s = !1, r) {
    var o;
    if (e !== void 0) {
      const n = this.constructor;
      if (s === !1 && (r = this[e]), i ?? (i = n.getPropertyOptions(e)), !((i.hasChanged ?? Fe)(r, t) || i.useDefault && i.reflect && r === ((o = this._$Ej) == null ? void 0 : o.get(e)) && !this.hasAttribute(n._$Eu(e, i)))) return;
      this.C(e, t, i);
    }
    this.isUpdatePending === !1 && (this._$ES = this._$EP());
  }
  C(e, t, { useDefault: i, reflect: s, wrapped: r }, o) {
    i && !(this._$Ej ?? (this._$Ej = /* @__PURE__ */ new Map())).has(e) && (this._$Ej.set(e, o ?? t ?? this[e]), r !== !0 || o !== void 0) || (this._$AL.has(e) || (this.hasUpdated || i || (t = void 0), this._$AL.set(e, t)), s === !0 && this._$Em !== e && (this._$Eq ?? (this._$Eq = /* @__PURE__ */ new Set())).add(e));
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
        for (const [r, o] of this._$Ep) this[r] = o;
        this._$Ep = void 0;
      }
      const s = this.constructor.elementProperties;
      if (s.size > 0) for (const [r, o] of s) {
        const { wrapped: n } = o, d = this[r];
        n !== !0 || this._$AL.has(r) || d === void 0 || this.C(r, void 0, o, d);
      }
    }
    let e = !1;
    const t = this._$AL;
    try {
      e = this.shouldUpdate(t), e ? (this.willUpdate(t), (i = this._$EO) == null || i.forEach((s) => {
        var r;
        return (r = s.hostUpdate) == null ? void 0 : r.call(s);
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
q.elementStyles = [], q.shadowRootOptions = { mode: "open" }, q[be("elementProperties")] = /* @__PURE__ */ new Map(), q[be("finalized")] = /* @__PURE__ */ new Map(), De == null || De({ ReactiveElement: q }), (T.reactiveElementVersions ?? (T.reactiveElementVersions = [])).push("2.1.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const me = globalThis, Je = (a) => a, Le = me.trustedTypes, Qe = Le ? Le.createPolicy("lit-html", { createHTML: (a) => a }) : void 0, pt = "$lit$", V = `lit$${Math.random().toFixed(9).slice(2)}$`, ut = "?" + V, St = `<${ut}>`, B = document, ve = () => B.createComment(""), xe = (a) => a === null || typeof a != "object" && typeof a != "function", Ze = Array.isArray, Et = (a) => Ze(a) || typeof (a == null ? void 0 : a[Symbol.iterator]) == "function", je = `[ 	
\f\r]`, fe = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, et = /-->/g, tt = />/g, R = RegExp(`>|${je}(?:([^\\s"'>=/]+)(${je}*=${je}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`, "g"), it = /'/g, st = /"/g, gt = /^(?:script|style|textarea|title)$/i, Lt = (a) => (e, ...t) => ({ _$litType$: a, strings: e, values: t }), c = Lt(1), ce = Symbol.for("lit-noChange"), y = Symbol.for("lit-nothing"), at = /* @__PURE__ */ new WeakMap(), I = B.createTreeWalker(B, 129);
function ft(a, e) {
  if (!Ze(a) || !a.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return Qe !== void 0 ? Qe.createHTML(e) : e;
}
const Vt = (a, e) => {
  const t = a.length - 1, i = [];
  let s, r = e === 2 ? "<svg>" : e === 3 ? "<math>" : "", o = fe;
  for (let n = 0; n < t; n++) {
    const d = a[n];
    let f, g, u = -1, v = 0;
    for (; v < d.length && (o.lastIndex = v, g = o.exec(d), g !== null); ) v = o.lastIndex, o === fe ? g[1] === "!--" ? o = et : g[1] !== void 0 ? o = tt : g[2] !== void 0 ? (gt.test(g[2]) && (s = RegExp("</" + g[2], "g")), o = R) : g[3] !== void 0 && (o = R) : o === R ? g[0] === ">" ? (o = s ?? fe, u = -1) : g[1] === void 0 ? u = -2 : (u = o.lastIndex - g[2].length, f = g[1], o = g[3] === void 0 ? R : g[3] === '"' ? st : it) : o === st || o === it ? o = R : o === et || o === tt ? o = fe : (o = R, s = void 0);
    const A = o === R && a[n + 1].startsWith("/>") ? " " : "";
    r += o === fe ? d + St : u >= 0 ? (i.push(f), d.slice(0, u) + pt + d.slice(u) + V + A) : d + V + (u === -2 ? n : A);
  }
  return [ft(a, r + (a[t] || "<?>") + (e === 2 ? "</svg>" : e === 3 ? "</math>" : "")), i];
};
class ye {
  constructor({ strings: e, _$litType$: t }, i) {
    let s;
    this.parts = [];
    let r = 0, o = 0;
    const n = e.length - 1, d = this.parts, [f, g] = Vt(e, t);
    if (this.el = ye.createElement(f, i), I.currentNode = this.el.content, t === 2 || t === 3) {
      const u = this.el.content.firstChild;
      u.replaceWith(...u.childNodes);
    }
    for (; (s = I.nextNode()) !== null && d.length < n; ) {
      if (s.nodeType === 1) {
        if (s.hasAttributes()) for (const u of s.getAttributeNames()) if (u.endsWith(pt)) {
          const v = g[o++], A = s.getAttribute(u).split(V), m = /([.?@])?(.*)/.exec(v);
          d.push({ type: 1, index: r, name: m[2], strings: A, ctor: m[1] === "." ? Pt : m[1] === "?" ? zt : m[1] === "@" ? Ot : Ve }), s.removeAttribute(u);
        } else u.startsWith(V) && (d.push({ type: 6, index: r }), s.removeAttribute(u));
        if (gt.test(s.tagName)) {
          const u = s.textContent.split(V), v = u.length - 1;
          if (v > 0) {
            s.textContent = Le ? Le.emptyScript : "";
            for (let A = 0; A < v; A++) s.append(u[A], ve()), I.nextNode(), d.push({ type: 2, index: ++r });
            s.append(u[v], ve());
          }
        }
      } else if (s.nodeType === 8) if (s.data === ut) d.push({ type: 2, index: r });
      else {
        let u = -1;
        for (; (u = s.data.indexOf(V, u + 1)) !== -1; ) d.push({ type: 7, index: r }), u += V.length - 1;
      }
      r++;
    }
  }
  static createElement(e, t) {
    const i = B.createElement("template");
    return i.innerHTML = e, i;
  }
}
function le(a, e, t = a, i) {
  var o, n;
  if (e === ce) return e;
  let s = i !== void 0 ? (o = t._$Co) == null ? void 0 : o[i] : t._$Cl;
  const r = xe(e) ? void 0 : e._$litDirective$;
  return (s == null ? void 0 : s.constructor) !== r && ((n = s == null ? void 0 : s._$AO) == null || n.call(s, !1), r === void 0 ? s = void 0 : (s = new r(a), s._$AT(a, t, i)), i !== void 0 ? (t._$Co ?? (t._$Co = []))[i] = s : t._$Cl = s), s !== void 0 && (e = le(a, s._$AS(a, e.values), s, i)), e;
}
class Tt {
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
    const { el: { content: t }, parts: i } = this._$AD, s = ((e == null ? void 0 : e.creationScope) ?? B).importNode(t, !0);
    I.currentNode = s;
    let r = I.nextNode(), o = 0, n = 0, d = i[0];
    for (; d !== void 0; ) {
      if (o === d.index) {
        let f;
        d.type === 2 ? f = new Ae(r, r.nextSibling, this, e) : d.type === 1 ? f = new d.ctor(r, d.name, d.strings, this, e) : d.type === 6 && (f = new Dt(r, this, e)), this._$AV.push(f), d = i[++n];
      }
      o !== (d == null ? void 0 : d.index) && (r = I.nextNode(), o++);
    }
    return I.currentNode = B, s;
  }
  p(e) {
    let t = 0;
    for (const i of this._$AV) i !== void 0 && (i.strings !== void 0 ? (i._$AI(e, i, t), t += i.strings.length - 2) : i._$AI(e[t])), t++;
  }
}
class Ae {
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
    e = le(this, e, t), xe(e) ? e === y || e == null || e === "" ? (this._$AH !== y && this._$AR(), this._$AH = y) : e !== this._$AH && e !== ce && this._(e) : e._$litType$ !== void 0 ? this.$(e) : e.nodeType !== void 0 ? this.T(e) : Et(e) ? this.k(e) : this._(e);
  }
  O(e) {
    return this._$AA.parentNode.insertBefore(e, this._$AB);
  }
  T(e) {
    this._$AH !== e && (this._$AR(), this._$AH = this.O(e));
  }
  _(e) {
    this._$AH !== y && xe(this._$AH) ? this._$AA.nextSibling.data = e : this.T(B.createTextNode(e)), this._$AH = e;
  }
  $(e) {
    var r;
    const { values: t, _$litType$: i } = e, s = typeof i == "number" ? this._$AC(e) : (i.el === void 0 && (i.el = ye.createElement(ft(i.h, i.h[0]), this.options)), i);
    if (((r = this._$AH) == null ? void 0 : r._$AD) === s) this._$AH.p(t);
    else {
      const o = new Tt(s, this), n = o.u(this.options);
      o.p(t), this.T(n), this._$AH = o;
    }
  }
  _$AC(e) {
    let t = at.get(e.strings);
    return t === void 0 && at.set(e.strings, t = new ye(e)), t;
  }
  k(e) {
    Ze(this._$AH) || (this._$AH = [], this._$AR());
    const t = this._$AH;
    let i, s = 0;
    for (const r of e) s === t.length ? t.push(i = new Ae(this.O(ve()), this.O(ve()), this, this.options)) : i = t[s], i._$AI(r), s++;
    s < t.length && (this._$AR(i && i._$AB.nextSibling, s), t.length = s);
  }
  _$AR(e = this._$AA.nextSibling, t) {
    var i;
    for ((i = this._$AP) == null ? void 0 : i.call(this, !1, !0, t); e !== this._$AB; ) {
      const s = Je(e).nextSibling;
      Je(e).remove(), e = s;
    }
  }
  setConnected(e) {
    var t;
    this._$AM === void 0 && (this._$Cv = e, (t = this._$AP) == null || t.call(this, e));
  }
}
class Ve {
  get tagName() {
    return this.element.tagName;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  constructor(e, t, i, s, r) {
    this.type = 1, this._$AH = y, this._$AN = void 0, this.element = e, this.name = t, this._$AM = s, this.options = r, i.length > 2 || i[0] !== "" || i[1] !== "" ? (this._$AH = Array(i.length - 1).fill(new String()), this.strings = i) : this._$AH = y;
  }
  _$AI(e, t = this, i, s) {
    const r = this.strings;
    let o = !1;
    if (r === void 0) e = le(this, e, t, 0), o = !xe(e) || e !== this._$AH && e !== ce, o && (this._$AH = e);
    else {
      const n = e;
      let d, f;
      for (e = r[0], d = 0; d < r.length - 1; d++) f = le(this, n[i + d], t, d), f === ce && (f = this._$AH[d]), o || (o = !xe(f) || f !== this._$AH[d]), f === y ? e = y : e !== y && (e += (f ?? "") + r[d + 1]), this._$AH[d] = f;
    }
    o && !s && this.j(e);
  }
  j(e) {
    e === y ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, e ?? "");
  }
}
class Pt extends Ve {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(e) {
    this.element[this.name] = e === y ? void 0 : e;
  }
}
class zt extends Ve {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(e) {
    this.element.toggleAttribute(this.name, !!e && e !== y);
  }
}
class Ot extends Ve {
  constructor(e, t, i, s, r) {
    super(e, t, i, s, r), this.type = 5;
  }
  _$AI(e, t = this) {
    if ((e = le(this, e, t, 0) ?? y) === ce) return;
    const i = this._$AH, s = e === y && i !== y || e.capture !== i.capture || e.once !== i.once || e.passive !== i.passive, r = e !== y && (i === y || s);
    s && this.element.removeEventListener(this.name, this, i), r && this.element.addEventListener(this.name, this, e), this._$AH = e;
  }
  handleEvent(e) {
    var t;
    typeof this._$AH == "function" ? this._$AH.call(((t = this.options) == null ? void 0 : t.host) ?? this.element, e) : this._$AH.handleEvent(e);
  }
}
class Dt {
  constructor(e, t, i) {
    this.element = e, this.type = 6, this._$AN = void 0, this._$AM = t, this.options = i;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AI(e) {
    le(this, e);
  }
}
const Re = me.litHtmlPolyfillSupport;
Re == null || Re(ye, Ae), (me.litHtmlVersions ?? (me.litHtmlVersions = [])).push("3.3.3");
const jt = (a, e, t) => {
  const i = (t == null ? void 0 : t.renderBefore) ?? e;
  let s = i._$litPart$;
  if (s === void 0) {
    const r = (t == null ? void 0 : t.renderBefore) ?? null;
    i._$litPart$ = s = new Ae(e.insertBefore(ve(), r), r, void 0, t ?? {});
  }
  return s._$AI(a), s;
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const N = globalThis;
class x extends q {
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
    this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(e), this._$Do = jt(t, this.renderRoot, this.renderOptions);
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
    return ce;
  }
}
var dt;
x._$litElement$ = !0, x.finalized = !0, (dt = N.litElementHydrateSupport) == null || dt.call(N, { LitElement: x });
const Ie = N.litElementPolyfillSupport;
Ie == null || Ie({ LitElement: x });
(N.litElementVersions ?? (N.litElementVersions = [])).push("4.2.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const k = (a) => (e, t) => {
  t !== void 0 ? t.addInitializer(() => {
    customElements.define(a, e);
  }) : customElements.define(a, e);
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const Rt = { attribute: !0, type: String, converter: Ee, reflect: !1, hasChanged: Fe }, It = (a = Rt, e, t) => {
  const { kind: i, metadata: s } = t;
  let r = globalThis.litPropertyMetadata.get(s);
  if (r === void 0 && globalThis.litPropertyMetadata.set(s, r = /* @__PURE__ */ new Map()), i === "setter" && ((a = Object.create(a)).wrapped = !0), r.set(t.name, a), i === "accessor") {
    const { name: o } = t;
    return { set(n) {
      const d = e.get.call(this);
      e.set.call(this, n), this.requestUpdate(o, d, a, !0, n);
    }, init(n) {
      return n !== void 0 && this.C(o, void 0, a, n), n;
    } };
  }
  if (i === "setter") {
    const { name: o } = t;
    return function(n) {
      const d = this[o];
      e.call(this, n), this.requestUpdate(o, d, a, !0, n);
    };
  }
  throw Error("Unsupported decorator location: " + i);
};
function h(a) {
  return (e, t) => typeof t == "object" ? It(a, e, t) : ((i, s, r) => {
    const o = s.hasOwnProperty(r);
    return s.constructor.createProperty(r, i), o ? Object.getOwnPropertyDescriptor(s, r) : void 0;
  })(a, e, t);
}
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
function b(a) {
  return h({ ...a, state: !0, attribute: !1 });
}
const Ne = {
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
    // HomeDeck Pro Hero Header
    home_status: "TRẠNG THÁI NHÀ",
    lights_on_at_home: "đèn đang bật trong nhà",
    all_lights_off: "Tất cả đèn đang tắt",
    scenes_title: "NGỮ CẢNH",
    scene_away: "Ra ngoài",
    scene_home: "Về nhà",
    scene_sleep: "Đi ngủ",
    scene_movie: "Xem phim",
    turn_all_on: "Bật tất cả",
    turn_all_off: "Tắt tất cả",
    // Floating Capsule Dock
    tab_home: "Home",
    tab_rooms: "Rooms",
    tab_media: "Media",
    tab_security: "Security",
    // Deck Cards
    security_title: "AN NINH",
    everything_secure: "An toàn tuyệt đối",
    security_alert: "Cảnh báo an ninh!",
    monitored_items: "thiết bị giám sát",
    active_count: "đang bật",
    room_detail_title: "Chi tiết phòng",
    close: "Đóng",
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
    theme_midnight: "Midnight Deck (Chuẩn HomeDeck)",
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
    layout_deck: "HomeDeck Thẻ Dọc",
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
    // HomeDeck Pro Hero Header
    home_status: "HOME STATUS",
    lights_on_at_home: "lights on at home",
    all_lights_off: "All lights are off",
    scenes_title: "SCENES",
    scene_away: "Away",
    scene_home: "Home",
    scene_sleep: "Sleep",
    scene_movie: "Movie",
    turn_all_on: "Turn all on",
    turn_all_off: "Turn all off",
    // Floating Capsule Dock
    tab_home: "Home",
    tab_rooms: "Rooms",
    tab_media: "Media",
    tab_security: "Security",
    // Deck Cards
    security_title: "SECURITY",
    everything_secure: "Everything secure",
    security_alert: "Security alert!",
    monitored_items: "Monitored Items",
    active_count: "active",
    room_detail_title: "Room Devices",
    close: "Close",
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
    theme_midnight: "Midnight Deck (HomeDeck Style)",
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
    layout_deck: "HomeDeck Tall Cards",
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
function l(a, e = "vi") {
  return (Ne[e] || Ne.vi)[a] || Ne.en[a] || a;
}
const Nt = _`
  @import url('https://fonts.googleapis.com/css2?family=Figtree:wght@300;400;500;600;700&family=Outfit:wght@300;400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

  :host {
    display: block;
    width: 100%;
    height: 100%;
    min-height: 100vh;
    font-family: 'Plus Jakarta Sans', 'Figtree', 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    color: #ffffff;
    box-sizing: border-box;
    overflow-x: hidden;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;

    /* Base Tokens */
    --hs-font-display: 'Plus Jakarta Sans', 'Outfit', sans-serif;
    --hs-font-body: 'Plus Jakarta Sans', 'Figtree', sans-serif;
    --hs-radius-sm: 10px;
    --hs-radius-md: 16px;
    --hs-radius-lg: 24px;
    --hs-radius-xl: 32px;
    --hs-transition-fast: 0.15s cubic-bezier(0.16, 1, 0.3, 1);
    --hs-transition-normal: 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    --hs-transition-slow: 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  }

  /* ========================================================
     THEME 0: MIDNIGHT DECK (HOMEDECK PRO EXACT INSPIRATION)
     Deep Navy / Sapphire with Right Atmospheric Soft Spotlight
     ======================================================== */
  :host([data-theme='midnight']),
  :host(:not([data-theme])),
  .theme-midnight {
    --hs-bg-gradient: radial-gradient(ellipse 95% 70% at 75% 50%, #1e355b 0%, #0e1a2f 45%, #070d18 100%);
    --hs-glass-bg: rgba(22, 36, 62, 0.38);
    --hs-glass-bg-hover: rgba(30, 48, 82, 0.55);
    --hs-glass-bg-active: rgba(40, 64, 108, 0.72);
    --hs-glass-border: rgba(255, 255, 255, 0.08);
    --hs-glass-border-hover: rgba(255, 255, 255, 0.16);
    --hs-glass-border-active: rgba(147, 197, 253, 0.45);
    --hs-accent: #38bdf8;
    --hs-accent-secondary: #818cf8;
    --hs-glow-color: rgba(56, 189, 248, 0.25);
    --hs-text-primary: #ffffff;
    --hs-text-secondary: rgba(255, 255, 255, 0.65);
    --hs-text-muted: rgba(255, 255, 255, 0.42);
    --hs-sidebar-bg: rgba(8, 14, 26, 0.82);
    --hs-active-gradient: linear-gradient(135deg, #38bdf8 0%, #818cf8 100%);
  }

  /* ========================================================
     THEME 1: AURORA (VIOLET / INDIGO / NEON TEAL GLOW)
     ======================================================== */
  :host([data-theme='aurora']),
  .theme-aurora {
    --hs-bg-gradient: radial-gradient(ellipse 90% 70% at 75% 45%, #291b58 0%, #100b2a 45%, #05040f 100%);
    --hs-glass-bg: rgba(28, 22, 58, 0.42);
    --hs-glass-bg-hover: rgba(38, 30, 78, 0.6);
    --hs-glass-bg-active: rgba(50, 40, 102, 0.8);
    --hs-glass-border: rgba(255, 255, 255, 0.09);
    --hs-glass-border-hover: rgba(180, 165, 255, 0.3);
    --hs-glass-border-active: rgba(0, 242, 254, 0.55);
    --hs-accent: #00f2fe;
    --hs-accent-secondary: #7f5af0;
    --hs-glow-color: rgba(0, 242, 254, 0.25);
    --hs-text-primary: #ffffff;
    --hs-text-secondary: rgba(255, 255, 255, 0.68);
    --hs-text-muted: rgba(255, 255, 255, 0.42);
    --hs-sidebar-bg: rgba(12, 9, 30, 0.82);
    --hs-active-gradient: linear-gradient(135deg, #00f2fe 0%, #4facfe 100%);
  }

  /* ========================================================
     THEME 2: OCEAN (DEEP SAPPHIRE / NAVY / CYAN)
     ======================================================== */
  :host([data-theme='ocean']),
  .theme-ocean {
    --hs-bg-gradient: radial-gradient(ellipse 90% 70% at 75% 45%, #133a6b 0%, #091c36 45%, #030a15 100%);
    --hs-glass-bg: rgba(13, 42, 78, 0.42);
    --hs-glass-bg-hover: rgba(20, 62, 112, 0.6);
    --hs-glass-bg-active: rgba(28, 84, 148, 0.8);
    --hs-glass-border: rgba(255, 255, 255, 0.09);
    --hs-glass-border-hover: rgba(120, 195, 255, 0.35);
    --hs-glass-border-active: rgba(0, 217, 255, 0.55);
    --hs-accent: #00d9ff;
    --hs-accent-secondary: #0072ff;
    --hs-glow-color: rgba(0, 217, 255, 0.28);
    --hs-text-primary: #ffffff;
    --hs-text-secondary: rgba(230, 245, 255, 0.7);
    --hs-text-muted: rgba(180, 215, 255, 0.42);
    --hs-sidebar-bg: rgba(6, 18, 36, 0.82);
    --hs-active-gradient: linear-gradient(135deg, #00c6ff 0%, #0072ff 100%);
  }

  /* ========================================================
     THEME 3: WINE (DARK RUBY / BURGUNDY / ROSE)
     ======================================================== */
  :host([data-theme='wine']),
  .theme-wine {
    --hs-bg-gradient: radial-gradient(ellipse 90% 70% at 75% 45%, #46142e 0%, #200714 45%, #0a0206 100%);
    --hs-glass-bg: rgba(56, 18, 38, 0.42);
    --hs-glass-bg-hover: rgba(78, 26, 54, 0.6);
    --hs-glass-bg-active: rgba(104, 34, 72, 0.8);
    --hs-glass-border: rgba(255, 255, 255, 0.09);
    --hs-glass-border-hover: rgba(255, 145, 175, 0.35);
    --hs-glass-border-active: rgba(255, 75, 114, 0.55);
    --hs-accent: #ff4b72;
    --hs-accent-secondary: #f857a6;
    --hs-glow-color: rgba(255, 75, 114, 0.28);
    --hs-text-primary: #ffffff;
    --hs-text-secondary: rgba(255, 230, 238, 0.7);
    --hs-text-muted: rgba(255, 190, 210, 0.42);
    --hs-sidebar-bg: rgba(24, 6, 16, 0.82);
    --hs-active-gradient: linear-gradient(135deg, #ff4b72 0%, #f857a6 100%);
  }

  /* ========================================================
     THEME 4: GRAPHITE (TITANIUM / DARK SLATE / MONOCHROME)
     ======================================================== */
  :host([data-theme='graphite']),
  .theme-graphite {
    --hs-bg-gradient: radial-gradient(ellipse 90% 70% at 75% 45%, #2a303a 0%, #15181d 45%, #08090b 100%);
    --hs-glass-bg: rgba(34, 39, 48, 0.45);
    --hs-glass-bg-hover: rgba(48, 55, 68, 0.65);
    --hs-glass-bg-active: rgba(62, 71, 88, 0.85);
    --hs-glass-border: rgba(255, 255, 255, 0.08);
    --hs-glass-border-hover: rgba(255, 255, 255, 0.2);
    --hs-glass-border-active: rgba(255, 255, 255, 0.45);
    --hs-accent: #38bdf8;
    --hs-accent-secondary: #e2e8f0;
    --hs-glow-color: rgba(56, 189, 248, 0.25);
    --hs-text-primary: #ffffff;
    --hs-text-secondary: rgba(226, 232, 240, 0.7);
    --hs-text-muted: rgba(148, 163, 184, 0.45);
    --hs-sidebar-bg: rgba(16, 19, 23, 0.85);
    --hs-active-gradient: linear-gradient(135deg, #38bdf8 0%, #818cf8 100%);
  }

  /* ========================================================
     THEME 5: EMERALD (CYBER OBSIDIAN / JADE / MINT)
     ======================================================== */
  :host([data-theme='emerald']),
  .theme-emerald {
    --hs-bg-gradient: radial-gradient(ellipse 90% 70% at 75% 45%, #133a2e 0%, #092019 45%, #020b08 100%);
    --hs-glass-bg: rgba(14, 46, 36, 0.42);
    --hs-glass-bg-hover: rgba(22, 68, 54, 0.6);
    --hs-glass-bg-active: rgba(30, 92, 72, 0.8);
    --hs-glass-border: rgba(255, 255, 255, 0.09);
    --hs-glass-border-hover: rgba(80, 255, 190, 0.35);
    --hs-glass-border-active: rgba(0, 245, 160, 0.55);
    --hs-accent: #00f5a0;
    --hs-accent-secondary: #00d9f5;
    --hs-glow-color: rgba(0, 245, 160, 0.28);
    --hs-text-primary: #ffffff;
    --hs-text-secondary: rgba(230, 255, 245, 0.7);
    --hs-text-muted: rgba(160, 225, 200, 0.42);
    --hs-sidebar-bg: rgba(6, 22, 17, 0.82);
    --hs-active-gradient: linear-gradient(135deg, #00f5a0 0%, #00d9f5 100%);
  }

  /* ========================================================
     THEME 6: SUNSET (CORAL / DUSK AMBER / TWILIGHT)
     ======================================================== */
  :host([data-theme='sunset']),
  .theme-sunset {
    --hs-bg-gradient: radial-gradient(ellipse 90% 70% at 75% 45%, #461d32 0%, #220d1a 45%, #0a0308 100%);
    --hs-glass-bg: rgba(58, 22, 40, 0.42);
    --hs-glass-bg-hover: rgba(82, 32, 58, 0.6);
    --hs-glass-bg-active: rgba(110, 44, 78, 0.8);
    --hs-glass-border: rgba(255, 255, 255, 0.09);
    --hs-glass-border-hover: rgba(254, 180, 123, 0.35);
    --hs-glass-border-active: rgba(255, 126, 95, 0.55);
    --hs-accent: #ff7e5f;
    --hs-accent-secondary: #feb47b;
    --hs-glow-color: rgba(255, 126, 95, 0.28);
    --hs-text-primary: #ffffff;
    --hs-text-secondary: rgba(255, 235, 230, 0.7);
    --hs-text-muted: rgba(255, 195, 180, 0.42);
    --hs-sidebar-bg: rgba(26, 9, 20, 0.82);
    --hs-active-gradient: linear-gradient(135deg, #ff7e5f 0%, #feb47b 100%);
  }

  /* Global App Shell */
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
    backdrop-filter: blur(28px) saturate(160%);
    -webkit-backdrop-filter: blur(28px) saturate(160%);
    border: 1px solid var(--hs-glass-border);
    border-radius: var(--hs-radius-lg);
    box-shadow: 0 10px 30px 0 rgba(0, 0, 0, 0.35);
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
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.22), transparent);
    pointer-events: none;
  }

  .glass-card:hover {
    background: var(--hs-glass-bg-hover);
    border-color: var(--hs-glass-border-hover);
    transform: translateY(-2px);
    box-shadow: 0 14px 40px 0 rgba(0, 0, 0, 0.42);
  }

  .glass-card.active {
    background: var(--hs-glass-bg-active);
    border-color: var(--hs-glass-border-active);
    box-shadow: 0 0 24px var(--hs-glow-color), 0 10px 30px 0 rgba(0, 0, 0, 0.4);
  }

  /* TV / D-Pad Focus Ring */
  .glass-card:focus-visible,
  .glass-card.dpad-focused {
    outline: none !important;
    border-color: var(--hs-accent) !important;
    box-shadow: 0 0 0 3px var(--hs-accent), 0 0 30px var(--hs-glow-color) !important;
    transform: scale(1.02) translateY(-2px) !important;
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
    background: rgba(255, 255, 255, 0.12);
    border-radius: 4px;
  }
  ::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.25);
  }
`, Bt = /* @__PURE__ */ new Set([
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
function Ut(a, e) {
  var t;
  switch (a) {
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
function Ft(a) {
  return a === "lock" ? { type: "confirm" } : { type: "none" };
}
function rt(a, e, t = !1) {
  var o, n, d, f;
  if (!a || !a.states)
    return [];
  const i = /* @__PURE__ */ new Map();
  if (a.areas)
    for (const [g, u] of Object.entries(a.areas))
      i.set(g, {
        id: g,
        name: u.name || g,
        icon: u.icon || Zt(u.name || g),
        picture: u.picture,
        entities: []
      });
  const s = {
    id: "unassigned",
    name: e.locale === "vi" ? "Thiết bị khác" : "Other Devices",
    icon: "mdi:devices",
    entities: []
  };
  for (const [g, u] of Object.entries(a.states)) {
    const v = g.split(".")[0];
    if (!Bt.has(v))
      continue;
    const A = (o = e.hidden_entities) == null ? void 0 : o.includes(g), m = (n = e.custom_cards) == null ? void 0 : n[g], Ge = (m == null ? void 0 : m.hidden) ?? A;
    if (Ge && !t)
      continue;
    let ge = null;
    const L = (d = a.entities) == null ? void 0 : d[g];
    if (L != null && L.area_id)
      ge = L.area_id;
    else if (L != null && L.device_id && a.devices) {
      const He = a.devices[L.device_id];
      He != null && He.area_id && (ge = He.area_id);
    }
    const bt = (m == null ? void 0 : m.size) || Ut(v, u), mt = (m == null ? void 0 : m.protection) || ((f = e.protected_entities) == null ? void 0 : f[g]) || Ft(v), vt = (m == null ? void 0 : m.custom_name) || u.attributes.friendly_name || g, xt = (m == null ? void 0 : m.custom_icon) || u.attributes.icon || Gt(v, u.state), qe = {
      entity_id: g,
      domain: v,
      name: vt,
      icon: xt,
      state: u.state,
      attributes: u.attributes,
      size: bt,
      protection: mt,
      hidden: !!Ge
    };
    ge && i.has(ge) ? i.get(ge).entities.push(qe) : s.entities.push(qe);
  }
  const r = [];
  for (const g of i.values())
    g.entities.length > 0 && (ot(g.entities), r.push(g));
  return s.entities.length > 0 && (ot(s.entities), r.push(s)), e.area_order && e.area_order.length > 0 && r.sort((g, u) => {
    const v = e.area_order.indexOf(g.id), A = e.area_order.indexOf(u.id);
    return v !== -1 && A !== -1 ? v - A : v !== -1 ? -1 : A !== -1 ? 1 : g.name.localeCompare(u.name);
  }), r;
}
function ot(a) {
  const e = {
    "2x2": 1,
    "2x1": 2,
    "1x1": 3
  };
  a.sort((t, i) => {
    const s = e[t.size] - e[i.size];
    return s !== 0 ? s : t.name.localeCompare(i.name);
  });
}
function Zt(a) {
  const e = a.toLowerCase();
  return e.includes("khách") || e.includes("living") ? "mdi:sofa" : e.includes("ngủ") || e.includes("bed") ? "mdi:bed" : e.includes("bếp") || e.includes("kitchen") ? "mdi:silverware-fork-knife" : e.includes("tắm") || e.includes("bath") || e.includes("wc") ? "mdi:shower" : e.includes("sân") || e.includes("vườn") || e.includes("yard") || e.includes("garden") ? "mdi:tree" : e.includes("gara") || e.includes("garage") || e.includes("xe") ? "mdi:garage" : e.includes("làm việc") || e.includes("office") || e.includes("desk") ? "mdi:desk" : e.includes("ninh") || e.includes("cổng") || e.includes("gate") || e.includes("security") ? "mdi:shield-home" : "mdi:home-outline";
}
function Gt(a, e) {
  switch (a) {
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
function qt(a) {
  let e = 0, t = 0;
  for (const i of a)
    for (const s of i.entities)
      s.domain === "light" && s.state === "on" && e++, (s.domain === "switch" && s.state === "on" || s.domain === "fan" && s.state === "on" || s.domain === "climate" && s.state !== "off" || s.domain === "media_player" && (s.state === "playing" || s.state === "on")) && t++;
  return { lightsOn: e, totalActive: t };
}
function nt(a = "auto", e, t) {
  const i = e ?? (typeof window < "u" ? window.innerWidth : 1200), s = t ?? (typeof window < "u" ? window.innerHeight : 800), r = typeof navigator < "u" ? navigator.userAgent.toLowerCase() : "", o = r.includes("android tv") || r.includes("smart-tv") || r.includes("googletv") || r.includes("crkey") || r.includes("hbbtv") || r.includes("tizen"), n = a === "tv" || o;
  let d, f;
  n ? (d = "tv", f = 4) : i < 768 ? (d = "phone", f = 2) : i < 1440 ? (d = "tablet", f = 4) : (d = "desktop", f = 6);
  const g = typeof window < "u" && ("ontouchstart" in window || navigator.maxTouchPoints > 0);
  return {
    width: i,
    height: s,
    device: d,
    gridColumns: f,
    isTouch: g,
    isTV: n
  };
}
class Yt {
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
    let s = null, r = 1 / 0;
    for (const o of t) {
      if (o === this.currentFocus)
        continue;
      const n = o.getBoundingClientRect();
      if (n.width === 0 || n.height === 0 || !this.isInDirection(i, n, e))
        continue;
      const f = this.calculateSpatialDistance(i, n, e);
      f < r && (r = f, s = o);
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
    const s = { x: e.left + e.width / 2, y: e.top + e.height / 2 }, r = { x: t.left + t.width / 2, y: t.top + t.height / 2 };
    switch (i) {
      case "up":
        return r.y < s.y - 10;
      case "down":
        return r.y > s.y + 10;
      case "left":
        return r.x < s.x - 10;
      case "right":
        return r.x > s.x + 10;
    }
  }
  calculateSpatialDistance(e, t, i) {
    const s = { x: e.left + e.width / 2, y: e.top + e.height / 2 }, r = { x: t.left + t.width / 2, y: t.top + t.height / 2 }, o = Math.abs(r.x - s.x), n = Math.abs(r.y - s.y);
    return i === "up" || i === "down" ? n + o * 2.2 : o + n * 2.2;
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
function p(a, e = 24, t = "") {
  const i = a.toLowerCase().replace("mdi:", ""), s = ct[i] || ct.default;
  return c`
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
const ct = {
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
var O = function(a, e, t, i) {
  var s = arguments.length, r = s < 3 ? e : i === null ? i = Object.getOwnPropertyDescriptor(e, t) : i, o;
  if (typeof Reflect == "object" && typeof Reflect.decorate == "function") r = Reflect.decorate(a, e, t, i);
  else for (var n = a.length - 1; n >= 0; n--) (o = a[n]) && (r = (s < 3 ? o(r) : s > 3 ? o(e, t, r) : o(e, t)) || r);
  return s > 3 && r && Object.defineProperty(e, t, r), r;
}, Y;
let M = (Y = class extends x {
  constructor() {
    super(...arguments), this.locale = "vi", this.lightsOnCount = 0, this.userName = "T", this.currentTime = "", this.currentDate = "", this.timer = null;
  }
  connectedCallback() {
    super.connectedCallback(), this.updateClock(), this.timer = window.setInterval(() => this.updateClock(), 1e3);
  }
  disconnectedCallback() {
    super.disconnectedCallback(), this.timer && window.clearInterval(this.timer);
  }
  updateClock() {
    const e = /* @__PURE__ */ new Date(), t = e.getHours().toString().padStart(2, "0"), i = e.getMinutes().toString().padStart(2, "0");
    this.currentTime = `${t}:${i}`;
    const s = {
      weekday: "long",
      day: "numeric",
      month: "long"
    };
    this.currentDate = e.toLocaleDateString(this.locale === "vi" ? "vi-VN" : "en-US", s);
  }
  render() {
    var s, r, o;
    const e = ((r = (s = this.weatherEntity) == null ? void 0 : s.attributes) == null ? void 0 : r.temperature) ?? 27, t = ((o = this.weatherEntity) == null ? void 0 : o.state) ?? "Rainy", i = this.lightsOnCount > 0 ? `${this.lightsOnCount} ${l("lights_on_at_home", this.locale)}` : l("all_lights_off", this.locale);
    return c`
      <header class="header-container">
        <!-- Left: Clock, Status, Scenes -->
        <div class="left-section">
          <div class="date-row">${this.currentDate}</div>
          <div class="time-row">
            <div class="clock-display">${this.currentTime}</div>
            <div class="clock-status-dot">●</div>
          </div>

          <div class="status-section">
            <span class="status-label">${l("home_status", this.locale)}</span>
            <span class="status-value">${i}</span>
          </div>

          <div class="scenes-section">
            <span class="scenes-label">${l("scenes_title", this.locale)} 4</span>
            <div class="scenes-pills">
              <button class="scene-pill" @click="${() => this.triggerScene("away")}">
                ${p("tree", 14)}
                <span>${l("scene_away", this.locale)}</span>
              </button>
              <button class="scene-pill" @click="${() => this.triggerScene("home")}">
                ${p("home-outline", 14)}
                <span>${l("scene_home", this.locale)}</span>
              </button>
              <button class="scene-pill" @click="${() => this.triggerScene("sleep")}">
                ${p("bed", 14)}
                <span>${l("scene_sleep", this.locale)}</span>
              </button>
              <button class="scene-pill" @click="${() => this.triggerScene("movie")}">
                ${p("television-ambient-light", 14)}
                <span>${l("scene_movie", this.locale)}</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Right: Avatar, Weather, Settings & Master Toggles -->
        <div class="right-section">
          <div class="top-controls-row">
            <div class="avatar-btn" title="User Profile">${this.userName.charAt(0).toUpperCase()}</div>

            <div class="weather-pill">
              ${p("weather-sunny", 18)}
              <span class="weather-temp">${e}°</span>
              <span class="weather-desc">${t}</span>
            </div>

            <button
              class="icon-circle-btn"
              title="${l("visual_editor", this.locale)}"
              @click="${this.openSettings}"
            >
              ${p("cog", 18)}
            </button>
          </div>

          <div class="master-actions-row">
            <button class="master-btn" @click="${() => this.toggleAllLights(!0)}">
              ${p("lightbulb-on", 15)}
              <span>${l("turn_all_on", this.locale)}</span>
            </button>
            <button class="master-btn" @click="${() => this.toggleAllLights(!1)}">
              ${p("power", 15)}
              <span>${l("turn_all_off", this.locale)}</span>
            </button>
          </div>
        </div>
      </header>
    `;
  }
  triggerScene(e) {
    this.dispatchEvent(new CustomEvent("trigger-quick-scene", {
      bubbles: !0,
      composed: !0,
      detail: { sceneId: e }
    }));
  }
  toggleAllLights(e) {
    this.dispatchEvent(new CustomEvent("master-toggle-all-lights", {
      bubbles: !0,
      composed: !0,
      detail: { turnOn: e }
    }));
  }
  openSettings() {
    this.dispatchEvent(new CustomEvent("toggle-edit-mode", {
      bubbles: !0,
      composed: !0
    }));
  }
}, Y.styles = _`
    :host {
      display: block;
      width: 100%;
      padding: 24px 32px 16px;
      box-sizing: border-box;
      user-select: none;
    }

    .header-container {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 24px;
      flex-wrap: wrap;
    }

    /* Left Column: Clock, Status, Scenes */
    .left-section {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .date-row {
      font-size: 11px;
      font-weight: 700;
      color: var(--hs-text-muted, rgba(255, 255, 255, 0.45));
      letter-spacing: 1px;
      text-transform: uppercase;
      font-family: var(--hs-font-display, sans-serif);
    }

    .time-row {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .clock-display {
      font-size: clamp(38px, 4.5vw, 54px);
      font-weight: 800;
      color: #ffffff;
      line-height: 1;
      font-family: var(--hs-font-display, sans-serif);
      letter-spacing: -1.5px;
    }

    .clock-status-dot {
      width: 22px;
      height: 22px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.14);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      color: var(--hs-accent, #38bdf8);
    }

    /* Home Status */
    .status-section {
      margin-top: 4px;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .status-label {
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 0.8px;
      color: var(--hs-text-muted, rgba(255, 255, 255, 0.45));
      text-transform: uppercase;
    }

    .status-value {
      font-size: 17px;
      font-weight: 600;
      color: var(--hs-text-primary, #ffffff);
      font-family: var(--hs-font-display, sans-serif);
    }

    /* Scenes Row */
    .scenes-section {
      margin-top: 10px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .scenes-label {
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 0.8px;
      color: var(--hs-text-muted, rgba(255, 255, 255, 0.45));
      text-transform: uppercase;
    }

    .scenes-pills {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }

    .scene-pill {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 14px;
      border-radius: 20px;
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: var(--hs-text-secondary, rgba(255, 255, 255, 0.75));
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      white-space: nowrap;
    }

    .scene-pill:hover {
      background: rgba(255, 255, 255, 0.14);
      color: #ffffff;
      border-color: rgba(255, 255, 255, 0.25);
      transform: translateY(-1px);
    }

    .scene-pill:active {
      transform: scale(0.96);
      background: var(--hs-accent, #38bdf8);
      color: #05040d;
    }

    /* Right Section: Avatar, Weather, Settings & Master Toggles */
    .right-section {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 12px;
    }

    .top-controls-row {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .avatar-btn {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: #e2d9cc;
      color: #1a1a1a;
      font-weight: 700;
      font-size: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
      border: none;
      cursor: pointer;
    }

    .weather-pill {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 14px;
      border-radius: 20px;
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: #ffffff;
      font-size: 13px;
      font-weight: 600;
    }

    .weather-temp {
      font-weight: 700;
    }

    .weather-desc {
      color: var(--hs-text-muted, rgba(255, 255, 255, 0.55));
      text-transform: capitalize;
    }

    .icon-circle-btn {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: var(--hs-text-secondary, rgba(255, 255, 255, 0.75));
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .icon-circle-btn:hover {
      background: rgba(255, 255, 255, 0.15);
      color: #ffffff;
      border-color: rgba(255, 255, 255, 0.25);
    }

    /* Master Action Buttons */
    .master-actions-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .master-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 7px 16px;
      border-radius: 18px;
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: var(--hs-text-secondary, rgba(255, 255, 255, 0.75));
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .master-btn:hover {
      background: rgba(255, 255, 255, 0.14);
      color: #ffffff;
      border-color: rgba(255, 255, 255, 0.25);
    }

    .master-btn:active {
      transform: scale(0.96);
    }

    /* Responsive adjustments */
    @media (max-width: 768px) {
      :host {
        padding: 18px 16px 12px;
      }
      .header-container {
        flex-direction: column;
        align-items: stretch;
        gap: 16px;
      }
      .right-section {
        align-items: flex-start;
      }
    }
  `, Y);
O([
  h({ type: Object })
], M.prototype, "hass", void 0);
O([
  h({ type: String })
], M.prototype, "locale", void 0);
O([
  h({ type: Number })
], M.prototype, "lightsOnCount", void 0);
O([
  h({ type: Object })
], M.prototype, "weatherEntity", void 0);
O([
  h({ type: String })
], M.prototype, "userName", void 0);
O([
  b()
], M.prototype, "currentTime", void 0);
O([
  b()
], M.prototype, "currentDate", void 0);
M = O([
  k("homesmart-hero-header")
], M);
var Te = function(a, e, t, i) {
  var s = arguments.length, r = s < 3 ? e : i === null ? i = Object.getOwnPropertyDescriptor(e, t) : i, o;
  if (typeof Reflect == "object" && typeof Reflect.decorate == "function") r = Reflect.decorate(a, e, t, i);
  else for (var n = a.length - 1; n >= 0; n--) (o = a[n]) && (r = (s < 3 ? o(r) : s > 3 ? o(e, t, r) : o(e, t)) || r);
  return s > 3 && r && Object.defineProperty(e, t, r), r;
}, W;
let we = (W = class extends x {
  constructor() {
    super(...arguments), this.locale = "vi";
  }
  render() {
    const t = this.area.entities.filter((s) => s.state === "on" || s.state === "open" || s.state === "playing").length, i = t > 0;
    return c`
      <div
        class="deck-card ${i ? "has-active" : ""}"
        tabindex="0"
        @click="${this.handleCardClick}"
      >
        <div class="card-top">
          <div
            class="icon-bubble"
            title="Bật/tắt đèn phòng"
            @click="${this.handleIconToggle}"
          >
            ${p(this.area.icon, 18)}
          </div>
          <div class="top-action-dot">›</div>
        </div>

        <div class="card-center"></div>

        <div class="card-bottom">
          <div class="room-name" title="${this.area.name}">${this.area.name}</div>
          <div class="room-status">
            ${t} ${l("active_count", this.locale)}
          </div>
        </div>
      </div>
    `;
  }
  handleCardClick() {
    this.dispatchEvent(new CustomEvent("open-room-detail", {
      bubbles: !0,
      composed: !0,
      detail: { area: this.area }
    }));
  }
  handleIconToggle(e) {
    if (e.stopPropagation(), !this.hass)
      return;
    const t = this.area.entities.filter((r) => r.domain === "light"), s = t.some((r) => r.state === "on") ? "turn_off" : "turn_on";
    for (const r of t)
      this.hass.callService("light", s, { entity_id: r.entity_id });
  }
}, W.styles = _`
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }

    .deck-card {
      width: 100%;
      height: 100%;
      min-height: 280px;
      border-radius: 26px;
      background: var(--hs-glass-bg, rgba(22, 36, 62, 0.38));
      backdrop-filter: blur(28px) saturate(160%);
      -webkit-backdrop-filter: blur(28px) saturate(160%);
      border: 1px solid var(--hs-glass-border, rgba(255, 255, 255, 0.08));
      padding: 18px 16px;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      cursor: pointer;
      position: relative;
      overflow: hidden;
      transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    }

    .deck-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 1px;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
      pointer-events: none;
    }

    .deck-card:hover {
      background: var(--hs-glass-bg-hover, rgba(30, 48, 82, 0.55));
      border-color: var(--hs-glass-border-hover, rgba(255, 255, 255, 0.16));
      transform: translateY(-3px);
      box-shadow: 0 16px 40px rgba(0, 0, 0, 0.45);
    }

    .deck-card.has-active {
      border-color: rgba(120, 180, 255, 0.35);
      box-shadow: 0 0 24px var(--hs-glow-color, rgba(56, 189, 248, 0.2)), 0 12px 36px rgba(0, 0, 0, 0.35);
    }

    .deck-card.has-active::after {
      content: '';
      position: absolute;
      bottom: -40px;
      left: 10%;
      right: 10%;
      height: 80px;
      background: var(--hs-accent, #38bdf8);
      filter: blur(40px);
      opacity: 0.18;
      pointer-events: none;
    }

    /* Top Row */
    .card-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
    }

    .icon-bubble {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.12);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--hs-text-secondary, rgba(255, 255, 255, 0.75));
      transition: all 0.2s ease;
    }

    .has-active .icon-bubble {
      background: var(--hs-active-gradient, linear-gradient(135deg, #38bdf8 0%, #818cf8 100%));
      color: #05040d;
      border-color: transparent;
      box-shadow: 0 0 14px var(--hs-glow-color, rgba(56, 189, 248, 0.4));
    }

    .top-action-dot {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--hs-text-muted, rgba(255, 255, 255, 0.35));
      font-size: 14px;
      transition: all 0.2s ease;
    }

    .deck-card:hover .top-action-dot {
      color: #ffffff;
      transform: translateX(2px);
    }

    /* Center Ambient Area */
    .card-center {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    /* Bottom Information */
    .card-bottom {
      display: flex;
      flex-direction: column;
      gap: 3px;
    }

    .room-name {
      font-size: 15px;
      font-weight: 700;
      color: #ffffff;
      font-family: var(--hs-font-display, sans-serif);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .room-status {
      font-size: 12px;
      font-weight: 500;
      color: var(--hs-text-muted, rgba(255, 255, 255, 0.5));
    }

    .has-active .room-status {
      color: var(--hs-accent, #38bdf8);
      font-weight: 600;
    }
  `, W);
Te([
  h({ type: Object })
], we.prototype, "hass", void 0);
Te([
  h({ type: Object })
], we.prototype, "area", void 0);
Te([
  h({ type: String })
], we.prototype, "locale", void 0);
we = Te([
  k("homesmart-deck-room-card")
], we);
var Pe = function(a, e, t, i) {
  var s = arguments.length, r = s < 3 ? e : i === null ? i = Object.getOwnPropertyDescriptor(e, t) : i, o;
  if (typeof Reflect == "object" && typeof Reflect.decorate == "function") r = Reflect.decorate(a, e, t, i);
  else for (var n = a.length - 1; n >= 0; n--) (o = a[n]) && (r = (s < 3 ? o(r) : s > 3 ? o(e, t, r) : o(e, t)) || r);
  return s > 3 && r && Object.defineProperty(e, t, r), r;
}, X;
let _e = (X = class extends x {
  constructor() {
    super(...arguments), this.areas = [], this.locale = "vi";
  }
  render() {
    let e = 0, t = 0;
    for (const r of this.areas)
      for (const o of r.entities)
        (o.domain === "lock" || o.domain === "camera" || o.domain === "binary_sensor" || o.domain === "cover" && o.entity_id.includes("gara")) && (e++, o.domain === "lock" && o.state !== "locked" && t++);
    const i = t > 0, s = i ? `${t} khóa chưa đóng` : l("everything_secure", this.locale);
    return c`
      <div
        class="security-card ${i ? "alert" : ""}"
        tabindex="0"
        @click="${this.handleClick}"
      >
        <div class="card-top">
          <div class="icon-bubble">
            ${p("shield-check", 18)}
          </div>
          <span class="category-label">${l("security_title", this.locale)}</span>
        </div>

        <div class="card-center"></div>

        <div class="card-bottom">
          <div class="status-headline">${s}</div>
          <div class="status-subtext">${e} ${l("monitored_items", this.locale)}</div>
        </div>
      </div>
    `;
  }
  handleClick() {
    this.dispatchEvent(new CustomEvent("switch-dock-tab", {
      bubbles: !0,
      composed: !0,
      detail: { tab: "security" }
    }));
  }
}, X.styles = _`
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }

    .security-card {
      width: 100%;
      height: 100%;
      min-height: 280px;
      border-radius: 26px;
      background: var(--hs-glass-bg, rgba(22, 36, 62, 0.38));
      backdrop-filter: blur(28px) saturate(160%);
      -webkit-backdrop-filter: blur(28px) saturate(160%);
      border: 1px solid var(--hs-glass-border, rgba(255, 255, 255, 0.08));
      padding: 18px 16px;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      cursor: pointer;
      position: relative;
      overflow: hidden;
      transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    }

    .security-card:hover {
      background: var(--hs-glass-bg-hover, rgba(30, 48, 82, 0.55));
      border-color: var(--hs-glass-border-hover, rgba(255, 255, 255, 0.16));
      transform: translateY(-3px);
      box-shadow: 0 16px 40px rgba(0, 0, 0, 0.45);
    }

    .security-card.alert {
      border-color: rgba(255, 75, 114, 0.4);
      box-shadow: 0 0 24px rgba(255, 75, 114, 0.3);
    }

    .card-top {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .icon-bubble {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.12);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--hs-accent, #38bdf8);
    }

    .alert .icon-bubble {
      background: #ff4b72;
      color: #fff;
    }

    .category-label {
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 1px;
      color: var(--hs-text-muted, rgba(255, 255, 255, 0.5));
      text-transform: uppercase;
    }

    .card-center {
      flex: 1;
    }

    .card-bottom {
      display: flex;
      flex-direction: column;
      gap: 3px;
    }

    .status-headline {
      font-size: 15px;
      font-weight: 700;
      color: #ffffff;
      font-family: var(--hs-font-display, sans-serif);
      line-height: 1.25;
    }

    .status-subtext {
      font-size: 12px;
      color: var(--hs-text-muted, rgba(255, 255, 255, 0.5));
    }
  `, X);
Pe([
  h({ type: Object })
], _e.prototype, "hass", void 0);
Pe([
  h({ type: Array })
], _e.prototype, "areas", void 0);
Pe([
  h({ type: String })
], _e.prototype, "locale", void 0);
_e = Pe([
  k("homesmart-deck-security-card")
], _e);
var ze = function(a, e, t, i) {
  var s = arguments.length, r = s < 3 ? e : i === null ? i = Object.getOwnPropertyDescriptor(e, t) : i, o;
  if (typeof Reflect == "object" && typeof Reflect.decorate == "function") r = Reflect.decorate(a, e, t, i);
  else for (var n = a.length - 1; n >= 0; n--) (o = a[n]) && (r = (s < 3 ? o(r) : s > 3 ? o(e, t, r) : o(e, t)) || r);
  return s > 3 && r && Object.defineProperty(e, t, r), r;
}, K;
let $e = (K = class extends x {
  constructor() {
    super(...arguments), this.locale = "vi";
  }
  render() {
    const e = this.computeIsActive(), t = e ? "Đang bật" : "Đã tắt";
    return c`
      <div
        class="device-card ${e ? "active" : ""}"
        tabindex="0"
        @click="${this.handleCardClick}"
      >
        <div class="card-top"></div>

        <div class="center-power-container">
          <button
            class="power-circle-btn"
            @click="${this.togglePower}"
            title="Bật/Tắt thiết bị"
          >
            ${p("power", 26)}
          </button>
        </div>

        <div class="card-bottom">
          <div class="device-name" title="${this.entity.name}">${this.entity.name}</div>
          <div class="device-state">${t}</div>
        </div>
      </div>
    `;
  }
  computeIsActive() {
    const e = this.entity.state.toLowerCase();
    return e === "on" || e === "playing";
  }
  togglePower(e) {
    if (e.stopPropagation(), !this.hass)
      return;
    const t = this.entity.domain;
    this.hass.callService(t, "toggle", { entity_id: this.entity.entity_id });
  }
  handleCardClick() {
    this.entity.domain === "media_player" && this.dispatchEvent(new CustomEvent("switch-dock-tab", {
      bubbles: !0,
      composed: !0,
      detail: { tab: "media" }
    }));
  }
}, K.styles = _`
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }

    .device-card {
      width: 100%;
      height: 100%;
      min-height: 280px;
      border-radius: 26px;
      background: var(--hs-glass-bg, rgba(22, 36, 62, 0.38));
      backdrop-filter: blur(28px) saturate(160%);
      -webkit-backdrop-filter: blur(28px) saturate(160%);
      border: 1px solid var(--hs-glass-border, rgba(255, 255, 255, 0.08));
      padding: 18px 16px;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      align-items: center;
      cursor: pointer;
      position: relative;
      overflow: hidden;
      transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    }

    .device-card:hover {
      background: var(--hs-glass-bg-hover, rgba(30, 48, 82, 0.55));
      border-color: var(--hs-glass-border-hover, rgba(255, 255, 255, 0.16));
      transform: translateY(-3px);
      box-shadow: 0 16px 40px rgba(0, 0, 0, 0.45);
    }

    .device-card.active {
      border-color: rgba(120, 180, 255, 0.35);
      box-shadow: 0 0 24px var(--hs-glow-color, rgba(56, 189, 248, 0.2)), 0 12px 36px rgba(0, 0, 0, 0.35);
    }

    /* Top empty placeholder to balance center */
    .card-top {
      width: 100%;
      height: 24px;
    }

    /* Centered Circular Power Button */
    .center-power-container {
      display: flex;
      align-items: center;
      justify-content: center;
      flex: 1;
    }

    .power-circle-btn {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.15);
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
      outline: none;
    }

    .active .power-circle-btn {
      background: #ffffff;
      color: #05040d;
      border-color: transparent;
      box-shadow: 0 0 20px rgba(255, 255, 255, 0.45);
      transform: scale(1.05);
    }

    .power-circle-btn:hover {
      transform: scale(1.1);
    }

    .power-circle-btn:active {
      transform: scale(0.95);
    }

    /* Bottom Information */
    .card-bottom {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 3px;
      width: 100%;
    }

    .device-name {
      font-size: 14px;
      font-weight: 700;
      color: #ffffff;
      font-family: var(--hs-font-display, sans-serif);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 100%;
    }

    .device-state {
      font-size: 12px;
      color: var(--hs-text-muted, rgba(255, 255, 255, 0.5));
    }

    .active .device-state {
      color: var(--hs-accent, #38bdf8);
      font-weight: 600;
    }
  `, K);
ze([
  h({ type: Object })
], $e.prototype, "hass", void 0);
ze([
  h({ type: Object })
], $e.prototype, "entity", void 0);
ze([
  h({ type: String })
], $e.prototype, "locale", void 0);
$e = ze([
  k("homesmart-deck-device-card")
], $e);
var Oe = function(a, e, t, i) {
  var s = arguments.length, r = s < 3 ? e : i === null ? i = Object.getOwnPropertyDescriptor(e, t) : i, o;
  if (typeof Reflect == "object" && typeof Reflect.decorate == "function") r = Reflect.decorate(a, e, t, i);
  else for (var n = a.length - 1; n >= 0; n--) (o = a[n]) && (r = (s < 3 ? o(r) : s > 3 ? o(e, t, r) : o(e, t)) || r);
  return s > 3 && r && Object.defineProperty(e, t, r), r;
}, J;
let ke = (J = class extends x {
  constructor() {
    super(...arguments), this.activeTab = "home", this.editMode = !1, this.locale = "vi";
  }
  render() {
    return c`
      <div class="dock-container">
        <!-- Center Floating Capsule -->
        <nav class="capsule-dock">
          <button
            class="dock-tab ${this.activeTab === "home" ? "active" : ""}"
            @click="${() => this.selectTab("home")}"
          >
            ${p("home-outline", 16)}
            <span>${l("tab_home", this.locale)}</span>
          </button>

          <button
            class="dock-tab ${this.activeTab === "rooms" ? "active" : ""}"
            @click="${() => this.selectTab("rooms")}"
          >
            ${p("devices", 16)}
            <span>${l("tab_rooms", this.locale)}</span>
          </button>

          <button
            class="dock-tab ${this.activeTab === "media" ? "active" : ""}"
            @click="${() => this.selectTab("media")}"
          >
            ${p("television-ambient-light", 16)}
            <span>${l("tab_media", this.locale)}</span>
          </button>

          <button
            class="dock-tab ${this.activeTab === "security" ? "active" : ""}"
            @click="${() => this.selectTab("security")}"
          >
            ${p("shield-check", 16)}
            <span>${l("tab_security", this.locale)}</span>
          </button>
        </nav>

        <!-- Bottom-Right Floating Edit Button -->
        <button
          class="edit-fab ${this.editMode ? "active" : ""}"
          title="${l("visual_editor", this.locale)}"
          @click="${this.toggleEdit}"
        >
          ${p("cog", 18)}
        </button>
      </div>
    `;
  }
  selectTab(e) {
    this.dispatchEvent(new CustomEvent("switch-dock-tab", {
      bubbles: !0,
      composed: !0,
      detail: { tab: e }
    }));
  }
  toggleEdit() {
    this.dispatchEvent(new CustomEvent("toggle-edit-mode", {
      bubbles: !0,
      composed: !0
    }));
  }
}, J.styles = _`
    :host {
      display: block;
      position: fixed;
      bottom: 24px;
      left: 0;
      right: 0;
      pointer-events: none;
      z-index: 900;
    }

    .dock-container {
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      width: 100%;
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 24px;
      box-sizing: border-box;
    }

    /* Floating Center Capsule Bar */
    .capsule-dock {
      pointer-events: auto;
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 5px 6px;
      border-radius: 30px;
      background: var(--hs-sidebar-bg, rgba(14, 24, 44, 0.78));
      backdrop-filter: blur(28px) saturate(180%);
      -webkit-backdrop-filter: blur(28px) saturate(180%);
      border: 1px solid var(--hs-glass-border, rgba(255, 255, 255, 0.12));
      box-shadow: 0 12px 36px rgba(0, 0, 0, 0.5), 0 0 20px rgba(0, 0, 0, 0.2);
    }

    .dock-tab {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 18px;
      border-radius: 24px;
      border: none;
      background: transparent;
      color: var(--hs-text-muted, rgba(255, 255, 255, 0.6));
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      white-space: nowrap;
      outline: none;
      user-select: none;
    }

    .dock-tab:hover {
      color: #ffffff;
      background: rgba(255, 255, 255, 0.08);
    }

    .dock-tab.active {
      background: #ffffff;
      color: #070e1c;
      font-weight: 700;
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.25);
    }

    /* Floating Edit Action Button (Bottom-Right) */
    .edit-fab {
      pointer-events: auto;
      position: absolute;
      right: 28px;
      bottom: 0;
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: var(--hs-sidebar-bg, rgba(14, 24, 44, 0.8));
      backdrop-filter: blur(24px);
      -webkit-backdrop-filter: blur(24px);
      border: 1px solid var(--hs-glass-border, rgba(255, 255, 255, 0.15));
      color: var(--hs-text-secondary, rgba(255, 255, 255, 0.75));
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
      transition: all 0.2s ease;
      outline: none;
    }

    .edit-fab:hover,
    .edit-fab.active {
      background: var(--hs-accent, #38bdf8);
      color: #070e1c;
      transform: scale(1.08);
      border-color: transparent;
      box-shadow: 0 0 20px var(--hs-glow-color, rgba(56, 189, 248, 0.4));
    }

    @media (max-width: 600px) {
      .dock-tab {
        padding: 7px 12px;
        font-size: 11px;
        gap: 5px;
      }
      .edit-fab {
        right: 14px;
        width: 38px;
        height: 38px;
      }
    }
  `, J);
Oe([
  h({ type: String })
], ke.prototype, "activeTab", void 0);
Oe([
  h({ type: Boolean })
], ke.prototype, "editMode", void 0);
Oe([
  h({ type: String })
], ke.prototype, "locale", void 0);
ke = Oe([
  k("homesmart-floating-dock")
], ke);
var Ce = function(a, e, t, i) {
  var s = arguments.length, r = s < 3 ? e : i === null ? i = Object.getOwnPropertyDescriptor(e, t) : i, o;
  if (typeof Reflect == "object" && typeof Reflect.decorate == "function") r = Reflect.decorate(a, e, t, i);
  else for (var n = a.length - 1; n >= 0; n--) (o = a[n]) && (r = (s < 3 ? o(r) : s > 3 ? o(e, t, r) : o(e, t)) || r);
  return s > 3 && r && Object.defineProperty(e, t, r), r;
}, Q;
let de = (Q = class extends x {
  constructor() {
    super(...arguments), this.area = null, this.open = !1, this.locale = "vi";
  }
  render() {
    return this.area ? c`
      <div
        class="modal-overlay ${this.open ? "open" : ""}"
        @click="${this.handleBackdropClick}"
      >
        <div class="sheet-container" @click="${(e) => e.stopPropagation()}">
          <div class="sheet-header">
            <div class="header-left">
              <div class="room-icon-bubble">
                ${p(this.area.icon, 22)}
              </div>
              <div class="room-title-col">
                <h2 class="room-title">${this.area.name}</h2>
                <span class="room-sub">${this.area.entities.length} ${l("devices_active", this.locale)}</span>
              </div>
            </div>

            <div class="header-right">
              <button class="quick-toggle-btn" @click="${() => this.toggleRoomLights(!0)}">
                ${l("turn_all_on", this.locale)}
              </button>
              <button class="quick-toggle-btn" @click="${() => this.toggleRoomLights(!1)}">
                ${l("turn_all_off", this.locale)}
              </button>
              <button class="close-btn" @click="${this.closeSheet}">
                ${p("close", 18)}
              </button>
            </div>
          </div>

          <div class="devices-scroll-area">
            <div class="devices-grid">
              ${this.area.entities.map((e) => c`
                  <div>
                    ${e.size === "2x1" ? c`
                          <homesmart-card-2x1-slider
                            .hass="${this.hass}"
                            .entity="${e}"
                            .locale="${this.locale}"
                          ></homesmart-card-2x1-slider>
                        ` : e.domain === "climate" || e.domain === "water_heater" ? c`
                          <homesmart-card-2x2-climate
                            .hass="${this.hass}"
                            .entity="${e}"
                            .locale="${this.locale}"
                          ></homesmart-card-2x2-climate>
                        ` : e.domain === "media_player" || e.domain === "camera" ? c`
                          <homesmart-card-2x2-media-cam
                            .hass="${this.hass}"
                            .entity="${e}"
                            .locale="${this.locale}"
                          ></homesmart-card-2x2-media-cam>
                        ` : c`
                          <homesmart-card-1x1
                            .hass="${this.hass}"
                            .entity="${e}"
                            .locale="${this.locale}"
                          ></homesmart-card-1x1>
                        `}
                  </div>
                `)}
            </div>
          </div>
        </div>
      </div>
    ` : c``;
  }
  handleBackdropClick() {
    this.closeSheet();
  }
  closeSheet() {
    this.dispatchEvent(new CustomEvent("close-room-detail", { bubbles: !0, composed: !0 }));
  }
  toggleRoomLights(e) {
    if (!this.hass || !this.area)
      return;
    const t = this.area.entities.filter((s) => s.domain === "light"), i = e ? "turn_on" : "turn_off";
    for (const s of t)
      this.hass.callService("light", i, { entity_id: s.entity_id });
  }
}, Q.styles = _`
    :host {
      display: block;
    }

    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(4, 8, 15, 0.75);
      backdrop-filter: blur(24px) saturate(160%);
      -webkit-backdrop-filter: blur(24px) saturate(160%);
      z-index: 1000;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      display: flex;
      align-items: flex-end;
      justify-content: center;
    }

    .modal-overlay.open {
      opacity: 1;
      pointer-events: auto;
    }

    .sheet-container {
      width: 100%;
      max-width: 960px;
      max-height: 85vh;
      background: var(--hs-sidebar-bg, rgba(14, 24, 44, 0.92));
      backdrop-filter: blur(36px);
      -webkit-backdrop-filter: blur(36px);
      border: 1px solid var(--hs-glass-border, rgba(255, 255, 255, 0.12));
      border-bottom: none;
      border-radius: 32px 32px 0 0;
      box-shadow: 0 -10px 40px rgba(0, 0, 0, 0.6);
      display: flex;
      flex-direction: column;
      transform: translateY(100%);
      transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
      padding: 24px 32px 40px;
      box-sizing: border-box;
      overflow: hidden;
    }

    .modal-overlay.open .sheet-container {
      transform: translateY(0);
    }

    /* Header Bar */
    .sheet-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-bottom: 20px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      margin-bottom: 24px;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .room-icon-bubble {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: var(--hs-active-gradient, linear-gradient(135deg, #38bdf8 0%, #818cf8 100%));
      color: #05040d;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 0 16px var(--hs-glow-color, rgba(56, 189, 248, 0.4));
    }

    .room-title-col {
      display: flex;
      flex-direction: column;
    }

    .room-title {
      font-size: 22px;
      font-weight: 800;
      color: #ffffff;
      font-family: var(--hs-font-display, sans-serif);
      margin: 0;
    }

    .room-sub {
      font-size: 13px;
      color: var(--hs-text-muted, rgba(255, 255, 255, 0.5));
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .quick-toggle-btn {
      padding: 8px 16px;
      border-radius: 18px;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.14);
      color: #ffffff;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .quick-toggle-btn:hover {
      background: rgba(255, 255, 255, 0.16);
    }

    .close-btn {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.14);
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .close-btn:hover {
      background: rgba(255, 255, 255, 0.2);
    }

    /* Devices Grid */
    .devices-scroll-area {
      flex: 1;
      overflow-y: auto;
      padding-right: 6px;
    }

    .devices-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 16px;
    }

    @media (max-width: 600px) {
      .sheet-container {
        padding: 20px 16px 32px;
      }
      .devices-grid {
        grid-template-columns: 1fr;
      }
    }
  `, Q);
Ce([
  h({ type: Object })
], de.prototype, "hass", void 0);
Ce([
  h({ type: Object })
], de.prototype, "area", void 0);
Ce([
  h({ type: Boolean })
], de.prototype, "open", void 0);
Ce([
  h({ type: String })
], de.prototype, "locale", void 0);
de = Ce([
  k("homesmart-room-detail-sheet")
], de);
var D = function(a, e, t, i) {
  var s = arguments.length, r = s < 3 ? e : i === null ? i = Object.getOwnPropertyDescriptor(e, t) : i, o;
  if (typeof Reflect == "object" && typeof Reflect.decorate == "function") r = Reflect.decorate(a, e, t, i);
  else for (var n = a.length - 1; n >= 0; n--) (o = a[n]) && (r = (s < 3 ? o(r) : s > 3 ? o(e, t, r) : o(e, t)) || r);
  return s > 3 && r && Object.defineProperty(e, t, r), r;
}, ee;
let H = (ee = class extends x {
  constructor() {
    super(...arguments), this.areas = [], this.selectedAreaId = "", this.device = "desktop", this.locale = "vi", this.lightsOn = 0, this.totalActive = 0, this.editMode = !1;
  }
  render() {
    return this.device === "phone" ? this.renderMobileBar() : this.renderDesktopSidebar();
  }
  renderDesktopSidebar() {
    return c`
      <div class="sidebar-wrapper">
        <div>
          <div class="brand-header">
            <div class="brand-logo">
              ${p("shield-home", 22)}
            </div>
            <span class="brand-title">${l("app_title", this.locale)}</span>
            <span class="brand-version">PRO</span>
          </div>

          <div class="nav-list">
            <!-- All Areas tab -->
            <button
              class="nav-item ${this.selectedAreaId === "" ? "active" : ""}"
              @click="${() => this.selectArea("")}"
            >
              <div class="nav-item-left">
                ${p("home-outline", 20)}
                <span class="nav-label">${l("all_areas", this.locale)}</span>
              </div>
            </button>

            <!-- Specific Areas -->
            ${this.areas.map((e) => c`
                <button
                  class="nav-item ${this.selectedAreaId === e.id ? "active" : ""}"
                  @click="${() => this.selectArea(e.id)}"
                >
                  <div class="nav-item-left">
                    ${p(e.icon, 20)}
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
              <span class="stat-lbl">${l("lights_active", this.locale)}</span>
            </div>
            <div class="stat-chip">
              <span class="stat-val">${this.totalActive}</span>
              <span class="stat-lbl">${l("devices_active", this.locale)}</span>
            </div>
          </div>

          <button
            class="edit-toggle-btn ${this.editMode ? "editing" : ""}"
            @click="${this.toggleEdit}"
          >
            ${p("cog", 18)}
            <span>${this.editMode ? l("exit_edit", this.locale) : l("visual_editor", this.locale)}</span>
          </button>
        </div>
      </div>
    `;
  }
  renderMobileBar() {
    return c`
      <div class="mobile-bar">
        <button
          class="mobile-tab ${this.selectedAreaId === "" ? "active" : ""}"
          @click="${() => this.selectArea("")}"
        >
          ${p("home-outline", 18)}
          <span class="mobile-tab-label">${l("all_areas", this.locale)}</span>
        </button>

        ${this.areas.map((e) => c`
            <button
              class="mobile-tab ${this.selectedAreaId === e.id ? "active" : ""}"
              @click="${() => this.selectArea(e.id)}"
            >
              ${p(e.icon, 18)}
              <span class="mobile-tab-label">${e.name}</span>
            </button>
          `)}

        <button class="mobile-gear" @click="${this.toggleEdit}">
          ${p("cog", 18)}
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
}, ee.styles = _`
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
  `, ee);
D([
  h({ type: Array })
], H.prototype, "areas", void 0);
D([
  h({ type: String })
], H.prototype, "selectedAreaId", void 0);
D([
  h({ type: String })
], H.prototype, "device", void 0);
D([
  h({ type: String })
], H.prototype, "locale", void 0);
D([
  h({ type: Number })
], H.prototype, "lightsOn", void 0);
D([
  h({ type: Number })
], H.prototype, "totalActive", void 0);
D([
  h({ type: Boolean })
], H.prototype, "editMode", void 0);
H = D([
  k("homesmart-sidebar-nav")
], H);
var Me = function(a, e, t, i) {
  var s = arguments.length, r = s < 3 ? e : i === null ? i = Object.getOwnPropertyDescriptor(e, t) : i, o;
  if (typeof Reflect == "object" && typeof Reflect.decorate == "function") r = Reflect.decorate(a, e, t, i);
  else for (var n = a.length - 1; n >= 0; n--) (o = a[n]) && (r = (s < 3 ? o(r) : s > 3 ? o(e, t, r) : o(e, t)) || r);
  return s > 3 && r && Object.defineProperty(e, t, r), r;
}, te;
let he = (te = class extends x {
  constructor() {
    super(...arguments), this.editMode = !1, this.locale = "vi";
  }
  render() {
    const e = this.computeIsActive(), t = this.computeStateLabel();
    return c`
      <div
        class="glass-card card-inner ${e ? "active" : ""}"
        tabindex="0"
        @click="${this.handleClick}"
      >
        <div class="top-row">
          <div class="icon-container">
            ${p(this.entity.icon, 24)}
          </div>
          ${this.entity.protection.type !== "none" ? c`
                <div class="protection-badge">
                  ${p("shield-check", 14)}
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
    const e = this.entity.state, t = `state_${e.toLowerCase()}`, i = l(t, this.locale);
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
    return c`
      <div class="edit-controls" @click="${(e) => e.stopPropagation()}">
        <button
          class="edit-btn"
          title="${l("card_size", this.locale)}"
          @click="${() => this.changeSize("2x1")}"
        >
          2x1
        </button>
        <button
          class="edit-btn"
          title="${l("card_size", this.locale)}"
          @click="${() => this.changeSize("2x2")}"
        >
          2x2
        </button>
        <button
          class="edit-btn"
          title="${l("card_protection", this.locale)}"
          @click="${this.cycleProtection}"
        >
          🛡️
        </button>
        <button
          class="edit-btn"
          title="${l("hide_card", this.locale)}"
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
}, te.styles = _`
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
  `, te);
Me([
  h({ type: Object })
], he.prototype, "hass", void 0);
Me([
  h({ type: Object })
], he.prototype, "entity", void 0);
Me([
  h({ type: Boolean })
], he.prototype, "editMode", void 0);
Me([
  h({ type: String })
], he.prototype, "locale", void 0);
he = Me([
  k("homesmart-card-1x1")
], he);
var Z = function(a, e, t, i) {
  var s = arguments.length, r = s < 3 ? e : i === null ? i = Object.getOwnPropertyDescriptor(e, t) : i, o;
  if (typeof Reflect == "object" && typeof Reflect.decorate == "function") r = Reflect.decorate(a, e, t, i);
  else for (var n = a.length - 1; n >= 0; n--) (o = a[n]) && (r = (s < 3 ? o(r) : s > 3 ? o(e, t, r) : o(e, t)) || r);
  return s > 3 && r && Object.defineProperty(e, t, r), r;
}, ie;
let P = (ie = class extends x {
  constructor() {
    super(...arguments), this.editMode = !1, this.locale = "vi", this.dragging = !1, this.localValue = null, this.debounceTimer = null;
  }
  render() {
    const e = this.computeIsActive(), t = this.getCurrentPercent(), i = this.entity.domain === "cover";
    return c`
      <div class="glass-card card-inner ${e ? "active" : ""}" tabindex="0">
        <div class="header-row">
          <div class="left-meta">
            <div class="icon-container" @click="${this.handleIconClick}">
              ${p(this.entity.icon, 24)}
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

          ${i ? c`
                <div class="cover-buttons">
                  <button class="cover-btn" @click="${() => this.triggerCover("open_cover")}">
                    ${p("arrow-up", 16)}
                    <span>${l("open_btn", this.locale)}</span>
                  </button>
                  <button class="cover-btn" @click="${() => this.triggerCover("stop_cover")}">
                    ${p("pause", 16)}
                    <span>${l("stop_btn", this.locale)}</span>
                  </button>
                  <button class="cover-btn" @click="${() => this.triggerCover("close_cover")}">
                    ${p("arrow-down", 16)}
                    <span>${l("close_btn", this.locale)}</span>
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
    return this.entity.domain === "light" ? l("brightness", this.locale) : this.entity.domain === "cover" ? l("cover_position", this.locale) : this.entity.domain === "fan" ? l("fan_speed", this.locale) : "";
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
    const i = t.getBoundingClientRect(), s = Math.max(0, Math.min(e.clientX - i.left, i.width)), r = Math.round(s / i.width * 100);
    this.localValue = r;
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
    return c`
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
}, ie.styles = _`
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
  `, ie);
Z([
  h({ type: Object })
], P.prototype, "hass", void 0);
Z([
  h({ type: Object })
], P.prototype, "entity", void 0);
Z([
  h({ type: Boolean })
], P.prototype, "editMode", void 0);
Z([
  h({ type: String })
], P.prototype, "locale", void 0);
Z([
  b()
], P.prototype, "dragging", void 0);
Z([
  b()
], P.prototype, "localValue", void 0);
P = Z([
  k("homesmart-card-2x1-slider")
], P);
var pe = function(a, e, t, i) {
  var s = arguments.length, r = s < 3 ? e : i === null ? i = Object.getOwnPropertyDescriptor(e, t) : i, o;
  if (typeof Reflect == "object" && typeof Reflect.decorate == "function") r = Reflect.decorate(a, e, t, i);
  else for (var n = a.length - 1; n >= 0; n--) (o = a[n]) && (r = (s < 3 ? o(r) : s > 3 ? o(e, t, r) : o(e, t)) || r);
  return s > 3 && r && Object.defineProperty(e, t, r), r;
}, se;
let U = (se = class extends x {
  constructor() {
    super(...arguments), this.editMode = !1, this.locale = "vi", this.localTargetTemp = null, this.debounceTimer = null;
  }
  render() {
    const e = this.entity.state !== "off", t = this.entity.attributes.current_temperature ?? 24, i = this.getTargetTemp(), s = this.entity.attributes.min_temp ?? 16, r = this.entity.attributes.max_temp ?? 30, o = this.entity.attributes.hvac_modes ?? ["off", "cool", "heat", "auto"], d = Math.PI * 65, f = Math.max(0, Math.min((i - s) / (r - s), 1)), g = d * (1 - f);
    return c`
      <div class="glass-card card-inner ${e ? "active" : ""}" tabindex="0">
        <div class="header-row">
          <div class="device-title">
            <div class="icon-container" @click="${this.togglePower}">
              ${p(this.entity.icon, 22)}
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
              stroke-dasharray="${d}"
              stroke-dashoffset="0"
            />
            <!-- Progress Arc -->
            <path
              class="arc-progress"
              d="M 15 80 A 65 65 0 0 1 145 80"
              stroke-dasharray="${d}"
              stroke-dashoffset="${g}"
            />
          </svg>

          <div class="temp-readout">
            <div class="current-temp-val">
              ${t}<span class="temp-unit">°C</span>
            </div>
            <span class="current-label">${l("current_temp", this.locale)}</span>
          </div>
        </div>

        <div class="target-controls">
          <button class="round-btn" @click="${() => this.adjustTarget(-0.5)}">
            ${p("minus", 18)}
          </button>
          <div class="target-display">
            <span class="target-val">${i.toFixed(1)}°C</span>
            <span class="target-lbl">${l("target_temp", this.locale)}</span>
          </div>
          <button class="round-btn" @click="${() => this.adjustTarget(0.5)}">
            ${p("plus", 18)}
          </button>
        </div>

        <div class="mode-pills">
          ${o.map((u) => c`
              <button
                class="mode-pill ${this.entity.state === u ? "selected" : ""}"
                @click="${() => this.setMode(u)}"
              >
                ${l(`state_${u}`, this.locale)}
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
    return l(`state_${e}`, this.locale);
  }
  adjustTarget(e) {
    const t = this.getTargetTemp(), i = this.entity.attributes.min_temp ?? 16, s = this.entity.attributes.max_temp ?? 30, r = Math.max(i, Math.min(s, t + e));
    this.localTargetTemp = r, this.debounceTimer && window.clearTimeout(this.debounceTimer), this.debounceTimer = window.setTimeout(() => {
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
    return c`
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
}, se.styles = _`
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
  `, se);
pe([
  h({ type: Object })
], U.prototype, "hass", void 0);
pe([
  h({ type: Object })
], U.prototype, "entity", void 0);
pe([
  h({ type: Boolean })
], U.prototype, "editMode", void 0);
pe([
  h({ type: String })
], U.prototype, "locale", void 0);
pe([
  b()
], U.prototype, "localTargetTemp", void 0);
U = pe([
  k("homesmart-card-2x2-climate")
], U);
var ue = function(a, e, t, i) {
  var s = arguments.length, r = s < 3 ? e : i === null ? i = Object.getOwnPropertyDescriptor(e, t) : i, o;
  if (typeof Reflect == "object" && typeof Reflect.decorate == "function") r = Reflect.decorate(a, e, t, i);
  else for (var n = a.length - 1; n >= 0; n--) (o = a[n]) && (r = (s < 3 ? o(r) : s > 3 ? o(e, t, r) : o(e, t)) || r);
  return s > 3 && r && Object.defineProperty(e, t, r), r;
}, ae;
let F = (ae = class extends x {
  constructor() {
    super(...arguments), this.editMode = !1, this.locale = "vi", this.showFullscreen = !1;
  }
  render() {
    const e = this.entity.domain === "camera";
    return c`
      <div class="glass-card card-inner" tabindex="0">
        ${e ? this.renderCamera() : this.renderMediaPlayer()}
        ${this.editMode ? this.renderEditControls() : ""}
      </div>

      ${this.showFullscreen && e ? this.renderFullscreenModal() : ""}
    `;
  }
  renderCamera() {
    const e = this.entity.attributes.entity_picture, t = e ? `${e}&token=${Date.now()}` : "";
    return c`
      <div class="camera-container">
        ${t ? c`<img class="camera-img" src="${t}" alt="${this.entity.name}" />` : c`
              <div class="camera-placeholder">
                ${p("cctv", 48)}
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
              ${p("fullscreen", 18)}
            </button>
          </div>
        </div>
      </div>
    `;
  }
  renderFullscreenModal() {
    const e = this.entity.attributes.entity_picture;
    return c`
      <div class="fs-modal">
        <button class="fs-close" @click="${() => this.showFullscreen = !1}">
          ${p("close", 24)}
        </button>
        <img class="fs-img" src="${e}" alt="${this.entity.name}" />
      </div>
    `;
  }
  renderMediaPlayer() {
    const e = this.entity.attributes, t = this.entity.state === "playing", i = e.entity_picture || "", s = e.media_title || this.entity.name, r = e.media_artist || l(`state_${this.entity.state}`, this.locale), o = Math.round((e.volume_level ?? 0.5) * 100);
    return c`
      <div class="media-container">
        ${i ? c`<div class="media-backdrop" style="background-image: url('${i}')"></div>` : ""}

        <div class="media-content">
          <div class="media-header">
            <div class="media-device-info">
              ${i ? c`<img class="media-artwork-small" src="${i}" alt="" />` : p("television-ambient-light", 28)}
              <div class="media-titles">
                <span class="track-title" title="${s}">${s}</span>
                <span class="track-artist" title="${r}">${r}</span>
              </div>
            </div>
            <button class="nav-btn" @click="${this.togglePower}">
              ${p("power", 18)}
            </button>
          </div>

          <div class="media-controls-row">
            <button class="nav-btn" @click="${() => this.mediaService("media_previous_track")}">
              ${p("skip-previous", 20)}
            </button>
            <button class="play-btn" @click="${() => this.mediaService("media_play_pause")}">
              ${p(t ? "pause" : "play", 24)}
            </button>
            <button class="nav-btn" @click="${() => this.mediaService("media_next_track")}">
              ${p("skip-next", 20)}
            </button>
          </div>

          <div class="volume-slider-row">
            ${p("volume-high", 18)}
            <input
              type="range"
              class="vol-slider"
              min="0"
              max="100"
              .value="${o.toString()}"
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
    return c`
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
}, ae.styles = _`
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
  `, ae);
ue([
  h({ type: Object })
], F.prototype, "hass", void 0);
ue([
  h({ type: Object })
], F.prototype, "entity", void 0);
ue([
  h({ type: Boolean })
], F.prototype, "editMode", void 0);
ue([
  h({ type: String })
], F.prototype, "locale", void 0);
ue([
  b()
], F.prototype, "showFullscreen", void 0);
F = ue([
  k("homesmart-card-2x2-media-cam")
], F);
var G = function(a, e, t, i) {
  var s = arguments.length, r = s < 3 ? e : i === null ? i = Object.getOwnPropertyDescriptor(e, t) : i, o;
  if (typeof Reflect == "object" && typeof Reflect.decorate == "function") r = Reflect.decorate(a, e, t, i);
  else for (var n = a.length - 1; n >= 0; n--) (o = a[n]) && (r = (s < 3 ? o(r) : s > 3 ? o(e, t, r) : o(e, t)) || r);
  return s > 3 && r && Object.defineProperty(e, t, r), r;
}, re;
let z = (re = class extends x {
  constructor() {
    super(...arguments), this.open = !1, this.showHidden = !1, this.locale = "vi", this.saving = !1, this.saveStatus = "";
  }
  render() {
    if (!this.open)
      return c``;
    const e = [
      { id: "midnight", dotClass: "dot-midnight", name: "Midnight" },
      { id: "aurora", dotClass: "dot-aurora", name: "Aurora" },
      { id: "ocean", dotClass: "dot-ocean", name: "Ocean" },
      { id: "wine", dotClass: "dot-wine", name: "Wine" },
      { id: "graphite", dotClass: "dot-graphite", name: "Graphite" },
      { id: "emerald", dotClass: "dot-emerald", name: "Emerald" },
      { id: "sunset", dotClass: "dot-sunset", name: "Sunset" }
    ], t = [
      { id: "auto", label: "Auto" },
      { id: "deck", label: "HomeDeck" },
      { id: "sidebar", label: "Sidebar" },
      { id: "focus", label: "Focus" },
      { id: "grid", label: "Grid" },
      { id: "tv", label: "TV" }
    ], i = [60, 180, 300, 600];
    return c`
      <div class="editor-drawer">
        <div class="section-group">
          <!-- Theme Picker -->
          <div class="control-item">
            <span class="control-label">${l("theme_select", this.locale)}</span>
            <div class="pills-group">
              ${e.map((s) => c`
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
            <span class="control-label">${l("layout_select", this.locale)}</span>
            <div class="pills-group">
              ${t.map((s) => c`
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
            <span class="control-label">${l("screensaver_timeout", this.locale)}</span>
            <div class="pills-group">
              ${i.map((s) => c`
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
            <span class="control-label">${l("language_select", this.locale)}</span>
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
            ${p(this.showHidden ? "eye-off" : "eye", 18)}
            <span>${this.showHidden ? "Ẩn thẻ đã ẩn" : l("show_all_hidden", this.locale)}</span>
          </button>

          <button class="action-btn btn-save" ?disabled="${this.saving}" @click="${this.saveConfig}">
            ${p("check", 18)}
            <span>${this.saving ? l("saving", this.locale) : l("save_sync", this.locale)}</span>
          </button>

          ${this.saveStatus ? c`<span class="status-msg">${this.saveStatus}</span>` : ""}
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
          this.saving = !1, this.saveStatus = l("saved_success", this.locale), setTimeout(() => {
            this.saveStatus = "";
          }, 3e3);
        },
        onError: () => {
          this.saving = !1, this.saveStatus = l("save_error", this.locale);
        }
      }
    }));
  }
}, re.styles = _`
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

    .dot-midnight { background: #38bdf8; }
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
  `, re);
G([
  h({ type: Object })
], z.prototype, "config", void 0);
G([
  h({ type: Boolean })
], z.prototype, "open", void 0);
G([
  h({ type: Boolean })
], z.prototype, "showHidden", void 0);
G([
  h({ type: String })
], z.prototype, "locale", void 0);
G([
  b()
], z.prototype, "saving", void 0);
G([
  b()
], z.prototype, "saveStatus", void 0);
z = G([
  k("homesmart-visual-editor-bar")
], z);
var E = function(a, e, t, i) {
  var s = arguments.length, r = s < 3 ? e : i === null ? i = Object.getOwnPropertyDescriptor(e, t) : i, o;
  if (typeof Reflect == "object" && typeof Reflect.decorate == "function") r = Reflect.decorate(a, e, t, i);
  else for (var n = a.length - 1; n >= 0; n--) (o = a[n]) && (r = (s < 3 ? o(r) : s > 3 ? o(e, t, r) : o(e, t)) || r);
  return s > 3 && r && Object.defineProperty(e, t, r), r;
}, oe;
let C = (oe = class extends x {
  constructor() {
    super(...arguments), this.open = !1, this.protection = { type: "confirm" }, this.entityName = "", this.entityIcon = "mdi:shield-check", this.locale = "vi", this.enteredPin = "", this.isShaking = !1, this.errorMessage = "";
  }
  render() {
    if (!this.open)
      return c``;
    const e = this.protection.type === "pin";
    return c`
      <div class="modal-overlay ${this.open ? "open" : ""}" @click="${this.handleBackdropClick}">
        <div class="modal-box ${this.isShaking ? "shake" : ""}" @click="${(t) => t.stopPropagation()}">
          <div class="icon-badge">
            ${p(this.entityIcon, 32)}
          </div>

          <h3 class="title">${e ? l("pin_title", this.locale) : l("confirm_title", this.locale)}</h3>
          <p class="subtitle">
            ${e ? l("pin_msg", this.locale) : l("confirm_msg", this.locale)}
            <br />
            <strong>${this.entityName}</strong>
          </p>

          ${e ? c`
                <div class="pin-display">
                  ${[0, 1, 2, 3].map((t) => c`
                      <div class="pin-dot ${t < this.enteredPin.length ? "filled" : ""}"></div>
                    `)}
                </div>

                <div class="keypad">
                  ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((t) => c`
                      <button class="key-btn" @click="${() => this.handleNumberClick(t.toString())}">
                        ${t}
                      </button>
                    `)}
                  <button class="key-btn action" @click="${this.handleClear}">
                    ${l("clear", this.locale)}
                  </button>
                  <button class="key-btn" @click="${() => this.handleNumberClick("0")}">0</button>
                  <button class="key-btn action" @click="${this.handleBackspace}">
                    ${p("arrow-left", 20)}
                  </button>
                </div>

                <div class="error-text">${this.errorMessage}</div>
              ` : ""}

          <div class="actions">
            <button class="btn btn-cancel" @click="${this.handleCancel}">
              ${l("cancel", this.locale)}
            </button>
            ${e ? "" : c`
                  <button class="btn btn-confirm" @click="${this.handleConfirmSuccess}">
                    ${l("confirm", this.locale)}
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
    this.enteredPin === e ? this.handleConfirmSuccess() : (this.isShaking = !0, this.errorMessage = l("incorrect_pin", this.locale), setTimeout(() => {
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
}, oe.styles = _`
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
  `, oe);
E([
  h({ type: Boolean })
], C.prototype, "open", void 0);
E([
  h({ type: Object })
], C.prototype, "protection", void 0);
E([
  h({ type: String })
], C.prototype, "entityName", void 0);
E([
  h({ type: String })
], C.prototype, "entityIcon", void 0);
E([
  h({ type: String })
], C.prototype, "locale", void 0);
E([
  b()
], C.prototype, "enteredPin", void 0);
E([
  b()
], C.prototype, "isShaking", void 0);
E([
  b()
], C.prototype, "errorMessage", void 0);
C = E([
  k("homesmart-confirm-dialog")
], C);
var j = function(a, e, t, i) {
  var s = arguments.length, r = s < 3 ? e : i === null ? i = Object.getOwnPropertyDescriptor(e, t) : i, o;
  if (typeof Reflect == "object" && typeof Reflect.decorate == "function") r = Reflect.decorate(a, e, t, i);
  else for (var n = a.length - 1; n >= 0; n--) (o = a[n]) && (r = (s < 3 ? o(r) : s > 3 ? o(e, t, r) : o(e, t)) || r);
  return s > 3 && r && Object.defineProperty(e, t, r), r;
}, ne;
let S = (ne = class extends x {
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
    return c`
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

        <div class="hint-text">${l("tap_to_wake", this.locale)}</div>
      </div>
    `;
  }
  renderWeather() {
    if (!this.weatherEntity)
      return "";
    const e = this.weatherEntity.attributes.temperature ?? "--", t = this.weatherEntity.state;
    return c`
      <div class="weather-row">
        ${p("weather-sunny", 26)}
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
}, ne.styles = _`
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
  `, ne);
j([
  h({ type: Boolean })
], S.prototype, "active", void 0);
j([
  h({ type: Object })
], S.prototype, "weatherEntity", void 0);
j([
  h({ type: String })
], S.prototype, "locale", void 0);
j([
  b()
], S.prototype, "currentTime", void 0);
j([
  b()
], S.prototype, "currentDate", void 0);
j([
  b()
], S.prototype, "shiftX", void 0);
j([
  b()
], S.prototype, "shiftY", void 0);
S = j([
  k("homesmart-oled-screensaver")
], S);
var Wt = Object.defineProperty, Xt = Object.getOwnPropertyDescriptor, $ = (a, e, t, i) => {
  for (var s = i > 1 ? void 0 : i ? Xt(e, t) : e, r = a.length - 1, o; r >= 0; r--)
    (o = a[r]) && (s = (i ? o(e, t, s) : o(s)) || s);
  return i && s && Wt(e, t, s), s;
};
const lt = {
  version: 1,
  theme: "midnight",
  layout: "deck",
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
let w = class extends x {
  constructor() {
    super(...arguments), this.config = { ...lt }, this.currentDockTab = "home", this.selectedAreaId = "", this.selectedDetailArea = null, this.roomDetailOpen = !1, this.editMode = !1, this.showHidden = !1, this.viewport = nt(), this.screensaverActive = !1, this.confirmModalOpen = !1, this.pendingProtectedAction = null, this.protectedModalEntityName = "", this.protectedModalEntityIcon = "mdi:shield-check", this.protectedModalConfig = { type: "confirm" }, this.dpadNavigator = null, this.resizeHandler = () => {
    }, this.idleTimer = null, this.userActivityHandler = () => {
    };
  }
  set hass(a) {
    const e = this._hass;
    this._hass = a, this.requestUpdate("hass", e), !e && a && this.loadConfigFromHass();
  }
  get hass() {
    return this._hass;
  }
  connectedCallback() {
    super.connectedCallback(), this.updateViewport(), this.resizeHandler = () => this.updateViewport(), window.addEventListener("resize", this.resizeHandler), this.setupInactivityTracker(), this.setupListeners();
  }
  firstUpdated() {
    this.dpadNavigator = new Yt(this.renderRoot);
  }
  disconnectedCallback() {
    super.disconnectedCallback(), window.removeEventListener("resize", this.resizeHandler), this.removeInactivityTracker(), this.dpadNavigator && this.dpadNavigator.destroy();
  }
  updateViewport() {
    this.viewport = nt(this.config.layout), this.style.setProperty("--hs-columns", this.viewport.gridColumns.toString());
  }
  setupListeners() {
    this.addEventListener("area-selected", (a) => {
      this.selectedAreaId = a.detail.areaId;
    }), this.addEventListener("switch-dock-tab", (a) => {
      this.currentDockTab = a.detail.tab;
    }), this.addEventListener("open-room-detail", (a) => {
      this.selectedDetailArea = a.detail.area, this.roomDetailOpen = !0;
    }), this.addEventListener("close-room-detail", () => {
      this.roomDetailOpen = !1, this.selectedDetailArea = null;
    }), this.addEventListener("toggle-edit-mode", () => {
      this.editMode = !this.editMode;
    }), this.addEventListener("toggle-show-hidden", () => {
      this.showHidden = !this.showHidden;
    }), this.addEventListener("update-dashboard-config", (a) => {
      this.config = { ...this.config, ...a.detail }, this.setAttribute("data-theme", this.config.theme), this.updateViewport();
    }), this.addEventListener("card-config-change", (a) => {
      const { entity_id: e, ...t } = a.detail, i = { ...this.config.custom_cards };
      i[e] = {
        ...i[e],
        entity_id: e,
        ...t
      }, this.config = { ...this.config, custom_cards: i };
    }), this.addEventListener("request-protected-action", (a) => {
      const { entity: e, action: t } = a.detail;
      this.protectedModalEntityName = e.name, this.protectedModalEntityIcon = e.icon, this.protectedModalConfig = e.protection, this.pendingProtectedAction = t, this.confirmModalOpen = !0;
    }), this.addEventListener("request-save-config", async (a) => {
      const { onSuccess: e, onError: t } = a.detail;
      try {
        await this.saveConfigToHass(), e && e();
      } catch {
        t && t();
      }
    }), this.addEventListener("screensaver-dismiss", () => {
      this.screensaverActive = !1, this.resetIdleTimer();
    }), this.addEventListener("master-toggle-all-lights", (a) => {
      const { turnOn: e } = a.detail;
      this.handleMasterToggleAllLights(e);
    }), this.addEventListener("trigger-quick-scene", (a) => {
      const { sceneId: e } = a.detail;
      this.handleQuickScene(e);
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
    const a = (this.config.screensaver.timeout_seconds || 180) * 1e3;
    this.idleTimer = window.setTimeout(() => {
      this.screensaverActive = !0;
    }, a);
  }
  async loadConfigFromHass() {
    if (this._hass)
      try {
        const a = await this._hass.callWS({
          type: "homesmart/config/get"
        });
        a && typeof a == "object" && (this.config = { ...lt, ...a }, this.setAttribute("data-theme", this.config.theme), this.updateViewport());
      } catch (a) {
        console.warn("[HomeSmart] Using default config, HA store not initialized:", a);
      }
  }
  async saveConfigToHass() {
    this._hass && await this._hass.callWS({
      type: "homesmart/config/save",
      config: this.config
    });
  }
  handleMasterToggleAllLights(a) {
    if (!this.hass) return;
    const e = rt(this.hass, this.config, !0), t = a ? "turn_on" : "turn_off";
    for (const i of e)
      for (const s of i.entities)
        s.domain === "light" && this.hass.callService("light", t, { entity_id: s.entity_id });
  }
  handleQuickScene(a) {
    if (!this.hass) return;
    const e = `scene.${a}`;
    this.hass.states[e] ? this.hass.callService("scene", "turn_on", { entity_id: e }) : a === "away" || a === "sleep" ? this.handleMasterToggleAllLights(!1) : a === "home" && this.handleMasterToggleAllLights(!0);
  }
  render() {
    var s;
    const a = rt(this.hass, this.config, this.showHidden), e = qt(a), t = this.config.layout === "sidebar", i = (s = this.hass) != null && s.states ? Object.values(this.hass.states).find((r) => r.entity_id.startsWith("weather.")) : void 0;
    return c`
      <div class="homesmart-shell theme-${this.config.theme}" data-theme="${this.config.theme}">
        <!-- In-App Visual Editor Toolbar -->
        <homesmart-visual-editor-bar
          .config="${this.config}"
          .open="${this.editMode}"
          .showHidden="${this.showHidden}"
          .locale="${this.config.locale}"
        ></homesmart-visual-editor-bar>

        <div class="app-layout">
          <!-- Optional Left Sidebar (only when user explicitly chooses 'sidebar' layout) -->
          ${t ? c`
                <homesmart-sidebar-nav
                  .areas="${a}"
                  .selectedAreaId="${this.selectedAreaId}"
                  .device="${this.viewport.device}"
                  .locale="${this.config.locale}"
                  .lightsOn="${e.lightsOn}"
                  .totalActive="${e.totalActive}"
                  .editMode="${this.editMode}"
                ></homesmart-sidebar-nav>
              ` : ""}

          <!-- Main Content Viewport -->
          <main class="main-content ${t ? "sidebar-layout" : ""} ${this.viewport.device}">
            ${t ? this.renderSidebarMainContent(a) : this.renderDeckApp(a, e, i)}
          </main>
        </div>

        <!-- Floating Bottom Capsule Dock (HomeDeck Pro Style) -->
        ${t ? "" : c`
              <homesmart-floating-dock
                .activeTab="${this.currentDockTab}"
                .editMode="${this.editMode}"
                .locale="${this.config.locale}"
              ></homesmart-floating-dock>
            `}

        <!-- Room Detail Slide Sheet -->
        <homesmart-room-detail-sheet
          .hass="${this.hass}"
          .area="${this.selectedDetailArea}"
          .open="${this.roomDetailOpen}"
          .locale="${this.config.locale}"
        ></homesmart-room-detail-sheet>

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
  /**
   * HomeDeck Pro Layout View
   */
  renderDeckApp(a, e, t) {
    switch (this.currentDockTab) {
      case "rooms":
        return this.renderRoomsTabView(a);
      case "media":
        return this.renderMediaTabView(a);
      case "security":
        return this.renderSecurityTabView(a);
      case "home":
      default:
        return this.renderHomeDeckView(a, e, t);
    }
  }
  /**
   * Tab 1: Home View (Deck Carousel + Hero Header)
   */
  renderHomeDeckView(a, e, t) {
    let i = null;
    for (const s of a) {
      for (const r of s.entities)
        if (r.domain === "media_player") {
          i = r;
          break;
        }
      if (i) break;
    }
    return c`
      <!-- Top Hero Header -->
      <homesmart-hero-header
        .hass="${this.hass}"
        .locale="${this.config.locale}"
        .lightsOnCount="${e.lightsOn}"
        .weatherEntity="${t}"
      ></homesmart-hero-header>

      <!-- Horizontal Deck Cards Row (HomeDeck Style) -->
      <div class="deck-scroll-container">
        <!-- Room Cards -->
        ${a.map(
      (s) => c`
            <div class="deck-card-wrapper">
              <homesmart-deck-room-card
                .hass="${this.hass}"
                .area="${s}"
                .locale="${this.config.locale}"
              ></homesmart-deck-room-card>
            </div>
          `
    )}

        <!-- Security Deck Card -->
        <div class="deck-card-wrapper">
          <homesmart-deck-security-card
            .hass="${this.hass}"
            .areas="${a}"
            .locale="${this.config.locale}"
          ></homesmart-deck-security-card>
        </div>

        <!-- Featured TV / Primary Device Deck Card -->
        ${i ? c`
              <div class="deck-card-wrapper">
                <homesmart-deck-device-card
                  .hass="${this.hass}"
                  .entity="${i}"
                  .locale="${this.config.locale}"
                ></homesmart-deck-device-card>
              </div>
            ` : ""}
      </div>
    `;
  }
  /**
   * Tab 2: Rooms View (Full Grid of All Rooms)
   */
  renderRoomsTabView(a) {
    return c`
      <div class="tab-view-container">
        <h2 class="section-heading">
          ${p("devices", 24)}
          <span>${l("tab_rooms", this.config.locale)}</span>
        </h2>

        ${a.map(
      (e) => c`
            <section class="grid-area-section">
              <div class="area-title-bar">
                <div class="area-heading">
                  ${p(e.icon, 24)}
                  <span class="area-title-text">${e.name}</span>
                </div>
                <span class="area-count-chip">${e.entities.length}</span>
              </div>
              ${this.renderAreaBentoGrid(e)}
            </section>
          `
    )}
      </div>
    `;
  }
  /**
   * Tab 3: Media & Entertainment View
   */
  renderMediaTabView(a) {
    const e = [];
    for (const t of a)
      for (const i of t.entities)
        i.domain === "media_player" && e.push(i);
    return c`
      <div class="tab-view-container">
        <h2 class="section-heading">
          ${p("television-ambient-light", 24)}
          <span>${l("tab_media", this.config.locale)}</span>
        </h2>

        ${e.length > 0 ? c`
              <div class="bento-grid">
                ${e.map(
      (t) => c`
                    <div class="card-item size-2x2">
                      <homesmart-card-2x2-media-cam
                        .hass="${this.hass}"
                        .entity="${t}"
                        .editMode="${this.editMode}"
                        .locale="${this.config.locale}"
                      ></homesmart-card-2x2-media-cam>
                    </div>
                  `
    )}
              </div>
            ` : c`<div class="empty-notice">${l("no_entities", this.config.locale)}</div>`}
      </div>
    `;
  }
  /**
   * Tab 4: Security View
   */
  renderSecurityTabView(a) {
    const e = [];
    for (const t of a)
      for (const i of t.entities)
        (i.domain === "lock" || i.domain === "camera" || i.domain === "binary_sensor" || i.domain === "cover" && i.entity_id.includes("gara")) && e.push(i);
    return c`
      <div class="tab-view-container">
        <h2 class="section-heading">
          ${p("shield-check", 24)}
          <span>${l("tab_security", this.config.locale)}</span>
        </h2>

        ${e.length > 0 ? c`
              <div class="bento-grid">
                ${e.map(
      (t) => c`
                    <div class="card-item size-${t.size}">
                      ${t.domain === "camera" ? c`
                            <homesmart-card-2x2-media-cam
                              .hass="${this.hass}"
                              .entity="${t}"
                              .editMode="${this.editMode}"
                              .locale="${this.config.locale}"
                            ></homesmart-card-2x2-media-cam>
                          ` : c`
                            <homesmart-card-1x1
                              .hass="${this.hass}"
                              .entity="${t}"
                              .editMode="${this.editMode}"
                              .locale="${this.config.locale}"
                            ></homesmart-card-1x1>
                          `}
                    </div>
                  `
    )}
              </div>
            ` : c`<div class="empty-notice">${l("no_entities", this.config.locale)}</div>`}
      </div>
    `;
  }
  /**
   * Standard Sidebar Main Content View
   */
  renderSidebarMainContent(a) {
    if (this.selectedAreaId === "")
      return c`
        ${a.map(
        (t) => c`
            <section class="grid-area-section">
              <div class="area-title-bar">
                <div class="area-heading">
                  ${p(t.icon, 26)}
                  <span class="area-title-text">${t.name}</span>
                </div>
                <span class="area-count-chip">${t.entities.length}</span>
              </div>
              ${this.renderAreaBentoGrid(t)}
            </section>
          `
      )}
      `;
    const e = a.find((t) => t.id === this.selectedAreaId);
    return e ? c`
      <div class="area-title-bar">
        <div class="area-heading">
          ${p(e.icon, 28)}
          <span class="area-title-text">${e.name}</span>
        </div>
        <span class="area-count-chip">${e.entities.length}</span>
      </div>
      ${this.renderAreaBentoGrid(e)}
    ` : c`<div class="empty-notice">${l("no_entities", this.config.locale)}</div>`;
  }
  /**
   * Render Bento Cards for a given area
   */
  renderAreaBentoGrid(a) {
    return !a.entities || a.entities.length === 0 ? c`<div class="empty-notice">${l("no_entities", this.config.locale)}</div>` : c`
      <div class="bento-grid">
        ${a.entities.map((e) => this.renderEntityCard(e))}
      </div>
    `;
  }
  /**
   * Render individual Bento card based on its size and domain
   */
  renderEntityCard(a) {
    const e = a.size;
    return c`
      <div class="card-item size-${e}">
        ${e === "1x1" ? c`
              <homesmart-card-1x1
                .hass="${this.hass}"
                .entity="${a}"
                .editMode="${this.editMode}"
                .locale="${this.config.locale}"
              ></homesmart-card-1x1>
            ` : e === "2x1" ? c`
              <homesmart-card-2x1-slider
                .hass="${this.hass}"
                .entity="${a}"
                .editMode="${this.editMode}"
                .locale="${this.config.locale}"
              ></homesmart-card-2x1-slider>
            ` : a.domain === "climate" || a.domain === "water_heater" ? c`
              <homesmart-card-2x2-climate
                .hass="${this.hass}"
                .entity="${a}"
                .editMode="${this.editMode}"
                .locale="${this.config.locale}"
              ></homesmart-card-2x2-climate>
            ` : c`
              <homesmart-card-2x2-media-cam
                .hass="${this.hass}"
                .entity="${a}"
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
w.styles = [
  Nt,
  _`
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
        padding-bottom: 96px; /* Space for floating bottom dock */
        box-sizing: border-box;
        overflow-y: auto;
      }

      .main-content.sidebar-layout {
        padding: 24px;
        padding-bottom: 40px;
      }

      /* HomeDeck Pro Deck Cards Container */
      .deck-scroll-container {
        display: flex;
        align-items: stretch;
        gap: 16px;
        padding: 12px 32px 32px;
        overflow-x: auto;
        overflow-y: hidden;
        scroll-snap-type: x mandatory;
        -webkit-overflow-scrolling: touch;
      }

      .deck-card-wrapper {
        flex: 0 0 168px;
        height: 290px;
        scroll-snap-align: start;
      }

      @media (max-width: 768px) {
        .deck-scroll-container {
          padding: 8px 16px 24px;
          gap: 12px;
        }
        .deck-card-wrapper {
          flex: 0 0 148px;
          height: 260px;
        }
      }

      /* Grid of categories / rooms view */
      .tab-view-container {
        padding: 8px 32px 32px;
        display: flex;
        flex-direction: column;
        gap: 24px;
      }

      @media (max-width: 768px) {
        .tab-view-container {
          padding: 8px 16px 24px;
        }
      }

      .section-heading {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 20px;
        font-weight: 800;
        color: #ffffff;
        font-family: var(--hs-font-display, sans-serif);
        margin: 0;
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
  h({ attribute: !1 })
], w.prototype, "hass", 1);
$([
  b()
], w.prototype, "config", 2);
$([
  b()
], w.prototype, "currentDockTab", 2);
$([
  b()
], w.prototype, "selectedAreaId", 2);
$([
  b()
], w.prototype, "selectedDetailArea", 2);
$([
  b()
], w.prototype, "roomDetailOpen", 2);
$([
  b()
], w.prototype, "editMode", 2);
$([
  b()
], w.prototype, "showHidden", 2);
$([
  b()
], w.prototype, "viewport", 2);
$([
  b()
], w.prototype, "screensaverActive", 2);
$([
  b()
], w.prototype, "confirmModalOpen", 2);
$([
  b()
], w.prototype, "pendingProtectedAction", 2);
$([
  b()
], w.prototype, "protectedModalEntityName", 2);
$([
  b()
], w.prototype, "protectedModalEntityIcon", 2);
$([
  b()
], w.prototype, "protectedModalConfig", 2);
w = $([
  k("homesmart-panel")
], w);
export {
  w as HomeSmartPanel
};
