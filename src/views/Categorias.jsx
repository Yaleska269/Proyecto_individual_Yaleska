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

const Categorias = () => {
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

    // 🔥 PAGINACIÓN
    const [paginaActual, setPaginaActual] = useState(1);
    const [registrosPorPagina, setRegistrosPorPagina] = useState(5);

    // ================= BUSQUEDA =================
    const manejarBusqueda = (e) => {
        setTextoBusqueda(e.target.value);
        setPaginaActual(1); // resetear página al buscar
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

    // 🔥 LOGICA PAGINACION
    const indiceUltimo = paginaActual * registrosPorPagina;
    const indicePrimero = indiceUltimo - registrosPorPagina;
    const categoriasPaginadas = datosMostrar.slice(indicePrimero, indiceUltimo);

    const establecerPaginaActual = (numeroPagina) => {
        setPaginaActual(numeroPagina);
    };

    const establecerRegistrosPorPagina = (cantidad) => {
        setRegistrosPorPagina(cantidad);
        setPaginaActual(1);
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
        if (!nuevaCategoria.nombre_categoria.trim() || !nuevaCategoria.descripcion_categoria.trim()) {
            setToast({ mostrar: true, mensaje: "Debe llenar todos los campos.", tipo: "advertencia" });
            return;
        }

        const { error } = await supabase.from("categorias").insert([nuevaCategoria]);

        if (error) {
            setToast({ mostrar: true, mensaje: "Error al registrar.", tipo: "error" });
            return;
        }

        await cargarCategorias();
        setNuevaCategoria({ nombre_categoria: "", descripcion_categoria: "" });
        setMostrarModal(false);
    };

    const actualizarCategoria = async () => {
        const { error } = await supabase
            .from("categorias")
            .update(categoriaEditar)
            .eq("id_categoria", categoriaEditar.id_categoria);

        if (error) {
            setToast({ mostrar: true, mensaje: "Error al actualizar.", tipo: "error" });
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
            setToast({ mostrar: true, mensaje: "Error al eliminar.", tipo: "error" });
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
        setNuevaCategoria((prev) => ({ ...prev, [name]: value }));
    };

    const manejoCambioInputEdicion = (e) => {
        const { name, value } = e.target;
        setCategoriaEditar((prev) => ({ ...prev, [name]: value }));
    };

    // ================= RENDER =================
    return (
        <Container className="mt-3">

            <Row className="align-items-center mb-3">
                <Col>
                    <h3>
                        <i className="bi-bookmark-plus-fill me-2"></i> Categorías
                    </h3>
                </Col>
                <Col className="text-end">
                    <Button onClick={() => setMostrarModal(true)}>
                        Nueva Categoría
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
            {!cargando && textoBusqueda && datosMostrar.length === 0 && (
                <Alert variant="info">No se encontraron resultados</Alert>
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
                        />
                    </Col>

                    <Col className="d-none d-lg-block">
                        <TablaCategorias
                            categorias={categoriasPaginadas}
                            abrirModalEdicion={abrirModalEdicion}
                            abrirModalEliminacion={abrirModalEliminacion}
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
                onCerrar={() => setToast({ ...toast, mostrar: false })}
            />
        </Container>
    );
};

export default Categorias;