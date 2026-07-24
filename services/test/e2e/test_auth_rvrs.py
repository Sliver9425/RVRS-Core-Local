import unittest
import time
import os
import HtmlTestRunner
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import Select
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.chrome.service import Service

class TestRVRSAuthentication(unittest.TestCase):

    def setUp(self):
        print("\n--------------------------------------------------")
        print("Iniciando navegador Chrome...")
        options = webdriver.ChromeOptions()
        options.add_argument("--start-maximized")
        
        # Inicializa Chrome WebDriver
        self.driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)
        self.wait = WebDriverWait(self.driver, 10)
        
        # URL Base apuntando al Gateway de Nginx
        self.base_url = "http://localhost:8080"

    # ==========================================
    # TC-001: REGISTRO DE USUARIO ESTUDIANTE
    # ==========================================
    def test_01_registro_usuario_exitoso(self):
        print("Ejecutando TC-001: Registro de Usuario Estudiante...")
        driver = self.driver
        driver.get(f"{self.base_url}/register")

        print("  - Llenando formulario de registro...")
        nombre_input = self.wait.until(EC.presence_of_element_located((By.XPATH, "//input[@placeholder='Ej. Damian Quezada' or @type='text']")))
        correo_input = driver.find_element(By.XPATH, "//input[@placeholder='usuario@uce.edu.ec' or @type='email']")
        password_input = driver.find_element(By.XPATH, "//input[@placeholder='Mínimo 6 caracteres' or @type='password']")
        tipo_usuario_select = Select(driver.find_element(By.TAG_NAME, "select"))
        btn_finalizar = driver.find_element(By.XPATH, "//button[contains(text(), 'Finalizar Registro')]")

        # Generación de correo dinámico único
        timestamp = int(time.time())
        correo_dinamico = f"dquezada_{timestamp}@uce.edu.ec"

        nombre_input.clear()
        nombre_input.send_keys("Damian Quezada")
        time.sleep(1)

        correo_input.clear()
        correo_input.send_keys(correo_dinamico)
        time.sleep(1)

        password_input.clear()
        password_input.send_keys("Password123!")
        time.sleep(1)

        tipo_usuario_select.select_by_visible_text("Estudiante")
        time.sleep(1)

        print(f"  - Registrando usuario dinámico: {correo_dinamico}")
        btn_finalizar.click()

        # 🔔 MANEJO DE ALERTA DE JAVASCRIPT
        print("  - Esperando y aceptando alerta modal de registro...")
        try:
            self.wait.until(EC.alert_is_present())
            alert = driver.switch_to.alert
            print(f"    [Alerta Detectada]: {alert.text}")
            alert.accept() # Hace clic en 'Aceptar' / 'OK' en la alerta
        except Exception as e:
            print("    [Info]: No se presentó alerta modal o fue procesada rápidamente.")

        print("  - Validando redirección a través del Gateway...")
        self.wait.until(EC.url_changes(f"{self.base_url}/register"))
        time.sleep(2)
        print("  TC-001 Completado con éxito.")

    # ==========================================
    # TC-002: INICIO DE SESIÓN EXITOSO
    # ==========================================
    def test_02_login_exitoso(self):
        print("Ejecutando TC-002: Inicio de Sesión...")
        driver = self.driver
        driver.get(f"{self.base_url}/login")

        print("  - Llenando credenciales de acceso...")
        correo_input = self.wait.until(EC.presence_of_element_located((By.XPATH, "//input[@placeholder='usuario@uce.edu.ec' or @type='email']")))
        password_input = driver.find_element(By.XPATH, "//input[@type='password']")
        btn_entrar = driver.find_element(By.XPATH, "//button[contains(text(), 'Entrar')]")

        correo_input.clear()
        correo_input.send_keys("dquezada@uce.edu.ec")
        time.sleep(1)

        password_input.clear()
        password_input.send_keys("Password123!")
        time.sleep(1)

        print("  - Enviando formulario de Login...")
        btn_entrar.click()

        print("  - Validando respuesta del Gateway e ingreso...")
        self.wait.until(lambda d: "/login" not in d.current_url)
        time.sleep(2)
        print("  TC-002 Completado con éxito.")

    # ==========================================
    # TC-003: REDIRECCIÓN DENTRO DE LA INTERFAZ
    # ==========================================
    def test_03_redireccion_login_a_registro(self):
        print("Ejecutando TC-003: Redirección Login -> Registro...")
        driver = self.driver
        driver.get(f"{self.base_url}/login")

        print("  - Buscando enlace 'Regístrate aquí'...")
        link_registro = self.wait.until(EC.element_to_be_clickable((By.XPATH, "//a[contains(text(), 'Regístrate aquí')]")))
        time.sleep(1)
        link_registro.click()

        print("  - Verificando despliegue de la vista 'Crear Cuenta'...")
        self.wait.until(EC.presence_of_element_located((By.XPATH, "//*[contains(text(), 'Crear Cuenta')]")))
        time.sleep(2)
        print("  TC-003 Completado con éxito.")

    def tearDown(self):
        print("Cerrando navegador...")
        if self.driver:
            self.driver.quit()

if __name__ == '__main__':
    current_directory = os.path.dirname(os.path.abspath(__file__))
    reports_directory = os.path.join(current_directory, 'reports')

    print(f"\nLa carpeta de reportes se guardará en: {reports_directory}")

    runner = HtmlTestRunner.HTMLTestRunner(
        output=reports_directory,
        report_title="Informe de Pruebas Automatizadas Selenium - RVRS",
        report_name="Reporte_Pruebas_E2E",
        combine_reports=True,
        open_in_browser=False
    )
    
    unittest.main(testRunner=runner)