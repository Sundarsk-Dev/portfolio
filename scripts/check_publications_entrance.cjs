"use strict";
const assert = require("node:assert/strict");
const path = require("node:path");
const {pathToFileURL} = require("node:url");

module.exports = async function checkPublicationsEntrance(browser, {base, localFiles, output, errors}) {
  const context = await browser.newContext({viewport:{width:1440,height:1000}});
  await context.route("http://portfolio.test/**",localFiles);
  const page = await context.newPage();
  page.on("pageerror",error=>errors.push(error.message));
  const complete = async () => {
    await page.waitForFunction(()=>!document.documentElement.classList.contains("publications-entering"));
    assert.equal(await page.locator(".publications-light").count(),0);
    assert.equal(await page.locator(".index-art > picture").evaluate(e=>getComputedStyle(e).opacity),"1");
    assert.equal(await page.locator(".index-hero-copy").evaluate(e=>getComputedStyle(e).opacity),"1");
  };
  const start = async () => {
    await page.goto(base+"/publications.html");
    await page.waitForFunction(()=>document.querySelector(".publications-profile")?.getAnimations().length);
  };
  const composition = () => page.locator(".index-art > picture, .index-art > picture img").evaluateAll(elements=>elements.map(e=>{
    const r=e.getBoundingClientRect(),style=getComputedStyle(e);
    return {src:e.currentSrc,x:r.x,y:r.y,width:r.width,height:r.height,
      opacity:style.opacity,fit:style.objectFit,position:style.objectPosition,mask:style.maskImage};
  }));
  for(const width of [390,1440]) {
    await page.setViewportSize({width,height:1000});
    await start();
    const geometry = await page.locator(".index-art > picture").evaluateAll(elements=>elements.map(e=>{
      const r=e.getBoundingClientRect();return [r.x,r.y,r.width,r.height,e.querySelector("img").currentSrc];
    }));
    assert.deepEqual(geometry[0],geometry[1],"Lamp layer crop differs from still");
    assert.deepEqual(geometry[0],geometry[2],"Profile layer crop differs from still");
    for(const [name,time] of [["lamp",60],["profile",width===390?220:400]]) {
      await page.locator(".index-art").evaluate((art,time)=>art.getAnimations({subtree:true}).forEach(a=>{
        a.pause();a.currentTime=time;
      }),time);
      const opacity = selector=>page.locator(selector).evaluate(e=>Number(getComputedStyle(e).opacity));
      assert(await opacity(".publications-lamp")>0);
      if(name==="lamp") {
        assert.equal(await opacity(".index-art > picture:first-child"),0);
        assert.equal(await opacity(".publications-profile"),0);
      } else assert(await opacity(".publications-profile")>.5);
      assert.equal(await opacity(".index-hero-copy"),1,"Title waited for artwork");
      assert.equal(await page.locator(".index-hero-copy").evaluate(e=>e.getAnimations({subtree:true}).length),0);
      await page.screenshot({path:path.join(output,`publications-entrance-${name}-${width}.png`)});
    }
    await page.locator(".index-art").evaluate(art=>art.getAnimations({subtree:true}).forEach(a=>a.finish()));
    await complete();
    const animated = await composition();
    await page.locator(".index-art").screenshot({path:path.join(output,`publications-entrance-final-${width}.png`)});
    await page.emulateMedia({reducedMotion:"reduce"});
    await page.reload();
    await complete();
    await page.locator(".index-art img").evaluate(i=>i.decode());
    await page.locator(".index-art").screenshot({path:path.join(output,`publications-still-${width}.png`)});
    assert.deepEqual(animated,await composition(),"Final artwork asset/crop changed from the accepted still");
    await page.emulateMedia({reducedMotion:"no-preference"});
  }
  await start();
  await complete(); // actual real-time playback, not only forced animation frames
  await start();
  await page.keyboard.press("Tab");
  await complete();
  await start();
  await page.locator(".publication-nav a").first().focus();
  await complete();
  await start();
  await page.setViewportSize({width:1100,height:1000});
  await complete();
  await page.setViewportSize({width:390,height:400});
  await page.goto(base+"/publications.html");
  await page.locator(".index-art img").evaluate(i=>i.decode());
  const waiting = await page.locator(".index-art").evaluate(e=>e.getBoundingClientRect().top);
  assert(waiting>400,"Test requires the phone artwork below the viewport");
  assert.equal(await page.locator(".publications-light").count(),0,"Phone entrance played before artwork entered view");
  await page.locator(".index-art").scrollIntoViewIfNeeded();
  await page.waitForFunction(()=>document.querySelector(".publications-profile"));
  await complete();
  await page.setViewportSize({width:390,height:844});
  for(const hash of ["emissions","intrusion","review-heading"]) {
    await page.goto(`${base}/publications.html#${hash}`);
    await complete();
    try {
      await page.waitForFunction(hash=>{
        const r=document.getElementById(hash).getBoundingClientRect(),header=document.querySelector(".masthead").getBoundingClientRect();
        const padding=parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop);
        const maximum=document.documentElement.scrollHeight-innerHeight;
        const expected=r.top+scrollY-Math.min(maximum,Math.max(0,r.top+scrollY-padding));
        return r.top>=header.bottom-1 && Math.abs(r.top-expected)<1;
      },hash,{timeout:5000});
    } catch(error) {
      console.error(await page.evaluate(hash=>({hash,scrollY,height:innerHeight,
        target:document.getElementById(hash).getBoundingClientRect().top,
        header:document.querySelector(".masthead").getBoundingClientRect().bottom,
        padding:getComputedStyle(document.documentElement).scrollPaddingTop}),hash));
      throw error;
    }
  }
  await page.setViewportSize({width:1440,height:1000});
  await start();
  await page.evaluate(()=>scrollTo(0,1500));
  await complete();
  await page.evaluate(()=>scrollTo(0,0));
  assert.equal(await page.locator(".publications-light").count(),0,"Scroll back replayed artwork");
  await start();
  await page.emulateMedia({reducedMotion:"reduce"});
  await complete();
  await page.emulateMedia({reducedMotion:"no-preference"});
  await page.goto(pathToFileURL(path.resolve(__dirname,"../publications.html")).href);
  await page.waitForFunction(()=>document.querySelector(".publications-profile"));
  await complete();
  await context.close();

  for(const condition of ["decode-failed","decode-stalled","save-data","no-observer","unsupported-mask"]) {
    const fallback = await browser.newContext({viewport:{width:1440,height:1000}});
    await fallback.route("http://portfolio.test/**",localFiles);
    await fallback.addInitScript(condition=>{
      if(condition.startsWith("decode")) {
        const decode=HTMLImageElement.prototype.decode;
        HTMLImageElement.prototype.decode=function() {
          if(this.src.includes("publications-silhouette")) return condition==="decode-failed"?Promise.reject(new Error("Injected decode failure")):new Promise(()=>{});
          return decode.call(this);
        };
      } else if(condition==="save-data") Object.defineProperty(navigator,"connection",{configurable:true,value:{saveData:true}});
      else if(condition==="no-observer") window.IntersectionObserver=undefined;
      else {
        const supports=CSS.supports.bind(CSS);
        CSS.supports=(property,value)=>property==="mask-image"?false:supports(property,value);
      }
    },condition);
    const p=await fallback.newPage();
    p.on("pageerror",error=>errors.push(error.message));
    await p.goto(base+"/publications.html");
    await p.waitForFunction(()=>!document.documentElement.classList.contains("publications-entering"));
    assert.equal(await p.locator(".publications-light").count(),0,condition);
    assert.equal(await p.locator(".index-art > picture").evaluate(e=>getComputedStyle(e).opacity),"1",condition);
    await fallback.close();
  }

  const journey = await browser.newContext({reducedMotion:"reduce"});
  await journey.route("http://portfolio.test/**",localFiles);
  const p=await journey.newPage();
  p.on("pageerror",error=>errors.push(error.message));
  for(const width of [390,1440]) {
    await p.setViewportSize({width,height:1000});
    for(const slug of ["research-agent","trace","investigative-engine"]) {
      await p.goto(`${base}/projects/${slug}.html`);
      await p.locator(".breadcrumb a").click();
      await p.waitForURL(`**/projects.html#${slug}`);
      assert(await p.locator("#"+slug).evaluate(e=>e.getBoundingClientRect().top>=document.querySelector(".masthead").getBoundingClientRect().bottom));
      await p.goBack();
      assert(p.url().endsWith(`/projects/${slug}.html`));
    }
    await p.goto(base+"/projects/research-agent.html");
    for(const target of ["projects/trace.html","projects/investigative-engine.html","publications.html","projects.html#case-studies"]) {
      await p.locator(".case-next a").click();
      await p.waitForURL("**/"+target);
    }
  }
  await journey.close();
  console.log("PASS: Publications lamp/profile/room, original final asset/crop, visible phone trigger, fallbacks, deep links, and case-study/Projects/research journey.");
};
