from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page()
    page.goto("http://localhost:3000/stats.html")
    # Wait for Chart animation to finish
    page.wait_for_timeout(3000)
    # Scroll to the charts div
    page.locator("h3:has-text('لوحة الرسوم البيانية')").scroll_into_view_if_needed()
    page.wait_for_timeout(1000)
    page.screenshot(path="/home/jules/verification/charts_view.png")
    browser.close()
