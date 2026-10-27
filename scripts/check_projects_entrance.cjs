"use strict";
const assert = require("node:assert/strict");
const path = require("node:path");

module.exports = async function checkProjectsEntrance(browser, { base, localFiles, output, errors }) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await context.route("http://portfolio.test/**", localFiles);
  const page = await context.newPage();
  page.on("pageerror", error => errors.push(error.message));
  const state = () => page.evaluate(() => {
    const opacity = selector => Number(getComputedStyle(document.querySelector(selector)).opacity);
    return {
      preparing: document.documentElement.classList.contains("projects-entering"),
      subject: Boolean(document.querySelector(".projects-subject")),
      room: opacity(".projects-room"), title: opacity("#projects-heading"), text: opacity(".projects-hero .index-hero-copy"),
      caption: opacity(".projects-hero figcaption")
    };
  });
  const complete = async () => {
    await page.waitForFunction(() => !document.documentElement.classList.contains("projects-entering"));
    assert.deepEqual(await state(), { preparing: false, subject: false, room: 1, title: 1, text: 1, caption: 1 });
  };
  const composition = () => page.evaluate(() => {
    const selectors = [".projects-artwork", ".projects-room", ".projects-room img"];
    return selectors.map(selector => {
      const element = document.querySelector(selector);
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return { src: element.currentSrc, width: rect.width, height: rect.height, left: rect.left,
        mask: style.maskImage, fit: style.objectFit, position: style.objectPosition, opacity: style.opacity };
    });
  });
  const start = async () => {
    await page.goto(base + "/projects.html");
    await page.waitForFunction(() => document.querySelector(".projects-subject")?.getAnimations().length);
  };
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await start();
    const geometry = await page.evaluate(() => {
      const room = document.querySelector(".projects-room").getBoundingClientRect();
      const subject = document.querySelector(".projects-subject").getBoundingClientRect();
      return [room.x, room.y, room.width, room.height, subject.x, subject.y, subject.width, subject.height];
    });
    assert.deepEqual(geometry.slice(0, 4), geometry.slice(4), "Subject crop must match the room");
    const landmarks = await page.evaluate(async () => {
      const mask = new Image();
      mask.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(document.querySelector("template[data-projects-mask]").innerHTML);
      await mask.decode();
      const canvas = document.createElement("canvas");
      canvas.width = 1585; canvas.height = 992;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(mask, 0, 0);
      // Source-image landmarks: head, eight fingers, palms and both sleeves.
      const inside = [[752, 275], [316, 343], [348, 320], [375, 310], [401, 329],
        [1142, 337], [1173, 321], [1199, 329], [1220, 359], [344, 424], [1171, 442], [325, 619], [1190, 630]];
      const alpha = ([x, y]) => ctx.getImageData(x, y, 1, 1).data[3];
      return { inside: inside.map(alpha), gaps: [[333, 335], [1158, 330]].map(alpha) };
    });
    assert(landmarks.inside.every(alpha => alpha === 255), "Mask cuts into the figure, fingers or sleeves");
    assert(landmarks.gaps.every(alpha => alpha === 0), "Mask includes the room between the fingers");
    const duration = await page.locator(".projects-hero").evaluate(el => Math.max(...el.getAnimations({ subtree: true }).map(animation => animation.effect.getComputedTiming().endTime)));
    assert(Math.abs(duration - 1400) < 1, "Projects entrance should settle in 1.4 seconds");
    for (const [name, time] of [["figure", 700], ["surroundings", 1200]]) {
      await page.evaluate(time => document.querySelector(".projects-hero").getAnimations({ subtree: true }).forEach(animation => {
        animation.pause(); animation.currentTime = time;
      }), time);
      const frame = await state();
      if (time === 700) {
        assert.equal(frame.room, 0, "Room appeared before the silhouette finished entering");
        assert.equal(frame.title, 0, "Title appeared before the silhouette");
        assert.equal(frame.text, 0, "Text appeared before the silhouette");
        assert.equal(frame.caption, 0);
        assert(await page.locator(".projects-subject").evaluate(el => Number(getComputedStyle(el).opacity) > .98));
      } else {
        assert(frame.room > .5 && frame.title > .5 && frame.text > .5 && frame.caption > 0, "Surroundings did not follow the silhouette");
      }
      await page.screenshot({ path: path.join(output, `projects-entrance-${name}-${width}.png`) });
    }
    await page.evaluate(() => document.querySelector(".projects-hero").getAnimations({ subtree: true }).forEach(animation => animation.finish()));
    await complete();
    const animatedFinal = await composition();
    await page.locator(".projects-hero").screenshot({ path: path.join(output, `projects-entrance-final-${width}.png`) });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.reload();
    await complete();
    const stillFinal = await composition();
    assert.deepEqual(animatedFinal, stillFinal, "Entrance changed the original asset, crop, or edge masks");
    await page.emulateMedia({ reducedMotion: "no-preference" });
  }

  // Real-time completion, pointer arrivals, and interaction during the entrance.
  await start();
  await complete();
  await page.goto(base + "/index.html");
  await page.locator('.main-nav a[href="projects.html"]').click();
  await page.waitForFunction(() => document.querySelector(".projects-subject"));
  await page.mouse.wheel(0, 350);
  await complete();
  await start();
  await page.keyboard.press("Tab");
  await complete();
  assert.equal(await page.evaluate(() => document.activeElement.className), "skip-link");
  await start();
  await page.locator(".projects-hero .button").focus();
  await complete();
  await start();
  await page.evaluate(() => window.scrollTo({ top: 250, behavior: "instant" }));
  await complete();
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  assert.equal((await state()).subject, false, "Scrolling up replayed the entrance");
  await start();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await complete();
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto(base + "/projects.html#case-studies");
  await complete();
  await page.goto(base + "/index.html");
  await page.locator('.main-nav a[href="projects.html"]').focus();
  await page.keyboard.press("Enter");
  await page.waitForURL("**/projects.html");
  await complete();
  await page.goto(base + "/publications.html");
  await page.goBack();
  await complete();

  // Embedded SVG masks must also work when the user opens the HTML from disk.
  const consoleErrors = [];
  page.on("console", message => { if (message.type() === "error") consoleErrors.push(message.text()); });
  await page.goto(require("node:url").pathToFileURL(path.resolve(__dirname, "../projects.html")).href);
  await page.waitForFunction(() => document.querySelector(".projects-subject")?.getAnimations().length);
  await page.evaluate(() => document.querySelector(".projects-hero").getAnimations({ subtree: true }).forEach(animation => {
    animation.pause(); animation.currentTime = 700;
  }));
  assert.equal((await state()).room, 0);
  await page.screenshot({ path: path.join(output, "projects-entrance-file-1440.png") });
  assert.deepEqual(consoleErrors, [], "Local file preview could not render the mask");
  await page.goto(base + "/projects.html");
  await context.addInitScript(() => {
    const decode = HTMLImageElement.prototype.decode;
    HTMLImageElement.prototype.decode = function () {
      const failure = sessionStorage.getItem("test-project-mask");
      if (failure && this.src.startsWith("data:image/svg+xml")) {
        return failure === "missing" ? Promise.reject(new Error("Mask decode failed")) : new Promise(() => {});
      }
      return decode.call(this);
    };
  });
  for (const failure of ["missing", "stalled"]) {
    await page.evaluate(failure => sessionStorage.setItem("test-project-mask", failure), failure);
    await page.goto(base + "/projects.html", { waitUntil: "domcontentloaded" });
    if (failure === "stalled") assert.equal((await state()).room, 0, "Preparing state flashed the full image");
    await complete();
  }
  await context.close();

  for (const fallback of ["no-js", "reduced", "save-data", "unsupported", "short-screen"]) {
    const fallbackContext = await browser.newContext({
      viewport: { width: 390, height: fallback === "short-screen" ? 430 : 844 }, javaScriptEnabled: fallback !== "no-js",
      reducedMotion: fallback === "reduced" ? "reduce" : "no-preference"
    });
    if (fallback === "save-data") await fallbackContext.addInitScript(() => Object.defineProperty(navigator, "connection", { value: { saveData: true } }));
    if (fallback === "unsupported") await fallbackContext.addInitScript(() => { CSS.supports = () => false; });
    await fallbackContext.route("http://portfolio.test/**", localFiles);
    const fallbackPage = await fallbackContext.newPage();
    fallbackPage.on("pageerror", error => errors.push(error.message));
    await fallbackPage.goto(base + "/projects.html");
    assert.equal(await fallbackPage.locator(".projects-subject").count(), 0, fallback);
    assert.equal(await fallbackPage.locator(".projects-hero .index-hero-copy").evaluate(el => getComputedStyle(el).opacity), "1", fallback);
    await fallbackPage.getByRole("link", { name: "View case studies" }).click();
    await fallbackPage.waitForURL("**/projects.html#case-studies");
    await fallbackContext.close();
  }
  console.log("PASS: Projects figure/room/text order, original final asset/crop, local-file preview, pointer arrival, completion/cancellation, keyboard/hash/history, failed/stalled mask decode, no-JS/reduced/save-data/unsupported/short-screen fallbacks");
};
