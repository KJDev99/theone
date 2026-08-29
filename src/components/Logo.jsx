/**
 * The mark: the numeral one inside a ring.
 *
 * It is drawn in `currentColor` with no background of its own, so whatever
 * places it — the gradient tile in the sidebar, a flat header, a printed
 * sheet — decides the colour. The ring is faint rather than absent because at
 * sidebar size a bare "1" reads as a stray stroke; at favicon size the ring
 * disappears into a soft disc and the stem still reads.
 */
export default function Logo({ size = 22, ...rest }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      <circle cx="12" cy="12" r="9.3" strokeWidth="1.7" opacity="0.38" />
      <path
        d="M9.3 8.5 12 6.3v11.2"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M9.4 17.5h5.3" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}
