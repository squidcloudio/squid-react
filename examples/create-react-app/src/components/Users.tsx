import { useCollection, useQuery } from '@squidcloud/react';
import { randomAge, randomName } from '../data/names';

export type Person = {
  name: string;
  age: number;
};

export type PropTypes = {
  title: string;
};

const Users = ({ title }: PropTypes) => {
  const collection = useCollection<Person>('people');

  const { data } = useQuery(collection.query(), true);

  const insertFromClient = () => {
    collection.doc().insert({
      name: randomName(),
      age: randomAge(),
    });
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        minWidth: '100vw',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <h1>{title}</h1>
      <ul style={{ marginBottom: '16px' }}>
        {data.map((d, i) => (
          <li key={`${d.name}+${d.age}+${i}`} style={{ textAlign: 'center' }}>
            {d.name} {d.age}
          </li>
        ))}
      </ul>
      <button onClick={insertFromClient}>Insert from Client</button>
    </div>
  );
};

export default Users;
