const express = require("express");
const path = require("path");
const cors = require("cors");
const fs = require("fs");

const app = express();
const PORT = 8080;

app.use(express.json());
app.use(cors());

//Las siguientes lineas son para leer la API y actulizarla

app.get("/api/futbolistas", (req, res) => {
  res.sendFile(path.join(__dirname, "../api.json"));
});

app.get("/api/futbolistas/:id", (req, res) => {
  const { id } = req.params;

  try {
    const filePath = path.join(__dirname, "../api.json");
    const futbolistas = require(filePath);

    const futbolista = futbolistas.find((f) => f.id === parseInt(id));

    if (!futbolista) {
      res.status(404).json({ message: "Futbolista no encontrado" });
      return;
    }

    res.status(200).json(futbolista);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener el futbolista" });
  }
});

app.put("/api/futbolistas/:id/votes", (req, res) => {
  const { id } = req.params;

  fs.readFile(path.join(__dirname, "../api.json"), "utf8", (err, data) => {
    if (err) {
      console.error(err);
      res.status(500).json({ message: "Error al leer el archivo api.json" });
      return;
    }

    try {
      const futbolistas = JSON.parse(data);

      const futbolista = futbolistas.find((f) => f.id === parseInt(id));

      if (!futbolista) {
        res.status(404).json({ message: "Futbolista no encontrado" });
        return;
      }

      futbolista.votes = futbolista.votes ? futbolista.votes + 1 : 1;

      fs.writeFile(
        path.join(__dirname, "../api.json"),
        JSON.stringify(futbolistas),
        "utf8",
        (err) => {
          if (err) {
            console.error(err);
            res
              .status(500)
              .json({ message: "Error al escribir en el archivo api.json" });
            return;
          }
          res.status(200).json({
            message: `Voto actualizado para el futbolista con ID ${id}`,
          });
        }
      );
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ message: "Error al procesar los datos del archivo api.json" });
    }
  });
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto: ${PORT}`);
});