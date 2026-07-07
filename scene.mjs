const canvas = document.querySelector("[data-model-canvas]");
const section = document.querySelector("[data-model-section]");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

if (canvas instanceof HTMLCanvasElement && section) {
  let started = false;

  const start = async () => {
    if (started) return;
    started = true;

    try {
      const THREE = await import("./vendor/three.module.min.js");
      createModelScene(THREE);
      section.dataset.modelState = "ready";
    } catch (error) {
      section.dataset.modelState = "error";
      console.error("Unable to start the 3D preview.", error);
    }
  };

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          observer.disconnect();
          start();
        }
      },
      { rootMargin: "240px 0px" }
    );
    observer.observe(section);
  } else {
    start();
  }
}

function createModelScene(THREE) {
  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true,
    canvas,
    powerPreference: "high-performance"
  });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
  camera.position.set(0, 0.15, 7.2);

  const group = new THREE.Group();
  group.rotation.set(-0.12, -0.48, 0.02);
  scene.add(group);

  const materials = {
    shell: new THREE.MeshStandardMaterial({ color: 0x17212b, metalness: 0.32, roughness: 0.46 }),
    face: new THREE.MeshStandardMaterial({ color: 0xf8fafc, metalness: 0.04, roughness: 0.72 }),
    teal: new THREE.MeshStandardMaterial({ color: 0x0f766e, metalness: 0.18, roughness: 0.42 }),
    gold: new THREE.MeshStandardMaterial({ color: 0xeab308, metalness: 0.28, roughness: 0.38 }),
    rose: new THREE.MeshStandardMaterial({ color: 0xbe3455, metalness: 0.18, roughness: 0.46 }),
    blue: new THREE.MeshStandardMaterial({ color: 0x2563eb, metalness: 0.16, roughness: 0.42 }),
    glass: new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 0.04,
      opacity: 0.5,
      roughness: 0.18,
      transparent: true
    })
  };

  scene.add(new THREE.AmbientLight(0xffffff, 1.55));

  const keyLight = new THREE.DirectionalLight(0xffffff, 2.6);
  keyLight.position.set(4, 5, 5);
  scene.add(keyLight);

  const tealLight = new THREE.PointLight(0x0f766e, 13, 12);
  tealLight.position.set(-3.2, -1.8, 3);
  scene.add(tealLight);

  const goldLight = new THREE.PointLight(0xeab308, 8, 10);
  goldLight.position.set(3.2, 2.4, 2.6);
  scene.add(goldLight);

  const makeBox = (size, position, material) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
    mesh.position.set(...position);
    group.add(mesh);
    return mesh;
  };

  makeBox([3.45, 2.14, 0.18], [0, 0, 0], materials.shell);
  makeBox([3.16, 1.62, 0.08], [0, -0.16, 0.14], materials.face);
  makeBox([3.18, 0.24, 0.12], [0, 0.9, 0.18], materials.teal);
  makeBox([0.56, 0.08, 0.16], [-1.16, 0.9, 0.27], materials.gold);
  makeBox([0.08, 0.08, 0.18], [1.14, 0.9, 0.28], materials.rose);
  makeBox([0.08, 0.08, 0.18], [1.32, 0.9, 0.28], materials.gold);
  makeBox([0.08, 0.08, 0.18], [1.5, 0.9, 0.28], materials.face);

  const label = makeLabel(THREE, "DFH");
  label.position.set(-1.1, 0.42, 0.26);
  group.add(label);

  makeBox([1.16, 0.12, 0.14], [0.58, 0.46, 0.26], materials.teal);
  makeBox([1.48, 0.09, 0.12], [0.74, 0.24, 0.25], materials.glass);
  makeBox([1.16, 0.09, 0.12], [0.58, 0.05, 0.25], materials.glass);
  makeBox([0.5, 0.56, 0.13], [-1.02, -0.55, 0.25], materials.gold);
  makeBox([0.76, 0.16, 0.13], [-0.02, -0.39, 0.25], materials.rose);
  makeBox([0.94, 0.16, 0.13], [0.14, -0.68, 0.25], materials.blue);
  makeBox([0.54, 0.16, 0.13], [1.02, -0.39, 0.25], materials.teal);
  makeBox([0.66, 0.16, 0.13], [1.08, -0.68, 0.25], materials.glass);

  const accentGroup = new THREE.Group();
  group.add(accentGroup);

  const accentGeometry = new THREE.IcosahedronGeometry(0.15, 0);
  const accentColors = [materials.gold, materials.teal, materials.rose, materials.blue];
  const accents = [
    [-1.95, 0.92, -0.18],
    [1.95, 0.42, -0.1],
    [-1.7, -1.1, 0.18],
    [1.72, -1.05, 0.12]
  ].map((position, index) => {
    const mesh = new THREE.Mesh(accentGeometry, accentColors[index]);
    mesh.position.set(...position);
    accentGroup.add(mesh);
    return mesh;
  });

  let width = 1;
  let height = 1;
  let animationFrame = 0;
  let inView = true;
  let dragging = false;
  let lastX = 0;
  let lastY = 0;
  let rotationX = -0.12;
  let rotationY = -0.48;
  let targetX = rotationX;
  let targetY = rotationY;
  let velocityY = 0.0025;
  let baseX = 0;
  let baseY = 0;

  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    width = Math.max(1, Math.floor(rect.width));
    height = Math.max(1, Math.floor(rect.height));
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.position.x = width < 760 ? 0 : -0.35;
    camera.position.z = width < 760 ? 8.4 : 7.0;
    group.scale.setScalar(width < 760 ? 0.62 : 1.08);
    baseX = width < 760 ? 1.15 : 0;
    baseY = width < 760 ? 1.62 : 0;
    camera.updateProjectionMatrix();
    renderer.render(scene, camera);
  };

  const render = (timeStamp = 0) => {
    const time = timeStamp * 0.001;

    if (!dragging && !reduceMotion.matches) {
      targetY += velocityY;
    }

    rotationX += (targetX - rotationX) * 0.08;
    rotationY += (targetY - rotationY) * 0.08;
    group.rotation.x = rotationX;
    group.rotation.y = rotationY;
    group.position.x = baseX;
    group.position.y = baseY + (reduceMotion.matches ? 0 : Math.sin(time * 1.15) * 0.11);
    accentGroup.rotation.z = reduceMotion.matches ? 0 : time * 0.22;

    accents.forEach((accent, index) => {
      accent.rotation.x = time * (0.8 + index * 0.12);
      accent.rotation.y = time * (0.9 + index * 0.14);
    });

    renderer.render(scene, camera);

    if (inView || dragging) {
      animationFrame = window.requestAnimationFrame(render);
    }
  };

  const startLoop = () => {
    window.cancelAnimationFrame(animationFrame);
    animationFrame = window.requestAnimationFrame(render);
  };

  const stopLoop = () => {
    if (!dragging) {
      window.cancelAnimationFrame(animationFrame);
    }
  };

  canvas.addEventListener("pointerdown", (event) => {
    dragging = true;
    lastX = event.clientX;
    lastY = event.clientY;
    velocityY = 0;
    canvas.setPointerCapture(event.pointerId);
    startLoop();
  });

  canvas.addEventListener(
    "pointermove",
    (event) => {
      if (!dragging) return;
      const dx = event.clientX - lastX;
      const dy = event.clientY - lastY;
      lastX = event.clientX;
      lastY = event.clientY;
      targetY += dx * 0.008;
      targetX = Math.max(-0.7, Math.min(0.7, targetX + dy * 0.006));
      velocityY = Math.max(-0.018, Math.min(0.018, dx * 0.0005));
    },
    { passive: true }
  );

  const release = (event) => {
    if (!dragging) return;
    dragging = false;
    if (canvas.hasPointerCapture(event.pointerId)) {
      canvas.releasePointerCapture(event.pointerId);
    }
    if (!inView) stopLoop();
  };

  canvas.addEventListener("pointerup", release);
  canvas.addEventListener("pointercancel", release);
  canvas.addEventListener("lostpointercapture", () => {
    dragging = false;
  });

  window.addEventListener("resize", resize, { passive: true });
  reduceMotion.addEventListener("change", () => {
    velocityY = reduceMotion.matches ? 0 : 0.0025;
    startLoop();
  });

  if ("IntersectionObserver" in window) {
    const visibilityObserver = new IntersectionObserver(
      (entries) => {
        inView = entries.some((entry) => entry.isIntersecting);
        if (inView) startLoop();
        else stopLoop();
      },
      { threshold: 0.02 }
    );
    visibilityObserver.observe(section);
  }

  resize();
  startLoop();
}

function makeLabel(THREE, text) {
  const labelCanvas = document.createElement("canvas");
  labelCanvas.width = 512;
  labelCanvas.height = 256;
  const context = labelCanvas.getContext("2d");
  context.fillStyle = "#101820";
  context.fillRect(0, 0, labelCanvas.width, labelCanvas.height);
  context.strokeStyle = "#eab308";
  context.lineWidth = 22;
  context.strokeRect(28, 28, 456, 200);
  context.fillStyle = "#ffffff";
  context.font = "900 118px system-ui, sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(text, 256, 132);

  const texture = new THREE.CanvasTexture(labelCanvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
  return new THREE.Mesh(new THREE.PlaneGeometry(0.82, 0.42), material);
}
