from rest_framework import serializers
from .models import Carro
from django.contrib.gis.geos import Point
from .services import OpenMeteoService


class CarroSerializer(serializers.ModelSerializer):
    latitude = serializers.FloatField(write_only=True)
    longitude = serializers.FloatField(write_only=True)

    lat_display = serializers.FloatField(
        source='posicao.y',
        read_only=True
    )

    lon_display = serializers.FloatField(
        source='posicao.x',
        read_only=True
    )

    class Meta:
        model = Carro

        fields = [
            'id',
            'placa',
            'modelo',
            'status',
            'latitude',
            'longitude',
            'lat_display',
            'lon_display',
            'ultima_previsao_tempo'
        ]

    def create(self, validated_data):
        lat = validated_data.pop('latitude')
        lon = validated_data.pop('longitude')

        validated_data['posicao'] = Point(lon, lat)

        validated_data['ultima_previsao_tempo'] = (
            OpenMeteoService.fetch_temp(lat, lon)
        )

        return super().create(validated_data)

    def update(self, instance, validated_data):

        if 'latitude' in validated_data and 'longitude' in validated_data:

            lat = validated_data.pop('latitude')
            lon = validated_data.pop('longitude')

            instance.posicao = Point(lon, lat)

            instance.ultima_previsao_tempo = (
                OpenMeteoService.fetch_temp(lat, lon)
            )

        return super().update(instance, validated_data)