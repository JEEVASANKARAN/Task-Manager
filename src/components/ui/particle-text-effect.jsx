import { useEffect, useRef } from "react";

class Particle {
  constructor() {
    this.pos = { x: 0, y: 0 };
    this.vel = { x: 0, y: 0 };
    this.acc = { x: 0, y: 0 };
    this.target = { x: 0, y: 0 };
    this.closeEnoughTarget = 100;
    this.maxSpeed = 1.0;
    this.maxForce = 0.1;
    this.particleSize = 10;
    this.isKilled = false;
    this.startColor = { r: 0, g: 0, b: 0 };
    this.targetColor = { r: 0, g: 0, b: 0 };
    this.colorWeight = 0;
    this.colorBlendRate = 0.01;
  }

  move() {
    let proximityMult = 1;
    const dx = this.pos.x - this.target.x;
    const dy = this.pos.y - this.target.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance < this.closeEnoughTarget) {
      proximityMult = distance / this.closeEnoughTarget;
    }
    const towardsTarget = {
      x: this.target.x - this.pos.x,
      y: this.target.y - this.pos.y,
    };
    const mag = Math.sqrt(towardsTarget.x * towardsTarget.x + towardsTarget.y * towardsTarget.y);
    if (mag > 0) {
      towardsTarget.x = (towardsTarget.x / mag) * this.maxSpeed * proximityMult;
      towardsTarget.y = (towardsTarget.y / mag) * this.maxSpeed * proximityMult;
    }
    const steer = { x: towardsTarget.x - this.vel.x, y: towardsTarget.y - this.vel.y };
    const steerMag = Math.sqrt(steer.x * steer.x + steer.y * steer.y);
    if (steerMag > 0) {
      steer.x = (steer.x / steerMag) * this.maxForce;
      steer.y = (steer.y / steerMag) * this.maxForce;
    }
    this.acc.x += steer.x;
    this.acc.y += steer.y;
    this.vel.x += this.acc.x;
    this.vel.y += this.acc.y;
    this.pos.x += this.vel.x;
    this.pos.y += this.vel.y;
    this.acc.x = 0;
    this.acc.y = 0;
  }

  draw(ctx, drawAsPoints) {
    if (this.colorWeight < 1.0) {
      this.colorWeight = Math.min(this.colorWeight + this.colorBlendRate, 1.0);
    }
    const r = Math.round(this.startColor.r + (this.targetColor.r - this.startColor.r) * this.colorWeight);
    const g = Math.round(this.startColor.g + (this.targetColor.g - this.startColor.g) * this.colorWeight);
    const b = Math.round(this.startColor.b + (this.targetColor.b - this.startColor.b) * this.colorWeight);
    ctx.fillStyle = `rgb(${r},${g},${b})`;
    if (drawAsPoints) {
      ctx.fillRect(this.pos.x, this.pos.y, 2, 2);
    } else {
      ctx.beginPath();
      ctx.arc(this.pos.x, this.pos.y, this.particleSize / 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  kill(width, height) {
    if (!this.isKilled) {
      const cx = width / 2;
      const cy = height / 2;
      const mag = (width + height) / 2;
      const rx = Math.random() * width;
      const ry = Math.random() * height;
      const dir = { x: rx - cx, y: ry - cy };
      const dirMag = Math.sqrt(dir.x * dir.x + dir.y * dir.y);
      if (dirMag > 0) {
        dir.x = (dir.x / dirMag) * mag;
        dir.y = (dir.y / dirMag) * mag;
      }
      this.target.x = cx + dir.x;
      this.target.y = cy + dir.y;
      this.startColor = {
        r: this.startColor.r + (this.targetColor.r - this.startColor.r) * this.colorWeight,
        g: this.startColor.g + (this.targetColor.g - this.startColor.g) * this.colorWeight,
        b: this.startColor.b + (this.targetColor.b - this.startColor.b) * this.colorWeight,
      };
      this.targetColor = { r: 0, g: 0, b: 0 };
      this.colorWeight = 0;
      this.isKilled = true;
    }
  }
}

const DEFAULT_WORDS = ["TYPE IN YOUR", "CREDENTIALS"];

export function ParticleTextEffect({ words = DEFAULT_WORDS, textColor }) {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const particlesRef = useRef([]);
  const frameCountRef = useRef(0);
  const wordIndexRef = useRef(0);
  const mouseRef = useRef({ x: 0, y: 0, isPressed: false, isRightClick: false });
  const wordsRef = useRef(words);

  const pixelSteps = 6;
  const drawAsPoints = true;

  useEffect(() => {
    wordsRef.current = words;
    wordIndexRef.current = 0;
    frameCountRef.current = 0;
    const canvas = canvasRef.current;
    if (canvas) nextWord(words[0], canvas);
  }, [words.join(",")]);

  function generateRandomPos(x, y, mag, cw, ch) {
    const rx = Math.random() * cw;
    const ry = Math.random() * ch;
    const dir = { x: rx - x, y: ry - y };
    const m = Math.sqrt(dir.x * dir.x + dir.y * dir.y);
    if (m > 0) { dir.x = (dir.x / m) * mag; dir.y = (dir.y / m) * mag; }
    return { x: x + dir.x, y: y + dir.y };
  }

  function nextWord(word, canvas) {
    const offscreen = document.createElement("canvas");
    offscreen.width = canvas.width;
    offscreen.height = canvas.height;
    const ctx2 = offscreen.getContext("2d");
    ctx2.clearRect(0, 0, canvas.width, canvas.height);
    ctx2.fillStyle = "white";
    ctx2.textAlign = "center";
    ctx2.textBaseline = "middle";
    
    // Multi-line support
    const lines = word.split("\n");
    const fontSize = canvas.width < 400 ? 28 : 36;
    ctx2.font = `bold ${fontSize}px Arial`;
    const lineHeight = fontSize * 1.4;
    const startY = canvas.height / 2 - ((lines.length - 1) * lineHeight) / 2;
    lines.forEach((line, i) => {
      ctx2.fillText(line, canvas.width / 2, startY + i * lineHeight);
    });

    const imageData = ctx2.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    const newColor = { r: Math.random() * 200 + 55, g: Math.random() * 200 + 55, b: Math.random() * 255 };
    const particles = particlesRef.current;
    let pIdx = 0;
    const coordsIdx = [];
    for (let i = 0; i < pixels.length; i += pixelSteps * 4) coordsIdx.push(i);
    for (let i = coordsIdx.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [coordsIdx[i], coordsIdx[j]] = [coordsIdx[j], coordsIdx[i]];
    }
    for (const ci of coordsIdx) {
      if (pixels[ci + 3] > 0) {
        const x = (ci / 4) % canvas.width;
        const y = Math.floor(ci / 4 / canvas.width);
        let p;
        if (pIdx < particles.length) {
          p = particles[pIdx];
          p.isKilled = false;
          pIdx++;
        } else {
          p = new Particle();
          const rp = generateRandomPos(canvas.width / 2, canvas.height / 2, (canvas.width + canvas.height) / 2, canvas.width, canvas.height);
          p.pos.x = rp.x; p.pos.y = rp.y;
          p.maxSpeed = Math.random() * 6 + 4;
          p.maxForce = p.maxSpeed * 0.05;
          p.particleSize = Math.random() * 6 + 6;
          p.colorBlendRate = Math.random() * 0.0275 + 0.0025;
          particles.push(p);
        }
        p.startColor = {
          r: p.startColor.r + (p.targetColor.r - p.startColor.r) * p.colorWeight,
          g: p.startColor.g + (p.targetColor.g - p.startColor.g) * p.colorWeight,
          b: p.startColor.b + (p.targetColor.b - p.startColor.b) * p.colorWeight,
        };
        p.targetColor = newColor;
        p.colorWeight = 0;
        p.target.x = x;
        p.target.y = y;
      }
    }
    for (let i = pIdx; i < particles.length; i++) particles[i].kill(canvas.width, canvas.height);
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = canvas.offsetWidth || 400;
    canvas.height = canvas.offsetHeight || 300;
    nextWord(wordsRef.current[0], canvas);

    const animate = () => {
      const ctx = canvas.getContext("2d");
      const particles = particlesRef.current;
      ctx.fillStyle = "rgba(0,0,0,0.12)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.move();
        p.draw(ctx, drawAsPoints);
        if (p.isKilled && (p.pos.x < 0 || p.pos.x > canvas.width || p.pos.y < 0 || p.pos.y > canvas.height)) {
          particles.splice(i, 1);
        }
      }
      if (mouseRef.current.isPressed && mouseRef.current.isRightClick) {
        particles.forEach((p) => {
          const dx = p.pos.x - mouseRef.current.x;
          const dy = p.pos.y - mouseRef.current.y;
          if (Math.sqrt(dx * dx + dy * dy) < 50) p.kill(canvas.width, canvas.height);
        });
      }
      frameCountRef.current++;
      if (frameCountRef.current % 180 === 0) {
        wordIndexRef.current = (wordIndexRef.current + 1) % wordsRef.current.length;
        nextWord(wordsRef.current[wordIndexRef.current], canvas);
      }
      animationRef.current = requestAnimationFrame(animate);
    };
    animate();

    const onDownM = (e) => {
      mouseRef.current.isPressed = true;
      mouseRef.current.isRightClick = e.button === 2;
      const r = canvas.getBoundingClientRect();
      mouseRef.current.x = (e.clientX - r.left) * (canvas.width / r.width);
      mouseRef.current.y = (e.clientY - r.top) * (canvas.height / r.height);
    };
    const onUpM = () => { mouseRef.current.isPressed = false; mouseRef.current.isRightClick = false; };
    const onMoveM = (e) => {
      const r = canvas.getBoundingClientRect();
      mouseRef.current.x = (e.clientX - r.left) * (canvas.width / r.width);
      mouseRef.current.y = (e.clientY - r.top) * (canvas.height / r.height);
    };
    const onContext = (e) => e.preventDefault();

    canvas.addEventListener("mousedown", onDownM);
    canvas.addEventListener("mouseup", onUpM);
    canvas.addEventListener("mousemove", onMoveM);
    canvas.addEventListener("contextmenu", onContext);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      canvas.removeEventListener("mousedown", onDownM);
      canvas.removeEventListener("mouseup", onUpM);
      canvas.removeEventListener("mousemove", onMoveM);
      canvas.removeEventListener("contextmenu", onContext);
    };
  }, []);

  return (
    <div className="w-full h-full flex items-center justify-center bg-black rounded-lg overflow-hidden">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ display: "block" }}
      />
    </div>
  );
}
