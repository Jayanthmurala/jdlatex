const express = require('express');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const app = express();

app.use(express.json({ limit: '10mb' }));
app.use(express.text({ limit: '10mb' }));
app.get('/', (req, res) => {
  res.send('LaTeX to PDF API is running');
  res.json({ status: 'ok', message: 'LaTeX compiler service is running' });
});

app.post('/compile', async (req, res) => {
  try {
    const latexCode = req.body.latex || req.body;
    
    if (!latexCode) {
      return res.status(400).json({ error: 'No LaTeX code provided' });
    }

    // For Vercel deployment, we need to inform users that LaTeX compilation
    // is not supported in serverless environments
    if (process.env.VERCEL) {
      return res.status(200).json({
        message: "LaTeX compilation is not supported in Vercel's serverless environment.",
        info: "This API endpoint requires LaTeX to be installed, which is not available on Vercel. Consider using a different hosting provider that supports Docker or custom runtime environments."
      });
    }

    const timestamp = Date.now();
    // Use /tmp for production or os.tmpdir() for Vercel and local development
    const tempDir = path.join(process.env.VERCEL ? require('os').tmpdir() : '/tmp', `latex-${timestamp}`);
    const texFile = path.join(tempDir, 'main.tex');
    const pdfFile = path.join(tempDir, 'main.pdf');

    // Create temp directory
    fs.mkdirSync(tempDir, { recursive: true });
    fs.writeFileSync(texFile, latexCode);

    // Compile LaTeX using pdflatex
    exec(`pdflatex -interaction=nonstopmode -output-directory=${tempDir} ${texFile}`, 
      (error, stdout, stderr) => {
        if (error && !fs.existsSync(pdfFile)) {
          fs.rmSync(tempDir, { recursive: true, force: true });
          return res.status(500).json({ 
            error: 'LaTeX compilation failed',
            details: stderr || error.message 
          });
        }

        // Send PDF
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=output.pdf');
        
        const pdfStream = fs.createReadStream(pdfFile);
        pdfStream.pipe(res);
        
        pdfStream.on('end', () => {
          fs.rmSync(tempDir, { recursive: true, force: true });
        });
      }
    );

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'LaTeX compiler service is running' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`LaTeX compiler running on port ${PORT}`);
});
