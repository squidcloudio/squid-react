import { useQueue, useSquid } from '@squidcloud/react';
import { useState } from 'react';

const Queue = () => {
  const [enabled, setEnabled] = useState(true);
  const [value, setValue] = useState('');
  const squid = useSquid();

  const { produce, data, error } = useQueue<string>(squid.queue('testing'), {
    enabled,
  });

  const handlProduce = () => {
    void produce([value]);
  };

  const toggleEnabled = () => {
    setEnabled(!enabled);
  };

  return (
    <>
      <h2>Queue</h2>
      <span>Data: {data}</span>
      <span>Error: {error?.message}</span>

      <input onChange={(e) => setValue(e.target.value)} value={value} />
      <button onClick={handlProduce}>Produce</button>
      <button onClick={toggleEnabled}>{enabled ? 'Disable' : 'Enable'}</button>
    </>
  );
};

export default Queue;
