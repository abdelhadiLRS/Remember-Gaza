from playwright.sync_api import sync_playwright

def verify_app():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            # 1. Gaza Martyrs (index.html)
            print("Going to index.html...")
            page.goto("http://localhost:3000/index.html")
            page.wait_for_timeout(4000)
            page.screenshot(path="verification/landing_view.png")
            print("index.html screenshot taken successfully!")

            # 2. Journalists (journalists.html)
            print("Going to journalists.html...")
            page.goto("http://localhost:3000/journalists.html")
            page.wait_for_timeout(4000)
            page.screenshot(path="verification/journalists_view.png")
            print("journalists.html screenshot taken successfully!")

            # 3. West Bank (westbank.html)
            print("Going to westbank.html...")
            page.goto("http://localhost:3000/westbank.html")
            page.wait_for_timeout(3000)
            page.screenshot(path="verification/westbank_view.png")
            print("westbank.html screenshot taken successfully!")

            # 4. Milestones (milestones.html)
            print("Going to milestones.html...")
            page.goto("http://localhost:3000/milestones.html")
            page.wait_for_timeout(4000)
            page.screenshot(path="verification/milestones_view.png")
            print("milestones.html screenshot taken successfully!")

            # 5. Stats (stats.html)
            print("Going to stats.html...")
            page.goto("http://localhost:3000/stats.html")
            page.wait_for_timeout(4000)
            page.screenshot(path="verification/stats_view.png")
            print("stats.html screenshot taken successfully!")

            # 6. Map (map.html)
            print("Going to map.html...")
            page.goto("http://localhost:3000/map.html")
            page.wait_for_timeout(5000)
            page.screenshot(path="verification/map_view.png")
            print("map.html screenshot taken successfully!")

            # 8. Mobile Viewport (index.html)
            print("Setting viewport to mobile size (390x844) on index.html...")
            page.set_viewport_size({"width": 390, "height": 844})
            page.goto("http://localhost:3000/index.html")
            page.wait_for_timeout(4000)
            page.screenshot(path="verification/mobile_landing_view.png")
            print("Mobile landing screenshot taken successfully!")

        except Exception as e:
            print(f"Error during verification: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_app()
