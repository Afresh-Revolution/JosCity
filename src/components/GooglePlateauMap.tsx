import { useEffect, useRef, useState } from 'react';
import { Bounds, MapPin, Point } from '../api/agent';

type GoogleWindow = Window & { google?: any; josCityMapsReady?: () => void; gm_authFailure?: () => void };
let pending: Promise<any> | null = null;

function loadMaps(key: string) {
  const host = window as GoogleWindow;
  if (host.google?.maps?.Map) return Promise.resolve(host.google.maps);
  if (!key) return Promise.reject(new Error('The map is not configured yet. Place lists are still available.'));
  if (pending) return pending;
  pending = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    const timeout = window.setTimeout(() => fail(new Error('Map loading timed out. Please reload.')), 15000);
    const fail = (error: Error) => {
      clearTimeout(timeout);
      pending = null;
      script.remove();
      reject(error);
    };
    host.josCityMapsReady = () => {
      clearTimeout(timeout);
      const maps = host.google?.maps;
      if (maps?.Map) resolve(maps);
      else fail(new Error('Could not load the map. Please reload.'));
    };
    host.gm_authFailure = () => fail(new Error('The map key could not be verified.'));
    script.async = true;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&loading=async&callback=josCityMapsReady`;
    script.onerror = () => fail(new Error('Could not load the map. Check your connection.'));
    document.head.appendChild(script);
  });
  return pending;
}

function Schematic() {
  return (
    <div className="plateau-map-placeholder">
      <svg width="88" height="88" viewBox="0 0 88 88" aria-hidden="true">
        <rect x="6" y="10" width="76" height="68" rx="16" fill="currentColor" opacity="0.08" />
        <path d="M18 54l14-16 12 10 16-22 10 12" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="44" cy="36" r="8" fill="currentColor" />
        <path d="M44 44c8 10 18 18 18 26a18 18 0 0 1-36 0c0-8 10-16 18-26z" fill="currentColor" opacity="0.9" />
      </svg>
      <h2>Plateau map</h2>
      <p>Jos, Bukuru and surrounding Plateau communities.</p>
    </div>
  );
}

export type MapViewProps = {
  pins: MapPin[];
  point: Point;
  me?: Point | null;
  selection: Point | null;
  route?: { points: Point[] } | null;
  bounds: Bounds;
  onSelect: (point: Point) => void;
  apiKey?: string;
};

export default function GooglePlateauMap({ pins, point, me, selection, route, bounds, onSelect, apiKey = '' }: MapViewProps) {
  const container = useRef<HTMLDivElement>(null), map = useRef<any>(null), maps = useRef<any>(null), callback = useRef(onSelect);
  const [ready, setReady] = useState(false), [error, setError] = useState('');
  callback.current = onSelect;
  useEffect(() => {
    let alive = true, listener: any, resize: ResizeObserver | undefined;
    loadMaps(apiKey).then(api => {
      if (!alive || !container.current) return;
      maps.current = api;
      const center = { lat: point.lat, lng: point.lng };
      map.current = new api.Map(container.current, {
        center,
        zoom: 12,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        restriction: { latLngBounds: { north: bounds.maxLat, south: bounds.minLat, east: bounds.maxLng, west: bounds.minLng }, strictBounds: true },
      });
      listener = map.current.addListener('click', (e: any) => { if (e.latLng) callback.current({ lat: e.latLng.lat(), lng: e.latLng.lng() }); });
      const relayout = () => {
        if (!map.current || !maps.current) return;
        maps.current.event.trigger(map.current, 'resize');
        map.current.setCenter(center);
      };
      window.setTimeout(relayout, 80);
      resize = new ResizeObserver(relayout);
      resize.observe(container.current);
      setReady(true);
    }).catch(e => { if (alive) setError(e.message); });
    return () => {
      alive = false;
      resize?.disconnect();
      listener?.remove();
      if (map.current && maps.current) maps.current.event.clearInstanceListeners(map.current);
      map.current = null;
    };
  }, [apiKey]);
  useEffect(() => {
    if (!ready || !map.current) return;
    const path = route?.points || [];
    if (path.length > 1 && maps.current) {
      const box = new maps.current.LatLngBounds();
      path.forEach((p: Point) => box.extend({ lat: p.lat, lng: p.lng }));
      map.current.fitBounds(box, 48);
      return;
    }
    map.current.panTo({ lat: point.lat, lng: point.lng });
  }, [point, route, ready]);
  useEffect(() => {
    if (!ready || !map.current) return;
    const markers = [
      ...pins,
      ...(me ? [{ ...me, id: 'you', label: 'You' }] : []),
      ...(selection ? [{ ...selection, id: 'selected', label: 'Selected position' }] : []),
    ].map(p => new maps.current.Marker({ map: map.current, position: { lat: p.lat, lng: p.lng }, title: p.label }));
    return () => markers.forEach(m => m.setMap(null));
  }, [pins, me, selection, ready]);
  useEffect(() => {
    if (!ready || !map.current || !maps.current) return;
    const path = route?.points || [];
    if (path.length < 2) return;
    const line = new maps.current.Polyline({
      path: path.map((p: Point) => ({ lat: p.lat, lng: p.lng })),
      geodesic: true,
      strokeColor: '#2F9E66',
      strokeOpacity: 0.95,
      strokeWeight: 5,
      map: map.current,
    });
    return () => line.setMap(null);
  }, [route, ready]);
  return (
    <div className="plateau-live-map">
      {(!ready || error) && <Schematic />}
      {error && <p className="plateau-map-status" role="alert">{error}</p>}
      <div ref={container} aria-label="Plateau service area map" className="plateau-google-map" hidden={Boolean(error)} />
    </div>
  );
}
