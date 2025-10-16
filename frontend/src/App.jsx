import { useState, useEffect } from "react";

const FIATS = ["CLP", "PEN", "COP"];

export default function App() {
  const [from, setFrom] = useState("CLP");
  const [to, setTo] = useState("PEN");
  const [amount, setAmount] = useState(10000);
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);
  const [markets, setMarkets] = useState([]);
  const [arbResult, setArbResult] = useState(null);


  useEffect(() => {
    async function fetchMarkets() {
      try {
        const res = await fetch("/api/markets");
        const data = await res.json();
        console.log("Markets fetched:", data);
        setMarkets(data);
      } catch (err) {
        console.error("Error fetching markets:", err);
      }
    }
    fetchMarkets();
  }, []);

  async function testAPI() {
    setResponse(null);
    setError(null);
    setArbResult(null);

    const payload = { from, to, amount: Number(amount) };
    console.log("Enviando request a /api/convert:", payload);

    try {
      const res = await fetch("/api/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      console.log("Status HTTP:", res.status);
      const data = await res.json();
      console.log("Respuesta JSON recibida:", data);

      if (!res.ok) {
        setError(data.error || "Error desconocido");
      } else {
        setResponse(data);
      }
    } catch (err) {
      console.error("Error al hacer fetch:", err);
      setError(err.message);
    }
  }

  async function testArbitrage() {
    setArbResult(null);
    setError(null);

    const payload = { from, amount: Number(amount) };
    console.log("Enviando request a /api/arbitrage-test:", payload);

    try {
      const res = await fetch("/api/arbitrage-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      console.log("Respuesta arbitraje:", data);

      if (!res.ok) {
        setError(data.error || "Error desconocido");
      } else {
        setArbResult(data);
      }
    } catch (err) {
      console.error("Error al hacer fetch arbitraje:", err);
      setError(err.message);
    }
  }

  return (
    <div style={{ padding: 20, fontFamily: "Segoe UI, sans-serif", background: "#f5f7fa", minHeight: "100vh" }}>
      <h1 style={{ color: "#2c3e50" }}>💱 Conversor de Monedas - Test Buda</h1>

      {/* Inputs */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "15px" }}>
        <label>
          From:{" "}
          <select value={from} onChange={e => setFrom(e.target.value)}>
            {FIATS.map(f => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </label>

        <label>
          To:{" "}
          <select value={to} onChange={e => setTo(e.target.value)}>
            {FIATS.map(f => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </label>

        <label>
          Amount:{" "}
          <input
            type="number"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            style={{ width: "100px" }}
          />
        </label>

        <button
          onClick={testAPI}
          style={{ padding: "6px 12px", background: "#3498db", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" }}
        >
          Convertir
        </button>

        <button
          onClick={testArbitrage}
          style={{ padding: "6px 12px", background: "#27ae60", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" }}
        >
          Probar Arbitraje
        </button>
      </div>

      {/* Errores */}
      {error && (
        <div style={{ color: "red", marginTop: 10, fontWeight: "bold" }}>
          ⚠️ {error}
        </div>
      )}

      {/* Resultado conversión */}
      {response && (
        <div style={{ marginTop: 20 }}>
          <h3 style={{ color: "#34495e" }}>🔎 Mejores conversiones encontradas</h3>
          <table style={{ borderCollapse: "collapse", width: "100%", background: "white", borderRadius: "8px", overflow: "hidden", boxShadow: "0 2px 6px rgba(0,0,0,0.1)" }}>
            <thead style={{ background: "#2980b9", color: "white" }}>
              <tr>
                <th style={{ padding: "8px" }}>Intermediario</th>
                <th>Amount Out ({to})</th>
                <th>Precio 1 ({from})</th>
                <th>Precio 2 ({to})</th>
              </tr>
            </thead>
            <tbody>
              {response.top_conversions.map((c, i) => (
                <tr key={i} style={{ textAlign: "center", background: i % 2 === 0 ? "#ecf0f1" : "white" }}>
                  <td>{c.intermediary ? c.intermediary.toUpperCase() : "DIRECT"}</td>
                  <td>{c.amount_out.toFixed(2)}</td>
                  <td>{c.price1}</td>
                  <td>{c.price2}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Resultado arbitraje */}
      {arbResult && (
  <div style={{ marginTop: 20 }}>
    <h3 style={{ color: "#16a085" }}>♻️ Resultado Arbitraje</h3>
    {arbResult.exists ? (
      <div>
        <p>Se encontraron ciclos de arbitraje:</p>
        <ul>
          {arbResult.cycles.map((c, i) => (
            <li key={i} style={{ marginBottom: "10px" }}>
              <strong>Ciclo:</strong> {c.cycle.join(" → ")} <br />
              <strong>Monto final:</strong> {c.finalAmount.toFixed(2)} <br />
              <strong>Ganancia total:</strong> {c.profit.toFixed(2)} <br />
              <strong>Ganancia porcentual:</strong> {c.profitPercentage.toFixed(2)}%
            </li>
          ))}
        </ul>
      </div>
    ) : (
      <p>No se encontraron ciclos de arbitraje.</p>
    )}
  </div>
)}

      {/* Tabla mercados */}
      <div style={{ marginTop: 30 }}>
        <h3 style={{ color: "#8e44ad" }}>📊 Mercados disponibles</h3>
        {markets.length === 0 ? (
          <div>Cargando mercados...</div>
        ) : (
          <table style={{ borderCollapse: "collapse", width: "100%", background: "white", borderRadius: "8px", overflow: "hidden", boxShadow: "0 2px 6px rgba(0,0,0,0.1)" }}>
            <thead style={{ background: "#8e44ad", color: "white" }}>
              <tr>
                <th style={{ padding: "8px" }}>Market ID</th>
                <th>Último Precio</th>
              </tr>
            </thead>
            <tbody>
              {markets
                .slice()
                .sort((a, b) => a.id.localeCompare(b.id))
                .map((m, i) => (
                  <tr key={m.id} style={{ textAlign: "center", background: i % 2 === 0 ? "#f9f9f9" : "white" }}>
                    <td>{m.id}</td>
                    <td>{m.last_price || "N/A"}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
