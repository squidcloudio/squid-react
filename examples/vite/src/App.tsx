import { DocumentReference, QueryBuilder } from '@squidcloud/client';
import { useCollection, useDocs, useQuery } from '@squidcloud/react';
import { useState } from 'react';
import Chat from './components/Chat';
import Pages from './components/Pages';
import Queue from './components/Queue';
import Slider from './components/Slider';
import { randomAge, randomName } from './data/names';

export type Person = {
  name: string;
  age: number;
};

export type Event = {
  name: string;
  value: number;
};

function App(): JSX.Element {
  const [hide, setHide] = useState(false);
  const [enabled, setEnabled] = useState(false);

  const people = useCollection<Person>('people');
  const events = useCollection<Event>('events');
  const { loading, data } = useQuery(
    events.query().eq('name', 'slider').dereference(),
    { subscribe: true, enabled },
  );

  function toggle(): void {
    setHide(!hide);
  }

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <span>Loading...</span>
        <button
          style={{ marginTop: '32px' }}
          onClick={() => setEnabled(!enabled)}
        >
          {enabled ? 'Disabled' : 'Enable'}
        </button>
      </div>
    );
  }

  const age = data[0]?.value || 30;

  return (
    <div>
      {!hide && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Slider name="slider" min={1} max={99} defaultValue={30} />
          <div style={{ display: 'flex' }}>
            <Docs />
            <Query query={people.query()} description="All" enabled={enabled} />
            <Query
              query={people.query().where('age', '>', age)}
              description={`> ${age}`}
              enabled={enabled}
            />
            <Query
              query={people.query().where('age', '<=', age)}
              description={`<= ${age}`}
              enabled={enabled}
            />
          </div>
          <Pages enabled={enabled} />
          <Chat />
          <Queue />
        </div>
      )}
      <button style={{ marginTop: '32px' }} onClick={toggle}>
        {hide ? 'Mount' : 'Unmount'}
      </button>
      <button
        style={{ marginTop: '32px' }}
        onClick={() => setEnabled(!enabled)}
      >
        {enabled ? 'Disabled' : 'Enable'}
      </button>
    </div>
  );
}

export default App;

type QueryProps = {
  query: QueryBuilder<Person>;
  description: string;
  enabled: boolean;
};

const Docs = <T,>(): JSX.Element => {
  const [docs, setDocs] = useState<Array<DocumentReference<Person>>>([]);
  const collection = useCollection<Person>('people');
  const { loading } = useDocs(docs, { subscribe: true });

  function add(): void {
    const doc = collection.doc();
    doc.insert({ name: randomName(), age: randomAge() }).then();
    setDocs(docs.concat(doc));
  }

  function remove(doc: DocumentReference<Person>): void {
    doc.delete().then();
    const index = docs.indexOf(doc);
    const newDocs = [...docs];
    newDocs.splice(index, 1);
    setDocs(newDocs);
  }

  return (
    <div style={{ width: '200px', margin: '16px' }}>
      <h3>Docs</h3>
      <button onClick={add}>Add</button>
      {loading ? (
        <span>Loading...</span>
      ) : (
        <ul>
          {docs.map((d) => {
            return (
              <li key={d.refId}>
                {d.hasData ? (
                  <>
                    <span>
                      {d.data.name} {d.data.age}
                    </span>
                    <button onClick={(): void => remove(d)}>X</button>
                  </>
                ) : (
                  'Missing Data'
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

const Query = ({ query, description, enabled }: QueryProps): JSX.Element => {
  const { loading, data } = useQuery(query, { subscribe: true, enabled });

  function update(): void {
    for (const doc of data) {
      doc.update({ age: randomAge() }).then();
    }
  }

  function remove(): void {
    for (const doc of data) {
      doc.delete().then();
    }
  }

  return (
    <div style={{ width: '200px', margin: '16px' }}>
      <h3>{description}</h3>
      <button onClick={update}>Update</button>
      <button onClick={remove}>Delete</button>
      {loading ? (
        <span>Loading...</span>
      ) : (
        <ul>
          {data.map((d) => {
            return (
              <li key={d.refId}>
                {d.data.name} {d.data.age}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
