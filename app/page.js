"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

function buildFallbackHead(group) {
  const skin = new THREE.MeshStandardMaterial({
    color: 0xe7c48f,
    roughness: 0.52,
    metalness: 0.06
  });
  const dark = new THREE.MeshStandardMaterial({
    color: 0x1a1f31,
    roughness: 0.75
  });
  const white = new THREE.MeshStandardMaterial({
    color: 0xf7f8ff,
    roughness: 0.42
  });

  const skull = new THREE.Mesh(new THREE.SphereGeometry(1.18, 64, 64), skin);
  skull.castShadow = true;
  group.add(skull);

  const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.22, 32, 32), white);
  eyeL.position.set(-0.42, 0.2, 0.98);
  group.add(eyeL);

  const eyeR = eyeL.clone();
  eyeR.position.x = 0.42;
  group.add(eyeR);

  const pupilL = new THREE.Mesh(new THREE.SphereGeometry(0.09, 24, 24), dark);
  pupilL.position.set(-0.42, 0.2, 1.15);
  group.add(pupilL);

  const pupilR = pupilL.clone();
  pupilR.position.x = 0.42;
  group.add(pupilR);
}

export default function HomePage() {
  const stageRef = useRef(null);
  const canvasRef = useRef(null);
  const elasticSectionRef = useRef(null);
  const elasticFaceRef = useRef(null);
  const elasticPupilLeftRef = useRef(null);
  const elasticPupilRightRef = useRef(null);
  const [controlsOpen, setControlsOpen] = useState(false);
  const [sensitivity, setSensitivity] = useState(1);
  const [mode, setMode] = useState("direct");
  const [status, setStatus] = useState("Inicializando escena 3D...");
  const sensitivityRef = useRef(1);
  const modeRef = useRef("direct");

  useEffect(() => {
    sensitivityRef.current = sensitivity;
  }, [sensitivity]);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    if (!stage || !canvas) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111424);

    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 0.2, 4.5);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;

    const ambient = new THREE.AmbientLight(0xfff4d8, 0.65);
    scene.add(ambient);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.05);
    keyLight.position.set(2.4, 3, 3.5);
    keyLight.castShadow = true;
    scene.add(keyLight);

    const rim = new THREE.DirectionalLight(0x6fa8ff, 0.4);
    rim.position.set(-3, 1.8, -2.5);
    scene.add(rim);

    const headGroup = new THREE.Group();
    scene.add(headGroup);
    buildFallbackHead(headGroup);

    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(3, 48),
      new THREE.MeshStandardMaterial({ color: 0x0d1020, roughness: 0.95, metalness: 0.02 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -1.55;
    floor.receiveShadow = true;
    scene.add(floor);

    const loader = new GLTFLoader();
    const candidates = ["/model-compressed.glb", "/model.glb"];

    const loadModel = (index) => {
      const modelPath = candidates[index];
      if (!modelPath) {
        setStatus("No se pudo cargar ningun modelo (.glb). Revisa public/model.glb.");
        return;
      }

      setStatus(`Cargando ${modelPath}...`);
      loader.load(
        modelPath,
        (gltf) => {
          const model = gltf.scene || gltf.scenes?.[0];
          if (!model) {
            setStatus("Modelo vacio. Mostrando respaldo.");
            return;
          }
          headGroup.clear();
          model.traverse((node) => {
            if (node.isMesh) {
              node.castShadow = true;
              node.receiveShadow = true;
            }
          });
          const box = new THREE.Box3().setFromObject(model);
          const size = box.getSize(new THREE.Vector3());
          const center = box.getCenter(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z) || 1;
          const scale = 2.2 / maxDim;
          model.position.sub(center);
          model.scale.setScalar(scale);
          model.rotation.y = 0;
          model.position.y = -0.2;
          headGroup.add(model);
          setStatus(`Modelo cargado: ${modelPath}`);
        },
        undefined,
        (error) => {
          console.warn(`Fallo cargando ${modelPath}, intentando respaldo...`, error);
          loadModel(index + 1);
        }
      );
    };

    loadModel(0);

    const mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const rot = { yaw: 0, pitch: 0, vyaw: 0, vpitch: 0 };

    const onMouseMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    window.addEventListener("mousemove", onMouseMove);

    const resize = () => {
      const width = stage.clientWidth;
      const height = stage.clientHeight;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    resize();
    window.addEventListener("resize", resize);

    let raf = 0;
    const tick = () => {
      const rect = stage.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const nx = (mouse.x - cx) / (rect.width / 2);
      const ny = (mouse.y - cy) / (rect.height / 2);
      const currentSensitivity = sensitivityRef.current;
      const currentMode = modeRef.current;
      const maxYaw = 0.72 * currentSensitivity;
      const maxPitch = 0.46 * currentSensitivity;
      const targetYaw = Math.max(-maxYaw, Math.min(maxYaw, nx * maxYaw));
      const targetPitch = Math.max(-maxPitch, Math.min(maxPitch, -ny * maxPitch));

      if (currentMode === "direct") {
        rot.yaw = targetYaw;
        rot.pitch = targetPitch;
      } else if (currentMode === "smooth") {
        rot.yaw += (targetYaw - rot.yaw) * 0.12;
        rot.pitch += (targetPitch - rot.pitch) * 0.12;
      } else {
        const spring = 0.12;
        const damping = 0.82;
        rot.vyaw = (rot.vyaw + (targetYaw - rot.yaw) * spring) * damping;
        rot.vpitch = (rot.vpitch + (targetPitch - rot.pitch) * spring) * damping;
        rot.yaw += rot.vyaw;
        rot.pitch += rot.vpitch;
      }

      headGroup.rotation.y = rot.yaw;
      headGroup.rotation.x = rot.pitch;

      renderer.render(scene, camera);
      raf = window.requestAnimationFrame(tick);
    };
    tick();

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", resize);
      window.cancelAnimationFrame(raf);
      renderer.dispose();
    };
  }, []);

  useEffect(() => {
    const section = elasticSectionRef.current;
    const face = elasticFaceRef.current;
    const pupilLeft = elasticPupilLeftRef.current;
    const pupilRight = elasticPupilRightRef.current;
    if (!section || !face || !pupilLeft || !pupilRight) return;

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let physicsX = window.innerWidth / 2;
    let physicsY = window.innerHeight / 2;
    let velocityX = 0;
    let velocityY = 0;

    const spring = 0.03;
    const friction = 0.9;
    let raf = 0;

    const onMouseMove = (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };
    window.addEventListener("mousemove", onMouseMove);

    const tick = () => {
      const dx = mouseX - physicsX;
      const dy = mouseY - physicsY;
      velocityX += dx * spring;
      velocityY += dy * spring;
      velocityX *= friction;
      velocityY *= friction;
      physicsX += velocityX;
      physicsY += velocityY;

      const size = 120;
      const speed = Math.hypot(velocityX, velocityY);
      const scaleX = 1 + speed * 0.002;
      const scaleY = 1 - speed * 0.001;
      const rotation = velocityX * 0.5;

      face.style.left = `${physicsX - size / 2}px`;
      face.style.top = `${physicsY - size / 2}px`;
      face.style.transform = `rotate(${rotation}deg) scale(${scaleX}, ${scaleY})`;

      const faceRect = face.getBoundingClientRect();
      const centerX = faceRect.left + faceRect.width / 2;
      const centerY = faceRect.top + faceRect.height / 2;
      const eyeLX = centerX - 16;
      const eyeRX = centerX + 16;
      const eyeY = centerY - 2;
      const maxOffset = 6 * sensitivityRef.current;

      const angleL = Math.atan2(mouseY - eyeY, mouseX - eyeLX);
      const angleR = Math.atan2(mouseY - eyeY, mouseX - eyeRX);
      const distL = Math.min(Math.hypot(mouseX - eyeLX, mouseY - eyeY), 30);
      const distR = Math.min(Math.hypot(mouseX - eyeRX, mouseY - eyeY), 30);
      const offsetL = Math.min(distL / 5, maxOffset);
      const offsetR = Math.min(distR / 5, maxOffset);

      pupilLeft.style.transform = `translate(calc(-50% + ${Math.cos(angleL) * offsetL}px), calc(-50% + ${Math.sin(angleL) * offsetL}px))`;
      pupilRight.style.transform = `translate(calc(-50% + ${Math.cos(angleR) * offsetR}px), calc(-50% + ${Math.sin(angleR) * offsetR}px))`;

      raf = window.requestAnimationFrame(tick);
    };
    tick();

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <main className="page">
      <button
        className="controls-toggle"
        type="button"
        aria-label="Abrir controles"
        onClick={() => setControlsOpen((v) => !v)}
      >
        ⚙️
      </button>

      <aside className={`controls ${controlsOpen ? "open" : ""}`}>
        <h3>Controles</h3>
        <label htmlFor="sensitivity">Sensibilidad</label>
        <input
          id="sensitivity"
          type="range"
          min="1"
          max="10"
          value={Math.round(sensitivity * 10)}
          onChange={(e) => setSensitivity(Number(e.target.value) / 10)}
        />
        <label>Modo de seguimiento</label>
        <div className="mode-buttons">
          <button
            type="button"
            className={`mode-btn ${mode === "direct" ? "active" : ""}`}
            onClick={() => setMode("direct")}
          >
            Directo
          </button>
          <button
            type="button"
            className={`mode-btn ${mode === "smooth" ? "active" : ""}`}
            onClick={() => setMode("smooth")}
          >
            Suave
          </button>
          <button
            type="button"
            className={`mode-btn ${mode === "elastic" ? "active" : ""}`}
            onClick={() => setMode("elastic")}
          >
            Elástico
          </button>
        </div>
      </aside>

      <section className="hero">
        <h1>Cara 3D Real</h1>
        <div className="stage" ref={stageRef}>
          <canvas ref={canvasRef} />
          <div className="status">{status}</div>
        </div>
      </section>

      <section className="elastic-section" ref={elasticSectionRef}>
        <h2>Física Elástica</h2>
        <div className="elastic-face" ref={elasticFaceRef}>
          <div className="elastic-eye">
            <div className="elastic-pupil" ref={elasticPupilLeftRef} />
          </div>
          <div className="elastic-eye">
            <div className="elastic-pupil" ref={elasticPupilRightRef} />
          </div>
        </div>
      </section>
    </main>
  );
}
