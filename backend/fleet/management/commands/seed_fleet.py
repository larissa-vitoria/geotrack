from django.core.management.base import BaseCommand
from django.contrib.gis.geos import Point
from fleet.models import Carro
import random

class Command(BaseCommand):
    help = 'Popula o banco com 20 carros distribuídos em Santa Catarina'

    def handle(self, *args, **kwargs):
        cidades_sc = [
            ("Florianópolis", -27.5948, -48.5482),
            ("Joinville", -26.3044, -48.8456),
            ("Blumenau", -26.9194, -49.0661),
            ("Chapecó", -27.1004, -52.6152),
            ("Itajaí", -26.9078, -48.6619),
            ("Criciúma", -28.6775, -49.3703),
            ("Lages", -27.8162, -50.3261),
            ("Balneário Camboriú", -26.9926, -48.6346),
            ("Jaraguá do Sul", -26.4842, -49.0844),
            ("Palhoça", -27.6478, -48.6703),
            ("São José", -27.6146, -48.6358),
            ("Brusque", -27.0969, -48.9103),
            ("Tubarao", -28.4788, -49.0069),
            ("Caçador", -26.7753, -51.0153),
            ("Concórdia", -27.2342, -52.0331),
            ("Rio do Sul", -27.2136, -49.6425),
            ("Gaspar", -26.9297, -48.9533),
            ("Indaial", -26.8900, -49.2319),
            ("Araranguá", -28.9347, -49.4939),
            ("Biguaçu", -27.4939, -48.6547),
        ]

        modelos = ["Tracker", "Hilux", "Onix", "Gol", "Corolla", "Compass"]

        if Carro.objects.exists():
            self.stdout.write(self.style.WARNING("Banco já possui dados. Pulando seed."))
            return

        for i, (cidade, lat, lon) in enumerate(cidades_sc):
            Carro.objects.create(
                placa=f"SCB{i:02d}{random.randint(10,99)}",
                modelo=random.choice(modelos),
                status='funcionando',
                posicao=Point(lon, lat),
                ultima_previsao_tempo=None
            )

        self.stdout.write(self.style.SUCCESS(f'Sucesso! 20 carros criados em SC.'))