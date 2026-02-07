
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";

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

  useEffect(() => {
    globeSpeedRef.current = globeSpeed;
  }, [globeSpeed]);

  useEffect(() => {
    const THREE = window.THREE;
    if (!mountRef.current || !THREE) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 12;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    mountRef.current.appendChild(renderer.domElement);
    
    const clock = new THREE.Clock();

    // --- LIGHTING ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    const pointLight = new THREE.PointLight(0x00F2FE, 2, 50);
    pointLight.position.set(10, 10, 10);
    scene.add(pointLight);

    const globeGroup = new THREE.Group();
    globeGroupRef.current = globeGroup;
    const RADIUS = 5;

    // --- GLOBE MESH ---
    const loader = new THREE.TextureLoader();
    const earthGeo = new THREE.SphereGeometry(RADIUS, 64, 64);
    const earthMat = new THREE.MeshStandardMaterial({
        map: loader.load('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/textures/planets/earth_atmos_2048.jpg'),
        roughness: 0.5,
        metalness: 0.5
    });
    const earth = new THREE.Mesh(earthGeo, earthMat);
    globeGroup.add(earth);

    // --- MERCURY FLUID LAYER (Metallic Highlight) ---
    const mercuryGeo = new THREE.SphereGeometry(RADIUS * 1.005, 64, 64);
    const mercuryMat = new THREE.MeshPhongMaterial({
        color: 0x00F2FE,
        specular: 0xffffff,
        shininess: 100,
        transparent: true,
        opacity: 0.2,
        blending: THREE.AdditiveBlending
    });
    const mercury = new THREE.Mesh(mercuryGeo, mercuryMat);
    mercuryLayerRef.current = mercury;
    globeGroup.add(mercury);

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

    scene.add(globeGroup);

    // --- ATMOSPHERE ---
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
                gl_FragColor = vec4(0.3, 0.6, 1.0, 1.0) * intensity;
            }
        `,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
        transparent: true
    });
    scene.add(new THREE.Mesh(atmoGeo, atmoMat));

    const animate = () => {
        requestAnimationFrame(animate);
        const delta = clock.getDelta();
        const time = clock.getElapsedTime();

        if (globeGroupRef.current) {
            globeGroupRef.current.rotation.y += delta * globeSpeedRef.current * 0.2;
            
            if (mercuryLayerRef.current) {
                mercuryLayerRef.current.scale.setScalar(1 + Math.sin(time * 0.5) * 0.005);
                mercuryLayerRef.current.material.opacity = 0.15 + Math.sin(time * 2) * 0.05;
            }
        }

        atomsRef.current.forEach((atom, i) => {
            // Animate orbits and cores
            atom.children.forEach((child: any, j: number) => {
                if (j > 0) {
                    // It's an orbit ring - rotate on multiple axes for more chaos
                    child.rotation.x += delta * (0.5 + j * 0.2);
                    child.rotation.y += delta * (0.3 + j * 0.3);
                    child.rotation.z += delta * (1.5 + j);
                } else {
                    // It's the core - rhythmic pulse
                    const pulse = 1 + Math.sin(time * 4 + i) * 0.25;
                    child.scale.set(pulse, pulse, pulse);
                }
            });

            // Floating movement for the entire node
            const basePos = atom.position.clone().normalize().multiplyScalar(RADIUS + 0.1);
            const floatScale = 0.08 * Math.sin(time * 2.5 + i);
            atom.position.copy(basePos.add(atom.position.clone().normalize().multiplyScalar(floatScale)));
        });

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
        mountRef.current?.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} className="fixed top-0 left-0 w-full h-full z-0 bg-black" />;
};

const VRExperiencePage: React.FC = () => {
  const [journey, setJourney] = useState({ origin: 'United States', destination: 'UAE' });
  const [insights, setInsights] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const getInsights = async () => {
    setIsLoading(true);
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Provide a quick, futuristic travel insight between ${journey.origin} and ${journey.destination}. Mention how the 'Vanhsya Atomic Network' has digitized this corridor. Max 2 sentences.`,
        });
        setInsights(response.text || '');
    } catch (e) {
        setInsights("Link degraded. Neural packets lost.");
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="bg-black text-white min-h-screen relative font-mono overflow-hidden">
      <ThreeCanvas journey={journey} globeSpeed={0.5} />

      <div className="relative z-10 p-6 md:p-12 max-w-xl">
        <div className="bg-black/40 backdrop-blur-xl border border-white/10 p-8 rounded-[2rem] shadow-2xl">
            <h1 className="text-3xl font-black font-cinzel mb-2 tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">
                ATOMIC EXPLORER
            </h1>
            <p className="text-[10px] uppercase tracking-[0.4em] text-gray-500 mb-8 font-bold">Vanhsya Neural Link v8.0</p>

            <div className="space-y-6">
                <div>
                    <label className="text-[10px] font-black text-cyan-400 uppercase tracking-widest mb-2 block">Origin Core</label>
                    <select 
                        value={journey.origin} 
                        onChange={e => setJourney({...journey, origin: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-cyan-500 transition-all text-white font-bold"
                    >
                        {countryNames.map(n => <option key={n} value={n} className="bg-zinc-900">{n}</option>)}
                    </select>
                </div>
                <div>
                    <label className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-2 block">Destination Node</label>
                    <select 
                        value={journey.destination} 
                        onChange={e => setJourney({...journey, destination: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-purple-500 transition-all text-white font-bold"
                    >
                        {countryNames.map(n => <option key={n} value={n} className="bg-zinc-900">{n}</option>)}
                    </select>
                </div>

                <div className="pt-4">
                    <button 
                        onClick={getInsights}
                        disabled={isLoading}
                        className="w-full py-4 bg-gradient-to-r from-cyan-600 to-purple-600 rounded-xl font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-cyan-500/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
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

            <div className="mt-10 pt-10 border-t border-white/5 flex justify-between items-center opacity-40">
                <div className="text-[8px] font-bold uppercase tracking-widest">
                    <span className="text-green-500 mr-2">●</span> Linked Nations: {countryNames.length}
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
