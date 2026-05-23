import pytest
import time
import json
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

PROFILE_URL = "http://localhost:5173/profile"

def test_profile_and_listings_lifecycle(logged_in_driver):
    driver = logged_in_driver
    wait = WebDriverWait(driver, 10)

    print("\n[STEP 1] Initial page opening to set up authorization...")
    driver.get(PROFILE_URL)
    
    # Write the authorization token so the application does not redirect to /login
    driver.execute_script("localStorage.setItem('accessToken', 'mock-profile-token-999');")

    print("[STEP 2] Setting up network mocking through the debugging protocol without an f-string...")
    
    mock_response = {
        "profile": {
            "first_name": "Oleksii Student",
            "role": "student",
            "email": "alex.student@ktu.edu",
            "dormitory": 4,
            "room_number": "412",
            "photo": None
        },
        "products": [
            {
                "id": 101,
                "title": "Old Tabletop Microscope",
                "price": "45.00",
                "image": "https://images.unsplash.com/photo-1516321318423-f06f85e504b3"
            }
        ]
    }

    # Clean JS template without unsafe Python f-strings
    js_template = """
    (function() {
        const mockData = MOCK_DATA_PLACEHOLDER;
        
        if (!window.XHR_MOCK_SET) {
            window.XHR_MOCK_SET = true;
            const origOpen = XMLHttpRequest.prototype.open;
            XMLHttpRequest.prototype.open = function(method, url) {
                if (url && url.includes('/api/profile/')) {
                    this.addEventListener('load', function() {
                        Object.defineProperty(this, 'status', { writable: true, value: 200 });
                        Object.defineProperty(this, 'responseText', { writable: true, value: JSON.stringify(mockData) });
                        Object.defineProperty(this, 'response', { writable: true, value: mockData });
                    });
                }
                if (url && url.includes('/api/products/101/')) {
                    this.addEventListener('load', function() {
                        Object.defineProperty(this, 'status', { writable: true, value: 200 });
                        Object.defineProperty(this, 'responseText', { writable: true, value: '{"success": true}' });
                    });
                }
                return origOpen.apply(this, arguments);
            };
        }
    })();
    """
    
    # Safely insert the generated JSON instead of the placeholder
    stable_mock_js = js_template.replace("MOCK_DATA_PLACEHOLDER", json.dumps(mock_response))
    
    # Register the script in Chrome
    driver.execute_cdp_cmd("Page.addScriptToEvaluateOnNewDocument", {
        "source": stable_mock_js
    })

    print("[STEP 3] Clean profile loading with activated mocks...")
    driver.get(PROFILE_URL)
    wait.until(lambda d: d.execute_script("return document.readyState") == "complete")
    
    # Wait for React to execute the request
    time.sleep(2.5)

    print("[STEP 4] Checking the display of profile data...")
    try:
        wait.until(EC.visibility_of_element_located((By.XPATH, "//h1[contains(text(), 'My Profile')]")))
        
        name_element = wait.until(EC.visibility_of_element_located((By.XPATH, "//h2")))
        assert "Oleksii Student" in name_element.text, f"Different name found: {name_element.text}"
        print("  -> Profile data was rendered successfully!")
    except Exception as e:
        driver.save_screenshot("profile_syntax_fixed_error.png")
        raise e

    print("[STEP 5] Checking the product card...")
    product_card_xpath = "//h3[contains(text(), 'Old Tabletop Microscope')]"
    product_card = wait.until(EC.visibility_of_element_located((By.XPATH, product_card_xpath)))
    print("  -> The product appeared in the Your Listings list.")

    print("[STEP 6] Testing the edit modal window...")
    edit_btn = wait.until(EC.element_to_be_clickable((By.XPATH, "//button[contains(text(), 'Edit Settings')]")))
    edit_btn.click()
    
    room_input_xpath = "//label[contains(text(), 'Room')]/following-sibling::input"
    assert wait.until(EC.visibility_of_element_located((By.XPATH, room_input_xpath))).is_displayed()
    
    close_btn = driver.find_element(By.XPATH, "//div[contains(@class, 'fixed')]//button")
    close_btn.click()
    time.sleep(0.5)

    print("[STEP 7] Testing product deletion...")
    product_container_xpath = f"{product_card_xpath}/ancestor::div[contains(@class, 'group')]"
    trash_btn = driver.find_element(By.XPATH, f"{product_container_xpath}//button")
    
    # Force the button to be visible
    driver.execute_script("arguments[0].style.opacity = '1'; arguments[0].style.display = 'block';", trash_btn)
    time.sleep(0.5)
    
    # RELIABLE CLICK: Use a JS click instead of a regular trash_btn.click()
    # This completely solves the ElementClickInterceptedException problem
    driver.execute_script("arguments[0].click();", trash_btn)
    time.sleep(0.5)
    
    # Click OK in the window.confirm confirmation dialog
    alert = driver.switch_to.alert
    alert.accept()
    
    # Wait until the card disappears from the DOM
    wait.until(EC.staleness_of(product_card))
    assert driver.find_element(By.XPATH, "//p[contains(text(), 'No listings yet')]").is_displayed()
    print("  -> The product was deleted successfully.")