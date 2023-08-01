'use client';

import insertUser from '@/actions/insertUser';
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
      <form action={() => insertUser()}>
        <button type="submit">Insert from Server Action</button>
      </form>
    </div>
  );
};

export default Users;
