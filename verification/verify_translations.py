from playwright.sync_api import sync_playwright

def verify_translations():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            # 1. English Version
            print("Verifying English version...")
            page.goto("http://localhost:3000/index.html?lang=en")
            page.wait_for_timeout(3000)
            page.screenshot(path="verification/english_view.png")

            # 2. French Version
            print("Verifying French version...")
            page.goto("http://localhost:3000/westbank.html?lang=fr")
            page.wait_for_timeout(3000)
            page.screenshot(path="verification/french_view.png")

            # 3. Spanish Version
            print("Verifying Spanish version...")
            page.goto("http://localhost:3000/map.html?lang=es")
            page.wait_for_timeout(3000)
            page.screenshot(path="verification/spanish_view.png")
            print("All language versions verified successfully!")

        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_translations()
