import os
import glob
import pandas as pd

# 1. D:\Proj_Data 폴더 내 DENUE 원본 CSV 파일 자동 탐색
csv_files = glob.glob("*.csv")
target_files = [f for f in csv_files if "mexico_tacos" not in f and "cleaned" not in f]

if not target_files:
    print("❌ DENUE CSV 파일을 찾을 수 없습니다.")
    exit()

target_file = target_files[0]
print(f"📂 분석 대상 DENUE 파일: {target_file}")

# 2. 스페인어 특수문자 인코딩(ISO-8859-1 / latin1) 적용하여 파일 로드
try:
    df_raw = pd.read_csv(target_file, encoding="iso-8859-1", low_memory=False)
except Exception:
    df_raw = pd.read_csv(target_file, encoding="latin1", low_memory=False)

print(f"📊 멕시코시티 전체 사업체 수: {len(df_raw):,}개")

# 3. 타코 매장(SCIAN 코드: 722513) 추출
if "codigo_act" in df_raw.columns:
    df_tacos = df_raw[df_raw["codigo_act"].astype(str).str.startswith("722513")].copy()
else:
    df_tacos = df_raw[df_raw["nom_estab"].str.contains("taco|taquer", case=False, na=False)].copy()

print(f"🌮 추출된 타코 매장 수: {len(df_tacos):,}개")

# 4. 주요 컬럼 추출 및 영문 필드명 매핑 (다양한 DENUE ID/주소 컬럼 대응)
column_mapping = {
    # ID 관련 컬럼 대응
    "clelee": "denue_id",
    "id": "denue_id",
    "id_estab": "denue_id",
    
    # 상호명/기본정보
    "nom_estab": "name",
    "raz_social": "business_name",
    "codigo_act": "scian_code",
    "nombre_act": "scian_name",
    "per_ocu": "employee_size",
    
    # 주소/위치
    "nom_vial": "street",
    "num_exterior": "street_number",
    "num_ext": "street_number",
    "colonia": "colonia",
    "cod_postal": "zipcode",
    "municipio": "alcaldia",
    "entidad": "state",
    "latitud": "latitude",
    "longitud": "longitude"
}

existing_cols = [c for c in column_mapping.keys() if c in df_tacos.columns]
df_filtered = df_tacos[existing_cols].rename(columns=column_mapping).copy()

# 5. 안전한 도로명 주소(Full Address) 생성
def get_col_series(df, col_name):
    if col_name in df.columns:
        return df[col_name].fillna("").astype(str)
    return pd.Series("", index=df.index)

street = get_col_series(df_filtered, "street")
street_num = get_col_series(df_filtered, "street_number")
colonia = get_col_series(df_filtered, "colonia")
alcaldia = get_col_series(df_filtered, "alcaldia")

df_filtered["full_address"] = (
    street + " " + street_num + ", " + colonia + ", " + alcaldia + ", CDMX"
).str.replace(r"\s+", " ", regex=True).str.strip()

# 6. 정제된 CSV 저장
output_file = "cdmx_tacos_denue_cleaned.csv"
df_filtered.to_csv(output_file, index=False, encoding="utf-8-sig")

print(f"\n✅ 정제 완료! 파일 저장: {output_file}")

# 7. 안전한 샘플 출력 (존재하는 컬럼만 자동 선택)
preview_cols = [c for c in ["denue_id", "name", "alcaldia", "employee_size", "full_address"] if c in df_filtered.columns]
print("\n📋 추출된 데이터 샘플 (상위 5개):")
print(df_filtered[preview_cols].head(5).to_string())