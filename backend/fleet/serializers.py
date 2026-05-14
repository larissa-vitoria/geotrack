from rest_framework import serializers
from .models import Carro
from django.contrib.gis.geos import Point
import requests

class CarroSerializer(serializers.ModelSerializer):
    latitude = serializers.FloatField(write_only=True)
    longitude = serializers.FloatField(write_only=True)
    lat_display = serializers.FloatField(source='posicao.y', read_only=True)
    lon_display = serializers.FloatField(source='posicao.x', read_only=True)

    class Meta:
        model = Carro
        fields = ['id', 'placa', 'modelo', 'status', 'latitude', 'longitude', 'lat_display', 'lon_display', 'ultima_previsao_tempo']

    def fetch_temp(self, lat, lon):
        """Helper para buscar temperatura na API"""
        try:
            url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=temperature_2m"
            r = requests.get(url, timeout=3)
            if r.status_code == 200:
                return r.json()['current']['temperature_2m']
        except Exception:
            pass
        return None

    def create(self, validated_data):
        lat = validated_data.pop('latitude')
        lon = validated_data.pop('longitude')
        
        validated_data['posicao'] = Point(lon, lat)
        validated_data['ultima_previsao_tempo'] = self.fetch_temp(lat, lon)
        
        return super().create(validated_data)

    def update(self, instance, validated_data):
        if 'latitude' in validated_data and 'longitude' in validated_data:
            lat = validated_data.pop('latitude')
            lon = validated_data.pop('longitude')
            instance.posicao = Point(lon, lat)
            instance.ultima_previsao_tempo = self.fetch_temp(lat, lon)
            
        return super().update(instance, validated_data)