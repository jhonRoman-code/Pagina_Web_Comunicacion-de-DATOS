document.getElementById("vlsmForm").addEventListener("submit", e => e.preventDefault());

// Eventos de los botones
document.getElementById("btnAgregar").addEventListener("click", agregarCampos);
document.getElementById("btnCalcular").addEventListener("click", calcularVLSM);

function agregarCampos() {
  const cont = document.getElementById("cantidadSubredes").value;
  const zona = document.getElementById("listaHosts");

  zona.innerHTML = "";
  if (!cont || cont < 1) return;

  for (let i = 1; i <= cont; i++) {
    zona.innerHTML += `
      <div class="input-group hosts-mini-container">
        <label>Hosts requeridos en Subred ${i}</label>
        <input type="number" class="hosts hosts-mini" min="1" required />
      </div>`;
  }
}

function ipToNum(ip) {
  return ip.split('.').reduce((a, b) => (a << 8) + parseInt(b), 0);
}

function numToIp(num) {
  return [24, 16, 8, 0].map(shift => (num >> shift) & 255).join('.');
}

function cidrToMask(cidr) {
  let mask = (0xffffffff << (32 - cidr)) >>> 0;
  return numToIp(mask);
}

function calcularVLSM() {
  const ipBase = document.getElementById("ipBase").value;
  const cidrBase = parseInt(document.getElementById("cidrBase").value);
  const hosts = [...document.querySelectorAll('.hosts')].map(h => parseInt(h.value));

  if (!ipBase || !cidrBase || hosts.some(h => !h)) {
    alert("Completa todos los campos");
    return;
  }

  const subredes = hosts
    .map((h, i) => ({ id: i + 1, necesarios: h }))
    .sort((a, b) => b.necesarios - a.necesarios);

  let ipActual = ipToNum(ipBase);
  const tabla = document.querySelector('#tablaResultados tbody');
  tabla.innerHTML = "";

  subredes.forEach(s => {

    let bits = Math.ceil(Math.log2(s.necesarios + 2));
    let cidr = 32 - bits;
    let bloque = Math.pow(2, bits);

    let ipRed = ipActual;
    let primer = ipRed + 1;
    let ultimo = ipRed + bloque - 2;
    let broadcast = ipRed + bloque - 1;

    tabla.innerHTML += `
      <tr>
        <td>${s.id}</td>
        <td>${s.necesarios}</td>
        <td>${bloque - 2}</td>
        <td>${numToIp(ipRed)}</td>
        <td>${numToIp(primer)}</td>
        <td>${numToIp(ultimo)}</td>
        <td>${numToIp(broadcast)}</td>
        <td>${cidrToMask(cidr)}</td>
        <td>/${cidr}</td>
      </tr>`;

    ipActual = broadcast + 1;
  });
}
