from langgraph.graph import StateGraph, START, END

from app.graph.state import AgentState

from app.graph.multi_nodes import (
    parse_multiple_documents_node,
    analyze_multiple_documents_node,
    merge_document_analyses_node,
)


def create_multi_document_graph():
    graph = StateGraph(AgentState)

    # Register nodes
    graph.add_node(
        "parse_documents",
        parse_multiple_documents_node
    )

    graph.add_node(
        "analyze_documents",
        analyze_multiple_documents_node
    )

    graph.add_node(
        "merge_analyses",
        merge_document_analyses_node
    )

    # Workflow
    graph.add_edge(
        START,
        "parse_documents"
    )

    def route_after_parse(state: AgentState):
        if state.get("status") == "parse_failed" or not state.get("documents"):
            return END
        return "analyze_documents"

    def route_after_analyze(state: AgentState):
        if state.get("status") == "analysis_failed" or not state.get("document_analyses"):
            return END
        return "merge_analyses"

    graph.add_conditional_edges(
        "parse_documents",
        route_after_parse,
        {
            "analyze_documents": "analyze_documents",
            END: END
        }
    )

    graph.add_conditional_edges(
        "analyze_documents",
        route_after_analyze,
        {
            "merge_analyses": "merge_analyses",
            END: END
        }
    )

    graph.add_edge(
        "merge_analyses",
        END
    )

    return graph.compile()


multi_document_graph = create_multi_document_graph()