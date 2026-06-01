import React from "react";
import {
    Modal,
    Button,
    Form,
} from "react-bootstrap";

const ModalEdicionProducto = ({
    mostrarModalEdicion,
    setMostrarModalEdicion,
    productoEditar,
    setProductoEditar,
    actualizarProducto,
    categorias,
}) => {

    if (!productoEditar) return null;

    return (
        <Modal
            show={mostrarModalEdicion}
            onHide={() => setMostrarModalEdicion(false)}
            centered
        >

            <Modal.Header closeButton>
                <Modal.Title>
                    Editar Producto
                </Modal.Title>
            </Modal.Header>

            <Modal.Body>

                <Form>

                    <Form.Group className="mb-3">

                        <Form.Label>
                            Nombre
                        </Form.Label>

                        <Form.Control
                            type="text"
                            value={productoEditar.nombre_producto || ""}
                            onChange={(e) =>
                                setProductoEditar({
                                    ...productoEditar,
                                    nombre_producto: e.target.value,
                                })
                            }
                        />

                    </Form.Group>

                    <Form.Group className="mb-3">

                        <Form.Label>
                            Categoría
                        </Form.Label>

                        <Form.Select
                            value={productoEditar.categoria_producto || ""}
                            onChange={(e) =>
                                setProductoEditar({
                                    ...productoEditar,
                                    categoria_producto:
                                        parseInt(e.target.value),
                                })
                            }
                        >

                            <option value="">
                                Seleccione
                            </option>

                            {categorias.map((c) => (
                                <option
                                    key={c.id_categoria}
                                    value={c.id_categoria}
                                >
                                    {c.nombre_categoria}
                                </option>
                            ))}

                        </Form.Select>

                    </Form.Group>

                    <Form.Group className="mb-3">

                        <Form.Label>
                            Precio
                        </Form.Label>

                        <Form.Control
                            type="number"
                            value={productoEditar.precio_venta || ""}
                            onChange={(e) =>
                                setProductoEditar({
                                    ...productoEditar,
                                    precio_venta: e.target.value,
                                })
                            }
                        />

                    </Form.Group>

                    <Form.Group className="mb-3">

                        <Form.Label>
                            Descripción
                        </Form.Label>

                        <Form.Control
                            as="textarea"
                            rows={3}
                            value={
                                productoEditar.descripcion_producto || ""
                            }
                            onChange={(e) =>
                                setProductoEditar({
                                    ...productoEditar,
                                    descripcion_producto:
                                        e.target.value,
                                })
                            }
                        />

                    </Form.Group>

                    {productoEditar?.url_imagen && (

                        <div className="text-center mb-3">

                            <img
                                src={productoEditar.url_imagen}
                                alt="producto"
                                style={{
                                    width: "120px",
                                    height: "120px",
                                    objectFit: "cover",
                                    borderRadius: "10px",
                                }}
                            />

                        </div>
                    )}

                    <Form.Group className="mb-3">

                        <Form.Label>
                            Cambiar Imagen
                        </Form.Label>

                        <Form.Control
                            type="file"
                            accept="image/*"
                            onChange={(e) =>
                                setProductoEditar({
                                    ...productoEditar,
                                    archivo: e.target.files[0],
                                })
                            }
                        />

                    </Form.Group>

                </Form>

            </Modal.Body>

            <Modal.Footer>

                <Button
                    variant="secondary"
                    onClick={() =>
                        setMostrarModalEdicion(false)
                    }
                >
                    Cancelar
                </Button>

                <Button
                    variant="warning"
                    onClick={actualizarProducto}
                >
                    Actualizar
                </Button>

            </Modal.Footer>

        </Modal>
    );
};

export default ModalEdicionProducto;