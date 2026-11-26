import assert from "node:assert/strict";
import { Builder, WebDriver } from "selenium-webdriver";
import chrome from "selenium-webdriver/chrome";
import { LoginPage } from "../pages/LoginPage";
import { SubdireccionMenuPage } from "../pages/SubdireccionMenuPage";
import { logQaAnnotation } from "../utils/qaAnnotations";

async function testSubdireccionLogin(): Promise<void> {
  const options = new chrome.Options();
  if (process.env.HEADLESS === "true") {
    options.addArguments("--headless=new", "--no-sandbox", "--disable-dev-shm-usage");
  }

  const driver: WebDriver = await new Builder()
    .forBrowser("chrome")
    .setChromeOptions(options)
    .build();

  try {
    const loginPage = new LoginPage(driver);
    const subdireccionMenuPage = new SubdireccionMenuPage(driver);

    // Credentials from apps/backend/src/database/seeds/seed.ts
    await loginPage.login("subdireccion@ipn.mx", "Admin123!");

    // Verify redirect to /subdireccion/menu-principal and heading render
    await subdireccionMenuPage.waitUntilLoaded();

    const headingText = await subdireccionMenuPage.getHeadingText();
    assert.equal(headingText, "Menú principal");

    // Verify JWT token and Subdirección role persisted in localStorage
    const hasToken = await subdireccionMenuPage.hasAccessToken();
    assert.equal(hasToken, true, "Expected JWT access_token in localStorage");

    const storedRole = await subdireccionMenuPage.getStoredUserRole();
    assert.equal(storedRole, "Subdirección");

    logQaAnnotation("ERR-07", "Paso 1 (UI25): Saludo con nombre personal en cuenta institucional");
    logQaAnnotation("ERR-01", "Paso 2 (UI25): Validación de alineación Agenda/Solicitudes y desbordamiento horizontal en Firefox");
    logQaAnnotation("ERR-06", "Paso 3 (UI25): Selector 'Todos los espacios' en Agenda del día");

    console.log("PASS: Subdirección login E2E completed successfully.");
  } finally {
    await driver.quit();
  }
}

testSubdireccionLogin();
