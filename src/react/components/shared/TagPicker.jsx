// Multi-select: chosen values appear as removable tags above the buttons,
// and a chosen value's button is hidden.
export default function TagPicker({
  options,
  selected,
  onChange,
  buttonClass,
  rowClass = "region-button-row",
  groupStyle,
  rowStyle,
}) {
  const toggle = (value) =>
    onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]);
  return (
    <>
      <div className="region-group" style={groupStyle}>
        {selected.map((value) => (
          <span key={value} className="selected-tag">
            {value}{" "}
            <span className="tag-close" title="Remove" onClick={() => toggle(value)}>
              ×
            </span>
          </span>
        ))}
      </div>
      <div className={rowClass} style={rowStyle}>
        {options
          .filter((value) => !selected.includes(value))
          .map((value) => (
            <button key={value} type="button" className={buttonClass} onClick={() => toggle(value)}>
              {value}
            </button>
          ))}
      </div>
    </>
  );
}
