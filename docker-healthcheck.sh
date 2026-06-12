#!/bin/sh
set -e

PASS=0
FAIL=0
RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
NC='\033[0m'

check_container() {
    local name=$1
    local status=$(docker inspect --format='{{.State.Status}}' "$name" 2>/dev/null || echo "not-found")
    local health=$(docker inspect --format='{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' "$name" 2>/dev/null || echo "none")

    if [ "$status" = "running" ]; then
        if [ "$health" = "healthy" ] || [ "$health" = "none" ]; then
            echo -e "  ${GREEN}✓${NC} $name  (status=$status, health=$health)"
            PASS=$((PASS + 1))
        else
            echo -e "  ${RED}✗${NC} $name  (status=$status, health=$health)"
            FAIL=$((FAIL + 1))
        fi
    else
        echo -e "  ${RED}✗${NC} $name  (status=$status)"
        FAIL=$((FAIL + 1))
    fi
}

check_endpoint() {
    local name=$1
    local url=$2
    local expected=$3
    local code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "$url" 2>/dev/null || echo "000")

    if [ "$code" = "$expected" ]; then
        echo -e "  ${GREEN}✓${NC} $name  (HTTP $code)"
        PASS=$((PASS + 1))
    else
        echo -e "  ${RED}✗${NC} $name  (expected $expected, got $code)"
        FAIL=$((FAIL + 1))
    fi
}

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Docker Stack Health Check"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo -e "${CYAN}Container Status:${NC}"
check_container "typescript-restful-api-mysql"
check_container "typescript-restful-api-prometheus"
check_container "typescript-restful-api-grafana"
check_container "typescript-restful-api-loki"
check_container "typescript-restful-api-tempo"
check_container "typescript-restful-api-alloy"
check_container "typescript-restful-api"

echo ""
echo -e "${CYAN}HTTP Endpoints:${NC}"
check_endpoint "Express /api/v1/healthz" "http://localhost:3030/api/v1/healthz" "200"
check_endpoint "Prometheus /-/ready" "http://localhost:9090/-/ready" "200"
check_endpoint "Grafana /api/health" "http://localhost:4000/api/health" "200"
check_endpoint "Loki /ready" "http://localhost:3100/ready" "200"
check_endpoint "Tempo /ready" "http://localhost:3200/ready" "200"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "Result: ${GREEN}$PASS passed${NC}, ${RED}$FAIL failed${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

[ "$FAIL" -eq 0 ]
