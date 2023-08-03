'use client';

import insertFromServerAction from '@/actions/insertFromServerAction';
import { randomAge, randomName } from '@/data/names';
import { WithQueryProps, useCollection } from '@squidcloud/react';

export type Person = {
  name: string;
  age: number;
};

export type PropTypes = {
  title: string;
};

const Users = ({ title, data }: PropTypes & WithQueryProps<Person>) => {
  const collection = useCollection<Person>('people');

  const insertFromClient = () => {
    collection.doc().insert({
      name: randomName(),
      age: randomAge(),
    });
  };

  const insertFromApi = () => {
    fetch('api/insertFromApi', {
      method: 'POST',
    }).then();
  };

  return (
    <div className="flex flex-col min-h-screen min-w-screen justify-center items-center">
      <h1>{title}</h1>
      <ul className="mb-4">
        {data.map((d, i) => (
          <li key={`${d.name}+${d.age}+${i}`} className="text-center">
            {d.name} {d.age}
          </li>
        ))}
      </ul>
      <button onClick={insertFromClient}>Insert from Client</button>
      <button onClick={insertFromApi}>Insert from API</button>
      <form action={insertFromServerAction}>
        <button type="submit">Insert from Server Action</button>
      </form>
    </div>
  );
};

export default Users;
