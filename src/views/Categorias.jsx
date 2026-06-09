import React, { useState, useEffect } from "react";
import { Container, Row, Col, Button, Spinner, Alert } from "react-bootstrap";
import { supabase } from "../database/supabaseconfig";
import ModalRegistroCategoria from "../components/categorias/ModalRegistroCategoria";
import ModalEdicionCategoria from "../components/categorias/ModalEdicionCategoria";
import ModalEliminacionCategoria from "../components/categorias/ModalEliminacionCategoria";
import TablaCategorias from "../components/categorias/TablaCategorias";
import TarjetaCategoria from "../components/categorias/TarjetaCategoria";
import NotificacionOperacion from "../components/NotificacionOperacion";
import CuadroBusquedas from "../components/busquedas/CuadroBusquedas";
import Paginacion from "../components/ordenamiento/Paginacion";
import ModalEnvioCorreoCategorias from "../components/categorias/ModalEnvioCorreoCategorias";
import emailjs from '@emailjs/browser';

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const Categorias = () => {



    const [mostrarModalCorreo, setMostrarModalCorreo] = useState(false);
    const [emailDestino, setEmailDestino] = useState("");
    const [enviandoCorreo, setEnviandoCorreo] = useState(false);

    const [toast, setToast] = useState({ mostrar: false, mensaje: "", tipo: "" });
    const [mostrarModal, setMostrarModal] = useState(false);

    const [nuevaCategoria, setNuevaCategoria] = useState({
        nombre_categoria: "",
        descripcion_categoria: "",
    });

    const [categorias, setCategorias] = useState([]);
    const [categoriasFiltradas, setCategoriasFiltradas] = useState([]);
    const [textoBusqueda, setTextoBusqueda] = useState("");

    const [cargando, setCargando] = useState(true);

    const [mostrarModalEliminacion, setMostrarModalEliminacion] = useState(false);
    const [categoriaAEliminar, setCategoriaAEliminar] = useState(null);

    const [mostrarModalEdicion, setMostrarModalEdicion] = useState(false);

    const [categoriaEditar, setCategoriaEditar] = useState({
        id_categoria: "",
        nombre_categoria: "",
        descripcion_categoria: "",
    });

    const [paginaActual, setPaginaActual] = useState(1);
    const [registrosPorPagina, setRegistrosPorPagina] = useState(5);

    // ================= BUSQUEDA =================
    const manejarBusqueda = (e) => {
        setTextoBusqueda(e.target.value);
        setPaginaActual(1);
    };

    useEffect(() => {
        if (!textoBusqueda.trim()) {
            setCategoriasFiltradas(categorias);
        } else {
            const textoLower = textoBusqueda.toLowerCase().trim();

            const filtradas = categorias.filter(
                (cat) =>
                    cat.nombre_categoria.toLowerCase().includes(textoLower) ||
                    (cat.descripcion_categoria &&
                        cat.descripcion_categoria.toLowerCase().includes(textoLower))
            );

            setCategoriasFiltradas(filtradas);
        }
    }, [textoBusqueda, categorias]);

    const datosMostrar = textoBusqueda.trim()
        ? categoriasFiltradas
        : categorias;

// copia 

    const copiarCategoria = async (categoria) => {
        if (!categoria) return;

        const texto = `
    ID: ${categoria.id_categoria}
    Nombre: ${categoria.nombre_categoria}
    Descripción: ${categoria.descripcion_categoria || "Sin descripción"}`

        try {
            await navigator.clipboard.writeText(texto);
            setToast({
                mostrar: true,
                mensaje: `Categoría "${categoria.nombre_categoria}" copiada al portapapeles.`,
                tipo: "exito",
            });
        } catch (err) {
            console.error("Error al copiar categoría:", err);
            setToast({
                mostrar: true,
                mensaje: "No se pudo copiar al portapapeles.",
                tipo: "error",
            });
        }
    };

    // ================= PAGINACION =================
    const indiceUltimo = paginaActual * registrosPorPagina;
    const indicePrimero = indiceUltimo - registrosPorPagina;

    const categoriasPaginadas = datosMostrar.slice(
        indicePrimero,
        indiceUltimo
    );

    const establecerPaginaActual = (numeroPagina) => {
        setPaginaActual(numeroPagina);
    };

    const establecerRegistrosPorPagina = (cantidad) => {
        setRegistrosPorPagina(cantidad);
        setPaginaActual(1);
    };

    // ================= PDF =================
    const generarPDFCategoria = (categoria) => {

        const doc = new jsPDF();

        // Título
        doc.setFontSize(18);
        doc.text("Reporte de Categoría", 14, 20);

        // Línea decorativa
        doc.line(14, 25, 195, 25);

        // Información
        doc.setFontSize(12);

        autoTable(doc, {
            startY: 35,
            head: [["Campo", "Valor"]],
            body: [
                ["ID", categoria.id_categoria],
                ["Nombre", categoria.nombre_categoria],
                ["Descripción", categoria.descripcion_categoria],
            ],
        });

        // Descargar PDF
        doc.save(`categoria_${categoria.id_categoria}.pdf`);
    };

    // ================= CARGA =================
    const cargarCategorias = async () => {
        try {
            setCargando(true);

            const { data, error } = await supabase
                .from("categorias")
                .select("*")
                .order("id_categoria", { ascending: true });

            if (error) {
                setToast({
                    mostrar: true,
                    mensaje: "Error al cargar categorías.",
                    tipo: "error",
                });

                return;
            }

            setCategorias(
                (data || []).map((item) => ({
                    ...item,
                    descripcion_categoria:
                        item.descripcion_categoria ?? item.descripcion ?? "",
                    nombre_categoria:
                        item.nombre_categoria ?? item.nombre ?? "",
                }))
            );

        } catch {

            setToast({
                mostrar: true,
                mensaje: "Error inesperado.",
                tipo: "error",
            });

        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        cargarCategorias();
    }, []);

    // ================= CRUD =================
    const agregarCategoria = async () => {

        if (
            !nuevaCategoria.nombre_categoria.trim() ||
            !nuevaCategoria.descripcion_categoria.trim()
        ) {

            setToast({
                mostrar: true,
                mensaje: "Debe llenar todos los campos.",
                tipo: "advertencia"
            });

            return;
        }

        const { error } = await supabase
            .from("categorias")
            .insert([nuevaCategoria]);

        if (error) {

            setToast({
                mostrar: true,
                mensaje: "Error al registrar.",
                tipo: "error"
            });

            return;
        }

        await cargarCategorias();

        setNuevaCategoria({
            nombre_categoria: "",
            descripcion_categoria: "",
        });

        setMostrarModal(false);
    };

    const actualizarCategoria = async () => {

        const { error } = await supabase
            .from("categorias")
            .update(categoriaEditar)
            .eq("id_categoria", categoriaEditar.id_categoria);

        if (error) {

            setToast({
                mostrar: true,
                mensaje: "Error al actualizar.",
                tipo: "error"
            });

            return;
        }

        setMostrarModalEdicion(false);
        cargarCategorias();
    };

    const eliminarCategoria = async () => {

        const { error } = await supabase
            .from("categorias")
            .delete()
            .eq("id_categoria", categoriaAEliminar.id_categoria);

        if (error) {

            setToast({
                mostrar: true,
                mensaje: "Error al eliminar.",
                tipo: "error"
            });

            return;
        }

        setMostrarModalEliminacion(false);
        cargarCategorias();
    };

    const abrirModalEdicion = (categoria) => {
        setCategoriaEditar(categoria);
        setMostrarModalEdicion(true);
    };

    const abrirModalEliminacion = (categoria) => {
        setCategoriaAEliminar(categoria);
        setMostrarModalEliminacion(true);
    };

    const manejoCambioInput = (e) => {
        const { name, value } = e.target;

        setNuevaCategoria((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    const manejoCambioInputEdicion = (e) => {
        const { name, value } = e.target;

        setCategoriaEditar((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    // Inicializar EmailJS
    useEffect(() => {
        emailjs.init(import.meta.env.VITE_EMAILJS_PUBLIC_KEY);
    }, []);

    const abrirModalCorreo = () => {
        setEmailDestino("");
        setMostrarModalCorreo(true);
    };

    const formatearCategoriasParaCorreo = () => {
        if (categorias.length === 0) return "No hay categorías registradas.";

        let texto = `LISTADO DE CATEGORÍAS\n\n`;
        texto += `Fecha: ${new Date().toLocaleDateString("es-NI")}\n`;
        texto += `Total de categorías: ${categorias.length}\n\n`;

        categorias.forEach((cat, index) => {
            texto += `${index + 1}. ${cat.nombre_categoria}\n`;
            if (cat.descripcion_categoria) {
                texto += `   Descripción: ${cat.descripcion_categoria}\n`;
            }
            texto += `\n`;
        });

        return texto;
    };

    const enviarCorreoCategorias = () => {
        if (!emailDestino.trim()) {
            setToast({
                mostrar: true,
                mensaje: "Por favor ingresa un correo destino.",
                tipo: "advertencia",
            });
            return;
        }

        setEnviandoCorreo(true);

        const mensaje = formatearCategoriasParaCorreo();

        const templateParams = {
            to_name: "Administrador",
            user_email: emailDestino,
            message: mensaje,
            fecha_envio: new Date().toLocaleDateString("es-NI")
        };

        emailjs.send(
            import.meta.env.VITE_EMAILJS_SERVICE_ID,
            import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
            templateParams
        )
            .then(() => {
                setToast({
                    mostrar: true,
                    mensaje: "Correo enviado correctamente.",
                    tipo: "exito",
                });
                setMostrarModalCorreo(false);
                setEmailDestino("");
            })
            .catch((error) => {
                console.error("Error EmailJS:", error);
                setToast({
                    mostrar: true,
                    mensaje: "Error al enviar el correo.",
                    tipo: "error",
                });
            })
            .finally(() => {
                setEnviandoCorreo(false);
            });
    };



    // ================= RENDER =================
    return (
        <Container className="mt-3">

            <Row className="align-items-center mb-3">

                <Col>
                    <h3>
                        <i className="bi-bookmark-plus-fill me-2"></i>
                        Categorías
                    </h3>
                </Col>

                <Col xs={2} sm={2} md={2} lg={2} className="text-end">
                    <Button variant="primary" onClick={abrirModalCorreo} size="md">
                        <i className="bi bi-envelope"></i>
                        <span className="d-none d-lg-inline ms-2">Enviar por Correo</span>
                    </Button>
                </Col>

                <Col className="text-end">
                    <Button onClick={() => setMostrarModal(true)}>
                        + Nueva Categoría
                    </Button>
                </Col>

            </Row>





            <hr />

            {/* BUSQUEDA */}
            <Row className="mb-4">
                <Col md={6}>

                    <CuadroBusquedas
                        textoBusqueda={textoBusqueda}
                        manejarCambioBusqueda={manejarBusqueda}
                        placeholder="Buscar..."
                    />

                </Col>
            </Row>

            {/* SIN RESULTADOS */}
            {!cargando &&
                textoBusqueda &&
                datosMostrar.length === 0 && (
                    <Alert variant="info">
                        No se encontraron resultados
                    </Alert>
                )}

            {/* LOADING */}
            {cargando && <Spinner animation="border" />}

            {/* TABLA / TARJETAS */}
            {!cargando && datosMostrar.length > 0 && (

                <Row>

                    <Col className="d-lg-none">

                        <TarjetaCategoria
                            categorias={categoriasPaginadas}
                            abrirModalEdicion={abrirModalEdicion}
                            abrirModalEliminacion={abrirModalEliminacion}
                            copiarCategoria={copiarCategoria}
                        />

                    </Col>

                    <Col className="d-none d-lg-block">

                        <TablaCategorias
                            categorias={categoriasPaginadas}
                            abrirModalEdicion={abrirModalEdicion}
                            abrirModalEliminacion={abrirModalEliminacion}
                            generarPDFCategoria={generarPDFCategoria}
                            copiarCategoria={copiarCategoria}
                        />

                    </Col>

                </Row>
            )}

            {/* PAGINACION */}
            {datosMostrar.length > 0 && (

                <Paginacion
                    registrosPorPagina={registrosPorPagina}
                    totalRegistros={datosMostrar.length}
                    paginaActual={paginaActual}
                    establecerPaginaActual={establecerPaginaActual}
                    establecerRegistrosPorPagina={establecerRegistrosPorPagina}
                />
            )}

            {/* MODALES */}
            <ModalRegistroCategoria
                mostrarModal={mostrarModal}
                setMostrarModal={setMostrarModal}
                nuevaCategoria={nuevaCategoria}
                manejoCambioInput={manejoCambioInput}
                agregarCategoria={agregarCategoria}
            />

            <ModalEdicionCategoria
                mostrarModalEdicion={mostrarModalEdicion}
                setMostrarModalEdicion={setMostrarModalEdicion}
                categoriaEditar={categoriaEditar}
                manejoCambioInputEdicion={manejoCambioInputEdicion}
                actualizarCategoria={actualizarCategoria}
            />

            <ModalEliminacionCategoria
                mostrarModalEliminacion={mostrarModalEliminacion}
                setMostrarModalEliminacion={setMostrarModalEliminacion}
                eliminarCategoria={eliminarCategoria}
                categoria={categoriaAEliminar}
            />

            <NotificacionOperacion
                mostrar={toast.mostrar}
                mensaje={toast.mensaje}
                tipo={toast.tipo}
                onCerrar={() =>
                    setToast({
                        ...toast,
                        mostrar: false
                    })
                }
            />

            <ModalEnvioCorreoCategorias
                mostrarModalCorreo={mostrarModalCorreo}
                setMostrarModalCorreo={setMostrarModalCorreo}
                emailDestino={emailDestino}
                setEmailDestino={setEmailDestino}
                enviandoCorreo={enviandoCorreo}
                enviarCorreoCategorias={enviarCorreoCategorias}
                totalCategorias={categorias.length}
            />


        </Container>
    );
};

export default Categorias;