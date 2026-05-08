import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Terminal } from 'lucide-react';
import '../styles/home.css';

function WebhookFlowViz({ scrollY }) {
    // Hub center in % of SVG viewBox (0-100)
    const HX = 50, HY = 50;
    const sources = [
        { x: 10, y: 12, label: "Stripe", delay: 0 },
        { x: 88, y: 10, label: "GitHub", delay: 0.7 },
        { x: 94, y: 50, label: "Razorpay", delay: 1.4 },
        { x: 82, y: 86, label: "Shopify", delay: 2.1 },
        { x: 12, y: 82, label: "Slack", delay: 2.8 },
    ];

    const pathD = (s) => {
        const mx = (s.x + HX) / 2 + (s.x < 50 ? -8 : 8);
        const my = (s.y + HY) / 2 + (s.y < 50 ? -8 : 8);
        return `M ${s.x} ${s.y} Q ${mx} ${my} ${HX} ${HY}`;
    };

    return (
        <svg viewBox="0 0 100 100" style={{ width: "100%", height: "100%" }}>
            <defs>
                {sources.map((s, i) => (
                    <path key={i} id={`flow-${i}`} d={pathD(s)} />
                ))}
                <radialGradient id="hub-glow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#C4562B" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#C4562B" stopOpacity="0" />
                </radialGradient>
            </defs>

            {/* Grid background */}
            <rect width="100" height="100" fill="none" />

            {/* Glow */}
            <circle cx={HX} cy={HY} r={28} fill="url(#hub-glow)" />

            {/* Pulse rings */}
            {[0, 1, 2].map((r) => (
                <circle
                    key={r} cx={HX} cy={HY} fill="none"
                    stroke="#C4562B" strokeWidth="0.25"
                    style={{
                        animation: `pulse-hub 2.5s ease-out ${r * 0.85}s infinite`,
                    }}
                />
            ))}

            {/* Connection paths */}
            {sources.map((s, i) => (
                <path
                    key={i} d={pathD(s)} fill="none"
                    stroke="#D9CDBC" strokeWidth="0.3"
                    strokeDasharray="1.5 2.5" opacity={0.7}
                    style={{
                        strokeDashoffset: 0,
                        animation: `draw-path 1.5s ease ${i * 0.15}s both`,
                        strokeDasharray: "600",
                    }}
                />
            ))}

            {/* Animated packets on paths */}
            {sources.map((s, i) => (
                <circle
                    key={i} r="1.4" fill="#C4562B"
                    style={{
                        offsetPath: `path("${pathD(s)}")`,
                        animation: `packet-fly 2.2s cubic-bezier(0.4,0,0.2,1) ${s.delay}s infinite`,
                    }}
                />
            ))}

            {/* Source nodes */}
            {sources.map((s, i) => (
                <g key={i}>
                    <rect
                        x={s.x - 6} y={s.y - 3} width={12} height={6}
                        rx={1.5} fill="#EDE2D3" stroke="#D9CDBC" strokeWidth="0.4"
                    />
                    <text
                        x={s.x} y={s.y + 0.4}
                        textAnchor="middle" dominantBaseline="middle"
                        fontSize="1.7" fontFamily="DM Mono, monospace" fill="#6B5A4A"
                    >
                        {s.label}
                    </text>
                </g>
            ))}

            {/* Hub */}
            <circle cx={HX} cy={HY} r={6.5} fill="#1A120B" />
            <circle cx={HX} cy={HY} r={5} fill="#C4562B" />
            <circle cx={HX} cy={HY} r={3.5} fill="#1A120B" />
            <text
                x={HX} y={HY + 0.5}
                textAnchor="middle" dominantBaseline="middle"
                fontSize="2.8" fontFamily="Fraunces, serif" fontWeight="900" fill="#F5EDE0"
            >H</text>

            {/* Status tags floating off hub */}
            {[
                { x: HX + 10, y: HY - 12, text: "200 OK", col: "#52C41A" },
                { x: HX - 14, y: HY + 10, text: "500 ERR", col: "#E74C3C" },
                { x: HX + 6, y: HY + 13, text: "queued", col: "#FAAD14" },
            ].map((tag, i) => (
                <g key={i} style={{ animation: `bob ${2 + i * 0.4}s ease-in-out ${i * 0.5}s infinite` }}>
                    <rect x={tag.x - 5.5} y={tag.y - 2.2} width={11} height={4.5}
                        rx={1} fill={tag.col} opacity={0.15} />
                    <rect x={tag.x - 5.5} y={tag.y - 2.2} width={11} height={4.5}
                        rx={1} fill="none" stroke={tag.col} strokeWidth="0.35" />
                    <text x={tag.x} y={tag.y + 0.4}
                        textAnchor="middle" dominantBaseline="middle"
                        fontSize="1.6" fontFamily="DM Mono, monospace" fill={tag.col}
                    >{tag.text}</text>
                </g>
            ))}
        </svg>
    );
}

function ProblemVisual({ step }) {
    if (step === 0) return (
        <svg viewBox="0 0 220 180" style={{ width: "100%", maxWidth: 360 }}>
            {/* Sender */}
            <rect x="10" y="70" width="55" height="40" rx="4"
                fill="#EDE2D3" stroke="#D9CDBC" strokeWidth="1.5" />
            <text x="37" y="90" textAnchor="middle" dominantBaseline="middle"
                fontSize="8" fontFamily="DM Mono" fill="#6B5A4A">POST</text>
            <text x="37" y="100" textAnchor="middle" dominantBaseline="middle"
                fontSize="6" fontFamily="DM Mono" fill="#8C7B6E">/webhook</text>

            {/* Dashed broken line */}
            {[0, 1, 2, 3, 4, 5].map(i => (
                <rect key={i} x={76 + i * 14} y={88} width={8} height={4} rx={1}
                    fill="#D9CDBC" opacity={1 - i * 0.15} />
            ))}

            {/* Question marks */}
            <text x="118" y="94" textAnchor="middle" dominantBaseline="middle"
                fontSize="22" fill="#C4562B" style={{ animation: "bob 2s ease-in-out infinite" }}>?</text>

            {/* Void / receiver */}
            <rect x="155" y="70" width="55" height="40" rx="4"
                fill="#F5EDE0" stroke="#D9CDBC" strokeWidth="1.5" strokeDasharray="4 2" />
            <text x="182" y="87" textAnchor="middle" fontSize="8"
                fontFamily="DM Mono" fill="#D9CDBC">received</text>
            <text x="182" y="98" textAnchor="middle" fontSize="8"
                fontFamily="DM Mono" fill="#D9CDBC">nothing</text>

            <text x="110" y="140" textAnchor="middle" fontSize="8"
                fontFamily="DM Mono" fill="#8C7B6E" letterSpacing="1">where did it go?</text>
        </svg>
    );

    if (step === 1) return (
        <svg viewBox="0 0 220 180" style={{ width: "100%", maxWidth: 360 }}>
            {/* Terminal / log */}
            <rect x="25" y="30" width="170" height="100" rx="4"
                fill="#221810" stroke="#3D2E1A" strokeWidth="1" />
            {/* Traffic lights */}
            {["#E74C3C", "#FAAD14", "#52C41A"].map((c, i) => (
                <circle key={i} cx={38 + i * 11} cy={44} r={3.5} fill={c} opacity={0.8} />
            ))}
            <rect x="25" y="53" width="170" height="1" fill="#3D2E1A" />
            {/* Log lines — empty / question marks */}
            {[
                { text: "$ grep 'webhook' logs.txt", col: "#6B5A4A" },
                { text: "(no results)", col: "#E74C3C" },
                { text: "$ tail -f prod.log", col: "#6B5A4A" },
                { text: "... nothing ...", col: "#3D2E1A" },
                { text: "¯\\_(ツ)_/¯", col: "#8C7B6E" },
            ].map((l, i) => (
                <text key={i} x="35" y={68 + i * 12} fontSize="6.5"
                    fontFamily="DM Mono" fill={l.col}>{l.text}</text>
            ))}
            <text x="110" y="148" textAnchor="middle" fontSize="7.5"
                fontFamily="DM Mono" fill="#8C7B6E">can't reproduce. can't debug.</text>
        </svg>
    );

    // step === 2: solution
    return (
        <svg viewBox="0 0 220 200" style={{ width: "100%", maxWidth: 360 }}>
            {/* Dashboard card */}
            <rect x="15" y="20" width="90" height="120" rx="4"
                fill="#221810" stroke="#3D2E1A" strokeWidth="1" />
            {["#E74C3C", "#FAAD14", "#52C41A"].map((c, i) => (
                <circle key={i} cx={24 + i * 9} cy={31} r={3} fill={c} opacity={0.8} />
            ))}
            <rect x="15" y="39" width="90" height="1" fill="#3D2E1A" />
            {[
                { label: "stripe.pay.ok", dot: "#52C41A", time: "14:23" },
                { label: "gh.push", dot: "#52C41A", time: "14:22" },
                { label: "stripe.pay.fail", dot: "#E74C3C", time: "14:21" },
                { label: "slack.event", dot: "#52C41A", time: "14:20" },
                { label: "shopify.order", dot: "#52C41A", time: "14:19" },
            ].map((r, i) => (
                <g key={i} style={{ animation: `tl-in 0.4s ease ${i * 0.1}s both` }}>
                    <circle cx={23} cy={52 + i * 18} r={3} fill={r.dot} />
                    <text x={30} y={53 + i * 18} fontSize="5.5"
                        fontFamily="DM Mono" fill="#A89A8C">{r.label}</text>
                    <text x={96} y={53 + i * 18} textAnchor="end" fontSize="5"
                        fontFamily="DM Mono" fill="#6B5A4A">{r.time}</text>
                </g>
            ))}

            {/* Replay button */}
            <circle cx="155" cy="80" r="28" fill="#C4562B"
                style={{ animation: "bob 2.2s ease-in-out infinite" }} />
            <text x="155" y="86" textAnchor="middle" dominantBaseline="middle"
                fontSize="22" fill="#F5EDE0">↺</text>
            <text x="155" y="118" textAnchor="middle" fontSize="7.5"
                fontFamily="DM Mono" fill="#A89A8C">one-click replay</text>

            {/* Arrow from button back to stream */}
            <path d="M 130 82 Q 120 82 115 70" fill="none"
                stroke="#C4562B" strokeWidth="1.2" strokeDasharray="3 2"
                markerEnd="url(#arr)" />

            <text x="110" y="168" textAnchor="middle" fontSize="8"
                fontFamily="DM Mono" fill="#6B8A6E" letterSpacing="0.5">
                full visibility. instant replay.
            </text>
        </svg>
    );
}

function MiniTerminal() {
    const lines = [
        { dot: "g", text: "POST /webhook/uid-abc  200  38ms" },
        { dot: "g", text: "POST /webhook/uid-abc  200  41ms" },
        { dot: "r", text: "POST /webhook/uid-abc  500  timeout" },
        { dot: "y", text: "replaying event #a8f2…" },
    ];
    return (
        <div className="mini-term">
            {lines.map((l, i) => (
                <div key={i} className="t-line"
                    style={{ animation: `tl-in 0.35s ease ${i * 0.18}s both` }}>
                    <div className={`t-dot ${l.dot}`} />
                    <span style={{ color: l.dot === "r" ? "#E74C3C" : l.dot === "y" ? "#FAAD14" : "#A89A8C" }}>
                        {l.text}
                    </span>
                </div>
            ))}
        </div>
    );
}

function ReplayViz() {
    return (
        <div className="replay-viz">
            <svg viewBox="0 0 160 70" style={{ width: "100%", maxWidth: 260 }}>
                {/* Event block */}
                <rect x="5" y="22" width="38" height="26" rx="3"
                    fill="#EDE2D3" stroke="#D9CDBC" strokeWidth="1" />
                <text x="24" y="32" textAnchor="middle" fontSize="6"
                    fontFamily="DM Mono" fill="#6B5A4A">stripe</text>
                <text x="24" y="41" textAnchor="middle" fontSize="6"
                    fontFamily="DM Mono" fill="#6B5A4A">.paid</text>

                {/* Arrow → replay btn */}
                <path d="M 43 35 L 60 35" stroke="#D9CDBC" strokeWidth="1.2"
                    markerEnd="url(#arrowhead)" />

                {/* Replay btn */}
                <circle cx="76" cy="35" r="14" fill="#C4562B"
                    style={{ animation: "bob 1.8s ease-in-out infinite" }} />
                <text x="76" y="38.5" textAnchor="middle" dominantBaseline="middle"
                    fontSize="14" fill="#F5EDE0">↺</text>

                {/* Arrow → replayed */}
                <path d="M 90 35 L 107 35" stroke="#D9CDBC" strokeWidth="1.2" />

                {/* Replayed block */}
                <rect x="107" y="22" width="38" height="26" rx="3"
                    fill="#5C7A60" opacity={0.85} />
                <text x="126" y="32" textAnchor="middle" fontSize="6"
                    fontFamily="DM Mono" fill="#F5EDE0">stripe</text>
                <text x="126" y="41" textAnchor="middle" fontSize="5.5"
                    fontFamily="DM Mono" fill="#C8E6C9">.paid ↺</text>

                <text x="80" y="60" textAnchor="middle" fontSize="6"
                    fontFamily="DM Mono" fill="#8C7B6E">same payload · new attempt</text>

                <defs>
                    <marker id="arrowhead" markerWidth="5" markerHeight="5"
                        refX="4" refY="2.5" orient="auto">
                        <polygon points="0 0, 5 2.5, 0 5" fill="#D9CDBC" />
                    </marker>
                </defs>
            </svg>
        </div>
    );
}

function TimelineMini() {
    const rows = [
        { label: "stripe.payment.succeeded", status: "g", time: "14:23:01" },
        { label: "github.push.main", status: "g", time: "14:22:47" },
        { label: "razorpay.payment.failed", status: "r", time: "14:21:30" },
        { label: "slack.message", status: "g", time: "14:20:12" },
    ];
    return (
        <div className="timeline-mini">
            {rows.map((r, i) => (
                <div key={i} className="tl-row"
                    style={{ animation: `tl-in 0.4s ease ${i * 0.12}s both` }}>
                    <div className="tl-dot" style={{ background: r.status === "g" ? "#52C41A" : "#E74C3C" }} />
                    <div className="tl-name">{r.label}</div>
                    <div className="tl-time">{r.time}</div>
                </div>
            ))}
        </div>
    );
}

export default function Home() {
    const navigate = useNavigate();
    const [scrollY, setScrollY] = useState(0);
    const [navScrolled, setNav] = useState(false);
    const [problemStep, setStep] = useState(0);
    const [stepsIn, setStepsIn] = useState(false);
    const [statsIn, setStatsIn] = useState(false);
    const [counts, setCounts] = useState({ a: 0, b: 0, c: 0 });
    const [tapeSpeed, setTapeSpeed] = useState(20);
    const [featIn, setFeatIn] = useState(false);

    const handleAuthAction = () => {
        if (localStorage.getItem('token')) {
            navigate('/dashboard');
        } else {
            navigate('/login');
        }
    };

    const problemRef = useRef(null);
    const stepsRef = useRef(null);
    const statsRef = useRef(null);
    const featRef = useRef(null);
    const lastY = useRef(0);

    /* ── SCROLL LISTENER ── */
    useEffect(() => {
        const onScroll = () => {
            const y = window.scrollY;
            const dy = y - lastY.current;
            lastY.current = y;

            setScrollY(y);
            setNav(y > 60);

            // tape speed reacts to scroll velocity
            setTapeSpeed(Math.max(8, 22 - Math.abs(dy) * 0.5));

            // Problem sticky progress
            if (problemRef.current) {
                const rect = problemRef.current.getBoundingClientRect();
                const total = problemRef.current.offsetHeight - window.innerHeight;
                const scrolled = -rect.top;
                const p = Math.max(0, Math.min(1, scrolled / total));
                if (p < 0.32) setStep(0);
                else if (p < 0.65) setStep(1);
                else setStep(2);
            }
        };
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    /* ── INTERSECTION OBSERVERS ── */
    useEffect(() => {
        const makeObs = (cb, opts = {}) =>
            new IntersectionObserver((entries) => entries.forEach(e => { if (e.isIntersecting) cb(e); }), opts);

        const stepsObs = makeObs(() => setStepsIn(true), { threshold: 0.15 });
        const featObs = makeObs(() => setFeatIn(true), { threshold: 0.1 });
        const statsObs = makeObs(() => {
            setStatsIn(true);
            const dur = 2200, start = Date.now();
            const targets = { a: 2847, b: 99.9, c: 847 };
            const tick = () => {
                const t = Math.min((Date.now() - start) / dur, 1);
                const e = 1 - Math.pow(1 - t, 3);
                setCounts({
                    a: Math.floor(e * targets.a),
                    b: parseFloat((e * targets.b).toFixed(1)),
                    c: Math.floor(e * targets.c),
                });
                if (t < 1) requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
        }, { threshold: 0.3 });

        if (stepsRef.current) stepsObs.observe(stepsRef.current);
        if (featRef.current) featObs.observe(featRef.current);
        if (statsRef.current) statsObs.observe(statsRef.current);
        return () => [stepsObs, featObs, statsObs].forEach(o => o.disconnect());
    }, []);

    /* ── REVEAL OBSERVER ── */
    useEffect(() => {
        const obs = new IntersectionObserver(
            (entries) => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add("in"); }),
            { threshold: 0.08 }
        );
        document.querySelectorAll(".reveal").forEach(el => obs.observe(el));
        return () => obs.disconnect();
    }, []);

    /* ── STEP CARD REVEAL ── */
    useEffect(() => {
        if (!stepsIn) return;
        document.querySelectorAll(".step-card").forEach((el, i) => {
            setTimeout(() => el.classList.add("in"), i * 130);
        });
    }, [stepsIn]);

    /* ── FEAT CARD REVEAL ── */
    useEffect(() => {
        if (!featIn) return;
        document.querySelectorAll(".feat-card").forEach((el, i) => {
            setTimeout(() => el.classList.add("in"), i * 100);
        });
    }, [featIn]);

    /* ── DERIVED PARALLAX VALUES ── */
    const heroTitleY = scrollY * 0.28;
    const heroSubY = scrollY * 0.18;
    const heroVizY = scrollY * 0.12;
    const heroBlob = scrollY * 0.1;
    const badgeRot = scrollY * 0.12;

    /* ── PROBLEM CONFIG ── */
    const problems = [
        {
            num: "01", kicker: "The Silent Failure",
            title: "Your webhooks vanish into the void.",
            body: "Stripe fires. Payment lands. Your server receives nothing—or so it seems. You grep logs. You tail prod. You find absolutely zero. Three hours disappear debugging something that took two minutes to break.",
            numCol: "rgba(196,86,43,0.12)", kicCol: "#C4562B", titleCol: "#1A120B", bodyCol: "#6B5A4A",
            bg: "#F5EDE0",
        },
        {
            num: "02", kicker: "The Reproduction Problem",
            title: "Can't reproduce it. Can't fix it.",
            body: "The bug only happens in production. You need to trigger the exact same webhook again, with the same headers and the same payload. Your only option is to wait, pray, and hope it fails the same way twice.",
            numCol: "rgba(26,18,11,0.08)", kicCol: "#1A120B", titleCol: "#1A120B", bodyCol: "#6B5A4A",
            bg: "#EDE2D3",
        },
        {
            num: "03", kicker: "The Solution",
            title: "WebHookHub records everything.",
            body: "Every payload. Every header. Every timestamp. Every response code. See it all in a dashboard built for debugging. Replay any event with one click. Debug in seconds, not hours.",
            numCol: "rgba(196,86,43,0.15)", kicCol: "#E07A52", titleCol: "#F5EDE0", bodyCol: "#A89A8C",
            bg: "#1A120B",
        },
    ];
    const p = problems[problemStep];

    return (
        <>


            {/* ── NAV ──────────────────────────────────────── */}
            <nav className={`nav ${navScrolled ? "scrolled" : ""}`}>
                <div className="nav-logo">WebHook<span>Hub</span></div>
                <ul className="nav-links">
                    {/* Links removed as per request */}
                </ul>
                <button className="nav-btn" onClick={handleAuthAction}>Get Started →</button>
            </nav>

            {/* ── HERO ─────────────────────────────────────── */}
            <section className="hero">
                {/* Background grid — parallax */}
                <div className="hero-grid-bg"
                    style={{ transform: `translateY(${heroBgParallax(scrollY)}px)` }} />

                {/* Atmospheric blob */}
                <div className="hero-blob"
                    style={{ transform: `translateY(${heroBlob}px) scale(${1 + scrollY * 0.0002})` }} />

                {/* LEFT: Copy */}
                <div className="hero-left">
                    <div className="hero-eyebrow">Developer Tool </div>

                    <h1 className="hero-h1"
                        style={{ transform: `translateY(${-heroTitleY}px)` }}>
                        <span>Catch Every</span><br />
                        <span className="em">Webhook.</span><br />
                        <span className="sm">Miss Absolutely Nothing.</span>
                    </h1>

                    <p className="hero-sub"
                        style={{ transform: `translateY(${-heroSubY}px)`, opacity: Math.max(0.3, 1 - scrollY / 700) }}>
                        A black-box recorder for your API events. Receive, log, monitor, and replay webhook events with surgical precision — before they ghost you again.
                    </p>

                    <div className="hero-actions">
                        <button className="btn-p" onClick={handleAuthAction}><span>Start Free →</span></button>
                    </div>
                </div>

                {/* RIGHT: Webhook flow viz */}
                <div className="hero-right"
                    style={{ transform: `translateY(${-heroVizY}px)` }}>

                    {/* Rotating circular badge */}
                    <div className="hero-badge"
                        style={{ transform: `rotate(${badgeRot}deg)` }}>
                        <svg viewBox="0 0 100 100">
                            <defs>
                                <path id="cp"
                                    d="M 50,50 m -37,0 a 37,37 0 1,1 74,0 a 37,37 0 1,1 -74,0" />
                            </defs>
                            <text fontSize="9" letterSpacing="3.2">
                                <textPath href="#cp">
                                    MONITOR · REPLAY · DEBUG · CAPTURE ·&nbsp;
                                </textPath>
                            </text>
                        </svg>
                    </div>

                    {/* Central flow visualization */}
                    <div style={{ width: "100%", height: "100%", padding: "5%" }}>
                        <WebhookFlowViz scrollY={scrollY} />
                    </div>
                </div>

                {/* Scroll indicator */}
                <div className="scroll-hint"
                    style={{ opacity: Math.max(0, 1 - scrollY / 280) }}>
                    <div className="scroll-hint-line" />
                    Scroll
                </div>
            </section>

            {/* ── TAPE MARQUEE ─────────────────────────────── */}
            <div className="tape">
                <div className="tape-track">
                    <div className="tape-inner"
                        style={{ animation: `marquee-run ${tapeSpeed}s linear infinite` }}>
                        {[0, 1].map((_, pass) => (
                            <div key={pass} style={{ display: "flex" }}>
                                {[
                                    "Stripe", "GitHub", "Razorpay", "Shopify", "Twilio",
                                    "Slack", "SendGrid", "Discord", "PayPal", "Linear", "Jira",
                                ].map((s) => (
                                    <span key={s} className="tape-item">
                                        {s} <span className="tape-diamond">◆</span>
                                    </span>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── PROBLEM STICKY ───────────────────────────── */}
            <div ref={problemRef} className="problem-scroll-container">
                <div className="problem-sticky">
                    {/* Background transition */}
                    <div className="prob-bg-fill" style={{ background: p.bg }} />

                    <div className="problem-grid">
                        {/* Left: big number + text */}
                        <div>
                            <div className="prob-num" style={{ color: p.numCol }}>
                                {p.num}
                            </div>
                            <div className="prob-kicker" style={{ color: p.kicCol }}>
                                {p.kicker}
                            </div>
                            <div className="prob-title" style={{ color: p.titleCol }}>
                                {p.title}
                            </div>
                            <div className="prob-body" style={{ color: p.bodyCol }}>
                                {p.body}
                            </div>
                        </div>

                        {/* Right: contextual illustration */}
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <ProblemVisual step={problemStep} />
                        </div>
                    </div>

                    {/* Step pills */}
                    <div className="prob-dots">
                        {[0, 1, 2].map((i) => (
                            <div key={i} className="prob-dot" style={{
                                width: i === problemStep ? 28 : 8,
                                background: i === problemStep ? p.kicCol : "#D9CDBC",
                            }} />
                        ))}
                    </div>
                </div>
            </div>

            {/* ── HOW IT WORKS ─────────────────────────────── */}
            <section className="steps" id="how">
                <div className="s-label reveal">Process</div>
                <h2 className="s-title reveal d1">
                    How it <em>actually</em><br />works
                </h2>

                <div ref={stepsRef} className="steps-grid" style={{ marginTop: "5rem" }}>
                    {[
                        {
                            n: "01",
                            title: "Get your endpoint",
                            body: "We provision a unique URL like /webhook/{userId}. Point any external service at it — no config needed.",
                        },
                        {
                            n: "02",
                            title: "Events arrive live",
                            body: "Every incoming request is captured instantly. Payload, headers, IP, timestamp — all stored, nothing discarded.",
                        },
                        {
                            n: "03",
                            title: "Inspect & debug",
                            body: "Open the dashboard. See your event stream in real time. Filter by status, source, or time window.",
                        },
                        {
                            n: "04",
                            title: "Replay anytime",
                            body: "One click to resend any event. Exact same payload, exact same headers. No more waiting for production to fail again.",
                        },
                    ].map((s, i) => (
                        <div key={i} className="step-card" style={{ transitionDelay: `${i * 0.12}s` }}>
                            <div className="step-n">{s.n}</div>
                            <div className="step-h">{s.title}</div>
                            <div className="step-p">{s.body}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── FEATURES ─────────────────────────────────── */}
            <section className="features" id="features" ref={featRef}>
                <div className="s-label reveal">Capabilities</div>
                <h2 className="s-title reveal d1" style={{ marginBottom: 0 }}>
                    Built for devs who<br />hate <em>surprises</em>
                </h2>

                <div className="feat-grid">
                    {/* Card 1 — dark wide */}
                    <div className="feat-card dark">
                        <div className="feat-tag">Core · Real-time capture</div>
                        <div className="feat-h">
                            Every request logged before your handler even runs.
                        </div>
                        <div className="feat-p">
                            The moment a webhook hits your endpoint, WebHookHub intercepts and stores it — payload, all headers, source IP, timing. Even if your downstream logic crashes, the record survives.
                        </div>
                        <MiniTerminal />
                        <div className="feat-ghost">∞</div>
                    </div>

                    {/* Card 2 — replay */}
                    <div className="feat-card">
                        <div className="feat-tag">Replay engine</div>
                        <div className="feat-h">One-click event replay</div>
                        <div className="feat-p">
                            Reproduce any event exactly as it arrived. Same headers, same body, new attempt.
                        </div>
                        <ReplayViz />
                        <div className="feat-ghost">↺</div>
                    </div>

                    {/* Card 3 — dashboard */}
                    <div className="feat-card">
                        <div className="feat-tag">Dashboard</div>
                        <div className="feat-h">Visual event timeline</div>
                        <div className="feat-p">Chronological stream with live status indicators.</div>
                        <TimelineMini />
                    </div>

                    {/* Card 4 — filtering */}
                    <div className="feat-card">
                        <div className="feat-tag">Filtering</div>
                        <div className="feat-h">Find the one that failed</div>
                        <div className="feat-p">
                            Filter by source service, HTTP status, time range, or payload content. Surgical debug across thousands of events.
                        </div>
                        <div className="feat-ghost">⌕</div>
                    </div>

                    {/* Card 5 — wide, failure handling */}
                    <div className="feat-card wide">
                        <div className="feat-tag">Failure handling · Auto-retry</div>
                        <div className="feat-h">Failures surface immediately. Retries happen automatically.</div>
                        <div className="feat-p">
                            Failed events are tagged and promoted to the top of your feed. Configure automatic retry with exponential backoff — your payloads won't disappear just because a downstream service hiccuped.
                        </div>
                        <div className="feat-ghost">!</div>
                    </div>
                </div>
            </section>

            {/* ── HOW TO USE GUIDE ─────────────────────────── */}
            <section className="guide-section reveal" id="guide">
                <div className="s-label">Onboarding</div>
                <h2 className="s-title">Choose your <em>Workflow</em></h2>
                <p className="guide-sub">WebHookHub adapts to how you work. Whether you're debugging a payload or building a local integration.</p>

                <div className="guide-grid">
                    {/* Path 1: The Inspector */}
                    <div className="guide-card">
                        <div className="guide-card-header">
                            <div className="guide-icon-box blue">
                                <Search size={20} />
                            </div>
                            <div>
                                <h3>The Inspector</h3>
                                <p>Simple capture & debugging</p>
                            </div>
                        </div>
                        <ul className="guide-steps">
                            <li>
                                <span className="step-num">1</span>
                                <p><strong>Create a Project:</strong> Name your project and get your unique endpoint URL instantly.</p>
                            </li>
                            <li>
                                <span className="step-num">2</span>
                                <p><strong>Connect Provider:</strong> Paste the URL into GitHub, Stripe, or Razorpay's webhook settings.</p>
                            </li>
                            <li>
                                <span className="step-num">3</span>
                                <p><strong>Inspect Live:</strong> Watch events land on your dashboard in real-time with full headers and payloads.</p>
                            </li>
                            <li>
                                <span className="step-num">4</span>
                                <p><strong>One-Click Replay:</strong> Found a bug? Click "Replay" to resend the exact same payload whenever you're ready.</p>
                            </li>
                        </ul>
                        <div className="guide-visual">
                            <div className="mock-dash-mini">
                                <div className="mock-row success"><span>POST</span> /payment.success</div>
                                <div className="mock-row fail"><span>POST</span> /order.failed</div>
                            </div>
                        </div>
                    </div>

                    {/* Path 2: The Developer */}
                    <div className="guide-card">
                        <div className="guide-card-header">
                            <div className="guide-icon-box rust">
                                <Terminal size={20} />
                            </div>
                            <div>
                                <h3>The Developer</h3>
                                <p>Local tunneling & automation</p>
                            </div>
                        </div>
                        <ul className="guide-steps">
                            <li>
                                <span className="step-num">1</span>
                                <p><strong>Install & Auth:</strong> Install our tool globally via <code>npm</code> and run <code>webhookhub login</code> to link your account.</p>
                            </li>
                            <li>
                                <span className="step-num">2</span>
                                <p><strong>Set Local Target:</strong> In your dashboard, set your local server's URL as the forwarding target.</p>
                            </li>
                            <li>
                                <span className="step-num">3</span>
                                <p><strong>Fire the Tunnel:</strong> Run the tunnel command to bridge cloud events directly to your local backend.</p>
                            </li>
                            <li>
                                <span className="step-num">4</span>
                                <p><strong>Debug with Replay:</strong> Re-trigger local logic repeatedly using the dashboard Replay button without new cloud events.</p>
                            </li>
                        </ul>
                        <div className="guide-terminal">
                            <div className="term-header">
                                <div className="term-dots"><span></span><span></span><span></span></div>
                                <span>zsh — 80×24</span>
                            </div>
                            <div className="term-body">
                                <div className="term-line"><span className="prompt">$</span> npm install -g webhookhub-tool-abhi777</div>
                                <div className="term-line"><span className="prompt">$</span> webhookhub login</div>
                                <div className="term-line"><span className="prompt">$</span> webhookhub -p my-project -t http://localhost:3000</div>
                                <div className="term-line success">🚀 Tunnel Active: Forwarding to localhost...</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── STATS ────────────────────────────────────── */}
            <div ref={statsRef} className="stats-band">
                {[
                    { n: statsIn ? counts.a.toLocaleString() : "0", label: "Events captured today" },
                    { n: statsIn ? `${counts.b}%` : "0%", label: "Uptime guarantee" },
                    { n: statsIn ? `${counts.c}ms` : "0ms", label: "Average replay latency" },
                ].map((s, i) => (
                    <div key={i} className="stat">
                        <div className="stat-n"
                            style={{ animation: statsIn ? `count-bounce 0.4s ease ${i * 0.2}s both` : "none" }}>
                            {s.n}
                        </div>
                        <div className="stat-l">{s.label}</div>
                    </div>
                ))}
            </div>

            {/* ── CTA ──────────────────────────────────────── */}
            <section className="cta-band">
                <div className="cta-mesh" />
                <h2 className="cta-h reveal">
                    Stop guessing.<br /><em>Start knowing.</em>
                </h2>
                <p className="cta-sub reveal d1">
                    Set up your first webhook endpoint in under 60 seconds.<br />
                    No credit card. No configuration. No more blind spots.
                </p>
                <button className="btn-cta reveal d2" onClick={handleAuthAction}>
                    Start Capturing Webhooks →
                </button>
            </section>

            {/* ── FOOTER ───────────────────────────────────── */}
            <footer className="footer">
                <div className="footer-grid">
                    <div>
                        <div className="f-logo">WebHook<span>Hub</span></div>
                        <div className="f-desc">
                            A developer tool for capturing, inspecting, and replaying webhook events. Built with Spring Boot and a deep hatred of silent failures.
                        </div>
                    </div>
                    {[
                        { h: "Resources", links: [
                            { n: "GitHub", u: "https://github.com/Abhishek720777/WebHookHub" },
                            { n: "Documentation", u: "#" },
                            { n: "About", u: "#" },
                            { n: "Contact", u: "#" }
                        ]},
                    ].map((col) => (
                        <div key={col.h} className="f-col">
                            <h4>{col.h}</h4>
                            <ul>
                                {col.links.map((l) => (
                                    <li key={l.n}>
                                        <a href={l.u} target={l.n === "GitHub" ? "_blank" : "_self"} rel={l.n === "GitHub" ? "noopener noreferrer" : ""}>
                                            {l.n}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
                <div className="f-bottom">
                    <span>© 2025 WebHookHub — Built with <b>♥</b> for the debug-minded.</span>
                    <span>Privacy · Terms · Status</span>
                </div>
            </footer>
        </>
    );
}

function heroBgParallax(y) { return y * 0.08; }