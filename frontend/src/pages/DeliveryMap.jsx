/* eslint-disable no-undef */
import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { FiArrowLeft } from 'react-icons/fi';

/* global H */

const DeliveryMap = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const mapRef = useRef(null);
  const [route, setRoute] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [map, setMap] = useState(null);

  useEffect(() => {
    console.log('DeliveryMap mounted with ID:', id);
    if (!id) {
      console.error('No route ID provided');
      setError('No route ID provided');
      setLoading(false);
      return;
    }
    fetchRouteData();
  }, [id]);

  // Thêm useEffect mới để xử lý việc khởi tạo map
  useEffect(() => {
    if (route && mapRef.current && !map) {
      try {
        initializeMap(route);
      } catch (error) {
        console.error('Error initializing map:', error);
        setError('Failed to initialize map');
        toast.error('Failed to initialize map');
      }
    }
  }, [route, map]);

  const fetchRouteData = async () => {
    try {
      console.log('Fetching route data for ID:', id);
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.error('No token found');
        navigate('/login');
        return;
      }

      const response = await axios.get(`http://localhost:5000/api/routes/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('Route data received:', response.data);

      if (response.data.success) {
        setRoute(response.data.data);
      } else {
        console.error('API returned success: false');
        setError(response.data.message || 'Failed to load route data');
      }
    } catch (error) {
      console.error('Error fetching route:', error);
      setError(error.response?.data?.message || 'Failed to load route data');
      toast.error(error.response?.data?.message || 'Failed to load route data');
    } finally {
      setLoading(false);
    }
  };

  const initializeMap = (routeData) => {
    try {
      console.log('Initializing map with route data:', routeData);
      if (!routeData || !routeData.polyline || !mapRef.current) {
        console.error('Invalid route data, missing polyline, or map container not ready');
        return;
      }

      const platform = new H.service.Platform({
        apikey: process.env.REACT_APP_HERE_API_KEY || '-fNjzDS4R773cGTnnKzfLL6Q4hg9v8_johaojqXFu0U'
      });

      const defaultLayers = platform.createDefaultLayers();
      
      // Create map instance
      const newMap = new H.Map(
        mapRef.current,
        defaultLayers.vector.normal.map,
        {
          zoom: 10,
          pixelRatio: window.devicePixelRatio || 1,
          center: { lat: 0, lng: 0 } // Thêm center mặc định
        }
      );

      // Add window resize handler
      window.addEventListener('resize', () => newMap.getViewPort().resize());

      // Add map behavior
      const behavior = new H.mapevents.Behavior(new H.mapevents.MapEvents(newMap));

      // Add UI controls
      const ui = new H.ui.UI.createDefault(newMap, defaultLayers);

      // Decode and display the polyline
      const lineString = H.geo.LineString.fromFlexiblePolyline(routeData.polyline);
      const polyline = new H.map.Polyline(lineString, {
        style: {
          lineWidth: 4,
          strokeColor: '#00A8E8'
        }
      });

      // Add the polyline to the map
      newMap.addObject(polyline);

      // Set the map's viewport to cover the entire route
      newMap.getViewModel().setLookAtData({
        bounds: polyline.getBoundingBox()
      });

      // Add markers for each shop
      if (routeData.shops && Array.isArray(routeData.shops)) {
        routeData.shops.forEach((shop, index) => {
          if (shop.shop_details && shop.shop_details.latitude && shop.shop_details.longitude) {
            // Tạo SVG cho marker
            const svgMarkup = `<svg width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" fill="white" stroke="#00A8E8" stroke-width="2"/>
                <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#00A8E8" font-size="12">${index + 1}</text>
            </svg>`;

            const icon = new H.map.Icon(svgMarkup, {
                size: { w: 24, h: 24 }
            });

            const marker = new H.map.Marker(
                {
                    lat: shop.shop_details.latitude,
                    lng: shop.shop_details.longitude
                },
                { icon: icon }
            );
            
            newMap.addObject(marker);
          }
        });
        console.log('Added shop markers');
      }

      setMap(newMap);
    } catch (error) {
      console.error('Error initializing map:', error);
      throw error;
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
      <div ref={mapRef} className="flex-1" style={{ width: '100%', height: '100%' }} />
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