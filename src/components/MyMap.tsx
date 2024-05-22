import React, { useEffect, useRef } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import "bootstrap-icons/font/bootstrap-icons.css";

import "leaflet.markercluster";
import PopupContent from "./VideoPlay";
import { Root, createRoot } from "react-dom/client";

// Create a custom icon using a div with a Bootstrap Icon class
const cameraIcon = () => {
  return L.divIcon({
    html: '<div class="custom-camera-icon"><i class="bi bi-camera-video-fill" style="font-size: 24px; color: #000;"></i></div>',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [200, 200],
  });
};

const rootMap = new WeakMap<HTMLElement, Root>();

const getOrCreateRoot = (container: HTMLElement): Root => {
  if (!rootMap.has(container)) {
    const root = createRoot(container);
    rootMap.set(container, root);
    return root;
  }
  return rootMap.get(container)!;
};

// A component to handle adding markers to the map and clustering them
const MarkerCluster = ({
  cameraData,
}: {
  cameraData: {
    id: number;
    lat: number;
    lng: number;
    name: string;
    streamUrl: string;
  }[];
}) => {
  const map = useMap();
  const popupLayersRef = useRef<any[]>([]);

  useEffect(() => {
    const markers = L.markerClusterGroup({
      // When a cluster is clicked
      spiderfyOnMaxZoom: false, // Disable spiderfying
      showCoverageOnHover: false,
      zoomToBoundsOnClick: false, // Disable default zoom into bounds behavior
    });

    cameraData.forEach((camera) => {
      const marker = L.marker([camera.lat, camera.lng], { icon: cameraIcon() });

      const popupContent = `
        <div id="popup-${camera.id}" class="popup-video-play"></div>
      `;

      marker.bindPopup(popupContent);
      markers.addLayer(marker);

      // When the popup opens, render the React component inside the div
      marker.on("popupopen", () => {
        const popupContainer = document.getElementById(`popup-${camera.id}`);
        if (popupContainer) {
          const root = createRoot(popupContainer);
          root.render(
            <PopupContent name={camera.name} streamUrl={camera.streamUrl} />
          );
        }
      });
    });

    markers.on("clusterclick", (cluster) => {
      const camerasInCluster: any[] = [];
      cluster.layer.getAllChildMarkers().forEach((marker: any) => {
        const camera = cameraData.find(
          (cam) =>
            cam.lat === marker.getLatLng().lat &&
            cam.lng === marker.getLatLng().lng
        );
        if (camera) {
          camerasInCluster.push(camera);
        }
      });

      const listItems = camerasInCluster
        .map((cam) => `<li id="cam-${cam.id}">${cam.name}</li>`)
        .join("");
      const popupContent = `<ul>${listItems}</ul>`;

      const clusterPopup: L.Popup = L.popup({ closeButton: false })
        .setLatLng(cluster.layer.getLatLng())
        .setContent(popupContent);
      map.addLayer(clusterPopup);

      popupLayersRef.current.push(clusterPopup);

      const clusterPopupElement = clusterPopup.getElement();
      if (clusterPopupElement) {
        const height = clusterPopupElement.offsetHeight;
        clusterPopup.options.offset = L.point(70, height / 2); // Center vertically
        clusterPopup.update();
      }

      setTimeout(() => {
        camerasInCluster.forEach((cam) => {
          const cameraElement = document.getElementById(`cam-${cam.id}`)!;
          cameraElement.onclick = () => {
            if (clusterPopupElement) {
              const cameraPopup = L.popup({
                offset: L.point(
                  290,
                  240 - clusterPopupElement.offsetHeight / 2
                ),
              })
                .setLatLng(clusterPopup.getLatLng()!)
                .setContent(`<div id="camera-popup"></div>`);
              map.addLayer(cameraPopup);

              popupLayersRef.current.push(cameraPopup);

              const popupContainer = document.getElementById(`camera-popup`);
              if (popupContainer) {
                const root = getOrCreateRoot(popupContainer);
                // const root = createRoot(popupContainer);
                root.render(
                  <PopupContent name={cam.name} streamUrl={cam.streamUrl} />
                );
              }
            }
          };
        });
      }, 100);
    });

    map.addLayer(markers);

    map.on("zoomstart", () => {
      map.closePopup();
      popupLayersRef.current.forEach((layer: any) => map.removeLayer(layer));
      popupLayersRef.current = [];
    });

    return () => {
      map.removeLayer(markers);
      map.off("zoomstart");
    };
  }, [cameraData, map]);

  return null;
};

const MyMap: React.FC = () => {
  // Sample data for cameras
  const cameraData = [
    {
      id: 1,
      lat: 51.505,
      lng: -0.09,
      name: "Camera 1",
      streamUrl:
        "https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4",
    },
    {
      id: 2,
      lat: 51.515,
      lng: -0.1,
      name: "Camera 2",
      streamUrl:
        "https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4",
    },
    {
      id: 3,
      lat: 51.525,
      lng: -0.11,
      name: "Camera 3",
      streamUrl:
        "https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4",
    },
  ];

  return (
    <MapContainer
      center={[51.505, -0.09]}
      zoom={13}
      style={{ width: "1000px", height: "100vh" }}
    >
      <TileLayer
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap contributors"
      />
      <MarkerCluster cameraData={cameraData} />
    </MapContainer>
  );
};

export default MyMap;
