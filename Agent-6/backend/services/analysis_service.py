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

{json.dumps(agent6_context, indent=2)}
"""

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

            return {
                "error": "Agent 6 returned invalid JSON",
                "raw_response": result
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