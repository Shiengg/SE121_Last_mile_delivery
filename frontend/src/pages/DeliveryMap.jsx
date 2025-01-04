import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { FiArrowLeft, FiList, FiX, FiMapPin, FiClock } from 'react-icons/fi';
import mapboxgl from 'mapbox-gl';

// Thêm Mapbox access token
mapboxgl.accessToken = 'pk.eyJ1Ijoic2hpZW5nIiwiYSI6ImNtNTkwY3R4ZDNybHUyanNmM2hoaDAxa2oifQ.ZUcv_MrKBuTc2lZ2jyofmQ';

// Thêm styles cho route
const routeStyles = {
  border: {
    'line-color': '#000000',
    'line-width': 12,
    'line-opacity': 0.2
  },
  outline: {
    'line-color': '#ffffff',
    'line-width': 8,
    'line-opacity': 1
  },
  main: {
    'line-color': '#4285F4', // Màu xanh của Google Maps
    'line-width': 6,
    'line-opacity': 1
  }
};

// Thêm styles cho markers
const createMarkerElement = (index, isFirst, isLast, total) => {
  const el = document.createElement('div');
  el.className = 'marker';
  
  // Xác định màu dựa vào vị trí
  const backgroundColor = isFirst ? '#1B5E20' :  // Điểm đầu màu xanh lá đậm
                         isLast ? '#B71C1C' :    // Điểm cuối màu đỏ đậm
                         '#1976D2';              // Điểm giữa màu xanh dương

  // Style cho marker container
  Object.assign(el.style, {
    backgroundColor: 'white',
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    border: '3px solid ' + backgroundColor,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
    fontSize: '14px',
    fontWeight: 'bold',
    color: backgroundColor
  });

  el.innerHTML = `${index + 1}`;
  return el;
};

// Thêm component StopCard để hiển thị thông tin điểm dừng
const StopCard = ({ shop, index, total, isDarkMode }) => {
  const isFirst = index === 0;
  const isLast = index === total - 1;
  
  return (
    <div className="bg-white dark:bg-gray-700 rounded-lg shadow-sm p-4 mb-3 transition-colors">
      <div className="flex items-center gap-3">
        <div 
          className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium ${
            isFirst ? 'bg-[#1B5E20]' : 
            isLast ? 'bg-[#B71C1C]' : 
            'bg-[#1976D2]'
          }`}
        >
          {index + 1}
        </div>
        <div className="flex-1">
          <h3 className="font-medium text-gray-900 dark:text-white">
            {shop.shop_details.shop_name}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {shop.shop_details.address}
          </p>
        </div>
      </div>
    </div>
  );
};

// Thêm biến để lưu trữ style URLs
const MAP_STYLES = {
  light: 'mapbox://styles/mapbox/streets-v11',
  dark: 'mapbox://styles/mapbox/dark-v11'
};

const DeliveryMap = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const mapRef = useRef(null);
  const mapContainerRef = useRef(null);
  const [route, setRoute] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const routeGeometryRef = useRef(null);

  useEffect(() => {
    fetchRouteData();
  }, [id]);

  useEffect(() => {
    if (route && mapContainerRef.current && !mapRef.current) {
      initializeMap(route);
    }
  }, [route]);

  useEffect(() => {
    // Kiểm tra theme từ localStorage
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setIsDarkMode(true);
    }
  }, []);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    localStorage.setItem('theme', !isDarkMode ? 'dark' : 'light');
    
    if (mapRef.current) {
      const map = mapRef.current;
      
      // Xóa map hiện tại
      map.remove();
      
      // Tạo map mới với style mới
      const newMap = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: !isDarkMode ? MAP_STYLES.dark : MAP_STYLES.light,
        center: map.getCenter(),
        zoom: map.getZoom(),
        bearing: map.getBearing(),
        pitch: map.getPitch()
      });

      // Lưu reference mới
      mapRef.current = newMap;

      // Đợi map load xong
      newMap.on('load', () => {
        // Thêm lại route layers
        if (routeGeometryRef.current) {
          // Thêm route border
          newMap.addLayer({
            id: 'route-border',
            type: 'line',
            source: {
              type: 'geojson',
              data: routeGeometryRef.current
            },
            layout: {
              'line-join': 'round',
              'line-cap': 'round'
            },
            paint: routeStyles.border
          });

          // Thêm route outline
          newMap.addLayer({
            id: 'route-outline',
            type: 'line',
            source: {
              type: 'geojson',
              data: routeGeometryRef.current
            },
            layout: {
              'line-join': 'round',
              'line-cap': 'round'
            },
            paint: routeStyles.outline
          });

          // Thêm route main
          newMap.addLayer({
            id: 'route-main',
            type: 'line',
            source: {
              type: 'geojson',
              data: routeGeometryRef.current
            },
            layout: {
              'line-join': 'round',
              'line-cap': 'round'
            },
            paint: routeStyles.main
          });
        }

        // Thêm lại markers
        route.shops.forEach((shop, index) => {
          const isFirst = index === 0;
          const isLast = index === route.shops.length - 1;
          const el = createMarkerElement(index, isFirst, isLast, route.shops.length);
          
          new mapboxgl.Marker(el)
            .setLngLat([shop.shop_details.longitude, shop.shop_details.latitude])
            .addTo(newMap);
        });
      });
    }
  };

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

      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: isDarkMode ? 
          'mapbox://styles/mapbox/dark-v11' : 
          'mapbox://styles/mapbox/streets-v11',
        center: [routeData.shops[0].shop_details.longitude, routeData.shops[0].shop_details.latitude],
        zoom: 13
      });

      mapRef.current = map;

      map.on('load', async () => {
        const coordinates = routeData.shops.map(shop => [
          shop.shop_details.longitude,
          shop.shop_details.latitude
        ]);

        // Thêm markers với style mới
        routeData.shops.forEach((shop, index) => {
          const isFirst = index === 0;
          const isLast = index === routeData.shops.length - 1;
          const el = createMarkerElement(index, isFirst, isLast, routeData.shops.length);

          new mapboxgl.Marker(el)
            .setLngLat([shop.shop_details.longitude, shop.shop_details.latitude])
            .addTo(map);
        });

        // Lấy route directions
        const query = await fetch(
          `https://api.mapbox.com/directions/v5/mapbox/driving/${coordinates.map(coord => coord.join(',')).join(';')}?geometries=geojson&access_token=${mapboxgl.accessToken}`
        );
        const json = await query.json();

        // Lưu geometry để sử dụng khi toggle theme
        routeGeometryRef.current = {
          type: 'Feature',
          properties: {},
          geometry: json.routes[0].geometry
        };

        // Thêm các layers như cũ
        map.addLayer({
          id: 'route-border',
          type: 'line',
          source: {
            type: 'geojson',
            data: routeGeometryRef.current
          },
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: routeStyles.border
        });

        // Thêm route outline (viền trắng)
        map.addLayer({
          id: 'route-outline',
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
          paint: routeStyles.outline
        });

        // Thêm route chính
        map.addLayer({
          id: 'route-main',
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
          paint: routeStyles.main
        });

        // Fit bounds với padding lớn hơn
        const bounds = new mapboxgl.LngLatBounds();
        coordinates.forEach(coord => bounds.extend(coord));
        map.fitBounds(bounds, { 
          padding: {
            top: 100,
            bottom: 100,
            left: 100,
            right: 100
          }
        });
      });
    } catch (error) {
      console.error('Error initializing map:', error);
      setError('Failed to initialize map');
      toast.error('Failed to initialize map');
    }
  };

  return (
    <div className={`h-screen flex flex-col ${isDarkMode ? 'dark' : ''}`}>
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm px-4 py-3 flex items-center justify-between transition-colors">
        <div className="flex items-center">
          <button 
            onClick={() => navigate(-1)}
            className="mr-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            aria-label="Back"
          >
            <FiArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
          {route && (
            <div>
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                {route.route_code}
              </h1>
              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                <FiMapPin className="w-4 h-4 mr-1" />
                <span>{route.distance.toFixed(2)} km</span>
                <span className="mx-2">•</span>
                <FiClock className="w-4 h-4 mr-1" />
                <span>~{Math.ceil(route.distance * 3)} phút</span>
              </div>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {/* Dark Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Toggle dark mode"
          >
            {isDarkMode ? (
              <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
              </svg>
            )}
          </button>
          
          {/* Sidebar Toggle */}
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className="md:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            aria-label="Toggle stops list"
          >
            {showSidebar ? 
              <FiX className="w-5 h-5 text-gray-600 dark:text-gray-300" /> : 
              <FiList className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            }
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex relative">
        {/* Sidebar - Desktop */}
        <div className="hidden md:block w-96 bg-white dark:bg-gray-800 shadow-lg overflow-y-auto transition-colors">
          <div className="p-4">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Điểm dừng ({route?.shops?.length || 0})
            </h2>
            <div className="space-y-3">
              {route?.shops?.map((shop, index) => (
                <StopCard 
                  key={shop.shop_details.shop_id}
                  shop={shop}
                  index={index}
                  total={route.shops.length}
                  isDarkMode={isDarkMode}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Map Container */}
        <div ref={mapContainerRef} className="flex-1" />

        {/* Sidebar - Mobile */}
        {showSidebar && (
          <div className="absolute inset-0 z-20 md:hidden">
            <div className="h-full bg-white overflow-y-auto">
              <div className="p-4">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold">
                    Điểm dừng ({route?.shops?.length || 0})
                  </h2>
                  <button
                    onClick={() => setShowSidebar(false)}
                    className="p-2 hover:bg-gray-100 rounded-full"
                  >
                    <FiX className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
                <div className="space-y-3">
                  {route?.shops?.map((shop, index) => (
                    <StopCard 
                      key={shop.shop_details.shop_id}
                      shop={shop}
                      index={index}
                      total={route.shops.length}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loading & Error States */}
        {loading && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-white bg-opacity-75">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-white bg-opacity-75">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm mx-4">
              <div className="text-red-500 text-center">
                <p className="mb-4">{error}</p>
                <button
                  onClick={() => navigate(-1)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors w-full"
                >
                  Quay lại
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeliveryMap; 