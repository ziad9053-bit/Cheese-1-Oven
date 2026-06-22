export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        overflow: 'auto',        // override the body overflow-hidden
        touchAction: 'auto',     // override touch-none
        userSelect: 'text',      // override select-none
      }}
    >
      {children}
    </div>
  );
}
