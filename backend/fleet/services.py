import time
import logging
import requests

logger = logging.getLogger(__name__)

class OpenMeteoService:
    failure_count = 0
    circuit_open = False
    last_failure_time = None

    FAILURE_LIMIT = 3
    RECOVERY_TIMEOUT = 60

    @classmethod
    def fetch_temp(cls, lat, lon):

        if cls.circuit_open:
            elapsed = time.time() - cls.last_failure_time

            if elapsed < cls.RECOVERY_TIMEOUT:
                logger.warning(
                    "Circuit breaker aberto para Open-Meteo."
                )
                return None

            cls.circuit_open = False
            cls.failure_count = 0

        try:
            url = (
                "https://api.open-meteo.com/v1/forecast"
                f"?latitude={lat}"
                f"&longitude={lon}"
                "&current=temperature_2m"
            )

            response = requests.get(url, timeout=5)
            response.raise_for_status()

            temperatura = response.json()["current"]["temperature_2m"]

            cls.failure_count = 0

            return temperatura

        except Exception as e:
            cls.failure_count += 1
            cls.last_failure_time = time.time()

            logger.error(
                f"Erro ao consultar Open-Meteo: {e}"
            )

            if cls.failure_count >= cls.FAILURE_LIMIT:
                cls.circuit_open = True

                logger.error(
                    "Circuit breaker ativado para Open-Meteo."
                )

            return None