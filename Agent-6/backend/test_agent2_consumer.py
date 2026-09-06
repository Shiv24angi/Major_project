"""
Demonstration / Test Script for Agent 2 Handoff Consumption

This script shows how Agent 2 (Data Extraction & Normalization) can read and
consume the technical evaluation findings stored by Agent 6.

Two modes are supported:
1. Direct Python Module Access (via Agent6Storage)
2. HTTP REST API Access (via GET /agent6/github/handoff/latest)
"""

import sys
import os
import json

# Force UTF-8 on Windows terminal output if supported
if sys.platform.startswith("win"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Ensure services are in python path
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

from services.agent6.storage import storage


def test_agent2_direct_access():
    print("\n" + "=" * 60)
    print("🤖 AGENT 2 CONSUMER SIMULATION: Direct Storage Access")
    print("=" * 60)

    # 1. Fetch latest stored Agent 6 output
    latest_payload = storage.get_latest()

    if not latest_payload:
        print("\n⚠️  No stored Agent 6 output found in storage directory.")
        print("💡 Generating a sample Agent 6 payload to verify storage bridge...")

        # Create a sample payload for testing if empty
        save_result = storage.save_agent6_output(
            repository={"owner": "Shiv24angi", "name": "EcoVerse"},
            findings=[
                {
                    "category": "technology",
                    "claim": "Next.js & TypeScript full-stack framework",
                    "status": "supported",
                    "evidence": ["package.json", "tsconfig.json"]
                },
                {
                    "category": "technical",
                    "claim": "Decentralized carbon credit verification engine with smart contracts",
                    "status": "supported",
                    "evidence": ["contracts/CarbonCredit.sol", "lib/web3.ts"]
                },
                {
                    "category": "feature",
                    "claim": "Real-time ecological impact telemetry dashboard",
                    "status": "inferred",
                    "evidence": ["src/components/TelemetryView.tsx"]
                },
                {
                    "category": "problem",
                    "claim": "Monetization and enterprise B2B licensing model",
                    "status": "unknown",
                    "evidence": []
                }
            ],
            analysis_metadata={
                "files_discovered": 128,
                "files_selected": 15,
                "files_read": 15,
                "chunks_created": 32
            },
            github_url="https://github.com/Shiv24angi/EcoVerse"
        )
        latest_payload = save_result["payload"]

    # 2. Agent 2 validates and unpacks Agent 6's data
    print(f"\n✅ Successfully Loaded Payload from: {latest_payload.get('run_id')}")
    print(f"Timestamp: {latest_payload.get('timestamp')}")
    print(f"Source Agent: {latest_payload.get('source_agent')}")
    print(f"Repository: {latest_payload.get('repository', {}).get('full_name')}")

    summary = latest_payload.get("findings_summary", {})
    print(f"\n📊 Findings Summary:")
    print(f" - Total Findings:    {summary.get('total_findings', 0)}")
    print(f" - Supported Claims:  {summary.get('supported_count', 0)} (Verified in Code)")
    print(f" - Inferred Claims:   {summary.get('inferred_count', 0)}")
    print(f" - Unknown/Missing:   {summary.get('unknown_count', 0)}")

    findings = latest_payload.get("findings", [])
    print(f"\n🔍 Agent 2 Normalization Ingestion Sample (First 3 Findings):")
    for i, finding in enumerate(findings[:3], 1):
        print(f" [{i}] [{finding.get('category').upper()}] {finding.get('claim')}")
        print(f"     Status:   {finding.get('status').upper()}")
        print(f"     Evidence: {', '.join(finding.get('evidence', [])) or 'None'}")

    # 3. Agent 2 normalization bridge preview
    normalized_tech_profile = {
        "repo": latest_payload.get("repository", {}).get("full_name"),
        "tech_maturity_score_input": 85 if summary.get("supported_count", 0) >= 2 else 60,
        "verified_features": [f["claim"] for f in findings if f.get("status") == "supported"],
        "investigation_flags": [f["claim"] for f in findings if f.get("status") == "unknown"],
        "agent6_verified": True
    }

    print("\n📦 Agent 2 Normalized Tech Profile Preview:")
    print(json.dumps(normalized_tech_profile, indent=2))
    print("\n🎯 Agent 2 successfully consumed Agent 6 output!")


def list_available_runs():
    print("\n" + "=" * 60)
    print("📁 AGENT 6 AVAILABLE RUNS INDEX")
    print("=" * 60)
    runs = storage.list_runs()
    print(f"Found {len(runs)} recorded evaluation runs:")
    for r in runs:
        print(f" - Run ID: {r.get('run_id')} | Repo: {r.get('owner')}/{r.get('repository')} | Time: {r.get('timestamp')}")


if __name__ == "__main__":
    test_agent2_direct_access()
    list_available_runs()
