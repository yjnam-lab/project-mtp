import os
import time
import requests
import pandas as pd
from dotenv import load_dotenv

# 1. 환경 변수(.env) 로드
load_dotenv()
API_KEY = os.getenv("GOOGLE_MAPS_API_KEY")

if not API_KEY:
    print("❌ .env 파일에서 GOOGLE_MAPS_API_KEY를 찾을 수 없습니다.")
    exit()

# 2. Places API (New) 호출 설정
url = "https://places.googleapis.com/v1/places:searchText"

headers = {
    "Content-Type": "application/json",
    "X-Goog-Api-Key": API_KEY,
    "X-Goog-FieldMask": (
        "nextPageToken,"          # ★ [수정 1] 다음 페이지 조회를 위한 토큰 추가
        "places.id,"
        "places.displayName,"
        "places.formattedAddress,"
        "places.rating,"
        "places.userRatingCount,"
        "places.priceLevel,"
        "places.location,"
        "places.reviews,"
        "places.dineIn,"
        "places.takeout,"
        "places.delivery,"
        "places.servesBeer,"
        "places.outdoorSeating,"
        "places.editorialSummary"
    )
}

rows = []
next_page_token = None
target_count = 100  # ★ [수정 2] 목표 수집 개수 설정 (100개)

print("📡 멕시코시티 타코 가게 100개 수집 시작...\n")

# ★ [수정 3] 100개가 채워질 때까지 반복 호출하는 루프
while len(rows) < target_count:
    payload = {
        "textQuery": "taqueria tacos Mexico City",
        "languageCode": "es",
        "pageSize": 20,  # 1회 최대 호출 개수인 20개 지정
        "locationBias": {
            "circle": {
                "center": {"latitude": 19.4326, "longitude": -99.1332},
                "radius": 10000.0  # 100개를 채우기 위해 반경을 10km로 다소 확장
            }
        }
    }
    
    # 이전 요청에서 받은 다음 페이지 토큰이 있다면 요청 파라미터에 포함
    if next_page_token:
        payload["pageToken"] = next_page_token

    response = requests.post(url, headers=headers, json=payload)
    
    if response.status_code != 200:
        print(f"❌ API 호출 실패 (코드: {response.status_code})")
        print(response.text)
        break

    data = response.json()
    places = data.get("places", [])
    
    # 데이터 가공
    for place in places:
        reviews = place.get("reviews", [])
        review_snippets = []
        for r in reviews[:2]:
            t = r.get("originalText", {}).get("text", r.get("text", {}).get("text", ""))
            if t:
                review_snippets.append(t.replace("\n", " "))
        sample_reviews_str = " | ".join(review_snippets)
        editorial_summary = place.get("editorialSummary", {}).get("text", "N/A")
        
        rows.append({
            "place_id": place.get("id"),
            "name": place.get("displayName", {}).get("text", "N/A"),
            "address": place.get("formattedAddress", "N/A"),
            "rating": place.get("rating", None),
            "user_rating_count": place.get("userRatingCount", 0),
            "price_level": place.get("priceLevel", "UNSPECIFIED"),
            "dine_in": place.get("dineIn", None),
            "takeout": place.get("takeout", None),
            "delivery": place.get("delivery", None),
            "serves_beer": place.get("servesBeer", None),
            "outdoor_seating": place.get("outdoorSeating", None),
            "editorial_summary": editorial_summary,
            "latitude": place.get("location", {}).get("latitude"),
            "longitude": place.get("location", {}).get("longitude"),
            "sample_reviews": sample_reviews_str
        })
        
        # 100개가 채워지면 즉시 중단
        if len(rows) >= target_count:
            break

    print(f"현재 {len(rows)}개 수집 완료...")

    # 다음 페이지 토큰 확인
    next_page_token = data.get("nextPageToken")
    if not next_page_token:
        print("더 이상 불러올 데이터가 없습니다.")
        break
        
    # 구글 API 토큰 생성 대기시간 (안정적인 호출을 위해 1~2초 대기)
    time.sleep(1.5)

# 3. CSV 파일 및 README.md 저장
df = pd.DataFrame(rows)
csv_file_name = "mexico_tacos_sample.csv"
df.to_csv(csv_file_name, index=False, encoding="utf-8-sig")

readme_content = f"""# 🌮 Mexico City Taco Places Dataset Analysis

Google Places API (New)를 활용하여 수집한 멕시코시티 타코 매장 데이터셋 프로젝트입니다.

## 📁 프로젝트 파일 구조
- `fetch_tacos_dataframe.py`: Google Places API 데이터 수집 스크립트
- `mexico_tacos_sample.csv`: 수집된 데이터셋 (총 {len(df)}개 수집됨)
- `.env`: API 키 보안 파일 (Git 제외)
- `.gitignore`: 보안 및 가상환경 파일 트래킹 제외 설정

## 📊 데이터셋 명세서 (Data Dictionary)

| 컬럼명 | 데이터 타입 | 설명 | 비고 / 값 예시 |
| :--- | :--- | :--- | :--- |
| `place_id` | String | Google Maps 장소 고유 식별자 | Primary Key (`ChIJ...`) |
| `name` | String | 타코 매장 상호명 | `El Vilsito` |
| `address` | String | 전체 도로명 주소 | `Petén 248, CDMX` |
| `rating` | Float | 평균 구글 별점 | `1.0 ~ 5.0` |
| `user_rating_count` | Integer | 총 평가/리뷰 작성 수 | 인지도 지표 (`12450`) |
| `price_level` | String | 가격대 구분 등급 | `PRICE_LEVEL_INEXPENSIVE` |
| `dine_in` | Boolean | 매장 내 식사 가능 여부 | `True` / `False` |
| `takeout` | Boolean | 포장 가능 여부 | `True` / `False` |
| `delivery` | Boolean | 배달 가능 여부 | `True` / `False` |
| `serves_beer` | Boolean | 맥주 판매 여부 | `True` / `False` |
| `outdoor_seating` | Boolean | 야외 좌석/테라스 유무 | `True` / `False` |
| `editorial_summary` | String | 구글 제공 매장 한 줄 요약 설명 | `"Popular spot for Tacos al Pastor"` |
| `latitude` | Float | 위도 (Latitude) | `19.398` |
| `longitude` | Float | 경도 (Longitude) | `-99.157` |
| `sample_reviews` | String | 상위 사용자 리뷰 샘플 | 파이프 `\|` 기호로 구분 |
"""

with open("README.md", "w", encoding="utf-8") as f:
    f.write(readme_content)

print(f"\n✅ 총 {len(df)}개 수집 성공!")
print(f"📁 CSV 저장 완료: {csv_file_name}")
print(f"📝 README.md 명세서 갱신 완료!")