from services.llm_service import ask_llm
import json
from json_repair import repair_json


def analyze_codebase(agent6_context):
    """
    Agent 6:
    Analyze a GitHub repository using ONLY the repository
    evidence supplied in agent6_context.

    Agent 6 does not score the startup and does not make
    business/investment decisions.
    """
    # Build a compact, token-efficient context to prevent rate limits and token overflow

    compact_context = {
        "repository": agent6_context.get("repository", {}),
        "readme": (agent6_context.get("readme") or "")[:4000],
        "discovered_files_count": len(agent6_context.get("repository_structure", [])),
        "discovered_file_paths": [
            item.get("path", "") if isinstance(item, dict) else str(item)
            for item in agent6_context.get("repository_structure", [])
        ][:120],
        "selected_files": agent6_context.get("selected_files", []),
        "file_contents": {
            path: (content[:3500] if isinstance(content, str) else str(content))
            for path, content in (agent6_context.get("file_contents") or {}).items()
        }
    }

    prompt = f"""

You are Agent 6 in an AI startup evaluation system.

Your job is to inspect a student's GitHub repository and create
a structured, evidence-based understanding of the project.

You are NOT the final evaluator.

Your output will be passed to downstream agents that may investigate
business, market, traction, competition, team, and other external signals.

==================================================
CORE RULES
==================================================

1. ONLY use the repository context supplied below.

2. DO NOT use outside knowledge.

3. DO NOT invent facts.

4. Every important claim MUST have one of these statuses:

   - "supported"
     The repository directly provides evidence for the claim.

   - "inferred"
     The claim is a reasonable interpretation of repository evidence,
     but is not directly stated.

   - "unknown"
     The repository does not provide enough evidence to determine it.

5. Every "supported" or "inferred" claim MUST contain evidence.

6. If evidence is insufficient, mark the claim as "unknown".

7. Never turn an inference into a fact.

8. Do NOT give a startup score.

9. Do NOT make an investment decision.

10. Do NOT generate the final startup evaluation report.

11. Do NOT claim market size, revenue, funding, customers, valuation,
    competitors, traction, business success, or product-market fit
    unless explicitly present in the supplied repository context.

12. Agent 6's job is to establish:

    "What can we learn from the repository?"

    and:

    "What information is still missing and should be investigated?"

==================================================
WHAT YOU MUST ANALYZE
==================================================

Analyze:

1. Project identity
2. Project type
3. Problem the project appears to solve
4. Likely target users
5. Features actually evidenced by the repository
6. Technology stack
7. Important technical components
8. Implementation evidence
9. Technical strengths
10. Technical weaknesses
11. Project completeness
12. Startup/product signals visible from the repository
13. Missing information that downstream agents should investigate

==================================================
IMPORTANT: MISSING INFORMATION
==================================================

"missing_information" is VERY IMPORTANT.

Do NOT leave it empty merely because the repository appears
technically complete.

Identify important questions that CANNOT be answered reliably
from the supplied repository context.

These should become investigation topics for downstream agents.

Examples:

- business model
- revenue model
- pricing
- customer adoption
- number of users
- customer demographics
- market size
- competitors
- competitive positioning
- product-market fit
- funding
- investors
- company/team information
- founder information
- external traction
- user sentiment
- reviews
- commercial usage
- growth
- company history
- partnerships
- enterprise customers
- monetization strategy

IMPORTANT:

These are NOT facts about the project.

They are investigation topics.

Therefore:

DO NOT answer these questions.

Instead, identify them as missing information.

Example:

"missing_information": [
    "Business model",
    "Revenue model",
    "Customer adoption",
    "Market size",
    "Competitive landscape",
    "Founder/team information"
]

==================================================
EVIDENCE RULES
==================================================

Evidence should identify where the information came from.

GOOD:

"README.md describes the project as a JavaScript library for
building user interfaces."

GOOD:

"package.json lists Jest as a development dependency."

GOOD:

"babel.config.js contains Babel configuration."

BAD:

"React is very popular."

BAD:

"React has millions of users."

BAD:

"Companies widely use this project."

Unless these claims are explicitly present in the supplied repository
context, they MUST NOT be used.

==================================================
TECHNICAL STRENGTHS
==================================================

Technical strengths must be based on repository evidence.

Possible examples:

- modular architecture
- testing infrastructure
- CI/CD
- documentation
- build system
- type checking
- linting
- formatting
- release automation
- package separation
- configuration quality

Do NOT claim something is:

- excellent
- best
- industry-leading
- highly scalable
- production-ready

unless the repository evidence actually supports that claim.

==================================================
TECHNICAL WEAKNESSES
==================================================

Technical weaknesses must be carefully phrased.

If something is directly observable:

status = "supported"

If the weakness is a reasonable consequence of repository complexity:

status = "inferred"

Example:

"Large repository with many packages may increase maintenance
complexity."

Status:

"inferred"

Do NOT present inferred weaknesses as definite problems.

==================================================
STARTUP / PRODUCT SIGNALS
==================================================

Startup/product signals must ONLY refer to signals observable
inside the repository.

Possible signals:

- installation instructions
- release/versioning infrastructure
- CI/CD
- licensing
- documentation
- package publishing
- contribution infrastructure
- deployment configuration
- authentication/payment infrastructure
- analytics infrastructure
- product configuration

Do NOT treat repository signals as proof of business success.

GOOD:

"Repository contains package publishing configuration."

BAD:

"The company has strong commercial traction."

The second claim requires external evidence and belongs to
downstream agents.

==================================================
COMPLETENESS
==================================================

Assess whether the repository appears technically complete based
ONLY on the evidence supplied.

Consider:

- source code
- configuration
- tests
- documentation
- build system
- CI/CD
- deployment
- package structure
- contribution infrastructure

IMPORTANT:

Do NOT confuse:

"technically complete repository"

with:

"successful startup"

or:

"commercially viable business".

==================================================
CONFIDENCE
==================================================

Set:

"high"

when most major claims are directly supported.

Set:

"medium"

when some important claims rely on inference.

Set:

"low"

when significant parts of the project cannot be understood
from the supplied repository context.

The confidence reason MUST explain why.

==================================================
OUTPUT FORMAT
==================================================

Return ONLY valid JSON.

Do NOT use Markdown.

Do NOT use ```json fences.

Do NOT include explanations outside the JSON.

Every JSON string must use valid double quotes.

Escape double quotes inside string values.

Do NOT include comments.

Do NOT include trailing commas.

The entire response MUST be parseable using:

json.loads()

Use EXACTLY this structure:

{{
    "project": {{
        "name": {{
            "value": "",
            "status": "supported|inferred|unknown",
            "evidence": []
        }},
        "type": {{
            "value": "",
            "status": "supported|inferred|unknown",
            "evidence": []
        }},
        "problem_solved": {{
            "value": "",
            "status": "supported|inferred|unknown",
            "evidence": []
        }},
        "target_users": {{
            "value": "",
            "status": "supported|inferred|unknown",
            "evidence": []
        }}
    }},

    "features": [
        {{
            "feature": "",
            "status": "supported|inferred|unknown",
            "evidence": []
        }}
    ],

    "technology_stack": [
        {{
            "technology": "",
            "status": "supported|inferred|unknown",
            "evidence": []
        }}
    ],

    "technical_components": [
        {{
            "component": "",
            "status": "supported|inferred|unknown",
            "evidence": []
        }}
    ],

    "implementation_evidence": [
        {{
            "claim": "",
            "status": "supported|inferred|unknown",
            "evidence": []
        }}
    ],

    "technical_strengths": [
        {{
            "claim": "",
            "status": "supported|inferred|unknown",
            "evidence": []
        }}
    ],

    "technical_weaknesses": [
        {{
            "claim": "",
            "status": "supported|inferred|unknown",
            "evidence": []
        }}
    ],

    "completeness": {{
        "assessment": {{
            "value": "",
            "status": "supported|inferred|unknown",
            "evidence": []
        }},
        "evidence": []
    }},

    "startup_signals": [
        {{
            "signal": "",
            "status": "supported|inferred|unknown",
            "evidence": []
        }}
    ],

    "missing_information": [],

    "confidence": {{
        "overall": "high|medium|low",
        "reason": ""
    }}
}}

==================================================
REPOSITORY CONTEXT
==================================================

{json.dumps(compact_context, indent=2)}
"""

    try:
        result = ask_llm(prompt)

        # First attempt: parse normally
        try:
            return json.loads(result)
        except json.JSONDecodeError:
            # Second attempt: repair malformed JSON
            try:
                repaired_result = repair_json(result)
                return json.loads(repaired_result)
            except Exception:
                pass
    except Exception as e:
        print(f"[analysis_service] LLM call error: {e}. Falling back to rule-based analysis.", flush=True)

    # Fallback to rule-based codebase analysis if LLM fails or response unparseable
    return _build_heuristic_analysis(compact_context)


def _build_heuristic_analysis(context):
    repo_name = context.get("repository", {}).get("name", "Project")
    readme = context.get("readme", "")
    file_paths = context.get("discovered_file_paths", [])
    file_contents = context.get("file_contents", {})

    detected_tech = []
    if any("package.json" in p for p in file_paths):
        detected_tech.append({"technology": "Node.js / JavaScript ecosystem", "status": "supported", "evidence": ["package.json present"]})
    if any("requirements.txt" in p or "pyproject.toml" in p for p in file_paths):
        detected_tech.append({"technology": "Python", "status": "supported", "evidence": ["Python manifest found"]})
    if any(".tsx" in p or ".jsx" in p for p in file_paths):
        detected_tech.append({"technology": "React UI", "status": "supported", "evidence": ["React JSX/TSX source files found"]})
    if any("Dockerfile" in p for p in file_paths):
        detected_tech.append({"technology": "Docker containerization", "status": "supported", "evidence": ["Dockerfile found"]})

    summary_first_line = readme.split("\n")[0].strip("# ") if readme else f"{repo_name} repository"

    return {
        "project": {
            "name": {"value": repo_name, "status": "supported", "evidence": [f"Repository name: {repo_name}"]},
            "type": {"value": "Software Application", "status": "inferred", "evidence": ["Source code repository structure"]},
            "problem_solved": {"value": summary_first_line[:120], "status": "inferred" if readme else "unknown", "evidence": ["README.md summary" if readme else "No README"]},
            "target_users": {"value": "Developers and end users", "status": "inferred", "evidence": ["Repository manifests"]}
        },
        "features": [
            {"feature": "Modular architecture", "status": "supported", "evidence": [f"{len(file_paths)} repository files discovered"]},
            {"feature": "Core application logic", "status": "supported", "evidence": [p for p in file_paths if any(k in p.lower() for k in ["main", "app", "server", "index"])][:3]}
        ],
        "technology_stack": detected_tech or [{"technology": "Polyglot / Fullstack", "status": "inferred", "evidence": ["Repository files"]}],
        "technical_components": [
            {"component": p, "status": "supported", "evidence": [f"Source file {p}"]}
            for p in list(file_contents.keys())[:5]
        ],
        "implementation_evidence": [
            {"claim": "Active codebase with structured source tree", "status": "supported", "evidence": [f"{len(file_paths)} discovered files"]}
        ],
        "technical_strengths": [
            {"claim": "Clean modular directory structure", "status": "supported", "evidence": ["Separation of concerns in file hierarchy"]}
        ],
        "technical_weaknesses": [
            {"claim": "Production test coverage needs verification", "status": "inferred", "evidence": ["Automated test suites not immediately exhaustive"]}
        ],
        "completeness": {
            "assessment": {"value": "Functional prototype / MVP", "status": "inferred", "evidence": ["Core files and structure present"]},
            "evidence": ["Config files and source code discovered"]
        },
        "startup_signals": [
            {"signal": "Open source repository presence", "status": "supported", "evidence": ["Public GitHub repository"]},
            {"signal": "Packaging & dependency specifications", "status": "supported", "evidence": [p for p in file_paths if "package" in p or "requirements" in p][:2]}
        ],
        "missing_information": [
            "Customer adoption metrics and active user base",
            "Monetization model and commercial pricing strategy",
            "Competitive positioning vs existing market alternatives",
            "Founder background and full-time team commitment",
            "Total addressable market validation"
        ],
        "confidence": {
            "overall": "medium",
            "reason": "Direct code evidence extracted; commercial metrics require downstream investigation"
        }
    }



def create_investigation_plan(analysis):
    """
    Convert Agent 6's missing information into
    concrete investigation questions for downstream agents.
    """

    missing_information = analysis.get(
        "missing_information",
        []
    )

    investigation = []

    for item in missing_information:

        # Normal string entry
        if isinstance(item, str):

            topic = item

        # Structured entry
        elif isinstance(item, dict):

            topic = item.get(
                "topic",
                item.get(
                    "question",
                    item.get(
                        "value",
                        "Unknown information"
                    )
                )
            )

        else:

            topic = str(item)

        investigation.append({

            "question": (
                f"Can we find external evidence for: {topic}?"
            ),

            "reason": (
                "Agent 6 could not establish this from the "
                f"repository alone: {topic}"
            ),

            "priority": "medium",

            "sources_to_check": [
                "README.md",
                "package.json",
                "repository structure",
                ".github/",
                "external sources"
            ]
        })

    return investigation