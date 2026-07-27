from playwright.sync_api import sync_playwright

def verify_app():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            print("Going to http://localhost:3000...")
            page.goto("http://localhost:3000")
            page.wait_for_timeout(2000)

            # Take screenshot of the main landing view
            page.screenshot(path="verification/landing_view.png")
            print("Landing page screenshot taken successfully!")

            # Click Statistics tab
            print("Clicking Stats tab...")
            page.click("#tab-stats")
            page.wait_for_timeout(2000)
            page.screenshot(path="verification/stats_view.png")
            print("Stats page screenshot taken successfully!")

            # Click Solidarity Certificate tab
            print("Clicking Solidarity Certificate tab...")
            page.click("#tab-solidarity-cert")
            page.wait_for_timeout(2000)
            page.screenshot(path="verification/solidarity_cert_view.png")
            print("Solidarity certificate page screenshot taken successfully!")

        except Exception as e:
            print(f"Error during verification: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_app()
