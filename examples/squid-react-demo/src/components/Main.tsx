import { useAiAgent } from '@squidcloud/react';
import { useEffect } from 'react';

export default function Main() {
  const { chat, statusUpdates } = useAiAgent('saaa');
  useEffect(() => {
    console.log('Status updates', statusUpdates);
  }, [statusUpdates]);
  useEffect(() => {
    chat('What is the weather like today?');
  }, []);

  return (
    <div className={'container'}>
      <h1 className="text-3xl font-bold underline">Hello world!</h1>
    </div>
  );
}
