# backend/fleet/tests.py
from django.test import TestCase
from django.contrib.gis.geos import Point
from unittest.mock import patch
from .models import Carro
from .services import OpenMeteoService

class GeoTrackTests(TestCase):

    def setUp(self):
        self.carro = Carro.objects.create(
            placa="TEST123",
            modelo="Teste",
            posicao=Point(-48.5482, -27.5948),
            status="funcionando"
        )

    def test_filtro_geografico_raio(self):
        """Testa se o filtro de distância do PostGIS funciona"""
        lat, lon = -27.59, -48.54
        response = self.client.get(f'/api/carros/?lat={lat}&lon={lon}&raio=10')
        self.assertEqual(len(response.data), 1)
        lat_longe, lon_longe = -26.00, -49.00
        response_longe = self.client.get(f'/api/carros/?lat={lat_longe}&lon={lon_longe}&raio=10')
        self.assertEqual(len(response_longe.data), 0)

    @patch('requests.get')
    def test_circuit_breaker_indisponibilidade(self, mock_get):
        """Testa se o Circuit Breaker abre após 3 falhas"""
        mock_get.return_value.status_code = 500
        mock_get.side_effect = Exception("API Offline")

        OpenMeteoService.failure_count = 0
        OpenMeteoService.circuit_open = False

        for _ in range(3):
            OpenMeteoService.fetch_temp(-27.59, -48.54)
        
        self.assertTrue(OpenMeteoService.circuit_open)
        temp = OpenMeteoService.fetch_temp(-27.59, -48.54)
        self.assertIsNone(temp)