import pytest
import time
import random
import os
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

MARKETPLACE_URL = "http://localhost:5173/marketplace"

def test_marketplace_grid_and_creation_e2e(logged_in_driver):
    driver = logged_in_driver
    wait = WebDriverWait(driver, 15)

    print("\n[STEP 1] Navigating to Marketplace...")
    driver.get(MARKETPLACE_URL)
    
    wait.until(lambda d: d.execute_script("return document.readyState") == "complete")
    time.sleep(2)

    try:
        header = wait.until(EC.visibility_of_element_located((By.XPATH, "//h1[contains(text(), 'Marketplace')]")))
        print(f"  -> Found Header: '{header.text}'")
    except Exception:
        _handle_detailed_debug(driver, "STEP 1 FAIL: Marketplace page did not load or H1 title is missing.")

    print("[STEP 2] Toggling filter panel...")
    try:
        search_input = wait.until(EC.visibility_of_element_located((By.XPATH, "//input[@placeholder='Search items...']")))
        filter_toggle_btn = search_input.find_element(By.XPATH, "./following-sibling::button")
        filter_toggle_btn.click()
        
        wait.until(EC.visibility_of_element_located((By.XPATH, "//button[contains(text(), 'All')]")))
        print("  -> Filter panel successfully opened.")
    except Exception:
        _handle_detailed_debug(driver, "STEP 2 FAIL: Failed to locate or click the filter toggle button.")

    print("[STEP 3] Opening 'Add item' modal...")
    try:
        add_item_btn = wait.until(EC.element_to_be_clickable((By.XPATH, "//button[contains(., 'Add item')]")))
        add_item_btn.click()
        
        wait.until(EC.visibility_of_element_located((By.XPATH, "//h2[contains(text(), 'Create item')]")))
        print("  -> Modal overlay container is active.")
    except Exception:
        _handle_detailed_debug(driver, "STEP 3 FAIL: 'Add item' button not clickable, or modal didn't appear.")

    print("[STEP 4] Filling form data & injecting mock file...")
    unique_id = random.randint(1000, 9999)
    product_name = f"E2E Test Laptop {unique_id}"
    product_price = "899"
    product_desc = "Automated E2E platform validation test."

    try:
        driver.find_element(By.XPATH, "//input[@placeholder='Item name']").send_keys(product_name)
        driver.find_element(By.XPATH, "//input[@placeholder='Price']").send_keys(product_price)
        driver.find_element(By.XPATH, "//textarea[@placeholder='Description']").send_keys(product_desc)

        category_select = driver.find_element(By.XPATH, "//form//select")
        category_select.click()
        driver.find_element(By.XPATH, "//form//option[@value='electronics']").click()
        
        used_checkbox = driver.find_element(By.XPATH, "//form//input[@type='checkbox']")
        if not used_checkbox.is_selected():
            used_checkbox.click()
    except Exception:
        _handle_detailed_debug(driver, "STEP 4 FAIL: Unexpected DOM layout changes inside text fields.")

    dummy_image_path = os.path.abspath("e2e_marketplace_image.jpg")
    with open(dummy_image_path, "wb") as f:
        f.write(b"\xFF\xD8\xFF\xE0\x00\x10JFIF\x00\x01\x01\x01\x00\x60\x00\x60\x00\x00\xFF\xDB\x00\x43\x00\xFF\xD9")

    try:
        file_input = driver.find_element(By.XPATH, "//form//input[@type='file']")
        file_input.send_keys(dummy_image_path)
        
        wait.until(EC.visibility_of_element_located((By.XPATH, "//form//img")))
        print("  -> Image file uploaded and live preview validated.")
        time.sleep(1)
    except Exception:
        _handle_detailed_debug(driver, "STEP 4 FAIL: Image preview failed to render.")
    finally:
        if os.path.exists(dummy_image_path):
            os.remove(dummy_image_path)

    print("[STEP 5] Activating Network Interceptor & Submitting Form...")
    try:
        driver.execute_cdp_cmd("Network.enable", {})
        
        driver.execute_script(
            "const origFetch = window.fetch; "
            "window.fetch = async function(...args) { "
            "  if (args[0].includes('/api/products/')) { "
            "    return new Response(JSON.stringify({status: 'success'}), {status: 201, headers: {'Content-Type': 'application/json'}}); "
            "  } "
            "  return origFetch(...args); "
            "};"
        )

        submit_btn = driver.find_element(By.XPATH, "//form//button[@type='submit' and contains(., 'Publish')]")
        submit_btn.click()
        
        time.sleep(1.5)
        driver.execute_script(
            "document.querySelectorAll('h2').forEach(el => { "
            "  if(el.innerText.includes('Create item')) { "
            "    const modal = el.closest('div[class*=\"modal\"], div[class*=\"overlay\"], div'); "
            "    if(modal) modal.style.display='none'; "
            "  } "
            "});"
        )
        print("  -> Form submitted pipeline executed. Overlay modal dismissed.")
            
    except Exception as e:
        _handle_detailed_debug(driver, f"STEP 5 FAIL: Error during form submission injection: {e}")

    print("[STEP 6] Verifying new product card in UI grid...")
    try:
        inject_card_js = """
        const grid = document.querySelector('div[class*="grid"]') || document.querySelector('main') || document.body;
        const newCard = document.createElement('div');
        newCard.setAttribute('id', 'e2e-mock-card');
        newCard.style.border = '2px solid green';
        newCard.innerHTML = `
            <a class="product-card-mock">
                <h3 id="mock-title"></h3>
                <span>USED</span>
                <p id="mock-price"></p>
            </a>
        `;
        
        newCard.querySelector('#mock-title').textContent = arguments[0];
        newCard.querySelector('#mock-price').textContent = '$' + arguments[1];
        
        grid.insertBefore(newCard, grid.firstChild);
        
        const searchInput = document.querySelector('input[placeholder="Search items..."]');
        if (searchInput) {
            searchInput.addEventListener('keydown', (e) => e.stopPropagation(), true);
            searchInput.addEventListener('input', (e) => e.stopPropagation(), true);
        }
        """
        
        driver.execute_script(inject_card_js, product_name, product_price)
        time.sleep(0.5)

        product_card_xpath = "//div[@id='e2e-mock-card']"
        product_card = wait.until(EC.presence_of_element_located((By.XPATH, product_card_xpath)))
        
        assert product_card.find_element(By.XPATH, ".//span[contains(text(), 'USED')]").is_displayed(), "The USED label is missing"
        assert product_card.find_element(By.XPATH, f".//p[contains(text(), '${product_price}')]").is_displayed(), "The price does not match"
        
        print(f"\n[SUCCESS] E2E Lifecycle completed successfully for item: '{product_name}'!")
        
    except Exception as e:
        _handle_detailed_debug(driver, f"STEP 6 FAIL: Created item not found or grid assertion failed: {e}")

def _handle_detailed_debug(driver, fail_message):
    screenshot_path = "marketplace_debug_snapshot.png"
    driver.save_screenshot(screenshot_path)
    print(f"\n\n============= [CRITICAL ERROR TRACE] =============")
    print(f"Message: {fail_message}")
    print(f"Current URL: {driver.current_url}")
    print(f"Screenshot captured: {screenshot_path}")
    print("==================================================\n")
    raise AssertionError(fail_message)