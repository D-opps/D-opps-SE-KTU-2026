import pytest
import time
self_timeout = 10
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

NOTIFICATIONS_URL = "http://localhost:5173/notifications"

def test_notifications_page_lifecycle(logged_in_driver):
    driver = logged_in_driver
    wait = WebDriverWait(driver, self_timeout)

    print("\n[STEP 1] Налаштування універсального моку мережі (Fetch + XHR/Axios) через CDP...")
    
    mock_network_js = """
    (function() {
        const mockData = [
            {
                "id": 991,
                "notification_type": "message",
                "title": "E2E Chat Alert",
                "description": "Тестове повідомлення від Selenium",
                "target_id": "chat_xyz",
                "is_read": false,
                "created_at": new Date().toISOString()
            },
            {
                "id": 992,
                "notification_type": "event",
                "title": "E2E Event Workshop",
                "description": "Прочитана подія",
                "target_id": null,
                "is_read": true,
                "created_at": new Date().toISOString()
            }
        ];

        // 1. Мокаємо Fetch
        const origFetch = window.fetch;
        window.fetch = async function(...args) {
            if (args[0] && args[0].includes('/api/notifications/')) {
                console.log('--- MOCKING FETCH NOTIFICATIONS ---');
                return new Response(JSON.stringify(mockData), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
                });
            }
            return origFetch(...args);
        };

        // 2. Мокаємо XMLHttpRequest (для Axios)
        const open = XMLHttpRequest.prototype.open;
        XMLHttpRequest.prototype.open = function(method, url) {
            if (url && url.includes('/api/notifications/')) {
                this.addEventListener('readystatechange', function() {
                    if (this.readyState === 4) {
                        console.log('--- MOCKING XHR/AXIOS NOTIFICATIONS ---');
                        Object.defineProperty(this, 'status', { writable: true, value: 200 });
                        Object.defineProperty(this, 'responseText', { writable: true, value: JSON.stringify(mockData) });
                        Object.defineProperty(this, 'response', { writable: true, value: mockData });
                    }
                });
            }
            return open.apply(this, arguments);
        };
    })();
    """
    
    # Реєструємо скрипт в ядрі Chromium, щоб він відпрацьовував ЗАВЖДИ
    driver.execute_cdp_cmd("Page.addScriptToEvaluateOnNewDocument", {
        "source": mock_network_js
    })

    print("[STEP 2] Перехід на сторінку та підготовка localStorage...")
    driver.get(NOTIFICATIONS_URL)
    
    # Гарантуємо наявність токена, щоб Axios не падав до запиту
    driver.execute_script("localStorage.setItem('accessToken', 'mock-e2e-token-123');")
    
    # Перезавантажуємо сторінку, щоб React запустився вже з токеном та активованим моком мережі
    driver.refresh()
    wait.until(lambda d: d.execute_script("return document.readyState") == "complete")
    time.sleep(2)

    print("[STEP 3] Перевірка відображення карток сповіщень...")
    unread_card_xpath = "//h3[contains(text(), 'E2E Chat Alert')]/ancestor::div[contains(@class, 'cursor-pointer')]"
    read_card_xpath = "//h3[contains(text(), 'E2E Event Workshop')]/ancestor::div[contains(@class, 'cursor-pointer')]"
    
    try:
        unread_card = wait.until(EC.visibility_of_element_located((By.XPATH, unread_card_xpath)))
        assert "Тестове повідомлення від Selenium" in unread_card.text
        print("  -> Сповіщення успішно відрендерилися в UI!")
    except Exception as e:
        # Робимо скріншот, щоб побачити реальний стан екрана (можливо, там просто білий екран через помилку React)
        driver.save_screenshot("notifications_error_fallback.png")
        print("[ERR] Картку не знайдено. Скріншот збережено як 'notifications_error_fallback.png'")
        raise e

    print("[STEP 4] Тестування реальної фільтрації статусів...")
    try:
        unread_btn = wait.until(EC.element_to_be_clickable((By.XPATH, "//button[contains(text(), 'Unread')]")))
        unread_btn.click()
        
        wait.until(EC.invisibility_of_element_located((By.XPATH, read_card_xpath)))
        print("  -> Прочитана картка успішно зникла після фільтрації.")
        
        assert driver.find_element(By.XPATH, unread_card_xpath).is_displayed()
        print("  -> Фільтрація статусів відпрацювала коректно на рівні React State!")
        
    except Exception as e:
        pytest.fail(f"Помилка під час фільтрації: {e}")

    print("\n[SUCCESS] E2E тест сповіщень завершився успішно!")