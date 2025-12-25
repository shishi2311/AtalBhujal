from fastapi import FastAPI, Query, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
import pandas as pd
import os
from functools import lru_cache
import logging
from services.qa import build_index, search as qa_search
from services.report import generate_report_pdf
from pydantic import BaseModel
from fastapi.staticfiles import StaticFiles

logging.basicConfig(level=logging.INFO)

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:8080", "http://localhost:8080", "https://atal-bhujal.vercel.app"],  # ✅ your frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
class ReportRequest(BaseModel):
    state: str
    district: str
    block: str = ""
    reportType: str
    includeCharts: bool = True
    includeTrends: bool = True
    includeComparisons: bool = False
    includeRecommendations: bool = True

def clean_column(val):
    if isinstance(val, str):
        return val.split("_")[0]
    return val

# Optimized DataFrame loader
@lru_cache(maxsize=1)
def get_water_levels_df():
    logging.info("Loading groundwater CSV data...")
    df = pd.read_csv("data/atalbhujal_water_levels.csv")

    # Clean columns
    df["state"] = df["state"].apply(clean_column)
    df["district"] = df["district"].apply(clean_column)
    df["block"] = df["block"].apply(clean_column)

    return df


# Build KB index on startup
SECTIONS, VEC, MAT = build_index("kb")

@app.get("/")
def root():
    return {"message": "Welcome to Atal Bhujal Groundwater API"}

@app.get("/available-filters")
def get_available_filters():
    df = get_water_levels_df()

    # Cleaned raw rows to help frontend build dependent dropdowns
    raw_rows = df[["state", "district", "block"]].dropna().to_dict(orient="records")

    return {
        "states": sorted(df["state"].dropna().unique().tolist()),
        "districts": sorted(df["district"].dropna().unique().tolist()),
        "blocks": sorted(df["block"].dropna().unique().tolist()),
        "years": sorted(df["year"].dropna().unique().tolist()),
        "seasons": sorted(df["season"].dropna().unique().tolist()),

        # 🔥 Needed for dependent dropdown logic
        "raw": raw_rows
    }

# Serve report files from /reports folder
app.mount("/reports", StaticFiles(directory="reports"), name="reports")
@app.get("/report")
def build_report(state: str, district: str, block: str):
    """
    Build a PDF report and return it as a file download.
    """
    logging.info(f"/report called with state={state}, district={district}, block={block}")
    df = get_water_levels_df()
    try:
        pdf_path = generate_report_pdf(df, state, district, block, out_dir="reports")
    except ValueError as e:
        logging.error(f"Report generation error: {e}")
        return {"message": str(e)}
    if not os.path.exists(pdf_path):
        logging.error("Failed to generate report PDF file.")
        return {"message": "Failed to generate report"}
    filename = os.path.basename(pdf_path)
    logging.info(f"Returning PDF file: {filename}")
    return FileResponse(pdf_path, media_type="application/pdf", filename=filename)

@app.get("/ask")
def ask(query: str = Query(..., min_length=3), k: int = 5, top: bool = False):
    """
    Semantic-ish search over local markdown KB. Returns top-k snippets with source.
    If 'top' is True, returns only the best matching answer.
    """
    results = qa_search(query, k=k)
    if not results:
        return {"message": "No matches found"}
    if top:
        return {"query": query, "result": results[0]}
    return {"query": query, "results": results}

from fastapi import status
from typing import Optional

@app.get(
    "/water-level",
    responses={
        404: {
            "description": "No water level data found",
            "content": {"application/json": {"example": {"detail": "No water level data found"}}},
        }
    },
)
def get_water_level(
    state: str = Query(None),
    district: str = Query(None),
    block: str = Query(None),
    year: int = Query(None),
    season: str = Query(None),
):
    data = get_water_levels_df().copy()

    if state:
        data = data[data["state"].str.lower().str.contains(state.lower())]

    if district:
        data = data[data["district"].str.lower().str.contains(district.lower())]

    if block:
        data = data[data["block"].str.lower().str.contains(block.lower())]

    if year:
        data = data[data["year"] == year]

    if season:
        data = data[data["season"].str.lower().str.contains(season.lower())]

    if data.empty:
        raise HTTPException(status_code=404, detail="No water level data found")

    records = data.to_dict(orient="records")

# Normalize column name so frontend can use "water_level"
    for r in records:
        if "water_level_m_bgl" in r:
            r["water_level"] = r["water_level_m_bgl"]

    return records


class AskRequest(BaseModel):
    query: str
    k: int = 5



@app.post("/ask_ai")
async def ask_ai(payload: AskRequest):
    """
    AI assistant endpoint for Ask page.
    Uses QA search system and returns best matching snippet.
    """
    try:
        results = qa_search(payload.query, k=payload.k)

        if not results:
            return {"answer": "I could not find information related to your query."}

        # result structure from qa_search is usually:
        # { "text": "...", "score": ..., "source": ... }
        best = results[0]

        # Normalize output
        answer = best.get("text") or best.get("snippet") or str(best)

        return {
            "query": payload.query,
            "answer": answer,
            "source": best.get("source", "knowledge_base")
        }

    except Exception as e:
        logging.error(f"ask_ai error: {e}")
        raise HTTPException(status_code=500, detail=str(e))




# ✅ NEW: POST endpoint for frontend integration
@app.post("/generate_report")
async def generate_report(payload: ReportRequest):
    """
    API endpoint called by the frontend (Report.tsx) to generate a groundwater report.
    Accepts JSON body and returns a success message with PDF path.
    """
    try:
        df = get_water_levels_df()

        pdf_path = generate_report_pdf(
    df,
    payload.state,
    payload.district,
    payload.block,
    out_dir="reports",
    include_charts=payload.includeCharts,
    include_trends=payload.includeTrends,
    include_comparisons=payload.includeComparisons,
    include_recommendations=payload.includeRecommendations,
)

        return {
        "message": "Report generated successfully!",
        "path": pdf_path
    }


    except Exception as e:
        logging.error(f"Error generating report: {e}")
        raise HTTPException(status_code=500, detail=str(e))
