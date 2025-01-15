import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { FiArrowLeft, FiList, FiX, FiMapPin, FiClock, FiSun, FiMoon, FiPackage, FiAlertTriangle, FiPhone, FiMenu } from 'react-icons/fi';
import mapboxgl from 'mapbox-gl';
import { motion, AnimatePresence } from 'framer-motion';

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
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="bg-white dark:bg-gray-700 rounded-lg shadow-sm p-4 
        border border-gray-100 dark:border-gray-600 transition-all duration-200"
    >
      <div className="flex items-center gap-4">
        <div 
          className={`w-10 h-10 rounded-full flex items-center justify-center 
            text-white font-medium shadow-sm transition-colors ${
            isFirst ? 'bg-emerald-500 dark:bg-emerald-600' : 
            isLast ? 'bg-red-500 dark:bg-red-600' : 
            'bg-blue-500 dark:bg-blue-600'
          }`}
        >
          {index + 1}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 dark:text-white truncate">
            {shop.shop_details.shop_name}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 truncate">
            {shop.shop_details.address}
          </p>
          <div className="flex items-center mt-2 text-xs text-gray-400 dark:text-gray-500">
            <FiPhone className="w-3 h-3 mr-1" />
            <span>{shop.shop_details.phone || 'N/A'}</span>
          </div>
        </div>
      </div>
    </motion.div>
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
      {/* Header với thiết kế mới */}
      <div className="bg-white dark:bg-gray-800 shadow-sm px-6 py-4 flex items-center justify-between transition-colors">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-all duration-200 
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
            aria-label="Back"
          >
            <FiArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>

          {route && (
            <div className="flex flex-col">
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {route.route_code}
                </h1>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  getStatusColor(route.status)
                }`}>
                  {route.status.charAt(0).toUpperCase() + route.status.slice(1)}
                </span>
              </div>
              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mt-1 space-x-4">
                <div className="flex items-center">
                  <FiMapPin className="w-4 h-4 mr-1.5" />
                  <span>{route.distance.toFixed(2)} km</span>
                </div>
                <div className="flex items-center">
                  <FiClock className="w-4 h-4 mr-1.5" />
                  <span>~{Math.ceil(route.distance * 3)} mins</span>
                </div>
                <div className="flex items-center">
                  <FiPackage className="w-4 h-4 mr-1.5" />
                  <span>{route.shops.length} stops</span>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Dark mode toggle với animation */}
          <button
            onClick={toggleDarkMode}
            className="p-2.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 
              transition-all duration-200 focus:outline-none focus:ring-2 
              focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
            aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            <motion.div
              initial={false}
              animate={{ rotate: isDarkMode ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              {isDarkMode ? (
                <FiSun className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              ) : (
                <FiMoon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              )}
            </motion.div>
          </button>

          {/* Mobile sidebar toggle */}
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className="md:hidden p-2.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 
              transition-all duration-200 focus:outline-none focus:ring-2 
              focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
            aria-label="Toggle stops list"
          >
            <FiList className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
        </div>
      </div>

      {/* Main Content với Golden Ratio (1.618) */}
      <div className="flex-1 flex">
        {/* Sidebar - Desktop */}
        <div className="hidden md:block w-[382px] bg-white dark:bg-gray-800 shadow-lg 
          overflow-y-auto transition-colors border-r border-gray-200 dark:border-gray-700">
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white flex items-center">
              <FiMapPin className="w-5 h-5 mr-2 text-blue-500" />
              Stops ({route?.shops?.length || 0})
            </h2>
            <div className="space-y-4">
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

        {/* Sidebar - Mobile với animation */}
        <AnimatePresence>
          {showSidebar && (
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute inset-0 z-20 md:hidden"
            >
              <div className="h-full bg-white dark:bg-gray-800 overflow-y-auto">
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                      <FiMapPin className="w-5 h-5 mr-2 text-blue-500" />
                      Stops ({route?.shops?.length || 0})
                    </h2>
                    <button
                      onClick={() => setShowSidebar(false)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full
                        transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <FiX className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                    </button>
                  </div>
                  <div className="space-y-4">
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
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading State với animation đẹp hơn */}
        {loading && (
          <div className="absolute inset-0 z-30 flex items-center justify-center 
            bg-white/75 dark:bg-gray-900/75 backdrop-blur-sm transition-colors">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full"
            />
          </div>
        )}

        {/* Error State với thiết kế mới */}
        {error && (
          <div className="absolute inset-0 z-30 flex items-center justify-center 
            bg-white/75 dark:bg-gray-900/75 backdrop-blur-sm transition-colors">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-xl max-w-sm mx-4"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full 
                  flex items-center justify-center mx-auto mb-4">
                  <FiAlertTriangle className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  An error occurred
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">{error}</p>
                <button
                  onClick={() => navigate(-1)}
                  className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 
                    text-white rounded-lg transition-colors focus:outline-none 
                    focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 
                    dark:focus:ring-offset-gray-800"
                  aria-label="Go back to previous page"
                >
                  Go Back
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

// Helper function để lấy màu status
const getStatusColor = (status) => {
  const colors = {
    pending: 'bg-yellow-100 text-yellow-800',
    assigned: 'bg-blue-100 text-blue-800',
    delivering: 'bg-purple-100 text-purple-800',
    delivered: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
    cancelled: 'bg-gray-100 text-gray-800'
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

export default DeliveryMap; 