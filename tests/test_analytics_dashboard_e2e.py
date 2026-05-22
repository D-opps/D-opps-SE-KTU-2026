import pytest
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

ANALYTICS_URL = "http://localhost:5173/admin/analytics"

def test_analytics_dashboard_loading_and_cards(logged_in_driver):
    """
    E2E тест: Використовує готову сесію адміна, переходить на сторінку
    аналітики платформи та валідує наявність карток з метриками за допомогою Explicit Waits.
    """
    driver = logged_in_driver
    # Збільшуємо час очікування до 15 секунд на випадок повільного API
    wait = WebDriverWait(driver, 15)

    # 1. Переходимо на сторінку аналітики
    driver.get(ANALYTICS_URL)
    print(f"\n[INFO] Navigated directly to Analytics page: {ANALYTICS_URL}")

    # 2. Очікуємо завантаження головного заголовка сторінки
    try:
        page_title = wait.until(
            EC.visibility_of_element_located((By.XPATH, "//h1[contains(text(), 'Platform Growth') or contains(text(), 'Statistics')]"))
        )
        print("[INFO] Analytics page verified successfully!")
    except Exception:
        driver.save_screenshot("analytics_dashboard_view_error.png")
        raise AssertionError(
            f"Can't find analytics header. Current URL: {driver.current_url}. "
            "Check if the route is correctly specified in the ANALYTICS_URL constant."
        )

    # 3. Список метрик для перевірки (використовуємо підрядки для гнучкості)
    metrics_to_check = [
        "Residents",
        "Chat",
        "Marketplace",
        "Laundry",
        "Reports"
    ]

    print("[INFO] Validating analytical cards with explicit waits...")
    for metric in metrics_to_check:
        try:
            # 🎯 Гнучкий XPath: переводить текст сторінки в нижній регістр і шукає збіг
            # Це захищає від різниці типу 'Total Chat Rooms' vs 'Chat rooms'
            xpath_selector = f"//*[contains(translate(text(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), '{metric.lower()}')]"
            
            # Чекаємо появи кожної картки окремо (вирішує проблему асинхронності API)
            card_title = wait.until(EC.visibility_of_element_located((By.XPATH, xpath_selector)))
            print(f"  - Verified card containing: '{metric}'")
        except Exception:
            driver.save_screenshot(f"missing_card_{metric}.png")
            raise AssertionError(f"Error: Missing or unloaded card containing '{metric}' on the dashboard.")

    print("[SUCCESS] All core analytics dashboard cards verified successfully!")