import { useAiChatbot } from '@squidcloud/react';
import { useState } from 'react';

const Chat = () => {
  const [value, setValue] = useState('');
  const { history, chat, complete } = useAiChatbot('rudder', 'grandma');

  const handleClick = () => {
    chat(value);
  };

  return (
    <>
      <h2>Chat</h2>
      <input onChange={(e) => setValue(e.target.value)} value={value} />
      <button onClick={handleClick} disabled={!complete}>
        Chat
      </button>
      {history.map(({ id, message, type }) => (
        <span key={id}>
          {type}: {message}
        </span>
      ))}
    </>
  );
};

export default Chat;
