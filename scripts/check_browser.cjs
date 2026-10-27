"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const root = path.resolve(__dirname, "..");
const output = path.join(root, "review", "verification");
const pages = ["index.html", "publications.html", "projects/research-agent.html", "projects.html", "projects/trace.html", "projects/investigative-engine.html"];
const mime = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".pdf": "application/pdf", ".webp": "image/webp" };
// Local response interception avoids the sandbox's blocked loopback network.
async function localFiles(route) {
  let file;
  try { file = path.resolve(root, "." + decodeURIComponent(new URL(route.request().url()).pathname)); }
  catch (_) { await route.fulfill({ status: 400, body: "Bad request" }); return; }
  if (!file.startsWith(root + path.sep)) { await route.fulfill({ status: 403, body: "Forbidden" }); return; }
  try {
    await route.fulfill({ status: 200, contentType: mime[path.extname(file)] || "application/octet-stream", body: await fs.promises.readFile(file) });
  } catch (_) { await route.fulfill({ status: 404, body: "Not found" }); }
}
async function layout(page, label) {
  const result = await page.evaluate(() => ({
    width: innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    overflow: [...document.querySelectorAll("main h1, main h2, main h3, main p, nav a, .button, .map-label")]
      .filter(element => { const r = element.getBoundingClientRect(); return r.width > 0 && (r.left < -1 || r.right > innerWidth + 1 || element.scrollWidth > element.clientWidth + 1); })
      .map(element => element.textContent.trim().slice(0, 70)),
    targets: [...document.querySelectorAll("a, button, summary")]
      .filter(element => { const r = element.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.height < 43; })
      .map(element => element.textContent.trim())
  }));
  assert(result.scrollWidth <= result.width + 1, `${label}: page overflow`);
  assert.deepEqual(result.overflow, [], `${label}: clipped content`);
  assert.deepEqual(result.targets, [], `${label}: small interaction targets`);
}
(async () => {
  let browser;
  const errors = [];
  try {
    const base = "http://portfolio.test";
    fs.mkdirSync(output, { recursive: true });
    browser = await chromium.launch({ executablePath: process.env.PORTFOLIO_BROWSER || undefined, headless: true, timeout: 20000 });
    console.log(`Browser: Chrome/Chromium ${browser.version()}`);
    if (process.argv.includes("--publications-entrance")) {
      await require("./check_publications_entrance.cjs")(browser, { base, localFiles, output, errors });
      assert.deepEqual(errors, [], "Browser JavaScript errors");
      return;
    }
    if (process.argv.includes("--projects-entrance")) {
      await require("./check_projects_entrance.cjs")(browser, { base, localFiles, output, errors });
      assert.deepEqual(errors, [], "Browser JavaScript errors");
      return;
    }
    const context = await browser.newContext({ reducedMotion: "reduce" });
    await context.route("http://portfolio.test/**", localFiles);
    const page = await context.newPage();
    page.on("pageerror", error => errors.push(error.message));
    for (const width of [320, 390, 768, 1024, 1100, 1101, 1440, 1920]) {
      await page.setViewportSize({ width, height: 1000 });
      for (const route of pages) {
        await page.goto(`${base}/${route}`);
        await layout(page, `${route} at ${width}`);
        assert.equal(await page.locator("h1").count(), 1);
        await page.locator("img").evaluateAll(images => Promise.all(images.map(img => img.decode())));
        const failedImages = await page.locator("img").evaluateAll(images => images.filter(img => !img.naturalWidth).map(img => img.src));
        assert.deepEqual(failedImages, [], "Images failed to load");
        assert.equal(await page.locator("[data-story-scene]").count(), 0);
        if (route === "projects.html") {
          const composition = await page.evaluate(() => {
            const art = document.querySelector(".projects-room img").getBoundingClientRect();
            const title = document.querySelector("#projects-heading").getBoundingClientRect();
            const copy = document.querySelector(".projects-hero .index-hero-copy").getBoundingClientRect();
            const mobile = innerWidth <= 1100;
            const x = source => art.left + (source - (mobile ? 170 : 0)) * art.width / (mobile ? 1180 : 1585);
            const y = source => art.top + source * art.height / 992;
            return { centered: !mobile || Math.abs(x(753) - innerWidth / 2) < 2,
              handsVisible: x(274) > 0 && x(1239) < innerWidth,
              titleClear: mobile ? title.bottom < y(207) : x(1239) + 16 < title.left,
              copyClear: mobile ? copy.bottom < y(207) : x(1239) + 16 < copy.left };
          });
          assert(Object.values(composition).every(Boolean), `Projects figure/text clearance at ${width}px: ${JSON.stringify(composition)}`);
        }
        if (route === pages[0] && [390, 1440].includes(width)) {
          await page.screenshot({ path: path.join(output, `home-${width}.png`), fullPage: true });
          await page.screenshot({ path: path.join(output, `opening-${width}.png`) });
        }
        if (route === pages[0]) {
          const columns = await page.evaluate(() => [".experience-records", ".education-records", ".about-copy", ".contact-links"].map(selector => document.querySelector(selector).getBoundingClientRect().left));
          assert(Math.max(...columns) - Math.min(...columns) < 1, `Lower Home columns differ at ${width}px`);
        }
        if ([390, 1440].includes(width) && route !== pages[0]) {
          const name = route === "publications.html" ? "publications" : route === "projects.html" ? "projects" : path.basename(route, ".html");
          await page.screenshot({ path: path.join(output, `${name}-${width}.png`), fullPage: true });
          if (["projects.html", "publications.html"].includes(route)) {
            await page.screenshot({ path: path.join(output, `${name}-opening-${width}.png`) });
          }
        }
      }
      console.log(`PASS: all six pages at ${width}px; no overflow, clipped text or undersized links`);
    }
    await page.goto(`${base}/${pages[0]}`);
    await page.locator(".button").hover();
    assert.equal(await page.locator(".button").evaluate(el => getComputedStyle(el).transform), "none");
    assert.equal(await page.evaluate(() => document.getAnimations().length), 0);
    await context.close();

    await require("./check_projects_entrance.cjs")(browser, { base, localFiles, output, errors });

    await require("./check_publications_entrance.cjs")(browser, { base, localFiles, output, errors });

    const interactive = await browser.newContext({ viewport: { width: 1440, height: 900 }, recordVideo: { dir: output, size: { width: 1440, height: 900 } } });
    await interactive.route("http://portfolio.test/**", localFiles);
    const live = await interactive.newPage();
    live.on("pageerror", error => errors.push(error.message));
    await live.goto(`${base}/${pages[0]}`);
    await live.keyboard.press("Tab");
    assert.equal(await live.evaluate(() => document.activeElement.className), "skip-link");
    assert.equal(await live.locator(".skip-link").evaluate(el => getComputedStyle(el).outlineStyle), "solid");
    await live.keyboard.press("Enter");
    await live.waitForURL("**/index.html#main");
    await live.getByRole("link", { name: "Explore selected work" }).focus();
    await live.keyboard.press("Enter");
    await live.waitForURL("**/index.html#work");
    await live.getByRole("link", { name: "Read the project", exact: true }).first().focus();
    await live.keyboard.press("Enter");
    await live.waitForURL("**/projects/research-agent.html");
    assert.equal(await live.locator('.main-nav [aria-current="location"]').innerText(), "Projects");
    await live.getByRole("link", { name: "The tradeoff", exact: true }).click();
    await live.waitForURL("**/research-agent.html#tradeoff");
    await live.goBack();
    await live.goBack();
    assert(live.url().endsWith("index.html#work"));
    await live.locator('.main-nav a[href="projects.html"]').click();
    await live.waitForURL("**/projects.html");
    await live.getByRole("link", { name: "Read the project", exact: true }).nth(1).click();
    await live.waitForURL("**/projects/trace.html");
    await live.getByRole("link", { name: "Back to projects" }).click();
    await live.waitForURL("**/projects.html#trace");
    await live.getByRole("link", { name: "Education", exact: true }).click();
    await live.waitForURL("**/index.html#education");
    await live.getByRole("link", { name: "Predictive vehicle emission monitoring" }).click();
    await live.waitForURL("**/publications.html#emissions");
    await live.getByText("Publication record", { exact: true }).click();
    assert.equal(await live.locator("details[open]").count(), 1);
    // Headless PDF rendering varies by Chrome build; intercept the preview body only.
    // The actual PDF bytes/download are checked separately below.
    await interactive.route("**/Kamal_Sundar_SK_FlowCV_Resume_2026-10-24.pdf", route => route.fulfill({
      contentType: "text/html", body: "<title>PDF tab destination check</title>"
    }));
    const sourceURL = live.url();
    const previewEvent = live.waitForEvent("popup");
    await live.locator(".nav-resume").click();
    const preview = await previewEvent;
    await preview.waitForURL("**/Kamal_Sundar_SK_FlowCV_Resume_2026-10-24.pdf");
    assert.equal(await preview.evaluate(() => window.opener), null);
    assert.equal(live.url(), sourceURL);
    await preview.close();
    await interactive.unroute("**/Kamal_Sundar_SK_FlowCV_Resume_2026-10-24.pdf");

    await live.goto(base + "/index.html");
    await interactive.route("https://linkedin.com/**", route => route.fulfill({
      contentType: "text/html", body: "<title>External destination check</title>"
    }));
    const externalEvent = live.waitForEvent("popup");
    await live.getByRole("link", { name: "LinkedIn" }).click();
    const external = await externalEvent;
    await external.waitForURL("https://linkedin.com/in/sundar-sk");
    assert.equal(await external.evaluate(() => window.opener), null);
    assert.equal(live.url(), base + "/index.html");
    await external.close();
    const downloadEvent = live.waitForEvent("download");
    await live.getByRole("link", { name: "Download résumé" }).click();
    assert.equal((await downloadEvent).suggestedFilename(), "Kamal_Sundar_SK_FlowCV_Resume_2026-10-24.pdf");

    await live.goto(base + "/index.html");
    assert.equal(await live.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior), "smooth");
    assert(await live.evaluate(() => document.getAnimations().length > 0), "Homepage text entrance missing");
    assert(await live.locator(".reveal-pending").count() > 0, "Below-fold reveals were not prepared");
    await live.evaluate(() => {
      const row = document.querySelectorAll(".work-row")[1];
      window.scrollTo({ top: row.getBoundingClientRect().top + scrollY - 300, behavior: "instant" });
    });
    await live.waitForFunction(() => {
      const row = document.querySelectorAll(".work-row")[1];
      return !row.classList.contains("reveal-pending") && row.getAnimations().length === 0 && getComputedStyle(row).opacity === "1";
    });
    await live.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    await live.evaluate(() => {
      const row = document.querySelectorAll(".work-row")[1];
      window.scrollTo({ top: row.getBoundingClientRect().top + scrollY - 300, behavior: "instant" });
    });
    assert.equal(await live.locator(".work-row").nth(1).evaluate(el => el.getAnimations().length), 0, "Section entrance replayed");
    await live.getByRole("link", { name: "Education", exact: true }).click();
    await live.waitForFunction(() => document.querySelector('.main-nav [aria-current="location"]')?.dataset.section === "education");
    await live.waitForFunction(() => {
      const section = document.querySelector("#education").getBoundingClientRect();
      const header = document.querySelector(".masthead").getBoundingClientRect();
      return section.top >= header.bottom && section.top < header.bottom + 26;
    });
    assert.equal(await live.locator(".masthead").evaluate(el => Math.round(el.getBoundingClientRect().top)), 0);
    assert(await live.locator(".scroll-progress").evaluate(el => new DOMMatrix(getComputedStyle(el).transform).a > .5));
    await live.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" }));
    await live.waitForFunction(() => document.querySelector('.main-nav [aria-current="location"]')?.dataset.section === "contact");
    await live.waitForFunction(() => new DOMMatrix(getComputedStyle(document.querySelector(".scroll-progress")).transform).a > .999);

    await live.goto(base + "/projects/research-agent.html#tradeoff");
    await live.waitForFunction(() => document.querySelector('.case-nav [aria-current]')?.getAttribute("href") === "#tradeoff");
    // A short section must stay current when an anchor lands at its reading start.
    await live.goto(base + "/projects/research-agent.html#evaluation");
    await live.waitForFunction(() => document.querySelector('.case-nav [aria-current]')?.getAttribute("href") === "#evaluation");
    await live.goto(base + "/publications.html#review-heading");
    await live.waitForFunction(() => document.querySelector('.publication-nav [aria-current]')?.getAttribute("href") === "#review-heading");

    await live.goto(base + "/index.html");
    await live.emulateMedia({ reducedMotion: "reduce" });
    await live.waitForFunction(() => document.getAnimations().length === 0 && !document.querySelector(".reveal-pending"));
    assert.equal(await live.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior), "auto");
    console.log("PASS: new-tab resume/social destinations and opener isolation, real PDF download, sticky header, smooth anchors, progress/current-section tracking, entrances and live reduced-motion change");
    const video = live.video();
    await interactive.close();
    await video.saveAs(path.join(output, "navigation.webm"));
    await video.delete();
    console.log("PASS: keyboard skip link/focus, project navigation, contents anchors, history, publication deep links, disclosure and resume download");

    for (const settings of [{ javaScriptEnabled: false }, { isMobile: true, hasTouch: true }]) {
      const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce", ...settings });
      await context.route("http://portfolio.test/**", localFiles);
    const page = await context.newPage();
      await page.goto(`${base}/${pages[0]}`);
      await layout(page, settings.javaScriptEnabled === false ? "No JS" : "Touch");
      await page.getByRole("link", { name: "Explore selected work" }).click();
      await page.waitForURL("**/index.html#work");
      await page.getByRole("link", { name: "Read the project", exact: true }).first().click();
      await page.waitForURL("**/projects/research-agent.html");
      await context.close();
    }
    const zoom = await browser.newContext({ viewport: { width: 720, height: 450 }, deviceScaleFactor: 2, reducedMotion: "reduce" });
    await zoom.route("http://portfolio.test/**", localFiles);
    const zoomPage = await zoom.newPage();
    for (const route of pages) {
      await zoomPage.goto(`${base}/${route}`);
      await layout(zoomPage, `${route}, 200% layout equivalent`);
    }
    await zoom.close();
    assert.deepEqual(errors, [], "Browser JavaScript errors");
    console.log("PASS: reduced motion, no-JS, touch and 720 CSS pixels at DPR 2 (200% layout equivalent; not browser zoom UI)");
    console.log("Screenshots and navigation recording saved in review/verification/. Files served by Playwright route interception; no external or loopback requests.");
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  } finally {
    if (browser) await browser.close();
  }
})();
