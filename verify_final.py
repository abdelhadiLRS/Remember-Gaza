import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch()

        # Desktop
        page_desk = await browser.new_page(viewport={'width': 1280, 'height': 800})
        await page_desk.goto('http://localhost:3000/gaza.html')
        await page_desk.wait_for_timeout(2000)
        await page_desk.screenshot(path='/home/jules/verification/gaza_desktop_final.png')

        await page_desk.goto('http://localhost:3000/stats.html')
        await page_desk.wait_for_timeout(2000)
        await page_desk.screenshot(path='/home/jules/verification/stats_desktop_final.png')

        await page_desk.goto('http://localhost:3000/edit-martyr.html')
        await page_desk.wait_for_timeout(2000)
        await page_desk.screenshot(path='/home/jules/verification/edit_desktop_final.png')

        # Mobile
        page_mob = await browser.new_page(viewport={'width': 390, 'height': 844})
        await page_mob.goto('http://localhost:3000/gaza.html')
        await page_mob.wait_for_timeout(2000)
        await page_mob.screenshot(path='/home/jules/verification/gaza_mobile_final.png')

        # Open mobile drawer
        await page_mob.click('#mobile-menu-btn')
        await page_mob.wait_for_timeout(1000)
        await page_mob.screenshot(path='/home/jules/verification/mobile_drawer_final.png')

        await browser.close()

asyncio.run(run())
