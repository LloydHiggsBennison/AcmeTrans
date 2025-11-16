import { useState } from "react";
import jsPDF from "jspdf";

const TIPOS = [
  "Rendimiento Conductores",
  "Análisis de Viajes",
  "Eficiencia de Rutas",
  "Satisfacción Clientes",
];

export function Reportes({ conductores, viajes }) {
  const [inicio, setInicio] = useState("");
  const [fin, setFin] = useState("");
  const [tipo, setTipo] = useState(TIPOS[0]);

  const handleGenerar = () => {
    if (!inicio || !fin) {
      alert("Debe seleccionar rango de fechas.");
      return;
    }

    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text("Corporativa AcmeTrans - Reporte", 14, 18);
    doc.setFontSize(10);
    doc.text(`Tipo de reporte: ${tipo}`, 14, 26);
    doc.text(`Rango: ${inicio} al ${fin}`, 14, 32);

    doc.text("Resumen básico:", 14, 42);

    const totalConductores = conductores.length;
    const totalViajes = viajes.length;
    const completados = viajes.filter((v) => v.estado === "completado").length;

    doc.text(`• Conductores registrados: ${totalConductores}`, 18, 50);
    doc.text(`• Viajes registrados: ${totalViajes}`, 18, 56);
    doc.text(`• Viajes completados: ${completados}`, 18, 62);

    doc.text(
      "Este reporte es un ejemplo base. Puedes extenderlo con tablas, KPIs y más detalles.",
      14,
      76,
      { maxWidth: 180 }
    );

    doc.save(
      `Reporte-${tipo.replace(/\s+/g, "_")}-${inicio}-a-${fin}.pdf`
    );
  };

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <span className="icon">📑</span> Reportes y Análisis
          </h1>
          <p className="page-subtitle">
            Genera un resumen en PDF del comportamiento de la operación.
          </p>
        </div>
      </div>

      <div className="grid-4" style={{ marginBottom: 18 }}>
        <div>
          <div className="label">Fecha inicio</div>
          <input
            type="date"
            className="input"
            value={inicio}
            onChange={(e) => setInicio(e.target.value)}
          />
        </div>
        <div>
          <div className="label">Fecha fin</div>
          <input
            type="date"
            className="input"
            value={fin}
            onChange={(e) => setFin(e.target.value)}
          />
        </div>
        <div>
          <div className="label">Tipo de reporte</div>
          <select
            className="select"
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
          >
            {TIPOS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div style={{ display: "flex", alignItems: "flex-end" }}>
          <button className="btn btn-primary" onClick={handleGenerar}>
            📥 Generar reporte PDF
          </button>
        </div>
      </div>

      <div className="placeholder-panel">
        El resumen del reporte se descargará como PDF. Esta sección se puede usar
        para mostrar una previsualización si lo necesitas.
      </div>
    </section>
  );
}
