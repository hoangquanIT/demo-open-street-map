import React, { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import "bootstrap-icons/font/bootstrap-icons.css";

import "leaflet.markercluster";
import PopupContent from "./VideoPlay";
import ReactDOM from "react-dom";
import { createRoot } from "react-dom/client";
import ClusterPopup from "./ClusterPopup";

// Create a custom icon using a div with a Bootstrap Icon class
const cameraIcon = () => {
  return L.divIcon({
    html: '<div class="custom-camera-icon"><i class="bi bi-camera-video-fill" style="font-size: 24px; color: #000;"></i></div>',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [200, 200],
  });
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
  const [clusterCameras, setClusterCameras] = useState<any[]>([]);
  const markersRef = useRef<any>(null);

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

        // const listItems = camerasInCluster
        //   .map((cam) => `<li id="cam-${cam.id}">${cam.name}</li>`)
        //   .join("");
        // const popupContent = `<ul>${listItems}</ul>`;

        setClusterCameras(camerasInCluster);

        L.popup({
          closeButton: false,
          offset: L.point(70, 45),
        })
          .setLatLng(cluster.layer.getLatLng())
          // .setContent(popupContent)
          .setContent('<div id="cluster-popup"></div>')
          .openOn(map);

        console.log("popup");

        // setTimeout(() => {
        //   camerasInCluster.forEach((cam) => {
        //     const cameraElement = document.getElementById(`cam-${cam.id}`)!;
        //     cameraElement.onclick = () => {
        //       console.log(cam.name, " clicked");

        //       const marker = markers
        //         .getLayers()
        //         .find(
        //           (m) =>
        //             m instanceof L.Marker &&
        //             m.getLatLng().lat === cam.lat &&
        //             m.getLatLng().lng === cam.lng
        //         );
        //       if (marker) {
        //         marker.openPopup();
        //         const popupContainer = document.getElementById(
        //           `popup-${cam.id}`
        //         );
        //         if (popupContainer) {
        //           ReactDOM.render(
        //             <PopupContent name={cam.name} streamUrl={cam.streamUrl} />,
        //             popupContainer
        //           );
        //         }
        //       }
        //     };
        //   });
        // }, 100);
      });
    });

    map.addLayer(markers);
    markersRef.current = markers;

    map.on("zoomstart", () => {
      map.closePopup();
    });

    return () => {
      map.removeLayer(markers);
      map.off("zoomstart");
    };
  }, [cameraData, map]);

  useEffect(() => {
    if (clusterCameras.length > 0) {
      const popupContainer = document.getElementById("cluster-popup");
      console.log(popupContainer);
      if (popupContainer) {
        const root = createRoot(popupContainer);
        root.render(
          <ClusterPopup
            cameras={clusterCameras}
            onCameraClick={(cam) => {
              const marker = markersRef.current
                .getLayers()
                .find(
                  (m: any) =>
                    m instanceof L.Marker &&
                    m.getLatLng().lat === cam.lat &&
                    m.getLatLng().lng === cam.lng
                );
              if (marker) {
                map.setView(marker.getLatLng(), map.getZoom());
                marker.openPopup();
                const popupContainer = document.getElementById(
                  `popup-${cam.id}`
                );
                if (popupContainer) {
                  const root = createRoot(popupContainer);
                  root.render(
                    <PopupContent name={cam.name} streamUrl={cam.streamUrl} />
                  );
                }
              }
            }}
          />
        );
      }

      //   clusterCameras.forEach((cam) => {
      //     const cameraElement = document.getElementById(`cam-${cam.id}`)!;
      //     console.log(cameraElement);
      //     cameraElement.addEventListener("click", () => {
      //       console.log(cam.name, " clicked");

      //       const marker = markersRef.current
      //         .getLayers()
      //         .find(
      //           (m: any) =>
      //             m instanceof L.Marker &&
      //             m.getLatLng().lat === cam.lat &&
      //             m.getLatLng().lng === cam.lng
      //         );
      //       if (marker) {
      //         map.setView(marker.getLatLng(), map.getZoom());
      //         marker.openPopup();
      //         const popupContainer = document.getElementById(`popup-${cam.id}`);
      //         if (popupContainer) {
      //           ReactDOM.render(
      //             <PopupContent name={cam.name} streamUrl={cam.streamUrl} />,
      //             popupContainer
      //           );
      //         }
      //       }
      //     });
      //   });
    }
  }, [clusterCameras, map]);

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
