/**
 * Turn the agent's TSX into something a page can show: a server-rendered
 * snapshot plus the ES module that hydrates it. Shared by the hosted build;
 * mirrors the transform verify-homepage.ts proves out.
 */
import { transform } from "sucrase";
import React from "react";
import { renderToString } from "react-dom/server";
import { escapeHtml, leadHeadline } from "./archive-index";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

/** Evaluate the component with React as its only import, as the contract allows. */
export function loadComponent(tsx: string): React.ComponentType {
  const js = transform(tsx, { transforms: ["typescript", "jsx", "imports"], jsxRuntime: "classic", production: true }).code;
  const module_ = { exports: {} as any };
  const require_ = (name: string) => {
    if (name === "react") return React;
    throw new Error(`component imported "${name}"; only "react" is allowed`);
  };
  new Function("require", "module", "exports", "React", js)(require_, module_, module_.exports, React);
  const Component = module_.exports.default ?? module_.exports.PersonalizedHomepage;
  if (typeof Component !== "function") throw new Error(`no default-exported component (got ${typeof Component})`);
  return Component;
}

/**
 * Bundle React, the component and a hydrate call into one self-contained
 * script, so the page needs no CDN at view time.
 */
async function bundleHydration(tsx: string): Promise<string> {
  // Inside harness/ so the bundler resolves react from harness/node_modules.
  const dir = mkdtempSync(join(import.meta.dir, ".site-build-"));
  try {
    writeFileSync(join(dir, "homepage.tsx"), tsx);
    writeFileSync(
      join(dir, "entry.tsx"),
      `import React from "react";
import { hydrateRoot } from "react-dom/client";
import Homepage from "./homepage";
hydrateRoot(document.getElementById("root")!, React.createElement(Homepage));
`,
    );
    const result = await Bun.build({
      entrypoints: [join(dir, "entry.tsx")],
      minify: true,
      target: "browser",
      define: { "process.env.NODE_ENV": JSON.stringify("production") },
    });
    if (!result.success) throw new AggregateError(result.logs, "bundling the homepage failed");
    return await result.outputs[0].text();
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

/**
 * The two editions. The agent styles the page only with these variables, so the
 * shell can switch editions: the reader's system setting by default, or the
 * Night button, remembered per browser.
 */
const IVORY = "--bg:#f5ead0;--raised:#eddcc0;--fg:#20203e;--fg2:#3d3424;--border:#cbb88a;--accent:#7a5a10;--steel:#2e4a5a;--purple:#5a35b0;--urgent:#8a2418;--good:#2d6644;color-scheme:light";
const NIGHT = "--bg:#292c33;--raised:#313540;--fg:#e8e6e1;--fg2:#c5c8c6;--border:#4a4f5c;--accent:#dbbb6f;--steel:#b8cad4;--purple:#b095e0;--urgent:#e6a8a2;--good:#8fc7a0;color-scheme:dark";
const THEME_CSS = `:root{${IVORY}}
@media (prefers-color-scheme: dark){:root:not([data-theme="ivory"]){${NIGHT}}}
:root[data-theme="night"]{${NIGHT}}
html,body{margin:0;background:var(--bg);color:var(--fg)}
details>summary{list-style:none}details>summary::-webkit-details-marker{display:none}
details>summary::after{content:" +"}details[open]>summary::after{content:" \\2212"}
[data-story][data-new]::before{content:"new";display:inline-block;margin:0 0 6px;padding:1px 7px;border-radius:999px;background:var(--accent);color:var(--bg);font:600 .68rem/1.5 'JetBrains Mono',ui-monospace,monospace;letter-spacing:.08em;text-transform:uppercase}`;
/** Runs before first paint so a saved choice doesn't flash the other edition. */
const THEME_BOOT = `try{var t=localStorage.getItem("theme");if(t)document.documentElement.dataset.theme=t}catch(e){}`;
/** Wires any [data-theme-toggle] button; delegated, so hydration can't drop it. */
const THEME_TOGGLE = `(function(){var r=document.documentElement;function night(){return r.dataset.theme?r.dataset.theme==="night":matchMedia("(prefers-color-scheme: dark)").matches}
function label(){document.querySelectorAll("[data-theme-toggle]").forEach(function(b){b.textContent=night()?"Day":"Night";b.setAttribute("aria-pressed",String(night()))})}
document.addEventListener("click",function(e){if(!e.target.closest||!e.target.closest("[data-theme-toggle]"))return;r.dataset.theme=night()?"ivory":"night";try{localStorage.setItem("theme",r.dataset.theme)}catch(x){}label()});
label();setTimeout(label,1500)})();`;

/**
 * Opened from the home screen, the page runs full-screen with no reload
 * button, and iOS keeps it alive for days. When it comes back to the front
 * after a while, check whether a newer edition is out and reload if so.
 */
const FRESHEN = `(function(){var loaded=Date.now(),busy=false;function built(d){var m=d.querySelector('meta[name="built-at"]');return m&&m.content}
document.addEventListener("visibilitychange",function(){if(document.visibilityState!=="visible"||busy||Date.now()-loaded<15*60*1000)return;busy=true;
fetch(location.href,{cache:"no-store"}).then(function(r){return r.ok?r.text():""}).then(function(t){var b=t&&built(new DOMParser().parseFromString(t,"text/html"));
if(b&&b!==built(document))location.reload();else{loaded=Date.now();busy=false}}).catch(function(){busy=false})})})();`;

/**
 * Registers the service worker at the site root, which is also where an
 * archived copy of this page finds it (archive/YYYY-MM-DD/ is two levels down).
 */
const OFFLINE = `if("serviceWorker"in navigator){var root=location.pathname.replace(/[^/]*$/,"").replace(/archive\\/[^/]+\\/$/,"");
navigator.serviceWorker.register(root+"sw.js",{scope:root}).catch(function(){})}`;

/**
 * Tags stories ([data-story]) that weren't on the page at the reader's last
 * visit, keyed by each story's first link. The seen list is per browser and
 * saved when the page is hidden, so a story stays tagged for the whole visit.
 * Nothing is tagged on a first visit or on archived editions.
 */
const NEW_MARKS = `(function(){if(/\\/archive\\//.test(location.pathname))return;var K="seen-stories",seen=null;try{seen=JSON.parse(localStorage.getItem(K)||"null")}catch(e){}
function all(){return[].slice.call(document.querySelectorAll("[data-story]"))}
function key(el){var a=el.querySelector("a[href]");return a?a.href:(el.textContent||"").replace(/\\s+/g," ").trim().slice(0,160)}
function mark(){if(!seen)return;var s={};seen.forEach(function(k){s[k]=1});all().forEach(function(el){if(!s[key(el)])el.setAttribute("data-new","")})}
function save(){var now=all().map(key),keep=(seen||[]).filter(function(k){return now.indexOf(k)<0});try{localStorage.setItem(K,JSON.stringify(keep.concat(now).slice(-600)))}catch(e){}}
mark();setTimeout(mark,1500);addEventListener("pagehide",save);document.addEventListener("visibilitychange",function(){if(document.visibilityState==="hidden")save()})})();`;

/** index.html (server-rendered) plus homepage.js, which hydrates it. */
export async function renderSite(tsx: string, builtAt: Date): Promise<{ html: string; script: string }> {
  const markup = renderToString(React.createElement(loadComponent(tsx)));
  const lead = leadHeadline(markup);
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<meta name="built-at" content="${builtAt.toISOString()}">
${lead ? `<meta name="lead" content="${escapeHtml(lead)}">\n` : ""}<title>The Context</title>
<meta name="apple-mobile-web-app-title" content="The Context">
<link rel="icon" href="icon.svg" type="image/svg+xml">
<link rel="icon" href="favicon-32.png" sizes="32x32" type="image/png">
<link rel="apple-touch-icon" href="apple-touch-icon.png">
<link rel="manifest" href="manifest.webmanifest">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="theme-color" content="#f5ead0" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#292c33" media="(prefers-color-scheme: dark)">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,600;0,6..72,700;1,6..72,700&family=JetBrains+Mono:wght@400;500;700&display=swap">
<style>${THEME_CSS}</style>
<script>${THEME_BOOT}</script>
</head>
<body>
<div id="root">${markup}</div>
<!-- The page above is complete on its own; hydrating only adds hover states and other interactivity. -->
<script src="homepage.js?v=${builtAt.getTime()}" defer></script>
<script>${THEME_TOGGLE}</script>
<script>${FRESHEN}</script>
<script>${OFFLINE}</script>
<script>${NEW_MARKS}</script>
<!-- Cloudflare Web Analytics, the same beacon as the rest of cameronsjo.github.io. -->
<script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon='{"token": "9db7302de886402680e0838d0f35f7db"}'></script>
</body>
</html>
`;
  return { html, script: await bundleHydration(tsx) };
}
