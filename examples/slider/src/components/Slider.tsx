import { ChangeEvent, useCallback, useEffect } from 'react';
import { useDoc, useCollection } from '@squidcloud/react';
import { debounce } from 'debounce';
import { Event } from '../App';

type PropTypes = {
  name: string;
  min: number;
  max: number;
  defaultValue: number;
};

const Slider = ({ name, min, max, defaultValue }: PropTypes) => {
  const events = useCollection<Event>('events');

  const doc = events.doc(name);
  const { data } = useDoc(doc, true);

  useEffect(() => {
    const createSlider = async (): Promise<void> => {
      const data = await doc.snapshot();
      if (!data) {
        await doc.insert({ name, value: defaultValue });
      }
    };
    createSlider().then();
  }, []);

  const debounceSetAge = useCallback(
    debounce((value: string) => {
      doc.update({ name, value: Number(value) }).then();
    }, 200),
    [],
  );

  function onSliderChange(e: ChangeEvent<HTMLInputElement>): void {
    debounceSetAge(e.target.value);
  }

  const value = data?.value || defaultValue;
  return (
    <div style={{ display: 'flex' }}>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={onSliderChange}
      />
      <span>{value}</span>
    </div>
  );
};

export default Slider;
