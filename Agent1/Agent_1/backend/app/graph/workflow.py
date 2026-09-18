from langgraph.graph import (
    StateGraph,
    START,
    END
)

from app.graph.state import AgentState

from app.graph.nodes import (
    parse_document_node,
    extract_startup_data_node,
    validate_output_node,
    retry_extraction_node,
    finalize_node,
    finalize_non_startup_node,
    MAX_RETRIES
)


def validation_router(
    state: AgentState
):
    """
    Decide what happens after validation.
    """

    status = state.get(
        "status"
    )

    validation_errors = state.get(
        "validation_errors",
        []
    )

    retry_count = state.get(
        "retry_count",
        0
    )

    # ---------------------------------
    # Correctly classified as non-startup
    # ---------------------------------

    if status == "not_startup_document":

        return "not_startup"

    # ---------------------------------
    # Valid startup result
    # ---------------------------------

    if not validation_errors:

        return "finalize"

    # ---------------------------------
    # Invalid result but retries remain
    # ---------------------------------

    if retry_count < MAX_RETRIES:

        return "retry"

    # ---------------------------------
    # Maximum retries reached
    # ---------------------------------

    return "finalize"


def create_agent1_graph():

    graph = StateGraph(
        AgentState
    )

    # ---------------------------------
    # Nodes
    # ---------------------------------

    graph.add_node(
        "parse_document",
        parse_document_node
    )

    graph.add_node(
        "extract_startup_data",
        extract_startup_data_node
    )

    graph.add_node(
        "validate_output",
        validate_output_node
    )

    graph.add_node(
        "retry_extraction",
        retry_extraction_node
    )

    graph.add_node(
        "finalize",
        finalize_node
    )

    graph.add_node(
        "finalize_non_startup",
        finalize_non_startup_node
    )

    # ---------------------------------
    # START
    # ---------------------------------

    graph.add_edge(
        START,
        "parse_document"
    )

    # ---------------------------------
    # Parse -> Extract
    # ---------------------------------

    graph.add_edge(
        "parse_document",
        "extract_startup_data"
    )

    # ---------------------------------
    # Extract -> Validate
    # ---------------------------------

    graph.add_edge(
        "extract_startup_data",
        "validate_output"
    )

    # ---------------------------------
    # Conditional routing
    # ---------------------------------

    graph.add_conditional_edges(
        "validate_output",
        validation_router,
        {
            "finalize":
                "finalize",

            "retry":
                "retry_extraction",

            "not_startup":
                "finalize_non_startup"
        }
    )

    # ---------------------------------
    # Retry -> Validate
    # ---------------------------------

    graph.add_edge(
        "retry_extraction",
        "validate_output"
    )

    # ---------------------------------
    # Final states
    # ---------------------------------

    graph.add_edge(
        "finalize",
        END
    )

    graph.add_edge(
        "finalize_non_startup",
        END
    )

    return graph.compile()


agent1_graph = create_agent1_graph()