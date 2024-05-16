import React from "react";

interface ClusterPopupProps {
  cameras: any[];
  onCameraClick: (cam: any) => void;
}

const ClusterPopup = ({ cameras, onCameraClick }: ClusterPopupProps) => {
  console.log("clusterPopup");

  return (
    <ul>
      {cameras.map((cam) => (
        <li
          key={cam.id}
          id={`cam-${cam.id}`}
          onClick={() => onCameraClick(cam)}
        >
          {cam.name}
        </li>
      ))}
    </ul>
  );
};

export default ClusterPopup;
