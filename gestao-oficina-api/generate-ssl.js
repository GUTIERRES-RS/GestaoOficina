const selfsigned = require('selfsigned');
const fs = require('fs');
const path = require('path');

const certsDir = path.join(__dirname, 'certs');

if (!fs.existsSync(certsDir)) {
    fs.mkdirSync(certsDir);
}

(async () => {
    try {
        const pems = await selfsigned.generate([{ name: 'commonName', value: '192.168.2.107' }], { 
            days: 365, 
            keySize: 2048,
            extensions: [{
                name: 'subjectAltName',
                altNames: [{
                    type: 7, // IP
                    ip: '192.168.2.107'
                }]
            }]
        });

        fs.writeFileSync(path.join(certsDir, 'privkey.pem'), pems.private);
        fs.writeFileSync(path.join(certsDir, 'fullchain.pem'), pems.cert);
        console.log('✅ Certificados autoassinados gerados com sucesso na pasta "certs"');
    } catch (error) {
        console.error('Falha ao gerar certificados:', error);
    }
})();
