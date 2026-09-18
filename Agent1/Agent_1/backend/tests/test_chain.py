from app.chains.document_extraction import (
    get_document_extraction_chain
)


chain = get_document_extraction_chain()

sample_text = """
Acme AI is a B2B SaaS startup building an AI-powered
customer support platform.

The company was founded by Aman Sharma, CEO.

The startup currently has $1.2M ARR and 120 customers.

It has raised $2M in seed funding.

Its target customers are mid-sized SaaS companies.

The company claims a TAM of $10 billion.
"""

result = chain.invoke(
    {
        "document_text": sample_text
    }
)

print(result)
print()
print(result.model_dump())