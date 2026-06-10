import React, { useEffect, useState, useRef } from "react";
import {
    Container,
    Row,
    Col,
    Card,
    Spinner,
    Form,
    Button
} from "react-bootstrap";

import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from "recharts";

import { supabase } from "../database/supabaseconfig";
import * as XLSX from "xlsx";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import html2canvas from "html2canvas";

const DashboardEstadistico = () => {


    const graficoHoraRef = useRef(null);
    const graficoCategoriaRef = useRef(null);

    const [cargando, setCargando] = useState(true);

    const [fechaDesde, setFechaDesde] = useState(
        new Date().toLocaleDateString("en-CA")
    );

    const [fechaHasta, setFechaHasta] = useState(
        new Date().toLocaleDateString("en-CA")
    );


    const [estadisticas, setEstadisticas] = useState({
        totalVentas: 0,
        ventasEfectivo: 0,
        ventasTarjeta: 0,
        productosVendidos: 0,
        montoProductos: 0,
        cantidadVentas: 0,
        ventasPorHora: [],
        ventasPorCategoria: []
    });

    useEffect(() => {
        cargarDatos(fechaDesde, fechaHasta);
    }, [fechaDesde, fechaHasta]);

    const cargarDatos = async (desde, hasta) => {
        try {
            setCargando(true);

            const inicioRango = `${desde} 00:00:00`;
            const finRango = `${hasta} 23:59:59`;

            const { data: ventas, error } = await supabase
                .from("ventas")
                .select("id_venta, total, fecha_venta, metodo_pago")
                .gte("fecha_venta", inicioRango)
                .lte("fecha_venta", finRango);

            if (error) throw error;

            const idsVentas = ventas?.map(v => v.id_venta) || [];

            let productosVendidos = 0;
            let montoProductos = 0;
            let ventasPorCategoria = [];

            if (idsVentas.length > 0) {
                const { data: detalles } = await supabase
                    .from("detalles_ventas")
                    .select(`
          cantidad,
          subtotal,
          productos (
            nombre_producto,
            categorias (nombre_categoria)
          )
        `)
                    .in("id_venta", idsVentas);

                detalles?.forEach(d => {
                    productosVendidos += d.cantidad || 0;
                    montoProductos += d.subtotal || 0;

                    const categoria =
                        d.productos?.categorias?.nombre_categoria ||
                        "Sin categoría";

                    const existente = ventasPorCategoria.find(
                        c => c.name === categoria
                    );

                    if (existente) {
                        existente.value += d.subtotal || 0;
                    } else {
                        ventasPorCategoria.push({
                            name: categoria,
                            value: d.subtotal || 0
                        });
                    }
                });

                ventasPorCategoria.sort((a, b) => b.value - a.value);
            }

            const totalVentas =
                ventas?.reduce((sum, v) => sum + (v.total || 0), 0) || 0;

            const ventasEfectivo =
                ventas
                    ?.filter(v => v.metodo_pago === "efectivo")
                    .reduce((sum, v) => sum + (v.total || 0), 0) || 0;

            const ventasTarjeta =
                ventas
                    ?.filter(v => v.metodo_pago === "tarjeta")
                    .reduce((sum, v) => sum + (v.total || 0), 0) || 0;

            const horaMap = Array(24).fill(0);

            ventas?.forEach(venta => {

                if (!venta.fecha_venta) return;

                const hora = new Date(
                    venta.fecha_venta
                ).getHours();

                if (hora >= 0 && hora < 24) {
                    horaMap[hora] += venta.total || 0;
                }

            });

            const ventasPorHora = [];

            let acumulado = 0;

            for (let h = 8; h <= 22; h++) {
                acumulado += horaMap[h];

                ventasPorHora.push({
                    hora: `${h.toString().padStart(2, "0")}:00`,
                    total: Math.round(acumulado)
                });
            }

            setEstadisticas({
                totalVentas,
                ventasEfectivo,
                ventasTarjeta,
                productosVendidos,
                montoProductos,
                cantidadVentas: ventas?.length || 0,
                ventasPorHora,
                ventasPorCategoria
            });

        } catch (err) {

            console.error(
                "Error al cargar estadísticas:",
                err
            );

        } finally {

            setCargando(false);

        }
    };

    const descargarExcel = async () => {
        try {

            const datos = [
                {
                    totalVentas: estadisticas.totalVentas,
                    ventasEfectivo: estadisticas.ventasEfectivo,
                    ventasTarjeta: estadisticas.ventasTarjeta,
                    productosVendidos: estadisticas.productosVendidos,
                    cantidadVentas: estadisticas.cantidadVentas
                }
            ];

            const hoja = XLSX.utils.json_to_sheet(datos);

            const libro = XLSX.utils.book_new();

            XLSX.utils.book_append_sheet(
                libro,
                hoja,
                "Dashboard"
            );

            XLSX.writeFile(
                libro,
                `Dashboard_${fechaDesde}_${fechaHasta}.xlsx`
            );

        } catch (error) {

            console.error(error);

        }

    };

    const generarPDFGeneral = async () => {

    const pdf = new jsPDF();

    pdf.setFontSize(18);

    pdf.text(
        "Reporte Estadístico General",
        14,
        15
    );

    autoTable(pdf, {
    startY: 25,
    head: [["Indicador", "Valor"]],
    body: [
        [
            "Ventas Totales",
            `C$ ${estadisticas.totalVentas.toFixed(2)}`
        ],
        [
            "Ventas Efectivo",
            `C$ ${estadisticas.ventasEfectivo.toFixed(2)}`
        ],
        [
            "Ventas Tarjeta",
            `C$ ${estadisticas.ventasTarjeta.toFixed(2)}`
        ],
        [
            "Productos Vendidos",
            estadisticas.productosVendidos
        ],
        [
            "Cantidad de Ventas",
            estadisticas.cantidadVentas
        ]
    ]
});

const finalTabla = pdf.lastAutoTable?.finalY || 70;

const canvasHora = await html2canvas(
    graficoHoraRef.current
);

const imagenHora = canvasHora.toDataURL("image/png");

pdf.text(
    "Ventas por Hora",
    14,
    finalTabla + 15
);

pdf.addImage(
    imagenHora,
    "PNG",
    10,
    finalTabla + 20,
    90,
    55
);
    

const canvasCategoria = await html2canvas(
    graficoCategoriaRef.current
);

const imagenCategoria =
    canvasCategoria.toDataURL("image/png");

pdf.text(
    "Ventas por Categoría",
    110,
    finalTabla + 15
);

pdf.addImage(
    imagenCategoria,
    "PNG",
    115,
    finalTabla + 20,
    70,
    70
);

pdf.save(
    `ReporteGeneral_${fechaDesde}_${fechaHasta}.pdf`
);
};

if (!graficoHoraRef.current) {
    alert("No se encontró el gráfico de ventas por hora");
    return;
}

if (!graficoCategoriaRef.current) {
    alert("No se encontró el gráfico de categorías");
    return;
}
    const generarPDFVentasHora = async () => {
    try {
        const pdf = new jsPDF("p", "mm", "a4");

        //Título y fecha
        pdf.setFontSize(18);
        pdf.setTextColor("#330775");
        pdf.setFont("helvetica", "bold");
        pdf.text("Reporte de Ventas por Hora", 14, 15);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor("#000000");
        pdf.setFontSize(10);
        pdf.text(`Periodo: ${fechaDesde} - ${fechaHasta}`, 14, 22);

        // Imagen del gráfico
        const canvas = await html2canvas(graficoHoraRef.current);
        const imagen = canvas.toDataURL("image/png");
        pdf.addImage(imagen, "PNG", 10, 30, 190, 80);

        // Resumen general
        pdf.setFontSize(14);
        pdf.setTextColor("#330775");
        pdf.setFont("helvetica", "bold");
        pdf.text("Resumen General", 14, 115);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor("#000000");
        pdf.setFontSize(10);

        pdf.text(`Total Ventas: C$ ${estadisticas.totalVentas.toFixed(2)}`, 14, 125);
        pdf.text(`Ventas Efectivo: C$ ${estadisticas.ventasEfectivo.toFixed(2)}`, 14, 132);
        pdf.text(`Ventas Tarjeta: C$ ${estadisticas.ventasTarjeta.toFixed(2)}`, 14, 139);
        pdf.text(`Productos Vendidos: ${estadisticas.productosVendidos}`, 14, 146);
        pdf.text(`Cantidad Ventas: ${estadisticas.cantidadVentas}`, 14, 153);

        // Tabla de ventas por hora
        const filas = estadisticas.ventasPorHora.map(item => [
            item.hora,
            `C$ ${item.total}`
        ]);

        autoTable(pdf, {
            startY: 160,
            head: [["Hora", "Monto Acumulado"]],
            body: filas
        });

        // Descargar PDF
        const fechaActual = new Date().toLocaleDateString("en-CA", { timeZone: "America/Managua" });
        pdf.save(`VentasHora_${fechaDesde}_${fechaHasta}_Generado_${fechaActual}.pdf`);

    } catch (error) {
        console.error(error);
        alert("Error generando PDF");
    }
};

const generarPDFCategorias = async () => {

    const elemento = graficoCategoriaRef.current;

    const canvas = await html2canvas(elemento);

    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF();

    pdf.setFontSize(18);

    pdf.text(
        "Reporte Ventas por Categoría",
        14,
        15
    );

    pdf.addImage(
        imgData,
        "PNG",
        10,
        25,
        180,
        120
    );

    pdf.save(
        "VentasPorCategoria.pdf"
    );
};






    const COLORES = [
        "#5e26b2",
        "#39ff95",
        "#ff6bc6",
        "#8b46ff",
        "#00d4ff",
        "#ffd93d"
    ];




    if (cargando) {
        return (
            <Container className="text-center mt-5">
                <Spinner animation="border" variant="primary" />
                <p className="mt-3">Cargando estadísticas...</p>
            </Container>
        );
    }

    return (
        <Container fluid className="py-4">

            <div className="mb-4">
                <h2 className="fw-bold">
                    <i className="bi bi-graph-up-arrow me-2"></i>
                    Dashboard Estadístico
                </h2>

                <p className="text-muted">
                    Estadísticas generales de ventas
                </p>
            </div>

            <Card className="shadow-sm border-0 mb-4">
                <Card.Body>
                    <Row className="g-3">

                        <Col md={3}>
                            <Form.Group>
                                <Form.Label>Desde</Form.Label>

                                <Form.Control
                                    type="date"
                                    value={fechaDesde}
                                    onChange={(e) =>
                                        setFechaDesde(e.target.value)
                                    }
                                />
                            </Form.Group>
                        </Col>

                        <Col md={3}>
                            <Form.Group>
                                <Form.Label>Hasta</Form.Label>

                                <Form.Control
                                    type="date"
                                    value={fechaHasta}
                                    onChange={(e) =>
                                        setFechaHasta(e.target.value)
                                    }
                                />
                            </Form.Group>
                        </Col>

                        <Col
                            md={3}
                            className="d-flex align-items-end"
                        >
                            <Button
                                variant="success"
                                onClick={descargarExcel}
                            >
                                <i className="bi bi-file-earmark-excel me-2"></i>
                                Exportar Excel
                            </Button>

                            <Button
                                variant="danger"
                                className="ms-2"
                                onClick={generarPDFGeneral}
                            >
                                <i className="bi bi-file-earmark-pdf me-2"></i>
                                PDF
                            </Button>
                        </Col>

                    </Row>
                </Card.Body>
            </Card>

            <Row className="g-4 mb-4">

                <Col lg={3} md={6}>
                    <Card className="border-0 shadow-sm">
                        <Card.Body>
                            <h6 className="text-muted">
                                Ventas Totales
                            </h6>

                            <h3 className="fw-bold">
                                C$ {estadisticas.totalVentas.toFixed(2)}
                            </h3>
                        </Card.Body>
                    </Card>
                </Col>

                <Col lg={3} md={6}>
                    <Card className="border-0 shadow-sm">
                        <Card.Body>
                            <h6 className="text-muted">
                                Efectivo
                            </h6>

                            <h3 className="fw-bold text-success">
                                C$ {estadisticas.ventasEfectivo.toFixed(2)}
                            </h3>
                        </Card.Body>
                    </Card>
                </Col>

                <Col lg={3} md={6}>
                    <Card className="border-0 shadow-sm">
                        <Card.Body>
                            <h6 className="text-muted">
                                Tarjeta
                            </h6>

                            <h3 className="fw-bold text-primary">
                                C$ {estadisticas.ventasTarjeta.toFixed(2)}
                            </h3>
                        </Card.Body>
                    </Card>
                </Col>

                <Col lg={3} md={6}>
                    <Card className="border-0 shadow-sm">
                        <Card.Body>
                            <h6 className="text-muted">
                                Productos Vendidos
                            </h6>

                            <h3 className="fw-bold">
                                {estadisticas.productosVendidos}
                            </h3>
                        </Card.Body>
                    </Card>
                </Col>

            </Row>

            <Row className="g-4">

                <Col lg={8}>
                    <Card className="border-0 shadow-sm">
                        <Card.Body ref={graficoHoraRef}>

                            <h5 className="mb-4">
                                Ventas por Hora
                            </h5>

                            <ResponsiveContainer
                                width="100%"
                                height={350}
                            >
                                <LineChart
                                    data={estadisticas.ventasPorHora}
                                >
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                    />

                                    <XAxis dataKey="hora" />

                                    <YAxis />

                                    <Tooltip />

                                    <Line
                                        type="monotone"
                                        dataKey="total"
                                        stroke="#5e26b2"
                                        strokeWidth={3}
                                    />
                                </LineChart>
                            </ResponsiveContainer>

                            <div className="text-center mt-3">
                                <Button
                                    variant="danger"
                                    onClick={generarPDFVentasHora}
                                >
                                    Descargar PDF
                                </Button>
                            </div>

                        </Card.Body>
                    </Card>
                </Col>

                <Col lg={4}>
                    <Card className="border-0 shadow-sm">
                        <Card.Body ref={graficoCategoriaRef}>

                            <h5 className="mb-4">
                                Ventas por Categoría
                            </h5>

                            <ResponsiveContainer
                                width="100%"
                                height={350}
                            >
                                <PieChart>

                                    <Pie
                                        data={estadisticas.ventasPorCategoria}
                                        dataKey="value"
                                        nameKey="name"
                                        outerRadius={110}
                                        label
                                    >
                                        {estadisticas.ventasPorCategoria.map(
                                            (_, index) => (
                                                <Cell
                                                    key={index}
                                                    fill={
                                                        COLORES[
                                                        index %
                                                        COLORES.length
                                                        ]
                                                    }
                                                />
                                            )
                                        )}
                                    </Pie>

                                    <Tooltip />

                                </PieChart>
                            </ResponsiveContainer>

                            <div className="text-center mt-3">
    <Button
        variant="danger"
        onClick={generarPDFCategorias}
    >
        Descargar PDF
    </Button>
</div>

                        </Card.Body>
                    </Card>
                </Col>

            </Row>

        </Container>
    );
};

export default DashboardEstadistico;