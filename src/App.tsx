import { Component, lazy, Suspense, useCallback, useEffect, useState, type ReactNode } from 'react';
import { DEFAULT_CONFIG, POSES, configurationUrl, readConfiguration, type Configuration, type TrialResult } from './model';

const Scene = lazy(() => import('./Scene'));

class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    return this.state.failed ? <div className="scene-message" role="alert"><strong>The laboratory hit a snag.</strong><p>Enable WebGL in a recent browser, then reload to try again.</p><button onClick={() => window.location.reload()}>Reload laboratory ↗</button></div> : this.props.children;
  }
}

const verdicts = {
  supported: { title: 'Regrettably, this counts.', copy: 'You remained supported by the furniture. HR has been informed.', label: 'SUPPORTED', score: 94 },
  fallen: { title: 'A change in leadership.', copy: 'Gravity has voted you out. Your belongings will follow.', label: 'FLOOR ACQUIRED', score: 12 },
  unsupported: { title: 'Technically, you left.', copy: 'You are no longer supported by the furniture. A bold restructuring.', label: 'UNSUPPORTED', score: 31 },
};

export default function App() {
  const [config, setConfig] = useState<Configuration>(() => readConfiguration());
  const [running, setRunning] = useState(false);
  const [trial, setTrial] = useState(0);
  const [cameraReset, setCameraReset] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [result, setResult] = useState<TrialResult | null>(null);
  const [shareUrl, setShareUrl] = useState('');
  const [shareStatus, setShareStatus] = useState('');

  const reset = useCallback(() => {
    setRunning(false); setResult(null); setSeconds(0); setTrial(value => value + 1);
  }, []);
  const change = (next: Partial<Configuration>) => {
    reset(); setConfig(value => ({ ...value, ...next })); setShareUrl(''); setShareStatus('');
  };
  useEffect(() => {
    const restore = () => { reset(); setConfig(readConfiguration()); setShareUrl(''); setShareStatus(''); };
    window.addEventListener('popstate', restore);
    return () => window.removeEventListener('popstate', restore);
  }, [reset]);
  const complete = useCallback((outcome: TrialResult) => {
    setResult(outcome); setRunning(false); setSeconds(outcome.seconds);
  }, []);
  const start = () => {
    setTrial(value => value + 1); setResult(null); setSeconds(0); setRunning(true);
  };
  const share = async () => {
    const url = configurationUrl(config);
    setShareUrl(url);
    window.history.replaceState(null, '', url);
    try {
      await navigator.clipboard.writeText(url); setShareStatus('Link copied. Send questionable seating.');
    } catch {
      setShareStatus('Copy the setup link below.');
    }
  };
  const activePose = POSES.find(pose => pose.id === config.pose)!;
  const verdict = result ? verdicts[result.status] : null;

  return <div className="app-shell">
    <header className="masthead">
      <a className="brand" href="/" aria-label="Hostile Seating home"><span className="brand-symbol">h<span>↘</span></span><span>HOSTILE<br />SEATING<span className="brand-period">®*</span></span></a>
      <div className="institute">THE INSTITUTE OF<br />UNCONVENTIONAL SITTING</div>
      <a className="source-link" href="https://github.com/SeanRivardMorton/hostile-seating" target="_blank" rel="noreferrer">FIELD NOTES / SOURCE ↗</a>
    </header>

    <main>
      <section className="intro">
        <div className="eyebrow"><span className="status-dot" /> INDEPENDENT POSTURAL RESEARCH · VOL. 001</div>
        <div className="intro-line"><h1>Take a seat.<br /><em>Make it weird.</em></h1><p>Furniture is a suggestion.<br />Gravity is considerably less flexible.</p></div>
      </section>

      <div className="laboratory">
        <section className="viewport" aria-label="Interactive seating simulation">
          <div className="viewport-top"><span className="mono">LIVE SPECIMEN / {activePose.number}</span><span className={`trial-state ${running ? 'is-running' : ''}`}><span className="status-dot" />{running ? 'GRAVITY IN SESSION' : result ? 'TEST CONCLUDED' : 'AWAITING POOR JUDGEMENT'}</span></div>
          <div className="scene-container">
            <SceneBoundary><Suspense fallback={<div className="scene-message"><span className="loading-mark">↻</span><p>Preparing the furniture…</p></div>}>
              <Scene config={config} running={running} trial={trial} cameraReset={cameraReset} onComplete={complete} onProgress={setSeconds} />
            </Suspense></SceneBoundary>
          </div>
          <div className="viewport-bottom"><span>DRAG TO ORBIT · SCROLL TO INSPECT</span><button onClick={() => setCameraReset(value => value + 1)} aria-label="Reset camera">RESET VIEW ↺</button></div>
          <div className="specimen-label"><span className="crosshair">+</span><div><strong>SUBJECT 001</strong><span>Unreasonable confidence. Standard gravity.</span></div></div>
        </section>

        <aside className="control-panel" aria-label="Experiment controls">
          <div className="panel-heading"><h2>Your questionable setup</h2><span>01—04</span></div>
          <fieldset disabled={running}>
            <legend><span>01</span> SELECT A SURFACE</legend>
            <div className="furniture-options">{([{ id: 'chair', icon: '▥', name: 'Chair' }, { id: 'couch', icon: '▰', name: 'Couch' }, { id: 'pedestal', icon: '▤', name: 'Plinth' }] as const).map(item => <button key={item.id} className={config.furniture === item.id ? 'selected' : ''} aria-pressed={config.furniture === item.id} onClick={() => change({ furniture: item.id })}><span aria-hidden="true">{item.icon}</span>{item.name}</button>)}</div>
          </fieldset>
          <fieldset disabled={running}>
            <legend><span>02</span> ASSUME A POSITION</legend>
            <div className="pose-options">{POSES.map(pose => <button key={pose.id} className={config.pose === pose.id ? 'selected' : ''} aria-pressed={config.pose === pose.id} onClick={() => change({ pose: pose.id, lean: 0, offsetX: 0, offsetZ: 0, rotation: 0 })}><span className="pose-number">{pose.number}</span><span>{pose.name}</span><span className="pose-check">{config.pose === pose.id ? '↗' : '+'}</span></button>)}</div>
            <p className="pose-description">{activePose.subtitle}</p>
          </fieldset>
          <fieldset className="adjustments" disabled={running}>
            <legend><span>03</span> REFINE YOUR DISRESPECT</legend>
            <Slider label="Lean" value={config.lean} min={-60} max={60} step={1} unit="°" onChange={lean => change({ lean })} />
            <Slider label="Sideways" value={config.offsetX} min={-1.8} max={1.8} step={0.05} unit="m" onChange={offsetX => change({ offsetX })} />
            <Slider label="Forward / back" value={config.offsetZ} min={-1.5} max={1.5} step={0.05} unit="m" onChange={offsetZ => change({ offsetZ })} />
            <Slider label="Rotation" value={config.rotation} min={-180} max={180} step={5} unit="°" onChange={rotation => change({ rotation })} />
          </fieldset>
          <div className="experiment-action"><div className="action-label"><span>04</span> CONSULT THE LAWS OF PHYSICS</div><button className="simulate-button" disabled={running} onClick={start}>{running ? 'Negotiating with gravity…' : result ? 'Run it again' : 'Does this count as sitting?'}<span aria-hidden="true">↘</span></button>
            <div className="action-footer"><button onClick={reset}>Reset experiment ↺</button><span>{seconds.toFixed(1)} / 6.0 s</span></div>
            <div className="progress-track" role="progressbar" aria-label="Simulation time" aria-valuemin={0} aria-valuemax={6} aria-valuenow={Number(seconds.toFixed(1))}><span style={{ width: `${Math.min(seconds / 6, 1) * 100}%` }} /></div>
          </div>
        </aside>
      </div>

      <section className={`findings ${result ? `has-result ${result.status}` : ''}`} aria-live="polite" aria-atomic="true">
        <div className="findings-label"><span className="eyebrow">RESEARCH FINDINGS</span><span className="finding-code">{verdict ? verdict.label : 'PENDING REVIEW'}</span></div>
        <div className="findings-copy"><h2>{verdict ? verdict.title : 'The chair has no opinion. Yet.'}</h2><p>{verdict ? verdict.copy : 'Choose a position. Make some adjustments. Let gravity conduct the peer review.'}</p></div>
        <div className="presence"><strong>{verdict ? verdict.score : '—'}<span>/100</span></strong><span>EXECUTIVE PRESENCE*</span></div>
      </section>

      <section className="share-section"><div><h2>Bad posture is better with company.</h2><p>Share your starting setup. Let someone else take the fall.</p></div><button className="share-button" onClick={share}>Share this arrangement ↗</button>
        {shareUrl && <div className="share-output"><label htmlFor="share-url">{shareStatus}</label><input id="share-url" readOnly value={shareUrl} onFocus={event => event.target.select()} /></div>}
      </section>
      <footer><p>*Executive Presence is entirely fictional. The physics is real, the biomechanics are not.<br />Held-pose balance simulation · Fixed furniture · No actual executives were harmed.</p><div>BUILT AT DEVDAY EXCHANGE LONDON<br /><span>01 NOV 2026 · AN EXPERIMENT IN MISUSE</span></div><button className="restore-button" disabled={running} onClick={() => { reset(); setConfig({ ...DEFAULT_CONFIG }); setCameraReset(value => value + 1); }}>Restore laboratory</button></footer>
    </main>
  </div>;
}

function Slider({ label, value, min, max, step, unit, onChange }: { label: string; value: number; min: number; max: number; step: number; unit: string; onChange: (value: number) => void }) {
  const id = label.replaceAll(/[^a-z]/gi, '-').toLowerCase();
  return <div className="slider-row"><div><label htmlFor={id}>{label}</label><output htmlFor={id}>{value > 0 ? '+' : ''}{unit === 'm' ? value.toFixed(2) : value}{unit}</output></div><input id={id} type="range" min={min} max={max} step={step} value={value} onChange={event => onChange(Number(event.target.value))} /></div>;
}
