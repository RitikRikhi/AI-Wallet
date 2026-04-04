const { exec } = require('child_process');
const path = require('path');

/**
 * Service to bridge Node.js and the Python script.
 * Uses child_process.exec to pass arguments into python.
 */

function explainFraudWithRAG(reasonsArray) {
    return new Promise((resolve, reject) => {
        // Find python path, relative to the backend
        const pythonScriptPath = path.join(__dirname, '../../rag/rag.py');
        
        // Convert reasons to single string for commandline
        const reasonsString = reasonsArray.join(', ');

        if (!reasonsString) {
            return resolve("No suspicious reasons provided. Transaction is safe.");
        }

        // IMPORTANT: In windows or linux you might need "python3" or "python"
        // Since we are running locally on Windows we assume 'python'
        const command = `python "${pythonScriptPath}" "${reasonsString}"`;

        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`Python script error: ${error.message}`);
                return reject("Failed to generate explanation. Engine down.");
            }
            if (stderr) {
                // Warning logs from library
                console.warn(`Python STDERR: ${stderr}`);
            }
            // Strip any trailing newlines from output
            resolve(stdout.trim());
        });
    });
}

module.exports = { explainFraudWithRAG };
