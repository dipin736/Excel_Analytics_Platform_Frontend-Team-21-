import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { FiZoomIn, FiZoomOut, FiRotateCw, FiRotateCcw, FiChevronUp, FiChevronDown, FiSave, FiDownload, FiList } from "react-icons/fi";

const Professional3DChart = ({ processedData, xAxis, yAxis, zAxis, darkMode, chartType = "3d-bar" }) => {
  const threeContainerRef = useRef(null);
  const [camera, setCamera] = useState(null);
  const [renderer, setRenderer] = useState(null);
  const [scene, setScene] = useState(null);
  const [showLegend, setShowLegend] = useState(true);

  // Control functions
  const zoomIn = () => {
    if (camera) {
      camera.position.multiplyScalar(0.8);
      camera.updateProjectionMatrix();
    }
  };

  const zoomOut = () => {
    if (camera) {
      camera.position.multiplyScalar(1.2);
      camera.updateProjectionMatrix();
    }
  };

  const rotateLeft = () => {
    if (camera) {
      const angle = Math.PI / 8;
      const x = camera.position.x;
      const z = camera.position.z;
      camera.position.x = x * Math.cos(angle) - z * Math.sin(angle);
      camera.position.z = x * Math.sin(angle) + z * Math.cos(angle);
      camera.lookAt(0, camera.position.y * 0.3, 0);
    }
  };

  const rotateRight = () => {
    if (camera) {
      const angle = -Math.PI / 8;
      const x = camera.position.x;
      const z = camera.position.z;
      camera.position.x = x * Math.cos(angle) - z * Math.sin(angle);
      camera.position.z = x * Math.sin(angle) + z * Math.cos(angle);
      camera.lookAt(0, camera.position.y * 0.3, 0);
    }
  };

  const rotateUp = () => {
    if (camera) {
      camera.position.y *= 1.2;
      camera.lookAt(0, camera.position.y * 0.3, 0);
    }
  };

  const rotateDown = () => {
    if (camera) {
      camera.position.y *= 0.8;
      camera.lookAt(0, camera.position.y * 0.3, 0);
    }
  };

  const saveChart = () => {
    // Save progress to desktop (could be expanded to save chart state)
    if (renderer) {
      const link = document.createElement('a');
      link.download = `3d-chart-progress-${new Date().toISOString().split('T')[0]}.png`;
      link.href = renderer.domElement.toDataURL();
      link.click();
      // You could also save chart configuration to localStorage here
      localStorage.setItem('3d-chart-config', JSON.stringify({
        xAxis, yAxis, zAxis, chartType: '3d-bar', 
        timestamp: new Date().toISOString()
      }));
    }
  };

  const downloadChart = () => {
    if (renderer) {
      const link = document.createElement('a');
      link.download = `3d-chart-${new Date().toISOString().split('T')[0]}.png`;
      link.href = renderer.domElement.toDataURL();
      link.click();
    }
  };

  const downloadData = () => {
    const csvContent = [
      [xAxis, yAxis, zAxis].join(','),
      ...processedData.map(row => [row[xAxis], row[yAxis], row[zAxis]].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `3d-chart-data-${new Date().toISOString().split('T')[0]}.csv`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    if (!threeContainerRef.current || !xAxis || !yAxis || !zAxis || processedData.length === 0) return;

    // Clean up previous scene
    while (threeContainerRef.current.firstChild) {
      threeContainerRef.current.removeChild(threeContainerRef.current.firstChild);
    }

    // Get unique values and data range
    const xVals = [...new Set(processedData.map(d => d[xAxis]))];
    const zVals = [...new Set(processedData.map(d => d[zAxis]))];
    const yVals = processedData.map(d => parseFloat(d[yAxis]) || 0);
    const yMin = Math.min(...yVals);
    const yMax = Math.max(...yVals);
    const yRange = yMax - yMin || 1;

    // Chart dimensions
    const xCount = xVals.length;
    const zCount = zVals.length;
    const gridSpacing = 4;
    const maxBarHeight = 20;

    // Scene setup
    const width = threeContainerRef.current.clientWidth || 600;
    const height = 400;
    const sceneObj = new THREE.Scene();
    sceneObj.background = new THREE.Color(darkMode ? 0x1a1a1a : 0xffffff);

    const cameraObj = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    const rendererObj = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    rendererObj.setSize(width, height);
    rendererObj.shadowMap.enabled = true;
    rendererObj.shadowMap.type = THREE.PCFSoftShadowMap;
    threeContainerRef.current.appendChild(rendererObj.domElement);
    
    // Store references for controls
    setCamera(cameraObj);
    setRenderer(rendererObj);
    setScene(sceneObj);

    // STEP 1: Create proper X, Y, Z axes - Single color based on theme
    const axisLength = Math.max(xCount, zCount) * gridSpacing;
    const axisColor = darkMode ? 0xffffff : 0x000000;

    // X-Axis - horizontal line (aligned with grid)
    const xAxisGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-(xCount - 1) * gridSpacing / 2, 0, -(zCount - 1) * gridSpacing / 2),
      new THREE.Vector3((xCount - 1) * gridSpacing / 2, 0, -(zCount - 1) * gridSpacing / 2)
    ]);
    const xAxisLine = new THREE.Line(xAxisGeometry, new THREE.LineBasicMaterial({ color: axisColor, linewidth: 3 }));
    sceneObj.add(xAxisLine);

    // Y-Axis - vertical line (aligned with grid)
    const yAxisGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-(xCount - 1) * gridSpacing / 2, 0, -(zCount - 1) * gridSpacing / 2),
      new THREE.Vector3(-(xCount - 1) * gridSpacing / 2, maxBarHeight + 2, -(zCount - 1) * gridSpacing / 2)
    ]);
    const yAxisLine = new THREE.Line(yAxisGeometry, new THREE.LineBasicMaterial({ color: axisColor, linewidth: 3 }));
    sceneObj.add(yAxisLine);

    // Z-Axis - depth line (aligned with grid)
    const zAxisGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-(xCount - 1) * gridSpacing / 2, 0, -(zCount - 1) * gridSpacing / 2),
      new THREE.Vector3(-(xCount - 1) * gridSpacing / 2, 0, (zCount - 1) * gridSpacing / 2)
    ]);
    const zAxisLine = new THREE.Line(zAxisGeometry, new THREE.LineBasicMaterial({ color: axisColor, linewidth: 3 }));
    sceneObj.add(zAxisLine);

    // Add axis labels using text sprites (without FontLoader)
    const createTextSprite = (text) => {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.width = 256;
      canvas.height = 64;
      
      // Clear canvas
      context.fillStyle = 'transparent';
      context.fillRect(0, 0, canvas.width, canvas.height);
      
      // Set text style
      context.fillStyle = darkMode ? '#ffffff' : '#000000';
      context.font = 'Bold 20px Arial';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      
      // Draw text
      context.fillText(text, canvas.width/2, canvas.height/2);
      
      const texture = new THREE.CanvasTexture(canvas);
      const spriteMaterial = new THREE.SpriteMaterial({ 
        map: texture,
        transparent: true
      });
      const sprite = new THREE.Sprite(spriteMaterial);
      sprite.scale.set(6, 1.5, 1);
      return sprite;
    };

    // X-Axis label
    const xLabel = createTextSprite(xAxis);
    xLabel.position.set((xCount - 1) * gridSpacing / 2 + 4, -2, -(zCount - 1) * gridSpacing / 2);
    sceneObj.add(xLabel);

    // Y-Axis label
    const yLabel = createTextSprite(yAxis);
    yLabel.position.set(-(xCount - 1) * gridSpacing / 2 - 4, maxBarHeight + 4, -(zCount - 1) * gridSpacing / 2);
    sceneObj.add(yLabel);

    // Z-Axis label
    const zLabel = createTextSprite(zAxis);
    zLabel.position.set(-(xCount - 1) * gridSpacing / 2, -2, (zCount - 1) * gridSpacing / 2 + 4);
    sceneObj.add(zLabel);

    // STEP 2: Create proper grid structure
    const gridColor = darkMode ? 0x444444 : 0xcccccc;
    
    // Grid lines for X direction
    for (let i = 0; i < xCount; i++) {
      const x = (i - (xCount - 1) / 2) * gridSpacing;
      const gridLineGeom = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(x, 0, -(zCount - 1) * gridSpacing / 2),
        new THREE.Vector3(x, 0, (zCount - 1) * gridSpacing / 2)
      ]);
      const gridLine = new THREE.Line(gridLineGeom, new THREE.LineBasicMaterial({ color: gridColor }));
      sceneObj.add(gridLine);
    }

    // Grid lines for Z direction
    for (let i = 0; i < zCount; i++) {
      const z = (i - (zCount - 1) / 2) * gridSpacing;
      const gridLineGeom = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-(xCount - 1) * gridSpacing / 2, 0, z),
        new THREE.Vector3((xCount - 1) * gridSpacing / 2, 0, z)
      ]);
      const gridLine = new THREE.Line(gridLineGeom, new THREE.LineBasicMaterial({ color: gridColor }));
      sceneObj.add(gridLine);
    }

    // STEP 3: Add axis ticks (aligned with grid)
    const tickColor = darkMode ? 0xcccccc : 0x333333;
    
    // X-axis ticks
    for (let i = 0; i < xCount; i++) {
      const x = (i - (xCount - 1) / 2) * gridSpacing;
      const tickGeom = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(x, 0, -(zCount - 1) * gridSpacing / 2),
        new THREE.Vector3(x, -0.5, -(zCount - 1) * gridSpacing / 2)
      ]);
      const tick = new THREE.Line(tickGeom, new THREE.LineBasicMaterial({ color: tickColor }));
      sceneObj.add(tick);
    }

    // Z-axis ticks
    for (let i = 0; i < zCount; i++) {
      const z = (i - (zCount - 1) / 2) * gridSpacing;
      const tickGeom = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-(xCount - 1) * gridSpacing / 2, 0, z),
        new THREE.Vector3(-(xCount - 1) * gridSpacing / 2 - 0.5, 0, z)
      ]);
      const tick = new THREE.Line(tickGeom, new THREE.LineBasicMaterial({ color: tickColor }));
      sceneObj.add(tick);
    }

    // Y-axis ticks
    for (let i = 0; i <= 5; i++) {
      const y = (i / 5) * maxBarHeight;
      const tickGeom = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-(xCount - 1) * gridSpacing / 2, y, -(zCount - 1) * gridSpacing / 2),
        new THREE.Vector3(-(xCount - 1) * gridSpacing / 2 - 0.5, y, -(zCount - 1) * gridSpacing / 2)
      ]);
      const tick = new THREE.Line(tickGeom, new THREE.LineBasicMaterial({ color: tickColor }));
      sceneObj.add(tick);
    }

    // STEP 4: Create 3D visualization based on chart type
    if (chartType === "3d-bar") {
      // 3D Bar Chart
      const barColor = 0x4a90e2;

      processedData.forEach((row) => {
        const xIdx = xVals.indexOf(row[xAxis]);
        const zIdx = zVals.indexOf(row[zAxis]);
        const yVal = parseFloat(row[yAxis]) || 0;

        const normalizedY = (yVal - yMin) / yRange;
        const barHeight = 1 + normalizedY * (maxBarHeight - 1);

        const geometry = new THREE.BoxGeometry(2, barHeight, 2);
        const material = new THREE.MeshPhongMaterial({ 
          color: barColor,
          shininess: 30
        });

        const bar = new THREE.Mesh(geometry, material);

        bar.position.set(
          (xIdx - (xCount - 1) / 2) * gridSpacing,
          barHeight / 2,
          (zIdx - (zCount - 1) / 2) * gridSpacing
        );

        bar.castShadow = true;
        bar.receiveShadow = true;
        sceneObj.add(bar);
      });
    } else if (chartType === "3d-surface") {
      // 3D Surface Chart - WORKING IMPLEMENTATION
      console.log("Creating 3D Surface with data:", processedData.length, "points");
      
      // Create a visible surface using individual connected triangles
      const surfaceGroup = new THREE.Group();
      
      // Create surface patches between adjacent data points
      for (let xi = 0; xi < xCount - 1; xi++) {
        for (let zi = 0; zi < zCount - 1; zi++) {
          // Get the four corner points
          const x1 = (xi - (xCount - 1) / 2) * gridSpacing;
          const x2 = ((xi + 1) - (xCount - 1) / 2) * gridSpacing;
          const z1 = (zi - (zCount - 1) / 2) * gridSpacing;
          const z2 = ((zi + 1) - (zCount - 1) / 2) * gridSpacing;
          
          // Get Y values for the four corners
          const getHeight = (xIdx, zIdx) => {
            const xVal = xVals[xIdx];
            const zVal = zVals[zIdx];
            const dataPoint = processedData.find(row => row[xAxis] === xVal && row[zAxis] === zVal);
            if (dataPoint) {
              const yVal = parseFloat(dataPoint[yAxis]) || 0;
              const normalizedY = (yVal - yMin) / (yRange || 1);
              return normalizedY * maxBarHeight;
            }
            return 0;
          };
          
          const y1 = getHeight(xi, zi);
          const y2 = getHeight(xi + 1, zi);
          const y3 = getHeight(xi + 1, zi + 1);
          const y4 = getHeight(xi, zi + 1);
          
          // Create a quad surface patch
          const geometry = new THREE.BufferGeometry();
          const vertices = new Float32Array([
            // First triangle
            x1, y1, z1,
            x2, y2, z1,
            x1, y4, z2,
            // Second triangle
            x2, y2, z1,
            x2, y3, z2,
            x1, y4, z2
          ]);
          
          geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
          geometry.computeVertexNormals();
          
          // Color based on average height
          const avgHeight = (y1 + y2 + y3 + y4) / 4;
          const colorIntensity = avgHeight / maxBarHeight;
          const color = new THREE.Color(
            0.2 + colorIntensity * 0.8, // Red
            0.4 + colorIntensity * 0.3, // Green
            1.0 - colorIntensity * 0.6  // Blue
          );
          
          const material = new THREE.MeshPhongMaterial({
            color: color,
            shininess: 60,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide
          });
          
          const patch = new THREE.Mesh(geometry, material);
          patch.castShadow = true;
          patch.receiveShadow = true;
          surfaceGroup.add(patch);
        }
      }
      
      sceneObj.add(surfaceGroup);
      
      // Add data point markers for clarity
      processedData.forEach((row) => {
        const xIdx = xVals.indexOf(row[xAxis]);
        const zIdx = zVals.indexOf(row[zAxis]);
        const yVal = parseFloat(row[yAxis]) || 0;
        
        const normalizedY = (yVal - yMin) / (yRange || 1);
        const height = normalizedY * maxBarHeight;
        
        // Small sphere at each data point
        const sphereGeometry = new THREE.SphereGeometry(0.3, 8, 8);
        const sphereMaterial = new THREE.MeshPhongMaterial({
          color: 0xff4444,
          shininess: 100
        });
        
        const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
        sphere.position.set(
          (xIdx - (xCount - 1) / 2) * gridSpacing,
          height + 0.5,
          (zIdx - (zCount - 1) / 2) * gridSpacing
        );
        
        sphere.castShadow = true;
        sceneObj.add(sphere);
      });
    } else if (chartType === "3d-bubble") {
      // 3D Bubble Chart
      const bubbleColor = 0x4a90e2;

      processedData.forEach((row) => {
        const xIdx = xVals.indexOf(row[xAxis]);
        const zIdx = zVals.indexOf(row[zAxis]);
        const yVal = parseFloat(row[yAxis]) || 0;

        const normalizedY = (yVal - yMin) / yRange;
        const bubbleRadius = 0.5 + normalizedY * 2; // Radius based on Y value

        const geometry = new THREE.SphereGeometry(bubbleRadius, 16, 16);
        const material = new THREE.MeshPhongMaterial({ 
          color: bubbleColor,
          shininess: 100,
          transparent: true,
          opacity: 0.7
        });

        const bubble = new THREE.Mesh(geometry, material);

        bubble.position.set(
          (xIdx - (xCount - 1) / 2) * gridSpacing,
          bubbleRadius + normalizedY * maxBarHeight * 0.3,
          (zIdx - (zCount - 1) / 2) * gridSpacing
        );

        bubble.castShadow = true;
        bubble.receiveShadow = true;
        sceneObj.add(bubble);
      });
    }

    // STEP 5: Professional lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    sceneObj.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 10);
    directionalLight.castShadow = true;
    sceneObj.add(directionalLight);

    // STEP 6: Professional camera angle
    cameraObj.position.set(axisLength * 0.8, maxBarHeight * 1.2, axisLength * 0.8);
    cameraObj.lookAt(0, maxBarHeight * 0.3, 0);

    // Animation loop
    const animate = () => {
      rendererObj.render(sceneObj, cameraObj);
      requestAnimationFrame(animate);
    };
    animate();

    // Cleanup
    return () => {
      rendererObj.dispose();
      while (threeContainerRef.current && threeContainerRef.current.firstChild) {
        threeContainerRef.current.removeChild(threeContainerRef.current.firstChild);
      }
    };
  }, [processedData, xAxis, yAxis, zAxis, darkMode, chartType]);

  return (
    <div className="w-full flex flex-col">
      {/* Control Panel */}
      <div className={`flex flex-wrap gap-2 p-4 ${darkMode ? 'bg-gray-800' : 'bg-gray-100'} rounded-t-lg`}>
        {/* Zoom Controls */}
        <div className="flex gap-1">
          <button onClick={zoomIn} className={`p-2 rounded ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-white hover:bg-gray-50 text-gray-700'} border`}>
            <FiZoomIn size={16} />
          </button>
          <button onClick={zoomOut} className={`p-2 rounded ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-white hover:bg-gray-50 text-gray-700'} border`}>
            <FiZoomOut size={16} />
          </button>
        </div>

        {/* Rotation Controls */}
        <div className="flex gap-1">
          <button onClick={rotateLeft} className={`p-2 rounded ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-white hover:bg-gray-50 text-gray-700'} border`}>
            <FiRotateCcw size={16} />
          </button>
          <button onClick={rotateRight} className={`p-2 rounded ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-white hover:bg-gray-50 text-gray-700'} border`}>
            <FiRotateCw size={16} />
          </button>
          <button onClick={rotateUp} className={`p-2 rounded ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-white hover:bg-gray-50 text-gray-700'} border`}>
            <FiChevronUp size={16} />
          </button>
          <button onClick={rotateDown} className={`p-2 rounded ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-white hover:bg-gray-50 text-gray-700'} border`}>
            <FiChevronDown size={16} />
          </button>
        </div>

        {/* Save/Download Controls */}
        <div className="flex gap-1">
          <button onClick={saveChart} className={`p-2 rounded ${darkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'} border-0`} title="Save Progress">
            <FiSave size={16} />
          </button>
          <button onClick={downloadChart} className={`p-2 rounded ${darkMode ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-green-500 hover:bg-green-600 text-white'} border-0`} title="Download Chart Image">
            <FiDownload size={16} />
          </button>
          <button onClick={downloadData} className={`p-2 rounded ${darkMode ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'bg-purple-500 hover:bg-purple-600 text-white'} border-0`} title="Download Data CSV">
            📊
          </button>
        </div>

        {/* Legend Toggle */}
        <div className="flex gap-1">
          <button onClick={() => setShowLegend(!showLegend)} className={`p-2 rounded ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-white hover:bg-gray-50 text-gray-700'} border`}>
            <FiList size={16} />
          </button>
        </div>
      </div>

      {/* Chart and Legend Container */}
      <div className="flex">
        {/* Chart */}
        <div className="flex-1 flex justify-center items-center">
          <div 
            ref={threeContainerRef} 
            style={{ 
              width: '100%', 
              maxWidth: showLegend ? 500 : 700, 
              height: 400, 
              borderRadius: showLegend ? '0 0 0 16px' : '0 0 16px 16px', 
              overflow: 'hidden', 
              background: darkMode ? '#1a1a1a' : '#ffffff', 
              boxShadow: '0 2px 16px rgba(0,0,0,0.1)' 
            }} 
          />
        </div>

        {/* Legend */}
        {showLegend && (
          <div className={`w-64 p-4 ${darkMode ? 'bg-gray-800 text-white' : 'bg-gray-50 text-gray-700'} rounded-br-lg border-l`}>
            <h3 className="font-semibold mb-3">Chart Legend</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: '#4a90e2' }}></div>
                <span>
                  {chartType === "3d-bar" && "Data Bars"}
                  {chartType === "3d-surface" && "Surface Mesh"}
                  {chartType === "3d-bubble" && "Data Bubbles"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-4 h-1 ${darkMode ? 'bg-white' : 'bg-black'}`}></div>
                <span>Axes</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-4 h-1 ${darkMode ? 'bg-gray-400' : 'bg-gray-300'}`}></div>
                <span>Grid</span>
              </div>
              {chartType === "3d-surface" && (
                <div className="flex items-center gap-2">
                  <div className={`w-4 h-1 ${darkMode ? 'bg-gray-600' : 'bg-gray-400'}`}></div>
                  <span>Wireframe</span>
                </div>
              )}
            </div>
            <div className="mt-4 pt-3 border-t">
              <div className="text-xs space-y-1">
                <div><strong>X-Axis:</strong> {xAxis}</div>
                <div><strong>Y-Axis:</strong> {yAxis}</div>
                <div><strong>Z-Axis:</strong> {zAxis}</div>
                <div><strong>Data Points:</strong> {processedData.length}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Professional3DChart; 