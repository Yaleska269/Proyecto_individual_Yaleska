import React from "react";
import { Table, Button } from "react-bootstrap";

const TablaCategorias = ({
    categorias,
    abrirModalEdicion,
    abrirModalEliminacion,
    generarPDFCategoria
}) => {

    return (

        <Table striped bordered hover responsive>

            <thead style={{ backgroundColor: "#ea3f86" }}>

                <tr className="text-dark">
                    <th>ID</th>
                    <th>Nombre</th>
                    <th>Descripción</th>
                    <th className="text-center">Acciones</th>
                </tr>

            </thead>

            <tbody>

                {categorias.map((categoria) => (

                    <tr key={categoria.id_categoria}>

                        <td>{categoria.id_categoria}</td>

                        <td>{categoria.nombre_categoria}</td>

                        <td>{categoria.descripcion_categoria}</td>

                        <td className="text-center">

                            <Button
                                variant="warning"
                                size="sm"
                                className="m-1"
                                onClick={() => abrirModalEdicion(categoria)}
                            >
                                <i className="bi bi-pencil-square"></i>
                            </Button>

                            <Button
                                variant="danger"
                                size="sm"
                                className="m-1"
                                onClick={() => abrirModalEliminacion(categoria)}
                            >
                                <i className="bi bi-trash"></i>
                            </Button>

                            <Button
                                variant="outline-primary"
                                size="sm"
                                className="m-1"
                                onClick={() => generarPDFCategoria(categoria)}
                            >
                                <i className="bi bi-file-earmark-pdf"></i>
                            </Button>

                            <Button
                                variant="outline-success"
                                size="sm"
                                onClick={() => copiarCategoria(categoria)}
                                title="Copiar al portapapeles"
                            >
                                <i className="bi bi-clipboard"></i>
                            </Button>

                        </td>

                    </tr>

                ))}

            </tbody>

        </Table>
    );
};

export default TablaCategorias;