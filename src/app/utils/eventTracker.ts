// Client-side event tracker for demo realism
export interface TrackedEvent {
  id: string;
  type: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

const STORAGE_KEY = 'interviet_events';
const MAX_EVENTS = 100;

class EventTracker {
  track(type: string, metadata?: Record<string, any>): void {
    const event: TrackedEvent = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      timestamp: new Date(),
      metadata,
    };

    const events = this.getEvents();
    events.unshift(event);
    
    // Keep only the most recent MAX_EVENTS
    const trimmed = events.slice(0, MAX_EVENTS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  }

  getEvents(): TrackedEvent[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return [];
      
      const parsed = JSON.parse(stored);
      return parsed.map((e: any) => ({
        ...e,
        timestamp: new Date(e.timestamp),
      }));
    } catch {
      return [];
    }
  }

  clearEvents(): void {
    localStorage.removeItem(STORAGE_KEY);
  }
}

export const eventTracker = new EventTracker();
