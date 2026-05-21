export interface FinalizeRealtimeQaPair {
  questionNumber: number;
  questionText: string;
  answerText: string;
  questionType?: string;
  difficulty?: string;
  askedAt?: string;
  answeredAt?: string;
}

interface DialogueTurn {
  id: string;
  role: 'assistant' | 'user';
  text: string;
  timestamp: Date;
}

export class TranscriptBuilder {
  private turns: DialogueTurn[] = [];

  /**
   * Adds or updates a turn in the dialogue list.
   * If a turn with the same id exists, it will be updated (important for streaming deltas or final updates).
   */
  public updateTurn(id: string, role: 'assistant' | 'user', text: string): void {
    const existingIndex = this.turns.findIndex((t) => t.id === id);
    if (existingIndex > -1) {
      this.turns[existingIndex].text = text;
    } else {
      this.turns.push({
        id,
        role,
        text,
        timestamp: new Date(),
      });
    }
  }

  /**
   * Appends text to a turn if it exists, otherwise creates it.
   * Useful for delta events.
   */
  public appendDelta(id: string, role: 'assistant' | 'user', delta: string): void {
    const existingIndex = this.turns.findIndex((t) => t.id === id);
    if (existingIndex > -1) {
      this.turns[existingIndex].text += delta;
    } else {
      this.turns.push({
        id,
        role,
        text: delta,
        timestamp: new Date(),
      });
    }
  }

  /**
   * Clears all recorded turns.
   */
  public clear(): void {
    this.turns = [];
  }

  /**
   * Generates the raw transcript string representation of the conversation.
   */
  public getRawTranscript(): string {
    return this.turns
      .filter((t) => t.text.trim().length > 0)
      .map((t) => {
        const prefix = t.role === 'assistant' ? 'Interviewer' : 'Candidate';
        return `${prefix}: ${t.text.trim()}`;
      })
      .join('\n\n');
  }

  /**
   * Returns a copy of the list of turns.
   */
  public getTurns(): DialogueTurn[] {
    return [...this.turns];
  }

  /**
   * Reconstructs turns from existing lists (e.g. from service history or fallback state).
   */
  public setTurns(turns: DialogueTurn[]): void {
    this.turns = [...turns];
  }

  /**
   * Structures the turn history into Q&A pairs for the finalize endpoint.
   * Each assistant turn starts a new pair, and subsequent user turns fill the answer text.
   */
  public getQaPairs(): FinalizeRealtimeQaPair[] {
    const pairs: FinalizeRealtimeQaPair[] = [];
    let currentPair: FinalizeRealtimeQaPair | null = null;
    let questionIndex = 1;

    // Filter out turns with empty text
    const activeTurns = this.turns.filter((t) => t.text.trim().length > 0);

    for (const turn of activeTurns) {
      if (turn.role === 'assistant') {
        // If we have an existing pair, push it before creating a new one
        if (currentPair) {
          pairs.push(currentPair);
        }
        
        currentPair = {
          questionNumber: questionIndex++,
          questionText: turn.text.trim(),
          answerText: '',
          questionType: 'general',
          difficulty: 'mid',
          askedAt: turn.timestamp.toISOString(),
        };
      } else if (turn.role === 'user') {
        if (!currentPair) {
          // User spoke before any interviewer question.
          // Create a placeholder question pair.
          currentPair = {
            questionNumber: questionIndex++,
            questionText: '(Mở đầu cuộc hội thoại)',
            answerText: turn.text.trim(),
            questionType: 'opening',
            difficulty: 'easy',
            answeredAt: turn.timestamp.toISOString(),
          };
        } else {
          // Append user response to the current question answerText
          if (currentPair.answerText) {
            currentPair.answerText += ' ' + turn.text.trim();
          } else {
            currentPair.answerText = turn.text.trim();
            currentPair.answeredAt = turn.timestamp.toISOString();
          }
        }
      }
    }

    if (currentPair) {
      pairs.push(currentPair);
    }

    return pairs;
  }

  /**
   * Validates if there's at least one Q&A pair that has both non-empty question and answer text.
   */
  public validate(): boolean {
    const pairs = this.getQaPairs();
    return pairs.some((p) => p.questionText.trim().length > 0 && p.answerText.trim().length > 0);
  }
}
