from app.schemas.startup_analysis import StartupAnalysis


def test_startup_schema():
    sample = StartupAnalysis(
        startup_name="Demo Startup",
        industry="AI"
    )

    print(sample.model_dump())