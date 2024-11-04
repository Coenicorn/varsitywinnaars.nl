import express from "npm:express@5.0.1";

const app = express();

app.use(express.static("static"));

app.get("/:event/:index", (req, res) => {

    

});

app.listen(8000);