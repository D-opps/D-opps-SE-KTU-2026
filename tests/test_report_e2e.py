import pytest
import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

# Перевірте, чи у вашому App.tsx роут звучить саме як /report/ чи можливо /reports/
REPORT_URL = "http://localhost:5173/report/product/42"

@pytest.fixture(scope="function")
def authorized_clean_driver():
    """Створює чистий браузер та безпечно інжектує токен до старту React-компонентів"""
    options = webdriver.ChromeOptions()
    options.add_argument("--headless=new")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    
    driver = webdriver.Chrome(options=options)
    
    # КРОК А: Відкриваємо сторінку (вона може спочатку подумати, що ми не авторизовані)
    driver.get(REPORT_URL)
    
    # КРОК Б: Швидко записуємо токен в localStorage цього домену
    driver.execute_script("localStorage.setItem('accessToken', 'mock-report-user-token-777');")
    
    # КРОК В: Миттєво оновлюємо сторінку. Тепер React завантажується, бачачи токен з першої мілісекунди
    driver.execute_script("window.location.reload();")
    
    yield driver
    driver.quit()


def test_submit_complaint_flow(authorized_clean_driver):
    driver = authorized_clean_driver
    wait = WebDriverWait(driver, 10)

    print("\n[STEP 1] Динамічна ін'єкція моку для перехоплення Axios-посту на /api/reports/...")
    # Ставимо перехоплювач прямо в поточну сесію вікна
    mock_report_api_js = """
    (function() {
        const origOpen = XMLHttpRequest.prototype.open;
        XMLHttpRequest.prototype.open = function(method, url) {
            if (url && url.includes('/api/reports/')) {
                this.addEventListener('load', function() {
                    Object.defineProperty(this, 'status', { writable: true, value: 201 });
                    Object.defineProperty(this, 'responseText', { writable: true, value: '{"id": 1, "success": true}' });
                    Object.defineProperty(this, 'response', { writable: true, value: {"id": 1, "success": true} });
                });
            }
            return origOpen.apply(this, arguments);
        };
    })();
    """
    driver.execute_script(mock_report_api_js)

    print("[STEP 2] Очікування повного завантаження DOM та валідація сторінки...")
    try:
        # Чекаємо на головний заголовок форми "Complain?"
        header_title = wait.until(EC.visibility_of_element_located((By.XPATH, "//h2[contains(text(), 'Complain?')]")))
        print("  -> Сторінку скарги успішно завантажено!")
    except Exception as e:
        # Якщо знову впаде — ми побачимо, де саме знаходився браузер (можливо, на /login)
        print(f"[DEBUG INFO] Поточний URL браузера при падінні: {driver.current_url}")
        driver.save_screenshot("report_timeout_debug.png")
        raise e

    print("[STEP 3] Вибір причини скарги (Fraud)...")
    # Шукаємо блок з текстом "Fraud"
    fraud_option = wait.until(EC.element_to_be_clickable((By.XPATH, "//span[contains(text(), 'Fraud')]/ancestor::div[contains(@class, 'cursor-pointer')]")))
    
    # Клікаємо через JavaScript, щоб уникнути будь-яких ElementClickIntercepted помилок
    driver.execute_script("arguments[0].click();", fraud_option)
    print("  -> Причину 'Fraud' обрано.")

    print("[STEP 4] Заповнення текстового поля деталей...")
    textarea = driver.find_element(By.TAG_NAME, "textarea")
    textarea.send_keys("Автоматичний тест: скарга на фейковий товар.")

    print("[STEP 5] Надсилання скарги через JS-клік...")
    submit_btn = driver.find_element(By.XPATH, "//button[@type='submit']")
    
    # Клікаємо на сабміт
    driver.execute_script("arguments[0].click();", submit_btn)

    # Очікуємо відпрацювання анімації або редиректу (кнопка має зникнути з DOM)
    wait.until(EC.staleness_of(submit_btn))
    print("  -> Тест успішно пройдено! Скаргу надіслано.")


def test_cancel_complaint_navigation(authorized_clean_driver):
    driver = authorized_clean_driver
    wait = WebDriverWait(driver, 10)

    print("\n[STEP 1] Перевірка кнопки скасування скарги...")
    try:
        cancel_btn = wait.until(EC.element_to_be_clickable((By.XPATH, "//button[contains(text(), 'I changed my mind')]")))
        driver.execute_script("arguments[0].click();", cancel_btn)
        wait.until(EC.staleness_of(cancel_btn))
        print("  -> Повернення назад працює коректно.")
    except Exception as e:
        print(f"[DEBUG INFO] Поточний URL при падінні: {driver.current_url}")
        raise e