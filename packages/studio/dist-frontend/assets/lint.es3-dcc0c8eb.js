import{a as B}from"./codemirror.es-dea59e4a.js";import"./index-848348a5.js";var W=Object.defineProperty,l=(g,v)=>W(g,"name",{value:v,configurable:!0});function H(g,v){return v.forEach(function(s){s&&typeof s!="string"&&!Array.isArray(s)&&Object.keys(s).forEach(function(u){if(u!=="default"&&!(u in g)){var c=Object.getOwnPropertyDescriptor(s,u);Object.defineProperty(g,u,c.get?c:{enumerable:!0,get:function(){return s[u]}})}})}),Object.freeze(Object.defineProperty(g,Symbol.toStringTag,{value:"Module"}))}l(H,"_mergeNamespaces");var U={exports:{}};(function(g,v){(function(s){s(B.exports)})(function(s){var u="CodeMirror-lint-markers",c="CodeMirror-lint-line-";function E(t,e,r){var n=document.createElement("div");n.className="CodeMirror-lint-tooltip cm-s-"+t.options.theme,n.appendChild(r.cloneNode(!0)),t.state.lint.options.selfContain?t.getWrapperElement().appendChild(n):document.body.appendChild(n);function o(i){if(!n.parentNode)return s.off(document,"mousemove",o);n.style.top=Math.max(0,i.clientY-n.offsetHeight-5)+"px",n.style.left=i.clientX+5+"px"}return l(o,"position"),s.on(document,"mousemove",o),o(e),n.style.opacity!=null&&(n.style.opacity=1),n}l(E,"showTooltip");function C(t){t.parentNode&&t.parentNode.removeChild(t)}l(C,"rm");function N(t){t.parentNode&&(t.style.opacity==null&&C(t),t.style.opacity=0,setTimeout(function(){C(t)},600))}l(N,"hideTooltip");function L(t,e,r,n){var o=E(t,e,r);function i(){s.off(n,"mouseout",i),o&&(N(o),o=null)}l(i,"hide");var a=setInterval(function(){if(o)for(var f=n;;f=f.parentNode){if(f&&f.nodeType==11&&(f=f.host),f==document.body)return;if(!f){i();break}}if(!o)return clearInterval(a)},400);s.on(n,"mouseout",i)}l(L,"showTooltipFor");function w(t,e,r){this.marked=[],e instanceof Function&&(e={getAnnotations:e}),(!e||e===!0)&&(e={}),this.options={},this.linterOptions=e.options||{};for(var n in O)this.options[n]=O[n];for(var n in e)O.hasOwnProperty(n)?e[n]!=null&&(this.options[n]=e[n]):e.options||(this.linterOptions[n]=e[n]);this.timeout=null,this.hasGutter=r,this.onMouseOver=function(o){j(t,o)},this.waitingFor=0}l(w,"LintState");var O={highlightLines:!1,tooltips:!0,delay:500,lintOnChange:!0,getAnnotations:null,async:!1,selfContain:null,formatAnnotation:null,onUpdateLinting:null};function k(t){var e=t.state.lint;e.hasGutter&&t.clearGutter(u),e.options.highlightLines&&x(t);for(var r=0;r<e.marked.length;++r)e.marked[r].clear();e.marked.length=0}l(k,"clearMarks");function x(t){t.eachLine(function(e){var r=e.wrapClass&&/\bCodeMirror-lint-line-\w+\b/.exec(e.wrapClass);r&&t.removeLineClass(e,"wrap",r[0])})}l(x,"clearErrorLines");function A(t,e,r,n,o){var i=document.createElement("div"),a=i;return i.className="CodeMirror-lint-marker CodeMirror-lint-marker-"+r,n&&(a=i.appendChild(document.createElement("div")),a.className="CodeMirror-lint-marker CodeMirror-lint-marker-multiple"),o!=!1&&s.on(a,"mouseover",function(f){L(t,f,e,a)}),i}l(A,"makeMarker");function F(t,e){return t=="error"?t:e}l(F,"getMaxSeverity");function G(t){for(var e=[],r=0;r<t.length;++r){var n=t[r],o=n.from.line;(e[o]||(e[o]=[])).push(n)}return e}l(G,"groupByLine");function M(t){var e=t.severity;e||(e="error");var r=document.createElement("div");return r.className="CodeMirror-lint-message CodeMirror-lint-message-"+e,typeof t.messageHTML<"u"?r.innerHTML=t.messageHTML:r.appendChild(document.createTextNode(t.message)),r}l(M,"annotationTooltip");function I(t,e){var r=t.state.lint,n=++r.waitingFor;function o(){n=-1,t.off("change",o)}l(o,"abort"),t.on("change",o),e(t.getValue(),function(i,a){t.off("change",o),r.waitingFor==n&&(a&&i instanceof s&&(i=a),t.operation(function(){y(t,i)}))},r.linterOptions,t)}l(I,"lintAsync");function m(t){var e=t.state.lint;if(e){var r=e.options,n=r.getAnnotations||t.getHelper(s.Pos(0,0),"lint");if(n)if(r.async||n.async)I(t,n);else{var o=n(t.getValue(),e.linterOptions,t);if(!o)return;o.then?o.then(function(i){t.operation(function(){y(t,i)})}):t.operation(function(){y(t,o)})}}}l(m,"startLinting");function y(t,e){var r=t.state.lint;if(r){var n=r.options;k(t);for(var o=G(e),i=0;i<o.length;++i){var a=o[i];if(a){var f=[];a=a.filter(function(D){return f.indexOf(D.message)>-1?!1:f.push(D.message)});for(var p=null,d=r.hasGutter&&document.createDocumentFragment(),_=0;_<a.length;++_){var h=a[_],T=h.severity;T||(T="error"),p=F(p,T),n.formatAnnotation&&(h=n.formatAnnotation(h)),r.hasGutter&&d.appendChild(M(h)),h.to&&r.marked.push(t.markText(h.from,h.to,{className:"CodeMirror-lint-mark CodeMirror-lint-mark-"+T,__annotation:h}))}r.hasGutter&&t.setGutterMarker(i,u,A(t,d,p,o[i].length>1,n.tooltips)),n.highlightLines&&t.addLineClass(i,"wrap",c+p)}}n.onUpdateLinting&&n.onUpdateLinting(e,o,t)}}l(y,"updateLinting");function b(t){var e=t.state.lint;e&&(clearTimeout(e.timeout),e.timeout=setTimeout(function(){m(t)},e.options.delay))}l(b,"onChange");function P(t,e,r){for(var n=r.target||r.srcElement,o=document.createDocumentFragment(),i=0;i<e.length;i++){var a=e[i];o.appendChild(M(a))}L(t,r,o,n)}l(P,"popupTooltips");function j(t,e){var r=e.target||e.srcElement;if(/\bCodeMirror-lint-mark-/.test(r.className)){for(var n=r.getBoundingClientRect(),o=(n.left+n.right)/2,i=(n.top+n.bottom)/2,a=t.findMarksAt(t.coordsChar({left:o,top:i},"client")),f=[],p=0;p<a.length;++p){var d=a[p].__annotation;d&&f.push(d)}f.length&&P(t,f,e)}}l(j,"onMouseOver"),s.defineOption("lint",!1,function(t,e,r){if(r&&r!=s.Init&&(k(t),t.state.lint.options.lintOnChange!==!1&&t.off("change",b),s.off(t.getWrapperElement(),"mouseover",t.state.lint.onMouseOver),clearTimeout(t.state.lint.timeout),delete t.state.lint),e){for(var n=t.getOption("gutters"),o=!1,i=0;i<n.length;++i)n[i]==u&&(o=!0);var a=t.state.lint=new w(t,e,o);a.options.lintOnChange&&t.on("change",b),a.options.tooltips!=!1&&a.options.tooltips!="gutter"&&s.on(t.getWrapperElement(),"mouseover",a.onMouseOver),m(t)}}),s.defineExtension("performLint",function(){m(this)})})})();var $=U.exports,V=H({__proto__:null,default:$},[U.exports]);export{V as l};
