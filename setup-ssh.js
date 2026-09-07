const fs = require('fs');
const { Client } = require('ssh2');

const pubKeyPath = process.env.USERPROFILE + '\\.ssh\\id_rsa_erp.pub';
const pubKey = fs.readFileSync(pubKeyPath, 'utf8');

const conn = new Client();
conn.on('ready', () => {
  console.log('Client :: ready');
  const cmd = `mkdir -p ~/.ssh && echo "${pubKey.trim()}" >> ~/.ssh/authorized_keys && chmod 700 ~/.ssh && chmod 600 ~/.ssh/authorized_keys`;
  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code, signal) => {
      console.log('Stream :: close :: code: ' + code + ', signal: ' + signal);
      conn.end();
    }).on('data', (data) => {
      console.log('STDOUT: ' + data);
    }).stderr.on('data', (data) => {
      console.log('STDERR: ' + data);
    });
  });
}).connect({
  host: '192.168.100.2',
  port: 22,
  username: 'uzcategui',
  password: 'uzcategui'
});
