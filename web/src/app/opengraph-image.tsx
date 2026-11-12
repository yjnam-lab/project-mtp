// 링크 미리보기 이미지(카카오톡·슬랙 등). 빌드 때 한 번 만들어짐
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const alt = "Paris Étoile — Bien placé ? 숙소의 가치, 주변의 별이 말해 줍니다.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// 파일 읽기는 모듈 바깥에서 한 번만(빌드 때 정적 이미지로 만들어지도록)
const font = (file: string) => readFile(join(process.cwd(), "node_modules/pretendard/dist/public/static", file));
const [bold, light, photo] = await Promise.all([
  font("Pretendard-Bold.otf"),
  font("Pretendard-ExtraLight.otf"),
  readFile(join(process.cwd(), "public/intro/1.jpg")),
]);
const bg = `data:image/jpeg;base64,${photo.toString("base64")}`;

export default async function Image() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", background: "#111111" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={bg} alt="" width={1200} height={715} style={{ position: "absolute", top: -40, left: 0, objectFit: "cover" }} />
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            display: "flex",
            background: "linear-gradient(to top, rgba(0,0,0,0.88), rgba(0,0,0,0.15) 75%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "56px 76px",
            color: "#ffffff",
          }}
        >
          <div style={{ display: "flex", fontFamily: "Pretendard", fontWeight: 700, fontSize: 34 }}>Paris Étoile</div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", width: 72, height: 6, background: "#d0102b", marginBottom: 28 }} />
            <div style={{ display: "flex", fontFamily: "Pretendard", fontWeight: 700, fontSize: 112, lineHeight: 1 }}>
              Bien placé ?
            </div>
            <div style={{ display: "flex", fontFamily: "Pretendard", fontWeight: 200, fontSize: 40, marginTop: 24 }}>
              숙소의 가치, 주변의 별이 말해 줍니다.
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Pretendard", data: bold, style: "normal", weight: 700 },
        { name: "Pretendard", data: light, style: "normal", weight: 200 },
      ],
    },
  );
}
