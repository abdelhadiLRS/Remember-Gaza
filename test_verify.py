import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch()

        # Desktop AR
        page = await browser.new_page(viewport={"width": 1280, "height": 800})
        await page.goto("http://localhost:3000/gaza.html?lang=ar")
        await page.wait_for_timeout(2000)
        await page.screenshot(path="verification_desktop_ar.png")

        # Mobile AR
        mobile_page = await browser.new_page(viewport={"width": 375, "height": 667})
        await mobile_page.goto("http://localhost:3000/gaza.html?lang=ar")
        await mobile_page.wait_for_timeout(2000)
        await mobile_page.screenshot(path="verification_mobile_ar.png")

        # Desktop EN
        page_en = await browser.new_page(viewport={"width": 1280, "height": 800})
        await page_en.goto("http://localhost:3000/gaza.html?lang=en")
        await page_en.wait_for_timeout(2000)
        await page_en.screenshot(path="verification_desktop_en.png")

        # Review Panel Desktop
        page_rev = await browser.new_page(viewport={"width": 1280, "height": 800})
        await page_rev.goto("http://localhost:3000/review-panel.html?lang=ar")
        await page_rev.wait_for_timeout(2000)
        await page_rev.screenshot(path="verification_review_panel.png")

        await browser.close()

asyncio.run(run())
