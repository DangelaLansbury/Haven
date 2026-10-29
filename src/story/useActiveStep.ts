import { useEffect, useState } from 'react';

/** Observe native page scrolling; never cancel a gesture, snap, or set scroll position. */
export function useActiveStep(ids: string[]) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const stage = document.querySelector<HTMLElement>('.story-stage');
      const mobile = window.matchMedia('(max-width: 760px)').matches;
      const occupied = mobile ? stage?.getBoundingClientRect().height ?? 0 : 0;
      const readingLine = occupied + (window.innerHeight - occupied) * 0.45;
      let current = 0;
      ids.forEach((id, index) => {
        if ((document.getElementById(id)?.getBoundingClientRect().top ?? Infinity) <= readingLine) current = index;
      });
      setActive(current);
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    window.addEventListener('pageshow', schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      window.removeEventListener('pageshow', schedule);
    };
  }, [ids]);

  return active;
}
