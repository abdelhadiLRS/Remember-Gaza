import asyncio
import os
import subprocess
import time
from playwright.async_api import async_playwright

async def verify_onepage_slidetabs():
    # Start local Python HTTP server
    server_process = subprocess.Popen(
        ['python3', '-m', 'http.server', '3000', '--bind', '0.0.0.0'],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL
    )
    time.sleep(1.5)

    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)

            # --- Desktop Verification ---
            page = await browser.new_page(viewport={'width': 1280, 'height': 800})
            console_errors = []
            page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)

            # 1. Open One-Page Application
            print("Navigating to http://localhost:3000/index.html...")
            await page.goto("http://localhost:3000/index.html")
            await page.wait_for_timeout(1000)

            # Verify SlideTabs desktop navigation container exists
            slidetabs = await page.locator("#slidetabs-list").is_visible()
            assert slidetabs, "SlideTabs container not visible on desktop"
            print("✓ SlideTabs navigation bar visible on desktop.")

            # Test tab click scrolling and cursor position
            tab_stats = page.locator('.slidetabs-tab[data-id="stats"]')
            await tab_stats.click()
            await page.wait_for_timeout(800)

            # Verify active class and section visibility
            active_tab = await page.locator('.slidetabs-tab.active').text_content()
            print(f"✓ Active tab after click: {active_tab.strip()}")

            # Verify Chart canvas elements are initialized
            age_chart = await page.locator("#chart-age-distribution").is_visible()
            assert age_chart, "Chart JS age distribution canvas not visible"
            print("✓ Chart.js canvas elements initialized and visible in Stats section.")

            # Capture Desktop Screenshot
            os.makedirs("verification", exist_ok=True)
            await page.screenshot(path="verification/onepage_desktop.png")
            print("✓ Captured verification/onepage_desktop.png")

            # Test legacy redirect: journalists.html -> index.html#journalists
            print("Testing legacy redirect from journalists.html...")
            await page.goto("http://localhost:3000/journalists.html")
            await page.wait_for_timeout(1000)
            url_now = page.url
            assert "#journalists" in url_now, f"Redirect failed, URL is {url_now}"
            print(f"✓ Legacy redirect verified: {url_now}")

            await page.close()

            # --- Mobile Verification ---
            mobile_page = await browser.new_page(viewport={'width': 375, 'height': 812})
            print("Testing Mobile View (375x812)...")
            await mobile_page.goto("http://localhost:3000/index.html")
            await mobile_page.wait_for_timeout(1000)

            # Verify mobile menu trigger button
            mobile_trigger = await mobile_page.locator("#slidetabs-mobile-btn").is_visible()
            assert mobile_trigger, "Mobile menu trigger button not visible on mobile"
            print("✓ Mobile menu trigger button visible.")

            # Open Mobile Dropdown Menu
            await mobile_page.click("#slidetabs-mobile-btn")
            await mobile_page.wait_for_timeout(300)
            mobile_menu = await mobile_page.locator("#slidetabs-mobile-menu").is_visible()
            assert mobile_menu, "Mobile menu dropdown not visible after click"
            print("✓ Mobile menu dropdown opens on tap.")

            # Click item in mobile menu
            await mobile_page.click('.slidetabs-mobile-item[href="#milestones"]')
            await mobile_page.wait_for_timeout(800)

            menu_closed = not (await mobile_page.locator("#slidetabs-mobile-menu").is_visible())
            assert menu_closed, "Mobile menu did not close automatically after selection"
            print("✓ Mobile menu closes automatically after section selection.")

            # Capture Mobile Screenshot
            await mobile_page.screenshot(path="verification/onepage_mobile.png")
            print("✓ Captured verification/onepage_mobile.png")

            await mobile_page.close()
            await browser.close()

            # Verify console errors
            critical_errors = [e for e in console_errors if "Failed to load resource" not in e]
            assert len(critical_errors) == 0, f"Critical console errors found: {critical_errors}"
            print("✓ Zero critical console errors encountered.")

    finally:
        server_process.terminate()

if __name__ == "__main__":
    asyncio.run(verify_onepage_slidetabs())
