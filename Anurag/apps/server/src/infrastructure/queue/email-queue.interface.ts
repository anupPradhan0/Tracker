export interface EmailJob {
  userId: string;
  type: "AI_SUMMARY";
  period: "WEEKLY" | "MONTHLY";
}

export interface EmailQueue {
  enqueue(job: EmailJob): Promise<void>;
}

export class InProcessEmailQueue implements EmailQueue {
  private handler?: (job: EmailJob) => Promise<void>;

  setHandler(handler: (job: EmailJob) => Promise<void>) {
    this.handler = handler;
  }

  async enqueue(job: EmailJob): Promise<void> {
    if (this.handler) {
      setImmediate(() => this.handler!(job).catch(console.error));
    }
  }
}

export const emailQueue = new InProcessEmailQueue();
