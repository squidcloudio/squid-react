import { useAiQuery } from '@squidcloud/react';
import { useEffect } from 'react';
import { generateId } from '@squidcloud/client';


const jobId = generateId();
console.log('jobId', jobId);
export default function Main() {
  const { chat, statusUpdates, history, data } = useAiQuery('ttt');

  useEffect(() => {
    console.log('Status updates, History:', JSON.stringify(history, null, 2), 'Status:', JSON.stringify(statusUpdates, null, 2));
  }, [statusUpdates, history]);
  useEffect(() => {
    chat('How many devices are there?', undefined, jobId);
  }, []);
  useEffect(() => {
    console.log('data:', data);
  }, [data]);

  return (
    <div className={'container'}>
      <h1 className="text-3xl font-bold underline">Hello world!</h1>
    </div>
  );
}
