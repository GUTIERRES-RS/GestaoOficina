require('dotenv').config();
const selfsigned = require('selfsigned');
const fs = require('fs');
const path = require('path');
const net = require('net');

// --- Configurações Centralizadas ---
// Puxa as informações do .env ou usa os valores padrão
const env_ip = process.env.SSL_IP || process.env.DB_HOST || 'localhost';
const SSL_IP = typeof env_ip === 'string' ? env_ip.trim() : env_ip;
const SSL_O = (process.env.SSL_O || 'Gestão Oficina CA').trim();
const SSL_OU = (process.env.SSL_OU || 'Gestão Oficina SC').trim();
const SSL_DAYS = process.env.SSL_DAYS ? parseInt(process.env.SSL_DAYS, 10) : 365;
const SSL_KEY_SIZE = process.env.SSL_KEY_SIZE ? parseInt(process.env.SSL_KEY_SIZE, 10) : 2048;
const CERTS_DIR = path.join(__dirname, 'certs');

if (!fs.existsSync(CERTS_DIR)) {
    fs.mkdirSync(CERTS_DIR);
}

// Atributos do Certificado
const attrs = [
    { name: 'commonName', value: SSL_IP }
];

if (SSL_O !== '<Não faz parte do certificado>') {
    attrs.push({ name: 'O', value: SSL_O });
}

if (SSL_OU !== '<Não faz parte do certificado>') {
    attrs.push({ name: 'OU', value: SSL_OU });
}

// Determinar se SSL_IP é um IP ou um DNS (ex: localhost)
const isIp = net.isIP(SSL_IP) !== 0;

const options = {
    days: SSL_DAYS,
    keySize: SSL_KEY_SIZE,
    extensions: [{
        name: 'subjectAltName',
        altNames: [{
            type: isIp ? 7 : 2, // 7 = IP, 2 = DNS
            [isIp ? 'ip' : 'value']: SSL_IP
        }]
    }]
};


(async () => {
    try {
        console.log(`⏳ Gerando certificado para o IP/Host: ${SSL_IP}...`);

        const pems = await selfsigned.generate(attrs, options);

        fs.writeFileSync(path.join(CERTS_DIR, 'privkey.pem'), pems.private);
        fs.writeFileSync(path.join(CERTS_DIR, 'fullchain.pem'), pems.cert);

        console.log('✅ Certificados autoassinados gerados com sucesso na pasta "certs"');
        console.log(`📌 Nome comum (CN): \t${SSL_IP}`);
        console.log(`📌 O (Organização): \t${SSL_O}`);
        console.log(`📌 OU (Unidade Org.): \t${SSL_OU}`);
        console.log(`📌 Validade: \t\t${SSL_DAYS} dias`);
    } catch (error) {
        console.error('❌ Falha ao gerar certificados:', error);
    }
})();
