#!/bin/bash
# Tests avec vos UUIDs réels qui vont FONCTIONNER

BASE_URL="http://localhost:3000/api"

echo "🧪 Testing API with REAL UUIDs from your database..."

# 1. Test Booking avec UUID réel (Estimate de Marie)
echo "1. 🎫 Create booking with Marie's estimate:"
curl -X POST "$BASE_URL/bookings" \
  -H "Content-Type: application/json" \
  -d '{
    "estimateId": "cmcpn650s00053otl3vxnrq6j",
    "customerName": "Test Client Réel",
    "customerEmail": "test.real@email.com",
    "customerPhone": "+1-514-555-9999",
    "scheduledAt": "2025-07-12T14:00:00.000Z"
  }' | jq

echo -e "\n2. 🎫 Create booking with Jean's estimate:"
curl -X POST "$BASE_URL/bookings" \
  -H "Content-Type: application/json" \
  -d '{
    "estimateId": "cmcpn650u00073otlmhcyrkli",
    "customerName": "Autre Test Client",
    "customerEmail": "autre.test@email.com",
    "customerPhone": "+1-418-555-8888",
    "scheduledAt": "2025-07-13T10:00:00.000Z"
  }' | jq

echo -e "\n3. 🚗 Test complete flow: Estimate → Booking:"
# Créer une nouvelle estimation
NEW_ESTIMATE=$(curl -s -X POST "$BASE_URL/estimate/calculate" \
  -H "Content-Type: application/json" \
  -d '{
    "pickup": {
      "address": "2000 Rue Sainte-Catherine, Montréal, QC",
      "coordinates": {"lat": 45.5088, "lng": -73.5878}
    },
    "destination": {
      "address": "3000 Boulevard Saint-Laurent, Montréal, QC",
      "coordinates": {"lat": 45.5276, "lng": -73.5956}
    },
    "vehicleType": "pickup",
    "estimatedDuration": 25
  }')

echo "New estimate created:"
echo "$NEW_ESTIMATE" | jq

# Extraire l'ID
NEW_ESTIMATE_ID=$(echo "$NEW_ESTIMATE" | jq -r '.id')
echo -e "\nNew Estimate ID: $NEW_ESTIMATE_ID"

# Créer une réservation avec cette estimation
echo -e "\n4. 🎫 Create booking with new estimate:"
curl -X POST "$BASE_URL/bookings" \
  -H "Content-Type: application/json" \
  -d "{
    \"estimateId\": \"$NEW_ESTIMATE_ID\",
    \"customerName\": \"Nouveau Client\",
    \"customerEmail\": \"nouveau@email.com\",
    \"customerPhone\": \"+1-514-555-7777\",
    \"scheduledAt\": \"2025-07-14T15:00:00.000Z\"
  }" | jq

echo -e "\n5. 🔐 Test authentication flow:"
# Login
curl -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "email": "marie.tremblay@email.com",
    "password": "password123"
  }' | jq

# Get profile
echo -e "\n6. 👤 Get user profile:"
curl -X GET "$BASE_URL/auth/me" -b cookies.txt | jq

echo -e "\n7. 📋 Get available time slots:"
curl -X GET "$BASE_URL/bookings/availability/slots?date=2025-07-15&vehicleType=van" | jq

echo -e "\n8. 🏠 Search Quebec addresses:"
curl -X GET "$BASE_URL/geocoding/search?q=Rue Cartier Quebec&lat=46.8139&lng=-71.208" | jq

echo -e "\n9. 📁 Get files for estimate 1:"
curl -X GET "$BASE_URL/upload/estimate/cmcpn650s00053otl3vxnrq6j/files" | jq

echo -e "\n10. 📊 Storage info:"
curl -X GET "$BASE_URL/upload/storage/info" | jq

# Cleanup
rm -f cookies.txt

echo -e "\n🎉 ALL TESTS COMPLETED!"
echo -e "\n📋 Your working UUIDs:"
echo "   - Marie's estimate: cmcpn650s00053otl3vxnrq6j"
echo "   - Jean's estimate:  cmcpn650u00073otlmhcyrkli"
echo "   - Sophie's estimate: cmcpn650v00093otl6dxxd645"
echo "   - Anonymous estimate: cmcpn650v000b3otlps4fdcrb"

echo -e "\n🌐 Next steps:"
echo "   - Keep Prisma Studio open: http://localhost:5555"
echo "   - Start your server: npm run start:dev"
echo "   - Run these tests in another terminal"