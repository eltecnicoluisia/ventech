docker compose -f ~/erp-platform/docker-compose.yml exec -T postgres psql -U erp_user -d erp_db -c 'SELECT id, code, name, stock, "priceUSD", "status" FROM "Product";'
