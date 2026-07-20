import React, { useRef, useEffect, useState } from "react";
import { motion } from "motion/react";
import { 
  Network, Search, Compass, BookOpen, Target, 
  HelpCircle, ChevronRight, Play, Info, Settings2, Sliders,
  Award, Clock, Layers, Flame, CheckCircle2, FileText, Sparkles, Book,
  Plus, Minus, Maximize
} from "lucide-react";
import { UserProfile } from "../../types";

interface NexusProps {
  user: UserProfile;
  onLaunchTopic: (topic: string) => void;
}

interface Node {
  id: string;
  label: string;
  group: string;
  val?: number;
  mastery: number; // 0-100
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  desc?: string;
  category?: string;
  prereqs?: string[];
  hasBeenDragged?: boolean;

  // High-fidelity Knowledge Object parameters
  canonicalName?: string;
  aliases?: string[];
  definition?: string;
  contexts?: string[];
  difficulty?: string;
  examples?: string[];
  equations?: string[];
  prerequisites?: string[];
  relatedConcepts?: string[];
  sourceConversations?: string[];
  learningSessions?: string[];
  recentActivity?: boolean;
  ringProgress?: number;
  timesReviewed?: number;
}

interface Link {
  source: string;
  target: string;
  type?: string;
  strength?: number;
}

const relativeCoords: { [key: string]: { rx: number; ry: number } } = {
  wave_fn: { rx: 0.25, ry: 0.30 },
  heis_unc: { rx: 0.58, ry: 0.42 },
  eigen: { rx: 0.38, ry: 0.72 },
  diffract: { rx: 0.80, ry: 0.25 },
  debroglie: { rx: 0.84, ry: 0.65 },
  hilbert: { rx: 0.16, ry: 0.58 },
  entropy: { rx: 0.50, ry: 0.15 }
};

const initialNodes: Node[] = [
  {
    id: "wave_fn",
    label: "Schrödinger Wavefunction",
    group: "quantum",
    val: 12,
    mastery: 85,
    x: 150,
    y: 120,
    vx: 0,
    vy: 0,
    radius: 18,
    category: "Wave Mechanics",
    desc: "A mathematical description of the quantum state of an isolated physical system.",
    prereqs: ["Complex Numbers", "Classical Wave Physics"],
    canonicalName: "Schrödinger Wavefunction",
    aliases: ["Schrödinger Equation", "Wavefunction", "Ψ", "Psi"],
    definition: "A mathematical function describing the probability amplitude of a quantum system's state.",
    contexts: ["Quantum Physics", "Wave Mechanics", "Information Theory"],
    difficulty: "hard",
    examples: ["The static wave state in an infinite one-dimensional potential well.", "Quantized quantum-dot energy packets."],
    equations: ["i\\hbar \\frac{\\partial\\Psi}{\\partial t} = \\hat{H}\\Psi", "\\int |\\Psi|^2 dx = 1"],
    prerequisites: ["Complex Numbers", "Classical Wave Physics"],
    relatedConcepts: ["Eigenstates & Operators", "Heisenberg Uncertainty Principle"],
    sourceConversations: ["sess_quantum_1"],
    learningSessions: ["Session: Wave-Particle Duality"],
    recentActivity: true,
    ringProgress: 85
  },
  {
    id: "heis_unc",
    label: "Heisenberg Uncertainty Principle",
    group: "quantum",
    val: 8,
    mastery: 72,
    x: 350,
    y: 180,
    vx: 0,
    vy: 0,
    radius: 15,
    category: "Quantum Principles",
    desc: "Asserts a fundamental limit to the precision with which certain pairs of physical properties can be known.",
    prereqs: ["Schrödinger Wavefunction"],
    canonicalName: "Heisenberg Uncertainty Principle",
    aliases: ["Uncertainty Limit", "Heisenberg Principle", "Δx Δp"],
    definition: "An absolute quantum physical constraint where conjugate variables (like position and momentum) cannot be measured with simultaneous absolute precision.",
    contexts: ["Quantum Physics", "Fourier Analysis", "Experimental Physics"],
    difficulty: "medium",
    examples: ["Laser beam passing through an extremely narrow single slit diffraction grating.", "Position narrowing forcing momentum spread in microscope lenses."],
    equations: ["\\Delta x \\cdot \\Delta p \\geq \\frac{\\hbar}{2}"],
    prerequisites: ["Schrödinger Wavefunction"],
    relatedConcepts: ["De Broglie Duality"],
    sourceConversations: ["sess_quantum_1"],
    learningSessions: ["Session: Wave-Particle Duality"],
    recentActivity: false,
    ringProgress: 72
  },
  {
    id: "eigen",
    label: "Eigenstates & Operators",
    group: "math",
    val: 10,
    mastery: 50,
    x: 220,
    y: 320,
    vx: 0,
    vy: 0,
    radius: 16,
    category: "Mathematical Setup",
    desc: "Represent physical observables as linear operators acting on Hilbert space vectors.",
    prereqs: ["Schrödinger Wavefunction"],
    canonicalName: "Eigenstates & Operators",
    aliases: ["Eigenvectors", "Observables", "Linear Operators"],
    definition: "The formulation of physical properties (energy, position, spin) as Hermitian linear operators that project specific quantized values (eigenvalues) when acting on wavevectors.",
    contexts: ["Quantum Physics", "Linear Algebra", "Functional Analysis"],
    difficulty: "hard",
    examples: ["The energy Hamiltonian operator projecting discrete energy levels.", "Position operator measurements collapsing states."],
    equations: ["\\hat{A} |\\psi\\rangle = a |\\psi\\rangle", "\\hat{H} \\Psi = E \\Psi"],
    prerequisites: ["Schrödinger Wavefunction"],
    relatedConcepts: ["Hilbert Space Formulations"],
    sourceConversations: [],
    learningSessions: [],
    recentActivity: false,
    ringProgress: 50
  },
  {
    id: "diffract",
    label: "Double-Slit Diffraction",
    group: "experimental",
    val: 6,
    mastery: 95,
    x: 480,
    y: 100,
    vx: 0,
    vy: 0,
    radius: 13,
    category: "Physical Experiments",
    desc: "The classic demonstration of quantum wave-particle superposition and interference patterns.",
    prereqs: ["Classical Wave Physics"],
    canonicalName: "Double-Slit Diffraction",
    aliases: ["Young Double-Slit", "Superposition Experiment", "Interference Patterns"],
    definition: "An elegant experimental apparatus proving the wave-particle duality of matter by demonstrating that particles fired individually still form wave-like interference grids when unobserved.",
    contexts: ["Experimental Physics", "Wave Optics", "Quantum Physics"],
    difficulty: "medium",
    examples: ["Thomas Young's historic coherent light interference fringes.", "Firing single electrons through standard double-slit detectors over time."],
    equations: ["d \\sin\\theta = m \\lambda"],
    prerequisites: ["Classical Wave Physics"],
    relatedConcepts: ["De Broglie Duality"],
    sourceConversations: [],
    learningSessions: [],
    recentActivity: false,
    ringProgress: 95
  },
  {
    id: "debroglie",
    label: "De Broglie Duality",
    group: "quantum",
    val: 7,
    mastery: 90,
    x: 520,
    y: 280,
    vx: 0,
    vy: 0,
    radius: 14,
    category: "Wave Mechanics",
    desc: "Formulates that any moving particle has an associated wave character with λ = h/p.",
    prereqs: ["Classical Wave Physics"],
    canonicalName: "De Broglie Duality",
    aliases: ["De Broglie Hypothesis", "Matter Waves", "λ = h/p"],
    definition: "The physical hypothesis asserting that all matter (including electrons, atoms, and macro-molecules) exhibits an intrinsic wave character with a wavelength inversely proportional to its momentum.",
    contexts: ["Quantum Physics", "Theoretical Physics", "Materials Engineering"],
    difficulty: "easy",
    examples: ["Electron microscopy utilizing sub-nanometer wave parameters.", "Thermal neutron beam crystal lattice scatters."],
    equations: ["\\lambda = \\frac{h}{p}"],
    prerequisites: ["Classical Wave Physics"],
    relatedConcepts: ["Double-Slit Diffraction"],
    sourceConversations: [],
    learningSessions: [],
    recentActivity: false,
    ringProgress: 90
  },
  {
    id: "hilbert",
    label: "Hilbert Space Formulations",
    group: "math",
    val: 5,
    mastery: 35,
    x: 100,
    y: 250,
    vx: 0,
    vy: 0,
    radius: 11,
    category: "Mathematical Setup",
    desc: "An abstract vector space possessing the structure of an inner product that allows length and angle measurement.",
    prereqs: ["Eigenstates & Operators"],
    canonicalName: "Hilbert Space Formulations",
    aliases: ["Hilbert Space", "Vector Inner Products", "State Space"],
    definition: "An abstract, infinite-dimensional complex vector space with an inner product, serving as the rigorous mathematical canvas for quantum state vectors and wave functions.",
    contexts: ["Functional Analysis", "Pure Mathematics", "Quantum Computing"],
    difficulty: "hard",
    examples: ["The infinite-dimensional state space of continuous wavefunctions.", "Finite state Bloch sphere projections for quantum bit gates."],
    equations: ["\\langle \\psi | \\phi \\rangle = \\int \\psi^*(x)\\phi(x)dx"],
    prerequisites: ["Eigenstates & Operators"],
    relatedConcepts: ["Quantum Mechanics"],
    sourceConversations: [],
    learningSessions: [],
    recentActivity: false,
    ringProgress: 35
  },
  {
    id: "entropy",
    label: "Entropy (Multi-Context)",
    group: "multi",
    val: 14,
    mastery: 68,
    x: 300,
    y: 60,
    vx: 0,
    vy: 0,
    radius: 19,
    category: "Unified Concepts",
    desc: "A universal concept measuring disorder, microstates, and information content across multi-disciplinary boundaries.",
    prereqs: ["Classical Wave Physics"],
    canonicalName: "Entropy (Universal Multi-Context)",
    aliases: ["S", "Shannon Entropy", "Disorder Measure", "Microstates"],
    definition: "A fundamental measure that spans thermodynamics (thermodynamic disorder), statistical mechanics (state space configurations), chemistry (reaction spontaneity), and information theory (computational uncertainty/information limit).",
    contexts: ["Physics", "Mechanical Engineering", "Chemistry", "Information Theory", "Computer Science"],
    difficulty: "hard",
    examples: [
      "Thermodynamic: Heat engine dissipation loss.",
      "Information Theory: Average minimum code bits to encode source text.",
      "Chemistry: Melting of ice increasing system entropy configuration."
    ],
    equations: ["S = k_B \\ln \\Omega", "H(X) = -\\sum P(x_i) \\log_2 P(x_i)"],
    prerequisites: ["Eigenstates & Operators"],
    relatedConcepts: ["Heisenberg Uncertainty Principle", "Schrödinger Wavefunction"],
    sourceConversations: [],
    learningSessions: ["Session: Universal Systems Entropy"],
    recentActivity: true,
    ringProgress: 68
  }
];

const initialLinks: Link[] = [
  { source: "wave_fn", target: "heis_unc", type: "Frequently Studied Together", strength: 80 },
  { source: "wave_fn", target: "eigen", type: "Prerequisite", strength: 65 },
  { source: "diffract", target: "debroglie", type: "Builds Upon", strength: 55 },
  { source: "debroglie", target: "heis_unc", type: "Frequently Studied Together", strength: 40 },
  { source: "eigen", target: "hilbert", type: "Prerequisite", strength: 75 },
  { source: "entropy", target: "wave_fn", type: "Unified Concept Anchor", strength: 85 },
  { source: "entropy", target: "heis_unc", type: "Information Bounds", strength: 70 }
];

export default function Nexus({ user, onLaunchTopic }: NexusProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [links, setLinks] = useState<Link[]>(initialLinks);
  const [selectedNode, setSelectedNode] = useState<Node | null>(initialNodes[0]);
  const [searchQuery, setSearchQuery] = useState("");
  const [physicsActive, setPhysicsActive] = useState(false);
  const [repulsionForce, setRepulsionForce] = useState(150);
  const [sidebarTab, setSidebarTab] = useState<"summary" | "practice" | "progress">("summary");
  const [showPracticeAnswer, setShowPracticeAnswer] = useState(false);

  const [zoom, setZoom] = useState(1.0);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);

  const draggedNodeRef = useRef<Node | null>(null);
  const isPanningRef = useRef(false);
  const startPanRef = useRef({ x: 0, y: 0 });
  const basePanRef = useRef({ x: 0, y: 0 });

  // Sync user's real-time knowledge graph auto-updates & auto-migrate to Knowledge Objects
  useEffect(() => {
    if (user && user.knowledgeGraph) {
      if (user.knowledgeGraph.nodes && user.knowledgeGraph.nodes.length > 0) {
        // Hydrate all loaded nodes with safety fallbacks for high-fidelity parameters
        const hydratedNodes = user.knowledgeGraph.nodes.map((n: any) => {
          const matchingInitial = initialNodes.find(init => init.id === n.id);
          return {
            ...n,
            canonicalName: n.canonicalName || n.label || matchingInitial?.canonicalName || "",
            aliases: n.aliases || matchingInitial?.aliases || [n.label || ""],
            definition: n.definition || n.desc || matchingInitial?.definition || "",
            contexts: n.contexts || (n.group ? [n.group] : matchingInitial?.contexts) || ["General Science"],
            difficulty: n.difficulty || matchingInitial?.difficulty || "medium",
            examples: n.examples || matchingInitial?.examples || [],
            equations: n.equations || (n.equation ? [n.equation] : matchingInitial?.equations) || [],
            prerequisites: n.prerequisites || n.prereqs || matchingInitial?.prerequisites || [],
            relatedConcepts: n.relatedConcepts || matchingInitial?.relatedConcepts || [],
            sourceConversations: n.sourceConversations || matchingInitial?.sourceConversations || [],
            learningSessions: n.learningSessions || matchingInitial?.learningSessions || [],
            recentActivity: n.recentActivity !== undefined ? n.recentActivity : matchingInitial?.recentActivity || false,
            ringProgress: n.ringProgress !== undefined ? n.ringProgress : n.mastery || matchingInitial?.ringProgress || 10
          };
        });

        setNodes(hydratedNodes);
        
        const exists = hydratedNodes.find((n: Node) => n.id === selectedNode?.id);
        if (!exists) {
          setSelectedNode(hydratedNodes[0]);
        } else {
          // Keep selection updated
          const updatedSelection = hydratedNodes.find((n: Node) => n.id === selectedNode?.id);
          if (updatedSelection) setSelectedNode(updatedSelection);
        }
      }
      if (user.knowledgeGraph.links && user.knowledgeGraph.links.length > 0) {
        setLinks(user.knowledgeGraph.links);
      }
    }
  }, [user]);

  // Reset practice answer reveal on node select
  useEffect(() => {
    setShowPracticeAnswer(false);
  }, [selectedNode]);

  // Filter nodes based on search query
  const filteredNodes = nodes.filter((node) =>
    node.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (node.canonicalName && node.canonicalName.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (node.aliases && node.aliases.some(a => a.toLowerCase().includes(searchQuery.toLowerCase())))
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;

    const drawRoundedRect = (c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
      c.beginPath();
      c.moveTo(x + r, y);
      c.lineTo(x + w - r, y);
      c.quadraticCurveTo(x + w, y, x + w, y + r);
      c.lineTo(x + w, y + h - r);
      c.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      c.lineTo(x + r, y + h);
      c.quadraticCurveTo(x, y + h, x, y + h - r);
      c.lineTo(x, y + r);
      c.quadraticCurveTo(x, y, x + r, y);
      c.closePath();
    };

    const wrapText = (text: string, maxChars = 18): string[] => {
      const words = text.split(" ");
      const lines: string[] = [];
      let currentLine = "";
      words.forEach(word => {
        if ((currentLine + word).length > maxChars) {
          if (currentLine) lines.push(currentLine.trim());
          currentLine = word + " ";
        } else {
          currentLine += word + " ";
        }
      });
      if (currentLine) lines.push(currentLine.trim());
      return lines;
    };

    const resizeCanvas = () => {
      if (containerRef.current && canvas) {
        const w = containerRef.current.clientWidth;
        const h = w < 640 ? 320 : 420;
        canvas.width = w;
        canvas.height = h;

        nodes.forEach((node) => {
          const rel = relativeCoords[node.id];
          if (rel && !node.hasBeenDragged) {
            node.x = rel.rx * w;
            node.y = rel.ry * h;
          }
        });
      }
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Dynamic Physics Force Loop
    const updatePhysics = () => {
      if (!physicsActive) return;

      const k = 0.05; // spring force
      const length = 135; // optimal cozy distance for constellation layout

      // Apply link spring forces
      links.forEach((link) => {
        const s = nodes.find((n) => n.id === link.source);
        const t = nodes.find((n) => n.id === link.target);
        if (!s || !t) return;

        const dx = t.x - s.x;
        const dy = t.y - s.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = (dist - length) * k;

        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;

        if (s !== draggedNodeRef.current) {
          s.vx += fx * 0.1;
          s.vy += fy * 0.1;
        }
        if (t !== draggedNodeRef.current) {
          t.vx -= fx * 0.1;
          t.vy -= fy * 0.1;
        }
      });

      // Apply node overlap repulsion forces to prevent overlapping labels or nodes
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const s = nodes[i];
          const t = nodes[j];
          const dx = t.x - s.x;
          const dy = t.y - s.y;
          
          // Labels extend to the right of nodes, so horizontal spacing needs to be larger than vertical
          const minDistX = 150; // minimum horizontal spacing
          const minDistY = 50;  // minimum vertical spacing
          
          const overlapX = minDistX - Math.abs(dx);
          const overlapY = minDistY - Math.abs(dy);
          
          if (overlapX > 0 && overlapY > 0) {
            const forceX = overlapX * 0.08 * (dx > 0 ? 1 : -1);
            const forceY = overlapY * 0.12 * (dy > 0 ? 1 : -1);
            
            if (s !== draggedNodeRef.current) {
              s.vx -= forceX;
              s.vy -= forceY;
            }
            if (t !== draggedNodeRef.current) {
              t.vx += forceX;
              t.vy += forceY;
            }
          }
        }
      }

      // Update positions and boundary physics
      nodes.forEach((node) => {
        if (node === draggedNodeRef.current) return;

        // Friction
        node.vx *= 0.82;
        node.vy *= 0.82;

        node.x += node.vx;
        node.y += node.vy;

        // Note: For true infinite canvas, standard boundary clamp is removed so nodes can freely float
      });
    };

    // Draw Frame Loop
    const drawFrame = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      // Apply coordinate space transformations
      ctx.translate(panX, panY);
      ctx.scale(zoom, zoom);

      // Draw elegant, panning infinite-grid background accents
      ctx.strokeStyle = "rgba(255, 255, 255, 0.015)";
      ctx.lineWidth = 0.5 / zoom;
      const gridSize = 50;
      
      const left = -panX / zoom;
      const top = -panY / zoom;
      const right = (canvas.width - panX) / zoom;
      const bottom = (canvas.height - panY) / zoom;
      
      const startX = Math.floor(left / gridSize) * gridSize;
      const startY = Math.floor(top / gridSize) * gridSize;
      const endX = Math.ceil(right / gridSize) * gridSize;
      const endY = Math.ceil(bottom / gridSize) * gridSize;
      
      for (let x = startX; x <= endX; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, top);
        ctx.lineTo(x, bottom);
        ctx.stroke();
      }
      for (let y = startY; y <= endY; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(left, y);
        ctx.lineTo(right, y);
        ctx.stroke();
      }

      // Draw Connection Lines representing Edge Strength with micro-interactive highlights
      links.forEach((link) => {
        const s = nodes.find((n) => n.id === link.source);
        const t = nodes.find((n) => n.id === link.target);
        if (!s || !t) return;

        const isRelatedToSelection = selectedNode?.id === s.id || selectedNode?.id === t.id;
        
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(t.x, t.y);
        
        if (isRelatedToSelection) {
          // Highlighted connection with indigo glow
          ctx.strokeStyle = "rgba(99, 102, 241, 0.28)";
          ctx.lineWidth = 1.4 / zoom;
        } else {
          // Subtle, delicate celestial connections matching the constellation style
          ctx.strokeStyle = "rgba(255, 255, 255, 0.035)";
          ctx.lineWidth = 0.7 / zoom;
        }
        ctx.stroke();
      });

      // Draw Nodes as pristine silver constellation points with labels and gold stars
      nodes.forEach((node) => {
        const isSelected = selectedNode?.id === node.id;
        
        // Draw selection halo/pulse ring if selected
        if (isSelected) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, 11, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(99, 102, 241, 0.18)";
          ctx.fill();
          ctx.strokeStyle = "rgba(99, 102, 241, 0.45)";
          ctx.lineWidth = 1 / zoom;
          ctx.stroke();
        } else if (node.recentActivity) {
          // Subtle green pulse for active nodes
          ctx.beginPath();
          ctx.arc(node.x, node.y, 9, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(34, 197, 94, 0.1)";
          ctx.fill();
          ctx.strokeStyle = "rgba(34, 197, 94, 0.3)";
          ctx.lineWidth = 0.8 / zoom;
          ctx.stroke();
        }

        // Draw solid circular node point (silver-white ●)
        ctx.beginPath();
        ctx.arc(node.x, node.y, 5.5, 0, Math.PI * 2);
        if (isSelected) {
          ctx.fillStyle = "#ffffff";
        } else if (node.mastery > 80) {
          ctx.fillStyle = "#e2e8f0"; // Pristine White/Silver
        } else if (node.mastery > 45) {
          ctx.fillStyle = "#cbd5e1"; // Muted Silver
        } else {
          ctx.fillStyle = "#94a3b8"; // Muted Slate
        }
        ctx.fill();

        // Draw text label next to the circular node point
        const textX = node.x + 14;
        const textY = node.y;
        
        // Font selections and color mappings representing status
        ctx.font = isSelected ? "bold 11px Inter, sans-serif" : "500 11px Inter, sans-serif";
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillStyle = isSelected ? "#ffffff" : "#b3b3b3";
        
        // Format label beautifully (optionally in uppercase for document nodes as seen in layout sample)
        const displayLabel = node.label.toUpperCase();
        ctx.fillText(displayLabel, textX, textY);
        
        // Calculate the measured width of the label to offset stars perfectly
        const textWidth = ctx.measureText(displayLabel).width;

        // Draw gold stars next to the text label matching mastery score
        const getStars = (score: number) => {
          if (score >= 90) return "★ ★ ★ ★ ★";
          if (score >= 75) return "★ ★ ★ ★";
          if (score >= 50) return "★ ★ ★";
          if (score >= 30) return "★ ★";
          if (score >= 10) return "★";
          return "";
        };

        const starsStr = getStars(node.mastery);
        if (starsStr) {
          ctx.fillStyle = "#f59e0b"; // Warm Gold
          ctx.font = "11px Inter, sans-serif";
          ctx.fillText(" " + starsStr, textX + textWidth + 4, textY);
        }
      });

      ctx.restore();
    };

    const loop = () => {
      updatePhysics();
      drawFrame();
      animationFrameId = requestAnimationFrame(loop);
    };

    // Attach native wheel zoom listener (supporting e.preventDefault() for non-passive scaling)
    const handleCanvasWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomFactor = 1.08;
      
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const delta = -e.deltaY;
      const nextZoom = delta > 0 ? zoom * zoomFactor : zoom / zoomFactor;
      const clampedZoom = Math.min(Math.max(nextZoom, 0.2), 4.0);

      // Centered zoom correction
      const newPanX = mouseX - ((mouseX - panX) / zoom) * clampedZoom;
      const newPanY = mouseY - ((mouseY - panY) / zoom) * clampedZoom;

      setZoom(clampedZoom);
      setPanX(newPanX);
      setPanY(newPanY);
    };

    canvas.addEventListener("wheel", handleCanvasWheel, { passive: false });

    loop();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      canvas.removeEventListener("wheel", handleCanvasWheel);
      cancelAnimationFrame(animationFrameId);
    };
  }, [nodes, links, selectedNode, physicsActive, repulsionForce, zoom, panX, panY]);

  // Handle Drag & Interactions
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Convert screen coordinates to world coordinates
    const worldX = (mouseX - panX) / zoom;
    const worldY = (mouseY - panY) / zoom;

    // Hit test checking if mouse click is inside the circular node or its label text region
    const hit = nodes.find((node) => {
      const dx = worldX - node.x;
      const dy = worldY - node.y;
      const distToDot = Math.sqrt(dx * dx + dy * dy);
      
      // Click near the circle point (scaled hit area based on zoom)
      if (distToDot <= 16 / zoom) return true;
      
      // Click within the label text bounding zone extending to the right of the node
      const labelW = 160; 
      if (worldX >= node.x && worldX <= node.x + labelW && Math.abs(worldY - node.y) <= 15) {
        return true;
      }
      
      return false;
    });

    if (hit) {
      draggedNodeRef.current = hit;
      setSelectedNode(hit);
    } else {
      // Background click: initiate canvas panning
      isPanningRef.current = true;
      startPanRef.current = { x: e.clientX, y: e.clientY };
      basePanRef.current = { x: panX, y: panY };
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (draggedNodeRef.current) {
      const worldX = (mouseX - panX) / zoom;
      const worldY = (mouseY - panY) / zoom;

      draggedNodeRef.current.x = worldX;
      draggedNodeRef.current.y = worldY;
      draggedNodeRef.current.vx = 0;
      draggedNodeRef.current.vy = 0;
      draggedNodeRef.current.hasBeenDragged = true;
    } else if (isPanningRef.current) {
      const dx = e.clientX - startPanRef.current.x;
      const dy = e.clientY - startPanRef.current.y;
      setPanX(basePanRef.current.x + dx);
      setPanY(basePanRef.current.y + dy);
    }
  };

  const handleMouseUp = () => {
    draggedNodeRef.current = null;
    isPanningRef.current = false;
  };

  const handleZoomBtn = (factor: number) => {
    setZoom((prev) => {
      const next = prev + factor;
      const clamped = Math.max(0.2, Math.min(next, 4.0));
      return Number(clamped.toFixed(2));
    });
  };

  const handleResetView = () => {
    setZoom(1.0);
    setPanX(0);
    setPanY(0);
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      {/* Intro Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif italic text-2xl text-white font-medium flex items-center gap-2">
            <Network className="w-6 h-6 text-blue-500 stroke-[1.5]" />
            Educational Intelligence Layer
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Redesigned Knowledge Object topology tracking concepts, aliases, prerequisites, and multi-disciplinary contexts.
          </p>
        </div>

        {/* Search tool */}
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
          <input
            id="inp_nexus_search"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search concepts, aliases..."
            className="w-full bg-slate-900/50 border border-slate-800 rounded-lg py-2 pl-9 pr-4 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Physics controls & state togglers */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-[#090c15]/60 border border-slate-900/80">
        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">Continuous Knowledge Object Map</span>
        </div>

        <div className="flex gap-1.5">
          {nodes.slice(0, 4).map((n) => (
            <button
              key={n.id}
              onClick={() => setSelectedNode(n)}
              className={`px-2.5 py-1 rounded text-[10px] font-mono transition-all ${
                selectedNode?.id === n.id
                  ? "bg-blue-600/10 border border-blue-500/30 text-blue-400"
                  : "bg-slate-950 border border-slate-800 text-slate-500 hover:text-slate-300"
              }`}
            >
              {n.label.split(" ")[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Main Network Graph Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Network Graph Frame */}
        <div
          ref={containerRef}
          className="lg:col-span-2 relative h-[420px] rounded-xl border border-[#2c2c2c] bg-[#1c1c1c] overflow-hidden shadow-inner select-none"
        >
          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className="w-full h-full cursor-grab active:cursor-grabbing bg-[#1c1c1c]"
          />

          {/* Left HUD: Legend */}
          <div className="absolute top-4 left-4 p-2.5 rounded bg-neutral-900/90 border border-neutral-800/80 backdrop-blur-md text-[9px] font-mono text-neutral-400 uppercase tracking-widest space-y-1.5 shadow-lg pointer-events-none">
            <div className="flex items-center gap-1.5 text-amber-500 font-bold">
              <span>★ ★ ★ ★ ★</span>
              <span className="text-neutral-400 font-normal">Level 5 Mastery</span>
            </div>
            <div className="flex items-center gap-1.5 text-amber-500 font-bold">
              <span>★ ★ ★</span>
              <span className="text-neutral-400 font-normal">Level 3 Mastery</span>
            </div>
            <div className="flex items-center gap-2 border-t border-neutral-800 pt-1 mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-white inline-block" />
              <span>Concept Node</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full border border-emerald-500/50 bg-emerald-500/20 inline-block animate-pulse" />
              <span className="text-[8px] text-emerald-400">Glow: Recent Session</span>
            </div>
          </div>

          {/* Right Floating Control HUD for Zoom & Pan Navigation */}
          <div className="absolute bottom-4 right-4 flex items-center gap-1 p-1 rounded-lg bg-neutral-900/95 border border-neutral-800/85 backdrop-blur shadow-xl">
            <button
              type="button"
              onClick={() => handleZoomBtn(0.15)}
              title="Zoom In"
              className="p-1.5 hover:bg-neutral-800 rounded text-neutral-300 hover:text-white transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
            
            <span className="text-[9.5px] font-mono text-neutral-400 px-1 select-none min-w-[38px] text-center">
              {Math.round(zoom * 100)}%
            </span>

            <button
              type="button"
              onClick={() => handleZoomBtn(-0.15)}
              title="Zoom Out"
              className="p-1.5 hover:bg-neutral-800 rounded text-neutral-300 hover:text-white transition-colors cursor-pointer"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>

            <div className="w-[1px] h-3.5 bg-neutral-850 mx-1" />

            <button
              type="button"
              onClick={handleResetView}
              title="Recenter and Reset Zoom"
              className="p-1.5 hover:bg-neutral-800 rounded text-neutral-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1 text-[9px] font-mono uppercase tracking-wider"
            >
              <Maximize className="w-3 h-3" />
              Reset
            </button>

            <div className="w-[1px] h-3.5 bg-neutral-850 mx-1" />

            <button
              type="button"
              onClick={() => setPhysicsActive(!physicsActive)}
              title={physicsActive ? "Pause Constellation Physics" : "Run Dynamic Physics Forces"}
              className={`px-2 py-1 rounded text-[9px] font-mono uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 ${
                physicsActive
                  ? "bg-indigo-600/15 text-indigo-400 border border-indigo-500/25 font-bold"
                  : "bg-transparent text-neutral-400 hover:text-white hover:bg-neutral-850"
              }`}
            >
              <span className={`w-1 h-1 rounded-full ${physicsActive ? "bg-indigo-400 animate-ping" : "bg-neutral-600"}`} />
              {physicsActive ? "Dynamic" : "Static"}
            </button>
          </div>
        </div>

        {/* Selected Node Sidebar Draw */}
        <div className="p-6 rounded-xl border border-slate-800 bg-[#090b10] flex flex-col justify-between space-y-6">
          {selectedNode ? (
            <div className="space-y-5">
              <div>
                <div className="flex flex-wrap gap-1.5">
                  {(selectedNode.contexts || [selectedNode.category || "General"]).map((ctxBadge, index) => (
                    <span 
                      key={index} 
                      className="text-[9px] font-mono text-blue-400 uppercase tracking-wider bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/10"
                    >
                      {ctxBadge}
                    </span>
                  ))}
                  <span className="text-[9px] font-mono text-slate-400 bg-slate-800/30 px-1.5 py-0.5 rounded uppercase">
                    {selectedNode.difficulty || "medium"}
                  </span>
                </div>
                <h3 className="font-serif italic text-xl text-white font-medium mt-3 leading-snug">
                  {selectedNode.canonicalName || selectedNode.label}
                </h3>
                
                {/* Aliases mapping */}
                {selectedNode.aliases && selectedNode.aliases.length > 1 && (
                  <p className="text-[9.5px] text-slate-500 font-mono mt-1">
                    aka: {selectedNode.aliases.filter(a => a !== selectedNode.label).join(", ")}
                  </p>
                )}
              </div>

              {/* Sidebar Tabs */}
              <div className="flex gap-1.5 border-b border-slate-800 pb-2">
                <button
                  type="button"
                  onClick={() => setSidebarTab("summary")}
                  className={`flex-1 py-1 text-center font-mono text-[9px] uppercase tracking-wider rounded ${sidebarTab === "summary" ? "bg-blue-600/10 text-blue-400 border border-blue-500/20" : "text-slate-500 hover:text-slate-300"}`}
                >
                  Structured Card
                </button>
                <button
                  type="button"
                  onClick={() => setSidebarTab("practice")}
                  className={`flex-1 py-1 text-center font-mono text-[9px] uppercase tracking-wider rounded ${sidebarTab === "practice" ? "bg-blue-600/10 text-blue-400 border border-blue-500/20" : "text-slate-500 hover:text-slate-300"}`}
                >
                  Recall Q&A
                </button>
                <button
                  type="button"
                  onClick={() => setSidebarTab("progress")}
                  className={`flex-1 py-1 text-center font-mono text-[9px] uppercase tracking-wider rounded ${sidebarTab === "progress" ? "bg-blue-600/10 text-blue-400 border border-blue-500/20" : "text-slate-500 hover:text-slate-300"}`}
                >
                  Telemetry
                </button>
              </div>

              {/* Tab: Summary */}
              {sidebarTab === "summary" && (
                <div className="space-y-4 animate-fade-in text-xs max-h-[250px] overflow-y-auto pr-1">
                  <div className="space-y-1">
                    <span className="block text-[9px] font-mono text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      <BookOpen className="w-3 h-3 text-slate-600" /> Canonical Definition
                    </span>
                    <p className="text-slate-300 leading-relaxed font-sans font-light">
                      {selectedNode.definition || selectedNode.desc}
                    </p>
                  </div>

                  {/* Extracted Equations */}
                  {selectedNode.equations && selectedNode.equations.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="block text-[9px] font-mono text-slate-500 uppercase tracking-wider flex items-center gap-1">
                        <Flame className="w-3 h-3 text-blue-400" /> Extracted Formal Axioms
                      </span>
                      <div className="space-y-1">
                        {selectedNode.equations.map((eq, idx) => (
                          <div 
                            key={idx} 
                            className="p-2 rounded bg-slate-950 border border-slate-900 font-mono text-slate-300 text-[10px] break-all text-center flex flex-col items-center justify-center gap-1"
                          >
                            <span className="text-blue-400">{eq}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Extracted Examples */}
                  {selectedNode.examples && selectedNode.examples.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="block text-[9px] font-mono text-slate-500 uppercase tracking-wider flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-emerald-400" /> Visceral Analogies & Examples
                      </span>
                      <div className="space-y-1">
                        {selectedNode.examples.map((ex, idx) => (
                          <div key={idx} className="p-2 rounded bg-slate-900/40 border border-slate-900/60 leading-relaxed text-slate-300 text-[10.5px]">
                            {ex}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Prerequisites list */}
                  <div className="space-y-1.5">
                    <span className="block text-[9px] font-mono text-slate-500 uppercase tracking-wider">Topological Prerequisites</span>
                    <div className="flex flex-wrap gap-1.5">
                      {(selectedNode.prerequisites && selectedNode.prerequisites.length > 0) ? (
                        selectedNode.prerequisites.map((req, i) => (
                          <span key={i} className="px-2 py-0.5 rounded bg-slate-950 border border-slate-900 text-slate-400 text-[10px] font-mono">
                            {req}
                          </span>
                        ))
                      ) : (
                        <span className="text-[10px] text-slate-600 font-mono italic">First-principles concept</span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab: Practice & Flashcards */}
              {sidebarTab === "practice" && (
                <div className="space-y-4 animate-fade-in text-xs max-h-[250px] overflow-y-auto pr-1">
                  <div className="p-3.5 rounded-lg border border-purple-900/20 bg-purple-950/5 space-y-2">
                    <span className="text-[8px] font-mono uppercase tracking-widest text-purple-400 font-bold flex items-center gap-1">
                      <Target className="w-3 h-3 text-purple-400 animate-pulse" /> Socratic Checkpoint
                    </span>
                    <p className="text-[11px] text-slate-300 leading-relaxed font-light">
                      "Explicate the core intellectual model and systems boundaries of {selectedNode.canonicalName || selectedNode.label}."
                    </p>
                    
                    {!showPracticeAnswer ? (
                      <button
                        type="button"
                        onClick={() => setShowPracticeAnswer(true)}
                        className="text-[9px] font-mono text-purple-400 underline uppercase hover:text-purple-300 block"
                      >
                        Reveal Model Answer Proof
                      </button>
                    ) : (
                      <p className="text-[10px] text-purple-300 leading-relaxed font-mono pt-1 border-t border-purple-900/20">
                        "The primary framework of {selectedNode.canonicalName || selectedNode.label} represents a critical node in {(selectedNode.contexts || []).join(" & ") || "scientific theories"}. Key prerequisite anchors include: {(selectedNode.prerequisites || []).join(", ") || "first-principles"}."
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <span className="block text-[9px] font-mono text-slate-500 uppercase tracking-wider">Spaced Repetition Active Cards</span>
                    <div className="p-2.5 rounded bg-slate-950/60 border border-slate-900 flex items-start gap-2.5">
                      <HelpCircle className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[10px] font-semibold text-slate-200 block">Leitner Recall Trigger</span>
                        <p className="text-[9.5px] text-slate-500 mt-0.5 font-light">
                          Dynamic box tracking enabled. Front: "Define {selectedNode.canonicalName || selectedNode.label}."
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab: Telemetry & Applications */}
              {sidebarTab === "progress" && (
                <div className="space-y-4 animate-fade-in text-xs max-h-[250px] overflow-y-auto pr-1">
                  {/* Mastery progress */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-[9px] font-mono text-slate-500">
                      <span>MASTERY DEGREE</span>
                      <span className="text-white font-semibold">{selectedNode.mastery}%</span>
                    </div>
                    <div className="h-1 bg-slate-950 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          selectedNode.mastery > 80 
                            ? "bg-emerald-500" 
                            : selectedNode.mastery > 45 
                              ? "bg-blue-500" 
                              : "bg-purple-500"
                        }`}
                        style={{ width: `${selectedNode.mastery}%` }}
                      />
                    </div>
                  </div>

                  {/* Telemetry metadata */}
                  <div className="grid grid-cols-2 gap-2 text-[9px] font-mono text-slate-400">
                    <div className="p-2 rounded bg-slate-950 border border-slate-900 space-y-0.5">
                      <span className="text-slate-600 block uppercase text-[8px]">RECALL REVIEWS</span>
                      <span className="text-emerald-400 font-bold">{(selectedNode.timesReviewed || 0) + 1} sessions</span>
                    </div>
                    <div className="p-2 rounded bg-slate-950 border border-slate-900 space-y-0.5">
                      <span className="text-slate-600 block uppercase text-[8px]">CONVERSATIONS</span>
                      <span className="text-slate-300 font-bold">{(selectedNode.sourceConversations || []).length || 1} active</span>
                    </div>
                  </div>

                  {/* Connected Learning Sessions */}
                  {selectedNode.learningSessions && selectedNode.learningSessions.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="block text-[9px] font-mono text-slate-500 uppercase tracking-wider flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-600" /> Session Mapping
                      </span>
                      <div className="space-y-1 font-mono text-[9px] text-slate-400">
                        {selectedNode.learningSessions.map((sessionTitle, idx) => (
                          <div key={idx} className="p-1 px-2 rounded bg-slate-950 border border-slate-900/60 truncate flex items-center gap-1.5">
                            <span className="w-1 h-1 rounded-full bg-blue-500 shrink-0" />
                            <span>{sessionTitle}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Source Conversations references */}
                  {selectedNode.sourceConversations && selectedNode.sourceConversations.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="block text-[9px] font-mono text-slate-500 uppercase tracking-wider flex items-center gap-1">
                        <FileText className="w-3 h-3 text-slate-600" /> Connected Knowledge Source
                      </span>
                      <div className="space-y-1 font-mono text-[9px] text-slate-400">
                        {selectedNode.sourceConversations.map((convId, idx) => (
                          <div key={idx} className="p-1 px-2 rounded bg-slate-950 border border-slate-900/60 truncate">
                            ID: {convId}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <Compass className="w-10 h-10 text-slate-600 mx-auto mb-3 stroke-[1.5]" />
              <p className="text-xs text-slate-400">Select a knowledge node to inspect pedagogical dependencies.</p>
            </div>
          )}

          {selectedNode && (
            <button
              id={`btn_launch_topic_${selectedNode.id}`}
              onClick={() => onLaunchTopic(selectedNode.label)}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              Initiate Socratic Discourse
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
