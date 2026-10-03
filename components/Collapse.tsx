/** Height-animated disclosure panel: always rendered, so it can transition open and closed. Inert while closed. */
export function Collapse({ open, id, children }: { open: boolean; id?: string; children: React.ReactNode }) {
  return (
    <div className="collapse" id={id} data-open={open || undefined} inert={!open}>
      <div className="collapse-inner">{children}</div>
    </div>
  );
}

/** + that turns into − when open. */
export function PlusMinus() {
  return <span className="pm" aria-hidden="true" />;
}
