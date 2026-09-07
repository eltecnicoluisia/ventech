const https = require('https');

const options = {
  hostname: 'www.bcv.org.ve',
  port: 443,
  path: '/',
  method: 'GET',
  rejectUnauthorized: false
};

const req = https.request(options, res => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => {
    // console.log(body);
    const match = body.match(/<div id="dolar".*?<strong>(.*?)<\/strong>/is);
    if (match) {
      console.log('USD:', match[1].trim().replace(',', '.'));
    } else {
      console.log('Not found');
    }
  });
});

req.on('error', error => {
  console.error(error);
});

req.end();
