from langgraph.graph import StateGraph, START, END

from services.agent6.state import Agent6State

from services.agent6.nodes import (
    load_repository,
    discover_files,
    select_files,
    read_files,
    chunk_files,
    analyze_repository,
    validate_evidence,
)

# ============================================================
# BUILD AGENT 6 GRAPH
# ============================================================

builder = StateGraph(Agent6State)


# ============================================================
# ADD NODES
# ============================================================

builder.add_node(
    "load_repository",
    load_repository
)

builder.add_node(
    "discover_files",
    discover_files
)

builder.add_node(
    "select_files",
    select_files
)

builder.add_node(
    "read_files",
    read_files
)

builder.add_node(
    "chunk_files",
    chunk_files
)

builder.add_node(
    "analyze_repository",
    analyze_repository
)

builder.add_node(
    "validate_evidence",
    validate_evidence
)

# ============================================================
# CONNECT NODES
# ============================================================

builder.add_edge(
    START,
    "load_repository"
)

builder.add_edge(
    "load_repository",
    "discover_files"
)

builder.add_edge(
    "discover_files",
    "select_files"
)

builder.add_edge(
    "select_files",
    "read_files"
)

builder.add_edge(
    "read_files",
    "chunk_files"
)

builder.add_edge(
    "chunk_files",
    "analyze_repository"
)

builder.add_edge(
    "analyze_repository",
    "validate_evidence"
)

builder.add_edge(
    "validate_evidence",
    END
)


# ============================================================
# COMPILE GRAPH
# ============================================================

agent6_graph = builder.compile()