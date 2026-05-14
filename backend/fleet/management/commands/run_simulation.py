import time
import random
import requests
import os
from django.core.management.base import BaseCommand
from django.contrib.gis.geos import Point
from fleet.models import Carro

BOUNDS = {
    "min_lat": -28.00,
    "max_lat": -27.30,
    "min_lon": -48.75,
    "max_lon": -48.35
}

class Command(BaseCommand):
    help = 'Simula movimento dos carros e consulta clima'

    def handle(self, *args, **kwargs):
        intervalo = int(os.getenv('UPDATE_INTERVAL', 60))
        self.stdout.write(self.style.SUCCESS(f'Iniciando simulação (Intervalo: {intervalo}s)'))

        while True:
            carros = Carro.objects.all()
            for carro in carros:
                posicao_valida = False
                tentativas = 0
                
                while not posicao_valida and tentativas < 10:
                    nova_lon = carro.posicao.x + random.uniform(-0.005, 0.005)
                    nova_lat = carro.posicao.y + random.uniform(-0.005, 0.005)
                    
                    if BOUNDS["min_lat"] <= nova_lat <= BOUNDS["max_lat"] and \
                       BOUNDS["min_lon"] <= nova_lon <= BOUNDS["max_lon"]:
                        
                        carro.posicao = Point(nova_lon, nova_lat)
                        posicao_valida = True
                    
                    tentativas += 1

                if posicao_valida:
                    carro.status = random.choices(['funcionando', 'problema'], weights=[0.98, 0.02])[0]
                    
                    try:
                        url = f"https://api.open-meteo.com/v1/forecast?latitude={nova_lat}&longitude={nova_lon}&current=temperature_2m"
                        response = requests.get(url, timeout=5)
                        if response.status_code == 200:
                            carro.ultima_previsao_tempo = response.json()['current']['temperature_2m']
                            self.stdout.write(f"Carro {carro.placa} movido ({tentativas}t): {carro.ultima_previsao_tempo}C")
                    except Exception as e:
                        self.stdout.write(self.style.ERROR(f"Erro clima {carro.placa}: {e}"))
                    
                    carro.save()
                else:
                    self.stdout.write(self.style.WARNING(f"Carro {carro.placa} ignorado (fora do limite ou no mar)."))

            self.stdout.write(self.style.SUCCESS("Ciclo concluído. Aguardando..."))
            time.sleep(intervalo)