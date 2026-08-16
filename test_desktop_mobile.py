import sys
import os
from playwright.sync_api import sync_playwright

def test_layouts():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)

        # Test Desktop Resolutions
        desktop_viewports = [
            (1024, 768, "1024x768"),
            (1280, 720, "1280x720"),
            (1366, 768, "1366x768"),
            (1440, 900, "1440x900"),
            (1600, 900, "1600x900"),
            (1920, 1080, "1920x1080")
        ]

        for w, h, name in desktop_viewports:
            page = browser.new_page(viewport={"width": w, "height": h})
            page.goto("http://localhost:3000/index.html")
            page.wait_for_timeout(1000)

            # Verify Desktop Header, Nav Tabs, Counter
            header_visible = page.is_visible("#header")
            tabs_visible = page.is_visible(".tabs-wrapper")
            drawer_btn_visible = page.is_visible("#mobile-menu-btn")

            print(f"[Desktop {name}] Header: {header_visible}, Tabs: {tabs_visible}, DrawerBtn: {drawer_btn_visible}")
            page.screenshot(path=f"desktop_{name}.png")
            page.close()

        # Test Mobile Resolutions (No regressions)
        mobile_viewports = [
            (320, 568, "320px_iPhoneSE"),
            (360, 800, "360px_AndroidSmall"),
            (390, 844, "390px_iPhone13"),
            (412, 915, "412px_Pixel6"),
            (430, 932, "430px_iPhone14ProMax")
        ]

        for w, h, name in mobile_viewports:
            page = browser.new_page(viewport={"width": w, "height": h})
            page.goto("http://localhost:3000/index.html")
            page.wait_for_timeout(1000)

            header_visible = page.is_visible("#header")
            tabs_visible = page.is_visible(".tabs-wrapper")
            drawer_btn_visible = page.is_visible("#mobile-menu-btn")
            scroll_width = page.evaluate("document.documentElement.scrollWidth")
            client_width = page.evaluate("document.documentElement.clientWidth")

            print(f"[Mobile {name}] Header: {header_visible}, Tabs Visible: {tabs_visible}, DrawerBtn: {drawer_btn_visible}, ScrollOverflow: {scroll_width > client_width}")
            page.screenshot(path=f"mobile_{name}.png")
            page.close()

        browser.close()

if __name__ == "__main__":
    test_layouts()
