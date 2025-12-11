// ========== CONFIGURACIÓN DE SUPABASE ==========
const SUPABASE_URL = 'https://ayeervdibczpykjsfdih.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5ZWVydmRpYmN6cHlranNmZGloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxMDk2MzIsImV4cCI6MjA3OTY4NTYzMn0.pBuCG75FatPHnvljJNEh__zsPFc25F8WtnJeB3njSNI';

// Función para hacer peticiones a Supabase
async function supabaseRequest(endpoint, method = 'GET', body = null) {
    const options = {
        method: method,
        headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`
        }
    };

    if (body) {
        options.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/${endpoint}`, options);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Error en la petición');
        }
        
        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Función para hashear password (simple - en producción usa bcrypt)
function hashPassword(password) {
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
        const char = password.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return hash.toString(16);
}

let currentUser = '';

// ========== LOGIN & REGISTER ==========

// Toggle to Register Form
document.getElementById('openRegister').onclick = function(e) {
    e.preventDefault();
    document.getElementById('loginForm').classList.add('hidden');
    document.getElementById('registerForm').classList.remove('hidden');
    document.getElementById('loginAlert').style.display = 'none';
    document.getElementById('registerAlert').style.display = 'none';
};

// Toggle to Login Form
document.getElementById('openLogin').onclick = function(e) {
    e.preventDefault();
    document.getElementById('registerForm').classList.add('hidden');
    document.getElementById('loginForm').classList.remove('hidden');
    document.getElementById('loginAlert').style.display = 'none';
    document.getElementById('registerAlert').style.display = 'none';
};

// Login Function
document.getElementById('buttonLogin').onclick = async function() {
    const user = document.getElementById('loginUser').value.trim();
    const pass = document.getElementById('loginPass').value;
    const alert = document.getElementById('loginAlert');

    if (!user || !pass) {
        alert.className = 'alert error';
        alert.textContent = '❌ Please complete all fields';
        return;
    }

    this.textContent = 'Signing in...';
    this.disabled = true;

    const hashedPassword = hashPassword(pass);

    const result = await supabaseRequest(
        `users?username=eq.${user}&password=eq.${hashedPassword}&select=*`,
        'GET'
    );

    this.textContent = 'SIGN IN';
    this.disabled = false;

    if (result.success && result.data.length > 0) {
        currentUser = result.data[0].username;
        document.getElementById('userName').textContent = currentUser;
        document.getElementById('userAvatar').textContent = currentUser.charAt(0).toUpperCase();
        
        document.getElementById('loginContainer').classList.add('hidden');
        document.getElementById('calculatorApp').classList.remove('hidden');
        
        alert.style.display = 'none';
        
        document.getElementById('loginUser').value = '';
        document.getElementById('loginPass').value = '';
    } else {
        alert.className = 'alert error';
        alert.textContent = '❌ Invalid username or password';
    }
};

// Register Function
document.getElementById('buttonRegister').onclick = async function() {
    const user = document.getElementById('regUser').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const pass = document.getElementById('regPass').value;
    const alert = document.getElementById('registerAlert');

    if (!user || !email || !pass) {
        alert.className = 'alert error';
        alert.textContent = '❌ Please complete all fields';
        return;
    }

    if (!email.includes('@')) {
        alert.className = 'alert error';
        alert.textContent = '❌ Please enter a valid email';
        return;
    }

    if (pass.length < 6) {
        alert.className = 'alert error';
        alert.textContent = '❌ Password must be at least 6 characters';
        return;
    }

    if (user.length < 3) {
        alert.className = 'alert error';
        alert.textContent = '❌ Username must be at least 3 characters';
        return;
    }

    this.textContent = 'Creating account...';
    this.disabled = true;

    const hashedPassword = hashPassword(pass);

    const result = await supabaseRequest('users', 'POST', {
        username: user,
        email: email,
        password: hashedPassword
    });

    this.textContent = 'CREATE ACCOUNT';
    this.disabled = false;

    if (result.success) {
        alert.className = 'alert success';
        alert.textContent = '✅ Account created successfully!';
        
        document.getElementById('regUser').value = '';
        document.getElementById('regEmail').value = '';
        document.getElementById('regPass').value = '';
        
        setTimeout(() => {
            document.getElementById('registerForm').classList.add('hidden');
            document.getElementById('loginForm').classList.remove('hidden');
            alert.style.display = 'none';
        }, 1500);
    } else {
        alert.className = 'alert error';
        if (result.error.includes('unique') || result.error.includes('duplicate')) {
            alert.textContent = '❌ Username or email already exists';
        } else {
            alert.textContent = '❌ Error creating account. Please try again.';
        }
    }
};

// Logout Function
document.getElementById('logoutBtn').onclick = function() {
    currentUser = '';
    document.getElementById('calculatorApp').classList.add('hidden');
    document.getElementById('loginContainer').classList.remove('hidden');
    document.getElementById('results').classList.add('hidden');
    document.getElementById('loginUser').value = '';
    document.getElementById('loginPass').value = '';
};

// ========== SUBNET CALCULATOR FUNCTIONS ==========

// Convert IP to Long Integer
function ipToLong(ip) {
    const parts = ip.split('.');
    return parts.reduce((acc, octet) => (acc << 8) + parseInt(octet), 0) >>> 0;
}

// Convert Long Integer to IP
function longToIp(long) {
    return [
        (long >>> 24) & 255,
        (long >>> 16) & 255,
        (long >>> 8) & 255,
        long & 255
    ].join('.');
}

// Validate IP Address
function validateIP(ip) {
    const parts = ip.split('.');
    if (parts.length !== 4) return false;
    return parts.every(part => {
        const num = parseInt(part);
        return num >= 0 && num <= 255 && part === num.toString();
    });
}

// Convert IP to Binary
function ipToBinary(ip) {
    return ip.split('.').map(octet => {
        return parseInt(octet).toString(2).padStart(8, '0');
    }).join('.');
}

// Get Network Class
function getNetworkClass(firstOctet) {
    if (firstOctet >= 1 && firstOctet <= 126) return 'A';
    if (firstOctet >= 128 && firstOctet <= 191) return 'B';
    if (firstOctet >= 192 && firstOctet <= 223) return 'C';
    if (firstOctet >= 224 && firstOctet <= 239) return 'D (Multicast)';
    if (firstOctet >= 240 && firstOctet <= 255) return 'E (Reserved)';
    return 'Invalid';
}

// Get IP Type (Private/Public)
function getIPType(ip) {
    const parts = ip.split('.').map(Number);
    const first = parts[0];
    const second = parts[1];

    if (first === 10) return 'Private';
    if (first === 172 && second >= 16 && second <= 31) return 'Private';
    if (first === 192 && second === 168) return 'Private';
    if (first === 127) return 'Loopback';
    
    return 'Public';
}

// Get Network Type
function getNetworkType(cidr) {
    if (cidr === 32) return 'Host';
    if (cidr === 31) return 'Point-to-Point';
    if (cidr >= 24) return 'Small Network';
    if (cidr >= 16) return 'Medium Network';
    return 'Large Network';
}

// Update Pie Chart
function updatePieChart(usable, total) {
    const percentage = total > 0 ? (usable / total) * 100 : 0;
    const degrees = (percentage / 100) * 360;
    
    const pieChart = document.querySelector('.pie-chart');
    pieChart.style.setProperty('--usable-deg', degrees + 'deg');
    
    document.getElementById('pieValue').textContent = total.toLocaleString();
    document.getElementById('legendUsable').textContent = usable.toLocaleString();
}

// Update Bits Bars
function updateBitsBars(cidr) {
    const networkBits = cidr;
    const hostBits = 32 - cidr;
    
    const networkPercentage = (networkBits / 32) * 100;
    const hostPercentage = (hostBits / 32) * 100;
    
    document.getElementById('networkBitsBar').style.width = networkPercentage + '%';
    document.getElementById('hostBitsBar').style.width = hostPercentage + '%';
    
    document.getElementById('networkBitsValue').textContent = networkBits + ' bits';
    document.getElementById('hostBitsValue').textContent = hostBits + ' bits';
}

// Calculate Subnet - MEJORADO PARA SOPORTAR TODOS LOS CIDR (0-32)
document.getElementById('calculateBtn').onclick = function() {
    const ipAddress = document.getElementById('ipAddress').value.trim();
    const cidr = parseInt(document.getElementById('subnetMask').value);
    const alert = document.getElementById('calcAlert');

    // Validation
    if (!ipAddress || isNaN(cidr)) {
        alert.className = 'alert error';
        alert.textContent = '❌ Please enter both IP address and CIDR notation';
        return;
    }

    if (!validateIP(ipAddress)) {
        alert.className = 'alert error';
        alert.textContent = '❌ Invalid IP address format. Use format: xxx.xxx.xxx.xxx';
        return;
    }

    if (cidr < 0 || cidr > 32) {
        alert.className = 'alert error';
        alert.textContent = '❌ CIDR must be between 0 and 32';
        return;
    }

    alert.style.display = 'none';

    // Calculate subnet parameters
    const ipLong = ipToLong(ipAddress);
    const mask = cidr === 0 ? 0 : (0xFFFFFFFF << (32 - cidr)) >>> 0;
    const networkLong = (ipLong & mask) >>> 0;
    const broadcastLong = (networkLong | ~mask) >>> 0;
    
    // Calculate hosts
    const bitsHost = 32 - cidr;
    const totalHosts = cidr === 32 ? 1 : Math.pow(2, bitsHost);
    
    // Para CIDR 31 (punto a punto) y 32 (host único)
    let usableHosts, firstHostLong, lastHostLong;
    
    if (cidr === 32) {
        usableHosts = 1;
        firstHostLong = networkLong;
        lastHostLong = networkLong;
    } else if (cidr === 31) {
        usableHosts = 2;
        firstHostLong = networkLong;
        lastHostLong = broadcastLong;
    } else {
        usableHosts = totalHosts > 2 ? totalHosts - 2 : 0;
        firstHostLong = networkLong + 1;
        lastHostLong = broadcastLong - 1;
    }
    
    // Calculate subnets
    const firstOctet = parseInt(ipAddress.split('.')[0]);
    const networkClass = getNetworkClass(firstOctet);
    let defaultCIDR = 8;
    if (networkClass === 'B') defaultCIDR = 16;
    if (networkClass === 'C') defaultCIDR = 24;
    
    const bitsSR = cidr - defaultCIDR;
    const numSubredes = bitsSR > 0 ? Math.pow(2, bitsSR) : 1;
    const hostXSR = usableHosts;

    // Get network addresses
    const networkAddr = longToIp(networkLong);
    const broadcastAddr = longToIp(broadcastLong);
    const firstHost = longToIp(firstHostLong);
    const lastHost = longToIp(lastHostLong);
    const subnetMaskDecimal = longToIp(mask);
    const wildcardMask = longToIp(~mask >>> 0);

    // Update Visual Summary
    document.getElementById('vizNetworkAddr').textContent = networkAddr;
    document.getElementById('vizBroadcastAddr').textContent = broadcastAddr;
    
    if (cidr === 32) {
        document.getElementById('vizHostRange').textContent = networkAddr + ' (Single Host)';
    } else if (cidr === 31) {
        document.getElementById('vizHostRange').textContent = firstHost + ' - ' + lastHost + ' (P2P)';
    } else {
        document.getElementById('vizHostRange').textContent = firstHost + ' - ' + lastHost;
    }

    // Update Charts
    updatePieChart(usableHosts, totalHosts);
    updateBitsBars(cidr);

    // Display Basic Information
    document.getElementById('maskDecimal').textContent = subnetMaskDecimal;
    document.getElementById('cidrNotation').textContent = '/' + cidr;
    document.getElementById('wildcardMask').textContent = wildcardMask;
    document.getElementById('networkClass').textContent = 'Class ' + networkClass;

    // Display Network Addresses
    document.getElementById('networkAddr').textContent = networkAddr;
    document.getElementById('broadcastAddr').textContent = broadcastAddr;
    document.getElementById('firstHost').textContent = firstHost;
    document.getElementById('lastHost').textContent = lastHost;

    // Display Host Information
    document.getElementById('totalHosts').textContent = totalHosts.toLocaleString();
    document.getElementById('usableHosts').textContent = usableHosts.toLocaleString();
    document.getElementById('bitsSR').textContent = bitsSR >= 0 ? bitsSR : '0';
    document.getElementById('numSubredes').textContent = numSubredes.toLocaleString();

    // Display Advanced Information
    document.getElementById('bitsHost').textContent = bitsHost;
    document.getElementById('hostXSR').textContent = hostXSR.toLocaleString();
    document.getElementById('networkType').textContent = getNetworkType(cidr);
    document.getElementById('ipType').textContent = getIPType(ipAddress);

    // Display Binary Representation
    document.getElementById('ipBinary').textContent = ipToBinary(ipAddress);
    document.getElementById('maskBinary').textContent = ipToBinary(subnetMaskDecimal);
    document.getElementById('networkBinary').textContent = ipToBinary(networkAddr);

    // Show results
    document.getElementById('results').classList.remove('hidden');
    
    // Scroll to results
    setTimeout(() => {
        document.getElementById('results').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
};

// Allow Enter key to trigger login
document.getElementById('loginPass').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        document.getElementById('buttonLogin').click();
    }
});

// Allow Enter key to trigger register
document.getElementById('regPass').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        document.getElementById('buttonRegister').click();
    }
});

// Allow Enter key to trigger calculation
document.getElementById('subnetMask').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        document.getElementById('calculateBtn').click();
    }
});
