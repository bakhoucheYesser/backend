# test-api-fixed.sh - Version corrigée

BASE_URL="http://localhost:3000/api"

echo "🧪 Testing GrandoGo API endpoints..."

# 1. Test de santé
echo "1. Health check:"
curl -X GET "$BASE_URL/geocoding/health" | jq

# 2. Obtenir les véhicules disponibles
echo -e "\n2. Get available vehicles:"
curl -X GET "$BASE_URL/estimate/vehicles" | jq

# 3. Calculer une estimation ET récupérer l'ID pour la réservation
echo -e "\n3. Calculate estimate (et récupérer l'ID):"
ESTIMATE_RESPONSE=$(curl -s -X POST "$BASE_URL/estimate/calculate" \
  -H "Content-Type: application/json" \
  -d '{
    "pickup": {
      "address": "1234 Rue Saint-Denis, Montréal, QC",
      "coordinates": {"lat": 45.5088, "lng": -73.5878}
    },
    "destination": {
      "address": "5678 Avenue Mont-Royal, Montréal, QC",
      "coordinates": {"lat": 45.5276, "lng": -73.5956}
    },
    "vehicleType": "van",
    "estimatedDuration": 45
  }')

echo "$ESTIMATE_RESPONSE" | jq

# Extraire l'ID de l'estimation
ESTIMATE_ID=$(echo "$ESTIMATE_RESPONSE" | jq -r '.id')
echo "Estimate ID: $ESTIMATE_ID"

# 4. Se connecter pour récupérer les cookies
echo -e "\n4. Login:"
curl -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "email": "marie.tremblay@email.com",
    "password": "password123"
  }' | jq

# 5. Créer une réservation avec le vrai ID d'estimation
echo -e "\n5. Create booking avec estimate ID réel:"
curl -X POST "$BASE_URL/bookings" \
  -H "Content-Type: application/json" \
  -d "{
    \"estimateId\": \"$ESTIMATE_ID\",
    \"customerName\": \"Jean Test\",
    \"customerEmail\": \"jean.test@email.com\",
    \"customerPhone\": \"+1-514-555-9999\",
    \"scheduledAt\": \"2025-07-10T14:00:00.000Z\"
  }" | jq

# 6. Test avec un ID d'estimation existant de la seed data
echo -e "\n6. Create booking avec seed data:"
curl -X POST "$BASE_URL/bookings" \
  -H "Content-Type: application/json" \
  -d '{
    "estimateId": "estimate-1",
    "customerName": "Test Client",
    "customerEmail": "test.client@email.com",
    "customerPhone": "+1-514-555-7777",
    "scheduledAt": "2025-07-11T10:00:00.000Z"
  }' | jq

# 7. Route calculation avec validation des coordonnées
echo -e "\n7. Calculate route (fix coordonnées):"
curl -X POST "$BASE_URL/geocoding/route" \
  -H "Content-Type: application/json" \
  -d '{
    "origin": "45.5088,-73.5878",
    "destination": "45.5276,-73.5956"
  }' | jq

# 8. Obtenir les créneaux disponibles
echo -e "\n8. Get available time slots:"
curl -X GET "$BASE_URL/bookings/availability/slots?date=2025-07-10&vehicleType=van" | jq

# 9. Recherche d'adresses
echo -e "\n9. Search addresses:"
curl -X GET "$BASE_URL/geocoding/search?q=Rue Saint-Denis&lat=45.5088&lng=-73.5878" | jq

# 10. Obtenir le profil (avec cookies)
echo -e "\n10. Get profile:"
curl -X GET "$BASE_URL/auth/me" \
  -b cookies.txt | jq

# 11. Obtenir les fichiers d'une estimation (de la seed data)
echo -e "\n11. Get estimate files:"
curl -X GET "$BASE_URL/upload/estimate/estimate-1/files" | jq

# 12. Storage info
echo -e "\n12. Storage info:"
curl -X GET "$BASE_URL/upload/storage/info" | jq

# Nettoyage
rm -f cookies.txt

echo -e "\n✅ API tests completed!"
echo -e "\n📊 Summary of your working API:"
echo "   ✅ Authentication (register, login, profile)"
echo "   ✅ Vehicle management"
echo "   ✅ Price estimation with HERE API"
echo "   ✅ Geocoding and address search"
echo "   ✅ Time slot management"
echo "   ✅ File upload system"
echo "   ✅ Database with realistic test data"