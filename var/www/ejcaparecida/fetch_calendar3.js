const http = require('http');

async function main() {
  const loginData = new URLSearchParams();
  loginData.append('username', 'ejcaparecida');
  loginData.append('password', 'Ejc10anos!');
  
  const res1 = await fetch('http://127.0.0.1:3210/api/login', {
    method: 'POST',
    body: loginData,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    redirect: 'manual'
  });
  
  const cookies = res1.headers.get('set-cookie');
  console.log("Cookies:", cookies);
  
  const res2 = await fetch('http://127.0.0.1:3210/admin/calendario', {
    headers: { 'Cookie': cookies }
  });
  
  const html = await res2.text();
  console.log("HTML length:", html.length);
  
  const match = html.match(/<article class="event-item compact-item admin-event-row">.*?<\/article>/g);
  if (match) {
    console.log("Found rows:", match.length);
    console.log("First row HTML:");
    console.log(html.substring(0, 1000));
  } else {
    console.log("No rows found. HTML snippet:");
    console.log(html.substring(html.indexOf('Eventos cadastrados'), html.indexOf('Eventos cadastrados') + 1000));
  }
}

main().catch(console.error);
