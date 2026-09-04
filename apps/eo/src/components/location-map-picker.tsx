'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  MapPin,
  Search,
  Crosshair,
  Loader2,
  Navigation,
  Check,
  Compass,
} from 'lucide-react';
import 'leaflet/dist/leaflet.css';

interface LocationMapPickerProps {
  value: string; // The formatted address text
  onChange: (address: string, coordinates?: { lat: number; lng: number }) => void;
  initialLat?: number;
  initialLng?: number;
}

interface SearchResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

export default function LocationMapPicker({
  value,
  onChange,
  initialLat = -6.2088, // Default Jakarta Pusat
  initialLng = 106.8456,
}: LocationMapPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  const [coords, setCoords] = useState<{ lat: number; lng: number }>({
    lat: initialLat,
    lng: initialLng,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isGeolocating, setIsGeolocating] = useState(false);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // Initialize Leaflet Map
  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (!mapContainerRef.current || mapInstanceRef.current) return;

      const L = (await import('leaflet')).default;

      // Custom sleek teal SVG icon for TAQtix
      const customIcon = L.divIcon({
        className: 'custom-leaflet-marker',
        html: `
          <div style="
            position: relative;
            width: 38px;
            height: 38px;
            display: flex;
            align-items: center;
            justify-content: center;
            transform: translate(-19px, -38px);
          ">
            <div style="
              position: absolute;
              width: 14px;
              height: 14px;
              background-color: rgba(8, 180, 181, 0.4);
              border-radius: 50%;
              bottom: -2px;
              filter: blur(2px);
              animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;
            "></div>
            <div style="
              width: 36px;
              height: 36px;
              background: linear-gradient(135deg, #08B4B5 0%, #068283 100%);
              border: 3px solid #ffffff;
              border-radius: 50% 50% 50% 0;
              transform: rotate(-45deg);
              box-shadow: 0 4px 14px rgba(8, 180, 181, 0.5);
              display: flex;
              align-items: center;
              justify-content: center;
            ">
              <svg style="transform: rotate(45deg); width: 16px; height: 16px; fill: white;" viewBox="0 0 24 24">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
            </div>
          </div>
        `,
        iconSize: [38, 38],
        iconAnchor: [19, 38],
      });

      const map = L.map(mapContainerRef.current, {
        center: [coords.lat, coords.lng],
        zoom: 14,
        zoomControl: true,
      });

      // OpenStreetMap Tile Layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      // Add Draggable Marker
      const marker = L.marker([coords.lat, coords.lng], {
        icon: customIcon,
        draggable: true,
      }).addTo(map);

      marker.bindPopup('<b>Lokasi Acara</b><br />Geser pin atau klik peta untuk ubah titik.').openPopup();

      // Drag event
      marker.on('dragend', async () => {
        const position = marker.getLatLng();
        setCoords({ lat: position.lat, lng: position.lng });
        await reverseGeocode(position.lat, position.lng);
      });

      // Click map event
      map.on('click', async (e: any) => {
        const { lat, lng } = e.latlng;
        marker.setLatLng([lat, lng]);
        setCoords({ lat, lng });
        await reverseGeocode(lat, lng);
      });

      mapInstanceRef.current = map;
      markerRef.current = marker;
    }

    if (isMounted) {
      initMap();
    }

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update map center and marker when coords change from search
  const updateMapPosition = (lat: number, lng: number, addressText?: string) => {
    setCoords({ lat, lng });
    if (mapInstanceRef.current && markerRef.current) {
      mapInstanceRef.current.flyTo([lat, lng], 16, { duration: 1.2 });
      markerRef.current.setLatLng([lat, lng]);
      markerRef.current.bindPopup(`<b>Lokasi Acara</b><br />${addressText || 'Titik terpilih'}`).openPopup();
    }
  };

  // Reverse Geocode using Nominatim
  const reverseGeocode = async (lat: number, lng: number) => {
    setIsReverseGeocoding(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        {
          headers: {
            'Accept-Language': 'id,en',
          },
        }
      );
      if (res.ok) {
        const data = await res.json();
        if (data && data.display_name) {
          onChange(data.display_name, { lat, lng });
        } else {
          onChange(value || `Koordinat: ${lat.toFixed(5)}, ${lng.toFixed(5)}`, { lat, lng });
        }
      }
    } catch (err) {
      console.error('Failed to reverse geocode:', err);
    } finally {
      setIsReverseGeocoding(false);
    }
  };

  // Search Address / Venue
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setShowDropdown(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery
        )}&limit=5&countrycodes=id`,
        {
          headers: {
            'Accept-Language': 'id,en',
          },
        }
      );
      if (res.ok) {
        const data: SearchResult[] = await res.json();
        setSearchResults(data);
      }
    } catch (err) {
      console.error('Search location error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectResult = (result: SearchResult) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    updateMapPosition(lat, lng, result.display_name);
    onChange(result.display_name, { lat, lng });
    setShowDropdown(false);
    setSearchQuery('');
  };

  // Get current device geolocation
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Browser Anda tidak mendukung geolokasi GPS.');
      return;
    }
    setIsGeolocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        updateMapPosition(lat, lng);
        await reverseGeocode(lat, lng);
        setIsGeolocating(false);
      },
      (err) => {
        console.error('Geolocation error:', err);
        setIsGeolocating(false);
        alert('Gagal mengambil lokasi saat ini. Pastikan izin GPS diaktifkan.');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  return (
    <div className="space-y-3">
      {/* Search and Action Bar */}
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row gap-2 relative">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Cari gedung, venue, atau alamat (cth: Jakarta Convention Center)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSearch();
                }
              }}
              className="w-full pl-10 pr-20 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#08B4B5] focus:bg-white text-xs transition"
            />
            <button
              type="button"
              onClick={handleSearch}
              disabled={isSearching}
              className="absolute right-2 top-1.5 px-3 py-1 bg-[#08B4B5] hover:bg-[#079b9c] text-white rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
            >
              {isSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Cari'}
            </button>
          </div>

          <button
            type="button"
            onClick={handleGetCurrentLocation}
            disabled={isGeolocating}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer shrink-0"
          >
            {isGeolocating ? (
              <Loader2 className="w-4 h-4 animate-spin text-[#08B4B5]" />
            ) : (
              <Crosshair className="w-4 h-4 text-[#08B4B5]" />
            )}
            <span>Lokasi Saya (GPS)</span>
          </button>
        </div>

        {/* Search Results Dropdown */}
        {showDropdown && (
          <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-2 space-y-1 text-xs z-30">
            <div className="flex items-center justify-between px-2 py-1 border-b border-slate-100 text-[11px] text-slate-400">
              <span>Hasil Pencarian Venue/Alamat</span>
              <button
                type="button"
                onClick={() => setShowDropdown(false)}
                className="hover:text-slate-600 font-bold"
              >
                ✕ Tutup
              </button>
            </div>
            {searchResults.length === 0 ? (
              <p className="p-3 text-center text-slate-400">
                {isSearching ? 'Mencari lokasi...' : 'Tidak ada hasil ditemukan. Coba ketik nama venue lebih spesifik.'}
              </p>
            ) : (
              searchResults.map((res) => (
                <button
                  type="button"
                  key={res.place_id}
                  onClick={() => handleSelectResult(res)}
                  className="w-full text-left p-2.5 hover:bg-teal-50/70 hover:text-teal-900 rounded-lg transition flex items-start gap-2 cursor-pointer group"
                >
                  <MapPin className="w-4 h-4 text-[#08B4B5] shrink-0 mt-0.5" />
                  <div className="truncate">
                    <span className="font-semibold block text-slate-800 group-hover:text-teal-950">
                      {res.display_name.split(',')[0]}
                    </span>
                    <span className="text-[10px] text-slate-400 block truncate">
                      {res.display_name}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Leaflet Map Canvas Container */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-inner">
        <div
          ref={mapContainerRef}
          className="w-full h-72 sm:h-80 z-10 bg-slate-100"
        />

        {/* Overlay info badges */}
        <div className="absolute top-3 right-3 z-20 flex items-center gap-2">
          <div className="bg-white/90 backdrop-blur-xs border border-slate-200/80 shadow-xs px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold text-slate-700 flex items-center gap-1.5">
            <Compass className="w-3 h-3 text-[#08B4B5]" />
            <span>
              {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
            </span>
          </div>
        </div>

        {isReverseGeocoding && (
          <div className="absolute bottom-3 left-3 z-20 bg-white/95 backdrop-blur-xs border border-slate-200 shadow-md px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 flex items-center gap-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#08B4B5]" />
            <span>Mengidentifikasi alamat titik...</span>
          </div>
        )}
      </div>

      {/* Editable Address Textarea/Input */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <label className="font-bold text-slate-700 flex items-center gap-1.5">
            <Navigation className="w-3.5 h-3.5 text-[#08B4B5]" />
            <span>Alamat Lengkap / Keterangan Venue *</span>
          </label>
          <span className="text-[10px] text-slate-400">
            Dapat diedit manual untuk rincian (cth: nomor hall, lantai)
          </span>
        </div>
        <textarea
          rows={3}
          value={value}
          onChange={(e) => onChange(e.target.value, coords)}
          placeholder="Alamat akan terisi otomatis dari peta Leaflet, atau ketik langsung di sini..."
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-slate-900 placeholder-slate-400 focus:border-[#08B4B5] focus:bg-white focus:outline-none text-xs transition leading-relaxed"
        />
      </div>
    </div>
  );
}
