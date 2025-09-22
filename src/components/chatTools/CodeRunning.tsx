import { useEffect, useState } from 'react';
import { ThinkingIndicator } from '../ui/ThinkingIndicator';
import { CodeRender } from '../code-render';

// Subcomponent for code running progress
export const CodeRunning = () => {
  const [progress, setProgress] = useState(0);
  const statuses = [
    'Starting the remote coding instance',
    'Passing the python code',
    'Downloading S3 file',
    'Setting up environment',
    'Installing dependencies',
    'Executing code',
    'Collecting outputs',
    'Finalizing results',
  ];
  // Divide progress into equal segments for each status
  const statusIndex = Math.min(
    statuses.length - 1,
    Math.floor((progress / 80) * statuses.length)
  );
  const currentStatus = statuses[statusIndex];

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (progress < 80) {
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev < 80) {
            // Increase by 1-3% randomly for realism
            const next = prev + Math.floor(Math.random() * 3) + 1;
            return next > 80 ? 80 : next;
          }
          return prev;
        });
      }, 120);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [progress]);

  return (
    <>
      <ThinkingIndicator thought={`Executing code`} />
      <div className='mt-4 rounded-lg overflow-hidden border border-slate-700 bg-[#1e1e1e] animate-pulse w-full'>
        <CodeRender
          code={`# ${currentStatus}\n[${'='.repeat(
            Math.floor(progress / 4)
          )}${' '.repeat(25 - Math.floor(progress / 4))}] ${progress}%`}
          language='bash'
          theme='dark'
        />
      </div>
    </>
  );
};
