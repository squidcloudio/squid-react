import { DocumentReference, QueryBuilder } from '@squidcloud/client';
import { useCollection, useDoc, useDocs, useQuery } from '@squidcloud/react';
import { debounce } from 'debounce';
import { ChangeEvent, useCallback, useEffect, useState } from 'react';
import { Names } from './data/names';

type Person = {
  name: string;
  age: number;
};

type Event = {
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

  const collection = useCollection<Person>('people');
  const events = useCollection<Event>('events');

  const slider = events.doc('slider');
  useDoc(slider, true);
  const age = slider.data().value || 30;

  useEffect(() => {
    const createSlider = async (): Promise<void> => {
      const data = await slider.snapshot();
      if (!data) {
        await slider.insert({ name: 'slider', value: 30 });
      }
    };
    createSlider().then();
  }, []);

  const debounceSetAge = useCallback(
    debounce((value: string) => {
      slider.update({ value: Number(value) }).then();
    }, 200),
    [],
  );

  function onSliderChange(e: ChangeEvent<HTMLInputElement>): void {
    debounceSetAge(e.target.value);
  }

  function toggle(): void {
    setHide(!hide);
  }

  return (
    <div>
      {!hide && (
        <div>
          <input
            type="range"
            min="1"
            max="99"
            value={age}
            onChange={onSliderChange}
          />
          <div style={{ display: 'flex' }}>
            <Docs />
            <Query query={collection.query()} description="All" />
            <Query
              query={collection.query().where('age', '>', age)}
              description={`> ${age}`}
            />
            <Query
              query={collection.query().where('age', '<=', age)}
              description={`<= ${age}`}
            />
          </div>
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
  useDocs(docs, true);

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
      <ul>
        {docs.map((d) => {
          const data = d.data();
          const hasData = !!Object.keys(data).length;
          return (
            <li key={d.squidDocId}>
              {hasData ? (
                <>
                  <span>
                    {data.name} {data.age}
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
    </div>
  );
};

const Query = ({ query, description }: QueryProps): JSX.Element => {
  const docs = useQuery(query, true);

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
      <ul>
        {docs.map((d) => {
          const data = d.data();
          return (
            <li key={d.squidDocId}>
              {data.name} {data.age}
            </li>
          );
        })}
      </ul>
    </div>
  );
};
