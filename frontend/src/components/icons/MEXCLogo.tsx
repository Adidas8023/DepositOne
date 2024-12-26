import React from 'react';

const MEXCLogo: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 2500 2500" {...props}>
    <path fill="#3156AA" d="M2459.7,1566.6l-540.6-937.7c-118.5-195.5-407.5-197.5-521.9,8.3l-567.6,975.2    c-106,178.8,25,403.3,237.1,403.3H2204C2418.1,2015.7,2578.2,1784.9,2459.7,1566.6z" />
    <path fill="#1972E2" d="M1680,1639.4l-33.3-58.2c-31.2-54.1-99.8-170.5-99.8-170.5l-457.4-794.3C971,439.7,690.3,425.1,571.8,647.6    L39.5,1568.7c-110.2,193.4,20.8,444.9,259.9,447h1131.1h482.4h286.9C1906.7,2017.8,1813.1,1866,1680,1639.4L1680,1639.4z" />
    <path fill="url(#mexc-gradient)" d="M1680.1,1639.4l-33.3-58.2c-31.2-54.1-99.8-170.5-99.8-170.5l-295.3-519.8l-424.2,723.6    c-106,178.8,25,403.4,237,403.4h363.9h482.4h289C1904.6,2015.7,1813.1,1866,1680.1,1639.4L1680.1,1639.4z" />
    <defs>
      <linearGradient id="mexc-gradient" x1="703.637" y1="1286.233" x2="1935.647" y2="1770.663" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#264CA2" stopOpacity="0" />
        <stop offset="1" stopColor="#234588" />
      </linearGradient>
    </defs>
  </svg>
);

export default MEXCLogo; 