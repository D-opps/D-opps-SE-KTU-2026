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

    print("\n[STEP 1] Первинне відкриття сторінки для встановлення авторизації...")
    driver.get(PROFILE_URL)
    
    # Записуємо токен авторизації, щоб додаток не редиректив на /login
    driver.execute_script("localStorage.setItem('accessToken', 'mock-profile-token-999');")

    print("[STEP 2] Налаштування підміни мережі через дебаг-протокол (без f-string)...")
    
    mock_response = {
        "profile": {
            "first_name": "Олексій Студент",
            "role": "student",
            "email": "alex.student@ktu.edu",
            "dormitory": 4,
            "room_number": "412",
            "photo": None
        },
        "products": [
            {
                "id": 101,
                "title": "Старий Настільний Мікроскоп",
                "price": "45.00",
                "image": "https://images.unsplash.com/photo-1516321318423-f06f85e504b3"
            }
        ]
    }

    # Чистий JS шаблон без небезпечних для Python f-рядків
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
    
    # Безпечно підставляємо згенерований JSON замість плейсхолдера
    stable_mock_js = js_template.replace("MOCK_DATA_PLACEHOLDER", json.dumps(mock_response))
    
    # Реєструємо скрипт у Chrome
    driver.execute_cdp_cmd("Page.addScriptToEvaluateOnNewDocument", {
        "source": stable_mock_js
    })

    print("[STEP 3] Чисте завантаження профілю з активованими моками...")
    driver.get(PROFILE_URL)
    wait.until(lambda d: d.execute_script("return document.readyState") == "complete")
    
    # Очікуємо, поки React виконає запит
    time.sleep(2.5)

    print("[STEP 4] Перевірка відображення даних профілю...")
    try:
        wait.until(EC.visibility_of_element_located((By.XPATH, "//h1[contains(text(), 'My Profile')]")))
        
        name_element = wait.until(EC.visibility_of_element_located((By.XPATH, "//h2")))
        assert "Олексій Студент" in name_element.text, f"Знайдено інше ім'я: {name_element.text}"
        print("  -> Дані профілю успішно відрендерилися!")
    except Exception as e:
        driver.save_screenshot("profile_syntax_fixed_error.png")
        raise e

    print("[STEP 5] Перевірка картки товару...")
    product_card_xpath = "//h3[contains(text(), 'Старий Настільний Мікроскоп')]"
    product_card = wait.until(EC.visibility_of_element_located((By.XPATH, product_card_xpath)))
    print("  -> Товар з'явився в списку Your Listings.")

    print("[STEP 6] Тестування модального вікна редагування...")
    edit_btn = wait.until(EC.element_to_be_clickable((By.XPATH, "//button[contains(text(), 'Edit Settings')]")))
    edit_btn.click()
    
    room_input_xpath = "//label[contains(text(), 'Room')]/following-sibling::input"
    assert wait.until(EC.visibility_of_element_located((By.XPATH, room_input_xpath))).is_displayed()
    
    close_btn = driver.find_element(By.XPATH, "//div[contains(@class, 'fixed')]//button")
    close_btn.click()
    time.sleep(0.5)

    print("[STEP 7] Тестування видалення товару...")
    product_container_xpath = f"{product_card_xpath}/ancestor::div[contains(@class, 'group')]"
    trash_btn = driver.find_element(By.XPATH, f"{product_container_xpath}//button")
    
    # Примусово робимо кнопку видимою
    driver.execute_script("arguments[0].style.opacity = '1'; arguments[0].style.display = 'block';", trash_btn)
    time.sleep(0.5)
    
    # НАДІЙНИЙ КЛІК: Використовуємо JS-клік замість звичайного trash_btn.click()
    # Це повністю вирішує проблему з ElementClickInterceptedException
    driver.execute_script("arguments[0].click();", trash_btn)
    time.sleep(0.5)
    
    # Натискаємо ОК у вікні підтвердження window.confirm
    alert = driver.switch_to.alert
    alert.accept()
    
    # Чекаємо, поки картка зникне з DOM
    wait.until(EC.staleness_of(product_card))
    assert driver.find_element(By.XPATH, "//p[contains(text(), 'No listings yet')]").is_displayed()
    print("  -> Товар успішно видалено.")