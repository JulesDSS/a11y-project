
const express = require('express');
const { exec } = require('child_process');
const fs = require('fs');
const openai = require('openai');

openai.apiKey = "api-key-here";

const app = express();
const PORT = 3000;

app.get('/', (req, res)=>{
    res.status(200);
    res.sendFile('/Users/jdesimone/Documents/hackathon/a11y-project/public/index.html');
});

app.use(express.json());

app.post('/analyze', (req, res) => {
  const url = req.body.url;
  // Ejecuta Lighthouse y guarda el reporte como JSON
  exec(`lighthouse ${url} --output json --output-path report.json`, (error, stdout, stderr) => {
    if (error) {
      return res.status(500).send(`Error ejecutando Lighthouse: ${stderr}`);
    }

    // Leer y analizar el reporte JSON
    const data = fs.readFileSync('report.json');
    const report = JSON.parse(data);

    // Construye el prompt para OpenAI
    const accessibilityScore = report.categories.accessibility.score * 100;
    const accessibilityIssues = report.audits;
    let message = `La página web ha sido evaluada para accesibilidad y se ha obtenido un puntaje de ${accessibilityScore}. Aquí están algunos problemas identificados y para los que necesitamos recomendaciones para resolver:\n`;

    for (const [key, value] of Object.entries(accessibilityIssues)) {
      if (value.score && value.score < 1) {
        message += `- ${value.title}: ${value.description}\n`;
      }
    }

    // Solicitar recomendaciones a OpenAI
    openai.Completion.create({
      engine: 'davinci-codex',
      prompt: message,
      max_tokens: 150,
    })
    .then(response => {
      res.send(response.choices[0].text.trim());
    })
    .catch(error => {
      res.status(500).send(`Error comunicándose con OpenAI: ${error.message}`);
    });
  });
});


app.listen(PORT, (error) =>{
    if(!error)
        console.log("Server is Successfully Running,and App is listening on port "+ PORT)
    else 
        console.log("Error occurred, server can't start", error);
    }
);
