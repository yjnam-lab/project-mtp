import googlemaps
import pandas as pd
import os
import time  # next_page_token 호출 시 딜레이를 주기 위해 추가
from dotenv import load_dotenv

# 1. 환경 변수(.env) 로드
load_dotenv()
API_KEY = os.getenv("GOOGLE_MAPS_API_KEY")

# Google Maps 클라이언트 초기화
gmaps = googlemaps.Client(key=API_KEY)

def fetch_paris_michelin_restaurants():
    print("🇫🇷 프랑스 파리 미슐랭 식당 데이터 수집을 시작합니다...")
    
    query = "Michelin star restaurant in Paris, France"
    paris_location = (48.8566, 2.3522)
    search_radius = 15000  # 15km
    
    all_places = []
    
    # 1번째 페이지 요청
    places_result = gmaps.places(
        query=query, 
        location=paris_location, 
        radius=search_radius
    )
    all_places.extend(places_result.get('results', []))
    
    # 2페이지, 3페이지가 존재하는 경우 next_page_token으로 계속 가져오기 (최대 60개)
    while 'next_page_token' in places_result:
        page_token = places_result['next_page_token']
        
        # ⚠️ 중요: Google API 규칙상 token 발급 후 서버에서 활성화될 때까지 2초 대기 필수
        time.sleep(2)
        
        places_result = gmaps.places(
            query=query,
            location=paris_location,
            radius=search_radius,
            page_token=page_token
        )
        all_places.extend(places_result.get('results', []))
    
    michelin_list = []
    print(f"총 {len(all_places)}개의 검색 결과를 찾았습니다. 상세 정보를 가져옵니다...")
    
    for place in all_places:
        place_id = place['place_id']
        
        # Place Details API로 정밀 정보 수집
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