export interface StopRowProps {
  /** e.g. "20:00" */
  time: string;
  /** venue name or venue type, e.g. "The Midnight Kitchen" */
  what: string;
  /** e.g. ["$$", "veg"] */
  tags?: string[];
}

export function StopRow({ time, what, tags }: StopRowProps) {
  return (
    <div className="ft-stop">
      <time className="ft-stop__time">{time}</time>
      <span className="ft-stop__what">{what}</span>
      {tags && tags.length > 0 && <span className="ft-stop__tags">{tags.join(" · ")}</span>}
    </div>
  );
}
