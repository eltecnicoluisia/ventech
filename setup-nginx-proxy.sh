#!/bin/bash
# Script para configurar Nginx via API de Nginx Proxy Manager
# URL Admin: http://192.168.100.2:81
# Default admin: admin@example.com / changeme (primera vez)

# Obtener token
TOKEN=$(curl -s -X POST http://localhost:81/api/tokens \
  -H "Content-Type: application/json" \
  -d '{"identity":"admin@example.com","secret":"changeme"}' | python3 -c "import sys,json; print(json.load(sys.stdin).get('token',''))")

if [ -z "$TOKEN" ]; then
  # Intentar con credenciales comunes
  TOKEN=$(curl -s -X POST http://localhost:81/api/tokens \
    -H "Content-Type: application/json" \
    -d '{"identity":"admin@ventech.local","secret":"admin123"}' | python3 -c "import sys,json; print(json.load(sys.stdin).get('token',''))")
fi

echo "TOKEN: $TOKEN"

# Crear proxy para ERP Web (ventech / IP)
curl -s -X POST http://localhost:81/api/nginx/proxy-hosts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "domain_names": ["ventech","192.168.100.2"],
    "forward_scheme": "http",
    "forward_host": "erp_web",
    "forward_port": 3000,
    "access_list_id": 0,
    "certificate_id": 0,
    "ssl_forced": false,
    "caching_enabled": false,
    "block_exploits": true,
    "advanced_config": "",
    "locations": [
      {
        "path": "/api",
        "forward_scheme": "http",
        "forward_host": "erp_api",
        "forward_port": 3001,
        "advanced_config": ""
      }
    ],
    "http2_support": false,
    "allow_websocket_upgrade": true
  }' | python3 -m json.tool
