import time
import random
import os

from django.core.management.base import BaseCommand
from django.contrib.gis.geos import Point

from fleet.models import Carro
from fleet.services import OpenMeteoService


BOUNDS = {
    "min_lat": -29.50,
    "max_lat": -25.80,
    "min_lon": -53.90,
    "max_lon": -48.30
}


class Command(BaseCommand):

    help = 'Simula movimento dos carros e consulta clima'

    def handle(self, *args, **kwargs):

        intervalo = int(os.getenv('UPDATE_INTERVAL', 60))

        self.stdout.write(
            self.style.SUCCESS(
                f'Iniciando simulação (Intervalo: {intervalo}s)'
            )
        )

        while True:

            carros = Carro.objects.all()

            for carro in carros:

                posicao_valida = False
                tentativas = 0

                while not posicao_valida and tentativas < 10:

                    nova_lon = (
                        carro.posicao.x +
                        random.uniform(-0.005, 0.005)
                    )

                    nova_lat = (
                        carro.posicao.y +
                        random.uniform(-0.005, 0.005)
                    )

                    if (
                        BOUNDS["min_lat"] <= nova_lat <= BOUNDS["max_lat"]
                        and
                        BOUNDS["min_lon"] <= nova_lon <= BOUNDS["max_lon"]
                    ):

                        carro.posicao = Point(nova_lon, nova_lat)

                        posicao_valida = True

                    tentativas += 1

                if posicao_valida:

                    carro.status = random.choices(
                        ['funcionando', 'problema'],
                        weights=[0.98, 0.02]
                    )[0]

                    carro.ultima_previsao_tempo = (
                        OpenMeteoService.fetch_temp(
                            nova_lat,
                            nova_lon
                        )
                    )

                    self.stdout.write(
                        f"Carro {carro.placa} movido "
                        f"({tentativas}t): "
                        f"{carro.ultima_previsao_tempo}C"
                    )

                    carro.save()

                else:

                    self.stdout.write(
                        self.style.WARNING(
                            f"Carro {carro.placa} ignorado."
                        )
                    )

            self.stdout.write(
                self.style.SUCCESS(
                    "Ciclo concluído. Aguardando..."
                )
            )

            time.sleep(intervalo)