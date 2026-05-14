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
import axios from "axios";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

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
        if (filtroCentro) {
          await fetchCarros(filtroCentro[0], filtroCentro[1]);
        } else {
          await fetchCarros();
        }
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
      if (editandoId) {
        await axios.patch(
          `http://localhost:8000/api/carros/${editandoId}/`,
          form,
        );
      } else {
        await axios.post("http://localhost:8000/api/carros/", form);
      }
      setForm({ placa: "", modelo: "", latitude: -27.59, longitude: -48.54 });
      setEditandoId(null);
      fetchCarros();
    } catch (error) {
      alert(error.message);
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

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        fontFamily: "sans-serif",
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
          <strong>Com Problema:</strong> {totais.problema}
        </div>
      </div>

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <div style={sidebarStyle}>
          <div
            style={{
              marginBottom: "20px",
              borderBottom: "1px solid #eee",
              paddingBottom: "10px",
            }}
          >
            <label style={{ fontSize: "0.8rem" }}>Raio de Busca (km):</label>
            <input
              type="number"
              style={inputStyle}
              value={raioFiltro}
              onChange={(e) => setRaioFiltro(e.target.value)}
            />
            <label style={{ fontSize: "0.8rem" }}>Filtrar Status:</label>
            <select
              style={inputStyle}
              value={statusFiltro}
              onChange={(e) => setStatusFiltro(e.target.value)}
            >
              <option value="">Todos</option>
              <option value="funcionando">Funcionando</option>
              <option value="problema">Problema</option>
            </select>
            {filtroCentro && (
              <button
                onClick={limparFiltro}
                style={{ ...btnStyle, background: "#dc3545" }}
              >
                ✖ Limpar Filtros
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit}>
            <h4>{editandoId ? "Editar Veículo" : "Novo Veículo"}</h4>
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
                background: selecionandoLocal ? "#ffc107" : "#6c757d",
                color: "#000",
              }}
            >
              {selecionandoLocal ? "Clique no mapa..." : "📍 Selecionar Local"}
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
            {editandoId && (
              <button
                type="button"
                onClick={() => {
                  setEditandoId(null);
                  setForm({
                    placa: "",
                    modelo: "",
                    latitude: -27,
                    longitude: -48,
                  });
                }}
                style={{ ...btnStyle, background: "#ccc" }}
              >
                Cancelar
              </button>
            )}
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
              >
                <Popup>
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
};
const cardStyle = {
  background: "white",
  padding: "8px 15px",
  borderRadius: "6px",
  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
  fontSize: "0.9rem",
};
const sidebarStyle = {
  width: "300px",
  padding: "20px",
  boxShadow: "2px 0 5px rgba(0,0,0,0.1)",
  zIndex: 1001,
  background: "white",
  overflowY: "auto",
};
const inputStyle = {
  width: "100%",
  marginBottom: "10px",
  padding: "8px",
  boxSizing: "border-box",
  border: "1px solid #ccc",
  borderRadius: "4px",
};
const btnStyle = {
  width: "100%",
  padding: "10px",
  background: "#007bff",
  color: "white",
  border: "none",
  borderRadius: "4px",
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

export default App;
