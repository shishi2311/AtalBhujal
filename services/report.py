import os
import io
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import pandas as pd
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
import logging
from typing import Optional

logging.basicConfig(level=logging.INFO)


def _safe_to_numeric(series):
    return pd.to_numeric(series, errors="coerce")


def _format_change(new, old):
    try:
        diff = new - old
        sign = "+" if diff > 0 else ""
        pct = (diff / old * 100) if old not in (0, None, pd.NA) else None
        if pct is None or pd.isna(pct):
            return f"{sign}{diff:.2f}"
        return f"{sign}{diff:.2f} ({sign}{pct:.1f}%)"
    except Exception:
        return "N/A"


def generate_report_pdf(
    df: pd.DataFrame,
    state: str,
    district: str,
    block: str,
    out_dir: str = "reports",
    include_charts: bool = True,
    include_trends: bool = True,
    include_comparisons: bool = True,
    include_recommendations: bool = True,
) -> str:
    """
    Generate a polished PDF groundwater report for a given state, district, and block.
    Optional flags:
      - include_charts: include trend chart image
      - include_trends: include textual trend analysis
      - include_comparisons: include YoY comparison (latest vs previous year)
      - include_recommendations: include short recommendations (rule-based + NL)
    """
    try:
        # Defensive copy
        working = df.copy()
        # Normalize columns expected by the code
        for col in ["state", "district", "block", "season", "year", "water_level_m_bgl"]:
            if col not in working.columns:
                raise ValueError(f"Expected column '{col}' not found in dataframe")

        # Filter data (case-insensitive) and handle location codes
        data = working[
            (working["state"].str.split('_').str[0].str.lower() == state.lower()) &
            (working["district"].str.split('_').str[0].str.lower() == district.lower()) &
            (working["block"].str.split('_').str[0].str.lower() == block.lower())
        ]
    except Exception as e:
        logging.error(f"Error filtering data: {e}")
        raise ValueError(f"Error filtering data: {e}")

    if data.empty:
        logging.error(f"No data found for {state} - {district} - {block}")
        raise ValueError(f"No data found for {state} - {district} - {block}")

    # Use original casing for headings
    first_row = data.iloc[0]
    state_disp = first_row["state"]
    district_disp = first_row["district"]
    block_disp = first_row["block"]

    try:
        os.makedirs(out_dir, exist_ok=True)
        filename = f"report_{district_disp}_{block_disp}.pdf"
        filepath = os.path.join(out_dir, filename)
    except Exception as e:
        logging.error(f"Error creating output directory or file path: {e}")
        raise ValueError(f"Error creating output directory or file path: {e}")

    # Prepare numeric columns
    try:
        data = data.copy()
        data["water_level_m_bgl"] = _safe_to_numeric(data["water_level_m_bgl"])
        # Ensure year is numeric
        data["year"] = _safe_to_numeric(data["year"]).astype("Int64")
    except Exception as e:
        logging.error(f"Error coercing numeric columns: {e}")
        raise ValueError(f"Error coercing numeric columns: {e}")

    # Prepare chart buffer (conditionally)
    img_buf: Optional[io.BytesIO] = None
    if include_charts:
        try:
            plt.figure(figsize=(10, 6))
            plt.grid(True, linestyle='--', alpha=0.7)

            # Plot both seasons if present
            plotted_any = False
            for season, color in zip(["Pre-monsoon", "Post-monsoon"], ["#d62728", "#2ca02c"]):
                df_season = data[data["season"].str.strip().str.lower() == season.lower()]
                if not df_season.empty:
                    grouped = df_season.groupby("year")["water_level_m_bgl"].agg(['mean', 'min', 'max']).sort_index()
                    # Drop NA years
                    grouped = grouped.dropna(subset=['mean'])
                    if grouped.empty:
                        continue
                    plt.plot(grouped.index.astype(int), grouped['mean'], marker='o', label=f"{season} (Mean)",
                             color=color, linewidth=2, markersize=8)
                    plt.fill_between(grouped.index.astype(int), grouped['min'], grouped['max'],
                                     alpha=0.2, color=color, label=f"{season} (Range)")
                    plotted_any = True

            if not plotted_any:
                # create a small placeholder plot to avoid exceptions later
                plt.text(0.5, 0.5, 'No chartable data available', horizontalalignment='center', verticalalignment='center')

            plt.xlabel("Year", fontsize=12, fontweight='bold')
            plt.ylabel("Water Level (meters below ground level)", fontsize=12, fontweight='bold')
            plt.title(f"Groundwater Level Trends: {block_disp}, {district_disp}",
                      fontsize=14, fontweight='bold', pad=20)

            plt.legend(bbox_to_anchor=(1.05, 1), loc='upper left')
            plt.gca().invert_yaxis()  # Deeper levels shown lower on chart
            plt.grid(True, which='both', linestyle='--', alpha=0.6)
            plt.xticks(rotation=45)
            plt.tight_layout()

            img_buf = io.BytesIO()
            plt.savefig(img_buf, format='png', dpi=300, bbox_inches='tight')
            plt.close()
            img_buf.seek(0)
        except Exception as e:
            logging.warning(f"Chart generation failed, continuing without chart: {e}")
            img_buf = None

    # Build PDF
    try:
        doc = SimpleDocTemplate(filepath, pagesize=A4)
        styles = getSampleStyleSheet()
        # small style for mono/notes
        small = ParagraphStyle('small', parent=styles['Normal'], fontSize=9)
        elements = []

        # Title
        elements.append(Paragraph(f"Groundwater Report – {district_disp}, {block_disp}", styles["Title"]))
        elements.append(Spacer(1, 8))

        # Metadata
        meta = f"State: {state_disp}   District: {district_disp}   Block: {block_disp}   Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}"
        elements.append(Paragraph(meta, styles["Normal"]))
        elements.append(Spacer(1, 12))

        # Key Statistics Section
        elements.append(Paragraph("<b>Summary Statistics</b>", styles["Heading2"]))
        elements.append(Spacer(1, 6))

        # Calculate overall statistics (ignoring NaNs)
        safe_series = data["water_level_m_bgl"].dropna()
        stats_overall = {
            "Deepest (max m bgl)": f"{safe_series.max():.2f}" if not safe_series.empty else "-",
            "Shallowest (min m bgl)": f"{safe_series.min():.2f}" if not safe_series.empty else "-",
            "Average (m bgl)": f"{safe_series.mean():.2f}" if not safe_series.empty else "-",
            "Median (m bgl)": f"{safe_series.median():.2f}" if not safe_series.empty else "-"
        }

        stats_table = [["Metric", "Water Level (m bgl)"]]
        for metric, value in stats_overall.items():
            stats_table.append([metric, value])

        table = Table(stats_table, colWidths=[240, 200])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.lightgrey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ]))
        elements.append(table)
        elements.append(Spacer(1, 12))

        # Seasonal Analysis
        elements.append(Paragraph("<b>Seasonal Analysis</b>", styles["Heading2"]))
        elements.append(Spacer(1, 6))

        table_data = [["Season", "Latest Year", "Mean Level", "Min Level", "Max Level", "Measurements"]]
        for season in ["Pre-monsoon", "Post-monsoon"]:
            df_season = data[data["season"].str.strip().str.lower() == season.lower()]
            if not df_season.empty:
                # drop NaN levels
                df_season = df_season.dropna(subset=["water_level_m_bgl"])
                if df_season.empty:
                    table_data.append([season, "-", "-", "-", "-", "0"])
                    continue
                last_year = int(df_season["year"].max())
                last_year_data = df_season[df_season["year"] == last_year]
                table_data.append([
                    season,
                    str(last_year),
                    f"{last_year_data['water_level_m_bgl'].mean():.2f}",
                    f"{last_year_data['water_level_m_bgl'].min():.2f}",
                    f"{last_year_data['water_level_m_bgl'].max():.2f}",
                    str(len(last_year_data))
                ])
            else:
                table_data.append([season, "-", "-", "-", "-", "-"])

        table = Table(table_data, colWidths=[100, 80, 80, 80, 80, 80])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.lightgrey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ]))
        elements.append(table)
        elements.append(Spacer(1, 12))

        # Trend Analysis
        if include_trends:
            elements.append(Paragraph("<b>Trend Analysis</b>", styles["Heading2"]))
            elements.append(Spacer(1, 6))

            years = data["year"].dropna().unique()
            if len(years) == 0:
                trend_text = "No year information available to compute trends."
            else:
                latest_year = int(data["year"].max())
                earliest_year = int(data["year"].min())
                num_years = latest_year - earliest_year + 1 if latest_year and earliest_year else 0
                trend_text = (
                    f"Data Period: {earliest_year} to {latest_year}\n"
                    f"Number of Years: {num_years}\n"
                    f"Total Measurements: {len(data.dropna(subset=['water_level_m_bgl']))}\n"
                )

                # Add a short numeric trend summary (slope approximation)
                try:
                    # compute mean per year across seasons
                    mean_by_year = data.dropna(subset=["water_level_m_bgl"]).groupby("year")["water_level_m_bgl"].mean().sort_index()
                    if len(mean_by_year) >= 2:
                        # simple slope
                        slope = mean_by_year.iloc[-1] - mean_by_year.iloc[0]
                        slope_text = f"Mean water level change from {int(mean_by_year.index[0])} to {int(mean_by_year.index[-1])}: {slope:.2f} m bgl."
                    else:
                        slope_text = "Insufficient years to compute slope-based trend."
                    trend_text += slope_text
                except Exception:
                    trend_text += "Trend computation not available."

            elements.append(Paragraph(trend_text.replace("\n", "<br/>"), styles["Normal"]))
            elements.append(Spacer(1, 8))

        # Insert chart image if available and requested
        if include_charts and img_buf is not None:
            try:
                elements.append(Paragraph("<b>Trend Chart</b>", styles["Heading3"]))
                elements.append(Spacer(1, 6))
                elements.append(Image(img_buf, width=450, height=250))
                elements.append(Spacer(1, 12))
            except Exception as e:
                logging.warning(f"Failed to insert chart image in PDF: {e}")

        # Year-over-Year Comparison (latest vs previous year)
        if include_comparisons:
            elements.append(Paragraph("<b>Year-over-Year Comparison (Latest vs Previous Year)</b>", styles["Heading2"]))
            elements.append(Spacer(1, 6))
            try:
                by_year = data.dropna(subset=["water_level_m_bgl"]).groupby("year")["water_level_m_bgl"].agg(['mean', 'min', 'max'])
                by_year = by_year.sort_index()
                if len(by_year) >= 2:
                    latest = by_year.iloc[-1]
                    prev = by_year.iloc[-2]
                    change_mean = latest['mean'] - prev['mean']
                    change_text = [
                        ["Metric", str(int(by_year.index[-1])), str(int(by_year.index[-2])), "Change (m & %)" ],
                        ["Mean", f"{latest['mean']:.2f}", f"{prev['mean']:.2f}", _format_change(latest['mean'], prev['mean'])],
                        ["Min", f"{latest['min']:.2f}", f"{prev['min']:.2f}", _format_change(latest['min'], prev['min'])],
                        ["Max", f"{latest['max']:.2f}", f"{prev['max']:.2f}", _format_change(latest['max'], prev['max'])]
                    ]
                else:
                    change_text = [["Metric", "Year", "Value", "Note"], ["Mean", "-", "-", "Insufficient data for YoY comparison"]]

                table = Table(change_text, colWidths=[140, 100, 100, 140])
                table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.lightgrey),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.black),
                    ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
                    ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
                ]))
                elements.append(table)
                elements.append(Spacer(1, 12))
            except Exception as e:
                logging.warning(f"YoY comparison failed: {e}")
                elements.append(Paragraph("Year-over-Year comparison not available due to insufficient data.", small))
                elements.append(Spacer(1, 8))

        # Recommendations (placed immediately after Trend Analysis)
        if include_recommendations:
            elements.append(Paragraph("<b>Recommendations</b>", styles["Heading2"]))
            elements.append(Spacer(1, 6))
            try:
                recs = []
                # Basic rule-based checks
                mean_by_year = data.dropna(subset=["water_level_m_bgl"]).groupby("year")["water_level_m_bgl"].mean().sort_index()
                if len(mean_by_year) >= 2:
                    latest_year = int(mean_by_year.index[-1])
                    prev_year = int(mean_by_year.index[-2])
                    latest_mean = mean_by_year.iloc[-1]
                    prev_mean = mean_by_year.iloc[-2]
                    # Decline means larger m bgl (deeper below ground) — i.e., groundwater falling
                    if latest_mean - prev_mean > 0.25:
                        recs.append(f"- Mean groundwater level has worsened by {_format_change(latest_mean, prev_mean)} since {prev_year}. Consider implementing groundwater recharge measures (check dams, infiltration wells).")
                    elif latest_mean - prev_mean < -0.25:
                        recs.append(f"- Mean groundwater level has improved by {_format_change(latest_mean, prev_mean)} since {prev_year}. Continue monitoring and sustaining recharge practices.")
                    else:
                        recs.append(f"- Mean groundwater level is relatively stable YoY ({_format_change(latest_mean, prev_mean)}). Continue periodic monitoring.")

                    # Check for consistent multi-year decline (3+ years)
                    if len(mean_by_year) >= 3:
                        last3 = mean_by_year.tail(3)
                        if last3.is_monotonic_increasing:  # increasing m bgl => declining water table
                            recs.append("- Groundwater shows a consistent decline over the past 3 years. Immediate recharge and demand-management measures recommended.")
                else:
                    recs.append("- Insufficient yearly mean data to make strong recommendations. Consider improving monitoring density.")

                # Seasonal recovery check (pre vs post monsoon)
                try:
                    pre = data[data["season"].str.strip().str.lower() == "pre-monsoon"].dropna(subset=["water_level_m_bgl"])
                    post = data[data["season"].str.strip().str.lower() == "post-monsoon"].dropna(subset=["water_level_m_bgl"])
                    if not pre.empty and not post.empty:
                        # compare latest year averages for pre vs post
                        pre_latest_year = int(pre["year"].max())
                        post_latest_year = int(post["year"].max())
                        # If data aligns on same year, compute recovery
                        if pre_latest_year == post_latest_year:
                            pre_mean = pre[pre["year"] == pre_latest_year]["water_level_m_bgl"].mean()
                            post_mean = post[post["year"] == post_latest_year]["water_level_m_bgl"].mean()
                            recovery = pre_mean - post_mean  # positive means post-monsoon shallower (good)
                            if recovery < 0.5:
                                recs.append("- Post-monsoon recovery is weak (<0.5 m). Strengthen recharge practices and watershed measures.")
                            else:
                                recs.append("- Post-monsoon recovery appears adequate. Maintain recharge & conservation measures.")
                except Exception:
                    # Non-fatal
                    pass

                # Natural language summary (concise)
                nl_summary = []
                try:
                    if 'mean_by_year' in locals() and len(mean_by_year) >= 2:
                        trend_direction = mean_by_year.iloc[-1] - mean_by_year.iloc[0]
                        if trend_direction > 0.5:
                            nl_summary.append("Overall, the groundwater levels indicate a notable declining trend over the recorded period.")
                        elif trend_direction < -0.5:
                            nl_summary.append("Overall, groundwater levels show a notable improvement across the period.")
                        else:
                            nl_summary.append("Overall, groundwater levels are relatively stable over the recorded period.")
                except Exception:
                    pass

                # Add recommendations into PDF
                if recs:
                    for r in recs:
                        elements.append(Paragraph(r, styles["Normal"]))
                        elements.append(Spacer(1, 4))
                if nl_summary:
                    elements.append(Spacer(1, 6))
                    elements.append(Paragraph("<b>Summary:</b> " + " ".join(nl_summary), styles["Normal"]))
                elements.append(Spacer(1, 12))
            except Exception as e:
                logging.warning(f"Recommendations generation failed: {e}")
                elements.append(Paragraph("Recommendations not available.", small))
                elements.append(Spacer(1, 8))

        # Build the document
        doc.build(elements)
        return filepath
    except Exception as e:
        logging.error(f"Error building PDF: {e}")
        raise ValueError(f"Error building PDF: {e}")
