import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { FiArrowLeft } from 'react-icons/fi';
import mapboxgl from 'mapbox-gl';

// Thêm Mapbox access token
mapboxgl.accessToken = 'pk.eyJ1Ijoic2hpZW5nIiwiYSI6ImNtNTkwY3R4ZDNybHUyanNmM2hoaDAxa2oifQ.ZUcv_MrKBuTc2lZ2jyofmQ';

const DeliveryMap = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const mapRef = useRef(null);
  const mapContainerRef = useRef(null);
  const [route, setRoute] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchRouteData();
  }, [id]);

  useEffect(() => {
    if (route && mapContainerRef.current && !mapRef.current) {
      initializeMap(route);
    }
  }, [route]);

  const fetchRouteData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5000/api/routes/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        console.log('Full route data:', response.data.data);
        console.log('Shops data:', response.data.data.shops);
        setRoute(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching route:', error);
      setError(error.response?.data?.message || 'Failed to load route data');
      toast.error('Failed to load route data');
    } finally {
      setLoading(false);
    }
  };

  const initializeMap = async (routeData) => {
    try {
      if (!routeData.shops || routeData.shops.length < 2) return;

      // Log thông tin shops
      console.log('Shops information:');
      routeData.shops.forEach((shop, index) => {
        console.log(`Shop ${index + 1}:`, {
          name: shop.shop_details.shop_name,
          shop_id: shop.shop_details.shop_id,
          latitude: shop.shop_details.latitude,
          longitude: shop.shop_details.longitude,
          address: shop.shop_details.address
        });
      });

      // Tạo map instance
      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: 'mapbox://styles/mapbox/streets-v11',
        center: [routeData.shops[0].shop_details.longitude, routeData.shops[0].shop_details.latitude],
        zoom: 13
      });

      mapRef.current = map;

      // Đợi map load xong
      map.on('load', async () => {
        // Tạo array của coordinates
        const coordinates = routeData.shops.map(shop => [
          shop.shop_details.longitude,
          shop.shop_details.latitude
        ]);

        // Thêm markers cho mỗi shop
        routeData.shops.forEach((shop, index) => {
          // Tạo custom marker element
          const el = document.createElement('div');
          el.className = 'marker';
          el.style.backgroundColor = 'white';
          el.style.width = '24px';
          el.style.height = '24px';
          el.style.borderRadius = '50%';
          el.style.border = '2px solid #00A8E8';
          el.style.display = 'flex';
          el.style.alignItems = 'center';
          el.style.justifyContent = 'center';
          el.style.color = '#00A8E8';
          el.innerHTML = `${index + 1}`;

          // Thêm marker vào map
          new mapboxgl.Marker(el)
            .setLngLat([shop.shop_details.longitude, shop.shop_details.latitude])
            .addTo(map);
        });

        // Lấy route directions từ Mapbox API
        const query = await fetch(
          `https://api.mapbox.com/directions/v5/mapbox/driving/${coordinates.map(coord => coord.join(',')).join(';')}?geometries=geojson&access_token=${mapboxgl.accessToken}`
        );
        const json = await query.json();

        // Thêm route line vào map
        map.addLayer({
          id: 'route',
          type: 'line',
          source: {
            type: 'geojson',
            data: {
              type: 'Feature',
              properties: {},
              geometry: json.routes[0].geometry
            }
          },
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': '#00A8E8',
            'line-width': 4
          }
        });

        // Fit map để hiển thị toàn bộ route
        const bounds = new mapboxgl.LngLatBounds();
        coordinates.forEach(coord => bounds.extend(coord));
        map.fitBounds(bounds, { padding: 50 });
      });
    } catch (error) {
      console.error('Error initializing map:', error);
      setError('Failed to initialize map');
      toast.error('Failed to initialize map');
    }
  };

  return (
    <div className="h-screen flex flex-col">
      <div className="bg-white shadow-sm p-4 flex items-center">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 hover:text-blue-600 transition-colors"
        >
          <FiArrowLeft className="mr-2" />
          Back
        </button>
        {route && (
          <div className="ml-4">
            <span className="font-medium">{route.route_code}</span>
            <span className="ml-2 text-gray-500">{route.distance.toFixed(2)} km</span>
          </div>
        )}
      </div>
      <div ref={mapContainerRef} className="flex-1" />
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75">
          <div className="text-red-500 text-center">
            <p className="mb-4">{error}</p>
            <button
              onClick={() => navigate(-1)}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Go Back
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryMap; 