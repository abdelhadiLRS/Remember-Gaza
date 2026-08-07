from playwright.sync_api import sync_playwright

def verify_app():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            print("Going to http://localhost:3000...")
            page.goto("http://localhost:3000")
            page.wait_for_timeout(3000)

            # Take screenshot of the main landing view (Gaza Souls)
            page.screenshot(path="verification/landing_view.png")
            print("Landing page screenshot taken successfully!")

            # Click Solidarity tab
            print("Clicking Solidarity tab...")
            page.click("#tab-solidarity")
            page.wait_for_timeout(3000)
            page.screenshot(path="verification/solidarity_view.png")
            print("Solidarity page screenshot taken successfully!")

            # Click Statistics tab
            print("Clicking Stats tab...")
            page.click("#tab-stats")
            page.wait_for_timeout(3000)
            page.screenshot(path="verification/stats_view.png")
            print("Stats page screenshot taken successfully!")

            # Click Map tab
            print("Clicking Map tab...")
            page.click("#tab-map")
            page.wait_for_timeout(4000) # Give extra time for map tiles and markers to render
            page.screenshot(path="verification/map_view.png")
            print("Map page screenshot taken successfully!")

            # Click Timeline / Milestones tab
            print("Clicking Milestones tab...")
            page.click("#tab-milestones")
            page.wait_for_timeout(3000)
            page.screenshot(path="verification/milestones_view.png")
            print("Milestones page screenshot taken successfully!")

        except Exception as e:
            print(f"Error during verification: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_app()
