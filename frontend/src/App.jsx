import { useEffect, useState, useCallback } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
  Circle,
  useMap,
} from "react-leaflet";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import axios from "axios";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import iconShadow from "leaflet/dist/images/marker-shadow.png";
import { useRef } from "react";

const BlueIcon = L.icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const RedIcon = L.icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function ChangeView({ center, zoom }) {
  const map = useMap();
  map.flyTo(center, zoom);
  return null;
}

function MapEvents({ onMapClick }) {
  const map = useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng, map);
    },
  });
  return null;
}

function App() {
  const [carros, setCarros] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [selecionandoLocal, setSelecionandoLocal] = useState(false);
  const [filtroCentro, setFiltroCentro] = useState(null);
  const [raioFiltro, setRaioFiltro] = useState(100);
  const [statusFiltro, setStatusFiltro] = useState("");
  const [showDash, setShowDash] = useState(false);
  const [mapConfig, setMapConfig] = useState({
    center: [-27.2423, -50.2188],
    zoom: 7,
  });
  const [form, setForm] = useState({
    placa: "",
    modelo: "",
    latitude: -27.59,
    longitude: -48.54,
  });
  const markerRefs = useRef({});
  const mapRef = useRef(null);

  const fetchCarros = useCallback(
    async (lat = "", lon = "", raio = raioFiltro, status = statusFiltro) => {
      try {
        let url = `http://localhost:8000/api/carros/?raio=${raio}&status=${status}`;
        if (lat && lon) url += `&lat=${lat}&lon=${lon}`;
        const response = await axios.get(url);
        setCarros(response.data);
      } catch (error) {
        console.error(error);
      }
    },
    [raioFiltro, statusFiltro],
  );

  const handleMapInteraction = (lat, lon) => {
    if (selecionandoLocal) {
      setForm((prev) => ({
        ...prev,
        latitude: lat.toFixed(6),
        longitude: lon.toFixed(6),
      }));
      setSelecionandoLocal(false);
    } else {
      setFiltroCentro([lat, lon]);
      fetchCarros(lat, lon);
      setMapConfig({ center: [lat, lon], zoom: 8 });
    }
  };

  const limparFiltro = () => {
    setFiltroCentro(null);
    setStatusFiltro("");
    setRaioFiltro(100);
    fetchCarros("", "", 100, "");
    setMapConfig({ center: [-27.2423, -50.2188], zoom: 7 });
  };

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      if (isMounted) {
        filtroCentro
          ? await fetchCarros(filtroCentro[0], filtroCentro[1])
          : await fetchCarros();
      }
    };
    loadData();
    const interval = setInterval(loadData, 15000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [fetchCarros, filtroCentro]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      editandoId
        ? await axios.patch(
            `http://localhost:8000/api/carros/${editandoId}/`,
            form,
          )
        : await axios.post("http://localhost:8000/api/carros/", form);
      setForm({ placa: "", modelo: "", latitude: -27.59, longitude: -48.54 });
      setEditandoId(null);
      fetchCarros();
    } catch (error) {
      alert("Erro ao salvar");
    } finally {
      setLoading(false);
    }
  };

  const deleteCarro = async (id) => {
    if (window.confirm("Excluir veículo?")) {
      await axios.delete(`http://localhost:8000/api/carros/${id}/`);
      fetchCarros();
    }
  };

  const prepararEdicao = (carro) => {
    setEditandoId(carro.id);
    setForm({
      placa: carro.placa,
      modelo: carro.modelo,
      latitude: carro.lat_display,
      longitude: carro.lon_display,
    });
  };

  const totais = {
    ativos: carros.filter((c) => c.status === "funcionando").length,
    problema: carros.filter((c) => c.status === "problema").length,
    total: carros.length,
  };

  const dataPizza = [
    { name: "Ativos", value: totais.ativos },
    { name: "Problema", value: totais.problema },
  ];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        fontFamily: "'Inter', sans-serif",
        background: "#f5f7fb",
      }}
    >
      <div style={dashStyle}>
        <div style={cardStyle}>
          <strong>Total:</strong> {totais.total}
        </div>
        <div style={{ ...cardStyle, color: "green" }}>
          <strong>Ativos:</strong> {totais.ativos}
        </div>
        <div style={{ ...cardStyle, color: "red" }}>
          <strong>Problema:</strong> {totais.problema}
        </div>
        <button
          onClick={() => setShowDash(true)}
          style={{
            ...btnStyle,
            width: "auto",
            marginBottom: 0,
            padding: "5px 15px",
          }}
        >
          Ver Dashboard
        </button>
      </div>

      <div
        style={{
          display: "flex",
          flex: 1,
          overflow: "hidden",
          minHeight: 0,
        }}
      >
        <div style={sidebarStyle}>
          <div
            style={{
              background: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: "16px",
              padding: "16px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
            }}
          >
            <div
              style={{
                display: "flex",
                gap: "10px",
                alignItems: "flex-end",
                marginBottom: "10px",
              }}
            >
              <div style={{ flex: 1 }}>
                <label
                  style={{
                    fontSize: "0.9rem",
                    fontWeight: "bold",
                    display: "block",
                    marginBottom: "4px",
                    color: "#5e5a5a",
                  }}
                >
                  Raio (KM)
                </label>

                <input
                  type="number"
                  style={{
                    ...inputStyle,
                    marginBottom: 0,
                  }}
                  value={raioFiltro}
                  onChange={(e) => setRaioFiltro(e.target.value)}
                />
              </div>

              <div style={{ flex: 1 }}>
                <label
                  style={{
                    fontSize: "0.9rem",
                    fontWeight: "bold",
                    display: "block",
                    marginBottom: "4px",
                    color: "#5e5a5a",
                  }}
                >
                  Status
                </label>

                <select
                  style={{
                    ...inputStyle,
                    marginBottom: 0,
                  }}
                  value={statusFiltro}
                  onChange={(e) => setStatusFiltro(e.target.value)}
                >
                  <option value="">Todos</option>
                  <option value="funcionando">Funcionando</option>
                  <option value="problema">Problema</option>
                </select>
              </div>
            </div>
            {filtroCentro && (
              <button
                onClick={limparFiltro}
                style={{ ...btnStyle, background: "#dc3545" }}
              >
                Limpar Filtros de Área
              </button>
            )}

            <div
              style={{
                maxHeight: "120px",
                overflowY: "auto",
                border: "1px solid #eee",
                borderRadius: "6px",
              }}
            >
              <table
                style={{
                  width: "100%",
                  fontSize: "0.7rem",
                  borderCollapse: "collapse",
                  textAlign: "center",
                  color: "#5e5a5a",
                }}
              >
                <thead>
                  <tr
                    style={{
                      background: "#eee",
                    }}
                  >
                    <th style={{ padding: "5px" }}>Placa</th>
                    <th style={{ padding: "5px" }}>Modelo</th>
                    <th style={{ padding: "5px" }}>Ações</th>
                  </tr>
                </thead>

                <tbody>
                  {carros.map((c) => (
                    <tr
                      key={c.id}
                      style={{
                        borderBottom: "1px solid #eee",
                        cursor: "pointer",
                      }}
                      onClick={() => {
                        const marker = markerRefs.current[c.id];

                        if (marker) {
                          marker.openPopup();

                          mapRef.current.flyTo(
                            [c.lat_display, c.lon_display],
                            10,
                          );
                        }
                      }}
                    >
                      <td style={{ padding: "5px" }}>{c.placa}</td>

                      <td style={{ padding: "5px" }}>{c.modelo}</td>

                      <td style={{ padding: "5px" }}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "center",
                            gap: "8px",
                          }}
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              prepararEdicao(c);
                            }}
                            style={{
                              border: "none",
                              background: "#dbeafe",
                              color: "#2563eb",
                              borderRadius: "8px",
                              width: "28px",
                              height: "28px",
                              cursor: "pointer",
                              fontSize: "0.9rem",
                            }}
                          >
                            ✎
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteCarro(c.id);
                            }}
                            style={{
                              border: "none",
                              background: "#fee2e2",
                              color: "#dc2626",
                              borderRadius: "8px",
                              width: "28px",
                              height: "28px",
                              cursor: "pointer",
                              fontSize: "0.9rem",
                            }}
                          >
                            ×
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            style={{
              background: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: "16px",
              padding: "16px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
            }}
          >
            <h4
              style={{
                margin: "0 0 10px 0",
                color: "#5e5a5a",
              }}
            >
              {editandoId ? "Editar Veículo" : "Novo Veículo"}
            </h4>
            <input
              style={inputStyle}
              placeholder="Placa"
              value={form.placa}
              onChange={(e) => setForm({ ...form, placa: e.target.value })}
              required
            />
            <input
              style={inputStyle}
              placeholder="Modelo"
              value={form.modelo}
              onChange={(e) => setForm({ ...form, modelo: e.target.value })}
              required
            />
            <button
              type="button"
              onClick={() => setSelecionandoLocal(!selecionandoLocal)}
              style={{
                ...btnStyle,
                background: selecionandoLocal ? "#ffc107" : "transparent",
                border: "3px solid #003f7a",
                borderRadius: "16px",
                color: "#064272",
                marginTop: "15px",
              }}
            >
              {selecionandoLocal
                ? "Clique no mapa..."
                : "Selecionar local no mapa"}
            </button>
            <input
              style={inputStyle}
              type="number"
              step="any"
              placeholder="Lat"
              value={form.latitude}
              onChange={(e) => setForm({ ...form, latitude: e.target.value })}
              required
            />
            <input
              style={inputStyle}
              type="number"
              step="any"
              placeholder="Lon"
              value={form.longitude}
              onChange={(e) => setForm({ ...form, longitude: e.target.value })}
              required
            />
            <button type="submit" style={btnStyle} disabled={loading}>
              {loading ? "Salvando..." : editandoId ? "Atualizar" : "Cadastrar"}
            </button>
          </form>
        </div>

        <div style={{ flex: 1, position: "relative" }}>
          <MapContainer
            center={mapConfig.center}
            zoom={mapConfig.zoom}
            style={{
              height: "100%",
              cursor: selecionandoLocal ? "crosshair" : "grab",
            }}
            whenCreated={(mapInstance) => {
              mapRef.current = mapInstance;
            }}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <ChangeView center={mapConfig.center} zoom={mapConfig.zoom} />
            <MapEvents onMapClick={handleMapInteraction} />
            {filtroCentro && (
              <Circle
                center={filtroCentro}
                radius={raioFiltro * 1000}
                pathOptions={{
                  fillColor: "#007bff",
                  fillOpacity: 0.2,
                  color: "#007bff",
                  weight: 1,
                  dashArray: "5, 10",
                }}
              />
            )}
            {carros.map((carro) => (
              <Marker
                key={carro.id}
                position={[carro.lat_display, carro.lon_display]}
                icon={carro.status === "problema" ? RedIcon : BlueIcon}
                ref={(ref) => {
                  if (ref) markerRefs.current[carro.id] = ref;
                }}
              >
                <Popup offset={[0, -35]}>
                  <strong>{carro.modelo}</strong> ({carro.placa})<br />
                  Status: {carro.status} <br />
                  Temp:{" "}
                  {carro.ultima_previsao_tempo
                    ? `${carro.ultima_previsao_tempo}°C`
                    : "N/A"}
                  <hr />
                  <button onClick={() => prepararEdicao(carro)} style={miniBtn}>
                    Editar
                  </button>
                  <button
                    onClick={() => deleteCarro(carro.id)}
                    style={{ ...miniBtn, color: "red" }}
                  >
                    Excluir
                  </button>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>

      {showDash && (
        <div style={modalOverlay}>
          <div style={modalContent}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h2>Dashboard de Indicadores</h2>
              <button
                onClick={() => setShowDash(false)}
                style={{ ...btnStyle, width: "auto", background: "#333" }}
              >
                Fechar
              </button>
            </div>
            <div
              style={{
                display: "flex",
                gap: "20px",
                height: "400px",
                marginTop: "20px",
              }}
            >
              <div
                style={{
                  flex: 1,
                  background: "#fff",
                  padding: "10px",
                  borderRadius: "8px",
                }}
              >
                <h4
                  style={{
                    textAlign: "center",
                    color: "#5e5a5a",
                  }}
                >
                  Status da Frota
                </h4>
                <ResponsiveContainer width="100%" height="90%">
                  <PieChart>
                    <Pie
                      data={dataPizza}
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      <Cell fill="#4CAF50" />
                      <Cell fill="#F44336" />
                    </Pie>

                    <Tooltip />

                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      iconType="circle"
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div
                style={{
                  flex: 1,
                  background: "#fff",
                  padding: "10px",
                  borderRadius: "8px",
                }}
              >
                <h4
                  style={{
                    textAlign: "center",
                    color: "#5e5a5a",
                  }}
                >
                  Visão Geral (Quantitativo)
                </h4>
                <ResponsiveContainer width="100%" height="90%">
                  <BarChart data={dataPizza}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#007bff" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const dashStyle = {
  display: "flex",
  gap: "20px",
  padding: "10px 20px",
  background: "#f8f9fa",
  borderBottom: "1px solid #ddd",
  zIndex: 1000,
  alignItems: "center",
};
const cardStyle = {
  background: "white",
  padding: "8px 15px",
  borderRadius: "6px",
  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
  fontSize: "0.9rem",
};
const sidebarStyle = {
  width: "320px",
  padding: "20px",
  boxShadow: "2px 0 10px rgba(0,0,0,0.06)",
  zIndex: 1001,
  background: "#ffffff",
  display: "flex",
  flexDirection: "column",

  height: "100%",
  overflowY: "auto",

  gap: "16px",
};
const inputStyle = {
  width: "100%",
  marginBottom: "8px",
  padding: "6px",
  boxSizing: "border-box",
  border: "2px solid #5e5a5a",
  borderRadius: "8px",
  color: "#5e5a5a",
  backgroundColor: "transparent",
};
const btnStyle = {
  width: "100%",
  padding: "8px",
  background: "#003f7a",
  color: "white",
  border: "none",
  borderRadius: "16px",
  cursor: "pointer",
  marginBottom: "5px",
};
const miniBtn = {
  background: "none",
  border: "none",
  cursor: "pointer",
  textDecoration: "underline",
  marginRight: "10px",
  fontSize: "0.8rem",
  color: "#007bff",
};
const modalOverlay = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: "rgba(0,0,0,0.7)",
  zIndex: 2000,
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
};
const modalContent = {
  background: "#f4f4f4",
  padding: "30px",
  borderRadius: "12px",
  width: "80%",
  maxWidth: "900px",
};

export default App;
