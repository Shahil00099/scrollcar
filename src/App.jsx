import React, { useRef, useLayoutEffect, useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, ContactShadows, useGLTF } from '@react-three/drei';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// Color palette options
const COLOR_PALETTE = [
  { name: 'Crimson Red', hex: '#d11111' },
  { name: 'Electric Blue', hex: '#0066ff' },
  { name: 'Midnight Black', hex: '#111111' },
  { name: 'Cyber Gold', hex: '#e6b800' },
  { name: 'Pure White', hex: '#ffffff' },
];

// 3D Car Model Component using BMW M4 file
function CarModel({ carColor }) {
  const groupRef = useRef();
  
  // Prepends base path /scrollcar/ automatically on production
  const modelPath = `${import.meta.env.BASE_URL}models/car.glb`;
  const { scene } = useGLTF(modelPath);

  // Dynamic Color Paint Swap
  useLayoutEffect(() => {
    scene.traverse((child) => {
      if (child.isMesh && child.material) {
        const matName = child.material.name.toLowerCase();
        const meshName = child.name.toLowerCase();
        
        if (
          matName.includes('body') || 
          matName.includes('paint') || 
          matName.includes('car_paint') ||
          matName.includes('primary') ||
          meshName.includes('body')
        ) {
          child.material.color.set(carColor);
        }
      }
    });
  }, [scene, carColor]);

  // GSAP Scroll Timeline
  useLayoutEffect(() => {
    if (!groupRef.current) return;

    const ctx = gsap.context(() => {
      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: '#scroll-container',
          start: 'top top',
          end: 'bottom bottom',
          scrub: 1,
        },
      });

      // Section 1 -> 2: Rotate to side view
      timeline.to(groupRef.current.rotation, { y: Math.PI / 2, duration: 2 }, 0);
      timeline.to(groupRef.current.position, { x: 1.5, z: 0 }, 0);

      // Section 2 -> 3: Rotate to rear angle
      timeline.to(groupRef.current.rotation, { y: Math.PI * 1.25, duration: 2 }, 2);
      timeline.to(groupRef.current.position, { x: -1.5, z: 1 }, 2);

      // Section 3 -> 4: Rotate to front for customizer
      timeline.to(groupRef.current.rotation, { y: Math.PI * 2, duration: 2 }, 4);
      timeline.to(groupRef.current.position, { x: 0, z: 2 }, 4);
    });

    // Refresh ScrollTrigger so GSAP recognizes page dimensions
    setTimeout(() => {
      ScrollTrigger.refresh();
    }, 100);

    return () => ctx.revert();
  }, [scene]);

  return (
    <group ref={groupRef} position={[0, -0.5, 0]}>
      <primitive object={scene} scale={1} />
    </group>
  );
}

useGLTF.preload(`${import.meta.env.BASE_URL}models/car.glb`); // ✅ Fixed

export default function App() {
  const [selectedColor, setSelectedColor] = useState(COLOR_PALETTE[0].hex);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div id="scroll-container" className="relative min-h-[400vh] bg-neutral-950 text-white font-sans selection:bg-red-600">
      
      {/* 1. Header Navigation */}
      <header className="fixed top-0 left-0 w-full z-50 backdrop-blur-md bg-neutral-950/70 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <a href="#" className="text-2xl font-black tracking-widest text-white hover:text-red-500 transition-colors">
            APEX<span className="text-red-600">.</span>EV
          </a>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium tracking-wide">
            {['Overview', 'Aerodynamics', 'Performance', 'Customizer'].map((item, idx) => (
              <a
                key={idx}
                href={`#section-${idx + 1}`}
                className="text-neutral-300 hover:text-white hover:scale-105 transition-all relative group py-1"
              >
                {item}
                <span className="absolute bottom-0 left-0 w-0 h[2px] bg-red-600 group-hover:w-full transition-all" />
              </a>
            ))}
          </nav>

          <div className="hidden md:block">
            <button className="px-6 py-2.5 rounded-full bg-red-600 text-white text-sm font-semibold hover:bg-red-700 hover:shadow-lg hover:shadow-red-600/30 hover:-translate-y-0.5 transition-all">
              Order Now
            </button>
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-neutral-300 hover:text-white p-2"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden bg-neutral-900/95 border-b border-white/10 px-6 py-4 flex flex-col gap-4">
            {['Overview', 'Aerodynamics', 'Performance', 'Customizer'].map((item, idx) => (
              <a
                key={idx}
                href={`#section-${idx + 1}`}
                onClick={() => setMobileMenuOpen(false)}
                className="text-neutral-300 hover:text-red-500 text-lg font-medium py-1"
              >
                {item}
              </a>
            ))}
            <button className="w-full py-3 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700">
              Order Now
            </button>
          </div>
        )}
      </header>

      {/* 2. Fixed 3D Canvas Background */}
      <div className="fixed inset-0 w-full h-screen z-0 pointer-events-none">
        <Canvas camera={{ position: [0, 1.5, 5], fov: 45 }}>
          <ambientLight intensity={0.8} />
          <directionalLight position={[10, 10, 5]} intensity={1.5} />
          <Suspense fallback={null}>
            <CarModel carColor={selectedColor} />
            <Environment preset="city" />
            <ContactShadows position={[0, -0.5, 0]} opacity={0.6} scale={10} blur={2} far={4} />
          </Suspense>
        </Canvas>
      </div>

      {/* 3. HTML Content Overlay */}
      <div className="relative z-10 pointer-events-none">
        <section id="section-1" className="h-screen flex items-center justify-center px-6">
          <div className="pointer-events-auto max-w-xl text-center backdrop-blur-md bg-neutral-900/60 p-8 md:p-12 rounded-3xl border border-white/10 shadow-2xl">
            <span className="text-xs uppercase tracking-widest text-red-500 font-semibold mb-2 block">The Next Generation</span>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-4 bg-gradient-to from-white via-neutral-200 to-neutral-400 bg-clip-text text-transparent">
              HYPERDRIVE V10
            </h1>
            <p className="text-neutral-400 text-sm md:text-base leading-relaxed mb-6">
              Engineered beyond limits. Experience seamless electric acceleration matched with active aerodynamic precision.
            </p>
            <div className="flex items-center justify-center gap-2 text-neutral-400 text-xs tracking-wider animate-bounce">
              <span>SCROLL TO EXPLORE</span>
            </div>
          </div>
        </section>

        <section id="section-2" className="h-screen flex items-center justify-start px-6 md:px-20">
          <div className="pointer-events-auto max-w-md backdrop-blur-md bg-neutral-900/60 p-8 rounded-3xl border border-white/10 shadow-2xl hover:border-red-500/40 transition-all">
            <span className="text-xs uppercase tracking-widest text-red-500 font-semibold mb-2 block">Aerodynamic Engineering</span>
            <h2 className="text-3xl font-bold mb-3">0.21 Cd Drag Coefficient</h2>
            <p className="text-neutral-400 text-sm leading-relaxed mb-4">
              Chassis sculpted to deliver optimal downforce and maximum energy efficiency across high speeds.
            </p>
          </div>
        </section>

        <section id="section-3" className="h-screen flex items-center justify-end px-6 md:px-20">
          <div className="pointer-events-auto max-w-md backdrop-blur-md bg-neutral-900/60 p-8 rounded-3xl border border-white/10 shadow-2xl hover:border-red-500/40 transition-all">
            <span className="text-xs uppercase tracking-widest text-red-500 font-semibold mb-2 block">Performance Matrix</span>
            <h2 className="text-3xl font-bold mb-3">1,020 HP Dual Motor</h2>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-red-500/50 transition-all">
                <span className="text-3xl font-black text-red-500">1.9s</span>
                <p className="text-xs text-neutral-300 mt-1">0-60 MPH</p>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-red-500/50 transition-all">
                <span className="text-3xl font-black text-white">210+</span>
                <p className="text-xs text-neutral-300 mt-1">Top Speed (MPH)</p>
              </div>
            </div>
          </div>
        </section>

        <section id="section-4" className="h-screen flex items-center justify-center px-6">
          <div className="pointer-events-auto max-w-xl text-center backdrop-blur-md bg-neutral-900/70 p-8 md:p-10 rounded-3xl border border-white/10 shadow-2xl">
            <span className="text-xs uppercase tracking-widest text-red-500 font-semibold mb-2 block">Personal Studio</span>
            <h2 className="text-3xl font-bold mb-3">SELECT YOUR PAINT FINISH</h2>
            <p className="text-neutral-400 text-sm mb-6">Choose a signature color to customize your vehicle in real-time.</p>

            <div className="flex items-center justify-center gap-4 mb-8">
              {COLOR_PALETTE.map((color, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedColor(color.hex)}
                  title={color.name}
                  className={`w-10 h-10 rounded-full border-2 transition-all duration-300 hover:scale-125 ${
                    selectedColor === color.hex
                      ? 'border-red-500 scale-110 shadow-lg shadow-red-500/50'
                      : 'border-white/20 hover:border-white'
                  }`}
                  style={{ backgroundColor: color.hex }}
                />
              ))}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-red-600 text-white font-bold hover:bg-red-700 hover:scale-105 active:scale-95 transition-all">
                Reserve Vehicle
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* 4. Footer */}
      <footer className="relative z-10 border-t border-white/10 bg-neutral-950/90 backdrop-blur-lg py-12 text-center text-xs text-neutral-500">
        <p>© 2026 APEX Motors Inc. All rights reserved.</p>
      </footer>
    </div>
  );
}