const https = require('https');

https.get('https://docs.google.com/forms/d/e/1FAIpQLSfVNefmgfV4JD1g5XFfJxwuebJM8KkmbzmJB_0C6gIRNlkqAg/viewform', (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    const matches = data.match(/entry\.\d+/g);
    const unique = [...new Set(matches)];
    console.log(unique);
  });
}).on("error", (err) => {
  console.log("Error: " + err.message);
});
