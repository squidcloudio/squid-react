import { DocumentReference, QueryBuilder } from '@squidcloud/client';
import { useCollection, useDocs, useQuery } from '@squidcloud/react';
import { useState } from 'react';
import Pages from './components/Pages';
import Slider from './components/Slider';
import { Names } from './data/names';

export type Person = {
  name: string;
  age: number;
};

export type Event = {
  name: string;
  value: number;
};

function randomAge(): number {
  return Math.ceil(Math.random() * 99);
}

function randomName(): string {
  return Names[Math.floor(Math.random() * Names.length)];
}

function App(): JSX.Element {
  const [hide, setHide] = useState(false);

  const people = useCollection<Person>('people');
  const events = useCollection<Event>('events');
  const { loading, data } = useQuery(events.query().eq('name', 'slider'), true);

  function toggle(): void {
    setHide(!hide);
  }

  if (loading) {
    return <span>Loading...</span>;
  }

  const age = data[0].value;

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
            <Query query={people.query()} description="All" />
            <Query
              query={people.query().where('age', '>', age)}
              description={`> ${age}`}
            />
            <Query
              query={people.query().where('age', '<=', age)}
              description={`<= ${age}`}
            />
          </div>
          <Pages />
        </div>
      )}
      <button style={{ marginTop: '32px' }} onClick={toggle}>
        {hide ? 'Mount' : 'Unmount'}
      </button>
    </div>
  );
}

export default App;

type QueryProps = {
  query: QueryBuilder<Person>;
  description: string;
};

const Docs = <T,>(): JSX.Element => {
  const [docs, setDocs] = useState<Array<DocumentReference<Person>>>([]);
  const collection = useCollection<Person>('people');
  const { loading } = useDocs(docs, true);

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

const Query = ({ query, description }: QueryProps): JSX.Element => {
  const { loading, docs } = useQuery(query, true);

  function update(): void {
    for (const doc of docs) {
      doc.update({ age: randomAge() }).then();
    }
  }

  function remove(): void {
    for (const doc of docs) {
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
          {docs.map((d) => {
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
