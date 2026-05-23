import pytest
import json
import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

DASHBOARD_URL = "http://localhost:5173/admin/reports"

@pytest.fixture(scope="function")
def admin_authorized_driver():
    """Ініціалізує браузер, вмикає збір логів консолі та додає авторизацію"""
    options = webdriver.ChromeOptions()
    options.add_argument("--headless=new")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    # Вмикаємо збір логів браузера для дебагу
    options.set_capability('goog:loggingPrefs', {'browser': 'ALL'})
    
    driver = webdriver.Chrome(options=options)
    
    # Авторизуємося через базовий URL
    driver.get("http://localhost:5173/")
    driver.execute_script("localStorage.setItem('accessToken', 'mock-admin-secure-token-111');")
    
    yield driver
    driver.quit()


def test_report_dashboard_lifecycle(admin_authorized_driver):
    driver = admin_authorized_driver
    wait = WebDriverWait(driver, 10)

    initial_reports = [
        {
            "id": 501,
            "reporter_name": "Іван Маніпулятор",
            "reporter_email": "ivan@stu.edu",
            "content_details": "Контрабандний кальян",
            "reason": "fraud",
            "description": "Продає заборонені речі в гуртожитку!",
            "status": "pending"
        }
    ]

    print("\n[STEP 1] Реєстрація стійкого перехоплювача через CDP (до завантаження сторінки)...")
    # Цей скрипт виконається в Chrome НАЙПЕРШИМ, ще до парсингу вашого React/Vite коду
    mock_api_script = f"""
    (function() {{
        // Записуємо моки в sessionStorage, якщо їх там ще немає
        if (!sessionStorage.getItem('mock_reports')) {{
            sessionStorage.setItem('mock_reports', JSON.stringify({json.dumps(initial_reports)}));
            sessionStorage.setItem('action_called', 'false');
        }}

        const origOpen = XMLHttpRequest.prototype.open;
        XMLHttpRequest.prototype.open = function(method, url) {{
            if (url && url.includes('/api/reports/')) {{
                if (method === 'GET') {{
                    this.addEventListener('load', function() {{
                        const savedData = sessionStorage.getItem('mock_reports') || '[]';
                        Object.defineProperty(this, 'status', {{ writable: true, value: 200 }});
                        Object.defineProperty(this, 'responseText', {{ writable: true, value: savedData }});
                    }});
                }}
                if (method === 'POST' && url.includes('/perform_action/')) {{
                    this.addEventListener('load', function() {{
                        sessionStorage.setItem('action_called', 'true');
                        const currentData = JSON.parse(sessionStorage.getItem('mock_reports') || '[]');
                        if (currentData.length > 0) {{
                            currentData[0].status = 'resolved';
                            sessionStorage.setItem('mock_reports', JSON.stringify(currentData));
                        }}
                        Object.defineProperty(this, 'status', {{ writable: true, value: 200 }});
                        Object.defineProperty(this, 'responseText', {{ writable: true, value: '{{"success": true}}' }});
                    }});
                }}
            }}
            return origOpen.apply(this, arguments);
        }};
    }})();
    """
    
    # Інжектуємо мок на рівні двигуна Chrome
    driver.execute_cdp_cmd("Page.addScriptToEvaluateOnNewDocument", {"source": mock_api_script})

    print("[STEP 2] Прямий перехід на сторінку Дашборду...")
    driver.get(DASHBOARD_URL)

    print("[STEP 3] Очікування елементів інтерфейсу з повним дебагом у разі помилки...")
    try:
        # Чекаємо головний заголовок сторінки
        wait.until(EC.visibility_of_element_located((By.XPATH, "//h1[contains(., 'Reports Management')]")))
    except Exception as e:
        # ======= БЛОК ГЛИБОКОЇ ДІАГНОСТИКИ СЕРЕДОВИЩА =======
        print("\n❌ БРАУЗЕР ЗАСТРЯГ! ЗБІР ДІАГНОСТИЧНИХ ДАНИХ:")
        print(f"Поточний URL в Chrome: {driver.current_url}")
        
        # 1. Зберігаємо скріншот екрана (побачимо, чи там біла сторінка, чи помилка 404)
        driver.save_screenshot("dashboard_fatal_debug.png")
        print("📸 Скріншот збережено у файл: dashboard_fatal_debug.png")
        
        # 2. Виводимо помилки з консолі браузера (наприклад, не завантажився чанк, помилка JS тощо)
        print("\n💬 ЛОГИ КОНСОЛІ БРАУЗЕРА (JS ERRORS):")
        for log in driver.get_log('browser'):
            print(f"   [{log['level']}] {log['message']}")
            
        # 3. Виводимо HTML-код, який зараз бачить Selenium
        print("\n📄 СТРУКТУРА HTML СТОРАНКИ (ПЕРШІ 500 СИМВОЛІВ):")
        print(driver.page_source[:500])
        raise e

    print("[STEP 4] Перевірка лічильника Total...")
    total_counter_xpath = "//p[text()='Total']/following-sibling::p"
    wait.until(EC.text_to_be_present_in_element((By.XPATH, total_counter_xpath), "1"))
    
    print("[STEP 5] Натискання кнопки видалення контенту...")
    remove_btn = wait.until(EC.element_to_be_clickable((By.XPATH, "//button[@title='Remove content']")))
    driver.execute_script("arguments[0].click();", remove_btn)

    print("[STEP 6] Очікування оновлення статусу...")
    wait.until(EC.visibility_of_element_located((By.XPATH, "//div[contains(., 'Handled')]")))
    print("🎉 Тест успішно пройдено!")