import { useCollection, usePagination, useQuery } from '@squidcloud/react';
import { Event, Person } from '../App';
import Slider from './Slider';

const Pages = () => {
  const people = useCollection<Person>('people');
  const events = useCollection<Event>('events');

  const { loading: loadPageCount, data } = useQuery(
    events.query().eq('name', 'pageSize').dereference(),
    true,
  );

  const {
    data: docs,
    hasNext,
    hasPrev,
    next,
    prev,
  } = usePagination(people.query().sortBy('age'), {
    subscribe: true,
    pageSize: data[0]?.value || 5,
  });

  if (loadPageCount || !docs.length) {
    return <span>Loading...</span>;
  }

  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
    >
      <Slider name="pageSize" min={1} max={10} defaultValue={5} />
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <button disabled={!hasPrev} onClick={prev}>
          Prev
        </button>
        <button disabled={!hasNext} onClick={next}>
          Next
        </button>
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
