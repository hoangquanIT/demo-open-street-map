import React from "react";

interface VideoPlayProps {
  name: string;
  streamUrl: string;
}

const PopupContent: React.FC<VideoPlayProps> = ({ name, streamUrl }) => {
  return (
    <div>
      <div style={{ marginBottom: 10 }}>
        <b>{name}</b>
      </div>
      <video width="320" height="240" controls>
        <source src={streamUrl} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
    </div>
  );
};

export default PopupContent;
