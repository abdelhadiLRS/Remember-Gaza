import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)

        # Desktop Test
        page = await browser.new_page(viewport={"width": 1280, "height": 800})
        await page.goto("http://127.0.0.1:3000/index.html")
        await page.wait_for_timeout(1000)

        # Click language globe button
        lang_btn = page.locator("#language-dropdown-container > button")
        await lang_btn.click()
        await page.wait_for_timeout(500)

        # Check dropdown visibility
        menu = page.locator("#language-dropdown-menu")
        is_visible = await menu.is_visible()
        print(f"Desktop: Dropdown visible on click? {is_visible}")
        assert is_visible, "Language dropdown menu should be visible after clicking globe button"

        # Count items
        items = menu.locator(".i18n-dropdown-item")
        count = await items.count()
        print(f"Desktop: Number of language options in dropdown: {count}")
        assert count == 17, f"Expected 17 languages, found {count}"

        # Check text of items (no flags, no country icons)
        item_texts = [await items.nth(i).inner_text() for i in range(count)]
        print("Desktop: Language items:")
        for txt in item_texts:
            print("  -", txt.replace('\n', ' '))

        # Take desktop screenshot with dropdown open
        await page.screenshot(path="verification/language_dropdown_desktop.png")
        print("Saved verification/language_dropdown_desktop.png")

        # Select English
        en_item = menu.locator("button[data-lang='en']")
        await en_item.click()
        await page.wait_for_timeout(500)

        # Verify language changed to en and dir changed to ltr
        doc_dir = await page.get_attribute("html", "dir")
        doc_lang = await page.get_attribute("html", "lang")
        print(f"After selecting English: dir={doc_dir}, lang={doc_lang}")
        assert doc_dir == "ltr", f"Expected dir='ltr', got '{doc_dir}'"
        assert doc_lang == "en", f"Expected lang='en', got '{doc_lang}'"

        # Verify dropdown closed after selecting language
        is_visible = await menu.is_visible()
        print(f"Dropdown closed after language selection? {not is_visible}")
        assert not is_visible, "Dropdown should close after selecting a language"

        # Test clicking outside to close
        await lang_btn.click()
        await page.wait_for_timeout(300)
        assert await menu.is_visible(), "Dropdown should open again"

        # Click body (outside dropdown)
        await page.mouse.click(10, 10)
        await page.wait_for_timeout(300)
        is_closed_outside = not (await menu.is_visible())
        print(f"Dropdown closed after clicking outside? {is_closed_outside}")
        assert is_closed_outside, "Dropdown should close when clicking outside"

        # Switch back to Arabic
        await lang_btn.click()
        await page.wait_for_timeout(300)
        ar_item = menu.locator("button[data-lang='ar']")
        await ar_item.click()
        await page.wait_for_timeout(500)

        # Mobile Test
        mobile_page = await browser.new_page(viewport={"width": 375, "height": 812})
        await mobile_page.goto("http://127.0.0.1:3000/index.html")
        await mobile_page.wait_for_timeout(1000)

        mobile_lang_btn = mobile_page.locator("#language-dropdown-container > button")
        await mobile_lang_btn.click()
        await mobile_page.wait_for_timeout(500)

        mobile_menu = mobile_page.locator("#language-dropdown-menu")
        mobile_is_visible = await mobile_menu.is_visible()
        print(f"Mobile: Dropdown visible? {mobile_is_visible}")
        assert mobile_is_visible, "Language dropdown menu should be visible on mobile"

        # Take mobile screenshot
        await mobile_page.screenshot(path="verification/language_dropdown_mobile.png")
        print("Saved verification/language_dropdown_mobile.png")

        await browser.close()
        print("ALL TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    asyncio.run(main())
