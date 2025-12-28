import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { TOURS_DATA } from '../constants';

declare global {
  interface Window {
    THREE: any;
  }
}

// Define the type for mousePosition
type MousePosition = {
  x: number;
  y: number;
};

const countryCoords: { [key: string]: { lat: number; lon: number } } = {
  "United States": { lat: 39.8283, lon: -98.5795 }, "Canada": { lat: 56.1304, lon: -106.3468 }, "Mexico": { lat: 23.6345, lon: -102.5528 }, "United Kingdom": { lat: 55.3781, lon: -3.4360 }, "Germany": { lat: 51.1657, lon: 10.4515 }, "France": { lat: 46.2276, lon: 2.2137 }, "Australia": { lat: -25.2744, lon: 133.7751 }, "Japan": { lat: 36.2048, lon: 138.2529 }, "China": { lat: 35.8617, lon: 104.1954 }, "India": { lat: 20.5937, lon: 78.9629 }, "Brazil": { lat: -14.2350, lon: -51.9253 }, "South Africa": { lat: -30.5595, lon: 22.9375 }, "Nigeria": { lat: 9.0820, lon: 8.6753 }, "Russia": { lat: 61.5240, lon: 105.3188 }, "Spain": { lat: 40.4637, lon: -3.7492 }, "Italy": { lat: 41.8719, lon: 12.5674 }, "Argentina": { lat: -38.4161, lon: -63.6167 }, "New Zealand": { lat: -40.9006, lon: 174.8860 }, "Singapore": { lat: 1.3521, lon: 103.8198 },
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

function createAirplaneGeometry() {
    const THREE = window.THREE;
    const geom = new THREE.ConeGeometry(0.1, 0.4, 4);
    geom.rotateX(Math.PI / 2);
    geom.translate(0, 0, 0.2);
    return geom;
}

interface ThreeCanvasProps {
  mousePosition: MousePosition;
  scrollTop: number;
  journey: { origin?: string; destination?: string };
  globeSpeed: number;
}

const ThreeCanvas: React.FC<ThreeCanvasProps> = ({ mousePosition, scrollTop, journey, globeSpeed }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef(mousePosition);
  const scrollTopRef = useRef(scrollTop);
  const journeyRef = useRef(journey);
  const globeSpeedRef = useRef(globeSpeed);

  // Animation-related refs
  const globeGroupRef = useRef<any>(null);
  const journeyPathRef = useRef<any>(null);
  const journeyAirplaneRef = useRef<any>(null);
  const journeyCurveRef = useRef<any>(null);
  const journeyProgressRef = useRef(0);
  const targetQuaternionRef = useRef<any>(null);
  const initialQuaternionRef = useRef<any>(null);
  const pulseRingsRef = useRef<any[]>([]);
  
  // Advanced Particle System refs
  const particlesRef = useRef<{
    mesh: any;
    originalPositions: Float32Array;
    velocities: Float32Array;
  } | null>(null);


  useEffect(() => {
    mouseRef.current = mousePosition;
  }, [mousePosition]);

  useEffect(() => {
    scrollTopRef.current = scrollTop;
  }, [scrollTop]);

  useEffect(() => {
    globeSpeedRef.current = globeSpeed;
  }, [globeSpeed]);

   useEffect(() => {
    const THREE = window.THREE;
    if (journey && journeyRef.current !== journey && globeGroupRef.current && mountRef.current && THREE) {
        journeyRef.current = journey;
        
        if (journeyPathRef.current) {
            globeGroupRef.current.remove(journeyPathRef.current);
            journeyPathRef.current = null;
            journeyAirplaneRef.current = null;
            journeyCurveRef.current = null;
        }

        if (journey.origin && journey.destination && countryCoords[journey.origin] && countryCoords[journey.destination]) {
            const globeRadius = 5;
            const startLatLon = countryCoords[journey.origin];
            const endLatLon = countryCoords[journey.destination];

            const startVec = latLonToVector3(startLatLon.lat, startLatLon.lon, globeRadius);
            const endVec = latLonToVector3(endLatLon.lat, endLatLon.lon, globeRadius);

            const midPoint = new THREE.Vector3().addVectors(startVec, endVec).multiplyScalar(0.5);
            const midLength = midPoint.length();
            midPoint.normalize().multiplyScalar(midLength + endVec.distanceTo(startVec) * 0.4);

            const curve = new THREE.CatmullRomCurve3([startVec, midPoint, endVec]);
            journeyCurveRef.current = curve;
            const points = curve.getPoints(100);
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const material = new THREE.LineBasicMaterial({ color: 0x00F2FE, blending: THREE.AdditiveBlending, transparent: true, opacity: 0.8, linewidth: 2 });
            const curveObject = new THREE.Line(geometry, material);
            curveObject.name = "journeyCurve";

            const journeyGroup = new THREE.Group();
            journeyGroup.add(curveObject);
            
            const dotGeometry = new THREE.SphereGeometry(0.08, 16, 16);
            const dotMaterial = new THREE.MeshBasicMaterial({ color: 0x00F2FE });
            const startDot = new THREE.Mesh(dotGeometry, dotMaterial);
            startDot.name = "startDot";
            startDot.position.copy(startVec);
            const endDot = new THREE.Mesh(dotGeometry, dotMaterial);
            endDot.name = "endDot";
            endDot.position.copy(endVec);
            journeyGroup.add(startDot);
            journeyGroup.add(endDot);
            
            // Add pulse glow to dots
            const startLight = new THREE.PointLight(0x00F2FE, 2, 5);
            startLight.position.copy(startVec);
            const endLight = new THREE.PointLight(0x00F2FE, 2, 5);
            endLight.position.copy(endVec);
            journeyGroup.add(startLight);
            journeyGroup.add(endLight);

            const airplaneGeom = createAirplaneGeometry();
            const airplaneMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
            const airplane = new THREE.Mesh(airplaneGeom, airplaneMat);
            journeyAirplaneRef.current = airplane;
            journeyProgressRef.current = 0;
            journeyGroup.add(airplane);

            journeyPathRef.current = journeyGroup;
            globeGroupRef.current.add(journeyGroup);
            
        } else if (targetQuaternionRef.current && initialQuaternionRef.current) {
             targetQuaternionRef.current.copy(initialQuaternionRef.current);
        }
    }
  }, [journey]);

  useEffect(() => {
    const THREE = window.THREE;
    if (!mountRef.current || !THREE) return;

    const scene = new THREE.Scene();

    // --- SKYBOX ---
    const cubeLoader = new THREE.CubeTextureLoader();
    const skyboxTexture = cubeLoader.load([
        'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r128/examples/textures/cube/MilkyWay/dark-s_px.jpg',
        'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r128/examples/textures/cube/MilkyWay/dark-s_nx.jpg',
        'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r128/examples/textures/cube/MilkyWay/dark-s_py.jpg',
        'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r128/examples/textures/cube/MilkyWay/dark-s_ny.jpg',
        'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r128/examples/textures/cube/MilkyWay/dark-s_pz.jpg',
        'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r128/examples/textures/cube/MilkyWay/dark-s_nz.jpg',
    ]);
    scene.background = skyboxTexture;
    // --- END SKYBOX ---

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 12;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.outputEncoding = THREE.sRGBEncoding;
    mountRef.current.appendChild(renderer.domElement);
    
    const clock = new THREE.Clock();
    let flightPaths: { airplane: any, path: any, progress: number, speed: number }[] = [];

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 2); // Soft white light
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 1.5);
    sunLight.position.set(15, 10, 15);
    scene.add(sunLight);

    const rimLight = new THREE.SpotLight(0x8A2BE2, 5, 50, 0.5, 0.5, 1);
    rimLight.position.set(-10, 5, 15);
    rimLight.lookAt(0, 0, 0);
    scene.add(rimLight);

    const createStarfield = () => {
        const particleCount = 1000;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);
        const colors = new Float32Array(particleCount * 3);
        const color = new THREE.Color();

        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 300;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 300;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 300;
            sizes[i] = Math.random() * 0.15;
            
            const starType = Math.random();
            if (starType > 0.9) color.setHex(0xaaaaff);
            else if (starType > 0.7) color.setHex(0xffddaa);
            else color.setHex(0xffffff);

            colors[i * 3] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const material = new THREE.PointsMaterial({ 
            vertexColors: true, 
            size: 0.1, 
            transparent: true, 
            opacity: 0.4, 
        });
        
        const starfield = new THREE.Points(geometry, material);
        scene.add(starfield);
    };

    // --- GLIMPSE AI / NEURAL PARTICLE SYSTEM ---
    const createNeuralParticles = () => {
        const particleCount = 8000; // Increased density for more detail
        const positions = new Float32Array(particleCount * 3);
        const velocities = new Float32Array(particleCount * 3);
        const originalPositions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);

        const color1 = new THREE.Color(0x00F2FE); // Cyan
        const color2 = new THREE.Color(0x8A2BE2); // Purple

        for (let i = 0; i < particleCount; i++) {
            const isShell = Math.random() > 0.6; // More particles in the shell/cloud
            let x, y, z;

            if (isShell) {
                const r = 18 + Math.random() * 25; 
                const theta = Math.random() * Math.PI * 2;
                const phi = Math.acos((Math.random() * 2) - 1);
                x = r * Math.sin(phi) * Math.cos(theta);
                y = r * Math.sin(phi) * Math.sin(theta);
                z = r * Math.cos(phi);
            } else {
                x = (Math.random() - 0.5) * 110;
                y = (Math.random() - 0.5) * 70;
                z = (Math.random() - 0.5) * 70;
            }

            positions[i * 3] = x;
            positions[i * 3 + 1] = y;
            positions[i * 3 + 2] = z;

            originalPositions[i * 3] = x;
            originalPositions[i * 3 + 1] = y;
            originalPositions[i * 3 + 2] = z;
            
            // Initial Velocities
            velocities[i * 3] = 0;
            velocities[i * 3 + 1] = 0;
            velocities[i * 3 + 2] = 0;

            // Initial color calculation
            colors[i*3] = color1.r;
            colors[i*3+1] = color1.g;
            colors[i*3+2] = color1.b;

            // Varied sizes for depth and interest
            sizes[i] = Math.random() * 3.0 + 0.5;
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

        const getTexture = () => {
            const canvas = document.createElement('canvas');
            canvas.width = 32;
            canvas.height = 32;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
                grad.addColorStop(0, 'rgba(255,255,255,1)');
                grad.addColorStop(0.2, 'rgba(230,230,255,0.8)');
                grad.addColorStop(0.5, 'rgba(100,100,255,0.2)');
                grad.addColorStop(1, 'rgba(0,0,0,0)');
                ctx.fillStyle = grad;
                ctx.fillRect(0, 0, 32, 32);
            }
            const texture = new THREE.Texture(canvas);
            texture.needsUpdate = true;
            return texture;
        };

        const vertexShader = `
            attribute float size;
            varying vec3 vColor;
            void main() {
                vColor = color;
                vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                // Size attenuation: scale size based on inverse distance from camera
                gl_PointSize = size * (150.0 / -mvPosition.z);
                gl_Position = projectionMatrix * mvPosition;
            }
        `;

        const fragmentShader = `
            uniform sampler2D pointTexture;
            varying vec3 vColor;
            void main() {
                gl_FragColor = vec4(vColor, 1.0) * texture2D(pointTexture, gl_PointCoord);
                if (gl_FragColor.a < 0.1) discard;
            }
        `;

        const material = new THREE.ShaderMaterial({
            uniforms: {
                pointTexture: { value: getTexture() }
            },
            vertexShader,
            fragmentShader,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            transparent: true,
            vertexColors: true
        });

        const particles = new THREE.Points(geometry, material);
        particles.name = "neuralParticles";
        scene.add(particles);
        
        particlesRef.current = { mesh: particles, originalPositions, velocities };
    };

    const createGlobe = () => {
        const globeGroup = new THREE.Group();
        globeGroupRef.current = globeGroup;
        const GLOBE_RADIUS = 5;

        const loader = new THREE.TextureLoader();

        const earthGeo = new THREE.SphereGeometry(GLOBE_RADIUS, 128, 128);
        const earthMat = new THREE.MeshPhongMaterial({
            map: loader.load('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/textures/planets/earth_atmos_2048.jpg'),
            specularMap: loader.load('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/textures/planets/earth_specular_2048.jpg'),
            normalMap: loader.load('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/textures/planets/earth_normal_2048.jpg'),
            shininess: 12,
            specular: new THREE.Color(0x333333)
        });
        const earth = new THREE.Mesh(earthGeo, earthMat);
        globeGroup.add(earth);

        const cloudGeo = new THREE.SphereGeometry(GLOBE_RADIUS * 1.01, 128, 128);
        const cloudMat = new THREE.MeshPhongMaterial({
            map: loader.load('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/textures/planets/earth_clouds_1024.png'),
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide,
            depthWrite: false
        });
        const clouds = new THREE.Mesh(cloudGeo, cloudMat);
        clouds.name = "clouds";
        globeGroup.add(clouds);

        const vertexShader = `
            varying vec3 vNormal;
            void main() {
                vNormal = normalize(normalMatrix * normal);
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `;
        
        const fragmentShader = `
            varying vec3 vNormal;
            void main() {
                float intensity = pow(0.75 - dot(vNormal, vec3(0, 0, 1.0)), 4.0);
                gl_FragColor = vec4(0.3, 0.6, 1.0, 1.0) * intensity * 1.5;
            }
        `;
        
        const atmoGeo = new THREE.SphereGeometry(GLOBE_RADIUS * 1.2, 64, 64);
        const atmoMat = new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader,
            blending: THREE.AdditiveBlending,
            side: THREE.BackSide,
            transparent: true,
            depthWrite: false
        });
        const atmosphere = new THREE.Mesh(atmoGeo, atmoMat);
        globeGroup.add(atmosphere);
        
        scene.add(globeGroup);
        initialQuaternionRef.current = globeGroup.quaternion.clone();
        targetQuaternionRef.current = globeGroup.quaternion.clone();
        return GLOBE_RADIUS;
    }

    const createDestinationMarkers = (globeRadius: number) => {
        if (!globeGroupRef.current) return;
        
        pulseRingsRef.current = []; // Clear previous

        const markerGeometry = new THREE.SphereGeometry(0.05, 16, 16);
        const markerMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff }); 
        
        const barGeo = new THREE.CylinderGeometry(0.02, 0.02, 1, 8);
        barGeo.rotateX(Math.PI / 2); // Align with Z axis
        barGeo.translate(0, 0, 0.5); // Base at origin

        TOURS_DATA.forEach((tour, index) => {
            const position = latLonToVector3(tour.latitude, tour.longitude, globeRadius);
            
            // 1. Surface Marker
            const marker = new THREE.Mesh(markerGeometry, markerMaterial);
            marker.position.copy(position);
            globeGroupRef.current.add(marker);
            
            // 2. Data Bar (Height = Popularity/Reviews simulation)
            const height = 0.2 + (Math.random() * 0.8); // Random height for "reviews"
            const barColor = new THREE.Color().setHSL(0.6 + (Math.random() * 0.1), 1.0, 0.5); // Varied Blue/Purple
            const barMat = new THREE.MeshBasicMaterial({ color: barColor, transparent: true, opacity: 0.6 });
            const bar = new THREE.Mesh(barGeo, barMat);
            bar.position.copy(position);
            bar.lookAt(position.clone().multiplyScalar(2)); // Z points OUT.
            bar.scale.set(1, 1, height);
            globeGroupRef.current.add(bar);

            // 3. Pulse Ring
            const ringGeo = new THREE.RingGeometry(0.1, 0.13, 32);
            const ringMat = new THREE.MeshBasicMaterial({ 
                color: barColor, 
                side: THREE.DoubleSide, 
                transparent: true, 
                opacity: 0.5 
            });
            const ring = new THREE.Mesh(ringGeo, ringMat);
            ring.position.copy(position);
            ring.lookAt(new THREE.Vector3(0,0,0));
            
            ring.userData = { 
                currentScale: 1, 
                growthSpeed: 0.2 + Math.random() * 0.5,
                maxScale: 1.5 + (height * 0.5) 
            };
            pulseRingsRef.current.push(ring);
            globeGroupRef.current.add(ring);
        });
    };

    const createFlightPaths = (globeRadius: number) => {
        if (!globeGroupRef.current) return;
        
        const airplaneGeometry = new THREE.SphereGeometry(0.025, 8, 8);
        const pathMaterial = new THREE.LineBasicMaterial({ 
            color: 0xffffff, 
            transparent: true, 
            opacity: 0.08, 
            blending: THREE.AdditiveBlending 
        });

        // Use first few tours as "Hubs" to connect to others
        const hubs = [0, 5, 10]; // Indices in TOURS_DATA (approx Dubai, Europe, etc)
        
        TOURS_DATA.forEach((tour, idx) => {
            // Determine source: either a Hub or previous tour (chain)
            // Let's connect every tour to the nearest Hub or random Hub
            const hubIdx = hubs[idx % hubs.length];
            if(hubIdx === idx) return; // Don't connect to self

            const startTour = TOURS_DATA[hubIdx];
            const endTour = tour;

            const startVec = latLonToVector3(startTour.latitude, startTour.longitude, globeRadius);
            const endVec = latLonToVector3(endTour.latitude, endTour.longitude, globeRadius);
            
            const dist = startVec.distanceTo(endVec);
            const mid = new THREE.Vector3().addVectors(startVec, endVec).multiplyScalar(0.5).normalize().multiplyScalar(globeRadius + 0.2 + (dist * 0.5));

            const curve = new THREE.CatmullRomCurve3([startVec, mid, endVec]);
            const points = curve.getPoints(40);
            const geo = new THREE.BufferGeometry().setFromPoints(points);
            const line = new THREE.Line(geo, pathMaterial);
            globeGroupRef.current.add(line);

            // Add particles/planes
            const count = Math.floor(Math.random() * 2) + 1; // 1 or 2 planes per path
            for(let i=0; i<count; i++) {
                const plane = new THREE.Mesh(airplaneGeometry, new THREE.MeshBasicMaterial({ color: 0x00F2FE }));
                flightPaths.push({ 
                    airplane: plane, 
                    path: curve, 
                    progress: Math.random(), 
                    speed: 0.005 + Math.random() * 0.01 
                });
                globeGroupRef.current.add(plane);
            }
        });
    }
    
    createStarfield();
    const globeRadius = createGlobe();
    createDestinationMarkers(globeRadius);
    createFlightPaths(globeRadius);
    createNeuralParticles();

    const animate = () => {
        requestAnimationFrame(animate);
        const delta = clock.getDelta();
        const time = clock.getElapsedTime();

        const targetCameraY = scrollTopRef.current * 0.005;
        camera.position.y += (targetCameraY - camera.position.y) * 0.05;
        camera.lookAt(scene.position);
        
        if(globeGroupRef.current) {
            globeGroupRef.current.rotation.y += delta * globeSpeedRef.current * 0.5;
            
            const clouds = globeGroupRef.current.getObjectByName("clouds");
            if (clouds) {
                clouds.rotation.y += delta * 0.02;
            }

            if (targetQuaternionRef.current) {
                 globeGroupRef.current.quaternion.slerp(targetQuaternionRef.current, 0.02);
            }
            
            if (journeyPathRef.current) {
                const startDot = journeyPathRef.current.getObjectByName("startDot");
                const endDot = journeyPathRef.current.getObjectByName("endDot");
                if (startDot && endDot) {
                    const scale = 1 + Math.sin(time * 4) * 0.3;
                    startDot.scale.set(scale, scale, scale);
                    endDot.scale.set(scale, scale, scale);
                }
            }

            if (journeyAirplaneRef.current && journeyCurveRef.current) {
                journeyProgressRef.current = (journeyProgressRef.current + delta * 0.15) % 1;
                const airplane = journeyAirplaneRef.current;
                const path = journeyCurveRef.current;
                const position = path.getPointAt(journeyProgressRef.current);
                airplane.position.copy(position);
                const tangent = path.getTangentAt(journeyProgressRef.current).normalize();
                const up = position.clone().normalize();
                const lookAtPosition = position.clone().add(tangent);
                airplane.up.copy(up);
                airplane.lookAt(lookAtPosition);
            }
        }
        
        flightPaths.forEach(fp => {
            fp.progress = (fp.progress + delta * fp.speed) % 1;
            const position = fp.path.getPointAt(fp.progress);
            fp.airplane.position.copy(position);
        });

        // Animate Pulse Rings
        pulseRingsRef.current.forEach(ring => {
            ring.userData.currentScale += delta * ring.userData.growthSpeed;
            if (ring.userData.currentScale > ring.userData.maxScale) {
                ring.userData.currentScale = 1;
                ring.material.opacity = 0.5;
            } else {
                ring.material.opacity = Math.max(0, 0.5 * (1 - (ring.userData.currentScale - 1) / (ring.userData.maxScale - 1)));
            }
            ring.scale.set(ring.userData.currentScale, ring.userData.currentScale, ring.userData.currentScale);
        });

        // --- GLIMPSE / NEURAL PARTICLE ANIMATION ---
        if (particlesRef.current) {
            const { mesh, originalPositions, velocities } = particlesRef.current;
            const positions = mesh.geometry.attributes.position.array;
            const colors = mesh.geometry.attributes.color.array; // Access colors
            
            // Map mouse to world space roughly
            const mouseX = mouseRef.current.x * 40; 
            const mouseY = mouseRef.current.y * 30;
            const mouseVec = new THREE.Vector3(mouseX, mouseY, 0); 

            // Colors for dynamic interpolation
            const color1 = new THREE.Color(0x00F2FE); // Cyan
            const color2 = new THREE.Color(0x8A2BE2); // Purple
            const colorHot = new THREE.Color(0xFF0080); // Hot Pink/Magenta

            for (let i = 0; i < positions.length / 3; i++) {
                const ix = i * 3;
                const iy = i * 3 + 1;
                const iz = i * 3 + 2;

                const px = positions[ix];
                const py = positions[iy];
                const pz = positions[iz];

                const ox = originalPositions[ix];
                const oy = originalPositions[iy];
                const oz = originalPositions[iz];

                // 1. Elasticity (Return to original position)
                const dx = ox - px;
                const dy = oy - py;
                const dz = oz - pz;

                velocities[ix] += dx * 0.003; 
                velocities[iy] += dy * 0.003;
                velocities[iz] += dz * 0.003;

                // 2. Mouse Interaction
                const dxm = px - mouseVec.x;
                const dym = py - mouseVec.y;
                const dzm = pz - mouseVec.z;
                const distSq = dxm*dxm + dym*dym + dzm*dzm;
                
                // Enhanced Swirl & Repulsion - INCREASED SENSITIVITY
                if (distSq < 2500) { // Interaction radius increased (50^2)
                    const dist = Math.sqrt(distSq);
                    const force = (1.0 - dist / 50.0); // Strength based on distance

                    if (force > 0) {
                        const f = force * 0.5; // Increased force factor
                        
                        // Rotational force (vortex around mouse Z-axis)
                        velocities[ix] += -dym * f * 3.0; 
                        velocities[iy] += dxm * f * 3.0;
                        
                        // Radial repulsion
                        velocities[ix] += dxm * f * 1.5;
                        velocities[iy] += dym * f * 1.5;
                        velocities[iz] += dzm * f * 1.5;
                    }
                }

                // 3. Ambient Flow (Noise-like)
                const noiseScale = 0.04;
                velocities[ix] += Math.sin(py * noiseScale + time * 0.5) * 0.0015;
                velocities[iy] += Math.cos(pz * noiseScale + time * 0.4) * 0.0015;
                velocities[iz] += Math.sin(px * noiseScale + time * 0.3) * 0.0015;

                // Damping
                velocities[ix] *= 0.94;
                velocities[iy] *= 0.94;
                velocities[iz] *= 0.94;

                // Update Position
                positions[ix] += velocities[ix];
                positions[iy] += velocities[iy];
                positions[iz] += velocities[iz];

                // 4. Enhanced Dynamic Color
                const speed = Math.sqrt(velocities[ix]**2 + velocities[iy]**2 + velocities[iz]**2);
                const energy = Math.min(1, speed * 6.0); // Amplify speed for "heat"
                
                // Base gradient color based on position in cloud
                const distOrigin = Math.sqrt(px*px + py*py + pz*pz);
                const t = Math.min(1, distOrigin / 70);
                
                // Interpolate Base (Cyan -> Purple)
                const rBase = color1.r + (color2.r - color1.r) * t;
                const gBase = color1.g + (color2.g - color1.g) * t;
                const bBase = color1.b + (color2.b - color1.b) * t;

                // Interpolate Final (Base -> Hot Pink) based on energy/velocity
                colors[ix] = rBase + (colorHot.r - rBase) * energy;
                colors[iy] = gBase + (colorHot.g - gBase) * energy;
                colors[iz] = bBase + (colorHot.b - bBase) * energy;
            }
            mesh.geometry.attributes.position.needsUpdate = true;
            mesh.geometry.attributes.color.needsUpdate = true;
        }

        renderer.render(scene, camera);
    };
    animate();

    const onWindowResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', onWindowResize);

    return () => {
        window.removeEventListener('resize', onWindowResize);
        mountRef.current?.removeChild(renderer.domElement);
        renderer.dispose();
    };
  }, []);

  return <div ref={mountRef} className="fixed top-0 left-0 w-full h-full z-0 pointer-events-none" />;
};

const VRExperiencePage: React.FC = () => {
  const [mousePosition, setMousePosition] = useState<MousePosition>({ x: 0, y: 0 });
  const [scrollTop, setScrollTop] = useState(0);
  const [journey, setJourney] = useState<{ origin?: string; destination?: string }>({
    origin: 'United States',
    destination: 'Japan'
  });
  const [globeSpeed, setGlobeSpeed] = useState(0.1);
  const [insights, setInsights] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      setMousePosition({
        x: (event.clientX / window.innerWidth) * 2 - 1,
        y: -(event.clientY / window.innerHeight) * 2 + 1,
      });
    };

    const handleScroll = () => {
      setScrollTop(window.scrollY);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleOriginChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setJourney(prev => ({ ...prev, origin: e.target.value }));
  };

  const handleDestinationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setJourney(prev => ({ ...prev, destination: e.target.value }));
  };

  const handleSpeedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGlobeSpeed(parseFloat(e.target.value));
  };

  const handleFetchInsights = async () => {
    if (!journey.origin || !journey.destination) return;

    setIsLoading(true);
    setInsights('');
    setError(null);

    const systemPrompt = "You are a witty and knowledgeable travel guide. Provide a single, interesting fun fact or insight comparing the two locations. Be concise (2-3 sentences).";
    const userQuery = `What's an interesting fact about the relationship or travel between ${journey.origin} and ${journey.destination}?`;
    
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: userQuery,
            config: {
                systemInstruction: systemPrompt
            }
        });

        if (response.text) {
            setInsights(response.text);
        } else {
            throw new Error("No content generated.");
        }
    } catch (err: any) {
      console.error("Error fetching insights:", err);
      setError("Sorry, I couldn't fetch insights for this journey. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gray-900 text-white min-h-[200vh] relative overflow-x-hidden">
      <ThreeCanvas
        mousePosition={mousePosition}
        scrollTop={scrollTop}
        journey={journey}
        globeSpeed={globeSpeed}
      />
      
      <div className="relative z-20 p-4 max-w-md pointer-events-auto pt-32 mx-auto md:mx-0 md:ml-10">
        <h1 className="text-4xl font-bold mb-6 font-cinzel text-transparent bg-clip-text bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)]">
            Vanhsya Global Explorer
        </h1>
        <div className="space-y-6 bg-gray-800/60 backdrop-blur-md p-6 rounded-xl shadow-2xl border border-gray-700">
          <div>
            <label htmlFor="origin" className="block text-sm font-medium text-gray-300 mb-1">Origin:</label>
            <div className="relative">
                <select
                id="origin"
                value={journey.origin}
                onChange={handleOriginChange}
                className="block w-full bg-gray-700/80 border border-gray-600 text-white rounded-lg shadow-sm p-3 focus:ring-2 focus:ring-[var(--accent-secondary)] focus:outline-none appearance-none"
                >
                {countryNames.map(name => <option key={`origin-${name}`} value={name}>{name}</option>)}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </div>
            </div>
          </div>
          
          <div>
            <label htmlFor="destination" className="block text-sm font-medium text-gray-300 mb-1">Destination:</label>
            <div className="relative">
                <select
                id="destination"
                value={journey.destination}
                onChange={handleDestinationChange}
                className="block w-full bg-gray-700/80 border border-gray-600 text-white rounded-lg shadow-sm p-3 focus:ring-2 focus:ring-[var(--accent-secondary)] focus:outline-none appearance-none"
                >
                {countryNames.map(name => <option key={`dest-${name}`} value={name}>{name}</option>)}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </div>
            </div>
          </div>

          <div>
            <label htmlFor="speed" className="block text-sm font-medium text-gray-300 mb-2">
              Rotation Speed: {Math.round(globeSpeed * 100)}%
            </label>
            <input
              type="range"
              id="speed"
              min="0"
              max="1"
              step="0.05"
              value={globeSpeed}
              onChange={handleSpeedChange}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[var(--accent-primary)]"
            />
          </div>

          <div className="pt-4 border-t border-gray-700">
            <button
              onClick={handleFetchInsights}
              disabled={isLoading || !journey.origin || !journey.destination}
              className="w-full bg-[var(--accent-primary)] hover:brightness-110 text-black font-bold py-3 px-4 rounded-lg transition duration-300 disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed shadow-lg transform hover:scale-[1.02] active:scale-95 flex justify-center items-center"
            >
              {isLoading ? (
                 <svg className="animate-spin h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              ) : '✨ Get Journey Insights'}
            </button>
            
            <div className="mt-4 min-h-[120px] p-4 bg-gray-900/50 rounded-lg border border-gray-700 relative">
              <h3 className="text-sm font-semibold text-[var(--accent-secondary)] mb-2 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                AI Insights:
              </h3>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              {insights && !isLoading && (
                <div className="text-gray-200 text-sm leading-relaxed animate-fadeIn">
                    {insights}
                </div>
              )}
              {!isLoading && !error && !insights && (
                <p className="text-gray-500 text-sm italic">Select a journey and click the button to see what AI thinks about your trip!</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="absolute top-[90vh] left-0 p-8 z-20 text-center w-full pointer-events-none">
        <div className="animate-bounce text-[var(--accent-primary)]">
            <p className="text-lg font-semibold tracking-widest">SCROLL TO EXPLORE</p>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto mt-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
        </div>
      </div>
      
      <section className="relative z-20 py-32 px-6 max-w-6xl mx-auto text-center pointer-events-auto">
        <h2 className="text-4xl font-bold mb-8 text-[var(--accent-secondary)]">Experience the World in 3D</h2>
        <p className="text-xl text-gray-300 leading-relaxed max-w-4xl mx-auto">
            Vanhsya brings travel to your screen like never before. Our interactive WebGL globe allows you to visualize flight paths, explore distances, and discover the connections between nations. Coupled with AI-driven insights, planning your next adventure becomes an immersive experience.
        </p>
      </section>
    </div>
  );
};

export default VRExperiencePage;
