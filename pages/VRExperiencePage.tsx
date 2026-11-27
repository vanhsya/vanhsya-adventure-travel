
import React, { useState, useRef, useEffect } from 'react';

declare global {
  interface Window {
    THREE: any;
  }
}

type MousePosition = {
  x: number;
  y: number;
};

// --- GLOBAL COORDINATE REGISTRY ---
const countryCoords: { [key: string]: { lat: number; lon: number } } = {
  "United States": { lat: 39.82, lon: -98.57 }, "Canada": { lat: 56.13, lon: -106.34 }, "Mexico": { lat: 23.63, lon: -102.55 }, "United Kingdom": { lat: 55.37, lon: -3.43 }, "Germany": { lat: 51.16, lon: 10.45 }, "France": { lat: 46.22, lon: 2.21 }, "Australia": { lat: -25.27, lon: 133.77 }, "Japan": { lat: 36.20, lon: 138.25 }, "China": { lat: 35.86, lon: 104.19 }, "India": { lat: 20.59, lon: 78.96 }, "Brazil": { lat: -14.23, lon: -51.92 }, "South Africa": { lat: -30.55, lon: 22.93 }, "Nigeria": { lat: 9.08, lon: 8.67 }, "Russia": { lat: 61.52, lon: 105.31 }, "Spain": { lat: 40.46, lon: -3.74 }, "Italy": { lat: 41.87, lon: 12.56 }, "Argentina": { lat: -38.41, lon: -63.61 }, "New Zealand": { lat: -40.90, lon: 174.88 }, "Singapore": { lat: 1.35, lon: 103.81 }, "UAE": { lat: 23.42, lon: 53.84 }, "Saudi Arabia": { lat: 23.88, lon: 45.07 }, "Egypt": { lat: 26.82, lon: 30.80 }, "Turkey": { lat: 38.96, lon: 35.24 }, "South Korea": { lat: 35.90, lon: 127.76 }, "Thailand": { lat: 15.87, lon: 100.99 }, "Vietnam": { lat: 14.05, lon: 108.27 }, "Indonesia": { lat: -0.78, lon: 113.92 }, "Greece": { lat: 39.07, lon: 21.82 }, "Sweden": { lat: 60.12, lon: 18.64 }, "Norway": { lat: 60.47, lon: 8.46 }, "Iceland": { lat: 64.96, lon: -19.02 }, "Switzerland": { lat: 46.81, lon: 8.22 }, "Netherlands": { lat: 52.13, lon: 5.29 }, "Portugal": { lat: 39.39, lon: -8.22 }, "Peru": { lat: -9.18, lon: -75.01 }, "Colombia": { lat: 4.57, lon: -74.29 }, "Chile": { lat: -35.67, lon: -71.54 }, "Kenya": { lat: -0.02, lon: 37.90 }, "Morocco": { lat: 31.79, lon: -7.09 }, "Israel": { lat: 31.04, lon: 34.85 }, "Iran": { lat: 32.42, lon: 53.68 }, "Pakistan": { lat: 30.37, lon: 69.34 }
};
const countryNames = Object.keys(countryCoords).sort();

function latLonToVector3(lat: number, lon: number, radius: number) {
    const THREE = window.THREE;
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);
    const x = -(radius * Math.sin(phi) * Math.cos(theta));
    const z = radius * Math.sin(phi) * Math.sin(theta);
    const y = radius * Math.cos(phi);
    return new THREE.Vector3(x, y, z);
}

const getMidpointCoords = (coordsA: { lat: number; lon: number }, coordsB: { lat: number; lon: number }) => {
  let midLat = (coordsA.lat + coordsB.lat) / 2;
  let dLon = coordsB.lon - coordsA.lon;
  let midLon = coordsA.lon + dLon / 2;
  if (Math.abs(dLon) > 180) {
    midLon = (coordsA.lon + coordsB.lon + 360) / 2;
    if (midLon > 180) midLon -= 360;
  }
  return { lat: midLat, lon: midLon };
};

const getHaversineDistance = (coordsA: { lat: number; lon: number }, coordsB: { lat: number; lon: number }) => {
  const R = 6371; // Earth radius in km
  const dLat = (coordsB.lat - coordsA.lat) * Math.PI / 180;
  const dLon = (coordsB.lon - coordsA.lon) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(coordsA.lat * Math.PI / 180) * Math.cos(coordsB.lat * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return Math.round(R * c);
};

interface ThreeCanvasProps {
  journey: { origin?: string; destination?: string };
  globeSpeed: number;
}

const ThreeCanvas: React.FC<ThreeCanvasProps> = ({ journey, globeSpeed }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const globeSpeedRef = useRef(globeSpeed);
  const globeGroupRef = useRef<any>(null);
  const atomsRef = useRef<any[]>([]);
  const mercuryLayerRef = useRef<any>(null);
  const routeGroupRef = useRef<any>(null);
  const packetsRef = useRef<any[]>([]);
  const activeCurveRef = useRef<any>(null);

  // Smooth camera alignment and interaction refs
  const targetRotationYRef = useRef(0);
  const targetRotationXRef = useRef(0);
  const targetCameraZRef = useRef(12);
  const isAutoRotatingRef = useRef(true);

  useEffect(() => {
    globeSpeedRef.current = globeSpeed;
  }, [globeSpeed]);

  // Main ThreeJS Setup Effect
  useEffect(() => {
    const THREE = window.THREE;
    if (!mountRef.current || !THREE) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 12;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mountRef.current.appendChild(renderer.domElement);
    
    const clock = new THREE.Clock();

    // --- LIGHTING ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);
    
    const pointLightCyan = new THREE.PointLight(0x00F2FE, 2.5, 40);
    pointLightCyan.position.set(12, 10, 8);
    scene.add(pointLightCyan);

    const pointLightPurple = new THREE.PointLight(0x8A2BE2, 2.0, 40);
    pointLightPurple.position.set(-12, -10, -8);
    scene.add(pointLightPurple);

    const globeGroup = new THREE.Group();
    globeGroupRef.current = globeGroup;
    const RADIUS = 5;

    // --- GLOBE MESH ---
    const loader = new THREE.TextureLoader();
    const earthGeo = new THREE.SphereGeometry(RADIUS, 64, 64);
    const earthMat = new THREE.MeshStandardMaterial({
        map: loader.load('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/textures/planets/earth_atmos_2048.jpg'),
        roughness: 0.6,
        metalness: 0.4
    });
    const earth = new THREE.Mesh(earthGeo, earthMat);
    globeGroup.add(earth);

    // --- MERCURY FLUID LAYER (Metallic Sci-fi Aura Highlight) ---
    const mercuryGeo = new THREE.SphereGeometry(RADIUS * 1.008, 64, 64);
    const mercuryMat = new THREE.MeshPhongMaterial({
        color: 0x00F2FE,
        specular: 0xffffff,
        shininess: 90,
        transparent: true,
        opacity: 0.18,
        blending: THREE.AdditiveBlending
    });
    const mercury = new THREE.Mesh(mercuryGeo, mercuryMat);
    mercuryLayerRef.current = mercury;
    globeGroup.add(mercury);

    // --- DECO PASSIVE NEURAL CORE CONNECTIONS ---
    const passiveConnections = [
      ["United States", "Japan"],
      ["Germany", "Saudi Arabia"],
      ["Japan", "Singapore"],
      ["United Kingdom", "UAE"],
      ["France", "Brazil"],
      ["Australia", "India"]
    ];

    passiveConnections.forEach(([fromName, toName]) => {
      const fromCoord = countryCoords[fromName];
      const toCoord = countryCoords[toName];
      if (fromCoord && toCoord) {
        const fromPos = latLonToVector3(fromCoord.lat, fromCoord.lon, RADIUS);
        const toPos = latLonToVector3(toCoord.lat, toCoord.lon, RADIUS);

        const mid = new THREE.Vector3().addVectors(fromPos, toPos).multiplyScalar(0.5);
        const dist = fromPos.distanceTo(toPos);
        mid.normalize().multiplyScalar(RADIUS * (1 + dist * 0.12));

        const c = new THREE.QuadraticBezierCurve3(fromPos, mid, toPos);
        const pts = c.getPoints(40);
        const g = new THREE.BufferGeometry().setFromPoints(pts);
        const m = new THREE.LineBasicMaterial({
          color: 0x8A2BE2,
          transparent: true,
          opacity: 0.15,
        });
        const passiveLine = new THREE.Line(g, m);
        globeGroup.add(passiveLine);
      }
    });

    // --- ATOMIC NEURAL NODES ---
    const createAtom = (position: any, color: number) => {
        const atomGroup = new THREE.Group();
        atomGroup.position.copy(position);

        const coreGeo = new THREE.SphereGeometry(0.06, 16, 16);
        const coreMat = new THREE.MeshBasicMaterial({ color: color });
        const core = new THREE.Mesh(coreGeo, coreMat);
        atomGroup.add(core);

        const orbits = 3;
        for (let i = 0; i < orbits; i++) {
            const orbitGeo = new THREE.RingGeometry(0.12, 0.13, 32);
            const orbitMat = new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: 0.3, side: THREE.DoubleSide });
            const orbit = new THREE.Mesh(orbitGeo, orbitMat);
            orbit.rotation.x = Math.random() * Math.PI;
            orbit.rotation.y = Math.random() * Math.PI;
            
            const electronGeo = new THREE.SphereGeometry(0.02, 8, 8);
            const electronMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
            const electron = new THREE.Mesh(electronGeo, electronMat);
            electron.position.x = 0.125;
            orbit.add(electron);
            
            atomGroup.add(orbit);
        }
        
        globeGroup.add(atomGroup);
        atomsRef.current.push(atomGroup);
    };

    Object.values(countryCoords).forEach((coord, i) => {
        const pos = latLonToVector3(coord.lat, coord.lon, RADIUS);
        createAtom(pos, i % 2 === 0 ? 0x00F2FE : 0x8A2BE2);
    });

    // --- AMBIENT HOLOGRAPHIC STAR FIELD ---
    const starGeo = new THREE.BufferGeometry();
    const starCount = 350;
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      const angle1 = Math.random() * Math.PI * 2;
      const angle2 = Math.random() * Math.PI;
      const dist = 7.5 + Math.random() * 9.0;
      starPositions[i] = dist * Math.sin(angle2) * Math.cos(angle1);
      starPositions[i+1] = dist * Math.sin(angle2) * Math.sin(angle1);
      starPositions[i+2] = dist * Math.cos(angle2);
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0x00F2FE,
      size: 0.05,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending
    });
    const stars = new THREE.Points(starGeo, starMat);
    globeGroup.add(stars);

    // --- ACTIVE JOURNEY ROUTE GROUP ---
    const routeGroup = new THREE.Group();
    globeGroup.add(routeGroup);
    routeGroupRef.current = routeGroup;

    scene.add(globeGroup);

    // --- ATMOSPHERE SHADOW/GLOW GLINT ---
    const atmoGeo = new THREE.SphereGeometry(RADIUS * 1.15, 64, 64);
    const atmoMat = new THREE.ShaderMaterial({
        vertexShader: `
            varying vec3 vNormal;
            void main() {
                vNormal = normalize(normalMatrix * normal);
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            varying vec3 vNormal;
            void main() {
                float intensity = pow(0.7 - dot(vNormal, vec3(0, 0, 1.0)), 2.0);
                gl_FragColor = vec4(0.0, 0.75, 1.0, 1.0) * intensity;
            }
        `,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
        transparent: true
    });
    scene.add(new THREE.Mesh(atmoGeo, atmoMat));

    // --- INTERACTIVE DRAG AND ZOOM ALIGNEMNT ---
    let isDragging = false;
    let previousPointerPosition = { x: 0, y: 0 };
    let autoRotateTimeout: any = null;

    const startDrag = (clientX: number, clientY: number) => {
      isDragging = true;
      isAutoRotatingRef.current = false;
      if (autoRotateTimeout) clearTimeout(autoRotateTimeout);
      previousPointerPosition = { x: clientX, y: clientY };
    };

    const updateDrag = (clientX: number, clientY: number) => {
      if (!isDragging) return;
      const deltaX = clientX - previousPointerPosition.x;
      const deltaY = clientY - previousPointerPosition.y;

      const zoomFactor = camera.position.z / 12;
      targetRotationYRef.current += deltaX * 0.0055 * zoomFactor;
      targetRotationXRef.current += deltaY * 0.0055 * zoomFactor;

      // Limit latitude look angles to stop visual snapping
      targetRotationXRef.current = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, targetRotationXRef.current));

      previousPointerPosition = { x: clientX, y: clientY };
    };

    const endDrag = () => {
      isDragging = false;
      autoRotateTimeout = setTimeout(() => {
        isAutoRotatingRef.current = true;
      }, 5000); // Resume slow spin after 5s idle
    };

    const dom = renderer.domElement;
    dom.style.cursor = 'grab';

    const onMouseDown = (e: MouseEvent) => {
      startDrag(e.clientX, e.clientY);
      dom.style.cursor = 'grabbing';
    };

    const onMouseMove = (e: MouseEvent) => {
      updateDrag(e.clientX, e.clientY);
    };

    const onMouseUp = () => {
      endDrag();
      dom.style.cursor = 'grab';
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        startDrag(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        updateDrag(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const onTouchEnd = () => {
      endDrag();
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomSpeed = 0.015;
      targetCameraZRef.current = Math.max(5.5, Math.min(22.0, targetCameraZRef.current + e.deltaY * zoomSpeed));
    };

    const onDoubleClick = () => {
      targetCameraZRef.current = 12;
      isAutoRotatingRef.current = true;
    };

    dom.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    dom.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd);

    dom.addEventListener('wheel', onWheel, { passive: false });
    dom.addEventListener('dblclick', onDoubleClick);

    // --- ANIMATE FUNCTION ---
    const animate = () => {
        requestAnimationFrame(animate);
        const delta = clock.getDelta();
        const time = clock.getElapsedTime();

        if (globeGroupRef.current) {
            if (isAutoRotatingRef.current) {
                // Gentle continuous cosmic drift rotation
                globeGroupRef.current.rotation.y += delta * globeSpeedRef.current * 0.12;
                globeGroupRef.current.rotation.x += (targetRotationXRef.current - globeGroupRef.current.rotation.x) * (delta * 1.5);
                targetRotationYRef.current = globeGroupRef.current.rotation.y;
            } else {
                // Animate smoothly to targeted user drag direction or automated endpoint alignment
                globeGroupRef.current.rotation.y += (targetRotationYRef.current - globeGroupRef.current.rotation.y) * 0.09;
                globeGroupRef.current.rotation.x += (targetRotationXRef.current - globeGroupRef.current.rotation.x) * 0.09;
            }
            
            if (mercuryLayerRef.current) {
                mercuryLayerRef.current.scale.setScalar(1 + Math.sin(time * 0.6) * 0.006);
                mercuryLayerRef.current.material.opacity = 0.14 + Math.sin(time * 2) * 0.05;
            }
        }

        // Animate route data flows
        if (activeCurveRef.current && packetsRef.current) {
            packetsRef.current.forEach((p: any) => {
                const elapsed = clock.getElapsedTime() * 0.35;
                const progress = (elapsed + p.offset) % 1.0;
                
                const point = activeCurveRef.current.getPointAt(progress);
                p.mesh.position.copy(point);
                
                const pulse = 0.8 + Math.sin(time * 9.0 + p.offset * 12) * 0.25;
                p.mesh.scale.set(pulse, pulse, pulse);
            });
        }

        atomsRef.current.forEach((atom, i) => {
            atom.children.forEach((child: any, j: number) => {
                if (j > 0) {
                    child.rotation.x += delta * (0.45 + j * 0.18);
                    child.rotation.y += delta * (0.25 + j * 0.25);
                    child.rotation.z += delta * (1.2 + j * 0.8);
                } else {
                    const pulse = 1 + Math.sin(time * 5.0 + i) * 0.2;
                    child.scale.set(pulse, pulse, pulse);
                }
            });

            const basePos = atom.position.clone().normalize().multiplyScalar(RADIUS + 0.1);
            const floatScale = 0.07 * Math.sin(time * 2.8 + i);
            atom.position.copy(basePos.add(atom.position.clone().normalize().multiplyScalar(floatScale)));
        });

        // Smoothly interpolate CAMERA ZOOM distance
        camera.position.z += (targetCameraZRef.current - camera.position.z) * 0.08;

        renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
        window.removeEventListener('resize', handleResize);
        dom.removeEventListener('mousedown', onMouseDown);
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
        dom.removeEventListener('touchstart', onTouchStart);
        window.removeEventListener('touchmove', onTouchMove);
        window.removeEventListener('touchend', onTouchEnd);
        dom.removeEventListener('wheel', onWheel);
        dom.removeEventListener('dblclick', onDoubleClick);
        if (autoRotateTimeout) clearTimeout(autoRotateTimeout);
        mountRef.current?.removeChild(renderer.domElement);
    };
  }, []);

  // Journey Trigger Routing Effect
  useEffect(() => {
    const THREE = window.THREE;
    if (!THREE || !routeGroupRef.current) return;

    const group = routeGroupRef.current;
    while (group.children.length > 0) {
      group.remove(group.children[0]);
    }

    const oName = journey.origin;
    const dName = journey.destination;

    if (!oName || !dName) return;

    const oCoords = countryCoords[oName];
    const dCoords = countryCoords[dName];

    if (!oCoords || !dCoords) return;

    const radius = 5;
    const posA = latLonToVector3(oCoords.lat, oCoords.lon, radius);
    const posB = latLonToVector3(dCoords.lat, dCoords.lon, radius);

    // Midpoint calculation for lifting Bezier route curve into space
    const midNode = new THREE.Vector3().addVectors(posA, posB).multiplyScalar(0.5);
    const distance = posA.distanceTo(posB);
    const liftVal = 1.0 + distance * 0.18;
    midNode.normalize().multiplyScalar(radius * liftVal);

    const curve = new THREE.QuadraticBezierCurve3(posA, midNode, posB);
    activeCurveRef.current = curve;

    // Glowing Neon Cyan route line
    const points = curve.getPoints(80);
    const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
    const lineMat = new THREE.LineBasicMaterial({
      color: 0x00F2FE,
      linewidth: 3,
      transparent: true,
      opacity: 0.9,
    });
    const mainLine = new THREE.Line(lineGeo, lineMat);
    group.add(mainLine);

    // Soft Purple outer connection aura
    const glowLineMat = new THREE.LineBasicMaterial({
      color: 0x8A2BE2,
      linewidth: 5,
      transparent: true,
      opacity: 0.35,
    });
    const glowLine = new THREE.Line(lineGeo, glowLineMat);
    group.add(glowLine);

    // Multi-packet traveling stream nodes
    const packetGeo = new THREE.SphereGeometry(0.1, 16, 16);
    const packetMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
    });

    const packets: any[] = [];
    const packetCount = 3;
    for (let i = 0; i < packetCount; i++) {
      const packet = new THREE.Mesh(packetGeo, packetMat);
      packets.push({
        mesh: packet,
        offset: i / packetCount,
      });
      group.add(packet);
    }
    packetsRef.current = packets;

    // Direct camera pivot interpolation pointing focused route midpoint to camera
    const midPoint = getMidpointCoords(oCoords, dCoords);
    targetRotationYRef.current = -(midPoint.lon + 180) * (Math.PI / 180) - Math.PI / 2;
    targetRotationXRef.current = midPoint.lat * (Math.PI / 180);
    isAutoRotatingRef.current = false;

    // Frame the camera closer based on the route corridor distance
    const targetZ = Math.max(7.5, Math.min(14.0, 5.5 + distance * 1.3));
    targetCameraZRef.current = targetZ;

  }, [journey]);

  return <div ref={mountRef} className="fixed top-0 left-0 w-full h-full z-0 bg-black" />;
};

const VRExperiencePage: React.FC = () => {
  const [journey, setJourney] = useState({ origin: 'United States', destination: 'UAE' });
  const [insights, setInsights] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const getInsights = async () => {
    setIsLoading(true);
    try {
        const prompt = `Provide a quick, futuristic travel insight between ${journey.origin} and ${journey.destination}. Mention how the 'Vanhsya Atomic Network' has digitized this corridor. Max 2 sentences.`;
        const res = await fetch('/api/gemini/generate-text', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt }),
        });
        if (res.ok) {
            const data = await res.json();
            setInsights(data.text || '');
        } else {
            setInsights("Link degraded. Neural packets lost.");
        }
    } catch (e) {
        setInsights("Link degraded. Neural packets lost.");
    } finally {
        setIsLoading(false);
    }
  };

  const currentDistance = (() => {
    const oCoords = countryCoords[journey.origin];
    const dCoords = countryCoords[journey.destination];
    if (oCoords && dCoords) {
      return getHaversineDistance(oCoords, dCoords);
    }
    return 0;
  })();

  return (
    <div className="bg-black text-white min-h-screen relative font-mono overflow-hidden">
      <ThreeCanvas journey={journey} globeSpeed={0.5} />

      <div className="relative z-10 p-6 md:p-12 max-w-xl pointer-events-none">
        <div className="bg-black/60 backdrop-blur-xl border border-white/10 p-8 rounded-[2rem] shadow-2xl pointer-events-auto">
            <h1 className="text-3xl font-black font-cinzel mb-2 tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">
                ATOMIC EXPLORER
            </h1>
            <p className="text-[10px] uppercase tracking-[0.4em] text-cyan-400 mb-8 font-bold">Vanhsya Neural Link v8.2</p>

            <div className="space-y-6">
                <div>
                    <label className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-2 block">Origin Core</label>
                    <select 
                        value={journey.origin} 
                        onChange={e => setJourney({...journey, origin: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-cyan-500 transition-all text-white font-bold cursor-pointer"
                    >
                        {countryNames.map(n => <option key={n} value={n} className="bg-zinc-900">{n}</option>)}
                    </select>
                </div>
                <div>
                    <label className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-2 block">Destination Node</label>
                    <select 
                        value={journey.destination} 
                        onChange={e => setJourney({...journey, destination: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-purple-500 transition-all text-white font-bold cursor-pointer"
                    >
                        {countryNames.map(n => <option key={n} value={n} className="bg-zinc-900">{n}</option>)}
                    </select>
                </div>

                {currentDistance > 0 && (
                    <div className="p-4 bg-cyan-950/20 border border-cyan-500/20 rounded-xl text-center">
                        <span className="text-[9px] uppercase tracking-widest text-[#00F2FE]/60 font-black block">RES-CORRIDOR SPAN</span>
                        <span className="text-xl font-black text-white tracking-widest font-mono">
                            {currentDistance.toLocaleString()} <span className="text-cyan-400 text-xs text-bold">KM</span>
                        </span>
                    </div>
                )}

                <div className="pt-4">
                    <button 
                        onClick={getInsights}
                        disabled={isLoading}
                        className="w-full py-4 bg-gradient-to-r from-cyan-600 to-purple-600 rounded-xl font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-cyan-500/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
                    >
                        {isLoading ? 'Synchronizing...' : 'Establish Link'}
                    </button>
                </div>

                {insights && (
                    <div className="mt-6 p-4 bg-white/5 border-l-4 border-cyan-500 rounded-r-xl animate-fadeIn">
                        <p className="text-xs leading-relaxed text-gray-300 italic">"{insights}"</p>
                    </div>
                )}
            </div>

            <div className="text-center text-[9px] uppercase font-mono tracking-[0.18em] text-cyan-400/80 mt-8 leading-snug">
                Drag Globe to Rotate &bull; Scroll to Zoom &bull; Double click to Reset view
            </div>

            <div className="mt-6 pt-6 border-t border-white/5 flex justify-between items-center opacity-40">
                <div className="text-[8px] font-bold uppercase tracking-widest">
                    <span className="text-green-500 mr-2 animate-pulse">●</span> Linked Nations: {countryNames.length}
                </div>
                <div className="text-[8px] font-bold uppercase tracking-widest">
                    Encrypted Protocol: 0x882A
                </div>
            </div>
        </div>
      </div>

      <div className="fixed bottom-10 right-10 z-10 text-right pointer-events-none opacity-20">
          <p className="text-sm font-black uppercase tracking-[0.5em]">Mercury State: Stable</p>
          <p className="text-[10px] font-bold mt-1">N_SYNC: {countryNames.length * 24} Atoms</p>
      </div>
    </div>
  );
};

export default VRExperiencePage;
