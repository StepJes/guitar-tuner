import React, {useState} from 'react';
import {TextInput} from 'react-native';
import ReactTestRenderer, {ReactTestRenderer as Renderer} from 'react-test-renderer';
import {NumericStepper} from '../src/components/NumericStepper';

function Harness({onChange}: {onChange: jest.Mock}) {
  const [value, setValue] = useState(440);
  return (
    <NumericStepper
      value={value}
      onChange={next => {
        setValue(next);
        onChange(next);
      }}
      min={220}
      max={880}
      smallStep={0.1}
      bigStep={1}
      decimals={1}
      label="A4 reference"
    />
  );
}

function renderStepper(onChange: jest.Mock): Renderer {
  let renderer: Renderer | undefined;
  ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(<Harness onChange={onChange} />);
  });
  return renderer as Renderer;
}

test('commits typed values while the field is focused', () => {
  const onChange = jest.fn();
  const renderer = renderStepper(onChange);
  const input = renderer.root.findByProps({accessibilityLabel: 'A4 reference value'});

  ReactTestRenderer.act(() => {
    input.props.onFocus();
    input.props.onChangeText('500');
  });
  expect(onChange).toHaveBeenLastCalledWith(500);

  ReactTestRenderer.act(() => {
    input.props.onChangeText('1000');
  });
  expect(onChange).toHaveBeenLastCalledWith(880);

  ReactTestRenderer.act(() => {
    input.props.onBlur();
  });
  expect(renderer.root.findByType(TextInput).props.value).toBe('880.0');
});
