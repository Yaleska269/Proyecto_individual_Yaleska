import React, { useState, useEffect } from "react";
import { Container, Row, Col, Button } from "react-bootstrap";
import { supabase } from "../database/supabaseconfig";

import ModalRegistroProducto from "../components/productos/ModalRegistroProducto";
import ModalEdicionProducto from "../components/productos/ModalEdicionProducto";
import ModalEliminacionProducto from "../components/productos/ModalEliminacionProducto";

import TablaProductos from "../components/productos/TablaProductos";
import CuadroBusquedas from "../components/busquedas/CuadroBusquedas";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const Productos = () => {

    const [productos, setProductos] = useState([]);
    const [productosFiltrados, setProductosFiltrados] = useState([]);
    const [categorias, setCategorias] = useState([]);

    const [textoBusqueda, setTextoBusqueda] = useState("");

    const [cargando, setCargando] = useState(true);

    const [mostrarModal, setMostrarModal] = useState(false);

    const [mostrarModalEdicion, setMostrarModalEdicion] = useState(false);
    const [mostrarModalEliminacion, setMostrarModalEliminacion] = useState(false);

    const [productoEditar, setProductoEditar] = useState(null);
    const [productoAEliminar, setProductoAEliminar] = useState(null);

    const [nuevoProducto, setNuevoProducto] = useState({
        nombre_producto: "",
        descripcion_producto: "",
        categoria_producto: "",
        precio_venta: "",
        archivo: null,
    });

    // ================= PDF =================
    const generarPDFProducto = (producto) => {

        const categoriaNombre =
            categorias.find(
                (cat) => cat.id_categoria === producto.categoria_producto
            )?.nombre_categoria || "Sin categoría";

        const doc = new jsPDF();

        // Título
        doc.setFontSize(18);
        doc.text("Reporte de Producto", 14, 20);

        // Línea decorativa
        doc.line(14, 25, 195, 25);

        // Tabla
        autoTable(doc, {
            startY: 35,
            head: [["Campo", "Valor"]],
            body: [
                ["ID", producto.id_producto],
                ["Nombre", producto.nombre_producto],
                ["Descripción", producto.descripcion_producto],
                ["Categoría", categoriaNombre],
                ["Precio", `$${producto.precio_venta}`],
            ],
        });

        // Descargar
        doc.save(`producto_${producto.id_producto}.pdf`);
    };

    useEffect(() => {
        cargarCategorias();
        cargarProductos();
    }, []);

    useEffect(() => {

        const resultado = productos.filter((p) =>
            p.nombre_producto
                .toLowerCase()
                .includes(textoBusqueda.toLowerCase())
        );

        setProductosFiltrados(resultado);

    }, [textoBusqueda, productos]);

    const cargarCategorias = async () => {

        const { data, error } = await supabase
            .from("categorias")
            .select("*")
            .order("id_categoria", { ascending: true });

        if (error) {
            console.error(error.message);
            return;
        }

        setCategorias(data || []);
    };

    const cargarProductos = async () => {

        setCargando(true);

        const { data, error } = await supabase
            .from("productos")
            .select("*")
            .order("id_producto", { ascending: true });

        if (error) {
            console.error(error.message);
        } else {
            setProductos(data || []);
            setProductosFiltrados(data || []);
        }

        setCargando(false);
    };

    const manejoCambioInput = (e) => {

        const { name, value } = e.target;

        setNuevoProducto({
            ...nuevoProducto,
            [name]:
                name === "categoria_producto"
                    ? parseInt(value)
                    : value,
        });
    };

    const manejoCambioArchivo = (e) => {

        const archivo = e.target.files[0];

        if (archivo && archivo.type.startsWith("image/")) {

            setNuevoProducto({
                ...nuevoProducto,
                archivo,
            });

        } else {
            alert("Seleccione una imagen válida");
        }
    };

    const agregarProducto = async () => {

        try {

            if (
                !nuevoProducto.nombre_producto ||
                !nuevoProducto.categoria_producto ||
                !nuevoProducto.precio_venta ||
                !nuevoProducto.archivo
            ) {
                alert("Complete todos los campos");
                return;
            }

            const nombreArchivo =
                `${Date.now()}_${nuevoProducto.archivo.name}`;

            const { error: uploadError } = await supabase.storage
                .from("imagenes_productos")
                .upload(nombreArchivo, nuevoProducto.archivo);

            if (uploadError) throw uploadError;

            const { data } = supabase.storage
                .from("imagenes_productos")
                .getPublicUrl(nombreArchivo);

            const { error } = await supabase
                .from("productos")
                .insert([
                    {
                        nombre_producto: nuevoProducto.nombre_producto,
                        descripcion_producto:
                            nuevoProducto.descripcion_producto,
                        categoria_producto:
                            parseInt(nuevoProducto.categoria_producto),
                        precio_venta:
                            parseFloat(nuevoProducto.precio_venta),
                        url_imagen: data.publicUrl,
                    },
                ]);

            if (error) throw error;

            alert("Producto agregado");

            setMostrarModal(false);

            setNuevoProducto({
                nombre_producto: "",
                descripcion_producto: "",
                categoria_producto: "",
                precio_venta: "",
                archivo: null,
            });

            await cargarProductos();

        } catch (err) {
            console.error(err.message);
        }
    };

    const abrirModalEdicion = (producto) => {

        setProductoEditar(producto);
        setMostrarModalEdicion(true);
    };

    const abrirModalEliminacion = (producto) => {

        setProductoAEliminar(producto);
        setMostrarModalEliminacion(true);
    };

    const actualizarProducto = async (producto) => {

        try {

            let urlImagen = producto.url_imagen;

            if (producto.archivo) {

                const nombreArchivo =
                    `${Date.now()}_${producto.archivo.name}`;

                const { error: uploadError } = await supabase.storage
                    .from("imagenes_productos")
                    .upload(nombreArchivo, producto.archivo);

                if (uploadError) throw uploadError;

                const { data } = supabase.storage
                    .from("imagenes_productos")
                    .getPublicUrl(nombreArchivo);

                urlImagen = data.publicUrl;
            }

            const { error } = await supabase
                .from("productos")
                .update({
                    nombre_producto: producto.nombre_producto,
                    descripcion_producto:
                        producto.descripcion_producto,
                    categoria_producto:
                        parseInt(producto.categoria_producto),
                    precio_venta:
                        parseFloat(producto.precio_venta),
                    url_imagen: urlImagen,
                })
                .eq("id_producto", producto.id_producto);

            if (error) throw error;

            alert("Producto actualizado");

            setMostrarModalEdicion(false);

            await cargarProductos();

        } catch (err) {
            console.error(err.message);
        }
    };

    const eliminarProducto = async (id) => {

        try {

            const { error } = await supabase
                .from("productos")
                .delete()
                .eq("id_producto", id);

            if (error) throw error;

            alert("Producto eliminado");

            setMostrarModalEliminacion(false);

            await cargarProductos();

        } catch (err) {
            console.error(err.message);
        }
    };

    return (
        <Container className="mt-3">

            <Row className="mb-3">

                <Col>
                    <h3>
                        <i className="bi bi-box-seam me-2"></i>
                        Productos
                    </h3>
                </Col>

                <Col className="text-end">

                    <Button onClick={() => setMostrarModal(true)}>
                        <i className="bi bi-plus-circle me-2"></i>
                        Nuevo Producto
                    </Button>

                </Col>

            </Row>

            <CuadroBusquedas
                textoBusqueda={textoBusqueda}
                manejarCambioBusqueda={(e) =>
                    setTextoBusqueda(e.target.value)
                }
            />

            <TablaProductos
                productos={productosFiltrados}
                categorias={categorias}
                cargando={cargando}
                abrirModalEdicion={abrirModalEdicion}
                abrirModalEliminacion={abrirModalEliminacion}
                generarPDFProducto={generarPDFProducto}
            />

            <ModalRegistroProducto
                mostrarModal={mostrarModal}
                setMostrarModal={setMostrarModal}
                nuevoProducto={nuevoProducto}
                manejoCambioInput={manejoCambioInput}
                manejoCambioArchivo={manejoCambioArchivo}
                agregarProducto={agregarProducto}
                categorias={categorias}
            />

            <ModalEdicionProducto
                mostrarModalEdicion={mostrarModalEdicion}
                setMostrarModalEdicion={setMostrarModalEdicion}
                productoEditar={productoEditar}
                setProductoEditar={setProductoEditar}
                actualizarProducto={() =>
                    actualizarProducto(productoEditar)
                }
                categorias={categorias}
            />

            <ModalEliminacionProducto
                mostrarModalEliminacion={mostrarModalEliminacion}
                setMostrarModalEliminacion={
                    setMostrarModalEliminacion
                }
                productoAEliminar={productoAEliminar}
                eliminarProducto={() =>
                    eliminarProducto(productoAEliminar.id_producto)
                }
            />

        </Container>
    );
};

export default Productos;