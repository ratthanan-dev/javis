import asyncio
from playwright.async_api import async_playwright

async def verify_gemini_settings():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={'width': 1280, 'height': 800})
        page = await context.new_page()
        
        # Navigate to J.A.R.V.I.S.
        await page.goto("http://localhost:8000", wait_until="networkidle")
        await page.wait_for_timeout(1000)

        # 1. Open Settings modal via rail or bottom profile gear
        print("Opening settings modal...")
        await page.evaluate("openSettingsModal('general')")
        await page.wait_for_timeout(600)
        await page.screenshot(path="/home/rathanan/.gemini/antigravity-ide/brain/f4c11972-346a-4df6-bf5f-f1072e3d99ad/gemini_settings_tab_general.png")
        print("Captured general tab")

        # 2. Switch to 'models' tab
        print("Switching to models tab...")
        await page.click("button[data-tab='models']")
        await page.wait_for_timeout(500)
        await page.screenshot(path="/home/rathanan/.gemini/antigravity-ide/brain/f4c11972-346a-4df6-bf5f-f1072e3d99ad/gemini_settings_tab_models.png")
        print("Captured models tab")

        # 3. Switch to 'voice' tab
        print("Switching to voice tab...")
        await page.click("button[data-tab='voice']")
        await page.wait_for_timeout(500)
        await page.screenshot(path="/home/rathanan/.gemini/antigravity-ide/brain/f4c11972-346a-4df6-bf5f-f1072e3d99ad/gemini_settings_tab_voice.png")
        print("Captured voice tab")

        # 4. Switch to 'theme' tab
        print("Switching to theme tab...")
        await page.click("button[data-tab='theme']")
        await page.wait_for_timeout(500)
        await page.screenshot(path="/home/rathanan/.gemini/antigravity-ide/brain/f4c11972-346a-4df6-bf5f-f1072e3d99ad/gemini_settings_tab_theme.png")
        print("Captured theme tab")

        # 5. Switch to 'data' tab
        print("Switching to data tab...")
        await page.click("button[data-tab='data']")
        await page.wait_for_timeout(500)
        await page.screenshot(path="/home/rathanan/.gemini/antigravity-ide/brain/f4c11972-346a-4df6-bf5f-f1072e3d99ad/gemini_settings_tab_data.png")
        print("Captured data tab")

        # 6. Close settings modal
        print("Closing settings modal...")
        await page.click(".dialog-close-btn")
        await page.wait_for_timeout(400)

        # 7. Test opening model picker popup, then clicking footer link to open models tab directly
        print("Testing model picker popup -> direct settings tab...")
        await page.click("#topbar-model-selector")
        await page.wait_for_timeout(400)
        await page.click(".model-picker-footer")
        await page.wait_for_timeout(600)
        await page.screenshot(path="/home/rathanan/.gemini/antigravity-ide/brain/f4c11972-346a-4df6-bf5f-f1072e3d99ad/gemini_settings_direct_models_tab.png")
        print("Captured direct models tab from popup")

        await browser.close()
        print("Verification completed successfully!")

if __name__ == "__main__":
    asyncio.run(verify_gemini_settings())
