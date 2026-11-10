import * as Select from '@radix-ui/react-select';

export function AnimationSelect({ value, onChange, dark }: {
  value: string; onChange: (value: string) => void; dark: boolean;
}) {
  const label = 'Indicator animation';
  return <Select.Root value={value} onValueChange={onChange}>
    <Select.Trigger className="control-trigger animation-trigger" aria-label={label} data-dark={dark}>
      <Select.Value /><Select.Icon aria-hidden="true"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="m6 9 6 6 6-6" /></svg></Select.Icon>
    </Select.Trigger>
    <Select.Portal><Select.Content className="control-menu animation-menu" data-dark={dark} position="popper" align="start" sideOffset={8} collisionPadding={12}><Select.Viewport>
      {([['slide', 'Slide'], ['none', 'No animation']] as const).map(([option, text]) =>
        <Select.Item className="control-option animation-option" key={option} value={option} textValue={text}>
          <Select.ItemText>{text}</Select.ItemText><span className="control-check"><Select.ItemIndicator aria-hidden="true"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="m5 12 4 4L19 6" /></svg></Select.ItemIndicator></span>
        </Select.Item>)}
    </Select.Viewport></Select.Content></Select.Portal>
  </Select.Root>;
}
