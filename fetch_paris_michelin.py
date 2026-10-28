import googlemaps
import pandas as pd
import os
from dotenv import load_dotenv

# 그 아래 기존 코드...
load_dotenv()

# 1. 본인의 Google Places API Key 입력 (발급받은 키를 여기에 넣으세요)
# 1. 환경 변수(.env) 로드
load_dotenv()
API_KEY = os.getenv("GOOGLE_MAPS_API_KEY")

# Google Maps 클라이언트 초기화
gmaps = googlemaps.Client(key=API_KEY)

def fetch_paris_michelin_restaurants():
    print("🇫🇷 프랑스 파리 미슐랭 식당 데이터 수집을 시작합니다...")
    
    # 2. 파리 중심 좌표 (위도 48.8566, 경도 2.3522) 및 검색 쿼리
    # 파리 시내 반경 약 15km 이내 검색
    query = "Michelin star restaurant in Paris, France"
    paris_location = (48.8566, 2.3522)
    search_radius = 15000  # 15km
    
    # Places API - Text Search 요청
    places_result = gmaps.places(
        query=query, 
        location=paris_location, 
        radius=search_radius
    )
    
    michelin_list = []
    results = places_result.get('results', [])
    
    print(f"총 {len(results)}개의 검색 결과를 찾았습니다. 상세 정보를 가져옵니다...")
    
    for place in results:
        place_id = place['place_id']
        
        # Place Details API로 정밀 정보 수집 (위경도, 주소, 평점, 웹사이트 등)
        details = gmaps.place(
            place_id=place_id, 
            fields=['name', 'formatted_address', 'geometry', 'rating', 'user_ratings_total', 'website']
        ).get('result', {})
        
        michelin_list.append({
            'place_id': place_id,
            'name': details.get('name'),
            'address': details.get('formatted_address'),
            'latitude': details['geometry']['location']['lat'] if 'geometry' in details else None,
            'longitude': details['geometry']['location']['lng'] if 'geometry' in details else None,
            'rating': details.get('rating'),
            'reviews_count': details.get('user_ratings_total'),
            'website': details.get('website')
        })
    
    # DataFrame 변환 및 CSV 저장
    df = pd.DataFrame(michelin_list)
    df.to_csv("paris_michelin_restaurants.csv", index=False, encoding="utf-8-sig")
    print("✅ 데이터 수집 및 'paris_michelin_restaurants.csv' 저장 완료!")
    print(df.head())

if __name__ == "__main__":
    fetch_paris_michelin_restaurants()