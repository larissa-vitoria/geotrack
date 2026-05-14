from rest_framework import viewsets
from django.contrib.gis.geos import Point
from django.contrib.gis.db.models.functions import Distance
from django.contrib.gis.measure import D
from .models import Carro
from .serializers import CarroSerializer

class CarroViewSet(viewsets.ModelViewSet):
    queryset = Carro.objects.all()
    serializer_class = CarroSerializer

    def get_queryset(self):
        queryset = Carro.objects.all()
        lat = self.request.query_params.get('lat')
        lon = self.request.query_params.get('lon')
        raio = self.request.query_params.get('raio', 100) # Padrão 100km
        status = self.request.query_params.get('status')

        if lat and lon:
            ponto = Point(float(lon), float(lat), srid=4326)
            queryset = queryset.filter(posicao__distance_lte=(ponto, D(km=float(raio))))
        
        if status:
            queryset = queryset.filter(status=status)
            
        return queryset