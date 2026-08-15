import asyncio
import os
import subprocess
import time
from playwright.async_api import async_playwright

async def run_verification():
    # Start python http server on port 3000
    server_process = subprocess.Popen(
        ['python3', '-m', 'http.server', '3000', '--bind', '0.0.0.0'],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL
    )
    time.sleep(1.5)

    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)

            # 1. Test Desktop View (1280x800)
            desktop_context = await browser.new_context(viewport={"width": 1280, "height": 800})
            desktop_page = await desktop_context.new_page()

            # Open westbank page with direct deep link to West Bank martyr wb1 (Shireen Abu Akleh)
            await desktop_page.goto("http://localhost:3000/westbank.html?person=wb1", wait_until="domcontentloaded")
            await desktop_page.wait_for_selector("#person-profile-modal", state="visible", timeout=10000)

            # Check primary name and badge elements
            modal_visible = await desktop_page.is_visible("#person-profile-modal")
            assert modal_visible, "Profile modal should be visible on deep link"

            name_text = await desktop_page.inner_text("#person-profile-modal h2")
            assert "شيرين أبو عاقلة" in name_text or "Shireen" in name_text, f"Unexpected title text: {name_text}"

            # Take Desktop Screenshot
            os.makedirs("verification", exist_ok=True)
            await desktop_page.screenshot(path="verification/person_profile_desktop.png")
            print("Desktop screenshot saved: verification/person_profile_desktop.png")

            # Test Copy Link Button
            copy_btn = await desktop_page.query_selector("#person-copy-link-btn")
            assert copy_btn is not None, "Copy link button should exist"

            # Close Modal via Esc key
            await desktop_page.keyboard.press("Escape")
            await desktop_page.wait_for_selector("#person-profile-modal", state="hidden", timeout=5000)

            url_after_close = desktop_page.url
            assert "person=" not in url_after_close, "URL parameter 'person' should be cleared after closing modal"
            print("Esc key closed modal and updated URL successfully.")

            await desktop_context.close()

            # 2. Test Mobile View (375x812)
            mobile_context = await browser.new_context(viewport={"width": 375, "height": 812})
            mobile_page = await mobile_context.new_page()

            # Open journalists page with direct deep link
            await mobile_page.goto("http://localhost:3000/journalists.html?person=wb2", wait_until="domcontentloaded")
            await mobile_page.wait_for_selector("#person-profile-modal", state="visible", timeout=10000)

            # Take Mobile Screenshot
            await mobile_page.screenshot(path="verification/person_profile_mobile.png")
            print("Mobile screenshot saved: verification/person_profile_mobile.png")

            # Check Close Button Click
            close_btn = await mobile_page.query_selector("#person-profile-close")
            assert close_btn is not None, "Close button should exist"
            await close_btn.click()
            await mobile_page.wait_for_selector("#person-profile-modal", state="hidden", timeout=5000)

            print("Mobile close button works successfully.")
            await mobile_context.close()
            await browser.close()

    finally:
        server_process.terminate()

if __name__ == "__main__":
    asyncio.run(run_verification())
