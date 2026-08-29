'use client';

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import styled, { css } from 'styled-components';
import { AnimatePresence, motion } from 'framer-motion';
import { MAX_GRADE, clampGrade } from '@/lib/model';
import { gradeColor } from '@/lib/levels';
import { media } from './ui';
import {
  CalendarIcon,
  CheckIcon,
  ChevronDownIcon,
  MinusIcon,
  PlusIcon,
  SearchIcon,
  XIcon,
} from './Icons';

/* --------------------------------------------------------------------------
 * The shared frame
 *
 * Every control in the app sits in the same shell: a soft filled box that
 * lifts to the surface colour and grows a focus ring when it is being used.
 * Keeping that in one place is what stops the forms from looking like raw
 * browser widgets.
 * ----------------------------------------------------------------------- */

export const controlFrame = css`
  width: 100%;
  min-height: 46px;
  border-radius: 14px;
  border: 1.5px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surfaceAlt};
  color: ${({ theme }) => theme.colors.text};
  font-size: 14px;
  transition: border-color 160ms ease, box-shadow 180ms ease,
    background-color 160ms ease;

  &::placeholder {
    color: ${({ theme }) => theme.colors.textFaint};
  }

  &:hover:not(:disabled):not(:focus) {
    border-color: ${({ theme }) => theme.colors.borderStrong};
  }

  &:focus,
  &:focus-visible {
    outline: none;
    background: ${({ theme }) => theme.colors.surface};
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 4px ${({ theme }) => theme.colors.primarySoft};
  }

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
`;

const FieldRoot = styled.div`
  width: 100%;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 7px;
`;

const FieldLabel = styled.label`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  font-size: 12.5px;
  font-weight: 700;
  letter-spacing: 0.01em;
  color: ${({ theme }) => theme.colors.textSoft};

  .counter {
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    color: ${({ theme }) => theme.colors.textFaint};
  }
`;

const FieldNote = styled.p`
  font-size: 11.5px;
  line-height: 1.5;
  color: ${({ theme, $error }) =>
    $error ? theme.colors.danger : theme.colors.textFaint};
`;

/** The field label on its own, for blocks that are not a single control. */
export const Label = FieldLabel;

/** Label + control + hint, so no form has to lay this out by hand. */
export function Field({ label, hint, error, counter, htmlFor, children }) {
  return (
    <FieldRoot>
      {label && (
        <FieldLabel htmlFor={htmlFor}>
          <span>{label}</span>
          {counter && <span className="counter">{counter}</span>}
        </FieldLabel>
      )}
      {children}
      {(error || hint) && <FieldNote $error={Boolean(error)}>{error || hint}</FieldNote>}
    </FieldRoot>
  );
}

/* --------------------------------------------------------------------------
 * Text
 * ----------------------------------------------------------------------- */

const InputShell = styled.div`
  position: relative;
  display: flex;
  align-items: center;

  > .lead,
  > .tail {
    position: absolute;
    display: grid;
    place-items: center;
    color: ${({ theme }) => theme.colors.textFaint};
    pointer-events: none;
  }

  > .lead {
    left: 14px;
  }
  > .tail {
    right: 14px;
    font-size: 12.5px;
    font-weight: 700;
  }

  &:focus-within > .lead {
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const BareInput = styled.input`
  ${controlFrame}
  height: 46px;
  padding: 0 ${({ $tail }) => ($tail ? '52px' : '14px')} 0
    ${({ $lead }) => ($lead ? '42px' : '14px')};
  ${({ $align }) => $align && css`text-align: ${$align};`}
  ${({ $mono }) => $mono && css`font-variant-numeric: tabular-nums;`}
`;

const ClearButton = styled.button.attrs({ type: 'button' })`
  position: absolute;
  right: 9px;
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  border: 0;
  border-radius: 8px;
  background: ${({ theme }) => theme.colors.border};
  color: ${({ theme }) => theme.colors.textSoft};

  &:hover {
    background: ${({ theme }) => theme.colors.borderStrong};
    color: ${({ theme }) => theme.colors.text};
  }
`;

export function TextField({
  label,
  hint,
  error,
  icon: Icon,
  suffix,
  onClear,
  value,
  id,
  ...rest
}) {
  const autoId = useId();
  const fieldId = id || autoId;
  const showClear = Boolean(onClear) && Boolean(value);

  return (
    <Field label={label} hint={hint} error={error} htmlFor={fieldId}>
      <InputShell>
        {Icon && (
          <span className="lead">
            <Icon size={17} />
          </span>
        )}
        <BareInput
          id={fieldId}
          value={value}
          $lead={Boolean(Icon)}
          $tail={Boolean(suffix) || showClear}
          {...rest}
        />
        {suffix && !showClear && <span className="tail">{suffix}</span>}
        {showClear && (
          <ClearButton onClick={onClear} aria-label="clear">
            <XIcon size={14} />
          </ClearButton>
        )}
      </InputShell>
    </Field>
  );
}

export const TextArea = styled.textarea`
  ${controlFrame}
  min-height: 104px;
  padding: 12px 14px;
  line-height: 1.55;
  resize: vertical;
  font-family: inherit;
`;

export function SearchField({ icon: Icon = SearchIcon, ...rest }) {
  return <TextField icon={Icon} type="search" {...rest} />;
}

/* --------------------------------------------------------------------------
 * Select — a real listbox rather than the operating system dropdown
 * ----------------------------------------------------------------------- */

const SelectTrigger = styled.button.attrs({ type: 'button' })`
  ${controlFrame}
  height: 46px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 12px 0 14px;
  text-align: left;
  cursor: pointer;

  ${({ $open, theme }) =>
    $open &&
    css`
      background: ${theme.colors.surface};
      border-color: ${theme.colors.primary};
      box-shadow: 0 0 0 4px ${theme.colors.primarySoft};
    `}

  .chosen {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 9px;
    overflow: hidden;
  }

  .text {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-weight: 600;
  }

  .placeholder {
    color: ${({ theme }) => theme.colors.textFaint};
    font-weight: 500;
  }

  .caret {
    flex: none;
    display: grid;
    place-items: center;
    color: ${({ theme }) => theme.colors.textFaint};
    transition: transform 220ms ${({ theme }) => theme.ease.out};
    transform: rotate(${({ $open }) => ($open ? '180deg' : '0deg')});
  }
`;

const Popover = styled(motion.div)`
  position: absolute;
  left: 0;
  right: 0;
  z-index: 60;
  padding: 6px;
  border-radius: 16px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surface};
  box-shadow: ${({ theme }) => theme.shadow.lg};
  max-height: 264px;
  overflow-y: auto;
  overscroll-behavior: contain;

  ${({ $up }) =>
    $up
      ? css`
          bottom: calc(100% + 8px);
        `
      : css`
          top: calc(100% + 8px);
        `}
`;

const Option = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 10px;
  border-radius: 11px;
  font-size: 13.5px;
  font-weight: 600;
  cursor: pointer;
  color: ${({ theme }) => theme.colors.text};
  background: ${({ theme, $active }) =>
    $active ? theme.colors.surfaceAlt : 'transparent'};

  .body {
    flex: 1;
    min-width: 0;
  }

  .label {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .hint {
    margin-top: 2px;
    font-size: 11px;
    font-weight: 500;
    color: ${({ theme }) => theme.colors.textFaint};
  }

  .tick {
    flex: none;
    color: ${({ theme }) => theme.colors.primary};
    opacity: ${({ $selected }) => ($selected ? 1 : 0)};
  }
`;

const SelectWrap = styled.div`
  position: relative;
  width: 100%;
`;

export function SelectField({
  label,
  hint,
  error,
  value,
  onChange,
  options,
  placeholder = '—',
  disabled,
  id,
  ...rest
}) {
  const autoId = useId();
  const fieldId = id || autoId;
  const wrapRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [up, setUp] = useState(false);
  const [cursor, setCursor] = useState(0);

  const selectedIndex = options.findIndex((option) => option.value === value);
  const selected = selectedIndex >= 0 ? options[selectedIndex] : null;

  useEffect(() => {
    if (!open) return undefined;
    const onPointer = (event) => {
      if (!wrapRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onPointer);
    return () => document.removeEventListener('mousedown', onPointer);
  }, [open]);

  // Flip the list above the trigger when it would otherwise run off the fold.
  useLayoutEffect(() => {
    if (!open || !wrapRef.current) return;
    const box = wrapRef.current.getBoundingClientRect();
    setUp(window.innerHeight - box.bottom < 280 && box.top > 280);
    setCursor(selectedIndex >= 0 ? selectedIndex : 0);
  }, [open, selectedIndex]);

  const pick = (option) => {
    onChange(option.value);
    setOpen(false);
  };

  const onKeyDown = (event) => {
    if (event.key === 'Escape') {
      setOpen(false);
      return;
    }
    if (!open && (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown')) {
      event.preventDefault();
      setOpen(true);
      return;
    }
    if (!open) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setCursor((index) => Math.min(index + 1, options.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setCursor((index) => Math.max(index - 1, 0));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (options[cursor]) pick(options[cursor]);
    }
  };

  return (
    <Field label={label} hint={hint} error={error} htmlFor={fieldId}>
      <SelectWrap ref={wrapRef} {...rest}>
        <SelectTrigger
          id={fieldId}
          $open={open}
          disabled={disabled}
          onClick={() => setOpen((current) => !current)}
          onKeyDown={onKeyDown}
          aria-haspopup="listbox"
          aria-expanded={open}
        >
          <span className="chosen">
            {selected?.icon}
            <span className={selected ? 'text' : 'text placeholder'}>
              {selected ? selected.label : placeholder}
            </span>
          </span>
          <span className="caret">
            <ChevronDownIcon size={17} />
          </span>
        </SelectTrigger>

        <AnimatePresence>
          {open && (
            <Popover
              $up={up}
              role="listbox"
              initial={{ opacity: 0, y: up ? 6 : -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: up ? 4 : -4, scale: 0.98 }}
              transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
            >
              {options.map((option, index) => (
                <Option
                  key={option.value}
                  role="option"
                  aria-selected={option.value === value}
                  $active={index === cursor}
                  $selected={option.value === value}
                  onMouseEnter={() => setCursor(index)}
                  onClick={() => pick(option)}
                >
                  {option.icon}
                  <span className="body">
                    <span className="label">{option.label}</span>
                    {option.hint && <span className="hint">{option.hint}</span>}
                  </span>
                  <span className="tick">
                    <CheckIcon size={15} />
                  </span>
                </Option>
              ))}
            </Popover>
          )}
        </AnimatePresence>
      </SelectWrap>
    </Field>
  );
}

/* --------------------------------------------------------------------------
 * Segmented control
 * ----------------------------------------------------------------------- */

const SegmentTrack = styled.div`
  position: relative;
  display: inline-grid;
  grid-auto-flow: column;
  grid-auto-columns: 1fr;
  gap: 2px;
  padding: 4px;
  border-radius: 999px;
  background: ${({ theme }) => theme.colors.surfaceAlt};
  border: 1px solid ${({ theme }) => theme.colors.border};
  ${({ $full }) => $full && css`display: grid; width: 100%;`}
`;

const SegmentButton = styled.button.attrs({ type: 'button' })`
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  height: 34px;
  padding: 0 15px;
  border: 0;
  background: none;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 700;
  white-space: nowrap;
  color: ${({ theme, $active }) => ($active ? theme.colors.text : theme.colors.textSoft)};
  transition: color 180ms ease;

  &:hover {
    color: ${({ theme }) => theme.colors.text};
  }

  ${media.xs`padding: 0 10px; font-size: 12px;`}
`;

const SegmentPill = styled(motion.span)`
  position: absolute;
  inset: 0;
  z-index: 0;
  border-radius: 999px;
  background: ${({ theme }) => theme.colors.surface};
  box-shadow: ${({ theme }) => theme.shadow.sm};
  border: 1px solid ${({ theme }) => theme.colors.border};
`;

export function Segmented({ value, onChange, options, full = false, name = 'segment' }) {
  const groupId = useId();
  return (
    <SegmentTrack $full={full} role="tablist">
      {options.map((option) => {
        const active = option.value === value;
        return (
          <SegmentButton
            key={option.value}
            role="tab"
            aria-selected={active}
            $active={active}
            onClick={() => onChange(option.value)}
          >
            {active && (
              <SegmentPill
                layoutId={`${name}-${groupId}`}
                transition={{ type: 'spring', stiffness: 420, damping: 34 }}
              />
            )}
            <span style={{ position: 'relative', zIndex: 1, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              {option.icon}
              {option.label}
            </span>
          </SegmentButton>
        );
      })}
    </SegmentTrack>
  );
}

/* --------------------------------------------------------------------------
 * Switch
 * ----------------------------------------------------------------------- */

const SwitchRow = styled.label`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 13px 14px;
  border-radius: 14px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surfaceAlt};
  cursor: pointer;
  transition: border-color 160ms ease, background-color 160ms ease;

  &:hover {
    border-color: ${({ theme }) => theme.colors.borderStrong};
  }

  .copy {
    min-width: 0;
  }

  .title {
    font-size: 13.5px;
    font-weight: 700;
  }

  .body {
    margin-top: 3px;
    font-size: 11.5px;
    line-height: 1.5;
    color: ${({ theme }) => theme.colors.textFaint};
  }

  input {
    position: absolute;
    opacity: 0;
    pointer-events: none;
  }
`;

const Track = styled.span`
  position: relative;
  flex: none;
  width: 46px;
  height: 27px;
  border-radius: 999px;
  padding: 3px;
  display: flex;
  background: ${({ theme, $on }) => ($on ? theme.colors.primary : theme.colors.border)};
  transition: background-color 220ms ${({ theme }) => theme.ease.out};

  input:focus-visible + & {
    box-shadow: 0 0 0 4px ${({ theme }) => theme.colors.primarySoft};
  }
`;

const Knob = styled(motion.span)`
  width: 21px;
  height: 21px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 2px 5px rgba(10, 14, 30, 0.28);
`;

export function Switch({ checked, onChange, title, body, disabled }) {
  return (
    <SwitchRow>
      <span className="copy">
        <span className="title">{title}</span>
        {body && <span className="body">{body}</span>}
      </span>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
      />
      <Track $on={checked}>
        <Knob
          layout
          transition={{ type: 'spring', stiffness: 620, damping: 34 }}
          style={{ marginLeft: checked ? 19 : 0 }}
        />
      </Track>
    </SwitchRow>
  );
}

/* --------------------------------------------------------------------------
 * Stepper
 * ----------------------------------------------------------------------- */

const StepperShell = styled.div`
  ${controlFrame}
  height: 46px;
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  gap: 4px;
  padding: 4px;
  width: auto;
  min-width: 132px;

  button {
    width: 36px;
    height: 36px;
    flex: none;
    display: grid;
    place-items: center;
    border: 0;
    border-radius: 10px;
    background: ${({ theme }) => theme.colors.surface};
    color: ${({ theme }) => theme.colors.textSoft};
    transition: background-color 150ms ease, color 150ms ease, transform 120ms ease;

    &:hover:not(:disabled) {
      background: ${({ theme }) => theme.colors.primarySoft};
      color: ${({ theme }) => theme.colors.primary};
    }
    &:active:not(:disabled) {
      transform: scale(0.9);
    }
    &:disabled {
      opacity: 0.35;
      cursor: not-allowed;
    }
  }

  .value {
    flex: 1;
    text-align: center;
    font-size: 15px;
    font-weight: 800;
    font-variant-numeric: tabular-nums;
  }
`;

export function Stepper({ value, onChange, min = 0, max = 999, step = 1, suffix }) {
  const set = (next) => onChange(Math.min(Math.max(next, min), max));
  return (
    <StepperShell as="div">
      <button type="button" onClick={() => set(value - step)} disabled={value <= min} aria-label="-">
        <MinusIcon size={16} />
      </button>
      <span className="value">
        {value}
        {suffix}
      </span>
      <button type="button" onClick={() => set(value + step)} disabled={value >= max} aria-label="+">
        <PlusIcon size={16} />
      </button>
    </StepperShell>
  );
}

/* --------------------------------------------------------------------------
 * Grade input — a slider and a keypad that agree with each other
 * ----------------------------------------------------------------------- */

const GradeShell = styled.div`
  display: grid;
  gap: 14px;
`;

const GradeHead = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;

  .readout {
    display: flex;
    align-items: baseline;
    gap: 3px;
    font-variant-numeric: tabular-nums;
    color: ${({ $color }) => $color};

    b {
      font-size: 40px;
      font-weight: 800;
      letter-spacing: -0.04em;
      line-height: 1;
    }

    i {
      font-style: normal;
      font-size: 15px;
      font-weight: 700;
      opacity: 0.55;
    }
  }
`;

const GradeNumber = styled.input`
  ${controlFrame}
  height: 46px;
  width: 96px;
  padding: 0 12px;
  text-align: center;
  font-size: 17px;
  font-weight: 800;
  font-variant-numeric: tabular-nums;

  /* the browser spinners fight the slider, so they go */
  appearance: textfield;
  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    appearance: none;
    margin: 0;
  }
`;

const Slider = styled.input.attrs({ type: 'range' })`
  width: 100%;
  height: 26px;
  appearance: none;
  background: transparent;
  cursor: pointer;

  --fill: ${({ $percent }) => $percent}%;
  --color: ${({ $color }) => $color};

  &::-webkit-slider-runnable-track {
    height: 10px;
    border-radius: 999px;
    background: linear-gradient(
      90deg,
      var(--color) var(--fill),
      ${({ theme }) => theme.colors.border} var(--fill)
    );
  }

  &::-moz-range-track {
    height: 10px;
    border-radius: 999px;
    background: linear-gradient(
      90deg,
      var(--color) var(--fill),
      ${({ theme }) => theme.colors.border} var(--fill)
    );
  }

  &::-webkit-slider-thumb {
    appearance: none;
    width: 24px;
    height: 24px;
    margin-top: -7px;
    border-radius: 50%;
    background: ${({ theme }) => theme.colors.surface};
    border: 4px solid var(--color);
    box-shadow: ${({ theme }) => theme.shadow.sm};
    transition: transform 140ms ${({ theme }) => theme.ease.spring};
  }

  &::-moz-range-thumb {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: ${({ theme }) => theme.colors.surface};
    border: 4px solid var(--color);
    box-shadow: ${({ theme }) => theme.shadow.sm};
  }

  &:active::-webkit-slider-thumb {
    transform: scale(1.15);
  }

  &:focus-visible::-webkit-slider-thumb {
    box-shadow: 0 0 0 5px ${({ theme }) => theme.colors.primarySoft};
  }
`;

const Presets = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
`;

const PresetChip = styled.button.attrs({ type: 'button' })`
  height: 34px;
  min-width: 46px;
  padding: 0 12px;
  border-radius: 11px;
  font-size: 13px;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  border: 1.5px solid
    ${({ theme, $active, $color }) => ($active ? $color : theme.colors.border)};
  background: ${({ theme, $active, $color }) =>
    $active ? `${$color}1F` : theme.colors.surfaceAlt};
  color: ${({ theme, $active, $color }) => ($active ? $color : theme.colors.textSoft)};
  transition: transform 130ms ${({ theme }) => theme.ease.spring},
    border-color 150ms ease, background-color 150ms ease, color 150ms ease;

  &:hover {
    border-color: ${({ $color }) => $color};
    color: ${({ $color }) => $color};
  }
  &:active {
    transform: scale(0.92);
  }
`;

/**
 * The grading control. The slider is for a quick judgement, the box is for a
 * mark the teacher already has in mind, and the chips cover the marks that get
 * given over and over.
 */
export function GradeInput({
  value,
  onChange,
  presets = [],
  passMark = 60,
  excellentMark = 86,
  max = MAX_GRADE,
  label,
  hint,
  autoFocus,
}) {
  const [draft, setDraft] = useState(String(value));
  const tone = useMemo(
    () => gradeColor(value, { passMark, excellentMark }),
    [value, passMark, excellentMark]
  );

  useEffect(() => {
    setDraft(String(value));
  }, [value]);

  const commit = useCallback(
    (raw) => {
      const cleaned = String(raw).replace(/[^0-9]/g, '');
      onChange(clampGrade(cleaned === '' ? 0 : cleaned, max));
    },
    [onChange, max]
  );

  return (
    <Field label={label} hint={hint}>
      <GradeShell>
        <GradeHead $color={tone}>
          <span className="readout">
            <b>{value}</b>
            <i>/ {max}</i>
          </span>
          <div style={{ marginLeft: 'auto' }}>
            <GradeNumber
              inputMode="numeric"
              value={draft}
              autoFocus={autoFocus}
              onChange={(event) => setDraft(event.target.value.replace(/[^0-9]/g, ''))}
              onBlur={() => commit(draft)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') commit(draft);
              }}
              aria-label={label}
            />
          </div>
        </GradeHead>

        <Slider
          min={0}
          max={max}
          step={1}
          value={value}
          $percent={(value / max) * 100}
          $color={tone}
          onChange={(event) => onChange(clampGrade(event.target.value, max))}
        />

        {presets.length > 0 && (
          <Presets>
            {presets.map((preset) => (
              <PresetChip
                key={preset}
                $active={preset === value}
                $color={gradeColor(preset, { passMark, excellentMark })}
                onClick={() => onChange(clampGrade(preset, max))}
              >
                {preset}
              </PresetChip>
            ))}
          </Presets>
        )}
      </GradeShell>
    </Field>
  );
}

/* --------------------------------------------------------------------------
 * Date
 * ----------------------------------------------------------------------- */

const DateShell = styled.label`
  ${controlFrame}
  position: relative;
  height: 46px;
  display: inline-flex;
  align-items: center;
  gap: 9px;
  padding: 0 14px;
  width: auto;
  font-weight: 650;
  cursor: pointer;

  &:focus-within {
    background: ${({ theme }) => theme.colors.surface};
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 4px ${({ theme }) => theme.colors.primarySoft};
  }

  svg {
    color: ${({ theme }) => theme.colors.textFaint};
  }

  input {
    position: absolute;
    inset: 0;
    width: 100%;
    opacity: 0;
    cursor: pointer;
  }
`;

export function DateField({ value, onChange, max, display, label }) {
  return (
    <DateShell>
      <CalendarIcon size={17} />
      {display}
      <input
        type="date"
        value={value}
        max={max}
        onChange={(event) => onChange(event.target.value)}
        aria-label={label}
      />
    </DateShell>
  );
}

/* --------------------------------------------------------------------------
 * Editable list of numbers, used for the quick-mark buttons
 * ----------------------------------------------------------------------- */

const ChipList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
`;

const RemovableChip = styled(motion.span)`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 36px;
  padding: 0 8px 0 13px;
  border-radius: 11px;
  font-size: 13.5px;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  border: 1.5px solid ${({ $color }) => `${$color}44`};
  background: ${({ $color }) => `${$color}14`};
  color: ${({ $color }) => $color};

  button {
    display: grid;
    place-items: center;
    width: 20px;
    height: 20px;
    border: 0;
    border-radius: 6px;
    background: transparent;
    color: inherit;
    opacity: 0.65;

    &:hover {
      opacity: 1;
      background: ${({ $color }) => `${$color}22`};
    }
  }
`;

const AddChip = styled.input`
  width: 74px;
  height: 36px;
  padding: 0 10px;
  text-align: center;
  border-radius: 11px;
  border: 1.5px dashed ${({ theme }) => theme.colors.borderStrong};
  background: transparent;
  font-size: 13.5px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;

  &::placeholder {
    font-weight: 600;
    color: ${({ theme }) => theme.colors.textFaint};
  }

  &:focus {
    outline: none;
    border-style: solid;
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 4px ${({ theme }) => theme.colors.primarySoft};
  }
`;

export function GradeChips({
  values,
  onChange,
  label,
  hint,
  max = MAX_GRADE,
  limit = 6,
  passMark = 60,
  excellentMark = 86,
  addLabel = '+',
}) {
  const [draft, setDraft] = useState('');

  const add = () => {
    const next = clampGrade(draft, max);
    setDraft('');
    if (!draft || next <= 0 || values.includes(next) || values.length >= limit) return;
    onChange([...values, next].sort((a, b) => b - a));
  };

  return (
    <Field label={label} hint={hint} counter={`${values.length}/${limit}`}>
      <ChipList>
        <AnimatePresence initial={false}>
          {values.map((item) => (
            <RemovableChip
              key={item}
              layout
              $color={gradeColor(item, { passMark, excellentMark })}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.16 }}
            >
              {item}
              <button
                type="button"
                onClick={() => onChange(values.filter((value) => value !== item))}
                aria-label={`remove ${item}`}
              >
                <XIcon size={13} />
              </button>
            </RemovableChip>
          ))}
        </AnimatePresence>
        {values.length < limit && (
          <AddChip
            inputMode="numeric"
            value={draft}
            placeholder={addLabel}
            onChange={(event) => setDraft(event.target.value.replace(/[^0-9]/g, ''))}
            onBlur={add}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                add();
              }
            }}
          />
        )}
      </ChipList>
    </Field>
  );
}
