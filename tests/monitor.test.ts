import { describe, expect, it, vi } from 'vitest';
import { assess } from '../src/monitor/assess';
import { incidentsToCsv, REPEAT_AFTER_MS, shouldLog } from '../src/monitor/incidents';
import { fitBoxToViewport, formatDuration } from '../src/monitor/layout';
import { presetFrame } from '../src/monitor/presets';
import { createMockSource } from '../src/monitor/sources/mockSource';
import { parseFrame } from '../src/monitor/sources/websocketSource';
import { Incident, InferenceFrame, InferenceSource, SourceHandlers } from '../src/monitor/types';
import { lookupWord } from '../src/monitor/vocabulary';
import { createMonitorStore } from '../src/store/useMonitorStore';

const BOTH = { face: true, lip: true };

function frameWith(
  emotion: keyof NonNullable<InferenceFrame['face']>['emotions'],
  word: string,
  confidence = 0.93
): InferenceFrame {
  const base = presetFrame('normal');
  return {
    timestamp: 0,
    face: {
      box: null,
      emotions: {
        angry: 0,
        disgust: 0,
        fear: 0,
        happy: 0,
        neutral: 0,
        sad: 0,
        surprise: 0,
        [emotion]: 1,
      },
    },
    lip: { ...base.lip!, word, confidence, amplitude: 0.6 },
  };
}

describe('operator status', () => {
  it('reports the three demo presets as specified', () => {
    const normal = assess(presetFrame('normal'), BOTH);
    expect(normal.status).toBe('normal');
    expect(normal.score).toBeLessThanOrEqual(30);

    const agitation = assess(presetFrame('agitation'), BOTH);
    expect(agitation.status).toBe('critical');
    expect(agitation.score).toBeGreaterThanOrEqual(85);

    const deception = assess(presetFrame('deception'), BOTH);
    expect(deception.status).toBe('deception');
    expect(deception.score).toBeGreaterThanOrEqual(90);
  });

  it('treats the seventh class, surprise, as a real emotion', () => {
    const result = assess({ ...frameWith('surprise', 'আসুন'), lip: null }, BOTH);
    expect(result.emotion?.label).toBe('Surprise');
  });

  it('flags a neutral face mouthing a lethal word as deception', () => {
    expect(assess(frameWith('neutral', 'বোমা'), BOTH).status).toBe('deception');
  });

  it('never calls an angry face safe, even with a harmless word', () => {
    expect(assess(frameWith('angry', 'আসুন'), BOTH).status).toBe('elevated');
  });

  it('does not alarm on a dangerous word read with low confidence', () => {
    expect(assess(frameWith('neutral', 'বোমা', 0.2), BOTH).status).toBe('normal');
  });

  it('keeps every score inside its status range', () => {
    const emotions = ['angry', 'disgust', 'fear', 'happy', 'neutral', 'sad', 'surprise'] as const;
    for (const emotion of emotions) {
      for (const word of ['আসুন', 'বিপদ', 'আক্রমণ', 'বোমা']) {
        const { status, score } = assess(frameWith(emotion, word), BOTH);
        const [min, max] = {
          normal: [0, 30],
          elevated: [40, 84],
          critical: [85, 100],
          deception: [90, 100],
          standby: [0, 0],
        }[status];
        expect(score).toBeGreaterThanOrEqual(min);
        expect(score).toBeLessThanOrEqual(max);
      }
    }
  });
});

describe('single stream mode', () => {
  it('does not read an angry face as low risk when lip reading is off', () => {
    const result = assess(presetFrame('agitation'), { face: true, lip: false });
    expect(result.status).toBe('elevated');
    expect(result.score).toBeGreaterThan(70);
    expect(result.note).toContain('both streams');
  });

  it('cannot report deception with lip reading alone', () => {
    const result = assess(presetFrame('deception'), { face: false, lip: true });
    expect(result.status).toBe('elevated');
    expect(result.emotion).toBeNull();
  });

  it('shows no discrepancy value, because nothing was compared', () => {
    expect(assess(presetFrame('deception'), { face: true, lip: false }).discrepancy).toBeNull();
    expect(assess(presetFrame('deception'), BOTH).discrepancy).toBeGreaterThan(0.4);
  });
});

describe('never looks safe when nothing is being analyzed', () => {
  it('pauses when both streams are off', () => {
    const result = assess(presetFrame('normal'), { face: false, lip: false });
    expect(result).toMatchObject({ status: 'standby', score: null, standbyReason: 'streams_off' });
  });

  it('reports no signal when frames stop', () => {
    expect(assess(null, BOTH)).toMatchObject({ status: 'standby', standbyReason: 'no_signal' });
  });

  it('reports no subject when nobody is in view', () => {
    const empty: InferenceFrame = { timestamp: 1, face: null, lip: null };
    expect(assess(empty, BOTH)).toMatchObject({ status: 'standby', standbyReason: 'no_subject' });
  });
});

describe('vocabulary', () => {
  it('maps lexicon weights to threat badges', () => {
    expect(lookupWord('বোমা')).toMatchObject({ threat: 'High', translation: 'Bomb' });
    expect(lookupWord('বিপদ').threat).toBe('Medium');
    expect(lookupWord('আসুন')).toMatchObject({ threat: 'Low', translation: 'Welcome' });
    expect(lookupWord('অজানা').threat).toBe('Low');
  });
});

describe('incident log', () => {
  const critical = assess(presetFrame('agitation'), BOTH);

  it('logs a continuing alert once, then repeats it after the wait', () => {
    const seen = new Map<string, number>();
    expect(shouldLog(critical, 1000, seen)).toBe(true);
    expect(shouldLog(critical, 2000, seen)).toBe(false);
    expect(shouldLog(critical, 1000 + REPEAT_AFTER_MS, seen)).toBe(true);
  });

  it('does not flood the log when a status flickers between two values', () => {
    const elevated = assess(presetFrame('agitation'), { face: true, lip: false });
    const seen = new Map<string, number>();
    const rows = [critical, elevated, critical, elevated, critical].filter((item, index) =>
      shouldLog(item, index * 1000, seen)
    );
    expect(rows).toHaveLength(2);
  });

  it('leaves normal frames out unless a preset forced them', () => {
    const normal = assess(presetFrame('normal'), BOTH);
    expect(shouldLog(normal, 0, new Map())).toBe(false);
    expect(shouldLog(normal, 0, new Map(), true)).toBe(true);
  });
});

describe('csv export', () => {
  const incident: Incident = {
    id: 1,
    timestamp: Date.UTC(2026, 10, 2, 10, 42, 15),
    source: '=HYPERLINK("http://evil.test").mp4',
    emotion: 'Happiness',
    word: 'বোমা',
    romanized: 'boma',
    translation: 'Bomb',
    discrepancy: null,
    score: 91,
    status: 'deception',
    reason: 'Happiness on the face, but the lips read “বোমা”',
    snapshot: 'data:image/jpeg;base64,AAAA',
    faceBox: null,
    lipBox: null,
  };

  it('keeps Bengali readable in Excel and leaves the snapshot out', () => {
    const csv = incidentsToCsv([incident]);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    expect(csv).toContain('"বোমা"');
    expect(csv).not.toContain('base64');
  });

  it('stops a crafted file name from running as a formula', () => {
    expect(incidentsToCsv([incident])).toContain(`"'=HYPERLINK(""http://evil.test"").mp4"`);
  });
});

describe('video layout', () => {
  const box = { x: 0, y: 0, w: 1, h: 1 };

  it('leaves a 16:9 video unchanged', () => {
    const fitted = fitBoxToViewport(box, 16 / 9);
    expect(fitted.w).toBeCloseTo(1);
    expect(fitted.h).toBeCloseTo(1);
  });

  it('moves boxes inside the side bars of a 4:3 video', () => {
    const fitted = fitBoxToViewport(box, 4 / 3);
    expect(fitted.x).toBeCloseTo(0.125);
    expect(fitted.w).toBeCloseTo(0.75);
    expect(fitted.h).toBe(1);
  });

  it('moves boxes inside the top and bottom bars of a wide video', () => {
    const fitted = fitBoxToViewport(box, 32 / 9);
    expect(fitted.y).toBeCloseTo(0.25);
    expect(fitted.h).toBeCloseTo(0.5);
  });

  it('formats video times', () => {
    expect(formatDuration(75.9)).toBe('1:15');
    expect(formatDuration(Number.NaN)).toBe('0:00');
  });
});

describe('backend messages', () => {
  it('accepts a valid frame and a frame with nobody in view', () => {
    const valid = JSON.stringify(presetFrame('deception', 1000));
    expect(parseFrame(valid)?.lip?.word).toBe('বোমা');
    expect(parseFrame('{"timestamp":1,"face":null,"lip":null}')).not.toBeNull();
  });

  it.each(['not json', 'null', '{}', '{"timestamp":1,"face":null,"lip":{"word":"x"}}'])(
    'ignores the malformed message %s',
    (message) => expect(parseFrame(message)).toBeNull()
  );
});

describe('store', () => {
  function fakeBackend() {
    let handlers: SourceHandlers | undefined;
    const source: InferenceSource = {
      kind: 'websocket',
      initialFrame: null,
      connect(next) {
        handlers = next;
        return () => undefined;
      },
    };
    const store = createMonitorStore(source);
    store.getState().start();
    return { store, emit: (frame: InferenceFrame | null) => handlers?.onFrame(frame) };
  }

  it('adds one row per preset click and none from the frames that follow', () => {
    const store = createMonitorStore(createMockSource());
    store.getState().applyPreset('deception');
    store.getState().ingest({ ...presetFrame('deception'), timestamp: Date.now() });

    const { incidents, assessment } = store.getState();
    expect(incidents).toHaveLength(1);
    expect(incidents[0]).toMatchObject({ source: 'Live Cam 01', status: 'deception', word: 'বোমা' });
    expect(assessment.status).toBe('deception');
  });

  it('adds a row every time a preset is clicked, including a repeat', () => {
    const store = createMonitorStore(createMockSource());
    store.getState().applyPreset('normal');
    store.getState().applyPreset('normal');
    expect(store.getState().incidents).toHaveLength(2);
  });

  it('names the uploaded file as the source', () => {
    const store = createMonitorStore(createMockSource());
    store.getState().setIngestion('upload');
    store.getState().setUploadName('gate-4.mp4');
    store.getState().applyPreset('agitation');
    expect(store.getState().incidents[0].source).toBe('gate-4.mp4');
  });

  it('updates the status the moment a stream is toggled', () => {
    const store = createMonitorStore(createMockSource());
    store.getState().applyPreset('deception');
    store.getState().toggleStream('lip');
    expect(store.getState().assessment.status).toBe('normal');
    store.getState().toggleStream('face');
    expect(store.getState().assessment.status).toBe('standby');
  });

  it('auto-logs real frames that cross the threshold', () => {
    const { store, emit } = fakeBackend();
    emit({ ...presetFrame('normal'), timestamp: 1000 });
    expect(store.getState().incidents).toHaveLength(0);
    emit({ ...presetFrame('agitation'), timestamp: 2000 });
    expect(store.getState().incidents).toHaveLength(1);
  });

  it('clears the reading when the backend goes quiet', () => {
    const { store, emit } = fakeBackend();
    emit({ ...presetFrame('normal'), timestamp: 1000 });
    expect(store.getState().assessment.status).toBe('normal');
    emit(null);
    expect(store.getState().assessment).toMatchObject({ status: 'standby', score: null });
  });

  it('ignores presets while connected to a real backend', () => {
    const { store } = fakeBackend();
    store.getState().applyPreset('deception');
    expect(store.getState().incidents).toHaveLength(0);
  });

  it('saves a snapshot on each row when video is available', () => {
    const store = createMonitorStore(createMockSource());
    const unregister = store.getState().setFrameGrabber(() => 'data:image/jpeg;base64,AAAA');
    store.getState().applyPreset('agitation');
    expect(store.getState().incidents[0].snapshot).toContain('base64');

    unregister();
    store.getState().applyPreset('agitation');
    expect(store.getState().incidents[0].snapshot).toBeNull();
  });
});

describe('websocket source', () => {
  class FakeSocket {
    static OPEN = 1;
    static instances: FakeSocket[] = [];
    readyState = 1;
    bufferedAmount = 0;
    sent: unknown[] = [];
    onopen?: () => void;
    onmessage?: (event: { data: unknown }) => void;
    onclose?: () => void;
    constructor(public url: string) {
      FakeSocket.instances.push(this);
    }
    send(data: unknown) {
      this.sent.push(data);
    }
    close() {
      this.onclose?.();
    }
  }

  async function connect() {
    vi.useFakeTimers();
    FakeSocket.instances = [];
    vi.stubGlobal('WebSocket', FakeSocket);
    const { createWebSocketSource } = await import('../src/monitor/sources/websocketSource');
    const source = createWebSocketSource('ws://backend/stream');
    const onFrame = vi.fn();
    const onConnection = vi.fn();
    const stop = source.connect({ onFrame, onConnection });
    return { source, onFrame, onConnection, stop, socket: FakeSocket.instances[0] };
  }

  function cleanup() {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  }

  it('reports the reading as stale when an open socket stops sending', async () => {
    const { onFrame, socket, stop } = await connect();
    socket.onopen?.();
    socket.onmessage?.({ data: JSON.stringify(presetFrame('normal', 5)) });
    expect(onFrame).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(3000);
    expect(onFrame).toHaveBeenLastCalledWith(null);
    stop();
    cleanup();
  });

  it('goes offline, clears the reading and reconnects after a drop', async () => {
    const { onFrame, onConnection, socket, stop } = await connect();
    socket.onopen?.();
    socket.onclose?.();
    expect(onConnection).toHaveBeenLastCalledWith('offline');
    expect(onFrame).toHaveBeenLastCalledWith(null);

    vi.advanceTimersByTime(1000);
    expect(FakeSocket.instances).toHaveLength(2);
    stop();
    cleanup();
  });

  it('stops reconnecting once closed on purpose', async () => {
    const { stop } = await connect();
    stop();
    vi.advanceTimersByTime(30_000);
    expect(FakeSocket.instances).toHaveLength(1);
    cleanup();
  });

  it('skips video frames while the connection is backed up', async () => {
    const { source, socket, stop } = await connect();
    const jpeg = new Blob(['x']);
    source.sendVideoFrame?.(jpeg);
    socket.bufferedAmount = 2_000_000;
    source.sendVideoFrame?.(jpeg);
    expect(socket.sent).toHaveLength(1);
    stop();
    cleanup();
  });
});
