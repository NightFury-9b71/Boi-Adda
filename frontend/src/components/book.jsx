import React, { useState, useRef, useEffect, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, useTexture } from '@react-three/drei';
import * as THREE from 'three';

// Book component with page flipping
function Book({ position, bookData, onOpen }) {
  const meshRef = useRef();
  const [hovered, setHovered] = useState(false);
  
  useFrame((state) => {
    if (meshRef.current && hovered) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 2) * 0.05;
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 3) * 0.02;
    }
  });

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        onClick={onOpen}
        castShadow
      >
        <boxGeometry args={[1, 1.4, 0.15]} />
        <meshStandardMaterial color={bookData.color} roughness={0.8} metalness={0.2} />
      </mesh>
      
      {/* Book spine decoration */}
      <mesh position={[0, 0, -0.076]} castShadow>
        <boxGeometry args={[1, 1.4, 0.002]} />
        <meshStandardMaterial color={bookData.spineColor} />
      </mesh>
    </group>
  );
}

// Animated page component
function Page({ position, rotation, content, side, isFlipping, flipProgress }) {
  const meshRef = useRef();
  
  useFrame(() => {
    if (meshRef.current && isFlipping) {
      meshRef.current.rotation.y = rotation[1] + (Math.PI * flipProgress);
    }
  });

  return (
    <mesh ref={meshRef} position={position} rotation={rotation} castShadow receiveShadow>
      <boxGeometry args={[0.9, 1.3, 0.01]} />
      <meshStandardMaterial 
        color="#f5f5dc" 
        roughness={0.9}
        side={THREE.DoubleSide}
      />
      
      {/* Page content overlay */}
      <mesh position={[0, 0, 0.006]}>
        <planeGeometry args={[0.8, 1.2]} />
        <meshBasicMaterial 
          color="#000000" 
          transparent 
          opacity={0.1}
          side={side === 'front' ? THREE.FrontSide : THREE.BackSide}
        />
      </mesh>
    </mesh>
  );
}

// Open book with flippable pages
function OpenBook({ bookData, onClose }) {
  const [currentPage, setCurrentPage] = useState(0);
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipProgress, setFlipProgress] = useState(0);
  const groupRef = useRef();

  const flipToNext = () => {
    if (currentPage < bookData.pages.length - 2 && !isFlipping) {
      setIsFlipping(true);
      let progress = 0;
      const interval = setInterval(() => {
        progress += 0.05;
        setFlipProgress(progress);
        if (progress >= 1) {
          clearInterval(interval);
          setCurrentPage(prev => prev + 2);
          setIsFlipping(false);
          setFlipProgress(0);
        }
      }, 16);
    }
  };

  const flipToPrev = () => {
    if (currentPage > 0 && !isFlipping) {
      setCurrentPage(prev => prev - 2);
    }
  };

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* Left page */}
      <Page
        position={[-0.5, 0, 0]}
        rotation={[0, 0, 0]}
        content={bookData.pages[currentPage]}
        side="front"
        isFlipping={false}
        flipProgress={0}
      />
      
      {/* Right page */}
      <Page
        position={[0.5, 0, 0]}
        rotation={[0, 0, 0]}
        content={bookData.pages[currentPage + 1]}
        side="front"
        isFlipping={isFlipping}
        flipProgress={flipProgress}
      />

      {/* Navigation buttons (invisible click areas) */}
      <mesh position={[-0.5, -0.8, 0.1]} onClick={flipToPrev}>
        <planeGeometry args={[0.4, 0.2]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
      
      <mesh position={[0.5, -0.8, 0.1]} onClick={flipToNext}>
        <planeGeometry args={[0.4, 0.2]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      {/* Close button */}
      <mesh position={[0, 0.8, 0.1]} onClick={onClose}>
        <planeGeometry args={[0.3, 0.2]} />
        <meshBasicMaterial color="#ff6b6b" />
      </mesh>
    </group>
  );
}

// Main library scene
function LibraryScene() {
  const [selectedBook, setSelectedBook] = useState(null);
  
  const books = [
    { 
      id: 1, 
      color: '#8b4513', 
      spineColor: '#654321',
      title: 'The Great Adventure',
      pages: Array(10).fill('Page content')
    },
    { 
      id: 2, 
      color: '#006400', 
      spineColor: '#004d00',
      title: 'Mystery Tales',
      pages: Array(8).fill('Page content')
    },
    { 
      id: 3, 
      color: '#8b0000', 
      spineColor: '#660000',
      title: 'Fantasy World',
      pages: Array(12).fill('Page content')
    },
    { 
      id: 4, 
      color: '#00008b', 
      spineColor: '#000066',
      title: 'Science Fiction',
      pages: Array(10).fill('Page content')
    },
    { 
      id: 5, 
      color: '#8b008b', 
      spineColor: '#660066',
      title: 'Poetry Collection',
      pages: Array(6).fill('Page content')
    },
  ];

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 2, 8]} />
      <OrbitControls 
        enablePan={false}
        minDistance={5}
        maxDistance={15}
        maxPolarAngle={Math.PI / 2}
      />
      
      <ambientLight intensity={0.5} />
      <directionalLight 
        position={[5, 5, 5]} 
        intensity={1}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <pointLight position={[-5, 5, -5]} intensity={0.5} />

      {!selectedBook && (
        <>
          {/* Bookshelf */}
          <mesh position={[0, -0.5, -1]} receiveShadow>
            <boxGeometry args={[8, 0.2, 2]} />
            <meshStandardMaterial color="#8b7355" roughness={0.8} />
          </mesh>

          {/* Books on shelf */}
          {books.map((book, i) => (
            <Book
              key={book.id}
              position={[-3 + i * 1.5, 0.2, -1]}
              bookData={book}
              onOpen={() => setSelectedBook(book)}
            />
          ))}
        </>
      )}

      {selectedBook && (
        <OpenBook 
          bookData={selectedBook}
          onClose={() => setSelectedBook(null)}
        />
      )}

      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#2c2416" roughness={0.9} />
      </mesh>
    </>
  );
}

// Main component
export default function BookLibrary() {
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#1a1410' }}>
      <div style={{
        position: 'absolute',
        top: 20,
        left: 20,
        color: 'white',
        fontFamily: 'serif',
        zIndex: 10,
        background: 'rgba(0,0,0,0.7)',
        padding: '15px',
        borderRadius: '8px'
      }}>
        <h2 style={{ margin: '0 0 10px 0' }}>3D Book Library</h2>
        <p style={{ margin: 0, fontSize: '14px' }}>Click books to open • Drag to rotate view</p>
        <p style={{ margin: '5px 0 0 0', fontSize: '14px' }}>Click sides of open book to flip pages</p>
      </div>
      
      <Canvas shadows>
        <Suspense fallback={null}>
          <LibraryScene />
        </Suspense>
      </Canvas>
    </div>
  );
}