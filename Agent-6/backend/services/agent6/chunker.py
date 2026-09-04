def chunk_text(
    text: str,
    max_chars: int = 12000,
    overlap: int = 500,
):
    """
    Split source code into manageable chunks.

    Each chunk keeps a small overlap with the previous chunk
    so that important context is not abruptly lost at boundaries.
    """

    if not text:
        return []

    if max_chars <= 0:
        raise ValueError("max_chars must be greater than 0")

    if overlap < 0:
        raise ValueError("overlap cannot be negative")

    if overlap >= max_chars:
        raise ValueError(
            "overlap must be smaller than max_chars"
        )

    chunks = []

    start = 0
    text_length = len(text)

    while start < text_length:

        end = min(
            start + max_chars,
            text_length
        )

        chunk = text[start:end]

        chunks.append(chunk)

        if end >= text_length:
            break

        start = end - overlap

    return chunks


def chunk_file(
    file_path: str,
    content: str,
    max_chars: int = 12000,
    overlap: int = 500,
):
    """
    Chunk one repository file while preserving its identity.
    """

    chunks = chunk_text(
        content,
        max_chars=max_chars,
        overlap=overlap,
    )

    result = []

    total_chunks = len(chunks)

    for index, chunk in enumerate(chunks):

        result.append({
            "file_path": file_path,
            "chunk_index": index,
            "total_chunks": total_chunks,
            "content": chunk,
        })

    return result