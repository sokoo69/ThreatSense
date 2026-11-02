import { EmotionProbabilities, EmotionType } from './types';

/**
 * EmotionTracker handles sliding window temporal smoothing across video frames.
 * Prevents rapid flickering of emotion classifications due to momentary lighting/motion noise.
 */
export class EmotionTracker {
  private windowSize: number;
  private history: EmotionProbabilities[] = [];

  constructor(windowSize = 5) {
    this.windowSize = Math.max(1, windowSize);
  }

  public setWindowSize(size: number) {
    this.windowSize = Math.max(1, size);
    while (this.history.length > this.windowSize) {
      this.history.shift();
    }
  }

  public addFrame(probabilities: EmotionProbabilities): EmotionProbabilities {
    this.history.push({ ...probabilities });
    if (this.history.length > this.windowSize) {
      this.history.shift();
    }

    return this.getSmoothedProbabilities();
  }

  public getSmoothedProbabilities(): EmotionProbabilities {
    if (this.history.length === 0) {
      return {
        angry: 0,
        neutral: 1,
        disgust: 0,
        sad: 0,
        happy: 0,
        fear: 0,
        surprise: 0,
      };
    }

    const emotions: EmotionType[] = ['angry', 'neutral', 'disgust', 'sad', 'happy', 'fear', 'surprise'];
    const smoothed: EmotionProbabilities = {
      angry: 0,
      neutral: 0,
      disgust: 0,
      sad: 0,
      happy: 0,
      fear: 0,
      surprise: 0,
    };

    // Compute moving average
    for (const frame of this.history) {
      for (const emotion of emotions) {
        smoothed[emotion] += frame[emotion] ?? 0;
      }
    }

    const n = this.history.length;
    let sum = 0;
    for (const emotion of emotions) {
      smoothed[emotion] = smoothed[emotion] / n;
      sum += smoothed[emotion];
    }

    // Normalize so sum equals 1.0
    if (sum > 0) {
      for (const emotion of emotions) {
        smoothed[emotion] = Number((smoothed[emotion] / sum).toFixed(4));
      }
    }

    return smoothed;
  }

  public clear() {
    this.history = [];
  }
}
