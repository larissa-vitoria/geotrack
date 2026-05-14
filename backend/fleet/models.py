from django.contrib.gis.db import models

class Carro(models.Model):
    STATUS_CHOICES = [
        ('funcionando', 'Funcionando'),
        ('problema', 'Com Problema'),
    ]

    placa = models.CharField(max_length=7, unique=True)
    modelo = models.CharField(max_length=50)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='funcionando')
    posicao = models.PointField(srid=4326)
    ultima_previsao_tempo = models.FloatField(null=True, blank=True)
    ultima_atualizacao = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.modelo} ({self.placa})"