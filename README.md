# Field Shift — 5-County Iowa Data Ingestion

A Google Colab notebook for building a geographically stratified pilot dataset for the NASA Space Apps **Field Shift** challenge.

The notebook collects and prepares crop-history, soil, climate, yield, and market information for five Iowa counties. It also creates exploratory crop-rotation and crop-ranking outputs and contains an LSTM modelling workflow for later experimentation.

> **Current workflow status:** The notebook itself explicitly says not to train the LSTM yet. Run the data collection, preprocessing, and coverage audits first; inspect the resulting data before treating model outputs as valid.

---

## 1. Study area

The pilot covers five Iowa counties selected to represent different parts of the state:

| County | FIPS | SSURGO area | Representative point | Geographic context |
|---|---:|---|---|---|
| Lyon | 19119 | IA119 | Rock Rapids | Northwest Iowa Plains |
| Allamakee | 19005 | IA005 | Waukon | Paleozoic Plateau |
| Story | 19169 | IA169 | Nevada | Des Moines Lobe / central Iowa |
| Decatur | 19053 | IA053 | Leon | Southern Iowa Drift Plain |
| Lee | 19111 | IA111 | Fort Madison | Southern Iowa Drift Plain and Mississippi River alluvial valleys |

This is a **pilot sample**, not evidence that a model generalises to all Iowa or U.S. farms.

## 2. Data sources

The notebook uses the following external sources:

| Source | Data used | Role |
|---|---|---|
| USDA Cropland Data Layer (CDL) | Annual crop-type GeoTIFFs, 2015–2025 | Historical crop classification and sampled crop sequences |
| USDA NRCS SSURGO | Map-unit, component, and soil-horizon attributes | Soil characteristics and soil-feature joins |
| NASA POWER | Daily climate variables at one representative point per county | County-labelled climate time series |
| USDA NASS Quick Stats | County-level crop yield records where reported | Historical yield information |
| USDA AMS Market News | Iowa Daily Cash Grain Bids, report 2850 | Statewide / reporting-market price benchmark |

### Important source limitations

- NASA POWER values are queried at representative county-seat points. They are **not field-level measurements or county-wide averages**.
- SSURGO records describe mapped soil units, components, and horizons. They are **not laboratory measurements from each sampled field**.
- CDL classes are remotely sensed classifications and should not be treated as perfect ground truth.
- CDL 2024–2025 products are resampled to the earliest successfully downloaded county reference grid using nearest-neighbour resampling. This is a harmonisation choice, not a claim that source products have identical resolution or accuracy.
- NASS county/crop/year records may be missing. The notebook preserves missing values rather than silently imputing them.
- AMS report 2850 is a statewide/reporting-market benchmark. Do not present its prices as precise farm-gate or county-specific prices.

## 3. Main workflow

The notebook is organised into these stages:

1. **Install and configure** Python libraries, county metadata, years, sampling settings, and project folders.
2. **NASA POWER ingestion** — download daily climate records for each county's representative point.
3. **CDL ingestion** — download county-specific annual crop rasters for 2015–2025, with retry handling for selected failed downloads.
4. **CDL audit and sampling** — align annual rasters to a common county grid, sample up to 4,000 agricultural pixels per county, and build same-location crop histories.
5. **CDL class correction** — handle NoData, map CDL codes to crop names/classes, and audit annual coverage.
6. **SSURGO extraction and spatial join** — query soil data, associate sampled locations with soil map units, and derive soil attributes for the upper 0–30 cm.
7. **NASS yield ingestion** — query county-level yield records for selected crops; an API key is required.
8. **AMS market data** — optionally download Iowa Daily Cash Grain Bids using a MyMarketNews API key.
9. **Economic data preparation** — standardise yield and price data, calculate estimated gross revenue per acre where compatible records exist, and audit coverage.
10. **Master data preparation** — combine crop history, soil features, and climate summaries; engineer crop-rotation features.
11. **LSTM sequence preparation and training code** — build three-year historical sequences, use a county-level holdout split, scale features, and evaluate predictions. This modelling stage is present in the notebook but should not be run until the data audit is satisfactory.
12. **Crop screening and ranking** — create preliminary soil pH screening, crop-rotation scores, LSTM probability integration, and economic ranking outputs.
13. **Coverage audit and results bundle** — export a compact CSV/JSON results archive, excluding large CDL GeoTIFFs by default.

## 4. Requirements

The notebook is designed for **Google Colab**. Its initial installation cell installs:

```bash
pip install requests pandas numpy rasterio
```

Other cells install or import additional packages as needed, including:

- `geopandas`
- `shapely`
- `pyproj`
- `tensorflow`
- `scikit-learn`
- `matplotlib`
- `joblib`

Google Colab normally includes many scientific Python packages. If running outside Colab, you may need to install the missing dependencies manually and adapt the Google Colab file-download cells.

## 5. How to run

1. Open the `.ipynb` notebook in Google Colab.
2. Select **Runtime → Run all** only if you intend to execute the complete workflow and understand the optional API-key prompts. Otherwise, run cells in order by section.
3. Use a fresh Colab runtime if you want a clean run.
4. Allow the data-download cells to finish. CDL raster downloads and spatial processing can take time and use substantial storage.
5. When prompted, provide API keys only if you want the corresponding optional datasets:
   - **USDA NASS Quick Stats API key** — required for NASS yield queries.
   - **MyMarketNews API key** — optional for AMS report 2850.
6. If you do not provide an optional key, the corresponding notebook section is skipped or reports that the data is unavailable.
7. Inspect the coverage and missing-data audits before proceeding to model training.
8. Use the final results-bundle cell to download the processed outputs.

### API-key safety

- Enter keys through the notebook's `getpass` prompts rather than hardcoding them in cells.
- Do not commit API keys, tokens, or credentials to GitHub.
- If a key is accidentally exposed, revoke or rotate it.
- Review notebook outputs before sharing the notebook; clear outputs if they contain sensitive information.

## 6. Output locations

During a Colab run, the notebook creates:

```text
/content/field_shift_data/
├── raw/
│   ├── cdl/
│   ├── ssurgo/
│   └── nasa_power/
└── processed/
```

Examples of processed outputs created by the notebook include:

| Output | Description |
|---|---|
| `nasa_power_daily_all_counties.csv` | Combined daily NASA POWER data |
| `cdl_sampled_crop_class_shares.csv` | Sampled CDL crop/class shares |
| `cdl_sampled_pixel_crop_history.csv` | Same-location annual crop history |
| `pixel_soil_features.csv` | Soil features associated with sampled pixels |
| `crop_soil_history.csv` | Crop history joined to soil features |
| `soil_complete_crop_history.csv` | Records retained for locations with complete selected soil features |
| `nass_county_crop_yields.csv` | NASS yield data, if retrieved |
| `nass_annual_prices.csv` | Prepared annual NASS price data |
| `crop_yield_market_revenue.csv` | Yield-price integration and gross-revenue estimate |
| `field_shift_rotation_features.csv` | Engineered crop-rotation history |
| `lstm_confusion_matrix.csv` | LSTM confusion-matrix counts, if the model stage is run |
| `lstm_confusion_matrix_normalized.csv` | Normalised confusion matrix, if the model stage is run |
| `crop_knowledge_base_v1.csv` | Preliminary crop pH reference table |
| `soil_candidate_scores_v1.csv` | Preliminary soil pH screening |
| `crop_rotation_assessment_v1.csv` | Preliminary rotation assessment |
| `lstm_future_crop_probabilities.csv` | Future crop-class probabilities, if model stage is run |
| `field_shift_candidates_with_lstm.csv` | Candidate crops joined to LSTM probabilities |
| `field_shift_all_ranked_candidates_v1.csv` | Preliminary hybrid crop ranking |
| `field_shift_economic_rankings_v1.csv` | Economic ranking output |
| `field_shift_final_top3_v1.csv` | Top-three ranked candidates per sampled site |
| `county_data_coverage_audit.csv` | County-level coverage summary |

Exact files depend on which cells complete successfully and whether optional API keys are provided.

### Results ZIP

The final notebook cell creates:

```text
/content/field_shift_5_counties_results.zip
```

By default, this ZIP contains project files and processed outputs but **excludes `.tif` / `.tiff` CDL rasters** to keep the download compact. The raw rasters remain in the Colab runtime under `raw/cdl/`. Set `INCLUDE_CDL_TIFFS_IN_ZIP = True` in that cell only if you explicitly need the raw rasters included.

## 7. Modelling approach present in the notebook

The notebook prepares a multi-input LSTM classifier:

- **Temporal input:** three consecutive years of crop-group one-hot features plus growing-season climate variables.
- **Static input:** selected soil features (`om_r`, `ph1to1h2o_r`, `sandtotal_r`, `silttotal_r`, `claytotal_r`, `awc_r`).
- **Target:** the next year's crop group.
- **Split strategy:** `GroupShuffleSplit` using county groups for a spatial holdout, followed by a site-level validation split.
- **Scaling:** climate and soil scalers are fitted on training data.
- **Evaluation:** accuracy, balanced accuracy, F1, classification report, and confusion matrices.

The notebook also contains exploratory crop-screening logic:

- Soil pH thresholds are taken from the notebook's crop knowledge-base table, which cites Iowa State Extension for several crop groups.
- Rotation scores use explicit heuristics such as corn-soybean alternation and repeated annual crop penalties.
- Hybrid ranking combines LSTM, soil pH, and rotation scores.
- Economic ranking combines LSTM (30%), soil pH (20%), rotation (20%), and economic score (30%), with remaining weights renormalised when economic data is missing.

These are **prototype heuristics and ranking scores**, not validated agronomic recommendations or calibrated yield/profit predictions. Have the agricultural assumptions reviewed by a qualified agronomy specialist and validate against independent data before operational use.

## 8. Data-quality and modelling cautions

- Inspect `county_data_coverage_audit.csv` and the county-level source coverage before modelling.
- Check that all five counties have adequate CDL year coverage and that the sampled histories are continuous.
- Inspect soil match rates and missing soil attributes by county.
- Check which county/crop/year yield records are available; do not interpret missing records as zero yield.
- Review the units and definitions of NASS yield and price series before multiplying them.
- Do not treat AMS statewide market bids as county-specific farm prices.
- Keep county identifiers on records and preserve the spatial holdout design.
- A held-out county can contain crop classes absent from training. The notebook excludes unseen target labels from the corresponding validation/test label transformation; report this limitation when interpreting metrics.
- The pH and crop-rotation scores are screening heuristics. They do not include every factor affecting crop suitability, such as nutrient status, drainage, pests, disease, water access, local management, input costs, or market risk.
- The model's predicted crop class is not a guarantee that a crop is suitable or profitable at a particular field.

## 9. Current next step

The notebook's own final instruction is:

**Do not train the LSTM yet.** First inspect whether all five counties have sufficient annual crop-history coverage, whether soil queries return rows, which crops have county yield records, and how climate and market data align. Then build the modelling table and decide the correct spatial holdout county.

The first files to inspect after a run are:

- `county_data_coverage_audit.csv`
- `cdl_sampled_crop_class_shares.csv`
- `cdl_sampled_pixel_crop_history.csv`
- `cdl_sampled_crop_sequences_wide.csv`
- `ssurgo_horizons_components_all_counties.csv`
- `nasa_power_daily_all_counties.csv`
- `nass_county_crop_yields.csv` (if NASS key was used)
- `ams_iowa_cash_grain_bids.csv` (if AMS key was used)

---

## 10. Credits and source documentation

The notebook accesses data services operated by or associated with:

- NASA Langley Research Center — POWER Project.
- USDA National Agricultural Statistics Service — Cropland Data Layer and Quick Stats.
- USDA Natural Resources Conservation Service — Soil Data Access / SSURGO.
- USDA Agricultural Marketing Service — Market News / MyMarketNews API.
- Iowa State University Extension — cited pH reference values in the notebook's preliminary crop knowledge base.

Review each provider's current terms, attribution requirements, data-use conditions, and API documentation before redistributing data or deploying a public-facing application.

---

## Disclaimer

This notebook is a research and prototype data-engineering workflow for a hackathon project. It is not a certified agronomic decision system, does not guarantee data completeness or model performance, and should not be used as the sole basis for agricultural, financial, or operational decisions.
