import { usePagination, useCollection } from '@squidcloud/react';
import { Person } from './App';

const Pages = () => {
  const collection = useCollection<Person>('people');
  const { loading, docs, hasNext, hasPrev, next, prev } = usePagination(
    collection.query().sortBy('age'),
    true,
    5,
  );

  if (loading) {
    return <span>Loading...</span>;
  }

  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
    >
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        {hasPrev && <button onClick={prev}>Prev</button>}
        {hasNext && <button onClick={next}>Next</button>}
      </div>
      <ul style={{ width: 200 }}>
        {docs.map((d) => (
          <li key={d.refId}>
            {d.data.name} {d.data.age}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Pages;
