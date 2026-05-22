import pytest
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

ANALYTICS_URL = "http://localhost:5173/admin/analytics"

def test_analytics_dashboard_loading_and_cards(logged_in_driver):
    """
    E2E тест: Використовує готову сесію адміна, переходить на сторінку
    аналітики платформи та валідує наявність карток з метриками.
    """
    driver = logged_in_driver
    wait = WebDriverWait(driver, 10)

    # 1. Одразу переходимо на аналітику (ми вже всередині системи!)
    driver.get(ANALYTICS_URL)
    print(f"\n[INFO] Navigated directly to Analytics page: {ANALYTICS_URL}")

    # 2. Очікуємо завантаження заголовка з AnalyticsDashboard.tsx
    try:
        page_title = wait.until(
            EC.visibility_of_element_located((By.XPATH, "//h1[contains(text(), 'Platform Growth & Statistics')]"))
        )
        print("[INFO] Analytics page verified successfully!")
    except Exception:
        driver.save_screenshot("analytics_dashboard_view_error.png")
        raise AssertionError(
            f"Не вдалося знайти заголовок аналітики. Поточний URL: {driver.current_url}. "
            "Перевір, чи правильний роут вказано в константі ANALYTICS_URL."
        )

    # 3. Перевіряємо відображення карток аналітики
    metrics_to_check = [
        "Total Residents",
        "Total Chat Rooms",
        "Marketplace Size",
        "Laundry Units",
        "Active Reports"
    ]

    print("[INFO] Validating analytical cards...")
    for metric in metrics_to_check:
        try:
            card_title = driver.find_element(By.XPATH, f"//*[contains(text(), '{metric}')]")
            assert card_title.is_displayed(), f"Картка '{metric}' невидима."
            print(f"  - Verified card: {metric}")
        except Exception:
            driver.save_screenshot(f"missing_card_{metric.replace(' ', '_')}.png")
            raise AssertionError(f"Помилка: На дашборді відсутня картка '{metric}'.")

    print("\n[SUCCESS] Analytics Dashboard Test Passed Successfully!")