import ReactDOM from "react-dom/client";

function BootShell() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "#0f172a",
        color: "#e2e8f0",
        fontFamily: "system-ui, sans-serif",
        padding: 24,
        textAlign: "center",
      }}
    >
      <div>
        <p style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Loading Creator Studio…</p>
        <p style={{ margin: "8px 0 0", fontSize: 13, opacity: 0.7 }}>
          Styles compile in the background — first load can take 1–2 minutes
        </p>
      </div>
    </div>
  );
}

const rootEl = document.getElementById("root");
if (!rootEl) throw new Error("#root not found");

window.__creatorStudioRoot = ReactDOM.createRoot(rootEl);
window.__creatorStudioRoot.render(<BootShell />);

void import("./bootstrap").catch((error) => {
  console.error("[boot] failed", error);
  window.__creatorStudioRoot?.render(
    <div style={{ padding: 24, color: "#fecaca", background: "#450a0a", minHeight: "100vh" }}>
      Boot failed: {error instanceof Error ? error.message : String(error)}
    </div>,
  );
});
