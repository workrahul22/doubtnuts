const express = require("express");
const mongodb = require("mongodb");
const PDFDocument = require('pdfkit');
const fs = require("fs");
const bodyParser = require('body-parser');

mongodb.connect("mongodb://localhost:27017", (err, client) => {
    if(err){
        console.log("Error Connection to the database");
        process.exit(0);
    }

    console.log("Successfully connected to the mongodb database");
    let db = client.db("doubtnuts_files");
    let bucket = new mongodb.GridFSBucket(db);

    let app = express();
    app.use(bodyParser.json());
    app.get('/download/:filename', (req,res) => {
        res.set('Content-Type',"application/pdf");
        let stream = bucket.openDownloadStreamByName(req.params.filename);
        stream.on("error", (err) => {
            console.log("Error: File not found");
            res.set('Content-Type',"application/json");
            res.json({
                status: "error",
                message: "File not Found"
            });
            return;
        });
        stream.pipe(res);
    });

    app.post('/generatePDF', (req,res) => {
        let parameters = req.body;
        let filename = "Doubtnuts_" + new Date().valueOf().toString();
        let doc = generatePDF(parameters);
        console.log("PDF file generated successfully");
        doc.pipe(bucket.openUploadStream(filename))
        .on('error', (error) => {
            console.log("Error uploading Document please try again");
            res.json({
                status:"Error",
                message: "Error uploading PDF file please try again"
            });
        })
        .on('finish', () => {
            console.log("Document upload successfull");
            res.json({
                status: "success",
                message: "Uploaded successfully",
                fileURL: `http://localhost:5000/download/${filename}`
            });
        });
    })

    app.listen(5000, "0.0.0.0", () => {
        console.log("Server started listening on port 5000");
    });
});

function generatePDF(parameters) {
    const doc = new PDFDocument();
    doc
        .fontSize(25)
        .text("DoubtNuts");

    let keys = Object.keys(parameters);
    for(let i=0;i<keys.length;i++){
        doc.text(`  ${keys[i]}    :   ${parameters[keys[i]]}`);
    }
    doc.end();
    doc.pipe(fs.createWriteStream("doubtnuts.pdf"));
    return doc;
}
