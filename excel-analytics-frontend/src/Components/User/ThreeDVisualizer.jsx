import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { motion } from 'framer-motion';
import { FiX } from 'react-icons/fi';

const ThreeDVisualizer = ({ data, columns, xAxis, yAxis, zAxis, darkMode, onClose }) => {
  const threeContainerRef = useRef(null);

  useEffect(() => {
    if (!data || !xAxis || !yAxis || !zAxis) return;

    const container = threeContainerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Setup scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(darkMode ? 0x1f2937 : 0xffffff);

    // Setup camera
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.set(5, 5, 5);
    camera.lookAt(0, 0, 0);

    // Setup renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    // Setup controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    // Create data points
    const geometry = new THREE.SphereGeometry(0.05);
    const material = new THREE.MeshPhongMaterial({
      color: 0x6366f1,
      opacity: 0.8,
      transparent: true
    });

    // Scale data points
    const xValues = data.map(item => parseFloat(item[xAxis]));
    const yValues = data.map(item => parseFloat(item[yAxis]));
    const zValues = data.map(item => parseFloat(item[zAxis]));

    const xRange = Math.max(...xValues) - Math.min(...xValues);
    const yRange = Math.max(...yValues) - Math.min(...yValues);
    const zRange = Math.max(...zValues) - Math.min(...zValues);
    const maxRange = Math.max(xRange, yRange, zRange);
    const scale = 5 / maxRange;

    // Add data points
    data.forEach((item) => {
      const point = new THREE.Mesh(geometry, material);
      point.position.x = (parseFloat(item[xAxis]) - Math.min(...xValues)) * scale - 2.5;
      point.position.y = (parseFloat(item[yAxis]) - Math.min(...yValues)) * scale - 2.5;
      point.position.z = (parseFloat(item[zAxis]) - Math.min(...zValues)) * scale - 2.5;
      scene.add(point);
    });

    // Add grid and axes
    const gridHelper = new THREE.GridHelper(6, 10);
    scene.add(gridHelper);
    const axesHelper = new THREE.AxesHelper(3);
    scene.add(axesHelper);

    // Add axis labels
    const createLabel = (text, position) => {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.width = 256;
      canvas.height = 64;
      context.fillStyle = darkMode ? '#ffffff' : '#000000';
      context.font = '48px Arial';
      context.fillText(text, 0, 48);
      
      const texture = new THREE.CanvasTexture(canvas);
      const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
      const sprite = new THREE.Sprite(spriteMaterial);
      sprite.position.copy(position);
      sprite.scale.set(1, 0.25, 1);
      return sprite;
    };

    scene.add(createLabel(xAxis, new THREE.Vector3(3.5, 0, 0)));
    scene.add(createLabel(yAxis, new THREE.Vector3(0, 3.5, 0)));
    scene.add(createLabel(zAxis, new THREE.Vector3(0, 0, 3.5)));

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Handle window resize
    const handleResize = () => {
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      controls.dispose();
    };
  }, [data, xAxis, yAxis, zAxis, darkMode]);

  return (
    <motion.div 
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${
        darkMode ? 'bg-black/70' : 'bg-black/30'
      } backdrop-blur-sm`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className={`w-full max-w-4xl rounded-xl shadow-2xl border ${
          darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
      >
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${
          darkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <h3 className={`text-xl font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>
            3D Visualization
          </h3>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700`}
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Axis Selection */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {['X', 'Y', 'Z'].map((axis) => (
              <div key={axis}>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  {axis} Axis
                </label>
                <select
                  value={axis === 'Z' ? zAxis : (axis === 'Y' ? yAxis : xAxis)}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (axis === 'Z') onAxisChange('z', value);
                    else if (axis === 'Y') onAxisChange('y', value);
                    else onAxisChange('x', value);
                  }}
                  className={`w-full p-2.5 border rounded-lg ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-gray-200' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  <option value="">Select {axis} Axis</option>
                  {columns.map((col) => (
                    <option key={`${axis.toLowerCase()}-${col.key}`} value={col.name}>
                      {col.name}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          {/* 3D Visualization */}
          <div className={`h-[500px] rounded-lg border ${
            darkMode ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <div ref={threeContainerRef} className="w-full h-full" />
          </div>

          {/* Controls Help */}
          <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            Drag to rotate • Scroll to zoom • Right-click to pan
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ThreeDVisualizer; 