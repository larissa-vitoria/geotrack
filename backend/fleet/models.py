from django.contrib.gis.db import models
from rest_framework import serializers

class Carro(models.Model):
    STATUS_CHOICES = [
        ('funcionando', 'Funcionando'),
        ('problema', 'Com Problema'),
    ]

    placa = models.CharField(
        max_length=7, 
        unique=True, 
        help_text="Placa do veículo (formato AAA0000 ou AAA0A00)."
    )
    modelo = models.CharField(
        max_length=50, 
        help_text="Marca e modelo do veículo (Ex: Chevrolet Tracker)."
    )
    status = models.CharField(
        max_length=20, 
        choices=STATUS_CHOICES, 
        default='funcionando',
        help_text="Status operacional atual: 'funcionando' ou 'problema'."
    )
    posicao = models.PointField(
        srid=4326,
        help_text="Representação geográfica interna (Point). Atualizado via latitude/longitude."
    )
    ultima_previsao_tempo = models.FloatField(
        null=True, 
        blank=True,
        help_text="Temperatura em Celsius capturada da API Open-Meteo."
    )
    ultima_atualizacao = models.DateTimeField(
        auto_now=True,
        help_text="Data e hora da última alteração de posição ou status."
    )
    latitude = serializers.FloatField(
        write_only=True, 
        help_text="Latitude para geolocalização. Ex: -27.5948"
    )
    longitude = serializers.FloatField(
        write_only=True, 
        help_text="Longitude para geolocalização. Ex: -48.5482"
    )

    def __str__(self):
        return f"{self.modelo} ({self.placa})"